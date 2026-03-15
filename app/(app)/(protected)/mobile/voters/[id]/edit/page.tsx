'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { localDb, LocalVoter } from '@/lib/db';
import { useLanguage } from '@/context/LanguageContext';
import { useColor, ThemeColor } from '@/context/ColorContext';

const dict = {
  en: {
    editProfile: "Edit Voter Details",
    personalInfo: "Personal Details",
    locationInfo: "Location & Family",
    campaignStatus: "Campaign Status",
    markVisited: "Mark as Visited",
    supportLevel: "Support Level",
    saveBtn: "Save Updates",
    saved: "Saved Successfully!",
    notFound: "Voter not found.",
    mobile: "Mobile Number",
    caste: "Caste / Community",
    notes: "Worker Notes",
    houseNo: "House Number",
    isAlive: "Voter is Alive",
    isDead: "Marked Deceased",
    hasVoted: "Has Voted",
    notVoted: "Not Voted Yet",
    levels: {
      STRONG: "Strong Support",
      NEUTRAL: "Neutral",
      WEAK: "Weak Support",
      AGAINST: "Against",
      UNKNOWN: "Not Decided"
    }
  },
  mr: {
    editProfile: "मतदार तपशील संपादित करा",
    personalInfo: "वैयक्तिक तपशील",
    locationInfo: "ठिकाण आणि कुटुंब",
    campaignStatus: "मोहीम स्थिती",
    markVisited: "भेट दिल्याची नोंद करा",
    supportLevel: "समर्थन पातळी",
    saveBtn: "बदल सेव्ह करा",
    saved: "यशस्वीरित्या सेव्ह केले!",
    notFound: "मतदार सापडला नाही.",
    mobile: "मोबाईल नंबर",
    caste: "जात / समाज",
    notes: "कार्यकर्त्यांच्या नोंदी",
    houseNo: "घर क्रमांक",
    isAlive: "मतदार जिवंत आहे",
    isDead: "मयत",
    hasVoted: "मतदान केले",
    notVoted: "मतदान बाकी",
    levels: {
      STRONG: "भक्कम पाठिंबा",
      NEUTRAL: "तटस्थ",
      WEAK: "कमकुवत पाठिंबा",
      AGAINST: "विरोधात",
      UNKNOWN: "ठरलेले नाही"
    }
  },
  hi: {
    editProfile: "मतदाता विवरण संपादित करें",
    personalInfo: "व्यक्तिगत जानकारी",
    locationInfo: "स्थान और परिवार",
    campaignStatus: "अभियान की स्थिति",
    markVisited: "भेंट के रूप में चिह्नित करें",
    supportLevel: "समर्थन स्तर",
    saveBtn: "बदलाव सेव करें",
    saved: "सफलतापूर्वक सेव किया गया!",
    notFound: "मतदाता नहीं मिला।",
    mobile: "मोबाइल नंबर",
    caste: "जाति / समुदाय",
    notes: "कार्यकर्ता नोट्स",
    houseNo: "मकान नंबर",
    isAlive: "मतदाता जीवित है",
    isDead: "मृत घोषित",
    hasVoted: "मतदान किया",
    notVoted: "मतदान नहीं किया",
    levels: {
      STRONG: "मजबूत समर्थन",
      NEUTRAL: "तटस्थ",
      WEAK: "कमजोर समर्थन",
      AGAINST: "खिलाफ",
      UNKNOWN: "तय नहीं"
    }
  }
};

export default function VoterEditPage() {
  const router = useRouter();
  const params = useParams();
  const voterId = Number(params.id);

  const { lang } = useLanguage();
  const t = dict[lang as keyof typeof dict];
  const { primaryColor } = useColor();

  const [voter, setVoter] = useState<LocalVoter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Editable State
  const [formData, setFormData] = useState({
    isVisited: false,
    supportLevel: 'UNKNOWN',
    isAlive: true,
    hasVoted: false,
    mobileNumber: '',
    caste: '',
    notes: '',
    houseNumber: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Theme mapping
  const themeStyles: Record<ThemeColor, string> = {
    blue: "bg-blue-600 text-white",
    green: "bg-emerald-600 text-white",
    orange: "bg-orange-500 text-white",
    purple: "bg-purple-600 text-white",
    red: "bg-red-600 text-white",
  };
  const themeClass = themeStyles[primaryColor] || themeStyles.blue;

  useEffect(() => {
    async function loadVoter() {
      try {
        const data = await localDb.voters.get(voterId);
        if (data) {
          setVoter(data);
          setFormData({
            isVisited: data.isVisited || false,
            supportLevel: data.supportLevel || 'UNKNOWN',
            isAlive: data.isAlive !== false, 
            hasVoted: data.hasVoted || false,
            mobileNumber: data.mobileNumber || '',
            caste: data.caste || '',
            notes: data.notes || '',
            houseNumber: data.houseNumber || '',
          });
        }
      } catch (error) {
        console.error("Failed to load voter details", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadVoter();
  }, [voterId]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!voter) return;
    setIsSaving(true);

    try {
      const updates = { ...formData };

      // 1. Update local DB
      await localDb.voters.update(voterId, updates);

      // 2. Queue for server sync
      await localDb.syncQueue.add({
        action: 'UPDATE_VOTER',
        payload: { id: voter.id, ...updates },
        createdAt: Date.now()
      });

      setShowSuccess(true);
      setTimeout(() => router.back(), 1000); // Go back to the View page
      
    } catch (error) {
      console.error("Failed to save updates", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!voter) return <div className="min-h-screen bg-gray-50 flex items-center justify-center font-bold text-gray-500">{t.notFound}</div>;

  // Reusable text input
  const renderInput = (label: string, field: keyof typeof formData, placeholder: string, type = "text") => (
    <div className="flex flex-col gap-1.5 mb-4">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">{label}</label>
      <input
        type={type}
        value={String(formData[field])}
        onChange={(e) => handleInputChange(field, e.target.value)}
        placeholder={placeholder}
        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:bg-white focus:border-blue-500 outline-none transition-colors"
      />
    </div>
  );

  return (
    // 1. Native Stacked Layout (h-[100dvh])
    <div className="h-[100dvh] bg-gray-100 flex flex-col overflow-hidden md:max-w-md md:mx-auto md:shadow-2xl md:border-x border-gray-200">
      
      {/* --- Header (shrink-0) --- */}
      <div className={`${themeClass} px-4 pt-6 pb-4 shadow-md flex items-center gap-3 shrink-0`}>
        <button onClick={() => router.back()} className="active:bg-white/20 p-2 rounded-full -ml-2 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="text-xl font-black truncate">{t.editProfile}</h1>
      </div>

      {/* --- Scrollable Body Area (flex-1 overflow-y-auto) --- */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 p-3">
        
        {/* Name Banner */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 shrink-0">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-0.5">Editing</p>
          <h2 className="text-xl font-black text-gray-900 leading-tight">{voter.fullName}</h2>
          <span className="text-xs font-bold text-gray-500">{voter.epicNumber}</span>
        </div>

        {/* 1. Quick Status Toggles (Alive & Voted) */}
        <div className="grid grid-cols-2 gap-3 shrink-0">
          <button 
            onClick={() => handleInputChange('isAlive', !formData.isAlive)}
            className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${formData.isAlive ? 'bg-white border-gray-200' : 'bg-red-50 border-red-500'}`}
          >
            <span className="text-2xl">{formData.isAlive ? '💗' : '💀'}</span>
            <span className={`text-[10px] font-black uppercase tracking-wider ${formData.isAlive ? 'text-gray-500' : 'text-red-700'}`}>
              {formData.isAlive ? t.isAlive : t.isDead}
            </span>
          </button>

          <button 
            onClick={() => handleInputChange('hasVoted', !formData.hasVoted)}
            className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all ${formData.hasVoted ? 'bg-purple-50 border-purple-500' : 'bg-white border-gray-200'}`}
          >
            <span className="text-2xl">{formData.hasVoted ? '🗳️' : '⏳'}</span>
            <span className={`text-[10px] font-black uppercase tracking-wider ${formData.hasVoted ? 'text-purple-700' : 'text-gray-500'}`}>
              {formData.hasVoted ? t.hasVoted : t.notVoted}
            </span>
          </button>
        </div>

        {/* Hide rest of form if they are marked Deceased */}
        {formData.isAlive && (
          <>
            {/* 2. Campaign Status */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 shrink-0">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-3">{t.campaignStatus}</h3>
              
              <div 
                onClick={() => handleInputChange('isVisited', !formData.isVisited)}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-colors cursor-pointer active:scale-[0.98] ${formData.isVisited ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${formData.isVisited ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 bg-white'}`}>
                  {formData.isVisited && "✓"}
                </div>
                <span className={`font-black text-sm ${formData.isVisited ? 'text-green-800' : 'text-gray-600'}`}>{t.markVisited}</span>
              </div>

              {formData.isVisited && (
                <div className="mt-4 animate-in fade-in">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">{t.supportLevel}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { val: 'STRONG', label: t.levels.STRONG, color: 'bg-green-100 text-green-700 border-green-500' },
                      { val: 'NEUTRAL', label: t.levels.NEUTRAL, color: 'bg-blue-100 text-blue-700 border-blue-500' },
                      { val: 'WEAK', label: t.levels.WEAK, color: 'bg-orange-100 text-orange-700 border-orange-500' },
                      { val: 'AGAINST', label: t.levels.AGAINST, color: 'bg-red-100 text-red-700 border-red-500' }
                    ].map(opt => (
                      <button
                        key={opt.val}
                        onClick={() => handleInputChange('supportLevel', opt.val)}
                        className={`p-2.5 rounded-xl border-2 font-black text-[10px] uppercase tracking-wider transition-all active:scale-95 ${
                          formData.supportLevel === opt.val ? opt.color : 'bg-white border-gray-100 text-gray-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Personal Data Input */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 shrink-0">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-3">{t.personalInfo}</h3>
              {renderInput(t.mobile, "mobileNumber", "Enter Mobile Number", "tel")}
              {renderInput(t.caste, "caste", "e.g. Maratha, Mali, etc.")}
              
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">{t.notes}</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Any specific requests or feedback?"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:bg-white focus:border-blue-500 outline-none transition-colors min-h-[80px]"
                />
              </div>
            </div>

            {/* 4. Location Input */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 shrink-0">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2 mb-3">{t.locationInfo}</h3>
              {renderInput(t.houseNo, "houseNumber", "Enter House Number")}
            </div>
          </>
        )}
      </div>

      {/* --- Footer (Save Button) (shrink-0) --- */}
      {/* Sits naturally at the bottom. pb-20 pads it above the global BottomNav */}
      <div className="bg-white p-4 border-t border-gray-200 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] shrink-0 pb-20">
        <button
          onClick={handleSave}
          disabled={isSaving || showSuccess}
          className={`w-full h-14 rounded-2xl font-black text-lg shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
            showSuccess ? 'bg-green-500 text-white' : themeClass
          }`}
        >
          {showSuccess ? (
            <><span>✅</span> {t.saved}</>
          ) : isSaving ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            t.saveBtn
          )}
        </button>
      </div>

    </div>
  );
}