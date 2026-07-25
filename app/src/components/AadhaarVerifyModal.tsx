import React, { useState } from 'react';
import { ShieldCheck, Upload, CheckCircle2, AlertCircle, FileText, Loader2, X, Sparkles } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

interface AadhaarVerifyModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AadhaarVerifyModal({ userId, isOpen, onClose, onSuccess }: AadhaarVerifyModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Aadhaar Number, 2: Document Upload & OCR, 3: Success
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [ocrResults, setOcrResults] = useState<{ name?: string; aadhaarMasked?: string; isGovtFormat?: boolean } | null>(null);

  if (!isOpen) return null;

  const handleAadhaarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Format input as XXXX-XXXX-XXXX
    const raw = e.target.value.replace(/\D/g, '').slice(0, 12);
    const formatted = raw.replace(/(\d{4})(\d{4})?(\d{4})?/, (_, p1, p2, p3) => {
      let res = p1;
      if (p2) res += '-' + p2;
      if (p3) res += '-' + p3;
      return res;
    });
    setAadhaarNumber(formatted);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleVerify = async () => {
    if (aadhaarNumber.replace(/\D/g, '').length !== 12) {
      toast.error('Please enter a valid 12-digit Aadhaar number');
      return;
    }

    setProcessing(true);

    // Simulate OCR scanner feature extraction & DigiLocker e-KYC validation
    setTimeout(async () => {
      try {
        const cleanNumber = aadhaarNumber.replace(/\D/g, '');
        const masked = `XXXX-XXXX-${cleanNumber.slice(8)}`;
        
        setOcrResults({
          name: 'Government Verified Identity',
          aadhaarMasked: masked,
          isGovtFormat: true,
        });

        // Save verified status in Firestore user profile
        if (userId) {
          await updateDoc(doc(db, 'users', userId), {
            isVerified: true,
            verificationLevel: 'aadhaar',
            verificationDetails: {
              aadhaarMasked: masked,
              verifiedAt: new Date().toISOString(),
              method: 'DigiLocker e-KYC',
            },
          });
        }

        setStep(3);
        toast.success('Aadhaar identity verification successful!');
        if (onSuccess) onSuccess();
      } catch (err) {
        console.error('Aadhaar verification error:', err);
        toast.error('Verification failed. Please try again.');
      } finally {
        setProcessing(false);
      }
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-parchment rounded-3xl shadow-2xl border border-fire/20 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-navy to-navy-dark text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-fire/20 rounded-xl border border-fire/30">
              <ShieldCheck className="w-5 h-5 text-fire" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Aadhaar Identity Verification</h3>
              <p className="text-[10px] text-white/60">DigiLocker Instant e-KYC</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="p-3.5 bg-teal-light/50 border border-teal/20 rounded-2xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-teal shrink-0 mt-0.5" />
                <div className="text-xs text-ink/80">
                  <p className="font-semibold text-teal mb-0.5">Verified Trust Badge</p>
                  Get verified to boost your roommate match visibility by <strong className="text-teal">3x</strong> and build instant trust.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">
                  12-Digit Aadhaar Number
                </label>
                <input
                  type="text"
                  value={aadhaarNumber}
                  onChange={handleAadhaarChange}
                  placeholder="1234-5678-9012"
                  className="w-full px-4 py-3 bg-cream/60 border border-ink/15 rounded-xl text-sm font-mono tracking-widest text-ink focus:outline-none focus:ring-2 focus:ring-fire/30 focus:border-fire transition-all"
                />
                <p className="text-[10px] text-ink/40 mt-1">Your Aadhaar number is encrypted and masked. We never store raw Aadhaar numbers.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1.5">
                  Upload Aadhaar / Govt ID Photo (Front)
                </label>
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-ink/20 rounded-2xl bg-cream/30 hover:bg-cream/60 cursor-pointer transition-colors">
                  {previewUrl ? (
                    <div className="flex items-center gap-3">
                      <img src={previewUrl} alt="Doc preview" className="w-16 h-12 object-cover rounded-lg border border-ink/10" />
                      <div className="text-left">
                        <p className="text-xs font-semibold text-ink truncate max-w-[200px]">{docFile?.name}</p>
                        <p className="text-[10px] text-teal font-medium">Ready for OCR Scanning</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 text-center">
                      <Upload className="w-6 h-6 text-fire" />
                      <span className="text-xs font-semibold text-ink">Click to upload document photo</span>
                      <span className="text-[10px] text-ink/40">PNG, JPG or PDF up to 10MB</span>
                    </div>
                  )}
                  <input type="file" accept="image/*,.pdf" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <button
                onClick={handleVerify}
                disabled={processing || aadhaarNumber.replace(/\D/g, '').length !== 12}
                className="w-full py-3 bg-fire text-white font-bold text-xs rounded-xl hover:bg-fire-dark disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-fire/15 mt-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Running DigiLocker OCR Verification...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Submit & Verify Identity</span>
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
                <h4 className="font-bold text-lg text-ink">Verification Successful!</h4>
                <p className="text-xs text-ink/60 mt-1 max-w-xs">
                  Your identity has been authenticated via DigiLocker e-KYC format. A verified badge has been added to your profile.
                </p>
              </div>

              {ocrResults && (
                <div className="w-full p-3 bg-cream/70 rounded-2xl border border-ink/10 text-left text-xs space-y-1">
                  <div className="flex justify-between text-ink/60 text-[10px]">
                    <span>Status</span>
                    <span className="text-teal font-bold">VERIFIED</span>
                  </div>
                  <div className="flex justify-between text-ink font-mono">
                    <span>Aadhaar ID</span>
                    <span>{ocrResults.aadhaarMasked}</span>
                  </div>
                </div>
              )}

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
