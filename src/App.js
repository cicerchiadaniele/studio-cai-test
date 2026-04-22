import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, CheckCircle2, AlertCircle, Building2, Phone, Loader2,
  ChevronDown, X, Info, User, MapPin,
  Hash, Home, Shield, BookUser, Layers
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Costanti
// ─────────────────────────────────────────────────────────────
const APP_VERSION = "1.0";
const BUILD_DATE_LABEL = "22/04/2026";
const WEBHOOK_URL = "https://hook.eu1.make.com/k8agbjzwobv0b2myrdwtu06ztjdefvx8";
const BRAND_NAME = "Studio CAI – Anagrafe Condominiale";
const LOGO_URL = "/logo.jpg";
const PRIMARY_COLOR = "#8B1538";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const cn = (...cls) => cls.filter(Boolean).join(" ");

const S = {
  nome: (v) => v.replace(/[^\p{L}\s'-]/gu, ""),
  luogo: (v) => v.replace(/[^\p{L}\s',-]/gu, ""),
  indirizzo: (v) => v.replace(/[^\p{L}\p{N}\s.,'/°-]/gu, ""),
  comune: (v) => v.replace(/[^\p{L}\s'-]/gu, ""),
  cf: (v) => v.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 16),
  piva: (v) => v.replace(/\D/g, "").slice(0, 11),
  telefono: (v) => v.replace(/[^\d\s+]/g, ""),
  email: (v) => v.replace(/\s/g, ""),
  foglio: (v) => v.replace(/[^\p{L}\p{N}]/gu, ""),
  interno: (v) => v.replace(/[^\p{L}\p{N}]/gu, ""),
  scala: (v) => v.replace(/[^\p{L}\p{N}]/gu, ""),
  piano: (v) => v.replace(/[^\p{L}\p{N}°]/gu, ""),
  zona: (v) => v.replace(/[^\p{L}\p{N}]/gu, ""),
  perc: (v) => v.replace(/[^\d.,]/g, ""),
  denom: (v) => v.replace(/[^\p{L}\p{N}\s.,'&-]/gu, ""),
  cap: (v) => v.replace(/\D/g, "").slice(0, 5),
  prov: (v) => v.replace(/[^\p{L}]/gu, "").toUpperCase().slice(0, 2),
};

const DESTINAZIONI = ["Abitazione","Negozio","Ufficio","Autorimessa","Posto auto","Cantina","Altro"];
const QUALITA_PF = ["Unico Proprietario","Comproprietario","Usufruttuario","Nudo proprietario","Titolare di altro diritto reale"];
const QUALITA_RAPP = ["Legale rappresentante della Società","Tutore del minore","Altro"];
const MODALITA = [
  { key: "racc_stesso", label: "Raccomandata a/r all'indirizzo comunicato" },
  { key: "racc_altro", label: "Raccomandata a/r ad altro indirizzo" },
  { key: "pec", label: "Posta Elettronica Certificata (PEC)" },
];

const emptyUnita = () => ({
  palazzina:"", scala:"", piano:"", interno:"",
  zona:"", foglio:"", particella:"", sub:"", classe:"", categoria:"",
  destinazione:"", destinazioneAltro:"",
});

const initForm = () => ({
  tipoSoggetto: "persona_fisica",
  unita: [emptyUnita()],
  // Proprietario
  nome:"", luogoNascita:"", dataNascita:"", comuneResidenza:"",
  indirizzoResidenza:"", codiceFiscale:"", comuneDomicilio:"", indirizzoDomicilio:"",
  qualitaPF:"", percentuale:"", altroDiritto:"",
  // Rappresentante
  nomeRapp:"", luogoNascitaRapp:"", dataNascitaRapp:"",
  comuneResidenzaRapp:"", cfRapp:"",
  qualitaRapp:"", altroQualitaRapp:"",
  denominazione:"", luogoSoggetto:"", comuneSoggetto:"",
  indirizzoSoggetto:"", pivaCfSoggetto:"",
  qualitaPerUnita:"", percentualeRapp:"", altroDirittoRapp:"",
  // Recapiti
  nomeRecapiti:"", tel1:"", tel2:"", tel3:"",
  email1:"", email2:"", email3:"",
  pec1:"", pec2:"", altroRecapito:"",
  // Corrispondenza
  modalita:"", indirizzoRacc:"", capRacc:"", cittaRacc:"", provRacc:"",
  // Consenso
  consenso: false,
});

// ─────────────────────────────────────────────────────────────
// Componente principale
// ─────────────────────────────────────────────────────────────
export default function AppAnagrafe() {
  const [form, setForm] = useState(initForm());
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [touched, setTouched] = useState({});
  const [showInfo, setShowInfo] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  React.useEffect(() => {
    if (!cooldown) return;
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const cssVars = useMemo(() => ({ "--brand": PRIMARY_COLOR }), []);

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
  const addU = () => form.unita.length < 3 && setForm((s) => ({ ...s, unita: [...s.unita, emptyUnita()] }));
  const remU = (i) => form.unita.length > 1 && setForm((s) => ({ ...s, unita: s.unita.filter((_,j)=>j!==i) }));

  const err = (f) => {
    if (!touched[f]) return null;
    const v = form[f];
    if (["nome","comuneResidenza","indirizzoResidenza","luogoNascita","dataNascita","nomeRecapiti","tel1","modalita"].includes(f) && !v)
      return "Campo obbligatorio";
    if (f==="codiceFiscale") return !v?"Campo obbligatorio": v.length<16?"CF non valido (16 caratteri)":null;
    if (f==="qualitaPF" && form.tipoSoggetto==="persona_fisica" && !v) return "Seleziona la qualità";
    if (f==="percentuale" && form.qualitaPF==="Comproprietario" && !v) return "Indica la percentuale";
    if (f==="altroDiritto" && form.qualitaPF==="Titolare di altro diritto reale" && !v) return "Specifica il titolo";
    if (f==="nomeRapp" && form.tipoSoggetto==="rappresentante" && !v) return "Campo obbligatorio";
    if (f==="qualitaRapp" && form.tipoSoggetto==="rappresentante" && !v) return "Seleziona la qualità";
    if (f==="denominazione" && form.tipoSoggetto==="rappresentante" && !v) return "Campo obbligatorio";
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

  const validate = () => {
    const e=[];
    form.unita.forEach((u,i) => {
      if(!u.destinazione) e.push(`Seleziona la destinazione per l'unità ${i+1}`);
      if(u.destinazione==="Altro"&&!u.destinazioneAltro) e.push(`Specifica la destinazione per l'unità ${i+1}`);
    });
    if(!form.nome) e.push("Inserisci nome e cognome");
    if(!form.codiceFiscale||form.codiceFiscale.length<16) e.push("Codice fiscale non valido (16 caratteri)");
    if(!form.luogoNascita) e.push("Inserisci luogo di nascita");
    if(!form.dataNascita) e.push("Inserisci data di nascita");
    if(!form.comuneResidenza) e.push("Inserisci comune di residenza");
    if(!form.indirizzoResidenza) e.push("Inserisci indirizzo di residenza");
    if(form.tipoSoggetto==="persona_fisica"&&!form.qualitaPF) e.push("Seleziona la qualità del dichiarante");
    if(form.qualitaPF==="Comproprietario"&&!form.percentuale) e.push("Indica la percentuale");
    if(form.qualitaPF==="Titolare di altro diritto reale"&&!form.altroDiritto) e.push("Specifica il titolo del diritto reale");
    if(form.tipoSoggetto==="rappresentante"){
      if(!form.nomeRapp) e.push("Inserisci il nome del rappresentante");
      if(!form.qualitaRapp) e.push("Seleziona la qualità del rappresentante");
      if(!form.denominazione) e.push("Inserisci la denominazione del soggetto");
    }
    if(!form.nomeRecapiti) e.push("Inserisci il nome del titolare dei recapiti");
    if(!form.tel1) e.push("Inserisci almeno un telefono");
    if(!form.modalita) e.push("Seleziona la modalità di corrispondenza");
    if(form.modalita==="racc_altro"){
      if(!form.indirizzoRacc) e.push("Inserisci l'indirizzo raccomandata");
      if(!form.capRacc) e.push("Inserisci il CAP");
      if(!form.cittaRacc) e.push("Inserisci la città");
    }
    if(form.modalita==="pec"&&!form.pec1) e.push("Inserisci l'indirizzo PEC");
    if(!form.consenso) e.push("Conferma la presa visione dell'informativa");
    return e;
  };

  const submit = async () => {
    if(cooldown) return;
    const allT={};
    Object.keys(form).forEach((k)=>{allT[k]=true;});
    form.unita.forEach((_,i)=>{
      ["destinazione","destinazioneAltro","palazzina","scala","piano","interno"].forEach((f)=>{allT[`u_${i}_${f}`]=true;});
    });
    setTouched(allT);
    const errs=validate();
    if(errs.length){setResult({ok:false,error:errs[0]});return;}
    setSending(true); setResult(null);
    const ticket=`ANA-${new Date().toISOString().slice(0,10).replaceAll("-","")}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
    try{
      const fd=new FormData();
      const payload={...form,unita:JSON.stringify(form.unita),ticket,timestamp:new Date().toISOString(),appVersion:APP_VERSION,tipo:"anagrafe_condominiale"};
      Object.entries(payload).forEach(([k,v])=>fd.append(k,String(v)));
      const res=await fetch(WEBHOOK_URL,{method:"POST",body:fd});
      if(!res.ok) throw new Error(`Errore invio: ${res.status}`);
      setResult({ok:true,ticket});
      setCooldown(10);
      setForm(initForm()); setTouched({});
      if(typeof window!=="undefined") window.scrollTo({top:0,behavior:"smooth"});
    }catch(e){
      setResult({ok:false,error:e.message||"Invio non riuscito. Riprova."});
    }finally{setSending(false);}
  };

  return (
    <div className="relative min-h-screen w-full bg-paper bg-noise text-neutral-900" style={cssVars}>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-[var(--brand)]/8 blur-3xl" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 rounded-full bg-[var(--brand)]/5 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 sticky top-0 bg-white/75 backdrop-blur-xl border-b border-neutral-200/70">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-white ring-1 ring-neutral-200 shadow-soft flex items-center justify-center">
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
                <h1 className="font-display font-semibold text-xl sm:text-2xl text-neutral-900 truncate">{BRAND_NAME}</h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-900 text-white tracking-wider">v{APP_VERSION}</span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-600 mt-0.5">Registro Anagrafe Condominiale · art. 10, comma 6, L. 220/2012</p>
            </div>
            <button onClick={()=>setShowInfo(!showInfo)} className="p-2.5 rounded-xl hover:bg-neutral-100 active:bg-neutral-200 transition-colors" aria-label="Info">
              <Info className="w-5 h-5 text-neutral-600" />
            </button>
          </div>
        </div>
      </header>

      {/* Info panel */}
      <AnimatePresence>
        {showInfo&&(
          <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:"auto"}} exit={{opacity:0,height:0}}
            className="relative z-10 bg-[var(--brand)]/5 border-b border-[var(--brand)]/20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-[var(--brand)]/10 flex items-center justify-center">
                  <Info className="w-5 h-5 text-[var(--brand)]" />
                </div>
                <div className="flex-1 text-sm">
                  <p className="font-semibold text-[var(--brand)] mb-1">Come funziona</p>
                  <p className="text-neutral-700">Compila il modulo digitale per il Registro Anagrafe Condominiale (art. 10, comma 6, L. 220/2012). I campi con <span className="text-red-500 font-bold">*</span> sono obbligatori. Al termine premi <span className="font-semibold">Invia scheda</span>.</p>
                </div>
                <button onClick={()=>setShowInfo(false)} className="p-1.5 hover:bg-[var(--brand)]/10 rounded-lg transition-colors">
                  <X className="w-4 h-4 text-[var(--brand)]" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-6 sm:pb-8">
        <motion.div layout className="bg-white rounded-3xl shadow-lift overflow-hidden ring-1 ring-neutral-200/80"
          initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:0.5,delay:0.1}}>

          {/* Card header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[var(--brand)] via-[#6d0f2a] to-[#4f0a1e] px-6 sm:px-8 py-6">
            <div aria-hidden="true" className="absolute inset-0 opacity-20"
              style={{backgroundImage:"radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)",backgroundSize:"32px 32px",backgroundPosition:"0 0, 16px 16px"}} />
            <div className="relative flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/25 flex items-center justify-center">
                <BookUser className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="font-display font-semibold text-xl sm:text-2xl text-white leading-tight">Scheda Anagrafe Condominiale</h2>
                <p className="text-white/85 text-sm mt-1">I campi contrassegnati con * sono obbligatori</p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-10">

            {/* ═══ 1 — Unità Immobiliari ═══ */}
            <Sec step={1} icon={<Home className="w-4 h-4"/>} title="Unità Immobiliari" desc="Dati catastali e destinazione d'uso delle unità nel condominio">
              <div className="space-y-5">
                {form.unita.map((u,idx)=>(
                  <motion.div key={idx} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
                    className="rounded-2xl border border-neutral-200 bg-neutral-50/60 p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[var(--brand)] uppercase tracking-wider">{idx+1}ª Unità</span>
                      {form.unita.length>1&&(
                        <button onClick={()=>remU(idx)} className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-600 transition-colors">
                          <X className="w-4 h-4"/>
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[["palazzina","Palazzina","A","scala"],["scala","Scala","1","scala"],["piano","Piano","3°","piano"],["interno","Interno","5","interno"]].map(([k,l,p,sk])=>(
                        <TF key={k} label={l} value={u[k]} onChange={(v)=>updU(idx,k,v)} placeholder={p} sanitizerKey={sk} />
                      ))}
                    </div>
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Dati catastali</p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      {[["zona","Zona","zona"],["foglio","Foglio","foglio"],["particella","Particella","foglio"],["sub","Sub","foglio"],["classe","Classe","foglio"],["categoria","Categoria","foglio"]].map(([k,l,sk])=>(
                        <TF key={k} label={l} value={u[k]} onChange={(v)=>updU(idx,k,v)} placeholder="—" sanitizerKey={sk} />
                      ))}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <SF label="Destinazione" required value={u.destinazione}
                        onChange={(v)=>{updU(idx,"destinazione",v);if(v!=="Altro")updU(idx,"destinazioneAltro","");}}
                        options={DESTINAZIONI} error={errU(idx,"destinazione")} />
                      {u.destinazione==="Altro"&&(
                        <TF label="Specifica destinazione" required value={u.destinazioneAltro}
                          onChange={(v)=>updU(idx,"destinazioneAltro",v)} placeholder="Es. magazzino"
                          error={errU(idx,"destinazioneAltro")} sanitizerKey="luogo" />
                      )}
                    </div>
                  </motion.div>
                ))}
                {form.unita.length<3&&(
                  <button onClick={addU}
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-2xl border-2 border-dashed border-[var(--brand)]/30 text-[var(--brand)] text-sm font-semibold hover:border-[var(--brand)]/60 hover:bg-[var(--brand)]/5 transition-all">
                    <Layers className="w-4 h-4"/>Aggiungi un'altra unità immobiliare
                  </button>
                )}
              </div>
            </Sec>

            <Div/>

            {/* ═══ 2 — Dati dichiarante ═══ */}
            <Sec step={2} icon={<User className="w-4 h-4"/>} title="Dati del dichiarante" desc="Proprietario o legale rappresentante">
              <div className="space-y-5">
                {/* Toggle */}
                <div className="flex rounded-2xl bg-neutral-100 p-1 gap-1">
                  {[{v:"persona_fisica",l:"Persona fisica"},{v:"rappresentante",l:"Legale rappresentante / tutore"}].map(o=>(
                    <button key={o.v} onClick={()=>updRaw("tipoSoggetto",o.v)}
                      className={cn("flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all",
                        form.tipoSoggetto===o.v?"bg-[var(--brand)] text-white shadow-sm":"text-neutral-600 hover:text-neutral-800")}>
                      {o.l}
                    </button>
                  ))}
                </div>

                {/* Dati anagrafici proprietario */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <TF label="Nome e Cognome" required value={form.nome} onChange={(v)=>upd("nome",v)}
                      placeholder="Es. Rossi Mario" icon={<User className="w-4 h-4"/>} error={err("nome")} sanitizerKey="nome" />
                  </div>
                  <TF label="Luogo di nascita" required value={form.luogoNascita} onChange={(v)=>upd("luogoNascita",v)}
                    placeholder="Es. Roma" error={err("luogoNascita")} sanitizerKey="luogo" />
                  <TF label="Data di nascita" required value={form.dataNascita} onChange={(v)=>updRaw("dataNascita",v)}
                    placeholder="GG/MM/AAAA" type="date" error={err("dataNascita")} sanitizerKey="cf" />
                  <TF label="Comune di residenza" required value={form.comuneResidenza} onChange={(v)=>upd("comuneResidenza",v)}
                    placeholder="Es. Roma" icon={<MapPin className="w-4 h-4"/>} error={err("comuneResidenza")} sanitizerKey="comune" />
                  <TF label="Indirizzo di residenza" required value={form.indirizzoResidenza} onChange={(v)=>upd("indirizzoResidenza",v)}
                    placeholder="Es. Via Roma 10" error={err("indirizzoResidenza")} sanitizerKey="indirizzo" />
                  <TF label="Codice Fiscale" required value={form.codiceFiscale} onChange={(v)=>upd("codiceFiscale",v)}
                    placeholder="RSSMRA80A01H501Z" error={err("codiceFiscale")} hint="16 caratteri" sanitizerKey="cf" />
                  <TF label="Comune di domicilio (se diverso)" value={form.comuneDomicilio} onChange={(v)=>upd("comuneDomicilio",v)}
                    placeholder="Solo se diverso" sanitizerKey="comune" />
                  <TF label="Indirizzo di domicilio (se diverso)" value={form.indirizzoDomicilio} onChange={(v)=>upd("indirizzoDomicilio",v)}
                    placeholder="Solo se diverso" sanitizerKey="indirizzo" />
                </div>

                {/* Qualità — persona fisica */}
                {form.tipoSoggetto==="persona_fisica"&&(
                  <div>
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest mb-3">In qualità di</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <SF label="Qualità" required value={form.qualitaPF}
                        onChange={(v)=>{updRaw("qualitaPF",v);if(v!=="Comproprietario")updRaw("percentuale","");if(v!=="Titolare di altro diritto reale")updRaw("altroDiritto","");}}
                        options={QUALITA_PF} error={err("qualitaPF")} />
                      {form.qualitaPF==="Comproprietario"&&(
                        <TF label="Percentuale %" required value={form.percentuale} onChange={(v)=>upd("percentuale",v)}
                          placeholder="Es. 50" error={err("percentuale")} hint="Quota di proprietà" sanitizerKey="perc" />
                      )}
                      {form.qualitaPF==="Titolare di altro diritto reale"&&(
                        <TF label="Specifica il diritto" required value={form.altroDiritto} onChange={(v)=>upd("altroDiritto",v)}
                          placeholder="Es. diritto di superficie" error={err("altroDiritto")} sanitizerKey="luogo" />
                      )}
                    </div>
                  </div>
                )}

                {/* Rappresentante */}
                {form.tipoSoggetto==="rappresentante"&&(
                  <div className="space-y-5">
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Dati del rappresentante</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <TF label="Nome e Cognome rappresentante" required value={form.nomeRapp} onChange={(v)=>upd("nomeRapp",v)}
                          placeholder="Es. Bianchi Lucia" icon={<User className="w-4 h-4"/>} error={err("nomeRapp")} sanitizerKey="nome" />
                      </div>
                      <TF label="Luogo di nascita" value={form.luogoNascitaRapp} onChange={(v)=>upd("luogoNascitaRapp",v)} placeholder="Es. Milano" sanitizerKey="luogo" />
                      <TF label="Data di nascita" value={form.dataNascitaRapp} onChange={(v)=>updRaw("dataNascitaRapp",v)} type="date" sanitizerKey="cf" />
                      <TF label="Comune di residenza" value={form.comuneResidenzaRapp} onChange={(v)=>upd("comuneResidenzaRapp",v)} placeholder="Es. Milano" sanitizerKey="comune" />
                      <TF label="Codice Fiscale" value={form.cfRapp} onChange={(v)=>upd("cfRapp",v)} placeholder="16 caratteri" sanitizerKey="cf" />
                      <SF label="Qualità" required value={form.qualitaRapp}
                        onChange={(v)=>updRaw("qualitaRapp",v)} options={QUALITA_RAPP} error={err("qualitaRapp")} />
                      {form.qualitaRapp==="Altro"&&(
                        <TF label="Specifica" value={form.altroQualitaRapp} onChange={(v)=>upd("altroQualitaRapp",v)} placeholder="Specifica" sanitizerKey="luogo" />
                      )}
                    </div>
                    <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest pt-1">Soggetto rappresentato</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <TF label="Denominazione / Nome e Cognome" required value={form.denominazione} onChange={(v)=>upd("denominazione",v)}
                          placeholder="Es. Immobiliare Rossi Srl" error={err("denominazione")} sanitizerKey="denom" />
                      </div>
                      <TF label="Luogo / data nascita o costituzione" value={form.luogoSoggetto} onChange={(v)=>upd("luogoSoggetto",v)} placeholder="Es. Roma, 01/01/2000" sanitizerKey="luogo" />
                      <TF label="Comune sede / residenza" value={form.comuneSoggetto} onChange={(v)=>upd("comuneSoggetto",v)} placeholder="Es. Roma" sanitizerKey="comune" />
                      <TF label="Indirizzo sede / residenza" value={form.indirizzoSoggetto} onChange={(v)=>upd("indirizzoSoggetto",v)} placeholder="Es. Via Veneto 1" sanitizerKey="indirizzo" />
                      <TF label="P.IVA o Codice Fiscale" value={form.pivaCfSoggetto} onChange={(v)=>upd("pivaCfSoggetto",v)} placeholder="P.IVA o CF" sanitizerKey="piva" />
                      <SF label="Qualità per le unità" value={form.qualitaPerUnita}
                        onChange={(v)=>{updRaw("qualitaPerUnita",v);if(v!=="Comproprietario")updRaw("percentualeRapp","");if(v!=="Titolare di altro diritto reale")updRaw("altroDirittoRapp","");}}
                        options={QUALITA_PF} />
                      {form.qualitaPerUnita==="Comproprietario"&&(
                        <TF label="Percentuale %" value={form.percentualeRapp} onChange={(v)=>upd("percentualeRapp",v)} placeholder="Es. 50" sanitizerKey="perc" />
                      )}
                      {form.qualitaPerUnita==="Titolare di altro diritto reale"&&(
                        <TF label="Specifica il diritto" value={form.altroDirittoRapp} onChange={(v)=>upd("altroDirittoRapp",v)} placeholder="Es. diritto di superficie" sanitizerKey="luogo" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Sec>

            <Div/>

            {/* ═══ 3 — Recapiti ═══ */}
            <Sec step={3} icon={<Phone className="w-4 h-4"/>} title="Recapiti" desc="Per le comunicazioni tra l'Amministratore e i Condomini (facoltativo salvo telefono)">
              <div className="space-y-4">
                <div className="rounded-2xl bg-[var(--brand)]/5 border border-[var(--brand)]/15 p-4 text-sm text-neutral-700 flex gap-2">
                  <Shield className="w-4 h-4 text-[var(--brand)] flex-shrink-0 mt-0.5"/>
                  <span>I dati sono trattati ai sensi del GDPR (UE) 2016/679 esclusivamente per la gestione condominiale.</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <TF label="Nome e Cognome titolare recapiti" required value={form.nomeRecapiti} onChange={(v)=>upd("nomeRecapiti",v)}
                      placeholder="Es. Rossi Mario" icon={<User className="w-4 h-4"/>} error={err("nomeRecapiti")} sanitizerKey="nome" />
                  </div>
                  <TF label="N. telefono 1" required value={form.tel1} onChange={(v)=>upd("tel1",v)}
                    placeholder="Es. 06 7835 9769" icon={<Phone className="w-4 h-4"/>} error={err("tel1")} sanitizerKey="telefono" />
                  <TF label="N. telefono 2" value={form.tel2} onChange={(v)=>upd("tel2",v)} placeholder="Facoltativo" sanitizerKey="telefono" />
                  <TF label="N. telefono 3" value={form.tel3} onChange={(v)=>upd("tel3",v)} placeholder="Facoltativo" sanitizerKey="telefono" />
                  <TF label="E-mail 1" value={form.email1} onChange={(v)=>upd("email1",v)} placeholder="nome@email.it" type="email" sanitizerKey="email" />
                  <TF label="E-mail 2" value={form.email2} onChange={(v)=>upd("email2",v)} placeholder="Facoltativo" type="email" sanitizerKey="email" />
                  <TF label="E-mail 3" value={form.email3} onChange={(v)=>upd("email3",v)} placeholder="Facoltativo" type="email" sanitizerKey="email" />
                  <TF label="PEC 1" value={form.pec1} onChange={(v)=>upd("pec1",v)} placeholder="nome@pec.it" type="email" sanitizerKey="email" error={err("pec1")} />
                  <TF label="PEC 2" value={form.pec2} onChange={(v)=>upd("pec2",v)} placeholder="Facoltativo" type="email" sanitizerKey="email" />
                  <TF label="Altro recapito" value={form.altroRecapito} onChange={(v)=>upd("altroRecapito",v)} placeholder="Es. Fax, WhatsApp…" sanitizerKey="luogo" />
                </div>
              </div>
            </Sec>

            <Div/>

            {/* ═══ 4 — Corrispondenza ═══ */}
            <Sec step={4} icon={<Send className="w-4 h-4"/>} title="Modalità di corrispondenza" desc="Come desideri ricevere le comunicazioni condominiali">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-neutral-700 mb-2 flex items-center gap-1">
                    Modalità preferita <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2">
                    {MODALITA.map(m=>(
                      <label key={m.key} className="flex items-start gap-3 cursor-pointer group p-3 rounded-2xl hover:bg-neutral-50 transition-colors">
                        <div className="pt-0.5">
                          <input type="radio" name="modalita" value={m.key} checked={form.modalita===m.key}
                            onChange={()=>{updRaw("modalita",m.key);setTouched(t=>({...t,modalita:true}));}}
                            className="sr-only" />
                          <span className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                            form.modalita===m.key?"border-[var(--brand)] bg-[var(--brand)]":"border-neutral-300 bg-white")}>
                            {form.modalita===m.key&&<span className="w-2 h-2 rounded-full bg-white block"/>}
                          </span>
                        </div>
                        <span className="text-sm text-neutral-700 font-medium">{m.label}</span>
                      </label>
                    ))}
                  </div>
                  {touched["modalita"]&&!form.modalita&&(
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>Seleziona una modalità</p>
                  )}
                </div>

                {form.modalita==="racc_altro"&&(
                  <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-3">
                      <TF label="Indirizzo" required value={form.indirizzoRacc} onChange={(v)=>upd("indirizzoRacc",v)}
                        placeholder="Via e numero civico" icon={<MapPin className="w-4 h-4"/>} error={err("indirizzoRacc")} sanitizerKey="indirizzo" />
                    </div>
                    <TF label="CAP" required value={form.capRacc} onChange={(v)=>upd("capRacc",v)} placeholder="00100" error={err("capRacc")} sanitizerKey="cap" />
                    <TF label="Città" required value={form.cittaRacc} onChange={(v)=>upd("cittaRacc",v)} placeholder="Es. Roma" error={err("cittaRacc")} sanitizerKey="comune" />
                    <TF label="Prov" value={form.provRacc} onChange={(v)=>upd("provRacc",v)} placeholder="RM" sanitizerKey="prov" />
                  </motion.div>
                )}

                {form.modalita==="pec"&&(
                  <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} className="space-y-3">
                    <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                      Le comunicazioni via PEC hanno valore di raccomandata (D.P.R. n. 68/2005). Ci si impegna a comunicare ogni variazione.
                    </div>
                    <TF label="Indirizzo PEC" required value={form.pec1} onChange={(v)=>upd("pec1",v)}
                      placeholder="nome@pec.it" type="email" error={err("pec1")} sanitizerKey="email" />
                    <p className="text-xs text-neutral-500">Se non si dispone di PEC, si consiglia di attivarne una per eliminare le spese postali.</p>
                  </motion.div>
                )}
              </div>
            </Sec>

            <Div/>

            {/* Privacy & Consenso */}
            <div className="rounded-2xl bg-gradient-to-br from-neutral-50 to-white p-5 ring-1 ring-neutral-200 space-y-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-[var(--brand)] flex-shrink-0 mt-0.5"/>
                <div className="text-sm text-neutral-700 space-y-2">
                  <p className="font-semibold text-neutral-800">Informativa Privacy (GDPR) — Presa visione obbligatoria</p>
                  <p>I dati saranno trattati ai sensi del Reg. UE 2016/679 e D.lgs. 196/03 per il Registro Anagrafe Condominiale (art. 10, comma 6, L. 220/2012). Il conferimento è obbligatorio. Il condomino è tenuto a comunicare ogni variazione entro 60 gg (art. 1130 c.c.).</p>
                  <p className="text-xs text-neutral-500">Il sottoscritto è consapevole delle responsabilità penali in caso di dichiarazioni mendaci, falsità negli atti o utilizzo di atti falsi, ai sensi degli artt. 75 e 76 del DPR 445/2000.</p>
                </div>
              </div>
              <label className="flex items-start gap-3 cursor-pointer group pt-1">
                <div className="relative pt-0.5">
                  <input type="checkbox" checked={form.consenso} onChange={(e)=>updRaw("consenso",e.target.checked)} className="sr-only"/>
                  <span className={cn("w-5 h-5 rounded-md ring-1 flex items-center justify-center transition-all",
                    form.consenso?"bg-[var(--brand)] ring-[var(--brand)]":"bg-white ring-neutral-300 group-hover:ring-neutral-400")}>
                    {form.consenso&&<CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3}/>}
                  </span>
                </div>
                <span className="text-sm text-neutral-700 flex-1 leading-relaxed">
                  Confermo di aver preso visione dell'informativa, di essere consapevole delle responsabilità penali per dichiarazioni false, e autorizzo il trattamento dei dati per la gestione condominiale.
                  <span className="text-red-500 ml-0.5">*</span>
                </span>
              </label>
            </div>

            {/* Submit */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              <motion.button disabled={sending||cooldown>0} onClick={submit}
                whileHover={!sending&&!cooldown?{scale:1.01}:{}} whileTap={!sending&&!cooldown?{scale:0.99}:{}}
                className={cn("flex-1 relative overflow-hidden inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-white font-semibold text-base transition-all",
                  sending||cooldown?"bg-neutral-400 cursor-not-allowed":"bg-gradient-to-r from-[var(--brand)] via-[#7a1230] to-[#6d0f2a] shadow-lg hover:shadow-xl")}>
                {!(sending||cooldown)&&(
                  <span aria-hidden className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity bg-[linear-gradient(110deg,transparent,rgba(255,255,255,.2),transparent)] bg-[length:200%_100%] animate-shimmer"/>
                )}
                {sending?<><Loader2 className="w-5 h-5 animate-spin"/>Invio in corso…</>:<><Send className="w-5 h-5"/>Invia scheda anagrafica</>}
              </motion.button>
              {cooldown>0&&(
                <motion.div initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} className="text-sm text-neutral-600 text-center px-3">
                  Prossimo invio tra <span className="font-semibold text-[var(--brand)] tabular-nums">{cooldown}s</span>
                </motion.div>
              )}
            </div>

            <AnimatePresence>
              {result&&(
                <motion.div initial={{opacity:0,scale:0.96,y:-10}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.96,y:-10}}
                  className={cn("rounded-2xl border p-5 shadow-soft",
                    result.ok?"bg-gradient-to-br from-green-50 to-white border-green-300":"bg-gradient-to-br from-red-50 to-white border-red-300")}>
                  <div className="flex items-start gap-4">
                    <div className={cn("flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center",result.ok?"bg-green-100":"bg-red-100")}>
                      {result.ok?<CheckCircle2 className="w-6 h-6 text-green-700"/>:<AlertCircle className="w-6 h-6 text-red-700"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      {result.ok?(
                        <>
                          <div className="font-display font-semibold text-green-900 text-lg">Scheda inviata correttamente!</div>
                          <p className="text-sm text-green-800/80 mt-1">La scheda anagrafica è stata trasmessa all'Amministratore.</p>
                          {result.ticket&&(
                            <div className="mt-3 bg-white rounded-xl px-4 py-3 ring-1 ring-green-200">
                              <p className="text-[11px] uppercase tracking-wider text-neutral-500 mb-1 font-semibold">Numero protocollo</p>
                              <p className="font-mono font-bold text-green-700 text-lg tracking-tight select-all break-all">{result.ticket}</p>
                            </div>
                          )}
                        </>
                      ):(
                        <>
                          <div className="font-display font-semibold text-red-900 text-lg">Errore nell'invio</div>
                          <p className="text-sm text-red-700 mt-1">{result.error}</p>
                        </>
                      )}
                    </div>
                    <button onClick={()=>setResult(null)} className="p-1.5 rounded-lg hover:bg-white/60 transition-colors">
                      <X className={cn("w-4 h-4",result.ok?"text-green-700":"text-red-700")}/>
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
// Subcomponents
// ─────────────────────────────────────────────────────────────
function Sec({step,icon,title,desc,children}){
  return(
    <section>
      <header className="flex items-start gap-3 mb-5">
        <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-[var(--brand)]/10 text-[var(--brand)] flex items-center justify-center ring-1 ring-[var(--brand)]/20">{icon}</div>
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">Step {step}</span>
          <h3 className="font-display font-semibold text-lg text-neutral-900 leading-tight">{title}</h3>
          {desc&&<p className="text-sm text-neutral-600 mt-0.5">{desc}</p>}
        </div>
      </header>
      <div className="pl-0 sm:pl-12">{children}</div>
    </section>
  );
}
function Div(){return <div className="h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent"/>;}

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
