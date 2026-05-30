import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, Sparkles, Check, Gift, Copy, Clock, RefreshCw, X, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../StoreContext';

interface ChestState {
  id: number;
  nameAr: string;
  nameEn: string;
  color: string;
  gradient: string;
  borderColor: string;
}

const CHESTS: ChestState[] = [
  { id: 1, nameAr: 'صندوق البرونز', nameEn: 'Bronze Chest', color: '#B45309', gradient: 'from-amber-700 to-yellow-900', borderColor: 'border-amber-600' },
  { id: 2, nameAr: 'صندق الذهب الملكي', nameEn: 'Royal Golden Chest', color: '#D97706', gradient: 'from-yellow-400 to-amber-600', borderColor: 'border-yellow-300' },
  { id: 3, nameAr: 'صندوق الزمرد الفاخر', nameEn: 'Luxurious Emerald Chest', color: '#059669', gradient: 'from-emerald-400 to-teal-700', borderColor: 'border-emerald-300' }
];

const REWARDS = [
  { code: 'WHEEL25', textAr: 'خصم هائل بنسبة 25%', textEn: 'Giant 25% Off Coupon', type: 'coupon' },
  { code: 'FORTUNE20', textAr: 'خصم ذهبي بنسبة 20%', textEn: 'Golden 20% Off Coupon', type: 'coupon' },
  { code: 'LUCKY15', textAr: 'خصم الحظ بنسبة 15%', textEn: 'Lucky 15% Off Coupon', type: 'coupon' },
  { code: 'WHEEL10', textAr: 'خصم بنسبة 10%', textEn: 'Comforting 10% Off Coupon', type: 'coupon' },
  { code: 'FREE_SHIPPING', textAr: 'شحن مجاني بالكامل!', textEn: 'Full Free Shipping Code!', type: 'coupon' }
];

export const DailyBoxChallenge: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  const { applyDiscountCode } = useStore();

  const [isOpen, setIsOpen] = useState(false);
  const [lastPlayed, setLastPlayed] = useState<number | null>(null);
  const [cooldown, setCooldown] = useState<string>('');
  const [currentlyOpeningId, setCurrentlyOpeningId] = useState<number | null>(null);
  const [shakingId, setShakingId] = useState<number | null>(null);
  const [revealedReward, setRevealedReward] = useState<typeof REWARDS[0] | null>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const [successApplied, setSuccessApplied] = useState(false);

  // Sound Synthesizer via Web Audio API (Zero exterior dependencies!)
  const playSynthesizerSound = (type: 'shake' | 'win') => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      if (type === 'shake') {
        // Shake feedback synth
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.3);
        
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (type === 'win') {
        // Sweet Win Fanfare chord notes
        const playNote = (freq: number, start: number, duration: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
          gain.gain.setValueAtTime(0.12, ctx.currentTime + start);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + start);
          osc.stop(ctx.currentTime + start + duration);
        };

        playNote(261.63, 0, 0.2); // C4
        playNote(329.63, 0.1, 0.2); // E4
        playNote(392.00, 0.2, 0.2); // G4
        playNote(523.25, 0.3, 0.6); // C5 (Main victory root note)
        playNote(659.25, 0.4, 0.6); // E5
      }
    } catch (e) {
      console.warn("Synth audio play failed/blocked:", e);
    }
  };

  // Check Local Timer on Mount
  useEffect(() => {
    const saved = localStorage.getItem('onxifi_daily_box_last');
    if (saved) {
      setLastPlayed(parseInt(saved, 10));
    }
  }, []);

  // Update Countdown Timer
  useEffect(() => {
    if (!lastPlayed) return;

    const interval = setInterval(() => {
      const nextAvailable = lastPlayed + 24 * 60 * 60 * 1000;
      const remains = nextAvailable - Date.now();

      if (remains <= 0) {
        setCooldown('');
        setLastPlayed(null);
        localStorage.removeItem('onxifi_daily_box_last');
        clearInterval(interval);
      } else {
        const hours = Math.floor(remains / (1000 * 60 * 60));
        const minutes = Math.floor((remains % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remains % (1000 * 60)) / 1000);
        setCooldown(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastPlayed]);

  const handleOpenChest = (id: number) => {
    if (lastPlayed) return; // on cooldown
    
    // 1. Shaking feedback loop
    setShakingId(id);
    playSynthesizerSound('shake');
    
    setTimeout(() => {
      playSynthesizerSound('shake');
    }, 200);

    setTimeout(() => {
      setShakingId(null);
      setCurrentlyOpeningId(id);
      
      // Delay mystery reward reveal
      setTimeout(() => {
        const selected = REWARDS[Math.floor(Math.random() * REWARDS.length)];
        setRevealedReward(selected);
        playSynthesizerSound('win');
        
        // Save current timestamp
        const now = Date.now();
        localStorage.setItem('onxifi_daily_box_last', String(now));
        setLastPlayed(now);
      }, 700);
    }, 600);
  };

  const handleCopyAndApply = () => {
    if (!revealedReward) return;
    navigator.clipboard.writeText(revealedReward.code);
    setHasCopied(true);
    
    // Automatically apply coupon in context
    const response = applyDiscountCode(revealedReward.code);
    if (response && response.success) {
      setSuccessApplied(true);
    }
    
    setTimeout(() => {
      setHasCopied(false);
    }, 2000);
  };

  return (
    <>
      {/* Floating Mystery Box Widget */}
      <motion.button
        id="daily-box-challenge-btn"
        className="fixed bottom-24 right-[11rem] z-40 w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-amber-600 text-stone-900 shadow-2xl flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 border border-white/20"
        animate={{ 
          y: [0, -6, 0],
          boxShadow: [
            "0px 10px 20px rgba(245, 158, 11, 0.2)",
            "0px 15px 30px rgba(245, 158, 11, 0.4)",
            "0px 10px 20px rgba(245, 158, 11, 0.2)"
          ]
        }}
        transition={{ 
          repeat: Infinity, 
          duration: 3, 
          ease: "easeInOut" 
        }}
        onClick={() => setIsOpen(true)}
        title={isRtl ? 'صناديق الحظ اليومية' : 'Daily Chest Challenge'}
      >
        <Gift size={20} className="text-stone-900 animate-pulse" />
        <span className="absolute -top-1 -left-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
      </motion.button>

      {/* Main Box Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
            {/* Dark glass backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!currentlyOpeningId) setIsOpen(false);
              }}
              className="absolute inset-0 bg-black/70 backdrop-blur-xl"
            />

            {/* Content Container Card */}
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="relative w-full max-w-lg bg-[#0F0F10] border border-white/10 rounded-[3rem] p-6 sm:p-10 text-center overflow-hidden z-10 shadow-3xl text-white"
            >
              {/* Decorative radial gradients */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Close Button */}
              {!currentlyOpeningId && (
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}

              {/* Banner / Category Icon */}
              <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-6">
                <Gift className="text-amber-500" size={28} />
              </div>

              {/* Modal State 1: Pick a Box */}
              {!currentlyOpeningId && !revealedReward && (
                <>
                  <h3 className="text-2xl font-black mb-3">
                    {isRtl ? 'تحدي صناديق الحظ اليومية' : 'Daily Chest Challenge'}
                  </h3>
                  <p className="text-xs text-white/50 max-w-sm mx-auto mb-8 leading-relaxed">
                    {isRtl 
                      ? 'اختر أحد الصناديق الثلاثة الغامضة بالأسفل لفتح مكافأتك للطلب المباشر! يمكنك المحاولة مرة واحدة فقط كل ٢٤ ساعة.' 
                      : 'Choose one of the 3 mystery chests below to reveal your daily shopping voucher! You can play only once every 24 hours.'}
                  </p>

                  {/* Cooldown Info */}
                  {cooldown ? (
                    <div className="inline-flex items-center gap-2 px-6 py-4 bg-white/[0.02] border border-white/5 rounded-2xl mb-4 max-w-xs mx-auto text-xs text-amber-500 font-mono">
                      <Clock size={14} />
                      <span>{isRtl ? `تفتح مجدداً بعد: ${cooldown}` : `Opens again in: ${cooldown}`}</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4 mb-2">
                      {CHESTS.map((chest) => (
                        <motion.button
                          key={chest.id}
                          onClick={() => handleOpenChest(chest.id)}
                          className={`flex flex-col items-center justify-center p-5 rounded-[2rem] bg-gradient-to-b ${chest.gradient} text-center border-2 ${chest.borderColor} relative group cursor-pointer shadow-xl`}
                          whileHover={{ scale: 1.05, y: -5 }}
                          animate={shakingId === chest.id ? {
                            x: [0, -6, 6, -6, 6, 0],
                            rotate: [0, -3, 3, -3, 3, 0]
                          } : {}}
                          transition={{ duration: 0.5 }}
                        >
                          {/* Chest Icon Wrapper */}
                          <div className="w-12 h-12 rounded-full bg-black/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <Gift className="text-white" size={22} />
                          </div>
                          
                          <span className="text-[10px] font-black uppercase text-white tracking-wider">
                            {isRtl ? chest.nameAr : chest.nameEn}
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Modal State 2: opening animation */}
              {currentlyOpeningId && !revealedReward && (
                <div className="py-12">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-6"
                  />
                  <h4 className="text-lg font-black tracking-widest uppercase">
                    {isRtl ? 'جاري فتح صندوقك السحري...' : 'Cracking the Mystery Box...'}
                  </h4>
                  <p className="text-xs text-white/40 mt-1">
                    {isRtl ? 'ابقَ مستعداً للمكافأة الحصرية' : 'Get ready for your exclusive award'}
                  </p>
                </div>
              )}

              {/* Modal State 3: Chest Revealed Reward Dashboard */}
              {revealedReward && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-6"
                >
                  <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                    <Award size={36} />
                  </div>
                  
                  <h3 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
                    {isRtl ? 'تهانينا الحارة لـك!' : 'Congratulations!'}
                  </h3>
                  <p className="text-xs text-white/50 mb-6">
                    {isRtl ? 'لقد فتحت بنجاح مكافأة صندوق الحظ اليومية:' : 'You have successfully unboxed your daily premium voucher:'}
                  </p>

                  <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-5 max-w-sm mx-auto mb-8">
                    <span className="text-xs text-[#C5A05B] font-black uppercase tracking-[0.2em] block mb-1">
                      {isRtl ? 'الجائزة المفتوحة' : 'Revealed prize'}
                    </span>
                    <h4 className="text-lg font-black text-white mb-3">
                      {isRtl ? revealedReward.textAr : revealedReward.textEn}
                    </h4>
                    
                    <div className="flex items-center justify-between bg-black/30 border border-white/10 p-3.5 rounded-2xl font-mono text-xl tracking-wider font-extrabold text-white">
                      <span>{revealedReward.code}</span>
                      <button
                        onClick={handleCopyAndApply}
                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                          hasCopied 
                            ? 'bg-green-500 text-white' 
                            : 'bg-amber-500 text-stone-900 hover:bg-white hover:text-black shadow-lg shadow-amber-500/10'
                        }`}
                      >
                        {hasCopied ? <Check size={12} /> : <Copy size={12} />}
                        <span>{hasCopied ? (isRtl ? 'نسخ!' : 'Copied!') : (isRtl ? 'تطبيق' : 'Apply')}</span>
                      </button>
                    </div>
                  </div>

                  {successApplied && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400 text-xs font-bold max-w-sm mx-auto mb-6"
                    >
                      {isRtl ? '✨ تم تفعيل كود الخصم وسلة التسوق جاهزة!' : '✨ Discount code activated and applied to your cart!'}
                    </motion.div>
                  )}

                  <button
                    onClick={() => {
                      setCurrentlyOpeningId(null);
                      setRevealedReward(null);
                      setIsOpen(false);
                      setSuccessApplied(false);
                    }}
                    className="w-full max-w-xs py-4 bg-white text-[#0A0A0B] hover:bg-[#C5A037] hover:text-white rounded-[1.5rem] transition-all font-black text-xs shadow-xl cursor-pointer"
                  >
                    {isRtl ? 'رائع، استمرار للتسوق!' : 'Excellent, Continue shopping'}
                  </button>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
