import { useState, useEffect, useMemo } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import type { UserProfile } from '@/hooks/useAuth';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { Search, Loader2, X, CheckCircle, ShieldCheck, XCircle, RefreshCcw, Eye, AlertTriangle } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Verification {
  id: string;
  userId: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected';
  documentUrl: string;
  submittedAt: Timestamp;
  reviewedAt: Timestamp | null;
  reviewNote: string | null;
  // ownerVerification-specific fields
  _source?: 'ownerVerification' | 'legacy';
  _ownerVerifStatus?: string;
  _declaredName?: string;
  _resubmissionCount?: number;
  _auditTrail?: Array<{ status: string; actorId?: string; note?: string; timestamp?: unknown }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  aadhaar: 'Aadhaar',
  passport: 'Passport',
  driving_license: 'Driving License',
  voter_id: 'Voter ID',
  work_id: 'Work ID',
  student_id: 'Student ID',
};

function formatDate(ts: Timestamp | null | undefined): string {
  if (!ts || !(ts as Timestamp).toDate) return '—';
  return (ts as Timestamp).toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StatusBadge({ status, ownerVerifStatus }: { status: string; ownerVerifStatus?: string }) {
  const display = ownerVerifStatus || status;
  const cls =
    display === 'APPROVED' || display === 'approved' ? 'bg-green-500 text-white' :
    display === 'REJECTED' || display === 'rejected' ? 'bg-red-500 text-white' :
    display === 'UNDER_REVIEW' ? 'bg-blue-500 text-white' :
    display === 'RESUBMISSION_REQUIRED' ? 'bg-orange-500 text-white' :
    display === 'SUBMITTED' ? 'bg-amber-100 text-amber-800' :
    'bg-amber-100 text-amber-800';
  const label =
    display === 'SUBMITTED' ? 'Submitted' :
    display === 'UNDER_REVIEW' ? 'Under Review' :
    display === 'APPROVED' ? 'Approved' :
    display === 'REJECTED' ? 'Rejected' :
    display === 'RESUBMISSION_REQUIRED' ? 'Resubmission Required' :
    display;
  return <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminVerifications() {
  const { getAllVerifications, approveVerification, rejectVerification, requestResubmission, beginReview } = useAdmin();

  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});

  // Detail modal
  const [selected, setSelected] = useState<Verification | null>(null);
  // Lightbox
  const [lightbox, setLightbox] = useState(false);
  // Action modes
  const [actionMode, setActionMode] = useState<'reject' | 'resubmit' | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    getAllVerifications()
      .then(v => { setVerifications(v as Verification[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, [getAllVerifications]);

  // Fetch user profiles
  useEffect(() => {
    if (verifications.length === 0) return;
    const ids = new Set(verifications.map(v => v.userId));
    const fetchMissing = async () => {
      const newProfiles = { ...profiles };
      let changed = false;
      for (const uid of ids) {
        if (!newProfiles[uid]) {
          try {
            const snap = await getDoc(doc(db, 'users', uid));
            if (snap.exists()) { newProfiles[uid] = snap.data() as UserProfile; changed = true; }
          } catch { /* skip */ }
        }
      }
      if (changed) setProfiles(newProfiles);
    };
    fetchMissing();
  }, [verifications]);

  const filtered = useMemo(() => {
    let result = verifications;
    if (typeFilter !== 'all') result = result.filter(v => v.type === typeFilter);
    if (statusFilter !== 'all') result = result.filter(v => v.status === statusFilter);
    return result;
  }, [verifications, typeFilter, statusFilter]);

  // ─── Action handlers ─────────────────────────────────────────────────────

  const handleBeginReview = async (v: Verification) => {
    if (v._source !== 'ownerVerification') return;
    setActionLoading(true);
    try {
      await beginReview(v.userId);
      setVerifications(prev => prev.map(x =>
        x.id === v.id ? { ...x, _ownerVerifStatus: 'UNDER_REVIEW', status: 'pending' as const } : x
      ));
      if (selected?.id === v.id) setSelected(s => s ? { ...s, _ownerVerifStatus: 'UNDER_REVIEW' } : s);
      toast.success('Marked as Under Review');
    } catch { toast.error('Failed to begin review'); }
    finally { setActionLoading(false); }
  };

  const handleApprove = async (v: Verification) => {
    setActionLoading(true);
    try {
      await approveVerification(v.id, v.userId, v.type, v._source);
      setVerifications(prev => prev.map(x =>
        x.id === v.id ? { ...x, status: 'approved' as const, _ownerVerifStatus: 'APPROVED' } : x
      ));
      setSelected(null);
      toast.success('✅ Verification approved. Listing(s) are now live.');
    } catch { toast.error('Failed to approve'); }
    finally { setActionLoading(false); }
  };

  const handleReject = async (v: Verification) => {
    if (!actionNote.trim()) { toast.error('Rejection reason is required'); return; }
    setActionLoading(true);
    try {
      await rejectVerification(v.id, v.userId, v.type, actionNote.trim(), v._source);
      setVerifications(prev => prev.map(x =>
        x.id === v.id ? { ...x, status: 'rejected' as const, reviewNote: actionNote.trim(), _ownerVerifStatus: 'REJECTED' } : x
      ));
      setSelected(null); setActionMode(null); setActionNote('');
      toast.success('Verification rejected. Owner notified.');
    } catch { toast.error('Failed to reject'); }
    finally { setActionLoading(false); }
  };

  const handleRequestResubmission = async (v: Verification) => {
    if (!actionNote.trim()) { toast.error('Please explain what the owner needs to resubmit'); return; }
    if (v._source !== 'ownerVerification') { toast.error('Resubmission only available for owner verifications'); return; }
    setActionLoading(true);
    try {
      await requestResubmission(v.userId, actionNote.trim());
      setVerifications(prev => prev.map(x =>
        x.id === v.id ? { ...x, _ownerVerifStatus: 'RESUBMISSION_REQUIRED', status: 'pending' as const } : x
      ));
      setSelected(null); setActionMode(null); setActionNote('');
      toast.success('Resubmission requested. Owner notified.');
    } catch { toast.error('Failed to request resubmission'); }
    finally { setActionLoading(false); }
  };

  const getName = (uid: string) => profiles[uid]?.name || uid.slice(0, 8) + '...';
  const getEmail = (uid: string) => profiles[uid]?.email || '';

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-fire animate-spin" /></div>;

  if (verifications.length === 0) {
    return (
      <div className="space-y-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Verifications Queue</h1>
          <p className="text-sm text-gray-500">Review user identity proofs, Aadhaar, and owner verification documents.</p>
        </div>
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
          <CheckCircle className="w-14 h-14 text-green-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">No pending verifications</h2>
          <p className="text-sm text-gray-400">All documents have been reviewed</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Verifications Queue</h1>
        <p className="text-sm text-gray-500">Review user identity proofs, Aadhaar, and owner verification documents.</p>
      </div>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none">
          <option value="all">All Types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none">
          <option value="all">All Status</option>
          <option value="pending">Pending / Under Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      <div className="flex items-center gap-3">
        <p className="text-xs text-gray-500">{filtered.length} verifications found</p>
        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
          {filtered.filter(v => v.status === 'pending').length} pending review
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Submitted</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Source</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.slice(0, 50).map(v => (
                <tr key={v.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => setSelected(v)}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 truncate max-w-[140px]">{getName(v.userId)}</p>
                    <p className="text-[10px] text-gray-400">{getEmail(v.userId)}</p>
                    {v._declaredName && <p className="text-[10px] text-blue-500 font-medium">"{v._declaredName}"</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{TYPE_LABELS[v.type] || v.type}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs hidden sm:table-cell">{formatDate(v.submittedAt)}</td>
                  <td className="px-4 py-3"><StatusBadge status={v.status} ownerVerifStatus={v._ownerVerifStatus} /></td>
                  <td className="px-4 py-3">
                    {v._source === 'ownerVerification' ? (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">🔒 ID Gate</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Legacy</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={e => { e.stopPropagation(); setSelected(v); }} className="text-xs text-fire font-medium hover:underline">Review</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && !lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => { setSelected(null); setActionMode(null); setActionNote(''); }}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-500" />
                Verification Review
                {selected._source === 'ownerVerification' && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold ml-1">🔒 Identity Gate</span>
                )}
              </h3>
              <button onClick={() => { setSelected(null); setActionMode(null); }} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            {/* User info */}
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-500 shrink-0">
                {getName(selected.userId).charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium">{getName(selected.userId)}</p>
                <p className="text-xs text-gray-400">{getEmail(selected.userId)}</p>
                {selected._declaredName && <p className="text-xs text-blue-600 font-medium">Declared: {selected._declaredName}</p>}
              </div>
              <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{TYPE_LABELS[selected.type] || selected.type}</span>
            </div>

            {/* Resubmission count */}
            {(selected._resubmissionCount ?? 0) > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4 flex items-center gap-2">
                <RefreshCcw className="w-4 h-4 text-orange-500" />
                <p className="text-sm text-orange-800">This is resubmission #{selected._resubmissionCount}</p>
              </div>
            )}

            {/* Document preview */}
            {selected.documentUrl ? (
              <div className="mb-4 cursor-pointer" onClick={() => setLightbox(true)}>
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Document (click to enlarge)</p>
                {selected.documentUrl.toLowerCase().includes('.pdf') ? (
                  <a href={selected.documentUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 text-blue-600 text-sm font-medium hover:underline">
                    <Eye className="w-4 h-4" /> View PDF Document
                  </a>
                ) : (
                  <img src={selected.documentUrl} alt="Verification document" className="w-full rounded-xl border border-gray-200 hover:opacity-90 transition-opacity" />
                )}
              </div>
            ) : (
              <div className="mb-4 bg-gray-50 rounded-xl p-6 text-center">
                <p className="text-sm text-gray-400">No document uploaded</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 uppercase font-bold">Submitted</p>
                <p className="text-sm font-medium text-gray-800 mt-1">{formatDate(selected.submittedAt)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 uppercase font-bold">Status</p>
                <div className="mt-1"><StatusBadge status={selected.status} ownerVerifStatus={selected._ownerVerifStatus} /></div>
              </div>
            </div>

            {/* Review note (if already reviewed) */}
            {selected.reviewNote && (
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Review Note</p>
                <p className="text-sm text-gray-600">{selected.reviewNote}</p>
                {selected.reviewedAt && <p className="text-[10px] text-gray-400 mt-2">Reviewed: {formatDate(selected.reviewedAt)}</p>}
              </div>
            )}

            {/* Security notice for ownerVerification */}
            {selected._source === 'ownerVerification' && selected.status === 'pending' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                <p className="text-xs text-amber-800 font-medium flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    <strong>Security action:</strong> Approving will set <code>ownerVerified=true</code> and make ALL pending listings by this owner publicly visible. Reject if the document is unclear, expired, or mismatched.
                  </span>
                </p>
              </div>
            )}

            {/* Actions for pending verifications */}
            {selected.status === 'pending' && !actionMode && (
              <div className="flex flex-col gap-2 pt-2">
                {/* Begin review (owner verifications only) */}
                {selected._source === 'ownerVerification' && selected._ownerVerifStatus === 'SUBMITTED' && (
                  <button onClick={() => handleBeginReview(selected)} disabled={actionLoading}
                    className="w-full py-2.5 bg-blue-500 text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    <Eye className="w-4 h-4" /> Mark as Under Review
                  </button>
                )}
                <div className="flex gap-3">
                  <button onClick={() => handleApprove(selected)} disabled={actionLoading}
                    className="flex-1 py-2.5 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Approve {selected._source === 'ownerVerification' ? '& Make Listing Live' : ''}
                  </button>
                  <button onClick={() => setActionMode('reject')}
                    className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 transition-all flex items-center justify-center gap-2">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
                {selected._source === 'ownerVerification' && (
                  <button onClick={() => setActionMode('resubmit')}
                    className="w-full py-2.5 bg-orange-100 text-orange-700 border border-orange-200 rounded-xl text-sm font-bold hover:bg-orange-200 transition-all flex items-center justify-center gap-2">
                    <RefreshCcw className="w-4 h-4" /> Request Resubmission
                  </button>
                )}
              </div>
            )}

            {/* Rejection form */}
            {actionMode === 'reject' && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <p className="text-sm font-semibold text-red-600">Rejection Reason *</p>
                <textarea value={actionNote} onChange={e => setActionNote(e.target.value)}
                  placeholder="Explain clearly why this was rejected (owner will see this message)..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-red-400 h-24 resize-none" />
                <div className="flex gap-3">
                  <button onClick={() => { setActionMode(null); setActionNote(''); }}
                    className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button onClick={() => handleReject(selected)} disabled={actionLoading || !actionNote.trim()}
                    className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2">
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Rejection'}
                  </button>
                </div>
              </div>
            )}

            {/* Resubmission form */}
            {actionMode === 'resubmit' && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <p className="text-sm font-semibold text-orange-600">What needs to be resubmitted? *</p>
                <textarea value={actionNote} onChange={e => setActionNote(e.target.value)}
                  placeholder="e.g. 'Please upload a clearer photo of your Aadhaar card — the text is unreadable.'"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400 h-24 resize-none" />
                <div className="flex gap-3">
                  <button onClick={() => { setActionMode(null); setActionNote(''); }}
                    className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button onClick={() => handleRequestResubmission(selected)} disabled={actionLoading || !actionNote.trim()}
                    className="flex-1 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2">
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Request Resubmission'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && selected?.documentUrl && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 cursor-pointer" onClick={() => setLightbox(false)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white z-10" onClick={() => setLightbox(false)}>
            <X className="w-8 h-8" />
          </button>
          <img src={selected.documentUrl} alt="Document full view" className="max-w-full max-h-[90vh] object-contain rounded-lg" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
