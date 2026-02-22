'use client';
import ClassyLoader from '@/components/ClassyLoader';
import { useLanguage } from '@/context/LanguageContext';
import { useOfflineData } from '@/hooks/useOfflineData';
import {  LocalTenant } from '@/lib/db'; // Import your local DB
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const dict = {
  en: {
    title: "All Campaigns",
    search: "Search candidate or constituency...",
    noResults: "No campaigns found.",
    offlineMode: "You are offline. Showing cached data.",
    addBtn: "Add New", // <-- Add this
  },
  mr: {
    title: "सर्व मोहिमा",
    search: "उमेदवार किंवा मतदारसंघ शोधा...",
    noResults: "कोणतीही मोहीम सापडली नाही.",
    offlineMode: "तुम्ही ऑफलाइन आहात. जुना डेटा दाखवत आहे.",
    addBtn: "नवीन जोडा",
  },
  hi: {
    title: "सभी अभियान",
    search: "उम्मीदवार या निर्वाचन क्षेत्र खोजें...",
    noResults: "कोई अभियान नहीं मिला।",
    offlineMode: "आप ऑफ़लाइन हैं। कैश किया गया डेटा दिखाया जा रहा है।",
    addBtn: "नया जोड़ें",
  },
};


type Language = 'en' | 'mr' | 'hi';

export default function TenantsListPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const t = dict[lang];
  // 2. USE THE HOOK! Everything is handled for you.
  const {
    data: tenants,
    isLoading,
    isSyncing,
    lastSyncedText,
    refresh,
    isOnline,
  } = useOfflineData<LocalTenant>("/admin/tenants", "tenants");


  // Client-side search filtering
  const filteredTenants = tenants.filter(
    (t) =>
      t.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.constituencyName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      {/* Sticky Header with Search */}
      <div className="bg-white px-4 pt-6 pb-4 shadow-sm sticky top-0 z-10">
        {/* Sticky Header with Search */}

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-gray-500 font-bold active:bg-gray-100 p-2 rounded-full -ml-2 transition-colors"
            >
              ←
            </button>
            {/* --- UPDATED TITLE AREA --- */}
            <div className="flex flex-col">
              <h1 className="text-xl font-extrabold text-gray-900 leading-tight">
                {t.title}
              </h1>
              <span
                className={`text-[10px] font-bold ${isSyncing ? "text-green-400" : "text-gray-400"}`}
              >
                {isSyncing ? "Syncing..." : `Synced: ${lastSyncedText}`}
              </span>
            </div>
            {/* -------------------------- */}{" "}
          </div>

          {/* Action Buttons Container */}
          <div className="flex gap-2">
            {/* 1. SYNC BUTTON */}
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

            {/* 2. ADD CANDIDATE BUTTON */}
            <button
              onClick={() => router.push("/admin/add-tenant")}
              disabled={!isOnline}
              className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm transition-all flex items-center gap-1 ${
                isOnline
                  ? "bg-blue-600 text-white active:bg-blue-700 active:scale-95"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <span className="text-lg leading-none mb-[2px]">+</span>{" "}
              {t.addBtn}
            </button>
          </div>
        </div>

        {/* ... search input remains the same ... */}

        <input
          type="text"
          placeholder={t.search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 px-4 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
        />

        {/* Offline Indicator Banner */}
        {!isOnline && (
          <div className="mt-3 bg-orange-50 border border-orange-200 text-orange-700 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
            {t.offlineMode}
          </div>
        )}
      </div>

      {/* List Area */}
      <div className="p-4 flex flex-col gap-3">
        {isLoading ? (
          <div className="text-center text-gray-500 mt-10">
            <ClassyLoader size={40} color="#3B82F6" />
          </div>
        ) : filteredTenants.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">{t.noResults}</p>
        ) : (
          filteredTenants.map((tenant) => (
            <div
              key={tenant.id}
              onClick={() => router.push(`/admin/tenants/${tenant.id}`)}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:bg-blue-50 transition-colors cursor-pointer"
            >
              <div className="flex justify-between items-start mb-2">
                <h2 className="font-bold text-gray-900 text-lg">
                  {tenant.candidateName}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    tenant.status
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {tenant.status ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
              <p className="text-sm text-gray-500 font-medium mb-3">
                {tenant.constituencyName} ({tenant.partyName})
              </p>

              {/* Stats Bar */}
              <div className="flex gap-4 text-xs font-semibold text-gray-500 bg-gray-50 p-2 rounded-lg">
                <span>👥 {tenant._count?.users || 0} Workers</span>
                <span>🗳️ {tenant._count?.voters || 0} Voters</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
