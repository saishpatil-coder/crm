"use client";

import { useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import { useAuth } from "@/context/AuthContext"; // Assuming you have this to get tenant data

export default function VoterSlipShare({ voter, t }: { voter: any, t: any }) {
  const slipRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth(); // Contains partyName, candidateName, partyLogoUrl
  const [isGenerating, setIsGenerating] = useState(false);

  const handleShare = async () => {
    if (!slipRef.current) return;
    setIsGenerating(true);

    try {
      // 1. Convert the HTML div into a high-quality JPEG data URL
      const dataUrl = await htmlToImage.toJpeg(slipRef.current, {
        quality: 0.95,
        backgroundColor: '#ffffff', // Ensures no transparent background issues
        pixelRatio: 2, // Makes it super crisp for retina screens!
      });

      // 2. Convert Data URL to a Blob, then to a File object
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `${voter.fullName.replace(/\s+/g, "_")}_Slip.jpg`, {
        type: "image/jpeg",
      });

      // 3. Trigger Native Mobile Share (Opens WhatsApp, Telegram, etc.)
      if (navigator.share) {
        await navigator.share({
          title: "Voter Slip",
          text: `Dear ${voter.fullName}, here is your official voter slip for the upcoming election. Please vote for ${user?.tenant?.candidateName}!`,
          files: [file],
        });
      } else {
        // Fallback for desktop browsers: Just download the image
        const link = document.createElement("a");
        link.download = file.name;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error("Failed to generate slip:", err);
      alert("Could not generate the slip.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      {/* The Button */}
      <button
        onClick={handleShare}
        disabled={isGenerating}
        className="w-full mt-3 bg-green-600 text-white font-bold py-3 rounded-xl active:bg-green-700 flex items-center justify-center gap-2 transition-all"
      >
        {isGenerating ? "Generating..." : "WhatsApp Slip"} 
        <span className="text-xl">💬</span>
      </button>

      {/* The "Hidden" Slip UI 
        We use absolute positioning to throw it off the screen so the worker doesn't 
        see it, but it still exists in the DOM so html-to-image can photograph it!
      */}
      <div className="absolute left-[-9999px] top-[-9999px]">
        <div 
          ref={slipRef} 
          className="w-[400px] bg-white border-4 border-orange-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-2xl"
        >
          {/* Header: Party Branding */}
          {user?.tenant?.partyLogoUrl && (
            <img src={user?.tenant?.partyLogoUrl} alt="Logo" className="w-20 h-20 object-contain mb-2" />
          )}
          <h1 className="text-2xl font-black text-orange-600 uppercase tracking-wide">
            {user?.tenant?.partyName || "CAMPAIGN 2026"}
          </h1>
          <h2 className="text-lg font-bold text-gray-800 mt-1">
            Candidate: <span className="text-green-600">{user?.tenant?.candidateName}</span>
          </h2>
          
          <hr className="w-full border-gray-300 my-4 border-dashed" />

          {/* Body: Voter Info */}
          <div className="w-full bg-gray-50 rounded-xl p-4 text-left border border-gray-200">
            <p className="text-sm text-gray-500 font-bold uppercase mb-1">Voter Name</p>
            <p className="text-xl font-black text-gray-900 mb-3">{voter.fullName}</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">EPIC Number</p>
                <p className="text-lg font-bold text-blue-700">{voter.epicNumber}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase">Serial No.</p>
                <p className="text-lg font-bold text-red-600">{voter.serialNumber || "N/A"}</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs text-gray-500 font-bold uppercase">Polling Station</p>
              <p className="text-md font-bold text-gray-800 leading-snug">
                {voter.pollingStation}
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-xs text-gray-400 font-bold mt-5 tracking-widest uppercase">
            Please bring your Voter ID to the polling booth
          </p>
        </div>
      </div>
    </>
  );
}