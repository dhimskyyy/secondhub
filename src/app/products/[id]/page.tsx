// src/app/products/[id]/page.tsx
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import Image from 'next/image';
import { MapPin, Calendar, ShieldCheck } from 'lucide-react';
import { getProductDetail, recordProductView } from '@/services/productService';
import { getCurrentUser } from '@/services/profileService';
import ImageGallery from '@/components/features/ImageGallery';
import ChatButton from '@/components/features/ChatButton';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import StatusBadge from '@/components/ui/StatusBadge';

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const product = await getProductDetail(resolvedParams.id);

  if (!product) {
    notFound();
  }

  // Anti-spam view tracking (server-side — 100% accurate)
  const headerList = await headers();
  const ipAddress = headerList.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
  const user = await getCurrentUser();
  await recordProductView(resolvedParams.id, user?.id || null, ipAddress);

  // WhatsApp deep link
  let rawPhone = product.profiles?.phone_number || '';
  if (rawPhone.startsWith('0')) {
    rawPhone = '62' + rawPhone.slice(1);
  }
  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(product.price);
  const waMessage = `Halo ${product.profiles?.full_name}, saya tertarik dengan barang "${product.title}" seharga ${formattedPrice} yang Anda jual di SecondHub. Apakah barangnya masih ada?`;
  const waLink = `https://wa.me/${rawPhone}?text=${encodeURIComponent(waMessage)}`;

  const isSold = product.status === 'Sold';

  return (
    <div className="min-h-screen py-6 sm:py-8">
      <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        {/* Left — Image Gallery */}
        <div>
          <ImageGallery images={product.product_images} title={product.title} />
        </div>

        {/* Right — Product Info */}
        <div className="space-y-5">
          {/* Title & Price Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="default">Kondisi: {product.condition}</Badge>
              <StatusBadge status={product.status} />
            </div>
            <h1
              className={`text-xl sm:text-2xl font-bold tracking-tight leading-snug ${
                isSold ? 'text-slate-400 line-through' : 'text-slate-900'
              }`}
            >
              {product.title}
            </h1>
            <p
              className={`text-2xl sm:text-3xl font-extrabold ${
                isSold ? 'text-slate-400' : 'text-blue-600'
              }`}
            >
              {formattedPrice}
            </p>
          </div>

          {/* Description Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">Deskripsi Barang</h3>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            </div>

            {product.minus_description && (
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-amber-600 flex items-center gap-1.5 mb-2">
                  <ShieldCheck size={14} />
                  Detail Minus / Cacat Barang
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed bg-amber-50/50 p-3 rounded-xl border border-amber-100/70 whitespace-pre-wrap">
                  {product.minus_description}
                </p>
              </div>
            )}
          </div>

          {/* Seller Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Informasi Penjual</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar
                  src={product.profiles?.avatar_url}
                  alt={product.profiles?.full_name || 'Penjual'}
                  size="md"
                  fallbackInitial={product.profiles?.full_name}
                />
                <div>
                  <p className="font-semibold text-slate-800 text-sm">
                    {product.profiles?.full_name || 'Penjual SecondHub'}
                  </p>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin size={10} />
                    {product.city || 'Tidak ditentukan'}
                  </p>
                </div>
              </div>
              <span className="text-[11px] bg-slate-50 text-slate-400 px-2 py-1 rounded-lg border border-slate-100 flex items-center gap-1">
                <Calendar size={10} />
                {new Date(product.created_at).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'short',
                })}
              </span>
            </div>

            {/* Actions */}
            {!isSold && (
              <div className="space-y-2.5 pt-2">
                <ChatButton productId={product.id} sellerId={product.seller_id} />
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-md hover:shadow-lg hover:shadow-emerald-200/50"
                >
                  💬 Hubungi via WhatsApp
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}