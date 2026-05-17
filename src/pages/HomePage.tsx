import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import HeroSlider from '../components/HeroSlider';
import ProductCard from '../components/ProductCard';
import { LoyaltyBanner } from '../components/LoyaltyBanner';
import { useStore } from '../StoreContext';
import { INITIAL_PRODUCTS } from '../constants';
import { ListingSkeleton } from '../components/ProductSkeleton';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Quote, Sparkles, Flame, Tag, Clock, Copy, Check, Globe, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ReviewModal } from '../components/ReviewModal';

const DiscountSection = () => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isVisible, setIsVisible] = useState(true);
  
  // Expiry date (1 week from May 3rd, 2026)
  const expiryDate = new Date('2026-05-10T22:15:31Z');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = expiryDate.getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        setIsVisible(false);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText('START15');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isVisible) return null;

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-20 relative overflow-hidden">
      <div className="relative rounded-[4rem] bg-[#0A0A0B] overflow-hidden p-8 md:p-20 text-center border border-white/5">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[80%] bg-[#4F46E5]/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[80%] bg-[#7C3AED]/20 rounded-full blur-[120px]" />
        </div>
        
        <div className="relative z-10 max-w-3xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 text-[#4F46E5] text-[10px] font-black uppercase tracking-[0.4em] mb-8"
          >
            <Clock size={14} className="animate-pulse" />
            <span>عرض الطلب الأول - ينتهي قريباً</span>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-6xl font-black text-white mb-10 tracking-tighter"
          >
            خصم 15% على أول طلب لك
          </motion.h2>

          {/* Countdown Grid */}
          <div className="grid grid-cols-4 gap-3 sm:gap-6 max-w-sm mx-auto mb-16">
            {[
              { label: isArabic ? 'يوم' : 'Days', value: timeLeft.days },
              { label: isArabic ? 'ساعة' : 'Hours', value: timeLeft.hours },
              { label: isArabic ? 'دقيقة' : 'Mins', value: timeLeft.minutes },
              { label: isArabic ? 'ثانية' : 'Secs', value: timeLeft.seconds }
            ].map((unit, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
                <div className="text-xl md:text-3xl font-mono font-black text-white mb-1">
                  {String(unit.value).padStart(2, '0')}
                </div>
                <div className="text-[7px] uppercase font-black text-white/30 tracking-widest">
                  {unit.label}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2rem] p-2 pr-2 flex items-center group shadow-2xl"
            >
              <div className="px-8 py-4 border-r border-white/10">
                <p className="text-white/30 text-[8px] uppercase font-black tracking-[0.3em] mb-1">كود الخصم</p>
                <p className="text-2xl md:text-4xl font-mono font-black text-white tracking-widest">START15</p>
              </div>
              <button 
                onClick={handleCopy}
                className={`ml-2 px-8 py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] transition-all duration-500 overflow-hidden relative ${
                  copied 
                    ? 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]' 
                    : 'bg-[#4F46E5] text-white hover:bg-white hover:text-black shadow-lg shadow-indigo-500/20'
                }`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'تم النسخ!' : 'نسخ الكود'}
                </span>
                {/* Shine Animation */}
                <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] group-hover:left-[200%] transition-all duration-1000 ease-in-out" />
              </button>
            </motion.div>

            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-white/40 text-sm max-w-md mx-auto leading-relaxed border-t border-white/5 pt-8"
            >
              Join our exclusive club for priority access to new collection launches, style tips, and private sale events.
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
};

const HomePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { products, isLoading } = useStore();
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const featuredProducts = useMemo(() => {
    // Show a mix of categories including the newest ones
    return [...products].reverse().slice(0, 4);
  }, [products]);

  const promoProduct = useMemo(() => {
    return products.find(p => p.videoUrl) || INITIAL_PRODUCTS.find(p => p.videoUrl);
  }, [products]);

  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const categories = [
    { key: 'new', label: t('categories.new'), icon: <Sparkles size={14} />, category: 'New' },
    { key: 'bestSeller', label: t('categories.bestSeller'), icon: <Flame size={14} />, category: 'Best Seller' },
    { key: 'offers', label: t('categories.offers'), icon: <Tag size={14} />, category: 'Offers' },
    { key: 'imported', label: i18n.language === 'ar' ? 'مستوردة' : 'Imported', icon: <Globe size={14} />, category: 'Imported' },
  ];

  return (
    <div className="bg-[#0A0A0B] text-white min-h-screen">
      <HeroSlider />

      {/* Centered Category Buttons - Moved to top for better accessibility */}
      <div className="flex justify-center flex-wrap gap-4 px-4 py-8 relative z-20">
        {categories.map((cat, index) => (
          <motion.div
            key={cat.key}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.1, type: "spring", stiffness: 200 }}
          >
            <Link
              to={`/shop?category=${encodeURIComponent(cat.category)}`}
              className="group px-6 py-3 bg-white dark:bg-white/5 border border-brand-charcoal/5 dark:border-white/10 rounded-2xl hover:shadow-2xl hover:shadow-[#4F46E5]/10 hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 whitespace-nowrap"
            >
              <div className="text-[#4F46E5] group-hover:scale-110 group-hover:rotate-6 transition-transform">
                {cat.icon}
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-charcoal dark:text-white transition-colors group-hover:text-[#4F46E5]">
                {cat.label}
              </span>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Shiny Storefront Welcome badge */}
      <div id="storefront-welcome" className="relative z-20 mb-12 flex justify-center px-4">
          <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="relative group cursor-pointer"
        >
          <div className="absolute inset-0 bg-brand-gold blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
          <div className="relative px-8 py-3 bg-brand-gold border border-white/20 rounded-full overflow-hidden shadow-[0_10px_30px_-10px_rgba(197,160,91,0.5)]">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
            <div className="flex items-center gap-3">
              <Sparkles size={16} className="text-brand-charcoal" />
              <span className="text-brand-charcoal text-[11px] font-black uppercase tracking-[0.4em] whitespace-nowrap">
                {t('home.firstChoice')}
              </span>
              <Sparkles size={16} className="text-brand-charcoal" />
            </div>
          </div>
        </motion.div>
      </div>

      <section className="py-24 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center text-center mb-20 gap-8"
          >
            <div className="flex flex-col items-center">
              <span className="text-[#4F46E5] font-black uppercase tracking-[0.3em] text-xs mb-4 block">{t('home.selection')}</span>
              <h2 className="text-5xl md:text-6xl font-black tracking-tighter uppercase text-white">{t('home.featured')}</h2>
              <div className="h-1.5 w-24 bg-gradient-to-r from-[#4F46E5] via-purple-500 to-[#4F46E5] rounded-full mt-6" />
            </div>
            
            <Link 
              to="/shop" 
              className="group relative px-10 py-5 bg-[#0A0A0B] rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-[0_20px_50px_rgba(79,70,229,0.2)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#4F46E5] to-purple-600 opacity-90 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="relative flex items-center gap-4 text-white font-black text-xs uppercase tracking-[0.3em]">
                {t('home.exploreAll')}
                <div className="bg-white/10 p-1 rounded-full group-hover:bg-white/20 transition-colors">
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Products Container */}
          {isLoading ? (
            <ListingSkeleton count={4} />
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-8">
              {featuredProducts.map((product, index) => (
                <motion.div 
                  key={product.id} 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          )}
          
          <LoyaltyBanner />
        </div>
      </section>

      {/* Video Promo Section */}
      {promoProduct && (
        <section id="promo-video-section" className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="relative min-h-[550px] md:min-h-0 md:aspect-[21/9] rounded-[3rem] overflow-hidden group border border-white/10 shadow-2xl">
              <video 
                src={promoProduct.videoUrl} 
                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700"
                muted
                loop
                autoPlay
                playsInline
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="space-y-6"
                >
                  <span className="inline-block px-4 py-1.5 rounded-full bg-brand-gold text-black text-[10px] font-black uppercase tracking-[0.2em]">
                    {i18n.language === 'ar' ? 'عرض خاص' : 'Featured Ad'}
                  </span>
                  <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-white tracking-tighter">
                    {promoProduct.name}
                  </h2>
                  <p className="text-sm sm:text-base md:text-lg text-white/70 max-w-2xl mx-auto font-medium">
                    {promoProduct.description}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                    <button
                      onClick={() => setIsVideoModalOpen(true)}
                      className="group flex items-center gap-3 bg-brand-gold py-4 px-10 rounded-full text-brand-charcoal font-black uppercase tracking-widest text-xs hover:bg-white transition-all hover:scale-105 active:scale-95 shadow-xl shadow-brand-gold/20"
                    >
                      {i18n.language === 'ar' ? 'شاهد الإعلان الآن' : 'Watch Official Ad'}
                    </button>
                    <Link
                      to="/shop"
                      className="group flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 py-4 px-10 rounded-full text-white font-black uppercase tracking-widest text-xs hover:bg-white hover:text-brand-charcoal transition-all hover:scale-105 active:scale-95"
                    >
                      {i18n.language === 'ar' ? 'تسوق الآن' : 'Shop Now'}
                      <ArrowRight size={18} />
                    </Link>
                  </div>
                </motion.div>
              </div>

            </div>
          </div>
        </section>
      )}


      {/* Full Screen Video Modal */}
      <AnimatePresence>
        {isVideoModalOpen && promoProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-6xl aspect-video bg-black rounded-none md:rounded-3xl overflow-hidden shadow-2xl border border-white/10"
            >
              <video
                key={promoProduct.videoUrl}
                controls
                autoPlay
                muted
                playsInline
                className="w-full h-full object-contain"
              >
                <source src={promoProduct.videoUrl} type="video/mp4" />
                <p className="text-white text-center">Your browser does not support the video tag. <a href={promoProduct.videoUrl} className="underline">Download</a></p>
              </video>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-20 backdrop-blur-md border border-white/20"
              >
                <ArrowRight className="rotate-45" size={20} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modern Philosophy Section */}
      <section className="py-40 bg-[#0A0A0B] overflow-hidden relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#4F46E5]/10 rounded-full blur-[120px]" />
        
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-8xl font-black text-white tracking-tighter mb-12 leading-[1.05]">
              Elegance is not about being noticed, it's about being <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-gold via-[#4F46E5] to-brand-gold italic font-serif">remembered.</span>
            </h2>
            <Link 
              to="/about"
              className="inline-block px-12 py-5 rounded-full border border-white/20 text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-white hover:text-black transition-all duration-500 backdrop-blur-sm"
            >
              Our Philosophy
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Discount Section (Moved and Styled) */}
      <DiscountSection />

      {/* Compact Customer Reviews Section */}
      <section className="py-20 bg-white/5 border-t border-white/5">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center justify-center mb-12">
            <div className="w-12 h-12 bg-brand-gold/10 text-brand-gold rounded-full flex items-center justify-center mb-4">
              <Quote size={24} fill="currentColor" className="opacity-50" />
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tighter text-white uppercase text-center">
              {t('reviews.title')}
            </h2>
            <div className="w-12 h-1 bg-brand-gold mt-4 rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[1, 2, 3].map((num) => (
                <motion.div
                key={num}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="bg-[#1A1A1A] border border-white/10 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span 
                      key={i} 
                      className={`text-sm ${i < Number(t(`reviews.items.${num}.stars`)) ? 'text-[#4F46E5]' : 'text-white/10'}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-sm font-light text-white/70 mb-6 italic line-clamp-3 leading-relaxed">
                   "{t(`reviews.items.${num}.comment`)}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#4F46E5]/10 text-[#4F46E5] flex items-center justify-center text-xs font-bold border border-[#4F46E5]/20">
                    {t(`reviews.items.${num}.name`)[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-[10px] tracking-widest uppercase text-white">
                      {t(`reviews.items.${num}.name`)}
                    </h4>
                    <span className="text-[8px] text-white/40 uppercase tracking-tighter">Verified</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-12">
            <button
              onClick={() => setIsReviewOpen(true)}
              className="px-10 py-5 bg-[#4F46E5] text-white rounded-full font-bold tracking-widest uppercase text-xs hover:bg-white hover:text-black transition-all duration-500 shadow-lg flex items-center gap-3 mx-auto group"
            >
              <Quote size={16} className="text-brand-gold" />
              {t('reviews.addReview')}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      <ReviewModal isOpen={isReviewOpen} onClose={() => setIsReviewOpen(false)} />
    </div>
  );
};

export default HomePage;
