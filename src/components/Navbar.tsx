import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, Menu, X, Search, Globe, ChevronDown, User as UserIcon, LogOut, ShieldCheck, Package, LayoutDashboard, Sparkles, Heart, ArrowRight, Plus, Truck } from 'lucide-react';
import { useStore } from '../StoreContext';
import Logo from './Logo';
import { useAuth } from '../AuthContext';
import { useRef, useEffect } from 'react';

const Navbar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { 
    totalItems, 
    setIsAddModalOpen, 
    searchQuery, 
    setSearchQuery,
    currency,
    setCurrency,
    formatPrice,
    filteredProducts,
    wishlist
  } = useStore();
  const { user, isAdmin, login, signout } = useAuth();
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLoginClick = async () => {
    setIsLoginLoading(true);
    try {
      await login();
    } finally {
      setIsLoginLoading(false);
      setIsProfileOpen(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
    }
  };

  const isRtl = i18n.language.startsWith('ar');

  const navLinks = [
    { name: i18n.language === 'ar' ? 'الرئيسية' : 'HOME', path: '/' },
    { name: i18n.language === 'ar' ? 'المتجر' : 'SHOP', path: '/shop' },
    { name: i18n.language === 'ar' ? 'بوابة الموردين' : 'SUPPLIER PORTAL', path: '/drop-shipping' },
    { name: i18n.language === 'ar' ? 'تتبع الطلب' : 'TRACK ORDER', path: '/track' },
    { name: i18n.language === 'ar' ? 'من نحن' : 'ABOUT US', path: '/about' },
    { name: i18n.language === 'ar' ? 'اتصل بنا' : 'CONTACT', path: '/contact' },
    { name: i18n.language === 'ar' ? 'سياسة الخصوصية' : 'PRIVACY POLICY', path: '/policies' },
  ];

  const categories = [
    { name: t('categories.fashion'), icon: '👗' },
    { name: t('categories.cosmetic'), icon: '💄' },
    { name: t('categories.lifestyle'), icon: '✨' },
    { name: t('categories.accessories'), icon: '🎒' },
  ];

  const activeLink = (path: string | undefined) => path ? location.pathname === path : false;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return isRtl ? 'صباح الخير' : 'Good Morning';
    if (hour < 18) return isRtl ? 'طاب مساؤك' : 'Good Afternoon';
    return isRtl ? 'مساء الخير' : 'Good Evening';
  };

  return (
    <>
      <nav className={`w-full transition-all duration-300 ${
        scrolled 
          ? 'bg-white/95 backdrop-blur-xl shadow-lg shadow-black/5' 
          : 'bg-white/90 backdrop-blur-md'
      } border-b border-brand-charcoal/5 sticky top-0 z-[100]`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20 sm:h-24 gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {/* Mobile Menu Button - Circular Dark Style as per image */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden w-8 h-8 rounded-full bg-[#1A1A1A] text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all flex-shrink-0"
              title={t('common.menu')}
            >
              {isOpen ? <X size={16} /> : <Menu size={14} />}
            </button>

            {/* Logo Group */}
            <div className="flex flex-col min-w-0">
              <Link to="/" className="flex items-center gap-1.5 sm:gap-2 group flex-shrink-0" onClick={() => setIsOpen(false)}>
                <div className="flex items-baseline">
                  <span className="text-2xl sm:text-3xl lg:text-5xl font-black italic tracking-tighter text-brand-charcoal leading-none">
                    Trendi<span className="text-[#4F46E5]">fi</span>
                  </span>
                </div>
                <Logo className="w-10 h-10 sm:w-14 sm:h-14 lg:w-20 lg:h-20 transition-all duration-500 flex-shrink-0 rotate-6" variant="gradient" />
              </Link>
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`text-[11px] font-black uppercase tracking-widest transition-all hover:text-[#C5A05B] ${
                      activeLink(link.path) ? 'text-[#C5A05B] scale-110' : 'text-brand-charcoal/80'
                    }`}
                  >
                    {link.name}
                  </Link>
              ))}
            </div>
          </div>

          <div className="hidden">
            {/* Placeholder to maintain spacing consistency if needed, but flex-between handles it */}
          </div>

          {/* Icons (Right) */}
          <div className="flex items-center gap-0.5 sm:gap-4">
            
            <div className="flex items-center gap-0 sm:gap-2">
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="text-brand-charcoal/70 hover:text-brand-charcoal transition-colors flex-shrink-0 p-1 sm:p-2 hover:bg-white rounded-xl"
              >
                <Search size={18} />
              </button>

              <Link to="/wishlist" className="relative text-brand-charcoal/70 hover:text-red-500 transition-colors flex-shrink-0 p-1 sm:p-2 hover:bg-white rounded-xl" title={t('common.wishlist')}>
                <Heart size={18} />
                <AnimatePresence>
                  {wishlist.length > 0 && (
                    <motion.span 
                      key={wishlist.length}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      className="absolute top-0 right-0 bg-red-500 text-white text-[7px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-black"
                    >
                      {wishlist.length}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>

              <Link to="/cart" className="relative text-brand-charcoal/70 hover:text-brand-charcoal transition-colors flex-shrink-0 p-1 sm:p-2 hover:bg-white rounded-xl" title={t('common.cart')}>
                <ShoppingBag size={18} />
                <AnimatePresence>
                  {totalItems > 0 && (
                    <motion.span 
                      key={totalItems}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      className="absolute top-0 right-0 bg-[#4F46E5] text-white text-[7px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-black"
                    >
                      {totalItems}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            </div>

            {/* Auth Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="text-brand-charcoal/70 hover:text-brand-charcoal transition-colors flex items-center gap-1 p-1.5 sm:p-2"
              >
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="profile" className="w-6 h-6 sm:w-7 sm:h-7 rounded-full border border-brand-charcoal/10" />
                  ) : (
                    <UserIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full mt-2 right-0 rtl:left-0 rtl:right-auto w-56 bg-white rounded-xl shadow-2xl border border-brand-charcoal/5 overflow-hidden z-50 text-brand-charcoal"
                    >
                      {user ? (
                        <div className="p-2">
                          <div className="px-3 py-3 mb-1 bg-brand-charcoal/[0.02] rounded-lg">
                            <div className="flex items-center gap-3 mb-2">
                               {user.photoURL ? (
                                 <img src={user.photoURL} alt="p" className="w-8 h-8 rounded-full border-2 border-brand-gold/20" />
                               ) : (
                                 <div className="w-8 h-8 rounded-full bg-brand-charcoal/10 flex items-center justify-center">
                                   <UserIcon size={16} />
                                 </div>
                               )}
                               <div className="min-w-0">
                                 <p className="text-xs font-black text-brand-charcoal truncate">{user.displayName || user.email?.split('@')[0]}</p>
                                 <p className="text-[10px] text-brand-charcoal/40 truncate">{user.email}</p>
                               </div>
                            </div>
                            <div className="flex items-center gap-1.5 bg-[#4F46E5]/10 px-2 py-1 rounded-full border border-[#4F46E5]/20 w-fit">
                              <Sparkles size={10} className="text-[#4F46E5]" />
                              <span className="text-[9px] font-black text-[#4F46E5]">540 POINTS</span>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            {(isAdmin || (user?.email && ['kmerro25@gmail.com', 'merro4h@gmail.com'].includes(user.email.toLowerCase()))) && (
                              <Link
                                to="/admin"
                                onClick={() => setIsProfileOpen(false)}
                                className="w-full text-left rtl:text-right px-3 py-2.5 text-sm text-[#4F46E5] bg-[#4F46E5]/5 hover:bg-[#4F46E5]/10 rounded-lg flex items-center gap-3 transition-colors font-black border border-[#4F46E5]/20"
                              >
                                <ShieldCheck size={16} className="animate-pulse" />
                                <div className="flex-1">
                                  <p className="leading-none">{isRtl ? 'لوحة التحكم' : 'Admin Dashboard'}</p>
                                  <p className="text-[8px] opacity-60 font-bold uppercase mt-0.5">{isRtl ? 'إدارة المتجر' : 'Manage Store'}</p>
                                </div>
                              </Link>
                            )}
                            
                            <Link
                              to="/orders"
                              onClick={() => setIsProfileOpen(false)}
                              className="w-full text-left rtl:text-right px-3 py-2.5 text-sm text-brand-charcoal hover:bg-brand-cream rounded-lg flex items-center gap-3 transition-colors font-medium"
                            >
                              <Package size={16} className="text-brand-charcoal/40" />
                              {t('common.orderHistory')}
                            </Link>

                            <button
                              onClick={() => {
                                signout();
                                setIsProfileOpen(false);
                              }}
                              className="w-full text-left rtl:text-right px-3 py-2.5 text-sm text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-3 transition-colors mt-2"
                            >
                              <LogOut size={16} />
                              {t('admin.logout')}
                            </button>

                            {/* Language in Profile Dropdown */}
                            <div className="mt-2 pt-2 border-t border-brand-charcoal/5">
                              <div className="flex gap-1 p-1 bg-brand-charcoal/5 rounded-lg">
                                 <button 
                                   onClick={() => { i18n.changeLanguage('ar'); setIsProfileOpen(false); }}
                                   className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-md transition-all ${i18n.language === 'ar' ? 'bg-white text-[#4F46E5] shadow-sm' : 'text-brand-charcoal/40 hover:text-brand-charcoal'}`}
                                 >
                                   AR
                                 </button>
                                 <button 
                                   onClick={() => { i18n.changeLanguage('en'); setIsProfileOpen(false); }}
                                   className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-md transition-all ${i18n.language === 'en' ? 'bg-white text-[#4F46E5] shadow-sm' : 'text-brand-charcoal/40 hover:text-brand-charcoal'}`}
                                  >
                                   EN
                                 </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3">
                          <button
                            onClick={handleLoginClick}
                            disabled={isLoginLoading}
                            className="w-full py-3 bg-brand-charcoal text-white rounded-xl flex items-center justify-center gap-2 transition-all font-black text-sm shadow-lg shadow-brand-charcoal/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                          >
                            {isLoginLoading ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                className="w-4 h-4 border-2 border-brand-gold border-t-transparent rounded-full"
                              />
                            ) : (
                              <UserIcon size={18} />
                            )}
                            {isLoginLoading ? t('common.loading') : t('common.login')}
                          </button>

                          {/* Language in Profile Dropdown for Guests */}
                          <div className="mt-3 flex gap-1 p-1 bg-brand-charcoal/5 rounded-lg">
                             <button 
                               onClick={() => { i18n.changeLanguage('ar'); setIsProfileOpen(false); }}
                               className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-md transition-all ${i18n.language === 'ar' ? 'bg-white text-[#4F46E5] shadow-sm' : 'text-brand-charcoal/40 hover:text-brand-charcoal'}`}
                             >
                               AR
                             </button>
                             <button 
                               onClick={() => { i18n.changeLanguage('en'); setIsProfileOpen(false); }}
                               className={`flex-1 py-1.5 text-[9px] font-black uppercase rounded-md transition-all ${i18n.language === 'en' ? 'bg-white text-[#4F46E5] shadow-sm' : 'text-brand-charcoal/40 hover:text-brand-charcoal'}`}
                             >
                               EN
                             </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>

            {/* Language Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="text-brand-charcoal/70 hover:text-[#C5A05B] transition-colors flex items-center gap-1 p-2 hover:bg-white rounded-xl"
                title={i18n.language === 'ar' ? 'تغيير اللغة' : 'Change Language'}
              >
                <Globe size={20} />
                <span className="text-[10px] font-black">{i18n.language === 'ar' ? 'AR' : 'EN'}</span>
              </button>

              <AnimatePresence>
                {isLangOpen && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setIsLangOpen(false)}
                      className="fixed inset-0 z-40"
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full mt-2 right-0 rtl:left-0 rtl:right-auto w-32 bg-white rounded-xl shadow-2xl border border-brand-charcoal/5 overflow-hidden z-50 text-brand-charcoal"
                    >
                      <div className="p-1">
                        <button
                          onClick={() => {
                            i18n.changeLanguage('ar');
                            setIsLangOpen(false);
                          }}
                          className={`w-full text-left rtl:text-right px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-between ${
                            i18n.language === 'ar' ? 'bg-[#C5A05B]/10 text-[#C5A05B]' : 'hover:bg-brand-charcoal/5'
                          }`}
                        >
                          <span>العربية</span>
                          {i18n.language === 'ar' && <div className="w-1.5 h-1.5 rounded-full bg-[#C5A05B]" />}
                        </button>
                        <button
                          onClick={() => {
                            i18n.changeLanguage('en');
                            setIsLangOpen(false);
                          }}
                          className={`w-full text-left rtl:text-right px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center justify-between ${
                            i18n.language === 'en' ? 'bg-[#C5A05B]/10 text-[#C5A05B]' : 'hover:bg-brand-charcoal/5'
                          }`}
                        >
                          <span>English</span>
                          {i18n.language === 'en' && <div className="w-1.5 h-1.5 rounded-full bg-[#C5A05B]" />}
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </nav>
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-24 px-6 sm:px-12 pointer-events-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-[280px] bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-brand-charcoal/5 overflow-hidden flex flex-col p-4 pointer-events-auto"
            >
              <div className="flex flex-col">
                {navLinks.map((link, index) => {
                  const isActive = activeLink(link.path);
                  return (
                    <motion.div
                      key={link.path}
                      initial={{ opacity: 0, x: isRtl ? 15 : -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                    >
                      <Link
                        to={link.path}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center justify-between px-5 py-4 rounded-[1.8rem] transition-all duration-500 group mb-1.5 ${
                          isActive 
                            ? 'bg-white shadow-[0_15px_30px_-5px_rgba(197,160,91,0.15)] border border-[#C5A05B]/20 scale-[1.02] z-10' 
                            : 'bg-brand-charcoal/[0.02] hover:bg-white hover:shadow-lg hover:shadow-brand-charcoal/5 text-brand-charcoal border border-transparent hover:border-brand-charcoal/10'
                        }`}
                      >
                        <span className={`text-[12px] font-black uppercase tracking-widest transition-all duration-500 ${
                          isActive ? 'text-[#C5A05B]' : 'text-brand-charcoal/60 group-hover:text-[#C5A05B]'
                        }`}>
                          {link.name}
                        </span>
                        <div className={`p-1.5 rounded-full transition-all duration-500 ${
                          isActive ? 'bg-[#C5A05B]/10 rotate-0' : 'bg-brand-charcoal/5 group-hover:bg-[#C5A05B]/10 -rotate-45 group-hover:rotate-0'
                        }`}>
                          <ArrowRight 
                            size={isActive ? 16 : 14} 
                            className={`${isRtl ? 'rotate-180' : ''} ${isActive ? 'text-[#C5A05B]' : 'text-brand-charcoal/20 group-hover:text-[#C5A05B]'} transition-all duration-500`} 
                          />
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-start justify-center pt-32 px-4 bg-brand-charcoal/40 backdrop-blur-xl"
          >
            <div 
              className="absolute inset-0"
              onClick={() => setIsSearchOpen(false)}
            />
            
            <motion.div 
              initial={{ y: -20, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: -20, scale: 0.95 }}
              className="relative w-full max-w-md"
            >
              <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl p-1.5 flex items-center gap-2 border border-white/40">
                <div className="flex-grow flex items-center gap-3 px-4">
                  <Search size={18} className="text-brand-charcoal/40 flex-shrink-0" />
                  <form onSubmit={handleSearch} className="flex-grow">
                    <input 
                      type="text" 
                      placeholder={t('nav.search')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent border-none outline-none ring-0 focus:ring-0 text-base font-medium placeholder:text-brand-charcoal/20 text-brand-charcoal py-3 rtl:text-right"
                      autoFocus
                    />
                  </form>
                </div>
                
                <button 
                  onClick={() => setIsSearchOpen(false)}
                  className="w-10 h-10 hover:bg-brand-charcoal/5 text-brand-charcoal/40 hover:text-brand-charcoal rounded-xl flex items-center justify-center transition-all group"
                >
                  <X size={20} className="transition-transform duration-300 group-hover:rotate-90" />
                </button>
              </div>

              {/* Live Search Results */}
              <AnimatePresence>
                {searchQuery.trim().length > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="mt-2 bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/40 max-h-[60vh] overflow-y-auto no-scrollbar"
                  >
                    <div className="p-2">
                       {filteredProducts.length > 0 ? (
                         filteredProducts.map(product => (
                           <button
                             key={product.id}
                             onClick={() => {
                               navigate(`/product/${product.id}`);
                               setIsSearchOpen(false);
                               setSearchQuery('');
                             }}
                             className="w-full flex items-center gap-4 p-3 hover:bg-brand-charcoal/5 rounded-2xl transition-all group"
                           >
                             <div className="w-12 h-12 rounded-xl overflow-hidden bg-brand-cream flex-shrink-0">
                               <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                             </div>
                             <div className="flex-grow text-left rtl:text-right">
                               <h4 className="text-sm font-bold text-brand-charcoal">{product.name}</h4>
                               <p className="text-[10px] text-brand-charcoal/40 uppercase tracking-widest">{product.category}</p>
                             </div>
                             <div className="text-[#4F46E5] font-black text-xs">
                               {formatPrice(product.discountPrice || product.price)}
                             </div>
                           </button>
                         ))
                       ) : (
                         <div className="p-8 text-center">
                           <p className="text-brand-charcoal/40 text-sm font-medium">{t('shop.noProducts')}</p>
                         </div>
                       )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-4 flex flex-wrap justify-center gap-2"
              >
                <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest py-2 px-2">{i18n.language === 'ar' ? 'شائع:' : 'Trending:'}</span>
                {['New Arrivals', 'Best Sellers', 'Skin Care'].map((tag) => (
                  <button 
                    key={tag}
                    onClick={() => {
                      setSearchQuery(tag);
                      navigate(`/shop?search=${encodeURIComponent(tag)}`);
                      setIsSearchOpen(false);
                    }}
                    className="text-white/80 bg-white/5 hover:bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border border-white/5"
                  >
                    {tag}
                  </button>
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
