import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '@/hooks/useAuth';
import { useListings } from '@/hooks/useListings';
import { useMatches, calculateCompatibility } from '@/hooks/useMatches';
import { useGeocoding } from '@/hooks/useGeocoding';
import { useIsMobile } from '@/hooks/use-mobile';
import type { UserProfile } from '@/hooks/useAuth';
import type { Listing } from '@/hooks/useListings';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import {
  Search, Crosshair, Loader2, MapPin, Users, Home,
  ChevronUp, ChevronDown, X, List as ListIcon, Map as MapIcon
} from 'lucide-react';

// Fix leaflet icons
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
L.Icon.Default.mergeOptions({ iconUrl, shadowUrl });

interface MapPerson {
  type: 'person';
  uid: string;
  name: string;
  avatar: string;
  profession: string;
  role: 'seeker' | 'owner' | null;
  compatibility: number;
  lat: number;
  lng: number;
  city: string;
}

interface MapRoom {
  type: 'room';
  id: string;
  title: string;
  locality: string;
  city: string;
  rent: number;
  image: string;
  ownerId: string;
  ownerName: string;
  lat: number;
  lng: number;
}

type MapItem = MapPerson | MapRoom;

// Helper to calculate distance in km
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Map panner component
function MapPanner({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => { map.flyTo(center, zoom, { duration: 1 }); }, [center, zoom, map]);
  return null;
}

// Viewport tracker
function ViewportTracker({ onBoundsChange }: { onBoundsChange: (b: L.LatLngBounds) => void }) {
  const map = useMapEvents({
    moveend: () => onBoundsChange(map.getBounds()),
    zoomend: () => onBoundsChange(map.getBounds()),
  });
  useEffect(() => { onBoundsChange(map.getBounds()); }, []);
  return null;
}

export default function MapView() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { getListings } = useListings();
  const { geocode } = useGeocoding();
  const isMobile = useIsMobile();

  const [mode, setMode] = useState<'people' | 'rooms'>('people');
  const [items, setItems] = useState<MapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchCenter, setSearchCenter] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([19.076, 72.8777]);
  const [mapZoom, setMapZoom] = useState(12);
  const [mapStyle, setMapStyle] = useState<'roadmap' | 'satellite' | 'terrain'>('roadmap');
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [mobileListView, setMobileListView] = useState(false);
  const [sortBy, setSortBy] = useState<'match' | 'distance' | 'newest'>('match');
  const boundsRef = useRef<L.LatLngBounds | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Center map on user location on mount
  useEffect(() => {
    if (profile?.geoLocation) {
      setMapCenter([profile.geoLocation.lat, profile.geoLocation.lng]);
    } else if (profile?.city) {
      geocode(profile.city, profile.localities?.[0]).then(loc => {
        if (loc) setMapCenter([loc.lat, loc.lng]);
      });
    }
  }, [profile]);

  // Fetch people data
  const fetchPeople = useCallback(async () => {
    if (!user?.uid || !profile) return;
    setLoading(true);
    try {
      const oppositeRole = profile.role === 'seeker' ? 'owner' : 'seeker';
      const q = query(collection(db, 'users'), where('onboardingComplete', '==', true), where('role', '==', oppositeRole));
      const snap = await getDocs(q);
      const people: MapPerson[] = [];
      snap.docs.forEach(d => {
        const data = d.data() as UserProfile;
        if (d.id === user.uid) return;
        const lat = data.geoLocation?.lat || (data as any).lat;
        const lng = data.geoLocation?.lng || (data as any).lng;
        if (!lat || !lng) return;
        const compat = calculateCompatibility(profile.quizAnswers || {}, data.quizAnswers || {});
        people.push({
          type: 'person', uid: d.id, name: data.name || 'User', avatar: data.avatar || '',
          profession: data.profession || '', role: data.role, compatibility: compat,
          lat, lng, city: data.city || '',
        });
      });
      setItems(people);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [user?.uid, profile]);

  // Fetch rooms data
  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const results = await getListings();
      const rooms: MapRoom[] = results.filter(l => l.lat && l.lng).map(l => ({
        type: 'room', id: l.id, title: l.title, locality: l.locality, city: l.city,
        rent: l.partnerShare || l.totalRent, image: l.images?.[0] || '',
        ownerId: l.ownerId, ownerName: l.ownerName || 'Owner',
        lat: l.lat, lng: l.lng,
      }));
      setItems(rooms);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [getListings]);

  useEffect(() => {
    if (mode === 'people') {
      fetchPeople();
      return;
    }
    fetchRooms();
  }, [mode, fetchPeople, fetchRooms]);

  // Filter items within viewport
  const visibleItems = useMemo(() => {
    if (!boundsRef.current) return items;
    const b = boundsRef.current;
    return items.filter(i => i.lat >= b.getSouth() && i.lat <= b.getNorth() && i.lng >= b.getWest() && i.lng <= b.getEast());
  }, [items, boundsRef.current]);

  // Sort sidebar items
  const sortedItems = useMemo(() => {
    const arr = [...visibleItems];
    const refPt = searchCenter || (profile?.geoLocation ? [profile.geoLocation.lat, profile.geoLocation.lng] as [number, number] : null);
    if (sortBy === 'distance' && refPt) {
      arr.sort((a, b) => haversine(refPt[0], refPt[1], a.lat, a.lng) - haversine(refPt[0], refPt[1], b.lat, b.lng));
    } else if (sortBy === 'match') {
      arr.sort((a, b) => {
        const ca = a.type === 'person' ? a.compatibility : 0;
        const cb = b.type === 'person' ? b.compatibility : 0;
        return cb - ca;
      });
    }
    return arr;
  }, [visibleItems, sortBy, searchCenter, profile]);

  const handleBoundsChange = useCallback((b: L.LatLngBounds) => { boundsRef.current = b; }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const loc = await geocode(searchQuery.trim());
      if (loc) {
        setSearchCenter([loc.lat, loc.lng]);
        setMapCenter([loc.lat, loc.lng]);
        setMapZoom(14);
      } else { toast.error('Location not found'); }
    } catch { toast.error('Search failed'); }
    finally { setSearching(false); }
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    navigator.geolocation.getCurrentPosition(
      pos => { setMapCenter([pos.coords.latitude, pos.coords.longitude]); setMapZoom(14); setSearchCenter([pos.coords.latitude, pos.coords.longitude]); },
      () => toast.error('Location access denied')
    );
  };

  const panToItem = (item: MapItem) => {
    setMapCenter([item.lat, item.lng]);
    setMapZoom(16);
    if (isMobile) setMobileListView(false);
  };

  const getDistance = (item: MapItem): string | null => {
    const refPt = searchCenter || (profile?.geoLocation ? [profile.geoLocation.lat, profile.geoLocation.lng] as [number, number] : null);
    if (!refPt) return null;
    const d = haversine(refPt[0], refPt[1], item.lat, item.lng);
    return d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`;
  };

  const getPinColor = (item: MapItem): string => {
    if (item.type === 'person' && item.compatibility >= 80) return '#0D9488';
    if (item.type === 'person') return '#1E3A5F';
    return '#E5501A';
  };

  // Sidebar card component
  const SidebarCard = ({ item }: { item: MapItem }) => {
    const dist = getDistance(item);
    return (
      <button onClick={() => panToItem(item)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-cream/50 transition-all text-left border border-transparent hover:border-border">
        <div className="w-10 h-10 rounded-full bg-cream overflow-hidden border border-border flex items-center justify-center shrink-0">
          {item.type === 'person' && item.avatar ? <img src={item.avatar} alt="" className="w-full h-full object-cover" /> :
           item.type === 'room' && item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> :
           <MapPin className="w-4 h-4 text-ink/30" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{item.type === 'person' ? item.name : item.title}</p>
          <p className="text-xs text-ink/50 truncate">
            {item.type === 'person' ? item.profession : `₹${item.rent?.toLocaleString()}/mo · ${item.locality}`}
          </p>
        </div>
        <div className="text-right shrink-0">
          {item.type === 'person' && <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.compatibility >= 80 ? 'bg-teal/10 text-teal' : item.compatibility >= 50 ? 'bg-amber-50 text-amber-600' : 'bg-ink/5 text-ink/40'}`}>{item.compatibility}%</span>}
          {item.type === 'room' && <span className="text-xs font-bold text-fire">₹{item.rent?.toLocaleString()}</span>}
          {dist && <p className="text-[10px] text-ink/40 mt-0.5">{dist} away</p>}
        </div>
      </button>
    );
  };

  // MOBILE: full-screen list view
  if (isMobile && mobileListView) {
    return (
      <div className="min-h-screen bg-parchment pt-[60px]">
        <div className="sticky top-[60px] z-20 bg-white border-b border-border p-3 flex items-center justify-between">
          <h2 className="font-semibold text-sm">{mode === 'people' ? 'People Near You' : 'Rooms Near You'} · {sortedItems.length}</h2>
          <button onClick={() => setMobileListView(false)} className="flex items-center gap-1 text-xs font-bold text-fire"><MapIcon className="w-4 h-4" /> Map</button>
        </div>
        <div className="p-3 space-y-1">
          {loading ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 skeleton-shimmer rounded-xl" />) :
           sortedItems.length === 0 ? <p className="text-center text-sm text-ink/50 py-12">No {mode} in this area</p> :
           sortedItems.map(item => <SidebarCard key={item.type === 'person' ? item.uid : item.id} item={item} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-60px)] w-full flex relative">
      {/* Desktop Sidebar */}
      {!isMobile && sidebarOpen && (
        <div className="w-[320px] bg-white border-r border-border flex flex-col shrink-0 z-10">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display italic text-lg">{mode === 'people' ? 'People Near You' : 'Rooms Near You'}</h2>
              <span className="text-xs font-bold text-ink/40">{sortedItems.length} found</span>
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} className="w-full bg-cream/50 border border-border rounded-lg px-3 py-1.5 text-xs outline-none focus:border-fire">
              <option value="match">Best Match</option>
              <option value="distance">Distance</option>
              <option value="newest">Newest</option>
            </select>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {loading ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-16 skeleton-shimmer rounded-xl" />) :
             sortedItems.length === 0 ? (
              <div className="text-center py-16">
                <MapPin className="w-10 h-10 text-ink/15 mx-auto mb-3" />
                <p className="text-sm font-semibold text-ink/50">No {mode} in this area</p>
                <p className="text-xs text-ink/30 mt-1">Try expanding your search radius</p>
              </div>
            ) : sortedItems.map(item => <SidebarCard key={item.type === 'person' ? item.uid : item.id} item={item} />)}
          </div>
        </div>
      )}

      {/* Map Area */}
      <div className="flex-1 relative z-0">
        {/* Top Controls */}
        <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center gap-2 pointer-events-none">
          {/* Toggle */}
          <div className="bg-white rounded-full shadow-lg p-1 flex pointer-events-auto border border-border">
            <button onClick={() => setMode('people')} className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${mode === 'people' ? 'bg-fire text-white shadow-sm' : 'text-ink/60 hover:text-ink'}`}><Users className="w-3.5 h-3.5" /> People</button>
            <button onClick={() => setMode('rooms')} className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${mode === 'rooms' ? 'bg-fire text-white shadow-sm' : 'text-ink/60 hover:text-ink'}`}><Home className="w-3.5 h-3.5" /> Rooms</button>
          </div>

          {/* Search */}
          {isMobile && !searchExpanded ? (
            <button onClick={() => setSearchExpanded(true)} className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center pointer-events-auto border border-border"><Search className="w-4 h-4 text-ink/60" /></button>
          ) : (
            <div className="flex-1 flex bg-white rounded-full shadow-lg overflow-hidden pointer-events-auto border border-border">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  placeholder="Search area, landmark..." className="w-full pl-9 pr-2 py-2.5 text-sm outline-none bg-transparent" />
              </div>
              {searching ? <div className="px-3 flex items-center"><Loader2 className="w-4 h-4 animate-spin text-fire" /></div> :
               searchQuery && <button onClick={() => { setSearchQuery(''); setSearchCenter(null); }} className="px-2 text-ink/40 hover:text-ink"><X className="w-4 h-4" /></button>}
              {isMobile && <button onClick={() => { setSearchExpanded(false); setSearchQuery(''); }} className="px-3 text-xs font-bold text-fire">Close</button>}
            </div>
          )}

          {/* Map Layer Switcher (Google Roadmap vs Google Satellite) */}
          <div className="bg-white rounded-full shadow-lg p-1 flex pointer-events-auto border border-border">
            <button
              onClick={() => setMapStyle(mapStyle === 'satellite' ? 'roadmap' : 'satellite')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                mapStyle === 'satellite' ? 'bg-navy text-white shadow-sm' : 'text-ink/70 hover:text-ink'
              }`}
              title="Toggle Google Maps Satellite View"
            >
              {mapStyle === 'satellite' ? '🗺️ Google Map' : '🛰️ Satellite'}
            </button>
          </div>

          {/* Locate Me */}
          <button onClick={handleLocateMe} className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center pointer-events-auto border border-border hover:border-fire transition-colors" title="My location">
            <Crosshair className="w-4 h-4 text-ink/60" />
          </button>

          {/* Desktop sidebar toggle */}
          {!isMobile && (
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center pointer-events-auto border border-border hover:border-fire transition-colors">
              <ListIcon className="w-4 h-4 text-ink/60" />
            </button>
          )}
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur rounded-xl shadow-lg p-3 border border-border pointer-events-none">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-fire border border-white shadow-sm" /><span className="text-[10px] text-ink/60">Rooms available</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#1E3A5F] border border-white shadow-sm" /><span className="text-[10px] text-ink/60">Seekers looking</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-teal border border-white shadow-sm" /><span className="text-[10px] text-ink/60">High compatibility (80%+)</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-ink border-2 border-white shadow-sm" /><span className="text-[10px] text-ink/60">Your location</span></div>
          </div>
        </div>

        {/* Mobile bottom controls */}
        {isMobile && (
          <div className="absolute bottom-4 right-4 z-[1000]">
            <button onClick={() => setMobileListView(true)} className="bg-white rounded-full shadow-lg px-4 py-2.5 flex items-center gap-2 border border-border text-xs font-bold text-ink/70 hover:text-fire transition-colors">
              <ListIcon className="w-4 h-4" /> List ({sortedItems.length})
            </button>
          </div>
        )}

        {/* Loading overlay */}
        {loading && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur rounded-full shadow-lg px-4 py-2 flex items-center gap-2 border border-border">
            <Loader2 className="w-4 h-4 animate-spin text-fire" />
            <span className="text-xs font-medium text-ink/60">Loading...</span>
          </div>
        )}

        {/* THE MAP (Google Maps Tiles via Leaflet) */}
        <MapContainer center={mapCenter} zoom={mapZoom} scrollWheelZoom={true} className="w-full h-full" zoomControl={false}>
          <TileLayer
            key={mapStyle}
            attribution='&copy; <a href="https://maps.google.com">Google Maps</a>'
            url={
              mapStyle === 'satellite'
                ? 'https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
                : 'https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'
            }
            subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
            maxZoom={20}
          />
          <MapPanner center={mapCenter} zoom={mapZoom} />
          <ViewportTracker onBoundsChange={handleBoundsChange} />

          {/* Distance rings */}
          {searchCenter && (
            <>
              <Circle center={searchCenter} radius={2000} pathOptions={{ color: '#E5501A', weight: 1, dashArray: '6 4', fillColor: '#E5501A', fillOpacity: 0.04 }} />
              <Circle center={searchCenter} radius={5000} pathOptions={{ color: '#E5501A', weight: 1, dashArray: '6 4', fillColor: '#E5501A', fillOpacity: 0.02 }} />
            </>
          )}

          {/* User location pin */}
          {profile?.geoLocation && (
            <CircleMarker center={[profile.geoLocation.lat, profile.geoLocation.lng]} radius={10}
              pathOptions={{ color: 'white', weight: 3, fillColor: '#121217', fillOpacity: 1 }} />
          )}

          {/* Item pins */}
          {items.map(item => {
            const key = item.type === 'person' ? item.uid : item.id;
            const color = getPinColor(item);
            return (
              <CircleMarker key={key} center={[item.lat, item.lng]} radius={8}
                pathOptions={{ color: 'white', weight: 2, fillColor: color, fillOpacity: 1 }}>
                <Popup className="match-popup">
                  <div className="flex flex-col gap-2 min-w-[160px] p-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-cream overflow-hidden border border-border flex items-center justify-center shrink-0">
                        {item.type === 'person' && item.avatar ? <img src={item.avatar} className="w-full h-full object-cover" alt="" /> :
                         item.type === 'room' && item.image ? <img src={item.image} className="w-full h-full object-cover" alt="" /> :
                         <MapPin className="w-3 h-3 text-ink/30" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm leading-tight truncate">{item.type === 'person' ? item.name : item.title}</p>
                        <p className="text-[10px] text-ink/50 truncate">{item.type === 'person' ? item.profession : `${item.locality}, ${item.city}`}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      {item.type === 'person' ? <span className="badge-teal text-[10px]">{item.compatibility}% match</span> :
                       <span className="text-xs font-bold text-fire">₹{item.rent?.toLocaleString()}/mo</span>}
                      <button onClick={() => navigate(item.type === 'person' ? `/match/${item.uid}` : `/room/${item.id}`)}
                        className="text-xs text-fire font-medium hover:underline">View →</button>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
