import React, { useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, CheckCircle2, AlertCircle, Building2, Loader2,
  ChevronDown, X, FileText, Users, Paperclip, Trash2
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Costanti
// ─────────────────────────────────────────────────────────────
const APP_VERSION = "1.0";
const BUILD_DATE_LABEL = "29/04/2026";
const WEBHOOK_URL = "https://hook.eu1.make.com/8bhbqarp7a2jkgu3ii95ev4wziqpr9zb";
const BRAND_NAME = "Studio CAI – Segnalazioni";
const LOGO_URL = "/logo.jpg";
const PRIMARY_COLOR = "#8B1538";

const MAX_PDF_SIZE_MB = 10;
const MAX_PDF_SIZE_BYTES = MAX_PDF_SIZE_MB * 1024 * 1024;

// ─────────────────────────────────────────────────────────────
// Destinatari disponibili
// ─────────────────────────────────────────────────────────────
const DESTINATARI = [
  { id: "manutentore",    label: "Manutentore",        desc: "Interventi tecnici e riparazioni" },
  { id: "fornitore",      label: "Fornitore",           desc: "Ordini e rapporti con fornitori" },
  { id: "amministratore", label: "Amministratore",      desc: "Comunicazioni interne allo studio" },
  { id: "consiglio",      label: "Consiglio di condominio", desc: "Comunicazioni al consiglio" },
  { id: "assemblea",      label: "Assemblea condominiale",  desc: "Da portare in assemblea" },
  { id: "altro",          label: "Altro",               desc: "Destinatario specifico nel testo" },
];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const cn = (...cls) => cls.filter(Boolean).join(" ");

const sanitizeText = (v) => v.replace(/[^\p{L}\p{N}\s.,'\-–()/°°\n]/gu, "");
const sanitizeCondominio = (v) => v.replace(/[^\p{L}\p{N}\s.,'\-]/gu, "");

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

/** Etichetta campo con asterisco obbligatorio */
function FieldLabel({ label, required, icon: Icon, htmlFor }) {
  return (
    <label htmlFor={htmlFor} className="flex items-center gap-1.5 text-sm font-semibold text-neutral-700 mb-1.5">
      {Icon && <Icon size={14} className="text-neutral-400" />}
      {label}
      {required && (
        <span style={{ color: PRIMARY_COLOR }} className="text-xs font-bold ml-0.5">*</span>
      )}
    </label>
  );
}

/** Messaggio di errore inline */
function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1 text-xs text-red-600 mt-1.5 font-medium"
    >
      <AlertCircle size={11} />
      {msg}
    </motion.p>
  );
}

/** Input testo singola riga */
function TextInput({ id, value, onChange, placeholder, error, maxLength = 120, disabled }) {
  return (
    <div>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(sanitizeCondominio(e.target.value))}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        className={cn(
          "w-full rounded-xl border bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400",
          "transition-all outline-none",
          "focus:ring-2 focus:ring-offset-0",
          error
            ? "border-red-400 focus:ring-red-200"
            : "border-neutral-200 focus:border-[#8B1538] focus:ring-[rgba(139,21,56,0.12)]",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      />
      <FieldError msg={error} />
    </div>
  );
}

/** Selezione destinatario a schede */
function DestinatarioSelector({ value, onChange, error, disabled }) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {DESTINATARI.map((d) => {
          const selected = value === d.id;
          return (
            <button
              key={d.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(d.id)}
              className={cn(
                "relative text-left rounded-xl border px-3 py-2.5 transition-all text-xs font-semibold",
                "focus:outline-none focus:ring-2 focus:ring-offset-1",
                selected
                  ? "border-[#8B1538] bg-[#8B1538] text-white shadow-md"
                  : "border-neutral-200 bg-white text-neutral-700 hover:border-[#8B1538]/40 hover:bg-[#8B1538]/5",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <span className="block font-bold leading-tight">{d.label}</span>
              <span className={cn(
                "block text-[10px] font-normal mt-0.5 leading-tight",
                selected ? "text-white/80" : "text-neutral-400"
              )}>
                {d.desc}
              </span>
              {selected && (
                <motion.div
                  layoutId="dest-check"
                  className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-white/25 flex items-center justify-center"
                >
                  <CheckCircle2 size={11} className="text-white" />
                </motion.div>
              )}
            </button>
          );
        })}
      </div>
      <FieldError msg={error} />
    </div>
  );
}

/** Area di testo libera */
function TextArea({ id, value, onChange, placeholder, error, disabled }) {
  return (
    <div>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(sanitizeText(e.target.value))}
        placeholder={placeholder}
        rows={5}
        disabled={disabled}
        className={cn(
          "w-full rounded-xl border bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400",
          "transition-all outline-none resize-none",
          "focus:ring-2 focus:ring-offset-0",
          error
            ? "border-red-400 focus:ring-red-200"
            : "border-neutral-200 focus:border-[#8B1538] focus:ring-[rgba(139,21,56,0.12)]",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      />
      <div className="flex items-start justify-between mt-1">
        <FieldError msg={error} />
        <span className="text-[10px] text-neutral-400 ml-auto">
          {value.length} caratteri
        </span>
      </div>
    </div>
  );
}

/** Zona upload PDF */
function PdfUpload({ file, onChange, onRemove, error, disabled }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (f) => {
    if (!f) return;
    if (f.type !== "application/pdf") {
      onChange(null, "Solo file PDF sono accettati.");
      return;
    }
    if (f.size > MAX_PDF_SIZE_BYTES) {
      onChange(null, `Il file supera il limite di ${MAX_PDF_SIZE_MB} MB.`);
      return;
    }
    onChange(f, null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (disabled) return;
    const f = e.dataTransfer.files?.[0];
    handleFile(f);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (file) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 rounded-xl border border-[#8B1538]/30 bg-[#8B1538]/5 px-4 py-3"
      >
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#8B1538]/10 flex items-center justify-center">
          <FileText size={18} style={{ color: PRIMARY_COLOR }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-neutral-800 truncate">{file.name}</p>
          <p className="text-xs text-neutral-500">{formatSize(file.size)}</p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="flex-shrink-0 w-7 h-7 rounded-lg hover:bg-red-100 flex items-center justify-center transition-colors"
          title="Rimuovi allegato"
        >
          <Trash2 size={14} className="text-red-500" />
        </button>
      </motion.div>
    );
  }

  return (
    <div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={cn(
          "w-full rounded-xl border-2 border-dashed px-4 py-5 transition-all text-center",
          "focus:outline-none",
          dragOver
            ? "border-[#8B1538] bg-[#8B1538]/5"
            : error
              ? "border-red-300 bg-red-50"
              : "border-neutral-200 bg-neutral-50 hover:border-[#8B1538]/40 hover:bg-[#8B1538]/5",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Paperclip size={20} className={cn("mx-auto mb-1.5", error ? "text-red-400" : "text-neutral-400")} />
        <p className="text-xs font-semibold text-neutral-600">Allega un PDF <span className="font-normal text-neutral-400">(opzionale)</span></p>
        <p className="text-[10px] text-neutral-400 mt-0.5">Clicca o trascina · max {MAX_PDF_SIZE_MB} MB · un solo file</p>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <FieldError msg={error} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// App principale
// ─────────────────────────────────────────────────────────────
const EMPTY_FORM = { condominio: "", destinatario: "", testo: "" };

export default function App() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [pdfFile, setPdfFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [pdfError, setPdfError] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | sending | success | error
  const [serverError, setServerError] = useState(null);

  const cssVars = useMemo(() => ({ "--brand": PRIMARY_COLOR }), []);

  const update = (k, v) => {
    setForm((s) => ({ ...s, [k]: v }));
    if (errors[k]) setErrors((e) => { const n = { ...e }; delete n[k]; return n; });
  };

  const handlePdfChange = (file, err) => {
    setPdfFile(file);
    setPdfError(err);
  };

  const validate = () => {
    const errs = {};
    if (!form.condominio.trim()) errs.condominio = "Campo obbligatorio";
    else if (form.condominio.trim().length < 5) errs.condominio = "Inserisci almeno 5 caratteri";
    if (!form.destinatario) errs.destinatario = "Seleziona un destinatario";
    if (!form.testo.trim()) errs.testo = "Campo obbligatorio";
    else if (form.testo.trim().length < 10) errs.testo = "Inserisci almeno 10 caratteri";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (pdfError) return;

    setStatus("sending");
    setServerError(null);

    try {
      const destLabel = DESTINATARI.find((d) => d.id === form.destinatario)?.label ?? form.destinatario;

      let body;
      let headers = {};

      if (pdfFile) {
        // Multipart con allegato
        const fd = new FormData();
        fd.append("condominio", form.condominio.trim());
        fd.append("destinatario", destLabel);
        fd.append("testo", form.testo.trim());
        fd.append("allegato", pdfFile, pdfFile.name);
        body = fd;
      } else {
        // JSON senza allegato
        headers["Content-Type"] = "application/json";
        body = JSON.stringify({
          condominio: form.condominio.trim(),
          destinatario: destLabel,
          testo: form.testo.trim(),
        });
      }

      const res = await fetch(WEBHOOK_URL, { method: "POST", headers, body });

      if (!res.ok) throw new Error(`Errore HTTP ${res.status}`);

      setStatus("success");
    } catch (err) {
      console.error(err);
      setServerError(err.message || "Errore di rete. Riprova.");
      setStatus("error");
    }
  };

  const handleReset = () => {
    setForm(EMPTY_FORM);
    setPdfFile(null);
    setPdfError(null);
    setErrors({});
    setServerError(null);
    setStatus("idle");
  };

  const isBusy = status === "sending";

  // ── Schermata successo ──────────────────────────────────────
  if (status === "success") {
    return (
      <div style={cssVars} className="min-h-screen bg-paper bg-noise flex flex-col items-center justify-center px-4 py-10">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-lift p-8 text-center relative z-10"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h2 className="font-display font-semibold text-2xl text-neutral-900 mb-2">Segnalazione inviata!</h2>
          <p className="text-sm text-neutral-500 mb-1">
            <span className="font-semibold text-neutral-700">{form.condominio}</span>
          </p>
          <p className="text-sm text-neutral-500 mb-6">
            Destinatario: <span className="font-semibold text-neutral-700">
              {DESTINATARI.find((d) => d.id === form.destinatario)?.label}
            </span>
          </p>
          {pdfFile && (
            <div className="flex items-center gap-2 justify-center mb-6 text-xs text-neutral-500">
              <Paperclip size={12} />
              <span>{pdfFile.name}</span>
            </div>
          )}
          <button
            onClick={handleReset}
            style={{ background: PRIMARY_COLOR }}
            className="w-full py-3 rounded-xl text-white text-sm font-bold tracking-wide hover:opacity-90 transition-opacity"
          >
            Nuova segnalazione
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Form principale ─────────────────────────────────────────
  return (
    <div style={cssVars} className="min-h-screen bg-paper bg-noise flex flex-col">
      {/* Header */}
      <header className="relative z-10 bg-white/90 backdrop-blur-md border-b border-neutral-200/80 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <img
            src={LOGO_URL}
            alt="Logo Studio CAI"
            className="h-9 w-9 rounded-lg object-cover flex-shrink-0 shadow-sm"
            onError={(e) => { e.target.style.display = "none"; }}
          />
          <div className="flex-1 min-w-0">
            <h1 className="font-display font-semibold text-lg sm:text-xl text-neutral-900 truncate">
              {BRAND_NAME}
            </h1>
          </div>
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-900 text-white tracking-wider">
            v{APP_VERSION}
          </span>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-start px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-xl"
        >
          {/* Card */}
          <div className="bg-white rounded-2xl shadow-lift p-6 sm:p-8 space-y-6">

            {/* Intro */}
            <div className="pb-1">
              <h2 className="font-display font-semibold text-xl text-neutral-900 mb-1">
                Nuova segnalazione
              </h2>
              <p className="text-xs text-neutral-500">
                Compila i campi obbligatori e premi <strong>Invia</strong>. Make smisterà automaticamente la richiesta.
              </p>
            </div>

            {/* 1 – Condominio */}
            <div>
              <FieldLabel
                htmlFor="condominio"
                label="Condominio"
                required
                icon={Building2}
              />
              <TextInput
                id="condominio"
                value={form.condominio}
                onChange={(v) => update("condominio", v)}
                placeholder="Es. Via Marco Polo 84"
                error={errors.condominio}
                disabled={isBusy}
              />
            </div>

            {/* 2 – Destinatario */}
            <div>
              <FieldLabel
                htmlFor="destinatario"
                label="Destinatario"
                required
                icon={Users}
              />
              <DestinatarioSelector
                value={form.destinatario}
                onChange={(v) => update("destinatario", v)}
                error={errors.destinatario}
                disabled={isBusy}
              />
            </div>

            {/* 3 – Testo segnalazione */}
            <div>
              <FieldLabel
                htmlFor="testo"
                label="Segnalazione"
                required
                icon={FileText}
              />
              <TextArea
                id="testo"
                value={form.testo}
                onChange={(v) => update("testo", v)}
                placeholder="Descrivi il problema o la comunicazione da inviare…"
                error={errors.testo}
                disabled={isBusy}
              />
            </div>

            {/* 4 – Allegato PDF (opzionale) */}
            <div>
              <FieldLabel
                label="Allegato PDF"
                icon={Paperclip}
              />
              <PdfUpload
                file={pdfFile}
                onChange={handlePdfChange}
                onRemove={() => { setPdfFile(null); setPdfError(null); }}
                error={pdfError}
                disabled={isBusy}
              />
            </div>

            {/* Errore server */}
            <AnimatePresence>
              {status === "error" && serverError && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700"
                >
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>{serverError}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottone invio */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isBusy || !!pdfError}
              style={{ background: isBusy ? "#c4a" : PRIMARY_COLOR }}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl",
                "text-white text-sm font-bold tracking-wide transition-all",
                "focus:outline-none focus:ring-2 focus:ring-offset-2",
                isBusy || pdfError ? "opacity-70 cursor-not-allowed" : "hover:opacity-90 active:scale-[0.98]"
              )}
            >
              {isBusy ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Invio in corso…
                </>
              ) : (
                <>
                  <Send size={15} />
                  Invia segnalazione
                </>
              )}
            </button>

            {/* Nota campi obbligatori */}
            <p className="text-[10px] text-neutral-400 text-center -mt-2">
              I campi contrassegnati con <span style={{ color: PRIMARY_COLOR }}>*</span> sono obbligatori
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-[10px] text-neutral-400 mt-6">
            Studio CAI · App Segnalazioni v{APP_VERSION} · {BUILD_DATE_LABEL}
          </p>
        </motion.div>
      </main>
    </div>
  );
}
