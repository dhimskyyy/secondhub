// src/services/categoryService.ts
import { createClient } from '@/lib/supabase-server';
import type { Category } from '@/types/category';

/**
 * Fetches all product categories, ordered alphabetically.
 * Used in Home page category nav and Sell form dropdown.
 */
export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('[categoryService] Failed to fetch categories:', error.message);
    return [];
  }

  return (data as Category[]) ?? [];
}
