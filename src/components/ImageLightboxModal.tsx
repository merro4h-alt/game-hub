import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../StoreContext';
import { useTranslation } from 'react-i18next';

export const ImageLightboxModal: React.FC = () => {
  const { lightboxInfo, setLightboxInfo } = useStore();
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const [activeIndex, setActiveIndex] = useState(0);

  if (!lightboxInfo) return null;

  const { imageUrl, title, allImages = [] } = lightboxInfo;
  
  // Combine all unique images, starting with the selected one
  const imagesList = Array.from(new Set([imageUrl, ...allImages])).filter(Boolean);

  const currentImage = imagesList[activeIndex] || imageUrl;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? imagesList.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((prev) => (prev === imagesList.length - 1 ? 0 : prev + 1));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4 select-none">
        {/* Backdrop Close */}
        <div className="absolute inset-0 cursor-zoom-out" onClick={() => setLightboxInfo(null)} />

        {/* Top Header Information */}
        <div className="absolute top-0 inset-x-0 p-6 flex items-center justify-between text-white z-10 bg-gradient-to-b from-black/60 to-transparent">
          <h3 className="text-sm font-black uppercase tracking-widest leading-relaxed line-clamp-1 max-w-[70%]">
            {title}
          </h3>
          <button
            onClick={() => setLightboxInfo(null)}
            className="p-3 bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-full text-white cursor-pointer"
            title={isRtl ? 'إغلاق' : 'Close'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="relative w-full max-w-4xl max-h-[75vh] flex items-center justify-center z-10">
          {/* Previous Arrow */}
          {imagesList.length > 1 && (
            <button
              onClick={isRtl ? handleNext : handlePrev}
              className="absolute left-4 p-3 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 text-white backdrop-blur-md transition-all active:scale-90 z-20 cursor-pointer"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Product Image */}
          <motion.img
            key={currentImage}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            src={currentImage}
            alt={title}
            className="max-w-full max-h-[70vh] object-contain rounded-3xl border border-white/5 shadow-2xl"
            referrerPolicy="no-referrer"
          />

          {/* Next Arrow */}
          {imagesList.length > 1 && (
            <button
              onClick={isRtl ? handlePrev : handleNext}
              className="absolute right-4 p-3 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 text-white backdrop-blur-md transition-all active:scale-90 z-20 cursor-pointer"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>

        {/* Thumbnails indicator / Image count at the bottom */}
        {imagesList.length > 1 && (
          <div className="absolute bottom-6 z-10 flex flex-col items-center gap-4">
            <span className="text-[10px] font-mono tracking-widest text-white/50">
              {activeIndex + 1} / {imagesList.length}
            </span>
            <div className="flex gap-2 overflow-x-auto max-w-[90vw] no-scrollbar pb-2">
              {imagesList.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIndex(idx)}
                  className={`w-12 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                    activeIndex === idx ? 'border-brand-gold scale-105 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
