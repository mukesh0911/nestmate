import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';
import { ArrowLeft, Save, RefreshCw, Loader2, Linkedin, Instagram, Shield, ShieldCheck, CheckCircle2, XCircle, AlertCircle, Upload, Clock, FileText } from 'lucide-react';
import { cities, localitiesByCity, professions } from '@/lib/staticData';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStorage } from '@/hooks/useStorage';
import { toast } from 'sonner';

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const { updateProfile } = useUserProfile();

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    profession: '',
    bio: '',
    city: '',
    locality: '',
    workEmail: '',
    linkedin: '',
    instagram: '',
  });

  const [workEmailVerified, setWorkEmailVerified] = useState(false);

  const [saving, setSaving] = useState(false);
  const [retaking, setRetaking] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { uploadGenericImage } = useStorage();

  // Verification states
  const [verifications, setVerifications] = useState<any[]>([]);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedDocType, setSelectedDocType] = useState<'aadhaar' | 'work_id' | 'student_id'>('aadhaar');

  useEffect(() => {
    if (!user?.uid) return;
    const fetchVerifications = async () => {
      setVerificationLoading(true);
      try {
        const q = query(collection(db, 'verifications'), where('userId', '==', user.uid));
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setVerifications(list);
      } catch (err) {
        console.error('Error fetching verifications:', err);
      } finally {
        setVerificationLoading(false);
      }
    };
    fetchVerifications();
  }, [user?.uid]);

  const handleUploadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB');
      return;
    }

    setUploadingDoc(true);
    setUploadProgress(0);

    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `profiles/${user.uid}/verifications/${selectedDocType}_${Date.now()}.${ext}`;
      const url = await uploadGenericImage(file, path, (pct) => setUploadProgress(pct));

      const newDocRef = await addDoc(collection(db, 'verifications'), {
        userId: user.uid,
        type: selectedDocType,
        status: 'approved',
        documentUrl: url,
        submittedAt: new Date(),
        reviewedAt: new Date(),
        reviewNote: 'Verified'
      });

      await updateProfile(user.uid, {
        isVerified: true,
        verificationLevel: 3,
        ...(selectedDocType === 'work_id' ? { workEmailVerified: true } : {})
      });
      await refreshProfile();

      setVerifications(prev => [...prev, {
        id: newDocRef.id,
        userId: user.uid,
        type: selectedDocType,
        status: 'approved',
        documentUrl: url,
        submittedAt: { toDate: () => new Date() },
        reviewedAt: new Date(),
        reviewNote: 'Verified'
      }]);

      toast.success('Document uploaded & profile verified!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload document.');
    } finally {
      setUploadingDoc(false);
    }
  };

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        age: profile.age?.toString() || '',
        gender: profile.gender || '',
        profession: profile.profession || '',
        bio: profile.bio || '',
        city: profile.city || '',
        locality: profile.localities?.[0] || profile.locality || '',
        workEmail: profile.workEmail || '',
        linkedin: profile.socialLinks?.linkedin || '',
        instagram: profile.socialLinks?.instagram || '',
      });
      setWorkEmailVerified(profile.workEmailVerified || false);
    }
  }, [profile]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name) errs.name = 'Name is required';
    if (!formData.age || parseInt(formData.age) < 18) errs.age = 'Must be at least 18';
    if (!formData.city) errs.city = 'City is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !user?.uid) return;
    setSaving(true);
    try {
      await updateProfile(user.uid, {
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender,
        profession: formData.profession,
        bio: formData.bio,
        city: formData.city,
        locality: formData.locality,
        localities: formData.locality ? [formData.locality] : [],
        workEmail: formData.workEmail,
        workEmailVerified: workEmailVerified || !!formData.workEmail,
        socialLinks: {
          linkedin: formData.linkedin,
          instagram: formData.instagram,
        },
      });
      await refreshProfile();
      toast.success('Profile updated successfully!');
      navigate('/profile');
    } catch (err) {
      console.error('Error updating profile', err);
    } finally {
      setSaving(false);
    }
  };

  const handleRetakeQuiz = async () => {
    if (!user?.uid) return;
    setRetaking(true);
    try {
      await updateProfile(user.uid, {
        quizAnswers: {},
        onboardingComplete: false,
      });
      navigate('/onboarding/seeker');
    } catch (err) {
      console.error('Error resetting quiz', err);
      setRetaking(false);
    }
  };



  return (
    <div className="min-h-screen bg-parchment pb-20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/profile')} className="p-2 -ml-2 rounded-full hover:bg-cream/50 transition-colors">
            <ArrowLeft className="w-5 h-5 text-ink/70" />
          </button>
          <h1 className="text-xl font-display italic">Edit Profile</h1>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-fire px-4 py-1.5 text-sm flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </button>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
        {/* Basic Info */}
        <div className="card-nestmate p-5 space-y-4">
          <h2 className="font-semibold mb-2">Basic Information</h2>
          <div>
            <label className="label-floating">Full Name</label>
            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className={`input-nestmate ${errors.name ? 'border-red-400' : ''}`} />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-floating">Age</label>
              <input type="number" value={formData.age} onChange={e => setFormData({ ...formData, age: e.target.value })} className={`input-nestmate ${errors.age ? 'border-red-400' : ''}`} />
              {errors.age && <p className="text-xs text-red-500 mt-1">{errors.age}</p>}
            </div>
            <div>
              <label className="label-floating">Gender</label>
              <select value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })} className="input-nestmate">
                <option value="">Select</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label-floating">Profession</label>
            <select value={formData.profession} onChange={e => setFormData({ ...formData, profession: e.target.value })} className="input-nestmate">
              <option value="">Select</option>
              {professions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label className="label-floating">Bio</label>
            <textarea 
              value={formData.bio} 
              onChange={e => setFormData({ ...formData, bio: e.target.value })} 
              className="input-nestmate min-h-[100px] resize-none"
              placeholder="Tell potential roommates a bit about yourself..."
            />
          </div>
        </div>

        {/* Location */}
        <div className="card-nestmate p-5 space-y-4">
          <h2 className="font-semibold mb-2">Location</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-floating">City</label>
              <select value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value, locality: '' })} className={`input-nestmate ${errors.city ? 'border-red-400' : ''}`}>
                <option value="">Select city</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
            </div>
            <div>
              <label className="label-floating">Locality</label>
              <select value={formData.locality} onChange={e => setFormData({ ...formData, locality: e.target.value })} className="input-nestmate" disabled={!formData.city}>
                <option value="">Select locality</option>
                {formData.city && localitiesByCity[formData.city]?.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="card-nestmate p-5 space-y-4">
          <h2 className="font-semibold mb-2">Social Profiles</h2>
          <p className="text-xs text-ink/60 -mt-2 mb-4">Add your social profiles to build trust with potential roommates.</p>
          
          <div className="space-y-4">
            <label className="text-sm font-semibold text-ink hidden">Social Profiles</label>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Linkedin className="w-5 h-5 text-[#0077B5]" />
              </div>
              <input 
                type="url" 
                placeholder="LinkedIn Profile URL"
                value={formData.linkedin} 
                onChange={e => setFormData({ ...formData, linkedin: e.target.value })} 
                className="input-nestmate pl-10"
              />
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Instagram className="w-5 h-5 text-[#E1306C]" />
              </div>
              <input 
                type="url" 
                placeholder="Instagram Handle or URL"
                value={formData.instagram} 
                onChange={e => setFormData({ ...formData, instagram: e.target.value })} 
                className="input-nestmate pl-10"
              />
            </div>
          </div>
        </div>

        {/* Identity Verification Portal */}
        <div className="card-nestmate p-5 space-y-4">
          <h2 className="font-semibold mb-1 flex items-center gap-2">
            <Shield className="w-5 h-5 text-fire" /> Trust & Verification
          </h2>
          <p className="text-xs text-ink/60 -mt-2">Upload government ID or work credentials to achieve higher tier badges (Silver, Gold, Pro) and boost match visibility.</p>
          
          {/* Active status */}
          {verificationLoading ? (
            <div className="flex items-center gap-2 text-xs text-ink/40 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-fire" /> Loading verifications...
            </div>
          ) : verifications.length > 0 ? (
            <div className="space-y-3 pt-2">
              {verifications.map((v) => (
                <div key={v.id} className="flex justify-between items-center bg-cream/30 border border-border/40 p-3 rounded-xl">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold capitalize">{v.type.replace('_', ' ')} Upload</p>
                    {v.status === 'pending' && (
                      <p className="text-[10px] text-amber-600 flex items-center gap-1"><Clock className="w-3 h-3" /> Under Review</p>
                    )}
                    {v.status === 'approved' && (
                      <p className="text-[10px] text-teal flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Approved</p>
                    )}
                    {v.status === 'rejected' && (
                      <div className="space-y-1">
                        <p className="text-[10px] text-red-500 flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</p>
                        {v.reviewNote && <p className="text-[9px] text-red-400 bg-red-50 p-1 rounded">Reason: {v.reviewNote}</p>}
                      </div>
                    )}
                  </div>
                  
                  {v.status === 'rejected' && (
                    <button
                      onClick={() => {
                        setVerifications(prev => prev.filter(x => x.id !== v.id));
                      }}
                      className="text-[10px] font-bold text-fire hover:underline"
                    >
                      Retry Upload
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-ink/40 py-2">You haven't submitted any verification documents yet.</p>
          )}

          {/* Upload Controls */}
          {(!verifications.some(v => v.status === 'pending' || v.status === 'approved')) && (
            <div className="pt-2 space-y-4 border-t border-border/40">
              <div className="grid grid-cols-3 gap-2">
                {(['aadhaar', 'work_id', 'student_id'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedDocType(type)}
                    className={`py-2 px-1 rounded-lg text-[10px] font-bold capitalize transition-all border ${
                      selectedDocType === type
                        ? 'bg-fire text-white border-fire'
                        : 'bg-white text-ink/60 border-border hover:bg-cream/40'
                    }`}
                  >
                    {type.replace('_', ' ')}
                  </button>
                ))}
              </div>

              <div>
                <label className="border-2 border-dashed border-border/60 hover:border-fire/60 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-cream/10">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleUploadDoc}
                    className="hidden"
                    disabled={uploadingDoc}
                  />
                  {uploadingDoc ? (
                    <div className="text-center space-y-2">
                      <Loader2 className="w-8 h-8 animate-spin text-fire mx-auto" />
                      <p className="text-xs font-bold text-ink">Uploading {uploadProgress}%</p>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <Upload className="w-8 h-8 text-ink/30 mx-auto" />
                      <p className="text-xs font-bold text-ink">Upload Document Photo</p>
                      <p className="text-[10px] text-ink/40">JPG, PNG, or PDF up to 5MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Retake Quiz */}
        {profile?.role === 'seeker' && (
          <div className="card-nestmate p-5 bg-gradient-to-br from-cream to-parchment border-fire/20 text-center">
            <h2 className="font-display italic text-lg mb-2 text-fire">Update Your Compatibility Profile</h2>
            <p className="text-sm text-ink/60 mb-4">Changed your habits or preferences? Retake the quiz to get better roommate matches.</p>
            <button onClick={handleRetakeQuiz} disabled={retaking} className="btn-outline border-fire/50 text-fire hover:bg-fire/10 w-full flex items-center justify-center gap-2">
              {retaking ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Retake Compatibility Quiz
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
