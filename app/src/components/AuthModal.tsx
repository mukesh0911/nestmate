import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { mockSeekers, mockListings } from '@/lib/mockData';
import { X, Sparkles, User, Building2, Phone, ShieldCheck, Loader2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  redirectAfterLogin?: string;
}

export default function AuthModal({
  isOpen,
  onClose,
  title = 'Sign in to Connect with Roommates',
  subtitle = 'Create your account or try a 1-click demo to send connect requests, chat, and save rooms.',
  redirectAfterLogin,
}: AuthModalProps) {
  const navigate = useNavigate();
  const [loadingRole, setLoadingRole] = useState<'seeker' | 'owner' | null>(null);

  if (!isOpen) return null;

  const handleDemoLogin = async (role: 'seeker' | 'owner') => {
    setLoadingRole(role);
    try {
      // 1. Sign in anonymously with Firebase Auth
      const userCred = await signInAnonymously(auth);
      const uid = userCred.user.uid;

      if (role === 'seeker') {
        const demoProfile = mockSeekers[0];
        await setDoc(doc(db, 'users', uid), {
          ...demoProfile,
          uid,
          name: 'Rohan (Demo Seeker)',
          phone: '+919999900001',
          email: 'demo.seeker@nestmate.in',
          role: 'seeker',
          city: 'Chennai',
          onboardingComplete: true,
          isPremium: true,
          isVerified: true,
          quizAnswers: { q1: '1', q2: '2', q3: '1', q4: '3', q5: '2', q6: '1', q7: '4', q8: '2', q9: '1', q10: '3' },
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      } else {
        const demoOwner = mockListings[0];
        await setDoc(doc(db, 'users', uid), {
          uid,
          name: (demoOwner?.ownerName || 'Priya') + ' (Demo Owner)',
          phone: '+919999900002',
          email: 'demo.owner@nestmate.in',
          role: 'owner',
          age: 28,
          gender: 'Female',
          city: 'Chennai',
          bio: 'Property owner offering premium verified flatmates & rooms.',
          onboardingComplete: true,
          isPremium: true,
          isVerified: true,
          verificationLevel: 3,
          savedRoomIds: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      onClose();
      if (redirectAfterLogin) {
        navigate(redirectAfterLogin);
      } else {
        navigate(role === 'seeker' ? '/dashboard' : '/owner-dashboard');
      }
    } catch (err) {
      console.error('Demo login error:', err);
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-border relative animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-ink/40 hover:text-ink hover:bg-cream/60 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center pt-2 pb-4">
          <div className="w-12 h-12 rounded-2xl gradient-fire flex items-center justify-center mx-auto mb-3 shadow-md">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold text-ink tracking-tight">{title}</h2>
          <p className="text-xs text-ink/60 mt-1.5 leading-relaxed">{subtitle}</p>
        </div>

        {/* 1-Click Demo Buttons */}
        <div className="space-y-3 my-4">
          <div className="text-[11px] font-bold text-ink/40 uppercase tracking-wider text-center">
            Instant 1-Click Evaluation
          </div>

          <button
            onClick={() => handleDemoLogin('seeker')}
            disabled={loadingRole !== null}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-fire/30 bg-gradient-to-r from-fire/5 to-transparent hover:from-fire/10 hover:border-fire transition-all group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-fire/10 text-fire flex items-center justify-center group-hover:scale-105 transition-transform">
                {loadingRole === 'seeker' ? <Loader2 className="w-5 h-5 animate-spin" /> : <User className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-ink group-hover:text-fire transition-colors">
                  Try as Seeker (Room Hunter)
                </p>
                <p className="text-[11px] text-ink/50">Explore matches, send interest, split rent</p>
              </div>
            </div>
            <span className="text-xs font-bold text-fire bg-white px-2.5 py-1 rounded-full border border-fire/20 shadow-sm">
              Instant Demo
            </span>
          </button>

          <button
            onClick={() => handleDemoLogin('owner')}
            disabled={loadingRole !== null}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-navy/30 bg-gradient-to-r from-navy/5 to-transparent hover:from-navy/10 hover:border-navy transition-all group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-navy/10 text-navy flex items-center justify-center group-hover:scale-105 transition-transform">
                {loadingRole === 'owner' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Building2 className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-ink group-hover:text-navy transition-colors">
                  Try as Owner / Room Provider
                </p>
                <p className="text-[11px] text-ink/50">Post listing, review applicants, chat</p>
              </div>
            </div>
            <span className="text-xs font-bold text-navy bg-white px-2.5 py-1 rounded-full border border-navy/20 shadow-sm">
              Instant Demo
            </span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold text-ink/40 bg-white px-2">
            Or Use Mobile Login
          </div>
        </div>

        {/* Standard Auth Button */}
        <button
          onClick={() => {
            onClose();
            navigate('/login');
          }}
          className="w-full btn-outline flex items-center justify-center gap-2 py-3 rounded-xl text-sm"
        >
          <Phone className="w-4 h-4 text-fire" />
          Sign in with Phone / OTP
        </button>

        {/* Trust Footer */}
        <div className="flex items-center justify-center gap-1.5 mt-4 text-[11px] text-ink/40">
          <ShieldCheck className="w-3.5 h-3.5 text-teal" />
          <span>No spam guarantee · Verified profiles only</span>
        </div>
      </div>
    </div>
  );
}
