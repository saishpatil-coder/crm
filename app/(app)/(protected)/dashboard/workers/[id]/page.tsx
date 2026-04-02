"use client";

import MultiSelectDropdown from "@/components/DropDown";
import { useLanguage } from "@/context/LanguageContext";
import { useNetwork } from "@/hooks/useNetwork";
import { apiClient } from "@/lib/appClient";
import { localDb } from "@/lib/db";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";

const dict = {
  en: {
    title: "Edit Team Member",
    nameLabel: "Full Name",
    namePlaceholder: "Enter full name",
    mobileLabel: "Mobile Number",
    mobilePlaceholder: "10-digit mobile number",
    passwordLabel: "Update Password (Optional)",
    passwordPlaceholder: "Leave blank to keep existing password",
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
    submitBtn: "Update Account",
    submitting: "Updating...",
    offlineMsg: "You are offline. Reconnect to edit team members.",
    successMsg: "Team member updated successfully!",
  },
  mr: {
    title: "टीम सदस्यामध्ये बदल करा",
    nameLabel: "पूर्ण नाव",
    namePlaceholder: "पूर्ण नाव प्रविष्ट करा",
    mobileLabel: "मोबाईल नंबर",
    mobilePlaceholder: "१० अंकी मोबाईल नंबर",
    passwordLabel: "पासवर्ड अपडेट करा (पर्यायी)",
    passwordPlaceholder: "विद्यमान पासवर्ड ठेवण्यासाठी रिक्त सोडा",
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
    submitBtn: "खाते अपडेट करा",
    submitting: "अपडेट करत आहे...",
    offlineMsg: "तुम्ही ऑफलाइन आहात. बदल करण्यासाठी इंटरनेटशी कनेक्ट करा.",
    successMsg: "टीम सदस्य यशस्वीरित्या अपडेट झाला!",
  },
  hi: {
    title: "टीम सदस्य संपादित करें",
    nameLabel: "पूरा नाम",
    namePlaceholder: "पूरा नाम दर्ज करें",
    mobileLabel: "मोबाइल नंबर",
    mobilePlaceholder: "10 अंकों का मोबाइल नंबर",
    passwordLabel: "पासवर्ड अपडेट करें (वैकल्पिक)",
    passwordPlaceholder: "मौजूदा पासवर्ड रखने के लिए खाली छोड़ें",
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
    submitBtn: "खाता अपडेट करें",
    submitting: "अपडेट किया जा रहा है...",
    offlineMsg: "आप ऑफ़लाइन हैं। संपादित करने के लिए पुन: कनेक्ट करें।",
    successMsg: "टीम सदस्य सफलतापूर्वक अपडेट किया गया!",
  },
};

export default function EditWorkerPage() {
  const router = useRouter();
  const params = useParams();
  const workerId = params.id as string;

  const { lang } = useLanguage();
  const t = dict[lang as keyof typeof dict];
  const isOnline = useNetwork();

  const [availableBooths, setAvailableBooths] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    mobileNumber: "",
    password: "", // Password starts blank, only updated if filled
    role: "WORKER",
    assignedBooths: [] as string[],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingInfo, setIsFetchingInfo] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    async function initData() {
      // 1. Fetch available booths from the local PWA DB cache
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

      // 2. Fetch the existing worker details from API
      try {
        const response = await apiClient.get(`/workers/${workerId}`);
        const workerData = response.data;
        setFormData({
          name: workerData.name || "",
          mobileNumber: workerData.mobileNumber || "",
          password: "", // Deliberately blank
          role: workerData.role || "WORKER",
          assignedBooths: workerData.assignedBooths || [],
        });
      } catch (error) {
        console.error("Failed to load worker details", error);
        setErrorMsg("Failed to load worker details.");
      } finally {
        setIsFetchingInfo(false);
      }
    }
    
    if (workerId && isOnline) {
       initData();
    } else if (!isOnline) {
       setIsFetchingInfo(false); // We can't fetch if offline
    }
  }, [workerId, isOnline]);

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
    if (formData.password.length > 0 && formData.password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.put(`/workers/${workerId}`, formData);
      setSuccessMsg(t.successMsg);
      setTimeout(() => {
        router.push("/dashboard/workers");
      }, 1500);
    } catch (error: any) {
      setErrorMsg(
        error.response?.data?.error ||
          "Failed to update member. Number might already exist.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass =
    "w-full h-14 px-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none text-gray-900 font-bold transition-all placeholder-gray-400";
  const labelClass = "block text-sm font-extrabold text-gray-800 mb-2";

  if (isFetchingInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="font-bold text-gray-500">Loading details...</p>
      </div>
    );
  }

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
                value={formData.password}
                onChange={handleChange}
                placeholder={t.passwordPlaceholder}
                className={inputClass}
                disabled={isLoading || !isOnline}
              />
            </div>

            <div className="w-full h-px bg-gray-100 my-1"></div>

            {/* CUSTOM MULTI-SELECT DROPDOWN */}
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
