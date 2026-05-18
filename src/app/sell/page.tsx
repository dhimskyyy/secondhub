// src/app/sell/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Package,
  Upload,
  X,
  ImagePlus,
  Tag,
  MapPin,
  DollarSign,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSupabase } from '@/hooks/useSupabase';
import Skeleton from '@/components/ui/Skeleton';
import type { Category } from '@/types/category';
import type { ProductCondition } from '@/types/product';

export default function SellPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const supabase = useSupabase();

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pageReady, setPageReady] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [minusDescription, setMinusDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [condition, setCondition] = useState<ProductCondition>('Mulus');
  const [city, setCity] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Auth guard + data fetch
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const loadData = async () => {
      // Fetch profile city
      const { data: profile } = await supabase
        .from('profiles')
        .select('city')
        .eq('id', user.id)
        .single();
      if (profile?.city) setCity(profile.city);

      // Fetch categories
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (catData) setCategories(catData as Category[]);

      setPageReady(true);
    };

    loadData();
  }, [authLoading, user, router, supabase]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    if (filesArray.length > 5) {
      alert('Maksimal hanya boleh mengunggah 5 foto!');
      return;
    }
    setImageFiles(filesArray);
    const previews = filesArray.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  const removeImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || imageFiles.length === 0) {
      alert('Data dan minimal 1 foto wajib diisi!');
      return;
    }

    setLoading(true);
    try {
      // Insert product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert([
          {
            seller_id: user.id,
            category_id: categoryId,
            title,
            description,
            minus_description: minusDescription || null,
            price: parseInt(price),
            condition,
            city,
            status: 'Available',
          },
        ])
        .select()
        .single();

      if (productError) throw productError;

      // Upload images
      const uploadedImagesData = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}-${i}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('product-images').getPublicUrl(fileName);

        uploadedImagesData.push({
          product_id: productData.id,
          image_url: publicUrl,
          is_primary: i === 0,
        });
      }

      const { error: imagesTableError } = await supabase
        .from('product_images')
        .insert(uploadedImagesData);

      if (imagesTableError) throw imagesTableError;

      alert('Iklan barang berhasil dipasang!');
      router.push('/');
      router.refresh();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Gagal memasang iklan';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (authLoading || !pageReady) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <Package size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Pasang Iklan Barang Bekas</h1>
            <p className="text-xs text-slate-500">Isi detail barang Anda di bawah ini</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1.5">
              <Tag size={14} className="inline mr-1 text-slate-400" />
              Nama / Judul Barang
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: iPhone 11 Pro Max 256GB"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Category + Condition */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-1.5">Kategori</label>
              <select
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
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
              <label className="text-sm font-semibold text-slate-700 block mb-1.5">Kondisi Fisik</label>
              <select
                required
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
                value={condition}
                onChange={(e) => setCondition(e.target.value as ProductCondition)}
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
            <label className="text-sm font-semibold text-slate-700 block mb-1.5">
              <DollarSign size={14} className="inline mr-1 text-slate-400" />
              Harga (Rupiah)
            </label>
            <input
              type="number"
              required
              placeholder="Contoh: 5500000"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1.5">
              <FileText size={14} className="inline mr-1 text-slate-400" />
              Deskripsi Barang
            </label>
            <textarea
              required
              rows={4}
              placeholder="Jelaskan spesifikasi, kelengkapan, kelayakan barang..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Minus Description */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1.5">
              <AlertTriangle size={14} className="inline mr-1 text-amber-500" />
              Detail Minus / Cacat (Opsional)
            </label>
            <textarea
              rows={2}
              placeholder="Kosongkan jika tidak ada minus"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all resize-none"
              value={minusDescription}
              onChange={(e) => setMinusDescription(e.target.value)}
            />
          </div>

          {/* City */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1.5">
              <MapPin size={14} className="inline mr-1 text-slate-400" />
              Lokasi COD (Kota)
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Purwokerto"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-1.5">
              <ImagePlus size={14} className="inline mr-1 text-slate-400" />
              Foto Barang (Maks. 5)
            </label>
            <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-4 cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/30">
              <Upload size={20} className="text-slate-400" />
              <span className="text-sm text-slate-500">Klik untuk memilih foto</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageChange}
              />
            </label>

            {/* Preview Grid */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mt-3">
                {imagePreviews.map((src, index) => (
                  <div
                    key={index}
                    className="aspect-square relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group"
                  >
                    <Image
                      src={src}
                      alt={`preview-${index}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                    {index === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white text-[8px] text-center py-0.5 font-bold uppercase">
                        Sampul
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 rounded-xl text-sm transition-all shadow-md hover:shadow-lg hover:shadow-blue-200/50 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sedang Memproses...
              </>
            ) : (
              'Pasang Iklan Sekarang'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}