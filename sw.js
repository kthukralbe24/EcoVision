/**
 * EcoVision - Service Worker
 * Caches core application shell assets for offline availability & ultra-fast performance.
 */

const CACHE_NAME = 'ecovision-v3-cache';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './buy.html',
    './sell.html',
    './test-runner.html',
    './styles/main.css',
    './styles/index.css',
    './styles/buy.css',
    './styles/sell.css',
    './js/security.js',
    './js/campus.js',
    './js/state.js',
    './js/app.js',
    './js/buy.js',
    './js/sell.js',
    './images/plas.png',
    './images/pppp.jpg',
    './images/pet.jpg',
    './images/hdpe2.png',
    './images/grade2.png',
    './images/ldpe.png',
    './images/pp.png',
    './images/pvc.png',
    './images/ps.png',
    './images/recycle.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    // Navigation should prefer the requested page. The old fallback returned
    // index.html for every offline navigation, making Buy and Sell appear broken.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).then((response) => {
                if (response.ok) {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
                }
                return response;
            }).catch(async () => {
                const cachedPage = await caches.match(event.request);
                if (cachedPage) return cachedPage;
                const url = new URL(event.request.url);
                if (url.pathname.endsWith('/') || url.pathname.endsWith('/index.html')) {
                    return caches.match('./index.html');
                }
                return new Response('This page is not available offline. Reconnect and try again.', {
                    status: 503,
                    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
                });
            })
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).then((networkResponse) => {
                return networkResponse;
            }).catch(() => {
                // If offline and request is an HTML navigation, return index
                if (event.request.headers.get('accept')?.includes('text/html')) {
                    return caches.match('./index.html');
                }
            });
        })
    );
});

