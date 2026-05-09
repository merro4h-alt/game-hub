import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem } from './types';
import { INITIAL_PRODUCTS } from './constants';

interface StoreContextType {
  products: Product[];
  cart: CartItem[];
  addToProducts: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  addToCart: (product: Product, color: string, size: string) => void;
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
  isAddModalOpen: boolean;
  setIsAddModalOpen: (isOpen: boolean) => void;
  editingProduct: Product | null;
  setEditingProduct: (product: Product | null) => void;
  isEditMode: boolean;
  setIsEditMode: (isEdit: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filteredProducts: Product[];
  isLoading: boolean;
  recentlyViewed: Product[];
  addToRecentlyViewed: (product: Product) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('trendifi_products');
      let loadedProducts: Product[] = saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
      
      // Cleanup: Map old categories to new ones if they exist
      return loadedProducts.map(p => {
        let category = p.category;
        if (category as any === 'Fashion & Beauty') category = 'New';
        if (category as any === 'Cosmetic') category = 'Best Seller';
        if (category as any === 'Sport' || category as any === 'Gifts & Sets') category = 'Offers';
        return { ...p, category };
      });
    } catch (e) {
      console.warn("Failed to load products from localStorage, using initial products", e);
      return INITIAL_PRODUCTS;
    }
  });

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

  useEffect(() => {
    localStorage.setItem('trendifi_discount', JSON.stringify(appliedDiscount));
  }, [appliedDiscount]);

  const applyDiscountCode = (code: string): { success: boolean; message: string } => {
    const normalizedCode = code.trim().toUpperCase();
    
    if (normalizedCode === 'START15') {
      if (hasPurchased) {
        return { success: false, message: 'هذا الكود مخصص للطلب الأول فقط.' };
      }
      
      // Check for 1 week validity (assuming it was created on May 3rd, 2026 based on metadata)
      const now = new Date();
      const expiryDate = new Date('2026-05-10T22:15:31Z'); 
      if (now > expiryDate) {
        return { success: false, message: 'عذراً، هذا الكود انتهت صلاحيته.' };
      }

      setAppliedDiscount({ code: 'START15', percent: 15 });
      return { success: true, message: 'تم تطبيق خصم 15% بنجاح!' };
    }

    return { success: false, message: 'كود الخصم غير صحيح.' };
  };

  const completePurchase = () => {
    localStorage.setItem('trendifi_has_purchased', 'true');
    setHasPurchased(true);
    setAppliedDiscount(null);
    clearCart();
  };

  useEffect(() => {
    // Initial loading safety timer - reduced since API is removed
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('trendifi_products', JSON.stringify(products));
    } catch (e) {
      console.error('Failed to save products to localStorage:', e);
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        alert('ذاكرة التخزين ممتلئة. يرجى حذف بعض المنتجات القديمة أو تقليل حجم الصور.');
      }
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('trendifi_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to save cart to localStorage:', e);
    }
  }, [cart]);

  const addToProducts = (product: Product) => {
    setProducts((prev) => [product, ...prev]);
  };

  const updateProduct = (updatedProduct: Product) => {
    setProducts((prev) => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const deleteProduct = (productId: string) => {
    setProducts((prev) => prev.filter(p => p.id !== productId));
    // Also remove from cart if it exists there
    setCart((prev) => prev.filter(item => item.id !== productId));
  };

  const addToCart = (product: Product, color: string, size: string) => {
    setCart((prev) => {
      const existing = prev.find(item => item.id === product.id && item.selectedColor === color && item.selectedSize === size);
      if (existing) {
        return prev.map(item => 
          (item.id === product.id && item.selectedColor === color && item.selectedSize === size)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      const itemImage = product.colorImages?.[color] || product.image;
      return [...prev, { ...product, image: itemImage, quantity: 1, selectedColor: color, selectedSize: size }];
    });
  };

  const removeFromCart = (productId: string, color: string, size: string) => {
    setCart((prev) => prev.filter(item => !(item.id === productId && item.selectedColor === color && item.selectedSize === size)));
  };

  const updateCartQuantity = (productId: string, color: string, size: string, quantity: number) => {
    if (quantity < 1) return;
    setCart((prev) => prev.map(item => 
      (item.id === productId && item.selectedColor === color && item.selectedSize === size) ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => acc + ((item.discountPrice ?? item.price) * item.quantity), 0);
  const discountedTotal = appliedDiscount 
    ? totalPrice * (1 - appliedDiscount.percent / 100) 
    : totalPrice;

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('trendifi_dark');
    return saved === 'true' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newVal = !prev;
      localStorage.setItem('trendifi_dark', String(newVal));
      return newVal;
    });
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
      const updated = [product, ...filtered].slice(0, 10); // Keep last 10
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
      products, 
      cart, 
      addToProducts, 
      updateProduct,
      deleteProduct,
      addToCart, 
      removeFromCart, 
      updateCartQuantity, 
      clearCart,
      applyDiscountCode,
      completePurchase,
      appliedDiscount,
      hasPurchased,
      totalItems, 
      totalPrice,
      discountedTotal,
      isAddModalOpen,
      setIsAddModalOpen,
      editingProduct,
      setEditingProduct,
      isEditMode,
      setIsEditMode,
      searchQuery,
      setSearchQuery,
      filteredProducts,
      isLoading,
      recentlyViewed,
      addToRecentlyViewed,
      isDarkMode,
      toggleDarkMode
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
