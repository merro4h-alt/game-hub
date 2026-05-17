import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, ShoppingCart, Check, Edit2, Trash2, X, AlertTriangle, ArrowUpRight, Sparkles, Eye, Heart } from 'lucide-react';
import { Product } from '../types';
import { Link } from 'react-router-dom';
import { useStore } from '../StoreContext';
import { useAuth } from '../AuthContext';
import { useTranslation } from 'react-i18next';

interface ProductCardProps {
  product: Product;
  onEdit?: () => void;
  isEditMode?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit, isEditMode }) => {
  const { addToCart, deleteProduct, setEditingProduct, setIsAddModalOpen, formatPrice, setQuickViewProduct, toggleWishlist, isInWishlist } = useStore();
  const { isAdmin } = useAuth();
  const { t } = useTranslation();
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleColorClick = (color: string) => {
    setSelectedColor(color);
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
              key={selectedColor}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              src={product.colorImages?.[selectedColor] || product.image || 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&q=60&w=600'}
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
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-6 z-10">
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addToCart(product, selectedColor, product.sizes[0]);
              }}
              className="w-full bg-white text-brand-charcoal h-12 rounded-full font-black uppercase tracking-[0.1em] text-[8px] sm:text-[10px] flex items-center justify-center gap-2 hover:bg-brand-gold hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-500 shadow-xl active:scale-95"
              title={t('shop.addToCart')}
            >
              <ShoppingCart size={14} className="sm:size-4" />
              <span>{t('shop.addToCart')}</span>
            </button>
          </div>
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

          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setQuickViewProduct(product);
            }}
            className="absolute bottom-6 right-6 z-20 opacity-0 group-hover:opacity-100 p-3 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl text-brand-gold hover:bg-brand-gold hover:text-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-500 delay-150 shadow-xl active:scale-95 cursor-pointer"
            title={t('shop.quickView')}
          >
            <Eye size={20} />
          </button>

        </div>
      </Link>

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

        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            addToCart(product, selectedColor, product.sizes[0]);
          }}
          className="w-full mt-4 py-4 bg-brand-gold text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-charcoal transition-all duration-300 md:hidden flex items-center justify-center gap-3 shadow-lg shadow-brand-gold/20 active:scale-[0.98]"
        >
          <ShoppingCart size={16} />
          {t('shop.addToCart')}
        </button>
      </div>
    </motion.div>
  );
};

export default ProductCard;
