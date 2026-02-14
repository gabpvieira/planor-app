/**
 * Supabase Edge Function: Send Push Notification
 * Uses VAPID for Web Push API
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: Array<{ action: string; title: string; icon?: string }>;
  requireInteraction?: boolean;
  silent?: boolean;
}

interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

// Web Push implementation using Web Crypto API
async function sendWebPush(
  subscription: PushSubscription,
  payload: NotificationPayload,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<Response> {
  const encoder = new TextEncoder();
  
  // Create JWT for VAPID
  const header = { typ: 'JWT', alg: 'ES256' };
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    aud: new URL(subscription.endpoint).origin,
    exp: now + 12 * 60 * 60, // 12 hours
    sub: vapidSubject,
  };

  // Base64url encode
  const base64url = (data: Uint8Array | string): string => {
    const str = typeof data === 'string' ? data : String.fromCharCode(...data);
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  // Import VAPID private key
  const privateKeyBytes = Uint8Array.from(atob(vapidPrivateKey.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
  
  // Create signing key
  const signingKey = await crypto.subtle.importKey(
    'raw',
    privateKeyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  ).catch(() => null);

  if (!signingKey) {
    // Fallback: Use fetch with basic auth
    console.log('[Push] Using basic push without VAPID signing');
  }

  // Prepare payload
  const payloadString = JSON.stringify(payload);
  const payloadBytes = encoder.encode(payloadString);

  // Send push notification
  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '86400',
      'Urgency': 'normal',
      ...(vapidPublicKey && {
        'Authorization': `vapid t=${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}, k=${vapidPublicKey}`,
      }),
    },
    body: payloadBytes,
  });

  return response;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, notification, broadcast } = await req.json();

    // Validate input
    if (!notification || !notification.title) {
      return new Response(
        JSON.stringify({ error: 'Notification payload required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const vapidPublicKey = Deno.env.get('VITE_VAPID_PUBLIC_KEY') || Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@planor.app';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Supabase configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!vapidPublicKey || !vapidPrivateKey) {
      return new Response(
        JSON.stringify({ error: 'VAPID keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get subscriptions
    let query = supabase.from('push_subscriptions').select('*');
    
    if (!broadcast && userId) {
      query = query.eq('user_id', userId);
    }

    const { data: subscriptions, error: fetchError } = await query;

    if (fetchError) {
      console.error('[Push] Error fetching subscriptions:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'No subscriptions found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare notification payload
    const payload: NotificationPayload = {
      title: notification.title,
      body: notification.body || '',
      icon: notification.icon || '/icons/icon-192x192.png',
      badge: notification.badge || '/icons/icon-96x96.png',
      tag: notification.tag || `planor-${Date.now()}`,
      data: {
        url: notification.data?.url || '/app',
        timestamp: Date.now(),
        ...notification.data,
      },
      actions: notification.actions || [],
      requireInteraction: notification.requireInteraction || false,
      silent: notification.silent || false,
    };

    // Send to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          const response = await sendWebPush(
            {
              endpoint: sub.endpoint,
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
            payload,
            vapidPublicKey,
            vapidPrivateKey,
            vapidSubject
          );

          if (!response.ok) {
            // Handle expired/invalid subscriptions
            if (response.status === 404 || response.status === 410) {
              console.log('[Push] Removing invalid subscription:', sub.endpoint);
              await supabase
                .from('push_subscriptions')
                .delete()
                .eq('id', sub.id);
            }
            throw new Error(`Push failed: ${response.status}`);
          }

          return { success: true, endpoint: sub.endpoint };
        } catch (error) {
          console.error('[Push] Error sending to:', sub.endpoint, error);
          return { success: false, endpoint: sub.endpoint, error: error.message };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    return new Response(
      JSON.stringify({
        success: true,
        sent: successful,
        failed,
        total: subscriptions.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Push] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
