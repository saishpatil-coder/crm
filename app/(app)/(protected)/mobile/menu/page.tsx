"use client";

import CurvedHeader from "@/components/CurvedHeader";
import { useLanguage } from "@/context/LanguageContext";
import { useRouter } from "next/navigation";

const dict = {
  en: {
    title: "Browse Voters",
    subtitle: "Select how you want to find voters",
    byLocation: "By Location",
    village: "Village / City",
    ward: "Ward / House",
    booth: "Polling Booth",
    byName: "By Name",
    fname: "First Name",
    lname: "Surname",
    byDemographics: "By Demographics",
    caste: "Caste",
    gender: "Gender",
    age: "Age Group",
    byStatus: "By Status",
    visited: "Visited Voters",
    pending: "Pending Voters",
    tools: "Data Tools",
    duplicates: "Find Duplicates",
    firstLetter: "Alphabetical",
  },
  mr: {
    tools: "डेटा टूल्स",
    duplicates: "दुप्पट मतदार",
    title: "मतदार शोधा",
    subtitle: "तुम्हाला मतदार कसे शोधायचे आहेत ते निवडा",
    byLocation: "ठिकाणानुसार",
    village: "गावानुसार",
    ward: "वार्डानुसार",
    booth: "मतदान केंद्रानुसार",
    byName: "नावानुसार",
    fname: "पहिल्या नावानुसार",
    lname: "आडनावानुसार",
    byDemographics: "लोकसंख्येनुसार",
    caste: "जातीनुसार",
    gender: "लिंगानुसार",
    age: "वयोगटानुसार",
    byStatus: "स्थितीनुसार",
    visited: "भेट दिलेले",
    pending: "प्रलंबित",
    firstLetter: "पहिले अक्षर",
  },
  hi: {
    tools: "डेटा उपकरण",
    duplicates: "डुप्लिकेट खोजें",
    title: "मतदाता खोजें",
    subtitle: "चुनें कि आप मतदाता कैसे खोजना चाहते हैं",
    byLocation: "स्थान के अनुसार",
    village: "गाँव के अनुसार",
    ward: "वार्ड के अनुसार",
    booth: "मतदान केंद्र के अनुसार",
    byName: "नाम के अनुसार",
    fname: "प्रथम नाम के अनुसार",
    lname: "उपनाम के अनुसार",
    byDemographics: "जनसांख्यिकी के अनुसार",
    caste: "जाति के अनुसार",
    gender: "लिंग के अनुसार",
    age: "आयु वर्ग के अनुसार",
    byStatus: "स्थिति के अनुसार",
    visited: "भेंट किए गए",
    pending: "लंबित",
    firstLetter: "पहला अक्षर",
  },
};

export default function BrowseMenuPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const t = dict[lang as keyof typeof dict];

  // Helper function to navigate to the generic list page with a filter parameter
  const goToFilter = (filterType: string) => {
    // We will build this page next: /mobile/voters/list?filterBy=village
    router.push(`/mobile/voters/list?filterBy=${filterType}`);
  };

  const SectionTitle = ({ title }: { title: string }) => (
    <div className="flex items-center gap-3 mb-4 mt-8 px-2">
      <div className="h-px bg-gray-200 flex-1"></div>
      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center shrink-0">
        {title}
      </h3>
      <div className="h-px bg-gray-200 flex-1"></div>
    </div>
  );

  // Reusable button component for the grid
  // Redesigned Button: No harsh borders, soft pastel background, pop-out icon
  const MenuButton = ({
    icon,
    label,
    onClick,
    bgClass,
    textClass,
  }: {
    icon: string;
    label: string;
    onClick: () => void;
    bgClass: string;
    textClass: string;
  }) => (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 rounded-3xl transition-all active:scale-[0.95] ${bgClass} shadow-sm border border-black/5`}
    >
      <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center text-2xl mb-3">
        {icon}
      </div>
      <span
        className={`text-[11px] font-black text-center leading-tight uppercase tracking-wider ${textClass}`}
      >
        {label}
      </span>
    </button>
  );

  return (
    <div className="bg-gray-100 flex flex-col">
      {" "}
      {/* Header */}
      <CurvedHeader title={t.title} subtitle={t.subtitle} />
      <div className="p-2">
        {/* LOCATION GRID */}
        <SectionTitle title={t.byLocation} />
        <div className="grid grid-cols-3 gap-3">
          <MenuButton
            icon="🏘️"
            label={t.village}
            onClick={() => goToFilter("village")}
            bgClass="bg-blue-50 active:bg-blue-100"
            textClass="text-blue-700"
          />
          <MenuButton
            icon="🗺️"
            label={t.ward}
            onClick={() => goToFilter("ward")}
            bgClass="bg-cyan-50 active:bg-cyan-100"
            textClass="text-cyan-700"
          />
          <MenuButton
            icon="🗳️"
            label={t.booth}
            onClick={() => goToFilter("pollingStation")}
            bgClass="bg-indigo-50 active:bg-indigo-100"
            textClass="text-indigo-700"
          />
        </div>

        {/* NAME GRID */}
        <SectionTitle title={t.byName} />
        <div className="grid grid-cols-3 gap-3">
          <MenuButton
            icon="🔤"
            label={t.firstLetter}
            onClick={() => goToFilter("firstLetter")}
            bgClass="bg-purple-50 active:bg-purple-100"
            textClass="text-purple-700"
          />
          <MenuButton
            icon="👤"
            label={t.fname}
            onClick={() => goToFilter("firstName")}
            bgClass="bg-fuchsia-50 active:bg-fuchsia-100"
            textClass="text-fuchsia-700"
          />
          <MenuButton
            icon="👥"
            label={t.lname}
            onClick={() => goToFilter("lastName")}
            bgClass="bg-pink-50 active:bg-pink-100"
            textClass="text-pink-700"
          />
        </div>

        {/* DEMOGRAPHICS GRID */}
        <SectionTitle title={t.byDemographics} />
        <div className="grid grid-cols-3 gap-3">
          <MenuButton
            icon="🕉️"
            label={t.caste}
            onClick={() => goToFilter("caste")}
            bgClass="bg-orange-50 active:bg-orange-100"
            textClass="text-orange-700"
          />
          <MenuButton
            icon="🚻"
            label={t.gender}
            onClick={() => goToFilter("gender")}
            bgClass="bg-amber-50 active:bg-amber-100"
            textClass="text-amber-700"
          />
          <MenuButton
            icon="🎂"
            label={t.age}
            onClick={() => goToFilter("ageGroup")}
            bgClass="bg-yellow-50 active:bg-yellow-100"
            textClass="text-yellow-700"
          />
 
        </div>
        {/* STATUS GRID */}
        <SectionTitle title={t.byStatus} />
        <div className="grid grid-cols-2 gap-3">
          <MenuButton
            icon="✅"
            label={t.visited}
            onClick={() => goToFilter("visited")}
            bgClass="bg-green-50 active:bg-green-100"
            textClass="text-green-700"
          />
          <MenuButton
            icon="⏳"
            label={t.pending}
            onClick={() => goToFilter("pending")}
            bgClass="bg-slate-100 active:bg-slate-200"
            textClass="text-slate-700"
          />
        </div>
        {/* TOOLS GRID */}
        <SectionTitle title={t.tools} />
        <div className="grid grid-cols-2 gap-3 mb-6">
          <MenuButton
            icon="👯"
            label={t.duplicates}
            // Explicitly route to the new duplicates page we just built
            onClick={() => router.push("/mobile/duplicates")}
            bgClass="bg-red-50 active:bg-red-100"
            textClass="text-red-700"
          />
          {/* Empty slot for future tools, like Export or Sync */}
        </div>
      </div>
    </div>
  );
}
