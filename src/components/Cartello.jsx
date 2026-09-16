import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

// Cartello A4 da stampare e affiggere vicino alle chiavi: /cartello
export default function Cartello() {
  const url = window.location.origin + '/'
  const [src, setSrc] = useState('')

  useEffect(() => {
    QRCode.toDataURL(url, { width: 900, margin: 1, color: { dark: '#2A1F22', light: '#FFFFFF' }, errorCorrectionLevel: 'M' })
      .then(setSrc)
  }, [url])

  return (
    <div className="mx-auto flex min-h-full max-w-[210mm] flex-col items-center bg-white px-10 py-12 text-center">
      <p className="text-lg font-semibold text-bordeaux">Studio CAI</p>
      <h1 className="mt-2 font-display text-6xl font-bold leading-none">Registro chiavi</h1>
      <p className="mt-6 max-w-md text-2xl leading-snug">
        Prendi o riporti un mazzo? Inquadra il codice e registralo: bastano pochi secondi.
      </p>
      {src && <img src={src} alt={`Codice QR per ${url}`} className="mt-10 w-[120mm] max-w-full" />}
      <p className="mt-6 text-lg text-inchiostro/70">{url.replace(/^https?:\/\//, '').replace(/\/$/, '')}</p>
      <button onClick={() => window.print()} className="mt-10 rounded-2xl bg-bordeaux px-8 py-4 text-lg font-bold text-white print:hidden">
        Stampa il cartello
      </button>
    </div>
  )
}
