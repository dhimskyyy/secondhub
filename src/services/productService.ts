// src/services/productService.ts
import { createClient } from '@/lib/supabase-server';
import type { ProductCardData, ProductWithSeller } from '@/types/product';

/**
 * Fetches products for the home page grid.
 * Supports search keyword and category filtering.
 * Sorted by popularity_score descending.
 */
export async function getProducts(
  search?: string,
  categoryId?: string
): Promise<ProductCardData[]> {
  const supabase = await createClient();

  let query = supabase
    .from('products')
    .select(`
      id,
      title,
      price,
      condition,
      status,
      city,
      created_at,
      product_images (image_url, is_primary)
    `)
    .eq('status', 'Available');

  if (search) {
    query = query.ilike('title', `%${search}%`);
  }

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query.order('popularity_score', { ascending: false });

  if (error) {
    console.error('[productService] Failed to fetch products:', error.message);
    return [];
  }

  return (data as ProductCardData[]) ?? [];
}

/**
 * Fetches a single product with seller profile for the detail page.
 */
export async function getProductDetail(id: string): Promise<ProductWithSeller | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      profiles (full_name, phone_number, avatar_url),
      product_images (image_url, is_primary)
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('[productService] Failed to fetch product detail:', error?.message);
    return null;
  }

  return data as ProductWithSeller;
}

/**
 * Fetches all products belonging to a specific seller (for Dashboard).
 */
export async function getSellerProducts(sellerId: string): Promise<ProductCardData[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      title,
      price,
      condition,
      status,
      city,
      created_at,
      product_images (image_url, is_primary)
    `)
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[productService] Failed to fetch seller products:', error.message);
    return [];
  }

  return (data as ProductCardData[]) ?? [];
}

/**
 * Records a product view via the anti-spam RPC function.
 * Called from the product detail Server Component.
 */
export async function recordProductView(
  productId: string,
  userId: string | null,
  ipAddress: string
): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc('record_product_view', {
    p_product_id: productId,
    p_user_id: userId,
    p_ip_address: ipAddress,
  });
}
