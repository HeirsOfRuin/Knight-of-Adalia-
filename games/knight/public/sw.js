// Service worker for the installed app. Network first, so every launch with a
// connection gets the newest build; the cache is only the offline fallback.
// A new build registers this script with a new ?build= query, which installs
// a fresh worker; it takes over at once and the page reloads into the update.
const CACHE = 'adalia-v1';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  // other games published beside this one (house/) are theirs to serve, offline or not
  if (url.pathname.startsWith(new URL('./house/', self.registration.scope).pathname)) return;
  event.respondWith(
    fetch(req, { cache: 'no-store' })
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html'))),
  );
});
