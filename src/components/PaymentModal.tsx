import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CreditCard, ShieldCheck, Lock, Truck, MapPin, Globe, Banknote } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../StoreContext';
import { useAlert } from '../contexts/AlertContext';
import { db, auth } from '../lib/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { SHIPPING_PROVIDERS } from '../constants';
import StripePayment from './StripePayment';

const countries = [
  { code: 'IQ', name: 'Iraq', nameAr: 'العراق', dialCode: '+964' },
  { code: 'SA', name: 'Saudi Arabia', nameAr: 'المملكة العربية السعودية', dialCode: '+966' },
  { code: 'AE', name: 'United Arab Emirates', nameAr: 'الإمارات العربية المتحدة', dialCode: '+971' },
  { code: 'TR', name: 'Turkey', nameAr: 'تركيا', dialCode: '+90' },
  { code: 'JO', name: 'Jordan', nameAr: 'الأردن', dialCode: '+962' },
  { code: 'EG', name: 'Egypt', nameAr: 'مصر', dialCode: '+20' },
  { code: 'KW', name: 'Kuwait', nameAr: 'الكويت', dialCode: '+965' },
  { code: 'QA', name: 'Qatar', nameAr: 'قطر', dialCode: '+974' },
  { code: 'BH', name: 'Bahrain', nameAr: 'البحرين', dialCode: '+973' },
  { code: 'OM', name: 'Oman', nameAr: 'عمان', dialCode: '+968' },
  { code: 'US', name: 'United States', nameAr: 'الولايات المتحدة', dialCode: '+1' },
  { code: 'CA', name: 'Canada', nameAr: 'كندا', dialCode: '+1' },
  { code: 'GB', name: 'United Kingdom', nameAr: 'المملكة المتحدة', dialCode: '+44' },
  { code: 'DE', name: 'Germany', nameAr: 'ألمانيا', dialCode: '+49' },
  { code: 'FR', name: 'France', nameAr: 'فرنسا', dialCode: '+33' },
  { code: 'AU', name: 'Australia', nameAr: 'أستراليا', dialCode: '+61' },
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
  'CA': 2.5,
  'GB': 2.0,
  'DE': 2.2,
  'FR': 2.2,
  'TR': 1.0,
  'AU': 3.0,
  'DEFAULT': 1.5
};

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, total }) => {
  const { t, i18n } = useTranslation();
  const { clearCart, cart } = useStore();
  const { showAlert } = useAlert();
  const isArabic = i18n.language === 'ar';

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod' | 'applepay' | 'wallet' | 'bank' | 'payoneer' | 'qicard'>('card');
  const [selectedWallet, setSelectedWallet] = useState<'zaincash' | 'asiahawala' | 'wallet' | 'nass' | 'fast' | 'bank'>('zaincash');
  const [selectedCountry, setSelectedCountry] = useState('SA'); // Default to SA for better payment coverage
  const [phonePrefix, setPhonePrefix] = useState('+966');
  const [shippingProviders, setShippingProviders] = useState<any[]>(SHIPPING_PROVIDERS);
  const [selectedProvider, setSelectedProvider] = useState('standard');
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
  const [orderInfo, setOrderInfo] = useState<{
    trackingId: string;
    trackingLink: string;
    cardholderName?: string;
    whatsappSent?: boolean;
    items?: any[];
  } | null>(null);

  const WHATSAPP_NUMBER = '9647837814009';

  const getWhatsAppMessage = (info: any) => {
    const methodLabel = paymentMethod === 'cod' ? (isArabic ? 'الدفع عند الاستلام (افحص واستلم) 🤝' : 'Cash on Delivery (Check & Collect) 🤝') : 
                       paymentMethod === 'card' ? t('checkout.card') : 
                       paymentMethod === 'qicard' ? (isArabic ? 'كي كارد 💳' : 'Qi Card 💳') :
                       paymentMethod === 'wallet' ? (isArabic ? `تحويل محفظة (${selectedWallet === 'zaincash' ? 'زين كاش' : selectedWallet === 'asiahawala' ? 'آسيا حوالة' : selectedWallet === 'nass' ? 'نص باي' : selectedWallet === 'fast' ? 'فاست باي' : 'محفظة'}) 📱` : `Wallet Transfer (${selectedWallet === 'zaincash' ? 'ZainCash' : selectedWallet === 'asiahawala' ? 'AsiaHawala' : selectedWallet === 'nass' ? 'NassPay' : selectedWallet === 'fast' ? 'FastPay' : 'Wallet'}) 📱`) :
                       paymentMethod === 'bank' ? t('checkout.bank') :
                       paymentMethod === 'payoneer' ? 'Payoneer 💳' :
                       t('checkout.paypal');
    
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

  const handleSubmit = async (e?: React.FormEvent, cardholderName?: string) => {
    if (e) e.preventDefault();

    if (!formData.name || !formData.address || !formData.phone) {
      showAlert(isArabic ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
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
        cardholderName: cardholderName || null,
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

      try {
        await setDoc(doc(db, 'orders', trackingId), orderData);
      } catch (error) {
        const { handleFirestoreError, OperationType } = await import('../lib/firebase');
        handleFirestoreError(error, OperationType.WRITE, `orders/${trackingId}`);
      }

      const newOrderInfo = {
        trackingId,
        trackingLink: `${window.location.origin}/track/${trackingId}`,
        whatsappSent: true,
        items: [...cart],
        cardholderName: cardholderName
      };
      
      // Send detailed WhatsApp notification
      const msg = getWhatsAppMessage(newOrderInfo);
      const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
      window.open(waUrl, '_blank');

      setOrderInfo(newOrderInfo);
      setIsProcessing(false);
      setIsSuccess(true);
      clearCart();
    } catch (error: any) {
      console.error('Order submission error:', error);
      setIsProcessing(false);
      // Improve error message display
      const displayMsg = error instanceof Error ? error.message : String(error);
      showAlert((isArabic ? 'حدث خطأ أثناء معالجة الطلب: ' : 'Error processing order: ') + displayMsg);
    }
  };

  const texts = {
    title: t('checkout.title'),
    subtitle: t('checkout.subtitle'),
    card: t('checkout.card'),
    cod: t('checkout.cod'),
    applepay: t('checkout.applePay'),
    total: t('checkout.total'),
    address: t('checkout.address'),
    phone: t('checkout.phone'),
    confirmOrder: t('checkout.confirm'),
    paypal: t('checkout.paypal'),
    bank: t('checkout.bank'),
    qicard: isArabic ? 'كي كارد' : 'Qi Card',
    processing: t('checkout.processing'),
    success: t('checkout.success'),
    successSub: t('checkout.successSub'),
    trackingText: t('checkout.trackingId'),
    trackNow: t('checkout.trackNow'),
    secure: t('checkout.secure'),
    wallet: t('checkout.wallet'),
    payoneer: t('checkout.payoneer')
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
            <div className={`${paymentMethod === 'card' ? 'bg-[#008296]' : 'bg-brand-charcoal'} p-4 text-white flex-shrink-0 relative`}>
              <div className="flex items-center justify-between">
                <button 
                  onClick={onClose}
                  className="text-[10px] font-bold uppercase tracking-wider hover:opacity-80 transition-opacity"
                >
                  {t('checkout.cancel')}
                </button>
                <h2 className="text-sm font-bold absolute left-1/2 -translate-x-1/2">
                  {paymentMethod === 'card' 
                    ? (isArabic ? 'اختر طريقة الدفع' : 'Select a Payment Method') 
                    : texts.title}
                </h2>
                <div className="w-10"></div> {/* Spacer for symmetry */}
              </div>
            </div>

            {/* Order Summary */}
            <div className={`${paymentMethod === 'card' ? 'bg-[#f7f7f7]' : 'bg-brand-charcoal/5'} p-4 border-b border-brand-charcoal/5 flex justify-between items-center`}>
              <span className="text-brand-charcoal/80 font-bold text-xs uppercase tracking-wider">
                {t('checkout.orderTotal')}
              </span>
              <span className="text-xl font-bold text-[#b12704]">${finalTotal.toFixed(2)}</span>
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
                        <div className="flex flex-col items-center justify-center gap-2 mb-6">
                        <div className="flex items-center gap-2 bg-brand-gold/10 py-2 px-4 rounded-full w-fit mx-auto">
                          <ShieldCheck size={14} className="text-brand-gold" />
                          <span className="text-[10px] font-bold text-brand-gold uppercase tracking-widest">
                            {t('checkout.processedViaNetwork')} ✅
                          </span>
                        </div>
                        {orderInfo.cardholderName && (
                          <div className="mt-2 text-brand-charcoal/60 text-xs font-bold bg-white/50 px-4 py-2 rounded-xl border border-brand-charcoal/5">
                            {t('checkout.cardholder')}: 
                            <span className="text-brand-charcoal">{orderInfo.cardholderName}</span>
                          </div>
                        )}
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
                  {/* Payment Selection Toggles - Always visible at top */}
                  <div className="flex bg-brand-charcoal/[0.05] p-2 rounded-2xl gap-2 border border-brand-charcoal/10 overflow-x-auto no-scrollbar scroll-smooth">
                    {(['card', 'qicard', 'applepay', 'cod', 'wallet', 'bank', 'payoneer'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`min-w-[85px] flex-1 py-4 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all border-2 ${
                          paymentMethod === method 
                            ? 'bg-brand-charcoal text-white border-brand-charcoal shadow-xl shadow-brand-charcoal/20 scale-[1.02] z-10' 
                            : 'bg-white text-brand-charcoal/40 border-brand-charcoal/5 hover:border-brand-gold/30 hover:text-brand-gold'
                        }`}
                      >
                        <div className="flex items-center justify-center h-5 w-5">
                          {method === 'card' ? <CreditCard size={18} /> : 
                           method === 'qicard' ? <img src="https://media.licdn.com/dms/image/C4D0BAQG0_L_F9w4zYw/company-logo_200_200/0/1630571946808?e=2147483647&v=beta&t=7u7u8u" alt="Qi Card" className="w-full h-full rounded-full object-cover" /> :
                           method === 'applepay' ? <div className="font-bold text-[10px] leading-none"> Pay</div> :
                           method === 'cod' ? <Truck size={18} /> : 
                           method === 'wallet' ? <Globe size={18} /> : 
                           method === 'bank' ? <Banknote size={18} /> :
                           method === 'payoneer' ? <img src="https://icon.horse/icon/payoneer.com" alt="Payoneer" className="w-full h-full rounded-sm object-contain" /> :
                           <Banknote size={18} />}
                        </div>
                        <span className="text-[8px] font-black uppercase tracking-[0.05em] whitespace-nowrap">
                          {method === 'applepay' ? 'Apple Pay' : texts[method as keyof typeof texts]}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-6">
                    {/* Customer Information Section */}
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold flex items-center gap-2">
                        <MapPin size={12} /> {t('checkout.shippingInfo')}
                      </h4>
                      
                      <div className="space-y-4">
                        {/* Country Selection */}
                        <div className="relative group">
                          <label className="absolute -top-2 left-6 px-2 bg-white text-[9px] font-black uppercase text-brand-charcoal/40 z-10">{t('checkout.country')}</label>
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
                          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gold">{t('checkout.shippingProvider')}</label>
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
                                    <span className="block text-[10px] text-brand-charcoal/40 font-medium">{t('checkout.deliveryWithin')}: {p.speed}</span>
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
                          <label className="absolute -top-2 left-6 px-2 bg-white text-[9px] font-black uppercase text-brand-gold z-10">{t('checkout.fullName')}</label>
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
                            <label className="absolute -top-2 left-6 px-2 bg-white text-[9px] font-black uppercase text-brand-gold z-10">{t('checkout.phone')}</label>
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
                            <label className="absolute -top-2 left-6 px-2 bg-white text-[9px] font-black uppercase text-brand-gold z-10">{t('checkout.email')}</label>
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
                          <label className="absolute -top-2 left-6 px-2 bg-white text-[9px] font-black uppercase text-brand-gold z-10">{t('checkout.detailedAddress')}</label>
                          <textarea
                            required
                            rows={2}
                            placeholder={t('checkout.addressPlaceholder')}
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
                          {t('checkout.smartFulfillment')}
                        </p>
                        <p className="text-[9px] text-brand-charcoal/50 leading-relaxed">
                          {t('checkout.smartFulfillmentDesc')}
                        </p>
                      </div>
                    </div>

                    {/* Payment Execution Section */}
                    <div className="pt-6 border-t border-brand-charcoal/5">
                      {paymentMethod === 'card' ? (
                        <div className="space-y-6">
                           <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold flex items-center gap-2 mb-4">
                             <CreditCard size={12} /> {isArabic ? 'بطاقة بنكية / مـدى' : 'Card / Mada Info'}
                           </h4>
                           <div className="bg-brand-charcoal/[0.02] p-6 rounded-3xl border-2 border-brand-charcoal/5">
                            <StripePayment 
                              amount={finalTotal} 
                              onSuccess={(name) => handleSubmit(undefined, name)} 
                              onError={(err) => showAlert(err)} 
                              isArabic={isArabic}
                            />
                           </div>
                           <div className="flex gap-2 justify-center opacity-40">
                             <img src="https://upload.wikimedia.org/wikipedia/commons/1/1b/Mada_Logo.svg" alt="Mada" className="h-4" />
                             <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
                             <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-4" />
                           </div>
                        </div>
                      ) : paymentMethod === 'qicard' ? (
                        <div className="space-y-6">
                           <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold flex items-center gap-2 mb-4">
                             <CreditCard size={12} /> {isArabic ? 'معلومات كي كارد' : 'Qi Card Info'}
                           </h4>
                           <div className="bg-brand-charcoal/[0.02] p-6 rounded-3xl border-2 border-brand-charcoal/5 border-brand-gold/30">
                            <div className="text-center mb-6">
                              <img src="https://media.licdn.com/dms/image/C4D0BAQG0_L_F9w4zYw/company-logo_200_200/0/1630571946808?e=2147483647&v=beta&t=7u7u8u" alt="Qi Card Logo" className="h-12 mx-auto mb-2 rounded-full" />
                              <p className="text-[10px] font-bold text-brand-charcoal/40 uppercase tracking-widest">{isArabic ? 'ادفع باستخدام بطاقة Qi Card' : 'Pay with Qi Card'}</p>
                            </div>
                            <StripePayment 
                              amount={finalTotal} 
                              onSuccess={(name) => handleSubmit(undefined, name)} 
                              onError={(err) => showAlert(err)} 
                              isArabic={isArabic}
                            />
                           </div>
                        </div>
                      ) : paymentMethod === 'applepay' ? (
                        <div className="space-y-4">
                           <div className="bg-black text-white p-6 rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-brand-charcoal transition-all" onClick={() => handleSubmit()}>
                              <div className="font-bold text-2xl flex items-center gap-2"> Pay</div>
                              <p className="text-[10px] uppercase font-black tracking-widest opacity-60">
                                {isArabic ? 'اضغط للدفع السريع' : 'TAP TO PAY SECURELY'}
                              </p>
                           </div>
                        </div>
                      ) : paymentMethod === 'wallet' ? (
                        <div className="space-y-6">
                           <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold flex items-center gap-2 mb-4">
                             <Globe size={12} /> {isArabic ? 'اختر المحفظة والتحويل' : 'Select Wallet & Transfer'}
                           </h4>
                           <div className="grid grid-cols-2 gap-2 mb-4">
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
                                onClick={() => setSelectedWallet('nass')}
                                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${selectedWallet === 'nass' ? 'border-[#00a651] bg-[#00a651]/20' : 'border-brand-charcoal/5 bg-white'}`}
                              >
                                <div className="w-9 h-9 rounded-full bg-[#00a651] flex items-center justify-center text-white font-black text-[11px] shadow-sm">NP</div>
                                <div className="flex flex-col items-center">
                                  <span className="text-[10px] font-black text-brand-charcoal leading-tight">NassPay</span>
                                  <span className="text-[8px] font-bold text-brand-charcoal/60 leading-tight">نص باي</span>
                                </div>
                              </button>
                              <button 
                                onClick={() => setSelectedWallet('fast')}
                                className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${selectedWallet === 'fast' ? 'border-[#00adef] bg-[#00adef]/20' : 'border-brand-charcoal/5 bg-white'}`}
                              >
                                <div className="w-9 h-9 rounded-full bg-[#00adef] flex items-center justify-center text-white font-black text-[11px] shadow-sm">FP</div>
                                <div className="flex flex-col items-center">
                                  <span className="text-[10px] font-black text-brand-charcoal leading-tight">FastPay</span>
                                  <span className="text-[8px] font-bold text-brand-charcoal/60 leading-tight">فاست باي</span>
                                </div>
                              </button>
                           </div>

                           <div className="bg-brand-charcoal/5 p-6 rounded-3xl border border-brand-charcoal/10 text-center space-y-3">
                              <p className="text-xs text-brand-charcoal/60 leading-relaxed">
                                {isArabic 
                                  ? `يرجى تحويل مبلغ (${finalTotal.toFixed(2)}$) إلى الرقم التالي، ثم اضغط تأكيد السداد:` 
                                  : `Please transfer ($${finalTotal.toFixed(2)}) to the following Number, then verify:`}
                              </p>
                              <p className="text-xl font-mono font-black text-brand-charcoal tracking-widest bg-white py-3 rounded-xl border border-brand-charcoal/5">
                                {selectedWallet === 'zaincash' ? '07837814009' : 
                                 selectedWallet === 'asiahawala' ? '07730000000' :
                                 selectedWallet === 'nass' ? '07500000000' :
                                 '07800000000'}
                              </p>
                              <p className="text-[9px] text-brand-gold font-bold uppercase">
                                {isArabic ? 'يرجى إرسال صورة التحويل عبر الواتساب بعد الطلب' : 'Please send transfer screenshot via WhatsApp after order'}
                              </p>
                           </div>

                           {/* Trust & Guarantees Section */}
                           <div className="mt-8 grid grid-cols-3 gap-2 border-t border-brand-charcoal/5 pt-6">
                              <div className="flex flex-col items-center text-center gap-1.5">
                                <div className="w-8 h-8 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                                  <ShieldCheck size={16} />
                                </div>
                                <span className="text-[8px] font-bold text-brand-charcoal/70 leading-tight uppercase tracking-tighter">
                                  {isArabic ? 'ضمان حقيقي' : 'Real Guarantee'}
                                </span>
                              </div>
                              <div className="flex flex-col items-center text-center gap-1.5">
                                <div className="w-8 h-8 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                                  <Truck size={16} />
                                </div>
                                <span className="text-[8px] font-bold text-brand-charcoal/70 leading-tight uppercase tracking-tighter">
                                  {isArabic ? 'فحص قبل الدفع' : 'Check Before Pay'}
                                </span>
                              </div>
                              <div className="flex flex-col items-center text-center gap-1.5">
                                <div className="w-8 h-8 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                                  <Lock size={16} />
                                </div>
                                <span className="text-[8px] font-bold text-brand-charcoal/70 leading-tight uppercase tracking-tighter">
                                  {isArabic ? 'دفع آمن 100%' : '100% Secure'}
                                </span>
                              </div>
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
                      ) : paymentMethod === 'bank' ? (
                        <div className="space-y-6">
                           <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold flex items-center gap-2 mb-4">
                             <Banknote size={12} /> {isArabic ? 'معلومات التحويل البنكي' : 'Bank Transfer Info'}
                           </h4>
                           <div className="bg-brand-charcoal/5 p-6 rounded-3xl border border-brand-charcoal/10 space-y-4">
                              <div className={isArabic ? 'text-right' : 'text-left'}>
                                <p className="text-[10px] font-bold opacity-40 uppercase">{isArabic ? 'اسم البنك:' : 'Bank Name:'}</p>
                                <p className="text-sm font-bold text-brand-charcoal">TBI (Trade Bank of Iraq)</p>
                              </div>
                              <div className={isArabic ? 'text-right' : 'text-left'}>
                                <p className="text-[10px] font-bold opacity-40 uppercase">IBAN:</p>
                                <p className="text-sm font-mono font-bold text-brand-charcoal">IQ12 0000 0000 0000 0000 0000</p>
                              </div>
                              <div className={isArabic ? 'text-right' : 'text-left'}>
                                <p className="text-[10px] font-bold opacity-40 uppercase">{isArabic ? 'اسم الحساب:' : 'Account Holder:'}</p>
                                <p className="text-sm font-bold text-brand-charcoal">AH Store - Iraq Branch</p>
                              </div>
                              <p className="text-[10px] text-brand-gold font-bold uppercase text-center pt-2">
                                {isArabic ? 'يرجى إرسال وصل التحويل عبر الواتساب' : 'Please send transfer receipt via WhatsApp'}
                              </p>
                           </div>
                           <button onClick={() => handleSubmit()} className="w-full bg-brand-charcoal text-white font-bold py-6 rounded-2xl shadow-xl transition-all active:scale-95">
                             {isArabic ? 'تأكيد الحوالة والطلب' : 'Confirm Transfer & Order'}
                           </button>
                        </div>
                      ) : paymentMethod === 'payoneer' ? (
                        <div className="space-y-6">
                           <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold flex items-center gap-2 mb-4">
                             <img src="https://icon.horse/icon/payoneer.com" alt="Payoneer" className="w-4 h-4 rounded-sm" /> 
                             {isArabic ? 'الدفع عبر بايونير' : 'Pay via Payoneer'}
                           </h4>
                           <div className="bg-brand-charcoal/5 p-6 rounded-3xl border border-brand-charcoal/10 text-center space-y-4">
                              <p className="text-xs text-brand-charcoal/60 leading-relaxed">
                                {isArabic 
                                  ? `يرجى تحويل مبلغ (${finalTotal.toFixed(2)}$) إلى الحساب التالي:` 
                                  : `Please send ($${finalTotal.toFixed(2)}) to the following Payoneer Email:`}
                              </p>
                              <div className="bg-white py-4 rounded-xl border border-brand-charcoal/5 flex flex-col gap-1 shadow-sm">
                                <p className="text-sm font-bold text-brand-charcoal">kmerro25@gmail.com</p>
                                <p className="text-[10px] font-bold text-brand-charcoal/30 uppercase tracking-widest">Payoneer ID / Email</p>
                              </div>
                              <p className="text-[9px] text-brand-gold font-bold uppercase">
                                {isArabic ? 'سيتم تأكيد طلبك بمجرد استلام التحويل' : 'Your order will be confirmed once transfer is received'}
                              </p>
                           </div>
                           <button onClick={() => handleSubmit()} className="w-full bg-brand-charcoal text-white font-bold py-6 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2">
                             {isArabic ? 'تأكيد التحويل والطلب' : 'Confirm Payoneer Transfer'}
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
