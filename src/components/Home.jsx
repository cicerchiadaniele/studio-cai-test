import Schermata from './Schermata.jsx'

function Chiave({ className }) {
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" aria-hidden="true">
      <circle cx="20" cy="32" r="11" />
      <path d="M31 32h26M49 32v9M56 32v7" />
    </svg>
  )
}

export default function Home({ caricamento, nFuori, onPrendo, onRiporto, onRiprova }) {
  const pronto = caricamento === 'pronto'
  return (
    <Schermata>
      <header className="mb-8 mt-4">
        <p className="text-sm font-semibold text-bordeaux">Studio CAI</p>
        <h1 className="mt-1 font-display text-[2.6rem] font-bold leading-[1.02] tracking-tight">
          Registro<br />chiavi
        </h1>
      </header>

      {caricamento === 'attesa' && (
        <p className="mb-4 rounded-xl bg-carta px-4 py-3 text-sm text-inchiostro/70" role="status">
          Carico l’elenco dei condomini…
        </p>
      )}
      {caricamento === 'errore' && (
        <div className="mb-4 rounded-xl bg-errore-soft px-4 py-3 text-sm text-errore" role="alert">
          Elenco non disponibile: controlla la connessione.
          <button onClick={onRiprova} className="ml-2 font-bold underline">Riprova</button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <button
          onClick={onPrendo}
          disabled={!pronto}
          className="group relative flex min-h-[9.5rem] flex-col justify-between overflow-hidden rounded-[1.75rem] bg-bordeaux p-6 text-left text-white shadow-[0_10px_30px_-12px_rgba(139,21,56,0.6)] transition active:scale-[0.98] disabled:opacity-50"
        >
          <Chiave className="absolute -right-4 -top-2 h-28 w-28 rotate-[-20deg] text-white/10" />
          <span className="text-sm font-medium text-white/80">Esce dallo studio</span>
          <span className="font-display text-3xl font-bold">Prendo le chiavi</span>
        </button>

        <button
          onClick={onRiporto}
          disabled={!pronto}
          className="flex min-h-[9.5rem] flex-col justify-between rounded-[1.75rem] border-2 border-bordeaux/25 bg-carta p-6 text-left transition active:scale-[0.98] disabled:opacity-50"
        >
          <span className="text-sm font-medium text-inchiostro/60">
            {pronto ? (nFuori === 0 ? 'Nessun mazzo fuori' : nFuori === 1 ? '1 mazzo fuori' : `${nFuori} mazzi fuori`) : 'Rientra in studio'}
          </span>
          <span className="font-display text-3xl font-bold text-bordeaux">Riporto le chiavi</span>
        </button>
      </div>
    </Schermata>
  )
}
