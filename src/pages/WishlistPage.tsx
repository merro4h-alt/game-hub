import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { useStore } from '../StoreContext';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';

const WishlistPage: React.FC = () => {
  const { wishlist, products, isLoading } = useStore();
  const { t } = useTranslation();

  const wishlistProducts = wishlist.map(item => {
    const product = products.find(p => p.id === item.productId);
    return product ? { ...product, addedPrice: item.addedPrice } : null;
  }).filter(Boolean);

  if (isLoading) {
    return (
      <div className="pt-40 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-[#0A0A0B] min-h-screen text-white">
      <div className="mb-12 text-center">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="inline-flex items-center gap-3 bg-red-500/10 px-6 py-2 rounded-full border border-red-500/20 mb-6"
        >
          <Heart size={16} className="text-red-500" fill="currentColor" />
          <span className="text-xs font-black uppercase tracking-[0.3em] text-red-500">{t('shop.wishlist')}</span>
        </motion.div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 text-white">
          Saved <span className="italic text-red-500">Treasures</span>
        </h1>
        <p className="text-white/40 max-w-2xl mx-auto uppercase tracking-[0.2em] text-[10px] font-black">
          Products you love, waiting for you to make them yours.
        </p>
      </div>

      {wishlistProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <AnimatePresence mode="popLayout">
            {wishlistProducts.map((product: any) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
              >
                <div className="relative">
                   {/* Price Alert Indicator */}
                   {(product.discountPrice ?? product.price) < product.addedPrice && (
                      <div className="absolute -top-3 -right-3 z-30 bg-green-500 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl shadow-green-500/20 flex items-center gap-1.5 border border-white/20 animate-bounce">
                        <ShoppingBag size={10} />
                        Price Dropped!
                      </div>
                   )}
                   <ProductCard product={product} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-32 text-center"
        >
          <div className="w-24 h-24 bg-white/5 rounded-[2rem] flex items-center justify-center text-white/10 mb-8">
            <Heart size={48} />
          </div>
          <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter">{t('shop.noWishlist')}</h2>
          <Link 
            to="/shop" 
            className="flex items-center gap-3 bg-white text-brand-charcoal px-8 py-4 rounded-full font-black uppercase tracking-widest text-xs hover:bg-[#4F46E5] hover:text-white transition-all shadow-xl active:scale-95"
          >
            {t('home.exploreAll')}
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      )}
    </div>
  );
};

export default WishlistPage;
