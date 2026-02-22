// hooks/useOfflineData.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/appClient";
import { localDb } from "@/lib/db";
import { useNetwork } from "@/hooks/useNetwork";

export function useOfflineData<T>(
  apiEndpoint: string,
  dbTableName: keyof typeof localDb,
) {
  const isOnline = useNetwork();
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  // Helper to format time difference
  const formatTimeAgo = useCallback((dateString: string | null) => {
    if (!dateString) return "Never";
    const seconds = Math.floor(
      (new Date().getTime() - new Date(dateString).getTime()) / 1000,
    );
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }, []);

  // Initialize lastSynced from localStorage
  useEffect(() => {
    const key = `${dbTableName}_last_synced`;
    setLastSynced(localStorage.getItem(key));
  }, [dbTableName]);

  const loadData = useCallback(
    async (forceNetwork = false) => {
      setIsSyncing(true);
      if (data.length === 0) setIsLoading(true);

      const syncKey = `${dbTableName}_last_synced`;

      try {
        // 1. STRATEGY: CACHE FIRST
        if (!forceNetwork) {
          // @ts-ignore - Dexie dynamic table typing workaround
          const cachedData = await localDb[dbTableName].toArray();
          if (cachedData.length > 0) {
            setData(cachedData);
            setIsLoading(false);
            setIsSyncing(false);
            return;
          }
        }

        // 2. STRATEGY: NETWORK ON DEMAND
        if (navigator.onLine) {
          const response = await apiClient.get(apiEndpoint);
          const freshData = response.data;

          // Overwrite local DB
          // @ts-ignore
          await localDb[dbTableName].bulkPut(freshData);

          setData(freshData);

          // Update sync time
          const now = new Date().toISOString();
          localStorage.setItem(syncKey, now);
          setLastSynced(now);
        } else {
          if (forceNetwork) alert("You are offline. Cannot sync right now.");
        }
      } catch (error) {
        console.error(`Failed to fetch ${dbTableName}`, error);
        // Fallback to cache on error
        // @ts-ignore
        const cachedData = await localDb[dbTableName].toArray();
        setData(cachedData);
      } finally {
        setIsLoading(false);
        setIsSyncing(false);
      }
    },
    [apiEndpoint, dbTableName, data.length],
  );

  // Run once on mount
  useEffect(() => {
    loadData(false);
  }, [loadData]);

  return {
    data,
    isLoading,
    isSyncing,
    lastSyncedText: formatTimeAgo(lastSynced),
    refresh: () => loadData(true),
    isOnline,
  };
}
