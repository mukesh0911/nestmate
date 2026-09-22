import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';

interface LandingFooterProps {
  onListSpace: () => void;
}

export default function LandingFooter({ onListSpace }: LandingFooterProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    setSubscribed(true);
    toast.success('Thank you for subscribing to NestMate newsletter!');
    setEmail('');
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-white border-t border-border/60 pt-10 sm:pt-20 pb-10 px-4 sm:px-6 lg:px-8 text-left">
      <div className="max-w-[1280px] mx-auto">
        {/* ─── MOBILE ACCORDION FOOTER (< md): Matches Reference Mockup ─── */}
        <div className="md:hidden flex flex-col pb-8 border-b border-gray-100">
          {/* Brand Info */}
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-xl bg-[#E5501A] flex items-center justify-center text-white shadow-xs">
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 10.5L12 3l9 7.5" />
                <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
                <path d="M9 21v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6" />
              </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-[#1A1A2E]">NestMate</span>
          </Link>

          <p className="text-xs font-semibold text-[#1A1A2E] mb-1">
            People. Places. Possibilities.
          </p>
          <p className="text-[11px] text-slate-500 mb-4 leading-relaxed max-w-xs">
            A safer, smarter way to find your next home and connect with verified roommates across India.
          </p>

          {/* Social Icons */}
          <div className="flex items-center gap-2.5 mb-6">
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              aria-label="NestMate on X"
              className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-slate-600 hover:text-black hover:border-black transition-colors"
            >
              <span className="text-[10px] font-bold">𝕏</span>
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noreferrer"
              aria-label="NestMate on Instagram"
              className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-slate-600 hover:text-[#E5501A] transition-colors"
            >
              <i className="fa-brands fa-instagram text-[10px]" />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              aria-label="NestMate on LinkedIn"
              className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-slate-600 hover:text-blue-700 transition-colors"
            >
              <i className="fa-brands fa-linkedin-in text-[10px]" />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noreferrer"
              aria-label="NestMate on YouTube"
              className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-slate-600 hover:text-red-600 transition-colors"
            >
              <i className="fa-brands fa-youtube text-[10px]" />
            </a>
          </div>

          {/* Collapsible Accordion Sections */}
          <div className="divide-y divide-gray-100 border-t border-gray-100">
            {/* Product Section */}
            <div>
              <button
                type="button"
                onClick={() => toggleSection('product')}
                className="w-full py-3 flex items-center justify-between text-xs font-bold text-[#1A1A2E] cursor-pointer"
              >
                <span>Product</span>
                <span className="text-gray-400 text-sm font-light">
                  {openSection === 'product' ? '−' : '+'}
                </span>
              </button>
              {openSection === 'product' && (
                <ul className="space-y-2 pb-3 text-xs text-slate-500 pl-1 font-medium">
                  <li>
                    <Link to="/explore?tab=rooms" className="hover:text-[#E5501A]">Find a Room</Link>
                  </li>
                  <li>
                    <Link to="/explore?tab=roommates" className="hover:text-[#E5501A]">Find Flatmates</Link>
                  </li>
                  <li>
                    <button type="button" onClick={onListSpace} className="hover:text-[#E5501A] cursor-pointer text-left">
                      List Your Space
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => scrollToSection('how-it-works')} className="hover:text-[#E5501A] cursor-pointer text-left">
                      How It Works
                    </button>
                  </li>
                  <li>
                    <Link to="/safety" className="hover:text-[#E5501A]">Safety</Link>
                  </li>
                </ul>
              )}
            </div>

            {/* Company Section */}
            <div>
              <button
                type="button"
                onClick={() => toggleSection('company')}
                className="w-full py-3 flex items-center justify-between text-xs font-bold text-[#1A1A2E] cursor-pointer"
              >
                <span>Company</span>
                <span className="text-gray-400 text-sm font-light">
                  {openSection === 'company' ? '−' : '+'}
                </span>
              </button>
              {openSection === 'company' && (
                <ul className="space-y-2 pb-3 text-xs text-slate-500 pl-1 font-medium">
                  <li><Link to="/about" className="hover:text-[#E5501A]">About Us</Link></li>
                  <li><Link to="/about" className="hover:text-[#E5501A]">Careers</Link></li>
                  <li><Link to="/about" className="hover:text-[#E5501A]">Blog</Link></li>
                  <li><Link to="/about" className="hover:text-[#E5501A]">Press</Link></li>
                  <li><Link to="/help" className="hover:text-[#E5501A]">Contact</Link></li>
                </ul>
              )}
            </div>

            {/* Resources Section */}
            <div>
              <button
                type="button"
                onClick={() => toggleSection('resources')}
                className="w-full py-3 flex items-center justify-between text-xs font-bold text-[#1A1A2E] cursor-pointer"
              >
                <span>Resources</span>
                <span className="text-gray-400 text-sm font-light">
                  {openSection === 'resources' ? '−' : '+'}
                </span>
              </button>
              {openSection === 'resources' && (
                <ul className="space-y-2 pb-3 text-xs text-slate-500 pl-1 font-medium">
                  <li><Link to="/help" className="hover:text-[#E5501A]">Help Center</Link></li>
                  <li><Link to="/trust" className="hover:text-[#E5501A]">Community Guidelines</Link></li>
                  <li><Link to="/safety" className="hover:text-[#E5501A]">Safety Tips</Link></li>
                  <li><Link to="/how-it-works" className="hover:text-[#E5501A]">Living Guide</Link></li>
                  <li><Link to="/explore" className="hover:text-[#E5501A]">Sitemap</Link></li>
                </ul>
              )}
            </div>

            {/* Stay in the loop Section */}
            <div>
              <button
                type="button"
                onClick={() => toggleSection('loop')}
                className="w-full py-3 flex items-center justify-between text-xs font-bold text-[#1A1A2E] cursor-pointer"
              >
                <span>Stay in the loop</span>
                <span className="text-gray-400 text-sm font-light">
                  {openSection === 'loop' ? '−' : '+'}
                </span>
              </button>
              {openSection === 'loop' && (
                <div className="pb-4 pt-1">
                  <p className="text-[11px] text-slate-500 mb-2.5 leading-relaxed">
                    Get tips, new listings and community stories.
                  </p>
                  <form onSubmit={handleSubscribe} className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full bg-[#F5F2EC] rounded-xl pl-3 pr-10 py-2.5 text-xs text-[#1A1A2E] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#E5501A]"
                    />
                    <button
                      type="submit"
                      aria-label="Subscribe"
                      className="absolute right-1 top-1 bottom-1 w-8 rounded-lg bg-[#1A1A2E] text-white flex items-center justify-center cursor-pointer"
                    >
                      {subscribed ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── DESKTOP FOOTER (>= md): Original 5-Column Layout Untouched ─── */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 pb-16 border-b border-border/50">
          {/* Col 1: Brand & Tagline (4 cols) */}
          <div className="lg:col-span-4">
            <Link to="/" className="inline-flex items-center gap-2.5 mb-4 group">
              <div className="w-8 h-8 rounded-xl bg-[#E5501A] flex items-center justify-center text-white shadow-xs">
                <svg
                  viewBox="0 0 24 24"
                  className="w-4.5 h-4.5 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 10.5L12 3l9 7.5" />
                  <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
                  <path d="M9 21v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight text-[#1A1A2E]">NestMate</span>
            </Link>

            <p className="text-xs sm:text-sm font-semibold text-[#1A1A2E] mb-1">
              People. Places. Possibilities.
            </p>
            <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
              A safer, smarter way to find your next home and connect with verified roommates across
              India.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3">
              {/* X / Twitter */}
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                aria-label="NestMate on X"
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-slate-600 hover:text-black hover:border-black transition-colors"
              >
                <span className="text-xs font-bold">𝕏</span>
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="NestMate on Instagram"
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-slate-600 hover:text-[#E5501A] hover:border-[#E5501A] transition-colors"
              >
                <i className="fa-brands fa-instagram text-xs" />
              </a>

              {/* LinkedIn */}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                aria-label="NestMate on LinkedIn"
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-slate-600 hover:text-blue-700 hover:border-blue-700 transition-colors"
              >
                <i className="fa-brands fa-linkedin-in text-xs" />
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                aria-label="NestMate on YouTube"
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-slate-600 hover:text-red-600 hover:border-red-600 transition-colors"
              >
                <i className="fa-brands fa-youtube text-xs" />
              </a>
            </div>
          </div>

          {/* Col 2: Product (2 cols) */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-bold tracking-wider uppercase text-[#1A1A2E] mb-4">
              Product
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-500 font-medium">
              <li>
                <Link to="/explore?tab=rooms" className="hover:text-[#E5501A] transition-colors">
                  Find a Room
                </Link>
              </li>
              <li>
                <Link to="/explore?tab=roommates" className="hover:text-[#E5501A] transition-colors">
                  Find Flatmates
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onListSpace}
                  className="hover:text-[#E5501A] transition-colors cursor-pointer text-left"
                >
                  List Your Space
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => scrollToSection('how-it-works')}
                  className="hover:text-[#E5501A] transition-colors cursor-pointer text-left"
                >
                  How It Works
                </button>
              </li>
              <li>
                <Link to="/safety" className="hover:text-[#E5501A] transition-colors">
                  Safety
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Company (2 cols) */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-bold tracking-wider uppercase text-[#1A1A2E] mb-4">
              Company
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-500 font-medium">
              <li>
                <Link to="/about" className="hover:text-[#E5501A] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#E5501A] transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#E5501A] transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#E5501A] transition-colors">
                  Press
                </Link>
              </li>
              <li>
                <Link to="/help" className="hover:text-[#E5501A] transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Resources (2 cols) */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-bold tracking-wider uppercase text-[#1A1A2E] mb-4">
              Resources
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-500 font-medium">
              <li>
                <Link to="/help" className="hover:text-[#E5501A] transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/trust" className="hover:text-[#E5501A] transition-colors">
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link to="/safety" className="hover:text-[#E5501A] transition-colors">
                  Safety Tips
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-[#E5501A] transition-colors">
                  Living Guide
                </Link>
              </li>
              <li>
                <Link to="/explore" className="hover:text-[#E5501A] transition-colors">
                  Sitemap
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 5: Stay in the loop (2 cols) */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-bold tracking-wider uppercase text-[#1A1A2E] mb-4">
              Stay in the loop
            </h4>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Get tips, new listings and community stories.
            </p>

            <form onSubmit={handleSubscribe} className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full bg-[#F5F2EC] rounded-xl pl-3 pr-10 py-2.5 text-xs text-[#1A1A2E] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#E5501A]"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="absolute right-1 top-1 bottom-1 w-8 rounded-lg bg-[#1A1A2E] hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                {subscribed ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5" />
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-medium">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <span>© 2026 NestMate. All rights reserved.</span>
            <Link to="/privacy" className="hover:text-slate-600 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-slate-600 transition-colors">
              Terms of Service
            </Link>
            <Link to="/privacy" className="hover:text-slate-600 transition-colors">
              Cookies
            </Link>
          </div>

          <div className="flex items-center gap-1 text-slate-500">
            <span>Made with</span>
            <span className="text-red-500">❤️</span>
            <span>for a brighter world</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
