// src/hooks/useChat.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/hooks/useAuth';
import type { ChatRoom, ChatMessage } from '@/types/chat';

/**
 * Custom hook managing chat state: rooms, active room, messages, realtime, and unread counts.
 */
export function useChat() {
  const supabase = useSupabase();
  const { user } = useAuth();

  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [unreadTotal, setUnreadTotal] = useState(0);

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Calculate total unread from rooms
  const updateUnreadTotal = useCallback((roomsList: ChatRoom[]) => {
    const total = roomsList.reduce((sum, room) => sum + (room.unread_count || 0), 0);
    setUnreadTotal(total);
  }, []);

  // Fetch all chat rooms for the user (as buyer OR seller) with unread counts
  const fetchRooms = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          id, product_id, buyer_id, seller_id, created_at,
          products (id, title, price, status, product_images(image_url))
        `)
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error || !data) return;

      if (data.length === 0) {
        setRooms([]);
        setUnreadTotal(0);
        return;
      }

      // Batch fetch profiles
      const targetIds = Array.from(new Set(
        (data as ChatRoom[]).map((room) => room.buyer_id === user.id ? room.seller_id : room.buyer_id)
      ));

      const [profilesResult, unreadResult] = await Promise.all([
        supabase.from('profiles').select('id, full_name, avatar_url').in('id', targetIds),
        // Get unread counts: messages NOT sent by me AND not read
        supabase
          .from('chat_messages')
          .select('room_id')
          .neq('sender_id', user.id)
          .eq('is_read', false)
          .in('room_id', data.map((r: any) => r.id)),
      ]);

      const profileMap = new Map<string, any>(
        profilesResult.data?.map((p: any) => [p.id, p]) || []
      );

      // Count unread per room
      const unreadMap = new Map<string, number>();
      (unreadResult.data || []).forEach((msg: any) => {
        unreadMap.set(msg.room_id, (unreadMap.get(msg.room_id) || 0) + 1);
      });

      const formatted: ChatRoom[] = (data as ChatRoom[]).map((room) => {
        const targetId = room.buyer_id === user.id ? room.seller_id : room.buyer_id;
        const prof = profileMap.get(targetId);
        return {
          ...room,
          opponent_name: prof?.full_name || 'Pengguna SecondHub',
          opponent_avatar: prof?.avatar_url || null,
          unread_count: unreadMap.get(room.id) || 0,
          last_message: null,
        };
      });

      setRooms(formatted);
      updateUnreadTotal(formatted);
    } catch (err) {
      console.error('[useChat] fetchRooms error:', err);
    }
  }, [user, supabase, updateUnreadTotal]);

  // Mark messages as read when entering a room
  const markMessagesAsRead = useCallback(async (roomId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('room_id', roomId)
        .neq('sender_id', user.id)
        .eq('is_read', false);

      // Update local unread count for this room
      setRooms(prev => {
        const updated = prev.map(r =>
          r.id === roomId ? { ...r, unread_count: 0 } : r
        );
        updateUnreadTotal(updated);
        return updated;
      });
    } catch (err) {
      console.error('[useChat] markMessagesAsRead error:', err);
    }
  }, [user, supabase, updateUnreadTotal]);

  // Fetch messages for the active room
  const fetchMessages = useCallback(async (roomId: string) => {
    setMessages([]);

    try {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });
      if (data) setMessages(data as ChatMessage[]);
    } catch (err) {
      console.error('[useChat] fetchMessages error:', err);
    }
  }, [supabase]);

  // Subscribe to realtime messages for the active room
  useEffect(() => {
    if (!activeRoom) {
      setMessages([]);
      return;
    }

    fetchMessages(activeRoom.id);
    markMessagesAsRead(activeRoom.id);

    // Clean up previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`room-${activeRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${activeRoom.id}`,
        },
        (payload: { new: ChatMessage }) => {
          setMessages((prev) => [...prev, payload.new]);
          // Auto-mark as read since user is viewing this room
          if (payload.new.sender_id !== user?.id) {
            markMessagesAsRead(activeRoom.id);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRoom?.id]);

  // Send text message
  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || !user || !activeRoom) return;

    const msg = inputText;
    setInputText('');

    try {
      await supabase.from('chat_messages').insert([
        { room_id: activeRoom.id, sender_id: user.id, message: msg, is_read: false },
      ]);
    } catch (err) {
      console.error('[useChat] sendMessage error:', err);
      setInputText(msg); // Restore input on error
    }
  }, [inputText, user, activeRoom, supabase]);

  // Send image message
  const sendImage = useCallback(async (file: File) => {
    if (!activeRoom || !user) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `chat-${activeRoom.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      await supabase.from('chat_messages').insert([
        {
          room_id: activeRoom.id,
          sender_id: user.id,
          message: '📷 Mengirimkan Foto',
          image_url: publicUrl,
          is_read: false,
        },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      alert('Gagal mengirim gambar: ' + msg);
    } finally {
      setUploading(false);
    }
  }, [activeRoom, user, supabase]);

  // Open chat to specific room
  const openRoom = useCallback(async (roomId: string) => {
    setIsOpen(true);

    // Fetch rooms in the background for the inbox sidebar
    fetchRooms();

    try {
      const { data: roomData } = await supabase
        .from('chat_rooms')
        .select(`
          id, product_id, buyer_id, seller_id, created_at,
          products (id, title, price, status, product_images(image_url))
        `)
        .eq('id', roomId)
        .single();

      if (roomData && user) {
        const targetId = roomData.buyer_id === user.id ? roomData.seller_id : roomData.buyer_id;

        const { data: prof } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', targetId)
          .single();

        setActiveRoom({
          ...(roomData as ChatRoom),
          opponent_name: prof?.full_name || 'Pengguna SecondHub',
          opponent_avatar: prof?.avatar_url || null,
          unread_count: 0,
          last_message: null,
        });
      }
    } catch (err) {
      console.error('[useChat] openRoom error:', err);
    }
  }, [fetchRooms, supabase, user]);

  // Listen for custom DOM events from ChatButton / Purchases page
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<{ roomId: string }>;
      openRoom(customEvent.detail.roomId);
    };

    window.addEventListener('open-chat-room', handler);
    return () => window.removeEventListener('open-chat-room', handler);
  }, [openRoom]);

  // Periodically refresh unread counts when chat is closed
  useEffect(() => {
    if (!user || isOpen) return;

    // Initial fetch for badge count
    fetchRooms();

    const interval = setInterval(fetchRooms, 30000); // every 30s
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isOpen]);

  return {
    rooms,
    activeRoom,
    messages,
    isOpen,
    inputText,
    uploading,
    unreadTotal,
    setIsOpen,
    setActiveRoom,
    setInputText,
    fetchRooms,
    sendMessage,
    sendImage,
    markMessagesAsRead,
  };
}
