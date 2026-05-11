import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, 
  ShoppingCart, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Ruler, 
  Heart,
  Share2,
  Check,
  Plus,
  Minus,
  Maximize2
} from 'lucide-react';
import { useStore } from '../StoreContext';
import { useTranslation } from 'react-i18next';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';

const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const { products, addToCart, recentlyViewed, addToRecentlyViewed } = useStore();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  
  const product = useMemo(() => products.find(p => p.id === productId), [products, productId]);
  
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (product) {
      setSelectedColor(product.colors[0]);
      setSelectedSize(product.sizes[0]);
      // Track recently viewed
      addToRecentlyViewed(product);
    }
  }, [product, productId]); // Added productId to ensure it re-runs when URL changes

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">{t('shop.noProducts')}</h2>
          <button onClick={() => navigate('/shop')} className="text-brand-gold font-bold underline">
            {t('home.exploreAll')}
          </button>
        </div>
      </div>
    );
  }

  const allImages = [product.image, ...(product.images || [])];
  
  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product, selectedColor, selectedSize);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-[#0A0A0B] text-white min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
        
        {/* Advanced Gallery Section */}
        <div className="space-y-6">
          <div className="relative group rounded-[2.5rem] overflow-hidden bg-white/5 border border-white/5 aspect-square">
            <motion.div 
              className="w-full h-full cursor-zoom-in relative"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={activeImageIndex}
                  src={allImages[activeImageIndex] || 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&q=60&w=600'}
                  alt={product.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&q=60&w=600';
                  }}
                  className={`w-full h-full object-cover ${isZoomed ? 'opacity-0' : 'opacity-100'}`}
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>

              {/* Enhanced Zoom Feature */}
              {isZoomed && (
                <div 
                  className="absolute inset-0 z-10 pointer-events-none"
                  style={{
                    backgroundImage: `url(${allImages[activeImageIndex]})`,
                    backgroundPosition: `${mousePos.x}% ${mousePos.y}%`,
                    backgroundSize: '200%',
                    backgroundRepeat: 'no-repeat'
                  }}
                />
              )}
            </motion.div>

            {/* Gallery Navigation Arrows */}
            {allImages.length > 1 && (
              <>
                <button 
                  onClick={() => setActiveImageIndex(prev => prev === 0 ? allImages.length - 1 : prev - 1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/80 backdrop-blur-md shadow-lg hover:bg-white transition-all z-20 opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={() => setActiveImageIndex(prev => prev === allImages.length - 1 ? 0 : prev + 1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/80 backdrop-blur-md shadow-lg hover:bg-white transition-all z-20 opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
            
            <button className="absolute top-6 right-6 p-4 rounded-2xl bg-white/80 backdrop-blur-md shadow-sm hover:text-red-500 transition-colors z-20 group/heart">
              <Heart size={20} className="group-hover/heart:fill-current" />
            </button>
          </div>

          {/* Thumbnails */}
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {allImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                className={`relative w-20 h-24 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                  activeImageIndex === idx ? 'border-brand-gold scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img 
                  src={img || 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&q=60&w=600'} 
                  alt={`Thumbnail ${idx}`} 
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&q=60&w=600';
                  }}
                  referrerPolicy="no-referrer" 
                />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info Section */}
        <div className="flex flex-col">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex text-brand-gold">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill={i < Math.floor(product.rating) ? "currentColor" : "none"} />
                ))}
              </div>
              <span className="text-sm font-bold text-brand-charcoal/60 dark:text-white/60">({product.rating} / 5)</span>
              <span className="mx-2 text-brand-charcoal/20 dark:text-white/20">|</span>
              <span className="text-xs font-black uppercase tracking-widest text-[#4F46E5] dark:text-indigo-400">{product.category}</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 leading-tight text-brand-charcoal dark:text-white">{product.name}</h1>
            
            <div className="flex items-center gap-4 mb-6">
              {product.discountPrice ? (
                <>
                  <span className="text-3xl font-mono font-black text-[#4F46E5] dark:text-indigo-400">${product.discountPrice.toFixed(2)}</span>
                  <span className="text-xl font-mono text-brand-charcoal/30 dark:text-white/30 line-through">${product.price.toFixed(2)}</span>
                  <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-red-200 dark:border-red-800">
                    {Math.round((1 - product.discountPrice / product.price) * 100)}% {t('shop.sale')}
                  </span>
                </>
              ) : (
                <span className="text-3xl font-mono font-black text-brand-charcoal dark:text-white">${product.price.toFixed(2)}</span>
              )}
            </div>

            <p className="text-brand-charcoal/70 dark:text-white/70 leading-relaxed text-lg mb-8">
              {product.description}
            </p>
          </div>

          {/* Color Selection - Improved */}
          {product.colors.length > 0 && product.colors[0] !== 'Default' && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-black uppercase tracking-[0.2em] text-brand-charcoal/40 dark:text-white/40">{t('shop.color')}</span>
                <span className="text-xs font-bold text-brand-charcoal dark:text-white">{selectedColor}</span>
              </div>
              <div className="flex flex-wrap gap-4">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`group relative p-1 rounded-2xl transition-all ${
                      selectedColor === color ? 'bg-brand-gold/10 dark:bg-brand-gold/20' : 'hover:bg-brand-charcoal/5 dark:hover:bg-white/5'
                    }`}
                  >
                    <div 
                      className={`w-10 h-10 rounded-xl border border-brand-charcoal/10 dark:border-white/10 transition-transform ${
                        selectedColor === color ? 'scale-90' : 'group-hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                    {selectedColor === color && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <Check size={16} className="text-white mix-blend-difference" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selection - Improved */}
          {product.sizes.length > 0 && (
            <div className="mb-10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-black uppercase tracking-[0.2em] text-brand-charcoal/40 dark:text-white/40">{t('shop.size')}</span>
                <button 
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-black text-[#4F46E5] dark:text-indigo-400 hover:underline"
                >
                  <Ruler size={14} />
                  {t('shop.sizeGuide')}
                </button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-3 rounded-xl text-xs font-bold transition-all border ${
                      selectedSize === size 
                        ? 'bg-brand-charcoal dark:bg-brand-gold text-white dark:text-[#0A0A0B] border-brand-charcoal dark:border-brand-gold' 
                        : 'bg-white dark:bg-white/5 text-brand-charcoal dark:text-white border-brand-charcoal/10 dark:border-white/10 hover:border-brand-charcoal dark:hover:border-white/30'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity and CTA */}
          <div className="flex flex-col gap-6 mb-12">
            <div className="flex items-center justify-between bg-brand-cream/20 dark:bg-white/5 rounded-[2rem] p-2 border border-brand-charcoal/5 dark:border-white/10 w-full">
              <button 
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="p-4 hover:bg-white dark:hover:bg-white/10 rounded-full transition-all text-brand-charcoal/40 dark:text-white/40 hover:text-brand-charcoal dark:hover:text-white active:scale-95"
              >
                <Minus size={20} />
              </button>
              <span className="text-xl font-black text-brand-charcoal dark:text-white">{quantity}</span>
              <button 
                onClick={() => setQuantity(q => q + 1)}
                className="p-4 hover:bg-white dark:hover:bg-white/10 rounded-full transition-all text-brand-charcoal/40 dark:text-white/40 hover:text-brand-charcoal dark:hover:text-white active:scale-95"
              >
                <Plus size={20} />
              </button>
            </div>
            
            <button 
              onClick={handleAddToCart}
              className="w-full bg-[#4F46E5] text-white py-6 rounded-full font-black uppercase tracking-[0.2em] text-sm hover:bg-[#4338CA] transition-all hover:shadow-2xl hover:shadow-indigo-500/30 flex items-center justify-center gap-4 active:scale-[0.98]"
            >
              <ShoppingCart size={22} />
              {t('shop.addToCart')}
            </button>
          </div>

          {/* Social Proof & Urgency */}
          <div className="mb-10 p-6 rounded-3xl bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-white/10 flex items-center justify-center text-[#4F46E5] dark:text-indigo-400 shadow-sm flex-shrink-0">
              <Star size={18} fill="currentColor" />
            </div>
            <div>
              <p className="text-sm font-bold text-brand-charcoal dark:text-white mb-1">
                {Math.floor(Math.random() * 10) + 5} people are looking at this item right now
              </p>
              <p className="text-xs text-[#4F46E5] dark:text-indigo-400 font-black uppercase tracking-widest">
                🔥 Low Stock: Only 3 pieces left in {selectedSize}
              </p>
            </div>
          </div>

          {/* Trust Badges Section - Improved */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-10 border-t border-brand-charcoal/5 dark:border-white/10 mt-auto">
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-white/5 flex items-center justify-center text-[#4F46E5] dark:text-indigo-400 group-hover:bg-[#4F46E5] group-hover:text-white transition-all duration-500 border border-transparent dark:border-white/5">
                <Truck size={22} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-charcoal dark:text-white">Free Shipping</span>
                <span className="text-[10px] text-brand-charcoal/40 dark:text-white/40 uppercase tracking-tighter">On orders over $150</span>
              </div>
            </div>
            
            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-white/5 flex items-center justify-center text-green-600 dark:text-green-400 group-hover:bg-green-600 group-hover:text-white transition-all duration-500 border border-transparent dark:border-white/5">
                <ShieldCheck size={22} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-charcoal dark:text-white">Secure Checkout</span>
                <span className="text-[10px] text-brand-charcoal/40 dark:text-white/40 uppercase tracking-tighter">100% Protected</span>
              </div>
            </div>

            <div className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-white/5 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition-all duration-500 border border-transparent dark:border-white/5">
                <RotateCcw size={22} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-brand-charcoal dark:text-white">{i18n.language === 'ar' ? 'ضمان الاسترجاع' : 'Easy Returns'}</span>
                <span className="text-[10px] text-brand-charcoal/40 dark:text-white/40 uppercase tracking-tighter">{i18n.language === 'ar' ? 'استرجاع مجاني في حال اختلاف المواصفات' : 'Money back if specs don\'t match'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Size Guide Modal */}
      <AnimatePresence>
        {isSizeGuideOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSizeGuideOpen(false)}
              className="absolute inset-0 bg-brand-charcoal/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 md:p-12">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-3xl font-black tracking-tighter">{t('shop.sizeGuide')}</h3>
                  <button 
                    onClick={() => setIsSizeGuideOpen(false)}
                    className="p-3 bg-brand-charcoal/5 rounded-2xl hover:bg-brand-charcoal hover:text-white transition-all"
                  >
                    < ChevronRight className="rotate-90" size={20} />
                  </button>
                </div>
                
                <div className="space-y-6 text-sm">
                  <p className="text-brand-charcoal/60 leading-relaxed">
                    استخدم هذا الدليل للعثور على مقاسك المثالي. جميع القياسات مدرجة بالسنتيمتر.
                  </p>
                  
                  <div className="overflow-x-auto rounded-3xl border border-brand-charcoal/5">
                    <table className="w-full text-left rtl:text-right border-collapse">
                      <thead>
                        <tr className="bg-brand-charcoal/5">
                          <th className="p-4 font-black uppercase tracking-widest text-[10px]">المقاس</th>
                          <th className="p-4 font-black uppercase tracking-widest text-[10px]">الصدر</th>
                          <th className="p-4 font-black uppercase tracking-widest text-[10px]">الخصر</th>
                          <th className="p-4 font-black uppercase tracking-widest text-[10px]">الأكتاف</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-brand-charcoal/5">
                        {[
                          { s: 'S', b: '92-96', w: '78-82', sh: '44' },
                          { s: 'M', b: '96-100', w: '82-86', sh: '46' },
                          { s: 'L', b: '100-104', w: '86-90', sh: '48' },
                          { s: 'XL', b: '104-108', w: '90-94', sh: '50' }
                        ].map((row) => (
                          <tr key={row.s} className="hover:bg-indigo-50/30 transition-colors">
                            <td className="p-4 font-bold">{row.s}</td>
                            <td className="p-4 text-brand-charcoal/60 font-mono">{row.b} cm</td>
                            <td className="p-4 text-brand-charcoal/60 font-mono">{row.w} cm</td>
                            <td className="p-4 text-brand-charcoal/60 font-mono">{row.sh} cm</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-brand-charcoal/5">
                  <button 
                    onClick={() => setIsSizeGuideOpen(false)}
                    className="w-full py-4 bg-brand-charcoal text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#4F46E5] transition-all"
                  >
                    Got it, thanks
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Related Products Section */}
      {products.filter(p => p.id !== product.id && p.category === product.category).length > 0 && (
        <section className="mt-32 pt-20 border-t border-white/10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <span className="text-[#4F46E5] dark:text-indigo-400 text-xs font-black uppercase tracking-[0.4em] mb-4 block">{t('shop.mightLike')}</span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white">{t('shop.relatedProducts')}</h2>
            </div>
            <button 
              onClick={() => navigate('/shop')}
              className="group flex items-center gap-3 text-sm font-black uppercase tracking-widest text-brand-charcoal/60 dark:text-white/60 hover:text-[#4F46E5] dark:hover:text-indigo-400 transition-colors"
            >
              {t('home.exploreAll')}
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products
              .filter(p => p.id !== product.id && p.category === product.category)
              .slice(0, 4)
              .map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
          </div>
        </section>
      )}
      {/* Recently Viewed Section */}
      {recentlyViewed.filter(p => p.id !== product.id).length > 0 && (
        <section className="mt-20 pt-20 border-t border-white/10">
          <div className="mb-12">
            <span className="text-white/40 text-xs font-black uppercase tracking-[0.4em] mb-4 block">Based on your activity</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase">Recently Viewed</h2>
          </div>
          
          <div className="flex overflow-x-auto pb-8 gap-6 no-scrollbar snap-x">
             {recentlyViewed
               .filter(p => p.id !== product.id)
               .map((viewedProduct) => (
                 <div key={viewedProduct.id} className="min-w-[200px] sm:min-w-[250px] snap-start">
                   <ProductCard product={viewedProduct} />
                 </div>
               ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetailPage;
