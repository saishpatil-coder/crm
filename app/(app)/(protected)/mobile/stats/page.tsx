"use client";

import { useEffect, useState } from "react";
import { localDb } from "@/lib/db";
import { useLanguage } from "@/context/LanguageContext";
import { useColor, ThemeColor } from "@/context/ColorContext";

const dict = {
  en: {
    title: "Live Statistics",
    overview: "Campaign Overview",
    totalAssigned: "Total Assigned",
    voted: "Already Voted",
    visitProgress: "Visit Progress",
    visited: "Visited",
    pending: "Pending",
    supportBreakdown: "Support Breakdown",
    levels: {
      STRONG: "Strong",
      NEUTRAL: "Neutral",
      WEAK: "Weak",
      AGAINST: "Against",
      UNKNOWN: "Unknown",
    },
  },
  mr: {
    title: "थेट आकडेवारी",
    overview: "मोहिमेचा आढावा",
    totalAssigned: "एकूण नेमून दिलेले",
    voted: "मतदान झालेले",
    visitProgress: "भेटीची प्रगती",
    visited: "भेट दिलेले",
    pending: "बाकी",
    supportBreakdown: "समर्थन वर्गीकरण",
    levels: {
      STRONG: "भक्कम",
      NEUTRAL: "तटस्थ",
      WEAK: "कमकुवत",
      AGAINST: "विरोधात",
      UNKNOWN: "अज्ञात",
    },
  },
  hi: {
    title: "लाइव आंकड़े",
    overview: "अभियान अवलोकन",
    totalAssigned: "कुल सौंपे गए",
    voted: "मतदान हो चुका",
    visitProgress: "भेंट की प्रगति",
    visited: "भेंट की गई",
    pending: "बाकी",
    supportBreakdown: "समर्थन विवरण",
    levels: {
      STRONG: "मजबूत",
      NEUTRAL: "तटस्थ",
      WEAK: "कमजोर",
      AGAINST: "खिलाफ",
      UNKNOWN: "अज्ञात",
    },
  },
};

interface StatsData {
  total: number;
  visited: number;
  voted: number;
  strong: number;
  neutral: number;
  weak: number;
  against: number;
  unknown: number;
}

export default function MobileStatsPage() {
  const { lang } = useLanguage();
  const t = dict[lang as keyof typeof dict];
  const { primaryColor } = useColor();

  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<StatsData>({
    total: 0,
    visited: 0,
    voted: 0,
    strong: 0,
    neutral: 0,
    weak: 0,
    against: 0,
    unknown: 0,
  });

  // Theme mapping for header
  const themeStyles: Record<ThemeColor, string> = {
    blue: "bg-blue-600",
    green: "bg-emerald-600",
    orange: "bg-orange-500",
    purple: "bg-purple-600",
    red: "bg-red-600",
  };
  const themeBg = themeStyles[primaryColor] || themeStyles.blue;

  useEffect(() => {
    async function calculateStats() {
      try {
        const voters = await localDb.voters.toArray();

        let s = {
          total: voters.length,
          visited: 0,
          voted: 0,
          strong: 0,
          neutral: 0,
          weak: 0,
          against: 0,
          unknown: 0,
        };

        voters.forEach((v) => {
          if (v.isVisited) s.visited++;
          if (v.hasVoted) s.voted++;

          if (v.isVisited) {
            if (v.supportLevel === "STRONG") s.strong++;
            else if (v.supportLevel === "NEUTRAL") s.neutral++;
            else if (v.supportLevel === "WEAK") s.weak++;
            else if (v.supportLevel === "AGAINST") s.against++;
            else s.unknown++;
          } else {
            s.unknown++;
          }
        });

        setStats(s);
      } catch (error) {
        console.error("Failed to calculate stats", error);
      } finally {
        setIsLoading(false);
      }
    }

    calculateStats();
  }, []);

  if (isLoading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  // Math for charts
  const visitPct =
    stats.total > 0 ? Math.round((stats.visited / stats.total) * 100) : 0;
  const votedPct =
    stats.total > 0 ? Math.round((stats.voted / stats.total) * 100) : 0;

  const visitedWithSupport =
    stats.strong + stats.neutral + stats.weak + stats.against;
  const strongPct =
    visitedWithSupport > 0 ? (stats.strong / visitedWithSupport) * 100 : 0;
  const neutralPct =
    visitedWithSupport > 0 ? (stats.neutral / visitedWithSupport) * 100 : 0;
  const weakPct =
    visitedWithSupport > 0 ? (stats.weak / visitedWithSupport) * 100 : 0;
  const againstPct =
    visitedWithSupport > 0 ? (stats.against / visitedWithSupport) * 100 : 0;

  return (
    <div className="min-h-dvh bg-gray-50 flex flex-col pb-28 md:max-w-md md:mx-auto md:shadow-2xl md:border-x border-gray-200 overflow-y-auto">
      {/* Header */}
      <div
        className={`${themeBg} px-5 pt-8 pb-16 text-white rounded-b-[2.5rem] shadow-md shrink-0`}
      >
        <h1 className="text-2xl font-black mb-1">{t.title}</h1>
        <p className="text-white/80 font-semibold text-sm">{t.overview}</p>
      </div>

      <div className="px-4 -mt-10 flex flex-col gap-4 relative z-10">
        {/* --- Top 2 Metric Cards --- */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xl mb-2">
              👥
            </div>
            <span className="text-3xl font-black text-gray-900 leading-none">
              {stats.total}
            </span>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
              {t.totalAssigned}
            </span>
          </div>

          <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-center items-center text-center">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center text-xl mb-2">
              🗳️
            </div>
            <span className="text-3xl font-black text-gray-900 leading-none">
              {stats.voted}
            </span>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
              {t.voted}
            </span>
          </div>
        </div>

        {/* --- Circular SVG Chart (Visit Progress) --- */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
            {t.visitProgress}
          </h2>

          <div className="flex items-center gap-6">
            {/* The SVG Donut */}
            <div className="relative w-28 h-28 shrink-0">
              <svg
                viewBox="0 0 36 36"
                className="w-full h-full transform -rotate-90"
              >
                {/* Background Track */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="3.5"
                />
                {/* Progress Fill */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3.5"
                  strokeDasharray={`${visitPct}, 100`}
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              {/* Inner Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-gray-900 leading-none">
                  {visitPct}%
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-bold text-gray-700">
                    {t.visited}
                  </span>
                </div>
                <span className="text-sm font-black text-gray-900">
                  {stats.visited}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                  <span className="text-sm font-bold text-gray-700">
                    {t.pending}
                  </span>
                </div>
                <span className="text-sm font-black text-gray-900">
                  {stats.total - stats.visited}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* --- Linear Progress (Voting Day Stats) --- */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-end mb-3">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">
              {t.voted} vs {t.pending}
            </h2>
            <span className="text-lg font-black text-purple-600">
              {votedPct}%
            </span>
          </div>

          <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-purple-500 transition-all duration-1000 ease-out"
              style={{ width: `${votedPct}%` }}
            ></div>
          </div>
          <p className="text-[10px] font-bold text-gray-400 mt-2 text-right">
            {stats.voted} out of {stats.total} voters have cast their vote
          </p>
        </div>

        {/* --- Stacked Bar Chart (Support Breakdown) --- */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-4">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">
            {t.supportBreakdown}
          </h2>

          {/* The Stacked Bar */}
          {visitedWithSupport > 0 ? (
            <div className="w-full h-8 rounded-xl overflow-hidden flex mb-5 shadow-inner">
              <div
                className="h-full bg-green-500 transition-all duration-700"
                style={{ width: `${strongPct}%` }}
              ></div>
              <div
                className="h-full bg-blue-400 transition-all duration-700"
                style={{ width: `${neutralPct}%` }}
              ></div>
              <div
                className="h-full bg-orange-400 transition-all duration-700"
                style={{ width: `${weakPct}%` }}
              ></div>
              <div
                className="h-full bg-red-500 transition-all duration-700"
                style={{ width: `${againstPct}%` }}
              ></div>
            </div>
          ) : (
            <div className="w-full h-8 rounded-xl bg-gray-100 flex items-center justify-center mb-5 text-[10px] font-bold text-gray-400">
              No data yet
            </div>
          )}

          {/* Legend Grid */}
          <div className="grid grid-cols-2 gap-3">
            <LegendItem
              color="bg-green-500"
              label={t.levels.STRONG}
              count={stats.strong}
            />
            <LegendItem
              color="bg-blue-400"
              label={t.levels.NEUTRAL}
              count={stats.neutral}
            />
            <LegendItem
              color="bg-orange-400"
              label={t.levels.WEAK}
              count={stats.weak}
            />
            <LegendItem
              color="bg-red-500"
              label={t.levels.AGAINST}
              count={stats.against}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable micro-component for the legend
function LegendItem({
  color,
  label,
  count,
}: {
  color: string;
  label: string;
  count: number;
}) {
  return (
    <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-100">
      <div className="flex items-center gap-2">
        <div className={`w-3 h-3 rounded-full ${color}`}></div>
        <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <span className="text-sm font-black text-gray-900">{count}</span>
    </div>
  );
}
