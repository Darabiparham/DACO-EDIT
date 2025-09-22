const CACHE_NAME = 'daco-storymaker-v1.0.0';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-72.png',
  './icon-96.png',
  './icon-128.png',
  './icon-144.png',
  './icon-152.png',
  './icon-192.png',
  './icon-384.png',
  './icon-512.png',
  // External resources
  'https://fonts.googleapis.com/css2?family=Amiri&family=Lalezar&family=Markazi+Text&family=Noto+Naskh+Arabic&family=Vazirmatn:wght@400;700;800&display=swap',
  'https://cdn.fontcdn.ir/Font/Persian/Shabnam/Shabnam.css'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Failed to cache resources:', error);
        // Continue installation even if some resources fail to cache
        return Promise.resolve();
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Ensure the new service worker takes control immediately
  return self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests for external APIs
  if (!event.request.url.startsWith(self.location.origin) && 
      !event.request.url.startsWith('https://fonts.googleapis.com') &&
      !event.request.url.startsWith('https://fonts.gstatic.com') &&
      !event.request.url.startsWith('https://cdn.fontcdn.ir')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          console.log('Serving from cache:', event.request.url);
          return response;
        }

        // Otherwise fetch from network
        console.log('Fetching from network:', event.request.url);
        return fetch(event.request.clone())
          .then((response) => {
            // Check if response is valid
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Add to cache for future use
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.log('Fetch failed, serving offline fallback:', error);
            
            // Serve offline fallback for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
            
            // For other requests, return a basic error response
            return new Response('Offline - Resource not available', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Handle background sync (if needed for future features)
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event.tag);
  // Add background sync logic here if needed
});

// Handle push notifications (if needed for future features)
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  // Add push notification logic here if needed
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
      case 'GET_VERSION':
        event.ports[0].postMessage({
          type: 'VERSION',
          version: CACHE_NAME
        });
        break;
      default:
        console.log('Unknown message type:', event.data.type);
    }
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled promise rejection:', event.reason);
  event.preventDefault();
});
