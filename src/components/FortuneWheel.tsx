import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useStore } from '../StoreContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, X, Sparkles, AlertCircle, Copy, Check, Navigation, Play } from 'lucide-react';

interface Slice {
  percent: number;
  code: string;
  color: string;
  bgColor: string;
  labelAr: string;
  labelEn: string;
}

export const FortuneWheel: React.FC = () => {
  const { applyDiscountCode, appliedDiscount, formatPrice } = useStore();
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [isOpen, setIsOpen] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);
  const [wonSlice, setWonSlice] = useState<Slice | null>(null);
  const [copied, setCopied] = useState(false);

  // 24 hours cooldown limit states
  const [lastSpinTime, setLastSpinTime] = useState<number | null>(null);
  const [cooldownTimeLeft, setCooldownTimeLeft] = useState<number>(0);

  // Define the five discount slices specified by the user (5%, 10%, 15%, 20%, 25%)
  const slices: Slice[] = useMemo(() => [
    { percent: 5, code: 'LUCKY5', color: '#FFFFFF', bgColor: '#1A1A1A', labelAr: 'خصم 5%', labelEn: '5% OFF' },
    { percent: 20, code: 'LUCKY20', color: '#1A1A1A', bgColor: '#F5E6CA', labelAr: 'خصم 20%', labelEn: '20% OFF' },
    { percent: 10, code: 'LUCKY10', color: '#FFFFFF', bgColor: '#8D7B68', labelAr: 'خصم 10%', labelEn: '10% OFF' },
    { percent: 25, code: 'LUCKY25', color: '#FFFFFF', bgColor: '#C5A05B', labelAr: 'خصم 25% 🌟', labelEn: '25% OFF 🌟' },
    { percent: 15, code: 'LUCKY15', color: '#1A1A1A', bgColor: '#C5A05B/30', labelAr: 'خصم 15%', labelEn: '15% OFF' }
  ], []);

  const numSlices = slices.length;
  const degreesPerSlice = 360 / numSlices;

  // Track the current rotation angle for the visual spin
  const [rotation, setRotation] = useState(0);

  // Audio helper: play mechanical woodblock ticks as individual slices cross the pin
  const playTickSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(10, audioCtx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.05);
    } catch {
      // Ignored if browser blocks autoplay or context failed
    }
  };

  // Audio helper: play a satisfying golden celebration chime when the spin stops on a discount
  const playWinSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const notes = [392.00, 523.25, 659.25, 783.99, 1046.50]; // Beautiful C Major pentatonic arpeggio
      notes.forEach((freq, idx) => {
        const startTime = audioCtx.currentTime + idx * 0.09;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.16, startTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.002, startTime + 0.45);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.5);
      });
    } catch {
      // Ignored if browser audios are blocked
    }
  };

  // Check local storage on mount to see if user has already won a code and if 24 hours has passed
  useEffect(() => {
    try {
      const storedLastSpin = localStorage.getItem('onxifi_wheel_last_spin');
      const storedWonCode = localStorage.getItem('onxifi_wheel_code') || localStorage.getItem('trendifi_wheel_code');
      const storedWonPercent = localStorage.getItem('onxifi_wheel_percent') || localStorage.getItem('trendifi_wheel_percent');

      if (storedLastSpin) {
        const lastTime = parseInt(storedLastSpin, 10);
        const elapsed = Date.now() - lastTime;
        const cooldown = 24 * 60 * 60 * 1000; // 24 hours

        if (elapsed < cooldown) {
          setHasSpun(true);
          setLastSpinTime(lastTime);
          setCooldownTimeLeft(cooldown - elapsed);
          
          if (storedWonCode && storedWonPercent) {
            const matched = slices.find(s => s.code === storedWonCode) || slices[2];
            setWonSlice(matched);
          }
        } else {
          // Cooldown has expired, reset the state
          setHasSpun(false);
          setWonSlice(null);
          setLastSpinTime(null);
          setCooldownTimeLeft(0);
          localStorage.removeItem('onxifi_wheel_spun');
          localStorage.removeItem('onxifi_wheel_last_spin');
          localStorage.removeItem('onxifi_wheel_code');
          localStorage.removeItem('onxifi_wheel_percent');
        }
      } else {
        // Fallback for legacy "onxifi_wheel_spun" flag
        const legacySpun = localStorage.getItem('onxifi_wheel_spun') || localStorage.getItem('trendifi_wheel_spun');
        if (legacySpun === 'true') {
          // Treat as if spun 12 hours ago
          const approxLastTime = Date.now() - (12 * 60 * 60 * 1000);
          localStorage.setItem('onxifi_wheel_last_spin', approxLastTime.toString());
          setHasSpun(true);
          setLastSpinTime(approxLastTime);
          setCooldownTimeLeft(12 * 60 * 60 * 1000);
          if (storedWonCode) {
            const matched = slices.find(s => s.code === storedWonCode) || slices[2];
            setWonSlice(matched);
          }
        }
      }
    } catch {
      // Local storage exception
    }
  }, [slices]);

  // Handle the active cooldown timer decrement
  useEffect(() => {
    if (cooldownTimeLeft <= 0) return;

    const timer = setInterval(() => {
      setCooldownTimeLeft((prev) => {
        if (prev <= 1000) {
          clearInterval(timer);
          setHasSpun(false);
          setWonSlice(null);
          setLastSpinTime(null);
          try {
            localStorage.removeItem('onxifi_wheel_spun');
            localStorage.removeItem('onxifi_wheel_last_spin');
            localStorage.removeItem('onxifi_wheel_code');
            localStorage.removeItem('onxifi_wheel_percent');
          } catch {}
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownTimeLeft]);

  const formatCooldown = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const pad = (n: number) => n.toString().padStart(2, '0');

    if (isRtl) {
      return `${hours} ساعة و ${minutes} دقيقة و ${seconds} ثانية`;
    }
    return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  };

  // Handle the interactive dynamic spin
  const handleSpin = () => {
    if (isSpinning || hasSpun) return;

    setIsSpinning(true);
    setWonSlice(null);

    // Generate random cycles (at least 6-8 rotations)
    const extraRotations = 6 + Math.floor(Math.random() * 4);
    // Pick a random landing slice index
    const winningIndex = Math.floor(Math.random() * numSlices);
    const targetSlice = slices[winningIndex];

    // Calculate rotation to make the selected slice land perfectly at the top pointer (0 degree index starts pointing pointing up)
    // The top pointer is at 0 / 360 degrees.
    // Each slice starts at index * degreesPerSlice, going clockwise.
    // To align center of winning index with top pointer:
    const sliceCenterAngle = winningIndex * degreesPerSlice + (degreesPerSlice / 2);
    // Rotating element clockwise by `angle`: the pointer at top matches original element position at `360 - centerAngle`
    const finalAngle = (extraRotations * 360) + (360 - sliceCenterAngle);

    setRotation(finalAngle);

    // Simulate audio ticking as the wheel rotates
    let currentTickAngle = 0;
    const ticksCount = extraRotations * numSlices + winningIndex;
    const tickIntervalRef = setInterval(() => {
      playTickSound();
    }, 130);

    // Clear interval when spin approaches slower deceleration phase
    setTimeout(() => {
      clearInterval(tickIntervalRef);
    }, 2800);

    // Finish spinning after the CSS transition completes
    setTimeout(() => {
      setIsSpinning(false);
      setHasSpun(true);
      setWonSlice(targetSlice);
      playWinSound();

      const now = Date.now();
      setLastSpinTime(now);
      setCooldownTimeLeft(24 * 60 * 60 * 1000);

      // Persist to prevent abuse & remember the code they got
      try {
        localStorage.setItem('onxifi_wheel_spun', 'true');
        localStorage.setItem('onxifi_wheel_last_spin', now.toString());
        localStorage.setItem('onxifi_wheel_code', targetSlice.code);
        localStorage.setItem('onxifi_wheel_percent', targetSlice.percent.toString());
      } catch {
        // Sandboxed storage exception
      }
    }, 4000); // Transitions durations is 4000ms
  };

  // Helper calculation to draw sleek pie sector SVG paths
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const drawSectorPath = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return [
      'M', centerX, centerY,
      'L', start.x, start.y,
      'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      'Z'
    ].join(' ');
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleQuickApply = (code: string) => {
    applyDiscountCode(code);
    setIsOpen(false);
  };

  // Styling text keys
  const langText = {
    launcherBtn: isRtl ? 'عجلة الحظ 🎡' : 'Spin & Win 🎡',
    windowHeader: isRtl ? 'عجلة الحظ للخصومات الهائلة' : 'Spin the Fortune Wheel!',
    windowSubtitle: isRtl 
      ? 'جرب حظك واحصل على خصم عشوائي إضافي يصل إلى 25% على كامل مشترياتك!' 
      : 'Try your luck and win up to 25% OFF stackable coupon for your entire shopping bag!',
    buttonSpinReady: isRtl ? 'ادفع العجلة واربح! 🎉' : 'Tap to Spin the Wheel! 🎉',
    buttonSpinning: isRtl ? 'يجري الدوران... ⏳' : 'Spinning... ⏳',
    congratsTitle: isRtl ? 'مبـروووك! لقد ربحت! 🎉' : 'Congratulations! You Won! 🎉',
    wonDiscountDesc: isRtl ? 'لقد ربحت خصم خاص لمتجرك المفضل بقيمة' : 'You have claimed a special shopping discount of',
    codeLabel: isRtl ? 'كود الخصم الحصري:' : 'Lucky Promo Code:',
    applyAutoBtn: isRtl ? 'تطبيق الخصم تلقائياً وغلق' : 'Apply Discount Instantly',
    alreadySpunTitle: isRtl ? 'كود خصمك المحفوظ 🎟️' : 'Your Promo Code Is Active! 🎟️',
    alreadySpunDesc: isRtl 
      ? 'لقد حصلت بالفعل على فرصتك وربحت مسبقاً! ها هو كود خصمك جاهز للاستخدام مباشرة:' 
      : 'You have already spun the wheel for this visit! Keep your coupon code handy:',
    copiedText: isRtl ? 'تم النسخ!' : 'Copied!',
    copyBtn: isRtl ? 'نسخ الكود' : 'Copy Code',
    terms: isRtl ? '* صالح للاستخدام مرة واحدة لكل عميل.' : '* Redeemable on check out, once per customer.'
  };

  return (
    <>
      {/* Floating launcher trigger button */}
      <div className="fixed bottom-24 right-6 z-40">
        <motion.button
          onClick={() => setIsOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-brand-charcoal text-white shadow-2xl border border-[#C5A05B]/30 cursor-pointer overflow-hidden relative group"
        >
          {/* Internal sparkle overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C5A05B]/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
            className="flex-shrink-0"
          >
            <Gift className="text-brand-gold" size={18} />
          </motion.div>
          <span className="text-[11px] font-black tracking-wider uppercase">
            {langText.launcherBtn}
          </span>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
        </motion.button>
      </div>

      {/* Backdrop & Drawer Modal Popup overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 bg-brand-charcoal/80 backdrop-blur-md z-[200] flex items-end sm:items-center justify-center p-4 overflow-y-auto no-scrollbar pt-24 sm:pt-4">
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="bg-white border border-[#C5A05B]/10 rounded-[2.5rem] p-6 md:p-8 max-w-md w-full relative overflow-hidden shadow-2xl flex flex-col items-center text-center max-h-[90vh] overflow-y-auto no-scrollbar"
              dir={isRtl ? 'rtl' : 'ltr'}
            >
              {/* Close Button Button */}
              <button
                onClick={() => {
                  if (!isSpinning) setIsOpen(false);
                }}
                disabled={isSpinning}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100/80 hover:bg-gray-150 text-brand-charcoal/80 flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
              >
                <X size={15} />
              </button>

              {/* Decorative background vectors */}
              <div className="absolute -left-10 -bottom-10 w-24 h-24 bg-brand-gold/10 rounded-full blur-xl pointer-events-none" />
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-[#FAF7F2] rounded-full blur-xl pointer-events-none" />

              {/* Header Titles */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-center">
                  <span className="bg-[#FAF7F2] border border-[#C5A05B]/15 px-3.5 py-1.5 rounded-full text-[10px] font-black text-brand-gold uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={12} className="animate-spin-slow" />
                    {isRtl ? 'لعبة الحظ والهدايا' : 'LUCKY REWARDS WHEEL'}
                  </span>
                </div>
                <h3 className="text-xl md:text-2xl font-black text-brand-charcoal tracking-tight">
                  {langText.windowHeader}
                </h3>
                <p className="text-[10px] md:text-xs text-brand-charcoal/50 leading-relaxed font-bold max-w-sm">
                  {langText.windowSubtitle}
                </p>
              </div>

              {/* THE WHEEL CONTAINER */}
              <div className="relative w-64 h-64 md:w-72 md:h-72 my-4 flex items-center justify-center">
                
                {/* Outer decorative ring border */}
                <div className="absolute inset-0 rounded-full border-8 border-brand-charcoal shadow-2xl z-10 pointer-events-none" />
                
                {/* Glowing light bulbs array */}
                <div className="absolute inset-0 rounded-full p-2 z-15 pointer-events-none border border-brand-gold/20 flex items-center justify-center">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={`bulb-${i}`}
                      style={{
                        position: 'absolute',
                        transform: `rotate(${i * 30}deg) translateY(-132px)`,
                      }}
                      className={`w-1.5 h-1.5 rounded-full bg-brand-gold shadow-[0_0_8px_#C5A05B] ${
                        isSpinning ? 'animate-pulse' : ''
                      }`}
                    />
                  ))}
                </div>

                {/* Arrow Pointer pinning at top center center */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.25)] flex flex-col items-center">
                  <Navigation className="text-red-500 fill-red-500 transform rotate-180" size={24} />
                  <div className="w-2.5 h-2.5 rounded-full bg-brand-charcoal -mt-1.5 border border-white" />
                </div>

                {/* Rotating SVG Wheel Element */}
                <div
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: isSpinning ? 'transform 4000ms cubic-bezier(0.1, 0.8, 0.1, 1)' : 'none',
                  }}
                  className="w-full h-full rounded-full overflow-hidden shadow-inner flex items-center justify-center bg-gray-200"
                >
                  <svg className="w-full h-full origin-center transform -rotate-90" viewBox="0 0 300 300">
                    <defs>
                      <filter id="shadow">
                        <feDropShadow dx="-1" dy="1" stdDeviation="1" />
                      </filter>
                    </defs>
                    {slices.map((slice, index) => {
                      const startAngle = index * degreesPerSlice;
                      const endAngle = startAngle + degreesPerSlice;
                      const textAngle = startAngle + degreesPerSlice / 2;

                      // Midpoint for placing text labels within each sector pie
                      const labelRadius = 95;
                      const textPos = polarToCartesian(150, 150, labelRadius, textAngle);

                      return (
                        <g key={`slice-${index}`}>
                          <path
                            d={drawSectorPath(150, 150, 142, startAngle, endAngle)}
                            fill={slice.bgColor.includes('/') ? '#C5A05B' : slice.bgColor}
                            fillOpacity={slice.bgColor.includes('/') ? 0.3 : 1}
                            stroke="#FFFFFF"
                            strokeWidth="1.5"
                          />
                          <text
                            x={textPos.x}
                            y={textPos.y}
                            fill={slice.color}
                            transform={`rotate(${textAngle + 90}, ${textPos.x}, ${textPos.y})`}
                            textAnchor="middle"
                            dominantBaseline="central"
                            className="font-black text-[12px] tracking-tight filter drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
                          >
                            {isRtl ? slice.labelAr : slice.labelEn}
                          </text>
                        </g>
                      );
                    })}

                    {/* Golden central hub button core */}
                    <circle cx="150" cy="150" r="22" fill="#1A1A1A" stroke="#C5A05B" strokeWidth="3" />
                  </svg>
                </div>

                {/* Center Spin Trigger button on top of wheel */}
                <button
                  onClick={handleSpin}
                  disabled={isSpinning || hasSpun}
                  className={`absolute z-30 w-11 h-11 rounded-full bg-[#C5A05B] text-[#1A1A1A] hover:bg-[#D5B06B] font-black text-[9px] shadow-xl border-2 border-white flex items-center justify-center tracking-widest uppercase transition-transform cursor-pointer hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                  <Play size={10} className="fill-[#1A1A1A] transform rotate-90 ml-0.5" />
                </button>
              </div>

              {/* Action and results bottom tray card */}
              <div className="w-full mt-4 space-y-4">
                
                {/* Case 1: Wheel has spun & won a discount coupon */}
                {hasSpun && wonSlice && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-[#FAF7F2] border border-[#C5A05B]/15 rounded-3xl p-5 space-y-3 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-[#C5A05B]/5 rounded-bl-full pointer-events-none" />
                    
                    <div>
                      <h4 className="text-xs font-black text-green-600 flex items-center justify-center gap-1.5">
                        <Sparkles size={14} className="animate-spin-slow" />
                        {wonSlice.percent ? langText.congratsTitle : langText.alreadySpunTitle}
                      </h4>
                      <p className="text-[10px] text-brand-charcoal/50 font-bold mt-1 max-w-sm mx-auto">
                        {wonSlice.percent ? `${langText.wonDiscountDesc} ${wonSlice.percent}%!` : langText.alreadySpunDesc}
                      </p>
                    </div>

                    {/* Giant percentage text */}
                    <div className="text-3xl font-black text-brand-gold tracking-tight">
                      {wonSlice.percent}% {isRtl ? 'خصم مذهل' : 'OFF!'}
                    </div>

                    {/* Copy Box code */}
                    <div className="flex items-center gap-2 max-w-xs mx-auto p-2 rounded-xl bg-white border border-gray-150">
                      <div className="flex-1 text-center font-mono text-sm font-black text-[#1A1A1A]">
                        {wonSlice.code}
                      </div>

                      <button
                        onClick={() => handleCopyCode(wonSlice.code)}
                        className="px-3.5 py-1.5 bg-brand-charcoal hover:bg-brand-charcoal/90 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                      >
                        {copied ? <Check size={11} /> : <Copy size={11} />}
                        <span>{copied ? langText.copiedText : langText.copyBtn}</span>
                      </button>
                    </div>

                    {/* Standard automatic action apply code */}
                    <div className="pt-2 flex flex-col gap-2">
                      <button
                        onClick={() => handleQuickApply(wonSlice.code)}
                        className="w-full py-2.5 bg-[#C5A05B] hover:bg-[#D5B06B] text-[#1A1A1A] rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer shadow-md"
                      >
                        {langText.applyAutoBtn}
                      </button>
                      <button
                        onClick={() => setIsOpen(false)}
                        className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-brand-charcoal rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        {isRtl ? 'إغلاق' : 'Close'}
                      </button>
                    </div>

                    {cooldownTimeLeft > 0 && (
                      <div className="bg-amber-500/5 border border-[#C5A05B]/10 rounded-2xl p-2.5 text-center my-2">
                        <span className="text-[9px] font-black text-brand-gold block uppercase mb-1">
                          {isRtl ? 'يمكنك تدوير العجلة مرة أخرى بعد:' : 'Next Spin Available In:'}
                        </span>
                        <span className="font-mono text-xs font-black text-brand-gold block animate-pulse">
                          {formatCooldown(cooldownTimeLeft)}
                        </span>
                      </div>
                    )}

                    <p className="text-[8px] text-brand-charcoal/30 font-bold">
                      {langText.terms}
                    </p>
                  </motion.div>
                )}

                {/* Case 2: Wheel is ready to spin */}
                {!hasSpun && (
                  <div className="space-y-2">
                    <button
                      onClick={handleSpin}
                      disabled={isSpinning}
                      className="w-full py-3.5 bg-brand-charcoal text-white hover:bg-brand-charcoal/90 disabled:opacity-50 text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>
                        {isSpinning ? langText.buttonSpinning : langText.buttonSpinReady}
                      </span>
                    </button>
                    <button
                      onClick={() => setIsOpen(false)}
                      disabled={isSpinning}
                      className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-brand-charcoal transition-colors text-[11px] font-black uppercase tracking-widest rounded-xl cursor-pointer disabled:opacity-50"
                    >
                      {isRtl ? 'إلغاء' : 'Cancel'}
                    </button>
                    <p className="text-[9px] text-brand-charcoal/40 font-bold mt-1">
                      {langText.terms}
                    </p>
                  </div>
                )}
                
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
