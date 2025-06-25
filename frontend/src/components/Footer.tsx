import { GitBranch, Github, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Footer = () => {
  return (
    <footer className="bg-theme-secondary text-theme-primary py-12 border-t border-theme transition-colors duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
              <Link to="/" className="flex items-center space-x-2 mb-4 hover:scale-105 transition-transform">
                <GitBranch className="h-8 w-8 text-theme-accent" />
                <span className="text-xl font-bold text-theme-primary transition-colors duration-300">InternAI</span>
              </Link>
            </motion.div>
            <p className="text-theme-secondary text-sm transition-colors duration-300">
              AI-powered internship roadmaps for ambitious students.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4 text-theme-primary transition-colors duration-300">Product</h3>
            <ul className="space-y-2 text-sm text-theme-secondary transition-colors duration-300">
              <li>
                <motion.div whileHover={{ x: 4 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Link to="/onboarding" className="hover:text-purple-500 transition-colors duration-300">Get Started</Link>
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
            <motion.a 
              href="#" 
              className="text-theme-secondary hover:text-purple-500 hover:scale-125 transition-all duration-300"
              whileHover={{ scale: 1.25, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentcolor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x-twitter"> 
                <path d="M8,2H3L16.7,22h5.1L8,2z"/> 
                <line x1="2.3" y1="22.1" x2="10.2" y2="12.8"/> 
                <line x1="19.8" y1="2" x2="13.3" y2="9.6"/> 
              </svg>
            </motion.a>
            <motion.a 
              href="#" 
              className="text-theme-secondary hover:text-purple-500 hover:scale-125 transition-all duration-300"
              whileHover={{ scale: 1.25, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
            >
              <Github className="h-5 w-5" />
            </motion.a>
            <motion.a 
              href="#" 
              className="text-theme-secondary hover:text-purple-500 hover:scale-125 transition-all duration-300"
              whileHover={{ scale: 1.25, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
            >
              <Mail className="h-5 w-5" />
            </motion.a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;