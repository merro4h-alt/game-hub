import React from 'react';
import { motion } from 'motion/react';
import { Gift, Sparkles, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const LoyaltyBanner = () => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="mt-16 relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] opacity-10 blur-3xl group-hover:opacity-20 transition-opacity duration-700" />
      
    <div className="relative bg-[#0A0A0B] border border-white/10 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[80%] bg-[#4F46E5]/20 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[80%] bg-brand-gold/10 blur-[120px] rounded-full" />
        </div>

        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 z-10">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-gold to-amber-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-gold/20 shrink-0">
              <Gift size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-brand-gold" />
                <span className="text-[10px] font-black uppercase tracking-[.4em] text-brand-gold/80">Premium Loyalty Club</span>
              </div>
              <h3 className="text-3xl sm:text-4xl font-black tracking-tighter leading-tight text-white">
                {isArabic ? (
                  <>تسوق مرتين.. واحصل على <span className="text-brand-gold inline-block transform hover:scale-105 transition-transform cursor-default">الثالثة مجاناً!</span></>
                ) : (
                  <>Buy 2 items, get the <span className="text-brand-gold inline-block transform hover:scale-105 transition-transform cursor-default">3rd one FREE!</span></>
                )}
              </h3>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
            <div className="flex -space-x-4 rtl:space-x-reverse">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`w-12 h-12 rounded-full border-4 border-[#0A0A0B] flex items-center justify-center text-xs font-black shadow-lg ${i === 3 ? 'bg-brand-gold text-[#0A0A0B]' : 'bg-white/10 text-white'}`}>
                  {i === 3 ? <CheckCircle2 size={20} /> : i}
                </div>
              ))}
            </div>
            <div className="h-10 w-px bg-white/10 hidden sm:block" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 max-w-[180px] text-center md:text-start leading-relaxed">
              {isArabic 
                ? 'العرض يطبق تلقائياً عند الدفع لجميع أعضاء نادي تريندايفي' 
                : 'Applied automatically at checkout for all Trendifi members'}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
