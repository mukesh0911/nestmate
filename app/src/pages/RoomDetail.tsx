import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Heart, Share2, MapPin, MessageCircle,
  Wifi, Wind, Car, Dumbbell, Droplets, Refrigerator, Tv, Check,
  Bed, Loader2, Copy, LayoutGrid, X, ChevronLeft, ChevronRight,
  ShieldCheck, Users, Calendar, Sparkles, CheckCircle2, Lock,
  ExternalLink, Star, Tag, Zap
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useListings } from '@/hooks/useListings';
import { useAuth } from '@/hooks/useAuth';
import { useConnections } from '@/hooks/useConnections';
import { useNotifications } from '@/hooks/useNotifications';
import { useUserProfile } from '@/hooks/useUserProfile';
import { calculateCompatibility } from '@/hooks/useMatches';
import type { Listing } from '@/hooks/useListings';
import { useStore } from '@/store/useStore';
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
const BENEFIT_CARDS = (match: number) => [
  {
    icon: <Star className="w-5 h-5" />,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    label: `${match}% Lifestyle Match`,
    desc: 'Your habits, schedule & preferences align strongly with this owner.',
  },
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
    label: 'Verified Room',
    desc: 'Photos and details manually reviewed for authenticity.',
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

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getListingById(id).then(data => {
      setRoom(data);
      setIsLoading(false);
    });
    recordView(id).catch(() => {});
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
    if (!room) return;
    setConnecting(true);
    try {
      await sendRequest(user.uid, room.ownerId);
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

  /* ── Data ────────────────────────────────────────────────────────── */
  const defaultImages = [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800&auto=format&fit=crop',
  ];

  const photos = room.images?.length > 0 ? room.images : defaultImages;
  const gridPhotos = [...photos];
  while (gridPhotos.length < 5) {
    gridPhotos.push(defaultImages[gridPhotos.length % defaultImages.length]);
  }

  const rawCompatibility = profile
    ? calculateCompatibility(
        profile.quizAnswers || {},
        room.ownerQuizAnswers || {},
        profile.city,
        room.city
      )
    : 0;
  const compatibility = rawCompatibility > 0 ? rawCompatibility : 0;

  const rentShare = room.partnerShare || room.totalRent || 0;
  const deposit = room.deposit || rentShare * 2 || 0;
  const defaultMsg = room
    ? `Hi ${room.ownerName || 'there'}! I saw your ${room.flatType} room in ${room.locality}${compatibility > 0 ? ` and we are a ${compatibility}% lifestyle match` : ''}. I'd love to connect!`
    : '';
  if (!introMsg && defaultMsg) setIntroMsg(defaultMsg);

  const benefits = BENEFIT_CARDS(compatibility > 0 ? compatibility : 85);

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
              className={`inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-2 rounded-xl border transition-all duration-200 cursor-pointer shadow-xs ${
                isSaved
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
          <h1 className="text-[28px] sm:text-[34px] lg:text-[40px] font-bold tracking-tight text-ink leading-tight font-display">
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

        {/* Desktop 5-photo Airbnb-style grid */}
        <div
          className="hidden md:grid grid-cols-4 grid-rows-2 gap-2 rounded-3xl overflow-hidden"
          style={{ height: '480px' }}
        >
          {/* Primary large left */}
          <div
            className="col-span-2 row-span-2 relative cursor-pointer group overflow-hidden"
            onClick={() => { setLightboxIdx(0); setShowLightbox(true); }}
          >
            <img
              src={gridPhotos[0]}
              alt={room.title}
              loading="eager"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {/* Verified badge */}
            <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-white/95 backdrop-blur-md text-emerald-800 font-bold text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full shadow-md border border-emerald-100">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Verified Room
            </div>
          </div>

          {/* Supporting images 2x2 */}
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="relative cursor-pointer group overflow-hidden"
              onClick={() => { setLightboxIdx(i); setShowLightbox(true); }}
            >
              <img
                src={gridPhotos[i]}
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
        {/* Mobile single photo */}
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
          {/* Verified badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-white/95 text-emerald-800 font-bold text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full border border-emerald-100">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            Verified
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

        {/* ── 4. Quick Stats Strip ───────────────────────────────── */}
        <div className="my-6 bg-white rounded-2xl border border-gray-100 shadow-xs px-4 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-0 sm:divide-x sm:divide-gray-100">
          {[
            { icon: <Users className="w-4 h-4 text-fire" />, label: 'Roommates', value: `${room.partnersNeeded ?? 1} needed` },
            { icon: <Sparkles className="w-4 h-4 text-fire" />, label: 'Furnishing', value: room.furnishing || 'Semi-Furnished' },
            { icon: <Calendar className="w-4 h-4 text-fire" />, label: 'Available', value: room.availableFrom || 'Immediately' },
            { icon: <Bed className="w-4 h-4 text-fire" />, label: 'Room Type', value: `${room.flatType ?? '1BHK'} Private` },
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
                  {room.flatType} listed by {room.ownerName || 'Property Owner'}
                </h2>
                <p className="text-[13px] text-ink/50 font-medium mt-0.5">
                  {room.locality}, {room.city} · Direct Owner
                </p>
              </div>
              <div className="relative flex-shrink-0">
                <img
                  src={room.ownerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${room.ownerName || 'owner'}`}
                  alt={room.ownerName || 'Owner'}
                  className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-md"
                />
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
              <h3 className="text-[20px] font-bold text-ink mb-5 font-display">Why you'll love this place</h3>
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
              <h3 className="text-[20px] font-bold text-ink font-display">About this room</h3>
              <div className="flex flex-wrap gap-2">
                {['1 Bedroom', '1 Bathroom', '1 Kitchen', '1 Hall'].map(f => (
                  <span key={f} className="text-[12px] font-semibold text-ink/70 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full">
                    {f}
                  </span>
                ))}
              </div>
              {room.description && (
                <p className="text-[14px] text-ink/75 leading-relaxed whitespace-pre-wrap">
                  {room.description}
                </p>
              )}
            </section>

            {/* ── Where you'll sleep ──────────────────────────── */}
            <section className="pb-8 border-b border-gray-100 space-y-4">
              <h3 className="text-[20px] font-bold text-ink font-display">Where you'll sleep</h3>
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs max-w-[240px] space-y-3">
                <div className="w-11 h-11 rounded-xl bg-fire-light flex items-center justify-center">
                  <Bed className="w-5 h-5 text-fire" />
                </div>
                <div>
                  <p className="text-[14px] font-bold text-ink">{room.flatType ?? '1BHK'} Private Room</p>
                  <p className="text-[12px] text-ink/50 mt-0.5">Single Bed · AC Room</p>
                </div>
                <span className="inline-block text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 uppercase tracking-wider">
                  Spacious &amp; Well-ventilated
                </span>
              </div>
            </section>

            {/* ── Amenities ───────────────────────────────────── */}
            {room.amenities?.length > 0 && (
              <section className="pb-8 border-b border-gray-100 space-y-4">
                <h3 className="text-[20px] font-bold text-ink font-display">What this place offers</h3>
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
                <h3 className="text-[20px] font-bold text-ink font-display">House rules &amp; preferences</h3>
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
                <h4 className="text-[15px] font-bold text-ink mb-1">Safe · Verified · Trusted</h4>
                <p className="text-[13px] text-ink/60 leading-relaxed mb-3">
                  Your safety is our priority. Every profile and room on NestMate is manually reviewed to ensure a reliable community experience.
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
              <div className="bg-white rounded-3xl border border-gray-150 shadow-[0_8px_40px_rgba(0,0,0,0.10)] overflow-hidden">

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
                      <p className="text-[13px] font-bold text-fire">{room.availableFrom || 'Immediately'}</p>
                    </div>
                    <div className="bg-[#F8F7F4] rounded-xl p-3">
                      <p className="text-[10px] font-bold text-ink/40 uppercase tracking-wider mb-1">Security Deposit</p>
                      <p className="text-[13px] font-bold text-emerald-700">₹{deposit.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Message Owner */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={room.ownerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${room.ownerName || 'owner'}`}
                        alt=""
                        className="w-5 h-5 rounded-full object-cover border border-gray-200 flex-shrink-0"
                      />
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
                      className={`w-full min-h-[44px] flex items-center justify-center gap-2 text-[13px] font-bold rounded-2xl border transition-all duration-200 cursor-pointer ${
                        isSaved
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
                      { label: 'Refundable Deposit', value: `₹${deposit.toLocaleString()}`, accent: false },
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
                      <span className="text-[15px] font-extrabold text-fire">₹{(rentShare + deposit).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Trust micro-badges */}
                  <div className="flex items-center justify-center gap-4 pt-1">
                    {[
                      { icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />, label: 'Verified' },
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
            className={`w-12 h-12 flex items-center justify-center rounded-2xl border flex-shrink-0 transition-all duration-200 cursor-pointer ${
              isSaved ? 'bg-fire/10 border-fire/30 text-fire' : 'border-gray-200 text-ink/55 bg-white'
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
                className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 cursor-pointer ${
                  i === lightboxIdx ? 'border-fire scale-105 shadow-lg shadow-fire/20' : 'border-white/20 opacity-50 hover:opacity-75'
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
