// src/types/chat.ts

import type { ProductImage } from './product';

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  message: string;
  image_url: string | null;
  created_at: string;
}

export interface ChatRoomProduct {
  id: string;
  title: string;
  price: number;
  status: string;
  product_images: ProductImage[];
}

export interface ChatRoom {
  id: string;
  product_id: string;
  buyer_id: string;
  seller_id: string;
  created_at: string;
  products: ChatRoomProduct | null;
  /** Resolved opponent name (fetched separately) */
  opponent_name: string;
  /** Resolved opponent avatar URL */
  opponent_avatar: string | null;
}
