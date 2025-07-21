import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

interface CompanyTransition {
  old: { name: string; icon: string; color: string };
  new: { name: string; icon: string; color: string };
}

const FaangToMango: React.FC = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const companies: CompanyTransition[] = [
    {
      old: { name: 'Facebook', icon: '/icons/facebook.svg', color: '#1877F2' },
      new: { name: 'Meta', icon: '/icons/metaOriginal.svg', color: '#0866FF' }
    },
    {
      old: { name: 'Apple', icon: isDarkMode ? '/icons/appleWhite.svg' : '/icons/appleBlack.svg', color: '#000000' },
      new: { name: 'Apple', icon: isDarkMode ? '/icons/appleWhite.svg' : '/icons/appleBlack.svg', color: '#000000' }
    },
    {
      old: { name: 'Amazon', icon: '/icons/amazon.svg', color: '#FF9900' },
      new: { name: 'Nvidia', icon: '/icons/nvidiaOriginal.svg', color: '#76B900' }
    },
    {
      old: { name: 'Netflix', icon: '/icons/netflix.svg', color: '#E50914' },
      new: { name: 'Google', icon: '/icons/googleOriginal.svg', color: '#4285F4' }
    },
    {
      old: { name: 'Google', icon: '/icons/googleOriginal.svg', color: '#4285F4' },
      new: { name: 'OpenAI', icon: isDarkMode ? '/icons/openaiWhite.svg' : '/icons/openaiBlack.svg', color: '#412991' }
    }
  ];



  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  return (
    <section className="py-20 bg-primary transition-colors duration-300 relative overflow-hidden">
      {/* Beautiful Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Large purple orb - top right */}
        <motion.div
          className="absolute top-10 right-10 w-80 h-80 rounded-full blur-3xl"
          style={{
            background: `radial-gradient(circle, ${
              isDarkMode 
                ? 'rgba(196, 145, 255, 0.8)' 
                : 'rgba(168, 85, 247, 0.4)'
            } 0%, transparent 70%)`
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Medium purple orb - bottom left */}
        <motion.div
          className="absolute bottom-16 left-16 w-64 h-64 rounded-full blur-2xl"
          style={{
            background: `radial-gradient(circle, ${
              isDarkMode 
                ? 'rgba(147, 51, 234, 0.7)' 
                : 'rgba(147, 51, 234, 0.35)'
            } 0%, transparent 60%)`
          }}
          animate={{
            scale: [1, 1.15, 1],
            x: [0, 20, 0],
            y: [0, -15, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Small accent orb - center right */}
        <motion.div
          className="absolute top-1/2 right-20 w-40 h-40 rounded-full blur-2xl"
          style={{
            background: `radial-gradient(circle, ${
              isDarkMode 
                ? 'rgba(221, 199, 255, 0.6)' 
                : 'rgba(192, 132, 252, 0.3)'
            } 0%, transparent 50%)`
          }}
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear"
          }}
        />
        
        {/* Soft Purple Light from Top Right Corner */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Main Light Source from Top Right */}
          <motion.div
            className="absolute -top-20 -right-20 w-96 h-96 rounded-full blur-3xl"
            style={{
              background: `radial-gradient(circle at center, ${
                isDarkMode 
                  ? 'rgba(196, 145, 255, 0.4)' 
                  : 'rgba(168, 85, 247, 0.2)'
              } 0%, ${
                isDarkMode 
                  ? 'rgba(147, 51, 234, 0.2)' 
                  : 'rgba(147, 51, 234, 0.1)'
              } 50%, transparent 100%)`
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Soft Light Beam Diagonal */}
          <motion.div
            className="absolute top-0 right-0 w-full h-full"
            style={{
              background: `linear-gradient(135deg, ${
                isDarkMode 
                  ? 'rgba(168, 85, 247, 0.3)' 
                  : 'rgba(147, 51, 234, 0.15)'
              } 0%, ${
                isDarkMode 
                  ? 'rgba(196, 145, 255, 0.1)' 
                  : 'rgba(168, 85, 247, 0.08)'
              } 30%, transparent 60%)`
            }}
            animate={{
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Subtle Secondary Glow */}
          <motion.div
            className="absolute top-10 right-10 w-64 h-64 rounded-full blur-2xl"
            style={{
              background: `radial-gradient(circle, ${
                isDarkMode 
                  ? 'rgba(221, 199, 255, 0.2)' 
                  : 'rgba(192, 132, 252, 0.12)'
              } 0%, transparent 70%)`
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.6, 0.9, 0.6],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
          />
        </div>
        
        {/* Diagonal light beam - top left */}
        <motion.div
          className="absolute top-0 left-0 w-96 h-6 blur-md"
          style={{
            background: `linear-gradient(45deg, ${
              isDarkMode 
                ? 'rgba(168, 85, 247, 0.7)' 
                : 'rgba(147, 51, 234, 0.4)'
            } 0%, transparent 100%)`,
            transform: 'rotate(45deg)',
            transformOrigin: 'top left'
          }}
          animate={{
            opacity: [0.7, 1, 0.7],
            scaleX: [1, 1.1, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Diagonal light beam - bottom right */}
        <motion.div
          className="absolute bottom-0 right-0 w-80 h-6 blur-md"
          style={{
            background: `linear-gradient(135deg, transparent 0%, ${
              isDarkMode 
                ? 'rgba(196, 145, 255, 0.7)' 
                : 'rgba(168, 85, 247, 0.4)'
            } 100%)`,
            transform: 'rotate(-45deg)',
            transformOrigin: 'bottom right'
          }}
          animate={{
            opacity: [0.5, 0.9, 0.5],
            scaleX: [1, 1.2, 1],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-theme-primary mb-4 transition-colors duration-300">
            FAANG is over. MANGO is now.
          </h2>
          <p className="text-xl text-theme-secondary max-w-2xl mx-auto mt-2 transition-colors duration-300">
            The tech world has evolved. InternAI helps you prepare for the jobs of tomorrow, not yesterday.
          </p>
        </motion.div>

        {/* Company Transition Display */}
        <motion.div
          className="grid md:grid-cols-2 gap-8 lg:gap-12 relative"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
        >
          {/* FAANG Column */}
          <motion.div
            variants={itemVariants}
            className="bg-theme-primary p-6 rounded-xl shadow-sm border border-theme transition-all duration-300 relative overflow-hidden cursor-pointer"
            whileHover={{
              y: -8,
              boxShadow: `0 20px 40px -12px ${isDarkMode ? 'rgba(190, 120, 255, 0.5)' : 'rgba(168, 85, 247, 0.35)'}`,
              transition: {
                type: "spring",
                stiffness: 400,
                damping: 17
              }
            }}
          >
            {/* Gradient purple background on hover with animation */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-purple-500/30 to-pink-500/20 opacity-0 rounded-xl pointer-events-none"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            <div className="text-center mb-6 relative z-10">
              <h3 className="text-2xl font-bold text-red-500 mb-2">FAANG Era</h3>
              <p className="text-theme-secondary text-sm">The traditional tech giants</p>
            </div>
            <div className="space-y-4 relative z-10">
              {companies.map((company, index) => (
                <motion.div
                  key={`old-${index}`}
                  className="flex items-center space-x-3 p-3 rounded-lg bg-theme-secondary/50 transition-all duration-300 hover:shadow-sm hover:bg-theme-secondary"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="w-10 h-10 flex items-center justify-center bg-theme-secondary rounded-lg shadow-sm">
                    <img
                      src={company.old.icon}
                      alt={company.old.name}
                      className="w-6 h-6 object-contain"
                    />
                  </div>
                  <span className="text-theme-primary font-medium">{company.old.name}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

            {/* Animated Arrow */}
            <div className="hidden md:flex items-center justify-center absolute left-1/2 top-0 bottom-0 transform -translate-x-1/2 z-10">
            <motion.div
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="flex items-center justify-center"
            >
                <span className="text-purple-500 text-4xl leading-none">→</span>
            </motion.div>
            </div>

          {/* Mobile Arrow */}
          <div className="md:hidden flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="flex items-center justify-center"
            >
              <span className="text-purple-500 text-4xl leading-none">↓</span>
            </motion.div>
          </div>

          {/* MANGO Column */}
          <motion.div
            variants={itemVariants}
            className="bg-theme-primary p-6 rounded-xl shadow-sm border border-theme transition-all duration-300 relative overflow-hidden cursor-pointer"
            whileHover={{
              y: -8,
              boxShadow: `0 20px 40px -12px ${isDarkMode ? 'rgba(190, 120, 255, 0.5)' : 'rgba(168, 85, 247, 0.35)'}`,
              transition: {
                type: "spring",
                stiffness: 400,
                damping: 17
              }
            }}
          >
            {/* Gradient purple background on hover with animation */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-purple-500/30 to-pink-500/20 opacity-0 rounded-xl pointer-events-none"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
            <div className="text-center mb-6 relative z-10">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent mb-2">MANGO Era</h3>
              <p className="text-theme-secondary text-sm">The AI revolution leaders</p>
            </div>
            <div className="space-y-4 relative z-10">
              {companies.map((company, index) => (
                <motion.div
                  key={`new-${index}`}
                  className="flex items-center space-x-3 p-3 rounded-lg bg-theme-secondary/50 transition-all duration-300 hover:shadow-sm hover:bg-theme-secondary"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                >
                  <div className="w-10 h-10 flex items-center justify-center bg-theme-secondary rounded-lg shadow-sm">
                    <img
                      src={company.new.icon}
                      alt={company.new.name}
                      className="w-6 h-6 object-contain"
                    />
                  </div>
                  <span className="text-theme-primary font-medium">{company.new.name}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default FaangToMango; 