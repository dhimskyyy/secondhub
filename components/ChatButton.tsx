// components/ChatButton.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../src/lib/supabase';

interface ChatButtonProps {
  productId: string;
  sellerId: string;
}

export default function ChatButton({ productId, sellerId }: ChatButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStartChat = async () => {
    setLoading(true);

    try {
      // 1. Dapatkan user ID pembeli yang sedang aktif login
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Anda harus login terlebih dahulu untuk memulai chat!');
        router.push('/login');
        return;
      }

      // Mencegah chat dengan diri sendiri
      if (user.id === sellerId) {
        alert('Ini adalah barang dagangan Anda sendiri!');
        setLoading(false);
        return;
      }

      // 2. Cek apakah kamar chat untuk produk & orang ini sudah pernah dibuat sebelumnya
      const { data: existingRoom, error: fetchError } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('product_id', productId)
        .eq('buyer_id', user.id)
        .eq('seller_id', sellerId)
        .maybeSingle(); // Menghindari eror jika data tidak ditemukan

      if (existingRoom) {
        // Jika kamar sudah ada, langsung lempar ke kamar tersebut
        router.push(`/chat/${existingRoom.id}`);
        return;
      }

      // 3. Jika kamar belum ada, buat kamar chat baru
      const { data: newRoom, error: insertError } = await supabase
        .from('chat_rooms')
        .insert([
          {
            product_id: productId,
            buyer_id: user.id,
            seller_id: sellerId,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      // Masuk ke kamar chat yang baru dibuat
      router.push(`/chat/${newRoom.id}`);
    } catch (error: any) {
      console.error('Gagal menginisiasi chat:', error.message);
      alert('Gagal memulai chat, coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleStartChat}
      disabled={loading}
      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-center py-3 rounded-xl text-sm transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {loading ? (
        'Membuka Obrolan...'
      ) : (
        <>
          💬 Chat Penjual di Web
        </>
      )}
    </button>
  );
}