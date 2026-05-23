// src/app/page.tsx
import Link from 'next/link';
import {
  Monitor,
  Car,
  Shirt,
  Dumbbell,
  Home as HomeIcon,
  LayoutGrid,
} from 'lucide-react';
import { getCategories } from '@/services/categoryService';
import { getProducts } from '@/services/productService';
import ProductCard from '@/components/features/ProductCard';
import HeaderCarousel from '@/components/features/HeaderCarousel';
import type { Category } from '@/types/category';
import type { ProductCardData, ProductImage } from '@/types/product';

/** Maps category slugs to lucide icons with color classes */
function getCategoryIcon(slug: string, isActive: boolean) {
  const iconSize = 24;
  const activeOpacity = isActive ? 'opacity-100' : 'opacity-80';

  const iconMap: Record<string, { icon: React.ReactNode; color: string }> = {
    elektronik: {
      icon: <Monitor size={iconSize} />,
      color: isActive ? 'text-blue-600' : 'text-blue-500',
    },
    otomotif: {
      icon: <Car size={iconSize} />,
      color: isActive ? 'text-red-600' : 'text-red-500',
    },
    'pakaian-fashion': {
      icon: <Shirt size={iconSize} />,
      color: isActive ? 'text-purple-600' : 'text-purple-500',
    },
    'hobi-olahraga': {
      icon: <Dumbbell size={iconSize} />,
      color: isActive ? 'text-emerald-600' : 'text-emerald-500',
    },
    'perlengkapan-rumah': {
      icon: <HomeIcon size={iconSize} />,
      color: isActive ? 'text-amber-600' : 'text-amber-500',
    },
  };

  const match = iconMap[slug];
  if (!match) {
    return <LayoutGrid size={iconSize} className={`text-slate-500 ${activeOpacity}`} />;
  }

  return <span className={`${match.color} ${activeOpacity}`}>{match.icon}</span>;
}

export default async function HomePage({
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
    <div className="min-h-screen pb-12">
      {/* HERO CAROUSEL */}
      <HeaderCarousel />

      {/* CATEGORY GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-6 max-w-7xl mx-auto">
          Jelajah Kategori
        </h2>
        <div className="flex gap-5 sm:gap-6 lg:gap-8 overflow-x-auto sm:overflow-visible sm:flex-wrap justify-start sm:justify-center pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar max-w-7xl mx-auto">
          {/* All Items */}
          <Link
            href="/"
            className="flex flex-col items-center text-center group max-w-[100px] flex-shrink-0"
          >
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                !currentCategory
                  ? 'bg-blue-50 border-2 border-blue-500 shadow-sm'
                  : 'bg-[#F0F2F7] hover:bg-slate-200/60 group-hover:shadow-sm group-hover:-translate-y-0.5'
              }`}
            >
              <span className={!currentCategory ? 'text-indigo-600' : 'text-indigo-500'}>
                <LayoutGrid size={24} />
              </span>
            </div>
            <span
              className={`text-[11px] sm:text-xs mt-2.5 font-semibold leading-tight tracking-tight transition-colors line-clamp-2 max-w-[85px] ${
                !currentCategory
                  ? 'text-blue-600 font-bold'
                  : 'text-slate-600 group-hover:text-blue-600'
              }`}
            >
              Semua Barang
            </span>
          </Link>

          {/* Dynamic Categories */}
          {categories.map((category: Category) => {
            const isActive = currentCategory === category.id;
            const href = currentSearch
              ? `/?category=${category.id}&search=${currentSearch}`
              : `/?category=${category.id}`;

            return (
              <Link
                key={category.id}
                href={href}
                className="flex flex-col items-center text-center group max-w-[100px] flex-shrink-0"
              >
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 border-2 border-blue-500 shadow-sm'
                      : 'bg-[#F0F2F7] hover:bg-slate-200/60 group-hover:shadow-sm group-hover:-translate-y-0.5'
                  }`}
                >
                  {getCategoryIcon(category.slug, isActive)}
                </div>
                <span
                  className={`text-[11px] sm:text-xs mt-2.5 font-semibold leading-tight tracking-tight transition-colors line-clamp-2 max-w-[85px] ${
                    isActive
                      ? 'text-blue-600 font-bold'
                      : 'text-slate-600 group-hover:text-blue-600'
                  }`}
                >
                  {category.name}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* PRODUCT GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">
            {currentSearch ? `Hasil pencarian: "${currentSearch}"` : 'Rekomendasi Terbaru'}
          </h2>
          {(currentSearch || currentCategory) && (
            <Link
              href="/"
              className="text-xs text-red-500 font-medium hover:underline transition-colors"
            >
              Reset Filter ×
            </Link>
          )}
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm">
            <LayoutGrid size={40} className="mx-auto mb-3 text-slate-300" />
            Barang yang kamu cari tidak ditemukan. Coba kata kunci atau kategori lain!
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {products.map((product: ProductCardData) => {
              const primaryImage =
                product.product_images?.find((img: ProductImage) => img.is_primary)
                  ?.image_url || product.product_images?.[0]?.image_url;

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
      </section>
    </div>
  );
}