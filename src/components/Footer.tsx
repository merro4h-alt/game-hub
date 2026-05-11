import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Instagram, Twitter, Facebook, ArrowUpRight, MessageCircle, ShieldCheck } from 'lucide-react';
import Logo from './Logo';

const Footer: React.FC = () => {
  const { t, i18n } = useTranslation();
  return (
    <footer className="bg-black text-brand-cream pt-24 pb-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Logo & Info */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-4 mb-6 group">
              <span className="text-4xl font-black italic tracking-tighter text-white">
                Trendi<span className="text-[#A78BFA]">fi</span>
              </span>
              <Logo className="w-12 h-12 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500" variant="gradient" />
            </Link>
            <p className="text-brand-cream/60 max-w-sm font-light text-lg mb-8">
              {t('footer.description')}
            </p>
            <div className="flex space-x-4">
              <a href="https://instagram.com/trendi_ah" target="_blank" rel="noopener noreferrer" className="p-3 rounded-full border border-brand-cream/10 hover:border-brand-gold hover:text-brand-gold transition-all" title="Instagram">
                <Instagram size={20} />
              </a>
              <a href="#" className="p-3 rounded-full border border-brand-cream/10 hover:border-brand-gold hover:text-brand-gold transition-all" title="Twitter">
                <Twitter size={20} />
              </a>
              <a href="#" className="p-3 rounded-full border border-brand-cream/10 hover:border-brand-gold hover:text-brand-gold transition-all" title="Facebook">
                <Facebook size={20} />
              </a>
              <a href="https://wa.me/+9647837814009" target="_blank" rel="noopener noreferrer" className="p-3 rounded-full border border-brand-cream/10 hover:border-[#25D366] hover:text-[#25D366] transition-all" title="WhatsApp">
                <MessageCircle size={20} />
              </a>
              <a href="https://tiktok.com/@ah.92t" target="_blank" rel="noopener noreferrer" className="p-3 rounded-full border border-brand-cream/10 hover:border-white hover:text-white transition-all flex items-center justify-center" title="TikTok">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.01.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.81-.73-3.95-1.66V13.5c0 1.91-.79 3.73-2.18 5.04-1.39 1.3-3.32 1.98-5.26 1.87-2-.11-3.85-1.14-5.02-2.78-1.18-1.63-1.53-3.75-.95-5.69.58-1.94 2.1-3.41 4.02-3.93v4.09c-.77.16-1.49.61-1.96 1.25-.47.64-.67 1.45-.55 2.24.12.79.55 1.5 1.19 1.97.64.47 1.45.67 2.24.55.79-.12 1.5-.55 1.97-1.19.46-.64.67-1.45.55-2.24V0h-.01z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold text-lg mb-6 tracking-tight">{t('footer.quickLinks')}</h4>
            <ul className="space-y-4 text-brand-cream/60 font-light">
              <li><Link to="/" className="hover:text-brand-gold transition-colors">{t('nav.home')}</Link></li>
              <li><Link to="/shop" className="hover:text-brand-gold transition-colors">{t('nav.shop')}</Link></li>
              <li><Link to="/about" className="hover:text-brand-gold transition-colors">{t('nav.about')}</Link></li>
              <li><Link to="/contact" className="hover:text-brand-gold transition-colors">{t('nav.contact')}</Link></li>
              <li><Link to="/track" className="hover:text-brand-gold transition-colors">{t('nav.trackOrder')}</Link></li>
              <li><Link to="/admin" className="hover:text-brand-gold transition-colors text-white/30 text-xs italic">{t('admin.dashboard')}</Link></li>
              <li className="pt-4 mt-4 border-t border-white/5">
                <span className="block text-xs uppercase tracking-widest text-white/30 mb-1">{t('footer.emailLabel')}</span>
                <a href="mailto:merro4h@gmail.com" className="text-brand-gold hover:underline font-medium">merro4h@gmail.com</a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-bold text-lg mb-6 tracking-tight">{t('footer.newsletter')}</h4>
            <p className="text-brand-cream/60 text-sm mb-6 font-light">{t('footer.newsletterDesc')}</p>
            <div className="flex flex-col gap-4">
              <input 
                type="email" 
                placeholder="email@example.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-brand-gold transition-colors font-light text-white"
              />
              <button className="w-full bg-brand-gold hover:bg-white text-brand-charcoal font-black uppercase tracking-widest py-3 rounded-xl transition-all duration-300 shadow-lg shadow-brand-gold/10 hover:-translate-y-1">
                {t('common.send')}
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-brand-cream/10 pt-12 mt-12 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="max-w-2xl">
            <h4 className="text-xs font-bold uppercase tracking-widest text-brand-gold mb-4">
              {t('order.cancellationPolicy.title')}
            </h4>
            <p className="text-sm font-light text-brand-cream/60 leading-relaxed">
              {t('order.cancellationPolicy.text')}
            </p>
          </div>
          <div className="max-w-2xl border-t md:border-t-0 md:border-l border-brand-cream/10 md:pl-12 pt-12 md:pt-0">
            <h4 className="text-xs font-bold uppercase tracking-widest text-green-500 mb-4 flex items-center gap-2">
              <ShieldCheck size={16} />
              {t('footer.specGuarantee')}
            </h4>
            <p className="text-sm font-light text-brand-cream/60 leading-relaxed">
              {t('footer.specGuaranteeDesc')}
            </p>
          </div>
        </div>

        <div className="border-t border-brand-cream/10 pt-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-brand-cream/40 text-xs uppercase tracking-widest">
            {t('footer.copyright')}
          </p>
          <div className="flex gap-8 text-brand-cream/40 text-xs uppercase tracking-widest">
            <a href="#" className="hover:text-brand-gold">Privacy Policy</a>
            <a href="#" className="hover:text-brand-gold">Terms of Service</a>
          </div>
          {/* Payment Badges */}
          <div className="flex items-center space-x-3 opacity-60 grayscale hover:grayscale-0 transition-all cursor-crosshair">
             <div className="bg-white/10 px-3 py-1 rounded border border-white/10 flex items-center gap-1">
               <div className="w-2 h-2 rounded-full bg-orange-500" />
               <span className="text-[10px] font-bold">MasterCard</span>
             </div>
             <div className="bg-white/10 px-3 py-1 rounded border border-white/10 flex items-center gap-1">
               <div className="w-2 h-2 rounded-full bg-blue-500" />
               <span className="text-[10px] font-bold">VISA</span>
             </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
