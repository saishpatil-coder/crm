import Dexie, { Table } from "dexie";

// 1. Define the TypeScript interfaces for our local tables
export interface LocalVoter {
  id: number; // Matches Prisma's numeric ID
  epicNumber: string;
  fullName: string;
  gender: string | null;
  age: number | null;
  mobileNumber: string | null;
  ward: string | null;
  pollingStation: string | null;
  isVisited: boolean;
  hasVoted: boolean;
  supportLevel: string;
}

export interface Worker {
  id: string;
  tenantId: number;
  roleId: number;
  name: string;
  mobileNumber: string;
  passwordHash: string;
  status: Boolean;
  _count: {
    boothAssignments: number;
  };
}

export interface SyncQueueItem {
  id?: number;
  action: "UPDATE_VOTER_STATUS" | "MARK_VOTED";
  payload: any;
  createdAt: number;
}
export interface LocalTenant {
  id: number;
  candidateName: string;
  partyName: string | null;
  constituencyName: string;
  constituencyNumber: string | null;
  status: string | boolean;
  partyLogoUrl?: string | null;
  candidatePhotoUrl?: string | null;
  _count: {
    users: number;
    voters: number;
    booths: number;
  };
}
// 2. Initialize the Dexie Database
export class CampaignDatabase extends Dexie {
  voters!: Table<LocalVoter>;
  syncQueue!: Table<SyncQueueItem>;
  tenants!: Table<LocalTenant>; // <--- Add this
  workers!: Table<Worker>;
  constructor() {
    super("CampaignDB");

    // Define the schema (indexes for fast searching)
    // The '&' means unique. Indexes allow us to filter by boothId or status offline!
    this.version(2).stores({
      // & epicNumber ensures it is a unique index offline too
      voters: "id, &epicNumber, fullName, pollingStation, ward, isVisited, hasVoted, supportLevel",
      syncQueue: "++id, action, createdAt",
      tenants: "&id, candidateName, constituencyName",
      workers: "id, tenantId, roleId, name, mobileNumber, status",
    });
  }
}

export const localDb = new CampaignDatabase();
