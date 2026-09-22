export const APP_VERSION = '1.0.0'

// Endpoint interno (funzione Vercel in /api/portali.js)
export const API_URL = '/api/portali'
export const TIMEOUT_MS = 15000

// Ordine fisso delle sezioni; una sezione nuova creata su Airtable compare in fondo
export const SEZIONI = ['Studio', 'Condòmini', 'Portieri', 'Progetti', 'Prove']

// Link per modificare l'elenco (base Airtable "Portali Studio CAI", tabella Portali)
export const AIRTABLE_ELENCO = 'https://airtable.com/appXoSxkXXfeI5LWs/tblybxZh0uICZuTmd'

// Chiave della copia locale dell'ultimo elenco (apertura istantanea, anche senza rete)
export const CACHE_KEY = 'studiocai-portali-v1'
