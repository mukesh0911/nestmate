import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import type { UserProfile } from '@/hooks/useAuth';
import { calculateCompatibility } from '@/hooks/useMatches';
import { useChat } from '@/hooks/useChat';
import { useConnections, getRelationshipState } from '@/hooks/useConnections';
import type { Connection } from '@/hooks/useConnections';
import { Search, MapPin, Briefcase, ChevronRight, Loader2, MessageCircle, Sparkles, Users, X, CheckCircle2 } from 'lucide-react';
import StateEmpty from '@/components/StateEmpty';
import StateLoading from '@/components/StateLoading';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';

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
            if (data.uid && data.uid !== user?.uid && !currentUser?.blockedUserIds?.includes(data.uid)) {
              profileMap.set(data.uid, data);
            }
          });
        } catch (err) {
          console.warn('Firestore users query warning:', err);
        }

        // Layer 2: Fetch active room listings & extract owner profiles
        try {
          const lsnap = await getDocs(collection(db, 'listings'));
          lsnap.docs.forEach(d => {
            const ldata = d.data();
            const ownerId = ldata.ownerId || d.id;
            if (ownerId && ownerId !== user?.uid && !currentUser?.blockedUserIds?.includes(ownerId)) {
              if (!profileMap.has(ownerId)) {
                profileMap.set(ownerId, {
                  uid: ownerId,
                  name: ldata.ownerName || 'Property Owner',
                  avatar: ldata.ownerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${ownerId}`,
                  role: 'owner',
                  city: ldata.city || 'Hyderabad',
                  locality: ldata.locality || 'Gachibowli',
                  localities: [ldata.locality || 'Gachibowli'],
                  budget: ldata.partnerShare || ldata.totalRent || 12000,
                  profession: 'Property Host',
                  bio: ldata.description || `Offering ${ldata.flatType || 'room'} in ${ldata.locality || ldata.city}`,
                  onboardingComplete: true,
                  isVerified: true,
                } as UserProfile);
              }
            }
          });
        } catch (err) {
          console.warn('Firestore listings query warning:', err);
        }

        // Layer 3: Fallback verified flatmates across Indian cities if database has no other profiles
        if (profileMap.size === 0) {
          const fallbackProfiles: UserProfile[] = ([
            {
              uid: 'demo_flatmate_1',
              name: 'Priya Sharma',
              age: 24,
              gender: 'Female',
              role: 'seeker',
              city: 'Hyderabad',
              locality: 'Gachibowli',
              localities: ['Gachibowli', 'HITECH City'],
              budget: 15000,
              profession: 'Software Engineer',
              company: 'Microsoft',
              bio: 'Looking for a clean, peaceful flatmate near HITECH City.',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
              onboardingComplete: true,
              isVerified: true,
              quizAnswers: { q1: '1', q2: '2', q3: '1', q4: '3', q5: '2' },
            },
            {
              uid: 'demo_flatmate_2',
              name: 'Rohan Verma',
              age: 26,
              gender: 'Male',
              role: 'owner',
              city: 'Hyderabad',
              locality: 'Kondapur',
              localities: ['Kondapur', 'Madhapur'],
              budget: 18000,
              profession: 'Product Manager',
              company: 'Google',
              bio: 'Furnished 3BHK room available for a like-minded flatmate.',
              avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
              onboardingComplete: true,
              isVerified: true,
              quizAnswers: { q1: '2', q2: '1', q3: '3', q4: '2', q5: '1' },
            },
            {
              uid: 'demo_flatmate_3',
              name: 'Ananya Reddy',
              age: 23,
              gender: 'Female',
              role: 'seeker',
              city: 'Bengaluru',
              locality: 'Koramangala',
              localities: ['Koramangala', 'HSR Layout'],
              budget: 16000,
              profession: 'UI/UX Designer',
              company: 'Swiggy',
              bio: 'Creative professional seeking a non-smoking flatmate in Koramangala.',
              avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80',
              onboardingComplete: true,
              isVerified: true,
              quizAnswers: { q1: '1', q2: '3', q3: '2', q4: '1', q5: '2' },
            },
            {
              uid: 'demo_flatmate_4',
              name: 'Karthik Iyer',
              age: 27,
              gender: 'Male',
              role: 'owner',
              city: 'Chennai',
              locality: 'Velachery',
              localities: ['Velachery', 'Adyar'],
              budget: 14000,
              profession: 'Data Scientist',
              company: 'Zoho',
              bio: 'Master bedroom with attached bath available in Velachery 2BHK.',
              avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
              onboardingComplete: true,
              isVerified: true,
              quizAnswers: { q1: '3', q2: '2', q3: '1', q4: '2', q5: '3' },
            },
          ] as unknown[]) as UserProfile[];
          fallbackProfiles.forEach(p => profileMap.set(p.uid, p));
        }

        const targetRole = currentUser?.role === 'owner' ? 'seeker' : 'owner';
        let fetched = Array.from(profileMap.values()).filter(p => {
          if (!p.uid || p.uid === user?.uid) return false;
          const r = (p.role || '').toLowerCase();
          return r === targetRole;
        });

        let filtered = searchCity
          ? fetched.filter(r => r.city?.toLowerCase().includes(searchCity.toLowerCase()))
          : fetched;

        if (filtered.length === 0 && searchCity) {
          filtered = fetched;
        }

        const scored = filtered.map(u => ({
          profile: u,
          score: currentUser?.quizAnswers
            ? calculateCompatibility(currentUser.quizAnswers, u.quizAnswers || {}, currentUser.city, u.city)
            : 85,
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
  const pageTitle = isOwner ? 'Find Room Seekers' : 'Find Flatmates & Rooms';
  const pageSubtitle = isOwner
    ? 'Browse verified seekers looking for accommodation'
    : 'Explore verified room owners and flatmates with available rooms';

  const contentBlock = (
    <div>
      {/* ── Search & Count Row — always single line ── */}
      <div className="flex items-center gap-2 mb-5">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/35 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter by city (e.g. Hyderabad)..."
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            aria-label="Filter by city"
            className="w-full pl-9 pr-8 py-2.5 min-h-[44px] bg-white rounded-xl text-[13px] border border-gray-200 shadow-xs outline-none focus:border-fire focus:ring-2 focus:ring-fire/10 transition-all"
          />
          {searchCity && (
            <button
              onClick={() => setSearchCity('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-ink/35 hover:text-ink/70 cursor-pointer"
              aria-label="Clear city filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <p className="text-[11px] font-bold text-ink/45 shrink-0 whitespace-nowrap">
          {seekers.length} {isOwner ? 'seekers' : 'roommates'}
        </p>
      </div>

      {/* ── Listing Section & Card Grid ── */}
      {loading ? (
        <StateLoading label={isOwner ? "Finding room seekers..." : "Finding flatmates & room owners..."} />
      ) : seekers.length === 0 ? (
        <StateEmpty
          icon={Users}
          title={isOwner ? "No room seekers found" : "No flatmates or room owners found"}
          description="We couldn't find results matching this exact search filter. Try searching another city."
          className="bg-cream/30 rounded-2xl border border-dashed border-border py-12"
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
          {seekers.map(({ profile, score }) => {
            const state = getRelationshipState(user?.uid, profile.uid || '', myConnections, chatRoomMap);
            return (
              <div
                key={profile.uid}
                className="bg-white rounded-2xl overflow-hidden flex flex-col border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 transition-all duration-200 group"
              >
                {/* ── Top Accent Band ── */}
                <div
                  className="h-1.5 w-full flex-shrink-0"
                  style={{
                    background: profile.role === 'owner'
                      ? 'linear-gradient(90deg, #0d9488, #5eead4)'
                      : 'linear-gradient(90deg, #f59e0b, #fcd34d)'
                  }}
                />

                {/* ── Card Body ── */}
                <div className="p-3.5 sm:p-4 flex flex-col flex-1 gap-3">
                  {/* Row 1: Avatar + Name + Role badge */}
                  <div className="flex items-start gap-2.5">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-cream border-2 border-white shadow-sm flex items-center justify-center">
                        {profile.avatar ? (
                          <img
                            src={profile.avatar}
                            alt={profile.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-base font-bold text-fire">
                            {profile.name?.[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      {/* Verified Badge */}
                      {profile.isVerified && (
                        <span
                          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-xs"
                          title="Verified"
                        >
                          <CheckCircle2 className="w-2.5 h-2.5 text-white fill-emerald-500" />
                        </span>
                      )}
                    </div>

                    {/* Name + Role */}
                    <div className="min-w-0 flex-1 pt-0.5">
                      <h3 className="font-bold text-[13px] sm:text-sm text-ink leading-tight line-clamp-1 group-hover:text-fire transition-colors duration-150">
                        {profile.name}
                        {profile.age ? <span className="font-normal text-ink/50 text-xs">, {profile.age}</span> : null}
                      </h3>
                      <span className={`inline-block mt-1 text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        profile.role === 'owner'
                          ? 'bg-teal-50 text-teal-700 border-teal-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {profile.role === 'owner' ? 'Room Owner' : 'Flat Seeker'}
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Location & Profession */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-[11px] text-ink/60 font-medium">
                      <MapPin className="w-3 h-3 text-fire flex-shrink-0" />
                      <span className="truncate">{profile.city || 'Any City'}{profile.locality ? ` · ${profile.locality}` : ''}</span>
                    </div>
                    {profile.profession && (
                      <div className="flex items-center gap-1 text-[11px] text-ink/45 font-medium">
                        <Briefcase className="w-3 h-3 flex-shrink-0 text-ink/30" />
                        <span className="truncate">{profile.profession}{profile.company ? ` at ${profile.company}` : ''}</span>
                      </div>
                    )}
                  </div>

                  {/* Row 3: Match % + Budget side-by-side */}
                  <div className="flex items-center gap-2">
                    {score > 0 && (
                      <div className="flex items-center gap-1 bg-fire/8 text-fire text-[10px] font-extrabold px-2 py-1 rounded-lg flex-shrink-0">
                        <Sparkles className="w-3 h-3" />
                        {score}% Match
                      </div>
                    )}
                    {profile.budget && profile.budget > 0 && (
                      <div className="flex-1 min-w-0 bg-gray-50 rounded-lg px-2 py-1 flex items-center justify-between gap-1 border border-gray-100">
                        <span className="text-[9px] text-ink/40 font-semibold uppercase tracking-wide flex-shrink-0">Budget</span>
                        <span className="text-[11px] font-extrabold text-ink truncate">₹{profile.budget.toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Row 4: CTAs */}
                  <div className="mt-auto pt-2.5 border-t border-gray-100 flex gap-1.5">
                    <button
                      onClick={() => navigate(`/match/${profile.uid}`)}
                      className="flex-1 min-h-[36px] text-[11px] font-bold text-ink/70 border border-gray-200 rounded-xl hover:border-fire/40 hover:text-fire hover:bg-fire/5 transition-all duration-150 cursor-pointer"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => handleConnect(profile.uid || '')}
                      disabled={connectingTo === profile.uid || state === 'pending_sent'}
                      className={`flex-[1.8] min-h-[36px] text-[11px] font-bold rounded-xl flex items-center justify-center gap-1 transition-all duration-150 shadow-xs cursor-pointer ${
                        state === 'connected' ? 'bg-emerald-600 text-white hover:bg-emerald-700' :
                        state === 'pending_sent' ? 'bg-ink/10 text-ink/40 cursor-not-allowed' :
                        state === 'pending_received' ? 'bg-teal text-white hover:opacity-90' :
                        'btn-fire'
                      }`}
                    >
                      {connectingTo === profile.uid ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <MessageCircle className="w-3.5 h-3.5" />
                      )}
                      {state === 'connected' ? 'Message' :
                       state === 'pending_sent' ? 'Sent' :
                       state === 'pending_received' ? 'Accept' : 'Connect'}
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

  if (embedded) {
    return contentBlock;
  }

  return (
    <div className="min-h-screen bg-parchment pb-16 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-border/50">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-display italic text-ink tracking-tight">
              {pageTitle}
            </h1>
            <p className="text-sm text-ink/60 mt-1.5 font-sans">
              {pageSubtitle}
            </p>
          </div>
        </div>
        {contentBlock}
      </div>
    </div>
  );
}
