import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Heart, MessageCircle, ShieldCheck, Check, 
  Star, Loader2, Home as HomeIcon, MoreVertical, Flag, Ban, MapPin, X,
  Moon, Sun, Utensils, Wind, Wine, Users, Sparkles, Briefcase, Dog, User, 
  CheckCircle2, Calendar, MessageSquare, ChevronRight
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useChat } from '@/hooks/useChat';
import { useConnections, getRelationshipState } from '@/hooks/useConnections';
import { useReviews } from '@/hooks/useReviews';
import type { Connection } from '@/hooks/useConnections';
import { useNotifications } from '@/hooks/useNotifications';
import { useMatches, calculateCompatibility, getActiveStatus } from '@/hooks/useMatches';
import type { MatchedUser } from '@/hooks/useMatches';
import { useGeocoding } from '@/hooks/useGeocoding';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import { quizQuestions } from '@/lib/staticData';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import StateLoading from '@/components/StateLoading';
import StateEmpty from '@/components/StateEmpty';

function LeafletResizeHandler() {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const invalidate = () => map.invalidateSize();
    invalidate();
    const timers = [setTimeout(invalidate, 50), setTimeout(invalidate, 300), setTimeout(invalidate, 600)];
    const container = map.getContainer();
    let observer: ResizeObserver | null = null;
    if (container && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => invalidate());
      observer.observe(container);
    }
    return () => {
      timers.forEach(clearTimeout);
      if (observer) observer.disconnect();
    };
  }, [map]);
  return null;
}

const CATEGORY_ICONS: Record<string, any> = {
  sleep_time: Moon,
  wake_time: Sun,
  food_pref: Utensils,
  smoking: Wind,
  drinking: Wine,
  guests: Users,
  cleanliness: Sparkles,
  work_mode: Briefcase,
  pets: Dog,
  roommate_gender: User,
};

export default function MatchDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { getProfile, toggleSavedProfile, blockUser, reportUser } = useUserProfile();
  const { getOrCreateChatRoom, subscribeToChatRooms } = useChat();
  const { sendRequest, subscribeToMyConnections, acceptRequest, rejectRequest } = useConnections();
  const { createNotification } = useNotifications();

  const [matchedUser, setMatchedUser] = useState<MatchedUser | null>(null);
  const [listing, setListing] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [myConnections, setMyConnections] = useState<Connection[]>([]);
  const [chatRoomMap, setChatRoomMap] = useState<Record<string, string>>({});

  // Report & Block State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Review State
  const { reviews, getReviewsForUser, addReview } = useReviews();
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Map state
  const { geocode } = useGeocoding();
  const [mapLoc, setMapLoc] = useState<{lat: number, lng: number} | null>(null);

  // Fetch match details
  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    
    Promise.all([
      getProfile(id).catch(() => null),
      getReviewsForUser(id).catch(() => [])
    ]).then(async ([targetProfileResult]) => {
      const targetProfile = targetProfileResult;

      if (targetProfile) {
        const score = profile?.quizAnswers
          ? calculateCompatibility(
              profile.quizAnswers, 
              targetProfile.quizAnswers || {},
              profile.city,
              targetProfile.city
            )
          : 0;
        setMatchedUser({ profile: targetProfile, compatibilityScore: score });

        if (targetProfile.role === 'owner') {
          const lq = query(collection(db, 'listings'), where('ownerId', '==', id), where('status', '==', 'active'));
          try {
            const lsnap = await getDocs(lq);
            if (!lsnap.empty) {
              const ldata = lsnap.docs[0].data();
              setListing({ id: lsnap.docs[0].id, ...ldata });
              
              if (targetProfile.geoLocation) {
                setMapLoc(targetProfile.geoLocation);
              } else if (targetProfile.city) {
                geocode(targetProfile.city, ldata.locality || targetProfile.localities?.[0]).then(loc => {
                  if (loc) setMapLoc(loc);
                });
              }
            }
          } catch (e) {
            console.error("Failed to fetch match listing", e);
          }
        } else {
          if (targetProfile.geoLocation) {
            setMapLoc(targetProfile.geoLocation);
          } else if (targetProfile.city) {
            geocode(targetProfile.city, targetProfile.localities?.[0]).then(loc => {
              if (loc) setMapLoc(loc);
            });
          }
        }
      }
      setIsLoading(false);
    });
  }, [id, profile, geocode, getProfile, getReviewsForUser]);

  // Real-time connection listener
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeToMyConnections(user.uid, setMyConnections);
    return unsub;
  }, [user?.uid, subscribeToMyConnections]);

  // Real-time chat room listener
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeToChatRooms(user.uid, (rooms) => {
      const map: Record<string, string> = {};
      rooms.forEach(r => {
        const other = r.participants.find(p => p !== user.uid);
        if (other) map[other] = r.id;
      });
      setChatRoomMap(map);
    });
    return () => unsub();
  }, [user?.uid, subscribeToChatRooms]);

  const handleBlock = async () => {
    if (!user?.uid || !id) return;
    if (!window.confirm(`Block ${matchedUser?.profile.name}? You won't see each other again.`)) return;
    try {
      await blockUser(user.uid, id);
      await refreshProfile();
      toast.success('User blocked');
      navigate('/dashboard');
    } catch {
      toast.error('Failed to block user');
    }
  };

  const handleReport = async () => {
    if (!user?.uid || !id || !reportReason) {
      toast.error('Please select a reason.');
      return;
    }
    setIsSubmittingReport(true);
    try {
      await reportUser({
        reporterId: user.uid,
        targetId: id,
        reason: reportReason,
        description: reportDescription,
      });
      toast.success('Report submitted successfully.');
      setReportModalOpen(false);
      setReportReason('');
      setReportDescription('');
    } catch {
      toast.error('Failed to submit report.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user?.uid) {
      useStore.getState().openAuthModal({
        title: 'Vouch for user',
        subtitle: 'Sign in to submit a vouch or review.',
        redirect: `/match/${id}`,
      });
      return;
    }
    if (!id || reviewRating === 0) {
      toast.error('Please select a star rating.');
      return;
    }
    if (user.uid === id) {
      toast.error('You cannot review your own profile.');
      return;
    }
    setIsSubmittingReview(true);
    try {
      await addReview(
        id,
        user.uid,
        profile?.name || 'Anonymous',
        profile?.avatar || '',
        reviewRating,
        reviewText
      );
      toast.success('Vouch submitted successfully!');
      setReviewModalOpen(false);
      setReviewRating(0);
      setReviewText('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleToggleSave = async () => {
    if (!user?.uid) {
      useStore.getState().openAuthModal({
        title: 'Save Profile',
        subtitle: 'Sign in to save candidate profiles to your shortlist.',
        redirect: `/match/${id}`,
      });
      return;
    }
    setSaving(true);
    try {
      await toggleSavedProfile(user.uid, matchedUser?.profile.uid || '', isSaved);
      await refreshProfile();
      toast.success(!isSaved ? 'Profile saved!' : 'Removed from saved');
    } catch {
      toast.error('Failed to update saved profiles');
    } finally {
      setSaving(false);
    }
  };

  const handleConnectOrChat = async () => {
    if (!user?.uid) {
      useStore.getState().openAuthModal({
        title: `Connect with ${matchedUser?.profile.name || 'Flatmate'}`,
        subtitle: 'Sign in or use 1-click demo to send a connection request.',
        redirect: `/match/${id}`,
      });
      return;
    }
    if (!matchedUser?.profile.uid) return;

    const targetUid = matchedUser.profile.uid;
    const existingConn = myConnections.find(c => c.toUserId === targetUid || c.fromUserId === targetUid);

    if (chatRoomMap[targetUid] || existingConn?.status === 'accepted') {
      setConnecting(true);
      try {
        const roomId = chatRoomMap[targetUid] || (await getOrCreateChatRoom(user.uid, targetUid));
        navigate(`/chat/${roomId}`);
      } catch (err) {
        console.error(err);
        toast.error('Failed to open chat');
      } finally {
        setConnecting(false);
      }
      return;
    }

    if (existingConn?.status === 'pending' && existingConn.toUserId === user.uid) {
      setConnecting(true);
      try {
        await acceptRequest(existingConn.id);
        const roomId = await getOrCreateChatRoom(user.uid, targetUid);
        await createNotification({
          userId: targetUid,
          type: 'connect',
          title: 'Connection Accepted!',
          description: `${profile?.name || 'A user'} accepted your connect request. Start chatting!`,
          read: false,
          actionUrl: `/chat/${roomId}`,
        });
        toast.success('Connection accepted! Opening chat...');
        navigate(`/chat/${roomId}`);
      } catch (err) {
        console.error(err);
        toast.error('Failed to accept request');
      } finally {
        setConnecting(false);
      }
      return;
    }

    if (existingConn?.status === 'pending' && existingConn.fromUserId === user.uid) return;

    setConnecting(true);
    try {
      const connectionId = await sendRequest(user.uid, targetUid);
      await createNotification({
        userId: targetUid,
        type: 'connect',
        title: 'New Connect Request!',
        description: `${profile?.name || 'Someone'} wants to connect with you.`,
        read: false,
        actionUrl: `/owner-dashboard?request=${connectionId}`,
      });
      toast.success('Connect request sent successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to send request');
    } finally {
      setConnecting(false);
    }
  };

  const handleRejectRequest = async () => {
    const targetUid = matchedUser?.profile.uid || id;
    const existingConn = myConnections.find(c => c.toUserId === targetUid || c.fromUserId === targetUid);
    if (!existingConn || existingConn.status !== 'pending' || existingConn.toUserId !== user?.uid) return;
    setConnecting(true);
    try {
      await rejectRequest(existingConn.id);
      toast.success('Request declined.');
    } catch {
      toast.error('Failed to decline request');
    } finally {
      setConnecting(false);
    }
  };

  if (isLoading) return <StateLoading label="Loading profile..." fullScreen />;

  if (!matchedUser) return (
    <div className="min-h-screen bg-parchment flex items-center justify-center px-4">
      <StateEmpty
        icon={Star}
        title="Profile not found"
        description="This user may have deactivated their account."
        action={
          <button onClick={() => navigate(-1)} className="btn-fire text-sm">Go Back</button>
        }
      />
    </div>
  );

  const p = matchedUser.profile;
  const isSaved = profile?.savedProfileIds?.includes(p.uid || '') || false;
  const activeStatus = getActiveStatus(p.lastActiveAt);

  const targetUid = p.uid || id || '';
  const connectState = getRelationshipState(user?.uid, targetUid, myConnections, chatRoomMap);

  const myAnswers = profile?.quizAnswers || {};
  const theirAnswers = p.quizAnswers || {};

  const breakdownRows = quizQuestions.map(q => {
    const myAnsId = myAnswers[q.id];
    const theirAnsId = theirAnswers[q.id];
    
    const myLabel = q.options.find(o => o.id === myAnsId)?.label || 'Not answered';
    const theirLabel = q.options.find(o => o.id === theirAnsId)?.label || 'Not specified';
    const isMatched = Boolean(myAnsId && myAnsId === theirAnsId);
    
    return { id: q.id, question: q.question, myLabel, theirLabel, isMatched };
  });

  // Dynamic Rating & Review Count
  const reviewCount = reviews.length;
  const averageRating = reviewCount > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviewCount).toFixed(1)
    : null;

  // Dynamic Budget & Move-in Date from user profile or active listing
  const displayBudget = p.budget || listing?.partnerShare || listing?.totalRent;
  const displayMoveInDate = p.moveInDate || listing?.availableFrom;

  // Check if current user has already submitted a review
  const hasUserReviewed = Boolean(user?.uid && reviews.some(r => r.reviewerId === user.uid));
  const isSelf = Boolean(user?.uid && user.uid === id);

  return (
    <div className="min-h-screen bg-parchment pb-24 md:pb-12 text-ink font-sans page-transition overflow-x-hidden">
      <div className="max-w-6xl mx-auto py-4 sm:py-6 px-4 sm:px-6 flex flex-col lg:flex-row gap-8">
        
        {/* ── Left Main Detail Column ── */}
        <div className="flex-1 space-y-8">
          
          {/* Back Navigation Bar */}
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="inline-flex items-center gap-2 text-xs font-bold text-ink/60 hover:text-ink transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to discovery</span>
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 text-ink/40 hover:text-ink rounded-full transition-colors cursor-pointer">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setReportModalOpen(true)}>Report User</DropdownMenuItem>
                <DropdownMenuItem onClick={handleBlock}>Block User</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* ── 1. Profile Hero ── */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-border/60 shadow-2xs">
            <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
              
              {/* Avatar + Primary Info */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left flex-1 min-w-0">
                <div className="relative shrink-0">
                  <img 
                    src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} 
                    alt={p.name} 
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white bg-cream object-cover shadow-md" 
                  />
                  {p.isVerified && (
                    <div className="absolute bottom-1 right-1 bg-white rounded-full p-1 shadow-2xs border border-emerald-200" title="Verified Identity">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-50" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">
                      {p.name}{p.age ? `, ${p.age}` : ''}
                    </h1>
                    {p.isVerified && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Verified Identity
                      </span>
                    )}
                  </div>

                  {p.profession && (
                    <p className="text-sm font-semibold text-ink/70">
                      {p.profession}{p.company ? ` at ${p.company}` : ''}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-ink/60 pt-1">
                    {p.city && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-fire shrink-0" />
                        <span>{p.city}{p.locality ? ` · ${p.locality}` : ''}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>{activeStatus.text || 'Active recently'}</span>
                    </span>
                  </div>

                  {p.bio && (
                    <p className="text-xs sm:text-sm text-ink/70 leading-relaxed pt-2 line-clamp-3 font-normal">
                      "{p.bio}"
                    </p>
                  )}
                </div>
              </div>

              {/* Dynamic Compatibility Box */}
              <div className="bg-cream/60 rounded-2xl p-4 sm:p-5 border border-border/50 text-center shrink-0 w-full sm:w-auto min-w-[130px] flex flex-col items-center justify-center">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-ink/40 block mb-1">
                  Compatibility
                </span>
                <span className="text-3xl font-extrabold text-fire tracking-tight">
                  {matchedUser.compatibilityScore}%
                </span>
                <span className="text-[11px] font-semibold text-ink/60 mt-0.5">
                  {matchedUser.compatibilityScore >= 80 ? 'Excellent Match' : matchedUser.compatibilityScore >= 60 ? 'Good Match' : 'Potential Match'}
                </span>
              </div>

            </div>
          </div>

          {/* ── 2. "Why You Match" Section ── */}
          <div className="bg-cream/40 rounded-2xl p-5 border border-border/50 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-fire/10 text-fire flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-ink mb-1">
                Why you and {p.name} match
              </h3>
              <p className="text-xs text-ink/70 leading-relaxed font-medium">
                You share compatible lifestyle expectations, work modes, and budget preferences{p.city ? ` in ${p.city}` : ''}.
              </p>
            </div>
          </div>

          {/* ── 3. Compatibility Breakdown Comparison ── */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <h2 className="text-lg font-bold text-ink tracking-tight">
                Compatibility Breakdown
              </h2>
              <span className="text-xs font-semibold text-ink/50">
                10 key preferences
              </span>
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block bg-white rounded-2xl border border-border/60 overflow-hidden shadow-2xs">
              <div className="grid grid-cols-[1.5fr_1fr_1.2fr_60px] gap-4 px-5 py-3 bg-cream/40 border-b border-border/40 text-[10px] font-extrabold text-ink/50 uppercase tracking-wider">
                <div>Category</div>
                <div>You</div>
                <div>{p.name}</div>
                <div className="text-center">Match</div>
              </div>

              <div className="divide-y divide-border/30 text-xs">
                {breakdownRows.map((row) => {
                  const IconComp = CATEGORY_ICONS[row.id] || Sparkles;
                  return (
                    <div key={row.id} className="grid grid-cols-[1.5fr_1fr_1.2fr_60px] gap-4 items-center px-5 py-3.5">
                      <div className="font-semibold text-ink flex items-center gap-2.5 min-w-0">
                        <IconComp className="w-4 h-4 text-ink/40 shrink-0" />
                        <span className="truncate">
                          {row.question
                            .replace('What time do you usually ', '')
                            .replace('What is your ', '')
                            .replace('How often do you ', '')
                            .replace('How important is ', '')
                            .replace('How do you feel about ', '')}
                        </span>
                      </div>
                      <div className="text-ink/60 font-medium truncate">{row.myLabel}</div>
                      <div className="font-bold text-ink truncate">{row.theirLabel}</div>
                      <div className="flex justify-center">
                        {row.isMatched ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <span className="text-ink/30 font-bold">•</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile Stacked View */}
            <div className="sm:hidden space-y-2.5">
              {breakdownRows.map((row) => {
                const IconComp = CATEGORY_ICONS[row.id] || Sparkles;
                return (
                  <div key={row.id} className="bg-white rounded-xl p-3.5 border border-border/50 shadow-2xs">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-xs text-ink flex items-center gap-2 min-w-0">
                        <IconComp className="w-4 h-4 text-ink/40 shrink-0" />
                        <span className="truncate">
                          {row.question
                            .replace('What time do you usually ', '')
                            .replace('What is your ', '')
                            .replace('How often do you ', '')
                            .replace('How important is ', '')
                            .replace('How do you feel about ', '')}
                        </span>
                      </div>
                      {row.isMatched ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />
                      ) : (
                        <span className="text-ink/30 font-bold text-xs shrink-0 ml-2">•</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-border/30">
                      <div>
                        <span className="text-ink/40 block text-[9px] uppercase font-bold tracking-wider">You</span>
                        <span className="text-ink/70 font-medium truncate block">{row.myLabel}</span>
                      </div>
                      <div>
                        <span className="text-ink/40 block text-[9px] uppercase font-bold tracking-wider">{p.name}</span>
                        <span className="text-ink font-bold truncate block">{row.theirLabel}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 4. Lifestyle & Preferences Grid ── */}
          <div className="space-y-4 pt-2">
            <div className="pb-2 border-b border-border/40">
              <h2 className="text-lg font-bold text-ink tracking-tight">
                {p.name}'s Lifestyle & Preferences
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {quizQuestions.slice(0, 10).map((q) => {
                const ansId = theirAnswers[q.id];
                const opt = q.options.find((o) => o.id === ansId);
                const IconComp = CATEGORY_ICONS[q.id] || Sparkles;

                return (
                  <div 
                    key={q.id} 
                    className="bg-white border border-border/50 rounded-xl p-3.5 flex flex-col justify-between gap-2 shadow-2xs hover:border-fire/40 transition-all min-h-[90px]"
                  >
                    <div className="flex items-center gap-2 text-ink/40">
                      <IconComp className="w-4 h-4 text-ink/60" />
                      <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                        {q.id.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-ink leading-snug line-clamp-2">
                      {opt?.label || 'Not specified'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── 5. Available Room Opportunity (If Owner) ── */}
          {listing && (
            <div className="bg-white border border-fire/30 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HomeIcon className="w-4 h-4 text-fire" />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-fire">Active Room Available</span>
                </div>
                <span className="text-xs text-ink/50 font-semibold">{listing.flatType}</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-y border-border/30">
                <div>
                  <h4 className="font-bold text-base text-ink">{listing.title || `${listing.locality}, ${listing.city}`}</h4>
                  <p className="text-xs text-ink/60 capitalize mt-0.5">{listing.furnishing || 'Semi-Furnished'} • Available {listing.availableFrom || 'Immediately'}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-[10px] font-bold text-ink/40 uppercase tracking-wider">Your Rent Share</p>
                  <p className="text-xl font-extrabold text-fire">₹{(listing.partnerShare || listing.totalRent || 0).toLocaleString()} <span className="text-xs text-ink/50 font-normal">/ mo</span></p>
                </div>
              </div>

              <button 
                onClick={() => navigate(`/room/${listing.id}`)} 
                className="w-full py-3 bg-fire text-white font-bold text-xs rounded-xl shadow-2xs hover:bg-fire-dark transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>View Full Room Details</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── 6. Location & Map ── */}
          {p.city && (
            <div className="space-y-3 pt-2">
              <div className="pb-2 border-b border-border/40">
                <h2 className="text-lg font-bold text-ink tracking-tight">Location</h2>
                <p className="text-xs text-ink/60 mt-0.5 font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-fire" /> 
                  <span>{listing?.locality || p.locality || p.localities?.[0] || p.city}, {p.city}</span>
                </p>
              </div>

              <div className="h-56 rounded-2xl overflow-hidden border border-border/60 bg-parchment relative shadow-2xs">
                {mapLoc ? (
                  <MapContainer center={[mapLoc.lat, mapLoc.lng]} zoom={13} className="w-full h-full" zoomControl={false} dragging={false} scrollWheelZoom={false}>
                    <LeafletResizeHandler />
                    <TileLayer
                      attribution='&copy; <a href="https://maps.google.com">Google Maps</a>'
                      url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                      subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
                      maxZoom={20}
                    />
                    <CircleMarker center={[mapLoc.lat, mapLoc.lng]} radius={14} pathOptions={{ color: 'white', weight: 3, fillColor: '#E05326', fillOpacity: 0.95 }} />
                  </MapContainer>
                ) : (
                  <div className="flex items-center justify-center h-full bg-cream">
                    <Loader2 className="w-6 h-6 animate-spin text-fire" />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── 7. Community Reviews & Vouches ── */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <h2 className="text-lg font-bold text-ink tracking-tight">
                Community Reviews & Vouches {reviewCount > 0 ? `(${averageRating} · ${reviewCount})` : ''}
              </h2>
              {!isSelf && (
                <button
                  onClick={() => {
                    if (hasUserReviewed) {
                      toast.info('You have already submitted a vouch for this user.');
                    } else {
                      setReviewModalOpen(true);
                    }
                  }}
                  className={`text-xs font-bold cursor-pointer ${hasUserReviewed ? 'text-ink/40' : 'text-fire hover:underline'}`}
                >
                  {hasUserReviewed ? 'Vouched ✓' : 'Write a Vouch'}
                </button>
              )}
            </div>

            {reviews.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 border border-border/60 text-center flex flex-col items-center justify-center">
                <MessageSquare className="w-8 h-8 text-ink/30 mb-2" />
                <p className="text-sm font-bold text-ink">No reviews yet</p>
                <p className="text-xs text-ink/50 mt-1 max-w-sm">Be the first person to share your experience or vouch for {p.name}'s character.</p>
                {!isSelf && (
                  <button
                    onClick={() => setReviewModalOpen(true)}
                    className="mt-4 px-5 py-2.5 bg-fire text-white font-bold text-xs rounded-xl shadow-2xs hover:bg-fire-dark transition-all cursor-pointer"
                  >
                    Write a Vouch
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div key={rev.id} className="bg-white rounded-2xl p-4 border border-border/60 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-cream border border-border flex items-center justify-center overflow-hidden font-bold text-xs text-ink/70">
                          {rev.reviewerAvatar ? (
                            <img src={rev.reviewerAvatar} alt={rev.reviewerName} className="w-full h-full object-cover" />
                          ) : (
                            rev.reviewerName?.[0]?.toUpperCase()
                          )}
                        </div>
                        <span className="font-bold text-xs text-ink">{rev.reviewerName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star
                            key={idx}
                            className={`w-3.5 h-3.5 ${idx < rev.rating ? 'fill-gold text-gold' : 'text-border'}`}
                          />
                        ))}
                      </div>
                    </div>
                    {rev.text && <p className="text-xs text-ink/80 leading-relaxed font-medium">{rev.text}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ── Right Sidebar: At a Glance Summary ── */}
        <div className="hidden lg:block w-[320px] shrink-0">
          <div className="sticky top-24 space-y-6">
            
            <div className="bg-white rounded-3xl p-6 border border-border/60 shadow-2xs space-y-5">
              <div className="pb-3 border-b border-border/40 flex items-center justify-between">
                <h3 className="font-bold text-lg text-ink">At a Glance</h3>
                {p.isVerified ? (
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Verified
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40 bg-cream px-2 py-0.5 rounded-full border border-border/40">
                    Unverified
                  </span>
                )}
              </div>
              
              <div className="space-y-4 text-xs">
                {/* Community Rating */}
                <div className="flex justify-between items-center">
                  <span className="text-ink/60 font-medium">Community Rating</span>
                  {averageRating ? (
                    <div className="flex items-center gap-1.5 font-extrabold text-ink">
                      <Star className="w-4 h-4 fill-gold text-gold" />
                      <span>{averageRating}</span>
                      <span className="text-ink/40 font-normal">({reviewCount})</span>
                    </div>
                  ) : (
                    <span className="text-ink/40 font-medium italic">No reviews yet</span>
                  )}
                </div>

                {/* Compatibility Score */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-ink/60 font-medium">Compatibility</span>
                    <span className="font-extrabold text-fire">{matchedUser.compatibilityScore}%</span>
                  </div>
                  <div className="w-full bg-cream h-2 rounded-full overflow-hidden border border-border/40">
                    <div 
                      className="bg-fire h-full rounded-full transition-all duration-500" 
                      style={{ width: `${matchedUser.compatibilityScore}%` }} 
                    />
                  </div>
                </div>
                
                {/* Budget */}
                <div className="flex justify-between items-center">
                  <span className="text-ink/60 font-medium">Budget Alignment</span>
                  <span className="font-extrabold text-ink text-sm">
                    {displayBudget ? `₹${displayBudget.toLocaleString()}/mo` : 'Not specified'}
                  </span>
                </div>

                {/* Move-in Date */}
                <div className="flex justify-between items-center">
                  <span className="text-ink/60 font-medium">Move-in Date</span>
                  <span className="font-bold text-ink flex items-center gap-1">
                    {displayMoveInDate ? (
                      <>
                        <Calendar className="w-3.5 h-3.5 text-fire" /> {displayMoveInDate}
                      </>
                    ) : (
                      'Not specified'
                    )}
                  </span>
                </div>
              </div>

              {/* Main Action CTAs */}
              <div className="pt-2 space-y-2.5">
                <button
                  onClick={handleConnectOrChat}
                  disabled={connecting || connectState === 'pending_sent'}
                  className={`w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer ${
                    connectState === 'pending_sent' ? 'bg-ink/10 text-ink/40 cursor-not-allowed' :
                    connectState === 'pending_received' ? 'bg-teal text-white hover:opacity-90' :
                    connectState === 'connected' ? 'bg-emerald-600 text-white hover:bg-emerald-700' :
                    'btn-fire text-white'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>
                    {connectState === 'pending_sent' ? 'Request Sent' :
                     connectState === 'pending_received' ? 'Accept Request' :
                     connectState === 'connected' ? 'Message User' : 'Connect & Chat'}
                  </span>
                </button>

                {connectState === 'pending_received' && (
                  <button
                    onClick={handleRejectRequest}
                    disabled={connecting}
                    className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border border-red-200 text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" /> Decline Request
                  </button>
                )}
                
                <button
                  onClick={handleToggleSave}
                  disabled={saving}
                  className="w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all border border-border text-ink/80 bg-white hover:bg-cream shadow-2xs cursor-pointer"
                >
                  <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-fire text-fire' : 'text-ink/40'}`} />
                  <span>{isSaved ? 'Saved in Shortlist' : 'Save Profile'}</span>
                </button>
              </div>

              <div className="pt-3 border-t border-border/40 flex justify-around text-xs text-ink/40 font-medium">
                <button onClick={() => setReportModalOpen(true)} className="hover:text-amber-600 flex items-center gap-1 cursor-pointer">
                  <Flag className="w-3.5 h-3.5" /> Report
                </button>
                <button onClick={handleBlock} className="hover:text-red-600 flex items-center gap-1 cursor-pointer">
                  <Ban className="w-3.5 h-3.5" /> Block
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Mobile Floating Bottom Action Bar */}
      <div className="fixed bottom-above-nav md:bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-border z-40 lg:hidden flex gap-2">
        <button
          onClick={handleToggleSave}
          aria-label={isSaved ? 'Remove from saved' : 'Save profile'}
          className={`p-3 rounded-xl border flex items-center justify-center shrink-0 min-h-[44px] ${isSaved ? 'bg-fire/10 border-fire/30 text-fire' : 'border-border text-ink/70'}`}
        >
          <Heart className={`w-5 h-5 ${isSaved ? 'fill-fire text-fire' : ''}`} />
        </button>
        <button
          onClick={handleConnectOrChat}
          disabled={connecting || connectState === 'pending_sent'}
          className={`flex-1 min-h-[44px] py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition-all ${
            connectState === 'pending_sent' ? 'bg-ink/10 text-ink/40 cursor-not-allowed' :
            connectState === 'pending_received' ? 'bg-teal text-white' :
            'btn-fire text-white'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>
            {connectState === 'pending_sent' ? 'Request Sent' :
             connectState === 'pending_received' ? 'Accept Request' :
             connectState === 'connected' ? 'Message' : 'Connect & Chat'}
          </span>
        </button>
      </div>

      {/* Report Modal */}
      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report User</DialogTitle>
            <DialogDescription>
              Help us keep NestMate safe. Please provide a reason for reporting {p.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-ink/50 block mb-1.5">Reason</label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fake_profile">Fake Profile / Identity</SelectItem>
                  <SelectItem value="inappropriate_behavior">Inappropriate Behavior</SelectItem>
                  <SelectItem value="spam_or_scam">Spam or Financial Scam</SelectItem>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-ink/50 block mb-1.5">Additional Details</label>
              <Textarea
                placeholder="Describe what happened..."
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportModalOpen(false)}>Cancel</Button>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white font-bold" onClick={handleReport} disabled={isSubmittingReport}>
              {isSubmittingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Leave Review Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Vouch for {p.name}</DialogTitle>
            <DialogDescription>
              Share your experience or vouch for {p.name}'s reliability and character.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-ink/50 block mb-2 text-center">Rating</label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1.5 focus:outline-none hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= reviewRating ? 'fill-gold text-gold' : 'text-border'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-ink/50 block mb-1.5">Your Vouch / Review</label>
              <Textarea
                placeholder="Write a few words about your experience..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewModalOpen(false)}>Cancel</Button>
            <Button className="btn-fire text-white font-bold" onClick={handleSubmitReview} disabled={isSubmittingReview}>
              {isSubmittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Vouch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
