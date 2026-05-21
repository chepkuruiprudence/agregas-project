import { FEATURES } from '../utils/constants';

export const Features = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container-custom">
        <h2 className="text-4xl font-bold text-center mb-4">Why Choose AGREGAS?</h2>
        <p className="text-center text-gray-600 mb-16 max-w-2xl mx-auto">
          Experience the best gas delivery service with cutting-edge technology and reliable service
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {FEATURES.map((feature, index) => (
            <div
              key={index}
              className="p-8 border border-gray-200 rounded-lg hover:shadow-lg hover:border-primary-500 transition group"
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-2 text-primary-900">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};