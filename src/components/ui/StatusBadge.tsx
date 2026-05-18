// src/components/ui/StatusBadge.tsx
import { CheckCircle, XCircle } from 'lucide-react';
import type { ProductStatus } from '@/types/product';

interface StatusBadgeProps {
  status: ProductStatus;
  className?: string;
}

/**
 * Visual product status indicator.
 * Available = green pill, Sold = grey strikethrough pill.
 */
export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const isAvailable = status === 'Available';

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border tracking-wide ${
        isAvailable
          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
          : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
      } ${className}`}
    >
      {isAvailable ? (
        <CheckCircle size={12} className="flex-shrink-0" />
      ) : (
        <XCircle size={12} className="flex-shrink-0" />
      )}
      {isAvailable ? 'Available' : 'Sold'}
    </span>
  );
}
