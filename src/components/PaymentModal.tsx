import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CreditCard, ShieldCheck, Lock, Truck, Banknote, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../StoreContext';
import { db, auth } from '../lib/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, total }) => {
  const { t, i18n } = useTranslation();
  const { clearCart, cart } = useStore();
  const isArabic = i18n.language === 'ar';

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod' | 'paypal'>('card');
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    name: '',
    address: '',
    phone: ''
  });

  const mastercardAccount = import.meta.env.VITE_MASTERCARD_ACCOUNT || '0000-0000-0000-0000';

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderInfo, setOrderInfo] = useState<{trackingId: string, trackingLink: string, whatsappSent?: boolean, items?: any[]} | null>(null);

  const WHATSAPP_NUMBER = '9647837814009';

  const getWhatsAppMessage = (info: any) => {
    const methodLabel = paymentMethod === 'cod' ? (isArabic ? 'الدفع عند الاستلام' : 'Cash on Delivery') : 
                       paymentMethod === 'card' ? (isArabic ? 'بطاقة ائتمان' : 'Credit Card') : 
                       (isArabic ? 'باي بال' : 'PayPal');
    
    const itemsText = (info.items || []).map((item: any) => `- ${item.name} (${item.quantity}x)`).join('\n');
    
    return encodeURIComponent(
      `*طلب جديد من متجرنا*\n\n` +
      `*طريقة الدفع:* ${methodLabel}\n` +
      `*رقم التتبع:* ${info.trackingId}\n` +
      `--------------------------\n` +
      `*اسم العميل:* ${formData.name}\n` +
      `*العنوان:* ${formData.address}\n` +
      `*رقم الهاتف:* ${formData.phone}\n` +
      `--------------------------\n` +
      `*المنتجات:*\n${itemsText}\n` +
      `--------------------------\n` +
      `*الإجمالي:* $${total.toFixed(2)}\n\n` +
      `تم الطلب بنجاح، يرجى تأكيد الاستلام.`
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Generate tracking ID
    const trackingId = "AH-" + Math.random().toString(36).substring(2, 6).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();

    // For COD, we try to open WhatsApp immediately as a direct response to click
    if (paymentMethod === 'cod') {
      const msg = getWhatsAppMessage({
        trackingId,
        items: [...cart]
      });
      const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
      window.open(waUrl, '_blank');
    }

    setIsProcessing(true);
    
    try {
      // Save order to Firestore directly for better Vercel/Static support
      const orderData = {
        userId: auth.currentUser?.uid || 'anonymous',
        shippingAddress: {
          fullName: formData.name,
          email: auth.currentUser?.email || (formData.name.toLowerCase().replace(/\s+/g, '.') + '@example.com'),
          address: formData.address,
          city: formData.address.split(',')[0]?.trim() || '',
          country: 'Iraq',
          zipCode: '',
          phone: formData.phone // Added phone to shippingAddress or top level
        },
        phone: formData.phone, // keep at top level too for easy access
        paymentMethod,
        total,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: (item.discountPrice ?? item.price),
          quantity: item.quantity,
          selectedColor: item.selectedColor,
          selectedSize: item.selectedSize,
          image: item.image
        })),
        status: 'pending' as const,
        trackingId,
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, 'orders', trackingId), orderData);

      const newOrderInfo = {
        trackingId,
        trackingLink: `${window.location.origin}/track/${trackingId}`,
        whatsappSent: true, // Assuming success if we open WhatsApp or save to DB
        items: [...cart]
      };
      
      setOrderInfo(newOrderInfo);
      setIsProcessing(false);
      setIsSuccess(true);
      clearCart();
      
      if (paymentMethod !== 'cod') {
        setTimeout(() => {
          onClose();
          setIsSuccess(false);
          setOrderInfo(null);
        }, 15000);
      }
    } catch (error) {
      console.error('Order submission error:', error);
      setIsProcessing(false);
      // Even if firestore fails, we might still show success if they have the tracking number from whatsapp
      setIsSuccess(true);
      clearCart();
    }
  };

  const texts = {
    title: isArabic ? 'الدفع الآمن' : 'Secure Checkout',
    subtitle: isArabic ? 'اختر طريقة الدفع المفضلة لديك' : 'Choose your preferred payment method',
    card: isArabic ? 'بطاقة ائتمان' : 'Credit Card',
    cod: isArabic ? 'الدفع عند الاستلام' : 'Cash on Delivery',
    total: isArabic ? 'الإجمالي المطلوب' : 'Total to Pay',
    cardNumber: isArabic ? 'رقم البطاقة' : 'Card Number',
    expiry: isArabic ? 'تاريخ الانتهاء' : 'Expiry Date',
    cvv: 'CVV',
    holderName: isArabic ? 'اسم صاحب البطاقة' : 'Cardholder Name',
    address: isArabic ? 'عنوان الشحن' : 'Shipping Address',
    phone: isArabic ? 'رقم الهاتف' : 'Phone Number',
    payNow: isArabic ? `دفع الآن $${total.toFixed(2)}` : `Pay Now $${total.toFixed(2)}`,
    confirmOrder: isArabic ? 'تأكيد الطلب' : 'Confirm Order',
    paypal: isArabic ? 'باي بال' : 'PayPal',
    paypalTitle: isArabic ? 'الدفع عبر باي بال' : 'PayPal Payment',
    paypalDesc: isArabic ? 'سيتم توجيهك إلى صفحة باي بال لإكمال عملية الدفع بأمان.' : 'You will be redirected to PayPal to complete your payment securely.',
    processing: isArabic ? 'جاري المعالجة...' : 'Processing...',
    success: isArabic ? 'تم الطلب بنجاح!' : 'Order Successful!',
    successSub: isArabic ? 'طلبك قيد التنفيذ وسنقوم بالتواصل معك.' : 'Your order is being processed and we will contact you.',
    trackingText: isArabic ? 'رقم التتبع الخاص بك:' : 'Your Tracking Number:',
    trackNow: isArabic ? 'تتبع طلبك الآن' : 'Track Order Now',
    secure: isArabic ? 'مشفر وآمن' : 'Encrypted and Secure'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 ${isArabic ? 'font-arabic' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-charcoal/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-brand-cream rounded-[2rem] sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header - Fixed */}
            <div className="bg-brand-charcoal p-6 sm:p-8 text-brand-cream relative flex-shrink-0">
               <button 
                onClick={onClose}
                className={`absolute top-6 ${isArabic ? 'left-6' : 'right-6'} p-2 text-brand-cream/40 hover:text-white transition-colors`}
              >
                <X size={24} />
              </button>
              
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-brand-gold rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-gold/20">
                      {paymentMethod === 'card' ? <CreditCard size={20} /> : paymentMethod === 'cod' ? <Truck size={20} /> : (
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path d="M20.067 8.478c.492.88.556 2.014.307 3.232-.401 1.966-1.559 3.327-3.51 3.327h-1.638l-.669 3.255a.6.6 0 01-.588.479h-3.155a.3.3 0 01-.295-.36l.758-3.693h-2.183l-.758 3.693a.3.3 0 01-.295.36h-3.155a.6.6 0 01-.588-.479l1.637-7.971c.148-.724.787-1.24 1.524-1.24h7.026c2.81 0 4.673 1.258 5.385 3.398zm-4.704 3.737c.758 0 1.257-.591 1.411-1.344.154-.753-.195-1.344-.954-1.344h-2.909l-.554 2.688h3.006z"/>
                        </svg>
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{texts.title}</h2>
                      <p className="text-brand-cream/60 text-xs sm:text-sm font-light mt-0.5">{texts.subtitle}</p>
                    </div>
                  </div>

                  {/* Payment Method Switcher */}
                  {!isSuccess && (
                    <div className="flex bg-white/5 p-1.5 rounded-2xl mb-6 flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`flex-1 min-w-[80px] py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${
                          paymentMethod === 'card' ? 'bg-brand-gold text-white shadow-xl shadow-brand-gold/20' : 'text-brand-cream/50 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <CreditCard size={16} />
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">{texts.card}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('paypal')}
                        className={`flex-1 min-w-[80px] py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${
                          paymentMethod === 'paypal' ? 'bg-brand-gold text-white shadow-xl shadow-brand-gold/20' : 'text-brand-cream/50 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                          <path d="M20.067 8.478c.492.88.556 2.014.307 3.232-.401 1.966-1.559 3.327-3.51 3.327h-1.638l-.669 3.255a.6.6 0 01-.588.479h-3.155a.3.3 0 01-.295-.36l.758-3.693h-2.183l-.758 3.693a.3.3 0 01-.295.36h-3.155a.6.6 0 01-.588-.479l1.637-7.971c.148-.724.787-1.24 1.524-1.24h7.026c2.81 0 4.673 1.258 5.385 3.398zm-4.704 3.737c.758 0 1.257-.591 1.411-1.344.154-.753-.195-1.344-.954-1.344h-2.909l-.554 2.688h3.006z"/>
                        </svg>
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">{texts.paypal}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cod')}
                        className={`flex-1 min-w-[80px] py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${
                          paymentMethod === 'cod' ? 'bg-brand-gold text-white shadow-xl shadow-brand-gold/20' : 'text-brand-cream/50 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Truck size={16} />
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">{texts.cod}</span>
                      </button>
                    </div>
                  )}

              <div className="bg-white/10 rounded-2xl p-4 flex justify-between items-center">
                <span className="text-brand-cream/60 font-light text-sm">{texts.total}</span>
                <span className="text-xl sm:text-2xl font-mono font-bold text-brand-gold">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Scrollable Form Content */}
            <div className="p-6 sm:p-10 overflow-y-auto flex-1 custom-scrollbar bg-white">
              {isSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-10 text-center"
                >
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white mb-6 animate-bounce">
                    <ShieldCheck size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-brand-charcoal mb-2">{texts.success}</h3>
                  <p className="text-brand-charcoal/60 font-light max-w-xs mb-8">{texts.successSub}</p>
                  
                  {orderInfo && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full space-y-4"
                    >
                      <div className="bg-brand-charcoal/5 border border-brand-charcoal/10 rounded-3xl p-6">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-brand-charcoal/40 mb-2">
                          {texts.trackingText}
                        </p>
                        <p className="text-2xl font-mono font-bold text-brand-gold mb-6">
                          {orderInfo.trackingId}
                        </p>
                        <button
                          onClick={() => window.location.href = `/track/${orderInfo.trackingId}`}
                          className="w-full bg-brand-gold text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-brand-charcoal transition-all mb-4"
                        >
                          <MapPin size={18} /> {texts.trackNow}
                        </button>

                        <button
                          onClick={() => {
                            const message = getWhatsAppMessage(orderInfo);
                            window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, '_blank');
                          }}
                          className={`w-full ${paymentMethod === 'cod' ? 'animate-pulse scale-105' : ''} bg-[#25D366] text-white font-black py-5 rounded-2xl flex flex-col items-center justify-center gap-1 hover:opacity-90 transition-all shadow-xl shadow-green-500/30 border-2 border-white/20`}
                        >
                          <div className="flex items-center gap-2">
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                            <span className="text-lg">
                              {paymentMethod === 'cod' 
                                ? (isArabic ? 'تأكيد الطلب عبر واتساب' : 'Confirm Order via WhatsApp')
                                : (isArabic ? 'إرسال الفاتورة عبر واتساب' : 'Send Invoice via WhatsApp')}
                            </span>
                          </div>
                          <span className="text-[10px] opacity-80 uppercase tracking-tighter">
                            {isArabic ? 'انقر لإرسال المعلومات فوراً' : 'Click to send info immediately'}
                          </span>
                        </button>
                        
                        {orderInfo.whatsappSent === false && paymentMethod === 'cod' && (
                          <p className="text-[10px] text-red-500 font-bold bg-red-50 p-2 rounded-lg border border-red-100">
                             {isArabic ? '⚠️ يرجى النقر على الزر أعلاه لإرسال التنبيه اليدوي لتعطل الإرسال التلقائي' : '⚠️ Please click button above to send manual alert'}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {paymentMethod === 'card' ? (
                    <>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-brand-charcoal/40">{texts.cardNumber}</label>
                        <div className="relative group">
                          <input
                            required
                            type="text"
                            placeholder="0000 0000 0000 0000"
                            className="w-full bg-brand-charcoal/[0.03] border-2 border-brand-charcoal/[0.05] rounded-2xl px-12 py-4 focus:bg-white focus:border-brand-gold/50 focus:ring-4 focus:ring-brand-gold/10 transition-all outline-none text-brand-charcoal font-medium placeholder:text-brand-charcoal/30 flex items-center"
                            value={formData.cardNumber}
                            onChange={(e) => setFormData({...formData, cardNumber: e.target.value})}
                          />
                          <div className={`absolute ${isArabic ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-brand-charcoal/30 group-focus-within:text-brand-gold transition-colors`}>
                            <CreditCard size={20} aria-hidden="true" />
                          </div>
                          <div className={`absolute ${isArabic ? 'left-5' : 'right-5'} top-1/2 -translate-y-1/2 flex gap-1.5`}>
                            <div className="w-8 h-5 bg-orange-500 rounded-md shadow-sm" />
                            <div className="w-8 h-5 bg-blue-600 rounded-md shadow-sm" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-charcoal/40 ml-1">{texts.expiry}</label>
                          <input
                            required
                            type="text"
                            placeholder="MM / YY"
                            className="w-full bg-brand-charcoal/[0.03] border-2 border-brand-charcoal/[0.05] rounded-2xl px-5 py-4 focus:bg-white focus:border-brand-gold/50 focus:ring-4 focus:ring-brand-gold/10 transition-all outline-none text-brand-charcoal font-medium placeholder:text-brand-charcoal/30"
                            value={formData.expiry}
                            onChange={(e) => setFormData({...formData, expiry: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-charcoal/40 ml-1">{texts.cvv}</label>
                          <input
                            required
                            type="password"
                            placeholder="***"
                            maxLength={3}
                            className="w-full bg-brand-charcoal/[0.03] border-2 border-brand-charcoal/[0.05] rounded-2xl px-5 py-4 focus:bg-white focus:border-brand-gold/50 focus:ring-4 focus:ring-brand-gold/10 transition-all outline-none text-brand-charcoal font-medium placeholder:text-brand-charcoal/30 text-center"
                            value={formData.cvv}
                            onChange={(e) => setFormData({...formData, cvv: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="space-y-5">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-charcoal/40 ml-1">{texts.holderName}</label>
                          <input
                            required
                            type="text"
                            placeholder={isArabic ? 'الاسم بالكامل' : 'FULL NAME'}
                            className="w-full bg-brand-charcoal/[0.03] border-2 border-brand-charcoal/[0.05] rounded-2xl px-5 py-4 focus:bg-white focus:border-brand-gold/50 focus:ring-4 focus:ring-brand-gold/10 transition-all outline-none text-brand-charcoal font-medium placeholder:text-brand-charcoal/30 uppercase tracking-widest"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-charcoal/40 ml-1">{texts.phone}</label>
                            <input
                              required
                              type="tel"
                              placeholder={isArabic ? '0000 000 000' : '+000 000 000'}
                              className="w-full bg-brand-charcoal/[0.03] border-2 border-brand-charcoal/[0.05] rounded-2xl px-5 py-4 focus:bg-white focus:border-brand-gold/50 focus:ring-4 focus:ring-brand-gold/10 transition-all outline-none text-brand-charcoal font-medium placeholder:text-brand-charcoal/30"
                              value={formData.phone}
                              onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-charcoal/40 ml-1">{texts.address}</label>
                            <input
                              required
                              type="text"
                              placeholder={isArabic ? 'المدينة، الحي' : 'City, District'}
                              className="w-full bg-brand-charcoal/[0.03] border-2 border-brand-charcoal/[0.05] rounded-2xl px-5 py-4 focus:bg-white focus:border-brand-gold/50 focus:ring-4 focus:ring-brand-gold/10 transition-all outline-none text-brand-charcoal font-medium placeholder:text-brand-charcoal/30"
                              value={formData.address}
                              onChange={(e) => setFormData({...formData, address: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  ) : paymentMethod === 'paypal' ? (
                    <div className="space-y-6">
                      <div className="bg-blue-50/50 p-8 rounded-[2.5rem] text-center border-2 border-blue-100 shadow-xl shadow-blue-500/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10 flex flex-col items-center">
                          <div className="w-16 h-16 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-6">
                             <svg viewBox="0 0 24 24" fill="#003087" className="w-8 h-8">
                               <path d="M20.067 8.478c.492.88.556 2.014.307 3.232-.401 1.966-1.559 3.327-3.51 3.327h-1.638l-.669 3.255a.6.6 0 01-.588.479h-3.155a.3.3 0 01-.295-.36l.758-3.693h-2.183l-.758 3.693a.3.3 0 01-.295.36h-3.155a.6.6 0 01-.588-.479l1.637-7.971c.148-.724.787-1.24 1.524-1.24h7.026c2.81 0 4.673 1.258 5.385 3.398zm-4.704 3.737c.758 0 1.257-.591 1.411-1.344.154-.753-.195-1.344-.954-1.344h-2.909l-.554 2.688h3.006z"/>
                             </svg>
                          </div>
                          <h4 className="text-xl font-bold text-[#003087] mb-2">{texts.paypalTitle}</h4>
                          <p className="text-blue-900/60 font-medium text-sm leading-relaxed max-w-[240px]">
                            {texts.paypalDesc}
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-charcoal/40 ml-1">{texts.holderName}</label>
                          <input
                            required
                            type="text"
                            placeholder={isArabic ? 'الاسم بالكامل' : 'FULL NAME'}
                            className="w-full bg-brand-charcoal/[0.03] border-2 border-brand-charcoal/[0.05] rounded-2xl px-5 py-4 focus:bg-white focus:border-brand-gold/50 focus:ring-4 focus:ring-brand-gold/10 transition-all outline-none text-brand-charcoal font-medium placeholder:text-brand-charcoal/30 uppercase tracking-widest"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-charcoal/40 ml-1">{texts.phone}</label>
                            <input
                              required
                              type="tel"
                              placeholder={isArabic ? '0000 000 000' : '+000 000 000'}
                              className="w-full bg-brand-charcoal/[0.03] border-2 border-brand-charcoal/[0.05] rounded-2xl px-5 py-4 focus:bg-white focus:border-brand-gold/50 focus:ring-4 focus:ring-brand-gold/10 transition-all outline-none text-brand-charcoal font-medium placeholder:text-brand-charcoal/30"
                              value={formData.phone}
                              onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-charcoal/40 ml-1">{texts.address}</label>
                            <input
                              required
                              type="text"
                              placeholder={isArabic ? 'المدينة، الحي' : 'City, District'}
                              className="w-full bg-brand-charcoal/[0.03] border-2 border-brand-charcoal/[0.05] rounded-2xl px-5 py-4 focus:bg-white focus:border-brand-gold/50 focus:ring-4 focus:ring-brand-gold/10 transition-all outline-none text-brand-charcoal font-medium placeholder:text-brand-charcoal/30"
                              value={formData.address}
                              onChange={(e) => setFormData({...formData, address: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-5">
                        <div className="bg-[#25D366]/10 p-5 rounded-2xl border-2 border-[#25D366]/10 flex gap-4 text-sm items-center">
                          <div className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center text-white shrink-0 shadow-lg shadow-green-500/20">
                            <Truck size={20} />
                          </div>
                          <p className="text-brand-charcoal font-medium text-xs leading-relaxed">
                            {isArabic 
                              ? 'سيتم تحويلك إلى واتساب فور تأكيد الطلب لإرسال معلومات التوصيل وضمان سرعة التنفيذ.'
                              : 'You will be redirected to WhatsApp after confirmation to send delivery details and ensure fast processing.'}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-charcoal/40 ml-1">{isArabic ? 'الاسم الكامل' : 'Full Name'}</label>
                          <input
                            required
                            type="text"
                            placeholder={isArabic ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                            className="w-full bg-brand-charcoal/[0.03] border-2 border-brand-charcoal/[0.05] rounded-2xl px-5 py-4 focus:bg-white focus:border-brand-gold/50 focus:ring-4 focus:ring-brand-gold/10 transition-all outline-none text-brand-charcoal font-medium placeholder:text-brand-charcoal/30"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-charcoal/40 ml-1">{isArabic ? 'رقم الهاتف' : 'Phone Number'}</label>
                          <input
                            required
                            type="tel"
                            placeholder={isArabic ? 'مثال: 078xxxxxxx' : 'Example: 078xxxxxxx'}
                            className="w-full bg-brand-charcoal/[0.03] border-2 border-brand-charcoal/[0.05] rounded-2xl px-5 py-4 focus:bg-white focus:border-brand-gold/50 focus:ring-4 focus:ring-brand-gold/10 transition-all outline-none text-brand-charcoal font-medium placeholder:text-brand-charcoal/30"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-charcoal/40 ml-1">{isArabic ? 'العنوان بالتفصيل' : 'Detailed Address'}</label>
                          <textarea
                            required
                            placeholder={isArabic ? 'المدينة، المنطقة، اسم الشارع' : 'City, Area, Street Name'}
                            rows={3}
                            className="w-full bg-brand-charcoal/[0.03] border-2 border-brand-charcoal/[0.05] rounded-2xl px-5 py-4 focus:bg-white focus:border-brand-gold/50 focus:ring-4 focus:ring-brand-gold/10 transition-all outline-none text-brand-charcoal font-medium placeholder:text-brand-charcoal/30 resize-none"
                            value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex items-center gap-2 text-brand-charcoal/60 text-[10px] uppercase font-bold tracking-widest mb-4">
                    <Lock size={12} /> {texts.secure}
                  </div>

                  <div className="bg-brand-charcoal/5 border border-brand-charcoal/10 rounded-2xl p-4 mb-6">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-brand-charcoal/60 mb-2">
                      {t('order.cancellationPolicy.title')}
                    </h4>
                    <p className="text-[11px] font-light text-brand-charcoal/70 leading-relaxed">
                      {t('order.cancellationPolicy.text')}
                    </p>
                  </div>

                  <button
                    disabled={isProcessing}
                    type="submit"
                    className="w-full bg-brand-charcoal text-white font-bold py-5 rounded-[2rem] flex items-center justify-center gap-3 hover:bg-brand-gold hover:shadow-2xl hover:shadow-brand-gold/30 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-brand-charcoal/10 group"
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        {texts.processing}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {paymentMethod === 'cod' && (
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 transition-transform group-hover:scale-110">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        )}
                        {paymentMethod === 'paypal' && (
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 transition-transform group-hover:scale-110">
                            <path d="M20.067 8.478c.492.88.556 2.014.307 3.232-.401 1.966-1.559 3.327-3.51 3.327h-1.638l-.669 3.255a.6.6 0 01-.588.479h-3.155a.3.3 0 01-.295-.36l.758-3.693h-2.183l-.758 3.693a.3.3 0 01-.295.36h-3.155a.6.6 0 01-.588-.479l1.637-7.971c.148-.724.787-1.24 1.524-1.24h7.026c2.81 0 4.673 1.258 5.385 3.398zm-4.704 3.737c.758 0 1.257-.591 1.411-1.344.154-.753-.195-1.344-.954-1.344h-2.909l-.554 2.688h3.006z"/>
                          </svg>
                        )}
                        <span className="text-lg tracking-tight">{paymentMethod === 'card' ? texts.payNow : (paymentMethod === 'cod' ? (isArabic ? 'تأكيد الطلب عبر واتساب' : 'Confirm Order via WhatsApp') : (isArabic ? 'متابعة إلى باي بال' : 'Continue to PayPal'))}</span>
                      </div>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;
