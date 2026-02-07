# Webapp Comunicazione Detrazioni Fiscali 2026

Applicazione web per la raccolta dati per la comunicazione all'Agenzia delle Entrate relativa alle detrazioni fiscali per interventi di recupero del patrimonio edilizio e riqualificazione energetica effettuati sulle parti comuni di edifici residenziali.

## Caratteristiche

- ✅ **Interfaccia step-by-step**: Processo guidato in 6 passaggi
- 💾 **Salvataggio automatico**: I dati vengono salvati automaticamente nel browser
- 📱 **Responsive**: Ottimizzato per desktop, tablet e smartphone
- 🎨 **Design moderno**: Interfaccia pulita e professionale con Tailwind CSS
- ✔️ **Validazione in tempo reale**: Controllo dei dati inseriti
- 🔒 **Privacy**: I dati rimangono nel browser fino all'invio

## Installazione

1. Estrai il file ZIP
2. Apri il terminale nella cartella estratta
3. Installa le dipendenze:
```bash
npm install
```
4. Avvia l'applicazione:
```bash
npm start
```

L'applicazione sarà disponibile su `http://localhost:3000`

## Build per produzione

```bash
npm run build
```

I file ottimizzati saranno disponibili nella cartella `build/`

## Configurazione

Personalizza l'applicazione tramite localStorage (apri Console Browser - F12):

```javascript
localStorage.setItem('df_brand', JSON.stringify('Studio CAI'))
localStorage.setItem('df_logo', JSON.stringify('/logo.jpg'))
localStorage.setItem('df_primary', JSON.stringify('#16a34a'))
localStorage.setItem('df_webhook', JSON.stringify('https://il-tuo-webhook.com'))
```

## Struttura Step

1. **Condominio** - Nome e civico
2. **Immobile** - Dati catastali (foglio, particella, subalterno)
3. **Proprietari** - Dati anagrafici e opzioni detrazione 50%
4. **Beneficiario** - Beneficiario diverso dai proprietari (opzionale)
5. **Recapiti** - Telefono, cellulare, email
6. **Riepilogo** - Verifica e invio

## Tecnologie

- React 18
- Tailwind CSS
- Framer Motion
- Lucide React

## Supporto

Per assistenza contattare l'amministratore di condominio.

© 2026 Studio CAI
