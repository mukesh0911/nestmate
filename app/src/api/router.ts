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
      let score = 0;
      const keys = Object.keys(user1Quiz);
      if (keys.length === 0) return 85; // default fallback
      keys.forEach((k) => {
        if (user1Quiz[k] === user2Quiz[k]) score += 10;
      });
      return Math.min(99, Math.max(50, score));
    },
  },
  verification: {
    submitDoc: (docData: { userId: string; aadhaarNumber: string }) => ({
      status: 'VERIFIED',
      method: 'DigiLocker e-KYC',
      verifiedAt: new Date().toISOString(),
    }),
  },
};

export type AppRouter = typeof appRouter;
