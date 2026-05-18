// src/components/layout/DashboardSidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, ShoppingCart, UserCircle, Plus } from 'lucide-react';

const navItems = [
  { href: '/dashboard/listings', label: 'Iklan Saya', icon: Package },
  { href: '/dashboard/purchases', label: 'Pembelian Saya', icon: ShoppingCart },
  { href: '/dashboard/profile', label: 'Pengaturan Profil', icon: UserCircle },
];

/**
 * Sidebar navigation for the unified Dashboard.
 * Highlights the active route automatically.
 */
export default function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* CTA */}
        <div className="p-3 border-t border-slate-100">
          <Link
            href="/sell"
            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium transition-all hover:shadow-md hover:shadow-blue-200/50"
          >
            <Plus size={16} />
            Pasang Iklan Baru
          </Link>
        </div>
      </div>
    </aside>
  );
}
