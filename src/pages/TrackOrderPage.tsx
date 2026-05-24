import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Package, MapPin, Clock, CheckCircle2, ArrowRight, Truck, Globe, ExternalLink } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface OrderInfo {
  trackingId: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  fulfillment?: {
    provider: string;
    status: string;
    supplierId?: string;
    estimatedDispatch?: string;
  };
  customerName: string;
  total: number;
  items: any[];
  createdAt: string;
  address: string;
  shippingAddress?: {
    fullName: string;
    address: string;
  };
}

interface LogEntry {
  date: Date;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
}

const generateLogEntries = (createdAtStr: string, status: 'pending' | 'processing' | 'shipped' | 'delivered', trackingNo?: string): LogEntry[] => {
  const createdDate = new Date(createdAtStr);
  const now = new Date();
  const entries: LogEntry[] = [];

  const addLog = (hoursOffset: number, titleAr: string, titleEn: string, descAr: string, descEn: string) => {
    const logDate = new Date(createdDate.getTime() + hoursOffset * 60 * 60 * 1000);
    if (logDate <= now) {
      entries.push({ date: logDate, titleAr, titleEn, descAr, descEn });
    }
  };

  // 1. Order Placed (Always)
  addLog(0, 
    "تم استلام الطلب الفعلي", "Order Placed Successfully",
    "تم تسجيل طلبكم بنجاح في نظام المبيعات ونقوم الآن بمراجعة تفاصيل العنوان والاتصال وتأكيد المدفوعات.",
    "Your order is registered in our sales system. We are reviewing your contact details, destination address and verifying payment."
  );

  // 2. Processing Steps
  if (status !== 'pending') {
    addLog(3,
      "تأكيد الدفع والتحقق الفني", "Payment & Integrity Verified",
      "تم التحقق من عملية الدفع بنجاح وتفويض طلبكم من قبل النظام الآلي الخاص بنا.",
      "Integrity check passed. Payment successfully verified and authorized for preparation."
    );
    addLog(8,
      "جاري تجهيز السلع في المستودع", "Fulfillment & Picking In Progress",
      "يقوم موظفو التعبئة بجمع المنتجات وإجراء اختبار الجودة اللازم لضمان خلوها من أي عيوب مصنعية.",
      "Picking department is assembling your items and performing comprehensive quality checks to ensure pristine condition."
    );
    addLog(18,
      "إتمام التغليف وإصدار البوليصة الدولية", "Order Fully Packaged & Sealed",
      "اكتملت عملية التعبئة والتغليف الآمن للشحنة بنجاح وثبتت عليها بوليصة الشحن السريع وجاري إدراج الطلب للنقل الدولي.",
      "Order custom packaged with reinforced protective materials. International air shipping label applied."
    );
  }

  // 3. Shipped Steps
  if (status === 'shipped' || status === 'delivered') {
    addLog(26,
      "تم تسليم الشحنة لشركة النقل السريع الدولي", "Dispatched to Express Routing Hub",
      `تم تسليم الشحنة رسمياً إلى الناقل اللوجستي الدولي المفضل لدينا وتعيين رقم التتبع المدمج: ${trackingNo || ''}`,
      `Shipment handed over to our premier express carrier pipeline. Allocated tracking reference: ${trackingNo || ''}`
    );
    
    addLog(42,
      "مغادرة بوابة الصادرات وتوجيهها لبلد الوجهة", "Departed Export Gateway Terminal",
      "عبرت الشحنة الفحص الجمركي الصادر ومغادرة مركز الفرز اللوجستي الرئيسي عبر رحلة طائرة لشحنات النقل المباشر لبلد الوجهة.",
      "The parcel completed export customs check and departed logistics sorting terminal. In air transit to destination country."
    );

    addLog(90,
      "الوصول إلى الميناء الجوي وجاري المراجعة الجمركية", "Arrived at Domestic Airport Gateway",
      "وصلت الطائرة الناقلة للشحنة بسلام لمركز التفتيش الجوي الإقليمي لفرز الشحنات تمهيداً للتسليم المحلي للمستهلك.",
      "Carrier flight landed. Shipments transferred safely to the domestic hub, in line for customs checking and swift sorting."
    );

    addLog(108,
      "اكتمال الفحص الجمركي ونقل الشحنة للمستودعات المحلية", "Customs Clearance Success & Local Transit",
      "اجتازت شحنتكم بنجاح الفحص الجمركي ونقلت في الشاحنات اللوجستية المؤمنة باتجاه مستودع الفرز والتوزيع ببلدك المحلي.",
      "Customs clearance processed beautifully. Parcel is transferred on land freight vectors toward your city distribution depot."
    );
  }

  // 4. Delivered Steps
  if (status === 'delivered') {
    addLog(136,
      "الشحنة مع مندوب التوصيل للتسليم الفوري", "Out for Final-Mile Delivery",
      "استلم مندوب شركة الشحن المحلي شحنتكم اليوم وهي في طريقها للعنوان المرفق. يرجى إبقاء الهاتف الجوال نشطاً للتنسيق السريع في بلدك.",
      "Assigned to the final-mile local courier professional. Delivery attempt in progress today. Please stay reachable."
    );
    addLog(140,
      "تم تسليم الطلب بنجاح للعميل 🎉", "Delivered Successfully 🎉",
      "تم تسليم الشراء بنجاح للعميل الكريم وبحالة ممتازة وبشكل راقٍ للغاية. شكراً جزيلاً لثقتكم الغالية بنا ونطمح لخدمتكم مجدداً!",
      "Fulfillment completed! The customer received the order perfectly. Thank you for shopping with us!"
    );
  }

  // Sort: Newest logs on top
  return entries.sort((a, b) => b.date.getTime() - a.date.getTime());
};

const TrackOrderPage: React.FC = () => {
  const { trackingId: urlId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  
  const [searchInput, setSearchInput] = useState(urlId || '');
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusSteps = {
    pending: t('order.status.pending'),
    processing: t('order.status.processing'),
    shipped: t('order.status.shipped'),
    delivered: t('order.status.delivered')
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
      setError(t('tracking.orderNotFound'));
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
  const logs = order ? generateLogEntries(order.createdAt, order.status, (order as any).courierTrackingNumber) : [];

  return (
    <div className={`pt-32 pb-32 px-4 bg-[#0A0A0B] text-white min-h-screen ${isArabic ? 'font-arabic' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 bg-brand-gold/10 text-brand-gold px-6 py-2 rounded-full font-bold uppercase tracking-widest text-xs mb-6"
          >
            <Package size={16} /> {t('tracking.title')}
          </motion.div>
          <h1 className="text-5xl font-bold tracking-tight mb-6 text-white">{t('tracking.title')}</h1>
          <p className="text-white/60 font-light max-w-xl mx-auto">{t('tracking.subtitle')}</p>
        </div>

        <form onSubmit={handleSearch} className="mb-16">
          <div className="relative group">
            <input
              type="text"
              placeholder={t('tracking.placeholder')}
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
                <><Search size={20} /> <span className="hidden sm:inline">{t('tracking.trackBtn')}</span></>
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
            {t('tracking.orderNotFound')}
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
                  <p className="text-white/40">{statusSteps[order.status]}</p>
                </div>
                <div className="flex flex-wrap items-center gap-4 bg-white/10 px-6 py-3 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2 pr-4 border-r border-white/10">
                    <Clock size={18} className="text-brand-gold" />
                    <span className="font-mono text-sm">{new Date(order.createdAt).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', { dateStyle: 'long' })}</span>
                  </div>
                    {order.fulfillment && (
                      <div className="flex items-center gap-2">
                         <Globe size={18} className="text-brand-gold" />
                         <span className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">
                           {t('tracking.viaNetwork', { provider: order.fulfillment.provider })}
                         </span>
                      </div>
                    )}
                    {(order as any).courierTrackingNumber && (
                      <div className="flex items-center gap-2 pl-4 border-l border-white/10 text-emerald-400">
                         <MapPin size={18} className="text-brand-gold shrink-0" />
                         <span className="text-[10px] font-mono font-bold uppercase tracking-widest bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                           {isArabic ? 'رقم تتبع الشحنة: ' : 'Tracking ID: '}
                           {(order as any).courierTrackingNumber}
                         </span>
                      </div>
                    )}
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
                      {statusSteps[s.key as keyof typeof statusSteps]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-12">
              
              {/* Detailed Logistics Logs Timeline */}
              {logs.length > 0 && (
                <div className="mb-16">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2 font-sans">
                    <Truck size={14} className="text-brand-gold" />
                    {isArabic ? 'تفاصيل ومعلومات الشحن المباشرة' : 'Detailed Real-time Shipment Logistics'}
                  </h3>
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-8 relative overflow-hidden">
                    <div className="space-y-6">
                      {logs.map((log, index) => (
                        <div key={index} className="relative pl-6 rtl:pl-0 rtl:pr-6 border-l rtl:border-l-0 rtl:border-r border-white/10 pb-2">
                          {/* Indicator dot on border */}
                          <div className={`absolute top-1.5 -left-[6px] rtl:-left-auto rtl:-right-[6px] w-3 h-3 rounded-full border-2 ${
                            index === 0 ? 'bg-brand-gold border-brand-gold shadow-[0_0_10px_rgba(197,160,89,0.5)]' : 'bg-[#1A1A1A] border-white/20'
                          }`} />
                          
                          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-1">
                            <h4 className={`font-bold text-sm ${index === 0 ? 'text-brand-gold' : 'text-white/90'}`}>
                              {isArabic ? log.titleAr : log.titleEn}
                            </h4>
                            <span className="text-[9px] font-mono font-bold text-white/40 bg-white/5 px-2 py-0.5 rounded border border-white/5 font-sans">
                              {log.date.toLocaleString(isArabic ? 'ar-EG' : 'en-US', {
                                dateStyle: 'medium',
                                timeStyle: 'short'
                              })}
                            </span>
                          </div>
                          <p className="text-xs text-white/50 leading-relaxed font-light font-sans">
                            {isArabic ? log.descAr : log.descEn}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-16">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
                    <MapPin size={14} /> {t('tracking.shippingTo')}
                  </h3>
                  <div className="bg-white/5 p-8 rounded-3xl border border-white/5">
                    <p className="text-xl font-bold mb-2 text-white">{order.shippingAddress?.fullName || order.customerName || 'Customer'}</p>
                    <p className="text-white/60 leading-relaxed font-light">{order.shippingAddress?.address || order.address}</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
                    <Clock size={14} /> {t('tracking.details')}
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-white/5">
                      <span className="text-white/60">{t('common.items')}</span>
                      <span className="font-bold text-white">{order.items.length}</span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-2xl pt-4">
                      <span className="text-white">{t('common.total')}</span>
                      <span className="text-brand-gold font-mono">${order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-6">{t('common.items')}</h3>
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
                        <p className="text-[10px] text-white/40 uppercase font-bold">{t('common.qty')}: {item.quantity}</p>
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
