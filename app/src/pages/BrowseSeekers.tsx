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

export default function BrowseSeekers() {
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

  return (
    <div className="min-h-screen bg-parchment pb-16 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* ── Page Header Section ── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pb-6 border-b border-border/50">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-display italic text-ink tracking-tight">
              {pageTitle}
            </h1>
            <p className="text-sm text-ink/60 mt-1.5 font-sans">
              {pageSubtitle}
            </p>
          </div>

          <div className="relative w-full md:w-80 shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
            <input
              type="text"
              placeholder="Filter by city (e.g. Hyderabad)..."
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              aria-label="Filter by city"
              className="w-full pl-10 pr-9 py-2.5 min-h-[44px] bg-white rounded-xl text-sm border border-border shadow-2xs outline-none focus:border-fire focus:ring-2 focus:ring-fire/10 transition-all font-sans"
            />
            {searchCity && (
              <button
                onClick={() => setSearchCity('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/70 p-1"
                aria-label="Clear city filter"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {seekers.map(({ profile, score }) => {
              const state = getRelationshipState(user?.uid, profile.uid || '', myConnections, chatRoomMap);
              return (
                <div
                  key={profile.uid}
                  className="bg-white rounded-2xl overflow-hidden flex flex-col shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(238,77,45,0.12)] transition-all duration-300 hover:-translate-y-1 border border-border/60 group"
                >
                  {/* Banner */}
                  <div className="relative h-20 bg-gradient-to-r from-fire/10 via-cream to-teal/10 p-3.5 flex items-start justify-between border-b border-border/30">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-2xs ${
                      profile.role === 'owner'
                        ? 'bg-teal-50 text-teal-700 border border-teal-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {profile.role === 'owner' ? 'Room Owner' : 'Flat Seeker'}
                    </span>

                    {score > 0 && (
                      <div className="bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-xs font-extrabold text-fire shadow-2xs flex items-center gap-1 border border-fire/20">
                        <Sparkles className="w-3.5 h-3.5 text-fire" /> {score}% Match
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-5 pt-0 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Avatar Row */}
                      <div className="-mt-8 mb-3 flex items-end justify-between">
                        <div className="w-16 h-16 rounded-full border-4 border-white bg-cream flex items-center justify-center overflow-hidden shadow-md shrink-0">
                          {profile.avatar ? (
                            <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl font-display italic text-fire/70">{profile.name?.[0]?.toUpperCase()}</span>
                          )}
                        </div>

                        {profile.isVerified && (
                          <div className="mb-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                          </div>
                        )}
                      </div>

                      {/* Name & Age */}
                      <h3 className="font-bold text-base text-ink group-hover:text-fire transition-colors line-clamp-1 leading-snug">
                        {profile.name}{profile.age ? `, ${profile.age}` : ''}
                      </h3>

                      {/* Location & Profession */}
                      <div className="space-y-1.5 mt-2 mb-4">
                        <div className="flex items-center gap-1.5 text-xs text-ink/60 min-w-0">
                          <MapPin className="w-3.5 h-3.5 text-fire shrink-0" />
                          <span className="truncate">{profile.city || 'Any City'}{profile.locality ? ` · ${profile.locality}` : ''}</span>
                        </div>
                        {profile.profession && (
                          <div className="flex items-center gap-1.5 text-xs text-ink/60 min-w-0">
                            <Briefcase className="w-3.5 h-3.5 text-ink/40 shrink-0" />
                            <span className="truncate">{profile.profession}{profile.company ? ` at ${profile.company}` : ''}</span>
                          </div>
                        )}
                      </div>

                      {/* Budget */}
                      {profile.budget && profile.budget > 0 && (
                        <div className="mb-4 py-2 px-3 bg-cream/50 rounded-xl border border-border/40 text-xs flex items-center justify-between">
                          <span className="text-ink/50 font-medium">Budget:</span>
                          <span className="font-bold text-ink">₹{profile.budget.toLocaleString()}/mo</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/40 mt-auto">
                      <button 
                        onClick={() => navigate(`/match/${profile.uid}`)}
                        className="w-full py-2.5 min-h-[42px] rounded-xl text-xs font-bold border border-border text-ink/80 hover:bg-cream hover:border-fire/40 transition-all flex items-center justify-center"
                      >
                        View Profile
                      </button>
                      <button 
                        onClick={() => handleConnect(profile.uid || '')}
                        disabled={connectingTo === profile.uid || state === 'pending_sent'}
                        className={`w-full py-2.5 min-h-[42px] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-2xs ${
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
    </div>
  );
}
