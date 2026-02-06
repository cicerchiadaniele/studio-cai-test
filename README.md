# Webapp Comunicazione Detrazioni Fiscali 2026

Applicazione web per la raccolta dati per la comunicazione all'Agenzia delle Entrate relativa alle detrazioni fiscali per interventi di recupero del patrimonio edilizio e riqualificazione energetica effettuati sulle parti comuni di edifici residenziali.

## Caratteristiche

- ✅ **Interfaccia step-by-step**: Processo guidato in 6 passaggi
- 💾 **Salvataggio automatico**: I dati vengono salvati automaticamente nel browser
- 📱 **Responsive**: Ottimizzato per desktop, tablet e smartphone
- 🎨 **Design moderno**: Interfaccia pulita e professionale
- ✔️ **Validazione in tempo reale**: Controllo dei dati inseriti
- 🔒 **Privacy**: I dati rimangono nel browser fino all'invio

## Struttura dell'applicazione

### Step 1: Dati Condominio
- Nome condominio
- Numero civico

### Step 2: Dati Immobile
- Tipo immobile (appartamento, box, cantina)
- Interno
- Dati catastali (sezione, foglio, particella, subalterno, categoria)

### Step 3: Proprietari
- Dati anagrafici di tutti i proprietari
- Codice fiscale
- Quota di possesso
- Indicazione abitazione principale
- Richiesta detrazione al 50%
- Possibilità di aggiungere più proprietari

### Step 4: Beneficiario della Detrazione
- Dati del beneficiario diverso dal proprietario (se presente)
- Quota della detrazione

### Step 5: Recapiti
- Telefono fisso
- Cellulare
- Email

### Step 6: Riepilogo e Invio
- Visualizzazione di tutti i dati inseriti
- Consenso privacy
- Invio della comunicazione

## Installazione

1. Assicurati di avere Node.js installato (versione 16 o superiore)

2. Installa le dipendenze:
```bash
npm install
```

3. Avvia l'applicazione in modalità sviluppo:
```bash
npm start
```

L'applicazione sarà disponibile su `http://localhost:3000`

## Build per produzione

Per creare una versione ottimizzata per la produzione:

```bash
npm run build
```

I file ottimizzati saranno disponibili nella cartella `build/`

## Configurazione

### Personalizzazione Brand
Puoi personalizzare l'applicazione modificando i valori nel localStorage:

- `df_brand`: Nome dello studio/brand
- `df_logo`: URL del logo
- `df_primary`: Colore primario (formato hex)
- `df_webhook`: URL del webhook per l'invio dei dati

### Webhook
L'applicazione invia i dati a un webhook configurabile. Il payload include:
- Timestamp di invio
- Nome del brand
- Tutti i dati del modulo

## Normativa di riferimento

Questa webapp implementa il modulo richiesto dal Decreto del Ministro dell'Economia e delle Finanze del 1° dicembre 2016, come modificato dalla Legge di Bilancio 2025, per la comunicazione delle spese sostenute per:

- Interventi di recupero del patrimonio edilizio
- Interventi di riqualificazione energetica

### Novità 2025

A partire dal 2025 sono previste due diverse aliquote di detraibilità:
- **50%**: per unità immobiliari adibite ad abitazione principale
- **36%**: per altre unità immobiliari

### Condizioni per l'aliquota maggiorata (50%)

1. Il contribuente deve essere titolare di un diritto di proprietà o diritto reale di godimento sull'unità immobiliare (all'inizio dei lavori)
2. L'unità immobiliare deve essere destinata ad abitazione principale (al termine dei lavori)

## Tecnologie utilizzate

- **React 18**: Framework JavaScript
- **Tailwind CSS**: Framework CSS per lo styling
- **Framer Motion**: Libreria per le animazioni
- **Lucide React**: Icone

## Licenza

Applicazione sviluppata per Studio CAI

## Supporto

Per assistenza o segnalazione problemi, contattare l'amministratore di condominio.
