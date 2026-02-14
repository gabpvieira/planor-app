/**
 * Push Notifications Service
 * Handles Web Push API integration with VAPID
 */

import { supabase } from '@/lib/supabase';

// VAPID Public Key from environment
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  expirationTime?: number | null;
}

export interface NotificationPayload {
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

class PushNotificationsService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  /**
   * Check if VAPID key is configured
   */
  isConfigured(): boolean {
    return !!VAPID_PUBLIC_KEY && VAPID_PUBLIC_KEY.length > 0;
  }

  /**
   * Get current notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      console.warn('[Push] Notifications not supported');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('[Push] Permission result:', permission);
      return permission;
    } catch (error) {
      console.error('[Push] Error requesting permission:', error);
      return 'denied';
    }
  }

  /**
   * Get or register service worker
   */
  async getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (this.registration) {
      return this.registration;
    }

    if (!('serviceWorker' in navigator)) {
      console.warn('[Push] Service Worker not supported');
      return null;
    }

    try {
      this.registration = await navigator.serviceWorker.ready;
      console.log('[Push] Service Worker ready');
      return this.registration;
    } catch (error) {
      console.error('[Push] Error getting service worker:', error);
      return null;
    }
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(userId: string): Promise<PushSubscription | null> {
    if (!this.isSupported()) {
      throw new Error('Push notifications not supported');
    }

    if (!this.isConfigured()) {
      throw new Error('VAPID key not configured');
    }

    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    const registration = await this.getServiceWorkerRegistration();
    if (!registration) {
      throw new Error('Service Worker not available');
    }

    try {
      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Create new subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
        console.log('[Push] New subscription created');
      } else {
        console.log('[Push] Using existing subscription');
      }

      this.subscription = subscription;

      // Save subscription to database
      await this.saveSubscriptionToDatabase(userId, subscription);

      return subscription;
    } catch (error) {
      console.error('[Push] Error subscribing:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(userId: string): Promise<boolean> {
    const registration = await this.getServiceWorkerRegistration();
    if (!registration) {
      return false;
    }

    try {
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        console.log('[Push] Unsubscribed successfully');
      }

      // Remove subscription from database
      await this.removeSubscriptionFromDatabase(userId);

      this.subscription = null;
      return true;
    } catch (error) {
      console.error('[Push] Error unsubscribing:', error);
      return false;
    }
  }

  /**
   * Get current subscription
   */
  async getSubscription(): Promise<PushSubscription | null> {
    if (this.subscription) {
      return this.subscription;
    }

    const registration = await this.getServiceWorkerRegistration();
    if (!registration) {
      return null;
    }

    try {
      this.subscription = await registration.pushManager.getSubscription();
      return this.subscription;
    } catch (error) {
      console.error('[Push] Error getting subscription:', error);
      return null;
    }
  }

  /**
   * Check if user is subscribed
   */
  async isSubscribed(): Promise<boolean> {
    const subscription = await this.getSubscription();
    return !!subscription;
  }

  /**
   * Save subscription to Supabase
   */
  private async saveSubscriptionToDatabase(
    userId: string,
    subscription: PushSubscription
  ): Promise<void> {
    const subscriptionData = subscription.toJSON() as PushSubscriptionData;

    try {
      // First, try to update existing subscription
      const { error: updateError } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: userId,
          endpoint: subscriptionData.endpoint,
          p256dh: subscriptionData.keys?.p256dh || '',
          auth: subscriptionData.keys?.auth || '',
          expiration_time: subscriptionData.expirationTime,
          user_agent: navigator.userAgent,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,endpoint',
        });

      if (updateError) {
        console.error('[Push] Error saving subscription:', updateError);
        throw updateError;
      }

      // Also update the profiles table for backward compatibility
      await supabase
        .from('profiles')
        .update({
          push_subscription: subscriptionData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      console.log('[Push] Subscription saved to database');
    } catch (error) {
      console.error('[Push] Database error:', error);
      throw error;
    }
  }

  /**
   * Remove subscription from database
   */
  private async removeSubscriptionFromDatabase(userId: string): Promise<void> {
    try {
      // Remove from push_subscriptions table
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', userId);

      // Clear from profiles table
      await supabase
        .from('profiles')
        .update({
          push_subscription: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      console.log('[Push] Subscription removed from database');
    } catch (error) {
      console.error('[Push] Error removing subscription:', error);
    }
  }

  /**
   * Send a test notification (local only)
   */
  async sendTestNotification(): Promise<void> {
    const permission = this.getPermissionStatus();
    
    if (permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    const registration = await this.getServiceWorkerRegistration();
    if (!registration) {
      throw new Error('Service Worker not available');
    }

    await registration.showNotification('Planor - Teste', {
      body: 'Suas notificações estão funcionando corretamente! 🎉',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      tag: 'test-notification',
      data: {
        url: '/app/settings',
        test: true,
      },
    } as NotificationOptions);
  }

  /**
   * Request server to send a push notification
   */
  async requestServerNotification(
    userId: string,
    payload: NotificationPayload
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId,
          notification: payload,
        },
      });

      if (error) {
        console.error('[Push] Server notification error:', error);
        return false;
      }

      console.log('[Push] Server notification sent:', data);
      return true;
    } catch (error) {
      console.error('[Push] Error sending server notification:', error);
      return false;
    }
  }
}

// Export singleton instance
export const pushNotifications = new PushNotificationsService();

// Export VAPID public key for external use
export const getVapidPublicKey = () => VAPID_PUBLIC_KEY;
