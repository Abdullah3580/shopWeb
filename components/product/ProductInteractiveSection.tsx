'use client';

import { useState } from 'react';
import ProductVariantSelector from '@/components/product/ProductVariantSelector';
import AddToCartButton from '@/components/AddToCartButton';

export default function ProductInteractiveSection({ product }: { product: any }) {
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(product.price);

  const hasDiscount = product.compare_at_price && product.compare_at_price > currentPrice;

  const handleVariantSelect = (variant: any, activePrice: number) => {
    setSelectedVariant(variant);
    setCurrentPrice(activePrice);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl font-bold text-brand-600">৳{currentPrice}</span>
        {hasDiscount && (
          <span className="text-gray-400 line-through">৳{product.compare_at_price}</span>
        )}
      </div>

      {product.variants && product.variants.length > 0 && (
        <div className="mb-6">
          <ProductVariantSelector
            variants={product.variants}
            basePrice={product.price}
            onVariantSelect={handleVariantSelect}
          />
        </div>
      )}

      <AddToCartButton product={{ ...product, price: currentPrice, selectedVariant }} />
    </div>
  );
}