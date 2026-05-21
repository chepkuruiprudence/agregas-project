import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../hooks/useAuth';

export const CustomerDashboard = () => {
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container-custom">
          <h1 className="text-4xl font-bold mb-8">Welcome, {user?.fullName}!</h1>

          <div className="grid md:grid-cols-4 gap-6 mb-12">
            {/* Stats */}
            {[
              { label: 'Total Orders', value: '12', icon: '📦' },
              { label: 'Loyalty Points', value: '2,450', icon: '⭐' },
              { label: 'Carbon Credits', value: '850', icon: '🌱' },
              { label: 'Active Subscription', value: 'Premium', icon: '✅' },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
              >
                <div className="text-4xl mb-2">{stat.icon}</div>
                <p className="text-gray-600 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-primary-900">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white p-8 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <button className="bg-primary-500 text-white py-3 rounded-lg hover:bg-primary-600 transition">
                Place Order
              </button>
              <button className="bg-accent-bright text-white py-3 rounded-lg hover:opacity-90 transition">
                View Orders
              </button>
              <button className="bg-teal-500 text-white py-3 rounded-lg hover:opacity-90 transition">
                Manage Subscription
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};