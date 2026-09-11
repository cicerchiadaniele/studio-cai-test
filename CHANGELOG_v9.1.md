# Webapp Studio CAI – Versione 9.1

**Data release:** 11 Settembre 2026
**Tipo:** correttiva (nessuna modifica grafica)

---

## Problema risolto

Lo scenario Make "Studio CAI – WebApp Segnalazioni" si bloccava con errore
`[409] path/malformed_path` sul modulo Dropbox "Create a folder" (ramo LI.CA: Idraulico/Edilizia).

Causa: il campo **Condominio** arrivava con uno **spazio finale** (tipicamente aggiunto dal
correttore automatico del telefono). Il nome cartella `TICKET - Condominio` terminava quindi
con uno spazio, che Dropbox non accetta. Casi rilevati:

| Data  | Ticket            | Valore ricevuto      |
|-------|-------------------|----------------------|
| 04/09 | CM-20260904-I1RM  | `"Amari 39 "`        |
| 10/09 | CM-20260910-GEBH  | `"Da Como "`         |
| 11/09 | CM-20260911-1AZ9  | `"Via San Remo 1 "`  |

---

## Pulizia finale dei campi (nuova)

Si aggiunge ai `sanitizers` della v9.0 (che filtrano i caratteri durante la digitazione).
Viene applicata **quando l'utente esce dal campo** (così vede subito il valore corretto)
e **sempre prima dell'invio** al webhook.

| Campo          | Pulizia applicata |
|----------------|-------------------|
| **Condominio** | spazi iniziali/finali, spazi doppi, tab e a capo; punteggiatura in coda (`.` `,` `'` `-`) |
| **Scala / Interno / Telefono** | spazi iniziali/finali e spazi doppi |
| **Nome e Cognome** | spazi iniziali/finali, spazi doppi, apostrofo o trattino in coda |
| **Email** | eliminati tutti gli spazi, convertita in minuscolo |
| **Messaggio** | spazi e righe vuote iniziali/finali; gli a capo interni restano |

Esempi: `"Via San Remo 1 "` → `"Via San Remo 1"` · `"  Via  Roma   12. "` → `"Via Roma 12"` ·
`" Mario.Rossi@Gmail.com "` → `"mario.rossi@gmail.com"`.

Tutti i testi vengono anche normalizzati Unicode (NFC), il formato richiesto da Dropbox.

## Validazioni aggiornate

- Le validazioni lavorano sui valori già ripuliti: un campo di soli spazi risulta vuoto.
- Condominio: minimo 3 caratteri.
- Email con spazio finale: prima risultava "non valida", ora viene corretta in automatico.

---

## Protezioni lato Make (11/09/2026)

- Moduli Dropbox 27 e 29: nome cartella/documento `{{1.ticket}} - {{trim(1.condominio)}}`.
- Scenario: attivata "Allow storing of incomplete executions". In caso di errore lo scenario
  non si disattiva più; l'esecuzione fallita resta in "Incomplete executions" e si riprende
  dal modulo in cui si è fermata.

---

## Invariato rispetto alla v9.0

Grafica, categorie e sottocategorie, webhook Make, formato ticket `CM-YYYYMMDD-XXXX`,
cooldown 8 secondi, consenso privacy, upload file.

File modificati rispetto alla v9.0: `src/App.js`, `package.json` (versione 9.1.0).
Tutti gli altri file (compresa la cartella `public/`) sono copiati dalla v9.0.

---

**Versione:** 9.1
**Data:** 11/09/2026
