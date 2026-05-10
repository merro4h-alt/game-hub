/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { StoreProvider } from './StoreContext';
import { AuthProvider } from './AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import CartPage from './pages/CartPage';
import TrackOrderPage from './pages/TrackOrderPage';
import OrdersPage from './pages/OrdersPage';
import ProductDetailPage from './pages/ProductDetailPage';
import AdminDashboard from './pages/AdminDashboard';
import DropShippingPage from './pages/DropShippingPage';
import AddProductModal from './components/AddProductModal';
import { ChatWidget } from './components/ChatWidget';
import { useStore } from './StoreContext';
import { PromotionBar } from './components/PromotionBar';
import { NewsletterPopup } from './components/NewsletterPopup';
import { BeautyAIConsultant } from './components/BeautyAIConsultant';
import { useAuth } from './AuthContext';

const GlobalModals = () => {
  const { isAddModalOpen, setIsAddModalOpen, editingProduct, setEditingProduct } = useStore();
  
  return (
    <AddProductModal 
      isOpen={isAddModalOpen} 
      onClose={() => {
        setIsAddModalOpen(false);
        setEditingProduct(null);
      }} 
      editingProduct={editingProduct} 
    />
  );
};

export default function App() {
  const { i18n, t } = useTranslation();
  const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';

  return (
    <Router>
      <AuthProvider>
        <StoreProvider>
          <div className={`flex flex-col min-h-screen font-sans ${dir === 'rtl' ? 'font-arabic' : ''}`} dir={dir}>
            <AppContent />
          </div>
        </StoreProvider>
      </AuthProvider>
    </Router>
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

  if ((storeLoading || authLoading) && !isSafetyTimeoutReached) {
    return (
      <div className="fixed inset-0 bg-[#0A0A0B] flex flex-col items-center justify-center z-[9999]">
        <div className="flex items-center gap-3 mb-8 animate-pulse">
          <span className="text-4xl font-black italic tracking-tighter text-white">
            Trendi<span className="text-[#4F46E5]">fi</span>
          </span>
          <div className="w-12 h-12 bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] rounded-[14px] flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 rotate-6">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 -rotate-6">
               <path d="M12 19V5M5 12l7-7 7 7" />
            </svg>
          </div>
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
          <Route path="/track" element={<TrackOrderPage />} />
          <Route path="/track/:trackingId" element={<TrackOrderPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/drop-shipping" element={<DropShippingPage />} />
          <Route path="/product/:productId" element={<ProductDetailPage />} />
        </Routes>
      </main>
      <Footer />
      <GlobalModals />
      <ChatWidget />
      <NewsletterPopup />
      <BeautyAIConsultant />
    </>
  );
}
