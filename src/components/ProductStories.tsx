import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../StoreContext';
import { Sparkles, Flame, Check, Play, ChevronLeft, ChevronRight, X, Volume2, VolumeX, Eye, Gift, Heart, Send, ShoppingBag, ShoppingCart } from 'lucide-react';

interface StorySlide {
  mediaUrl: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  interactiveType: 'poll' | 'slider' | 'reveal';
  interactiveData: {
    questionAr: string;
    questionEn: string;
    // For Poll
    optionsAr?: string[];
    optionsEn?: string[];
    // For Reveal
    promoCode?: string;
  };
  productId: string;
  discountPriceAr?: string;
  discountPriceEn?: string;
}

interface UserStory {
  id: string;
  usernameAr: string;
  usernameEn: string;
  avatar: string;
  isLive?: boolean;
  slides: StorySlide[];
}

const STORIES_DATA: UserStory[] = [
  {
    id: 'story-glow',
    usernameAr: 'توهج الطبيعة ✨',
    usernameEn: 'Nature Glow ✨',
    avatar: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=150',
    isLive: true,
    slides: [
      {
        mediaUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800',
        titleAr: 'سيروم النضارة العميقة',
        titleEn: 'Hydrating Glow Serum',
        subtitleAr: 'بشرة زجاجية وتغذية كاملة للجلد تضيق المسام وتخفف التجاعيد',
        subtitleEn: 'Deep glass-skin hydration for complete cell revitalization.',
        interactiveType: 'slider',
        interactiveData: {
          questionAr: 'كم تقيمين درجة لمعان السيروم على اليد؟ 😍',
          questionEn: 'Rate the glowing effect of this serum! 😍'
        },
        productId: '2'
      },
      {
        mediaUrl: 'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=800',
        titleAr: 'روتين الترطيب اليومي',
        titleEn: 'Daily Routine Must-Have',
        subtitleAr: 'يوفر تغطية رطبة تدوم طوال النهار دون لمعان دهني مزعج',
        subtitleEn: 'Locks in active moisture for up to 24 hours with no oily residue.',
        interactiveType: 'poll',
        interactiveData: {
          questionAr: 'هل تفضلين روتين العناية الصباحي أم المسائي؟',
          questionEn: 'Do you prefer morning or night skincare routine?',
          optionsAr: ['روتين صباحي ☀️', 'روتين مسائي 🌙'],
          optionsEn: ['Morning Routine ☀️', 'Night Routine 🌙']
        },
        productId: '2'
      }
    ]
  },
  {
    id: 'story-linen',
    usernameAr: 'الأناقة الصيفية 👔',
    usernameEn: 'Summer Linen 👔',
    avatar: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=150',
    slides: [
      {
        mediaUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=800',
        titleAr: 'قميص الكتان البارد',
        titleEn: 'Minimalist Linen Shirt',
        subtitleAr: 'تصميم مريح وأكمام قابلة للطي مناسب للأجواء الحارة للطلعات والعمل',
        subtitleEn: 'Super breathable premium flax linen suitable for beach and business casual.',
        interactiveType: 'poll',
        interactiveData: {
          questionAr: 'هل يعجبك تفصيل الياقة العريضة؟',
          questionEn: 'What do you think of this wide collar style?',
          optionsAr: ['أنيق وممتاز 🌟', 'أفضل المفتوحة أكثر ✂️'],
          optionsEn: ['Perfect & Stylish 🌟', 'Standard casual is best ✂️']
        },
        productId: '1'
      },
      {
        mediaUrl: 'https://images.unsplash.com/photo-1594938333021-348233568607?auto=format&fit=crop&q=80&w=800',
        titleAr: 'كود خصم حصري للستوري',
        titleEn: 'Exclusive Story Discount',
        subtitleAr: 'افتح الصندوق أدناه لتحصل على كود خصم مخفض لطلبات اليوم فقط',
        subtitleEn: 'Unlock the gift box below to receive your daily story voucher!',
        interactiveType: 'reveal',
        interactiveData: {
          questionAr: 'اضغط على السهم أدناه لفتح الهدية! 🎁',
          questionEn: 'Click below to reveal your story voucher! 🎁',
          promoCode: 'LINEN15'
        },
        productId: '1'
      }
    ]
  },
  {
    id: 'story-sneakers',
    usernameAr: 'الخطوة الفاخرة 👟',
    usernameEn: 'Lux Step 👟',
    avatar: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=150',
    isLive: false,
    slides: [
      {
        mediaUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800',
        titleAr: 'حذاء الجري الاحترافي Pro',
        titleEn: 'Pro Running Sneakers',
        subtitleAr: 'توسيد ديناميكي يحمي مفاصل الساق عند المشي والركض الطويل',
        subtitleEn: 'Aerated cushioning structure that enhances bounce and protects ankles.',
        interactiveType: 'slider',
        interactiveData: {
          questionAr: 'ما تقييمك لجرأة وقوة اللون الأحمر الناري؟ 🔥',
          questionEn: 'How do you rate this fiery red colorway? 🔥'
        },
        productId: '3'
      },
      {
        mediaUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=800',
        titleAr: 'متوفر الآن بألوان هادئة',
        titleEn: 'Minimalist Colors Available',
        subtitleAr: 'نوفر الآن درجات البيج والرمادي لمظهر كلاسيكي كاجوال مريح للعين',
        subtitleEn: 'Earth tones like beige, cool grey, and sand are now fully stocked.',
        interactiveType: 'poll',
        interactiveData: {
          questionAr: 'أي تصميم رياضي تفضل؟',
          questionEn: 'Which style suits your personality more?',
          optionsAr: ['ألوان نارية جريئة ⚡', 'ألوان ترابية هادئة ⛰️'],
          optionsEn: ['Bold & Vibrant ⚡', 'Quiet & Natural ⛰️']
        },
        productId: '3'
      }
    ]
  },
  {
    id: 'story-watch',
    usernameAr: 'ذكاء المستقبل ⌚',
    usernameEn: 'Future Tech ⌚',
    avatar: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=150',
    isLive: true,
    slides: [
      {
        mediaUrl: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=800',
        titleAr: 'Stealth Pro Smartwatch',
        titleEn: 'Stealth Pro Smartwatch',
        subtitleAr: 'ساعة الأعمال الرياضية الفاخرة مع نظام حماية وهيكل تيتانيوم متين',
        subtitleEn: 'High-end business smartwatch with dynamic dual smartwatch interfaces.',
        interactiveType: 'slider',
        interactiveData: {
          questionAr: 'كم تقيم حجم وتصميم الشاشة الدائرية؟ 🖥️',
          questionEn: 'Rate the premium circular dial frame styling! 🖥️'
        },
        productId: '4'
      },
      {
        mediaUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800',
        titleAr: 'تضم سماعات بلوتوث مدمجة!',
        titleEn: 'Built-in Hi-Fi Earbuds Inside!',
        subtitleAr: 'أعجوبة هندسية تفاعلية! اسحب للأعلى لكشف سماعات الأذن المخزنة داخل الساعة',
        subtitleEn: 'An absolute masterpiece. Flip open to reveal wireless dual buds built right in.',
        interactiveType: 'reveal',
        interactiveData: {
          questionAr: 'إليك كود الخصم المخفي بنسبة 25%! 💥',
          questionEn: 'Unlock the special 25% Off secret code! 💥',
          promoCode: 'STEALTH25'
        },
        productId: '4'
      }
    ]
  }
];

export const ProductStories: React.FC = () => {
  const { i18n, t } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const { products, addToCart, setIsCartOpen, formatPrice } = useStore();

  // Story playback state
  const [activeStoryIdx, setActiveStoryIdx] = useState<number | null>(null);
  const [activeSlideIdx, setActiveSlideIdx] = useState<number>(0);
  const [slideProgress, setSlideProgress] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [watchedStories, setWatchedStories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('onxifi_watched_stories');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Interactive Widget states (per slide key)
  const [pollClicks, setPollClicks] = useState<Record<string, number>>({}); // slideKey -> selectedOptionIndex
  const [sliderValues, setSliderValues] = useState<Record<string, number>>({}); // slideKey -> score value
  const [revealedCodes, setRevealedCodes] = useState<Record<string, boolean>>({}); // slideKey -> revealed boolean
  const [couponCopied, setCouponCopied] = useState<Record<string, boolean>>({}); // code -> copied state

  // Drag state for touch/drag navigation
  const [dragStartX, setDragStartX] = useState<number | null>(null);

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const slideDuration = 6000; // 6 seconds per slide

  // Persist watched state
  useEffect(() => {
    localStorage.setItem('onxifi_watched_stories', JSON.stringify(watchedStories));
  }, [watchedStories]);

  // Handle active slide progress timer
  useEffect(() => {
    if (activeStoryIdx === null) return;

    if (isPaused) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    const stepMs = 50;
    const increment = (stepMs / slideDuration) * 100;

    progressIntervalRef.current = setInterval(() => {
      setSlideProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressIntervalRef.current!);
          // Advance to next slide or next story
          handleNextSlide();
          return 0;
        }
        return prev + increment;
      });
    }, stepMs);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [activeStoryIdx, activeSlideIdx, isPaused]);

  // Open story model
  const openStory = (storyIndex: number) => {
    const story = STORIES_DATA[storyIndex];
    if (!watchedStories.includes(story.id)) {
      setWatchedStories((prev) => [...prev, story.id]);
    }
    setActiveStoryIdx(storyIndex);
    setActiveSlideIdx(0);
    setSlideProgress(0);
    setIsPaused(false);
  };

  // Close story model
  const closeStory = () => {
    setActiveStoryIdx(null);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  };

  const handleNextSlide = () => {
    if (activeStoryIdx === null) return;
    const currentStory = STORIES_DATA[activeStoryIdx];
    if (activeSlideIdx < currentStory.slides.length - 1) {
      setActiveSlideIdx((prev) => prev + 1);
      setSlideProgress(0);
    } else {
      // Go to next user story if available
      if (activeStoryIdx < STORIES_DATA.length - 1) {
        setActiveStoryIdx((prev) => prev! + 1);
        setActiveSlideIdx(0);
        setSlideProgress(0);
      } else {
        closeStory();
      }
    }
  };

  const handlePrevSlide = () => {
    if (activeStoryIdx === null) return;
    if (activeSlideIdx > 0) {
      setActiveSlideIdx((prev) => prev - 1);
      setSlideProgress(0);
    } else {
      // Go to previous user story
      if (activeStoryIdx > 0) {
        setActiveStoryIdx((prev) => prev! - 1);
        // set to last slide of prev story
        const prevStory = STORIES_DATA[activeStoryIdx - 1];
        setActiveSlideIdx(prevStory.slides.length - 1);
        setSlideProgress(0);
      } else {
        // restart current slide
        setSlideProgress(0);
      }
    }
  };

  // Current states helpers
  const currentStoryObj = activeStoryIdx !== null ? STORIES_DATA[activeStoryIdx] : null;
  const currentSlideObj = currentStoryObj ? currentStoryObj.slides[activeSlideIdx] : null;

  // Find linked product in real stores database, otherwise fallback standard mock data inside context
  const getLinkedProduct = (prodId: string) => {
    return products.find((p) => p.id === prodId);
  };

  const handleAddToCart = (productId: string) => {
    const p = getLinkedProduct(productId);
    if (p) {
      // Add to cart with defaults (first color/size)
      const color = p.colors?.[0] || 'Default';
      const size = p.sizes?.[0] || 'Default';
      addToCart(p, color, size, 1);
      setIsCartOpen(true);
      // Pause story playback to let user see cart drawer
      setIsPaused(true);
    }
  };

  // Custom Interactivity Handlers
  const currentSlideKey = currentStoryObj && currentSlideObj 
    ? `${currentStoryObj.id}-${activeSlideIdx}` 
    : '';

  const handlePollVote = (optionIndex: number) => {
    if (pollClicks[currentSlideKey] !== undefined) return; // already voted
    setPollClicks((prev) => ({
      ...prev,
      [currentSlideKey]: optionIndex
    }));
    // temporarily brief pause then let it continue playing
    setTimeout(() => {
      setIsPaused(false);
    }, 1200);
  };

  const handleSliderChange = (val: number) => {
    setSliderValues((prev) => ({
      ...prev,
      [currentSlideKey]: val
    }));
  };

  const handleSliderRelease = () => {
    setIsPaused(false);
  };

  const handleRevealBox = () => {
    setRevealedCodes((prev) => ({
      ...prev,
      [currentSlideKey]: true
    }));
  };

  const copyPromoCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCouponCopied((prev) => ({ ...prev, [code]: true }));
    setTimeout(() => {
      setCouponCopied((prev) => ({ ...prev, [code]: false }));
    }, 2000);
  };

  return (
    <div className="w-full py-6 px-4 md:px-8 border-b border-white/5 bg-[#070708] relative z-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
            </span>
            <h3 className="text-sm md:text-base font-black tracking-widest uppercase font-sans text-white/95">
              {isArabic ? 'ستوريز ONXIFI التفاعلية ⚡' : 'ONXIFI INTERACTIVE STORIES ⚡'}
            </h3>
          </div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20">
            {isArabic ? 'اضغط وتفاعل' : 'TAP & DISCOVER'}
          </span>
        </div>

        {/* Stories Row */}
        <div className="flex items-center gap-4 py-2 overflow-x-auto no-scrollbar scroll-smooth">
          {STORIES_DATA.map((story, idx) => {
            const isUnwatched = !watchedStories.includes(story.id);

            return (
              <button
                key={story.id}
                onClick={() => openStory(idx)}
                className="flex flex-col items-center gap-2 shrink-0 group focus:outline-none cursor-pointer"
              >
                {/* Ring & Avatar */}
                <div className="relative p-1">
                  {/* High Quality animated borders */}
                  {isUnwatched ? (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-rose-500 via-purple-500 to-amber-500 animate-spin" style={{ animationDuration: '6s' }} />
                  ) : (
                    <div className="absolute inset-0 rounded-full bg-stone-800" />
                  )}

                  {/* Inner Dark Spacer */}
                  <div className="relative p-[3px] bg-[#070708] rounded-full">
                    <img
                      src={story.avatar}
                      alt={isArabic ? story.usernameAr : story.usernameEn}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover group-hover:scale-105 transition-transform duration-300 border border-white/10"
                    />
                  </div>

                  {/* Live Badge */}
                  {story.isLive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-600 border border-[#070708] text-white text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md tracking-wider shadow-lg animate-pulse">
                      {isArabic ? 'مباشر' : 'LIVE'}
                    </span>
                  )}
                </div>

                {/* Username */}
                <span className="text-[10px] md:text-[11px] font-bold text-white/80 group-hover:text-white transition-colors">
                  {isArabic ? story.usernameAr : story.usernameEn}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Full-Screen Story Overlay Modal */}
      <AnimatePresence>
        {activeStoryIdx !== null && currentStoryObj && currentSlideObj && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[5000] flex items-center justify-center bg-stone-950/95 backdrop-blur-xl md:p-4 text-white"
            onClick={closeStory} // Tap outside also closes or can be configured
          >
            {/* Main Story Panel Container */}
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-sm md:max-w-md h-full md:h-[840px] md:rounded-[2.5rem] overflow-hidden bg-stone-900 border border-white/5 flex flex-col justify-between shadow-[0_0_50px_rgba(0,0,0,0.8)]"
              onClick={(e) => e.stopPropagation()} // Stop propagation to avoid overlay close
            >
              {/* Slide Background Image */}
              <div className="absolute inset-0 w-full h-full">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/85 z-10" />
                <img
                  src={currentSlideObj.mediaUrl}
                  alt="Story background"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* TOP CONTROLS CONTENT (Segmented Progress Bars + Header info) */}
              <div className="relative z-20 p-4 pt-6">
                {/* Horizontal progress segments */}
                <div className="flex gap-1 mb-4">
                  {currentStoryObj.slides.map((_, index) => {
                    let fill = 0;
                    if (index < activeSlideIdx) fill = 100;
                    if (index === activeSlideIdx) fill = slideProgress;

                    return (
                      <div key={index} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-rose-400 transition-all duration-75 ease-linear rounded-full"
                          style={{ width: `${fill}%` }}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Sender Header Profile */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={currentStoryObj.avatar}
                      alt="Avatar"
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover border border-white/20 shadow-md"
                    />
                    <div>
                      <div className="text-xs font-black tracking-wide">
                        {isArabic ? currentStoryObj.usernameAr : currentStoryObj.usernameEn}
                      </div>
                      <div className="text-[9px] text-white/50 font-medium">
                        {isArabic ? 'ستوري ترويجي' : 'PROMO STORY'}
                      </div>
                    </div>
                  </div>

                  {/* Pause, Close and play status buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsPaused(!isPaused)}
                      className="p-1 px-2.5 bg-black/40 hover:bg-black/60 rounded-full border border-white/10 text-[9px] font-bold tracking-widest uppercase flex items-center gap-1 cursor-pointer transition-all"
                    >
                      {isPaused ? (
                        <>
                          <Play size={10} className="fill-white" /> {isArabic ? 'تشغيل' : 'RESUME'}
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> {isArabic ? 'إيقاف' : 'PAUSE'}
                        </>
                      )}
                    </button>

                    <button
                      onClick={closeStory}
                      className="p-1 px-2.5 bg-red-600 hover:bg-red-500 rounded-full border border-red-500/25 text-[9px] font-extrabold flex items-center gap-1 cursor-pointer transition-all shadow-lg"
                      title={isArabic ? 'إلغاء عرض الستوري' : 'Dismiss Story'}
                    >
                      <X size={11} strokeWidth={3} />
                      <span>{isArabic ? 'إلغاء العرض' : 'EXIT'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* TAP TAPS FOR AREA NAVIGATION */}
              <div className="absolute inset-0 z-10 flex w-full h-full pointer-events-none">
                {/* Left Area Tap */}
                <div
                  className="w-1/4 h-2/3 pointer-events-auto cursor-pointer"
                  onClick={handlePrevSlide}
                />
                {/* Middle Area for Interactions (Doesn't navigation) */}
                <div className="w-2/4 h-2/3" />
                {/* Right Area Tap */}
                <div
                  className="w-1/4 h-2/3 pointer-events-auto cursor-pointer"
                  onClick={handleNextSlide}
                />
              </div>

              {/* INTERACTIVE WIDGET & DETAILS (Floating in the center-down) */}
              <div className="relative z-20 px-6 pb-6 flex flex-col items-center flex-grow justify-end max-w-sm mx-auto w-full">
                
                {/* Core Title Details & Slow reveal info */}
                <div className="w-full text-center space-y-1 mb-6">
                  <motion.h4
                    key={`title-${activeSlideIdx}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-lg md:text-xl font-black tracking-tight"
                  >
                    {isArabic ? currentSlideObj.titleAr : currentSlideObj.titleEn}
                  </motion.h4>
                  <p className="text-[11px] md:text-xs text-white/70 line-clamp-2 px-1">
                    {isArabic ? currentSlideObj.subtitleAr : currentSlideObj.subtitleEn}
                  </p>
                </div>

                {/* THE DYNAMIC INTERACTIVE WIDGET MODULE */}
                <motion.div
                  key={`widget-${activeSlideIdx}`}
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ type: 'spring', damping: 18 }}
                  className="w-full bg-white/10 backdrop-blur-md rounded-3xl p-4 border border-white/10 shadow-2xl relative overflow-hidden mb-6"
                  onMouseEnter={() => setIsPaused(true)}
                  onTouchStart={() => setIsPaused(true)}
                >
                  <div className="text-xs font-black text-center mb-3">
                    {isArabic ? currentSlideObj.interactiveData.questionAr : currentSlideObj.interactiveData.questionEn}
                  </div>

                  {/* 1. Poll Widget style */}
                  {currentSlideObj.interactiveType === 'poll' && (
                    <div className="flex flex-col gap-2">
                      {isArabic ? (
                        currentSlideObj.interactiveData.optionsAr?.map((option, optIdx) => {
                          const isVoted = pollClicks[currentSlideKey] !== undefined;
                          const hasSelectedThis = pollClicks[currentSlideKey] === optIdx;
                          // fake responsive results when clicked
                          const votePct = optIdx === 0 ? 74 : 26;

                          return (
                            <button
                              key={optIdx}
                              disabled={isVoted}
                              onClick={() => handlePollVote(optIdx)}
                              className={`relative py-3.5 px-4 rounded-2xl font-bold text-xs text-start transition-all overflow-hidden ${
                                isVoted 
                                  ? 'bg-white/5 border border-white/5 text-white/50' 
                                  : 'bg-white/15 hover:bg-white/25 border border-white/10 text-white cursor-pointer active:scale-98'
                              }`}
                            >
                              {/* Background loading bar when voted */}
                              {isVoted && (
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${votePct}%` }}
                                  transition={{ duration: 0.6 }}
                                  className={`absolute top-0 bottom-0 left-0 ${
                                    hasSelectedThis ? 'bg-indigo-600/30' : 'bg-white/10'
                                  }`}
                                />
                              )}
                              
                              <div className="relative z-10 flex items-center justify-between">
                                <span>{option}</span>
                                {isVoted && (
                                  <span className="font-extrabold text-white">
                                    {votePct}% {hasSelectedThis && '✓'}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        currentSlideObj.interactiveData.optionsEn?.map((option, optIdx) => {
                          const isVoted = pollClicks[currentSlideKey] !== undefined;
                          const hasSelectedThis = pollClicks[currentSlideKey] === optIdx;
                          const votePct = optIdx === 0 ? 74 : 26;

                          return (
                            <button
                              key={optIdx}
                              disabled={isVoted}
                              onClick={() => handlePollVote(optIdx)}
                              className={`relative py-3.5 px-4 rounded-2xl font-bold text-xs text-start transition-all overflow-hidden ${
                                isVoted 
                                  ? 'bg-white/5 border border-white/5 text-white/50' 
                                  : 'bg-white/15 hover:bg-white/25 border border-white/10 text-white cursor-pointer active:scale-98'
                              }`}
                            >
                              {isVoted && (
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${votePct}%` }}
                                  transition={{ duration: 0.6 }}
                                  className={`absolute top-0 bottom-0 left-0 ${
                                    hasSelectedThis ? 'bg-indigo-600/30' : 'bg-white/10'
                                  }`}
                                />
                              )}
                              
                              <div className="relative z-10 flex items-center justify-between">
                                <span>{option}</span>
                                {isVoted && (
                                  <span className="font-extrabold text-white">
                                    {votePct}% {hasSelectedThis && '✓'}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* 2. Range Rating Emoji Slider Widget */}
                  {currentSlideObj.interactiveType === 'slider' && (
                    <div className="flex flex-col items-center">
                      {/* Morphing Emoji indicator */}
                      <div className="text-4xl mb-2 transition-transform duration-100 scale-110">
                        {(sliderValues[currentSlideKey] || 50) < 30 ? '😐' : (sliderValues[currentSlideKey] || 50) < 70 ? '😊' : '😍'}
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sliderValues[currentSlideKey] || 50}
                        onChange={(e) => handleSliderChange(Number(e.target.value))}
                        onMouseUp={handleSliderRelease}
                        onTouchEnd={handleSliderRelease}
                        className="w-full h-2 rounded-lg bg-white/20 appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
                      />
                      <div className="flex justify-between w-full text-[9px] text-white/40 mt-1 uppercase font-mono">
                        <span>{isArabic ? 'عادي' : 'Okay'}</span>
                        <span>{isArabic ? 'رهيب!' : 'Incredible!'}</span>
                      </div>
                    </div>
                  )}

                  {/* 3. Reveal Code / Gift coupon code interactive module */}
                  {currentSlideObj.interactiveType === 'reveal' && (
                    <div className="flex flex-col items-center text-center">
                      {!revealedCodes[currentSlideKey] ? (
                        <button
                          onClick={handleRevealBox}
                          className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-stone-900 flex items-center justify-center gap-2 font-black uppercase text-xs tracking-wider cursor-pointer shadow-lg animate-bounce"
                        >
                          <Gift size={16} />
                          {isArabic ? 'افتح الهدية الترويجية 🎁' : 'Unlock Story Voucher 🎁'}
                        </button>
                      ) : (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="w-full bg-[#1c1c24] border border-white/10 rounded-2xl p-3 flex flex-col items-center"
                        >
                          <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mb-1">
                            {isArabic ? 'كود الخصم الحصري' : 'YOUR EXCLUSIVE VOUCHER'}
                          </p>
                          <div className="flex items-center gap-2 bg-stone-900 border border-white/5 rounded-xl px-4 py-2.5 font-mono text-base md:text-lg font-black tracking-widest text-[#ebb354] w-full justify-between">
                            <span>{currentSlideObj.interactiveData.promoCode}</span>
                            <button
                              onClick={() => copyPromoCode(currentSlideObj.interactiveData.promoCode || '')}
                              className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-colors shrink-0 ${
                                couponCopied[currentSlideObj.interactiveData.promoCode || '']
                                  ? 'bg-green-500 text-stone-900'
                                  : 'bg-white/10 text-white hover:bg-white/20'
                              }`}
                            >
                              {couponCopied[currentSlideObj.interactiveData.promoCode || ''] ? (isArabic ? 'تم النسخ!' : 'COPIED!') : (isArabic ? 'نسخ الكود' : 'COPY')}
                            </button>
                          </div>
                          <span className="text-[8px] text-zinc-500 font-medium mt-1">
                            {isArabic ? 'يُطبق تلقائياً عند الدفع لخصم فوري' : 'Copy and use at checkout for instant savings'}
                          </span>
                        </motion.div>
                      )}
                    </div>
                  )}
                </motion.div>

                {/* BOTTOM HOOK LINK TO ACTUAL PRODUCT ITEM */}
                {currentSlideObj.productId && (
                  <div className="w-full">
                    {/* Retrieve real product */}
                    {(() => {
                      const prod = getLinkedProduct(currentSlideObj.productId);
                      if (!prod) return null;

                      return (
                        <div className="w-full bg-stone-950/90 border border-white/10 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-2xl backdrop-blur-lg">
                          <img
                            src={prod.image}
                            alt={prod.name}
                            referrerPolicy="no-referrer"
                            className="w-11 h-11 rounded-xl object-cover border border-white/10 shrink-0"
                          />
                          <div className="flex-1 min-w-0 text-start">
                            <h5 className="text-[11px] font-black tracking-tight text-white/95 truncate">
                              {prod.name}
                            </h5>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] font-bold text-indigo-400">
                                {formatPrice(prod.price)}
                              </span>
                              {prod.price > 40 && (
                                <span className="text-[8px] text-zinc-500 line-through">
                                  {formatPrice(prod.price * 1.25)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5 shrink-0">
                            {/* Tap direct to cart */}
                            <button
                              onClick={() => handleAddToCart(prod.id)}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white flex items-center gap-1 text-[9px] font-black cursor-pointer transition-all uppercase"
                            >
                              <ShoppingCart size={10} />
                              {isArabic ? 'أضف للسلة' : 'ADD TO CART'}
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
