"use client";

import { useLanguage } from "@/context/LanguageContext";
import { localDb } from "@/lib/db";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const dict = {
  en: {
    title: "Browse by Village",
    subtitle: "Select a village to view its voters",
    unknown: "Unknown Village",
    voters: "Voters",
    loading: "Calculating village data...",
  },
  mr: {
    title: "गावानुसार शोधा",
    subtitle: "मतदार पाहण्यासाठी गाव निवडा",
    unknown: "अज्ञात गाव",
    voters: "मतदार",
    loading: "गावाचा डेटा मोजत आहे...",
  },
  hi: {
    title: "गाँव के अनुसार खोजें",
    subtitle: "मतदाताओं को देखने के लिए गाँव चुनें",
    unknown: "अज्ञात गाँव",
    voters: "मतदाता",
    loading: "गाँव के डेटा की गणना की जा रही है...",
  },
};

interface VillageGroup {
  name: string;
  count: number;
}

export default function ByVillagePage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const t = dict[lang as keyof typeof dict];

  const [villages, setVillages] = useState<VillageGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function groupVotersByVillage() {
      try {
        // Fetch all voters offline from Dexie
        const allVoters = await localDb.voters.toArray();
        console.log(allVoters[0])
        // Group and count them
        const villageMap: Record<string, number> = {};

        allVoters.forEach((voter) => {
          const vName = voter.cityVillage?.trim() || t.unknown;
          if (!villageMap[vName]) {
            villageMap[vName] = 0;
          }
          villageMap[vName]++;
        });

        // Convert the object into a sorted array (highest voters first)
        const sortedVillages = Object.keys(villageMap)
          .map((key) => ({
            name: key,
            count: villageMap[key],
          }))
          .sort((a, b) => b.count - a.count); // Sort descending

        setVillages(sortedVillages);
      } catch (error) {
        console.error("Failed to group voters:", error);
      } finally {
        setIsLoading(false);
      }
    }

    groupVotersByVillage();
  }, [t.unknown]);

  const goToVillage = (villageName: string) => {
    // Navigate to the main list, passing the village name in the URL
    router.push(`/worker/voters?village=${encodeURIComponent(villageName)}`);
  };

  return (
    <div className="bg-gray-100 flex flex-col">
      {" "}
      {/* Header */}
      <div className="bg-white px-4 pt-6 pb-4 shadow-sm sticky top-0 z-10 border-b border-gray-100 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-gray-500 font-bold active:bg-gray-100 p-2 rounded-full -ml-2"
        >
          ←
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 leading-tight">
            {t.title}
          </h1>
          <p className="text-xs font-bold text-gray-500 mt-0.5">{t.subtitle}</p>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center mt-10 text-gray-500 font-bold">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            {t.loading}
          </div>
        ) : villages.length === 0 ? (
          <p className="text-center text-gray-500 mt-10 font-bold">
            No data available offline.
          </p>
        ) : (
          villages.map((village, idx) => (
            <button
              key={idx}
              onClick={() => goToVillage(village.name)}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:bg-blue-50 transition-colors flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl shrink-0">
                  🏘️
                </div>
                <div>
                  <h2 className="font-black text-gray-900 text-lg leading-tight">
                    {village.name}
                  </h2>
                  <p className="text-[11px] font-black text-blue-600 uppercase tracking-widest mt-1">
                    {village.count} {t.voters}
                  </p>
                </div>
              </div>
              <span className="text-gray-300 font-black text-xl">→</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
