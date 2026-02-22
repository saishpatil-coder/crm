"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useOfflineData } from "@/hooks/useOfflineData";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Define the shape of your worker data
export interface LocalWorker {
  id: number;
  name: string;
  mobileNumber: string;
  status: boolean;
  _count?: {
    voters: number;
  };
}

const dict = {
  en: {
    title: "All Workers",
    search: "Search by name or mobile...",
    noResults: "No workers found.",
    addBtn: "Add Worker",
    active: "ACTIVE",
    inactive: "INACTIVE",
    votersAdded: "Voters Added",
    syncing: "Syncing...",
    synced: "Synced",
  },
  mr: {
    title: "सर्व कार्यकर्ते",
    search: "नाव किंवा मोबाईल शोधा...",
    noResults: "कोणतेही कार्यकर्ते सापडले नाहीत.",
    addBtn: "कार्यकर्ता जोडा",
    active: "सक्रिय",
    inactive: "निष्क्रिय",
    votersAdded: "मतदार जोडले",
    syncing: "सिंक होत आहे...",
    synced: "सिंक झाले",
  },
  hi: {
    title: "सभी कार्यकर्ता",
    search: "नाम या मोबाइल से खोजें...",
    noResults: "कोई कार्यकर्ता नहीं मिला।",
    addBtn: "कार्यकर्ता जोड़ें",
    active: "सक्रिय",
    inactive: "निष्क्रिय",
    votersAdded: "मतदाता जोड़े गए",
    syncing: "सिंक हो रहा है...",
    synced: "सिंक किया गया",
  },
};

export default function WorkersListPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const t = dict[lang as keyof typeof dict];

  const [searchQuery, setSearchQuery] = useState("");

  // USE THE HOOK! Point it to the workers endpoint and the 'workers' Dexie table
  const {
    data: workers,
    isLoading,
    isSyncing,
    lastSyncedText,
    refresh,
    isOnline,
  } = useOfflineData<LocalWorker>("/workers", "workers");

  // Client-side search filtering by name or mobile
  const filteredWorkers = workers.filter(
    (w) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.mobileNumber.includes(searchQuery),
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      {/* Sticky Header */}
      <div className="bg-white px-4 pt-6 pb-4 shadow-sm sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-gray-500 font-bold active:bg-gray-100 p-2 rounded-full -ml-2 transition-colors"
            >
              ←
            </button>
            <div className="flex flex-col">
              <h1 className="text-xl font-extrabold text-gray-900 leading-tight">
                {t.title}
              </h1>
              <span
                className={`text-[10px] font-bold ${isSyncing ? "text-green-400" : "text-gray-400"}`}
              >
                {isSyncing ? t.syncing : `${t.synced}: ${lastSyncedText}`}
              </span>
            </div>
          </div>

          {/* Action Buttons Container */}
          <div className="flex gap-2">
            <button
              onClick={refresh}
              disabled={isSyncing || !isOnline}
              className="p-2 bg-gray-100 text-gray-600 rounded-full active:bg-gray-200 disabled:opacity-50 transition-all"
            >
              <svg
                className={`w-5 h-5 ${isSyncing ? "animate-spin text-blue-600" : ""}`}
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

            <button
              onClick={() => router.push("/dashboard/workers/add")}
              disabled={!isOnline}
              className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm transition-all flex items-center gap-1 ${
                isOnline
                  ? "bg-blue-600 text-white active:bg-blue-700 active:scale-95"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <span className="text-lg leading-none mb-[2px]">+</span>
              <span className="hidden sm:inline">{t.addBtn}</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <input
          type="text"
          placeholder={t.search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 px-4 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
        />
      </div>

      {/* List Area */}
      <div className="p-4 flex flex-col gap-3">
        {isLoading ? (
          <div className="flex justify-center mt-10">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredWorkers.length === 0 ? (
          <p className="text-center text-gray-500 mt-10 font-bold">
            {t.noResults}
          </p>
        ) : (
          filteredWorkers.map((worker) => (
            <div
              key={worker.id}
              onClick={() => router.push(`/dashboard/workers/${worker.id}`)}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:bg-blue-50 transition-colors cursor-pointer flex items-center gap-4"
            >
              {/* Avatar Circle */}
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl shadow-inner flex-shrink-0">
                👤
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h2 className="font-bold text-gray-900 text-lg leading-none">
                    {worker.name}
                  </h2>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      worker.status
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {worker.status ? t.active : t.inactive}
                  </span>
                </div>
                <p className="text-sm text-gray-500 font-bold mb-2">
                  +91 {worker.mobileNumber}
                </p>

                {/* Micro-stats */}
                <div className="flex items-center gap-1 text-xs font-bold text-gray-400">
                  <span className="bg-gray-100 px-2 py-1 rounded-md text-gray-600">
                    🗳️ {worker._count?.voters || 0} {t.votersAdded}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
