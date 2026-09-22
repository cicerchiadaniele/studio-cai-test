// Funzione Vercel: legge l'elenco portali da Airtable (base "Portali Studio CAI").
// Il token resta sul server (variabile AIRTABLE_TOKEN), mai nel browser.
// Nessuna operazione Make: ogni apertura costa solo una lettura Airtable,
// e la cache di Vercel (60 s) evita letture ripetute a raffica.

const BASE = process.env.AIRTABLE_BASE || 'appXoSxkXXfeI5LWs'
const TABELLA = process.env.AIRTABLE_TABLE || 'tblybxZh0uICZuTmd'

export default async function handler(req, res) {
  const token = process.env.AIRTABLE_TOKEN
  if (!token) {
    res.status(500).json({ ok: false, errore: 'AIRTABLE_TOKEN non configurato su Vercel' })
    return
  }

  try {
    const portali = []
    let offset
    do {
      const url = new URL(`https://api.airtable.com/v0/${BASE}/${TABELLA}`)
      url.searchParams.set('filterByFormula', '{Attivo}')
      url.searchParams.set('pageSize', '100')
      for (const f of ['Nome', 'URL', 'Descrizione', 'Sezione', 'Icona', 'Ordine']) url.searchParams.append('fields[]', f)
      if (offset) url.searchParams.set('offset', offset)

      const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      if (!r.ok) throw new Error(`Airtable ${r.status}`)
      const json = await r.json()
      for (const rec of json.records || []) {
        const f = rec.fields || {}
        if (!f.Nome || !f.URL) continue
        portali.push({
          id: rec.id,
          nome: f.Nome,
          url: f.URL,
          descrizione: f.Descrizione || '',
          sezione: f.Sezione || 'Altro',
          icona: f.Icona || '',
          ordine: typeof f.Ordine === 'number' ? f.Ordine : 999,
        })
      }
      offset = json.offset
    } while (offset)

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=600')
    res.status(200).json({ ok: true, aggiornato: new Date().toISOString(), portali })
  } catch (e) {
    res.status(502).json({ ok: false, errore: String(e.message || e) })
  }
}
