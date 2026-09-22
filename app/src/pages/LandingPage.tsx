import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useStore } from '@/store/useStore';

// Landing modular components
import LandingNavbar from '@/components/landing/LandingNavbar';
import HeroSection from '@/components/landing/HeroSection';
import StatsStrip from '@/components/landing/StatsStrip';
import LivingOptionsSection from '@/components/landing/LivingOptionsSection';
import TrustSection from '@/components/landing/TrustSection';
import CommunityTestimonialSection from '@/components/landing/CommunityTestimonialSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import FeaturedListingsSection from '@/components/landing/FeaturedListingsSection';
import FinalCTASection from '@/components/landing/FinalCTASection';
import LandingFooter from '@/components/landing/LandingFooter';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openAuthModal } = useStore();

  useEffect(() => {
    // Scroll to top upon landing page mount
    window.scrollTo(0, 0);
  }, []);

  const handleListSpace = () => {
    if (user?.uid) {
      navigate('/owner-dashboard');
    } else {
      openAuthModal({
        title: 'Post Your Room Listing',
        subtitle: 'Sign in or use quick demo account to list your room.',
        redirect: '/owner-dashboard',
      });
    }
  };

  return (
    <div
      className="min-h-screen text-[#1A1A2E] font-sans selection:bg-[#E5501A]/20 selection:text-[#E5501A] overflow-x-hidden w-full max-w-full"
      style={{
        background: `linear-gradient(160deg, #F7F3ED 0%, #FBF9F6 40%, #F5F0EA 100%)`,
      }}
    >
      {/* 1. Premium Navigation */}
      <LandingNavbar onListSpace={handleListSpace} />

      {/* 2. Hero Section + Hero Search Module + Trust Micro-bar */}
      <HeroSection />

      {/* 3. Living Options (4 Cards: Private Rooms, Shared Rooms, PGs & Hostels, Coliving Spaces) */}
      <LivingOptionsSection />

      {/* 4. Statistics Strip (50K+, 25K+, 100+, 4.8/5) */}
      <StatsStrip />

      {/* 5. Why NestMate / More than a platform, a community */}
      <TrustSection />

      {/* 6. Community Testimonial & Story Collage */}
      <CommunityTestimonialSection />

      {/* 7. How It Works (4 Steps with Vector Illustrations & Dashed Arrows) */}
      <HowItWorksSection />

      {/* 8. Featured Listings Carousel */}
      <FeaturedListingsSection />

      {/* 9. Final CTA Banner: Ready to find your people? */}
      <FinalCTASection />

      {/* 10. Premium Footer */}
      <LandingFooter onListSpace={handleListSpace} />
    </div>
  );
}
