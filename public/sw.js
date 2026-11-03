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
      data = { title: '🏸 Smash Club', body: event.data.text() };
    }
  }

  const title = data.title || '🏸 Smash Club Alert';
  const origin = self.location.origin || 'https://smash-club-two.vercel.app';
  const iconUrl = `${origin}/assets/badminton-app-icon.png`;

  const options = {
    body: data.body || 'You have an update from Smash Club',
    icon: iconUrl,
    badge: iconUrl,
    vibrate: [300, 100, 300, 100, 300],
    tag: data.tag || 'smash-club-' + Date.now(),
    renotify: true,
    requireInteraction: true,
    silent: false,
    data: {
      url: data.url ? (data.url.startsWith('http') ? data.url : `${origin}${data.url}`) : origin
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options).catch(err => {
      console.error('[SW showNotification error]', err);
      return self.registration.showNotification(title, {
        body: options.body,
        tag: options.tag
      });
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = event.notification.data && event.notification.data.url
    ? event.notification.data.url
    : self.location.origin;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (let client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client && targetUrl) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
