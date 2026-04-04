"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { localDb, LocalVoter } from "@/lib/db";
import { useLanguage } from "@/context/LanguageContext";
import { useColor, ThemeColor } from "@/context/ColorContext";
import ClassyLoader from "@/components/ClassyLoader";
import Header from "@/components/Header";
import VoterCard from "@/components/VoterCard";

const dict = {
  en: {
    title: "Family & Relatives",
    headOfFamily: "Household Head",
    noFamily: "No family linked yet.",
    identifyHead: "Identify as Household Head",
    addMember: "Add Family Member",
    relationship: "Relationship",
    save: "Save Member",
    cancel: "Cancel",
    syncing: "Updating English list...",
    memberAdded: "Member added successfully!",
    firstName: "First Name",
    lastName: "Last Name",
    age: "Age",
    gender: "Gender",
    epic: "EPIC Number",
    serial: "Serial Number",
  },
  mr: {
    title: "कुटुंब आणि नातेवाईक",
    headOfFamily: "कुटुंब प्रमुख",
    noFamily: "अद्याप कोणतेही कुटुंब जोडलेले नाही.",
    identifyHead: "कुटुंब प्रमुख म्हणून ओळखा",
    addMember: "नवीन सदस्य जोडा",
    relationship: "नाते",
    save: "सदस्य जतन करा",
    cancel: "रद्द करा",
    syncing: "इंग्रजी यादी अपडेट करत आहे...",
    memberAdded: "सदस्य यशस्वीरित्या जोडला गेला!",
    firstName: "पहिले नाव",
    lastName: "आडनाव",
    age: "वय",
    gender: "लिंग",
    epic: "ओळखपत्र क्र (EPIC)",
    serial: "अनुक्रमांक",
  },
  hi: {
    title: "परिवार और रिश्तेदार",
    headOfFamily: "परिवार का मुखिया",
    noFamily: "अभी तक कोई परिवार नहीं जुड़ा है।",
    identifyHead: "परिवार के मुखिया के रूप में पहचानें",
    addMember: "नया सदस्य जोड़ें",
    relationship: "रिश्ता",
    save: "सदस्य सहेजें",
    cancel: "रद्द करें",
    syncing: "अंग्रेजी सूची अपडेट की जा रही है...",
    memberAdded: "सदस्य सफलतापूर्वक जोड़ा गया!",
    firstName: "पहला नाम",
    lastName: "अंतिम नाम",
    age: "आयु",
    gender: "लिंग",
    epic: "ईपीआईसी नंबर",
    serial: "क्रम संख्या",
  }
};

export default function FamilyManagementPage() {
  const router = useRouter();
  const params = useParams();
  const voterId = Number(params.id);

  const { lang } = useLanguage();
  const t = dict[lang as keyof typeof dict];
  const { primaryColor } = useColor();

  const [voter, setVoter] = useState<LocalVoter | null>(null);
  const [relatives, setRelatives] = useState<LocalVoter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isShowAddModal, setIsShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State for New Member
  const [newMember, setNewMember] = useState({
    firstName: "",
    lastName: "",
    age: "",
    gender: "MALE",
    relationship: "",
    epicNumber: "",
    serialNumber: "",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const currentVoter = await localDb.voters.get(voterId);
        if (currentVoter) {
          setVoter(currentVoter);
          if (currentVoter.familyId) {
            const familyMembers = await localDb.voters
              .where("familyId")
              .equals(currentVoter.familyId)
              .toArray();
            // Exclude original voter from relatives list
            setRelatives(familyMembers.filter(m => m.id !== voterId && m.language === currentVoter.language));
          }
        }
      } catch (error) {
        console.error("Failed to load family data", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [voterId]);

  const handleIdentifyAsHead = async () => {
    if (!voter) return;
    setIsSaving(true);
    try {
      // Generate a random family ID (using negative values for local temporary IDs is common,
      // or just a very large safe random integer)
      const randomFamilyId = Math.floor(Math.random() * 1000000000);
      
      const updates = { familyId: randomFamilyId };
      await localDb.voters.update(voterId, updates);
      
      // Update English counterpart if exists
      const englishVoter = await localDb.voters
        .where("epicNumber")
        .equals(voter.epicNumber)
        .and(v => v.language === "English")
        .first();
      
      if (englishVoter) {
        await localDb.voters.update(englishVoter.id, updates);
      }

      setVoter({ ...voter, ...updates });
      
      // Update sync queue
      await localDb.syncQueue.add({
        action: "UPDATE_VOTER",
        payload: { id: voter.id, ...updates },
        createdAt: Date.now()
      });
      if (englishVoter) {
        await localDb.syncQueue.add({
          action: "UPDATE_VOTER",
          payload: { id: englishVoter.id, ...updates },
          createdAt: Date.now()
        });
      }

    } catch (error) {
        console.error("Failed to identify head", error);
    } finally {
        setIsSaving(false);
    }
  };

  const handleAddMember = async () => {
    if (!voter || !voter.familyId) return;
    setIsSaving(true);

    try {
      const fullName = `${newMember.firstName} ${newMember.lastName}`.trim();
      const baseVoterData = {
        fullName,
        firstName: newMember.firstName,
        lastName: newMember.lastName,
        age: Number(newMember.age) || null,
        gender: newMember.gender,
        epicNumber: newMember.epicNumber || `TEMP-${Date.now()}`,
        serialNumber: newMember.serialNumber ? Number(newMember.serialNumber) : null,
        familyId: voter.familyId,
        pollingStation: voter.pollingStation,
        ward: voter.ward,
        houseNumber: voter.houseNumber,
        cityVillage: voter.cityVillage,
        isVisited: false,
        hasVoted: false,
        isStar: false,
        supportLevel: "UNKNOWN",
        isAlive: true,
      };

      // 1. Create in current language
      const currentLanguageVoter = {
        ...baseVoterData,
        language: voter.language || "Marathi",
        id: Math.floor(Math.random() * -1000000), // Temporary local ID
      };
      
      // @ts-ignore
      await localDb.voters.add(currentLanguageVoter);

      // 2. Create in English (as requested: "update the same in english voter list also")
      if (currentLanguageVoter.language !== "English") {
        const englishVoter = {
            ...baseVoterData,
            language: "English",
            id: Math.floor(Math.random() * -1000000) - 1, // Another temporary ID
        };
        // @ts-ignore
        await localDb.voters.add(englishVoter);
        
        // Queue sync for English
        await localDb.syncQueue.add({
            action: "UPDATE_VOTER", // Using UPDATE_VOTER as a catch-all in the current sync logic
            payload: englishVoter,
            createdAt: Date.now()
          });
      }

      // Queue sync for current language
      await localDb.syncQueue.add({
        action: "UPDATE_VOTER",
        payload: currentLanguageVoter,
        createdAt: Date.now()
      });

      // Update Local State
      // @ts-ignore
      setRelatives(prev => [...prev, currentLanguageVoter]);
      setIsShowAddModal(false);
      setNewMember({
        firstName: "",
        lastName: "",
        age: "",
        gender: "MALE",
        relationship: "",
        epicNumber: "",
        serialNumber: "",
      });

    } catch (error) {
      console.error("Failed to add member", error);
    } finally {
      setIsSaving(false);
    }
  };

  const themeStyles: Record<ThemeColor, string> = {
    blue: "bg-blue-600 text-white",
    green: "bg-emerald-600 text-white",
    orange: "bg-orange-500 text-white",
    purple: "bg-purple-600 text-white",
    red: "bg-red-600 text-white",
  };
  const themeClass = themeStyles[primaryColor] || themeStyles.blue;

  if (isLoading) return <div className="h-screen flex items-center justify-center bg-gray-50"><ClassyLoader size={50} color="#2563eb" /></div>;
  if (!voter) return <div className="p-10 text-center font-bold text-gray-400">Voter not found.</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col pb-24 md:max-w-md md:mx-auto md:border-x border-gray-200">
      <Header />
      
      {/* Sub-Header */}
      <div className={`${themeClass} px-4 py-4 shadow-md flex items-center gap-3 mt-16`}>
        <button onClick={() => router.back()} className="p-2 rounded-full active:bg-white/20">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="font-black text-lg">{t.title}</h1>
      </div>

      <div className="p-3 flex flex-col gap-3">
        {/* Household Context */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">{t.headOfFamily}</p>
          <h2 className="text-xl font-black text-gray-900 leading-tight">{voter.fullName}</h2>
          <div className="mt-2 flex items-center gap-2">
            <span className="bg-gray-100 px-2 py-0.5 rounded-lg text-[10px] font-black text-gray-600 border border-gray-200">
              {voter.epicNumber}
            </span>
            <span className="text-xs font-bold text-gray-400">
              {voter.pollingStation}
            </span>
          </div>
        </div>

        {/* Action Bar */}
        {!voter.familyId ? (
          <div className="bg-orange-50 border-2 border-orange-100 rounded-2xl p-6 text-center space-y-4">
             <div className="text-4xl">🏠</div>
             <p className="text-sm font-bold text-orange-800">{t.noFamily}</p>
             <button 
                onClick={handleIdentifyAsHead}
                disabled={isSaving}
                className="w-full h-12 bg-orange-500 text-white rounded-xl font-black text-sm uppercase tracking-wider shadow-lg active:scale-95 transition-all"
             >
                {isSaving ? "Processing..." : t.identifyHead}
             </button>
          </div>
        ) : (
          <button 
            onClick={() => setIsShowAddModal(true)}
            className={`w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all ${themeClass}`}
          >
            <span className="text-xl">➕</span> {t.addMember}
          </button>
        )}

        {/* Relatives List */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2 mt-4">Family Members ({relatives.length})</h3>
          {relatives.length === 0 ? (
            <div className="bg-white/50 border-2 border-dashed border-gray-200 h-32 rounded-3xl flex items-center justify-center text-gray-400 font-bold italic text-sm">
              No relatives found in this village
            </div>
          ) : (
            relatives.map(member => (
              <div key={member.id} className="relative">
                <VoterCard 
                    voter={member} 
                    t={t as any} 
                    onClick={() => router.push(`/mobile/voters/${member.id}`)}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Member Modal Overlay */}
      {isShowAddModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-md rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-500 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-gray-900">{t.addMember}</h3>
                <button onClick={() => setIsShowAddModal(false)} className="text-gray-400 p-2">✕</button>
              </div>

              <div className="space-y-4">
                 <div>
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block pl-1">{t.firstName}</label>
                   <input 
                    type="text" 
                    value={newMember.firstName}
                    onChange={(e) => setNewMember({...newMember, firstName: e.target.value})}
                    placeholder="E.g. Ramesh"
                    className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:border-blue-500 outline-none"
                   />
                 </div>
                 <div>
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block pl-1">{t.lastName}</label>
                   <input 
                    type="text" 
                    value={newMember.lastName}
                    onChange={(e) => setNewMember({...newMember, lastName: e.target.value})}
                    placeholder="E.g. Patil"
                    className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:border-blue-500 outline-none"
                   />
                 </div>
                 <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block pl-1">{t.age}</label>
                      <input 
                        type="number" 
                        value={newMember.age}
                        onChange={(e) => setNewMember({...newMember, age: e.target.value})}
                        className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:border-blue-500 outline-none"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block pl-1">{t.gender}</label>
                      <select 
                        value={newMember.gender}
                        onChange={(e) => setNewMember({...newMember, gender: e.target.value})}
                        className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-xs font-black focus:border-blue-500 outline-none appearance-none"
                      >
                         <option value="MALE">MALE</option>
                         <option value="FEMALE">FEMALE</option>
                         <option value="OTHER">OTHER</option>
                      </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block pl-1">{t.epic}</label>
                        <input 
                            type="text" 
                            value={newMember.epicNumber}
                            onChange={(e) => setNewMember({...newMember, epicNumber: e.target.value})}
                            placeholder="Optional"
                            className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block pl-1">{t.serial}</label>
                        <input 
                            type="number" 
                            value={newMember.serialNumber}
                            onChange={(e) => setNewMember({...newMember, serialNumber: e.target.value})}
                            placeholder="Optional"
                            className="w-full h-12 bg-gray-50 border border-gray-200 rounded-xl px-4 text-sm font-bold focus:border-blue-500 outline-none"
                        />
                    </div>
                 </div>

                 <button 
                  onClick={handleAddMember}
                  disabled={isSaving || !newMember.firstName || !newMember.lastName}
                  className={`w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all mt-4 flex items-center justify-center gap-2 ${themeClass}`}
                 >
                   {isSaving ? "Saving..." : t.save}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
