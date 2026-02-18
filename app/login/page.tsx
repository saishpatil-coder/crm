'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../lib/appClient';

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
    back: "Back to Number"
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
    back: "नंबरवर परत जा"
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
    back: "नंबर पर वापस जाएं"
  }
};

type Language = 'en' | 'mr' | 'hi';

export default function MobileLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  
  // State
  const [lang, setLang] = useState<Language>('mr');
  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // New States for the Flow
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const t = dict[lang];

  // STEP 1: Check if user exists and if they need a password
  const handleCheckUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return;
    
    setIsLoading(true);
    setErrorMsg('');

    try {
      // You will need to create this backend endpoint!
      const response = await apiClient.post('/auth/check-user', { phone });
      
      // Assume backend returns: { exists: true, hasPassword: false }
      if (!response.data.exists) {
        throw new Error("Account not found. Contact your manager.");
      }

      setIsSettingPassword(!response.data.hasPassword);
      setStep(2);
    } catch (error: any) {
      setErrorMsg(error.response?.data?.error || error.message || t.genericError);
    } finally {
      setIsLoading(false);
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

    setIsLoading(true);
    setErrorMsg('');

    try {
      const endpoint = isSettingPassword ? '/auth/set-password' : '/auth/login';
      const response = await apiClient.post(endpoint, {mobileNumber : phone, password });
      
      const { token, user } = response.data;
      console.log(token,user)
      login(token, user);
      
      router.push('/dashboard');
    } catch (error: any) {
      setErrorMsg(error.response?.data?.error || t.genericError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col px-6 py-8 md:hidden">
      
      <div className="flex justify-end mb-8">
        <select 
          className="bg-white border border-gray-300 text-gray-700 py-2 px-3 rounded-md text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={lang}
          onChange={(e) => {
            setLang(e.target.value as Language);
            setErrorMsg(''); 
          }}
        >
          <option value="mr">मराठी</option>
          <option value="hi">हिंदी</option>
          <option value="en">English</option>
        </select>
      </div>

      <div className="flex-1 flex flex-col justify-center mb-20">
        
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">
          {step === 1 ? t.welcome : (isSettingPassword ? t.setPasswordTitle : t.welcomeBack)}
        </h1>
        <p className="text-gray-600 mb-6">
          {step === 1 ? t.subtitle : (isSettingPassword ? t.setPasswordSubtitle : `+91 ${phone}`)}
        </p>

        {errorMsg && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm font-medium rounded-lg">
            {errorMsg}
          </div>
        )}

        {/* STEP 1 FORM: Ask for Number */}
        {step === 1 && (
          <form onSubmit={handleCheckUser} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {t.phoneLabel}
              </label>
              <div className="flex shadow-sm rounded-lg overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
                <span className="flex items-center justify-center bg-gray-100 px-4 text-gray-600 font-medium border-r border-gray-300">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  className="w-full h-14 px-4 text-lg font-medium text-gray-900 focus:outline-none bg-white"
                  placeholder={t.phonePlaceholder}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={phone.length < 10 || isLoading}
              className="mt-4 w-full h-14 bg-blue-600 text-white text-lg font-bold rounded-lg shadow-md disabled:bg-blue-300 active:bg-blue-700 transition-colors flex items-center justify-center"
            >
              {isLoading ? '...' : t.next}
            </button>
          </form>
        )}

        {/* STEP 2 FORM: Password Entry or Creation */}
        {step === 2 && (
          <form onSubmit={handleSubmitAction} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {isSettingPassword ? t.setPasswordTitle : t.passwordLabel}
              </label>
              <div className="relative flex shadow-sm rounded-lg overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoFocus
                  className="w-full h-14 pl-4 pr-16 text-lg font-medium text-gray-900 focus:outline-none bg-transparent"
                  placeholder={t.passwordPlaceholder}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMsg('');
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-0 h-full px-4 text-sm font-semibold text-blue-600 active:text-blue-800 bg-transparent"
                >
                  {showPassword ? t.hide : t.show}
                </button>
              </div>
            </div>

            {/* Extra Confirm Field ONLY if setting password */}
            {isSettingPassword && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 mt-2">
                  {t.confirmLabel}
                </label>
                <div className="relative flex shadow-sm rounded-lg overflow-hidden border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full h-14 px-4 text-lg font-medium text-gray-900 focus:outline-none bg-transparent"
                    placeholder={t.confirmPlaceholder}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrorMsg('');
                    }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={password.length === 0 || (isSettingPassword && confirmPassword.length === 0) || isLoading}
              className="mt-4 w-full h-14 bg-blue-600 text-white text-lg font-bold rounded-lg shadow-md disabled:bg-blue-300 active:bg-blue-700 transition-colors flex items-center justify-center"
            >
              {isLoading ? '...' : (isSettingPassword ? t.setAndLogin : t.login)}
            </button>

            {/* Back button to fix typos in phone number */}
            <div className="flex justify-center mt-4">
               <button 
                 type="button" 
                 onClick={() => {
                   setStep(1);
                   setPassword('');
                   setConfirmPassword('');
                   setErrorMsg('');
                 }} 
                 className="text-sm font-semibold text-gray-500 active:text-gray-800"
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