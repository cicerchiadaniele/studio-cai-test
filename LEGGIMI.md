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

1. **Monta lo scenario Make** seguendo `ISTRUZIONI-MAKE.md` e copia
   l'indirizzo del webhook.
2. **Apri `config.json`** e incolla l'indirizzo in `webhook_url`. Sistema
   anche `cartella_dropbox` con il percorso esatto della cartella
   (es. `/Audiolibro Promessi Sposi/Registrazioni`).
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
