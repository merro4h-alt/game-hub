export interface Product {
  id: string;
  variantId?: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  colorPrices?: Record<string, number>;
  colorDiscountPrices?: Record<string, number>;
  image: string;
  images?: string[];
  category: 'New' | 'Best Seller' | 'Offers' | 'Imported';
  colors: string[];
  colorImages?: Record<string, string>;
  sizes: string[];
  rating: number;
  stock: number;
  reviews?: any[];
  supplierName?: string;
  supplierUrl?: string;
  videoUrl?: string;
  createdAt?: any;
}

export interface CartItem extends Product {
  quantity: number;
  selectedColor: string;
  selectedSize: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  createdAt: any; // Firestore Timestamp
  shippingAddress: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    zipCode: string;
  };
  trackingId?: string;
  courierTrackingNumber?: string;
  paymentMethod?: 'cod' | 'bank_transfer' | 'card' | 'crypto' | 'bank' | 'googlepay' | 'applepay';
}

export interface BankDetails {
  bankName: string;
  accountHolder: string;
  iban: string;
  swiftCode?: string;
  isAvailable: boolean;
}

export interface Campaign {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  link: string;
  isActive: boolean;
  startDate?: any;
  endDate?: any;
  type: 'hero' | 'banner' | 'popup';
}

export interface WishlistItem {
  productId: string;
  addedPrice: number;
  currentPrice?: number;
  createdAt: any;
}
