import React, { useState, useMemo } from 'react';
import { useStore } from '../StoreContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ShoppingBag, Check, Layers, ArrowRight, Info, Eye } from 'lucide-react';
import { Product } from '../types';

interface LookItemConfig {
  productId: string;
  defaultColor?: string;
  defaultSize?: string;
  xPercent: number; // Hotspot position X
  yPercent: number; // Hotspot position Y
}

interface CuratedLook {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  image: string;
  discountPercentage: number;
  items: LookItemConfig[];
}

export const ShopTheLook: React.FC = () => {
  const { products, addToCart, formatPrice, setIsCartOpen } = useStore();
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [activeLookIndex, setActiveLookIndex] = useState(0);
  const [selectedProductIds, setSelectedProductIds] = useState<Record<string, boolean>>({});
  const [productSelections, setProductSelections] = useState<Record<string, { color: string; size: string }>>({});
  const [hoveredHotspotId, setHoveredHotspotId] = useState<string | null>(null);

  // Curated lookbook definitions
  const curatedLooks: CuratedLook[] = useMemo(() => [
    {
      id: 'look-stealth-athletic',
      titleAr: 'المظهر الرياضي المتكامل',
      titleEn: 'The Stealth Athletic Look',
      descriptionAr: 'لمحبي الرياضة والأناقة الذكية، طقم يجمع بين الأداء المهني العالي للسنيكرز المتطور وساعة Stealth Pro الذكية المتكاملة.',
      descriptionEn: 'For sports lovers and smart tech enthusiasts, a style combining high-performance sneakers and the Stealth Pro Smartwatch.',
      image: 'https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&q=80&w=1200', // Athletic model lifestyle runner
      discountPercentage: 15,
      items: [
        { productId: '3', defaultColor: 'Red', defaultSize: '42', xPercent: 55, yPercent: 78 }, // Sneakers
        { productId: '4', defaultColor: 'Black', defaultSize: 'One Size', xPercent: 32, yPercent: 42 } // Smartwatch
      ]
    },
    {
      id: 'look-summer-glow',
      titleAr: 'أناقة الصيف والإشراقة الفريدة',
      titleEn: 'The Summer Linen & Glow Look',
      descriptionAr: 'طقم يعبر عن الراحة المطلقة والانتعاش الصيفي بقميص الكتان الأبيض الطبيعي المتناسق مع سيروم الإشراقة والجمال الطبيعي.',
      descriptionEn: 'Express absolute comfort and summer glow with the breathable white linen shirt paired with our Hydrating Glow Serum.',
      image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1200', // Natural summer beauty/fashion
      discountPercentage: 10,
      items: [
        { productId: '1', defaultColor: 'White', defaultSize: 'M', xPercent: 48, yPercent: 35 }, // Linen shirt
        { productId: '2', defaultColor: 'Transparent', defaultSize: '50ml', xPercent: 75, yPercent: 55 } // Glow Serum
      ]
    }
  ], []);

  // Retrieve matching products or fallbacks to ensure the component is robust
  const activeLook = curatedLooks[activeLookIndex];

  const lookProducts = useMemo(() => {
    return activeLook.items.map((itemConfig) => {
      // Find product inside the current store products list
      let matchedProd = products.find((p) => p.id === itemConfig.productId);
      
      // If the IDs don't match directly, try to search the dynamic Firestore products list by name keywords!
      if (!matchedProd && products.length > 0) {
        matchedProd = products.find((p) => {
          const mainName = p.name.toLowerCase();
          if (itemConfig.productId === '1' && (mainName.includes('linen') || mainName.includes('shirt') || mainName.includes('قميص') || mainName.includes('كتان'))) return true;
          if (itemConfig.productId === '2' && (mainName.includes('serum') || mainName.includes('glow') || mainName.includes('سيروم') || mainName.includes('ترطيب'))) return true;
          if (itemConfig.productId === '3' && (mainName.includes('sneaker') || mainName.includes('running') || mainName.includes('سنيكرز') || mainName.includes('حذاء'))) return true;
          if (itemConfig.productId === '4' && (mainName.includes('watch') || mainName.includes('smartwatch') || mainName.includes('ساعة') || mainName.includes('ذكية'))) return true;
          return false;
        });
      }
      
      // Dynamic sandbox fallback if Firestore is loading or clean
      if (!matchedProd) {
        if (itemConfig.productId === '1') {
          matchedProd = {
            id: '1',
            name: isRtl ? 'قميص كتان كاجوال' : 'Minimalist Linen Shirt',
            description: 'Summer breathable shirt.',
            price: 89.99,
            image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=800',
            colors: ['White', 'Beige', 'Navy'],
            sizes: ['S', 'M', 'L', 'XL'],
            category: 'New',
            rating: 4.5,
            stock: 99
          };
        } else if (itemConfig.productId === '2') {
          matchedProd = {
            id: '2',
            name: isRtl ? 'سيروم الترطيب المشرق' : 'Hydrating Glow Serum',
            description: 'Glow booster serum.',
            price: 45.00,
            image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800',
            colors: ['Transparent'],
            sizes: ['30ml', '50ml'],
            category: 'Best Seller',
            rating: 4.8,
            stock: 99
          };
        } else if (itemConfig.productId === '3') {
          matchedProd = {
            id: '3',
            name: isRtl ? 'سنيكرز الأداء الاحترافي' : 'Pro Performance Sneakers',
            description: 'Long-distance athletic shoes.',
            price: 129.99,
            image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800',
            colors: ['Red', 'Black', 'Blue'],
            sizes: ['40', '41', '42', '43', '44'],
            category: 'Offers',
            rating: 4.7,
            stock: 99
          };
        } else {
          matchedProd = {
            id: '4',
            name: isRtl ? 'ساعة Stealth Pro الذكية' : 'Stealth Pro Smartwatch',
            description: 'High-end smart watch.',
            price: 249.00,
            image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=800',
            colors: ['Black', 'Brown Leather'],
            sizes: ['One Size'],
            category: 'Imported',
            rating: 4.9,
            stock: 99
          };
        }
      }

      return {
        product: matchedProd,
        config: itemConfig
      };
    });
  }, [activeLook, products, isRtl]);

  // Handle initialization of default selected items & options
  React.useEffect(() => {
    const initialChecked: Record<string, boolean> = {};
    const initialConfig: Record<string, { color: string; size: string }> = {};

    lookProducts.forEach(({ product, config }) => {
      initialChecked[product.id] = true;
      initialConfig[product.id] = {
        color: product.colors[0] || config.defaultColor || '',
        size: product.sizes[0] || config.defaultSize || ''
      };
    });

    setSelectedProductIds(initialChecked);
    setProductSelections(initialConfig);
  }, [lookProducts]);

  // Calculate pricing dynamics
  const pricingSummary = useMemo(() => {
    let originalTotal = 0;
    let selectedCount = 0;

    lookProducts.forEach(({ product }) => {
      if (selectedProductIds[product.id]) {
        const sel = productSelections[product.id];
        // Fetch customized price if any
        const customizedPrice = product.colorPrices?.[sel?.color] ?? product.discountPrice ?? product.price;
        originalTotal += customizedPrice;
        selectedCount += 1;
      }
    });

    const isBundleEligible = selectedCount === lookProducts.length;
    const discountPercent = isBundleEligible ? activeLook.discountPercentage : 0;
    const discountAmount = originalTotal * (discountPercent / 100);
    const finalTotal = originalTotal - discountAmount;

    return {
      originalTotal,
      finalTotal,
      discountAmount,
      discountPercent,
      isBundleEligible,
      selectedCount
    };
  }, [lookProducts, selectedProductIds, productSelections, activeLook]);

  // Add all checked options to shopping cart
  const handleAddLookToCart = () => {
    let itemsAdded = 0;
    lookProducts.forEach(({ product }) => {
      if (selectedProductIds[product.id]) {
        const selection = productSelections[product.id] || { color: '', size: '' };
        
        // Calculate tailored price applying the look bundle discount if buying whole package
        const normalPrice = product.price;
        const discountPrice = product.discountPrice ?? undefined;
        
        // If whole outfit bundle is eligible, we custom overlay the discount to represent the bundle offer
        let appliedProduct = { ...product };
        if (pricingSummary.isBundleEligible) {
          const promoItemPrice = (product.discountPrice ?? product.price) * (1 - activeLook.discountPercentage / 100);
          appliedProduct.discountPrice = Number(promoItemPrice.toFixed(2));
        }

        addToCart(
          appliedProduct,
          selection.color,
          selection.size,
          1
        );
        itemsAdded += 1;
      }
    });

    if (itemsAdded > 0) {
      setIsCartOpen(true);
    }
  };

  const toggleProductSelection = (id: string) => {
    setSelectedProductIds((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleOptionChange = (productId: string, key: 'color' | 'size', value: string) => {
    setProductSelections((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [key]: value
      }
    }));
  };

  const arText = {
    badge: 'تنسيقات عصرية',
    heading: 'اشتري المظهر كاملاً',
    headingAccent: 'وفر أكثر ✨',
    desc: 'اخترنا لك بعناية طقم ملابس وإكسسوارات متناسقة تماماً. اشتر الطقم كاملاً كحزمة متكاملة واحصل على خصم إضافي حصري على الإجمالي.',
    savingsBadge: 'وفر في الحزمة الكاملة',
    totalText: 'الإجمالي الأصلي:',
    discountBundle: 'خصم المظهر الكامل ({{discount}}%):',
    finalTotalText: 'سعر الطقم بالكامل:',
    addToCartBtn: 'إضافة الطقم المختار للسلة',
    individualPrice: 'سعر القطعة:',
    lookToggle: 'المجموعات المنسقة:',
    saveText: 'لقد وفرت'
  };

  const enText = {
    badge: 'Curated Outfits',
    heading: 'Shop The Look',
    headingAccent: 'Bundle & Save ✨',
    desc: 'Our style experts curated these gorgeous lifestyle collections. Buy the complete package together to claim a special stackable discount immediately.',
    savingsBadge: 'Complete Look Savings',
    totalText: 'Original Subtotal:',
    discountBundle: 'Bundle Discount ({{discount}}%):',
    finalTotalText: 'Complete Look Price:',
    addToCartBtn: 'Add Curated Look to Bag',
    individualPrice: 'Item price:',
    lookToggle: 'Curated Sets:',
    saveText: 'You Saved'
  };

  const labels = isRtl ? arText : enText;

  return (
    <section className="py-24 bg-black/40 border-y border-white/5 relative overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="flex flex-col items-center text-center mb-16 space-y-4">
          <span className="px-3.5 py-1.5 rounded-full bg-brand-gold/10 text-[#C5A05B] text-[10px] font-black uppercase tracking-[0.25em]">
            {labels.badge}
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            {labels.heading} <span className="text-[#C5A05B]">{labels.headingAccent}</span>
          </h2>
          <p className="max-w-2xl text-xs md:text-sm text-white/60 leading-relaxed font-medium">
            {activeLookIndex === 0 
              ? (isRtl ? curatedLooks[0].descriptionAr : curatedLooks[0].descriptionEn)
              : (isRtl ? curatedLooks[1].descriptionAr : curatedLooks[1].descriptionEn)
            }
          </p>
        </div>

        {/* Tab toggle looks switcher */}
        <div className="flex justify-center gap-3 mb-10 overflow-x-auto pb-2 no-scrollbar">
          {curatedLooks.map((look, idx) => (
            <button
              key={look.id}
              onClick={() => {
                setActiveLookIndex(idx);
                setHoveredHotspotId(null);
              }}
              className={`px-5 py-3 rounded-2xl text-xs font-black tracking-wider transition-all cursor-pointer ${
                activeLookIndex === idx
                  ? 'bg-white text-black shadow-lg shadow-white/5 scale-105'
                  : 'bg-white/5 text-white/60 hover:text-white border border-white/5 hover:bg-white/10 hover:shadow-xs'
              }`}
            >
              {isRtl ? look.titleAr : look.titleEn}
            </button>
          ))}
        </div>

        {/* Grid Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          
          {/* LEFT: Live Interactive Hotspots on Model Image */}
          <div className="lg:col-span-6 flex items-center justify-center">
            <div className="relative w-full aspect-[4/5] rounded-[2.5rem] overflow-hidden border border-white/5 bg-[#121214] shadow-2xl group/image">
              <img 
                src={activeLook.image} 
                alt="Styled Model Portfolio" 
                className="w-full h-full object-cover group-hover/image:scale-[1.02] transition-transform duration-700" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10 pointer-events-none" />

              {/* Dynamic hotspot pins */}
              {lookProducts.map(({ product, config }) => {
                const isActiveHovered = hoveredHotspotId === product.id;
                const isItemChecked = selectedProductIds[product.id];

                return (
                  <div
                    key={`pin-${product.id}`}
                    style={{ left: `${config.xPercent}%`, top: `${config.yPercent}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                    onMouseEnter={() => setHoveredHotspotId(product.id)}
                    onMouseLeave={() => setHoveredHotspotId(null)}
                  >
                    <div className="relative flex items-center justify-center">
                      {/* Pulse circle rings */}
                      <span className="animate-ping absolute inline-flex h-10 w-10 rounded-full bg-brand-gold/40 opacity-75" />
                      <button
                        onClick={() => toggleProductSelection(product.id)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all cursor-pointer ${
                          isItemChecked 
                            ? 'bg-[#C5A05B] text-white border-white scale-110 shadow-lg' 
                            : 'bg-white/90 text-black border-black/10'
                        }`}
                      >
                        {isItemChecked ? <Check size={12} strokeWidth={3} /> : <span className="w-1.5 h-1.5 rounded-full bg-black/80" />}
                      </button>

                      {/* Floating dynamic tags on hover */}
                      <AnimatePresence>
                        {(isActiveHovered || hoveredHotspotId === null) && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className={`absolute bottom-9 ${isRtl ? 'right-0 origin-bottom-right' : 'left-0 origin-bottom-left'} bg-brand-charcoal text-white rounded-xl px-3 py-2 shadow-xl border border-white/10 whitespace-nowrap z-30 pointer-events-none flex gap-2 items-center`}
                          >
                            <img src={product.image} className="w-6 h-8 object-cover rounded-md bg-white/10" alt="" referrerPolicy="no-referrer" />
                            <div>
                              <p className="text-[10px] font-black tracking-tight max-w-[120px] truncate">{product.name}</p>
                              <p className="text-[9px] font-bold text-[#C5A05B]">{formatPrice(product.discountPrice ?? product.price)}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Selected Look Configurator panel & pricing cards */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            
            {/* Outfits List header */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Layers className="text-[#C5A05B]" size={18} />
                <h3 className="text-lg font-black tracking-tight text-white">
                  {isRtl ? 'مكونات هذا الطقم المنسق' : 'Items In This Curated Set'}
                </h3>
              </div>

              {/* Loop Items inside Curated Outfit */}
              <div className="space-y-3">
                {lookProducts.map(({ product }) => {
                  const isChecked = selectedProductIds[product.id] || false;
                  const currentSelection = productSelections[product.id] || { color: '', size: '' };

                  return (
                    <div
                      key={`config-row-${product.id}`}
                      onMouseEnter={() => setHoveredHotspotId(product.id)}
                      onMouseLeave={() => setHoveredHotspotId(null)}
                      className={`p-4 rounded-3xl border transition-all duration-300 flex items-center gap-4 ${
                        isChecked 
                          ? 'bg-[#121214] border-brand-gold/30 shadow-xl shadow-black/40' 
                          : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] opacity-50'
                      }`}
                    >
                      {/* Checkbox box */}
                      <button
                        onClick={() => toggleProductSelection(product.id)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all flex-shrink-0 cursor-pointer ${
                          isChecked
                            ? 'bg-[#C5A05B] text-white border-transparent'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        {isChecked && <Check size={14} strokeWidth={3} />}
                      </button>

                      {/* Small Image thumbnail */}
                      <div className="w-12 h-16 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex-shrink-0">
                        <img src={product.image} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                      </div>

                      {/* Product specifications */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h4 className="text-xs font-black text-white truncate">{product.name}</h4>
                            <p className="text-[10px] text-white/40 font-bold tracking-tight">
                              {labels.individualPrice} <span className="text-[#C5A05B] font-black">{formatPrice(product.discountPrice ?? product.price)}</span>
                            </p>
                          </div>
                        </div>

                        {/* Dropdown selectors for color & size */}
                        {isChecked && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {product.colors.length > 1 && (
                              <select
                                value={currentSelection.color}
                                onChange={(e) => handleOptionChange(product.id, 'color', e.target.value)}
                                className="bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg px-2.5 py-1 text-[10px] font-black text-white/90 focus:outline-none transition-colors cursor-pointer"
                              >
                                {product.colors.map((c) => (
                                  <option key={c} value={c} className="bg-brand-charcoal text-white">{c}</option>
                                ))}
                              </select>
                            )}

                            {product.sizes.length > 1 && (
                              <select
                                value={currentSelection.size}
                                onChange={(e) => handleOptionChange(product.id, 'size', e.target.value)}
                                className="bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg px-2.5 py-1 text-[10px] font-black text-white/90 focus:outline-none transition-colors cursor-pointer"
                              >
                                {product.sizes.map((s) => (
                                  <option key={s} value={s} className="bg-brand-charcoal text-white">{s}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Smart Bundle checkout box */}
            <div className="bg-[#131210] border border-brand-gold/20 rounded-[2rem] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-white/60">{labels.totalText}</span>
                <span className={`text-sm font-bold ${pricingSummary.isBundleEligible ? 'line-through text-white/30' : 'text-white/80'}`}>
                  {formatPrice(pricingSummary.originalTotal)}
                </span>
              </div>

              {/* Reveal savings notice if bundling complete set */}
              {pricingSummary.isBundleEligible ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-green-400 bg-green-500/10 px-4 py-2.5 rounded-xl border border-green-500/20">
                    <span className="text-xs font-black flex items-center gap-1.5">
                      <Sparkles size={14} className="animate-spin-slow" />
                      {labels.savingsBadge}
                    </span>
                    <span className="text-xs font-extrabold text-green-400">-{activeLook.discountPercentage}%</span>
                  </div>

                  <div className="flex justify-between items-center text-xs font-medium text-white/80">
                    <span>{labels.saveText}:</span>
                    <span className="text-xs font-bold text-green-400">-{formatPrice(pricingSummary.discountAmount)}</span>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 flex items-start gap-2.5">
                  <Info size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-300/80 font-bold leading-normal">
                    {isRtl 
                      ? `أضف جميع المنتجات (${lookProducts.length}) للاستفادة بخصم الحزمة الكامل ${activeLook.discountPercentage}%!` 
                      : `Select all ${lookProducts.length} items to receive the special lookbook bundle discount count at ${activeLook.discountPercentage}%!`
                    }
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-brand-gold/15 flex items-end justify-between">
                <div>
                  <p className="text-[10px] uppercase font-black text-white/40 tracking-wider">
                    {pricingSummary.isBundleEligible ? labels.finalTotalText : (isRtl ? 'المجموع لمختاراتك' : 'Your Selections')}
                  </p>
                  <p className="text-xl md:text-2xl font-black text-brand-gold mt-1">
                    {formatPrice(pricingSummary.finalTotal)}
                  </p>
                </div>

                <button
                  onClick={handleAddLookToCart}
                  disabled={pricingSummary.selectedCount === 0}
                  className="px-6 py-3.5 bg-[#C5A059] hover:bg-[#C5A059]/90 disabled:bg-white/5 disabled:text-white/20 disabled:pointer-events-none text-black text-[11px] font-black uppercase tracking-widest rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <ShoppingBag size={14} />
                  <span>{labels.addToCartBtn}</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
