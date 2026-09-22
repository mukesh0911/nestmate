import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import type { UserProfile } from '@/hooks/useAuth';
import { calculateProfileCompatibility } from '@/hooks/useMatches';
import { useChat } from '@/hooks/useChat';
import { useConnections, getRelationshipState } from '@/hooks/useConnections';
import type { Connection } from '@/hooks/useConnections';
import {
  MapPin, Loader2, MessageSquare, Users, Phone, Star, Sparkles
} from 'lucide-react';
import StateEmpty from '@/components/StateEmpty';
import StateLoading from '@/components/StateLoading';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';
import { isPubliclyVisibleProfile } from '@/lib/marketplaceVisibility';
import { areSameCityAlias } from '@/lib/cityNormalization';
import { filterFlatmateProfiles } from '@/lib/roleFiltering';
import FlatmateAvatar from '@/components/FlatmateAvatar';
import ContactModal from '@/components/ContactModal';

interface SeekerWithScore {
  profile: UserProfile;
  score: number;
  distanceKm?: number;
}

interface BrowseSeekersProps {
  embedded?: boolean;
  city?: string;
  searchQuery?: string;
  onOpenFilters?: () => void;
}

export default function BrowseSeekers({
  embedded = false,
  city: propCity,
  searchQuery: propSearchQuery = '',
  onOpenFilters,
}: BrowseSeekersProps) {
  const navigate = useNavigate();
  const { user, profile: currentUser } = useAuth();
  const { getOrCreateChatRoom, subscribeToChatRooms } = useChat();
  const { sendRequest, acceptRequest, subscribeToMyConnections } = useConnections();
  const openAuthModal = useStore(state => state.openAuthModal);

  const [seekers, setSeekers] = useState<SeekerWithScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [connectingTo, setConnectingTo] = useState<string | null>(null);
  const [myConnections, setMyConnections] = useState<Connection[]>([]);
  const [chatRoomMap, setChatRoomMap] = useState<Record<string, string>>({});
  const [contactProfile, setContactProfile] = useState<UserProfile | null>(null);

  const activeCity = propCity !== undefined ? propCity : (currentUser?.city || useStore.getState().filters.city || '');

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
      setFetchError(false);
      try {
        const profileMap = new Map<string, UserProfile>();

        try {
          const snap = await getDocs(collection(db, 'users'));
          snap.docs.forEach(d => {
            const data = { uid: d.id, ...d.data() } as UserProfile;
            // Exclude current user and blocked users
            if (data.uid && data.uid === user?.uid) return;
            if (currentUser?.blockedUserIds?.includes(data.uid)) return;

            // Allow valid profile
            if (isPubliclyVisibleProfile(data)) {
              profileMap.set(data.uid, data);
            }
          });
        } catch (err) {
          console.warn('Firestore users query warning:', err);
        }



        // Pre-fetch active listings for owner flatmates
        const listingByOwnerId = new Map<string, any>();
        try {
          const lsnap = await getDocs(query(collection(db, 'listings'), where('status', '==', 'active')));
          lsnap.docs.forEach(d => {
            const data = { id: d.id, ...d.data() };
            if (data.ownerId && !listingByOwnerId.has(data.ownerId)) {
              listingByOwnerId.set(data.ownerId, data);
            }
          });
        } catch (e) {
          console.warn('Error fetching listings for flatmate discovery:', e);
        }

        const fetched = filterFlatmateProfiles(Array.from(profileMap.values()), user?.uid, currentUser?.role);

        // Match against active city strictly (real users only in chosen city)
        const targetCity = activeCity.trim().toLowerCase();
        const isAllCities = !targetCity || targetCity === 'all';
        const cityMatches = isAllCities
          ? fetched
          : fetched.filter(r => {
              const profileCity = (r.city || '').trim().toLowerCase();
              return Boolean(profileCity && (profileCity === targetCity || areSameCityAlias(profileCity, targetCity)));
            });

        const effectivePool = cityMatches;

        // Apply search query
        const q = propSearchQuery.trim().toLowerCase();
        const filtered = q
          ? effectivePool.filter(r =>
              (r.locality && r.locality.toLowerCase().includes(q)) ||
              (r.name && r.name.toLowerCase().includes(q)) ||
              (r.profession && r.profession.toLowerCase().includes(q)) ||
              (r.city && r.city.toLowerCase().includes(q)) ||
              (r.bio && r.bio.toLowerCase().includes(q))
            )
          : effectivePool;

        let ownerListing: any = null;
        if (currentUser?.role === 'owner' && user?.uid) {
          try {
            const lq = query(collection(db, 'listings'), where('ownerId', '==', user.uid), limit(1));
            const lsnap = await getDocs(lq);
            if (!lsnap.empty) {
              ownerListing = { id: lsnap.docs[0].id, ...lsnap.docs[0].data() };
            }
          } catch (e) {
            console.warn('Error fetching owner listing for scoring', e);
          }
        }

        const scored = filtered.map(u => {
          const uListing = listingByOwnerId.get(u.uid);
          const effectiveProfile = { ...u };
          if (uListing) {
            effectiveProfile.budget = effectiveProfile.budget || uListing.partnerShare || uListing.totalRent || effectiveProfile.budget;
            (effectiveProfile as any)._listing = uListing;
          }
          const targetListing = ownerListing || uListing;
          const calculatedScore = currentUser
            ? calculateProfileCompatibility(currentUser, effectiveProfile, targetListing).score
            : 0;

          // If score is 0 and profile has defaultScore, use defaultScore (like 60% or 48% in reference)
          const finalScore = calculatedScore > 0 ? calculatedScore : ((u as any).defaultScore || 60);
          const distanceKm = (u as any).distanceKm !== undefined ? (u as any).distanceKm : 0;

          return {
            profile: effectiveProfile,
            score: finalScore,
            distanceKm
          };
        });

        // Sort by verified first, then score
        scored.sort((a, b) => {
          const aVer = a.profile.isVerified ? 1 : 0;
          const bVer = b.profile.isVerified ? 1 : 0;
          if (bVer !== aVer) return bVer - aVer;
          return b.score - a.score;
        });

        setSeekers(scored);
      } catch (err) {
        console.error('Failed to fetch flatmates', err);
        setFetchError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchFlatmates();
  }, [currentUser?.uid, activeCity, currentUser?.role, currentUser?.blockedUserIds, currentUser?.quizAnswers, propSearchQuery, user?.uid]);

  const handleConnect = async (seekerId: string) => {
    if (!user?.uid) {
      openAuthModal({
        title: 'Sign in to Connect',
        subtitle: 'Create an account to send connect requests and chat with flatmates.',
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
      toast.error("Failed to send request. Try again.");
    } finally {
      setConnectingTo(null);
    }
  };

  const handleCall = (profile: UserProfile) => {
    if (!user?.uid) {
      openAuthModal({
        title: 'Sign in to Contact',
        subtitle: 'Sign in to view verified contact numbers and reach out to flatmates.',
        redirect: `/match/${profile.uid}`,
      });
      return;
    }
    setContactProfile(profile);
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <StateLoading label="Finding compatible flatmates..." />
      </div>
    );
  }

  if (fetchError) {
    return (
      <StateEmpty
        icon={Users}
        title="Unable to load flatmates"
        description="We couldn't load flatmate profiles right now. Please check your connection and try again."
        className="bg-white rounded-3xl border border-gray-100 py-12 shadow-xs"
      />
    );
  }

  if (seekers.length === 0) {
    return (
      <StateEmpty
        icon={Users}
        title={propSearchQuery ? `No flatmates match "${propSearchQuery}" in ${activeCity}` : `No flatmates looking in ${activeCity} yet`}
        description={
          propSearchQuery
            ? "Try broadening your search or exploring nearby localities."
            : `Be the first to find a flatmate in ${activeCity}! Create your roommate profile to get discovered.`
        }
        action={
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                if (!user) {
                  openAuthModal({ title: 'Join NestMate', redirect: '/profile' });
                } else {
                  navigate('/profile');
                }
              }}
              className="px-6 py-2.5 bg-[#E5501A] hover:bg-[#D0400B] text-white font-bold text-xs rounded-full shadow-xs cursor-pointer transition-colors"
            >
              Create Roommate Profile
            </button>
            {activeCity && (
              <button
                onClick={() => {
                  useStore.getState().updateFilters({ city: '' });
                }}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#1A1A2E] font-semibold text-xs rounded-full cursor-pointer transition-colors"
              >
                Browse All Cities
              </button>
            )}
          </div>
        }
        className="bg-white rounded-3xl border border-gray-100 py-14 shadow-xs max-w-xl mx-auto"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
      {/* RESPONSIVE FEED: 1 COL ON MOBILE, 2 COLS ON DESKTOP WITH SIDEBAR */}
      {seekers.map(({ profile, score, distanceKm }) => {
        const state = getRelationshipState(user?.uid, profile.uid || '', myConnections, chatRoomMap);
        const localityText = profile.locality
          ? (profile.city ? `${profile.locality}, ${profile.city}` : profile.locality)
          : (profile.city ? `${profile.city}, India` : `${activeCity}, India`);

        const budgetText = profile.budget && profile.budget > 0
          ? `₹ ${profile.budget.toLocaleString('en-IN')}`
          : '₹ 5,000';

        const lookingGender = profile.preferredGender
          ? profile.preferredGender
          : profile.gender
            ? profile.gender === 'female' ? 'Female' : profile.gender === 'male' ? 'Male' : 'Any'
            : 'Any';

        const distanceDisplay = distanceKm !== undefined
          ? `${distanceKm} km`
          : '0 km';

        return (
          <div
            key={profile.uid}
            onClick={() => navigate(`/match/${profile.uid}`)}
            className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200/80 shadow-2xs hover:shadow-md transition-all duration-200 p-3.5 sm:p-4 flex flex-col justify-between cursor-pointer group"
          >
            {/* Upper Section: Avatar on Left, Details on Right */}
            <div className="flex items-start gap-3 sm:gap-4">
              {/* Left Avatar Container */}
              <FlatmateAvatar
                avatar={profile.avatar}
                name={profile.name}
                gender={profile.gender}
                isVerified={profile.isVerified}
                illustrationType={(profile as any).illustrationType}
                className="group-hover:opacity-95 transition-opacity"
              />

              {/* Right Details Column */}
              <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
                <div>
                  {/* Name */}
                  <h3 className="font-bold text-base sm:text-lg text-[#1A1A2E] group-hover:text-[#E5501A] transition-colors truncate">
                    {profile.name || 'Flatmate'}
                  </h3>

                  {/* Location with Pin */}
                  <div className="flex items-center gap-1 text-xs text-gray-500 font-medium mt-0.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="truncate">{localityText}</span>
                  </div>

                  {/* Rent */}
                  <div className="mt-1.5 flex items-baseline gap-1">
                    <span className="text-base sm:text-lg font-extrabold text-[#1A1A2E]">
                      {budgetText}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">Rent</span>
                  </div>
                </div>

                {/* 2-Column Info Grid: Looking for Any | Looking for Roommate */}
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-100">
                  <div>
                    <span className="text-[10px] text-gray-400 font-medium block">
                      Looking for
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-[#1A1A2E] capitalize truncate block">
                      {lookingGender}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-medium block">
                      Looking for
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-[#1A1A2E] truncate block">
                      Roommate
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Dashed Divider + Search Distance + Match + Two Circular Action Buttons */}
            <div className="border-t border-dashed border-gray-200 mt-3 pt-2.5 flex items-center justify-between gap-2">
              {/* Distance from search */}
              <div className="text-xs text-gray-500 font-medium truncate">
                <span>{distanceDisplay} <span className="text-gray-400">from your search</span></span>
              </div>

              {/* Match Score & Action Buttons */}
              <div className="flex items-center gap-3 shrink-0">
                {/* Match Score */}
                <div className="flex items-center gap-1 text-xs font-semibold text-gray-600">
                  <Star className="w-3.5 h-3.5 text-gray-400 fill-gray-200" />
                  <span>{score}% Match</span>
                </div>

                {/* Two Circular Buttons: [ 📞 ] and [ 💬 ] */}
                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                  {/* Call Button */}
                  <button
                    type="button"
                    onClick={() => handleCall(profile)}
                    className="w-8 h-8 rounded-full bg-[#F3F4F6] border border-gray-200/90 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer shadow-2xs active:scale-95"
                    title="Call"
                    aria-label={`Call ${profile.name}`}
                  >
                    <Phone className="w-4 h-4 text-gray-500" />
                  </button>

                  {/* Chat Button */}
                  <button
                    type="button"
                    onClick={() => handleConnect(profile.uid || '')}
                    disabled={connectingTo === profile.uid}
                    className="w-8 h-8 rounded-full bg-[#F3F4F6] border border-gray-200/90 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer shadow-2xs active:scale-95"
                    title="Chat"
                    aria-label={`Chat with ${profile.name}`}
                  >
                    {connectingTo === profile.uid ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />
                    ) : (
                      <MessageSquare className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Call / Contact Modal */}
      <ContactModal
        isOpen={Boolean(contactProfile)}
        onClose={() => setContactProfile(null)}
        profile={contactProfile}
      />
    </div>
  );
}
