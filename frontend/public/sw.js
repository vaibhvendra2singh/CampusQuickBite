self.addEventListener('push', function (event) {
    if (event.data) {
        const payload = event.data.json();
        
        const options = {
            body: payload.body || "You have a new notification",
            icon: payload.icon || '/icon-192x192.png',
            badge: payload.badge || '/icon-192x192.png',
            vibrate: [100, 50, 100],
            data: payload.data || { url: '/' },
            tag: payload.tag || 'default'
        };

        const title = payload.title || "Campus Bites Notification";

        event.waitUntil(
            self.registration.showNotification(title, options)
        );
    }
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    
    // This looks to see if the current is already open and focuses if it is
    event.waitUntil(
        clients.matchAll({ type: "window" }).then(function(clientList) {
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                if (client.url == event.notification.data.url && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url);
            }
        })
    );
});
