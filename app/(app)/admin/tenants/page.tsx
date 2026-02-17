'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/app/lib/appClient';

const dict = {
  en: { title: "All Campaigns", search: "Search candidate or constituency...", noResults: "No campaigns found." },
  mr: { title: "सर्व मोहिमा", search: "उमेदवार किंवा मतदारसंघ शोधा...", noResults: "कोणतीही मोहीम सापडली नाही." },
  hi: { title: "सभी अभियान", search: "उम्मीदवार या निर्वाचन क्षेत्र खोजें...", noResults: "कोई अभियान नहीं मिला।" }
};

type Language = 'en' | 'mr' | 'hi';

export default function TenantsListPage() {
  const router = useRouter();
  const [lang] = useState<Language>('mr'); // Hardcoded for now, can be pulled from context
  const [tenants, setTenants] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const t = dict[lang];

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const { data } = await apiClient.get('/admin/tenants');
        setTenants(data);
      } catch (error) {
        console.error("Failed to fetch tenants", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTenants();
  }, []);

  // Client-side search filtering
  const filteredTenants = tenants.filter(t => 
    t.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.constituencyName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
      
      {/* Sticky Header with Search */}
      <div className="bg-white px-4 pt-6 pb-4 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()} className="text-gray-500 font-bold active:bg-gray-100 p-2 rounded-full -ml-2">
            ←
          </button>
          <h1 className="text-xl font-extrabold text-gray-900">{t.title}</h1>
        </div>
        <input 
          type="text" 
          placeholder={t.search}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 px-4 bg-gray-100 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
        />
      </div>

      {/* List Area */}
      <div className="p-4 flex flex-col gap-3">
        {isLoading ? (
          <p className="text-center text-gray-500 mt-10">Loading...</p>
        ) : filteredTenants.length === 0 ? (
          <p className="text-center text-gray-500 mt-10">{t.noResults}</p>
        ) : (
          filteredTenants.map((tenant) => (
            <div 
              key={tenant.id} 
              onClick={() => router.push(`/admin/tenants/${tenant.id}`)}
              className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:bg-blue-50 transition-colors cursor-pointer"
            >
              <div className="flex justify-between items-start mb-2">
                <h2 className="font-bold text-gray-900 text-lg">{tenant.candidateName}</h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  tenant.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {tenant.status? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              <p className="text-sm text-gray-500 font-medium mb-3">{tenant.constituencyName} ({tenant.partyName})</p>
              
              {/* Stats Bar */}
              <div className="flex gap-4 text-xs font-semibold text-gray-500 bg-gray-50 p-2 rounded-lg">
                <span>👥 {tenant._count?.users || 0} Workers</span>
                <span>🗳️ {tenant._count?.voters || 0} Voters</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}