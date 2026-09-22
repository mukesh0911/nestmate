import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Heart, MessageCircle, ShieldCheck, Check,
  Star, Loader2, Home as HomeIcon, MapPin, X,
  Moon, Sun, Utensils, Wind, Wine, Users, Sparkles, Briefcase, Dog, User,
  CheckCircle2, Circle, Calendar, MessageSquare, ChevronRight, ChevronLeft, Zap,
  ExternalLink, Flag, Ban, SlidersHorizontal, Bed, Compass, Coffee,
  Cigarette, Flame, Eye, Target, Share2, Copy, Bus, Train, ShoppingBag,
  Hospital, Shield, Send, Phone, Dumbbell, Activity, BookOpen, Leaf
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
import { calculateCompatibility, calculateProfileCompatibility, getActiveStatus } from '@/hooks/useMatches';
import type { MatchedUser } from '@/hooks/useMatches';
import { quizQuestions } from '@/lib/staticData';
import { useStore } from '@/store/useStore';
import { toast } from 'sonner';

import FlatmateAvatar from '@/components/FlatmateAvatar';
import ContactModal from '@/components/ContactModal';
import { formatLocationString, getDynamicPreferences, getUserHighlights } from '@/lib/dynamicTraits';

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

function getQuizLabel(questionId: string, optionId?: string): string {
  if (!optionId) return 'Not specified';
  const q = quizQuestions.find(item => item.id === questionId);
  const opt = q?.options.find(o => o.id === optionId);
  return opt ? opt.label : optionId;
}

function getMemberDuration(createdAt: any): { value: string; label: string } {
  if (!createdAt) return { value: '< 1', label: 'Month on NestMate' };
  try {
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const now = new Date();
    const diffDays = Math.max(0, Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)));
    if (diffDays < 30) {
      return { value: `${Math.max(1, diffDays)}`, label: diffDays <= 1 ? 'Day on NestMate' : 'Days on NestMate' };
    }
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) {
      return { value: `${diffMonths}`, label: diffMonths === 1 ? 'Month on NestMate' : 'Months on NestMate' };
    }
    const diffYears = Math.floor(diffMonths / 12);
    return { value: `${diffYears}`, label: diffYears === 1 ? 'Year on NestMate' : 'Years on NestMate' };
  } catch {
    return { value: '1', label: 'Month on NestMate' };
  }
}

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
  const [activeRoomImgIdx, setActiveRoomImgIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copyToast, setCopyToast] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);

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
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Fetch match details
  useEffect(() => {
    if (!id) return;
    setIsLoading(true);

    Promise.all([
      getProfile(id).catch(() => null),
      getReviewsForUser(id).catch(() => [])
    ]).then(async ([targetProfileResult]) => {
      let targetProfile = targetProfileResult;
      let targetListing: any = null;

      // Fallback: If user doc is not found directly by ID, check if ID is an ownerId from real listings in Firestore
      if (!targetProfile) {
        try {
          const lq = query(collection(db, 'listings'), where('ownerId', '==', id));
          const lsnap = await getDocs(lq);
          if (!lsnap.empty) {
            const ldata = lsnap.docs[0].data();
            targetListing = { id: lsnap.docs[0].id, ...ldata };
            targetProfile = {
              uid: id,
              name: ldata.ownerName || 'Property Host',
              role: 'owner',
              city: ldata.city || '',
              localities: [ldata.locality].filter(Boolean),
              bio: ldata.ownerBio || '',
              isVerified: !!ldata.isVerified,
              quizAnswers: ldata.ownerQuizAnswers || {}
            } as any;
          }
        } catch (e) {
          console.error('Error fetching fallback profile', e);
        }
      }

      if (targetProfile) {
        // Query active room belonging to this user if not already found
        if (!targetListing) {
          try {
            const lq = query(
              collection(db, 'listings'),
              where('ownerId', '==', id)
            );
            const lsnap = await getDocs(lq);
            if (!lsnap.empty) {
              const ldata = lsnap.docs[0].data();
              targetListing = { id: lsnap.docs[0].id, ...ldata };
            }
          } catch (e) {
            console.error("Failed to fetch match listing", e);
          }
        }
        setListing(targetListing);

        // Compute multi-factor dynamic compatibility
        const matchResult = calculateProfileCompatibility(profile, targetProfile, targetListing);

        setMatchedUser({
          profile: targetProfile,
          compatibilityScore: matchResult.score,
          matchReasons: matchResult.reasons,
          matchCaveats: matchResult.caveats,
        });
      }
      setIsLoading(false);
    });
  }, [id, profile, getProfile, getReviewsForUser]);

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

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopyToast(true);
    toast.success('Profile link copied to clipboard!');
    setTimeout(() => setCopyToast(false), 2500);
  };

  const handleBlock = async () => {
    if (!user?.uid || !id) return;
    if (!window.confirm(`Block ${matchedUser?.profile.name}? You won't see each other again.`)) return;
    try {
      await blockUser(user.uid, id);
      await refreshProfile();
      toast.success('User blocked');
      navigate('/explore?tab=roommates');
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
      setReviewRating(5);
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

  const handleCallUser = () => {
    if (!user?.uid) {
      useStore.getState().openAuthModal({
        title: `Contact ${matchedUser?.profile.name || 'Flatmate'}`,
        subtitle: 'Sign in to view verified contact details.',
        redirect: `/match/${id}`,
      });
      return;
    }
    setContactModalOpen(true);
  };

  const handleConnectOrChat = async () => {
    if (!user?.uid) {
      useStore.getState().openAuthModal({
        title: `Connect with ${matchedUser?.profile.name || 'Flatmate'}`,
        subtitle: 'Sign in to send a connection request or chat.',
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

    if (existingConn?.status === 'pending' && existingConn.fromUserId === user.uid) {
      toast.info('Connection request already sent and pending.');
      return;
    }

    setConnecting(true);
    try {
      const connectionId = await sendRequest(user.uid, targetUid);
      const isTargetOwner = matchedUser?.profile.role === 'owner';
      const actionUrl = isTargetOwner
        ? `/owner-dashboard?request=${connectionId}`
        : `/match/${user.uid}`;

      await createNotification({
        userId: targetUid,
        type: 'connect',
        title: 'New Connect Request!',
        description: `${profile?.name || 'Someone'} wants to connect with you.`,
        read: false,
        actionUrl,
      });
      toast.success('Connect request sent successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to send request');
    } finally {
      setConnecting(false);
    }
  };

  if (isLoading) return <StateLoading label="Loading profile..." fullScreen />;

  if (!matchedUser) return (
    <div className="min-h-screen bg-[#FBF9F6] flex items-center justify-center px-4">
      <StateEmpty
        icon={Star}
        title="Profile not found"
        description="This profile could not be found or may have been removed."
        action={
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              onClick={() => navigate('/explore?tab=roommates')}
              className="px-5 py-2.5 rounded-full font-bold text-xs bg-[#E5501A] hover:bg-[#D0400B] text-white shadow-xs cursor-pointer"
            >
              Browse Flatmates
            </button>
            <button
              onClick={() => navigate('/explore?tab=rooms')}
              className="px-5 py-2.5 rounded-full font-bold text-xs bg-white hover:bg-gray-50 border border-gray-200 text-[#1A1A2E] shadow-2xs cursor-pointer"
            >
              Browse Rooms
            </button>
          </div>
        }
      />
    </div>
  );

  const p = matchedUser.profile;
  const isSaved = profile?.savedProfileIds?.includes(p.uid || '') || false;
  const activeStatus = getActiveStatus(p.lastActiveAt);
  const isOnline = activeStatus?.status === 'online';
  const activeLabel = activeStatus?.text || (p.lastActiveAt ? getActiveStatus(p.lastActiveAt)?.text : null) || 'Active recently';
  const isActiveRecently = isOnline || activeStatus?.status === 'recent' || activeLabel.toLowerCase().includes('today') || activeLabel.toLowerCase().includes('now') || activeLabel.toLowerCase().includes('h ago') || activeLabel.toLowerCase().includes('min');

  const targetUid = p.uid || id || '';
  const connectState = getRelationshipState(user?.uid, targetUid, myConnections, chatRoomMap);
  const compatibilityScore = matchedUser.compatibilityScore || 0;
  const matchReasons = matchedUser.matchReasons || [];
  const matchCaveats = matchedUser.matchCaveats || [];
  const hasUserQuiz = Boolean(profile?.quizAnswers && Object.keys(profile.quizAnswers).length > 0);

  // Real member duration calculated from account creation
  const memberDuration = getMemberDuration(p.createdAt);

  // Real successful connections involving this user
  const acceptedMatches = myConnections.filter(
    c => (c.fromUserId === targetUid || c.toUserId === targetUid) && c.status === 'accepted'
  ).length;

  // Real review stats from Firestore
  const totalReviews = reviews.length;
  const positiveReviews = reviews.filter(r => r.rating >= 4).length;
  const positivePercentage = totalReviews > 0 ? Math.round((positiveReviews / totalReviews) * 100) : 100;

  // Real trust metrics
  const isIdentityVerified = !!p.isVerified;
  const isPhoneVerified = !!(p.phone && p.phone.trim().length > 0);
  const isEmailVerified = !!(p.email || p.workEmailVerified);

  // Unified lifestyle preferences from quizAnswers OR householdExpectations OR listing houseRules
  const resolvedPreferences: Record<string, string> = { ...(p.quizAnswers || {}) };

  if (p.householdExpectations) {
    if (!resolvedPreferences.smoking && p.householdExpectations.smokingPolicy) {
      resolvedPreferences.smoking = p.householdExpectations.smokingPolicy === 'no_smoking' ? 'never' : 'occasionally';
    }
    if (!resolvedPreferences.pets && p.householdExpectations.petPolicy) {
      resolvedPreferences.pets = p.householdExpectations.petPolicy === 'no_pets' ? 'no' : 'yes';
    }
    if (!resolvedPreferences.food_pref && p.householdExpectations.dietPref) {
      resolvedPreferences.food_pref = p.householdExpectations.dietPref === 'veg' ? 'veg' : 'no_pref';
    }
    if (!resolvedPreferences.roommate_gender && (p.householdExpectations.genderPref || (listing as any)?.genderPreference)) {
      resolvedPreferences.roommate_gender = p.householdExpectations.genderPref || (listing as any)?.genderPreference;
    }
  }

  if (listing?.houseRules && Array.isArray(listing.houseRules)) {
    if (!resolvedPreferences.cleanliness && listing.houseRules.some((r: string) => r.toLowerCase().includes('clean'))) {
      resolvedPreferences.cleanliness = 'very';
    }
    if (!resolvedPreferences.smoking && listing.houseRules.some((r: string) => r.toLowerCase().includes('no smoking'))) {
      resolvedPreferences.smoking = 'never';
    }
    if (!resolvedPreferences.pets && listing.houseRules.some((r: string) => r.toLowerCase().includes('no pets'))) {
      resolvedPreferences.pets = 'no';
    }
    if (!resolvedPreferences.guests && listing.houseRules.some((r: string) => r.toLowerCase().includes('no parties'))) {
      resolvedPreferences.guests = 'rarely';
    }
  }

  // Active room images for carousel (strictly real photos)
  const roomPhotos = listing?.images && Array.isArray(listing.images)
    ? listing.images.filter((img: any): img is string => typeof img === 'string' && img.trim().length > 0)
    : [];

  const rentShare = listing?.partnerShare || listing?.rent || listing?.totalRent || 0;

  // Locality & City resolution (strictly dynamic real data, zero hardcoded city fallbacks)
  const userLocality = listing?.locality || p.localities?.[0] || p.locality || '';
  const userCity = listing?.city || p.city || '';
  const userState = p.state || (listing as any)?.state;
  const userLocationText = formatLocationString(userLocality, userCity, userState);

  // Dynamic preference badges derived strictly from real user/listing data
  const preferencesList = getDynamicPreferences({
    quizAnswers: p.quizAnswers,
    householdExpectations: p.householdExpectations,
    houseRules: listing?.houseRules,
    amenities: listing?.amenities,
    profession: p.profession,
  });

  // Highlights list derived strictly from real user profile data
  const highlightsList = getUserHighlights(p, isIdentityVerified, resolvedPreferences);

  const hasLifestylePreferences = Object.keys(resolvedPreferences).length > 0;

  return (
    <div className="min-h-screen bg-[#FBF9F6] pb-24 lg:pb-16 text-[#1A1A2E] font-sans">

      {/* ── Toast Notification ──────────────────────────────────────── */}
      {copyToast && (
        <div
          role="status"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[80] bg-[#1A1A2E]/95 backdrop-blur-md text-white text-xs font-semibold px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-white/10 animate-fade-up"
        >
          <Copy className="w-3.5 h-3.5 text-[#E5501A]" />
          <span>Profile link copied to clipboard</span>
        </div>
      )}

      {/* ── Main Container ───────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 sm:pt-6">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mb-12">

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* ── LEFT COLUMN (Profile & Direct Action Sticky Sidebar) ──── */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-24 self-start">

            {/* Card 1: User Profile Card (Matching Approved Left Sidebar) */}
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs p-6 flex flex-col items-center text-center">

              {/* Large Stylized / Photo Avatar */}
              <div className="mb-3.5">
                <FlatmateAvatar
                  avatar={p.avatar}
                  name={p.name}
                  gender={p.gender}
                  isVerified={isIdentityVerified}
                  illustrationType={p.name?.toLowerCase().includes('arun') ? 'arun' : undefined}
                  className="w-28 h-32 sm:w-32 sm:h-36 rounded-2xl shadow-xs"
                />
              </div>

              {/* User Name & Verification Shield */}
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <h2 className="text-xl font-extrabold text-[#1A1A2E] tracking-tight">
                  {p.name}
                </h2>
                {isIdentityVerified && (
                  <span title="Verified User" className="text-emerald-500">
                    <CheckCircle2 className="w-4 h-4 fill-emerald-500 text-white" />
                  </span>
                )}
              </div>

              {/* Subtitle & Status */}
              <p className="text-xs font-semibold text-gray-500 mb-2">
                {p.profession || (p.role === 'owner' ? 'Property Host' : 'Flatmate Seeker')}{userCity ? ` · ${userCity}` : ''}
              </p>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100/80 text-[11px] font-bold mb-5">
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-500'}`} />
                <span>{activeLabel}</span>
              </div>

              {/* Action Buttons: Chat & Call */}
              <div className="grid grid-cols-2 gap-2.5 w-full mb-3">
                {/* 1. Chat Button */}
                <button
                  type="button"
                  onClick={handleConnectOrChat}
                  disabled={connecting}
                  className="w-full py-2.5 px-3 rounded-xl font-bold text-xs bg-[#0F9D58] hover:bg-[#0B8043] text-white shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  {connecting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </>
                  )}
                </button>

                {/* 2. Call Button */}
                <button
                  type="button"
                  onClick={handleCallUser}
                  className="w-full py-2.5 px-3 rounded-xl font-bold text-xs bg-[#0F9D58] hover:bg-[#0B8043] text-white shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call</span>
                </button>
              </div>

              {/* Primary Connect Button */}
              <button
                type="button"
                onClick={handleConnectOrChat}
                disabled={connecting || connectState === 'pending_sent'}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-[#E5501A] hover:bg-[#D0400B] text-white shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-85 mb-2.5"
              >
                {connecting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : connectState === 'pending_sent' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Request Sent</span>
                  </>
                ) : connectState === 'pending_received' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Accept Request</span>
                  </>
                ) : connectState === 'connected' ? (
                  <>
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Message {p.name}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Connect with {p.name}</span>
                  </>
                )}
              </button>

              {/* Toggle Save Profile */}
              <button
                type="button"
                onClick={handleToggleSave}
                disabled={saving}
                className={`w-full py-2 px-3 rounded-xl font-semibold text-xs border transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                  isSaved
                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-500 text-rose-500' : 'text-gray-400'}`} />
                <span>{isSaved ? 'Saved Profile' : 'Save Profile'}</span>
              </button>

              {/* Report & Block links */}
              <div className="pt-3.5 mt-3 border-t border-gray-100 flex items-center justify-around w-full text-xs text-gray-400 font-medium">
                <button
                  onClick={() => setReportModalOpen(true)}
                  className="hover:text-amber-600 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>Report</span>
                </button>
                <span className="text-gray-200">|</span>
                <button
                  onClick={handleBlock}
                  className="hover:text-rose-600 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Block</span>
                </button>
              </div>

            </div>

            {/* Card 2: Match Compatibility Card */}
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs p-5 space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-[#E5501A]" />
                  <span className="text-xs font-bold text-[#1A1A2E]">Match with you</span>
                </div>
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/70 font-bold px-2.5 py-0.5 rounded-full text-xs">
                  <Zap className="w-3 h-3 text-emerald-600 fill-emerald-500" />
                  <span>{compatibilityScore > 0 ? `${compatibilityScore}% match` : 'New Match'}</span>
                </span>
              </div>

              {compatibilityScore > 0 && matchReasons.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {matchReasons.slice(0, 3).map((reason, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-[#E6F9EE] text-[#129B52] border border-emerald-200/80 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 text-[#129B52] shrink-0" />
                      <span className="truncate max-w-[130px]">{reason}</span>
                    </span>
                  ))}
                </div>
              )}

              <p className="text-[11px] text-gray-500 leading-relaxed">
                {compatibilityScore > 0
                  ? `Dynamic lifestyle & habit compatibility calculated from your preferences.`
                  : `Connect and share your preferences to calculate your real-time compatibility score.`}
              </p>
            </div>

            {/* Card 3: Verified & Trusted Card */}
            <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-2xs space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-[#1A1A2E]">Verified &amp; Trusted</h4>
              </div>

              <div className="space-y-2 text-xs font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isIdentityVerified ? 'text-emerald-500' : 'text-gray-300'}`} />
                  <span className={isIdentityVerified ? 'text-gray-700' : 'text-gray-400'}>
                    Identity Verified {isIdentityVerified ? '' : '(Pending)'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isActiveRecently ? 'text-emerald-500' : 'text-gray-300'}`} />
                  <span className={isActiveRecently ? 'text-gray-700' : 'text-gray-400'}>
                    Active on NestMate
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isPhoneVerified ? 'text-emerald-500' : 'text-gray-300'}`} />
                  <span className={isPhoneVerified ? 'text-gray-700' : 'text-gray-400'}>
                    Phone Number Verified
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${isEmailVerified ? 'text-emerald-500' : 'text-gray-300'}`} />
                  <span className={isEmailVerified ? 'text-gray-700' : 'text-gray-400'}>
                    Email Verified
                  </span>
                </div>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-150/70 rounded-xl p-2.5 flex items-center gap-2 text-[11px] text-emerald-800 font-medium">
                <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>A safer community for better living together.</span>
              </div>
            </div>

            {/* Card 4: Direct Connection Guarantee Card */}
            <div className="bg-white rounded-3xl p-5 border border-gray-200/80 shadow-2xs space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-[#FFF2EB] text-[#E5501A] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-[#1A1A2E]">Direct &amp; Verified Connection</h4>
              </div>
              <ul className="text-[11px] text-gray-600 font-medium space-y-1.5 pl-1">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Real community members and authentic profiles</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Zero brokerage and transparent living standards</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Safe in-app messaging before sharing contact info</span>
                </li>
              </ul>
            </div>

          </div>

          {/* ═════════════════════════════════════════════════════════════ */}
          {/* ── RIGHT COLUMN (Main Content Showcase) ──────────────────── */}
          {/* ═════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-8 space-y-6">

            {/* 1. Breadcrumbs Bar */}
            <div className="flex items-center justify-between bg-white rounded-2xl px-4 sm:px-5 py-3 border border-gray-200/80 shadow-2xs text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="flex items-center gap-1 text-gray-500 hover:text-[#1A1A2E] font-bold transition-colors cursor-pointer shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <span className="text-gray-300">/</span>
                <span
                  onClick={() => navigate('/')}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors truncate hidden sm:inline"
                >
                  Home
                </span>
                <span className="text-gray-300 hidden sm:inline">/</span>
                <span
                  onClick={() => navigate('/explore?tab=roommates')}
                  className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors truncate"
                >
                  Flatmates
                </span>
                <span className="text-gray-300">/</span>
                <span className="font-bold text-[#1A1A2E] truncate">
                  {p.name}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold transition-all cursor-pointer text-xs"
                >
                  <Share2 className="w-3 h-3" />
                  <span>Share</span>
                </button>
                <button
                  type="button"
                  onClick={handleToggleSave}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold transition-all cursor-pointer text-xs ${
                    isSaved
                      ? 'bg-rose-50 text-rose-600 border-rose-200'
                      : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
                  }`}
                >
                  <Heart className={`w-3 h-3 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span>{isSaved ? 'Saved' : 'Save'}</span>
                </button>
              </div>
            </div>

            {/* 2. Location Title Section */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Location
              </span>
              <div className="flex items-center gap-1.5 text-base sm:text-lg font-bold text-[#1A1A2E]">
                <MapPin className="w-4 h-4 text-[#E5501A] shrink-0" />
                <span>{userLocationText}</span>
              </div>
            </div>

            {/* 3. Basic Info 4-Stat Grid (Matching Reference Design) */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-4 sm:p-5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-3">
                Basic Info
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
                {/* Stat 1: Gender */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Gender</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-600 font-bold text-xs sm:text-sm">
                      {p.gender ? (p.gender.toLowerCase() === 'female' ? '♀ Female' : '♂ Male') : 'Any'}
                    </span>
                  </div>
                </div>

                {/* Stat 2: Approx Rent / Budget */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                    {listing ? 'Approx Rent' : 'Budget'}
                  </span>
                  <span className="font-extrabold text-sm sm:text-base text-[#1A1A2E]">
                    {listing
                      ? `₹ ${rentShare.toLocaleString('en-IN')}`
                      : p.budget
                        ? `₹ ${p.budget.toLocaleString('en-IN')}`
                        : 'Flexible'}
                  </span>
                </div>

                {/* Stat 3: Occupancy / Looking For */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Looking For</span>
                  <span className="font-bold text-xs sm:text-sm text-[#1A1A2E] truncate block">
                    {listing
                      ? (listing.flatType || listing.propertyType || 'Shared Room')
                      : (p.preferredRoomType || 'Flatmate')}
                  </span>
                </div>

                {/* Stat 4: Profession / Role */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Occupation</span>
                  <span className="font-bold text-xs sm:text-sm text-[#1A1A2E] truncate block">
                    {p.profession || (p.role === 'owner' ? 'Property Host' : 'Working Professional')}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Pictures Carousel Showcase (If active room exists or profile photos) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  {listing ? 'Active Room & Living Space' : 'Profile Showcase'}
                </span>
                {listing && (
                  <button
                    onClick={() => navigate(`/room/${listing.id}`)}
                    className="text-xs font-bold text-[#E5501A] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>View full listing</span>
                    <span>→</span>
                  </button>
                )}
              </div>

              {roomPhotos.length > 0 ? (
                <div className="relative rounded-3xl overflow-hidden bg-gray-900 border border-gray-200/80 shadow-2xs group aspect-[16/9] max-h-[390px]">
                  <img
                    src={roomPhotos[activeRoomImgIdx] || roomPhotos[0]}
                    alt="Space preview"
                    className="w-full h-full object-cover select-none"
                  />

                  {/* Left / Right Chevron Controls */}
                  {roomPhotos.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveRoomImgIdx(idx => (idx === 0 ? roomPhotos.length - 1 : idx - 1));
                        }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#1A1A2E] shadow-md flex items-center justify-center transition-all opacity-90 hover:opacity-100 hover:scale-105 cursor-pointer z-10"
                        aria-label="Previous photo"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveRoomImgIdx(idx => (idx === roomPhotos.length - 1 ? 0 : idx + 1));
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#1A1A2E] shadow-md flex items-center justify-center transition-all opacity-90 hover:opacity-100 hover:scale-105 cursor-pointer z-10"
                        aria-label="Next photo"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Top Badge: Room Title & Locality */}
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{listing?.title || `${p.name}'s Room`}{userLocality ? ` · ${userLocality}` : ''}</span>
                  </div>

                  {/* Bottom Counter Pill */}
                  <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full">
                    {activeRoomImgIdx + 1} / {roomPhotos.length}
                  </div>

                  {/* Bottom Dot Indicators */}
                  {roomPhotos.length > 1 && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-3 py-1.5 rounded-full">
                      {roomPhotos.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setActiveRoomImgIdx(i)}
                          className={`rounded-full transition-all cursor-pointer ${
                            i === activeRoomImgIdx
                              ? 'w-4 h-1.5 bg-white'
                              : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
                          }`}
                          aria-label={`Go to slide ${i + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Warm Seeker Hero Banner */
                <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-orange-50 via-amber-50/50 to-indigo-50/40 border border-gray-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="space-y-2 text-center sm:text-left">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-200 text-xs font-bold text-gray-700 shadow-2xs">
                      <Sparkles className="w-3.5 h-3.5 text-[#E5501A]" />
                      <span>Actively Looking for Roommates</span>
                    </span>
                    <h3 className="text-xl font-extrabold text-[#1A1A2E]">
                      {p.name} is seeking a friendly home in {userCity}
                    </h3>
                    <p className="text-xs text-gray-600 max-w-md">
                      {p.bio && p.bio.trim().length > 0
                        ? `"${p.bio.length > 120 ? p.bio.slice(0, 117) + '...' : p.bio}"`
                        : "Looking for like-minded flatmates to share a clean, peaceful living space and good vibes."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleConnectOrChat}
                    className="shrink-0 px-5 py-3 rounded-2xl font-bold text-xs bg-[#E5501A] hover:bg-[#D0400B] text-white shadow-xs flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    <span>Connect with {p.name}</span>
                  </button>
                </div>
              )}
            </div>

            {/* 5. Preferences Section (Circular Illustrated Badges) */}
            <div className="space-y-3 pt-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Preferences
              </span>
              {preferencesList.length > 0 ? (
                <div className="flex flex-wrap items-center gap-5 sm:gap-6">
                  {preferencesList.map((pref, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1.5 group cursor-default">
                      <div className={`w-14 h-14 rounded-full border flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform ${pref.bg}`}>
                        <pref.icon className="w-6 h-6 stroke-[1.8]" />
                      </div>
                      <span className="text-[11px] font-bold text-gray-700 tracking-tight">
                        {pref.label}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No specific lifestyle preferences recorded yet.</p>
              )}
            </div>

            {/* 6. Highlights Section (Checkmark Pills) */}
            <div className="space-y-3 pt-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Highlights
              </span>
              {highlightsList.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                  {highlightsList.map((highlight, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-emerald-50/70 border border-emerald-200/80 text-emerald-800 text-xs font-bold shadow-2xs"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                      <span>{highlight}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No specific highlights listed yet.</p>
              )}
            </div>

            {/* 7. Detailed Lifestyle & Habits Grid */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200/80 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FFF2EB] text-[#E5501A] flex items-center justify-center shrink-0">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#1A1A2E]">
                  Lifestyle &amp; Living Habits
                </h3>
              </div>

              {hasLifestylePreferences ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                  {/* Sleep Time */}
                  <div className="bg-[#FBF9F6]/90 border border-gray-200/80 rounded-2xl p-2.5 sm:p-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white border border-gray-200/70 flex items-center justify-center text-indigo-500 shrink-0 shadow-2xs">
                      <Moon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Sleep Time</p>
                      <p className="text-xs font-bold text-[#1A1A2E] truncate">
                        {getQuizLabel('sleep_time', resolvedPreferences.sleep_time)}
                      </p>
                    </div>
                  </div>

                  {/* Wake Up Time */}
                  <div className="bg-[#FBF9F6]/90 border border-gray-200/80 rounded-2xl p-2.5 sm:p-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white border border-gray-200/70 flex items-center justify-center text-amber-500 shrink-0 shadow-2xs">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Wake Up Time</p>
                      <p className="text-xs font-bold text-[#1A1A2E] truncate">
                        {getQuizLabel('wake_time', resolvedPreferences.wake_time)}
                      </p>
                    </div>
                  </div>

                  {/* Food Preference */}
                  <div className="bg-[#FBF9F6]/90 border border-gray-200/80 rounded-2xl p-2.5 sm:p-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white border border-gray-200/70 flex items-center justify-center text-emerald-500 shrink-0 shadow-2xs">
                      <Utensils className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Food Preference</p>
                      <p className="text-xs font-bold text-[#1A1A2E] truncate">
                        {getQuizLabel('food_pref', resolvedPreferences.food_pref)}
                      </p>
                    </div>
                  </div>

                  {/* Smoking */}
                  <div className="bg-[#FBF9F6]/90 border border-gray-200/80 rounded-2xl p-2.5 sm:p-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white border border-gray-200/70 flex items-center justify-center text-rose-500 shrink-0 shadow-2xs">
                      <Wind className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Smoking</p>
                      <p className="text-xs font-bold text-[#1A1A2E] truncate">
                        {getQuizLabel('smoking', resolvedPreferences.smoking)}
                      </p>
                    </div>
                  </div>

                  {/* Drinking */}
                  <div className="bg-[#FBF9F6]/90 border border-gray-200/80 rounded-2xl p-2.5 sm:p-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white border border-gray-200/70 flex items-center justify-center text-purple-500 shrink-0 shadow-2xs">
                      <Wine className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Drinking</p>
                      <p className="text-xs font-bold text-[#1A1A2E] truncate">
                        {getQuizLabel('drinking', resolvedPreferences.drinking)}
                      </p>
                    </div>
                  </div>

                  {/* Guests */}
                  <div className="bg-[#FBF9F6]/90 border border-gray-200/80 rounded-2xl p-2.5 sm:p-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white border border-gray-200/70 flex items-center justify-center text-sky-500 shrink-0 shadow-2xs">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Guests</p>
                      <p className="text-xs font-bold text-[#1A1A2E] truncate">
                        {getQuizLabel('guests', resolvedPreferences.guests)}
                      </p>
                    </div>
                  </div>

                  {/* Cleanliness */}
                  <div className="bg-[#FBF9F6]/90 border border-gray-200/80 rounded-2xl p-2.5 sm:p-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white border border-gray-200/70 flex items-center justify-center text-teal-500 shrink-0 shadow-2xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Cleanliness</p>
                      <p className="text-xs font-bold text-[#1A1A2E] truncate">
                        {getQuizLabel('cleanliness', resolvedPreferences.cleanliness)}
                      </p>
                    </div>
                  </div>

                  {/* Work Mode */}
                  <div className="bg-[#FBF9F6]/90 border border-gray-200/80 rounded-2xl p-2.5 sm:p-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white border border-gray-200/70 flex items-center justify-center text-blue-500 shrink-0 shadow-2xs">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Work Mode</p>
                      <p className="text-xs font-bold text-[#1A1A2E] truncate">
                        {getQuizLabel('work_mode', resolvedPreferences.work_mode)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 font-medium italic">
                  {p.name} has not filled out detailed lifestyle preferences yet.
                </p>
              )}
            </div>

            {/* 8. About [Name] Section */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200/80 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FFF2EB] text-[#E5501A] flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#1A1A2E]">
                  About {p.name}
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-normal">
                {p.bio && p.bio.trim().length > 0
                  ? p.bio
                  : `${p.name} is a member of the NestMate community looking to connect with friendly and responsible flatmates.`}
              </p>

              {/* 3-Metric Statistics Bar */}
              <div className="grid grid-cols-3 pt-4 text-center divide-x divide-gray-150 border-t border-gray-100">
                <div className="px-2 flex items-center justify-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FFF2EB] text-[#E5501A] flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-sm sm:text-base font-bold text-[#1A1A2E] leading-tight truncate">{memberDuration.value}</p>
                    <p className="text-[10px] text-gray-400 font-medium truncate">{memberDuration.label}</p>
                  </div>
                </div>

                <div className="px-2 flex items-center justify-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FFF2EB] text-[#E5501A] flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-sm sm:text-base font-bold text-[#1A1A2E] leading-tight truncate">{acceptedMatches}</p>
                    <p className="text-[10px] text-gray-400 font-medium truncate">{acceptedMatches === 1 ? 'Connected' : 'Matches'}</p>
                  </div>
                </div>

                <div className="px-2 flex items-center justify-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FFF2EB] text-[#E5501A] flex items-center justify-center shrink-0">
                    <Star className="w-4 h-4 fill-[#E5501A]" />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-sm sm:text-base font-bold text-[#1A1A2E] leading-tight truncate">
                      {totalReviews > 0 ? `${positivePercentage}%` : (isIdentityVerified ? 'Verified' : 'Active')}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium truncate">
                      {totalReviews > 0 ? 'Positive Reviews' : 'Community Member'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 9. House Rules & Living Standards (If host or room rules exist) */}
            {(listing?.houseRules?.length > 0 || p.householdExpectations) && (
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200/80 shadow-2xs space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FFF2EB] text-[#E5501A] flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-[#1A1A2E]">
                    House Rules &amp; Guidelines
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium text-gray-700">
                  {listing?.houseRules && listing.houseRules.length > 0 ? (
                    listing.houseRules.map((rule: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 p-3 rounded-2xl bg-gray-50/90 border border-gray-200/80">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{rule}</span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex items-center gap-2 p-3 rounded-2xl bg-gray-50/90 border border-gray-200/80">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Smoking: {p.householdExpectations?.smokingPolicy === 'no_smoking' ? 'No smoking inside' : 'Smoking allowed'}</span>
                      </div>
                      <div className="flex items-center gap-2 p-3 rounded-2xl bg-gray-50/90 border border-gray-200/80">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Pets: {p.householdExpectations?.petPolicy === 'no_pets' ? 'No pets allowed' : 'Pet friendly'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* 10. Neighborhood & Transit Explorer */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200/80 shadow-2xs space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FFF2EB] text-[#E5501A] flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#1A1A2E]">
                  Neighborhood &amp; Transit
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Visual Map preview card */}
                <div className="md:col-span-7 h-52 sm:h-56 rounded-2xl bg-[#EBF3FA] border border-[#D5E5F5] relative overflow-hidden flex items-center justify-center p-3 select-none">
                  {/* Subtle map pattern */}
                  <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <pattern id="match-street-grid-clean" width="48" height="48" patternUnits="userSpaceOnUse">
                        <path d="M 0 24 L 48 24 M 24 0 L 24 48" fill="none" stroke="#D3E2F2" strokeWidth="1.2" />
                        <circle cx="24" cy="24" r="1.5" fill="#BFDBFE" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#match-street-grid-clean)" />
                    {/* Primary Highway Curves */}
                    <path d="M -20 140 Q 140 80 420 110" fill="none" stroke="#FEE2C5" strokeWidth="12" />
                    <path d="M -20 140 Q 140 80 420 110" fill="none" stroke="#FDBA74" strokeWidth="3" />
                    {/* Secondary Cross Streets */}
                    <path d="M 90 -20 Q 140 100 180 240" fill="none" stroke="#CBD5E1" strokeWidth="5" />
                    <path d="M 260 -20 Q 230 110 320 240" fill="none" stroke="#CBD5E1" strokeWidth="4" />
                  </svg>

                  {/* Main Selected Pin */}
                  <div className="relative z-10 flex items-center gap-2 bg-white/95 backdrop-blur-xs border border-gray-200/90 rounded-2xl px-3.5 py-2 shadow-md">
                    <div className="w-7 h-7 rounded-full bg-[#E5501A] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <MapPin className="w-4 h-4 fill-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#1A1A2E] leading-tight">
                        {userLocality || userCity || 'Location'}
                      </p>
                      <p className="text-[10px] text-gray-500 font-medium">
                        {userCity || 'India'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Column: Quick Transit Exploration Links */}
                <div className="md:col-span-5 flex flex-col justify-between h-full space-y-3">
                  <div>
                    <h4 className="text-sm font-bold text-[#1A1A2E]">
                      {userLocality ? `${userLocality}, ` : ''}{userCity || 'Neighborhood'}
                    </h4>
                    <p className="text-xs text-gray-500 leading-relaxed mt-0.5">
                      {userCity ? `Popular residential area in ${userCity} with local amenities and transit connectivity.` : 'Local area with nearby amenities and transit connectivity.'}
                    </p>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Bus Stop near ${userLocality}, ${userCity}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 transition-colors group"
                    >
                      <div className="flex items-center gap-2 text-gray-700 font-medium truncate">
                        <Bus className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span className="truncate">Public Transit &amp; Bus Stops</span>
                      </div>
                      <span className="font-bold text-[11px] text-[#E5501A] group-hover:underline shrink-0 flex items-center gap-0.5">
                        <span>Explore</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    </a>

                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Supermarket near ${userLocality}, ${userCity}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 transition-colors group"
                    >
                      <div className="flex items-center gap-2 text-gray-700 font-medium truncate">
                        <ShoppingBag className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <span className="truncate">Markets &amp; Groceries</span>
                      </div>
                      <span className="font-bold text-[11px] text-[#E5501A] group-hover:underline shrink-0 flex items-center gap-0.5">
                        <span>Explore</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    </a>

                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Metro Station near ${userLocality}, ${userCity}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 transition-colors group"
                    >
                      <div className="flex items-center gap-2 text-gray-700 font-medium truncate">
                        <Compass className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">Metro &amp; Rapid Rail</span>
                      </div>
                      <span className="font-bold text-[11px] text-[#E5501A] group-hover:underline shrink-0 flex items-center gap-0.5">
                        <span>Explore</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    </a>

                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Hospital near ${userLocality}, ${userCity}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-100 transition-colors group"
                    >
                      <div className="flex items-center gap-2 text-gray-700 font-medium truncate">
                        <Hospital className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">Healthcare &amp; Clinics</span>
                      </div>
                      <span className="font-bold text-[11px] text-[#E5501A] group-hover:underline shrink-0 flex items-center gap-0.5">
                        <span>Explore</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    </a>
                  </div>

                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${userLocality}, ${userCity}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 rounded-xl font-bold text-xs text-[#1A1A2E] bg-white hover:bg-gray-50 border border-gray-200/90 transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3 text-gray-500" />
                    <span>View on Google Maps</span>
                  </a>
                </div>
              </div>
            </div>

            {/* 11. Community Reviews & Vouches Card */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200/80 shadow-2xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FFF2EB] text-[#E5501A] flex items-center justify-center shrink-0">
                    <Star className="w-4 h-4 fill-[#E5501A]" />
                  </div>
                  <h3 className="text-base font-bold text-[#1A1A2E]">
                    Community Reviews &amp; Vouches
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(true)}
                  className="px-4 py-2 rounded-xl font-bold text-xs bg-[#E5501A] hover:bg-[#D0400B] text-white shadow-xs cursor-pointer"
                >
                  Write a Vouch
                </button>
              </div>

              {reviews.length > 0 ? (
                <div className="space-y-3">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="p-3.5 rounded-2xl bg-[#FBF9F6] border border-gray-150">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-[#1A1A2E]">{rev.reviewerName}</span>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">{rev.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 px-4 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mb-3">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-[#1A1A2E] mb-1">No reviews yet</h4>
                  <p className="text-xs text-gray-500 max-w-sm mb-4">
                    Be the first person to share your experience or vouch for {p.name}'s character.
                  </p>
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(true)}
                    className="px-5 py-2.5 rounded-full font-bold text-xs bg-[#E5501A] hover:bg-[#D0400B] text-white shadow-xs cursor-pointer"
                  >
                    Write a Vouch
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* ── Mobile Floating Bottom Action Bar ──────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-gray-200 z-40 lg:hidden flex gap-2 shadow-lg">
        <button
          onClick={handleToggleSave}
          aria-label={isSaved ? 'Remove from saved' : 'Save profile'}
          className={`p-3 rounded-2xl border flex items-center justify-center shrink-0 min-h-[44px] cursor-pointer ${isSaved ? 'bg-rose-50 border-rose-200 text-rose-600' : 'border-gray-200 text-gray-700 bg-white'}`}
        >
          <Heart className={`w-5 h-5 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>
        <button
          onClick={handleCallUser}
          className="p-3 rounded-2xl bg-[#0F9D58] hover:bg-[#0B8043] text-white flex items-center justify-center shrink-0 min-h-[44px] cursor-pointer shadow-xs"
          title="Call"
        >
          <Phone className="w-5 h-5" />
        </button>
        <button
          onClick={handleConnectOrChat}
          disabled={connecting || connectState === 'pending_sent'}
          className="flex-1 min-h-[44px] py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer bg-[#E5501A] hover:bg-[#D0400B] text-white"
        >
          <MessageCircle className="w-4 h-4" />
          <span>
            {connectState === 'pending_sent' ? 'Request Sent' :
              connectState === 'pending_received' ? 'Accept Request' :
                connectState === 'connected' ? 'Message' : 'Connect & Chat'}
          </span>
        </button>
      </div>

      {/* ── Contact Phone Modal ───────────────────────────────────────── */}
      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        profile={p}
      />

      {/* ── Report Modal ─────────────────────────────────────────────── */}
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
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Reason</label>
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
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Additional Details</label>
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

      {/* ── Leave Review Modal ────────────────────────────────────────── */}
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
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-2 text-center">Rating</label>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1.5 focus:outline-none hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`w-8 h-8 ${star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Your Vouch / Review</label>
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
            <Button className="bg-[#E5501A] hover:bg-[#D0400B] text-white font-bold" onClick={handleSubmitReview} disabled={isSubmittingReview}>
              {isSubmittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Vouch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
