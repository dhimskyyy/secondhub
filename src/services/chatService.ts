// src/services/chatService.ts
import { createClient } from '@/lib/supabase-server';

/**
 * Gets the count of unread messages for a user across all chat rooms.
 * Used for the notification badge in the FloatingChat button.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const supabase = await createClient();

  // Count chat rooms where user is a participant
  const { count, error } = await supabase
    .from('chat_rooms')
    .select('id', { count: 'exact', head: true })
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);

  if (error) {
    console.error('[chatService] Failed to get unread count:', error.message);
    return 0;
  }

  return count ?? 0;
}
