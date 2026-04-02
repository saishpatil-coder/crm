"use client";

import { LocalVoter } from "@/lib/db";
import { useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import { useAuth } from "@/context/AuthContext"; // Adjust import path if needed

interface VoterCardProps {
  voter: LocalVoter;
  t: {
    visited: string;
    pending: string;
    unknown: string;
    shareBtn?: string;
  };
  onClick: () => void;
}

export default function VoterCard({ voter, t, onClick }: VoterCardProps) {
  const { user } = useAuth(); // Grab tenant branding
  const slipRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Format gender and age for compact display
  const displayGender = voter.gender === "MALE" ? "M" : voter.gender === "FEMALE" ? "F" : "O";
  const displayAge = voter.age ? `${voter.age} Yrs` : "--";
  const shareText = t.shareBtn || "SHARE SLIP";

  // --- NEW: Image Generation & WhatsApp Share Logic ---
  const handleShareWhatsApp = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent clicking the card
    if (!slipRef.current || isGenerating) return;
    
    setIsGenerating(true);

    try {
      // 1. Take a high-res "screenshot" of the hidden slip
      const dataUrl = await htmlToImage.toJpeg(slipRef.current, {
        quality: 0.95,
        backgroundColor: '#ffffff', 
        pixelRatio: 2, // Retina quality
      });

      // 2. Convert to a File object
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `${voter.fullName.replace(/\s+/g, "_")}_Slip.jpg`, {
        type: "image/jpeg",
      });

      const message = `*Voter Slip / मतदार पावती*\nDear ${voter.fullName}, here are your booth details for the upcoming election. Please vote for ${user?.tenant?.candidateName || "us"}!`;

      // 3. Try to use the Native Mobile Share API (Directly opens WhatsApp with image attached)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "Voter Slip",
          text: message,
          files: [file],
        });
      } else {
        // Fallback for Desktop: Just download the image
        const link = document.createElement("a");
        link.download = file.name;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error("Failed to generate slip:", err);
      alert("Could not generate the slip right now.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <div
        onClick={onClick}
        className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 active:bg-blue-50 transition-colors cursor-pointer relative overflow-hidden flex gap-3 items-center"
      >
        {/* Color-coded Status Indicator Bar */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-1.5 ${
            voter.isVisited ? "bg-green-500" : "bg-orange-400"
          }`}
        ></div>

        {/* Image Square Placeholder - 48x48 */}
        <div className="w-12 h-12 bg-gray-100 border border-gray-200 rounded-lg flex-shrink-0 overflow-hidden ml-1.5 flex items-center justify-center">
          {voter.photoUrl ? (
            <img src={voter.photoUrl} alt={voter.fullName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl opacity-20 text-gray-400">👤</span>
          )}
        </div>

        {/* Voter Details Column */}
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <div className="flex justify-between items-center gap-2">
            {/* Name & Serial Container */}
            <div className="flex flex-col min-w-0 py-0.5">
              <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">
                SR. NO: {voter.serialNumber || "--"}
              </p>
              <h2 className="font-black text-gray-900 text-[15px] leading-tight line-clamp-2 pr-1 min-h-6">
                {voter.fullName}
              </h2>
              <p className="text-[10px] font-bold text-gray-500 mt-1.5 leading-none">
                {displayGender} • {displayAge} • <span className="uppercase">{voter.epicNumber}</span>
              </p>
            </div>

            {/* WhatsApp Share Button */}
            <button
              onClick={handleShareWhatsApp}
              disabled={isGenerating}
              className={`flex items-center justify-center w-11 h-11 rounded-full transition-all shrink-0 border shadow-sm ${
                isGenerating 
                  ? "bg-gray-100 border-gray-200 text-gray-400" 
                  : "bg-green-50 border-green-100 text-green-600 active:bg-green-100 active:scale-95"
              }`}
              aria-label={shareText}
            >
              {isGenerating ? (
                // Loading Spinner
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                // WhatsApp Icon
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.463 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* --- THE HIDDEN CANVAS --- 
          This is physically placed off-screen but stays in the DOM so it can be photographed.
      */}
      <div className="absolute left-[-9999px] top-[-9999px]">
        <div 
          ref={slipRef} 
          className="w-[400px] bg-white border-t-[12px] border-orange-500 rounded-xl p-6 flex flex-col shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center gap-4 mb-4">
            {user?.tenant?.partyLogoUrl && (
              <img src={user.tenant?.partyLogoUrl} alt="Logo" className="w-16 h-16 object-contain rounded-full border shadow-sm" />
            )}
            <div className="flex flex-col">
              <h1 className="text-2xl font-black text-gray-900 leading-none">
                {user?.tenant?.partyName || "ELECTION 2026"}
              </h1>
              <p className="text-md font-bold text-orange-600 mt-1">
                Candidate: {user?.tenant?.candidateName}
              </p>
            </div>
          </div>
          
          <hr className="w-full border-gray-200 border-dashed mb-4" />

          {/* Voter Info */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Voter Name</p>
            <p className="text-xl font-black text-gray-900 mb-4">{voter.fullName}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">EPIC No.</p>
                <p className="text-lg font-bold text-blue-700">{voter.epicNumber}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Serial No.</p>
                <p className="text-lg font-bold text-red-600">{voter.serialNumber || "N/A"}</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Polling Station</p>
              <p className="text-sm font-bold text-gray-800 leading-snug mt-1">
                {voter.pollingStation || "Check with local office"}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-5 text-center bg-orange-50 py-2 rounded-lg border border-orange-100">
            <p className="text-[10px] text-orange-800 font-bold uppercase tracking-widest">
              Please carry your Voter ID / EPIC Card
            </p>
          </div>
        </div>
      </div>
    </>
  );
}