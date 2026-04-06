import { Link } from 'react-router-dom';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-emerald-600 hover:text-emerald-700 mb-8"
        >
          &larr; Back to Home
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-gray-500 mb-10">Last updated: April 5, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8">
          {/* 1. Agreement to Terms */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">1. Agreement to Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              By accessing or using DealEval ("the Service"), you agree to be bound by these Terms
              of Service. If you do not agree to these terms, you may not access or use the Service.
              These terms constitute a legally binding agreement between you and DealEval.
            </p>
          </section>

          {/* 2. Description of Service */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">2. Description of Service</h2>
            <p className="text-gray-600 leading-relaxed">
              DealEval is a real estate investment analysis platform designed to help investors
              evaluate properties and make informed decisions. The Service provides tools for
              calculating Cap Rate, Internal Rate of Return (IRR), Cash-on-Cash Return, Debt
              Service Coverage Ratio (DSCR), Gross Rent Multiplier (GRM), multi-year cash flow
              projections, and generating comprehensive PDF reports. DealEval also offers a Chrome
              extension that extracts publicly available property listing data from supported
              real estate websites.
            </p>
          </section>

          {/* 3. Account Registration */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">3. Account Registration</h2>
            <p className="text-gray-600 leading-relaxed">
              To use certain features of the Service, you must register for an account. You agree
              to provide accurate, current, and complete information during registration and to
              update such information to keep it accurate. You are responsible for safeguarding
              your account credentials and for all activities that occur under your account. You
              must notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          {/* 4. Subscription Plans & Billing */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">4. Subscription Plans & Billing</h2>
            <p className="text-gray-600 leading-relaxed">
              DealEval offers the following subscription plans:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-3">
              <li>
                <strong>Free</strong> &mdash; 1 lifetime report credit. No payment required.
              </li>
              <li>
                <strong>Starter ($25/month)</strong> &mdash; 10 report credits per month.
              </li>
              <li>
                <strong>Growth ($75/month)</strong> &mdash; 50 report credits per month.
              </li>
              <li>
                <strong>Premium ($100/month)</strong> &mdash; 100 report credits per month.
              </li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              Each property evaluation consumes 1 credit. A comparison of 3 properties consumes
              3 credits (1 per property). All paid subscriptions are billed monthly via Stripe
              and automatically renew at the end of each billing cycle. You may cancel your
              subscription at any time through the subscription management page. Cancellation
              takes effect at the end of the current billing period.
            </p>
          </section>

          {/* 5. Property Data & Third-Party Sites */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">
              5. Property Data & Third-Party Sites
            </h2>
            <p className="text-gray-600 leading-relaxed">
              The DealEval Chrome extension extracts publicly available property listing data from
              supported real estate websites, including Zillow, Realtor.com, Redfin, LoopNet, and
              Crexi. All data extracted is publicly accessible information displayed on these
              websites. DealEval is not affiliated with, endorsed by, or sponsored by any of these
              third-party platforms. Use of data from these sites is subject to their respective
              terms of service.
            </p>
          </section>

          {/* 6. Disclaimer */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">6. Disclaimer</h2>
            <p className="text-gray-600 leading-relaxed">
              DealEval provides financial calculations, projections, and analysis tools for
              informational purposes only. Nothing provided by the Service constitutes financial,
              investment, legal, or tax advice. Users should consult qualified professionals before
              making any investment decisions. DealEval makes no guarantee regarding the accuracy,
              completeness, or reliability of any calculations, projections, or data provided
              through the Service. All investment decisions are made at your own risk.
            </p>
          </section>

          {/* 7. Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">7. Intellectual Property</h2>
            <p className="text-gray-600 leading-relaxed">
              The DealEval brand, logo, reports, analysis tools, software, and all associated
              intellectual property are owned by DealEval. You may not reproduce, distribute,
              modify, or create derivative works of our proprietary materials without prior written
              consent. You retain ownership of the data you input into the Service, and we retain
              ownership of the analysis tools and report formats used to process that data.
            </p>
          </section>

          {/* 8. Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">8. Limitation of Liability</h2>
            <p className="text-gray-600 leading-relaxed">
              To the maximum extent permitted by applicable law, DealEval and its officers,
              directors, employees, and agents shall not be liable for any indirect, incidental,
              special, consequential, or punitive damages, including but not limited to loss of
              profits, data, or other intangible losses, resulting from your use of or inability
              to use the Service. In no event shall DealEval's total liability exceed the amount
              you have paid to DealEval in the twelve (12) months preceding the claim.
            </p>
          </section>

          {/* 9. Termination */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">9. Termination</h2>
            <p className="text-gray-600 leading-relaxed">
              We reserve the right to suspend or terminate your account and access to the Service
              at our sole discretion, without prior notice, for conduct that we determine violates
              these Terms of Service, is harmful to other users, or is otherwise objectionable.
              Upon termination, your right to use the Service will immediately cease.
            </p>
          </section>

          {/* 10. Governing Law */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">10. Governing Law</h2>
            <p className="text-gray-600 leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the
              State of California, USA, without regard to its conflict of law provisions. Any
              disputes arising under these Terms shall be resolved in the state or federal courts
              located in California.
            </p>
          </section>

          {/* 11. Changes to Terms */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">11. Changes to Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              We reserve the right to modify these Terms of Service at any time. Changes will be
              effective upon posting the updated terms with a revised "Last updated" date. Your
              continued use of the Service after any changes constitutes your acceptance of the
              new terms. We encourage you to review these terms periodically.
            </p>
          </section>

          {/* 12. Contact */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">12. Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at{' '}
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
