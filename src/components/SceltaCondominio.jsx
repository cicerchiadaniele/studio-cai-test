import { useMemo, useState } from 'react'
import Schermata, { Indietro } from './Schermata.jsx'
import { giorniFuori, normalizza } from '../api.js'
import { GIORNI_AVVISO } from '../config.js'

export default function SceltaCondominio({ titolo, elenco, soloFuori = false, vuoto, onIndietro, onScegli }) {
  const [q, setQ] = useState('')
  const filtrati = useMemo(() => {
    const n = normalizza(q)
    return n ? elenco.filter((c) => normalizza(c.condominio).includes(n)) : elenco
  }, [q, elenco])

  return (
    <Schermata>
      <Indietro onClick={onIndietro} />
      <h2 className="font-display text-3xl font-bold leading-tight">{titolo}</h2>

      <label className="mt-5 block">
        <span className="sr-only">Cerca condominio</span>
        <input
          autoFocus={!soloFuori}
          type="search"
          inputMode="search"
          autoComplete="off"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Scrivi la via, es. rua"
          className="w-full rounded-2xl border-2 border-inchiostro/10 bg-carta px-4 py-4 text-lg outline-none placeholder:text-inchiostro/35 focus:border-bordeaux"
        />
      </label>

      <ul className="mt-4 flex flex-col gap-2">
        {filtrati.map((c) => {
          const gg = giorniFuori(c.uscita)
          const ritardo = c.fuori && gg >= GIORNI_AVVISO
          return (
            <li key={c.id}>
              <button
                onClick={() => onScegli(c)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl bg-carta px-4 py-4 text-left transition active:bg-bordeaux-soft"
              >
                <span className="text-[1.05rem] font-semibold">{c.condominio}</span>
                {c.fuori && (
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${ritardo ? 'bg-errore-soft text-errore' : 'bg-ottone-soft text-[#7A5A22]'}`}>
                    {soloFuori ? `${c.detentore || 'fuori'} · ${gg} gg` : 'Fuori'}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
      {filtrati.length === 0 && <p className="mt-6 text-center text-inchiostro/60">{vuoto}</p>}
    </Schermata>
  )
}
