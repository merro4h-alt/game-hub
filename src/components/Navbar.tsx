import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { ShoppingBag, Menu, X, Search, Globe, ChevronDown, User as UserIcon, LogOut, ShieldCheck, Package, LayoutDashboard, Sparkles } from 'lucide-react';
import { useStore } from '../StoreContext';
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
    setSearchQuery
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
      navigate(`/shop`);
      setIsSearchOpen(false);
    }
  };

  const navLinks = [
    { name: t('nav.home'), path: '/' },
    { name: t('nav.shop'), path: '/shop' },
    { name: t('nav.about'), path: '/about' },
    { name: t('nav.contact'), path: '/contact' },
    { name: t('nav.trackOrder'), path: '/track' },
  ];

  const activeLink = (path: string | undefined) => path ? location.pathname === path : false;

  return (
    <nav className={`w-full transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 backdrop-blur-xl shadow-lg shadow-black/5' 
        : 'bg-white/90 backdrop-blur-md'
    } border-b border-brand-charcoal/5`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 gap-2">
          <div className="flex items-center gap-2 sm:gap-8 min-w-0">
            {/* Mobile Menu Toggle (Left on Mobile) */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden text-brand-charcoal/70 hover:text-brand-charcoal transition-colors order-first flex-shrink-0"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
              <span className="text-2xl sm:text-4xl font-black italic tracking-tighter text-brand-charcoal">
                Trendi<span className="text-[#4F46E5]">fi</span>
              </span>
              <div className="relative flex w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-lg sm:rounded-[14px] flex-shrink-0 items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-500 shadow-indigo-500/20 rotate-6">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 sm:w-8 sm:h-8 -rotate-6">
                   <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
              </div>
            </Link>

            {/* Desktop Nav (Now on the Left) */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path!}
                  className={`text-base font-semibold tracking-tight transition-colors duration-200 hover:text-brand-gold ${
                    activeLink(link.path) ? 'text-brand-gold decoration-2 underline underline-offset-8' : 'text-brand-charcoal/70'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              
              {/* Admin Button */}
              {isAdmin && (
                <div className="flex gap-2">
                  <Link 
                    to="/admin"
                    className="text-xs font-bold bg-[#4F46E5] text-white px-4 py-2 rounded-full hover:bg-[#4338CA] transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                  >
                    <LayoutDashboard size={14} />
                    {i18n.language === 'ar' ? 'لوحة المبيعات' : 'Sales Dashboard'}
                  </Link>
                  <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="text-xs font-bold bg-brand-charcoal text-white px-4 py-2 rounded-full hover:bg-brand-gold transition-all flex items-center gap-2"
                  >
                    <ShieldCheck size={14} />
                    {i18n.language === 'ar' ? 'إضافة منتج' : 'Add Product'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Icons (Right) */}
          <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
            {/* Language Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                onBlur={() => setTimeout(() => setIsLangOpen(false), 200)}
                className="flex items-center gap-1 text-brand-charcoal/70 hover:text-brand-gold transition-colors text-[10px] sm:text-xs font-bold uppercase tracking-wider group"
              >
                <Globe size={18} />
                <span className="hidden min-[450px]:inline">{i18n.language === 'en' ? 'EN' : 'AR'}</span>
                <ChevronDown size={12} className={`transition-transform duration-300 ${isLangOpen ? 'rotate-180' : ''}`} />
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

            {/* Auth Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="text-brand-charcoal/70 hover:text-brand-charcoal transition-colors flex items-center gap-1"
              >
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="profile" className="w-6 h-6 rounded-full border border-brand-charcoal/10" />
                ) : (
                  <UserIcon size={20} />
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
                          {isAdmin && <p className="text-[10px] text-brand-gold font-bold uppercase tracking-widest">{i18n.language === 'ar' ? 'مسؤول' : 'Admin'}</p>}
                        </div>
                        <div className="h-px bg-brand-charcoal/5 my-1" />
                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setIsProfileOpen(false)}
                            className="w-full text-left rtl:text-right px-3 py-2 text-sm text-[#4F46E5] hover:bg-white/5 rounded-lg flex items-center gap-2 transition-colors font-bold mb-1 border border-indigo-100/10"
                          >
                            <LayoutDashboard size={14} />
                            <div className="flex-1 flex items-center justify-between">
                              {i18n.language === 'ar' ? 'لوحة المبيعات' : 'Sales Dashboard'}
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
                          {i18n.language === 'ar' ? 'تاریخ الطلبات' : 'Order History'}
                        </Link>
                        <button
                          onClick={() => {
                            signout();
                            setIsProfileOpen(false);
                          }}
                          className="w-full text-left rtl:text-right px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <LogOut size={14} />
                          {i18n.language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
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
                          {i18n.language === 'ar' ? (isLoginLoading ? 'جاري التحميل...' : 'تسجيل الدخول') : (isLoginLoading ? 'Loading...' : 'Sign In')}
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>


            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="text-brand-charcoal/70 hover:text-brand-charcoal transition-colors flex-shrink-0"
            >
              <Search size={18} />
            </button>
            <Link to="/cart" className="relative text-brand-charcoal/70 hover:text-brand-charcoal transition-colors flex-shrink-0">
              <ShoppingBag size={18} />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span 
                    key={totalItems}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    className="absolute -top-1.5 -right-1.5 bg-[#4F46E5] text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-black shadow-lg shadow-indigo-500/40"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-brand-charcoal/5"
          >
            <div className="px-4 pt-2 pb-6 space-y-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path!}
                  onClick={() => setIsOpen(false)}
                  className={`block text-lg font-medium ${
                    activeLink(link.path) ? 'text-brand-gold' : 'text-brand-charcoal/70'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              
              {isAdmin && (
                <button
                  onClick={() => {
                    setIsAddModalOpen(true);
                    setIsOpen(false);
                  }}
                  className="w-full text-center bg-brand-charcoal text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                  <ShieldCheck size={18} />
                  {i18n.language === 'ar' ? 'إضافة منتج جديد' : 'Add New Product'}
                </button>
              )}
              
              <div className="pt-4 border-t border-brand-charcoal/5 flex gap-4">
                <button
                  onClick={() => {
                    i18n.changeLanguage('en');
                    setIsOpen(false);
                  }}
                  className={`text-sm font-bold ${i18n.language === 'en' ? 'text-brand-gold' : 'text-brand-charcoal/40'}`}
                >
                  ENGLISH
                </button>
                <button
                  onClick={() => {
                    i18n.changeLanguage('ar');
                    setIsOpen(false);
                  }}
                  className={`text-sm font-bold font-arabic ${i18n.language === 'ar' ? 'text-brand-gold' : 'text-brand-charcoal/40'}`}
                >
                  العربية
                </button>
              </div>
            </div>
          </motion.div>
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
                      className="w-full bg-transparent border-none outline-none ring-0 focus:ring-0 text-base font-medium placeholder:text-brand-charcoal/20 text-brand-charcoal py-3"
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
                    onClick={() => setSearchQuery(tag)}
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
