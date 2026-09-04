/**
 * NestMate main tRPC API router definitions
 * Handles procedure scaffolding for users, listings, matches, chats, and verifications
 */

export interface TRPCRouterConfig {
  version: string;
  endpoints: string[];
}

export const trpcRouterConfig: TRPCRouterConfig = {
  version: '11.0.0',
  endpoints: [
    'user.getProfile',
    'user.updateProfile',
    'listing.searchListings',
    'listing.createListing',
    'match.calculateScore',
    'chat.getRoomMessages',
    'chat.sendMessage',
    'verification.verifyAadhaar',
  ],
};

import { calculateCompatibility } from '@/lib/matching';

// Procedure definitions scaffold
export const appRouter = {
  user: {
    getProfile: (uid: string) => ({ path: 'user.getProfile', uid }),
    updateProfile: (data: Record<string, any>) => ({ path: 'user.updateProfile', data }),
  },
  listing: {
    search: (filters: Record<string, any>) => ({ path: 'listing.searchListings', filters }),
    create: (listing: Record<string, any>) => ({ path: 'listing.createListing', listing }),
  },
  match: {
    computeScore: (user1Quiz: Record<string, string>, user2Quiz: Record<string, string>) => {
      return calculateCompatibility(user1Quiz, user2Quiz);
    },
  },
  verification: {
    submitDoc: (docData: { userId: string; docType: string }) => ({
      status: 'pending',
      method: 'Admin Document Review',
      submittedAt: new Date().toISOString(),
    }),
  },
};

export type AppRouter = typeof appRouter;
