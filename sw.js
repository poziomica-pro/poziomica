// Poziomica - praca bez internetu.
// Pierwsze otwarcie (z internetem) zapisuje aplikacje w pamieci telefonu. Kolejne uruchomienia
// biora ja z pamieci (dziala bez internetu), a gdy internet jest, w tle pobieraja nowsza wersje
// - zobaczysz ja przy nastepnym uruchomieniu.
const CACHE = 'poziomica-05.1';          // przy nowej wersji aplikacji zmienic (= APP_VERSION)
const FILES = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('poziomica-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const key = req.mode === 'navigate' ? './index.html' : req;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(key, { ignoreSearch: true });
    const net = fetch(req).then(r => { if (r && r.ok) c.put(key, r.clone()); return r; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    return (await net) || new Response('Brak internetu i brak zapisanej aplikacji - otworz raz z internetem.',
      { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }));
});
