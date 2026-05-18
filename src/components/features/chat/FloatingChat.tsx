// src/components/features/chat/FloatingChat.tsx
'use client';

import { useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import ChatInbox from './ChatInbox';
import ChatRoomView from './ChatRoom';
import ChatWelcome from './ChatWelcome';

/**
 * 3-Layer Floating Chat Widget (ala Shopee Web)
 *
 * Layer 1 (Collapsed): Floating "Chat" button with notification badge
 * Layer 2 (Inbox): Sidebar with room list + welcome panel
 * Layer 3 (Active Room): Full messaging interface with product header
 *
 * Lives in the root layout — never unmounts during navigation.
 */
export default function FloatingChat() {
  const { user } = useAuth();
  const {
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
  } = useChat();

  // Fetch rooms when widget opens
  useEffect(() => {
    if (isOpen && user) {
      fetchRooms();
    }
  }, [isOpen, user, fetchRooms]);

  // Don't render anything for guests
  if (!user) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans text-slate-800">
      {/* =============================================
          LAYER 1: COLLAPSED FLOATING BUTTON
          ============================================= */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-3 rounded-full shadow-2xl shadow-blue-300/40 flex items-center gap-2 transition-all duration-300 transform hover:scale-105 font-bold text-sm tracking-wide group"
        >
          <MessageCircle size={18} className="group-hover:rotate-12 transition-transform" />
          <span>Chat</span>
          {rooms.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ml-1 shadow-sm">
              {rooms.length}
            </span>
          )}
        </button>
      )}

      {/* =============================================
          LAYER 2 + 3: EXPANDED CHAT BOX
          ============================================= */}
      {isOpen && (
        <div className="bg-white w-[340px] sm:w-[680px] h-[460px] rounded-2xl shadow-2xl shadow-slate-300/40 border border-slate-200/80 flex overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Left: Inbox Sidebar */}
          <div className="hidden sm:flex">
            <ChatInbox
              rooms={rooms}
              activeRoomId={activeRoom?.id || null}
              onSelectRoom={setActiveRoom}
              onMinimize={() => {
                setIsOpen(false);
                setActiveRoom(null);
              }}
            />
          </div>

          {/* Right: Chat Room or Welcome */}
          {activeRoom ? (
            <ChatRoomView
              room={activeRoom}
              messages={messages}
              currentUserId={user.id}
              inputText={inputText}
              uploading={uploading}
              onInputChange={setInputText}
              onSendMessage={sendMessage}
              onSendImage={sendImage}
              onBack={() => setActiveRoom(null)}
            />
          ) : (
            <>
              {/* Mobile: Show inbox in the right panel */}
              <div className="sm:hidden flex-1">
                <ChatInbox
                  rooms={rooms}
                  activeRoomId={null}
                  onSelectRoom={setActiveRoom}
                  onMinimize={() => setIsOpen(false)}
                />
              </div>
              {/* Desktop: Show welcome */}
              <div className="hidden sm:flex flex-1">
                <ChatWelcome />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
