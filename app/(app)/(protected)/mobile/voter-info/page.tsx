"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { localDb, LocalVoter } from "@/lib/db";
import { useLanguage } from "@/context/LanguageContext";
import { useColor } from "@/context/ColorContext";
import { useOfflineData } from "@/hooks/useOfflineData";
import ClassyLoader from "@/components/ClassyLoader";

const dict = {
  en: {
    title: "Voter Info",
    searchPlaceholder: "Search voter...",
    totalCount: "Total Count",
    booth: "Booth",
    starVoter: "Star Voter",
    voting: "Voting",
    all: "All",
    starOnly: "Starred",
    voted: "Voted",
    notVoted: "Not Voted",
    noVoters: "No voters found for these filters.",
    loading: "Loading Voter Data...",
    colSno: "S.No",
    colType: "Type",
    colName: "Name",
    colVoting: "Voting",
    syncing: "Syncing...",
  },
  mr: {
    title: "मतदार इन्फो",
    searchPlaceholder: "मतदार शोधा...",
    totalCount: "एकूण संख्या",
    booth: "बूथ",
    starVoter: "स्टार मतदार",
    voting: "मतदान",
    all: "सर्व",
    starOnly: "स्टार",
    voted: "मतदान केलेले",
    notVoted: "मतदान न केलेले",
    noVoters: "या फिल्टरसह कोणतेही मतदार सापडले नाहीत.",
    loading: "मतदार डेटा लोड करत आहे...",
    colSno: "अ.क्र",
    colType: "प्रकार",
    colName: "नाव",
    colVoting: "मतदान",
    syncing: "सिंक होत आहे...",
  },
  hi: {
    title: "मतदाता जानकारी",
    searchPlaceholder: "मतदाता खोजें...",
    totalCount: "कुल संख्या",
    booth: "बूथ",
    starVoter: "स्टार मतदाता",
    voting: "मतदान",
    all: "सभी",
    starOnly: "स्टार",
    voted: "मतदान किया",
    notVoted: "मतदान नहीं किया",
    noVoters: "इन फिल्टर के साथ कोई मतदाता नहीं मिला।",
    loading: "मतदाता डेटा लोड हो रहा है...",
    colSno: "क्र.सं.",
    colType: "प्रकार",
    colName: "नाम",
    colVoting: "मतदान",
    syncing: "सिंक हो रहा है...",
  },
};

export default function VoterInfoPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const { primaryColor } = useColor();
  const t = dict[lang as keyof typeof dict];

  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(20);
  const observerTarget = useRef<HTMLDivElement>(null);
  
  // Filters
  const [selectedBooth, setSelectedBooth] = useState<string>("all");
  const [starFilter, setStarFilter] = useState<"all" | "star">("all");
  const [votingFilter, setVotingFilter] = useState<"all" | "voted" | "notVoted">("all");

  const [localData, setLocalData] = useState<LocalVoter[]>([]);
  
  // Use the standard offline data hook for background syncing
  const dexieQuery = useCallback(async () => {
    return await localDb.voters.toArray();
  }, []);

  const {
    data: allOfflineVoters,
    isLoading,
    isSyncing,
    refresh
  } = useOfflineData<LocalVoter>(
    `/api/voters?lang=${lang}`, 
    "voters", 
    dexieQuery
  );

  // Synchronize local state with hook data
  useEffect(() => {
    if (allOfflineVoters) {
      setLocalData(allOfflineVoters);
    }
  }, [allOfflineVoters]);

  const availableBooths = useMemo(() => {
    const booths = Array.from(new Set(allOfflineVoters.map(v => v.pollingStation).filter(Boolean))) as string[];
    return booths.sort();
  }, [allOfflineVoters]);

  // Reset pagination on filter change
  useEffect(() => {
    setVisibleCount(20);
  }, [searchQuery, selectedBooth, starFilter, votingFilter]);

  // Infinite Scroll Observer
  useEffect(() => {
    if (isLoading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 20);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) observer.observe(currentTarget);
    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [isLoading, localData.length]);

  // Filter Logic
  const filteredVoters = useMemo(() => {
    return localData.filter((voter) => {
      // 1. Search Query
      if (searchQuery && !voter.fullName.toLowerCase().includes(searchQuery.toLowerCase()) && !voter.epicNumber.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // 2. Booth Filter
      if (selectedBooth !== "all" && voter.pollingStation !== selectedBooth) {
        return false;
      }
      // 3. Star Filter
      if (starFilter === "star" && !voter.isStar) {
        return false;
      }
      // 4. Voting Status Filter
      if (votingFilter === "voted" && !voter.hasVoted) return false;
      if (votingFilter === "notVoted" && voter.hasVoted) return false;

      return true;
    });
  }, [localData, searchQuery, selectedBooth, starFilter, votingFilter]);

  const currentlyVisibleVoters = useMemo(() => {
    return filteredVoters.slice(0, visibleCount);
  }, [filteredVoters, visibleCount]);

  // Actions
  const toggleStar = async (id: number, current: boolean) => {
    try {
      const updated = { isStar: !current };
      await localDb.voters.update(id, updated);
      
      // OPTIMISTIC UI update
      setLocalData(prev => prev.map(v => v.id === id ? { ...v, ...updated } : v));

      // ADD TO SYNC QUEUE
      const fullVoter = localData.find(v => v.id === id);
      if (fullVoter) {
        await localDb.syncQueue.add({
          action: 'UPDATE_VOTER',
          payload: { ...fullVoter, ...updated },
          createdAt: Date.now()
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleVoted = async (id: number, current: boolean) => {
    try {
      const updated = { hasVoted: !current };
      await localDb.voters.update(id, updated);
      
      // OPTIMISTIC UI update
      setLocalData(prev => prev.map(v => v.id === id ? { ...v, ...updated } : v));

      // ADD TO SYNC QUEUE
      const fullVoter = localData.find(v => v.id === id);
      if (fullVoter) {
        await localDb.syncQueue.add({
          action: 'UPDATE_VOTER',
          payload: { ...fullVoter, ...updated },
          createdAt: Date.now()
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCall = (mobile: string | null) => {
    if (mobile) window.location.href = `tel:${mobile}`;
    else alert("Mobile number not available.");
  };

  if (isLoading && localData.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <ClassyLoader size={60} color="#f97316" />
        <p className="mt-4 font-black text-orange-600 animate-pulse">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:max-w-md md:mx-auto relative pb-[140px]">
      {/* --- Header --- */}
      <div className="bg-orange-500 px-4 pt-6 pb-4 shadow-lg sticky top-0 z-40 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="p-1.5 active:bg-white/20 rounded-lg transition-colors">
            <GearIcon className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-black leading-tight">{t.title}</h1>
            {isSyncing && (
              <p className="text-[9px] font-black uppercase tracking-widest text-orange-200 animate-pulse">
                {t.syncing}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="p-1.5 active:bg-white/20 rounded-lg transition-colors">
            <CloseIcon className="w-6 h-6" />
          </button>
          <button onClick={refresh} className={`p-1.5 active:bg-white/20 rounded-lg transition-colors ${isSyncing ? "animate-spin" : ""}`}>
            <SyncIcon className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* --- Filter Bar Area --- */}
      <div className="bg-white p-3 shadow-sm border-b border-gray-200 sticky top-[72px] z-30 flex flex-col gap-3">
        {/* Booth Selector */}
        <div className="relative">
          <select 
            value={selectedBooth}
            onChange={(e) => setSelectedBooth(e.target.value)}
            className="w-full h-12 pl-4 pr-10 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 appearance-none focus:ring-2 focus:ring-orange-200 outline-none"
          >
            <option value="all">सर्व बूथ (All Booths)</option>
            {availableBooths.map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
          <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</span>
        </div>

        {/* Filters Row */}
        <div className="flex gap-2">
          <div className="flex-1 flex flex-col gap-1">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter px-1">
              {t.starVoter}
             </label>
             <select 
                value={starFilter}
                onChange={(e) => setStarFilter(e.target.value as any)}
                className="h-10 bg-gray-50 border border-gray-200 rounded-lg px-2 text-xs font-bold"
             >
                <option value="all">{t.all}</option>
                <option value="star">{t.starOnly}</option>
             </select>
          </div>
          <div className="flex-1 flex flex-col gap-1">
             <label className="text-[10px] font-black text-gray-400 uppercase tracking-tighter px-1">
              {t.voting}
             </label>
             <select 
                value={votingFilter}
                onChange={(e) => setVotingFilter(e.target.value as any)}
                className="h-10 bg-gray-50 border border-gray-200 rounded-lg px-2 text-xs font-bold"
             >
                <option value="all">{t.all}</option>
                <option value="voted">{t.voted}</option>
                <option value="notVoted">{t.notVoted}</option>
             </select>
          </div>
        </div>
      </div>

      {/* --- Column Headers --- */}
      <div className="grid grid-cols-[40px_60px_1fr_60px] px-4 py-2 border-b border-gray-200 bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest sticky top-[192px] z-30">
        <div>{t.colSno}</div>
        <div>{t.colType}</div>
        <div>{t.colName}</div>
        <div className="text-right">{t.colVoting}</div>
      </div>

      {/* --- Voter List --- */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
        {currentlyVisibleVoters.length === 0 ? (
          <div className="text-center py-20 text-gray-400 font-bold">{t.noVoters}</div>
        ) : (
          <>
            {currentlyVisibleVoters.map((voter, index) => (
              <div 
                key={voter.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex items-center h-[72px]"
              >
                <div className="w-10 flex items-center justify-center text-[10px] font-black text-gray-400 border-r border-gray-100">
                  {voter.serialNumber || index + 1}
                </div>
                <div className="w-12 flex items-center justify-center gap-1 border-r border-gray-100 px-1">
                   <div className={`w-3 h-3 rounded-full shrink-0 ${getCategoryColor(voter.supportLevel)}`}></div>
                   <span className="text-lg">👤</span>
                </div>
                <div className="flex-1 px-3 overflow-hidden min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm truncate uppercase tracking-tight">{voter.fullName}</h3>
                  <p className="text-[9px] font-black text-gray-400 truncate">{voter.epicNumber}</p>
                </div>
                <div className="flex items-center gap-2 pr-3">
                   <button 
                    onClick={() => handleCall(voter.mobileNumber)}
                    className="p-1 text-blue-600 active:scale-90 transition-transform"
                   >
                     <CallIcon className="w-6 h-6" />
                   </button>
                   <button 
                    onClick={() => toggleStar(voter.id, voter.isStar)}
                    className={`p-1 active:scale-95 transition-all ${voter.isStar ? "text-yellow-500 scale-125" : "text-gray-300"}`}
                   >
                     <StarIcon className="w-6 h-6" fill={voter.isStar ? "currentColor" : "none"} />
                   </button>
                   <div className="w-7 h-7 flex items-center justify-center">
                     <button 
                      onClick={() => toggleVoted(voter.id, voter.hasVoted)}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${voter.hasVoted ? "bg-green-600 border-green-600 text-white" : "bg-white border-gray-300"}`}
                     >
                       {voter.hasVoted && "✓"}
                     </button>
                   </div>
                </div>
              </div>
            ))}
            
            {/* --- Infinite Scroll Target --- */}
            {visibleCount < filteredVoters.length && (
              <div 
                ref={observerTarget}
                className="w-full py-6 flex justify-center items-center text-gray-400 font-bold text-xs gap-3"
              >
                <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading more...</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* --- Footer Controls --- */}
      <div className="fixed bottom-16 left-0 right-0 md:max-w-md md:mx-auto bg-white border-t border-gray-200 shadow-[0_-8px_30px_-5px_rgba(0,0,0,0.1)] z-40">
        {/* Count Bar */}
        <div className="bg-gray-100 py-1.5 px-4 text-center">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              {t.totalCount} : {filteredVoters.length.toLocaleString()}
            </span>
        </div>
        
        {/* Search Bar Row */}
        <div className="p-3 flex items-center gap-2 bg-white">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input 
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-4 bg-gray-100 border border-transparent rounded-2xl font-bold text-gray-800 placeholder-gray-400 focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-50 outline-none transition-all shadow-inner"
            />
          </div>
          <button className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform">
            <MicIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

function getCategoryColor(level: string) {
  switch (level?.toUpperCase()) {
    case "STRONG": return "bg-green-500";
    case "WEAK": return "bg-orange-400";
    case "AGAINST": return "bg-red-500";
    case "OPPONENT": return "bg-red-500";
    default: return "bg-purple-600";
  }
}

// --- Icons ---
function GearIcon({ className }: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function SyncIcon({ className }: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function CloseIcon({ className }: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function StarIcon({ className, fill = "none" }: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill={fill} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

function CallIcon({ className }: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function MicIcon({ className }: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  );
}
