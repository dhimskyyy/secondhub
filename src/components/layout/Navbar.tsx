// src/components/layout/Navbar.tsx
'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import Avatar from '@/components/ui/Avatar';
import Skeleton from '@/components/ui/Skeleton';
import {
  LogOut,
  LayoutDashboard,
  Plus,
  LogIn,
  ShoppingBag,
} from 'lucide-react';

/**
 * Global navigation bar.
 * Rendered ONCE in the root layout — never unmounts during page navigation.
 * Uses the AuthProvider context for reactive user state without flickering.
 */
export default function Navbar() {
  const { user, profile, isLoading, signOut } = useAuth();

  const handleLogout = async () => {
    const confirmed = window.confirm('Apakah Anda yakin ingin keluar?');
    if (!confirmed) return;
    // signOut now does hard navigation internally
    await signOut();
  };

  return (
    <nav className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 group"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <ShoppingBag size={16} className="text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight">
            SecondHub
          </span>
        </Link>

        {/* Right Menu */}
        <div className="flex items-center gap-3">
          {isLoading ? (
            /* Skeleton placeholder — prevents "Pengguna" flicker */
            <div className="flex items-center gap-3">
              <Skeleton className="w-20 h-4 rounded-md" />
              <Skeleton className="w-8 h-8 rounded-full" />
            </div>
          ) : user ? (
            /* Authenticated state */
            <div className="flex items-center gap-3">
              {/* User info */}
              <div className="hidden sm:flex items-center gap-2.5">
                <Avatar
                  src={profile?.avatar_url}
                  alt={profile?.full_name || 'User'}
                  size="sm"
                  fallbackInitial={profile?.full_name}
                />
                <span className="text-xs text-slate-600 max-w-[120px] truncate">
                  Halo,{' '}
                  <strong className="text-slate-900 font-semibold">
                    {profile?.full_name || user.email?.split('@')[0] || 'Pengguna'}
                  </strong>
                </span>
              </div>

              {/* Dashboard link */}
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/70 px-3 py-2 rounded-xl transition-colors"
              >
                <LayoutDashboard size={14} />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100/70 px-3 py-2 rounded-xl transition-colors"
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          ) : (
            /* Guest state */
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors"
            >
              <LogIn size={16} />
              Masuk
            </Link>
          )}

          {/* CTA — Jual Barang */}
          <Link
            href="/sell"
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-md hover:shadow-blue-200/50"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Jual Barang</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
