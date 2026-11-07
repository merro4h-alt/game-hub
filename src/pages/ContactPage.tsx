import React, { useState } from 'react';
import { Mail, MapPin, Send, MessageCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../StoreContext';

const ContactPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { settings } = useStore();
  const isArabic = i18n.language.startsWith('ar');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSending) return;
    setErrorMsg('');

    if (!phone.trim() || phone.replace(/[^\d]/g, '').length < 8) {
      setErrorMsg(
        isArabic
          ? 'يرجى إدخال رقم هاتفك الصحيح للتواصل.'
          : 'Please enter a valid phone number to contact us.'
      );
      return;
    }

    setIsSending(true);
    try {
      const fullName = `${firstName} ${lastName}`.trim();
      const res = await fetch('/api/whatsapp/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: fullName,
          customerPhone: phone.trim(),
          customerEmail: email.trim(),
          message: message.trim(),
          pageUrl: window.location.href,
          whatsappNumber: settings?.whatsappNumber,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed');
      }

      setSentSuccess(true);
      setFirstName('');
      setLastName('');
      setPhone('');
      setEmail('');
      setMessage('');
    } catch {
      setErrorMsg(
        isArabic
          ? 'تعذر إرسال الرسالة حالياً، يرجى المحاولة مرة أخرى.'
          : 'Could not send message right now, please try again.'
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="pt-24 pb-32 bg-[#0A0A0B] text-white min-h-screen" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24">
          <div>
            <h1 className="text-5xl sm:text-6xl font-bold tracking-tighter mb-8 leading-none">
              {t('contact.title')} <br />{' '}
              <span className="text-brand-gold italic">{t('contact.titleItalic')}</span>
            </h1>
            <p className="text-xl text-white/60 font-light mb-14 leading-relaxed">
              {t('contact.subtitle')}
            </p>

            <div className="space-y-10">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-white/5 rounded-2xl shadow-sm border border-white/10 flex items-center justify-center text-brand-gold shrink-0">
                  <Mail size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-1">
                    {t('contact.emailTitle')}
                  </h4>
                  <p className="text-lg font-medium text-white">merro4h@gmail.com</p>
                  <p className="text-lg font-medium text-white">kmerro25@gmail.com</p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-[#25D366]/10 rounded-2xl shadow-sm border border-[#25D366]/20 flex items-center justify-center text-[#25D366] shrink-0">
                  <MessageCircle size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-1">
                    {isArabic ? 'دردشة واتساب المباشرة' : 'Direct WhatsApp Support'}
                  </h4>
                  <p className="text-sm text-white/70 mb-2">
                    {isArabic
                      ? 'تواصل معنا مباشرة من داخل المتجر وستصل رسالتك فوراً إلى فريقنا على الواتساب.'
                      : 'Message us directly on-site and our team receives it immediately on WhatsApp.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => window.dispatchEvent(new CustomEvent('open-whatsapp-prompt'))}
                    className="text-sm font-bold text-[#25D366] hover:underline cursor-pointer"
                  >
                    {isArabic ? 'فتح نافذة المحادثة المباشرة ←' : 'Open Direct WhatsApp Chat →'}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-white/5 rounded-2xl shadow-sm border border-white/10 flex items-center justify-center text-brand-gold shrink-0">
                  <MapPin size={24} />
                </div>
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-1">
                    {t('contact.visitTitle')}
                  </h4>
                  <p className="text-lg font-medium text-white">{t('contact.address')}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#1A1A1A] p-8 sm:p-10 rounded-[2.5rem] shadow-xl border border-white/10">
            {sentSuccess ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[#25D366]/15 text-[#25D366] flex items-center justify-center">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-2xl font-bold text-white">
                  {isArabic ? 'تم إرسال رسالتك بنجاح!' : 'Message Sent Directly!'}
                </h3>
                <p className="text-white/60 text-sm max-w-sm leading-relaxed">
                  {isArabic
                    ? 'وصلت رسالتك ورقم هاتفك مباشرة إلى واتساب المتجر، وسيتواصل معك فريقنا في أقرب وقت.'
                    : 'Your message and phone number have been delivered directly to our store WhatsApp. We will reach out shortly.'}
                </p>
                <button
                  type="button"
                  onClick={() => setSentSuccess(false)}
                  className="mt-4 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  {isArabic ? 'إرسال رسالة أخرى' : 'Send Another Message'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/50">
                      {t('contact.firstName')}
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 text-white outline-none p-4 rounded-2xl focus:ring-2 focus:ring-brand-gold transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/50">
                      {t('contact.lastName')}
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 text-white outline-none p-4 rounded-2xl focus:ring-2 focus:ring-brand-gold transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/50">
                      {isArabic ? 'رقم الواتساب / الهاتف' : 'WhatsApp / Phone Number'}
                    </label>
                    <input
                      type="tel"
                      dir="ltr"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="07xxxxxxxxx"
                      className="w-full bg-white/5 border border-white/10 text-white outline-none p-4 rounded-2xl focus:ring-2 focus:ring-brand-gold transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-white/50">
                      {t('contact.emailAddress')}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 text-white outline-none p-4 rounded-2xl focus:ring-2 focus:ring-brand-gold transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-white/50">
                    {t('contact.message')}
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white outline-none p-4 rounded-2xl focus:ring-2 focus:ring-brand-gold transition-all resize-none"
                  />
                </div>

                {errorMsg && <p className="text-sm text-red-400 font-medium">{errorMsg}</p>}

                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full bg-brand-gold text-[#0A0A0B] font-bold py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-white transition-all shadow-lg hover:shadow-xl cursor-pointer disabled:opacity-50"
                >
                  {isSending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                  <span>
                    {isArabic ? 'إرسال مباشر إلى واتساب المتجر' : t('contact.send')}
                  </span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
