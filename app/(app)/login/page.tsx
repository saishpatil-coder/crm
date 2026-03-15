"use client";

import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/appClient";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

// Updated Dictionary
const dict = {
  en: {
    welcome: "Welcome to the Campaign",
    subtitle: "Enter your mobile number to continue",
    welcomeBack: "Welcome Back",
    setPasswordTitle: "Create Your Password",
    setPasswordSubtitle: "Set a new password for your account",
    phoneLabel: "Mobile Number",
    phonePlaceholder: "10-digit mobile number",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter your password",
    confirmLabel: "Confirm Password",
    confirmPlaceholder: "Re-enter your password",
    next: "Next",
    login: "Login",
    setAndLogin: "Set Password & Login",
    show: "Show",
    hide: "Hide",
    mismatchError: "Passwords do not match.",
    genericError: "Something went wrong. Please try again.",
    back: "Back to Number",
  },
  mr: {
    welcome: "मोहिमेत आपले स्वागत आहे",
    subtitle: "पुढे जाण्यासाठी तुमचा मोबाईल क्रमांक टाका",
    welcomeBack: "पुन्हा स्वागत आहे",
    setPasswordTitle: "तुमचा पासवर्ड तयार करा",
    setPasswordSubtitle: "तुमच्या खात्यासाठी नवीन पासवर्ड सेट करा",
    phoneLabel: "मोबाईल क्रमांक",
    phonePlaceholder: "१०-अंकी मोबाईल क्रमांक",
    passwordLabel: "पासवर्ड",
    passwordPlaceholder: "तुमचा पासवर्ड टाका",
    confirmLabel: "पासवर्डची पुष्टी करा",
    confirmPlaceholder: "तुमचा पासवर्ड पुन्हा टाका",
    next: "पुढे",
    login: "लॉग इन करा",
    setAndLogin: "पासवर्ड सेट करा आणि लॉग इन करा",
    show: "दाखवा",
    hide: "लपवा",
    mismatchError: "पासवर्ड जुळत नाहीत.",
    genericError: "काहीतरी चूक झाली. कृपया पुन्हा प्रयत्न करा.",
    back: "नंबरवर परत जा",
  },
  hi: {
    welcome: "अभियान में आपका स्वागत है",
    subtitle: "आगे बढ़ने के लिए अपना मोबाइल नंबर दर्ज करें",
    welcomeBack: "वापसी पर स्वागत है",
    setPasswordTitle: "अपना पासवर्ड बनाएं",
    setPasswordSubtitle: "अपने खाते के लिए नया पासवर्ड सेट करें",
    phoneLabel: "मोबाइल नंबर",
    phonePlaceholder: "10-अंकों का मोबाइल नंबर",
    passwordLabel: "पासवर्ड",
    passwordPlaceholder: "अपना पासवर्ड दर्ज करें",
    confirmLabel: "पासवर्ड की पुष्टि करें",
    confirmPlaceholder: "अपना पासवर्ड फिर से दर्ज करें",
    next: "आगे",
    login: "लॉग इन करें",
    setAndLogin: "पासवर्ड सेट करें और लॉग इन करें",
    show: "दिखाएं",
    hide: "छिपाएं",
    mismatchError: "पासवर्ड मेल नहीं खाते।",
    genericError: "कुछ गलत हो गया। कृपया पुन: प्रयास करें।",
    back: "नंबर पर वापस जाएं",
  },
} as const;

type Language = keyof typeof dict;

function MobileLoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Renamed context loading to isAuthLoading to avoid confusion
  const { login, user, logout, isLoading: isAuthLoading } = useAuth();

  // State
  const [lang, setLang] = useState<Language>("mr");
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Flow States
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Local submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const t = dict[lang];

  // --- SINGLE UNIFIED REDIRECT EFFECT ---
  useEffect(() => {
    if (isAuthLoading) return; // Do nothing while context is initializing

    const errorType = searchParams.get("error");
    if (errorType === "session_expired") {
      logout();
      // Remove the query param so we don't infinitely loop
      router.replace("/login");
      return;
    }

    if (user) {
      if (user.role === "WORKER") router.push("/mobile");
      else if (user.role === "SUB_ADMIN") router.push("/dashboard");
      else if (user.role === "MASTER_ADMIN") router.push("/admin");
    }
  }, [user, isAuthLoading, router, searchParams, logout]);

  // STEP 1: Check if user exists
  const handleCheckUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return;

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const response = await apiClient.post("/auth/check-user", { phone });

      if (!response.data.exists) {
        throw new Error("Account not found. Contact your manager.");
      }

      setIsSettingPassword(!response.data.hasPassword);
      setStep(2);
    } catch (error: any) {
      setErrorMsg(
        error.response?.data?.error || error.message || t.genericError,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // STEP 2: Either Login OR Set Password & Login
  const handleSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length === 0) return;

    if (isSettingPassword && password !== confirmPassword) {
      setErrorMsg(t.mismatchError);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const endpoint = isSettingPassword ? "/auth/set-password" : "/auth/login";
      const response = await apiClient.post(endpoint, {
        mobileNumber: phone,
        password,
      });

      const { token, user: responseUser } = response.data;

      const userData = {
        id: responseUser.id,
        mobileNumber: responseUser.mobileNumber,
        role: responseUser.role?.name,
        tenantId: responseUser.tenantId,
        name: responseUser.name,
      };

      login(token, userData);
      // Wait for the AuthContext effect to catch the user and route them
    } catch (error: any) {
      setErrorMsg(error.response?.data?.error || t.genericError);
      setIsSubmitting(false);
    }
  };

  // Show a clean loading state while AuthContext checks local storage
  if (isAuthLoading) {
    return (
      <div className="min-h-dvh bg-gray-50 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-gray-500 font-bold text-sm">
          Verifying session...
        </div>
      </div>
    );
  }

  // If we have a user and we are NOT loading, return nothing because the useEffect will push them away
  if (user) return null;

  return (
    // Replaced min-h-screen with min-h-[100dvh] for better mobile browser support
    <div className="min-h-dvh bg-gray-50 flex flex-col px-6 py-8 md:hidden">
      {/* Language Selector */}
      <div className="flex justify-end mb-8 shrink-0">
        <select
          className="bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-lg text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={lang}
          onChange={(e) => {
            setLang(e.target.value as Language);
            setErrorMsg("");
          }}
        >
          <option value="mr">मराठी</option>
          <option value="hi">हिंदी</option>
          <option value="en">English</option>
        </select>
      </div>

      <div className="flex-1 flex flex-col justify-center mb-10">
        <h1 className="text-2xl font-black text-gray-900 mb-2">
          {step === 1
            ? t.welcome
            : isSettingPassword
              ? t.setPasswordTitle
              : t.welcomeBack}
        </h1>
        <p className="text-sm font-bold text-gray-500 mb-6">
          {step === 1
            ? t.subtitle
            : isSettingPassword
              ? t.setPasswordSubtitle
              : `+91 ${phone}`}
        </p>

        {errorMsg && (
          <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-bold rounded shadow-sm">
            {errorMsg}
          </div>
        )}

        {/* --- STEP 1 FORM: Ask for Number --- */}
        {step === 1 && (
          <form onSubmit={handleCheckUser} className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">
                {t.phoneLabel}
              </label>
              <div className="flex shadow-sm rounded-xl overflow-hidden border-2 border-gray-200 focus-within:border-blue-500 transition-colors bg-white">
                <span className="flex items-center justify-center bg-gray-50 px-4 text-gray-600 font-black border-r-2 border-gray-200">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  className="w-full h-14 px-4 text-lg font-bold text-gray-900 focus:outline-none bg-transparent"
                  placeholder={t.phonePlaceholder}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={phone.length < 10 || isSubmitting}
              className="mt-2 w-full h-14 bg-blue-600 text-white text-lg font-black rounded-xl shadow-md disabled:bg-blue-300 active:scale-[0.98] transition-all flex items-center justify-center"
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                t.next
              )}
            </button>
          </form>
        )}

        {/* --- STEP 2 FORM: Password Entry or Creation --- */}
        {step === 2 && (
          <form onSubmit={handleSubmitAction} className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">
                {isSettingPassword ? t.setPasswordTitle : t.passwordLabel}
              </label>
              <div className="relative shadow-sm rounded-xl border-2 border-gray-200 focus-within:border-blue-500 transition-colors bg-white">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  // Removed autoFocus to prevent aggressive mobile keyboard popups
                  className="w-full h-14 pl-4 pr-20 text-lg font-bold text-gray-900 focus:outline-none bg-transparent rounded-xl"
                  placeholder={t.passwordPlaceholder}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg("");
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-black uppercase tracking-wider text-blue-600 bg-blue-50 rounded-md active:bg-blue-100"
                >
                  {showPassword ? t.hide : t.show}
                </button>
              </div>
            </div>

            {/* Extra Confirm Field ONLY if setting password */}
            {isSettingPassword && (
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 mt-2 pl-1">
                  {t.confirmLabel}
                </label>
                <div className="relative shadow-sm rounded-xl border-2 border-gray-200 focus-within:border-blue-500 transition-colors bg-white">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full h-14 pl-4 pr-10 text-lg font-bold text-gray-900 focus:outline-none bg-transparent rounded-xl"
                    placeholder={t.confirmPlaceholder}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrorMsg("");
                    }}
                  />
                  {/* Visual match indicator */}
                  {confirmPassword.length > 0 && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg">
                      {password === confirmPassword ? "✅" : "❌"}
                    </span>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={
                password.length === 0 ||
                (isSettingPassword && confirmPassword.length === 0) ||
                isSubmitting
              }
              className="mt-2 w-full h-14 bg-blue-600 text-white text-lg font-black rounded-xl shadow-md disabled:bg-blue-300 active:scale-[0.98] transition-all flex items-center justify-center"
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : isSettingPassword ? (
                t.setAndLogin
              ) : (
                t.login
              )}
            </button>

            {/* Back button */}
            <div className="flex justify-center mt-2">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setPassword("");
                  setConfirmPassword("");
                  setErrorMsg("");
                }}
                className="text-xs font-black uppercase tracking-widest text-gray-400 active:text-gray-800 py-2 px-4"
              >
                {t.back}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function MobileLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-gray-50 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <MobileLoginContent />
    </Suspense>
  );
}