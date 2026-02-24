"use client";

import { LocalVoter } from "@/lib/db";

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
  // Format gender for compact display
  const displayGender =
    voter.gender === "MALE" ? "M" : voter.gender === "FEMALE" ? "F" : "O";

  // Format age
  const displayAge = voter.age ? `${voter.age} Yrs` : "--";

  // Default text for share button
  const shareText = t.shareBtn || "SHARE SLIP";

  return (
    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 active:bg-blue-50 transition-colors cursor-pointer relative overflow-hidden flex gap-3 items-center">
      {/* Color-coded Status Indicator Bar */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${
          voter.isVisited ? "bg-green-500" : "bg-orange-400"
        }`}
      ></div>

      {/* Image Square Placeholder - 48x48 */}
      <div className="w-12 h-12 bg-gray-100 border border-gray-200 rounded-lg flex-shrink-0 overflow-hidden ml-1 flex items-center justify-center">
        {voter.photoUrl ? (
          <img
            src={voter.photoUrl}
            alt={voter.fullName}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xl opacity-20 text-gray-400">👤</span>
        )}
      </div>

      {/* Voter Details Column */}
      <div
        className="flex-1 flex flex-col justify-center min-w-0"
        onClick={onClick}
      >
        <div className="flex justify-between items-center gap-2">
          {/* Name & Serial Container - Given more vertical breathing room */}
          <div className="flex flex-col min-w-0 py-0.5">
            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1">
              SR. NO: {voter.serialNumber || "--"}
            </p>

            {/* NAME: Increased size, better line-height, allows 2 lines */}
            <h2 className="font-black text-gray-900 text-[15px] leading-tight line-clamp-2 pr-1 min-h-6">
              {voter.fullName}
            </h2>

            <p className="text-[10px] font-bold text-gray-500 mt-1.5 leading-none">
              {displayGender} • {displayAge}
            </p>
          </div>

          {/* WhatsApp Share Button */}
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent clicking the parent card
              console.log("Share slip clicked for:", voter.epicNumber);
            }}
            className="flex items-center justify-center w-10 h-10 bg-green-50 text-green-600 rounded-full active:bg-green-100 transition-colors shrink-0"
            aria-label={shareText}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.463 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
