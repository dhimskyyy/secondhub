// src/types/product.ts

export type ProductStatus = 'Available' | 'Sold';

export type ProductCondition = 'Like New' | 'Mulus' | 'Minus Pemakaian' | 'Rusak';

export interface ProductImage {
  id?: string;
  product_id?: string;
  image_url: string;
  is_primary: boolean;
}

export interface Product {
  id: string;
  seller_id: string;
  category_id: string;
  title: string;
  description: string;
  minus_description: string | null;
  price: number;
  condition: ProductCondition;
  city: string;
  status: ProductStatus;
  popularity_score: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  product_images: ProductImage[];
}

/** Product with joined profile data (for detail pages) */
export interface ProductWithSeller extends Product {
  profiles: {
    full_name: string;
    phone_number: string | null;
    avatar_url: string | null;
  } | null;
}

/** Lightweight product card data (for listing grids) */
export interface ProductCardData {
  id: string;
  title: string;
  price: number;
  condition: ProductCondition;
  status: ProductStatus;
  city: string;
  created_at: string;
  product_images: ProductImage[];
}

export interface ProductFormData {
  title: string;
  description: string;
  minus_description: string;
  price: string;
  category_id: string;
  condition: ProductCondition;
  city: string;
}
