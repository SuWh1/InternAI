import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import HeroSection from '../components/HeroSection';
import HowItWorks from '../components/HowItWorks';
import TargetAudience from '../components/TargetAudience';
import Testimonials from '../components/Testimonials';
import FAQ from '../components/FAQ';
import Footer from '../components/Footer';
import AnimatedSection from '../components/common/AnimatedSection';

const LandingPage = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Parallax transforms
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const backgroundOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.5, 0.3]);

  return (
    <div ref={containerRef} className="min-h-screen bg-theme-primary transition-colors duration-300 relative">
      {/* Animated background gradient */}
      <motion.div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle at 50% 50%, rgba(199, 0, 255, 0.1) 0%, transparent 70%)",
          y: backgroundY,
          opacity: backgroundOpacity,
        }}
      />

      {/* Floating particles background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-theme-accent rounded-full opacity-30"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              x: Math.random() * window.innerWidth,
              y: [null, -100],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 5,
            }}
          />
        ))}
      </div>

      {/* Content sections with enhanced animations */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        <AnimatedSection animation="fade-in-up">
          <HeroSection />
        </AnimatedSection>
        
        <AnimatedSection animation="fade-in-up" delay={1} amount={0.3}>
          <HowItWorks />
        </AnimatedSection>
        
        <AnimatedSection animation="scale" delay={2} amount={0.3}>
          <TargetAudience />
        </AnimatedSection>
        
        <AnimatedSection animation="fade-in-up" delay={3} amount={0.3}>
          <Testimonials />
        </AnimatedSection>
        
        <AnimatedSection animation="blur" delay={4} amount={0.3}>
          <FAQ />
        </AnimatedSection>
        
        <AnimatedSection animation="fade-in-up" delay={5} amount={0.5}>
          <Footer />
        </AnimatedSection>
      </motion.div>

      {/* Scroll progress indicator */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-theme-accent z-50 transform-origin-left"
        style={{ scaleX: scrollYProgress }}
      />
    </div>
  );
};

export default LandingPage;