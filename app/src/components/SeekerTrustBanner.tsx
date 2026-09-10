import { useState } from 'react';
import { ShieldCheck, ArrowRight, X, Sparkles } from 'lucide-react';

interface SeekerTrustBannerProps {
  onVerifyClick: () => void;
  isVerified?: boolean;
}

export default function SeekerTrustBanner({ onVerifyClick, isVerified }: SeekerTrustBannerProps) {
  const [dismissed, setDismissed] = useState(() => {
    return sessionStorage.getItem('nestmate_trust_banner_dismissed') === 'true';
  });

  if (isVerified || dismissed) return null;

  const handleDismiss = () => {
    sessionStorage.setItem('nestmate_trust_banner_dismissed', 'true');
    setDismissed(true);
  };

  return (
    <div className="card-nestmate relative overflow-hidden p-4 sm:p-4.5 mb-5 border-border/80 bg-white shadow-xs">
      {/* Subtle brand tint gradient accent */}
      <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-fire via-orange-400 to-fire-dark" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 pl-2">
        {/* Left: Icon & Brand Copy */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-fire/10 text-fire flex items-center justify-center flex-shrink-0 border border-fire/15">
            <ShieldCheck className="w-5 h-5 stroke-[2]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="badge-fire text-[10px] font-semibold py-0.5 px-2">
                TOP LIST VISIBILITY
              </span>
              <span className="text-[11px] text-ink/40 hidden md:inline">
                Verified profiles rank #1 in flatmate searches
              </span>
            </div>
            <h3 className="text-sm font-bold text-ink tracking-tight font-sans">
              Verify your identity to rank first and get 3.2x faster replies
            </h3>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
          <button
            onClick={onVerifyClick}
            className="btn-fire text-xs font-semibold py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span>Verify Profile</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDismiss}
            className="p-2 rounded-xl text-ink/30 hover:text-ink/70 hover:bg-ink/5 transition-colors"
            title="Dismiss for this session"
            aria-label="Dismiss banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
