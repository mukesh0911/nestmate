import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ChevronLeft, ChevronRight, Image as ImageIcon, Sofa, ShieldCheck, Loader2, Sparkles } from 'lucide-react';
import type { Listing } from '@/hooks/useListings';
// Sprint 4B (truth): missing listing data renders honest neutral states —
// never stock photos, invented furnishing, assumed flat type, or ₹0 rent.
import { getListingPhotos } from '@/lib/displayTruth';

interface RoomCardProps {
  room: Listing;
  isSaved?: boolean;
  isSaving?: boolean;
  onToggleSave?: (e: React.MouseEvent, roomId: string) => void;
  onClick?: () => void;
  className?: string;
  compatibilityScore?: number;
}

export default function RoomCard({
  room,
  isSaved = false,
  isSaving = false,
  onToggleSave,
  onClick,
  className = '',
  compatibilityScore,
}: RoomCardProps) {
  const navigate = useNavigate();
  const [currentImgIdx, setCurrentImgIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Sprint 4B (truth): NO stock-photo fallbacks. Cards without owner-uploaded
  // photos render an explicit "No photos yet" placeholder.
  const { photos: images, hasRealPhotos } = getListingPhotos(room.images);
  const rentAmount = room.totalRent || (room as any).monthlyRent || (room as any).rent || 0;
  const partnersCount = room.partnersNeeded ?? (room as any).neededRoommates ?? 0;
  const furnishingText = room.furnishing || '';
  const hasMetaRow = Boolean(furnishingText || partnersCount > 0);

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
      className={`group relative flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-md border border-border overflow-hidden transition-all duration-300 cursor-pointer ${className}`}
    >
      {/* Top Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        {hasRealPhotos ? (
          <img
            src={images[currentImgIdx]}
            alt={room.title || `${room.locality}, ${room.city}`}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          /* Sprint 4B (truth): explicit empty state — never a stock photo */
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-cream/60 text-ink/30">
            <ImageIcon className="w-8 h-8" />
            <span className="text-xs font-semibold">No photos yet</span>
          </div>
        )}

        {/* Gradient Scrim Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

        {/* Top Left Badges: Flat Type & Compatibility */}
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start pointer-events-none">
          {room.flatType && (
            <span className="bg-white/95 backdrop-blur-md text-slate-800 text-xs font-extrabold px-3 py-1 rounded-full shadow-sm tracking-wide">
              {room.flatType}
            </span>
          )}
          {compatibilityScore !== undefined && compatibilityScore > 0 && (
            <span className={`backdrop-blur-md text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm tracking-wide flex items-center gap-1 ${
              compatibilityScore >= 80 ? 'bg-emerald-600/95' : 'bg-amber-600/95'
            }`}>
              <Sparkles className="w-3 h-3 text-white" />
              {compatibilityScore}% Match
            </span>
          )}
        </div>

        {/* Top Right Heart Button */}
        {onToggleSave && (
          <button
            onClick={e => onToggleSave(e, room.id)}
            aria-label={isSaved ? 'Remove from saved' : 'Save room'}
            className="absolute top-2.5 right-2.5 w-11 h-11 flex items-center justify-center rounded-full bg-white/90 hover:bg-white backdrop-blur-sm shadow-sm hover:shadow-md transition-all z-10 cursor-pointer"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin text-brand-orange" />
            ) : (
              /* Sprint 5B fix: w-4.5/h-4.5 are not valid Tailwind sizes */
              <Heart
                className={`w-5 h-5 transition-all ${isSaved ? 'fill-red-500 text-red-500 scale-110' : 'text-slate-600 hover:text-red-500'
                  }`}
              />
            )}
          </button>
        )}

        {/* Bottom Left Photos Count Badge — only when real photos exist */}
        {hasRealPhotos && (
          <div className="absolute bottom-3 left-3 z-10">
            <span className="bg-black/50 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
              <ImageIcon className="w-3.5 h-3.5" />
              {images.length} Photos
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
        {hasRealPhotos && images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            {images.map((_, idx) => (
              <span
                key={idx}
                className={`rounded-full transition-all ${idx === currentImgIdx
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
          <h3 className="font-bold text-ink text-lg leading-snug truncate tracking-tight mb-1.5">
            {room.locality}, {room.city}
          </h3>

          {/* Quiet trust line — real verification signal only */}
          {room.isOwnerVerified && (
            <p className="flex items-center gap-1 text-xs font-semibold text-teal mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden />
              Owner verified
            </p>
          )}

          {/* Furnishing & Needed Row — rendered ONLY from real data */}
          {hasMetaRow && (
            <div className="flex items-center gap-2 text-ink/50 text-sm font-medium mb-4">
              <Sofa className="w-4 h-4 text-brand-orange shrink-0" aria-hidden />
              <span className="truncate">
                {[furnishingText, partnersCount > 0 ? `${partnersCount} needed` : ''].filter(Boolean).join(' · ')}
              </span>
            </div>
          )}
        </div>

        {/* Price & View Details Action Row */}
        <div className="flex items-center justify-between pt-2 border-t border-border/70 mt-auto">
          <div>
            {rentAmount > 0 ? (
              <>
                <span className="text-xl sm:text-2xl font-extrabold text-ink tracking-tight">
                  ₹{rentAmount.toLocaleString()}
                </span>
                <span className="text-xs text-ink/50 font-normal ml-0.5">/mo</span>
              </>
            ) : (
              /* Sprint 4B (truth): missing rent is NEVER shown as ₹0 */
              <span className="text-sm font-bold text-ink/40">Rent not specified</span>
            )}
          </div>

          {/* Quiet CTA — the whole card is clickable; no heavy bordered button */}
          <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-orange group-hover:text-brand-orange-dark transition-colors shrink-0">
            View Details
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </span>
        </div>
      </div>
    </div>
  );
}
