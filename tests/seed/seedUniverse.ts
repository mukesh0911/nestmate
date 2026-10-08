import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildDeterministicTestUniverse, TestUniverseDataset } from '../data/seedDataUniverse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface SeedResult {
  success: boolean;
  timestamp: string;
  counts: {
    seekers: number;
    owners: number;
    admins: number;
    listings: {
      total: number;
      active: number;
      pending: number;
      draft: number;
      paused: number;
      filled: number;
      closed: number;
      expired: number;
    };
    connections: {
      total: number;
      pending: number;
      accepted: number;
      rejected: number;
      blocked: number;
    };
    chatRooms: number;
    messages: number;
    notifications: number;
    reports: number;
    verifications: number;
  };

  outputPath: string;
}

export async function seedTestUniverse(): Promise<SeedResult> {
  const universe: TestUniverseDataset = buildDeterministicTestUniverse();

  const dataDir = path.resolve(__dirname, '../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const outputPath = path.join(dataDir, 'seed-universe.json');
  fs.writeFileSync(outputPath, JSON.stringify(universe, null, 2), 'utf-8');

  const listingCounts = {
    total: universe.listings.length,
    active: universe.listings.filter(l => l.status === 'active' && !l.title.includes('Expired')).length,
    pending: universe.listings.filter(l => l.status === 'pending_verification').length,
    draft: universe.listings.filter(l => l.status === 'draft').length,
    paused: universe.listings.filter(l => l.status === 'paused').length,
    filled: universe.listings.filter(l => l.status === 'filled').length,
    closed: universe.listings.filter(l => l.status === 'closed').length,
    expired: universe.listings.filter(l => l.title.includes('Expired')).length,
  };

  const connectionCounts = {
    total: universe.connections.length,
    pending: universe.connections.filter(c => c.status === 'pending').length,
    accepted: universe.connections.filter(c => c.status === 'accepted').length,
    rejected: universe.connections.filter(c => c.status === 'rejected').length,
    blocked: universe.connections.filter(c => c.status === 'blocked').length,
  };

  return {
    success: true,
    timestamp: new Date().toISOString(),
    counts: {
      seekers: universe.seekers.length,
      owners: universe.owners.length,
      admins: universe.admins.length,
      listings: listingCounts,
      connections: connectionCounts,
      chatRooms: universe.chatRooms.length,
      messages: universe.messages.length,
      notifications: universe.notifications.length,
      reports: universe.reports.length,
      verifications: universe.verifications.length,
    },

    outputPath,
  };
}
