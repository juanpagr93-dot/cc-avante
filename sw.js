// C. C. AVANTE · funciona sin internet. Cambia la versión cuando subas una actualización.
const CACHE = 'cc-avante-fb-v6';
const SHELL = ['./', './index.html', './firebase-config.js', './manifest.webmanifest', './logo-avante.svg', './icon-v3-192.png', './icon-v3-512.png', './icon-v3-1024.png', './maskable-v3-512.png', './maskable-v3-1024.png', './apple-touch-icon-v3.png', './favicon-v3-64.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Página y configuración: primero internet (para recibir cambios); sin internet, la copia guardada
  if (req.mode === 'navigate' || (url.origin === location.origin && url.pathname.endsWith('firebase-config.js'))) {
    const key = req.mode === 'navigate' ? './index.html' : './firebase-config.js';
    e.respondWith(fetch(req).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(key, cp)); } return r; })
      .catch(() => caches.match(key)));
    return;
  }
  // Íconos, librerías de Firebase y tipografías: copia guardada, se actualiza en segundo plano
  const own = url.origin === location.origin;
  const lib = url.host === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/');
  const font = url.host.endsWith('fonts.googleapis.com') || url.host.endsWith('fonts.gstatic.com');
  if (own || lib || font) {
    e.respondWith(caches.match(req).then(hit => {
      const net = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); } return r; }).catch(() => hit);
      return hit || net;
    }));
  }
  // Todo lo demás (Firebase Auth y Firestore) va directo a internet.
});
