# Webapp Studio CAI – Versione 9.0

**Data release:** 16 Aprile 2026

---

## 🎨 Restyling UI / UX

### Tipografia
- Nuovo pairing: **Fraunces** (display, serif moderno) + **Manrope** (body, sans-serif)
- Import via Google Fonts, preconnect attivo

### Hero section
- Aggiunta intestazione "Come possiamo aiutarti?" con badge di trust (Dati protetti, Ticket tracciabile, GDPR compliant)
- Palette affinata: verde brand `#15803d` su sfondo carta con texture leggera

### Form
- Ogni sezione ora è uno **step numerato** (Step 01 → 04) con icona dedicata
- Card principale con ombra più profonda, angoli più arrotondati (`rounded-3xl`)
- Header del form con pattern decorativo a puntini e shimmer animato sul pulsante di invio
- Card categoria: checkmark animato quando selezionata, effetto hover con lift
- Drag & drop sul caricamento file
- Contatore caratteri con alert a 1800/2000 nel messaggio
- Checkbox privacy custom (non più il default del browser)

### Micro-animazioni
- Shimmer sul bottone di invio al passaggio del mouse
- Lift delle card al hover
- Reveal animato della conferma invio con scroll-to-top automatico

---

## 🔒 Sanificazione input (nuova)

I campi seguenti rifiutano automaticamente i simboli non ammessi in fase di digitazione:

| Campo                | Caratteri consentiti                                  |
|----------------------|-------------------------------------------------------|
| **Condominio**       | Lettere (anche accentate), cifre, spazi, `,` `.` `'` `-` |
| **Scala**            | Solo alfanumerico                                     |
| **Interno**          | Solo alfanumerico                                     |
| **Nome e Cognome**   | Lettere, spazi, apostrofo e trattino (es. `D'Angelo`, `De-Luca`) |
| **Telefono**         | Cifre, spazi e `+`                                    |

Implementato tramite funzioni `sanitizers` applicate on-change. L'utente non può fisicamente inserire caratteri vietati — zero feedback d'errore necessario.

---

## 📅 Data di aggiornamento fissa

- Il footer ora mostra una **data costante** (`16/04/2026`) invece della data corrente del sistema.
- Costante definita in `App.js` come `BUILD_DATE_LABEL`.
- Per future release basta aggiornare questa costante insieme ad `APP_VERSION`.

---

## 🛠️ Validazioni aggiuntive

- Nome: minimo 2 caratteri
- Telefono: minimo 6 cifre effettive
- File upload: limite 10 MB esplicitato

---

## 🎯 Funzionalità invariate rispetto alla v8.1

- Stessa lista categorie e sottocategorie (manutenzione, documenti)
- Stesso webhook Make.com
- Sistema ticket `CM-YYYYMMDD-XXXX`
- Cooldown 8 secondi
- Consenso privacy obbligatorio
- Single file upload (PDF/JPG/JPEG/PNG) per categoria "Invio Documenti"
- Design responsive mobile-first

---

**Versione:** 9.0
**Data:** 16/04/2026
