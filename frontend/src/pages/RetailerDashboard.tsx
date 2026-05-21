import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../hooks/useAuth';

export const RetailerDashboard = () => {
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container-custom">
          <h1 className="text-4xl font-bold mb-8">Retailer Dashboard</h1>

          <div className="grid md:grid-cols-4 gap-6 mb-12">
            {[
              { label: 'Pending Orders', value: '8', icon: '📋' },
              { label: 'Stock Level', value: '250 kg', icon: '📦' },
              { label: 'Today Revenue', value: '45,000 KES', icon: '💰' },
              { label: 'Rating', value: '4.8 ⭐', icon: '⭐' },
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
        </div>
      </div>
      <Footer />
    </>
  );
};