// src/hooks/useAuth.ts
'use client';

import { useContext } from 'react';
import { AuthContext } from '@/providers/AuthProvider';
import type { AuthContextType } from '@/providers/AuthProvider';

/**
 * Hook to access auth state from any client component.
 * Must be used inside an AuthProvider.
 *
 * @example
 * const { user, profile, isLoading, signOut } = useAuth();
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
