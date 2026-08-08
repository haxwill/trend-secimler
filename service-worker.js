const CACHE_NAME = 'trend-secimler-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json',
    '/posts.json'
];

// 1. Kurulum (Install) - Dosyaları Önbelleğe (Cache) Al
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('📦 PWA: Çevrimdışı dosyalar önbelleğe alınıyor...');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting(); // Beklemeden aktif et
});

// 2. Aktifleştirme (Activate) - Eski Önbellekleri Temizle
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('🧹 PWA: Eski önbellek temizleniyor:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// 3. İstek Yakalama (Fetch) - Önce Ağa, Sonra Önbelleğe Bak (Network First Strategy for dynamic data)
self.addEventListener('fetch', (event) => {
    // posts.json gibi sık güncellenen veriler için Network First (Önce İnternet)
    if (event.request.url.includes('posts.json')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Veriyi aldık, önbelleği de güncelleyelim
                    const clonedResponse = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, clonedResponse);
                    });
                    return response;
                })
                .catch(() => {
                    // İnternet yoksa (Offline), eski posts.json'ı göster
                    return caches.match(event.request);
                })
        );
    } 
    // Diğer statik dosyalar için Cache First (Önce Önbellek)
    else {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                return fetch(event.request);
            })
        );
    }
});
