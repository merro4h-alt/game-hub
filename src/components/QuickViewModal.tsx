import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, 
  ShoppingCart, 
  X, 
  Check,
  Plus,
  Minus
} from 'lucide-react';
import { useStore } from '../StoreContext';
import { useTranslation } from 'react-i18next';
import { Product } from '../types';

interface QuickViewModalProps {
  product: Product;
  onClose: () => void;
}

const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, onClose }) => {
  const { addToCart, formatPrice } = useStore();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  
  const isShoe = 
    /حذاء|حذأ|أحذية|احذية|جزمة|كوتش|حذائيه|حذائية|صندل|نعال|سنيكرز|شبشب|shoe|sneaker|boot|sandal|footwear|loafers|slippers|heels/i.test(product.name || '') || 
    /حذاء|حذأ|أحذية|احذية|جزمة|كوتش|حذائيه|حذائية|صندل|نعال|سنيكرز|شبشب|shoe|sneaker|boot|sandal|footwear|loafers|slippers|heels/i.test(product.description || '');

  const effectiveSizes = isShoe ? ['39', '40', '41', '42', '43', '44', '45'] : [];

  const [selectedColor, setSelectedColor] = useState<string>(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState<string>(effectiveSizes[0] || product.sizes[0] || 'Standard');
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isShowingVideo, setIsShowingVideo] = useState(false);

  const allImages = [product.image, ...(product.images || [])];

  // If selecting a color that has a specific image, update active image
  useEffect(() => {
    if (product.colorImages?.[selectedColor]) {
      const colorImgIndex = allImages.indexOf(product.colorImages[selectedColor]);
      if (colorImgIndex !== -1) {
        setActiveImageIndex(colorImgIndex);
        setIsShowingVideo(false);
      }
    }
  }, [selectedColor]);

  // Escape key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleAddToCart = () => {
    addToCart(product, selectedColor, selectedSize, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-brand-charcoal/60 backdrop-blur-md"
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-4xl bg-[#0A0A0B] rounded-[2.5rem] shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto no-scrollbar"
      >
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all z-20"
        >
          <X size={20} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Gallery Side */}
          <div className="p-6 md:p-8 space-y-4">
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-white/5 border border-white/5">
              <AnimatePresence mode="wait">
                {isShowingVideo && product.videoUrl ? (
                  <motion.div 
                    key="video"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full bg-black flex items-center justify-center"
                  >
                    <video 
                      src={product.videoUrl} 
                      className="w-full h-full object-contain" 
                      controls 
                      autoPlay 
                      playsInline
                    />
                  </motion.div>
                ) : (
                  <motion.img
                    key={activeImageIndex}
                    src={allImages[activeImageIndex] || 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&q=60&w=600'}
                    alt={product.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
              </AnimatePresence>
            </div>
            
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {product.videoUrl && (
                <button
                  onClick={() => setIsShowingVideo(true)}
                  className={`w-16 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all flex items-center justify-center bg-brand-gold/20 relative ${
                    isShowingVideo ? 'border-brand-gold scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <video src={product.videoUrl} className="w-full h-full object-cover opacity-40" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-brand-gold flex items-center justify-center text-white scale-75 shadow-lg">
                      <Plus size={14} className="rotate-45" />
                    </div>
                  </div>
                </button>
              )}
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setActiveImageIndex(idx);
                    setIsShowingVideo(false);
                  }}
                  className={`w-16 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                    activeImageIndex === idx && !isShowingVideo ? 'border-brand-gold scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </div>

          {/* Info Side */}
          <div className="p-6 md:p-8 flex flex-col h-full bg-white/[0.02]">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#4F46E5]">{product.category}</span>
                <div className="flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded-lg">
                  <Star size={10} fill="#C5A059" className="text-brand-gold" />
                  <span className="text-[10px] font-bold text-white">{product.rating}</span>
                </div>
              </div>
              <h2 className="text-2xl font-black text-white mb-2 leading-tight uppercase">{product.name}</h2>
              <div className="flex items-center gap-3">
                {(() => {
                  const activeDiscountPrice = product.colorDiscountPrices?.[selectedColor] ?? product.discountPrice;
                  const activePrice = product.colorPrices?.[selectedColor] ?? product.price;

                  if (activeDiscountPrice) {
                    return (
                      <>
                        <span className="text-xl font-mono font-black text-indigo-400">{formatPrice(activeDiscountPrice)}</span>
                        <span className="text-sm font-mono text-white/30 line-through">{formatPrice(activePrice)}</span>
                      </>
                    );
                  }
                  return (
                    <span className="text-xl font-mono font-black text-white">{formatPrice(activePrice)}</span>
                  );
                })()}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-6 mb-8">
              <p className="text-white/90 text-sm leading-relaxed line-clamp-3">
                {product.description}
              </p>

              {/* Stock Status */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/10 w-fit">
                <div className={`w-2 h-2 rounded-full ${
                  (product.stock || 0) <= 0 ? 'bg-red-500' : (product.stock || 0) <= 5 ? 'bg-orange-500' : 'bg-green-500'
                }`} />
                <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                  {(product.stock || 0) <= 0 
                    ? (isArabic ? 'نفذت الكمية' : 'Out of Stock') 
                    : (product.stock || 0) <= 5 
                      ? (isArabic ? `بقي ${product.stock} فقط!` : `Only ${product.stock} left!`)
                      : (isArabic ? 'متوفر في المخزون' : 'In Stock')}
                </span>
              </div>

              {/* Color Selector */}
              {product.colors.length > 0 && product.colors[0] !== 'Default' && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{t('shop.color')}</span>
                    <span className="text-[10px] font-bold text-white/80">{t(`colors.${selectedColor}`, selectedColor)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map(color => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center ${
                          selectedColor === color ? 'border-brand-gold scale-110' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                        title={t(`colors.${color}`, color)}
                      >
                        {selectedColor === color && <Check size={12} className="text-white mix-blend-difference" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selector */}
              {effectiveSizes.length > 0 && (
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{t('shop.size')}</span>
                  <div className="grid grid-cols-5 gap-2">
                    {effectiveSizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`py-2 rounded-xl text-[10px] font-bold transition-all border ${
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
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5 mt-auto">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <div className="flex items-center justify-between sm:justify-start bg-white/5 rounded-2xl p-1 border border-white/10 h-14">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))} 
                    className="p-3 text-white/40 hover:text-white transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-12 text-center text-sm font-bold text-white">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(q => Math.min(product.stock || 100, q + 1))} 
                    className="p-3 text-white/40 hover:text-white transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                
                <button 
                  onClick={handleAddToCart}
                  disabled={(product.stock || 0) <= 0}
                  className={`flex-1 ${
                    (product.stock || 0) <= 0 ? 'bg-white/10 text-white/20' : 'bg-[#4F46E5] text-white hover:bg-[#4338CA]'
                  } h-14 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-lg shadow-indigo-500/10`}
                >
                  <ShoppingCart size={16} />
                  {(product.stock || 0) <= 0 
                    ? (isArabic ? 'نفذت الكمية' : 'Out of Stock') 
                    : t('shop.addToCart')}
                </button>
              </div>
              

            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default QuickViewModal;
