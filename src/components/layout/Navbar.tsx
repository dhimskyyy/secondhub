// src/components/layout/Navbar.tsx
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Avatar from '@/components/ui/Avatar';
import Skeleton from '@/components/ui/Skeleton';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import {
  Plus,
  LogIn,
  Bell,
  Search,
  MapPin,
  Clock
} from 'lucide-react';
import Image from 'next/image';

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  pemalang: { lat: -6.8890, lng: 109.3814 },
  tegal: { lat: -6.8694, lng: 109.1256 },
  slawi: { lat: -6.9833, lng: 109.1333 },
  pekalongan: { lat: -6.8886, lng: 109.6753 },
  brebes: { lat: -6.8733, lng: 109.0392 },
  batang: { lat: -6.9080, lng: 109.7300 },
  semarang: { lat: -6.9932, lng: 110.4203 },
  purwokerto: { lat: -7.4244, lng: 109.2301 },
  cilacap: { lat: -7.7183, lng: 109.0158 },
  jakarta: { lat: -6.2088, lng: 106.8456 },
  bandung: { lat: -6.9175, lng: 107.6191 },
  surabaya: { lat: -7.2575, lng: 112.7521 },
  yogyakarta: { lat: -7.7956, lng: 110.3695 },
  solo: { lat: -7.5755, lng: 110.8243 },
  surakarta: { lat: -7.5755, lng: 110.8243 },
};

function getDistance(city1: string, city2: string): number {
  const c1 = city1.trim().toLowerCase();
  const c2 = city2.trim().toLowerCase();

  if (c1 === c2) return 0;

  const coord1 = CITY_COORDINATES[c1];
  const coord2 = CITY_COORDINATES[c2];

  if (!coord1 || !coord2) {
    return c1.includes(c2) || c2.includes(c1) ? 0 : 999;
  }

  const R = 6371; // km
  const dLat = ((coord2.lat - coord1.lat) * Math.PI) / 180;
  const dLon = ((coord2.lng - coord1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((coord1.lat * Math.PI) / 180) *
      Math.cos((coord2.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function timeAgo(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) {
    return `${Math.max(1, diffMins)} menit lalu`;
  } else if (diffHours < 24) {
    return `${diffHours} jam lalu`;
  } else {
    return `${diffDays} hari lalu`;
  }
}

function SearchBar() {
  const searchParams = useSearchParams();
  const currentSearch = searchParams?.get('search') || '';

  return (
    <form
      action="/"
      method="GET"
      className="hidden md:flex flex-1 max-w-xl mx-8 relative items-center"
    >
      <div className="flex items-center bg-white rounded-full w-full px-4 py-1.5 shadow-sm border border-slate-200 focus-within:ring-2 focus-within:ring-white/30 transition-all">
        <Search size={18} className="text-slate-400 mr-2 flex-shrink-0" />
        <input
          type="text"
          name="search"
          defaultValue={currentSearch}
          placeholder="Cari iPhone, Sepeda Motor, atau Jaket..."
          className="w-full bg-transparent outline-none text-slate-800 text-sm placeholder:text-slate-400"
        />
        <button
          type="submit"
          className="bg-[#2b3e9b] hover:bg-[#1e2d78] text-white px-5 py-1.5 rounded-full text-xs font-semibold transition-all ml-2 cursor-pointer"
        >
          Cari
        </button>
      </div>
    </form>
  );
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  price: number;
  time: string;
  image: string;
  href: string;
}

export default function Navbar() {
  const { user, profile, isLoading } = useAuth();
  const [isOpenNotifications, setIsOpenNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpenNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch notifications based on user location (radius 30km)
  useEffect(() => {
    if (!user || !profile) return;
    const currentUserId = user.id;

    async function fetchLocationNotifications() {
      try {
        const { data: products, error } = await supabase
          .from('products')
          .select(`
            id,
            title,
            price,
            city,
            created_at,
            seller_id,
            product_images (image_url, is_primary)
          `)
          .eq('status', 'Available')
          .neq('seller_id', currentUserId) // Exclude own items
          .order('created_at', { ascending: false })
          .limit(30);

        if (error) {
          console.warn('[Navbar] Failed to fetch notifications:', error.message);
          return;
        }

        if (!products) return;

        const userCity = profile?.city || '';
        const nearbyNotifications: NotificationItem[] = [];

        products.forEach((product: any) => {
          const distance = getDistance(userCity, product.city);
          // If within 30km, format as notification
          if (distance <= 30) {
            const primaryImage =
              product.product_images?.find((img: any) => img.is_primary)?.image_url ||
              product.product_images?.[0]?.image_url ||
              '/vercel.svg';

            nearbyNotifications.push({
              id: product.id,
              title: 'Ada barang baru di dekatmu!',
              message: `${product.title} baru diposting di ${product.city}`,
              price: product.price,
              time: product.created_at,
              image: primaryImage,
              href: `/products/${product.id}`,
            });
          }
        });

        setNotifications(nearbyNotifications);
      } catch (err) {
        console.error('[Navbar] Notification error:', err);
      }
    }

    fetchLocationNotifications();
  }, [user, profile, supabase]);

  return (
    <nav className="bg-[#2b3e9b] sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
          <div className="w-8 h-8 relative flex items-center justify-center group-hover:scale-105 transition-transform">
            <Image
              src="/icon.png"
              alt="SecondHub Logo"
              width={26}
              height={26}
              className="object-contain brightness-0 invert"
              priority
            />
          </div>
          <span className="text-xl font-extrabold text-white tracking-tight">
            SecondHub
          </span>
        </Link>

        {/* Global Search Bar */}
        <Suspense
          fallback={
            <div className="hidden md:block flex-1 max-w-xl mx-8 h-10 bg-white/10 rounded-full animate-pulse" />
          }
        >
          <SearchBar />
        </Suspense>

        {/* Right Menu */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {isLoading ? (
            <div className="flex items-center gap-3">
              <Skeleton className="w-8 h-8 rounded-full bg-white/20" />
              <Skeleton className="w-8 h-8 rounded-full bg-white/20" />
            </div>
          ) : user ? (
            /* Authenticated state: Notifications, Profile, Jual Barang */
            <div className="flex items-center gap-4">
              {/* Notification Bell */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsOpenNotifications(!isOpenNotifications)}
                  className="p-2 text-white hover:text-slate-200 rounded-full hover:bg-white/10 transition-colors relative cursor-pointer"
                  aria-label="Notifikasi"
                >
                  <Bell size={22} />
                  {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-[#2b3e9b]" />
                  )}
                </button>

                {/* Notifications Dropdown */}
                {isOpenNotifications && (
                  <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden py-1 z-50 text-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">Notifikasi</span>
                      {profile?.city && (
                        <span className="text-xs text-indigo-600 bg-indigo-50 font-medium px-2 py-0.5 rounded-full flex items-center gap-0.5">
                          <MapPin size={10} /> {profile.city} (30km)
                        </span>
                      )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-sm">
                          Tidak ada barang baru di sekitar lokasi Anda.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <Link
                            key={notif.id}
                            href={notif.href}
                            onClick={() => setIsOpenNotifications(false)}
                            className="flex items-start gap-3 p-3.5 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition-colors"
                          >
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                              <Image
                                src={notif.image}
                                alt={notif.title}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-xs text-indigo-600 mb-0.5">
                                {notif.title}
                              </p>
                              <p className="text-xs text-slate-700 font-semibold line-clamp-1">
                                {notif.message.split(' baru diposting')[0]}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                                <MapPin size={10} /> {notif.message.split(' diposting di ')[1]}
                              </p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-[11px] font-bold text-slate-900">
                                  Rp {notif.price.toLocaleString('id-ID')}
                                </span>
                                <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                  <Clock size={9} /> {timeAgo(notif.time)}
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Avatar -> Klik Mengarah ke Dashboard */}
              <Link
                href="/dashboard/listings"
                title="Ke Dashboard"
                className="hover:scale-105 transition-transform flex items-center flex-shrink-0"
              >
                <Avatar
                  src={profile?.avatar_url}
                  alt={profile?.full_name || 'User'}
                  size="sm"
                  fallbackInitial={profile?.full_name}
                />
              </Link>
            </div>
          ) : (
            /* Guest state: Tombol Login/Masuk */
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 border border-white/40 hover:border-white text-white px-4 py-1.5 rounded-full text-xs font-semibold transition-all hover:bg-white/10 cursor-pointer"
            >
              <LogIn size={14} />
              Masuk
            </Link>
          )}

          {/* CTA — Jual Barang */}
          <Link
            href="/sell"
            className="inline-flex items-center gap-1.5 border border-white hover:bg-white/15 text-white px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex-shrink-0"
          >
            <Plus size={14} />
            <span>Jual Barang</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
