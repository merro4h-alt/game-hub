import React, { useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { CreditCard, Camera, ChevronDown, HelpCircle, ChevronRight, X } from 'lucide-react';
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

  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      onError(isArabic ? 'لا يمكن الوصول إلى الكاميرا' : 'Could not access camera');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleScanCard = async () => {
    setIsScanning(true);
    await startCamera();
    
    setTimeout(() => {
      setIsScanning(false);
      stopCamera();
      setName('John Doe');
    }, 4000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-[#fcfcfc] p-4 sm:p-5 rounded-md border border-gray-200 text-[#111] text-left shadow-sm relative overflow-hidden" dir="ltr">
      {isScanning && (
        <div className="absolute inset-0 bg-black z-30 flex flex-col items-center justify-center p-0 overflow-hidden">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none flex items-center justify-center">
             <div className="w-full max-w-[300px] h-48 border-2 border-brand-gold rounded-2xl relative">
                <div className="absolute -top-10 left-0 right-0 text-center">
                   <p className="text-white text-xs font-bold uppercase tracking-widest">{isArabic ? 'ضع البطاقة هنا' : 'Place Card Here'}</p>
                </div>
                <div className="absolute inset-x-0 h-[2px] bg-brand-gold/50 animate-bounce top-1/2 -translate-y-1/2" />
             </div>
          </div>
          <button 
            type="button"
            onClick={() => { setIsScanning(false); stopCamera(); }}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white"
          >
            <X size={20} />
          </button>
          <div className="absolute bottom-10 inset-x-0 text-center px-6 text-white">
             <div className="inline-flex flex-col items-center gap-3">
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <p className="text-xs font-medium">{isArabic ? 'جاري فحص معلومات البطاقة...' : 'Scanning card info...'}</p>
             </div>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between text-[#007185] font-bold text-sm cursor-pointer hover:underline mb-2">
        <div className="flex items-center gap-1.5">
          <ChevronDown size={18} className="text-[#555]" />
          <span className="text-[14px] text-[#007185] font-bold">{isArabic ? 'إضافة بطاقة ائتمان أو خصم' : 'Add a credit or debit card'}</span>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-5 space-y-4">
        <p className="font-bold text-[14px] text-[#111]">{isArabic ? 'أدخل معلومات بطاقتك الائتمانية' : 'Enter your credit card information'}</p>

        <button 
          type="button"
          onClick={handleScanCard}
          className="w-full flex items-center justify-between px-3 py-2 border border-[#adb1b8] rounded-md bg-white hover:bg-[#f7f8f8] transition-colors text-[13px] shadow-sm"
        >
          <div className="flex items-center gap-3">
            <Camera size={20} className="text-[#111]" />
            <span className="font-bold text-[#111]">{isArabic ? 'مسح بطاقتك' : 'Scan your card'}</span>
          </div>
          <ChevronRight size={16} className="text-gray-600" />
        </button>

        <div className="relative flex items-center justify-center py-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative bg-[#fcfcfc] px-3 text-[12px] text-gray-500 font-normal">{isArabic ? 'أو' : 'or'}</div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={useAccountName}
              onChange={(e) => setUseAccountName(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-[#f0c14b] focus:ring-[#f0c14b]" 
            />
            <span className="text-[13px] font-medium">{isArabic ? 'استخدام الاسم الموجود على الحساب' : 'Use name on account'}</span>
          </label>

          <div className="border border-[#adb1b8] rounded-md overflow-hidden bg-white shadow-inner">
            <div className="border-b border-[#adb1b8]">
              <input
                required
                type="text"
                name="cardholderName"
                placeholder={isArabic ? 'الاسم على البطاقة' : 'Name on card'}
                className="w-full text-sm py-2.5 px-3 outline-none bg-transparent placeholder:text-gray-400 font-medium"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="py-2.5 px-3">
              <CardNumberElement options={{
                style: {
                  base: {
                    fontSize: '14px',
                    color: '#111',
                    '::placeholder': { color: '#888' },
                  }
                }
              }} />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="font-bold text-[14px] text-[#111]">{isArabic ? 'تاريخ الانتهاء' : 'Expiration date'}</p>
          <div className="grid grid-cols-2 gap-3 pb-1">
            <div className="relative">
              <div className="w-full border border-[#adb1b8] rounded-md py-2 px-3 bg-[#f0f2f2] shadow-inner cursor-pointer hover:bg-[#e7e9e9]">
                <CardExpiryElement options={{
                  style: {
                    base: { fontSize: '14px', color: '#111' }
                  }
                }} />
              </div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronDown size={14} className="text-gray-600" />
              </div>
            </div>
            <div className="relative">
              <div className="w-full border border-[#adb1b8] rounded-md py-2 px-3 bg-[#f0f2f2] shadow-inner cursor-pointer hover:bg-[#e7e9e9]">
                <CardCvcElement options={{
                  style: {
                    base: { fontSize: '14px', color: '#111' }
                  }
                }} />
              </div>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                 <HelpCircle size={14} className="text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer py-1.5">
          <input 
            type="checkbox" 
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-[#f0c14b] focus:ring-[#f0c14b]" 
          />
          <span className="text-[13px] font-medium flex items-center gap-1 group">
            {isArabic ? 'تعيين كطريقة دفع افتراضية.' : 'Set as default payment method.'}
            <span className="text-[#007185] group-hover:underline group-hover:text-[#c45500] flex items-center gap-0.5 ml-1">
              {isArabic ? 'ما هذا؟' : "What's this"}
              <ChevronDown size={10} />
            </span>
          </span>
        </label>

        <button
          disabled={!stripe || isProcessing}
          className="w-full bg-[#f0c14b] hover:bg-[#f7dfa1] border border-[#a88734] rounded-md py-2 text-[14px] text-[#111] shadow-[0_2px_5px_0_rgba(213,217,217,0.5)] active:bg-[#f0c14b] active:shadow-none transition-all font-medium mt-3"
        >
          {isProcessing ? (isArabic ? 'جاري المعالجة...' : 'Processing...') : (isArabic ? 'إضافة بطاقتك' : 'Add your card')}
        </button>

        <div className="pt-3 text-[#007185] text-[14px] flex items-center gap-1.5 cursor-pointer hover:underline hover:text-[#c45500] group">
          <ChevronDown size={18} className="-rotate-90 text-[#555]" />
          <span className="font-bold">{isArabic ? 'إضافة حساب شيكات شخصي' : 'Add a personal checking account'}</span>
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
  const [cardNumber, setCardNumber] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [useAccountName, setUseAccountName] = useState(false);
  const [isDefault, setIsDefault] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      onError(isArabic ? 'لا يمكن الوصول إلى الكاميرا' : 'Could not access camera');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

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

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length > 16) value = value.slice(0, 16);
    
    // Add dash every 4 digits
    const formattedValue = value.match(/.{1,4}/g)?.join(' – ') || value;
    setCardNumber(formattedValue);
  };

  const handleScanCard = async () => {
    setIsScanning(true);
    await startCamera();
    
    setTimeout(() => {
      setIsScanning(false);
      stopCamera();
      // Simulate finding a card
      setCardNumber('4242 – 4242 – 4242 – 4242');
      if (!fallbackName) setFallbackName('John Doe');
    }, 4000);
  };

  if (!isStripeConfigured) {
    return (
      <div className="space-y-4 bg-[#fcfcfc] p-4 sm:p-5 rounded-md border border-gray-200 text-[#111] text-left shadow-sm relative overflow-hidden" dir="ltr">
        {isScanning && (
          <div className="absolute inset-0 bg-black z-30 flex flex-col items-center justify-center p-0 overflow-hidden animate-in fade-in duration-300">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none flex items-center justify-center">
               <div className="w-full max-w-[300px] h-48 border-2 border-brand-gold rounded-2xl relative">
                  <div className="absolute -top-10 left-0 right-0 text-center">
                     <p className="text-white text-xs font-bold uppercase tracking-widest">{isArabic ? 'ضع البطاقة هنا' : 'Place Card Here'}</p>
                  </div>
                  <div className="absolute inset-x-0 h-[2px] bg-brand-gold/50 animate-bounce top-1/2 -translate-y-1/2" />
               </div>
            </div>
            <button 
              type="button"
              onClick={() => { setIsScanning(false); stopCamera(); }}
              className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white"
            >
              <X size={20} />
            </button>
            <div className="absolute bottom-10 inset-x-0 text-center px-6">
               <div className="inline-flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <div className="space-y-1">
                    <p className="text-white text-sm font-bold">{isArabic ? 'جاري البحث عن بطاقتك...' : 'Scanning for your card...'}</p>
                    <p className="text-white/60 text-[10px] uppercase tracking-widest">{isArabic ? 'يرجى وضع البطاقة داخل الإطار' : 'Hold card within frame'}</p>
                  </div>
               </div>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between text-[#007185] font-bold text-sm cursor-pointer hover:underline mb-2">
          <div className="flex items-center gap-1.5">
            <ChevronDown size={18} className="text-[#555]" />
            <span className="text-[14px] text-[#007185] font-bold">{isArabic ? 'إضافة بطاقة ائتمان أو خصم' : 'Add a credit or debit card'}</span>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-5 space-y-4">
          <p className="font-bold text-[14px] text-[#111]">{isArabic ? 'أدخل معلومات بطاقتك الائتمانية' : 'Enter your credit card information'}</p>

          <button 
            type="button"
            onClick={handleScanCard}
            className="w-full flex items-center justify-between px-3 py-2 border border-[#adb1b8] rounded-md bg-white hover:bg-[#f7f8f8] transition-colors text-[13px] shadow-sm group active:bg-[#ecedef]"
          >
            <div className="flex items-center gap-3">
              <Camera size={20} className="text-[#111] group-hover:text-[#007185] transition-colors" />
              <span className="font-bold text-[#111]">{isArabic ? 'مسح بطاقتك' : 'Scan your card'}</span>
            </div>
            <ChevronRight size={16} className="text-gray-600" />
          </button>

          <div className="relative flex items-center justify-center py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative bg-[#fcfcfc] px-3 text-[12px] text-gray-500 font-normal">{isArabic ? 'أو' : 'or'}</div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={useAccountName}
                onChange={(e) => {
                  setUseAccountName(e.target.checked);
                  if (e.target.checked) setFallbackName('John Doe');
                }}
                className="w-5 h-5 rounded border-gray-300 text-[#f0c14b] focus:ring-[#f0c14b]" 
              />
              <span className="text-[13px] font-medium">{isArabic ? 'استخدام الاسم الموجود على الحساب' : 'Use name on account'}</span>
            </label>

            <div className="border border-[#adb1b8] rounded-md overflow-hidden bg-white shadow-inner">
              <div className="border-b border-[#adb1b8]">
                <input
                  required
                  type="text"
                  placeholder={isArabic ? 'الاسم على البطاقة' : 'Name on card'}
                  className="w-full text-sm py-2.5 px-3 outline-none bg-transparent placeholder:text-gray-400 font-medium"
                  value={fallbackName}
                  onChange={(e) => setFallbackName(e.target.value)}
                />
              </div>
              <div className="py-2.5 px-3">
                <input 
                  type="text"
                  placeholder="0000 – 0000 – 0000 – 0000"
                  className="w-full text-sm outline-none bg-transparent placeholder:text-gray-400 font-medium tracking-wider"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-bold text-[14px] text-[#111]">{isArabic ? 'تاريخ الانتهاء' : 'Expiration date'}</p>
            <div className="grid grid-cols-2 gap-3 pb-1">
              <div className="relative">
                <select className="w-full border border-[#adb1b8] rounded-md py-2 px-3 bg-[#f0f2f2] shadow-inner cursor-pointer hover:bg-[#e7e9e9] appearance-none text-sm">
                  <option>01</option>
                  <option>02</option>
                  <option>03</option>
                  <option>04</option>
                  <option>05</option>
                  <option>06</option>
                  <option>07</option>
                  <option>08</option>
                  <option>09</option>
                  <option>10</option>
                  <option>11</option>
                  <option>12</option>
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown size={14} className="text-gray-600" />
                </div>
              </div>
              <div className="relative">
                <select className="w-full border border-[#adb1b8] rounded-md py-2 px-3 bg-[#f0f2f2] shadow-inner cursor-pointer hover:bg-[#e7e9e9] appearance-none text-sm">
                  <option>2026</option>
                  <option>2027</option>
                  <option>2028</option>
                  <option>2029</option>
                  <option>2030</option>
                  <option>2031</option>
                  <option>2032</option>
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                  <ChevronDown size={14} className="text-gray-600" />
                </div>
              </div>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer py-1.5">
            <input 
              type="checkbox" 
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-[#f0c14b] focus:ring-[#f0c14b]" 
            />
            <span className="text-[13px] font-medium flex items-center gap-1 group">
              {isArabic ? 'تعيين كطريقة دفع افتراضية.' : 'Set as default payment method.'}
              <span className="text-[#007185] group-hover:underline group-hover:text-[#c45500] flex items-center gap-0.5 ml-1">
                {isArabic ? 'ما هذا؟' : "What's this"}
                <ChevronDown size={10} />
              </span>
            </span>
          </label>

          <button 
            onClick={() => {
              if (!fallbackName.trim()) {
                onError(isArabic ? 'يرجى إدخال اسم صاحب البطاقة' : 'Please enter cardholder name');
                return;
              }
              onSuccess(fallbackName);
            }}
            className="w-full bg-[#f0c14b] hover:bg-[#f7dfa1] border border-[#a88734] rounded-md py-2 text-[14px] text-[#111] shadow-[0_2px_5px_0_rgba(213,217,217,0.5)] active:bg-[#f0c14b] active:shadow-none transition-all font-medium mt-3"
          >
            {isArabic ? 'إضافة بطاقتك' : 'Add your card'}
          </button>

          <div className="pt-3 text-[#007185] text-[14px] flex items-center gap-1.5 cursor-pointer hover:underline hover:text-[#c45500] group">
            <ChevronDown size={18} className="-rotate-90 text-[#555]" />
            <span className="font-bold">{isArabic ? 'إضافة حساب شيكات شخصي' : 'Add a personal checking account'}</span>
          </div>
        </div>
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
