# Guida all'Installazione e Configurazione

## Webapp Comunicazione Detrazioni Fiscali 2026

---

## Requisiti di Sistema

### Software necessario
- **Node.js** versione 16 o superiore ([Download](https://nodejs.org))
- **npm** (incluso con Node.js)
- Un editor di testo (consigliato: VS Code, Sublime Text, Notepad++)
- Un browser moderno (Chrome, Firefox, Safari, Edge)

### Conoscenze richieste
- Nessuna conoscenza tecnica particolare per l'utilizzo
- Conoscenze base di terminale/prompt per l'installazione

---

## Installazione Passo-Passo

### 1. Estrarre i file

1. Estrarre il file `Webapp_DetrazioniFiscali_2026.zip`
2. Si otterrà una cartella `detrazioni-fiscali` con tutti i file necessari

### 2. Verificare Node.js

Aprire il terminale/prompt dei comandi e digitare:

```bash
node --version
```

Dovrebbe apparire qualcosa come `v16.x.x` o superiore.

Se non installato, scaricare da [nodejs.org](https://nodejs.org)

### 3. Installare le dipendenze

1. Aprire il terminale/prompt dei comandi
2. Navigare nella cartella dell'applicazione:

```bash
cd percorso/alla/cartella/detrazioni-fiscali
```

3. Installare le dipendenze:

```bash
npm install
```

Questo processo può richiedere qualche minuto.

### 4. Avviare l'applicazione

Una volta completata l'installazione, avviare l'applicazione:

```bash
npm start
```

L'applicazione si aprirà automaticamente nel browser all'indirizzo:
```
http://localhost:3000
```

---

## Configurazione

### Personalizzazione Base

Per personalizzare l'applicazione con i dati del tuo studio, apri la **Console del Browser** (F12) e inserisci i seguenti comandi:

#### 1. Nome Studio/Brand

```javascript
localStorage.setItem('df_brand', JSON.stringify('Studio CAI'))
```

Sostituisci `'Studio CAI'` con il nome del tuo studio.

#### 2. URL Logo

```javascript
localStorage.setItem('df_logo', JSON.stringify('/logo.jpg'))
```

Metti il file del logo nella cartella `public/` e modifica il percorso di conseguenza.

#### 3. Colore Primario

```javascript
localStorage.setItem('df_primary', JSON.stringify('#16a34a'))
```

Sostituisci `'#16a34a'` con il codice colore esadecimale desiderato.

#### 4. Webhook per l'invio dati

```javascript
localStorage.setItem('df_webhook', JSON.stringify('https://il-tuo-webhook-url.com'))
```

Sostituisci con l'URL del tuo webhook Make.com, Zapier o altro servizio.

**IMPORTANTE**: Dopo aver modificato le configurazioni, aggiorna la pagina (F5).

### Configurazione Avanzata del Logo

1. Copiare il file del logo nella cartella `public/`
2. Rinominarlo in `logo.jpg` (o modificare il riferimento nel codice)
3. Formati supportati: JPG, PNG, SVG
4. Dimensioni consigliate: 200x50 pixel (proporzioni 4:1)

---

## Build per Produzione

Per creare una versione ottimizzata da pubblicare su un server web:

```bash
npm run build
```

I file ottimizzati saranno nella cartella `build/`. 

### Pubblicazione

La cartella `build/` può essere:
- Caricata su un hosting web (Netlify, Vercel, GitHub Pages)
- Servita da un web server (Apache, Nginx)
- Distribuita tramite CDN

---

## Configurazione Webhook

### Cos'è un Webhook?

Un webhook è un URL che riceve i dati quando un utente invia il modulo.

### Servizi consigliati

1. **Make.com** (consigliato)
   - Gratuito fino a 1000 operazioni/mese
   - Interfaccia visuale
   - Facile integrazione con Google Sheets, Email, ecc.

2. **Zapier**
   - Alternativa a Make.com
   - Piano gratuito disponibile

3. **Webhook personalizzato**
   - Richiede sviluppo backend
   - Massima flessibilità

### Setup Make.com (esempio)

1. Registrarsi su [make.com](https://www.make.com)
2. Creare un nuovo scenario
3. Aggiungere un trigger "Webhook"
4. Copiare l'URL del webhook
5. Configurare l'applicazione con quell'URL
6. Aggiungere azioni (es: invia email, salva su Google Sheets)

**Formato dati ricevuti:**

```json
{
  "timestamp": "2026-02-06T10:30:00.000Z",
  "brandName": "Studio CAI",
  "condominio": "Condominio Via Roma",
  "civico": "123",
  "immobile": {
    "tipo": "Appartamento",
    "interno": "5",
    "sezione": "A",
    "foglio": "12",
    "particella": "345",
    "subalterno": "6",
    "categoria": "A/2"
  },
  "proprietari": [
    {
      "cognome": "Rossi",
      "nome": "Mario",
      "luogoNascita": "Roma",
      "dataNascita": "1980-01-01",
      "codiceFiscale": "RSSMRA80A01H501U",
      "quotaPossesso": "100%",
      "abitazionePrincipale": true,
      "detrazione50": true
    }
  ],
  "beneficiario": {
    "presente": false
  },
  "recapiti": {
    "telefonoFisso": "06 12345678",
    "cellulare": "339 1234567",
    "email": "email@esempio.it"
  },
  "consensoPrivacy": true,
  "dataFirma": "2026-02-06"
}
```

---

## Risoluzione Problemi Comuni

### Errore: "npm: command not found"

**Soluzione**: Node.js non è installato o non è nel PATH. Installare Node.js da [nodejs.org](https://nodejs.org)

### Errore: "Port 3000 is already in use"

**Soluzione**: La porta 3000 è occupata. Opzioni:
1. Chiudere l'altra applicazione che usa la porta 3000
2. Usare una porta diversa: `PORT=3001 npm start`

### L'applicazione non si carica nel browser

**Soluzioni**:
1. Verificare che il comando `npm start` sia completato senza errori
2. Aprire manualmente http://localhost:3000
3. Verificare il firewall
4. Provare con un altro browser

### I dati non vengono salvati

**Soluzioni**:
1. Verificare che i cookie siano abilitati
2. Non usare la navigazione in incognito
3. Verificare che il localStorage non sia pieno
4. Provare a cancellare la cache del browser

### Errore durante l'invio

**Soluzioni**:
1. Verificare la configurazione del webhook
2. Controllare la connessione internet
3. Verificare che tutti i campi obbligatori siano compilati
4. Controllare la console del browser (F12) per errori

---

## Manutenzione

### Aggiornamento dipendenze

Periodicamente aggiornare le dipendenze:

```bash
npm update
```

### Backup dei dati

I dati sono salvati nel localStorage del browser. Per fare backup:
1. Aprire la Console (F12)
2. Digitare: `localStorage.getItem('df_form_draft')`
3. Copiare il risultato in un file di testo

---

## Sicurezza e Privacy

### Dati sensibili

L'applicazione gestisce dati sensibili:
- Codici fiscali
- Dati anagrafici
- Dati catastali

### Raccomandazioni

1. **HTTPS obbligatorio**: Pubblicare solo su dominio HTTPS
2. **Webhook sicuro**: Usare webhook con autenticazione
3. **Privacy**: Informare gli utenti sul trattamento dati
4. **Backup**: Fare backup regolari dei dati ricevuti
5. **Accesso limitato**: Limitare l'accesso solo agli autorizzati

### GDPR

Assicurarsi di:
- Avere un'informativa privacy adeguata
- Ottenere il consenso esplicito
- Conservare i dati solo per il tempo necessario
- Garantire il diritto di cancellazione
- Implementare misure di sicurezza adeguate

---

## Supporto Tecnico

### Documentazione

- `README.md`: Panoramica generale
- `GUIDA_UTENTE.md`: Guida per gli utenti finali
- `CHANGELOG.md`: Registro delle modifiche

### Assistenza

Per problemi tecnici:
1. Controllare questa guida
2. Verificare i file di documentazione
3. Controllare la console del browser per errori
4. Verificare la configurazione del webhook

---

## Aggiornamenti Futuri

L'applicazione può essere estesa con:
- Invio email di conferma automatica
- Generazione PDF del modulo compilato
- Integrazione diretta con Agenzia delle Entrate
- Dashboard amministratore
- Sistema di autenticazione
- Multi-lingua
- Firma digitale

---

**Versione**: 1.0.0  
**Data**: Febbraio 2026  
**Licenza**: Uso interno Studio CAI
