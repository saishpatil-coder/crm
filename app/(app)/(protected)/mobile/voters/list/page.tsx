"use client";

import CurvedHeader from "@/components/CurvedHeader";
import { useLanguage } from "@/context/LanguageContext";
import { localDb } from "@/lib/db";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import ClassyLoader from "@/components/ClassyLoader";

const dict = {
  en: {
    loading: "Grouping data...",
    unknown: "Unknown",
    voters: "Voters",
    noData: "No data available.",
    titles: {
      village: "Browse by Village",
      ward: "Browse by Ward",
      pollingStation: "Browse by Booth",
      firstName: "Browse by First Name",
      lastName: "Browse by Surname",
      gender: "Browse by Gender",
      caste: "Browse by Caste",
      ageGroup: "Browse by Age Group",
      default: "Browse Voters",
      firstLetter: "Browse A-Z",
    },
  },
  mr: {
    loading: "डेटा गटबद्ध करत आहे...",
    unknown: "अज्ञात",
    voters: "मतदार",
    noData: "डेटा उपलब्ध नाही.",
    titles: {
      village: "गावानुसार शोधा",
      ward: "वार्डानुसार शोधा",
      pollingStation: "मतदान केंद्रानुसार शोधा",
      firstName: "पहिल्या नावानुसार शोधा",
      lastName: "आडनावानुसार शोधा",
      gender: "लिंगानुसार शोधा",
      caste: "जातीनुसार शोधा",
      ageGroup: "वयोगटानुसार शोधा",
      default: "मतदार शोधा",
      firstLetter: "अक्षरावरून शोधा",
    },
  },
  hi: {
    loading: "डेटा समूहीकृत किया जा रहा है...",
    unknown: "अज्ञात",
    voters: "मतदाता",
    noData: "डेटा उपलब्ध नहीं है।",
    titles: {
      village: "गाँव के अनुसार",
      ward: "वार्ड के अनुसार",
      pollingStation: "बूथ के अनुसार",
      firstName: "प्रथम नाम के अनुसार",
      lastName: "उपनाम के अनुसार",
      gender: "लिंग के अनुसार",
      caste: "जाति के अनुसार",
      ageGroup: "आयु वर्ग के अनुसार",
      firstLetter: "अक्षर के अनुसार खोजें",
      default: "मतदाता खोजें",
    },
  },
};

interface GroupData {
  name: string;
  count: number;
}

export default function DynamicFilterListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filterBy = searchParams.get("filterBy") || "";

  const { lang } = useLanguage();
  const t = dict[lang as keyof typeof dict];

  const [groups, setGroups] = useState<GroupData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [visibleCount, setVisibleCount] = useState(20);
  const observerTarget = useRef<HTMLDivElement>(null);

  // Reset the visible count back to 20 if the filter changes
  useEffect(() => {
    setVisibleCount(20);
  }, [filterBy]);

  // The Intersection Observer: Triggers when the user scrolls to the bottom
  useEffect(() => {
    // 1. CRITICAL: Don't try to observe anything until the initial data is done loading
    if (isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 20); 
        }
      },
      { threshold: 0.1 } 
    );

    // 2. Safely capture the current div reference
    const currentTarget = observerTarget.current;

    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      // 3. Clean up the specific element we observed
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [isLoading, groups.length]);

  const currentlyVisibleGroups = groups.slice(0, visibleCount);

  // Get localized title dynamically based on the param
  const pageTitle = (t.titles as any)[filterBy] || t.titles.default;

  useEffect(() => {
    async function processVoterData() {
      // SMART ROUTING: If they clicked a status, skip grouping and go directly to the final list
      if (filterBy === "visited" || filterBy === "pending") {
        router.replace(`/mobile/voters?status=${filterBy}`);
        return;
      }

      try {
        const dbLangMap: Record<string, string> = {
          en: "English",
          mr: "Marathi",
          hi: "Hindi"
        };
        const dbLang = dbLangMap[lang] || "Marathi";

        // 1. Fetch voters matching the current language
        let allVoters = await localDb.voters
          .where('language')
          .equals(dbLang)
          .toArray();

        // If no voters found for primary language, fallback to Marathi
        if (allVoters.length === 0 && dbLang !== "Marathi") {
          allVoters = await localDb.voters
            .where('language')
            .equals("Marathi")
            .toArray();
        }

        const groupMap: Record<string, number> = {};

        // 2. Loop through and group them dynamically based on the requested filter
        allVoters.forEach((voter: any) => {
          let key = t.unknown;
          switch (filterBy) {
            case "village":
              key = voter.cityVillage?.trim() || t.unknown;
              break;
            case "ward":
              key = voter.ward?.trim() || t.unknown;
              break;
            case "pollingStation":
              key = voter.pollingStation?.trim() || t.unknown;
              break;
            case "firstLetter":
              // Grabs the very first character of the full name and capitalizes it
              key = voter.fullName?.trim().charAt(0).toUpperCase() || t.unknown;
              break;
            case "firstName":
              key = voter.fullName?.split(" ")[0]?.trim() || t.unknown;
              break;
            case "lastName":
              const nameParts = voter.fullName?.split(" ");
              key =
                nameParts?.length > 1
                  ? nameParts[nameParts.length - 1].trim()
                  : t.unknown;
              break;
            case "gender":
              key =
                voter.gender === "MALE"
                  ? "Male"
                  : voter.gender === "FEMALE"
                    ? "Female"
                    : voter.gender || t.unknown;
              break;
            case "caste":
              key = voter.caste?.trim() || t.unknown;
              break;
            case "ageGroup":
              if (!voter.age) {
                key = t.unknown;
              } else if (voter.age <= 25) {
                key = "18-25";
              } else if (voter.age <= 40) {
                key = "26-40";
              } else if (voter.age <= 60) {
                key = "41-60";
              } else {
                key = "60+";
              }
              break;
          }

          if (!groupMap[key]) groupMap[key] = 0;
          groupMap[key]++;
        });

        // 3. Convert map to array and sort by count (highest first)
        const sortedGroups = Object.keys(groupMap)
          .map((name) => ({ name, count: groupMap[name] }))
          .sort((a, b) => {
            if (a.name === t.unknown) return 1; // Always push "Unknown" to the bottom
            if (b.name === t.unknown) return -1;
            return b.count - a.count;
          });

        setGroups(sortedGroups);
      } catch (error) {
        console.error("Failed to group voters:", error);
      } finally {
        setIsLoading(false);
      }
    }

    processVoterData();
  }, [filterBy, router, t.unknown, lang]);

  // When a group is clicked, navigate to the main list with BOTH params
  const handleGroupClick = (groupName: string) => {
    // e.g., /mobile/voters?village=Nandre
    router.push(`/mobile/voters?${filterBy}=${encodeURIComponent(groupName)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24 md:max-w-md md:mx-auto md:border-x border-gray-200">
      {/* --- Header --- */}
    
       <CurvedHeader
       size={28}
              title={pageTitle}
            />

      <div className="p-4 flex flex-col gap-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center mt-12 text-gray-500 font-bold">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            {t.loading}
          </div>
        ) : groups.length === 0 ? (
          <p className="text-center text-gray-500 mt-10 font-bold">
            {t.noData}
          </p>
        ) : (
          <>
            {currentlyVisibleGroups.map((group, idx) => (
              <button
                key={idx}
                onClick={() => handleGroupClick(group.name)}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:bg-blue-50 transition-colors flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-lg font-black shrink-0 border border-blue-100">
                    {group.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-black text-gray-900 text-base leading-tight">
                      {group.name}
                    </h2>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-0.5">
                      {group.count} {t.voters}
                    </p>
                  </div>
                </div>
                <span className="text-gray-300 font-black text-xl group-active:text-blue-500 transition-colors">
                  →
                </span>
              </button>
            ))}
            {visibleCount < groups.length && (
              <div 
                ref={observerTarget} 
                className="w-full py-6 flex justify-center items-center text-gray-400 font-bold text-sm"
              >
                <ClassyLoader size={30} color="#09ff09" />
                <span className="ml-2">Loading more...</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
