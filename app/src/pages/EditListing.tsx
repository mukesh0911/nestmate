import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useListings } from '@/hooks/useListings';
import type { Listing } from '@/hooks/useListings';
import { useStorage } from '@/hooks/useStorage';
import { cities, localitiesByCity, flatTypes, furnishingTypes, amenitiesList } from '@/lib/staticData';
import { ArrowLeft, Save, Trash2, ToggleLeft, ToggleRight, Loader2, AlertTriangle, Upload, X, Image as ImageIcon, GripVertical } from 'lucide-react';

export default function EditListing() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getListingById, updateListing, deleteListing } = useListings();
  const { uploadListingImages } = useStorage();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Photo management state
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    flatType: '',
    furnishing: '',
    city: '',
    locality: '',
    monthlyRent: 0,
    deposit: 0,
    partnersNeeded: 1,
    availableFrom: '',
    genderPreference: 'any',
    amenities: [] as string[],
    status: 'active' as 'active' | 'paused' | 'filled',
  });

  useEffect(() => {
    if (!id) return;
    getListingById(id).then((listing) => {
      if (!listing) {
        setError('Listing not found');
        setLoading(false);
        return;
      }
      if (listing.ownerId !== user?.uid) {
        setError('You do not own this listing');
        setLoading(false);
        return;
      }
      setForm({
        title: listing.title || '',
        description: listing.description || '',
        flatType: listing.flatType || '',
        furnishing: listing.furnishing || '',
        city: listing.city || '',
        locality: listing.locality || '',
        monthlyRent: (listing as any).monthlyRent || listing.totalRent || 0,
        deposit: listing.deposit || 0,
        partnersNeeded: (listing as any).partnersNeeded || 1,
        availableFrom: listing.availableFrom || '',
        genderPreference: (listing as any).genderPreference || 'any',
        amenities: listing.amenities || [],
        status: listing.status || 'active',
      });
      setExistingImages(listing.images || []);
      setLoading(false);
    });
  }, [id, user?.uid]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    setError('');
    try {
      let finalImages = [...existingImages];

      // Upload new photos if any
      if (newFiles.length > 0) {
        setIsUploading(true);
        const uploadedUrls = await uploadListingImages(newFiles, id, (pct) => setUploadProgress(pct));
        finalImages = [...finalImages, ...uploadedUrls];
        setIsUploading(false);
      }

      const { monthlyRent, ...restForm } = form;
      const share = Math.round(monthlyRent / (form.partnersNeeded + 1));

      await updateListing(id, {
        ...restForm,
        totalRent: monthlyRent,
        partnerShare: share,
        images: finalImages
      } as any);
      setSuccess('Listing updated successfully!');
      setTimeout(() => navigate('/owner-dashboard'), 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to update');
    } finally {
      setSaving(false);
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await deleteListing(id);
      navigate('/owner-dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to delete');
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    const next = form.status === 'active' ? 'paused' : 'active';
    setForm({ ...form, status: next });
    if (id) {
      await updateListing(id, { status: next } as any);
    }
  };

  const toggleAmenity = (a: string) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(a)
        ? prev.amenities.filter(x => x !== a)
        : [...prev.amenities, a],
    }));
  };

  // Photo management handlers
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const totalPhotos = existingImages.length + newFiles.length + files.length;
      if (totalPhotos > 10) {
        setError('Maximum 10 photos allowed');
        return;
      }
      setNewFiles(prev => [...prev, ...files]);
      const previews = files.map(f => URL.createObjectURL(f));
      setNewPreviews(prev => [...prev, ...previews]);
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewPhoto = (index: number) => {
    URL.revokeObjectURL(newPreviews[index]);
    setNewFiles(prev => prev.filter((_, i) => i !== index));
    setNewPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const totalPhotos = existingImages.length + newFiles.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-fire animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate('/owner-dashboard')} className="flex items-center gap-2 text-sm text-ink/60 hover:text-ink">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleStatus}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                form.status === 'active'
                  ? 'bg-teal/10 text-teal border border-teal/20'
                  : 'bg-ink/5 text-ink/50 border border-ink/10'
              }`}
            >
              {form.status === 'active' ? (
                <><ToggleRight className="w-5 h-5" /> Active</>
              ) : (
                <><ToggleLeft className="w-5 h-5" /> Paused</>
              )}
            </button>
          </div>
        </div>

        <h1 className="text-2xl font-display italic mb-6">Edit Listing</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 mb-4 text-sm">{error}</div>
        )}
        {success && (
          <div className="bg-teal/10 border border-teal/20 text-teal rounded-xl p-4 mb-4 text-sm">{success}</div>
        )}

        {/* Form */}
        <div className="space-y-6">
          {/* Photos Section */}
          <div className="card-nestmate p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-fire" />
                Room Photos
                <span className="text-xs text-ink/40 font-normal">({totalPhotos}/10)</span>
              </h3>
              {totalPhotos < 10 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm text-fire font-medium hover:text-fire-dark transition-colors flex items-center gap-1"
                >
                  <Upload className="w-4 h-4" /> Add Photos
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />

            {totalPhotos === 0 ? (
              <label
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-[140px] border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-fire/40 hover:bg-fire/5 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-fire/10 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-fire" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-ink/70">Add room photos</p>
                  <p className="text-xs text-ink/40">JPG, PNG up to 5MB each • Max 10 photos</p>
                </div>
              </label>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {/* Existing uploaded images */}
                {existingImages.map((url, i) => (
                  <div key={`existing-${i}`} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-border">
                    <img src={url} alt={`Room ${i + 1}`} className="w-full h-full object-cover" />
                    {i === 0 && (
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-fire text-white text-[10px] font-bold uppercase rounded-md">Cover</span>
                    )}
                    <button
                      onClick={() => removeExistingImage(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                ))}

                {/* New photo previews */}
                {newPreviews.map((url, i) => (
                  <div key={`new-${i}`} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-fire/30 ring-2 ring-fire/10">
                    <img src={url} alt={`New ${i + 1}`} className="w-full h-full object-cover" />
                    <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-fire/80 text-white text-[10px] font-bold rounded-md">New</span>
                    <button
                      onClick={() => removeNewPhoto(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                ))}

                {/* Add more button */}
                {totalPhotos < 10 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-fire/40 flex flex-col items-center justify-center gap-1 transition-all hover:bg-fire/5"
                  >
                    <Upload className="w-5 h-5 text-ink/30" />
                    <span className="text-[10px] text-ink/40">Add More</span>
                  </button>
                )}
              </div>
            )}

            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-ink/50">
                  <span>Uploading photos...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-fire rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}
          </div>

          <div className="card-nestmate p-5 space-y-4">
            <h3 className="font-semibold">Basic Details</h3>
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Title</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-nestmate w-full" />
            </div>
            <div>
              <label className="text-xs text-ink/50 mb-1 block">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-nestmate w-full h-24 resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-ink/50 mb-1 block">Flat Type</label>
                <select value={form.flatType} onChange={e => setForm({ ...form, flatType: e.target.value })} className="input-nestmate w-full">
                  <option value="">Select</option>
                  {flatTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-ink/50 mb-1 block">Furnishing</label>
                <select value={form.furnishing} onChange={e => setForm({ ...form, furnishing: e.target.value })} className="input-nestmate w-full">
                  <option value="">Select</option>
                  {furnishingTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="card-nestmate p-5 space-y-4">
            <h3 className="font-semibold">Location & Pricing</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-ink/50 mb-1 block">City</label>
                <select value={form.city} onChange={e => setForm({ ...form, city: e.target.value, locality: '' })} className="input-nestmate w-full">
                  <option value="">Select</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-ink/50 mb-1 block">Locality</label>
                <select value={form.locality} onChange={e => setForm({ ...form, locality: e.target.value })} className="input-nestmate w-full">
                  <option value="">Select</option>
                  {(localitiesByCity[form.city] || []).map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-ink/50 mb-1 block">Monthly Rent (₹)</label>
                <input type="number" value={form.monthlyRent} onChange={e => setForm({ ...form, monthlyRent: parseInt(e.target.value) || 0 })} className="input-nestmate w-full" />
              </div>
              <div>
                <label className="text-xs text-ink/50 mb-1 block">Deposit (₹)</label>
                <input type="number" value={form.deposit} onChange={e => setForm({ ...form, deposit: parseInt(e.target.value) || 0 })} className="input-nestmate w-full" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-ink/50 mb-1 block">Partners Needed</label>
                <input type="number" min="1" max="10" value={form.partnersNeeded} onChange={e => setForm({ ...form, partnersNeeded: parseInt(e.target.value) || 1 })} className="input-nestmate w-full" />
              </div>
              <div>
                <label className="text-xs text-ink/50 mb-1 block">Available From</label>
                <input type="date" value={form.availableFrom} onChange={e => setForm({ ...form, availableFrom: e.target.value })} className="input-nestmate w-full" />
              </div>
              <div>
                <label className="text-xs text-ink/50 mb-1 block">Gender Preference</label>
                <select value={form.genderPreference} onChange={e => setForm({ ...form, genderPreference: e.target.value })} className="input-nestmate w-full">
                  <option value="any">Any</option>
                  <option value="male">Male Only</option>
                  <option value="female">Female Only</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card-nestmate p-5 space-y-4">
            <h3 className="font-semibold">Amenities</h3>
            <div className="flex flex-wrap gap-2">
              {amenitiesList.map(a => (
                <button
                  key={a}
                  onClick={() => toggleAmenity(a)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    form.amenities.includes(a) ? 'bg-fire text-white' : 'bg-cream/50 text-ink/60 hover:bg-fire/10'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving || isUploading} className="flex-1 btn-fire flex items-center justify-center gap-2 disabled:opacity-50">
              {saving || isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isUploading ? `Uploading (${uploadProgress}%)...` : 'Save Changes'}
            </button>
            <button onClick={() => setShowDeleteConfirm(true)} className="px-6 py-3 border-2 border-red-200 text-red-500 rounded-xl font-medium hover:bg-red-50 transition-all flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Delete Listing?</h3>
                  <p className="text-sm text-ink/50">This action cannot be undone.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium">Cancel</button>
                <button onClick={handleDelete} disabled={saving} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                  {saving ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
