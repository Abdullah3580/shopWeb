'use client';

import { useState } from 'react';

interface Variant {
  id: string;
  sku: string;
  attributes: Record<string, string>;
  price: number | null;
  stock: number;
}

export default function ProductVariantSelector({
  variants,
  basePrice,
  onVariantSelect
}: {
  variants: Variant[];
  basePrice: number;
  onVariantSelect: (variant: Variant | null, activePrice: number) => void;
}) {
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({});

  const attributeKeys = Array.from(
    new Set(variants.flatMap((v) => Object.keys(v.attributes)))
  );

  const handleSelect = (key: string, value: string) => {
    const updated = { ...selectedAttrs, [key]: value };
    setSelectedAttrs(updated);

    const matchedVariant = variants.find((v) =>
      Object.entries(updated).every(([k, val]) => v.attributes[k] === val)
    );

    const activePrice = matchedVariant?.price ?? basePrice;
    onVariantSelect(matchedVariant || null, activePrice);
  };

  if (attributeKeys.length === 0) return null;

  return (
    <div className="space-y-4 my-4 border-t border-b py-4">
      {attributeKeys.map((key) => {
        const options = Array.from(new Set(variants.map((v) => v.attributes[key])));
        return (
          <div key={key}>
            <span className="text-sm font-medium text-gray-700 capitalize">{key}:</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {options.map((option) => {
                const isSelected = selectedAttrs[key] === option;
                return (
                  <button
                    key={option}
                    onClick={() => handleSelect(key, option)}
                    className={`px-3 py-1 text-sm border rounded-md transition ${
                      isSelected
                        ? 'border-orange-500 bg-orange-50 text-orange-600 font-semibold'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
