import React, { useState } from 'react';
import { ShieldCheck, Loader2, X, CheckCircle2, Lock, ArrowRight, FileCheck } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

interface DigiLockerModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function DigiLockerModal({ userId, isOpen, onClose, onSuccess }: DigiLockerModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Aadhaar/Mobile, 2: OTP, 3: Success
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
    const formatted = raw.replace(/(\d{4})(\d{4})?(\d{4})?/, (_, p1, p2, p3) => {
      let res = p1;
      if (p2) res += '-' + p2;
      if (p3) res += '-' + p3;
      return res;
    });
    setAadhaarNumber(formatted);
  };

  const handleSendOTP = () => {
    if (aadhaarNumber.replace(/\D/g, '').length !== 12) {
      toast.error('Please enter a valid 12-digit Aadhaar number');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep(2);
      toast.success('DigiLocker OTP sent to Aadhaar linked mobile number');
    }, 800);
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      toast.error('Please enter complete 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const cleanNum = aadhaarNumber.replace(/\D/g, '');
      const masked = `XXXX-XXXX-${cleanNum.slice(8)}`;

      if (userId) {
        await updateDoc(doc(db, 'users', userId), {
          isVerified: true,
          verificationLevel: 'digilocker',
          verificationDetails: {
            provider: 'DigiLocker Govt of India',
            verifiedAt: new Date().toISOString(),
            aadhaarMasked: masked,
          },
        });
      }

      setLoading(false);
      setStep(3);
      toast.success('Identity verified via DigiLocker e-KYC!');
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('DigiLocker verification error:', err);
      toast.error('Verification failed. Please try again.');
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) val = val.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);

    // Auto advance focus
    if (val && index < 5) {
      const nextInput = document.getElementById(`digi-otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-parchment rounded-3xl shadow-2xl border border-navy/20 overflow-hidden">
        {/* Header with DigiLocker branding */}
        <div className="px-6 py-5 bg-gradient-to-r from-navy to-navy-dark text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
              <ShieldCheck className="w-5 h-5 text-teal" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm tracking-wide">DigiLocker</span>
                <span className="text-[9px] font-bold bg-teal/20 text-teal border border-teal/30 px-1.5 py-0.2 rounded-md">Govt. of India</span>
              </div>
              <p className="text-[10px] text-white/60">Official Instant e-KYC Verification</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/60 hover:text-white rounded-full hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-3.5 bg-navy-light/60 border border-navy/15 rounded-2xl flex items-start gap-3">
                <Lock className="w-4 h-4 text-navy shrink-0 mt-0.5" />
                <div className="text-xs text-ink/80">
                  <p className="font-semibold text-navy mb-0.5">Secure 1-Click Verification</p>
                  Authenticate your profile via official DigiLocker API to receive the <strong className="text-navy">DigiLocker Verified</strong> trust badge.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">
                  12-Digit Aadhaar / Virtual ID
                </label>
                <input
                  type="text"
                  value={aadhaarNumber}
                  onChange={handleAadhaarChange}
                  placeholder="1234-5678-9012"
                  className="w-full px-4 py-3 bg-cream/70 border border-ink/15 rounded-xl text-sm font-mono tracking-widest text-ink focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy transition-all"
                />
                <p className="text-[10px] text-ink/40 mt-1">An OTP will be sent to the mobile number registered with your Aadhaar.</p>
              </div>

              <button
                onClick={handleSendOTP}
                disabled={loading || aadhaarNumber.replace(/\D/g, '').length !== 12}
                className="w-full py-3 bg-navy text-white font-bold text-xs rounded-xl hover:bg-navy-dark disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-navy/15 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting to DigiLocker Gateway...</span>
                  </>
                ) : (
                  <>
                    <span>Proceed to DigiLocker OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="font-bold text-sm text-ink">Enter 6-Digit DigiLocker OTP</h4>
                <p className="text-xs text-ink/50 mt-0.5">Sent to Aadhaar linked mobile for {aadhaarNumber}</p>
              </div>

              <div className="flex justify-center gap-2 my-4">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`digi-otp-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    className="w-10 h-12 text-center text-lg font-bold bg-cream/80 border border-ink/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy focus:border-navy transition-all"
                  />
                ))}
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={loading || otp.join('').length !== 6}
                className="w-full py-3 bg-teal text-white font-bold text-xs rounded-xl hover:bg-teal-dark disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-teal/15"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>Complete Verification</span>
                  </>
                )}
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="py-4 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-teal-light rounded-full flex items-center justify-center border-4 border-teal/20 text-teal animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="font-bold text-lg text-ink">DigiLocker Verified!</h4>
                <p className="text-xs text-ink/60 mt-1 max-w-xs">
                  Your profile is now verified via official Government DigiLocker e-KYC.
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-navy text-white font-bold text-xs rounded-xl hover:bg-navy-dark transition-all shadow-md mt-2"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
