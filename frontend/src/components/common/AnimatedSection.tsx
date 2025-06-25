import React from 'react';
import { motion, useInView } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useRef } from 'react';

interface AnimatedSectionProps {
  children: React.ReactNode;
  delay?: number; // delay in multiples of 0.1s (1 = 0.1s, 2 = 0.2s, etc.)
  className?: string;
  animation?: 'fade-in-up' | 'fade-in-up-md' | 'fade-in-up-lg' | 'scale' | 'slide-in' | 'blur' | 'bounce';
  duration?: number;
  once?: boolean; // animate only once
  amount?: number; // how much of the element should be in view before animation starts (0.1 to 1)
}

// Animation variants
const animationVariants: Record<string, Variants> = {
  'fade-in-up': {
    hidden: {
      opacity: 0,
      y: 20,
      filter: 'blur(2px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300,
      },
    },
  },
  'fade-in-up-md': {
    hidden: {
      opacity: 0,
      y: 30,
      filter: 'blur(4px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 250,
      },
    },
  },
  'fade-in-up-lg': {
    hidden: {
      opacity: 0,
      y: 40,
      filter: 'blur(6px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        type: 'spring',
        damping: 18,
        stiffness: 200,
      },
    },
  },
  'scale': {
    hidden: {
      opacity: 0,
      scale: 0.8,
      filter: 'blur(8px)',
    },
    visible: {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        type: 'spring',
        damping: 20,
        stiffness: 200,
      },
    },
  },
  'slide-in': {
    hidden: {
      opacity: 0,
      x: -50,
      filter: 'blur(4px)',
    },
    visible: {
      opacity: 1,
      x: 0,
      filter: 'blur(0px)',
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 300,
      },
    },
  },
  'blur': {
    hidden: {
      opacity: 0,
      filter: 'blur(20px)',
      scale: 1.1,
    },
    visible: {
      opacity: 1,
      filter: 'blur(0px)',
      scale: 1,
      transition: {
        type: 'tween',
        ease: 'easeOut',
      },
    },
  },
  'bounce': {
    hidden: {
      opacity: 0,
      y: 30,
      scale: 0.9,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        damping: 15,
        stiffness: 400,
      },
    },
  },
};

/**
 * AnimatedSection - A modern animation component using framer-motion
 * 
 * Usage examples:
 * <AnimatedSection>Content appears immediately</AnimatedSection>
 * <AnimatedSection delay={2}>Content appears after 0.2s</AnimatedSection>
 * <AnimatedSection animation="scale" delay={3}>Scale animation with 0.3s delay</AnimatedSection>
 * <AnimatedSection animation="bounce" once={false}>Bounces every time it comes into view</AnimatedSection>
 */
const AnimatedSection: React.FC<AnimatedSectionProps> = ({
  children,
  delay = 0,
  className = '',
  animation = 'fade-in-up',
  duration = 0.6,
  once = true,
  amount = 0.3,
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, amount });

  const variants = animationVariants[animation] || animationVariants['fade-in-up'];

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      transition={{
        duration,
        delay: delay * 0.1,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedSection; 