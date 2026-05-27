/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { StoreProvider } from './StoreContext';
import { AuthProvider } from './AuthContext';
import { AlertProvider } from './contexts/AlertContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Logo from './components/Logo';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';
import TrackOrderPage from './pages/TrackOrderPage';
import OrdersPage from './pages/OrdersPage';
import ProductDetailPage from './pages/ProductDetailPage';
import AdminDashboard from './pages/AdminDashboard';
import DropShippingPage from './pages/DropShippingPage';
import PoliciesPage from './pages/PoliciesPage';
import GiftAdvisorPage from './pages/GiftAdvisorPage';
import AddProductModal from './components/AddProductModal';
import QuickViewModal from './components/QuickViewModal';
import { ImageLightboxModal } from './components/ImageLightboxModal';
import { ChatWidget } from './components/ChatWidget';
import { FortuneWheel } from './components/FortuneWheel';
import { CartDrawer } from './components/CartDrawer';
import { useStore } from './StoreContext';
import { PromotionBar } from './components/PromotionBar';
import { NewsletterPopup } from './components/NewsletterPopup';
import ScrollProgress from './components/ScrollProgress';
import { useAuth } from './AuthContext';
import { AnimatePresence } from 'motion/react';

const GlobalModals = () => {
  const { isAddModalOpen, setIsAddModalOpen, editingProduct, setEditingProduct, quickViewProduct, setQuickViewProduct } = useStore();
  
  return (
    <>
      <AddProductModal 
        isOpen={isAddModalOpen} 
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingProduct(null);
        }} 
        editingProduct={editingProduct} 
      />
      <AnimatePresence>
        {quickViewProduct && (
          <QuickViewModal 
            product={quickViewProduct} 
            onClose={() => setQuickViewProduct(null)} 
          />
        )}
      </AnimatePresence>
      <ImageLightboxModal />
      <CartDrawer />
    </>
  );
};

export default function App() {
  const { i18n, t } = useTranslation();
  const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';

  return (
    <HelmetProvider>
      <Router>
        <AlertProvider>
          <AuthProvider>
            <StoreProvider>
              <div className={`flex flex-col min-h-screen font-sans ${dir === 'rtl' ? 'font-arabic' : ''}`} dir={dir}>
                <AppContent />
              </div>
            </StoreProvider>
          </AuthProvider>
        </AlertProvider>
      </Router>
    </HelmetProvider>
  );
}

function AppContent() {
  const { isLoading: storeLoading } = useStore();
  const { loading: authLoading } = useAuth();
  const { t, i18n } = useTranslation();
  const [isSafetyTimeoutReached, setIsSafetyTimeoutReached] = useState(false);

  useEffect(() => {
    console.log("App loading state:", { storeLoading, authLoading });
    const timer = setTimeout(() => {
      if (storeLoading || authLoading) {
        console.warn("Safety timeout reached! Forcing app display despite loading states.");
        setIsSafetyTimeoutReached(true);
      }
    }, 5000); // Increased to 5 seconds to give more time to slow connections
    
    // Add a global fallback to show something if the app is still black
    if (typeof window !== 'undefined') {
      (window as any).forceLive = () => setIsSafetyTimeoutReached(true);
    }
    
    return () => clearTimeout(timer);
  }, [storeLoading, authLoading]);

  // Session & Unique Visitor Tracking
  useEffect(() => {
    try {
      const isSessionTracked = sessionStorage.getItem('onxifi_session_tracked');
      if (!isSessionTracked) {
        sessionStorage.setItem('onxifi_session_tracked', 'true');
        
        let visitorId = localStorage.getItem('onxifi_visitor_id');
        if (!visitorId) {
          visitorId = `v_${Math.random().toString(36).substring(2, 11)}`;
          localStorage.setItem('onxifi_visitor_id', visitorId);
        }
        
        // Dynamic import to avoid hindering initial App render performance
        Promise.all([
          import('./lib/firebase'),
          import('firebase/firestore')
        ]).then(([{ db }, { collection, addDoc, serverTimestamp }]) => {
          if (db && db.type !== 'mock') {
            addDoc(collection(db, 'visits'), {
              visitorId,
              timestamp: serverTimestamp() || new Date().toISOString(),
              userAgent: navigator.userAgent,
              language: navigator.language || 'ar',
              referer: document.referrer || 'direct',
              page: window.location.pathname
            }).catch(err => {
              console.warn("Failed tracking visit in Firestore:", err);
            });
          }
        }).catch(err => {
          console.warn("Dynamic import for tracking modules failed:", err);
        });
      }
    } catch (e) {
      console.warn("Error executing session visit tracking logic:", e);
    }
  }, []);

  if ((storeLoading || authLoading) && !isSafetyTimeoutReached) {
    return (
      <div className="fixed inset-0 bg-[#0A0A0B] flex flex-col items-center justify-center z-[9999]">
        <div className="flex items-center gap-3 mb-8">
          {i18n.language === 'ar' ? (
            <span dir="rtl" className="text-3xl sm:text-4xl lg:text-5xl font-arabic font-extrabold tracking-wide leading-none flex items-center select-none uppercase gap-1.5">
              <span className="text-white">اونكس</span>
              <span className="inline-block px-1.5 py-1 text-transparent bg-clip-text bg-gradient-to-r from-[#C5A05B] to-[#EAD8B1] drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
                فاي
              </span>
            </span>
          ) : (
            <span dir="ltr" className="text-3xl sm:text-4xl lg:text-5xl font-logo font-extrabold tracking-wider leading-none flex items-baseline select-none uppercase">
              <span className="text-white">ONXI</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C5A05B] to-[#EAD8B1] drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
                FI
              </span>
            </span>
          )}
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 animate-[loading_1.5s_ease-in-out_infinite]" style={{ width: '40%' }} />
          </div>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mt-4">
            {i18n.language === 'ar' ? 'جاري التحميل...' : 'Loading Excellence...'}
          </p>
          
          {/* Debug info for user if loading takes too long */}
          <div className="mt-12 text-[10px] text-white/20 font-mono">
            Status: {storeLoading ? 'Store[L]' : 'Store[OK]'} | {authLoading ? 'Auth[L]' : 'Auth[OK]'}
          </div>
        </div>
        <style>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(300%); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('app.title', 'ONXIFI | Lifestyle Store')}</title>
        <meta name="description" content={t('app.description', 'ONXIFI is your premier lifestyle store with regional payment integrations.')} />
      </Helmet>
      <header className="fixed top-0 left-0 w-full z-[100]">
        <PromotionBar />
        <Navbar />
      </header>
      <main className="flex-grow pt-40 sm:pt-48">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/track" element={<TrackOrderPage />} />
          <Route path="/track/:trackingId" element={<TrackOrderPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/drop-shipping" element={<DropShippingPage />} />
          <Route path="/policies" element={<PoliciesPage />} />
          <Route path="/product/:productId" element={<ProductDetailPage />} />
          <Route path="/gift-advisor" element={<GiftAdvisorPage />} />
        </Routes>
      </main>
      <Footer />
      <GlobalModals />
      <ChatWidget />
      <FortuneWheel />
      <NewsletterPopup />
      <ScrollProgress />
    </>
  );
}
