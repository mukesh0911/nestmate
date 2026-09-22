import React from 'react';
import { createPortal } from 'react-dom';
import { X, Phone, ShieldCheck, Clock, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import FlatmateAvatar from './FlatmateAvatar';
import type { UserProfile } from '@/hooks/useAuth';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile | null;
}

export default function ContactModal({ isOpen, onClose, profile }: ContactModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !profile) return null;

  const hasPhone = Boolean(profile.phone && profile.phone.trim());
  const phoneNumber = profile.phone || '';

  const handleCopy = () => {
    if (!phoneNumber) return;
    navigator.clipboard.writeText(phoneNumber);
    setCopied(true);
    toast.success('Phone number copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const displayLocation = profile.locality && profile.city
    ? `${profile.locality}, ${profile.city}`
    : profile.locality || profile.city || 'Location not specified';

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0">
            <FlatmateAvatar
              avatar={profile.avatar}
              name={profile.name}
              gender={profile.gender}
              isVerified={profile.isVerified}
              className="w-full h-full"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-lg text-[#1A1A2E] truncate">{profile.name}</h3>
              {profile.isVerified && (
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">{displayLocation}</p>
            <p className="text-xs font-bold text-[#E5501A] mt-0.5">
              {profile.budget ? `₹ ${profile.budget.toLocaleString('en-IN')} / month` : 'Flexible budget'}
            </p>
          </div>
        </div>

        <div className="space-y-3 bg-[#FFFBF7] border border-[#FFEDE2] rounded-2xl p-4 mb-5 text-xs text-slate-700">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Contact Number</span>
            <span className="font-bold text-[#1A1A2E] text-sm tracking-wide">
              {hasPhone ? phoneNumber : 'Not directly shared'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-emerald-700 font-semibold pt-1 border-t border-[#FFEDE2]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Identity &amp; Account Verified on NestMate</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <span>{hasPhone ? 'Best time to call: 6:00 PM – 9:30 PM' : 'Connect via in-app chat to request phone share'}</span>
          </div>
        </div>

        {hasPhone ? (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <a
              href={`tel:${phoneNumber}`}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#E5501A] hover:bg-[#D0400B] text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs shadow-[#E5501A]/20"
            >
              <Phone className="w-4 h-4" />
              <span>Call Now</span>
            </a>
          </div>
        ) : (
          <button
            onClick={() => {
              onClose();
              window.location.href = `/chat/${profile.uid}`;
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1A1A2E] hover:bg-[#2A2A44] text-white font-semibold text-xs transition-colors cursor-pointer shadow-xs"
          >
            <span>Message on NestMate Chat</span>
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
