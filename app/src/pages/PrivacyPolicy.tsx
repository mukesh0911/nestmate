import { useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function PrivacyPolicy() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(
    location.pathname.includes('terms') ? 'terms' : 'privacy'
  );

  return (
    <div className="min-h-screen bg-parchment page-transition">
      {/* Header */}
      <div className="gradient-dark py-20 px-4 text-center">
        <h1 className="text-4xl sm:text-5xl font-display italic text-white mb-4">Legal & Privacy</h1>
        <p className="text-white/60 max-w-lg mx-auto">Everything you need to know about how we protect your data.</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Tabs */}
        <div className="flex border-b border-border mb-10">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`pb-4 px-6 font-medium text-sm transition-all border-b-2 ${
              activeTab === 'privacy' ? 'border-fire text-fire' : 'border-transparent text-ink/60 hover:text-ink'
            }`}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`pb-4 px-6 font-medium text-sm transition-all border-b-2 ${
              activeTab === 'terms' ? 'border-fire text-fire' : 'border-transparent text-ink/60 hover:text-ink'
            }`}
          >
            Terms of Service
          </button>
        </div>

        {/* Content */}
        <div className="card-nestmate p-8 md:p-12">
          {activeTab === 'privacy' ? (
            <div className="prose prose-sm md:prose-base text-ink/80 max-w-none">
              <h2 className="type-h2 mb-6">Privacy Policy</h2>
              <p>Last updated: October 2025</p>

              <h3 className="font-semibold text-lg mt-8 mb-4">1. Information We Collect</h3>
              <p className="mb-4">
                We collect information you provide directly to us, such as your name, email, phone number, lifestyle preferences, and location data when you create an account, complete our compatibility quiz, or use our platform.
              </p>

              <h3 className="font-semibold text-lg mt-8 mb-4">2. How We Use Your Information</h3>
              <ul className="list-disc pl-5 mb-4 space-y-2">
                <li>To match you with compatible roommates based on our algorithm.</li>
                <li>To verify your identity and ensure the safety of our community.</li>
                <li>To communicate with you regarding connections, matches, and support.</li>
              </ul>

              <h3 className="font-semibold text-lg mt-8 mb-4">3. Data Sharing and Security</h3>
              <p className="mb-4">
                We do not sell your personal data. We only share your profile information with potential matches. Your phone number is strictly hidden until you mutually agree to share it with a connection. We implement industry-standard security measures to protect your data.
              </p>

              <h3 className="font-semibold text-lg mt-8 mb-4">4. Your Rights</h3>
              <p className="mb-4">
                You have the right to access, update, or delete your personal information at any time through your Account Settings. If you wish to permanently delete your account, all associated data will be removed from our active servers.
              </p>
            </div>
          ) : (
            <div className="prose prose-sm md:prose-base text-ink/80 max-w-none">
              <h2 className="type-h2 mb-6">Terms of Service</h2>
              <p>Last updated: October 2025</p>

              <h3 className="font-semibold text-lg mt-8 mb-4">1. Acceptance of Terms</h3>
              <p className="mb-4">
                By accessing or using NestMate, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.
              </p>

              <h3 className="font-semibold text-lg mt-8 mb-4">2. User Responsibilities</h3>
              <p className="mb-4">
                You agree to provide accurate, current, and complete information during the registration process. You are responsible for maintaining the confidentiality of your account and password. You agree not to use the platform for any unlawful purpose or to harass, abuse, or harm another person.
              </p>

              <h3 className="font-semibold text-lg mt-8 mb-4">3. Content and Listings</h3>
              <p className="mb-4">
                Users who list properties are responsible for the accuracy of their listings. NestMate acts as a platform to facilitate connections and does not verify the physical condition or legal status of any properties listed.
              </p>

              <h3 className="font-semibold text-lg mt-8 mb-4">4. Termination</h3>
              <p className="mb-4">
                We reserve the right to suspend or terminate your account at any time, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users of NestMate, us, or third parties, or for any other reason.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
