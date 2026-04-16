# App Sinistri — Studio CAI

Webapp interna per la generazione guidata del testo di apertura sinistro.
L'app raccoglie i dati in campi guidati, compone automaticamente il testo formale
nello stile richiesto e lo trasmette a Make tramite webhook.

## Stack

- React 18 + Create React App
- Tailwind CSS 3.4
- framer-motion (animazioni)
- lucide-react (icone)

## Esempi di testo generato

**Esempio 1** — senza indirizzo, con tutti i telefoni:

> A causa della rottura accidentale nel punto di saldatura tra la tubazione e la conversa in piombo del bocchettone ubicato sul terrazzo dell'appartamento interno 8 di proprietà del Sig. Montinaro Paolo tel. 3315917663 si sono verificate delle infiltrazioni che hanno danneggiato il sottostante appartamento interno 7 di proprietà della Sig.ra Silvia Del Guercio tel. 3245954554.

**Esempio 2** — con indirizzo, allagamento (singolare → verbo "ha danneggiato"):

> Presso il condominio sito in Via Marco Polo 84, a causa del guasto accidentale nel punto di valvola di scarico del serbatoio ubicato in cucina dell'appartamento interno 3 di proprietà del Sig. Rossi Mario si è verificato un allagamento che ha danneggiato il sottostante appartamento interno 2 di proprietà della Sig.ra Bianchi Giulia tel. 3331234567.

**Esempio 3** — parti comuni + Sig.ri:

> A causa dell'occlusione accidentale nel punto di pluviale verticale del lato ovest ubicato nelle parti comuni dell'appartamento interno 1A di proprietà dei Sig.ri Verdi tel. 0287654321 si sono verificate delle infiltrazioni ed allagamenti che hanno danneggiato il sottostante appartamento interno 1B di proprietà della Sig.ra Esposito Anna.

La logica interna gestisce automaticamente:
- articolo determinativo della causa: `del`/`della`/`dell'`
- preposizione di luogo: `sul`/`sulla`/`sull'`/`in`/`nel`/`nelle`
- concordanza di genere e numero della conseguenza
- concordanza del verbo successivo: `ha danneggiato` vs `hanno danneggiato`
- articolo del titolo: `del Sig.`/`della Sig.ra`/`dei Sig.ri`

## Avvio locale

```bash
npm install
npm start
```

L'app si apre su `http://localhost:3000`.

## Build di produzione

```bash
npm run build
```

Il bundle finale è nella cartella `build/` e può essere deployato su qualunque
hosting statico (Netlify, Vercel, Cloudflare Pages, ecc.).

## Webhook Make

L'URL del webhook è configurato in `src/App.js` alla costante `WEBHOOK_URL`:

```js
const WEBHOOK_URL = "https://hook.eu1.make.com/8ev6ie7xhf38wwkkrgh01tkebrdxgn78";
```

Per cambiarlo basta modificare questa costante e rifare la build.

## Payload inviato a Make

Alla pressione di "Invia apertura sinistro" viene effettuato un `POST` in
`multipart/form-data` al webhook, con questi campi:

| Campo | Descrizione |
|---|---|
| `condominio` | Indirizzo del condominio |
| `causa` | Causa selezionata dal menu |
| `causaLibera` | Specifica libera (se causa = "altra causa") |
| `causaFinale` | **Valore risolto** (libera se presente, altrimenti menu) |
| `punto` | Punto/componente interessato |
| `ubicazione` | Ubicazione selezionata dal menu |
| `ubicazioneLibera` | Specifica libera (se ubicazione = "altro") |
| `ubicazioneFinale` | **Valore risolto** |
| `conseguenza` | Conseguenza selezionata dal menu |
| `conseguenzaLibera` | Specifica libera (se conseguenza = "altro") |
| `conseguenzaFinale` | **Valore risolto** |
| `internoDanneggiante` | Interno dell'unità da cui parte il danno |
| `titoloDanneggiante` | Sig. / Sig.ra / Sig.ri |
| `nomeDanneggiante` | Nome e cognome proprietario |
| `telefonoDanneggiante` | Telefono (opzionale) |
| `internoDanneggiato` | Interno dell'unità danneggiata |
| `titoloDanneggiato` | Sig. / Sig.ra / Sig.ri |
| `nomeDanneggiato` | Nome e cognome proprietario |
| `telefonoDanneggiato` | Telefono (opzionale) |
| `consenso` | `true` |
| `testoFinale` | **Testo già composto, pronto all'uso** |
| `ticket` | Codice univoco tipo `SIN-20260416-A1B2` |
| `timestamp` | ISO string del momento di invio |
| `appVersion` | `1.0` |
| `tipo` | `apertura_sinistro` |

Su Make basta prendere il campo `testoFinale` per ottenere direttamente il
testo pronto da inserire in email, PDF o altre destinazioni.

## Sanitizzazione input

Tutti i campi di testo sono sanitizzati **in tempo reale** per bloccare
simboli non ammessi:

- **Indirizzo, causa, punto**: lettere (anche accentate), numeri, spazi,
  `.`, `,`, `'`, `-`
- **Ubicazione, conseguenza, nome**: solo lettere, spazi, `'`, `-`
- **Interno**: solo alfanumerico
- **Telefono**: solo cifre, spazi e `+`

Non è possibile digitare `<`, `>`, `/`, `\`, `@`, `#`, `$`, `%` ecc.

## Struttura cartelle

```
app_sinistri/
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── public/
│   ├── index.html
│   └── logo.jpg
└── src/
    ├── App.js
    ├── index.js
    └── index.css
```
