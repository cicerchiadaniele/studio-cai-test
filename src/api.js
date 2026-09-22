import { API_URL, TIMEOUT_MS, CACHE_KEY, SEZIONI } from './config.js'

export async function caricaPortali() {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(API_URL, { signal: ctrl.signal, cache: 'no-store' })
    const json = await res.json().catch(() => null)
    if (!res.ok || !json || json.ok !== true) throw new Error(json?.errore || 'Elenco non disponibile.')
    salvaCache(json)
    return json
  } catch (e) {
    if (e.name === 'AbortError') throw new Error('Nessuna risposta entro 15 secondi.')
    if (e instanceof TypeError) throw new Error('Connessione assente.')
    throw e
  } finally {
    clearTimeout(timer)
  }
}

export function leggiCache() {
  try {
    const s = localStorage.getItem(CACHE_KEY)
    return s ? JSON.parse(s) : null
  } catch {
    return null
  }
}

function salvaCache(json) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(json)) } catch { /* memoria non disponibile */ }
}

// Raggruppa per sezione nell'ordine di SEZIONI; sezioni sconosciute in fondo, in ordine alfabetico
export function raggruppa(portali) {
  const gruppi = new Map()
  for (const p of portali) {
    if (!gruppi.has(p.sezione)) gruppi.set(p.sezione, [])
    gruppi.get(p.sezione).push(p)
  }
  const pos = (s) => { const i = SEZIONI.indexOf(s); return i === -1 ? SEZIONI.length : i }
  return [...gruppi.entries()]
    .sort(([a], [b]) => pos(a) - pos(b) || a.localeCompare(b, 'it'))
    .map(([sezione, lista]) => ({
      sezione,
      lista: lista.sort((a, b) => a.ordine - b.ordine || a.nome.localeCompare(b.nome, 'it')),
    }))
}

export const normalizza = (s) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export const dominio = (url) => {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

export const oraBreve = (iso) =>
  iso ? new Date(iso).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''
