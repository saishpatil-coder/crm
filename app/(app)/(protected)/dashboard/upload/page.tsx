"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useNetwork } from "@/hooks/useNetwork";
import { apiClient } from "@/lib/appClient";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";

const dict = {
  en: {
    title: "Upload Voter Data",
    subtitle: "Upload your constituency voter list in CSV format.",
    selectFile: "Tap to select a CSV file",
    changeFile: "Change File",
    uploadBtn: "Upload & Process Data",
    uploading: "Processing File... Please wait.",
    successMsg: "Data uploaded successfully!",
    offlineMsg: "You are offline. Reconnect to upload data.",
    errorFileType: "Please upload a valid .csv file.",
    selectDataLanguage: "Select Data Language",
    selectDataLanguageErr: "Please select the language of the data.",
  },
  mr: {
    title: "मतदार डेटा अपलोड करा",
    subtitle: "तुमच्या मतदारसंघाची मतदार यादी CSV फॉरमॅटमध्ये अपलोड करा.",
    selectFile: "CSV फाईल निवडण्यासाठी टॅप करा",
    changeFile: "फाईल बदला",
    uploadBtn: "डेटा अपलोड आणि प्रोसेस करा",
    uploading: "फाईल प्रोसेस होत आहे... कृपया प्रतीक्षा करा.",
    successMsg: "डेटा यशस्वीरित्या अपलोड झाला!",
    offlineMsg: "तुम्ही ऑफलाइन आहात. अपलोड करण्यासाठी इंटरनेटशी कनेक्ट करा.",
    errorFileType: "कृपया वैध .csv फाईल अपलोड करा.",
    selectDataLanguage: "डेटाची भाषा निवडा",
    selectDataLanguageErr: "कृपया डेटाची भाषा निवडा.",
  },
  hi: {
    title: "मतदाता डेटा अपलोड करें",
    subtitle:
      "अपने निर्वाचन क्षेत्र की मतदाता सूची CSV प्रारूप में अपलोड करें।",
    selectFile: "CSV फ़ाइल चुनने के लिए टैप करें",
    changeFile: "फ़ाइल बदलें",
    uploadBtn: "डेटा अपलोड और प्रोसेस करें",
    uploading: "फ़ाइल प्रोसेस हो रही है... कृपया प्रतीक्षा करें।",
    successMsg: "डेटा सफलतापूर्वक अपलोड किया गया!",
    offlineMsg: "आप ऑफ़लाइन हैं। अपलोड करने के लिए पुन: कनेक्ट करें।",
    errorFileType: "कृपया एक मान्य .csv फ़ाइल अपलोड करें।",
    selectDataLanguage: "डेटा की भाषा चुनें",
    selectDataLanguageErr: "कृपया डेटा की भाषा चुनें।",
  },
};

export default function VoterUploadPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const t = dict[lang as keyof typeof dict];
  const isOnline = useNetwork();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dataLanguage, setDataLanguage] = useState<string>(""); // <-- New state for language
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // To show exact stats returned from our awesome backend
  const [stats, setStats] = useState<{
    totalRowsFound: number;
    successfullyInserted: number;
    skippedDueToMissingEpic: number;
    duplicatesSkipped: number;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg("");
    setStats(null);
    const selectedFile = e.target.files?.[0];

    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
        setErrorMsg(t.errorFileType);
        setFile(null);
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!file) return;
    if (!dataLanguage) {
      setErrorMsg(t.selectDataLanguageErr);
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    setStats(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("language", dataLanguage); // <-- Appending language here

    try {
      const { data } = await apiClient.post("/admin/voters/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setStats(data.stats);
      setFile(null);
      setDataLanguage(""); // Clear language selection on success
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error: any) {
      setErrorMsg(
        error.response?.data?.error || "A server error occurred during upload.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      {/* Sticky Header */}
      <div className="bg-white px-4 pt-6 pb-4 shadow-sm sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-gray-500 font-bold active:bg-gray-100 p-2 rounded-full -ml-2 transition-colors"
          >
            ←
          </button>
          <div className="flex flex-col">
            <h1 className="text-xl font-extrabold text-gray-900 leading-tight">
              {t.title}
            </h1>
            <p className="text-xs font-bold text-gray-500 mt-0.5">
              {t.subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-6">
        {/* Offline Warning */}
        {!isOnline && (
          <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-2xl flex items-center gap-3">
            <span className="text-2xl animate-bounce">📡</span>
            <p className="text-orange-800 font-bold text-sm leading-tight">
              {t.offlineMsg}
            </p>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-4 bg-red-50 border-2 border-red-200 text-red-700 font-bold rounded-2xl text-sm">
            {errorMsg}
          </div>
        )}

        {/* Success Stats Dashboard */}
        {stats && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border-2 border-green-500 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-green-700 font-black text-lg">
              <span>✅</span> {t.successMsg}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-1">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 text-center">
                <p className="text-3xl font-black text-gray-900">
                  {stats.totalRowsFound}
                </p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                  Total Rows
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-xl border border-green-100 text-center">
                <p className="text-3xl font-black text-green-700">
                  {stats.successfullyInserted}
                </p>
                <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mt-1">
                  Inserted
                </p>
              </div>
              <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 text-center">
                <p className="text-3xl font-black text-orange-700">
                  {stats.duplicatesSkipped}
                </p>
                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mt-1">
                  Duplicates
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-center">
                <p className="text-3xl font-black text-red-700">
                  {stats.skippedDueToMissingEpic}
                </p>
                <p className="text-[10px] font-black text-red-600 uppercase tracking-widest mt-1">
                  No EPIC
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* NEW: Language Selection */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              {t.selectDataLanguage} <span className="text-red-500">*</span>
            </label>
            <select
              value={dataLanguage}
              onChange={(e) => setDataLanguage(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 font-semibold outline-none"
              required
            >
              <option value="" disabled>
                {t.selectDataLanguage}
              </option>
              <option value="Marathi">Marathi (मराठी)</option>
              <option value="Hindi">Hindi (हिंदी)</option>
              <option value="English">English</option>
            </select>
          </div>

          <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />

            <label
              htmlFor="file-upload"
              className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                file
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                {file ? (
                  <>
                    <span className="text-4xl mb-3">📄</span>
                    <p className="text-sm font-black text-blue-700 break-all">
                      {file.name}
                    </p>
                    <p className="text-xs font-bold text-blue-400 mt-2">
                      {t.changeFile}
                    </p>
                  </>
                ) : (
                  <>
                    <span className="text-4xl mb-3 text-gray-400">📥</span>
                    <p className="text-sm font-black text-gray-600">
                      {t.selectFile}
                    </p>
                    <p className="text-xs font-bold text-gray-400 mt-2">
                      Only .csv files supported
                    </p>
                  </>
                )}
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading || !isOnline || !file || !dataLanguage}
            className="w-full h-16 bg-blue-600 text-white text-xl font-black rounded-2xl shadow-[0_8px_16px_-6px_rgba(37,99,235,0.4)] disabled:bg-gray-300 disabled:shadow-none active:scale-[0.98] transition-all flex items-center justify-center"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                {t.uploading}
              </span>
            ) : (
              t.uploadBtn
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
