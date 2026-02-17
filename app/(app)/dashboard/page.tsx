'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { apiClient } from '@/app/lib/appClient';

const dict = {
  en: {
    title: "Master Control",
    stats: {
      tenants: "Campaigns",
      users: "Total Users",
      workers: "Workers",
      voters: "Voters Database"
    },
    recentTenants: "Recent Campaigns",
    addTenant: "+ New Campaign (Tenant)",
    loading: "Loading system data...",
  },
  mr: {
    title: "मुख्य नियंत्रण",
    stats: {
      tenants: "मोहिमा (Tenants)",
      users: "एकूण वापरकर्ते",
      workers: "कार्यकर्ते",
      voters: "मतदार डेटाबेस"
    },
    recentTenants: "अलीकडील मोहिमा",
    addTenant: "+ नवीन मोहीम जोडा",
    loading: "सिस्टम डेटा लोड होत आहे...",
  },
  hi: {
    title: "मुख्य नियंत्रण",
    stats: {
      tenants: "अभियान (Tenants)",
      users: "कुल उपयोगकर्ता",
      workers: "कार्यकर्ता",
      voters: "मतदाता डेटाबेस"
    },
    recentTenants: "हाल के अभियान",
    addTenant: "+ नया अभियान जोड़ें",
    loading: "सिस्टम डेटा लोड हो रहा है...",
  }
};

type Language = 'en' | 'mr' | 'hi';

export default function MasterDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [lang, setLang] = useState<Language>('mr');
  const [isDataLoading, setIsDataLoading] = useState(true);
  
  // State matching your backend API structure exactly
  const [stats, setStats] = useState({ totalTenants: 0, totalUsers: 0, totalWorkers: 0, totalVoters: 0 });
  const [recentTenants, setRecentTenants] = useState<any[]>([]);

  useEffect(() => {
    if (user?.role === 'MASTER_ADMIN') {
      const fetchDashboardData = async () => {
        try {
          // Hits your new backend route!
          const { data } = await apiClient.get('/admin/dashboard');
          setStats(data.stats);
          setRecentTenants(data.recentTenants);
        } catch (error) {
          console.error("Failed to fetch dashboard", error);
        } finally {
          setIsDataLoading(false);
        }
      };
      fetchDashboardData();
    }
  }, [user]);

  if (!user) return (
    <div className="p-6 text-center text-gray-500 font-bold">Loading...</div>
  );

  if (user.role !== 'MASTER_ADMIN') {
    return <div className="p-6 text-center text-gray-500 font-bold">Redirecting...</div>;
  }

  const t = dict[lang];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 pt-8 pb-6 rounded-b-3xl shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight">{t.title}</h1>
          <select 
            className="bg-blue-700 border-none text-white py-1 px-2 rounded-md text-sm font-medium focus:ring-2 focus:ring-white"
            value={lang}
            onChange={(e) => setLang(e.target.value as Language)}
          >
            <option value="mr">मराठी</option>
            <option value="hi">हिंदी</option>
            <option value="en">English</option>
          </select>
        </div>

        {/* 2x2 Stats Grid matching your backend response */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-xl p-3 border border-white/20 backdrop-blur-sm">
            <p className="text-blue-100 text-xs font-semibold uppercase">{t.stats.tenants}</p>
            <p className="text-2xl font-black mt-1">{isDataLoading ? '-' : stats.totalTenants}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 border border-white/20 backdrop-blur-sm">
            <p className="text-blue-100 text-xs font-semibold uppercase">{t.stats.voters}</p>
            <p className="text-2xl font-black mt-1">{isDataLoading ? '-' : stats.totalVoters.toLocaleString()}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 border border-white/20 backdrop-blur-sm">
            <p className="text-blue-100 text-xs font-semibold uppercase">{t.stats.users}</p>
            <p className="text-2xl font-black mt-1">{isDataLoading ? '-' : stats.totalUsers}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 border border-white/20 backdrop-blur-sm">
            <p className="text-blue-100 text-xs font-semibold uppercase">{t.stats.workers}</p>
            <p className="text-2xl font-black mt-1">{isDataLoading ? '-' : stats.totalWorkers}</p>
          </div>
        </div>
      </div>

      <div className="px-4 mt-6">
        {/* Add Tenant Button - We will route this to a new mobile page */}
        <button 
          onClick={() => router.push('/admin/add-tenant')}
          className="w-full bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-md active:bg-blue-700 transition-colors mb-8 flex items-center justify-center gap-2 text-lg"
        >
          {t.addTenant}
        </button>

        <h2 className="text-lg font-bold text-gray-800 mb-4">{t.recentTenants}</h2>

        {isDataLoading ? (
          <p className="text-center text-gray-500 text-sm mt-10">{t.loading}</p>
        ) : recentTenants.length === 0 ? (
          <p className="text-center text-gray-500 text-sm mt-10">No campaigns found.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {recentTenants.map((tenant) => (
              <div key={tenant.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-1 active:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <p className="font-bold text-gray-900 text-lg">{tenant.candidateName}</p>
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                    Active
                  </span>
                </div>
                <p className="text-sm text-gray-500 font-medium">{tenant.constituencyName}</p>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}