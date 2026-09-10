import { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { toast } from 'sonner';
import {
  Bell, Send, Loader2, Users, CheckCircle2,
  Clock, RefreshCw, AlertCircle, Smartphone, ShieldCheck
} from 'lucide-react';
import type { Timestamp } from 'firebase/firestore';

interface BroadcastRecord {
  id: string;
  title: string;
  body: string;
  target: 'all' | 'seekers' | 'owners';
  recipientCount: number;
  sentBy?: string;
  createdAt: Timestamp | string | Date;
}

function formatDate(ts: Timestamp | string | Date | null | undefined): string {
  if (!ts) return '—';
  if ((ts as Timestamp).toDate) {
    return (ts as Timestamp).toDate().toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  if (typeof ts === 'string' || ts instanceof Date) {
    const d = new Date(ts);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  }
  return '—';
}

export default function AdminNotifications() {
  const { broadcastNotification, getBroadcastHistory } = useAdmin();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState<'all' | 'seekers' | 'owners'>('all');
  const [sending, setSending] = useState(false);

  // Confirmation modal
  const [showConfirm, setShowConfirm] = useState(false);

  // Broadcast History
  const [history, setHistory] = useState<BroadcastRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const records = await getBroadcastHistory();
      setHistory(records as BroadcastRecord[]);
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  }, [getBroadcastHistory]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleSendBroadcast = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Title and message body are required');
      return;
    }

    setSending(true);
    setShowConfirm(false);

    try {
      const count = await broadcastNotification(title.trim(), body.trim(), target);
      toast.success(`Broadcast successfully sent to ${count} users!`);
      setTitle('');
      setBody('');
      // Reload broadcast history
      loadHistory();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  const getTargetBadge = (t: string) => {
    switch (t) {
      case 'seekers':
        return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Seekers Only</span>;
      case 'owners':
        return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">Owners Only</span>;
      default:
        return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">All Users</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Broadcasts</h1>
          <p className="text-sm text-gray-500">
            Send high-priority in-app announcements, safety alerts, or product updates directly to user notification inboxes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Broadcast Composer (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-fire/10 flex items-center justify-center text-fire">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Compose Broadcast</h2>
                <p className="text-xs text-gray-400">Broadcasts appear in user notification centers instantly.</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Target Audience */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">
                  Target Audience
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'all', label: 'All Users', desc: 'Everyone with an account' },
                    { id: 'seekers', label: 'Seekers', desc: 'Room & Flatmate seekers' },
                    { id: 'owners', label: 'Owners', desc: 'Verified property owners' },
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTarget(t.id as 'all' | 'seekers' | 'owners')}
                      className={`p-3 rounded-xl text-left border transition-all ${
                        target === t.id
                          ? 'border-fire bg-fire/5 ring-1 ring-fire'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <p className={`text-xs font-bold ${target === t.id ? 'text-fire' : 'text-gray-800'}`}>
                        {t.label}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Notification Title *
                  </label>
                  <span className="text-[10px] text-gray-400">{title.length} / 80</span>
                </div>
                <input
                  type="text"
                  maxLength={80}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. 📢 Diwali Safety Guidelines for Flatmates"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-fire/20 focus:border-fire transition-all"
                />
              </div>

              {/* Body */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Message Body *
                  </label>
                  <span className="text-[10px] text-gray-400">{body.length} / 300</span>
                </div>
                <textarea
                  maxLength={300}
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Write clear, actionable details for users..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-fire/20 focus:border-fire h-28 resize-none transition-all"
                />
              </div>

              {/* Review & Send button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirm(true)}
                  disabled={sending || !title.trim() || !body.trim()}
                  className="w-full py-3 bg-fire hover:bg-fire-dark text-white rounded-xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending Broadcast in Batches...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Review & Send Broadcast
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Mobile Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3 text-gray-800">
              <Smartphone className="w-4 h-4 text-slate-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-600">Live Device Preview</h3>
            </div>
            <p className="text-xs text-gray-400 mb-4">
              Real-time preview of how users experience this push notice in their notification feed.
            </p>

            {/* Mobile notification mockup */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-semibold text-slate-300">NestMate App</span>
                </div>
                <span>Just now</span>
              </div>

              <div className="flex items-start gap-3 pt-1">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fire to-amber-500 flex items-center justify-center shrink-0 shadow-md">
                  <Bell className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate">
                    {title.trim() || 'Notification Title'}
                  </p>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-3 leading-relaxed">
                    {body.trim() || 'Your message body will be displayed here as it is composed.'}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                <span>Audience: {target.toUpperCase()}</span>
                <span className="text-fire font-medium">Tap to view</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Broadcasts are permanently logged in the audit history and sent via Firestore atomic batching.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast History Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <h3 className="font-bold text-gray-900 text-sm">Broadcast History</h3>
            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full font-semibold">
              {history.length}
            </span>
          </div>
          <button
            onClick={loadHistory}
            disabled={loadingHistory}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh History"
          >
            <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin text-fire' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50/70 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase">
              <tr>
                <th className="text-left px-5 py-3">Sent At</th>
                <th className="text-left px-5 py-3">Audience</th>
                <th className="text-left px-5 py-3">Title & Message</th>
                <th className="text-center px-5 py-3">Recipients Reached</th>
                <th className="text-right px-5 py-3">Sent By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loadingHistory ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-fire mb-2" />
                    Loading broadcast history...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400 text-sm">
                    No broadcasts recorded yet. Sent messages will be logged here.
                  </td>
                </tr>
              ) : (
                history.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 text-xs text-gray-600 whitespace-nowrap">
                      {formatDate(b.createdAt)}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {getTargetBadge(b.target)}
                    </td>
                    <td className="px-5 py-3 max-w-sm">
                      <p className="font-semibold text-gray-900 text-xs truncate">{b.title}</p>
                      <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{b.body}</p>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded-full">
                        <Users className="w-3 h-3 text-gray-500" />
                        {b.recipientCount ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-gray-400 truncate max-w-[120px]">
                      {b.sentBy || 'Admin'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-fire">
              <div className="w-10 h-10 rounded-xl bg-fire/10 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-fire" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Confirm Broadcast</h3>
                <p className="text-xs text-gray-500">Please review before sending.</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-100 text-xs text-gray-700">
              <p><strong>Audience:</strong> {target === 'all' ? 'All Users' : target === 'seekers' ? 'Seekers Only' : 'Owners Only'}</p>
              <p><strong>Title:</strong> {title}</p>
              <p className="line-clamp-2"><strong>Message:</strong> {body}</p>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              This message will be dispatched immediately to users' inboxes and cannot be recalled once sent.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendBroadcast}
                disabled={sending}
                className="flex-1 py-2.5 bg-fire hover:bg-fire-dark text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm & Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
