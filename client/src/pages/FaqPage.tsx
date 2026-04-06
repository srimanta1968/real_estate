import { useState } from 'react';
import { Link } from 'react-router-dom';

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqSection {
  title: string;
  items: FaqItem[];
}

const FAQ_DATA: FaqSection[] = [
  {
    title: 'General',
    items: [
      {
        question: 'What is DealEval?',
        answer:
          'DealEval is a real estate investment analysis platform that calculates key financial metrics like Cap Rate, Cash-on-Cash Return, IRR, DSCR, and more. It helps investors, agents, and brokers evaluate deals in seconds.',
      },
      {
        question: 'Do I need a real estate license to use DealEval?',
        answer: 'No. DealEval is designed for anyone interested in real estate investment analysis.',
      },
      {
        question: 'Is DealEval financial advice?',
        answer:
          'No. DealEval provides calculations for informational purposes only. Always consult a qualified financial advisor before making investment decisions.',
      },
    ],
  },
  {
    title: 'Chrome Extension',
    items: [
      {
        question: 'What does the Chrome extension do?',
        answer:
          "It automatically extracts property data (price, beds, baths, sqft) from listing sites like Zillow, Realtor.com, LoopNet, and Crexi, so you don't have to type it manually.",
      },
      {
        question: 'Which sites does the extension support?',
        answer: 'Zillow, Realtor.com, Redfin, LoopNet, Crexi, Trulia, and CommercialCafe.',
      },
      {
        question: 'Is my data safe with the extension?',
        answer:
          "Yes. Data stays in your browser until you choose to send it to DealEval. We don't track your browsing or sell your data.",
      },
    ],
  },
  {
    title: 'Pricing & Billing',
    items: [
      {
        question: 'How do property credits work?',
        answer:
          'Each property in a report uses 1 credit. A single property analysis = 1 credit. A comparison of 3 properties = 3 credits. Credits reset monthly on your billing date.',
      },
      {
        question: 'Can I upgrade or downgrade my plan?',
        answer:
          'Yes, anytime. Upgrades are prorated. Downgrades take effect at the end of your billing period.',
      },
      {
        question: 'What payment methods do you accept?',
        answer:
          'We accept all major credit cards via Stripe. Your payment info is never stored on our servers.',
      },
      {
        question: 'Can I cancel anytime?',
        answer:
          "Yes. Cancel through Settings > Subscription. You'll keep access until the end of your billing period.",
      },
    ],
  },
  {
    title: 'Reports',
    items: [
      {
        question: "What's included in a PDF report?",
        answer:
          'Financial overview, key metrics (Cap Rate, CoC, DSCR, GRM), income/expense breakdown, 10-year projections with equity growth chart, and scenario comparison.',
      },
      {
        question: 'Can I compare properties from different cities?',
        answer:
          'Yes! DealEval supports cross-market comparison with location context banners.',
      },
    ],
  },
];

export default function FaqPage() {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const toggleFaq = (key: string) => {
    setExpandedKey(expandedKey === key ? null : key);
  };

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

      {/* Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Frequently Asked Questions</h1>
        <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
          Everything you need to know about DealEval. Can't find what you're looking for?{' '}
          <Link to="/contact" className="text-emerald-600 hover:text-emerald-700 underline font-medium">
            Contact us
          </Link>
          .
        </p>
      </section>

      {/* FAQ Sections */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="space-y-10">
          {FAQ_DATA.map((section) => (
            <div key={section.title}>
              <h2 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">
                {section.title}
              </h2>
              <div className="space-y-2">
                {section.items.map((item) => {
                  const key = `${section.title}-${item.question}`;
                  const isOpen = expandedKey === key;
                  return (
                    <div
                      key={key}
                      className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden"
                    >
                      <button
                        onClick={() => toggleFaq(key)}
                        className="w-full flex justify-between items-center px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-medium text-gray-900 pr-4">{item.question}</span>
                        <svg
                          className={`w-5 h-5 text-emerald-600 flex-shrink-0 transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-4 text-gray-600 leading-relaxed">
                          {item.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
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
