const CACHE_NAME = 'radiz-portal-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/logoradiz.png',
  '/radiz-driver.jpg.jpg',
  '/manifest.json'
];
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(URLS_TO_CACHE).catch(err => {
        console.log('Error cacheando recursos iniciales', err);
      });
    })
  );
});
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    })
  );
});
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});

// ── PUSH: recibe notificaciones del servidor aunque la app esté cerrada ──
self.addEventListener('push', event => {
  let titulo = '⚡ Nuevo pedido Express';
  let opciones = {
    body: 'Hay un pedido disponible en tu zona.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'pedido-express',
    renotify: true,
    data: { url: '/' }
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      if (payload.titulo) titulo = payload.titulo;
      if (payload.cuerpo) opciones.body = payload.cuerpo;
      if (payload.url)    opciones.data.url = payload.url;
    } catch (_) {
      opciones.body = event.data.text() || opciones.body;
    }
  }

  event.waitUntil(self.registration.showNotification(titulo, opciones));
});

// ── NOTIFICATIONCLICK: abre o enfoca la app al tocar la notificación ──
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const existing = list.find(c => c.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});
