"use client";

import ClassyLoader from "@/components/ClassyLoader";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useOfflineData } from "@/hooks/useOfflineData";
import { LocalTenant } from "@/lib/db";
import { useRouter } from "next/navigation";

const dict = {
  en: {
    title: "My Campaign",
    syncing: "Syncing...",
    synced: "Synced",
    independent: "Independent",
    constituency: "Constituency",
    workers: "Ground Workers",
    voters: "Registered Voters",
    management: "Management",
    addWorker: "Add New Worker",
    addWorkerSub: "Create account & set password",
    viewWorkers: "View All Workers",
    viewWorkersSub: "Manage existing team members",
  },
  mr: {
    title: "माझी मोहीम",
    syncing: "सिंक होत आहे...",
    synced: "सिंक झाले",
    independent: "अपक्ष",
    constituency: "मतदारसंघ",
    workers: "कार्यकर्ते",
    voters: "नोंदणीकृत मतदार",
    management: "व्यवस्थापन",
    addWorker: "नवीन कार्यकर्ता जोडा",
    addWorkerSub: "खाते तयार करा आणि पासवर्ड सेट करा",
    viewWorkers: "सर्व कार्यकर्ते पहा",
    viewWorkersSub: "विद्यमान टीम सदस्य व्यवस्थापित करा",
  },
  hi: {
    title: "मेरा अभियान",
    syncing: "सिंक हो रहा है...",
    synced: "सिंक किया गया",
    independent: "स्वतंत्र",
    constituency: "निर्वाचन क्षेत्र",
    workers: "कार्यकर्ता",
    voters: "पंजीकृत मतदाता",
    management: "प्रबंधन",
    addWorker: "नया कार्यकर्ता जोड़ें",
    addWorkerSub: "खाता बनाएं और पासवर्ड सेट करें",
    viewWorkers: "सभी कार्यकर्ता देखें",
    viewWorkersSub: "मौजूदा टीम के सदस्यों को प्रबंधित करें",
  },
};

export default function SubAdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { lang } = useLanguage();
  const t = dict[lang as keyof typeof dict];

  // Fetch from the standard /api/tenants route!
  // It will automatically store this single record in the local 'tenants' table.
  const {
    data: tenants,
    isLoading,
    refresh,
    isSyncing,
    lastSyncedText,
  } = useOfflineData<LocalTenant>("/tenants", "tenants");

  // Since the API returns an array of one, we grab the first item.
  const campaign = tenants?.[0] || ({} as any);
  const workersCount = campaign._count?.users || 0;
  const votersCount = campaign._count?.voters || 0;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* 1. Header & Sync Status */}
      <div className="flex justify-between items-end mb-2">
        <div>
          <h1 className="text-2xl font-black text-gray-900 leading-tight">
            {t.title}
          </h1>
          <p className="text-xs font-bold text-gray-400 mt-1">
            {isSyncing ? t.syncing : `${t.synced}: ${lastSyncedText}`}
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={isSyncing}
          className="p-2 bg-gray-200 text-gray-700 rounded-full active:bg-gray-300 transition-colors"
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
      </div>

      {/* 2. Candidate Info Card */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full z-0"></div>

        <div className="w-16 h-16 bg-blue-100 rounded-full border-2 border-white shadow-sm flex-shrink-0 flex items-center justify-center overflow-hidden z-10">
          {campaign.candidatePhotoUrl ? (
            <img
              src={campaign.candidatePhotoUrl}
              alt="Candidate"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl">👤</span>
          )}
        </div>

        <div className="z-10">
          <h2 className="text-lg font-black text-gray-900 leading-tight">
            {campaign.candidateName || user?.name || "Loading..."}
          </h2>
          <p className="text-sm font-bold text-gray-500">
            {campaign.partyName || t.independent}
          </p>
          <div className="mt-1 inline-block px-2 py-0.5 bg-blue-50 border border-blue-100 rounded text-[10px] font-extrabold text-blue-700 uppercase tracking-wider">
            {campaign.constituencyName || t.constituency}
          </div>
        </div>
      </div>

      {/* 3. Live Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
          <span className="text-3xl mb-1">👥</span>
          <h3 className="text-2xl font-black text-gray-900">
            {isLoading ? "-" : workersCount}
          </h3>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
            {t.workers}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
          <span className="text-3xl mb-1">🗳️</span>
          <h3 className="text-2xl font-black text-gray-900">
            {isLoading ? "-" : votersCount}
          </h3>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
            {t.voters}
          </p>
        </div>
      </div>

      {/* 4. Action Center */}
      <div className="mt-2 flex flex-col gap-3">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b-2 border-gray-200 pb-2">
          {t.management}
        </h3>

        {/* ADD WORKER BUTTON */}
        <button
          onClick={() => router.push("/dashboard/workers/add")}
          className="w-full bg-blue-600 text-white p-4 rounded-2xl shadow-[0_8px_16px_-6px_rgba(37,99,235,0.4)] active:scale-[0.98] transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">
              +
            </div>
            <div className="text-left">
              <h4 className="font-black text-lg leading-tight">
                {t.addWorker}
              </h4>
              <p className="text-blue-200 text-xs font-semibold">
                {t.addWorkerSub}
              </p>
            </div>
          </div>
          <span className="text-white font-bold opacity-50">→</span>
        </button>

        {/* MANAGE WORKERS BUTTON */}
        <button
          onClick={() => router.push("/dashboard/workers")}
          className="w-full bg-white text-gray-800 border-2 border-gray-200 p-4 rounded-2xl active:bg-gray-50 active:scale-[0.98] transition-all flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl">
              📋
            </div>
            <div className="text-left">
              <h4 className="font-black text-lg leading-tight">
                {t.viewWorkers}
              </h4>
              <p className="text-gray-400 text-xs font-bold">
                {t.viewWorkersSub}
              </p>
            </div>
          </div>
          <span className="text-gray-400 font-bold">→</span>
        </button>
      </div>
    </div>
  );
}
