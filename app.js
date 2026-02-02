/* App logic — v1.4.0 */
const APP_VERSION = "1.4.0";
const STORAGE_KEY = "cai_presenze_last_v1";
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
  employeesAll: []
};

const $ = (s, el=document) => el.querySelector(s);

function setYear(){
  const y = document.getElementById("year");
  if(y) y.textContent = new Date().getFullYear();
}

async function loadConfig(){
  try {
    const res = await fetch("./config.json", { cache: "no-store" });
    if(res.ok) state.config = { ...CONFIG_DEFAULT, ...(await res.json()) };
  } catch(e) {}
}

async function loadEmployees(){
  try {
    const res = await fetch("./employees.json", { cache: "no-store" });
    if(!res.ok) throw 0;
    state.employees = await res.json();
  } catch(e) {
    state.employees = [
      { id: "005" },{ id: "012" },{ id: "019" },{ id: "047" },{ id: "053" },
      { id: "056" },{ id: "061" },{ id: "062" },{ id: "070" },{ id: "077" },
      { id: "082" },{ id: "102" },{ id: "103" }
    ];
  }
}

function fillSelects(){
  const empSel = $("#employee_id");
  state.employees.forEach(emp => {
    const opt = document.createElement("option");
    opt.value = emp.id;
    opt.textContent = emp.id;
    empSel.appendChild(opt);
  });
  const typeSel = $("#event_type");
  EVENT_TYPES.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    typeSel.appendChild(opt);
  });
}

function initForm(){
  const d = $("#event_date");
  if(d && !d.value) d.valueAsDate = new Date();
  const form = $("#presence-form");
  form.addEventListener("submit", onSubmit);
  form.addEventListener("input", onFormLiveUpdate, { passive: true });
  form.addEventListener("change", onFormLiveUpdate, { passive: true });

  $("#btn-reset").addEventListener("click", () => resetForm(true));
  $("#full_day").addEventListener("change", onFullDayToggle);
  $("#event_type").addEventListener("change", onTypeChange);
  $("#employee_filter").addEventListener("input", onEmployeeFilter, { passive: true });

  // Ferie helper: se selezioni l'inizio e la fine è vuota, compila automaticamente.
  $("#ferie_start").addEventListener("change", () => {
    const s = $("#ferie_start").value;
    const e = $("#ferie_end");
    if(s && !e.value) e.value = s;
    if(s && e.value && s > e.value) e.value = s;
  });

  // Ripristina ultime scelte
  restoreLast();

  onFullDayToggle();
  onTypeChange();
  onFormLiveUpdate();
  attachNetStatus();
  renderTypeChips();
}

function attachNetStatus(){
  const update = () => {
    const dot = $("#net-dot");
    const txt = $("#net-text");
    const online = navigator.onLine;
    if(dot) dot.classList.toggle("offline", !online);
    if(txt) txt.textContent = online ? "Online" : "Offline";
  };
  window.addEventListener("online", update);
  window.addEventListener("offline", update);
  update();
  const v = $("#app-version");
  if(v) v.textContent = `v${APP_VERSION}`;
}

function renderTypeChips(){
  const wrap = $("#type-chips");
  if(!wrap) return;
  wrap.innerHTML = "";
  EVENT_TYPES.forEach(t => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chip";
    b.textContent = t;
    b.addEventListener("click", () => {
      $("#event_type").value = t;
      onTypeChange();
      onFormLiveUpdate();
      persistLast();
      highlightActiveChip();
    });
    wrap.appendChild(b);
  });
  highlightActiveChip();
}

function highlightActiveChip(){
  const wrap = $("#type-chips");
  if(!wrap) return;
  const current = $("#event_type").value;
  [...wrap.children].forEach(el => el.classList.toggle("active", el.textContent === current));
}

function onEmployeeFilter(){
  const q = ($("#employee_filter").value || "").trim();
  const list = state.employeesAll;
  state.employees = q ? list.filter(e => String(e.id).includes(q)) : [...list];
  const sel = $("#employee_id");
  const current = sel.value;
  sel.innerHTML = '<option value="">Seleziona codice...</option>';
  state.employees.forEach(emp => {
    const opt = document.createElement("option");
    opt.value = emp.id;
    opt.textContent = emp.id;
    sel.appendChild(opt);
  });
  if(current && state.employees.some(e => e.id === current)) sel.value = current;
}

function onFormLiveUpdate(){
  highlightActiveChip();
  updateSummary();
  persistLast();
  clearFieldErrors();
}

function updateSummary(){
  const emp = $("#employee_id").value || "—";
  const date = $("#event_date").value || "—";
  const type = $("#event_type").value || "—";
  const full = $("#full_day").checked;
  const hours = $("#hours").value;
  const notes = ($("#notes").value || "").trim();

  $("#sum-emp").textContent = emp;
  $("#sum-date").textContent = date;
  $("#sum-type").textContent = type;
  $("#sum-dur").textContent = full ? "Intera giornata" : (hours ? `${hours} ore` : "—");
  $("#sum-notes").textContent = notes ? notes : "—";
}

function persistLast(){
  try {
    const data = {
      employee_id: $("#employee_id").value || "",
      event_type: $("#event_type").value || "",
      full_day: $("#full_day").checked
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch(e) {}
}

function restoreLast(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return;
    const last = JSON.parse(raw);
    if(last.employee_id) $("#employee_id").value = last.employee_id;
    if(last.event_type) $("#event_type").value = last.event_type;
    if(typeof last.full_day === "boolean") $("#full_day").checked = last.full_day;
  } catch(e) {}
}

function resetForm(showToast=false){
  const form = $("#presence-form");
  form.reset();
  const d = $("#event_date"); if(d) d.valueAsDate = new Date();
  $("#full_day").checked = true;
  $("#employee_filter").value = "";
  onEmployeeFilter();
  onFullDayToggle();
  onTypeChange();
  onFormLiveUpdate();
  $("#form-msg").textContent = "";
  if(showToast) toast("Campi puliti.", "warn");
}

function onFullDayToggle(){
  const full = $("#full_day").checked;
  const hours = $("#hours");
  const hint = $("#hours-hint");
  hours.disabled = full;
  hours.parentElement.style.opacity = full ? 0.5 : 1;
  hint.style.display = full ? "block" : "none";
  if(full) hours.value = "";
}

function onTypeChange(){
  const type = $("#event_type").value;
  const isMalattia = type === "Malattia";
  const isFerie = type === "Ferie";

  // Malattia: certificato
  const certField = $("#cert-field");
  const certInput = $("#medical_cert_number");
  certField.style.display = isMalattia ? "block" : "none";
  certInput.required = isMalattia;
  if(!isMalattia) certInput.value = "";

  // Ferie: range date obbligatorio
  const ferieWrap = $("#ferie-range");
  const ferieStart = $("#ferie_start");
  const ferieEnd = $("#ferie_end");
  ferieWrap.style.display = isFerie ? "block" : "none";
  ferieStart.required = isFerie;
  ferieEnd.required = isFerie;
  if(!isFerie){ ferieStart.value = ""; ferieEnd.value = ""; }
}

function serializeForm(form){
  const fd = new FormData(form);
  const data = Object.fromEntries(fd.entries());
  data.full_day = !!fd.get("full_day");
  if(data.hours) data.hours = parseFloat(data.hours);
  data.sent_at = new Date().toISOString();
  data._hp = fd.get("website");
  return data;
}

function validateBusinessRules(data){
  if(data.event_type === "Ferie"){
    if(!data.ferie_start || !data.ferie_end) return "Per le ferie è obbligatorio indicare data di inizio e fine.";
    if(data.ferie_start > data.ferie_end) return "Il periodo ferie non è valido: la data di inizio non può essere successiva alla data di fine.";
  }
  return "";
}

function toast(text, variant="ok"){
  const t = $("#toast");
  if(!t) return;
  t.className = `toast show ${variant}`;
  t.textContent = text;
  window.clearTimeout(toast._t);
  toast._t = window.setTimeout(() => {
    t.className = "toast";
    t.textContent = "";
  }, 3200);
}

function setLoading(isLoading){
  const btn = $("#btn-submit");
  if(!btn) return;
  btn.disabled = isLoading;
  btn.classList.toggle("loading", isLoading);
}

function attachFieldError(el){
  if(!el || el.dataset.errAttached) return;
  el.dataset.errAttached = "1";
  const field = el.closest(".field") || el.parentElement;
  if(!field) return;
  let p = field.querySelector(".field-error");
  if(!p){
    p = document.createElement("p");
    p.className = "field-error";
    field.appendChild(p);
  }
  el.addEventListener("invalid", (e) => {
    e.preventDefault();
    el.classList.add("invalid");
    p.textContent = el.validationMessage || "Campo non valido.";
    p.classList.add("show");
  });
  el.addEventListener("input", () => {
    if(el.checkValidity()){
      el.classList.remove("invalid");
      p.textContent = "";
      p.classList.remove("show");
    }
  }, { passive: true });
}

function clearFieldErrors(){
  document.querySelectorAll(".invalid").forEach(el => el.classList.remove("invalid"));
  document.querySelectorAll(".field-error.show").forEach(p => { p.classList.remove("show"); p.textContent = ""; });
}

function showValidityErrors(form){
  const elements = [...form.elements].filter(el => el instanceof HTMLElement);
  elements.forEach(attachFieldError);
  // forza i messaggi
  elements.forEach(el => {
    if(el.willValidate && !el.checkValidity()){
      try { el.reportValidity(); } catch(e) {}
    }
  });
}

async function postJSON(url, payload){
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    mode: "cors"
  });
  if(!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

function fallbackFormPOST(url, payload){
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

async function onSubmit(ev){
  ev.preventDefault();
  const form = ev.currentTarget;
  const msg = $("#form-msg");
  msg.textContent = "";

  if($("#website").value) return;

  if(!form.checkValidity()){
    msg.textContent = "Controlla i campi obbligatori.";
    showValidityErrors(form);
    toast("⚠️ Controlla i campi evidenziati.", "warn");
    return;
  }

  const data = serializeForm(form);
  const ruleError = validateBusinessRules(data);
  if(ruleError){
    msg.textContent = ruleError;
    toast(`⚠️ ${ruleError}`, "warn");
    return;
  }

  const payload = {
    source: "portieri-presenze-webapp",
    version: APP_VERSION,
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

  msg.textContent = "Invio in corso...";
  setLoading(true);

  try {
    await postJSON(state.config.webhook_url, payload);
    msg.textContent = "✅ Richiesta inviata con successo.";
    toast("✅ Richiesta inviata.", "ok");
    resetForm(false);
  } catch (e) {
    try {
      fallbackFormPOST(state.config.webhook_url, payload);
      msg.textContent = "⚠️ Invio effettuato con metodo alternativo (aperto in nuova scheda).";
      toast("⚠️ Inviato con metodo alternativo (nuova scheda).", "warn");
    } catch(err) {
      msg.textContent = "❌ Errore nell'invio. Riprova più tardi.";
      toast("❌ Errore nell'invio. Riprova più tardi.", "err");
    }
  } finally {
    setLoading(false);
  }
}

(async function main(){
  setYear();
  await loadConfig();
  await loadEmployees();
  state.employeesAll = [...state.employees];
  fillSelects();
  initForm();
})();