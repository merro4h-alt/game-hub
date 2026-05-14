import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, Send, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose }) => {
  const { t, i18n } = useTranslation();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const isRtl = i18n.language === 'ar';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || isSending) return;

    setIsSending(true);

    try {
      await fetch('https://formsubmit.co/ajax/merro4h@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          type: "Store Rating",
          stars: rating,
          comment: comment,
          _subject: `New Store Rating: ${rating} Stars`,
        })
      });

      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        // Reset after modal closes
        setTimeout(() => {
          setIsSuccess(false);
          setRating(0);
          setComment('');
        }, 300);
      }, 2000);
    } catch (error) {
      console.error('Rating error:', error);
    } finally {
      setIsSending(false);
    }
  };

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
            className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-brand-charcoal p-8 text-brand-cream relative">
              <button 
                onClick={onClose}
                className={`absolute top-6 ${isRtl ? 'left-6' : 'right-6'} hover:rotate-90 transition-transform duration-300`}
              >
                <X size={24} />
              </button>
              <h2 className="text-3xl font-black tracking-tighter mb-2 italic">
                {t('reviews.modalTitle')}
              </h2>
              <p className="text-brand-cream/60 text-sm font-light leading-relaxed">
                {t('reviews.modalSubtitle')}
              </p>
            </div>

            <div className="p-8">
              {isSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-brand-charcoal mb-2">
                    {t('reviews.success')}
                  </h3>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Rating Stars */}
                  <div className="text-center">
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-brand-charcoal/40 mb-4">
                      {t('reviews.ratingLabel')}
                    </label>
                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHover(star)}
                          onMouseLeave={() => setHover(0)}
                          onClick={() => setRating(star)}
                          className="transition-all duration-200 transform hover:scale-125 focus:outline-none"
                        >
                          <Star
                            size={40}
                            className={`${
                              star <= (hover || rating)
                                ? 'fill-brand-gold text-brand-gold'
                                : 'text-brand-charcoal/10'
                            } transition-colors`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-bold text-brand-charcoal/40 mb-3">
                      {t('reviews.commentLabel')}
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={t('reviews.commentPlaceholder')}
                      className="w-full bg-brand-cream/30 border-none rounded-2xl p-4 text-sm font-light min-h-[120px] focus:ring-1 focus:ring-brand-gold outline-none transition-all"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={rating === 0 || isSending}
                    className="w-full bg-brand-charcoal text-brand-cream py-4 rounded-xl font-bold tracking-widest uppercase text-xs flex items-center justify-center gap-2 hover:bg-brand-gold hover:text-brand-charcoal transition-all duration-500 disabled:opacity-30 disabled:cursor-not-allowed group"
                  >
                    {isSending ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        {t('reviews.submit')}
                        <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
