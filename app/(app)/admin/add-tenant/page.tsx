'use client';

import { apiClient } from '@/lib/appClient';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AddTenantPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    candidateName: '',
    partyName: '',
    constituencyName: '',
    constituencyNumber: '',
    electionType: '',
    subAdminName: '',
    subAdminMobile: '',
    password: '',
    candidateImageBase64: '',
    partyLogoBase64: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'candidateImageBase64' | 'partyLogoBase64') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be under 2MB. Please select a smaller file.");
      e.target.value = ''; 
      return;
    }

    try {
      const base64String = await convertToBase64(file);
      setFormData(prev => ({ ...prev, [fieldName]: base64String }));
    } catch (error) {
      console.error("Failed to convert image to Base64", error);
      alert("Failed to process image. Try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      await apiClient.post('/admin/tenants', formData);
      router.push('/dashboard');
    } catch (error: any) {
      setErrorMsg(error.response?.data?.error || "Failed to create campaign.");
    } finally {
      setIsLoading(false);
    }
  };

  // Shared input styling for consistency
  const inputClass = "w-full h-14 px-4 bg-gray-50 border-2 border-gray-300 rounded-xl focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none text-gray-900 font-bold transition-all placeholder-gray-400";
  const labelClass = "block text-sm font-extrabold text-gray-800 mb-2";

  return (
    // The md: classes here fix the layout breaking on desktop!
    <div className="min-h-screen bg-gray-100 flex flex-col pb-20 md:max-w-md md:mx-auto md:bg-gray-50 md:shadow-2xl md:border-x border-gray-200">

{/* --- Premium Stacked Top Bar --- */}
      <div className="bg-white px-5 pt-5 pb-4 shadow-sm sticky top-0 z-20 border-b border-gray-200 flex flex-col gap-3">
        {/* Row 1: Back Button */}
        <button 
          onClick={() => router.back()}
          className="text-blue-600 font-bold text-sm flex items-center gap-1 active:bg-blue-50 py-1 px-2 -ml-2 rounded-lg w-max transition-colors"
        >
          <span className="text-lg leading-none mb-[2px]">←</span> Back
        </button>
        
        {/* Row 2: Large Page Title */}
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">
          Create Campaign
        </h1>
      </div>

      <div className="p-4 w-full">

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-xl text-sm font-bold shadow-sm">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">

          {/* --- Campaign Details Section --- */}
          <div className="flex flex-col gap-5">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b-2 border-gray-200 pb-2">
              Campaign Details
            </h2>

            <div>
              <label className={labelClass}>Candidate Name</label>
              <input name="candidateName" placeholder="e.g. Rahul Patil" required value={formData.candidateName} onChange={handleChange} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Party Name</label>
              <input name="partyName" placeholder="e.g. Independent" value={formData.partyName} onChange={handleChange} className={inputClass} />
            </div>

            <div>
              <label className={labelClass}>Election Type</label>
              <select name="electionType" value={formData.electionType} onChange={handleChange} className={`${inputClass} appearance-none`}>
                <option value="">Select Election Type</option>
                <option value="Assembly">Assembly</option>
                <option value="Parliament">Parliament</option>
                <option value="Local Body">Local Body</option>
              </select>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label className={labelClass}>Constituency</label>
                <input name="constituencyName" placeholder="Name" required value={formData.constituencyName} onChange={handleChange} className={inputClass} />
              </div>
              <div className="w-1/3">
                <label className={labelClass}>Number</label>
                <input name="constituencyNumber" placeholder="No." type="number" value={formData.constituencyNumber} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            {/* Custom Image Uploaders */}
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <label className={labelClass}>Candidate Photo</label>
                <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${formData.candidateImageBase64 ? 'border-green-500 bg-green-50' : 'border-gray-400 bg-white active:bg-gray-100'}`}>
                  <span className={`text-sm font-bold ${formData.candidateImageBase64 ? 'text-green-700' : 'text-gray-500'}`}>
                    {formData.candidateImageBase64 ? '✅ Selected' : '+ Upload'}
                  </span>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'candidateImageBase64')} className="hidden" />
                </label>
              </div>

              <div>
                <label className={labelClass}>Party Logo</label>
                <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${formData.partyLogoBase64 ? 'border-green-500 bg-green-50' : 'border-gray-400 bg-white active:bg-gray-100'}`}>
                  <span className={`text-sm font-bold ${formData.partyLogoBase64 ? 'text-green-700' : 'text-gray-500'}`}>
                    {formData.partyLogoBase64 ? '✅ Selected' : '+ Upload'}
                  </span>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'partyLogoBase64')} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          {/* --- Sub Admin Setup Section --- */}
          <div className="flex flex-col gap-5 mt-4">
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest border-b-2 border-gray-200 pb-2">
              Sub Admin Setup
            </h2>

            <div>
              <label className={labelClass}>Admin Full Name</label>
              <input name="subAdminName" placeholder="Manager's Name" required value={formData.subAdminName} onChange={handleChange} className={inputClass} />
            </div>
            
            <div>
              <label className={labelClass}>Mobile Number</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-500">+91</span>
                <input 
                  name="subAdminMobile" 
                  placeholder="00000 00000" 
                  required 
                  maxLength={10} 
                  type="tel"
                  value={formData.subAdminMobile} 
                  onChange={(e) => setFormData({ ...formData, subAdminMobile: e.target.value.replace(/\D/g, '') })} 
                  className={`${inputClass} pl-12`} 
                />
              </div>
            </div>
            
            <div>
              <label className={labelClass}>Temporary Password</label>
              <input 
                name="password" 
                placeholder="Enter strong password" 
                type="text" 
                required 
                value={formData.password} 
                onChange={handleChange} 
                className={inputClass} 
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 pb-10">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-16 bg-blue-600 text-white text-xl font-black rounded-2xl shadow-[0_8px_16px_-6px_rgba(37,99,235,0.4)] disabled:bg-blue-300 active:scale-[0.98] transition-all flex items-center justify-center"
            >
              {isLoading ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}