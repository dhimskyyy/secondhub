// src/app/dashboard/purchases/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ShoppingCart, MessageCircle, ImageOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSupabase } from '@/hooks/useSupabase';
import Badge from '@/components/ui/Badge';
import StatusBadge from '@/components/ui/StatusBadge';
import Skeleton from '@/components/ui/Skeleton';
import type { ChatRoom } from '@/types/chat';

/**
 * "Pembelian Saya" page — shows chat rooms where the user is the BUYER.
 */
export default function PurchasesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const supabase = useSupabase();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPurchases = useCallback(async (userId: string) => {
    try {
      setError('');
      const fetchPromise = supabase
        .from('chat_rooms')
        .select(`
          id, product_id, buyer_id, seller_id, created_at,
          products (id, title, price, status, condition, product_images(image_url))
        `)
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Koneksi ke server terlalu lama (timeout). Silakan coba lagi.')), 10000)
      );

      const { data, error: fetchError } = await Promise.race([fetchPromise, timeoutPromise]) as any;

      if (fetchError) throw fetchError;

      if (!data || data.length === 0) {
        setRooms([]);
        return;
      }

      // Batch fetch profiles
      const sellerIds = Array.from(new Set((data as ChatRoom[]).map((room) => room.seller_id)));

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', sellerIds);

      const profileMap = new Map<string, any>(profiles?.map((p: any) => [p.id, p]) || []);

      const formatted = (data as ChatRoom[]).map((room) => {
        const prof = profileMap.get(room.seller_id);
        return {
          ...room,
          opponent_name: prof?.full_name || 'Penjual SecondHub',
          opponent_avatar: prof?.avatar_url || null,
          unread_count: 0,
          last_message: null,
        };
      });
      setRooms(formatted);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat data';
      setError(msg);
      console.error('[PurchasesPage] Fetch error:', msg);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      window.location.href = '/login';
      return;
    }
    fetchPurchases(user.id);
  }, [authLoading, user, fetchPurchases]);

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
          Riwayat tawaran &amp; obrolan untuk barang yang Anda minati
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="text-center py-8 bg-red-50 rounded-2xl border border-red-100 mb-4">
          <p className="text-sm text-red-600 mb-2">{error}</p>
          <button
            onClick={() => user && fetchPurchases(user.id)}
            className="text-sm text-blue-600 font-semibold hover:underline"
          >
            Coba lagi
          </button>
        </div>
      )}

      {!error && rooms.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
          <ShoppingCart size={40} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm mb-2">Belum ada riwayat pembelian.</p>
          <p className="text-xs">
            Mulai belanja dengan menekan tombol <strong>&quot;Chat Penjual&quot;</strong> di halaman produk.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rooms.map((room) => {
            const productImage = room.products?.product_images?.[0]?.image_url;
            return (
              <div
                key={room.id}
                className="bg-white p-4 rounded-[20px] border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:shadow-md transition-shadow duration-300 cursor-pointer"
                onClick={() => {
                  if (room.product_id) {
                    router.push(`/products/${room.product_id}`);
                  }
                }}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0 w-full">
                  {/* Product Image */}
                  <div className="w-20 h-20 bg-slate-50 rounded-2xl border border-slate-200/80 overflow-hidden flex-shrink-0 relative">
                    {productImage ? (
                      <Image
                        src={productImage}
                        alt={room.products?.title || ''}
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
                        {room.products?.price
                          ? new Intl.NumberFormat('id-ID', {
                              style: 'currency',
                              currency: 'IDR',
                              maximumFractionDigits: 0,
                            }).format(room.products.price)
                          : '-'}
                      </span>
                      <span className="text-slate-300 font-normal">|</span>
                      {room.products?.status && (
                        <StatusBadge status={room.products.status as any} />
                      )}
                      {room.products?.condition && (
                        <Badge variant="muted" className="text-[10px] px-2 py-0.5 font-bold uppercase rounded-md">
                          {room.products.condition}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-slate-500 text-xs sm:text-sm font-medium line-clamp-1">
                      {room.products?.title || 'Produk'}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Penjual: <span className="text-slate-600 font-medium">{room.opponent_name}</span>
                    </p>
                  </div>
                </div>

                {/* Lihat Detail Action Button */}
                <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (room.product_id) {
                        router.push(`/products/${room.product_id}`);
                      }
                    }}
                    className="px-4 py-2 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                  >
                    Lihat Detail
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
