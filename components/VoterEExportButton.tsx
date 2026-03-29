"use client";

import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface VoterExportButtonProps {
  data: any[];
  fileName?: string;
  disabled?: boolean;
}

export default function VoterExportButton({
  data,
  fileName = "Voter_List",
  disabled = false,
}: VoterExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu if user clicks outside of it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getFinalFileName = (ext: string) => {
    const base = fileName.trim() || `Voter_Export_${new Date().getTime()}`;
    return `${base.replace(/\s+/g, "_")}.${ext}`;
  };

  // --- STANDARD FIXED COLUMNS FOR VOTERS ---
  const formatDataForExport = () => {
    return data.map((v) => ({
      "SR. No": v.serialNumber || "-",
      "EPIC Number": v.epicNumber || "-",
      "Full Name": v.fullName || "-",
      "Age/Gen": `${v.age || "-"}/${v.gender?.charAt(0) || "-"}`,
      Mobile: v.mobileNumber || "-",
      Booth: v.pollingStation || "-",
      "Village/City": v.cityVillage || "-",
      Caste: v.caste || "-",
      Support: v.supportLevel || "-",
      "Voted?": v.hasVoted ? "YES" : "NO",
    }));
  };

  // --- EXCEL EXPORT ---
  const handleExcelExport = () => {
    setShowMenu(false);
    if (data.length === 0) return alert("No data to export.");
    setIsExporting(true);

    setTimeout(() => {
      try {
        const formattedData = formatDataForExport();
        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Voters");
        XLSX.writeFile(workbook, getFinalFileName("xlsx"));
      } finally {
        setIsExporting(false);
      }
    }, 100);
  };

  // --- PDF EXPORT ---
  const handlePDFExport = () => {
    setShowMenu(false);
    if (data.length === 0) return alert("No data to export.");
    if (data.length > 5000)
      return alert(
        "Warning: Generating a PDF with over 5000 rows may freeze your browser. Use Excel.",
      );

    setIsExporting(true);

    setTimeout(() => {
      try {
        const doc = new jsPDF("landscape");

        doc.setFontSize(14);
        doc.text(fileName.replace(/_/g, " "), 14, 15);
        doc.setFontSize(10);
        doc.text(
          `Total: ${data.length} records | Generated: ${new Date().toLocaleDateString()}`,
          14,
          22,
        );

        const formattedData = formatDataForExport();
        const tableHeaders = Object.keys(formattedData[0] || {});
        const tableRows = formattedData.map(Object.values);

        autoTable(doc, {
          head: [tableHeaders],
          body: tableRows,
          startY: 28,
          theme: "grid",
          styles: { fontSize: 8 },
          headStyles: { fillColor: [59, 130, 246] }, // Tailwind Blue-500
        });

        doc.save(getFinalFileName("pdf"));
      } finally {
        setIsExporting(false);
      }
    }, 100);
  };

  return (
    <div className="relative w-full" ref={menuRef}>
      {/* --- POP-UP MENU --- */}
      {showMenu && (
        <div className="absolute bottom-full left-0 w-full mb-3 bg-white rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden flex flex-col animate-in slide-in-from-bottom-2 fade-in duration-200 z-50">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <span className="text-xs font-black text-gray-500 uppercase tracking-widest">
              Choose Format
            </span>
            <button
              onClick={() => setShowMenu(false)}
              className="text-gray-400 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <button
            onClick={handleExcelExport}
            className="flex items-center gap-3 p-4 active:bg-emerald-50 transition-colors text-left"
          >
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xl shrink-0">
              📊
            </div>
            <div>
              <p className="font-black text-gray-900">Microsoft Excel</p>
              <p className="text-[10px] font-bold text-gray-500">
                Best for editing and sorting
              </p>
            </div>
          </button>

          <div className="h-px bg-gray-100 w-full"></div>

          <button
            onClick={handlePDFExport}
            className="flex items-center gap-3 p-4 active:bg-red-50 transition-colors text-left"
          >
            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xl shrink-0">
              📄
            </div>
            <div>
              <p className="font-black text-gray-900">PDF Document</p>
              <p className="text-[10px] font-bold text-gray-500">
                Best for printing directly
              </p>
            </div>
          </button>
        </div>
      )}

      {/* --- MAIN EXPORT BUTTON --- */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={disabled || isExporting}
        className="w-full h-14 bg-gray-900 text-white rounded-2xl font-black shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:active:scale-100"
      >
        {isExporting ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <>
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
            Export Data
          </>
        )}
      </button>
    </div>
  );
}
