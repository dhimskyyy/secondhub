// src/components/features/chat/ChatRoom.tsx
'use client';

import { useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Send, ImagePlus, ImageOff, Check, CheckCheck } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import StatusBadge from '@/components/ui/StatusBadge';
import type { ChatRoom as ChatRoomType, ChatMessage } from '@/types/chat';
import type { ProductStatus } from '@/types/product';

interface ChatRoomProps {
  room: ChatRoomType;
  messages: ChatMessage[];
  currentUserId: string;
  currentUserAvatar?: string | null;
  inputText: string;
  uploading: boolean;
  onInputChange: (text: string) => void;
  onSendMessage: () => void;
  onSendImage: (file: File) => void;
  onBack: () => void;
}

function formatLastSeen(lastSeenAt: string | null): string {
  if (!lastSeenAt) return 'Offline';
  
  const lastSeen = new Date(lastSeenAt);
  const now = new Date();
  const diffMs = now.getTime() - lastSeen.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  
  if (diffSec < 45) {
    return 'Online';
  }
  
  if (diffSec < 60) {
    return 'Terakhir online beberapa detik lalu';
  }
  
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return `Terakhir online ${diffMin} menit lalu`;
  }
  
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) {
    return `Terakhir online ${diffHr} jam lalu`;
  }
  
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) {
    return 'Terakhir online kemarin';
  }
  return `Terakhir online ${diffDays} hari lalu`;
}

/**
 * Active chat room view with product header, message bubbles, read receipts, and input area.
 */
export default function ChatRoomView({
  room,
  messages,
  currentUserId,
  currentUserAvatar,
  inputText,
  uploading,
  onInputChange,
  onSendMessage,
  onSendImage,
  onBack,
}: ChatRoomProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSendMessage();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onSendImage(e.target.files[0]);
    }
  };

  const productImage = room.products?.product_images?.[0]?.image_url;
  const lastSeenText = formatLastSeen(room.opponent_last_seen);

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="p-3 border-b border-slate-100 flex items-center gap-3 bg-white">
        <button
          onClick={onBack}
          className="sm:hidden text-slate-400 hover:text-slate-600 p-1"
        >
          <ArrowLeft size={16} />
        </button>
        <Avatar
          src={room.opponent_avatar}
          alt={room.opponent_name}
          size="sm"
          fallbackInitial={room.opponent_name}
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-xs text-slate-900 truncate">{room.opponent_name}</h3>
          <p className={`text-[10px] font-medium transition-all duration-300 ${lastSeenText === 'Online' ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`}>
            {lastSeenText}
          </p>
        </div>
      </div>

      {/* Product Preview Strip */}
      <Link
        href={`/products/${room.product_id}`}
        className="p-2.5 bg-slate-50 hover:bg-slate-100/80 border-b border-slate-100 flex items-center gap-3 cursor-pointer transition-colors"
      >
        <div className="w-10 h-10 bg-slate-200 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0 relative">
          {productImage ? (
            <Image
              src={productImage}
              alt=""
              fill
              sizes="40px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageOff size={14} className="text-slate-400" />
            </div>
          )}
        </div>
        <div className="text-left min-w-0 flex-1">
          <h4 className="text-xs font-semibold text-slate-800 truncate leading-tight">
            {room.products?.title}
          </h4>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs font-bold text-blue-600">
              {room.products?.price
                ? new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    maximumFractionDigits: 0,
                  }).format(room.products.price)
                : '-'}
            </p>
            {room.products?.status && (
              <StatusBadge status={room.products.status as ProductStatus} />
            )}
          </div>
        </div>
      </Link>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50/40 space-y-2.5">
        {messages.length === 0 && (
          <div className="text-center py-8 text-xs text-slate-400">
            Belum ada pesan. Mulai obrolan dengan mengirim pesan pertama!
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;
          return (
            <div key={msg.id} className={`flex gap-2 items-end ${isMe ? 'justify-end' : 'justify-start'}`}>
              {!isMe && (
                <Avatar
                  src={room.opponent_avatar}
                  alt={room.opponent_name}
                  size="sm"
                  fallbackInitial={room.opponent_name}
                  className="w-6 h-6 text-[9px] mb-0.5 border border-slate-100 shadow-none flex-shrink-0"
                />
              )}
              <div
                className={`max-w-[70%] p-2.5 rounded-2xl text-xs shadow-sm ${
                  isMe
                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-md'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-md'
                }`}
              >
                {msg.image_url ? (
                  <div className="rounded-xl overflow-hidden mb-1 relative w-[200px] h-[140px]">
                    <Image
                      src={msg.image_url}
                      alt="chat-media"
                      fill
                      sizes="200px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap text-left leading-relaxed">{msg.message}</p>
                )}
                {/* Timestamp + Read Receipt */}
                <div className={`flex items-center justify-end gap-1 mt-1 ${
                  isMe ? 'text-blue-200' : 'text-slate-400'
                }`}>
                  <span className="text-[9px]">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {/* Read receipt — only show on sender's messages */}
                  {isMe && (
                    msg.is_read ? (
                      <CheckCheck size={12} className="text-blue-200" />
                    ) : (
                      <Check size={12} className="text-blue-300/60" />
                    )
                  )}
                </div>
              </div>
              {isMe && (
                <Avatar
                  src={currentUserAvatar}
                  alt="Saya"
                  size="sm"
                  fallbackInitial="Saya"
                  className="w-6 h-6 text-[9px] mb-0.5 border border-slate-100 shadow-none flex-shrink-0"
                />
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-slate-100 flex items-center gap-2 bg-white"
      >
        <label className="cursor-pointer text-slate-400 hover:text-blue-600 transition-colors p-1.5 hover:bg-blue-50 rounded-lg flex-shrink-0">
          <ImagePlus size={18} />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
        <input
          type="text"
          value={inputText}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={uploading ? 'Mengunggah foto...' : 'Tulis pesan...'}
          disabled={uploading}
          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
        />
        <button
          type="submit"
          disabled={uploading || !inputText.trim()}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs p-2 rounded-xl transition-all disabled:opacity-40 flex-shrink-0"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
