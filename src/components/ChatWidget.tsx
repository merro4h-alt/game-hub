import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const ChatWidget: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{ text: string; sender: 'user' | 'support' }[]>([]);
  const [isSending, setIsSending] = useState(false);
  const isRtl = i18n.language === 'ar';

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!message.trim() || isSending) return;
    
    setIsSending(true);
    const currentMsg = message;

    // Add user message to state
    setMessages(prev => [...prev, { text: currentMsg, sender: 'user' }]);
    setMessage('');

    try {
      // Send email using FormSubmit (Free & No backend needed)
      await fetch('https://formsubmit.co/ajax/merro4h@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: "Customer Inquiry",
          message: currentMsg,
          _subject: "New Message from Trendifi Chat",
          _template: "table"
        })
      });

      // Simulate support response after successful send
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          text: isRtl 
            ? `شكراً لتواصلك معنا! لقد استلمنا رسالتك: "${currentMsg}". سنرد عليك في أقرب وقت ممكن عبر بريدك الإلكتروني.` 
            : `Thank you for reaching out! We received your message: "${currentMsg}". We will get back to you as soon as possible via email.`, 
          sender: 'support' 
        }]);
        setIsSending(false);
      }, 1000);
    } catch (error) {
      console.error('Email send error:', error);
      setMessages(prev => [...prev, { 
        text: isRtl ? "عذراً، حدث خطأ في إرسال الرسالة. يرجى المحاولة مرة أخرى." : "Sorry, there was an error sending the message. Please try again.", 
        sender: 'support' 
      }]);
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 overflow-visible">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 right-0 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-brand-charcoal/10 overflow-hidden flex flex-col"
            style={{ height: '500px' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-charcoal to-brand-charcoal/90 text-brand-cream p-6 flex justify-between items-center">
              <div>
                <h3 className="font-bold tracking-tight text-lg">{t('order.chat.title')}</h3>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-brand-gold rounded-full animate-pulse" />
                  <span className="text-[10px] uppercase tracking-widest text-[#D4AF37]/60">Online</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  href="https://wa.me/966500000000" // Replace with real number
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center text-green-400"
                  title="WhatsApp Support"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.412 0 12.048c0 2.12.554 4.189 1.605 5.969L0 24l6.12-1.605a11.756 11.756 0 005.926 1.579h.005c6.634 0 12.045-5.412 12.048-12.049a11.82 11.82 0 00-3.53-8.388z"/>
                  </svg>
                </a>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="hover:rotate-90 transition-transform duration-300 p-2"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 p-6 overflow-y-auto bg-brand-cream/10 space-y-4">
              <div className={`flex ${isRtl ? 'justify-start' : 'justify-start'}`}>
                <div className="bg-white border border-brand-charcoal/5 p-4 rounded-2xl rounded-tl-none shadow-sm max-w-[80%]">
                  <p className="text-sm font-light text-brand-charcoal leading-relaxed">
                    {t('order.chat.welcome')}
                  </p>
                </div>
              </div>

              {messages.map((msg, idx) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={idx} 
                  className={`flex ${msg.sender === 'user' ? (isRtl ? 'justify-start' : 'justify-end') : (isRtl ? 'justify-start' : 'justify-start')}`}
                >
                  <div className={`p-4 rounded-2xl max-w-[80%] shadow-sm ${
                    msg.sender === 'user' 
                      ? 'bg-[#4F46E5] text-white rounded-tr-none' 
                      : 'bg-white border border-brand-charcoal/5 text-brand-charcoal rounded-tl-none'
                  }`}>
                    <p className="text-sm font-light leading-relaxed">
                      {msg.text}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-brand-charcoal/5">
              <div className="relative">
                <input 
                  type="text" 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('order.chat.inputPlaceholder')}
                  className={`w-full bg-brand-charcoal/5 border-none rounded-2xl py-4 ${isRtl ? 'pr-6 pl-14' : 'pl-6 pr-14'} text-sm text-brand-charcoal focus:ring-1 focus:ring-[#4F46E5] outline-none`}
                />
                <button 
                  type="submit"
                  className={`absolute top-1/2 -translate-y-1/2 ${isRtl ? 'left-4' : 'right-4'} text-[#4F46E5] hover:scale-110 transition-all duration-300 disabled:opacity-30`}
                  disabled={!message.trim()}
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] text-white rounded-full shadow-2xl flex items-center justify-center relative group overflow-hidden border border-white/10"
      >
        <div className="absolute inset-0 bg-brand-charcoal translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
        <span className="relative z-10 transition-transform duration-500 group-hover:text-white">
          {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
        </span>
      </motion.button>
    </div>
  );
};
