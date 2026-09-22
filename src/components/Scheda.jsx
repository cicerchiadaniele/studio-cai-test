import { motion } from 'framer-motion'
import { dominio } from '../api.js'

export default function Scheda({ portale, indice }) {
  const { nome, url, descrizione, icona } = portale
  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, delay: Math.min(indice, 10) * 0.02 }}
      className="group flex min-w-0 items-center gap-4 rounded-2xl bg-carta p-4 shadow-[0_1px_0_rgba(42,31,34,0.06)] ring-1 ring-inchiostro/5 transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_-14px_rgba(139,21,56,0.45)] hover:ring-bordeaux/25 active:scale-[0.99]"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-bordeaux-soft text-2xl" aria-hidden="true">
        {icona || <span className="font-display text-xl font-bold text-bordeaux">{nome.charAt(0)}</span>}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold leading-tight">{nome}</span>
        {descrizione && <span className="mt-0.5 block text-sm leading-snug text-inchiostro/65">{descrizione}</span>}
        <span className="mt-1 block truncate text-xs text-inchiostro/40">{dominio(url)}</span>
      </span>
      <svg className="h-5 w-5 shrink-0 text-bordeaux/40 transition group-hover:translate-x-0.5 group-hover:text-bordeaux" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M7 17 17 7M9 7h8v8" />
      </svg>
    </motion.a>
  )
}
