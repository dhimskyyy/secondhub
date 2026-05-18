// src/components/features/ProductCard.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import type { ProductCondition } from '@/types/product';

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  condition: ProductCondition;
  city: string;
  createdAt: string;
  primaryImage?: string;
}

const conditionVariant: Record<ProductCondition, 'default' | 'success' | 'warning' | 'danger'> = {
  'Like New': 'success',
  'Mulus': 'default',
  'Minus Pemakaian': 'warning',
  'Rusak': 'danger',
};

/**
 * Product card with click-lock debounce to prevent double navigation.
 * Uses Next.js Image for optimized loading.
 */
export default function ProductCard({
  id,
  title,
  price,
  condition,
  city,
  createdAt,
  primaryImage,
}: ProductCardProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleCardClick = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    router.push(`/products/${id}`);
    setTimeout(() => setIsNavigating(false), 1500);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer group ${
        isNavigating ? 'opacity-60 pointer-events-none scale-[0.98]' : ''
      }`}
    >
      {/* Image */}
      <div className="aspect-square bg-slate-50 relative overflow-hidden">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs font-medium">
            Tidak ada foto
          </div>
        )}
        {isNavigating && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <Badge variant={conditionVariant[condition]}>{condition}</Badge>
        <h3 className="font-medium text-slate-800 text-sm line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug">
          {title}
        </h3>
        <p className="font-bold text-slate-900 text-base">
          {new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
          }).format(price)}
        </p>
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-50">
          <span className="inline-flex items-center gap-0.5">
            <MapPin size={10} />
            {city || 'Indonesia'}
          </span>
          <span>
            {new Date(createdAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
