'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage, Language } from '@/context/LanguageContext';
import { apiClient } from '@/lib/appClient';

// --- Multi-language Dictionary ---
const dict = {
  en: {
    title: "Settings",
    profile: "My Profile",
    role: "Role",
    phone: "Mobile Number",
    language: "App Language",
    changePassword: "Change Password",
    oldPassword: "Current Password",
    newPassword: "New Password",
    confirmPassword: "Confirm New Password",
    updateBtn: "Update Password",
    logout: "Log Out",
    passwordsMismatch: "New passwords do not match.",
    passSuccess: "Password updated successfully!",
  },
  mr: {
    title: "सेटिंग्ज",
    profile: "माझी प्रोफाइल",
    role: "भूमिका",
    phone: "मोबाईल क्रमांक",
    language: "अॅपची भाषा",
    changePassword: "पासवर्ड बदला",
    oldPassword: "सध्याचा पासवर्ड",
    newPassword: "नवीन पासवर्ड",
    confirmPassword: "नवीन पासवर्डची पुष्टी करा",
    updateBtn: "पासवर्ड अपडेट करा",
    logout: "लॉग आउट करा",
    passwordsMismatch: "नवीन पासवर्ड जुळत नाहीत.",
    passSuccess: "पासवर्ड यशस्वीरित्या अपडेट झाला!",
  },
  hi: {
    title: "सेटिंग्स",
    profile: "मेरी प्रोफ़ाइल",
    role: "भूमिका",
    phone: "मोबाइल नंबर",
    language: "ऐप की भाषा",
    changePassword: "पासवर्ड बदलें",
    oldPassword: "वर्तमान पासवर्ड",
    newPassword: "नया पासवर्ड",
    confirmPassword: "नए पासवर्ड की पुष्टि करें",
    updateBtn: "पासवर्ड अपडेट करें",
    logout: "लॉग आउट करें",
    passwordsMismatch: "नए पासवर्ड मेल नहीं खाते।",
    passSuccess: "पासवर्ड सफलतापूर्वक अपडेट किया गया!",
  }
};

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout ,isLoading:loading} = useAuth();
  const { lang, setLang } = useLanguage();
  const t = dict[lang];

  // Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setMsg({ type: 'error', text: t.passwordsMismatch });
      return;
    }

    setIsLoading(true);
    try {
      // You will need to build this backend route
      await apiClient.post('/user/change-password', {
        oldPassword,
        newPassword
      });
      
      setMsg({ type: 'success', text: t.passSuccess });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setMsg({ type: 'error', text: error.response?.data?.error || "Failed to update password." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    console.trace("🚨 I AM REDIRECTING TO LOGIN! 🚨");
    router.push('/login');
  };

  // Shared input styles
  const inputClass = "w-full h-14 px-4 bg-gray-50 border-2 border-gray-300 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none text-gray-900 font-bold transition-all";
  const labelClass = "block text-sm font-extrabold text-gray-800 mb-2 mt-4";
  if(loading){
    console.log("loading in settings");
    return <div>Loading...</div>; // Or your loading spinner
  }
  if (!user){
    console.log("returning null");
    return null; // Wait for AuthContext to load
  }
  console.log(user);

  // Format role for display
  const displayRole = user.role?.name?.replace('_', ' ');

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col pb-24 md:max-w-md md:mx-auto md:bg-gray-50 md:shadow-2xl md:border-x border-gray-200">
      
      {/* --- Header --- */}
      <div className="bg-white px-5 pt-5 pb-4 shadow-sm sticky top-0 z-20 border-b border-gray-200 flex flex-col gap-3">
        <button 
          onClick={() => router.back()}
          className="text-blue-600 font-bold text-sm flex items-center gap-1 active:bg-blue-50 py-1 px-2 -ml-2 rounded-lg w-max transition-colors"
        >
          <span className="text-lg leading-none mb-[2px]">←</span> Back
        </button>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          {t.title}
        </h1>
      </div>

      <div className="p-4 flex flex-col gap-6 w-full">
        
        {/* --- 1. User Profile Banner --- */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-16 bg-blue-600"></div>
          
          <div className="w-24 h-24 bg-white border-4 border-white shadow-md rounded-full flex items-center justify-center text-4xl mt-4 overflow-hidden z-10">
            <span className="text-blue-500 font-bold bg-blue-50 w-full h-full flex items-center justify-center uppercase">
              {user.name?.charAt(0) || ""}
            </span>
          </div>

          <h2 className="text-2xl font-black text-gray-900 leading-tight mt-3">{user.name}</h2>
          
          <div className="flex gap-2 mt-3">
            <span className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-xs font-extrabold text-blue-700 tracking-wide uppercase">
              {displayRole}
            </span>
            <span className="px-3 py-1 bg-gray-100 border border-gray-200 rounded-full text-xs font-extrabold text-gray-600 tracking-wide">
              +91 {user.mobileNumber}
            </span>
          </div>
        </div>

        {/* --- 2. Language Settings --- */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b-2 border-gray-100 pb-2 mb-4">
            {t.language}
          </h3>
          <select 
            value={lang}
            onChange={(e) => setLang(e.target.value as Language)}
            className={inputClass}
          >
            <option value="mr">मराठी (Marathi)</option>
            <option value="hi">हिंदी (Hindi)</option>
            <option value="en">English</option>
          </select>
        </div>

        {/* --- 3. Change Password --- */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b-2 border-gray-100 pb-2 mb-2">
            {t.changePassword}
          </h3>

          {msg.text && (
            <div className={`mt-3 p-3 rounded-xl text-sm font-bold ${msg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handlePasswordChange}>
            <label className={labelClass}>{t.oldPassword}</label>
            <input 
              type="password" 
              required 
              value={oldPassword} 
              onChange={(e) => setOldPassword(e.target.value)} 
              className={inputClass} 
            />

            <label className={labelClass}>{t.newPassword}</label>
            <input 
              type="password" 
              required 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              className={inputClass} 
            />

            <label className={labelClass}>{t.confirmPassword}</label>
            <input 
              type="password" 
              required 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              className={inputClass} 
            />

            <button
              type="submit"
              disabled={isLoading || !oldPassword || !newPassword}
              className="mt-6 w-full h-14 bg-gray-900 text-white text-lg font-black rounded-xl shadow-md disabled:bg-gray-300 active:scale-[0.98] transition-all"
            >
              {isLoading ? '...' : t.updateBtn}
            </button>
          </form>
        </div>

        {/* --- 4. Logout Button --- */}
        <button
          onClick={handleLogout}
          className="mt-2 w-full h-14 bg-red-50 text-red-600 border-2 border-red-200 text-lg font-black rounded-xl shadow-sm active:bg-red-100 transition-colors"
        >
          {t.logout}
        </button>

      </div>
    </div>
  );
}