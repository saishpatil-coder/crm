"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage, Language } from "@/context/LanguageContext";
import { apiClient } from "@/lib/appClient";

// Inside your Settings Page
import { useColor, ThemeColor } from '@/context/ColorContext';
import CurvedHeader from "@/components/CurvedHeader";

// ... inside the component ...

const colors: { name: string; value: ThemeColor; bg: string }[] = [
  { name: 'Blue', value: 'blue', bg: 'bg-blue-600' },
  { name: 'Saffron', value: 'orange', bg: 'bg-orange-500' },
  { name: 'Green', value: 'green', bg: 'bg-green-600' },
  { name: 'Purple', value: 'purple', bg: 'bg-purple-600' },
  { name: 'Red', value: 'red', bg: 'bg-red-600' },
];
const dict = {
  en: {
    title: "Settings",
    profile: "My Profile",
    role: "System Role",
    phone: "Mobile Number",
    viewMode: "App View Mode",
    adminMode: "Admin View",
    workerMode: "Worker View",
    language: "App Language",
    changePassword: "Change Password",
    oldPassword: "Current Password",
    newPassword: "New Password",
    confirmPassword: "Confirm New Password",
    updateBtn: "Update Password",
    cancel: "Cancel",
    logout: "Log Out",
    passwordsMismatch: "New passwords do not match.",
    passSuccess: "Password updated successfully!",
  },
  mr: {
    title: "सेटिंग्ज",
    profile: "माझी प्रोफाइल",
    role: "सिस्टम भूमिका",
    phone: "मोबाईल क्रमांक",
    viewMode: "अॅप व्ह्यू मोड",
    adminMode: "अॅडमिन व्ह्यू",
    workerMode: "कार्यकर्ता व्ह्यू",
    language: "अॅपची भाषा",
    changePassword: "पासवर्ड बदला",
    oldPassword: "सध्याचा पासवर्ड",
    newPassword: "नवीन पासवर्ड",
    confirmPassword: "नवीन पासवर्डची पुष्टी करा",
    updateBtn: "पासवर्ड अपडेट करा",
    cancel: "रद्द करा",
    logout: "लॉग आउट करा",
    passwordsMismatch: "नवीन पासवर्ड जुळत नाहीत.",
    passSuccess: "पासवर्ड यशस्वीरित्या अपडेट झाला!",
  },
  hi: {
    title: "सेटिंग्स",
    profile: "मेरी प्रोफ़ाइल",
    role: "सिस्टम भूमिका",
    phone: "मोबाइल नंबर",
    viewMode: "ऐप व्यू मोड",
    adminMode: "एडमिन व्यू",
    workerMode: "कार्यकर्ता व्यू",
    language: "ऐप की भाषा",
    changePassword: "पासवर्ड बदलें",
    oldPassword: "वर्तमान पासवर्ड",
    newPassword: "नया पासवर्ड",
    confirmPassword: "नए पासवर्ड की पुष्टि करें",
    updateBtn: "पासवर्ड अपडेट करें",
    cancel: "रद्द करें",
    logout: "लॉग आउट करें",
    passwordsMismatch: "नए पासवर्ड मेल नहीं खाते।",
    passSuccess: "पासवर्ड सफलतापूर्वक अपडेट किया गया!",
  },
};

export default function SettingsPage() {
  const router = useRouter();
  const {
    user,
    logout,
    isLoading: loading,
    activeRole,
    switchRole,
  } = useAuth();
  const { lang, setLang } = useLanguage();
  const t = dict[lang];
const { primaryColor, setPrimaryColor } = useColor();

  // UI State for expanding sections
  const [activeSection, setActiveSection] = useState<
    "NONE" | "LANGUAGE" | "PASSWORD"
  >("NONE");

  // Password State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  if (loading) return null;
  if (!user) return null;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (newPassword !== confirmPassword) {
      setMsg({ type: "error", text: t.passwordsMismatch });
      return;
    }

    setIsUpdating(true);
    try {
      await apiClient.post("/user/change-password", {
        oldPassword,
        newPassword,
      });

      setMsg({ type: "success", text: t.passSuccess });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Auto-close after success
      setTimeout(() => setActiveSection("NONE"), 2000);
    } catch (error: any) {
      setMsg({
        type: "error",
        text: error.response?.data?.error || "Failed to update password.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleModeSwitch = (newRole: "SUB_ADMIN" | "WORKER") => {
    switchRole(newRole);
    // Force redirect to apply layout changes
    if (newRole === "WORKER") {
      router.push("/mobile");
    } else {
      router.push("/dashboard");
    }
  };

  const displayRole = user.role?.replace("_", " ");

  // Shared Components
  const SectionTitle = ({ title }: { title: string }) => (
    <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest pl-4 mb-2 mt-6">
      {title}
    </h3>
  );

  const MenuButton = ({ icon, label, onClick, value, isDestructive }: any) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 bg-white border-b border-gray-100 last:border-none active:bg-gray-50 transition-colors ${isDestructive ? "text-red-600" : "text-gray-900"}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl w-8 text-center">{icon}</span>
        <span className="font-bold text-base">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && (
          <span className="text-sm font-bold text-gray-400">{value}</span>
        )}
        <span className="text-gray-300 font-bold">›</span>
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24 md:max-w-md md:mx-auto md:shadow-2xl md:border-x border-gray-200">
      {/* --- Header --- */}
     <CurvedHeader
     title={t.title}
     size={20}
     />

      <div className="flex flex-col w-full">
        {/* --- 1. User Banner --- */}
        <div className="bg-white p-6 border-b border-gray-200 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-3xl mb-3 shadow-inner">
            <span className="text-blue-600 font-black uppercase">
              {user.name?.charAt(0) || "👤"}
            </span>
          </div>
          <h2 className="text-xl font-black text-gray-900 leading-tight">
            {user.name}
          </h2>
          <p className="text-sm font-bold text-gray-500 mt-1">
            +91 {user.mobileNumber}
          </p>
          <span className="mt-2 px-3 py-1 bg-gray-100 text-[10px] font-black text-gray-500 rounded uppercase tracking-widest">
            {displayRole}
          </span>
        </div>

        {/* --- 2. Role Switcher (Only for SUB_ADMINs) --- */}
        {user.role === "SUB_ADMIN" && (
          <>
            <SectionTitle title={t.viewMode} />
            <div className="bg-white border-y border-gray-200">
              <div className="p-2 flex gap-2">
                <button
                  onClick={() => handleModeSwitch("SUB_ADMIN")}
                  className={`flex-1 py-3 text-xs font-black rounded-lg transition-all ${
                    activeRole === "SUB_ADMIN"
                      ? "bg-gray-900 text-white shadow-sm"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  👔 {t.adminMode}
                </button>
                <button
                  onClick={() => handleModeSwitch("WORKER")}
                  className={`flex-1 py-3 text-xs font-black rounded-lg transition-all ${
                    activeRole === "WORKER"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  👷 {t.workerMode}
                </button>
              </div>
            </div>
          </>
        )}

        {/* --- 3. App Settings Menu --- */}
        <SectionTitle title="Preferences" />
        <div className="bg-white border-y border-gray-200 flex flex-col">
          <MenuButton
            icon="🌐"
            label={t.language}
            value={
              lang === "mr" ? "मराठी" : lang === "hi" ? "हिंदी" : "English"
            }
            onClick={() =>
              setActiveSection(
                activeSection === "LANGUAGE" ? "NONE" : "LANGUAGE",
              )
            }
          />

          {/* Language Expansion */}
          {activeSection === "LANGUAGE" && (
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex gap-2">
              {["en", "mr", "hi"].map((l) => (
                <button
                  key={l}
                  onClick={() => {
                    setLang(l as Language);
                    setActiveSection("NONE");
                  }}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold border-2 transition-all ${
                    lang === l
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-500"
                  }`}
                >
                  {l === "mr" ? "मराठी" : l === "hi" ? "हिंदी" : "Eng"}
                </button>
              ))}
            </div>
          )}

          <MenuButton
            icon="🔒"
            label={t.changePassword}
            onClick={() =>
              setActiveSection(
                activeSection === "PASSWORD" ? "NONE" : "PASSWORD",
              )
            }
          />

          {/* Password Expansion */}
          {activeSection === "PASSWORD" && (
            <div className="p-4 bg-gray-50 border-b border-gray-100">
              {msg.text && (
                <div
                  className={`mb-4 p-3 rounded-xl text-sm font-bold ${msg.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}
                >
                  {msg.text}
                </div>
              )}
              <form
                onSubmit={handlePasswordChange}
                className="flex flex-col gap-3"
              >
                <input
                  type="password"
                  required
                  placeholder={t.oldPassword}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl focus:border-blue-600 outline-none text-gray-900 font-bold"
                />
                <input
                  type="password"
                  required
                  placeholder={t.newPassword}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl focus:border-blue-600 outline-none text-gray-900 font-bold"
                />
                <input
                  type="password"
                  required
                  placeholder={t.confirmPassword}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-12 px-4 bg-white border border-gray-200 rounded-xl focus:border-blue-600 outline-none text-gray-900 font-bold"
                />

                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setActiveSection("NONE")}
                    className="flex-1 h-12 bg-white text-gray-600 border border-gray-200 font-bold rounded-xl active:bg-gray-100"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating || !oldPassword || !newPassword}
                    className="flex-1 h-12 bg-blue-600 text-white font-bold rounded-xl disabled:bg-gray-300 active:bg-blue-700"
                  >
                    {isUpdating ? "..." : t.updateBtn}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mt-4">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b-2 border-gray-100 pb-2 mb-4">
            App Theme
          </h3>
          <div className="flex gap-3 justify-between">
            {colors.map((c) => (
              <button
                key={c.value}
                onClick={() => setPrimaryColor(c.value)}
                className={`w-10 h-10 rounded-full transition-all flex items-center justify-center ${c.bg} ${
                  primaryColor === c.value
                    ? "ring-4 ring-offset-2 ring-gray-300 scale-110"
                    : "hover:scale-105"
                }`}
              >
                {primaryColor === c.value && (
                  <span className="text-white text-sm">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* --- 4. Account Actions --- */}
        <SectionTitle title="Account" />
        <div className="bg-white border-y border-gray-200 flex flex-col">
          <MenuButton
            icon="🚪"
            label={t.logout}
            isDestructive={true}
            onClick={handleLogout}
          />
        </div>
      </div>
    </div>
  );
}
