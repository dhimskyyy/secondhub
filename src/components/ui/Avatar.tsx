// src/components/ui/Avatar.tsx
import Image from 'next/image';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  fallbackInitial?: string;
  className?: string;
}

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-lg',
};

const iconSizeMap = {
  sm: 14,
  md: 18,
  lg: 28,
};

/**
 * User avatar with image or initial/icon fallback.
 */
export default function Avatar({
  src,
  alt = 'Avatar',
  size = 'md',
  fallbackInitial,
  className = '',
}: AvatarProps) {
  const sizeClass = sizeMap[size];

  if (src) {
    return (
      <div className={`${sizeClass} relative rounded-full overflow-hidden ring-2 ring-white shadow-sm flex-shrink-0 ${className}`}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={size === 'lg' ? '64px' : size === 'md' ? '40px' : '32px'}
          className="object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold uppercase flex-shrink-0 shadow-sm ${className}`}
    >
      {fallbackInitial ? (
        fallbackInitial.charAt(0)
      ) : (
        <User size={iconSizeMap[size]} />
      )}
    </div>
  );
}
