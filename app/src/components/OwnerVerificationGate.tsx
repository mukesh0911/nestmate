/**
 * OwnerVerificationGate — shown in Owner Dashboard and EditListing
 * when the owner has not yet completed identity verification.
 *
 * This component renders the full verification flow:
 *   1. Current status display (NOT_STARTED / SUBMITTED / UNDER_REVIEW / REJECTED / RESUBMISSION_REQUIRED)
 *   2. Document upload and submission form
 *   3. Real-time status updates via Firestore subscription
 *
 * It does NOT render when status === APPROVED (the listing is public).
 *
 * TRUST SIGNAL ACCURACY:
 *   We verify identity (via document review), NOT property ownership.
 *   The UI copy reflects this distinction.
 */

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useStorage } from '@/hooks/useStorage';
import {
  subscribeToOwnerVerification,
  submitOwnerVerification,
  verificationStatusLabel,
  verificationStatusDescription,
  type OwnerVerification,
  type OwnerVerificationStatus,
  type VerificationDocType,
} from '@/lib/ownerVerification';
import {
  ShieldCheck, Shield, AlertTriangle, CheckCircle2, Clock,
  Upload, FileText, X, Loader2, ArrowRight, RefreshCcw
} from 'lucide-react';

// ─── Props ───────────────────────────────────────────────────────────────────

interface OwnerVerificationGateProps {
  /** If provided, shown as context for why verification is needed */
  listingTitle?: string;
  /** Called when the user dismisses or cancels (optional) */
  onDismiss?: () => void;
  /** Show as inline panel (default) or full-screen modal overlay */
  variant?: 'inline' | 'fullscreen';
}

// ─── Status visual config ─────────────────────────────────────────────────────

function StatusConfig(status: OwnerVerificationStatus | null | undefined) {
  switch (status) {
    case 'APPROVED':
      return {
        icon: <CheckCircle2 className="w-8 h-8 text-teal-600" />,
        bg: 'bg-teal-50',
        border: 'border-teal-200',
        badge: 'bg-teal-100 text-teal-800',
        title: 'Identity Verified',
      };
    case 'SUBMITTED':
    case 'UNDER_REVIEW':
      return {
        icon: <Clock className="w-8 h-8 text-amber-600" />,
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        badge: 'bg-amber-100 text-amber-800',
        title: 'Under Review',
      };
    case 'REJECTED':
      return {
        icon: <AlertTriangle className="w-8 h-8 text-red-600" />,
        bg: 'bg-red-50',
        border: 'border-red-200',
        badge: 'bg-red-100 text-red-800',
        title: 'Verification Rejected',
      };
    case 'RESUBMISSION_REQUIRED':
      return {
        icon: <RefreshCcw className="w-8 h-8 text-orange-600" />,
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        badge: 'bg-orange-100 text-orange-800',
        title: 'Resubmission Required',
      };
    default:
      return {
        icon: <Shield className="w-8 h-8 text-slate-500" />,
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        badge: 'bg-slate-100 text-slate-700',
        title: 'Verification Required',
      };
  }
}

const DOC_TYPES: { value: VerificationDocType; label: string }[] = [
  { value: 'aadhaar', label: 'Aadhaar Card' },
  { value: 'passport', label: 'Passport' },
  { value: 'driving_license', label: 'Driving License' },
  { value: 'voter_id', label: 'Voter ID' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export default function OwnerVerificationGate({
  listingTitle,
  onDismiss,
  variant = 'inline',
}: OwnerVerificationGateProps) {
  const { user } = useAuth();
  const { uploadVerificationDocument } = useStorage();

  const [verification, setVerification] = useState<OwnerVerification | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(true);

  // Submission form state
  const [showForm, setShowForm] = useState(false);
  const [docType, setDocType] = useState<VerificationDocType>('aadhaar');
  const [declaredName, setDeclaredName] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time subscription to verification status
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeToOwnerVerification(user.uid, (v) => {
      setVerification(v);
      setVerificationLoading(false);
    });
    return unsub;
  }, [user?.uid]);

  const currentStatus = verification?.status ?? 'NOT_STARTED';
  const cfg = StatusConfig(currentStatus);

  const canSubmit = currentStatus === 'NOT_STARTED'
    || currentStatus === 'REJECTED'
    || currentStatus === 'RESUBMISSION_REQUIRED';

  const isPending = currentStatus === 'SUBMITTED' || currentStatus === 'UNDER_REVIEW';

  // Don't render anything if approved — caller should conditionally mount this
  if (currentStatus === 'APPROVED') return null;

  if (verificationLoading) {
    return (
      <div className={`flex items-center justify-center py-12 ${variant === 'fullscreen' ? 'min-h-screen bg-parchment' : ''}`}>
        <Loader2 className="w-8 h-8 animate-spin text-fire" />
      </div>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setSubmitError('File must be smaller than 10MB');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
      setSubmitError('Please upload a JPG, PNG, WEBP, or PDF file');
      return;
    }
    setDocFile(file);
    setSubmitError('');
    if (file.type.startsWith('image/')) {
      setDocPreview(URL.createObjectURL(file));
    } else {
      setDocPreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!user?.uid) return;
    if (!docFile) { setSubmitError('Please upload your identity document'); return; }
    if (!declaredName.trim()) { setSubmitError('Please enter your full name as it appears on the document'); return; }

    setSubmitting(true);
    setSubmitError('');
    setUploadProgress(0);

    try {
      // Upload document to Firebase Storage (in a protected path)
      const documentUrl = await uploadVerificationDocument(docFile, user.uid, (pct) => setUploadProgress(pct));

      // Submit verification record
      await submitOwnerVerification(user.uid, {
        documentType: docType,
        documentUrl,
        declaredName: declaredName.trim(),
      });

      setSubmitSuccess(true);
      setShowForm(false);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit verification. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Main render ──────────────────────────────────────────────────────────

  const containerClass = variant === 'fullscreen'
    ? 'min-h-screen bg-parchment flex items-start justify-center p-6 pt-12'
    : '';

  return (
    <div className={containerClass}>
      <div className={`w-full max-w-2xl mx-auto ${variant === 'fullscreen' ? '' : ''}`}>

        {/* Gate Banner */}
        <div className={`rounded-2xl border-2 p-6 ${cfg.bg} ${cfg.border} mb-4`}>
          <div className="flex items-start gap-4">
            <div className="shrink-0 mt-0.5">{cfg.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h2 className="font-bold text-lg text-slate-900">{cfg.title}</h2>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.badge}`}>
                  {verificationStatusLabel(currentStatus)}
                </span>
              </div>

              {listingTitle && (
                <p className="text-xs text-slate-500 mb-2">
                  Listing: <span className="font-semibold">{listingTitle}</span>
                </p>
              )}

              <p className="text-sm text-slate-700 leading-relaxed">
                {verificationStatusDescription(currentStatus)}
              </p>

              {/* Admin rejection note */}
              {(currentStatus === 'REJECTED' || currentStatus === 'RESUBMISSION_REQUIRED') && verification?.reviewNote && (
                <div className="mt-3 p-3 bg-white/70 rounded-xl border border-current/10">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">Admin Note</p>
                  <p className="text-sm text-slate-800">{verification.reviewNote}</p>
                </div>
              )}

              {/* Resubmission count */}
              {(verification?.resubmissionCount ?? 0) > 0 && (
                <p className="text-xs text-slate-400 mt-2">
                  Resubmission #{verification!.resubmissionCount}
                </p>
              )}
            </div>

            {/* Dismiss button (optional) */}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="shrink-0 p-1.5 hover:bg-black/5 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex gap-3 flex-wrap">
            {canSubmit && !showForm && (
              <button
                onClick={() => { setShowForm(true); setSubmitError(''); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-fire text-white rounded-xl font-semibold text-sm hover:bg-fire-dark transition-all shadow-sm shadow-fire/20"
              >
                <ShieldCheck className="w-4 h-4" />
                {currentStatus === 'NOT_STARTED' ? 'Start Verification' : 'Resubmit Documents'}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
            {isPending && (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Awaiting admin review — typically 1–2 business days
              </div>
            )}
          </div>
        </div>

        {/* Submit success */}
        {submitSuccess && (
          <div className="bg-teal-50 border-2 border-teal-200 rounded-2xl p-5 flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-teal-600 shrink-0" />
            <div>
              <p className="font-semibold text-teal-900">Documents submitted successfully!</p>
              <p className="text-sm text-teal-700">Our team will review your documents within 1–2 business days. You'll receive a notification once reviewed.</p>
            </div>
          </div>
        )}

        {/* Submission Form */}
        {showForm && canSubmit && (
          <div className="bg-white rounded-2xl border border-border shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-fire" />
                Submit Identity Document
              </h3>
              <button
                onClick={() => { setShowForm(false); setSubmitError(''); }}
                className="p-1.5 hover:bg-slate-100 rounded-full"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Honest disclaimer */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <p className="text-xs text-blue-800 leading-relaxed">
                <strong>What we verify:</strong> Your identity only — not property ownership.
                Your trust badge will show "Identity Verified by NestMate," not property ownership.
                Documents are reviewed by NestMate staff and are not shared with third parties.
              </p>
            </div>

            {/* Full name */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
                Full Name (as on document) *
              </label>
              <input
                type="text"
                value={declaredName}
                onChange={e => setDeclaredName(e.target.value)}
                placeholder="e.g. Rajesh Kumar"
                className="input-nestmate w-full"
              />
            </div>

            {/* Document type */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
                Document Type *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DOC_TYPES.map(dt => (
                  <button
                    key={dt.value}
                    type="button"
                    onClick={() => setDocType(dt.value)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-all text-left ${
                      docType === dt.value
                        ? 'border-fire bg-fire/5 text-fire font-bold'
                        : 'border-border text-ink/60 hover:border-fire/40'
                    }`}
                  >
                    {dt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Document upload */}
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1.5">
                Document Image or PDF *
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={handleFileSelect}
              />
              {!docFile ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:border-fire/40 hover:bg-fire/5 transition-all"
                >
                  <Upload className="w-6 h-6 text-slate-400" />
                  <p className="text-sm text-slate-500">Click to upload</p>
                  <p className="text-xs text-slate-400">JPG, PNG, WEBP or PDF · Max 10MB</p>
                </button>
              ) : (
                <div className="border-2 border-fire/30 rounded-xl p-3 relative">
                  {docPreview ? (
                    <img src={docPreview} alt="Document preview" className="w-full max-h-48 object-contain rounded-lg" />
                  ) : (
                    <div className="flex items-center gap-3 p-3">
                      <FileText className="w-8 h-8 text-fire" />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{docFile.name}</p>
                        <p className="text-xs text-slate-500">{(docFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => { setDocFile(null); setDocPreview(null); }}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 text-xs text-fire font-medium hover:underline"
                  >
                    Change document
                  </button>
                </div>
              )}
            </div>

            {/* Upload progress */}
            {submitting && uploadProgress > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Uploading document...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-cream rounded-full overflow-hidden">
                  <div
                    className="h-full bg-fire rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-sm text-red-700">{submitError}</p>
              </div>
            )}

            {/* Submit button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !docFile || !declaredName.trim()}
              className="w-full py-3 bg-fire text-white rounded-xl font-bold text-sm hover:bg-fire-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Submit for Verification
                </>
              )}
            </button>

            <p className="text-xs text-center text-slate-400">
              Your listing will go live automatically once our team approves your identity.
            </p>
          </div>
        )}

        {/* What happens next timeline */}
        {(currentStatus === 'NOT_STARTED' || currentStatus === 'SUBMITTED' || currentStatus === 'UNDER_REVIEW') && !showForm && !submitSuccess && (
          <div className="bg-white rounded-2xl border border-border p-5 mt-4">
            <h4 className="font-semibold text-slate-800 mb-4 text-sm">What happens next?</h4>
            <div className="space-y-3">
              {[
                { step: 1, label: 'Submit ID', desc: 'Upload a government-issued photo ID', done: currentStatus !== 'NOT_STARTED' },
                { step: 2, label: 'Admin Review', desc: 'NestMate team reviews within 1–2 business days', done: false },
                { step: 3, label: 'Listing Goes Live', desc: 'Your listing automatically becomes visible to seekers', done: false },
              ].map(item => (
                <div key={item.step} className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    item.done ? 'bg-teal-500 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {item.done ? <CheckCircle2 className="w-4 h-4" /> : item.step}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${item.done ? 'text-teal-700' : 'text-slate-800'}`}>{item.label}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
