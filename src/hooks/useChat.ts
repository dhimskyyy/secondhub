// src/hooks/useChat.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/hooks/useAuth';
import type { ChatRoom, ChatMessage } from '@/types/chat';

/**
 * Custom hook managing chat state: rooms, active room, messages, and realtime.
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

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch all chat rooms for the user (as buyer OR seller)
  const fetchRooms = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('chat_rooms')
      .select(`
        id, product_id, buyer_id, seller_id, created_at,
        products (id, title, price, status, product_images(image_url))
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      // Fix N+1 Query: Collect all unique target IDs first
      const targetIds = Array.from(new Set(
        data.map(room => room.buyer_id === user.id ? room.seller_id : room.buyer_id)
      ));

      // Fetch all needed profiles in ONE single query
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', targetIds);

      // Create a map for O(1) lookup
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const formatted = data.map((room) => {
        const targetId = room.buyer_id === user.id ? room.seller_id : room.buyer_id;
        const prof = profileMap.get(targetId);
        return {
          ...room,
          opponent_name: prof?.full_name || 'Pengguna SecondHub',
          opponent_avatar: prof?.avatar_url || null,
        };
      });
      setRooms(formatted);
    } else if (data?.length === 0) {
      setRooms([]);
    }
  }, [user, supabase]);

  // Fetch messages for the active room
  const fetchMessages = useCallback(async (roomId: string) => {
    // Clear old messages instantly so UI doesn't look frozen
    setMessages([]); 
    
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data as ChatMessage[]);
  }, [supabase]);

  // Subscribe to realtime messages for the active room
  useEffect(() => {
    if (!activeRoom) {
      setMessages([]);
      return;
    }

    fetchMessages(activeRoom.id);

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
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [activeRoom, supabase, fetchMessages]);

  // Send text message
  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || !user || !activeRoom) return;

    const msg = inputText;
    setInputText('');

    await supabase.from('chat_messages').insert([
      { room_id: activeRoom.id, sender_id: user.id, message: msg },
    ]);
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
        },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      alert('Gagal mengirim gambar: ' + msg);
    } finally {
      setUploading(false);
    }
  }, [activeRoom, user, supabase]);

  // Open chat to specific room (called by ChatButton / Purchases page)
  const openRoom = useCallback(async (roomId: string) => {
    setIsOpen(true);
    
    // Fetch rooms in the background for the inbox sidebar (don't await)
    fetchRooms();

    // Fetch the specific room data
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
      
      // Fetch profile data
      const { data: prof } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', targetId)
        .single();

      setActiveRoom({
        ...(roomData as ChatRoom),
        opponent_name: prof?.full_name || 'Pengguna SecondHub',
        opponent_avatar: prof?.avatar_url || null,
      });
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

  return {
    rooms,
    activeRoom,
    messages,
    isOpen,
    inputText,
    uploading,
    setIsOpen,
    setActiveRoom,
    setInputText,
    fetchRooms,
    sendMessage,
    sendImage,
  };
}
