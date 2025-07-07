import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, staggerItem } from "../utils/animations";

const faqs = [
  {
    question: "What is MANGO?",
    answer: "MANGO is a new acronym gaining traction to represent the leading tech companies, including Meta, Apple, Nvidia, Google, and OpenAI, reflecting a shift in industry influence beyond the traditional FAANG group with the rise of AI-focused firms."
  },
  {
    question: "How does the AI create my personalized roadmap?",
    answer: "Our AI analyzes your current skills, target internship, available study time, and learning preferences to create a custom roadmap. It considers factors like your academic year, prior experience, and specific company requirements to generate weekly goals and project recommendations."
  },
  {
    question: "Is InternAI really free?",
    answer: "Yes! Creating your personalized roadmap is completely free to use."
  },
  {
    question: "How long does it take to complete a roadmap?",
    answer: "Roadmaps typically around 3 months depending on your starting point and target internship. The AI creates realistic timelines based on your available study hours per week and current skill level."
  },
  {
    question: "What companies does InternAI prepare me for?",
    answer: "Out major focus is on MANGO companies, prep for technical background, interview process, projects and more."
  },
  {
    question: "Can I update my roadmap if my goals change?",
    answer: "Absolutely! Your roadmap is dynamic and can be updated anytime. If you decide to target a different company or your availability changes, just let us know and we'll regenerate your plan accordingly."
  },
  {
    question: "Do I need programming experience to start?",
    answer: "Not at all! Our AI creates roadmaps for complete beginners through advanced students. If you're just starting out, your roadmap will include foundational programming concepts before moving to more advanced topics."
  }
];

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div 
          className="text-center mb-12"
          style={{ position: 'relative' }}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-theme-primary mb-4 transition-colors duration-300">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-theme-secondary transition-colors duration-300">
            Everything you need to know about InternAI
          </p>
        </motion.div>

        <motion.div 
          className="max-w-3xl mx-auto"
          style={{ position: 'relative' }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
        >
          {faqs.map((faq, index) => (
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
              className="relative overflow-hidden group"
            >
              <motion.div 
                className="bg-theme-secondary rounded-xl border border-theme overflow-hidden transition-colors duration-300 relative cursor-pointer"
                animate={{
                  borderColor: openIndex === index ? 'var(--border-hover)' : 'var(--border)',
                }}
                whileHover={{
                  borderColor: 'var(--border-hover)',
                }}
                transition={{ duration: 0.3 }}
              >
                {/* Gradient purple background on hover with animation */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-purple-500/30 to-pink-500/20 opacity-0 rounded-xl pointer-events-none"
                  initial={{ opacity: 0 }}
                  whileHover={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />

                <motion.button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-6 text-left flex items-center justify-between transition-all duration-300 relative z-10 outline-none focus:outline-none"
                >
                  <span className="font-semibold text-theme-primary transition-colors duration-300 pr-4">{faq.question}</span>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
                    className="flex-shrink-0"
                  >
                    {openIndex === index ? (
                      <ChevronUp className="h-5 w-5 text-purple-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-purple-500" />
                    )}
                  </motion.div>
                </motion.button>
                
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ 
                        height: { duration: 0.5, ease: [0.04, 0.62, 0.23, 0.98] },
                        opacity: { duration: 0.4, delay: 0.1 }
                      }}
                      className="overflow-hidden"
                    >
                      <motion.div 
                        className="px-6 pb-6"
                        initial={{ y: -10 }}
                        animate={{ y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                      >
                        <p className="text-theme-secondary leading-relaxed transition-colors duration-300">{faq.answer}</p>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Animated underline */}
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent pointer-events-none"
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

export default FAQ;