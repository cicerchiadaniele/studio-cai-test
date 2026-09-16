import { useState } from 'react'
import Schermata, { Indietro } from './Schermata.jsx'
import { giorniFuori, pulisciNome } from '../api.js'

const CHIAVE_ULTIMO = 'registro-chiavi:ultimo-nome'

function leggiUltimo() {
  try { return localStorage.getItem(CHIAVE_ULTIMO) || '' } catch { return '' }
}

export default function SceltaNome({ chiave, nominativi, onIndietro, onConferma }) {
  const ultimo = leggiUltimo()
  const inElenco = nominativi.includes(ultimo)
  const [scelto, setScelto] = useState(inElenco ? ultimo : '')
  const [altro, setAltro] = useState(!inElenco && ultimo ? ultimo : '')
  const [modoAltro, setModoAltro] = useState(!inElenco && !!ultimo)

  const nome = pulisciNome(modoAltro ? altro : scelto)
  const valido = nome.length >= 2

  const conferma = () => {
    if (!valido) return
    try { localStorage.setItem(CHIAVE_ULTIMO, nome) } catch { /* facoltativo */ }
    onConferma(nome)
  }

  return (
    <Schermata>
      <Indietro onClick={onIndietro} />
      <p className="text-sm font-semibold text-bordeaux">{chiave.condominio}</p>
      <h2 className="font-display text-3xl font-bold leading-tight">Chi prende le chiavi?</h2>

      {chiave.fuori && (
        <p className="mt-4 rounded-xl bg-ottone-soft px-4 py-3 text-sm text-[#6B4E1C]" role="alert">
          Risulta già fuori a <strong>{chiave.detentore || 'qualcuno'}</strong> da {giorniFuori(chiave.uscita)} giorni.
          Continuando, il registro passa a te.
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2" role="radiogroup" aria-label="Nominativo">
        {nominativi.map((n) => {
          const on = !modoAltro && scelto === n
          return (
            <button
              key={n}
              role="radio"
              aria-checked={on}
              onClick={() => { setModoAltro(false); setScelto(n) }}
              className={`rounded-full border-2 px-4 py-3 text-base font-semibold transition ${on ? 'border-bordeaux bg-bordeaux text-white' : 'border-inchiostro/10 bg-carta'}`}
            >
              {n}
            </button>
          )
        })}
        <button
          role="radio"
          aria-checked={modoAltro}
          onClick={() => setModoAltro(true)}
          className={`rounded-full border-2 px-4 py-3 text-base font-semibold transition ${modoAltro ? 'border-bordeaux bg-bordeaux text-white' : 'border-dashed border-inchiostro/25 bg-transparent'}`}
        >
          Altro nome
        </button>
      </div>

      {modoAltro && (
        <label className="mt-4 block">
          <span className="mb-1 block text-sm font-medium text-inchiostro/70">Nome e cognome o ditta</span>
          <input
            autoFocus
            value={altro}
            maxLength={60}
            onChange={(e) => setAltro(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && conferma()}
            placeholder="es. Mario Rossi – idraulico"
            className="w-full rounded-2xl border-2 border-inchiostro/10 bg-carta px-4 py-4 text-lg outline-none placeholder:text-inchiostro/35 focus:border-bordeaux"
          />
        </label>
      )}

      <button
        onClick={conferma}
        disabled={!valido}
        className="mt-8 w-full rounded-2xl bg-bordeaux py-5 text-lg font-bold text-white transition active:scale-[0.98] disabled:bg-inchiostro/15 disabled:text-inchiostro/40"
      >
        Registra uscita
      </button>
    </Schermata>
  )
}
