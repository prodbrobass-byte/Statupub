// StatuPub — service worker : l'app s'ouvre vite et affiche une page propre hors connexion.
// Les données (Supabase, paiements, clics) ne sont JAMAIS mises en cache : elles viennent toujours du serveur.
const VERSION = "statupub-v2";
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

// ---------- Notifications push (reçues même quand l'app est fermée) ----------
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  const title = d.title || "StatuPub";
  e.waitUntil(self.registration.showNotification(title, {
    body: d.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/favicon-32.png",
    tag: d.tag || undefined,
    renotify: !!d.tag,
    vibrate: [120, 60, 120],
    data: { url: d.url || "/" },
  }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const target = new URL(e.notification.data?.url || "/", self.location.origin).href;
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const w of wins) {
      if (new URL(w.url).origin === self.location.origin) { await w.focus(); try { await w.navigate(target); } catch { w.postMessage({ type: "sp-open", url: target }); } return; }
    }
    await self.clients.openWindow(target);
  })());
});
