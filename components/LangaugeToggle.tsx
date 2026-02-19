'use client';

import { useLanguage, Language } from '@/context/LanguageContext';

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="relative inline-block">
      <select 
        value={lang}
        onChange={(e) => setLang(e.target.value as Language)}
        className="appearance-none bg-gray-100 border border-gray-200 text-gray-800 py-1.5 pl-3 pr-8 rounded-lg text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer shadow-sm transition-all"
      >
        <option value="mr">मराठी</option>
        <option value="hi">हिंदी</option>
        <option value="en">English</option>
      </select>
      {/* Custom dropdown arrow to look better than native */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
        <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </div>
    </div>
  );
}