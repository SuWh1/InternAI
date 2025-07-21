import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';

const testimonials = [
  {
    name: "Fatikh Aidyn",
    role: "2 year student at NU",
    company: "Repathon CEO",
    content: "InternAI's roadmap was a game-changer. The weekly breakdown made everything manageable, and I never felt overwhelmed. The AI knew exactly what skills I needed to focus on.",
    rating: 5,
    avatar: "FA"
  },
  {
    name: "Maxim Sarsekeyev",
    role: "2-nd year student at KBTU",
    company: "FoodSnap AI CEO",
    content: "I was completely lost on where to start. InternAI gave me a clear path from beginner to making a great tech project. The project suggestions were spot-on for my skill level.",
    rating: 5,
    avatar: "MS"
  },
  {
    name: "Rassul Kerimzhanov",
    role: "Admin at KBTU",
    company: "BattleStack CEO",
    content: "As someone switching from finance to tech, I needed a fast-track plan. InternAI's personalized approach helped me land an internship in just 6 months.",
    rating: 5,
    avatar: "EW"
  }
];

const Testimonials = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-change testimonials every 7 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  const nextTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="py-20 bg-theme-primary transition-colors duration-300 relative overflow-hidden" style={{ position: 'relative' }}>
      {/* Beautiful Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Radial spotlight from top */}
        <motion.div
          className="absolute top-0 left-1/2 transform -translate-x-1/2 w-96 h-96 rounded-full blur-3xl"
          style={{
            background: `radial-gradient(circle, ${
              isDarkMode 
                ? 'rgba(168, 85, 247, 0.7)' 
                : 'rgba(147, 51, 234, 0.3)'
            } 0%, transparent 70%)`
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Left side orb */}
        <motion.div
          className="absolute top-1/3 left-0 w-72 h-72 rounded-full blur-3xl"
          style={{
            background: `radial-gradient(circle, ${
              isDarkMode 
                ? 'rgba(196, 145, 255, 0.8)' 
                : 'rgba(168, 85, 247, 0.35)'
            } 0%, transparent 60%)`
          }}
          animate={{
            x: [-20, 20, -20],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 14,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Right side orb */}
        <motion.div
          className="absolute top-2/3 right-0 w-64 h-64 rounded-full blur-3xl"
          style={{
            background: `radial-gradient(circle, ${
              isDarkMode 
                ? 'rgba(221, 199, 255, 0.7)' 
                : 'rgba(192, 132, 252, 0.4)'
            } 0%, transparent 65%)`
          }}
          animate={{
            x: [20, -10, 20],
            y: [0, 25, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: 11,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Bottom glow */}
        <motion.div
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-32 blur-2xl"
          style={{
            background: `linear-gradient(to top, ${
              isDarkMode 
                ? 'rgba(147, 51, 234, 0.6)' 
                : 'rgba(147, 51, 234, 0.25)'
            } 0%, transparent 100%)`
          }}
          animate={{
            opacity: [0.6, 1, 0.6],
            scaleY: [1, 1.3, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-full blur-sm"
            style={{
              background: isDarkMode ? 'rgba(196, 145, 255, 0.9)' : 'rgba(168, 85, 247, 0.6)',
              left: `${20 + i * 15}%`,
              top: `${30 + i * 10}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.6, 1, 0.6],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + i,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          />
        ))}
      </div>
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          className="text-center mb-10"
          style={{ position: 'relative' }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-theme-primary mb-4 transition-colors duration-300">
            Success Stories
          </h2>
          <p className="text-xl text-theme-secondary transition-colors duration-300">
            Join thousands of students who've landed their dream internships
          </p>
        </motion.div>

        <motion.div 
          className="relative bg-theme-secondary rounded-2xl p-8 lg:p-12 border border-theme transition-colors duration-300 shadow-lg group"
          style={{ position: 'relative' }}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          whileHover={{ 
            boxShadow: "0 25px 50px -12px rgba(199, 0, 255, 0.25)",
          }}
        >
          {/* Gradient purple background on hover with animation */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-purple-500/30 to-pink-500/20 opacity-0 rounded-2xl pointer-events-none"
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="relative z-10"
            >
              <motion.div 
                className="flex items-center justify-center mb-6"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                {[...Array(currentTestimonial.rating)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, rotate: -180 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    transition={{ delay: 0.2 + i * 0.1, duration: 0.3 }}
                  >
                    <Star className="h-5 w-5 text-yellow-400 fill-current" />
                  </motion.div>
                ))}
              </motion.div>

              <motion.blockquote 
                className="text-xl text-theme-secondary text-center mb-8 leading-relaxed transition-colors duration-300"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.3 }}
              >
                "{currentTestimonial.content}"
              </motion.blockquote>

              <motion.div 
                className="text-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <motion.div 
                  className="bg-theme-accent text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 font-semibold relative overflow-hidden"
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className="relative z-10">{currentTestimonial.avatar}</span>
                  {/* Subtle glow effect */}
                  <motion.div
                    className="absolute inset-0 bg-white rounded-full pointer-events-none"
                    initial={{ scale: 1, opacity: 0 }}
                    whileHover={{ 
                      scale: 1.3,
                      opacity: 0.2,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.div>
                <div className="font-semibold text-theme-primary transition-colors duration-300">{currentTestimonial.name}</div>
                <div className="text-theme-secondary transition-colors duration-300">{currentTestimonial.role}</div>
                <div className="text-theme-accent font-medium mt-1">{currentTestimonial.company}</div>
              </motion.div>
            </motion.div>
          </AnimatePresence>

          {/* Simplified indicators - all visible with different purple intensities */}
          <motion.div 
            className="flex items-center justify-center mt-8 space-x-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            {testimonials.map((_, index) => (
              <motion.div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-500 ${
                  index === currentIndex 
                    ? 'bg-purple-500 shadow-lg shadow-purple-500/50 scale-110' 
                    : 'bg-purple-400/60'
                }`}
                animate={index === currentIndex ? { 
                  scale: [1, 1.2, 1],
                  boxShadow: ["0 0 0 rgba(168, 85, 247, 0.5)", "0 0 20px rgba(168, 85, 247, 0.8)", "0 0 0 rgba(168, 85, 247, 0.5)"]
                } : {}}
                transition={{ duration: 0.6, repeat: index === currentIndex ? Infinity : 0, repeatDelay: 2 }}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;