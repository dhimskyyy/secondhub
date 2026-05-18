// components/FloatingChat.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../src/lib/supabase';

export default function FloatingChat() {
  const [user, setUser] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false); // Mengatur buka/tutup chat box
  const [rooms, setRooms] = useState<any[]>([]);
  const [activeRoom, setActiveRoom] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [uploading, setUploading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Cek Sesi Login User
  useEffect(() => {
    // Gunakan onAuthStateChange agar widget chat langsung muncul begitu sesi login terdeteksi
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      
      if (currentUser) {
        fetchChatRooms(currentUser.id);
      } else {
        setRooms([]);
        setActiveRoom(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 2. Ambil Daftar Kamar Chat Milik User (Sebagai Pembeli atau Penjual)
  const fetchChatRooms = async (userId: string) => {
    const { data, error } = await supabase
      .from('chat_rooms')
      .select(`
        id,
        created_at,
        buyer_id,
        seller_id,
        products (id, title, price, product_images(image_url))
      `)
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Ambil profile nama user lawan bicara secara manual untuk menghindari eror lintas skema auth
      const formattedRooms = await Promise.all(data.map(async (room: any) => {
        const targetId = room.buyer_id === userId ? room.seller_id : room.buyer_id;
        const { data: prof } = await supabase.from('profiles').select('full_name').eq('id', targetId).single();
        return { ...room, opponent_name: prof?.full_name || 'Pengguna SecondHub' };
      }));
      setRooms(formattedRooms);
    }
  };

  // 3. Ambil Pesan di Kamar Aktif & Pasang Realtime Subscription
  useEffect(() => {
    if (!activeRoom) return;

    // A. Ambil histori pesan lama
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('room_id', activeRoom.id)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    // B. Pasang Jaringan Real-time (Mendengar siaran pesan baru secara instan)
    const channel = supabase
      .channel(`room-${activeRoom.id}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', // <--- PERBAIKAN 1: Ubah 'scheme' menjadi 'schema'
          table: 'chat_messages', 
          filter: `room_id=eq.${activeRoom.id}` 
        },
        (payload: any) => { // <--- PERBAIKAN 2: Tambahkan ': any' di sini
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeRoom]);

  // Auto-scroll ke baris pesan paling bawah saat ada pesan baru masuk
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 4. Fungsi Mengirim Pesan Teks
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !user || !activeRoom) return;

    const currentMsg = inputText;
    setInputText('');

    await supabase.from('chat_messages').insert([
      { room_id: activeRoom.id, sender_id: user.id, message: currentMsg }
    ]);
  };

  // 5. Fungsi Mengirim Gambar/Foto (Kamera & Galeri Terpadu)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !activeRoom || !user) return;
    
    setUploading(true);
    const file = e.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `chat-${activeRoom.id}-${Date.now()}.${fileExt}`;

    try {
      // Upload ke bucket storage bawaan produk yang sudah kita miliki
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      // Masukkan log pesan chat bertipe gambar ke database
      await supabase.from('chat_messages').insert([
        { 
          room_id: activeRoom.id, 
          sender_id: user.id, 
          message: '📷 Mengirimkan Foto', 
          image_url: publicUrl 
        }
      ]);
    } catch (err: any) {
      alert('Gagal mengirim gambar: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Jika belum login, hancurkan komponen (tidak merender apa pun)
  if (!user) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 font-sans text-gray-800">
      
      {/* ==========================================
          STATE 1: TOMBOL UTAMA CIUT (GAMBAR 1)
          ========================================== */}
      {!isOpen && (
        <button
          onClick={() => { setIsOpen(true); fetchChatRooms(user.id); }}
          className="bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-2 transition-all duration-200 transform hover:scale-105 font-bold text-sm tracking-wide"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span>Chat</span>
        </button>
      )}

      {/* ==========================================
          WADAH UTAMA KOTAK CHAT BOX (GAMBAR 2 & 3)
          ========================================== */}
      {isOpen && (
        <div className="bg-white w-[680px] h-[460px] rounded-t-2xl shadow-2xl border border-gray-200 flex overflow-hidden transition-all duration-300">
          
          {/* KOLOM KIRI: DAFTAR INBOX RIWAYAT CHAT (GAMBAR 2) */}
          <div className="w-[240px] border-r border-gray-100 flex flex-col bg-gray-50/50">
            <div className="p-4 border-b border-gray-100 bg-white flex items-center justify-between">
              <h2 className="font-bold text-sm text-gray-900">Chat Saya</h2>
              {/* Tombol Perkecil / Minimize */}
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {rooms.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400 px-3">Belum ada obrolan aktif.</div>
              ) : (
                rooms.map((room) => (
                  <div
                    key={room.id}
                    onClick={() => setActiveRoom(room)}
                    className={`p-3 cursor-pointer transition text-left flex items-center gap-2.5 ${
                      activeRoom?.id === room.id ? 'bg-blue-50/60 border-l-4 border-blue-600 font-semibold' : 'hover:bg-gray-100/70'
                    }`}
                  >
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold uppercase">
                      {room.opponent_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-900 truncate">{room.opponent_name}</p>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">{room.products?.title || 'Produk'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* KOLOM KANAN: RUANGAN CHAT AKTIF (GAMBAR 3) */}
          <div className="flex-1 flex flex-col bg-white">
            {activeRoom ? (
              <>
                {/* Header Kepala Chat Room */}
                <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-white">
                  <div>
                    <h3 className="font-bold text-xs text-gray-900">{activeRoom.opponent_name}</h3>
                    <p className="text-[10px] text-gray-400">Online</p>
                  </div>
                  <button onClick={() => setActiveRoom(null)} className="sm:hidden text-xs text-blue-600">Kembali</button>
                </div>

                {/* MINI CARD PRATINJAU BARANG YANG DITANYAKAN */}
                <div className="p-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-9 h-9 bg-gray-200 rounded-lg overflow-hidden border flex-shrink-0">
                    <img 
                      src={activeRoom.products?.product_images?.[0]?.image_url || activeRoom.products?.product_images?.image_url} 
                      alt="" 
                      className="object-cover w-full h-full" 
                    />
                  </div>
                  <div className="text-left min-w-0 flex-1">
                    <h4 className="text-xs font-semibold text-gray-800 truncate leading-tight">{activeRoom.products?.title}</h4>
                    <p className="text-xs font-bold text-blue-600 mt-0.5">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(activeRoom.products?.price)}
                    </p>
                  </div>
                </div>

                {/* AREA UTAMA LIST BALASAN CHAT */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50/40 space-y-3">
                  {messages.map((msg) => {
                    const isMe = msg.sender_id === user.id;
                    return (
                      <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] p-2.5 rounded-2xl text-xs shadow-sm ${
                          isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white text-gray-800 border rounded-bl-none'
                        }`}>
                          {msg.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={msg.image_url} alt="chat-media" className="rounded-xl max-w-full max-h-[140px] object-cover mb-1" />
                          ) : (
                            <p className="whitespace-pre-wrap text-left">{msg.message}</p>
                          )}
                          <p className={`text-[9px] text-right mt-1 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* KOLOM INPUT FORM & CLIP UNTUK UPLOAD FOTO */}
                <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-100 flex items-center gap-2 bg-white">
                  {/* Tombol Kamera/Galeri */}
                  <label className="cursor-pointer text-gray-400 hover:text-gray-600 transition p-1.5 hover:bg-gray-50 rounded-lg flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 17.5 3 6V3h3l11.5 11.5z"/><path d="m16 19 2 2 1.5-1.5-2-2Z"/><path d="M19 5v14"/><path d="M5 19h14"/></svg>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
                  </label>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={uploading ? 'Sedang mengunggah foto...' : 'Tulis pesan Anda di sini...'}
                    disabled={uploading}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-xs outline-none focus:bg-white focus:border-blue-500 transition"
                  />
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3.5 py-2 rounded-xl font-medium transition flex-shrink-0">
                    Kirim
                  </button>
                </form>
              </>
            ) : (
              /* Tampilan Selamat Datang Default di Sisi Kanan (Sebelum Klik Kamar) */
              <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 p-6 bg-gray-50/30">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 mb-2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <h4 className="text-sm font-bold text-gray-700">Selamat Datang di Chat SecondHub</h4>
                <p className="text-xs max-w-[240px] mt-1 leading-normal">Silakan pilih salah satu daftar obrolan di sebelah kiri untuk mulai berbicara dengan penjual.</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}