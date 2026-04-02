"use client";

import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface VoterExportButtonProps {
  data: any[];
  fileName?: string;
  disabled?: boolean;
  variant?: "full" | "icon";
  menuAlign?: "left" | "right";
  menuDirection?: "top" | "bottom";
}

export default function VoterExportButton({
  data,
  fileName = "Voter_List",
  disabled = false,
  variant = "full",
  menuAlign = "right",
  menuDirection = "top",
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

  const menuAlignClass = menuAlign === "left" ? "left-0" : "right-0";
  const menuDirectionClass = menuDirection === "top" ? "bottom-full mb-3" : "top-full mt-3";

  return (
    <div className={`relative ${variant === "full" ? "w-full" : ""}`} ref={menuRef}>
      {/* --- POP-UP MENU --- */}
      {showMenu && (
        <div className={`absolute ${menuDirectionClass} ${menuAlignClass} w-64 bg-white rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden flex flex-col animate-in ${menuDirection === 'top' ? 'slide-in-from-bottom-2' : 'slide-in-from-top-2'} fade-in duration-200 z-50`}>
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
              Export As
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
            <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm shrink-0">
              📊
            </div>
            <div>
              <p className="font-black text-gray-900 text-xs text-nowrap">Excel Sheet</p>
              <p className="text-[8px] font-bold text-gray-500">
                Best for editing
              </p>
            </div>
          </button>

          <div className="h-px bg-gray-100 w-full"></div>

          <button
            onClick={handlePDFExport}
            className="flex items-center gap-3 p-4 active:bg-red-50 transition-colors text-left"
          >
            <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm shrink-0">
              📄
            </div>
            <div>
              <p className="font-black text-gray-900 text-xs text-nowrap">PDF Document</p>
              <p className="text-[8px] font-bold text-gray-500">
                Best for printing
              </p>
            </div>
          </button>
        </div>
      )}

      {/* --- MAIN TRIGGER --- */}
      {variant === "icon" ? (
        <button
          onClick={() => setShowMenu(!showMenu)}
          disabled={disabled || isExporting}
          className="p-2.5 bg-gray-50 text-gray-900 rounded-full active:bg-gray-100 disabled:opacity-50 disabled:bg-gray-50 disabled:text-gray-400 transition-all shrink-0 border border-gray-200 shadow-sm flex items-center justify-center"
        >
          {isExporting ? (
            <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
          ) : (
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
          )}
        </button>
      ) : (
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
      )}
    </div>
  );
}
