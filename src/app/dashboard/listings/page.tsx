// src/app/dashboard/listings/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, CheckCircle, Package, ImageOff, X, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSupabase } from '@/hooks/useSupabase';
import Badge from '@/components/ui/Badge';
import StatusBadge from '@/components/ui/StatusBadge';
import Skeleton from '@/components/ui/Skeleton';
import type { ProductCardData, ProductImage, ProductCondition } from '@/types/product';
import type { Category } from '@/types/category';

type ExtendedProduct = ProductCardData & {
  description: string;
  minus_description: string | null;
  category_id: string;
};

export default function ListingsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const supabase = useSupabase();
  
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tabs filtering
  const [activeTab, setActiveTab] = useState<'All' | 'Active' | 'Sold'>('All');

  // Modal editing state
  const [editingProduct, setEditingProduct] = useState<ExtendedProduct | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCondition, setEditCondition] = useState<ProductCondition>('Mulus');
  const [editDescription, setEditDescription] = useState('');
  const [editMinusDescription, setEditMinusDescription] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [editDeleting, setEditDeleting] = useState(false);

  const fetchProducts = useCallback(async (userId: string) => {
    try {
      setError('');
      
      const fetchPromise = supabase
        .from('products')
        .select(`
          id, title, description, minus_description, price, condition, status, city, category_id, created_at,
          product_images (image_url, is_primary)
        `)
        .eq('seller_id', userId)
        .order('created_at', { ascending: false });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Koneksi ke server terlalu lama (timeout). Silakan coba lagi.')), 10000)
      );

      const { data, error: fetchError } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (fetchError) throw fetchError;
      setProducts((data || []) as ExtendedProduct[]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat data';
      setError(msg);
      console.error('[ListingsPage] Fetch error:', msg);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await supabase.from('categories').select('*').order('name');
      if (data) setCategories(data as Category[]);
    } catch (err) {
      console.error('[ListingsPage] Fetch categories error:', err);
    }
  }, [supabase]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      window.location.href = '/login';
      return;
    }
    fetchProducts(user.id);
    fetchCategories();
  }, [authLoading, user, fetchProducts, fetchCategories]);

  const handleMarkAsSold = async (productId: string) => {
    if (!window.confirm('Tandai barang ini sebagai sudah terjual?') || !user) return;
    const { error: updateError } = await supabase
      .from('products')
      .update({ status: 'Sold', updated_at: new Date().toISOString() })
      .eq('id', productId);
    
    if (!updateError) {
      fetchProducts(user.id);
    } else {
      alert('Gagal: ' + updateError.message);
    }
  };

  const handleOpenEdit = (product: ExtendedProduct) => {
    setEditingProduct(product);
    setEditTitle(product.title);
    setEditCategory(product.category_id || '');
    setEditPrice(product.price.toString());
    setEditCondition(product.condition);
    setEditDescription(product.description || '');
    setEditMinusDescription(product.minus_description || '');
    setEditCity(product.city || '');
  };

  const handleCloseEdit = () => {
    setEditingProduct(null);
    setEditTitle('');
    setEditCategory('');
    setEditPrice('');
    setEditDescription('');
    setEditMinusDescription('');
    setEditCity('');
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !user) return;

    setEditSaving(true);
    try {
      const { error: updateError } = await supabase
        .from('products')
        .update({
          title: editTitle,
          category_id: editCategory,
          price: parseInt(editPrice),
          condition: editCondition,
          description: editDescription,
          minus_description: editMinusDescription || null,
          city: editCity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingProduct.id);

      if (updateError) throw updateError;

      alert('Iklan berhasil diperbarui!');
      handleCloseEdit();
      fetchProducts(user.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui iklan';
      alert(msg);
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!editingProduct || !user) return;
    if (!window.confirm('Hapus iklan ini secara permanen? Semua riwayat gambar juga akan dihapus.')) return;

    setEditDeleting(true);
    try {
      // 1. Delete product images first to satisfy constraint
      const { error: imgError } = await supabase
        .from('product_images')
        .delete()
        .eq('product_id', editingProduct.id);
      
      if (imgError) throw imgError;

      // 2. Delete product
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', editingProduct.id);

      if (deleteError) throw deleteError;

      alert('Iklan berhasil dihapus.');
      handleCloseEdit();
      fetchProducts(user.id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus iklan';
      alert(msg);
    } finally {
      setEditDeleting(false);
    }
  };

  // Filter listings according to active tab
  const filteredProducts = products.filter((product) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Active') return product.status === 'Available';
    if (activeTab === 'Sold') return product.status === 'Sold';
    return true;
  });

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
    <div className="pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-950 tracking-tight">My Listings</h1>
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex gap-6 border-b border-slate-200 mb-6 text-sm">
        {(['All', 'Active', 'Sold'] as const).map((tab) => {
          const isActive = activeTab === tab;
          
          let count = 0;
          if (tab === 'All') count = products.length;
          else if (tab === 'Active') count = products.filter(p => p.status === 'Available').length;
          else if (tab === 'Sold') count = products.filter(p => p.status === 'Sold').length;

          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 font-semibold relative transition-colors cursor-pointer flex items-center ${
                isActive ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{tab}</span>
              {count > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                  isActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-blue-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Error State */}
      {error && (
        <div className="text-center py-8 bg-red-50 rounded-2xl border border-red-100 mb-4">
          <p className="text-sm text-red-600 mb-2">{error}</p>
          <button
            onClick={() => user && fetchProducts(user.id)}
            className="text-sm text-blue-600 font-semibold hover:underline"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* Listings List */}
      {!error && filteredProducts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
          <Package size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm mb-2">Belum ada iklan di tab ini.</p>
          {activeTab === 'All' && (
            <Link href="/sell" className="text-sm text-blue-600 font-semibold hover:underline">
              Mulai jual barang pertama →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product) => {
            const primaryImage =
              product.product_images?.find((img: ProductImage) => img.is_primary)?.image_url ||
              product.product_images?.[0]?.image_url;
            const isSold = product.status === 'Sold';

            return (
              <div
                key={product.id}
                className="bg-white p-4 rounded-[20px] border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-md transition-shadow duration-300"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0 w-full">
                  {/* Product Image */}
                  <div className="w-20 h-20 bg-slate-50 rounded-2xl border border-slate-200/80 overflow-hidden flex-shrink-0 relative">
                    {primaryImage ? (
                      <Image
                        src={primaryImage}
                        alt={product.title}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageOff size={20} className="text-slate-300" />
                      </div>
                    )}
                  </div>

                  {/* Title & Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap text-sm">
                      <span className="font-extrabold text-slate-950 text-base sm:text-lg">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          maximumFractionDigits: 0,
                        }).format(product.price)}
                      </span>
                      <span className="text-slate-300 font-normal">|</span>
                      <StatusBadge status={product.status} />
                      <Badge variant="muted" className="text-[10px] px-2 py-0.5 font-bold uppercase rounded-md">
                        {product.condition}
                      </Badge>
                    </div>
                    <h3 className="text-slate-500 text-xs sm:text-sm font-medium line-clamp-1">
                      {product.title}
                    </h3>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0">
                  {!isSold ? (
                    <>
                      <button
                        onClick={() => handleOpenEdit(product)}
                        className="px-4 py-2 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleMarkAsSold(product.id)}
                        className="px-4 py-2 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                      >
                        Mark as Sold
                      </button>
                    </>
                  ) : (
                    <Link
                      href={`/products/${product.id}`}
                      className="px-4 py-2 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                    >
                      View Detail
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDIT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 relative shadow-2xl flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
              <h2 className="text-lg font-bold text-slate-900">Edit Iklan Barang</h2>
              <button
                onClick={handleCloseEdit}
                className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUpdateProduct} className="space-y-4 flex-1 text-left">
              {/* Title */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Nama / Judul Barang</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all text-slate-800"
                />
              </div>

              {/* Category + Condition */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Kategori</label>
                  <select
                    required
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all text-slate-800"
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Kondisi Fisik</label>
                  <select
                    required
                    value={editCondition}
                    onChange={(e) => setEditCondition(e.target.value as ProductCondition)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all text-slate-800"
                  >
                    <option value="Like New">Like New (Mulus Banget)</option>
                    <option value="Mulus">Mulus (Sesuai Pemakaian)</option>
                    <option value="Minus Pemakaian">Minus Pemakaian (Lecet/Jamur)</option>
                    <option value="Rusak">Rusak (Untuk Kanibalan)</option>
                  </select>
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Harga (Rupiah)</label>
                <input
                  type="number"
                  required
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all text-slate-800"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Deskripsi Barang</label>
                <textarea
                  required
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all resize-none text-slate-800"
                />
              </div>

              {/* Minus Description */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Detail Minus / Cacat (Opsional)</label>
                <textarea
                  rows={2}
                  value={editMinusDescription}
                  onChange={(e) => setEditMinusDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all resize-none text-slate-800"
                  placeholder="Kosongkan jika tidak ada minus"
                />
              </div>

              {/* City */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Lokasi COD (Kota)</label>
                <input
                  type="text"
                  required
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all text-slate-800"
                />
              </div>

              {/* Save & Cancel Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-all cursor-pointer text-center"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {editSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    'Simpan Perubahan'
                  )}
                </button>
              </div>

              {/* Divider for separation */}
              <div className="border-t border-slate-100 my-6 pt-6 text-left">
                <h3 className="text-sm font-bold text-red-600 mb-1 flex items-center gap-1.5">
                  <AlertTriangle size={16} /> Zona Berbahaya
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  Menghapus iklan barang bekas ini bersifat permanen dan tidak dapat dibatalkan.
                </p>
                <button
                  type="button"
                  onClick={handleDeleteProduct}
                  disabled={editDeleting}
                  className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-semibold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {editDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      Menghapus...
                    </>
                  ) : (
                    'Hapus Iklan Ini secara Permanen'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
