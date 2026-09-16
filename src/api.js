import { WEBHOOK_URL, TIMEOUT_MS, APP_VERSION } from './config.js'

// Invio come form-urlencoded: richiesta "semplice", nessun preflight CORS.
async function chiama(dati) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      body: new URLSearchParams({ ...dati, versione: APP_VERSION }),
      signal: ctrl.signal,
    })
    const testo = await res.text()
    let json
    try { json = JSON.parse(testo) } catch { json = null }
    if (!res.ok || !json || json.ok !== true) {
      throw new Error('Il registro non ha confermato l\u2019operazione.')
    }
    return json
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('Nessuna risposta dal registro entro 25 secondi.')
    if (e instanceof TypeError) throw new Error('Connessione assente o registro non raggiungibile.')
    throw e
  } finally {
    clearTimeout(timer)
  }
}

export const pulisciNome = (s) =>
  String(s || '').replace(/["\\]/g, '').replace(/[\u0000-\u001f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60)

export async function caricaElenco() {
  const json = await chiama({ azione: 'elenco' })
  const chiavi = (json.chiavi || []).map((r) => ({
    id: r.id,
    condominio: r.fields?.Condominio || '(senza nome)',
    fuori: r.fields?.Stato === 'Fuori',
    detentore: r.fields?.Detentore || '',
    uscita: r.fields?.Uscita || null,
  }))
  const nominativi = (json.nominativi || []).map((r) => r.fields?.Nome).filter(Boolean)
  return { chiavi, nominativi }
}

export const registraUscita = (recordId, nome) =>
  chiama({ azione: 'prendo', recordId, nome: pulisciNome(nome) })

export const registraRientro = (recordId) =>
  chiama({ azione: 'restituisco', recordId })

export function giorniFuori(uscita) {
  if (!uscita) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(uscita).getTime()) / 86400000))
}

export const normalizza = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')
