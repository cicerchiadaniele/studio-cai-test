# Studio CAI – App Segnalazioni

Webapp interna per la gestione delle segnalazioni condominiali e l'invio di documentazione verso Make (webhook).

## Funzionamento

L'operatore compila tre campi obbligatori e preme **Invia**:

| Campo | Tipo | Note |
|---|---|---|
| **Condominio** | Testo libero | Indirizzo dello stabile (es. *Via Marco Polo 84*) |
| **Destinatario** | Selezione guidata | Manutentore, Fornitore, Amministratore, Consiglio, Assemblea, Altro |
| **Segnalazione** | Area di testo | Testo libero della segnalazione o comunicazione |
| **Allegato PDF** | File PDF (opzionale) | Max 1 file · solo PDF · max 10 MB |

## Payload inviato al webhook

**Senza allegato** — `Content-Type: application/json`
```json
{
  "condominio": "Via Marco Polo 84",
  "destinatario": "Manutentore",
  "testo": "Il portone presenta difetto di chiusura e rimane aperto."
}
```

**Con allegato** — `multipart/form-data`
- `condominio` (campo testo)
- `destinatario` (campo testo)
- `testo` (campo testo)
- `allegato` (file PDF)

## Webhook

```
https://hook.eu1.make.com/8bhbqarp7a2jkgu3ii95ev4wziqpr9zb
```

## Installazione e avvio

### Prerequisiti
- Node.js 18+ e npm

### Comandi
```bash
# 1. Installa le dipendenze
npm install

# 2. Avvia in sviluppo (porta 3000)
npm start

# 3. Build di produzione
npm run build
```

## Deploy su server locale (Windows)

Copia la cartella del progetto sul server, esegui `npm run build`
e servi la cartella `build/` con qualsiasi web server (es. `serve -s build`).

## Tecnologie

- React 18 + Framer Motion (animazioni)
- Tailwind CSS (stile)
- Lucide React (icone)
- Font: Fraunces (display) + Manrope (corpo) via Google Fonts

## Stile

Coerente con **App Sinistri v1.0** — colore bordeaux `#8B1538`, sfondo carta, font identici.
