import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RotateCcw, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  HelpCircle,
  Maximize2,
  Minimize2,
  Compass,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { Product } from '../types';

interface Product360ViewerProps {
  product: Product;
  isArabic: boolean;
  onClose?: () => void;
}

interface Hotspot {
  id: string;
  angle: number; // base angle in degrees on the cylinder
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  yPercent: number; // vertical percentage (15 to 85)
}

export const Product360Viewer: React.FC<Product360ViewerProps> = ({ product, isArabic, onClose }) => {
  const [angle, setAngle] = useState(0); // 0 to 359 degrees
  const [isRotating, setIsRotating] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const [hologramMode, setHologramMode] = useState(false);

  // Dragging interaction states
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startAngle = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Lazy initialize AudioContext on interaction
  const playTickSound = () => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
      
      gain.gain.setValueAtTime(0.015, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {
      console.warn("Web Audio tick sound blocked or unsupported", e);
    }
  };

  // Generate multi-images mapping or fallbacks
  const availableImages = useMemo(() => {
    const images = [product.image];
    if (product.images && Array.isArray(product.images)) {
      images.push(...product.images);
    }
    return images;
  }, [product]);

  // Map the current degree rotation (0-360) to the index in available images list
  const currentImageIndex = useMemo(() => {
    const count = availableImages.length;
    if (count <= 1) return 0;
    // Map angle (0-359) to an index
    const sectorSize = 360 / count;
    const index = Math.floor(((angle % 360) + 360) % 360 / sectorSize);
    return Math.min(index, count - 1);
  }, [angle, availableImages]);

  // Custom hotspots based on product categories
  const hotspots = useMemo<Hotspot[]>(() => {
    const isShoe = /حذاء|حذأ|أحذية|احذية|جزمة|كوتش|حذائيه|حذائية|صندل|نعال|سنيكرز|شبشب|shoe|sneaker|boot|sandal|footwear|loafers|slippers|heels/i.test(product.name || '') || 
                   /حذاء|حذأ|أحذية|احذية|جزمة|كوتش|حذائيه|حذائية|صندل|نعال|سنيكرز|شبشب|shoe|sneaker|boot|sandal|footwear|loafers|slippers|heels/i.test(product.description || '');
    
    if (isShoe) {
      return [
        {
          id: 'hs-sole',
          angle: 45,
          titleEn: 'Flexible Air Cushioning',
          titleAr: 'وسادة هوائية مرنة',
          descEn: 'Engineered heel suspension offering elite energy return and responsive bounce with every stride.',
          descAr: 'نظام حماية مرن ممتص للصدمات يوفر ارتداداً مثالياً وراحة فائقة طوال اليوم لفترات المشي الطويل.',
          yPercent: 78,
        },
        {
          id: 'hs-upper',
          angle: 165,
          titleEn: 'Breathable Knit Layer',
          titleAr: 'نسيج علوي تنفسي',
          descEn: 'Advanced composite mesh dynamic shell provides customized thermoregulation and foot hugging comfort.',
          descAr: 'نسيج شبكي متطور يوفر تهوية مستمرة وقنوات تهوية داخلية تمنع التعرق وتمنح ثباتاً متناسباً للحركة.',
          yPercent: 35,
        },
        {
          id: 'hs-grip',
          angle: 280,
          titleEn: 'Anti-Slip Multipurpose Grip',
          titleAr: 'قاعدة مضادة للانزلاق',
          descEn: 'Reinforced hybrid carbon rubber structure provides exceptional slip traction on dry, wet and athletic surfaces.',
          descAr: 'تشكيل مخالب مطاطية كربونية فريدة تمنح توازناً واحتكاكاً عالياً على كافة الأسطح المبللة والأرضيات الصعبة.',
          yPercent: 88,
        }
      ];
    }
    
    // Fashion/Apparel general
    if (product.category === 'Fashion & Beauty' || /قميص|طقم|ملابس|بنطلون|فستان|جاكيت|شورت|tshirt|shirt|pants|jacket|dress/i.test(product.name)) {
      return [
        {
          id: 'hs-fabric',
          angle: 60,
          titleEn: 'Premium Organic Fibers',
          titleAr: 'ألياف قطنية فاخرة',
          descEn: '100% combed cotton, ultra durable blend that is hypoallergenic and incredibly soft on the skin.',
          descAr: 'مزيج قطني عضوي طبيعي ناعم جداً على البشرة ومقاوم للحساسية والوبر مع تكنولوجيا الحفاظ على حيوية الألوان.',
          yPercent: 40,
        },
        {
          id: 'hs-stitch',
          angle: 200,
          titleEn: 'Durable Double-Stitched Seams',
          titleAr: 'خياطة معززة مزدوجة',
          descEn: 'High density stitch detailing ensuring structural longevity under continuous stretch and wash frequencies.',
          descAr: 'حبكة خياطة فاخرة وكثيفة في الحواف والوصلات تتحمل الاستخدام المتكرر وتبقي الهيكل الخارجي متناسقاً دون تمدد.',
          yPercent: 75,
        }
      ];
    }

    // Default general tech/imported product hotspots
    return [
      {
        id: 'hs-material',
        angle: 45,
        titleEn: 'Elite Exterior Finish',
        titleAr: 'لمسة نهائية متميزة',
        descEn: 'Highly wear-resistant anodized protection layer that is smudge-free and elegant.',
        descAr: 'طبقة حماية خارجية فاخرة مضادة للبصمات والخدوش تضمن المظهر المتألق والاستخدام طويل الأمد.',
        yPercent: 30,
      },
      {
        id: 'hs-core',
        angle: 220,
        titleEn: 'Built to Last',
        titleAr: 'تصميم عالي التحمل',
        descEn: 'Reinforced inner frame optimized to withstand rugged daily utility and stress.',
        descAr: 'هيكل داخلي متكامل يدعم المتانة القصوى ويضمن تحمل التحديات اليومية بدون أي تأثر.',
        yPercent: 65,
      }
    ];
  }, [product]);

  // Autoplay slow rotation orbit
  useEffect(() => {
    let timer: number;
    if (isRotating) {
      timer = window.setInterval(() => {
        setAngle((prev) => {
          const nextAngle = (prev + 1) % 360;
          // Play click sound on angle checkpoints representing steps
          if (nextAngle % 10 === 0) {
            playTickSound();
          }
          return nextAngle;
        });
      }, 40);
    }
    return () => clearInterval(timer);
  }, [isRotating, soundEnabled]);

  // Mouse wheel scroll to rotate inside control container
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = Math.sign(e.deltaY);
    setAngle((prev) => {
      const nextAngle = (prev + delta * 5 + 360) % 360;
      playTickSound();
      return nextAngle;
    });
  };

  // Mouse / Touch Drag interaction
  const handleStart = (clientX: number) => {
    isDragging.current = true;
    startX.current = clientX;
    startAngle.current = angle;
    setIsRotating(false); // Stop auto orbit on drag
    setShowGuide(false);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging.current) return;
    const deltaX = clientX - startX.current;
    
    // Sensitivity factor: 1px of drag corresponds to X degrees of rotation
    const sensitivity = 0.8;
    const nextAngle = Math.round((startAngle.current - deltaX * sensitivity + 3600) % 360);
    
    if (Math.abs(angle - nextAngle) >= 5) {
      playTickSound();
    }
    setAngle(nextAngle);
  };

  const handleEnd = () => {
    isDragging.current = false;
  };

  // Event handlers
  const onMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX);
    window.addEventListener('mousemove', onGlobalMouseMove);
    window.addEventListener('mouseup', onGlobalMouseUp);
  };

  const onGlobalMouseMove = (e: MouseEvent) => {
    handleMove(e.clientX);
  };

  const onGlobalMouseUp = () => {
    handleEnd();
    window.removeEventListener('mousemove', onGlobalMouseMove);
    window.removeEventListener('mouseup', onGlobalMouseUp);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const onTouchEnd = () => {
    handleEnd();
  };

  // Sound and speed togglers
  const toggleSound = () => setSoundEnabled(!soundEnabled);
  const toggleOrbit = () => setIsRotating(!isRotating);
  const resetAngle = () => {
    setAngle(0);
    playTickSound();
  };

  // Hotspots Math Projection calculation:
  // For a cylinder, position on screen varies from 5% left to 95% left.
  // Depth is calculated via cosine to see if it is in front (visible) or behind (invisible).
  const projectedHotspots = useMemo(() => {
    return hotspots.map((hs) => {
      // Net rotation angle of individual hotspot
      // We align hotspot base angle, subtract the user rotation angle to offset
      const hsAngle = ((hs.angle - angle + 360) % 360);
      const angleRad = (hsAngle * Math.PI) / 180;
      
      const depth = Math.cos(angleRad); // positive values are in the front hemishpere facing camera
      const isFront = depth > 0;
      const xPercent = 50 + Math.sin(angleRad) * 40; // 10% to 90% boundary range
      
      return {
        ...hs,
        xPercent,
        isFront,
        depth,
      };
    });
  }, [hotspots, angle]);

  const activeHotspotDetails = hotspots.find(hs => hs.id === activeHotspot);

  return (
    <div 
      className={`relative rounded-3xl overflow-hidden bg-[#0F0F11]/60 border border-white/5 backdrop-blur-xl ${
        isFullScreen ? 'fixed inset-0 z-50 p-4 md:p-8 flex flex-col justify-center bg-black' : 'w-full aspect-square md:p-6'
      }`}
      style={{ touchAction: 'none' }}
    >
      {/* Dynamic Glow Base Canvas in Hologram Mode */}
      {hologramMode && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-60">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 bg-[radial-gradient(circle,rgba(79,70,229,0.3)_0%,rgba(168,85,247,0.1)_50%,transparent_100%)] blur-3xl animate-pulse" />
          <div className="absolute top-[20%] left-[30%] w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl animate-bounce" style={{ animationDuration: '8s' }} />
          <div className="absolute bottom-[20%] right-[30%] w-36 h-36 bg-indigo-500/20 rounded-full blur-2xl animate-bounce" style={{ animationDuration: '12s' }} />
        </div>
      )}

      {/* Header controls inside the panel */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-30 select-none pointer-events-auto">
        <div className="flex gap-2">
          {/* Sounds trigger */}
          <button
            onClick={toggleSound}
            className={`p-2.5 rounded-xl border border-white/10 ${
              soundEnabled ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/20' : 'bg-stone-900/80 text-white/40 hover:text-white'
            } transition-all cursor-pointer backdrop-blur-md`}
            title={isArabic ? 'تشغيل/كتم الصوت' : 'Mute/Unmute'}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Autoplay Orbit */}
          <button
            onClick={toggleOrbit}
            className={`p-2.5 rounded-xl border border-white/10 ${
              isRotating ? 'bg-indigo-600 text-white border-transparent' : 'bg-stone-900/80 text-white/60 hover:text-white'
            } transition-all cursor-pointer backdrop-blur-md flex items-center gap-1.5 text-xs font-bold`}
            title={isArabic ? 'تشغيل الدوران التلقائي' : 'Toggle Auto-orbit'}
          >
            {isRotating ? <Pause size={16} /> : <Play size={16} />}
            <span className="hidden sm:inline">
              {isRotating 
                ? (isArabic ? 'إيقاف مؤقت' : 'Autoplay') 
                : (isArabic ? 'دوران تلقائي' : 'Orbit')}
            </span>
          </button>

          {/* Special Hologram Laser Mode */}
          <button
            onClick={() => setHologramMode(!hologramMode)}
            className={`p-2.5 rounded-xl border border-white/10 ${
              hologramMode ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-stone-900/80 text-white/60 hover:text-white'
            } transition-all cursor-pointer backdrop-blur-md flex items-center gap-1.5 text-xs font-bold`}
          >
            <Sparkles size={16} className={hologramMode ? 'animate-spin' : ''} style={{ animationDuration: '10s' }} />
            <span className="hidden sm:inline">
              {hologramMode ? (isArabic ? 'وضع ثلاثي الأبعاد ⚡' : '3D Spark') : (isArabic ? 'إضاءة تفاعلية' : 'Aesthetic Lights')}
            </span>
          </button>
        </div>

        <div className="flex gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="px-3.5 py-2.5 rounded-xl bg-stone-900/80 border border-white/10 hover:bg-stone-800 text-white transition-all cursor-pointer backdrop-blur-md text-xs font-bold"
            >
              {isArabic ? 'إغلاق العارض ✕' : 'Close 360° ✕'}
            </button>
          )}

          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-2.5 rounded-xl bg-stone-900/80 border border-white/10 hover:bg-stone-800 text-white/70 hover:text-white transition-all cursor-pointer backdrop-blur-md"
            title={isFullScreen ? 'تصغير الشاشة' : 'ملء الشاشة'}
          >
            {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Main Drag Sandbox Area */}
      <div 
        ref={containerRef}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onWheel={handleWheel}
        className="w-full h-full min-h-[300px] flex items-center justify-center relative cursor-grab active:cursor-grabbing select-none"
      >
        {/* Helper visual hints overlay */}
        <AnimatePresence>
          {showGuide && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute pointer-events-none z-10 bottom-24 bg-black/80 backdrop-blur-lg border border-indigo-500/20 px-5 py-2.5 rounded-full text-xs font-bold text-center flex items-center gap-2 max-w-[85%]"
            >
              <Compass className="animate-spin text-indigo-400" size={16} style={{ animationDuration: '4s' }} />
              <span>
                {isArabic 
                  ? 'اسحب الماوس/اصبعك يميناً ويساراً لتدوير المنتَج بزاوية ٣٦٠° 🔄' 
                  : 'Drag or swipe horizontally to spin this product 360° 🔄'}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Shadow floor ring underneath */}
        <div 
          className="absolute bottom-[20%] w-[68%] aspect-[5/1] rounded-full self-center blur-md z-0 pointer-events-none transition-all duration-300"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
            transform: `scale(${1 + Math.abs(angle % 90 - 45) / 360})`,
          }}
        />

        {/* Outer Halo ring for aesthetic alignment */}
        <div className="absolute inset-x-8 top-[15%] bottom-[15%] rounded-full border border-dashed border-white/5 pointer-events-none z-0" />

        {/* Actual Image / Object Projector Container */}
        <div 
          className="relative max-w-[70%] max-h-[70%] w-full h-full flex items-center justify-center transition-transform z-10"
          style={{
            perspective: '1300px',
          }}
        >
          {/* Main Product Angle Image with dynamic 3D shearing transformation in case of single image */}
          <motion.img
            src={availableImages[currentImageIndex]}
            alt={product.name}
            draggable="false"
            className="object-contain w-full h-full max-h-[420px] transition-all"
            style={{
              transform: `rotateY(${angle}deg) rotateX(${hologramMode ? Math.sin((angle * Math.PI) / 180) * 12 : 0}deg)`,
              filter: hologramMode 
                ? `drop-shadow(0 20px 40px rgba(99,102,241,0.25)) saturate(1.15) hue-rotate(${angle / 4}deg)`
                : 'drop-shadow(0 20px 50px rgba(0,0,0,0.65))',
            }}
            referrerPolicy="no-referrer"
          />

          {/* Light Hologram Glare Sweep overlaying the image */}
          <div 
            className="absolute inset-0 pointer-events-none mix-blend-color-dodge opacity-30 bg-gradient-to-tr from-transparent via-white to-transparent"
            style={{
              transform: `translateX(${(angle % 360) - 180}px) skewX(-15deg)`,
              transition: isDragging.current ? 'none' : 'transform 0.1s ease-out'
            }}
          />

          {/* Dynamic 3D projected hotspots */}
          {projectedHotspots.map((hs) => {
            const isSelected = activeHotspot === hs.id;
            return (
              <div
                key={hs.id}
                className="absolute z-20 transition-all duration-300 pointer-events-auto"
                style={{
                  top: `${hs.yPercent}%`,
                  left: `${hs.xPercent}%`,
                  transform: 'translate(-50%, -50%)',
                  opacity: hs.isFront ? (0.3 + hs.depth * 0.7) : 0, // fade significantly on back face
                  scale: hs.isFront ? 1 : 0.6,
                  pointerEvents: hs.isFront ? 'auto' : 'none',
                }}
              >
                {/* Hotspot anchor trigger button */}
                <button
                  onClickCapture={(e) => {
                    e.stopPropagation();
                    setActiveHotspot(isSelected ? null : hs.id);
                    playTickSound();
                  }}
                  className={`w-6 h-6 flex items-center justify-center rounded-full backdrop-blur-md border outline-none group/btn ${
                    isSelected 
                      ? 'bg-indigo-600 text-white border-indigo-400 scale-110 shadow-[0_0_15px_rgba(99,102,241,0.7)]' 
                      : 'bg-black/75 text-indigo-400 border-indigo-500/40 hover:bg-indigo-600 hover:text-white hover:border-indigo-400'
                  } transition-all duration-200 cursor-pointer`}
                >
                  <span className="absolute inset-0 rounded-full bg-indigo-500/10 animate-ping group-hover:block" />
                  <Info size={11} className="relative z-10" />
                </button>

                {/* Micro tooltip label snippet */}
                <AnimatePresence>
                  {!isSelected && hs.isFront && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-[#0A0A0C]/90 border border-white/5 text-[9px] font-black tracking-widest text-[#FFF] uppercase whitespace-nowrap shadow-md pointer-events-none z-10`}
                    >
                      {isArabic ? hs.titleAr : hs.titleEn}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Embedded details drawer overlay if hotspot is clicked */}
      <AnimatePresence>
        {activeHotspotDetails && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="absolute bottom-16 inset-x-4 max-w-lg md:mx-auto z-40 bg-[#121217]/95 border border-indigo-500/30 backdrop-blur-xl p-4 sm:p-5 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.8)]"
          >
            <div className="flex justify-between items-start mb-2 gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse" />
                <h4 className="text-sm font-black text-white uppercase tracking-tight">
                  {isArabic ? activeHotspotDetails.titleAr : activeHotspotDetails.titleEn}
                </h4>
              </div>
              <button 
                onClick={() => setActiveHotspot(null)}
                className="text-white/40 hover:text-white hover:bg-white/5 p-1 rounded transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              {isArabic ? activeHotspotDetails.descAr : activeHotspotDetails.descEn}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Dial/Rotator Ring UI overlay footer */}
      <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-auto select-none">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-black/50 border border-white/5 backdrop-blur-lg px-4 py-3 rounded-2xl">
          {/* Compass layout indicators */}
          <div className="flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span className="font-mono text-xs font-bold tracking-widest text-zinc-400 flex items-center gap-1">
              <span>{isArabic ? 'صورة:' : 'PHOTO:'}</span>
              <span className="text-white bg-white/10 px-1.5 py-0.5 rounded font-black">
                {currentImageIndex + 1} / {availableImages.length}
              </span>
            </span>
          </div>

          {/* Interactive bezel track with slider */}
          <div className="flex-1 max-w-sm w-full mx-2 flex items-center gap-3">
            <span className="font-mono text-[10px] text-zinc-500">0°</span>
            <div className="relative flex-1 group">
              <input 
                type="range"
                min="0"
                max="359"
                value={angle}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (Math.abs(angle - val) >= 5) {
                    playTickSound();
                  }
                  setAngle(val);
                }}
                className="w-full accent-indigo-500 h-1 bg-stone-800 rounded-lg cursor-pointer max-w-full hover:accent-indigo-400"
              />
            </div>
            <span className="font-mono text-[10px] text-zinc-500">360°</span>
          </div>

          {/* Core reset and degree coordinates indicators */}
          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1 rounded bg-[#0A0A0C] border border-white/5 text-center shadow-inner min-w-[55px]">
              <span className="font-mono text-xs font-black text-indigo-400">{angle}°</span>
            </div>
            <button
              onClick={resetAngle}
              className="p-1 px-2.5 flex items-center gap-1 rounded bg-[#17171B] border border-white/10 hover:bg-indigo-600 hover:text-white transition-all text-[10px] font-extrabold uppercase text-stone-400 cursor-pointer"
              title={isArabic ? 'إعادة تعيين الزاوية' : 'Reset Angle'}
            >
              <RotateCcw size={10} />
              <span>{isArabic ? 'البداية' : 'RESET'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
