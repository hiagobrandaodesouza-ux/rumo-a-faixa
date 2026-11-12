const VERSION = "rumoazul-5b52872ea7";
const PRECACHE = ["./", "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-192.png", "icons/maskable-512.png", "index.html", "manifest.webmanifest", "midia/americana.jpg", "midia/americana.mp4", "midia/armbar_guarda.jpg", "midia/armbar_guarda.mp4", "midia/armbar_montada.jpg", "midia/armbar_montada.mp4", "midia/estr_guarda.jpg", "midia/estr_guarda.mp4", "midia/estr_montada.jpg", "midia/estr_montada.mp4", "midia/kimura_guarda.jpg", "midia/kimura_guarda.mp4", "midia/mataleao.jpg", "midia/mataleao.mp4", "midia/omoplata.jpg", "midia/omoplata.mp4", "midia/pos_borboleta.jpg", "midia/pos_cem.jpg", "midia/pos_costas.jpg", "midia/pos_guarda.jpg", "midia/pos_joelho.jpg", "midia/pos_meia.jpg", "midia/pos_montada.jpg", "midia/pos_queda.jpg", "midia/tesoura.jpg", "midia/tesoura.mp4", "midia/triangulo.jpg", "midia/triangulo.mp4"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== "rumoazul-fonts").map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// vídeos: o Safari pede pedaços (Range), então montamos a resposta 206 a partir do cache
async function rangeResponse(req, res) {
  const buf = await res.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get("range") || "");
  const size = buf.byteLength;
  let start = m && m[1] ? parseInt(m[1], 10) : 0;
  let end = m && m[2] ? parseInt(m[2], 10) : size - 1;
  if (!m || !m[1]) { if (m && m[2]) { start = size - parseInt(m[2], 10); end = size - 1; } }
  end = Math.min(end, size - 1);
  return new Response(buf.slice(start, end + 1), { status: 206, statusText: "Partial Content", headers: {
    "Content-Type": res.headers.get("Content-Type") || "video/mp4",
    "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1), "Accept-Ranges": "bytes" } });
}
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.hostname.endsWith("fonts.googleapis.com") || url.hostname.endsWith("fonts.gstatic.com")) {
    e.respondWith(caches.open("rumoazul-fonts").then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      try { const r = await fetch(req); c.put(req, r.clone()); return r; } catch (err) { return Response.error(); }
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const hit = await cache.match(req, { ignoreSearch: true }) || (req.mode === "navigate" ? await cache.match("./") : null);
    if (hit) return req.headers.has("range") ? rangeResponse(req, hit) : hit;
    try { return await fetch(req); } catch (err) { return Response.error(); }
  })());
});
