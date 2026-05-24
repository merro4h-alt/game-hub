import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Gift, Heart, Smile, Compass, 
  DollarSign, Award, ArrowLeft, ArrowRight, Copy, Check, 
  User, Briefcase, Users, ShoppingBag, RotateCcw, HeartHandshake,
  Star, Palette
} from 'lucide-react';
import { useStore } from '../StoreContext';
import { useTranslation } from 'react-i18next';
import ProductCard from '../components/ProductCard';

interface RecommendedGiftResult {
  selectedProductIds: string[];
  reasoning: string;
  giftCardText: string;
  wrappingTip: string;
}

const GiftAdvisorPage: React.FC = () => {
  const { products } = useStore();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  // State management
  const [step, setStep] = useState<number>(0); // 0: intro, 1: receiver, 2: occasion, 3: vibe, 4: budget, 5: loading, 6: results
  const [receiver, setReceiver] = useState<string>('');
  const [occasion, setOccasion] = useState<string>('');
  const [interests, setInterests] = useState<string>('');
  const [budget, setBudget] = useState<number>(150);
  const [copiedCard, setCopiedCard] = useState<boolean>(false);
  
  // Results
  const [isLoadingResults, setIsLoadingResults] = useState<boolean>(false);
  const [results, setResults] = useState<RecommendedGiftResult | null>(null);

  // Constants
  const receiversList = [
    { key: 'partner', en: 'Partner / Spouse', ar: 'شريك الحياة / الزوج(ة)', icon: Heart, desc_en: 'Romantic & personal gesture', desc_ar: 'تعبير رومانسي وشخصي فاخر' },
    { key: 'friend', en: 'Friend', ar: 'صديق مقرب', icon: Smile, desc_en: 'Express appreciation & gratitude', desc_ar: 'لأعز الأصدقاء وامتنان أخوي' },
    { key: 'family', en: 'Family Member', ar: 'أحد أفراد العائلة', icon: Users, desc_en: 'Warmth and support', desc_ar: 'الدفء، الوالدين، أو الأشقاء' },
    { key: 'colleague', en: 'Colleague / Boss', ar: 'زميل عمل / مدير', icon: Briefcase, desc_en: 'Professional and stylish', desc_ar: 'رسمية وأنيقة تعكس ثقة مهنية' },
    { key: 'myself', en: 'Myself (Self-Care)', ar: 'نفسي (تدليل الذات)', icon: User, desc_en: 'Because you deserve it', desc_ar: 'لأنك تستحق الأفضل دائماً' }
  ];

  const occasionsList = [
    { key: 'birthday', en: 'Birthday', ar: 'عيد ميلاد', icon: Award, desc_en: 'New year of milestones', desc_ar: 'الاحتفال بسنة جديدة مميزة' },
    { key: 'anniversary', en: 'Anniversary', ar: 'ذكرى سنوية', icon: HeartHandshake, desc_en: 'Celebrating milestones together', desc_ar: 'تجديد العهود والذكريات السعيدة' },
    { key: 'graduation', en: 'Graduation / Success', ar: 'تخرج أو نجاح', icon: Star, desc_en: 'Wishes for the path ahead', desc_ar: 'تمنيات بمستقبل باهر ومليء بالنجاح' },
    { key: 'just_love', en: 'No Occasion / Just Love', ar: 'بدون مناسبة / تعبير عن الحب', icon: Sparkles, desc_en: 'Surprises make the best gifts', desc_ar: 'أرق الهدايا هي التي تأتي بلا موعد' }
  ];

  const vibesList = [
    { key: 'luxury', en: 'Elegance & Luxury', ar: 'الأناقة والفخامة الكلاسيكية', icon: Palette, desc_en: 'Premium styles, premium feel', desc_ar: 'خيارات راقية، منتقاة بعناية للمميزين' },
    { key: 'tech', en: 'Smart Gadgets & Tech', ar: 'الأجهزة والأدوات الذكية عالية الأداء', icon: Compass, desc_en: 'Practical, smart, cutting-edge', desc_ar: 'عملية وذكية تناسب محبي التقنية المتطورة' },
    { key: 'cosmetics', en: 'Self-Care & Skincare', ar: 'العناية بالبشرة والجمال', icon: Gift, desc_en: 'Hydration, glow, premium serum', desc_ar: 'مستحضرات عناية فائقة للبشرة والتألق' }
  ];

  const budgetPresets = [50, 100, 150, 250, 500];

  const handleNextStep = () => {
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    if (step > 0) setStep(prev => prev - 1);
  };

  const handleSelectReceiver = (key: string) => {
    setReceiver(key);
    handleNextStep();
  };

  const handleSelectOccasion = (key: string) => {
    setOccasion(key);
    handleNextStep();
  };

  const handleSelectVibe = (key: string) => {
    setInterests(key);
    handleNextStep();
  };

  const handleStartAnalysis = async () => {
    setStep(5); // Show loading spinner with premium text transitionings
    setIsLoadingResults(true);

    try {
      // Direct post to backend controller
      const response = await fetch('/api/gift-advisor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiver: receiversList.find(r => r.key === receiver)?.[isAr ? 'ar' : 'en'] || receiver,
          occasion: occasionsList.find(o => o.key === occasion)?.[isAr ? 'ar' : 'en'] || occasion,
          interests: vibesList.find(v => v.key === interests)?.[isAr ? 'ar' : 'en'] || interests,
          budget,
          storeProducts: products.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            image: p.image,
            category: p.category
          })),
          lang: i18n.language
        })
      });

      const data = await response.json();
      if (data && data.success) {
        setResults(data);
      } else {
        throw new Error("Invalid API Response");
      }
    } catch (err) {
      console.error("Failed to load smart advisor recommendations:", err);
    } finally {
      setIsLoadingResults(false);
      setStep(6); // Results mode
    }
  };

  const handleCopyCard = () => {
    if (results?.giftCardText) {
      navigator.clipboard.writeText(results.giftCardText);
      setCopiedCard(true);
      setTimeout(() => setCopiedCard(false), 2000);
    }
  };

  const handleRestart = () => {
    setStep(0);
    setReceiver('');
    setOccasion('');
    setInterests('');
    setBudget(150);
    setResults(null);
  };

  // Filter actual items recommended by IDs
  const recommendedProducts = products.filter(p => results?.selectedProductIds?.includes(p.id));

  return (
    <div className="pt-24 pb-32 bg-[#0A0A0B] text-white min-h-screen relative overflow-hidden font-sans">
      {/* Dynamic background lights */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#C5A059]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-0 w-96 h-96 bg-brand-gold/5 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <AnimatePresence mode="wait">
          {/* STEP 0: Introduction landing panel */}
          {step === 0 && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="text-center max-w-3xl mx-auto py-16 space-y-10"
            >
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C5A059]/10 border border-[#C5A059]/20 text-[#EAD8B1] rounded-full text-xs font-black uppercase tracking-widest leading-none">
                <Sparkles size={14} className="animate-spin" />
                {isAr ? 'مستشار الهدايا والانتقاء الذكي' : 'Smart Gift Advisory System'}
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight">
                {isAr ? 'اختر الهدية المثالية' : 'Choose The Perfect'} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C5A05B] to-[#EAD8B1] italic font-serif">
                  {isAr ? 'ببصمة الذكاء الاصطناعي' : 'Gift in Seconds'}
                </span>
              </h1>

              <p className="text-lg text-white/50 leading-relaxed font-light">
                {isAr 
                  ? 'دع خوارزميات الذكاء الاصطناعي تحلل ذوق متلقي الهدية والمناسبة ونطاق ميزانيتك لتختار له من كتالوج المتجر أرقى المنتجات مع كرت إهداء شخصي ملهم ونصائح تغليف باهرة.'
                  : 'Let our cognitive algorithm analyze your recipient, occasion, and custom budget settings to synthesize the perfect selection, hand-tailored gift card text, and wrapping strategies.'}
              </p>

              <div className="pt-8">
                <button
                  onClick={handleNextStep}
                  className="px-10 py-5 bg-brand-gold text-brand-charcoal hover:bg-[#EAD8B1] active:scale-95 text-sm font-black uppercase tracking-wider rounded-2xl transition-all shadow-xl shadow-brand-gold/15 flex items-center gap-3 mx-auto cursor-pointer"
                >
                  {isAr ? 'ابدأ تجربة الاختيار الذكي' : 'Start Smart Matching'}
                  <ArrowRight size={18} className={isAr ? 'rotate-180' : ''} />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 1: Receiver */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="max-w-4xl mx-auto space-y-12"
            >
              <div className="text-center space-y-3">
                <span className="text-brand-gold font-bold text-sm tracking-widest font-mono">STEP 01 / 04</span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                  {isAr ? 'من هو متلقي الهدية؟' : 'Who is the recipient?'}
                </h2>
                <p className="text-white/40 text-xs uppercase tracking-widest">
                  {isAr ? 'تحديد طبيعة العلاقة يساعدنا على انتقاء الهدية الأمثل' : 'Understanding your connection tunes the recommendation'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {receiversList.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleSelectReceiver(item.key)}
                      className="p-6 bg-[#1A1A1A] border border-white/5 hover:border-[#C5A059]/40 rounded-[2rem] text-left rtl:text-right hover:bg-[#222] transition-all cursor-pointer group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-[#C5A059] group-hover:bg-[#C5A059] group-hover:text-brand-charcoal transition-all">
                          <Icon size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-white group-hover:text-brand-gold transition-colors">{isAr ? item.ar : item.en}</p>
                          <p className="text-xs text-white/30 mt-0.5">{isAr ? item.desc_ar : item.desc_en}</p>
                        </div>
                      </div>
                      <ArrowRight size={16} className={`text-white/20 group-hover:text-[#C5A059] group-hover:translate-x-1.5 transition-all ${isAr ? 'rotate-180 group-hover:-translate-x-1.5' : ''}`} />
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-start">
                <button
                  onClick={handlePrevStep}
                  className="flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white"
                >
                  <ArrowLeft size={14} className={isAr ? 'rotate-180' : ''} />
                  {isAr ? 'الرجوع' : 'Back'}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Occasion */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="max-w-4xl mx-auto space-y-12"
            >
              <div className="text-center space-y-3">
                <span className="text-brand-gold font-bold text-sm tracking-widest font-mono">STEP 02 / 04</span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                  {isAr ? 'ما هي المناسبة الجميلة؟' : 'What is the occasion?'}
                </h2>
                <p className="text-white/40 text-xs uppercase tracking-widest">
                  {isAr ? 'لتخصيص الرسالة وأسلوب التغليف والهدية بما يتلائم مع الحدث' : 'Tailors the package, wrapper aesthetics, and theme'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {occasionsList.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleSelectOccasion(item.key)}
                      className="p-6 bg-[#1A1A1A] border border-white/5 hover:border-[#C5A059]/40 rounded-[2rem] text-left rtl:text-right hover:bg-[#222] transition-all cursor-pointer group flex items-center justify-between"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-[#C5A059] group-hover:bg-[#C5A059] group-hover:text-brand-charcoal transition-all">
                          <Icon size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-white group-hover:text-brand-gold transition-colors">{isAr ? item.ar : item.en}</p>
                          <p className="text-xs text-white/30 mt-0.5">{isAr ? item.desc_ar : item.desc_en}</p>
                        </div>
                      </div>
                      <ArrowRight size={16} className={`text-white/20 group-hover:text-[#C5A059] group-hover:translate-x-1.5 transition-all ${isAr ? 'rotate-180 group-hover:-translate-x-1.5' : ''}`} />
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={handlePrevStep}
                  className="flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white"
                >
                  <ArrowLeft size={14} className={isAr ? 'rotate-180' : ''} />
                  {isAr ? 'الرجوع' : 'Back'}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Vibe/Interests */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="max-w-4xl mx-auto space-y-12"
            >
              <div className="text-center space-y-3">
                <span className="text-brand-gold font-bold text-sm tracking-widest font-mono">STEP 03 / 04</span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                  {isAr ? 'ما هو أسلوبه وشغفه المفضل؟' : "What is their personal vibe?"}
                </h2>
                <p className="text-white/40 text-xs uppercase tracking-widest">
                  {isAr ? 'اختر الاهتمام لفلترة المنتجات حسب أسلوب حياتهم' : "Focuses the algorithms on matching interests and habits"}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {vibesList.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleSelectVibe(item.key)}
                      className="p-8 bg-[#1A1A1A] border border-white/5 hover:border-[#C5A059]/45 rounded-[2.5rem] hover:bg-[#222] transition-all cursor-pointer group text-center flex flex-col items-center space-y-5"
                    >
                      <div className="w-16 h-16 bg-white/5 rounded-3xl flex items-center justify-center text-[#C5A059] group-hover:bg-[#C5A059] group-hover:text-brand-charcoal transition-all">
                        <Icon size={28} />
                      </div>
                      <div className="space-y-1.5">
                        <p className="font-extrabold text-white group-hover:text-brand-gold transition-colors">{isAr ? item.ar : item.en}</p>
                        <p className="text-xs text-white/40 leading-relaxed">{isAr ? item.desc_ar : item.desc_en}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between items-center">
                <button
                  onClick={handlePrevStep}
                  className="flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white"
                >
                  <ArrowLeft size={14} className={isAr ? 'rotate-180' : ''} />
                  {isAr ? 'الرجوع' : 'Back'}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Budget Range */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="max-w-2xl mx-auto space-y-12"
            >
              <div className="text-center space-y-3">
                <span className="text-brand-gold font-bold text-sm tracking-widest font-mono">STEP 04 / 04</span>
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                  {isAr ? 'ما هي الميزانية المقدرة؟' : 'Assign your gift budget'}
                </h2>
                <p className="text-white/40 text-xs uppercase tracking-widest">
                  {isAr ? 'سنقوم بانتقاء هدايا فخمة تناسب الميزانية المحددة' : 'We will handpick matches within this threshold'}
                </p>
              </div>

              <div className="bg-[#1A1A1A] p-8 rounded-[2.5rem] border border-white/5 space-y-8">
                {/* Budget visual value */}
                <div className="text-center">
                  <span className="text-xs font-black text-white/40 uppercase tracking-widest">
                    {isAr ? 'قيمة الميزانية' : 'Target Budget'}
                  </span>
                  <p className="text-5xl font-black text-brand-gold tracking-tight mt-1">
                    ${budget}
                  </p>
                </div>

                {/* Range Slider */}
                <div className="space-y-2">
                  <input
                    type="range"
                    min={20}
                    max={1000}
                    step={10}
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                    className="w-full h-2 bg-blackAccent rounded-lg appearance-none cursor-pointer accent-brand-gold"
                  />
                  <div className="flex justify-between text-[11px] font-mono text-white/30">
                    <span>$20</span>
                    <span>$500</span>
                    <span>$1000</span>
                  </div>
                </div>

                {/* Quick select buttons */}
                <div className="flex flex-wrap gap-2.5 justify-center pt-4 border-t border-white/5">
                  {budgetPresets.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setBudget(preset)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors ${
                        budget === preset 
                          ? 'bg-brand-gold text-brand-charcoal' 
                          : 'bg-black/40 text-white hover:bg-white/5 border border-white/5'
                      }`}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-4">
                <button
                  onClick={handlePrevStep}
                  className="flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white"
                >
                  <ArrowLeft size={14} className={isAr ? 'rotate-180' : ''} />
                  {isAr ? 'الرجوع' : 'Back'}
                </button>

                <button
                  onClick={handleStartAnalysis}
                  className="px-8 py-4 bg-brand-gold text-brand-charcoal hover:bg-[#EAD8B1] font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles size={14} />
                  {isAr ? 'اصنع التوصيات الذكية' : 'Generate Recommendations'}
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: Loading Sparkles Analyzer */}
          {step === 5 && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-md mx-auto py-24 text-center space-y-10"
            >
              <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                {/* Rotating accent rings */}
                <div className="absolute inset-0 border-4 border-[#C5A031]/10 border-t-brand-gold rounded-full animate-spin duration-1000" />
                <div className="absolute inset-2 border-4 border-indigo-500/10 border-b-indigo-400 rounded-full animate-spin duration-2000" />
                <Sparkles size={32} className="text-brand-gold animate-bounce" />
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-black uppercase tracking-widest text-[#EAD8B1]">
                  {isAr ? 'جاري تحليل ذوق متلقي الهدية...' : 'Analyzing Recipient Profile...'}
                </h3>
                
                {/* Simulated cycling message texts */}
                <p className="text-xs text-white/40 max-w-sm mx-auto animate-pulse">
                  {isAr 
                    ? 'جاري فحص مخزون وكتالوج ONXIFI للبحث عن الهدايا الأكثر مواءمة لميزانيتك وتفضيلاتك...'
                    : 'Curating ONXIFI collection coordinates, filtering budget lines, and drafting greeting suggestions...'}
                </p>
              </div>
            </motion.div>
          )}

          {/* STEP 6: Results displays */}
          {step === 6 && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-white/5">
                <div>
                  <span className="text-xs bg-brand-gold/10 text-brand-gold uppercase tracking-widest font-black px-3 py-1.5 border border-brand-gold/20 rounded-full inline-block mb-3.5">
                    {isAr ? 'تم الذكاء الاصطناعي بنجاح' : 'AI Curated Matches'}
                  </span>
                  <h2 className="text-4xl font-extrabold tracking-tight">
                    {isAr ? 'اقتراحات مستشارك الذكي لكم' : 'Your Custom Gift Matches'}
                  </h2>
                </div>

                <button
                  onClick={handleRestart}
                  className="px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold tracking-wider hover:text-brand-gold transition-colors flex items-center gap-2 border border-white/5 cursor-pointer"
                >
                  <RotateCcw size={14} />
                  {isAr ? 'البدء من جديد' : 'Gift Another Person'}
                </button>
              </div>

              {/* Recommended actual products */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <h3 className="text-sm font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                    <ShoppingBag size={16} className="text-brand-gold" />
                    {isAr ? 'المنتجات المقترحة من الكتالوج' : 'Best Products Handpicked For You'}
                  </h3>

                  {recommendedProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {recommendedProducts.map((prod) => (
                        <div key={prod.id} className="bg-[#1A1A1A] p-4 rounded-[2.5rem] border border-white/5">
                          <ProductCard product={prod} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-[#1A1A1A] p-12 rounded-[2.5rem] border border-white/5 text-center text-white/30 text-xs uppercase tracking-widest">
                      {isAr ? 'لم نجد منتجات مباشرة تطابق ميزانيتك، يمكنك تصفح كامل المتجر.' : 'No direct items exact match. Explore other store views!'}
                    </div>
                  )}

                  {/* Curators Reasoning advice */}
                  {results?.reasoning && (
                    <div className="bg-[#1A1A1A] p-8 rounded-[2.5rem] border border-[#C5A059]/15 space-y-4">
                      <h4 className="text-xs font-black uppercase text-brand-gold tracking-widest flex items-center gap-1.5">
                        <Sparkles size={14} />
                        {isAr ? 'رؤية وتحليل مستشار الهدايا الذكي' : 'Expert Gift Advisor Insight'}
                      </h4>
                      <p className="text-sm font-light text-white/70 leading-relaxed">
                        {results.reasoning}
                      </p>
                    </div>
                  )}
                </div>

                {/* Right col: Gift Card & Presentation tips */}
                <div className="space-y-6">
                  {/* Generated Card */}
                  {results?.giftCardText && (
                    <div className="bg-gradient-to-br from-[#1E1C15] to-[#121214] p-8 rounded-[2.5rem] border border-[#C5A059]/20 relative overflow-hidden flex flex-col justify-between h-fit gap-8 shadow-xl">
                      <div className="absolute right-0 top-0 w-24 h-24 bg-[#C5A059]/5 rounded-full blur-2xl pointer-events-none" />
                      
                      <div className="space-y-4">
                        <span className="text-[10px] font-black tracking-widest text-brand-gold uppercase bg-brand-gold/10 px-3 py-1 rounded-full border border-brand-gold/15 inline-block">
                          {isAr ? 'كرت الإهداء المتناسق' : 'Matching Dedication Card'}
                        </span>
                        
                        <div className="bg-black/25 p-5 rounded-2xl border border-white/5 min-h-[140px] flex items-center">
                          <p className="text-xs italic font-serif leading-relaxed text-[#EAD8B1] whitespace-pre-wrap">
                            "{results.giftCardText}"
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleCopyCard}
                        className="w-full py-3 bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-charcoal border border-[#C5A059]/20 font-bold text-xs uppercase rounded-xl transition-all tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {copiedCard ? (
                          <>
                            <Check size={14} className="text-green-400" />
                            {isAr ? 'تم نسخ نص الإهداء!' : 'Copied Success'}
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            {isAr ? 'نسخ نص كرت الإهداء' : 'Copy Card Text'}
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Wrapping Tip */}
                  {results?.wrappingTip && (
                    <div className="bg-[#1A1A1A] p-8 rounded-[2.5rem] border border-white/5 space-y-4">
                      <h4 className="text-xs font-black uppercase text-white/50 tracking-widest flex items-center gap-1.5">
                        <Gift size={14} />
                        {isAr ? 'فن تغليف الهدايا الموصى به' : 'Aesthetic Wrapping Style'}
                      </h4>
                      <p className="text-xs font-light text-white/60 leading-relaxed">
                        {results.wrappingTip}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GiftAdvisorPage;
