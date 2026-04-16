# App Sinistri — Studio CAI

Webapp interna per la generazione guidata del testo di apertura sinistro.
L'app raccoglie i dati in campi guidati, compone automaticamente il testo formale
e lo trasmette al flusso di gestione tramite webhook Make.

## Stack

- React 18 + Create React App
- Tailwind CSS 3.4
- framer-motion (animazioni)
- lucide-react (icone)

## Esempi di testo generato

**Esempio 1** — con indirizzo e telefoni:

> Presso il condominio sito in Via Roma 10, a causa della rottura accidentale nel punto di saldatura tra la tubazione e la conversa in piombo del bocchettone ubicato sul terrazzo dell'appartamento interno 8 di proprietà di Rossi Mario tel. 3331234567 si sono verificate delle infiltrazioni che hanno danneggiato il sottostante appartamento interno 7 di proprietà di Bianchi Anna tel. 3337654321.

**Esempio 2** — allagamento singolare (il verbo diventa automaticamente "ha danneggiato"):

> A causa del guasto accidentale nel punto di valvola di scarico del serbatoio ubicato in cucina dell'appartamento interno 3 di proprietà di Verdi Luca tel. 3401234567 si è verificato un allagamento che ha danneggiato il sottostante appartamento interno 2 di proprietà di Neri Giulia tel. 3407654321.

**Esempio 3** — parti comuni e causa con iniziale vocale:

> Presso il condominio sito in Via Garibaldi 25, a causa dell'occlusione accidentale nel punto di pluviale verticale lato ovest ubicato nelle parti comuni dell'appartamento interno 1A di proprietà di Conti Marco tel. 0287654321 si sono verificate delle infiltrazioni ed allagamenti che hanno danneggiato il sottostante appartamento interno 1B di proprietà di Esposito Anna tel. 3331112233.

La logica interna gestisce automaticamente:
- articolo determinativo della causa: `del`/`della`/`dell'`
- preposizione di luogo: `sul`/`sulla`/`sull'`/`in`/`nel`/`nelle`
- concordanza di genere e numero della conseguenza
- concordanza del verbo successivo: `ha danneggiato` vs `hanno danneggiato`

## Campi del modulo (tutti obbligatori)

1. **Condominio** — indirizzo dello stabile
2. **Dinamica del sinistro**
   - Causa del danno (menu a tendina + opzione libera)
   - Punto/componente interessato
   - Ubicazione (menu a tendina + opzione libera)
   - Tipo di conseguenza (menu a tendina + opzione libera)
3. **Unità danneggiante** — interno, nome e cognome, telefono
4. **Unità danneggiata** — interno, nome e cognome, telefono

Il nome viene inserito nel testo in forma neutra come *"di proprietà di [Nome Cognome]"*,
senza titolo né articolo, per massima asetticità del testo formale.

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
| `nomeDanneggiante` | Nome e cognome proprietario danneggiante |
| `telefonoDanneggiante` | Telefono danneggiante |
| `internoDanneggiato` | Interno dell'unità danneggiata |
| `nomeDanneggiato` | Nome e cognome proprietario danneggiato |
| `telefonoDanneggiato` | Telefono danneggiato |
| `consenso` | `true` |
| `testoFinale` | **Testo già composto, pronto all'uso** |
| `ticket` | Codice univoco tipo `SIN-20260416-A1B2` |
| `timestamp` | ISO string del momento di invio |
| `appVersion` | `1.0` |
| `tipo` | `apertura_sinistro` |

Su Make basta prendere il campo `testoFinale` per ottenere direttamente il
testo pronto da inserire in email, PDF o altre destinazioni.

## Identità visiva

- Colore primario: **bordeaux `#8B1538`** (brand Studio CAI)
- Font display: Fraunces (serif)
- Font testo: Manrope (sans-serif)
- Font mono: JetBrains Mono

## Sanitizzazione input

Tutti i campi di testo sono sanitizzati **in tempo reale** per bloccare
simboli non ammessi:

- **Indirizzo, causa, punto**: lettere (anche accentate), numeri, spazi,
  `.`, `,`, `'`, `-`
- **Ubicazione, conseguenza, nome**: solo lettere, spazi, `'`, `-`
- **Interno**: solo alfanumerico
- **Telefono**: solo cifre, spazi e `+`

Non è possibile digitare `<`, `>`, `/`, `\`, `@`, `#`, `$`, `%` ecc.

## Note sul flusso

L'anteprima del testo si aggiorna in tempo reale mentre l'utente compila i campi,
ma **non è copiabile**: l'utente può solo visualizzarla e — se corretta —
premere "Invia apertura sinistro" per trasmetterla via Make. Questo è voluto:
serve a evitare che gli utenti copino il testo fuori dall'applicazione
bypassando la procedura di invio ufficiale.

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
