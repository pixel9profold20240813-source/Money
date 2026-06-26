/* =====================================================================
   service-worker.js — 離線快取
   ---------------------------------------------------------------------
   策略：App Shell（HTML/CSS/JS/圖示）採用「快取優先，背景更新」：
   - 永遠先回應快取，讓 App 能立即離線開啟、秒開不等待
     （這對「裝在主畫面當 App 用、預期離線使用」的情境最合適）。
   - 同時在背景重新對網路抓取最新版本存入快取，下次開啟才會是新版本。
   - 換版本後，會主動通知所有開著的分頁「背景已更新」，
     由前端決定何時重新整理（見 index.html 內的訊息監聽邏輯），
     避免新舊版本混用造成的顯示異常。
   - Firebase/Google 相關網域的請求完全不快取、不攔截，
     一律直接放行給網路本身處理（這些有自己的離線機制）。
===================================================================== */

const CACHE_NAME = 'doodle-ledger-v5';

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
  './js/install-app.js',
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
    ).then(() => self.clients.claim())
     .then(() => {
       // 通知所有已開啟的頁面：背後換了新版本
       return self.clients.matchAll({ type: 'window' }).then((clients) => {
         clients.forEach((client) => client.postMessage({ type: 'SW_UPDATED' }));
       });
     })
  );
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

  // 快取優先：離線時秒開不等待，同時背景偷偷向網路要最新版本存入快取
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

      return cached || networkFetch;
    })
  );
});

/** 讓前端可以主動詢問「現在是不是有新版本待生效」，
 *  用於 App 冷啟動時的版本檢查（見 index.html） */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_VERSION') {
    event.source.postMessage({ type: 'VERSION_INFO', version: CACHE_NAME });
  }
});
