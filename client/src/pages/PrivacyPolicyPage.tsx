import { Link } from 'react-router-dom';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-emerald-600 hover:text-emerald-700 mb-8"
        >
          &larr; Back to Home
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-500 mb-10">Last updated: April 5, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8">
          {/* 1. Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">1. Introduction</h2>
            <p className="text-gray-600 leading-relaxed">
              DealEval respects your privacy and is committed to protecting your personal
              information. This Privacy Policy explains how we collect, use, store, and share
              your data when you use our real estate investment analysis platform and Chrome
              extension. By using DealEval, you consent to the practices described in this policy.
            </p>
          </section>

          {/* 2. Information We Collect */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">2. Information We Collect</h2>

            <h3 className="text-lg font-semibold text-gray-800 mt-4">Account Information</h3>
            <p className="text-gray-600 leading-relaxed">
              When you register for an account, we collect your email address, name, and password.
              Passwords are securely hashed and never stored in plain text.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-4">Property Data</h3>
            <p className="text-gray-600 leading-relaxed">
              We collect property information that you enter into the platform, including property
              addresses, purchase prices, rental income estimates, expense figures, and other
              financial inputs used for investment analysis.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-4">Usage Data</h3>
            <p className="text-gray-600 leading-relaxed">
              We collect information about how you interact with the Service, including pages
              visited and features used. We do not use third-party analytics or tracking services.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mt-4">Payment Data</h3>
            <p className="text-gray-600 leading-relaxed">
              Payment processing is handled entirely by Stripe. We do not store your credit card
              numbers or full payment details on our servers. We retain only the information
              necessary to manage your subscription, such as your Stripe customer ID and
              subscription status.
            </p>
          </section>

          {/* 3. How We Use Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">3. How We Use Information</h2>
            <p className="text-gray-600 leading-relaxed">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-3">
              <li>Provide and maintain the DealEval service</li>
              <li>Calculate investment metrics such as Cap Rate, IRR, Cash-on-Cash, DSCR, and GRM</li>
              <li>Generate comprehensive PDF investment reports</li>
              <li>Save your property evaluations for future access</li>
              <li>Process subscription billing through Stripe</li>
              <li>Communicate with you about your account and service updates</li>
            </ul>
          </section>

          {/* 4. Chrome Extension Data */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">4. Chrome Extension Data</h2>
            <p className="text-gray-600 leading-relaxed">
              The DealEval Chrome extension extracts publicly available property listing data from
              supported real estate websites (Zillow, Realtor.com, Redfin, LoopNet, and Crexi).
              This data is stored locally in your browser's storage. It is only sent to DealEval's
              servers when you explicitly choose to save a property or initiate an evaluation. The
              extension does not collect browsing history, track your activity on other websites,
              or transmit data without your action.
            </p>
          </section>

          {/* 5. Data Sharing */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">5. Data Sharing</h2>
            <p className="text-gray-600 leading-relaxed">
              We do <strong>not</strong> sell, rent, or trade your personal information to third
              parties. Your data is shared only with the following service provider:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-3">
              <li>
                <strong>Stripe</strong> &mdash; for secure payment processing and subscription
                management.
              </li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              We do not share your data with any other third parties, advertisers, or data brokers.
            </p>
          </section>

          {/* 6. Data Storage & Security */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">6. Data Storage & Security</h2>
            <p className="text-gray-600 leading-relaxed">
              Your data is stored in a PostgreSQL database with encryption at rest. All data
              transmitted between your browser and our servers is protected with HTTPS (TLS
              encryption) in transit. Authentication is handled through secure JWT (JSON Web Token)
              tokens. We implement industry-standard security practices to protect your information
              from unauthorized access, alteration, or destruction.
            </p>
          </section>

          {/* 7. Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">7. Data Retention</h2>
            <p className="text-gray-600 leading-relaxed">
              Account data is retained for as long as your account is active. If you request
              account deletion, we will remove your personal data within 30 days. Property
              evaluations and saved analyses are kept for your continued access as long as your
              account remains active.
            </p>
          </section>

          {/* 8. Your Rights */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">8. Your Rights</h2>
            <p className="text-gray-600 leading-relaxed">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-3">
              <li>Access the personal data we hold about you</li>
              <li>Correct any inaccurate or incomplete data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Export your property evaluations and analysis data</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              To exercise any of these rights, please contact us at{' '}
              <a
                href="mailto:support@projexlight.com"
                className="text-emerald-600 hover:text-emerald-700 underline"
              >
                support@projexlight.com
              </a>
              .
            </p>
          </section>

          {/* 9. Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">9. Cookies</h2>
            <p className="text-gray-600 leading-relaxed">
              DealEval uses localStorage for storing authentication tokens and user preferences.
              We do not use tracking cookies, third-party cookies, or any cookie-based analytics.
              Your browser's local storage is used solely for maintaining your session and
              remembering your application preferences.
            </p>
          </section>

          {/* 10. Children's Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">10. Children's Privacy</h2>
            <p className="text-gray-600 leading-relaxed">
              DealEval is not intended for use by children under the age of 13. We do not
              knowingly collect personal information from children under 13. If we become aware
              that we have collected data from a child under 13, we will take steps to delete
              that information promptly.
            </p>
          </section>

          {/* 11. California Residents (CCPA) */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">
              11. California Residents (CCPA)
            </h2>
            <p className="text-gray-600 leading-relaxed">
              If you are a California resident, you have the following rights under the California
              Consumer Privacy Act (CCPA):
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-3">
              <li>
                <strong>Right to Know</strong> &mdash; you may request information about the
                categories and specific pieces of personal data we have collected about you.
              </li>
              <li>
                <strong>Right to Delete</strong> &mdash; you may request that we delete your
                personal information.
              </li>
              <li>
                <strong>Right to Opt-Out</strong> &mdash; we do not sell your personal information,
                so no opt-out is necessary.
              </li>
            </ul>
          </section>

          {/* 12. European Residents (GDPR) */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">
              12. European Residents (GDPR)
            </h2>
            <p className="text-gray-600 leading-relaxed">
              If you are a resident of the European Economic Area (EEA), you have the following
              rights under the General Data Protection Regulation (GDPR):
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-3">
              <li>
                <strong>Right of Access</strong> &mdash; request a copy of your personal data.
              </li>
              <li>
                <strong>Right to Rectification</strong> &mdash; request correction of inaccurate
                data.
              </li>
              <li>
                <strong>Right to Erasure</strong> &mdash; request deletion of your personal data.
              </li>
              <li>
                <strong>Right to Data Portability</strong> &mdash; receive your data in a
                structured, machine-readable format.
              </li>
              <li>
                <strong>Right to Object</strong> &mdash; object to the processing of your personal
                data.
              </li>
            </ul>
          </section>

          {/* 13. Changes */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">13. Changes to This Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update this Privacy Policy from time to time. Changes will be reflected by
              the updated "Last updated" date at the top of this page. Your continued use of the
              Service after any changes constitutes your acceptance of the revised policy. We
              encourage you to review this policy periodically.
            </p>
          </section>

          {/* 14. Contact */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">14. Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have any questions or concerns about this Privacy Policy, please contact us
              at{' '}
              <a
                href="mailto:support@projexlight.com"
                className="text-emerald-600 hover:text-emerald-700 underline"
              >
                support@projexlight.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
