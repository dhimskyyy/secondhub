// app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../src/lib/supabase';
import Navbar from '../../components/Navbar';

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Fungsi mengambil data produk milik user
  const fetchMyProducts = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          title,
          price,
          status,
          condition,
          created_at,
          product_images (image_url, is_primary)
        `)
        .eq('seller_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      setErrorMessage(err.message || 'Gagal mengambil data produk.');
    } finally {
      setLoading(false); // Dipastikan selalu mengeksekusi ini agar loading berhenti
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) throw authError;

        if (!user) {
          console.log('User tidak ditemukan, melempar ke /login');
          alert('Anda harus login untuk mengakses dashboard!');
          router.push('/login');
          return;
        }

        console.log('User ditemukan dengan ID:', user.id);
        setUserId(user.id);
        await fetchMyProducts(user.id);
      } catch (err: any) {
        console.error('Error Auth Check:', err);
        setErrorMessage(err.message || 'Gagal memeriksa sesi login.');
        setLoading(false);
      }
    };
    
    checkUser();
  }, [router]);

  // 2. Mengubah status barang menjadi 'Sold'
  const handleMarkAsSold = async (productId: string) => {
    const confirmSold = window.confirm('Tandai barang ini sebagai sudah terjual?');
    if (!confirmSold || !userId) return;

    try {
      const { error } = await supabase
        .from('products')
        .update({ status: 'Sold', updated_at: new Date().toISOString() })
        .eq('id', productId);

      if (error) throw error;
      alert('Selamat! Barang Anda telah ditandai terjual.');
      fetchMyProducts(userId);
    } catch (err: any) {
      alert('Gagal: ' + err.message);
    }
  };

  // 3. Menghapus iklan dari database
  const handleDeleteProduct = async (productId: string) => {
    const confirmDelete = window.confirm('Apakah Anda yakin ingin menghapus iklan ini secara permanen?');
    if (!confirmDelete || !userId) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      alert('Iklan berhasil dihapus.');
      setProducts(products.filter((p) => p.id !== productId));
    } catch (err: any) {
      alert('Gagal menghapus: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard Penjual</h1>
            <p className="text-sm text-gray-500">Kelola semua barang bekas yang Anda iklankan di sini.</p>
          </div>
          <a href="/sell" className="bg-blue-600 hover:bg-blue-700 text-white text-center px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-sm">
            + Pasang Iklan Baru
          </a>
        </div>

        {/* TAMPILAN JIKA TERJADI ERROR */}
        {errorMessage && (
          <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl mb-6 border border-red-100">
            <strong>Terjadi kesalahan:</strong> {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-sm text-gray-400 animate-pulse">Memuat data iklan Anda...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-500 p-6">
            <p className="mb-4 text-sm">Anda belum memiliki iklan barang bekas saat ini.</p>
            <a href="/sell" className="text-sm text-blue-600 font-semibold hover:underline">
              Mulai jual barang pertama Anda →
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => {
              const primaryImage = product.product_images?.find((img: any) => img.is_primary)?.image_url 
                || product.product_images?.[0]?.image_url;
              const isSold = product.status === 'Sold';

              return (
                <div key={product.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex gap-4 items-center w-full sm:w-auto">
                    <div className="w-16 h-16 bg-gray-100 rounded-xl border overflow-hidden flex-shrink-0 flex items-center justify-center text-[10px] text-gray-400">
                      {primaryImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={primaryImage} alt={product.title} className="object-cover w-full h-full" />
                      ) : (
                        <span>No Photo</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${
                          isSold 
                            ? 'bg-gray-100 text-gray-500 border-gray-200' 
                            : 'bg-green-50 text-green-600 border-green-100'
                        }`}>
                          {isSold ? 'Terjual (Sold)' : 'Aktif (Available)'}
                        </span>
                        <span className="text-[10px] bg-gray-50 text-gray-400 px-1.5 py-0.5 rounded border border-gray-100">
                          {product.condition}
                        </span>
                      </div>
                      <h3 className={`font-bold text-sm text-gray-800 line-clamp-1 ${isSold ? 'line-through text-gray-400' : ''}`}>
                        {product.title}
                      </h3>
                      <p className="font-extrabold text-blue-600 text-sm mt-0.5">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(product.price)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
                    {!isSold && (
                      <button
                        onClick={() => handleMarkAsSold(product.id)}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-2 rounded-xl font-medium transition"
                      >
                        ✓ Tandai Terjual
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 text-xs px-3 py-2 rounded-xl font-medium transition"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}