import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'black' | 'gold' | 'white' | 'gradient';
}

const Logo: React.FC<LogoProps> = ({ className = "w-10 h-10", variant = 'gradient' }) => {
  if (variant === 'gradient') {
    return (
      <div className={`${className} bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-[30%] flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 transform rotate-6`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-1/2 h-1/2 transform -rotate-6">
           <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
      </div>
    );
  }

  const color = variant === 'black' ? '#000000' : variant === 'gold' ? '#D4AF37' : '#FFFFFF';

  return (
    <div className={`${className} rounded-[30%] flex items-center justify-center transform rotate-6 shadow-sm`} style={{ backgroundColor: variant === 'white' ? '#000000' : 'transparent', border: `2px solid ${color}` }}>
      <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-1/2 h-1/2 transform -rotate-6">
         <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </div>
  );
};

export default Logo;
