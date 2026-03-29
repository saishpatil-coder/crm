"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { localDb, LocalVoter } from "@/lib/db";
import { useLanguage } from "@/context/LanguageContext";
import { useColor, ThemeColor } from "@/context/ColorContext";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import VoterExportButton from "@/components/VoterEExportButton";

const dict = {
  en: {
    title: "Export Data",
    fileName: "File Name",
    fileNamePlaceholder: "e.g., Ward_10_Voters",
    sortBy: "Sort By",
    order: "Order",
    asc: "Ascending (A-Z, 1-9)",
    desc: "Descending (Z-A, 9-1)",
    sortOptions: {
      serialNumber: "Serial Number",
      fullName: "Voter Name",
      age: "Age",
    },
    filterBtn: "Open Filters",
    activeFilters: "Active Filters",
    noFilters: "No filters applied (Exporting All)",
    applyFilters: "Apply Filters",
    downloadExcel: "Download Excel",
    downloadPdf: "Download PDF",
    noData: "No voters found with these filters.",
    villages: "Villages / Cities",
    castes: "Castes / Communities",
    ageRange: "Age Range",
    supportLevel: "Support Level",
    votingStatus: "Voting Status",
    all: "All",
    hasVoted: "Has Voted ✅",
    notVoted: "Not Voted ⏳",
    selectAll: "Select All",
    clear: "Clear"
  },
  mr: {
    title: "डेटा एक्सपोर्ट करा",
    fileName: "फाईलचे नाव",
    fileNamePlaceholder: "उदा., प्रभाग_१०_मतदार",
    sortBy: "अनुसार क्रमवारी लावा",
    order: "क्रम",
    asc: "चढता (A-Z, १-९)",
    desc: "उतरता (Z-A, ९-१)",
    sortOptions: {
      serialNumber: "अनुक्रमांक",
      fullName: "मतदाराचे नाव",
      age: "वय",
    },
    filterBtn: "फिल्टर उघडा",
    activeFilters: "सक्रिय फिल्टर्स",
    noFilters: "कोणतेही फिल्टर लागू नाही (सर्व एक्सपोर्ट करत आहे)",
    applyFilters: "फिल्टर लागू करा",
    downloadExcel: "Excel डाउनलोड करा",
    downloadPdf: "PDF डाउनलोड करा",
    noData: "या फिल्टरसह कोणतेही मतदार सापडले नाहीत.",
    villages: "गावे / शहरे",
    castes: "जाती / समाज",
    ageRange: "वयोगट",
    supportLevel: "समर्थन पातळी",
    votingStatus: "मतदानाची स्थिती",
    all: "सर्व",
    hasVoted: "मतदान केले ✅",
    notVoted: "मतदान बाकी ⏳",
    selectAll: "सर्व निवडा",
    clear: "काढून टाका"
  },
  hi: {
    title: "डेटा निर्यात करें",
    fileName: "फ़ाइल का नाम",
    fileNamePlaceholder: "उदा., वार्ड_10_मतदाता",
    sortBy: "इसके अनुसार छाँटें",
    order: "क्रम",
    asc: "आरोही (A-Z, 1-9)",
    desc: "अवरोही (Z-A, 9-1)",
    sortOptions: {
      serialNumber: "क्रम संख्या",
      fullName: "मतदाता का नाम",
      age: "आयु",
    },
    filterBtn: "फ़िल्टर खोलें",
    activeFilters: "सक्रिय फ़िल्टर",
    noFilters: "कोई फ़िल्टर लागू नहीं (सभी निर्यात कर रहा है)",
    applyFilters: "फ़िल्टर लागू करें",
    downloadExcel: "Excel डाउनलोड करें",
    downloadPdf: "PDF डाउनलोड करें",
    noData: "इन फ़िल्टर के साथ कोई मतदाता नहीं मिला।",
    villages: "गांव / शहर",
    castes: "जातियां / समुदाय",
    ageRange: "आयु सीमा",
    supportLevel: "समर्थन स्तर",
    votingStatus: "मतदान की स्थिति",
    all: "सभी",
    hasVoted: "मतदान किया ✅",
    notVoted: "मतदान नहीं किया ⏳",
    selectAll: "सभी चुनें",
    clear: "हटाएं"
  }
};

export default function ExportPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const t = dict[lang as keyof typeof dict];
  const { primaryColor } = useColor();

  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [allVoters, setAllVoters] = useState<LocalVoter[]>([]);
  
  // UI State
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  
  // Export Settings State
  const [fileName, setFileName] = useState("");
  const [sortBy, setSortBy] = useState<"serialNumber" | "fullName" | "age">("serialNumber");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Dynamic Option Lists
  const [availableVillages, setAvailableVillages] = useState<string[]>([]);
  const [availableCastes, setAvailableCastes] = useState<string[]>([]);

  // Filter State
  const [selectedVillages, setSelectedVillages] = useState<string[]>([]);
  const [selectedCastes, setSelectedCastes] = useState<string[]>([]);
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");
  const [supportLevel, setSupportLevel] = useState("");
  const [hasVoted, setHasVoted] = useState("");

  const themeStyles: Record<ThemeColor, string> = {
    blue: "bg-blue-600 text-white",
    green: "bg-emerald-600 text-white",
    orange: "bg-orange-500 text-white",
    purple: "bg-purple-600 text-white",
    red: "bg-red-600 text-white",
  };
  const themeClass = themeStyles[primaryColor] || themeStyles.blue;
  const activeBg = themeClass.split(' ')[0]; 

useEffect(() => {
  async function initData() {
    try {
      const voters = await localDb.voters.toArray();
      setAllVoters(voters);

      // Wrapped the Array.from(...) as string[] in parentheses before calling .sort()
      setAvailableVillages(
        (
          Array.from(
            new Set(voters.map((v) => v.cityVillage?.trim()).filter(Boolean)),
          ) as string[]
        ).sort(),
      );

      setAvailableCastes(
        (
          Array.from(
            new Set(voters.map((v) => v.caste?.trim()).filter(Boolean)),
          ) as string[]
        ).sort(),
      );
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }
  initData();
}, []);

  // --- Filtering & Sorting Engine ---
  const getFilteredAndSortedData = () => {
    // 1. Filter
    let processed = allVoters.filter(v => {
      if (selectedVillages.length > 0 && (!v.cityVillage || !selectedVillages.includes(v.cityVillage.trim()))) return false;
      if (selectedCastes.length > 0 && (!v.caste || !selectedCastes.includes(v.caste.trim()))) return false;
      if (minAge && (!v.age || v.age < parseInt(minAge))) return false;
      if (maxAge && (!v.age || v.age > parseInt(maxAge))) return false;
      if (supportLevel && v.supportLevel !== supportLevel) return false;
      if (hasVoted !== "" && String(!!v.hasVoted) !== hasVoted) return false;
      return true;
    });

    // 2. Sort
    processed.sort((a: any, b: any) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      // Handle nulls/undefined gracefully
      if (valA === null || valA === undefined) valA = sortBy === 'age' || sortBy === 'serialNumber' ? 0 : '';
      if (valB === null || valB === undefined) valB = sortBy === 'age' || sortBy === 'serialNumber' ? 0 : '';

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return processed;
  };

  // Helper to count active filters for UI
  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedVillages.length > 0) count++;
    if (selectedCastes.length > 0) count++;
    if (minAge || maxAge) count++;
    if (supportLevel) count++;
    if (hasVoted !== "") count++;
    return count;
  };

  const getFinalFileName = (ext: string) => {
    const base = fileName.trim() || `Voter_Export_${new Date().getTime()}`;
    // Replace spaces with underscores to prevent messy file names
    return `${base.replace(/\s+/g, "_")}.${ext}`;
  };

  // --- EXPORT LOGIC ---
  const handleExcelExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      try {
        const data = getFilteredAndSortedData();
        if (data.length === 0) return alert(t.noData);

        const formattedData = data.map((v) => ({
          "SR. No": v.serialNumber || "-",
          "EPIC Number": v.epicNumber,
          "Full Name": v.fullName,
          "Age": v.age || "-",
          "Gender": v.gender === "MALE" ? "M" : v.gender === "FEMALE" ? "F" : "O",
          "Mobile": v.mobileNumber || "-",
          "Booth": v.pollingStation || "-",
          "Village/City": v.cityVillage || "-",
          "Caste": v.caste || "-",
          "Support": v.supportLevel || "-",
          "Voted?": v.hasVoted ? "YES" : "NO",
        }));

        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Voters");
        XLSX.writeFile(workbook, getFinalFileName("xlsx"));
      } finally {
        setIsExporting(false);
      }
    }, 100);
  };

  const handlePDFExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      try {
        const data = getFilteredAndSortedData();
        if (data.length === 0) return alert(t.noData);
        if (data.length > 5000) return alert("Warning: Generating a PDF with over 5000 rows may freeze your browser. Use Excel.");

        const doc = new jsPDF("landscape");
        doc.setFontSize(14);
        doc.text(fileName.trim() || "Campaign Voter List", 14, 15);
        doc.setFontSize(10);
        doc.text(`Total: ${data.length} voters | Generated: ${new Date().toLocaleDateString()}`, 14, 22);

        const tableColumns = ["SR", "EPIC", "Name", "Age/Gen", "Mobile", "Booth", "Caste", "Voted"];
        const tableRows = data.map((v) => [
          v.serialNumber || "-", v.epicNumber, v.fullName,
          `${v.age || "-"}/${v.gender?.charAt(0) || "-"}`,
          v.mobileNumber || "-", v.pollingStation || "-", v.caste || "-",
          v.hasVoted ? "Yes" : "No"
        ]);

        autoTable(doc, { head: [tableColumns], body: tableRows, startY: 28, theme: "grid", styles: { fontSize: 8 }});
        doc.save(getFinalFileName("pdf"));
      } finally {
        setIsExporting(false);
      }
    }, 100);
  };

  // --- REUSABLE PILL COMPONENT FOR MODAL ---
  const toggleSelection = (item: string, list: string[], setList: (val: string[]) => void) => {
    list.includes(item) ? setList(list.filter(i => i !== item)) : setList([...list, item]);
  };
  
  const FilterPills = ({ title, available, selected, setSelected }: any) => (
    <div className="mb-5">
      <div className="flex justify-between items-end mb-2">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</label>
        <div className="flex gap-2">
          <button onClick={() => setSelected(available)} className="text-[10px] font-black text-blue-600 uppercase">{t.selectAll}</button>
          <button onClick={() => setSelected([])} className="text-[10px] font-black text-red-500 uppercase">{t.clear}</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {available.map((item: string) => (
          <button
            key={item}
            onClick={() => toggleSelection(item, selected, setSelected)}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors border-2 ${
              selected.includes(item) ? `border-[${primaryColor}] bg-blue-50 text-blue-700` : 'border-gray-200 bg-gray-50 text-gray-600'
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );

  if (isLoading) return <div className="h-[100dvh] flex items-center justify-center"><div className={`w-8 h-8 border-4 border-t-transparent rounded-full animate-spin border-[${primaryColor}]`}></div></div>;

  return (
    <div className="h-[100dvh] bg-gray-50 flex flex-col overflow-hidden md:max-w-md md:mx-auto md:shadow-2xl md:border-x border-gray-200 relative">
      {/* Header */}
      <div
        className={`${activeBg} px-4 pt-6 pb-4 shadow-md flex items-center justify-between shrink-0 text-white`}
      >
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
        {/* Open Filter Modal Button */}
        <button
          onClick={() => setIsFilterModalOpen(true)}
          className="relative p-2 bg-white/20 rounded-xl active:bg-white/30 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          {getActiveFilterCount() > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border border-white">
              {getActiveFilterCount()}
            </span>
          )}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {/* Active Filters Display */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {t.activeFilters}
            </h3>
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="text-xs font-black text-blue-600"
            >
              Edit
            </button>
          </div>
          <p className="text-sm font-bold text-gray-700">
            {getActiveFilterCount() === 0
              ? t.noFilters
              : `${getActiveFilterCount()} rules applied. Ready to export.`}
          </p>
        </div>

        {/* Output Settings */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 flex flex-col gap-4">
          {/* File Name */}
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-1 block">
              {t.fileName}
            </label>
            <input
              type="text"
              placeholder={t.fileNamePlaceholder}
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:bg-white focus:border-blue-500 outline-none"
            />
          </div>

          {/* Sort By & Order Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-1 block">
                {t.sortBy}
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-xs font-bold text-gray-900 outline-none"
              >
                <option value="serialNumber">
                  {t.sortOptions.serialNumber}
                </option>
                <option value="fullName">{t.sortOptions.fullName}</option>
                <option value="age">{t.sortOptions.age}</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1 mb-1 block">
                {t.order}
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as any)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-xs font-bold text-gray-900 outline-none"
              >
                <option value="asc">{t.asc}</option>
                <option value="desc">{t.desc}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Export Action Buttons */}
      {/* <div className="bg-white p-4 border-t border-gray-200 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] shrink-0 flex gap-3 pb-safe z-10 bottom-16 relative">
        <button onClick={handleExcelExport} disabled={isExporting} className="flex-1 h-14 bg-emerald-600 text-white rounded-xl font-black shadow-md active:scale-95 transition-all flex items-center justify-center gap-2">
          {isExporting ? "..." : <><span>📊</span> Excel</>}
        </button>
        <button onClick={handlePDFExport} disabled={isExporting} className="flex-1 h-14 bg-red-600 text-white rounded-xl font-black shadow-md active:scale-95 transition-all flex items-center justify-center gap-2">
          {isExporting ? "..." : <><span>📄</span> PDF</>}
        </button>
      </div> */}
      <div className="bg-white p-4 border-t border-gray-200 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] shrink-0 flex pb-safe z-10 bottom-16 relative">
        <VoterExportButton
          data={getFilteredAndSortedData()}
          fileName={fileName}
          disabled={isLoading}
        />
      </div>

      {/* --- BOTTOM SHEET MODAL FOR FILTERS --- */}
      {isFilterModalOpen && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end">
          {/* Dimmed Background */}
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => setIsFilterModalOpen(false)}
          ></div>

          {/* Modal Content */}
          <div className="bg-white rounded-t-3xl h-[85vh] flex flex-col relative shadow-2xl animate-in slide-in-from-bottom-full duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100 shrink-0">
              <h2 className="text-lg font-black text-gray-900">
                {t.filterBtn}
              </h2>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="bg-gray-100 text-gray-600 w-8 h-8 rounded-full font-bold flex items-center justify-center active:bg-gray-200"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Filters */}
            <div className="flex-1 overflow-y-auto p-5">
              <FilterPills
                title={t.villages}
                available={availableVillages}
                selected={selectedVillages}
                setSelected={setSelectedVillages}
              />
              <FilterPills
                title={t.castes}
                available={availableCastes}
                selected={selectedCastes}
                setSelected={setSelectedCastes}
              />

              <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 pl-1">
                    {t.supportLevel}
                  </label>
                  <select
                    value={supportLevel}
                    onChange={(e) => setSupportLevel(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-none"
                  >
                    <option value="">{t.all}</option>
                    <option value="STRONG">Strong</option>
                    <option value="NEUTRAL">Neutral</option>
                    <option value="WEAK">Weak</option>
                    <option value="AGAINST">Against</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 pl-1">
                    {t.votingStatus}
                  </label>
                  <select
                    value={hasVoted}
                    onChange={(e) => setHasVoted(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-bold outline-none"
                  >
                    <option value="">{t.all}</option>
                    <option value="true">{t.hasVoted}</option>
                    <option value="false">{t.notVoted}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 pl-1">
                  {t.ageRange}
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minAge}
                    onChange={(e) => setMinAge(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold outline-none"
                  />
                  <span className="text-gray-400 font-black">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxAge}
                    onChange={(e) => setMaxAge(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 shrink-0 sticky bottom-16 pb-safe">
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className={`w-full h-14 ${activeBg} text-white rounded-2xl font-black shadow-lg active:scale-95 transition-all`}
              >
                {t.applyFilters}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}