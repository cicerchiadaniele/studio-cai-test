# App Sinistri — Studio CAI

Webapp interna per la generazione guidata del testo di apertura sinistro.
L'app raccoglie i dati in campi guidati, compone automaticamente il testo formale
e lo trasmette al flusso di gestione tramite webhook Make.

## Stack

- React 18 + Create React App
- Tailwind CSS 3.4
- framer-motion (animazioni)
- lucide-react (icone)

## Sintassi del testo generato

Il testo parte sempre da **"A causa"** e ha la seguente struttura:

> *A causa [articolo][causa] [articolo][elemento] ubicato [preposizione][ubicazione] dell'unità immobiliare interno [X] di proprietà di [Nome] tel. [Y] si sono verificat... [conseguenza] che ha/hanno danneggiato la sottostante unità immobiliare interno [Z] di proprietà di [Nome] tel. [W].*

Quando l'ubicazione è **"appartamento"** viene omessa, per non essere ridondante con "unità immobiliare" che segue (*"del flessibile del lavabo dell'unità immobiliare interno 5"*).

## Esempi di testo generato

**Esempio 1** — box + tubazione di scarico + infiltrazioni:

> A causa della rottura accidentale della tubazione di scarico ubicato nel box dell'unità immobiliare interno 3 di proprietà di Daniele Rossi tel. 1234567890 si sono verificate delle infiltrazioni che hanno danneggiato la sottostante unità immobiliare interno 4 di proprietà di Francesca Bianchi tel. 0987654321.

**Esempio 2** — appartamento (ubicazione omessa) + allagamento (concordanza verbale al singolare):

> A causa della rottura accidentale del flessibile del lavabo dell'unità immobiliare interno 5 di proprietà di Mario Verdi tel. 3331111111 si è verificato un allagamento che ha danneggiato la sottostante unità immobiliare interno 4 di proprietà di Luca Neri tel. 3332222222.

**Esempio 3** — terrazzo + saldatura + infiltrazioni:

> A causa della rottura accidentale della saldatura del bocchettone ubicato sul terrazzo dell'unità immobiliare interno 8 di proprietà di Rossi Mario tel. 3331234567 si sono verificate delle infiltrazioni che hanno danneggiato la sottostante unità immobiliare interno 7 di proprietà di Bianchi Anna tel. 3337654321.

**Esempio 4** — evento atmosferico + cantina:

> A causa dell'evento atmosferico del serramento della finestra ubicato nella cantina dell'unità immobiliare interno 12 di proprietà di Conti Paola tel. 3401234567 si sono verificate delle infiltrazioni che hanno danneggiato la sottostante unità immobiliare interno 11 di proprietà di Esposito Marco tel. 3407654321.

La logica interna gestisce automaticamente:
- articolo determinativo della causa: `del`/`della`/`dell'`
- articolo determinativo dell'elemento/componente (con euristica sul genere della prima parola + eccezioni note)
- preposizione di luogo: `nel`/`nell'`/`nella`/`sul`/`sulla`
- omissione ubicazione "appartamento" per evitare ridondanza con "unità immobiliare"
- concordanza di genere e numero della conseguenza
- concordanza del verbo successivo: `ha danneggiato` vs `hanno danneggiato`

## Campi del modulo (tutti obbligatori)

1. **Condominio** — indirizzo dello stabile (incluso nel payload Make ma non nel testo)
2. **Dinamica del sinistro**
   - **Causa del danno**: `rottura accidentale` · `occlusione accidentale` · `evento atmosferico` · `altra causa (specifica)`
   - **Elemento/componente interessato** (campo libero)
   - **Ubicazione**: `appartamento` · `box` · `cantina` · `terrazzo` · `altro (specifica)`
   - **Tipo di conseguenza**: `infiltrazioni` · `allagamento` · `infiltrazioni ed allagamenti` · `macchie di umidità` · `danni da percolazione` · `altro (specifica)`
3. **Unità danneggiante** — interno, nome e cognome, telefono
4. **Unità danneggiata** — interno, nome e cognome, telefono

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
| `punto` | Elemento/componente interessato |
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
