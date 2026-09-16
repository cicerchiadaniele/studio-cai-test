# Studio CAI – Registro Chiavi (v1.0.0)

Webapp per registrare uscita e rientro dei mazzi di chiavi dei condomini.

## Pubblicazione su Vercel
1. Importa la cartella come nuovo progetto (framework: Vite, build `npm run build`, output `dist`).
2. Apri `https://<dominio>/cartello`, stampa il cartello con il QR e affiggilo vicino alle chiavi.

## Collegamenti
- Webhook Make: `src/config.js` → scenario "Studio CAI – WebApp Registro Chiavi" (ID 7434486)
- Airtable: base "Registro Chiavi" (appit0KcdaUdu5WE6), tabelle Chiavi e Nominativi
- Sync condomini da Dropbox `/STUDIO CAI/scritti_cai`: scenario 7434508, il 1° del mese alle 6:00
- Riepilogo email a studiocai.gestioneimmobili+chiavi@gmail.com: scenario 7434525, venerdì 8:30

## Note
- Nominativi frequenti: si gestiscono dalla tabella Nominativi (campo "Attivo").
- Esclusi dalla sync: cartelle che iniziano con "-" o "z" minuscola e "Nuova cartella".
- Limite attuale: 100 condomini letti per chiamata.
- Il check verde compare solo se Airtable restituisce lo stato aggiornato.
- package-lock.json non è incluso in questa copia Dropbox: Vercel lo rigenera da package.json durante la build.
