import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Truck, Sparkles, Tag, Gift, ShieldCheck } from 'lucide-react';

export const PromotionBar = () => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const messages = [
    { text: isArabic ? 'تسوق بثقة – استرجاع كامل للمبلغ خلال 14 يوم' : 'Shop with confidence – 14-day full refund', icon: <ShieldCheck size={12} className="text-brand-gold" /> },
    { text: isArabic ? 'ضمان استرجاع 100% في حال عدم تطابق المواصفات' : '100% money back if specs don\'t match', icon: <ShieldCheck size={12} className="text-green-500" /> },
    { text: isArabic ? 'توصيل مجاني للطلبات أكثر من $100' : 'Free shipping on orders over $100', icon: <Truck size={12} /> },
    { text: isArabic ? 'اشترِ قطعتين واحصل على الثالثة مجاناً!' : 'Buy 2, Get the 3rd FREE!', icon: <Gift size={12} className="text-brand-gold" /> },
    { text: isArabic ? 'خصم 15% باستخدام كود: START15' : '15% OFF with code: START15', icon: <Tag size={12} /> },
  ];

  return (
    <div id="promotion-bar" className="bg-[#0A0A0B] text-white overflow-hidden py-2.5 border-b border-white/10 relative z-[60]">
      <div id="promotion-container" className="relative flex whitespace-nowrap overflow-hidden">
        <motion.div
          animate={{ x: isArabic ? ['0%', '50%'] : ['0%', '-50%'] }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
          className="flex items-center gap-16 sm:gap-32 min-w-max group pt-1"
        >
          {[...messages, ...messages, ...messages, ...messages].map((item, index) => (
            <div key={index} className="flex items-center gap-4 px-2">
              <span className="text-brand-gold">{item.icon}</span>
              <span className="text-[11px] font-black uppercase tracking-[0.25em] whitespace-nowrap group-hover:text-brand-gold transition-colors">
                {item.text}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
