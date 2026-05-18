// components/Navbar.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../src/lib/supabase';
import FloatingChat from './FloatingChat';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    // 1. Fungsi untuk mengambil data sesi user yang sedang login
    const getSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // Jika user ada, ambil nama lengkap dari tabel profiles
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        setProfile(data);
      }
    };

    getSession();

    // 2. LISTEN AUTH CHANGES: Fungsi ajaib Supabase untuk memantau status login/logout secara real-time
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);

      if (currentUser) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', currentUser.id)
          .single();
        setProfile(data);
      } else {
        setProfile(null);
      }
    });

    // Bersihkan subscription saat komponen tidak digunakan
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 3. Fungsi untuk menangani proses Logout
  const handleLogout = async () => {
    const confirmLogout = window.confirm('Apakah Anda yakin ingin keluar?');
    if (!confirmLogout) return;

    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.push('/');
    router.refresh(); // Memperbarui data halaman utama
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-blue-600 tracking-tight hover:opacity-90 transition-opacity">
          SecondHub
        </Link>
        
        {/* Menu Kanan */}
        <div className="flex items-center gap-5">
          {user ? (
            /* TAMPILAN JIKA SUDAH LOGIN */
<div className="flex items-center gap-4">
  <span className="text-xs sm:text-sm text-gray-600">
    Halo, <strong className="text-gray-900 font-semibold">{profile?.full_name || 'Pengguna'}</strong>
  </span>
  {/* LINK AKSES KE DASHBOARD BARU */}
  <Link 
    href="/dashboard" 
    className="text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/70 px-3 py-1.5 rounded-xl transition"
  >
    Dashboard Saya
  </Link>
  <button 
    onClick={handleLogout}
    className="text-xs sm:text-sm font-medium text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100/70 px-3 py-1.5 rounded-xl transition"
  >
    Keluar
  </button>
</div>
          ) : (
            /* TAMPILAN JIKA BELUM LOGIN */
            <Link href="/login" className="text-gray-600 hover:text-gray-950 font-medium text-sm transition-colors">
              Masuk
            </Link>
          )}
          
          {/* Tombol Jual Barang */}
          <Link href="/sell" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition shadow-sm hover:shadow-blue-100">
            Jual Barang
          </Link>
        </div>
        <FloatingChat />
      </div>
    </nav>
  );
}