import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../AuthContext';
import { useAlert } from '../contexts/AlertContext';
import { db, auth } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, limit, getDocs } from 'firebase/firestore';
import { Order, Product } from '../types';
import { useStore } from '../StoreContext';
import { extractProductFromUrl } from '../services/geminiService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, Users, ShoppingBag, DollarSign, Package, 
  Clock, CheckCircle, Truck, AlertCircle, ArrowUpRight,
  Plus, Edit, Trash2, Search as SearchIcon, Filter, ExternalLink,
  ChevronRight, ChevronDown, Wand2, Loader2, Sparkles, Save, Clipboard
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { products, deleteProduct, setIsAddModalOpen, setEditingProduct, addToProducts } = useStore();
  const { showAlert } = useAlert();
  const { user, isAdmin, login, signout } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'analytics' | 'orders' | 'products' | 'winning' | 'marketing'>('analytics');
  const [importUrl, setImportUrl] = useState('');
  const [isAiGeneratingAd, setIsAiGeneratingAd] = useState(false);
  const [marketingProduct, setMarketingProduct] = useState<Product | null>(null);
  const [generatedAd, setGeneratedAd] = useState<{ tiktok: string, snapchat: string, instagram: string } | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [newTrackingNumber, setNewTrackingNumber] = useState('');
  
  // Winning products data with better links
  const [winningProducts] = useState([
    {
      id: 'win_1',
      name: 'Smart Neck Massager Pro',
      price: 29.99,
      image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=600',
      category: 'New',
      colors: ['White', 'Black'],
      sizes: ['One Size'],
      description: 'The ultimate smart massager for neck pain relief.',
      supplierUrl: 'https://www.aliexpress.com/w/wholesale-neck-massager.html',
      supplierName: 'HealthTech Global'
    },
    {
      id: 'win_2',
      name: 'Portable Lint Remover',
      price: 12.50,
      image: 'https://images.unsplash.com/photo-1550505393-fa7b6ad5e888?auto=format&fit=crop&q=80&w=600',
      category: 'Best Seller',
      colors: ['Green', 'Gold'],
      sizes: ['Standard'],
      description: 'Easily remove lint and fuzz from your favorite clothes.',
      supplierUrl: 'https://www.aliexpress.com/w/wholesale-portable-lint-remover.html',
      supplierName: 'HomeEase Store'
    },
    {
      id: 'win_3',
      name: 'Wireless Car Vacuum',
      price: 45.00,
      image: 'https://images.unsplash.com/photo-1534346506306-69974f762699?auto=format&fit=crop&q=80&w=600',
      category: 'New',
      colors: ['Black'],
      sizes: ['Mini'],
      description: 'High suction power in a compact wireless design.',
      supplierUrl: 'https://www.aliexpress.com/w/wholesale-car-vacuum.html',
      supplierName: 'AutoShine Official'
    }
  ]);

  const handleMagicImport = async () => {
    if (!importUrl) return;
    setIsExtracting(true);
    setExtractionStatus(null);
    try {
      const extracted = await extractProductFromUrl(importUrl);
      const newProd: Product = {
        ...extracted,
        id: 'p_' + Math.random().toString(36).substr(2, 9),
        supplierUrl: importUrl,
        supplierName: importUrl.includes('aliexpress') ? 'AliExpress' : (importUrl.includes('amazon') ? 'Amazon' : 'External'),
        colorImages: {}
      };
      setEditingProduct(newProd);
      setIsAddModalOpen(true);
      setImportUrl('');
      setExtractionStatus({
        type: 'success',
        message: t('admin.importSuccess')
      });
    } catch (err: any) {
      setExtractionStatus({
        type: 'error',
        message: t('admin.importError')
      });
    } finally {
      setIsExtracting(false);
    }
  };
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id
        };
      }) as Order[];
      setOrders(ordersData);
      setRecentOrders(ordersData.slice(0, 5));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="pt-40 pb-20 px-4 max-w-2xl mx-auto text-center space-y-8 bg-[#0A0A0B] min-h-screen">
        <motion.div 
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          className="w-24 h-24 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-500/20"
        >
          <AlertCircle className="text-red-500 w-12 h-12" />
        </motion.div>
        
        <div className="space-y-4">
          <h1 className="text-4xl font-black text-white tracking-tighter sm:text-5xl">
            {t('admin.restrictedArea')}
          </h1>
          <p className="text-white/60 text-lg max-w-md mx-auto">
            {user 
              ? (i18n.language === 'ar' 
                  ? `أنت مسجل دخول كـ (${user.email}) ولكن هذا الحساب ليس له صلاحيات المسؤول.` 
                  : `You are signed in as (${user.email}) but this account doesn't have admin privileges.`)
              : (i18n.language === 'ar' ? 'سجل دخولك كمسؤول للتحكم في المتجر' : 'Sign in as admin to manage the store')
            }
          </p>
        </div>
        
        <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 space-y-4">
          {!user ? (
            <button 
              onClick={() => login()}
              className="w-full bg-[#4F46E5] text-white py-5 rounded-2xl font-black text-lg hover:bg-[#4338CA] transition-all shadow-2xl shadow-indigo-500/40 hover:-translate-y-1"
            >
              {t('admin.loginWithGoogle')}
            </button>
          ) : (
            <div className="space-y-4">
                <button 
                onClick={() => signout()}
                className="w-full bg-white/10 text-white py-5 rounded-2xl font-black text-lg hover:bg-white/20 transition-all border border-white/10"
                >
                {t('admin.logout')}
                </button>
                <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/10 text-left">
                    <p className="text-xs font-bold text-red-400 mb-2 uppercase tracking-widest">Debug Info:</p>
                    <div className="space-y-1 text-[10px] font-mono text-white/40">
                        <p>Logged Email: <span className="text-white">{user.email || 'NO EMAIL'}</span></p>
                        <p>Expected: <span className="text-brand-gold">kmerro25@gmail.com</span></p>
                        <p>Project ID: <span className="text-brand-gold">{auth.app.options.projectId}</span></p>
                        <p>Current Domain: <span className="text-white">{window.location.hostname}</span></p>
                        <p>Auth Ready: <span className={user ? "text-green-400" : "text-red-400"}>{user ? "YES" : "NO"}</span></p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={async () => {
                          const { checkIfAdmin } = await import('../lib/firebase');
                          const status = await checkIfAdmin(user);
                          showAlert(`${t('admin.adminStatus')}: ${status}`, 'info');
                          window.location.reload();
                        }}
                        className="mt-4 flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                      >
                        {t('admin.adminStatus')}
                      </button>
                      <button 
                        onClick={async () => {
                          try {
                            const { db } = await import('../lib/firebase');
                            const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
                            const docRef = await addDoc(collection(db, 'test_writes'), {
                              userId: user?.uid || 'anonymous',
                              timestamp: serverTimestamp(),
                              test: true
                            });
                            showAlert(`${t('common.save')} Success! ID: ${docRef.id}`, 'success');
                          } catch (e: any) {
                            showAlert(`${t('common.error')}: ${e.message}`, 'error');
                            console.warn(e);
                          }
                        }}
                        className="mt-4 flex-1 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border border-green-500/20"
                      >
                        Test Write
                      </button>
                    </div>
                </div>
            </div>
          )}
          
          <div className="flex flex-col gap-2 pt-4">
               <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">{t('admin.stepsToFixAccess')}:</p>
               
               <div className="flex flex-col gap-2">
                   <p className="text-[10px] text-white/60">1. {i18n.language === 'ar' ? 'افتح المشروع الصحيح في Firebase Console' : 'Open the CORRECT project in Firebase Console'}:</p>
                   <a 
                    href={`https://console.firebase.google.com/project/${auth.app.options.projectId}/authentication/settings`}
                    target="_blank" 
                    rel="noreferrer"
                    className="bg-[#4F46E5]/20 text-[#4F46E5] p-2 rounded text-[10px] font-bold text-center border border-[#4F46E5]/30 hover:bg-[#4F46E5]/30"
                   >
                       {i18n.language === 'ar' ? 'إعدادات تسجيل الدخول' : 'Firebase Settings'}
                   </a>
                   <p className="text-[10px] text-white/60 mt-2">2. {t('admin.authorizedDomains')}:</p>
                   <div className="grid grid-cols-1 gap-1">
                       <code className="bg-black/40 p-2 rounded text-[10px] text-brand-gold break-all">ais-dev-6ft3dpnmbas5ey35iluk4k-816940702897.europe-west2.run.app</code>
                       <code className="bg-black/40 p-2 rounded text-[10px] text-brand-gold break-all">ais-pre-6ft3dpnmbas5ey35iluk4k-816940702897.europe-west2.run.app</code>
                       <code className="bg-black/40 p-2 rounded text-[10px] text-brand-gold break-all">game-hub-merro4h-alts-projects.vercel.app</code>
                       <code className="bg-black/40 p-2 rounded text-[10px] text-brand-gold break-all">ahstore.shop</code>
                   </div>
                   <div className="mt-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                       <p className="text-xs font-bold text-indigo-400 mb-2">
                           {t('admin.howToFixLogin')}:
                       </p>
                       <p className="text-[10px] text-white/60 leading-relaxed">
                           {t('admin.howToFixLoginDesc')}
                       </p>
                   </div>
               </div>
          </div>
        </div>
        
        <div className="pt-8 text-[10px] text-white/20 font-mono flex items-center justify-center gap-4">
            <span>UID: {user?.uid || 'NONE'}</span>
            <span>ROLE: {isAdmin ? 'ADMIN' : 'USER'}</span>
        </div>
      </div>
    );
  }

  // Calculate Stats
  const totalRevenue = orders.reduce((acc, order) => acc + (order.total || 0), 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  
  // Data for Charts
  const ordersByStatus = [
    { name: 'Pending', value: orders.filter(o => o.status === 'pending').length, color: '#f59e0b' },
    { name: 'Processing', value: orders.filter(o => o.status === 'processing').length, color: '#3b82f6' },
    { name: 'Shipped', value: orders.filter(o => o.status === 'shipped').length, color: '#6366f1' },
    { name: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, color: '#22c55e' },
  ];

  // Group revenue by date (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const revenueData = last7Days.map(date => {
    const dayTotal = orders
      .filter(o => {
        const orderDate = (o.createdAt as any)?.toDate?.() || new Date(o.createdAt);
        return orderDate.toISOString().split('T')[0] === date;
      })
      .reduce((acc, o) => acc + (o.total || 0), 0);
    
    return {
      date: date.split('-').slice(1).join('/'),
      revenue: dayTotal
    };
  });

  const filteredProductsManage = products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
  });

  const generateAdCopy = async (product: any) => {
    if (!product) return;
    setIsAiGeneratingAd(true);
    setGeneratedAd(null);
    try {
      const { GoogleGenAI } = await import("@google/genai");
      
      let apiKey = "";
      try {
        apiKey = process.env.GEMINI_API_KEY || (window as any).process?.env?.GEMINI_API_KEY || "";
      } catch (e) {
        apiKey = (window as any).process?.env?.GEMINI_API_KEY || "";
      }

      if (!apiKey) {
        throw new Error('API_KEY_MISSING');
      }

      const ai = new GoogleGenAI({ apiKey });
      const isArabic = i18n.language === 'ar';
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Product: ${product.name}, Category: ${product.category}. Platform: TikTok, Snapchat, Instagram. Language: ${isArabic ? 'Arabic' : 'English'}.`,
        config: {
          systemInstruction: `You are a viral marketing expert. Create high-converting ad copy for TikTok, Snapchat, and Instagram. 
          Return ONLY a valid JSON object with keys: "tiktok", "snapchat", "instagram". 
          No markdown, no talk. 
          Tone: ${isArabic ? 'Saudi/Gulf creative dialect, energetic' : 'Catchy, energetic, scrolls-stopping'}.`,
        }
      });

      const text = response.text;
      if (text) {
        // Clean markdown if present
        const jsonStr = text.replace(/```json|```/g, '').trim();
        const ads = JSON.parse(jsonStr);
        if (ads.tiktok && ads.snapchat && ads.instagram) {
          setGeneratedAd(ads);
          showAlert(isArabic ? 'تم إنشاء الإعلانات!' : 'Ads generated!', 'success');
        } else {
          throw new Error('Invalid JSON structure');
        }
      } else {
        throw new Error('Empty AI response');
      }
    } catch (err: any) {
      console.error('Ad Gen error:', err);
      let errorMsg = i18n.language === 'ar' ? 'فشل إنشاء الإعلانات.' : 'Failed to generate ads.';
      if (err.message === 'API_KEY_MISSING') {
        errorMsg = i18n.language === 'ar' ? 'مفتاح API غير متوفر.' : 'API Key missing.';
      }
      showAlert(errorMsg, 'error');
    } finally {
      setIsAiGeneratingAd(false);
    }
  };

  return (
    <div className="pt-24 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 bg-[#0A0A0B] text-white min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-white">
            {t('admin.dashboard')}
          </h1>
          <p className="text-white/40 font-medium">
            {t('admin.welcomeAdmin', { name: user?.displayName || 'Administrator' })}
          </p>
        </div>
        
        <div className="flex items-center gap-2 bg-[#1A1A1A] p-1.5 rounded-2xl border border-white/5">
            {[
                { id: 'analytics', label: t('admin.analytics'), icon: TrendingUp },
                { id: 'products', label: t('admin.products'), icon: Package },
                { id: 'orders', label: t('admin.orders'), icon: ShoppingBag },
                { id: 'winning', label: t('admin.winning'), icon: ArrowUpRight },
                { id: 'marketing', label: i18n.language === 'ar' ? 'التسويق' : 'Marketing', icon: Sparkles },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        activeTab === tab.id 
                            ? 'bg-[#4F46E5] text-white shadow-lg shadow-indigo-500/20' 
                            : 'text-white/40 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <tab.icon size={14} />
                    {tab.label}
                </button>
            ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
          {activeTab === 'marketing' && (
               <motion.div 
                 key="marketing"
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -20 }}
                 className="space-y-8"
               >
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                   {/* Ad Copy Generator */}
                   <div className="bg-[#1A1A1A] p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                     <div>
                       <h3 className="text-xl font-black uppercase tracking-tighter mb-2 flex items-center gap-2">
                         <Sparkles className="text-brand-gold" />
                         {i18n.language === 'ar' ? 'منشئ محتوى إعلاني ذكي' : 'Smart Ad Copy Generator'}
                       </h3>
                       <p className="text-white/40 text-sm">
                         {i18n.language === 'ar' ? 'اختر منتجاً وسيقوم الذكاء الاصطناعي بكتابة نصوص إعلانية جذابة للمنصات المختلفة.' : 'Select a product and let AI write high-converting ad copy for social platforms.'}
                       </p>
                     </div>

                     <div className="space-y-4">
                       <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block">{i18n.language === 'ar' ? 'اختر المنتج' : 'Select Product'}</label>
                       <select 
                         className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-brand-gold transition-all text-sm font-bold"
                         onChange={(e) => {
                           const prod = products.find(p => p.id === e.target.value);
                           setMarketingProduct(prod || null);
                           setGeneratedAd(null);
                         }}
                         value={marketingProduct?.id || ''}
                       >
                         <option value="">{i18n.language === 'ar' ? '-- اختر منتجاً --' : '-- Choose a product --'}</option>
                         {products.map(p => (
                           <option key={p.id} value={p.id}>{p.name}</option>
                         ))}
                       </select>

                       <button 
                         disabled={!marketingProduct || isAiGeneratingAd}
                         onClick={() => generateAdCopy(marketingProduct)}
                         className="w-full py-5 bg-brand-gold text-brand-charcoal rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-brand-gold/10 hover:-translate-y-1 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                       >
                         {isAiGeneratingAd ? (
                           <Loader2 size={16} className="animate-spin" />
                         ) : (
                           <Wand2 size={16} />
                         )}
                         {i18n.language === 'ar' ? 'توليد نصوص إعلانية' : 'Generate Ad Copy'}
                       </button>
                     </div>

                     {generatedAd && (
                       <div className="space-y-4 pt-4">
                         {[
                           { platform: 'TikTok', content: generatedAd.tiktok, color: 'text-white' },
                           { platform: 'Snapchat', content: generatedAd.snapchat, color: 'text-yellow-400' },
                           { platform: 'Instagram', content: generatedAd.instagram, color: 'text-pink-400' }
                         ].map(ad => (
                           <div key={ad.platform} className="bg-black/60 p-5 rounded-2xl border border-white/5 space-y-2 relative group">
                             <div className="flex justify-between items-center">
                               <span className={`text-[10px] font-black uppercase tracking-widest ${ad.color}`}>{ad.platform} Ad</span>
                               <button 
                                 onClick={() => {
                                   navigator.clipboard.writeText(ad.content);
                                   showAlert(i18n.language === 'ar' ? 'تم النسخ!' : 'Copied!', 'success');
                                 }}
                                 className="text-white/30 hover:text-white transition-colors"
                               >
                                 <Clipboard size={14} />
                               </button>
                             </div>
                             <p className="text-sm text-white/80 leading-relaxed font-medium">{ad.content}</p>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>

                   {/* Marketing Strategy */}
                   <div className="bg-[#1A1A1A] p-8 rounded-[2.5rem] border border-white/5 space-y-6">
                     <div>
                       <h3 className="text-xl font-black uppercase tracking-tighter mb-2 flex items-center gap-2">
                         <TrendingUp className="text-[#4F46E5]" />
                         {i18n.language === 'ar' ? 'استراتيجية تسويق الدروبشيبينغ' : 'Dropshipping Marketing Strategy'}
                       </h3>
                       <p className="text-white/40 text-sm">
                         {i18n.language === 'ar' ? 'دليلك للترويج لمتجرك والوصول لأولى مبيعاتك بنجاح.' : 'Your guide to promoting your store and achieving your first sales successfully.'}
                       </p>
                     </div>

                     <div className="space-y-4">
                        {[
                          {
                            title: i18n.language === 'ar' ? 'استهدف تيك توك أورجانيك (TikTok Organic)' : 'TikTok Organic strategy',
                            desc: i18n.language === 'ar' ? 'قم بطلب عينة من المنتج وصور فيديوهات من منزلك. الإبداع والبساطة يجلبان ملايين المشاهدات مجاناً.' : 'Order a product sample and film at home. Creativity and simplicity bring millions of views for free.',
                            icon: '🎥'
                          },
                          {
                            title: i18n.language === 'ar' ? 'إعلانات سناب شات (Snapchat Ads)' : 'Snapchat Ads',
                            desc: i18n.language === 'ar' ? 'مثالية للسوق السعودي والخليجي. تكلفة التحويل غالباً ما تكون أقل مقارنة بمنصات أخرى.' : 'Perfect for Saudi and Gulf markets. Conversion costs are often lower compared to other platforms.',
                            icon: '👻'
                          },
                          {
                            title: i18n.language === 'ar' ? 'التعاون مع المؤثرين الصغار (Micro-Influencers)' : 'Micro-Influencers Collaboration',
                            desc: i18n.language === 'ar' ? 'تواصل مع حسابات تملك 10k-50k متابع في نيتش منتجك. الثقة لديهم أعلى والتكلفة أقل.' : 'Reach out to accounts with 10k-50k followers in your niche. They have high trust and lower costs.',
                            icon: '🤝'
                          },
                          {
                            title: i18n.language === 'ar' ? 'إعلانات إعادة الاستهداف (Retargeting)' : 'Retargeting Ads',
                            desc: i18n.language === 'ar' ? 'استخدم بكسل تيك توك أو فيسبوك لإعادة الوصول للأشخاص الذين أضافوا للسلة ولم يشتروا.' : 'Use TikTok/Meta Pixels to re-engage people who added to cart but didn\'t buy.',
                            icon: '🎯'
                          }
                        ].map((tip, i) => (
                          <div key={i} className="flex gap-4 items-start p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                            <span className="text-2xl">{tip.icon}</span>
                            <div className="space-y-1">
                              <h4 className="text-sm font-black text-white">{tip.title}</h4>
                              <p className="text-xs text-white/40 leading-relaxed">{tip.desc}</p>
                            </div>
                          </div>
                        ))}
                     </div>
                   </div>
                 </div>
               </motion.div>
          )}

          {activeTab === 'analytics' && (
              <motion.div 
                key="analytics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: t('admin.stats.sales'), value: `$${totalRevenue.toLocaleString()}`, icon: <DollarSign />, color: 'bg-green-500' },
                        { label: t('admin.stats.orders'), value: totalOrders, icon: <ShoppingBag />, color: 'bg-[#4F46E5]' },
                        { label: t('admin.stats.inventory'), value: products.length, icon: <Package />, color: 'bg-brand-gold' },
                        { label: t('admin.stats.users'), value: pendingOrders, icon: <Clock />, color: 'bg-amber-500' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-[#1A1A1A] p-6 rounded-[2rem] border border-white/5 flex items-center gap-5">
                            <div className={`${stat.color} w-14 h-14 rounded-2xl text-white flex items-center justify-center shadow-lg flex-shrink-0`}>
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{stat.label}</p>
                                <p className="text-2xl font-black text-white tracking-tighter">{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-[#1A1A1A] p-8 rounded-[2.5rem] border border-white/5">
                        <h3 className="text-lg font-black mb-8 uppercase tracking-widest text-white/40">{t('admin.revenueFlow')}</h3>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" strokeOpacity={0.5} />
                                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666' }} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#111', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}
                                    />
                                    <Line type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={5} dot={{ r: 6, fill: '#4F46E5', strokeWidth: 0 }} activeDot={{ r: 8, strokeWidth: 0 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-[#1A1A1A] p-8 rounded-[2.5rem] border border-white/5">
                        <h3 className="text-lg font-black mb-8 uppercase tracking-widest text-white/40">{t('admin.distribution')}</h3>
                        <div className="h-72 w-full flex flex-col items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={ordersByStatus}
                                        innerRadius={80}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {ordersByStatus.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Recent Items Preview */}
                <div className="bg-[#1A1A1A] rounded-[2.5rem] border border-white/5 overflow-hidden">
                    <div className="p-8 border-b border-white/5 flex justify-between items-center">
                        <h3 className="text-lg font-black uppercase tracking-widest text-white/40">{t('admin.recentActivity')}</h3>
                        <button onClick={() => setActiveTab('orders')} className="text-[10px] font-black uppercase tracking-widest text-[#4F46E5] hover:underline">{t('admin.viewAllOrders')}</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left rtl:text-right">
                            <thead className="bg-black/20">
                                <tr>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white/30">{t('admin.orders')}</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white/30">{t('admin.clientDetails')}</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white/30">{t('admin.value')}</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white/30">{t('nav.trackOrder')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {recentOrders.map((order) => (
                                    <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-5">
                                            <span className="text-xs font-mono font-bold text-white/40">#{order.id.slice(-6).toUpperCase()}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <p className="text-sm font-black">{order.shippingAddress.fullName}</p>
                                            <p className="text-[10px] text-white/40">{order.shippingAddress.city}</p>
                                        </td>
                                        <td className="px-8 py-5 font-mono font-black text-brand-gold">${order.total.toFixed(2)}</td>
                                        <td className="px-8 py-5">
                                            <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                                                order.status === 'delivered' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                                order.status === 'pending' ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' :
                                                'bg-indigo-400/10 text-indigo-400 border-indigo-400/20'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {recentOrders.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center text-white/20 uppercase tracking-[0.3em] font-black">{t('admin.noRecentOrders')}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
              </motion.div>
          )}

          {activeTab === 'products' && (
              <motion.div 
                key="products"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                      <div className="relative flex-grow max-w-md w-full">
                          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                          <input 
                            type="text" 
                            placeholder={t('common.search')}
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            className="w-full bg-[#1A1A1A] border border-white/5 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white focus:ring-2 focus:ring-[#4F46E5] outline-none transition-all"
                          />
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                          <select 
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="bg-[#1A1A1A] border border-white/5 rounded-2xl px-4 py-3.5 text-xs font-bold uppercase tracking-widest outline-none h-full"
                          >
                                <option value="All">{t('common.noData').includes('la') ? 'الكل' : 'All'}</option>
                                <option value="New">{t('categories.new')}</option>
                                <option value="Best Seller">{t('categories.bestSeller')}</option>
                                <option value="Offers">{t('categories.offers')}</option>
                          </select>
                          <button 
                            onClick={() => {
                                console.log('Add New Product button clicked in Dashboard');
                                setEditingProduct(null);
                                setIsAddModalOpen(true);
                            }}
                            className="bg-brand-charcoal text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-brand-gold transition-all shadow-xl shadow-brand-gold/5 whitespace-nowrap border-2 border-brand-gold/20"
                          >
                              <Plus size={18} className="text-brand-gold" />
                              {t('admin.addProduct')}
                          </button>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {filteredProductsManage.map(product => (
                          <div key={product.id} className="bg-[#1A1A1A] p-4 rounded-[2rem] border border-white/5 group hover:border-[#4F46E5]/40 transition-all">
                              <div className="aspect-square rounded-2xl overflow-hidden mb-4 relative bg-black/40">
                                  <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={product.name} />
                                  <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                      <button 
                                        onClick={() => {
                                            setEditingProduct(product);
                                            setIsAddModalOpen(true);
                                        }}
                                        className="p-2 bg-white text-black rounded-lg shadow-xl hover:bg-[#4F46E5] hover:text-white transition-colors"
                                      >
                                          <Edit size={14} />
                                      </button>
                                      <button 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (confirm(t('shop.deleteConfirm'))) {
                                                deleteProduct(product.id);
                                            }
                                        }}
                                        className="p-2.5 bg-red-600 text-white rounded-xl shadow-xl hover:bg-black transition-all hover:scale-110 active:scale-95"
                                      >
                                          <Trash2 size={16} />
                                      </button>
                                  </div>
                                  <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest text-white/80">
                                      {product.category}
                                  </div>
                              </div>
                              <h4 className="font-black text-sm mb-1 truncate">{product.name}</h4>
                              <div className="flex items-center justify-between">
                                  <span className="text-indigo-400 font-mono font-black text-xs">${product.price}</span>
                                  <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{product.colors.length} Colors</span>
                              </div>
                          </div>
                      ))}
                      {filteredProductsManage.length === 0 && (
                          <div className="col-span-full py-32 text-center">
                              <Package size={48} className="mx-auto text-white/10 mb-4" />
                              <p className="text-white/20 uppercase tracking-[0.5em] font-black">{t('shop.noProducts')}</p>
                          </div>
                      )}
                  </div>
              </motion.div>
          )}

          {activeTab === 'winning' && (
               <motion.div 
                 key="winning"
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -20 }}
                 className="space-y-8"
               >
                 <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                    <div className="max-w-2xl">
                        <h2 className="text-3xl font-black uppercase tracking-tighter mb-2">{i18n.language === 'ar' ? 'مستكشف المنتجات الرابحة' : 'WINNING PRODUCTS EXPLORER'}</h2>
                        <p className="text-white/40 text-sm">{i18n.language === 'ar' ? 'منتجات مختارة بعناية بناءً على ترندات السوق العالمي ومعدلات التحويل العالية.' : 'Curated products based on global market trends and high conversion rates.'}</p>
                    </div>
                    <div className="flex items-center gap-4 px-6 py-4 bg-brand-gold/10 rounded-2xl border border-brand-gold/20">
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-gold">{i18n.language === 'ar' ? 'آخر تحديث' : 'LAST SYNC'}</p>
                            <p className="text-xs font-bold">Today, 2:45 PM</p>
                        </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                     {winningProducts.map((prod) => (
                         <div key={prod.id} className="bg-[#1A1A1A] rounded-[3rem] overflow-hidden border border-white/5 flex flex-col group">
                             <div className="aspect-[4/3] overflow-hidden relative">
                                 <img src={prod.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                                 <div className="absolute top-6 left-6 bg-brand-gold text-brand-charcoal px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                                     {prod.category}
                                 </div>
                             </div>
                             <div className="p-8 space-y-6 flex-grow flex flex-col">
                                 <div className="flex justify-between items-start">
                                     <div>
                                         <h4 className="text-xl font-black uppercase tracking-tighter mb-1">{prod.name}</h4>
                                         <p className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em]">{prod.supplierName}</p>
                                     </div>
                                     <div className="text-right">
                                         <p className="text-2xl font-black text-white">${prod.price}</p>
                                         <p className="text-[10px] font-bold text-white/20">{t('admin.supplierCost')}</p>
                                     </div>
                                 </div>
                                 <p className="text-sm text-white/40 leading-relaxed flex-grow">{prod.description}</p>
                                 <div className="grid grid-cols-2 gap-4">
                                     <a 
                                        href={prod.supplierUrl} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="flex items-center justify-center gap-2 py-4 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
                                     >
                                         <ExternalLink size={14} /> {t('admin.viewSource')}
                                     </a>
                                    <button 
                                        onClick={async () => {
                                            try {
                                                const newProd: Product = {
                                                    id: 'p_' + Math.random().toString(36).substr(2, 9),
                                                    name: prod.name,
                                                    price: Math.round(prod.price * 1.8), // Auto margin
                                                    discountPrice: Math.round(prod.price * 1.5),
                                                    category: prod.category as any,
                                                    description: prod.description,
                                                    image: prod.image,
                                                    images: [prod.image],
                                                    colors: prod.colors,
                                                    sizes: prod.sizes,
                                                    rating: 5,
                                                    supplierName: prod.supplierName,
                                                    supplierUrl: prod.supplierUrl,
                                                    colorImages: {}
                                                };
                                                await addToProducts(newProd);
                                                showAlert(t('admin.importSuccess'), 'success');
                                                setActiveTab('products');
                                            } catch (err: any) {
                                                console.warn("Manual import failed:", err);
                                                showAlert(t('admin.importError'), 'error');
                                            }
                                        }}
                                        className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-brand-gold text-brand-charcoal text-[10px] font-black uppercase tracking-widest shadow-xl shadow-brand-gold/20 hover:-translate-y-1 transition-all"
                                    >
                                        <Plus size={14} /> {t('admin.importToStore')}
                                    </button>
                                 </div>
                             </div>
                         </div>
                     ))}
                 </div>
               </motion.div>
          )}

          {activeTab === 'orders' && (
              <motion.div 
                key="orders"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="bg-[#1A1A1A] rounded-[2.5rem] border border-white/5 overflow-hidden">
                    <div className="p-8 border-b border-white/5 flex justify-between items-center">
                        <h3 className="text-lg font-black uppercase tracking-widest text-white/40">Consolidated Orders</h3>
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-bold text-white/30">{orders.length} total entries</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left rtl:text-right">
                            <thead className="bg-black/20">
                                <tr>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white/30">{t('admin.orders')} ID</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white/30">{t('admin.clientDetails')}</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white/30">{t('admin.items')}</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white/30">{t('admin.value')}</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white/30">{t('nav.trackOrder')}</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white/30">{t('admin.supplierActions')}</th>
                                    <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white/30">{t('admin.date')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-6">
                                            <span className="text-xs font-mono font-bold text-indigo-400">#{order.id.slice(-8).toUpperCase()}</span>
                                            <div className="flex gap-1 mt-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-2 min-w-[250px]">
                                                <p className="text-sm font-black text-brand-gold">{order.shippingAddress.fullName}</p>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] text-white font-bold flex items-center gap-2">
                                                        <span className="text-white/30 uppercase tracking-widest">{t('contact.email')}:</span>
                                                        {order.shippingAddress.email}
                                                    </p>
                                                    <p className="text-[10px] text-white font-bold flex items-center gap-2">
                                                        <span className="text-white/30 uppercase tracking-widest">{t('contact.phone')}:</span>
                                                        {order.shippingAddress.phone}
                                                    </p>
                                                    <div className="h-px bg-white/5 my-2" />
                                                    <p className="text-[10px] text-white/80 leading-relaxed">
                                                        <span className="text-white/30 uppercase tracking-widest block mb-1">Shipping Details:</span>
                                                        {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.zipCode}, {order.shippingAddress.country}
                                                    </p>
                                                    <button 
                                                        onClick={() => {
                                                            const text = `${order.shippingAddress.fullName}\n${order.shippingAddress.phone}\n${order.shippingAddress.address}\n${order.shippingAddress.city}\n${order.shippingAddress.zipCode}\n${order.shippingAddress.country}`;
                                                            navigator.clipboard.writeText(text);
                                                            alert(i18n.language === 'ar' ? 'تم نسخ بيانات العنوان!' : 'Shipping info copied!');
                                                        }}
                                                        className="w-full mt-3 py-2 bg-brand-gold/20 text-brand-gold rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-brand-gold hover:text-white transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Save size={10} />
                                                        {i18n.language === 'ar' ? 'نسخ لـ علي إكسبريس' : 'Copy for AliExpress'}
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex -space-x-2">
                                                {order.items.slice(0, 3).map((item: any, idx) => (
                                                    <div key={idx} className="w-8 h-8 rounded-full border-2 border-[#1A1A1A] overflow-hidden bg-white">
                                                        <img src={item.image} className="w-full h-full object-cover" alt="" />
                                                    </div>
                                                ))}
                                                {order.items.length > 3 && (
                                                    <div className="w-8 h-8 rounded-full border-2 border-[#1A1A1A] bg-white/10 flex items-center justify-center text-[8px] font-black">
                                                        +{order.items.length - 3}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 font-mono font-black text-brand-gold">${order.total.toFixed(2)}</td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-center gap-2">
                                                    <select 
                                                        className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border bg-transparent outline-none cursor-pointer ${
                                                            order.status === 'delivered' ? 'text-green-400 border-green-500/20' :
                                                            order.status === 'pending' ? 'text-amber-400 border-amber-400/20' :
                                                            'text-indigo-400 border-indigo-400/20'
                                                        }`}
                                                        value={order.status}
                                                        onChange={async (e) => {
                                                            const newStatus = e.target.value as Order['status'];
                                                            try {
                                                                const { doc, updateDoc } = await import('firebase/firestore');
                                                                await updateDoc(doc(db, 'orders', order.id), { status: newStatus });
                                                                showAlert(i18n.language === 'ar' ? 'تم تحديث حالة الطلب!' : 'Order status updated!', 'success');
                                                            } catch (err: any) {
                                                                showAlert(`Update failed: ${err.message}`, 'error');
                                                            }
                                                        }}
                                                    >
                                                        <option value="pending" className="bg-[#111]">Pending</option>
                                                        <option value="processing" className="bg-[#111]">Processing</option>
                                                        <option value="shipped" className="bg-[#111]">Shipped</option>
                                                        <option value="delivered" className="bg-[#111]">Delivered</option>
                                                        <option value="cancelled" className="bg-[#111]">Cancelled</option>
                                                    </select>
                                                </div>

                                                {/* Tracking Number Input */}
                                                <div className="space-y-2">
                                                    {updatingOrderId === order.id ? (
                                                        <div className="flex gap-2">
                                                            <input 
                                                                type="text"
                                                                placeholder="TRK123456"
                                                                className="bg-black/40 border border-brand-gold/30 rounded-lg px-3 py-1.5 text-[10px] w-full outline-none focus:ring-1 focus:ring-brand-gold text-white"
                                                                value={newTrackingNumber}
                                                                onChange={(e) => setNewTrackingNumber(e.target.value)}
                                                                autoFocus
                                                            />
                                                            <button 
                                                                onClick={async () => {
                                                                    try {
                                                                        const { doc, updateDoc } = await import('firebase/firestore');
                                                                        await updateDoc(doc(db, 'orders', order.id), { 
                                                                            courierTrackingNumber: newTrackingNumber,
                                                                            status: newTrackingNumber ? 'shipped' : order.status 
                                                                        });
                                                                        showAlert(i18n.language === 'ar' ? 'تم حفظ رقم التتبع!' : 'Tracking saved!', 'success');
                                                                        setUpdatingOrderId(null);
                                                                        setNewTrackingNumber('');
                                                                    } catch (err: any) {
                                                                        showAlert(err.message, 'error');
                                                                    }
                                                                }}
                                                                className="bg-brand-gold text-brand-charcoal p-1.5 rounded-lg hover:bg-white transition-all"
                                                            >
                                                                <CheckCircle size={14} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            onClick={() => {
                                                                setUpdatingOrderId(order.id);
                                                                setNewTrackingNumber((order as any).courierTrackingNumber || '');
                                                            }}
                                                            className="flex items-center justify-center gap-2 w-full py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 text-white/60 hover:text-white transition-all"
                                                        >
                                                            <Truck size={12} className="text-brand-gold" />
                                                            {(order as any).courierTrackingNumber ? (order as any).courierTrackingNumber : (i18n.language === 'ar' ? 'إضافة رقم تتبع' : 'Add Tracking')}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-2">
                                                {order.items.map((item: any, idx) => (
                                                    item.supplierUrl && (
                                                        <a 
                                                            key={idx}
                                                            href={item.supplierUrl}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest bg-brand-gold/10 text-brand-gold px-3 py-2 rounded-xl border border-brand-gold/20 hover:bg-brand-gold hover:text-brand-charcoal transition-all whitespace-nowrap"
                                                        >
                                                            <ExternalLink size={10} />
                                                            {t('admin.orderFromSupplier')}
                                                        </a>
                                                    )
                                                ))}
                                                {!order.items.some((item: any) => item.supplierUrl) && (
                                                    <span className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{t('admin.manualFulfillment')}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-xs font-bold text-white/40">
                                                {(() => {
                                                    const dateValue = (order.createdAt as any)?.seconds ? (order.createdAt as any).seconds * 1000 : order.createdAt;
                                                    return new Date(dateValue).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US');
                                                })()}
                                            </p>
                                        </td>
                                    </tr>
                                ))}
                                {orders.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-8 py-32 text-center">
                                            <ShoppingBag size={48} className="mx-auto text-white/10 mb-4" />
                                            <p className="text-white/20 uppercase tracking-[0.5em] font-black">{t('common.noData')}</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
              </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
