// src/components/ui/Skeleton.tsx
'use client';

interface SkeletonProps {
  className?: string;
}

/**
 * Premium skeleton loading placeholder with smooth pulse animation.
 * Uses Tailwind's animate-pulse for a polished loading experience.
 */
export default function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] ${className}`}
    />
  );
}
