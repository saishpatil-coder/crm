"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ExportColumn
{
    header: string;
    key: string;
    // Optional formatter function if you need to combine data (e.g., age + gender)
    format?: (row: any) => string | number;
}

interface ExportButtonsProps
{
    data: any[];
    columns: ExportColumn[];
    fileName: string;
    title?: string; // Title to print at the top of the PDF
    disabled?: boolean;
}

export default function ExportButtons({
    data,
    columns,
    fileName,
    title = "Exported Data",
    disabled = false,
}: ExportButtonsProps)
{
    const [isExporting, setIsExporting] = useState(false);

    const getFinalFileName = (ext: string) =>
    {
        const base = fileName.trim() || `Export_${new Date().getTime()}`;
        return `${base.replace(/\s+/g, "_")}.${ext}`;
    };

    // --- EXCEL EXPORT ---
    const handleExcelExport = () =>
    {
        if (data.length === 0) return alert("No data to export.");
        setIsExporting(true);

        setTimeout(() =>
        {
            try {
                // Map the raw data into the exact format requested by the columns
                const formattedData = data.map((row) =>
                {
                    const formattedRow: any = {};
                    columns.forEach((col) =>
                    {
                        formattedRow[col.header] = col.format ? col.format(row) : row[col.key] || "-";
                    });
                    return formattedRow;
                });

                const worksheet = XLSX.utils.json_to_sheet(formattedData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
                XLSX.writeFile(workbook, getFinalFileName("xlsx"));
            } finally {
                setIsExporting(false);
            }
        }, 100);
    };

    // --- PDF EXPORT ---
    const handlePDFExport = () =>
    {
        if (data.length === 0) return alert("No data to export.");
        if (data.length > 5000) return alert("Warning: Generating a PDF with over 5000 rows may freeze your browser. Use Excel.");

        setIsExporting(true);

        setTimeout(() =>
        {
            try {
                const doc = new jsPDF("landscape");

                // Document Header
                doc.setFontSize(14);
                doc.text(title, 14, 15);
                doc.setFontSize(10);
                doc.text(`Total: ${data.length} records | Generated: ${new Date().toLocaleDateString()}`, 14, 22);

                // Map Data for AutoTable
                const tableHeaders = columns.map((col) => col.header);
                const tableRows = data.map((row) =>
                    columns.map((col) => col.format ? col.format(row) : row[col.key] || "-")
                );

                autoTable(doc, {
                    head: [tableHeaders],
                    body: tableRows,
                    startY: 28,
                    theme: "grid",
                    styles: { fontSize: 8 },
                });

                doc.save(getFinalFileName("pdf"));
            } finally {
                setIsExporting(false);
            }
        }, 100);
    };

    return (
        <div className="flex gap-3 w-full">
            <button
                onClick={handleExcelExport}
                disabled={disabled || isExporting}
                className="flex-1 h-14 bg-emerald-600 text-white rounded-xl font-black shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {isExporting ? "..." : <><span>📊</span> Excel</>}
            </button>
            <button
                onClick={handlePDFExport}
                disabled={disabled || isExporting}
                className="flex-1 h-14 bg-red-600 text-white rounded-xl font-black shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
                {isExporting ? "..." : <><span>📄</span> PDF</>}
            </button>
        </div>
    );
}