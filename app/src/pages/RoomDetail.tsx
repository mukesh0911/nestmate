import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Heart, Share2, MapPin, MessageCircle,
  Wifi, Wind, Car, Dumbbell, Droplets, Refrigerator, Tv, Check,
  Bed, Loader2, Copy, LayoutGrid, X, ChevronLeft, ChevronRight,
  ShieldCheck, Users, Calendar, Sparkles, CheckCircle2, Lock,
  ExternalLink, Star, Tag, Zap, Image as ImageIcon,
  CheckCheck, AlertCircle, Home, Send, PhoneCall, Info,
  Compass, ArrowUpRight, Flame, Clock, MessageSquare, Key
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useListings } from '@/hooks/useListings';
import { useAuth } from '@/hooks/useAuth';
import { useConnections } from '@/hooks/useConnections';
import { useNotifications } from '@/hooks/useNotifications';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAnalytics } from '@/hooks/useAnalytics';
import { getRoomMatchReasons } from '@/lib/matching';
import type { Listing } from '@/hooks/useListings';
import { useStore } from '@/store/useStore';
import { getAvailabilityState, getFreshnessAnchorMs, formatRelativeDays, isDiscoverable } from '@/lib/listingFreshness';
import {
  getListingPhotos,
  formatDepositINR,
} from '@/lib/displayTruth';
import StateLoading from '@/components/StateLoading';
import StateEmpty from '@/components/StateEmpty';

/* ─── Amenity Icons Map ─────────────────────────────────────────────── */
const amenityIcons: Record<string, React.ReactNode> = {
  WiFi: <Wifi className="w-4 h-4 text-sky-500" />,
  AC: <Wind className="w-4 h-4 text-cyan-500" />,
  Parking: <Car className="w-4 h-4 text-emerald-500" />,
  'Washing Machine': <Droplets className="w-4 h-4 text-indigo-500" />,
  Gym: <Dumbbell className="w-4 h-4 text-purple-500" />,
  Geyser: <Flame className="w-4 h-4 text-amber-500" />,
  Fridge: <Refrigerator className="w-4 h-4 text-blue-500" />,
  TV: <Tv className="w-4 h-4 text-rose-500" />,
  'RO Water': <Droplets className="w-4 h-4 text-teal-500" />,
  'Kitchen Access': <Sparkles className="w-4 h-4 text-orange-500" />,
};

/* ─── Quick Prompt Chips for Intro Message ──────────────────────────── */
interface QuickPrompt {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  label: string;
  text: string;
}

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: 'visit',
    icon: Calendar,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50 border-emerald-100',
    label: 'Schedule a Visit',
    text: "I'd like to schedule a visit",
  },
  {
    id: 'movein',
    icon: Clock,
    iconColor: 'text-sky-600',
    iconBg: 'bg-sky-50 border-sky-100',
    label: 'Move-in Flexibility',
    text: 'Is the move-in date flexible?',
  },
  {
    id: 'rules',
    icon: MessageSquare,
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50 border-indigo-100',
    label: 'House Rules',
    text: 'Can we chat about house rules?',
  },
  {
    id: 'ready',
    icon: Key,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50 border-amber-100',
    label: 'Ready to Move In',
    text: 'Ready to move in this month',
  },
];

/* ─── Main Component ────────────────────────────────────────────────── */
export default function RoomDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { getListingById, recordView } = useListings();
  const { sendRequest, subscribeToMyConnections } = useConnections();
  const { createNotification } = useNotifications();
  const { toggleSavedRoom } = useUserProfile();
  const { logEvent } = useAnalytics();

  const [room, setRoom] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [savingRoom, setSavingRoom] = useState(false);
  const [copyToast, setCopyToast] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [introMsg, setIntroMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'compatibility' | 'rules'>('overview');
  const cardRef = useRef<HTMLDivElement>(null);
  const matchSectionRef = useRef<HTMLDivElement>(null);

  const isSaved = !!(profile?.savedRoomIds && id && profile.savedRoomIds.includes(id));

  // Sync requestSent state with existing connections to prevent duplicate connection requests
  useEffect(() => {
    if (!user?.uid || !room?.ownerId) return;
    const unsub = subscribeToMyConnections(user.uid, (conns) => {
      const active = conns.some(
        c => (c.toUserId === room.ownerId || c.fromUserId === room.ownerId) &&
          (c.status === 'pending' || c.status === 'accepted')
      );
      if (active) setRequestSent(true);
    });
    return () => unsub();
  }, [user?.uid, room?.ownerId, subscribeToMyConnections]);

  // Seed default intro message
  useEffect(() => {
    if (room && !introMsg) {
      setIntroMsg(`Hi ${room.ownerName || 'there'}! I saw your ${room.flatType || 'room'} in ${room.locality}. I'd love to connect and schedule a visit.`);
    }
  }, [room, introMsg]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!showLightbox) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowLightbox(false);
      if (e.key === 'ArrowLeft') setLightboxIdx(p => (p === 0 ? p : p - 1));
      if (e.key === 'ArrowRight') setLightboxIdx(p => (room?.images && p < room.images.length - 1 ? p + 1 : 0));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showLightbox, room?.images]);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getListingById(id).then(data => {
      setRoom(data);
      setIsLoading(false);
      if (data?.id) {
        recordView(data.id, data.ownerId).catch(() => { });
      }
    });
  }, [id, getListingById, recordView]);

  const handleConnect = async () => {
    if (!user?.uid) {
      useStore.getState().openAuthModal({
        title: 'Sign in to Express Interest',
        subtitle: 'Create an account or try a 1-click demo to connect with the owner.',
        redirect: `/room/${id}`,
      });
      return;
    }
    if (!room || connecting) return;
    setConnecting(true);
    try {
      await sendRequest(user.uid, room.ownerId, { listingId: room.id });
      logEvent({ name: 'interest_sent', actorId: user.uid, entityId: room.id, city: room.city });
      await createNotification({
        userId: room.ownerId,
        type: 'connect',
        title: 'New Interest in Your Listing!',
        description: `${profile?.name || 'Someone'} expressed interest in "${room.title}".`,
        read: false,
        actionUrl: '/owner-dashboard',
      });
      setRequestSent(true);
    } catch (err) {
      console.error(err);
    } finally {
      setConnecting(false);
    }
  };

  const handleToggleSave = async () => {
    if (!user?.uid) {
      useStore.getState().openAuthModal({
        title: 'Sign in to Save Rooms',
        subtitle: 'Save your favorite listings and access them anytime across devices.',
        redirect: `/room/${id}`,
      });
      return;
    }
    if (!id || savingRoom) return;
    setSavingRoom(true);
    try {
      await toggleSavedRoom(user.uid, id, isSaved);
      await refreshProfile();
    } catch (err) {
      console.error('Failed to save room:', err);
    } finally {
      setSavingRoom(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: room?.title || 'NestMate Listing',
      text: `Check out this room: ${room?.title} in ${room?.locality}, ${room?.city} — ₹${room?.partnerShare?.toLocaleString()}/mo`,
      url: window.location.href,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (_) { /* ignored */ }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2500);
    }
  };

  const handleQuickPromptClick = (text: string) => {
    setIntroMsg(prev => {
      const cleanPrev = prev.trim();
      if (!cleanPrev) return `Hi ${room?.ownerName || 'there'}! ${text}.`;
      if (cleanPrev.includes(text)) return cleanPrev;
      return `${cleanPrev} ${text}.`;
    });
  };

  const scrollToCompatibility = () => {
    matchSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveTab('compatibility');
  };

  /* ── States ─────────────────────────────────────────────────────── */
  if (isLoading) return <StateLoading label="Loading listing…" fullScreen />;

  if (!room) return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-4">
      <StateEmpty
        icon={Bed}
        title="Listing not found"
        description="This room is inactive or may have been removed by the owner."
        action={
          <button onClick={() => navigate(-1)} className="btn-fire text-sm cursor-pointer">
            Go Back
          </button>
        }
      />
    </div>
  );

  // SECURITY: Block public access to listings pending owner identity verification
  const isOwnListing = user?.uid && room.ownerId === user.uid;
  if (!isOwnListing && (room.status === 'pending_verification' || room.ownerVerified === false)) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-4">
        <StateEmpty
          icon={Bed}
          title="Listing not yet available"
          description="This listing is pending identity verification by the owner. It will become publicly accessible once verified."
          action={
            <button onClick={() => navigate('/explore?tab=rooms')} className="btn-fire text-sm cursor-pointer">
              Browse Other Rooms
            </button>
          }
        />
      </div>
    );
  }

  // Availability check
  if (!isDiscoverable(room)) {
    const state = getAvailabilityState(room);
    const reason = state === 'closed'
      ? 'The owner has marked this room as no longer available.'
      : state === 'paused'
        ? 'This listing has been paused by the owner.'
        : 'This listing has not been confirmed as available recently.';
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-4">
        <StateEmpty
          icon={Bed}
          title="This room is no longer available"
          description={`${reason} Browse other rooms that match your preferences.`}
          action={
            <button onClick={() => navigate('/explore?tab=rooms')} className="btn-fire text-sm cursor-pointer">
              Browse Rooms
            </button>
          }
        />
      </div>
    );
  }

  /* ── Data & Computed Attributes ─────────────────────────────────── */
  const { photos, hasRealPhotos } = getListingPhotos(room.images);

  // Multi-Factor Listing Compatibility Engine
  const roomMatchBreakdown = profile ? getRoomMatchReasons(profile, room) : null;
  const compatibility = roomMatchBreakdown?.score || 0;

  const rentShare = room.partnerShare || room.totalRent || 0;
  const deposit = typeof room.deposit === 'number' && room.deposit > 0 ? room.deposit : 0;
  const depositLabel = formatDepositINR(room.deposit);

  const avail = getAvailabilityState(room);
  const isAvailableFresh = avail === 'available';

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#FBF9F5] pb-28 lg:pb-16 text-slate-900 overflow-x-hidden selection:bg-orange-100 selection:text-orange-900">

      {/* ── Toast ─────────────────────────────────────────────────── */}
      {copyToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[80] bg-slate-900/95 backdrop-blur-md text-white text-xs font-semibold px-5 py-3 rounded-full shadow-2xl flex items-center gap-2.5 border border-white/10 animate-fade-up"
        >
          <div className="w-5 h-5 rounded-full bg-fire/20 flex items-center justify-center">
            <Copy className="w-3 h-3 text-fire" />
          </div>
          <span>Listing link copied to clipboard</span>
        </div>
      )}

      {/* ── Sub-header Breadcrumb Bar ──────────────────────────────── */}
      <div className="border-b border-stone-200/70 bg-white/70 backdrop-blur-md sticky top-0 z-30 transition-all duration-200">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-6 xl:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <button
              onClick={() => navigate(-1)}
              aria-label="Go back"
              className="inline-flex items-center gap-1.5 font-bold text-slate-700 hover:text-fire transition-colors duration-150 cursor-pointer group bg-stone-100/80 hover:bg-orange-50 px-3 py-1.5 rounded-full border border-stone-200/60"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-150 group-hover:-translate-x-0.5" />
              <span>Back</span>
            </button>
            <span className="hidden sm:inline text-stone-300">/</span>
            <span className="hidden sm:inline text-slate-500">{room.city}</span>
            <span className="hidden sm:inline text-stone-300">/</span>
            <span className="hidden sm:inline text-slate-500">{room.locality}</span>
            <span className="hidden md:inline text-stone-300">/</span>
            <span className="hidden md:inline font-semibold text-slate-800 truncate max-w-[200px]">{room.title}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              aria-label="Share listing"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-stone-50 border border-stone-200 px-3.5 py-2 rounded-xl transition-all duration-150 cursor-pointer shadow-xs hover:border-stone-300 active:scale-[0.98]"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Share</span>
            </button>
            <button
              onClick={handleToggleSave}
              aria-label={isSaved ? 'Remove from saved' : 'Save listing'}
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl border transition-all duration-200 cursor-pointer shadow-xs active:scale-[0.98] ${
                isSaved
                  ? 'bg-rose-50 text-rose-600 border-rose-200 shadow-sm'
                  : 'bg-white text-slate-700 hover:text-slate-900 border-stone-200 hover:bg-stone-50 hover:border-stone-300'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 transition-all duration-200 ${isSaved ? 'fill-rose-500 text-rose-500 scale-110' : 'text-slate-500'}`} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Page Wrapper ──────────────────────────────────────────── */}
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 xl:px-8 pt-6 sm:pt-8">

        {/* ── 1. Hero Title & Highlights Header ──────────────────────── */}
        <div className="mb-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Availability Badge */}
            <div className={`inline-flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider px-3 py-1 rounded-full border shadow-xs ${
              isAvailableFresh
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                : 'bg-amber-50 text-amber-800 border-amber-200/80'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isAvailableFresh ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {isAvailableFresh ? `Available · Confirmed ${formatRelativeDays(getFreshnessAnchorMs(room))}` : 'Availability Needs Confirmation'}
            </div>

            {/* Direct Owner Seal */}
            <span className="inline-flex items-center gap-1.5 bg-slate-900 text-white font-semibold text-[11px] px-3 py-1 rounded-full shadow-xs">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Direct Owner · Zero Brokerage
            </span>

            {/* Compatibility Quick Pill */}
            {compatibility > 0 && (
              <button
                onClick={scrollToCompatibility}
                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-emerald-500/15 text-emerald-800 hover:text-emerald-950 font-bold px-3 py-1 rounded-full border border-emerald-300/80 text-[11px] tracking-wide transition-all duration-200 hover:scale-[1.02] cursor-pointer shadow-xs"
              >
                <Zap className="w-3 h-3 text-emerald-600 fill-emerald-500" />
                <span>{compatibility}% Match with You</span>
                <span className="text-emerald-600 underline font-extrabold text-[10px] ml-0.5">View breakdown</span>
              </button>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {room.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 font-medium">
            <span className="flex items-center gap-1.5 text-slate-700">
              <MapPin className="w-4 h-4 text-fire flex-shrink-0" />
              <span className="font-semibold">{room.locality}</span>, {room.city}
            </span>
            <span className="text-stone-300" aria-hidden>·</span>
            <span className="text-slate-600 font-medium">
              {room.flatType ? `${room.flatType} Apartment` : 'Private Flat'}
            </span>
            <span className="text-stone-300" aria-hidden>·</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 text-xs">
              100% Broker-Free
            </span>
          </div>
        </div>

        {/* ── 2. Editorial Luxury Photo Gallery ───────────────────────── */}
        {!hasRealPhotos && (
          <div className="rounded-3xl overflow-hidden border-2 border-dashed border-stone-200 bg-white p-12 flex flex-col items-center justify-center text-center shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 text-fire flex items-center justify-center mb-4 shadow-inner">
              <ImageIcon className="w-8 h-8" />
            </div>
            <h2 className="text-base font-bold text-slate-800">No photos uploaded yet</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
              The owner hasn't attached photos for this listing. You can message them directly to request recent photos or schedule an in-person tour.
            </p>
          </div>
        )}

        {/* 1 Photo Showcase */}
        {hasRealPhotos && photos.length === 1 && (
          <div
            className="relative rounded-3xl overflow-hidden shadow-lg border border-stone-200/80 cursor-pointer group"
            style={{ height: '460px' }}
            onClick={() => { setLightboxIdx(0); setShowLightbox(true); }}
          >
            <img
              src={photos[0]}
              alt={room.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-black/20" />
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(0); setShowLightbox(true); }}
              className="absolute bottom-5 right-5 inline-flex items-center gap-2 bg-slate-900/85 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl backdrop-blur-md border border-white/20 shadow-xl transition-all duration-200 cursor-pointer"
            >
              <LayoutGrid className="w-4 h-4" />
              View full photo
            </button>
          </div>
        )}

        {/* 2 Photos Showcase */}
        {hasRealPhotos && photos.length === 2 && (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-3xl overflow-hidden shadow-lg border border-stone-200/80"
            style={{ height: '460px' }}
          >
            {photos.map((src, i) => (
              <div
                key={i}
                className="relative cursor-pointer group overflow-hidden h-full"
                onClick={() => { setLightboxIdx(i); setShowLightbox(true); }}
              >
                <img
                  src={src}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/15 transition-colors duration-200" />
              </div>
            ))}
          </div>
        )}

        {/* 3 Photos Asymmetric Editorial Showcase (Like User's Listing) */}
        {hasRealPhotos && photos.length === 3 && (
          <div
            className="relative hidden md:grid grid-cols-12 gap-3 rounded-3xl overflow-hidden shadow-lg border border-stone-200/80"
            style={{ height: '490px' }}
          >
            {/* Primary Large Image (65% width) */}
            <div
              className="col-span-7 relative cursor-pointer group overflow-hidden"
              onClick={() => { setLightboxIdx(0); setShowLightbox(true); }}
            >
              <img
                src={photos[0]}
                alt={room.title}
                loading="eager"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Freshness Badge overlay */}
              <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-full border border-white/20 shadow-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Verified Listing · {room.locality}
              </div>
            </div>

            {/* 2 Stacked Supporting Images (35% width) */}
            <div className="col-span-5 grid grid-rows-2 gap-3 h-full">
              {[1, 2].map((idx) => (
                <div
                  key={idx}
                  className="relative cursor-pointer group overflow-hidden"
                  onClick={() => { setLightboxIdx(idx); setShowLightbox(true); }}
                >
                  <img
                    src={photos[idx]}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors duration-200" />
                  
                  {idx === 2 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setLightboxIdx(0); setShowLightbox(true); }}
                      className="absolute bottom-4 right-4 inline-flex items-center gap-2 bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl backdrop-blur-md border border-white/20 shadow-xl transition-all duration-200 cursor-pointer"
                    >
                      <LayoutGrid className="w-4 h-4 text-orange-400" />
                      View all 3 photos
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4+ Photos Airbnb-Luxe 5-Grid */}
        {hasRealPhotos && photos.length >= 4 && (
          <div
            className="relative hidden md:grid grid-cols-4 grid-rows-2 gap-3 rounded-3xl overflow-hidden shadow-lg border border-stone-200/80"
            style={{ height: '490px' }}
          >
            {/* Primary Large Left */}
            <div
              className="col-span-2 row-span-2 relative cursor-pointer group overflow-hidden"
              onClick={() => { setLightboxIdx(0); setShowLightbox(true); }}
            >
              <img
                src={photos[0]}
                alt={room.title}
                loading="eager"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Supporting images */}
            {[1, 2, 3, 4].filter(i => i < photos.length).map(i => (
              <div
                key={i}
                className="relative cursor-pointer group overflow-hidden"
                onClick={() => { setLightboxIdx(i); setShowLightbox(true); }}
              >
                <img
                  src={photos[i]}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors duration-200" />
              </div>
            ))}

            <button
              onClick={() => { setLightboxIdx(0); setShowLightbox(true); }}
              className="absolute bottom-4 right-4 inline-flex items-center gap-2 bg-slate-900/90 hover:bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl backdrop-blur-md border border-white/20 shadow-xl transition-all duration-200 cursor-pointer z-10"
            >
              <LayoutGrid className="w-4 h-4 text-orange-400" />
              View all {photos.length} photos
            </button>
          </div>
        )}

        {/* Mobile Single Photo Showcase */}
        {hasRealPhotos && (
          <div
            className="md:hidden relative rounded-2xl overflow-hidden shadow-md border border-stone-200"
            style={{ height: '260px' }}
          >
            <img
              src={photos[0]}
              alt={room.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <button
              onClick={() => { setLightboxIdx(0); setShowLightbox(true); }}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-slate-900/80 text-white text-xs font-bold px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/20 cursor-pointer"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              {photos.length} photos
            </button>
          </div>
        )}

        {/* ── 3. Quick Specs Luxury Ribbon ───────────────────────────── */}
        <div className="my-7 grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {[
            {
              icon: <Bed className="w-5 h-5 text-fire" />,
              bg: 'bg-orange-50 border-orange-100',
              label: 'Room Space',
              value: room.flatType ? `${room.flatType} Private Room` : 'Private Room',
              sub: 'Personal space'
            },
            {
              icon: <Sparkles className="w-5 h-5 text-amber-600" />,
              bg: 'bg-amber-50 border-amber-100',
              label: 'Furnishing',
              value: room.furnishing || 'Not specified',
              sub: 'Interior status'
            },
            {
              icon: <Calendar className="w-5 h-5 text-emerald-600" />,
              bg: 'bg-emerald-50 border-emerald-100',
              label: 'Available From',
              value: room.availableFrom || 'Flexible',
              sub: 'Move-in timeline'
            },
            {
              icon: <Users className="w-5 h-5 text-indigo-600" />,
              bg: 'bg-indigo-50 border-indigo-100',
              label: 'Roommates',
              value: room.partnersNeeded ? `${room.partnersNeeded} needed` : '1 needed',
              sub: 'Flat occupancy'
            },
          ].map((item) => (
            <div
              key={item.label}
              className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs hover:shadow-md hover:border-stone-300 transition-all duration-200 flex items-start gap-3.5"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center border flex-shrink-0 ${item.bg}`}>
                {item.icon}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {item.label}
                </span>
                <span className="text-[14px] font-extrabold text-slate-900 truncate block mt-0.5">
                  {item.value}
                </span>
                <span className="text-[11px] text-slate-400 font-medium block">
                  {item.sub}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ── 4. Main Two-Column Layout ──────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 xl:gap-12 items-start">

          {/* ════ LEFT COLUMN: Content & Deep Intelligence ═════════════ */}
          <div className="space-y-10 min-w-0">

            {/* ── A. Host Passport Card ──────────────────────────────── */}
            <div className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-7 shadow-xs relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 pb-6 border-b border-stone-100">
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    {room.ownerAvatar ? (
                      <img
                        src={room.ownerAvatar}
                        alt={room.ownerName || 'Owner'}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md ring-2 ring-stone-100"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fire to-orange-500 text-white font-extrabold text-2xl flex items-center justify-center shadow-md ring-2 ring-orange-100">
                        {(room.ownerName || 'O').charAt(0).toUpperCase()}
                      </div>
                    )}
                    {room.isOwnerVerified && (
                      <span
                        className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                        title="Government ID Verified"
                      >
                        <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900">
                        Hosted by {room.ownerName || 'Property Owner'}
                      </h2>
                      {room.isOwnerVerified && (
                        <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Direct Property Owner · {room.locality}, {room.city}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium mt-1">
                      Listing ID: <span className="font-mono text-slate-500">{room.id?.slice(0, 8) || 'verified'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl font-bold border border-emerald-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Zero Brokerage
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Consent-based contact
                  </span>
                </div>
              </div>

              {/* Host Credential Badges */}
              <div className="pt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">ID Verified</p>
                    <p className="text-[11px] text-slate-500">Official Govt. ID</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-fire flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Fast Response</p>
                    <p className="text-[11px] text-slate-500">Typically &lt; 1 hour</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                  <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center flex-shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">Safe Messaging</p>
                    <p className="text-[11px] text-slate-500">In-app private chat</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── B. Deep Match Intelligence™ Card ───────────────────── */}
            <div
              ref={matchSectionRef}
              className="rounded-3xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30 p-6 sm:p-8 shadow-xs relative overflow-hidden"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-emerald-100">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-3 py-1 rounded-full mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    NestMate Match Intelligence™
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Compatibility Breakdown
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Multi-factor algorithmic alignment evaluated across 5 key dimensions.
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-2xl border border-emerald-200/80 shadow-xs flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex flex-col items-center justify-center font-black">
                    <span className="text-base leading-none">{compatibility}%</span>
                    <span className="text-[8px] tracking-wider uppercase opacity-90">FIT</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {compatibility >= 80 ? 'Exceptional Match' : compatibility >= 60 ? 'Strong Fit' : 'Moderate Fit'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      High lifestyle harmony
                    </p>
                  </div>
                </div>
              </div>

              {/* 5 Pillar Progress Meters */}
              {roomMatchBreakdown && (
                <div className="py-6 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    The 5 Core Matching Pillars
                  </h3>

                  <div className="space-y-3.5">
                    {/* 1. Budget Fit (Max 25 pts) */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-emerald-600" />
                          Budget Alignment
                        </span>
                        <span className="font-bold text-slate-600">
                          {Math.round((roomMatchBreakdown.budgetScore / 25) * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-stone-200/70 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.round((roomMatchBreakdown.budgetScore / 25) * 100))}%` }}
                        />
                      </div>
                    </div>

                    {/* 2. Location & Locality (Max 20 pts) */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-sky-600" />
                          Location &amp; Commute Proximity
                        </span>
                        <span className="font-bold text-slate-600">
                          {Math.round((roomMatchBreakdown.locationScore / 20) * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-stone-200/70 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sky-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.round((roomMatchBreakdown.locationScore / 20) * 100))}%` }}
                        />
                      </div>
                    </div>

                    {/* 3. Gender Requirement (Max 20 pts) */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-indigo-600" />
                          Gender Preference Alignment
                        </span>
                        <span className="font-bold text-slate-600">
                          {Math.round((roomMatchBreakdown.genderScore / 20) * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-stone-200/70 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.round((roomMatchBreakdown.genderScore / 20) * 100))}%` }}
                        />
                      </div>
                    </div>

                    {/* 4. House Rules & Lifestyle (Max 20 pts) */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                          House Rules &amp; Daily Rhythm
                        </span>
                        <span className="font-bold text-slate-600">
                          {Math.round((roomMatchBreakdown.rulesScore / 20) * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-stone-200/70 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.round((roomMatchBreakdown.rulesScore / 20) * 100))}%` }}
                        />
                      </div>
                    </div>

                    {/* 5. Trust & Verification (Max 15 pts) */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                          Trust Signals &amp; Verification
                        </span>
                        <span className="font-bold text-slate-600">
                          {Math.round((roomMatchBreakdown.trustScore / 15) * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-stone-200/70 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.round((roomMatchBreakdown.trustScore / 15) * 100))}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Match Factors Tags */}
              {roomMatchBreakdown && roomMatchBreakdown.reasons.length > 0 && (
                <div className="pt-4 border-t border-emerald-100">
                  <p className="text-xs font-bold text-slate-700 mb-2.5">
                    Why You &amp; This Space Align:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {roomMatchBreakdown.reasons.map((r, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 bg-white text-emerald-900 border border-emerald-200/80 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-2xs"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Caveats if any */}
              {roomMatchBreakdown && roomMatchBreakdown.caveats.length > 0 && (
                <div className="mt-3 pt-3 border-t border-emerald-100/70">
                  <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50/80 border border-amber-200/70 rounded-xl p-3">
                    <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Preferences to note: </span>
                      <span>{roomMatchBreakdown.caveats.join(' · ')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── C. Why You'll Love This Place ───────────────────────── */}
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900">
                Why you'll love this place
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  {
                    icon: <Lock className="w-5 h-5 text-fire" />,
                    bg: 'bg-orange-50 border-orange-100',
                    title: 'Direct Owner Handshake',
                    desc: 'No middleman, no agents, and zero broker commissions. Talk directly with the real owner.',
                  },
                  {
                    icon: <Tag className="w-5 h-5 text-teal-600" />,
                    bg: 'bg-teal-50 border-teal-100',
                    title: 'Zero Brokerage Guaranteed',
                    desc: 'Every single rupee of your monthly budget goes straight toward your rent, keeping costs transparent.',
                  },
                  {
                    icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
                    bg: 'bg-emerald-50 border-emerald-100',
                    title: 'Consent-Based Contact',
                    desc: 'Chat securely in-app first. Phone numbers and personal details are shared only when both sides agree.',
                  },
                  {
                    icon: <Sparkles className="w-5 h-5 text-amber-600" />,
                    bg: 'bg-amber-50 border-amber-100',
                    title: 'Verified Availability Freshness',
                    desc: 'Active listings confirmed directly by the host so you do not waste time chasing ghost properties.',
                  },
                ].map((card) => (
                  <div
                    key={card.title}
                    className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex gap-4 items-start"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 ${card.bg}`}>
                      {card.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 mb-1">
                        {card.title}
                      </h3>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {card.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── D. About This Room ─────────────────────────────────── */}
            <section className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-7 shadow-xs space-y-4">
              <h2 className="text-xl font-bold text-slate-900">
                About this room
              </h2>

              {!room.description ? (
                <div className="py-4 text-center border border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
                  <p className="text-sm text-slate-500 italic">
                    The owner hasn't added an extended description yet.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Feel free to ask questions about the room layout in your introductory message!
                  </p>
                </div>
              ) : (
                <div className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-700 whitespace-pre-wrap">
                  {room.description}
                </div>
              )}
            </section>

            {/* ── E. Where You'll Sleep & Space Layout ───────────────── */}
            <section className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-7 shadow-xs space-y-4">
              <h2 className="text-xl font-bold text-slate-900">
                Where you'll sleep
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#FBF9F5] border border-stone-200/70 rounded-2xl p-5 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-fire flex items-center justify-center border border-orange-100">
                    <Bed className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {room.flatType ? `${room.flatType} Private Suite` : 'Private Bedroom'}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {room.furnishing || 'Furnishing status as listed'}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-stone-200/50 flex items-center gap-2 text-xs text-slate-600">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Private lockable room door</span>
                  </div>
                </div>

                <div className="bg-[#FBF9F5] border border-stone-200/70 rounded-2xl p-5 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                    <Home className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Shared Common Areas
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Living room, kitchen &amp; utility spaces
                    </p>
                  </div>
                  <div className="pt-2 border-t border-stone-200/50 flex items-center gap-2 text-xs text-slate-600">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Access to building amenities</span>
                  </div>
                </div>
              </div>
            </section>

            {/* ── F. Amenities ("What this place offers") ────────────── */}
            {room.amenities && room.amenities.length > 0 && (
              <section className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-7 shadow-xs space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">
                    What this place offers
                  </h2>
                  <span className="text-xs font-semibold text-slate-400">
                    {room.amenities.length} amenities included
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {room.amenities.map(a => (
                    <div
                      key={a}
                      className="bg-[#FBF9F5] border border-stone-200/70 rounded-xl px-4 py-3.5 flex items-center gap-3 hover:border-stone-300 transition-all duration-150"
                    >
                      <span className="flex-shrink-0">
                        {amenityIcons[a] || <Check className="w-4 h-4 text-slate-500" />}
                      </span>
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {a}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── G. House Rules & Resident Preferences ──────────────── */}
            {room.houseRules && room.houseRules.length > 0 && (
              <section className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-7 shadow-xs space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">
                    House rules &amp; expectations
                  </h2>
                  <span className="text-xs font-semibold text-slate-400">
                    Host guidelines
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {room.houseRules.map(r => {
                    const isStrict = r.toLowerCase().includes('no ') || r.toLowerCase().includes('strictly');
                    return (
                      <div
                        key={r}
                        className={`rounded-xl px-4 py-3 flex items-center gap-3 border transition-colors ${
                          isStrict
                            ? 'bg-amber-50/50 border-amber-200/70 text-amber-900'
                            : 'bg-[#FBF9F5] border-stone-200/70 text-slate-800'
                        }`}
                      >
                        {isStrict ? (
                          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        )}
                        <span className="text-xs font-bold leading-snug">{r}</span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ── H. Safety & Trust Guarantee Banner ─────────────────── */}
            <section className="rounded-3xl bg-gradient-to-br from-[#1E3A5F] via-[#162A45] to-[#0F1E32] text-white p-6 sm:p-8 shadow-md relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-start gap-5">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/20 shadow-inner">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="space-y-2 flex-1">
                  <h3 className="text-base font-bold text-white">
                    NestMate Safety &amp; Trust Assurance
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    NestMate verifies owner credentials, enforces strict zero-brokerage policies, and keeps your direct phone number confidential until you decide to connect.
                  </p>
                  <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ID-Verified Listings
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      In-App Safe Handshake
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Zero Hidden Brokerage
                    </span>
                  </div>
                </div>
              </div>
            </section>

          </div>

          {/* ════ RIGHT COLUMN: Luxury Sticky Booking Card ══════════════ */}
          <div ref={cardRef} className="hidden lg:block">
            <div className="sticky top-20">
              <div className="bg-white rounded-3xl border border-stone-200/90 shadow-[0_16px_48px_-12px_rgba(0,0,0,0.12)] overflow-hidden">

                {/* Glowing top accent line */}
                <div className="h-1.5 bg-gradient-to-r from-fire via-orange-500 to-amber-500" />

                <div className="p-6 sm:p-7 space-y-6">

                  {/* 1. Price Showcase */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                          ₹{rentShare.toLocaleString()}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">/ month</span>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-400 mt-1">
                        Your share · Total flat rent ₹{room.totalRent?.toLocaleString() || rentShare.toLocaleString()}
                      </p>
                    </div>

                    {compatibility > 0 && (
                      <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-xs font-extrabold px-3 py-1 rounded-full border border-emerald-200 shadow-2xs">
                        <Zap className="w-3 h-3 fill-emerald-500 text-emerald-600" />
                        {compatibility}% match
                      </span>
                    )}
                  </div>

                  {/* 2. Key Details Dual-Tile */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#FBF9F5] rounded-2xl p-3.5 border border-stone-200/60">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Move-in Date
                      </div>
                      <p className={`text-xs font-extrabold truncate ${room.availableFrom ? 'text-slate-900' : 'text-slate-400'}`}>
                        {room.availableFrom || 'Flexible'}
                      </p>
                    </div>

                    <div className="bg-[#FBF9F5] rounded-2xl p-3.5 border border-stone-200/60">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        <Lock className="w-3 h-3 text-slate-400" />
                        Security Deposit
                      </div>
                      <p className={`text-xs font-extrabold truncate ${deposit > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                        {depositLabel}
                      </p>
                    </div>
                  </div>

                  {/* 3. Personalized Handshake Message */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="intro-msg" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5 text-fire" />
                        Intro Message to {room.ownerName || 'Host'}
                      </label>
                      <span className="text-[10px] font-semibold text-slate-400">
                        Editable
                      </span>
                    </div>

                    {/* Quick suggestion chips */}
                    <div className="flex flex-wrap gap-2">
                      {QUICK_PROMPTS.map((q) => {
                        const Icon = q.icon;
                        return (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => handleQuickPromptClick(q.text)}
                            className="inline-flex items-center gap-2 text-[11px] font-semibold text-slate-700 bg-white hover:bg-orange-50/80 hover:text-fire hover:border-orange-300 border border-stone-200/90 px-3 py-1.5 rounded-xl transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs group active:scale-[0.98]"
                          >
                            <span className={`w-5 h-5 rounded-lg flex items-center justify-center border ${q.iconBg} flex-shrink-0 transition-colors group-hover:bg-white`}>
                              <Icon className={`w-3 h-3 ${q.iconColor}`} />
                            </span>
                            <span>{q.text}</span>
                          </button>
                        );
                      })}
                    </div>

                    <textarea
                      id="intro-msg"
                      value={introMsg}
                      onChange={e => setIntroMsg(e.target.value)}
                      rows={3}
                      className="w-full text-xs bg-[#FBF9F5] border border-stone-200 rounded-2xl px-3.5 py-3 text-slate-800 resize-none outline-none focus:border-fire focus:ring-2 focus:ring-fire/15 transition-all duration-150 font-medium leading-relaxed placeholder:text-slate-400"
                      placeholder="Introduce yourself and tell the host when you would like to move in or visit…"
                    />
                  </div>

                  {/* 4. High-Impact CTA Buttons */}
                  <div className="space-y-2.5">
                    <button
                      onClick={handleConnect}
                      disabled={connecting || requestSent}
                      aria-live="polite"
                      className={`w-full min-h-[52px] flex items-center justify-center gap-2.5 font-extrabold text-sm rounded-2xl shadow-md transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed ${
                        requestSent
                          ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                          : 'bg-gradient-to-r from-fire via-fire-dark to-[#D44310] hover:from-[#E85B24] hover:to-[#B8380A] text-white shadow-[0_6px_20px_rgba(229,80,26,0.35)] hover:shadow-[0_8px_25px_rgba(229,80,26,0.45)]'
                      }`}
                    >
                      {connecting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : requestSent ? (
                        <CheckCheck className="w-5 h-5 text-white" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      <span>
                        {connecting
                          ? 'Sending Handshake…'
                          : requestSent
                            ? 'Interest Sent to Owner'
                            : 'Express Interest (Direct Handshake)'}
                      </span>
                    </button>

                    <button
                      onClick={handleToggleSave}
                      disabled={savingRoom}
                      className={`w-full min-h-[44px] flex items-center justify-center gap-2 text-xs font-bold rounded-2xl border transition-all duration-200 cursor-pointer ${
                        isSaved
                          ? 'bg-rose-50 border-rose-200 text-rose-600'
                          : 'bg-white border-stone-200 text-slate-600 hover:border-stone-300 hover:text-slate-900 hover:bg-stone-50'
                      }`}
                    >
                      {savingRoom ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Heart className={`w-4 h-4 transition-all duration-200 ${isSaved ? 'fill-rose-500 text-rose-500 scale-110' : 'text-slate-400'}`} />
                      )}
                      <span>{isSaved ? 'Saved in Shortlist' : 'Save to Shortlist'}</span>
                    </button>
                  </div>

                  {/* 5. Transparent Cost Breakdown */}
                  <div className="bg-[#FBF9F5] rounded-2xl p-4 border border-stone-200/60 space-y-2.5">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
                      Move-in Cost Transparency
                    </p>
                    {[
                      { label: 'Roommate Monthly Rent Share', value: `₹${rentShare.toLocaleString()}`, accent: false },
                      { label: 'Refundable Security Deposit', value: depositLabel, accent: false },
                      { label: 'NestMate Brokerage Fee', value: '₹0 (100% Free)', accent: true },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">{row.label}</span>
                        <span className={`font-bold ${row.accent ? 'text-emerald-700' : 'text-slate-800'}`}>
                          {row.value}
                        </span>
                      </div>
                    ))}
                    <div className="pt-2.5 border-t border-stone-200/70 flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900">Total Due to Move-In</span>
                      <span className="text-sm font-black text-fire">
                        {deposit > 0 ? `₹${(rentShare + deposit).toLocaleString()}` : `${depositLabel} + rent`}
                      </span>
                    </div>
                  </div>

                  {/* 6. Security Micro-Seals */}
                  <div className="flex items-center justify-center gap-4 pt-1 text-[11px] font-bold text-slate-400">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      ID Verified
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-fire" />
                      Safe Chat
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-teal-600" />
                      Zero Brokerage
                    </span>
                  </div>

                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ── Mobile Floating Bottom Bar ─────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-stone-200 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.10)]">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rent Share</p>
            <p className="text-lg font-black text-slate-900 leading-none">
              ₹{rentShare.toLocaleString()}
              <span className="text-xs font-semibold text-slate-500 ml-1">/mo</span>
            </p>
          </div>

          <button
            onClick={handleToggleSave}
            aria-label={isSaved ? 'Remove from saved' : 'Save listing'}
            className={`w-12 h-12 flex items-center justify-center rounded-2xl border flex-shrink-0 transition-all duration-200 cursor-pointer ${
              isSaved ? 'bg-rose-50 border-rose-200 text-rose-600' : 'border-stone-200 text-slate-500 bg-white'
            }`}
          >
            <Heart className={`w-5 h-5 transition-all duration-200 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          <button
            onClick={handleConnect}
            disabled={connecting || requestSent}
            className={`flex-1 min-h-[48px] flex items-center justify-center gap-2 font-bold text-xs rounded-2xl transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed ${
              requestSent
                ? 'bg-emerald-600 text-white'
                : 'bg-fire hover:bg-fire-dark text-white shadow-md'
            }`}
          >
            {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>{connecting ? 'Sending…' : requestSent ? 'Handshake Sent' : 'Express Interest'}</span>
          </button>
        </div>
      </div>

      {/* ── Fullscreen Lightbox Modal ───────────────────────────────── */}
      {showLightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label="Photo gallery"
        >
          {/* Lightbox Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <span className="text-white/80 text-xs font-bold tracking-wider">
              {lightboxIdx + 1} OF {photos.length} PHOTOS
            </span>
            <button
              onClick={() => setShowLightbox(false)}
              aria-label="Close gallery"
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/15 text-white transition-colors duration-150 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main Stage */}
          <div className="flex-1 flex items-center justify-center relative px-12 py-4">
            <img
              src={photos[lightboxIdx]}
              alt={`Photo ${lightboxIdx + 1}`}
              className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl transition-all duration-300"
            />
            {photos.length > 1 && (
              <>
                <button
                  onClick={() => setLightboxIdx(p => (p === 0 ? photos.length - 1 : p - 1))}
                  aria-label="Previous photo"
                  className="absolute left-4 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors duration-150 cursor-pointer backdrop-blur-md border border-white/20"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setLightboxIdx(p => (p === photos.length - 1 ? 0 : p + 1))}
                  aria-label="Next photo"
                  className="absolute right-4 w-12 h-12 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors duration-150 cursor-pointer backdrop-blur-md border border-white/20"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail Strip */}
          <div className="py-4 px-6 flex justify-center gap-3 overflow-x-auto border-t border-white/10 bg-black/40">
            {photos.map((src, i) => (
              <button
                key={i}
                onClick={() => setLightboxIdx(i)}
                aria-label={`View photo ${i + 1}`}
                className={`flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all duration-200 cursor-pointer ${
                  i === lightboxIdx
                    ? 'border-fire scale-105 shadow-lg shadow-fire/30'
                    : 'border-white/20 opacity-50 hover:opacity-80'
                }`}
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
