"use client";

import Header from "@/components/Header";
import VoterCard from "@/components/VoterCard";
import { useLanguage } from "@/context/LanguageContext";
import { useOfflineData } from "@/hooks/useOfflineData";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useMemo } from "react";

const dict = {
  en: {
    search: "Search in this list...",
    noResults: "No voters found for this filter.",
    visited: "VISITED",
    pending: "PENDING",
    loading: "Loading voters...",
    unknown: "Unknown",
    syncing: "Syncing...",
    synced: "Synced",
    shareBtn: "SHARE SLIP",
  },
  mr: {
    search: "या यादीत शोधा...",
    noResults: "या फिल्टरसाठी कोणतेही मतदार सापडले नाहीत.",
    visited: "भेट दिली",
    pending: "प्रलंबित",
    loading: "मतदार लोड करत आहे...",
    unknown: "अज्ञात",
    syncing: "सिंक होत आहे...",
    synced: "सिंक झाले",
    shareBtn: "स्लिप शेअर करा",
  },
  hi: {
    search: "इस सूची में खोजें...",
    noResults: "इस फ़िल्टर के लिए कोई मतदाता नहीं मिला।",
    visited: "भेंट की गई",
    pending: "लंबित",
    loading: "मतदाता लोड हो रहे हैं...",
    unknown: "अज्ञात",
    syncing: "सिंक हो रहा है...",
    synced: "सिंक किया गया",
    shareBtn: "स्लिप शेयर करें",
  },
};

export default function FilteredVoterListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lang } = useLanguage();
  const t = dict[lang as keyof typeof dict];

  const [searchQuery, setSearchQuery] = useState("");

  // Extract the filter type and value from the URL (e.g., filterType="village", filterValue="नांद्रे")
  const filterType = Array.from(searchParams.keys())[0];
  const filterValue = searchParams.get(filterType) || "";

  // 1. USE THE HOOK to fetch/manage the offline voters table
  const {
    data: allVoters,
    isLoading,
    isSyncing,
    lastSyncedText,
    refresh,
    isOnline,
  } = useOfflineData<any>("/voters", "voters"); // Make sure your endpoint is correct!
console.log(allVoters[0])
  // 2. UseMemo so we only recalculate the filtered list when the raw data or URL changes
  const filteredVoters = useMemo(() => {
    return allVoters.filter((voter) => {
      if (!filterType || !filterValue) return true;
console.log(filterType," ",filterValue)
      const val = filterValue === t.unknown ? null : filterValue;

      switch (filterType) {
        case "village":
          return (voter.cityVillage?.trim() || null) === val;
        case "ward":
          return (voter.ward?.trim() || null) === val;
        case "pollingStation":
          return (voter.pollingStation?.trim() || null) === val;
        case "firstName":
          const fName = voter.fullName?.split(" ")[0]?.trim() || null;
          return fName === val;
        case "lastName":
          const nameParts = voter.fullName?.split(" ");
          const lName =
            nameParts?.length > 1
              ? nameParts[nameParts.length - 1].trim()
              : null;
          return lName === val;
        case "firstLetter":
          const letter = voter.fullName?.trim().charAt(0).toUpperCase() || null;
          return letter === val;
        case "caste":
          return (voter.caste?.trim() || null) === val;
        case "gender":
          const g =
            voter.gender === "MALE"
              ? "Male"
              : voter.gender === "FEMALE"
                ? "Female"
                : voter.gender;
          return g === val;
        case "ageGroup":
          if (!voter.age) return val === null;
          if (voter.age <= 25) return val === "18-25";
          if (voter.age <= 40) return val === "26-40";
          if (voter.age <= 60) return val === "41-60";
          return val === "60+";
        case "status":
          return (
            (voter.isVisited === true && filterValue === "visited") ||
            (voter.isVisited === false && filterValue === "pending")
          );
        default:
          return true;
      }
    });
  }, [allVoters, filterType, filterValue, t.unknown]);

  // 3. Secondary text search (filters the already filtered list as the user types)
  const finalDisplayVoters = filteredVoters.filter(
    (v) =>
      v.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.epicNumber.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Dynamic header title based on what they searched for
  const headerTitle = filterValue
    ? `${filterValue} (${filteredVoters.length})`
    : "All Voters";

  return (
    <>
    {/* <Header/> */}
      <div className="min-h-screen bg-gray-50 flex flex-col pb-24 md:max-w-md md:mx-auto md:border-x border-gray-200">
        {/* --- Sticky Header --- */}
        <div className="bg-white px-4 pt-6 pb-4 shadow-sm sticky top-0 z-10 border-b border-gray-100 flex flex-col gap-4">
          {/* Top Row: Back Button, Title, and Sync Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden pr-2">
              <div className="flex flex-col overflow-hidden">
                <h1 className="text-l font-black text-gray-900 leading-tight truncate">
                  {headerTitle}
                </h1>
                {/* Dynamic Sync Status Text under the title */}
                <span
                  className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${isSyncing ? "text-green-500 animate-pulse" : "text-gray-400"}`}
                >
                  {isSyncing ? t.syncing : `${t.synced}: ${lastSyncedText}`}
                </span>
              </div>
            </div>

            {/* Green Sync Button */}
            <button
              onClick={refresh}
              disabled={isSyncing || !isOnline}
              className="p-2.5 bg-green-50 text-green-600 rounded-full active:bg-green-100 disabled:opacity-50 disabled:bg-gray-50 disabled:text-gray-400 transition-all shrink-0 border border-green-100"
            >
              <svg
                className={`w-5 h-5 ${isSyncing ? "animate-spin" : ""}`}
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

          {/* Local Search Bar */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
            <input
              type="text"
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-gray-100 border border-transparent rounded-xl focus:bg-white focus:border-green-500 focus:ring-4 focus:ring-green-50 outline-none text-gray-800 font-bold placeholder-gray-400 transition-all"
            />
          </div>
        </div>

        {/* --- Voter List Area --- */}
        <div className="p-4 flex flex-col gap-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center mt-12 text-gray-500 font-bold">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-3"></div>
              {t.loading}
            </div>
          ) : finalDisplayVoters.length === 0 ? (
            <div className="text-center mt-16 bg-white p-8 rounded-2xl border border-dashed border-gray-200">
              <span className="text-5xl block mb-3 opacity-50">📭</span>
              <p className="text-gray-500 font-bold">{t.noResults}</p>
            </div>
          ) : (
            finalDisplayVoters.map((voter) => (
              <VoterCard
                key={voter.id}
                voter={voter}
                t={t}
                onClick={() => router.push(`/mobile/voters/${voter.id}`)}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
