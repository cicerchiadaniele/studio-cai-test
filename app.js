/* Studio CAI — Presenze v1.1.0 */
const APP_VERSION = "1.1.0";
const WEBHOOK_DEFAULT = "https://hook.eu1.make.com/wgbye8bprwfsxze34wuydvxckplijn1z";

/* ── QR CODES ─────────────────────────────────────────────────────────────── */
const QR_CODES = {
  "STF001": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOgAAADoCAIAAABqyz8vAAAEQ0lEQVR4nO3dwY0dNxBAQa/hGJyL83IYysu5OInRQb4Y0BwosEG+3aqzNDva/8BDo8X/8TzPb1Dz++kXgF8hXJKES5JwSRIuScIlSbgkCZck4ZIkXJKES5JwSRIuScIlSbgk/bH6F779+dfEe2z397//LP356X/X2/u8/dzV93/zWT8vJy5JwiVJuCQJlyThkiRckoRL0vIc982uueOq1Tnl6tx015x11zx11/tUPq83TlyShEuScEkSLknCJUm4JAmXpG1z3De75na75o7Te671PdrbPq83TlyShEuScEkSLknCJUm4JAmXpPE5bsWuPd3VOejq8/nBiUuScEkSLknCJUm4JAmXJOGSZI77n9v2fU89v8KJS5JwSRIuScIlSbgkCZck4ZI0Pse9be64a+/2lOn7HG77vN44cUkSLknCJUm4JAmXJOGSJFySts1xb5t3Ttv1vWin5sr1z8uJS5JwSRIuScIlSbgkCZck4ZK0PMet7GvuUr8n4bN+Xk5ckoRLknBJEi5JwiVJuCQJl6SP53lOv8P/TO+Jrs41p7+3bHrOuuv9d/3cXc934pIkXJKES5JwSRIuScIlSbgkLe/jnvr/+Lvmr6vzxc+6z7rqtt+bE5ck4ZIkXJKES5JwSRIuScIlafxehV33v07vlZ7auz21L3vb/bur/y4nLknCJUm4JAmXJOGSJFyShEvSdd9zNn0vwfRzVu2ap07fYzA9913lxCVJuCQJlyThkiRckoRLknBJ2navwqk56Kk93VPz11P7vqfmtW+cuCQJlyThkiRckoRLknBJEi5Jy99zVtm7nVZ/z2nux4WfEC5JwiVJuCQJlyThkiRckpbnuKtu2+M8dW/u9PNP7fWemls7cUkSLknCJUm4JAmXJOGSJFySxue4n9Vt9+OuPn+XU+/pxCVJuCQJlyThkiRckoRLknBJ2nY/7qpT97+uOvU9YdP37+5y6l5kJy5JwiVJuCQJlyThkiRckoRL0pfbx52+J2H1505/79qq2+5PeOPEJUm4JAmXJOGSJFyShEuScEk6to87bXquucup50/Pj6fnwU5ckoRLknBJEi5JwiVJuCQJl6TlOe6bU/uat90jW/letFX2cWED4ZIkXJKES5JwSRIuScIladsc981tc9Y3u+ajq/upu34/t+1JT39eTlyShEuScEkSLknCJUm4JAmXpPE57m1u2ys9dT9u/b4FJy5JwiVJuCQJlyThkiRckoRL0peb476Z3medvt9gdT66+pzp91nlxCVJuCQJlyThkiRckoRLknBJGp/j3rb/umrXfupt9x6cYh+XL024JAmXJOGSJFyShEuScEnaNsetzymn90pP7a1O30+8616FVU5ckoRLknBJEi5JwiVJuCQJl6SP53lOvwMsc+KSJFyShEuScEkSLknCJUm4JAmXJOGSJFyShEuScEkSLknCJUm4JH0Hr6FxNlMiG/sAAAAASUVORK5CYII=",
  "STF002": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOgAAADoCAIAAABqyz8vAAAEOElEQVR4nO3d0W0dNxBAUctwDenFfbmM9JVe3MSmAe0HjSHIa53zGcirhd4FPwbMvI/neb5BzffTLwB/QrgkCZck4ZIkXJKES5JwSRIuScIlSbgkCZck4ZIkXJKES5JwSfqx+g/+/efnjvcY9+v3f5/+96n33/381d/7pv55vXHikiRckoRLknBJEi5JwiVJuCQtz3HfrM7hpqzOKafe87bfu/r8yuf1xolLknBJEi5JwiVJuCQJlyThkjQ2x32z+/7rlKn5aOX3vql8Xk5ckoRLknBJEi5JwiVJuCQJl6Ttc9zbnNp7UNlvUOHEJUm4JAmXJOGSJFyShEuScEn6cnPcqXuiq/Paqb22p+7p3saJS5JwSRIuScIlSbgkCZck4ZK0fY5bnzvunqfeNq+tfF5OXJKES5JwSRIuScIlSbgkCZeksTluZW/AbXPTVbvv+1Y4cUkSLknCJUm4JAmXJOGSJFySPp7nOf0OV7htrrl7b0OdE5ck4ZIkXJKES5JwSRIuScIlafscd3XuODVPve35p77/7Lb9D1PPceKSJFyShEuScEkSLknCJUm4JC3vVTj1//Xfdt909f1vm+/u/vvvfn8nLknCJUm4JAmXJOGSJFyShEvS9u85W7X7fudt92hP7XPYPRff/XwnLknCJUm4JAmXJOGSJFyShEvS8hx3997W2+7p7p7v7t57MPXzt32OTlyShEuScEkSLknCJUm4JAmXpOv2Ktw2L5z6+VN7cG/7vKY4cUkSLknCJUm4JAmXJOGSJFySxr7nbGqeunteeNs88s3UPeDb7k+/cR+XL0G4JAmXJOGSJFyShEuScElanuOe2jNw6jmrbrvnemrOaq8CfEK4JAmXJOGSJFyShEuScEnafh/3b923cOr5lXvJ5rjwCeGSJFyShEuScEkSLknCJWn7ftzb7tHu3p8wtcfg1H3i3X/nqec7cUkSLknCJUm4JAmXJOGSJFySxu7jVvyte2dvu0frPi58QrgkCZck4ZIkXJKES5JwSRq7j3ub1Xuuq8+p3Euemivv/rutcuKSJFyShEuScEkSLknCJUm4JC3Pcd/s3lfwZmqu+WZq70Hle9dWnbo37MQlSbgkCZck4ZIkXJKES5JwSRqb476p7LWdcure6m33pHd/Xk5ckoRLknBJEi5JwiVJuCQJl6Ttc9zbrM5NT+1PmHJqTjy1z+GNE5ck4ZIkXJKES5JwSRIuScIl6cvNcafmslP3X3fPfXfPU1dNvY8TlyThkiRckoRLknBJEi5JwiVp+xz3tn0IU+9z297Z2/by7ubEJUm4JAmXJOGSJFyShEuScEkam+PW54Kn9gZMzV9P/fyqqU6cuCQJlyThkiRckoRLknBJEi5JH8/znH4HWObEJUm4JAmXJOGSJFyShEuScEkSLknCJUm4JAmXJOGSJFyShEuScEn6H55qmDAyP5U2AAAAAElFTkSuQmCC",
  "STF003": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAOgAAADoCAIAAABqyz8vAAAEKklEQVR4nO3dsc1TMRhAUYKYgV3YizHYi11Y4lFAiQsjG/uSc0qUP3lKrlx8MvbreZ4PUPPx9APA3xAuScIlSbgkCZck4ZIkXJKES5JwSRIuScIlSbgkCZck4ZIkXJI+zf7Bt89fdjzHcl9/fP/jv696/t3vP/u5I/Xfa8SKS5JwSRIuScIlSbgkCZck4ZI0PccdmZ3DrTI7p1w1fx29ftWcdff3Wfm9Rqy4JAmXJOGSJFyShEuScEkSLknL5rgju/e/zlo1913ltrnvbb/XiBWXJOGSJFyShEuScEkSLknCJWn7HPc2p84luG1eW2fFJUm4JAmXJOGSJFyShEuScEl6uznu7vno7vcx3/3FikuScEkSLknCJUm4JAmXJOGStH2Oe9t8cfZ5Zuep9Tlr5TmtuCQJlyThkiRckoRLknBJEi5Jy+a4q84f2G12zrrq9aueZ5XK7zVixSVJuCQJlyThkiRckoRLknBJej3Pc/oZ/qnKPV4j9f2+q1hxSRIuScIlSbgkCZck4ZIkXJIyc9zZ+eup+8xmrdrXu3s/8anXj1hxSRIuScIlSbgkCZck4ZIkXJKmz1W47f/jr5rXrtrPWt8vu2quPPv+s6y4JAmXJOGSJFyShEuScEkSLknLzsfdvf9y971it82nZ73b92DFJUm4JAmXJOGSJFyShEuScElaNsfdbdU+zt37dyvnM5z6Plex4pIkXJKES5JwSRIuScIlSbgkTc9xb7vfq2J2nrp7H+2p8x+cj8tbEy5JwiVJuCQJlyThkiRckqbvOdt9/9as+vm4tz3P7PuM7J4HW3FJEi5JwiVJuCQJlyThkiRckpyPu9ju+euqzz01Px6xH5e3IFyShEuScEkSLknCJUm4JB07H3fVHHHV/Pi2/aazz1nfJz3LikuScEkSLknCJUm4JAmXJOGStOxchdvuD7vtnNf6+b63nfNgxSVJuCQJlyThkiRckoRLknBJmp7j1lX2m45UztPdzYpLknBJEi5JwiVJuCQJlyThkjR9rkJlX+lo7nhqn+4p/+v+aSsuScIlSbgkCZck4ZIkXJKES9L2e852m50XrppHrjrHd6Syb/jU+RJWXJKES5JwSRIuScIlSbgkCZek7fec3TaPPHUv2siqzz21D3j3PHvEikuScEkSLknCJUm4JAmXJOGStH2OW1G5n+y2c2pnueeMtyZckoRLknBJEi5JwiVJuCSZ4/5WuT9s97kQt+2fHrHikiRckoRLknBJEi5JwiVJuCRtn+O+2/7R3ef1nvo+T91nNmLFJUm4JAmXJOGSJFyShEuScEl6Pc8z9Qe3nTMwcup+r3dzar5rxSVJuCQJlyThkiRckoRLknBJmp7jwg2suCQJlyThkiRckoRLknBJEi5JwiVJuCQJlyThkiRckoRLknBJEi5JPwG+dH59QMgGRAAAAABJRU5ErkJggg==",
};

/* ── Stato ─────────────────────────────────────────────────────────────────── */
const state = {
  webhookUrl: WEBHOOK_DEFAULT,
  employees: [],
  tipoSelezionato: null,   // 'entrata' | 'uscita'
  scanActive: false,
  scanStream: null,
  scanFrame: null,
  log: []                  // timbrature della sessione
};

/* ── Utility ────────────────────────────────────────────────────────────────── */
const $ = (s, ctx = document) => ctx.querySelector(s);
const toISO = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const nowISO  = () => toISO(new Date());
const nowTime = () => { const n = new Date(); return pad(n.getHours()) + ':' + pad(n.getMinutes()); };
const pad = n => String(n).padStart(2, '0');

function toast(msg, type = 'ok') {
  const el = $('#toast');
  el.textContent = msg;
  el.className = `toast show ${type}`;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.className = 'toast'; }, 3400);
}

/* ── Config & dipendenti ────────────────────────────────────────────────────── */
async function loadConfig() {
  try {
    const r = await fetch('./config.json', { cache: 'no-store' });
    if (r.ok) { const c = await r.json(); if (c.webhook_url) state.webhookUrl = c.webhook_url; }
  } catch(e) {}
}

async function loadEmployees() {
  try {
    const r = await fetch('./employees.json', { cache: 'no-store' });
    if (!r.ok) throw 0;
    state.employees = await r.json();
  } catch(e) {
    state.employees = [
      { id: 'STF001', nome: 'Simone Pomponi' },
      { id: 'STF002', nome: 'Marco Reali' },
      { id: 'STF003', nome: 'Paolo Morabito' }
    ];
  }
}

/* ── Net status ─────────────────────────────────────────────────────────────── */
function attachNetStatus() {
  const update = () => {
    const on = navigator.onLine;
    $('#net-dot')?.classList.toggle('offline', !on);
    const t = $('#net-text'); if (t) t.textContent = on ? 'Online' : 'Offline';
  };
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  update();
}

/* ── Panel navigation ───────────────────────────────────────────────────────── */
function switchPanel(name) {
  ['main','manual','badges'].forEach(p => {
    $('#panel-' + p)?.classList.toggle('hidden', p !== name);
  });
  if (name !== 'main') stopScan();
}

/* ── Selezione tipo timbratura ──────────────────────────────────────────────── */
function selectTipo(tipo) {
  state.tipoSelezionato = tipo;
  $('#btn-entrata').className = 'tipo-btn' + (tipo === 'entrata' ? ' selected-entrata' : '');
  $('#btn-uscita').className  = 'tipo-btn' + (tipo === 'uscita'  ? ' selected-uscita'  : '');
  $('#btn-start-scan').disabled = false;
  $('#scan-step-label').textContent =
    `2 — Scansiona il badge (${tipo === 'entrata' ? '🟢 ENTRATA' : '🔴 USCITA'})`;
  $('#scanner-status').textContent = 'Premi ▶ per avviare la fotocamera';
}

/* ── QR Scanner ─────────────────────────────────────────────────────────────── */
async function startScan() {
  if (!state.tipoSelezionato) { toast('Scegli prima il tipo di timbratura.', 'warn'); return; }
  const status = $('#scanner-status');
  const video  = $('#scanner-video');

  if (!navigator.mediaDevices?.getUserMedia) {
    toast('Camera non disponibile su questo browser.', 'err');
    return;
  }
  try {
    status.textContent = 'Avvio fotocamera…';
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    state.scanStream = stream;
    state.scanActive = true;
    video.srcObject = stream;
    await video.play();
    $('#btn-start-scan').style.display = 'none';
    $('#btn-stop-scan').style.display  = '';
    status.textContent = 'Punta il QR code del badge…';
    scanLoop();
  } catch(e) {
    status.textContent = 'Errore fotocamera: ' + e.message;
    toast('❌ Impossibile accedere alla camera.', 'err');
  }
}

function stopScan() {
  state.scanActive = false;
  state.scanStream?.getTracks().forEach(t => t.stop());
  state.scanStream = null;
  if (state.scanFrame) { cancelAnimationFrame(state.scanFrame); state.scanFrame = null; }
  const video = $('#scanner-video'); if (video) video.srcObject = null;
  $('#btn-start-scan').style.display = '';
  $('#btn-stop-scan').style.display  = 'none';
  $('#scanner-status').textContent = 'Fotocamera ferma.';
}

function scanLoop() {
  if (!state.scanActive) return;
  const video  = $('#scanner-video');
  const canvas = $('#scanner-canvas');
  const ctx    = canvas.getContext('2d');

  if (video.readyState === video.HAVE_ENOUGH_DATA) {
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const img  = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
    if (code) { onQRDetected(code.data); return; }
  }
  state.scanFrame = requestAnimationFrame(scanLoop);
}

async function onQRDetected(data) {
  const prefix = 'CAI-BADGE:';
  if (!data.startsWith(prefix)) {
    toast('⚠️ QR non riconosciuto — usa un badge CAI.', 'warn');
    state.scanFrame = requestAnimationFrame(scanLoop);
    return;
  }

  const id  = data.slice(prefix.length).trim();
  const emp = state.employees.find(e => e.id === id);
  if (!emp) {
    toast(`⚠️ Badge ${id} non trovato.`, 'warn');
    state.scanFrame = requestAnimationFrame(scanLoop);
    return;
  }

  // Pausa scanner + feedback
  stopScan();
  try { navigator.vibrate?.(150); } catch(e) {}
  $('#scanner-status').textContent = `✅ ${emp.nome} — invio in corso…`;

  const tipo = state.tipoSelezionato;
  const now  = new Date();
  const payload = {
    source: 'studio-presenze-webapp',
    version: APP_VERSION,
    employee_id: emp.id,
    nome: emp.nome,
    tipo,
    data: toISO(now),
    ora: nowTime(),
    metodo: 'qr',
    sent_at: now.toISOString()
  };

  const ok = await sendPayload(payload);
  const icon = tipo === 'entrata' ? '🟢' : '🔴';

  if (ok) {
    $('#scanner-status').textContent = `${icon} ${emp.nome} — ${tipo.toUpperCase()} ore ${nowTime()}`;
    addLog(emp.nome, tipo, nowTime(), 'qr');
    toast(`${icon} ${emp.nome} — ${tipo.toUpperCase()} registrata`, 'ok');
  } else {
    $('#scanner-status').textContent = '❌ Errore invio. Riprova.';
  }

  // Riprendi scanner dopo 2.5s
  setTimeout(() => {
    if (state.tipoSelezionato) {
      startScan();
    }
  }, 2500);
}

/* ── Log sessione ───────────────────────────────────────────────────────────── */
function addLog(nome, tipo, ora, metodo) {
  state.log.unshift({ nome, tipo, ora, metodo });
  renderLog();
}

function renderLog() {
  const list = $('#log-list');
  const card = $('#card-log');
  if (!list || !state.log.length) return;
  card.style.display = '';
  list.innerHTML = state.log.map(l => {
    const icon = l.tipo === 'entrata' ? '🟢' : '🔴';
    const badge = l.metodo === 'manuale' ? '<span class="log-badge">manuale</span>' : '';
    return `<li class="log-item ${l.tipo}">
      <span class="log-time">${l.ora}</span>
      <span class="log-name">${icon} ${l.nome}</span>
      ${badge}
    </li>`;
  }).join('');
}

/* ── Invio webhook ──────────────────────────────────────────────────────────── */
async function sendPayload(payload) {
  try {
    const res = await fetch(state.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      mode: 'cors'
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return true;
  } catch(e) {
    return false;
  }
}

/* ── Inserimento manuale ────────────────────────────────────────────────────── */
function initManualForm() {
  const sel = $('#m-employee');
  state.employees.forEach(emp => {
    const opt = document.createElement('option');
    opt.value = emp.id;
    opt.textContent = emp.nome || emp.id;
    sel.appendChild(opt);
  });
  $('#m-date').value = nowISO();
  $('#m-time').value = nowTime();
  $('#manual-form').addEventListener('submit', onManualSubmit);
}

function setDate(when) {
  const d = new Date();
  if (when === 'yesterday') d.setDate(d.getDate() - 1);
  $('#m-date').value = toISO(d);
}
function setNow() {
  $('#m-date').value = nowISO();
  $('#m-time').value = nowTime();
}
function resetManual() {
  $('#manual-form').reset();
  $('#m-date').value = nowISO();
  $('#m-time').value = nowTime();
  $('#manual-msg').textContent = '';
}

async function onManualSubmit(ev) {
  ev.preventDefault();
  const form = ev.currentTarget;
  if (!form.checkValidity()) { form.reportValidity(); return; }

  const empId = $('#m-employee').value;
  const emp   = state.employees.find(e => e.id === empId);
  const tipo  = $('#m-type').value;
  const data  = $('#m-date').value;
  const ora   = $('#m-time').value;
  const note  = $('#m-notes').value || '';

  const payload = {
    source: 'studio-presenze-webapp',
    version: APP_VERSION,
    employee_id: empId, nome: emp?.nome || '',
    tipo, data, ora, note,
    metodo: 'manuale',
    sent_at: new Date().toISOString()
  };

  const btn = $('#btn-manual-submit');
  btn.disabled = true; btn.classList.add('loading');
  $('#manual-msg').textContent = 'Invio in corso…';

  const ok = await sendPayload(payload);
  btn.disabled = false; btn.classList.remove('loading');

  const icon = tipo === 'entrata' ? '🟢' : '🔴';
  if (ok) {
    $('#manual-msg').textContent = `${icon} Inviato: ${emp?.nome || empId} — ${tipo.toUpperCase()} ore ${ora}`;
    addLog(emp?.nome || empId, tipo, ora, 'manuale');
    toast(`${icon} ${emp?.nome || empId} — ${tipo.toUpperCase()} registrata`, 'ok');
    $('#m-notes').value = '';
    $('#m-time').value = nowTime();
  } else {
    $('#manual-msg').textContent = '❌ Errore invio. Verifica la connessione.';
    toast('❌ Errore invio.', 'err');
  }
}

/* ── Badge viewer ───────────────────────────────────────────────────────────── */
function renderBadgeGrid() {
  const grid = $('#badge-grid');
  state.employees.forEach(emp => {
    const src = QR_CODES[emp.id];
    const card = document.createElement('div');
    card.className = 'badge-card';
    card.innerHTML = src
      ? `<img src="${src}" alt="QR ${emp.nome}"/>
         <p class="badge-name">${emp.nome}</p>
         <p class="badge-id">${emp.id}</p>
         <button class="button" style="font-size:.72rem;padding:.35rem .75rem;margin-top:.25rem" onclick="downloadBadge('${emp.id}')">⬇ Scarica PNG</button>`
      : `<p class="badge-name">${emp.nome}</p><p class="badge-id">QR non disponibile</p>`;
    grid.appendChild(card);
  });
}

function downloadBadge(id) {
  const src = QR_CODES[id];
  if (!src) return;
  const emp = state.employees.find(e => e.id === id);
  const a = document.createElement('a');
  a.href = src;
  a.download = `badge-${(emp?.nome || id).replace(/\s+/g,'_')}.png`;
  a.click();
}

/* ── Init ───────────────────────────────────────────────────────────────────── */
(async function main() {
  attachNetStatus();
  await loadConfig();
  await loadEmployees();
  initManualForm();
  renderBadgeGrid();
})();
