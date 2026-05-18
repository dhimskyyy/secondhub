// src/app/dashboard/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  User,
  MapPin,
  Phone,
  Calendar,
  FileText,
  Save,
  Upload,
  Camera,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSupabase } from '@/hooks/useSupabase';
import Skeleton from '@/components/ui/Skeleton';
import type { Profile } from '@/types/profile';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, isLoading: authLoading, refreshProfile } = useAuth();
  const supabase = useSupabase();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [birthPlace, setBirthPlace] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Load profile data into form
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }

    if (profile) {
      setFullName(profile.full_name || '');
      setBirthPlace(profile.birth_place || '');
      setBirthDate(profile.birth_date || '');
      setPhoneNumber(profile.phone_number || '');
      setCity(profile.city || '');
      setBio(profile.bio || '');
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [authLoading, user, profile, router]);

  // Avatar upload handler
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    const file = e.target.files[0];

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal 2MB!');
      return;
    }

    setAvatarUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      // Update profile with new avatar URL
      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      setAvatarUrl(publicUrl);
      await refreshProfile();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah foto';
      alert(msg);
    } finally {
      setAvatarUploading(false);
    }
  };

  // Save profile form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setSuccess(false);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          birth_place: birthPlace || null,
          birth_date: birthDate || null,
          phone_number: phoneNumber || null,
          city: city || null,
          bio: bio || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan profil';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-24 rounded-full mx-auto" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900 mb-6">Pengaturan Profil</h1>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Avatar Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex flex-col items-center">
          <div className="relative group">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white relative">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Avatar"
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold uppercase">
                  {fullName ? fullName.charAt(0) : <User size={32} />}
                </div>
              )}
              {avatarUploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors border border-slate-200">
              <Camera size={14} className="text-slate-600" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={avatarUploading}
              />
            </label>
          </div>
          <p className="text-white/80 text-xs mt-3">Klik ikon kamera untuk mengganti foto</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Success message */}
          {success && (
            <div className="bg-emerald-50 text-emerald-600 text-xs p-3 rounded-xl border border-emerald-100 font-medium">
              ✅ Profil berhasil diperbarui!
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <User size={14} className="text-slate-400" />
              Nama Lengkap
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          {/* Birth Place + Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <MapPin size={14} className="text-slate-400" />
                Tempat Lahir
              </label>
              <input
                type="text"
                placeholder="Contoh: Jakarta"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
                value={birthPlace}
                onChange={(e) => setBirthPlace(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
                <Calendar size={14} className="text-slate-400" />
                Tanggal Lahir
              </label>
              <input
                type="date"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <Phone size={14} className="text-slate-400" />
              No. WhatsApp
            </label>
            <input
              type="tel"
              placeholder="08xxxxxxxxxx"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>

          {/* City */}
          <div>
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <MapPin size={14} className="text-slate-400" />
              Kota Domisili
            </label>
            <input
              type="text"
              placeholder="Contoh: Purwokerto"
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          {/* Bio */}
          <div>
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <FileText size={14} className="text-slate-400" />
              Bio
            </label>
            <textarea
              rows={3}
              placeholder="Ceritakan sedikit tentang diri Anda..."
              className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all resize-none"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 rounded-xl text-sm transition-all shadow-md hover:shadow-lg hover:shadow-blue-200/50 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save size={16} />
                Simpan Perubahan
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
