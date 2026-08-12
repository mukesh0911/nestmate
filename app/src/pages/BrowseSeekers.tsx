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
import { Search, MapPin, Briefcase, ChevronRight, Loader2, MessageCircle, Sparkles, Users } from 'lucide-react';
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
          const fallbackProfiles: UserProfile[] = [
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
          ];
          fallbackProfiles.forEach(p => profileMap.set(p.uid, p));
        }

        let fetched = Array.from(profileMap.values());

        // Sort candidates based on current user role:
        // Seekers prioritize Room Owners & listings; Owners prioritize Room Seekers
        const isOwnerRole = currentUser?.role === 'owner';
        fetched.sort((a, b) => {
          if (isOwnerRole) {
            const aIsSeeker = a.role === 'seeker' ? 1 : 0;
            const bIsSeeker = b.role === 'seeker' ? 1 : 0;
            return bIsSeeker - aIsSeeker;
          } else {
            const aIsOwner = a.role === 'owner' ? 1 : 0;
            const bIsOwner = b.role === 'owner' ? 1 : 0;
            return bIsOwner - aIsOwner;
          }
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
    <div className="min-h-screen bg-parchment pb-4 overflow-x-hidden">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md sticky top-[60px] z-30 border-b border-border px-4 py-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-display italic">{pageTitle}</h1>
            <p className="text-sm text-ink/60">{pageSubtitle}</p>
          </div>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
            <input
              type="text"
              placeholder="Filter by city..."
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              aria-label="Filter by city"
              className="w-full sm:w-64 pl-9 pr-4 py-2.5 min-h-[44px] bg-cream/50 rounded-xl text-sm outline-none focus:border-fire border border-border"
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <StateLoading label={isOwner ? "Finding room seekers..." : "Finding flatmates & room owners..."} />
        ) : seekers.length === 0 ? (
          <StateEmpty
            icon={Users}
            title={isOwner ? "No room seekers found" : "No flatmates or room owners found"}
            description="We couldn't find results matching this exact search filter. Try searching another city."
            className="bg-cream/30 rounded-2xl border border-dashed border-border"
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {seekers.map(({ profile, score }) => {
              const state = getRelationshipState(user?.uid, profile.uid || '', myConnections, chatRoomMap);
              return (
                <div key={profile.uid} className="card-nestmate overflow-hidden flex flex-col">
                  <div className="h-24 bg-gradient-to-br from-fire/10 to-navy/10 relative">
                    <div className="absolute -bottom-10 left-4 w-20 h-20 rounded-full border-4 border-white bg-cream flex items-center justify-center overflow-hidden">
                      {profile.avatar ? (
                        <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl font-display italic text-ink/40">{profile.name?.[0]?.toUpperCase()}</span>
                      )}
                    </div>
                    {score > 0 && (
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-2.5 py-1 rounded-lg text-xs font-bold text-fire shadow-sm flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-fire" /> {score}% Match
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-12 px-4 pb-4 flex-1 flex flex-col">
                    <h3 className="font-semibold text-lg">{profile.name}, {profile.age}</h3>
                    <div className="flex flex-col gap-1 mt-2 mb-4 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-ink/60">
                          <MapPin className="w-3.5 h-3.5 text-fire" /> {profile.city || 'Any City'}
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          profile.role === 'owner'
                            ? 'bg-teal-50 text-teal-700 border border-teal-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {profile.role === 'owner' ? 'Room Owner' : 'Flat Seeker'}
                        </span>
                      </div>
                      {profile.profession && (
                        <div className="flex items-center gap-1.5 text-xs text-ink/60">
                          <Briefcase className="w-3.5 h-3.5" /> {profile.profession}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-auto">
                      <button 
                        onClick={() => navigate(`/match/${profile.uid}`)}
                        className="flex-1 btn-outline py-2 text-sm font-semibold"
                      >
                        View Profile
                      </button>
                      <button 
                        onClick={() => handleConnect(profile.uid || '')}
                        disabled={connectingTo === profile.uid || state === 'pending_sent'}
                        className={`flex-1 py-2 text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
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
                         state === 'pending_sent' ? 'Request Sent' :
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
