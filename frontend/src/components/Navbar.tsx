import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Menu, X, LogOut } from 'lucide-react';
import { useState } from 'react';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getNavLinks = () => {
    if (!isAuthenticated) {
      return (
        <>
          <Link to="/" className="text-gray-700 hover:text-primary-500 font-medium">
            Home
          </Link>
          <Link
            to="/login"
            className="text-gray-700 hover:text-primary-500 font-medium"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition"
          >
            Register
          </Link>
        </>
      );
    }

    const dashboardPath =
      user?.role === 'customer'
        ? '/dashboard/customer'
        : user?.role === 'retailer'
        ? '/dashboard/retailer'
        : user?.role === 'brand_marketer'
        ? '/dashboard/brand'
        : '/dashboard/admin';

    return (
      <>
        <Link to="/" className="text-gray-700 hover:text-primary-500 font-medium">
          Home
        </Link>
        <Link to={dashboardPath} className="text-gray-700 hover:text-primary-500 font-medium">
          Dashboard
        </Link>
        <div className="relative group">
          <button className="text-gray-700 hover:text-primary-500 font-medium">
            {user?.fullName}
          </button>
          <div className="absolute right-0 hidden group-hover:block bg-white shadow-lg rounded-lg py-2 w-40">
            <Link
              to="/profile"
              className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </>
    );
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container-custom flex justify-between items-center py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-blue-navy rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <span className="font-grotesk font-bold text-xl text-primary-900">AGREGAS</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex gap-8 items-center">{getNavLinks()}</div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t p-4 flex flex-col gap-4">
          {getNavLinks()}
        </div>
      )}
    </nav>
  );
};