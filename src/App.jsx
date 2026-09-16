import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { caricaElenco, registraUscita, registraRientro } from './api.js'
import { APP_VERSION } from './config.js'
import Home from './components/Home.jsx'
import SceltaCondominio from './components/SceltaCondominio.jsx'
import SceltaNome from './components/SceltaNome.jsx'
import ConfermaRientro from './components/ConfermaRientro.jsx'
import Esito from './components/Esito.jsx'

export default function App() {
  const [dati, setDati] = useState({ chiavi: [], nominativi: [] })
  const [caricamento, setCaricamento] = useState('attesa') // attesa | pronto | errore
  const [schermata, setSchermata] = useState('home')
  const [scelta, setScelta] = useState(null)
  const [invio, setInvio] = useState(null) // { stato, tipo, esegui, messaggio, dettaglio }

  const ricarica = useCallback(async () => {
    setCaricamento('attesa')
    try {
      setDati(await caricaElenco())
      setCaricamento('pronto')
    } catch {
      setCaricamento('errore')
    }
  }, [])

  useEffect(() => { ricarica() }, [ricarica])

  const tornaHome = () => {
    setScelta(null)
    setInvio(null)
    setSchermata('home')
  }

  const esegui = async (tipo, azione, dettaglio) => {
    setSchermata('invio')
    setInvio({ stato: 'attesa', tipo, azione, dettaglio })
    try {
      await azione()
      setInvio({ stato: 'ok', tipo, azione, dettaglio })
      ricarica()
    } catch (e) {
      setInvio({ stato: 'errore', tipo, azione, dettaglio, messaggio: e.message })
    }
  }

  const confermaUscita = (nome) =>
    esegui('uscita', () => registraUscita(scelta.id, nome), { condominio: scelta.condominio, nome })

  const confermaRientro = () =>
    esegui('rientro', () => registraRientro(scelta.id), { condominio: scelta.condominio, nome: scelta.detentore })

  const fuori = dati.chiavi.filter((c) => c.fuori)

  return (
    <div className="mx-auto flex min-h-full max-w-md flex-col px-5 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <AnimatePresence mode="wait">
        {schermata === 'home' && (
          <Home
            key="home"
            caricamento={caricamento}
            nFuori={fuori.length}
            onPrendo={() => setSchermata('prendo-condominio')}
            onRiporto={() => setSchermata('riporto')}
            onRiprova={ricarica}
          />
        )}
        {schermata === 'prendo-condominio' && (
          <SceltaCondominio
            key="pc"
            titolo="Quali chiavi prendi?"
            elenco={dati.chiavi}
            vuoto="Nessun condominio trovato con questo nome."
            onIndietro={tornaHome}
            onScegli={(c) => { setScelta(c); setSchermata('prendo-nome') }}
          />
        )}
        {schermata === 'prendo-nome' && scelta && (
          <SceltaNome
            key="pn"
            chiave={scelta}
            nominativi={dati.nominativi}
            onIndietro={() => setSchermata('prendo-condominio')}
            onConferma={confermaUscita}
          />
        )}
        {schermata === 'riporto' && (
          <SceltaCondominio
            key="r"
            titolo="Quali chiavi riporti?"
            elenco={fuori}
            soloFuori
            vuoto={fuori.length ? 'Nessun mazzo fuori con questo nome.' : 'Tutte le chiavi risultano in studio.'}
            onIndietro={tornaHome}
            onScegli={(c) => { setScelta(c); setSchermata('riporto-conferma') }}
          />
        )}
        {schermata === 'riporto-conferma' && scelta && (
          <ConfermaRientro
            key="rc"
            chiave={scelta}
            onIndietro={() => setSchermata('riporto')}
            onConferma={confermaRientro}
          />
        )}
        {schermata === 'invio' && invio && (
          <Esito
            key="es"
            invio={invio}
            onRiprova={() => esegui(invio.tipo, invio.azione, invio.dettaglio)}
            onFatto={tornaHome}
          />
        )}
      </AnimatePresence>
      <p className="mt-auto pt-8 text-center text-xs text-inchiostro/40">Studio CAI · Registro Chiavi v{APP_VERSION}</p>
    </div>
  )
}
