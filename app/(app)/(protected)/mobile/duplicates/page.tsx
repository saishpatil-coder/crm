"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { localDb, LocalVoter } from "@/lib/db";
import { useLanguage } from "@/context/LanguageContext";
import { useColor, ThemeColor } from "@/context/ColorContext";

const dict = {
  en: {
    title: "Find Duplicates",
    byName: "By Name",
    byEpic: "By EPIC No.",
    noDuplicates: "No duplicates found! 🎉",
    cleanList: "Your voter list looks clean.",
    records: "records",
    booth: "Booth",
    srNo: "SR",
    scanning: "Scanning database...",
  },
  mr: {
    title: "दुप्पट मतदार शोधा",
    byName: "नावानुसार",
    byEpic: "EPIC नुसार",
    noDuplicates: "कोणतेही दुप्पट मतदार सापडले नाहीत! 🎉",
    cleanList: "तुमची मतदार यादी स्वच्छ आहे.",
    records: "नोंदी",
    booth: "केंद्र",
    srNo: "अनु.क्र",
    scanning: "डेटाबेस स्कॅन करत आहे...",
  },
  hi: {
    title: "डुप्लिकेट मतदाता खोजें",
    byName: "नाम से",
    byEpic: "EPIC द्वारा",
    noDuplicates: "कोई डुप्लिकेट नहीं मिला! 🎉",
    cleanList: "आपकी मतदाता सूची साफ है।",
    records: "रिकॉर्ड",
    booth: "बूथ",
    srNo: "क्र",
    scanning: "डेटाबेस स्कैन हो रहा है...",
  },
};

type DuplicateGroup = {
  key: string;
  voters: LocalVoter[];
};

export default function DuplicatesPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const t = dict[lang as keyof typeof dict];
  const { primaryColor } = useColor();

  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<"NAME" | "EPIC">("NAME");
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);

  // Safely fallback to blue if primaryColor isn't ready
  const themeStyles: Record<ThemeColor, string> = {
    blue: "bg-blue-600 text-white",
    green: "bg-emerald-600 text-white",
    orange: "bg-orange-500 text-white",
    purple: "bg-purple-600 text-white",
    red: "bg-red-600 text-white",
  };
  const activeBg =
    themeStyles[primaryColor as ThemeColor]?.split(" ")[0] || "bg-blue-600";

  useEffect(() => {
    let isMounted = true;

    async function findDuplicates() {
      setIsLoading(true);
      try {
        const voters = await localDb.voters.toArray();
        const groups: Record<string, LocalVoter[]> = {};

        voters.forEach((v) => {
          let key = "";
          // Safely cast to string to prevent crashes if a field is null
          if (filterType === "NAME" && v.fullName) {
            key = String(v.fullName).trim().toLowerCase().replace(/\s+/g, " ");
          } else if (filterType === "EPIC" && v.epicNumber) {
            key = String(v.epicNumber).trim().toUpperCase();
          }

          if (!key) return; // Skip empty fields

          if (!groups[key]) groups[key] = [];
          groups[key].push(v);
        });

        const duplicateArrays = Object.entries(groups)
          .filter(([_, group]) => group.length > 1)
          .map(([key, group]) => ({ key, voters: group }))
          .sort((a, b) => b.voters.length - a.voters.length);

        if (isMounted) {
          setDuplicates(duplicateArrays);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error finding duplicates:", error);
        if (isMounted) setIsLoading(false);
      }
    }

    const timer = setTimeout(() => findDuplicates(), 100);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [filterType]);

  return (
    // FIX: Changed from fixed h-[100dvh] to min-h-screen allowing natural scroll
    <div className="min-h-screen bg-gray-100 flex flex-col md:max-w-md md:mx-auto md:shadow-2xl md:border-x border-gray-200">
      {/* --- Sticky Header --- */}
      <div
        className={`${activeBg} px-4 pt-6 pb-4 shadow-md flex items-center gap-3 text-white sticky top-0 z-30`}
      >
        <button
          onClick={() => router.back()}
          className="active:bg-white/20 p-2 rounded-full -ml-2 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-black truncate">{t.title}</h1>
      </div>

      {/* --- Sticky Tabs --- */}
      <div className="bg-white px-4 py-3 shadow-sm flex gap-2 sticky top-[72px] z-20 border-b border-gray-200">
        <button
          onClick={() => setFilterType("NAME")}
          className={`flex-1 h-10 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            filterType === "NAME"
              ? `${activeBg} text-white shadow-md`
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {t.byName}
        </button>
        <button
          onClick={() => setFilterType("EPIC")}
          className={`flex-1 h-10 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            filterType === "EPIC"
              ? `${activeBg} text-white shadow-md`
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {t.byEpic}
        </button>
      </div>

      {/* --- Content Area (Natural Scroll) --- */}
      <div className="p-4 flex flex-col gap-5 pb-32">
        {isLoading ? (
          <div className="flex flex-col justify-center items-center h-40 gap-4 mt-10">
            <div
              className={`w-10 h-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin`}
            ></div>
            <p className="text-sm font-bold text-gray-500 animate-pulse">
              {t.scanning}
            </p>
          </div>
        ) : duplicates.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-sm border border-gray-200 mt-10">
            <span className="text-4xl mb-3">🛡️</span>
            <h2 className="text-lg font-black text-gray-900">
              {t.noDuplicates}
            </h2>
            <p className="text-sm font-bold text-gray-400 mt-1">
              {t.cleanList}
            </p>
          </div>
        ) : (
          /* FIX: Using a guaranteed safe ternary map render */
          duplicates.map((group, index) => (
            <div
              key={`group-${index}`}
              className="bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden"
            >
              {/* Group Header */}
              <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex justify-between items-center">
                <h3 className="font-black text-red-900 text-sm truncate pr-2 uppercase">
                  {filterType === "NAME"
                    ? group.voters[0]?.fullName || "UNKNOWN"
                    : group.key}
                </h3>
                <span className="bg-red-600 text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-sm">
                  {group.voters.length} {t.records}
                </span>
              </div>

              {/* Compact List */}
              <div className="flex flex-col">
                {group.voters.map((voter) => (
                  <div
                    key={voter.id}
                    onClick={() => router.push(`/mobile/voters/${voter.id}`)}
                    className="p-3.5 border-b border-gray-100 last:border-0 bg-white hover:bg-blue-50 active:bg-blue-100 transition-colors cursor-pointer flex justify-between items-center"
                  >
                    <div className="flex flex-col max-w-[75%] gap-1">
                      <p className="text-[15px] font-black text-gray-900 line-clamp-1 leading-tight">
                        {voter.fullName || "No Name"}
                      </p>
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                          {voter.epicNumber || "NO EPIC"}
                        </span>
                        <span className="text-[11px] font-bold text-gray-500">
                          {t.booth}: {voter.pollingStation || "--"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end text-right">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">
                        {t.srNo}
                      </span>
                      <span className="text-sm font-black text-gray-700 bg-gray-100 border border-gray-200 px-2 py-1 rounded-md">
                        {voter.serialNumber || "-"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
