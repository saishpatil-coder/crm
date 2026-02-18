"use client";

import { useEffect, useState } from "react";
import { apiClient } from "../lib/appClient";
import { localDb } from "../lib/db";
import { useNetwork } from "./useNetwork";

export function useSync() {
  const isOnline = useNetwork();
  const [isSyncing, setIsSyncing] = useState(false);

  // ⬇️ JOB 1: PULL (Server -> Phone)
  // Call this when the user logs in or hits a "Refresh" button
  const pullVoters = async () => {
    if (!isOnline) {
      alert("No internet connection to fetch new data.");
      return;
    }

    setIsSyncing(true);
    try {
      // You'll need to build this GET endpoint next!
      const { data } = await apiClient.get("/worker/voters");

      // Clean the incoming data to match our LocalVoter schema
      const votersForDb = data.map((v: any) => ({
        id: v.id,
        name: v.name,
        age: v.age,
        gender: v.gender,
        boothId: v.boothId,
        status: v.status || "UNMAPPED",
        hasVoted: v.hasVoted || false,
        isSynced: true, // Important: These came from server, so they are synced
      }));

      // 'bulkPut' is blazing fast. It updates existing records and adds new ones.
      await localDb.voters.bulkPut(votersForDb);
      console.log(`Synced ${votersForDb.length} voters to local DB`);
    } catch (error) {
      console.error("Pull failed:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // ⬆️ JOB 2: PUSH (Phone -> Server)
  // This runs automatically when we detect internet coming back
  const processSyncQueue = async () => {
    if (!isOnline) return;

    const queueItems = await localDb.syncQueue.toArray();
    if (queueItems.length === 0) return;

    setIsSyncing(true);
    console.log(`Processing ${queueItems.length} offline actions...`);

    for (const item of queueItems) {
      try {
        // Switch logic based on what the user did offline
        switch (item.action) {
          case "UPDATE_VOTER_STATUS":
            await apiClient.patch(`/worker/voters/${item.payload.id}/status`, {
              status: item.payload.status,
            });
            break;

          case "MARK_VOTED":
            await apiClient.patch(`/worker/voters/${item.payload.id}/voted`, {
              hasVoted: item.payload.hasVoted,
            });
            break;
        }

        // If the API call succeeded, remove the item from the queue
        await localDb.syncQueue.delete(item.id!);
      } catch (error) {
        console.error(`Failed to sync item ${item.id}`, error);
        // Tip: You could implement a 'retry count' here if you want to be fancy
      }
    }

    setIsSyncing(false);
  };

  // 🔄 AUTO-SYNC TRIGGER
  // Whenever 'isOnline' becomes true, immediately try to empty the queue
  useEffect(() => {
    if (isOnline) {
      processSyncQueue();
    }
  }, [isOnline]);

  return { pullVoters, isSyncing };
}
