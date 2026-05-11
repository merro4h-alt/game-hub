import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CustomAlertProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  type?: 'error' | 'success' | 'info';
}

const CustomAlert: React.FC<CustomAlertProps> = ({ 
  isOpen, 
  onClose, 
  message, 
  type = 'error' 
}) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-charcoal/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl overflow-hidden p-8 text-center"
            dir={isArabic ? 'rtl' : 'ltr'}
          >
            <div className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center mb-6 ${
              type === 'error' ? 'bg-red-50 text-red-500' : 
              type === 'success' ? 'bg-green-50 text-green-500' : 
              'bg-brand-gold/10 text-brand-gold'
            }`}>
              {type === 'error' && <AlertCircle size={32} />}
              {type === 'success' && <CheckCircle2 size={32} />}
              {type === 'info' && <AlertCircle size={32} />}
            </div>

            <h3 className="text-lg font-bold text-brand-charcoal mb-3">
              {type === 'error' ? (isArabic ? 'تنبيه' : 'Alert') : 
               type === 'success' ? (isArabic ? 'نجاح' : 'Success') : 
               (isArabic ? 'معلومة' : 'Information')}
            </h3>

            <p className="text-brand-charcoal/60 text-sm leading-relaxed mb-8">
              {message}
            </p>

            <button
              onClick={onClose}
              className={`w-full py-4 rounded-2xl font-bold transition-all active:scale-95 ${
                type === 'error' ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 
                type === 'success' ? 'bg-green-500 text-white shadow-lg shadow-green-200' : 
                'bg-brand-charcoal text-white shadow-lg shadow-brand-charcoal/20'
              }`}
            >
              {isArabic ? 'حسناً' : 'Okay'}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CustomAlert;
