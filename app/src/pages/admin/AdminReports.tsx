import { useState, useEffect, useMemo } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import type { UserProfile } from '@/hooks/useAuth';
import { getDoc, doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { Search, Loader2, X, CheckCircle, Shield, Ban, AlertTriangle, Flag } from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';

interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  details: string;
  status: 'open' | 'under_review' | 'resolved';
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

const REASON_LABELS: Record<string, string> = {
  fake_profile: 'Fake Profile',
  harassment: 'Harassment',
  spam: 'Spam',
  inappropriate_content: 'Inappropriate Content',
  misleading_listing: 'Misleading Listing',
  other: 'Other',
};

function formatDate(ts: Timestamp | string | Date | undefined): string {
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

function StatusBadge({ status }: { status: string }) {
  const cls = status === 'open' ? 'bg-red-500 text-white' : status === 'under_review' ? 'bg-amber-100 text-amber-800' : 'bg-green-500 text-white';
  const label = status === 'under_review' ? 'Under Review' : status.charAt(0).toUpperCase() + status.slice(1);
  return <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${cls}`}>{label}</span>;
}

export default function AdminReports() {
  const { getAllReports, updateReportStatus, suspendUser, banUser } = useAdmin();

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Profile cache for reporter/reported names
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});

  // Detail panel
  const [selected, setSelected] = useState<Report | null>(null);

  // Confirm modal
  const [confirmAction, setConfirmAction] = useState<{ type: 'suspend' | 'ban'; userId: string; userName: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Load reports
  useEffect(() => {
    getAllReports()
      .then(r => { setReports(r as Report[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, [getAllReports]);

  // Fetch profiles for all unique user IDs
  useEffect(() => {
    if (reports.length === 0) return;
    const ids = new Set<string>();
    reports.forEach(r => { ids.add(r.reporterId); ids.add(r.reportedUserId); });

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
  }, [reports]);

  // Filtered + searched
  const filtered = useMemo(() => {
    let result = reports;
    if (reasonFilter !== 'all') result = result.filter(r => r.reason === reasonFilter);
    if (statusFilter !== 'all') result = result.filter(r => r.status === statusFilter);
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(r => {
        const reporter = profiles[r.reporterId];
        const reported = profiles[r.reportedUserId];
        return reporter?.name?.toLowerCase().includes(s) || reported?.name?.toLowerCase().includes(s) ||
          reporter?.email?.toLowerCase().includes(s) || reported?.email?.toLowerCase().includes(s);
      });
    }
    return result;
  }, [reports, reasonFilter, statusFilter, search, profiles]);

  // Actions
  const handleMarkReviewed = async (id: string) => {
    try { await updateReportStatus(id, 'under_review'); setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'under_review' as const } : r)); toast.success('Marked as under review'); }
    catch { toast.error('Failed'); }
  };

  const handleDismiss = async (id: string) => {
    try { await updateReportStatus(id, 'resolved'); setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'resolved' as const } : r)); setSelected(null); toast.success('Report dismissed'); }
    catch { toast.error('Failed'); }
  };

  const handleWarn = async (report: Report) => {
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: report.reportedUserId, type: 'system',
        title: 'Community Warning',
        description: `You have received a warning for ${REASON_LABELS[report.reason] || report.reason}. Please review our community guidelines.`,
        read: false, createdAt: serverTimestamp(),
      });
      toast.success('Warning sent to user');
    } catch { toast.error('Failed to send warning'); }
  };

  const handleConfirmAction = async () => {
    if (!confirmAction) return;
    setActionLoading(true);
    try {
      if (confirmAction.type === 'suspend') await suspendUser(confirmAction.userId);
      else await banUser(confirmAction.userId);

      await addDoc(collection(db, 'notifications'), {
        userId: confirmAction.userId, type: 'system',
        title: confirmAction.type === 'suspend' ? 'Account Suspended' : 'Account Banned',
        description: confirmAction.type === 'suspend'
          ? 'Your account has been suspended due to reports. Contact support for assistance.'
          : 'Your account has been permanently banned due to policy violations.',
        read: false, createdAt: serverTimestamp(),
      });

      toast.success(`User ${confirmAction.type === 'suspend' ? 'suspended' : 'banned'}`);
      setConfirmAction(null);
      setSelected(null);
    } catch { toast.error('Action failed'); }
    finally { setActionLoading(false); }
  };

  const getName = (uid: string) => profiles[uid]?.name || uid.slice(0, 8) + '...';
  const getAvatar = (uid: string) => profiles[uid]?.avatar || '';
  const getEmail = (uid: string) => profiles[uid]?.email || '';

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-fire animate-spin" /></div>;

  // Empty state
  if (reports.length === 0) {
    return (
      <div className="space-y-4">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">User Reports & Moderation</h1>
          <p className="text-sm text-gray-500">Review user-submitted reports, flags, and account infractions.</p>
        </div>
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
          <CheckCircle className="w-14 h-14 text-green-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">No reports filed</h2>
          <p className="text-sm text-gray-400">Users can report profiles, listings, or messages from the app</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">User Reports & Moderation</h1>
        <p className="text-sm text-gray-500">Review user-submitted reports, flags, and account infractions.</p>
      </div>
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search reporter or reported user..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-fire" />
        </div>
        <select value={reasonFilter} onChange={e => setReasonFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none">
          <option value="all">All Reasons</option>
          {Object.entries(REASON_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none">
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="under_review">Under Review</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <p className="text-xs text-gray-500">{filtered.length} reports found</p>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Reporter</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Reported User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Reason</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.slice(0, 50).map(report => (
                <tr key={report.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => setSelected(report)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0 overflow-hidden">
                        {getAvatar(report.reporterId) ? <img src={getAvatar(report.reporterId)} className="w-full h-full object-cover" alt="" /> : getName(report.reporterId).charAt(0)}
                      </div>
                      <span className="text-gray-700 truncate max-w-[100px]">{getName(report.reporterId)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500 shrink-0 overflow-hidden">
                        {getAvatar(report.reportedUserId) ? <img src={getAvatar(report.reportedUserId)} className="w-full h-full object-cover" alt="" /> : getName(report.reportedUserId).charAt(0)}
                      </div>
                      <span className="text-gray-700 truncate max-w-[100px]">{getName(report.reportedUserId)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{REASON_LABELS[report.reason] || report.reason}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell text-xs">{formatDate(report.createdAt)}</td>
                  <td className="px-4 py-3"><StatusBadge status={report.status} /></td>
                  <td className="px-4 py-3">
                    <button onClick={e => { e.stopPropagation(); setSelected(report); }} className="text-xs text-fire font-medium hover:underline">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Slide-out */}
      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative w-full max-w-md bg-white shadow-2xl h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="font-semibold flex items-center gap-2"><Flag className="w-4 h-4 text-red-400" /> Report Detail</h3>
              <button onClick={() => setSelected(null)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-6">
              {/* Reporter */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Reporter</p>
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-500 overflow-hidden shrink-0">
                    {getAvatar(selected.reporterId) ? <img src={getAvatar(selected.reporterId)} className="w-full h-full object-cover" alt="" /> : getName(selected.reporterId).charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{getName(selected.reporterId)}</p>
                    <p className="text-xs text-gray-400">{getEmail(selected.reporterId)}</p>
                  </div>
                </div>
              </div>

              {/* Reported User */}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Reported User</p>
                <div className="flex items-center gap-3 bg-red-50 rounded-xl p-3 border border-red-100">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-500 overflow-hidden shrink-0">
                    {getAvatar(selected.reportedUserId) ? <img src={getAvatar(selected.reportedUserId)} className="w-full h-full object-cover" alt="" /> : getName(selected.reportedUserId).charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{getName(selected.reportedUserId)}</p>
                    <p className="text-xs text-gray-400">{getEmail(selected.reportedUserId)}</p>
                  </div>
                </div>
              </div>

              {/* Reason & Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Reason</p>
                  <p className="text-sm font-semibold text-gray-800 mt-1">{REASON_LABELS[selected.reason] || selected.reason}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-[10px] text-gray-400 uppercase font-bold">Status</p>
                  <div className="mt-1"><StatusBadge status={selected.status} /></div>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Details</p>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-600 leading-relaxed">{selected.details || 'No additional details provided.'}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 uppercase font-bold">Filed On</p>
                <p className="text-sm font-medium text-gray-800 mt-1">{formatDate(selected.createdAt)}</p>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-4 border-t border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Actions</p>

                {selected.status === 'open' && (
                  <button onClick={() => handleMarkReviewed(selected.id)}
                    className="w-full py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2">
                    <Shield className="w-4 h-4" /> Mark as Reviewed
                  </button>
                )}

                <button onClick={() => handleWarn(selected)}
                  className="w-full py-2.5 bg-amber-50 text-amber-700 rounded-xl text-sm font-bold hover:bg-amber-100 transition-all flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Warn User
                </button>

                <button onClick={() => setConfirmAction({ type: 'suspend', userId: selected.reportedUserId, userName: getName(selected.reportedUserId) })}
                  className="w-full py-2.5 bg-fire/10 text-fire rounded-xl text-sm font-bold hover:bg-fire/20 transition-all flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4" /> Suspend User
                </button>

                <button onClick={() => setConfirmAction({ type: 'ban', userId: selected.reportedUserId, userName: getName(selected.reportedUserId) })}
                  className="w-full py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2">
                  <Ban className="w-4 h-4" /> Ban User
                </button>

                {selected.status !== 'resolved' && (
                  <button onClick={() => handleDismiss(selected.id)}
                    className="w-full py-2.5 text-gray-400 rounded-xl text-sm font-medium hover:text-gray-600 hover:bg-gray-50 transition-all">
                    Dismiss Report
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmAction(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold mb-2">Confirm Action</h3>
            <p className="text-sm text-gray-600 mb-6">
              {confirmAction.type === 'suspend'
                ? `Suspend ${confirmAction.userName}? They will not be able to log in.`
                : `Permanently ban ${confirmAction.userName}? This cannot be undone.`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmAction(null)} className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">Cancel</button>
              <button onClick={handleConfirmAction} disabled={actionLoading}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 ${confirmAction.type === 'ban' ? 'bg-red-500 hover:bg-red-600' : 'bg-fire hover:bg-fire-dark'}`}>
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
