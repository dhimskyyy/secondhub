// components/ProductCard.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  condition: string;
  city: string;
  createdAt: string;
  primaryImage: string;
}

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
  
  // STATE DEBOUNCE: Mengunci klik ganda jika proses navigasi sedang berjalan
  const [isNavigating, setIsNavigating] = useState(false);

  const handleCardClick = () => {
    if (isNavigating) return; // Abaikan jika user klik lagi secara brutal
    
    setIsNavigating(true); // Kunci tombol akses klik
    router.push(`/products/${id}`);
    
    // Buka kembali kunci setelah 1.5 detik jika terjadi kegagalan jaringan
    setTimeout(() => setIsNavigating(false), 1500);
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group ${
        isNavigating ? 'opacity-70 pointer-events-none' : ''
      }`}
    >
      <div className="aspect-square bg-gray-100 relative overflow-hidden flex items-center justify-center text-gray-400 text-xs font-medium">
        {primaryImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={primaryImage} 
            alt={title} 
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <span>Tidak ada foto</span>
        )}
        {isNavigating && (
          <div className="absolute inset-0 bg-white/40 flex items-center justify-center text-blue-600 font-bold text-xs">
            Memuat...
          </div>
        )}
      </div>
      
      <div className="p-3">
        <span className="text-[10px] font-bold text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-md">
          {condition}
        </span>
        <h3 className="font-medium text-gray-800 text-sm mt-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>
        <p className="font-bold text-gray-900 text-base mt-1">
          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price)}
        </p>
        <div className="flex items-center justify-between text-[11px] text-gray-400 mt-3 pt-2 border-t border-gray-50">
          <span>{city || 'Indonesia'}</span>
          <span>{new Date(createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
        </div>
      </div>
    </div>
  );
}