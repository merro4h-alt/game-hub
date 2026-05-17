import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useStore } from '../StoreContext';

const DEFAULT_SLIDES = [
  {
    id: 'd1',
    title: 'New Arrivals',
    subtitle: 'Fashion & Beauty',
    description: 'Discover the latest trends in high-end fashion and beauty products.',
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1920',
    link: '/shop'
  },
  {
    id: 'd2',
    title: 'The Glow Collection',
    subtitle: 'Cosmetics',
    description: 'Premium skincare and makeup for a natural, healthy radiance.',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?auto=format&fit=crop&q=80&w=1920',
    link: '/shop'
  },
  {
    id: 'd3',
    title: 'Active Life',
    subtitle: 'Sports Gear',
    description: 'Professional performance gear for your daily fitness journey.',
    image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=1920',
    link: '/shop'
  },
  {
    id: 'd4',
    title: '15% Off First Order',
    subtitle: 'Exclusive Offer',
    description: 'Join the inner circle and unlock a special discount on your first purchase.',
    image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&q=80&w=1920',
    link: '/shop'
  },
];

const HeroSlider: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { products, campaigns } = useStore();

  const dynamicSlides = useMemo(() => {
    const now = new Date();
    const fiveDaysInMs = 5 * 24 * 60 * 60 * 1000;

    // Get active hero campaigns (including auto-generated for products)
    const activeCampaigns = campaigns
      .filter(c => {
        const isBasicActive = c.isActive && c.type === 'hero';
        if (!c.endDate) return isBasicActive;
        // Parse date safely
        const end = new Date(c.endDate);
        return isBasicActive && end > now;
      })
      .map(c => ({
        id: c.id,
        title: c.title,
        subtitle: c.subtitle || (i18n.language === 'ar' ? 'عرض خاص' : 'Special Offer'),
        description: c.description || '',
        image: c.image,
        link: c.link,
        isCampaign: true,
        priority: 2
      }));

    // Filter products created within the last 5 days (backup/legacy logic)
    const recentProducts = products
      .filter(product => {
        if (!product.createdAt) return false;
        
        const createdDate = new Date(product.createdAt);
        const time = (product.createdAt.seconds) ? product.createdAt.seconds * 1000 : createdDate.getTime();
        
        return (now.getTime() - time) <= fiveDaysInMs;
      })
      .filter(p => !activeCampaigns.some(c => c.link.includes(p.id))); // Avoid duplicates if already in campaigns

    if (recentProducts.length > 0 || activeCampaigns.length > 0) {
      // Map these products to slide format
      const productSlides = recentProducts.map(p => ({
        id: p.id,
        title: p.name,
        subtitle: i18n.language === 'ar' ? 'وصل حديثاً' : 'Just Arrived',
        description: p.description,
        image: p.image,
        link: `/product/${p.id}`,
        price: p.price,
        isNew: true
      }));

      const combinedSlides = [...activeCampaigns, ...productSlides];

      // If we have very few slides, mix with some default ones
      if (combinedSlides.length < 3) {
        return [...combinedSlides, ...DEFAULT_SLIDES.slice(0, 3 - combinedSlides.length)];
      }

      return combinedSlides.slice(0, 7); // Max 7 slides
    }

    return DEFAULT_SLIDES;
  }, [products, campaigns, i18n.language]);

  const activeSlides = dynamicSlides;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev >= activeSlides.length - 1 ? 0 : prev + 1));
    }, 6000);
    return () => clearInterval(timer);
  }, [activeSlides.length]);

  const next = () => setCurrent((prev) => (prev >= activeSlides.length - 1 ? 0 : prev + 1));
  const prev = () => setCurrent((prev) => (prev === 0 ? activeSlides.length - 1 : prev - 1));

  if (activeSlides.length === 0) return null;

  return (
    <section className="relative h-[85vh] w-full overflow-hidden bg-[#0A0A0B]">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSlides[current].id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 1.2, ease: [0.19, 1, 0.22, 1] }}
          className="absolute inset-0"
        >
          {/* Refined Gradient Overlays - Subtle & Less Obscuring */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
          
          <img
            src={activeSlides[current].image}
            alt={activeSlides[current].title}
            className="w-full h-full object-cover object-center"
            referrerPolicy="no-referrer"
          />
          
          <div className="absolute inset-0 z-20 flex items-center justify-start px-8 md:px-24">
            <div className={`max-w-4xl ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, type: "spring" }}
                className="flex flex-col gap-4 mb-6"
              >
                <div 
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/10 ${
                    (activeSlides[current] as any).isNew ? 'bg-brand-gold/20 text-brand-gold' : 'bg-white/10'
                  } backdrop-blur-md w-fit overflow-hidden relative group`}
                >
                  <span className="relative z-10 text-[11px] font-black uppercase tracking-[.4em]">
                    {(activeSlides[current] as any).isNew ? (
                      <span className="flex items-center gap-2">
                        <Sparkles size={12} className="animate-pulse" />
                        {i18n.language === 'ar' ? 'وصل حديثاً للمتجر' : 'NEW ARRIVAL'}
                      </span>
                    ) : (activeSlides[current].subtitle)}
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="space-y-4"
              >
                <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white leading-[1] tracking-tighter uppercase drop-shadow-2xl">
                  {activeSlides[current].title}
                </h1>
                
                {(activeSlides[current] as any).price && (
                  <div className="flex items-center gap-4">
                    <span className="text-3xl md:text-5xl font-mono text-brand-gold font-black drop-shadow-lg">
                      ${(activeSlides[current] as any).price}
                    </span>
                    <div className="h-px w-24 bg-brand-gold/30" />
                  </div>
                )}
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="text-white/80 text-base md:text-xl max-w-xl mt-6 mb-10 font-medium leading-relaxed tracking-wide line-clamp-2 drop-shadow-md"
              >
                {activeSlides[current].description}
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
              >
                <button 
                  onClick={() => navigate((activeSlides[current] as any).link)}
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
      {activeSlides.length > 1 && (
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
      )}

      {/* Modern Indicators */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-16 left-8 md:left-24 z-30 flex items-center space-x-3 rtl:space-x-reverse">
          {activeSlides.map((_, i) => (
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
      )}
    </section>
  );
};

export default HeroSlider;
