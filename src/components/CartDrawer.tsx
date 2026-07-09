import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, X, Plus, Minus, Trash2, ArrowRight, ArrowLeft, Truck, ShieldCheck, Ticket, Gift, Sparkles, ShoppingCart } from 'lucide-react';
import { useStore } from '../StoreContext';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import PaymentModal from './PaymentModal';

export const CartDrawer: React.FC = () => {
  const navigate = useNavigate();
  const {
    cart,
    removeFromCart,
    updateCartQuantity,
    totalPrice,
    discountedTotal,
    totalItems,
    applyDiscountCode,
    appliedDiscount,
    formatPrice,
    isCartOpen,
    setIsCartOpen,
    products,
    addToCart,
    settings
  } = useStore();

  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Free shipping is unconditionally active for all orders!
  const isFreeShipping = true;
  const progressPercent = 100;
  const remainingForFreeShipping = 0;

  // Shipping cost formatting
  const shippingCost = 0;
  const finalTotalWithShipping = discountedTotal;

  // Handle applied promo code
  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    const res = applyDiscountCode(promoCode);
    setPromoMessage({ text: res.message, isError: !res.success });
    if (res.success) {
      setPromoCode('');
    }
  };

  // Get 2 smart product recommendations that are not already in the cart
  const cartItemIds = cart.map((item) => item.id);
  const recommendations = products
    .filter((p) => !cartItemIds.includes(p.id) && p.stock > 0)
    .slice(0, 2);

  const texts = {
    title: isRtl ? 'سلة التسوق' : 'Cart',
    emptyTitle: isRtl ? 'سلة التسوق فارغة تماماً' : 'Your Cart is Empty',
    emptyDesc: isRtl ? 'لم تقم بإضافة أي منتج حتى الآن.' : 'You haven\'t added any items yet.',
    startShopping: isRtl ? 'ابدأ التسوق' : 'Start Shopping',
    item: isRtl ? 'منتج' : 'item',
    items: isRtl ? 'منتجات' : 'items',
    freeShippingEligible: isRtl ? 'جميع الطلبات مؤهلة للشحن والتوصل المجاني بالكامل! 🚚' : 'All orders qualify for 100% FREE shipping! 🚚',
    addMoreForFreeShipping: isRtl 
      ? 'شحن مجاني بالكامل على جميع الطلبات!' 
      : 'Enjoy FREE shipping on all orders!',
    recommendationsTitle: isRtl ? 'اقتراحات ذكية لك ✨' : 'Smart Suggestions for you ✨',
    promoPlaceholder: isRtl ? 'كود الخصم (مثل: START15)' : 'Promo Code (e.g. START15)',
    applyBtn: isRtl ? 'تطبيق' : 'Apply',
    summaryTitle: isRtl ? 'المجموع المستحق' : 'Order Total',
    subtotal: isRtl ? 'المجموع الفرعي' : 'Subtotal',
    discount: isRtl ? 'الخصم المطبق' : 'Discount',
    shipping: isRtl ? 'الشحن والتوصيل' : 'Shipping Fee',
    shippingFree: isRtl ? 'شحن مجاني' : 'FREE Shipping',
    totalText: isRtl ? 'الإجمالي الكلي' : 'Grand Total',
    checkoutBtn: isRtl ? 'إتمام عملية الشراء الدفع الآمن' : 'Proceed to Secure Checkout',
    viewFullCart: isRtl ? 'عرض تفاصيل السلة الكاملة' : 'View Full Cart Details',
    quickAdd: isRtl ? 'إضافة سريعة' : 'Quick Add'
  };

  return (
    <>
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-[2000] overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
            
            {/* Backdrop blur overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
            />

            <div className={`fixed inset-y-0 ${isRtl ? 'left-0' : 'right-0'} max-w-full flex pl-0`}>
              <motion.div
                initial={{ x: isRtl ? '-100%' : '100%' }}
                animate={{ x: 0 }}
                exit={{ x: isRtl ? '-100%' : '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 260 }}
                className="w-screen max-w-md bg-white text-brand-charcoal shadow-2xl flex flex-col h-full overflow-hidden"
              >
                
                {/* Drawer Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-[#FDFBF7]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                      <ShoppingCart size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black tracking-tight text-brand-charcoal">{texts.title}</h2>
                      <p className="text-[11px] text-brand-charcoal/40 font-bold uppercase tracking-wider">
                        {totalItems} {totalItems === 1 ? texts.item : texts.items}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="w-10 h-10 rounded-full border border-gray-100 bg-white flex items-center justify-center hover:bg-gray-50 active:scale-90 transition-all text-brand-charcoal/50 hover:text-brand-charcoal"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto scrollbar-thin py-4 px-6 space-y-6">

                  {/* Smart Progress Bar for Free Shipping */}
                  {totalItems > 0 && (
                    <div className="bg-[#4F46E5]/5 border border-[#4F46E5]/10 rounded-2xl p-4 relative overflow-hidden">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-xl ${isFreeShipping ? 'bg-green-500/10 text-green-600' : 'bg-[#4F46E5]/10 text-[#4F46E5]'}`}>
                          <Truck size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-black tracking-tight ${isFreeShipping ? 'text-green-600' : 'text-[#4F46E5]'}`}>
                            {isFreeShipping ? texts.freeShippingEligible : texts.addMoreForFreeShipping}
                          </p>
                          <div className="mt-3 relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progressPercent}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className={`h-full rounded-full ${isFreeShipping ? 'bg-green-500' : 'bg-gradient-to-r from-[#4F46E5] to-[#C5A05B]'}`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Empty state */}
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center space-y-5">
                      <div className="w-24 h-24 rounded-[2rem] bg-brand-charcoal/[0.02] flex items-center justify-center border border-brand-charcoal/5">
                        <ShoppingCart size={36} className="text-brand-charcoal/20" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-black text-brand-charcoal">{texts.emptyTitle}</h3>
                        <p className="text-xs text-brand-charcoal/40 max-w-[200px] leading-relaxed mx-auto">{texts.emptyDesc}</p>
                      </div>
                      <button
                        onClick={() => {
                          setIsCartOpen(false);
                          navigate('/shop');
                        }}
                        className="px-6 py-2.5 bg-[#C5A05B] hover:bg-brand-charcoal text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 shadow-md hover:shadow-lg active:scale-95"
                      >
                        {texts.startShopping}
                      </button>
                    </div>
                  ) : (
                    /* Cart Items List */
                    <div className="space-y-4">
                      {cart.map((item) => {
                        const itemDiscountPrice = item.colorDiscountPrices?.[item.selectedColor] ?? item.discountPrice;
                        const itemPrice = item.colorPrices?.[item.selectedColor] ?? item.price;
                        const activePrice = itemDiscountPrice ?? itemPrice;

                        return (
                          <motion.div
                            key={`${item.id}-${item.selectedColor}-${item.selectedSize}`}
                            layout
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex gap-4 p-4 rounded-2xl bg-brand-charcoal/[0.015] border border-gray-100 group hover:bg-white hover:shadow-xl hover:shadow-brand-charcoal/5 transition-all duration-300"
                          >
                            {/* Item Image */}
                            <div className="w-18 h-24 flex-shrink-0 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 relative">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>

                            {/* Item Details */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div>
                                <div className="flex justify-between items-start gap-1">
                                  <h4 className="text-xs font-black text-brand-charcoal group-hover:text-[#C5A05B] transition-colors leading-tight line-clamp-2">
                                    {item.name}
                                  </h4>
                                  <button
                                    onClick={() => removeFromCart(item.id, item.selectedColor, item.selectedSize)}
                                    className="text-brand-charcoal/30 hover:text-red-500 p-1 rounded-lg hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>

                                {/* Custom variation pills */}
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.selectedColor && (
                                    <span className="inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-full bg-white border border-gray-100 text-brand-charcoal/60 uppercase">
                                      {item.selectedColor}
                                    </span>
                                  )}
                                  {item.selectedSize && (
                                    <span className="inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-full bg-white border border-gray-100 text-brand-charcoal/60 uppercase">
                                      {item.selectedSize}
                                    </span>
                                  )}
                                  {item.stock !== undefined && (
                                    <span className="inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-50 border border-orange-100/50 text-orange-600 uppercase">
                                      {isRtl ? `المخزن: ${item.stock}` : `Stock: ${item.stock}`}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-2 mt-2">
                                {/* Price */}
                                <div className="flex flex-col">
                                  <span className="text-xs font-black text-[#C5A05B]">{formatPrice(activePrice)}</span>
                                  {itemDiscountPrice && (
                                    <span className="text-[10px] text-brand-charcoal/30 line-through">
                                      {formatPrice(itemPrice)}
                                    </span>
                                  )}
                                </div>

                                {/* Quantity Adjuster */}
                                <div className="flex items-center border border-gray-100 rounded-xl bg-white p-1">
                                  <button
                                    onClick={() => updateCartQuantity(item.id, item.selectedColor, item.selectedSize, item.quantity - 1)}
                                    disabled={item.quantity <= 1}
                                    className="w-6 h-6 rounded-lg hover:bg-gray-50 flex items-center justify-center text-brand-charcoal/50 disabled:opacity-30 disabled:hover:bg-transparent"
                                  >
                                    <Minus size={11} strokeWidth={2.5} />
                                  </button>
                                  <span className="text-xs font-black px-2.5 text-brand-charcoal select-none">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => updateCartQuantity(item.id, item.selectedColor, item.selectedSize, item.quantity + 1)}
                                    disabled={item.quantity >= item.stock}
                                    className="w-6 h-6 rounded-lg hover:bg-gray-50 flex items-center justify-center text-brand-charcoal/50 disabled:opacity-30 disabled:hover:bg-transparent"
                                  >
                                    <Plus size={11} strokeWidth={2.5} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {/* Smart cross-sell recommendation cards */}
                  {recommendations.length > 0 && cart.length > 0 && (
                    <div className="pt-4 border-t border-gray-100 space-y-3">
                      <h3 className="text-xs font-black tracking-tight text-brand-charcoal/80 flex items-center gap-1.5">
                        <Sparkles size={14} className="text-[#C5A05B]" />
                        {texts.recommendationsTitle}
                      </h3>
                      <div className="grid grid-cols-1 gap-2.5">
                        {recommendations.map((prod) => (
                          <div
                            key={prod.id}
                            className="flex items-center gap-3 p-3 bg-brand-charcoal/[0.01] border border-gray-100 rounded-xl hover:border-[#C5A05B]/30 hover:bg-white hover:shadow-md hover:shadow-brand-charcoal/5 transition-all duration-300"
                          >
                            <img src={prod.image} alt={prod.name} className="w-12 h-16 object-cover rounded-lg bg-gray-50 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[11px] font-black leading-snug text-brand-charcoal truncate">{prod.name}</h4>
                              <p className="text-[10px] font-black text-[#C5A05B] mt-0.5">{formatPrice(prod.discountPrice ?? prod.price)}</p>
                            </div>
                            <button
                              onClick={() => addToCart(prod, prod.colors?.[0] || '', prod.sizes?.[0] || '', 1)}
                              className="px-3 py-1.5 bg-[#C5A05B]/10 hover:bg-[#C5A05B] text-[#C5A05B] hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors duration-300 active:scale-95 flex-shrink-0"
                            >
                              {texts.quickAdd}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sticky Drawer Footer Summary & Promo Panel */}
                {cart.length > 0 && (
                  <div className="border-t border-gray-100 bg-white p-6 shadow-[0_-15px_40px_rgba(0,0,0,0.03)] space-y-4">
                    
                    {/* Promo Discount Input panel */}
                    <form onSubmit={handleApplyPromo} className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                          placeholder={texts.promoPlaceholder}
                          className="w-full bg-brand-charcoal/[0.015] border border-gray-150 rounded-xl px-3 py-2.5 text-xs text-brand-charcoal placeholder-brand-charcoal/30 focus:outline-none focus:border-[#C5A05B]/50 transition-colors uppercase"
                        />
                        <Ticket size={13} className={`absolute ${isRtl ? 'left-3' : 'right-3'} top-3.5 text-brand-charcoal/30`} />
                      </div>
                      <button
                        type="submit"
                        className="px-4 bg-[#C5A05B] hover:bg-brand-charcoal text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors duration-300 active:scale-95 flex-shrink-0"
                      >
                        {texts.applyBtn}
                      </button>
                    </form>

                    {promoMessage && (
                      <p className={`text-[10px] font-bold ${promoMessage.isError ? 'text-red-500' : 'text-green-600'}`}>
                        {promoMessage.text}
                      </p>
                    )}

                    {/* Numeric breakdown */}
                    <div className="space-y-2 border-t border-b border-gray-50 py-3 text-xs">
                      <div className="flex justify-between text-brand-charcoal/60">
                        <span>{texts.subtotal}</span>
                        <span className="font-bold">{formatPrice(totalPrice)}</span>
                      </div>
                      
                      {appliedDiscount && (
                        <div className="flex justify-between text-green-600">
                          <span className="flex items-center gap-1">
                            <Gift size={12} />
                            {texts.discount} ({appliedDiscount.code})
                          </span>
                          <span className="font-bold">-{appliedDiscount.percent}%</span>
                        </div>
                      )}

                      <div className="flex justify-between text-brand-charcoal/60">
                        <span>{texts.shipping}</span>
                        <span className={`font-bold ${isFreeShipping ? 'text-green-600' : ''}`}>
                          {isFreeShipping ? texts.shippingFree : formatPrice(shippingCost)}
                        </span>
                      </div>

                      {/* Return Policy Terms */}
                      <div id="cart-drawer-return-policy" className="mt-1 p-2.5 bg-[#FDFBF7]/80 border border-[#C5A05B]/10 rounded-xl space-y-1.5 text-start">
                        <div className="flex items-center gap-2 text-brand-charcoal/75 text-[10px] font-bold">
                          <Truck size={12} className="text-[#C5A05B] shrink-0" />
                          <span>{isRtl ? 'سياسة الشحن: وقت التوصيل قد يتراوح بين 8-15 يوماً' : 'Shipping Policy: Delivery time may range between 8-15 days'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-brand-charcoal/75 text-[10px] font-bold">
                          <ShieldCheck size={12} className="text-[#C5A05B] shrink-0" />
                          <span>{isRtl ? 'فترة استرجاع مرنة تصل إلى 14 يوماً' : 'Flexible return period up to 14 days'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-brand-charcoal/75 text-[10px] font-bold">
                          <ShieldCheck size={12} className="text-[#C5A05B] shrink-0" />
                          <span>{isRtl ? 'استرداد كامل المبلغ في حال العيوب المصنعية' : 'Full refund in case of manufacturing defects'}</span>
                        </div>
                      </div>

                      <div className="flex justify-between text-base font-black text-brand-charcoal pt-2">
                        <span>{texts.totalText}</span>
                        <span className="text-[#C5A05B]">{formatPrice(finalTotalWithShipping)}</span>
                      </div>
                    </div>

                    {/* CTA Actions */}
                    <div className="space-y-2.5">
                      <button
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="w-full py-4 bg-brand-charcoal hover:bg-brand-charcoal/90 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 relative overflow-hidden group border border-transparent"
                      >
                        <ShieldCheck size={16} className="text-[#C5A05B] group-hover:scale-110 transition-transform" />
                        <span>{texts.checkoutBtn}</span>
                      </button>

                      {/* Security Trust Seals */}
                      <div className="pt-2 flex flex-col items-center justify-center gap-1.5 text-[10px] text-brand-charcoal/50">
                        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                          <span>{isRtl ? 'اتصال آمن ومشفر 256-Bit SSL' : '256-Bit SSL Encrypted Connection'}</span>
                        </div>
                        <p className="text-[9px] text-center text-brand-charcoal/40 font-light px-2 animate-pulse">
                          {isRtl ? 'حقوق المشتري وحماية البيانات مضمونة بالكامل لدينا لحمايتك' : 'Buyer protection & digital data fully guaranteed by ONXIFI'}
                        </p>
                      </div>
                    </div>

                  </div>
                )}
              </motion.div>
            </div>
            
            {/* Modal payment integration directly */}
            <PaymentModal
              isOpen={isPaymentModalOpen}
              onClose={() => setIsPaymentModalOpen(false)}
              total={finalTotalWithShipping}
            />

          </div>
        )}
      </AnimatePresence>
    </>
  );
};
