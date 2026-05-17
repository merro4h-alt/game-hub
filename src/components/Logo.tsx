import React from 'react';
import { motion } from 'motion/react';

interface LogoProps {
  className?: string;
  variant?: 'black' | 'gold' | 'white' | 'gradient';
}

const Logo: React.FC<LogoProps> = ({ className = "w-10 h-10", variant = 'gradient' }) => {
  // Simple, elegant arrow in a square logo (The "Basic" logo)
  const color = variant === 'black' ? '#1A1A1A' : variant === 'white' ? '#FFFFFF' : '#4F46E5';

  return (
    <motion.div 
      className={`${className} flex items-center justify-center`}
      whileHover={{ scale: 1.15, z: 50 }}
      transition={{ type: "spring", stiffness: 400, damping: 10 }}
    >
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Rounded Square */}
        <rect x="10" y="10" width="80" height="80" rx="20" className={variant === 'gradient' ? "fill-[#4F46E5]" : ""} fill={variant === 'gradient' ? undefined : "currentColor"} style={{ color: variant === 'gradient' ? undefined : color }} />
        {/* Upward Arrow */}
        <path d="M50 65V35M35 50L50 35L65 50" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </motion.div>
  );
};

export default Logo;
