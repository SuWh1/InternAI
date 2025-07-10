import { useState } from 'react';
import { createPortal } from 'react-dom';
import { GitBranch, Instagram } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import AuthModal from './auth/AuthModal';

const Footer = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/my-roadmap');
    } else {
      setAuthModalMode('register'); 
      setAuthModalOpen(true);
    }
  };

  return (
    <>
      <footer className="bg-theme-secondary text-theme-primary py-12 border-t border-theme transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 justify-items-center md:justify-items-start text-center md:text-left">
            {/* Brand */}
            <div className="col-span-1">
              <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
                <Link to="/" className="flex items-center justify-center md:justify-start space-x-2 mb-4 hover:scale-105 transition-transform">
                  <GitBranch className="h-8 w-8 text-theme-accent" />
                  <span className="text-xl font-bold text-theme-primary transition-colors duration-300">InternAI</span>
                </Link>
              </motion.div>
              <p className="text-theme-secondary text-sm transition-colors duration-300 md:text-left text-center">
                AI-powered internship roadmaps for ambitious students.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-semibold mb-4 text-theme-primary transition-colors duration-300">Product</h3>
              <ul className="space-y-2 text-sm text-theme-secondary transition-colors duration-300">
                <li>
                  <motion.div whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 300 }}>
                    <button 
                      onClick={handleGetStarted}
                      className="hover:text-purple-500 transition-colors duration-300 text-left"
                    >
                      Get Started
                    </button>
                  </motion.div>
                </li>
                <li>
                  <motion.div whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 300 }}>
                    <Link to="/dashboard" className="hover:text-purple-500 transition-colors duration-300">Dashboard</Link>
                  </motion.div>
                </li>
                <li>
                  <motion.div whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 300 }}>
                    <a href="#" className="hover:text-purple-500 transition-colors duration-300">Pricing</a>
                  </motion.div>
                </li>
                <li>
                  <motion.div whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 300 }}>
                    <a href="#" className="hover:text-purple-500 transition-colors duration-300">Success Stories</a>
                  </motion.div>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h3 className="font-semibold mb-4 text-theme-primary transition-colors duration-300">Resources</h3>
              <ul className="space-y-2 text-sm text-theme-secondary transition-colors duration-300">
                <li>
                  <motion.div whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 300 }}>
                    <a href="#" className="hover:text-purple-500 transition-colors duration-300">Blog</a>
                  </motion.div>
                </li>
                <li>
                  <motion.div whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 300 }}>
                    <a href="#" className="hover:text-purple-500 transition-colors duration-300">Interview Tips</a>
                  </motion.div>
                </li>
                <li>
                  <motion.div whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 300 }}>
                    <a href="#" className="hover:text-purple-500 transition-colors duration-300">Resume Guide</a>
                  </motion.div>
                </li>
                <li>
                  <motion.div whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 300 }}>
                    <a href="#" className="hover:text-purple-500 transition-colors duration-300">Company Guides</a>
                  </motion.div>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-semibold mb-4 text-theme-primary transition-colors duration-300">Support</h3>
              <ul className="space-y-2 text-sm text-theme-secondary transition-colors duration-300">
                <li>
                  <motion.div whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 300 }}>
                    <a href="#" className="hover:text-purple-500 transition-colors duration-300">Help Center</a>
                  </motion.div>
                </li>
                <li>
                  <motion.div whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 300 }}>
                    <a href="#" className="hover:text-purple-500 transition-colors duration-300">Contact Us</a>
                  </motion.div>
                </li>
                <li>
                  <motion.div whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 300 }}>
                    <a href="#" className="hover:text-purple-500 transition-colors duration-300">Privacy Policy</a>
                  </motion.div>
                </li>
                <li>
                  <motion.div whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 300 }}>
                    <a href="#" className="hover:text-purple-500 transition-colors duration-300">Terms of Service</a>
                  </motion.div>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-theme mt-8 pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-sm text-theme-secondary transition-colors duration-300">
              © 2025 InternAI. All rights reserved.
            </p>
            
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              {/* X (Twitter) */}
              <motion.a 
                href="https://x.com/InternAI_dev" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-theme-secondary hover:text-purple-500 hover:scale-125 transition-all duration-300"
                whileHover={{ scale: 1.25, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x-twitter">
                  <path d="M8,2H3L16.7,22h5.1L8,2z"></path>
                  <line x1="2.3" y1="22.1" x2="10.2" y2="12.8"></line>
                  <line x1="19.8" y1="2" x2="13.3" y2="9.6"></line>
                </svg>
              </motion.a>

              {/* TikTok */}
              <motion.a 
                href="https://www.tiktok.com/@intern_ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-theme-secondary hover:text-purple-500 hover:scale-125 transition-all duration-300"
                whileHover={{ scale: 1.25, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3z"/></svg>
              </motion.a>

              {/* Instagram */}
              <motion.a 
                href="https://www.instagram.com/internai_co/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-theme-secondary hover:text-purple-500 hover:scale-125 transition-all duration-300"
                whileHover={{ scale: 1.25, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334"/>
                </svg>
              </motion.a>
              
              {/* Threads */}
              <motion.a 
                href="https://www.threads.com/@internai_co" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-theme-secondary hover:text-purple-500 hover:scale-125 transition-all duration-300"
                whileHover={{ scale: 1.25, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M6.321 6.016c-.27-.18-1.166-.802-1.166-.802.756-1.081 1.753-1.502 3.132-1.502.975 0 1.803.327 2.394.948s.928 1.509 1.005 2.644q.492.207.905.484c1.109.745 1.719 1.86 1.719 3.137 0 2.716-2.226 5.075-6.256 5.075C4.594 16 1 13.987 1 7.994 1 2.034 4.482 0 8.044 0 9.69 0 13.55.243 15 5.036l-1.36.353C12.516 1.974 10.163 1.43 8.006 1.43c-3.565 0-5.582 2.171-5.582 6.79 0 4.143 2.254 6.343 5.63 6.343 2.777 0 4.847-1.443 4.847-3.556 0-1.438-1.208-2.127-1.27-2.127-.236 1.234-.868 3.31-3.644 3.31-1.618 0-3.013-1.118-3.013-2.582 0-2.09 1.984-2.847 3.55-2.847.586 0 1.294.04 1.663.114 0-.637-.54-1.728-1.9-1.728-1.25 0-1.566.405-1.967.868ZM8.716 8.19c-2.04 0-2.304.87-2.304 1.416 0 .878 1.043 1.168 1.6 1.168 1.02 0 2.067-.282 2.232-2.423a6.2 6.2 0 0 0-1.528-.161"/>
                </svg>
              </motion.a>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal - Rendered via Portal to document.body */}
      {authModalOpen && typeof document !== 'undefined' && createPortal(
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          defaultMode={authModalMode}
        />,
        document.body
      )}
    </>
  );
};

export default Footer;