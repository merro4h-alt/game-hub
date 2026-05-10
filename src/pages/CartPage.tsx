import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus, CreditCard, ArrowLeft, Truck, Banknote, ShieldCheck, Ticket, X, HandCoins } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../StoreContext';
import PaymentModal from '../components/PaymentModal';
import { useTranslation } from 'react-i18next';

const CartPage: React.FC = () => {
  const { 
    cart, 
    removeFromCart, 
    updateCartQuantity, 
    totalPrice, 
    discountedTotal,
    totalItems, 
    applyDiscountCode, 
    appliedDiscount 
  } = useStore();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [discountMessage, setDiscountMessage] = useState<{ text: string, isError: boolean } | null>(null);

  const handleApplyDiscount = () => {
    if (!discountCodeInput) return;
    const result = applyDiscountCode(discountCodeInput);
    setDiscountMessage({ text: result.message, isError: !result.success });
    if (result.success) setDiscountCodeInput('');
  };

  const handleCheckout = () => {
    setIsPaymentModalOpen(true);
  };

  const texts = {
    title: isArabic ? 'سلة التسوق' : 'Shopping Bag',
    emptyTitle: isArabic ? 'سلتك فارغة' : 'Your Bag is Empty',
    emptyDesc: isArabic ? 'يبدو أنك لم تضف أي شيء إلى سلتك بعد. دعنا نجد شيئاً مميزاً لك.' : "Looks like you haven't added anything to your cart yet. Let's find something special for you.",
    startShopping: isArabic ? 'ابدأ التسوق' : 'Start Shopping',
    summary: isArabic ? 'ملخص الطلب' : 'Order Summary',
    subtotal: isArabic ? 'المجموع الفرعي' : 'Subtotal',
    shipping: isArabic ? 'الشحن' : 'Shipping',
    free: isArabic ? 'مجاني' : 'FREE',
    total: isArabic ? 'الإجمالي' : 'Total',
    checkout: isArabic ? 'إتمام عملية الشراء' : 'Proceed to Checkout',
    redirecting: isArabic ? 'جاري التحويل...' : 'Redirecting...',
    secureOptions: isArabic ? 'خيارات دفع وقبول آمنة' : 'Secure Payment Options',
    codAvailable: isArabic ? 'تتوفر خاصية الدفع عند الاستلام' : 'Cash on Delivery Available',
    promoCode: isArabic ? 'كود الخصم' : 'Promo Code',
    apply: isArabic ? 'تطبيق' : 'Apply',
    discount: isArabic ? 'الخصم' : 'Discount'
  };

  if (cart.length === 0) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 bg-[#0A0A0B] ${isArabic ? 'font-arabic' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative max-w-lg w-full"
        >
          {/* Decorative background elements */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand-gold/10 blur-[100px] rounded-full" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-[#4F46E5]/10 blur-[100px] rounded-full" />

          <div className="relative bg-white/5 backdrop-blur-3xl border border-white/10 p-12 sm:p-20 rounded-[4rem] text-center shadow-2xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-gold to-transparent opacity-50" />
            
            <motion.div 
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.1 
              }}
              className="w-32 h-32 sm:w-40 sm:h-40 bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center rounded-[2.5rem] mx-auto mb-10 border border-white/10 shadow-2xl relative group"
            >
              <div className="absolute inset-0 bg-brand-gold opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-[2.5rem]" />
              <ShoppingBag size={64} className="text-white/20 group-hover:text-brand-gold/50 transition-colors duration-500 transform group-hover:scale-110" />
              <motion.div 
                animate={{ 
                  y: [0, -5, 0],
                  rotate: [0, 5, 0]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -top-2 -right-2 bg-brand-gold p-3 rounded-2xl shadow-lg shadow-brand-gold/20"
              >
                <Plus size={20} className="text-white" strokeWidth={3} />
              </motion.div>
            </motion.div>

            <h2 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight text-white leading-tight">
              {texts.emptyTitle}
            </h2>
            <p className="text-white/40 font-light text-base sm:text-lg mb-12 max-w-[280px] sm:max-w-xs mx-auto leading-relaxed">
              {texts.emptyDesc}
            </p>

            <Link 
              to="/shop" 
              className="group relative inline-flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-brand-gold blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
              <div className="relative flex items-center gap-3 bg-white text-brand-charcoal hover:bg-brand-gold hover:text-white px-10 sm:px-14 py-4 sm:py-5 rounded-2xl font-black uppercase tracking-widest transition-all duration-500 shadow-xl overflow-hidden">
                <span className="relative z-10">{texts.startShopping}</span>
                <div className="relative z-10 transition-transform duration-500 group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                  {isArabic ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}
                </div>
              </div>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`pt-24 pb-32 bg-[#0A0A0B] text-white min-h-screen ${isArabic ? 'font-arabic' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-bold tracking-tight mb-16 text-white">{texts.title} <span className="text-brand-gold text-2xl">({totalItems})</span></h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-8">
            {cart.map((item) => (
              <motion.div 
                key={`${item.id}-${item.selectedColor}-${item.selectedSize}`}
                initial={{ opacity: 0, x: isArabic ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-start sm:items-center gap-4 sm:gap-6 p-4 sm:p-6 bg-[#1A1A1A] rounded-[2rem] sm:rounded-3xl shadow-sm border border-white/10 group relative overflow-hidden"
              >
                <div className="w-24 h-32 sm:w-40 sm:h-52 flex-shrink-0 rounded-2xl overflow-hidden bg-white/5">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                </div>
                
                <div className="flex-grow min-w-0 flex flex-col h-full sm:h-auto justify-between">
                  <div className="space-y-1">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h3 className="text-base sm:text-xl font-bold group-hover:text-brand-gold transition-colors truncate text-white">{item.name}</h3>
                        <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/40 ${isArabic ? 'text-right' : ''}`}>{item.category}</p>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.id, item.selectedColor, item.selectedSize)}
                        className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/10 hover:bg-red-500 text-white/60 hover:text-white rounded-2xl transition-all duration-500 border border-white/20 hover:border-red-500 hover:rotate-12 active:scale-95 group/remove ${isArabic ? 'mr-auto ml-0' : 'ml-auto'}`}
                      >
                        <Trash2 size={20} className="transition-transform duration-500 group-hover/remove:scale-110" />
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] sm:text-sm font-medium text-white/60">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full border border-white/10" style={{ backgroundColor: item.selectedColor }} /> 
                        {item.selectedColor}
                      </span>
                      <span className="flex items-center gap-1 uppercase">| {isArabic ? 'المقاس' : 'Size'}: {item.selectedSize}</span>
                    </div>
                  </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4 sm:pt-6">
                      <div className="flex items-center gap-3 sm:gap-4 bg-white/5 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 border border-white/10">
                        <button 
                          onClick={() => updateCartQuantity(item.id, item.selectedColor, item.selectedSize, item.quantity - 1)}
                          className="text-white/40 hover:text-white transition-colors p-0.5"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="font-mono font-bold text-sm sm:text-base w-4 text-center text-white">{item.quantity}</span>
                        <button 
                          onClick={() => updateCartQuantity(item.id, item.selectedColor, item.selectedSize, item.quantity + 1)}
                          className="text-white/40 hover:text-white transition-colors p-0.5"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    <span className={`text-lg sm:text-xl font-mono font-bold text-white ${isArabic ? 'mr-auto ml-0' : 'ml-auto sm:ml-0'}`}>
                      ${((item.discountPrice ?? item.price) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Checkout Summary */}
          <div className="lg:col-span-1">
            <div className="bg-brand-charcoal text-brand-cream p-10 rounded-[3rem] sticky top-32 shadow-2xl overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/20 blur-[60px] rounded-full -mr-16 -mt-16" />
              
              <h2 className="text-2xl font-bold mb-10 tracking-tight flex items-center gap-3">
                <CreditCard /> {texts.summary}
              </h2>

              {/* Promo Code Input */}
              <div className="mb-10">
                <div className="flex gap-2 mb-2">
                  <div className="relative flex-grow">
                    <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-cream/30" size={16} />
                    <input 
                      type="text" 
                      placeholder={texts.promoCode}
                      value={discountCodeInput}
                      onChange={(e) => setDiscountCodeInput(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-brand-gold transition-all text-white placeholder:text-brand-cream/30"
                    />
                  </div>
                  <button 
                    onClick={handleApplyDiscount}
                    className="bg-brand-gold text-white px-5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white hover:text-brand-charcoal transition-all"
                  >
                    {texts.apply}
                  </button>
                </div>
                <AnimatePresence>
                  {discountMessage && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`text-[10px] font-bold uppercase tracking-wider ${discountMessage.isError ? 'text-red-400' : 'text-green-400'}`}
                    >
                      {discountMessage.text}
                    </motion.p>
                  )}
                </AnimatePresence>
                
                {appliedDiscount && (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mt-4 bg-brand-gold/10 border border-brand-gold/20 rounded-xl p-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 text-brand-gold">
                      <Ticket size={14} />
                      <span className="text-xs font-black uppercase tracking-widest">{appliedDiscount.code} (-{appliedDiscount.percent}%)</span>
                    </div>
                    <button 
                      onClick={() => applyDiscountCode('')} // Passing empty string to clear if logic allows, or I should have a clear function
                      className="text-brand-gold/50 hover:text-brand-gold h-5 w-5 flex items-center justify-center rounded-full hover:bg-brand-gold/10"
                    >
                      <X size={12} />
                    </button>
                  </motion.div>
                )}
              </div>
              
              <div className="space-y-6 mb-10">
                <div className="flex justify-between text-brand-cream/60 font-light">
                  <span>{texts.subtotal}</span>
                  <span className="font-mono">${totalPrice.toFixed(2)}</span>
                </div>
                {appliedDiscount && (
                  <div className="flex justify-between text-green-400 font-bold">
                    <span className="flex items-center gap-2"><Ticket size={14} /> {texts.discount}</span>
                    <span className="font-mono">-${(totalPrice - discountedTotal).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-brand-cream/60 font-light items-center">
                  <div className="flex items-center gap-2">
                    <Truck size={14} />
                    <span>{texts.shipping}</span>
                  </div>
                  <span className="font-mono">{texts.free}</span>
                </div>
                <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                  <span className="text-lg">{texts.total}</span>
                  <div className="text-right">
                    <span className="block text-3xl font-mono font-bold text-brand-gold">
                      ${discountedTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <button 
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full bg-brand-gold text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 hover:translate-y-[-2px] hover:shadow-xl active:translate-y-0 transition-all duration-300 disabled:opacity-50"
              >
                {isCheckingOut ? (
                   <>
                     <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                     {texts.redirecting}
                   </>
                ) : (
                   <>{texts.checkout} {isArabic ? <ArrowLeft size={20} /> : <ArrowRight size={20} />}</>
                )}
              </button>
              
              <div className="mt-10 pt-10 border-t border-white/10 text-center">
                <p className="text-[10px] uppercase font-black tracking-[0.3em] text-brand-gold mb-6">{texts.secureOptions}</p>
                <div className="grid grid-cols-3 gap-3">
                   <div className="bg-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-inner h-16">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/b/b7/MasterCard_Logo.svg" alt="Mastercard" className="h-6 w-auto" />
                      <span className="text-[8px] text-brand-charcoal font-black">MASTERCARD</span>
                   </div>
                   <div className="bg-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-inner h-16">
                      <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" 
                        alt="PayPal" 
                        className="h-5 w-auto object-contain" 
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-[8px] text-brand-charcoal font-black">PAYPAL</span>
                   </div>
                   <div className="bg-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1 shadow-inner h-16">
                      <div className="w-8 h-8 rounded-full bg-brand-gold/20 flex items-center justify-center shadow-sm">
                        <HandCoins size={18} className="text-brand-gold" />
                      </div>
                      <span className="text-[8px] text-brand-charcoal font-black uppercase text-center leading-tight">{isArabic ? 'الدفع عند الاستلام' : 'Cash on Delivery'}</span>
                   </div>
                </div>
                <div className="mt-6 flex items-center justify-center gap-2 text-brand-gold">
                  <ShieldCheck size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{isArabic ? 'دفع آمن 100%' : '100% SECURE PAYMENT'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Global Payment Methods Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 bg-[#1A1A1A] rounded-[3rem] p-12 border border-white/10 text-center shadow-sm"
        >
          <div className="inline-flex items-center gap-2 bg-brand-gold/10 text-brand-gold px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
            <ShieldCheck size={14} /> {isArabic ? 'دفع آمن وموثوق' : 'SECURE & TRUSTED PAYMENT'}
          </div>
          <h2 className="text-3xl font-bold mb-4 text-white">{isArabic ? 'طرق الدفع المتاحة' : 'Accepted Payment Methods'}</h2>
          <p className="text-white/50 font-light mb-12 max-w-xl mx-auto">
            {isArabic ? 'نحن نوفر لك خيارات دفع متعددة وسهلة لتناسب احتياجاتك، مع ضمان الخصوصية والأمان التام.' : 'We provide multiple easy and safe payment options to suit your needs, with guaranteed privacy and complete security.'}
          </p>
          
          <div className="flex flex-wrap justify-center gap-8 items-center bg-white/5 p-8 rounded-[2rem]">
            <div className="bg-white p-4 rounded-xl shadow-sm h-16 flex items-center text-brand-charcoal">
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-8" />
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm h-16 flex items-center text-brand-charcoal overflow-hidden w-24 justify-center">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" 
                alt="PayPal" 
                className="h-6 w-auto object-contain" 
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm h-16 flex items-center gap-3 text-brand-charcoal">
              <div className="w-10 h-10 rounded-full bg-brand-gold/20 flex items-center justify-center shadow-md">
                <HandCoins size={24} className="text-brand-gold" />
              </div>
              <span className="font-bold text-sm tracking-tight">{isArabic ? 'الدفع عند الاستلام' : 'Cash on Delivery'}</span>
            </div>
          </div>
        </motion.div>
      </div>

      <PaymentModal 
        isOpen={isPaymentModalOpen} 
        onClose={() => setIsPaymentModalOpen(false)} 
        total={appliedDiscount ? discountedTotal : totalPrice} 
      />
    </div>
  );
};

export default CartPage;
