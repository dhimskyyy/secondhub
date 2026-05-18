// src/app/dashboard/listings/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Trash2, CheckCircle, Package, ImageOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSupabase } from '@/hooks/useSupabase';
import Badge from '@/components/ui/Badge';
import StatusBadge from '@/components/ui/StatusBadge';
import Skeleton from '@/components/ui/Skeleton';
import type { ProductCardData, ProductImage } from '@/types/product';

export default function ListingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const supabase = useSupabase();
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async (userId: string) => {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id, title, price, condition, status, city, created_at,
        product_images (image_url, is_primary)
      `)
      .eq('seller_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) setProducts(data as ProductCardData[]);
    setLoading(false);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    fetchProducts(user.id);
  }, [authLoading, user, router, supabase]);

  const handleMarkAsSold = async (productId: string) => {
    if (!window.confirm('Tandai barang ini sebagai sudah terjual?') || !user) return;
    const { error } = await supabase
      .from('products')
      .update({ status: 'Sold', updated_at: new Date().toISOString() })
      .eq('id', productId);
    if (!error) fetchProducts(user.id);
    else alert('Gagal: ' + error.message);
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm('Hapus iklan ini secara permanen?') || !user) return;
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (!error) setProducts((prev) => prev.filter((p) => p.id !== productId));
    else alert('Gagal: ' + error.message);
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Iklan Saya</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {products.length} barang terdaftar
          </p>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
          <Package size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm mb-2">Belum ada iklan barang bekas.</p>
          <a href="/sell" className="text-sm text-blue-600 font-semibold hover:underline">
            Mulai jual barang pertama →
          </a>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((product) => {
            const primaryImage =
              product.product_images?.find((img: ProductImage) => img.is_primary)?.image_url ||
              product.product_images?.[0]?.image_url;
            const isSold = product.status === 'Sold';

            return (
              <div
                key={product.id}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4 items-center w-full sm:w-auto">
                  <div className="w-16 h-16 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex-shrink-0 relative">
                    {primaryImage ? (
                      <Image
                        src={primaryImage}
                        alt={product.title}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageOff size={16} className="text-slate-300" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <StatusBadge status={product.status} />
                      <Badge variant="muted">{product.condition}</Badge>
                    </div>
                    <h3
                      className={`font-bold text-sm line-clamp-1 ${
                        isSold ? 'text-slate-400 line-through' : 'text-slate-800'
                      }`}
                    >
                      {product.title}
                    </h3>
                    <p className="font-extrabold text-blue-600 text-sm mt-0.5">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        maximumFractionDigits: 0,
                      }).format(product.price)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {!isSold && (
                    <button
                      onClick={() => handleMarkAsSold(product.id)}
                      className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-2 rounded-xl font-medium transition-colors"
                    >
                      <CheckCircle size={14} />
                      Terjual
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 text-xs px-3 py-2 rounded-xl font-medium transition-colors"
                  >
                    <Trash2 size={14} />
                    Hapus
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
