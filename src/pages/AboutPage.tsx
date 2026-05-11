import React from 'react';
import { motion } from 'motion/react';
import { Target, Heart, Zap, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AboutPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="pt-24 pb-32 bg-[#0A0A0B] text-white min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-24">
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-brand-gold font-bold uppercase tracking-[0.3em] text-xs mb-4 block"
          >
            {t('about.since')}
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 text-white"
          >
            {t('about.heroTitle1')} <span className="text-brand-gold italic">{t('about.heroTitleItalic')}</span> <br /> {t('about.heroTitle2')}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white/60 max-w-3xl mx-auto font-light leading-relaxed"
          >
            {t('about.heroDesc')}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-24 items-center mb-32">
          <div className="relative aspect-square rounded-[3rem] overflow-hidden bg-white/5">
             <img 
               src="https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&q=80&w=800" 
               className="w-full h-full object-cover"
               alt="Craftsmanship"
             />
          </div>
          <div className="space-y-8">
             <h2 className="text-4xl font-bold tracking-tight text-white">{t('about.philosophyTitle')}</h2>
             <p className="text-white/70 font-light text-lg leading-relaxed">
               {t('about.philosophyDesc')}
             </p>
             <div className="grid grid-cols-2 gap-8 pt-8">
                <div className="space-y-4">
                   <div className="w-12 h-12 bg-brand-gold/10 flex items-center justify-center rounded-2xl text-brand-gold">
                      <Target size={24} />
                   </div>
                   <h4 className="font-bold text-white">{t('about.precision')}</h4>
                   <p className="text-sm text-white/50 font-light">{t('about.precisionDesc')}</p>
                </div>
                <div className="space-y-4">
                   <div className="w-12 h-12 bg-brand-gold/10 flex items-center justify-center rounded-2xl text-brand-gold">
                      <Heart size={24} />
                   </div>
                   <h4 className="font-bold text-white">{t('about.passion')}</h4>
                   <p className="text-sm text-white/50 font-light">{t('about.passionDesc')}</p>
                </div>
                <div className="space-y-4">
                   <div className="w-12 h-12 bg-brand-gold/10 flex items-center justify-center rounded-2xl text-brand-gold">
                      <Zap size={24} />
                   </div>
                   <h4 className="font-bold text-white">{t('about.innovation')}</h4>
                   <p className="text-sm text-white/50 font-light">{t('about.innovationDesc')}</p>
                </div>
                <div className="space-y-4">
                   <div className="w-12 h-12 bg-brand-gold/10 flex items-center justify-center rounded-2xl text-brand-gold">
                      <Globe size={24} />
                   </div>
                   <h4 className="font-bold text-white">{t('about.sustainability')}</h4>
                   <p className="text-sm text-white/50 font-light">{t('about.sustainabilityDesc')}</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
