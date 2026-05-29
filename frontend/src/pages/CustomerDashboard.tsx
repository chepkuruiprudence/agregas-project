import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import { StatsGrid } from '../components/StatsGrid';

export const CustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container-custom px-4 mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center md:text-left">
            Welcome, {user?.fullName}!
          </h1>

          <StatsGrid />

          <div className="bg-white p-6 md:p-8 rounded-lg shadow">
            <h2 className="text-xl md:text-2xl font-bold mb-6 text-center md:text-left">
              Quick Actions
            </h2>
            
            {/* Actions Grid: 1 column on mobile, 3 columns from medium screens up */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <button 
                onClick={() => navigate('/place-order')}
                className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-600 active:scale-[0.99] transition"
              >
                Place Order
              </button>
              <button 
                onClick={() => navigate('/orders')}
                className="w-full bg-accent-bright text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 active:scale-[0.99] transition"
              >
                View Orders
              </button>
              <button 
                onClick={() => navigate('/subscription')}
                className="w-full bg-teal-500 text-white py-3 px-4 rounded-lg font-medium hover:opacity-90 active:scale-[0.99] transition"
              >
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