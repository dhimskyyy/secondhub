// app/page.tsx
import Link from 'next/link';
import React from 'react';
import { supabase } from '../src/lib/supabase';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';

// 1. FUNGSI UPGRADE: Pemetaan Ikon Berwarna Cerah (Gaya Premium Berskala)
function getCategoryIcon(slug: string, isActive: boolean) {
  // 1. SISIPKAN KEMBALI KODE PROPS YANG HILANG INI:
  const props: React.SVGProps<SVGSVGElement> = {
    xmlns: "http://www.w3.org/2000/svg",
    width: 26,
    height: 26,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: "transition-transform group-hover:scale-110 duration-200"
  };

  switch (slug) {
    case 'elektronik':
      return (
        <span className={isActive ? 'text-blue-600' : 'text-blue-500'}>
          <svg {...props}><rect width="20" height="12" x="2" y="4" rx="2"/><path d="M12 16v4"/><path d="M8 20h8"/></svg>
        </span>
      );
    case 'otomotif':
      return (
        <span className={isActive ? 'text-red-600' : 'text-red-500'}>
          <svg {...props}><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
        </span>
      );
    case 'pakaian-fashion':
      return (
        <span className={isActive ? 'text-purple-600' : 'text-purple-500'}>
          <svg {...props}><path d="M20.38 3.46L16 7.83V4a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3.83L3.62 3.46a1 1 0 0 0-1.34.08l-1 1a1 1 0 0 0 .08 1.34L5.83 10H4a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-1.83l4.47-4.47a1 1 0 0 0 .08-1.34l-1-1a1 1 0 0 0-1.34-.08z"/></svg>
        </span>
      );
    case 'hobi-olahraga':
      return (
        <span className={isActive ? 'text-emerald-600' : 'text-emerald-500'}>
          <svg {...props}><circle cx="12" cy="12" r="10"/><path d="M6 12A6 6 0 0 1 12 6"/><path d="M18 12a6 6 0 0 1-6 6"/></svg>
        </span>
      );
    case 'perlengkapan-rumah':
      return (
        <span className={isActive ? 'text-amber-600' : 'text-amber-500'}>
          <svg {...props}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        </span>
      );
    default:
      return (
        <span className="text-gray-500">
          <svg {...props}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
        </span>
      );
  }
}

async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Gagal mengambil kategori:', error.message);
    return [];
  }
  return data;
}

async function getProducts(search?: string, categoryId?: string) {
  let query = supabase
    .from('products')
    .select(`
      id,
      title,
      price,
      condition,
      city,
      created_at,
      product_images (image_url, is_primary)
    `)
    .eq('status', 'Available');

  if (search) {
    query = query.ilike('title', `%${search}%`);
  }

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query.order('popularity_score', { ascending: false });

  if (error) {
    console.error('Gagal mengambil produk:', error.message);
    return [];
  }
  return data;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const currentSearch = resolvedSearchParams.search || '';
  const currentCategory = resolvedSearchParams.category || '';

  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(currentSearch, currentCategory),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Navbar />

      {/* HERO SECTION & SEARCH BAR */}
      <header className="bg-white py-12 border-b border-gray-100">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            Beli & Jual Barang Bekas Berkualitas
          </h1>
          <p className="text-gray-500 text-sm sm:text-base mb-8">
            Temukan barang elektronik, kendaraan, hingga pakaian preloved terbaik di sekitarmu.
          </p>
          
          <form method="GET" action="/" className="flex shadow-md rounded-2xl overflow-hidden border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition max-w-2xl mx-auto mb-12">
            {currentCategory && <input type="hidden" name="category" value={currentCategory} />}
            <input 
              type="text" 
              name="search"
              defaultValue={currentSearch}
              placeholder="Cari iPhone, Sepeda Motor, atau Jaket..." 
              className="w-full px-5 py-3 outline-none bg-white text-sm sm:text-base text-gray-800"
            />
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 text-sm font-medium transition">
              Cari
            </button>
          </form>

          {/* PERUBAHAN UTAMA: GRID MENU KATEGORI STRUKTUR VERTIKAL ALA SHOPEE */}
          <div className="grid grid-cols-3 sm:flex sm:flex-wrap sm:justify-center gap-x-4 gap-y-6 max-w-3xl mx-auto px-2">
            
            {/* Tombol Semua Barang */}
            <Link href="/" className="flex flex-col items-center text-center group max-w-[100px] mx-auto sm:mx-0">
              <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center transition-all duration-200 ${
                !currentCategory 
                  ? 'bg-blue-50 border-blue-500 shadow-md ring-4 ring-blue-50' 
                  : 'bg-white border-gray-200/80 shadow-sm group-hover:border-blue-400 group-hover:shadow-md group-hover:-translate-y-0.5'
              }`}>
                <span className={!currentCategory ? 'text-indigo-600' : 'text-indigo-500'}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:scale-110 duration-200"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
                </span>
              </div>
              <span className={`text-[11px] sm:text-xs mt-2.5 font-medium leading-tight tracking-tight transition-colors line-clamp-2 max-w-[85px] ${
                !currentCategory ? 'text-blue-600 font-bold' : 'text-gray-600 group-hover:text-blue-600'
              }`}>
                Semua Barang
              </span>
            </Link>

            {/* Loop Kategori Riil */}
            {categories.map((category) => {
              const isActive = currentCategory === category.id;
              const href = currentSearch 
                ? `/?category=${category.id}&search=${currentSearch}`
                : `/?category=${category.id}`;

              return (
                <Link key={category.id} href={href} className="flex flex-col items-center text-center group max-w-[100px] mx-auto sm:mx-0">
                  {/* Kotak Putih Lingkar Ikon */}
                  <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-50 border-blue-500 shadow-md ring-4 ring-blue-50' 
                      : 'bg-white border-gray-200/80 shadow-sm group-hover:border-blue-400 group-hover:shadow-md group-hover:-translate-y-0.5'
                  }`}>
                    {getCategoryIcon(category.slug, isActive)}
                  </div>
                  
                  {/* Nama Teks Kategori */}
                  <span className={`text-[11px] sm:text-xs mt-2.5 font-medium leading-tight tracking-tight transition-colors line-clamp-2 max-w-[85px] ${
                    isActive ? 'text-blue-600 font-bold' : 'text-gray-600 group-hover:text-blue-600'
                  }`}>
                    {category.name}
                  </span>
                </Link>
              );
            })}
          </div>

        </div>
      </header>

      {/* MAIN CONTENT (GRID PRODUK) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            {currentSearch ? `Hasil pencarian: "${currentSearch}"` : 'Rekomendasi Terbaru'}
          </h2>
          {(currentSearch || currentCategory) && (
            <Link href="/" className="text-xs text-red-500 font-medium hover:underline">
              Reset Filter ×
            </Link>
          )}
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400 text-sm">
            Barang yang kamu cari tidak ditemukan. Coba kata kunci atau kategori lain!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
  {products.map((product: any) => {
    const primaryImage = product.product_images?.find((img: any) => img.is_primary)?.image_url 
      || product.product_images?.[0]?.image_url;

    return (
      <ProductCard
        key={product.id}
        id={product.id}
        title={product.title}
        price={product.price}
        condition={product.condition}
        city={product.city}
        createdAt={product.created_at}
        primaryImage={primaryImage}
      />
    );
  })}
</div>
        )}
      </main>
    </div>
  );
}