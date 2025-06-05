// sw.js
self.addEventListener('install', (event) => {
    console.log('Service Worker: نصب شد.');
    event.waitUntil(
        caches.open('ghadir-countdown-cache-v1').then((cache) => {
            return cache.addAll([
                '/',
                'index.html',
                'icon.png' // مطمئن شوید این فایل در ریشه پروژه شما وجود دارد
                // می توانید فایل های CSS و JS و فونت ها را هم اینجا اضافه کنید
            ]);
        })
    );
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker: فعال شد.');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== 'ghadir-countdown-cache-v1') {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});

self.addEventListener('push', (event) => {
    const data = event.data.json();
    const title = data.title || 'اعلان';
    const options = {
        body: data.body || 'شما یک اعلان جدید دارید.',
        icon: data.icon || 'icon.png', // باید آیکون مناسب برای اعلان باشد
        tag: data.tag // برای گروه بندی اعلان ها
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('/') // باز کردن صفحه اصلی اپلیکیشن پس از کلیک بر روی اعلان
    );
});