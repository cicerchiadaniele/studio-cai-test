import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, CheckCircle2, AlertCircle, Building2, Mail, Phone, Shield, Loader2, ChevronDown, Paperclip, X, Info, FileText, User, MapPin } from "lucide-react";

// Helpers
const cn = (...cls) => cls.filter(Boolean).join(" ");
const load = (k, fallback) => {
  try { const v = JSON.parse(localStorage.getItem(k) || ""); return v ?? fallback; } catch { return fallback; }
};

export default function CondoMessenger() {
  // Brand / theme / endpoint
  const [brandName] = useState(load("cm_brand", "Studio CAI"));
  const [logoUrl] = useState(load("cm_logo", "/logo.jpg"));
  const [primary] = useState(load("cm_primary", "#16a34a"));
  const [webhook] = useState(() => {
    const v = load("cm_webhook", "https://hook.eu1.make.com/xvuih8pqxk96q9v6bjpls6u8e4k4f5qv");
    return v === "https://hook.eu1.make.com/b2z7y28x5nyinnq0i5h6o9l14166paf3" ? "https://hook.eu1.make.com/xvuih8pqxk96q9v6bjpls6u8e4k4f5qv" : v;
  });
  
  // Form
  const [form, setForm] = useState({
    condominio: "", scala: "", interno: "",
    nome: "", email: "", telefono: "",
    categoria: "", subcategoria: "",
    messaggio: "", consenso: false,
    file: null
  });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  const [touched, setTouched] = useState({});
  const [showInfo, setShowInfo] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [fileError, setFileError] = useState(null);

  const MAX_FILE_MB = 10;

  React.useEffect(() => {
    if (!cooldown) return;
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // Draft: load once
  React.useEffect(() => {
    const d = load("cm_draft", null);
    if (d && typeof d === "object") {
      setForm((s) => ({ ...s, ...d, file: null }));
    }
  }, []);

  // Draft: autosave (excluding file)
  React.useEffect(() => {
    const t = setTimeout(() => {
      const { file, ...rest } = form;
      try {
        localStorage.setItem("cm_draft", JSON.stringify(rest));
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 1200);
      } catch {
        // ignore
      }
    }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    form.condominio,
    form.scala,
    form.interno,
    form.nome,
    form.email,
    form.telefono,
    form.categoria,
    form.subcategoria,
    form.messaggio,
    form.consenso,
  ]);

  const cssVars = useMemo(() => ({ "--brand": primary }), [primary]);
  
  const update = (k, v) => {
    setForm((s) => ({ ...s, [k]: v }));
    setTouched((t) => ({ ...t, [k]: true }));
    if (k === "file") setFileError(null);
  };

  const getFieldError = (field) => {
    if (!touched[field]) return null;
    
    switch(field) {
      case "condominio":
        return !form.condominio ? "Campo obbligatorio" : null;
      case "nome":
        return !form.nome ? "Campo obbligatorio" : null;
      case "email":
        return !form.email ? "Campo obbligatorio" : 
               !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? "Email non valida" : null;
      case "telefono":
        return !form.telefono ? "Campo obbligatorio" : null;
      case "categoria":
        return !form.categoria ? "Seleziona una categoria" : null;
      case "subcategoria":
        if (form.categoria === "Interventi di Manutenzione" || form.categoria === "Invio Documenti") {
          return !form.subcategoria ? "Campo obbligatorio" : null;
        }
        return null;
      case "messaggio":
        return !form.messaggio ? "Campo obbligatorio" : 
               form.messaggio.trim().length < 3 ? "Messaggio troppo breve (min. 3 caratteri)" : null;
      default:
        return null;
    }
  };

  const validate = () => {
    const errs = [];
    if (!form.condominio) errs.push("Indica il condominio");
    if (!form.nome) errs.push("Inserisci il tuo nome");
    if (!form.email) errs.push("Inserisci la tua email");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.push("Email non valida");
    if (!form.telefono) errs.push("Inserisci il tuo telefono");
    if (!form.categoria) errs.push("Seleziona una categoria");
    if (form.categoria === "Interventi di Manutenzione" && !form.subcategoria) errs.push("Seleziona una sottocategoria di manutenzione");
    if (form.categoria === "Invio Documenti" && !form.subcategoria) errs.push("Seleziona il tipo di documento");
    if (!form.messaggio || form.messaggio.trim().length < 3) errs.push("Messaggio troppo breve");
    if (!form.consenso) errs.push("Accetta l'informativa privacy");
    
    // Single document upload rule
    if (form.categoria === "Invio Documenti") {
      if (!form.file) errs.push("Carica un file");
      if (form.file && !/\.(pdf|jpg|jpeg|png)$/i.test(form.file.name)) errs.push("Sono ammessi solo PDF o immagini (jpg, jpeg, png)");
      if (form.file && form.file.size > MAX_FILE_MB * 1024 * 1024) errs.push(`Il file supera ${MAX_FILE_MB}MB`);
    }
    return errs;
  };

  const focusFirstError = () => {
    // Best-effort focus/scroll
    const order = [
      "condominio",
      "nome",
      "email",
      "telefono",
      "categoria",
      "subcategoria",
      "messaggio",
      "cons",
    ];
    for (const id of order) {
      const el = document.querySelector(`[data-field="${id}"]`) || document.getElementById(id);
      if (!el) continue;
      const err =
        id === "cons" ? (!form.consenso ? "err" : null) :
        id === "subcategoria" ? getFieldError("subcategoria") :
        id === "categoria" ? getFieldError("categoria") :
        getFieldError(id);
      if (err) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => el.focus?.(), 250);
        break;
      }
    }
  };

  const submit = async () => {
    if (cooldown) return;
    
    // Mark all fields as touched
    setTouched({
      condominio: true, nome: true, email: true, telefono: true,
      categoria: true, subcategoria: true, messaggio: true
    });
    
    const errs = validate();
    if (errs.length) {
      setResult({ ok: false, error: errs[0] }); // Show first error
      focusFirstError();
      return;
    }
    
    setSending(true);
    setResult(null);
    const ticket = `CM-${new Date().toISOString().slice(0,10).replaceAll("-","")}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;

    try {
      const fd = new FormData();
      const payload = { ...form, ticket, timestamp: new Date().toISOString() };
      Object.entries(payload).forEach(([k, v]) => { if (k !== "file") fd.append(k, String(v)); });
      if (form.file) fd.append("file1", form.file, form.file.name);
      
      const res = await fetch(webhook, { method: "POST", body: fd });
      if (!res.ok) throw new Error(`Errore invio: ${res.status}`);

      setResult({ ok: true, ticket });
      setCooldown(8);
      setForm((s) => ({ ...s, categoria: "", subcategoria: "", messaggio: "", file: null, consenso: s.consenso }));
      setTouched({});
      try { localStorage.removeItem("cm_draft"); } catch {}
    } catch (e) {
      setResult({ ok: false, error: e.message || "Invio non riuscito. Riprova." });
    } finally {
      setSending(false);
    }
  };

  const resetAll = () => {
    setForm({
      condominio: "", scala: "", interno: "",
      nome: "", email: "", telefono: "",
      categoria: "", subcategoria: "",
      messaggio: "", consenso: false,
      file: null,
    });
    setTouched({});
    setResult(null);
    setFileError(null);
    try { localStorage.removeItem("cm_draft"); } catch {}
  };

  // resetAll already clears the form + any locally saved draft

  const categorie = [
    { value: "Interventi di Manutenzione", icon: Building2, desc: "Segnala necessità di manutenzione", primary: true },
    { value: "Amministrativa", icon: FileText, desc: "Questioni amministrative e gestionali" },
    { value: "Contabile", icon: FileText, desc: "Contabilità e bilanci" },
    { value: "Richiesta di Documentazione", icon: FileText, desc: "Richiedi documenti condominiali" },
    { value: "Appuntamento", icon: Phone, desc: "Richiedi un appuntamento" },
    { value: "Invio Documenti", icon: Paperclip, desc: "Invia documenti, foto o autoletture" }
  ];
  
  const subCategorieManut = [
    "Ascensore","Cancelli Elettrici","Disinfestazioni/Derattizzazioni","Edilizia","Elettricista","Fabbro","Giardinaggio","Idraulico","Impianto di Riscaldamento","Montascale"
  ];
  
  const subCategorieDoc = ["Documenti PDF","Foto","Autoletture dei contatori"];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-neutral-50 to-neutral-100 text-neutral-900" style={cssVars}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-neutral-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-[var(--brand)]/10 to-[var(--brand)]/5 flex items-center justify-center shadow-sm">
              {logoUrl ? (
                <img src={logoUrl} alt="logo" className="w-full h-full object-contain"/>
              ) : (
                <Building2 className="w-8 h-8 text-[var(--brand)]" />
              )}
            </div>
            <div className="flex-1">
              <div className="font-bold text-xl sm:text-2xl text-neutral-900">{brandName}</div>
              <div className="text-sm text-neutral-600 mt-0.5">Sportello segnalazioni condominiali</div>
            </div>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="p-2 rounded-xl hover:bg-neutral-100 transition-colors"
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
            className="bg-blue-50 border-b border-blue-200"
          >
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">Come funziona</p>
                  <p className="text-blue-700">Compila il modulo con i tuoi dati e la segnalazione. Riceverai un numero di ticket per tracciare la richiesta. Ti risponderemo il prima possibile.</p>
                </div>
                <button onClick={() => setShowInfo(false)} className="ml-auto p-1 hover:bg-blue-100 rounded-lg">
                  <X className="w-4 h-4 text-blue-600" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Form Card */}
        <motion.div 
          layout 
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="bg-gradient-to-r from-[var(--brand)] to-[var(--brand)]/90 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-white">Invia la tua segnalazione</h2>
                <p className="text-white/90 text-sm mt-0.5">Compila tutti i campi richiesti</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Section: Dati Immobile */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-[var(--brand)]" />
                <h3 className="font-semibold text-lg text-neutral-800">Dati immobile</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <TextField 
                    label="Condominio" 
                    placeholder="Es. Via Roma 23" 
                    value={form.condominio} 
                    onChange={(v)=>update("condominio",v)} 
                    error={getFieldError("condominio")}
                    required 
                    inputProps={{ "data-field": "condominio" }}
                  />
                </div>
                <TextField 
                  label="Scala" 
                  placeholder="Es. A" 
                  value={form.scala} 
                  onChange={(v)=>update("scala",v)} 
                  inputProps={{ "data-field": "scala" }}
                />
                <TextField 
                  label="Interno" 
                  placeholder="Es. 12" 
                  value={form.interno} 
                  onChange={(v)=>update("interno",v)} 
                  inputProps={{ "data-field": "interno" }}
                />
              </div>
            </div>

            {/* Section: Dati Personali */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-[var(--brand)]" />
                <h3 className="font-semibold text-lg text-neutral-800">Dati personali</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <TextField 
                    label="Nome e Cognome" 
                    placeholder="Il tuo nome completo" 
                    value={form.nome} 
                    onChange={(v)=>update("nome",v)} 
                    error={getFieldError("nome")}
                    required 
                    inputProps={{ "data-field": "nome", autoComplete: "name" }}
                  />
                </div>
                <TextField 
                  label="Email" 
                  type="email" 
                  placeholder="nome@email.it" 
                  value={form.email} 
                  onChange={(v)=>update("email",v)} 
                  icon={<Mail className="w-4 h-4"/>} 
                  error={getFieldError("email")}
                  required 
                  inputProps={{ "data-field": "email", autoComplete: "email" }}
                />
                <TextField 
                  label="Telefono" 
                  placeholder="Es. 333 123 4567" 
                  value={form.telefono} 
                  onChange={(v)=>update("telefono",v)} 
                  icon={<Phone className="w-4 h-4"/>}
                  error={getFieldError("telefono")}
                  required 
                  inputProps={{ "data-field": "telefono", inputMode: "tel", autoComplete: "tel" }}
                />
              </div>
            </div>

            {/* Section: Categoria */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-[var(--brand)]" />
                <h3 className="font-semibold text-lg text-neutral-800">Tipo di segnalazione</h3>
              </div>
              
              <CategoryGrid 
                categories={categorie}
                selected={form.categoria}
                onSelect={(v) => {
                  update("categoria", v);
                  if (v !== "Interventi di Manutenzione" && v !== "Invio Documenti") {
                    setForm(s => ({ ...s, subcategoria: "", file: null }));
                  }
                }}
                dataField="categoria"
              />

              {/* Subcategories */}
              <AnimatePresence>
                {form.categoria === "Interventi di Manutenzione" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4"
                  >
                    <SelectField 
                      label="Tipo di intervento" 
                      value={form.subcategoria} 
                      onChange={(v)=>update("subcategoria",v)} 
                      options={subCategorieManut}
                      error={getFieldError("subcategoria")}
                      required 
                      dataField="subcategoria"
                    />
                  </motion.div>
                )}
                
                {form.categoria === "Invio Documenti" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 space-y-4"
                  >
                    <SelectField 
                      label="Tipo di documento" 
                      value={form.subcategoria} 
                      onChange={(v)=>update("subcategoria",v)} 
                      options={subCategorieDoc}
                      error={getFieldError("subcategoria")}
                      required 
                      dataField="subcategoria"
                    />
                    <FileUpload
                      file={form.file}
                      maxMb={MAX_FILE_MB}
                      error={fileError}
                      onChange={(f) => {
                        if (f && f.size > MAX_FILE_MB * 1024 * 1024) {
                          setFileError(`Il file supera ${MAX_FILE_MB}MB`);
                          update("file", null);
                          return;
                        }
                        update("file", f);
                      }}
                      onRemove={() => update("file", null)}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Message */}
            <div>
              <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2 mb-2">
                Messaggio
                <span className="text-red-500">*</span>
              </label>
              <textarea
                data-field="messaggio"
                className={cn(
                  "w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all min-h-[140px] resize-y",
                  getFieldError("messaggio") 
                    ? "border-red-300 focus:ring-red-500/20 focus:border-red-500" 
                    : "border-neutral-300 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]"
                )}
                placeholder="Descrivi la tua segnalazione in modo dettagliato..."
                value={form.messaggio}
                onChange={(e)=>update("messaggio", e.target.value)}
                onBlur={() => setTouched(t => ({ ...t, messaggio: true }))}
                data-field="messaggio"
              />
              {getFieldError("messaggio") && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {getFieldError("messaggio")}
                </p>
              )}
              <p className="mt-2 text-xs text-neutral-500">
                {form.messaggio.length} caratteri (minimo 3)
              </p>
            </div>

            {/* Privacy Consent */}
            <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
              <div className="flex items-start gap-3">
                <input 
                  id="cons" 
                  type="checkbox" 
                  checked={form.consenso} 
                  onChange={(e)=>update("consenso", e.target.checked)} 
                  className="mt-1 w-4 h-4 rounded border-neutral-300 text-[var(--brand)] focus:ring-[var(--brand)] focus:ring-offset-0"
                />
                <label htmlFor="cons" className="text-sm text-neutral-700 flex-1">
                  Ho letto e accetto l'
                  <a 
                    className="text-[var(--brand)] hover:underline font-medium mx-1" 
                    href="https://www.dropbox.com/scl/fi/pg39geu63s5o2gtq04oq5/INFORMATIVA-SUL-TRATTAMENTO-DEI-DATI-PERSONALI.pdf?rlkey=7zzihoi92roiiqkydn9frt1p9&dl=0" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    informativa sulla privacy
                  </a>
                  <span className="text-red-500">*</span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <button
                type="button"
                onClick={resetAll}
                className="sm:flex-none inline-flex items-center justify-center px-4 py-3.5 rounded-xl text-neutral-700 font-semibold text-base border border-neutral-200 hover:bg-neutral-50 transition-colors"
              >
                Svuota campi
              </button>
              <button
                disabled={sending || cooldown>0}
                onClick={submit}
                className={cn(
                  "flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold text-base shadow-lg transition-all",
                  sending || cooldown 
                    ? "bg-neutral-400 cursor-not-allowed" 
                    : "bg-gradient-to-r from-[var(--brand)] to-[var(--brand)]/90 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                )}
              >
                {sending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Invio in corso...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Invia segnalazione
                  </>
                )}
              </button>
              {cooldown > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-sm text-neutral-600 text-center sm:text-left"
                >
                  Prossimo invio tra <span className="font-semibold text-[var(--brand)]">{cooldown}s</span>
                </motion.div>
              )}
            </div>

            {/* Result Message */}
            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className={cn(
                    "rounded-xl border-2 p-4 shadow-md",
                    result.ok 
                      ? "bg-green-50 border-green-300" 
                      : "bg-red-50 border-red-300"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {result.ok ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      {result.ok ? (
                        <>
                          <div className="font-bold text-green-900 text-lg">Segnalazione inviata!</div>
                          <p className="text-sm text-green-700 mt-1">La tua richiesta è stata registrata correttamente.</p>
                          {result.ticket && (
                            <div className="mt-3 bg-white rounded-lg px-3 py-2 border border-green-200">
                              <p className="text-xs text-neutral-600 mb-1">Numero di riferimento:</p>
                              <p className="font-mono font-bold text-green-700 text-lg">{result.ticket}</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="font-bold text-red-900 text-lg">Errore nell'invio</div>
                          <p className="text-sm text-red-700 mt-1">{result.error}</p>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-neutral-600">
            <div className="text-center sm:text-left">
              © {new Date().getFullYear()} {brandName}. Tutti i diritti riservati.
            </div>
            <div className="text-center sm:text-right text-xs text-neutral-500">
              v8.0 – Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Enhanced TextField Component
function TextField({ label, value, onChange, placeholder, type = "text", icon, required, error, inputProps = {} }) {
  return (
    <div>
      <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2 mb-2">
        {icon}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        {...inputProps}
        className={cn(
          "w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all",
          error 
            ? "border-red-300 focus:ring-red-500/20 focus:border-red-500" 
            : "border-neutral-300 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]"
        )}
      />
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
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

// Enhanced SelectField Component
function SelectField({ label, value, onChange, options = [], required, error, dataField }) {
  return (
    <div>
      <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2 mb-2">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e)=>onChange(e.target.value)}
          className={cn(
            "appearance-none w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 bg-white transition-all",
            error 
              ? "border-red-300 focus:ring-red-500/20 focus:border-red-500" 
              : "border-neutral-300 focus:ring-[var(--brand)]/20 focus:border-[var(--brand)]"
          )}
          data-field={dataField}
        >
          <option value="">-- Seleziona --</option>
          {options.map((o)=> <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"/>
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
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

// New CategoryGrid Component
function CategoryGrid({ categories, selected, onSelect, dataField }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" data-field={dataField} tabIndex={-1}>
      {categories.map((cat) => {
        const Icon = cat.icon;
        const isSelected = selected === cat.value;
        const isPrimary = cat.primary;
        return (
          <motion.button
            key={cat.value}
            type="button"
            onClick={() => onSelect(cat.value)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "p-4 rounded-xl border-2 text-left transition-all",
              isPrimary && !isSelected && "border-[var(--brand)]/40 bg-[var(--brand)]/5 shadow-sm ring-2 ring-[var(--brand)]/20",
              isPrimary && isSelected && "border-[var(--brand)] bg-[var(--brand)]/10 shadow-lg ring-2 ring-[var(--brand)]/30",
              !isPrimary && isSelected && "border-[var(--brand)] bg-[var(--brand)]/5 shadow-md",
              !isPrimary && !isSelected && "border-neutral-200 hover:border-neutral-300 hover:shadow-sm"
            )}
            data-field={dataField}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                isSelected ? "bg-[var(--brand)] text-white" : 
                isPrimary ? "bg-[var(--brand)]/20 text-[var(--brand)]" : 
                "bg-neutral-100 text-neutral-600"
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "font-semibold text-sm mb-1 flex items-center gap-1",
                  isSelected ? "text-[var(--brand)]" : 
                  isPrimary ? "text-[var(--brand)]" : 
                  "text-neutral-900"
                )}>
                  {cat.value}
                  {isPrimary && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--brand)] text-white">
                      PRINCIPALE
                    </span>
                  )}
                </div>
                <div className={cn(
                  "text-xs line-clamp-2",
                  isPrimary ? "text-neutral-700 font-medium" : "text-neutral-600"
                )}>
                  {cat.desc}
                </div>
              </div>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}

// New FileUpload Component
function FileUpload({ file, onChange, onRemove, maxMb = 10, error }) {
  const inputRef = React.useRef(null);

  return (
    <div>
      <label className="text-sm font-semibold text-neutral-700 flex items-center gap-2 mb-2">
        <Paperclip className="w-4 h-4" />
        Carica file
        <span className="text-red-500">*</span>
      </label>
      
      {!file ? (
        <label 
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-neutral-300 rounded-xl hover:border-[var(--brand)] hover:bg-[var(--brand)]/5 transition-all cursor-pointer"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Paperclip className="w-8 h-8 text-neutral-400 mb-2" />
            <p className="text-sm text-neutral-600 font-medium">Clicca per caricare</p>
            <p className="text-xs text-neutral-500 mt-1">PDF, JPG, JPEG o PNG (max {maxMb}MB)</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => {
              if (e.target.files?.[0]) onChange(e.target.files[0]);
            }}
            className="hidden"
          />
        </label>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 p-4 bg-[var(--brand)]/5 border border-[var(--brand)]/20 rounded-xl"
        >
          <div className="w-10 h-10 rounded-lg bg-[var(--brand)]/10 flex items-center justify-center flex-shrink-0">
            <Paperclip className="w-5 h-5 text-[var(--brand)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900 truncate">{file.name}</p>
            <p className="text-xs text-neutral-600">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="p-2 rounded-lg hover:bg-red-100 text-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1.5 text-xs text-red-600 flex items-center gap-1"
        >
          <AlertCircle className="w-3 h-3" />
          {error}
        </motion.p>
      )}

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-xs text-red-600 flex items-center gap-1"
        >
          <AlertCircle className="w-3 h-3" />
          {error}
        </motion.p>
      )}

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-xs text-red-600 flex items-center gap-1"
        >
          <AlertCircle className="w-3 h-3" />
          {error}
        </motion.p>
      )}
    </div>
  );
}
