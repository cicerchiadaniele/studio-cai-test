# Registro Presenze Portieri — v1.9.0

Riordino della schermata, logica per tipologia, accessibilità e installazione
sulla home (PWA). Comprende tutto quanto introdotto nella v1.8.0.
`index.html` è copiato identico dalla v1.8.0.

## File

| File | Stato |
|---|---|
| `index.html` | copiato identico (logo CAI inline preservato) |
| `styles.css` | aggiornato |
| `app.js` | aggiornato |
| `config.json` | invariato |
| `employees.json` | invariato — **solo codici, nessun nome** |
| `manifest.webmanifest` | nuovo |
| `sw.js` | nuovo |
| `icon.svg`, `icon-maskable.svg` | nuovi |

## Schermata

- **Tipologia subito dopo il codice.** È la scelta che determina quali campi
  servono: adesso viene prima della data, e sotto compaiono solo i campi
  pertinenti.
- **Riepilogo sopra il pulsante.** "Stai per inviare: Cod. 047 · Ferie · dal
  14/09/2026 al 18/09/2026 · 5 giorni (3 lavorativi, sabato e domenica
  esclusi)". Si aggiorna mentre si compila.
- **Ferie**: il campo Data sparisce, il periodo lo sostituisce, e
  `event_date` viene derivata da `ferie_start`. Niente più ambiguità su cosa
  rappresenti la data singola quando c'è un periodo.
- **Malattia**: casella "Certificato non ancora disponibile". Spuntata,
  il numero non è più obbligatorio e parte `medical_cert_pending: true`,
  così si può avvisare la mattina senza inventare un numero.
- Emoji rimossa dal badge di versione in testata.
- Segnaposto delle note riscritto con un esempio reale.

## Accessibilità

- `#type-buttons` ha `role="radiogroup"`, `aria-labelledby` sull'etichetta
  Tipologia e `aria-describedby` sul messaggio d'errore.
- L'interruttore Intera giornata espone `role="switch"` e `aria-checked`
  aggiornato a ogni cambio.
- Il campo ore è collegato al proprio suggerimento via `aria-describedby`.
- Il riepilogo è `aria-live="polite"`: viene letto quando cambia.

## PWA

`manifest.webmanifest` e `sw.js` rendono l'app installabile sulla home e
utilizzabile senza rete: il service worker tiene in cache il guscio
(`index.html`, CSS, JS, icone) e i font, mentre `config.json` ed
`employees.json` restano network-first, con ripiego sulla copia locale.
Gli invii al webhook sono POST e non passano mai dalla cache.

Due note pratiche:

1. Manifest e `theme-color` vengono iniettati da `app.js`, perché
   `index.html` non si tocca. Funziona, ma se Chrome non propone
   l'installazione conviene aggiungere a mano nel `<head>`:
   `<link rel="manifest" href="./manifest.webmanifest">`.
2. Le icone sono SVG. Chrome le accetta; se l'invito all'installazione non
   comparisse, servono due PNG da 192 e 512 px — sono binari e non posso
   generarli da qui.

Alla prossima release ricordarsi di alzare `VERSION` in `sw.js`, altrimenti
i dispositivi continuano a servire il guscio in cache.

## Resta da fare

- Deduplica su `request_id` nello scenario Make (senza, l'idempotenza della
  v1.8.0 non produce l'effetto voluto).
- Annullo dell'ultimo invio: richiede che lo scenario sappia interpretare un
  evento di rettifica.
- Spostare il logo da base64 inline a file esterno: renderebbe `index.html`
  modificabile e permetterebbe di scrivere il markup invece di correggerlo
  da JavaScript.
