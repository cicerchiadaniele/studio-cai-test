import { motion } from 'framer-motion'
import Schermata from './Schermata.jsx'

function Cartellino({ titolo, riga1, riga2 }) {
  // Il cartellino portachiavi: l'elemento che conferma, oscilla una volta appeso all'anello.
  return (
    <motion.div
      initial={{ rotate: -14, y: -20, opacity: 0 }}
      animate={{ rotate: [-14, 8, -4, 0], y: 0, opacity: 1 }}
      transition={{ duration: 0.9, ease: 'easeOut' }}
      style={{ transformOrigin: '50% 0%' }}
      className="mx-auto mt-2 flex w-64 flex-col items-center"
    >
      <div className="h-9 w-9 rounded-full border-[5px] border-ottone" />
      <div className="-mt-1 h-5 w-[3px] bg-ottone" />
      <div className="relative w-full rounded-[1.5rem] rounded-t-[3rem] bg-ottone-soft px-6 pb-7 pt-10 text-center shadow-[0_14px_30px_-14px_rgba(122,90,34,0.55)] ring-2 ring-ottone/60">
        <div className="absolute left-1/2 top-4 h-4 w-4 -translate-x-1/2 rounded-full bg-crema ring-2 ring-ottone/60" />
        <svg viewBox="0 0 24 24" className="mx-auto h-12 w-12 text-verde" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M7.5 12.5l3 3 6-6.5" />
        </svg>
        <p className="mt-3 font-display text-2xl font-bold leading-tight text-inchiostro">{titolo}</p>
        <p className="mt-2 text-base font-semibold text-inchiostro">{riga1}</p>
        {riga2 && <p className="mt-1 text-sm text-inchiostro/70">{riga2}</p>}
      </div>
    </motion.div>
  )
}

export default function Esito({ invio, onRiprova, onFatto }) {
  const { stato, tipo, dettaglio, messaggio } = invio
  const ora = new Date().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  if (stato === 'attesa') {
    return (
      <Schermata className="items-center justify-center text-center">
        <div className="h-14 w-14 animate-spin rounded-full border-[5px] border-bordeaux/20 border-t-bordeaux" aria-hidden="true" />
        <p className="mt-6 font-display text-2xl font-bold" role="status">Registrazione in corso</p>
        <p className="mt-2 text-inchiostro/60">{dettaglio.condominio} – attendi la conferma, non chiudere la pagina.</p>
      </Schermata>
    )
  }

  if (stato === 'errore') {
    return (
      <Schermata className="justify-center">
        <div className="rounded-3xl bg-errore-soft p-6" role="alert">
          <p className="font-display text-2xl font-bold text-errore">Operazione non registrata</p>
          <p className="mt-2 text-inchiostro">{messaggio}</p>
          <p className="mt-2 text-sm text-inchiostro/70">
            {tipo === 'uscita' ? 'L’uscita' : 'Il rientro'} di <strong>{dettaglio.condominio}</strong> non risulta nel registro. Riprova; se l’errore continua, avvisa lo studio.
          </p>
        </div>
        <button onClick={onRiprova} className="mt-6 w-full rounded-2xl bg-bordeaux py-5 text-lg font-bold text-white active:scale-[0.98]">
          Riprova
        </button>
        <button onClick={onFatto} className="mt-3 w-full rounded-2xl py-4 font-semibold text-inchiostro/70">
          Annulla
        </button>
      </Schermata>
    )
  }

  return (
    <Schermata className="justify-center">
      {tipo === 'uscita' ? (
        <Cartellino titolo="Uscita registrata" riga1={dettaglio.condominio} riga2={`${dettaglio.nome} · ${ora}`} />
      ) : (
        <Cartellino titolo="Chiavi rientrate" riga1={dettaglio.condominio} riga2={`Registrato il ${ora}`} />
      )}
      <button onClick={onFatto} className="mt-10 w-full rounded-2xl bg-bordeaux py-5 text-lg font-bold text-white active:scale-[0.98]">
        Fatto
      </button>
    </Schermata>
  )
}
