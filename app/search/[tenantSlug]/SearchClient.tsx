"use client";

import { useState, useRef } from "react";

interface TenantInfo {
  candidateName: string;
  partyName: string | null;
  partyLogoUrl: string | null;
  candidatePhotoUrl: string | null;
  constituencyName: string;
  slug: string;
}

interface VoterResult {
  id: number;
  fullName: string;
  epicNumber: string;
  serialNumber: number | null;
  pollingStation: string | null;
  ward: string | null;
  age: number | null;
  gender: string | null;
  cityVillage: string | null;
}

type ViewState = "SEARCH" | "RESULTS" | "SLIP";

export default function PublicSearchClient({ tenant }: { tenant: TenantInfo }) {
  const [epic, setEpic] = useState("");
  const [fName, setFName] = useState("");
  const [mName, setMName] = useState("");
  const [lName, setLName] = useState("");

  const [results, setResults] = useState<VoterResult[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<ViewState>("SEARCH");
  const [selectedVoter, setSelectedVoter] = useState<VoterResult | null>(null);

  const handleSearch = async (exact: boolean = false) => {
    const tEpic = epic.trim();
    const tFName = fName.trim();
    const tMName = mName.trim();
    const tLName = lName.trim();

    if (!tEpic && (!tFName || !tLName)) {
      setError("कृपया मतदार ओळखपत्र क्र. किंवा प्रथम आणि आडनाव प्रविष्ट करा. (Please enter EPIC or First & Last name)");
      return;
    }

    if (!tEpic && (tFName.length < 3 || tLName.length < 3)) {
      setError("नावासाठी कमीत कमी ३ अक्षरे आवश्यक आहेत. (Min 3 chars required for name)");
      return;
    }

    setError("");
    setIsSearching(true);

    try {
      const params = new URLSearchParams({ slug: tenant.slug });
      if (tEpic) params.append("epic", tEpic);
      else {
        if (tFName) params.append("fName", tFName);
        if (tMName) params.append("mName", tMName);
        if (tLName) params.append("lName", tLName);
      }
      if (exact) params.append("exact", "true");

      const res = await fetch(`/api/public/search?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Search failed.");
        setResults([]);
        return;
      }

      setResults(data.results || []);
      setHasMore(data.hasMore || false);
      setView("RESULTS");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleReset = () => {
    setEpic("");
    setFName("");
    setMName("");
    setLName("");
    setError("");
    setResults([]);
  };

  const handleSelectVoter = (voter: VoterResult) => {
    setSelectedVoter(voter);
    setView("SLIP");
  };

  const handleBack = () => {
    if (view === "SLIP") {
      setView("RESULTS");
      setSelectedVoter(null);
    } else {
      setView("SEARCH");
      setResults([]);
    }
  };

  const handleShareSlip = () => {
    if (!selectedVoter) return;
    const text = `🗳️ मतदान स्लिप / Voter Slip\n\n👤 ${selectedVoter.fullName}\n🆔 ${selectedVoter.epicNumber}\n📍 ${selectedVoter.pollingStation || "N/A"}\n🔢 Sr. No: ${selectedVoter.serialNumber || "N/A"}\n🏘️ Ward: ${selectedVoter.ward || "N/A"}\n\n✅ ${tenant.candidateName} - ${tenant.constituencyName}`;
    if (navigator.share) {
      navigator.share({ title: "Voter Slip", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert("Slip copied to clipboard!");
    }
  };

  return (
    <div className="min-h-[100dvh] bg-gray-100 flex flex-col font-sans">

      {/* ═══════════════ HEADER ═══════════════ */}
      <header className="bg-gradient-to-r from-orange-500 via-white to-green-600 shadow-md">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          {/* Party Logo */}
          <div className="flex items-center gap-3">
            {tenant.partyLogoUrl ? (
              <img src={tenant.partyLogoUrl} alt="Party Logo" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-lg bg-white" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-2xl border-2 border-orange-200">🏛️</div>
            )}
            <div>
              <h1 className="text-sm font-black text-gray-900 leading-tight truncate max-w-[180px]">
                {tenant.partyName || "Independent"}
              </h1>
              <p className="text-[10px] font-bold text-gray-600 tracking-wide uppercase">{tenant.constituencyName}</p>
            </div>
          </div>

          {/* Candidate Photo */}
          {tenant.candidatePhotoUrl ? (
            <img src={tenant.candidatePhotoUrl} alt={tenant.candidateName} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-lg" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-green-500 flex items-center justify-center text-2xl text-white font-black border-2 border-white shadow-lg">
              {tenant.candidateName.charAt(0)}
            </div>
          )}
        </div>
      </header>
      
      {/* ═══════════════ CONTENT ═══════════════ */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 flex flex-col justify-start md:justify-center">

        {/* ── SEARCH VIEW (Mockup Match) ── */}
        {view === "SEARCH" && (
          <>
            {/* Welcome Card */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider mb-4 shadow-sm border border-orange-200">
                🗳️ Voter Assistance Portal
              </div>
              <h2 className="text-2xl font-black text-gray-900 leading-tight">
                {tenant.candidateName}
              </h2>
              <p className="text-sm text-gray-500 font-semibold mt-1">
                तुमचा मतदान केंद्र शोधा / Find your Polling Station
              </p>
            </div>

            <div className="bg-white rounded border border-gray-200 shadow-md relative mt-2">
              
              {/* Red Header */}
            <div className="bg-[#B01F41] text-white px-8 py-6 rounded-t text-left">
              <h1 className="text-3xl font-bold mb-1 tracking-wide">मतदार शोधा</h1>
              <p className="text-white/90 font-medium text-[15px]">
                मतदार यादीत आपले नाव शोधा आणि मतदान स्लिप शेअर करा
              </p>
            </div>

            {/* Form Area */}
            <div className="p-8">
              
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded text-sm font-bold">
                  {error}
                </div>
              )}

              {/* EPIC Field */}
              <div className="flex flex-col gap-2 mb-8">
                <label className="text-[15px] font-bold text-gray-800">मतदार ओळखपत्र क्र.</label>
                <input
                  type="text"
                  value={epic}
                  onChange={(e) => setEpic(e.target.value)}
                  placeholder="मतदार आयडी प्रविष्ट करा"
                  className="w-full h-12 px-4 border border-gray-300 rounded focus:border-gray-500 outline-none text-gray-700 text-lg transition-colors placeholder-gray-400"
                />
              </div>

              {/* Divider */}
              <div className="relative flex items-center mb-8">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="shrink-0 px-4 text-gray-600 font-bold text-lg">किंवा</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>

              {/* Name Fields */}
              <div className="flex flex-col gap-5 mb-10">
                <div className="flex flex-col gap-2">
                  <label className="text-[15px] font-bold text-gray-800">प्रथम नाव <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={fName}
                    onChange={(e) => setFName(e.target.value)}
                    placeholder="3 अक्षरे टाइप करा."
                    className="w-full h-12 px-4 border border-gray-300 rounded focus:border-gray-500 outline-none text-gray-700 text-lg transition-colors placeholder-gray-400"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[15px] font-bold text-gray-800">मधले नाव</label>
                  <input
                    type="text"
                    value={mName}
                    onChange={(e) => setMName(e.target.value)}
                    placeholder="3 अक्षरे टाइप करा."
                    className="w-full h-12 px-4 border border-gray-300 rounded focus:border-gray-500 outline-none text-gray-700 text-lg transition-colors placeholder-gray-400"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[15px] font-bold text-gray-800">आडनाव <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={lName}
                    onChange={(e) => setLName(e.target.value)}
                    placeholder="3 अक्षरे टाइप करा."
                    className="w-full h-12 px-4 border border-gray-300 rounded focus:border-gray-500 outline-none text-gray-700 text-lg transition-colors placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-col md:flex-row gap-4 h-auto md:h-14">
                
                {/* Regular Search */}
                <button
                  onClick={() => handleSearch(false)}
                  disabled={isSearching}
                  className="flex-1 bg-[#D1869A] hover:bg-[#C07085] text-white font-bold text-lg rounded px-4 py-3 md:py-0 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  मतदार शोधा
                </button>

                {/* Exact Search */}
                <button
                  onClick={() => handleSearch(true)}
                  disabled={isSearching}
                  className="flex-1 bg-[#86D89F] hover:bg-[#70C58A] text-white font-bold text-lg rounded px-4 py-3 md:py-0 transition-colors flex items-center justify-center gap-2 relative"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  अचूक शोध
                  {/* Floating Red Balloon */}
                  <div className="absolute -top-3 right-0 bg-red-600 text-white text-[11px] font-bold px-2 py-1 rounded shadow cursor-default">
                    अधिक अचूकता
                  </div>
                </button>

                {/* Reset Button */}
                <button
                  onClick={handleReset}
                  className="md:w-36 w-full text-gray-700 border border-gray-300 hover:bg-gray-50 font-bold text-lg rounded px-4 py-3 md:py-0 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  रीसेट करा
                </button>

              </div>
            </div>
          </div>
          </>
        )}

        {/* ── RESULTS VIEW ── */}
        {view === "RESULTS" && (
          <div className="max-w-xl mx-auto w-full">
            {/* Back Button + Result Count */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={handleBack} className="flex items-center gap-2 text-gray-600 font-bold text-sm hover:text-gray-900 transition-colors">
                <span className="text-lg">←</span> नवीन शोध / New Search
              </button>
              <span className="text-xs font-black text-gray-400 uppercase">
                {results.length} results
              </span>
            </div>

            {/* Results */}
            {results.length === 0 ? (
              <div className="bg-white rounded shadow-sm border border-dashed border-gray-200 p-8 text-center flex flex-col items-center gap-3">
                <span className="text-5xl opacity-50">🔍</span>
                <p className="text-gray-500 font-bold">कोणतेही परिणाम सापडले नाहीत</p>
                <p className="text-xs text-gray-400 font-semibold">No results found. Please try exact search or reset filters.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {hasMore && (
                  <div className="bg-amber-50 border border-amber-100 text-amber-700 px-4 py-3 rounded text-xs font-bold flex items-start gap-2">
                    <span>⚠️</span>
                    <span>खूप जास्त परिणाम. कृपया संपूर्ण नाव टाका किंवा अचूक शोध वापरा. / Too many results. Please use exact search.</span>
                  </div>
                )}
                {results.map((voter) => (
                  <button
                    key={voter.id}
                    onClick={() => handleSelectVoter(voter)}
                    className="w-full bg-white rounded shadow-sm border border-gray-200 p-4 text-left hover:bg-gray-50 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 bg-[#B01F41]/10 text-[#B01F41] rounded-full flex items-center justify-center font-black text-sm shrink-0">
                        {voter.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 text-[15px] truncate leading-tight">{voter.fullName}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{voter.epicNumber}</span>
                          {voter.age && <span className="text-[10px] font-bold text-gray-400">• {voter.age} yrs</span>}
                        </div>
                      </div>
                    </div>
                    <span className="text-gray-300 group-hover:text-gray-500 font-bold text-xl transition-colors">›</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── DIGITAL SLIP VIEW ── */}
        {view === "SLIP" && selectedVoter && (
          <div className="max-w-md w-full mx-auto">
            <button onClick={handleBack} className="flex items-center gap-2 text-gray-600 font-bold text-sm hover:text-gray-900 transition-colors mb-4">
              <span className="text-lg">←</span> परत / Back
            </button>

            {/* The Digital Voting Slip */}
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden mb-6">
              {/* Slip Header */}
              <div className="bg-[#B01F41] p-1" />
              <div className="px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-[#B01F41] uppercase tracking-widest">Digital Voter Slip</h3>
                  <h2 className="text-xs font-bold text-gray-500 mt-0.5">मतदान स्लिप</h2>
                </div>
                {tenant.partyLogoUrl && (
                  <img src={tenant.partyLogoUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                )}
              </div>

              {/* Voter Details */}
              <div className="px-6 py-5 flex flex-col gap-4">
                <div className="text-center pb-4 border-b border-dashed border-gray-200">
                  <h2 className="text-xl font-black text-gray-900 leading-tight">{selectedVoter.fullName}</h2>
                  <p className="text-sm font-bold text-gray-500 mt-1">{selectedVoter.epicNumber}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <SlipField emoji="🔢" label="Sr. No / क्रमांक" value={selectedVoter.serialNumber?.toString() || "N/A"} highlight />
                  <SlipField emoji="🏘️" label="Ward / वॉर्ड" value={selectedVoter.ward || "N/A"} />
                  <SlipField emoji="👤" label="Age / वय" value={selectedVoter.age ? `${selectedVoter.age} yrs` : "N/A"} />
                  <SlipField emoji="⚧" label="Gender / लिंग" value={selectedVoter.gender || "N/A"} />
                </div>

                <div className="bg-green-50 border border-green-200 rounded p-4 flex flex-col gap-1 mt-2">
                  <span className="text-[10px] font-black text-green-700 uppercase tracking-widest">📍 Polling Station / मतदान केंद्र</span>
                  <p className="text-[15px] font-black text-green-900 leading-snug">{selectedVoter.pollingStation || "N/A"}</p>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex flex-col items-center">
                <p className="text-[10px] font-bold text-gray-500">
                  {tenant.candidateName} • {tenant.constituencyName}
                </p>
              </div>
            </div>

            <button
              onClick={handleShareSlip}
              className="w-full h-12 bg-green-600 text-white font-bold rounded shadow-sm hover:bg-green-700 transition-all flex items-center justify-center gap-2"
            >
              📤 शेअर करा (Share WhatsApp)
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function SlipField({ emoji, label, value, highlight }: { emoji: string; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`p-3 rounded border ${highlight ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-200"}`}>
      <span className="text-[10px] font-bold text-gray-500 block mb-1">
        {emoji} {label}
      </span>
      <p className={`text-sm font-black leading-none ${highlight ? "text-[#B01F41]" : "text-gray-900"}`}>
        {value}
      </p>
    </div>
  );
}
