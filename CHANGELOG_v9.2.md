# Webapp Studio CAI – Versione 9.2

**Data release:** 14 Settembre 2026
**Base:** v9.1 (correzione spazi finali, mai pubblicata)
**Tipo:** migliorativa

---

## 1. Scala e Interno non vengono più storpiati

Nella v9.0 i due campi accettavano solo lettere e numeri: ogni spazio, trattino o barra
spariva durante la digitazione. Valori reali dell'anagrafica venivano alterati:

| Digitato      | v9.0 salvava | v9.2 salva  |
|---------------|--------------|-------------|
| `A 1-1`       | `A11`        | `A 1-1`     |
| `B1/2`        | `B12`        | `B1/2`      |
| `28 Por.`     | `28Por`      | `28 Por.`   |
| `A e B`       | `AeB`        | `A e B`     |

Ora sono ammessi anche spazi, trattino, barra e punto. Restano esclusi i simboli che non
hanno senso in questi campi. All'uscita dal campo vengono tolti solo gli spazi superflui:
la punteggiatura resta, perché Scala e Interno non finiscono mai in un percorso Dropbox.

## 2. Foto facoltativa negli interventi di manutenzione

Scelta la categoria "Interventi di Manutenzione" e il tipo di intervento, compare il
riquadro di caricamento, marcato **(facoltativo)**. Stessi limiti dell'invio documenti:
PDF, JPG, JPEG o PNG, massimo 10 MB.

Per "Invio Documenti" l'allegato resta **obbligatorio**, invariato.

---

## Invariato rispetto alla v9.1

Pulizia finale dei campi (spazi finali su Condominio, Nome, Email, Telefono, Messaggio),
grafica, categorie e sottocategorie, webhook Make, formato ticket, cooldown, privacy.

## Da completare lato Make

Il file viaggia già verso il webhook nel campo `file1`, ma lo scenario allega il file
**solo** nel ramo "Invio Documenti". Finché non viene mappato anche nelle email alle ditte
(moduli 8 – LI.CA e 11 – Frateily), la foto di un intervento arriva allo studio ma non al
tecnico. La mappatura va aggiunta con cautela, perché un allegato vuoto può far fallire il
modulo email quando la segnalazione non ha foto: va verificata con un ticket di prova su
una sottocategoria senza ditta (es. Giardinaggio) prima di applicarla ai moduli 8 e 11.

---

**Versione:** 9.2
**Data:** 14/09/2026
