// 📁 src/components/Features.tsx

import { FEATURES } from '../utils/constants';
import { getIcon } from '../utils/iconMap';

export const Features = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container-custom">
        <h2 className="text-4xl font-bold text-center mb-4">Why Choose AGREGAS?</h2>
        <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto">
          Experience the best gas delivery service with cutting-edge technology and reliable service
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {FEATURES.map((feature, index) => {
            // Get the icon component from string
            const IconComponent = getIcon(feature.icon);

            return (
              <div
                key={index}
                className="p-8 bg-white border border-gray-200 rounded-lg hover:shadow-lg hover:border-gray-300 transition-all duration-300 group"
              >
                {/* Icon - properly rendered as component */}
                <div className="mb-6 inline-flex p-3 bg-gray-50 rounded-lg group-hover:bg-primary-50 transition-colors">
                  <IconComponent 
                    size={32} 
                    className="text-primary-600 group-hover:scale-110 transition-transform duration-300"
                  />
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold mb-3 text-gray-900">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 leading-relaxed text-sm">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};