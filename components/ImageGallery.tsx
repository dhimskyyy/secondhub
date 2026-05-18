// components/ImageGallery.tsx
'use client';

import { useState } from 'react';

interface ImageGalleryProps {
  images: { image_url: string; is_primary: boolean }[];
  title: string;
}

export default function ImageGallery({ images, title }: ImageGalleryProps) {
  // State untuk melacak foto mana yang sedang aktif ditampilkan (default index 0)
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm aspect-square flex items-center justify-center text-gray-400 text-sm">
        Tidak ada foto barang
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 1. TAMPILAN FOTO UTAMA UTAMA BESAR */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm aspect-square flex items-center justify-center p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={images[activeIndex]?.image_url} 
          alt={`${title} - View ${activeIndex + 1}`} 
          className="object-contain w-full h-full max-h-[450px] transition-all duration-300"
        />
      </div>

      {/* 2. DERETAN THUMBNAIL FOTO DI BAWAH (Hanya muncul jika foto lebih dari 1) */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200">
          {images.map((img, index) => {
            const isActive = activeIndex === index;
            return (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-20 h-20 rounded-xl overflow-hidden border-2 bg-white flex-shrink-0 transition-all relative ${
                  isActive 
                    ? 'border-blue-600 shadow-sm scale-95' 
                    : 'border-gray-200 hover:border-blue-400'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={img.image_url} 
                  alt={`Thumbnail ${index + 1}`} 
                  className="object-cover w-full h-full"
                />
                {img.is_primary && (
                  <span className="absolute top-0 left-0 bg-blue-600 text-white text-[8px] px-1 font-bold rounded-br-md uppercase">
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