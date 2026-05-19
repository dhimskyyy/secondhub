// src/components/features/chat/ChatInbox.tsx
import { Minimize2 } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import type { ChatRoom } from '@/types/chat';

interface ChatInboxProps {
  rooms: ChatRoom[];
  activeRoomId: string | null;
  onSelectRoom: (room: ChatRoom) => void;
  onMinimize: () => void;
}

/**
 * Left sidebar of the chat widget — lists all chat rooms with unread indicators.
 */
export default function ChatInbox({
  rooms,
  activeRoomId,
  onSelectRoom,
  onMinimize,
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
            return (
              <div
                key={room.id}
                onClick={() => onSelectRoom(room)}
                className={`p-3 cursor-pointer transition-all text-left flex items-center gap-2.5 border-b border-slate-50 ${
                  isActive
                    ? 'bg-blue-50/70 border-l-[3px] border-l-blue-600'
                    : hasUnread
                      ? 'bg-blue-50/30 hover:bg-blue-50/50 border-l-[3px] border-l-blue-400'
                      : 'hover:bg-slate-100/70 border-l-[3px] border-l-transparent'
                }`}
              >
                <div className="relative">
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
                {/* Unread count badge */}
                {hasUnread && !isActive && (
                  <span className="bg-blue-600 text-white text-[9px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 flex-shrink-0">
                    {room.unread_count > 99 ? '99+' : room.unread_count}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
