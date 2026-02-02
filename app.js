/* App logic — v2.0 Enhanced */
const CONFIG_DEFAULT = {
  webhook_url: "https://hook.eu1.make.com/25pmcwrlyx8qbgd34n2vf0fxpnfyuekl"
};

const EVENT_TYPES = [
  "Ferie",
  "Permesso",
  "Permesso 104",
  "Malattia",
  "Assenza non retribuita",
  "Straordinario",
  "Recupero",
  "Formazione"
];

const state = {
  config: { ...CONFIG_DEFAULT },
  employees: [],
  submitting: false,
  history: []
};

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

// ========== UTILITY FUNCTIONS ==========

function setYear() {
  const y = $("#year");
  if (y) y.textContent = new Date().getFullYear();
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function showMessage(msg, type = 'info') {
  const msgEl = $("#form-msg");
  msgEl.textContent = msg;
  msgEl.className = `form-msg ${type}`;
  
  // Animate message
  msgEl.style.animation = 'none';
  setTimeout(() => {
    msgEl.style.animation = 'slideIn 0.3s ease-out';
  }, 10);
}

function clearMessage() {
  const msgEl = $("#form-msg");
  msgEl.textContent = "";
  msgEl.className = "form-msg";
}

// ========== LOCAL STORAGE ==========

function saveToHistory(data) {
  try {
    const history = JSON.parse(localStorage.getItem('submitHistory') || '[]');
    history.unshift({
      ...data,
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 10 submissions
    if (history.length > 10) history.pop();
    
    localStorage.setItem('submitHistory', JSON.stringify(history));
    state.history = history;
  } catch (e) {
    console.error('Failed to save history:', e);
  }
}

function loadHistory() {
  try {
    const history = JSON.parse(localStorage.getItem('submitHistory') || '[]');
    state.history = history;
    return history;
  } catch (e) {
    console.error('Failed to load history:', e);
    return [];
  }
}

function saveDraft(formData) {
  try {
    localStorage.setItem('formDraft', JSON.stringify(formData));
  } catch (e) {
    console.error('Failed to save draft:', e);
  }
}

function loadDraft() {
  try {
    const draft = localStorage.getItem('formDraft');
    return draft ? JSON.parse(draft) : null;
  } catch (e) {
    console.error('Failed to load draft:', e);
    return null;
  }
}

function clearDraft() {
  try {
    localStorage.removeItem('formDraft');
  } catch (e) {
    console.error('Failed to clear draft:', e);
  }
}

// ========== LOAD CONFIG & EMPLOYEES ==========

async function loadConfig() {
  try {
    const res = await fetch("./config.json", { cache: "no-store" });
    if (res.ok) state.config = { ...CONFIG_DEFAULT, ...(await res.json()) };
  } catch (e) {
    console.error('Failed to load config:', e);
  }
}

async function loadEmployees() {
  try {
    const res = await fetch("./employees.json", { cache: "no-store" });
    if (!res.ok) throw new Error('Failed to load employees');
    state.employees = await res.json();
  } catch (e) {
    console.error('Error loading employees:', e);
    // Fallback
    state.employees = [
      { id: "005" }, { id: "012" }, { id: "019" }, { id: "047" }, { id: "053" },
      { id: "056" }, { id: "061" }, { id: "062" }, { id: "070" }, { id: "077" },
      { id: "082" }, { id: "102" }, { id: "103" }
    ];
  }
}

// ========== FORM INITIALIZATION ==========

function fillSelects() {
  const empSel = $("#employee_id");
  empSel.innerHTML = '<option value="">Seleziona codice...</option>';
  
  state.employees.forEach(emp => {
    const opt = document.createElement("option");
    opt.value = emp.id;
    opt.textContent = emp.id;
    empSel.appendChild(opt);
  });

  const typeSel = $("#event_type");
  typeSel.innerHTML = '<option value="">Seleziona...</option>';
  
  EVENT_TYPES.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    typeSel.appendChild(opt);
  });
}

function initForm() {
  const form = $("#presence-form");
  const dateInput = $("#event_date");
  
  // Set today's date
  if (dateInput && !dateInput.value) {
    dateInput.valueAsDate = new Date();
  }

  // Load draft if exists
  const draft = loadDraft();
  if (draft) {
    if (confirm("È stata trovata una bozza salvata. Vuoi ripristinarla?")) {
      restoreDraft(draft);
    } else {
      clearDraft();
    }
  }

  // Event listeners
  form.addEventListener("submit", onSubmit);
  $("#btn-reset").addEventListener("click", handleReset);
  $("#full_day").addEventListener("change", onFullDayToggle);
  $("#event_type").addEventListener("change", onTypeChange);
  
  // Auto-save draft
  form.addEventListener("input", debounce(() => {
    const data = serializeForm(form);
    saveDraft(data);
  }, 1000));
  
  // Initial state
  onFullDayToggle();
  onTypeChange();
  
  // Load history
  loadHistory();
}

function restoreDraft(draft) {
  Object.keys(draft).forEach(key => {
    const el = $(`[name="${key}"]`);
    if (el) {
      if (el.type === 'checkbox') {
        el.checked = draft[key];
      } else {
        el.value = draft[key] || '';
      }
    }
  });
  
  // Trigger change events
  onFullDayToggle();
  onTypeChange();
}

// ========== FORM HANDLERS ==========

function onFullDayToggle() {
  const full = $("#full_day").checked;
  const hours = $("#hours");
  const hint = $("#hours-hint");
  const parent = hours.parentElement;
  
  hours.disabled = full;
  parent.style.transition = 'opacity 0.3s ease';
  parent.style.opacity = full ? 0.5 : 1;
  hint.style.display = full ? "block" : "none";
  
  if (full) hours.value = "";
}

function onTypeChange() {
  const type = $("#event_type").value;
  const isMalattia = type === "Malattia";
  const isFerie = type === "Ferie";

  // Malattia: certificato
  const certField = $("#cert-field");
  const certInput = $("#medical_cert_number");
  certField.style.display = isMalattia ? "block" : "none";
  certInput.required = isMalattia;
  if (!isMalattia) certInput.value = "";

  // Ferie: range date
  const ferieWrap = $("#ferie-range");
  const ferieStart = $("#ferie_start");
  const ferieEnd = $("#ferie_end");
  ferieWrap.style.display = isFerie ? "block" : "none";
  ferieStart.required = isFerie;
  ferieEnd.required = isFerie;
  if (!isFerie) {
    ferieStart.value = "";
    ferieEnd.value = "";
  }
}

function handleReset() {
  if (confirm("Sei sicuro di voler pulire tutti i campi?")) {
    $("#presence-form").reset();
    clearDraft();
    clearMessage();
    
    // Reset date to today
    const dateInput = $("#event_date");
    if (dateInput) dateInput.valueAsDate = new Date();
    
    $("#full_day").checked = true;
    onFullDayToggle();
    onTypeChange();
    
    showMessage("Form pulito con successo", "success");
  }
}

// ========== VALIDATION ==========

function serializeForm(form) {
  const fd = new FormData(form);
  const data = Object.fromEntries(fd.entries());
  data.full_day = !!fd.get("full_day");
  if (data.hours) data.hours = parseFloat(data.hours);
  data.sent_at = new Date().toISOString();
  data._hp = fd.get("website");
  return data;
}

function validateBusinessRules(data) {
  if (data.event_type === "Ferie") {
    if (!data.ferie_start || !data.ferie_end) {
      return "Per le ferie è obbligatorio indicare data di inizio e fine.";
    }
    if (data.ferie_start > data.ferie_end) {
      return "Il periodo ferie non è valido: la data di inizio non può essere successiva alla data di fine.";
    }
  }
  
  if (!data.full_day && (!data.hours || data.hours <= 0)) {
    return "Se non è l'intera giornata, specifica il numero di ore.";
  }
  
  return "";
}

function showConfirmDialog(data) {
  const type = data.event_type;
  const date = formatDate(data.event_date);
  const emp = data.employee_id;
  const fullDay = data.full_day ? "Sì" : "No";
  
  let message = `Confermi l'invio?\n\n`;
  message += `Dipendente: ${emp}\n`;
  message += `Data: ${date}\n`;
  message += `Tipo: ${type}\n`;
  message += `Intera giornata: ${fullDay}\n`;
  
  if (!data.full_day && data.hours) {
    message += `Ore: ${data.hours}\n`;
  }
  
  if (type === "Ferie") {
    message += `Periodo: ${formatDate(data.ferie_start)} - ${formatDate(data.ferie_end)}\n`;
  }
  
  if (type === "Malattia" && data.medical_cert_number) {
    message += `Certificato: ${data.medical_cert_number}\n`;
  }
  
  if (data.notes) {
    message += `Note: ${data.notes}\n`;
  }
  
  return confirm(message);
}

// ========== SUBMISSION ==========

async function postJSON(url, payload) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    mode: "cors"
  });
  
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

function fallbackFormPOST(url, payload) {
  const form = document.createElement("form");
  form.action = url;
  form.method = "POST";
  form.target = "_blank";
  form.style.display = "none";
  
  const inp = document.createElement("input");
  inp.type = "hidden";
  inp.name = "payload";
  inp.value = JSON.stringify(payload);
  
  form.appendChild(inp);
  document.body.appendChild(form);
  form.submit();
  
  setTimeout(() => form.remove(), 1000);
}

async function onSubmit(ev) {
  ev.preventDefault();
  
  if (state.submitting) return;
  
  const form = ev.currentTarget;
  const submitBtn = form.querySelector('button[type="submit"]');
  
  clearMessage();

  // Honeypot check
  if ($("#website").value) {
    console.warn('Honeypot triggered');
    return;
  }

  // HTML5 validation
  if (!form.checkValidity()) {
    showMessage("Controlla i campi obbligatori evidenziati in rosso.", "error");
    return;
  }

  const data = serializeForm(form);
  
  // Business rules validation
  const ruleError = validateBusinessRules(data);
  if (ruleError) {
    showMessage(ruleError, "error");
    return;
  }
  
  // Confirmation dialog
  if (!showConfirmDialog(data)) {
    return;
  }

  const payload = {
    source: "portieri-presenze-webapp",
    version: "2.0",
    employee_id: data.employee_id,
    event_date: data.event_date,
    event_type: data.event_type,
    full_day: data.full_day,
    hours: data.hours ?? null,
    medical_cert_number: data.medical_cert_number || "",
    ferie_start: data.ferie_start || "",
    ferie_end: data.ferie_end || "",
    notes: data.notes || "",
    sent_at: data.sent_at
  };

  // Show loading state
  state.submitting = true;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner"></span> Invio in corso...';
  showMessage("Invio in corso...", "info");

  try {
    await postJSON(state.config.webhook_url, payload);
    
    // Success
    showMessage("✅ Richiesta inviata con successo!", "success");
    saveToHistory(payload);
    clearDraft();
    
    // Reset form
    form.reset();
    const dateInput = $("#event_date");
    if (dateInput) dateInput.valueAsDate = new Date();
    $("#full_day").checked = true;
    onFullDayToggle();
    onTypeChange();
    
  } catch (e) {
    console.error('Submit error:', e);
    
    try {
      fallbackFormPOST(state.config.webhook_url, payload);
      showMessage("⚠️ Invio effettuato con metodo alternativo (aperto in nuova scheda).", "warning");
    } catch (err) {
      showMessage("❌ Errore nell'invio. Verifica la connessione e riprova.", "error");
    }
  } finally {
    state.submitting = false;
    submitBtn.disabled = false;
    submitBtn.textContent = 'Invia la Richiesta';
  }
}

// ========== UTILITIES ==========

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ========== INITIALIZATION ==========

(async function main() {
  setYear();
  await loadConfig();
  await loadEmployees();
  fillSelects();
  initForm();
  
  console.log('App initialized successfully - v2.0');
})();