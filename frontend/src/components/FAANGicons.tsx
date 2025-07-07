import { motion } from "framer-motion";

const icons = [
  { src: "/purpleIcons/icons8-meta.svg", alt: "Meta" },
  { src: "/purpleIcons/icons8-apple.svg", alt: "Amazon" },
  { src: "/purpleIcons/icons8-nvidia.svg", alt: "Apple" },
  { src: "/purpleIcons/icons8-google.svg", alt: "Netflix" },
  { src: "/purpleIcons/icons8-openai.svg", alt: "Google" },
];

export default function FAANGIcons() {
  return (
    <span className="inline-flex items-center space-x-1 px-1">
      {icons.map((icon, idx) => (
        <motion.img
          key={icon.alt}
          src={icon.src}
          alt={icon.alt}
          className="w-4 h-4 md:w-6 md:h-6 inline-block align-bottom"
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
