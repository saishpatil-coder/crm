"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";

const dict = {
  en: {
    title: "My Daily Tasks",
    progress: "Today's Progress",
    completedCount: "Completed",
    tabPending: "Pending",
    tabCompleted: "Completed",
    allCaughtUp: "All caught up!",
    noTasks: "No tasks found in this section.",
    priorityText: "PRIORITY",
    due: "Due",
    exportBtn: "Go to Export Tool",
    // Enum Translations
    priorityHigh: "HIGH",
    priorityMedium: "MEDIUM",
    priorityLow: "LOW",
    typeDoorToDoor: "DOOR TO DOOR",
    typeDistribution: "DISTRIBUTION",
    typeFollowUp: "FOLLOW UP",
  },
  mr: {
    title: "माझी दैनंदिन कामे",
    progress: "आजची प्रगती",
    completedCount: "पूर्ण झाले",
    tabPending: "प्रलंबित",
    tabCompleted: "पूर्ण",
    allCaughtUp: "सर्व कामे पूर्ण! 🎉",
    noTasks: "या विभागात कोणतेही काम आढळले नाही.",
    priorityText: "प्राधान्य",
    due: "अंतिम मुदत",
    exportBtn: "एक्सपोर्ट टूलवर जा",
    // Enum Translations
    priorityHigh: "उच्च",
    priorityMedium: "मध्यम",
    priorityLow: "कमी",
    typeDoorToDoor: "घरोघरी भेट",
    typeDistribution: "वाटप",
    typeFollowUp: "पाठपुरावा",
  },
  hi: {
    title: "मेरे दैनिक कार्य",
    progress: "आज की प्रगति",
    completedCount: "पूरा हुआ",
    tabPending: "लंबित",
    tabCompleted: "पूरा हुआ",
    allCaughtUp: "सभी कार्य पूरे हुए! 🎉",
    noTasks: "इस अनुभाग में कोई कार्य नहीं मिला।",
    priorityText: "प्राथमिकता",
    due: "अंतिम तिथि",
    exportBtn: "एक्सपोर्ट टूल पर जाएं",
    // Enum Translations
    priorityHigh: "उच्च",
    priorityMedium: "मध्यम",
    priorityLow: "निम्न",
    typeDoorToDoor: "घर-घर जाकर",
    typeDistribution: "वितरण",
    typeFollowUp: "फॉलो-अप",
  },
};

// Dummy data for example purposes
const dummyTasks = [
  {
    id: 1,
    title: "Visit Ward 10, Building A",
    type: "DOOR_TO_DOOR",
    status: "PENDING",
    priority: "HIGH",
    dueDate: "2024-05-10",
  },
  {
    id: 2,
    title: "Deliver Voter Slips to Booth 14",
    type: "DISTRIBUTION",
    status: "COMPLETED",
    priority: "MEDIUM",
    dueDate: "2024-05-09",
  },
  {
    id: 3,
    title: "Follow up with undecided family (Patil)",
    type: "FOLLOW_UP",
    status: "PENDING",
    priority: "HIGH",
    dueDate: "2024-05-11",
  },
];

export default function TasksPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const t = dict[lang as keyof typeof dict];

  const [activeTab, setActiveTab] = useState<"PENDING" | "COMPLETED">(
    "PENDING",
  );

  const filteredTasks = dummyTasks.filter((task) => task.status === activeTab);

  // Helper to translate backend enums into the active language
  const getTranslatedPriority = (priority: string) => {
    if (priority === "HIGH") return t.priorityHigh;
    if (priority === "MEDIUM") return t.priorityMedium;
    return t.priorityLow;
  };

  const getTranslatedType = (type: string) => {
    if (type === "DOOR_TO_DOOR") return t.typeDoorToDoor;
    if (type === "DISTRIBUTION") return t.typeDistribution;
    if (type === "FOLLOW_UP") return t.typeFollowUp;
    return type.replace(/_/g, " "); // Fallback
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:max-w-md md:mx-auto md:shadow-2xl md:border-x border-gray-200">
      {/* Header */}
      <div className="bg-blue-600 px-4 pt-6 pb-4 shadow-md flex items-center justify-between sticky top-0 z-30 text-white">
        <div className="flex items-center gap-3">
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
      </div>

      {/* Progress Overview */}
      <div className="p-4 bg-white shadow-sm border-b border-gray-200">
        <div className="flex justify-between items-end mb-2">
          <h2 className="text-sm font-black text-gray-800">{t.progress}</h2>
          <span className="text-xs font-bold text-blue-600">
            1 / 3 {t.completedCount}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-emerald-500 h-2.5 rounded-full"
            style={{ width: "33%" }}
          ></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 py-3 flex gap-2 sticky top-[72px] z-20 bg-gray-50 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("PENDING")}
          className={`flex-1 h-10 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === "PENDING"
              ? "bg-blue-600 text-white shadow-md"
              : "bg-white text-gray-500 border border-gray-200"
          }`}
        >
          {t.tabPending}
        </button>
        <button
          onClick={() => setActiveTab("COMPLETED")}
          className={`flex-1 h-10 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
            activeTab === "COMPLETED"
              ? "bg-emerald-600 text-white shadow-md"
              : "bg-white text-gray-500 border border-gray-200"
          }`}
        >
          {t.tabCompleted}
        </button>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 pb-6">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-10 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-3xl mb-3">
              🎉
            </div>
            <h3 className="text-gray-900 font-black">{t.allCaughtUp}</h3>
            <p className="text-gray-500 text-sm font-bold mt-1">{t.noTasks}</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div
              key={task.id}
              className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col gap-2 relative overflow-hidden"
            >
              {/* High Priority Accent Bar */}
              {task.priority === "HIGH" && (
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500"></div>
              )}

              <div className="flex justify-between items-start">
                <span
                  className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                    task.priority === "HIGH"
                      ? "bg-red-50 text-red-600 ml-1"
                      : "bg-orange-50 text-orange-600"
                  }`}
                >
                  {getTranslatedPriority(task.priority)} {t.priorityText}
                </span>
                <span className="text-[10px] font-bold text-gray-400">
                  {t.due}: {task.dueDate}
                </span>
              </div>

              <h3
                className={`font-black leading-tight mt-1 ${task.priority === "HIGH" ? "ml-1 text-gray-900" : "text-gray-900"}`}
              >
                {task.title}
              </h3>
              <p
                className={`text-xs font-bold text-gray-500 ${task.priority === "HIGH" ? "ml-1" : ""}`}
              >
                {getTranslatedType(task.type)}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Action Footer (Navigation to Export Page) */}
      <div className="bg-white p-4 border-t border-gray-200 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] sticky bottom-0 z-20 pb-safe">
        <button
          onClick={() => router.push("/mobile/export")}
          className="w-full h-14 bg-gray-900 text-white rounded-2xl font-black shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {t.exportBtn}
        </button>
      </div>
    </div>
  );
}
