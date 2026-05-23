// src/components/features/chat/ChatInbox.tsx
import { Minimize2, Trash2 } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import type { ChatRoom } from '@/types/chat';

interface ChatInboxProps {
  rooms: ChatRoom[];
  activeRoomId: string | null;
  onSelectRoom: (room: ChatRoom) => void;
  onMinimize: () => void;
  onDeleteRoom: (roomId: string) => void;
}

/**
 * Left sidebar of the chat widget — lists all chat rooms with unread indicators.
 */
export default function ChatInbox({
  rooms,
  activeRoomId,
  onSelectRoom,
  onMinimize,
  onDeleteRoom,
}: ChatInboxProps) {
  return (
    <div className="w-[240px] border-r border-slate-100 flex flex-col bg-slate-50/50">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between">
        <h2 className="font-bold text-sm text-slate-900">Chat Saya</h2>
        <button
          onClick={onMinimize}
          className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg"
        >
          <Minimize2 size={14} />
        </button>
      </div>

      {/* Room List */}
      <div className="flex-1 overflow-y-auto">
        {rooms.length === 0 ? (
          <div className="text-center py-12 text-xs text-slate-400 px-3">
            Belum ada obrolan aktif.
          </div>
        ) : (
          rooms.map((room) => {
            const isActive = activeRoomId === room.id;
            const hasUnread = (room.unread_count || 0) > 0;
            const isOnline = room.opponent_last_seen
              ? (new Date().getTime() - new Date(room.opponent_last_seen).getTime() < 45000)
              : false;

            return (
              <div
                key={room.id}
                onClick={() => onSelectRoom(room)}
                className={`p-3 cursor-pointer transition-all text-left flex items-center gap-2.5 border-b border-slate-50 group relative ${
                  isActive
                    ? 'bg-blue-50/70 border-l-[3px] border-l-blue-600'
                    : hasUnread
                      ? 'bg-blue-50/30 hover:bg-blue-50/50 border-l-[3px] border-l-blue-400'
                      : 'hover:bg-slate-100/70 border-l-[3px] border-l-transparent'
                }`}
              >
                <div className="relative flex-shrink-0">
                  <Avatar
                    src={room.opponent_avatar}
                    alt={room.opponent_name}
                    size="sm"
                    fallbackInitial={room.opponent_name}
                  />
                  {/* Unread dot indicator on avatar */}
                  {hasUnread && !isActive && (
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-600 rounded-full border-2 border-white" />
                  )}
                  {/* Online green status dot */}
                  {isOnline && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs truncate ${
                    isActive ? 'text-slate-900 font-semibold' :
                    hasUnread ? 'text-slate-900 font-bold' : 'text-slate-700'
                  }`}>
                    {room.opponent_name}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {room.products?.title || 'Produk'}
                  </p>
                </div>
                {/* Right Area: Unread Count + Hoverable Delete Button */}
                <div className="flex flex-col items-end justify-center gap-1.5 flex-shrink-0">
                  {hasUnread && !isActive && (
                    <span className="bg-blue-600 text-white text-[9px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
                      {room.unread_count > 99 ? '99+' : room.unread_count}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Hapus obrolan dengan ${room.opponent_name}? Semua pesan di dalamnya akan terhapus.`)) {
                        onDeleteRoom(room.id);
                      }
                    }}
                    className="text-slate-300 hover:text-red-500 transition-colors p-1 hover:bg-slate-200/50 rounded-lg sm:opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Hapus Obrolan"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
