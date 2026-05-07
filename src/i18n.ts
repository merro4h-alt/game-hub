import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "nav": {
        "home": "Home",
        "products": "Products",
        "shop": "Shop",
        "about": "About us",
        "contact": "Contact",
        "search": "Search products...",
        "cart": "Cart",
        "trackOrder": "Track Order"
      },
      "order": {
        "status": {
          "pending": "Pending",
          "processing": "Processing",
          "shipped": "Shipped",
          "delivered": "Delivered",
          "cancelled": "Cancelled"
        },
        "cancellationPolicy": {
          "title": "Order Cancellation Policy",
          "text": "After confirming your order, you have 24 working hours to modify or cancel the order by contacting the support team via email. After this period, the order cannot be cancelled."
        },
        "chat": {
          "button": "Chat with us",
          "title": "Customer Support",
          "welcome": "Hello! How can we help you today?",
          "inputPlaceholder": "Type your message...",
          "send": "Send"
        }
      },
      "footer": {
        "description": "Your first choice for everything new and unique",
        "quickLinks": "Quick Links",
        "contact": "Contact Us",
        "emailLabel": "Inquiries",
        "copyright": "© 2024 Trendifi Lifestyle. All rights reserved."
      },
      "home": {
        "firstChoice": "Your first choice for shopping",
        "categories": "Categories",
        "explore": "Explore Our Collections",
        "viewAll": "View All Categories",
        "shopNow": "Shop Now",
        "products": "Products",
        "selection": "Selection",
        "featured": "Featured Arrivals",
        "exploreAll": "Explore All Products"
      },
      "shop": {
        "title": "Our Shop",
        "subtitle": "Explore our carefully curated selection of premium products.",
        "addProduct": "Add Product",
        "editProducts": "Edit Products",
        "edit": "Edit Product",
        "delete": "Delete Product",
        "discountPrice": "Discount Price",
        "sale": "Sale",
        "originalPrice": "Original Price",
        "exitEdit": "Exit Edit Mode",
        "noProducts": "No products found",
        "deleteConfirm": "Are you sure you want to delete this product?",
        "yes": "Yes",
        "no": "No",
        "sizeGuide": "Size Guide",
        "size": "Size",
        "color": "Color",
        "addToCart": "Add to Cart",
        "relatedProducts": "Related Treasures",
        "mightLike": "You might also like"
      },
      "categories": {
        "new": "New",
        "bestSeller": "Best Seller",
        "offers": "Offers"
      },
      "reviews": {
        "title": "Customer Reviews",
        "subtitle": "What our community says about Trendifi",
        "items": {
          "1": {
            "name": "Sarah J.",
            "comment": "The quality of the products is amazing. Exceeded my expectations!",
            "stars": 5
          },
          "2": {
            "name": "Michael R.",
            "comment": "Fast shipping and great customer service. Highly recommended.",
            "stars": 5
          },
          "3": {
            "name": "Emma W.",
            "comment": "Unique pieces that I couldn't find anywhere else. I love it!",
            "stars": 4
          }
        },
        "addReview": "Write a Review",
        "modalTitle": "Rate Your Experience",
        "modalSubtitle": "We value your feedback. How was your experience with Trendifi?",
        "ratingLabel": "Your Rating",
        "commentLabel": "Your Review",
        "commentPlaceholder": "Tell us what you liked or how we can improve...",
        "submit": "Submit Review",
        "success": "Thank you! Your review has been sent."
      },
      "common": {
        "loading": "Loading...",
        "error": "Error occurred",
        "addToCart": "Add to Cart",
        "viewDetails": "View Details"
      }
    }
  },
  ar: {
    translation: {
      "nav": {
        "home": "الرئيسية",
        "products": "المنتجات",
        "shop": "المتجر",
        "about": "من نحن",
        "contact": "اتصل بنا",
        "search": "ابحث عن المنتجات...",
        "cart": "السلة",
        "trackOrder": "تتبع الطلب"
      },
      "order": {
        "status": {
          "pending": "قيد الانتظار",
          "processing": "جاري المعالجة",
          "shipped": "تم الشحن",
          "delivered": "تم التوصيل",
          "cancelled": "ملغي"
        },
        "cancellationPolicy": {
          "title": "سياسة إلغاء الطلب",
          "text": "بعد تأكيد طلبك، لديك 24 ساعة عمل لتعديل أو إلغاء الطلب من خلال التواصل مع فريق الدعم عبر البريد الإلكتروني. بعد انتهاء هذه المدة، لا يمكن إلغاء الطلب"
        },
        "chat": {
          "button": "تحدث معنا",
          "title": "دعم العملاء",
          "welcome": "مرحباً! كيف يمكننا مساعدتك اليوم؟",
          "inputPlaceholder": "اكتب رسالتك هنا...",
          "send": "إرسال"
        }
      },
      "footer": {
        "description": "خيارك الأول لكل ما هو جديد وفريد",
        "quickLinks": "روابط سريعة",
        "contact": "اتصل بنا",
        "emailLabel": "للاستفسار",
        "copyright": "© 2024 تريندي في لايف ستايل. جميع الحقوق محفوظة."
      },
      "home": {
        "firstChoice": "خيارك الأول للتسوق",
        "categories": "الأقسام",
        "explore": "استكشف مجموعاتنا",
        "viewAll": "عرض جميع الأقسام",
        "shopNow": "تسوق الآن",
        "products": "المنتجات",
        "selection": "اختيارنا",
        "featured": "وصلنا حديثاً",
        "exploreAll": "استكشف جميع المنتجات"
      },
      "shop": {
        "title": "متجرنا",
        "subtitle": "استكشف مجموعتنا المختارة بعناية من المنتجات المتميزة.",
        "addProduct": "إضافة منتج",
        "editProducts": "تعديل المنتجات",
        "edit": "تعديل المنتج",
        "delete": "حذف المنتج",
        "discountPrice": "سعر الخصم",
        "sale": "تخفيض",
        "originalPrice": "السعر الأصلي",
        "exitEdit": "إنهاء وضع التعديل",
        "noProducts": "لا توجد منتجات",
        "deleteConfirm": "هل أنت متأكد أنك تريد حذف هذا المنتج؟",
        "yes": "نعم",
        "no": "لا",
        "sizeGuide": "دليل المقاسات",
        "size": "المقاس",
        "color": "اللون",
        "addToCart": "أضف إلى السلة",
        "relatedProducts": "منتجات ذات صلة",
        "mightLike": "قد يعجبك أيضاً"
      },
      "categories": {
        "new": "جديد",
        "bestSeller": "الأكثر مبيعاً",
        "offers": "العروض"
      },
      "reviews": {
        "title": "آراء العملاء",
        "subtitle": "ماذا يقول مجتمعنا عن Trendifi",
        "items": {
          "1": {
            "name": "سارة ج.",
            "comment": "جودة المنتجات مذهلة. تجاوزت توقعاتي بكثير!",
            "stars": 5
          },
          "2": {
            "name": "مايكل ر.",
            "comment": "شحن سريع وخدمة عملاء رائعة. أنصح به بشدة.",
            "stars": 5
          },
          "3": {
            "name": "إيما و.",
            "comment": "قطع فريدة لم أجدها في أي مكان آخر. أحببتها!",
            "stars": 4
          }
        },
        "addReview": "اكتب تقييماً",
        "modalTitle": "قيم تجربتك",
        "modalSubtitle": "نحن نقدر رأيك. كيف كانت تجربتك مع ترينديفاي؟",
        "ratingLabel": "تقييمك",
        "commentLabel": "رأيك",
        "commentPlaceholder": "أخبرنا ما الذي أعجبك أو كيف يمكننا التحسن...",
        "submit": "إرسال التقييم",
        "success": "شكراً لك! تم إرسال تقييمك بنجاح."
      },
      "common": {
        "loading": "جاري التحميل...",
        "error": "حدث خطأ",
        "addToCart": "أضف إلى السلة",
        "viewDetails": "عرض التفاصيل"
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
