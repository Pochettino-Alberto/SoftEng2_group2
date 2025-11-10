import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-800 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-lg font-bold mb-4">Participium</h3>
            <p className="text-gray-400 text-sm">
              Empowering citizens to participate in urban management by reporting local issues and collaborating with public administration.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white text-sm transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <button disabled className="text-gray-600 cursor-not-allowed text-sm" title="Coming Soon">
                  View Reports
                </button>
              </li>
              <li>
                <button disabled className="text-gray-600 cursor-not-allowed text-sm" title="Coming Soon">
                  Statistics
                </button>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-bold mb-4">Report Categories</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>Water Supply</li>
              <li>Public Lighting</li>
              <li>Road Maintenance</li>
              <li>Waste Management</li>
              <li>Green Areas</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold mb-4">Contact</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>Email: info@participium.com</li>
              <li>Phone: +39 011 123 4567</li>
              <li>Address: Turin, Italy</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Participium. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
