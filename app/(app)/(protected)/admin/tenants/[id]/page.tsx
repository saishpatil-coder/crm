"use client";

import ClassyLoader from "@/components/ClassyLoader";
import { useNetwork } from "@/hooks/useNetwork";
import { useOfflineData } from "@/hooks/useOfflineData";
import { apiClient } from "@/lib/appClient";
import { localDb, LocalTenant } from "@/lib/db";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ImageUpload from "@/components/ImageUpload";

export default function TenantDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.id;

  const [tenant, setTenant] = useState<any>(null);
  const [isUsingCache, setIsUsingCache] = useState(false);

  // UI States
  const [isToggling, setIsToggling] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isActive, setIsActive] = useState(false);

  // --- NEW DELETE STATES ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    candidateName: "",
    partyName: "",
    constituencyName: "",
    constituencyNumber: "",
    candidatePhotoUrl: "",
    partyLogoUrl: "",
    newPassword: "",
  });

  const {
    data: tenants,
    isLoading,
    isSyncing,
    isOnline,
  } = useOfflineData<LocalTenant>(`/admin/tenants`, "tenants");

  useEffect(() => {
    if (tenants.length > 0) {
      const reqTenant = tenants.find((i) => Number(i.id) === Number(tenantId));

      if (reqTenant) {
        setTenant(reqTenant);
        setIsActive(Boolean(reqTenant.status));
      }
    }
  }, [tenants, tenantId]);

  const handleToggleStatus = async () => {
    setIsToggling(true);
    const newStatus = !tenant.status;
    try {
      await apiClient.patch(`/admin/tenants/${tenantId}/status`, {
        status: newStatus,
      });
      setTenant({ ...tenant, status: newStatus });
    } catch (error) {
      alert("Failed to update status");
    } finally {
      setIsToggling(false);
    }
  };

  const handleEditClick = () => {
    if (!isOnline) return;
    setFormData({
      candidateName: tenant.candidateName || "",
      partyName: tenant.partyName || "",
      constituencyName: tenant.constituencyName || "",
      constituencyNumber: tenant.constituencyNumber || "",
      candidatePhotoUrl: tenant.candidatePhotoUrl || "",
      partyLogoUrl: tenant.partyLogoUrl || "",
      newPassword: "",
    });
    setIsEditing(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg("");

    try {
      const pass = formData.newPassword;
      const { newPassword, ...profileData } = formData;

      const profileResponse = await apiClient.patch(
        `/admin/tenants/${tenantId}`,
        profileData,
      );
      let finalTenantData = profileResponse.data;

      if (pass && pass.trim() !== "") {
        const passwordResponse = await apiClient.patch(
          `/admin/tenants/${tenantId}`,
          { newPassword: pass },
        );
        finalTenantData = passwordResponse.data;
      }

      setTenant({ ...tenant, ...finalTenantData });
      setIsEditing(false);
    } catch (error: any) {
      setErrorMsg(error.response?.data?.error || "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- NEW DELETE HANDLER ---
  const handleDeleteCampaign = async () => {
    setIsDeleting(true);
    try {
      await apiClient.delete(`/admin/tenants/${tenantId}`);
      // Redirect back to the main admin dashboard after successful deletion
      router.push("/admin");
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to delete campaign.");
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  if (isLoading || isSyncing)
    return (
      <div className="p-10 text-center font-bold text-gray-500">
        <ClassyLoader size={40} color="#3B82F6" />
      </div>
    );

  if (!tenants || !tenant)
    return (
      <div className="p-10 text-center font-bold text-red-500">
        Tenant not found
      </div>
    );

  const inputClass =
    "w-full h-14 px-4 bg-gray-50 border-2 border-gray-300 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none text-gray-900 font-bold transition-all placeholder-gray-400";
  const labelClass = "block text-sm font-extrabold text-gray-800 mb-2";

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col pb-20 md:max-w-md md:mx-auto md:bg-gray-50 md:shadow-2xl md:border-x border-gray-200 relative">
      {/* --- CONFIRMATION MODAL --- */}
      {isDeleteModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center px-4">
          {/* Dark overlay */}
          <div
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
          ></div>

          {/* Modal Box */}
          <div className="bg-white p-6 rounded-3xl shadow-2xl relative z-10 w-full max-w-sm flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mb-4">
              ⚠️
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">
              Delete Campaign?
            </h2>
            <p className="text-sm font-bold text-gray-500 mb-6 leading-relaxed">
              This action cannot be undone. All workers, voters, and data
              associated with{" "}
              <span className="text-gray-900">"{tenant.candidateName}"</span>{" "}
              will be permanently erased.
            </p>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="flex-1 h-12 bg-gray-100 text-gray-700 font-black rounded-xl active:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCampaign}
                disabled={isDeleting}
                className="flex-1 h-12 bg-red-600 text-white font-black rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center disabled:opacity-70"
              >
                {isDeleting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  "Yes, Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Header --- */}
      <div className="bg-white px-5 pt-5 pb-4 shadow-sm sticky top-0 z-20 border-b border-gray-200 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <button
            onClick={() => (isEditing ? setIsEditing(false) : router.back())}
            className="text-blue-600 font-bold text-sm flex items-center gap-1 active:bg-blue-50 py-1 px-2 -ml-2 rounded-lg transition-colors"
          >
            <span className="text-lg leading-none mb-[2px]">←</span>{" "}
            {isEditing ? "Cancel" : "Back"}
          </button>

          {!isEditing && (
            <button
              onClick={handleEditClick}
              className="text-blue-600 font-bold text-sm bg-blue-50 px-4 py-1.5 rounded-full active:bg-blue-100"
            >
              Edit Info
            </button>
          )}
        </div>

        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          {isEditing ? "Edit Campaign" : "Campaign Details"}
        </h1>
        {isUsingCache && !isEditing && (
          <div className="mt-2 text-orange-600 text-xs font-bold flex items-center gap-1">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
            Viewing Offline Cached Data
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-6 w-full">
        {isEditing ? (
          <form onSubmit={handleSaveChanges} className="flex flex-col gap-6">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 font-bold rounded-xl text-sm">
                {errorMsg}
              </div>
            )}

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-5">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b-2 border-gray-200 pb-2">
                Public Details
              </h3>
              <div>
                <label className={labelClass}>Candidate Name</label>
                <input
                  name="candidateName"
                  required
                  value={formData.candidateName}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Party Name</label>
                <input
                  name="partyName"
                  value={formData.partyName}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className={labelClass}>Constituency</label>
                  <input
                    name="constituencyName"
                    required
                    value={formData.constituencyName}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div className="w-1/3">
                  <label className={labelClass}>Number</label>
                  <input
                    name="constituencyNumber"
                    type="number"
                    value={formData.constituencyNumber}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <ImageUpload
                  label="New Photo"
                  value={formData.candidatePhotoUrl}
                  onChange={(url) =>
                    setFormData((prev) => ({ ...prev, candidatePhotoUrl: url }))
                  }
                  preset="evmpwa"
                />

                <ImageUpload
                  label="New Logo"
                  value={formData.partyLogoUrl}
                  onChange={(url) =>
                    setFormData((prev) => ({ ...prev, partyLogoUrl: url }))
                  }
                  preset="evmpwa"
                />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-5">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b-2 border-gray-200 pb-2">
                Sub Admin Access
              </h3>
              <div>
                <label className={labelClass}>Reset Password (Optional)</label>
                <input
                  name="newPassword"
                  type="text"
                  placeholder="Enter new password"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className={inputClass}
                />
                <p className="text-[10px] font-bold text-gray-400 mt-2 ml-1 uppercase tracking-wide">
                  Leave blank to keep current password
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full h-16 bg-blue-600 text-white text-xl font-black rounded-2xl shadow-[0_8px_16px_-6px_rgba(37,99,235,0.4)] disabled:bg-blue-300 active:scale-[0.98] transition-all flex items-center justify-center"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        ) : (
          <>
            {/* View Mode UI */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute top-4 right-4 w-12 h-12 bg-white rounded-full shadow-sm border border-gray-200 overflow-hidden flex items-center justify-center">
                {tenant.partyLogoUrl ? (
                  <img
                    src={tenant.partyLogoUrl}
                    alt="Party Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-xl font-bold">?</span>
                )}
              </div>

              <div className="w-24 h-24 bg-blue-50 border-4 border-white shadow-md rounded-full flex items-center justify-center text-4xl mb-4 overflow-hidden z-10">
                {tenant.candidatePhotoUrl ? (
                  <img
                    src={tenant.candidatePhotoUrl}
                    alt={tenant.candidateName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-blue-200">👤</span>
                )}
              </div>

              <h1 className="text-2xl font-black text-gray-900 leading-tight">
                {tenant.candidateName}
              </h1>
              <p className="text-gray-500 font-bold text-sm mt-1">
                {tenant.partyName || "Independent"}
              </p>

              <div className="mt-4 px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-sm font-extrabold text-blue-700 tracking-wide">
                {tenant.constituencyName}{" "}
                {tenant.constituencyNumber
                  ? `- ${tenant.constituencyNumber}`
                  : ""}
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="font-extrabold text-gray-900 text-lg">
                  System Access
                </h2>
                <p className="text-xs font-medium text-gray-500 mt-1">
                  Enable or disable app access.
                </p>
              </div>
              <button
                onClick={handleToggleStatus}
                disabled={isToggling}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-sm ${
                  isActive
                    ? "bg-red-50 text-red-600 border border-red-200 active:bg-red-100"
                    : "bg-green-50 text-green-700 border border-green-200 active:bg-green-100"
                }`}
              >
                {isToggling ? "..." : isActive ? "Deactivate" : "Activate"}
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b-2 border-gray-200 pb-2">
                Campaign Data
              </h2>
              <div className="grid grid-cols-2 gap-3 mt-1">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
                  <p className="text-gray-500 text-[10px] font-black uppercase tracking-wider mb-1">
                    Workers
                  </p>
                  <p className="text-3xl font-black text-gray-900">
                    {tenant._count?.users || 0}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
                  <p className="text-gray-500 text-[10px] font-black uppercase tracking-wider mb-1">
                    Voters
                  </p>
                  <p className="text-3xl font-black text-gray-900">
                    {tenant._count?.voters || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* --- NEW DANGER ZONE --- */}
            <div className="mt-4 bg-white p-5 rounded-2xl shadow-sm border border-red-100 flex flex-col gap-4">
              <div>
                <h2 className="font-black text-red-600 text-lg">Danger Zone</h2>
                <p className="text-xs font-bold text-gray-500 mt-1">
                  Permanently remove this campaign and all associated data.
                </p>
              </div>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="w-full h-12 bg-red-50 text-red-600 font-black rounded-xl border border-red-200 active:bg-red-100 transition-colors flex items-center justify-center"
              >
                Delete Campaign
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
