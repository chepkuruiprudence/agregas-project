import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ArrowRight } from 'lucide-react';

export const Hero = () => {
  const { isAuthenticated } = useAuth();

  return (
    <section className="min-h-screen bg-gradient-blue-navy flex items-center py-20">
      <div className="container-custom grid md:grid-cols-2 gap-12 items-center">
        {/* Left Side - Content */}
        <div className="text-white animate-slideInLeft">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Cooking Gas.
            <br />
            <span className="text-accent-light">Delivered to You.</span>
          </h1>
          <p className="text-lg text-gray-100 mb-8 leading-relaxed">
            Order LPG gas online with dynamic pricing, loyalty rewards, and same-day delivery.
            Join thousands of happy customers in Kenya.
          </p>

          <div className="flex gap-4">
            <Link
              to={isAuthenticated ? '/orders' : '/register-type'}
              className="bg-white text-primary-900 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center gap-2 group"
            >
              {isAuthenticated ? 'Place Order' : 'Get Started'}
              <ArrowRight size={20} className="group-hover:translate-x-1 transition" />
            </Link>
            {!isAuthenticated && (
              <Link
                to="/login"
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-primary-900 transition"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Trust Badges */}
          <div className="mt-12 flex gap-6 text-sm">
            <div>
              <div className="font-bold text-2xl">10K+</div>
              <div className="text-gray-300">Happy Customers</div>
            </div>
            <div>
              <div className="font-bold text-2xl">2-4h</div>
              <div className="text-gray-300">Delivery Time</div>
            </div>
            <div>
              <div className="font-bold text-2xl">50+</div>
              <div className="text-gray-300">Retailers</div>
            </div>
          </div>
        </div>

        {/* Right Side - Visual */}
        <div className="hidden md:flex justify-center">
          <div className="w-80 h-80 bg-gradient-violet-teal rounded-full blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute text-center text-white text-6xl">
            🔥
          </div>
        </div>
      </div>
    </section>
  );
};