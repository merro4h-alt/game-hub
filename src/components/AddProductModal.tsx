import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Plus, Save, RefreshCw } from 'lucide-react';
import { Product } from '../types';
import { useStore } from '../StoreContext';
import { COLORS_OPTIONS, SIZES_CLOTHES, SIZES_SHOES, COSMETIC_SIZES } from '../constants';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingProduct?: Product | null;
}

const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, editingProduct }) => {
  const { addToProducts, updateProduct } = useStore();
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
  });

  const [isProcessing, setIsProcessing] = useState(false);

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
      });
    }
  }, [editingProduct, isOpen]);

  const compressImage = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
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
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7)); // Use JPEG with 0.7 quality
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
          const result = reader.result as string;
          const compressed = await compressImage(result);
          
          setFormData(prev => ({
            ...prev,
            image: prev.image || file,
            imagePreview: prev.imagePreview || compressed,
            images: [...prev.images, compressed].slice(0, 5) // Keep only 5
          }));

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedPrice = parseFloat(formData.price);
    const parsedDiscountPrice = formData.discountPrice ? parseFloat(formData.discountPrice) : undefined;
    
    if (isNaN(parsedPrice)) {
      alert('الرجاء إدخال سعر صحيح');
      return;
    }

    const productData: Product = {
      id: editingProduct ? editingProduct.id : `prod-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: formData.name,
      description: formData.description,
      price: parsedPrice,
      discountPrice: parsedDiscountPrice,
      image: formData.imagePreview || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800',
      images: formData.images.length > 0 ? formData.images.slice(0, 5) : [formData.imagePreview], // Limit to 5 images to save space
      category: formData.category,
      colors: formData.colors.length > 0 ? formData.colors : ['Default'],
      colorImages: formData.colorImages,
      sizes: formData.sizes.length > 0 ? formData.sizes : ['One Size'],
      rating: editingProduct ? editingProduct.rating : 5,
    };

    try {
      if (editingProduct) {
        updateProduct(productData);
      } else {
        addToProducts(productData);
      }
      
      onClose();
      // Reset form
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
      });
    } catch (error) {
      console.error('Error saving product:', error);
      alert('تعذر حفظ المنتج. قد تكون الصور كبيرة جداً.');
    }
  };

  const currentSizeOptions = 
    formData.category === 'New' ? SIZES_CLOTHES :
    formData.category === 'Best Seller' ? COSMETIC_SIZES : SIZES_CLOTHES; // Defaulting to clothes for Offers too for now

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-charcoal/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-brand-cream w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl p-8 no-scrollbar"
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold tracking-tight">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-brand-charcoal/5 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Image Gallery Upload */}
              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-widest text-brand-charcoal/50">Product Gallery (Original Photos)</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-brand-charcoal/10 group bg-white shadow-sm">
                      <img src={img} className="w-full h-full object-contain p-1" alt={`Preview ${idx}`} />
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
                          className="p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-colors"
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
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-charcoal/50">Product Name</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-white rounded-xl border border-brand-charcoal/10 focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none"
                    placeholder="e.g. Silk Evening Dress"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-charcoal/50">Price ($)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-3 bg-white rounded-xl border border-brand-charcoal/10 focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none"
                    placeholder="99.99"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-brand-charcoal/50">Discount Price ($ - Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.discountPrice}
                    onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                    className="w-full px-4 py-3 bg-white rounded-xl border border-brand-charcoal/10 focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none"
                    placeholder="79.99"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-brand-charcoal/50">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as Product['category'], sizes: [] })}
                  className="w-full px-4 py-3 bg-white rounded-xl border border-brand-charcoal/10 focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none appearance-none"
                >
                  <option>New</option>
                  <option>Best Seller</option>
                  <option>Offers</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-brand-charcoal/50">Description</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-white rounded-xl border border-brand-charcoal/10 focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none resize-none"
                  placeholder="Tell us about this product..."
                />
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-widest text-brand-charcoal/50">Available Colors</label>
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
                              className="text-[10px] text-red-500 font-bold uppercase hover:underline"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                        
                        <label className="relative flex flex-col items-center justify-center aspect-square w-full rounded-xl border-2 border-dashed border-brand-charcoal/10 hover:border-brand-gold transition-all cursor-pointer overflow-hidden bg-brand-cream/30 group">
                          {formData.colorImages[color] ? (
                            <img src={formData.colorImages[color]} className="w-full h-full object-cover" />
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
                <label className="text-xs font-bold uppercase tracking-widest text-brand-charcoal/50">Available Sizes</label>
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

              <button
                type="submit"
                disabled={isProcessing}
                className={`w-full bg-brand-gold text-white font-bold py-4 rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-brand-charcoal'}`}
              >
                {isProcessing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  editingProduct ? <Save size={20} /> : <Plus size={20} />
                )}
                {isProcessing ? 'Processing Images...' : (editingProduct ? 'Save Changes' : 'Create Product')}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddProductModal;
