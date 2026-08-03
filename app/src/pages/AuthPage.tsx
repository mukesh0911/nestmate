import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function AuthPage() {
  const navigate = useNavigate();
  const { signInWithEmail, signUpWithEmail, resetPassword, signInWithGoogle, error: authError } = useAuth();

  const [mode, setMode] = useState<'landing' | 'email' | 'forgot'>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const displayError = error || authError;

  const handleGoogle = async () => {
    setError(''); setLoading(true);
    try {
      const { isNew, role } = await signInWithGoogle();
      navigate(isNew || !role ? '/role-select' : role === 'owner' ? '/owner-dashboard' : '/dashboard');
    } catch (e: any) { setError(e.message || 'Google sign-in failed.'); }
    finally { setLoading(false); }
  };

  const handleEmailSubmit = async () => {
    setError('');
    if (!email.trim()) { setError('Enter your email'); return; }
    if (!password || password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      // Try sign-in first; if user not found, sign up
      try {
        const { isNew, role, onboardingComplete } = await signInWithEmail(email.trim(), password);
        navigate(isNew || !onboardingComplete ? '/role-select' : role === 'owner' ? '/owner-dashboard' : '/dashboard');
      } catch (signInErr: any) {
        if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
          await signUpWithEmail(email.trim(), password);
          navigate('/role-select');
        } else throw signInErr;
      }
    } catch (e: any) { setError(e.message || 'Authentication failed.'); }
    finally { setLoading(false); }
  };

  const handleForgot = async () => {
    setError(''); setSuccess('');
    if (!email.trim()) { setError('Enter your email above'); return; }
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSuccess('Password reset email sent! Check your inbox.');
    } catch (e: any) { setError(e.message || 'Failed to send reset email.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-parchment flex page-transition">
      {/* Left: Brand Panel (desktop only) */}
      <div className="hidden lg:flex w-[420px] flex-shrink-0 gradient-dark flex-col justify-between p-10">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl gradient-fire flex items-center justify-center">
            <span className="text-white text-sm font-bold">N</span>
          </div>
          <span className="text-xl font-semibold text-white">NestMate</span>
        </Link>

        <div>
          <h2 className="text-3xl font-display italic text-white mb-4 leading-tight">
            Find your perfect<br /><span className="text-fire">roommate</span> today.
          </h2>
          <ul className="space-y-3 mb-8">
            {[
              '✅ Verified profiles — no fake accounts',
              '🔒 Safe chat with phone privacy',
              '🎯 10-dimension lifestyle matching',
              '🗺️ Map discovery across 6 metros',
              '💰 Direct connect — zero brokerage',
            ].map(item => (
              <li key={item} className="text-sm text-white/70">{item}</li>
            ))}
          </ul>
          <div className="flex -space-x-2">
            {['Priya', 'Arjun', 'Divya', 'Rohan'].map(name => (
              <img key={name} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`}
                className="w-9 h-9 rounded-full border-2 border-navy" alt="" />
            ))}
            <div className="w-9 h-9 rounded-full border-2 border-navy bg-fire flex items-center justify-center text-xs text-white font-bold">+8K</div>
          </div>
          <p className="text-white/50 text-xs mt-2">Trusted by 8,000+ young professionals</p>
        </div>

        <p className="text-xs text-white/30">© 2025 NestMate. India's #1 roommate platform.</p>
      </div>

      {/* Right: Auth Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl gradient-fire flex items-center justify-center">
                <span className="text-white font-bold">N</span>
              </div>
              <span className="text-xl font-semibold">NestMate</span>
            </Link>
          </div>

          {mode === 'landing' && (
            <div>
              <h1 className="text-2xl font-display italic mb-1">Welcome</h1>
              <p className="text-sm text-ink/50 mb-8">Sign in or create an account to continue</p>

              {/* Dev hint */}
              {import.meta.env.DEV && (
                <button onClick={() => { setEmail('test@nestmate.com'); setPassword('Test@1234'); setMode('email'); }}
                  className="w-full mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 hover:bg-blue-100 transition-colors text-left">
                  🚀 <strong>Test Account:</strong> test@nestmate.com / Test@1234 — Click to prefill
                </button>
              )}

              {/* Google (primary) */}
              <button onClick={handleGoogle} disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3.5 border-2 border-border rounded-xl font-medium text-sm hover:bg-ink/5 hover:border-ink/20 transition-all disabled:opacity-50 mb-3">
                {loading ? (
                  <span className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                Continue with Google
              </button>

              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-ink/30 font-medium">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <button onClick={() => setMode('email')}
                className="w-full flex items-center justify-center gap-2 py-3.5 border border-border rounded-xl text-sm font-medium hover:border-fire/40 hover:bg-fire/[0.02] transition-all">
                <Mail className="w-4 h-4 text-ink/50" />
                Continue with Email
              </button>

              {displayError && (
                <p className="flex items-center gap-1.5 text-xs text-red-500 mt-4 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{displayError}
                </p>
              )}

              <p className="text-center text-xs text-ink/40 mt-6">
                By continuing, you agree to our{' '}
                <Link to="/terms" className="underline hover:text-ink/60">Terms</Link> and{' '}
                <Link to="/privacy" className="underline hover:text-ink/60">Privacy Policy</Link>
              </p>
            </div>
          )}

          {mode === 'email' && (
            <div>
              <button onClick={() => { setMode('landing'); setError(''); }} className="flex items-center gap-1 text-sm text-ink/50 hover:text-ink/70 mb-6 transition-colors">
                ← Back
              </button>
              <h1 className="text-2xl font-display italic mb-1">Your email</h1>
              <p className="text-sm text-ink/50 mb-6">We'll sign you in or create an account automatically</p>

              <div className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
                  <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                    placeholder="you@example.com"
                    className="w-full input-nestmate pl-9"
                    autoFocus onKeyDown={e => e.key === 'Enter' && document.getElementById('pw-input')?.focus()} />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
                  <input id="pw-input" type={showPass ? 'text' : 'password'} value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    placeholder="Password (min 6 chars)"
                    className="w-full input-nestmate pl-9 pr-10"
                    onKeyDown={e => e.key === 'Enter' && handleEmailSubmit()} />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/70">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {displayError && (
                <p className="flex items-center gap-1.5 text-xs text-red-500 mt-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{displayError}
                </p>
              )}

              <button onClick={handleEmailSubmit} disabled={loading}
                className="w-full btn-fire mt-4 flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
              </button>

              <button onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                className="w-full mt-3 text-xs text-ink/40 hover:text-fire transition-colors py-1">
                Forgot password?
              </button>
            </div>
          )}

          {mode === 'forgot' && (
            <div>
              <button onClick={() => { setMode('email'); setError(''); setSuccess(''); }} className="flex items-center gap-1 text-sm text-ink/50 hover:text-ink/70 mb-6 transition-colors">
                ← Back
              </button>
              <h1 className="text-2xl font-display italic mb-1">Reset password</h1>
              <p className="text-sm text-ink/50 mb-6">Enter your email and we'll send a reset link</p>
              <div className="relative mb-4">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
                <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@example.com" className="w-full input-nestmate pl-9" autoFocus />
              </div>
              {displayError && <p className="text-xs text-red-500 mb-3">{displayError}</p>}
              {success && <p className="text-xs text-teal font-medium mb-3">{success}</p>}
              <button onClick={handleForgot} disabled={loading}
                className="w-full btn-fire disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Send Reset Link'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
