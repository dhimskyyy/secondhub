// app/sell/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../src/lib/supabase';

export default function SellPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  
  // STATE PELINDUNG: Menandakan sistem sedang memeriksa autentikasi
  const [checkingAuth, setCheckingAuth] = useState(true);

  // State Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [minusDescription, setMinusDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [condition, setCondition] = useState('Mulus');
  const [city, setCity] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    const checkUserAndData = async () => {
      // 1. Cek sesi login user ke Supabase
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Jika tidak ada user, LANGSUNG LEMPAR ke login tanpa alert/pop-up bawaan browser
        router.push('/login');
        return;
      }

      // 2. Jika lolos login, simpan ID user dan matikan state pelindung
      setUserId(user.id);
      setCheckingAuth(false); // Form baru diizinkan merender setelah baris ini

      // Ambil data pendukung (kota profil & kategori)
      const { data: profile } = await supabase
        .from('profiles')
        .select('city')
        .eq('id', user.id)
        .single();
      if (profile?.city) setCity(profile.city);

      const { data: catData } = await supabase.from('categories').select('*').order('name');
      if (catData) setCategories(catData);
    };

    checkUserAndData();
  }, [router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      if (filesArray.length > 5) {
        alert('Maksimal hanya boleh mengunggah 5 foto!');
        return;
      }
      setImageFiles(filesArray);
      const previews = filesArray.map((file) => URL.createObjectURL(file));
      setImagePreviews(previews);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || imageFiles.length === 0) return alert('Data dan minimal 1 foto wajib diisi!');

    setLoading(true);
    try {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .insert([
          {
            seller_id: userId,
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

      if (productData) {
        const uploadedImagesData = [];
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `${userId}-${Date.now()}-${i}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(fileName);

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
      }

      alert('Iklan barang berhasil dipasang!');
      router.push('/');
      router.refresh();
    } catch (error: any) {
      alert(error.message || 'Gagal memasang iklan');
    } finally {
      setLoading(false);
    }
  };

  // KUNCI PENGAMAN: Jika status masih memeriksa auth, render halaman kosong / loading minimalis saja
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm animate-pulse font-medium">
          Memeriksa hak akses...
        </div>
      </div>
    );
  }

  // Jika lolos verifikasi auth, baru struktur form di bawah ini ditampilkan sepenuhnya
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Pasang Iklan Barang Bekas</h1>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Nama / Judul Barang</label>
            <input type="text" required placeholder="Contoh: iPhone 11 Pro Max 256GB" className="w-full px-4 py-2 border rounded-xl text-sm outline-none focus:border-blue-500" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Kategori</label>
              <select required className="w-full px-4 py-2 border rounded-xl text-sm outline-none bg-white focus:border-blue-500" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">Pilih Kategori</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1">Kondisi Fisik</label>
              <select required className="w-full px-4 py-2 border rounded-xl text-sm outline-none bg-white focus:border-blue-500" value={condition} onChange={(e) => setCondition(e.target.value)}>
                <option value="Like New">Like New (Mulus Banget)</option>
                <option value="Mulus">Mulus (Sesuai Pemakaian)</option>
                <option value="Minus Pemakaian">Minus Pemakaian (Lecet/Jamur)</option>
                <option value="Rusak">Rusak (Untuk Kanibalan)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Harga (Rupiah)</label>
            <input type="number" required placeholder="Masukkan nominal tanpa titik (Contoh: 5500000)" className="w-full px-4 py-2 border rounded-xl text-sm outline-none focus:border-blue-500" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Deskripsi Barang</label>
            <textarea required rows={4} placeholder="Jelaskan spesifikasi, kelengkapan, kelayakan barang..." className="w-full px-4 py-2 border rounded-xl text-sm outline-none focus:border-blue-500 resize-none" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Detail Minus / Cacat (Opsional)</label>
            <textarea rows={2} placeholder="Jelaskan jika ada lecet, minus fungsi, batre health drop, dll (Kosongkan jika tidak ada)" className="w-full px-4 py-2 border rounded-xl text-sm outline-none focus:border-blue-500 resize-none" value={minusDescription} onChange={(e) => setMinusDescription(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Lokasi COD (Kota)</label>
            <input type="text" required placeholder="Contoh: Purwokerto" className="w-full px-4 py-2 border rounded-xl text-sm outline-none focus:border-blue-500" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1">Foto Barang (Maksimal 5 Foto)</label>
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              required 
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-3" 
              onChange={handleImageChange} 
            />
            
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-5 gap-2 pt-2 bg-gray-50 p-3 rounded-xl border border-gray-200">
                {imagePreviews.map((src, index) => (
                  <div key={index} className="aspect-square relative rounded-lg overflow-hidden bg-gray-200 border border-gray-300">
                    <img src={src} alt={`preview-${index}`} className="object-cover w-full h-full" />
                    {index === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 bg-blue-600 text-white text-[9px] text-center py-0.5 font-bold uppercase">
                        Sampul
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl text-sm transition shadow-sm disabled:opacity-50">
            {loading ? 'Sedang Memproses & Mengunggah...' : 'Pasang Iklan Sekarang'}
          </button>
        </form>
      </div>
    </div>
  );
}