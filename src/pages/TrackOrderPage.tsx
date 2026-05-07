import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Package, MapPin, Clock, CheckCircle2, ArrowRight, Truck } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface OrderInfo {
  trackingId: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  customerName: string;
  total: number;
  items: any[];
  createdAt: string;
  address: string;
}

const TrackOrderPage: React.FC = () => {
  const { trackingId: urlId } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  
  const [searchInput, setSearchInput] = useState(urlId || '');
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const texts = {
    title: isArabic ? 'تتبع طلبك' : 'Track Your Order',
    subtitle: isArabic ? 'أدخل رقم التتبع الخاص بك لمعرفة حالة طلبك الحالية.' : 'Enter your tracking number to see the current status of your shipment.',
    placeholder: isArabic ? 'رقم التتبع (مثال: AH-1234-5678)' : 'Tracking Number (e.g. AH-1234-5678)',
    trackBtn: isArabic ? 'تتبع الآن' : 'Track Now',
    orderNotFound: isArabic ? 'لم يتم العثور على الطلب. يرجى التحقق من رقم التتبع.' : 'Order not found. Please check your tracking number.',
    details: isArabic ? 'تفاصيل الطلب' : 'Order Details',
    status: isArabic ? 'الحالة' : 'Status',
    date: isArabic ? 'التاريخ' : 'Date',
    shippingTo: isArabic ? 'يشحن إلى' : 'Shipping To',
    total: isArabic ? 'الإجمالي' : 'Total',
    items: isArabic ? 'المنتجات' : 'Items',
    statusSteps: {
      pending: isArabic ? 'تم استلام الطلب' : 'Order Received',
      processing: isArabic ? 'قيد التجهيز' : 'Processing',
      shipped: isArabic ? 'تم الشحن' : 'Shipped',
      delivered: isArabic ? 'تم التوصيل' : 'Delivered'
    }
  };

  const fetchOrder = async (id: string) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const docRef = doc(db, 'orders', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setOrder({
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt || new Date().toISOString()
        } as OrderInfo);
      } else {
        throw new Error('Order not found');
      }
    } catch (err) {
      console.error("Tracking error:", err);
      setError(texts.orderNotFound);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlId) {
      fetchOrder(urlId);
    }
  }, [urlId]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      navigate(`/track/${searchInput.trim()}`);
    }
  };

  const statusMap = {
    pending: 1,
    processing: 2,
    shipped: 3,
    delivered: 4
  };

  const currentStep = order ? statusMap[order.status] : 0;

  return (
    <div className={`pt-32 pb-32 px-4 bg-[#0A0A0B] text-white min-h-screen ${isArabic ? 'font-arabic' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 bg-brand-gold/10 text-brand-gold px-6 py-2 rounded-full font-bold uppercase tracking-widest text-xs mb-6"
          >
            <Package size={16} /> {texts.title}
          </motion.div>
          <h1 className="text-5xl font-bold tracking-tight mb-6 text-white">{texts.title}</h1>
          <p className="text-white/60 font-light max-w-xl mx-auto">{texts.subtitle}</p>
        </div>

        <form onSubmit={handleSearch} className="mb-16">
          <div className="relative group">
            <input
              type="text"
              placeholder={texts.placeholder}
              className="w-full bg-white/5 border border-white/10 rounded-full px-8 py-6 text-xl shadow-lg group-focus-within:border-brand-gold outline-none transition-all text-white placeholder:text-white/20"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <button 
              type="submit"
              disabled={loading}
              className={`absolute top-1/2 -translate-y-1/2 ${isArabic ? 'left-3' : 'right-3'} bg-brand-gold text-white px-8 py-4 rounded-full font-bold flex items-center gap-2 hover:bg-white hover:text-black transition-all shadow-md disabled:opacity-50`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <><Search size={20} /> <span className="hidden sm:inline">{texts.trackBtn}</span></>
              )}
            </button>
          </div>
        </form>

        {error && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-3xl text-center font-medium"
          >
            {error}
          </motion.div>
        )}

        {order && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1A1A1A] rounded-[3rem] shadow-2xl overflow-hidden border border-white/10"
          >
            {/* Status Bar */}
            <div className="bg-black p-12 text-white">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                  <h2 className="text-3xl font-bold mb-2">#{order.trackingId}</h2>
                  <p className="text-white/40">{texts.statusSteps[order.status]}</p>
                </div>
                <div className="flex items-center gap-4 bg-white/10 px-6 py-3 rounded-2xl border border-white/5">
                  <Clock size={20} className="text-brand-gold" />
                  <span className="font-mono text-sm">{new Date(order.createdAt).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', { dateStyle: 'long' })}</span>
                </div>
              </div>

              <div className="relative mt-16 flex justify-between">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 -translate-y-1/2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentStep - 1) * 33.33}%` }}
                    className="h-full bg-brand-gold"
                  />
                </div>
                
                {[
                  { step: 1, icon: Package, key: 'pending' },
                  { step: 2, icon: Clock, key: 'processing' },
                  { step: 3, icon: Truck, key: 'shipped' },
                  { step: 4, icon: CheckCircle2, key: 'delivered' }
                ].map((s) => (
                  <div key={s.step} className="relative z-10 flex flex-col items-center gap-3">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${
                      currentStep >= s.step ? 'bg-brand-gold text-[#0A0A0B] shadow-[0_0_20px_rgba(197,160,89,0.3)]' : 'bg-black border-2 border-white/10 text-white/40'
                    }`}>
                      <s.icon size={18} />
                    </div>
                    <span className={`text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-center max-w-[60px] sm:max-w-none ${
                      currentStep >= s.step ? 'text-brand-gold' : 'text-white/40'
                    }`}>
                      {texts.statusSteps[s.key as keyof typeof texts.statusSteps]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-16">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
                    <MapPin size={14} /> {texts.shippingTo}
                  </h3>
                  <div className="bg-white/5 p-8 rounded-3xl border border-white/5">
                    <p className="text-xl font-bold mb-2 text-white">{order.shippingAddress?.fullName || order.customerName || 'Customer'}</p>
                    <p className="text-white/60 leading-relaxed font-light">{order.shippingAddress?.address || order.address}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
                    <Clock size={14} /> {texts.details}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-white/5">
                      <span className="text-white/60">{texts.items}</span>
                      <span className="font-bold text-white">{order.items.length}</span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-2xl pt-4">
                      <span className="text-white">{texts.total}</span>
                      <span className="text-brand-gold font-mono">${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-6">{texts.items}</h3>
                <div className="space-y-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 border border-white/5 rounded-2xl group hover:border-brand-gold transition-all bg-white/5">
                      {item.image && (
                         <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-xl" />
                      )}
                      <div className="flex-grow min-w-0">
                        <p className="font-bold group-hover:text-brand-gold transition-colors text-white truncate">{item.name}</p>
                        <p className="text-xs text-white/40 uppercase tracking-widest">{item.selectedSize} | {item.selectedColor}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-white">${item.price}</p>
                        <p className="text-[10px] text-white/40 uppercase font-bold">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TrackOrderPage;
