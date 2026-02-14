// Planor Service Worker v2.0
// Push Notifications + Offline Support

const CACHE_NAME = 'planor-cache-v2';
const OFFLINE_URL = '/offline.html';

// Assets to cache for offline support
const STATIC_ASSETS = [
  '/',
  '/app',
  '/manifest.json',
  '/favicon.png',
  '/favoricon.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker v2.0...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => clients.claim())
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip API requests
  if (event.request.url.includes('/api/')) return;
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone response for caching
        const responseClone = response.clone();
        
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

// ============================================
// PUSH NOTIFICATIONS
// ============================================

// Push event - receive notification from server
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  let notificationData = {
    title: 'Planor',
    body: 'Você tem uma nova notificação',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: 'planor-notification',
    data: {
      url: '/app',
      timestamp: Date.now(),
    },
    actions: [],
    requireInteraction: false,
    silent: false,
    vibrate: [100, 50, 100],
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = {
        ...notificationData,
        ...payload,
        data: {
          ...notificationData.data,
          ...payload.data,
        },
      };
    } catch (e) {
      console.error('[SW] Error parsing push data:', e);
      notificationData.body = event.data.text();
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data,
    actions: notificationData.actions,
    requireInteraction: notificationData.requireInteraction,
    silent: notificationData.silent,
    vibrate: notificationData.vibrate,
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/app';
  const action = event.action;

  // Handle action buttons
  if (action) {
    console.log('[SW] Action clicked:', action);
    // Custom action handling can be added here
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes('/app') && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed');
  
  // Track notification dismissal (optional analytics)
  const data = event.notification.data;
  if (data?.trackDismissal) {
    // Send analytics event
  }
});

// Push subscription change event
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] Push subscription changed');
  
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: self.vapidPublicKey,
    })
    .then((subscription) => {
      // Send new subscription to server
      return fetch('/api/notifications/resubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldEndpoint: event.oldSubscription?.endpoint,
          newSubscription: subscription.toJSON(),
        }),
      });
    })
    .catch((error) => {
      console.error('[SW] Failed to resubscribe:', error);
    })
  );
});

// ============================================
// BACKGROUND SYNC
// ============================================

self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
  
  if (event.tag === 'sync-notifications') {
    event.waitUntil(syncNotifications());
  }
});

async function syncData() {
  console.log('[SW] Syncing offline data...');
  // Implement offline data sync logic here
}

async function syncNotifications() {
  console.log('[SW] Syncing notification preferences...');
  // Implement notification sync logic here
}

// ============================================
// MESSAGE HANDLING
// ============================================

self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'SET_VAPID_KEY') {
    self.vapidPublicKey = event.data.key;
  }
  
  if (event.data.type === 'GET_SUBSCRIPTION') {
    self.registration.pushManager.getSubscription()
      .then((subscription) => {
        event.ports[0].postMessage({ subscription: subscription?.toJSON() });
      });
  }
});

console.log('[SW] Service Worker loaded');
