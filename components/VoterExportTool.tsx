"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { apiClient } from "@/lib/appClient";

export default function VoterExportTool() {
  const [isExporting, setIsExporting] = useState(false);

  // Filter State
  const [filters, setFilters] = useState({
    village: "",
    booth: "",
    caste: "",
    minAge: "",
    maxAge: "",
    supportLevel: "",
    hasVoted: "",
    isVisited: "",
  });

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const fetchExportData = async () => {
    // Clean up empty filters before sending
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const response = await apiClient.get(`/voters/export?${params.toString()}`);
    return response.data.data;
  };

  // --- EXPORT TO EXCEL ---
  const handleExcelExport = async () => {
    setIsExporting(true);
    try {
      const data = await fetchExportData();
      if (data.length === 0)
        return alert("No voters found with these filters.");

      // Format data to look nice in Excel
      const formattedData = data.map((v: any) => ({
        "SR. No": v.serialNumber || "-",
        "EPIC Number": v.epicNumber,
        "Full Name": v.fullName,
        Age: v.age || "-",
        Gender: v.gender || "-",
        Mobile: v.mobileNumber || "-",
        Booth: v.pollingStation || "-",
        "Village/City": v.cityVillage || "-",
        Caste: v.caste || "-",
        Support: v.supportLevel,
        "Voted?": v.hasVoted ? "YES" : "NO",
      }));

      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Voters");

      XLSX.writeFile(
        workbook,
        `Voter_List_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
    } catch (error) {
      console.error(error);
      alert("Failed to export Excel.");
    } finally {
      setIsExporting(false);
    }
  };

  // --- EXPORT TO PDF ---
  const handlePDFExport = async () => {
    setIsExporting(true);
    try {
      const data = await fetchExportData();
      if (data.length === 0)
        return alert("No voters found with these filters.");

      // PDF gets angry if there are too many rows (browser memory crash)
      if (data.length > 5000) {
        alert(
          "Warning: Generating a PDF with over 5000 rows may freeze your browser. Please narrow your filters or use Excel.",
        );
        setIsExporting(false);
        return;
      }

      const doc = new jsPDF("landscape"); // Landscape for wide tables
      doc.text("Campaign Voter List", 14, 15);
      doc.setFontSize(10);
      doc.text(
        `Generated: ${new Date().toLocaleDateString()} | Total: ${data.length} voters`,
        14,
        22,
      );

      const tableColumns = [
        "SR",
        "EPIC",
        "Name",
        "Age/Gen",
        "Mobile",
        "Booth",
        "Caste",
        "Voted",
      ];
      const tableRows = data.map((v: any) => [
        v.serialNumber || "-",
        v.epicNumber,
        v.fullName,
        `${v.age || "-"}/${v.gender?.charAt(0) || "-"}`,
        v.mobileNumber || "-",
        v.pollingStation || "-",
        v.caste || "-",
        v.hasVoted ? "Yes" : "No",
      ]);

      autoTable(doc, {
        head: [tableColumns],
        body: tableRows,
        startY: 28,
        theme: "grid",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] }, // Tailwind Blue-500
      });

      doc.save(`Voter_List_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error(error);
      alert("Failed to export PDF.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
      <h2 className="text-lg font-black text-gray-900 mb-6">
        Advanced Data Export
      </h2>

      {/* --- Filter Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Village / City
          </label>
          <input
            type="text"
            placeholder="e.g. Pune"
            className="input-field"
            value={filters.village}
            onChange={(e) => handleFilterChange("village", e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Polling Booth
          </label>
          <input
            type="text"
            placeholder="Booth Name/No."
            className="input-field"
            value={filters.booth}
            onChange={(e) => handleFilterChange("booth", e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Caste / Community
          </label>
          <input
            type="text"
            placeholder="e.g. Maratha"
            className="input-field"
            value={filters.caste}
            onChange={(e) => handleFilterChange("caste", e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Support Level
          </label>
          <select
            className="input-field"
            value={filters.supportLevel}
            onChange={(e) => handleFilterChange("supportLevel", e.target.value)}
          >
            <option value="">All Levels</option>
            <option value="STRONG">Strong</option>
            <option value="WEAK">Weak</option>
            <option value="AGAINST">Against</option>
            <option value="UNKNOWN">Unknown</option>
          </select>
        </div>

        {/* Age Range Slider/Inputs */}
        <div className="flex flex-col gap-1.5 col-span-1 md:col-span-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Age Range
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              placeholder="Min Age"
              className="input-field flex-1"
              value={filters.minAge}
              onChange={(e) => handleFilterChange("minAge", e.target.value)}
            />
            <span className="text-gray-400 font-black">-</span>
            <input
              type="number"
              placeholder="Max Age"
              className="input-field flex-1"
              value={filters.maxAge}
              onChange={(e) => handleFilterChange("maxAge", e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Voting Status
          </label>
          <select
            className="input-field"
            value={filters.hasVoted}
            onChange={(e) => handleFilterChange("hasVoted", e.target.value)}
          >
            <option value="">All</option>
            <option value="true">Has Voted ✅</option>
            <option value="false">Not Voted ⏳</option>
          </select>
        </div>
      </div>

      {/* --- Action Buttons --- */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-gray-100">
        <button
          onClick={handleExcelExport}
          disabled={isExporting}
          className="flex-1 bg-emerald-600 text-white h-12 rounded-xl font-black shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-70"
        >
          {isExporting ? (
            "Processing..."
          ) : (
            <>
              <span>📊</span> Download Excel
            </>
          )}
        </button>

        <button
          onClick={handlePDFExport}
          disabled={isExporting}
          className="flex-1 bg-red-500 text-white h-12 rounded-xl font-black shadow-md flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-70"
        >
          {isExporting ? (
            "Processing..."
          ) : (
            <>
              <span>📄</span> Download PDF
            </>
          )}
        </button>
      </div>

      <style jsx>{`
        .input-field {
          width: 100%;
          background-color: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          font-weight: 700;
          color: #111827;
          outline: none;
          transition: border-color 0.2s;
        }
        .input-field:focus {
          border-color: #3b82f6;
          background-color: #ffffff;
        }
      `}</style>
    </div>
  );
}
