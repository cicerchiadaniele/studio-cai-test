# Come collegare la pagina a Make e a Dropbox

> **Già impostati in `config.json`:**
> webhook `https://hook.eu1.make.com/unm5jti1d5bwhllmis9cegx4oqja9tjy`
> cartella `/STUDIO CAI/01. Daniele/PROMESSI SPOSI`
>
> Il percorso della cartella si scrive alla maniera di Dropbox: senza
> `Dropbox\` iniziale, con gli slash normali, e con maiuscole, spazi e punti
> identici a quelli veri.

## Quale modulo Dropbox serve

Il modulo **Download a file non serve mai**: i file vanno solo in una
direzione, da chi registra verso la cartella.

| Se usi… | Modulo Dropbox |
|---|---|
| Scenario A (consigliato, qualsiasi dimensione) | **Dropbox › Make an API Call** — Make chiede solo l'indirizzo di caricamento, il file non passa da lui |
| Scenario B (semplice, solo file piccoli) | **Dropbox › Upload a file** — il file passa dentro Make |
| Ramo di sicurezza dello Scenario A | **Dropbox › Upload a file** (lo stesso dello Scenario B) |

Quindi: se monti solo lo Scenario A ti basta *Make an API Call*. Se vuoi anche
la rete di sicurezza, aggiungi *Upload a file* sul ramo `azione = file`.
In entrambi i casi la connessione Dropbox deve avere il permesso di scrittura
(`files.content.write`).

Ci sono due modi. **Scenario A** è quello consigliato: i file vanno da chi
registra direttamente a Dropbox, quindi non c'è limite di dimensione e Make
resta leggero. **Scenario B** è più veloce da montare ma va bene solo per file
piccoli (Make ha un limite sul peso di ciò che gli spedisci dentro la richiesta).

In entrambi i casi, la pagina manda sempre un campo `azione` che vale
`link`, `file` oppure `fine`.

---

## Scenario A — consigliato (qualsiasi dimensione)

Idea: Make non riceve il file. Make chiede a Dropbox un indirizzo di
caricamento temporaneo e lo passa alla pagina; il browser di chi registra
carica il file direttamente su Dropbox.

### 1. Webhook

Modulo **Webhooks › Custom webhook**. L'indirizzo è già quello scritto in
`config.json`; se ne crei uno nuovo, ricordati di sostituirlo lì.

> Dopo aver montato tutto lo scenario, apri la pagina una volta e prova un
> invio: serve a far imparare a Make la struttura dei dati. Se qualche campo
> non compare, usa **Redetermine data structure** e ripeti la prova.

### 2. Router

Subito dopo il webhook metti un **Router** con quattro rami.

### Ramo 0 — parola chiave sbagliata (mettilo per primo)

Filtro: `parola_chiave` **not equal to** `azzeccagarbugli`

Modulo **Webhooks › Webhook response**
- Status: `200`
- Body: `{"ok": false, "errore": "parola chiave errata"}`
- Custom headers:
  - `Content-Type` → `application/json`
  - `Access-Control-Allow-Origin` → `*`

La pagina normalizza sempre la parola prima di spedirla (minuscolo, niente
spazi né accenti), quindi il confronto con `azzeccagarbugli` è esatto
anche se chi scrive mette maiuscole o spazi.

Questo è il controllo che conta davvero: quello che fa la pagina nel browser
è solo una cortesia verso chi digita, si può aggirare.

### Ramo 1 — `azione = link`

Filtro: `azione` **equal to** `link` **AND** `parola_chiave` equal to `azzeccagarbugli`

**Modulo 1 — Dropbox › Make an API Call**
- URL: `/2/files/get_temporary_upload_link`
- Method: `POST`
- Headers: `Content-Type` → `application/json`
- Body:

```json
{
  "commit_info": {
    "path": "{{1.cartella}}/{{1.file_nome}}",
    "mode": "add",
    "autorename": true,
    "mute": false
  },
  "duration": 3600
}
```

**Modulo 2 — Webhooks › Webhook response**
- Status: `200`
- Body: `{"upload_url": "{{2.body.link}}"}`
- Custom headers:
  - `Content-Type` → `application/json`
  - `Access-Control-Allow-Origin` → `*`

> Se `body.link` non compare fra i campi mappabili, guarda l'output del modulo
> Dropbox dopo una prova e mappa il campo che contiene l'indirizzo che comincia
> con `https://content.dropboxapi.com/apitul/...`.

### Ramo 2 — `azione = fine`

Filtro: `azione` **equal to** `fine`

**Modulo email** (Gmail, Brevo, o il modulo Email di Make)
- A: `{{1.email}}`
- Oggetto: `Registrazioni ricevute — I Promessi Sposi`
- Corpo, per esempio:

```
Ciao {{1.lettore}},

abbiamo ricevuto {{1.totale_file}} file per: {{1.capitolo}}.
Sono già nella cartella dell'audiolibro.

Note che hai lasciato: {{1.note}}

Grazie, e a presto per il prossimo capitolo.
```

Poi un **Webhook response** con `{"ok": true}` e gli stessi due header.

### Ramo 3 — `azione = file` (rete di sicurezza)

Serve solo se il caricamento diretto non riesce: la pagina ripiega
automaticamente su questo. Vedi lo Scenario B qui sotto: i moduli sono gli
stessi.

---

## Scenario B — semplice (solo per file piccoli)

In `config.json` metti `"modalita": "webhook"`.

La pagina spedisce il file dentro la richiesta, in `multipart/form-data`.

1. **Webhooks › Custom webhook**
2. **Dropbox › Upload a file**
   - Folder: la cartella dell'audiolibro
   - File name: `{{1.file_nome}}`
   - Data: il campo `file` che arriva dal webhook (nell'elenco dei campi
     mappabili compare come file caricato; scegli il suo contenuto/`data`)
3. **Email** verso `{{1.email}}`
4. **Webhooks › Webhook response** → Body `{"ok": true}`, con gli header
   `Content-Type: application/json` e `Access-Control-Allow-Origin: *`

Aggiungi anche qui, sul primo modulo, un filtro sulla parola chiave.

**Attenzione:** Make ha un tetto al peso di una singola richiesta in ingresso
(nell'ordine di pochi MB). Un capitolo in mp3 di solito ci sta; un wav no.
Per questo lo Scenario A è quello giusto se vuoi accettare tutto.

---

## Campi che la pagina spedisce

| Campo | Quando | Contenuto |
|---|---|---|
| `azione` | sempre | `link`, `file`, `fine` |
| `consegna_id` | sempre | codice della singola consegna |
| `parola_chiave` | sempre | **già normalizzata**: minuscolo, senza spazi né accenti. È questa che va confrontata nel filtro |
| `parola_chiave_digitata` | sempre | com'è stata scritta davvero, utile solo per capire gli errori |
| `email` | sempre | indirizzo per la conferma |
| `lettore` | sempre | nome, se compilato |
| `capitolo` | sempre | es. `Capitolo VIII` |
| `note` | sempre | testo libero |
| `cartella` | sempre | percorso Dropbox preso da `config.json` |
| `file_nome` | link, file | nome già pulito e datato |
| `file_nome_originale` | link, file | com'era sul dispositivo |
| `file_tipo` | link, file | es. `audio/mpeg` |
| `file_dimensione` | link, file | byte di questo pezzo |
| `dimensione_totale` | link, file | byte del file intero |
| `parte` / `parti_totali` | link, file | `1` / `1` se non è spezzato |
| `file` | file | il file vero e proprio (multipart) |
| `totale_file`, `totale_byte`, `file` | fine | riepilogo della consegna |

---

## File molto grandi

Nello Scenario A, i file oltre `max_parte_mb` (140 MB di serie) vengono
spezzati in più pezzi, salvati come `nomefile.mp3.parte01di03`,
`...parte02di03` e così via, ciascuno con la sua richiesta di link.

Per ricomporli:
- **Windows**, dal Prompt dei comandi: `copy /b file.mp3.parte01di03+file.mp3.parte02di03 file.mp3`
- **Mac o Linux**: `cat file.mp3.parte*di* > file.mp3`

Se preferisci non avere mai file spezzati, chiedi a chi registra di
esportare in mp3 o m4a invece che in wav: un capitolo scende sotto i 50 MB.

---

## Se qualcosa non va

**La pagina dice «la pagina non è ancora collegata»** → in `config.json` c'è
ancora il segnaposto al posto dell'indirizzo del webhook.

**Errore di rete / CORS nella console del browser** → manca il modulo
*Webhook response* con l'header `Access-Control-Allow-Origin: *`, oppure lo
scenario non è attivo.

**Il file arriva ma con nome sbagliato** → controlla di aver mappato
`{{1.file_nome}}` e non il nome originale.

**Qualcuno non ricorda la parola chiave** → la pagina non dà suggerimenti e
non offre un recupero: deve scrivere a te. Gliela dai tu a voce o per
messaggio.

**Arrivano file da estranei** → la parola chiave si legge nel codice della
pagina solo in forma cifrata, ma resta una parola condivisa: se gira troppo,
cambiala. Va cambiata in due punti: nel filtro di Make e nel file `app.js`
(costante `IMPRONTA_PAROLA`, che è l'impronta SHA-256 della parola in
minuscolo e senza spazi).
