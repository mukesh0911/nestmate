import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Star, Phone, MessageSquare, CheckCircle2, Image as ImageIcon, Heart, Sparkles } from 'lucide-react';
import type { Listing } from '@/hooks/useListings';
import { getListingPhotos } from '@/lib/displayTruth';
import { useStore } from '@/store/useStore';

interface CompactRoomCardProps {
  room: Listing;
  onClick?: () => void;
  onCall?: (room: Listing) => void;
  onChat?: (room: Listing) => void;
  onToggleSave?: (room: Listing) => void;
  isSaved?: boolean;
  compatibilityScore?: number;
  distanceKm?: number;
  className?: string;
}

export default function CompactRoomCard({
  room,
  onClick,
  onCall,
  onChat,
  onToggleSave,
  isSaved = false,
  compatibilityScore,
  distanceKm = 0,
  className = '',
}: CompactRoomCardProps) {
  const navigate = useNavigate();
  const openAuthModal = useStore(state => state.openAuthModal);
  const [imgFailed, setImgFailed] = useState(false);

  const { photos: images, hasRealPhotos } = getListingPhotos(room.images);
  const primaryImage = images[0] || (room as any).photoUrl || (room as any).imageUrl;

  const rentAmount = room.partnerShare || room.totalRent || (room as any).monthlyRent || 12000;
  const localityText = room.locality
    ? (room.city ? `${room.locality}, ${room.city}` : room.locality)
    : (room.city ? `${room.city}, India` : 'India');

  // Normalize property badge (e.g. 2BHK, 1BHK, PG)
  const rawType = (room.flatType || '').trim();
  let propertyBadge = 'Room';
  if (rawType.toLowerCase().includes('pg') || rawType.toLowerCase().includes('hostel')) {
    propertyBadge = 'PG';
  } else if (rawType.toLowerCase().includes('1bhk') || rawType.toLowerCase().includes('studio')) {
    propertyBadge = '1BHK';
  } else if (rawType.toLowerCase().includes('2bhk')) {
    propertyBadge = '2BHK';
  } else if (rawType.toLowerCase().includes('3bhk')) {
    propertyBadge = '3BHK';
  } else if (rawType) {
    propertyBadge = rawType;
  }

  const isShared = propertyBadge === 'PG' || rawType.toLowerCase().includes('shared') || (room.partnersNeeded ?? 0) > 1;
  const accommodationType = isShared ? 'Shared Room' : 'Private Room';

  const partnersNeeded = room.partnersNeeded || 1;
  const flatmatesText = `${partnersNeeded} ${partnersNeeded === 1 ? 'Roommate' : 'Roommates'}`;

  const prefetchRoomDetail = () => {
    import('@/pages/RoomDetail');
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/room/${room.id}`);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={prefetchRoomDetail}
      onTouchStart={prefetchRoomDetail}
      onPointerDown={prefetchRoomDetail}
      className={`bg-white rounded-2xl sm:rounded-3xl border border-gray-200/80 shadow-2xs hover:shadow-md transition-all duration-200 p-3.5 sm:p-4 flex flex-col justify-between cursor-pointer group ${className}`}
    >
      {/* Upper Section: Photo on Left, Details on Right */}
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Left Photo Container */}
        <div className="relative shrink-0 w-28 h-32 sm:w-36 sm:h-38 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200/70 shadow-2xs flex items-center justify-center">
          {primaryImage && !imgFailed ? (
            <img
              src={primaryImage}
              alt={room.title || localityText}
              onError={() => setImgFailed(true)}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-2 text-gray-400">
              <ImageIcon className="w-8 h-8 text-gray-300 mb-1" />
              <span className="text-[10px] font-semibold text-gray-400">NestMate Room</span>
            </div>
          )}

          {/* Top-Left Badge (e.g. 2BHK / PG) */}
          <div className="absolute top-2 left-2 z-10">
            <span className="bg-[#1A1A2E]/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
              {propertyBadge}
            </span>
          </div>

          {/* Bottom-Left Photo Count */}
          {images.length > 1 && (
            <div className="absolute bottom-2 left-2 z-10">
              <span className="bg-black/60 backdrop-blur-xs text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                📷 {images.length}
              </span>
            </div>
          )}

          {/* Verified Checkmark Badge */}
          {(room.ownerVerified || (room as any).isOwnerVerified) && (
            <span
              className="absolute bottom-2 right-2 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-xs z-10"
              title="Verified Property"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            </span>
          )}
        </div>

        {/* Right Details Column */}
        <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
          <div>
            {/* Title */}
            <h3 className="font-bold text-base sm:text-lg text-[#1A1A2E] group-hover:text-[#E5501A] transition-colors truncate">
              {room.title || `${room.locality || 'Koramangala'}, ${room.city || 'Bengaluru'}`}
            </h3>

            {/* Location with Pin */}
            <div className="flex items-center gap-1 text-xs text-gray-500 font-medium mt-0.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate">{localityText}</span>
            </div>

            {/* Rent */}
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-extrabold text-[#1A1A2E]">
                ₹ {rentAmount.toLocaleString('en-IN')}
              </span>
              <span className="text-xs text-gray-400 font-medium">Rent</span>
            </div>
          </div>

          {/* 2-Column Info Grid: Room Type | Looking for */}
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-100">
            <div>
              <span className="text-[10px] text-gray-400 font-medium block">
                Room Type
              </span>
              <span className="text-xs sm:text-sm font-semibold text-[#1A1A2E] truncate block">
                {accommodationType}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-400 font-medium block">
                Looking for
              </span>
              <span className="text-xs sm:text-sm font-semibold text-[#1A1A2E] truncate block">
                {flatmatesText}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Dashed Divider + Search Distance + Match + Two Circular Action Buttons */}
      <div className="border-t border-dashed border-gray-200 mt-3 pt-2.5 flex items-center justify-between gap-2">
        {/* Distance from search */}
        <div className="text-xs text-gray-500 font-medium truncate">
          <span>{distanceKm} km <span className="text-gray-400">from your search</span></span>
        </div>

        {/* Match Score & Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Match Score: Real dynamic score when computed; sign-in prompt when guest */}
          {compatibilityScore !== undefined ? (
            compatibilityScore > 0 ? (
              <div className="flex items-center gap-1 text-xs font-semibold text-gray-600">
                <Star className="w-3.5 h-3.5 text-gray-400 fill-gray-200" />
                <span>{compatibilityScore}% Match</span>
              </div>
            ) : (
              <span className="text-[11px] font-medium text-gray-400">Available</span>
            )
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openAuthModal({
                  title: 'Check Room Compatibility',
                  subtitle: 'Sign in to see your personalized compatibility score with this room.',
                  redirect: `/room/${room.id}`,
                });
              }}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-[#E5501A] transition-colors cursor-pointer"
              title="Sign in to calculate personalized compatibility"
            >
              <Sparkles className="w-3 h-3 text-[#E5501A]" />
              <span>Sign in to match</span>
            </button>
          )}

          {/* Three Circular Buttons: [ ❤️ ], [ 📞 ] and [ 💬 ] */}
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            {/* Save Button */}
            {onToggleSave && (
              <button
                type="button"
                onClick={() => onToggleSave(room)}
                className={`w-8 h-8 rounded-full border border-gray-200/90 flex items-center justify-center transition-colors cursor-pointer shadow-2xs active:scale-95 ${
                  isSaved ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-[#F3F4F6] text-gray-500 hover:bg-gray-200'
                }`}
                title={isSaved ? "Remove from saved" : "Save room"}
                aria-label={isSaved ? "Remove from saved" : "Save room"}
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-current text-rose-600' : 'text-gray-500'}`} />
              </button>
            )}

            {/* Call Button */}
            <button
              type="button"
              onClick={() => (onCall ? onCall(room) : handleCardClick())}
              className="w-8 h-8 rounded-full bg-[#F3F4F6] border border-gray-200/90 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer shadow-2xs active:scale-95"
              title="Call Owner"
              aria-label="Call Owner"
            >
              <Phone className="w-4 h-4 text-gray-500" />
            </button>

            {/* Chat Button */}
            <button
              type="button"
              onClick={() => (onChat ? onChat(room) : handleCardClick())}
              className="w-8 h-8 rounded-full bg-[#F3F4F6] border border-gray-200/90 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer shadow-2xs active:scale-95"
              title="Chat with Owner"
              aria-label="Chat with Owner"
            >
              <MessageSquare className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
