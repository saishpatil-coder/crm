"use client";

import { useEffect, useState, useMemo } from "react";
import { localDb } from "@/lib/db";
import { useLanguage } from "@/context/LanguageContext";
import { useColor, ThemeColor } from "@/context/ColorContext";

// ─── i18n Dictionaries ───────────────────────────────────────────
const dict = {
  en: {
    title: "Live Statistics",
    overview: "Campaign Overview",
    totalAssigned: "Total Voters",
    voted: "Already Voted",
    visited: "Visited",
    pending: "Pending",
    alive: "Alive",
    deceased: "Deceased",
    visitProgress: "Visit Progress",
    votingProgress: "Voting Progress",
    supportBreakdown: "Support Breakdown",
    genderTitle: "Gender Split",
    male: "Male", female: "Female", other: "Other",
    ageTitle: "Age Distribution",
    wardTitle: "Top Wards",
    boothTitle: "Top Polling Stations",
    casteTitle: "Caste Analysis",
    noData: "No data yet",
    voters: "voters",
    levels: { STRONG: "Strong", NEUTRAL: "Neutral", WEAK: "Weak", AGAINST: "Against", UNKNOWN: "Unknown" },
    villageTitle: "Village / City Spread",
  },
  mr: {
    title: "थेट आकडेवारी",
    overview: "मोहिमेचा आढावा",
    totalAssigned: "एकूण मतदार",
    voted: "मतदान झालेले",
    visited: "भेट दिलेले",
    pending: "बाकी",
    alive: "जिवंत",
    deceased: "मृत",
    visitProgress: "भेटीची प्रगती",
    votingProgress: "मतदान प्रगती",
    supportBreakdown: "समर्थन वर्गीकरण",
    genderTitle: "लिंग विभाजन",
    male: "पुरुष", female: "स्त्री", other: "इतर",
    ageTitle: "वय वितरण",
    wardTitle: "प्रमुख वॉर्ड",
    boothTitle: "प्रमुख मतदान केंद्रे",
    casteTitle: "जात विश्लेषण",
    noData: "डेटा उपलब्ध नाही",
    voters: "मतदार",
    levels: { STRONG: "भक्कम", NEUTRAL: "तटस्थ", WEAK: "कमकुवत", AGAINST: "विरोधात", UNKNOWN: "अज्ञात" },
    villageTitle: "गाव / शहर वितरण",
  },
  hi: {
    title: "लाइव आंकड़े",
    overview: "अभियान अवलोकन",
    totalAssigned: "कुल मतदाता",
    voted: "मतदान हो चुका",
    visited: "भेंट की गई",
    pending: "बाकी",
    alive: "जीवित",
    deceased: "मृत",
    visitProgress: "भेंट की प्रगति",
    votingProgress: "मतदान प्रगति",
    supportBreakdown: "समर्थन विवरण",
    genderTitle: "लिंग विभाजन",
    male: "पुरुष", female: "महिला", other: "अन्य",
    ageTitle: "आयु वितरण",
    wardTitle: "प्रमुख वार्ड",
    boothTitle: "प्रमुख मतदान केंद्र",
    casteTitle: "जाति विश्लेषण",
    noData: "कोई डेटा नहीं",
    voters: "मतदाता",
    levels: { STRONG: "मजबूत", NEUTRAL: "तटस्थ", WEAK: "कमजोर", AGAINST: "खिलाफ", UNKNOWN: "अज्ञात" },
    villageTitle: "गांव / शहर वितरण",
  },
};

// ─── Types ───────────────────────────────────────────────────────
interface StatsData {
  total: number;
  visited: number;
  voted: number;
  alive: number;
  deceased: number;
  strong: number;
  neutral: number;
  weak: number;
  against: number;
  unknown: number;
  male: number;
  female: number;
  otherGender: number;
  ageGroups: Record<string, number>;
  wards: Record<string, number>;
  booths: Record<string, { total: number; visited: number }>;
  castes: Record<string, number>;
  villages: Record<string, number>;
}

const initialStats: StatsData = {
  total: 0, visited: 0, voted: 0, alive: 0, deceased: 0,
  strong: 0, neutral: 0, weak: 0, against: 0, unknown: 0,
  male: 0, female: 0, otherGender: 0,
  ageGroups: {}, wards: {}, booths: {}, castes: {}, villages: {},
};

// ═════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════
export default function MobileStatsPage() {
  const { lang } = useLanguage();
  const t = dict[lang as keyof typeof dict];
  const { primaryColor } = useColor();

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<StatsData>(initialStats);

  // Theme
  const themeStyles: Record<ThemeColor, { bg: string; text: string; light: string }> = {
    blue:   { bg: "bg-blue-600",   text: "text-blue-600",   light: "bg-blue-50" },
    green:  { bg: "bg-emerald-600", text: "text-emerald-600", light: "bg-emerald-50" },
    orange: { bg: "bg-orange-500", text: "text-orange-500", light: "bg-orange-50" },
    purple: { bg: "bg-purple-600", text: "text-purple-600", light: "bg-purple-50" },
    red:    { bg: "bg-red-600",    text: "text-red-600",    light: "bg-red-50" },
  };
  const theme = themeStyles[primaryColor] || themeStyles.blue;

  useEffect(() => {
    async function calculateStats() {
      try {
        const dbLangMap: Record<string, string> = {
          en: "English",
          mr: "Marathi",
          hi: "Hindi"
        };
        const dbLang = dbLangMap[lang] || "Marathi";

        let voters = await localDb.voters
          .where('language')
          .equals(dbLang)
          .toArray();

        // If no voters found for primary language, fallback to Marathi
        if (voters.length === 0 && dbLang !== "Marathi") {
          voters = await localDb.voters
            .where('language')
            .equals("Marathi")
            .toArray();
        }

        const s: StatsData = { ...initialStats, ageGroups: {}, wards: {}, booths: {}, castes: {}, villages: {} };
        s.total = voters.length;

        voters.forEach((v) => {
          // Visit & Vote
          if (v.isVisited) s.visited++;
          if (v.hasVoted) s.voted++;

          // Alive
          if (v.isAlive === false) s.deceased++;
          else s.alive++;

          // Support
          if (v.isVisited) {
            const lvl = v.supportLevel?.toUpperCase();
            if (lvl === "STRONG") s.strong++;
            else if (lvl === "NEUTRAL") s.neutral++;
            else if (lvl === "WEAK") s.weak++;
            else if (lvl === "AGAINST" || lvl === "OPPONENT") s.against++;
            else s.unknown++;
          } else {
            s.unknown++;
          }

          // Gender
          const g = v.gender?.toUpperCase();
          if (g === "MALE" || g === "पुरुष") s.male++;
          else if (g === "FEMALE" || g === "स्त्री" || g === "महिला") s.female++;
          else s.otherGender++;

          // Age Groups
          if (v.age) {
            let bucket: string;
            if (v.age <= 25) bucket = "18-25";
            else if (v.age <= 35) bucket = "26-35";
            else if (v.age <= 45) bucket = "36-45";
            else if (v.age <= 60) bucket = "46-60";
            else bucket = "60+";
            s.ageGroups[bucket] = (s.ageGroups[bucket] || 0) + 1;
          }

          // Wards
          const ward = v.ward?.trim();
          if (ward) s.wards[ward] = (s.wards[ward] || 0) + 1;

          // Polling Stations (booth)
          const booth = v.pollingStation?.trim();
          if (booth) {
            if (!s.booths[booth]) s.booths[booth] = { total: 0, visited: 0 };
            s.booths[booth].total++;
            if (v.isVisited) s.booths[booth].visited++;
          }

          // Caste
          const caste = v.caste?.trim();
          if (caste) s.castes[caste] = (s.castes[caste] || 0) + 1;

          // Village/City
          const village = v.cityVillage?.trim();
          if (village) s.villages[village] = (s.villages[village] || 0) + 1;
        });

        setStats(s);
      } catch (error) {
        console.error("Failed to calculate stats", error);
      } finally {
        setIsLoading(false);
      }
    }
    calculateStats();
  }, [lang]);

  // Derived
  const visitPct = stats.total > 0 ? Math.round((stats.visited / stats.total) * 100) : 0;
  const votedPct = stats.total > 0 ? Math.round((stats.voted / stats.total) * 100) : 0;
  const visitedWithSupport = stats.strong + stats.neutral + stats.weak + stats.against;
  const strongPct = visitedWithSupport > 0 ? (stats.strong / visitedWithSupport) * 100 : 0;
  const neutralPct = visitedWithSupport > 0 ? (stats.neutral / visitedWithSupport) * 100 : 0;
  const weakPct = visitedWithSupport > 0 ? (stats.weak / visitedWithSupport) * 100 : 0;
  const againstPct = visitedWithSupport > 0 ? (stats.against / visitedWithSupport) * 100 : 0;

  // Sorted data
  const sortedWards = useMemo(() =>
    Object.entries(stats.wards).sort((a, b) => b[1] - a[1]).slice(0, 8),
    [stats.wards]
  );
  const sortedBooths = useMemo(() =>
    Object.entries(stats.booths)
      .map(([name, d]) => ({ name, ...d, pct: d.total > 0 ? Math.round((d.visited / d.total) * 100) : 0 }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6),
    [stats.booths]
  );
  const sortedCastes = useMemo(() =>
    Object.entries(stats.castes).sort((a, b) => b[1] - a[1]).slice(0, 8),
    [stats.castes]
  );
  const maxWardCount = sortedWards.length > 0 ? sortedWards[0][1] : 1;
  const maxCasteCount = sortedCastes.length > 0 ? sortedCastes[0][1] : 1;

  // Age groups ordered
  const orderedAgeKeys = ["18-25", "26-35", "36-45", "46-60", "60+"];
  const maxAgeCount = Math.max(...orderedAgeKeys.map(k => stats.ageGroups[k] || 0), 1);

  // Gender donut angles
  const genderTotal = stats.male + stats.female + stats.otherGender;
  const malePct = genderTotal > 0 ? (stats.male / genderTotal) * 100 : 0;
  const femalePct = genderTotal > 0 ? (stats.female / genderTotal) * 100 : 0;

  // Village / City
  const sortedVillages = useMemo(() =>
    Object.entries(stats.villages).sort((a, b) => b[1] - a[1]).slice(0, 6),
    [stats.villages]
  );
  const maxVillageCount = sortedVillages.length > 0 ? sortedVillages[0][1] : 1;

  if (isLoading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm font-bold">Loading stats...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col pb-28 md:max-w-md md:mx-auto md:shadow-2xl md:border-x border-gray-200 overflow-y-auto">
      {/* ───── Header ───── */}
      <div className={`${theme.bg} px-5 pt-8 pb-16 text-white rounded-b-[2.5rem] shadow-md shrink-0`}>
        <h1 className="text-2xl font-black mb-1">{t.title}</h1>
        <p className="text-white/80 font-semibold text-sm">{t.overview}</p>
      </div>

      <div className="px-4 -mt-10 flex flex-col gap-4 relative z-10">

        {/* ───── 1. Top KPI Row ───── */}
        <div className="grid grid-cols-3 gap-2.5">
          <KPICard icon="👥" value={stats.total} label={t.totalAssigned} bgIcon="bg-blue-50 text-blue-600" />
          <KPICard icon="✅" value={stats.visited} label={t.visited} bgIcon="bg-green-50 text-green-600" />
          <KPICard icon="🗳️" value={stats.voted} label={t.voted} bgIcon="bg-purple-50 text-purple-600" />
        </div>

        {/* ───── 2. Alive / Deceased mini badges ───── */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
            <span className="text-xl">💚</span>
            <div>
              <p className="text-lg font-black text-gray-900 leading-none">{stats.alive}</p>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t.alive}</p>
            </div>
          </div>
          <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
            <span className="text-xl">🕊️</span>
            <div>
              <p className="text-lg font-black text-gray-900 leading-none">{stats.deceased}</p>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{t.deceased}</p>
            </div>
          </div>
        </div>

        {/* ───── 3. Visit Progress Ring ───── */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <SectionHeader title={t.visitProgress} />
          <div className="flex items-center gap-6">
            <DonutChart pct={visitPct} color="#3b82f6" />
            <div className="flex flex-col gap-3 w-full">
              <StatRow dot="bg-blue-500" label={t.visited} value={stats.visited} />
              <StatRow dot="bg-gray-200" label={t.pending} value={stats.total - stats.visited} />
            </div>
          </div>
        </div>

        {/* ───── 4. Voting Progress Bar ───── */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-end mb-3">
            <SectionHeader title={t.votingProgress} />
            <span className="text-lg font-black text-purple-600">{votedPct}%</span>
          </div>
          <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex">
            <div className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-1000 ease-out rounded-full" style={{ width: `${votedPct}%` }} />
          </div>
          <p className="text-[10px] font-bold text-gray-400 mt-2 text-right">
            {stats.voted} / {stats.total} {t.voters}
          </p>
        </div>

        {/* ───── 5. Gender Split Donut ───── */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <SectionHeader title={t.genderTitle} />
          {genderTotal > 0 ? (
            <div className="flex items-center gap-5">
              <div className="relative w-28 h-28 shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f1f5f9" strokeWidth="3.5" />
                  {/* Male segment */}
                  <circle
                    cx="18" cy="18" r="15.9155" fill="none"
                    stroke="#3b82f6" strokeWidth="3.5"
                    strokeDasharray={`${malePct} ${100 - malePct}`}
                    strokeDashoffset="0"
                    className="transition-all duration-700"
                  />
                  {/* Female segment */}
                  <circle
                    cx="18" cy="18" r="15.9155" fill="none"
                    stroke="#ec4899" strokeWidth="3.5"
                    strokeDasharray={`${femalePct} ${100 - femalePct}`}
                    strokeDashoffset={`${-malePct}`}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black text-gray-900 leading-none">{genderTotal}</span>
                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{t.voters}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2.5 w-full">
                <StatRow dot="bg-blue-500" label={`${t.male} (${Math.round(malePct)}%)`} value={stats.male} />
                <StatRow dot="bg-pink-500" label={`${t.female} (${Math.round(femalePct)}%)`} value={stats.female} />
                {stats.otherGender > 0 && (
                  <StatRow dot="bg-amber-400" label={t.other} value={stats.otherGender} />
                )}
              </div>
            </div>
          ) : (
            <EmptyState text={t.noData} />
          )}
        </div>

        {/* ───── 6. Age Distribution Horizontal Bars ───── */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <SectionHeader title={t.ageTitle} />
          <div className="flex flex-col gap-3 mt-1">
            {orderedAgeKeys.map((key) => {
              const count = stats.ageGroups[key] || 0;
              const pct = maxAgeCount > 0 ? (count / maxAgeCount) * 100 : 0;
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs font-black text-gray-500 w-10 text-right shrink-0">{key}</span>
                  <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-blue-400 rounded-lg transition-all duration-700 ease-out flex items-center justify-end pr-2"
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    >
                      {pct > 15 && (
                        <span className="text-[10px] font-black text-white">{count}</span>
                      )}
                    </div>
                    {pct <= 15 && (
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-500">{count}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ───── 7. Support Breakdown Stacked Bar ───── */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <SectionHeader title={t.supportBreakdown} />
          {visitedWithSupport > 0 ? (
            <>
              <div className="w-full h-8 rounded-xl overflow-hidden flex mb-4 shadow-inner">
                <div className="h-full bg-green-500 transition-all duration-700" style={{ width: `${strongPct}%` }} />
                <div className="h-full bg-blue-400 transition-all duration-700" style={{ width: `${neutralPct}%` }} />
                <div className="h-full bg-orange-400 transition-all duration-700" style={{ width: `${weakPct}%` }} />
                <div className="h-full bg-red-500 transition-all duration-700" style={{ width: `${againstPct}%` }} />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <LegendItem color="bg-green-500" label={t.levels.STRONG} count={stats.strong} pct={Math.round(strongPct)} />
                <LegendItem color="bg-blue-400" label={t.levels.NEUTRAL} count={stats.neutral} pct={Math.round(neutralPct)} />
                <LegendItem color="bg-orange-400" label={t.levels.WEAK} count={stats.weak} pct={Math.round(weakPct)} />
                <LegendItem color="bg-red-500" label={t.levels.AGAINST} count={stats.against} pct={Math.round(againstPct)} />
              </div>
            </>
          ) : (
            <EmptyState text={t.noData} />
          )}
        </div>

        {/* ───── 8. Top Wards ───── */}
        {sortedWards.length > 0 && (
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
            <SectionHeader title={t.wardTitle} />
            <div className="flex flex-col gap-2.5 mt-1">
              {sortedWards.map(([name, count], i) => (
                <div key={name} className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-gray-400 w-4 text-center shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-xs font-bold text-gray-700 truncate pr-2">{name}</span>
                      <span className="text-xs font-black text-gray-900 shrink-0">{count}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-700"
                        style={{ width: `${(count / maxWardCount) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ───── 9. Polling Station Leaderboard ───── */}
        {sortedBooths.length > 0 && (
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
            <SectionHeader title={t.boothTitle} />
            <div className="flex flex-col gap-3 mt-1">
              {sortedBooths.map((booth, i) => (
                <div key={booth.name} className="bg-gray-50 p-3 rounded-2xl border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <span className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-700' : 'bg-gray-300'}`}>
                        {i + 1}
                      </span>
                      <span className="text-xs font-bold text-gray-700 leading-tight">{booth.name}</span>
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase shrink-0 ml-2">
                      {booth.total} {t.voters}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${booth.pct >= 70 ? 'bg-green-500' : booth.pct >= 40 ? 'bg-amber-500' : 'bg-red-400'}`}
                      style={{ width: `${Math.max(booth.pct, 2)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[9px] font-bold text-gray-400">{booth.visited} {t.visited}</span>
                    <span className={`text-[10px] font-black ${booth.pct >= 70 ? 'text-green-600' : booth.pct >= 40 ? 'text-amber-600' : 'text-red-500'}`}>
                      {booth.pct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ───── 10. Caste Analysis ───── */}
        {sortedCastes.length > 0 && (
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
            <SectionHeader title={t.casteTitle} />
            <div className="flex flex-col gap-2.5 mt-1">
              {sortedCastes.map(([name, count]) => (
                <div key={name} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-xs font-bold text-gray-700 truncate pr-2">{name}</span>
                      <span className="text-xs font-black text-gray-900 shrink-0">{count}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full transition-all duration-700"
                        style={{ width: `${(count / maxCasteCount) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ───── 11. Village / City Spread ───── */}
        {sortedVillages.length > 0 && (
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-4">
            <SectionHeader title={t.villageTitle} />
            <div className="flex flex-col gap-2.5 mt-1">
              {sortedVillages.map(([name, count]) => (
                <div key={name} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-xs font-bold text-gray-700 truncate pr-2">{name}</span>
                      <span className="text-xs font-black text-gray-900 shrink-0">{count}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-orange-400 to-amber-400 rounded-full transition-all duration-700"
                        style={{ width: `${(count / maxVillageCount) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═════════════════════════════════════════════════════════════════

function KPICard({ icon, value, label, bgIcon }: { icon: string; value: number; label: string; bgIcon: string }) {
  return (
    <div className="bg-white p-3.5 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
      <div className={`w-9 h-9 ${bgIcon} rounded-full flex items-center justify-center text-lg mb-1.5`}>
        {icon}
      </div>
      <span className="text-2xl font-black text-gray-900 leading-none">{value}</span>
      <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1 leading-tight">{label}</span>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">{title}</h2>;
}

function StatRow({ dot, label, value }: { dot: string; label: string; value: number }) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${dot}`} />
        <span className="text-sm font-bold text-gray-700">{label}</span>
      </div>
      <span className="text-sm font-black text-gray-900">{value}</span>
    </div>
  );
}

function DonutChart({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="relative w-28 h-28 shrink-0">
      <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none" stroke="#f1f5f9" strokeWidth="3.5"
        />
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none" stroke={color} strokeWidth="3.5"
          strokeDasharray={`${pct}, 100`}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-black text-gray-900 leading-none">{pct}%</span>
      </div>
    </div>
  );
}

function LegendItem({ color, label, count, pct }: { color: string; label: string; count: number; pct: number }) {
  return (
    <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${color}`} />
        <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-black text-gray-900">{count}</span>
        <span className="text-[9px] font-bold text-gray-400">({pct}%)</span>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="w-full h-20 rounded-xl bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-400 border border-dashed border-gray-200">
      {text}
    </div>
  );
}
