import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Smartphone, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function PhoneLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { initRecaptcha, sendOTP, signInWithGoogle, error: authError } = useAuth();

  const [phone, setPhone] = useState((location.state as any)?.phone?.replace('+91', '').trim() || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Check if we're in development mode
  const isDevelopment = import.meta.env.DEV;

  // Initialize invisible reCAPTCHA on mount
  useEffect(() => {
    initRecaptcha('recaptcha-container');
  }, [initRecaptcha]);

  const validatePhone = (num: string) => /^[6-9]\d{9}$/.test(num);

  const handleSubmit = async () => {
    setError('');
    if (!phone) { setError('Please enter your phone number'); return; }
    if (!validatePhone(phone)) { setError('Please enter a valid 10-digit Indian mobile number'); return; }

    setLoading(true);
    try {
      const e164 = `+91${phone}`;
      const verificationId = await sendOTP(e164);
      navigate('/verify-otp', { state: { phone: `+91 ${phone}`, verificationId } });
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
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
    } catch (err: any) {
      setError(err.message || 'Google login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-parchment flex items-center justify-center px-4">
      <div className="w-full max-w-[440px]">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-fire flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.88-2.88 7.19-5 9.88C9.92 16.21 7 11.85 7 9z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
            </div>
            <span className="text-xl font-semibold text-ink">NestMate</span>
          </Link>
        </div>

        {/* Card */}
        <div className="card-nestmate p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-fire/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Smartphone className="w-7 h-7 text-fire" />
            </div>
            <h2 className="type-h2 mb-2">Welcome to NestMate</h2>
            <p className="text-sm text-ink/60">Enter your phone number to get started</p>
          </div>

          {/* Phone Input */}
          <div className="mb-4">
            <div className="flex">
              <div className="flex items-center px-4 bg-cream/50 border-2 border-r-0 border-border rounded-l-xl text-sm font-medium text-ink/70">
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
                className={`flex-1 input-nestmate rounded-l-none ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : ''}`}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              />
            </div>
            {(error || authError) && (
              <p className="flex items-center gap-1.5 text-xs text-red-500 mt-2">
                <AlertCircle className="w-3.5 h-3.5" />
                {error || authError}
              </p>
            )}
          </div>

          {/* Development Test Numbers */}
          {isDevelopment && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-medium text-blue-800 mb-2">Development Mode — Test Numbers:</p>
              <div className="grid grid-cols-1 gap-1 text-xs text-blue-700">
                <button
                  onClick={() => setPhone('6505553434')}
                  className="text-left hover:text-blue-900 underline"
                >
                  +91 650 555 3434 (Test OTP: 123456)
                </button>
                <button
                  onClick={() => setPhone('6505553435')}
                  className="text-left hover:text-blue-900 underline"
                >
                  +91 650 555 3435 (Test OTP: 123456)
                </button>
                <button
                  onClick={() => setPhone('6505553436')}
                  className="text-left hover:text-blue-900 underline"
                >
                  +91 650 555 3436 (Test OTP: 123456)
                </button>
              </div>
            </div>
          )}

          {/* Invisible reCAPTCHA mounts here */}
          <div id="recaptcha-container" />

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full btn-fire disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Sending…
              </span>
            ) : 'Send OTP'}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-ink/40">or continue with</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Social Login — Google OAuth can be wired in later via Firebase */}
          <div className="grid grid-cols-2 gap-3">
            <button
              className="flex items-center justify-center gap-2 py-2.5 border-2 border-border rounded-xl text-sm font-medium text-ink/70 hover:bg-cream/50 transition-all disabled:opacity-50"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>
            <button
              className="flex items-center justify-center gap-2 py-2.5 border-2 border-border rounded-xl text-sm font-medium text-ink/70 hover:bg-cream/50 transition-all"
              onClick={() => setError('LinkedIn sign-in coming soon. Use phone number for now.')}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#0A66C2">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              LinkedIn
            </button>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-ink/40 mt-6">
          By continuing, you agree to our{' '}
          <span className="underline cursor-pointer">Terms of Service</span> and{' '}
          <span className="underline cursor-pointer">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}
