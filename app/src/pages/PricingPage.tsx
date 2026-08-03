import { useNavigate } from 'react-router-dom';
import { Check, Crown, X, ChevronDown, HelpCircle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function PricingPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [isAnnual, setIsAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [paying, setPaying] = useState(false);
  const [showMockCheckout, setShowMockCheckout] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState(299);

  const features = [
    { name: 'Connect Requests', free: 'Unlimited*', premium: 'Unlimited', corporate: 'Unlimited' },
    { name: 'View Matches', free: true, premium: true, corporate: true },
    { name: 'Active Listings', free: '1', premium: '5', corporate: 'Unlimited' },
    { name: 'Basic Chat', free: true, premium: true, corporate: true },
    { name: 'Trust Badges', free: true, premium: true, corporate: true },
    { name: 'See who viewed you', free: false, premium: true, corporate: true },
    { name: 'Priority Placement', free: false, premium: true, corporate: true },
    { name: 'Profile Boost', free: false, premium: true, corporate: true },
    { name: 'HR Dashboard', free: false, premium: false, corporate: true },
    { name: 'Bulk Listings', free: false, premium: false, corporate: true },
  ];

  const faqs = [
    { q: 'How does the free plan work?', a: 'NestMate is currently free for all core features including connects, chat, and matching. Premium tiers for priority placement are coming soon.' },
    { q: 'Is my phone number visible to others?', a: 'No. Phone numbers are hidden until both parties mutually agree to share them. All communication happens through our secure in-app chat.' },
    { q: 'Can I cancel my premium subscription?', a: 'Yes, once Premium launches you can cancel anytime. Features remain active until the end of your billing period.' },
    { q: 'How does compatibility matching work?', a: 'We ask 10 lifestyle questions covering sleep schedule, food preferences, work mode, cleanliness, and more. Our algorithm compares answers to generate a compatibility percentage for every match.' },
    { q: 'Is Aadhaar verification mandatory?', a: 'No, but verified profiles appear higher in search results. Upload ID from Edit Profile for admin review.' },
    { q: 'What cities is NestMate available in?', a: 'We are currently active in Chennai, Bengaluru, Hyderabad, Pune, Mumbai, and Delhi NCR. We are expanding to more cities soon.' },
  ];

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async (price: number) => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Future Production Integration: Razorpay + Cloud Function must set isPremium server-side.
    // Client-side premium flips are blocked by Firestore rules (LB-07).
    const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!key || key === 'rzp_test_mockkey12345') {
      setSelectedPrice(price);
      setShowMockCheckout(true);
      return;
    }

    setPaying(true);
    const loaded = await loadRazorpay();
    if (!loaded) {
      toast.error('Failed to load payment gateway. Please check your connection.');
      setPaying(false);
      return;
    }

    toast.info('Premium payments are being finalized. Contact support to upgrade, or try again soon.');
    setPaying(false);
  };

  return (
    <div className="min-h-screen bg-parchment page-transition">
      {/* Header */}
      <div className="gradient-dark py-20 px-4 text-center">
        <h1 className="text-4xl sm:text-5xl font-display italic text-white mb-4">Simple Pricing</h1>
        <p className="text-white/60 max-w-lg mx-auto mb-8">Start free, upgrade when you are ready. No hidden fees.</p>
        
        {/* Billing Toggle */}
        <div className="inline-flex items-center gap-3 bg-white/10 rounded-full p-1">
          <button onClick={() => setIsAnnual(false)} className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${!isAnnual ? 'bg-white text-ink' : 'text-white/60'}`}>Monthly</button>
          <button onClick={() => setIsAnnual(true)} className={`px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${isAnnual ? 'bg-white text-ink' : 'text-white/60'}`}>
            Annual
            <span className="bg-gold text-ink text-[10px] font-bold px-1.5 py-0.5 rounded">Save 30%</span>
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-10 relative z-10">
        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {/* Free */}
          <div className="card-nestmate p-6">
            <div className="mb-6">
              <p className="text-sm font-medium text-ink/60 mb-1">Free</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">₹0</span>
                <span className="text-sm text-ink/50">/month</span>
              </div>
            </div>
            <button onClick={() => navigate(user ? '/dashboard' : '/login')} className="w-full btn-outline mb-6">
              {user ? 'Current Plan' : 'Get Started'}
            </button>
            <ul className="space-y-3">
              {features.map(f => (
                <li key={f.name} className="flex items-center gap-2.5 text-sm">
                  {typeof f.free === 'boolean' ? (
                    f.free ? <Check className="w-4 h-4 text-teal flex-shrink-0" /> : <X className="w-4 h-4 text-ink/20 flex-shrink-0" />
                  ) : (
                    <Check className="w-4 h-4 text-teal flex-shrink-0" />
                  )}
                  <span className={typeof f.free === 'boolean' && !f.free ? 'text-ink/30' : 'text-ink/70'}>
                    {f.name} {typeof f.free === 'string' && <span className="text-ink/40">({f.free})</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Premium */}
          <div className="card-nestmate p-6 border-2 border-fire relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-fire text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Crown className="w-3 h-3" /> Most Popular
              </span>
            </div>
            <div className="mb-6 mt-2">
              <p className="text-sm font-medium text-fire mb-1">Premium</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">₹{isAnnual ? Math.round(2499/12) : 299}</span>
                <span className="text-sm text-ink/50">/month</span>
              </div>
              {isAnnual && <p className="text-xs text-ink/40 mt-1">Billed annually at ₹2,499 (Save ₹1,089)</p>}
            </div>
            <button
              onClick={() => handleUpgrade(isAnnual ? 2499 : 299)}
              disabled={paying || profile?.isPremium}
              className="w-full btn-fire mb-6 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {paying ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Upgrading...</>
              ) : profile?.isPremium ? (
                'Premium Active 🎉'
              ) : (
                'Upgrade Now'
              )}
            </button>
            <ul className="space-y-3">
              {features.map(f => (
                <li key={f.name} className="flex items-center gap-2.5 text-sm">
                  {typeof f.premium === 'boolean' ? (
                    f.premium ? <Check className="w-4 h-4 text-fire flex-shrink-0" /> : <X className="w-4 h-4 text-ink/20 flex-shrink-0" />
                  ) : (
                    <Check className="w-4 h-4 text-fire flex-shrink-0" />
                  )}
                  <span className={typeof f.premium === 'boolean' && !f.premium ? 'text-ink/30' : 'text-ink/70'}>
                    {f.name} {typeof f.premium === 'string' && <span className="text-fire font-medium">({f.premium})</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Corporate */}
          <div className="card-nestmate p-6">
            <div className="mb-6">
              <p className="text-sm font-medium text-ink/60 mb-1">Corporate</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">Custom</span>
              </div>
              <p className="text-xs text-ink/40 mt-1">For companies with 10+ employees</p>
            </div>
            <button onClick={() => toast.success('Contact request sent! Our sales team will email you shortly.')} className="w-full btn-navy mb-6">Talk to Sales</button>
            <ul className="space-y-3">
              {features.map(f => (
                <li key={f.name} className="flex items-center gap-2.5 text-sm">
                  {typeof f.corporate === 'boolean' ? (
                    f.corporate ? <Check className="w-4 h-4 text-navy flex-shrink-0" /> : <X className="w-4 h-4 text-ink/20 flex-shrink-0" />
                  ) : (
                    <Check className="w-4 h-4 text-navy flex-shrink-0" />
                  )}
                  <span className={typeof f.corporate === 'boolean' && !f.corporate ? 'text-ink/30' : 'text-ink/70'}>
                    {f.name} {typeof f.corporate === 'string' && <span className="text-navy font-medium">({f.corporate})</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl font-display italic text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="card-nestmate p-4">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between text-left">
                  <span className="font-medium text-sm">{faq.q}</span>
                  <HelpCircle className={`w-4 h-4 text-ink/40 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && <p className="text-sm text-ink/60 mt-3 leading-relaxed">{faq.a}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Trust Signals */}
        <div className="text-center pb-16">
          <div className="flex items-center justify-center gap-6 text-sm text-ink/40">
            <span>Cancel anytime</span>
            <span>•</span>
            <span>Secure payment via Razorpay</span>
            <span>•</span>
            <span>24/7 support</span>
          </div>
        </div>
      </div>

      {/* Mock Razorpay Checkout Modal */}
      {showMockCheckout && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl animate-fade-in border border-border">
            {/* Header */}
            <div className="bg-[#E05A47] text-white p-6 relative">
              <button
                onClick={() => setShowMockCheckout(false)}
                className="absolute top-4 right-4 text-white/85 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold text-lg">N</div>
                <span className="font-display italic text-lg font-bold">NestMate Premium</span>
              </div>
              <p className="text-xs text-white/80">{isAnnual ? 'Annual Subscription' : 'Monthly Subscription'}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold font-display">₹{selectedPrice}</span>
                <span className="text-xs text-white/80">total</span>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-xs leading-relaxed">
                <span className="font-bold">Coming soon:</span> Live Razorpay checkout requires a Cloud Function to verify payment and grant Premium. Client-side activation is disabled for security.
              </div>

              <div className="space-y-3">
                <div className="text-[10px] text-ink/40 font-bold uppercase tracking-wider">Prefilled Details</div>
                <div className="bg-cream/40 rounded-xl p-3 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-ink/50">Name:</span>
                    <span className="font-medium text-ink">{profile?.name || 'Test User'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-ink/50">Email:</span>
                    <span className="font-medium text-ink">{profile?.email || 'test@nestmate.com'}</span>
                  </div>
                  {profile?.phone && (
                    <div className="flex justify-between">
                      <span className="text-ink/50">Phone:</span>
                      <span className="font-medium text-ink">{profile?.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                <button
                  onClick={() => {
                    toast.info('Premium activation is a Future Production Integration (Razorpay + server verify).');
                    setShowMockCheckout(false);
                  }}
                  className="w-full py-3 bg-teal hover:bg-teal/90 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  Notify me when Premium launches
                </button>
                <button
                  onClick={() => {
                    setShowMockCheckout(false);
                  }}
                  className="w-full py-3 border border-border hover:bg-cream/30 text-ink/75 rounded-xl text-sm font-semibold transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
