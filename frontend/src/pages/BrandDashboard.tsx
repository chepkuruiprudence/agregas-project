import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const BrandDashboard = () => {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container-custom">
          <h1 className="text-4xl font-bold mb-8">Brand Marketing Dashboard</h1>

          <div className="grid md:grid-cols-4 gap-6 mb-12">
            {[
              { label: 'Total Sales', value: '5,230', icon: '📊' },
              { label: 'Active Retailers', value: '45', icon: '🏪' },
              { label: 'Monthly Revenue', value: '1.2M KES', icon: '💵' },
              { label: 'Market Share', value: '28%', icon: '📈' },
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