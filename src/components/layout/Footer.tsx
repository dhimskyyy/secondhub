// src/components/layout/Footer.tsx
import { ShoppingBag } from 'lucide-react';

/**
 * Minimal, elegant footer for the marketplace.
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-100 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <ShoppingBag size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold text-slate-800">SecondHub</span>
          </div>

          {/* Copyright */}
          <p className="text-xs text-slate-400">
            © {currentYear} SecondHub. Platform Jual Beli Barang Bekas Berkualitas.
          </p>
        </div>
      </div>
    </footer>
  );
}
