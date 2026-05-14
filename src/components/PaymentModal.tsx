import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CreditCard, ShieldCheck, Lock, Truck, MapPin, Globe, Banknote, Building2, Smartphone, Coins, Upload, Image as ImageIcon } from 'lucide-react';
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
  const { clearCart, cart, formatPrice, setCurrency } = useStore();
  const { showAlert } = useAlert();
  const isArabic = i18n.language === 'ar';

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod' | 'googlepay' | 'crypto'>('card');
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
    zipCode: '',
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

      /* 
      // Automatically set currency based on country - Disabled as per user request to keep USD as primary
      let newCurrency = 'USD';
      if (selectedCountry === 'IQ') newCurrency = 'IQD';
      else if (selectedCountry === 'SA') newCurrency = 'SAR';
      else if (selectedCountry === 'AE') newCurrency = 'AED';
      else if (selectedCountry === 'TR') newCurrency = 'TRY';
      else if (selectedCountry === 'EG') newCurrency = 'EGP';
      else if (selectedCountry === 'JO') newCurrency = 'JOD';
      else if (selectedCountry === 'KW') newCurrency = 'KWD';
      else if (selectedCountry === 'QA') newCurrency = 'QAR';
      else if (selectedCountry === 'BH') newCurrency = 'BHD';
      else if (selectedCountry === 'OM') newCurrency = 'OMR';
      else if (selectedCountry === 'GB') newCurrency = 'GBP';
      else if (['DE', 'FR'].includes(selectedCountry)) newCurrency = 'EUR';
      
      setCurrency(newCurrency);
      localStorage.setItem('trendifi_currency_manual', 'true');
      */
    }
  }, [selectedCountry, setCurrency]);

  useEffect(() => {
    // Reset shipping fee and speed when country/provider changes
    fetch(`/api/shipping-rate?country=${selectedCountry}&provider=${selectedProvider}`)
      .then(res => res.json())
      .then(data => {
        setShippingFee(data.rate);
        setShippingSpeed(data.speed);
      })
      .catch(() => setShippingFee(20)); // Fallback
  }, [selectedCountry, selectedProvider]);

  useEffect(() => {
    // Reset receipt file when payment method changes
    setReceiptFile(null);
    setReceiptPreview(null);
  }, [paymentMethod]);

  const fullPhoneNumber = `${phonePrefix} ${formData.phone}`;

  const effectiveShippingFee = paymentMethod === 'cod' ? shippingFee : 0;
  const finalTotal = total + effectiveShippingFee;

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderInfo, setOrderInfo] = useState<{
    trackingId: string;
    trackingLink: string;
    cardholderName?: string;
    whatsappSent?: boolean;
    items?: any[];
  } | null>(null);

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showAlert(isArabic ? 'حجم الملف كبير جداً (الحد الأقصى 5 ميجابايت)' : 'File is too large (Max 5MB)');
        return;
      }
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  const WHATSAPP_NUMBER = '9647837814009';

  const getWhatsAppMessage = (info: any) => {
    const methodLabel = paymentMethod === 'cod' ? (isArabic ? 'الدفع عند الاستلام (افحص واستلم) 🤝' : 'Cash on Delivery (Check & Collect) 🤝') : 
                       paymentMethod === 'card' ? t('checkout.card') : 
                       paymentMethod === 'crypto' ? (isArabic ? 'عملات رقمية 🪙' : 'Cryptocurrency 🪙') :
                       paymentMethod === 'googlepay' ? (isArabic ? 'جوجل باي (الدفع السريع) 📱' : 'Google Pay (Rapid) 📱') :
                       t('checkout.paypal');
    
    // Formatting items with price
    const itemsText = (info.items || []).map((item: any) => 
      `▫️ ${item.name} (${item.quantity}x) - ${formatPrice((item.discountPrice ?? item.price) * item.quantity)}`
    ).join('\n');
    
    return encodeURIComponent(
      `🛍️ *طلب جديد من Trendifi: ${info.trackingId}*\n\n` +
      `👤 *معلومات العميل:*\n` +
      `• الاسم: ${formData.name}\n` +
      `• الهاتف: ${fullPhoneNumber}\n` +
      `• البريد: ${formData.email || 'N/A'}\n\n` +
      `📍 *العنوان:* \n${countries.find(c => c.code === selectedCountry)?.name || selectedCountry} - ${formData.address}\n\n` +
      `📦 *المنتجات:*\n${itemsText}\n\n` +
      `💳 *طريقة الدفع:* ${methodLabel}${receiptFile ? (isArabic ? '\n✅ تم إرفاق إيصال الدفع' : '\n✅ Payment Receipt Attached') : ''}\n` +
      `🚚 *شركة الشحن:* ${paymentMethod === 'cod' ? (shippingProviders.find(p => p.id === selectedProvider)?.name || selectedProvider) : (isArabic ? 'شحن إلكتروني' : 'Electronic Shipping')}\n` +
      `--------------------------\n` +
      `💰 *المجموع:* ${formatPrice(total)}\n` +
      `🚚 *الشحن:* ${formatPrice(effectiveShippingFee)}\n` +
      `✨ *الإجمالي:* ${formatPrice(finalTotal)}\n` +
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
          city: formData.city,
          country: countries.find(c => c.code === selectedCountry)?.name || selectedCountry,
          zipCode: formData.zipCode,
          phone: fullPhoneNumber
        },
        phone: fullPhoneNumber,
        paymentMethod,
        cardholderName: cardholderName || null,
        googlePayVerified: paymentMethod === 'googlepay',
        shippingProvider: paymentMethod === 'cod' ? selectedProvider : 'electronic_standard',
        shippingSpeed,
        total: finalTotal,
        subtotal: total,
        shippingFee: effectiveShippingFee,
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
    total: t('checkout.total'),
    address: t('checkout.address'),
    phone: t('checkout.phone'),
    confirmOrder: t('checkout.confirm'),
    paypal: t('checkout.paypal'),
    bank: t('checkout.bank'),
    processing: t('checkout.processing'),
    success: t('checkout.success'),
    successSub: t('checkout.successSub'),
    trackingText: t('checkout.trackingId'),
    trackNow: t('checkout.trackNow'),
    secure: t('checkout.secure'),
    wallet: t('checkout.wallet')
  };

  const paymentMethodColors: Record<string, string> = {
    card: '#008296',
    crypto: '#f7931a',
    cod: '#22c55e',
    googlepay: '#4285F4'
  };

    const methodLabel = paymentMethod === 'cod' ? (isArabic ? 'دفع عند الاستلام' : 'Cash on Delivery') : 
                       paymentMethod === 'card' ? (isArabic ? 'بطاقة بنكية' : 'Bank Card') : 
                       paymentMethod === 'crypto' ? (isArabic ? 'عملات رقمية' : 'Crypto') :
                       paymentMethod === 'googlepay' ? (isArabic ? 'جوجل باي' : 'Google Pay') :
                       '';

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
              className="relative w-full max-w-lg bg-brand-cream rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh]"
            >
              {/* Header */}
              <div 
                className="p-4 text-white flex-shrink-0 relative transition-colors duration-500"
                style={{ backgroundColor: paymentMethodColors[paymentMethod] || '#000000' }}
              >
                <div className="flex items-center justify-between">
                  <button 
                    onClick={onClose}
                    className="text-[10px] font-bold uppercase tracking-wider hover:opacity-80 transition-opacity"
                  >
                    {t('checkout.cancel')}
                  </button>
                  <h2 className="text-sm font-bold absolute left-1/2 -translate-x-1/2 uppercase tracking-widest">
                    {methodLabel}
                  </h2>
                  <div className="w-10"></div> {/* Spacer for symmetry */}
                </div>
              </div>

            {/* Order Summary */}
            <div 
              className="p-4 border-b border-brand-charcoal/5 flex justify-between items-center transition-colors duration-500"
              style={{ backgroundColor: `${paymentMethodColors[paymentMethod]}08` }}
            >
              <span className="text-brand-charcoal/80 font-bold text-xs uppercase tracking-wider">
                {t('checkout.orderTotal')}
              </span>
              <span className="text-xl font-bold text-[#b12704]">{formatPrice(finalTotal)}</span>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-10 overflow-y-auto flex-1 bg-white custom-scrollbar">
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
                      <div className="mb-4 text-sm font-bold text-brand-charcoal/60">
                        {t('checkout.total')}: <span className="text-brand-charcoal">{formatPrice(finalTotal)}</span>
                      </div>
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
                  {/* Payment Selection Toggles - Grid for desktop to ensure all are visible */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 bg-brand-charcoal/[0.03] p-2 rounded-2xl gap-2 sm:gap-3 border border-brand-charcoal/5">
                    {(['card', 'crypto', 'cod', 'googlepay'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`py-4 px-1 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border-2 relative ${
                          paymentMethod === method 
                            ? 'bg-white text-brand-charcoal border-brand-gold shadow-lg shadow-brand-gold/10 scale-[1.02] z-10' 
                            : 'bg-white/40 text-brand-charcoal/30 border-transparent hover:border-brand-gold/10 hover:bg-white/60'
                        }`}
                      >
                        {paymentMethod === method && (
                          <div className="absolute -top-2 -right-2 bg-brand-gold text-white rounded-full p-1 shadow-lg z-20">
                            <ShieldCheck size={12} fill="currentColor" />
                          </div>
                        )}
                        <div className={`flex items-center justify-center h-12 w-12 rounded-2xl transition-all shadow-sm ${
                          paymentMethod === method 
                            ? 'text-white rotate-3 scale-110'
                            : 'bg-brand-charcoal/5 text-brand-charcoal/30 grayscale'
                        }`}
                        style={{ backgroundColor: paymentMethod === method ? paymentMethodColors[method] : '' }}
                        >
                          {method === 'card' ? <CreditCard size={24} strokeWidth={2} /> : 
                           method === 'cod' ? <Truck size={24} strokeWidth={2} /> : 
                           method === 'googlepay' ? <Smartphone size={24} strokeWidth={2} /> : 
                           method === 'crypto' ? <Coins size={24} strokeWidth={2} /> :
                           <Banknote size={24} />}
                        </div>
                        <span 
                          className={`text-[10px] font-black uppercase tracking-wider whitespace-nowrap text-center transition-all ${paymentMethod === method ? '' : 'text-brand-charcoal/40'}`}
                          style={{ color: paymentMethod === method ? paymentMethodColors[method] : '' }}
                        >
                          {method === 'googlepay' ? (isArabic ? 'جوجل باي' : 'Google Pay') :
                           method === 'crypto' ? (isArabic ? 'عملات رقمية' : 'Crypto') :
                           texts[method as keyof typeof texts]}
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

                        {/* Shipping Provider Selection - Only for COD as per request */}
                        {paymentMethod === 'cod' && (
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
                                    {formatPrice(Math.round(p.base * (COUNTRY_ADJUSTMENT_LOCAL[selectedCountry] || 1.5)))}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

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

                        {/* City & Zip Code Details */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="relative">
                            <label className="absolute -top-2 left-6 px-2 bg-white text-[9px] font-black uppercase text-brand-gold z-10">{t('checkout.city')}</label>
                            <input
                              required
                              type="text"
                              placeholder="Dubai"
                              className="w-full bg-brand-charcoal/[0.02] border-2 border-brand-charcoal/10 rounded-2xl px-6 py-5 focus:bg-white focus:border-brand-gold outline-none text-brand-charcoal font-bold transition-all shadow-sm"
                              value={formData.city}
                              onChange={(e) => setFormData({...formData, city: e.target.value})}
                            />
                          </div>
                          <div className="relative">
                            <label className="absolute -top-2 left-6 px-2 bg-white text-[9px] font-black uppercase text-brand-gold z-10">{isArabic ? 'الرمز البريدي' : 'ZIP Code'}</label>
                            <input
                              type="text"
                              placeholder="00000"
                              className="w-full bg-brand-charcoal/[0.02] border-2 border-brand-charcoal/10 rounded-2xl px-6 py-5 focus:bg-white focus:border-brand-gold outline-none text-brand-charcoal font-bold transition-all shadow-sm"
                              value={formData.zipCode}
                              onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
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
                      ) : paymentMethod === 'googlepay' ? (
                        <div className="space-y-6 text-center">
                          <div className="bg-[#4285F4]/5 p-8 rounded-[2.5rem] border-2 border-[#4285F4]/20 space-y-6">
                            <div className="w-20 h-20 bg-[#4285F4] rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-[#4285F4]/20 animate-bounce">
                              <Smartphone size={40} className="text-white" />
                            </div>
                            <div className="space-y-2">
                              <h4 className="text-xl font-black text-brand-charcoal leading-tight">
                                {isArabic ? 'الدفع السريع بنقرة واحدة' : 'One-Tap Fast Payment'}
                              </h4>
                              <p className="text-[10px] font-bold text-brand-charcoal/40 uppercase tracking-widest">
                                {isArabic ? 'آمن • سريع • خصوصية كاملة' : 'Secure • Fast • Total Privacy'}
                              </p>
                            </div>
                            
                            <div className="bg-white p-4 rounded-2xl border border-brand-charcoal/5 flex flex-col items-center gap-3">
                              <div className="flex items-center gap-2">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" alt="Google Pay" className="h-8" />
                              </div>
                              <p className="text-[10px] text-brand-charcoal/60 leading-relaxed max-w-[200px]">
                                {isArabic ? 'سيتم استخدام معلومات الدفع المحفوظة في حساب جوجل الخاص بك' : 'Saved payment info from your Google account will be used securely'}
                              </p>
                            </div>
                          </div>

                          <button
                            disabled={isProcessing}
                            onClick={() => handleSubmit()}
                            type="button"
                            className="w-full bg-[#4285F4] text-white font-black py-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-brand-charcoal shadow-2xl shadow-[#4285F4]/20 transition-all disabled:opacity-50 active:scale-95 group uppercase tracking-widest text-xs"
                          >
                            {isProcessing ? (
                              <span className="flex items-center gap-2 font-bold">
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                {texts.processing}
                              </span>
                            ) : (
                              <>
                                <ShieldCheck className="group-hover:scale-110 transition-transform" />
                                {isArabic ? 'ادفع الآن بوساطة Google Pay' : 'Pay Now with Google Pay'}
                              </>
                            )}
                          </button>

                          <div className="flex items-center justify-center gap-4 opacity-50 grayscale pt-2">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/c/cb/Google_Pay_Logo_2020.svg" alt="GP" className="h-4" />
                            <div className="w-[1px] h-3 bg-brand-charcoal/20" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-charcoal">Smart Auth</span>
                          </div>
                        </div>
                      ) : paymentMethod === 'crypto' ? (
                        <div className="space-y-6">
                           <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#f7931a] flex items-center gap-2 mb-4">
                             <Coins size={12} strokeWidth={3} /> {isArabic ? 'الدفع بالعملات الرقمية' : 'Pay via Cryptocurrency'}
                           </h4>
                           <div className="flex items-center gap-4 bg-[#f7931a]/5 p-5 rounded-3xl border border-[#f7931a]/20 mb-6 relative overflow-hidden group">
                              <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform">
                                <Coins size={60} />
                              </div>
                              <div className="w-12 h-12 rounded-2xl bg-[#f7931a] flex items-center justify-center text-white shadow-xl transform group-hover:scale-110 transition-transform">
                                <Coins size={24} />
                              </div>
                              <div>
                                <h5 className="text-[14px] font-black text-[#f7931a] tracking-tight uppercase leading-none">USDT / BTC / ETH</h5>
                                <p className="text-[10px] font-bold text-brand-charcoal/40 uppercase mt-1.5">{isArabic ? 'دعم كامل لجميع الشبكات' : 'Full Support All Networks'}</p>
                              </div>
                           </div>

                           <div className="bg-brand-charcoal/[0.03] p-6 rounded-[2.5rem] border border-brand-charcoal/10 text-center space-y-5 relative overflow-hidden">
                              <p className="text-xs text-brand-charcoal/70 font-semibold leading-relaxed">
                                {isArabic 
                                  ? `يرجى تحويل المعادل لـ (${formatPrice(finalTotal)}) إلى العنوان التالي:` 
                                  : `Please transfer (${formatPrice(finalTotal)}) to:`}
                              </p>
                              
                              <div className="bg-white py-5 px-4 rounded-2xl border border-brand-charcoal/10 shadow-sm group cursor-pointer active:scale-95 transition-all hover:border-brand-gold/30">
                                <p className="text-[10px] font-mono font-black text-brand-charcoal break-all tracking-wider md:text-xs">
                                  TX221wiLGdKizoXaCaiRyLHjzZxxP63iFU
                                </p>
                                <div className="mt-4 flex items-center justify-center gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                                  <div className="h-[1px] w-8 bg-brand-gold/40" />
                                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gold font-mono">{isArabic ? 'شبكة TRC20 - اضغط للنسخ' : 'TRC20 NETWORK - CLICK TO COPY'}</span>
                                  <div className="h-[1px] w-8 bg-brand-gold/40" />
                                </div>
                              </div>

                              <div className="flex justify-center py-4 bg-white/50 rounded-2xl backdrop-blur-sm">
                                <div className="p-3 bg-white rounded-2xl border border-brand-charcoal/10 shadow-lg transform hover:scale-105 transition-transform cursor-zoom-in">
                                  <img 
                                    src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=TX221wiLGdKizoXaCaiRyLHjzZxxP63iFU" 
                                    alt="Crypto QR Code" 
                                    className="w-24 h-24 sm:w-32 sm:h-32 grayscale brightness-90 hover:grayscale-0 transition-all"
                                  />
                                </div>
                              </div>
                           </div>

                           {/* MANDATORY RECEIPT UPLOAD */}
                           <div className="space-y-3">
                             <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f7931a] flex items-center gap-2">
                               <Upload size={12} /> {isArabic ? 'ارفاق ايصال الدفع (إجباري)' : 'Attach Payment Receipt (Mandatory)'}
                             </label>
                             
                             <div className={`relative group transition-all ${receiptFile ? 'border-[#f7931a]/20 bg-[#f7931a]/5' : 'border-dashed border-2 border-brand-charcoal/10 bg-brand-charcoal/[0.02] hover:bg-brand-charcoal/[0.04]'} rounded-3xl p-6 text-center`}>
                               <input
                                 type="file"
                                 accept="image/*"
                                 onChange={handleFileChange}
                                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                               />
                               
                               {receiptPreview ? (
                                 <div className="flex flex-col items-center gap-3 relative z-20">
                                   <div className="relative">
                                     <img src={receiptPreview} alt="Receipt Preview" className="w-24 h-24 object-cover rounded-2xl shadow-lg border-2 border-white" />
                                     <button 
                                       type="button"
                                       onClick={(e) => { e.stopPropagation(); removeReceipt(); }}
                                       className="absolute -top-2 -right-2 bg-brand-charcoal text-white rounded-full p-1 shadow-lg hover:bg-red-500 transition-colors"
                                     >
                                       <X size={12} />
                                     </button>
                                   </div>
                                   <p className="text-[10px] font-bold text-[#f7931a] truncate max-w-[200px]">{receiptFile?.name}</p>
                                 </div>
                               ) : (
                                 <div className="flex flex-col items-center gap-2 py-4">
                                   <div className="w-12 h-12 rounded-full bg-[#f7931a]/10 flex items-center justify-center text-[#f7931a] mb-2">
                                     <Upload size={24} />
                                   </div>
                                   <p className="text-xs font-bold text-brand-charcoal">{isArabic ? 'اضغط لرفع الايصال' : 'Click to upload receipt'}</p>
                                   <p className="text-[9px] text-brand-charcoal/40 font-bold uppercase tracking-widest">{isArabic ? 'الصور فقط (الحد الأقصى 5 ميجابايت)' : 'Images only (Max 5MB)'}</p>
                                 </div>
                               )}
                             </div>
                           </div>

                           <button 
                             disabled={isProcessing || !receiptFile}
                             onClick={() => handleSubmit()} 
                             className="w-full bg-[#f7931a] text-white font-black text-xs py-6 rounded-2xl shadow-xl shadow-[#f7931a]/20 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed group"
                           >
                             {isProcessing ? (
                               <span className="flex items-center gap-2">
                                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                  {texts.processing}
                               </span>
                             ) : (
                               <>
                                 <Lock size={16} className="group-hover:scale-110 transition-transform" /> 
                                 {isArabic ? 'تأكيد الحوالة والطلب' : 'Confirm Crypto Order'}
                               </>
                             )}
                           </button>

                           <p className="text-[10px] text-brand-gold font-black text-center uppercase tracking-[0.2em] animate-pulse">
                             {isArabic ? '✓ أرسل رقم العملية (TXID) عبر الواتساب' : '✓ Send TXID via WhatsApp'}
                           </p>
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
