import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export const ProtectedRoute = ({ children, requiredRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // 1. Keep loading if the auth state is true but the user object is still syncing
  if (isLoading || (isAuthenticated && !user)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // 2. Unauthenticated users go back to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Check roles safely using optional chaining and an empty string fallback
  if (requiredRoles && !requiredRoles.includes(user?.role || '')) {
    console.warn(`Unauthorized access attempt. User role: ${user?.role}. Required:`, requiredRoles);

    // Fallback path calculation with safe optional chaining
    const currentRole = user?.role || 'customer';
    const targetDashboard = currentRole === 'brand_marketer' ? 'brand' : currentRole;
    
    return <Navigate to={`/dashboard/${targetDashboard}`} replace />;
  }

  return <>{children}</>;
};