import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { useListings } from '@/hooks/useListings';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { calculateCompatibility } from '@/hooks/useMatches';
import type { Listing } from '@/hooks/useListings';
import { 
  Search, MapPin, Heart, ShieldCheck, Bed, Loader2, 
  SlidersHorizontal, X, ChevronLeft, ChevronRight, Map,
  Wifi, Wind, Key, GraduationCap, Leaf, Moon, ShieldAlert
} from 'lucide-react';
import { cities, localitiesByCity, amenitiesList as allAmenities } from '@/lib/staticData';

export default function BrowseRooms() {
  const navigate = useNavigate();
  const { filters, updateFilters } = useStore();
  const { listings, getListings, isLoading, hasMore, loadMore, error } = useListings();
  const { user, profile, refreshProfile } = useAuth();
  const { toggleSavedRoom } = useUserProfile();

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [savingRoomId, setSavingRoomId] = useState<string | null>(null);
  const [localFilters, setLocalFilters] = useState(filters);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [imageIndexes, setImageIndexes] = useState<Record<string, number>>({});

  const savedRoomIds: string[] = profile?.savedRoomIds || [];

  const categories = [
    { id: 'All', label: 'All Rooms', icon: <Bed className="w-5 h-5" /> },
    { id: 'Private', label: 'Private Room', icon: <Key className="w-5 h-5" /> },
    { id: 'Verified', label: 'Verified', icon: <ShieldCheck className="w-5 h-5" /> },
    { id: 'Veg', label: 'Veg Kitchen', icon: <Leaf className="w-5 h-5 text-emerald-600" /> },
    { id: 'WiFi', label: 'AC & WiFi', icon: <Wifi className="w-5 h-5" /> },
    { id: 'Night', label: 'Night Owls', icon: <Moon className="w-5 h-5" /> },
    { id: 'Student', label: 'Student Budget', icon: <GraduationCap className="w-5 h-5" /> },
  ];

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

  // Apply filters client-side based on Category selection
  const filtered = listings.filter(l => {
    if (profile?.blockedUserIds?.includes(l.ownerId)) return false;
    
    // Category filter logic
    if (activeCategory === 'Private' && l.flatType !== '1BHK' && l.flatType !== 'Private Room') return false;
    if (activeCategory === 'Verified' && !l.isOwnerVerified && !l.ownerAvatar) return false;
    if (activeCategory === 'Veg' && !l.houseRules?.some(r => r.toLowerCase().includes('veg'))) return false;
    if (activeCategory === 'WiFi' && !l.amenities?.some(a => a === 'WiFi' || a === 'AC')) return false;
    if (activeCategory === 'Student' && (l.partnerShare || l.totalRent || 0) > 12000) return false;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return l.title?.toLowerCase().includes(q) || l.locality?.toLowerCase().includes(q) || l.city?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-white pb-24 font-sans text-ink">
      
      {/* Consolidated Airbnb Sticky Top Container (Sticks below the main layout 60px header) */}
      <div className="sticky top-[60px] z-40 bg-white border-b border-border shadow-sm">
        
        {/* Search Bar Header */}
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="hidden md:block">
            <h1 className="text-xl font-bold tracking-tight text-fire flex items-center gap-1.5 cursor-pointer" onClick={() => navigate('/dashboard')}>
              <MapPin className="w-5 h-5 fill-current" /> NestMate <span className="text-xs text-ink/40 font-medium px-2 py-0.5 bg-cream rounded-full">Rooms</span>
            </h1>
          </div>

          {/* Airbnb Floating Pill Bar */}
          <div className="flex items-center bg-white border border-border rounded-full py-1.5 pl-6 pr-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer w-full md:w-auto max-w-xl flex-1 justify-between animate-fade-in" onClick={() => setShowFilters(true)}>
            <div className="flex items-center divide-x divide-border flex-1">
              <div className="pr-4 text-left">
                <p className="text-[10px] font-bold text-ink uppercase tracking-wider">Where</p>
                <p className="text-xs text-ink/60 font-semibold truncate max-w-[120px]">{filters.city || 'Anywhere'}</p>
              </div>
              <div className="px-4 text-left">
                <p className="text-[10px] font-bold text-ink uppercase tracking-wider">Budget</p>
                <p className="text-xs text-ink/60 font-semibold">₹{filters.budgetMax?.toLocaleString() || 'Any'}</p>
              </div>
              <div className="pl-4 text-left hidden sm:block">
                <p className="text-[10px] font-bold text-ink uppercase tracking-wider">Type</p>
                <p className="text-xs text-ink/60 font-semibold">Any Room</p>
              </div>
            </div>
            <div className="bg-fire text-white p-2.5 rounded-full hover:bg-fire-dark transition-colors flex items-center gap-2">
              <Search className="w-4 h-4" />
              <span className="text-xs font-bold pr-2 hidden md:inline">Search</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setShowFilters(true)} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-border rounded-full hover:bg-cream/20 text-xs font-bold transition-all shadow-sm">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
            </button>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="border-t border-border bg-white py-3 overflow-x-auto scrollbar-none">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-start md:justify-center gap-8 md:gap-12">
            {categories.map(cat => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex flex-col items-center gap-1.5 pb-1 border-b-2 transition-all whitespace-nowrap outline-none ${
                    isActive ? 'border-ink text-ink font-semibold' : 'border-transparent text-ink/50 hover:text-ink hover:border-border'
                  }`}
                >
                  <div className={`p-1 transition-transform ${isActive ? 'scale-110' : 'opacity-80'}`}>
                    {cat.icon}
                  </div>
                  <span className="text-xs">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Results Bar */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm font-semibold text-ink/60">{filtered.length} elegant listings found</p>
          {activeCategory !== 'All' && (
            <button onClick={() => setActiveCategory('All')} className="text-xs text-fire font-bold hover:underline">Clear category filter</button>
          )}
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 text-fire animate-spin" />
            <p className="text-sm text-ink/40 font-medium">Curating verified room listings...</p>
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
          <div className="text-center py-20 bg-cream/20 rounded-3xl max-w-xl mx-auto border border-border/40">
            <Bed className="w-12 h-12 text-ink/30 mx-auto mb-4" />
            <h3 className="text-lg font-bold mb-1">No rooms match your search</h3>
            <p className="text-xs text-ink/50 mb-6">Try refining your filter settings or selected category.</p>
            <button onClick={clearFilters} className="px-5 py-2.5 bg-fire text-white rounded-full text-xs font-bold hover:bg-fire-dark transition-colors shadow-md">
              Clear All Filters
            </button>
          </div>
        )}

      </div>

      {/* Floating Bottom Airbnb Toggle Map Button */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={() => navigate('/map')}
          className="bg-ink hover:bg-ink/90 text-white rounded-full py-3.5 px-6 shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 text-xs font-bold tracking-wide"
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



