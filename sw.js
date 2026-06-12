// GroupYetu360 Service Worker v1.0
// Enables offline functionality and PWA installation

const CACHE_NAME = 'gy360-v1';
const STATIC_ASSETS = [
  '/groupyetu360/',
  '/groupyetu360/index.html',
  '/groupyetu360/manifest.json',
  '/groupyetu360/icons/icon-192x192.png',
  '/groupyetu360/icons/icon-512x512.png',
];

// ── INSTALL ──
self.addEventListener('install', event => {
  console.log('[GY360 SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[GY360 SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.log('[GY360 SW] Cache failed (ok for first install):', err);
      });
    })
  );
  self.skipWaiting();
});

// ── ACTIVATE ──
self.addEventListener('activate', event => {
  console.log('[GY360 SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => {
          console.log('[GY360 SW] Deleting old cache:', key);
          return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// ── FETCH ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Don't cache Supabase API calls or external resources
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('africastalking.com') ||
    url.hostname.includes('safaricom.co.ke') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('jsdelivr.net')
  ) {
    return; // Let these go to network directly
  }

  // For app pages: network first, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed - serve from cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Offline fallback for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/groupyetu360/index.html');
          }
        });
      })
  );
});

// ── PUSH NOTIFICATIONS (future use) ──
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  self.registration.showNotification(data.title || 'GroupYetu360', {
    body: data.body || 'You have a new notification',
    icon: '/groupyetu360/icons/icon-192x192.png',
    badge: '/groupyetu360/icons/icon-96x96.png',
    data: data.url || '/groupyetu360/',
  });
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data || '/groupyetu360/')
  );
});
