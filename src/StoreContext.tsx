import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Product, CartItem, WishlistItem } from './types';
import { INITIAL_PRODUCTS } from './constants';
import { useAuth } from './AuthContext';
import { useAlert } from './contexts/AlertContext';

interface StoreContextType {
  products: Product[];
  cart: CartItem[];
  wishlist: WishlistItem[];
  toggleWishlist: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  addToProducts: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  addToCart: (product: Product, color: string, size: string, quantity?: number) => void;
  removeFromCart: (productId: string, color: string, size: string) => void;
  updateCartQuantity: (productId: string, color: string, size: string, quantity: number) => void;
  clearCart: () => void;
  applyDiscountCode: (code: string) => { success: boolean; message: string };
  completePurchase: () => void;
  appliedDiscount: { code: string; percent: number } | null;
  hasPurchased: boolean;
  totalItems: number;
  totalPrice: number;
  discountedTotal: number;
  quickViewProduct: Product | null;
  setQuickViewProduct: (product: Product | null) => void;
  isAddModalOpen: boolean;
  setIsAddModalOpen: (isOpen: boolean) => void;
  editingProduct: Product | null;
  setEditingProduct: (product: Product | null) => void;
  isEditMode: boolean;
  setIsEditMode: (isEdit: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currency: string;
  setCurrency: (currency: string) => void;
  exchangeRate: number;
  formatPrice: (price: number) => string;
  filteredProducts: Product[];
  isLoading: boolean;
  recentlyViewed: Product[];
  addToRecentlyViewed: (product: Product) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  settings: {
    googlePayMerchantId: string;
    storeName: string;
    whatsappNumber: string;
    baseShippingRate: number;
    stripePublicKey: string;
    bankDetails: import('./types').BankDetails;
  };
  campaigns: import('./types').Campaign[];
  addCampaign: (campaign: Omit<import('./types').Campaign, 'id'>) => Promise<void>;
  updateCampaign: (campaign: import('./types').Campaign) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  updateSettings: (newSettings: Partial<StoreContextType['settings']>) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n, t } = useTranslation();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [products, setProducts] = useState<Product[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>(() => {
    try {
      const saved = localStorage.getItem('trendifi_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    if (!user) {
      localStorage.setItem('trendifi_wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist, user]);
  const [isLoading, setIsLoading] = useState(true);

  // Cart and other state from localStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('trendifi_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; percent: number } | null>(() => {
    try {
      const saved = localStorage.getItem('trendifi_discount');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [hasPurchased, setHasPurchased] = useState<boolean>(() => {
    return localStorage.getItem('trendifi_has_purchased') === 'true';
  });

  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currency, setCurrency] = useState(() => {
    const saved = localStorage.getItem('trendifi_currency');
    const manual = localStorage.getItem('trendifi_currency_manual') === 'true';
    
    // If it was SAR, we force it back to USD as requested by the user.
    if (saved === 'SAR' && !manual) {
      return 'USD';
    }
    
    if (manual && saved) {
      return saved;
    }
    return 'USD';
  });

  useEffect(() => {
    // Aggressive reset to USD if the user is stuck in SAR
    // This handles cases where old auto-detection set SAR and the manual flag.
    const saved = localStorage.getItem('trendifi_currency');
    if (saved === 'SAR' || currency === 'SAR') {
      setCurrency('USD');
      localStorage.setItem('trendifi_currency', 'USD');
      localStorage.removeItem('trendifi_currency_manual');
    }
  }, []);
  const [exchangeRate, setExchangeRate] = useState(1);
  const [allRates, setAllRates] = useState<Record<string, number>>({
    'USD': 1,
    'IQD': 1450,
    'SAR': 3.75,
    'AED': 3.67,
    'EUR': 0.92,
    'TRY': 32.5,
    'EGP': 47.5,
    'JOD': 0.71,
    'KWD': 0.31,
    'QAR': 3.64,
    'BHD': 0.38,
    'OMR': 0.38,
    'GBP': 0.79
  });

  // Fetch live exchange rates on mount
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const response = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await response.json();
        if (data && data.rates) {
          setAllRates({
            ...allRates, // Keep fallbacks for currencies not in the API if any
            ...data.rates
          });
          console.log('Live exchange rates updated successfully');
        }
      } catch (error) {
        console.error("Error fetching live exchange rates:", error);
      }
    };
    
    fetchRates();
  }, []);

  useEffect(() => {
    // Load campaigns from Firestore
    const loadCampaigns = async () => {
      try {
        const { db } = await import('./lib/firebase');
        const { collection, onSnapshot, query, orderBy } = await import('firebase/firestore');
        const q = query(collection(db, 'campaigns'), orderBy('isActive', 'desc'));
        return onSnapshot(q, (snapshot) => {
          const campaignsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as import('./types').Campaign[];
          setCampaigns(campaignsData);
        });
      } catch (e) {
        console.error("Error loading campaigns:", e);
      }
    };
    let unsub: any;
    loadCampaigns().then(u => unsub = u);
    return () => unsub?.();
  }, []);

  const addCampaign = async (campaignData: Omit<import('./types').Campaign, 'id'>) => {
    try {
      const { db } = await import('./lib/firebase');
      const { collection, addDoc } = await import('firebase/firestore');
      
      const newCampaign = {
        ...campaignData,
        isActive: true,
        startDate: new Date().toISOString(),
      };
      
      await addDoc(collection(db, 'campaigns'), newCampaign);
      console.log('Campaign added successfully');
    } catch (error) {
      console.error("Error adding campaign:", error);
    }
  };

  const updateCampaign = async (campaign: import('./types').Campaign) => {
    try {
      const { db } = await import('./lib/firebase');
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'campaigns', campaign.id), campaign, { merge: true });
      showAlert(i18n.language === 'ar' ? 'تم تحديث الحملة!' : 'Campaign updated!', 'success');
    } catch (error) {
      console.error("Error updating campaign:", error);
      showAlert(i18n.language === 'ar' ? 'فشل تحديث الحملة' : 'Failed to update campaign', 'error');
    }
  };

  const deleteCampaign = async (id: string) => {
    try {
      const { db } = await import('./lib/firebase');
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'campaigns', id));
      showAlert(i18n.language === 'ar' ? 'تم حذف الحملة!' : 'Campaign deleted!', 'success');
    } catch (error) {
      console.error("Error deleting campaign:", error);
    }
  };

  useEffect(() => {
    localStorage.setItem('trendifi_currency', currency);
    setExchangeRate(allRates[currency] || 1);
  }, [currency, allRates]);

  useEffect(() => {
    // Detect location and set currency automatically
    // We disable this to keep USD as default as requested by the user
    /*
    const detectLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        const countryCode = data.country_code;
        
        let detectedCurrency = 'USD';
        if (countryCode === 'IQ') detectedCurrency = 'IQD';
        else if (countryCode === 'SA') detectedCurrency = 'SAR';
        else if (countryCode === 'AE') detectedCurrency = 'AED';
        else if (countryCode === 'TR') detectedCurrency = 'TRY';
        else if (countryCode === 'EG') detectedCurrency = 'EGP';
        else if (countryCode === 'JO') detectedCurrency = 'JOD';
        else if (countryCode === 'KW') detectedCurrency = 'KWD';
        else if (countryCode === 'QA') detectedCurrency = 'QAR';
        else if (countryCode === 'BH') detectedCurrency = 'BHD';
        else if (countryCode === 'OM') detectedCurrency = 'OMR';
        else if (countryCode === 'GB') detectedCurrency = 'GBP';
        else if (['FR', 'DE', 'IT', 'ES', 'NL'].includes(countryCode)) detectedCurrency = 'EUR';
        
        const hasSetManually = localStorage.getItem('trendifi_currency_manual') === 'true';
        if (!hasSetManually) {
          setCurrency(detectedCurrency);
        }
      } catch (error) {
        console.error("Error detecting location:", error);
      }
    };
    
    detectLocation();
    */
  }, []);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('trendifi_dark');
    return saved === 'true' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [settings, setSettings] = useState({
    googlePayMerchantId: 'BCR2DN5TROGI7Q2U',
    storeName: 'Trendifi Store',
    whatsappNumber: '9647837814009',
    baseShippingRate: 20,
    stripePublicKey: '',
    bankDetails: {
      bankName: '',
      accountHolder: '',
      iban: '',
      swiftCode: '',
      isAvailable: false
    }
  });

  const [campaigns, setCampaigns] = useState<import('./types').Campaign[]>([]);

  useEffect(() => {
    // Load settings from Firestore
    const loadSettings = async () => {
      try {
        const { db } = await import('./lib/firebase');
        const { doc, onSnapshot } = await import('firebase/firestore');
        
        return onSnapshot(doc(db, 'settings', 'general'), (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setSettings(prev => ({
              ...prev,
              ...data
            }));
          }
        });
      } catch (e) {
        console.error("Error loading settings:", e);
      }
    };

    let unsub: any;
    loadSettings().then(u => unsub = u);
    return () => unsub?.();
  }, []);

  const updateSettings = async (newSettings: Partial<typeof settings>) => {
    try {
      const { db } = await import('./lib/firebase');
      const { doc, setDoc } = await import('firebase/firestore');
      const updated = { ...settings, ...newSettings };
      await setDoc(doc(db, 'settings', 'general'), updated, { merge: true });
      setSettings(updated);
      showAlert(i18n.language === 'ar' ? 'تم تحديث الإعدادات!' : 'Settings updated!', 'success');
    } catch (error) {
      console.error("Error updating settings:", error);
      showAlert(i18n.language === 'ar' ? 'فشل تحديث الإعدادات' : 'Failed to update settings', 'error');
    }
  };

  useEffect(() => {
    // Fetch products from Firestore
    const loadProducts = async () => {
      try {
        const { db } = await import('./lib/firebase');
        const { collection, onSnapshot, query, orderBy } = await import('firebase/firestore');
        
        const q = query(collection(db, 'products'), orderBy('name'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
          console.log(`Received products update context: ${snapshot.size} products total`);
          const productsData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id
            };
          }) as Product[];
          
          setProducts(productsData);
          setIsLoading(false);
        }, (error) => {
          console.error("Error fetching products:", error);
          setIsLoading(false);
        });

        return unsubscribe;
      } catch (e) {
        console.error("Firebase initializing error in StoreContext:", e);
        setIsLoading(false);
      }
    };

    let unsubscribe: (() => void) | undefined;
    loadProducts().then(unsub => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) {
        console.log("Unsubscribing from products listener");
        unsubscribe();
      }
    };
  }, []);

  // Fetch wishlist from Firestore
  useEffect(() => {
    if (!user) {
      // Local wishlist is already loaded initially and managed by useEffect
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const loadWishlist = async () => {
      try {
        const { db } = await import('./lib/firebase');
        const { collection, onSnapshot, query, writeBatch, doc } = await import('firebase/firestore');
        
        // Merge guest wishlist with cloud wishlist if exists
        const guestWishlist = JSON.parse(localStorage.getItem('trendifi_wishlist') || '[]');
        if (guestWishlist.length > 0) {
          const batch = writeBatch(db);
          guestWishlist.forEach((item: WishlistItem) => {
            const ref = doc(db, 'users', user.uid, 'wishlist', item.productId);
            batch.set(ref, item, { merge: true });
          });
          await batch.commit();
          localStorage.removeItem('trendifi_wishlist');
        }

        const q = query(collection(db, 'users', user.uid, 'wishlist'));
        
        unsubscribe = onSnapshot(q, (snapshot) => {
          const wishlistData = snapshot.docs.map(doc => doc.data() as WishlistItem);
          setWishlist(wishlistData);
        });
      } catch (e) {
        console.error("Error loading wishlist:", e);
      }
    };

    loadWishlist();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // Price Drop Logic
  useEffect(() => {
    if (wishlist.length === 0 || products.length === 0) return;

    wishlist.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        const currentPrice = product.discountPrice ?? product.price;
        if (currentPrice < item.addedPrice) {
          // Check if we already notified for this specific price drop in this session
          const sessionKey = `notified_drop_${item.productId}_${currentPrice}`;
          if (!sessionStorage.getItem(sessionKey)) {
            // Wrap in setTimeout to avoid "Cannot update a component while rendering a different component"
            setTimeout(() => {
              showAlert(`${t('shop.priceDropAlert')}: ${t('shop.priceDropMsg', { 
                name: product.name, 
                price: formatPrice(currentPrice) 
              })}`, 'info');
            }, 0);
            sessionStorage.setItem(sessionKey, 'true');
          }
        }
      }
    });
  }, [products, wishlist, t, showAlert]);

  const toggleWishlist = async (productId: string) => {
    if (!user) {
      // Handle guest wishlist in localStorage
      setWishlist(prev => {
        const index = prev.findIndex(item => item.productId === productId);
        if (index > -1) {
          return prev.filter(item => item.productId !== productId);
        } else {
          const product = products.find(p => p.id === productId);
          if (!product) return prev;
          
          return [...prev, {
            productId,
            addedPrice: product.discountPrice ?? product.price,
            createdAt: new Date().toISOString()
          }];
        }
      });
      return;
    }

    try {
      const { db } = await import('./lib/firebase');
      const { doc, setDoc, deleteDoc, getDoc } = await import('firebase/firestore');
      
      const productRef = doc(db, 'users', user.uid, 'wishlist', productId);
      const productSnap = await getDoc(productRef);

      if (productSnap.exists()) {
        await deleteDoc(productRef);
      } else {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        const wishlistItem: WishlistItem = {
          productId,
          addedPrice: product.discountPrice ?? product.price,
          createdAt: new Date().toISOString()
        };
        await setDoc(productRef, wishlistItem);
      }
    } catch (e) {
      console.error("Error toggling wishlist:", e);
    }
  };

  const isInWishlist = (productId: string) => {
    return wishlist.some(item => item.productId === productId);
  };

  useEffect(() => {
    localStorage.setItem('trendifi_discount', JSON.stringify(appliedDiscount));
  }, [appliedDiscount]);

  useEffect(() => {
    localStorage.setItem('trendifi_cart', JSON.stringify(cart));
  }, [cart]);

  const applyDiscountCode = (code: string): { success: boolean; message: string } => {
    const normalizedCode = code.trim().toUpperCase();
    if (normalizedCode === 'START15') {
      if (hasPurchased) return { success: false, message: 'هذا الكود مخصص للطلب الأول فقط.' };
      setAppliedDiscount({ code: 'START15', percent: 15 });
      return { success: true, message: 'تم تطبيق خصم 15% بنجاح!' };
    }
    return { success: false, message: 'كود الخصم غير صحيح.' };
  };

  const completePurchase = async () => {
    try {
      const { db } = await import('./lib/firebase');
      const { doc, runTransaction } = await import('firebase/firestore');

      await runTransaction(db, async (transaction) => {
        // First check all stocks
        for (const item of cart) {
          const productRef = doc(db, 'products', item.id);
          const productDoc = await transaction.get(productRef);
          
          if (!productDoc.exists()) {
            throw new Error(`Product ${item.name} not found`);
          }
          
          const currentStock = productDoc.data().stock || 0;
          if (currentStock < item.quantity) {
            throw new Error(i18n.language === 'ar' 
              ? `عذراً، نفد مخزون ${item.name}` 
              : `Sorry, ${item.name} is out of stock`);
          }
        }

        // Decrement stocks
        for (const item of cart) {
          const productRef = doc(db, 'products', item.id);
          const productDoc = await transaction.get(productRef);
          const currentStock = productDoc.data().stock || 0;
          transaction.update(productRef, { stock: currentStock - item.quantity });
        }
      });

      localStorage.setItem('trendifi_has_purchased', 'true');
      setHasPurchased(true);
      setAppliedDiscount(null);
      clearCart();
      showAlert(i18n.language === 'ar' 
        ? 'تمت عملية الشراء بنجاح! تم تحديث المخزون.' 
        : 'Purchase successful! Stock updated.', 'success');
    } catch (e: any) {
      console.error("Purchase error:", e);
      showAlert(e.message || 'Error processing purchase', 'error');
    }
  };

  const addToProducts = async (product: Product) => {
    console.log('Attempting to add product to Firestore (id:', product.id, ')');
    try {
      const { db } = await import('./lib/firebase');
      const { doc, setDoc } = await import('firebase/firestore');
      
      const productWithTimestamp = {
        ...product,
        createdAt: product.createdAt || new Date().toISOString()
      };
      
      await setDoc(doc(db, 'products', productWithTimestamp.id), productWithTimestamp);
      console.log('Successfully added product to Firestore');
    } catch (error) {
      console.warn('Error adding product to Firestore:', error);
      const { handleFirestoreError, OperationType } = await import('./lib/firebase');
      handleFirestoreError(error, OperationType.WRITE, `products/${product.id}`);
    }
  };

  const updateProduct = async (updatedProduct: Product) => {
    try {
      const { db, handleFirestoreError, OperationType } = await import('./lib/firebase');
      const { doc, setDoc } = await import('firebase/firestore');
      
      console.log(`Attempting to update product ${updatedProduct.id} in Firestore`);
      
      // Ensure specific keys are present for rules
      if (!updatedProduct.name || updatedProduct.price === undefined) {
        throw new Error("Product data missing name or price");
      }

      await setDoc(doc(db, 'products', updatedProduct.id), updatedProduct, { merge: true });
      console.log(`Successfully updated product ${updatedProduct.id} in Firestore`);
      showAlert(i18n.language === 'ar' ? 'تم تحديث المنتج بنجاح!' : 'Product updated successfully!', 'success');
    } catch (error: any) {
      console.warn('Error updating product in Firestore:', error);
      const { handleFirestoreError, OperationType } = await import('./lib/firebase');
      showAlert(i18n.language === 'ar' ? `فشل التحديث: ${error.message}` : `Update failed: ${error.message}`, 'error');
      handleFirestoreError(error, OperationType.WRITE, `products/${updatedProduct.id}`);
    }
  };

  const deleteProduct = async (productId: string) => {
    if (!productId) return;
    try {
      const { db, handleFirestoreError, OperationType } = await import('./lib/firebase');
      const { doc, deleteDoc } = await import('firebase/firestore');
      
      console.log(`Deleting product with ID: ${productId}`);
      await deleteDoc(doc(db, 'products', productId));
    } catch (error) {
      console.warn('Error deleting product:', error);
      const { handleFirestoreError, OperationType } = await import('./lib/firebase');
      handleFirestoreError(error, OperationType.DELETE, `products/${productId}`);
    }
  };

  const addToCart = (product: Product, color: string, size: string, requestedQuantity: number = 1) => {
    // Check stock BEFORE setting state to avoid side effects in updater
    const existingInCart = cart.find(item => item.id === product.id && item.selectedColor === color && item.selectedSize === size);
    const currentQuantityInCart = existingInCart ? existingInCart.quantity : 0;
    
    if (currentQuantityInCart + requestedQuantity > product.stock) {
      showAlert(i18n.language === 'ar' 
        ? `عذراً، الكمية المتوفرة من هذا المنتج هي ${product.stock} فقط` 
        : `Sorry, only ${product.stock} items left in stock`, 'error');
      return;
    }

    setCart((prev) => {
      const existing = prev.find(item => item.id === product.id && item.selectedColor === color && item.selectedSize === size);
      if (existing) {
        return prev.map(item => 
          (item.id === product.id && item.selectedColor === color && item.selectedSize === size)
            ? { ...item, quantity: item.quantity + requestedQuantity }
            : item
        );
      }
      const itemImage = product.colorImages?.[color] || product.image;
      return [...prev, { ...product, image: itemImage, quantity: requestedQuantity, selectedColor: color, selectedSize: size }];
    });
  };

  const removeFromCart = (productId: string, color: string, size: string) => {
    setCart((prev) => prev.filter(item => !(item.id === productId && item.selectedColor === color && item.selectedSize === size)));
  };

  const updateCartQuantity = (productId: string, color: string, size: string, quantity: number) => {
    if (quantity < 1) return;
    
    // Find item to check stock
    const item = cart.find(i => i.id === productId && i.selectedColor === color && i.selectedSize === size);
    if (item && quantity > item.stock) {
      showAlert(i18n.language === 'ar' 
        ? `عذراً، الكمية المتوفرة هي ${item.stock} فقط` 
        : `Only ${item.stock} items left in stock`, 'error');
      return;
    }

    setCart((prev) => prev.map(item => 
      (item.id === productId && item.selectedColor === color && item.selectedSize === size) ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => {
    const itemDiscountPrice = item.colorDiscountPrices?.[item.selectedColor] ?? item.discountPrice;
    const itemPrice = item.colorPrices?.[item.selectedColor] ?? item.price;
    return acc + ((itemDiscountPrice ?? itemPrice) * item.quantity);
  }, 0);
  const discountedTotal = appliedDiscount 
    ? totalPrice * (1 - appliedDiscount.percent / 100) 
    : totalPrice;

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newVal = !prev;
      localStorage.setItem('trendifi_dark', String(newVal));
      return newVal;
    });
  };

  const formatPrice = (price: number): string => {
    const symbols: Record<string, string> = {
      'USD': '$',
      'IQD': 'د.ع',
      'SAR': 'ر.س',
      'AED': 'د.إ',
      'EUR': '€',
      'TRY': '₺',
      'EGP': 'ج.م',
      'JOD': 'د.أ',
      'KWD': 'د.ك',
      'QAR': 'ر.ق',
      'BHD': 'د.ب',
      'OMR': 'ر.ع',
      'GBP': '£'
    };
    
    const converted = price * exchangeRate;
    
    if (currency === 'IQD') {
      return `${Math.round(converted).toLocaleString()} ${symbols[currency]}`;
    }
    
    const formatted = converted.toFixed(currency === 'USD' || currency === 'EUR' ? 2 : 1);
    const symbol = symbols[currency] || '$';
    
    return i18n.language === 'ar' ? `${formatted} ${symbol}` : `${symbol}${formatted}`;
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>(() => {
    const saved = localStorage.getItem('trendifi_viewed');
    return saved ? JSON.parse(saved) : [];
  });

  const addToRecentlyViewed = (product: Product) => {
    setRecentlyViewed(prev => {
      const filtered = prev.filter(p => p.id !== product.id);
      const updated = [product, ...filtered].slice(0, 10);
      localStorage.setItem('trendifi_viewed', JSON.stringify(updated));
      return updated;
    });
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <StoreContext.Provider value={{ 
      products, cart, wishlist, toggleWishlist, isInWishlist,
      addToProducts, updateProduct, deleteProduct,
      addToCart, removeFromCart, updateCartQuantity, clearCart,
      applyDiscountCode, completePurchase, appliedDiscount, hasPurchased,
      totalItems, totalPrice, discountedTotal,
      isAddModalOpen, setIsAddModalOpen,
      quickViewProduct, setQuickViewProduct,
      editingProduct, setEditingProduct,
      isEditMode, setIsEditMode,
      searchQuery, setSearchQuery,
      currency, setCurrency, exchangeRate, formatPrice,
      filteredProducts, isLoading,
      recentlyViewed, addToRecentlyViewed,
      isDarkMode, toggleDarkMode,
      settings, updateSettings,
      campaigns, addCampaign, updateCampaign, deleteCampaign
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
};
