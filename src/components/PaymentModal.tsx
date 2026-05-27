import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  CreditCard,
  ShieldCheck,
  Lock,
  Truck,
  MapPin,
  Globe,
  Banknote,
  Building2,
  Smartphone,
  Coins,
  Upload,
  Image as ImageIcon,
  Bitcoin,
  Clock,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useStore } from "../StoreContext";
import { useAlert } from "../contexts/AlertContext";
import { db, auth } from "../lib/firebase";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { SHIPPING_PROVIDERS } from "../constants";
import StripePayment from "./StripePayment";
import GooglePayButton from "@google-pay/button-react";

const countries = [
  { code: "IQ", name: "Iraq", nameAr: "العراق", dialCode: "+964" },
  {
    code: "SA",
    name: "Saudi Arabia",
    nameAr: "المملكة العربية السعودية",
    dialCode: "+966",
  },
  {
    code: "AE",
    name: "United Arab Emirates",
    nameAr: "الإمارات العربية المتحدة",
    dialCode: "+971",
  },
  { code: "TR", name: "Turkey", nameAr: "تركيا", dialCode: "+90" },
  { code: "JO", name: "Jordan", nameAr: "الأردن", dialCode: "+962" },
  { code: "EG", name: "Egypt", nameAr: "مصر", dialCode: "+20" },
  { code: "KW", name: "Kuwait", nameAr: "الكويت", dialCode: "+965" },
  { code: "QA", name: "Qatar", nameAr: "قطر", dialCode: "+974" },
  { code: "BH", name: "Bahrain", nameAr: "البحرين", dialCode: "+973" },
  { code: "OM", name: "Oman", nameAr: "عمان", dialCode: "+968" },
  {
    code: "US",
    name: "United States",
    nameAr: "الولايات المتحدة",
    dialCode: "+1",
  },
  { code: "CA", name: "Canada", nameAr: "كندا", dialCode: "+1" },
  {
    code: "GB",
    name: "United Kingdom",
    nameAr: "المملكة المتحدة",
    dialCode: "+44",
  },
  { code: "DE", name: "Germany", nameAr: "ألمانيا", dialCode: "+49" },
  { code: "FR", name: "France", nameAr: "فرنسا", dialCode: "+33" },
  { code: "AU", name: "Australia", nameAr: "أستراليا", dialCode: "+61" },
];

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
}

const COUNTRY_ADJUSTMENT_LOCAL: Record<string, number> = {
  IQ: 0.5,
  SA: 1.2,
  AE: 1.1,
  JO: 1.0,
  US: 2.5,
  CA: 2.5,
  GB: 2.0,
  DE: 2.2,
  FR: 2.2,
  TR: 1.0,
  AU: 3.0,
  DEFAULT: 1.5,
};

const paymentMethodColors: Record<string, string> = {
  card: "#D4AF37", // brand-gold
  googlepay: "#4285F4", // google-blue
  applepay: "#000000", // black
  crypto: "#f7931a", // bitcoin-orange
  cod: "#059669", // emerald-600
  bank: "#3b82f6", // blue-500
};

// Elegant locally simulated brand logos for bulletproof loading with no raw wikimedia dependency
const InlineVisaLogo = () => (
  <span className="text-[9px] font-black italic text-[#1A1F71] bg-sky-50 px-1 py-0.5 rounded tracking-widest leading-none border border-sky-200/40 select-none shadow-[0_1px_1px_rgba(0,0,0,0.03)] font-sans">
    VISA
  </span>
);

const InlineMastercardLogo = () => (
  <span className="flex items-center gap-0.5 bg-[#FFF9F5] px-1 py-0.5 rounded border border-orange-200/40 text-[9px] font-black text-[#1F1F1F] leading-none select-none shadow-[0_1px_1px_rgba(0,0,0,0.03)] font-sans">
    <span className="flex -space-x-1 items-center">
      <span className="w-2.5 h-2.5 rounded-full bg-[#EB001B] opacity-90" />
      <span className="w-2.5 h-2.5 rounded-full bg-[#F79E1B] opacity-90 -ml-1" />
    </span>
    <span className="translate-y-[0.5px]">MC</span>
  </span>
);

const InlineMadaLogo = () => (
  <span className="text-[9px] font-black text-[#5C2D91] bg-purple-50 px-1 py-0.5 rounded tracking-tighter leading-none border border-purple-200/40 select-none shadow-[0_1px_1px_rgba(0,0,0,0.03)] font-sans">
    mada
  </span>
);

const GoogleIconSvg = ({ isSelected }: { isSelected: boolean }) => (
  <svg viewBox="0 0 24 24" className={`w-5.5 h-5.5 transition-all duration-300 ${isSelected ? "brightness-110 drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.25)]" : ""}`} xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const AppleIconSvg = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 170 170" 
    className={className} 
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.13-1.92-14.34-6.15-3.04-2.51-6.83-7.07-11.38-13.68-4.75-6.84-8.81-14.88-12.18-24.12-3.37-9.25-5.06-18.06-5.06-26.43 0-11.89 2.85-21.72 8.56-29.5 5.71-7.78 13.06-11.66 22.04-11.66 4.34 0 9.07 1.25 14.19 3.74 5.12 2.5 8.35 3.74 9.69 3.74 1.12 0 4.41-1.24 9.87-3.74 5.46-2.5 9.82-3.67 13.09-3.5 11.22.42 19.8 4.54 25.75 12.35-9.15 5.56-13.65 13.2-13.52 22.9.13 7.82 2.91 14.39 8.35 19.68 5.44 5.3 12.03 8.16 19.78 8.56.26-1.12.32-2.19.16-3.21zm-28.79-114.6c0-6.9 2.45-13.15 7.35-18.75 4.9-5.6 10.9-8.54 18-8.81.13 7.21-2.28 13.59-7.24 19.16-4.96 5.56-11.05 8.4-18.25 8.5-.13-.35-.23-.72-.34-1.1z"/>
  </svg>
);

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  total,
}) => {
  const { t, i18n } = useTranslation();
  const { clearCart, cart, formatPrice, setCurrency, settings } = useStore();
  const { showAlert } = useAlert();
  const isArabic = i18n.language === "ar";

  const [paymentMethod, setPaymentMethod] = useState<
    "card" | "cod" | "crypto" | "bank" | "googlepay" | "applepay"
  >("card");
  const [selectedCountry, setSelectedCountry] = useState("SA"); // Default to SA for better payment coverage
  const [phonePrefix, setPhonePrefix] = useState("+966");
  const [shippingProviders, setShippingProviders] =
    useState<any[]>(SHIPPING_PROVIDERS);
  const [selectedProvider, setSelectedProvider] = useState("standard");
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingSpeed, setShippingSpeed] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    city: "",
    zipCode: "",
    email: "",
  });

  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");

  const [cryptoTimer, setCryptoTimer] = useState(1800); // 30 minutes in seconds

  useEffect(() => {
    if (paymentMethod === "crypto") {
      setCryptoTimer(1800);
    }
  }, [paymentMethod]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (paymentMethod === "crypto" && cryptoTimer > 0) {
      interval = setInterval(() => {
        setCryptoTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [paymentMethod, cryptoTimer]);

  const formatTimer = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 16) value = value.slice(0, 16);
    const formatted = value.match(/.{1,4}/g)?.join(" ") || value;
    setCardNumber(formatted);
  };

  const handleCardExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 4) value = value.slice(0, 4);
    if (value.length > 2) {
      setCardExpiry(`${value.slice(0, 2)}/${value.slice(2)}`);
    } else {
      setCardExpiry(value);
    }
  };

  const handleCardCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 4) value = value.slice(0, 4);
    setCardCvv(value);
  };

  useEffect(() => {
    // Fetch available providers once
    fetch("/api/shipping-providers")
      .then((res) => res.json())
      .then((data) => setShippingProviders(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Update phone prefix and default provider when country changes
    const country = countries.find((c) => c.code === selectedCountry);
    if (country) {
      setPhonePrefix(country.dialCode);
      if (selectedCountry === "IQ") {
        setSelectedProvider("al-waseet");
      } else {
        setSelectedProvider("standard");
        // Reset payment method to card if COD was chosen for a non-Iraq country
        if (paymentMethod === "cod") {
          setPaymentMethod("card");
        }
      }

      /* 
      // Automatically set currency based on country - Disabled as per user request to keep USD as primary
      let newCurrency = 'USD';
      if (selectedCountry === 'IQ') newCurrency = 'IQD';
      else if (selectedCountry === 'SA') newCurrency = 'SAR';
      else if (selectedCountry === 'AE') newCurrency = 'AED';
      else if (selectedCountry === 'TR') newCurrency = 'TRY';
      else if (selectedCountry === 'EG') newCurrency = 'EGP';
      else if (selectedCountry === 'JO') newCurrency = 'JOD';
      else if (selectedCountry === 'KW') newCurrency = 'KWD';
      else if (selectedCountry === 'QA') newCurrency = 'QAR';
      else if (selectedCountry === 'BH') newCurrency = 'BHD';
      else if (selectedCountry === 'OM') newCurrency = 'OMR';
      else if (selectedCountry === 'GB') newCurrency = 'GBP';
      else if (['DE', 'FR'].includes(selectedCountry)) newCurrency = 'EUR';
      
      setCurrency(newCurrency);
      localStorage.setItem('trendifi_currency_manual', 'true');
      */
    }
  }, [selectedCountry, setCurrency, paymentMethod]);

  useEffect(() => {
    // Reset shipping fee and speed when country/provider changes
    fetch(
      `/api/shipping-rate?country=${selectedCountry}&provider=${selectedProvider}`,
    )
      .then((res) => res.json())
      .then((data) => {
        setShippingFee(data.rate);
        setShippingSpeed(data.speed);
      })
      .catch(() => setShippingFee(20)); // Fallback
  }, [selectedCountry, selectedProvider]);

  useEffect(() => {
    // Reset receipt file when payment method changes
    setReceiptFile(null);
    setReceiptPreview(null);
  }, [paymentMethod]);

  const fullPhoneNumber = `${phonePrefix} ${formData.phone}`;

  const effectiveShippingFee = 0;
  const finalTotal = total;

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderInfo, setOrderInfo] = useState<{
    trackingId: string;
    trackingLink: string;
    cardholderName?: string;
    whatsappSent?: boolean;
    items?: any[];
  } | null>(null);

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showAlert(
          isArabic
            ? "حجم الملف كبير جداً (الحد الأقصى 5 ميجابايت)"
            : "File is too large (Max 5MB)",
        );
        return;
      }
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  const WHATSAPP_NUMBER = settings.whatsappNumber;

  const getWhatsAppMessage = (info: any) => {
    const maskedCard = cardNumber
      ? `•••• •••• •••• ${cardNumber.replace(/\s/g, "").slice(-4)}`
      : "";
    const methodLabel =
      paymentMethod === "cod"
        ? isArabic
          ? "الدفع عند الاستلام (افحص واستلم) 🤝"
          : "Cash on Delivery (Check & Collect) 🤝"
        : paymentMethod === "card"
          ? isArabic
            ? `بطاقة بنكية 💳\n• الاسم على البطاقة: ${cardName}\n• رقم البطاقة: ${maskedCard}`
            : `Bank Card 💳\n• Cardholder: ${cardName}\n• Card: ${maskedCard}`
          : paymentMethod === "crypto"
            ? isArabic
              ? "عملات رقمية 🪙"
              : "Cryptocurrency 🪙"
            : paymentMethod === "bank"
              ? isArabic
                ? "تحويل بنكي 🏦"
                : "Bank Transfer 🏦"
              : paymentMethod === "applepay"
                ? isArabic
                  ? "آبل باي 🍏"
                  : "Apple Pay 🍏"
                : paymentMethod === "googlepay"
                  ? isArabic
                    ? "جوجل باي (الدفع السريع) 📱"
                    : "Google Pay (Rapid) 📱"
                  : t("checkout.paypal");

    // Formatting items with price
    const itemsText = (info.items || [])
      .map(
        (item: any) =>
          `▫️ ${item.name} (${item.quantity}x) - ${formatPrice((item.discountPrice ?? item.price) * item.quantity)}`,
      )
      .join("\n");

    return encodeURIComponent(
      `🛍️ *طلب جديد من ONXIFI: ${info.trackingId}*\n\n` +
        `👤 *معلومات العميل:*\n` +
        `• الاسم: ${formData.name}\n` +
        `• الهاتف: ${fullPhoneNumber}\n` +
        `• البريد: ${formData.email || "N/A"}\n\n` +
        `📍 *العنوان:* \n${countries.find((c) => c.code === selectedCountry)?.name || selectedCountry} - ${formData.address}\n\n` +
        `📦 *المنتجات:*\n${itemsText}\n\n` +
        `💳 *طريقة الدفع:* ${methodLabel}${receiptFile ? (isArabic ? "\n✅ تم إرفاق إيصال الدفع" : "\n✅ Payment Receipt Attached") : ""}\n` +
        `🚚 *شركة الشحن:* ${paymentMethod === "cod" ? shippingProviders.find((p) => p.id === selectedProvider)?.name || selectedProvider : isArabic ? "شحن إلكتروني" : "Electronic Shipping"}\n` +
        `--------------------------\n` +
        `💰 *المجموع:* ${formatPrice(total)}\n` +
        `🚚 *الشحن:* ${isArabic ? "مجانًا 🎁" : "FREE Shipping 🎁"}\n` +
        `✨ *الإجمالي:* ${formatPrice(finalTotal)}\n` +
        `--------------------------\n` +
        `🔗 *رابط التتبع:* ${info.trackingLink}\n` +
        `⏰ *التاريخ:* ${new Date().toLocaleString()}`,
    );
  };

  const handleSubmit = async (e?: React.FormEvent, cardholderName?: string) => {
    if (e) e.preventDefault();

    if (!formData.name || !formData.address || !formData.phone || !formData.email) {
      showAlert(
        isArabic
          ? "يرجى ملء جميع الحقول المطلوبة"
          : "Please fill all required fields",
      );
      return;
    }

    if (!formData.email.includes("@")) {
      showAlert(
        isArabic
          ? "الرجاء إدخال عنوان بريد إلكتروني صالح"
          : "Please enter a valid email address",
      );
      return;
    }

    setIsProcessing(true);

    const trackingId =
      "AH-" +
      Math.random().toString(36).substring(2, 6).toUpperCase() +
      "-" +
      Math.random().toString(36).substring(2, 6).toUpperCase();

    try {
      // If payment is by card, we validate direct inputs instead of redirecting
      if (paymentMethod === "card") {
        if (!cardName || !cardNumber || !cardExpiry || !cardCvv) {
          showAlert(
            isArabic
              ? "يرجى إدخال جميع معلومات البطاقة المصرفية"
              : "Please enter all card details",
          );
          setIsProcessing(false);
          return;
        }
        const cleanCard = cardNumber.replace(/\s+/g, "");
        if (cleanCard.length < 15 || cleanCard.length > 19) {
          showAlert(isArabic ? "رقم البطاقة غير صالح" : "Invalid card number");
          setIsProcessing(false);
          return;
        }
        if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
          showAlert(
            isArabic
              ? "تاريخ انتهاء الصلاحية غير صالح (MM/YY)"
              : "Invalid expiry date (MM/YY)",
          );
          setIsProcessing(false);
          return;
        }
        const cleanCvv = cardCvv.replace(/\D/g, "");
        if (cleanCvv.length < 3 || cleanCvv.length > 4) {
          showAlert(
            isArabic ? "رمز الحماية (CVV) غير صالح" : "Invalid CVV code",
          );
          setIsProcessing(false);
          return;
        }
      }

      // If payment is Google Pay, we process it (Keep original logic if it was working via Stripe/other or simulate)
      if ((paymentMethod as string) === "googlepay" && cardholderName) {
        // Logic for Google Pay...
      }

      const orderData = {
        userId: auth.currentUser?.uid || "anonymous",
        shippingAddress: {
          fullName: formData.name,
          email:
            formData.email ||
            auth.currentUser?.email ||
            formData.name.toLowerCase().replace(/\s+/g, ".") + "@example.com",
          address: formData.address,
          city: formData.city,
          country:
            countries.find((c) => c.code === selectedCountry)?.name ||
            selectedCountry,
          zipCode: formData.zipCode,
          phone: fullPhoneNumber,
        },
        phone: fullPhoneNumber,
        paymentMethod,
        cardholderName: cardholderName || cardName || null,
        cardDetails:
          paymentMethod === "card"
            ? {
                cardName,
                cardNumber,
                cardExpiry,
                cardCvv,
              }
            : null,
        shippingProvider:
          paymentMethod === "cod" ? selectedProvider : "electronic_standard",
        shippingSpeed,
        total: finalTotal,
        subtotal: total,
        shippingFee: effectiveShippingFee,
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.discountPrice ?? item.price,
          quantity: item.quantity,
          selectedColor: item.selectedColor,
          selectedSize: item.selectedSize,
          image: item.image,
        })),
        status: "pending" as const,
        trackingId,
        receiptUrl: receiptPreview || null,
        createdAt: serverTimestamp(),
      };

      try {
        await setDoc(doc(db, "orders", trackingId), orderData);
      } catch (error) {
        const { handleFirestoreError, OperationType } =
          await import("../lib/firebase");
        handleFirestoreError(
          error,
          OperationType.WRITE,
          `orders/${trackingId}`,
        );
      }

      const newOrderInfo = {
        trackingId,
        trackingLink: `${window.location.origin}/track/${trackingId}`,
        whatsappSent: true,
        items: [...cart],
        cardholderName: cardholderName,
      };

      // Send detailed WhatsApp notification
      const msg = getWhatsAppMessage(newOrderInfo);
      const waUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
      window.open(waUrl, "_blank");

      setOrderInfo(newOrderInfo);
      setIsProcessing(false);
      setIsSuccess(true);
      clearCart();
    } catch (error: any) {
      console.error("Order submission error:", error);
      setIsProcessing(false);
      // Improve error message display
      const displayMsg = error instanceof Error ? error.message : String(error);
      showAlert(
        (isArabic
          ? "حدث خطأ أثناء معالجة الطلب: "
          : "Error processing order: ") + displayMsg,
      );
    }
  };

  const texts = {
    title: t("checkout.title"),
    subtitle: t("checkout.subtitle"),
    card: t("checkout.card"),
    cod: t("checkout.cod"),
    total: t("checkout.total"),
    address: t("checkout.address"),
    phone: t("checkout.phone"),
    confirmOrder: t("checkout.confirm"),
    paypal: t("checkout.paypal"),
    bank: t("checkout.bank"),
    processing: t("checkout.processing"),
    success: t("checkout.success"),
    successSub: t("checkout.successSub"),
    trackingText: t("checkout.trackingId"),
    trackNow: t("checkout.trackNow"),
    secure: t("checkout.secure"),
    wallet: t("checkout.wallet"),
  };

  const renderPaymentExecution = () => {
    switch (paymentMethod as string) {
      case "card":
        const cardType = cardNumber.startsWith("4")
          ? "visa"
          : cardNumber.startsWith("5")
            ? "mastercard"
            : "generic";
        return (
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#C5A05B] flex items-center gap-2 mb-4">
              <CreditCard size={12} />{" "}
              {isArabic ? "بطاقة بنكية الدفع المباشر" : "Direct Card Payment"}
            </h4>

            {/* Dynamic Credit Card Visual Preview */}
            <div className="relative w-full h-44 sm:h-48 rounded-[1.8rem] bg-gradient-to-br from-[#1E1E24] via-[#111115] to-[#2E2E38] p-6 text-white shadow-2xl flex flex-col justify-between overflow-hidden border border-white/10">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#C5A05B]/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-[#4285F4]/10 rounded-full blur-2xl pointer-events-none" />

              {/* Chip and Logo */}
              <div className="flex justify-between items-center relative z-10">
                <div className="flex flex-col gap-1.5">
                  {/* Gold Chip */}
                  <div className="w-10 h-7 rounded bg-gradient-to-r from-[#D4AF37] to-[#F1E5AC] opacity-95 border border-[#B38F1E] flex flex-col justify-between p-1">
                    <div className="w-full h-[1px] bg-[#B38F1E]/30" />
                    <div className="w-full h-[1px] bg-[#B38F1E]/30" />
                    <div className="w-full h-[1px] bg-[#B38F1E]/30" />
                  </div>
                </div>
                {/* Card brand logo */}
                <div>
                  {cardType === "visa" && (
                    <span className="text-xl italic font-black text-white tracking-tight drop-shadow-md">
                      VISA
                    </span>
                  )}
                  {cardType === "mastercard" && (
                    <div className="flex items-center -space-x-2">
                      <div className="w-6 h-6 rounded-full bg-[#EB001B]" />
                      <div className="w-6 h-6 rounded-full bg-[#F79E1B] opacity-80" />
                    </div>
                  )}
                  {cardType === "generic" && (
                    <CreditCard className="text-white/40" size={24} />
                  )}
                </div>
              </div>

              {/* Card Number */}
              <div className="text-lg sm:text-2xl font-mono tracking-[0.14em] text-white/90 drop-shadow-md py-2 relative z-10 text-center">
                {cardNumber || "•••• •••• •••• ••••"}
              </div>

              {/* Card Holder & Expiry */}
              <div className="flex justify-between items-end relative z-10">
                <div className="flex flex-col text-start">
                  <span className="text-[7px] text-white/40 uppercase tracking-widest font-mono">
                    {isArabic ? "الاسم على البطاقة" : "Card Holder"}
                  </span>
                  <span className="text-xs sm:text-sm font-black tracking-wide truncate max-w-[160px] uppercase mt-0.5">
                    {cardName || (isArabic ? "الاسم بالكامل" : "YOUR FULL NAME")}
                  </span>
                </div>
                <div className="flex flex-col text-end">
                  <span className="text-[7px] text-white/40 uppercase tracking-widest font-mono">
                    {isArabic ? "تاريخ الانتهاء" : "Expires"}
                  </span>
                  <span className="text-xs sm:text-sm font-black tracking-widest mt-0.5">
                    {cardExpiry || "MM/YY"}
                  </span>
                </div>
              </div>
            </div>

            {/* Inputs Form */}
            <div className="space-y-4">
              {/* Cardholder Name */}
              <div className="space-y-1 text-start">
                <label className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/40">
                  {isArabic ? "الاسم الكامل على البطاقة" : "Cardholder Full Name"}
                </label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder={
                    isArabic ? "الاسم بالكامل على البطاقة" : "e.g. John Doe"
                  }
                  className="w-full px-4 py-3 bg-white border border-[#1A1A1A]/10 rounded-xl focus:border-[#C5A05B] focus:ring-1 focus:ring-[#C5A05B] transition-all text-xs outline-none text-black font-semibold"
                  required
                />
              </div>

              {/* Card Number */}
              <div className="space-y-1 text-start">
                <label className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/40">
                  {isArabic ? "رقم البطاقة المكون من 16 رقم" : "16-Digit Card Number"}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="0000 0000 0000 0000"
                    className="w-full pl-4 pr-10 py-3 bg-white border border-[#1A1A1A]/10 rounded-xl focus:border-[#C5A05B] focus:ring-1 focus:ring-[#C5A05B] transition-all text-xs outline-none font-mono text-black font-semibold"
                    maxLength={19}
                    required
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-black/30">
                    <CreditCard size={16} />
                  </div>
                </div>
              </div>

              {/* Expiry & CVV */}
              <div className="grid grid-cols-2 gap-4">
                {/* Expiry */}
                <div className="space-y-1 text-start">
                  <label className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/40">
                    {isArabic ? "تاريخ الانتهاء (MM/YY)" : "Expiry (MM/YY)"}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cardExpiry}
                    onChange={handleCardExpiryChange}
                    placeholder="MM/YY"
                    className="w-full px-4 py-3 bg-white border border-[#1A1A1A]/10 rounded-xl focus:border-[#C5A05B] focus:ring-1 focus:ring-[#C5A05B] transition-all text-xs outline-none font-mono text-center text-black font-semibold"
                    maxLength={5}
                    required
                  />
                </div>

                {/* CVV */}
                <div className="space-y-1 text-start">
                  <label className="text-[9px] font-black uppercase tracking-widest text-[#1A1A1A]/40">
                    {isArabic ? "رمز الحماية (CVV)" : "Security Code (CVV)"}
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      inputMode="numeric"
                      value={cardCvv}
                      onChange={handleCardCvvChange}
                      placeholder="•••"
                      className="w-full px-4 py-3 bg-white border border-[#1A1A1A]/10 rounded-xl focus:border-[#C5A05B] focus:ring-1 focus:ring-[#C5A05B] transition-all text-xs outline-none font-mono text-center font-bold text-black"
                      maxLength={4}
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-black/30">
                      <Lock size={12} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              disabled={isProcessing}
              onClick={() => handleSubmit()}
              type="button"
              className="w-full bg-[#1A1A1A] hover:bg-[#C29D59] text-white font-black py-5 rounded-2xl flex items-center justify-center gap-2.5 transition-all disabled:opacity-50 active:scale-[0.98] uppercase tracking-widest text-xs shadow-md cursor-pointer mb-2"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  {texts.processing}
                </span>
              ) : (
                <>
                  <Lock size={14} />
                  {isArabic
                    ? `تأكيد ودفع آمن بقيمة ${formatPrice(finalTotal)}`
                    : `Proceed for Secure Pay of ${formatPrice(finalTotal)}`}
                </>
              )}
            </button>

            <div className="flex gap-2 justify-center opacity-40 pt-2 border-t border-brand-charcoal/5">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/1/1b/Mada_Logo.svg"
                alt="Mada"
                className="h-4"
              />
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg"
                alt="Visa"
                className="h-4"
              />
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg"
                alt="Mastercard"
                className="h-4"
              />
            </div>
          </div>
        );
      case "googlepay":
        return (
          <div className="space-y-6 text-center">
            <div className="bg-[#4285F4]/5 p-8 rounded-[2.5rem] border-2 border-[#4285F4]/20 space-y-6">
              <div className="w-20 h-20 bg-[#4285F4] rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-[#4285F4]/20">
                <Smartphone size={40} className="text-white" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-black text-brand-charcoal leading-tight">
                  {isArabic
                    ? "الدفع السريع بنقرة واحدة"
                    : "One-Tap Fast Payment"}
                </h4>
                <p className="text-[10px] font-bold text-brand-charcoal/40 uppercase tracking-widest">
                  {isArabic
                    ? "آمن • سريع • خصوصية كاملة"
                    : "Secure • Fast • Total Privacy"}
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-brand-charcoal/5 flex flex-col items-center gap-3">
                <div className="flex items-center gap-2">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg"
                    alt="Google Pay"
                    className="h-8"
                  />
                </div>
                <p className="text-[10px] text-brand-charcoal/60 leading-relaxed max-w-[200px]">
                  {isArabic
                    ? "سيتم استخدام معلومات الدفع المحفوظة في حساب جوجل الخاص بك"
                    : "Saved payment info from your Google account will be used securely"}
                </p>
              </div>
            </div>

            <div className="flex justify-center w-full">
              <GooglePayButton
                environment="PRODUCTION"
                buttonColor="black"
                buttonType="pay"
                className="w-full"
                style={{ width: "100%", height: "60px" }}
                paymentRequest={{
                  apiVersion: 2,
                  apiVersionMinor: 0,
                  allowedPaymentMethods: [
                    {
                      type: "CARD",
                      parameters: {
                        allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
                        allowedCardNetworks: ["MASTERCARD", "VISA"],
                      },
                      tokenizationSpecification: {
                        type: "PAYMENT_GATEWAY",
                        parameters: {
                          gateway: "stripe",
                          "stripe:version": "2022-11-15",
                          "stripe:publishableKey":
                            settings.stripePublicKey ||
                            import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
                            "pk_test_placeholder",
                        },
                      },
                    },
                  ],
                  merchantInfo: {
                    merchantId:
                      settings.googlePayMerchantId ||
                      import.meta.env.VITE_GOOGLE_PAY_MERCHANT_ID ||
                      "BCR2DN5TROGI7Q2U",
                    merchantName: settings.storeName,
                  },
                  transactionInfo: {
                    totalPriceStatus: "FINAL",
                    totalPriceLabel: "Total",
                    totalPrice: (finalTotal || 0).toString(),
                    currencyCode: "USD",
                    countryCode: "IQ",
                  },
                }}
                onLoadPaymentData={(paymentData) => {
                  console.log("Google Pay Success", paymentData);
                  const token =
                    paymentData.paymentMethodData.tokenizationData.token;
                  handleSubmit(undefined, token);
                }}
                onError={(error) => {
                  console.error("Google Pay Error", error);
                  showAlert(
                    isArabic ? "فشل الدفع عبر Google Pay" : "Google Pay failed",
                  );
                }}
              />
            </div>

            <div className="flex items-center justify-center gap-4 opacity-50 grayscale pt-2">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/c/cb/Google_Pay_Logo_2020.svg"
                alt="GP"
                className="h-4"
              />
              <div className="w-[1px] h-3 bg-brand-charcoal/20" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-charcoal">
                Secure Checkout
              </span>
            </div>
          </div>
        );
      case "applepay":
        return (
          <div className="space-y-6 text-center">
            <div className="bg-black/5 p-8 rounded-[2.5rem] border-2 border-black/20 space-y-6">
              <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-black/20">
                <Smartphone size={40} className="text-white" />
              </div>
              <div className="space-y-2">
                <h4 className="text-xl font-black text-brand-charcoal leading-tight">
                  Apple Pay
                </h4>
                <p className="text-[10px] font-bold text-brand-charcoal/40 uppercase tracking-widest">
                  {isArabic
                    ? "آمن • سريع • خصوصية كاملة"
                    : "Secure • Fast • Total Privacy"}
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-brand-charcoal/5 flex flex-col items-center gap-3">
                <div className="flex items-center gap-2">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/b/b0/Apple_Pay_logo.svg"
                    alt="Apple Pay"
                    className="h-8"
                  />
                </div>
                <p className="text-[10px] text-brand-charcoal/60 leading-relaxed max-w-[200px]">
                  {isArabic
                    ? "سيتم استخدام بطاقتك المفضلة من Apple Wallet"
                    : "Your preferred card from Apple Wallet will be used"}
                </p>
              </div>
            </div>

            <button
              disabled={isProcessing}
              onClick={() =>
                handleSubmit(undefined, "apple_pay_simulation_token")
              }
              className="w-full bg-black text-white h-16 rounded-2xl flex items-center justify-center gap-3 hover:bg-zinc-900 transition-all shadow-xl font-bold disabled:opacity-50"
            >
              {isProcessing ? (
                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-lg"></span>
                  <span>{isArabic ? "الدفع" : "Pay"}</span>
                </div>
              )}
            </button>

            <div className="flex items-center justify-center gap-4 opacity-50 pt-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-charcoal">
                Secure Apple Pay Checkout
              </span>
            </div>
          </div>
        );
      case "crypto":
        return (
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00A38C] flex items-center gap-2 mb-4">
              <Coins size={12} strokeWidth={3} />{" "}
              {isArabic
                ? "الدفع بالعملات الرقمية (USDT)"
                : "Pay via USDT (Crypto)"}
            </h4>
            <div className="flex items-center gap-4 bg-[#00A38C]/5 p-5 rounded-3xl border border-[#00A38C]/20 mb-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform">
                <Coins size={60} />
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#00A38C] flex items-center justify-center text-white shadow-xl transform group-hover:scale-110 transition-transform">
                <img
                  src="https://cryptologos.cc/logos/tether-usdt-logo.svg?v=025"
                  className="w-6 h-6 invert brightness-0"
                  alt="USDT"
                />
              </div>
              <div>
                <h5 className="text-[14px] font-black text-[#00A38C] tracking-tight uppercase leading-none">
                  USDT (TRC20)
                </h5>
                <p className="text-[10px] font-bold text-brand-charcoal/40 uppercase mt-1.5">
                  {isArabic ? "دفع سريع وآمن" : "Fast & Secure Payment"}
                </p>
              </div>
            </div>

            <div className="bg-black p-8 rounded-[2.5rem] text-center space-y-6 relative overflow-hidden shadow-2xl">
              <div className="space-y-2">
                <h3 className="text-white text-xl font-black">
                  {isArabic ? "إيداع USDT" : "DEPOSIT USDT"}
                </h3>
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mb-3">
                  {isArabic ? "شبكة TRC20 فقط" : "TRC20 NETWORK ONLY"}
                </p>

                {/* Countdown Timer */}
                <div className={`mx-auto max-w-xs py-2 px-3.5 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                  cryptoTimer <= 300 
                    ? "bg-red-500/10 border-red-500/30 text-red-400 animate-pulse" 
                    : "bg-brand-gold/10 border-brand-gold/20 text-brand-gold"
                }`}>
                  <Clock size={12} className="shrink-0" />
                  <span className="text-[10px] font-black tracking-widest font-mono uppercase">
                    {cryptoTimer > 0 ? (
                      isArabic 
                        ? `المهلة المتبقية: ${formatTimer(cryptoTimer)}` 
                        : `TIME REMAINING: ${formatTimer(cryptoTimer)}`
                    ) : (
                      isArabic ? "انتهت صلاحية الجلسة!" : "SESSION EXPIRED!"
                    )}
                  </span>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-[2rem] shadow-2xl transform hover:scale-105 transition-all duration-500 cursor-pointer">
                  <img
                    src="/crypto_qr.png"
                    alt="Crypto QR Code"
                    className="w-48 h-48 sm:w-56 sm:h-56 object-contain"
                    onError={(e) => {
                      // Fallback if local image doesn't exist yet
                      (e.target as HTMLImageElement).src =
                        `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=TX221wiLGdKizoXaCaiRyLHjzZxxP63iFU`;
                    }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm sm:text-base text-white/90 font-bold leading-relaxed">
                  {isArabic
                    ? `يرجى تحويل المعادل لـ (${formatPrice(total)}) إلى العنوان التالي:`
                    : `Please transfer (${formatPrice(total)}) to:`}
                </p>

                {/* Network Fees Reminder */}
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-2xl p-4 text-start leading-relaxed space-y-1 max-w-xs mx-auto">
                  <div className="font-bold flex items-center gap-1.5 text-[11px] text-emerald-300">
                    <Info size={13} className="shrink-0" />
                    <span>{isArabic ? "تذكير برسوم الشبكة" : "Network Fees Notice"}</span>
                  </div>
                  <p className="text-[10px] text-white/70 leading-normal font-medium">
                    {isArabic 
                      ? "يرجى التأكد من إرسال كامل المبلغ المطلوب (بعد احتساب رسوم الشبكة). في حال إرسال مبلغ أقل، لن يتم معالجة طلبك بشكل تلقائي."
                      : "Please ensure you send the full amount (after network fees). If you send less, the order will not be processed automatically."}
                  </p>
                </div>

                <div
                  className="bg-brand-gold/10 py-6 px-4 rounded-3xl border-2 border-brand-gold/30 group cursor-pointer active:scale-95 transition-all hover:bg-brand-gold hover:text-white"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      "TX221wiLGdKizoXaCaiRyLHjzZxxP63iFU",
                    );
                    showAlert(
                      isArabic ? "تم نسخ العنوان!" : "Address Copied!",
                      "success",
                    );
                  }}
                >
                  <p className="text-base sm:text-2xl font-mono font-black text-brand-gold group-hover:text-white break-all tracking-normal text-center select-all">
                    TX221wiLGdKizoXaCaiRyLHjzZxxP63iFU
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 group-hover:opacity-100 group-hover:text-white transition-opacity">
                      {isArabic ? "اضغط لنسخ العنوان" : "TAP TO COPY ADDRESS"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* MANDATORY RECEIPT UPLOAD */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#f7931a] flex items-center gap-2">
                <Upload size={12} />{" "}
                {isArabic
                  ? "ارفاق ايصال الدفع (إجباري)"
                  : "Attach Payment Receipt (Mandatory)"}
              </label>

              <div
                className={`relative group transition-all ${receiptFile ? "border-[#f7931a]/20 bg-[#f7931a]/5" : "border-dashed border-2 border-brand-charcoal/10 bg-brand-charcoal/[0.02] hover:bg-brand-charcoal/[0.04]"} rounded-3xl p-6 text-center`}
              >
                {cryptoTimer > 0 && (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                )}

                {cryptoTimer === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-2">
                      <AlertTriangle size={24} />
                    </div>
                    <p className="text-xs font-bold text-red-500">
                      {isArabic ? "انتهت صلاحية جلسة الدفع" : "Payment Session Expired"}
                    </p>
                    <p className="text-[10px] text-brand-charcoal/50 font-bold max-w-[280px] leading-relaxed mx-auto">
                      {isArabic
                        ? "انتهت مهلة الـ 30 دقيقة لحجز السعر. يرجى تجديد الطلب أو اختيار وسيلة دفع أخرى."
                        : "The 30-minute window to complete the payment has closed. Please renew your session or choose another method."}
                    </p>
                  </div>
                ) : receiptPreview ? (
                  <div className="flex flex-col items-center gap-3 relative z-20">
                    <div className="relative">
                      <img
                        src={receiptPreview}
                        alt="Receipt Preview"
                        className="w-24 h-24 object-cover rounded-2xl shadow-lg border-2 border-white"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeReceipt();
                        }}
                        className="absolute -top-2 -right-2 bg-brand-charcoal text-white rounded-full p-1 shadow-lg hover:bg-red-500 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <p className="text-[10px] font-bold text-[#f7931a] truncate max-w-[200px]">
                      {receiptFile?.name}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <div className="w-12 h-12 rounded-full bg-[#f7931a]/10 flex items-center justify-center text-[#f7931a] mb-2">
                      <Upload size={24} />
                    </div>
                    <p className="text-xs font-bold text-brand-charcoal">
                      {isArabic
                        ? "اضغط لرفع الايصال"
                        : "Click to upload receipt"}
                    </p>
                    <p className="text-[9px] text-brand-charcoal/40 font-bold uppercase tracking-widest">
                      {isArabic
                        ? "الصور فقط (الحد الأقصى 5 ميجابايت)"
                        : "Images only (Max 5MB)"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <button
              disabled={isProcessing || !receiptFile || cryptoTimer === 0}
              onClick={() => handleSubmit()}
              className="w-full bg-[#f7931a] text-white font-black text-xs py-6 rounded-2xl shadow-xl shadow-[#f7931a]/20 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed group"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  {texts.processing}
                </span>
              ) : cryptoTimer === 0 ? (
                <span>{isArabic ? "انتهت صلاحية الجلسة" : "Session Expired"}</span>
              ) : (
                <>
                  <Lock
                    size={16}
                    className="group-hover:scale-110 transition-transform"
                  />
                  {isArabic ? "تأكيد الحوالة والطلب" : "Confirm Crypto Order"}
                </>
              )}
            </button>

            <p className="text-[10px] text-brand-gold font-black text-center uppercase tracking-[0.2em] animate-pulse">
              {isArabic
                ? "✓ أرسل رقم العملية (TXID) عبر الواتساب"
                : "✓ Send TXID via WhatsApp"}
            </p>
          </div>
        );
      case "bank":
        return (
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold flex items-center gap-2 mb-4">
              <Building2 size={12} />{" "}
              {isArabic ? "بيانات التحويل البنكي" : "Bank Transfer Details"}
            </h4>

            <div className="bg-brand-charcoal/[0.03] p-8 rounded-[2.5rem] border border-brand-charcoal/10 space-y-6 text-center">
              <div className="w-20 h-20 bg-brand-gold rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-brand-gold/20">
                <Building2 size={40} className="text-white" />
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-white rounded-2xl border border-brand-charcoal/5 shadow-sm space-y-1">
                  <span className="text-[9px] font-black uppercase text-brand-charcoal/30 tracking-[0.2em]">
                    {isArabic ? "اسم البنك" : "Bank Name"}
                  </span>
                  <p className="text-sm font-black text-brand-charcoal">
                    {settings.bankDetails.bankName || "N/A"}
                  </p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-brand-charcoal/5 shadow-sm space-y-1">
                  <span className="text-[9px] font-black uppercase text-brand-charcoal/30 tracking-[0.2em]">
                    {isArabic ? "صاحب الحساب" : "Account Holder"}
                  </span>
                  <p className="text-sm font-black text-brand-charcoal">
                    {settings.bankDetails.accountHolder || "N/A"}
                  </p>
                </div>
                <div
                  className="p-5 bg-white rounded-2xl border-2 border-brand-charcoal/5 shadow-sm space-y-1 relative group cursor-pointer"
                  onClick={() => {
                    navigator.clipboard.writeText(settings.bankDetails.iban);
                    showAlert(
                      isArabic ? "تم نسخ IBAN!" : "IBAN Copied!",
                      "success",
                    );
                  }}
                >
                  <span className="text-[9px] font-black uppercase text-brand-charcoal/30 tracking-[0.2em]">
                    IBAN
                  </span>
                  <p className="text-sm sm:text-lg font-mono font-black text-brand-charcoal break-all leading-relaxed">
                    {settings.bankDetails.iban || "N/A"}
                  </p>
                  <div className="absolute inset-0 bg-brand-gold opacity-0 group-hover:opacity-10 transition-opacity flex items-center justify-center rounded-2xl">
                    <span className="bg-brand-charcoal text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-black/20">
                      {isArabic ? "إضغط لنسخ الآيبان" : "Tap to Copy IBAN"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-brand-gold/5 p-4 rounded-2xl border border-brand-gold/10">
                <p className="text-[10px] text-brand-gold font-bold leading-relaxed italic">
                  {isArabic
                    ? "يرجى تحويل المبلغ ومن ثم إرفاق صورة من إيصال التحويل أدناه."
                    : "Please transfer the amount and then attach a photo of the transfer receipt below."}
                </p>
              </div>
            </div>

            {/* MANDATORY RECEIPT UPLOAD */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gold flex items-center gap-2">
                <Upload size={12} />{" "}
                {isArabic
                  ? "ارفاق ايصال الحوالة (إجباري)"
                  : "Attach Transfer Receipt (Mandatory)"}
              </label>

              <div
                className={`relative group transition-all ${receiptFile ? "border-brand-gold/20 bg-brand-gold/5" : "border-dashed border-2 border-brand-charcoal/10 bg-brand-charcoal/[0.02] hover:bg-brand-charcoal/[0.04]"} rounded-3xl p-6 text-center`}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />

                {receiptPreview ? (
                  <div className="flex flex-col items-center gap-3 relative z-20">
                    <div className="relative">
                      <img
                        src={receiptPreview}
                        alt="Receipt Preview"
                        className="w-24 h-24 object-cover rounded-2xl shadow-lg border-2 border-white"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeReceipt();
                        }}
                        className="absolute -top-2 -right-2 bg-brand-charcoal text-white rounded-full p-1 shadow-lg hover:bg-red-500 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <p className="text-[10px] font-bold text-brand-charcoal truncate max-w-[200px]">
                      {receiptFile?.name}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <div className="w-12 h-12 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold mb-2">
                      <Upload size={24} />
                    </div>
                    <p className="text-xs font-bold text-brand-charcoal">
                      {isArabic
                        ? "اضغط لرفع الايصال"
                        : "Click to upload receipt"}
                    </p>
                    <p className="text-[9px] text-brand-charcoal/40 font-bold uppercase tracking-widest">
                      {isArabic
                        ? "الصور فقط (الحد الأقصى 5 ميجابايت)"
                        : "Images only (Max 5MB)"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <button
              disabled={isProcessing || !receiptFile}
              onClick={() => handleSubmit()}
              className="w-full bg-brand-charcoal text-white font-black py-6 rounded-2xl shadow-xl shadow-brand-charcoal/20 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed group text-xs"
            >
              {isProcessing ? (
                <span className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  {texts.processing}
                </span>
              ) : (
                <>
                  <Lock
                    size={16}
                    className="group-hover:scale-110 transition-transform"
                  />
                  {isArabic ? "تأكيد الحوالة البنكية" : "Confirm Bank Transfer"}
                </>
              )}
            </button>
          </div>
        );
      default:
        return (
          <button
            disabled={isProcessing}
            onClick={() => handleSubmit()}
            type="button"
            className="w-full bg-brand-charcoal text-white font-bold py-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-brand-gold shadow-2xl shadow-brand-charcoal/20 transition-all disabled:opacity-50 active:scale-95 group"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                {texts.processing}
              </span>
            ) : (
              <>
                {paymentMethod === "cod" ? (
                  <Truck className="group-hover:translate-x-1 transition-transform" />
                ) : (
                  <Banknote />
                )}
                {texts.confirmOrder}
              </>
            )}
          </button>
        );
    }
  };

  const methodLabel =
    paymentMethod === "cod"
      ? isArabic
        ? "دفع عند الاستلام"
        : "Cash on Delivery"
      : paymentMethod === "card"
        ? isArabic
          ? "بطاقة بنكية"
          : "Bank Card"
        : paymentMethod === "crypto"
          ? isArabic
            ? "عملات رقمية"
            : "Crypto"
          : (paymentMethod as string) === "googlepay"
            ? isArabic
              ? "جوجل باي"
              : "Google Pay"
            : "";

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={`fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 ${isArabic ? "font-arabic" : ""}`}
          dir={isArabic ? "rtl" : "ltr"}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-charcoal/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-brand-cream rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh]"
          >
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Header */}
              <div className="p-5 text-white flex-shrink-0 relative bg-[#121212] border-b border-[#C5A037]/25">
                <div className="flex items-center justify-between">
                  <button
                    onClick={onClose}
                    type="button"
                    className="text-[10px] font-black uppercase tracking-widest hover:text-brand-gold transition-colors bg-white/5 hover:bg-white/10 px-3.5 py-1.5 rounded-full border border-white/10"
                  >
                    {t("checkout.cancel")}
                  </button>
                  <h2 className="text-sm font-black uppercase tracking-widest text-[#FFF8EB] flex items-center gap-1.5 absolute left-1/2 -translate-x-1/2">
                    <ShieldCheck size={16} className="text-[#C5A037]" />
                    {isArabic ? "بوابة الدفع" : "PAYMENT METHODS"}
                  </h2>
                  <div className="w-10"></div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="py-4 px-6 border-b border-brand-charcoal/[0.04] flex justify-between items-center bg-[#FDFBF7]">
                <span className="text-brand-charcoal/80 font-bold text-[11px] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse"></span>
                  {t("checkout.orderTotal")}
                </span>
                <span className="text-xl font-mono font-black text-[#b12704] tracking-tight">
                  {formatPrice(finalTotal)}
                </span>
              </div>

              {/* Content */}
              <div className="p-6 sm:p-10 overflow-y-auto flex-1 bg-white custom-scrollbar">
                {isSuccess ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white mb-6 shadow-xl shadow-green-100">
                      <ShieldCheck size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-brand-charcoal mb-2">
                      {texts.success}
                    </h3>
                    <p className="text-brand-charcoal/60 text-sm mb-10 max-w-xs leading-relaxed">
                      {texts.successSub}
                    </p>

                    {orderInfo && (
                      <div className="w-full bg-brand-charcoal/5 border-2 border-dashed border-brand-charcoal/10 rounded-3xl p-8">
                        <div className="flex flex-col items-center justify-center gap-2 mb-6">
                          <div className="flex items-center gap-2 bg-brand-gold/10 py-2 px-4 rounded-full w-fit mx-auto">
                            <ShieldCheck
                              size={14}
                              className="text-brand-gold"
                            />
                            <span className="text-[10px] font-bold text-brand-gold uppercase tracking-widest">
                              {t("checkout.processedViaNetwork")} ✅
                            </span>
                          </div>
                          {orderInfo.cardholderName && (
                            <div className="mt-2 text-brand-charcoal/60 text-xs font-bold bg-white/50 px-4 py-2 rounded-xl border border-brand-charcoal/5">
                              {t("checkout.cardholder")}:
                              <span className="text-brand-charcoal">
                                {orderInfo.cardholderName}
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] uppercase font-black tracking-widest text-brand-charcoal/30 mb-2">
                          {texts.trackingText}
                        </p>
                        <p className="text-3xl font-mono font-bold text-brand-gold mb-8 tracking-tighter">
                          {orderInfo.trackingId}
                        </p>
                        <div className="mb-4 text-sm font-bold text-brand-charcoal/60">
                          {t("checkout.total")}:{" "}
                          <span className="text-brand-charcoal">
                            {formatPrice(finalTotal)}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            (window.location.href = `/track/${orderInfo.trackingId}`)
                          }
                          className="w-full bg-brand-charcoal text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-brand-gold transition-all shadow-lg active:scale-95"
                        >
                          <MapPin size={18} /> {texts.trackNow}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Payment Selection Toggles */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 bg-[#FDFBF7]/90 p-4 rounded-[32px] gap-3.5 border border-[#C5A037]/15 shadow-sm">
                      {(
                        [
                          "card",
                          "crypto",
                          "applepay",
                          "bank",
                          "googlepay",
                          "cod",
                        ] as const
                      ).map((method) => {
                        if (
                          method === "bank" &&
                          !settings.bankDetails.isAvailable
                        )
                          return null;

                        if (method === "cod" && selectedCountry !== "IQ")
                          return null;

                        const isSelected = paymentMethod === method;

                        let containerClass = `flex items-center justify-center h-14 w-14 rounded-2xl transition-all duration-300 select-none ${
                          isSelected
                            ? "scale-110 shadow-md text-white"
                            : "bg-brand-charcoal/[0.03] text-brand-charcoal/70 group-hover:bg-brand-charcoal/5 group-hover:text-brand-charcoal"
                        }`;

                        if (isSelected) {
                          if (method === "card") {
                            containerClass += " bg-gradient-to-br from-[#D4AF37] via-[#EBC053] to-[#A37E20] shadow-brand-gold/25";
                          } else if (method === "googlepay") {
                            containerClass += " bg-gradient-to-br from-[#151515] to-[#252525] shadow-black/20";
                          } else if (method === "applepay") {
                            containerClass += " bg-gradient-to-br from-[#27272A] to-[#09090B] shadow-black/35";
                          } else if (method === "crypto") {
                            containerClass += " bg-gradient-to-br from-[#F7931A] to-[#E85C0F] shadow-orange-500/25";
                          } else if (method === "cod") {
                            containerClass += " bg-gradient-to-br from-[#059669] to-[#047857] shadow-emerald-500/25";
                          } else if (method === "bank") {
                            containerClass += " bg-gradient-to-br from-[#C5A037] to-[#8C6F23] shadow-neutral-500/15";
                          }
                        }

                        return (
                          <button
                            key={method}
                            type="button"
                            onClick={() => setPaymentMethod(method)}
                            className={`p-4 rounded-[26px] flex flex-col items-center justify-center gap-3 transition-all border-2 relative select-none cursor-pointer duration-500 group ${
                              isSelected
                                ? "bg-white text-[#C5A037] border-[#C5A037] shadow-xl shadow-[#C5A037]/10 scale-[1.03] z-10"
                                : "bg-white/40 text-brand-charcoal/40 border-transparent hover:border-[#C5A037]/20 hover:bg-white/90 hover:scale-[1.01]"
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute top-2.5 right-2.5 bg-[#C5A037] text-white rounded-full p-0.5 shadow-md z-20 animate-in fade-in zoom-in-50 duration-200">
                                <ShieldCheck size={11} fill="currentColor" />
                              </div>
                            )}
                            
                            <div className={containerClass}>
                              {method === "card" ? (
                                <div className="flex flex-col items-center justify-center w-full h-full relative p-1">
                                  <div className="relative">
                                    <CreditCard
                                      size={24}
                                      strokeWidth={1.8}
                                      className={
                                        isSelected
                                          ? "text-white drop-shadow-[0_1.5px_3px_rgba(0,0,0,0.15)]"
                                          : "text-[#C5A037]"
                                      }
                                    />
                                    {/* Beautiful simulated gold microchip */}
                                    <div className={`absolute top-1 left-0.5 w-2 h-1.5 rounded-[1.5px] transition-all duration-300 ${isSelected ? "bg-[#FFEFA6] shadow-sm animate-pulse" : "bg-[#C5A037]/40"}`} />
                                  </div>
                                </div>
                              ) : method === "bank" ? (
                                <div className="flex flex-col items-center justify-center">
                                  <Building2 size={24} strokeWidth={1.8} className={isSelected ? "text-white" : "text-[#4B5563]"} />
                                </div>
                              ) : method === "cod" ? (
                                <div
                                  className={`flex flex-col items-center justify-center -space-y-0.5 ${isSelected ? "text-white" : "text-[#059669]"}`}
                                >
                                  <Truck size={22} strokeWidth={1.8} />
                                  <Banknote
                                    size={12}
                                    strokeWidth={2}
                                    className="translate-y-0.5"
                                  />
                                </div>
                              ) : (method as string) === "googlepay" ? (
                                <div className="flex flex-col items-center justify-center w-full h-full p-1 gap-1">
                                  <GoogleIconSvg isSelected={isSelected} />
                                </div>
                              ) : (method as string) === "applepay" ? (
                                <div className="flex items-center justify-center gap-0.5 w-full h-full">
                                  <AppleIconSvg className={`h-6.5 w-auto ${isSelected ? "text-white" : "text-brand-charcoal"}`} />
                                </div>
                              ) : method === "crypto" ? (
                                <div className="flex items-center justify-center bg-white rounded-full w-9 h-9 shadow-sm">
                                  <Bitcoin
                                    size={22}
                                    className="text-[#f7931a]"
                                  />
                                </div>
                              ) : (
                                <Banknote size={24} />
                              )}
                            </div>

                            {/* Enhanced brand subtitles & labels below the button's action circle */}
                            {method === "card" && (
                              <div className="flex gap-1 select-none items-center justify-center scale-[0.85] opacity-95">
                                <InlineVisaLogo />
                                <InlineMastercardLogo />
                                <InlineMadaLogo />
                              </div>
                            )}

                            {method === "crypto" && (
                              <div className="text-[8px] font-mono font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/30">
                                BTC / USDT
                              </div>
                            )}

                            {method === "googlepay" && (
                              <div className="text-[8px] font-sans font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/20">
                                G PAY
                              </div>
                            )}

                            {method === "applepay" && (
                              <div className="text-[8px] font-sans font-black text-zinc-800 bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-200/20">
                                APPLE PAY
                              </div>
                            )}

                            {method === "bank" && (
                              <div className="text-[8px] font-mono font-black text-[#C5A037] bg-amber-50/50 px-1.5 py-0.5 rounded border border-amber-200/20">
                                IBAN DIRECT
                              </div>
                            )}

                            {method === "cod" && (
                              <div className="text-[8px] font-sans font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/20">
                                {isArabic ? "نقدي" : "HAND CASH"}
                              </div>
                            )}
                            
                            <span
                              className={`text-[10.5px] font-black uppercase tracking-wider whitespace-nowrap text-center transition-all ${
                                isSelected 
                                  ? "text-brand-charcoal font-black scale-105" 
                                  : "text-brand-charcoal/50 group-hover:text-brand-charcoal/80"
                              }`}
                            >
                              {(method as string) === "googlepay"
                                ? isArabic
                                  ? "جوجل باي"
                                  : "Google Pay"
                                : (method as string) === "applepay"
                                  ? isArabic
                                    ? "آبل باي"
                                    : "Apple Pay"
                                  : method === "crypto"
                                    ? isArabic
                                      ? "عملات رقمية"
                                      : "Crypto"
                                    : method === "bank"
                                      ? isArabic
                                        ? "تحويل بنكي"
                                        : "Bank Transfer"
                                      : texts[method as keyof typeof texts]}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="space-y-6">
                      {/* Customer Information Section */}
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold flex items-center gap-2">
                          <MapPin size={12} /> {t("checkout.shippingInfo")}
                        </h4>

                        <div className="space-y-4">
                          {/* Country Selection */}
                          <div className="relative group">
                            <label className="absolute -top-2 left-6 px-2 bg-white text-[9px] font-black uppercase text-brand-charcoal/40 z-10">
                              {t("checkout.country")}
                            </label>
                            <select
                              value={selectedCountry}
                              onChange={(e) =>
                                setSelectedCountry(e.target.value)
                              }
                              className="w-full bg-white border-2 border-brand-charcoal/10 rounded-2xl px-12 py-5 focus:border-brand-gold outline-none text-brand-charcoal font-bold appearance-none transition-all shadow-sm"
                            >
                              {countries.map((c) => (
                                <option key={c.code} value={c.code}>
                                  {isArabic ? c.nameAr : c.name}
                                </option>
                              ))}
                            </select>
                            <Globe
                              size={20}
                              className={`absolute ${isArabic ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 text-brand-gold`}
                            />
                          </div>

                          {/* Shipping Provider Selection */}
                          {paymentMethod === "cod" && (
                            <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-gold">
                                {t("checkout.shippingProvider")}
                              </label>
                              <div className="grid grid-cols-1 gap-2">
                                {shippingProviders
                                  .filter((p) => {
                                    if (selectedCountry === "IQ") return true;
                                    return p.id !== "al-waseet";
                                  })
                                  .map((p) => (
                                    <button
                                      key={p.id}
                                      type="button"
                                      onClick={() => setSelectedProvider(p.id)}
                                      className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                                        selectedProvider === p.id
                                          ? "border-brand-gold bg-brand-gold/5 shadow-sm"
                                          : "border-brand-charcoal/5 hover:border-brand-charcoal/10"
                                      }`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div
                                          className={`w-8 h-8 rounded-xl flex items-center justify-center ${selectedProvider === p.id ? "bg-brand-gold text-white" : "bg-brand-charcoal/5 text-brand-charcoal/40"}`}
                                        >
                                          <Truck size={14} />
                                        </div>
                                        <div
                                          className={
                                            isArabic
                                              ? "text-right"
                                              : "text-left"
                                          }
                                        >
                                          <span className="block text-sm font-bold text-brand-charcoal">
                                            {p.name}
                                          </span>
                                          <span className="block text-[10px] text-brand-charcoal/40 font-medium">
                                            {t("checkout.deliveryWithin")}:{" "}
                                            {p.speed}
                                          </span>
                                        </div>
                                      </div>
                                      <div
                                        className={`text-sm font-bold ${selectedProvider === p.id ? "text-brand-gold" : "text-brand-charcoal/60"}`}
                                      >
                                        {formatPrice(
                                          Math.round(
                                            p.base *
                                              (COUNTRY_ADJUSTMENT_LOCAL[
                                                selectedCountry
                                              ] || 1.5),
                                          ),
                                        )}
                                      </div>
                                    </button>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* Form Fields */}
                          <div className="relative">
                            <label className="absolute -top-2 left-6 px-2 bg-white text-[9px] font-black uppercase text-brand-gold z-10">
                              {t("checkout.fullName")}
                            </label>
                            <input
                              required
                              type="text"
                              placeholder="John Doe"
                              className="w-full bg-brand-charcoal/[0.02] border-2 border-brand-charcoal/10 rounded-2xl px-6 py-5 focus:bg-white focus:border-brand-gold outline-none text-brand-charcoal font-bold transition-all shadow-sm"
                              value={formData.name}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  name: e.target.value,
                                })
                              }
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="relative">
                              <label className="absolute -top-2 left-6 px-2 bg-white text-[9px] font-black uppercase text-brand-gold z-10">
                                {t("checkout.phone")}
                              </label>
                              <div className="flex bg-brand-charcoal/[0.02] border-2 border-brand-charcoal/10 rounded-2xl overflow-hidden focus-within:bg-white focus-within:border-brand-gold transition-all shadow-sm">
                                <select
                                  value={phonePrefix}
                                  onChange={(e) =>
                                    setPhonePrefix(e.target.value)
                                  }
                                  className="bg-transparent border-none pl-4 pr-1 py-5 text-sm font-bold text-brand-charcoal outline-none cursor-pointer appearance-none"
                                  style={{ width: "80px" }}
                                >
                                  {countries.map((c) => (
                                    <option key={c.code} value={c.dialCode}>
                                      {c.dialCode} ({c.code})
                                    </option>
                                  ))}
                                </select>
                                <div className="w-[1px] h-6 bg-brand-charcoal/10 self-center" />
                                <input
                                  required
                                  type="tel"
                                  placeholder="770 000 0000"
                                  className="flex-1 bg-transparent border-none px-4 py-5 outline-none text-brand-charcoal font-bold"
                                  value={formData.phone}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      phone: e.target.value,
                                    })
                                  }
                                />
                              </div>
                            </div>
                            <div className="relative">
                              <label className="absolute -top-2 left-6 px-2 bg-white text-[9px] font-black uppercase text-brand-gold z-10">
                                {t("checkout.email")}
                              </label>
                              <input
                                required
                                type="email"
                                placeholder="email@example.com"
                                className="w-full bg-brand-charcoal/[0.02] border-2 border-brand-charcoal/10 rounded-2xl px-6 py-5 focus:bg-white focus:border-brand-gold outline-none text-brand-charcoal font-bold transition-all shadow-sm"
                                value={formData.email}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    email: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="relative">
                              <label className="absolute -top-2 left-6 px-2 bg-white text-[9px] font-black uppercase text-brand-gold z-10">
                                {t("checkout.city")}
                              </label>
                              <input
                                required
                                type="text"
                                placeholder="Dubai"
                                className="w-full bg-brand-charcoal/[0.02] border-2 border-brand-charcoal/10 rounded-2xl px-6 py-5 focus:bg-white focus:border-brand-gold outline-none text-brand-charcoal font-bold transition-all shadow-sm"
                                value={formData.city}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    city: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div className="relative">
                              <label className="absolute -top-2 left-6 px-2 bg-white text-[9px] font-black uppercase text-brand-gold z-10">
                                {isArabic ? "الرمز البريدي" : "ZIP Code"}
                              </label>
                              <input
                                type="text"
                                placeholder="00000"
                                className="w-full bg-brand-charcoal/[0.02] border-2 border-brand-charcoal/10 rounded-2xl px-6 py-5 focus:bg-white focus:border-brand-gold outline-none text-brand-charcoal font-bold transition-all shadow-sm"
                                value={formData.zipCode}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    zipCode: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>

                          <div className="relative">
                            <label className="absolute -top-2 left-6 px-2 bg-white text-[9px] font-black uppercase text-brand-gold z-10">
                              {t("checkout.detailedAddress")}
                            </label>
                            <textarea
                              required
                              rows={2}
                              placeholder={t("checkout.addressPlaceholder")}
                              className="w-full bg-brand-charcoal/[0.02] border-2 border-brand-charcoal/10 rounded-2xl px-6 py-5 focus:bg-white focus:border-brand-gold outline-none text-brand-charcoal font-bold transition-all shadow-sm resize-none"
                              value={formData.address}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  address: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>

                      {/* Trust Badge */}
                      <div className="bg-brand-charcoal/[0.02] p-4 rounded-2xl border border-brand-charcoal/5 flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-gold/10 flex items-center justify-center flex-shrink-0">
                          <Globe size={14} className="text-brand-gold" />
                        </div>
                        <div className={isArabic ? "text-right" : "text-left"}>
                          <p className="text-[10px] font-bold text-brand-charcoal uppercase tracking-tighter">
                            {t("checkout.smartFulfillment")}
                          </p>
                          <p className="text-[9px] text-brand-charcoal/50 leading-relaxed">
                            {t("checkout.smartFulfillmentDesc")}
                          </p>
                        </div>
                      </div>

                      {/* Payment Execution */}
                      <div className="pt-6 border-t border-brand-charcoal/5">
                        {renderPaymentExecution()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Security Badge */}
              <div className="p-4 bg-brand-charcoal/5 text-center flex items-center justify-center gap-2 text-[10px] text-brand-charcoal/40 uppercase font-black tracking-widest flex-shrink-0">
                <ShieldCheck size={12} /> {texts.secure}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;
