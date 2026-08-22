import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MapItem } from '@/pages/MapView';
import { useStore } from '@/store/useStore';
import { useListings } from '@/hooks/useListings';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { calculateCompatibility } from '@/hooks/useMatches';
import { 
  Search, MapPin, Heart, ShieldCheck, Bed, Loader2, 
  SlidersHorizontal, X, ChevronLeft, ChevronRight, Map,
  ShieldAlert
} from 'lucide-react';
import { cities, amenitiesList as allAmenities } from '@/lib/staticData';
import StateEmpty from '@/components/StateEmpty';
import RoomCard from '@/components/RoomCard';

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
    if (profile?.blockedUserIds?.includes(l.ownerId)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return l.title?.toLowerCase().includes(q) || l.locality?.toLowerCase().includes(q) || l.city?.toLowerCase().includes(q);
    }
    return true;
  });

  const contentGrid = (
    <div>
      {/* Search & Filter Row — matching screenshot styling */}
      <div className="flex items-center gap-2.5 mb-4">
        {/* Search input */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by locality, title, or city..."
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
          className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 min-h-[44px] bg-white border rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer ${
            filters.city || (filters.budgetMax && filters.budgetMax < 25000)
              ? 'border-brand-orange text-brand-orange bg-brand-orange/5'
              : 'border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Filters</span>
          {filters.city || (filters.budgetMax && filters.budgetMax < 25000) ? (
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
            <div key={i} className="flex flex-col bg-white rounded-3xl p-3 border border-slate-100">
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
          {filtered.map(room => {
            const isSaved = savedRoomIds.includes(room.id);
            const isSaving = savingRoomId === room.id;
            return (
              <RoomCard
                key={room.id}
                room={room}
                isSaved={isSaved}
                isSaving={isSaving}
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
            onClick={() => navigate('/onboarding/seeker')}
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
          className="bg-cream/20 rounded-3xl max-w-xl mx-auto border border-border/40"
        />
      )}
    </div>
  );

  const filterDrawer = showFilters && (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-border">
        <div className="p-5 border-b border-border flex items-center justify-between bg-cream/30">
          <h3 className="font-bold text-lg text-ink">Room Filters</h3>
          <button onClick={() => setShowFilters(false)} className="p-1 rounded-full text-ink/40 hover:text-ink hover:bg-black/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          <div>
            <label className="font-bold text-xs uppercase tracking-wider text-ink/60 mb-2 block">City</label>
            <select
              value={localFilters.city}
              onChange={(e) => setLocalFilters({ ...localFilters, city: e.target.value, localities: [] })}
              className="w-full p-3 bg-white border border-border rounded-xl font-semibold outline-none focus:border-fire"
            >
              <option value="">All Cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-xs uppercase tracking-wider text-ink/60 mb-2 block">
              Max Budget (₹{localFilters.budgetMax?.toLocaleString() || '25,000'})
            </label>
            <input
              type="range"
              min="3000"
              max="50000"
              step="1000"
              value={localFilters.budgetMax || 25000}
              onChange={(e) => setLocalFilters({ ...localFilters, budgetMax: Number(e.target.value) })}
              className="w-full accent-fire"
            />
            <div className="flex justify-between text-xs text-ink/50 mt-1 font-medium">
              <span>₹3,000</span>
              <span>₹50,000+</span>
            </div>
          </div>

          <div>
            <label className="font-bold text-xs uppercase tracking-wider text-ink/60 mb-2 block">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {allAmenities.slice(0, 8).map((amt: any) => {
                const label = typeof amt === 'string' ? amt : (amt as any).label || (amt as any).name;
                const selected = (localFilters.amenities || []).includes(label);
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleAmenityToggle(label)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                      selected ? 'bg-fire text-white border-fire' : 'bg-cream/40 border-border text-ink/70 hover:bg-cream'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border flex gap-3 bg-cream/20">
          <button onClick={clearFilters} className="flex-1 py-3 border border-border bg-white text-xs font-bold rounded-xl hover:bg-cream/40 transition-colors">
            Clear all
          </button>
          <button onClick={applyFilters} className="flex-[2] py-3 bg-fire text-white text-xs font-bold rounded-xl hover:bg-fire-dark transition-colors shadow-md">
            Apply Filters
          </button>
        </div>
      </div>
    </div>
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
