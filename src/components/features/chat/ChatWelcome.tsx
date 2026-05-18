// src/components/features/chat/ChatWelcome.tsx
import { MessageCircle } from 'lucide-react';

/**
 * Default welcome screen shown in the right panel of the chat widget
 * before a conversation is selected.
 */
export default function ChatWelcome() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-slate-50/30">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <MessageCircle size={28} className="text-slate-300" />
      </div>
      <h4 className="text-sm font-bold text-slate-700">
        Selamat Datang di Chat SecondHub
      </h4>
      <p className="text-xs text-slate-400 max-w-[240px] mt-2 leading-relaxed">
        Pilih salah satu obrolan di sebelah kiri untuk mulai berbicara dengan penjual atau pembeli.
      </p>
    </div>
  );
}
