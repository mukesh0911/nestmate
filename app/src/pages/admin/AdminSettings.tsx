import { useState, useEffect } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Settings, Loader2, Trash2, Plus, Users, Shield } from 'lucide-react';

interface AdminRow { id: string; email?: string; name?: string; role?: string; [key: string]: unknown; }

export default function AdminSettings() {
  const { getAdmins, addAdmin, removeAdmin, getAdminConfig, updateAdminEmails } = useAdmin();
  const { user } = useAuth();

  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  const [emailList, setEmailList] = useState('');
  const [savingEmails, setSavingEmails] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [adminList, config] = await Promise.all([getAdmins(), getAdminConfig()]);
        setAdmins(adminList as AdminRow[]);
        setEmailList((config.adminEmails || []).join('\n'));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [getAdmins, getAdminConfig]);

  const handleAddAdmin = async () => {
    if (!newEmail.trim()) { toast.error('Email is required'); return; }
    setAdding(true);
    try {
      await addAdmin(newEmail.trim().toLowerCase(), newName.trim() || newEmail.trim());
      const updated = await getAdmins();
      setAdmins(updated as AdminRow[]);
      setNewEmail(''); setNewName('');
      toast.success('Admin added');
    } catch { toast.error('Failed to add admin'); }
    finally { setAdding(false); }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this admin?')) return;
    try {
      await removeAdmin(id);
      setAdmins(prev => prev.filter(a => a.id !== id));
      toast.success('Admin removed');
    } catch { toast.error('Failed to remove'); }
  };

  const handleSaveEmails = async () => {
    setSavingEmails(true);
    try {
      const emails = emailList.split('\n').map(e => e.trim().toLowerCase()).filter(Boolean);
      await updateAdminEmails(emails);
      toast.success(`Saved ${emails.length} admin emails`);
    } catch { toast.error('Failed to save'); }
    finally { setSavingEmails(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-fire animate-spin" /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Admin List */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-5">
          <Users className="w-5 h-5 text-fire" />
          <h2 className="text-lg font-semibold">Admin Accounts</h2>
        </div>

        {admins.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">No additional admins configured</p>
        ) : (
          <div className="space-y-2 mb-4">
            {admins.map(a => (
              <div key={a.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{a.name || a.email}</p>
                  <p className="text-xs text-gray-400">{a.email} · <span className="capitalize">{a.role || 'moderator'}</span></p>
                </div>
                <button onClick={() => handleRemove(a.id)} disabled={a.id === user?.uid}
                  className="p-2 text-red-400 hover:text-red-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors" title={a.id === user?.uid ? "Can't remove yourself" : 'Remove admin'}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add admin form */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-bold text-gray-400 uppercase mb-3">Add New Admin</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="Email address"
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-fire" />
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Name (optional)"
              className="sm:w-40 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-fire" />
            <button onClick={handleAddAdmin} disabled={adding || !newEmail.trim()}
              className="px-5 py-2.5 bg-fire text-white rounded-xl text-sm font-bold hover:bg-fire-dark transition-all disabled:opacity-50 flex items-center gap-2 justify-center">
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
            </button>
          </div>
        </div>
      </div>

      {/* Email Whitelist */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-5">
          <Shield className="w-5 h-5 text-teal-500" />
          <h2 className="text-lg font-semibold">Email Whitelist</h2>
        </div>
        <p className="text-xs text-gray-400 mb-3">One email per line. These emails will be recognized as admins when they log in.</p>
        <textarea value={emailList} onChange={e => setEmailList(e.target.value)} rows={6} placeholder="admin@nestmate.com&#10;team@nestmate.com"
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-fire font-mono resize-none" />
        <button onClick={handleSaveEmails} disabled={savingEmails}
          className="mt-3 px-6 py-2.5 bg-fire text-white rounded-xl text-sm font-bold hover:bg-fire-dark transition-all disabled:opacity-50 flex items-center gap-2">
          {savingEmails ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Whitelist'}
        </button>
      </div>
    </div>
  );
}
