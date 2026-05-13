import React, { useMemo, useState } from 'react';
import { useStore } from '../StoreContext';
import ProductCard from '../components/ProductCard';
import { LoyaltyBanner } from '../components/LoyaltyBanner';
import { ListingSkeleton } from '../components/ProductSkeleton';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { ChevronDown, Filter, Sparkles } from 'lucide-react';

const ShopPage: React.FC = () => {
  const { products, isLoading } = useStore();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [sortBy, setSortBy] = useState<'default' | 'priceLow' | 'priceHigh' | 'rating'>('default');
  const [isSortOpen, setIsSortOpen] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const categoryFilter = queryParams.get('category');
  const searchQuery = queryParams.get('search')?.toLowerCase();

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by category
    if (categoryFilter) {
      if (categoryFilter === 'Offers' || categoryFilter === t('categories.offers')) {
        result = result.filter(p => p.category === 'Offers' || p.discountPrice !== undefined);
      } else {
        result = result.filter(p => {
          const categoryKey = p.category === 'Best Seller' ? 'bestSeller' : p.category.toLowerCase();
          return p.category === categoryFilter || t(`categories.${categoryKey}`) === categoryFilter;
        });
      }
    }

    // Filter by search query
    if (searchQuery) {
      result = result.filter(p => 
        p.name.toLowerCase().includes(searchQuery) || 
        p.description.toLowerCase().includes(searchQuery) ||
        p.category.toLowerCase().includes(searchQuery)
      );
    }

    // Apply Sorting
    switch (sortBy) {
      case 'priceLow':
        result.sort((a, b) => (a.discountPrice ?? a.price) - (b.discountPrice ?? b.price));
        break;
      case 'priceHigh':
        result.sort((a, b) => (b.discountPrice ?? b.price) - (a.discountPrice ?? a.price));
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
    }

    return result;
  }, [products, categoryFilter, searchQuery, t, sortBy]);
  
  const sortOptions = [
    { value: 'default', label: i18n.language === 'ar' ? 'الافتراضي' : 'Default' },
    { value: 'priceLow', label: i18n.language === 'ar' ? 'السعر (الأقل أولاً)' : 'Price (Low to High)' },
    { value: 'priceHigh', label: i18n.language === 'ar' ? 'السعر (الأعلى أولاً)' : 'Price (High to Low)' },
    { value: 'rating', label: i18n.language === 'ar' ? 'التقييم' : 'Customer Rating' },
  ];

  return (
    <div className="pt-24 pb-32 bg-[#0A0A0B] min-h-screen text-white">
      <Helmet>
        <title>{categoryFilter ? `${categoryFilter} | Shop Trendifi` : 'Shop | Trendifi - Everything New and Unique'}</title>
        <meta name="description" content="Shop the latest unique products at Trendifi. Quality electronics, fashion, and lifestyle items with local payment options in Iraq." />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16 flex flex-col items-center text-center">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-gold/10 border border-brand-gold/20 rounded-full mb-6 overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-gold/20 to-transparent animate-shimmer" />
            <span className="text-brand-gold text-[10px] font-black uppercase tracking-[0.4em] relative z-10">
              {t('home.firstChoice')}
            </span>
          </motion.div>
          
          <h1 className="text-6xl sm:text-7xl font-black tracking-tighter mb-6 text-white uppercase flex items-center justify-center gap-4 relative">
            <span className="relative z-10">{t('shop.title')}</span>
            <div className="absolute inset-0 blur-3xl bg-brand-gold/10 -z-10" />
            <Sparkles size={32} className="text-brand-gold animate-pulse" />
          </h1>
          
          <p className="text-white/60 font-medium tracking-[0.2em] uppercase text-xs max-w-lg mx-auto mb-10">
            {t('shop.subtitle')}
          </p>

          {/* Sorting Dropdown - Centered */}
          <div className="relative">
            <button 
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="px-8 py-4 bg-white/10 text-white border border-white/10 rounded-2xl flex items-center gap-4 font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:shadow-2xl hover:bg-white/15 transition-all active:scale-95 group font-mono"
            >
              <Filter size={14} className="text-brand-gold group-hover:rotate-12 transition-transform" />
              <span>{i18n.language === 'ar' ? 'ترتيب حسب:' : 'Sort By:'} {sortOptions.find(o => o.value === sortBy)?.label}</span>
              <ChevronDown size={14} className={`transition-transform duration-300 text-white/20 ${isSortOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {isSortOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full mt-3 left-1/2 -translate-x-1/2 w-64 bg-[#1A1A1A] rounded-2xl shadow-2xl border border-white/10 overflow-hidden z-50 p-2"
                >
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value as any);
                        setIsSortOpen(false);
                      }}
                      className={`w-full text-center px-4 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all ${
                        sortBy === option.value 
                          ? 'bg-brand-gold text-[#0A0A0B]' 
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <ListingSkeleton />
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
            <AnimatePresence>
              {filteredProducts.map((product) => (
                <ProductCard 
                   key={product.id} 
                   product={product} 
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-32">
            <h3 className="text-2xl font-bold mb-2 text-white">{t('shop.noProducts')}</h3>
            <p className="text-white/50">{t('shop.subtitle')}</p>
          </div>
        )}
        
        <LoyaltyBanner />
      </div>
    </div>
  );
};

export default ShopPage;
