"use client";

import MultiSelectDropdown from "@/components/DropDown";
import { useLanguage } from "@/context/LanguageContext";
import { useNetwork } from "@/hooks/useNetwork";
import { apiClient } from "@/lib/appClient";
import { localDb } from "@/lib/db";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

const dict = {
  en: {
    title: "Add New Team Member",
    nameLabel: "Full Name",
    namePlaceholder: "Enter full name",
    mobileLabel: "Mobile Number",
    mobilePlaceholder: "10-digit mobile number",
    passwordLabel: "Temporary Password",
    passwordPlaceholder: "Set a password for login",
    roleLabel: "Assign Role",
    roleWorker: "Worker",
    roleAdmin: "Admin",
    workerDesc: "Can add voters",
    adminDesc: "Can manage team",
    boothsLabel: "Assign Polling Booths",
    selectAll: "Select All",
    clear: "Clear",
    noBooths: "No booths available.",
    selectBooths: "Select Booths",
    searchBooths: "Search booths...",
    submitBtn: "Create Account",
    submitting: "Creating...",
    offlineMsg: "You are offline. Reconnect to add team members.",
    successMsg: "Team member added successfully!",
  },
  mr: {
    title: "नवीन टीम सदस्य जोडा",
    nameLabel: "पूर्ण नाव",
    namePlaceholder: "पूर्ण नाव प्रविष्ट करा",
    mobileLabel: "मोबाईल नंबर",
    mobilePlaceholder: "१० अंकी मोबाईल नंबर",
    passwordLabel: "तात्पुरता पासवर्ड",
    passwordPlaceholder: "लॉगिनसाठी पासवर्ड सेट करा",
    roleLabel: "भूमिका नियुक्त करा",
    roleWorker: "कार्यकर्ता",
    roleAdmin: "अॅडमिन",
    workerDesc: "मतदार जोडू शकतो",
    adminDesc: "टीम व्यवस्थापित करू शकतो",
    boothsLabel: "मतदान केंद्रे नियुक्त करा",
    selectAll: "सर्व निवडा",
    clear: "काढून टाका",
    noBooths: "केंद्रे उपलब्ध नाहीत.",
    selectBooths: "केंद्रे निवडा",
    searchBooths: "केंद्रे शोधा...",
    submitBtn: "खाते तयार करा",
    submitting: "तयार करत आहे...",
    offlineMsg: "तुम्ही ऑफलाइन आहात. जोडण्यासाठी इंटरनेटशी कनेक्ट करा.",
    successMsg: "टीम सदस्य यशस्वीरित्या जोडला!",
  },
  hi: {
    title: "नया टीम सदस्य जोड़ें",
    nameLabel: "पूरा नाम",
    namePlaceholder: "पूरा नाम दर्ज करें",
    mobileLabel: "मोबाइल नंबर",
    mobilePlaceholder: "10 अंकों का मोबाइल नंबर",
    passwordLabel: "अस्थायी पासवर्ड",
    passwordPlaceholder: "लॉगिन के लिए पासवर्ड सेट करें",
    roleLabel: "भूमिका सौंपें",
    roleWorker: "कार्यकर्ता",
    roleAdmin: "एडमिन",
    workerDesc: "मतदाता जोड़ सकते हैं",
    adminDesc: "टीम प्रबंधित कर सकते हैं",
    boothsLabel: "मतदान केंद्र सौंपें",
    selectAll: "सभी चुनें",
    clear: "हटाएं",
    noBooths: "कोई बूथ उपलब्ध नहीं है।",
    selectBooths: "बूथ चुनें",
    searchBooths: "बूथ खोजें...",
    submitBtn: "खाता बनाएं",
    submitting: "बनाया जा रहा है...",
    offlineMsg: "आप ऑफ़लाइन हैं। जोड़ने के लिए पुन: कनेक्ट करें।",
    successMsg: "टीम सदस्य सफलतापूर्वक जोड़ा गया!",
  },
};

export default function AddWorkerPage() {
  const router = useRouter();
  const { lang } = useLanguage();
  const t = dict[lang as keyof typeof dict];
  const isOnline = useNetwork();

  const [availableBooths, setAvailableBooths] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    mobileNumber: "",
    password: "",
    role: "WORKER",
    assignedBooths: [] as string[],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchBooths() {
      try {
        const voters = await localDb.voters.toArray();
        const uniqueBooths = (
          Array.from(
            new Set(
              voters.map((v) => v.pollingStation?.trim()).filter(Boolean),
            ),
          ) as string[]
        ).sort();

        setAvailableBooths(uniqueBooths);
      } catch (error) {
        console.error("Failed to load booths from local DB", error);
      }
    }
    fetchBooths();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRoleSelect = (role: "WORKER" | "SUB_ADMIN") => {
    setFormData({ ...formData, role });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (formData.mobileNumber.length !== 10) {
      setErrorMsg("Mobile number must be exactly 10 digits.");
      return;
    }
    if (formData.password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post("/workers", formData);
      setSuccessMsg(t.successMsg);
      setFormData({
        name: "",
        mobileNumber: "",
        password: "",
        role: "WORKER",
        assignedBooths: [],
      });
      setTimeout(() => {
        router.push("/dashboard/workers");
      }, 1500);
    } catch (error: any) {
      setErrorMsg(
        error.response?.data?.error ||
          "Failed to add member. Number might already exist.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBooths = availableBooths.filter((booth) =>
    booth.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const inputClass =
    "w-full h-14 px-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none text-gray-900 font-bold transition-all placeholder-gray-400";
  const labelClass = "block text-sm font-extrabold text-gray-800 mb-2";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      {/* Sticky Header */}
      <div className="bg-white px-4 pt-6 pb-4 shadow-sm sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-gray-500 font-bold active:bg-gray-100 p-2 rounded-full -ml-2 transition-colors"
          >
            ←
          </button>
          <h1 className="text-xl font-extrabold text-gray-900 leading-tight">
            {t.title}
          </h1>
        </div>
      </div>

      <div className="p-5">
        {!isOnline && (
          <div className="mb-6 p-4 bg-orange-50 border-2 border-orange-200 rounded-2xl flex items-center gap-3">
            <span className="text-2xl animate-bounce">📡</span>
            <p className="text-orange-800 font-bold text-sm leading-tight">
              {t.offlineMsg}
            </p>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-700 font-bold rounded-2xl text-sm">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 text-green-700 font-bold rounded-2xl text-sm flex items-center gap-2">
            <span>✅</span> {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-5">
            {/* ROLE SELECTOR */}
            <div>
              <label className={labelClass}>{t.roleLabel}</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleRoleSelect("WORKER")}
                  className={`flex-1 p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                    formData.role === "WORKER"
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-2xl">👷</span>
                  <span className="font-bold text-sm">{t.roleWorker}</span>
                  <span
                    className={`text-[10px] font-bold ${formData.role === "WORKER" ? "text-blue-500" : "text-gray-400"}`}
                  >
                    {t.workerDesc}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSelect("SUB_ADMIN")}
                  className={`flex-1 p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                    formData.role === "SUB_ADMIN"
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-2xl">👔</span>
                  <span className="font-bold text-sm">{t.roleAdmin}</span>
                  <span
                    className={`text-[10px] font-bold ${formData.role === "SUB_ADMIN" ? "text-blue-500" : "text-gray-400"}`}
                  >
                    {t.adminDesc}
                  </span>
                </button>
              </div>
            </div>

            <div className="w-full h-px bg-gray-100 my-1"></div>

            {/* BASIC INFO */}
            <div>
              <label className={labelClass}>{t.nameLabel}</label>
              <input
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder={t.namePlaceholder}
                className={inputClass}
                disabled={isLoading || !isOnline}
              />
            </div>

            <div>
              <label className={labelClass}>{t.mobileLabel}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                  +91
                </span>
                <input
                  name="mobileNumber"
                  type="tel"
                  required
                  maxLength={10}
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  placeholder={t.mobilePlaceholder}
                  className={`${inputClass} pl-12`}
                  disabled={isLoading || !isOnline}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>{t.passwordLabel}</label>
              <input
                name="password"
                type="text"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder={t.passwordPlaceholder}
                className={inputClass}
                disabled={isLoading || !isOnline}
              />
            </div>

            <div className="w-full h-px bg-gray-100 my-1"></div>

            {/* --- CUSTOM MULTI-SELECT DROPDOWN WITH CHECKBOXES --- */}
            {/* <div ref={dropdownRef} className="relative">
              <label className={labelClass}>{t.boothsLabel}</label>

              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full h-14 px-4 bg-gray-50 border-2 border-gray-200 rounded-xl flex justify-between items-center text-gray-900 font-bold"
              >
                <span className="truncate">
                  {formData.assignedBooths.length === 0
                    ? t.selectBooths
                    : `${formData.assignedBooths.length} Booths Selected`}
                </span>
                <svg
                  className={`w-5 h-5 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col">
                  <div className="p-3 border-b border-gray-100 bg-gray-50">
                    <input
                      type="text"
                      placeholder={t.searchBooths}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div className="flex justify-between items-center px-4 py-2 border-b border-gray-100 bg-white">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          assignedBooths: availableBooths,
                        })
                      }
                      className="text-[10px] font-black text-blue-600 uppercase tracking-wider"
                    >
                      {t.selectAll}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, assignedBooths: [] })
                      }
                      className="text-[10px] font-black text-red-500 uppercase tracking-wider"
                    >
                      {t.clear}
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto">
                    {filteredBooths.length === 0 ? (
                      <div className="p-4 text-center text-sm font-bold text-gray-400">
                        {t.noBooths}
                      </div>
                    ) : (
                      filteredBooths.map((booth) => (
                        <label
                          key={booth}
                          className="flex items-center gap-3 p-3 border-b border-gray-50 hover:bg-blue-50 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={formData.assignedBooths.includes(booth)}
                            onChange={() => toggleBooth(booth)}
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-bold text-gray-800 line-clamp-1">
                            {booth}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div> */}
            <MultiSelectDropdown
            label={t.boothsLabel}
            options={availableBooths}
            selected={formData.assignedBooths}
            onChange={(selected) =>
              setFormData({ ...formData, assignedBooths: selected })
            }
            searchPlaceholder={t.searchBooths}
            selectAllText={t.selectAll}
            clearText={t.clear}
            noDataText={t.noBooths}
            
            />
        
          </div>

          <button
            type="submit"
            disabled={isLoading || !isOnline}
            className="w-full h-16 bg-blue-600 text-white text-xl font-black rounded-2xl shadow-[0_8px_16px_-6px_rgba(37,99,235,0.4)] disabled:bg-gray-300 disabled:shadow-none active:scale-[0.98] transition-all flex items-center justify-center"
          >
            {isLoading ? t.submitting : t.submitBtn}
          </button>
        </form>
      </div>
    </div>
  );
}
