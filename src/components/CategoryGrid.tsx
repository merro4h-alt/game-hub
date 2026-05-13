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
      className: 'md:col-span-2 md:row-span-2 h-[400px] md:h-full',
    },
    {
      key: 'cosmetic',
      image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=800',
      count: '150+',
      className: 'md:col-span-1 md:row-span-1 h-[250px] md:h-full',
    },
    {
      key: 'sport',
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800',
      count: '180+',
      className: 'md:col-span-1 md:row-span-1 h-[250px] md:h-full',
    },
    {
      key: 'accessories',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800',
      count: '120+',
      className: 'md:col-span-1 md:row-span-2 h-[350px] md:h-full',
    },
    {
      key: 'lifestyle',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800',
      count: '95+',
      className: 'md:col-span-2 md:row-span-1 h-[250px] md:h-full',
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

      <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-3 gap-6">
        {categories.map((cat, idx) => {
          const name = t(`categories.${cat.key}`);
          return (
            <Link
              key={cat.key}
              to={`/shop?category=${encodeURIComponent(name)}`}
              className={`group relative overflow-hidden rounded-[2rem] cursor-pointer block shadow-2xl border border-white/5 ${cat.className}`}
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                viewport={{ once: true }}
                className="h-full w-full"
              >
                <img
                  src={cat.image}
                  alt={name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-10 opacity-70 group-hover:opacity-90 transition-opacity" />
                
                <div className="absolute inset-0 p-8 flex flex-col justify-end z-20">
                  <span className="text-white/60 text-xs font-bold tracking-[0.2em] uppercase mb-2 block transform group-hover:-translate-y-1 transition-transform">{cat.count} {t('home.products')}</span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 tracking-tight">
                    {name}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-brand-gold font-bold text-sm overflow-hidden h-0 group-hover:h-6 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                    <span className="uppercase tracking-widest">{t('home.shopNow')}</span>
                    <ArrowRight size={16} />
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
