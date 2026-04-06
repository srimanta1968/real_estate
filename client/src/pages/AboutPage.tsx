import { Link } from 'react-router-dom';

const STATS = [
  { label: '8+ Financial Metrics', description: 'Cap Rate, IRR, DSCR, and more' },
  { label: '10-Year Projections', description: 'Equity growth and cash flow forecasts' },
  { label: '7 Listing Sites Supported', description: 'Zillow, Realtor, LoopNet, and more' },
  { label: 'Instant PDF Reports', description: 'Client-ready in one click' },
];

const AUDIENCES = [
  {
    title: 'Investors',
    description: 'Evaluate deals quickly with institutional-grade metrics. Know your Cap Rate, IRR, and Cash-on-Cash before making an offer.',
    icon: (
      <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Agents',
    description: 'Impress clients with professional PDF reports that showcase financial analysis alongside property details.',
    icon: (
      <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: 'Lenders',
    description: 'Assess deal viability with DSCR, loan-to-value ratios, and detailed income/expense breakdowns.',
    icon: (
      <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    title: 'Brokers',
    description: 'Compare properties across markets with side-by-side analysis and cross-market context banners.',
    icon: (
      <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl font-bold text-emerald-600">DealEval</Link>
            <div className="flex items-center gap-4">
              <Link to="/about" className="text-gray-600 hover:text-gray-900 font-medium">About</Link>
              <Link to="/pricing" className="text-gray-600 hover:text-gray-900 font-medium">Pricing</Link>
              <Link to="/contact" className="text-gray-600 hover:text-gray-900 font-medium">Contact</Link>
              <Link to="/faq" className="text-gray-600 hover:text-gray-900 font-medium">FAQ</Link>
              <Link to="/register" className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 font-medium">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight">About DealEval</h1>
          <p className="mt-6 text-xl text-gray-500 max-w-3xl mx-auto leading-relaxed">
            We built DealEval to be the fastest and most trusted deal evaluation tool for real estate
            professionals. Our platform enables agents, investors, lenders, and brokers to evaluate,
            compare, and present real estate deals instantly using institutional-grade financial metrics.
          </p>
        </div>
      </section>

      {/* What We Do */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">What We Do</h2>
            <p className="mt-4 text-lg text-gray-500">
              Comprehensive real estate investment analysis at your fingertips
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-emerald-50 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Calculate Key Metrics</h3>
              <p className="text-gray-600 text-sm">
                ROI, IRR, Cap Rate, Cash Flow, Cash-on-Cash, DSCR, Equity Multiple, GRM, and 10-year projections.
              </p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate PDF Reports</h3>
              <p className="text-gray-600 text-sm">
                Client-ready PDF reports with financial overviews, charts, and scenario comparisons.
              </p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Compare Properties</h3>
              <p className="text-gray-600 text-sm">
                Side-by-side property comparisons across markets with location context banners.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Stats */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
                <p className="text-2xl font-bold text-emerald-600">{stat.label}</p>
                <p className="mt-1 text-sm text-gray-500">{stat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Who It's For</h2>
            <p className="mt-4 text-lg text-gray-500">
              Built for every real estate professional
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {AUDIENCES.map((audience) => (
              <div key={audience.title} className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="mb-4">{audience.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{audience.title}</h3>
                <p className="text-gray-600 text-sm">{audience.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900">Ready to evaluate your first deal?</h2>
          <p className="mt-4 text-lg text-gray-500">
            Start analyzing properties with institutional-grade financial metrics today.
          </p>
          <Link
            to="/property/new"
            className="mt-8 inline-block bg-emerald-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all"
          >
            Analyze Your First Property
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
          &copy; {new Date().getFullYear()} DealEval. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
