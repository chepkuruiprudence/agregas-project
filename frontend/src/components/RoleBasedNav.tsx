import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const RoleBasedNav = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getNavItems = () => {
    switch (user?.role) {
      case 'customer':
        return [
          { label: 'Dashboard', path: '/dashboard/customer' },
          { label: 'Orders', path: '/orders' },
          { label: 'Subscriptions', path: '/subscriptions' },
          { label: 'Loyalty', path: '/loyalty' },
        ];
      case 'retailer':
        return [
          { label: 'Dashboard', path: '/dashboard/retailer' },
          { label: 'Orders', path: '/retailer/orders' },
          { label: 'Inventory', path: '/retailer/inventory' },
        ];
      case 'brand':
        return [
          { label: 'Dashboard', path: '/dashboard/brand' },
          { label: 'Products', path: '/brand/products' },
          { label: 'Analytics', path: '/brand/analytics' },
        ];
      case 'admin':
        return [
          { label: 'Dashboard', path: '/dashboard/admin' },
          { label: 'Users', path: '/admin/users' },
          { label: 'Analytics', path: '/admin/analytics' },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="bg-primary-900 text-white p-4 rounded-lg">
      <h3 className="font-bold mb-4">{user?.fullName}</h3>
      <nav className="space-y-2">
        {getNavItems().map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="block px-4 py-2 rounded hover:bg-primary-700 transition"
          >
            {item.label}
          </Link>
        ))}
        <button
          onClick={handleLogout}
          className="w-full text-left px-4 py-2 text-red-400 hover:bg-primary-700 rounded transition"
        >
          Logout
        </button>
      </nav>
    </div>
  );
};