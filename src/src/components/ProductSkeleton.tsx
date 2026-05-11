import React from 'react';
import { motion } from 'motion/react';

const ProductSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="aspect-[3/4] bg-white/5 rounded-[3rem]" />
      <div className="space-y-2 px-1">
        <div className="h-4 bg-white/10 rounded w-3/4" />
        <div className="h-3 bg-white/5 rounded w-full" />
        <div className="h-3 bg-white/5 rounded w-5/6" />
        <div className="flex justify-between items-end pt-2">
          <div className="h-6 bg-white/10 rounded w-1/4" />
          <div className="h-4 bg-white/5 rounded w-10" />
        </div>
      </div>
    </div>
  );
};

export const ListingSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
};

export default ProductSkeleton;
