  import { useState } from 'react';
  import { Link, useLocation, useNavigate } from 'react-router-dom';
  import { GitBranch, Menu, X, LogOut, User } from 'lucide-react';
  import { useAuth } from '../contexts/AuthContext';
  import AuthModal from './auth/AuthModal';

  const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [authModalOpen, setAuthModalOpen] = useState(false);
    const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, user, logout } = useAuth();

    const handleProtectedRoute = (path: string, authMode: 'login' | 'register' = 'register') => {
      if (isAuthenticated) {
        navigate(path); 
      } else {
        setAuthModalMode(authMode);
        setAuthModalOpen(true);
      }
    };

    const handleLogout = async () => {
      await logout();
      navigate('/');
    };

    return (
      <>
        <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-35 lg:px-35">  
            <div className="flex justify-between items-center h-16">
              <Link to="/" className="flex items-center space-x-2 hover:scale-105 transition-transform">
                <GitBranch className="h-8 w-8 text-blue-500" />
                <span className="text-xl font-bold text-gray-900">InternAI</span>
              </Link>

              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-8">
                <Link
                  to="/"
                  className={`font-medium transition-colors ${
                    location.pathname === '/' 
                      ? 'text-blue-600' 
                      : 'text-gray-700 hover:text-blue-600'
                  }`}
                >
                  Home
                </Link>
                
                {isAuthenticated ? (
                  <>
                    <button
                      onClick={() => handleProtectedRoute('/dashboard')}
                      className={`font-medium transition-colors ${
                        location.pathname === '/dashboard' 
                          ? 'text-blue-600' 
                          : 'text-gray-700 hover:text-blue-600'
                      }`}
                    >
                      Dashboard
                    </button>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 text-gray-700">
                        <User className="h-4 w-4" />
                        <span className="text-sm font-medium">{user?.name}</span>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span className="text-sm">Logout</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleProtectedRoute('/dashboard', 'login')}
                      className="font-medium text-gray-700 hover:text-blue-600 transition-colors"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => handleProtectedRoute('/onboarding')}
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 hover:scale-105 hover:shadow-lg transition-all duration-200"
                    >
                      Get Started
                    </button>
                  </>
                )}
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className="text-gray-700 hover:text-blue-600"
                >
                  {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
            </div>

            {/* Mobile Navigation */}
            {isOpen && (
              <div className="md:hidden py-4 border-t border-gray-200">
                <div className="flex flex-col space-y-4">
                  <Link
                    to="/"
                    className={`font-medium transition-colors ${
                      location.pathname === '/' 
                        ? 'text-blue-600' 
                        : 'text-gray-700 hover:text-blue-600'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    Home
                  </Link>
                  
                  {isAuthenticated ? (
                    <>
                      <button
                        onClick={() => {
                          handleProtectedRoute('/dashboard');
                          setIsOpen(false);
                        }}
                        className={`font-medium transition-colors text-left ${
                          location.pathname === '/dashboard' 
                            ? 'text-blue-600' 
                            : 'text-gray-700 hover:text-blue-600'
                        }`}
                      >
                        Dashboard
                      </button>
                      
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex items-center space-x-2 text-gray-700 mb-3">
                          <User className="h-4 w-4" />
                          <span className="text-sm font-medium">{user?.name}</span>
                        </div>
                        <button
                          onClick={() => {
                            handleLogout();
                            setIsOpen(false);
                          }}
                          className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          <span className="text-sm">Logout</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>  
                      <button
                        onClick={() => {
                          handleProtectedRoute('/dashboard', 'login');
                          setIsOpen(false);
                        }}
                        className="font-medium text-gray-700 hover:text-blue-600 transition-colors text-left"
                      >
                        Dashboard
                      </button>
                      <button
                        onClick={() => {
                          handleProtectedRoute('/onboarding');
                          setIsOpen(false);
                        }}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 hover:scale-105 hover:shadow-lg transition-all duration-200"
                      >
                        Get Started
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Auth Modal */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          defaultMode={authModalMode}
        />
      </>
    );
  };

  export default Navbar;