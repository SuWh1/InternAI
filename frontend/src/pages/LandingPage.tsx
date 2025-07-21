import { motion, useScroll } from 'framer-motion';
import { useRef } from 'react';
import HeroSection from '../components/HeroSection';
import HowItWorks from '../components/HowItWorks';
import FaangToMango from '../components/FaangToMango';
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

  return (
    <div ref={containerRef} className="bg-theme-primary transition-colors duration-300 relative overflow-hidden">

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
        
        <AnimatedSection animation="fade-in-up" delay={2} amount={0.3}>
          <FaangToMango />
        </AnimatedSection>
        
        <AnimatedSection animation="scale" delay={3} amount={0.3}>
          <TargetAudience />
        </AnimatedSection>
        
        <AnimatedSection animation="fade-in-up" delay={4} amount={0.3}>
          <Testimonials />
        </AnimatedSection>
        
        <AnimatedSection animation="blur" delay={5} amount={0.3}>
          <FAQ />
        </AnimatedSection>
        
        <AnimatedSection animation="fade-in-up" delay={6} amount={0.5}>
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