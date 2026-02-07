import React, { useMemo, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Building2,
  Shield,
  Loader2,
  ChevronDown,
  Plus,
  Trash2,
  Paperclip,
  FileText,
  ChevronRight,
  ChevronLeft,
  Save,
  Info,
  AlertTriangle,
  Home,
  Users,
  Mail,
  ClipboardList,
} from "lucide-react";

// Helpers
const cn = (...cls) => cls.filter(Boolean).join(" ");
const load = (k, fallback) => {
  try {
    const v = JSON.parse(localStorage.getItem(k) || "");
    return v ?? fallback;
  } catch {
    return fallback;
  }
};

const save = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {
    console.error("Errore salvataggio:", e);
  }
};

const uid = () => Math.random().toString(36).slice(2, 10);

// Validazione Codice Fiscale italiano
const validateCF = (cf) => {
  if (!cf) return true; // empty is ok for optional fields
  const cfRegex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i;
  return cfRegex.test(cf);
};

const DESTINAZIONI = [
  "Abitazione",
  "Negozio",
  "Ufficio",
  "Autorimessa",
  "Posto auto",
  "Cantina",
  "Altro",
];

const QUALITA = [
  "Unico Proprietario",
  "Comproprietario",
  "Usufruttuario",
  "Nudo proprietario",
  "Titolare di altro diritto reale",
];

const STEPS = [
  { id: "condominio", label: "Condominio", icon: Building2 },
  { id: "unita", label: "Unità", icon: Home },
  { id: "dichiarante", label: "Dichiarante", icon: Shield },
  { id: "titolari", label: "Altri titolari", icon: Users },
  { id: "recapiti", label: "Recapiti", icon: Mail },
  { id: "riepilogo", label: "Riepilogo", icon: ClipboardList },
];

export default function DetrazioniFiscali() {
  // Brand / theme / endpoint
  const [brandName] = useState(load("df_brand", "Studio CAI"));
  const [logoUrl] = useState(load("df_logo", "/logo.jpg"));
  const [primary] = useState(load("df_primary", "#16a34a"));
  const [webhook] = useState(
    load("df_webhook", "https://hook.eu1.make.com/hp2vnjhmqpmvb7ju9abtp5f3vg8go3a1")
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [autoSaved, setAutoSaved] = useState(false);

  // Form state
  const [form, setForm] = useState(() => 
    load("df_form_draft", {
      condominio: "",
      indirizzoCondominio: "",
      unita: [
        {
          id: uid(),
          palazzina: "",
          scala: "",
          piano: "",
          interno: "",
          catZona: "",
          catFoglio: "",
          catParticella: "",
          catSub: "",
          catClasse: "",
          catCategoria: "",
          destinazione: "",
          destinazioneAltro: "",
        },
      ],
      dichiaranteTipo: "personaFisica",
      dichiarante: {
        nome: "",
        luogoNascita: "",
        dataNascita: "",
        comuneResidenza: "",
        indirizzoResidenza: "",
        codiceFiscale: "",
        comuneDomicilio: "",
        indirizzoDomicilio: "",
        qualita: "",
        comproprietarioPerc: "",
        altroDiritto: "",
      },
      rappresentanza: {
        qualifica: "",
        qualificaAltro: "",
        soggetto: {
          denominazioneONome: "",
          luogoNascita: "",
          dataNascita: "",
          comuneSedeRes: "",
          indirizzoSedeRes: "",
          pivaOCF: "",
        },
      },
      ulterioriTitolari: [],
      locazionePresente: false,
      locazione: {
        denominazioneONome: "",
        luogoNascita: "",
        dataNascita: "",
        comuneSedeRes: "",
        indirizzoSedeRes: "",
        pivaOCF: "",
      },
      recapiti: {
        intestatario: "",
        telefono1: "",
        telefono2: "",
        telefono3: "",
        email1: "",
        email2: "",
        email3: "",
        pec1: "",
        pec2: "",
        altro: "",
      },
      invio: {
        raccomandataAR: false,
        raccomandataIndirizzo: "",
        raccomandataCap: "",
        raccomandataCitta: "",
        raccomandataProv: "",
        pec: false,
      },
      emailOrdinariaAutorizzata: false,
      emailOrdinaria: {
        email: "",
        viaImmobile: "",
        palazzina: "",
        scala: "",
        piano: "",
        interno: "",
        qualita: "",
        comproprietarioPerc: "",
        altroDiritto: "",
      },
      allegati: [],
      consensoPrivacy: false,
      dataFirma: "",
      firma: "",
    })
  );

  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [cooldown, setCooldown] = useState(0);

  // Auto-save effect
  useEffect(() => {
    const timer = setTimeout(() => {
      save("df_form_draft", form);
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 2000);
    }, 1000);
    return () => clearTimeout(timer);
  }, [form]);

  useEffect(() => {
    if (!cooldown) return;
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const cssVars = useMemo(() => ({ "--brand": primary }), [primary]);

  const update = useCallback((path, value) => {
    setForm((s) => {
      const next = structuredClone(s);
      const keys = path.split(".");
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
      cur[keys[keys.length - 1]] = value;
      return next;
    });
    // Clear error for this field
    setErrors(prev => {
      const next = { ...prev };
      delete next[path];
      return next;
    });
  }, []);

  const addUnita = () =>
    setForm((s) => ({
      ...s,
      unita: [
        ...s.unita,
        {
          id: uid(),
          palazzina: "",
          scala: "",
          piano: "",
          interno: "",
          catZona: "",
          catFoglio: "",
          catParticella: "",
          catSub: "",
          catClasse: "",
          catCategoria: "",
          destinazione: "",
          destinazioneAltro: "",
        },
      ],
    }));

  const removeUnita = (id) =>
    setForm((s) => ({
      ...s,
      unita: s.unita.length <= 1 ? s.unita : s.unita.filter((u) => u.id !== id),
    }));

  const addTitolare = () =>
    setForm((s) => ({
      ...s,
      ulterioriTitolari: [
        ...s.ulterioriTitolari,
        {
          id: uid(),
          denominazioneONome: "",
          luogoNascita: "",
          dataNascita: "",
          comuneSedeRes: "",
          indirizzoSedeRes: "",
          pivaOCF: "",
          comuneDomicilio: "",
          indirizzoDomicilio: "",
          qualita: "",
          comproprietarioPerc: "",
          altroDiritto: "",
        },
      ],
    }));

  const removeTitolare = (id) =>
    setForm((s) => ({
      ...s,
      ulterioriTitolari: s.ulterioriTitolari.filter((t) => t.id !== id),
    }));

  const validateStep = (stepId) => {
    const newErrors = {};
    
    if (stepId === "condominio") {
      if (!form.condominio.trim()) newErrors["condominio"] = "Campo obbligatorio";
    }
    
    if (stepId === "unita") {
      if (!form.unita.length) newErrors["unita"] = "Inserisci almeno una unità";
      form.unita.forEach((u, idx) => {
        const hasId = (u.scala || u.piano || u.interno || u.palazzina).trim?.() || 
                      (u.catFoglio || u.catParticella || u.catSub).trim?.();
        if (!hasId) newErrors[`unita.${idx}`] = "Indica almeno Palazzina/Scala/Piano/Interno oppure Foglio/Particella/Sub";
        if (u.destinazione === "Altro" && !u.destinazioneAltro.trim()) 
          newErrors[`unita.${idx}.destinazioneAltro`] = "Specifica 'Altro'";
      });
    }
    
    if (stepId === "dichiarante") {
      if (!form.dichiarante.nome.trim()) newErrors["dichiarante.nome"] = "Campo obbligatorio";
      if (!form.dichiarante.codiceFiscale.trim()) newErrors["dichiarante.codiceFiscale"] = "Campo obbligatorio";
      else if (!validateCF(form.dichiarante.codiceFiscale)) newErrors["dichiarante.codiceFiscale"] = "Codice Fiscale non valido";
      if (!form.dichiarante.qualita) newErrors["dichiarante.qualita"] = "Seleziona la qualifica";
      if (form.dichiarante.qualita === "Comproprietario" && !form.dichiarante.comproprietarioPerc.trim())
        newErrors["dichiarante.comproprietarioPerc"] = "Campo obbligatorio";
      if (form.dichiarante.qualita === "Titolare di altro diritto reale" && !form.dichiarante.altroDiritto.trim())
        newErrors["dichiarante.altroDiritto"] = "Campo obbligatorio";

      if (form.dichiaranteTipo === "rappresentante") {
        if (!form.rappresentanza.qualifica) newErrors["rappresentanza.qualifica"] = "Seleziona la qualifica";
        if (form.rappresentanza.qualifica === "Altro" && !form.rappresentanza.qualificaAltro.trim())
          newErrors["rappresentanza.qualificaAltro"] = "Campo obbligatorio";
        if (!form.rappresentanza.soggetto.denominazioneONome.trim())
          newErrors["rappresentanza.soggetto.denominazioneONome"] = "Campo obbligatorio";
        if (!form.rappresentanza.soggetto.pivaOCF.trim()) 
          newErrors["rappresentanza.soggetto.pivaOCF"] = "Campo obbligatorio";
      }
    }
    
    if (stepId === "recapiti") {
      if (form.emailOrdinariaAutorizzata) {
        if (!form.emailOrdinaria.email.trim()) newErrors["emailOrdinaria.email"] = "Campo obbligatorio";
        if (!form.emailOrdinaria.qualita) newErrors["emailOrdinaria.qualita"] = "Seleziona la qualifica";
      }
    }
    
    if (stepId === "riepilogo") {
      if (!form.consensoPrivacy) newErrors["consensoPrivacy"] = "Devi accettare l'informativa privacy";
      if (!form.firma.trim()) newErrors["firma"] = "Campo obbligatorio";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(STEPS[currentStep].id)) {
      setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    setCurrentStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async () => {
    if (cooldown) return;
    if (!validateStep("riepilogo")) return;

    setSending(true);
    setResult(null);

    const ticket = `ANAG-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;

    try {
      const fd = new FormData();
      fd.append("ticket", ticket);
      fd.append("timestamp", new Date().toISOString());
      fd.append("condominio", form.condominio);
      fd.append("indirizzoCondominio", form.indirizzoCondominio);
      fd.append("unita_json", JSON.stringify(form.unita));
      fd.append("dichiaranteTipo", form.dichiaranteTipo);
      fd.append("dichiarante_json", JSON.stringify(form.dichiarante));
      fd.append("rappresentanza_json", JSON.stringify(form.rappresentanza));
      fd.append("ulterioriTitolari_json", JSON.stringify(form.ulterioriTitolari));
      fd.append("locazionePresente", String(form.locazionePresente));
      fd.append("locazione_json", JSON.stringify(form.locazione));
      fd.append("recapiti_json", JSON.stringify(form.recapiti));
      fd.append("invio_json", JSON.stringify(form.invio));
      fd.append("emailOrdinariaAutorizzata", String(form.emailOrdinariaAutorizzata));
      fd.append("emailOrdinaria_json", JSON.stringify(form.emailOrdinaria));
      fd.append("consensoPrivacy", String(form.consensoPrivacy));
      fd.append("dataFirma", form.dataFirma);
      fd.append("firma", form.firma);

      (form.allegati || []).forEach((f, idx) => {
        fd.append(`file${idx + 1}`, f, f.name);
      });

      const res = await fetch(webhook, { method: "POST", body: fd });
      if (!res.ok) throw new Error(`Errore invio: ${res.status}`);

      setResult({ ok: true, ticket });
      setCooldown(10);
      
      // Clear draft
      localStorage.removeItem("df_form_draft");
      
      // Reset form
      setForm({
        condominio: "",
        indirizzoCondominio: "",
        unita: [{
          id: uid(),
          palazzina: "",
          scala: "",
          piano: "",
          interno: "",
          catZona: "",
          catFoglio: "",
          catParticella: "",
          catSub: "",
          catClasse: "",
          catCategoria: "",
          destinazione: "",
          destinazioneAltro: "",
        }],
        dichiaranteTipo: "personaFisica",
        dichiarante: {
          nome: "",
          luogoNascita: "",
          dataNascita: "",
          comuneResidenza: "",
          indirizzoResidenza: "",
          codiceFiscale: "",
          comuneDomicilio: "",
          indirizzoDomicilio: "",
          qualita: "",
          comproprietarioPerc: "",
          altroDiritto: "",
        },
        rappresentanza: {
          qualifica: "",
          qualificaAltro: "",
          soggetto: {
            denominazioneONome: "",
            luogoNascita: "",
            dataNascita: "",
            comuneSedeRes: "",
            indirizzoSedeRes: "",
            pivaOCF: "",
          },
        },
        ulterioriTitolari: [],
        locazionePresente: false,
        locazione: {
          denominazioneONome: "",
          luogoNascita: "",
          dataNascita: "",
          comuneSedeRes: "",
          indirizzoSedeRes: "",
          pivaOCF: "",
        },
        recapiti: {
          intestatario: "",
          telefono1: "",
          telefono2: "",
          telefono3: "",
          email1: "",
          email2: "",
          email3: "",
          pec1: "",
          pec2: "",
          altro: "",
        },
        invio: {
          raccomandataAR: false,
          raccomandataIndirizzo: "",
          raccomandataCap: "",
          raccomandataCitta: "",
          raccomandataProv: "",
          pec: false,
        },
        emailOrdinariaAutorizzata: false,
        emailOrdinaria: {
          email: "",
          viaImmobile: "",
          palazzina: "",
          scala: "",
          piano: "",
          interno: "",
          qualita: "",
          comproprietarioPerc: "",
          altroDiritto: "",
        },
        allegati: [],
        consensoPrivacy: false,
        dataFirma: "",
        firma: "",
      });
      setCurrentStep(0);
    } catch (e) {
      setResult({ ok: false, error: e.message || "Invio non riuscito" });
    } finally {
      setSending(false);
    }
  };

  function setUnita(id, key, value) {
    setForm((s) => ({
      ...s,
      unita: s.unita.map((u) => (u.id === id ? { ...u, [key]: value } : u)),
    }));
  }

  function setTitolare(id, key, value) {
    setForm((s) => ({
      ...s,
      ulterioriTitolari: s.ulterioriTitolari.map((t) => (t.id === id ? { ...t, [key]: value } : t)),
    }));
  }

  const stepContent = useMemo(() => {
    switch (STEPS[currentStep].id) {
      case "condominio":
        return <CondominioStep form={form} update={update} errors={errors} />;
      case "unita":
        return <UnitaStep form={form} update={update} errors={errors} setUnita={setUnita} addUnita={addUnita} removeUnita={removeUnita} />;
      case "dichiarante":
        return <DichiaranteStep form={form} update={update} errors={errors} />;
      case "titolari":
        return <TitolariStep form={form} update={update} errors={errors} setTitolare={setTitolare} addTitolare={addTitolare} removeTitolare={removeTitolare} />;
      case "recapiti":
        return <RecapitiStep form={form} update={update} errors={errors} />;
      case "riepilogo":
        return <RiepilogoStep form={form} update={update} errors={errors} />;
      default:
        return null;
    }
  }, [currentStep, form, update, errors, setUnita, addUnita, removeUnita, setTitolare, addTitolare, removeTitolare]);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-neutral-50 to-neutral-100 text-neutral-900" style={cssVars}>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-[var(--brand)]/10 to-[var(--brand)]/5 flex items-center justify-center shadow-inner">
            {logoUrl ? (
              <img src={logoUrl} alt="logo" className="w-full h-full object-contain" />
            ) : (
              <Building2 className="w-8 h-8 text-[var(--brand)]" />
            )}
          </div>
          <div className="flex-1">
            <div className="font-bold text-xl leading-5 text-neutral-800">{brandName}</div>
            <div className="text-sm text-neutral-500 mt-1">Comunicazione Detrazioni Fiscali</div>
          </div>
          <AnimatePresence>
            {autoSaved && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-3 py-1.5 rounded-lg"
              >
                <Save className="w-4 h-4" />
                Salvato
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = idx === currentStep;
              const isCompleted = idx < currentStep;
              
              return (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => idx < currentStep && setCurrentStep(idx)}
                    className={cn(
                      "flex flex-col items-center gap-2 transition-all",
                      isActive && "scale-110",
                      idx > currentStep && "opacity-40"
                    )}
                    disabled={idx > currentStep}
                  >
                    <div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md",
                        isCompleted && "bg-[var(--brand)] text-white",
                        isActive && "bg-[var(--brand)] text-white ring-4 ring-[var(--brand)]/20",
                        !isActive && !isCompleted && "bg-neutral-200 text-neutral-400"
                      )}
                    >
                      {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                    </div>
                    <span className={cn("text-xs font-medium", isActive && "text-[var(--brand)]", !isActive && "text-neutral-500")}>
                      {step.label}
                    </span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div className="flex-1 h-0.5 mx-2 bg-neutral-200">
                      <div
                        className="h-full bg-[var(--brand)] transition-all duration-500"
                        style={{ width: idx < currentStep ? "100%" : "0%" }}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl shadow-xl p-6 md:p-8"
          >
            {stepContent}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t">
              <button
                onClick={prevStep}
                disabled={currentStep === 0}
                className={cn(
                  "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all",
                  currentStep === 0
                    ? "opacity-0 cursor-not-allowed"
                    : "bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
                )}
              >
                <ChevronLeft className="w-4 h-4" /> Indietro
              </button>

              <div className="text-sm text-neutral-500">
                Passo {currentStep + 1} di {STEPS.length}
              </div>

              {currentStep < STEPS.length - 1 ? (
                <button
                  onClick={nextStep}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--brand)] text-white hover:opacity-90 transition-all font-medium text-sm shadow-lg shadow-[var(--brand)]/25"
                >
                  Avanti <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  disabled={sending || cooldown > 0}
                  onClick={submit}
                  className={cn(
                    "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium text-sm transition-all",
                    sending || cooldown ? "bg-neutral-400 cursor-not-allowed" : "bg-[var(--brand)] hover:opacity-90 shadow-lg shadow-[var(--brand)]/25"
                  )}
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Invio in corso...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Invia modulo
                    </>
                  )}
                </button>
              )}
            </div>

            {cooldown > 0 && (
              <div className="mt-4 text-center text-sm text-neutral-500">
                Puoi inviare un altro modulo tra {cooldown}s
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                "mt-6 rounded-2xl border-2 p-6 text-sm flex items-start gap-3 shadow-lg",
                result.ok ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"
              )}
            >
              {result.ok ? (
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                {result.ok ? (
                  <div>
                    <div className="font-bold text-lg text-green-800">Modulo inviato con successo!</div>
                    {result.ticket && (
                      <div className="mt-2 text-green-700">
                        Il tuo numero pratica è:{" "}
                        <span className="font-mono font-bold text-green-900 bg-green-100 px-2 py-1 rounded">
                          {result.ticket}
                        </span>
                      </div>
                    )}
                    <div className="mt-2 text-sm text-green-600">
                      Conserva questo numero per eventuali comunicazioni future.
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="font-bold text-lg text-red-800">Invio non riuscito</div>
                    <div className="mt-1 text-red-700">{result.error}</div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="max-w-6xl mx-auto px-4 py-8 text-xs text-neutral-500">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>© {new Date().getFullYear()} {brandName}. Tutti i diritti riservati.</div>
          <div className="text-right">v2.0 – Modulo Anagrafe Condominiale (Enhanced)</div>
        </div>
      </footer>
    </div>
  );
}

// UI Components (definite prima per essere disponibili agli Step Components)
function TextField({ label, value, onChange, placeholder, type = "text", required, error, helpText }) {
  return (
    <div>
      <label className="text-sm font-semibold text-neutral-700 mb-1.5 block">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={cn(
          "w-full rounded-xl border-2 px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2",
          error
            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
            : "border-neutral-200 focus:border-[var(--brand)] focus:ring-[var(--brand)]/20"
        )}
      />
      {error && (
        <div className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          {error}
        </div>
      )}
      {helpText && !error && <div className="mt-1.5 text-xs text-neutral-500">{helpText}</div>}
    </div>
  );
}

function SelectField({ label, value, onChange, options = [], required, error }) {
  const normalized = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <div>
      <label className="text-sm font-semibold text-neutral-700 mb-1.5 block">
        {label}
        {required && <span className="text-red-600 ml-1">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "appearance-none w-full rounded-xl border-2 px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 bg-white",
            error
              ? "border-red-300 focus:border-red-500 focus:ring-red-200"
              : "border-neutral-200 focus:border-[var(--brand)] focus:ring-[var(--brand)]/20"
          )}
          required={required}
        >
          <option value="">-- Seleziona --</option>
          {normalized.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
      </div>
      {error && (
        <div className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          {error}
        </div>
      )}
    </div>
  );
}

function Divider() {
  return <div className="my-6 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />;
}

function InfoBox({ children, className }) {
  return (
    <div className={cn("flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl", className)}>
      {children}
    </div>
  );
}

function DataRow({ label, value }) {
  return (
    <div className="flex items-start gap-2">
      <span className="font-semibold text-neutral-700 min-w-[140px]">{label}:</span>
      <span className="text-neutral-600">{value || "—"}</span>
    </div>
  );
}

// Step Components
function CondominioStep({ form, update, errors }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">Informazioni Condominio</h2>
        <p className="text-neutral-600">Inserisci i dati identificativi del condominio di riferimento.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField
          label="Condominio (riferimento)"
          placeholder="Es. Via Don Rua 39 – Roma"
          value={form.condominio}
          onChange={(v) => update("condominio", v)}
          error={errors["condominio"]}
          required
          helpText="Indicare l'indirizzo completo o il nome del condominio"
        />
        <TextField
          label="Indirizzo unità / note"
          placeholder="Es. Via/Piazza…, civico…"
          value={form.indirizzoCondominio}
          onChange={(v) => update("indirizzoCondominio", v)}
          helpText="Campo facoltativo per note aggiuntive"
        />
      </div>

      <InfoBox>
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <strong>Nota:</strong> Il riferimento al condominio è fondamentale per collegare correttamente la scheda anagrafica al registro condominiale.
        </div>
      </InfoBox>
    </div>
  );
}

function UnitaStep({ form, update, errors, setUnita, addUnita, removeUnita }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">Unità Immobiliari</h2>
        <p className="text-neutral-600">Inserisci i dati identificativi di ogni unità immobiliare.</p>
      </div>

      <div className="space-y-4">
        {form.unita.map((u, idx) => (
          <motion.div
            key={u.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border-2 border-neutral-200 p-5 bg-gradient-to-br from-white to-neutral-50"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-neutral-800 flex items-center gap-2">
                <Home className="w-5 h-5 text-[var(--brand)]" />
                Unità {idx + 1}
              </h3>
              {form.unita.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeUnita(u.id)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-200 text-sm text-red-600 hover:bg-red-50 transition-all"
                >
                  <Trash2 className="w-4 h-4" /> Rimuovi
                </button>
              )}
            </div>

            {errors[`unita.${idx}`] && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-red-700">{errors[`unita.${idx}`]}</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <TextField
                  label="Palazzina"
                  value={u.palazzina}
                  onChange={(v) => setUnita(u.id, "palazzina", v)}
                  placeholder="Es. A, B2"
                />
                <div className="grid grid-cols-3 gap-3">
                  <TextField
                    label="Scala"
                    value={u.scala}
                    onChange={(v) => setUnita(u.id, "scala", v)}
                    placeholder="A"
                  />
                  <TextField
                    label="Piano"
                    value={u.piano}
                    onChange={(v) => setUnita(u.id, "piano", v)}
                    placeholder="1"
                  />
                  <TextField
                    label="Interno"
                    value={u.interno}
                    onChange={(v) => setUnita(u.id, "interno", v)}
                    placeholder="12"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="text-sm font-medium text-neutral-700 mb-3">Dati catastali</div>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  <TextField label="Zona" value={u.catZona} onChange={(v) => setUnita(u.id, "catZona", v)} />
                  <TextField label="Foglio" value={u.catFoglio} onChange={(v) => setUnita(u.id, "catFoglio", v)} />
                  <TextField label="Particella" value={u.catParticella} onChange={(v) => setUnita(u.id, "catParticella", v)} />
                  <TextField label="Sub" value={u.catSub} onChange={(v) => setUnita(u.id, "catSub", v)} />
                  <TextField label="Classe" value={u.catClasse} onChange={(v) => setUnita(u.id, "catClasse", v)} />
                  <TextField label="Categoria" value={u.catCategoria} onChange={(v) => setUnita(u.id, "catCategoria", v)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SelectField
                  label="Destinazione"
                  value={u.destinazione}
                  onChange={(v) => setUnita(u.id, "destinazione", v)}
                  options={DESTINAZIONI}
                />
                {u.destinazione === "Altro" && (
                  <TextField
                    label="Destinazione – Altro"
                    value={u.destinazioneAltro}
                    onChange={(v) => setUnita(u.id, "destinazioneAltro", v)}
                    placeholder="Specificare"
                    required
                    error={errors[`unita.${idx}.destinazioneAltro`]}
                  />
                )}
              </div>
            </div>
          </motion.div>
        ))}

        <button
          type="button"
          onClick={addUnita}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[var(--brand)] to-[var(--brand)]/80 text-white hover:opacity-90 transition-all font-medium shadow-lg shadow-[var(--brand)]/20"
        >
          <Plus className="w-5 h-5" /> Aggiungi un'altra unità
        </button>
      </div>
    </div>
  );
}

function DichiaranteStep({ form, update, errors }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">Dati Dichiarante</h2>
        <p className="text-neutral-600">Inserisci i dati del soggetto che compila e sottoscrive la scheda.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SelectField
          label="Tipologia dichiarante"
          value={form.dichiaranteTipo}
          onChange={(v) => update("dichiaranteTipo", v)}
          options={[
            { value: "personaFisica", label: "Persona fisica" },
            { value: "rappresentante", label: "Legale rappresentante / tutore / altro" },
          ]}
          required
        />
        <SelectField
          label="In qualità di"
          value={form.dichiarante.qualita}
          onChange={(v) => update("dichiarante.qualita", v)}
          options={QUALITA}
          error={errors["dichiarante.qualita"]}
          required
        />
      </div>

      {form.dichiarante.qualita === "Comproprietario" && (
        <TextField
          label="Percentuale comproprietà"
          value={form.dichiarante.comproprietarioPerc}
          onChange={(v) => update("dichiarante.comproprietarioPerc", v)}
          placeholder="Es. 50"
          error={errors["dichiarante.comproprietarioPerc"]}
          required
        />
      )}

      {form.dichiarante.qualita === "Titolare di altro diritto reale" && (
        <TextField
          label="Altro diritto reale"
          value={form.dichiarante.altroDiritto}
          onChange={(v) => update("dichiarante.altroDiritto", v)}
          placeholder="Specificare"
          error={errors["dichiarante.altroDiritto"]}
          required
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField
          label="Nome e Cognome"
          value={form.dichiarante.nome}
          onChange={(v) => update("dichiarante.nome", v)}
          error={errors["dichiarante.nome"]}
          required
        />
        <TextField
          label="Codice Fiscale"
          value={form.dichiarante.codiceFiscale}
          onChange={(v) => update("dichiarante.codiceFiscale", v.toUpperCase())}
          error={errors["dichiarante.codiceFiscale"]}
          required
          helpText="Formato: 16 caratteri alfanumerici"
        />
        <TextField
          label="Luogo di nascita"
          value={form.dichiarante.luogoNascita}
          onChange={(v) => update("dichiarante.luogoNascita", v)}
        />
        <TextField
          label="Data di nascita"
          type="date"
          value={form.dichiarante.dataNascita}
          onChange={(v) => update("dichiarante.dataNascita", v)}
        />
        <TextField
          label="Comune di residenza"
          value={form.dichiarante.comuneResidenza}
          onChange={(v) => update("dichiarante.comuneResidenza", v)}
        />
        <TextField
          label="Indirizzo di residenza"
          value={form.dichiarante.indirizzoResidenza}
          onChange={(v) => update("dichiarante.indirizzoResidenza", v)}
        />
        <TextField
          label="Comune di domicilio (se diverso)"
          value={form.dichiarante.comuneDomicilio}
          onChange={(v) => update("dichiarante.comuneDomicilio", v)}
        />
        <TextField
          label="Indirizzo domicilio (se diverso)"
          value={form.dichiarante.indirizzoDomicilio}
          onChange={(v) => update("dichiarante.indirizzoDomicilio", v)}
        />
      </div>

      {form.dichiaranteTipo === "rappresentante" && (
        <div className="mt-6 rounded-2xl border-2 border-blue-200 p-5 bg-blue-50">
          <h3 className="font-bold text-lg text-blue-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Dati rappresentanza
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SelectField
                label="Qualifica"
                value={form.rappresentanza.qualifica}
                onChange={(v) => update("rappresentanza.qualifica", v)}
                options={["Legale rappresentante della Società", "Tutore del minore", "Altro"]}
                error={errors["rappresentanza.qualifica"]}
                required
              />
              {form.rappresentanza.qualifica === "Altro" && (
                <TextField
                  label="Qualifica – Altro"
                  value={form.rappresentanza.qualificaAltro}
                  onChange={(v) => update("rappresentanza.qualificaAltro", v)}
                  placeholder="Specificare"
                  error={errors["rappresentanza.qualificaAltro"]}
                  required
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                label="Denominazione o Nome e Cognome (rappresentato)"
                value={form.rappresentanza.soggetto.denominazioneONome}
                onChange={(v) => update("rappresentanza.soggetto.denominazioneONome", v)}
                error={errors["rappresentanza.soggetto.denominazioneONome"]}
                required
              />
              <TextField
                label="P.IVA o Codice Fiscale (rappresentato)"
                value={form.rappresentanza.soggetto.pivaOCF}
                onChange={(v) => update("rappresentanza.soggetto.pivaOCF", v.toUpperCase())}
                error={errors["rappresentanza.soggetto.pivaOCF"]}
                required
              />
              <TextField
                label="Luogo di nascita"
                value={form.rappresentanza.soggetto.luogoNascita}
                onChange={(v) => update("rappresentanza.soggetto.luogoNascita", v)}
              />
              <TextField
                label="Data di nascita"
                type="date"
                value={form.rappresentanza.soggetto.dataNascita}
                onChange={(v) => update("rappresentanza.soggetto.dataNascita", v)}
              />
              <TextField
                label="Comune sede/residenza"
                value={form.rappresentanza.soggetto.comuneSedeRes}
                onChange={(v) => update("rappresentanza.soggetto.comuneSedeRes", v)}
              />
              <TextField
                label="Indirizzo sede/residenza"
                value={form.rappresentanza.soggetto.indirizzoSedeRes}
                onChange={(v) => update("rappresentanza.soggetto.indirizzoSedeRes", v)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TitolariStep({ form, update, errors, setTitolare, addTitolare, removeTitolare }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">Altri Titolari e Locazioni</h2>
        <p className="text-neutral-600">Informazioni su ulteriori titolari di diritti reali ed eventuali locazioni.</p>
      </div>

      {/* Ulteriori titolari */}
      <div>
        <h3 className="font-semibold text-lg text-neutral-700 mb-3 flex items-center gap-2">
          <Users className="w-5 h-5 text-[var(--brand)]" />
          Ulteriori titolari di diritti reali / detrazioni fiscali
        </h3>
        <p className="text-sm text-neutral-600 mb-4">Se presenti, inserire i dati dei soggetti ulteriori.</p>

        <div className="space-y-4">
          {form.ulterioriTitolari.length === 0 && (
            <div className="text-sm text-neutral-500 italic p-4 bg-neutral-50 rounded-xl border border-dashed border-neutral-300">
              Nessun ulteriore titolare inserito. Clicca sul pulsante sotto per aggiungerne uno.
            </div>
          )}

          {form.ulterioriTitolari.map((t, idx) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border-2 border-neutral-200 p-5 bg-gradient-to-br from-white to-neutral-50"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-neutral-800">Titolare {idx + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeTitolare(t.id)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-200 text-sm text-red-600 hover:bg-red-50 transition-all"
                >
                  <Trash2 className="w-4 h-4" /> Rimuovi
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <TextField
                  label="Denominazione o Nome e Cognome"
                  value={t.denominazioneONome}
                  onChange={(v) => setTitolare(t.id, "denominazioneONome", v)}
                />
                <TextField
                  label="P.IVA o Codice Fiscale"
                  value={t.pivaOCF}
                  onChange={(v) => setTitolare(t.id, "pivaOCF", v.toUpperCase())}
                />
                <TextField
                  label="Luogo di nascita"
                  value={t.luogoNascita}
                  onChange={(v) => setTitolare(t.id, "luogoNascita", v)}
                />
                <TextField
                  label="Data di nascita"
                  type="date"
                  value={t.dataNascita}
                  onChange={(v) => setTitolare(t.id, "dataNascita", v)}
                />
                <TextField
                  label="Comune sede/residenza"
                  value={t.comuneSedeRes}
                  onChange={(v) => setTitolare(t.id, "comuneSedeRes", v)}
                />
                <TextField
                  label="Indirizzo sede/residenza"
                  value={t.indirizzoSedeRes}
                  onChange={(v) => setTitolare(t.id, "indirizzoSedeRes", v)}
                />
                <TextField
                  label="Comune domicilio (se diverso)"
                  value={t.comuneDomicilio}
                  onChange={(v) => setTitolare(t.id, "comuneDomicilio", v)}
                />
                <TextField
                  label="Indirizzo domicilio (se diverso)"
                  value={t.indirizzoDomicilio}
                  onChange={(v) => setTitolare(t.id, "indirizzoDomicilio", v)}
                />
                <SelectField
                  label="In qualità di"
                  value={t.qualita}
                  onChange={(v) => setTitolare(t.id, "qualita", v)}
                  options={QUALITA}
                />
                {t.qualita === "Comproprietario" && (
                  <TextField
                    label="Percentuale comproprietà"
                    value={t.comproprietarioPerc}
                    onChange={(v) => setTitolare(t.id, "comproprietarioPerc", v)}
                    placeholder="Es. 50"
                  />
                )}
                {t.qualita === "Titolare di altro diritto reale" && (
                  <TextField
                    label="Altro diritto reale"
                    value={t.altroDiritto}
                    onChange={(v) => setTitolare(t.id, "altroDiritto", v)}
                    placeholder="Specificare"
                  />
                )}
              </div>
            </motion.div>
          ))}

          <button
            type="button"
            onClick={addTitolare}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[var(--brand)] to-[var(--brand)]/80 text-white hover:opacity-90 transition-all font-medium shadow-lg shadow-[var(--brand)]/20"
          >
            <Plus className="w-5 h-5" /> Aggiungi titolare
          </button>
        </div>
      </div>

      <Divider />

      {/* Locazione/Comodato */}
      <div>
        <h3 className="font-semibold text-lg text-neutral-700 mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5 text-[var(--brand)]" />
          Locazione / Comodato
        </h3>
        <p className="text-sm text-neutral-600 mb-4">Compilare solo se l'unità risulta locata o concessa in comodato.</p>

        <div className="flex items-start gap-2 mb-4">
          <input
            id="loc"
            type="checkbox"
            checked={form.locazionePresente}
            onChange={(e) => update("locazionePresente", e.target.checked)}
            className="mt-1 w-4 h-4 text-[var(--brand)] rounded focus:ring-[var(--brand)]"
          />
          <label htmlFor="loc" className="text-sm text-neutral-700 font-medium">
            Sì, è presente una locazione o un comodato
          </label>
        </div>

        <AnimatePresence>
          {form.locazionePresente && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              <TextField
                label="Denominazione o Nome e Cognome"
                value={form.locazione.denominazioneONome}
                onChange={(v) => update("locazione.denominazioneONome", v)}
                required
              />
              <TextField
                label="P.IVA o Codice Fiscale"
                value={form.locazione.pivaOCF}
                onChange={(v) => update("locazione.pivaOCF", v.toUpperCase())}
              />
              <TextField
                label="Luogo di nascita"
                value={form.locazione.luogoNascita}
                onChange={(v) => update("locazione.luogoNascita", v)}
              />
              <TextField
                label="Data di nascita"
                type="date"
                value={form.locazione.dataNascita}
                onChange={(v) => update("locazione.dataNascita", v)}
              />
              <TextField
                label="Comune sede/residenza"
                value={form.locazione.comuneSedeRes}
                onChange={(v) => update("locazione.comuneSedeRes", v)}
              />
              <TextField
                label="Indirizzo sede/residenza"
                value={form.locazione.indirizzoSedeRes}
                onChange={(v) => update("locazione.indirizzoSedeRes", v)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function RecapitiStep({ form, update, errors }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">Recapiti e Preferenze</h2>
        <p className="text-neutral-600">Informazioni di contatto e modalità di invio comunicazioni.</p>
      </div>

      {/* Recapiti utili */}
      <div>
        <h3 className="font-semibold text-lg text-neutral-700 mb-3 flex items-center gap-2">
          <Mail className="w-5 h-5 text-[var(--brand)]" />
          Recapiti utili
        </h3>
        <p className="text-sm text-neutral-600 mb-4">Dati facoltativi per agevolare le comunicazioni.</p>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TextField
              label="Nome e cognome intestatario recapiti"
              value={form.recapiti.intestatario}
              onChange={(v) => update("recapiti.intestatario", v)}
            />
            <TextField
              label="Altro (facoltativo)"
              value={form.recapiti.altro}
              onChange={(v) => update("recapiti.altro", v)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <TextField
              label="Telefono 1"
              value={form.recapiti.telefono1}
              onChange={(v) => update("recapiti.telefono1", v)}
              placeholder="+39 ..."
            />
            <TextField
              label="Telefono 2"
              value={form.recapiti.telefono2}
              onChange={(v) => update("recapiti.telefono2", v)}
              placeholder="+39 ..."
            />
            <TextField
              label="Telefono 3"
              value={form.recapiti.telefono3}
              onChange={(v) => update("recapiti.telefono3", v)}
              placeholder="+39 ..."
            />
            <TextField
              label="Email 1"
              value={form.recapiti.email1}
              onChange={(v) => update("recapiti.email1", v)}
              type="email"
            />
            <TextField
              label="Email 2"
              value={form.recapiti.email2}
              onChange={(v) => update("recapiti.email2", v)}
              type="email"
            />
            <TextField
              label="Email 3"
              value={form.recapiti.email3}
              onChange={(v) => update("recapiti.email3", v)}
              type="email"
            />
            <TextField
              label="PEC 1"
              value={form.recapiti.pec1}
              onChange={(v) => update("recapiti.pec1", v)}
              type="email"
            />
            <TextField
              label="PEC 2"
              value={form.recapiti.pec2}
              onChange={(v) => update("recapiti.pec2", v)}
              type="email"
            />
          </div>
        </div>
      </div>

      <Divider />

      {/* Preferenze invio */}
      <div>
        <h3 className="font-semibold text-lg text-neutral-700 mb-3">Preferenze modalità di invio</h3>
        <p className="text-sm text-neutral-600 mb-4">Indicare la modalità preferita per le comunicazioni.</p>

        <div className="space-y-4">
          <div className="flex items-start gap-2">
            <input
              id="rac"
              type="checkbox"
              checked={form.invio.raccomandataAR}
              onChange={(e) => update("invio.raccomandataAR", e.target.checked)}
              className="mt-1 w-4 h-4 text-[var(--brand)] rounded focus:ring-[var(--brand)]"
            />
            <label htmlFor="rac" className="text-sm text-neutral-700 font-medium">
              Tutta la corrispondenza via raccomandata A/R
            </label>
          </div>

          <AnimatePresence>
            {form.invio.raccomandataAR && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-6"
              >
                <TextField
                  label="Indirizzo"
                  value={form.invio.raccomandataIndirizzo}
                  onChange={(v) => update("invio.raccomandataIndirizzo", v)}
                />
                <div className="grid grid-cols-3 gap-3">
                  <TextField
                    label="CAP"
                    value={form.invio.raccomandataCap}
                    onChange={(v) => update("invio.raccomandataCap", v)}
                    placeholder="00000"
                  />
                  <TextField
                    label="Città"
                    value={form.invio.raccomandataCitta}
                    onChange={(v) => update("invio.raccomandataCitta", v)}
                  />
                  <TextField
                    label="Prov."
                    value={form.invio.raccomandataProv}
                    onChange={(v) => update("invio.raccomandataProv", v.toUpperCase())}
                    placeholder="RM"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-start gap-2">
            <input
              id="pec"
              type="checkbox"
              checked={form.invio.pec}
              onChange={(e) => update("invio.pec", e.target.checked)}
              className="mt-1 w-4 h-4 text-[var(--brand)] rounded focus:ring-[var(--brand)]"
            />
            <label htmlFor="pec" className="text-sm text-neutral-700 font-medium">
              Comunicazioni tramite PEC (con valore di raccomandata)
            </label>
          </div>
        </div>
      </div>

      <Divider />

      {/* Email ordinaria */}
      <div>
        <h3 className="font-semibold text-lg text-neutral-700 mb-3">Autorizzazione invio via email ordinaria</h3>
        <p className="text-sm text-neutral-600 mb-4">
          Consente invio convocazioni/verbali e comunicazioni via email ordinaria (senza valore legale).
        </p>

        <div className="flex items-start gap-2 mb-4">
          <input
            id="mailord"
            type="checkbox"
            checked={form.emailOrdinariaAutorizzata}
            onChange={(e) => update("emailOrdinariaAutorizzata", e.target.checked)}
            className="mt-1 w-4 h-4 text-[var(--brand)] rounded focus:ring-[var(--brand)]"
          />
          <label htmlFor="mailord" className="text-sm text-neutral-700 font-medium">
            Autorizzo l'invio tramite posta elettronica ordinaria
          </label>
        </div>

        <AnimatePresence>
          {form.emailOrdinariaAutorizzata && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-2xl border-2 border-neutral-200 p-5 bg-neutral-50"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <TextField
                  label="Email ordinaria"
                  value={form.emailOrdinaria.email}
                  onChange={(v) => update("emailOrdinaria.email", v)}
                  type="email"
                  error={errors["emailOrdinaria.email"]}
                  required
                />
                <SelectField
                  label="In qualità di"
                  value={form.emailOrdinaria.qualita}
                  onChange={(v) => update("emailOrdinaria.qualita", v)}
                  options={QUALITA}
                  error={errors["emailOrdinaria.qualita"]}
                  required
                />
                {form.emailOrdinaria.qualita === "Comproprietario" && (
                  <TextField
                    label="Percentuale comproprietà"
                    value={form.emailOrdinaria.comproprietarioPerc}
                    onChange={(v) => update("emailOrdinaria.comproprietarioPerc", v)}
                    required
                  />
                )}
                {form.emailOrdinaria.qualita === "Titolare di altro diritto reale" && (
                  <TextField
                    label="Altro diritto reale"
                    value={form.emailOrdinaria.altroDiritto}
                    onChange={(v) => update("emailOrdinaria.altroDiritto", v)}
                    required
                  />
                )}
                <TextField
                  label="Via immobile"
                  value={form.emailOrdinaria.viaImmobile}
                  onChange={(v) => update("emailOrdinaria.viaImmobile", v)}
                  placeholder="Es. Via …"
                />
                <div className="grid grid-cols-4 gap-3">
                  <TextField
                    label="Pal."
                    value={form.emailOrdinaria.palazzina}
                    onChange={(v) => update("emailOrdinaria.palazzina", v)}
                  />
                  <TextField
                    label="Scala"
                    value={form.emailOrdinaria.scala}
                    onChange={(v) => update("emailOrdinaria.scala", v)}
                  />
                  <TextField
                    label="Piano"
                    value={form.emailOrdinaria.piano}
                    onChange={(v) => update("emailOrdinaria.piano", v)}
                  />
                  <TextField
                    label="Int."
                    value={form.emailOrdinaria.interno}
                    onChange={(v) => update("emailOrdinaria.interno", v)}
                  />
                </div>
              </div>
              <InfoBox className="mt-4">
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="text-xs text-blue-800">
                  L'email ordinaria non ha valore legale; l'autorizzazione ha finalità di riduzione costi di spedizione e fotocopie.
                </span>
              </InfoBox>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function RiepilogoStep({ form, update, errors }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">Riepilogo e Firma</h2>
        <p className="text-neutral-600">Verifica i dati inseriti, carica eventuali allegati e procedi con la firma digitale.</p>
      </div>

      {/* Riepilogo dati */}
      <div className="rounded-2xl border-2 border-neutral-200 p-5 bg-gradient-to-br from-neutral-50 to-white">
        <h3 className="font-bold text-lg text-neutral-800 mb-4">Riepilogo dati inseriti</h3>
        <div className="space-y-3 text-sm">
          <DataRow label="Condominio" value={form.condominio} />
          <DataRow label="Unità immobiliari" value={`${form.unita.length} unità`} />
          <DataRow label="Dichiarante" value={form.dichiarante.nome} />
          <DataRow label="Codice Fiscale" value={form.dichiarante.codiceFiscale} />
          <DataRow label="Qualità" value={form.dichiarante.qualita} />
          {form.ulterioriTitolari.length > 0 && (
            <DataRow label="Altri titolari" value={`${form.ulterioriTitolari.length} titolare/i`} />
          )}
          {form.locazionePresente && (
            <DataRow label="Locazione/Comodato" value={form.locazione.denominazioneONome} />
          )}
        </div>
      </div>

      {/* Allegati */}
      <div>
        <h3 className="font-semibold text-lg text-neutral-700 mb-3 flex items-center gap-2">
          <Paperclip className="w-5 h-5 text-[var(--brand)]" />
          Allegati
        </h3>
        <p className="text-sm text-neutral-600 mb-4">
          Caricare, se disponibili, copie dei documenti di identità e codici fiscali (dichiarante e altri aventi diritto).
        </p>

        <input
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => update("allegati", Array.from(e.target.files || []))}
          className="block w-full text-sm text-neutral-700 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-[var(--brand)] file:text-white hover:file:opacity-90 file:transition-all file:cursor-pointer border-2 border-dashed border-neutral-300 rounded-xl p-4 hover:border-[var(--brand)] transition-all"
        />
        {(form.allegati || []).length > 0 && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-xl">
            <div className="text-sm font-medium text-green-800 mb-1">
              {form.allegati.length} file caricato/i:
            </div>
            <div className="text-xs text-green-700">
              {(form.allegati || []).map((f) => f.name).join(", ")}
            </div>
          </div>
        )}
      </div>

      <Divider />

      {/* Privacy e firma */}
      <div>
        <h3 className="font-semibold text-lg text-neutral-700 mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5 text-[var(--brand)]" />
          Privacy e firma
        </h3>
        <p className="text-sm text-neutral-600 mb-4">
          Il conferimento dei dati richiesti dal registro anagrafe è obbligatorio; i recapiti aggiuntivi sono facoltativi.
        </p>

        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <input
              id="cons"
              type="checkbox"
              checked={form.consensoPrivacy}
              onChange={(e) => update("consensoPrivacy", e.target.checked)}
              className="mt-1 w-4 h-4 text-[var(--brand)] rounded focus:ring-[var(--brand)]"
            />
            <label htmlFor="cons" className="text-sm text-blue-900 font-medium">
              Ho letto e accetto l'informativa privacy e autorizzo il trattamento dei dati per finalità connesse alla gestione condominiale.
            </label>
          </div>
          {errors["consensoPrivacy"] && (
            <div className="text-sm text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {errors["consensoPrivacy"]}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Data"
              type="date"
              value={form.dataFirma}
              onChange={(v) => update("dataFirma", v)}
            />
            <TextField
              label="Firma (digitare Nome e Cognome)"
              value={form.firma}
              onChange={(v) => update("firma", v)}
              error={errors["firma"]}
              required
              helpText="La firma digitale conferma l'autenticità dei dati inseriti"
            />
          </div>
        </div>
      </div>

      <InfoBox>
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <strong>Importante:</strong> Cliccando su "Invia modulo" confermi la veridicità dei dati inseriti e la loro trasmissione al registro anagrafe condominiale.
        </div>
      </InfoBox>
    </div>
  );
}
