import { useState } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { toast } from 'sonner';
import { Bell, Send, Loader2 } from 'lucide-react';

export default function AdminNotifications() {
  const { broadcastNotification } = useAdmin();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [target, setTarget] = useState<'all' | 'seekers' | 'owners'>('all');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) { toast.error('Title and body are required'); return; }
    setSending(true);
    try {
      const count = await broadcastNotification(title.trim(), body.trim(), target);
      toast.success(`Notification sent to ${count} users`);
      setTitle(''); setBody('');
    } catch { toast.error('Failed to send'); }
    finally { setSending(false); }
  };

  return (
    <div className="max-w-lg space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-6">
          <Bell className="w-5 h-5 text-fire" />
          <h2 className="text-lg font-semibold">Broadcast Notification</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Notification title..."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-fire" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">Body</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Message body..."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-fire h-28 resize-none" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase mb-1.5 block">Target Audience</label>
            <div className="flex gap-2">
              {(['all', 'seekers', 'owners'] as const).map(t => (
                <button key={t} onClick={() => setTarget(t)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${target === t ? 'bg-fire text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                  {t === 'all' ? 'All Users' : t === 'seekers' ? 'Seekers' : 'Owners'}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleSend} disabled={sending || !title.trim() || !body.trim()}
            className="w-full py-3 bg-fire text-white rounded-xl font-bold text-sm hover:bg-fire-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Notification
          </button>
        </div>
      </div>
    </div>
  );
}
