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
  Maximize2,
  Play,
  X,
  Sparkles,
  Gift,
  CheckCircle2,
} from 'lucide-react';
import { useStore } from '../StoreContext';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import { useAlert } from '../contexts/AlertContext';

const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const { 
    products, addToCart, recentlyViewed, addToRecentlyViewed, formatPrice, toggleWishlist, isInWishlist
  } = useStore();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  
  const product = useMemo(() => products.find(p => p.id === productId), [products, productId]);
  
  const [selectedColor, setSelectedColor] = useState<string>('');
  
  const isShoe = useMemo(() => {
    if (!product) return false;
    const searchTerms = /حذاء|حذأ|أحذية|احذية|جزمة|كوتش|حذائيه|حذائية|سبورت|رياضي|shoe|sneaker|nike|adidas|puma|reebok|boot|sandals|running/i;
    return (
      product.category === 'Sports' || 
      searchTerms.test(product.name || '') || 
      searchTerms.test(product.description || '')
    );
  }, [product]);

  const effectiveSizes = useMemo(() => {
    if (!product) return [];
    if (isShoe) {
      return ['39', '40', '41', '42', '43', '44', '45'];
    }
    return product.sizes || [];
  }, [product, isShoe]);

  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isShowingVideo, setIsShowingVideo] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Cross-selling & Bundle Upselling State
  const recommendedProducts = useMemo(() => {
    if (!product) return [];
    return products.filter(p => p.id !== product.id).slice(0, 2);
  }, [products, product]);

  const [checkedPromo, setCheckedPromo] = useState<Record<string, boolean>>({});
  const [selectedPromoColors, setSelectedPromoColors] = useState<Record<string, string>>({});
  const [selectedPromoSizes, setSelectedPromoSizes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product && recommendedProducts.length > 0) {
      const initialChecked: Record<string, boolean> = {};
      const initialColors: Record<string, string> = {};
      const initialSizes: Record<string, string> = {};

      recommendedProducts.forEach(p => {
        initialChecked[p.id] = true; // Auto-checked to drive higher average order value (AOV)
        if (p.colors && p.colors.length > 0) {
          initialColors[p.id] = p.colors[0];
        }
        const pIsShoe = p.category === 'Sports' || /حذاء|حذأ|أحذية|احذية|جزمة|كوتش|حذائيه|حذائية|سبورت|رياضي|shoe|sneaker|nike|adidas|puma|reebok|boot|sandals|running/i.test(p.name || '') || /حذاء|حذأ|أحذية|احذية|جزمة|كوتش|حذائيه|حذائية|سبورت|رياضي|shoe|sneaker|nike|adidas|puma|reebok|boot|sandals|running/i.test(p.description || '');
        const pSizes = pIsShoe ? ['39', '40', '41', '42', '43', '44', '45'] : (p.sizes || []);
        if (pSizes && pSizes.length > 0) {
          initialSizes[p.id] = pSizes[0];
        }
      });

      setCheckedPromo(initialChecked);
      setSelectedPromoColors(initialColors);
      setSelectedPromoSizes(initialSizes);
    }
  }, [product, recommendedProducts]);



  useEffect(() => {
    if (product) {
      setSelectedColor(product.colors[0]);
      setSelectedSize(effectiveSizes[0] || product.sizes[0] || 'Standard');
      // Track recently viewed
      addToRecentlyViewed(product);
    }
  }, [product, productId, effectiveSizes]); // Added productId to ensure it re-runs when URL changes

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
    addToCart(product, selectedColor, selectedSize, quantity);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-[#0A0A0B] text-white min-h-screen">
      <Helmet>
        <title>{product.name} | ONXIFI</title>
        <meta name="description" content={product.description} />
        <meta property="og:title" content={`${product.name} | ONXIFI`} />
        <meta property="og:description" content={product.description} />
        <meta property="og:image" content={product.image} />
        <meta property="twitter:title" content={`${product.name} | ONXIFI`} />
        <meta property="twitter:description" content={product.description} />
        <meta property="twitter:image" content={product.image} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": product.name,
            "image": [product.image, ...(product.images || [])],
            "description": product.description,
            "brand": {
              "@type": "Brand",
              "name": "ONXIFI"
            },
            "offers": {
              "@type": "Offer",
              "url": window.location.href,
              "priceCurrency": "USD",
              "price": product.discountPrice || product.price,
              "availability": "https://schema.org/InStock",
              "itemCondition": "https://schema.org/NewCondition"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": product.rating,
              "reviewCount": product.reviews?.length || 10
            }
          })}
        </script>
      </Helmet>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
        
        {/* Advanced Gallery Section */}
        <div className="space-y-6">
          <div className="relative group rounded-[2.5rem] overflow-hidden bg-white/5 border border-white/5 aspect-square">
            {isShowingVideo && product.videoUrl ? (
              <div className="w-full h-full relative bg-black">
                <video 
                  src={product.videoUrl} 
                  controls 
                  autoPlay 
                  className="w-full h-full object-contain"
                />
                <button 
                  onClick={() => setIsShowingVideo(false)}
                  className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black transition-colors z-30"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
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
            )}

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
            
            <button 
              onClick={() => toggleWishlist(product.id)}
              className={`absolute top-6 right-6 p-4 rounded-2xl backdrop-blur-md shadow-sm transition-all z-20 group/heart ${
                isInWishlist(product.id) ? 'bg-red-500 text-white' : 'bg-white/80 text-brand-charcoal hover:text-red-500'
              }`}
            >
              <Heart size={20} className={isInWishlist(product.id) ? "fill-current" : "group-hover/heart:fill-current"} />
            </button>
          </div>

          {/* Thumbnails */}
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {product.videoUrl && (
              <button
                onClick={() => setIsShowingVideo(true)}
                className={`relative w-20 h-24 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 bg-brand-gold/10 flex items-center justify-center group ${
                  isShowingVideo ? 'border-brand-gold scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                <Play size={24} className="text-brand-gold relative z-10" fill="currentColor" />
                <img 
                  src={product.image} 
                  alt="Video Thumbnail" 
                  className="w-full h-full object-cover opacity-50"
                  referrerPolicy="no-referrer"
                />
              </button>
            )}
            {allImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setActiveImageIndex(idx);
                  setIsShowingVideo(false);
                }}
                className={`relative w-20 h-24 rounded-2xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                  activeImageIndex === idx && !isShowingVideo ? 'border-brand-gold scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
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
              <span className="text-sm font-bold text-white/60">({product.rating} / 5)</span>
              <span className="mx-2 text-white/20">|</span>
              <span className="text-xs font-black uppercase tracking-widest text-brand-gold">{product.category}</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 leading-tight text-white uppercase">{product.name}</h1>
            
            <div className="flex items-center gap-4 mb-6">
              {(() => {
                const activeDiscountPrice = product.colorDiscountPrices?.[selectedColor] ?? product.discountPrice;
                const activePrice = product.colorPrices?.[selectedColor] ?? product.price;

                if (activeDiscountPrice) {
                  return (
                    <>
                      <span className="text-3xl font-mono font-black text-brand-gold">{formatPrice(activeDiscountPrice)}</span>
                      <span className="text-xl font-mono text-white/30 line-through">{formatPrice(activePrice)}</span>
                      <span className="bg-red-900/30 text-red-400 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border border-red-800">
                        {Math.round((1 - activeDiscountPrice / activePrice) * 100)}% {t('shop.sale')}
                      </span>
                    </>
                  );
                }
                return (
                  <span className="text-3xl font-mono font-black text-white">{formatPrice(activePrice)}</span>
                );
              })()}
            </div>

            {/* Stock Availability Indicator */}
            <div className="flex items-center gap-3 mb-6 bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3 w-fit">
              <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  (product.stock || 0) <= 0 ? 'bg-red-500' : (product.stock || 0) <= 5 ? 'bg-orange-500' : 'bg-green-500'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${
                  (product.stock || 0) <= 0 ? 'bg-red-500' : (product.stock || 0) <= 5 ? 'bg-orange-500' : 'bg-green-500'
                }`}></span>
              </span>
              <span className="text-sm font-bold text-white/95">
                {(product.stock || 0) <= 0 ? (
                  <span className="text-red-500 font-extrabold text-sm uppercase">
                    {i18n.language === 'ar' ? 'نفدت الكمية من المخزن' : 'Out of Stock'}
                  </span>
                ) : (product.stock || 0) <= 5 ? (
                  <span className="text-orange-400 font-extrabold animate-pulse text-sm">
                    {i18n.language === 'ar' 
                      ? `بقي ${product.stock} قطع فقط في المخزن!` 
                      : `Only ${product.stock} items left in stock!`}
                  </span>
                ) : (
                  <span className="text-green-400 font-bold text-sm">
                    {i18n.language === 'ar' 
                      ? `الكمية المتوفرة في المخزن: ${product.stock} قطعة` 
                      : `Available stock: ${product.stock} items`}
                  </span>
                )}
              </span>
            </div>

            <p className="text-white/80 leading-relaxed text-lg mb-8">
              {product.description}
            </p>
          </div>

          {/* Color Selection - Improved */}
          {product.colors.length > 0 && product.colors[0] !== 'Default' && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-black uppercase tracking-[0.2em] text-white/40">{t('shop.color')}</span>
                <span className="text-xs font-bold text-white">{t(`colors.${selectedColor}`, selectedColor)}</span>
              </div>
              <div className="flex flex-wrap gap-4">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`group relative p-1 rounded-2xl transition-all ${
                      selectedColor === color ? 'bg-brand-gold/20' : 'hover:bg-white/5'
                    }`}
                    title={t(`colors.${color}`, color)}
                  >
                    <div 
                      className={`w-10 h-10 rounded-xl border border-white/10 transition-transform ${
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
          {effectiveSizes.length > 0 && (
            <div className="mb-10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-black uppercase tracking-[0.2em] text-white/40">{t('shop.size')}</span>
                <button 
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="flex items-center gap-1.5 text-xs font-black text-brand-gold hover:underline"
                >
                  <Ruler size={14} />
                  {t('shop.sizeGuide')}
                </button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {effectiveSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`py-3 rounded-xl text-xs font-bold transition-all border ${
                      selectedSize === size 
                        ? 'bg-brand-gold text-[#0A0A0B] border-brand-gold' 
                        : 'bg-white/5 text-white border-white/10 hover:border-white/30'
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
            <div className={`flex items-center justify-between bg-white/5 rounded-[2rem] p-2 border border-white/10 w-full ${product.stock === 0 ? 'opacity-50 pointer-events-none' : ''}`}>
              <button 
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="p-4 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white active:scale-95"
              >
                <Minus size={20} />
              </button>
              <span className="text-xl font-black text-white">{quantity}</span>
              <button 
                onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                className="p-4 hover:bg-white/10 rounded-full transition-all text-white/40 hover:text-white active:scale-95"
              >
                <Plus size={20} />
              </button>
            </div>
            
            <button 
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className={`w-full py-6 rounded-full font-black uppercase tracking-[0.2em] text-sm transition-all flex items-center justify-center gap-4 active:scale-[0.98] ${
                product.stock === 0 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-brand-gold text-white hover:bg-brand-charcoal hover:shadow-2xl hover:shadow-brand-gold/30'
              }`}
            >
              <ShoppingCart size={22} />
              {product.stock === 0 ? (i18n.language === 'ar' ? 'نفد المخزون' : 'Out of Stock') : t('shop.addToCart')}
            </button>
          </div>




          {/* Social Proof & Urgency */}
          <div className="mb-10 p-6 rounded-3xl bg-brand-gold/5 border border-brand-gold/10 flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-brand-gold shadow-sm flex-shrink-0">
              <Star size={18} fill="currentColor" />
            </div>
            <div>
              <p className="text-sm font-bold text-white mb-1">
                {Math.floor(Math.random() * 10) + 5} people are looking at this item right now
              </p>
              <p className={`text-xs font-black uppercase tracking-widest ${product.stock <= 5 ? 'text-red-500' : 'text-brand-gold'}`}>
                {product.stock === 0 ? (
                  i18n.language === 'ar' ? '❌ نفد المخزون: سنقوم بإعلامك عند توفره' : '❌ Out of Stock: We will notify you when available'
                ) : product.stock <= 10 ? (
                  i18n.language === 'ar' ? `🔥 مخزون منخفض: متبقي ${product.stock} قطع فقط!` : `🔥 Low Stock: Only ${product.stock} items left!`
                ) : (
                  i18n.language === 'ar' ? `✅ متوفر: ${product.stock} قطعة في المخزون` : `✅ In Stock: ${product.stock} items available`
                )}
              </p>
            </div>
          </div>

          {/* Trust Badges Section - Improved */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-10 border-t border-white/10 mt-auto">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5 group hover:border-[#C5A05B]/30 hover:bg-white/[0.04] transition-all duration-300 text-start">
              <div className="w-10 h-10 rounded-xl bg-[#C5A05B]/10 flex items-center justify-center text-[#C5A05B] group-hover:scale-110 transition-transform">
                <Truck size={18} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-black uppercase tracking-wider text-white">
                  {i18n.language === 'ar' ? 'الدفع عند الاستلام' : 'Cash on Delivery'}
                </span>
                <span className="text-[9px] text-white/40 font-semibold truncate">
                  {i18n.language === 'ar' ? 'عاين منتجك قبل الدفع' : 'Inspect item first'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5 group hover:border-amber-400/30 hover:bg-white/[0.04] transition-all duration-300 text-start">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <RotateCcw size={18} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-black uppercase tracking-wider text-white">
                  {i18n.language === 'ar' ? 'الضمان الذهبي 14 يوم' : 'Golden Refund'}
                </span>
                <span className="text-[9px] text-white/40 font-semibold truncate">
                  {i18n.language === 'ar' ? 'استرجع أموالك فوراً' : 'Instantly get money back'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5 group hover:border-green-400/30 hover:bg-white/[0.04] transition-all duration-300 text-start">
              <div className="w-10 h-10 rounded-xl bg-green-400/10 flex items-center justify-center text-green-400 group-hover:scale-110 transition-transform">
                <ShieldCheck size={18} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-black uppercase tracking-wider text-white">
                  {i18n.language === 'ar' ? 'دفع آمن بالكامل SSL' : 'SSL Secure Checkout'}
                </span>
                <span className="text-[9px] text-white/40 font-semibold truncate">
                  {i18n.language === 'ar' ? 'تشفير وحماية بياناتك' : '100% Encrypted transactions'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Frequently Bought Together (Upselling & Cross-selling) */}
      {recommendedProducts.length > 0 && (
        <section className="mt-20 p-8 md:p-12 rounded-[2.5rem] bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-gold/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 flex items-center justify-center text-brand-gold">
              <Sparkles size={24} className="animate-pulse" />
            </div>
            <div>
              <span className="text-brand-gold text-xs font-black uppercase tracking-[0.4em] block">
                {i18n.language === 'ar' ? 'عروض الحزمة المميزة ووفر أكثر!' : 'Premium Bundle Deals & Save More!'}
              </span>
              <h2 className="text-3xl font-black tracking-tighter text-white mt-1">
                {i18n.language === 'ar' ? 'منتجات ينصح بها مع هذا المنتج' : 'Frequently Recommended With This Item'}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-stretch">
            {/* Main Current Product (Immutable base) and Plus Signs */}
            <div className="xl:col-span-3 pb-4">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-4 md:gap-6 items-center">
                {/* Product 0: Current Item */}
                <div className="p-6 rounded-3xl bg-white/5 border border-white/10 flex flex-col relative h-full justify-between">
                  <div>
                    <span className="absolute top-4 left-4 bg-brand-gold/20 text-brand-gold text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">
                      {i18n.language === 'ar' ? 'المنتج الحالي' : 'Current Item'}
                    </span>
                    <div className="w-24 h-24 rounded-2xl overflow-hidden mb-4 bg-white/5 mx-auto">
                      <img 
                        src={product.colorImages?.[selectedColor] || product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <h3 className="font-bold text-white text-sm line-clamp-2 mb-1 uppercase text-center md:text-left rtl:md:text-right">{product.name}</h3>
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                      <span className="text-brand-gold font-mono font-bold text-sm">
                        {formatPrice(product.colorDiscountPrices?.[selectedColor] ?? product.discountPrice ?? product.colorPrices?.[selectedColor] ?? product.price)}
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] text-white/40 space-y-1 bg-white/5 p-3 rounded-xl mt-4">
                    <p className="flex justify-between">
                      <span>{i18n.language === 'ar' ? 'اللون:' : 'Color:'}</span>
                      <span className="text-white font-semibold">{selectedColor || '-'}</span>
                    </p>
                    <p className="flex justify-between">
                      <span>{i18n.language === 'ar' ? 'المقاس:' : 'Size:'}</span>
                      <span className="text-white font-semibold">{selectedSize || '-'}</span>
                    </p>
                  </div>
                </div>

                {/* Plus symbol */}
                {recommendedProducts.map((p, idx) => {
                  const isChecked = !!checkedPromo[p.id];
                  const chosenColor = selectedPromoColors[p.id] || p.colors[0] || '';
                  const pIsShoe = p.category === 'Sports' || /حذاء|حذأ|أحذية|احذية|جزمة|كوتش|حذائيه|حذائية|سبورت|رياضي|shoe|sneaker|nike|adidas|puma|reebok|boot|sandals|running/i.test(p.name || '') || /حذاء|حذأ|أحذية|احذية|جزمة|كوتش|حذائيه|حذائية|سبورت|رياضي|shoe|sneaker|nike|adidas|puma|reebok|boot|sandals|running/i.test(p.description || '');
                  const pEffectiveSizes = pIsShoe ? ['39', '40', '41', '42', '43', '44', '45'] : (p.sizes || []);
                  const chosenSize = selectedPromoSizes[p.id] || pEffectiveSizes[0] || '';
                  const basePrice = p.colorDiscountPrices?.[chosenColor] ?? p.discountPrice ?? p.colorPrices?.[chosenColor] ?? p.price;
                  const discountedPromoPrice = basePrice * 0.8; // 20% discount on cross-sell items!

                  return (
                    <React.Fragment key={p.id}>
                      {/* Plus icon */}
                      <div className="flex justify-center text-white/30 font-black text-2xl py-2">
                        +
                      </div>

                      {/* Recommended Item Card */}
                      <div className={`p-6 rounded-3xl border transition-all flex flex-col relative h-full justify-between ${
                        isChecked ? 'bg-white/5 border-white/10 shadow-lg' : 'bg-[#0A0A0B]/20 border-white/5 opacity-50'
                      }`}>
                        <div>
                          {/* Checkbox button */}
                          <button
                            onClick={() => {
                              setCheckedPromo(prev => ({ ...prev, [p.id]: !prev[p.id] }));
                            }}
                            className="absolute top-4 right-4 flex items-center justify-center w-6 h-6 rounded-xl border transition-all bg-[#0A0A0B]"
                            style={{ borderColor: isChecked ? '#D4AF37' : 'rgba(255,255,255,0.1)' }}
                          >
                            {isChecked && <Check size={14} className="text-brand-gold" />}
                          </button>

                          <div className="w-24 h-24 rounded-2xl overflow-hidden mb-4 bg-white/5 mx-auto">
                            <img 
                              src={p.colorImages?.[chosenColor] || p.image} 
                              alt={p.name} 
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>

                          <h3 className="font-bold text-white text-sm line-clamp-2 mb-1 uppercase text-center md:text-left rtl:md:text-right">{p.name}</h3>
                          
                          <div className="flex items-center justify-center md:justify-start gap-1.5 flex-wrap mb-3">
                            <span className="text-brand-gold font-mono font-black text-sm">{formatPrice(discountedPromoPrice)}</span>
                            <span className="text-white/30 line-through font-mono text-xs">{formatPrice(basePrice)}</span>
                            <span className="text-green-500 text-[9px] font-black uppercase bg-green-500/10 px-1.5 py-0.5 rounded">
                              -20%
                            </span>
                          </div>
                        </div>

                        {/* Options */}
                        {isChecked && (
                          <div className="space-y-2 pt-2 border-t border-white/5 mt-4">
                            {/* Color selection */}
                            {p.colors.length > 1 && (
                              <div>
                                <span className="text-[9px] font-black uppercase tracking-wider text-white/30 block mb-1">
                                  {i18n.language === 'ar' ? 'اللون' : 'Color'}
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {p.colors.map(col => (
                                    <button
                                      key={col}
                                      onClick={() => setSelectedPromoColors(prev => ({ ...prev, [p.id]: col }))}
                                      className={`text-[9px] px-2 py-0.5 rounded-lg border font-sans uppercase font-bold transition-all ${
                                        chosenColor === col 
                                          ? 'bg-brand-gold text-[#0A0A0B] border-brand-gold' 
                                          : 'bg-white/5 text-white/70 border-white/5 hover:border-white/20'
                                      }`}
                                    >
                                      {col}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Size selection */}
                            {pEffectiveSizes.length > 0 && (
                              <div>
                                <span className="text-[9px] font-black uppercase tracking-wider text-white/30 block mb-1">
                                  {i18n.language === 'ar' ? 'المقاس' : 'Size'}
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {pEffectiveSizes.map(sz => (
                                    <button
                                      key={sz}
                                      onClick={() => setSelectedPromoSizes(prev => ({ ...prev, [p.id]: sz }))}
                                      className={`text-[9px] px-2 py-0.5 rounded-lg border font-mono font-bold transition-all ${
                                        chosenSize === sz 
                                          ? 'bg-brand-gold text-[#0A0A0B] border-brand-gold' 
                                          : 'bg-white/5 text-white/70 border-white/5 hover:border-white/20'
                                      }`}
                                    >
                                      {sz}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Bundle Checkout Box */}
            <div className="p-6 md:p-8 rounded-[2rem] bg-brand-gold/5 border border-brand-gold/15 flex flex-col justify-between relative overflow-hidden h-full">
              <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-brand-gold/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="space-y-4">
                <span className="text-brand-gold text-[10px] uppercase font-black tracking-widest block mb-1">
                  {i18n.language === 'ar' ? 'إجمالي الحزمة المعروضة' : 'Bargain Bundle Summary'}
                </span>
                
                {(() => {
                  const activeDiscountPrice = product.colorDiscountPrices?.[selectedColor] ?? product.discountPrice;
                  const activePrice = product.colorPrices?.[selectedColor] ?? product.price;
                  const initialPrice = activeDiscountPrice ?? activePrice;
                  
                  let totalBundleOriginal = initialPrice * quantity;
                  let totalBundleDiscounted = initialPrice * quantity;
                  let savingsAmount = 0;
                  let itemsCount = 1;

                  recommendedProducts.forEach(p => {
                    if (checkedPromo[p.id]) {
                      const pColor = selectedPromoColors[p.id] || p.colors[0] || '';
                      const basePrice = p.colorDiscountPrices?.[pColor] ?? p.discountPrice ?? p.colorPrices?.[pColor] ?? p.price;
                      const discountedPromoPrice = basePrice * 0.8;

                      totalBundleOriginal += basePrice;
                      totalBundleDiscounted += discountedPromoPrice;
                      savingsAmount += (basePrice - discountedPromoPrice);
                      itemsCount += 1;
                    }
                  });

                  return (
                    <div className="space-y-4">
                      <div className="flex justify-between items-baseline border-b border-white/5 pb-3 font-sans">
                        <span className="text-xs text-white/50">{i18n.language === 'ar' ? 'عدد المنتجات:' : 'Selected items:'}</span>
                        <span className="text-sm font-black text-white">{itemsCount}</span>
                      </div>
                      
                      {savingsAmount > 0 && (
                        <div className="flex justify-between items-baseline border-b border-white/5 pb-3 font-sans">
                          <span className="text-xs text-white/40">{i18n.language === 'ar' ? 'السعر الأصلي للمجموعة:' : 'Original Total:'}</span>
                          <span className="text-sm line-through text-white/30 font-mono">{formatPrice(totalBundleOriginal)}</span>
                        </div>
                      )}

                      <div className="flex justify-between items-baseline pb-1">
                        <span className="text-xs text-white/70 font-black">{i18n.language === 'ar' ? 'السعر الكلي المميز:' : 'Special Bundle Price:'}</span>
                        <div className="text-right">
                          <span className="text-2xl font-mono font-black text-brand-gold block">{formatPrice(totalBundleDiscounted)}</span>
                          {savingsAmount > 0 && (
                            <span className="text-[10px] text-green-400 font-bold block">
                              {i18n.language === 'ar' 
                                ? `وفرت ${formatPrice(savingsAmount)} (خصم 20% على الملحقات)` 
                                : `Save ${formatPrice(savingsAmount)} (20% off accessories)`}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Add bundle to cart button */}
                      <button
                        onClick={() => {
                          const activeDiscountPrice = product.colorDiscountPrices?.[selectedColor] ?? product.discountPrice;
                          const activePrice = product.colorPrices?.[selectedColor] ?? product.price;
                          const initialPrice = activeDiscountPrice ?? activePrice;
                          
                          // Add main
                          addToCart(product, selectedColor, selectedSize, quantity);
                          
                          // Add checked extras
                          let count = 0;
                          recommendedProducts.forEach(p => {
                            if (checkedPromo[p.id]) {
                              const pColor = selectedPromoColors[p.id] || p.colors[0] || '';
                              const pSize = selectedPromoSizes[p.id] || p.sizes[0] || '';
                              const basePrice = p.colorDiscountPrices?.[pColor] ?? p.discountPrice ?? p.colorPrices?.[pColor] ?? p.price;
                              const discountedRowPrice = Number((basePrice * 0.8).toFixed(2));

                              const cloneProduct: Product = {
                                ...p,
                                price: discountedRowPrice,
                                discountPrice: undefined,
                                colorPrices: undefined,
                                colorDiscountPrices: undefined
                              };
                              
                              addToCart(cloneProduct, pColor, pSize, 1);
                              count++;
                            }
                          });

                          showAlert(
                            i18n.language === 'ar' 
                              ? `تم إضافة المجموعة (${count + 1} منتجات) إلى السلة بخصم مميز!` 
                              : `Added Bundle (${count + 1} items) to your cart with exclusive discount!`, 
                            'success'
                          );
                        }}
                        className="w-full py-4 bg-brand-gold text-white hover:bg-white hover:text-[#0A0A0B] rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                      >
                        <ShoppingCart size={16} />
                        {i18n.language === 'ar' ? 'أضف المجموعة للسلة' : 'Add Bundle to Cart'}
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </section>
      )}

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
                  <p className="text-brand-charcoal/60 leading-relaxed font-sans font-medium text-center md:text-left rtl:md:text-right">
                    {isShoe ? (
                      i18n.language === 'ar' 
                        ? 'استخدم هذا الدليل للعثور على مقاس حذائك الرياضي المثالي. مليمترات أو سنتيمترات تقريبية لطول القدم.' 
                        : 'Use this guide to find your perfect athletic shoe size. Approximate foot length in centimeters.'
                    ) : (
                      i18n.language === 'ar'
                        ? 'استخدم هذا الدليل للعثور على مقاسك المثالي. جميع القياسات مدرجة بالسنتيمتر.'
                        : 'Use this guide to find your perfect size. All measurements are listed in centimeters.'
                    )}
                  </p>
                  
                  {isShoe ? (
                    <div className="overflow-x-auto rounded-3xl border border-brand-charcoal/5">
                      <table className="w-full text-center border-collapse">
                        <thead>
                          <tr className="bg-brand-charcoal/5 border-b border-brand-charcoal/5">
                            <th className="p-4 font-black uppercase tracking-widest text-[10px] text-brand-charcoal">{i18n.language === 'ar' ? 'المقاس (EU)' : 'Size (EU)'}</th>
                            <th className="p-4 font-black uppercase tracking-widest text-[10px] text-brand-charcoal">{i18n.language === 'ar' ? 'طول القدم' : 'Foot Length'}</th>
                            <th className="p-4 font-black uppercase tracking-widest text-[10px] text-brand-charcoal">US (Men)</th>
                            <th className="p-4 font-black uppercase tracking-widest text-[10px] text-brand-charcoal">US (Women)</th>
                            <th className="p-4 font-black uppercase tracking-widest text-[10px] text-brand-charcoal">UK</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-charcoal/5 font-semibold text-brand-charcoal/80">
                          {[
                            { eu: '39', cm: '24.5', usm: '6.5', usw: '8.0', uk: '5.5' },
                            { eu: '40', cm: '25.0', usm: '7.5', usw: '9.0', uk: '6.5' },
                            { eu: '41', cm: '26.0', usm: '8.0', usw: '9.5', uk: '7.0' },
                            { eu: '42', cm: '26.5', usm: '8.5', usw: '10.0', uk: '7.5' },
                            { eu: '43', cm: '27.5', usm: '9.5', usw: '11.0', uk: '8.5' },
                            { eu: '44', cm: '28.0', usm: '10.0', usw: '11.5', uk: '9.0' },
                            { eu: '45', cm: '29.0', usm: '11.0', usw: '12.5', uk: '10.0' }
                          ].map((row) => (
                            <tr key={row.eu} className="hover:bg-brand-gold/5 transition-colors">
                              <td className="p-4 font-black text-brand-charcoal text-xs">{row.eu}</td>
                              <td className="p-4 text-brand-charcoal/60 font-mono text-xs">{row.cm} cm</td>
                              <td className="p-4 text-brand-charcoal/60 font-mono text-xs">{row.usm}</td>
                              <td className="p-4 text-brand-charcoal/60 font-mono text-xs">{row.usw}</td>
                              <td className="p-4 text-brand-charcoal/60 font-mono text-xs">{row.uk}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
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
                  )}
                </div>

                <div className="mt-10 pt-8 border-t border-brand-charcoal/5">
                  <button 
                    onClick={() => setIsSizeGuideOpen(false)}
                    className="w-full py-4 bg-brand-charcoal text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-brand-gold transition-all"
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
              <span className="text-brand-gold text-xs font-black uppercase tracking-[0.4em] mb-4 block">{t('shop.mightLike')}</span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase">{t('shop.relatedProducts')}</h2>
            </div>
            <button 
              onClick={() => navigate('/shop')}
              className="group flex items-center gap-3 text-sm font-black uppercase tracking-widest text-brand-charcoal/60 dark:text-white/60 hover:text-brand-gold transition-colors"
            >
              {t('home.exploreAll')}
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-8">
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
      {false && recentlyViewed.filter(p => p.id !== product.id).length > 0 && (
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
