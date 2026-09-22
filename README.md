# Studio CAI – Aggregatore portali (v1.0.0)

Pagina interna che raccoglie tutti i portali dello studio. L'elenco non è scritto nel codice: viene letto a ogni apertura dalla base Airtable **Portali Studio CAI**, quindi un portale nuovo si aggiunge con una riga su Airtable, senza ripubblicare nulla.

## Aggiungere o modificare un portale
Base **Portali Studio CAI** (appXoSxkXXfeI5LWs), tabella **Portali** (tblybxZh0uICZuTmd) — link anche in fondo alla pagina ("Aggiungi o modifica portali").

| Campo | Uso |
|---|---|
| Nome | titolo della scheda (obbligatorio) |
| URL | indirizzo che si apre (obbligatorio) |
| Descrizione | una riga sotto il titolo |
| Sezione | Studio, Condòmini, Portieri, Progetti, Prove (una sezione nuova creata su Airtable compare in fondo) |
| Icona | un'emoji, facoltativa (senza emoji compare l'iniziale) |
| Ordine | posizione dentro la sezione, dal più basso |
| Attivo | solo le righe spuntate compaiono |
| Repository GitHub, Note | solo promemoria, non mostrati |

La modifica compare entro circa un minuto (cache di Vercel).

## Pubblicazione su Vercel (una volta sola)
1. Nuovo repository GitHub, es. `studio-cai-aggregatore`. **Non usare `studio-cai-portali`**: è il portale servizi pubblico dei condòmini.
2. Vercel → Import del repository (framework: Vite, build `npm run build`, output `dist`).
3. Airtable → Builder hub → Personal access tokens → Create token: nome "Aggregatore portali", scope **data.records:read**, accesso alla sola base **Portali Studio CAI**. Copia il token.
4. Vercel → progetto → Settings → Environment Variables: `AIRTABLE_TOKEN` = token copiato (Production, Preview). Poi Redeploy.

## Come funziona
- `api/portali.js` è una funzione Vercel: legge Airtable lato server con il token, così il token non finisce mai nel browser. Base e tabella sono già impostate (sovrascrivibili con `AIRTABLE_BASE` / `AIRTABLE_TABLE`).
- Nessuno scenario Make: aprire la pagina non consuma operazioni.
- L'ultimo elenco ricevuto resta salvato sul dispositivo: la pagina si apre subito e, se la rete o Airtable non rispondono, mostra la copia precedente con un avviso.
- Pagina esclusa dai motori di ricerca (`noindex`).

## Note
- Con `npm run dev` in locale la funzione /api non gira: l'elenco risulterà non disponibile. Per provarla in locale usare `vercel dev`.
- package-lock.json non è incluso: Vercel lo rigenera da package.json durante la build.
- 22/09/2026: `studio-cai-test.vercel.app` risponde 404, la riga "Test" è caricata con Attivo non spuntato. Correggere l'URL e spuntare Attivo.
