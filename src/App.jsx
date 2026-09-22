import { useEffect, useMemo, useState } from 'react'
import Scheda from './components/Scheda.jsx'
import { caricaPortali, leggiCache, raggruppa, normalizza, oraBreve } from './api.js'
import { APP_VERSION, AIRTABLE_ELENCO } from './config.js'

export default function App() {
  const cache = useMemo(leggiCache, [])
  const [dati, setDati] = useState(cache)
  const [stato, setStato] = useState('attesa') // attesa | pronto | errore
  const [errore, setErrore] = useState('')
  const [cerca, setCerca] = useState('')

  const aggiorna = async () => {
    setStato('attesa')
    try {
      setDati(await caricaPortali())
      setStato('pronto')
    } catch (e) {
      setErrore(e.message)
      setStato('errore')
    }
  }

  useEffect(() => { aggiorna() }, [])

  const gruppi = useMemo(() => {
    const q = normalizza(cerca.trim())
    const lista = (dati?.portali || []).filter(
      (p) => !q || normalizza(`${p.nome} ${p.descrizione} ${p.url} ${p.sezione}`).includes(q),
    )
    return raggruppa(lista)
  }, [dati, cerca])

  const totale = dati?.portali?.length || 0
  let indice = 0

  return (
    <div className="mx-auto flex min-h-full max-w-5xl flex-col px-4 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6">
      <header className="mb-5 mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-bordeaux">Studio CAI · uso interno</p>
          <h1 className="mt-1 font-display text-[2.4rem] font-bold leading-none tracking-tight">Portali</h1>
        </div>
        <p className="text-xs text-inchiostro/50" role="status">
          {stato === 'attesa' && (dati ? 'Aggiorno l’elenco…' : 'Carico l’elenco…')}
          {stato === 'pronto' && `${totale} portali · aggiornato ${oraBreve(dati?.aggiornato)}`}
        </p>
      </header>

      {stato === 'errore' && (
        <div className="mb-4 rounded-xl bg-errore-soft px-4 py-3 text-sm text-errore" role="alert">
          {dati ? `Elenco non aggiornato (${errore}): mostro la copia del ${oraBreve(dati.aggiornato)}.` : `Elenco non disponibile: ${errore}`}
          <button onClick={aggiorna} className="ml-2 font-bold underline">Riprova</button>
        </div>
      )}

      {totale > 0 && (
        <label className="mb-6 flex items-center gap-2 rounded-2xl bg-carta px-4 py-3 ring-1 ring-inchiostro/10 focus-within:ring-2 focus-within:ring-bordeaux/40">
          <svg className="h-5 w-5 text-inchiostro/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input
            type="search"
            value={cerca}
            onChange={(e) => setCerca(e.target.value)}
            placeholder="Cerca un portale"
            className="w-full bg-transparent text-base outline-none placeholder:text-inchiostro/40"
          />
        </label>
      )}

      {!dati && stato === 'attesa' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-[5.5rem] animate-pulse rounded-2xl bg-carta" />)}
        </div>
      )}

      <div className="flex flex-col gap-8">
        {gruppi.map(({ sezione, lista }) => (
          <section key={sezione}>
            <h2 className="mb-3 flex items-baseline gap-2 font-display text-xl font-bold text-bordeaux">
              {sezione}
              <span className="font-sans text-xs font-semibold text-inchiostro/40">{lista.length}</span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {lista.map((p) => <Scheda key={p.id} portale={p} indice={indice++} />)}
            </div>
          </section>
        ))}
        {dati && cerca && gruppi.length === 0 && (
          <p className="rounded-xl bg-carta px-4 py-3 text-sm text-inchiostro/60">Nessun portale per “{cerca}”.</p>
        )}
      </div>

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-10 text-xs text-inchiostro/45">
        <a href={AIRTABLE_ELENCO} target="_blank" rel="noopener noreferrer" className="font-semibold text-bordeaux underline underline-offset-2">
          Aggiungi o modifica portali
        </a>
        <span>v{APP_VERSION}</span>
      </footer>
    </div>
  )
}
