// src/components/features/ImageGallery.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ImageOff } from 'lucide-react';
import type { ProductImage } from '@/types/product';

interface ImageGalleryProps {
  images: ProductImage[];
  title: string;
}

/**
 * Product image gallery with thumbnail selector.
 * Uses Next.js Image for optimized loading with blur transitions.
 */
export default function ImageGallery({ images, title }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm aspect-square flex flex-col items-center justify-center text-slate-300 gap-2">
        <ImageOff size={40} />
        <span className="text-sm">Tidak ada foto barang</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm aspect-square relative">
        <Image
          src={images[activeIndex]?.image_url}
          alt={`${title} - View ${activeIndex + 1}`}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain p-4 transition-all duration-300"
          priority
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((img, index) => {
            const isActive = activeIndex === index;
            return (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-20 h-20 rounded-xl overflow-hidden border-2 bg-white flex-shrink-0 transition-all relative ${
                  isActive
                    ? 'border-blue-600 shadow-md shadow-blue-100 scale-95'
                    : 'border-slate-200 hover:border-blue-400'
                }`}
              >
                <Image
                  src={img.image_url}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
                {img.is_primary && (
                  <span className="absolute top-0 left-0 bg-blue-600 text-white text-[7px] px-1.5 py-0.5 font-bold rounded-br-lg uppercase">
                    Main
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
