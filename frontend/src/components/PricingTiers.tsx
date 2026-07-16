// 📁 src/components/PricingTiers.tsx

import { Link } from 'react-router-dom';
import { PRICING_TIERS } from '../utils/constants';
import { Check } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getIcon } from '../utils/iconMap';

interface PricingCardProps {
  tier: typeof PRICING_TIERS.basic;
}

export const PricingTiers: React.FC<PricingCardProps> = ({ tier }) => {
  const { isAuthenticated } = useAuth();

  return (
    <section className="py-20 bg-gray-50">
      <div className="container-custom">
        <h2 className="text-4xl font-bold text-center mb-4">Subscription Plans</h2>
        <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto">
          Choose the plan that works best for you
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {Object.entries(PRICING_TIERS).map(([key, tier]: any) => {
            // Get the icon component from string
            const IconComponent = getIcon(tier.icon);

            return (
              <div
                key={key}
                className={`relative rounded-lg overflow-hidden transition-all duration-300 flex flex-col h-full ${
                  tier.recommended
                    ? 'bg-white shadow-xl border-2 border-primary-500 md:scale-105'
                    : 'bg-white shadow-lg border border-gray-200 hover:shadow-lg hover:border-gray-300'
                }`}
              >
                {/* Recommended Badge */}
                {tier.recommended && (
                  <div className="bg-primary-500 text-white text-center py-2 text-xs font-bold tracking-wider">
                    RECOMMENDED
                  </div>
                )}

                {/* Card Content */}
                <div className="flex-1 p-8 flex flex-col">
                  {/* Icon */}
                  <div className="mb-6 inline-flex p-3 bg-gray-100 rounded-lg w-fit">
                    <IconComponent 
                      size={28} 
                      className="text-primary-600"
                    />
                  </div>

                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold mb-6 text-gray-900">
                    {tier.name}
                  </h3>

                  {/* Price Section */}
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <div className="mb-2">
                      <span className="text-5xl font-bold text-primary-600">
                        {tier.depositAmount}
                      </span>
                      <span className="text-gray-600 text-sm ml-1">KES</span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">Initial deposit</p>
                    <p className="text-gray-700 font-semibold text-sm">
                      {tier.monthlyCredit} KES monthly credit
                    </p>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 mb-8 flex-1">
                    {tier.features.map((feature: string, idx: number) => (
                      <div key={idx} className="flex gap-3 items-start">
                        <Check 
                          size={18} 
                          className="text-green-500 flex-shrink-0 mt-1"
                        />
                        <span className="text-gray-700 text-sm">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Button - Always at bottom */}
                <div className="p-8 pt-0">
                  <Link
                    to={isAuthenticated ? '/subscribe' : '/register'}
                    className={`w-full py-3 rounded-lg font-semibold text-center transition-all duration-300 block ${
                      tier.recommended
                        ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow-md'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300'
                    }`}
                  >
                    Choose Plan
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};