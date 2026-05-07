import { Product } from './types.ts';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Minimalist Linen Shirt',
    description: 'A breathable linen shirt perfect for summer days.',
    price: 89.99,
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1594938333021-348233568607?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1594938384824-022765992383?auto=format&fit=crop&q=80&w=800'
    ],
    category: 'New',
    colors: ['White', 'Beige', 'Navy'],
    sizes: ['S', 'M', 'L', 'XL'],
    rating: 4.5,
  },
  {
    id: '2',
    name: 'Hydrating Glow Serum',
    description: 'A serum that provides deep hydration and a natural glow.',
    price: 45.00,
    image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1617897903246-719242758050?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1620917457221-df6322ca388d?auto=format&fit=crop&q=80&w=800'
    ],
    category: 'Best Seller',
    colors: ['Transparent'],
    sizes: ['30ml', '50ml'],
    rating: 4.8,
  },
  {
    id: '3',
    name: 'Pro Performance Sneakers',
    description: 'High-performance sneakers designed for long-distance running.',
    price: 129.99,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=800'
    ],
    category: 'Offers',
    colors: ['Red', 'Black', 'Blue'],
    sizes: ['40', '41', '42', '43', '44'],
    rating: 4.7,
  }
];

export const COLORS_OPTIONS = [
  'White', 'Black', 'Red', 'Blue', 'Green', 'Yellow', 'Beige', 'Navy', 'Orange', 'Purple', 'Grey'
];

export const SIZES_CLOTHES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
export const SIZES_SHOES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];
export const COSMETIC_SIZES = ['30ml', '50ml', '100ml', '200ml'];
