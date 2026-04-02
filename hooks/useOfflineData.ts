"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/appClient";
import { localDb } from "@/lib/db";
import { useNetwork } from "@/hooks/useNetwork";

export function useOfflineData<T>(
  apiEndpoint: string,
  dbTableName: keyof typeof localDb,
  // Upgraded: Pass a Dexie query directly for massive performance gains on 150k rows
  dexieQuery?: () => Promise<T[]>, 
  // Fallback: The old JS filter for smaller tables
  cacheFilter?: (item: T) => boolean 
) {
  const isOnline = useNetwork();
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null); // NEW: Progress tracker
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const formatTimeAgo = useCallback((dateString: string | null) => {
    if (!dateString) return "Never";
    const seconds = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }, []);

  const pushQueueToServer = async () => {
    if (!navigator.onLine) return false;
    try {
      const pendingItems = await localDb.syncQueue.toArray();
      if (pendingItems.length === 0) return true; 

      setSyncMessage("Pushing offline updates...");
      const response = await apiClient.post("/sync/push", { syncItems: pendingItems });
      
      if (response.data.success) {
        const itemIds = pendingItems.map((item) => item.id!);
        await localDb.syncQueue.bulkDelete(itemIds);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Push queue failed:", error);
      return false;
    }
  };

  // Helper to read from cache using either the fast Dexie query or the slow JS filter
  const readFromCache = useCallback(async () => {
    if (dexieQuery) {
      return await dexieQuery();
    }
    // Fallback for smaller tables
    // @ts-ignore
    let cachedData = await localDb[dbTableName].toArray();
    if (cacheFilter) {
      cachedData = cachedData.filter(cacheFilter);
    }
    return cachedData;
  }, [dbTableName, dexieQuery, cacheFilter]);

  useEffect(() => {
    const key = `${dbTableName}_last_synced`;
    setLastSynced(localStorage.getItem(key));
  }, [dbTableName]);

  const loadData = useCallback(
    async (forceNetwork = false) => {
      setIsSyncing(true);
      setSyncMessage(null);
      if (data.length === 0) setIsLoading(true);

      const syncKey = `${dbTableName}_last_synced`;

      try {
        if (navigator.onLine) {
          await pushQueueToServer();
        }

        // 1. STRATEGY: CACHE FIRST
        if (!forceNetwork) {
          const cachedData = await readFromCache();
          if (cachedData.length > 0) {
            setData(cachedData);
            setIsLoading(false);
            setIsSyncing(false);
            return;
          }
        }

        // 2. STRATEGY: CHUNKED NETWORK SYNC
        if (navigator.onLine) {
          let page = 1;
          let hasMore = true;
          const limit = 5000; // Safe chunk size for mobile memory
          let totalDownloaded = 0;

          while (hasMore) {
            setSyncMessage(`Downloading... (${totalDownloaded})`);
            
            // Smart URL param appending
            const separator = apiEndpoint.includes("?") ? "&" : "?";
            const chunkUrl = `${apiEndpoint}${separator}page=${page}&limit=${limit}`;
            
            const response = await apiClient.get(chunkUrl);
            const freshData = response.data;
            const items = freshData.voters || freshData.data || freshData;

            if (!Array.isArray(items) || items.length === 0) {
              hasMore = false;
              break;
            }

            // UPSERT into local DB (Do NOT .clear() or you lose other languages!)
            // @ts-ignore
            await localDb[dbTableName].bulkPut(items);
            
            totalDownloaded += items.length;

            if (items.length < limit) {
              hasMore = false; // We reached the end
            } else {
              page++;
            }
          }

          // Once all chunks are downloaded, re-read from the cache to update the UI
          const finalCachedData = await readFromCache();
          setData(finalCachedData);

          const now = new Date().toISOString();
          localStorage.setItem(syncKey, now);
          setLastSynced(now);
          setSyncMessage(null);
        } else {
          if (forceNetwork) alert("You are offline. Cannot sync right now.");
        }
      } catch (error) {
        console.error(`Failed to fetch ${dbTableName}`, error);
        // Fallback to cache on error
        const cachedData = await readFromCache();
        setData(cachedData);
      } finally {
        setIsLoading(false);
        setIsSyncing(false);
        setSyncMessage(null);
      }
    },
    [apiEndpoint, dbTableName, data.length, readFromCache] 
  );

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  return {
    data,
    isLoading,
    isSyncing,
    syncMessage, // EXPORT THIS to show in your UI
    lastSyncedText: formatTimeAgo(lastSynced),
    refresh: () => loadData(true),
    isOnline,
  };
}