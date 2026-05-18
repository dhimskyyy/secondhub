// src/services/profileService.ts
import { createClient } from '@/lib/supabase-server';
import type { Profile } from '@/types/profile';

/**
 * Fetches a user profile by their auth user ID.
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.error('[profileService] Failed to fetch profile:', error?.message);
    return null;
  }

  return data as Profile;
}

/**
 * Gets the currently authenticated user from cookies.
 * Returns null if not authenticated.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

/**
 * Gets the current user + their profile in one call.
 * Useful for Server Components that need both auth state and profile data.
 */
export async function getCurrentUserWithProfile() {
  const user = await getCurrentUser();
  if (!user) return { user: null, profile: null };

  const profile = await getProfile(user.id);
  return { user, profile };
}
