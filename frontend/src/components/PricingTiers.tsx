import { Link } from 'react-router-dom';
import { PRICING_TIERS } from '../utils/constants';
import { Check } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export const PricingTiers = () => {
  const { isAuthenticated } = useAuth();

  return (
    <section className="py-20 bg-gray-50">
      <div className="container-custom">
        <h2 className="text-4xl font-bold text-center mb-4">Subscription Plans</h2>
        <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto">
          Choose the plan that works best for you
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {Object.entries(PRICING_TIERS).map(([key, tier]: any) => (
            <div
              key={key}
              className={`rounded-lg p-8 transition transform hover:scale-105 ${
                tier.recommended
                  ? 'bg-white shadow-2xl border-2 border-primary-500 relative -mt-4'
                  : 'bg-white shadow-lg border border-gray-200'
              }`}
            >
              {tier.recommended && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                  RECOMMENDED
                </div>
              )}

              <h3 className="text-2xl font-bold mb-2 text-primary-900">{tier.name}</h3>
              <div className="mb-2">
                <span className="text-4xl font-bold text-primary-500">{tier.depositAmount}</span>
                <span className="text-gray-600"> KES deposit</span>
              </div>
              <p className="text-gray-600 mb-6">{tier.monthlyCredit} KES monthly credit</p>

              <Link
                to={isAuthenticated ? '/subscribe' : '/register'}
                className={`w-full py-3 rounded-lg font-semibold mb-6 text-center transition ${
                  tier.recommended
                    ? 'bg-primary-500 text-white hover:bg-primary-600'
                    : 'bg-gray-100 text-primary-900 hover:bg-gray-200'
                }`}
              >
                Choose Plan
              </Link>

              <div className="space-y-3">
                {tier.features.map((feature: string, idx: number) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <Check size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};