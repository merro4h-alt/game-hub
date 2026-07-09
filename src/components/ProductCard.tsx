import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, ShoppingCart, Check, Edit2, Trash2, X, AlertTriangle, ArrowUpRight, Sparkles, Heart } from 'lucide-react';
import { Product } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../StoreContext';
import { useAuth } from '../AuthContext';
import { useTranslation } from 'react-i18next';

interface ProductCardProps {
  product: Product;
  onEdit?: () => void;
  isEditMode?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit, isEditMode }) => {
  const { addToCart, deleteProduct, setEditingProduct, setIsAddModalOpen, formatPrice, setQuickViewProduct, toggleWishlist, isInWishlist, setLightboxInfo } = useStore();
  const { isAdmin } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  const allImages = [product.image, ...(product.images || [])].filter(Boolean);

  const handleColorClick = (color: string) => {
    setSelectedColor(color);
    setActiveImageIndex(null);
    // Visual feedback that the color was selected
    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 1500);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
  };

  const confirmDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deleteProduct(product.id);
    setIsDeleting(false);
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDeleting(false);
  };

  const activeImg = activeImageIndex !== null 
    ? allImages[activeImageIndex] 
    : (product.colorImages?.[selectedColor] || product.image);
  
  const activeImgKey = activeImageIndex !== null ? `img-${activeImageIndex}` : selectedColor;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative"
    >
      <AnimatePresence>
        {isDeleting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-brand-charcoal/60 backdrop-blur-sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl flex flex-col items-center text-center space-y-6"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center text-red-600">
                <AlertTriangle size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-brand-charcoal uppercase tracking-widest">{t('shop.deleteConfirm')}</h3>
                <p className="text-sm text-brand-charcoal/60">{product.name}</p>
              </div>
              <div className="flex gap-3 w-full">
                <button 
                  onClick={confirmDelete}
                  className="flex-1 bg-red-600 text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-colors shadow-lg shadow-red-500/20"
                >
                  {t('shop.yes')}
                </button>
                <button 
                  onClick={cancelDelete}
                  className="flex-1 bg-brand-charcoal/5 text-brand-charcoal py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-charcoal/10 transition-colors border border-brand-charcoal/10"
                >
                  {t('shop.no')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-[3rem] bg-[#F4F4F5] mb-4 border border-brand-charcoal/5 group-hover:border-brand-gold/20 group-hover:shadow-2xl group-hover:shadow-brand-gold/10 transition-all duration-700">
          <AnimatePresence mode="wait">
            <motion.img
              key={activeImgKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              src={activeImg || 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&q=60&w=600'}
              alt={product.name}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&q=60&w=600';
              }}
              className="w-full h-full object-cover rounded-[3rem] transition-transform duration-1000 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
          </AnimatePresence>
          
          <AnimatePresence>
            {showFeedback && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 backdrop-blur-[2px]"
              >
                <div className="bg-white/90 px-4 py-2 rounded-xl shadow-xl flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border border-brand-charcoal/10" style={{ backgroundColor: selectedColor }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-charcoal">
                    {selectedColor} Selected
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          

          <div className="absolute top-5 left-5 z-20 flex flex-col gap-2.5">
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(product.id);
              }}
              className={`p-3 rounded-2xl backdrop-blur-md shadow-xl transition-all active:scale-90 ${
                isInWishlist(product.id) 
                  ? 'bg-red-500 text-white shadow-red-500/30' 
                  : 'bg-white/90 text-brand-charcoal hover:text-red-500'
              }`}
            >
              <Heart size={18} fill={isInWishlist(product.id) ? "currentColor" : "none"} />
            </button>
            {product.discountPrice && (
              <motion.div 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-[#EF4444] text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] shadow-xl shadow-red-500/20 flex items-center gap-1.5 border border-white/10"
              >
                <Sparkles size={10} className="text-white/80" />
                <span>-{Math.round(((product.price - product.discountPrice) / product.price) * 100)}%</span>
              </motion.div>
            )}
          </div>



        </div>
      </Link>

      {/* Thumbnail Gallery */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1.5 mb-3 pt-1">
          {allImages.map((img, idx) => {
            const isActive = activeImageIndex === null ? idx === 0 : activeImageIndex === idx;
            return (
              <button
                key={idx}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveImageIndex(idx);
                }}
                onMouseEnter={() => {
                  setActiveImageIndex(idx);
                }}
                className={`w-10 h-12 rounded-xl overflow-hidden border transition-all flex-shrink-0 cursor-pointer ${
                  isActive 
                    ? 'border-brand-gold scale-105 shadow-md shadow-brand-gold/10' 
                    : 'border-white/10 opacity-60 hover:opacity-100'
                }`}
              >
                <img 
                  src={img} 
                  alt="" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&q=60&w=600';
                  }}
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Admin Quick Actions */}
      {isAdmin && (
        <div className="absolute top-4 right-4 z-[40] flex flex-col gap-2">
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Shop Card Edit clicked for:', product.id);
              setEditingProduct(product);
              setIsAddModalOpen(true);
            }}
            className="p-2 bg-white rounded-full shadow-lg hover:bg-brand-gold hover:text-brand-charcoal transition-all text-brand-charcoal border border-brand-charcoal/10"
            title={t('shop.edit')}
          >
            <Edit2 size={16} />
          </button>
          <button 
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleDelete(e);
            }}
            className="p-2 bg-white rounded-full shadow-lg hover:bg-red-500 hover:text-white transition-all text-red-500 border border-brand-charcoal/10"
            title={t('shop.delete')}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
      
      <div className="space-y-3 px-1">
        <div className="flex flex-col gap-1">
            <Link to={`/product/${product.id}`}>
            <h3 className="font-semibold text-lg hover:text-[#007bff] dark:hover:text-blue-400 transition-colors cursor-pointer line-clamp-1 text-white">
              {product.name}
            </h3>
          </Link>
          <p className="text-sm text-white/60 line-clamp-2 leading-relaxed h-10">
            {product.description}
          </p>
        </div>
        
        <div className="flex justify-between items-end">
          <div className="flex flex-col">
            {product.stock <= 10 && product.stock > 0 && (
              <span className="text-[8px] font-black uppercase tracking-widest text-brand-gold mb-1 animate-pulse">
                {t('shop.onlyLeft', { count: product.stock })}
              </span>
            )}
            {(() => {
              const activeDiscountPrice = product.colorDiscountPrices?.[selectedColor] ?? product.discountPrice;
              const activePrice = product.colorPrices?.[selectedColor] ?? product.price;

              if (activeDiscountPrice) {
                return (
                  <>
                    <span className="text-[10px] font-bold text-white/40 line-through decoration-red-500/30 uppercase tracking-tighter decoration-2">
                       {t('shop.originalPrice')}: {formatPrice(activePrice)}
                    </span>
                    <span className="font-mono font-black text-red-500 dark:text-red-400 text-2xl tracking-tighter">
                      {formatPrice(activeDiscountPrice)}
                    </span>
                  </>
                );
              }
              return (
                <span className="font-mono font-bold text-brand-gold text-xl">{formatPrice(activePrice)}</span>
              );
            })()}
          </div>
          <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg self-center">
            <Star size={12} fill="#C5A059" className="text-brand-gold" />
            <span className="text-[10px] font-bold text-white">{product.rating}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-white/5 mt-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            {product.colors.filter(c => c !== 'Default').map((color, idx) => (
              <button 
                key={idx}
                onClick={() => handleColorClick(color)}
                className={`relative w-6 h-6 rounded-full transition-all duration-300 ${
                  selectedColor === color 
                  ? 'ring-2 ring-brand-gold ring-offset-2 scale-110 shadow-lg shadow-brand-gold/20' 
                  : 'hover:scale-105 ring-1 ring-white/20'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              >
                {selectedColor === color && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Check size={10} className="text-white drop-shadow-sm mix-blend-difference" />
                  </div>
                )}
              </button>
            ))}
          </div>
          {selectedColor && selectedColor !== 'Default' && (
            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-white/40 border-l border-white/10 pl-2">
              {selectedColor}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-4">
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              addToCart(product, selectedColor, product.sizes[0]);
            }}
            className="flex-1 py-3.5 bg-brand-gold hover:bg-white text-brand-charcoal rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-brand-gold/20 active:scale-[0.98] cursor-pointer"
          >
            <ShoppingCart size={15} />
            <span>{t('shop.addToCart')}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
