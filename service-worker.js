/* =====================================================================
   service-worker.js — 離線快取
   ---------------------------------------------------------------------
   策略：
   - App Shell（HTML/CSS/JS/圖示）採用「快取優先，背景更新」：
     先回應快取（讓 App 能立即離線開啟），同時在背景重新抓取最新版本
     存入快取，下次開啟就會是新版本。
   - Firebase/Google 相關網域的請求完全不快取、不攔截，
     一律直接放行給網路本身處理（這些有自己的離線機制）。
===================================================================== */

const CACHE_NAME = 'doodle-ledger-v1';

const APP_SHELL_FILES = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './js/ui-scale.js',
  './js/firebase-init.js',
  './js/auth.js',
  './js/datastore.js',
  './js/utils.js',
  './js/icons.js',
  './js/donut-chart.js',
  './js/state.js',
  './js/router.js',
  './js/render-home.js',
  './js/render-ledger.js',
  './js/render-stats.js',
  './js/render-settings.js',
  './js/modals.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

/** 不應該被 Service Worker 攔截快取的網域（Firebase、Google 登入、字體等外部服務） */
const BYPASS_HOSTS = [
  'firestore.googleapis.com',
  'firebaseapp.com',
  'googleapis.com',
  'gstatic.com',
  'google.com',
  'accounts.google.com',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function shouldBypass(url) {
  return BYPASS_HOSTS.some((host) => url.hostname.includes(host));
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 非 GET 請求、或屬於 Firebase/Google 服務的請求，完全不攔截
  if (event.request.method !== 'GET' || shouldBypass(url)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached); // 離線時網路請求失敗，回退用快取

      // 有快取就先回應快取（快），同時背景偷偷更新；沒快取才等網路
      return cached || networkFetch;
    })
  );
});
