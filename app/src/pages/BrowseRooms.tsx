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
      {/* Search & Filter Row — always single line */}
      <div className="flex items-center gap-2 mb-5">
        {/* Search input */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/35 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by locality, title, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search rooms"
            className="w-full pl-9 pr-8 py-2.5 min-h-[44px] bg-white rounded-xl text-[13px] border border-gray-200 shadow-xs outline-none focus:border-fire focus:ring-2 focus:ring-fire/10 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-ink/35 hover:text-ink/70 cursor-pointer"
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
          className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] bg-white border rounded-xl text-[12px] font-bold transition-all shadow-xs cursor-pointer ${
            filters.city || (filters.budgetMax && filters.budgetMax < 25000)
              ? 'border-fire text-fire bg-fire/5'
              : 'border-gray-200 text-ink/70 hover:text-ink hover:bg-gray-50'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Filters</span>
          {filters.city || (filters.budgetMax && filters.budgetMax < 25000) ? (
            <span className="w-1.5 h-1.5 rounded-full bg-fire" />
          ) : null}
        </button>

        {/* Count badge */}
        <span className="flex-shrink-0 text-[11px] font-bold text-ink/45 whitespace-nowrap">
          {filtered.length} found
        </span>
      </div>

      {/* Skeleton Loading */}
      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col">
              <div className="aspect-[4/3] w-full rounded-2xl skeleton-shimmer mb-2.5" />
              <div className="px-0.5 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="h-3.5 w-2/3 skeleton-shimmer rounded-md" />
                  <div className="h-3.5 w-1/4 skeleton-shimmer rounded-md" />
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

      {/* Room Grid — 2 cols mobile, 3 col tablet, 4 col desktop */}
      {!isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {filtered.map(room => {
            const isSaved = savedRoomIds.includes(room.id);
            const isSaving = savingRoomId === room.id;
            const images = room.images?.length > 0 ? room.images : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop'];
            const currentImgIdx = imageIndexes[room.id] || 0;
            const isHovered = hoveredCardId === room.id;

            const compatibility = profile
              ? calculateCompatibility(
                  profile.quizAnswers || {},
                  room.ownerQuizAnswers || {},
                  profile.city,
                  room.city
                )
              : null;

            return (
              <div
                key={room.id}
                className="group relative flex flex-col cursor-pointer"
                onMouseEnter={() => setHoveredCardId(room.id)}
                onMouseLeave={() => setHoveredCardId(null)}
                onClick={() => navigate(`/room/${room.id}`)}
              >
                {/* Photo area — 4:3 ratio is compact & natural on mobile */}
                <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-gray-100 shadow-xs mb-2.5">
                  <img
                    src={images[currentImgIdx]}
                    alt={room.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />

                  {/* Gradient scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent pointer-events-none" />

                  {/* Image nav — desktop hover only */}
                  {images.length > 1 && isHovered && (
                    <>
                      <button
                        onClick={e => prevImage(e, room.id, images.length - 1)}
                        aria-label="Previous photo"
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/95 text-ink shadow-md transition-all z-10 hover:scale-105 cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={e => nextImage(e, room.id, images.length - 1)}
                        aria-label="Next photo"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/95 text-ink shadow-md transition-all z-10 hover:scale-105 cursor-pointer"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}

                  {/* Dots */}
                  {images.length > 1 && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                      {images.map((_, idx) => (
                        <span
                          key={idx}
                          className={`rounded-full transition-all ${
                            idx === currentImgIdx
                              ? 'w-3 h-1.5 bg-white'
                              : 'w-1.5 h-1.5 bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Save button */}
                  <button
                    onClick={e => handleToggleSave(e, room.id)}
                    aria-label={isSaved ? 'Remove from saved' : 'Save room'}
                    className="absolute top-2.5 right-2.5 w-8 h-8 flex items-center justify-center rounded-full bg-white/85 hover:bg-white backdrop-blur-sm shadow-sm transition-all z-10 cursor-pointer"
                  >
                    {isSaving
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin text-fire" />
                      : <Heart className={`w-3.5 h-3.5 transition-all ${isSaved ? 'fill-red-500 text-red-500 scale-110' : 'text-ink/60'}`} />
                    }
                  </button>

                  {/* Type badge */}
                  <span className="absolute top-2.5 left-2.5 bg-white/90 text-ink text-[9px] font-extrabold px-1.5 py-0.5 rounded-md shadow-sm backdrop-blur-sm uppercase tracking-wider">
                    {room.flatType}
                  </span>

                  {/* Verified badge — bottom left on image */}
                  {room.isOwnerVerified && (
                    <span className="absolute bottom-2 right-2 flex items-center gap-1 bg-emerald-600 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-wider z-10">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      <span className="hidden sm:inline">Verified</span>
                    </span>
                  )}
                </div>

                {/* Card info — compact on mobile */}
                <div className="flex flex-col flex-1 space-y-0.5">
                  {/* Location + match */}
                  <div className="flex items-start justify-between gap-1">
                    <p className="font-bold text-[12px] sm:text-[13px] text-ink leading-tight truncate">
                      {room.locality}, {room.city}
                    </p>
                    {compatibility !== null && compatibility > 0 && (
                      <span className="flex-shrink-0 text-[9px] sm:text-[10px] font-extrabold text-teal bg-teal-light px-1.5 py-0.5 rounded-md whitespace-nowrap">
                        {compatibility}% ✦
                      </span>
                    )}
                  </div>

                  {/* Meta row */}
                  <p className="text-[11px] text-ink/45 font-medium truncate">
                    {room.furnishing || 'Semi-Furnished'} · {room.partnersNeeded || 1} needed
                  </p>

                  {/* Price row */}
                  <div className="flex items-baseline gap-0.5 pt-1.5 border-t border-gray-100 mt-1">
                    <span className="font-extrabold text-[13px] sm:text-[14px] text-ink">
                      ₹{(room.partnerShare || room.totalRent || 0).toLocaleString()}
                    </span>
                    <span className="text-[11px] text-ink/40 font-normal">/mo</span>
                  </div>
                </div>
              </div>
            );
          })}
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
