import { GraduationCap, Code, Users } from 'lucide-react';
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "../utils/animations";

const audiences = [
  {
    icon: GraduationCap,
    title: "High School Students",
    description: "Just starting your CS journey? Perfect! We'll help you build foundational skills and create a timeline that works with your coursework.",
    color: "from-blue-500 to-purple-500",
  },
  {
    icon: Code,
    title: "University Students",
    description: "Ready to level up? Get advanced project ideas, interview prep strategies, and networking tips to stand out from the crowd.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Users,
    title: "Career Switchers",
    description: "Transitioning to tech? Our roadmaps account for your existing skills and fast-track you to internship readiness.",
    color: "from-pink-500 to-red-500",
  }
];

const TargetAudience = () => {
  return (
    <section className="py-20 bg-theme-primary transition-colors duration-300 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          className="text-center mb-16"
          style={{ position: 'relative' }}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-theme-primary mb-4 transition-colors duration-300">
            Who Is This For?
          </h2>
          <p className="text-xl text-theme-secondary max-w-2xl mx-auto transition-colors duration-300">
            Whether you're just starting out or looking to level up, we've got you covered
          </p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-3 gap-8"
          style={{ position: 'relative' }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {audiences.map((audience, index) => (
            <motion.div
              key={index}
              variants={staggerItem}
              whileHover={{ 
                y: -8,
                transition: { 
                  type: "spring", 
                  stiffness: 400,
                  damping: 17 
                }
              }}
              className="relative group"
            >
              <motion.div 
                className="bg-theme-secondary p-6 rounded-xl shadow-sm border border-theme transition-all duration-300 cursor-pointer flex flex-col items-center text-center h-full relative overflow-hidden"
                whileHover={{ 
                  boxShadow: "0 20px 40px -12px rgba(199, 0, 255, 0.35)",
                }}
              >
                {/* Gradient purple background on hover with animation */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-purple-500/30 to-pink-500/20 opacity-0 rounded-xl pointer-events-none"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />

                <motion.div 
                  className="bg-theme-accent/10 rounded-full w-16 h-16 flex items-center justify-center mb-6 group-hover:bg-theme-accent/20 transition-all duration-300 relative"
                  whileHover={{ 
                    rotate: 360,
                    scale: 1.1,
                  }}
                  transition={{ 
                    duration: 0.8,
                    type: "spring",
                    stiffness: 200
                  }}
                >
                  <audience.icon className="h-8 w-8 text-theme-accent relative z-10" />
                  {/* Glow effect */}
                  <motion.div
                    className="absolute inset-0 bg-theme-accent rounded-full pointer-events-none"
                    initial={{ scale: 1, opacity: 0 }}
                    whileHover={{ 
                      scale: 1.5,
                      opacity: 0.2,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.div>
                
                <h3 className="text-xl font-semibold text-theme-primary mb-4 transition-colors duration-300 relative z-10">
                  {audience.title}
                </h3>
                
                <p className="text-theme-secondary leading-relaxed transition-colors duration-300 relative z-10">
                  {audience.description}
                </p>

                {/* Animated underline */}
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-theme-accent to-transparent pointer-events-none"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default TargetAudience;