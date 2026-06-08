import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ShoppingCart, Store, TrendingUp } from 'lucide-react';

export const RegisterType = () => {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'customer',
      title: 'I\'m a Customer',
      icon: ShoppingCart,
      description: 'Order LPG gas, track delivery, earn loyalty rewards',
      color: 'bg-blue-50 border-blue-200 hover:shadow-lg hover:border-blue-400',
      textColor: 'text-blue-900',
      buttonColor: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      id: 'retailer',
      title: 'I\'m a Retailer',
      icon: Store,
      description: 'Manage inventory, fulfill orders, grow your business',
      color: 'bg-teal-50 border-teal-200 hover:shadow-lg hover:border-teal-400',
      textColor: 'text-teal-900',
      buttonColor: 'bg-teal-500 hover:bg-teal-600',
    },
    {
      id: 'brand',
      title: 'I\'m a Brand Partner',
      icon: TrendingUp,
      description: 'Manage products, pricing, and market analytics',
      color: 'bg-purple-50 border-purple-200 hover:shadow-lg hover:border-purple-400',
      textColor: 'text-purple-900',
      buttonColor: 'bg-purple-500 hover:bg-purple-600',
    },
  ];

  const handleRoleSelect = (roleId: string) => {
    navigate(`/register?role=${roleId}`);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-20">
        <div className="container-custom max-w-4xl">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4 text-primary-900">Join AGREGAS</h1>
            <p className="text-xl text-gray-600">
              Choose your role to get started with Africa's leading gas marketplace
            </p>
          </div>

          {/* Role Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {roles.map((role) => {
              const IconComponent = role.icon;
              return (
                <button
                  key={role.id}
                  onClick={() => handleRoleSelect(role.id)}
                  className={`p-8 rounded-lg border-2 transition text-left group ${role.color}`}
                >
                  <div className="flex items-center justify-center mb-6">
                    <div className={`p-4 bg-white rounded-full group-hover:scale-110 transition`}>
                      <IconComponent size={40} className={role.textColor} />
                    </div>
                  </div>

                  <h3 className={`text-2xl font-bold mb-3 text-center ${role.textColor}`}>
                    {role.title}
                  </h3>

                  <p className={`text-center mb-6 ${role.textColor} opacity-80`}>
                    {role.description}
                  </p>

                  <div className={`px-6 py-3 rounded-lg font-semibold text-white text-center transition group-hover:scale-105 ${role.buttonColor}`}>
                    Continue
                  </div>
                </button>
              );
            })}
          </div>

          {/* Already have account */}
          <div className="text-center pt-8 border-t border-gray-200">
            <p className="text-gray-600 mb-2">Already have an account?</p>
            <Link to="/login" className="text-primary-500 font-semibold hover:text-primary-600">
              Sign in here
            </Link>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-4 mt-12 pt-12 border-t border-gray-200 text-center">
            <div>
              <div className="text-2xl font-bold text-primary-900">10K+</div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-900">100%</div>
              <div className="text-sm text-gray-600">Secure Transactions</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-900">2-4h</div>
              <div className="text-sm text-gray-600">Delivery Time</div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};