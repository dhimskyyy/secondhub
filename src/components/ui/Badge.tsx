// src/components/ui/Badge.tsx

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'muted';
  className?: string;
}

const variantStyles: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-blue-50 text-blue-600 border-blue-100',
  success: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  warning: 'bg-amber-50 text-amber-600 border-amber-100',
  danger: 'bg-red-50 text-red-600 border-red-100',
  muted: 'bg-slate-100 text-slate-500 border-slate-200',
};

/**
 * Reusable badge for status indicators, condition labels, etc.
 */
export default function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border tracking-wide ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
