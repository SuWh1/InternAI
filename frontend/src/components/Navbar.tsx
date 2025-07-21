import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { GitBranch, Menu, X, LogOut, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import AuthModal from './auth/AuthModal';
import UserDropdown from './auth/UserDropdown';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  // Handle redirect from protected routes
  useEffect(() => {
    if (location.state?.showLoginModal && !isAuthenticated) {
      setAuthMode('login');
      setAuthModalOpen(true);
      // Clear the state to prevent modal from opening again on navigation
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, isAuthenticated, navigate, location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  // Check if user is currently in onboarding
  const isOnboardingMode = location.pathname === '/onboarding';

  // Animation variants
  const navVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        type: 'spring' as const,
        damping: 20,
        stiffness: 300,
        staggerChildren: 0.1,
      }
    }
  };

  const linkVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: 'spring' as const,
        damping: 15,
        stiffness: 300,
      }
    }
  };

  const mobileMenuVariants = {
    hidden: { 
      height: 0,
      opacity: 0,
      transition: {
        height: { duration: 0.3 },
        opacity: { duration: 0.2 }
      }
    },
    visible: { 
      height: 'auto',
      opacity: 1,
      transition: {
        height: { duration: 0.3 },
        opacity: { duration: 0.2, delay: 0.1 },
        staggerChildren: 0.05,
        delayChildren: 0.15
      }
    }
  };

  const mobileItemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: {
        type: 'spring' as const,
        damping: 20,
        stiffness: 300,
      }
    }
  };

  return (
    <>
      <header className="relative">
        <motion.nav 
          className="bg-theme-secondary shadow-sm border-b border-theme fixed top-0 z-50 w-full transition-colors duration-300"
          initial="hidden"
          animate="visible"
          variants={navVariants}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">  
            <div className="flex justify-between items-center h-16">
              <motion.div 
                className="flex items-center justify-between w-full relative"
                variants={navVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div 
                  className="flex items-center"
                  variants={linkVariants}
                >
                  {/* Hamburger for mobile */}
                  {!isOnboardingMode && (
                    <motion.button
                      onClick={() => setIsOpen(!isOpen)}
                      className="md:hidden text-theme-secondary hover:text-theme-accent transition-all duration-200 mr-2"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      animate={{ rotate: isOpen ? 90 : 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </motion.button>
                  )}

                  {/* Brand (hidden on mobile) */}
                  <Link to="/" className="hidden md:flex items-center space-x-2 group">
                    <motion.div 
                      className="h-12 w-12 rounded-lg flex items-center justify-center shadow-lg relative overflow-hidden" 
                      style={{ backgroundColor: '#C700FF' }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      animate={{ 
                        scale: [1, 1.08, 1],
                      }}
                      transition={{ 
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <GitBranch className="h-8 w-8 text-white relative z-10" />
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
                        animate={{
                          x: ["-200%", "200%"],
                        }}
                        transition={{
                          duration: 6,
                          repeat: Infinity,
                          ease: "easeInOut",
                          repeatDelay: 2,
                        }}
                        style={{ opacity: 0.15 }}
                      />
                    </motion.div>
                    <motion.span 
                      className="text-2xl font-bold text-theme-primary transition-colors duration-300"
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                      InternAI
                    </motion.span>
                  </Link>
                </motion.div>

                {/* Desktop Navigation - Hidden during onboarding - Centered */}
                {!isOnboardingMode && (
                  <motion.div 
                    className="hidden md:flex items-center space-x-6 absolute left-1/2 transform -translate-x-1/2"
                    variants={linkVariants}
                  >
                    {isAuthenticated ? (
                      <>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Link 
                            to="/my-roadmap" 
                            className="text-theme-secondary hover:text-purple-500 font-medium transition-all duration-200"
                          >
                            Career
                          </Link>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Link 
                            to="/my-resume" 
                            className="text-theme-secondary hover:text-purple-500 font-medium transition-all duration-200"
                          >
                            My Resume
                          </Link>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Link 
                            to="/my-internships" 
                            className="text-theme-secondary hover:text-purple-500 font-medium transition-all duration-200"
                          >
                            Internships
                          </Link>
                        </motion.div>
                      </>
                    ) : (
                      <>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Link 
                            to="/roadmap" 
                            className="text-theme-secondary hover:text-purple-500 font-medium transition-all duration-200"
                          >
                            Roadmap
                          </Link>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Link 
                            to="/resume-review" 
                            className="text-theme-secondary hover:text-purple-500 font-medium transition-all duration-200"
                          >
                            Resume Review
                          </Link>
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Link 
                            to="/internships" 
                            className="text-theme-secondary hover:text-purple-500 font-medium transition-all duration-200"
                          >
                            Internships
                          </Link>
                        </motion.div>
                      </>
                    )}
                  </motion.div>
                )}

                {/* Desktop Authentication */}
                <motion.div 
                  className="hidden md:flex items-center space-x-4"
                  variants={linkVariants}
                >
                  {isAuthenticated ? (
                    <div className="flex items-center space-x-4">
                      <ThemeToggle />
                      {!isOnboardingMode && (
                        <UserDropdown />
                      )}
                    </div>
                  ) : (
                    !isOnboardingMode && (
                      <div className="flex items-center space-x-3">
                        <ThemeToggle />
                        <motion.button
                          onClick={() => openAuthModal('login')}
                          className="border-2 border-theme-accent text-theme-accent bg-theme-secondary px-4 py-2 rounded-lg font-medium hover:bg-theme-hover transition-all duration-200 button"
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Login
                        </motion.button>
                        <motion.button
                          onClick={() => openAuthModal('register')}
                          className="bg-theme-accent text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 hover:shadow-lg transition-all duration-200 button glow-hover"
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Sign up
                        </motion.button>
                      </div>
                    )
                  )}
                </motion.div>

                {/* Mobile menu button - Hidden during onboarding */}
                {!isOnboardingMode && (
                  <div className="md:hidden flex items-center space-x-3">
                    {/* Theme Toggle and User Avatar for mobile */}
                    <ThemeToggle />
                    {isAuthenticated && <UserDropdown />}
                  </div>
                )}

                {/* Mobile logout button during onboarding */}
                {isOnboardingMode && isAuthenticated && (
                  <div className="md:hidden flex items-center space-x-3">
                    <motion.button
                      onClick={handleLogout}
                      className="flex items-center space-x-1 text-theme-secondary hover:text-theme-accent transition-all duration-200"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="text-sm">Logout</span>
                    </motion.button>
                    {/* Theme Toggle for mobile */}
                    <ThemeToggle />
                  </div>
                )}
              </motion.div>
            </div>

            {/* Mobile Navigation - Hidden during onboarding */}
            <AnimatePresence>
              {!isOnboardingMode && isOpen && (
                <motion.div 
                  className="md:hidden py-4 border-t border-theme bg-theme-secondary transition-colors duration-300 overflow-hidden"
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  variants={mobileMenuVariants}
                >
                  <div className="flex flex-col space-y-4">
                    {/* Mobile Brand */}
                    <Link
                      to="/"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center space-x-2 py-2"
                    >
                      <div className="h-10 w-10 rounded-lg flex items-center justify-center shadow-lg relative overflow-hidden" style={{ backgroundColor: '#C700FF' }}>
                        <GitBranch className="h-6 w-6 text-white relative z-10" />
                      </div>
                      <span className="text-xl font-bold text-theme-primary">InternAI</span>
                    </Link>

                    {/* Navigation Links */}
                    <div className="flex flex-col space-y-3">
                      {isAuthenticated ? (
                        <>
                          <motion.div variants={mobileItemVariants}>
                            <Link 
                              to="/my-roadmap" 
                              onClick={() => setIsOpen(false)}
                              className="text-theme-secondary hover:text-theme-accent font-medium transition-all duration-200 py-2 block"
                            >
                              Career
                            </Link>
                          </motion.div>
                          <motion.div variants={mobileItemVariants}>
                            <Link 
                              to="/my-resume" 
                              onClick={() => setIsOpen(false)}
                              className="text-theme-secondary hover:text-theme-accent font-medium transition-all duration-200 py-2 block"
                            >
                              My Resume
                            </Link>
                          </motion.div>
                          <motion.div variants={mobileItemVariants}>
                            <Link 
                              to="/my-internships" 
                              onClick={() => setIsOpen(false)}
                              className="text-theme-secondary hover:text-theme-accent font-medium transition-all duration-200 py-2 block"
                            >
                              My Internships
                            </Link>
                          </motion.div>
                        </>
                      ) : (
                        <>
                          <motion.div variants={mobileItemVariants}>
                            <Link 
                              to="/roadmap" 
                              onClick={() => setIsOpen(false)}
                              className="text-theme-secondary hover:text-theme-accent font-medium transition-all duration-200 py-2 block"
                            >
                              Roadmap
                            </Link>
                          </motion.div>
                          <motion.div variants={mobileItemVariants}>
                            <Link 
                              to="/resume-review" 
                              onClick={() => setIsOpen(false)}
                              className="text-theme-secondary hover:text-theme-accent font-medium transition-all duration-200 py-2 block"
                            >
                              Resume Review
                            </Link>
                          </motion.div>
                          <motion.div variants={mobileItemVariants}>
                            <Link 
                              to="/internships" 
                              onClick={() => setIsOpen(false)}
                              className="text-theme-secondary hover:text-theme-accent font-medium transition-all duration-200 py-2 block"
                            >
                              Internships
                            </Link>
                          </motion.div>
                        </>
                      )}
                    </div>
                    
                    {/* Authentication Section */}
                    {!isAuthenticated && (
                      <motion.div 
                        className="pt-2 border-t border-theme"
                        variants={mobileItemVariants}
                      >
                        <div className="flex flex-col space-y-3">
                          <button
                            onClick={() => {
                              openAuthModal('login');
                              setIsOpen(false);
                            }}
                            className="border-2 border-theme-accent text-theme-accent bg-theme-secondary px-4 py-2 rounded-lg font-medium hover:bg-theme-hover transition-all duration-200 w-full"
                          >
                            Login
                          </button>
                          <button
                            onClick={() => {
                              openAuthModal('register');
                              setIsOpen(false);
                            }}
                            className="bg-theme-accent text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 hover:shadow-lg transition-all duration-200 w-full"
                          >
                            Sign up
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.nav>
      </header>

      {/* Auth Modal - Hidden during onboarding */}
      {!isOnboardingMode && (
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          defaultMode={authMode}
        />
      )}


    </>
  );
};

export default Navbar;