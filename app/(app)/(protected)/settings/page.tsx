"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage, Language } from "@/context/LanguageContext";
import { apiClient } from "@/lib/appClient";
import { useColor, ThemeColor } from '@/context/ColorContext';
import CurvedHeader from "@/components/CurvedHeader";

// Theme mappings for dynamic Stitch UI components
const themeStyles: Record<ThemeColor, { bg: string, text: string, textHover: string, activeBg: string, ring: string, activeText: string }> = {
  blue: { bg: "bg-blue-600", text: "text-blue-600", textHover: "hover:text-blue-600", activeBg: "bg-blue-50", ring: "ring-blue-500", activeText: "text-blue-600" },
  green: { bg: "bg-green-600", text: "text-green-600", textHover: "hover:text-green-600", activeBg: "bg-green-50", ring: "ring-green-500", activeText: "text-green-600" },
  orange: { bg: "bg-orange-500", text: "text-orange-500", textHover: "hover:text-orange-500", activeBg: "bg-orange-50", ring: "ring-orange-500", activeText: "text-orange-600" },
  purple: { bg: "bg-purple-600", text: "text-purple-600", textHover: "hover:text-purple-600", activeBg: "bg-purple-50", ring: "ring-purple-500", activeText: "text-purple-600" },
  red: { bg: "bg-red-600", text: "text-red-600", textHover: "hover:text-red-600", activeBg: "bg-red-50", ring: "ring-red-500", activeText: "text-red-600" },
};

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
  const { user, logout, isLoading: loading, activeRole, switchRole } = useAuth();
  const { lang, setLang } = useLanguage();
  const t = dict[lang];
  const { primaryColor, setPrimaryColor } = useColor();
  const currentTheme = themeStyles[primaryColor];

  // UI State for expanding sections
  const [activeSection, setActiveSection] = useState<"NONE" | "LANGUAGE" | "PASSWORD">("NONE");

  // Password State
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  if (loading || !user) return null;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (newPassword !== confirmPassword) {
      setMsg({ type: "error", text: t.passwordsMismatch });
      return;
    }

    setIsUpdating(true);
    try {
      await apiClient.post("/user/change-password", { oldPassword, newPassword });
      setMsg({ type: "success", text: t.passSuccess });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setActiveSection("NONE"), 2000);
    } catch (error: any) {
      setMsg({ type: "error", text: error.response?.data?.error || "Failed to update password." });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleModeSwitch = (newRole: "SUB_ADMIN" | "WORKER") => {
    switchRole(newRole);
    if (newRole === "WORKER") {
      router.push("/mobile");
    } else {
      router.push("/dashboard");
    }
  };

  const handleLogout = () => {
    logout();
  };

  const displayRole = user.role?.replace("_", " ");

  // Shared UI Components
  const SectionTitle = ({ title }: { title: string }) => (
    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest pl-2 mb-2 mt-5">
      {title}
    </h3>
  );

  const MenuButton = ({ icon, label, onClick, value, isDestructive, isFirst, isLast }: any) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-5 bg-white border-b border-gray-100 last:border-none active:bg-gray-50 transition-colors ${
        isDestructive ? "text-red-500" : "text-gray-900"
      } ${isFirst ? "rounded-t-3xl" : ""} ${isLast ? "rounded-b-3xl" : ""}`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 flex items-center justify-center rounded-2xl text-2xl shadow-inner ${isDestructive ? "bg-red-50 text-red-500" : "bg-gray-50 text-gray-600"}`}>
          {icon}
        </div>
        <span className="font-bold text-lg">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        {value && <span className="text-[13px] font-black uppercase text-gray-400">{value}</span>}
        <span className="text-gray-300 font-bold text-xl">›</span>
      </div>
    </button>
  );

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex flex-col pb-24 md:max-w-md md:mx-auto md:shadow-2xl md:border-x border-gray-200">
      {/* Header handled natively with curves */}
      <CurvedHeader title={t.title} size={20} />

      <div className="flex flex-col w-full px-4 -mt-4 relative z-10 gap-3">
        
        {/* --- 1. User Banner (ID Style Motif) --- */}
        <div className={`bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center overflow-hidden relative`}>
          <div className={`absolute top-0 w-full h-16 ${currentTheme.activeBg}`}></div>
          <div className={`relative w-24 h-24 mt-2 bg-white rounded-full flex items-center justify-center text-4xl mb-3 border-4 border-white shadow-md z-10`}>
            {user.name?.charAt(0) || "👤"}
          </div>
          <h2 className="text-2xl font-black text-gray-900 leading-tight">
            {user.name}
          </h2>
          <p className="text-sm font-bold text-gray-400 mt-1">
            +91 {user.mobileNumber}
          </p>
          <span className={`mt-3 px-4 py-1.5 ${currentTheme.activeBg} ${currentTheme.text} text-[10px] font-black rounded-lg uppercase tracking-widest`}>
            {displayRole}
          </span>
        </div>

        {/* --- 2. Role Switcher (Only for SUB_ADMINs) --- */}
        {user.role === "SUB_ADMIN" && (
          <div className="mt-2">
            <SectionTitle title={t.viewMode} />
            <div className="bg-white p-3 rounded-3xl shadow-sm border border-gray-100 flex gap-2">
              <button
                onClick={() => handleModeSwitch("SUB_ADMIN")}
                className={`flex-1 py-3.5 text-xs font-black rounded-2xl transition-all flex flex-col items-center gap-1 ${
                  activeRole === "SUB_ADMIN"
                    ? `bg-gray-900 text-white shadow-md active:scale-95`
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100 active:scale-95"
                }`}
              >
                <span className="text-xl">👔</span>
                {t.adminMode}
              </button>
              <button
                onClick={() => handleModeSwitch("WORKER")}
                className={`flex-1 py-3.5 text-xs font-black rounded-2xl transition-all flex flex-col items-center gap-1 ${
                  activeRole === "WORKER"
                    ? `${currentTheme.bg} text-white shadow-md active:scale-95`
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100 active:scale-95"
                }`}
              >
                <span className="text-xl">👷</span>
                {t.workerMode}
              </button>
            </div>
          </div>
        )}

        {/* --- App Theme Picker (Bento Card) --- */}
        <div>
          <SectionTitle title="Appearance" />
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-[14px] font-bold text-gray-800 mb-4">Select Application Theme</h3>
            <div className="flex gap-4 justify-between">
              {colors.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setPrimaryColor(c.value)}
                  className={`w-12 h-12 rounded-full transition-all flex items-center justify-center ${c.bg} shadow-md active:scale-90 ${
                    primaryColor === c.value
                      ? "ring-4 ring-offset-2 ring-gray-200 scale-110"
                      : "hover:scale-105"
                  }`}
                >
                  {primaryColor === c.value && (
                    <span className="text-white text-lg drop-shadow">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* --- 3. App Settings Menu (Bento List) --- */}
        <div>
          <SectionTitle title="Preferences" />
          <div className="bg-white shadow-sm border border-gray-100 rounded-3xl flex flex-col overflow-hidden">
            <MenuButton
              icon="🌐"
              label={t.language}
              value={lang === "mr" ? "मराठी" : lang === "hi" ? "हिंदी" : "English"}
              isFirst={true}
              onClick={() => setActiveSection(activeSection === "LANGUAGE" ? "NONE" : "LANGUAGE")}
            />

            {/* Language Expansion */}
            {activeSection === "LANGUAGE" && (
              <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex gap-3 shadow-inner">
                {["en", "mr", "hi"].map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      setLang(l as Language);
                      setActiveSection("NONE");
                    }}
                    className={`flex-1 py-3 rounded-2xl text-sm font-black transition-all active:scale-95 border-2 ${
                      lang === l
                        ? `${themeStyles[primaryColor]?.activeBg} ${themeStyles[primaryColor]?.text} ${themeStyles[primaryColor]?.ring} border-${primaryColor}-200`
                        : "border-gray-200 bg-white text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {l === "mr" ? "मराठी" : l === "hi" ? "हिंदी" : "English"}
                  </button>
                ))}
              </div>
            )}

            <MenuButton
              icon="🔒"
              label={t.changePassword}
              isLast={true}
              onClick={() => setActiveSection(activeSection === "PASSWORD" ? "NONE" : "PASSWORD")}
            />

            {/* Password Expansion */}
            {activeSection === "PASSWORD" && (
              <div className="p-5 bg-gray-50 shadow-inner">
                {msg.text && (
                  <div className={`mb-4 p-4 rounded-2xl text-sm font-black tracking-wide ${msg.type === "error" ? "bg-red-50 text-red-600 border border-red-100" : "bg-green-50 text-green-600 border border-green-100"}`}>
                    {msg.text}
                  </div>
                )}
                <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
                  <input
                    type="password"
                    required
                    placeholder={t.oldPassword}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full h-14 px-5 bg-white border border-gray-200 rounded-2xl focus:border-gray-400 outline-none text-gray-900 font-bold shadow-sm transition-all"
                  />
                  <input
                    type="password"
                    required
                    placeholder={t.newPassword}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-14 px-5 bg-white border border-gray-200 rounded-2xl focus:border-gray-400 outline-none text-gray-900 font-bold shadow-sm transition-all"
                  />
                  <input
                    type="password"
                    required
                    placeholder={t.confirmPassword}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-14 px-5 bg-white border border-gray-200 rounded-2xl focus:border-gray-400 outline-none text-gray-900 font-bold shadow-sm transition-all"
                  />

                  <div className="flex gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setActiveSection("NONE")}
                      className="flex-[0.4] h-14 bg-white text-gray-600 border border-gray-200 font-black tracking-wide rounded-2xl active:bg-gray-100 active:scale-95 transition-all shadow-sm"
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdating || !oldPassword || !newPassword}
                      className={`flex-[0.6] h-14 ${currentTheme.bg} text-white font-black tracking-wide rounded-2xl disabled:opacity-50 active:scale-95 transition-all shadow-md`}
                    >
                      {isUpdating ? "..." : t.updateBtn}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* --- 4. Account Actions --- */}
        <div className="mt-4 mb-8">
          <div className="bg-white shadow-sm border border-red-100 rounded-3xl flex flex-col overflow-hidden">
            <MenuButton
              icon="🚪"
              label={t.logout}
              isDestructive={true}
              isFirst={true}
              isLast={true}
              onClick={handleLogout}
            />
          </div>
        </div>
        
      </div>
    </div>
  );
}
