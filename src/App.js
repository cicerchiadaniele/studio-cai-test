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
  ChevronRight,
  ChevronLeft,
  Save,
  Info,
  AlertTriangle,
  Home,
  Users,
  Mail,
  ClipboardList,
  FileText,
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
  if (!cf) return true;
  const cfRegex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i;
  return cfRegex.test(cf);
};

const CATEGORIE_CATASTALI = [
  "A/1", "A/2", "A/3", "A/4", "A/5", "A/6", "A/7", "A/8", "A/9", "A/10", "A/11",
  "C/2", "C/6", "C/7", "Altro"
];

const STEPS = [
  { id: "immobile", label: "Condominio e Immobile", icon: Building2 },
  { id: "beneficiari", label: "Beneficiari Detrazione", icon: Users },
  { id: "recapiti", label: "Recapiti", icon: Mail },
  { id: "riepilogo", label: "Riepilogo e Invio", icon: ClipboardList },
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
      civico: "",
      immobile: {
        tipo: "",
        interno: "",
        sezione: "",
        foglio: "",
        particella: "",
        subalterno: "",
        categoria: "",
      },
      beneficiari: [
        {
          id: "ben1",
          cognome: "",
          nome: "",
          luogoNascita: "",
          dataNascita: "",
          codiceFiscale: "",
          quotaPossesso: "",
          tipologia: "",
          aliquota: "",
        },
        {
          id: "ben2",
          cognome: "",
          nome: "",
          luogoNascita: "",
          dataNascita: "",
          codiceFiscale: "",
          quotaPossesso: "",
          tipologia: "",
          aliquota: "",
        },
        {
          id: "ben3",
          cognome: "",
          nome: "",
          luogoNascita: "",
          dataNascita: "",
          codiceFiscale: "",
          quotaPossesso: "",
          tipologia: "",
          aliquota: "",
        },
      ],
      recapiti: {
        telefonoFisso: "",
        cellulare: "",
        email: "",
      },
      consensoPrivacy: false,
      autocertificazione: false,
      dataFirma: "",
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
      for (let i = 0; i < keys.length - 1; i++) {
        if (typeof cur[keys[i]] === 'undefined') cur[keys[i]] = {};
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      return next;
    });
    setErrors(prev => {
      const next = { ...prev };
      delete next[path];
      return next;
    });
  }, []);

  const setBeneficiario = useCallback((id, key, value) => {
    setForm((s) => ({
      ...s,
      beneficiari: s.beneficiari.map((b) => {
        if (b.id === id) {
          const updated = { ...b, [key]: value };
          if (key === "tipologia") {
            updated.aliquota = value === "prima_casa" ? "50%" : value === "seconda_casa" ? "36%" : "";
          }
          return updated;
        }
        return b;
      }),
    }));
  }, []);

  const validateStep = (stepId) => {
    const newErrors = {};

    if (stepId === "immobile") {
      if (!form.condominio.trim()) newErrors["condominio"] = "Campo obbligatorio";
      if (!form.civico.trim()) newErrors["civico"] = "Campo obbligatorio";
      if (!form.immobile.tipo.trim()) newErrors["immobile.tipo"] = "Campo obbligatorio";
      if (!form.immobile.foglio.trim()) newErrors["immobile.foglio"] = "Campo obbligatorio";
      if (!form.immobile.particella.trim()) newErrors["immobile.particella"] = "Campo obbligatorio";
      if (!form.immobile.subalterno.trim()) newErrors["immobile.subalterno"] = "Campo obbligatorio";
    }

    if (stepId === "beneficiari") {
      const beneficiariCompilati = form.beneficiari.filter(b => 
        b.cognome.trim() || b.nome.trim() || b.codiceFiscale.trim()
      );
      
      if (beneficiariCompilati.length === 0) {
        newErrors["beneficiari"] = "Inserisci almeno un beneficiario della detrazione";
      }

      form.beneficiari.forEach((b, idx) => {
        const hasAnyData = b.cognome.trim() || b.nome.trim() || b.codiceFiscale.trim() || b.quotaPossesso.trim();
        
        if (hasAnyData) {
          if (!b.cognome.trim()) newErrors[`beneficiari.${idx}.cognome`] = "Campo obbligatorio";
          if (!b.nome.trim()) newErrors[`beneficiari.${idx}.nome`] = "Campo obbligatorio";
          if (!b.codiceFiscale.trim()) {
            newErrors[`beneficiari.${idx}.codiceFiscale`] = "Campo obbligatorio";
          } else if (!validateCF(b.codiceFiscale)) {
            newErrors[`beneficiari.${idx}.codiceFiscale`] = "Codice fiscale non valido";
          }
          if (!b.quotaPossesso.trim()) newErrors[`beneficiari.${idx}.quotaPossesso`] = "Campo obbligatorio";
          if (!b.tipologia) newErrors[`beneficiari.${idx}.tipologia`] = "Seleziona prima o seconda casa";
        }
      });
    }

    if (stepId === "riepilogo") {
      if (!form.consensoPrivacy) newErrors["consensoPrivacy"] = "Devi accettare l'informativa privacy";
      if (!form.autocertificazione) newErrors["autocertificazione"] = "Devi confermare l'autocertificazione";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    const stepId = STEPS[currentStep].id;
    if (validateStep(stepId)) {
      setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    setCurrentStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = async () => {
    if (!validateStep("riepilogo")) return;

    setSending(true);
    setResult(null);

    try {
      const payload = {
        timestamp: new Date().toISOString(),
        brandName,
        ...form,
      };

      const response = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Errore nell'invio");

      setResult({ ok: true });
      save("df_form_draft", {
        condominio: "",
        civico: "",
        immobile: {
          tipo: "",
          interno: "",
          sezione: "",
          foglio: "",
          particella: "",
          subalterno: "",
          categoria: "",
        },
        beneficiari: [
          { id: "ben1", cognome: "", nome: "", luogoNascita: "", dataNascita: "", codiceFiscale: "", quotaPossesso: "", tipologia: "", aliquota: "" },
          { id: "ben2", cognome: "", nome: "", luogoNascita: "", dataNascita: "", codiceFiscale: "", quotaPossesso: "", tipologia: "", aliquota: "" },
          { id: "ben3", cognome: "", nome: "", luogoNascita: "", dataNascita: "", codiceFiscale: "", quotaPossesso: "", tipologia: "", aliquota: "" },
        ],
        recapiti: {
          telefonoFisso: "",
          cellulare: "",
          email: "",
        },
        consensoPrivacy: false,
        autocertificazione: false,
        dataFirma: "",
      });
      setCurrentStep(0);
      setCooldown(30);
    } catch (e) {
      setResult({ ok: false, error: e.message || "Invio non riuscito" });
    } finally {
      setSending(false);
    }
  };

  const stepContent = useMemo(() => {
    switch (STEPS[currentStep].id) {
      case "immobile":
        return <ImmobileStep form={form} update={update} errors={errors} />;
      case "beneficiari":
        return <BeneficiariStep form={form} errors={errors} setBeneficiario={setBeneficiario} />;
      case "recapiti":
        return <RecapitiStep form={form} update={update} errors={errors} />;
      case "riepilogo":
        return <RiepilogoStep form={form} update={update} errors={errors} />;
      default:
        return null;
    }
  }, [currentStep, form, update, errors, setBeneficiario]);

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
                    <span className={cn("text-xs font-medium text-center", isActive && "text-[var(--brand)]", !isActive && "text-neutral-500")}>
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
                    <p className="text-green-700 mt-1">La tua autocertificazione è stata trasmessa correttamente all'amministratore per l'invio all'Agenzia delle Entrate.</p>
                  </div>
                ) : (
                  <div>
                    <div className="font-bold text-lg text-red-800">Errore nell'invio</div>
                    <p className="text-red-700 mt-1">{result.error || "Si è verificato un errore. Riprova."}</p>
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
          <div className="text-right">Comunicazione Detrazioni Fiscali</div>
        </div>
      </footer>
    </div>
  );
}

// UI Components
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

function CheckboxField({ label, checked, onChange }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-5 h-5 border-2 border-neutral-300 rounded text-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/20 cursor-pointer"
      />
      <span className="text-sm text-neutral-700 group-hover:text-neutral-900 transition-colors">
        {label}
      </span>
    </label>
  );
}

function InfoBox({ children, variant = "blue" }) {
  const colors = {
    blue: "bg-blue-50 border-blue-200 text-blue-800",
    yellow: "bg-yellow-50 border-yellow-200 text-yellow-800",
    green: "bg-green-50 border-green-200 text-green-800",
  };
  return (
    <div className={cn("flex items-start gap-3 p-4 border rounded-xl", colors[variant])}>
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
function ImmobileStep({ form, update, errors }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">Condominio e Immobile</h2>
        <p className="text-neutral-600">Inserisci i dati del condominio e i dati catastali dell'unità immobiliare.</p>
      </div>

      <InfoBox variant="blue">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <div className="text-sm">
          <strong>Informazione:</strong> I dati catastali sono obbligatori per l'identificazione univoca dell'immobile presso l'Agenzia delle Entrate.
        </div>
      </InfoBox>

      <div className="border-2 border-neutral-200 rounded-xl p-5 bg-neutral-50">
        <h3 className="font-bold text-lg text-neutral-800 mb-4">Dati Condominio</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            label="Nome Condominio"
            value={form.condominio}
            onChange={(v) => update("condominio", v)}
            error={errors["condominio"]}
            placeholder="Es: Condominio Via Roma"
            required
          />
          <TextField
            label="Civico"
            value={form.civico}
            onChange={(v) => update("civico", v)}
            error={errors["civico"]}
            placeholder="Es: 123"
            required
          />
        </div>
      </div>

      <div className="border-2 border-neutral-200 rounded-xl p-5 bg-neutral-50">
        <h3 className="font-bold text-lg text-neutral-800 mb-4">Dati Immobile</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Tipo immobile"
              value={form.immobile.tipo}
              onChange={(v) => update("immobile.tipo", v)}
              error={errors["immobile.tipo"]}
              placeholder="Es: Appartamento, Box, Cantina"
              required
            />
            <TextField
              label="Interno"
              value={form.immobile.interno}
              onChange={(v) => update("immobile.interno", v)}
              placeholder="Es: 5"
            />
          </div>

          <div className="border-t pt-4">
            <div className="text-sm font-medium text-neutral-700 mb-3">Dati catastali (obbligatori)</div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <TextField
                label="Sezione"
                value={form.immobile.sezione}
                onChange={(v) => update("immobile.sezione", v)}
                placeholder="A"
              />
              <TextField
                label="Foglio"
                value={form.immobile.foglio}
                onChange={(v) => update("immobile.foglio", v)}
                error={errors["immobile.foglio"]}
                placeholder="12"
                required
              />
              <TextField
                label="Particella"
                value={form.immobile.particella}
                onChange={(v) => update("immobile.particella", v)}
                error={errors["immobile.particella"]}
                placeholder="345"
                required
              />
              <TextField
                label="Subalterno"
                value={form.immobile.subalterno}
                onChange={(v) => update("immobile.subalterno", v)}
                error={errors["immobile.subalterno"]}
                placeholder="6"
                required
              />
              <div className="col-span-2">
                <SelectField
                  label="Categoria"
                  value={form.immobile.categoria}
                  onChange={(v) => update("immobile.categoria", v)}
                  options={CATEGORIE_CATASTALI}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BeneficiariStep({ form, errors, setBeneficiario }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">Beneficiari della Detrazione Fiscale</h2>
        <p className="text-neutral-600">Inserisci i dati dei beneficiari (massimo 3) e indica se l'immobile è prima o seconda casa per ciascuno.</p>
      </div>

      <InfoBox variant="yellow">
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
        <div className="text-sm">
          <strong>Importante:</strong> La detrazione è del <strong>50%</strong> per immobili adibiti ad <strong>abitazione principale</strong> (prima casa) e del <strong>36%</strong> per altre unità immobiliari (seconda casa). Compila almeno un beneficiario.
        </div>
      </InfoBox>

      {errors["beneficiari"] && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
          <span className="text-sm text-red-700">{errors["beneficiari"]}</span>
        </div>
      )}

      <div className="space-y-4">
        {form.beneficiari.map((b, idx) => (
          <motion.div
            key={b.id}
            layout
            className="rounded-2xl border-2 border-neutral-200 p-5 bg-gradient-to-br from-white to-neutral-50"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-neutral-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-[var(--brand)]" />
                Beneficiario {idx + 1}
              </h3>
              {b.aliquota && (
                <span className={cn(
                  "px-3 py-1 rounded-full text-sm font-bold",
                  b.aliquota === "50%" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                )}>
                  Detrazione {b.aliquota}
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <TextField
                  label="Cognome"
                  value={b.cognome}
                  onChange={(v) => setBeneficiario(b.id, "cognome", v)}
                  error={errors[`beneficiari.${idx}.cognome`]}
                  placeholder="Rossi"
                />
                <TextField
                  label="Nome"
                  value={b.nome}
                  onChange={(v) => setBeneficiario(b.id, "nome", v)}
                  error={errors[`beneficiari.${idx}.nome`]}
                  placeholder="Mario"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <TextField
                  label="Luogo di nascita"
                  value={b.luogoNascita}
                  onChange={(v) => setBeneficiario(b.id, "luogoNascita", v)}
                  placeholder="Roma"
                />
                <TextField
                  label="Data di nascita"
                  type="date"
                  value={b.dataNascita}
                  onChange={(v) => setBeneficiario(b.id, "dataNascita", v)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <TextField
                  label="Codice Fiscale"
                  value={b.codiceFiscale}
                  onChange={(v) => setBeneficiario(b.id, "codiceFiscale", v.toUpperCase())}
                  error={errors[`beneficiari.${idx}.codiceFiscale`]}
                  placeholder="RSSMRA80A01H501U"
                />
                <TextField
                  label="Quota di possesso / detrazione"
                  value={b.quotaPossesso}
                  onChange={(v) => setBeneficiario(b.id, "quotaPossesso", v)}
                  error={errors[`beneficiari.${idx}.quotaPossesso`]}
                  placeholder="Es: 100%, 50%, 1/2, 1/3"
                />
              </div>

              <div className="border-t pt-4">
                <SelectField
                  label="Tipologia immobile per questo beneficiario"
                  value={b.tipologia}
                  onChange={(v) => setBeneficiario(b.id, "tipologia", v)}
                  error={errors[`beneficiari.${idx}.tipologia`]}
                  options={[
                    { value: "prima_casa", label: "Prima casa (abitazione principale) - Detrazione 50%" },
                    { value: "seconda_casa", label: "Seconda casa (altro immobile) - Detrazione 36%" },
                  ]}
                />
                {b.tipologia && (
                  <div className="mt-3 p-3 bg-neutral-100 rounded-lg">
                    <p className="text-sm text-neutral-700">
                      {b.tipologia === "prima_casa" ? (
                        <>
                          <strong>Detrazione al 50%:</strong> L'immobile costituisce abitazione principale (residenza anagrafica e dimora abituale) per questo beneficiario.
                        </>
                      ) : (
                        <>
                          <strong>Detrazione al 36%:</strong> L'immobile non costituisce abitazione principale per questo beneficiario.
                        </>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function RecapitiStep({ form, update, errors }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">Recapiti</h2>
        <p className="text-neutral-600">Inserisci i recapiti per comunicazioni urgenti.</p>
      </div>

      <InfoBox variant="blue">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <div className="text-sm">
          <strong>Recapiti:</strong> Inserisci almeno un recapito per eventuali comunicazioni urgenti da parte dell'amministratore.
        </div>
      </InfoBox>

      <div className="space-y-4">
        <TextField
          label="Telefono fisso"
          value={form.recapiti.telefonoFisso}
          onChange={(v) => update("recapiti.telefonoFisso", v)}
          placeholder="Es: 06 12345678"
        />
        <TextField
          label="Cellulare"
          value={form.recapiti.cellulare}
          onChange={(v) => update("recapiti.cellulare", v)}
          placeholder="Es: 339 1234567"
        />
        <TextField
          label="Email"
          type="email"
          value={form.recapiti.email}
          onChange={(v) => update("recapiti.email", v)}
          placeholder="email@esempio.it"
        />
      </div>
    </div>
  );
}

function RiepilogoStep({ form, update, errors }) {
  const beneficiariCompilati = form.beneficiari.filter(b => b.cognome.trim() || b.nome.trim());

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">Riepilogo e Invio</h2>
        <p className="text-neutral-600">Verifica i dati inseriti e conferma l'autocertificazione.</p>
      </div>

      <InfoBox variant="yellow">
        <FileText className="w-5 h-5 text-yellow-600 flex-shrink-0" />
        <div className="text-sm">
          <strong>Autocertificazione:</strong> Compilando e inviando questo modulo, dichiari sotto la tua responsabilità che i dati forniti sono veritieri. L'autocertificazione sarà valida per l'invio della pratica all'Agenzia delle Entrate.
        </div>
      </InfoBox>

      <div>
        <h3 className="text-lg font-bold text-neutral-800 mb-3 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[var(--brand)]" />
          Condominio e Immobile
        </h3>
        <div className="bg-neutral-50 rounded-xl p-4 space-y-2">
          <DataRow label="Condominio" value={form.condominio} />
          <DataRow label="Civico" value={form.civico} />
          <DataRow label="Tipo immobile" value={form.immobile.tipo} />
          {form.immobile.interno && <DataRow label="Interno" value={form.immobile.interno} />}
          <DataRow label="Dati catastali" value={`Sez: ${form.immobile.sezione || "-"}, Foglio: ${form.immobile.foglio}, Particella: ${form.immobile.particella}, Sub: ${form.immobile.subalterno}`} />
          {form.immobile.categoria && <DataRow label="Categoria" value={form.immobile.categoria} />}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-neutral-800 mb-3 flex items-center gap-2">
          <Users className="w-5 h-5 text-[var(--brand)]" />
          Beneficiari ({beneficiariCompilati.length})
        </h3>
        <div className="space-y-3">
          {beneficiariCompilati.map((b, idx) => (
            <div key={b.id} className="bg-neutral-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-bold text-neutral-800">{b.cognome} {b.nome}</p>
                {b.aliquota && (
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold",
                    b.aliquota === "50%" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                  )}>
                    {b.aliquota}
                  </span>
                )}
              </div>
              <DataRow label="CF" value={b.codiceFiscale} />
              <DataRow label="Quota" value={b.quotaPossesso} />
              <DataRow label="Tipologia" value={b.tipologia === "prima_casa" ? "Prima casa (50%)" : "Seconda casa (36%)"} />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold text-neutral-800 mb-3 flex items-center gap-2">
          <Mail className="w-5 h-5 text-[var(--brand)]" />
          Recapiti
        </h3>
        <div className="bg-neutral-50 rounded-xl p-4 space-y-2">
          {form.recapiti.telefonoFisso && <DataRow label="Telefono" value={form.recapiti.telefonoFisso} />}
          {form.recapiti.cellulare && <DataRow label="Cellulare" value={form.recapiti.cellulare} />}
          {form.recapiti.email && <DataRow label="Email" value={form.recapiti.email} />}
        </div>
      </div>

      <div className="border-t pt-6 space-y-4">
        <div className="p-4 border-2 border-neutral-200 rounded-xl space-y-4">
          <CheckboxField
            label="Accetto l'informativa sulla privacy e autorizzo il trattamento dei dati personali"
            checked={form.consensoPrivacy}
            onChange={(v) => update("consensoPrivacy", v)}
          />
          {errors["consensoPrivacy"] && (
            <div className="text-xs text-red-600 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {errors["consensoPrivacy"]}
            </div>
          )}

          <div className="border-t pt-4">
            <CheckboxField
              label="Dichiaro sotto la mia responsabilità che i dati forniti sono veritieri e costituiscono autocertificazione valida ai fini della comunicazione all'Agenzia delle Entrate"
              checked={form.autocertificazione}
              onChange={(v) => update("autocertificazione", v)}
            />
            {errors["autocertificazione"] && (
              <div className="text-xs text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {errors["autocertificazione"]}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
