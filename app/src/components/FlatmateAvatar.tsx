import React, { useState } from 'react';
import { User, CheckCircle2 } from 'lucide-react';
import { getUserInitials } from '@/lib/userIntent';

interface FlatmateAvatarProps {
  avatar?: string | null;
  name?: string | null;
  gender?: string | null;
  isVerified?: boolean;
  illustrationType?: 'arun' | 'rajavelu' | string;
  className?: string;
}

export default function FlatmateAvatar({
  avatar,
  name = '',
  gender = '',
  isVerified = false,
  illustrationType,
  className = '',
}: FlatmateAvatarProps) {
  const [imgFailed, setImgFailed] = useState(false);

  // If a valid image URL is provided and has not failed, render real photo
  const hasRealImage = Boolean(
    avatar &&
    !imgFailed &&
    typeof avatar === 'string' &&
    avatar.trim() !== '' &&
    avatar !== 'null' &&
    avatar !== 'undefined' &&
    (avatar.startsWith('http') || avatar.startsWith('data:image'))
  );

  const initials = getUserInitials(name);
  const isExplicitDemoIllustration = illustrationType === 'arun' || illustrationType === 'rajavelu';

  return (
    <div
      className={`relative shrink-0 w-28 h-32 sm:w-36 sm:h-38 rounded-2xl overflow-hidden shadow-2xs border border-gray-200/80 flex items-center justify-center bg-[#F3F4F6] select-none ${className}`}
    >
      {hasRealImage ? (
        <img
          src={avatar!}
          alt={name || 'Roommate'}
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : isExplicitDemoIllustration && illustrationType === 'arun' ? (
        /* Explicit Arun Demo Illustration (Only when explicitly specified in mock data) */
        <svg viewBox="0 0 200 230" className="w-full h-full object-cover" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="230" rx="18" fill="#F59E0B" />
          <path d="M0 80 Q100 20 200 80 L200 230 L0 230 Z" fill="#EA580C" opacity="0.25" />
          <path d="M30 230 C30 165, 65 145, 100 145 C135 145, 170 165, 170 230 Z" fill="#374151" />
          <rect x="74" y="136" width="52" height="24" rx="8" fill="#1F2937" />
          <rect x="82" y="118" width="36" height="26" fill="#FDBA74" />
          <ellipse cx="100" cy="102" rx="42" ry="46" fill="#FED7AA" />
          <circle cx="56" cy="104" r="9" fill="#FED7AA" />
          <circle cx="144" cy="104" r="9" fill="#FED7AA" />
          <path d="M58 98 C54 62, 75 42, 100 42 C128 42, 146 60, 144 98 C138 72, 122 66, 100 66 C78 66, 68 76, 58 98 Z" fill="#1F2937" />
          <circle cx="82" cy="102" r="16" stroke="#111827" strokeWidth="4" fill="rgba(255,255,255,0.2)" />
          <circle cx="118" cy="102" r="16" stroke="#111827" strokeWidth="4" fill="rgba(255,255,255,0.2)" />
          <line x1="98" y1="102" x2="102" y2="102" stroke="#111827" strokeWidth="4" />
          <circle cx="82" cy="102" r="4.5" fill="#111827" />
          <circle cx="118" cy="102" r="4.5" fill="#111827" />
          <path d="M84 122 Q100 140 116 122 Z" fill="#FFFFFF" stroke="#EA580C" strokeWidth="1.5" />
        </svg>
      ) : isExplicitDemoIllustration && illustrationType === 'rajavelu' ? (
        /* Explicit Rajavelu Demo Illustration (Only when explicitly specified in mock data) */
        <svg viewBox="0 0 200 230" className="w-full h-full object-cover" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="230" rx="18" fill="#FACC15" />
          <circle cx="100" cy="115" r="85" fill="#EAB308" />
          <path d="M25 230 C25 165, 62 145, 100 145 C138 145, 175 165, 175 230 Z" fill="#1E3A8A" />
          <path d="M80 155 L100 195 L120 155 Z" fill="#FFFFFF" />
          <rect x="84" y="122" width="32" height="26" fill="#FDBA74" />
          <ellipse cx="100" cy="106" rx="42" ry="46" fill="#FED7AA" />
          <circle cx="56" cy="108" r="9" fill="#FED7AA" />
          <circle cx="144" cy="108" r="9" fill="#FED7AA" />
          <path d="M58 96 C54 58, 76 40, 100 40 C128 40, 146 58, 144 96 C138 70, 122 64, 100 64 C78 64, 68 74, 58 96 Z" fill="#451A03" />
          <circle cx="82" cy="102" r="5" fill="#1F2937" />
          <circle cx="118" cy="102" r="5" fill="#1F2937" />
          <path d="M80 120 C90 116, 98 120, 100 122 C102 120, 110 116, 120 120 C114 126, 104 125, 100 126 C96 125, 86 126, 80 120 Z" fill="#451A03" />
        </svg>
      ) : (
        /* Deterministic Premium Fallback: Crisp Initials or Neutral Icon */
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-white">
          {name && name.trim() ? (
            <span className="font-black text-2xl sm:text-3xl tracking-wider select-none font-sans">
              {initials}
            </span>
          ) : (
            <User className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400 stroke-[1.5]" />
          )}
        </div>
      )}

      {/* Verified checkmark badge in bottom corner */}
      {isVerified && (
        <span
          className="absolute bottom-2 right-2 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-xs z-10"
          title="Verified Roommate"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
        </span>
      )}
    </div>
  );
}

// Re-export with canonical name for future clean imports
export { FlatmateAvatar as RoommateAvatar };
