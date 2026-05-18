// src/components/features/ChatButton.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSupabase } from '@/hooks/useSupabase';

interface ChatButtonProps {
  productId: string;
  sellerId: string;
}

/**
 * Button to initiate or open an existing chat room about a product.
 * Creates a chat_room if one doesn't exist, then navigates to the floating chat.
 */
export default function ChatButton({ productId, sellerId }: ChatButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = useSupabase();
  const [loading, setLoading] = useState(false);

  const handleStartChat = async () => {
    setLoading(true);

    try {
      if (!user) {
        router.push('/login');
        return;
      }

      if (user.id === sellerId) {
        alert('Ini adalah barang dagangan Anda sendiri!');
        setLoading(false);
        return;
      }

      // Check for existing room
      const { data: existingRoom } = await supabase
        .from('chat_rooms')
        .select('id')
        .eq('product_id', productId)
        .eq('buyer_id', user.id)
        .eq('seller_id', sellerId)
        .maybeSingle();

      if (existingRoom) {
        // Room exists — dispatch custom event to open FloatingChat
        window.dispatchEvent(
          new CustomEvent('open-chat-room', { detail: { roomId: existingRoom.id } })
        );
        return;
      }

      // Create new room
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

      // Open the new room in FloatingChat
      window.dispatchEvent(
        new CustomEvent('open-chat-room', { detail: { roomId: newRoom.id } })
      );
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error('[ChatButton] Failed to initiate chat:', msg);
      alert('Gagal memulai chat, coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleStartChat}
      disabled={loading}
      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-center py-3 rounded-xl text-sm transition-all shadow-md hover:shadow-lg hover:shadow-blue-200/50 disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Membuka Obrolan...
        </>
      ) : (
        <>
          <MessageCircle size={16} />
          Chat Penjual
        </>
      )}
    </button>
  );
}
