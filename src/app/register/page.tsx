// src/app/register/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Mail, Lock, User, Phone, MapPin, Eye, EyeOff, CheckCircle, X } from 'lucide-react';
import { useSupabase } from '@/hooks/useSupabase';

export default function RegisterPage() {
  const supabase = useSupabase();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Client-side validations
    if (password.length < 6) {
      setError('Password minimal 6 karakter.');
      setLoading(false);
      return;
    }

    if (!phone.match(/^08\d{8,13}$/)) {
      setError('Format nomor WhatsApp tidak valid. Gunakan format 08xxxxxxxxxx.');
      setLoading(false);
      return;
    }

    try {
      // Register with Supabase Auth — email confirmation will be sent via SMTP (Brevo)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Data passed here is stored in auth.users.raw_user_meta_data
          // AND can be used by the email redirect callback
          data: {
            full_name: fullName,
            phone_number: phone,
            city: city,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (authError) throw authError;

      // Insert profile data immediately so it's ready when user verifies
      if (authData?.user) {
        const { error: profileError } = await supabase.from('profiles').upsert([
          {
            id: authData.user.id,
            full_name: fullName,
            phone_number: phone,
            city: city,
          },
        ]);
        if (profileError) {
          console.warn('[Register] Profile insert warning:', profileError.message);
          // Don't throw — registration succeeded, profile can be filled later
        }
      }

      // Show beautiful success modal
      setShowSuccessModal(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan.';
      if (msg.includes('already registered')) {
        setError('Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 py-12">
      {/* ============================================
          SUCCESS MODAL — Email Verification Required
          ============================================ */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-8 text-center relative animate-in fade-in zoom-in-95 duration-300">
            <button
              onClick={() => setShowSuccessModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={18} />
            </button>

            {/* Animated Checkmark */}
            <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle size={32} className="text-emerald-600" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Pendaftaran Berhasil! 🎉
            </h3>

            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Kami telah mengirimkan email konfirmasi ke{' '}
              <strong className="text-slate-900">{email}</strong>.
            </p>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
              <p className="text-xs text-blue-700 leading-relaxed">
                📧 Silakan <strong>cek inbox email</strong> Anda (termasuk folder Spam)
                dan klik tautan verifikasi untuk melanjutkan proses masuk ke SecondHub.
              </p>
            </div>

            <p className="text-[11px] text-slate-400">
              Setelah verifikasi, Anda akan otomatis diarahkan ke halaman utama SecondHub.
            </p>

            <Link
              href="/login"
              className="mt-5 inline-block w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 rounded-xl text-sm transition-all shadow-md hover:shadow-lg"
            >
              Kembali ke Halaman Login
            </Link>
          </div>
        </div>
      )}

      {/* ============================================
          REGISTRATION FORM
          ============================================ */}
      <div className="bg-white p-8 sm:p-10 rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-200/40 w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <ShoppingBag size={20} className="text-white" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-center text-slate-900 mb-1">
          Buat Akun Baru
        </h2>
        <p className="text-slate-500 text-xs text-center mb-6">
          Bergabung untuk mulai berjualan &amp; berbelanja
        </p>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl mb-4 border border-red-100">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Nama Lengkap</label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Masukkan nama lengkap"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">No. WhatsApp</label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                placeholder="08xxxxxxxxxx"
                required
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* City */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Kota Domisili</label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Contoh: Purwokerto"
                required
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>

          {/* Email */}
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

          {/* Password */}
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1.5">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Minimal 6 karakter"
                minLength={6}
                className="w-full pl-10 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 rounded-xl text-sm transition-all shadow-md hover:shadow-lg hover:shadow-blue-200/50 disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Daftar Sekarang'}
          </button>
        </form>

        {/* Toggle to Login */}
        <div className="mt-6 text-center text-xs text-slate-500">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-blue-600 font-semibold hover:underline">
            Masuk di sini
          </Link>
        </div>
      </div>
    </div>
  );
}
