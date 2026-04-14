import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-xl font-bold text-indigo-600">DealEval</span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium text-sm">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 font-medium text-sm">How It Works</a>
              <Link to="/pricing" className="text-gray-600 hover:text-gray-900 font-medium text-sm">Pricing</Link>
              <Link to="/faq" className="text-gray-600 hover:text-gray-900 font-medium text-sm">FAQ</Link>
              <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium text-sm">Sign In</Link>
              <Link to="/register" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm">Get Started Free</Link>
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
            Calculate Cap Rate, IRR, Cash-on-Cash, DSCR, GRM, cash flow, and 10-year projections instantly.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all"
            >
              Get Started Free
            </Link>
            <Link
              to="/search"
              className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-all"
            >
              Search Properties
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-400">No credit card required. 1 free report included.</p>
        </div>
      </section>

      {/* Key Stats */}
      <section className="bg-white border-y border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-indigo-600">8+</p>
              <p className="text-sm text-gray-500 mt-1">Financial Metrics</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-indigo-600">10 Year</p>
              <p className="text-sm text-gray-500 mt-1">Projections & Forecasting</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-indigo-600">7</p>
              <p className="text-sm text-gray-500 mt-1">Listing Sites Supported</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-indigo-600">Instant</p>
              <p className="text-sm text-gray-500 mt-1">PDF Report Generation</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Everything You Need to Close Smarter Deals</h2>
            <p className="mt-4 text-lg text-gray-500">Professional financial metrics at your fingertips</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard icon="&#128200;" title="Cap Rate & Cash-on-Cash" description="Instantly calculate capitalization rates, cash-on-cash return, and ROI for any residential or commercial property." />
            <FeatureCard icon="&#128202;" title="IRR & DSCR Analysis" description="Internal rate of return and debt service coverage ratio calculations with customizable parameters." />
            <FeatureCard icon="&#128176;" title="Cash Flow Projections" description="Detailed monthly and annual cash flow analysis including mortgage, expenses, vacancy, and management fees." />
            <FeatureCard icon="&#128197;" title="10-Year Forecast" description="Generate comprehensive 10-year financial projections with property appreciation, rent growth, and equity buildup." />
            <FeatureCard icon="&#128196;" title="PDF Reports" description="Export professional investment analysis reports with charts, metrics, and recommendations. Share with clients and partners." />
            <FeatureCard icon="&#8596;" title="Property Comparison" description="Compare multiple properties side-by-side across all financial metrics. Identify the best deal at a glance." />
            <FeatureCard icon="&#127968;" title="Multi-Site Search" description="Search properties across Zillow, Realtor.com, Redfin, LoopNet, Crexi, and more from one dashboard." />
            <FeatureCard icon="&#9889;" title="Chrome Extension" description="Auto-extract property data from listing sites with our Chrome extension. No manual data entry required." />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-4 text-lg text-gray-500">Get from listing to analysis in 3 simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-indigo-600">1</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Install the Chrome Extension</h3>
              <p className="text-gray-500">
                Install the free DealEval Chrome extension to automatically extract property data from Zillow, Realtor.com, LoopNet, Crexi, and other listing sites. No manual data entry needed.
              </p>
              <p className="mt-3 text-xs text-gray-400">Or enter property details manually if you prefer.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-indigo-600">2</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Search & Evaluate Properties</h3>
              <p className="text-gray-500">
                Search across 7 listing sites simultaneously. Click "Evaluate" on any property to instantly calculate Cap Rate, IRR, Cash-on-Cash, DSCR, GRM, and monthly cash flow.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-indigo-600">3</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Compare & Generate Reports</h3>
              <p className="text-gray-500">
                Compare multiple properties side-by-side with visual charts and recommendations. Export professional PDF reports to share with clients, partners, or lenders.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Chrome Extension CTA */}
      <section className="bg-gradient-to-r from-emerald-600 to-emerald-500 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-white">
              <h2 className="text-3xl font-bold">Get the Chrome Extension</h2>
              <p className="mt-3 text-emerald-100 text-lg max-w-xl">
                The DealEval extension auto-extracts property data from listing sites so you can evaluate deals instantly without typing a single number.
              </p>
              <ul className="mt-4 space-y-2 text-emerald-50 text-sm">
                <li className="flex items-center gap-2"><span>&#10003;</span> Zillow, Realtor.com, Redfin (Residential)</li>
                <li className="flex items-center gap-2"><span>&#10003;</span> LoopNet, Crexi (Commercial)</li>
                <li className="flex items-center gap-2"><span>&#10003;</span> Trulia, CommercialCafe</li>
                <li className="flex items-center gap-2"><span>&#10003;</span> One-click data extraction</li>
              </ul>
            </div>
            <div className="flex flex-col items-center gap-3">
              <a
                href="https://chromewebstore.google.com/detail/iefdcpemagecgjkabcpibhpbgabnfdgl"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white text-emerald-700 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 shadow-lg transition-all"
              >
                Install Free Extension
              </a>
              <p className="text-emerald-200 text-xs">Free forever. No account required to install.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Built for Real Estate Professionals</h2>
            <p className="mt-4 text-lg text-gray-500">Whether you're buying, selling, lending, or advising</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <RoleCard
              icon="&#128188;"
              title="Investors"
              description="Evaluate deals in seconds with Cap Rate, IRR, and cash flow analysis. Compare properties across markets to find the best returns."
            />
            <RoleCard
              icon="&#128101;"
              title="Agents"
              description="Impress clients with professional PDF investment reports. Demonstrate property value with institutional-grade financial metrics."
            />
            <RoleCard
              icon="&#127974;"
              title="Lenders"
              description="Assess deal viability with DSCR, LTV, and cash flow analysis. Make faster lending decisions with comprehensive property data."
            />
            <RoleCard
              icon="&#128200;"
              title="Brokers"
              description="Compare properties across cities and states. Generate comparison reports that highlight the best opportunities for your clients."
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-indigo-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to Evaluate Your Next Deal?</h2>
          <p className="mt-4 text-lg text-indigo-100">
            Start analyzing properties with institutional-grade metrics today. Your first report is free.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="bg-white text-indigo-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 shadow-lg transition-all"
            >
              Get Started Free
            </Link>
            <Link
              to="/pricing"
              className="border border-white/30 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-white/10 transition-all"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <span className="text-lg font-bold text-white">DealEval</span>
              <p className="mt-2 text-gray-400 text-sm">Institutional-grade real estate investment analysis for professionals.</p>
              <p className="mt-3 text-gray-500 text-xs">
                <a href="mailto:support@projexlight.com" className="hover:text-gray-300">support@projexlight.com</a>
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link to="/search" className="text-gray-400 hover:text-white text-sm">Search Properties</Link></li>
                <li><Link to="/register" className="text-gray-400 hover:text-white text-sm">New Analysis</Link></li>
                <li><Link to="/register" className="text-gray-400 hover:text-white text-sm">Compare Properties</Link></li>
                <li><Link to="/pricing" className="text-gray-400 hover:text-white text-sm">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-gray-400 hover:text-white text-sm">About</Link></li>
                <li><Link to="/faq" className="text-gray-400 hover:text-white text-sm">FAQ</Link></li>
                <li><Link to="/contact" className="text-gray-400 hover:text-white text-sm">Contact</Link></li>
                <li><a href="https://chromewebstore.google.com/detail/iefdcpemagecgjkabcpibhpbgabnfdgl" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-sm">Chrome Extension</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link to="/terms" className="text-gray-400 hover:text-white text-sm">Terms of Service</Link></li>
                <li><Link to="/privacy" className="text-gray-400 hover:text-white text-sm">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-500 text-sm">
              <p>&copy; {new Date().getFullYear()} DealEval. All rights reserved.</p>
              <p className="mt-1">
                Powered by{' '}
                <a href="https://projexlight.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                  ProjexLight
                </a>
              </p>
            </div>
            <div className="flex gap-6 mt-4 md:mt-0">
              <Link to="/terms" className="text-gray-500 hover:text-gray-300 text-sm">Terms</Link>
              <Link to="/privacy" className="text-gray-500 hover:text-gray-300 text-sm">Privacy</Link>
              <Link to="/contact" className="text-gray-500 hover:text-gray-300 text-sm">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 hover:shadow-lg transition-shadow">
      <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center mb-4">
        <span className="text-2xl" dangerouslySetInnerHTML={{ __html: icon }} />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm">{description}</p>
    </div>
  );
}

function RoleCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 text-center hover:shadow-lg transition-shadow">
      <span className="text-4xl" dangerouslySetInnerHTML={{ __html: icon }} />
      <h3 className="text-lg font-bold text-gray-900 mt-4 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm">{description}</p>
    </div>
  );
}
