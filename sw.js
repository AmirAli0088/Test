// نام کش (cache) شما. هر بار که تغییراتی در فایل‌ها می‌دهید، این نسخه را تغییر دهید (مثلاً v1 به v2) تا کش قبلی حذف شود.
const CACHE_NAME = 'ghadir-countdown-cache-v2';
// لیستی از تمام فایل‌هایی که می‌خواهید کش شوند
const urlsToCache = [
  '/', // صفحه اصلی (برای دسترسی آفلاین)
  '/index.html',
  '/style.css',
  '/icon.png', // آیکون برای PWA و اعلان‌ها (مطمئن شوید این فایل وجود دارد)
  '/manifest.json', // فایل مانیفست برای PWA
  '/audio/azan_sound.mp3', // مسیر فایل‌های صوتی (مطمئن شوید این فایل‌ها وجود دارند)
  '/audio/azan_sound.ogg',
  '/audio/final_jingle.mp3',
  '/audio/final_jingle.ogg'
];

// هنگام نصب Service Worker، فایل‌ها را کش کنید
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Service Worker: Failed to cache during install:', error);
      })
  );
  self.skipWaiting(); // فوراً Service Worker جدید را فعال کنید
});

// هنگام دریافت درخواست، ابتدا از کش پاسخ دهید، در غیر این صورت از شبکه بیاورید (Cache First, then Network)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // اگر پاسخ در کش بود، آن را برگردانید
        if (response) {
          return response;
        }
        // اگر در کش نبود، درخواست را از شبکه انجام دهید
        return fetch(event.request)
          .then(networkResponse => {
            // پاسخ شبکه را کش کنید
            return caches.open(CACHE_NAME).then(cache => {
              // فقط درخواست‌های GET را کش کنید و اطمینان حاصل کنید که پاسخ معتبر است
              if (event.request.method === 'GET' && networkResponse.ok) {
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            });
          })
          .catch(error => {
            console.error('Service Worker: Fetch failed for:', event.request.url, error);
            // در صورت عدم دسترسی به شبکه و عدم وجود در کش، می‌توانید یک صفحه آفلاین برگردانید
            // مثلاً: return caches.match('/offline.html'); اگر یک صفحه آفلاین دارید
          });
      })
  );
});

// هنگام فعال شدن Service Worker، کش‌های قدیمی را حذف کنید
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // کش‌هایی که در لیست سفید نیستند را حذف کنید (کش‌های نسخه‌های قدیمی)
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // کنترل صفحات موجود را بلافاصله در دست بگیرید
});

// مدیریت اعلان‌های فشاری (Push Notifications) - اگر از سرور برای ارسال Push استفاده کنید
self.addEventListener('push', event => {
  console.log('Service Worker: Push received!');
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'اعلان تایمر';
  const options = {
    body: data.body || 'رویداد تایمر به پایان رسید!',
    icon: data.icon || '/icon.png', // آیکون برای اعلان
    badge: data.badge || '/icon.png', // آیکون کوچک‌تر در نوار وضعیت اندروید
    vibrate: data.vibrate || [200, 100, 200],
    tag: data.tag || 'timer-notification' // برای گروه‌بندی یا جایگزینی اعلان‌ها
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// مدیریت کلیک روی اعلان‌ها
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification clicked!');
  event.notification.close(); // اعلان را ببندید

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // اگر صفحه‌ای از برنامه باز است، به آن فوکوس کنید
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // در غیر این صورت، یک پنجره جدید باز کنید
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});