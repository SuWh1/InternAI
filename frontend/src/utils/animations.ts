import type { Variants } from 'framer-motion';

// Spring configurations
export const springConfig = {
  gentle: {
    type: "spring" as const,
    damping: 25,
    stiffness: 300,
  },
  bouncy: {
    type: "spring" as const,
    damping: 15,
    stiffness: 400,
  },
  smooth: {
    type: "spring" as const,
    damping: 30,
    stiffness: 200,
  },
};

// Common animation variants
export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: springConfig.gentle,
  },
};

export const fadeInScale: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: springConfig.smooth,
  },
};

export const slideInLeft: Variants = {
  hidden: {
    opacity: 0,
    x: -50,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: springConfig.gentle,
  },
};

export const slideInRight: Variants = {
  hidden: {
    opacity: 0,
    x: 50,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: springConfig.gentle,
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: springConfig.gentle,
  },
};

// Hover animations
export const hoverScale = {
  scale: 1.05,
  transition: {
    type: "spring" as const,
    stiffness: 400,
    damping: 10,
  },
};

export const hoverGlow = {
  boxShadow: "0 0 25px rgba(199, 0, 255, 0.5)",
  transition: {
    duration: 0.3,
  },
};

// Tap animations
export const tapScale = {
  scale: 0.95,
  transition: {
    type: "spring" as const,
    stiffness: 400,
    damping: 17,
  },
};

// Floating animation
export const floatingAnimation = {
  y: [0, -10, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut" as const,
  },
};

// Pulse animation
export const pulseAnimation = {
  scale: [1, 1.05, 1],
  opacity: [1, 0.8, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut" as const,
  },
};

// Shimmer effect
export const shimmerAnimation = {
  x: ["-100%", "100%"],
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: "linear" as const,
  },
}; 