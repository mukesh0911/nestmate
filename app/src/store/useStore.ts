import { create } from 'zustand';

// ─── UI-only global state (no mock data, no persist) ──────────────────────────
// All real data (user profile, listings, matches, messages) comes from Firebase hooks.

export type UserRole = 'seeker' | 'owner' | null;

interface AppState {
  // UI state
  currentRole: UserRole;
  activeChat: string | null;
  selectedCity: string;
  filters: {
    city: string;
    budgetMin: number;
    budgetMax: number;
    localities: string[];
    gender: string;
    verifiedOnly: boolean;
    flatType: string[];
    furnishing: string[];
    amenities: string[];
  };

  // Auth Modal State
  authModalOpen: boolean;
  authModalTitle?: string;
  authModalSubtitle?: string;
  authModalRedirect?: string;

  // Actions
  setCurrentRole: (role: UserRole) => void;
  setActiveChat: (chatId: string | null) => void;
  setSelectedCity: (city: string) => void;
  updateFilters: (filters: Partial<AppState['filters']>) => void;
  resetFilters: () => void;
  resetAll: () => void;
  openAuthModal: (options?: { title?: string; subtitle?: string; redirect?: string }) => void;
  closeAuthModal: () => void;
}

const initialFilters = {
  city: '',
  budgetMin: 1000,
  budgetMax: 25000,
  localities: [],
  gender: 'any',
  verifiedOnly: false,
  flatType: [],
  furnishing: [],
  amenities: [],
};

export const useStore = create<AppState>()((set, get) => ({
  currentRole: null,
  activeChat: null,
  selectedCity: '',
  filters: initialFilters,
  authModalOpen: false,

  setCurrentRole: (role) => set({ currentRole: role }),
  setActiveChat: (chatId) => set({ activeChat: chatId }),
  setSelectedCity: (city) => set({ selectedCity: city }),

  updateFilters: (filters) =>
    set({ filters: { ...get().filters, ...filters } }),

  resetFilters: () => set({ filters: initialFilters }),
  resetAll: () => set({ currentRole: null, activeChat: null, selectedCity: '', filters: initialFilters, authModalOpen: false }),

  openAuthModal: (options) =>
    set({
      authModalOpen: true,
      authModalTitle: options?.title,
      authModalSubtitle: options?.subtitle,
      authModalRedirect: options?.redirect,
    }),

  closeAuthModal: () =>
    set({
      authModalOpen: false,
      authModalTitle: undefined,
      authModalSubtitle: undefined,
      authModalRedirect: undefined,
    }),
}));

