import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const TIER_ORDER = ['free', 'starter', 'growth', 'premium'];

const PLANS = [
  {
    tier: 'free',
    name: 'Free',
    price: 0,
    credits: 1,
    period: 'lifetime',
    features: ['1 property report (lifetime)', 'Full financial analysis', '10-year projections', 'Basic scenario comparison'],
  },
  {
    tier: 'starter',
    name: 'Starter',
    price: 25,
    credits: 10,
    period: '/month',
    features: ['10 property credits/month', 'Single & comparison reports', 'PDF export with branding', 'Share comparison links', 'Email support'],
  },
  {
    tier: 'growth',
    name: 'Growth',
    price: 75,
    credits: 50,
    period: '/month',
    features: ['50 property credits/month', 'Everything in Starter', 'Cross-market comparison', 'Executive summary reports', 'Priority support'],
    popular: true,
  },
  {
    tier: 'premium',
    name: 'Premium',
    price: 100,
    credits: 100,
    period: '/month',
    features: ['100 property credits/month', 'Everything in Growth', 'Bulk comparison sets', 'Custom report branding', 'Dedicated support'],
  },
];

export default function PricingPage() {
  const { isAuthenticated, user } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState<string | null>(null);

  const isSuccess = searchParams.get('session_id') !== null;
  const isCancelled = window.location.pathname.includes('/cancelled');

  const currentTier = user?.subscription_tier || 'free';
  const currentIdx = TIER_ORDER.indexOf(currentTier);

  const handleSubscribe = async (tier: string) => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }

    const targetIdx = TIER_ORDER.indexOf(tier);

    // Downgrade — use Stripe Customer Portal instead of Checkout
    if (targetIdx < currentIdx && currentTier !== 'free') {
      setShowDowngradeConfirm(tier);
      return;
    }

    // Upgrade or new subscription — use Checkout
    setLoading(tier);
    try {
      const res = await api.post('/subscriptions/create-checkout', { tier });
      window.location.href = res.data.data.url;
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to start checkout');
    } finally {
      setLoading(null);
    }
  };

  const handleDowngradeViaPortal = async () => {
    setShowDowngradeConfirm(null);
    setLoading('portal');
    try {
      const res = await api.post('/subscriptions/create-portal');
      window.location.href = res.data.data.url;
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to open subscription management');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      <div className="max-w-6xl mx-auto">
        {/* Success Banner */}
        {isSuccess && (
          <div className="mb-8 px-6 py-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
            <p className="text-lg font-bold text-emerald-800">Subscription activated!</p>
            <p className="text-sm text-emerald-600 mt-1">Your plan is now active. Credits are available immediately.</p>
          </div>
        )}

        {/* Cancelled Banner */}
        {isCancelled && (
          <div className="mb-8 px-6 py-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <p className="text-lg font-bold text-amber-800">Checkout cancelled</p>
            <p className="text-sm text-amber-600 mt-1">No charges were made. You can try again anytime.</p>
          </div>
        )}

        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">Choose Your Plan</h1>
          <p className="mt-2 text-gray-500">Each property counts as 1 credit — single report or part of a comparison</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map(plan => {
            const isCurrent = currentTier === plan.tier;
            const planIdx = TIER_ORDER.indexOf(plan.tier);
            const isUpgrade = !isCurrent && planIdx > currentIdx && plan.tier !== 'free';
            const isDowngrade = !isCurrent && planIdx < currentIdx && plan.tier !== 'free';

            return (
              <div
                key={plan.tier}
                className={`relative bg-white rounded-xl shadow-sm border-2 p-6 flex flex-col ${
                  plan.popular ? 'border-emerald-500 shadow-emerald-100' : isCurrent ? 'border-emerald-300 bg-emerald-50/30' : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-500 text-sm">{plan.period}</span>
                  </div>
                  <p className="text-sm text-emerald-600 font-medium mt-1">
                    {plan.credits} property credit{plan.credits > 1 ? 's' : ''}{plan.period === '/month' ? '/month' : ' (lifetime)'}
                  </p>
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feat}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <button disabled className="w-full py-2.5 rounded-lg text-sm font-semibold bg-emerald-100 text-emerald-700 cursor-default">
                    Current Plan
                  </button>
                ) : isUpgrade ? (
                  <button
                    onClick={() => handleSubscribe(plan.tier)}
                    disabled={loading === plan.tier}
                    className={`w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
                      plan.popular ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-800 hover:bg-gray-900'
                    }`}
                  >
                    {loading === plan.tier ? 'Redirecting...' : 'Upgrade'}
                  </button>
                ) : isDowngrade ? (
                  <button
                    onClick={() => handleSubscribe(plan.tier)}
                    disabled={loading === plan.tier || loading === 'portal'}
                    className="w-full py-2.5 rounded-lg text-sm font-semibold text-gray-600 border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Downgrade
                  </button>
                ) : plan.tier === 'free' && currentTier !== 'free' ? (
                  <button
                    onClick={handleDowngradeViaPortal}
                    disabled={loading === 'portal'}
                    className="w-full py-2.5 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    Cancel Subscription
                  </button>
                ) : (
                  <div className="w-full py-2.5 rounded-lg text-sm font-medium text-center text-gray-400">
                    Free forever
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            A 3-property comparison uses 3 credits. Credits reset monthly on your billing date.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Upgrades are prorated. Downgrades take effect at the end of the current billing period.
          </p>
        </div>
      </div>

      {/* Downgrade Confirmation Modal */}
      {showDowngradeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDowngradeConfirm(null)}>
          <div className="bg-white rounded-xl shadow-xl max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Downgrade Plan?</h3>
            <p className="text-sm text-gray-600 mb-1">
              You'll be redirected to manage your subscription. The downgrade takes effect at the end of your current billing period.
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Your remaining credits will stay available until then.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDowngradeConfirm(null)}
                className="flex-1 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Keep Current Plan
              </button>
              <button
                onClick={handleDowngradeViaPortal}
                className="flex-1 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Manage Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
