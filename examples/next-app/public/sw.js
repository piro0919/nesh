// Service worker for the Nesh sample app.
// Handles push delivery, click → window focus/open, and subscription rotation.

self.addEventListener("push", (event) => {
  let payload = null;
  try {
    payload = event.data ? event.data.json() : null;
  } catch {
    payload = { title: event.data?.text() ?? "Notification" };
  }
  const title = payload?.title ?? "Notification";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload?.body,
      icon: payload?.icon,
      badge: payload?.badge,
      image: payload?.image,
      tag: payload?.tag,
      data: { url: payload?.url ?? "/", raw: payload?.data },
      actions: payload?.actions,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? "/";
  event.waitUntil(
    (async () => {
      const absolute = new URL(url, self.location.origin).toString();
      const wcs = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const c of wcs) {
        if (c.url === absolute) return c.focus();
      }
      return self.clients.openWindow(url);
    })(),
  );
});
