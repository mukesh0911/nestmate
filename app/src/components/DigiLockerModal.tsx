/**
 * STUB — Future Production Integration (DigiLocker / UIDAI).
 * Not wired into any route. Must NOT grant isVerified client-side.
 * Real e-KYC requires paid/regulatory DigiLocker API + server verification.
 */
import { X, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface DigiLockerModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function DigiLockerModal({ isOpen, onClose }: DigiLockerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-border relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full text-ink/40 hover:text-ink hover:bg-cream/60">
          <X className="w-5 h-5" />
        </button>
        <div className="flex flex-col items-center text-center gap-3 py-6">
          <div className="w-14 h-14 rounded-2xl bg-navy/10 flex items-center justify-center">
            <Lock className="w-7 h-7 text-navy" />
          </div>
          <h3 className="text-lg font-bold text-ink">DigiLocker e-KYC</h3>
          <p className="text-sm text-ink/60 leading-relaxed">
            Official DigiLocker verification is a <strong>Future Production Integration</strong>.
            For now, upload your ID from Edit Profile — our team reviews submissions manually.
          </p>
          <button
            onClick={() => {
              toast.info('Use Edit Profile → Verification to submit documents for admin review.');
              onClose();
            }}
            className="mt-2 w-full py-3 bg-fire text-white rounded-xl text-sm font-semibold"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
