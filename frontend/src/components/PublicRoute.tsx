import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface PublicRouteProps {
  children: JSX.Element;
}

/**
 * PublicRoute: Redirects logged-in users to their dashboard
 * Only allows unauthenticated users to access login/register pages
 */
export const PublicRoute = ({ children }: PublicRouteProps) => {
  const { user, isLoading } = useAuth();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // If user is logged in, redirect to their dashboard based on role
  if (user) {
    console.log('🔐 User already logged in. Redirecting to dashboard for role:', user.role);

    // Dashboard routes by role
    const dashboardRoutes: Record<string, string> = {
      customer: '/dashboard/customer',
      retailer: '/dashboard/retailer',
      brand: '/dashboard/brand',
      admin: '/dashboard/admin',
    };

    const dashboardUrl = dashboardRoutes[user.role] || '/dashboard/customer';
    return <Navigate to={dashboardUrl} replace />;
  }

  // If not logged in, allow access to public pages
  return children;
};