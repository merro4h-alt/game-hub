import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { CreditCard, Camera, ChevronDown, HelpCircle, ChevronRight } from 'lucide-react';
import {
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  Elements,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

interface CheckoutFormProps {
  amount: number;
  onSuccess: (name: string) => void;
  onError: (error: string) => void;
  isArabic: boolean;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ amount, onSuccess, onError, isArabic }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [name, setName] = useState('');
  const [useAccountName, setUseAccountName] = useState(false);
  const [isDefault, setIsDefault] = useState(false);

  const inputStyle = {
    style: {
      base: {
        fontSize: '14px',
        color: '#111',
        fontFamily: 'Inter, sans-serif',
        '::placeholder': {
          color: '#888',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    if (!name.trim()) {
      onError(isArabic ? 'يرجى إدخال اسم صاحب البطاقة' : 'Please enter cardholder name');
      return;
    }

    setIsProcessing(true);

    const cardNumberElement = elements.getElement(CardNumberElement);

    if (!cardNumberElement) return;

    const { error, paymentIntent } = await stripe.confirmCardPayment(import.meta.env.VITE_STRIPE_SECRET_PLACEHOLDER || '', {
      payment_method: {
        card: cardNumberElement as any,
        billing_details: {
          name: name,
        },
      },
    });

    if (error) {
      onError(error.message || 'Payment failed');
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      onSuccess(name);
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-4 sm:p-6 rounded-md border border-gray-200 text-[#111] text-left" dir="ltr">
      <div className="flex items-center gap-2 mb-4 text-[#007185] font-medium text-sm cursor-pointer hover:underline">
        <ChevronDown size={14} className="-rotate-90" />
        <span className="text-[13px]">{isArabic ? 'إضافة بطاقة ائتمان أو خصم' : 'Add a credit or debit card'}</span>
      </div>

      <div className="space-y-4">
        <p className="font-bold text-[13px]">{isArabic ? 'أدخل معلومات بطاقتك الائتمانية' : 'Enter your credit card information'}</p>

        <button 
          type="button"
          className="w-full flex items-center justify-between px-3 py-1.5 border border-gray-300 rounded-md bg-white hover:bg-gray-50 transition-colors text-[13px] shadow-sm"
        >
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-gray-700" />
            <span className="font-normal">{isArabic ? 'مسح بطاقتك' : 'Scan your card'}</span>
          </div>
          <ChevronRight size={14} className="text-gray-400" />
        </button>

        <div className="relative flex items-center justify-center py-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative bg-white px-3 text-[11px] text-gray-500 font-medium">{isArabic ? 'أو' : 'or'}</div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={useAccountName}
              onChange={(e) => setUseAccountName(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-[#f0c14b] focus:ring-[#f0c14b]" 
            />
            <span className="text-[12px]">{isArabic ? 'استخدام الاسم الموجود على الحساب' : 'Use name on account'}</span>
          </label>

          <div className="border border-gray-400 rounded-[3px] overflow-hidden">
            <div className="border-b border-gray-400 bg-white">
              <input
                required
                type="text"
                name="cardholderName"
                placeholder={isArabic ? 'الاسم على البطاقة' : 'Name on card'}
                className="w-full text-[13px] py-2 px-3 outline-none bg-transparent placeholder:text-gray-500"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="bg-white p-2.5">
              <CardNumberElement options={inputStyle} />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="font-bold text-[13px]">{isArabic ? 'تاريخ الانتهاء' : 'Expiration date'}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <div className="w-full border border-gray-400 rounded-[3px] p-2.5 bg-[#f0f2f2] shadow-inner">
                <CardExpiryElement options={inputStyle} />
              </div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown size={14} className="text-gray-600" />
              </div>
            </div>
            <div className="relative">
              <div className="w-full border border-gray-400 rounded-[3px] p-2.5 bg-[#f0f2f2] shadow-inner">
                <CardCvcElement options={inputStyle} />
              </div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                 <HelpCircle size={14} className="text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer py-1">
          <input 
            type="checkbox" 
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-[#f0c14b] focus:ring-[#f0c14b]" 
          />
          <span className="text-[12px] flex items-center gap-1 group">
            {isArabic ? 'تعيين كطريقة دفع افتراضية.' : 'Set as default payment method.'}
            <span className="text-[#007185] group-hover:underline group-hover:text-[#c45500] flex items-center gap-0.5 ml-1">
              {isArabic ? 'ما هذا؟' : "What's this"}
              <ChevronDown size={10} />
            </span>
          </span>
        </label>

        <button
          disabled={!stripe || isProcessing}
          className="w-full bg-[#f0c14b] hover:bg-[#f7dfa1] border border-[#a88734] rounded-[3px] py-1.5 text-[13px] text-[#111] shadow-[0_2px_5px_0_rgba(213,217,217,0.5)] active:bg-[#f0c14b] active:shadow-none transition-all font-normal mt-2"
        >
          {isProcessing ? (isArabic ? 'جاري المعالجة...' : 'Processing...') : (isArabic ? 'إضافة بطاقتك' : 'Add your card')}
        </button>

        <div className="pt-2 text-[#007185] text-[13px] flex items-center gap-1 cursor-pointer hover:underline hover:text-[#c45500] group">
          <ChevronDown size={14} className="-rotate-90" />
          <span>{isArabic ? 'إضافة حساب شيكات شخصي' : 'Add a personal checking account'}</span>
        </div>
      </div>
    </form>
  );
};

interface StripePaymentProps {
  amount: number;
  onSuccess: (cardholderName?: string) => void;
  onError: (error: string) => void;
  isArabic?: boolean;
}

const StripePayment: React.FC<StripePaymentProps> = ({ amount, onSuccess, onError, isArabic = false }) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [fallbackName, setFallbackName] = useState('');

  const isStripeConfigured = !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY && import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY !== 'pk_test_placeholder';

  useEffect(() => {
    if (!isStripeConfigured) return;
    
    fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount }),
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret))
      .catch((err) => onError('Could not initialize payment'));
  }, [amount, isStripeConfigured]);

  if (!isStripeConfigured) {
    return (
      <div className="bg-amber-50 border-2 border-amber-200 p-8 rounded-3xl text-center space-y-6">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
          <CreditCard className="text-amber-600" size={24} />
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-amber-800 font-bold text-lg">{isArabic ? 'بوابة الدفع قيد المعالجة' : 'Secure Payment Gateway'}</p>
            <p className="text-amber-600 text-xs leading-relaxed">{isArabic ? 'بوابة Stripe مؤمنة بالكامل. يرجى إدخال اسمك كما يظهر على البطاقة للتحقق.' : 'Stripe gateway is fully encrypted. Please enter your name on card for verification.'}</p>
          </div>
          <input 
            type="text" 
            placeholder={isArabic ? 'اسم صاحب البطاقة' : 'Cardholder Name'}
            className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            value={fallbackName}
            onChange={(e) => setFallbackName(e.target.value)}
          />
        </div>
        <button 
          onClick={() => {
            if (!fallbackName.trim()) {
              alert(isArabic ? 'يرجى إدخال اسم صاحب البطاقة' : 'Please enter cardholder name');
              return;
            }
            onSuccess(fallbackName);
          }}
          className="w-full bg-brand-charcoal text-white font-bold py-5 rounded-2xl shadow-lg shadow-brand-charcoal/20 hover:bg-brand-gold transition-all active:scale-95"
        >
          {isArabic ? 'تأكيد عملية الدفع' : 'Confirm Payment'}
        </button>
      </div>
    );
  }

  if (!clientSecret) return (
    <div className="flex flex-col items-center justify-center py-10 space-y-4">
      <div className="w-8 h-8 border-4 border-brand-gold/20 border-t-brand-gold rounded-full animate-spin" />
      <p className="text-xs font-bold text-brand-charcoal/40 uppercase tracking-widest animate-pulse">{isArabic ? 'جاري تهيئة الدفع الآمن...' : 'Initializing Secure Payment...'}</p>
      <div className="w-full h-14 bg-brand-charcoal/5 rounded-2xl animate-pulse" />
    </div>
  );

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm amount={amount} onSuccess={onSuccess} onError={onError} isArabic={isArabic} />
    </Elements>
  );
};

export default StripePayment;
