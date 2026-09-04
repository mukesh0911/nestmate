import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Heart, Share2, MapPin, MessageCircle,
  Wifi, Wind, Car, Dumbbell, Droplets, Refrigerator, Tv, Check,
  Bed, Loader2, Copy, LayoutGrid, X, ChevronLeft, ChevronRight,
  ShieldCheck, Users, Calendar, Sparkles, CheckCircle2, Lock,
  ExternalLink, Star, Tag, Zap, Image as ImageIcon
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useListings } from '@/hooks/useListings';
import { useAuth } from '@/hooks/useAuth';
import { useConnections } from '@/hooks/useConnections';
import { useNotifications } from '@/hooks/useNotifications';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAnalytics } from '@/hooks/useAnalytics';
import { calculateCompatibility } from '@/hooks/useMatches';
import type { Listing } from '@/hooks/useListings';
import { useStore } from '@/store/useStore';
import { getAvailabilityState, getFreshnessAnchorMs, formatRelativeDays, isDiscoverable } from '@/lib/listingFreshness';
import {
  getListingPhotos,
  hasOwnerPreferences,
  formatDepositINR,
} from '@/lib/displayTruth';
import StateLoading from '@/components/StateLoading';
import StateEmpty from '@/components/StateEmpty';

/* ─── Amenity Icons Map ─────────────────────────────────────────────── */
const amenityIcons: Record<string, React.ReactNode> = {
  WiFi: <Wifi className="w-4 h-4" />,
  AC: <Wind className="w-4 h-4" />,
  Parking: <Car className="w-4 h-4" />,
  'Washing Machine': <Droplets className="w-4 h-4" />,
  Gym: <Dumbbell className="w-4 h-4" />,
  Geyser: <Droplets className="w-4 h-4" />,
  Fridge: <Refrigerator className="w-4 h-4" />,
  TV: <Tv className="w-4 h-4" />,
  'RO Water': <Droplets className="w-4 h-4" />,
  'Kitchen Access': <Sparkles className="w-4 h-4" />,
};

/* ─── Benefit Card Data ─────────────────────────────────────────────── */
// Sprint 2C (M3): the lifestyle-match card is shown ONLY when a real
// compatibility score exists. No fabricated percentages.
const BENEFIT_CARDS = (match: number | null) => [
  ...(match !== null && match > 0
    ? [{
      icon: <Star className="w-5 h-5" />,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      label: `${match}% Lifestyle Match`,
      desc: 'Your habits, schedule & preferences align strongly with this owner.',
    }]
    : []),
  {
    icon: <Lock className="w-5 h-5" />,
    color: 'text-fire',
    bg: 'bg-fire-light',
    border: 'border-fire/10',
    label: 'Direct Owner',
    desc: 'Chat securely in-app first. Phone shared only when both agree.',
  },
  {
    icon: <Tag className="w-5 h-5" />,
    color: 'text-teal',
    bg: 'bg-teal-light',
    border: 'border-teal/10',
    label: 'Zero Brokerage',
    desc: 'No hidden agent fees. Every rupee you pay goes directly to the owner.',
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    // Sprint 2B: truthful trust copy — NestMate does NOT manually review rooms.
    label: 'Consent-Based Contact',
    desc: 'Phone numbers are shared only when both people agree.',
  },
];

/* ─── Main Component ────────────────────────────────────────────────── */
export default function RoomDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { getListingById, recordView } = useListings();
  const { sendRequest } = useConnections();
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
  const cardRef = useRef<HTMLDivElement>(null);

  const isSaved = !!(profile?.savedRoomIds && id && profile.savedRoomIds.includes(id));

  // Sprint 5B: seed the intro message via effect — never setState during render
  useEffect(() => {
    if (room && !introMsg) {
      setIntroMsg(`Hi ${room.ownerName || 'there'}! I saw your ${room.flatType} room in ${room.locality}. I'd love to connect!`);
    }
  }, [room, introMsg]);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getListingById(id).then(data => {
      setRoom(data);
      setIsLoading(false);
    });
    recordView(id).catch(() => { });
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
      // Sprint 2D: funnel event (fire-and-forget)
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

  /* ── States ─────────────────────────────────────────────────────── */
  if (isLoading) return <StateLoading label="Loading listing…" fullScreen />;

  if (!room) return (
    <div className="min-h-screen bg-parchment flex items-center justify-center px-4">
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

  // SECURITY: Block public access to listings that are pending owner identity verification.
  // Even if someone has a direct URL, an unverified listing must not be accessible.
  // Exception: the listing owner may view their own listing (handled below by checking ownerId).
  const isOwnListing = user?.uid && room.ownerId === user.uid;
  if (!isOwnListing && (room.status === 'pending_verification' || room.ownerVerified === false)) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center px-4">
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

  // Sprint 2A: closed/expired/paused listings are never presented as active,
  // even via old saved links or shared URLs. Existing connections/chat are
  // untouched — only new marketplace actions are blocked.
  if (!isDiscoverable(room)) {
    const state = getAvailabilityState(room);
    const reason = state === 'closed'
      ? 'The owner has marked this room as no longer available.'
      : state === 'paused'
        ? 'This listing has been paused by the owner.'
        : 'This listing has not been confirmed as available recently.';
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center px-4">
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

  /* ── Data ────────────────────────────────────────────────────────── */
  // Sprint 4A (truth): ONLY real uploaded images are rendered. When a listing
  // has no photos we show an explicit empty-photo state — never stock imagery.
  const { photos, hasRealPhotos } = getListingPhotos(room.images);

  // Sprint 4A (truth): compatibility is computed ONLY from the owner's REAL
  // quiz answers. Missing owner preferences → no score is shown at all.
  const compatibility =
    profile && hasOwnerPreferences(room.ownerQuizAnswers)
      ? Math.max(0, calculateCompatibility(
        profile.quizAnswers || {},
        room.ownerQuizAnswers!,
        profile.city,
        room.city
      ))
      : 0;

  const rentShare = room.partnerShare || room.totalRent || 0;
  // Sprint 4A (truth): missing deposit is NEVER estimated (previously 2× rent).
  const deposit = typeof room.deposit === 'number' && room.deposit > 0 ? room.deposit : 0;
  const depositLabel = formatDepositINR(room.deposit);

  const benefits = BENEFIT_CARDS(compatibility > 0 ? compatibility : null);

  /* ── Render ──────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#F8F7F4] pb-28 lg:pb-10 text-ink overflow-x-hidden">

      {/* ── Toast ─────────────────────────────────────────────────── */}
      {copyToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-[72px] left-1/2 -translate-x-1/2 z-[60] bg-ink text-white text-xs font-semibold px-5 py-3 rounded-full shadow-xl flex items-center gap-2 animate-fade-up"
        >
          <Copy className="w-4 h-4 text-fire" />
          Link copied!
        </div>
      )}

      {/* ── Page Wrapper ──────────────────────────────────────────── */}
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 xl:px-8">

        {/* ── 1. Top Nav Bar ────────────────────────────────────── */}
        <div className="flex items-center justify-between py-4 sm:py-5">
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink/55 hover:text-ink transition-colors duration-150 cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform duration-150 group-hover:-translate-x-0.5" />
            <span>Back to search</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              aria-label="Share listing"
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-ink/60 hover:text-ink bg-white hover:bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl transition-all duration-150 cursor-pointer shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share
            </button>
            <button
              onClick={handleToggleSave}
              aria-label={isSaved ? 'Remove from saved' : 'Save listing'}
              className={`inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-xl border transition-all duration-200 cursor-pointer shadow-xs ${isSaved
                ? 'bg-fire text-white border-fire shadow-sm'
                : 'bg-white text-ink/60 hover:text-ink border-gray-200 hover:bg-gray-50'
                }`}
            >
              <Heart className={`w-3.5 h-3.5 transition-all duration-200 ${isSaved ? 'fill-white text-white scale-110' : ''}`} />
              {isSaved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        {/* ── 2. Listing Header ─────────────────────────────────── */}
        <div className="mb-5 space-y-2">
          {/* Sprint 5B: sans voice for page headings */}
          <h1 className="type-h1 text-ink leading-tight">
            {room.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-[13px] text-ink/60 font-medium">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-fire flex-shrink-0" />
              {room.locality}, {room.city}
            </span>
            {compatibility > 0 && (
              <>
                <span className="text-ink/20" aria-hidden>·</span>
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-200 text-[11px] tracking-wide">
                  <Zap className="w-3 h-3 text-emerald-600 fill-emerald-200" />
                  {compatibility}% Lifestyle Match
                </span>
              </>
            )}
          </div>
        </div>

        {/* ── 3. Photo Gallery (Desktop 5-grid / Mobile Banner) ── */}

        {/* Sprint 4A (truth): explicit empty-photo state — never stock imagery */}
        {!hasRealPhotos && (
          <div className="rounded-2xl overflow-hidden border border-dashed border-gray-200 bg-[#F8F7F4] flex flex-col items-center justify-center text-center" style={{ height: '280px' }}>
            <ImageIcon className="w-10 h-10 text-ink/25 mb-3" />
            <p className="text-sm font-bold text-ink/60">No photos yet</p>
            <p className="text-xs text-ink/40 mt-1 max-w-xs">The owner hasn't added photos to this listing.</p>
          </div>
        )}

        {/* Desktop 5-photo Airbnb-style grid (only when real photos exist) */}
        {hasRealPhotos && (
          <div
            className="relative hidden md:grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden"
            style={{ height: '480px' }}
          >
            {/* Primary large left */}
            <div
              className="col-span-2 row-span-2 relative cursor-pointer group overflow-hidden"
              onClick={() => { setLightboxIdx(0); setShowLightbox(true); }}
            >
              <img
                src={photos[0]}
                alt={room.title}
                loading="eager"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              {/* Availability confirmation badge (Sprint 2B: truthful signal) */}
              {(() => {
                const avail = getAvailabilityState(room);
                const fresh = avail === 'available';
                return (
                  <div className={`absolute top-4 left-4 flex items-center gap-1.5 backdrop-blur-md font-bold text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full shadow-md border ${fresh ? 'bg-white/95 text-emerald-800 border-emerald-100' : 'bg-amber-50/95 text-amber-800 border-amber-200'}`}>
                    <ShieldCheck className={`w-3.5 h-3.5 ${fresh ? 'text-emerald-600' : 'text-amber-600'}`} />
                    {fresh ? `Available · confirmed ${formatRelativeDays(getFreshnessAnchorMs(room))}` : 'Availability needs confirmation'}
                  </div>
                );
              })()}
            </div>

            {/* Supporting images (render ONLY slots that have real photos) */}
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
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
              </div>
            ))}

            {/* "Show all" overlay button */}
            <button
              onClick={() => { setLightboxIdx(0); setShowLightbox(true); }}
              className="absolute bottom-4 right-4 inline-flex items-center gap-2 bg-white/95 backdrop-blur-md hover:bg-white text-ink text-[12px] font-bold px-4 py-2.5 rounded-xl border border-gray-200 shadow-md transition-all duration-150 cursor-pointer z-10"
              style={{ position: 'absolute' }}
            >
              <LayoutGrid className="w-4 h-4" />
              View all {photos.length} photos
            </button>
          </div>
        )}
        {/* Mobile single photo */}
        {hasRealPhotos && (
          <div
            className="md:hidden relative rounded-2xl overflow-hidden"
            style={{ height: '240px' }}
          >
            <img
              src={photos[0]}
              alt={room.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            {/* Availability confirmation badge (truthful signal) */}
            <div className={`absolute top-3 left-3 flex items-center gap-1 font-bold text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full border ${getAvailabilityState(room) === 'available' ? 'bg-white/95 text-emerald-800 border-emerald-100' : 'bg-amber-50/95 text-amber-800 border-amber-200'}`}>
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              {getAvailabilityState(room) === 'available' ? 'Confirmed Available' : 'Needs Confirmation'}
            </div>
            {/* Photo count pill */}
            <button
              onClick={() => { setLightboxIdx(0); setShowLightbox(true); }}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-black/60 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg backdrop-blur-sm cursor-pointer"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              {photos.length} photos
            </button>
          </div>
        )}

        {/* ── 4. Quick Stats Strip ───────────────────────────────── */}
        <div className="my-6 bg-white rounded-2xl border border-gray-100 shadow-xs px-4 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-0 sm:divide-x sm:divide-gray-100">
          {/* Sprint 4A (truth): every stat falls back to an explicit neutral
              state — never an invented default ("Semi-Furnished"/"Immediately"/"1BHK"). */}
          {[
            { icon: <Users className="w-4 h-4 text-fire" />, label: 'Roommates', value: room.partnersNeeded ? `${room.partnersNeeded} needed` : 'Not specified' },
            { icon: <Sparkles className="w-4 h-4 text-fire" />, label: 'Furnishing', value: room.furnishing || 'Not specified' },
            { icon: <Calendar className="w-4 h-4 text-fire" />, label: 'Available', value: room.availableFrom || 'Not specified' },
            { icon: <Bed className="w-4 h-4 text-fire" />, label: 'Room Type', value: room.flatType ? `${room.flatType} Private` : 'Not specified' },
          ].map(({ icon, label, value }) => (
            <div key={label} className="flex flex-col items-start sm:items-center gap-1 sm:px-4">
              <div className="flex items-center gap-1.5 text-ink/50 text-[11px] font-semibold uppercase tracking-wider">
                {icon}
                {label}
              </div>
              <span className="text-[13px] font-bold text-ink">{value}</span>
            </div>
          ))}
        </div>

        {/* ── 5. Two-Column Editorial Layout ────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 xl:gap-14 items-start">

          {/* ════ LEFT: Main Content ════════════════════════════════ */}
          <div className="space-y-10 min-w-0">

            {/* Owner row */}
            <div className="flex items-center justify-between pb-8 border-b border-gray-100">
              <div>
                <h2 className="text-[17px] font-bold text-ink leading-tight">
                  {room.flatType} listed by {room.ownerName || 'the owner'}
                </h2>
                <p className="text-[13px] text-ink/50 font-medium mt-0.5">
                  {room.locality}, {room.city} · Direct Owner
                </p>
              </div>
              <div className="relative flex-shrink-0">
                {/* Sprint 5B: no external avatar services — local initial fallback */}
                {room.ownerAvatar ? (
                  <img
                    src={room.ownerAvatar}
                    alt={room.ownerName || 'Owner'}
                    className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-fire/10 border-2 border-white shadow-md flex items-center justify-center text-lg font-bold text-fire">
                    {(room.ownerName || 'O').charAt(0).toUpperCase()}
                  </div>
                )}
                {room.isOwnerVerified && (
                  <span
                    className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm"
                    title="Verified Owner"
                  >
                    <Check className="w-2.5 h-2.5 text-white" />
                  </span>
                )}
              </div>
            </div>

            {/* ── Why you'll love this place ──────────────────── */}
            <section>
              <h3 className="type-h2 text-ink mb-5">Why you'll love this place</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((b) => (
                  <div
                    key={b.label}
                    className={`flex gap-4 p-4 rounded-2xl border ${b.bg} ${b.border} transition-shadow duration-200 hover:shadow-sm`}
                  >
                    <span className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-white shadow-xs ${b.color}`}>
                      {b.icon}
                    </span>
                    <div>
                      <p className={`text-[13px] font-bold ${b.color} mb-0.5`}>{b.label}</p>
                      <p className="text-[12px] text-ink/60 leading-relaxed">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── About this room ─────────────────────────────── */}
            <section className="pb-8 border-b border-gray-100 space-y-4">
              <h3 className="type-h2 text-ink">About this room</h3>
              {/* Sprint 4A (truth): removed hardcoded bedroom/bathroom/kitchen/hall
                  chips — those facts were invented for every listing. Only the
                  owner's real description is shown. */}
              {!room.description && (
                <p className="text-[14px] text-ink/50 italic">The owner hasn't added a description for this room yet.</p>
              )}
              {room.description && (
                <p className="text-[14px] text-ink/75 leading-relaxed whitespace-pre-wrap">
                  {room.description}
                </p>
              )}
            </section>

            {/* ── Where you'll sleep ──────────────────────────── */}
            <section className="pb-8 border-b border-gray-100 space-y-4">
              <h3 className="type-h2 text-ink">Where you'll sleep</h3>
              {/* Sprint 4A (truth): removed invented "Single Bed · AC Room" and
                  "Spacious & Well-ventilated" claims — only the real flat type
                  is shown; everything else stays unspecified. */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs max-w-[240px] space-y-3">
                <div className="w-11 h-11 rounded-xl bg-fire-light flex items-center justify-center">
                  <Bed className="w-5 h-5 text-fire" />
                </div>
                <div>
                  <p className="text-[14px] font-bold text-ink">{room.flatType ? `${room.flatType} Private Room` : 'Private Room'}</p>
                  <p className="text-[12px] text-ink/50 mt-0.5">Bed & furnishing details not specified by owner</p>
                </div>
              </div>
            </section>

            {/* ── Amenities ───────────────────────────────────── */}
            {room.amenities?.length > 0 && (
              <section className="pb-8 border-b border-gray-100 space-y-4">
                <h3 className="type-h2 text-ink">What this place offers</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {room.amenities.map(a => (
                    <div
                      key={a}
                      className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3 shadow-xs hover:shadow-sm transition-shadow duration-150"
                    >
                      <span className="text-ink/50 flex-shrink-0">
                        {amenityIcons[a] || <Check className="w-4 h-4" />}
                      </span>
                      <span className="text-[13px] font-semibold text-ink">{a}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── House Rules ─────────────────────────────────── */}
            {room.houseRules?.length > 0 && (
              <section className="pb-8 border-b border-gray-100 space-y-4">
                <h3 className="type-h2 text-ink">House rules &amp; preferences</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {room.houseRules.map(r => (
                    <div key={r} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3 shadow-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="text-[13px] font-semibold text-ink">{r}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Trust Banner ─────────────────────────────────── */}
            <section className="rounded-2xl bg-gradient-to-br from-navy-light to-[#EFF4FB] border border-navy/10 p-6 flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-navy flex items-center justify-center flex-shrink-0 shadow-sm">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-[15px] font-bold text-ink mb-1">Safety tools built in</h4>
                <p className="text-[13px] text-ink/60 leading-relaxed mb-3">
                  NestMate verifies IDs where shown, keeps contact details private until both sides agree, and gives you reporting and blocking on every profile. Always meet safely and use your own judgement.
                </p>
                <button
                  onClick={() => navigate('/privacy')}
                  className="inline-flex items-center gap-1.5 text-[12px] font-bold text-navy hover:underline cursor-pointer"
                >
                  Learn how NestMate protects you
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </section>

          </div>

          {/* ════ RIGHT: Sticky Conversion Card ════════════════════ */}
          <div ref={cardRef} className="hidden lg:block">
            <div className="sticky top-[80px]">
              <div className="bg-white rounded-2xl border border-gray-150 shadow-[0_8px_40px_rgba(0,0,0,0.10)] overflow-hidden">

                {/* Card header — gradient accent bar */}
                <div className="h-1.5 bg-gradient-to-r from-fire via-fire-dark to-[#C4410F]" />

                <div className="p-6 space-y-5">

                  {/* Pricing */}
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[32px] font-extrabold text-ink tracking-tight">
                          ₹{rentShare.toLocaleString()}
                        </span>
                        <span className="text-[13px] text-ink/45 font-medium">/month</span>
                      </div>
                      <p className="text-[11px] text-ink/40 font-medium mt-0.5">Your share · Total rent ₹{room.totalRent?.toLocaleString() || rentShare.toLocaleString()}</p>
                    </div>
                    {compatibility > 0 && (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-[11px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-200">
                        <Zap className="w-3 h-3 fill-emerald-300 text-emerald-600" />
                        {compatibility}% match
                      </span>
                    )}
                  </div>

                  {/* Key Details */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="bg-[#F8F7F4] rounded-xl p-3">
                      <p className="text-[10px] font-bold text-ink/40 uppercase tracking-wider mb-1">Available From</p>
                      {/* Sprint 4A (truth): no invented "Immediately" default. */}
                      <p className={`text-[13px] font-bold ${room.availableFrom ? 'text-fire' : 'text-ink/40'}`}>{room.availableFrom || 'Not specified'}</p>
                    </div>
                    <div className="bg-[#F8F7F4] rounded-xl p-3">
                      <p className="text-[10px] font-bold text-ink/40 uppercase tracking-wider mb-1">Security Deposit</p>
                      <p className={`text-[13px] font-bold ${deposit > 0 ? 'text-emerald-700' : 'text-ink/40'}`}>{depositLabel}</p>
                    </div>
                  </div>

                  {/* Message Owner */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {/* Sprint 5B: no external avatar services */}
                      {room.ownerAvatar ? (
                        <img
                          src={room.ownerAvatar}
                          alt=""
                          className="w-5 h-5 rounded-full object-cover border border-gray-200 flex-shrink-0"
                        />
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-fire/10 text-fire text-[10px] font-bold flex items-center justify-center border border-gray-200 flex-shrink-0">
                          {(room.ownerName || 'O').charAt(0).toUpperCase()}
                        </span>
                      )}
                      <label htmlFor="intro-msg" className="text-[12px] font-bold text-ink/70">
                        Intro message to {room.ownerName || 'Owner'}
                      </label>
                    </div>
                    <textarea
                      id="intro-msg"
                      value={introMsg}
                      onChange={e => setIntroMsg(e.target.value)}
                      rows={3}
                      className="w-full text-[13px] bg-[#F8F7F4] border border-gray-200 rounded-xl px-3.5 py-3 text-ink/80 resize-none outline-none focus:border-fire focus:ring-2 focus:ring-fire/15 transition-all duration-150 font-medium leading-relaxed"
                      placeholder="Write a short intro…"
                    />
                  </div>

                  {/* CTAs */}
                  <div className="space-y-2.5">
                    <button
                      onClick={handleConnect}
                      disabled={connecting || requestSent}
                      aria-live="polite"
                      className="w-full min-h-[50px] flex items-center justify-center gap-2.5 bg-fire hover:bg-fire-dark active:scale-[0.98] text-white font-bold text-[14px] rounded-2xl shadow-[0_4px_16px_rgba(229,80,26,0.35)] hover:shadow-[0_6px_20px_rgba(229,80,26,0.45)] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {connecting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : requestSent ? (
                        <CheckCircle2 className="w-5 h-5 text-white/90" />
                      ) : (
                        <MessageCircle className="w-5 h-5" />
                      )}
                      {connecting ? 'Sending…' : requestSent ? 'Interest Sent ✓' : 'Express Interest'}
                    </button>

                    <button
                      onClick={handleToggleSave}
                      disabled={savingRoom}
                      className={`w-full min-h-[44px] flex items-center justify-center gap-2 text-[13px] font-bold rounded-2xl border transition-all duration-200 cursor-pointer ${isSaved
                        ? 'bg-fire/8 border-fire/25 text-fire'
                        : 'bg-white border-gray-200 text-ink/60 hover:border-gray-300 hover:text-ink hover:bg-gray-50'
                        }`}
                    >
                      {savingRoom
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Heart className={`w-4 h-4 transition-all duration-200 ${isSaved ? 'fill-fire text-fire scale-110' : ''}`} />
                      }
                      {isSaved ? 'Saved in Shortlist' : 'Save Listing'}
                    </button>
                  </div>

                  {/* Cost Breakdown */}
                  <div className="bg-[#F8F7F4] rounded-2xl p-4 space-y-2.5">
                    <p className="text-[11px] font-extrabold text-ink/40 uppercase tracking-wider mb-3">Cost Breakdown</p>
                    {[
                      { label: 'Roommate Rent Share', value: `₹${rentShare.toLocaleString()}`, accent: false },
                      { label: 'Refundable Deposit', value: depositLabel, accent: false },
                      { label: 'NestMate Brokerage', value: '₹0 (Free!)', accent: true },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between text-[12px]">
                        <span className="text-ink/55 font-medium">{row.label}</span>
                        <span className={`font-bold ${row.accent ? 'text-emerald-700' : 'text-ink'}`}>
                          {row.value}
                        </span>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                      <span className="text-[13px] font-extrabold text-ink">Due to Move-in</span>
                      {/* Sprint 4A (truth): total shown only when deposit is known;
                          otherwise stating a total would imply a known deposit. */}
                      <span className="text-[15px] font-extrabold text-fire">
                        {deposit > 0 ? `₹${(rentShare + deposit).toLocaleString()}` : `${depositLabel} + rent`}
                      </span>
                    </div>
                  </div>

                  {/* Trust micro-badges */}
                  <div className="flex items-center justify-center gap-4 pt-1">
                    {[
                      ...(room.isOwnerVerified
                        ? [{ icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />, label: 'ID Verified Owner' }]
                        : []),
                      { icon: <Lock className="w-3.5 h-3.5 text-fire" />, label: 'Secure Chat' },
                      { icon: <Tag className="w-3.5 h-3.5 text-teal" />, label: 'Zero Brokerage' },
                    ].map(b => (
                      <div key={b.label} className="flex items-center gap-1 text-[10px] font-bold text-ink/45">
                        {b.icon}
                        {b.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
        {/* bottom spacer */}
        <div className="h-12" />
      </div>

      {/* ── Mobile Sticky Bottom Bar ───────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/96 backdrop-blur-xl border-t border-gray-200 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-3">
          {/* Price */}
          <div className="flex-1">
            <p className="text-[10px] font-bold text-ink/40 uppercase tracking-wider">Rent Share</p>
            <p className="text-[20px] font-extrabold text-ink leading-none">
              ₹{rentShare.toLocaleString()}<span className="text-[12px] font-normal text-ink/45">/mo</span>
            </p>
          </div>

          {/* Save */}
          <button
            onClick={handleToggleSave}
            aria-label={isSaved ? 'Remove from saved' : 'Save listing'}
            className={`w-12 h-12 flex items-center justify-center rounded-2xl border flex-shrink-0 transition-all duration-200 cursor-pointer ${isSaved ? 'bg-fire/10 border-fire/30 text-fire' : 'border-gray-200 text-ink/55 bg-white'
              }`}
          >
            <Heart className={`w-5 h-5 transition-all duration-200 ${isSaved ? 'fill-fire text-fire' : ''}`} />
          </button>

          {/* Express Interest */}
          <button
            onClick={handleConnect}
            disabled={connecting || requestSent}
            className="flex-1 min-h-[48px] flex items-center justify-center gap-2 bg-fire hover:bg-fire-dark text-white font-bold text-[14px] rounded-2xl shadow-[0_4px_16px_rgba(229,80,26,0.35)] transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
            {connecting ? 'Sending…' : requestSent ? 'Sent ✓' : 'Express Interest'}
          </button>
        </div>
      </div>

      {/* ── Lightbox ──────────────────────────────────────────────── */}
      {showLightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          role="dialog"
          aria-modal="true"
          aria-label="Photo gallery"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-white/60 text-[13px] font-semibold">
              {lightboxIdx + 1} / {photos.length}
            </span>
            <button
              onClick={() => setShowLightbox(false)}
              aria-label="Close gallery"
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors duration-150 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Main image */}
          <div className="flex-1 flex items-center justify-center relative px-12">
            <img
              src={photos[lightboxIdx]}
              alt={`Photo ${lightboxIdx + 1}`}
              className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-2xl"
            />
            {photos.length > 1 && (
              <>
                <button
                  onClick={() => setLightboxIdx(p => p === 0 ? photos.length - 1 : p - 1)}
                  aria-label="Previous photo"
                  className="absolute left-3 w-11 h-11 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors duration-150 cursor-pointer backdrop-blur-sm"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => setLightboxIdx(p => p === photos.length - 1 ? 0 : p + 1)}
                  aria-label="Next photo"
                  className="absolute right-3 w-11 h-11 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors duration-150 cursor-pointer backdrop-blur-sm"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          <div className="py-5 px-4 flex justify-center gap-2.5 overflow-x-auto scrollbar-none">
            {photos.map((src, i) => (
              <button
                key={i}
                onClick={() => setLightboxIdx(i)}
                aria-label={`View photo ${i + 1}`}
                className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 cursor-pointer ${i === lightboxIdx ? 'border-fire scale-105 shadow-lg shadow-fire/20' : 'border-white/20 opacity-50 hover:opacity-75'
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
