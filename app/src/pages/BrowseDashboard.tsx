import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { useConnections, getRelationshipState, type Connection } from '@/hooks/useConnections';
import { calculateCompatibility } from '@/hooks/useMatches';
import type { UserProfile } from '@/hooks/useAuth';
import {
  Search, MapPin, Briefcase, Loader2, MessageCircle,
  SlidersHorizontal, X, Users, ShieldCheck,
  Sparkles, ArrowUpDown, Building2, Calendar, Utensils, Wallet, CheckCircle2
} from 'lucide-react';
import { professions } from '@/lib/staticData';
import StateEmpty from '@/components/StateEmpty';
import StateLoading from '@/components/StateLoading';
import { toast } from 'sonner';

// ── Lazy-load BrowseRooms so old view is preserved ──
import BrowseRooms from './BrowseRooms';

interface SeekerWithScore {
  profile: UserProfile;
  score: number;
  distance?: number;
}

type SortMode = 'match' | 'recent' | 'budget_low' | 'budget_high';

export default function BrowseDashboard() {
  const { profile: currentUser } = useAuth();
  const isOwner = currentUser?.role === 'owner';

  // Owners default to "seekers" tab, seekers default to "rooms" tab
  const [activeTab, setActiveTab] = useState<'seekers' | 'rooms'>(() => (isOwner ? 'seekers' : 'rooms'));

  return (
    <div className="flex flex-col min-h-screen">
      <TabSwitcher active={activeTab} onChange={setActiveTab} isOwner={isOwner} />
      <div className="flex-1">
        {activeTab === 'seekers' ? <SeekersView /> : <BrowseRooms />}
      </div>
    </div>
  );
}

/* ── Tab Switcher (for both seekers and owners) ── */
function TabSwitcher({ active, onChange, isOwner }: { active: 'seekers' | 'rooms'; onChange: (t: 'seekers' | 'rooms') => void; isOwner: boolean }) {
  return (
    <div className="bg-white/90 backdrop-blur-md sticky top-[60px] z-40 border-b border-border py-3 px-4 sm:px-6">
      <div className="max-w-md mx-auto flex p-1 bg-cream/80 rounded-[14px] border border-border shadow-sm">
        <button
          onClick={() => onChange('rooms')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all ${
            active === 'rooms'
              ? 'bg-white text-fire shadow-sm ring-1 ring-border font-bold'
              : 'text-ink/60 hover:text-ink hover:bg-white/40'
          }`}
        >
          <Building2 className="w-4 h-4 hidden sm:block" />
          <span className="whitespace-nowrap">Find Rooms</span>
        </button>
        <button
          onClick={() => onChange('seekers')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all ${
            active === 'seekers'
              ? 'bg-white text-fire shadow-sm ring-1 ring-border font-bold'
              : 'text-ink/60 hover:text-ink hover:bg-white/40'
          }`}
        >
          <Users className="w-4 h-4 hidden sm:block" />
          <span className="whitespace-nowrap">{isOwner ? 'Find Seekers' : 'Find Flatmates'}</span>
        </button>
      </div>
    </div>
  );
}

/* ── Seekers View (for owners) ── */
function SeekersView() {
  const navigate = useNavigate();
  const { user, profile: currentUser } = useAuth();
  const { getOrCreateChatRoom, subscribeToChatRooms } = useChat();
  const { sendRequest, acceptRequest, subscribeToMyConnections } = useConnections();

  const [allSeekers, setAllSeekers] = useState<SeekerWithScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectingTo, setConnectingTo] = useState<string | null>(null);
  const [myConnections, setMyConnections] = useState<Connection[]>([]);
  const [chatRoomMap, setChatRoomMap] = useState<Record<string, string>>({});

  // Real-time connections & chat rooms
  useEffect(() => {
    if (!user?.uid) return;
    const unsub1 = subscribeToMyConnections(user.uid, setMyConnections);
    const unsub2 = subscribeToChatRooms(user.uid, (rooms) => {
      const map: Record<string, string> = {};
      rooms.forEach(r => {
        const other = r.participants.find(p => p !== user.uid);
        if (other) map[other] = r.id;
      });
      setChatRoomMap(map);
    });
    return () => { unsub1(); unsub2(); };
  }, [user?.uid]);

  // Filters — default to empty/all so everything shows initially
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterGender, setFilterGender] = useState('any');
  const [filterProfession, setFilterProfession] = useState('');
  const [filterBudgetMax, setFilterBudgetMax] = useState(50000);
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('match');

  // Fetch ALL seekers once — all filtering happens client-side
  useEffect(() => {
    if (!currentUser?.uid) return;
    const viewerProfile = currentUser;

    if (!filterCity && viewerProfile.city) {
      setFilterCity(viewerProfile.city);
    }

    let cancelled = false;
    async function fetchAllSeekers() {
      setLoading(true);
      setError(null);
        let results: UserProfile[] = [];
        try {
          const q = query(
            collection(db, 'users'),
            limit(200)
          );
          const snap = await getDocs(q);
          if (cancelled) return;
          results = snap.docs
            .map(d => ({ uid: d.id, ...d.data() } as UserProfile))
            .filter(u => {
              const r = (u.role || '').toLowerCase();
              return r === 'seeker' && u.uid !== user?.uid && !viewerProfile.blockedUserIds?.includes(u.uid || '');
            });
        } catch (err) {
          console.warn('Firestore seekers query error:', err);
        }

        if (results.length === 0 && !cancelled) {
          try {
            const rawSnap = await getDocs(collection(db, 'users'));
            results = rawSnap.docs
              .map(d => ({ uid: d.id, ...d.data() } as UserProfile))
              .filter(u => {
                const r = (u.role || '').toLowerCase();
                return r === 'seeker' && u.uid !== user?.uid && !viewerProfile.blockedUserIds?.includes(u.uid || '');
              });
          } catch (err) {
            console.error('Fallback seekers fetch error:', err);
          }
        }

        const scored: SeekerWithScore[] = results.map(u => ({
          profile: u,
          score: calculateCompatibility(viewerProfile.quizAnswers || {}, u.quizAnswers || {}, viewerProfile.city, u.city),
        }));

        setAllSeekers(scored);
      } catch (err: any) {
        console.error('Failed to fetch seekers:', err);
        if (!cancelled) setError(err.message || 'Failed to load seekers');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAllSeekers();
    return () => { cancelled = true; };
  }, [currentUser, filterCity, user?.uid]);

  // Dynamically collect cities that exist in the data
  const availableCities = useMemo(() => {
    const citySet = new Set<string>();
    allSeekers.forEach(s => {
      if (s.profile.city) citySet.add(s.profile.city);
    });
    return Array.from(citySet).sort();
  }, [allSeekers]);

  // Client-side filtering + sorting
  const filtered = useMemo(() => {
    let list = [...allSeekers];

    if (filterCity) {
      const cityMatches = list.filter(s =>
        s.profile.city?.toLowerCase() === filterCity.toLowerCase()
      );
      if (cityMatches.length > 0) {
        list = cityMatches;
      }
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s =>
        s.profile.name?.toLowerCase().includes(q) ||
        s.profile.profession?.toLowerCase().includes(q) ||
        s.profile.city?.toLowerCase().includes(q)
      );
    }

    if (filterGender !== 'any') {
      list = list.filter(s =>
        s.profile.gender?.toLowerCase() === filterGender.toLowerCase()
      );
    }

    if (filterProfession) {
      list = list.filter(s => s.profile.profession === filterProfession);
    }

    if (filterBudgetMax < 50000) {
      list = list.filter(s => !s.profile.budget || s.profile.budget <= filterBudgetMax);
    }

    if (filterVerifiedOnly) {
      list = list.filter(s =>
        s.profile.isVerified || (s.profile.verificationLevel ?? 0) > 0
      );
    }

    switch (sortMode) {
      case 'match':
        list.sort((a, b) => b.score - a.score);
        break;
      case 'recent':
        list.sort((a, b) => {
          const aT = a.profile.lastActiveAt?.toMillis?.() || a.profile.updatedAt?.toMillis?.() || 0;
          const bT = b.profile.lastActiveAt?.toMillis?.() || b.profile.updatedAt?.toMillis?.() || 0;
          return bT - aT;
        });
        break;
      case 'budget_low':
        list.sort((a, b) => (a.profile.budget || 0) - (b.profile.budget || 0));
        break;
      case 'budget_high':
        list.sort((a, b) => (b.profile.budget || 0) - (a.profile.budget || 0));
        break;
    }

    return list;
  }, [allSeekers, searchQuery, filterCity, filterGender, filterProfession, filterBudgetMax, filterVerifiedOnly, sortMode]);

  const handleConnect = async (seekerId: string) => {
    if (!user?.uid) return;
    const state = getRelationshipState(user.uid, seekerId, myConnections, chatRoomMap);
    if (state === 'pending_sent') return;

    setConnectingTo(seekerId);
    try {
      if (state === 'connected' || chatRoomMap[seekerId]) {
        const roomId = chatRoomMap[seekerId] || (await getOrCreateChatRoom(user.uid, seekerId));
        navigate(`/chat/${roomId}`);
      } else if (state === 'pending_received') {
        const conn = myConnections.find(c => c.fromUserId === seekerId && c.toUserId === user.uid);
        if (conn) await acceptRequest(conn.id);
        const roomId = await getOrCreateChatRoom(user.uid, seekerId);
        navigate(`/chat/${roomId}`);
      } else {
        await sendRequest(user.uid, seekerId);
        toast.success("Connect request sent!");
      }
    } catch (err) {
      console.error('Failed to connect', err);
      toast.error('Failed to connect');
    } finally {
      setConnectingTo(null);
    }
  };

  const activeFilterCount = [
    filterCity !== '',
    filterGender !== 'any',
    !!filterProfession,
    filterBudgetMax < 50000,
    filterVerifiedOnly,
  ].filter(Boolean).length;

  const clearFilters = () => {
    setFilterCity('');
    setFilterGender('any');
    setFilterProfession('');
    setFilterBudgetMax(50000);
    setFilterVerifiedOnly(false);
    setSearchQuery('');
    setShowFilters(false);
  };

  return (
    <div className="min-h-screen bg-parchment pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-display italic">Find Roommate Seekers</h1>
            <p className="text-sm text-ink/50">{filtered.length} seekers available{filterCity ? ` in ${filterCity}` : ''}</p>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name, profession..."
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:border-fire"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="relative p-2.5 bg-white border border-border rounded-xl hover:bg-cream/50"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-fire text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && <StateLoading label="Finding active room seekers..." />}

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 text-sm mb-6 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => window.location.reload()} className="font-bold underline text-xs">Retry</button>
          </div>
        )}

        {/* Grid of Seekers */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filtered.map(({ profile: p, score }) => {
              const state = getRelationshipState(user?.uid, p.uid || '', myConnections, chatRoomMap);
              return (
                <div key={p.uid} className="card-nestmate p-4 flex flex-col justify-between hover:border-fire/40 transition-all group">
                  <div>
                    {/* Header: Avatar + Match Badge */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="relative">
                        <img
                          src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name || 'user'}`}
                          alt={p.name}
                          className="w-14 h-14 rounded-2xl object-cover border border-border bg-cream/50"
                        />
                        {p.isVerified && (
                          <div className="absolute -bottom-1 -right-1 bg-teal text-white p-0.5 rounded-full shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 fill-teal text-white" />
                          </div>
                        )}
                      </div>
                      <span className="badge-fire text-xs font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> {score}% Match
                      </span>
                    </div>

                    {/* Name + Age */}
                    <h3 className="font-bold text-ink text-base group-hover:text-fire transition-colors line-clamp-1">
                      {p.name}, {p.age}
                    </h3>
                    <p className="text-xs text-ink/50 font-medium mb-3">
                      {p.profession || 'Working Professional'} {p.company ? `at ${p.company}` : ''}
                    </p>

                    {/* Quick Specs */}
                    <div className="space-y-1.5 mb-4 text-xs text-ink/70">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-fire flex-shrink-0" />
                        <span className="truncate">{p.localities?.join(', ') || p.city || 'Any Location'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wallet className="w-3.5 h-3.5 text-fire flex-shrink-0" />
                        <span className="font-semibold text-ink">Budget: ₹{p.budget?.toLocaleString() || '15,000'}/mo</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-fire flex-shrink-0" />
                        <span>Move-in: {p.moveInDate || 'Immediate'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-border/50">
                    <button
                      onClick={() => navigate(`/match/${p.uid}`)}
                      className="flex-1 py-2.5 rounded-xl font-bold text-xs border border-border text-ink/70 hover:bg-cream hover:text-ink transition-all"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => handleConnect(p.uid || '')}
                      disabled={connectingTo === p.uid || state === 'pending_sent'}
                      className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                        state === 'connected' ? 'bg-emerald-600 text-white hover:bg-emerald-700' :
                        state === 'pending_sent' ? 'bg-ink/10 text-ink/40 cursor-not-allowed' :
                        state === 'pending_received' ? 'bg-teal text-white hover:opacity-90' :
                        'btn-fire'
                      }`}
                    >
                      {connectingTo === p.uid ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <MessageCircle className="w-4 h-4" />
                      )}
                      {state === 'connected' ? 'Message' :
                       state === 'pending_sent' ? 'Request Sent' :
                       state === 'pending_received' ? 'Accept' : 'Connect'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Sort + City chips */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {/* City chips — dynamic from actual seeker data */}
          <button
            onClick={() => setFilterCity('')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${!filterCity ? 'bg-ink text-white' : 'bg-white border border-border text-ink/60 hover:border-fire/30'}`}
          >All Cities ({allSeekers.length})</button>
          {availableCities.map(c => (
            <button
              key={c}
              onClick={() => setFilterCity(filterCity === c ? '' : c)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filterCity === c ? 'bg-ink text-white' : 'bg-white border border-border text-ink/60 hover:border-fire/30'}`}
            >
              {c} ({allSeekers.filter(s => s.profile.city?.toLowerCase() === c.toLowerCase()).length})
            </button>
          ))}

          {/* Sort dropdown */}
          <div className="ml-auto flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-ink/40" />
            <select
              value={sortMode}
              onChange={e => setSortMode(e.target.value as SortMode)}
              className="text-sm bg-white border border-border rounded-lg px-3 py-1.5 outline-none focus:border-fire"
            >
              <option value="match">Best Match</option>
              <option value="recent">Recently Active</option>
              <option value="budget_low">Budget: Low → High</option>
              <option value="budget_high">Budget: High → Low</option>
            </select>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-center">
            <p className="text-sm text-red-600 mb-2">{error}</p>
            <button onClick={() => window.location.reload()} className="btn-outline text-sm text-red-500 border-red-300">Retry</button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <StateLoading label="Finding seekers..." />
        )}

        {/* Seeker Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(({ profile: p, score }) => (
              <div
                key={p.uid}
                className="bg-white rounded-2xl overflow-hidden flex flex-col shadow-[0_2px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(232,92,65,0.12)] transition-all duration-300 hover:-translate-y-1 border border-border/40"
              >
                {/* ── Orange Banner ── */}
                <div className="relative h-[100px]" style={{ background: 'linear-gradient(135deg, #E85C41 0%, #F7A046 50%, #E85C41 100%)' }}>
                  {/* Decorative pattern */}
                  <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px), radial-gradient(circle at 60% 80%, white 1px, transparent 1px)', backgroundSize: '60px 60px, 40px 40px, 50px 50px' }} />
                  
                  {/* Match score - top right pill */}
                  {score > 0 && (
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                      <Sparkles className="w-3.5 h-3.5 text-fire" />
                      <span className="text-xs font-extrabold text-ink">{score}%</span>
                    </div>
                  )}

                  {/* Verified badge - top left */}
                  {(p.isVerified || (p.verificationLevel ?? 0) > 0) && (
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-full flex items-center gap-1 shadow-lg">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal" />
                      <span className="text-[10px] text-teal font-bold tracking-wide uppercase">Verified</span>
                    </div>
                  )}

                  {/* Budget on banner */}
                  {p.budget > 0 && (
                    <div className="absolute bottom-3 right-3 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                      <span className="text-white text-xs font-bold">₹{p.budget.toLocaleString()}/mo</span>
                    </div>
                  )}

                  {/* Centered Avatar */}
                  <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                    <div className="w-[76px] h-[76px] rounded-full border-[4px] border-white bg-cream flex items-center justify-center overflow-hidden shadow-xl">
                      {p.avatar ? (
                        <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-display italic text-fire/60">{p.name?.[0]?.toUpperCase()}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Card Body ── */}
                <div className="pt-12 px-5 pb-5 flex-1 flex flex-col text-center">
                  {/* Name + Age */}
                  <h3 className="font-bold text-lg text-ink leading-tight">
                    {p.name}{p.age ? <span className="font-normal text-ink/50">, {p.age}</span> : ''}
                  </h3>

                  {/* Location */}
                  <div className="flex items-center justify-center gap-1 mt-1.5 text-xs text-ink/50">
                    <MapPin className="w-3 h-3" />
                    <span>{p.city || 'Any City'}{p.localities?.length ? ` · ${p.localities[0]}` : ''}</span>
                  </div>

                  {/* Profession */}
                  {p.profession && (
                    <div className="flex items-center justify-center gap-1.5 mt-1 text-xs text-ink/50">
                      <Briefcase className="w-3 h-3" />
                      <span>{p.profession}{p.company ? ` · ${p.company}` : ''}</span>
                    </div>
                  )}

                  {/* ── Tags Row ── */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4">
                    {p.gender && (
                      <span className="text-[11px] bg-fire/5 text-fire/80 px-2.5 py-1 rounded-full font-medium capitalize">{p.gender}</span>
                    )}
                    {p.moveInDate && (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-navy/5 text-navy/80 px-2.5 py-1 rounded-full font-semibold">
                        <Calendar className="w-3 h-3 text-navy" /> {p.moveInDate}
                      </span>
                    )}
                    {p.quizAnswers?.food_pref && (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-teal/5 text-teal/80 px-2.5 py-1 rounded-full font-semibold capitalize">
                        <Utensils className="w-3 h-3 text-teal" /> {p.quizAnswers.food_pref.replace('_', '-')}
                      </span>
                    )}
                    {p.quizAnswers?.work_mode && (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-ink/5 text-ink/70 px-2.5 py-1 rounded-full font-semibold uppercase">
                        <Briefcase className="w-3 h-3 text-ink/50" /> {p.quizAnswers.work_mode}
                      </span>
                    )}
                  </div>

                  {/* ── Action Buttons ── */}
                  <div className="flex gap-3 mt-auto pt-5">
                    <button
                      onClick={() => navigate(`/match/${p.uid}`)}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 border-ink/10 text-ink/70 hover:border-fire hover:text-fire hover:bg-fire/5 transition-all duration-200"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => handleConnect(p.uid)}
                      disabled={connectingTo === p.uid}
                      className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.97]"
                      style={{ background: 'linear-gradient(135deg, #E85C41, #F7A046)' }}
                    >
                      {connectingTo === p.uid ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <MessageCircle className="w-4 h-4" />
                      )}
                      Connect
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && (
          <StateEmpty
            icon={Users}
            title="No seekers found"
            description="Try adjusting your filters or city"
            action={
              <button onClick={clearFilters} className="btn-outline text-sm">Clear All Filters</button>
            }
          />
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-sm bg-white h-full shadow-2xl flex flex-col">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="font-display italic text-lg">Filter Seekers</h2>
              <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-cream rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* City */}
              <div>
                <label className="label-floating">City</label>
                <select
                  value={filterCity}
                  onChange={e => setFilterCity(e.target.value)}
                  className="input-nestmate"
                >
                  <option value="">All Cities</option>
                  {availableCities.map(c => (
                    <option key={c} value={c}>{c} ({allSeekers.filter(s => s.profile.city?.toLowerCase() === c.toLowerCase()).length})</option>
                  ))}
                </select>
              </div>
              {/* Gender */}
              <div>
                <label className="label-floating">Gender Preference</label>
                <div className="flex gap-2 flex-wrap">
                  {['any', 'male', 'female'].map(g => (
                    <button
                      key={g}
                      onClick={() => setFilterGender(g)}
                      className={`px-4 py-2 rounded-xl border text-sm transition-colors capitalize ${filterGender === g ? 'border-fire bg-fire/5 text-fire font-medium' : 'border-border bg-white text-ink/70 hover:border-fire/30'}`}
                    >{g === 'any' ? 'All' : g}</button>
                  ))}
                </div>
              </div>
              {/* Profession */}
              <div>
                <label className="label-floating">Profession</label>
                <select
                  value={filterProfession}
                  onChange={e => setFilterProfession(e.target.value)}
                  className="input-nestmate"
                >
                  <option value="">All Professions</option>
                  {professions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              {/* Budget */}
              <div>
                <label className="label-floating">Max Budget: ₹{filterBudgetMax.toLocaleString()}</label>
                <input
                  type="range" min="5000" max="50000" step="1000"
                  value={filterBudgetMax}
                  onChange={e => setFilterBudgetMax(parseInt(e.target.value))}
                  className="w-full accent-fire"
                />
                <div className="flex justify-between text-xs text-ink/50 mt-1"><span>₹5,000</span><span>₹50,000</span></div>
              </div>
              {/* Verified */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterVerifiedOnly}
                  onChange={e => setFilterVerifiedOnly(e.target.checked)}
                  className="w-4 h-4 accent-fire rounded"
                />
                <div>
                  <p className="text-sm font-medium">Verified Only</p>
                  <p className="text-xs text-ink/40">Show only ID-verified seekers</p>
                </div>
              </label>
            </div>
            <div className="p-4 border-t border-border flex gap-3 bg-cream/30">
              <button onClick={clearFilters} className="flex-1 btn-outline bg-white py-2.5">Clear</button>
              <button onClick={() => setShowFilters(false)} className="flex-[2] btn-fire py-2.5">Apply Filters</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
