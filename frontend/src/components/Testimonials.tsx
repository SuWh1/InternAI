import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Sophomore at UC Berkeley",
    company: "Landed Google STEP 2024",
    content: "InternAI's roadmap was a game-changer. The weekly breakdown made everything manageable, and I never felt overwhelmed. The AI knew exactly what skills I needed to focus on.",
    rating: 5,
    avatar: "SC"
  },
  {
    name: "Marcus Rodriguez",
    role: "First-year at MIT",
    company: "Microsoft Explore Intern",
    content: "I was completely lost on where to start. InternAI gave me a clear path from beginner to interview-ready. The project suggestions were spot-on for my skill level.",
    rating: 5,
    avatar: "MR"
  },
  {
    name: "Emily Wang",
    role: "Career Switcher",
    company: "Amazon SDE Intern",
    content: "As someone switching from finance to tech, I needed a fast-track plan. InternAI's personalized approach helped me land an internship in just 6 months.",
    rating: 5,
    avatar: "EW"
  }
];

const Testimonials = () => {
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
    <section className="py-20 bg-theme-primary transition-colors duration-300 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          className="text-center mb-10"
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