import React from 'react';
import { motion } from 'framer-motion';

interface ToggleSwitchOption {
  value: string;
  label: string;
}

interface ToggleSwitchProps {
  value: string;
  onChange: (value: string) => void;
  options: ToggleSwitchOption[];
  className?: string;
  fullWidth?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  value,
  onChange,
  options,
  className = '',
  fullWidth = false
}) => {
  return (
    <div className={`relative ${fullWidth ? 'flex' : 'inline-flex'} bg-theme-hover rounded-lg p-1 ${className}`}>
      {options.map((option, index) => (
        <div key={option.value} className={`relative ${fullWidth ? 'flex-1' : ''}`}>
          <button
            onClick={() => onChange(option.value)}
            className={`relative z-10 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${fullWidth ? 'w-full' : ''} ${
              value === option.value
                ? 'text-white'
                : 'text-theme-secondary hover:text-theme-primary'
            }`}
          >
            {option.label}
          </button>
          {value === option.value && (
            <motion.div
              layoutId="toggle-background"
              className="absolute inset-0 bg-green-500 rounded-md"
              initial={false}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default ToggleSwitch;