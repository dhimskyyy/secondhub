// src/app/auth/logout/route.ts
import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

/**
 * Server-side logout handler.
 * Using a server route ensures that all Supabase auth cookies (including potential
 * HttpOnly cookies) are properly cleared by the server middleware and client.
 */
export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Logout Route] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to sign out' },
      { status: 500 }
    );
  }
}
