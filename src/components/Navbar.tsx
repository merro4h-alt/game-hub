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
    { name: t('nav.home'), path: '/' },
    { name: t('nav.shop'), path: '/shop' },
    { name: t('nav.supplierPortal'), path: '/drop-shipping' },
    { name: t('nav.trackOrder'), path: '/track' },
    { name: t('nav.about'), path: '/about' },
    { name: t('nav.contact'), path: '/contact' },
    { name: i18n.language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy', path: '/policies' },
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
    <nav className={`w-full transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 backdrop-blur-xl shadow-lg shadow-black/5' 
        : 'bg-white/90 backdrop-blur-md'
    } border-b border-brand-charcoal/5 sticky top-0 z-[100]`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 gap-4">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="sm:hidden text-white bg-brand-charcoal hover:bg-brand-charcoal/90 transition-all p-2 rounded-2xl shadow-xl shadow-brand-charcoal/20 group flex-shrink-0 z-[160]"
              title={t('common.menu')}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isOpen ? 'close' : 'menu'}
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  {isOpen ? <X size={20} /> : <Menu size={20} className="group-hover:scale-110 transition-transform" />}
                </motion.div>
              </AnimatePresence>
            </button>

            {/* Logo */}
            <div className="flex flex-col min-w-fit">
              <Link to="/" className="flex items-center gap-2 sm:gap-4 group flex-shrink-0" onClick={() => setIsOpen(false)}>
                <span className="text-2xl sm:text-4xl lg:text-5xl font-black italic tracking-tighter text-brand-charcoal whitespace-nowrap">
                  Trendi<span className="text-[#6366F1]">fi</span>
                </span>
                <Logo className="w-8 h-8 sm:w-12 sm:h-12 group-hover:scale-110 group-hover:-rotate-3 transition-all duration-500 flex-shrink-0" variant="gradient" />
              </Link>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden sm:flex items-center gap-1 lg:gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-1.5 lg:px-4 py-2 text-[11px] lg:text-base font-bold tracking-tight transition-all rounded-xl hover:bg-brand-charcoal/5 ${
                  activeLink(link.path) 
                    ? 'text-brand-gold bg-brand-charcoal/5' 
                    : 'text-brand-charcoal/70 hover:text-brand-charcoal'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Icons (Right) */}
          <div className="flex items-center gap-1 sm:gap-4">
            <div className="flex items-center gap-1 sm:gap-2">
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="text-brand-charcoal/70 hover:text-brand-charcoal transition-colors flex-shrink-0 p-2 hover:bg-white rounded-xl"
              >
                <Search size={20} />
              </button>

              <Link to="/wishlist" className="relative text-brand-charcoal/70 hover:text-red-500 transition-colors flex-shrink-0 p-2 hover:bg-white rounded-xl" title={t('common.wishlist')}>
                <Heart size={20} />
                <AnimatePresence>
                  {wishlist.length > 0 && (
                    <motion.span 
                      key={wishlist.length}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full font-black"
                    >
                      {wishlist.length}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>

              <Link to="/cart" className="relative text-brand-charcoal/70 hover:text-brand-charcoal transition-colors flex-shrink-0 p-2 hover:bg-white rounded-xl" title={t('common.cart')}>
                <ShoppingBag size={20} />
                <AnimatePresence>
                  {totalItems > 0 && (
                    <motion.span 
                      key={totalItems}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      className="absolute -top-1 -right-1 bg-[#4F46E5] text-white text-[8px] w-4 h-4 flex items-center justify-center rounded-full font-black"
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
                      className="absolute top-full mt-2 right-0 rtl:left-0 rtl:right-auto w-48 bg-white rounded-xl shadow-2xl border border-brand-charcoal/5 overflow-hidden z-50 text-brand-charcoal"
                    >
                      {user ? (
                        <div className="p-2">
                          <div className="px-3 py-2 mb-1">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs font-bold text-brand-charcoal truncate">{user.displayName || user.email}</p>
                              <div className="flex items-center gap-1 bg-brand-gold/10 px-1.5 py-0.5 rounded-full border border-brand-gold/20">
                                <Sparkles size={8} className="text-brand-gold" />
                                <span className="text-[8px] font-black text-brand-gold">540 PTS</span>
                              </div>
                            </div>
                            {isAdmin && <p className="text-[10px] text-brand-gold font-bold uppercase tracking-widest">{t('common.admin')}</p>}
                          </div>
                          <div className="h-px bg-brand-charcoal/5 my-1" />
                          {(isAdmin || (user?.email && ['kmerro25@gmail.com', 'merro4h@gmail.com'].includes(user.email.toLowerCase()))) && (
                            <Link
                              to="/admin"
                              onClick={() => setIsProfileOpen(false)}
                              className="w-full text-left rtl:text-right px-3 py-2 text-sm text-brand-gold hover:bg-white/5 rounded-lg flex items-center gap-2 transition-colors font-bold mb-1 border border-brand-gold/10"
                            >
                              <LayoutDashboard size={14} />
                              <div className="flex-1 flex items-center justify-between">
                                {t('admin.dashboard')}
                                <span className="text-[8px] bg-red-500 text-white px-1.5 py-0.5 rounded-full animate-pulse uppercase">New</span>
                              </div>
                            </Link>
                          )}
                          <Link
                              to="/orders"
                              onClick={() => setIsProfileOpen(false)}
                              className="w-full text-left rtl:text-right px-3 py-2 text-sm text-brand-charcoal hover:bg-brand-cream rounded-lg flex items-center gap-2 transition-colors font-medium"
                            >
                              <Package size={14} />
                              {t('common.orderHistory')}
                            </Link>
                          <button
                            onClick={() => {
                              signout();
                              setIsProfileOpen(false);
                            }}
                            className="w-full text-left rtl:text-right px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors"
                          >
                            <LogOut size={14} />
                            {t('admin.logout')}
                          </button>
                        </div>
                      ) : (
                        <div className="p-2">
                          <button
                            onClick={handleLoginClick}
                            disabled={isLoginLoading}
                            className="w-full text-left rtl:text-right px-3 py-2 text-sm text-brand-charcoal hover:bg-brand-cream rounded-lg flex items-center gap-2 transition-colors font-bold disabled:opacity-50"
                          >
                            {isLoginLoading ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                className="w-3.5 h-3.5 border-2 border-brand-gold border-t-transparent rounded-full"
                              />
                            ) : (
                              <UserIcon size={14} />
                            )}
                            {isLoginLoading ? t('common.loading') : t('common.login')}
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            {/* Language Toggle */}
            <div className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                onBlur={() => setTimeout(() => setIsLangOpen(false), 200)}
                className="flex items-center gap-1 text-brand-charcoal/70 hover:text-brand-gold transition-colors text-[10px] font-bold uppercase tracking-wider group bg-brand-charcoal/5 px-2 py-1.5 sm:px-3 sm:py-2 rounded-full"
              >
                  <Globe size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="hidden min-[600px]:inline">{i18n.language === 'en' ? 'EN' : 'AR'}</span>
                  <ChevronDown size={10} className={`hidden sm:block transition-transform duration-300 ${isLangOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isLangOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full mt-2 right-0 rtl:left-0 rtl:right-auto w-32 bg-white rounded-xl shadow-2xl border border-brand-charcoal/5 overflow-hidden z-50 text-brand-charcoal"
                    >
                      <button
                        onClick={() => {
                          i18n.changeLanguage('en');
                          setIsLangOpen(false);
                        }}
                        className={`w-full text-left rtl:text-right px-4 py-3 text-sm transition-colors hover:bg-brand-cream flex items-center justify-between ${i18n.language === 'en' ? 'text-brand-gold font-bold' : 'text-brand-charcoal/70'}`}
                      >
                        English
                        {i18n.language === 'en' && <div className="w-1.5 h-1.5 rounded-full bg-brand-gold" />}
                      </button>
                      <button
                        onClick={() => {
                          i18n.changeLanguage('ar');
                          setIsLangOpen(false);
                        }}
                        className={`w-full text-left rtl:text-right px-4 py-3 text-sm transition-colors hover:bg-brand-cream flex items-center justify-between font-arabic ${i18n.language === 'ar' ? 'text-brand-gold font-bold' : 'text-brand-charcoal/70'}`}
                      >
                        العربية
                        {i18n.language === 'ar' && <div className="w-1.5 h-1.5 rounded-full bg-brand-gold" />}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
          </div>
        </div>
      </div>
      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="sm:hidden fixed inset-0 bg-transparent z-[140]"
            />
            <motion.div
              key="mobile-dropdown"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="sm:hidden absolute top-full left-4 right-4 mt-2 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl z-[150] overflow-hidden border border-brand-charcoal/5"
            >
              <div className="p-3 flex flex-col gap-1">
                {navLinks.map((link, idx) => (
                  <motion.div
                    key={link.path || idx}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                  >
                    <Link
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center justify-between p-3.5 rounded-2xl transition-all ${
                        activeLink(link.path) 
                          ? 'bg-brand-charcoal text-white lg:shadow-xl lg:shadow-brand-charcoal/20' 
                          : 'hover:bg-brand-charcoal/5 text-brand-charcoal font-medium'
                      }`}
                    >
                      <span className="text-xs font-bold uppercase tracking-wide">{link.name}</span>
                      <ArrowRight size={14} className={`${isRtl ? 'rotate-180' : ''} opacity-40`} />
                    </Link>
                  </motion.div>
                ))}

                {(isAdmin || (user?.email && ['kmerro25@gmail.com', 'merro4h@gmail.com'].includes(user.email.toLowerCase()))) && (
                  <div className="mt-2 pt-2 border-t border-brand-charcoal/5">
                    <Link
                      to="/admin"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between p-3.5 bg-brand-gold/10 text-brand-gold rounded-2xl font-bold uppercase tracking-widest text-[9px] border border-brand-gold/10"
                    >
                      <div className="flex items-center gap-2">
                        <LayoutDashboard size={14} />
                        {t('admin.dashboard')}
                      </div>
                      <ArrowRight size={14} className={isRtl ? 'rotate-180' : ''} />
                    </Link>
                  </div>
                )}
                
                <div className="mt-2 pt-2 border-t border-brand-charcoal/5 flex gap-2">
                  <button
                    onClick={() => {
                      i18n.changeLanguage('en');
                      setIsOpen(false);
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-[9px] font-black tracking-widest transition-all ${i18n.language === 'en' ? 'bg-brand-gold text-white shadow-lg shadow-brand-gold/10' : 'bg-brand-charcoal/5 text-brand-charcoal/40'}`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => {
                      i18n.changeLanguage('ar');
                      setIsOpen(false);
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-[9px] font-black font-arabic tracking-widest transition-all ${isRtl ? 'bg-brand-gold text-white shadow-lg shadow-brand-gold/10' : 'bg-brand-charcoal/5 text-brand-charcoal/40'}`}
                  >
                    AR
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>


      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-start justify-center pt-32 px-4 bg-brand-charcoal/40 backdrop-blur-xl"
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
                             <div className="text-brand-gold font-black text-xs">
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
    </nav>
  );
};

export default Navbar;
