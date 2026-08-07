# Consegna le registrazioni — I Promessi Sposi

Pagina web per raccogliere le registrazioni audio dell'audiolibro e farle
arrivare nella cartella Dropbox condivisa, passando per uno scenario Make.

## Che cosa contiene

| File | A cosa serve |
|---|---|
| `index.html` | la pagina |
| `styles.css` | l'aspetto |
| `app.js` | i controlli e l'invio |
| `config.json` | **l'unico file da modificare** |
| `ISTRUZIONI-MAKE.md` | come montare lo scenario |

## In tre passi

1. **Monta lo scenario Make** seguendo `ISTRUZIONI-MAKE.md`. Il webhook è già
   impostato: `https://hook.eu1.make.com/unm5jti1d5bwhllmis9cegx4oqja9tjy`.
2. **`config.json` è già pronto**: webhook e cartella di destinazione
   (`/STUDIO CAI/01. Daniele/PROMESSI SPOSI`) sono impostati. Toccalo solo se
   sposti o rinomini la cartella.
3. **Pubblica la cartella.** Il modo più rapido è
   [Netlify Drop](https://app.netlify.com/drop): trascini la cartella nella
   pagina e ottieni subito un indirizzo `https://…` da mandare a tutti.
   Vanno bene anche GitHub Pages, Cloudflare Pages o qualsiasi hosting.
   Serve `https`, non `http`.

## La parola chiave

È `quelramodellagodicomo`, uguale per tutti. La pagina la controlla subito,
ma il controllo che vale è quello dentro Make: tienilo attivo.
Chi digita può sbagliare maiuscole, spazi o accenti — la pagina normalizza
tutto prima di confrontare.

La pagina **non dà suggerimenti e non offre un recupero**: chi non la ricorda
legge «chiedila a chi organizza le letture» e deve scrivere a te.

## Impostazioni di `config.json`

| Voce | Significato |
|---|---|
| `webhook_url` | l'indirizzo del webhook Make |
| `modalita` | `diretto` (nessun limite di peso) o `webhook` (solo file piccoli) |
| `ripiego_webhook` | se `true`, quando il caricamento diretto non riesce prova comunque l'invio semplice |
| `max_parte_mb` | oltre questa soglia il file viene spezzato in più pezzi |
| `cartella_dropbox` | percorso di destinazione, viene passato a Make |
| `riepilogo_finale` | se `true`, a fine consegna manda a Make il riepilogo per l'email |

## Come si comporta

- Accetta qualsiasi formato: mp3, m4a, wav, aac, ogg, note vocali di
  WhatsApp, memo dell'iPhone.
- Più file per volta, trascinandoli o scegliendoli dal telefono.
- Barra di avanzamento per ogni file; se uno non parte, gli altri
  proseguono e si può riprovare solo con quello.
- Email e parola chiave sono obbligatorie; nome, capitolo e note no.
- Il nome del file viene ricostruito così:
  `2026-08-07_Lucia-Mondella_Capitolo-VIII_lettura.m4a`
- Nome ed email restano salvati sul dispositivo, così chi registra spesso
  non li ridigita ogni volta.
- Funziona da telefono, da tablet e da computer.

## Personalizzare

- **Titolo e incipit**: dentro `index.html`, nel blocco `<header>`.
- **Colori**: in cima a `styles.css`, nel blocco `:root`.
- **Elenco dei capitoli**: in `app.js`, funzione `riempiCapitoli()`.
- **Cambiare la parola chiave**: va aggiornata in due punti — il filtro
  di Make e la costante `IMPRONTA_PAROLA` in `app.js`, che contiene
  l'impronta SHA-256 della nuova parola (minuscolo, senza spazi).

v1.0.0
