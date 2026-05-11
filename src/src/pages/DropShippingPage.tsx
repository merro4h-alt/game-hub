import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useAlert } from '../contexts/AlertContext';
import { Package, Truck, Percent, RefreshCcw, Send, CheckCircle2, ShieldCheck, Globe, X, MapPin } from 'lucide-react';

const DropShippingPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { showAlert } = useAlert();
  const isArabic = i18n.language === 'ar';
  const [formStatus, setFormStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [showGlobalInfo, setShowGlobalInfo] = useState(false);
  const formRef = useRef<HTMLElement>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('loading');
    
    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const data = {
        fullName: formData.get('fullName'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        email: formData.get('email'),
        storeUrl: formData.get('storeUrl') || '',
        experience: formData.get('experience'),
        status: 'pending',
        createdAt: new Date().toISOString(),
        type: 'dropshipping_application'
      };

      // Import database tools dynamically
      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');

      await addDoc(collection(db, 'dropshipping_applications'), {
        ...data,
        createdAt: serverTimestamp()
      });

      setFormStatus('success');
    } catch (error) {
      console.error('Error submitting application:', error);
      showAlert(t('common.error'), 'error');
      setFormStatus('idle');
    }
  };

  const benefits = [
    {
      icon: <Globe className="text-brand-gold" size={24} />,
      title: t('dropshipping.benefits.sourcing'),
      desc: isArabic ? 'نبحث في الأسواق العالمية لنوفر لك المنتجات الأكثر طلباً.' : 'We search global markets to bring you the most in-demand products.'
    },
    {
      icon: <Package className="text-brand-gold" size={24} />,
      title: t('dropshipping.benefits.quality'),
      desc: isArabic ? 'نقوم باختبار جودة كل منتج مع الموردين قبل عرضه في متجرنا.' : 'We test the quality of every product with suppliers before listing.'
    },
    {
      icon: <Send className="text-brand-gold" size={24} />,
      title: t('dropshipping.benefits.auto'),
      desc: isArabic ? 'بمجرد طلبك، يتحول الطلب فوراً للمورد لضمان أسرع معالجة.' : 'Once you order, it goes straight to the supplier for fastest processing.'
    },
    {
      icon: <Truck className="text-brand-gold" size={24} />,
      title: t('dropshipping.benefits.direct'),
      desc: isArabic ? 'يقوم المورد بشحن المنتج مباشرة إلى باب منزلك.' : 'The supplier ships the product directly to your doorstep.'
    }
  ];

  return (
    <div className="min-h-screen bg-brand-cream pb-20">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden bg-brand-charcoal text-white pt-20">
        <div className="absolute inset-0 opacity-20">
          <img 
            src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=2000" 
            alt="Global Supply Chain" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-charcoal via-brand-charcoal/80 to-transparent" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:w-3/5 text-left"
            >
              <span className="inline-block px-4 py-2 rounded-full bg-brand-gold/20 border border-brand-gold/30 text-brand-gold text-[10px] font-black uppercase tracking-[0.4em] mb-8">
                {t('dropshipping.smartSupplyChain')}
              </span>
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 uppercase leading-[0.9]">
                {t('dropshipping.heroTitle')}
              </h1>
              <p className="text-white/60 text-xl font-medium leading-relaxed max-w-2xl mb-10">
                {t('dropshipping.heroDesc')}
              </p>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={scrollToForm}
                  className="px-6 sm:px-8 py-4 bg-brand-gold text-brand-charcoal font-black rounded-2xl uppercase tracking-widest text-[10px] sm:text-xs hover:bg-white transition-all transform hover:-translate-y-1"
                >
                  {t('dropshipping.getStarted')}
                </button>
                <button 
                  onClick={() => setShowGlobalInfo(true)}
                  className="flex items-center gap-3 px-6 sm:px-8 py-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/10 transition-all group"
                >
                  <Globe className="text-brand-gold group-hover:rotate-12 transition-transform" size={18} />
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest leading-none">{t('dropshipping.globalCoverage')}</span>
                </button>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="lg:w-2/5 hidden lg:block"
            >
              <div className="relative group">
                <div className="absolute -inset-4 bg-brand-gold/20 rounded-[40px] blur-2xl group-hover:bg-brand-gold/30 transition-all duration-500" />
                <div className="relative aspect-square rounded-[40px] overflow-hidden border border-white/10 shadow-2xl">
                  <img 
                    src="https://images.unsplash.com/photo-1566576721346-d4a3b4eaad5b?auto=format&fit=crop&q=80&w=800" 
                    alt="Packaging" 
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal via-transparent to-transparent opacity-60" />
                  <div className="absolute bottom-8 left-8 right-8">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl">
                      <p className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-1">{t('dropshipping.benefits.direct')}</p>
                      <p className="text-white text-xs font-bold">{t('dropshipping.factoryToDoor')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How it works for CUSTOMERS */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-black text-brand-charcoal uppercase tracking-tighter mb-4">
            {t('dropshipping.productJourney')}
          </h2>
          <p className="text-brand-gold font-bold uppercase text-xs tracking-widest">{t('dropshipping.fromFactoryDirect')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {/* Connector Line (Desktop) */}
          <div className="hidden md:block absolute top-[40px] left-0 right-0 h-0.5 bg-brand-gold/20 -z-0" />
          
          {[
            { title: i18n.language === 'ar' ? 'اختيار الذكاء' : 'AI Selection', icon: '01' },
            { title: i18n.language === 'ar' ? 'تأكيد الطلب' : 'Order Sync', icon: '02' },
            { title: i18n.language === 'ar' ? 'تحضير المورد' : 'Supplier Prep', icon: '03' },
            { title: i18n.language === 'ar' ? 'شحن الباب' : 'Door Delivery', icon: '04' }
          ].map((item, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 bg-white border-4 border-brand-cream rounded-full flex items-center justify-center text-3xl font-black text-brand-gold shadow-xl mb-6">
                {item.icon}
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight text-brand-gold">{item.title}</h3>
            </div>
          ))}
        </div>
      </section>


      {/* Application Form Section */}
      <section ref={formRef} className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-brand-charcoal rounded-[40px] overflow-hidden shadow-2xl flex flex-col lg:flex-row">
          <div className="lg:w-1/2 p-12 sm:p-16 flex flex-col justify-center">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tighter uppercase mb-8">
              {t('dropshipping.applyNow')}
            </h2>
            <div className="space-y-6">
              {[
                i18n.language === 'ar' ? "أسعار تفضيلية للموزعين" : "Preferred wholesale pricing",
                i18n.language === 'ar' ? "دعم فني مخصص على مدار الساعة" : "24/7 dedicated support",
                i18n.language === 'ar' ? "وصول حصري للمجموعات الجديدة" : "Exclusive access to new collections",
                i18n.language === 'ar' ? "تدريب وتسويق مجاني" : "Complimentary marketing training"
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-4 text-white/80">
                  <div className="w-6 h-6 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-gold flex-shrink-0">
                    <CheckCircle2 size={14} />
                  </div>
                  <span className="font-bold text-sm tracking-tight">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:w-1/2 p-12 sm:p-16 bg-white/5 backdrop-blur-md border-l border-white/10">
            {formStatus === 'success' ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center text-center"
              >
                <div className="w-20 h-20 bg-brand-gold rounded-full flex items-center justify-center text-white mb-6 shadow-xl shadow-brand-gold/20">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-2xl font-black text-white uppercase mb-4 leading-tight">
                  {t('dropshipping.success.title')}
                </h3>
                <div className="space-y-4 max-w-sm">
                  <p className="text-white/70 font-medium text-sm leading-relaxed">
                    {t('dropshipping.success.desc1')}
                  </p>
                  <p className="text-brand-gold font-bold text-sm leading-relaxed">
                    {t('dropshipping.success.desc2')}
                  </p>
                </div>

                <button 
                  onClick={() => window.location.href = '/'}
                  className="mt-8 px-8 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all border border-white/10"
                >
                  {t('dropshipping.backToHome')}
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold px-1">{t('dropshipping.form.fullName')}</label>
                    <input 
                      required
                      name="fullName"
                      type="text" 
                      className="w-full bg-white/5 border-white/10 text-white rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-brand-gold transition-all"
                      placeholder={i18n.language === 'ar' ? 'أحمد محمد' : 'John Doe'}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold px-1">{t('dropshipping.form.phone')}</label>
                    <input 
                      required
                      name="phone"
                      type="tel" 
                      className="w-full bg-white/5 border-white/10 text-white rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-brand-gold transition-all"
                      placeholder="+966 50 XXX XXXX"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold px-1">{t('dropshipping.fullAddress')}</label>
                  <input 
                    required
                    name="address"
                    type="text" 
                    className="w-full bg-white/5 border-white/10 text-white rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-brand-gold transition-all"
                    placeholder={i18n.language === 'ar' ? 'الدولة، المدينة، الحي، الشارع' : 'Country, City, District, Street'}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-brand-gold px-1">{t('dropshipping.form.email')}</label>
                  <input 
                    required
                    name="email"
                    type="email" 
                    className="w-full bg-white/5 border-white/10 text-white rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-brand-gold transition-all"
                    placeholder="john@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 px-1">{t('dropshipping.storeUrlOptional')}</label>
                  <input 
                    name="storeUrl"
                    type="url" 
                    className="w-full bg-white/5 border-white/10 text-white rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-brand-gold transition-all"
                    placeholder="https://mystore.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40 px-1">{t('dropshipping.form.experience')}</label>
                  <select 
                    name="experience"
                    className="w-full bg-white/5 border-white/10 text-white rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-brand-gold transition-all appearance-none"
                  >
                    <option value="none" className="bg-brand-charcoal">{t('dropshipping.experienceLevels.none')}</option>
                    <option value="some" className="bg-brand-charcoal">{t('dropshipping.experienceLevels.intermediate')}</option>
                    <option value="expert" className="bg-brand-charcoal">{t('dropshipping.experienceLevels.expert')}</option>
                  </select>
                </div>

                <button 
                  type="submit"
                  disabled={formStatus === 'loading'}
                  className="w-full bg-brand-gold text-brand-charcoal font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-white transition-all transform active:scale-95 disabled:opacity-50"
                >
                  {formStatus === 'loading' ? (
                    <div className="w-5 h-5 border-2 border-brand-charcoal/30 border-t-brand-charcoal rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={18} />
                      <span className="uppercase tracking-widest text-sm">{t('dropshipping.form.submit')}</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Global Coverage Modal */}
      <AnimatePresence>
        {showGlobalInfo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGlobalInfo(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-brand-charcoal rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 flex items-center justify-center text-brand-gold border border-brand-gold/20">
                    <Globe size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tighter text-white">
                      {t('dropshipping.globalModal.title')}
                    </h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-gold">
                      {t('dropshipping.factoryToDoor')}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowGlobalInfo(false)}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-8">
                <p className="text-white/60 leading-relaxed text-sm">
                  {t('dropshipping.globalModal.desc')}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { region: i18n.language === 'ar' ? 'دول الخليج' : 'GCC Countries', delivery: '5-9 Days' },
                    { region: i18n.language === 'ar' ? 'الولايات المتحدة' : 'United States', delivery: '7-12 Days' },
                    { region: i18n.language === 'ar' ? 'أوروبا' : 'Europe', delivery: '6-10 Days' },
                    { region: i18n.language === 'ar' ? 'باقي الدول' : 'Rest of World', delivery: '10-15 Days' }
                  ].map((area, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                      <div className="w-10 h-10 rounded-full bg-brand-gold/20 flex items-center justify-center text-brand-gold">
                        <MapPin size={18} />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-white">{area.region}</p>
                        <p className="text-[10px] font-bold text-white/40 uppercase">{area.delivery}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-6 rounded-2xl bg-brand-gold/10 border border-brand-gold/20 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand-gold flex items-center justify-center text-brand-charcoal">
                    <Truck size={16} />
                  </div>
                  <p className="text-xs font-bold text-brand-gold leading-tight italic">
                    {t('dropshipping.globalModal.trackDesc')}
                  </p>
                </div>
              </div>

              <div className="p-8 bg-black/20 flex justify-end">
                <button 
                  onClick={() => setShowGlobalInfo(false)}
                  className="px-8 py-3 bg-brand-gold text-brand-charcoal font-black rounded-xl uppercase tracking-widest text-[10px] hover:bg-white transition-all"
                >
                  {t('dropshipping.globalModal.understood')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DropShippingPage;
