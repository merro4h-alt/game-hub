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

interface StoryProgressBarsProps {
  slidesCount: number;
  activeSlideIdx: number;
  isPaused: boolean;
  slideDuration: number;
  onComplete: () => void;
  idx: number;
  activeStoryIdx: number;
}

const StoryProgressBars: React.FC<StoryProgressBarsProps> = ({
  slidesCount,
  activeSlideIdx,
  isPaused,
  slideDuration,
  onComplete,
  idx,
  activeStoryIdx,
}) => {
  const [progress, setProgress] = useState<number>(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setProgress(0);
  }, [activeSlideIdx, activeStoryIdx]);

  useEffect(() => {
    if (idx !== activeStoryIdx) return;
    if (isPaused) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      return;
    }

    const stepMs = 30; // 33 fps fluid updates
    const increment = (stepMs / slideDuration) * 100;

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressIntervalRef.current!);
          onComplete();
          return 100;
        }
        return prev + increment;
      });
    }, stepMs);

    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [idx, activeStoryIdx, activeSlideIdx, isPaused, slideDuration, onComplete]);

  return (
    <div className="flex gap-1 mb-4 select-none">
      {Array.from({ length: slidesCount }).map((_, index) => {
        let fill = 0;
        if (idx === activeStoryIdx) {
          if (index < activeSlideIdx) fill = 100;
          else if (index === activeSlideIdx) fill = progress;
          else fill = 0;
        } else if (idx < activeStoryIdx) {
          fill = 100;
        } else {
          fill = 0;
        }

        return (
          <div key={index} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-rose-400 rounded-full"
              style={{
                width: `${Math.min(100, Math.max(0, fill))}%`,
                transition: 'none'
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

export const ProductStories: React.FC = () => {
  const { i18n, t } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const { products, addToCart, setIsCartOpen, formatPrice } = useStore();

  // Combine custom STORIES_DATA with extra stories generated dynamically from all newly added products!
  const allStories = React.useMemo(() => {
    const combined = [...STORIES_DATA];
    const newProductSlides: StorySlide[] = [];
    let latestProductImage = '';

    products.forEach((product) => {
      // Check if this product is already linked in one of the static stories
      const alreadyCovered = STORIES_DATA.some(story =>
        story.slides.some(slide => slide.productId === product.id)
      );

      if (!alreadyCovered) {
        if (!latestProductImage) {
          latestProductImage = product.image;
        }
        // Collect slide images: main image + any additional images from product.images
        const mediaUrls = [product.image];
        if (product.images && Array.isArray(product.images)) {
          product.images.forEach(img => {
            if (img && img !== product.image && !mediaUrls.includes(img)) {
              mediaUrls.push(img);
            }
          });
        }

        // Create interactive slides from images
        const slides: StorySlide[] = mediaUrls.map((url, index) => {
          // Alternate interactive widgets for each slide image
          const widgetTypes: ('poll' | 'slider' | 'reveal')[] = ['slider', 'poll', 'reveal'];
          const interactiveType = widgetTypes[index % widgetTypes.length];
          
          let interactiveData: any = {};
          if (interactiveType === 'slider') {
            interactiveData = {
              questionAr: `ما تقييمك لمنتجنا الجديد ${product.name}؟ 😍`,
              questionEn: `How do you rate our new product ${product.name}? 😍`
            };
          } else if (interactiveType === 'poll') {
            interactiveData = {
              questionAr: `هل يعجبك تنسيق ألوان ${product.name}؟`,
              questionEn: `Do you like the color styling of ${product.name}?`,
              optionsAr: ['روعة كالعادة 🔥', 'كنت أفضل خيار آخر 🎨'],
              optionsEn: ['Stunning as always 🔥', 'Preferred other options 🎨']
            };
          } else {
            interactiveData = {
              questionAr: `كود خصم حصري ومؤقت لـ ${product.name}! 🎁`,
              questionEn: `Exclusive limited code for ${product.name}! 🎁`,
              promoCode: `ONXIFI10`
            };
          }

          return {
            mediaUrl: url,
            titleAr: product.name,
            titleEn: product.name,
            subtitleAr: product.description || 'تصفح هذا المنتج الحصري الفاخر المضاف حديثاً في متجرنا اليوم.',
            subtitleEn: product.description || 'Explore this newly added premium masterpiece, exclusively in our boutique.',
            interactiveType,
            interactiveData,
            productId: product.id
          };
        });

        newProductSlides.push(...slides);
      }
    });

    if (newProductSlides.length > 0) {
      combined.push({
        id: `story-new-products`,
        usernameAr: 'منتجات جديدة ✨',
        usernameEn: 'New Arrivals ✨',
        avatar: latestProductImage || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=150',
        isLive: true, // Pulse live to indicate new arrivals!
        slides: newProductSlides
      });
    }

    return combined;
  }, [products]);

  // Story playback state
  const [activeStoryIdx, setActiveStoryIdx] = useState<number | null>(null);
  const [activeSlideIdx, setActiveSlideIdx] = useState<number>(0);
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

  // New gesture / sliding animation states
  const [direction, setDirection] = useState<number>(0); // 1 = forward, -1 = backward
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const hasDraggedActiveRef = useRef<boolean>(false);

  // Stories Row Drag-to-Scroll states & refs
  const storiesRowRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRowRef = useRef<boolean>(false);
  const [isHoveringRow, setIsHoveringRow] = useState<boolean>(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const startXRowRef = useRef<number>(0);
  const scrollLeftRowRef = useRef<number>(0);

  const handleRowMouseDown = (e: React.MouseEvent) => {
    if (!storiesRowRef.current) return;
    isDraggingRowRef.current = false;
    startXRowRef.current = e.pageX - storiesRowRef.current.offsetLeft;
    scrollLeftRowRef.current = storiesRowRef.current.scrollLeft;
    
    // Bind global mouseup/mousemove to handle dragging outside of container bounds
    window.addEventListener('mousemove', handleRowGlobalMouseMove);
    window.addEventListener('mouseup', handleRowGlobalMouseUp);
  };

  const handleRowGlobalMouseMove = (e: MouseEvent) => {
    if (!storiesRowRef.current) return;
    const x = e.pageX - storiesRowRef.current.offsetLeft;
    const walk = (x - startXRowRef.current) * 1.5; // adjust scrolling speed
    
    if (Math.abs(walk) > 5) {
      isDraggingRowRef.current = true;
    }
    storiesRowRef.current.scrollLeft = scrollLeftRowRef.current - walk;
  };

  const handleRowGlobalMouseUp = () => {
    window.removeEventListener('mousemove', handleRowGlobalMouseMove);
    window.removeEventListener('mouseup', handleRowGlobalMouseUp);
    
    // Keep isDraggingRowRef active for a subtle layout moment to prevent accidental onClick of items
    setTimeout(() => {
      isDraggingRowRef.current = false;
    }, 80);
  };

  // Touch drag support for mobile
  const handleRowTouchStart = (e: React.TouchEvent) => {
    if (!storiesRowRef.current) return;
    isDraggingRowRef.current = false;
    startXRowRef.current = e.touches[0].pageX - storiesRowRef.current.offsetLeft;
    scrollLeftRowRef.current = storiesRowRef.current.scrollLeft;
  };

  const handleRowTouchMove = (e: React.TouchEvent) => {
    if (!storiesRowRef.current) return;
    const x = e.touches[0].pageX - storiesRowRef.current.offsetLeft;
    const walk = x - startXRowRef.current;
    
    // If the movement is more than 8 pixels, mark as dragging to prevent onclick trigger!
    if (Math.abs(walk) > 8) {
      isDraggingRowRef.current = true;
    }
  };

  const handleRowTouchEnd = () => {
    setTimeout(() => {
      isDraggingRowRef.current = false;
    }, 120);
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0.8
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? '100%' : '-100%',
      opacity: 0,
      transition: { opacity: { duration: 0.12 } }
    })
  };

  const storySlideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.96
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring' as const, stiffness: 450, damping: 38 },
        scale: { duration: 0.22, ease: 'easeOut' as const },
        opacity: { duration: 0.18 }
      }
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.96,
      transition: {
        x: { type: 'spring' as const, stiffness: 450, damping: 38 },
        scale: { duration: 0.22, ease: 'easeIn' as const },
        opacity: { duration: 0.15 }
      }
    })
  };

  const handleNextStory = () => {
    if (activeStoryIdx === null) return;
    setDirection(1);
    if (activeStoryIdx < allStories.length - 1) {
      const nextIdx = activeStoryIdx + 1;
      const nextStoryObj = allStories[nextIdx];
      if (!watchedStories.includes(nextStoryObj.id)) {
        setWatchedStories((prev) => [...prev, nextStoryObj.id]);
      }
      setActiveStoryIdx(nextIdx);
      setActiveSlideIdx(0);
    } else {
      closeStory();
    }
  };

  const handlePrevStory = () => {
    if (activeStoryIdx === null) return;
    setDirection(-1);
    if (activeStoryIdx > 0) {
      const prevIdx = activeStoryIdx - 1;
      const prevStoryObj = allStories[prevIdx];
      if (!watchedStories.includes(prevStoryObj.id)) {
        setWatchedStories((prev) => [...prev, prevStoryObj.id]);
      }
      setActiveStoryIdx(prevIdx);
      setActiveSlideIdx(0);
    } else {
      setActiveSlideIdx(0);
    }
  };

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(380);

  useEffect(() => {
    if (activeStoryIdx === null) return;
    
    const updateSize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.getBoundingClientRect().width || 380);
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [activeStoryIdx]);

  const handleActiveMousedown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    
    // Allow dragging/swiping from navigation overlays, but block on other interactive elements
    const isNavOverlay = target.closest('[aria-label="Previous Slide"]') || target.closest('[aria-label="Next Slide"]');
    if (!isNavOverlay && (target.closest('button') || target.closest('input') || target.closest('a') || target.closest('[role="button"]:not([aria-label])'))) {
      return;
    }
    hasDraggedActiveRef.current = false;
    setTouchStartX(e.clientX);
    setTouchStartY(e.clientY);
    setDragOffset(0);
    setIsPaused(true);
    
    window.addEventListener('mousemove', handleActiveGlobalMousemove);
    window.addEventListener('mouseup', handleActiveGlobalMouseup);
  };

  const handleActiveGlobalMousemove = (e: MouseEvent) => {
    if (touchStartX === null) return;
    const diffX = e.clientX - touchStartX;
    if (Math.abs(diffX) > 8) {
      hasDraggedActiveRef.current = true;
    }
    setDragOffset(diffX);
  };

  const handleActiveGlobalMouseup = (e: MouseEvent) => {
    window.removeEventListener('mousemove', handleActiveGlobalMousemove);
    window.removeEventListener('mouseup', handleActiveGlobalMouseup);
    
    setIsPaused(false);
    const threshold = 60;
    const finalDragOffset = e.clientX - (touchStartX ?? e.clientX);
    
    if (Math.abs(finalDragOffset) > threshold) {
      if (finalDragOffset > 0) {
        handlePrevStory();
      } else {
        handleNextStory();
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
    setDragOffset(0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    const isNavOverlay = target.closest('[aria-label="Previous Slide"]') || target.closest('[aria-label="Next Slide"]');
    if (!isNavOverlay && (target.closest('button') || target.closest('input') || target.closest('a') || target.closest('[role="button"]:not([aria-label])'))) {
      return;
    }
    hasDraggedActiveRef.current = false;
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
    setDragOffset(0);
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartX;
    const diffY = currentY - touchStartY;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      setDragOffset(diffX);
      if (Math.abs(diffX) > 8) {
        hasDraggedActiveRef.current = true;
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;

    setIsPaused(false);

    const threshold = 60;
    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0) {
        handlePrevStory();
      } else {
        handleNextStory();
      }
    }

    setTouchStartX(null);
    setTouchStartY(null);
    setDragOffset(0);
  };

  const slideDuration = 2800; // Snappy story duration (2.8 seconds)

  // Persist watched state
  useEffect(() => {
    localStorage.setItem('onxifi_watched_stories', JSON.stringify(watchedStories));
  }, [watchedStories]);

  // Track stories container scrolling progress to update dot indicator
  useEffect(() => {
    const handleScroll = () => {
      if (storiesRowRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = storiesRowRef.current;
        const totalScrollable = scrollWidth - clientWidth;
        if (totalScrollable > 0) {
          const absoluteScroll = Math.abs(scrollLeft);
          setScrollProgress(absoluteScroll / totalScrollable);
        }
      }
    };

    const currentScrollRef = storiesRowRef.current;
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

  // Open story model
  const openStory = (storyIndex: number) => {
    if (isDraggingRowRef.current) return;
    const story = allStories[storyIndex];
    if (!watchedStories.includes(story.id)) {
      setWatchedStories((prev) => [...prev, story.id]);
    }
    setDirection(1);
    setActiveStoryIdx(storyIndex);
    setActiveSlideIdx(0);
    setIsPaused(false);
  };

  // Close story model
  const closeStory = () => {
    setActiveStoryIdx(null);
  };

  const handleNextSlide = () => {
    if (activeStoryIdx === null) return;
    setDirection(1);
    const currentStory = allStories[activeStoryIdx];
    if (activeSlideIdx < currentStory.slides.length - 1) {
      setActiveSlideIdx((prev) => prev + 1);
    } else {
      // Go to next user story if available
      if (activeStoryIdx < allStories.length - 1) {
        setActiveStoryIdx((prev) => prev! + 1);
        setActiveSlideIdx(0);
      } else {
        closeStory();
      }
    }
  };

  const handlePrevSlide = () => {
    if (activeStoryIdx === null) return;
    setDirection(-1);
    if (activeSlideIdx > 0) {
      setActiveSlideIdx((prev) => prev - 1);
    } else {
      // Go to previous user story
      if (activeStoryIdx > 0) {
        setActiveStoryIdx((prev) => prev! - 1);
        // set to last slide of prev story
        const prevStory = allStories[activeStoryIdx - 1];
        setActiveSlideIdx(prevStory.slides.length - 1);
      }
    }
  };

  // Current states helpers
  const currentStoryObj = activeStoryIdx !== null ? allStories[activeStoryIdx] : null;
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

  const scrollRowLeft = () => {
    if (storiesRowRef.current) {
      const multiplier = isArabic ? 1 : -1;
      storiesRowRef.current.scrollBy({ left: multiplier * 240, behavior: 'smooth' });
    }
  };

  const scrollRowRight = () => {
    if (storiesRowRef.current) {
      const multiplier = isArabic ? -1 : 1;
      storiesRowRef.current.scrollBy({ left: multiplier * 240, behavior: 'smooth' });
    }
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

        {/* Stories Row Wrapper */}
        <div className="max-w-7xl mx-auto py-4 mb-4 z-20">
          <div
            ref={storiesRowRef}
            onMouseDown={handleRowMouseDown}
            onTouchStart={handleRowTouchStart}
            onTouchMove={handleRowTouchMove}
            onTouchEnd={handleRowTouchEnd}
            onMouseEnter={() => setIsHoveringRow(true)}
            onMouseLeave={() => setIsHoveringRow(false)}
            className="flex items-center gap-3 md:gap-4 py-4 overflow-x-auto no-scrollbar scroll-smooth relative touch-pan-x select-none cursor-grab active:cursor-grabbing px-2"
          >
            {allStories.map((story, idx) => {
              const isUnwatched = !watchedStories.includes(story.id);

              return (
                <motion.div
                  key={story.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + idx * 0.08, type: "spring", stiffness: 150 }}
                  className="shrink-0"
                >
                  <button
                    onClick={() => openStory(idx)}
                    className="flex flex-col items-center gap-2 shrink-0 group focus:outline-none cursor-pointer hover:-translate-y-1 transition-all duration-300"
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
                    <span className="text-[10px] md:text-[11px] font-bold text-white/80 group-hover:text-[#4F46E5] transition-colors">
                      {isArabic ? story.usernameAr : story.usernameEn}
                    </span>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Modern Dot Scroll indicator for mobile */}
        <div className="flex justify-center gap-1.5 mt-2 md:hidden">
          {allStories.map((story, idx) => {
            const activeIdx = Math.min(
              allStories.length - 1,
              Math.max(0, Math.floor(scrollProgress * (allStories.length - 1) + 0.5))
            );
            return (
              <div
                key={story.id}
                className={`h-1 rounded-full transition-all duration-300 ${
                  activeIdx === idx ? 'w-4 bg-[#4F46E5]' : 'w-1 bg-white/20'
                }`}
              />
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
            className="fixed inset-0 z-[5000] flex items-center justify-center bg-stone-950/95 backdrop-blur-xl md:p-4 text-white overflow-hidden select-none"
            onClick={closeStory}
          >
            {/* Flanking Floating Left Chevron (Previous Slide) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevSlide();
              }}
              className="hidden md:flex absolute left-6 lg:left-12 top-1/2 -translate-y-1/2 z-50 w-14 h-14 rounded-full bg-white/10 hover:bg-indigo-600 border border-white/10 text-white items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-md"
              title={isArabic ? 'السابق' : 'Previous'}
            >
              <ChevronLeft size={28} strokeWidth={2.5} />
            </button>

            {/* GPU-Accelerated Flat Sliding Story Wrapper */}
            <div
              ref={containerRef}
              className="relative w-full max-w-sm md:max-w-md h-full md:h-[840px] md:rounded-[2.5rem] flex items-center justify-center overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              onMouseDown={handleActiveMousedown}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={currentStoryObj.id}
                  custom={direction}
                  variants={storySlideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="absolute w-full h-full md:rounded-[2.5rem] overflow-hidden bg-[#0a0a0c] border border-white/5 flex flex-col justify-between shadow-[0_0_50px_rgba(0,0,0,0.8)] select-none touch-none"
                  style={{
                    x: dragOffset, // Bind real-time drag scrubbing for tactile feel
                    transition: touchStartX !== null ? 'none' : undefined,
                  }}
                >
                  {/* Unified Sliding Slide Content */}
                  <div className="absolute inset-0 w-full h-full overflow-hidden">
                    <AnimatePresence initial={false} custom={direction}>
                      <motion.div
                        key={`${currentStoryObj.id}-${activeSlideIdx}`}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                          x: { type: 'spring' as const, stiffness: 450, damping: 35 },
                          opacity: { duration: 0.16 }
                        }}
                        className="absolute inset-0 w-full h-full flex flex-col justify-end"
                      >
                        {/* Slide Background Image */}
                        <div className="absolute inset-0 w-full h-full select-none pointer-events-none">
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 bottom-0 to-black/85 z-10" />
                          <img
                            src={currentSlideObj.mediaUrl}
                            alt="Story background"
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover pointer-events-none"
                          />
                        </div>

                        {/* Slide Spacer for Top header */}
                        <div className="w-full h-24 shrink-0" />

                        {/* INTERACTIVE WIDGET & DETAILS (Floating in the center-down) */}
                        <div className="relative z-20 px-6 pb-6 pt-16 flex flex-col items-center justify-end max-w-sm mx-auto w-full select-none">
                          {/* Core Title Details */}
                          <div className="w-full text-center space-y-1 mb-5">
                            <h4 className="text-lg md:text-xl font-black tracking-tight text-white drop-shadow-md">
                              {isArabic ? currentSlideObj.titleAr : currentSlideObj.titleEn}
                            </h4>
                            <p className="text-[11px] md:text-xs text-white/75 line-clamp-2 px-1 leading-relaxed drop-shadow-sm">
                              {isArabic ? currentSlideObj.subtitleAr : currentSlideObj.subtitleEn}
                            </p>
                          </div>

                          {/* THE DYNAMIC INTERACTIVE WIDGET MODULE */}
                          <div
                            className="w-full bg-white/10 backdrop-blur-md rounded-3xl p-4 border border-white/10 shadow-2xl relative overflow-hidden mb-5"
                            onMouseEnter={() => setIsPaused(true)}
                            onMouseLeave={() => setIsPaused(false)}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              setIsPaused(true);
                            }}
                            onTouchEnd={(e) => {
                              e.stopPropagation();
                              setIsPaused(false);
                            }}
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
                                    const votePct = optIdx === 0 ? 74 : 26;

                                    return (
                                      <button
                                        key={optIdx}
                                        disabled={isVoted}
                                        onClick={() => handlePollVote(optIdx)}
                                        className={`relative py-3 px-4 rounded-2xl font-bold text-xs text-start transition-all overflow-hidden ${
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
                                        className={`relative py-3 px-4 rounded-2xl font-bold text-xs text-start transition-all overflow-hidden ${
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
                                  <div className="w-full bg-[#1c1c24] border border-white/10 rounded-2xl p-3 flex flex-col items-center">
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
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* BOTTOM HOOK LINK TO ACTUAL PRODUCT ITEM */}
                          {currentSlideObj.productId && (
                            <div className="w-full">
                              {(() => {
                                const prod = getLinkedProduct(currentSlideObj.productId);
                                if (!prod) return null;

                                return (
                                  <div 
                                    className="w-full bg-stone-950/90 border border-white/10 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-2xl backdrop-blur-lg lg:pointer-events-auto"
                                    onTouchStart={(e) => e.stopPropagation()}
                                    onTouchEnd={(e) => e.stopPropagation()}
                                  >
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
                    </AnimatePresence>
                  </div>

                  {/* TOP CONTROLS CONTENT (Segmented Progress Bars + Header info) */}
                  <div className="relative z-20 p-4 pt-6">
                    {/* Horizontal progress segments */}
                    <StoryProgressBars
                      slidesCount={currentStoryObj.slides.length}
                      activeSlideIdx={activeSlideIdx}
                      isPaused={isPaused}
                      slideDuration={slideDuration}
                      onComplete={handleNextSlide}
                      idx={activeStoryIdx}
                      activeStoryIdx={activeStoryIdx}
                    />

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
                      className="w-[32%] h-full pointer-events-auto cursor-pointer bg-transparent relative"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (hasDraggedActiveRef.current) return;
                        handlePrevSlide();
                      }}
                      role="button"
                      aria-label="Previous Slide"
                    >
                      {/* Mobile left visual chevron */}
                      <div className="md:hidden absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white/80 active:scale-95 transition-transform shadow-md">
                        <ChevronLeft size={16} strokeWidth={2.5} />
                      </div>
                    </div>
                    {/* Middle Spacer */}
                    <div className="flex-1 h-full" />
                    {/* Right Area Tap */}
                    <div
                      className="w-[32%] h-full pointer-events-auto cursor-pointer bg-transparent relative"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (hasDraggedActiveRef.current) return;
                        handleNextSlide();
                      }}
                      role="button"
                      aria-label="Next Slide"
                    >
                      {/* Mobile right visual chevron */}
                      <div className="md:hidden absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white/80 active:scale-95 transition-transform shadow-md">
                        <ChevronRight size={16} strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Flanking Floating Right Chevron (Next Slide) */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNextSlide();
              }}
              className="hidden md:flex absolute right-6 lg:right-12 top-1/2 -translate-y-1/2 z-50 w-14 h-14 rounded-full bg-white/10 hover:bg-indigo-600 border border-white/10 text-white items-center justify-center cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-md"
              title={isArabic ? 'التالي' : 'Next'}
            >
              <ChevronRight size={28} strokeWidth={2.5} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
