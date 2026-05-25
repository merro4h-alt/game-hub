import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import HeroSlider from '../components/HeroSlider';
import ProductCard from '../components/ProductCard';
import { useStore } from '../StoreContext';
import { INITIAL_PRODUCTS } from '../constants';
import { ListingSkeleton } from '../components/ProductSkeleton';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Quote, Sparkles, Flame, Tag, Clock, Copy, Check, Globe, Play, Flower2, Crown, Dumbbell, ChevronLeft, ChevronRight, Gift, ShieldCheck, Lock, RotateCcw, Truck, Award, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ReviewModal } from '../components/ReviewModal';
import { ShopTheLook } from '../components/ShopTheLook';

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
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Track scrolling progress to update dot indicator
  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        const totalScrollable = scrollWidth - clientWidth;
        if (totalScrollable > 0) {
          const absoluteScroll = Math.abs(scrollLeft);
          setScrollProgress(absoluteScroll / totalScrollable);
        }
      }
    };

    const currentScrollRef = scrollRef.current;
    if (currentScrollRef) {
      currentScrollRef.addEventListener('scroll', handleScroll, { passive: true });
      // Initial trigger
      handleScroll();
    }
    return () => {
      if (currentScrollRef) {
        currentScrollRef.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const isRTL = i18n.language === 'ar';
      let scrollAmount = 240;
      if (direction === 'left') {
        scrollAmount = isRTL ? 240 : -240;
      } else {
        scrollAmount = isRTL ? -240 : 240;
      }
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };
  const featuredProducts = useMemo(() => {
    // Sort by creation date descending so newest additions are shown first
    return [...products].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    }).slice(0, 4);
  }, [products]);

  const promoProduct = useMemo(() => {
    return products.find(p => p.videoUrl) || INITIAL_PRODUCTS.find(p => p.videoUrl);
  }, [products]);

  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const categories = [
    { key: 'new', label: t('categories.new'), icon: <Sparkles size={14} />, category: 'New' },
    { key: 'bestSeller', label: t('categories.bestSeller'), icon: <Flame size={14} />, category: 'Best Seller' },
    { key: 'offers', label: t('categories.offers'), icon: <Tag size={14} />, category: 'Offers' },
    { key: 'fashionBeauty', label: t('categories.fashionBeauty'), icon: <Crown size={14} />, category: 'Fashion & Beauty' },
    { key: 'sports', label: t('categories.sports'), icon: <Dumbbell size={14} />, category: 'Sports' },
    { key: 'imported', label: i18n.language === 'ar' ? 'مستوردة' : 'Imported', icon: <Globe size={14} />, category: 'Imported' },
  ];

  return (
    <div className="bg-[#0A0A0B] text-white min-h-screen">
      <HeroSlider />

      {/* Elegant Swipeable Category Slider */}
      <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-8 z-20 group/slider">
        {/* Left Arrow (visible on mobile and desktop) */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-2 md:left-10 top-1/2 -translate-y-1/2 p-2.5 md:p-3 rounded-full bg-brand-charcoal/90 hover:bg-[#4F46E5] text-white border border-white/10 hover:border-transparent opacity-100 md:opacity-0 md:group-hover/slider:opacity-100 hover:scale-110 transition-all duration-300 pointer-events-auto z-30 shadow-lg cursor-pointer"
          aria-label="Previous Category"
        >
          <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
        </button>

        {/* Swipeable container with touch & mouse drag support */}
        <div 
          ref={scrollRef}
          onMouseDown={(e) => {
            const ele = scrollRef.current;
            if (!ele) return;
            const startX = e.pageX - ele.offsetLeft;
            const scrollLeft = ele.scrollLeft;
            
            const handleMouseMove = (le: MouseEvent) => {
              const x = le.pageX - ele.offsetLeft;
              const walk = (x - startX) * 1.5; // scroll-speed
              ele.scrollLeft = scrollLeft - walk;
            };
            
            const handleMouseUp = () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
          className="flex whitespace-nowrap overflow-x-auto no-scrollbar scroll-smooth gap-3 md:gap-4 py-4 px-2 relative touch-pan-x select-none cursor-grab active:cursor-grabbing"
        >
          {categories.map((cat, index) => (
            <motion.div
              key={cat.key}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.08, type: "spring", stiffness: 150 }}
              className="shrink-0"
            >
              <Link
                to={`/shop?category=${encodeURIComponent(cat.category)}`}
                className="group px-4 py-3 md:px-6 md:py-4 bg-[#0F0F11]/90 hover:bg-[#151518] border border-white/5 hover:border-[#4F46E5]/50 rounded-2xl hover:shadow-2xl hover:shadow-[#4F46E5]/15 hover:-translate-y-1 transition-all duration-300 flex items-center gap-3 md:gap-4.5 pointer-events-auto"
                draggable="false"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl bg-white/5 group-hover:bg-[#4F46E5]/12 text-[#4F46E5] group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-inner shrink-0">
                  {cat.icon}
                </div>
                <div className="flex flex-col text-start">
                  <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.1em] md:tracking-[0.15em] text-white transition-colors group-hover:text-[#4F46E5]">
                    {cat.label}
                  </span>
                  <span className="text-[7px] md:text-[8px] text-white/40 group-hover:text-white/60 transition-colors uppercase font-mono tracking-widest mt-1">
                    {i18n.language === 'ar' ? 'تصفح الآن' : 'EXPLORE'}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Right Arrow (visible on mobile and desktop) */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-2 md:right-10 top-1/2 -translate-y-1/2 p-2.5 md:p-3 rounded-full bg-brand-charcoal/90 hover:bg-[#4F46E5] text-white border border-white/10 hover:border-transparent opacity-100 md:opacity-0 md:group-hover/slider:opacity-100 hover:scale-110 transition-all duration-300 pointer-events-auto z-30 shadow-lg cursor-pointer"
          aria-label="Next Category"
        >
          <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
        </button>

        {/* Modern Dot Scroll indicator for mobile */}
        <div className="flex justify-center gap-1.5 mt-2 md:hidden">
          {categories.map((cat, idx) => {
            const activeIdx = Math.min(
              categories.length - 1,
              Math.max(0, Math.floor(scrollProgress * (categories.length - 1) + 0.5))
            );
            return (
              <div
                key={cat.key}
                className={`h-1 rounded-full transition-all duration-300 ${
                  activeIdx === idx ? 'w-4 bg-[#4F46E5]' : 'w-1 bg-white/20'
                }`}
              />
            );
          })}
        </div>
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
                  key={`${product.id}-${index}`} 
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
          
        </div>
      </section>

      <ShopTheLook />

      {/* AI Gift Advisor Section Callout */}
      <section className="py-24 relative overflow-hidden bg-black/40 border-t border-b border-white/5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="bg-gradient-to-br from-[#121213] to-[#1A1A1E] p-10 md:p-16 rounded-[3rem] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-12 shadow-2xl">
            <div className="max-w-2xl space-y-6 text-left rtl:text-right">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-gold/15 text-[#EAD8B1] border border-brand-gold/20 rounded-full text-[10px] font-black uppercase tracking-widest leading-none">
                <Sparkles size={12} className="text-[#C5A031]" />
                {i18n.language === 'ar' ? 'مستشار الهدايا الذكي' : 'AI Smart Concept'}
              </span>
              <h3 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                {i18n.language === 'ar' ? 'مستشار الهدايا الذكي والانتقاء الفوري' : 'Confused About What Gift to Buy?'} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C5A05B] to-[#EAD8B1] italic font-serif">
                  {i18n.language === 'ar' ? 'دع الذكاء الاصطناعي ينتقيها لك' : 'Let AI Choose from our catalog'}
                </span>
              </h3>
              <p className="text-white/55 text-base font-light leading-relaxed">
                {i18n.language === 'ar'
                  ? 'أجب عن بضعة أسئلة بسيطة وسيرشح لك مستشار الهدايا تفاصيل كروت الإهداء الملائمة وأجود المنتجات لميزانيتك بدعم من نماذج Gemini.'
                  : 'Answer simple questions and let our Gemini-guided model suggest the finest products from our lifestyle inventory with custom greetings and packaging guides.'}
              </p>
            </div>
            
            <Link 
              to="/gift-advisor" 
              className="px-10 py-5 bg-[#C5A05B] hover:bg-[#EAD8B1] text-[#0A0A0B] font-black uppercase text-xs tracking-widest rounded-2xl transition-all shadow-xl shadow-brand-gold/15 flex items-center gap-2 flex-shrink-0 cursor-pointer"
            >
              <Gift size={16} />
              {i18n.language === 'ar' ? 'جرّب الانتقاء الذكي الآن' : 'Try Smart Advisor'}
            </Link>
          </div>
        </div>
      </section>

      {/* 100% Secure & Golden Guarantees Section */}
      <section id="trust-guarantees-section" className="py-24 relative overflow-hidden bg-gradient-to-b from-black/20 to-black/80 border-b border-white/5">
        <div className="absolute inset-0 max-w-7xl mx-auto pointer-events-none">
          <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-[#C5A031]/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-[20%] left-[-10%] w-[400px] h-[400px] bg-green-500/5 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col items-center text-center mb-16 space-y-4"
          >
            <span className="text-[#C5A05B] font-black uppercase tracking-[0.3em] text-[10px] px-4 py-1.5 bg-[#C5A05B]/10 rounded-full border border-[#C5A05B]/20 flex items-center gap-2">
              <ShieldCheck size={12} />
              {i18n.language === 'ar' ? 'تسوق آمن ومضمون 100%' : '100% CERTIFIED SECURE STORE'}
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white uppercase leading-tight">
              {i18n.language === 'ar' ? 'رحلتك الشرائية محميّة بالكامل' : 'Your Shopping Journey is Fully Protected'} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C5A05B] via-green-400 to-[#EAD8B1] font-serif italic font-medium">
                {i18n.language === 'ar' ? 'شعارنا: الصدق، الجودة، والأمان التام' : 'Our Creed: Integrity, Quality & Safety First'}
              </span>
            </h2>
            <p className="text-white/50 text-sm max-w-2xl leading-relaxed">
              {i18n.language === 'ar'
                ? 'في متجر اونكس فاي كسرنا كل حواجز التردد. نلتزم بأعلى معايير موثوقية المستهلك لنمنحك تجربة دفع واستلام سلسة خالية من أي قلق.'
                : 'At ONXIFI, we break every custom barrier. We commit to the highest tier of buyer protections to give you a smooth, anxiety-free lifestyle experience.'}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                titleAr: 'الدفع عند الاستلام بمرونة',
                titleEn: 'Flexible Cash on Delivery',
                descAr: 'لا حاجة للدفع الفوري مسبقاً! نفخر بتقديم خيار الدفع عند الاستلام لتعاين جودة ومقاس منتجك بنفسك قبل أن تسلّم هللة واحدة.',
                descEn: 'Zero pre-payment pressure. We proudly offer Cash on Delivery so you inspect dimensions, texture, and quality before paying.',
                icon: <Truck size={24} className="text-[#C5A05B]" />,
                badgeAr: 'الخيار الأكثر أماناً',
                badgeEn: 'Safest Choice',
                color: 'group-hover:text-[#C5A05B] bg-[#C5A05B]/10 border-[#C5A05B]/20 animate-pulse'
              },
              {
                titleAr: 'الضمان الذهبي للاسترجاع',
                titleEn: 'Golden Return Guarantee',
                descAr: 'استرجاع فوري وسهل خلال 14 يوماً من استلام الشحنة إذا لم يطابق المنتج توقعاتك بالكامل. بدون أسئلة محرجة أو تعقيد.',
                descEn: 'Fully transparent, prompt refunds within 14 days of receiving your item if it does not meet your standard. Hassle-free.',
                icon: <RotateCcw size={24} className="text-amber-400" />,
                badgeAr: 'حماية كاملة',
                badgeEn: 'Full Protection',
                color: 'group-hover:text-amber-400 bg-amber-400/10 border-amber-400/20'
              },
              {
                titleAr: 'تشفير بوابات بالكامل SSL',
                titleEn: 'SSL Secure Encrypted Connection',
                descAr: 'نقوم بتشفير وحماية كافة الدفعات الإلكترونية (مدى، فيزا، مستركارد، آبل باي) بأحدث بروتوكولات الأمان العالمية 256-bit ذات الموثوقية العالية.',
                descEn: 'All digit transactions (Mada, Apple Pay, Cards) run through dynamic military-grade 256-bit encryption. Your details never touch our servers.',
                icon: <Lock size={24} className="text-green-400" />,
                badgeAr: 'معتمد دولياً',
                badgeEn: 'Secure SSL',
                color: 'group-hover:text-green-400 bg-green-500/10 border-green-500/20'
              },
              {
                titleAr: 'منتجات أصلية 100% مع فحص الجودة',
                titleEn: '100% Authentic & QC Checked',
                descAr: 'كل قطعة يتم اختيارها وتوريدها من مصادرها الرسمية مباشرة وتخضع لفحص يدوي دقيق لضمان سلامتها وخلوها من العيوب تماماً.',
                descEn: 'Every item passes thorough physical inspection before dispatching. We hold official partnerships ensuring authentic premium status.',
                icon: <Award size={24} className="text-blue-400" />,
                badgeAr: 'أصلي 100%',
                badgeEn: '100% Genuine',
                color: 'group-hover:text-blue-400 bg-blue-500/10 border-blue-500/20'
              },
              {
                titleAr: 'فريق دعم عملاء بشري كفؤ 24/7',
                titleEn: 'Human Care Premium Support',
                descAr: 'لا تتعامل مع آلات! فريق دعم عملاء بشري كفؤ متواجد لخدمتك عبر واتساب طوال اليوم لحل مشكلتك وتتبع شحنتك فوراً.',
                descEn: 'No automated bots. Our dedicated service managers communicate with you on WhatsApp in real-time, responding in seconds.',
                icon: <MessageCircle size={24} className="text-[#25D366]" />,
                badgeAr: 'متصل الآن بالواتساب',
                badgeEn: 'Always Online',
                color: 'group-hover:text-[#25D366] bg-[#25D366]/10 border-[#25D366]/20'
              },
              {
                titleAr: 'رقم تتبع حي لكل شحنة',
                titleEn: 'Live Shipment Tracking Code',
                descAr: 'احصل على تحديثات لحظيّة عبر الرسائل النصية والبريد لمعرفة مكان طردك بدقة وتوقيت وصوله المتوقع دقيقة بدقيقة.',
                descEn: 'SMS alerts and email notifications instantly stream live tracking updates directly so you can see your parcel cargo state live.',
                icon: <Sparkles size={24} className="text-pink-400" />,
                badgeAr: 'شفافية كاملة',
                badgeEn: 'Full Transparency',
                color: 'group-hover:text-pink-400 bg-pink-500/10 border-pink-500/20'
              }
            ].map((guarantee, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="bg-[#111112] border border-white/5 p-8 rounded-[2.5rem] flex flex-col justify-between group hover:bg-[#151517] hover:border-white/10 hover:shadow-2xl transition-all duration-500 relative overflow-hidden"
              >
                {/* Background ambient lighting */}
                <div className="absolute right-0 top-0 w-24 h-24 bg-white/1 rounded-full blur-xl group-hover:bg-[#C5A05B]/5 group-hover:scale-150 transition-all duration-700" />
                
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-500 ${guarantee.color}`}>
                      {guarantee.icon}
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-white/5 text-white/40 border border-white/5 rounded-full">
                      {i18n.language === 'ar' ? guarantee.badgeAr : guarantee.badgeEn}
                    </span>
                  </div>

                  <div className="space-y-2 text-start">
                    <h3 className="text-lg font-bold text-white group-hover:text-[#C5A05B] transition-colors duration-300">
                      {i18n.language === 'ar' ? guarantee.titleAr : guarantee.titleEn}
                    </h3>
                    <p className="text-white/40 text-[13px] leading-relaxed font-light">
                      {i18n.language === 'ar' ? guarantee.descAr : guarantee.descEn}
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-white/5 flex items-center gap-1.5 text-[10px] uppercase font-black tracking-widest text-[#C5A05B]">
                  <ShieldCheck size={14} className="text-green-500" />
                  <span>{i18n.language === 'ar' ? 'ضمان معتمد رسميّاً' : 'Officially Certified'}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

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
