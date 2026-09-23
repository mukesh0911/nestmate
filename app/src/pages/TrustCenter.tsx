import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  ShieldCheck, Shield, CheckCircle2, ChevronDown, ChevronUp,
  AlertTriangle, Phone, Eye, Lock, ArrowRight, UserCheck, Clock, FileText, Check
} from 'lucide-react';

export default function TrustCenter() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expandedScam, setExpandedScam] = useState<number | null>(null);

  const toggleScam = (idx: number) => {
    setExpandedScam(expandedScam === idx ? null : idx);
  };

  const verificationTiers = [
    {
      tier: 'T0',
      title: 'Phone Verified',
      who: 'All users at signup',
      description: 'Authenticated via 6-digit SMS OTP. Prevents bot accounts and ensures one phone number per account.',
      badge: 'B-1 Phone Verified',
    },
    {
      tier: 'T1',
      title: 'Profile Complete',
      who: 'Active Seekers & Roommates',
      description: '10-dimension lifestyle questionnaire completed, verified work/college affiliation, and clear bio.',
      badge: 'B-2 Profile Complete',
    },
    {
      tier: 'T2',
      title: 'Govt ID Verified',
      who: 'Seekers & Owners',
      description: 'Aadhaar or Passport document review by human moderators. Unlocks the verified identity shield.',
      badge: 'B-3 ID Verified',
    },
    {
      tier: 'T3',
      title: 'Ownership / Room Control',
      who: 'Room Owners & Landlords',
      description: 'Electricity bill or rental agreement submitted and approved. Mandatory before any room listing is published as active.',
      badge: 'B-4 Owner Verified',
    },
  ];

  const badges = [
    { name: 'Phone Verified', desc: 'Valid Indian mobile number confirmed via OTP.', icon: Phone, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { name: 'Profile Complete', desc: '10 lifestyle dimensions answered honestly.', icon: UserCheck, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { name: 'ID Verified', desc: 'Govt photo ID verified by human moderation.', icon: ShieldCheck, color: 'text-teal bg-teal/10 border-teal/20' },
    { name: 'Owner Verified', desc: 'Proof of property ownership or rental lease validated.', icon: CheckCircle2, color: 'text-brand-orange bg-orange-50 border-orange-200' },
    { name: 'Top Responder', desc: 'Responds to prospective roommates within 2 hours.', icon: Clock, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  ];

  const scamPatterns = [
    {
      title: 'Fake Gate Pass / "Visiting Charge" Scams',
      summary: 'Scammers asking for ₹500 - ₹2,000 for a security pass before visiting a gated society.',
      detail: 'No legitimate Bangalore society charges visitors for looking at a rental flat. Never transfer funds for "gate entry tokens", "COVID sanitization fees", or "visitor cards". NestMate listings never require entry fees.',
    },
    {
      title: 'Deposit Before In-Person Inspection',
      summary: 'Pressure to transfer advance token money "because 5 other people are coming today".',
      detail: 'Fraudsters create fake listings with stock photos from luxury villas in Whitefield or Koramangala and demand token advances. Never send money before you or a trusted friend has physically inspected the room and met the resident.',
    },
    {
      title: 'Refusal to Chat Inside NestMate',
      summary: 'Requests to immediately switch to WhatsApp, Telegram, or call before introducing themselves.',
      detail: 'Scammers try to avoid NestMate audit logs and phone privacy protections. Keep early conversations inside NestMate chat until mutual trust is established through our consent-gated contact reveal.',
    },
  ];

  const meetSafeRules = [
    'Always meet during daylight hours for your initial room visit.',
    'Share your live location with a friend or family member before inspecting a property.',
    'Never make payments in cash without a signed digital or physical rent receipt.',
    'Verify that the person showing the flat actually lives there or holds valid lease rights.',
    'Inspect plumbing, water supply schedule, and electrical meters before committing.',
  ];

  return (
    <div className="min-h-screen bg-parchment pb-16">
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-b from-navy to-[#132338] text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-orange-300 text-xs font-semibold mb-4 border border-white/10">
            <Shield className="w-3.5 h-3.5" /> Trust & Safety Center
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
            How NestMate Protects Roommate Seekers in Bangalore
          </h1>
          <p className="text-sm sm:text-base text-white/70 max-w-2xl mx-auto leading-relaxed">
            Finding a roommate is a personal and financial decision. Here is how our graduated verification tiers,
            scam filters, and contact privacy guarantees keep you safe.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-6">
        {/* Mandatory Disclaimer Banner */}
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 mb-8 shadow-sm flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-sm font-bold text-amber-900 mb-1">
              Important Safety Notice: Verification ≠ Endorsement
            </h2>
            <p className="text-xs text-amber-800 leading-relaxed">
              While NestMate verifies identity documents and property control, verification does not constitute a background guarantee or personal endorsement. Always meet prospective roommates in person and physically inspect properties before making deposit payments.
            </p>
          </div>
        </div>

        {/* 1. Verification Tiers */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-brand-orange" />
            <h2 className="type-h2 text-slate-900">Graduated Verification Tiers</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mb-6">
            Trust is earned incrementally. Publishing a listing strictly requires Tier 3 verification.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {verificationTiers.map((t) => (
              <div key={t.tier} className="card-nestmate p-5 hover:border-brand-orange/30 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-900 text-white">
                    Tier {t.tier}
                  </span>
                  <span className="text-xs font-semibold text-brand-orange">
                    {t.who}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">{t.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">{t.description}</p>
                <div className="text-[11px] font-semibold text-teal flex items-center gap-1.5 bg-teal/5 border border-teal/20 rounded-lg px-2.5 py-1.5">
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>Awards: {t.badge}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Badge Gallery */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-brand-orange" />
            <h2 className="type-h2 text-slate-900">Verified Badge Glossary</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mb-6">
            Every badge shown on profile cards has an unambiguous, audited definition.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {badges.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.name} className={`p-4 rounded-2xl border ${b.color}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-bold">{b.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-normal">{b.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. Privacy & Contact Handshake */}
        <section className="mb-12 card-nestmate p-6 bg-gradient-to-br from-white to-orange-50/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-orange/10 flex items-center justify-center text-brand-orange shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">
                The Contact Privacy Promise
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3">
                Your mobile number and private contact details are masked everywhere on NestMate. Phone numbers are never exposed to public viewers or unaccepted connections.
              </p>
              <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200">
                  🔒 Masked Phone by Default
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200">
                  🤝 2-Party In-Chat Handshake to Reveal
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200">
                  🚫 Zero Broker Calls
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Scam Awareness */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-brand-orange" />
            <h2 className="type-h2 text-slate-900">Known Bangalore Rental Scams</h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mb-6">
            Be aware of common fraud vectors reported by room seekers across Bangalore.
          </p>

          <div className="space-y-3">
            {scamPatterns.map((s, idx) => (
              <div key={idx} className="card-nestmate overflow-hidden">
                <button
                  onClick={() => toggleScam(idx)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center">
                      !
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{s.title}</h3>
                      <p className="text-xs text-slate-500">{s.summary}</p>
                    </div>
                  </div>
                  {expandedScam === idx ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {expandedScam === idx && (
                  <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-700 leading-relaxed">
                    {s.detail}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 5. Meet-Safe Checklist */}
        <section className="mb-12 card-nestmate p-6">
          <h2 className="type-h2 text-slate-900 mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5 text-brand-orange" />
            5-Point Meet-Safe Checklist
          </h2>
          <div className="space-y-3">
            {meetSafeRules.map((rule, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-teal/10 text-teal text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {rule}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Moderation SLAs */}
        <section className="mb-12 bg-white rounded-3xl border border-slate-200 p-6">
          <h2 className="type-h2 text-slate-900 mb-2">Our Moderation SLAs</h2>
          <p className="text-xs text-slate-500 mb-4">
            Every report filed on NestMate is routed directly to the founding moderation queue.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-red-600 uppercase tracking-wider block mb-1">
                Emergency & Safety Reports
              </span>
              <p className="text-2xl font-bold text-slate-900 mb-1">&lt; 12 Hours</p>
              <p className="text-xs text-slate-500">Immediate account freeze applied while investigation is active.</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
                General & Listing Reports
              </span>
              <p className="text-2xl font-bold text-slate-900 mb-1">&lt; 48 Hours</p>
              <p className="text-xs text-slate-500">Every reporting user receives a status update notification.</p>
            </div>
          </div>
        </section>

        {/* CTA Bottom Band */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-2">
            Ready to find verified roommates in Bangalore?
          </h2>
          <p className="text-xs sm:text-sm text-white/70 max-w-md mx-auto mb-6">
            Join NestMate for free. Verified profiles, explained lifestyle compatibility, and fresh listings only.
          </p>
          {user ? (
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 btn-fire py-3 px-6 rounded-2xl font-bold text-sm shadow-md"
            >
              <span>Go to Your Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 btn-fire py-3 px-6 rounded-2xl font-bold text-sm shadow-md"
            >
              <span>Create Your Verified Profile</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

      </div>
    </div>
  );
}
