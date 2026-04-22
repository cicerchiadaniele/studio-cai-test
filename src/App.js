import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, CheckCircle2, AlertCircle, Building2, Phone, Loader2,
  ChevronDown, ChevronRight, ChevronLeft, X, Info, User, MapPin,
  Home, Shield, BookUser, Layers, Mail, ExternalLink
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Costanti
// ─────────────────────────────────────────────────────────────
const APP_VERSION = "1.0";
const BUILD_DATE_LABEL = "22/04/2026";
const WEBHOOK_URL = "https://hook.eu1.make.com/k8agbjzwobv0b2myrdwtu06ztjdefvx8";
const BRAND_NAME = "Studio CAI – Anagrafe Condominiale";
const LOGO_URL = "/logo.jpg";
const PRIMARY = "#8B1538";
const GDPR_URL = "https://www.dropbox.com/scl/fi/57wzvnnkfz96j3t6ts7r2/INFORMATIVA-SUL-TRATTAMENTO-DEI-DATI-PERSONALI.pdf?rlkey=mhkez37u9gtlxoycajz8wzxn3&dl=0";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const cn = (...cls) => cls.filter(Boolean).join(" ");

const S = {
  nome:     (v) => v.replace(/[^\p{L}\s'-]/gu, ""),
  luogo:    (v) => v.replace(/[^\p{L}\s',-]/gu, ""),
  indirizzo:(v) => v.replace(/[^\p{L}\p{N}\s.,'/°-]/gu, ""),
  comune:   (v) => v.replace(/[^\p{L}\s'-]/gu, ""),
  cf:       (v) => v.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 16),
  telefono: (v) => v.replace(/[^\d\s+]/g, ""),
  email:    (v) => v.replace(/\s/g, ""),
  foglio:   (v) => v.replace(/[^\p{L}\p{N}]/gu, ""),
  interno:  (v) => v.replace(/[^\p{L}\p{N}]/gu, ""),
  scala:    (v) => v.replace(/[^\p{L}\p{N}]/gu, ""),
  piano:    (v) => v.replace(/[^\p{L}\p{N}°]/gu, ""),
  zona:     (v) => v.replace(/[^\p{L}\p{N}]/gu, ""),
  perc:     (v) => v.replace(/[^\d.,]/g, ""),
  cap:      (v) => v.replace(/\D/g, "").slice(0, 5),
  prov:     (v) => v.replace(/[^\p{L}]/gu, "").toUpperCase().slice(0, 2),
};

const DESTINAZIONI = ["Abitazione","Negozio","Ufficio","Autorimessa","Posto auto","Cantina","Altro"];
const QUALITA_PF   = ["Unico Proprietario","Comproprietario","Usufruttuario","Nudo proprietario","Titolare di altro diritto reale"];
const MODALITA     = [
  { key: "racc_stesso", label: "Raccomandata a/r all'indirizzo di residenza comunicato" },
  { key: "racc_altro",  label: "Raccomandata a/r ad altro indirizzo" },
  { key: "pec",         label: "Posta Elettronica Certificata (PEC)" },
];

const emptyUnita = () => ({
  palazzina:"", scala:"", piano:"", interno:"",
  zona:"", foglio:"", particella:"", sub:"", classe:"", categoria:"",
  destinazione:"", destinazioneAltro:"",
});

const initForm = () => ({
  unita: [emptyUnita()],
  // Anagrafici
  nome:"", luogoNascita:"", dataNascita:"",
  comuneResidenza:"", indirizzoResidenza:"",
  codiceFiscale:"",
  comuneDomicilio:"", indirizzoDomicilio:"",
  qualitaPF:"", percentuale:"", altroDiritto:"",
  // Recapiti
  nomeRecapiti:"", tel1:"", tel2:"", tel3:"",
  email1:"", email2:"", email3:"",
  pec1:"", pec2:"", altroRecapito:"",
  // Corrispondenza
  modalita:"", indirizzoRacc:"", capRacc:"", cittaRacc:"", provRacc:"",
  // Consenso
  consenso: false,
});

// Definizione degli step del wizard
const STEPS = [
  { id: 1, label: "Unità",       shortLabel: "Unità",      icon: Home },
  { id: 2, label: "Anagrafici",  shortLabel: "Anagrafici", icon: User },
  { id: 3, label: "Recapiti",    shortLabel: "Recapiti",   icon: Phone },
  { id: 4, label: "Corrispondenza", shortLabel: "Corrisp.", icon: Mail },
  { id: 5, label: "Conferma",   shortLabel: "Conferma",   icon: Shield },
];

// ─────────────────────────────────────────────────────────────
// Componente principale
// ─────────────────────────────────────────────────────────────
export default function AppAnagrafe() {
  const [form, setForm]       = useState(initForm());
  const [sending, setSending] = useState(false);
  const [result, setResult]   = useState(null);
  const [touched, setTouched] = useState({});
  const [showInfo, setShowInfo] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [step, setStep]       = useState(1);

  React.useEffect(() => {
    if (!cooldown) return;
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const cssVars = useMemo(() => ({ "--brand": PRIMARY }), []);

  // ─── State helpers ───
  const upd = (k, raw) => {
    const clean = S[k] ? S[k](raw) : raw;
    setForm((s) => ({ ...s, [k]: clean }));
    setTouched((t) => ({ ...t, [k]: true }));
  };
  const updRaw = (k, v) => {
    setForm((s) => ({ ...s, [k]: v }));
    setTouched((t) => ({ ...t, [k]: true }));
  };
  const updU = (idx, k, raw) => {
    const clean = S[k] ? S[k](raw) : raw;
    setForm((s) => { const u=[...s.unita]; u[idx]={...u[idx],[k]:clean}; return {...s,unita:u}; });
    setTouched((t) => ({ ...t, [`u_${idx}_${k}`]: true }));
  };
  const addU = () => form.unita.length < 3 && setForm((s) => ({ ...s, unita:[...s.unita,emptyUnita()] }));
  const remU = (i) => form.unita.length > 1 && setForm((s) => ({ ...s, unita:s.unita.filter((_,j)=>j!==i) }));

  // ─── Errori campo ───
  const err = (f) => {
    if (!touched[f]) return null;
    const v = form[f];
    const req = ["nome","comuneResidenza","indirizzoResidenza","luogoNascita","dataNascita",
                 "codiceFiscale","qualitaPF","nomeRecapiti","tel1","email1","modalita"];
    if (req.includes(f) && !v) return "Campo obbligatorio";
    if (f==="codiceFiscale" && v && v.length<16) return "CF non valido (16 caratteri)";
    if (f==="percentuale" && form.qualitaPF==="Comproprietario" && !v) return "Indica la percentuale";
    if (f==="altroDiritto" && form.qualitaPF==="Titolare di altro diritto reale" && !v) return "Specifica il titolo";
    if (f==="pec1" && form.modalita==="pec" && !v) return "Inserisci l'indirizzo PEC";
    if (["indirizzoRacc","capRacc","cittaRacc"].includes(f) && form.modalita==="racc_altro" && !v) return "Campo obbligatorio";
    return null;
  };
  const errU = (i, f) => {
    const key=`u_${i}_${f}`; if(!touched[key]) return null;
    const v=form.unita[i]?.[f];
    if (f==="destinazione" && !v) return "Seleziona la destinazione";
    if (f==="destinazioneAltro" && form.unita[i]?.destinazione==="Altro" && !v) return "Specifica";
    return null;
  };

  // ─── Validazione per step ───
  const validateStep = (s) => {
    const e = [];
    if (s === 1) {
      form.unita.forEach((u,i) => {
        if(!u.destinazione) e.push(`Seleziona la destinazione per l'unità ${i+1}`);
        if(u.destinazione==="Altro"&&!u.destinazioneAltro) e.push(`Specifica la destinazione per l'unità ${i+1}`);
      });
    }
    if (s === 2) {
      if(!form.nome)             e.push("Inserisci nome e cognome");
      if(!form.codiceFiscale||form.codiceFiscale.length<16) e.push("Codice fiscale non valido (16 caratteri)");
      if(!form.luogoNascita)     e.push("Inserisci luogo di nascita");
      if(!form.dataNascita)      e.push("Inserisci data di nascita");
      if(!form.comuneResidenza)  e.push("Inserisci comune di residenza");
      if(!form.indirizzoResidenza) e.push("Inserisci indirizzo di residenza");
      if(!form.qualitaPF)        e.push("Seleziona la qualità del dichiarante");
      if(form.qualitaPF==="Comproprietario"&&!form.percentuale) e.push("Indica la percentuale");
      if(form.qualitaPF==="Titolare di altro diritto reale"&&!form.altroDiritto) e.push("Specifica il titolo");
    }
    if (s === 3) {
      if(!form.nomeRecapiti) e.push("Inserisci il nome del titolare dei recapiti");
      if(!form.tel1)         e.push("Inserisci almeno un numero di telefono");
      if(!form.email1)       e.push("Inserisci almeno un indirizzo e-mail");
    }
    if (s === 4) {
      if(!form.modalita) e.push("Seleziona la modalità di corrispondenza");
      if(form.modalita==="racc_altro"){
        if(!form.indirizzoRacc) e.push("Inserisci l'indirizzo raccomandata");
        if(!form.capRacc)       e.push("Inserisci il CAP");
        if(!form.cittaRacc)     e.push("Inserisci la città");
      }
      if(form.modalita==="pec"&&!form.pec1) e.push("Inserisci l'indirizzo PEC");
    }
    if (s === 5) {
      if(!form.consenso) e.push("Conferma la presa visione dell'informativa privacy");
    }
    return e;
  };

  // Touch tutti i campi dello step corrente
  const touchStep = (s) => {
    const t = {};
    if (s===1) form.unita.forEach((_,i)=>{ ["destinazione","destinazioneAltro"].forEach(f=>{t[`u_${i}_${f}`]=true;}); });
    if (s===2) ["nome","codiceFiscale","luogoNascita","dataNascita","comuneResidenza","indirizzoResidenza","qualitaPF","percentuale","altroDiritto"].forEach(f=>{t[f]=true;});
    if (s===3) ["nomeRecapiti","tel1","email1"].forEach(f=>{t[f]=true;});
    if (s===4) ["modalita","indirizzoRacc","capRacc","cittaRacc","pec1"].forEach(f=>{t[f]=true;});
    if (s===5) ["consenso"].forEach(f=>{t[f]=true;});
    setTouched(prev=>({...prev,...t}));
  };

  const goNext = () => {
    touchStep(step);
    const errs = validateStep(step);
    if (errs.length) { setResult({ok:false,error:errs[0]}); return; }
    setResult(null);
    setStep(s=>Math.min(s+1, 5));
    window.scrollTo({top:0,behavior:"smooth"});
  };
  const goPrev = () => { setResult(null); setStep(s=>Math.max(s-1,1)); window.scrollTo({top:0,behavior:"smooth"}); };

  const submit = async () => {
    if (cooldown) return;
    touchStep(5);
    // Valida tutti gli step
    const allErrs = [1,2,3,4,5].flatMap(s=>validateStep(s));
    if (allErrs.length) { setResult({ok:false,error:allErrs[0]}); return; }
    setSending(true); setResult(null);
    const ticket = `ANA-${new Date().toISOString().slice(0,10).replaceAll("-","")}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
    try {
      const fd = new FormData();
      const payload = {...form, unita:JSON.stringify(form.unita), ticket, timestamp:new Date().toISOString(), appVersion:APP_VERSION, tipo:"anagrafe_condominiale"};
      Object.entries(payload).forEach(([k,v])=>fd.append(k,String(v)));
      const res = await fetch(WEBHOOK_URL,{method:"POST",body:fd});
      if(!res.ok) throw new Error(`Errore invio: ${res.status}`);
      setResult({ok:true,ticket});
      setCooldown(10);
      setForm(initForm()); setTouched({}); setStep(1);
    } catch(e) {
      setResult({ok:false,error:e.message||"Invio non riuscito. Riprova."});
    } finally { setSending(false); }
  };

  // ─── Riepilogo step 5 ───
  const destinazioneLabel = (u) => u.destinazione==="Altro"?u.destinazioneAltro:u.destinazione;

  return (
    <div className="relative min-h-screen w-full bg-paper bg-noise text-neutral-900" style={cssVars}>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[var(--brand)]/8 blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 rounded-full bg-[var(--brand)]/5 blur-3xl" />
      </div>

      {/* ── Header ── */}
      <header className="relative z-10 sticky top-0 bg-white/80 backdrop-blur-xl border-b border-neutral-200/70">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden bg-white ring-1 ring-neutral-200 shadow-soft flex items-center justify-center">
                {LOGO_URL
                  ? <img src={LOGO_URL} alt="logo" className="w-full h-full object-contain p-1" />
                  : <Building2 className="w-8 h-8 text-[var(--brand)]" />}
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[var(--brand)] ring-2 ring-white flex items-center justify-center">
                <BookUser className="w-3 h-3 text-white" strokeWidth={3} />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-display font-semibold text-lg sm:text-xl text-neutral-900 truncate">{BRAND_NAME}</h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-900 text-white tracking-wider">v{APP_VERSION}</span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">art. 10, comma 6, L. 220/2012</p>
            </div>
            <button onClick={()=>setShowInfo(!showInfo)} className="p-2.5 rounded-xl hover:bg-neutral-100 transition-colors" aria-label="Info">
              <Info className="w-5 h-5 text-neutral-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Info panel */}
      <AnimatePresence>
        {showInfo && (
          <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}}
            className="relative z-10 bg-[var(--brand)]/5 border-b border-[var(--brand)]/20">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-[var(--brand)] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-neutral-700 flex-1">Compila le 5 sezioni guidate per registrare i tuoi dati nel Registro Anagrafe Condominiale. I campi con <span className="text-red-500 font-bold">*</span> sono obbligatori. Al termine potrai rivedere tutto prima di inviare.</p>
              <button onClick={()=>setShowInfo(false)} className="p-1.5 hover:bg-[var(--brand)]/10 rounded-lg">
                <X className="w-4 h-4 text-[var(--brand)]" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main ── */}
      <main className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-10">

        {/* Progress bar */}
        <div className="mb-6">
          {/* Desktop: step labels */}
          <div className="hidden sm:flex items-center justify-between mb-2">
            {STEPS.map((s) => (
              <div key={s.id} className={cn("flex items-center gap-1.5 text-xs font-semibold transition-colors",
                step===s.id?"text-[var(--brand)]": step>s.id?"text-neutral-500":"text-neutral-300")}>
                <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ring-1 transition-all",
                  step===s.id?"bg-[var(--brand)] text-white ring-[var(--brand)]":
                  step>s.id?"bg-neutral-200 text-neutral-600 ring-neutral-200":"bg-white text-neutral-300 ring-neutral-200")}>
                  {step>s.id ? <CheckCircle2 className="w-3.5 h-3.5"/> : s.id}
                </span>
                {s.label}
              </div>
            ))}
          </div>
          {/* Mobile: step X di Y */}
          <div className="flex sm:hidden items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[var(--brand)]">
              {STEPS[step-1].label}
            </span>
            <span className="text-xs text-neutral-500 font-medium">Passo {step} di {STEPS.length}</span>
          </div>
          {/* Barra progressione */}
          <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-[var(--brand)] to-[#c4395f] rounded-full"
              animate={{width:`${((step-1)/(STEPS.length-1))*100}%`}}
              transition={{duration:0.4, ease:"easeOut"}} />
          </div>
        </div>

        {/* Errore globale */}
        <AnimatePresence>
          {result && !result.ok && (
            <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
              className="mb-4 rounded-2xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"/>
              <p className="text-sm text-red-700 flex-1">{result.error}</p>
              <button onClick={()=>setResult(null)}><X className="w-4 h-4 text-red-400"/></button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card */}
        <motion.div layout className="bg-white rounded-3xl shadow-lift overflow-hidden ring-1 ring-neutral-200/80"
          initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.4}}>

          {/* Card header bordeaux */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[var(--brand)] via-[#6d0f2a] to-[#4f0a1e] px-6 sm:px-8 py-5">
            <div aria-hidden="true" className="absolute inset-0 opacity-20"
              style={{backgroundImage:"radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)",backgroundSize:"32px 32px",backgroundPosition:"0 0, 16px 16px"}} />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 ring-1 ring-white/25 flex items-center justify-center">
                {React.createElement(STEPS[step-1].icon,{className:"w-5 h-5 text-white"})}
              </div>
              <div>
                <p className="text-white/60 text-xs font-mono font-bold uppercase tracking-widest">Passo {step} di {STEPS.length}</p>
                <h2 className="font-display font-semibold text-xl text-white leading-tight">{STEPS[step-1].label}</h2>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <AnimatePresence mode="wait">
              <motion.div key={step}
                initial={{opacity:0,x:30}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-30}}
                transition={{duration:0.25}}>

                {/* ═══════════════════════════════════════════
                    STEP 1 — Unità immobiliari
                ════════════════════════════════════════════ */}
                {step===1 && (
                  <div className="space-y-5">
                    <p className="text-sm text-neutral-600">Inserisci i dati delle tue unità immobiliari nel condominio. Puoi aggiungerne fino a 3.</p>
                    {form.unita.map((u,idx)=>(
                      <div key={idx} className="rounded-2xl border border-neutral-200 bg-neutral-50/60 p-5 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-[var(--brand)] uppercase tracking-wider">{idx+1}ª Unità</span>
                          {form.unita.length>1&&(
                            <button onClick={()=>remU(idx)} className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-600 transition-colors"><X className="w-4 h-4"/></button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[["palazzina","Palazzina","A","scala"],["scala","Scala","1","scala"],["piano","Piano","3°","piano"],["interno","Interno","5","interno"]].map(([k,l,p,sk])=>(
                            <TF key={k} label={l} value={u[k]} onChange={(v)=>updU(idx,k,v)} placeholder={p} sanitizerKey={sk}/>
                          ))}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-2">Dati catastali <span className="font-normal normal-case">(se disponibili)</span></p>
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                            {[["zona","Zona"],["foglio","Foglio"],["particella","Partic."],["sub","Sub"],["classe","Classe"],["categoria","Categ."]].map(([k,l])=>(
                              <TF key={k} label={l} value={u[k]} onChange={(v)=>updU(idx,k,v)} placeholder="—" sanitizerKey="foglio"/>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <SF label="Destinazione d'uso" required value={u.destinazione}
                            onChange={(v)=>{updU(idx,"destinazione",v);if(v!=="Altro")updU(idx,"destinazioneAltro","");}}
                            options={DESTINAZIONI} error={errU(idx,"destinazione")}/>
                          {u.destinazione==="Altro"&&(
                            <TF label="Specifica destinazione" required value={u.destinazioneAltro}
                              onChange={(v)=>updU(idx,"destinazioneAltro",v)} placeholder="Es. magazzino"
                              error={errU(idx,"destinazioneAltro")} sanitizerKey="luogo"/>
                          )}
                        </div>
                      </div>
                    ))}
                    {form.unita.length<3&&(
                      <button onClick={addU}
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-2xl border-2 border-dashed border-[var(--brand)]/30 text-[var(--brand)] text-sm font-semibold hover:border-[var(--brand)]/60 hover:bg-[var(--brand)]/5 transition-all">
                        <Layers className="w-4 h-4"/>Aggiungi un'altra unità
                      </button>
                    )}
                  </div>
                )}

                {/* ═══════════════════════════════════════════
                    STEP 2 — Dati anagrafici
                ════════════════════════════════════════════ */}
                {step===2 && (
                  <div className="space-y-5">
                    <p className="text-sm text-neutral-600">Inserisci i tuoi dati anagrafici come intestatario dell'unità immobiliare.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <TF label="Nome e Cognome" required value={form.nome} onChange={(v)=>upd("nome",v)}
                          placeholder="Es. Rossi Mario" icon={<User className="w-4 h-4"/>} error={err("nome")} sanitizerKey="nome"/>
                      </div>
                      <TF label="Luogo di nascita" required value={form.luogoNascita} onChange={(v)=>upd("luogoNascita",v)}
                        placeholder="Es. Roma" error={err("luogoNascita")} sanitizerKey="luogo"/>
                      <TF label="Data di nascita" required value={form.dataNascita} onChange={(v)=>updRaw("dataNascita",v)}
                        type="date" error={err("dataNascita")} sanitizerKey="cf"/>
                      <TF label="Comune di residenza" required value={form.comuneResidenza} onChange={(v)=>upd("comuneResidenza",v)}
                        placeholder="Es. Roma" icon={<MapPin className="w-4 h-4"/>} error={err("comuneResidenza")} sanitizerKey="comune"/>
                      <TF label="Indirizzo di residenza" required value={form.indirizzoResidenza} onChange={(v)=>upd("indirizzoResidenza",v)}
                        placeholder="Es. Via Roma 10" error={err("indirizzoResidenza")} sanitizerKey="indirizzo"/>
                      <div className="sm:col-span-2">
                        <TF label="Codice Fiscale" required value={form.codiceFiscale} onChange={(v)=>upd("codiceFiscale",v)}
                          placeholder="RSSMRA80A01H501Z" error={err("codiceFiscale")} hint="16 caratteri" sanitizerKey="cf"/>
                      </div>
                      <TF label="Comune di domicilio" value={form.comuneDomicilio} onChange={(v)=>upd("comuneDomicilio",v)}
                        placeholder="Solo se diverso da residenza" sanitizerKey="comune"/>
                      <TF label="Indirizzo di domicilio" value={form.indirizzoDomicilio} onChange={(v)=>upd("indirizzoDomicilio",v)}
                        placeholder="Solo se diverso da residenza" sanitizerKey="indirizzo"/>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">In qualità di</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <SF label="Qualità" required value={form.qualitaPF}
                          onChange={(v)=>{updRaw("qualitaPF",v);if(v!=="Comproprietario")updRaw("percentuale","");if(v!=="Titolare di altro diritto reale")updRaw("altroDiritto","");}}
                          options={QUALITA_PF} error={err("qualitaPF")}/>
                        {form.qualitaPF==="Comproprietario"&&(
                          <TF label="Percentuale %" required value={form.percentuale} onChange={(v)=>upd("percentuale",v)}
                            placeholder="Es. 50" error={err("percentuale")} hint="Quota di proprietà" sanitizerKey="perc"/>
                        )}
                        {form.qualitaPF==="Titolare di altro diritto reale"&&(
                          <TF label="Specifica il diritto" required value={form.altroDiritto} onChange={(v)=>upd("altroDiritto",v)}
                            placeholder="Es. diritto di superficie" error={err("altroDiritto")} sanitizerKey="luogo"/>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ═══════════════════════════════════════════
                    STEP 3 — Recapiti
                ════════════════════════════════════════════ */}
                {step===3 && (
                  <div className="space-y-5">
                    <p className="text-sm text-neutral-600">Fornisci i tuoi recapiti per le comunicazioni condominiali. Telefono ed e-mail sono obbligatori.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <TF label="Nome e Cognome titolare recapiti" required value={form.nomeRecapiti} onChange={(v)=>upd("nomeRecapiti",v)}
                          placeholder="Es. Rossi Mario" icon={<User className="w-4 h-4"/>} error={err("nomeRecapiti")} sanitizerKey="nome"/>
                      </div>
                      <TF label="N. telefono 1" required value={form.tel1} onChange={(v)=>upd("tel1",v)}
                        placeholder="Es. 06 7835 9769" icon={<Phone className="w-4 h-4"/>} error={err("tel1")} sanitizerKey="telefono"/>
                      <TF label="N. telefono 2" value={form.tel2} onChange={(v)=>upd("tel2",v)} placeholder="Facoltativo" sanitizerKey="telefono"/>
                      <TF label="N. telefono 3" value={form.tel3} onChange={(v)=>upd("tel3",v)} placeholder="Facoltativo" sanitizerKey="telefono"/>
                      <TF label="E-mail 1" required value={form.email1} onChange={(v)=>upd("email1",v)}
                        placeholder="nome@email.it" type="email" icon={<Mail className="w-4 h-4"/>} error={err("email1")} sanitizerKey="email"/>
                      <TF label="E-mail 2" value={form.email2} onChange={(v)=>upd("email2",v)} placeholder="Facoltativo" type="email" sanitizerKey="email"/>
                      <TF label="E-mail 3" value={form.email3} onChange={(v)=>upd("email3",v)} placeholder="Facoltativo" type="email" sanitizerKey="email"/>
                      <TF label="PEC 1" value={form.pec1} onChange={(v)=>upd("pec1",v)} placeholder="nome@pec.it" type="email" sanitizerKey="email"/>
                      <TF label="PEC 2" value={form.pec2} onChange={(v)=>upd("pec2",v)} placeholder="Facoltativo" type="email" sanitizerKey="email"/>
                      <TF label="Altro recapito" value={form.altroRecapito} onChange={(v)=>upd("altroRecapito",v)} placeholder="Es. Fax, WhatsApp…" sanitizerKey="luogo"/>
                    </div>
                  </div>
                )}

                {/* ═══════════════════════════════════════════
                    STEP 4 — Corrispondenza
                ════════════════════════════════════════════ */}
                {step===4 && (
                  <div className="space-y-5">
                    <p className="text-sm text-neutral-600">Scegli come preferisci ricevere le comunicazioni ufficiali del condominio.</p>
                    <div className="space-y-2">
                      {MODALITA.map(m=>(
                        <label key={m.key} className={cn("flex items-start gap-3 cursor-pointer p-4 rounded-2xl border-2 transition-all",
                          form.modalita===m.key?"border-[var(--brand)] bg-[var(--brand)]/5":"border-neutral-200 hover:border-neutral-300 bg-white")}>
                          <input type="radio" name="modalita" value={m.key} checked={form.modalita===m.key}
                            onChange={()=>{updRaw("modalita",m.key);setTouched(t=>({...t,modalita:true}));}} className="sr-only"/>
                          <span className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
                            form.modalita===m.key?"border-[var(--brand)] bg-[var(--brand)]":"border-neutral-300 bg-white")}>
                            {form.modalita===m.key&&<span className="w-2 h-2 rounded-full bg-white block"/>}
                          </span>
                          <span className={cn("text-sm font-medium",form.modalita===m.key?"text-[var(--brand)]":"text-neutral-700")}>{m.label}</span>
                        </label>
                      ))}
                      {touched["modalita"]&&!form.modalita&&(
                        <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>Seleziona una modalità</p>
                      )}
                    </div>

                    {form.modalita==="racc_altro"&&(
                      <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        <div className="sm:col-span-3">
                          <TF label="Indirizzo" required value={form.indirizzoRacc} onChange={(v)=>upd("indirizzoRacc",v)}
                            placeholder="Via e numero civico" icon={<MapPin className="w-4 h-4"/>} error={err("indirizzoRacc")} sanitizerKey="indirizzo"/>
                        </div>
                        <TF label="CAP" required value={form.capRacc} onChange={(v)=>upd("capRacc",v)} placeholder="00100" error={err("capRacc")} sanitizerKey="cap"/>
                        <TF label="Città" required value={form.cittaRacc} onChange={(v)=>upd("cittaRacc",v)} placeholder="Es. Roma" error={err("cittaRacc")} sanitizerKey="comune"/>
                        <TF label="Prov" value={form.provRacc} onChange={(v)=>upd("provRacc",v)} placeholder="RM" sanitizerKey="prov"/>
                      </motion.div>
                    )}
                    {form.modalita==="pec"&&(
                      <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} className="space-y-3">
                        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                          Le comunicazioni via PEC hanno valore di raccomandata (D.P.R. n. 68/2005). Ci si impegna a comunicare ogni variazione.
                        </div>
                        <TF label="Indirizzo PEC" required value={form.pec1} onChange={(v)=>upd("pec1",v)}
                          placeholder="nome@pec.it" type="email" error={err("pec1")} sanitizerKey="email"/>
                      </motion.div>
                    )}
                  </div>
                )}

                {/* ═══════════════════════════════════════════
                    STEP 5 — Riepilogo e consenso
                ════════════════════════════════════════════ */}
                {step===5 && (
                  <div className="space-y-6">
                    <p className="text-sm text-neutral-600">Verifica i dati inseriti prima di inviare la scheda.</p>

                    {/* Riepilogo unità */}
                    <SummaryBlock title="Unità immobiliari" icon={<Home className="w-4 h-4"/>}>
                      {form.unita.map((u,i)=>(
                        <div key={i} className="text-sm space-y-0.5">
                          <p className="font-semibold text-[var(--brand)]">{i+1}ª Unità</p>
                          {(u.palazzina||u.scala||u.piano||u.interno)&&(
                            <p className="text-neutral-700">
                              {[u.palazzina&&`Pal. ${u.palazzina}`,u.scala&&`Sc. ${u.scala}`,u.piano&&`P. ${u.piano}`,u.interno&&`Int. ${u.interno}`].filter(Boolean).join(" · ")}
                            </p>
                          )}
                          {u.destinazione&&<p className="text-neutral-500">Destinazione: <span className="text-neutral-700">{destinazioneLabel(u)}</span></p>}
                        </div>
                      ))}
                    </SummaryBlock>

                    {/* Riepilogo anagrafici */}
                    <SummaryBlock title="Dati anagrafici" icon={<User className="w-4 h-4"/>}>
                      <Row label="Nome" value={form.nome}/>
                      <Row label="Nato/a a" value={`${form.luogoNascita}${form.dataNascita?" il "+new Date(form.dataNascita).toLocaleDateString("it-IT"):""}`}/>
                      <Row label="Residenza" value={`${form.indirizzoResidenza}, ${form.comuneResidenza}`}/>
                      <Row label="C.F." value={form.codiceFiscale}/>
                      <Row label="Qualità" value={form.qualitaPF+(form.percentuale?` (${form.percentuale}%)`:form.altroDiritto?` – ${form.altroDiritto}`:"")}/>
                    </SummaryBlock>

                    {/* Riepilogo recapiti */}
                    <SummaryBlock title="Recapiti" icon={<Phone className="w-4 h-4"/>}>
                      <Row label="Telefono" value={[form.tel1,form.tel2,form.tel3].filter(Boolean).join(", ")}/>
                      <Row label="E-mail" value={[form.email1,form.email2,form.email3].filter(Boolean).join(", ")}/>
                      {form.pec1&&<Row label="PEC" value={form.pec1}/>}
                    </SummaryBlock>

                    {/* Riepilogo corrispondenza */}
                    <SummaryBlock title="Corrispondenza" icon={<Mail className="w-4 h-4"/>}>
                      <Row label="Modalità" value={MODALITA.find(m=>m.key===form.modalita)?.label||"—"}/>
                      {form.modalita==="racc_altro"&&<Row label="Indirizzo" value={`${form.indirizzoRacc}, ${form.capRacc} ${form.cittaRacc} ${form.provRacc}`}/>}
                    </SummaryBlock>

                    {/* Privacy & Consenso */}
                    <div className="rounded-2xl bg-gradient-to-br from-neutral-50 to-white p-5 ring-1 ring-neutral-200 space-y-4">
                      <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-[var(--brand)] flex-shrink-0 mt-0.5"/>
                        <div className="text-sm text-neutral-700 space-y-2">
                          <p className="font-semibold text-neutral-800">Informativa Privacy (GDPR)</p>
                          <p>
                            I dati saranno trattati ai sensi del Reg. UE 2016/679 e D.lgs. 196/03 per il Registro Anagrafe Condominiale (art. 10, comma 6, L. 220/2012). Il conferimento è obbligatorio. Il condomino è tenuto a comunicare ogni variazione entro 60 gg (art. 1130 c.c.).
                          </p>
                          <a href={GDPR_URL} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[var(--brand)] font-semibold hover:underline text-xs">
                            <ExternalLink className="w-3.5 h-3.5"/>
                            Leggi l'informativa completa sul trattamento dei dati personali
                          </a>
                        </div>
                      </div>
                      <label className="flex items-start gap-3 cursor-pointer group pt-1">
                        <div className="pt-0.5">
                          <input type="checkbox" checked={form.consenso} onChange={(e)=>updRaw("consenso",e.target.checked)} className="sr-only"/>
                          <span className={cn("w-5 h-5 rounded-md ring-1 flex items-center justify-center transition-all",
                            form.consenso?"bg-[var(--brand)] ring-[var(--brand)]":"bg-white ring-neutral-300 group-hover:ring-neutral-400")}>
                            {form.consenso&&<CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3}/>}
                          </span>
                        </div>
                        <span className="text-sm text-neutral-700 flex-1 leading-relaxed">
                          Confermo di aver preso visione dell'informativa, di essere consapevole delle responsabilità penali per dichiarazioni false (DPR 445/2000, artt. 75-76), e autorizzo il trattamento dei dati per la gestione condominiale.
                          <span className="text-red-500 ml-0.5">*</span>
                        </span>
                      </label>
                    </div>

                    {/* Successo */}
                    <AnimatePresence>
                      {result?.ok && (
                        <motion.div initial={{opacity:0,scale:0.96}} animate={{opacity:1,scale:1}} exit={{opacity:0}}
                          className="rounded-2xl bg-green-50 border border-green-300 p-5 flex items-start gap-4">
                          <div className="w-11 h-11 rounded-2xl bg-green-100 flex items-center justify-center flex-shrink-0">
                            <CheckCircle2 className="w-6 h-6 text-green-700"/>
                          </div>
                          <div className="flex-1">
                            <p className="font-display font-semibold text-green-900 text-lg">Scheda inviata correttamente!</p>
                            <p className="text-sm text-green-800/80 mt-1">La scheda anagrafica è stata trasmessa all'Amministratore.</p>
                            {result.ticket&&(
                              <div className="mt-3 bg-white rounded-xl px-4 py-3 ring-1 ring-green-200">
                                <p className="text-[11px] uppercase tracking-wider text-neutral-500 mb-1 font-semibold">Numero protocollo</p>
                                <p className="font-mono font-bold text-green-700 text-lg select-all">{result.ticket}</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>

            {/* ── Navigazione ── */}
            <div className={cn("flex gap-3 mt-8", step>1?"justify-between":"justify-end")}>
              {step>1&&(
                <button onClick={goPrev}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl border-2 border-neutral-200 text-neutral-700 text-sm font-semibold hover:border-neutral-300 hover:bg-neutral-50 transition-all">
                  <ChevronLeft className="w-4 h-4"/>Indietro
                </button>
              )}
              {step<5 ? (
                <button onClick={goNext}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-[var(--brand)] to-[#6d0f2a] text-white text-sm font-semibold shadow hover:shadow-md transition-all">
                  Avanti<ChevronRight className="w-4 h-4"/>
                </button>
              ) : !result?.ok ? (
                <motion.button disabled={sending||cooldown>0} onClick={submit}
                  whileHover={!sending&&!cooldown?{scale:1.01}:{}} whileTap={!sending&&!cooldown?{scale:0.99}:{}}
                  className={cn("flex items-center gap-2 px-6 py-3 rounded-2xl text-white text-sm font-semibold shadow transition-all",
                    sending||cooldown?"bg-neutral-400 cursor-not-allowed":"bg-gradient-to-r from-[var(--brand)] to-[#6d0f2a] hover:shadow-md")}>
                  {sending?<><Loader2 className="w-4 h-4 animate-spin"/>Invio…</>:<><Send className="w-4 h-4"/>Invia scheda</>}
                </motion.button>
              ) : null}
            </div>
            {cooldown>0&&(
              <p className="mt-2 text-xs text-neutral-500 text-right">Prossimo invio tra <span className="font-semibold text-[var(--brand)]">{cooldown}s</span></p>
            )}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white/70 backdrop-blur rounded-2xl ring-1 ring-neutral-200 p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
            <div className="flex items-center gap-2 text-neutral-600">
              <Building2 className="w-4 h-4 text-[var(--brand)]"/>
              <span>© {new Date().getFullYear()} <span className="font-semibold text-neutral-800">Studio CAI</span> — Via Don Rua 39, Roma · 06 7835 9769</span>
            </div>
            <div className="text-xs text-neutral-500 tabular-nums">
              <span className="font-mono font-semibold text-neutral-700">v{APP_VERSION}</span>
              <span className="mx-2">·</span>Build: <span className="font-semibold text-neutral-700">{BUILD_DATE_LABEL}</span>
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
function TF({label,value,onChange,placeholder,type="text",icon,required,error,hint}){
  return(
    <div>
      <label className="text-sm font-semibold text-neutral-700 flex items-center gap-1.5 mb-1.5">
        {label}{required&&<span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {icon&&<span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">{icon}</span>}
        <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
          className={cn("w-full rounded-2xl border py-3 text-sm focus:outline-none focus:ring-2 transition-all bg-white placeholder:text-neutral-400",
            icon?"pl-10 pr-4":"px-4",
            error?"border-red-300 focus:ring-red-500/20 focus:border-red-500":"border-neutral-300 hover:border-neutral-400 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]")}/>
      </div>
      {error?(
        <motion.p initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3"/>{error}
        </motion.p>
      ):hint?<p className="mt-1.5 text-xs text-neutral-500">{hint}</p>:null}
    </div>
  );
}

function SF({label,value,onChange,options=[],required,error}){
  return(
    <div>
      <label className="text-sm font-semibold text-neutral-700 flex items-center gap-1.5 mb-1.5">
        {label}{required&&<span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <select value={value} onChange={e=>onChange(e.target.value)}
          className={cn("appearance-none w-full rounded-2xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 bg-white transition-all",
            error?"border-red-300 focus:ring-red-500/20 focus:border-red-500":"border-neutral-300 hover:border-neutral-400 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]")}>
          <option value="">— Seleziona —</option>
          {options.map(o=><option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"/>
      </div>
      {error&&(
        <motion.p initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}} className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3"/>{error}
        </motion.p>
      )}
    </div>
  );
}

function SummaryBlock({title,icon,children}){
  return(
    <div className="rounded-2xl bg-neutral-50 border border-neutral-200 p-4 space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-6 h-6 rounded-lg bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center">{icon}</span>
        <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">{title}</p>
      </div>
      {children}
    </div>
  );
}

function Row({label,value}){
  if(!value) return null;
  return(
    <div className="flex items-baseline gap-2 text-sm">
      <span className="text-neutral-400 min-w-[80px] text-xs">{label}</span>
      <span className="text-neutral-800 font-medium">{value}</span>
    </div>
  );
}
