import React from 'react';
import { motion } from 'motion/react';

interface LogoProps {
  className?: string;
  variant?: 'emblem' | 'full' | 'black' | 'white' | 'gold' | 'gradient';
}

const Logo: React.FC<LogoProps> = ({ 
  className = "w-12 h-12", 
  variant = 'gradient'
}) => {
  // Select gradient colors based on variant
  const getGradientColors = () => {
    if (variant === 'black') {
      return (
        <linearGradient id="logo-arrow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1A1A1A" />
          <stop offset="100%" stopColor="#000000" />
        </linearGradient>
      );
    }
    if (variant === 'white') {
      return (
        <linearGradient id="logo-arrow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F8FAFC" />
        </linearGradient>
      );
    }
    if (variant === 'gold') {
      return (
        <linearGradient id="logo-arrow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF2C2" />
          <stop offset="50%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      );
    }
    
    // Default trending up purple/indigo gradient matching the favicon precisely
    return (
      <linearGradient id="logo-arrow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4F46E5" />
        <stop offset="100%" stopColor="#7C3AED" />
      </linearGradient>
    );
  };

  const isWhite = variant === 'white';

  return (
    <motion.div 
      className={`${className} flex items-center justify-center flex-shrink-0`}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 350, damping: 18 }}
    >
      <svg 
        viewBox="0 0 512 512" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          {getGradientColors()}
        </defs>
        
        {/* Whole logo content with 6 degree rotation (tilted to the right slightly) and larger scale (0.96) to make the box bigger */}
        <g transform="translate(256, 256) rotate(6) scale(0.96) translate(-256, -256)">
          {/* Rounded rect matching the original favicon style */}
          <rect 
            width="460" 
            height="460" 
            x="26" 
            y="26" 
            rx="100" 
            fill="url(#logo-arrow-gradient)" 
          />
          
          {/* Shrunk and centered arrow (shrunk by an extra 0.76 scale) */}
          <g transform="translate(256, 256) scale(0.76) translate(-256, -256)">
            <path 
              d="M256 380V132M156 232l100-100 100 100" 
              stroke={isWhite ? "#1A1A1A" : "white"} 
              strokeWidth="56" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              fill="none" 
            />
          </g>
        </g>
      </svg>
    </motion.div>
  );
};

export default Logo;
