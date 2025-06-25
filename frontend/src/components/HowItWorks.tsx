import { MessageSquare, BookOpen, RocketIcon } from "lucide-react";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "../utils/animations";

const steps = [
  {
    icon: MessageSquare,
    title: "Tell Us About You",
    description:
      "Answer a few questions about your background, goals, and learning preferences in our friendly onboarding form.",
    color: "from-blue-500 to-purple-500",
  },
  {
    icon: BookOpen,
    title: "AI Creates Your Plan",
    description:
      "Our AI analyzes your profile and generates a personalized roadmap with weekly goals, projects, and resources.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: RocketIcon,
    title: "Follow & Succeed",
    description:
      "Track your progress, complete tasks, and land that dream internship with confidence and preparation.",
    color: "from-pink-500 to-red-500",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 bg-theme-secondary transition-colors duration-300 relative overflow-hidden">
      {/* Animated background pattern */}
      <motion.div
        className="absolute inset-0 opacity-5"
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%"],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            #C700FF,
            #C700FF 10px,
            transparent 10px,
            transparent 20px
          )`,
          backgroundSize: "28px 28px",
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-theme-primary mb-4 transition-colors duration-300">
            How It Works
          </h2>
          <p className="text-xl text-theme-secondary max-w-2xl mx-auto transition-colors duration-300">
            From zero to internship-ready in three simple steps
          </p>
        </motion.div>

        <motion.div 
          className="grid md:grid-cols-3 gap-8 lg:gap-12 relative"
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {/* Animated connection lines */}
          <svg className="absolute top-1/2 left-0 w-full h-2 -translate-y-1/2 hidden md:block pointer-events-none">
            <motion.line
              x1="16.67%"
              y1="50%"
              x2="50%"
              y2="50%"
              stroke="url(#gradient1)"
              strokeWidth="2"
              strokeDasharray="5 5"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.5 }}
            />
            <motion.line
              x1="50%"
              y1="50%"
              x2="83.33%"
              y2="50%"
              stroke="url(#gradient2)"
              strokeWidth="2"
              strokeDasharray="5 5"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.8 }}
            />
            <defs>
              <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#A855F7" />
              </linearGradient>
              <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#A855F7" />
                <stop offset="100%" stopColor="#EC4899" />
              </linearGradient>
            </defs>
          </svg>

          {steps.map((step, index) => (
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
                className="text-center group bg-theme-secondary p-6 rounded-lg shadow-sm transition-all duration-300 border border-theme h-full relative overflow-hidden cursor-pointer"
                whileHover={{ 
                  boxShadow: "0 20px 40px -12px rgba(199, 0, 255, 0.35)",
                }}
              >
                {/* Gradient purple background on hover with animation */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-purple-500/30 to-pink-500/20 opacity-0 rounded-lg pointer-events-none"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />

                <motion.div 
                  className="bg-theme-accent/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 group-hover:bg-theme-accent/20 transition-all duration-300 relative"
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
                  <step.icon className="h-8 w-8 text-theme-accent relative z-10" />
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
                  {step.title}
                </h3>

                <p className="text-theme-secondary leading-relaxed transition-colors duration-300 relative z-10">
                  {step.description}
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

export default HowItWorks;
