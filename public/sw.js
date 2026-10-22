/* toAki PWA: only network forwarding, intentionally no persistent data or offline cache.
   Firebase Authentication and Firestore are NEVER written to Cache Storage. */
self.addEventListener("install",event=>{event.waitUntil(self.skipWaiting());});
self.addEventListener("activate",event=>{event.waitUntil(self.clients.claim());});
self.addEventListener("fetch",event=>{
  const req=event.request;
  if(req.method!=="GET" || !req.url.startsWith(self.location.origin+"/"))return;
  // Do not cache HTML, API responses, personally identifiable information or JS.
  event.respondWith(fetch(req));
});
