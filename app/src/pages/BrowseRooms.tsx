import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { MapItem } from '@/pages/MapView';
import { useStore } from '@/store/useStore';
import { useListings } from '@/hooks/useListings';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { calculateCompatibility } from '@/hooks/useMatches';
import type { Listing } from '@/hooks/useListings';
import { 
  Search, MapPin, Heart, ShieldCheck, Bed, Loader2, 
  SlidersHorizontal, X, ChevronLeft, ChevronRight, Map,
  Wind, ShieldAlert
} from 'lucide-react';
import { cities, localitiesByCity, amenitiesList as allAmenities } from '@/lib/staticData';
import StateEmpty from '@/components/StateEmpty';

export default function BrowseRooms() {
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

  // Image Navigation
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

  // Apply filters client-side
  const filtered = listings.filter(l => {
    if (profile?.blockedUserIds?.includes(l.ownerId)) return false;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return l.title?.toLowerCase().includes(q) || l.locality?.toLowerCase().includes(q) || l.city?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-white pb-above-nav md:pb-24 font-sans text-ink overflow-x-hidden">
      
      {/* Sticky Top Filter Header */}
      <div className="sticky top-[60px] z-40 bg-white border-b border-border/80 shadow-sm py-3">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center">
          {/* Centered Floating Filter Pill */}
          <button
            type="button"
            onClick={() => setShowFilters(true)}
            aria-label="Open filters"
            className="flex items-center bg-white border border-border/80 rounded-full py-1.5 pl-4 sm:pl-6 pr-2 shadow-sm hover:shadow-md transition-all cursor-pointer w-full max-w-xl justify-between hover:border-fire/40 border-ink/15 text-left"
          >
            <div className="flex items-center divide-x divide-border flex-1 min-w-0">
              <div className="pr-4 sm:pr-6 text-left">
                <p className="text-[10px] font-bold text-ink uppercase tracking-wider">Where</p>
                <p className="text-xs text-ink/70 font-semibold truncate max-w-[100px] sm:max-w-[150px]">{filters.city || 'Anywhere'}</p>
              </div>
              <div className="px-4 sm:px-6 text-left">
                <p className="text-[10px] font-bold text-ink uppercase tracking-wider">Budget</p>
                <p className="text-xs text-ink/70 font-semibold truncate">₹{filters.budgetMax?.toLocaleString() || 'Any'}</p>
              </div>
              <div className="pl-4 sm:pl-6 text-left hidden sm:block">
                <p className="text-[10px] font-bold text-ink uppercase tracking-wider">Type</p>
                <p className="text-xs text-ink/70 font-semibold">Any Room</p>
              </div>
            </div>
            <div className="bg-fire text-white px-3.5 py-2.5 rounded-full hover:bg-fire-dark transition-colors flex items-center justify-center flex-shrink-0 ml-2 shadow-sm">
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-xs font-bold pl-2 hidden sm:inline">Filters</span>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Results Bar */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm font-semibold text-ink/60">{filtered.length} elegant listings found</p>
        </div>

        {/* Skeleton Grid Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col">
                <div className="aspect-square w-full rounded-2xl skeleton-shimmer mb-3" />
                <div className="px-1 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-2/3 skeleton-shimmer rounded-md" />
                    <div className="h-4 w-1/4 skeleton-shimmer rounded-md" />
                  </div>
                  <div className="h-3 w-1/2 skeleton-shimmer rounded-md" />
                  <div className="h-4 w-1/3 skeleton-shimmer rounded-md mt-2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-2xl mb-6 text-center text-sm font-medium flex items-center justify-center gap-2 border border-red-100 max-w-md mx-auto">
            <ShieldAlert className="w-4 h-4" /> {error}
          </div>
        )}

        {/* Airbnb Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map(room => {
              const isSaved = savedRoomIds.includes(room.id);
              const isSaving = savingRoomId === room.id;
              const images = room.images?.length > 0 ? room.images : ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600'];
              const currentImgIdx = imageIndexes[room.id] || 0;
              const isHovered = hoveredCardId === room.id;

              // Calculate compatibility % if profile exists
              const compatibility = profile
                ? calculateCompatibility(profile.quizAnswers || {}, (room as any).ownerQuizAnswers || {})
                : null;

              return (
                <div 
                  key={room.id} 
                  className="group relative flex flex-col cursor-pointer transition-all duration-300"
                  onMouseEnter={() => setHoveredCardId(room.id)}
                  onMouseLeave={() => setHoveredCardId(null)}
                  onClick={() => navigate(`/room/${room.id}`)}
                >
                  
                  {/* Photo Carousel Container */}
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-cream border border-border shadow-sm mb-3">
                    <img 
                      src={images[currentImgIdx]} 
                      alt={room.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" 
                    />
                    
                    {/* Dark gradient overlay at bottom */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />

                    {/* Chevron Arrows (Airbnb style - show on hover) */}
                    {images.length > 1 && isHovered && (
                      <>
                        <button 
                          onClick={(e) => prevImage(e, room.id, images.length - 1)}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/95 text-ink hover:scale-105 shadow-md transition-all z-10"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => nextImage(e, room.id, images.length - 1)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/95 text-ink hover:scale-105 shadow-md transition-all z-10"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {/* Carousel Dots */}
                    {images.length > 1 && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                        {images.map((_, idx) => (
                          <span 
                            key={idx} 
                            className={`w-1.5 h-1.5 rounded-full transition-all ${
                              idx === currentImgIdx ? 'bg-white scale-125' : 'bg-white/55'
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Save Heart Button */}
                    <button
                      onClick={e => handleToggleSave(e, room.id)}
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white text-ink/70 hover:text-red-500 shadow-md backdrop-blur-sm transition-all z-10"
                      title={isSaved ? 'Unsave' : 'Save'}
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin text-fire" />
                      ) : (
                        <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                      )}
                    </button>

                    {/* Flat Type Label */}
                    <span className="absolute top-3 left-3 bg-white/90 text-ink text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm backdrop-blur-sm uppercase tracking-wide">
                      {room.flatType}
                    </span>
                  </div>

                  {/* Text Details Stack */}
                  <div className="flex flex-col flex-1 px-1">
                    
                    {/* Locality & Compatibility Row */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-bold text-sm text-ink/90 truncate">{room.locality}, {room.city}</p>
                      {compatibility !== null && (
                        <div className="flex items-center gap-0.5 shrink-0 bg-teal/5 text-teal text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                          <span>★</span>
                          <span>{compatibility}% match</span>
                        </div>
                      )}
                    </div>

                    {/* Furnishing & Distance */}
                    <p className="text-xs text-ink/50 mb-1 font-medium capitalize">
                      {room.furnishing || 'Semi-Furnished'} • {room.partnersNeeded || 1} roommate needed
                    </p>

                    {/* Date Available */}
                    <p className="text-xs text-ink/40 mb-2 font-medium">
                      Available: {room.availableFrom || 'Immediately'}
                    </p>

                    {/* Price (Airbnb Signature pricing label) */}
                    <div className="mt-auto pt-1 flex items-baseline gap-1 border-t border-border/30">
                      <span className="font-extrabold text-sm text-ink">₹{(room.partnerShare || room.totalRent || 0).toLocaleString()}</span>
                      <span className="text-xs text-ink/50 font-normal">/ month</span>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More Trigger */}
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

        {/* Empty State */}
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

      {/* Floating Map Button — above mobile bottom nav */}
      <div className="fixed bottom-above-nav md:bottom-6 left-1/2 -translate-x-1/2 z-40 px-4">
        <button
          type="button"
          onClick={() => {
            // Build normalized MapRoom[] from current filtered results
            const mapItems: MapItem[] = filtered
              .filter(l => typeof l.lat === 'number' && typeof l.lng === 'number' && !isNaN(l.lat) && !isNaN(l.lng) && l.lat !== 0 && l.lng !== 0)
              .map(l => ({
                type: 'room' as const,
                id: l.id,
                title: l.title || `${l.locality}, ${l.city}`,
                locality: l.locality,
                city: l.city,
                rent: l.partnerShare || l.totalRent,
                image: l.images?.[0] || '',
                ownerId: l.ownerId,
                ownerName: l.ownerName || 'Owner',
                lat: l.lat,
                lng: l.lng,
              }));
            navigate('/map', {
              state: {
                mode: 'rooms',
                items: mapItems,
                sourceLabel: filters.city ? `Rooms in ${filters.city}` : 'Browse Rooms',
              },
            });
          }}
          aria-label="Show map"
          className="bg-ink hover:bg-ink/90 text-white rounded-full py-3.5 px-6 min-h-[48px] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 text-xs font-bold tracking-wide"
        >
          <span>Show Map</span>
          <Map className="w-4 h-4 text-fire fill-current" />
        </button>
      </div>

      {/* Elegant Slide-In Filter Drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm flex justify-end transition-opacity duration-300">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-fade-left">
            
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-extrabold text-base tracking-tight">Filters</h2>
              <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-cream rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* City Selection */}
              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2">City</label>
                <select 
                  value={localFilters.city || ''} 
                  onChange={e => setLocalFilters({ ...localFilters, city: e.target.value })} 
                  className="w-full bg-white border border-border rounded-xl px-4 py-3 text-sm focus:border-fire outline-none"
                >
                  <option value="">All Cities</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Locality Search */}
              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-2">Locality / Area Keyword</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search locality (e.g. Viman Nagar)..."
                    className="w-full bg-white border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:border-fire outline-none"
                  />
                </div>
              </div>

              {/* Price Budget Range Slider */}
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <label className="block text-xs font-bold text-ink uppercase tracking-wider">Monthly Budget (Max)</label>
                  <span className="text-sm font-extrabold text-fire">₹{(localFilters.budgetMax || 25000).toLocaleString()}</span>
                </div>
                <input 
                  type="range" 
                  min="3000" 
                  max="50000" 
                  step="1000" 
                  value={localFilters.budgetMax || 25000} 
                  onChange={e => setLocalFilters({ ...localFilters, budgetMax: parseInt(e.target.value) })} 
                  className="w-full accent-fire cursor-pointer" 
                />
                <div className="flex justify-between text-[10px] text-ink/40 mt-1 font-bold">
                  <span>₹3,000</span>
                  <span>₹50,000+</span>
                </div>
              </div>

              {/* Amenities Grid Selector */}
              <div>
                <label className="block text-xs font-bold text-ink uppercase tracking-wider mb-3">Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {allAmenities.map((amenity: any) => {
                    const label = typeof amenity === 'string' ? amenity : amenity.label;
                    const isActive = (localFilters.amenities || []).includes(label);
                    return (
                      <button 
                        key={label} 
                        onClick={() => handleAmenityToggle(label)} 
                        className={`px-3.5 py-2 rounded-full border text-xs font-medium transition-all ${
                          isActive 
                            ? 'border-fire bg-fire/5 text-fire font-bold' 
                            : 'border-border bg-white text-ink/70 hover:border-ink/30'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Bottom Actions Drawer */}
            <div className="p-4 border-t border-border flex gap-3 bg-cream/20">
              <button 
                onClick={clearFilters} 
                className="flex-1 py-3 border border-border bg-white text-xs font-bold rounded-xl hover:bg-cream/40 transition-colors"
              >
                Clear all
              </button>
              <button 
                onClick={applyFilters} 
                className="flex-[2] py-3 bg-fire text-white text-xs font-bold rounded-xl hover:bg-fire-dark transition-colors shadow-md"
              >
                Apply Filters
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}



