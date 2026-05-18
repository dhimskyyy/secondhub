// src/components/features/TrackProductView.tsx
'use client';

import { useEffect } from 'react';
import { useSupabase } from '@/hooks/useSupabase';

interface TrackProductViewProps {
  productId: string;
  ipAddress: string;
}

/**
 * Invisible tracker component for the anti-spam view counting RPC.
 * Fires once on mount, records the view via the database "satpam" function.
 */
export default function TrackProductView({ productId, ipAddress }: TrackProductViewProps) {
  const supabase = useSupabase();

  useEffect(() => {
    const recordView = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const currentUserId = user?.id || null;

        await supabase.rpc('record_product_view', {
          p_product_id: productId,
          p_user_id: currentUserId,
          p_ip_address: ipAddress,
        });
      } catch (err) {
        console.error('[TrackProductView] Failed to record view:', err);
      }
    };

    recordView();
  }, [productId, ipAddress, supabase]);

  return null;
}
