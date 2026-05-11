import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Send, User, Bot, Loader2, Wand2, Globe, ShoppingCart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { getBeautyAdvice } from '../services/geminiService';
import { useStore } from '../StoreContext';

export const BeautyAIConsultant = () => {
  const { i18n } = useTranslation();
  const { products, addToCart } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'model'; parts: { text: string }[] }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isArabic = i18n.language === 'ar';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const advice = await getBeautyAdvice(userMsg, products, chatHistory);
      
      setMessages(prev => [...prev, { role: 'ai', content: advice || (isArabic ? 'عذراً، لم أستطع معالجة طلبك.' : 'Sorry, I couldn\'t process your request.') }]);
      
      // Update history for next turn
      setChatHistory(prev => [
        ...prev,
        { role: 'user', parts: [{ text: userMsg }] },
        { role: 'model', parts: [{ text: advice || '' }] }
      ]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', content: isArabic ? 'حدث خطأ ما. يرجى المحاولة لاحقاً.' : 'An error occurred. Please try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getSuggestedProducts = (content: string) => {
    // Look for bold product names like **Product Name**
    const matches = content.match(/\*\*(.*?)\*\*/g);
    if (!matches) return [];
    
    return matches.map(m => m.replace(/\*\*/g, '').trim())
      .map(name => products.find(p => p.name.toLowerCase() === name.toLowerCase()))
      .filter((p): p is any => !!p);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        id="beauty-ai-toggle"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 sm:right-12 z-[70] w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-full shadow-2xl flex items-center justify-center border-4 border-white dark:border-[#1A1A1A] group overflow-hidden"
      >
        <motion.div
           animate={{ rotate: [0, 15, -15, 0] }}
           transition={{ duration: 2, repeat: Infinity }}
        >
          <Wand2 size={24} />
        </motion.div>
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
      </motion.button>

      {/* Main UI */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="beauty-ai-modal"
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="fixed bottom-24 right-6 sm:right-12 z-[80] w-[calc(100vw-3rem)] sm:w-[500px] h-[700px] max-h-[85vh] bg-white dark:bg-[#111] rounded-[2rem] shadow-[0_32px_64px_rgba(0,0,0,0.4)] flex flex-col border border-brand-charcoal/5 dark:border-white/5 overflow-hidden"
            dir={isArabic ? 'rtl' : 'ltr'}
          >
            {/* Header */}
            <div className="p-6 bg-gradient-to-br from-pink-500 to-rose-600 text-white flex justify-between items-center shrink-0">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                   <Sparkles size={20} className="text-white" />
                 </div>
                 <div>
                   <h3 className="font-black tracking-tight leading-none mb-1">
                     {isArabic ? 'مستشار التجميل' : 'Beauty AI'}
                   </h3>
                   <span className="text-[10px] uppercase font-bold opacity-70 tracking-widest leading-none">
                     Powered by Gemini
                   </span>
                 </div>
               </div>
               
               <div className="flex items-center gap-2">
                 {/* Language Toggle */}
                 <button 
                   onClick={() => i18n.changeLanguage(isArabic ? 'en' : 'ar')}
                   className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center gap-1.5"
                   title={isArabic ? 'Switch to English' : 'تغيير للغة العربية'}
                 >
                   <Globe size={18} />
                   <span className="text-[10px] font-bold uppercase tracking-tight">
                     {isArabic ? 'EN' : 'AR'}
                   </span>
                 </button>

                 <button 
                   onClick={() => setIsOpen(false)}
                   className="p-2 hover:bg-white/10 rounded-full transition-colors"
                 >
                   <X size={20} />
                 </button>
               </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar bg-brand-cream/30 dark:bg-black/20">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-white/50 dark:bg-white/5 rounded-[2rem] border border-dashed border-brand-charcoal/10 dark:border-white/10">
                   <div className="w-16 h-16 bg-pink-100 dark:bg-rose-500/10 text-pink-500 rounded-full flex items-center justify-center mb-4">
                     <Wand2 size={32} />
                   </div>
                   <h4 className="text-lg font-bold mb-2">
                     {isArabic ? 'كيف يمكنني مساعدتك اليوم؟' : 'Ready for your makeover?'}
                   </h4>
                   <p className="text-sm text-brand-charcoal/50 dark:text-white/40 mb-6 px-4">
                     {isArabic ? 'اسألني عن روتين العناية بالبشرة، اقتراحات المكياج، أو منتجاتنا.' : 'Ask me about skincare routines, makeup suggestions, or our products.'}
                   </p>
                   <div className="flex flex-wrap gap-2 justify-center">
                      {[
                        isArabic ? 'روتين للبشرة الدهنية' : 'Oily skin routine',
                        isArabic ? 'أفضل أحمر شفاه' : 'Best lipstick shades',
                        isArabic ? 'منتجات طبيعية' : 'Natural products'
                      ].map(suggestion => (
                        <button 
                          key={suggestion}
                          onClick={() => { setInput(suggestion); }}
                          className="px-4 py-1.5 bg-white dark:bg-white/5 border border-brand-charcoal/5 dark:border-white/5 rounded-full text-[10px] font-bold uppercase tracking-widest hover:border-pink-500 hover:text-pink-500 transition-all font-mono"
                        >
                          {suggestion}
                        </button>
                      ))}
                   </div>
                </div>
              )}

              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      msg.role === 'user' 
                        ? 'bg-brand-charcoal dark:bg-white/10 text-white' 
                        : 'bg-rose-500 text-white'
                    }`}>
                      {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-brand-charcoal dark:bg-white/10 text-white rounded-tr-none' 
                        : 'bg-white dark:bg-white/5 text-brand-charcoal dark:text-white rounded-tl-none shadow-sm'
                    }`}>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                  
                  {/* Product Cards Extension */}
                  {msg.role === 'ai' && (
                    <div className="mt-4 flex flex-col gap-3 w-full pl-11 rtl:pl-0 rtl:pr-11">
                       {getSuggestedProducts(msg.content).map((product: any) => (
                         <motion.div 
                           key={product.id}
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           className="flex items-center gap-4 p-3 bg-white dark:bg-white/5 rounded-2xl border border-brand-charcoal/5 dark:border-white/5 group"
                         >
                           <img 
                             src={product.image} 
                             alt={product.name} 
                             className="w-16 h-16 object-contain bg-brand-cream/30 dark:bg-black/20 rounded-xl"
                             referrerPolicy="no-referrer"
                           />
                           <div className="flex-1 min-w-0">
                             <h5 className="text-xs font-black uppercase tracking-tight truncate">{product.name}</h5>
                             <p className="text-[10px] text-brand-charcoal/50 dark:text-white/40 truncate">{product.description}</p>
                             <div className="mt-1 flex items-center justify-between">
                               <span className="text-xs font-bold font-mono text-rose-500">${product.price}</span>
                               <button 
                                 onClick={() => addToCart(product, product.colors[0], product.sizes[0])}
                                 className="p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20"
                               >
                                 <ShoppingCart size={14} />
                               </button>
                             </div>
                           </div>
                         </motion.div>
                       ))}
                    </div>
                  )}
                </motion.div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-3 items-center text-pink-500">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-xs font-bold uppercase tracking-widest">
                       {isArabic ? 'المستشار يفكر...' : 'Expert is thinking...'}
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form 
              onSubmit={handleSend}
              className="p-6 bg-white dark:bg-[#111] border-t border-brand-charcoal/5 dark:border-white/5"
            >
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isArabic ? 'اكتب رسالتك...' : 'Type your message...'}
                  className="w-full ps-6 pe-14 py-4 bg-brand-cream/50 dark:bg-white/5 border border-brand-charcoal/5 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all text-sm font-medium text-brand-charcoal dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute end-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-rose-500 text-white rounded-xl flex items-center justify-center hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:grayscale shadow-lg shadow-rose-500/20"
                >
                  <Send size={18} className={isArabic ? '-scale-x-100' : ''} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
