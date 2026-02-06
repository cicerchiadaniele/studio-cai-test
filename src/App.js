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
  Home,
  Users,
  Mail,
  ClipboardList,
  FileText,
  Info,
  AlertTriangle,
  Save,
  ChevronRight,
  ChevronLeft,
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
        tipo: "", // appartamento/box/cantina
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

  const handleSubmit = async () => {
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

      setResult({ success: true, message: "Dati inviati con successo!" });
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
      setCooldown(30);
    } catch (error) {
      setResult({ success: false, message: "Errore durante l'invio. Riprova." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50" style={cssVars}>
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-green-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt={brandName}
                  className="h-12 w-auto object-contain"
                  onError={(e) => (e.target.style.display = "none")}
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{brandName}</h1>
                <p className="text-sm text-gray-600">Comunicazione Detrazioni Fiscali 2026</p>
              </div>
            </div>
            {autoSaved && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-green-600"
              >
                <Save className="w-4 h-4" />
                <span className="text-sm font-medium">Salvato automaticamente</span>
              </motion.div>
            )}
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="bg-white border-b border-green-100">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4 overflow-x-auto">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = idx === currentStep;
              const isCompleted = idx < currentStep;
              return (
                <div key={step.id} className="flex items-center flex-shrink-0">
                  <div className="flex flex-col items-center">
                    <motion.div
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all",
                        isActive && "bg-green-600 border-green-600 text-white shadow-lg scale-110",
                        isCompleted && "bg-green-100 border-green-600 text-green-600",
                        !isActive && !isCompleted && "bg-gray-100 border-gray-300 text-gray-400"
                      )}
                      animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                    </motion.div>
                    <span
                      className={cn(
                        "text-xs mt-2 font-medium whitespace-nowrap",
                        isActive && "text-green-600",
                        isCompleted && "text-green-600",
                        !isActive && !isCompleted && "text-gray-400"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {idx < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "w-16 h-1 mx-2 transition-colors",
                        isCompleted ? "bg-green-600" : "bg-gray-200"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Step: Condominio */}
              {currentStep === 0 && (
                <StepCondominio form={form} update={update} errors={errors} />
              )}

              {/* Step: Immobile */}
              {currentStep === 1 && (
                <StepImmobile form={form} update={update} errors={errors} />
              )}

              {/* Step: Proprietari */}
              {currentStep === 2 && (
                <StepProprietari
                  form={form}
                  update={update}
                  errors={errors}
                  addProprietario={addProprietario}
                  removeProprietario={removeProprietario}
                />
              )}

              {/* Step: Beneficiario */}
              {currentStep === 3 && (
                <StepBeneficiario form={form} update={update} errors={errors} />
              )}

              {/* Step: Recapiti */}
              {currentStep === 4 && (
                <StepRecapiti form={form} update={update} errors={errors} />
              )}

              {/* Step: Riepilogo */}
              {currentStep === 5 && (
                <StepRiepilogo
                  form={form}
                  update={update}
                  errors={errors}
                  sending={sending}
                  result={result}
                  cooldown={cooldown}
                  handleSubmit={handleSubmit}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all",
                currentStep === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white border-2 border-green-600 text-green-600 hover:bg-green-50"
              )}
            >
              <ChevronLeft className="w-5 h-5" />
              Indietro
            </button>

            {currentStep < STEPS.length - 1 && (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all shadow-md hover:shadow-lg"
              >
                Avanti
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-gray-600">
            © {new Date().getFullYear()} {brandName} - Comunicazione Detrazioni Fiscali
          </p>
        </div>
      </footer>
    </div>
  );
}

// Components for each step
function StepCondominio({ form, update, errors }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-green-100">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-8 h-8 text-green-600" />
        <h2 className="text-2xl font-bold text-gray-900">Dati Condominio</h2>
      </div>

      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Informazione importante</p>
            <p>Inserisci i dati del condominio relativi all'unità immobiliare per cui vuoi comunicare le detrazioni fiscali.</p>
          </div>
        </div>

        <InputField
          label="Nome Condominio"
          value={form.condominio}
          onChange={(v) => update("condominio", v)}
          error={errors["condominio"]}
          placeholder="Es: Condominio Via Roma"
          required
        />

        <InputField
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

function StepImmobile({ form, update, errors }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-green-100">
      <div className="flex items-center gap-3 mb-6">
        <Home className="w-8 h-8 text-green-600" />
        <h2 className="text-2xl font-bold text-gray-900">Dati Immobile</h2>
      </div>

      <div className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Dati catastali obbligatori</p>
            <p>I dati catastali sono necessari per l'identificazione univoca dell'immobile presso l'Agenzia delle Entrate.</p>
          </div>
        </div>

        <InputField
          label="Tipo immobile"
          value={form.immobile.tipo}
          onChange={(v) => update("immobile.tipo", v)}
          error={errors["immobile.tipo"]}
          placeholder="Es: Appartamento, Box, Cantina"
          required
        />

        <InputField
          label="Interno"
          value={form.immobile.interno}
          onChange={(v) => update("immobile.interno", v)}
          error={errors["immobile.interno"]}
          placeholder="Es: 5"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="Sezione"
            value={form.immobile.sezione}
            onChange={(v) => update("immobile.sezione", v)}
            error={errors["immobile.sezione"]}
            placeholder="Es: A"
          />

          <InputField
            label="Foglio"
            value={form.immobile.foglio}
            onChange={(v) => update("immobile.foglio", v)}
            error={errors["immobile.foglio"]}
            placeholder="Es: 12"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="Particella"
            value={form.immobile.particella}
            onChange={(v) => update("immobile.particella", v)}
            error={errors["immobile.particella"]}
            placeholder="Es: 345"
            required
          />

          <InputField
            label="Subalterno"
            value={form.immobile.subalterno}
            onChange={(v) => update("immobile.subalterno", v)}
            error={errors["immobile.subalterno"]}
            placeholder="Es: 6"
            required
          />
        </div>

        <SelectField
          label="Categoria catastale"
          value={form.immobile.categoria}
          onChange={(v) => update("immobile.categoria", v)}
          error={errors["immobile.categoria"]}
          options={CATEGORIE_CATASTALI}
          placeholder="Seleziona categoria"
        />
      </div>
    </div>
  );
}

function StepProprietari({ form, update, errors, addProprietario, removeProprietario }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-8 border border-green-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">Proprietari</h2>
          </div>
          <button
            onClick={addProprietario}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            Aggiungi Proprietario
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3 mb-6">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Informazioni sui proprietari</p>
            <p>Inserisci i dati di tutti i proprietari dell'immobile come da rogito. Indica se l'immobile costituisce abitazione principale per beneficiare dell'aliquota maggiorata del 50%.</p>
          </div>
        </div>

        {form.proprietari.map((prop, idx) => (
          <ProprietarioCard
            key={prop.id}
            proprietario={prop}
            index={idx}
            update={update}
            errors={errors}
            canRemove={form.proprietari.length > 1}
            onRemove={() => removeProprietario(prop.id)}
          />
        ))}
      </div>
    </div>
  );
}

function ProprietarioCard({ proprietario, index, update, errors, canRemove, onRemove }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-2 border-gray-200 rounded-lg p-6 mb-6 bg-gray-50"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Proprietario {index + 1}</h3>
        {canRemove && (
          <button
            onClick={onRemove}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="Cognome"
            value={proprietario.cognome}
            onChange={(v) => update(`proprietari.${index}.cognome`, v)}
            error={errors[`proprietari.${index}.cognome`]}
            placeholder="Rossi"
            required
          />

          <InputField
            label="Nome"
            value={proprietario.nome}
            onChange={(v) => update(`proprietari.${index}.nome`, v)}
            error={errors[`proprietari.${index}.nome`]}
            placeholder="Mario"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="Luogo di nascita"
            value={proprietario.luogoNascita}
            onChange={(v) => update(`proprietari.${index}.luogoNascita`, v)}
            error={errors[`proprietari.${index}.luogoNascita`]}
            placeholder="Roma"
          />

          <InputField
            label="Data di nascita"
            type="date"
            value={proprietario.dataNascita}
            onChange={(v) => update(`proprietari.${index}.dataNascita`, v)}
            error={errors[`proprietari.${index}.dataNascita`]}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            label="Codice Fiscale"
            value={proprietario.codiceFiscale}
            onChange={(v) => update(`proprietari.${index}.codiceFiscale`, v.toUpperCase())}
            error={errors[`proprietari.${index}.codiceFiscale`]}
            placeholder="RSSMRA80A01H501U"
            required
          />

          <InputField
            label="Quota di possesso"
            value={proprietario.quotaPossesso}
            onChange={(v) => update(`proprietari.${index}.quotaPossesso`, v)}
            error={errors[`proprietari.${index}.quotaPossesso`]}
            placeholder="Es: 100% oppure 1/2"
            required
          />
        </div>

        <div className="space-y-4 border-t pt-4">
          <CheckboxField
            label="L'unità immobiliare costituisce la propria abitazione principale (residenza anagrafica e dimora abituale)"
            checked={proprietario.abitazionePrincipale}
            onChange={(v) => update(`proprietari.${index}.abitazionePrincipale`, v)}
          />

          <CheckboxField
            label="Intende usufruire della detrazione fiscale del 50%"
            checked={proprietario.detrazione50}
            onChange={(v) => update(`proprietari.${index}.detrazione50`, v)}
          />
        </div>
      </div>
    </motion.div>
  );
}

function StepBeneficiario({ form, update, errors }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-green-100">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-8 h-8 text-green-600" />
        <h2 className="text-2xl font-bold text-gray-900">Beneficiario della Detrazione</h2>
      </div>

      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Beneficiario diverso dal proprietario</p>
            <p>Compila questa sezione solo se la detrazione fiscale sarà usufruita da un soggetto diverso dai proprietari (es: familiare convivente).</p>
          </div>
        </div>

        <CheckboxField
          label="È presente un beneficiario diverso dai proprietari"
          checked={form.beneficiario.presente}
          onChange={(v) => update("beneficiario.presente", v)}
        />

        {form.beneficiario.presente && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-6 border-t pt-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Cognome"
                value={form.beneficiario.cognome}
                onChange={(v) => update("beneficiario.cognome", v)}
                error={errors["beneficiario.cognome"]}
                placeholder="Bianchi"
                required
              />

              <InputField
                label="Nome"
                value={form.beneficiario.nome}
                onChange={(v) => update("beneficiario.nome", v)}
                error={errors["beneficiario.nome"]}
                placeholder="Laura"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Luogo di nascita"
                value={form.beneficiario.luogoNascita}
                onChange={(v) => update("beneficiario.luogoNascita", v)}
                error={errors["beneficiario.luogoNascita"]}
                placeholder="Milano"
              />

              <InputField
                label="Data di nascita"
                type="date"
                value={form.beneficiario.dataNascita}
                onChange={(v) => update("beneficiario.dataNascita", v)}
                error={errors["beneficiario.dataNascita"]}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField
                label="Codice Fiscale"
                value={form.beneficiario.codiceFiscale}
                onChange={(v) => update("beneficiario.codiceFiscale", v.toUpperCase())}
                error={errors["beneficiario.codiceFiscale"]}
                placeholder="BNCLRA85D45F205Z"
                required
              />

              <InputField
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
    </div>
  );
}

function StepRecapiti({ form, update, errors }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-green-100">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="w-8 h-8 text-green-600" />
        <h2 className="text-2xl font-bold text-gray-900">Recapiti</h2>
      </div>

      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Recapiti per comunicazioni urgenti</p>
            <p>Inserisci i recapiti del proprietario e/o del beneficiario per eventuali comunicazioni urgenti.</p>
          </div>
        </div>

        <InputField
          label="Telefono fisso"
          value={form.recapiti.telefonoFisso}
          onChange={(v) => update("recapiti.telefonoFisso", v)}
          error={errors["recapiti.telefonoFisso"]}
          placeholder="Es: 06 12345678"
        />

        <InputField
          label="Cellulare"
          value={form.recapiti.cellulare}
          onChange={(v) => update("recapiti.cellulare", v)}
          error={errors["recapiti.cellulare"]}
          placeholder="Es: 339 1234567"
        />

        <InputField
          label="Email"
          type="email"
          value={form.recapiti.email}
          onChange={(v) => update("recapiti.email", v)}
          error={errors["recapiti.email"]}
          placeholder="email@esempio.it"
        />
      </div>
    </div>
  );
}

function StepRiepilogo({ form, update, errors, sending, result, cooldown, handleSubmit }) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-8 border border-green-100">
        <div className="flex items-center gap-3 mb-6">
          <ClipboardList className="w-8 h-8 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900">Riepilogo</h2>
        </div>

        {/* Condominio */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-green-600" />
            Condominio
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p className="text-sm"><span className="font-medium">Nome:</span> {form.condominio}</p>
            <p className="text-sm"><span className="font-medium">Civico:</span> {form.civico}</p>
          </div>
        </div>

        {/* Immobile */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Home className="w-5 h-5 text-green-600" />
            Immobile
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p className="text-sm"><span className="font-medium">Tipo:</span> {form.immobile.tipo}</p>
            {form.immobile.interno && <p className="text-sm"><span className="font-medium">Interno:</span> {form.immobile.interno}</p>}
            <p className="text-sm"><span className="font-medium">Dati catastali:</span> Sez: {form.immobile.sezione || "-"}, Foglio: {form.immobile.foglio}, Particella: {form.immobile.particella}, Sub: {form.immobile.subalterno}</p>
            {form.immobile.categoria && <p className="text-sm"><span className="font-medium">Categoria:</span> {form.immobile.categoria}</p>}
          </div>
        </div>

        {/* Proprietari */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Users className="w-5 h-5 text-green-600" />
            Proprietari ({form.proprietari.length})
          </h3>
          <div className="space-y-3">
            {form.proprietari.map((prop, idx) => (
              <div key={prop.id} className="bg-gray-50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-gray-900">{prop.cognome} {prop.nome}</p>
                <p className="text-sm"><span className="font-medium">CF:</span> {prop.codiceFiscale}</p>
                <p className="text-sm"><span className="font-medium">Quota:</span> {prop.quotaPossesso}</p>
                {prop.abitazionePrincipale && (
                  <p className="text-sm text-green-600">✓ Abitazione principale</p>
                )}
                {prop.detrazione50 && (
                  <p className="text-sm text-green-600">✓ Detrazione 50%</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Beneficiario */}
        {form.beneficiario.presente && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              Beneficiario
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-gray-900">{form.beneficiario.cognome} {form.beneficiario.nome}</p>
              <p className="text-sm"><span className="font-medium">CF:</span> {form.beneficiario.codiceFiscale}</p>
              <p className="text-sm"><span className="font-medium">Quota detrazione:</span> {form.beneficiario.quotaDetrazione}</p>
            </div>
          </div>
        )}

        {/* Recapiti */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Mail className="w-5 h-5 text-green-600" />
            Recapiti
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            {form.recapiti.telefonoFisso && <p className="text-sm"><span className="font-medium">Telefono:</span> {form.recapiti.telefonoFisso}</p>}
            {form.recapiti.cellulare && <p className="text-sm"><span className="font-medium">Cellulare:</span> {form.recapiti.cellulare}</p>}
            {form.recapiti.email && <p className="text-sm"><span className="font-medium">Email:</span> {form.recapiti.email}</p>}
          </div>
        </div>

        {/* Privacy */}
        <div className="border-t pt-6">
          <CheckboxField
            label="Accetto l'informativa sulla privacy e autorizzo il trattamento dei dati personali"
            checked={form.consensoPrivacy}
            onChange={(v) => update("consensoPrivacy", v)}
            error={errors["consensoPrivacy"]}
          />
        </div>

        {/* Submit button */}
        <div className="mt-8">
          <button
            onClick={handleSubmit}
            disabled={sending || cooldown > 0}
            className={cn(
              "w-full flex items-center justify-center gap-3 px-6 py-4 rounded-lg font-semibold text-lg transition-all shadow-lg",
              sending || cooldown > 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700 hover:shadow-xl"
            )}
          >
            {sending ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Invio in corso...
              </>
            ) : cooldown > 0 ? (
              <>Attendi {cooldown}s prima di reinviare</>
            ) : (
              <>
                <Send className="w-6 h-6" />
                Invia Comunicazione
              </>
            )}
          </button>
        </div>

        {/* Result message */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "mt-6 p-4 rounded-lg flex items-start gap-3",
              result.success ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
            )}
          >
            {result.success ? (
              <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            )}
            <p className={cn("font-medium", result.success ? "text-green-800" : "text-red-800")}>
              {result.message}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Reusable form components
function InputField({ label, value, onChange, error, required, type = "text", placeholder = "" }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full px-4 py-3 border-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-green-500",
          error ? "border-red-300 bg-red-50" : "border-gray-200 bg-white hover:border-green-300"
        )}
      />
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
}

function SelectField({ label, value, onChange, error, options, placeholder = "Seleziona...", required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "w-full px-4 py-3 border-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none",
            error ? "border-red-300 bg-red-50" : "border-gray-200 bg-white hover:border-green-300"
          )}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
}

function CheckboxField({ label, checked, onChange, error }) {
  return (
    <div>
      <label className="flex items-start gap-3 cursor-pointer group">
        <div className="relative flex items-center">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="w-5 h-5 border-2 border-gray-300 rounded text-green-600 focus:ring-2 focus:ring-green-500 cursor-pointer"
          />
        </div>
        <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
          {label}
        </span>
      </label>
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center gap-1 ml-8">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}
    </div>
  );
}
