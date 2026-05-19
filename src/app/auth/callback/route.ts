// src/app/auth/callback/route.ts
import { createClient } from '@/lib/supabase-server';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Auth Callback Route — handles email verification & password recovery redirects.
 *
 * When a user clicks the verification link in their email, Supabase redirects them here
 * with a `code` parameter. This route exchanges the code for a session, then redirects
 * the user to the appropriate page.
 *
 * This prevents opening a new tab/window — the user stays in the same browser flow.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const type = searchParams.get('type');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Password recovery → redirect to home (user is now logged in)
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/dashboard/profile`);
      }

      // Email verification → redirect to home page
      return NextResponse.redirect(`${origin}/`);
    }
  }

  // Fallback: if code exchange failed, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
