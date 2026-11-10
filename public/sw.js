importScripts('https://www.gstatic.com/firebasejs/12.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.9.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyA32xY58swvW3P86Kp1hPujdmZojPCU67k',
  authDomain: 'domiz-a6a6c.firebaseapp.com',
  projectId: 'domiz-a6a6c',
  storageBucket: 'domiz-a6a6c.firebasestorage.app',
  messagingSenderId: '636428718547',
  appId: '1:636428718547:web:a0dfd6f16b30aecd805f26'
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  self.registration.showNotification(data.title || 'Domiz Homes CRM', {
    body: data.body || 'Masz nowe działanie w procesie pozyskania.',
    icon: '/pwa/icon-192.png',
    badge: '/pwa/icon-192.png',
    tag: data.notificationId || `domiz-${Date.now()}`,
    data: { url: data.url || '/admin', leadId: data.leadId || '' }
  });
});

const CACHE_NAME = 'domiz-crm-v6';
const APP_SHELL = [
  '/manifest.webmanifest',
  '/offline.html',
  '/pwa/icon-192.png',
  '/pwa/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match('/admin')) || caches.match('/offline.html'))
    );
    return;
  }

  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/pwa/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/admin';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const adminWindow = windows.find((client) => new URL(client.url).pathname.startsWith('/admin'));
      if (adminWindow) {
        if ('navigate' in adminWindow) adminWindow.navigate(targetUrl);
        return adminWindow.focus();
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
