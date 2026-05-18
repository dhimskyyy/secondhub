// src/app/dashboard/purchases/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ShoppingCart, MessageCircle, ImageOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSupabase } from '@/hooks/useSupabase';
import Skeleton from '@/components/ui/Skeleton';
import type { ChatRoom } from '@/types/chat';

/**
 * "Pembelian Saya" page — shows chat rooms where the user is the BUYER.
 * This represents inquiries/negotiations the user initiated on other sellers' products.
 */
export default function PurchasesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const supabase = useSupabase();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }

    const fetchPurchases = async () => {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          id, product_id, buyer_id, seller_id, created_at,
          products (id, title, price, status, product_images(image_url))
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        // Fix N+1 Query: Collect all unique seller IDs first
        const sellerIds = Array.from(new Set(data.map(room => room.seller_id)));

        // Fetch all needed profiles in ONE single query
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', sellerIds);

        // Create a map for O(1) lookup
        const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

        // Resolve seller names instantly
        const formatted = data.map((room) => {
          const prof = profileMap.get(room.seller_id);
          return {
            ...room,
            opponent_name: prof?.full_name || 'Penjual SecondHub',
            opponent_avatar: prof?.avatar_url || null,
          };
        });
        setRooms(formatted);
      } else if (data?.length === 0) {
        setRooms([]);
      }
      setLoading(false);
    };

    fetchPurchases();
  }, [authLoading, user, router, supabase]);

  const openChatRoom = (roomId: string) => {
    window.dispatchEvent(
      new CustomEvent('open-chat-room', { detail: { roomId } })
    );
  };

  if (authLoading || loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">Pembelian Saya</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Riwayat tawaran & obrolan untuk barang yang Anda minati
        </p>
      </div>

      {rooms.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
          <ShoppingCart size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm mb-2">Belum ada riwayat pembelian.</p>
          <p className="text-xs">
            Mulai belanja dengan menekan tombol <strong>"Chat Penjual"</strong> di halaman produk.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rooms.map((room) => {
            const productImage = room.products?.product_images?.[0]?.image_url;
            return (
              <div
                key={room.id}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openChatRoom(room.id)}
              >
                <div className="w-14 h-14 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex-shrink-0 relative">
                  {productImage ? (
                    <Image
                      src={productImage}
                      alt={room.products?.title || ''}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageOff size={16} className="text-slate-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-800 truncate">
                    {room.products?.title || 'Produk'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Penjual: <span className="text-slate-600">{room.opponent_name}</span>
                  </p>
                  <p className="text-xs font-bold text-blue-600 mt-1">
                    {room.products?.price
                      ? new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          maximumFractionDigits: 0,
                        }).format(room.products.price)
                      : '-'}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                    <MessageCircle size={16} className="text-blue-600" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
