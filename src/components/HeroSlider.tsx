import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const slides = [
  {
    id: 1,
    title: 'New Arrivals',
    subtitle: 'Fashion & Beauty',
    description: 'Discover the latest trends in high-end fashion and beauty products.',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1920',
  },
  {
    id: 2,
    title: 'The Glow Collection',
    subtitle: 'Cosmetics',
    description: 'Premium skincare and makeup for a natural, healthy radiance.',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?auto=format&fit=crop&q=80&w=1920',
  },
  {
    id: 3,
    title: 'Active Life',
    subtitle: 'Sports Gear',
    description: 'Professional performance gear for your daily fitness journey.',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=1920',
  },
  {
    id: 4,
    title: '15% Off First Order',
    subtitle: 'Exclusive Offer',
    description: 'Join the inner circle and unlock a special discount on your first purchase.',
    image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=1920',
  },
];

const HeroSlider: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const next = () => setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  const prev = () => setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  return (
    <section className="relative h-[85vh] w-full overflow-hidden bg-[#0A0A0B]">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.15 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.5, ease: [0.19, 1, 0.22, 1] }}
          className="absolute inset-0"
        >
          {/* Vibrant Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#4F46E5]/20 via-transparent to-transparent z-10" />
          
          <img
            src={slides[current].image}
            alt={slides[current].title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          
          <div className="absolute inset-0 z-20 flex items-center justify-center px-8 md:px-24">
            <div className="max-w-4xl text-center">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
                className="flex flex-col items-center gap-4 mb-8"
              >
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md w-fit overflow-hidden relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-gold/40 to-transparent animate-shimmer" />
                  <span className="relative z-10 text-brand-gold text-[11px] font-black uppercase tracking-[.4em]">
                    {t('home.firstChoice')}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="h-0.5 w-8 bg-brand-gold/50" />
                  <span className="text-white/80 uppercase tracking-[0.4em] text-[10px] font-black">
                    {slides[current].subtitle}
                  </span>
                  <div className="h-0.5 w-8 bg-brand-gold/50" />
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, type: "spring", damping: 12 }}
                className="text-6xl md:text-9xl font-black text-white mb-8 tracking-tighter leading-[0.9] uppercase"
              >
                {slides[current].title}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="text-white text-lg md:text-xl max-w-2xl mx-auto mb-12 font-medium leading-relaxed tracking-wide"
              >
                {slides[current].description}
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
              >
                <button 
                  onClick={() => navigate('/shop')}
                  className="group relative px-12 py-5 bg-white text-black font-black rounded-2xl overflow-hidden transition-all duration-500 hover:text-white"
                >
                  <div className="absolute inset-0 w-0 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] transition-all duration-500 group-hover:w-full" />
                  <span className="relative z-10">{t('home.shopNow')}</span>
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation - Glassmorphism */}
      <div className="absolute bottom-12 right-8 md:right-24 z-30 flex gap-4">
        <button
          onClick={prev}
          className="p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-white hover:bg-[#4F46E5] hover:border-[#4F46E5] transition-all duration-300"
        >
          <ChevronLeft size={28} />
        </button>
        <button
          onClick={next}
          className="p-4 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-white hover:bg-[#4F46E5] hover:border-[#4F46E5] transition-all duration-300"
        >
          <ChevronRight size={28} />
        </button>
      </div>

      {/* Modern Indicators */}
      <div className="absolute bottom-16 left-8 md:left-24 z-30 flex items-center space-x-3 rtl:space-x-reverse">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`transition-all duration-700 rounded-full ${
              current === i 
                ? 'w-12 h-2.5 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED]' 
                : 'w-2.5 h-2.5 bg-white/20 hover:bg-white/40'
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroSlider;
