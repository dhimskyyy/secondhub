// src/hooks/useSupabase.ts
'use client';

import { useMemo } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';

/**
 * Hook to get the browser-side Supabase client.
 * Returns the singleton instance.
 *
 * @example
 * const supabase = useSupabase();
 * const { data } = await supabase.from('products').select('*');
 */
export function useSupabase() {
  return useMemo(() => createBrowserSupabaseClient(), []);
}
