import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CreditCard, ShieldCheck, Lock, Truck, MapPin, Globe, Banknote } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../StoreContext';
import { db, auth } from '../lib/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import StripePayment from './StripePayment';

const countries = [
  { code: 'IQ', name: 'Iraq', nameAr: 'العراق', dialCode: '+964' },
  { code: 'SA', name: 'Saudi Arabia', nameAr: 'المملكة العربية السعودية', dialCode: '+966' },
  { code: 'AE', name: 'United Arab Emirates', nameAr: 'الإمارات العربية المتحدة', dialCode: '+971' },
  { code: 'JO', name: 'Jordan', nameAr: 'الأردن', dialCode: '+962' },
  { code: 'EG', name: 'Egypt', nameAr: 'مصر', dialCode: '+20' },
  { code: 'KW', name: 'Kuwait', nameAr: 'الكويت', dialCode: '+965' },
  { code: 'QA', name: 'Qatar', nameAr: 'قطر', dialCode: '+974' },
  { code: 'BH', name: 'Bahrain', nameAr: 'البحرين', dialCode: '+973' },
  { code: 'OM', name: 'Oman', nameAr: 'عمان', dialCode: '+968' },
  { code: 'US', name: 'United States', nameAr: 'الولايات المتحدة', dialCode: '+1' },
  { code: 'GB', name: 'United Kingdom', nameAr: 'المملكة المتحدة', dialCode: '+44' },
];

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
}

const COUNTRY_ADJUSTMENT_LOCAL: Record<string, number> = {
  'IQ': 0.5,
  'SA': 1.2,
  'AE': 1.1,
  'JO': 1.0,
  'US': 2.5,
  'DEFAULT': 1.5
};

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, total }) => {
  const { t, i18n } = useTranslation();
  const { clearCart, cart } = useStore();
  const isArabic = i18n.language === 'ar';

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod' | 'paypal' | 'wallet'>('wallet');
  const [selectedWallet, setSelectedWallet] = useState<'zaincash' | 'asiahawala' | 'mastercard'>('zaincash');
  const [selectedCountry, setSelectedCountry] = useState('IQ');
  const [phonePrefix, setPhonePrefix] = useState('+964');
  const [shippingProviders, setShippingProviders] = useState<any[]>([]);
  const [selectedProvider, setSelectedProvider] = useState('aramex');
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingSpeed, setShippingSpeed] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    city: '',
    email: ''
  });

  useEffect(() => {
    // Fetch available providers once
    fetch('/api/shipping-providers')
      .then(res => res.json())
      .then(data => setShippingProviders(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Update phone prefix and default provider when country changes
    const country = countries.find(c => c.code === selectedCountry);
    if (country) {
      setPhonePrefix(country.dialCode);
      if (selectedCountry === 'IQ') {
        setSelectedProvider('al-waseet');
      } else {
        setSelectedProvider('standard');
      }
    }
  }, [selectedCountry]);

  useEffect(() => {
    // Fetch shipping rate based on country and provider
    fetch(`/api/shipping-rate?country=${selectedCountry}&provider=${selectedProvider}`)
      .then(res => res.json())
      .then(data => {
        setShippingFee(data.rate);
        setShippingSpeed(data.speed);
      })
      .catch(() => setShippingFee(20)); // Fallback
  }, [selectedCountry, selectedProvider]);

  const fullPhoneNumber = `${phonePrefix} ${formData.phone}`;

  const finalTotal = total + shippingFee;

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderInfo, setOrderInfo] = useState<{trackingId: string, trackingLink: string, whatsappSent?: boolean, items?: any[]} | null>(null);

  const WHATSAPP_NUMBER = '9647837814009';

  const getWhatsAppMessage = (info: any) => {
    const methodLabel = paymentMethod === 'cod' ? (isArabic ? 'الدفع عند الاستلام 🚚' : 'Cash on Delivery 🚚') : 
                       paymentMethod === 'card' ? (isArabic ? 'تم الدفع بالبطاقة ✅' : 'Paid by Card ✅') : 
                       paymentMethod === 'wallet' ? (isArabic ? `تحويل محفظة (${selectedWallet === 'zaincash' ? 'زين كاش' : 'آسيا حوالة'}) 📱` : `Wallet Transfer (${selectedWallet === 'zaincash' ? 'ZainCash' : 'AsiaHawala'}) 📱`) :
                       (isArabic ? 'باي بال 💰' : 'PayPal 💰');
    
    // Formatting items with price
    const itemsText = (info.items || []).map((item: any) => 
      `▫️ ${item.name} (${item.quantity}x) - $${((item.discountPrice ?? item.price) * item.quantity).toFixed(2)}`
    ).join('\n');
    
    return encodeURIComponent(
      `🛍️ *طلب جديد من المتجر: ${info.trackingId}*\n\n` +
      `👤 *معلومات العميل:*\n` +
      `• الاسم: ${formData.name}\n` +
      `• الهاتف: ${fullPhoneNumber}\n` +
      `• البريد: ${formData.email || 'N/A'}\n\n` +
      `📍 *العنوان:* \n${countries.find(c => c.code === selectedCountry)?.name || selectedCountry} - ${formData.address}\n\n` +
      `📦 *المنتجات:*\n${itemsText}\n\n` +
      `💳 *طريقة الدفع:* ${methodLabel}\n` +
      `🚚 *شركة الشحن:* ${shippingProviders.find(p => p.id === selectedProvider)?.name || selectedProvider}\n` +
      `--------------------------\n` +
      `💰 *المجموع:* $${total.toFixed(2)}\n` +
      `🚚 *الشحن:* $${shippingFee.toFixed(2)}\n` +
      `✨ *الإجمالي:* $${(total + shippingFee).toFixed(2)}\n` +
      `--------------------------\n` +
      `🔗 *رابط التتبع:* ${info.trackingLink}\n` +
      `⏰ *التاريخ:* ${new Date().toLocaleString()}`
    );
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!formData.name || !formData.address || !formData.phone) {
      alert(isArabic ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }

    setIsProcessing(true);
    
    const trackingId = "AH-" + Math.random().toString(36).substring(2, 6).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();

    try {
      const orderData = {
        userId: auth.currentUser?.uid || 'anonymous',
        shippingAddress: {
          fullName: formData.name,
          email: formData.email || auth.currentUser?.email || (formData.name.toLowerCase().replace(/\s+/g, '.') + '@example.com'),
          address: formData.address,
          city: formData.city || formData.address.split(',')[0]?.trim() || '',
          country: countries.find(c => c.code === selectedCountry)?.name || selectedCountry,
          zipCode: '',
          phone: fullPhoneNumber
        },
        phone: fullPhoneNumber,
        paymentMethod,
        walletProvider: paymentMethod === 'wallet' ? selectedWallet : null,
        shippingProvider: selectedProvider,
        shippingSpeed,
        total: finalTotal,
        subtotal: total,
        shippingFee,
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
        whatsappSent: true,
        items: [...cart]
      };
      
      // Send detailed WhatsApp notification
      const msg = getWhatsAppMessage(newOrderInfo);
      const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
      window.open(waUrl, '_blank');

      setOrderInfo(newOrderInfo);
      setIsProcessing(false);
      setIsSuccess(true);
      clearCart();
    } catch (error) {
      console.error('Order submission error:', error);
      setIsProcessing(false);
      alert(isArabic ? 'حدث خطأ أثناء معالجة الطلب' : 'Error processing order');
    }
  };

  const texts = {
    title: isArabic ? 'الدفع الآمن' : 'Secure Checkout',
    subtitle: isArabic ? 'حدد الدولة وطريقة الدفع' : 'Select country and payment method',
    card: isArabic ? 'بطاقة ائتمان' : 'Credit Card',
    cod: isArabic ? 'الدفع عند الاستلام' : 'Cash on Delivery',
    total: isArabic ? 'الإجمالي المطلوب' : 'Total to Pay',
    address: isArabic ? 'عنوان الشحن' : 'Shipping Address',
    phone: isArabic ? 'رقم الهاتف' : 'Phone Number',
    confirmOrder: isArabic ? 'تأكيد الطلب' : 'Confirm Order',
    paypal: isArabic ? 'باي بال' : 'PayPal',
    processing: isArabic ? 'جاري المعالجة...' : 'Processing...',
    success: isArabic ? 'تم الطلب بنجاح!' : 'Order Successful!',
    successSub: isArabic ? 'طلبك قيد التنفيذ وسنقوم بالتواصل معك.' : 'Your order is being processed and we will contact you.',
    trackingText: isArabic ? 'رقم التتبع الخاص بك:' : 'Your Tracking Number:',
    trackNow: isArabic ? 'تتبع طلبك الآن' : 'Track Order Now',
    secure: isArabic ? 'مشفر وآمن' : 'Encrypted and Secure',
    wallet: isArabic ? 'محفظة إلكترونية' : 'E-Wallet'
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
            className="relative w-full max-w-lg bg-brand-cream rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="bg-brand-charcoal p-6 sm:p-8 text-brand-cream flex-shrink-0">
              <button 
                onClick={onClose}
                className={`absolute top-6 ${isArabic ? 'left-6' : 'right-6'} p-2 text-brand-cream/40 hover:text-white transition-colors`}
              >
                <X size={24} />
              </button>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-brand-gold rounded-2xl flex items-center justify-center text-white">
                  <Lock size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{texts.title}</h2>
                  <p className="text-brand-cream/60 text-xs">{texts.subtitle}</p>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-white/10 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center text-xs text-brand-cream/60">
                   <span>{isArabic ? 'المجموع الفرعي' : 'Subtotal'}</span>
                   <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-brand-cream/60">
                   <span>{isArabic ? 'الشحن الدولي' : 'Shipping Fee'}</span>
                   <span>${shippingFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <span className="text-brand-cream/80 font-medium text-sm">{texts.total}</span>
                  <span className="text-xl font-mono font-bold text-brand-gold">${finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-10 overflow-y-auto flex-1 bg-white">
              {isSuccess ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white mb-6 shadow-xl shadow-green-100">
                    <ShieldCheck size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-brand-charcoal mb-2">{texts.success}</h3>
                  <p className="text-brand-charcoal/60 text-sm mb-10 max-w-xs leading-relaxed">{texts.successSub}</p>
                  
                  {orderInfo && (
                    <div className="w-full bg-brand-charcoal/5 border-2 border-dashed border-brand-charcoal/10 rounded-3xl p-8">
                       <div className="flex items-center justify-center gap-2 mb-4 bg-brand-gold/10 py-2 px-4 rounded-full w-fit mx-auto">
                        <ShieldCheck size={14} className="text-brand-gold" />
                        <span className="text-[10px] font-bold text-brand-gold uppercase tracking-widest">
                          {isArabic ? 'تتم المعالجة عبر شبكة الموردين العالمية ✅' : 'Processed via Global Supplier Network ✅'}
                        </span>
                      </div>
                      <p className="text-[10px] uppercase font-black tracking-widest text-brand-charcoal/30 mb-2">{texts.trackingText}</p>
                      <p className="text-3xl font-mono font-bold text-brand-gold mb-8 tracking-tighter">{orderInfo.trackingId}</p>
                      <button
                        onClick={() => window.location.href = `/track/${orderInfo.trackingId}`}
                        className="w-full bg-brand-charcoal text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-brand-gold transition-all shadow-lg active:scale-95"
                      >
                        <MapPin size={18} /> {texts.trackNow}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Payment Selection Toggles */}
                  <div className="flex bg-brand-charcoal/[0.03] p-1.5 rounded-2xl gap-1.5 border border-brand-charcoal/5 overflow-x-auto no-scrollbar">
                    {(['card', 'cod', 'wallet', 'paypal'] as const).map((method) => (
                      <button
                        key={method}
                        onClick={() => setPaymentMethod(method)}
                        className={`min-w-[80px] flex-1 py-4 rounded-xl flex flex-col items-center justify-center gap-1 transition-all border-2 ${
                          paymentMethod === method 
                            ? 'bg-brand-charcoal text-white border-brand-charcoal shadow-xl shadow-brand-charcoal/20 scale-[1.02]' 
                            : 'bg-white text-brand-charcoal/40 border-brand-charcoal/5 hover:border-brand-gold/30 hover:text-brand-gold'
                        }`}
                      >
                        {method === 'card' ? <CreditCard size={18} /> : 
                         method === 'cod' ? <Truck size={18} /> : 
                         method === 'wallet' ? <Globe size={18} /> : 
                         <Banknote size={18} />}
                        <span className="text-[7px] font-black uppercase tracking-[0.1em] whitespace-nowrap">{texts[method as keyof typeof texts]}</span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-6">
                    {/* Customer Information Section */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold flex items-center gap-2">
                        <MapPin size={12} /> {isArabic ? 'معلومات الشحن' : 'Shipping Info'}
                      </h4>
                      
                      <div className="space-y-4">
                        {/* Country Selection */}
                        <div className="relative group">
                          <label className="absolute -top-2 left-6 px-2 bg-white text-[9px] font-black uppercase text-brand-charcoal/40 z-10">{isArabic ? 'الدولة' : 'Country'}</label>
                          <select
                            value={selectedCountry}
                            onChange={(e) => setSelectedCountry(e.target.value)}
                            className="w-full bg-white border-2 border-brand-charcoal/10 rounded-2xl px-12 py-5 focus:border-brand-gold outline-none text-brand-charcoal font-bold appearance-none transition-all shadow-sm"
                          >
                            {countries.map(c => (
                              <option key={c.code} value={c.code}>{isArabic ? c.nameAr : c.name}</option>
                            ))}
                          </select>
                          <Globe size={20} className={`absolute ${isArabic ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-brand-gold`} />
                        </div>

                        {/* Shipping Provider Selection */}
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gold">{isArabic ? 'شركة الشحن' : 'Shipping Provider'}</label>
                          <div className="grid grid-cols-1 gap-2">
                            {shippingProviders
                              .filter(p => {
                                if (selectedCountry === 'IQ') return true; // Show all for Iraq including Al-Waseet
                                return p.id !== 'al-waseet'; // Hide Al-Waseet for other countries
                              })
                              .map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => setSelectedProvider(p.id)}
                                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                                  selectedProvider === p.id 
                                    ? 'border-brand-gold bg-brand-gold/5 shadow-sm' 
                                    : 'border-brand-charcoal/5 hover:border-brand-charcoal/10'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${selectedProvider === p.id ? 'bg-brand-gold text-white' : 'bg-brand-charcoal/5 text-brand-charcoal/40'}`}>
                                    <Truck size={14} />
                                  </div>
                                  <div className={isArabic ? 'text-right' : 'text-left'}>
                                    <span className="block text-sm font-bold text-brand-charcoal">{p.name}</span>
                                    <span className="block text-[10px] text-brand-charcoal/40 font-medium">{isArabic ? `توصيل خلال: ${p.speed}` : `Delivery: ${p.speed}`}</span>
                                  </div>
                                </div>
                                <div className={`text-sm font-bold ${selectedProvider === p.id ? 'text-brand-gold' : 'text-brand-charcoal/60'}`}>
                                  ${(Math.round(p.base * (COUNTRY_ADJUSTMENT_LOCAL[selectedCountry] || 1.5))).toFixed(2)}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Name Input */}
                        <div className="relative">
                          <label className="absolute -top-2 left-6 px-2 bg-white text-[9px] font-black uppercase text-brand-gold z-10">{isArabic ? 'الاسم بالكامل' : 'Full Name'}</label>
                          <input
                            required
                            type="text"
                            placeholder="John Doe"
                            className="w-full bg-brand-charcoal/[0.02] border-2 border-brand-charcoal/10 rounded-2xl px-6 py-5 focus:bg-white focus:border-brand-gold outline-none text-brand-charcoal font-bold transition-all shadow-sm"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                          />
                        </div>

                        {/* Contact Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="relative">
                            <label className="absolute -top-2 left-6 px-2 bg-white text-[9px] font-black uppercase text-brand-gold z-10">{isArabic ? 'رقم الهاتف' : 'Phone'}</label>
                            <div className="flex bg-brand-charcoal/[0.02] border-2 border-brand-charcoal/10 rounded-2xl overflow-hidden focus-within:bg-white focus-within:border-brand-gold transition-all shadow-sm">
                              <select
                                value={phonePrefix}
                                onChange={(e) => setPhonePrefix(e.target.value)}
                                className="bg-transparent border-none pl-4 pr-1 py-5 text-sm font-bold text-brand-charcoal outline-none cursor-pointer appearance-none"
                                style={{ width: '80px' }}
                              >
                                {countries.map(c => (
                                  <option key={c.code} value={c.dialCode}>{c.dialCode} ({c.code})</option>
                                ))}
                              </select>
                              <div className="w-[1px] h-6 bg-brand-charcoal/10 self-center" />
                              <input
                                required
                                type="tel"
                                placeholder="770 000 0000"
                                className="flex-1 bg-transparent border-none px-4 py-5 outline-none text-brand-charcoal font-bold"
                                value={formData.phone}
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                              />
                            </div>
                          </div>
                          <div className="relative">
                            <label className="absolute -top-2 left-6 px-2 bg-white text-[9px] font-black uppercase text-brand-gold z-10">{isArabic ? 'البريد (اختياري)' : 'Email'}</label>
                            <input
                              type="email"
                              placeholder="email@example.com"
                              className="w-full bg-brand-charcoal/[0.02] border-2 border-brand-charcoal/10 rounded-2xl px-6 py-5 focus:bg-white focus:border-brand-gold outline-none text-brand-charcoal font-bold transition-all shadow-sm"
                              value={formData.email}
                              onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                          </div>
                        </div>

                        {/* Detailed Address Section */}
                        <div className="relative">
                          <label className="absolute -top-2 left-6 px-2 bg-white text-[9px] font-black uppercase text-brand-gold z-10">{isArabic ? 'العنوان بالتفصيل' : 'Detailed Address'}</label>
                          <textarea
                            required
                            rows={2}
                            placeholder={isArabic ? 'المنطقة، الزقاق، المعالم القريبة...' : 'District, Street, Landmarks...'}
                            className="w-full bg-brand-charcoal/[0.02] border-2 border-brand-charcoal/10 rounded-2xl px-6 py-5 focus:bg-white focus:border-brand-gold outline-none text-brand-charcoal font-bold transition-all shadow-sm resize-none"
                            value={formData.address}
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Global Fulfillment Trust Badge */}
                    <div className="bg-brand-charcoal/[0.02] p-4 rounded-2xl border border-brand-charcoal/5 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-gold/10 flex items-center justify-center flex-shrink-0">
                        <Globe size={14} className="text-brand-gold" />
                      </div>
                      <div className={isArabic ? 'text-right' : 'text-left'}>
                        <p className="text-[10px] font-bold text-brand-charcoal uppercase tracking-tighter">
                          {isArabic ? 'نظام شحن عالمي ذكي' : 'Smart Global Fulfillment'}
                        </p>
                        <p className="text-[9px] text-brand-charcoal/50 leading-relaxed">
                          {isArabic 
                            ? 'يتم معالجة طلبك تلقائياً عبر أكبر شبكة موردين عالمية لضمان الجودة وأفضل سعر شحن مباشر.' 
                            : 'Your order is automatically processed through a global supplier network to ensure quality and the best direct shipping rates.'}
                        </p>
                      </div>
                    </div>

                    {/* Payment Execution Section */}
                    <div className="pt-6 border-t border-brand-charcoal/5">
                      {paymentMethod === 'card' ? (
                        <div className="space-y-6">
                           <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold flex items-center gap-2 mb-4">
                             <CreditCard size={12} /> {isArabic ? 'بيانات البطاقة البنكية' : 'Card Details'}
                           </h4>
                           <div className="bg-brand-charcoal/[0.02] p-6 rounded-3xl border-2 border-brand-charcoal/5">
                            <StripePayment 
                              amount={finalTotal} 
                              onSuccess={() => handleSubmit()} 
                              onError={(err) => alert(err)} 
                              isArabic={isArabic}
                            />
                           </div>
                        </div>
                      ) : paymentMethod === 'wallet' ? (
                        <div className="space-y-6">
                           <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold flex items-center gap-2 mb-4">
                             <Globe size={12} /> {isArabic ? 'اختر المحفظة والتحويل' : 'Select Wallet & Transfer'}
                           </h4>
                           <div className="grid grid-cols-3 gap-2 mb-4">
                              <button 
                                onClick={() => setSelectedWallet('zaincash')}
                                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${selectedWallet === 'zaincash' ? 'border-[#ffcb05] bg-[#ffcb05]/20' : 'border-brand-charcoal/5 bg-white'}`}
                              >
                                <div className="w-9 h-9 rounded-full bg-[#ffcb05] flex items-center justify-center text-black font-black text-[11px] shadow-sm">ZC</div>
                                <div className="flex flex-col items-center">
                                  <span className="text-[10px] font-black text-brand-charcoal leading-tight">ZainCash</span>
                                  <span className="text-[8px] font-bold text-brand-charcoal/60 leading-tight">زين كاش</span>
                                </div>
                              </button>
                              <button 
                                onClick={() => setSelectedWallet('asiahawala')}
                                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${selectedWallet === 'asiahawala' ? 'border-[#ed1c24] bg-[#ed1c24]/20' : 'border-brand-charcoal/5 bg-white'}`}
                              >
                                <div className="w-9 h-9 rounded-full bg-[#ed1c24] flex items-center justify-center text-white font-black text-[11px] shadow-sm">AH</div>
                                <div className="flex flex-col items-center">
                                  <span className="text-[10px] font-black text-brand-charcoal leading-tight">AsiaHawala</span>
                                  <span className="text-[8px] font-bold text-brand-charcoal/60 leading-tight">آسيا حوالة</span>
                                </div>
                              </button>
                              <button 
                                onClick={() => setSelectedWallet('mastercard')}
                                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${selectedWallet === 'mastercard' ? 'border-brand-charcoal bg-brand-charcoal/10' : 'border-brand-charcoal/5 bg-white'}`}
                              >
                                <div className="w-9 h-9 rounded-full bg-brand-charcoal flex items-center justify-center text-white font-black text-[11px] shadow-sm">MC</div>
                                <div className="flex flex-col items-center">
                                  <span className="text-[10px] font-black text-brand-charcoal leading-tight">MasterCard</span>
                                  <span className="text-[8px] font-bold text-brand-charcoal/60 leading-tight">ماستركارد</span>
                                </div>
                              </button>
                           </div>

                           <div className="bg-brand-charcoal/5 p-6 rounded-3xl border border-brand-charcoal/10 text-center space-y-3">
                              <p className="text-xs text-brand-charcoal/60 leading-relaxed">
                                {isArabic 
                                  ? `يرجى تحويل مبلغ (${finalTotal.toFixed(2)}$) إلى ${selectedWallet === 'mastercard' ? 'رقم البطاقة' : 'الرقم'} التالي، ثم اضغط تأكيد السداد:` 
                                  : `Please transfer ($${finalTotal.toFixed(2)}) to the following ${selectedWallet === 'mastercard' ? 'Card Number' : 'Number'}, then verify:`}
                              </p>
                              <p className="text-xl font-mono font-black text-brand-charcoal tracking-widest bg-white py-3 rounded-xl border border-brand-charcoal/5">
                                {selectedWallet === 'zaincash' ? '07837814009' : 
                                 selectedWallet === 'mastercard' ? '7116787909' : 
                                 '078XXXXXXX'}
                              </p>
                              <p className="text-[9px] text-brand-gold font-bold uppercase">
                                {isArabic ? 'يرجى إرسال صورة التحويل عبر الواتساب بعد الطلب' : 'Please send transfer screenshot via WhatsApp after order'}
                              </p>
                           </div>

                           <button
                             disabled={isProcessing}
                             onClick={() => handleSubmit()}
                             type="button"
                             className="w-full bg-brand-charcoal text-white font-bold py-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-brand-gold shadow-2xl shadow-brand-charcoal/20 transition-all disabled:opacity-50 active:scale-95 group"
                           >
                             {isProcessing ? (
                               <span className="flex items-center gap-2">
                                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                  {texts.processing}
                               </span>
                             ) : (
                               <>
                                 <ShieldCheck className="group-hover:scale-110 transition-transform" />
                                 {texts.confirmOrder}
                               </>
                             )}
                           </button>
                        </div>
                      ) : (
                        <button
                          disabled={isProcessing}
                          onClick={() => handleSubmit()}
                          type="button"
                          className="w-full bg-brand-charcoal text-white font-bold py-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-brand-gold shadow-2xl shadow-brand-charcoal/20 transition-all disabled:opacity-50 active:scale-95 group"
                        >
                          {isProcessing ? (
                            <span className="flex items-center gap-2">
                               <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                               {texts.processing}
                            </span>
                          ) : (
                            <>
                              {paymentMethod === 'cod' ? <Truck className="group-hover:translate-x-1 transition-transform" /> : <Banknote />}
                              {texts.confirmOrder}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 bg-brand-charcoal/5 text-center flex items-center justify-center gap-2 text-[10px] text-brand-charcoal/40 uppercase font-black tracking-widest">
              <ShieldCheck size={12} /> {texts.secure}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;
