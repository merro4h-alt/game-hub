import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Loader2, ArrowRight, ArrowLeft, PhoneOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../StoreContext';
import {
  DEFAULT_STORE_WHATSAPP_LOCAL,
  normalizeWhatsAppPhone,
  openExternalLink,
} from '../utils/whatsapp';

const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" className={`${className} fill-current`} aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .004 5.412 0 12.048c0 2.12.554 4.189 1.605 5.969L0 24l6.12-1.605a11.756 11.756 0 005.926 1.579h.005c6.634 0 12.045-5.412 12.048-12.049a11.82 11.82 0 00-3.53-8.388z" />
  </svg>
);

export const ChatWidget: React.FC = () => {
  const { i18n } = useTranslation();
  const { settings } = useStore();
  const isRtl = i18n.language.startsWith('ar');

  const [isOpen, setIsOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [confirmedPhone, setConfirmedPhone] = useState('');
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<{
    text: string;
    sender: 'user' | 'support';
    waUrl?: string;
  }[]>([]);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messageInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Clean up legacy localStorage key so phone number entry is always intentional
    try {
      localStorage.removeItem('customer_phone_for_whatsapp');
      localStorage.removeItem('customer_name_for_whatsapp');
    } catch {
      // ignore storage errors
    }

    const handleOpenPrompt = () => {
      setIsOpen(true);
    };
    window.addEventListener('open-whatsapp-prompt', handleOpenPrompt);
    return () => {
      window.removeEventListener('open-whatsapp-prompt', handleOpenPrompt);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  useEffect(() => {
    if (isOpen && confirmedPhone && !isEditingPhone) {
      const timer = setTimeout(() => {
        messageInputRef.current?.focus();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [isOpen, confirmedPhone, isEditingPhone]);

  const handleConfirmPhone = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = phoneInput.replace(/\s+/g, '').trim();
    const digitsOnly = cleaned.replace(/[^\d]/g, '');

    if (!cleaned) {
      setPhoneError(
        isRtl ? 'يرجى إدخال رقم هاتفك للمتابعة' : 'Please enter your phone number to continue'
      );
      return;
    }

    if (digitsOnly.length < 8) {
      setPhoneError(
        isRtl ? 'يرجى إدخال رقم هاتف صحيح' : 'Please enter a valid phone number'
      );
      return;
    }

    setPhoneError('');
    setConfirmedPhone(cleaned);
    setIsEditingPhone(false);
  };

  const handleEndChat = () => {
    setMessages([]);
    setMessage('');
    setConfirmedPhone('');
    setPhoneInput('');
    setPhoneError('');
    setIsEditingPhone(false);
    setIsSending(false);
    setIsOpen(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isSending) return;

    if (!confirmedPhone || confirmedPhone.replace(/[^\d]/g, '').length < 8) {
      setIsEditingPhone(true);
      return;
    }

    const cleanWa = normalizeWhatsAppPhone(settings?.whatsappNumber || DEFAULT_STORE_WHATSAPP_LOCAL);
    const waText =
      `💬 *رسالة جديدة من متجر ONXIFI*\n` +
      `📞 رقم العميل: ${confirmedPhone}\n` +
      `✉️ الرسالة:\n${trimmedMessage}`;
    const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(waText)}`;

    setMessage('');
    setIsSending(true);
    setMessages((prev) => [...prev, { text: trimmedMessage, sender: 'user' }]);

    // Direct WhatsApp dispatch: immediately open WhatsApp so the message arrives directly on the owner's WhatsApp
    try {
      openExternalLink(waUrl);
    } catch (e) {
      console.log('Direct WhatsApp launch:', e);
    }

    try {
      const response = await fetch('/api/whatsapp/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          customerPhone: confirmedPhone,
          message: trimmedMessage,
          pageUrl: window.location.href,
          whatsappNumber: cleanWa,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send message');
      }

      setMessages((prev) => [
        ...prev,
        {
          text: isRtl
            ? `تم توجيه رسالتك إلى واتساب المتجر مباشرة! إذا لم يفتح تطبيق واتساب تلقائياً، اضغط على الزر أدناه لمتابعة المحادثة:`
            : `Your message was forwarded directly to store WhatsApp! If WhatsApp did not open automatically, tap below to continue:`,
          sender: 'support',
          waUrl,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          text: isRtl
            ? `تم تجهيز رسالتك للإرسال إلى واتساب المتجر مباشرة. اضغط على الزر أدناه لإرسالها الآن:`
            : `Your message is ready. Tap below to send it directly via WhatsApp:`,
          sender: 'support',
          waUrl,
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const showPhoneGate = !confirmedPhone || isEditingPhone;

  return (
    <div className="fixed bottom-6 right-6 z-50" dir={isRtl ? 'rtl' : 'ltr'}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-[72px] right-0 w-[336px] sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
          >
            {/* Clean Header */}
            <div className="bg-[#111413] text-white px-4 py-3.5 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#25D366] text-white flex items-center justify-center shrink-0">
                  <WhatsAppIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm leading-tight truncate">
                    {isRtl ? 'دردشة الواتساب' : 'WhatsApp Chat'}
                  </h3>
                  <p className="text-[11px] text-white/60 truncate mt-0.5">
                    {isRtl ? 'تواصل مباشر مع المتجر' : 'Direct store support'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleEndChat}
                  className="h-8 px-2.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 text-red-300 hover:text-red-200 border border-red-500/25 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <PhoneOff size={13} />
                  <span>{isRtl ? 'إنهاء الدردشة' : 'End Chat'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label={isRtl ? 'تصغير المحادثة' : 'Minimize chat'}
                  title={isRtl ? 'تصغير المحادثة' : 'Minimize chat'}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/65 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            {showPhoneGate ? (
              /* Step 1: Mandatory Customer Phone Number Gate */
              <form onSubmit={handleConfirmPhone} className="p-6 space-y-5 bg-white">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center mx-auto">
                    <WhatsAppIcon className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-semibold text-slate-900">
                    {isRtl ? 'أدخل رقم هاتفك للتواصل' : 'Enter your phone number'}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {isRtl
                      ? 'لبدء المحادثة، يرجى إدخال رقم هاتفك على الواتساب ليتمكن فريقنا من الرد عليك.'
                      : 'To start chatting, please enter your WhatsApp phone number so our team can reply to you.'}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="customer-whatsapp-phone"
                    className="block text-xs font-medium text-slate-700"
                  >
                    {isRtl ? 'رقم الهاتف (مطلوب)' : 'Phone Number (Required)'}
                  </label>
                  <input
                    id="customer-whatsapp-phone"
                    type="tel"
                    inputMode="tel"
                    dir="ltr"
                    autoFocus
                    value={phoneInput}
                    onChange={(e) => {
                      setPhoneInput(e.target.value);
                      if (phoneError) setPhoneError('');
                    }}
                    placeholder="07XXXXXXXXX"
                    className={`w-full h-12 px-4 rounded-xl bg-slate-50 border ${
                      phoneError
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-slate-200 focus:border-[#25D366]'
                    } text-slate-900 text-base font-medium tabular-nums text-center outline-none transition-colors placeholder:text-slate-400 placeholder:font-normal`}
                  />
                  {phoneError && (
                    <p className="text-xs text-red-600 font-medium pt-0.5">{phoneError}</p>
                  )}
                </div>

                <div className="flex items-center gap-2.5">
                  {confirmedPhone && (
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneInput(confirmedPhone);
                        setPhoneError('');
                        setIsEditingPhone(false);
                      }}
                      className="h-11 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      {isRtl ? 'إلغاء' : 'Cancel'}
                    </button>
                  )}
                  <button
                    type="submit"
                    className="flex-1 h-11 px-5 rounded-xl bg-[#25D366] hover:bg-[#1fb855] text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                  >
                    <span>
                      {confirmedPhone
                        ? isRtl
                          ? 'تحديث الرقم'
                          : 'Save Number'
                        : isRtl
                          ? 'بدء المحادثة'
                          : 'Start Chat'}
                    </span>
                    {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                  </button>
                </div>
              </form>
            ) : (
              /* Step 2: Clean & Easy Chat Screen */
              <>
                <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between text-xs shrink-0">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <span>{isRtl ? 'رقمك:' : 'Your phone:'}</span>
                    <span dir="ltr" className="font-semibold text-slate-900 tabular-nums">
                      {confirmedPhone}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://wa.me/${normalizeWhatsAppPhone(settings?.whatsappNumber || DEFAULT_STORE_WHATSAPP_LOCAL)}?text=${encodeURIComponent(
                        isRtl
                          ? `مرحباً متجر ONXIFI، أود التواصل معكم عبر واتساب. رقم هاتفي: ${confirmedPhone}`
                          : `Hello ONXIFI Store, I would like to chat via WhatsApp. My phone: ${confirmedPhone}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#16a34a] hover:text-[#15803d] py-1 px-2 rounded-lg bg-[#25D366]/10 hover:bg-[#25D366]/20 transition-colors cursor-pointer"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'واتساب مباشر' : 'Direct WhatsApp'}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneInput(confirmedPhone);
                        setPhoneError('');
                        setIsEditingPhone(true);
                      }}
                      className="text-slate-500 hover:text-slate-700 font-semibold cursor-pointer py-1 px-1"
                    >
                      {isRtl ? 'تغيير' : 'Change'}
                    </button>
                  </div>
                </div>

                <div className="h-[310px] sm:h-[340px] p-4 overflow-y-auto bg-[#F8FAF9] space-y-3">
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200/80 p-3.5 rounded-2xl max-w-[88%] shadow-xs">
                      <p className="text-sm text-slate-800 leading-relaxed">
                        {isRtl
                          ? 'مرحباً بك! اكتب استفسارك بالأسفل وسيتم توجيهه مباشرة إلى واتساب المتجر.'
                          : 'Welcome! Type your message below and it will reach our store WhatsApp directly.'}
                      </p>
                      <div className="mt-2.5 pt-2 border-t border-slate-100">
                        <a
                          href={`https://wa.me/${normalizeWhatsAppPhone(settings?.whatsappNumber || DEFAULT_STORE_WHATSAPP_LOCAL)}?text=${encodeURIComponent(
                            isRtl
                              ? `مرحباً متجر ONXIFI، أود الاستفسار بخصوص المنتجات. رقم هاتفي: ${confirmedPhone}`
                              : `Hello ONXIFI Store, I have an inquiry. My phone: ${confirmedPhone}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1fb855] text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5" />
                          <span>{isRtl ? 'فتح محادثة واتساب فورية' : 'Chat on WhatsApp Now'}</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`px-4 py-3 rounded-2xl max-w-[85%] whitespace-pre-line ${
                          msg.sender === 'user'
                            ? 'bg-[#111413] text-white'
                            : 'bg-white border border-slate-200/80 text-slate-800 shadow-xs'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{msg.text}</p>
                        {msg.waUrl && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100">
                            <a
                              href={msg.waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1fb855] text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
                            >
                              <WhatsAppIcon className="w-4 h-4" />
                              <span>{isRtl ? 'فتح المحادثة في واتساب مباشرة' : 'Open in WhatsApp Directly'}</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isSending && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-slate-200/80 text-slate-600 px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2">
                        <Loader2 size={14} className="animate-spin text-[#25D366]" />
                        <span>{isRtl ? 'جاري إرسال رسالتك...' : 'Sending your message...'}</span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                <form
                  onSubmit={handleSend}
                  className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
                >
                  <input
                    ref={messageInputRef}
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={isRtl ? 'اكتب رسالتك هنا...' : 'Type your message...'}
                    className="flex-1 h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:border-[#25D366] text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={!message.trim() || isSending}
                    aria-label={isRtl ? 'إرسال' : 'Send'}
                    className="w-11 h-11 rounded-xl bg-[#25D366] hover:bg-[#1fb855] disabled:opacity-40 text-white flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isRtl ? 'دردشة الواتساب' : 'WhatsApp Chat'}
        className="w-14 h-14 sm:w-15 sm:h-15 bg-[#25D366] hover:bg-[#1fb855] text-white rounded-full shadow-xl flex items-center justify-center transition-colors cursor-pointer"
      >
        {isOpen ? <X size={25} /> : <WhatsAppIcon className="w-7 h-7" />}
      </motion.button>
    </div>
  );
};
