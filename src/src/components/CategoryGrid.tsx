import React from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const CategoryGrid: React.FC = () => {
  const { t } = useTranslation();

  const categories = [
    {
      key: 'fashion',
      image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=800',
      count: '240+',
    },
    {
      key: 'cosmetic',
      image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=800',
      count: '150+',
    },
    {
      key: 'sport',
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800',
      count: '180+',
    },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
        <div>
          <span className="text-brand-gold font-semibold uppercase tracking-[0.2em] text-sm mb-4 block">{t('home.categories')}</span>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter text-white">{t('home.explore')}</h2>
        </div>
        <Link to="/shop" className="group flex items-center gap-3 font-semibold text-lg text-white/70 hover:text-brand-gold transition-colors">
          {t('home.viewAll')}
          <ArrowRight className="group-hover:translate-x-2 transition-transform" />
        </Link>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
        {categories.map((cat, idx) => {
          const name = t(`categories.${cat.key}`);
          return (
            <Link
              key={cat.key}
              to={`/shop?category=${encodeURIComponent(name)}`}
              className="group relative h-[400px] w-[300px] sm:w-[350px] flex-shrink-0 overflow-hidden rounded-[2.5rem] cursor-pointer block shadow-xl border border-white/10"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="h-full w-full"
              >
                <img
                  src={cat.image}
                  alt={name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                <div className="absolute bottom-10 left-10 z-20">
                  <span className="text-white/60 text-base font-medium tracking-wide mb-2 block">{cat.count} {t('home.products')}</span>
                  <h3 className="text-3xl sm:text-4xl font-black text-white mb-4 italic tracking-tighter">
                    <span className="bg-brand-gold px-4 py-1 inline-block">
                      {name}
                    </span>
                  </h3>
                  <div className="flex items-center gap-2 text-white font-bold group-hover:gap-4 transition-all opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 duration-500">
                    {t('home.shopNow')} <ArrowRight size={24} />
                  </div>
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default CategoryGrid;
