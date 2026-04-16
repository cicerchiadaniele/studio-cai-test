import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, CheckCircle2, AlertCircle, Building2, Phone, Shield, Loader2,
  ChevronDown, X, Info, FileText, User, MapPin, Sparkles, Lock,
  Hash, Home, Users, Droplets, AlertTriangle, Copy, ClipboardCheck
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Build constants
// ─────────────────────────────────────────────────────────────
const APP_VERSION = "1.0";
const BUILD_DATE_LABEL = "16/04/2026";
const WEBHOOK_URL = "https://hook.eu1.make.com/8ev6ie7xhf38wwkkrgh01tkebrdxgn78";
const BRAND_NAME = "Studio CAI – App Sinistri";
const LOGO_URL = "/logo.jpg";
const PRIMARY_COLOR = "#15803d";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const cn = (...cls) => cls.filter(Boolean).join(" ");

// Sanitizzatori — bloccano simboli non ammessi già al momento della digitazione
const sanitizers = {
  // Indirizzo condominio: lettere (anche accentate), numeri, spazi, virgola, punto, apostrofo, trattino
  condominio: (v) => v.replace(/[^\p{L}\p{N}\s.,'-]/gu, ""),
  // Causa del danno: frase libera ma senza simboli strani — lettere, numeri, spazi, punteggiatura base
  causa: (v) => v.replace(/[^\p{L}\p{N}\s.,'-]/gu, ""),
  // Punto/componente guasto: stesso set della causa
  punto: (v) => v.replace(/[^\p{L}\p{N}\s.,'-]/gu, ""),
  // Ubicazione (es. terrazzo, balcone, bagno): solo lettere, spazi, apostrofo, trattino
  ubicazione: (v) => v.replace(/[^\p{L}\s'-]/gu, ""),
  // Tipo di conseguenza (es. infiltrazioni, allagamento): solo lettere e spazi
  conseguenza: (v) => v.replace(/[^\p{L}\s'-]/gu, ""),
  // Interno: solo alfanumerico (es. "8", "8A", "12bis")
  interno: (v) => v.replace(/[^\p{L}\p{N}]/gu, ""),
  // Nome e cognome: lettere, spazi, apostrofo, trattino (consente D'Angelo, De-Luca, accenti)
  nome: (v) => v.replace(/[^\p{L}\s'-]/gu, ""),
  // Telefono: solo cifre, spazi e "+"
  telefono: (v) => v.replace(/[^\d\s+]/g, ""),
};

// ─────────────────────────────────────────────────────────────
// Opzioni guidate per i campi a scelta — pensate per sinistri da infiltrazione
// ─────────────────────────────────────────────────────────────
const OPZIONI_CAUSA = [
  "rottura accidentale",
  "rottura improvvisa",
  "cedimento strutturale",
  "distacco accidentale",
  "guasto accidentale",
  "occlusione accidentale",
  "infiltrazione di acqua piovana",
  "altra causa (specifica)"
];

const OPZIONI_UBICAZIONE = [
  "terrazzo",
  "balcone",
  "bagno",
  "cucina",
  "lavanderia",
  "cantina",
  "box",
  "sottotetto",
  "parti comuni",
  "altro (specifica)"
];

const OPZIONI_CONSEGUENZA = [
  "infiltrazioni",
  "allagamento",
  "infiltrazioni ed allagamenti",
  "macchie di umidità",
  "danni da percolazione",
  "altro (specifica)"
];

const OPZIONI_TITOLO = ["Sig.", "Sig.ra", "Sig.ri"];

// ─────────────────────────────────────────────────────────────
// Tabelle di concordanza grammaticale italiana
// Permettono di scegliere l'articolo corretto in base a genere e iniziale
// ─────────────────────────────────────────────────────────────
const GENERE_CAUSA = {
  "rottura accidentale": "f",
  "rottura improvvisa": "f",
  "cedimento strutturale": "m",
  "distacco accidentale": "m",
  "guasto accidentale": "m",
  "occlusione accidentale": "f",
  "infiltrazione di acqua piovana": "f"
};

const GENERE_CONSEGUENZA = {
  "infiltrazioni": { genere: "f", numero: "p" },
  "allagamento": { genere: "m", numero: "s" },
  "infiltrazioni ed allagamenti": { genere: "f", numero: "p" },
  "macchie di umidità": { genere: "f", numero: "p" },
  "danni da percolazione": { genere: "m", numero: "p" }
};

const GENERE_UBICAZIONE = {
  // "prep" indica la preposizione da usare: "sul/sulla" per superfici esterne,
  // "in" per stanze interne, "nelle" per parti comuni
  "terrazzo": { genere: "m", prep: "su" },
  "balcone": { genere: "m", prep: "su" },
  "bagno": { genere: "m", prep: "in" },
  "cucina": { genere: "f", prep: "in" },
  "lavanderia": { genere: "f", prep: "in" },
  "cantina": { genere: "f", prep: "in" },
  "box": { genere: "m", prep: "in" },
  "sottotetto": { genere: "m", prep: "nel" },
  "parti comuni": { genere: "f", prep: "nelle" },
  "vano scala": { genere: "m", prep: "nel" }
};

// Articolo determinativo "la/il/l'" in base a genere e iniziale della parola
function articoloDet(parola, genereHint) {
  if (!parola) return "";
  const p = parola.toLowerCase().trim();
  const inizioVocale = /^[aeiouàèéìòù]/.test(p);
  if (inizioVocale) return "dell'";
  return genereHint === "f" ? "della " : "del ";
}

// Preposizione articolata corretta per ogni tipo di ubicazione
function preposizioneUbicazione(ubicazione) {
  if (!ubicazione) return "sul";
  const u = ubicazione.toLowerCase().trim();
  const info = GENERE_UBICAZIONE[u];

  // Parti comuni
  if (info?.prep === "nelle" || u.startsWith("parti")) return "nelle";
  // Vano scala, sottotetto → "nel" / "nell'"
  if (info?.prep === "nel") {
    return /^[aeiouàèéìòù]/.test(u) ? "nell'" : "nel";
  }
  // Stanze interne (bagno, cucina, cantina, box...) → "in" semplice
  if (info?.prep === "in") return "in";
  // Superfici esterne (terrazzo, balcone) → "su"
  if (info?.prep === "su") {
    if (/^[aeiouàèéìòù]/.test(u)) return "sull'";
    return info.genere === "f" ? "sulla" : "sul";
  }
  // Fallback intelligente per ubicazioni libere scritte dall'utente
  if (/^[aeiouàèéìòù]/.test(u)) return "sull'";
  // Heuristica: le parole che finiscono in -a sono probabilmente femminili
  if (/a$/.test(u)) return "sulla";
  return "sul";
}

// Verbo + articolo per la conseguenza.
// Restituisce anche il numero grammaticale, per concordare il verbo successivo
// ("che ha danneggiato" vs "che hanno danneggiato").
function frammentoConseguenza(conseguenza) {
  if (!conseguenza) return { frase: "", numero: "p" };
  const c = conseguenza.toLowerCase().trim();
  const info = GENERE_CONSEGUENZA[c];
  if (info) {
    if (info.numero === "p") {
      if (info.genere === "f") return { frase: `si sono verificate delle ${conseguenza}`, numero: "p" };
      return { frase: `si sono verificati dei ${conseguenza}`, numero: "p" };
    } else {
      if (info.genere === "f") return { frase: `si è verificata una ${conseguenza}`, numero: "s" };
      const iniziale = c.charAt(0);
      const articoloIndet = /^[aeiou]/.test(iniziale) ? "un" :
                            (iniziale === "z" || /^s[bcdfglmnpqrstvz]/.test(c)) ? "uno" : "un";
      return { frase: `si è verificato ${articoloIndet} ${conseguenza}`, numero: "s" };
    }
  }
  // Default: se plurale (finisce in i/e di solito) → plurale, altrimenti singolare
  const probabilmentePlurale = /i$|e$/.test(c) && !c.endsWith("zione") && !c.endsWith("sione");
  if (probabilmentePlurale) {
    return { frase: `si sono verificati/e dei/delle ${conseguenza}`, numero: "p" };
  }
  return { frase: `si è verificato/a un/una ${conseguenza}`, numero: "s" };
}

// Articolo per il titolo (Sig./Sig.ra/Sig.ri) → del/della/dei
function articoloTitolo(titolo) {
  if (titolo === "Sig.ra") return "della";
  if (titolo === "Sig.ri") return "dei";
  return "del";
}

// ─────────────────────────────────────────────────────────────
// Generatore testo finale — compone la frase nello stile richiesto
// ─────────────────────────────────────────────────────────────
function generaTesto(f) {
  // Pulizia e fallback
  const v = (x) => (x || "").trim();

  const causa = v(f.causaLibera) || v(f.causa);
  const punto = v(f.punto);
  const ubicazione = v(f.ubicazioneLibera) || v(f.ubicazione);
  const conseguenza = v(f.conseguenzaLibera) || v(f.conseguenza);

  const intDann = v(f.internoDanneggiante);
  const titDann = v(f.titoloDanneggiante) || "Sig.";
  const nomeDann = v(f.nomeDanneggiante);
  const telDann = v(f.telefonoDanneggiante);

  const intDato = v(f.internoDanneggiato);
  const titDato = v(f.titoloDanneggiato) || "Sig.";
  const nomeDato = v(f.nomeDanneggiato);
  const telDato = v(f.telefonoDanneggiato);

  // Se manca il minimo indispensabile → anteprima vuota
  const essenziali = [causa, punto, ubicazione, conseguenza, intDann, nomeDann, intDato, nomeDato];
  if (essenziali.some((x) => !x)) return "";

  // Calcolo articoli e concordanze
  const artCausa = articoloDet(causa, GENERE_CAUSA[causa.toLowerCase()] || "f");
  const prepUbi = preposizioneUbicazione(ubicazione);
  const consInfo = frammentoConseguenza(conseguenza);
  const verboDanneggiare = consInfo.numero === "s" ? "ha danneggiato" : "hanno danneggiato";
  const artTitDann = articoloTitolo(titDann);
  const artTitDato = articoloTitolo(titDato);

  // Costruzione frase
  const testo =
    `A causa ${artCausa}${causa} nel punto di ${punto} ubicato ` +
    `${prepUbi} ${ubicazione} dell'appartamento interno ${intDann} di proprietà ` +
    `${artTitDann} ${titDann} ${nomeDann}` +
    `${telDann ? " tel. " + telDann.replace(/\s+/g, "") : ""} ` +
    `${consInfo.frase} che ${verboDanneggiare} il sottostante ` +
    `appartamento interno ${intDato} di proprietà ${artTitDato} ${titDato} ${nomeDato}` +
    `${telDato ? " tel. " + telDato.replace(/\s+/g, "") : ""}.`;

  // Prefisso opzionale con indirizzo condominio
  const condo = v(f.condominio);
  if (condo) {
    return `Presso il condominio sito in ${condo}, ` + testo.charAt(0).toLowerCase() + testo.slice(1);
  }
  return testo;
}

// ─────────────────────────────────────────────────────────────
// Componente principale
// ─────────────────────────────────────────────────────────────
export default function AppSinistri() {
  const [form, setForm] = useState({
    condominio: "",
    // Dinamica del sinistro
    causa: "",
    causaLibera: "",
    punto: "",
    ubicazione: "",
    ubicazioneLibera: "",
    conseguenza: "",
    conseguenzaLibera: "",
    // Danneggiante (sopra)
    internoDanneggiante: "",
    titoloDanneggiante: "Sig.",
    nomeDanneggiante: "",
    telefonoDanneggiante: "",
    // Danneggiato (sotto)
    internoDanneggiato: "",
    titoloDanneggiato: "Sig.",
    nomeDanneggiato: "",
    telefonoDanneggiato: "",
    // Consenso
    consenso: false,
  });

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  const [touched, setTouched] = useState({});
  const [showInfo, setShowInfo] = useState(false);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (!cooldown) return;
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  React.useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const cssVars = useMemo(() => ({ "--brand": PRIMARY_COLOR }), []);

  // Aggiornamento con sanificazione automatica
  const update = (k, v) => {
    const clean = sanitizers[k] ? sanitizers[k](v) : v;
    setForm((s) => ({ ...s, [k]: clean }));
    setTouched((t) => ({ ...t, [k]: true }));
  };

  // Aggiornamento diretto (per campi select e checkbox — nessuna sanitizzazione)
  const updateRaw = (k, v) => {
    setForm((s) => ({ ...s, [k]: v }));
    setTouched((t) => ({ ...t, [k]: true }));
  };

  // Anteprima live
  const anteprima = useMemo(() => generaTesto(form), [form]);

  const getFieldError = (field) => {
    if (!touched[field]) return null;
    switch (field) {
      case "condominio":
        return !form.condominio ? "Campo obbligatorio" : null;
      case "causa":
        return !form.causa ? "Seleziona la causa" : null;
      case "causaLibera":
        return form.causa === "altra causa (specifica)" && !form.causaLibera
          ? "Specifica la causa" : null;
      case "punto":
        return !form.punto ? "Campo obbligatorio" :
               form.punto.trim().length < 3 ? "Descrizione troppo breve" : null;
      case "ubicazione":
        return !form.ubicazione ? "Seleziona l'ubicazione" : null;
      case "ubicazioneLibera":
        return form.ubicazione === "altro (specifica)" && !form.ubicazioneLibera
          ? "Specifica l'ubicazione" : null;
      case "conseguenza":
        return !form.conseguenza ? "Seleziona la conseguenza" : null;
      case "conseguenzaLibera":
        return form.conseguenza === "altro (specifica)" && !form.conseguenzaLibera
          ? "Specifica la conseguenza" : null;
      case "internoDanneggiante":
        return !form.internoDanneggiante ? "Campo obbligatorio" : null;
      case "nomeDanneggiante":
        return !form.nomeDanneggiante ? "Campo obbligatorio" :
               form.nomeDanneggiante.trim().length < 2 ? "Nome troppo breve" : null;
      case "telefonoDanneggiante":
        return form.telefonoDanneggiante && form.telefonoDanneggiante.replace(/\D/g, "").length < 6
          ? "Numero troppo breve" : null;
      case "internoDanneggiato":
        return !form.internoDanneggiato ? "Campo obbligatorio" : null;
      case "nomeDanneggiato":
        return !form.nomeDanneggiato ? "Campo obbligatorio" :
               form.nomeDanneggiato.trim().length < 2 ? "Nome troppo breve" : null;
      case "telefonoDanneggiato":
        return form.telefonoDanneggiato && form.telefonoDanneggiato.replace(/\D/g, "").length < 6
          ? "Numero troppo breve" : null;
      default:
        return null;
    }
  };

  const validate = () => {
    const errs = [];
    if (!form.condominio) errs.push("Indica il condominio");
    if (!form.causa) errs.push("Seleziona la causa del danno");
    if (form.causa === "altra causa (specifica)" && !form.causaLibera)
      errs.push("Specifica la causa del danno");
    if (!form.punto || form.punto.trim().length < 3) errs.push("Descrivi il punto/componente interessato");
    if (!form.ubicazione) errs.push("Seleziona l'ubicazione del punto");
    if (form.ubicazione === "altro (specifica)" && !form.ubicazioneLibera)
      errs.push("Specifica l'ubicazione");
    if (!form.conseguenza) errs.push("Seleziona il tipo di conseguenza");
    if (form.conseguenza === "altro (specifica)" && !form.conseguenzaLibera)
      errs.push("Specifica la conseguenza");
    if (!form.internoDanneggiante) errs.push("Indica l'interno del danneggiante");
    if (!form.nomeDanneggiante) errs.push("Indica il nome del proprietario danneggiante");
    if (form.telefonoDanneggiante && form.telefonoDanneggiante.replace(/\D/g, "").length < 6)
      errs.push("Telefono danneggiante non valido");
    if (!form.internoDanneggiato) errs.push("Indica l'interno del danneggiato");
    if (!form.nomeDanneggiato) errs.push("Indica il nome del proprietario danneggiato");
    if (form.telefonoDanneggiato && form.telefonoDanneggiato.replace(/\D/g, "").length < 6)
      errs.push("Telefono danneggiato non valido");
    if (!form.consenso) errs.push("Accetta l'informativa privacy");
    return errs;
  };

  const submit = async () => {
    if (cooldown) return;

    // Marca tutti come touched per mostrare eventuali errori
    const allKeys = Object.keys(form);
    setTouched(allKeys.reduce((acc, k) => ({ ...acc, [k]: true }), {}));

    const errs = validate();
    if (errs.length) {
      setResult({ ok: false, error: errs[0] });
      return;
    }

    setSending(true);
    setResult(null);
    const ticket = `SIN-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    try {
      const fd = new FormData();
      const testoFinale = generaTesto(form);

      const payload = {
        ...form,
        // Campi derivati utili per Make
        causaFinale: form.causaLibera || form.causa,
        ubicazioneFinale: form.ubicazioneLibera || form.ubicazione,
        conseguenzaFinale: form.conseguenzaLibera || form.conseguenza,
        testoFinale,
        ticket,
        timestamp: new Date().toISOString(),
        appVersion: APP_VERSION,
        tipo: "apertura_sinistro"
      };

      Object.entries(payload).forEach(([k, v]) => {
        fd.append(k, String(v));
      });

      const res = await fetch(WEBHOOK_URL, { method: "POST", body: fd });
      if (!res.ok) throw new Error(`Errore invio: ${res.status}`);

      setResult({ ok: true, ticket, testoFinale });
      setCooldown(8);

      // Reset dei campi variabili, mantiene consenso e indirizzo condominio
      setForm((s) => ({
        ...s,
        causa: "", causaLibera: "",
        punto: "",
        ubicazione: "", ubicazioneLibera: "",
        conseguenza: "", conseguenzaLibera: "",
        internoDanneggiante: "", titoloDanneggiante: "Sig.",
        nomeDanneggiante: "", telefonoDanneggiante: "",
        internoDanneggiato: "", titoloDanneggiato: "Sig.",
        nomeDanneggiato: "", telefonoDanneggiato: "",
      }));
      setTouched({});

      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setResult({ ok: false, error: e.message || "Invio non riuscito. Riprova." });
    } finally {
      setSending(false);
    }
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard?.writeText(text).then(() => setCopied(true)).catch(() => {});
  };

  return (
    <div className="relative min-h-screen w-full bg-paper bg-noise text-neutral-900" style={cssVars}>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[var(--brand)]/10 blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 rounded-full bg-emerald-300/10 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 sticky top-0 bg-white/75 backdrop-blur-xl border-b border-neutral-200/70">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-white ring-1 ring-neutral-200 shadow-soft flex items-center justify-center">
                {LOGO_URL ? (
                  <img src={LOGO_URL} alt="logo" className="w-full h-full object-contain p-1" />
                ) : (
                  <Building2 className="w-8 h-8 text-[var(--brand)]" />
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[var(--brand)] ring-2 ring-white flex items-center justify-center">
                <Droplets className="w-3 h-3 text-white" strokeWidth={3} />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-display font-semibold text-xl sm:text-2xl text-neutral-900 truncate">
                  {BRAND_NAME}
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-900 text-white tracking-wider">
                  v{APP_VERSION}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">
                Generatore testo apertura sinistro · Strumento interno
              </p>
            </div>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-2.5 rounded-xl hover:bg-neutral-100 active:bg-neutral-200 transition-colors"
              aria-label="Informazioni"
            >
              <Info className="w-5 h-5 text-neutral-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Info Panel */}
      <AnimatePresence>
        {showInfo && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-10 bg-gradient-to-b from-emerald-50 to-emerald-50/50 border-b border-emerald-200"
          >
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Info className="w-5 h-5 text-emerald-700" />
                </div>
                <div className="flex-1 text-sm">
                  <p className="font-semibold text-emerald-900 mb-1">Come funziona</p>
                  <p className="text-emerald-800/80">
                    Compila i campi guidati: l'app comporrà automaticamente il testo formale di
                    apertura sinistro, pronto da inviare alla compagnia assicurativa. Al termine
                    premi <span className="font-semibold">Invia apertura sinistro</span>: il testo
                    verrà trasmesso al flusso di gestione tramite Make.
                  </p>
                </div>
                <button onClick={() => setShowInfo(false)} className="p-1.5 hover:bg-emerald-100 rounded-lg transition-colors">
                  <X className="w-4 h-4 text-emerald-700" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero intro */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 backdrop-blur ring-1 ring-neutral-200 text-xs font-medium text-neutral-700 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[var(--brand)]" />
            Strumento guidato per l'apertura di un sinistro
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-semibold text-neutral-900 leading-[1.05] tracking-tight">
            Apri un <em className="not-italic text-[var(--brand)]">sinistro</em> in pochi passi
          </h2>
          <p className="mt-4 text-neutral-600 text-base sm:text-lg">
            Compila i campi qui sotto. L'app genererà il testo formale pronto per essere trasmesso.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-neutral-600">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white ring-1 ring-neutral-200">
              <Lock className="w-3 h-3" /> Dati protetti
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white ring-1 ring-neutral-200">
              <Hash className="w-3 h-3" /> Ticket tracciabile
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white ring-1 ring-neutral-200">
              <Shield className="w-3 h-3" /> Testo formattato
            </span>
          </div>
        </motion.div>
      </section>

      {/* Main Content */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <motion.div
          layout
          className="bg-white rounded-3xl shadow-lift overflow-hidden ring-1 ring-neutral-200/80"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Card header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[var(--brand)] via-emerald-600 to-emerald-700 px-6 sm:px-8 py-6">
            <div aria-hidden="true" className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)",
                backgroundSize: "32px 32px",
                backgroundPosition: "0 0, 16px 16px"
              }}
            />
            <div className="relative flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/25 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="font-display font-semibold text-xl sm:text-2xl text-white leading-tight">
                  Modulo di apertura sinistro
                </h2>
                <p className="text-white/85 text-sm mt-1">
                  Tutti i campi contrassegnati con <span className="font-semibold">*</span> sono obbligatori
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-8">

            {/* ─── Step 1: Condominio ─── */}
            <FormSection
              stepNumber={1}
              icon={<Home className="w-4 h-4" />}
              title="Condominio"
              description="Indirizzo del condominio dove si è verificato il sinistro"
            >
              <TextField
                label="Indirizzo condominio"
                placeholder="Es. Via Marco Polo 84"
                value={form.condominio}
                onChange={(v) => update("condominio", v)}
                icon={<MapPin className="w-4 h-4" />}
                error={getFieldError("condominio")}
                hint="Via e numero civico dello stabile"
                required
              />
            </FormSection>

            {/* ─── Step 2: Dinamica del sinistro ─── */}
            <FormSection
              stepNumber={2}
              icon={<Droplets className="w-4 h-4" />}
              title="Dinamica del sinistro"
              description="Cosa è successo e dove si trova il punto di origine"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Causa */}
                <SelectField
                  label="Causa del danno"
                  value={form.causa}
                  onChange={(v) => {
                    updateRaw("causa", v);
                    if (v !== "altra causa (specifica)") updateRaw("causaLibera", "");
                  }}
                  options={OPZIONI_CAUSA}
                  error={getFieldError("causa")}
                  required
                />
                {form.causa === "altra causa (specifica)" ? (
                  <TextField
                    label="Specifica la causa"
                    placeholder="Es. rottura per gelo"
                    value={form.causaLibera}
                    onChange={(v) => update("causaLibera", v)}
                    error={getFieldError("causaLibera")}
                    required
                  />
                ) : <div className="hidden sm:block" />}

                {/* Punto */}
                <div className="sm:col-span-2">
                  <TextField
                    label="Punto/componente interessato"
                    placeholder="Es. saldatura tra tubazione e conversa in piombo del bocchettone"
                    value={form.punto}
                    onChange={(v) => update("punto", v)}
                    error={getFieldError("punto")}
                    hint="Descrivi con precisione il componente o il punto in cui si è verificato il guasto"
                    required
                  />
                </div>

                {/* Ubicazione */}
                <SelectField
                  label="Ubicazione del punto"
                  value={form.ubicazione}
                  onChange={(v) => {
                    updateRaw("ubicazione", v);
                    if (v !== "altro (specifica)") updateRaw("ubicazioneLibera", "");
                  }}
                  options={OPZIONI_UBICAZIONE}
                  error={getFieldError("ubicazione")}
                  required
                />
                {form.ubicazione === "altro (specifica)" ? (
                  <TextField
                    label="Specifica l'ubicazione"
                    placeholder="Es. vano scala"
                    value={form.ubicazioneLibera}
                    onChange={(v) => update("ubicazioneLibera", v)}
                    error={getFieldError("ubicazioneLibera")}
                    required
                  />
                ) : <div className="hidden sm:block" />}

                {/* Conseguenza */}
                <SelectField
                  label="Tipo di conseguenza"
                  value={form.conseguenza}
                  onChange={(v) => {
                    updateRaw("conseguenza", v);
                    if (v !== "altro (specifica)") updateRaw("conseguenzaLibera", "");
                  }}
                  options={OPZIONI_CONSEGUENZA}
                  error={getFieldError("conseguenza")}
                  required
                />
                {form.conseguenza === "altro (specifica)" ? (
                  <TextField
                    label="Specifica la conseguenza"
                    placeholder="Es. formazione di muffa"
                    value={form.conseguenzaLibera}
                    onChange={(v) => update("conseguenzaLibera", v)}
                    error={getFieldError("conseguenzaLibera")}
                    required
                  />
                ) : <div className="hidden sm:block" />}
              </div>
            </FormSection>

            {/* ─── Step 3: Unità danneggiante (quella da cui parte il danno) ─── */}
            <FormSection
              stepNumber={3}
              icon={<Users className="w-4 h-4" />}
              title="Unità danneggiante"
              description="L'appartamento da cui ha avuto origine il danno"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField
                  label="Interno"
                  placeholder="Es. 8"
                  value={form.internoDanneggiante}
                  onChange={(v) => update("internoDanneggiante", v)}
                  icon={<Hash className="w-4 h-4" />}
                  error={getFieldError("internoDanneggiante")}
                  required
                />
                <SelectField
                  label="Titolo"
                  value={form.titoloDanneggiante}
                  onChange={(v) => updateRaw("titoloDanneggiante", v)}
                  options={OPZIONI_TITOLO}
                  required
                />
                <div className="sm:col-span-2">
                  <TextField
                    label="Nome e Cognome proprietario"
                    placeholder="Es. Montinaro Paolo"
                    value={form.nomeDanneggiante}
                    onChange={(v) => update("nomeDanneggiante", v)}
                    icon={<User className="w-4 h-4" />}
                    error={getFieldError("nomeDanneggiante")}
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <TextField
                    label="Telefono"
                    placeholder="Es. 3315917663"
                    value={form.telefonoDanneggiante}
                    onChange={(v) => update("telefonoDanneggiante", v)}
                    icon={<Phone className="w-4 h-4" />}
                    error={getFieldError("telefonoDanneggiante")}
                    hint="Opzionale — se inserito verrà incluso nel testo"
                  />
                </div>
              </div>
            </FormSection>

            {/* ─── Step 4: Unità danneggiata ─── */}
            <FormSection
              stepNumber={4}
              icon={<Users className="w-4 h-4" />}
              title="Unità danneggiata"
              description="L'appartamento che ha subito il danno"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <TextField
                  label="Interno"
                  placeholder="Es. 7"
                  value={form.internoDanneggiato}
                  onChange={(v) => update("internoDanneggiato", v)}
                  icon={<Hash className="w-4 h-4" />}
                  error={getFieldError("internoDanneggiato")}
                  required
                />
                <SelectField
                  label="Titolo"
                  value={form.titoloDanneggiato}
                  onChange={(v) => updateRaw("titoloDanneggiato", v)}
                  options={OPZIONI_TITOLO}
                  required
                />
                <div className="sm:col-span-2">
                  <TextField
                    label="Nome e Cognome proprietario"
                    placeholder="Es. Del Guercio Silvia"
                    value={form.nomeDanneggiato}
                    onChange={(v) => update("nomeDanneggiato", v)}
                    icon={<User className="w-4 h-4" />}
                    error={getFieldError("nomeDanneggiato")}
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <TextField
                    label="Telefono"
                    placeholder="Es. 3245954554"
                    value={form.telefonoDanneggiato}
                    onChange={(v) => update("telefonoDanneggiato", v)}
                    icon={<Phone className="w-4 h-4" />}
                    error={getFieldError("telefonoDanneggiato")}
                    hint="Opzionale — se inserito verrà incluso nel testo"
                  />
                </div>
              </div>
            </FormSection>

            {/* ─── Anteprima live del testo ─── */}
            <FormSection
              stepNumber={5}
              icon={<FileText className="w-4 h-4" />}
              title="Anteprima del testo"
              description="Il testo viene composto automaticamente e aggiornato mentre digiti"
            >
              <div className="relative rounded-2xl border-2 border-dashed border-[var(--brand)]/30 bg-gradient-to-br from-[var(--brand)]/5 to-white p-5 min-h-[140px]">
                {anteprima ? (
                  <>
                    <p className="text-sm sm:text-base text-neutral-800 leading-relaxed font-display italic">
                      «{anteprima}»
                    </p>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(anteprima)}
                      className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white ring-1 ring-neutral-200 hover:ring-[var(--brand)] text-xs font-semibold text-neutral-700 hover:text-[var(--brand)] transition-all"
                    >
                      {copied ? (
                        <><ClipboardCheck className="w-3.5 h-3.5 text-[var(--brand)]" /> Copiato!</>
                      ) : (
                        <><Copy className="w-3.5 h-3.5" /> Copia testo</>
                      )}
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[100px] text-center">
                    <Sparkles className="w-6 h-6 text-neutral-300 mb-2" />
                    <p className="text-sm text-neutral-500">
                      Compila i campi obbligatori per vedere l'anteprima del testo
                    </p>
                  </div>
                )}
              </div>
            </FormSection>

            {/* ─── Privacy ─── */}
            <div className="rounded-2xl bg-gradient-to-br from-neutral-50 to-white p-4 sm:p-5 ring-1 ring-neutral-200">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative pt-0.5">
                  <input
                    id="cons"
                    type="checkbox"
                    checked={form.consenso}
                    onChange={(e) => updateRaw("consenso", e.target.checked)}
                    className="peer sr-only"
                  />
                  <span className={cn(
                    "w-5 h-5 rounded-md ring-1 flex items-center justify-center transition-all",
                    form.consenso
                      ? "bg-[var(--brand)] ring-[var(--brand)]"
                      : "bg-white ring-neutral-300 group-hover:ring-neutral-400"
                  )}>
                    {form.consenso && <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3} />}
                  </span>
                </div>
                <span className="text-sm text-neutral-700 flex-1 leading-relaxed">
                  Confermo di aver verificato i dati inseriti e di essere autorizzato al trattamento
                  degli stessi per l'apertura del sinistro.
                  <span className="text-red-500 ml-0.5">*</span>
                </span>
              </label>
            </div>

            {/* ─── Submit ─── */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <motion.button
                disabled={sending || cooldown > 0}
                onClick={submit}
                whileHover={!sending && !cooldown ? { scale: 1.01 } : {}}
                whileTap={!sending && !cooldown ? { scale: 0.99 } : {}}
                className={cn(
                  "flex-1 relative overflow-hidden inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-white font-semibold text-base transition-all",
                  sending || cooldown
                    ? "bg-neutral-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-[var(--brand)] via-emerald-600 to-emerald-700 shadow-lg hover:shadow-xl"
                )}
              >
                {!(sending || cooldown) && (
                  <span
                    aria-hidden
                    className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity bg-[linear-gradient(110deg,transparent,rgba(255,255,255,.25),transparent)] bg-[length:200%_100%] animate-shimmer"
                  />
                )}
                {sending ? (
                  <><Loader2 className="w-5 h-5 animate-spin" />Invio in corso…</>
                ) : (
                  <><Send className="w-5 h-5" />Invia apertura sinistro</>
                )}
              </motion.button>
              {cooldown > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-sm text-neutral-600 text-center sm:text-left px-3"
                >
                  Prossimo invio tra <span className="font-semibold text-[var(--brand)] tabular-nums">{cooldown}s</span>
                </motion.div>
              )}
            </div>

            {/* ─── Result ─── */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -10 }}
                  className={cn(
                    "rounded-2xl border p-5 shadow-soft",
                    result.ok
                      ? "bg-gradient-to-br from-emerald-50 to-white border-emerald-300"
                      : "bg-gradient-to-br from-red-50 to-white border-red-300"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center",
                      result.ok ? "bg-emerald-100" : "bg-red-100"
                    )}>
                      {result.ok ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-700" />
                      ) : (
                        <AlertCircle className="w-6 h-6 text-red-700" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {result.ok ? (
                        <>
                          <div className="font-display font-semibold text-emerald-900 text-lg leading-tight">
                            Sinistro inviato correttamente!
                          </div>
                          <p className="text-sm text-emerald-800/80 mt-1">
                            Il testo è stato trasmesso al flusso di gestione.
                          </p>
                          {result.ticket && (
                            <div className="mt-3 bg-white rounded-xl px-4 py-3 ring-1 ring-emerald-200">
                              <p className="text-[11px] uppercase tracking-wider text-neutral-500 mb-1 font-semibold">
                                Numero ticket
                              </p>
                              <p className="font-mono font-bold text-emerald-700 text-lg tracking-tight select-all break-all">
                                {result.ticket}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="font-display font-semibold text-red-900 text-lg leading-tight">
                            Errore nell'invio
                          </div>
                          <p className="text-sm text-red-700 mt-1">{result.error}</p>
                        </>
                      )}
                    </div>
                    <button
                      onClick={() => setResult(null)}
                      className="p-1.5 rounded-lg hover:bg-white/60 transition-colors"
                      aria-label="Chiudi"
                    >
                      <X className={cn("w-4 h-4", result.ok ? "text-emerald-700" : "text-red-700")} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white/70 backdrop-blur rounded-2xl ring-1 ring-neutral-200 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 text-neutral-600 text-center sm:text-left">
              <Building2 className="w-4 h-4 text-[var(--brand)]" />
              <span>© {new Date().getFullYear()} <span className="font-semibold text-neutral-800">Studio CAI</span> — Strumento interno</span>
            </div>
            <div className="text-center sm:text-right text-xs text-neutral-500 tabular-nums">
              <span className="font-mono font-semibold text-neutral-700">v{APP_VERSION}</span>
              <span className="mx-2">·</span>
              Build: <span className="font-semibold text-neutral-700">{BUILD_DATE_LABEL}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function FormSection({ stepNumber, icon, title, description, children }) {
  return (
    <section>
      <header className="flex items-start gap-3 mb-4">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center ring-1 ring-[var(--brand)]/20">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">
              Step {stepNumber}
            </span>
          </div>
          <h3 className="font-display font-semibold text-lg text-neutral-900 leading-tight">{title}</h3>
          {description && <p className="text-sm text-neutral-600 mt-0.5">{description}</p>}
        </div>
      </header>
      <div className="pl-0 sm:pl-12">
        {children}
      </div>
    </section>
  );
}

function TextField({ label, value, onChange, placeholder, type = "text", icon, required, error, hint }) {
  return (
    <div>
      <label className="text-sm font-semibold text-neutral-700 flex items-center gap-1.5 mb-1.5">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-2xl border py-3 text-sm focus:outline-none focus:ring-2 transition-all bg-white placeholder:text-neutral-400",
            icon ? "pl-10 pr-4" : "px-4",
            error
              ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
              : "border-neutral-300 hover:border-neutral-400 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]"
          )}
        />
      </div>
      {error ? (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1.5 text-xs text-red-600 flex items-center gap-1"
        >
          <AlertCircle className="w-3 h-3" />
          {error}
        </motion.p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-neutral-500">{hint}</p>
      ) : null}
    </div>
  );
}

function SelectField({ label, value, onChange, options = [], required, error }) {
  return (
    <div>
      <label className="text-sm font-semibold text-neutral-700 flex items-center gap-1.5 mb-1.5">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "appearance-none w-full rounded-2xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 bg-white transition-all",
            error
              ? "border-red-300 focus:ring-red-500/20 focus:border-red-500"
              : "border-neutral-300 hover:border-neutral-400 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]"
          )}
        >
          <option value="">— Seleziona —</option>
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1.5 text-xs text-red-600 flex items-center gap-1"
        >
          <AlertCircle className="w-3 h-3" />
          {error}
        </motion.p>
      )}
    </div>
  );
}
