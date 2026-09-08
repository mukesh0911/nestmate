import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import type { UserProfile } from '@/hooks/useAuth';
import { calculateCompatibility } from '@/hooks/useMatches';
import { useChat } from '@/hooks/useChat';
import { useConnections, getRelationshipState } from '@/hooks/useConnections';
import type { Connection } from '@/hooks/useConnections';
import { Search, MapPin, Briefcase, ChevronRight, Loader2, MessageCircle, Sparkles, Users, X, CheckCircle2, User } from 'lucide-react';
import StateEmpty from '@/components/StateEmpty';
import StateLoading from '@/components/StateLoading';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { isPubliclyVisibleProfile } from '@/lib/marketplaceVisibility';
import { formatBudgetINR } from '@/lib/displayTruth';

interface SeekerWithScore {
  profile: UserProfile;
  score: number;
}

export default function BrowseSeekers({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const { user, profile: currentUser } = useAuth();
  const { getOrCreateChatRoom, subscribeToChatRooms } = useChat();
  const { sendRequest, acceptRequest, subscribeToMyConnections } = useConnections();
  const openAuthModal = useStore(state => state.openAuthModal);

  const [seekers, setSeekers] = useState<SeekerWithScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState(currentUser?.city || '');
  const [connectingTo, setConnectingTo] = useState<string | null>(null);
  const [myConnections, setMyConnections] = useState<Connection[]>([]);
  const [chatRoomMap, setChatRoomMap] = useState<Record<string, string>>({});

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

  useEffect(() => {
    async function fetchFlatmates() {
      setLoading(true);
      try {
        const profileMap = new Map<string, UserProfile>();

        // Layer 1: Fetch user documents from Firestore users collection
        try {
          const snap = await getDocs(collection(db, 'users'));
          snap.docs.forEach(d => {
            const data = { uid: d.id, ...d.data() } as UserProfile;
            // Sprint 2E hardening: shared visibility rule — demo, suspended/
            // banned and incomplete-onboarding profiles never appear.
            if (!isPubliclyVisibleProfile(data)) return;
            if (data.uid && data.uid !== user?.uid && !currentUser?.blockedUserIds?.includes(data.uid)) {
              profileMap.set(data.uid, data);
            }
          });
        } catch (err) {
          console.warn('Firestore users query warning:', err);
        }

        // Sprint 2E hardening — ORPHAN POLICY (decision): the previous
        // "Layer 2" fabricated synthetic "Property Owner" profiles from
        // listing metadata when the owner document did not exist. Per the
        // documented policy we now HIDE such listings instead of inventing a
        // person. Every real owner document is already loaded by Layer 1, so
        // no second query is needed here at all.

        // NOTE: No fake/fallback profiles are injected when the database has
        // no real users. An empty result renders the StateEmpty component —
        // the production marketplace must never display fabricated profiles.
        const targetRole = 'seeker';
        let fetched = Array.from(profileMap.values()).filter(p => {
          if (!p.uid || p.uid === user?.uid) return false;
          const r = (p.role || '').toLowerCase();
          return r === targetRole;
        });

        const q = searchCity.trim().toLowerCase();
        const filtered = q
          ? fetched.filter(r =>
              (r.city && r.city.toLowerCase().includes(q)) ||
              (r.locality && r.locality.toLowerCase().includes(q)) ||
              (r.name && r.name.toLowerCase().includes(q)) ||
              (r.profession && r.profession.toLowerCase().includes(q))
            )
          : fetched;

        const scored = filtered.map(u => ({
          profile: u,
          // No fabricated scores: missing preference data yields 0, not a fake 85%
          score: currentUser?.quizAnswers && u.quizAnswers
            ? calculateCompatibility(currentUser.quizAnswers, u.quizAnswers || {}, currentUser.city, u.city)
            : 0,
        }));

        setSeekers(scored);
      } catch (err) {
        console.error('Failed to fetch flatmates', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFlatmates();
  }, [currentUser?.uid, searchCity, user?.uid]);

  const handleConnect = async (seekerId: string) => {
    if (!user?.uid) {
      openAuthModal({
        title: 'Sign in to Connect',
        subtitle: 'Create an account or try a 1-click demo to send connect requests and chat with flatmates.',
        redirect: `/match/${seekerId}`,
      });
      return;
    }
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
      console.error("Failed to connect", err);
      toast.error("Failed to connect");
    } finally {
      setConnectingTo(null);
    }
  };

  const isOwner = currentUser?.role === 'owner';

  const contentBlock = (
    <div>
      {/* ── Search Input Row ── */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Bangalore flatmates by locality, profession or name..."
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            aria-label="Search flatmates"
            className="w-full pl-10 pr-8 py-3 min-h-[44px] bg-white rounded-xl text-xs sm:text-sm border border-slate-200 shadow-xs outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 transition-all text-slate-800 placeholder:text-slate-400"
          />
          {searchCity && (
            <button
              onClick={() => setSearchCity('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label="Clear search filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Found Count ── */}
      <div className="text-xs text-slate-500 font-semibold mb-4 block px-0.5">
        {seekers.length} {isOwner ? 'seekers' : 'roommates'}
      </div>

      {/* ── Listing Section & Card Grid ── */}
      {loading ? (
        <StateLoading label={isOwner ? "Finding room seekers..." : "Finding flatmates..."} />
      ) : seekers.length === 0 ? (
        <StateEmpty
          icon={Users}
          title={isOwner ? "No room seekers found" : "No flatmates found"}
          description="We couldn't find results matching this exact search filter. Try searching another city."
          className="bg-white rounded-2xl border border-dashed border-slate-200 py-12"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {seekers.map(({ profile, score }) => {
            const state = getRelationshipState(user?.uid, profile.uid || '', myConnections, chatRoomMap);
            return (
              <div
                key={profile.uid}
                className="bg-white rounded-2xl overflow-hidden flex flex-col border border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group relative"
              >
                {/* ── Top Accent Band ── */}
                <div
                  className="h-2 w-full flex-shrink-0"
                  style={{
                    background: profile.role === 'owner'
                      ? 'linear-gradient(90deg, #0d9488, #5eead4)'
                      : 'linear-gradient(90deg, #ff5a36, #ffebd9)'
                  }}
                />

                {/* ── Card Body ── */}
                <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-4">
                  {/* Top Row: Avatar + Name + Role badge */}
                  <div>
                    <div className="flex items-start gap-3 mb-3">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center">
                          {profile.avatar ? (
                            <img
                              src={profile.avatar}
                              alt={profile.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-lg font-bold text-brand-orange">
                              {profile.name?.[0]?.toUpperCase()}
                            </span>
                          )}
                        </div>
                        {/* Verified Badge */}
                        {profile.isVerified && (
                          <span
                            className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-xs"
                            title="Verified"
                          >
                            <CheckCircle2 className="w-3 h-3 text-white fill-emerald-500" />
                          </span>
                        )}
                      </div>

                      {/* Name + Role */}
                      <div className="min-w-0 flex-1 pt-0.5">
                        {/* Sprint 5B: sans voice for card titles */}
                        <h3 className="font-bold text-base sm:text-lg text-slate-900 leading-snug truncate group-hover:text-brand-orange transition-colors">
                          {profile.name}
                          {profile.age ? <span className="font-normal text-slate-500 text-xs">, {profile.age}</span> : null}
                        </h3>
                        <span className={`inline-block mt-1 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${profile.role === 'owner'
                          ? 'bg-teal-50 text-teal-700 border-teal-200'
                          : 'bg-orange-50 text-brand-orange border-orange-200'
                          }`}>
                          {profile.role === 'owner' ? 'Room Owner' : 'FLAT SEEKER'}
                        </span>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-3">
                      <MapPin className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                      <span className="truncate">{profile.locality ? `${profile.locality}, ${profile.city || 'Any City'}` : profile.city || 'Any City'}</span>
                    </div>

                    {/* Profession / Company if available */}
                    {profile.profession && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3 truncate">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{profile.profession}{profile.company ? ` at ${profile.company}` : ''}</span>
                      </div>
                    )}

                    {/* Budget Box */}
                    <div className="bg-slate-50 border border-border rounded-xl px-3.5 py-2.5 flex items-center justify-between mt-2">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">BUDGET</span>
                      {/* Sprint 4A (truth): missing budget shows a neutral state —
                          never an invented ₹10,000 default. */}
                      <span className={`text-sm font-extrabold ${profile.budget && profile.budget > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                        {formatBudgetINR(profile.budget)}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons Row: Profile + Connect */}
                  <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <button
                      onClick={() => navigate(`/match/${profile.uid}`)}
                      className="px-3.5 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer shrink-0"
                    >
                      Profile
                    </button>

                    <button
                      onClick={() => handleConnect(profile.uid || '')}
                      disabled={connectingTo === profile.uid || state === 'pending_sent'}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${state === 'connected' || chatRoomMap[profile.uid || '']
                        ? 'bg-teal-600 hover:bg-teal-700 text-white'
                        : state === 'pending_sent'
                          ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                          : state === 'pending_received'
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-brand-orange hover:bg-orange-600 text-white shadow-orange-500/20'
                        }`}
                    >
                      {connectingTo === profile.uid ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : state === 'connected' || chatRoomMap[profile.uid || ''] ? (
                        <>
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Chat</span>
                        </>
                      ) : state === 'pending_sent' ? (
                        <span>Requested</span>
                      ) : state === 'pending_received' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </>
                      ) : (
                        <>
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Connect</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  if (embedded) return contentBlock;

  return (
    <div className="min-h-screen bg-[#fbf9f9] py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-6">
          {/* Sprint 5B: sans voice for page headings */}
          <h1 className="type-h1 text-slate-900">
            {isOwner ? 'Find Room Seekers' : 'Find Flatmates'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isOwner
              ? 'Browse real seekers looking for a room in your area.'
              : 'Browse real flatmates looking for shared accommodation.'}
          </p>
        </div>
        {contentBlock}
      </div>
    </div>
  );
}
