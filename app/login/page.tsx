// app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../src/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // State untuk form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegister) {
        // 1. PROSES REGISTER (Supabase Auth)
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) throw authError;

        // 2. MASUKKAN DATA KE TABEL PROFILES (Jika auth sukses)
        if (authData?.user) {
          const { error: profileError } = await supabase.from('profiles').insert([
            {
              id: authData.user.id, // Mengambil ID dari auth user yang baru dibuat
              full_name: fullName,
              phone_number: phone,
              city: city,
            },
          ]);

          if (profileError) throw profileError;
        }
        
        alert('Registrasi berhasil! Silakan cek email untuk verifikasi atau langsung login.');
        setIsRegister(false);
      } else {
        // 3. PROSES LOGIN
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (loginError) throw loginError;

        // Jika login sukses, lempar ke halaman utama
        router.push('/');
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 text-gray-900">
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-blue-600 text-center mb-2">SecondHub</h2>
        <p className="text-gray-500 text-sm text-center mb-6">
          {isRegister ? 'Buat akun untuk mulai berjualan' : 'Masuk untuk berbelanja & berjualan'}
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-xs p-3 rounded-xl mb-4 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {isRegister && (
            <>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Nama Lengkap</label>
                <input type="text" required className="w-full px-4 py-2 border rounded-xl text-sm outline-none focus:border-blue-500" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">No. WhatsApp</label>
                <input type="tel" placeholder="08xxxxx" required className="w-full px-4 py-2 border rounded-xl text-sm outline-none focus:border-blue-500" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">Kota Domisili</label>
                <input type="text" placeholder="Contoh: Purwokerto" required className="w-full px-4 py-2 border rounded-xl text-sm outline-none focus:border-blue-500" value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Email</label>
            <input type="email" required className="w-full px-4 py-2 border rounded-xl text-sm outline-none focus:border-blue-500" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Password</label>
            <input type="password" required className="w-full px-4 py-2 border rounded-xl text-sm outline-none focus:border-blue-500" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl text-sm transition shadow-sm disabled:opacity-50">
            {loading ? 'Memproses...' : isRegister ? 'Daftar Sekarang' : 'Masuk'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500">
          {isRegister ? 'Sudah punya akun? ' : 'Belum punya akun? '}
          <button onClick={() => setIsRegister(!isRegister)} className="text-blue-600 font-semibold hover:underline">
            {isRegister ? 'Masuk di sini' : 'Daftar di sini'}
          </button>
        </div>
      </div>
    </div>
  );
}