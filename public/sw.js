// Service Worker for Smash Club Web Push Notifications
self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', event => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Smash Club', body: event.data.text() };
    }
  }

  const title = data.title || '🏸 Smash Club';
  const options = {
    body: data.body || 'You have a new update from Smash Club',
    icon: data.icon || '/assets/badminton-app-icon.png',
    badge: '/assets/badminton-app-icon.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: data.tag || 'smash-club-alert',
    renotify: true,
    data: {
      url: data.url || '/'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

