import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-primary-900 text-white py-16">
      <div className="container-custom">
        <div className="grid md:grid-cols-4 gap-12 mb-8">
          {/* Brand */}
          <div>
            <h3 className="font-grotesk font-bold text-2xl mb-4">AGREGAS</h3>
            <p className="text-gray-300 mb-4">
              Cooking Gas. Delivered to You.
            </p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-primary-400 transition">Facebook</a>
              <a href="#" className="hover:text-primary-400 transition">Twitter</a>
              <a href="#" className="hover:text-primary-400 transition">Instagram</a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-300">
              <li><Link to="/" className="hover:text-white transition">Home</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Login</Link></li>
              <li><Link to="/register" className="hover:text-white transition">Register</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-bold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#" className="hover:text-white transition">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition">Terms & Conditions</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold mb-4">Contact</h4>
            <div className="space-y-3 text-gray-300">
              <div className="flex gap-2 items-center">
                <Phone size={18} />
                <a href="tel:+254712345678" className="hover:text-white transition">+254 712 345 678</a>
              </div>
              <div className="flex gap-2 items-center">
                <Mail size={18} />
                <a href="mailto:support@agregas.com" className="hover:text-white transition">support@agregas.com</a>
              </div>
              <div className="flex gap-2 items-center">
                <MapPin size={18} />
                <span>Nairobi, Kenya</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8 text-center text-gray-400">
          <p>&copy; 2026 AGREGAS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};