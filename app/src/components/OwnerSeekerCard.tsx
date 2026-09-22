import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserProfile } from '@/hooks/useAuth';
import type { Listing } from '@/hooks/useListings';
import { MapPin, Star, MessageSquare, Phone, Check } from 'lucide-react';

interface OwnerSeekerCardProps {
  seeker: UserProfile;
  score?: number;
  ownerListing?: Listing | null;
  onChat: (seekerUid: string) => void;
  onCall: (seeker: UserProfile) => void;
  distanceText?: string;
}

export default function OwnerSeekerCard({
  seeker,
  score = 95,
  ownerListing,
  onChat,
  onCall,
  distanceText,
}: OwnerSeekerCardProps) {
  const navigate = useNavigate();
  const [imgFailed, setImgFailed] = useState(false);

  const initial = (seeker.name?.trim()?.charAt(0) || 'M').toUpperCase();

  const localityText = seeker.locality
    ? (seeker.city ? `${seeker.locality}, ${seeker.city}` : seeker.locality)
    : (seeker.city ? `${seeker.city}, India` : 'Bengaluru, India');

  const budgetText = seeker.budget && seeker.budget > 0
    ? `₹ ${seeker.budget.toLocaleString('en-IN')}`
    : '₹ 3,750';

  const lookingGender = seeker.preferredGender
    ? (seeker.preferredGender.toLowerCase() === 'female' ? 'Female' : seeker.preferredGender.toLowerCase() === 'male' ? 'Male' : 'Any')
    : 'Any';

  const lookingRoomType = seeker.preferredRoomType || 'Roommate';

  const hasPhoto = Boolean(seeker.avatar && !imgFailed && (seeker.avatar.startsWith('http') || seeker.avatar.startsWith('data:image')));

  return (
    <div
      onClick={() => navigate(`/match/${seeker.uid}`)}
      className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs hover:shadow-md transition-all duration-200 p-4 sm:p-5 flex flex-col justify-between cursor-pointer group select-none"
    >
      {/* Top Section: Avatar on Left, Information on Right */}
      <div className="flex items-start gap-3 sm:gap-5">
        {/* Left: Square Slate Avatar with Large Initial & Green Verification Seal */}
        <div className="relative shrink-0 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-2xl bg-[#6C828D] flex items-center justify-center overflow-visible shadow-xs">
          {hasPhoto ? (
            <img
              src={seeker.avatar}
              alt={seeker.name || 'Room Seeker'}
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover rounded-2xl"
              loading="lazy"
            />
          ) : (
            <span className="text-white text-3xl sm:text-4xl md:text-5xl font-medium tracking-wide select-none font-sans">
              {initial}
            </span>
          )}

          {/* Concentric Green Verified Seal (Bottom-Right Corner) */}
          {(seeker.isVerified !== false) && (
            <div className="absolute -bottom-1.5 -right-1.5 bg-white p-0.5 rounded-full shadow-xs">
              <div className="w-6 h-6 rounded-full border-2 border-emerald-500 bg-white flex items-center justify-center">
                <div className="w-4 h-4 rounded-full border border-emerald-500/80 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3.5]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Details Column */}
        <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
          <div>
            {/* User Name */}
            <h3 className="font-bold text-base sm:text-lg md:text-xl text-[#1A1A2E] group-hover:text-[#E5501A] transition-colors truncate">
              {seeker.name || 'Room Seeker'}
            </h3>

            {/* Location with MapPin */}
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mt-1 truncate">
              <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="truncate">{localityText}</span>
            </div>

            {/* Price / Rent */}
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg md:text-xl font-black text-[#1A1A2E] tracking-tight">
                {budgetText}
              </span>
              <span className="text-xs font-normal text-gray-400">
                Rent
              </span>
            </div>
          </div>

          {/* Looking for Two-Column Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-3 pt-0.5">
            <div>
              <span className="text-xs text-gray-400 font-normal block mb-0.5">Looking for</span>
              <span className="text-sm sm:text-base font-bold text-[#1A1A2E] capitalize truncate block">
                {lookingGender}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-400 font-normal block mb-0.5">Looking for</span>
              <span className="text-sm sm:text-base font-bold text-[#1A1A2E] truncate block">
                {lookingRoomType}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Dashed Horizontal Divider */}
      <div className="border-t border-dashed border-gray-200/90 my-3.5" />

      {/* Bottom Row: Distance / Search on Left, Match + Action Buttons on Right */}
      <div className="flex items-center justify-between gap-2" onClick={e => e.stopPropagation()}>
        {/* Left: Distance from search */}
        <div className="text-xs sm:text-sm text-gray-400 font-medium truncate">
          <span>{distanceText || '0 km from your search'}</span>
        </div>

        {/* Right: Star Match Score + Call + Message Buttons */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {score > 0 && (
            <div className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-gray-700">
              <Star className="w-4 h-4 text-gray-400 stroke-[1.8]" />
              <span>{score}% Match</span>
            </div>
          )}

          {/* Circular Phone Button */}
          <button
            type="button"
            onClick={() => onCall(seeker)}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs"
            title="Call Seeker"
            aria-label="Call Seeker"
          >
            <Phone className="w-4 h-4 text-gray-600 stroke-[1.8]" />
          </button>

          {/* Circular Message Button */}
          <button
            type="button"
            onClick={() => onChat(seeker.uid)}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs"
            title="Message Seeker"
            aria-label="Message Seeker"
          >
            <MessageSquare className="w-4 h-4 text-gray-600 stroke-[1.8]" />
          </button>
        </div>
      </div>
    </div>
  );
}
