import { useState, useEffect, useMemo } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { toast } from 'sonner';
import { Search, Loader2, Trash2, Eye, X } from 'lucide-react';

interface ListingRow {
  id: string;
  ownerName: string;
  city: string;
  locality: string;
  flatType: string;
  totalRent: number;
  partnerShare: number;
  status: string;
  views: number;
  applicants: number;
  images: string[];
  title: string;
  description: string;
  amenities: string[];
  [key: string]: unknown;
}

export default function AdminListings() {
  const { getAllListings, deleteListing } = useAdmin();
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detail, setDetail] = useState<ListingRow | null>(null);

  useEffect(() => {
    getAllListings().then(l => { setListings(l as ListingRow[]); setLoading(false); });
  }, [getAllListings]);

  const filtered = useMemo(() => {
    let r = listings;
    if (search) {
      const s = search.toLowerCase();
      r = r.filter(l =>
        l.ownerName?.toLowerCase().includes(s) ||
        l.city?.toLowerCase().includes(s) ||
        l.locality?.toLowerCase().includes(s) ||
        l.title?.toLowerCase().includes(s)
      );
    }
    if (statusFilter !== 'all') r = r.filter(l => l.status === statusFilter);
    return r;
  }, [listings, search, statusFilter]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this listing permanently?')) return;
    try { await deleteListing(id); setListings(prev => prev.filter(l => l.id !== id)); setDetail(null); toast.success('Listing deleted'); }
    catch { toast.error('Delete failed'); }
  };

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-fire animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search owner, city, locality, title..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-fire" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pending_verification">Pending Verification</option>
          <option value="paused">Paused</option>
          <option value="filled">Filled</option>
        </select>
      </div>

      <p className="text-xs text-gray-500">{filtered.length} listings found</p>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Title</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Owner</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">City</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Rent</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Views</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.slice(0, 50).map(l => (
                <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 truncate max-w-[160px]">{l.title || 'Untitled'}</td>
                  <td className="px-4 py-3 text-gray-500 hidden sm:table-cell truncate max-w-[120px]">{l.ownerName}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{l.city}</td>
                  <td className="px-4 py-3 font-semibold text-fire">₹{(l.partnerShare || l.totalRent || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      l.status === 'active' ? 'bg-green-50 text-green-600' :
                      l.status === 'pending_verification' ? 'bg-amber-100 text-amber-800' :
                      l.status === 'paused' ? 'bg-amber-50 text-amber-600' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {l.status === 'pending_verification' ? 'Pending Verification' : l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{l.views || 0}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => setDetail(l)} className="text-xs text-fire font-medium hover:underline flex items-center gap-1"><Eye className="w-3 h-3" /> View</button>
                    <button onClick={() => handleDelete(l.id)} className="text-xs text-red-500 font-medium hover:underline flex items-center gap-1"><Trash2 className="w-3 h-3" /> Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setDetail(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">{detail.title}</h3>
              <button onClick={() => setDetail(null)} className="p-1 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            {detail.images?.[0] && <img src={detail.images[0]} className="w-full h-40 object-cover rounded-xl mb-4" alt="" />}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[['Owner', detail.ownerName], ['City', detail.city], ['Locality', detail.locality], ['Flat Type', detail.flatType], ['Rent', `₹${detail.totalRent?.toLocaleString()}`], ['Share', `₹${detail.partnerShare?.toLocaleString()}`], ['Status', detail.status], ['Views', detail.views?.toString()]].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] text-gray-400 uppercase font-bold">{k}</p>
                  <p className="font-medium text-gray-800 mt-0.5">{v}</p>
                </div>
              ))}
            </div>
            {detail.description && <p className="text-sm text-gray-600 mt-4">{detail.description}</p>}
            {detail.status === 'pending_verification' && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                <p className="text-xs text-amber-800 font-medium">This listing is pending owner identity verification.</p>
                <a href="/admin/verifications" className="text-xs font-bold px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700">
                  Review Queue
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
