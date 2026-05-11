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
        "trackOrder": "Track Order",
        "dropShipping": "Drop Shipping"
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
        "newsletter": "Newsletter",
        "newsletterDesc": "Join our elite circle for exclusive drops and design insights.",
        "specGuarantee": "Specification Guarantee",
        "specGuaranteeDesc": "We guarantee that all products strictly match the photos and specifications provided. If you receive a different product, you are entitled to a full refund or a free replacement.",
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
        "viewDetails": "View Details",
        "save": "Save",
        "cancel": "Cancel",
        "search": "Search...",
        "noData": "No data available",
        "admin": "Admin",
        "orderHistory": "Order History",
        "login": "Sign In",
        "send": "Send",
        "total": "Total",
        "status": "Status",
        "items": "Items",
        "date": "Date",
        "qty": "Qty"
      },
      "orders": {
        "history": "Order History",
        "historySubtitle": "Track your past and current orders",
        "noOrdersTitle": "No orders yet",
        "noOrdersDesc": "It looks like you haven't placed any orders yet.",
        "startShopping": "Start Shopping",
        "orderId": "Order ID",
        "tracking": "Tracking",
        "notProvided": "Not provided yet"
      },
      "tracking": {
        "title": "Track Your Order",
        "subtitle": "Enter your tracking number to see the current status of your shipment.",
        "placeholder": "Tracking Number (e.g. AH-1234-5678)",
        "trackBtn": "Track Now",
        "orderNotFound": "Order not found. Please check your tracking number.",
        "details": "Order Details",
        "shippingTo": "Shipping To",
        "viaNetwork": "via {{provider}} Network"
      },
      "about": {
        "since": "Since 2026",
        "heroTitle1": "Redefining",
        "heroTitleItalic": "Style",
        "heroTitle2": "& Integrity",
        "heroDesc": "Trendifi was born from a simple vision: to create a space where premium craftsmanship meets conscious design. We believe that true luxury lies in the details.",
        "philosophyTitle": "Our Philosophy",
        "philosophyDesc": "We don't just sell products; we curate experiences. Each item in our collection is selected for its unique story, superior quality, and aesthetic longevity.",
        "precision": "Precision",
        "precisionDesc": "Attention to every thread and pixel.",
        "passion": "Passion",
        "passionDesc": "Curated with love by style experts.",
        "innovation": "Innovation",
        "innovationDesc": "Pushing boundaries in e-commerce.",
        "sustainability": "Sustainability",
        "sustainabilityDesc": "Responsible sourcing for a better future."
      },
      "contact": {
        "title": "Get in",
        "titleItalic": "Touch",
        "subtitle": "Have a question about an order or just want to say hello? Our team is always here to help you.",
        "emailTitle": "Email Us",
        "phoneTitle": "Call Us",
        "visitTitle": "Visit Studio",
        "address": "88 Design Avenue, London",
        "firstName": "First Name",
        "lastName": "Last Name",
        "emailAddress": "Email Address",
        "message": "Message",
        "send": "Send Message"
      },
      "admin": {
        "dashboard": "Admin Dashboard",
        "analytics": "Analytics",
        "orders": "Orders",
        "products": "Products",
        "winning": "Winning Products",
        "magicImport": "Magic Import",
        "importPlaceholder": "Paste product URL (AliExpress, Amazon...)",
        "extract": "Extract Data",
        "importSuccess": "Data extracted successfully! Review and save.",
        "importError": "Extraction failed. The site might be blocking requests, try manual entry.",
        "restrictedArea": "Admin Area Only",
        "loginWithGoogle": "Login with Google",
        "logout": "Logout & Switch Account",
        "adminStatus": "Admin Status",
        "howToFixLogin": "How to fix login",
        "smartImport": "AI SMART IMPORT",
        "smartImportDesc": "Paste an AliExpress link to extract data instantly",
        "winningExplorer": "WINNING PRODUCTS EXPLORER",
        "winningExplorerDesc": "Curated products based on global market trends and high conversion rates.",
        "lastSync": "LAST SYNC",
        "supplierCost": "SUPPLIER COST",
        "viewSource": "SOURCE",
        "importToStore": "IMPORT",
        "revenueFlow": "Revenue Flow",
        "distribution": "Distribution",
        "recentActivity": "Recent Activity",
        "viewAllOrders": "View All Orders",
        "noRecentOrders": "No recent orders",
        "clientDetails": "Client Details",
        "items": "Items",
        "value": "Value",
        "supplierActions": "Supplier Actions",
        "date": "Date",
        "manualFulfillment": "Manual fulfillment",
        "stepsToFixAccess": "Steps to Fix Access",
        "authorizedDomains": "Authorized Domains",
        "howToFixLoginDesc": "If login fails or shows an error, you must add your domains (like ahstore.shop) to the Firebase whitelist in your console settings.",
        "welcomeAdmin": "Welcome back, {{name}}",
        "inventory": "Inventory",
        "stats": {
          "sales": "Total Sales",
          "orders": "Total Orders",
          "users": "Active Users",
          "inventory": "Inventory"
        },
        "recentOrders": "Recent Orders",
        "manageProducts": "Manage Products",
        "addProduct": "Add New Product",
        "winningSubtitle": "Curated winning products for your store"
      },
      "dropshipping": {
        "title": "Join Our Dropshipping Program",
        "subtitle": "Smart Global Supply Chain",
        "smartSupplyChain": "SMART SUPPLY CHAIN",
        "heroTitle": "CONNECTING YOU TO GLOBAL SUPPLIERS",
        "heroDesc": "Our business model focuses on selecting winning products and forwarding your order directly to the factory for best pricing and quality.",
        "getStarted": "Get Started",
        "globalCoverage": "Global Coverage",
        "factoryToDoor": "Factory to Doorstep",
        "productJourney": "YOUR PRODUCT JOURNEY",
        "fromFactoryDirect": "FROM FACTORY DIRECT TO YOU",
        "applyNow": "APPLY NOW",
        "backToHome": "Back to Home",
        "fullAddress": "Full Address",
        "storeUrlOptional": "Store URL (Optional)",
        "experienceLevels": {
          "none": "No experience",
          "intermediate": "Intermediate",
          "expert": "Expert"
        },
        "success": {
          "title": "Application Received Successfully!",
          "desc1": "Thank you for your interest in Trendifi. Our team is currently reviewing your information to ensure it matches our partnership criteria.",
          "desc2": "One of our specialists will contact you via phone or email within 24 hours to provide full details and start your journey as a merchant."
        },
        "globalModal": {
          "title": "GLOBAL COVERAGE NETWORK",
          "desc": "We connect you with the largest global supply network to ensure your order arrives as quickly and cost-effectively as possible.",
          "trackDesc": "Track your order every step of the way from factory to your doorstep with live updates.",
          "understood": "Understood"
        },
        "benefits": {
          "sourcing": "Global Sourcing",
          "quality": "Tested Quality",
          "auto": "Auto-Fulfillment",
          "direct": "Direct Shipping"
        },
        "form": {
          "title": "Apply for Early Access",
          "fullName": "Full Name",
          "phone": "Phone Number",
          "email": "Email Address",
          "experience": "Experience Level",
          "submit": "Send Application"
        }
      },
      "checkout": {
        "title": "Secure Checkout",
        "subtitle": "Select country and payment method",
        "summary": "Order Summary",
        "total": "Total to Pay",
        "shippingInfo": "Shipping Info",
        "paymentMethod": "Payment Method",
        "confirm": "Confirm Order",
        "card": "Credit Card",
        "mada": "Mada Card",
        "applePay": "Apple Pay",
        "cod": "Cash on Delivery",
        "bnpl": "Installments",
        "wallet": "E-Wallet",
        "bank": "Bank Transfer",
        "payoneer": "Payoneer",
        "paypal": "PayPal",
        "fullName": "Full Name",
        "phone": "Phone Number",
        "email": "Email (Optional)",
        "address": "Shipping Address",
        "detailedAddress": "Detailed Address",
        "addressPlaceholder": "District, Street, Landmarks...",
        "country": "Country",
        "shippingProvider": "Shipping Provider",
        "deliveryWithin": "Delivery within",
        "smartFulfillment": "Smart Global Fulfillment",
        "smartFulfillmentDesc": "Your order is automatically processed through a global supplier network to ensure quality and the best direct shipping rates.",
        "processing": "Processing...",
        "success": "Order Successful!",
        "successSub": "Your order is being processed and we will contact you.",
        "trackingId": "Your Tracking Number:",
        "trackNow": "Track Order Now",
        "secure": "Encrypted and Secure",
        "cancel": "Cancel",
        "orderTotal": "Order Total:",
        "processedViaNetwork": "Processed via Global Supplier Network",
        "cardholder": "Cardholder"
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
        "trackOrder": "تتبع الطلب",
        "dropShipping": "الدروبشيبينج"
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
        "newsletter": "النشرة البريدية",
        "newsletterDesc": "انضم إلى دائرتنا النخبوية للحصول على أحدث المنتجات الحصرية.",
        "specGuarantee": "ضمان مطابقة المواصفات",
        "specGuaranteeDesc": "نحن نضمن أن جميع المنتجات مطابقة تماماً للصور والمواصفات المذكورة. في حال استلامك لمنتج مختلف، يحق لك استرجاع المبلغ كاملاً أو استبدال المنتج مجاناً.",
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
        "viewDetails": "عرض التفاصيل",
        "save": "حفظ",
        "cancel": "إلغاء",
        "search": "بحث...",
        "noData": "لا توجد بيانات",
        "admin": "مسؤول",
        "orderHistory": "تاريخ الطلبات",
        "login": "تسجيل الدخول",
        "send": "إرسال",
        "total": "الإجمالي",
        "status": "الحالة",
        "items": "المنتجات",
        "date": "التاريخ",
        "qty": "الكمية"
      },
      "orders": {
        "history": "تاريخ الطلبات",
        "historySubtitle": "تتبع طلباتك السابقة والحالية",
        "noOrdersTitle": "لا يوجد طلبات بعد",
        "noOrdersDesc": "يبدو أنك لم تقم بأي طلبات حتى الآن.",
        "startShopping": "ابدأ التسوق",
        "orderId": "رقم الطلب",
        "tracking": "التتبع",
        "notProvided": "لم يتم التوفير بعد"
      },
      "tracking": {
        "title": "تتبع طلبك",
        "subtitle": "أدخل رقم التتبع الخاص بك لمعرفة حالة طلبك الحالية.",
        "placeholder": "رقم التتبع (مثال: AH-1234-5678)",
        "trackBtn": "تتبع الآن",
        "orderNotFound": "لم يتم العثور على الطلب. يرجى التحقق من رقم التتبع.",
        "details": "تفاصيل الطلب",
        "shippingTo": "يشحن إلى",
        "viaNetwork": "عبر شبكة {{provider}}"
      },
      "about": {
        "since": "منذ 2026",
        "heroTitle1": "إعادة تعريف",
        "heroTitleItalic": "الأناقة",
        "heroTitle2": "والنزاهة",
        "heroDesc": "ولدت Trendifi من رؤية بسيطة: إنشاء مساحة حيث تجتمع الحرفية المتميزة مع التصميم الواعي. نحن نؤمن بأن الفخامة الحقيقية تكمن في التفاصيل.",
        "philosophyTitle": "فلسفتنا",
        "philosophyDesc": "نحن لا نبيع المنتجات فحسب؛ بل نصنع التجارب. يتم اختيار كل قطعة في مجموعتنا لقصتها الفريدة وجودتها الفائقة وجمالها الدائم.",
        "precision": "الدقة",
        "precisionDesc": "الاهتمام بكل خيط وبكسل.",
        "passion": "الشغف",
        "passionDesc": "منسقة بحب من قبل خبراء الأناقة.",
        "innovation": "الابتكار",
        "innovationDesc": "تجاوز الحدود في التجارة الإلكترونية.",
        "sustainability": "الاستدامة",
        "sustainabilityDesc": "مصادر مسؤولة لمستقبل أفضل."
      },
      "contact": {
        "title": "ابق على",
        "titleItalic": "تواصل",
        "subtitle": "لديك سؤال حول طلب أو تريد فقط إلقاء التحية؟ فريقنا هنا دائماً لمساعدتك.",
        "emailTitle": "راسلنا",
        "phoneTitle": "اتصل بنا",
        "visitTitle": "زيارة الاستوديو",
        "address": "شارع التصميم 88، لندن",
        "firstName": "الاسم الأول",
        "lastName": "اسم العائلة",
        "emailAddress": "البريد الإلكتروني",
        "message": "الرسالة",
        "send": "إرسال الرسالة"
      },
      "admin": {
        "dashboard": "لوحة التحكم",
        "analytics": "التحليلات",
        "orders": "الطلبات",
        "products": "المنتجات",
        "winning": "منتجات رابحة",
        "magicImport": "استيراد سحري",
        "importPlaceholder": "أدخل رابط المنتج (AliExpress, Amazon...)",
        "extract": "استخراج البيانات",
        "importSuccess": "تم استخراج البيانات بنجاح! راجعها ثم اضغط حفظ.",
        "importError": "فشل الاستخراج. الموقع قد يحظر الطلبات التلقائية، جرب إدخال البيانات يدوياً.",
        "restrictedArea": "منطقة المسؤول فقط",
        "loginWithGoogle": "تسجيل الدخول باستخدام جوجل",
        "logout": "تسجيل الخروج وتبديل الحساب",
        "adminStatus": "حالة المسؤول",
        "howToFixLogin": "كيفية حل مشكلة تسجيل الدخول",
        "smartImport": "الاستيراد الذكي (AI)",
        "smartImportDesc": "الصق رابط المنتج من AliExpress لاستخراج البيانات فوراً",
        "winningExplorer": "مستكشف المنتجات الرابحة",
        "winningExplorerDesc": "منتجات مختارة بعناية بناءً على ترندات السوق العالمي ومعدلات التحويل العالية.",
        "lastSync": "آخر تحديث",
        "supplierCost": "سعر المورد",
        "viewSource": "عرض المصدر",
        "importToStore": "إضافة للمتجر",
        "revenueFlow": "تدفق الإيرادات",
        "distribution": "التوزيع",
        "recentActivity": "النشاط الأخير",
        "viewAllOrders": "عرض جميع الطلبات",
        "noRecentOrders": "لا توجد طلبات حديثة",
        "clientDetails": "تفاصيل العميل",
        "items": "العناصر",
        "value": "القيمة",
        "supplierActions": "إجراءات المورد",
        "date": "التاريخ",
        "manualFulfillment": "تنفيذ يدوي",
        "stepsToFixAccess": "خطوات إصلاح الوصول",
        "authorizedDomains": "النطاقات المصرح بها",
        "howToFixLoginDesc": "إذا فشل تسجيل الدخول أو ظهر خطأ، يجب عليك إضافة النطاقات الخاصة بك (مثل ahstore.shop) إلى القائمة البيضاء في إعدادات Firebase.",
        "welcomeAdmin": "مرحباً بك مجدداً، {{name}}",
        "inventory": "المخزون",
        "stats": {
          "sales": "إجمالي المبيعات",
          "orders": "إجمالي الطلبات",
          "users": "المستخدمين النشطين",
          "inventory": "المخزون"
        },
        "recentOrders": "أحدث الطلبات",
        "manageProducts": "إدارة المنتجات",
        "addProduct": "إضافة منتج جديد",
        "winningSubtitle": "منتجات مختارة بعناية لمتجرك بناءً على ترندات السوق"
      },
      "dropshipping": {
        "title": "انضم لبرنامج الدروبشيبينج",
        "subtitle": "سلسلة توريد عالمية ذكية",
        "smartSupplyChain": "سلسلة التوريد الذكية",
        "heroTitle": "نصلك بأفضل الموردين حول العالم",
        "heroDesc": "يعتمد نموذج عملنا على اختيار المنتجات الفائزة (Winning Products) وتحويل طلبك مباشرة للمصنع لضمان أقل سعر وأعلى جودة.",
        "getStarted": "ابدأ الآن",
        "globalCoverage": "تغطية عالمية",
        "factoryToDoor": "من المصنع إلى الباب",
        "productJourney": "رحلة منتجك",
        "fromFactoryDirect": "من المصنع إليك مباشرة",
        "applyNow": "سجل الآن",
        "backToHome": "العودة للرئيسية",
        "fullAddress": "العنوان بالكامل",
        "storeUrlOptional": "رابط متجرك (اختياري)",
        "experienceLevels": {
          "none": "لا توجد خبرة",
          "intermediate": "خبرة متوسطة",
          "expert": "خبير"
        },
        "success": {
          "title": "تم استلام طلب الانضمام بنجاح!",
          "desc1": "نشكرك على اهتمامك بـ Trendifi. يقوم فريقنا حالياً بمراجعة معلوماتك للتأكد من مطابقتها لمعايير الشراكة لدينا.",
          "desc2": "سيقوم أحد مستشارينا بالتواصل معك عبر الهاتف أو البريد الإلكتروني خلال 24 ساعة لتزويدك بكافة التفاصيل وبدء عملك كتاجر."
        },
        "globalModal": {
          "title": "شبكة التغطية العالمية",
          "desc": "نحن نربطك بأكبر شبكة توريد عالمية لضمان وصول طلبك بأسرع وقت وأقل تكلفة.",
          "trackDesc": "تتبع طلبك في كل خطوة من المصنع وحتى باب منزلك مع تحديثات مباشرة.",
          "understood": "فهمت"
        },
        "benefits": {
          "sourcing": "توفير عالمي",
          "quality": "جودة مختبرة",
          "auto": "طلب تلقائي",
          "direct": "توصيل مباشر"
        },
        "form": {
          "title": "طلب انضمام",
          "fullName": "الاسم الكامل",
          "phone": "رقم الهاتف",
          "email": "البريد الإلكتروني",
          "experience": "مستوى الخبرة",
          "submit": "إرسال الطلب"
        }
      },
      "checkout": {
        "title": "الدفع الآمن",
        "subtitle": "حدد الدولة وطريقة الدفع",
        "summary": "ملخص الطلب",
        "total": "الإجمالي المطلوب",
        "shippingInfo": "معلومات الشحن",
        "paymentMethod": "طريقة الدفع",
        "confirm": "تأكيد الطلب",
        "card": "بطاقة ائتمان",
        "mada": "بطاقة مـدى",
        "applePay": "Apple Pay",
        "cod": "الدفع عند الاستلام",
        "bnpl": "تقسيط (تابي/تمارا)",
        "wallet": "محفظة إلكترونية",
        "bank": "تحويل بنكي",
        "payoneer": "بايونير (Payoneer)",
        "paypal": "باي بال",
        "fullName": "الاسم بالكامل",
        "phone": "رقم الهاتف",
        "email": "البريد (اختياري)",
        "address": "عنوان الشحن",
        "detailedAddress": "العنوان بالتفصيل",
        "addressPlaceholder": "المنطقة، الزقاق، المعالم القريبة...",
        "country": "الدولة",
        "shippingProvider": "شركة الشحن",
        "deliveryWithin": "توصيل خلال",
        "smartFulfillment": "نظام شحن عالمي ذكي",
        "smartFulfillmentDesc": "يتم معالجة طلبك تلقائياً عبر أكبر شبكة موردين عالمية لضمان الجودة وأفضل سعر شحن مباشر.",
        "processing": "جاري المعالجة...",
        "success": "تم الطلب بنجاح!",
        "successSub": "طلبك قيد التنفيذ وسنقوم بالتواصل معك.",
        "trackingId": "رقم التتبع الخاص بك:",
        "trackNow": "تتبع طلبك الآن",
        "secure": "مشفر وآمن",
        "cancel": "إلغاء",
        "orderTotal": "إجمالي الطلب:",
        "processedViaNetwork": "تتم المعالجة عبر شبكة الموردين العالمية",
        "cardholder": "صاحب البطاقة"
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
    react: {
      useSuspense: false, // Prevent white/black screens during translation loading
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
