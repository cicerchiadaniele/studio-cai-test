# Changelog

Tutte le modifiche importanti a questo progetto saranno documentate in questo file.

## [1.0.0] - 2026-02-06

### Aggiunto
- Prima versione della webapp per la comunicazione detrazioni fiscali
- Sistema di navigazione step-by-step in 6 passaggi
- Salvataggio automatico dei dati nel localStorage
- Validazione in tempo reale dei campi
- Validazione del codice fiscale
- Step 1: Raccolta dati condominio (nome e civico)
- Step 2: Raccolta dati immobile con dati catastali obbligatori
- Step 3: Gestione multipla proprietari con:
  - Dati anagrafici completi
  - Codice fiscale
  - Quota di possesso
  - Checkbox abitazione principale
  - Checkbox detrazione 50%
- Step 4: Gestione beneficiario diverso dai proprietari (opzionale)
- Step 5: Raccolta recapiti (telefono, cellulare, email)
- Step 6: Riepilogo completo e invio dati
- Interfaccia responsive (mobile, tablet, desktop)
- Animazioni fluide con Framer Motion
- Design moderno con Tailwind CSS
- Sistema di icone con Lucide React
- Gestione errori con messaggi contestuali
- Cooldown di 30 secondi dopo l'invio
- Feedback visivo per invio riuscito/fallito
- Documentazione completa (README, GUIDA_UTENTE)

### Caratteristiche
- Conformità al Decreto MEF 1° dicembre 2016
- Supporto per la Legge di Bilancio 2025 (doppia aliquota 50%/36%)
- Raccolta dati per comunicazione all'Agenzia delle Entrate
- Possibilità di personalizzazione brand (nome, logo, colori)
- Webhook configurabile per l'invio dei dati

### Note tecniche
- React 18.2.0
- Tailwind CSS 3.3.5
- Framer Motion 10.16.4
- Lucide React 0.263.1
- Validazione CF con regex
- LocalStorage per persistenza dati
- Architettura modulare e componenti riutilizzabili
