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

  const contentBlock = (
    <div>
      {/* ── Search Input Row ── */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter by city (e.g. Hyderabad)..."
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            aria-label="Filter by city"
            className="w-full pl-10 pr-8 py-3 min-h-[44px] bg-white rounded-xl text-xs sm:text-sm border border-slate-200 shadow-xs outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 transition-all text-slate-800 placeholder:text-slate-400"
          />
          {searchCity && (
            <button
              onClick={() => setSearchCity('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              aria-label="Clear city filter"
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
        <StateLoading label={isOwner ? "Finding room seekers..." : "Finding flatmates & room owners..."} />
      ) : seekers.length === 0 ? (
        <StateEmpty
          icon={Users}
          title={isOwner ? "No room seekers found" : "No flatmates or room owners found"}
          description="We couldn't find results matching this exact search filter. Try searching another city."
          className="bg-white rounded-3xl border border-dashed border-slate-200 py-12"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {seekers.map(({ profile, score }) => {
            const state = getRelationshipState(user?.uid, profile.uid || '', myConnections, chatRoomMap);
            return (
              <div
                key={profile.uid}
                className="bg-white rounded-3xl overflow-hidden flex flex-col border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group relative"
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
                        <h3 className="font-serif font-bold text-base sm:text-lg text-slate-900 leading-snug truncate group-hover:text-brand-orange transition-colors">
                          {profile.name}
                          {profile.age ? <span className="font-normal text-slate-500 text-xs">, {profile.age}</span> : null}
                        </h3>
                        <span className={`inline-block mt-1 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                          profile.role === 'owner'
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
                    <div className="bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5 flex items-center justify-between mt-2">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">BUDGET</span>
                      <span className="text-sm font-extrabold text-slate-900">
                        ₹{profile.budget?.toLocaleString() || '10,000'}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons Row: Profile + Connect */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => navigate(`/match/${profile.uid}`)}
                      className="px-3.5 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer shrink-0"
                    >
                      Profile
                    </button>

                    <button
                      onClick={() => handleConnect(profile.uid || '')}
                      disabled={connectingTo === profile.uid || state === 'pending_sent'}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                        state === 'connected' || chatRoomMap[profile.uid || '']
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
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">{pageTitle}</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{pageSubtitle}</p>
        </div>
        {contentBlock}
      </div>
    </div>
  );
}
