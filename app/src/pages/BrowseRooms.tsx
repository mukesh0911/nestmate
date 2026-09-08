import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MapItem } from '@/pages/MapView';
import { useStore } from '@/store/useStore';
import { useListings } from '@/hooks/useListings';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { calculateCompatibility, calculateRoomCompatibility } from '@/hooks/useMatches';
import {
  Search, MapPin, Heart, ShieldCheck, Bed, Loader2,
  SlidersHorizontal, X, ChevronLeft, ChevronRight, Map,
  ShieldAlert
} from 'lucide-react';
import { amenitiesList as allAmenities } from '@/lib/staticData';
import StateEmpty from '@/components/StateEmpty';
import RoomCard from '@/components/RoomCard';
import { isPubliclyVisibleListing } from '@/lib/marketplaceVisibility';
import AdvancedFiltersModal, { DEFAULT_ADVANCED_FILTERS } from '@/components/AdvancedFiltersModal';
import type { AdvancedFilterState } from '@/components/AdvancedFiltersModal';

export default function BrowseRooms({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const { filters, updateFilters } = useStore();
  const { listings, getListings, isLoading, hasMore, loadMore, error } = useListings();
  const { user, profile, refreshProfile } = useAuth();
  const { toggleSavedRoom } = useUserProfile();

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [savingRoomId, setSavingRoomId] = useState<string | null>(null);
  const [localFilters, setLocalFilters] = useState(filters);
  const [advFilters, setAdvFilters] = useState<AdvancedFilterState>(DEFAULT_ADVANCED_FILTERS);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [imageIndexes, setImageIndexes] = useState<Record<string, number>>({});

  const savedRoomIds: string[] = profile?.savedRoomIds || [];

  useEffect(() => {
    getListings(filters);
  }, [filters, getListings]);

  const applyFilters = () => {
    updateFilters(localFilters);
    setShowFilters(false);
  };

  const clearFilters = () => {
    const reset = { city: '', budgetMin: 1000, budgetMax: 25000, localities: [], gender: 'any', verifiedOnly: false, amenities: [] };
    updateFilters(reset);
    setLocalFilters(reset as any);
    setAdvFilters(DEFAULT_ADVANCED_FILTERS);
    setSearchQuery('');
    setShowFilters(false);
  };

  const handleAmenityToggle = (amenity: string) => {
    setLocalFilters(prev => ({
      ...prev,
      amenities: (prev.amenities || []).includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...(prev.amenities || []), amenity],
    }));
  };

  const handleToggleSave = async (e: React.MouseEvent, roomId: string) => {
    e.stopPropagation();
    if (!user?.uid) {
      useStore.getState().openAuthModal({
        title: 'Sign in to Save Rooms',
        subtitle: 'Save your favorite rooms and access them anytime across devices.',
        redirect: `/room/${roomId}`,
      });
      return;
    }
    if (savingRoomId) return;
    setSavingRoomId(roomId);
    const isSaved = savedRoomIds.includes(roomId);
    try {
      await toggleSavedRoom(user.uid, roomId, isSaved);
      await refreshProfile();
    } catch (err) {
      console.error('Failed to save room:', err);
    } finally {
      setSavingRoomId(null);
    }
  };

  const prevImage = (e: React.MouseEvent, roomId: string, maxIdx: number) => {
    e.stopPropagation();
    setImageIndexes(prev => {
      const curr = prev[roomId] || 0;
      return { ...prev, [roomId]: curr === 0 ? maxIdx : curr - 1 };
    });
  };

  const nextImage = (e: React.MouseEvent, roomId: string, maxIdx: number) => {
    e.stopPropagation();
    setImageIndexes(prev => {
      const curr = prev[roomId] || 0;
      return { ...prev, [roomId]: curr === maxIdx ? 0 : curr + 1 };
    });
  };

  const filtered = listings.filter(l => {
    // Sprint 2E hardening: shared visibility rule — paused/stale listings and
    // any other non-discoverable state never render on the Explore surface.
    if (!isPubliclyVisibleListing(l)) return false;
    if (profile?.blockedUserIds?.includes(l.ownerId)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = l.title?.toLowerCase().includes(q) || l.locality?.toLowerCase().includes(q) || l.city?.toLowerCase().includes(q);
      if (!match) return false;
    }

    // Advanced Filters (DISC-02)
    if (advFilters.highMatchOnly && profile) {
      const score = calculateRoomCompatibility(profile, l);
      if (score < 70) return false;
    }
    if (advFilters.dietary !== 'any') {
      const d = (l as any).rules?.dietary;
      if (d && d !== 'any' && d !== advFilters.dietary) return false;
    }
    if (advFilters.smoking !== 'any') {
      const s = (l as any).rules?.smoking;
      if (s && s !== 'any' && s !== advFilters.smoking) return false;
    }
    if (advFilters.alcohol !== 'any') {
      const a = (l as any).rules?.alcohol;
      if (a && a !== 'any' && a !== advFilters.alcohol) return false;
    }
    if (advFilters.petPolicy !== 'any') {
      const p = (l as any).rules?.petPolicy;
      if (p && p !== 'any' && p !== advFilters.petPolicy) return false;
    }
    if (advFilters.furnishing !== 'any') {
      if (l.furnishing && l.furnishing !== advFilters.furnishing) return false;
    }
    if (advFilters.bachelorsFriendly) {
      if ((l as any).rules?.bachelorsAllowed === false) return false;
    }
    if (advFilters.amenities.length > 0) {
      const listingAmenities = l.amenities || [];
      const hasAll = advFilters.amenities.every(a => listingAmenities.includes(a));
      if (!hasAll) return false;
    }

    return true;
  });

  const hasActiveFilters =
    Boolean(filters.city && filters.city !== 'Bengaluru') ||
    Boolean(filters.budgetMax && filters.budgetMax < 25000) ||
    advFilters.dietary !== 'any' ||
    advFilters.smoking !== 'any' ||
    advFilters.alcohol !== 'any' ||
    advFilters.furnishing !== 'any' ||
    advFilters.petPolicy !== 'any' ||
    advFilters.bachelorsFriendly ||
    advFilters.highMatchOnly ||
    advFilters.amenities.length > 0;

  // Prioritize rooms by compatibility score when seeker is logged in
  const sortedListings = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (profile) {
        const scoreA = calculateRoomCompatibility(profile, a);
        const scoreB = calculateRoomCompatibility(profile, b);
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
      }
      const aTime = a.createdAt?.toMillis?.() || 0;
      const bTime = b.createdAt?.toMillis?.() || 0;
      return bTime - aTime;
    });
  }, [filtered, profile]);

  const contentGrid = (
    <div>
      {/* Search & Filter Row — matching screenshot styling */}
      <div className="flex items-center gap-2.5 mb-4">
        {/* Search input */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Bangalore localities (e.g. Koramangala, HSR, Indiranagar)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search rooms"
            className="w-full pl-10 pr-8 py-3 min-h-[44px] bg-white rounded-xl text-xs sm:text-sm border border-slate-200 shadow-xs outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 transition-all text-slate-800 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter button */}
        <button
          type="button"
          onClick={() => setShowFilters(true)}
          aria-label="Open filters"
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 min-h-[44px] bg-white border rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer ${hasActiveFilters
              ? 'border-brand-orange text-brand-orange bg-brand-orange/5'
              : 'border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50'
            }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filters</span>
          {hasActiveFilters ? (
            <span className="w-1.5 h-1.5 rounded-full bg-brand-orange" />
          ) : null}
        </button>
      </div>

      {/* Count badge */}
      <div className="text-xs text-slate-500 font-semibold mb-4 block px-0.5">
        {filtered.length} found
      </div>

      {/* Skeleton Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col bg-white rounded-2xl p-3 border border-border">
              <div className="aspect-[4/3] w-full rounded-2xl skeleton-shimmer mb-2.5" />
              <div className="px-1 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="h-4 w-2/3 skeleton-shimmer rounded-md" />
                  <div className="h-4 w-1/4 skeleton-shimmer rounded-md" />
                </div>
                <div className="h-3 w-1/2 skeleton-shimmer rounded-md" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-2xl mb-6 text-center text-sm font-medium flex items-center justify-center gap-2 border border-red-100 max-w-md mx-auto">
          <ShieldAlert className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Room Grid — 1 col mobile, 2 col tablet, 4 col desktop */}
      {!isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {sortedListings.map(room => {
            const isSaved = savedRoomIds.includes(room.id);
            const isSaving = savingRoomId === room.id;
            const compatibilityScore = profile ? calculateRoomCompatibility(profile, room) : undefined;
            return (
              <RoomCard
                key={room.id}
                room={room}
                isSaved={isSaved}
                isSaving={isSaving}
                compatibilityScore={compatibilityScore}
                onToggleSave={handleToggleSave}
                onClick={() => navigate(`/room/${room.id}`)}
              />
            );
          })}
        </div>
      )}

      {/* Can't find what you're looking for? Callout Banner */}
      {!isLoading && filtered.length > 0 && (
        <div className="bg-[#fff3f0] border border-[#ffe0d8] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs mt-8 mb-6">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 bg-[#ffebd9] rounded-xl flex items-center justify-center text-brand-orange shrink-0">
              <MapPin className="w-5 h-5 text-brand-orange" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                Can't find what you're looking for?
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-snug">
                Post your requirements and let the right matches find you.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (!user) {
                useStore.getState().openAuthModal({
                  title: 'Post Your Requirement',
                  subtitle: 'Create a seeker profile with your budget and location preferences so matching flatmates can find you.',
                  redirect: '/onboarding/seeker',
                });
              } else {
                navigate(profile?.onboardingComplete ? '/edit-profile' : '/onboarding/seeker');
              }
            }}
            className="bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm shadow-orange-500/20 shrink-0 cursor-pointer self-stretch sm:self-auto justify-center"
          >
            <span>Post Requirement</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {!isLoading && hasMore && filtered.length > 0 && (
        <div className="mt-16 text-center">
          <button
            onClick={() => loadMore(filters)}
            className="px-8 py-3.5 bg-ink text-white rounded-full text-xs font-bold hover:bg-ink/90 transition-all shadow-md active:scale-95"
          >
            Load more listings
          </button>
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <StateEmpty
          icon={Bed}
          title="No rooms match your search"
          description="Try refining your filter settings."
          action={
            <button onClick={clearFilters} className="btn-fire text-sm px-5">
              Clear All Filters
            </button>
          }
          className="bg-cream/20 rounded-2xl max-w-xl mx-auto border border-border/40"
        />
      )}
    </div>
  );

  const filterDrawer = (
    <AdvancedFiltersModal
      isOpen={showFilters}
      onClose={() => setShowFilters(false)}
      filters={advFilters}
      onApply={(updated) => {
        setAdvFilters(updated);
        setShowFilters(false);
      }}
      totalResultsCount={filtered.length}
    />
  );

  if (embedded) {
    return (
      <div>
        {contentGrid}
        {filterDrawer}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment pb-24 font-sans text-ink overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {contentGrid}
      </div>
      {filterDrawer}
    </div>
  );
}
