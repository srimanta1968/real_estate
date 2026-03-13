import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-indigo-600">DealEval</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight">
            Evaluate Real Estate Deals
            <span className="block text-indigo-600 mt-2">In Seconds, Not Hours</span>
          </h1>
          <p className="mt-6 text-xl text-gray-500 max-w-3xl mx-auto">
            Institutional-grade financial analysis for agents, investors, lenders, and brokers.
            Calculate ROI, IRR, cap rates, cash flow, and 10-year projections instantly.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              to="/property/new"
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all"
            >
              Analyze a Property
            </Link>
            <a
              href="#features"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-all"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">
              Everything You Need to Close Smarter Deals
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Professional financial metrics at your fingertips
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              title="Cap Rate & ROI"
              description="Instantly calculate capitalization rates and return on investment for any property."
              icon="chart-bar"
            />
            <FeatureCard
              title="IRR Analysis"
              description="Internal rate of return calculations with customizable holding periods and exit strategies."
              icon="trending-up"
            />
            <FeatureCard
              title="Cash Flow Projections"
              description="Detailed monthly and annual cash flow analysis including all income and expenses."
              icon="currency"
            />
            <FeatureCard
              title="10-Year Forecast"
              description="Generate comprehensive 10-year financial projections with interactive charts and comparisons."
              icon="calendar"
            />
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-indigo-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to Evaluate Your Next Deal?
          </h2>
          <p className="mt-4 text-lg text-indigo-100">
            Start analyzing properties with institutional-grade metrics today.
          </p>
          <Link
            to="/property/new"
            className="mt-8 inline-block bg-white text-indigo-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 shadow-lg transition-all"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400">
              <span className="text-lg font-bold text-white">DealEval</span>
              <p className="mt-2">Real Estate Deal Evaluator</p>
            </div>
            <div className="mt-4 md:mt-0 text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} DealEval. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string; icon: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
        <div className="w-6 h-6 bg-indigo-600 rounded" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500">{description}</p>
    </div>
  );
}
