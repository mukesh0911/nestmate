import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Heart, Share2, MapPin, Shield, MessageCircle, 
  Wifi, Wind, Car, Dumbbell, Droplets, Refrigerator, Tv, Check, 
  Bed, Loader2, Copy, Grid, X, ChevronLeft, ChevronRight, UserCheck, ShieldCheck
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useListings } from '@/hooks/useListings';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { useConnections } from '@/hooks/useConnections';
import { useNotifications } from '@/hooks/useNotifications';
import { useUserProfile } from '@/hooks/useUserProfile';
import { calculateCompatibility } from '@/hooks/useMatches';
import type { Listing } from '@/hooks/useListings';
import { useStore } from '@/store/useStore';
import StateLoading from '@/components/StateLoading';
import StateEmpty from '@/components/StateEmpty';

const amenityIcons: Record<string, React.ReactNode> = {
  WiFi: <Wifi className="w-5 h-5 text-ink/70" />, 
  AC: <Wind className="w-5 h-5 text-ink/70" />, 
  Parking: <Car className="w-5 h-5 text-ink/70" />,
  'Washing Machine': <Droplets className="w-5 h-5 text-ink/70" />, 
  Gym: <Dumbbell className="w-5 h-5 text-ink/70" />,
  Geyser: <Droplets className="w-5 h-5 text-ink/70" />, 
  Fridge: <Refrigerator className="w-5 h-5 text-ink/70" />, 
  TV: <Tv className="w-5 h-5 text-ink/70" />,
};

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
  
  // Gallery Modal
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);

  const isSaved = !!(profile?.savedRoomIds && id && profile.savedRoomIds.includes(id));

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    getListingById(id).then(data => {
      setRoom(data);
      setIsLoading(false);
    });
    recordView(id).catch(() => {});
  }, [id]);

  const handleConnect = async () => {
    if (!user?.uid) {
      useStore.getState().openAuthModal({
        title: 'Sign in to Connect with Owner',
        subtitle: 'Create an account or try a 1-click demo to send interest and start chatting.',
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
        description: `${profile?.name || 'Someone'} is interested in "${room.title}".`,
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
        subtitle: 'Save your favorite rooms and access them anytime across devices.',
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
      title: room?.title || 'NestMate Room',
      text: `Check out this room: ${room?.title} in ${room?.locality}, ${room?.city} — ₹${room?.totalRent?.toLocaleString()}/mo`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (_) { /* ignored */ }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 2500);
    }
  };

  if (isLoading) return <StateLoading label="Loading room..." fullScreen />;

  if (!room) return (
    <div className="min-h-screen bg-parchment flex items-center justify-center px-4">
      <StateEmpty
        icon={Bed}
        title="Room not found"
        description="This listing is inactive or may have been deleted by the owner."
        action={
          <button onClick={() => navigate(-1)} className="btn-fire text-sm">Go Back</button>
        }
      />
    </div>
  );

  // Fallback images
  const defaultImages = [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600',
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=600',
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600'
  ];

  const photos = room.images?.length > 0 ? room.images : defaultImages;

  // Make sure we have 5 photos to render in the classic Airbnb grid
  const gridPhotos = [...photos];
  while (gridPhotos.length < 5) {
    gridPhotos.push(defaultImages[gridPhotos.length % defaultImages.length]);
  }

  // Calculate compatibility percentage
  const rawCompatibility = profile
    ? calculateCompatibility(profile.quizAnswers || {}, (room as any).ownerQuizAnswers || {})
    : 85;
  const compatibility = rawCompatibility > 0 ? rawCompatibility : 82;

  return (
    <div className="min-h-screen bg-parchment pb-24 font-sans text-ink page-transition overflow-x-hidden">
      
      {/* Copy Toast */}
      {copyToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-ink text-white text-xs font-bold px-4 py-3 rounded-full shadow-xl flex items-center gap-2 animate-fade-up">
          <Copy className="w-4 h-4 text-fire" /> Link copied to clipboard!
        </div>
      )}

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        
        {/* Navigation Row */}
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-xs font-bold text-ink/65 hover:text-ink mb-5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to search
        </button>

        {/* Airbnb Listing Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2 text-ink">{room.title}</h1>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-bold">
            <div className="flex items-center gap-3 text-ink/75">
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-fire fill-current/10" /> {room.locality}, {room.city}</span>
              <span className="text-ink/30">•</span>
              <span className="bg-teal/10 text-teal px-2 py-0.5 rounded-md">★ {compatibility}% Compatibility match</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleShare} className="flex items-center gap-1.5 hover:underline text-ink/70">
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
              <button onClick={handleToggleSave} className="flex items-center gap-1.5 hover:underline text-ink/70">
                <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} /> {isSaved ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>
        </div>

        {/* Airbnb Signature 5-Photo Grid */}
        <div className="relative aspect-[21/9] w-full rounded-2xl overflow-hidden bg-cream border border-border shadow-sm mb-8 hidden md:grid grid-cols-4 gap-2">
          {/* Main Large Image (Left half) */}
          <div className="col-span-2 relative h-full overflow-hidden cursor-pointer" onClick={() => { setLightboxIdx(0); setShowLightbox(true); }}>
            <img src={gridPhotos[0]} className="w-full h-full object-cover hover:scale-[1.01] transition-transform duration-300" alt="" />
          </div>
          {/* Right Smaller Images Grid */}
          <div className="col-span-1 grid grid-rows-2 gap-2 h-full">
            <div className="relative h-full overflow-hidden cursor-pointer" onClick={() => { setLightboxIdx(1); setShowLightbox(true); }}>
              <img src={gridPhotos[1]} className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300" alt="" />
            </div>
            <div className="relative h-full overflow-hidden cursor-pointer" onClick={() => { setLightboxIdx(2); setShowLightbox(true); }}>
              <img src={gridPhotos[2]} className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300" alt="" />
            </div>
          </div>
          <div className="col-span-1 grid grid-rows-2 gap-2 h-full">
            <div className="relative h-full overflow-hidden cursor-pointer" onClick={() => { setLightboxIdx(3); setShowLightbox(true); }}>
              <img src={gridPhotos[3]} className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300" alt="" />
            </div>
            <div className="relative h-full overflow-hidden cursor-pointer" onClick={() => { setLightboxIdx(4); setShowLightbox(true); }}>
              <img src={gridPhotos[4]} className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300" alt="" />
            </div>
          </div>

          {/* Show All Photos Floating Button */}
          <button 
            onClick={() => { setLightboxIdx(0); setShowLightbox(true); }}
            className="absolute bottom-4 right-4 bg-white/90 hover:bg-white text-ink text-xs font-bold px-4 py-2 border border-border rounded-lg shadow-md transition-all flex items-center gap-1.5"
          >
            <Grid className="w-4 h-4" /> Show all photos
          </button>
        </div>

        {/* Mobile Photo Banner (Single / Carousel) */}
        <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-cream border border-border shadow-sm mb-6 md:hidden">
          <img src={photos[0]} className="w-full h-full object-cover" alt="" />
          <button 
            onClick={() => { setLightboxIdx(0); setShowLightbox(true); }}
            className="absolute bottom-3 right-3 bg-white/90 text-ink text-[10px] font-bold px-3 py-1.5 border border-border rounded-md shadow-md"
          >
            1 / {photos.length} photos
          </button>
        </div>

        {/* Two-Column Editorial Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Host Section */}
            <div className="flex items-center justify-between pb-6 border-b border-border">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-ink/90">
                  {room.flatType} flat listed by {room.ownerName || 'Room Owner'}
                </h2>
                <p className="text-xs text-ink/50 font-semibold mt-1">
                  {room.partnersNeeded || 1} Roommate needed • Furnishing: {room.furnishing || 'Semi-Furnished'}
                </p>
              </div>
              <div className="relative">
                <img 
                  src={room.ownerAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${room.ownerName || 'Owner'}`} 
                  className="w-14 h-14 rounded-full border border-border object-cover"
                  alt="" 
                />
                {room.ownerAvatar && (
                  <div className="absolute -bottom-1 -right-1 bg-teal text-white rounded-full p-1 border-2 border-white shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 fill-current" />
                  </div>
                )}
              </div>
            </div>

            {/* Premium Roommate Highlights */}
            <div className="py-2 space-y-4 pb-6 border-b border-border">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-teal/5 rounded-xl text-teal">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Outstanding Lifestyle Fit</h4>
                  <p className="text-xs text-ink/50 mt-0.5">Your lifestyle preferences match 85%+ on food, sleep schedule, and work habits.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">{room.isOwnerVerified ? 'ID-Verified Owner' : 'Direct Owner Listing'}</h4>
                  <p className="text-xs text-ink/50 mt-0.5">
                    {room.isOwnerVerified
                      ? 'Owner identity reviewed by NestMate. Prefer chat before sharing personal details.'
                      : 'Chat in-app first. Phone numbers stay private until both of you agree to share.'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Free Connect Request</h4>
                  <p className="text-xs text-ink/50 mt-0.5">Zero agent commission. Connect directly and arrange a visit after chatting.</p>
                </div>
              </div>
            </div>

            {/* Description */}
            {room.description && (
              <div className="pb-6 border-b border-border">
                <h3 className="text-base font-bold tracking-tight mb-3">About this room</h3>
                <p className="text-sm text-ink/75 leading-relaxed whitespace-pre-wrap">{room.description}</p>
              </div>
            )}

            {/* Bedrooms (Where you'll sleep) */}
            <div className="pb-6 border-b border-border">
              <h3 className="text-base font-bold tracking-tight mb-4">Where you'll sleep</h3>
              <div className="w-48 p-5 border border-border rounded-2xl shadow-sm text-left">
                <Bed className="w-6 h-6 text-fire mb-3" />
                <h4 className="text-sm font-bold">{room.flatType} Room</h4>
                <p className="text-xs text-ink/50 mt-1">Single Bed • AC Room</p>
              </div>
            </div>

            {/* Amenities Grid */}
            {room.amenities?.length > 0 && (
              <div className="pb-6 border-b border-border">
                <h3 className="text-base font-bold tracking-tight mb-4">What this place offers</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {room.amenities.map(a => (
                    <div key={a} className="flex items-center gap-3.5">
                      <span className="p-1.5 bg-cream/30 rounded-lg">{amenityIcons[a] || <Check className="w-5 h-5 text-ink/70" />}</span>
                      <span className="text-sm text-ink/80 font-medium">{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* House Rules */}
            {room.houseRules?.length > 0 && (
              <div className="pb-6 border-b border-border">
                <h3 className="text-base font-bold tracking-tight mb-3">House rules & preferences</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {room.houseRules.map(r => (
                    <div key={r} className="flex items-center gap-2 text-xs text-ink/70 font-semibold bg-cream/15 p-2 rounded-lg">
                      <div className="w-1.5 h-1.5 bg-teal rounded-full" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Right Column - Sticky Connection/Reservation Card */}
          <div className="lg:col-span-1">
            <div className="border border-border rounded-2xl shadow-lg p-6 bg-white sticky top-24 space-y-6">
              
              {/* Pricing Display */}
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-extrabold tracking-tight">₹{room.partnerShare?.toLocaleString()}</span>
                  <span className="text-sm text-ink/50"> / month</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-ink/40 font-bold block">Total Rent: ₹{room.totalRent?.toLocaleString()}</span>
                </div>
              </div>

              {/* Move-in Date details */}
              <div className="border border-border rounded-xl divide-y divide-border overflow-hidden text-xs">
                <div className="p-3 bg-cream/10">
                  <p className="font-bold uppercase tracking-wider text-[9px] text-ink/55">Available From</p>
                  <p className="font-extrabold text-sm text-fire mt-0.5">{room.availableFrom || 'Immediately'}</p>
                </div>
                <div className="p-3 bg-cream/10">
                  <p className="font-bold uppercase tracking-wider text-[9px] text-ink/55">Security Deposit</p>
                  <p className="font-extrabold text-sm text-teal mt-0.5">₹{room.deposit?.toLocaleString()}</p>
                </div>
              </div>

              {/* Connect Flow Message Box */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-ink uppercase tracking-wider">Intro message</label>
                <textarea 
                  defaultValue={`Hi ${room.ownerName || 'Owner'}! I saw your ${room.flatType} room in ${room.locality} and we are a ${compatibility}% lifestyle match. Let's connect!`}
                  className="w-full text-xs p-3 border border-border rounded-xl h-20 outline-none focus:border-fire transition-colors resize-none"
                />
              </div>

              {/* CTA Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleConnect}
                  disabled={connecting || requestSent}
                  className="w-full py-3.5 bg-fire text-white text-xs font-bold rounded-xl hover:bg-fire-dark transition-colors shadow-md flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {connecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : requestSent ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <MessageCircle className="w-4 h-4" />
                  )}
                  {connecting ? 'Sending request...' : requestSent ? 'Request Sent ✓' : 'Express Interest'}
                </button>

                <button
                  onClick={handleToggleSave}
                  disabled={savingRoom}
                  className={`w-full py-3 border border-border text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                    isSaved ? 'bg-red-50 text-red-500 border-red-200' : 'bg-white hover:bg-cream/10 text-ink/65'
                  }`}
                >
                  {savingRoom ? (
                    <Loader2 className="w-4 h-4 animate-spin text-fire" />
                  ) : (
                    <Heart className={`w-4 h-4 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
                  )}
                  {isSaved ? 'Saved listing' : 'Save listing'}
                </button>
              </div>

              {/* Price Transparency Table */}
              <div className="pt-2 text-xs border-t border-border space-y-2.5">
                <div className="flex justify-between text-ink/60">
                  <span>Roommate Rent Share</span>
                  <span>₹{room.partnerShare?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-ink/60">
                  <span>Refundable Deposit</span>
                  <span>₹{room.deposit?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-ink/60">
                  <span>NestMate Brokerage</span>
                  <span className="text-teal font-extrabold">₹0 (Free)</span>
                </div>
                <div className="flex justify-between text-ink font-bold pt-2 border-t border-border/50">
                  <span>Due to Move-in</span>
                  <span>₹{(room.partnerShare + room.deposit).toLocaleString()}</span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Lightbox / Slideshow Fullscreen Modal */}
      {showLightbox && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-4 select-none">
          {/* Header */}
          <div className="flex items-center justify-between text-white py-2">
            <span className="text-xs font-bold">{lightboxIdx + 1} / {photos.length}</span>
            <button 
              onClick={() => setShowLightbox(false)}
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Image slide */}
          <div className="relative flex-1 flex items-center justify-center">
            <img 
              src={photos[lightboxIdx]} 
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
              alt="" 
            />

            {/* Left/Right navigation buttons */}
            {photos.length > 1 && (
              <>
                <button 
                  onClick={() => setLightboxIdx(prev => prev === 0 ? photos.length - 1 : prev - 1)}
                  className="absolute left-4 p-3 bg-white/15 hover:bg-white/20 text-white rounded-full transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button 
                  onClick={() => setLightboxIdx(prev => prev === photos.length - 1 ? 0 : prev + 1)}
                  className="absolute right-4 p-3 bg-white/15 hover:bg-white/20 text-white rounded-full transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail scroll strip */}
          <div className="py-4 flex justify-center gap-2.5 overflow-x-auto">
            {photos.map((src, i) => (
              <button 
                key={i} 
                onClick={() => setLightboxIdx(i)}
                className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  i === lightboxIdx ? 'border-fire scale-105 shadow-md' : 'border-transparent opacity-50'
                }`}
              >
                <img src={src} className="w-full h-full object-cover" alt="" />
              </button>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

