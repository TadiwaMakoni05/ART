self.addEventListener("push", function (event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body,
        icon: data.icon || "/icon-192.png",
        badge: data.badge || "/icon-192.png",
        vibrate: [200, 100, 200],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: 1,
          url: "/", // Ensure this matches front-end entry URL
        },
      };
      event.waitUntil(self.registration.showNotification(data.title, options));
    } catch (e) {
      console.error("Error parsing push data", e, event.data.text());
    }
  }
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then(function (clientList) {
      const destUrl = event.notification.data.url;
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(destUrl) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(destUrl);
      }
    }),
  );
});
