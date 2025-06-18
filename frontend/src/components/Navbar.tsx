import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GitBranch, Menu, X, LogOut, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import AuthModal from './auth/AuthModal';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      <nav className="bg-white shadow-sm border-b border-gray-200 fixed top-0 z-50 w-full">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">  
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2 hover:scale-105 transition-all duration-200">
                <GitBranch className="h-10 w-10 text-blue-500" />
                <span className="text-2xl font-bold text-gray-900">InternAI</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {isAuthenticated ? (
                <>
                  <Link 
                    to="/my-roadmap" 
                    className="text-gray-700 hover:text-blue-600 font-medium transition-all duration-200 hover:scale-105"
                  >
                    My Roadmap
                  </Link>
                  <Link 
                    to="/my-resume" 
                    className="text-gray-700 hover:text-blue-600 font-medium transition-all duration-200 hover:scale-105"
                  >
                    My Resume
                  </Link>
                  <Link 
                    to="/my-internships" 
                    className="text-gray-700 hover:text-blue-600 font-medium transition-all duration-200 hover:scale-105"
                  >
                    My Internships
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    to="/roadmap" 
                    className="text-gray-700 hover:text-blue-600 font-medium transition-all duration-200 hover:scale-105"
                  >
                    Roadmap
                  </Link>
                  <Link 
                    to="/resume-review" 
                    className="text-gray-700 hover:text-blue-600 font-medium transition-all duration-200 hover:scale-105"
                  >
                    Resume Review
                  </Link>
                  <Link 
                    to="/internships" 
                    className="text-gray-700 hover:text-blue-600 font-medium transition-all duration-200 hover:scale-105"
                  >
                    Internships
                  </Link>
                </>
              )}
            </div>

            {/* Desktop Authentication */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 text-gray-700">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">{user?.name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-all duration-200"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm">Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setAuthModalOpen(true)}
                    className="border-2 border-blue-500 text-blue-500 bg-white px-4 py-2 rounded-lg font-medium hover:bg-blue-50 hover:scale-105 transition-all duration-200"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setAuthModalOpen(true)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 hover:scale-105 hover:shadow-lg transition-all duration-200"
                  >
                    Sign up
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="text-gray-700 hover:text-blue-600 transition-all duration-200"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isOpen && (
            <div className="md:hidden py-4 border-t border-gray-200">
              <div className="flex flex-col space-y-4">
                {/* Navigation Links */}
                <div className="flex flex-col space-y-3">
                  {isAuthenticated ? (
                    <>
                      <Link 
                        to="/my-roadmap" 
                        onClick={() => setIsOpen(false)}
                        className="text-gray-700 hover:text-blue-600 font-medium transition-all duration-200 py-2"
                      >
                        My Roadmap
                      </Link>
                      <Link 
                        to="/my-resume" 
                        onClick={() => setIsOpen(false)}
                        className="text-gray-700 hover:text-blue-600 font-medium transition-all duration-200 py-2"
                      >
                        My Resume
                      </Link>
                      <Link 
                        to="/my-internships" 
                        onClick={() => setIsOpen(false)}
                        className="text-gray-700 hover:text-blue-600 font-medium transition-all duration-200 py-2"
                      >
                        My Internships
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link 
                        to="/roadmap" 
                        onClick={() => setIsOpen(false)}
                        className="text-gray-700 hover:text-blue-600 font-medium transition-all duration-200 py-2"
                      >
                        Roadmap
                      </Link>
                      <Link 
                        to="/resume-review" 
                        onClick={() => setIsOpen(false)}
                        className="text-gray-700 hover:text-blue-600 font-medium transition-all duration-200 py-2"
                      >
                        Resume Review
                      </Link>
                      <Link 
                        to="/internships" 
                        onClick={() => setIsOpen(false)}
                        className="text-gray-700 hover:text-blue-600 font-medium transition-all duration-200 py-2"
                      >
                        Internships
                      </Link>
                    </>
                  )}
                </div>
                
                {/* Authentication Section */}
                {isAuthenticated ? (
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
                      className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-all duration-200"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="text-sm">Logout</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex flex-col space-y-3">
                      <button
                        onClick={() => {
                          setAuthModalOpen(true);
                          setIsOpen(false);
                        }}
                        className="border-2 border-blue-500 text-blue-500 bg-white px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-all duration-200 w-full"
                      >
                        Login
                      </button>
                      <button
                        onClick={() => {
                          setAuthModalOpen(true);
                          setIsOpen(false);
                        }}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 hover:shadow-lg transition-all duration-200 w-full"
                      >
                        Sign up
                      </button>
                    </div>
                  </div>
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
        defaultMode="login"
      />
    </>
  );
};

export default Navbar;