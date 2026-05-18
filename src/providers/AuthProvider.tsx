// src/providers/AuthProvider.tsx
'use client';

import { createContext, useEffect, useState, useCallback } from 'react';
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js';
import { createBrowserSupabaseClient } from '@/lib/supabase-browser';
import type { Profile } from '@/types/profile';

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isLoading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

interface AuthProviderProps {
  children: React.ReactNode;
  /** Server-pre-fetched user (avoids client flash) */
  initialUser?: User | null;
  /** Server-pre-fetched profile (avoids "Pengguna" flicker) */
  initialProfile?: Profile | null;
}

/**
 * Global AuthProvider that wraps the entire app.
 * Receives server-fetched initial data to prevent flickering,
 * then listens for real-time auth state changes.
 */
export default function AuthProvider({
  children,
  initialUser = null,
  initialProfile = null,
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [profile, setProfile] = useState<Profile | null>(initialProfile);
  const [isLoading, setIsLoading] = useState(!initialUser);

  const supabase = createBrowserSupabaseClient();

  // Fetch profile from client-side (for updates)
  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return data as Profile | null;
  }, [supabase]);

  // Refresh profile (callable from child components after profile edit)
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const freshProfile = await fetchProfile(user.id);
    if (freshProfile) setProfile(freshProfile);
  }, [user, fetchProfile]);

  // Sign out handler
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, [supabase]);

  useEffect(() => {
    // Listen for auth state changes (login, logout, token refresh)
    // This immediately fires an INITIAL_SESSION event reading from local storage (extremely fast)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        const currentUser = session?.user ?? null;
        
        // Immediately set user and unlock loading state to prevent skeleton hang
        setUser(currentUser);
        setIsLoading(false);

        if (currentUser) {
          const prof = await fetchProfile(currentUser.id);
          setProfile(prof);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, initialUser, fetchProfile]);

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
