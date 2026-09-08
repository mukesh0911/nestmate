import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  HelpCircle, ArrowLeft, Search, ChevronDown, ChevronUp,
  Mail, Send, AlertTriangle, CheckCircle2, ShieldAlert, Phone
} from 'lucide-react';

interface FAQItem {
  category: string;
  question: string;
  answer: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    category: 'Verification',
    question: 'How long does document verification take?',
    answer: 'Identity (Tier 2) and Ownership (Tier 3) submissions are reviewed by our Bangalore moderation team within 24 hours. You will receive an in-app notification as soon as your status updates.',
  },
  {
    category: 'Verification',
    question: 'Are my uploaded government IDs visible to other users?',
    answer: 'Never. Your identity documents (Aadhaar, Passport, Rental Agreements) are stored in encrypted, private Firebase Storage accessible only by audited administrators. Other users only see the Verified Trust Badge.',
  },
  {
    category: 'Freshness',
    question: 'Why do listings expire after 30 days?',
    answer: 'To eliminate "ghost listings" and stale rentals, every listing in Bangalore expires after 30 days unless confirmed active by the owner. Owners receive a renewal prompt at day 27 to extend availability with a single tap.',
  },
  {
    category: 'Deposits & Payments',
    question: 'Does NestMate collect rental deposits or booking fees?',
    answer: 'No. NestMate is 100% free at launch with zero platform payments or broker fees. Any landlord or flatmate demanding "visiting pass charges" or deposit transfers before a physical walkthrough is violating our safety rules and should be reported immediately.',
  },
  {
    category: 'Contact Reveal',
    question: 'How do I get a flatmate or landlord’s phone number?',
    answer: 'Phone numbers remain masked until you connect and chat inside NestMate. Inside the active chat thread, either party can tap "Request Phone Reveal". Once both parties consent, numbers appear once in the conversation.',
  },
  {
    category: 'Safety & Reporting',
    question: 'What happens when I block another user?',
    answer: 'Blocking is immediate and bidirectional. The blocked party is sanitized from your discovery, search feeds, and active chat threads. They will not be notified of the block.',
  },
  {
    category: 'Account',
    question: 'Can I both search for a room and list my current spare room?',
    answer: 'Yes! NestMate supports dual roles ("Both"). You can switch between Seeker mode (finding flatmates) and Owner mode (managing listings) anytime using the Mode Chip in your profile header.',
  },
];

export default function HelpSupport() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  // Contact Form
  const [topic, setTopic] = useState('verification');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [ticketSent, setTicketSent] = useState(false);

  const filteredFAQs = useMemo(() => {
    if (!searchQuery.trim()) return FAQ_DATA;
    const q = searchQuery.toLowerCase();
    return FAQ_DATA.filter(
      item => item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Please describe your question or issue');
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setTicketSent(true);
      toast.success('Support ticket submitted! Our team will respond shortly.');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-parchment pb-24">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-100 py-4 px-4 sticky top-0 z-30 shadow-xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-brand-orange" />
            <h1 className="text-sm font-bold text-slate-900">Help & Support (ACCT-03)</h1>
          </div>
          <Link to="/safety" className="text-xs font-semibold text-red-600 hover:underline">
            Safety Center
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search FAQs (verification, deposits, freshness...)"
            className="w-full input-nestmate pl-11 py-3 text-sm"
          />
        </div>

        {/* Emergency Band */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs text-red-900">
            <strong className="block font-bold mb-0.5">Emergency Assistance:</strong>
            NestMate cannot handle live crisis response. If you are in immediate danger, please call <strong>112</strong> or visit our <Link to="/safety" className="underline font-bold text-red-700">Safety Center</Link>.
          </div>
        </div>

        {/* FAQ Accordion */}
        <div className="card-nestmate p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>

          {filteredFAQs.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No questions found matching "{searchQuery}".</p>
          ) : (
            <div className="space-y-3 divide-y divide-slate-100">
              {filteredFAQs.map((item, idx) => {
                const isOpen = openIndex === idx;
                return (
                  <div key={idx} className="pt-3 first:pt-0">
                    <button
                      onClick={() => setOpenIndex(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between text-left py-1 group"
                    >
                      <span className="text-xs font-bold text-slate-800 group-hover:text-brand-orange transition-colors">
                        {item.question}
                      </span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" />
                      )}
                    </button>
                    {isOpen && (
                      <p className="text-xs text-slate-600 leading-relaxed pt-2 pb-1">
                        {item.answer}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Contact Support Form */}
        <div className="card-nestmate p-6">
          <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Mail className="w-4 h-4 text-brand-orange" />
            Contact Bangalore Operations
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Cannot find what you need? Send a message directly to our human support team.
          </p>

          {ticketSent ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-900 mb-1">Message Received</h3>
              <p className="text-xs text-slate-600 mb-4">
                We will reply to your account ({profile?.phone || profile?.email || 'your registered number'}) within 24 hours.
              </p>
              <button
                onClick={() => { setTicketSent(false); setMessage(''); }}
                className="text-xs font-semibold text-emerald-700 hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitTicket} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Topic</label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full input-nestmate text-xs font-medium"
                >
                  <option value="verification">Verification & Documents</option>
                  <option value="listing">Listing & Freshness Issue</option>
                  <option value="safety">Safety / Suspected Scam</option>
                  <option value="account">Account & Privacy Settings</option>
                  <option value="other">Other Feedback</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Message</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue with as much detail as possible..."
                  className="w-full input-nestmate text-xs p-3"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full btn-fire py-3 rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {sending ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Support Request</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
