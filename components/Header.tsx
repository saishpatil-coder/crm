"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useSync } from "@/hooks/useSync"; // The hook we built earlier

const dict = {
  en: { sync: "Sync", syncing: "Syncing..." },
  mr: { sync: "सिंक करा", syncing: "सिंक होत आहे..." },
  hi: { sync: "सिंक करें", syncing: "सिंक हो रहा है..." },
};

export default function Header() {
  const { user,isLoading } = useAuth();
  const { lang } = useLanguage();
  const { pullVoters, isSyncing } = useSync();
  const t = dict[lang];


  if (isLoading) {
    console.log("in head nav : loading");
    return <div>Loading...</div>; // Or your loading spinner
  }

  // If we finished loading and there IS no user, don't render the protected content
  // (The useEffect above will handle the redirect)
  if (!user) {
    console.log("routing from headnav");
    return null;
  }

  return (
    <header className="fixed top-0 w-full bg-blue-600 text-white shadow-md z-50 h-16 md:max-w-md md:mx-auto md:left-0 md:right-0">
      <div className="flex justify-between items-center h-full px-4">
        {/* Settings Icon */}
        <Link
          href="/settings"
          className="p-2 -ml-2 active:bg-blue-700 rounded-full transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </Link>

        {/* App Title */}
        <h1 className="text-xl font-black tracking-wider">CAMPAIGN</h1>
      </div>
    </header>
  );
}
