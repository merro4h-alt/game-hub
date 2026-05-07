export interface Product {
  id: string;
  variantId?: string;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  image: string;
  images?: string[];
  category: 'New' | 'Best Seller' | 'Offers';
  colors: string[];
  colorImages?: Record<string, string>;
  sizes: string[];
  rating: number;
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
    address: string;
    city: string;
    country: string;
    zipCode: string;
  };
  trackingId?: string;
}
