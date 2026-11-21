const CACHE_NAME = "sigweb-gps-v2";

// 1. Instalação: força o Service Worker novo a assumir sem esperar abas antigas
self.addEventListener("install", (event) => {
    self.skipWaiting();
});

// 2. Ativação: limpa versões velhas de cache que possam ter ficado gravadas
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((k) => caches.delete(k))
            );
        }).then(() => self.clients.claim())
    );
});

// 3. Interceptação de Rede (Network-First)
self.addEventListener("fetch", (event) => {
    // Não intercepta requisições que não sejam HTTP/HTTPS normais
    if (!event.request.url.startsWith("http")) return;

    // Não cacheia chamadas externas ao OpenStreetMap (deixe o mapa lidar com seu próprio tráfego)
    if (event.request.url.includes("openstreetmap.org")) return;

    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});