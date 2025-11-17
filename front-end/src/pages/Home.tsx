import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Card from '../components/Card';

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="text-white relative overflow-hidden"
        style={{ 
          backgroundImage: `
            linear-gradient(135deg, rgba(81, 153, 205, 0.5) 0%, rgba(81, 153, 205, 0.6) 100%),
            url("/mole-turin.jpg")
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              Make Your City Better
            </h1>
            <p className="text-xl mb-8 text-white/90 max-w-3xl mx-auto">
              Report local issues, track their progress, and collaborate with your municipality 
              to create a better urban environment for everyone in Turin.
            </p>
            <div className="flex justify-center space-x-4">
              {isAuthenticated ? (
                <Link to="/citizen">
                  <Button size="lg" className="text-lg">
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/auth/account">
                    <Button size="lg" style={{ backgroundColor: 'white', color: '#5199CD' }} className="text-lg hover:bg-gray-100">
                      Get Started
                    </Button>
                  </Link>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="text-lg border-white text-white/50 cursor-not-allowed" 
                    disabled
                    title="Coming Soon"
                  >
                    View Reports
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How Participium Works
            </h2>
            <p className="text-xl text-gray-600">
              Simple, effective citizen participation in three easy steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card hover className="p-8 text-center">
              <div style={{ backgroundColor: '#E3F2FD' }} className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg style={{ color: '#5199CD' }} className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">Report Issues</h3>
              <p className="text-gray-600">
                Select a location on the map, add photos, and describe the problem. 
                It takes just a few minutes to make a difference.
              </p>
            </Card>

            {/* Feature 2 */}
            <Card hover className="p-8 text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">Track Progress</h3>
              <p className="text-gray-600">
                Get real-time notifications as your report moves through approval, 
                assignment, and resolution stages.
              </p>
            </Card>

            {/* Feature 3 */}
            <Card hover className="p-8 text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900">Collaborate</h3>
              <p className="text-gray-600">
                Communicate directly with municipality staff, receive updates, 
                and see how your reports help improve the city.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Report Categories
            </h2>
            <p className="text-xl text-gray-600">
              Help improve various aspects of urban life
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[
              { name: 'Drinking Water', icon: '💧' },
              { name: 'Architectural Barriers', icon: '♿' },
              { name: 'Sewer System', icon: '🚰' },
              { name: 'Public Lighting', icon: '🔦' },
              { name: 'Waste', icon: '♻️' },
              { name: 'Road Signs & Traffic', icon: '🚦' },
              { name: 'Roads & Furnishings', icon: '🏙️' },
              { name: 'Green Areas & Playgrounds', icon: '🌳' },//TODO: change this, get it from API
            ].map((category, index) => (
              <Card key={index} hover className="p-6 text-center cursor-pointer">
                <div className="text-4xl mb-2">{category.icon}</div>
                <h4 className="text-sm font-semibold text-gray-800">{category.name}</h4>
              </Card>
            ))}
          </div>
          
          {/* Other Category - Centered at Bottom */}
          <div className="flex justify-center mt-6">
            <Card hover className="p-6 text-center cursor-pointer w-48">
              <div className="text-4xl mb-2">📋</div>
              <h4 className="text-sm font-semibold text-gray-800">Other</h4>
            </Card>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Community Impact
            </h2>
            <p className="text-xl text-gray-600">
              Together, we're making Turin a better place
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div style={{ color: '#5199CD' }} className="text-5xl font-bold mb-2">1,234</div>
              <div className="text-gray-600">Reports Submitted</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-green-600 mb-2">856</div>
              <div className="text-gray-600">Issues Resolved</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-purple-600 mb-2">567</div>
              <div className="text-gray-600">Active Citizens</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-orange-600 mb-2">95%</div>
              <div className="text-gray-600">Satisfaction Rate</div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Button 
              variant="outline" 
              size="lg" 
              disabled 
              className="cursor-not-allowed opacity-60"
              title="Coming Soon"
            >
              View Detailed Statistics
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ backgroundColor: '#5199CD' }} className="text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Join thousands of citizens working together to improve Turin
          </p>
          {!isAuthenticated && (
            <Link to="/auth/register">
              <Button size="lg" style={{ backgroundColor: 'white', color: '#5199CD' }} className="text-lg hover:bg-gray-100">
                Create Your Free Account
              </Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
