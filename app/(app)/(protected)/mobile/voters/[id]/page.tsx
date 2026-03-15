"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { localDb, LocalVoter } from "@/lib/db";
import { useLanguage } from "@/context/LanguageContext";
import { useColor, ThemeColor } from "@/context/ColorContext";

const dict = {
  en: {
    profile: "Voter Profile",
    personalInfo: "Personal Details",
    locationInfo: "Location & Family",
    campaignStatus: "Campaign Status",
    editBtn: "Edit Details",
    notFound: "Voter not found.",
    mobile: "Mobile Number",
    caste: "Caste / Community",
    notes: "Worker Notes",
    houseNo: "House Number",
    viewFamily: "View Family Members",
    status: {
      alive: "Alive",
      deceased: "Deceased",
      voted: "Has Voted",
      notVoted: "Not Voted",
      visited: "Visited",
      pending: "Pending Visit",
    },
    levels: {
      STRONG: "Strong Support",
      NEUTRAL: "Neutral",
      WEAK: "Weak Support",
      AGAINST: "Against",
      UNKNOWN: "Support Unknown",
    },
  },
  mr: {
    profile: "मतदार प्रोफाइल",
    personalInfo: "वैयक्तिक तपशील",
    locationInfo: "ठिकाण आणि कुटुंब",
    campaignStatus: "मोहीम स्थिती",
    editBtn: "तपशील संपादित करा",
    notFound: "मतदार सापडला नाही.",
    mobile: "मोबाईल नंबर",
    caste: "जात / समाज",
    notes: "कार्यकर्त्यांच्या नोंदी",
    houseNo: "घर क्रमांक",
    viewFamily: "कुटुंब पहा",
    status: {
      alive: "जिवंत",
      deceased: "मयत",
      voted: "मतदान केले",
      notVoted: "मतदान बाकी",
      visited: "भेट दिली",
      pending: "भेट बाकी",
    },
    levels: {
      STRONG: "भक्कम पाठिंबा",
      NEUTRAL: "तटस्थ",
      WEAK: "कमकुवत पाठिंबा",
      AGAINST: "विरोधात",
      UNKNOWN: "अद्याप ठरलेले नाही",
    },
  },
  hi: {
    profile: "मतदाता प्रोफ़ाइल",
    personalInfo: "व्यक्तिगत विवरण",
    locationInfo: "स्थान और परिवार",
    campaignStatus: "अभियान की स्थिति",
    editBtn: "विवरण संपादित करें",
    notFound: "मतदाता नहीं मिला।",
    mobile: "मोबाइल नंबर",
    caste: "जाति / समुदाय",
    notes: "कार्यकर्ता नोट्स",
    houseNo: "मकान नंबर",
    viewFamily: "परिवार देखें",
    status: {
      alive: "जीवित",
      deceased: "मृत",
      voted: "मतदान किया",
      notVoted: "मतदान नहीं किया",
      visited: "भेंट की गई",
      pending: "भेंट बाकी",
    },
    levels: {
      STRONG: "मजबूत समर्थन",
      NEUTRAL: "तटस्थ",
      WEAK: "कमजोर समर्थन",
      AGAINST: "खिलाफ",
      UNKNOWN: "तय नहीं",
    },
  },
};

export default function VoterProfileViewPage() {
  const router = useRouter();
  const params = useParams();
  const voterId = Number(params.id);

  const { lang } = useLanguage();
  const t = dict[lang as keyof typeof dict];
  const { primaryColor } = useColor();

  const [voter, setVoter] = useState<LocalVoter | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic Theme Colors
  const themeStyles: Record<ThemeColor, string> = {
    blue: "bg-blue-600 text-white",
    green: "bg-emerald-600 text-white",
    orange: "bg-orange-500 text-white",
    purple: "bg-purple-600 text-white",
    red: "bg-red-600 text-white",
  };
  const themeClass = themeStyles[primaryColor] || themeStyles.blue;

  useEffect(() => {
    async function loadVoter() {
      try {
        const data = await localDb.voters.get(voterId);
        if (data) setVoter(data);
      } catch (error) {
        console.error("Failed to load voter details", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadVoter();
  }, [voterId]);

  if (isLoading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  if (!voter)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-500">
        {t.notFound}
      </div>
    );

  // Reusable component for displaying data rows
  const DetailRow = ({
    label,
    value,
  }: {
    label: string;
    value?: string | number | null;
  }) => (
    <div className="flex flex-col mb-3 last:mb-0">
      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
        {label}
      </span>
      <span className="text-sm font-bold text-gray-900 mt-0.5">
        {value || "--"}
      </span>
    </div>
  );

  return (
    <div className="bg-gray-100 flex flex-col">
      {" "}
      {/* --- Header --- */}
      <div
        className={`${themeClass} sticky top-0 z-30 px-4 pt-6 pb-4 shadow-md flex items-center gap-3`}
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
        <h1 className="text-xl font-black truncate">{t.profile}</h1>
      </div>
      <div className="flex flex-col gap-3 p-3 pb-32">
        {" "}
        {/* --- 1. Top Identity Card --- */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 relative overflow-hidden">
          <div
            className={`absolute top-0 left-0 w-1.5 h-full ${voter.isVisited ? "bg-green-500" : "bg-orange-400"}`}
          ></div>
          <div className="flex gap-4 items-center pl-2">
            <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-200 text-2xl">
              {voter.photoUrl ? (
                <img
                  src={voter.photoUrl}
                  alt="Voter"
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                "👤"
              )}
            </div>
            <div className="flex flex-col overflow-hidden w-full">
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-0.5">
                  SR: {voter.serialNumber || "--"}
                </p>
                <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-black text-gray-600 border border-gray-200">
                  {voter.epicNumber}
                </span>
              </div>
              <h2 className="text-lg font-black text-gray-900 leading-tight line-clamp-2">
                {voter.fullName}
              </h2>
              <p className="text-xs font-bold text-gray-500 mt-1">
                {voter.gender === "MALE"
                  ? "Male"
                  : voter.gender === "FEMALE"
                    ? "Female"
                    : "Other"}{" "}
                • {voter.age ? `${voter.age} Yrs` : "--"}
              </p>
            </div>
          </div>
        </div>
        {/* --- 2. Campaign Status Badges --- */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-3">
            {t.campaignStatus}
          </h3>

          <div className="grid grid-cols-2 gap-2 mb-3">
            {/* Alive / Deceased */}
            <div
              className={`flex items-center gap-2 p-2.5 rounded-xl border ${voter.isAlive !== false ? "bg-blue-50 border-blue-100 text-blue-700" : "bg-red-50 border-red-200 text-red-700"}`}
            >
              <span className="text-lg">
                {voter.isAlive !== false ? "💗" : "💀"}
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider">
                {voter.isAlive !== false ? t.status.alive : t.status.deceased}
              </span>
            </div>

            {/* Voted / Not Voted */}
            <div
              className={`flex items-center gap-2 p-2.5 rounded-xl border ${voter.hasVoted ? "bg-purple-50 border-purple-200 text-purple-700" : "bg-gray-50 border-gray-200 text-gray-500"}`}
            >
              <span className="text-lg">{voter.hasVoted ? "🗳️" : "⏳"}</span>
              <span className="text-[11px] font-black uppercase tracking-wider">
                {voter.hasVoted ? t.status.voted : t.status.notVoted}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Visited Status */}
            <div
              className={`flex-1 flex items-center justify-center gap-1.5 p-2 rounded-xl border ${voter.isVisited ? "bg-green-50 border-green-200 text-green-700" : "bg-orange-50 border-orange-200 text-orange-700"}`}
            >
              <span className="text-sm">{voter.isVisited ? "✅" : "⚠️"}</span>
              <span className="text-[10px] font-black uppercase tracking-wider">
                {voter.isVisited ? t.status.visited : t.status.pending}
              </span>
            </div>

            {/* Support Level (Only show if visited) */}
            {voter.isVisited && (
              <div
                className={`flex-1 flex items-center justify-center p-2 rounded-xl border font-black text-[10px] uppercase tracking-wider ${
                  voter.supportLevel === "STRONG"
                    ? "bg-green-100 text-green-800 border-green-300"
                    : voter.supportLevel === "WEAK"
                      ? "bg-orange-100 text-orange-800 border-orange-300"
                      : voter.supportLevel === "AGAINST"
                        ? "bg-red-100 text-red-800 border-red-300"
                        : "bg-blue-100 text-blue-800 border-blue-300" // Neutral / Unknown
                }`}
              >
                {t.levels[voter.supportLevel as keyof typeof t.levels] ||
                  t.levels.UNKNOWN}
              </div>
            )}
          </div>
        </div>
        {/* Only show personal/location details if they are ALIVE */}
        {voter.isAlive !== false && (
          <>
            {/* --- 3. Personal Details --- */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-3">
                {t.personalInfo}
              </h3>
              <DetailRow label={t.mobile} value={voter.mobileNumber} />
              <DetailRow label={t.caste} value={voter.caste} />

              <div className="flex flex-col mt-3 pt-3 border-t border-gray-50">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {t.notes}
                </span>
                <p
                  className={`text-sm mt-1 font-bold ${voter.notes ? "text-gray-800" : "text-gray-400 italic"}`}
                >
                  {voter.notes || "--"}
                </p>
              </div>
            </div>

            {/* --- 4. Location & Family --- */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-3">
                {t.locationInfo}
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-3">
                <DetailRow label="Village / City" value={voter.cityVillage} />
                <DetailRow label="Ward" value={voter.ward} />
              </div>

              <div className="flex justify-between items-end mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <DetailRow label={t.houseNo} value={voter.houseNumber} />
                {voter.houseNumber && (
                  <button
                    onClick={() =>
                      router.push(
                        `/mobile/voters/list?houseNumber=${voter.houseNumber}`,
                      )
                    }
                    className="bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider active:bg-indigo-200"
                  >
                    {t.viewFamily}
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-1.5 pt-2 border-t border-gray-50">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Polling Booth
                </span>
                <span className="text-xs font-black text-blue-700 bg-blue-50 p-2.5 rounded-lg border border-blue-100 flex items-start gap-1">
                  <span>📍</span> <span>{voter.pollingStation || "--"}</span>
                </span>
              </div>
            </div>
          </>
        )}
      </div>
      {/* --- Floating Edit Button --- */}
      <div className="fixed bottom-16 left-0 w-full bg-white/90 backdrop-blur-sm p-4 border-t border-gray-200 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] md:max-w-md md:mx-auto md:right-0 pb-safe">
        <button
          onClick={() => router.push(`/mobile/voters/${voter.id}/edit`)}
          className={`w-full h-14 rounded-2xl font-black text-lg shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${themeClass}`}
        >
          <span>✏️</span> {t.editBtn}
        </button>
      </div>
    </div>
  );
}
