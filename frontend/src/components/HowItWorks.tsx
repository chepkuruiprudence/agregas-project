import { HOW_IT_WORKS } from '../utils/constants';
import { ArrowRight } from 'lucide-react';

export const HowItWorks = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container-custom">
        <h2 className="text-4xl font-bold text-center mb-4">How It Works</h2>
        <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto">
          Get gas delivered in 4 simple steps
        </p>

        <div className="grid md:grid-cols-4 gap-4">
          {HOW_IT_WORKS.map((item, index) => (
            <div key={index} className="relative">
              {/* Card */}
              <div className="bg-gradient-blue-navy text-white rounded-lg p-8 text-center h-full flex flex-col justify-center">
                <div className="text-5xl font-bold mb-4 opacity-50">{item.step}</div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-200 text-sm">{item.description}</p>
              </div>

              {/* Arrow */}
              {index < HOW_IT_WORKS.length - 1 && (
                <div className="hidden md:flex absolute -right-6 top-1/2 transform -translate-y-1/2 z-10">
                  <ArrowRight className="text-primary-500" size={32} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};