import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Heart, MessageCircle, ShieldCheck, Check, AlertCircle, 
  Star, Loader2, Home as HomeIcon, MoreVertical, Flag, Ban, MapPin, 
  Moon, Sun, Utensils, Wind, Wine, Users, Sparkles, Briefcase, Dog, User, 
  CheckCircle2, Linkedin, Instagram, Calendar, Shield, ExternalLink,
  MessageSquare, CheckCircle, HelpCircle, UserCheck
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useChat } from '@/hooks/useChat';
import { useConnections } from '@/hooks/useConnections';
import { useReviews } from '@/hooks/useReviews';
import type { Connection } from '@/hooks/useConnections';
import { useNotifications } from '@/hooks/useNotifications';
import { useMatches, calculateCompatibility, getActiveStatus } from '@/hooks/useMatches';
import type { MatchedUser } from '@/hooks/useMatches';
import { useGeocoding } from '@/hooks/useGeocoding';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
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
  const { getOrCreateChatRoom } = useChat();
  const { sendRequest, getMyConnections, subscribeToMyConnections, acceptRequest, rejectRequest } = useConnections();
  const { createNotification } = useNotifications();

  const [matchedUser, setMatchedUser] = useState<MatchedUser | null>(null);
  const [listing, setListing] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Connections and Chat Map
  const [myConnections, setMyConnections] = useState<Connection[]>([]);

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
          ? calculateCompatibility(profile.quizAnswers, targetProfile.quizAnswers || {})
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
              } else {
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
          } else {
            geocode(targetProfile.city, targetProfile.localities?.[0]).then(loc => {
              if (loc) setMapLoc(loc);
            });
          }
        }
      }
      setIsLoading(false);
    });
  }, [id, profile, geocode]);

  // Real-time connection listener — updates button state instantly
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeToMyConnections(user.uid, setMyConnections);
    return unsub;
  }, [user?.uid]);

  const handleBlock = async () => {
    if (!user?.uid || !id) return;
    if (!window.confirm(`Block ${matchedUser?.profile.name}? You won't see each other again.`)) return;
    try {
      await blockUser(user.uid, id);
      await refreshProfile();
      toast.success('User blocked');
      navigate('/seeker-dashboard');
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
    if (!user?.uid || !id || reviewRating === 0) {
      toast.error('Please provide a rating.');
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
      toast.success('Review submitted successfully!');
      setReviewModalOpen(false);
      setReviewRating(0);
      setReviewText('');
    } catch {
      toast.error('Failed to submit review.');
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

    const existingConn = myConnections.find(c => c.toUserId === id || c.fromUserId === id);

    // Already connected — open chat
    if (existingConn?.status === 'accepted') {
      setConnecting(true);
      try {
        const roomId = await getOrCreateChatRoom(user.uid, matchedUser.profile.uid);
        navigate(`/chat/${roomId}`);
      } catch (err) {
        console.error(err);
        toast.error('Failed to open chat');
      } finally {
        setConnecting(false);
      }
      return;
    }

    // They sent me a request — accept it
    if (existingConn?.status === 'pending' && existingConn.toUserId === user.uid) {
      setConnecting(true);
      try {
        await acceptRequest(existingConn.id);
        const roomId = await getOrCreateChatRoom(user.uid, matchedUser.profile.uid);
        await createNotification({
          userId: matchedUser.profile.uid,
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

    // I already sent a request — disabled state, nothing to do
    if (existingConn?.status === 'pending' && existingConn.fromUserId === user.uid) return;

    // No connection — send a new request
    setConnecting(true);
    try {
      const connectionId = await sendRequest(user.uid, matchedUser.profile.uid || '');
      await createNotification({
        userId: matchedUser.profile.uid || '',
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
    const existingConn = myConnections.find(c => c.toUserId === id || c.fromUserId === id);
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

  // Connection state logic (4-state machine)
  const connection = myConnections.find(c => c.toUserId === id || c.fromUserId === id);
  let connectState: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'chat' = 'none';
  if (connection) {
    if (connection.status === 'accepted') connectState = 'chat';
    else if (connection.status === 'pending') {
      connectState = connection.fromUserId === user?.uid ? 'pending_sent' : 'pending_received';
    }
  }

  // Build Quiz Data
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

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : '4.8';

  return (
    <div className="min-h-screen bg-parchment pb-above-nav md:pb-12 lg:pb-12 text-ink font-sans page-transition overflow-x-hidden">
      {/* ── Desktop Two-Column Wrapper ── */}
      <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 flex flex-col lg:flex-row gap-7">
        
        {/* ── Left Column: Main Profile Details ── */}
        <div className="flex-1 space-y-6">
          
          {/* Warm Harmonized Hero Header Card */}
          <div className="bg-gradient-to-r from-orange-100/70 via-cream to-orange-100/80 rounded-[28px] p-6 border border-orange-200/70 shadow-2xs relative flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 overflow-hidden">
            
            {/* Left Content */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 flex-1 z-10">
              {/* Back Button */}
              <button 
                onClick={() => navigate(-1)}
                aria-label="Go back"
                className="touch-target w-11 h-11 rounded-full bg-white border border-orange-200 flex items-center justify-center text-fire shadow-2xs hover:bg-orange-50 transition-all flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <img 
                  src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} 
                  alt={p.name} 
                  className="w-28 h-28 rounded-full border-4 border-white object-cover shadow-md" 
                />
              </div>

              {/* Text Info */}
              <div className="text-center sm:text-left flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                  <h1 className="text-2xl font-serif font-bold text-ink">
                    {p.name}{p.age ? `, ${p.age}` : ''}
                  </h1>
                  <span className="bg-fire/10 text-fire font-bold text-[11px] px-3 py-1 rounded-full inline-flex items-center gap-1 border border-fire/20 shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-fire" /> Verified Identity
                  </span>
                </div>
                
                <p className="text-sm font-semibold text-ink/70 mb-1">{p.profession || 'Software Engineer'}</p>
                <p className="text-xs text-ink/50 font-medium flex items-center justify-center sm:justify-start gap-1 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-fire" /> {p.city || 'Bengaluru'}
                </p>
                
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-semibold text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{activeStatus.text || 'Active a while ago'}</span>
                </div>
              </div>
            </div>

            {/* Circular Compatibility Gauge (Right Side of Hero Card) */}
            <div className="flex flex-col items-center justify-center z-10 flex-shrink-0 sm:self-center">
              <div className="w-28 h-28 rounded-full border-4 border-fire bg-white/90 backdrop-blur-md flex flex-col items-center justify-center shadow-lg relative">
                <span className="text-3xl font-extrabold text-fire tracking-tight">{matchedUser.compatibilityScore}%</span>
                <span className="text-[9px] font-extrabold text-ink/40 uppercase tracking-wider mt-0.5">COMPATIBLE</span>
              </div>
            </div>
          </div>

          {/* "Why you and Rohan Deshmukh are compatible" Card */}
          <div className="bg-gradient-to-r from-orange-100/80 via-amber-50/60 to-orange-100/80 rounded-2xl p-5 border border-orange-200/70 shadow-2xs relative flex items-center gap-4 overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-fire/15 text-fire flex items-center justify-center flex-shrink-0 shadow-2xs">
              <Users className="w-6 h-6" />
            </div>
            <div className="flex-1 z-10">
              <h3 className="font-bold text-ink text-sm sm:text-base mb-0.5">
                Why you and {p.name} are compatible
              </h3>
              <p className="text-xs text-ink/60 font-medium">
                You have different preferences, but opposites attract!
              </p>
            </div>
            {/* Background Decorative Heart Accent */}
            <Heart className="w-32 h-32 absolute -right-6 -bottom-8 text-fire/10 fill-current pointer-events-none" />
          </div>

          {/* Detailed Compatibility Breakdown Table */}
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-border/80 shadow-2xs">
            <h3 className="font-bold text-base text-ink mb-6 flex items-center gap-2">
              <Star className="w-4.5 h-4.5 text-gold fill-gold" />
              Detailed Compatibility Breakdown
            </h3>

            {/* Desktop: 4-column grid table */}
            <div className="hidden sm:block">
              {/* Table Header */}
              <div className="grid grid-cols-[1.5fr_1fr_1.2fr_auto] gap-4 text-[10px] font-extrabold text-ink/40 uppercase tracking-wider pb-3 border-b border-border">
                <div>CATEGORY</div>
                <div>YOUR PREFERENCE</div>
                <div>THEIR LIFESTYLE</div>
                <div className="text-center w-12">MATCH</div>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-border/40">
                {breakdownRows.map((row) => {
                  const IconComp = CATEGORY_ICONS[row.id] || Sparkles;
                  return (
                    <div key={row.id} className="grid grid-cols-[1.5fr_1fr_1.2fr_auto] gap-4 items-center py-3 text-xs">
                      <div className="font-semibold text-ink/80 flex items-center gap-2.5">
                        <IconComp className="w-4 h-4 text-fire/80 flex-shrink-0" />
                        <span className="truncate">
                          {row.question
                            .replace('What time do you usually ', '')
                            .replace('What is your ', '')
                            .replace('How often do you ', '')
                            .replace('How important is ', '')
                            .replace('How do you feel about ', '')}
                        </span>
                      </div>
                      <div className="text-ink/40 font-medium truncate">{row.myLabel}</div>
                      <div className="font-bold text-ink truncate">{row.theirLabel}</div>
                      <div className="flex justify-center w-12">
                        <div className="w-5 h-5 rounded-full border-2 border-emerald-500 text-emerald-500 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile: stacked card layout — no horizontal scroll */}
            <div className="sm:hidden space-y-2">
              {breakdownRows.map((row) => {
                const IconComp = CATEGORY_ICONS[row.id] || Sparkles;
                return (
                  <div key={row.id} className="bg-cream/30 rounded-xl p-3 border border-border/40">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-semibold text-xs text-ink/80 flex items-center gap-2 min-w-0">
                        <IconComp className="w-4 h-4 text-fire/80 flex-shrink-0" />
                        <span className="truncate">
                          {row.question
                            .replace('What time do you usually ', '')
                            .replace('What is your ', '')
                            .replace('How often do you ', '')
                            .replace('How important is ', '')
                            .replace('How do you feel about ', '')}
                        </span>
                      </div>
                      <div className="w-5 h-5 rounded-full border-2 border-emerald-500 text-emerald-500 flex items-center justify-center flex-shrink-0 ml-2">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-[11px]">
                      <div className="flex-1 min-w-0">
                        <span className="text-ink/40 block text-[9px] uppercase font-bold tracking-wide">You</span>
                        <span className="text-ink/60 font-medium truncate block">{row.myLabel}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-ink/40 block text-[9px] uppercase font-bold tracking-wide">Them</span>
                        <span className="text-ink font-bold truncate block">{row.theirLabel}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lifestyle Setup Cards Grid */}
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-border/80 shadow-2xs">
            <h3 className="font-bold text-base text-ink mb-5">
              {p.name}'s Lifestyle Setup
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3.5">
              {quizQuestions.slice(0, 10).map((q) => {
                const ansId = theirAnswers[q.id];
                const opt = q.options.find((o) => o.id === ansId);
                const IconComp = CATEGORY_ICONS[q.id] || Sparkles;

                return (
                  <div 
                    key={q.id} 
                    className="bg-white border border-border/80 rounded-2xl p-4 text-center flex flex-col items-center justify-between gap-2.5 shadow-2xs hover:border-fire/40 transition-all min-h-[110px]"
                  >
                    <div className="w-10 h-10 rounded-full bg-fire/10 text-fire flex items-center justify-center flex-shrink-0">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div className="w-full">
                      <p className="text-[9px] font-extrabold text-ink/40 uppercase tracking-wider mb-0.5 truncate">
                        {q.id.replace('_', ' ')}
                      </p>
                      <p className="text-xs font-extrabold text-ink leading-snug line-clamp-2">
                        {opt?.label || 'Not specified'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Room Available Section (If Owner) */}
          {listing && (
            <div className="bg-white border-2 border-fire/30 rounded-3xl p-4 sm:p-6 shadow-sm">
              <div className="flex items-center gap-2.5 mb-4 text-fire">
                <HomeIcon className="w-5 h-5" />
                <h3 className="font-bold text-base">Active Room Listing Available</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-ink/40 font-bold uppercase">Flat Type</p>
                  <p className="text-base font-bold text-ink">{listing.flatType} • {listing.furnishing}</p>
                </div>
                <div>
                  <p className="text-xs text-ink/40 font-bold uppercase">Rent Share</p>
                  <p className="text-xl font-extrabold text-fire">₹{(listing.partnerShare || listing.totalRent || 0).toLocaleString()}/mo</p>
                </div>
              </div>
              <button onClick={() => navigate(`/room/${listing.id}`)} className="btn-fire w-full py-3 text-white font-bold text-xs rounded-xl shadow-sm">
                View Full Flat Details
              </button>
            </div>
          )}

          {/* Approximate Location Card */}
          {p.city && (
            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-border/80 shadow-2xs">
              <h3 className="font-bold text-base text-ink mb-1">Approximate Location</h3>
              <p className="text-xs text-ink/50 font-medium mb-4 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-fire" /> 
                {listing?.locality || p.localities?.[0] || 'Indiranagar'}, {p.city || 'Bengaluru'}
              </p>

              <div className="h-60 rounded-2xl overflow-hidden border border-border bg-parchment relative">
                {mapLoc ? (
                  <MapContainer center={[mapLoc.lat, mapLoc.lng]} zoom={13} className="w-full h-full" zoomControl={false} dragging={false} scrollWheelZoom={false}>
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

          {/* Vouches & Reviews Card */}
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-border/80 shadow-2xs text-center">
            <h3 className="font-bold text-base text-ink mb-6 text-left flex items-center gap-2">
              <Star className="w-4.5 h-4.5 text-gold fill-gold" />
              Vouches & Reviews
            </h3>

            <div className="py-6 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-fire/10 text-fire flex items-center justify-center mb-3 shadow-2xs">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-ink mb-1">No reviews yet</p>
              <p className="text-xs text-ink/50 font-medium mb-5">Be the first to vouch for {p.name}!</p>
              
              <button
                onClick={() => setReviewModalOpen(true)}
                className="btn-fire text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md"
              >
                Be the first to review
              </button>
            </div>
          </div>

        </div>

        {/* ── Right Column: Sticky Sidebar ── */}
        <div className="hidden lg:block w-[330px] flex-shrink-0">
          <div className="sticky top-24 space-y-6">
            
            {/* Card 1: "At a Glance" */}
            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-border/80 shadow-sm relative">
              <div className="flex items-center justify-between mb-6 pb-2 border-b border-border">
                <h3 className="font-serif font-bold text-xl text-ink">At a Glance</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-ink/40 hover:text-ink">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setReportModalOpen(true)}>Report User</DropdownMenuItem>
                    <DropdownMenuItem onClick={handleBlock}>Block User</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="space-y-5">
                {/* Community Rating */}
                <div>
                  <p className="text-xs text-ink/40 font-medium mb-1">Community Rating</p>
                  <div className="flex items-center gap-2">
                    <Star className="w-4.5 h-4.5 fill-gold text-gold" />
                    <span className="font-extrabold text-base text-ink">{averageRating}</span>
                    <span className="text-xs text-ink/40">({reviews.length || 32} reviews)</span>
                  </div>
                </div>

                {/* Overall Compatibility Progress Bar */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-ink/40 font-medium">Overall Compatibility</span>
                    <span className="font-extrabold text-fire">{matchedUser.compatibilityScore}%</span>
                  </div>
                  <div className="w-full bg-cream h-2 rounded-full overflow-hidden border border-border/40">
                    <div 
                      className="bg-gradient-to-r from-amber-500 to-fire h-full rounded-full transition-all duration-500" 
                      style={{ width: `${matchedUser.compatibilityScore}%` }} 
                    />
                  </div>
                </div>
                
                {/* Budget Alignment */}
                <div>
                  <p className="text-xs text-ink/40 font-medium mb-1">Budget Alignment</p>
                  <p className="text-xl font-extrabold text-fire">
                    ₹{p.budget?.toLocaleString() || '15,000'}/mo
                  </p>
                </div>

                {/* Move-in Preference */}
                <div>
                  <p className="text-xs text-ink/40 font-medium mb-1">Move-in Preference</p>
                  <p className="text-xs font-bold text-ink flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-fire" /> {p.moveInDate || '10 Aug 2026'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 space-y-3">
                {/* Connect & Chat - Fire Button */}
                <button
                  onClick={handleConnectOrChat}
                  disabled={connecting || connectState === 'pending_sent'}
                  className={`w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
                    connectState === 'pending_sent' ? 'bg-ink/10 text-ink/40 cursor-not-allowed' :
                    connectState === 'pending_received' ? 'bg-teal text-white hover:opacity-90' :
                    'btn-fire text-white'
                  }`}
                >
                  <MessageCircle className="w-4.5 h-4.5" />
                  {connectState === 'pending_sent' ? 'Request Sent' :
                   connectState === 'pending_received' ? 'Accept Request' :
                   connectState === 'chat' ? 'Chat Now' : 'Connect & Chat'}
                </button>

                {/* Reject button — shown only when they sent us a request */}
                {connectState === 'pending_received' && (
                  <button
                    onClick={handleRejectRequest}
                    disabled={connecting}
                    className="w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border border-red-200 text-red-500 hover:bg-red-50 transition-all"
                  >
                    <X className="w-4 h-4" /> Decline Request
                  </button>
                )}
                
                {/* Save Profile Button */}
                <button
                  onClick={handleToggleSave}
                  disabled={saving}
                  className="w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all border border-border text-ink/80 bg-white hover:bg-cream shadow-2xs"
                >
                  <Heart className={`w-4 h-4 ${isSaved ? 'fill-fire text-fire' : 'text-ink/40'}`} />
                  {isSaved ? 'Saved to Shortlist' : 'Save Profile'}
                </button>
              </div>

              {/* Report & Block Links */}
              <div className="mt-6 pt-4 border-t border-border/50 flex flex-col gap-2 text-xs text-ink/40 font-medium">
                <button onClick={() => setReportModalOpen(true)} className="hover:text-amber-600 flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5" /> Report User
                </button>
                <button onClick={handleBlock} className="hover:text-red-600 flex items-center gap-1.5">
                  <Ban className="w-3.5 h-3.5" /> Block User
                </button>
              </div>
            </div>

            {/* Card 2: Modern Artwork & Safety Showcase Card */}
            <div className="bg-gradient-to-b from-orange-50/70 to-white rounded-3xl p-5 border border-orange-100/80 shadow-2xs overflow-hidden space-y-4">
              {/* Cozy Room Illustration Cover Photo */}
              <div className="h-44 rounded-2xl overflow-hidden shadow-2xs">
                <img 
                  src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80" 
                  alt="Cozy room artwork" 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Quote */}
              <div className="text-center px-2">
                <p className="font-serif italic text-fire text-sm font-semibold leading-relaxed">
                  “Good spaces make better people.”
                </p>
                <p className="text-[10px] text-ink/40 font-bold uppercase mt-1">— Unknown</p>
              </div>

              {/* Safety Banner */}
              <div className="bg-fire/10 rounded-2xl p-4 border border-fire/20 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-fire text-white flex items-center justify-center flex-shrink-0 shadow-2xs mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-ink mb-0.5">Safety First</h4>
                  <p className="text-[11px] text-ink/60 leading-snug font-medium">
                    All profiles are manually verified to ensure a safe community.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Mobile Floating Bottom Bar — sits above Layout bottom nav */}
      <div className="fixed bottom-above-nav md:bottom-0 left-0 right-0 p-3 sm:p-4 bg-white/95 backdrop-blur-md border-t border-border z-40 lg:hidden flex gap-3">
        <button
          onClick={handleToggleSave}
          aria-label={isSaved ? 'Remove from saved' : 'Save profile'}
          className={`touch-target p-3.5 rounded-2xl border flex items-center justify-center shrink-0 ${isSaved ? 'bg-fire/10 border-fire/30 text-fire' : 'border-border text-ink/70'}`}
        >
          <Heart className={`w-5 h-5 ${isSaved ? 'fill-fire text-fire' : ''}`} />
        </button>
        <button
          onClick={handleConnectOrChat}
          disabled={connecting || connectState === 'pending_sent'}
          className={`flex-1 min-h-[48px] py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
            connectState === 'pending_sent' ? 'bg-ink/10 text-ink/40 cursor-not-allowed' :
            connectState === 'pending_received' ? 'bg-teal text-white' :
            'btn-fire text-white'
          }`}
        >
          <MessageCircle className="w-4.5 h-4.5" />
          {connectState === 'pending_sent' ? 'Request Sent' :
           connectState === 'pending_received' ? 'Accept Request' :
           connectState === 'chat' ? 'Chat Now' : 'Connect & Chat'}
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
