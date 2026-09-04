import { useNavigate } from 'react-router-dom';
import { Users, Heart, Target, ChevronRight } from 'lucide-react';

export default function AboutUs() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-parchment page-transition">
      {/* Header */}
      <div className="gradient-dark py-20 px-4 text-center">
        <h1 className="text-4xl sm:text-5xl font-display italic text-white mb-4">About NestMate</h1>
        <p className="text-white/60 max-w-lg mx-auto">Building the future of shared living in India</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        {/* Mission */}
        <section className="mb-16">
          <h2 className="type-h2 mb-6">Our Mission</h2>
          <p className="text-lg text-ink/70 leading-relaxed mb-4">
            At NestMate, we believe that who you live with is just as important as where you live. Our mission is to eliminate the friction, uncertainty, and awkwardness of finding a roommate by matching people based on lifestyle compatibility rather than just budget and location.
          </p>
        </section>

        {/* Story */}
        <section className="mb-16">
          <h2 className="type-h2 mb-6">The Story</h2>
          <div className="card-nestmate p-8">
            <p className="text-ink/70 leading-relaxed mb-4">
              NestMate was born out of personal frustration. After moving to Bengaluru and going through three different incompatible roommates in a single year, our founders realized the system was broken.
            </p>
            <p className="text-ink/70 leading-relaxed">
              We were using platforms designed for buying and selling property to find human connections. We needed a platform that cared if you were a night owl, a neat freak, or someone who loves hosting guests. Thus, NestMate was created — the first people-first roommate matching platform.
            </p>
          </div>
        </section>

        {/* Core Values */}
        <section className="mb-16">
          <h2 className="type-h2 mb-6">Our Core Values</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="card-nestmate p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-teal/10 text-teal flex items-center justify-center mx-auto mb-4">
                <Target className="w-7 h-7" />
              </div>
              <h3 className="font-semibold mb-2 text-ink">Lifestyle First</h3>
              <p className="text-sm text-ink/60">Matching based on sleep habits, cleanliness, and work routines for genuine harmony.</p>
            </div>
            <div className="card-nestmate p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-fire/10 text-fire flex items-center justify-center mx-auto mb-4">
                <Heart className="w-7 h-7" />
              </div>
              <h3 className="font-semibold mb-2 text-ink">Trust & Safety</h3>
              <p className="text-sm text-ink/60">Multi-tier identity verification, peer reviews, and mutual contact sharing consent.</p>
            </div>
            <div className="card-nestmate p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-navy/10 text-navy flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="font-semibold mb-2 text-ink">Community Driven</h3>
              <p className="text-sm text-ink/60">Empowering young professionals and students to build supportive shared homes.</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <button onClick={() => navigate('/login')} className="btn-fire">
            Join Our Community
          </button>
        </div>
      </div>
    </div>
  );
}
