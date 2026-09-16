import Schermata, { Indietro } from './Schermata.jsx'
import { giorniFuori } from '../api.js'

export default function ConfermaRientro({ chiave, onIndietro, onConferma }) {
  const gg = giorniFuori(chiave.uscita)
  const uscita = chiave.uscita
    ? new Date(chiave.uscita).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : '—'
  return (
    <Schermata>
      <Indietro onClick={onIndietro} />
      <p className="text-sm font-semibold text-bordeaux">Rientro in studio</p>
      <h2 className="font-display text-3xl font-bold leading-tight">{chiave.condominio}</h2>

      <dl className="mt-6 grid grid-cols-[auto,1fr] gap-x-6 gap-y-3 rounded-2xl bg-carta p-5 text-base">
        <dt className="text-inchiostro/60">Preso da</dt>
        <dd className="font-semibold">{chiave.detentore || '—'}</dd>
        <dt className="text-inchiostro/60">Uscito il</dt>
        <dd className="font-semibold">{uscita}</dd>
        <dt className="text-inchiostro/60">Fuori da</dt>
        <dd className="font-semibold">{gg === 1 ? '1 giorno' : `${gg} giorni`}</dd>
      </dl>

      <button
        onClick={onConferma}
        className="mt-8 w-full rounded-2xl bg-bordeaux py-5 text-lg font-bold text-white transition active:scale-[0.98]"
      >
        Registra rientro
      </button>
    </Schermata>
  )
}
