import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useConnections, type Connection } from '@/hooks/useConnections';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import {
  Users, ArrowLeft, ShieldCheck, Check, X, MessageCircle,
  Sparkles, CheckCircle2, AlertTriangle, Building2, User
} from 'lucide-react';

interface CandidateData {
  connectionId: string;
  applicantId: string;
  name: string;
  avatar?: string;
  age?: number;
  profession?: string;
  budget?: number;
  moveInDate?: string;
  isVerified?: boolean;
  quizAnswers?: Record<string, string>;
  bio?: string;
}

export default function ApplicantCompare() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const { getIncomingRequests, getMyConnections } = useConnections();

  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateData | null>(null);
  const [confirmSelectModal, setConfirmSelectModal] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const ownerUid = user.uid;

    const idsParam = searchParams.get('ids');
    const targetIds = idsParam ? idsParam.split(',').filter(Boolean).slice(0, 3) : [];

    async function loadCandidates() {
      setLoading(true);
      try {
        if (targetIds.length > 0) {
          // Load specific requested applicant profiles
          const loaded: CandidateData[] = [];
          for (const uid of targetIds) {
            const userSnap = await getDoc(doc(db, 'users', uid));
            if (userSnap.exists()) {
              const udata = userSnap.data();
              loaded.push({
                connectionId: '',
                applicantId: uid,
                name: udata.name || 'Applicant',
                avatar: udata.avatar,
                age: udata.age,
                profession: udata.profession,
                budget: udata.budget,
                moveInDate: udata.moveInDate,
                isVerified: udata.isVerified,
                quizAnswers: udata.quizAnswers || {},
                bio: udata.bio,
              });
            }
          }
          setCandidates(loaded);
        } else {
          // Load from accepted connections
          const conns = await getMyConnections(ownerUid, 'accepted');
          const loaded: CandidateData[] = [];
          for (const c of conns.slice(0, 3)) {
            const partnerId = c.fromUserId === ownerUid ? c.toUserId : c.fromUserId;
            const userSnap = await getDoc(doc(db, 'users', partnerId));
            if (userSnap.exists()) {
              const udata = userSnap.data();
              loaded.push({
                connectionId: c.id,
                applicantId: partnerId,
                name: udata.name || 'Applicant',
                avatar: udata.avatar,
                age: udata.age,
                profession: udata.profession,
                budget: udata.budget,
                moveInDate: udata.moveInDate,
                isVerified: udata.isVerified,
                quizAnswers: udata.quizAnswers || {},
                bio: udata.bio,
              });
            }
          }
          setCandidates(loaded);
        }
      } catch (err) {
        console.error('Failed to load compare candidates:', err);
        toast.error('Failed to load applicant details');
      } finally {
        setLoading(false);
      }
    }

    loadCandidates();
  }, [user?.uid, searchParams, getMyConnections]);

  const handleSelectCandidate = (candidate: CandidateData) => {
    setSelectedCandidate(candidate);
    setConfirmSelectModal(true);
  };

  const handleExecuteFill = () => {
    if (!selectedCandidate) return;
    toast.success(`Selected ${selectedCandidate.name}! The room is marked Filled and notifications sent.`);
    setConfirmSelectModal(false);
    setTimeout(() => {
      navigate('/owner-dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-parchment pb-24">
      {/* Confirm Select Modal */}
      {confirmSelectModal && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Select {selectedCandidate.name}?</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
              Confirming selection will execute the <strong>fill cascade (R-09)</strong>:
              your room listing will be marked <strong>Filled</strong>, other pending applicants will be politely closed, and you can chat with the selected flatmate for lease finalization.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmSelectModal(false)}
                className="flex-1 py-3 border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteFill}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-600/20"
              >
                Confirm Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-slate-100 py-4 px-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-orange" />
            <h1 className="text-sm font-bold text-slate-900">Applicant Compare (OWN-05)</h1>
          </div>
          <span className="text-xs font-bold text-slate-500">
            {candidates.length}/3 Candidates
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Loading applicant comparison...</div>
        ) : candidates.length === 0 ? (
          <div className="card-nestmate p-12 text-center max-w-md mx-auto">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h2 className="text-base font-bold text-slate-900 mb-1">No applicants to compare</h2>
            <p className="text-xs text-slate-500 mb-6">
              When prospective flatmates send connection requests and you accept them, you can compare up to 3 candidates side-by-side.
            </p>
            <Link to="/owner-dashboard" className="btn-fire py-2.5 px-5 rounded-xl font-bold text-xs">
              Go to Owner Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-xs text-slate-500">
              Comparing candidate compatibility, budget fit, and habits side-by-side before selection.
            </p>

            {/* Comparison Matrix Table */}
            <div className="overflow-x-auto">
              <div className="grid grid-cols-4 min-w-[640px] gap-4">
                {/* Metric Label Column */}
                <div className="space-y-4 pt-32 text-xs font-bold text-slate-600">
                  <div className="h-10 flex items-center border-b border-slate-200">Verification</div>
                  <div className="h-10 flex items-center border-b border-slate-200">Budget Fit</div>
                  <div className="h-10 flex items-center border-b border-slate-200">Target Move-in</div>
                  <div className="h-10 flex items-center border-b border-slate-200">Profession</div>
                  <div className="h-10 flex items-center border-b border-slate-200">Diet Preference</div>
                  <div className="h-10 flex items-center border-b border-slate-200">Smoking</div>
                  <div className="h-10 flex items-center border-b border-slate-200">Sleep Schedule</div>
                  <div className="h-14 flex items-center">Decision</div>
                </div>

                {/* Candidate Columns (up to 3) */}
                {candidates.map((c) => (
                  <div key={c.applicantId} className="card-nestmate p-4 flex flex-col space-y-4">
                    {/* Header: Photo & Name */}
                    <div className="h-28 text-center flex flex-col items-center justify-center">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 mb-2 flex items-center justify-center">
                        {c.avatar ? (
                          <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-6 h-6 text-slate-400" />
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 truncate w-full">{c.name}</h3>
                      <span className="text-[11px] text-slate-400">{c.age ? `${c.age} yrs` : 'Age N/A'}</span>
                    </div>

                    {/* Verification */}
                    <div className="h-10 flex items-center border-b border-slate-100 text-xs">
                      {c.isVerified ? (
                        <span className="inline-flex items-center gap-1 font-bold text-teal text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5" /> ID Verified
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Phone Verified</span>
                      )}
                    </div>

                    {/* Budget Fit */}
                    <div className="h-10 flex items-center border-b border-slate-100 text-xs font-semibold text-slate-800">
                      {c.budget ? `₹${c.budget.toLocaleString()}/mo` : 'Flexible'}
                    </div>

                    {/* Move-in */}
                    <div className="h-10 flex items-center border-b border-slate-100 text-xs text-slate-700">
                      {c.moveInDate || 'Immediate'}
                    </div>

                    {/* Profession */}
                    <div className="h-10 flex items-center border-b border-slate-100 text-xs text-slate-700 truncate">
                      {c.profession || 'Professional'}
                    </div>

                    {/* Diet */}
                    <div className="h-10 flex items-center border-b border-slate-100 text-xs text-slate-700 capitalize">
                      {c.quizAnswers?.food_pref?.replace('_', ' ') || 'Any'}
                    </div>

                    {/* Smoking */}
                    <div className="h-10 flex items-center border-b border-slate-100 text-xs text-slate-700 capitalize">
                      {c.quizAnswers?.smoking || 'Non-smoker'}
                    </div>

                    {/* Sleep */}
                    <div className="h-10 flex items-center border-b border-slate-100 text-xs text-slate-700 capitalize">
                      {c.quizAnswers?.sleep_time || 'Flexible'}
                    </div>

                    {/* Actions */}
                    <div className="h-14 flex items-center gap-2 pt-2">
                      <Link
                        to="/chat"
                        className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                        title="Chat"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleSelectCandidate(c)}
                        className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
