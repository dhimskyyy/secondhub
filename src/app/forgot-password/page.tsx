// src/app/forgot-password/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useSupabase } from '@/hooks/useSupabase';

export default function ForgotPasswordPage() {
  const supabase = useSupabase();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12">
      <div className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/40 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <ShoppingBag size={20} className="text-white" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-center text-slate-900 mb-1">
          Lupa Password
        </h2>
        <p className="text-slate-500 text-xs text-center mb-6">
          Masukkan email Anda untuk menerima tautan reset password
        </p>

        {sent ? (
          /* Success State */
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle size={32} className="text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Email Terkirim!</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Kami telah mengirimkan tautan reset password ke{' '}
              <strong className="text-slate-900">{email}</strong>.
            </p>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-xs text-blue-700 leading-relaxed">
                📧 Silakan cek inbox email Anda (termasuk folder Spam).
                Klik tautan dalam email untuk mengatur password baru.
              </p>
            </div>
            <Link
              href="/login"
              className="mt-4 inline-flex items-center gap-2 text-sm text-blue-600 font-semibold hover:underline"
            >
              <ArrowLeft size={14} />
              Kembali ke Login
            </Link>
          </div>
        ) : (
          /* Form */
          <>
            {error && (
              <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl mb-4 border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="email@contoh.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 rounded-xl text-sm transition-all shadow-md hover:shadow-lg hover:shadow-blue-200/50 disabled:opacity-50"
              >
                {loading ? 'Mengirim...' : 'Kirim Tautan Reset'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft size={12} />
                Kembali ke Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
