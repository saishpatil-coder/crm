import Dexie, { Table } from "dexie";

// 1. Define the TypeScript interfaces for our local tables
export interface LocalVoter {
  id: string; // We use string (UUID) so the frontend can generate IDs offline
  name: string;
  age: number;
  gender: string;
  boothId: number;
  status: "FAVORABLE" | "NEUTRAL" | "OPPOSED" | "UNMAPPED";
  hasVoted: boolean;
  isSynced: boolean; // Tells us if this exists on the real backend
}

export interface SyncQueueItem {
  id?: number;
  action: "UPDATE_VOTER_STATUS" | "MARK_VOTED";
  payload: any;
  createdAt: number;
}

// 2. Initialize the Dexie Database
export class CampaignDatabase extends Dexie {
  voters!: Table<LocalVoter>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super("CampaignDB");

    // Define the schema (indexes for fast searching)
    // The '&' means unique. Indexes allow us to filter by boothId or status offline!
    this.version(1).stores({
      voters: "&id, name, boothId, status, hasVoted, isSynced",
      syncQueue: "++id, action, createdAt", // ++ means auto-increment
    });
  }
}

export const localDb = new CampaignDatabase();
