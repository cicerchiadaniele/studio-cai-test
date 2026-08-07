/* ============================================================
   I Promessi Sposi — pagina di consegna delle registrazioni
   v1.0.0
   ============================================================ */

const VERSIONE = "1.0.0";
const CHIAVE_MEMORIA = "audiolibro_promessi_sposi_v1";

/* Impronta SHA-256 della parola chiave.
   Serve solo per il controllo immediato nel browser: la verifica
   vera va fatta in Make, che riceve sempre il campo "parola_chiave". */
const IMPRONTA_PAROLA =
  "e45ad878e5ae6d9c198a727aa155c7ed6fc8ee0725b5019479db9ba98690d12c";

const CONFIG_PREDEFINITA = {
  webhook_url: "https://hook.eu1.make.com/unm5jti1d5bwhllmis9cegx4oqja9tjy",
  modalita: "diretto",          // "diretto" | "webhook"
  ripiego_webhook: true,        // se il link diretto non arriva, prova comunque via webhook
  max_parte_mb: 140,            // oltre questa soglia il file viene spezzato (solo in "diretto")
  cartella_dropbox: "/Audiolibro Promessi Sposi/Registrazioni",
  riepilogo_finale: true
};

const stato = {
  config: { ...CONFIG_PREDEFINITA },
  file: [],
  inCorso: false,
  linkDiretto: null   // null = da provare, true/false = esito del primo tentativo
};

const $ = (sel, dove = document) => dove.querySelector(sel);

/* ----------------------------------------------------------
   Avvio
   ---------------------------------------------------------- */

(async function avvia() {
  await caricaConfig();
  riempiCapitoli();
  collegaEventi();
  ripristinaAnagrafica();
  $("#versione").textContent = "v" + VERSIONE;
})();

async function caricaConfig() {
  try {
    const r = await fetch("./config.json", { cache: "no-store" });
    if (r.ok) stato.config = { ...CONFIG_PREDEFINITA, ...(await r.json()) };
  } catch (e) { /* si resta sui valori predefiniti */ }
}

function riempiCapitoli() {
  const sel = $("#capitolo");
  const aggiungi = (v, t) => {
    const o = document.createElement("option");
    o.value = v; o.textContent = t; sel.appendChild(o);
  };
  aggiungi("Introduzione", "Introduzione");
  for (let i = 1; i <= 38; i++) aggiungi("Capitolo " + romano(i), "Capitolo " + romano(i));
  aggiungi("Più capitoli", "Più capitoli in un file solo");
  aggiungi("Altro", "Altro (lo spiego nelle note)");
}

function romano(n) {
  const t = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let out = "";
  for (const [v, s] of t) while (n >= v) { out += s; n -= v; }
  return out;
}

function collegaEventi() {
  $("#modulo").addEventListener("submit", consegna);

  const area = $("#area-file");
  const input = $("#scelta-file");

  area.addEventListener("click", () => input.click());
  area.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); input.click(); }
  });
  input.addEventListener("change", () => { aggiungiFile(input.files); input.value = ""; });

  ["dragenter", "dragover"].forEach(ev =>
    area.addEventListener(ev, e => { e.preventDefault(); area.classList.add("sopra"); }));
  ["dragleave", "drop"].forEach(ev =>
    area.addEventListener(ev, e => { e.preventDefault(); area.classList.remove("sopra"); }));
  area.addEventListener("drop", e => {
    if (e.dataTransfer?.files?.length) aggiungiFile(e.dataTransfer.files);
  });
  // evita che un file trascinato fuori dall'area apra una nuova scheda
  window.addEventListener("dragover", e => e.preventDefault());
  window.addEventListener("drop", e => e.preventDefault());

  $("#mostra-parola").addEventListener("click", (e) => {
    const c = $("#parola");
    const visibile = c.type === "text";
    c.type = visibile ? "password" : "text";
    e.currentTarget.textContent = visibile ? "Mostra" : "Nascondi";
    e.currentTarget.setAttribute("aria-pressed", String(!visibile));
  });

  $("#btn-ancora").addEventListener("click", ricomincia);

  ["#lettore", "#email"].forEach(sel =>
    $(sel).addEventListener("change", salvaAnagrafica));

  window.addEventListener("beforeunload", (e) => {
    if (stato.inCorso) { e.preventDefault(); e.returnValue = ""; }
  });
}

/* ----------------------------------------------------------
   Anagrafica ricordata sul dispositivo
   ---------------------------------------------------------- */

function salvaAnagrafica() {
  try {
    localStorage.setItem(CHIAVE_MEMORIA, JSON.stringify({
      lettore: $("#lettore").value.trim(),
      email: $("#email").value.trim()
    }));
  } catch (e) { }
}

function ripristinaAnagrafica() {
  try {
    const d = JSON.parse(localStorage.getItem(CHIAVE_MEMORIA) || "{}");
    if (d.lettore) $("#lettore").value = d.lettore;
    if (d.email) $("#email").value = d.email;
  } catch (e) { }
}

/* ----------------------------------------------------------
   Elenco dei file
   ---------------------------------------------------------- */

function aggiungiFile(lista) {
  let aggiunti = 0;
  for (const f of lista) {
    const doppione = stato.file.some(v =>
      v.file.name === f.name && v.file.size === f.size && v.esito !== "guasto");
    if (doppione) continue;
    stato.file.push({
      id: "f" + Math.random().toString(36).slice(2, 9),
      file: f, esito: "attesa", avanzamento: 0, dettaglio: ""
    });
    aggiunti++;
  }
  disegnaElenco();
  if (aggiunti) {
    nascondiErrore("#errore-file");
    avviso(aggiunti === 1 ? "Aggiunta 1 registrazione." : `Aggiunte ${aggiunti} registrazioni.`);
  }
}

function togliFile(id) {
  stato.file = stato.file.filter(v => v.id !== id);
  disegnaElenco();
}

function disegnaElenco() {
  const ul = $("#elenco-file");
  ul.innerHTML = "";

  stato.file.forEach((v, i) => {
    const li = document.createElement("li");
    li.className = "voce" + (
      v.esito === "invio" ? " in-corso" :
      v.esito === "fatto" ? " fatto" :
      v.esito === "guasto" ? " guasto" : "");
    li.dataset.id = v.id;

    const indice = document.createElement("span");
    indice.className = "voce__indice";
    indice.textContent = romano(i + 1);

    const corpo = document.createElement("div");
    corpo.className = "voce__corpo";
    const nome = document.createElement("p");
    nome.className = "voce__nome";
    nome.textContent = v.file.name;
    const dati = document.createElement("p");
    dati.className = "voce__dati";
    dati.textContent = v.dettaglio || peso(v.file.size);
    corpo.append(nome, dati);

    const barra = document.createElement("div");
    barra.className = "voce__barra";
    const inchiostro = document.createElement("span");
    inchiostro.className = "voce__inchiostro";
    inchiostro.style.width = Math.round(v.avanzamento * 100) + "%";
    barra.appendChild(inchiostro);

    li.append(indice, corpo);

    if (v.esito === "attesa" && !stato.inCorso) {
      const togli = document.createElement("button");
      togli.className = "voce__togli";
      togli.type = "button";
      togli.innerHTML = "&times;";
      togli.title = "Togli dall'elenco";
      togli.setAttribute("aria-label", "Togli " + v.file.name);
      togli.addEventListener("click", () => togliFile(v.id));
      li.appendChild(togli);
    } else {
      const segno = document.createElement("span");
      segno.className = "voce__dati";
      segno.textContent = v.esito === "fatto" ? "✓" : v.esito === "guasto" ? "!" : "";
      li.appendChild(segno);
    }

    li.appendChild(barra);
    ul.appendChild(li);
  });

  const tot = $("#totale");
  if (stato.file.length) {
    const byte = stato.file.reduce((s, v) => s + v.file.size, 0);
    tot.hidden = false;
    tot.textContent = `${stato.file.length} ${stato.file.length === 1 ? "file" : "file"} · ${peso(byte)} in tutto`;
  } else {
    tot.hidden = true;
  }
}

function aggiornaVoce(v) {
  const li = $(`.voce[data-id="${v.id}"]`);
  if (!li) return;
  li.className = "voce" + (
    v.esito === "invio" ? " in-corso" :
    v.esito === "fatto" ? " fatto" :
    v.esito === "guasto" ? " guasto" : "");
  const dati = li.querySelector(".voce__dati");
  if (dati) dati.textContent = v.dettaglio || peso(v.file.size);
  const inch = li.querySelector(".voce__inchiostro");
  if (inch) inch.style.width = Math.round(v.avanzamento * 100) + "%";
}

function peso(b) {
  if (b < 1024) return b + " byte";
  if (b < 1024 * 1024) return (b / 1024).toFixed(0) + " KB";
  if (b < 1024 * 1024 * 1024) return (b / 1024 / 1024).toFixed(1) + " MB";
  return (b / 1024 / 1024 / 1024).toFixed(2) + " GB";
}

/* ----------------------------------------------------------
   Controlli
   ---------------------------------------------------------- */

function mostraErrore(sel, testo) {
  const p = $(sel);
  p.textContent = testo;
  p.classList.add("visibile");
}
function nascondiErrore(sel) {
  const p = $(sel);
  p.textContent = "";
  p.classList.remove("visibile");
}

function emailValida(v) {
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v);
}

function normalizzaParola(v) {
  return v.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function parolaGiusta(v) {
  const pulita = normalizzaParola(v);
  if (!pulita) return false;
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pulita));
    const hex = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
    return hex === IMPRONTA_PAROLA;
  } catch (e) {
    // contesto non sicuro (http://): il controllo resta a Make
    return true;
  }
}

async function controlla() {
  let ok = true;

  const email = $("#email");
  if (!emailValida(email.value.trim())) {
    mostraErrore("#errore-email", "Serve un indirizzo email valido: è lì che arriva la conferma.");
    email.setAttribute("aria-invalid", "true");
    ok = false;
  } else {
    nascondiErrore("#errore-email");
    email.removeAttribute("aria-invalid");
  }

  const parola = $("#parola");
  if (!parola.value.trim()) {
    mostraErrore("#errore-parola", "Manca la parola chiave.");
    parola.setAttribute("aria-invalid", "true");
    ok = false;
  } else if (!(await parolaGiusta(parola.value))) {
    mostraErrore("#errore-parola", "Parola chiave non valida.");
    parola.setAttribute("aria-invalid", "true");
    ok = false;
  } else {
    nascondiErrore("#errore-parola");
    parola.removeAttribute("aria-invalid");
  }

  if (!stato.file.length) {
    mostraErrore("#errore-file", "Non hai ancora scelto nessun file da consegnare.");
    ok = false;
  } else {
    nascondiErrore("#errore-file");
  }

  if (!/^https?:\/\//.test(stato.config.webhook_url) || stato.config.webhook_url.includes("INSERISCI-QUI")) {
    mostraErrore("#errore-file", "La pagina non è ancora collegata alla cartella condivisa: avvisa chi la gestisce.");
    ok = false;
  }

  return ok;
}

/* ----------------------------------------------------------
   Nomi dei file
   ---------------------------------------------------------- */

function ripulisci(s, max = 40) {
  return (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max);
}

function nomeFinale(fileName) {
  const data = new Date().toISOString().slice(0, 10);
  const lettore = ripulisci($("#lettore").value.trim(), 34);
  const capitolo = ripulisci($("#capitolo").value.trim(), 20);
  const punto = fileName.lastIndexOf(".");
  const base = ripulisci(punto > 0 ? fileName.slice(0, punto) : fileName, 50) || "registrazione";
  const est = punto > 0 ? fileName.slice(punto).toLowerCase().replace(/[^.a-z0-9]/g, "") : "";
  return [data, lettore, capitolo, base].filter(Boolean).join("_") + est;
}

/* ----------------------------------------------------------
   Invio
   ---------------------------------------------------------- */

async function consegna(ev) {
  ev.preventDefault();
  if (stato.inCorso) return;
  if (!(await controlla())) {
    avviso("Controlla i campi segnati in rosso.", "male");
    document.querySelector(".errore.visibile")?.scrollIntoView({ block: "center", behavior: "smooth" });
    return;
  }

  stato.inCorso = true;
  stato.linkDiretto = null;
  bloccaModulo(true);
  disegnaElenco();

  const consegnaId = "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const comune = {
    consegna_id: consegnaId,
    // sempre normalizzata: in Make il confronto è con "azzeccagarbugli"
    parola_chiave: normalizzaParola($("#parola").value),
    parola_chiave_digitata: $("#parola").value.trim(),
    email: $("#email").value.trim(),
    lettore: $("#lettore").value.trim(),
    capitolo: $("#capitolo").value,
    note: $("#note").value.trim(),
    cartella: stato.config.cartella_dropbox,
    versione_app: VERSIONE
  };

  const daFare = stato.file.filter(v => v.esito !== "fatto");
  let riusciti = 0;
  const riepilogo = [];

  for (let i = 0; i < daFare.length; i++) {
    const v = daFare[i];
    $("#stato").textContent = `Invio ${i + 1} di ${daFare.length}: ${v.file.name}`;
    try {
      const percorsi = await inviaUnFile(v, comune);
      v.esito = "fatto";
      v.avanzamento = 1;
      v.dettaglio = "consegnato · " + peso(v.file.size);
      riusciti++;
      riepilogo.push({
        nome_originale: v.file.name,
        dimensione: v.file.size,
        file_salvati: percorsi
      });
    } catch (err) {
      v.esito = "guasto";
      v.dettaglio = "non inviato — " + (err?.message || "errore");
    }
    aggiornaVoce(v);
  }

  if (riusciti && stato.config.riepilogo_finale) {
    try {
      await postJSON(stato.config.webhook_url, {
        azione: "fine",
        ...comune,
        totale_file: riusciti,
        totale_byte: riepilogo.reduce((s, r) => s + r.dimensione, 0),
        file: riepilogo,
        inviato_il: new Date().toISOString()
      });
    } catch (e) { /* la conferma può anche partire dal singolo file */ }
  }

  stato.inCorso = false;
  bloccaModulo(false);
  disegnaElenco();

  const falliti = daFare.length - riusciti;
  if (riusciti && !falliti) {
    mostraEsito(riusciti);
  } else if (riusciti && falliti) {
    $("#stato").textContent = `${riusciti} consegnate, ${falliti} non riuscite. Riprova con quelle segnate in rosso.`;
    avviso("Alcuni file non sono partiti. Premi di nuovo Consegna.", "male");
  } else {
    $("#stato").textContent = "Nessun file è partito. Controlla la connessione e riprova.";
    avviso("Invio non riuscito.", "male");
  }
}

async function inviaUnFile(v, comune) {
  const file = v.file;
  const nome = nomeFinale(file.name);
  const limite = Math.max(1, Number(stato.config.max_parte_mb) || 140) * 1024 * 1024;

  const diretto = stato.config.modalita === "diretto" && stato.linkDiretto !== false;
  const parti = (diretto && file.size > limite) ? Math.ceil(file.size / limite) : 1;

  const percorsi = [];
  let giaInviato = 0;

  for (let p = 1; p <= parti; p++) {
    const inizio = (p - 1) * limite;
    const pezzo = parti === 1 ? file : file.slice(inizio, Math.min(inizio + limite, file.size));
    const nomePezzo = parti === 1
      ? nome
      : `${nome}.parte${String(p).padStart(2, "0")}di${String(parti).padStart(2, "0")}`;

    const meta = {
      ...comune,
      file_nome_originale: file.name,
      file_nome: nomePezzo,
      file_tipo: file.type || "application/octet-stream",
      file_dimensione: pezzo.size,
      dimensione_totale: file.size,
      parte: p,
      parti_totali: parti,
      inviato_il: new Date().toISOString()
    };

    const avanza = (frazione) => {
      v.avanzamento = (giaInviato + frazione * pezzo.size) / file.size;
      v.esito = "invio";
      v.dettaglio = parti > 1
        ? `parte ${p} di ${parti} · ${Math.round(v.avanzamento * 100)}%`
        : `${Math.round(v.avanzamento * 100)}% di ${peso(file.size)}`;
      aggiornaVoce(v);
    };
    avanza(0);

    let salvato = false;

    if (diretto) {
      const link = await chiediLink(meta);
      if (link) {
        stato.linkDiretto = true;
        await inviaBlob(link, pezzo, "application/octet-stream", avanza);
        salvato = true;
      } else {
        stato.linkDiretto = false;
        if (!stato.config.ripiego_webhook) throw new Error("link non ricevuto");
      }
    }

    if (!salvato) {
      if (parti > 1) throw new Error("file troppo grande per l'invio semplice");
      await inviaMultipart(meta, pezzo, avanza);
    }

    percorsi.push(`${comune.cartella}/${nomePezzo}`);
    giaInviato += pezzo.size;
    avanza(1);
  }

  return percorsi;
}

/* Chiede a Make un indirizzo di caricamento diretto su Dropbox.
   Restituisce l'indirizzo, oppure null se lo scenario non lo fornisce. */
async function chiediLink(meta) {
  let testo;
  try {
    const r = await fetch(stato.config.webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ azione: "link", ...meta })
    });
    if (!r.ok) throw new Error("HTTP " + r.status);
    testo = await r.text();
  } catch (e) {
    return null;
  }

  let dati = null;
  try { dati = JSON.parse(testo); } catch (e) { dati = null; }

  if (dati && dati.ok === false) {
    throw new Error(dati.errore || "richiesta rifiutata");
  }
  const link = dati && (dati.upload_url || dati.link || dati.url);
  if (typeof link === "string" && /^https:\/\//.test(link)) return link;

  if (typeof testo === "string" && /^https:\/\/\S+$/.test(testo.trim())) return testo.trim();
  return null;
}

function inviaMultipart(meta, pezzo, avanza) {
  const fd = new FormData();
  fd.append("azione", "file");
  Object.entries(meta).forEach(([k, val]) => {
    if (k !== "azione") fd.append(k, val == null ? "" : String(val));
  });
  fd.append("file", pezzo, meta.file_nome);
  return inviaBlob(stato.config.webhook_url, fd, null, avanza);
}

function inviaBlob(url, corpo, tipo, avanza) {
  return new Promise((risolvi, rifiuta) => {
    const x = new XMLHttpRequest();
    x.open("POST", url, true);
    if (tipo) x.setRequestHeader("Content-Type", tipo);
    x.upload.onprogress = (e) => {
      if (e.lengthComputable && avanza) avanza(e.loaded / e.total);
    };
    x.onload = () => {
      if (x.status >= 200 && x.status < 300) risolvi(x.responseText);
      else rifiuta(new Error("il server ha risposto " + x.status));
    };
    x.onerror = () => rifiuta(new Error("connessione interrotta"));
    x.ontimeout = () => rifiuta(new Error("tempo scaduto"));
    x.send(corpo);
  });
}

function postJSON(url, dati) {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dati)
  });
}

/* ----------------------------------------------------------
   Interfaccia
   ---------------------------------------------------------- */

function bloccaModulo(attivo) {
  const btn = $("#btn-consegna");
  btn.disabled = attivo;
  btn.classList.toggle("lavora", attivo);
  btn.querySelector(".etichetta").textContent = attivo ? "Invio in corso" : "Consegna le registrazioni";
  $("#modulo").querySelectorAll("input, select, textarea").forEach(el => {
    if (el.id !== "scelta-file") el.disabled = attivo;
  });
  $("#area-file").style.pointerEvents = attivo ? "none" : "";
  $("#area-file").style.opacity = attivo ? ".55" : "";
}

function mostraEsito(quanti) {
  $("#stato").textContent = "";
  $("#modulo").hidden = true;
  $("#esito").hidden = false;
  $("#esito-testo").textContent =
    `${quanti === 1 ? "La tua registrazione è arrivata" : `Le tue ${quanti} registrazioni sono arrivate`} nella cartella condivisa. ` +
    `Trovi la conferma su ${$("#email").value.trim()}.`;
  $("#esito").scrollIntoView({ block: "center", behavior: "smooth" });
  avviso("Consegna riuscita.", "bene");
}

function ricomincia() {
  stato.file = [];
  stato.linkDiretto = null;
  $("#esito").hidden = true;
  $("#modulo").hidden = false;
  $("#note").value = "";
  $("#capitolo").value = "";
  $("#stato").textContent = "";
  disegnaElenco();
  $("#capitolo").focus();
}

let timerAvviso;
function avviso(testo, tono = "") {
  const a = $("#avviso");
  a.textContent = testo;
  a.className = "avviso visibile " + tono;
  clearTimeout(timerAvviso);
  timerAvviso = setTimeout(() => { a.className = "avviso " + tono; }, 3800);
}
