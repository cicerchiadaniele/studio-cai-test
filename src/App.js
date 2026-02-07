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
  if (!cf) return true;
  const cfRegex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/i;
  return cfRegex.test(cf);
};

const CATEGORIE_CATASTALI = [
  "A/1", "A/2", "A/3", "A/4", "A/5", "A/6", "A/7", "A/8", "A/9", "A/10", "A/11",
  "C/2", "C/6", "C/7", "Altro"
];

const STEPS = [
  { id: "condominio", label: "Condominio", icon: Building2 },
  { id: "immobile", label: "Immobile", icon: Home },
  { id: "proprietari", label: "Proprietari", icon: Users },
  { id: "beneficiario", label: "Beneficiario", icon: Shield },
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
      proprietari: [
        {
          id: uid(),
          cognome: "",
          nome: "",
          luogoNascita: "",
          dataNascita: "",
          codiceFiscale: "",
          quotaPossesso: "",
          abitazionePrincipale: false,
          detrazione50: false,
        },
      ],
      beneficiario: {
        presente: false,
        cognome: "",
        nome: "",
        luogoNascita: "",
        dataNascita: "",
        codiceFiscale: "",
        quotaDetrazione: "",
      },
      recapiti: {
        telefonoFisso: "",
        cellulare: "",
        email: "",
      },
      consensoPrivacy: false,
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

  const addProprietario = () =>
    setForm((s) => ({
      ...s,
      proprietari: [
        ...s.proprietari,
        {
          id: uid(),
          cognome: "",
          nome: "",
          luogoNascita: "",
          dataNascita: "",
          codiceFiscale: "",
          quotaPossesso: "",
          abitazionePrincipale: false,
          detrazione50: false,
        },
      ],
    }));

  const removeProprietario = (id) =>
    setForm((s) => ({
      ...s,
      proprietari: s.proprietari.length <= 1 ? s.proprietari : s.proprietari.filter((p) => p.id !== id),
    }));

  function setProprietario(id, key, value) {
    setForm((s) => ({
      ...s,
      proprietari: s.proprietari.map((p) => (p.id === id ? { ...p, [key]: value } : p)),
    }));
  }

  const validateStep = (stepId) => {
    const newErrors = {};

    if (stepId === "condominio") {
      if (!form.condominio.trim()) newErrors["condominio"] = "Campo obbligatorio";
      if (!form.civico.trim()) newErrors["civico"] = "Campo obbligatorio";
    }

    if (stepId === "immobile") {
      if (!form.immobile.tipo.trim()) newErrors["immobile.tipo"] = "Campo obbligatorio";
      if (!form.immobile.foglio.trim()) newErrors["immobile.foglio"] = "Campo obbligatorio";
      if (!form.immobile.particella.trim()) newErrors["immobile.particella"] = "Campo obbligatorio";
      if (!form.immobile.subalterno.trim()) newErrors["immobile.subalterno"] = "Campo obbligatorio";
    }

    if (stepId === "proprietari") {
      if (!form.proprietari.length) newErrors["proprietari"] = "Inserisci almeno un proprietario";
      form.proprietari.forEach((p, idx) => {
        if (!p.cognome.trim()) newErrors[`proprietari.${idx}.cognome`] = "Campo obbligatorio";
        if (!p.nome.trim()) newErrors[`proprietari.${idx}.nome`] = "Campo obbligatorio";
        if (!p.codiceFiscale.trim()) newErrors[`proprietari.${idx}.codiceFiscale`] = "Campo obbligatorio";
        else if (!validateCF(p.codiceFiscale)) newErrors[`proprietari.${idx}.codiceFiscale`] = "Codice fiscale non valido";
        if (!p.quotaPossesso.trim()) newErrors[`proprietari.${idx}.quotaPossesso`] = "Campo obbligatorio";
      });
    }

    if (stepId === "beneficiario" && form.beneficiario.presente) {
      if (!form.beneficiario.cognome.trim()) newErrors["beneficiario.cognome"] = "Campo obbligatorio";
      if (!form.beneficiario.nome.trim()) newErrors["beneficiario.nome"] = "Campo obbligatorio";
      if (!form.beneficiario.codiceFiscale.trim()) newErrors["beneficiario.codiceFiscale"] = "Campo obbligatorio";
      else if (!validateCF(form.beneficiario.codiceFiscale)) newErrors["beneficiario.codiceFiscale"] = "Codice fiscale non valido";
      if (!form.beneficiario.quotaDetrazione.trim()) newErrors["beneficiario.quotaDetrazione"] = "Campo obbligatorio";
    }

    if (stepId === "riepilogo") {
      if (!form.consensoPrivacy) newErrors["consensoPrivacy"] = "Devi accettare l'informativa privacy";
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
        proprietari: [
          {
            id: uid(),
            cognome: "",
            nome: "",
            luogoNascita: "",
            dataNascita: "",
            codiceFiscale: "",
            quotaPossesso: "",
            abitazionePrincipale: false,
            detrazione50: false,
          },
        ],
        beneficiario: {
          presente: false,
          cognome: "",
          nome: "",
          luogoNascita: "",
          dataNascita: "",
          codiceFiscale: "",
          quotaDetrazione: "",
        },
        recapiti: {
          telefonoFisso: "",
          cellulare: "",
          email: "",
        },
        consensoPrivacy: false,
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
      case "condominio":
        return <CondominioStep form={form} update={update} errors={errors} />;
      case "immobile":
        return <ImmobileStep form={form} update={update} errors={errors} />;
      case "proprietari":
        return <ProprietariStep form={form} update={update} errors={errors} setProprietario={setProprietario} addProprietario={addProprietario} removeProprietario={removeProprietario} />;
      case "beneficiario":
        return <BeneficiarioStep form={form} update={update} errors={errors} />;
      case "recapiti":
        return <RecapitiStep form={form} update={update} errors={errors} />;
      case "riepilogo":
        return <RiepilogoStep form={form} update={update} errors={errors} />;
      default:
        return null;
    }
  }, [currentStep, form, update, errors, setProprietario, addProprietario, removeProprietario]);

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
            <div className="text-sm text-neutral-500 mt-1">Comunicazione Detrazioni Fiscali 2026</div>
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
                    <p className="text-green-700 mt-1">I tuoi dati sono stati trasmessi correttamente all'amministratore.</p>
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
          <div className="text-right">v1.0 – Comunicazione Detrazioni Fiscali</div>
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

function InfoBox({ children }) {
  return (
    <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
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
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">Dati Condominio</h2>
        <p className="text-neutral-600">Inserisci i dati del condominio relativi all'unità immobiliare.</p>
      </div>

      <InfoBox>
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <strong>Informazione:</strong> Inserisci i dati del condominio per cui vuoi comunicare le detrazioni fiscali.
        </div>
      </InfoBox>

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
  );
}

function ImmobileStep({ form, update, errors }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">Dati Immobile</h2>
        <p className="text-neutral-600">Inserisci i dati catastali dell'unità immobiliare (obbligatori).</p>
      </div>

      <InfoBox>
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
        <div className="text-sm text-yellow-800">
          <strong>Dati catastali obbligatori:</strong> I dati catastali sono necessari per l'identificazione univoca dell'immobile presso l'Agenzia delle Entrate.
        </div>
      </InfoBox>

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
  );
}

function ProprietariStep({ form, update, errors, setProprietario, addProprietario, removeProprietario }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">Proprietari</h2>
        <p className="text-neutral-600">Inserisci i dati di tutti i proprietari come da rogito.</p>
      </div>

      <InfoBox>
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <strong>Informazioni:</strong> Indica se l'immobile costituisce abitazione principale per beneficiare dell'aliquota maggiorata del 50%.
        </div>
      </InfoBox>

      <div className="space-y-4">
        {form.proprietari.map((p, idx) => (
          <motion.div
            key={p.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border-2 border-neutral-200 p-5 bg-gradient-to-br from-white to-neutral-50"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-neutral-800 flex items-center gap-2">
                <Users className="w-5 h-5 text-[var(--brand)]" />
                Proprietario {idx + 1}
              </h3>
              {form.proprietari.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeProprietario(p.id)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-200 text-sm text-red-600 hover:bg-red-50 transition-all"
                >
                  <Trash2 className="w-4 h-4" /> Rimuovi
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <TextField
                  label="Cognome"
                  value={p.cognome}
                  onChange={(v) => setProprietario(p.id, "cognome", v)}
                  error={errors[`proprietari.${idx}.cognome`]}
                  placeholder="Rossi"
                  required
                />
                <TextField
                  label="Nome"
                  value={p.nome}
                  onChange={(v) => setProprietario(p.id, "nome", v)}
                  error={errors[`proprietari.${idx}.nome`]}
                  placeholder="Mario"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <TextField
                  label="Luogo di nascita"
                  value={p.luogoNascita}
                  onChange={(v) => setProprietario(p.id, "luogoNascita", v)}
                  placeholder="Roma"
                />
                <TextField
                  label="Data di nascita"
                  type="date"
                  value={p.dataNascita}
                  onChange={(v) => setProprietario(p.id, "dataNascita", v)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <TextField
                  label="Codice Fiscale"
                  value={p.codiceFiscale}
                  onChange={(v) => setProprietario(p.id, "codiceFiscale", v.toUpperCase())}
                  error={errors[`proprietari.${idx}.codiceFiscale`]}
                  placeholder="RSSMRA80A01H501U"
                  required
                />
                <TextField
                  label="Quota di possesso"
                  value={p.quotaPossesso}
                  onChange={(v) => setProprietario(p.id, "quotaPossesso", v)}
                  error={errors[`proprietari.${idx}.quotaPossesso`]}
                  placeholder="Es: 100% oppure 1/2"
                  required
                />
              </div>

              <div className="border-t pt-4 space-y-3">
                <CheckboxField
                  label="L'unità immobiliare costituisce la propria abitazione principale (residenza anagrafica e dimora abituale)"
                  checked={p.abitazionePrincipale}
                  onChange={(v) => setProprietario(p.id, "abitazionePrincipale", v)}
                />
                <CheckboxField
                  label="Intende usufruire della detrazione fiscale del 50%"
                  checked={p.detrazione50}
                  onChange={(v) => setProprietario(p.id, "detrazione50", v)}
                />
              </div>
            </div>
          </motion.div>
        ))}

        <button
          type="button"
          onClick={addProprietario}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[var(--brand)] to-[var(--brand)]/80 text-white hover:opacity-90 transition-all font-medium shadow-lg shadow-[var(--brand)]/20"
        >
          <Plus className="w-5 h-5" /> Aggiungi proprietario
        </button>
      </div>
    </div>
  );
}

function BeneficiarioStep({ form, update, errors }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">Beneficiario della Detrazione</h2>
        <p className="text-neutral-600">Compila solo se la detrazione è usufruita da un soggetto diverso dai proprietari.</p>
      </div>

      <InfoBox>
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <strong>Beneficiario diverso:</strong> Compila questa sezione solo se la detrazione sarà usufruita da un familiare convivente o altro soggetto.
        </div>
      </InfoBox>

      <div className="p-4 border-2 border-neutral-200 rounded-xl">
        <CheckboxField
          label="È presente un beneficiario diverso dai proprietari"
          checked={form.beneficiario.presente}
          onChange={(v) => update("beneficiario.presente", v)}
        />
      </div>

      {form.beneficiario.presente && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-4 border-t pt-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Cognome"
              value={form.beneficiario.cognome}
              onChange={(v) => update("beneficiario.cognome", v)}
              error={errors["beneficiario.cognome"]}
              placeholder="Bianchi"
              required
            />
            <TextField
              label="Nome"
              value={form.beneficiario.nome}
              onChange={(v) => update("beneficiario.nome", v)}
              error={errors["beneficiario.nome"]}
              placeholder="Laura"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Luogo di nascita"
              value={form.beneficiario.luogoNascita}
              onChange={(v) => update("beneficiario.luogoNascita", v)}
              placeholder="Milano"
            />
            <TextField
              label="Data di nascita"
              type="date"
              value={form.beneficiario.dataNascita}
              onChange={(v) => update("beneficiario.dataNascita", v)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextField
              label="Codice Fiscale"
              value={form.beneficiario.codiceFiscale}
              onChange={(v) => update("beneficiario.codiceFiscale", v.toUpperCase())}
              error={errors["beneficiario.codiceFiscale"]}
              placeholder="BNCLRA85D45F205Z"
              required
            />
            <TextField
              label="Quota della detrazione"
              value={form.beneficiario.quotaDetrazione}
              onChange={(v) => update("beneficiario.quotaDetrazione", v)}
              error={errors["beneficiario.quotaDetrazione"]}
              placeholder="Es: 50% oppure 1/2"
              required
            />
          </div>
        </motion.div>
      )}
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

      <InfoBox>
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
        <div className="text-sm text-blue-800">
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
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-800 mb-2">Riepilogo</h2>
        <p className="text-neutral-600">Verifica i dati inseriti prima dell'invio.</p>
      </div>

      {/* Condominio */}
      <div>
        <h3 className="text-lg font-bold text-neutral-800 mb-3 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[var(--brand)]" />
          Condominio
        </h3>
        <div className="bg-neutral-50 rounded-xl p-4 space-y-2">
          <DataRow label="Nome" value={form.condominio} />
          <DataRow label="Civico" value={form.civico} />
        </div>
      </div>

      {/* Immobile */}
      <div>
        <h3 className="text-lg font-bold text-neutral-800 mb-3 flex items-center gap-2">
          <Home className="w-5 h-5 text-[var(--brand)]" />
          Immobile
        </h3>
        <div className="bg-neutral-50 rounded-xl p-4 space-y-2">
          <DataRow label="Tipo" value={form.immobile.tipo} />
          {form.immobile.interno && <DataRow label="Interno" value={form.immobile.interno} />}
          <DataRow label="Dati catastali" value={`Sez: ${form.immobile.sezione || "-"}, Foglio: ${form.immobile.foglio}, Particella: ${form.immobile.particella}, Sub: ${form.immobile.subalterno}`} />
          {form.immobile.categoria && <DataRow label="Categoria" value={form.immobile.categoria} />}
        </div>
      </div>

      {/* Proprietari */}
      <div>
        <h3 className="text-lg font-bold text-neutral-800 mb-3 flex items-center gap-2">
          <Users className="w-5 h-5 text-[var(--brand)]" />
          Proprietari ({form.proprietari.length})
        </h3>
        <div className="space-y-3">
          {form.proprietari.map((p, idx) => (
            <div key={p.id} className="bg-neutral-50 rounded-xl p-4 space-y-2">
              <p className="font-bold text-neutral-800">{p.cognome} {p.nome}</p>
              <DataRow label="CF" value={p.codiceFiscale} />
              <DataRow label="Quota" value={p.quotaPossesso} />
              {p.abitazionePrincipale && <p className="text-sm text-green-600">✓ Abitazione principale</p>}
              {p.detrazione50 && <p className="text-sm text-green-600">✓ Detrazione 50%</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Beneficiario */}
      {form.beneficiario.presente && (
        <div>
          <h3 className="text-lg font-bold text-neutral-800 mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[var(--brand)]" />
            Beneficiario
          </h3>
          <div className="bg-neutral-50 rounded-xl p-4 space-y-2">
            <p className="font-bold text-neutral-800">{form.beneficiario.cognome} {form.beneficiario.nome}</p>
            <DataRow label="CF" value={form.beneficiario.codiceFiscale} />
            <DataRow label="Quota detrazione" value={form.beneficiario.quotaDetrazione} />
          </div>
        </div>
      )}

      {/* Recapiti */}
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

      {/* Privacy */}
      <div className="border-t pt-6">
        <div className="p-4 border-2 border-neutral-200 rounded-xl">
          <CheckboxField
            label="Accetto l'informativa sulla privacy e autorizzo il trattamento dei dati personali"
            checked={form.consensoPrivacy}
            onChange={(v) => update("consensoPrivacy", v)}
          />
          {errors["consensoPrivacy"] && (
            <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {errors["consensoPrivacy"]}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
