import { useState, useEffect, useMemo } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import type { UserProfile } from '@/hooks/useAuth';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import {
  Search, Loader2, X, CheckCircle, ShieldCheck, XCircle,
  RefreshCcw, Eye, AlertTriangle, RotateCw, ExternalLink,
  ChevronLeft, ChevronRight, Clock, FileText
} from 'lucide-react';
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
  aadhaar: 'Aadhaar Card',
  passport: 'Passport',
  driving_license: 'Driving License',
  voter_id: 'Voter ID',
  work_id: 'Work ID',
  student_id: 'Student ID',
  electricity_bill: 'Electricity Bill',
  property_tax: 'Property Tax',
};

function formatDate(ts: Timestamp | string | Date | null | undefined): string {
  if (!ts) return '—';
  if ((ts as Timestamp).toDate) {
    return (ts as Timestamp).toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  if (typeof ts === 'string' || ts instanceof Date) {
    const d = new Date(ts);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  }
  return '—';
}

function StatusBadge({ status, ownerVerifStatus }: { status: string; ownerVerifStatus?: string }) {
  const display = ownerVerifStatus || status;
  const cls =
    display === 'APPROVED' || display === 'approved' ? 'bg-green-500 text-white' :
    display === 'REJECTED' || display === 'rejected' ? 'bg-red-500 text-white' :
    display === 'UNDER_REVIEW' ? 'bg-blue-500 text-white' :
    display === 'RESUBMISSION_REQUIRED' ? 'bg-amber-500 text-white' :
    display === 'SUBMITTED' ? 'bg-amber-100 text-amber-800' :
    'bg-gray-100 text-gray-800';
  const label =
    display === 'SUBMITTED' ? 'Submitted' :
    display === 'UNDER_REVIEW' ? 'Under Review' :
    display === 'APPROVED' ? 'Approved' :
    display === 'REJECTED' ? 'Rejected' :
    display === 'RESUBMISSION_REQUIRED' ? 'Resubmit Req.' :
    display;
  return <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

const ITEMS_PER_PAGE = 20;

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminVerifications() {
  const { getAllVerifications, approveVerification, rejectVerification, requestResubmission, beginReview } = useAdmin();

  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [currentPage, setCurrentPage] = useState(1);

  // Detail modal & rotation
  const [selected, setSelected] = useState<Verification | null>(null);
  const [rotation, setRotation] = useState(0);

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

  // Fetch user profiles in parallel
  useEffect(() => {
    if (verifications.length === 0) return;
    const ids = Array.from(new Set(verifications.map(v => v.userId))).filter(uid => uid && !profiles[uid]);
    if (ids.length === 0) return;

    let isMounted = true;
    Promise.all(
      ids.map(async uid => {
        try {
          const snap = await getDoc(doc(db, 'users', uid));
          return snap.exists() ? { uid, data: snap.data() as UserProfile } : null;
        } catch {
          return null;
        }
      })
    ).then(results => {
      if (!isMounted) return;
      const loaded: Record<string, UserProfile> = {};
      for (const res of results) {
        if (res) loaded[res.uid] = res.data;
      }
      if (Object.keys(loaded).length > 0) {
        setProfiles(prev => ({ ...prev, ...loaded }));
      }
    });

    return () => { isMounted = false; };
  }, [verifications, profiles]);

  // Helper getters
  const getName = (uid: string, declaredName?: string) => profiles[uid]?.name || declaredName || (uid ? uid.slice(0, 8) + '...' : 'Unknown');
  const getEmail = (uid: string) => profiles[uid]?.email || '';

  const filtered = useMemo(() => {
    let result = verifications;
    const q = search.toLowerCase().trim();
    if (q) {
      result = result.filter(v => {
        const uName = (profiles[v.userId]?.name || '').toLowerCase();
        const uEmail = (profiles[v.userId]?.email || '').toLowerCase();
        const dName = (v._declaredName || '').toLowerCase();
        const docId = (v.id || '').toLowerCase();
        return uName.includes(q) || uEmail.includes(q) || dName.includes(q) || docId.includes(q);
      });
    }
    if (typeFilter !== 'all') result = result.filter(v => v.type === typeFilter);
    if (statusFilter !== 'all') result = result.filter(v => v.status === statusFilter);
    if (sourceFilter !== 'all') result = result.filter(v => v._source === sourceFilter);
    return result;
  }, [verifications, search, typeFilter, statusFilter, sourceFilter, profiles]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, statusFilter, sourceFilter]);

  useEffect(() => {
    document.title = 'Verifications Queue | NestMate Admin';
  }, []);

  // Reset rotation when opening modal
  useEffect(() => {
    setRotation(0);
  }, [selected]);

  // Escape key & body scroll lock for selected modal and lightbox
  useEffect(() => {
    if (!selected && !lightbox) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightbox) {
          setLightbox(false);
        } else if (selected) {
          setSelected(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [selected, lightbox]);

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
      toast.success('Verification approved. Listing(s) are now live.');
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

  const isPdf = (url?: string) => url ? url.toLowerCase().includes('.pdf') : false;

  // Check if declared name conflicts with profile name
  const nameMismatch = useMemo(() => {
    if (!selected?._declaredName || !selected?.userId) return false;
    const profileName = (profiles[selected.userId]?.name || '').trim().toLowerCase();
    const declared = selected._declaredName.trim().toLowerCase();
    if (!profileName) return false;
    return profileName !== declared && !profileName.includes(declared) && !declared.includes(profileName);
  }, [selected, profiles]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Loader2 className="w-8 h-8 text-fire animate-spin" />
      <p className="text-sm text-gray-500">Loading verifications queue...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Verifications Queue</h1>
          <p className="text-sm text-gray-500">
            Review identity proofs, Aadhaar, and owner property documents to maintain trust and safety.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            {verifications.filter(v => v.status === 'pending').length} Pending Action
          </span>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search name, email, declared name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fire/20 focus:border-fire transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-fire/20 focus:border-fire"
          >
            <option value="all">All Document Types</option>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-fire/20 focus:border-fire"
          >
            <option value="all">All Review Statuses</option>
            <option value="pending">Pending / Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={e => setSourceFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-fire/20 focus:border-fire"
          >
            <option value="all">All Verification Sources</option>
            <option value="ownerVerification">🔒 Owner Identity Gate</option>
            <option value="legacy">Legacy Submissions</option>
          </select>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
          <span>Showing {paginated.length} of {filtered.length} matching requests</span>
          {(search || typeFilter !== 'all' || statusFilter !== 'all' || sourceFilter !== 'all') && (
            <button
              onClick={() => { setSearch(''); setTypeFilter('all'); setStatusFilter('all'); setSourceFilter('all'); }}
              className="text-fire font-medium hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">User / Owner</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Document Type</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Submitted</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Gate Source</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-sm text-gray-400">
                    <CheckCircle className="w-10 h-10 text-emerald-300 mx-auto mb-2" />
                    No verifications match your criteria.
                  </td>
                </tr>
              ) : (
                paginated.map(v => {
                  const profile = profiles[v.userId];
                  const hasMismatch = v._declaredName && profile?.name &&
                    profile.name.trim().toLowerCase() !== v._declaredName.trim().toLowerCase();

                  return (
                    <tr
                      key={v.id}
                      className="hover:bg-gray-50/70 transition-colors cursor-pointer"
                      onClick={() => setSelected(v)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 shrink-0 text-sm">
                            {getName(v.userId, v._declaredName).charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate max-w-[160px]">
                              {getName(v.userId, v._declaredName)}
                            </p>
                            <p className="text-xs text-gray-400 truncate max-w-[160px]">{getEmail(v.userId)}</p>
                            {hasMismatch && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-medium mt-0.5">
                                <AlertTriangle className="w-3 h-3 text-amber-600" /> Name Mismatch
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          {TYPE_LABELS[v.type] || v.type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs hidden sm:table-cell">
                        {formatDate(v.submittedAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={v.status} ownerVerifStatus={v._ownerVerifStatus} />
                      </td>
                      <td className="px-5 py-3.5">
                        {v._source === 'ownerVerification' ? (
                          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 inline-flex items-center gap-1">
                            🔒 ID Gate
                          </span>
                        ) : (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                            Legacy
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={e => { e.stopPropagation(); setSelected(v); }}
                          className="px-3 py-1.5 text-xs font-medium text-fire bg-fire/5 hover:bg-fire/10 rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Review
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <span className="text-xs text-gray-500">
              Page {currentPage} of {totalPages} ({filtered.length} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-white disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-white disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Review Modal */}
      {selected && !lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
          onClick={() => { setSelected(null); setActionMode(null); setActionNote(''); }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="verification-review-title"
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 id="verification-review-title" className="font-bold text-gray-900 leading-none">Verification Review</h3>
                  <p className="text-xs text-gray-500 mt-1">Doc ID: {selected.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setSelected(null); setActionMode(null); }}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Scrollable */}
            <div className="p-6 overflow-y-auto space-y-4">
              {/* User overview */}
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                <div className="w-11 h-11 rounded-full bg-slate-200 flex items-center justify-center text-base font-bold text-slate-700 shrink-0">
                  {getName(selected.userId, selected._declaredName).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {getName(selected.userId, selected._declaredName)}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{getEmail(selected.userId)}</p>
                  {selected._declaredName && (
                    <p className="text-xs text-blue-600 font-medium mt-0.5">
                      Declared On Doc: <span className="underline">{selected._declaredName}</span>
                    </p>
                  )}
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 shrink-0">
                  {TYPE_LABELS[selected.type] || selected.type}
                </span>
              </div>

              {/* Name Mismatch Warning Banner */}
              {nameMismatch && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 flex items-start gap-2.5 text-amber-900">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold">⚠️ Warning: Name Mismatch Detected</p>
                    <p>
                      The profile name is <strong>"{profiles[selected.userId]?.name}"</strong>, but the user declared <strong>"{selected._declaredName}"</strong>. Ensure the legal document corresponds to the actual account holder before approving.
                    </p>
                  </div>
                </div>
              )}

              {/* Resubmission count note */}
              {(selected._resubmissionCount ?? 0) > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex items-center gap-2">
                  <RefreshCcw className="w-4 h-4 text-orange-600" />
                  <p className="text-xs font-medium text-orange-800">
                    This document is resubmission #{selected._resubmissionCount}.
                  </p>
                </div>
              )}

              {/* Document Preview Box */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Proof of Identity</span>
                  <div className="flex items-center gap-2">
                    {!isPdf(selected.documentUrl) && (
                      <button
                        type="button"
                        onClick={() => setRotation(r => (r + 90) % 360)}
                        className="text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                        title="Rotate 90 degrees"
                      >
                        <RotateCw className="w-3.5 h-3.5" /> Rotate
                      </button>
                    )}
                    {selected.documentUrl && (
                      <a
                        href={selected.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-fire hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Open Original
                      </a>
                    )}
                  </div>
                </div>

                {selected.documentUrl ? (
                  isPdf(selected.documentUrl) ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center space-y-3">
                      <FileText className="w-12 h-12 text-blue-500 mx-auto" />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">PDF Document Uploaded</p>
                        <p className="text-xs text-slate-500">PDFs cannot be displayed as regular images.</p>
                      </div>
                      <div className="flex justify-center gap-3">
                        <a
                          href={selected.documentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> View PDF in New Tab
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="bg-slate-900/5 rounded-xl border border-gray-200 p-2 overflow-hidden flex items-center justify-center cursor-pointer group"
                      onClick={() => setLightbox(true)}
                    >
                      <img
                        src={selected.documentUrl}
                        alt="Proof Document"
                        style={{ transform: `rotate(${rotation}deg)` }}
                        className="max-h-72 object-contain rounded-lg transition-transform duration-200 group-hover:scale-[1.02]"
                        onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                      />
                    </div>
                  )
                ) : (
                  <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-200">
                    <p className="text-sm text-gray-400">No document file attached</p>
                  </div>
                )}
              </div>

              {/* Status & Timing grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Submission Date</p>
                  <p className="text-xs font-semibold text-gray-800 mt-1">{formatDate(selected.submittedAt)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Current Status</p>
                  <div className="mt-1">
                    <StatusBadge status={selected.status} ownerVerifStatus={selected._ownerVerifStatus} />
                  </div>
                </div>
              </div>

              {/* Review note (if already reviewed) */}
              {selected.reviewNote && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                  <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Previous Review Note</p>
                  <p className="text-xs text-slate-700 leading-relaxed">{selected.reviewNote}</p>
                  {selected.reviewedAt && (
                    <p className="text-[10px] text-slate-400 mt-2">Reviewed on {formatDate(selected.reviewedAt)}</p>
                  )}
                </div>
              )}

              {/* Audit trail display */}
              {selected._auditTrail && selected._auditTrail.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Audit History</p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {selected._auditTrail.map((entry, idx) => (
                      <div key={idx} className="text-xs bg-gray-50 p-2.5 rounded-lg border border-gray-100 flex items-start justify-between gap-2">
                        <div>
                          <span className="font-semibold text-gray-800 uppercase text-[11px]">{entry.status}</span>
                          {entry.note && <p className="text-gray-600 text-[11px] mt-0.5">{entry.note}</p>}
                        </div>
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {entry.actorId ? entry.actorId.slice(0, 8) : 'System'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Security notice for ownerVerification */}
              {selected._source === 'ownerVerification' && selected.status === 'pending' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                    <span>
                      <strong>Identity Gate Impact:</strong> Approving will grant <code>ownerVerified=true</code> and activate all pending listings created by this owner.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 shrink-0">
              {selected.status === 'pending' && !actionMode && (
                <div className="space-y-2">
                  {selected._source === 'ownerVerification' && selected._ownerVerifStatus === 'SUBMITTED' && (
                    <button
                      type="button"
                      onClick={() => handleBeginReview(selected)}
                      disabled={actionLoading}
                      className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" /> Mark as Under Review
                    </button>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleApprove(selected)}
                      disabled={actionLoading}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Approve Document
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionMode('reject')}
                      className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>
                  {selected._source === 'ownerVerification' && (
                    <button
                      type="button"
                      onClick={() => setActionMode('resubmit')}
                      className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <RefreshCcw className="w-3.5 h-3.5" /> Request Resubmission
                    </button>
                  )}
                </div>
              )}

              {/* Rejection Form */}
              {actionMode === 'reject' && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-red-600">Rejection Reason *</p>
                  <textarea
                    value={actionNote}
                    onChange={e => setActionNote(e.target.value)}
                    placeholder="State reason clearly (e.g. Blurry photo, name mismatch, expired ID)..."
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-red-400 h-20 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setActionMode(null); setActionNote(''); }}
                      className="flex-1 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReject(selected)}
                      disabled={actionLoading || !actionNote.trim()}
                      className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Rejection'}
                    </button>
                  </div>
                </div>
              )}

              {/* Resubmission Form */}
              {actionMode === 'resubmit' && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-amber-700">Resubmission Instructions *</p>
                  <textarea
                    value={actionNote}
                    onChange={e => setActionNote(e.target.value)}
                    placeholder="e.g. Please re-upload with all 4 corners of the Aadhaar card clearly visible..."
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-amber-400 h-20 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setActionMode(null); setActionNote(''); }}
                      className="flex-1 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRequestResubmission(selected)}
                      disabled={actionLoading || !actionNote.trim()}
                      className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Request'}
                    </button>
                  </div>
                </div>
              )}

              {selected.status !== 'pending' && !actionMode && (
                <div className="text-center py-1">
                  <p className="text-xs text-gray-500">
                    This verification was already marked as <strong className="uppercase">{selected.status}</strong>.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Zoom modal */}
      {lightbox && selected?.documentUrl && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightbox(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Document full view"
        >
          <div className="absolute top-4 right-4 flex items-center gap-3 z-10" onClick={e => e.stopPropagation()}>
            {!isPdf(selected.documentUrl) && (
              <button
                type="button"
                onClick={() => setRotation(r => (r + 90) % 360)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RotateCw className="w-4 h-4" /> Rotate
              </button>
            )}
            <a
              href={selected.documentUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" /> Open Tab
            </a>
            <button
              type="button"
              className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer"
              onClick={() => setLightbox(false)}
              aria-label="Close lightbox"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="max-w-4xl max-h-[85vh] w-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            {isPdf(selected.documentUrl) ? (
              <iframe
                src={selected.documentUrl}
                title="PDF Document"
                className="w-full h-[80vh] rounded-xl bg-white border border-white/20"
              />
            ) : (
              <img
                src={selected.documentUrl}
                alt="Document full view"
                style={{ transform: `rotate(${rotation}deg)` }}
                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl transition-transform duration-200"
                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
