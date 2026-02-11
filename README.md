# Modulo Detrazioni Fiscali - Aliquote Differenziate

Webapp per la raccolta dati relativi alle detrazioni fiscali per abitazione principale secondo le normative vigenti.

## 📋 Descrizione

Questa applicazione web permette ai condomini di comunicare all'amministrazione condominiale la propria volontà di usufruire dell'aliquota maggiorata del 50% per le detrazioni fiscali relative ad interventi sull'abitazione principale.

### Normativa di riferimento

- **Aliquota 50%**: applicabile se l'intervento è sostenuto dal proprietario o titolare di altro diritto reale di godimento E se l'unità immobiliare è destinata ad abitazione principale
- **Aliquota 36%**: applicabile in tutti gli altri casi
- **Scadenza**: 31 dicembre di ogni anno per beneficiare dell'aliquota maggiorata nelle future comunicazioni all'Agenzia delle Entrate

## ✨ Caratteristiche

- ✅ Modulo completo su pagina singola
- ✅ Validazione in tempo reale dei dati inseriti
- ✅ Avvisi dinamici durante la compilazione
- ✅ Controllo automatico requisiti per aliquota 50%
- ✅ Alert scadenza 31 dicembre (attivo dal 15 dicembre)
- ✅ Validazione codice fiscale italiano
- ✅ Validazione email e telefono
- ✅ Design responsive per mobile e desktop
- ✅ Animazioni fluide e interfaccia moderna
- ✅ Invio come autocertificazione (DPR 445/2000)

## 📊 Dati Raccolti

### Condominio
- Nome condominio
- Numero civico

### Immobile
- Tipo (appartamento, box, cantina, ecc.)
- Numero interno
- **Dati catastali (OBBLIGATORI)**:
  - Sezione
  - Foglio
  - Particella
  - Subalterno
  - Categoria

### Proprietario
- Cognome e Nome
- Data e luogo di nascita
- Codice fiscale (con validazione)
- Quota di possesso

### Dichiarazioni
- Abitazione principale (residenza anagrafica e dimora abituale)
- Richiesta detrazione al 50%

### Recapiti (OBBLIGATORI)
- Email (per ricevere copia autocertificazione)
- Telefono

## 🚀 Installazione

```bash
# Installa le dipendenze
npm install

# Avvia in modalità sviluppo
npm start

# Build per produzione
npm run build
```

L'applicazione sarà disponibile su `http://localhost:3000`

## 🔧 Configurazione

### Endpoint per invio dati

Modificare il file `src/App.js` alla riga ~160 per configurare l'endpoint di destinazione:

```javascript
// Sostituire YOUR_WEBHOOK_URL con l'URL del proprio webhook/endpoint
await fetch('YOUR_WEBHOOK_URL', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dataToSend)
});
```

### Formato dati inviati

```json
{
  "condominio": "Via Roma, Condominio Rossi",
  "civico": "15",
  "tipoImmobile": "Appartamento",
  "interno": "5",
  "sezione": "A",
  "foglio": "123",
  "particella": "456",
  "subalterno": "7",
  "categoria": "A/2",
  "cognome": "Rossi",
  "nome": "Mario",
  "dataNascita": "1980-01-15",
  "luogoNascita": "Roma (RM)",
  "codiceFiscale": "RSSMRA80A15H501U",
  "quotaPossesso": "100",
  "abitazionePrincipale": true,
  "detrazione50": true,
  "email": "mario.rossi@email.com",
  "telefono": "+39 333 1234567",
  "dataInvio": "2025-02-11T14:30:00.000Z",
  "aliquotaApplicabile": "50%",
  "timestamp": "11/02/2025, 15:30:00"
}
```

## 📱 Tecnologie Utilizzate

- **React 18** - Framework UI
- **Tailwind CSS** - Styling
- **Framer Motion** - Animazioni
- **Lucide React** - Icone

## ⚠️ Note Importanti

### Effetti della Mancata Comunicazione

In assenza di comunicazione entro il termine del 31 dicembre, l'Amministrazione non potrà indicare l'opzione nella comunicazione all'Agenzia delle Entrate e, conseguentemente, non sarà applicata l'aliquota maggiorata del 50% nella dichiarazione precompilata.

### Possibilità di Rettifica

Il contribuente potrà comunque modificare e integrare la propria dichiarazione dei redditi precompilata. Si consiglia sempre di verificare con il proprio commercialista la corretta compilazione della dichiarazione precompilata ed eventualmente correggerla.

## 📄 Licenza

Questo progetto è di proprietà privata. Tutti i diritti riservati.

## 👥 Supporto

Per assistenza o informazioni, contattare l'amministrazione condominiale.

---

**Versione**: 1.0.0  
**Data rilascio**: Febbraio 2025
