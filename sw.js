const CACHE_NAME = 'daco-storymaker-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Amiri&family=Lalezar&family=Markazi+Text&family=Noto+Naskh+Arabic&family=Vazirmatn:wght@400;700;800&display=swap',
  'https://cdn.fontcdn.ir/Font/Persian/Shabnam/Shabnam.css'
];

// Install Event - Cache Resources
self.addEventListener('install', function(event) {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(function() {
        console.log('[SW] Skip waiting on install');
        return self.skipWaiting();
      })
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', function(event) {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch Event - Network First Strategy for Dynamic Content
self.addEventListener('fetch', function(event) {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(function(cache) {
      return fetch(event.request)
        .then(function(response) {
          // Clone the response since streams can only be read once
          const responseClone = response.clone();
          
          // Only cache successful responses
          if (response.status === 200) {
            cache.put(event.request, responseClone);
          }
          
          return response;
        })
        .catch(function() {
          // If network fails, try to get from cache
          return cache.match(event.request)
            .then(function(cachedResponse) {
              if (cachedResponse) {
                console.log('[SW] Serving from cache:', event.request.url);
                return cachedResponse;
              }
              
              // If not in cache, return a generic offline page for navigation requests
              if (event.request.destination === 'document') {
                return new Response(`
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>آفلاین - DACO Storymaker</title>
                    <style>
                      body { 
                        font-family: Arial, sans-serif; 
                        text-align: center; 
                        padding: 50px;
                        background: #fff3e3;
                        color: #1b3b14;
                      }
                      .offline-message {
                        max-width: 400px;
                        margin: 0 auto;
                        padding: 30px;
                        background: white;
                        border-radius: 15px;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                      }
                      h1 { color: #ff6e41; }
                      button {
                        background: #ff6e41;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 16px;
                        margin-top: 20px;
                      }
                    </style>
                  </head>
                  <body>
                    <div class="offline-message">
                      <h1>📱 DACO Storymaker</h1>
                      <h2>🌐 آفلاین هستید</h2>
                      <p>لطفاً اتصال اینترنت خود را بررسی کنید.</p>
                      <p>Please check your internet connection.</p>
                      <button onclick="window.location.reload()">تلاش مجدد / Retry</button>
                    </div>
                  </body>
                  </html>
                `, {
                  headers: { 'Content-Type': 'text/html' }
                });
              }
              
              // For other requests, return a network error
              return new Response('Network error occurred', {
                status: 408,
                headers: { 'Content-Type': 'text/plain' }
              });
            });
        });
    })
  );
});

// Background Sync Event (for future enhancements)
self.addEventListener('sync', function(event) {
  console.log('[SW] Background sync:', event.tag);
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Push Event (for future notifications)
self.addEventListener('push', function(event) {
  const options = {
    body: event.data ? event.data.text() : 'پیام جدید از DACO Storymaker',
    icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5NiAxOTYiIGZpbGw9IiNmZjZlNDEiPgogIDxyZWN0IHdpZHRoPSIxOTYiIGhlaWdodD0iMTk2IiBmaWxsPSIjZmY2ZTQxIi8+CiAgPHRleHQgeD0iOTgiIHk9Ijk4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjZmZmZmZmIiBmb250LW5hbWU9IkFyaWFsIiBmb250LXNpemU9IjMwIj5EQUNPPC90ZXh0Pgo8L3N2Zz4=',
    badge: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5NiAxOTYiIGZpbGw9IiNmZjZlNDEiPgogIDxyZWN0IHdpZHRoPSIxOTYiIGhlaWdodD0iMTk2IiBmaWxsPSIjZmY2ZTQxIi8+CiAgPHRleHQgeD0iOTgiIHk9Ijk4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjZmZmZmZmIiBmb250LW5hbWU9IkFyaWFsIiBmb250LXNpemU9IjMwIj5EQUNPPC90ZXh0Pgo8L3N2Zz4=',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    }
  };

  event.waitUntil(
    self.registration.showNotification('DACO Storymaker', options)
  );
});

// Notification Click Event
self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notification click received.');

  event.notification.close();

  event.waitUntil(
    clients.openWindow('/')
  );
});

// Helper function for background sync
async function doBackgroundSync() {
  console.log('[SW] Performing background sync');
  // Future: sync offline actions, upload pending images, etc.
}

// Helper function to update cache
async function updateCache() {
  const cache = await caches.open(CACHE_NAME);
  const requests = await cache.keys();
  return Promise.all(
    requests.map(request => {
      return fetch(request).then(response => {
        if (response.status === 200) {
          return cache.put(request, response);
        }
      }).catch(() => {
        // Ignore network errors during cache update
      });
    })
  );
}

// Message Event - Communication with main app
self.addEventListener('message', function(event) {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'UPDATE_CACHE') {
    event.waitUntil(updateCache());
  }
});

console.log('[SW] Service Worker script loaded');
