// StatuPub — service worker : l'app s'ouvre vite et affiche une page propre hors connexion.
// Les données (Supabase, paiements, clics) ne sont JAMAIS mises en cache : elles viennent toujours du serveur.
const VERSION = "statupub-v1";
const SHELL = ["/", "/index.html", "/offline.html", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png", "/logo/statupub-icone-transparent.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;           // API, paiements : réseau uniquement
  if (req.mode === "navigate") {                                                 // pages : réseau d'abord, secours hors ligne
    e.respondWith(fetch(req).catch(() => caches.match(req).then((r) => r || caches.match("/offline.html"))));
    return;
  }
  e.respondWith(                                                                 // fichiers statiques : cache puis mise à jour
    caches.match(req).then((cached) => {
      const net = fetch(req).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); } return res; }).catch(() => cached);
      return cached || net;
    })
  );
});
