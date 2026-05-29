import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { ProfileForm } from '../components/ProfileForm';
import { useAuth } from '../hooks/useAuth';

export const Profile = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null; // ProtectedRoute handles redirect
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container-custom">
          <div className="max-w-2xl mx-auto">
            <ProfileForm />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};