import React, { useState } from 'react';
import { User, CheckCircle2 } from 'lucide-react';

interface FlatmateAvatarProps {
  avatar?: string;
  name?: string;
  gender?: string;
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

  const lowerName = name.toLowerCase();
  const isArun = illustrationType === 'arun' || lowerName.includes('arun');
  const isRajavelu = illustrationType === 'rajavelu' || lowerName.includes('rajavelu');
  const isFemale = gender.toLowerCase() === 'female' || lowerName.includes('rupa') || lowerName.includes('ananya');

  // If a valid image URL is provided and has not failed, render image
  const hasRealImage = Boolean(avatar && !imgFailed && (avatar.startsWith('http') || avatar.startsWith('data:image')));

  return (
    <div className={`relative shrink-0 w-28 h-32 sm:w-36 sm:h-38 rounded-2xl overflow-hidden shadow-2xs border border-gray-100 flex items-center justify-center bg-[#FFF8F4] select-none ${className}`}>
      {hasRealImage ? (
        <img
          src={avatar}
          alt={name || 'Flatmate'}
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : isArun ? (
        /* Arun SVG Avatar: Orange rounded background, round glasses, navy turtleneck, happy smile */
        <svg viewBox="0 0 200 230" className="w-full h-full object-cover" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Orange/Amber Background */}
          <rect width="200" height="230" rx="18" fill="#F59E0B" />
          <path d="M0 80 Q100 20 200 80 L200 230 L0 230 Z" fill="#EA580C" opacity="0.25" />
          {/* Body / Sweater */}
          <path d="M30 230 C30 165, 65 145, 100 145 C135 145, 170 165, 170 230 Z" fill="#374151" />
          {/* Turtleneck collar */}
          <rect x="74" y="136" width="52" height="24" rx="8" fill="#1F2937" />
          {/* Neck */}
          <rect x="82" y="118" width="36" height="26" fill="#FDBA74" />
          {/* Face */}
          <ellipse cx="100" cy="102" rx="42" ry="46" fill="#FED7AA" />
          {/* Ears */}
          <circle cx="56" cy="104" r="9" fill="#FED7AA" />
          <circle cx="144" cy="104" r="9" fill="#FED7AA" />
          {/* Dark Hair */}
          <path d="M58 98 C54 62, 75 42, 100 42 C128 42, 146 60, 144 98 C138 72, 122 66, 100 66 C78 66, 68 76, 58 98 Z" fill="#1F2937" />
          <path d="M62 76 C76 54, 120 54, 138 76 C128 66, 112 64, 100 64 C82 64, 72 68, 62 76 Z" fill="#111827" />
          {/* Eyebrows */}
          <path d="M72 88 Q84 84 94 88" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" />
          <path d="M106 88 Q116 84 128 88" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" />
          {/* Round Glasses */}
          <circle cx="82" cy="102" r="16" stroke="#111827" strokeWidth="4" fill="rgba(255,255,255,0.2)" />
          <circle cx="118" cy="102" r="16" stroke="#111827" strokeWidth="4" fill="rgba(255,255,255,0.2)" />
          <line x1="98" y1="102" x2="102" y2="102" stroke="#111827" strokeWidth="4" />
          {/* Eyes */}
          <circle cx="82" cy="102" r="4.5" fill="#111827" />
          <circle cx="118" cy="102" r="4.5" fill="#111827" />
          {/* Nose */}
          <path d="M97 108 Q100 114 103 114" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" fill="none" />
          {/* Broad Happy Smile */}
          <path d="M84 122 Q100 140 116 122 Z" fill="#FFFFFF" stroke="#EA580C" strokeWidth="1.5" />
        </svg>
      ) : isRajavelu ? (
        /* Rajavelu SVG Avatar: Bright yellow rounded background, dark hair, neat mustache, blue jacket */
        <svg viewBox="0 0 200 230" className="w-full h-full object-cover" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Golden Yellow Background */}
          <rect width="200" height="230" rx="18" fill="#FACC15" />
          <circle cx="100" cy="115" r="85" fill="#EAB308" />
          {/* Blue Jacket */}
          <path d="M25 230 C25 165, 62 145, 100 145 C138 145, 175 165, 175 230 Z" fill="#1E3A8A" />
          {/* White inner T-shirt */}
          <path d="M80 155 L100 195 L120 155 Z" fill="#FFFFFF" />
          {/* Neck */}
          <rect x="84" y="122" width="32" height="26" fill="#FDBA74" />
          {/* Face */}
          <ellipse cx="100" cy="106" rx="42" ry="46" fill="#FED7AA" />
          {/* Ears */}
          <circle cx="56" cy="108" r="9" fill="#FED7AA" />
          <circle cx="144" cy="108" r="9" fill="#FED7AA" />
          {/* Dark Brown Hair */}
          <path d="M58 96 C54 58, 76 40, 100 40 C128 40, 146 58, 144 96 C138 70, 122 64, 100 64 C78 64, 68 74, 58 96 Z" fill="#451A03" />
          {/* Eyebrows */}
          <path d="M72 90 Q82 86 92 90" stroke="#451A03" strokeWidth="3" strokeLinecap="round" />
          <path d="M108 90 Q118 86 128 90" stroke="#451A03" strokeWidth="3" strokeLinecap="round" />
          {/* Eyes */}
          <circle cx="82" cy="102" r="5" fill="#1F2937" />
          <circle cx="118" cy="102" r="5" fill="#1F2937" />
          {/* Nose */}
          <path d="M98 108 Q100 114 103 114" stroke="#B45309" strokeWidth="2" strokeLinecap="round" fill="none" />
          {/* Stylish Mustache */}
          <path d="M80 120 C90 116, 98 120, 100 122 C102 120, 110 116, 120 120 C114 126, 104 125, 100 126 C96 125, 86 126, 80 120 Z" fill="#451A03" />
          {/* Gentle Smile */}
          <path d="M90 128 Q100 136 110 128" stroke="#B45309" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      ) : isFemale ? (
        /* Female Stylized SVG Avatar: Warm Rose/Peach Background */
        <svg viewBox="0 0 200 230" className="w-full h-full object-cover" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="230" rx="18" fill="#F472B6" />
          <circle cx="100" cy="115" r="85" fill="#EC4899" opacity="0.8" />
          {/* Long Hair Back */}
          <path d="M45 90 C45 50, 155 50, 155 90 L165 210 C165 210, 145 220, 100 220 C55 220, 35 210, 35 210 Z" fill="#3B0764" />
          {/* Maroon Top */}
          <path d="M40 230 C40 170, 70 155, 100 155 C130 155, 160 170, 160 230 Z" fill="#831843" />
          {/* Neck */}
          <rect x="85" y="125" width="30" height="24" fill="#FDBA74" />
          {/* Face */}
          <ellipse cx="100" cy="108" rx="38" ry="42" fill="#FED7AA" />
          {/* Front Bangs Hair */}
          <path d="M60 85 C65 55, 135 55, 140 85 C125 70, 110 68, 100 68 C85 68, 70 72, 60 85 Z" fill="#1F2937" />
          {/* Eyebrows */}
          <path d="M74 94 Q84 90 92 94" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M108 94 Q116 90 126 94" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
          {/* Eyes */}
          <ellipse cx="83" cy="104" rx="4.5" ry="3.5" fill="#1F2937" />
          <ellipse cx="117" cy="104" rx="4.5" ry="3.5" fill="#1F2937" />
          {/* Nose */}
          <path d="M98 109 Q100 114 102 114" stroke="#F43F5E" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          {/* Lips */}
          <path d="M88 123 Q100 134 112 123 Q100 128 88 123 Z" fill="#BE123C" />
        </svg>
      ) : (
        /* Modern Friendly Avatar for any other seeker */
        <svg viewBox="0 0 200 230" className="w-full h-full object-cover" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="200" height="230" rx="18" fill="#0D9488" />
          <circle cx="100" cy="115" r="85" fill="#14B8A6" />
          {/* Sweater */}
          <path d="M35 230 C35 165, 70 148, 100 148 C130 148, 165 165, 165 230 Z" fill="#0F172A" />
          {/* Neck */}
          <rect x="85" y="122" width="30" height="24" fill="#FDBA74" />
          {/* Face */}
          <ellipse cx="100" cy="106" rx="40" ry="44" fill="#FED7AA" />
          {/* Short Dark Hair */}
          <path d="M60 92 C56 55, 78 38, 100 38 C126 38, 144 55, 142 92 C134 68, 118 62, 100 62 C80 62, 70 70, 60 92 Z" fill="#1E293B" />
          {/* Eyes */}
          <circle cx="83" cy="102" r="4.5" fill="#0F172A" />
          <circle cx="117" cy="102" r="4.5" fill="#0F172A" />
          {/* Smile */}
          <path d="M88 120 Q100 134 112 120" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </svg>
      )}

      {/* Verified checkmark badge in bottom corner */}
      {isVerified && (
        <span
          className="absolute bottom-2 right-2 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center shadow-xs"
          title="Verified Flatmate"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
        </span>
      )}
    </div>
  );
}
