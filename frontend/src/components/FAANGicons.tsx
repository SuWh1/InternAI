import { motion } from "framer-motion";

const icons = [
  { src: "/icons8-meta.svg", alt: "Meta" },
  { src: "/icons8-amazon.svg", alt: "Amazon" },
  { src: "/icons8-apple.svg", alt: "Apple" },
  { src: "/icons8-netflix.svg", alt: "Netflix" },
  { src: "/icons8-google.svg", alt: "Google" },
];

export default function FAANGIcons() {
  return (
    <span className="inline-flex items-center -space-x-2 px-2">
      {icons.map((icon, idx) => (
        <motion.img
          key={icon.alt}
          src={icon.src}
          alt={icon.alt}
          className="w-11 h-11 md:w-16 md:h-16"
          initial={{ opacity: 0, y: 10, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.5,
            delay: 0.2 + idx * 0.1,
            type: "spring",
            stiffness: 180,
          }}
          whileHover={{
            scale: 1.2,
            rotate: [0, 5, -5, 0],
            transition: { duration: 0.4, repeat: Infinity, repeatType: "reverse" },
          }}
        />
      ))}
    </span>
  );
}
