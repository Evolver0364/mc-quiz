/*
 * 站点级离线缓存：首页 + 两个练习器。
 * 页面走「先网络、失败回缓存」——更新题库后重新打开就是新的；
 * 图标等静态文件走「先缓存、没有再去网络」。
 */
const CACHE = 'mcq-site-v6';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './mc/',
  './mc/index.html',
  './jd/',
  './jd/index.html',
  './xz/',
  './xz/index.html',
  './zt/',
  './zt/index.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => Promise.all(ASSETS.map((u) => cache.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          const key = new URL(req.url).pathname.endsWith('/')
            ? new URL(req.url).pathname + 'index.html'
            : new URL(req.url).pathname;
          caches.open(CACHE).then((cache) => cache.put(key, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(new URL(req.url).pathname).then((hit) => hit || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy)).catch(() => {});
        return res;
      });
    })
  );
});
