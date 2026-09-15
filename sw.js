/* Service worker — Registro Presenze Portieri v1.9.2
   ATTENZIONE: questo NON è un service worker di cache.

   Nella 1.9.0 era stato introdotto un service worker che serviva app.js e
   styles.css dalla cache prima della rete. Al deploy successivo un
   dispositivo poteva quindi ritrovarsi con index.html nuovo e JavaScript
   vecchio: una combinazione che si manifesta come "l'app non si carica", e
   che non si sblocca ricaricando la pagina.

   Questo file esiste solo per smontare quel meccanismo. Si installa,
   cancella tutte le cache dell'app, si disinstalla e ricarica le pagine
   aperte. Non intercetta nessuna richiesta: senza handler "fetch" il
   browser va sempre in rete.

   Conseguenza voluta: l'app non funziona più a schermo intero da installata
   né senza rete. La coda offline degli invii NON dipende da qui: usa
   localStorage e continua a funzionare normalmente.

   Non rimettere un service worker di cache senza prima aver capito perché
   la 1.9.1 non si caricava. */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    } catch(e) {}

    try {
      await self.registration.unregister();
    } catch(e) {}

    try {
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach(client => client.navigate(client.url));
    } catch(e) {}
  })());
});
