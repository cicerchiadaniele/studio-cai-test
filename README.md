# Registro Presenze Portieri - v2.0

Webapp per la gestione delle presenze dei portieri - Studio CAI

## 🚀 Deploy su Vercel

### Metodo 1: Deploy tramite CLI (RACCOMANDATO)

1. Installa Vercel CLI:
```bash
npm install -g vercel
```

2. Naviga nella cartella del progetto ed esegui:
```bash
vercel
```

3. Segui le istruzioni a schermo

### Metodo 2: Deploy tramite Git

1. Crea un repository su GitHub
2. Carica tutti i file
3. Vai su [vercel.com](https://vercel.com)
4. Clicca su "Import Project"
5. Seleziona il repository
6. **IMPORTANTE**: Nelle impostazioni di build:
   - **Framework Preset**: Other
   - **Build Command**: (lascia vuoto)
   - **Output Directory**: (lascia vuoto o scrivi `.`)
   - **Install Command**: (lascia vuoto)

### Metodo 3: Deploy tramite interfaccia web

1. Vai su [vercel.com](https://vercel.com)
2. Trascina e rilascia la cartella del progetto
3. Vercel farà automaticamente il deploy

## 🌐 Altri servizi di hosting

### Netlify
1. Vai su [netlify.com](https://netlify.com)
2. Trascina la cartella o connetti il repository
3. Lascia vuote le impostazioni di build

### GitHub Pages
1. Carica i file su un repository GitHub
2. Vai su Settings → Pages
3. Seleziona il branch e la cartella

### Hosting tradizionale (FTP)
Carica semplicemente tutti i file via FTP nella root del sito

## 📁 Struttura File

```
portieri-presenze-webapp-v2/
├── index.html          # Pagina principale
├── styles.css          # Stili CSS
├── app.js              # Logica applicazione
├── config.json         # Configurazione webhook
├── employees.json      # Lista dipendenti
├── vercel.json         # Configurazione Vercel
├── package.json        # Info progetto
└── README.md           # Questo file
```

## ⚙️ Configurazione

### Modifica Webhook URL
Modifica il file `config.json`:
```json
{
  "webhook_url": "TUO_WEBHOOK_URL_QUI"
}
```

### Modifica Lista Dipendenti
Modifica il file `employees.json`:
```json
[
  { "id": "005" },
  { "id": "012" }
]
```

## ✨ Features v2.0

- ✅ Design moderno e responsive
- ✅ Animazioni fluide
- ✅ Salvataggio automatico bozze
- ✅ Cronologia ultimi 10 invii
- ✅ Dialog di conferma
- ✅ Validazione migliorata
- ✅ Loading states
- ✅ Feedback visivo potenziato

## 🐛 Troubleshooting

### Errore durante il deploy su Vercel
Se vedi errori tipo "react-scripts build":
1. Cancella il file `package.json` (non necessario)
2. Usa solo `vercel.json`
3. Vercel rileverà automaticamente il sito statico

### Webhook non funziona
1. Verifica l'URL in `config.json`
2. Controlla la console del browser (F12)
3. Verifica CORS sul server Make.com

## 📝 Note

- **Versione**: 2.0.0
- **Data**: 02/02/2025
- **Browser supportati**: Chrome, Firefox, Safari, Edge (ultimi 2 versioni)
- **Requisiti**: Nessuno (puro HTML/CSS/JS)

## 📞 Supporto

Per problemi o domande, contatta Studio CAI.

---

© 2025 Studio CAI - Centro Amministrazione Immobili
