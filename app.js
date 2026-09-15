/* App logic — v1.9.0 */
const APP_VERSION = "1.9.0";
const LAST_UPDATE = "2026-09-14";
const STORAGE_KEY = "cai_presenze_last_v2";
const QUEUE_KEY = "cai_presenze_queue_v1";
const HISTORY_KEY = "cai_presenze_history_v1";
const HISTORY_MAX = 5;
const DATE_WINDOW_DAYS = 60;
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

const HOURLY_TYPES = ["Straordinario", "Recupero"];
const FULL_DAY_ONLY_TYPES = ["Ferie", "Malattia"];

const state = {
  config: { ...CONFIG_DEFAULT },
  employees: [],
  flushing: false
};

const $ = (s, el=document) => el.querySelector(s);

function uuid(){
  try { if(crypto?.randomUUID) return crypto.randomUUID(); } catch(e) {}
  return "req-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

function readStore(key, fallback){
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch(e) { return fallback; }
}

function writeStore(key, value){
  try { localStorage.setItem(key, JSON.stringify(value)); } catch(e) {}
}

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
      { id: "082" },{ id: "102" },{ id: "103" },{ id: "104" }
    ];
  }
}

function fillEmployeeSelect(){
  // Solo il codice: nessun nome a video, per riservatezza.
  const empSel = $("#employee_id");
  state.employees.forEach(emp => {
    const opt = document.createElement("option");
    opt.value = emp.id;
    opt.textContent = emp.id;
    empSel.appendChild(opt);
  });
}

function renderTypeButtons(){
  const wrap = $("#type-buttons");
  if(!wrap) return;
  wrap.innerHTML = "";

  EVENT_TYPES.forEach((t, idx) => {
    const id = `type_${idx}`;
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "event_type";
    input.id = id;
    input.value = t;
    input.required = true;

    const label = document.createElement("label");
    label.className = "type-btn";
    label.setAttribute("for", id);
    label.textContent = t;

    input.addEventListener("change", () => {
      onTypeChange();
      onFormLiveUpdate();
    });

    wrap.appendChild(input);
    wrap.appendChild(label);
  });
}

function getSelectedType(){
  return document.querySelector('input[name="event_type"]:checked')?.value || "";
}

function setSelectedType(value){
  const el = [...document.querySelectorAll('input[name="event_type"]')].find(r => r.value === value);
  if(el) el.checked = true;
}

/* ---------- Date ---------- */

function toISODate(d){
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

function daysFromToday(iso){
  if(!iso) return 0;
  const today = new Date(toISODate(new Date()) + "T00:00:00");
  const target = new Date(iso + "T00:00:00");
  return Math.round((target - today) / 86400000);
}

function formatDay(iso){
  if(!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function countDays(startISO, endISO){
  if(!startISO || !endISO) return { total: 0, working: 0 };
  const start = new Date(startISO + "T00:00:00");
  const end = new Date(endISO + "T00:00:00");
  if(end < start) return { total: 0, working: 0 };

  let total = 0, working = 0;
  const cur = new Date(start);
  while(cur <= end && total < 400){
    total++;
    const wd = cur.getDay();
    if(wd !== 0 && wd !== 6) working++;
    cur.setDate(cur.getDate() + 1);
  }
  return { total, working };
}

/* ---------- Coda di invio ---------- */

function loadQueue(){ return readStore(QUEUE_KEY, []); }
function saveQueue(q){ writeStore(QUEUE_KEY, q); renderQueueBadge(); }

function enqueue(payload){
  const q = loadQueue();
  if(!q.some(item => item.payload.request_id === payload.request_id)){
    q.push({ payload, attempts: 0, queued_at: new Date().toISOString() });
  }
  saveQueue(q);
}

function renderQueueBadge(){
  const pill = $("#queue-pill");
  if(!pill) return;
  const n = loadQueue().length;
  if(n === 0){ pill.hidden = true; return; }
  pill.hidden = false;
  pill.textContent = n === 1
    ? "1 richiesta in attesa di invio"
    : `${n} richieste in attesa di invio`;
}

async function flushQueue(){
  if(state.flushing || !navigator.onLine) return;
  const q = loadQueue();
  if(q.length === 0) return;

  state.flushing = true;
  try {
    while(q.length){
      const item = q[0];
      try {
        await postJSON(state.config.webhook_url, item.payload);
        q.shift();
        saveQueue(q);
        updateHistoryStatus(item.payload.request_id, "sent");
      } catch(e) {
        item.attempts = (item.attempts || 0) + 1;
        saveQueue(q);
        break;
      }
    }
  } finally {
    state.flushing = false;
    renderQueueBadge();
    renderHistory();
  }
}

/* ---------- Storico invii ---------- */

function loadHistory(){ return readStore(HISTORY_KEY, []); }

function pushHistory(payload, status){
  const h = loadHistory();
  h.unshift({
    request_id: payload.request_id,
    employee_id: payload.employee_id,
    event_type: payload.event_type,
    event_date: payload.event_date,
    ferie_start: payload.ferie_start,
    ferie_end: payload.ferie_end,
    full_day: payload.full_day,
    hours: payload.hours,
    sent_at: payload.sent_at,
    status
  });
  writeStore(HISTORY_KEY, h.slice(0, HISTORY_MAX));
  renderHistory();
}

function updateHistoryStatus(requestId, status){
  const h = loadHistory();
  const row = h.find(r => r.request_id === requestId);
  if(!row) return;
  row.status = status;
  writeStore(HISTORY_KEY, h);
}

function describeEntry(row){
  const parts = [`Cod. ${row.employee_id}`, row.event_type];
  if(row.event_type === "Ferie" && row.ferie_start){
    const { total } = countDays(row.ferie_start, row.ferie_end);
    parts.push(`dal ${formatDay(row.ferie_start)} al ${formatDay(row.ferie_end)}`);
    if(total) parts.push(total === 1 ? "1 giorno" : `${total} giorni`);
  } else {
    parts.push(formatDay(row.event_date));
  }
  if(!row.full_day && row.hours) parts.push(`${String(row.hours).replace(".", ",")} ore`);
  return parts.join(" · ");
}

function buildHistoryCard(){
  const formCard = $("#presence-form")?.closest(".card");
  if(!formCard || $("#history-card")) return;

  const section = document.createElement("section");
  section.className = "card card--history";
  section.id = "history-card";
  section.hidden = true;
  section.innerHTML = `
    <h2>Ultime richieste da questo dispositivo</h2>
    <p class="muted small">Elenco locale, a solo scopo di riscontro. Non sostituisce il registro dello studio.</p>
    <ul class="history-list" id="history-list"></ul>
  `;
  formCard.after(section);
}

function renderHistory(){
  const card = $("#history-card");
  const list = $("#history-list");
  if(!card || !list) return;

  const h = loadHistory();
  if(h.length === 0){ card.hidden = true; return; }
  card.hidden = false;
  list.innerHTML = "";

  h.forEach(row => {
    const li = document.createElement("li");
    li.className = "history-item";

    const text = document.createElement("span");
    text.className = "history-text";
    text.textContent = describeEntry(row);

    const badge = document.createElement("span");
    badge.className = `history-status history-status--${row.status}`;
    badge.textContent = row.status === "sent" ? "Inviata" : "In attesa";

    li.appendChild(text);
    li.appendChild(badge);
    list.appendChild(li);
  });
}

/* ---------- Struttura della schermata ---------- */

function reorderFields(){
  // La tipologia decide quali campi servono: va scelta subito dopo il codice.
  const typeField = $("#type-buttons")?.closest(".field");
  const dateField = $("#event_date")?.closest(".field");
  if(typeField && dateField && dateField.parentElement === typeField.parentElement){
    dateField.before(typeField);
  }
}

function enhanceAccessibility(){
  const wrap = $("#type-buttons");
  const typeField = wrap?.closest(".field");
  const typeLabel = typeField?.querySelector("label:not(.type-btn)");
  const typeErr = $("#type-error");

  if(wrap){
    wrap.setAttribute("role", "radiogroup");
    if(typeLabel){
      if(!typeLabel.id) typeLabel.id = "type-label";
      wrap.setAttribute("aria-labelledby", typeLabel.id);
    }
    if(typeErr){
      if(!typeErr.id) typeErr.id = "type-error";
      wrap.setAttribute("aria-describedby", typeErr.id);
    }
  }

  const fullDay = $("#full_day");
  if(fullDay){
    fullDay.setAttribute("role", "switch");
    fullDay.setAttribute("aria-label", "Intera giornata");
    const syncAria = () => fullDay.setAttribute("aria-checked", String(fullDay.checked));
    fullDay.addEventListener("change", syncAria);
    syncAria();
  }

  const notes = $("#notes");
  if(notes){
    notes.placeholder = "Es. sostituzione del collega 062, oppure motivo del permesso.";
  }

  const hours = $("#hours");
  const hint = $("#hours-hint");
  if(hours && hint){
    if(!hint.id) hint.id = "hours-hint";
    hours.setAttribute("aria-describedby", hint.id);
  }
}

function cleanHeaderBadge(){
  // Rimuove le emoji decorative rimaste nel badge di versione in testata.
  const pill = $("#app-version")?.closest(".pill");
  if(!pill) return;
  const emoji = /[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2600}-\u{27BF}\u{FE0F}]/gu;
  [...pill.childNodes].forEach(node => {
    if(node.nodeType === Node.TEXT_NODE && emoji.test(node.textContent)){
      node.textContent = node.textContent.replace(emoji, "").trim();
    } else if(node.nodeType === Node.ELEMENT_NODE && node.id !== "app-version" && emoji.test(node.textContent)){
      node.remove();
    }
  });
}

function buildQueuePill(){
  const status = document.querySelector(".header .status");
  if(!status || $("#queue-pill")) return;
  const pill = document.createElement("span");
  pill.className = "pill pill--queue";
  pill.id = "queue-pill";
  pill.hidden = true;
  status.appendChild(pill);
}

function buildCertPending(){
  const certField = $("#cert-field");
  if(!certField || $("#cert_pending")) return;

  const wrap = document.createElement("label");
  wrap.className = "check-inline";
  wrap.innerHTML = `
    <input type="checkbox" id="cert_pending" name="cert_pending">
    <span>Certificato non ancora disponibile</span>
  `;
  certField.appendChild(wrap);

  $("#cert_pending").addEventListener("change", () => {
    const pending = $("#cert_pending").checked;
    const input = $("#medical_cert_number");
    input.disabled = pending;
    input.required = !pending;
    if(pending) input.value = "";
    onFormLiveUpdate();
  });
}

function buildSummary(){
  const form = $("#presence-form");
  const actions = form?.querySelector(".actions");
  if(!form || !actions || $("#summary")) return;

  const box = document.createElement("p");
  box.className = "summary";
  box.id = "summary";
  box.setAttribute("aria-live", "polite");
  box.hidden = true;
  actions.before(box);
}

function currentSummary(){
  const emp = $("#employee_id").value;
  const type = getSelectedType();
  if(!emp || !type) return "";

  const row = {
    employee_id: emp,
    event_type: type,
    event_date: $("#event_date").value,
    ferie_start: $("#ferie_start").value,
    ferie_end: $("#ferie_end").value,
    full_day: $("#full_day").checked,
    hours: parseFloat($("#hours").value) || null
  };

  let text = describeEntry(row);
  if(type === "Ferie" && row.ferie_start && row.ferie_end){
    const { working } = countDays(row.ferie_start, row.ferie_end);
    text += ` (${working} lavorativi, sabato e domenica esclusi)`;
  }
  if(type === "Malattia" && $("#cert_pending")?.checked){
    text += " · certificato da trasmettere";
  }
  return text;
}

function renderSummary(){
  const box = $("#summary");
  if(!box) return;
  const text = currentSummary();
  box.hidden = !text;
  box.textContent = text ? `Stai per inviare: ${text}` : "";
}

/* ---------- Form ---------- */

function initForm(){
  const d = $("#event_date");
  if(d && !d.value) d.valueAsDate = new Date();

  renderTypeButtons();
  reorderFields();
  buildQueuePill();
  buildCertPending();
  buildSummary();
  buildHistoryCard();
  enhanceAccessibility();
  cleanHeaderBadge();

  const hours = $("#hours");
  if(hours){
    hours.min = "0.5";
    hours.max = "12";
    hours.step = "0.5";
    hours.placeholder = "Es. 3.5";
  }

  const form = $("#presence-form");
  form.addEventListener("submit", onSubmit);
  form.addEventListener("input", onFormLiveUpdate, { passive: true });
  form.addEventListener("change", onFormLiveUpdate, { passive: true });

  $("#btn-reset").addEventListener("click", () => resetForm(true));
  $("#full_day").addEventListener("change", () => onFullDayToggle(true));

  $("#ferie_start").addEventListener("change", () => {
    const s = $("#ferie_start").value;
    const e = $("#ferie_end");
    if(s && !e.value) e.value = s;
    if(s && e.value && s > e.value) e.value = s;
    onFormLiveUpdate();
  });

  restoreLast();
  wireDateShortcuts();

  onFullDayToggle();
  onTypeChange();
  onFormLiveUpdate();
  attachNetStatus();

  renderQueueBadge();
  renderHistory();
  flushQueue();
  window.setInterval(flushQueue, 60000);

  const emp = $("#employee_id");
  if(emp && !emp.value) {
    try { emp.focus({ preventScroll: true }); } catch(e) { emp.focus(); }
  }
}

function wireDateShortcuts(){
  const dateInput = $("#event_date");
  const today = $("#btn-today");
  const yesterday = $("#btn-yesterday");
  if(!dateInput) return;

  if(today){
    today.addEventListener("click", () => {
      dateInput.value = toISODate(new Date());
      onFormLiveUpdate();
    });
  }
  if(yesterday){
    yesterday.addEventListener("click", () => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      dateInput.value = toISODate(d);
      onFormLiveUpdate();
    });
  }
}

function attachNetStatus(){
  const update = () => {
    const dot = $("#net-dot");
    const txt = $("#net-text");
    const online = navigator.onLine;
    if(dot) dot.classList.toggle("offline", !online);
    if(txt) txt.textContent = online ? "Online" : "Offline";
  };
  window.addEventListener("online", () => { update(); flushQueue(); });
  window.addEventListener("offline", update);
  update();

  const v = $("#app-version");
  if(v) v.textContent = `v${APP_VERSION}`;

  const fv = document.querySelector(".footer .version-badge");
  if(fv) fv.textContent = `v${APP_VERSION} — ultimo aggiornamento ${LAST_UPDATE}`;
}

function onFormLiveUpdate(){
  persistLast();
  clearFieldErrors();
  const typeErr = $("#type-error");
  if(typeErr) typeErr.classList.remove("show");
  renderSummary();
}

function persistLast(){
  writeStore(STORAGE_KEY, {
    employee_id: $("#employee_id").value || "",
    event_type: getSelectedType() || "",
    full_day: $("#full_day").checked
  });
}

function restoreLast(){
  const last = readStore(STORAGE_KEY, null);
  if(!last) return;
  if(last.employee_id) $("#employee_id").value = last.employee_id;
  if(last.event_type) setSelectedType(last.event_type);
  if(typeof last.full_day === "boolean") $("#full_day").checked = last.full_day;
}

function resetForm(showToast=false){
  const form = $("#presence-form");
  form.reset();
  const d = $("#event_date"); if(d) d.valueAsDate = new Date();
  $("#full_day").checked = true;

  document.querySelectorAll('input[name="event_type"]').forEach(r => r.checked = false);

  const pending = $("#cert_pending");
  if(pending){
    pending.checked = false;
    $("#medical_cert_number").disabled = false;
  }

  onFullDayToggle();
  onTypeChange();
  onFormLiveUpdate();
  $("#form-msg").textContent = "";
  if(showToast) toast("Campi puliti.", "warn");
}

function onFullDayToggle(focusHours=false){
  const full = $("#full_day").checked;
  const hours = $("#hours");
  const hint = $("#hours-hint");
  hours.disabled = full;
  hours.parentElement.style.opacity = full ? 0.6 : 1;
  hint.style.display = full ? "block" : "none";
  if(full){
    hours.value = "";
  } else if(focusHours){
    try { hours.focus({ preventScroll: false }); } catch(e) { hours.focus(); }
  }
}

function onTypeChange(){
  const type = getSelectedType();
  const isMalattia = type === "Malattia";
  const isFerie = type === "Ferie";
  const isHourly = HOURLY_TYPES.includes(type);
  const isFullDayOnly = FULL_DAY_ONLY_TYPES.includes(type);

  // Malattia: certificato, con possibilità di dichiararlo non ancora disponibile
  const certField = $("#cert-field");
  const certInput = $("#medical_cert_number");
  const certPending = $("#cert_pending");
  certField.style.display = isMalattia ? "block" : "none";
  certInput.required = isMalattia && !(certPending?.checked);
  if(!isMalattia){
    certInput.value = "";
    certInput.disabled = false;
    if(certPending) certPending.checked = false;
  }

  // Ferie: il periodo sostituisce la data singola, che viene derivata da ferie_start
  const ferieWrap = $("#ferie-range");
  const ferieStart = $("#ferie_start");
  const ferieEnd = $("#ferie_end");
  const dateField = $("#event_date")?.closest(".field");
  ferieWrap.style.display = isFerie ? "block" : "none";
  ferieStart.required = isFerie;
  ferieEnd.required = isFerie;
  if(!isFerie){ ferieStart.value = ""; ferieEnd.value = ""; }
  if(dateField) dateField.style.display = isFerie ? "none" : "";

  // Ore
  const fullDay = $("#full_day");
  const hoursField = $("#hours")?.closest(".field");
  const fullDayField = fullDay?.closest(".field");

  if(hoursField) hoursField.style.display = isFullDayOnly ? "none" : "";
  if(fullDayField) fullDayField.style.display = isFullDayOnly ? "none" : "";

  if(isFullDayOnly && !fullDay.checked) fullDay.checked = true;
  if(isHourly && fullDay.checked) fullDay.checked = false;

  onFullDayToggle();
  renderSummary();
}

function serializeForm(form){
  const fd = new FormData(form);
  const data = Object.fromEntries(fd.entries());
  data.full_day = !!fd.get("full_day");
  data.cert_pending = !!fd.get("cert_pending");
  if(data.hours) data.hours = parseFloat(data.hours);
  data.sent_at = new Date().toISOString();
  data._hp = fd.get("website");

  // Per le ferie la data dell'evento è il primo giorno del periodo.
  if(data.event_type === "Ferie" && data.ferie_start){
    data.event_date = data.ferie_start;
  }
  return data;
}

function validateBusinessRules(data){
  if(!data.event_type) return "Seleziona una tipologia.";

  if(data.event_type === "Ferie"){
    if(!data.ferie_start || !data.ferie_end) return "Per le ferie è obbligatorio indicare data di inizio e fine.";
    if(data.ferie_start > data.ferie_end) return "Il periodo ferie non è valido: la data di inizio non può essere successiva alla data di fine.";
  }

  if(data.event_type === "Malattia" && !data.cert_pending && !data.medical_cert_number){
    return "Indica il numero di certificato, oppure spunta \u201CCertificato non ancora disponibile\u201D.";
  }

  if(!data.full_day){
    const h = parseFloat(data.hours);
    if(!h) return "Indica le ore, oppure attiva Intera giornata.";
    if(h < 0.5 || h > 12) return "Le ore devono essere comprese tra 0,5 e 12.";
    if(Math.round(h * 2) !== h * 2) return "Indica le ore a intervalli di mezz'ora (es. 3 oppure 3,5).";
  }

  const dates = [data.event_date, data.ferie_start, data.ferie_end].filter(Boolean);
  for(const iso of dates){
    if(Math.abs(daysFromToday(iso)) > DATE_WINDOW_DAYS){
      return `La data ${formatDay(iso)} è fuori dall'intervallo consentito (${DATE_WINDOW_DAYS} giorni). Controlla l'anno.`;
    }
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
  }, 3800);
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
  document.querySelectorAll(".field-error.show").forEach(p => {
    if(p.id !== "type-error"){
      p.classList.remove("show");
      p.textContent = "";
    }
  });
}

function showValidityErrors(form){
  const elements = [...form.elements].filter(el => el instanceof HTMLElement);
  elements.forEach(attachFieldError);

  let firstInvalid = null;
  elements.forEach(el => {
    if(el.willValidate && !el.checkValidity()){
      if(!firstInvalid) firstInvalid = el;
    }
  });
  if(firstInvalid){
    try { firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" }); } catch(e) {}
    try { firstInvalid.focus({ preventScroll: true }); } catch(e) { firstInvalid.focus(); }
    try { firstInvalid.reportValidity(); } catch(e) {}
  }
}

function showTypeError(){
  const p = $("#type-error");
  const wrap = $("#type-buttons");
  if(p){
    p.classList.add("show");
    p.textContent = "Seleziona una tipologia.";
  }
  if(wrap){
    try { wrap.scrollIntoView({ behavior: "smooth", block: "center" }); } catch(e) {}
    const firstRadio = wrap.querySelector('input[name="event_type"]');
    if(firstRadio){ try { firstRadio.focus({ preventScroll: true }); } catch(e) {} }
  }
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

async function onSubmit(ev){
  ev.preventDefault();
  const form = ev.currentTarget;
  const msg = $("#form-msg");
  msg.textContent = "";

  if($("#website").value) return;

  if(!getSelectedType()){
    msg.textContent = "Seleziona una tipologia.";
    toast("Seleziona una tipologia.", "warn");
    showTypeError();
    return;
  }

  if(!form.checkValidity()){
    msg.textContent = "Controlla i campi obbligatori.";
    showValidityErrors(form);
    toast("Controlla i campi evidenziati.", "warn");
    return;
  }

  const data = serializeForm(form);
  const ruleError = validateBusinessRules(data);
  if(ruleError){
    msg.textContent = ruleError;
    toast(ruleError, "warn");
    if(ruleError.includes("tipologia")) showTypeError();
    return;
  }

  const ferieCount = data.event_type === "Ferie"
    ? countDays(data.ferie_start, data.ferie_end)
    : { total: 0, working: 0 };

  const payload = {
    source: "portieri-presenze-webapp",
    version: APP_VERSION,
    request_id: uuid(),
    employee_id: data.employee_id,
    event_date: data.event_date,
    event_type: data.event_type,
    full_day: data.full_day,
    hours: data.hours ?? null,
    medical_cert_number: data.medical_cert_number || "",
    medical_cert_pending: data.cert_pending,
    ferie_start: data.ferie_start || "",
    ferie_end: data.ferie_end || "",
    ferie_days: ferieCount.total || null,
    ferie_working_days: ferieCount.working || null,
    notes: data.notes || "",
    sent_at: data.sent_at
  };

  const recap = describeEntry(payload);

  if(!navigator.onLine){
    enqueue(payload);
    pushHistory(payload, "queued");
    resetForm(false);
    msg.textContent = `Salvata in attesa di rete: ${recap}`;
    toast("Nessuna rete. La richiesta è salvata e parte da sola appena torni online.", "warn");
    return;
  }

  msg.textContent = "Invio in corso...";
  setLoading(true);

  try {
    await postJSON(state.config.webhook_url, payload);
    pushHistory(payload, "sent");
    resetForm(false);
    msg.textContent = `Inviata: ${recap}`;
    toast(`Richiesta inviata — ${recap}`, "ok");
  } catch (e) {
    enqueue(payload);
    pushHistory(payload, "queued");
    resetForm(false);
    msg.textContent = `In attesa di invio: ${recap}`;
    toast("Invio non riuscito. La richiesta resta in coda e riparte da sola.", "warn");
  } finally {
    setLoading(false);
  }
}

/* ---------- PWA ---------- */

function setupPWA(){
  if(!document.querySelector('link[rel="manifest"]')){
    const link = document.createElement("link");
    link.rel = "manifest";
    link.href = "./manifest.webmanifest";
    document.head.appendChild(link);
  }
  if(!document.querySelector('meta[name="theme-color"]')){
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = "#8B1538";
    document.head.appendChild(meta);
  }
  if(!document.querySelector('link[rel="apple-touch-icon"]')){
    const icon = document.createElement("link");
    icon.rel = "apple-touch-icon";
    icon.href = "./icon.svg";
    document.head.appendChild(icon);
  }

  if("serviceWorker" in navigator && location.protocol === "https:"){
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    });
  }
}

(async function main(){
  setYear();
  setupPWA();
  await loadConfig();
  await loadEmployees();
  fillEmployeeSelect();
  initForm();
})();
