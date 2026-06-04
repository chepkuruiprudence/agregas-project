import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { RegisterType } from './pages/RegisterType';
import { Orders } from './pages/Orders';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { RetailerDashboard } from './pages/RetailerDashboard';
import { BrandDashboard } from './pages/BrandDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { PublicRoute } from './components/PublicRoute';
import { PaymentPage } from './components/PaymentPage';
// @ts-ignore: side-effect import for CSS file without type declarations
import './index.css';
import { Profile } from './pages/Profile';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
<Route path="/register-type" element={<PublicRoute><RegisterType /></PublicRoute>} />
<Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

          {/* Protected Routes */}
          <Route
  path="/profile"
  element={
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  }
/> 

          <Route
            path="/dashboard/customer"
            element={
              <ProtectedRoute requiredRoles={['customer']}>
                <CustomerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute requiredRoles={['customer']}>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/retailer"
            element={
              <ProtectedRoute requiredRoles={['retailer']}>
                <RetailerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/brand"
            element={
              <ProtectedRoute requiredRoles={['brand_marketer']}>
                <BrandDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute requiredRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
  path="/payment"
  element={
    <ProtectedRoute requiredRoles={['customer']}>
      <PaymentPage />
    </ProtectedRoute>
  }
/>

          {/* Catch all */}
          <Route path="*" element={<Home />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;