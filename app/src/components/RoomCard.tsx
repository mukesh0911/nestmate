import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ChevronLeft, ChevronRight, Image as ImageIcon, Sofa, ShieldCheck, Loader2 } from 'lucide-react';
import type { Listing } from '@/hooks/useListings';

interface RoomCardProps {
  room: Listing;
  isSaved?: boolean;
  isSaving?: boolean;
  onToggleSave?: (e: React.MouseEvent, roomId: string) => void;
  onClick?: () => void;
  className?: string;
}

export default function RoomCard({
  room,
  isSaved = false,
  isSaving = false,
  onToggleSave,
  onClick,
  className = '',
}: RoomCardProps) {
  const navigate = useNavigate();
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const defaultImages = [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop',
  ];

  const images = room.images && room.images.length > 0 ? room.images : defaultImages;
  const rentAmount = room.totalRent || (room as any).monthlyRent || (room as any).rent || 0;
  const partnersCount = room.partnersNeeded || (room as any).neededRoommates || 1;
  const furnishingText = room.furnishing || 'Semi-Furnished';

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/room/${room.id}`);
    }
  };

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIdx(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImgIdx(prev => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative flex flex-col bg-white rounded-3xl shadow-sm hover:shadow-md border border-slate-100 overflow-hidden transition-all duration-300 cursor-pointer ${className}`}
    >
      {/* Top Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <img
          src={images[currentImgIdx]}
          alt={room.title || `${room.locality}, ${room.city}`}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />

        {/* Gradient Scrim Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

        {/* Top Left Badge: Flat Type (e.g. 1BHK, 2BHK) */}
        <div className="absolute top-3 left-3 z-10">
          <span className="bg-white/90 backdrop-blur-md text-slate-800 text-xs font-extrabold px-3 py-1 rounded-full shadow-sm tracking-wide">
            {room.flatType || '1BHK'}
          </span>
        </div>

        {/* Top Right Heart Button */}
        {onToggleSave && (
          <button
            onClick={e => onToggleSave(e, room.id)}
            aria-label={isSaved ? 'Remove from saved' : 'Save room'}
            className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-white/90 hover:bg-white backdrop-blur-sm shadow-sm hover:shadow-md transition-all z-10 cursor-pointer"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin text-brand-orange" />
            ) : (
              <Heart
                className={`w-4.5 h-4.5 transition-all ${
                  isSaved ? 'fill-red-500 text-red-500 scale-110' : 'text-slate-600 hover:text-red-500'
                }`}
              />
            )}
          </button>
        )}

        {/* Bottom Left Photos Count Badge */}
        <div className="absolute bottom-3 left-3 z-10">
          <span className="bg-black/50 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
            <ImageIcon className="w-3.5 h-3.5" />
            {images.length} Photos
          </span>
        </div>

        {/* Verified Badge (if applicable) */}
        {room.isOwnerVerified && (
          <div className="absolute top-3 left-20 z-10">
            <span className="bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <ShieldCheck className="w-3 h-3" /> Verified
            </span>
          </div>
        )}

        {/* Image Nav Arrows (Desktop hover) */}
        {images.length > 1 && isHovered && (
          <>
            <button
              onClick={handlePrevImage}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/90 text-slate-800 shadow-md hover:bg-white transition-all z-10 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextImage}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/90 text-slate-800 shadow-md hover:bg-white transition-all z-10 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Bottom Center Carousel Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            {images.map((_, idx) => (
              <span
                key={idx}
                className={`rounded-full transition-all ${
                  idx === currentImgIdx
                    ? 'w-3.5 h-1.5 bg-white shadow-xs'
                    : 'w-1.5 h-1.5 bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Content Area */}
      <div className="p-4 sm:p-5 flex flex-col justify-between flex-1">
        {/* Title / Location */}
        <div>
          <h3 className="font-bold text-slate-900 text-lg leading-snug truncate tracking-tight mb-1.5">
            {room.locality}, {room.city}
          </h3>

          {/* Furnishing & Needed Row */}
          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium mb-4">
            <Sofa className="w-4 h-4 text-brand-orange shrink-0" />
            <span className="truncate">
              {furnishingText} · {partnersCount} needed
            </span>
          </div>
        </div>

        {/* Price & View Details Action Row */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100/80 mt-auto">
          <div>
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              ₹{rentAmount.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-normal ml-0.5">/mo</span>
          </div>

          <button
            onClick={handleCardClick}
            className="border-2 border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
