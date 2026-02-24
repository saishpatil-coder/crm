"use client";

import VoterCard from "@/components/VoterCard";
import { useLanguage } from "@/context/LanguageContext";
import { useOfflineData } from "@/hooks/useOfflineData";
import { useRouter } from "next/navigation";
import { useState } from "react";

const dict = {
  en: {
    title: "Voters Directory",
    search: "Search by Name or EPIC...",
    noResults: "No voters found.",
    syncing: "Syncing...",
    synced: "Synced",
    visited: "VISITED",
    pending: "PENDING",
    unknown: "Unknown Booth", 
  },
  mr: {
    title: "मतदार यादी",
    search: "नाव किंवा EPIC ने शोधा...",
    noResults: "कोणतेही मतदार सापडले नाहीत.",
    syncing: "सिंक होत आहे...",
    synced: "सिंक झाले",
    visited: "भेट दिली",
    pending: "प्रलंबित",
    unknown: "अज्ञात बूथ", 
  },
  hi: {
    title: "मतदाता सूची",
    search: "नाम या EPIC से खोजें...",
    noResults: "कोई मतदाता नहीं मिला।",
    syncing: "सिंक हो रहा है...",
    synced: "सिंक किया गया",
    visited: "भेंट की गई",
    pending: "लंबित",
    unknown: "अज्ञात बूथ", 
  },
};

export default function WorkerVotersPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const t = dict[lang as keyof typeof dict];

  const [searchQuery, setSearchQuery] = useState("");

  // USE THE HOOK! Points to our new endpoint and saves to 'voters' table
  const {
    data: voters,
    isLoading,
    isSyncing,
    lastSyncedText,
    refresh,
    isOnline,
  } = useOfflineData<any>("/voters", "voters");

  // Fast Client-side search
  const filteredVoters = voters.filter(
    (v) =>
      v.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.epicNumber.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
      {/* Sticky Header */}
      <div className="bg-white px-4 pt-6 pb-4 shadow-sm sticky top-0 z-10 border-b border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-gray-900 leading-tight">
              {t.title}
            </h1>
            <span
              className={`text-[10px] font-bold ${isSyncing ? "text-blue-500 animate-pulse" : "text-gray-400"}`}
            >
              {isSyncing ? t.syncing : `${t.synced}: ${lastSyncedText}`}
            </span>
          </div>

          <button
            onClick={refresh}
            disabled={isSyncing || !isOnline}
            className="p-2 bg-blue-50 text-blue-600 rounded-full active:bg-blue-100 disabled:opacity-50 transition-all"
          >
            <svg
              className={`w-6 h-6 ${isSyncing ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            🔍
          </span>
          <input
            type="text"
            placeholder={t.search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 font-bold placeholder-gray-400"
          />
        </div>
      </div>

      {/* Voter List */}
      <div className="p-4 flex flex-col gap-3">
        {isLoading ? (
          <div className="flex justify-center mt-10">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredVoters.length === 0 ? (
          <p className="text-center text-gray-500 mt-10 font-bold">
            {t.noResults}
          </p>
        ) : (
          filteredVoters.map((voter) => (
            <VoterCard
              key={voter.id}
              voter={voter}
              t={t} // Pass the dictionary slice
              onClick={() => router.push(`/mobile/voters/${voter.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}
