import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Sparkles, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const NewsletterPopup = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const isArabic = i18n.language === 'ar';

  useEffect(() => {
    const hasSeen = localStorage.getItem('newsletter_seen');
    if (!hasSeen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 5000); // Show after 5 seconds
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('newsletter_seen', 'true');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            id="newsletter-popup"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-[3rem] overflow-hidden max-w-2xl w-full shadow-2xl relative"
          >
            <button 
              onClick={handleClose}
              className="absolute top-6 right-6 z-10 p-2 hover:bg-brand-cream rounded-full transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col md:flex-row h-full">
              <div className="hidden md:block w-1/2 bg-[#0A0A0B] relative overflow-hidden p-12">
                 <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#4F46E5]/20 to-brand-gold/10" />
                 <div className="relative z-10 h-full flex flex-col justify-center text-white">
                   <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6 border border-white/10 backdrop-blur-md">
                     <Sparkles size={24} className="text-brand-gold" />
                   </div>
                   <h2 className="text-3xl font-black tracking-tighter mb-4 leading-tight">
                     Join the <br/>
                     <span className="text-brand-gold">VIP Club</span>
                   </h2>
                   <p className="text-white/40 text-sm leading-relaxed">
                     Get exclusive access to private sales, new collections, and beauty tips.
                   </p>
                 </div>
              </div>

              <div className="flex-1 p-8 md:p-12">
                {subscribed ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center"
                  >
                    <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-4">
                      <Send size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">
                       {isArabic ? 'شكراً لاشتراكك!' : 'Welcome to the Club!'}
                    </h3>
                    <p className="text-brand-charcoal/50 text-sm">
                       {isArabic ? 'ستستلم كود الخصم في بريدك قريباً' : 'Your exclusive discount is on its way.'}
                    </p>
                  </motion.div>
                ) : (
                  <>
                    <h3 className="text-2xl font-black tracking-tighter mb-2 text-brand-charcoal">
                      {isArabic ? 'وفر 15% اليوم' : 'Save 15% Today'}
                    </h3>
                    <p className="text-brand-charcoal/50 text-sm mb-8 leading-relaxed">
                      {isArabic ? 'اشترك في نشرتنا الإخبارية واحصل على خصم فوري على أول طلب لك.' : 'Join our newsletter and receive an instant discount on your first order.'}
                    </p>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-charcoal/20" size={18} />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          placeholder={isArabic ? 'البريد الإلكتروني' : 'Enter your email'}
                          className="w-full pl-12 pr-4 py-4 bg-brand-cream/50 border border-brand-charcoal/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-all font-medium text-brand-charcoal"
                        />
                      </div>
                      <button 
                        type="submit"
                        className="w-full bg-[#4F46E5] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-brand-charcoal hover:shadow-xl transition-all shadow-lg shadow-indigo-500/20"
                      >
                         {isArabic ? 'اشترك الآن' : 'Unlock Offer'}
                      </button>
                    </form>
                    <p className="mt-6 text-[10px] text-brand-charcoal/30 text-center uppercase tracking-widest leading-relaxed">
                       {isArabic ? 'لا توجد رسائل مزعجة. يمكنك الإلغاء في أي وقت.' : 'No spam. Unsubscribe anytime.'}
                    </p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
