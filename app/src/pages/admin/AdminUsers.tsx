import { useState, useEffect, useMemo } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import type { UserProfile } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Search, Filter, Loader2, ChevronDown, X, Shield, Ban, RefreshCw } from 'lucide-react';

export default function AdminUsers() {
  const { getAllUsers, suspendUser, banUser, reinstateUser } = useAdmin();
  const [users, setUsers] = useState<(UserProfile & { status?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<(UserProfile & { status?: string }) | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    getAllUsers().then(u => { setUsers(u as (UserProfile & { status?: string })[]); setLoading(false); });
  }, [getAllUsers]);

  const filtered = useMemo(() => {
    let result = users;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(u => u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s) || u.phone?.includes(s));
    }
    if (roleFilter !== 'all') result = result.filter(u => u.role === roleFilter);
    return result;
  }, [users, search, roleFilter]);

  const handleAction = async (uid: string, action: 'suspend' | 'ban' | 'reinstate') => {
    setActionLoading(true);
    try {
      if (action === 'suspend') await suspendUser(uid);
      else if (action === 'ban') await banUser(uid);
      else await reinstateUser(uid);
      toast.success(`User ${action}ed successfully`);
      setUsers(prev => prev.map(u => u.uid === uid ? { ...u, status: action === 'reinstate' ? 'active' : action === 'suspend' ? 'suspended' : 'banned' } : u));
      setSelectedUser(null);
    } catch { toast.error('Action failed'); }
    finally { setActionLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-fire animate-spin" /></div>;

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, phone..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-fire" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-fire">
          <option value="all">All Roles</option>
          <option value="seeker">Seekers</option>
          <option value="owner">Owners</option>
        </select>
      </div>

      <p className="text-xs text-gray-500">{filtered.length} users found</p>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">City</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.slice(0, 50).map(u => (
                <tr key={u.uid} className="hover:bg-gray-50/50 transition-colors cursor-pointer" onClick={() => setSelectedUser(u)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0 overflow-hidden">
                        {u.avatar ? <img src={u.avatar} className="w-full h-full object-cover" alt="" /> : u.name?.charAt(0) || '?'}
                      </div>
                      <div><p className="font-medium text-gray-900 truncate max-w-[120px]">{u.name || 'No name'}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell truncate max-w-[160px]">{u.email}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{u.city || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${u.role === 'seeker' ? 'bg-blue-50 text-blue-600' : u.role === 'owner' ? 'bg-teal-50 text-teal-600' : 'bg-gray-100 text-gray-500'}`}>
                      {u.role || 'none'}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${u.status === 'banned' ? 'bg-red-50 text-red-600' : u.status === 'suspended' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                      {u.status || 'active'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={e => { e.stopPropagation(); setSelectedUser(u); }} className="text-xs text-fire font-medium hover:underline">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Detail Panel */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedUser(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative w-full max-w-md bg-white shadow-2xl h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="font-semibold">User Detail</h3>
              <button onClick={() => setSelectedUser(null)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-400 overflow-hidden">
                  {selectedUser.avatar ? <img src={selectedUser.avatar} className="w-full h-full object-cover" alt="" /> : selectedUser.name?.charAt(0)}
                </div>
                <div>
                  <p className="text-lg font-bold">{selectedUser.name}</p>
                  <p className="text-xs text-gray-500">{selectedUser.email}</p>
                  <p className="text-xs text-gray-400">{selectedUser.phone}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Role', selectedUser.role || 'none'],
                  ['City', selectedUser.city || '—'],
                  ['Age', selectedUser.age?.toString() || '—'],
                  ['Gender', selectedUser.gender || '—'],
                  ['Profession', selectedUser.profession || '—'],
                  ['Company', selectedUser.company || '—'],
                  ['Verification', `Level ${selectedUser.verificationLevel || 0}`],
                  ['Premium', selectedUser.isPremium ? 'Yes' : 'No'],
                  ['Connects', `${selectedUser.connectsUsed || 0} / ${selectedUser.connectsLimit || 5}`],
                  ['Status', selectedUser.status || 'active'],
                ].map(([label, val]) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">{label}</p>
                    <p className="text-sm font-medium text-gray-800 mt-0.5">{val}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-4 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase">Admin Actions</p>
                {(selectedUser.status !== 'suspended' && selectedUser.status !== 'banned') && (
                  <button onClick={() => handleAction(selectedUser.uid, 'suspend')} disabled={actionLoading}
                    className="w-full py-2.5 bg-amber-50 text-amber-700 rounded-xl text-sm font-bold hover:bg-amber-100 transition-all flex items-center justify-center gap-2">
                    <Shield className="w-4 h-4" /> Suspend User
                  </button>
                )}
                {selectedUser.status !== 'banned' && (
                  <button onClick={() => handleAction(selectedUser.uid, 'ban')} disabled={actionLoading}
                    className="w-full py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2">
                    <Ban className="w-4 h-4" /> Ban User
                  </button>
                )}
                {(selectedUser.status === 'suspended' || selectedUser.status === 'banned') && (
                  <button onClick={() => handleAction(selectedUser.uid, 'reinstate')} disabled={actionLoading}
                    className="w-full py-2.5 bg-green-50 text-green-600 rounded-xl text-sm font-bold hover:bg-green-100 transition-all flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4" /> Reinstate User
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
