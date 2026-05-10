import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Plus, Save, RefreshCw, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Product } from '../types';
import { useStore } from '../StoreContext';
import { useAuth } from '../AuthContext';
import { COLORS_OPTIONS, SIZES_CLOTHES, SIZES_SHOES, COSMETIC_SIZES } from '../constants';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct?: Product | null;
}

const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, editingProduct }) => {
  const { t, i18n } = useTranslation();
  const { addToProducts, updateProduct } = useStore();
  const { user } = useAuth();
  const isArabic = i18n.language?.startsWith('ar') || false;

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setSuccessMsg(null);
      setIsProcessing(false);
      console.log('AddProductModal opened. Editing:', !!editingProduct, 'Language:', i18n.language);
    }
  }, [isOpen, editingProduct, i18n.language]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discountPrice: '',
    category: 'New' as Product['category'],
    colors: [] as string[],
    sizes: [] as string[],
    image: null as File | null,
    imagePreview: '',
    images: [] as string[],
    colorImages: {} as Record<string, string>,
    supplierName: '',
    supplierUrl: '',
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name,
        description: editingProduct.description,
        price: editingProduct.price.toString(),
        discountPrice: editingProduct.discountPrice?.toString() || '',
        category: editingProduct.category,
        colors: editingProduct.colors,
        sizes: editingProduct.sizes,
        image: null,
        imagePreview: editingProduct.image,
        images: editingProduct.images || [editingProduct.image],
        colorImages: editingProduct.colorImages || {},
        supplierName: editingProduct.supplierName || '',
        supplierUrl: editingProduct.supplierUrl || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        discountPrice: '',
        category: 'New',
        colors: [],
        sizes: [],
        image: null,
        imagePreview: '',
        images: [],
        colorImages: {},
        supplierName: '',
        supplierUrl: '',
      });
    }
  }, [editingProduct, isOpen]);

  const compressImage = (base64: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const timeout = setTimeout(() => {
        reject(new Error('Image compression timed out'));
      }, 10000);

      img.onload = () => {
        clearTimeout(timeout);
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Failed to load image for compression'));
      };
      img.src = base64;
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setIsProcessing(true);
      const filesArray: File[] = Array.from(files);
      let processedCount = 0;

      filesArray.forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const result = reader.result as string;
            const compressed = await compressImage(result);
            
            setFormData(prev => ({
              ...prev,
              image: prev.image || file,
              imagePreview: prev.imagePreview || compressed,
              images: [...prev.images, compressed].slice(0, 5)
            }));
          } catch (err) {
            console.warn('Image compression failed:', err);
          } finally {
            processedCount++;
            if (processedCount === filesArray.length) {
              setIsProcessing(false);
            }
          }
        };
        reader.onerror = () => {
          processedCount++;
          if (processedCount === filesArray.length) {
            setIsProcessing(false);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const toggleSelection = (list: string[], item: string, key: 'colors' | 'sizes') => {
    const newList = list.includes(item) 
      ? list.filter(i => i !== item) 
      : [...list, item];
    
    // Clear color image if color is removed
    const newColorImages = { ...formData.colorImages };
    if (key === 'colors' && list.includes(item)) {
      delete newColorImages[item];
    }

    setFormData({ ...formData, [key]: newList, colorImages: newColorImages });
  };

  const handleColorImageChange = (color: string, url: string) => {
    setFormData({
      ...formData,
      colorImages: {
        ...formData.colorImages,
        [color]: url
      }
    });
  };

  const handleColorFileChange = (color: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        const compressed = await compressImage(result);
        handleColorImageChange(color, compressed);
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReplaceImage = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        const compressed = await compressImage(result);
        const newImages = [...formData.images];
        newImages[idx] = compressed;
        
        setFormData(prev => ({
          ...prev,
          images: newImages,
          imagePreview: idx === 0 ? compressed : prev.imagePreview
        }));
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (isProcessing) {
      console.log('Already processing, ignoring click');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    console.log('Submitting product form start... (omitting image data for brevity)');
    
    try {
      // Explicit Validation
      if (!formData.name || !formData.name.trim()) {
        console.log('Validation failed: Missing name');
        setIsProcessing(false);
        setErrorMsg(isArabic ? 'الرجاء إدخال اسم المنتج' : 'Please enter product name');
        return;
      }
      if (!formData.price || formData.price.trim() === '') {
        setIsProcessing(false);
        setErrorMsg(isArabic ? 'الرجاء إدخال السعر' : 'Please enter price');
        return;
      }
      if (!formData.description || !formData.description.trim()) {
        setIsProcessing(false);
        setErrorMsg(isArabic ? 'الرجاء إدخال وصف المنتج' : 'Please enter description');
        return;
      }

      const parsedPrice = parseFloat(formData.price);
      if (isNaN(parsedPrice)) {
        setIsProcessing(false);
        setErrorMsg(isArabic ? 'الرجاء إدخال سعر صحيح' : 'Please enter a valid price');
        return;
      }

      let parsedDiscountPrice: number | undefined = undefined;
      if (formData.discountPrice && formData.discountPrice.trim() !== '') {
        parsedDiscountPrice = parseFloat(formData.discountPrice);
        if (isNaN(parsedDiscountPrice)) {
          setIsProcessing(false);
          setErrorMsg(isArabic ? 'سعر الخصم غير صحيح' : 'Discount price is invalid');
          return;
        }
      }

      console.log('Validation passed. Starting Firestore save...');

      const productData: Product = {
        id: editingProduct ? editingProduct.id : `prod-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parsedPrice,
        image: formData.imagePreview || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800',
        images: formData.images.length > 0 ? formData.images.slice(0, 5) : [formData.imagePreview || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800'],
        category: formData.category,
        colors: formData.colors.length > 0 ? formData.colors : ['Default'],
        colorImages: formData.colorImages || {},
        sizes: formData.sizes.length > 0 ? formData.sizes : ['One Size'],
        rating: editingProduct ? editingProduct.rating : 5,
        supplierName: formData.supplierName || 'Self',
        supplierUrl: formData.supplierUrl || '',
      };

      // Ensure optional fields are not undefined for Firestore
      if (parsedDiscountPrice === undefined) {
        delete productData.discountPrice;
      } else {
        productData.discountPrice = parsedDiscountPrice;
      }

      if (!productData.supplierName) delete productData.supplierName;
      if (!productData.supplierUrl) delete productData.supplierUrl;
      if (!productData.colorImages || Object.keys(productData.colorImages).length === 0) delete productData.colorImages;

      if (editingProduct) {
        await updateProduct(productData);
        setSuccessMsg(isArabic ? 'تم تحديث المنتج بنجاح!' : 'Product updated successfully!');
      } else {
        await addToProducts(productData);
        setSuccessMsg(isArabic ? 'تم إضافة المنتج بنجاح!' : 'Product added successfully!');
      }
      
      console.log('Firestore save successful');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error: any) {
      console.warn('Error saving product in handleSumbit:', error);
      
      let errorMessageStr = error.message || String(error);
      
      // Try to parse JSON error from handleFirestoreError
      try {
        if (errorMessageStr.includes('{') && errorMessageStr.includes('error')) {
          const parsed = JSON.parse(errorMessageStr);
          errorMessageStr = parsed.error || errorMessageStr;
        }
      } catch (e) {
        // Not JSON, continue with original string
      }
      
      let displayMessage = isArabic 
        ? 'تعذر حفظ المنتج. ' 
        : 'Could not save product. ';
      
      if (errorMessageStr.toLowerCase().includes('large') || errorMessageStr.toLowerCase().includes('1mib') || errorMessageStr.toLowerCase().includes('limit')) {
        displayMessage += isArabic 
          ? 'حجم المنتج كبير جداً. حاول تقليل عدد الصور المرفقة أو دقتها.' 
          : 'Product data is too large. Try reducing the number of images or their quality.';
      } else if (errorMessageStr.includes('permission-denied') || errorMessageStr.includes('permissions') || errorMessageStr.includes('403')) {
        displayMessage += isArabic 
          ? 'ليس لديك صلاحيات كافية (Admin). تأكد من تسجيل الدخول بحساب مسؤول.' 
          : 'You do not have sufficient permissions (Admin). Make sure you are signed in as an admin.';
      } else {
        displayMessage += isArabic 
          ? `الخطأ: ${errorMessageStr.length > 100 ? errorMessageStr.substring(0, 100) + '...' : errorMessageStr}` 
          : `Error: ${errorMessageStr.length > 100 ? errorMessageStr.substring(0, 100) + '...' : errorMessageStr}`;
      }
      
      setErrorMsg(displayMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const currentSizeOptions = 
    formData.category === 'New' ? SIZES_CLOTHES :
    formData.category === 'Best Seller' ? COSMETIC_SIZES : SIZES_CLOTHES; // Defaulting to clothes for Offers too for now

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-brand-charcoal/40 backdrop-blur-md" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-brand-cream w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl p-8 no-scrollbar z-[501]"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-black tracking-tighter text-brand-charcoal uppercase">
                {editingProduct 
                  ? (isArabic ? 'تعديل المنتج' : 'Edit Product') 
                  : (isArabic ? 'إضافة منتج جديد' : 'Add New Product')}
                {!isArabic && !editingProduct && <span className="block text-[10px] text-brand-gold mt-1 tracking-[0.3em]">Fresh Inventory</span>}
                {isArabic && !editingProduct && <span className="block text-[10px] text-brand-gold mt-1 tracking-[0.3em] font-sans">ADD NEW PRODUCT</span>}
              </h2>
              <button 
                onClick={onClose} 
                className="p-3 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-2xl transition-all shadow-sm group border border-red-100"
                title={isArabic ? 'إغلاق' : 'Close Modal'}
              >
                <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Admin Status Indicator */}
              <div className="flex items-center justify-between p-4 bg-brand-gold/5 rounded-2xl border border-brand-gold/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-charcoal/60">
                    {isArabic ? 'حالة المسؤول:' : 'Admin Status:'}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-brand-gold">
                  {user?.email} ({isArabic ? 'مسؤول (Admin)' : 'Admin Mode'})
                </span>
              </div>
              
              {/* Status Messages */}
              <AnimatePresence>
                {errorMsg && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl text-xs font-bold"
                  >
                    {errorMsg}
                  </motion.div>
                )}
                {successMsg && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-green-50 border border-green-200 text-green-600 rounded-2xl text-xs font-bold flex items-center gap-2"
                  >
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                    {successMsg}
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Image Gallery Upload */}
              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-widest text-brand-charcoal/50">
                  {isArabic ? 'معرض الصور (الصور الأصلية)' : 'Product Gallery (Original Photos)'}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-brand-charcoal/10 group bg-white shadow-sm">
                      <img 
                        src={img || 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&q=60&w=600'} 
                        className="w-full h-full object-cover" 
                        alt={`Preview ${idx}`}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&q=60&w=600';
                        }}
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-2 right-2 flex flex-col gap-2">
                        <button 
                          type="button"
                          onClick={() => {
                            const newImages = formData.images.filter((_, i) => i !== idx);
                            setFormData({ 
                              ...formData, 
                              images: newImages, 
                              imagePreview: newImages[0] || '',
                              image: newImages.length === 0 ? null : formData.image
                            });
                          }}
                          className="p-1.5 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-all hover:scale-110"
                          title="Remove Image"
                        >
                          <X size={12} />
                        </button>
                        <button 
                          type="button"
                          onClick={() => document.getElementById(`replace-upload-${idx}`)?.click()}
                          className="p-1.5 bg-brand-gold text-white rounded-full shadow-lg hover:bg-brand-charcoal transition-colors"
                          title="Replace Image"
                        >
                          <RefreshCw size={12} />
                        </button>
                      </div>
                      <input 
                        id={`replace-upload-${idx}`} 
                        type="file" 
                        className="hidden" 
                        onChange={(e) => handleReplaceImage(idx, e)} 
                        accept="image/*" 
                      />
                      {idx === 0 && (
                        <div className="absolute bottom-0 left-0 right-0 bg-brand-gold text-white text-[8px] font-bold uppercase py-1 text-center">
                          Main Image
                        </div>
                      )}
                    </div>
                  ))}
                  <button 
                    type="button"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="aspect-square border-2 border-dashed border-brand-charcoal/10 rounded-2xl flex flex-col items-center justify-center hover:border-brand-gold transition-colors text-brand-charcoal/30 hover:text-brand-gold bg-white"
                  >
                    <Plus size={24} />
                    <span className="text-[10px] font-bold uppercase mt-2">Add Photo</span>
                  </button>
                </div>
                <input id="file-upload" type="file" className="hidden" onChange={handleImageChange} accept="image/*" multiple />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-charcoal/50">
                    {isArabic ? 'اسم المنتج' : 'Product Name'}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white rounded-xl border border-brand-charcoal/10 focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none text-brand-charcoal"
                    placeholder={isArabic ? 'مثال: فستان سهرة حريري' : 'e.g. Silk Evening Dress'}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-charcoal/50">
                    {isArabic ? 'السعر ($)' : 'Price ($)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-3 bg-white rounded-xl border border-brand-charcoal/10 focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none text-brand-charcoal"
                    placeholder="99.99"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-charcoal/50">
                    {isArabic ? 'سعر الخصم ($ - اختياري)' : 'Discount Price ($ - Optional)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.discountPrice}
                    onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                    className="w-full px-4 py-3 bg-white rounded-xl border border-brand-charcoal/10 focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none text-brand-charcoal"
                    placeholder="79.99"
                  />
                </div>
              </div>

              <div className="space-y-4 p-6 bg-brand-gold/5 rounded-3xl border border-brand-gold/10">
                <label className="text-xs font-black uppercase tracking-[0.2em] text-brand-gold">
                  {isArabic ? 'بيانات المورد (اختياري)' : 'Supplier Data (Optional)'}
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-brand-charcoal/40">
                      {isArabic ? 'اسم المورد / المنصة (اختياري)' : 'Supplier / Platform Name (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={formData.supplierName}
                      onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                      className="w-full px-4 py-3 bg-white rounded-xl border border-brand-charcoal/10 focus:ring-2 focus:ring-brand-gold outline-none text-brand-charcoal"
                      placeholder={isArabic ? 'مثال: علي إكسبريس' : 'e.g. AliExpress'}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-brand-charcoal/40">
                      {isArabic ? 'رابط المصدر (اختياري)' : 'Source URL (Optional)'}
                    </label>
                    <input
                      type="url"
                      value={formData.supplierUrl}
                      onChange={(e) => setFormData({ ...formData, supplierUrl: e.target.value })}
                      className="w-full px-4 py-3 bg-white rounded-xl border border-brand-charcoal/10 focus:ring-2 focus:ring-brand-gold outline-none text-brand-charcoal"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-brand-charcoal/50">
                  {isArabic ? 'الفئة' : 'Category'}
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as Product['category'], sizes: [] })}
                  className="w-full px-4 py-3 bg-white rounded-xl border border-brand-charcoal/10 focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none appearance-none text-brand-charcoal font-medium"
                >
                  <option value="New">New</option>
                  <option value="Best Seller">Best Seller</option>
                  <option value="Offers">Offers</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-brand-charcoal/50">
                  {isArabic ? 'وصف المنتج' : 'Description'}
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-white rounded-xl border border-brand-charcoal/10 focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none resize-none text-brand-charcoal"
                  placeholder={isArabic ? 'أخبرنا عن هذا المنتج...' : 'Tell us about this product...'}
                />
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-widest text-brand-charcoal/50">
                  {isArabic ? 'الألوان المتاحة' : 'Available Colors'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLORS_OPTIONS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => toggleSelection(formData.colors, color, 'colors')}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                        formData.colors.includes(color) 
                          ? 'bg-brand-charcoal text-white border-brand-charcoal' 
                          : 'bg-white text-brand-charcoal border-brand-charcoal/10 hover:border-brand-gold'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              {formData.colors.length > 0 && (
                <div className="space-y-4 p-6 bg-brand-charcoal/5 rounded-3xl">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold uppercase tracking-widest text-brand-charcoal/50">Color-Specific Images (Optional)</label>
                    <p className="text-[10px] text-brand-charcoal/40 uppercase tracking-wider">Upload images for selected colors to show variations when clicked.</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {formData.colors.map(color => (
                      <div key={color} className="space-y-3 p-4 bg-white rounded-2xl shadow-sm border border-brand-charcoal/5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full border border-brand-charcoal/10" style={{ backgroundColor: color }} />
                            <label className="text-[10px] font-bold uppercase text-brand-charcoal/60 truncate max-w-[80px]">{color}</label>
                          </div>
                          {formData.colorImages[color] && (
                            <button 
                              type="button"
                              onClick={() => handleColorImageChange(color, '')}
                              className="text-[10px] text-red-600 font-black uppercase hover:underline hover:text-red-700 transition-colors"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        
                        <label className="relative flex flex-col items-center justify-center aspect-square w-full rounded-xl border-2 border-dashed border-brand-charcoal/10 hover:border-brand-gold transition-all cursor-pointer overflow-hidden bg-brand-cream/30 group">
                          {formData.colorImages[color] ? (
                            <img 
                              src={formData.colorImages[color]} 
                              className="w-full h-full object-cover" 
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?auto=format&fit=crop&q=60&w=600';
                              }}
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-brand-charcoal/30 group-hover:text-brand-gold transition-colors">
                              <Plus size={20} />
                              <span className="text-[9px] font-bold uppercase tracking-tighter">Add Photo</span>
                            </div>
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleColorFileChange(color, e)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-widest text-brand-charcoal/50">
                  {isArabic ? 'المقاسات المتاحة' : 'Available Sizes'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {currentSizeOptions.map(size => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleSelection(formData.sizes, size, 'sizes')}
                      className={`px-4 py-1 rounded-full text-xs font-medium border transition-all ${
                        formData.sizes.includes(size) 
                          ? 'bg-brand-charcoal text-white border-brand-charcoal' 
                          : 'bg-white text-brand-charcoal border-brand-charcoal/10 hover:border-brand-gold'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => {
                    console.log('Add/Save button clicked in modal. Current isProcessing:', isProcessing);
                    if (isProcessing || successMsg) return;
                    handleSubmit();
                  }}
                  disabled={isProcessing || !!successMsg}
                  className={`w-full bg-brand-gold text-white font-bold py-4 rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 ${(isProcessing || successMsg) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-brand-charcoal'}`}
                >
                  {isProcessing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : successMsg ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    editingProduct ? <Save size={20} /> : <Plus size={20} />
                  )}
                  {isProcessing 
                    ? (isArabic ? 'جاري الحفظ...' : 'Saving Product...') 
                    : successMsg
                      ? (isArabic ? 'تم بنجاح!' : 'Success!')
                      : (editingProduct 
                        ? (isArabic ? 'حفظ التغييرات' : 'Save Changes') 
                        : (isArabic ? 'إضافة المنتج' : 'Create Product'))}
                </button>
              </div>
              </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddProductModal;
