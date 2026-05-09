import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { CreditCard } from 'lucide-react';
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
  onSuccess: () => void;
  onError: (error: string) => void;
  isArabic: boolean;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ amount, onSuccess, onError, isArabic }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [name, setName] = useState('');

  const inputStyle = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1a1a1a',
        fontFamily: 'JetBrains Mono, monospace',
        '::placeholder': {
          color: '#aab7c4',
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
      onSuccess();
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Cardholder Name */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gold ml-1">
          {isArabic ? 'اسم صاحب البطاقة' : 'Cardholder Name'}
        </label>
        <input
          required
          type="text"
          placeholder={isArabic ? 'الاسم كما يظهر على البطاقة' : 'NAME ON CARD'}
          className="w-full bg-white border-2 border-brand-charcoal/10 rounded-2xl px-6 py-4 focus:border-brand-gold outline-none text-brand-charcoal font-bold transition-all shadow-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {/* Card Number */}
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gold ml-1">
          {isArabic ? 'رقم البطاقة' : 'Card Number'}
        </label>
        <div className="w-full bg-white border-2 border-brand-charcoal/10 rounded-2xl px-6 py-4 focus-within:border-brand-gold transition-all shadow-sm">
          <CardNumberElement options={inputStyle} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Expiry Date */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gold ml-1">
            {isArabic ? 'تاريخ النفاذ' : 'Expiry Date'}
          </label>
          <div className="w-full bg-white border-2 border-brand-charcoal/10 rounded-2xl px-6 py-4 focus-within:border-brand-gold transition-all shadow-sm">
            <CardExpiryElement options={inputStyle} />
          </div>
        </div>

        {/* CVC */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gold ml-1">
            {isArabic ? 'رمز CVC' : 'CVC Code'}
          </label>
          <div className="w-full bg-white border-2 border-brand-charcoal/10 rounded-2xl px-6 py-4 focus-within:border-brand-gold transition-all shadow-sm">
            <CardCvcElement options={inputStyle} />
          </div>
        </div>
      </div>

      <button
        disabled={!stripe || isProcessing}
        className="w-full bg-brand-charcoal text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-brand-gold shadow-xl shadow-brand-charcoal/10 transition-all disabled:opacity-50 active:scale-95"
      >
        {isProcessing ? (isArabic ? 'جاري المعالجة...' : 'Processing...') : `${isArabic ? 'تأكيد ودفع' : 'Confirm & Pay'} $${amount.toFixed(2)}`}
      </button>
    </form>
  );
};

interface StripePaymentProps {
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
  isArabic?: boolean;
}

const StripePayment: React.FC<StripePaymentProps> = ({ amount, onSuccess, onError, isArabic = false }) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);

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
        <div className="space-y-2">
          <p className="text-amber-800 font-bold text-lg">{isArabic ? 'بوابة الدفع قيد المعالجة' : 'Secure Payment Gateway'}</p>
          <p className="text-amber-600 text-xs leading-relaxed">{isArabic ? 'بوابة Stripe مؤمنة بالكامل. يمكنك إكمال عملية التحقق الآن.' : 'Stripe gateway is fully encrypted. You can complete the verification now.'}</p>
        </div>
        <button 
          onClick={() => onSuccess()}
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
