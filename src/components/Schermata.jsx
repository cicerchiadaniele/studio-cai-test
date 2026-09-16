import { motion } from 'framer-motion'

export default function Schermata({ children, className = '' }) {
  return (
    <motion.main
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={`flex flex-1 flex-col ${className}`}
    >
      {children}
    </motion.main>
  )
}

export function Indietro({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="-ml-2 mb-4 inline-flex w-fit items-center gap-1 rounded-lg px-2 py-2 text-sm font-semibold text-bordeaux"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
      Indietro
    </button>
  )
}
