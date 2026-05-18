// app/products/[id]/page.tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { supabase } from '../../../src/lib/supabase';
import ImageGallery from '../../../components/ImageGallery';
import ChatButton from '../../../components/ChatButton';

async function getProductDetail(id: string) {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      profiles (full_name, phone_number),
      product_images (image_url, is_primary)
    `)
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return data;
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const product = await getProductDetail(resolvedParams.id);

  if (!product) {
    notFound();
  }

  // ==========================================
  // PROSES EKSEKUSI PROTEKSI ANTI-SPAM KLIK (DIUPDATE UNTUK MENDETEKSI ERROR)
  // ==========================================
  // 1. Dapatkan IP Address asli pengunjung website
  const headerList = await headers();
  const ipAddress = headerList.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

  // 2. Dapatkan ID User jika dia dalam kondisi login
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id || null;

  // 3. Panggil Fungsi Satpam (RPC) dan tangkap hasilnya langsung tanpa try-catch
  const { data: rpcData, error: rpcError } = await supabase.rpc('record_product_view', {
    p_product_id: resolvedParams.id,
    p_user_id: currentUserId,
    p_ip_address: ipAddress
  });  
  // ==========================================

  let rawPhone = product.profiles?.phone_number || '';
  if (rawPhone.startsWith('0')) {
    rawPhone = '62' + rawPhone.slice(1);
  }

  const formattedPrice = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(product.price);
  const waMessage = `Halo ${product.profiles?.full_name}, saya tertarik dengan barang "${product.title}" seharga ${formattedPrice} yang Anda jual di SecondHub. Apakah barangnya masih ada?`;
  const waLink = `https://wa.me/${rawPhone}?text=${encodeURIComponent(waMessage)}`;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-12">
      <nav className="bg-white border-b border-gray-200 h-16 flex items-center mb-8 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto w-full px-4 flex items-center">
          <Link href="/" className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
            ← Kembali ke Beranda
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <ImageGallery images={product.product_images} title={product.title} />
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-3">
            <div className="flex gap-2">
              <span className="text-xs font-bold text-blue-600 uppercase bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100">
                Kondisi: {product.condition}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight leading-snug">
              {product.title}
            </h1>
            <p className="text-2xl sm:text-3xl font-extrabold text-blue-600">
              {formattedPrice}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Deskripsi Barang</h3>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{product.description}</p>
            </div>

            {product.minus_description && (
              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-sm font-bold text-amber-600 flex items-center gap-1 mb-1">
                  ⚠️ Detail Minus / Cacat Barang
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed bg-amber-50/50 p-3 rounded-xl border border-amber-100/70 whitespace-pre-wrap">
                  {product.minus_description}
                </p>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-900">Informasi Penjual</h3>
            <div className="flex items-center justify-between text-sm">
              <div>
                <p className="font-semibold text-gray-800">{product.profiles?.full_name || 'Penjual SecondHub'}</p>
                <p className="text-xs text-gray-400">Lokasi COD: <span className="text-gray-600 font-medium">{product.city || 'Tidak ditentukan'}</span></p>
              </div>
              <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-1 rounded-md">
                Terdaftar: {new Date(product.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short' })}
              </span>
            </div>

            <ChatButton productId={product.id} sellerId={product.seller_id} />

            <a 
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-center py-3 rounded-xl text-sm transition shadow-md flex items-center justify-center gap-2"
            >
              💬 Hubungi Penjual via WhatsApp
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}