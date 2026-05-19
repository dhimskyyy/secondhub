// src/providers/AuthProvider.tsx
'use client';

import { createContext, useEffect, useState, useCallback, useRef } from 'react';
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
 * Global AuthProvider — single source of truth for auth state.
 *
 * Architecture:
 * 1. initialUser/initialProfile from server SSR → immediate render (no flash)
 * 2. onAuthStateChange → listens for login/logout/token refresh
 * 3. Profile fetched in background after auth change
 * 4. Timeout fallback → if onAuthStateChange never fires, unlock after 2s
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
  const hasInitialized = useRef(false);

  // Fetch profile from client-side
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) {
        console.warn('[AuthProvider] Profile fetch error:', error.message);
        return null;
      }
      return data as Profile;
    } catch {
      return null;
    }
  }, [supabase]);

  // Refresh profile (callable from child components after profile edit)
  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const freshProfile = await fetchProfile(user.id);
    if (freshProfile) setProfile(freshProfile);
  }, [user, fetchProfile]);

  // Sign out handler — forces hard navigation to clear all cached state
  const signOut = useCallback(async () => {
    try {
      // 1. Call explicit server route to destroy server session + cookies
      await fetch('/auth/logout', { method: 'POST' });
      // 2. Call client-side signOut asynchronously so it doesn't block if localStorage is deadlocked
      supabase.auth.signOut().catch(() => {});
    } catch {
      // Ignore signout errors
    }
    setUser(null);
    setProfile(null);
    
    // Give the POST request a tiny window to finish before reloading
    setTimeout(() => {
      window.location.href = '/login';
    }, 100);
  }, [supabase]);

  useEffect(() => {
    // Safety timeout: if onAuthStateChange never fires, unlock loading after 2 seconds
    const timeout = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
      }
    }, 2000);

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        const currentUser = session?.user ?? null;

        // On INITIAL_SESSION, prefer server-prefetched data if available
        if (_event === 'INITIAL_SESSION' && !hasInitialized.current) {
          hasInitialized.current = true;

          if (initialUser && initialProfile) {
            // Server already pre-fetched everything — just unlock
            setUser(initialUser);
            setProfile(initialProfile);
            setIsLoading(false);
            clearTimeout(timeout);
            return;
          }
        }

        // For all other events (SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.)
        setUser(currentUser);
        setIsLoading(false);
        clearTimeout(timeout);

        if (currentUser) {
          // Fetch profile in background using .then() to prevent Supabase Auth deadlock!
          // NEVER await a supabase.from() query inside onAuthStateChange.
          fetchProfile(currentUser.id).then((prof) => {
            setProfile(prof);
          });
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, isLoading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
