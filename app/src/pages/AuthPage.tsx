import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck, MapPin, Wallet, Smartphone } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    initRecaptcha,
    sendOTP,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    resetPassword,
    error: authError
  } = useAuth();

  const [authMethod, setAuthMethod] = useState<'phone' | 'email' | 'forgot'>('phone');
  
  // Phone state
  const [phone, setPhone] = useState((location.state as any)?.phone?.replace('+91', '').trim() || '');
  
  // Email state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  
  // Status state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const displayError = error || authError;
  const isDevelopment = import.meta.env.DEV;

  useEffect(() => {
    initRecaptcha('recaptcha-container');
  }, [initRecaptcha]);

  const validatePhone = (num: string) => /^[6-9]\d{9}$/.test(num);

  const handlePhoneSubmit = async () => {
    setError('');
    if (!phone) {
      setError('Please enter your 10-digit mobile number');
      return;
    }
    if (!validatePhone(phone)) {
      setError('Please enter a valid 10-digit Indian mobile number');
      return;
    }

    setLoading(true);
    try {
      const e164 = `+91${phone}`;
      const verificationId = await sendOTP(e164);
      try {
        sessionStorage.setItem('nestmate_otp_pending', JSON.stringify({ phone: `+91 ${phone}`, verificationId }));
      } catch {}
      navigate('/verify-otp', { state: { phone: `+91 ${phone}`, verificationId } });
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      const { isNew, role, onboardingComplete } = await signInWithGoogle();
      if (isNew || !role) {
        navigate('/role-select');
      } else if (!onboardingComplete) {
        navigate(role === 'owner' ? '/onboarding/owner' : '/onboarding/seeker');
      } else {
        navigate(role === 'owner' ? '/owner-dashboard' : '/dashboard');
      }
    } catch (e: any) {
      setError(e.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async () => {
    setError('');
    if (!email.trim()) { setError('Enter your email'); return; }
    if (!password || password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const { isNew, role, onboardingComplete } = await signInWithEmail(email.trim(), password);
      if (isNew || !role) {
        navigate('/role-select');
      } else if (!onboardingComplete) {
        navigate(role === 'owner' ? '/onboarding/owner' : '/onboarding/seeker');
      } else {
        navigate(role === 'owner' ? '/owner-dashboard' : '/dashboard');
      }
    } catch (e: any) {
      if (e?.code === 'auth/user-not-found' || e?.code === 'auth/invalid-credential') {
        try {
          await signUpWithEmail(email.trim(), password);
          navigate('/role-select');
          return;
        } catch (signupErr: any) {
          setError(signupErr.message || 'Authentication failed. Please check your credentials.');
          return;
        }
      }
      setError(e.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
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

  const brandBullets = [
    { icon: ShieldCheck, text: 'Safe chat with phone number privacy' },
    { icon: Smartphone, text: 'Instant phone OTP verification (T1)' },
    { icon: MapPin, text: 'Verified rooms across Bangalore' },
    { icon: Wallet, text: 'Direct connect — 100% free platform' },
  ];

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
            Find your perfect<br /><span className="text-fire">roommate</span> in Bangalore.
          </h2>
          <ul className="space-y-3 mb-8">
            {brandBullets.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2.5 text-sm text-white/70">
                {Icon && <Icon className="w-4 h-4 text-white/40 shrink-0" aria-hidden />}
                <span>{text}</span>
              </li>
            ))}
          </ul>
          <p className="text-white/50 text-xs">Verified Bangalore Flatmates & Rooms</p>
        </div>

        <p className="text-xs text-white/30">© 2026 NestMate. Bangalore Only.</p>
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

          {/* Invisible reCAPTCHA container */}
          <div id="recaptcha-container" />

          {authMethod === 'phone' && (
            <div>
              <div className="mb-6">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-fire/10 text-fire mb-2">
                  <Smartphone className="w-3.5 h-3.5" /> Phone-First Authentication
                </span>
                <h1 className="type-h2 mb-1">Welcome to NestMate</h1>
                <p className="text-sm text-ink/60">Enter your Indian mobile number to continue</p>
              </div>

              {/* Dev hint */}
              {isDevelopment && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700">
                  <p className="font-semibold mb-1">Development Test Accounts:</p>
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => setPhone('6505553434')}
                      className="text-left text-blue-600 hover:underline"
                    >
                      +91 6505553434 (OTP: 123456)
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEmail('test@nestmate.com'); setPassword('Test@1234'); setAuthMethod('email'); }}
                      className="text-left text-blue-600 hover:underline"
                    >
                      Email: test@nestmate.com (Click to prefill)
                    </button>
                  </div>
                </div>
              )}

              {/* Phone Input with +91 Prefix */}
              <div className="mb-4">
                <div className="flex">
                  <div className="flex items-center px-4 bg-cream/70 border-2 border-r-0 border-border rounded-l-xl text-sm font-semibold text-ink/70">
                    +91
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                      setError('');
                    }}
                    placeholder="98765 43210"
                    aria-label="Mobile Number"
                    autoFocus
                    className="flex-1 input-nestmate rounded-l-none text-base font-medium tracking-wide"
                    onKeyDown={(e) => e.key === 'Enter' && handlePhoneSubmit()}
                  />
                </div>
              </div>

              {displayError && (
                <p className="flex items-center gap-1.5 text-xs text-red-500 mb-4 bg-red-50 border border-red-200 rounded-xl px-3 py-2" role="alert">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{displayError}
                </p>
              )}

              <button
                onClick={handlePhoneSubmit}
                disabled={loading}
                className="w-full btn-fire flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm shadow-md disabled:opacity-50"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-ink/30 font-medium">or continue with</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleGoogle}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 border border-border rounded-xl text-xs font-semibold hover:bg-ink/5 transition-all disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setAuthMethod('email'); setError(''); }}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 border border-border rounded-xl text-xs font-semibold hover:border-fire/40 hover:bg-fire/[0.02] transition-all"
                >
                  <Mail className="w-4 h-4 text-ink/60" />
                  <span>Email</span>
                </button>
              </div>

              <p className="text-center text-xs text-ink/40 mt-6">
                By continuing, you agree to our{' '}
                <Link to="/terms" className="underline hover:text-ink/60">Terms</Link> and{' '}
                <Link to="/privacy" className="underline hover:text-ink/60">Privacy Policy</Link>
              </p>
            </div>
          )}

          {authMethod === 'email' && (
            <div>
              <button
                onClick={() => { setAuthMethod('phone'); setError(''); }}
                className="flex items-center gap-1 text-sm text-ink/50 hover:text-ink/70 mb-6 transition-colors"
              >
                ← Back to Phone Login
              </button>
              <h1 className="type-h2 mb-1">Email Sign In</h1>
              <p className="text-sm text-ink/50 mb-6">Sign in with your email credentials</p>

              <div className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    placeholder="you@example.com"
                    aria-label="Email address"
                    className="w-full input-nestmate pl-9"
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && document.getElementById('pw-input')?.focus()}
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
                  <input
                    id="pw-input"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    placeholder="Password (min 6 chars)"
                    aria-label="Password"
                    className="w-full input-nestmate pl-9 pr-10"
                    onKeyDown={e => e.key === 'Enter' && handleEmailSubmit()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/70 touch-target flex items-center justify-center"
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {displayError && (
                <p className="flex items-center gap-1.5 text-xs text-red-500 mt-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2" role="alert">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{displayError}
                </p>
              )}

              <button
                onClick={handleEmailSubmit}
                disabled={loading}
                className="w-full btn-fire mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
              </button>

              <button
                onClick={() => { setAuthMethod('forgot'); setError(''); setSuccess(''); }}
                className="w-full mt-3 text-xs text-ink/40 hover:text-fire transition-colors py-1"
              >
                Forgot password?
              </button>
            </div>
          )}

          {authMethod === 'forgot' && (
            <div>
              <button
                onClick={() => { setAuthMethod('email'); setError(''); setSuccess(''); }}
                className="flex items-center gap-1 text-sm text-ink/50 hover:text-ink/70 mb-6 transition-colors"
              >
                ← Back to Email Sign In
              </button>
              <h1 className="type-h2 mb-1">Reset password</h1>
              <p className="text-sm text-ink/50 mb-6">Enter your email and we'll send a reset link</p>
              <div className="relative mb-4">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/40" />
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@example.com"
                  aria-label="Email address"
                  className="w-full input-nestmate pl-9"
                  autoFocus
                />
              </div>
              {displayError && <p className="text-xs text-red-500 mb-3" role="alert">{displayError}</p>}
              {success && <p className="text-xs text-teal font-medium mb-3" role="status">{success}</p>}
              <button
                onClick={handleForgot}
                disabled={loading}
                className="w-full btn-fire disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Send Reset Link'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}