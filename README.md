# Portale Servizi - Centro Amministrazione Immobili

Portale di accesso centralizzato a tutti i servizi online del Centro Amministrazione Immobili.

## 📋 Servizi Disponibili

1. **Portale Condominiale** ⭐
   - URL: https://studiocai2.cedhousesuite.it/index.php
   - Descrizione: Accesso al gestionale condominiale per consultare documenti e informazioni

2. **Segnalazioni Interventi**
   - URL: https://studio-cai-messenger.vercel.app/
   - Descrizione: Sistema per inviare segnalazioni di interventi e manutenzioni

3. **Area Dipendenti - Portieri**
   - URL: https://studio-cai-portieri.vercel.app/
   - Descrizione: Portale dedicato ai dipendenti e portieri condominiali

4. **Detrazioni Fiscali**
   - URL: https://studio-cai-detrazioni.vercel.app/
   - Descrizione: Modulo per comunicazione aliquote differenziate abitazione principale

5. **Anagrafe Condominiale**
   - URL: https://studio-cai-anagrafe.vercel.app/
   - Descrizione: Raccolta e gestione dati anagrafici condominiali

## 🎨 Design

- **Colore principale**: Bordeaux (#800020)
- **Logo**: Centro Amministrazione Immobili
- **Layout**: Griglia responsive 2x2 su desktop, singola colonna su mobile
- **Effetti**: Animazioni fade-in, hover con elevazione card

## 🚀 Deployment

### Vercel (Consigliato)

1. Carica il contenuto della cartella su Vercel
2. Il file `index.html` sarà servito automaticamente
3. Il logo `logo-cai.jpg` deve essere nella stessa directory

### Hosting Generico

1. Carica tutti i file nella root del server
2. Assicurati che `index.html` e `logo-cai.jpg` siano accessibili
3. Apri `index.html` nel browser

## 📁 Struttura File

```
PortaleServizi/
├── index.html          # Pagina principale del portale
├── logo-cai.jpg        # Logo Centro Amministrazione Immobili
└── README.md           # Questo file
```

## 🔧 Personalizzazione

### Modificare i Link

Nel file `index.html`, cerca i tag `<a href="...">` e modifica gli URL secondo necessità.

### Modificare i Colori

Nel file `index.html`, sezione `<style>`, modifica:
- `.gradient-bg`: Gradiente header (default: bordeaux)
- `.bordeaux-text`: Testo bordeaux (default: #800020)

### Aggiungere Nuovi Servizi

Duplica uno dei blocchi card esistenti e modifica:
- `href`: URL del servizio
- `<h2>`: Titolo del servizio
- `<p>`: Descrizione del servizio
- Icona SVG (opzionale)

## 📱 Compatibilità

- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Tablet
- ✅ Mobile
- ✅ Tutti i browser moderni

## 📞 Contatti

Per assistenza e informazioni: [www.studiocai.it](https://www.studiocai.it)

## 📄 Licenza

© 2025 Centro Amministrazione Immobili. Tutti i diritti riservati.

---

**Versione**: 1.0.0  
**Data**: Febbraio 2025
