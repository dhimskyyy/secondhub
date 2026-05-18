// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // 1. PERBAIKAN DI SINI: Dibungkus ke dalam format satu objek { name, value, ...options }
          cookiesToSet.forEach(({ name, value, options }) => 
            request.cookies.set({ name, value, ...options })
          );
          
          supabaseResponse = NextResponse.next({
            request,
          });
          
          // 2. PERBAIKAN DI SINI JUGA: Disamakan format objeknya agar konsisten
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set({ name, value, ...options })
          );
        },
      },
    }
  );

  // Me-refresh token secara otomatis jika masa berlakunya habis
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Melindungi seluruh rute kecuali file statis aset gambar/css
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};