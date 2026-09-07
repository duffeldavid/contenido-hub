// ============================================================
// CONTENIDO HUB — lógica de la app
// Sin dependencias. El avance (estados, checklists, aprobaciones
// y portadas) vive en localStorage y, en la versión Artifact,
// también embebido en la página para sincronizar dispositivos.
// ============================================================

// Enlace público de la plataforma (GitHub Pages) — el que se comparte a clientes
const ENLACE_PUBLICO = "https://duffeldavid.github.io/contenido-hub/";
// Canal de notificaciones push para David (ntfy.sh, gratuito).
// Suscribirse en la app ntfy (iPhone/Android) o en el navegador a este tema:
const NTFY_CANAL = "https://ntfy.sh/contenido-hub-david-x8k3n2vq";
// Canal de DATOS: la página del cliente emite cada aprobación/comentario y
// la plataforma de David lo escucha en tiempo real (SSE) y se pone al día al abrir.
const NTFY_DATOS = "https://ntfy.sh/contenido-hub-datos-x8k3n2vq";
// Acceso del equipo al link de aprobación (protección básica en el navegador)
const CLAVE_ACCESO = "Mercadeo123";
const AUTOR_CLIENTE = "Mercadeo GM";
// Guardar cambios (sin configurar nada, igual en compu y celular): el estado
// completo de David — portadas incluidas — se envía como ADJUNTO por el mismo
// canal ntfy (los adjuntos admiten ~2MB; los mensajes normales solo 4KB).
// El cliente lo recibe al instante y, además, el Mac de David lo archiva en
// estado.json del repo (scripts/archivar_estado.py) para que quede permanente.
const GH_ESTADO_API = "https://api.github.com/repos/duffeldavid/contenido-hub/contents/estado.json";
const EN_ARTIFACT = !!(window.claude && typeof window.claude.use === "function");
// ¿La página se abrió como formulario de aprobación para cliente?
const MODO_CLIENTE = new URLSearchParams(location.search).get("modo") === "cliente";

const ESTADOS = ["Idea", "Por grabar", "En edición", "Listo", "Programado", "Publicado"];
const ESTADO_CLASS = {
  "Idea": "st-Idea", "Por grabar": "st-PorGrabar", "En edición": "st-EnEdicion",
  "Listo": "st-Listo", "Programado": "st-Programado", "Publicado": "st-Publicado",
};
const APROB = ["Aprobado", "Ajustar", "Pendiente"];
const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const LS_KEY = "contenidoHub." + MES.clave;
const UI_KEY = "contenidoHubUI";

// ---------- Estado persistente ----------
let store = load();
function load() {
  let ls = null, emb = null;
  try { ls = JSON.parse(localStorage.getItem(LS_KEY)); } catch {}
  const el = document.getElementById("hub-state");
  if (el) { try { emb = JSON.parse(el.textContent); } catch {} }
  const candidatos = [ls, emb].filter(x => x && typeof x === "object");
  if (!candidatos.length) return { estados: {}, checks: {}, aprob: {}, portadas: {}, fechas: {}, ediciones: {}, orden: {}, pdf: {}, ocultas: {}, nuevas: [], notis: [], horas: {}, meta: {}, historias: null, pubTs: 0, pendientePub: false };
  candidatos.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  const s = candidatos[0];
  return {
    estados: s.estados || {}, checks: s.checks || {},
    aprob: s.aprob || {}, portadas: s.portadas || {},
    fechas: s.fechas || {}, ediciones: s.ediciones || {},
    orden: s.orden || {}, pdf: s.pdf || {}, ocultas: s.ocultas || {}, nuevas: s.nuevas || [],
    notis: s.notis || [], horas: s.horas || {},
    meta: s.meta || {}, historias: s.historias || null,
    pubTs: s.pubTs || 0, pendientePub: !!s.pendientePub,
    updatedAt: s.updatedAt || 0,
  };
}
function save() {
  store.updatedAt = Date.now();
  try { localStorage.setItem(LS_KEY, JSON.stringify(store)); } catch {}
  if (window.hubSync) window.hubSync();
}
// ---------- Notificaciones al celular/compu de David (solo modo cliente) ----------
let notiCola = [], notiTimer = null;
function notificarDavid(linea) {
  if (!MODO_CLIENTE) return;
  notiCola.push(linea);
  clearTimeout(notiTimer);
  notiTimer = setTimeout(enviarNoti, 8000); // agrupa acciones seguidas en un solo aviso
}
function enviarNoti() {
  if (!notiCola.length) return;
  const cuerpo = notiCola.join("\n");
  notiCola = [];
  fetch(NTFY_CANAL, {
    method: "POST",
    headers: { "Title": "Contenido Hub: respuesta del cliente", "Tags": "bell,memo" },
    body: cuerpo,
  }).catch(() => {});
}
window.addEventListener("pagehide", () => {
  if (notiCola.length) { try { navigator.sendBeacon(NTFY_CANAL, notiCola.join("\n")); notiCola = []; } catch {} }
});
function notiAprobacion(p, valor) {
  const icono = valor === "Aprobado" ? "✅" : valor === "Ajustar" ? "✏️" : "⏳";
  notificarDavid(`${icono} ${fechaDe(p).slice(8)}/09 · ${MARCAS[p.marca].nombre} · ${tituloDe(p)} → ${valor}`);
}
function notiComentario(p, texto) {
  if (texto.trim()) notificarDavid(`💬 ${tituloDe(p)}: "${texto.trim().slice(0, 200)}"`);
}
// Evento estructurado hacia la plataforma de David (inmediato, sin agrupar)
function emitirDato(p) {
  if (!MODO_CLIENTE) return;
  const a = aprobDe(p);
  fetch(NTFY_DATOS, { method: "POST", body: JSON.stringify({ tipo: "aprob", id: p.id, v: a.v, c: a.c || "", autor: AUTOR_CLIENTE, ts: Date.now() }) }).catch(() => {});
}
// Ediciones de contenido de David hacia el link del cliente (tiempo real)
function emitirContenido(obj) {
  if (MODO_CLIENTE) return;
  marcarPendiente();
  fetch(NTFY_DATOS, { method: "POST", body: JSON.stringify({ ...obj, autor: "David", ts: Date.now() }) }).catch(() => {});
}

// ---------- Tiempo real en la plataforma de David ----------
// Quitar / restaurar contenidos del mes (David tiene el control total)
function quitarPieza(id) {
  const p = PIEZAS.find(x => x.id === id);
  if (!p) return;
  store.ocultas[id] = true;
  save();
  emitirContenido({ tipo: "ocultar", id, oculta: true });
  renderAll();
  toastAccion(`Quitado: ${tituloDe(p)}`, "Deshacer", () => {
    delete store.ocultas[id];
    save();
    emitirContenido({ tipo: "ocultar", id, oculta: false });
    renderAll();
  });
}
function toastAccion(txt, accion, fn) {
  let t = document.getElementById("toastLive");
  if (!t) { t = document.createElement("div"); t.id = "toastLive"; t.className = "toast-live"; document.body.appendChild(t); }
  t.innerHTML = `${esc(txt)} <button class="toast-btn">${esc(accion)}</button>`;
  t.querySelector(".toast-btn").onclick = () => { fn(); t.classList.remove("on"); };
  t.classList.add("on");
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove("on"), 8000);
}

function toastVivo(txt) {
  let t = document.getElementById("toastLive");
  if (!t) { t = document.createElement("div"); t.id = "toastLive"; t.className = "toast-live"; document.body.appendChild(t); }
  t.innerHTML = "";
  t.textContent = txt;
  t.classList.add("on");
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove("on"), 6000);
}
const nidsVistos = new Set(); // dedup de eventos en esta sesión
function aplicarEventoCliente(linea, enVivo) {
  try {
    const m = JSON.parse(linea);
    if (m.event !== "message") return false;
    if (m.id) { if (nidsVistos.has(m.id)) return false; nidsVistos.add(m.id); }
    // Estado completo guardado por David (adjunto: es lo único que admite portadas)
    if (m.attachment) {
      if (/^estado-hub/.test(m.attachment.name || "")) {
        const tsMsg = (m.time || 0) * 1000;
        const vigente = !m.attachment.expires || Date.now() / 1000 < m.attachment.expires;
        if (vigente && tsMsg > (store.pubTs || 0) && (MODO_CLIENTE || !store.pendientePub)) {
          fetch(m.attachment.url)
            .then(r => (r.ok ? r.json() : null))
            .then(est => { if (est) aplicarEstado(est, enVivo); })
            .catch(() => {});
        }
      }
      return false; // aplicarEstado guarda y re-renderiza por su cuenta
    }
    const d = JSON.parse(m.message);
    // Foto completa del estado de contenidos de David (re-transmisión al abrir su plataforma)
    if (d.tipo === "snap") {
      if (d.ts && d.ts < (store.pubTs || 0)) return false; // más viejo que lo guardado

      store.ediciones = d.ediciones || {};
      store.fechas = d.fechas || {};
      store.orden = d.orden || {};
      store.estados = Object.assign({}, store.estados, d.estados || {});
      store.ocultas = d.ocultas || {};
      store.nuevas = d.nuevas || store.nuevas;
      hidratarNuevas();
      return true;
    }
    if (d.tipo === "nueva" && d.pieza && d.pieza.id) {
      if (!store.nuevas.some(n => n.id === d.pieza.id)) {
        store.nuevas.push(d.pieza);
        hidratarNuevas();
        if (enVivo && MODO_CLIENTE) toastVivo("➕ David agregó un contenido nuevo");
      }
      return true;
    }
    if (!d.id || !PIEZAS.some(p => p.id === d.id)) return false;
    if (d.tipo === "ocultar") {
      if (d.oculta) store.ocultas[d.id] = true; else delete store.ocultas[d.id];
      if (enVivo && MODO_CLIENTE) toastVivo(d.oculta ? "David quitó un contenido del mes" : "David restauró un contenido");
      return true;
    }
    // Ediciones de contenido de David → se aplican en el link del cliente
    if (d.tipo === "edicion") {
      if (d.e && (d.e.titulo || d.e.copy)) store.ediciones[d.id] = d.e; else delete store.ediciones[d.id];
      if (enVivo && MODO_CLIENTE) toastVivo("✨ David actualizó un contenido");
      return true;
    }
    if (d.tipo === "fecha") {
      const base = PIEZAS.find(p => p.id === d.id);
      if (d.fecha === base.fecha) delete store.fechas[d.id]; else store.fechas[d.id] = d.fecha;
      if (d.orden) Object.assign(store.orden, d.orden);
      return true;
    }
    if (d.tipo === "estado") {
      store.estados[d.id] = d.v;
      return true;
    }
    if (d.tipo !== "aprob") return false;
    if (m.id && store.notis.some(n => n.nid === m.id)) return false; // ya registrado entre sesiones
    const autor = d.autor || AUTOR_CLIENTE;
    store.aprob[d.id] = { v: d.v || "Pendiente", c: d.c || "", por: autor };
    // Registrar en el buzón de notificaciones de la plataforma
    store.notis.unshift({ nid: m.id || String(Date.now()), piezaId: d.id, v: d.v || "Pendiente", c: d.c || "", autor, ts: (m.time ? m.time * 1000 : Date.now()), leida: false });
    store.notis = store.notis.slice(0, 60);
    if (enVivo && !MODO_CLIENTE) {
      const p = PIEZAS.find(x => x.id === d.id);
      const icono = d.v === "Aprobado" ? "✅" : d.v === "Ajustar" ? "✏️" : "⏳";
      toastVivo(`${icono} ${autor} ${d.v === "Ajustar" ? "pidió ajustes en" : d.v === "Aprobado" ? "aprobó" : "revisó"}: ${tituloDe(p)}${d.c ? ` — "${d.c.slice(0, 80)}"` : ""}`);
    }
    return true;
  } catch { return false; }
}
// ---------- Buzón de notificaciones (campanita) ----------
function tiempoRelativo(ts) {
  const s = Math.max(0, (Date.now() - ts) / 1000);
  if (s < 60) return "hace un momento";
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  const d = new Date(ts);
  return `${d.getDate()}/${String(d.getMonth() + 1).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function renderCampanita() {
  const badge = document.getElementById("bellBadge");
  if (!badge) return;
  const sinLeer = store.notis.filter(n => !n.leida).length;
  badge.hidden = sinLeer === 0;
  badge.textContent = sinLeer > 9 ? "9+" : sinLeer;
  document.getElementById("bellBtn").classList.toggle("con-nuevas", sinLeer > 0);
  const panel = document.getElementById("notiPanel");
  if (panel.hidden) return;
  // En el visor de claude.ai las conexiones externas están bloqueadas:
  // las respuestas en vivo entran por el enlace público de la plataforma.
  const enArtifact = !!(window.claude && typeof window.claude.use === "function");
  panel.innerHTML = `
    <div class="noti-head">Notificaciones</div>
    ${enArtifact ? `<a class="noti-aviso" href="${ENLACE_PUBLICO}" target="_blank" rel="noopener">⚡ Aquí (claude.ai) las respuestas no entran en vivo.<br><b>Abre el enlace público</b> para verlas llegar al instante →</a>` : ""}
    ${store.notis.length ? store.notis.map(n => {
      const p = PIEZAS.find(x => x.id === n.piezaId);
      const icono = n.v === "Aprobado" ? "✅" : n.v === "Ajustar" ? "✏️" : "⏳";
      return `
        <button class="noti-item ${n.leida ? "" : "nueva"}" data-pieza="${n.piezaId}">
          <span class="noti-ico">${icono}</span>
          <span class="noti-cuerpo">
            <span class="noti-txt"><b>${esc(n.autor || AUTOR_CLIENTE)} ${n.v === "Aprobado" ? "aprobó" : n.v === "Ajustar" ? "pide ajustes en" : "revisó"}:</b> ${p ? esc(tituloDe(p)) : n.piezaId}</span>
            ${n.c ? `<span class="noti-com">💬 "${esc(n.c.slice(0, 120))}"</span>` : ""}
            <span class="noti-tiempo">${tiempoRelativo(n.ts)}</span>
          </span>
        </button>`;
    }).join("") : `<div class="noti-vacio">Sin notificaciones aún.<br>Aquí verás cada aprobación y comentario de tus clientes.</div>`}`;
  panel.querySelectorAll(".noti-item").forEach(b => {
    b.onclick = () => { cerrarCampanita(); openDrawer(b.dataset.pieza); };
  });
}
function abrirCampanita() {
  const panel = document.getElementById("notiPanel");
  panel.hidden = false;
  renderCampanita();
  // al abrir el buzón, todo queda leído
  if (store.notis.some(n => !n.leida)) {
    store.notis.forEach(n => { n.leida = true; });
    save();
    document.getElementById("bellBadge").hidden = true;
    document.getElementById("bellBtn").classList.remove("con-nuevas");
  }
}
function cerrarCampanita() { document.getElementById("notiPanel").hidden = true; }
const bellBtn = document.getElementById("bellBtn");
if (bellBtn) {
  bellBtn.onclick = e => {
    e.stopPropagation();
    const panel = document.getElementById("notiPanel");
    panel.hidden ? abrirCampanita() : cerrarCampanita();
  };
  document.addEventListener("click", e => {
    if (!e.target.closest("#notiPanel, #bellBtn")) cerrarCampanita();
  });
}

function ponerseAlDia(avisar) {
  return fetch(NTFY_DATOS + "/json?poll=1&since=96h")
    .then(r => r.text())
    .then(t => {
      let alguno = false;
      t.split("\n").forEach(l => { if (l.trim() && aplicarEventoCliente(l, false)) alguno = true; });
      if (alguno) { save(); renderAll(); if (avisar) toastVivo("📥 Respuestas de Mercadeo GM sincronizadas"); }
    }).catch(() => {});
}
function iniciarTiempoReal() {
  // Corre en ambos lados (plataforma y link del cliente) para que los
  // dos vean exactamente el mismo estado de aprobaciones.
  // Primero el estado guardado por David (estado.json), luego los eventos.
  cargarPublicado(false).finally(() => ponerseAlDia(!MODO_CLIENTE));
  // Escuchar en vivo
  try {
    const es = new EventSource(NTFY_DATOS + "/sse");
    es.onmessage = e => {
      if (aplicarEventoCliente(e.data, true)) { save(); renderAll(); }
    };
  } catch {}
  // David re-transmite su estado de contenidos al abrir: el cliente
  // converge siempre a la última versión aunque haya perdido eventos.
  if (!MODO_CLIENTE) setTimeout(() => {
    const snap = { tipo: "snap", ediciones: store.ediciones, fechas: store.fechas, orden: store.orden, estados: store.estados, ocultas: store.ocultas, nuevas: store.nuevas, ts: Date.now() };
    const cuerpo = JSON.stringify(snap);
    if (cuerpo.length < 3800) fetch(NTFY_DATOS, { method: "POST", body: cuerpo }).catch(() => {});
  }, 4000);
  // Redes de seguridad: re-sincronizar cada minuto y al volver a la pestaña
  setInterval(() => ponerseAlDia(false), 60000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) ponerseAlDia(false); });
}

// ---------- Guardar cambios (publicar el estado al repo → lo ve el cliente) ----------
// Marca que hay cambios de contenido sin publicar y enciende el botón.
function marcarPendiente() {
  if (MODO_CLIENTE) return;
  store.pendientePub = true;
  pintarGuardar();
}
function pintarGuardar() {
  const b = document.getElementById("btnGuardarCambios");
  if (!b) return;
  b.classList.toggle("pendiente", !!store.pendientePub);
  b.querySelector(".guardar-txt").textContent = store.pendientePub ? "Guardar cambios" : "Todo guardado";
}
function estadoPublicable(ts) {
  return {
    ts: ts || Date.now(),
    ediciones: store.ediciones, fechas: store.fechas, orden: store.orden,
    estados: store.estados, ocultas: store.ocultas, nuevas: store.nuevas,
    portadas: store.portadas, horas: store.horas,
    meta: store.meta, historias: store.historias,
  };
}
// Envía el estado como adjunto al canal de datos (sin cuentas ni tokens)
function enviarEstadoNtfy(cuerpo) {
  return fetch(NTFY_DATOS, { method: "PUT", headers: { "Filename": "estado-hub.json" }, body: cuerpo })
    .then(r => { if (!r.ok) throw 0; return r.json(); });
}
// Si el estado supera el límite de adjuntos (~2MB), se reencogen las portadas
function reducirPortadas(maxH = 520, calidad = 0.66) {
  const ids = Object.keys(store.portadas);
  return Promise.all(ids.map(id => new Promise(res => {
    const img = new Image();
    img.onload = () => {
      const f = Math.min(1, maxH / img.height);
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * f); c.height = Math.round(img.height * f);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      store.portadas[id] = c.toDataURL("image/jpeg", calidad);
      res();
    };
    img.onerror = () => res();
    img.src = store.portadas[id];
  }))).then(() => save());
}
async function publicarCambios() {
  if (EN_ARTIFACT) {
    // El visor de claude.ai bloquea las conexiones externas (CSP)
    toastAccion("Aquí (claude.ai) no se puede guardar — usa el enlace público", "Abrir", () => {
      const a = document.createElement("a");
      a.href = ENLACE_PUBLICO; a.target = "_blank"; a.rel = "noopener";
      document.body.appendChild(a); a.click(); a.remove();
    });
    return;
  }
  const b = document.getElementById("btnGuardarCambios");
  if (b) { b.disabled = true; b.querySelector(".guardar-txt").textContent = "Guardando…"; }
  try {
    let estado = estadoPublicable();
    let cuerpo = JSON.stringify(estado);
    if (cuerpo.length > 1900000) {
      await reducirPortadas();
      estado = estadoPublicable(estado.ts);
      cuerpo = JSON.stringify(estado);
    }
    await enviarEstadoNtfy(cuerpo);
    store.pendientePub = false;
    store.pubTs = estado.ts;
    save();
    toastVivo("✅ Cambios guardados: el equipo ya ve tu versión, portadas incluidas");
  } catch {
    toastVivo("⚠️ No se pudo guardar. Revisa tu internet e inténtalo de nuevo.");
  } finally {
    if (b) b.disabled = false;
    pintarGuardar();
  }
}
// Aplica un estado completo recibido (adjunto ntfy o estado.json del repo)
function aplicarEstado(est, avisar) {
  if (!est || !est.ts) return false;
  if (est.ts <= (store.pubTs || 0)) return false;       // ya tenemos esta versión
  if (!MODO_CLIENTE && store.pendientePub) return false; // no pisar cambios locales sin guardar
  store.ediciones = est.ediciones || {};
  store.fechas = est.fechas || {};
  store.orden = est.orden || {};
  store.estados = Object.assign({}, store.estados, est.estados || {});
  store.ocultas = est.ocultas || {};
  store.nuevas = est.nuevas || [];
  store.portadas = est.portadas || {};
  store.horas = est.horas || {};
  store.meta = est.meta || {};
  store.historias = est.historias || store.historias;
  hidratarNuevas();
  store.pubTs = est.ts;
  save();
  renderAll();
  if (avisar && MODO_CLIENTE) toastVivo("✨ David actualizó los contenidos del mes");
  return true;
}
// Carga el estado.json archivado en el repo (lectura pública) y lo aplica si
// es más nuevo. Después, autocuración: si lo archivado quedó atrás de lo
// último guardado por David, se re-emite el adjunto para que el Mac lo archive.
function cargarPublicado(avisar) {
  return fetch(GH_ESTADO_API + "?ref=main&t=" + Date.now(), { headers: { "Accept": "application/vnd.github.raw+json" } })
    .then(r => { if (!r.ok) throw 0; return r.json(); })
    .catch(() => null)
    .then(est => {
      if (est) aplicarEstado(est, avisar);
      const archivadoTs = (est && est.ts) || 0;
      if (!MODO_CLIENTE && !EN_ARTIFACT && !store.pendientePub && (store.pubTs || 0) > archivadoTs && !window.__reenviado) {
        window.__reenviado = true;
        enviarEstadoNtfy(JSON.stringify(estadoPublicable(store.pubTs))).catch(() => {});
      }
    });
}

function estadoDe(p) { return store.estados[p.id] || p.estado; }
function checksDe(p) { return store.checks[p.id] || []; }
function aprobDe(p) { return store.aprob[p.id] || { v: "Pendiente", c: "" }; }
function portadaDe(p) { return store.portadas[p.id] || null; }
function fechaDe(p) { return store.fechas[p.id] || p.fecha; }
function horaDe(p) { return store.horas[p.id] || "18:00"; }
// Cola de publicación automática (la lee el trabajador de Meta en el Mac)
function metaDe(p) { return store.meta[p.id] || null; }
function actualizarMeta(p, patch) {
  const m = store.meta[p.id];
  if (!m || !m.auto) return;
  Object.assign(m, {
    copy: copyDe(p), fecha: fechaDe(p), hora: horaDe(p),
    titulo: tituloDe(p), marca: p.marca, ts: Date.now(),
  }, patch || {});
  marcarPendiente();
  save();
}
function ordenDe(p) { return store.orden[p.id] ?? PIEZAS.findIndex(x => x.id === p.id); }
function porOrden(a, b) { return ordenDe(a) - ordenDe(b); }
function tituloDe(p) { return (store.ediciones[p.id] || {}).titulo || p.titulo; }
function copyDe(p) { return (store.ediciones[p.id] || {}).copy || p.copy; }
// Versión para cliente: sin jerga de producción. Si David editó el copy, van sus palabras.
function conceptoDe(p) { return (store.ediciones[p.id] || {}).copy || p.concepto || p.copy; }
function editadaDe(p) { const e = store.ediciones[p.id]; return !!(e && (e.titulo || e.copy)); }
// Todas las fechas L-M-V del mes (los "espacios" fijos del calendario)
const FECHAS_MES = [...new Set(PIEZAS.map(p => p.fecha))].sort();
// Nombre del mes en minúscula ("Septiembre 2026" → "septiembre")
const MES_NOMBRE = (MES.titulo.split(" ")[0] || "").toLowerCase();
// Todos los días del mes (para organizar contenidos en cualquier fecha)
function fechasDelMes() {
  const [y, m] = MES.clave.split("-").map(Number);
  const total = new Date(y, m, 0).getDate();
  return Array.from({ length: total }, (_, i) => `${MES.clave}-${String(i + 1).padStart(2, "0")}`);
}
// Festivos oficiales de Colombia + celebraciones que mueven contenido
const FESTIVOS_CO = {
  "2026-01-01": { n: "Año Nuevo", t: "festivo" },
  "2026-01-12": { n: "Reyes Magos", t: "festivo" },
  "2026-03-23": { n: "San José", t: "festivo" },
  "2026-04-02": { n: "Jueves Santo", t: "festivo" },
  "2026-04-03": { n: "Viernes Santo", t: "festivo" },
  "2026-05-01": { n: "Día del Trabajo", t: "festivo" },
  "2026-05-18": { n: "Ascensión", t: "festivo" },
  "2026-06-08": { n: "Corpus Christi", t: "festivo" },
  "2026-06-15": { n: "Sagrado Corazón", t: "festivo" },
  "2026-06-29": { n: "San Pedro y San Pablo", t: "festivo" },
  "2026-07-20": { n: "Independencia", t: "festivo" },
  "2026-08-07": { n: "Batalla de Boyacá", t: "festivo" },
  "2026-08-17": { n: "Asunción de la Virgen", t: "festivo" },
  "2026-10-12": { n: "Día de la Raza", t: "festivo" },
  "2026-11-02": { n: "Todos los Santos", t: "festivo" },
  "2026-11-16": { n: "Independencia de Cartagena", t: "festivo" },
  "2026-12-08": { n: "Inmaculada Concepción", t: "festivo" },
  "2026-12-25": { n: "Navidad", t: "festivo" },
  "2026-09-19": { n: "Amor y Amistad", t: "celebracion" },
  "2026-10-01": { n: "Día Internacional del Café", t: "celebracion" },
  "2026-10-31": { n: "Halloween", t: "celebracion" },
  "2026-12-07": { n: "Día de las Velitas", t: "celebracion" },
  "2026-12-24": { n: "Nochebuena", t: "celebracion" },
};

// ---------- Piezas nuevas creadas por David ----------
const FOTOS_DEFECTO = {
  forestal: ["assets/ref/finca.jpg", "assets/ref/granos.jpg"],
  manzanares: ["assets/ref/tabla.jpg", "assets/ref/victorchurchill.jpg"],
};
function hidratarNuevas() {
  // quitar del arreglo las creadas que ya no estén en el estado
  for (let i = PIEZAS.length - 1; i >= 0; i--) {
    if (PIEZAS[i].id.startsWith("n-") && !store.nuevas.some(n => n.id === PIEZAS[i].id)) PIEZAS.splice(i, 1);
  }
  for (const n of store.nuevas) {
    if (PIEZAS.some(p => p.id === n.id)) continue;
    PIEZAS.push({
      id: n.id, marca: n.marca, fecha: n.fecha,
      titulo: n.titulo, formato: n.formato || "Reel",
      mensaje: n.mensaje || "La gente", tono: n.tono || "Emocional",
      estado: "Idea", reencauche: false, sesion: "s1",
      copy: n.concepto || n.titulo, concepto: n.concepto || n.titulo,
      gear: GEAR.reelNarrativo, fotos: FOTOS_DEFECTO[n.marca] || [],
      checklist: ["Definir el plano clave", "Grabar en la próxima sesión", "Editar y subtitular", "Programar en Meta Business Suite"],
      refs: [{ label: "Pinterest · referencias", url: "https://www.pinterest.com/search/pins/?q=" + encodeURIComponent(n.titulo) }],
      notion: n.marca === "forestal" ? MARCAS.forestal.notion : MARCAS.manzanares.notion,
    });
  }
}

// Banco de ideas construido del ADN estratégico de cada marca
const IDEAS = {
  forestal: [
    { t: "El error #1 al preparar café en casa (y cómo evitarlo)", c: "Video educativo corto: el error más común al preparar café en casa y la corrección en 15 segundos. Autoridad + utilidad = compartible.", f: "Reel", m: "Experiencia en tienda", tn: "Educativo" },
    { t: "24 horas en la finca: un día de cosecha", c: "Mini-documental de un día completo en la finca: amanecer, recolección, beneficio. La historia que solo nosotros podemos contar.", f: "Reel", m: "Finca propia", tn: "Emocional" },
    { t: "Grano verde vs tostado: el antes y después", c: "Serie de fotos comparando el grano crudo y el tostado de un mismo lote. La transformación que nadie ve.", f: "Foto", m: "3 orígenes", tn: "Dato curioso" },
    { t: "POV: pides un café y te preguntamos el origen", c: "Video con humor: la cara del cliente cuando descubre que su café tiene nombre, finca y altura. Cercano y compartible.", f: "Reel", m: "Experiencia en tienda", tn: "Trend/Humor" },
    { t: "Cata a ciegas: ¿reconoces tu origen favorito?", c: "Reto en tienda: clientes prueban los 3 orígenes a ciegas e intentan adivinar el suyo. Interacción real con el producto.", f: "Reel", m: "3 orígenes", tn: "Trend/Humor" },
    { t: "3 señales de que tu café ya no está fresco", c: "Carrusel guardable: cómo saber si el café perdió frescura y cómo conservarlo bien en casa.", f: "Carrusel", m: "Orgánico", tn: "Educativo" },
    { t: "El sonido de la primera extracción de la mañana", c: "ASMR de apertura de tienda: la máquina encendiendo, el primer espresso, la calma antes de abrir. Sensorial puro.", f: "Reel", m: "Experiencia en tienda", tn: "Sensorial" },
    { t: "¿Por qué nuestro café no necesita azúcar?", c: "Pieza gráfica con un dato que reposiciona: el dulzor natural de un café de especialidad bien tostado. Educar es vender.", f: "Pieza gráfica", m: "Orgánico", tn: "Dato curioso" },
  ],
  manzanares: [
    { t: "¿Término medio o tres cuartos? La guía definitiva", c: "Carrusel guardable: los términos de la carne explicados con fotos reales, para pedir y cocinar con seguridad.", f: "Carrusel", m: "Recetas", tn: "Educativo" },
    { t: "El corte que los parrilleros piden en secreto", c: "Video revelando el corte favorito de los que saben — por qué rinde, cómo pedirlo y cómo llevarlo al punto.", f: "Reel", m: "Cortes y productos", tn: "Dato curioso" },
    { t: "POV: llegas al asado con carne Manzanares", c: "Video con humor: la reacción del parche cuando ven el corte que trajiste. La marca como estatus del asador.", f: "Reel", m: "Tradición santandereana", tn: "Trend/Humor" },
    { t: "Maduración día 1 vs día 21: la diferencia se ve", c: "Serie de fotos comparando el mismo corte al inicio y al final de la maduración. La prueba visual de nuestro estándar.", f: "Foto", m: "Calidad y maduración", tn: "Dato curioso" },
    { t: "3 marinadas santandereanas para el fin de semana", c: "Carrusel de recetas locales: tres marinadas de la región con nuestros cortes. Tradición + antojo + guardable.", f: "Carrusel", m: "Recetas", tn: "Educativo" },
    { t: "El sonido del sellado perfecto", c: "ASMR de cocina: el corte tocando la plancha caliente, el punto exacto de volteo, el reposo. Sin música, puro antojo.", f: "Reel", m: "Recetas", tn: "Sensorial" },
    { t: "¿Cuánta carne por persona? El cálculo del asador", c: "Pieza gráfica con la fórmula sencilla para calcular carne por invitado. Útil, guardable y con sello de autoridad.", f: "Pieza gráfica", m: "Cortes y productos", tn: "Educativo" },
    { t: "La vitrina a las 6 am: así empieza el estándar", c: "Video del montaje de la vitrina al amanecer: los cortes acomodándose como joyería. El oficio antes de abrir.", f: "Reel", m: "La gente", tn: "Emocional" },
  ],
};
const ideasUsadas = new Set();
function generarIdea(marca) {
  const banco = IDEAS[marca] || IDEAS.forestal;
  const libres = banco.filter(i => !ideasUsadas.has(i.t));
  const idea = (libres.length ? libres : banco)[Math.floor(Math.random() * (libres.length ? libres.length : banco.length))];
  ideasUsadas.add(idea.t);
  return idea;
}

// ---------- Filtro de marca ----------
let marcaActiva = "todas";
function piezasVisibles() {
  return PIEZAS.filter(p => !store.ocultas[p.id] && (marcaActiva === "todas" || p.marca === marcaActiva))
    .slice().sort((a, b) => fechaDe(a).localeCompare(fechaDe(b)));
}

// ---------- Helpers ----------
function fmtFecha(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return { dia: DIAS[date.getDay()], num: d, date };
}
function hoyISO() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
// Resuelve rutas de imagen: en el Artifact existe window.__IMG (cada foto
// incrustada UNA sola vez); en local/Pages la ruta pasa tal cual.
function IMG(ruta) { return (window.__IMG && window.__IMG[ruta]) || ruta; }

function brandColor(p) { return MARCAS[p.marca].color; }
function brandTint(p) { return p.marca === "forestal" ? "var(--forestal-tint)" : "var(--manzanares-tint)"; }
const FORMATO_ICONO = { "Reel": "🎬", "Foto": "📷", "Carrusel": "🖼️", "Pieza gráfica": "✏️", "Historia": "⚡" };

// Íconos de línea minimalistas (estilo app moderna) para el link del cliente
const ICOL = {
  ok: '<svg class="icl" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8.3 12.4l2.5 2.5 4.9-5.3"/></svg>',
  ajuste: '<svg class="icl" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5l4 4L7 21l-4 1 1-4L16.5 3.5z"/></svg>',
  reloj: '<svg class="icl" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/></svg>',
  enviar: '<svg class="icl" viewBox="0 0 24 24"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>',
  lista: '<svg class="icl" viewBox="0 0 24 24"><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></svg>',
};
// En el link del cliente: ícono de línea; en la plataforma de David: emoji
const icl = n => MODO_CLIENTE ? (ICOL[n] || "") : ({ ok: "✅", ajuste: "✏️", reloj: "⏳", enviar: "📲", lista: "" }[n] || "");

// Portada visual de cada pieza: la real si David la subió; si no, la primera
// foto de referencia del concepto. Estática — solo reacciona al cursor
// (zoom + oscurecido) para no desviar la atención de la foto elegida.
function coverHtml(p, clase = "") {
  const img = portadaDe(p);
  if (img) {
    return `<div class="cover ${clase}"><img src="${img}" alt=""><span class="cover-tag portada">Portada</span></div>`;
  }
  const fs = p.fotos || [];
  if (!fs.length) return "";
  return `<div class="cover ${clase}"><img src="${IMG(fs[0])}" alt="" loading="lazy"><span class="cover-tag">Referencia</span></div>`;
}

function pieceCard(p, { compact = false, drag = false } = {}) {
  const est = estadoDe(p);
  const ap = aprobDe(p).v;
  const done = est === "Publicado";
  return `
    <article class="piece ${done ? "done" : ""}" style="--brand-color:${brandColor(p)};--brand-tint:${brandTint(p)}" data-id="${p.id}" ${drag ? `draggable="true"` : ""}>
      ${coverHtml(p, compact ? "cover-mini" : "")}
      ${drag && !MODO_CLIENTE ? `<button class="btn-quitar" data-quitar="${p.id}" title="Quitar del mes" aria-label="Quitar del mes">✕</button>` : ""}
      <div class="piece-top">
        <span class="chip brand">${MARCAS[p.marca].nombre}</span>
        <span class="chip estado ${ESTADO_CLASS[est]}">${est}</span>
        ${ap === "Aprobado" ? `<span class="chip aprobado">✓ Aprobado</span>` : ""}
        ${ap === "Ajustar" ? `<span class="chip ajustar">Ajustar</span>` : ""}
        ${p.reencauche ? `<span class="chip reencauche">Reencauche</span>` : ""}
        ${editadaDe(p) ? `<span class="chip editada">Editada</span>` : ""}
      </div>
      <div class="piece-title">${esc(tituloDe(p))}</div>
      ${compact ? "" : `<div class="piece-meta">${p.formato} · ${esc(p.mensaje)} · ${esc(p.tono)}</div>`}
      ${!MODO_CLIENTE && ["Listo", "Programado"].includes(est) ? `
      <button class="btn-programar ${est === "Programado" ? "ya" : ""}" data-programar="${p.id}">
        ${est === "Programado" ? `🕑 ${fechaDe(p).slice(8)}/${fechaDe(p).slice(5, 7)} · ${horaDe(p)} — abrir` : "📤 Programar publicación"}
      </button>` : ""}
    </article>`;
}

// ---------- HERO ----------
const HERO_TEXT = {
  todas: {
    eyebrow: `${MES.titulo} · ${MES.cadencia}`,
    title: "Contenido que posiciona",
    sub: "Café Forestal y Carnes Manzanares — el mes completo planificado, grabable en dos sesiones y listo para aprobar.",
  },
  forestal: {
    eyebrow: `${MES.titulo} · @forestalcafea`,
    title: "Del origen a la taza",
    sub: "Finca propia, tres orígenes y café orgánico. La historia del campo santandereano contada con estética de especialidad.",
  },
  manzanares: {
    eyebrow: `${MES.titulo} · @carnesmanzanares`,
    title: "El estándar premium",
    sub: "Trazabilidad real, maduración y oficio. Décadas siendo el referente de carnes en Santander — ahora también en el feed.",
  },
};

// Fotografía real de fondo por marca (assets locales; en el Artifact van embebidas)
const BG_FOTOS = {
  forestal: "assets/bg-tostadora.jpg",    // tostadora con granos (llamativa)
  tostadora: "assets/bg-tostadora.jpg",
  manzanares: "assets/bg-manzanares.jpg", // cortes sobre madera
};
let bgActual = null;
function renderPageBg() {
  if (bgActual === marcaActiva) return; // no recargar las fotos en cada render
  bgActual = marcaActiva;
  const bg = document.getElementById("pageBg");
  if (marcaActiva === "forestal" || marcaActiva === "manzanares") {
    bg.innerHTML = `<img class="bg-photo" src="${IMG(BG_FOTOS[marcaActiva])}" alt=""><div class="bg-veil"></div>`;
  } else {
    bg.innerHTML = `
      <div class="bg-diptych">
        <img class="bg-photo" src="${IMG(BG_FOTOS.tostadora)}" alt="">
        <img class="bg-photo" src="${IMG(BG_FOTOS.manzanares)}" alt="">
      </div>
      <div class="bg-veil"></div>`;
  }
}

function renderHero() {
  const t = HERO_TEXT[marcaActiva];
  renderPageBg();
  // El @ de la marca enlaza directo a su Instagram
  document.getElementById("heroEyebrow").innerHTML = (marcaActiva === "todas")
    ? esc(t.eyebrow)
    : `${esc(MES.titulo)} · <a class="eyebrow-ig" href="${MARCAS[marcaActiva].instagram}" target="_blank" rel="noopener">${esc(MARCAS[marcaActiva].handle)}</a>`;
  document.getElementById("heroTitle").textContent = t.title;
  document.getElementById("heroSub").textContent = t.sub;
  document.getElementById("monthPill").textContent = MES.titulo;

  const piezas = piezasVisibles();
  const pub = piezas.filter(p => estadoDe(p) === "Publicado").length;
  const listas = piezas.filter(p => ["Listo", "Programado", "Publicado"].includes(estadoDe(p))).length;
  const porGrabar = piezas.filter(p => estadoDe(p) === "Por grabar").length;
  const aprobadas = piezas.filter(p => aprobDe(p).v === "Aprobado").length;
  document.getElementById("heroStats").innerHTML = `
    <div class="hstat"><span class="ico">📅</span><div><div class="num">${pub}/${piezas.length}</div><div class="lbl">publicadas</div></div></div>
    <div class="hstat clicable" id="statAprobadas" role="button" title="Ver los contenidos aprobados"><span class="ico">✅</span><div><div class="num">${aprobadas}/${piezas.length}</div><div class="lbl">aprobadas por Mercadeo GM</div></div></div>
    <div class="hstat"><span class="ico">🎥</span><div><div class="num">${porGrabar}</div><div class="lbl">por grabar</div></div></div>
    <div class="hstat"><span class="ico">📦</span><div><div class="num">${listas}</div><div class="lbl">listas o programadas</div></div></div>`;
  document.getElementById("statAprobadas").onclick = () => {
    aprobFiltro = "Aprobado";
    renderAprobacion();
    activarVista("aprobacion");
    document.getElementById("view-aprobacion").scrollIntoView({ behavior: "smooth", block: "start" });
  };
}

// ---------- Vista: Calendario ----------
let calModo = "semanas"; // "semanas" | "dias" (columnas Lunes · Miércoles · Viernes)

function bloqueDia(f, porFecha, hoy, { conDia = true } = {}) {
  const { dia, num } = fmtFecha(f);
  const esHoy = f === hoy;
  const fest = FESTIVOS_CO[f];
  const grupo = (porFecha[f] || []).sort(porOrden);
  return `
    <div class="cal-day" data-fecha="${f}">
      <div class="cal-day-head ${esHoy ? "today" : ""}">
        ${conDia ? `<span class="cal-day-name">${dia}</span>` : ""}
        <span class="cal-day-date">${num} de ${MES_NOMBRE}</span>
        ${esHoy ? `<span class="today-chip">Hoy</span>` : ""}
        ${fest ? `<span class="mes-fest ${fest.t}">${esc(fest.n)}</span>` : ""}
      </div>
      ${grupo.map(p => pieceCard(p, { drag: true })).join("")}
      ${MODO_CLIENTE ? "" : `<button class="btn-mas" data-mas="${f}" title="Agregar contenido">+</button>`}
    </div>`;
}

// Chip compacto (estilo Google Calendar) para la vista Organizar mes
function chipPieza(p) {
  return `
    <div class="chip-pieza" draggable="true" data-id="${p.id}" title="${esc(tituloDe(p))}"
         style="--brand-color:${brandColor(p)}">
      <span class="cp-txt">${esc(tituloDe(p))}</span>
    </div>`;
}

function renderCalendario() {
  const el = document.getElementById("view-calendario");
  const piezas = piezasVisibles();
  const hoy = hoyISO();

  const porFecha = {};
  piezas.forEach(p => (porFecha[fechaDe(p)] = porFecha[fechaDe(p)] || []).push(p));

  // Espacios a mostrar: los L-M-V originales + cualquier fecha a la que
  // David haya movido un contenido desde Organizar mes.
  const fechasConPiezas = [...new Set([...FECHAS_MES, ...Object.keys(porFecha)])].sort();

  let html = `
    <p class="view-note">${calModo === "mes"
      ? `El mes completo, con festivos y celebraciones de Colombia. <b>Arrastra cada contenido al día real</b> en que se publicará — las demás vistas se actualizan solas (en el celular usa el selector de fecha dentro de la pieza).`
      : calModo === "flujo"
      ? `Tu tablero de trabajo: <b>arrastra cada contenido entre columnas</b> según avanza — de aprobado a creado, programado y publicado. Al soltar una pieza en <b>Programados</b> se abre la hoja para dejarla lista para Meta Business Suite.`
      : `Toca una pieza para ver copy, checklist, portada y referencias. <b>Arrástrala a otro día</b> para reacomodar el mes (en el celular usa el selector de fecha dentro de la pieza).`}</p>
    <div class="cal-barra">
      <div class="cal-toggle">
        <button data-m="semanas" class="${calModo === "semanas" ? "active" : ""}">Por semanas</button>
        <button data-m="dias" class="${calModo === "dias" ? "active" : ""}">Lunes · Miércoles · Viernes</button>
        <button data-m="mes" class="${calModo === "mes" ? "active" : ""}">🗓 Organizar mes</button>
        ${MODO_CLIENTE ? "" : `<button data-m="flujo" class="${calModo === "flujo" ? "active" : ""}">🧩 Flujo</button>`}
      </div>
      ${!MODO_CLIENTE && Object.keys(store.ocultas).length ? `<button class="btn-restaurar" id="btnQuitados">↩ Quitados (${Object.keys(store.ocultas).length})</button>` : ""}
    </div>`;

  if (calModo === "flujo") {
    html += htmlFlujo(piezas);
  } else if (calModo === "mes") {
    // Cuadrícula del mes completo (estilo Google Calendar): cada día es un
    // destino de arrastre, con los festivos marcados.
    const dias = fechasDelMes();
    const [y, m] = MES.clave.split("-").map(Number);
    const offset = (new Date(y, m - 1, 1).getDay() + 6) % 7; // columnas desde lunes
    html += `<div class="cal-mes-wrap"><div class="cal-mes">`;
    ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].forEach(d => { html += `<div class="mes-head">${d}</div>`; });
    for (let i = 0; i < offset; i++) html += `<div class="mes-celda vacia"></div>`;
    dias.forEach(f => {
      const fest = FESTIVOS_CO[f];
      const grupo = (porFecha[f] || []).sort(porOrden);
      const col = (offset + Number(f.slice(8)) - 1) % 7;
      html += `
        <div class="mes-celda cal-day ${f === hoy ? "hoy" : ""} ${col >= 5 ? "finde" : ""} ${fest ? "con-" + fest.t : ""}" data-fecha="${f}">
          <div class="mes-celda-top">
            <span class="mes-num">${Number(f.slice(8))}</span>
            ${fest ? `<span class="mes-fest ${fest.t}">${esc(fest.n)}</span>` : ""}
          </div>
          ${grupo.map(chipPieza).join("")}
        </div>`;
    });
    const resto = (offset + dias.length) % 7;
    if (resto) for (let i = resto; i < 7; i++) html += `<div class="mes-celda vacia"></div>`;
    html += `</div></div>`;
  } else if (calModo === "dias") {
    // Columnas por día de la semana: L-M-V fijas + los días extra que
    // tengan contenidos movidos (jueves, sábado…)
    const porDia = { "Lunes": [], "Miércoles": [], "Viernes": [] };
    fechasConPiezas.forEach(f => {
      const { dia } = fmtFecha(f);
      (porDia[dia] = porDia[dia] || []).push(f);
    });
    const ordenSemana = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
    const cols = ordenSemana.filter(d => porDia[d]);
    html += `<div class="cal-cols" style="grid-template-columns:repeat(${cols.length},1fr)">`;
    for (const dia of cols) {
      html += `
        <div class="cal-col">
          <div class="cal-col-head">${dia}</div>
          ${porDia[dia].map(f => bloqueDia(f, porFecha, hoy, { conDia: false })).join("")}
        </div>`;
    }
    html += `</div>`;
  } else {
    // Los espacios del calendario son SIEMPRE todos los L-M-V del mes
    // (más las fechas con piezas movidas), aunque queden vacíos.
    const semanas = {};
    fechasConPiezas.forEach(f => {
      const { date } = fmtFecha(f);
      const monday = new Date(date);
      monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
      const wk = monday.toISOString().slice(0, 10);
      (semanas[wk] = semanas[wk] || []).push(f);
    });
    let wkNum = 1;
    for (const wk of Object.keys(semanas).sort()) {
      html += `<div class="cal-week"><div class="cal-week-label">Semana ${wkNum++}</div><div class="cal-days">`;
      html += semanas[wk].sort().map(f => bloqueDia(f, porFecha, hoy)).join("");
      html += `</div></div>`;
    }
  }
  el.innerHTML = html;
  el.querySelectorAll(".cal-toggle button").forEach(b => {
    b.onclick = () => { calModo = b.dataset.m; renderCalendario(); };
  });
  const bq = el.querySelector("#btnQuitados");
  if (bq) bq.onclick = abrirQuitados;
  el.querySelectorAll("[data-mas]").forEach(b => { b.onclick = e => { e.stopPropagation(); abrirCreador(b.dataset.mas); }; });
  activarDnD(el);
  if (calModo === "flujo") activarDnDEstados(el);
}

// ---------- Modo Flujo: tablero de etapas con arrastre ----------
// Columnas del flujo real de trabajo. Soltar una pieza en una columna
// la lleva a ese estado (y en Programados abre la hoja de publicación).
const FLUJO_COLS = [
  { id: "crear", n: "Aprobados para crear", ico: "🎬", destino: "Por grabar", hint: "Con el visto bueno de Mercadeo — a producir", match: p => aprobDe(p).v === "Aprobado" && ["Idea", "Por grabar", "En edición"].includes(estadoDe(p)) },
  { id: "listo", n: "Listos", ico: "✅", destino: "Listo", hint: "Editados y con portada — a un paso de salir", match: p => estadoDe(p) === "Listo" },
  { id: "prog", n: "Programados", ico: "🕑", destino: "Programado", hint: "Con fecha y hora en Meta Business Suite", match: p => estadoDe(p) === "Programado" },
  { id: "pub", n: "Publicados", ico: "🚀", destino: "Publicado", hint: "Ya están en el feed", match: p => estadoDe(p) === "Publicado" },
];
function htmlFlujo(piezas) {
  const enCols = new Set();
  let html = `<div class="flujo-cols">`;
  for (const col of FLUJO_COLS) {
    const grupo = piezas.filter(col.match).sort((a, b) => fechaDe(a).localeCompare(fechaDe(b)) || porOrden(a, b));
    grupo.forEach(p => enCols.add(p.id));
    html += `
      <div class="flujo-col" data-destino="${col.destino}">
        <div class="flujo-col-head">
          <span class="flujo-ico">${col.ico}</span>
          <div><div class="flujo-nombre">${col.n}</div><div class="flujo-hint">${col.hint}</div></div>
          <span class="count">${grupo.length}</span>
        </div>
        ${grupo.map(p => `
          <div class="flujo-item" draggable="true" data-id="${p.id}" style="--brand-color:${brandColor(p)};--brand-tint:${brandTint(p)}">
            ${coverHtml(p, "cover-mini")}
            <div class="flujo-item-body">
              <span class="flujo-fecha">${fmtFecha(fechaDe(p)).dia.slice(0, 3)} ${fechaDe(p).slice(8)} · ${MARCAS[p.marca].nombre}</span>
              <span class="flujo-titulo">${esc(tituloDe(p))}</span>
              ${col.id === "listo" || col.id === "prog" ? `
              <button class="btn-programar ${col.id === "prog" ? "ya" : ""}" data-programar="${p.id}">
                ${col.id === "prog" ? `🕑 ${horaDe(p)} — abrir` : "📤 Programar"}
              </button>` : ""}
            </div>
          </div>`).join("") || `<div class="pipe-empty">Arrastra piezas aquí</div>`}
      </div>`;
  }
  html += `</div>`;
  // Piezas que aún no entran al flujo (sin aprobación de Mercadeo)
  const fuera = piezas.filter(p => !enCols.has(p.id));
  if (fuera.length) {
    html += `
      <div class="flujo-espera">
        <span class="flujo-espera-txt">⏳ ${fuera.length} contenido${fuera.length > 1 ? "s" : ""} esperando aprobación de Mercadeo — entran al flujo al ser aprobados:</span>
        ${fuera.map(p => `<button class="chip-espera" data-abrir="${p.id}" style="--brand-color:${brandColor(p)}">${esc(tituloDe(p))}</button>`).join("")}
      </div>`;
  }
  return html;
}
function activarDnDEstados(root) {
  root.querySelectorAll(".flujo-item").forEach(card => {
    card.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", card.dataset.id);
      e.dataTransfer.effectAllowed = "move";
      card.classList.add("dragging");
    });
    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
      root.querySelectorAll(".flujo-col.drag-over").forEach(d => d.classList.remove("drag-over"));
    });
  });
  root.querySelectorAll(".flujo-col").forEach(col => {
    col.addEventListener("dragover", e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; col.classList.add("drag-over"); });
    col.addEventListener("dragleave", () => col.classList.remove("drag-over"));
    col.addEventListener("drop", e => {
      e.preventDefault();
      col.classList.remove("drag-over");
      const id = e.dataTransfer.getData("text/plain");
      moverEstado(id, col.dataset.destino);
    });
  });
  root.querySelectorAll("[data-abrir]").forEach(b => { b.onclick = () => openDrawer(b.dataset.abrir); });
}
function moverEstado(id, destino) {
  const p = PIEZAS.find(x => x.id === id);
  if (!p || estadoDe(p) === destino) return;
  store.estados[id] = destino;
  save();
  emitirContenido({ tipo: "estado", id, v: destino });
  renderAll();
  if (destino === "Programado") openPublicar(id);
}

// ---------- Arrastrar y soltar entre fechas ----------
function activarDnD(root) {
  root.querySelectorAll('.piece[draggable="true"], .chip-pieza[draggable="true"]').forEach(card => {
    if (!MODO_CLIENTE && card.classList.contains("piece")) activarSwipeQuitar(card);
    card.addEventListener("dragstart", e => {
      e.dataTransfer.setData("text/plain", card.dataset.id);
      e.dataTransfer.effectAllowed = "move";
      card.classList.add("dragging");
    });
    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
      root.querySelectorAll(".cal-day.drag-over").forEach(d => d.classList.remove("drag-over"));
    });
  });
  root.querySelectorAll(".cal-day").forEach(day => {
    day.addEventListener("dragover", e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; day.classList.add("drag-over"); });
    day.addEventListener("dragleave", () => day.classList.remove("drag-over"));
    day.addEventListener("drop", e => {
      e.preventDefault();
      const id = e.dataTransfer.getData("text/plain");
      // posición dentro del día: encima o debajo de las piezas existentes
      const cards = [...day.querySelectorAll(".piece, .chip-pieza")].filter(c => c.dataset.id !== id);
      let idx = cards.length;
      for (let i = 0; i < cards.length; i++) {
        const r = cards[i].getBoundingClientRect();
        if (e.clientY < r.top + r.height / 2) { idx = i; break; }
      }
      moverPieza(id, day.dataset.fecha, idx);
    });
  });
}
// Deslizar la tarjeta a la izquierda (táctil) para quitarla del mes
function activarSwipeQuitar(card) {
  let x0 = 0, y0 = 0, dx = 0, activo = false;
  card.addEventListener("touchstart", e => {
    x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; dx = 0; activo = true;
    card.style.transition = "none";
  }, { passive: true });
  card.addEventListener("touchmove", e => {
    if (!activo) return;
    const t = e.touches[0];
    dx = t.clientX - x0;
    const dy = Math.abs(t.clientY - y0);
    if (dx < -10 && dy < 48) {
      // amortiguado: la tarjeta sigue el dedo con resistencia, fluido
      const tx = dx * 0.72;
      card.style.transform = `translateX(${Math.max(tx, -card.offsetWidth)}px)`;
      card.style.opacity = String(Math.max(0.3, 1 + tx / (card.offsetWidth * 1.4)));
    }
  }, { passive: true });
  card.addEventListener("touchend", () => {
    if (!activo) return;
    activo = false;
    const umbral = -card.offsetWidth * 0.5; // hay que arrastrar más de media tarjeta
    if (dx * 0.72 < umbral) {
      card.style.transition = "transform .35s cubic-bezier(.22,.8,.36,1), opacity .35s ease";
      card.style.transform = "translateX(-115%)";
      card.style.opacity = "0";
      setTimeout(() => quitarPieza(card.dataset.id), 330);
    } else {
      card.style.transition = "transform .3s cubic-bezier(.22,.8,.36,1), opacity .3s ease";
      card.style.transform = ""; card.style.opacity = "";
    }
  });
}

function moverPieza(id, fecha, idx) {
  const p = PIEZAS.find(x => x.id === id);
  if (!p || !fecha) return;
  if (fecha === p.fecha) delete store.fechas[id];
  else store.fechas[id] = fecha;
  // reordenar las piezas de ese día con la movida en la posición soltada
  const delDia = PIEZAS.filter(x => x.id !== id && fechaDe(x) === fecha).sort(porOrden);
  delDia.splice(idx === undefined ? delDia.length : idx, 0, p);
  delDia.forEach((x, i) => { store.orden[x.id] = i; });
  save();
  emitirContenido({ tipo: "fecha", id, fecha, orden: store.orden });
  renderAll();
}

// ---------- Vista: Pipeline ----------
function renderPipeline() {
  const el = document.getElementById("view-pipeline");
  const piezas = piezasVisibles();
  let html = `<p class="view-note">${MODO_CLIENTE
    ? `Así está organizada la producción: cada pieza avanza de <b>Idea</b> a <b>Publicado</b>. Toca cualquiera para ver de qué trata.`
    : `El flujo de producción. <b>Arrastra una pieza a otra columna</b> para cambiar su estado, o tócala y cámbialo desde el panel — el avance se guarda solo.`}</p><div class="pipeline">`;
  for (const est of ESTADOS) {
    const grupo = piezas.filter(p => estadoDe(p) === est);
    html += `
      <div class="pipe-col" data-estado="${est}">
        <div class="pipe-col-head">
          <span class="dot ${ESTADO_CLASS[est]}"></span>
          <span class="name">${est}</span>
          <span class="count">${grupo.length}</span>
        </div>
        ${grupo.length ? grupo.map(p => pieceCard(p, { compact: true })).join("") : `<div class="pipe-empty">—</div>`}
      </div>`;
  }
  html += `</div>`;
  el.innerHTML = html;
  // David puede arrastrar piezas entre columnas para cambiarles el estado
  if (!MODO_CLIENTE) {
    el.querySelectorAll(".pipe-col .piece").forEach(card => {
      card.setAttribute("draggable", "true");
      card.addEventListener("dragstart", e => {
        e.dataTransfer.setData("text/plain", card.dataset.id);
        e.dataTransfer.effectAllowed = "move";
        card.classList.add("dragging");
      });
      card.addEventListener("dragend", () => {
        card.classList.remove("dragging");
        el.querySelectorAll(".pipe-col.drag-over").forEach(d => d.classList.remove("drag-over"));
      });
    });
    el.querySelectorAll(".pipe-col").forEach(col => {
      col.addEventListener("dragover", e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; col.classList.add("drag-over"); });
      col.addEventListener("dragleave", () => col.classList.remove("drag-over"));
      col.addEventListener("drop", e => {
        e.preventDefault();
        col.classList.remove("drag-over");
        moverEstado(e.dataTransfer.getData("text/plain"), col.dataset.estado);
      });
    });
  }
}

// ---------- Vista: Rodaje ----------
function renderRodaje() {
  const el = document.getElementById("view-rodaje");
  const piezas = piezasVisibles();
  let html = `<p class="view-note">La clave anti-estancamiento: <b>dos días de rodaje al mes surten las 12 fechas de cada marca</b>. Todo lo demás es edición y diseño que puedes hacer cualquier noche.</p>`;
  for (const key of ["s1", "s2", "ed"]) {
    const grupo = piezas.filter(p => p.sesion === key);
    if (!grupo.length) continue;
    html += `
      <div class="sesion">
        <h3>${SESIONES[key].nombre}</h3>
        <p class="desc">${SESIONES[key].desc}</p>
        <div class="sesion-grid">${grupo.map(p => pieceCard(p)).join("")}</div>
      </div>`;
  }
  el.innerHTML = html;
}

// ---------- Vista: Feed ----------
function renderFeed() {
  const el = document.getElementById("view-feed");
  const marcas = marcaActiva === "todas" ? ["forestal", "manzanares"] : [marcaActiva];
  let html = `<p class="view-note">Así se vería el feed de cada cuenta con las piezas del mes. Toca una casilla para abrir la pieza y <b>subir su portada</b> — la imagen se comprime y se guarda sola.</p><div class="feed-wrap">`;
  for (const mk of marcas) {
    const m = MARCAS[mk];
    const piezas = PIEZAS.filter(p => p.marca === mk && !store.ocultas[p.id]).sort((a, b) => fechaDe(b).localeCompare(fechaDe(a)) || porOrden(a, b));
    html += `
      <div class="phone">
        <div class="phone-head">
          <span class="phone-avatar" style="background:${m.colorFuerte}">${m.nombre[0]}</span>
          <div>
            <div class="phone-handle">${m.handle}</div>
            <div class="phone-caption">vista previa del feed · ${MES.titulo.toLowerCase()}</div>
          </div>
        </div>
        <div class="phone-grid">
          ${piezas.map(p => {
            const img = portadaDe(p);
            const d = fechaDe(p).slice(8);
            return `
              <button class="cell has-img ${img ? "" : "es-ref"}" data-id="${p.id}" title="${esc(tituloDe(p))}">
                ${img
                  ? `<img src="${img}" alt="${esc(tituloDe(p))}">`
                  : `<img src="${IMG((p.fotos || [])[0] || "")}" alt="" loading="lazy">
                     <span class="cell-grad"></span>
                     <span class="cell-tit-over">${esc(tituloDe(p))}</span>`}
                <span class="cell-date">${d} sep</span>
                <span class="cell-hint">${img ? "Toca para abrir" : "Referencia · toca para abrir y subir tu portada"}</span>
              </button>`;
          }).join("")}
        </div>
      </div>`;
  }
  html += `</div><p class="view-note feed-note">Las casillas sin portada muestran el título de la pieza; a medida que produces, el feed se va viendo como quedará publicado.</p>`;
  el.innerHTML = html;
}

// ---------- Vista: Aprobación ----------
let aprobFiltro = "todas"; // "todas" | "Aprobado" | "Ajustar" | "Pendiente"
// En el link de Mercadeo GM el comentario se fija con "Enviar" y solo
// se cambia con "Editar" — evita borrados accidentales.
const comentarioEditando = {};
function bloqueComentario(p) {
  const a = aprobDe(p);
  if (!MODO_CLIENTE) {
    return `<textarea class="aprob-comment" placeholder="Comentario para David (opcional)…">${esc(a.c || "")}</textarea>`;
  }
  if (a.c && !comentarioEditando[p.id]) {
    return `
      <div class="coment-fijo">💬 ${esc(a.c)}</div>
      <button class="btn-ghost btn-coment" data-editar="${p.id}">${ICOL.ajuste} Editar comentario</button>`;
  }
  return `
    <textarea class="aprob-comment" placeholder="Escribe tu comentario o ajuste…">${esc(a.c || "")}</textarea>
    <button class="btn-primary btn-coment" data-enviar="${p.id}">${ICOL.enviar} Enviar comentario</button>`;
}
function conectarComentario(cont, p, refrescar) {
  const ta = cont.querySelector(".aprob-comment");
  if (!MODO_CLIENTE) {
    if (!ta) return;
    ta.oninput = () => { store.aprob[p.id] = { ...aprobDe(p), c: ta.value }; };
    ta.onchange = () => save();
    return;
  }
  const btnEnviar = cont.querySelector(`[data-enviar="${p.id}"]`);
  if (btnEnviar) btnEnviar.onclick = () => {
    store.aprob[p.id] = { ...aprobDe(p), c: ta.value.trim() };
    comentarioEditando[p.id] = false;
    save();
    notiComentario(p, ta.value);
    emitirDato(p);
    refrescar();
  };
  const btnEditar = cont.querySelector(`[data-editar="${p.id}"]`);
  if (btnEditar) btnEditar.onclick = () => { comentarioEditando[p.id] = true; refrescar(); };
}
function renderAprobacion() {
  const el = document.getElementById("view-aprobacion");
  const todas = piezasVisibles();
  const aprobadas = todas.filter(p => aprobDe(p).v === "Aprobado").length;
  const conAjustes = todas.filter(p => aprobDe(p).v === "Ajustar").length;
  const piezas = aprobFiltro === "todas" ? todas : todas.filter(p => aprobDe(p).v === aprobFiltro);
  let html = `
    <p class="view-note">${MODO_CLIENTE
      ? `Elige la marca arriba, <b>toca cualquier pieza para ver de qué trata</b> (con ejemplos del estilo), marca <b>✓ Aprobado</b> o <b>Ajustar</b> con tu comentario, y al final envíanos tus respuestas por WhatsApp. ¡Gracias! 💛`
      : `Revisión de mercadeo: marca cada pieza como <b>Aprobado</b> o <b>Ajustar</b> y deja tu comentario. Los cambios se guardan solos; el botón confirma la sincronización.`}</p>
    <div class="aprob-toolbar">
      ${MODO_CLIENTE ? "" : `<button class="btn-primary" id="btnGuardarRevision">Guardar revisión</button>`}
      <a class="${MODO_CLIENTE ? "btn-primary" : "btn-ghost"}" id="btnWhatsApp" href="https://wa.me/" target="_blank" rel="noopener">${icl("enviar")} ${MODO_CLIENTE ? "Enviar mis respuestas por WhatsApp" : "Enviar por WhatsApp para aprobación"}</a>
      ${MODO_CLIENTE ? "" : `<button class="btn-ghost" id="btnPdf">📄 Exportar PDF para cliente (${todas.filter(p => store.pdf[p.id] !== false).length})</button>`}
      ${MODO_CLIENTE ? "" : `<button class="btn-ghost" id="btnLinkCliente">🔗 Copiar link para cliente</button>`}
      <span class="aprob-saved" id="aprobSaved">${aprobadas}/${todas.length} aprobadas</span>
    </div>
    <div class="cal-toggle aprob-filtros">
      <button data-f="todas" class="${aprobFiltro === "todas" ? "active" : ""}">${icl("lista")} Todas (${todas.length})</button>
      <button data-f="Aprobado" class="${aprobFiltro === "Aprobado" ? "active" : ""}">${icl("ok")} Aprobadas (${aprobadas})</button>
      <button data-f="Ajustar" class="${aprobFiltro === "Ajustar" ? "active" : ""}">${icl("ajuste")} Con ajustes (${conAjustes})</button>
      <button data-f="Pendiente" class="${aprobFiltro === "Pendiente" ? "active" : ""}">${icl("reloj")} Pendientes (${todas.length - aprobadas - conAjustes})</button>
    </div>
    ${!piezas.length ? `<p class="view-note">No hay piezas en este filtro todavía.</p>` : ""}`;
  for (const p of piezas) {
    const { dia, num } = fmtFecha(fechaDe(p));
    const a = aprobDe(p);
    const img = portadaDe(p);
    html += `
      <div class="aprob-row" data-id="${p.id}">
        <div class="aprob-info">
          ${coverHtml(p, "cover-thumb")}
          <div>
            <div class="fecha">${dia} ${num} sep · ${MARCAS[p.marca].nombre} · ${p.formato}${!MODO_CLIENTE && a.por ? ` · ✍️ respondió ${esc(a.por)}` : ""}</div>
            <h4>${esc(tituloDe(p))}</h4>
            <div class="copy">${esc(MODO_CLIENTE ? conceptoDe(p) : copyDe(p))}</div>
            ${MODO_CLIENTE ? "" : `<button class="ver-mas" data-open="${p.id}">Ver pieza completa →</button>`}
          </div>
        </div>
        <div class="aprob-controls">
          <div class="aprob-pills">
            ${APROB.map(v => `<button data-v="${v}" class="${a.v === v ? "sel" : ""}">${v === "Aprobado" ? (MODO_CLIENTE ? ICOL.ok + " " : "✓ ") : v === "Ajustar" && MODO_CLIENTE ? ICOL.ajuste + " " : ""}${v}</button>`).join("")}
          </div>
          ${bloqueComentario(p)}
          ${MODO_CLIENTE ? "" : `
          <label class="pdf-check">
            <input type="checkbox" data-pdf ${store.pdf[p.id] !== false ? "checked" : ""}>
            <span>Incluir en el PDF para cliente</span>
          </label>`}
        </div>
      </div>`;
  }
  el.innerHTML = html;

  el.querySelectorAll(".aprob-row").forEach(row => {
    const id = row.dataset.id;
    // Toda la fila abre la tarjeta de la pieza (salvo los controles)
    row.addEventListener("click", e => {
      if (e.target.closest("button, textarea, a, input, label")) return;
      openDrawer(id);
    });
    row.querySelectorAll(".aprob-pills button").forEach(b => {
      b.onclick = () => {
        store.aprob[id] = { ...aprobDe({ id }), v: b.dataset.v };
        save();
        const pieza = PIEZAS.find(x => x.id === id);
        notiAprobacion(pieza, b.dataset.v);
        emitirDato(pieza);
        renderAll({ keep: "aprobacion" });
      };
    });
    conectarComentario(row, PIEZAS.find(x => x.id === id), () => renderAprobacion());
    const pdfCb = row.querySelector("[data-pdf]");
    if (pdfCb) pdfCb.onchange = () => {
      if (pdfCb.checked) delete store.pdf[id]; else store.pdf[id] = false;
      save();
      const btn = el.querySelector("#btnPdf");
      if (btn) btn.textContent = `📄 Exportar PDF para cliente (${todas.filter(x => store.pdf[x.id] !== false).length})`;
    };
  });
  const btnPdf = el.querySelector("#btnPdf");
  if (btnPdf) btnPdf.onclick = exportarPdf;
  el.querySelectorAll("[data-open]").forEach(b => { b.onclick = () => openDrawer(b.dataset.open); });
  const btn = el.querySelector("#btnGuardarRevision");
  if (btn) btn.onclick = () => {
    save();
    if (window.hubFlush) window.hubFlush();
    btn.textContent = "Revisión guardada ✓";
    setTimeout(() => { btn.textContent = "Guardar revisión"; }, 2500);
  };
  const btnLink = el.querySelector("#btnLinkCliente");
  if (btnLink) btnLink.onclick = async () => {
    const url = ENLACE_PUBLICO + "?modo=cliente";
    try {
      await navigator.clipboard.writeText(url);
      btnLink.textContent = "🔗 Link copiado ✓";
      setTimeout(() => { btnLink.textContent = "🔗 Copiar link para cliente"; }, 2500);
    } catch {
      prompt("Copia el link para tu cliente:", url);
    }
  };
  // El botón de WhatsApp es un enlace real (el visor bloquea window.open);
  // el mensaje se arma justo antes de seguir el enlace.
  el.querySelectorAll(".aprob-filtros button").forEach(b => {
    b.onclick = () => { aprobFiltro = b.dataset.f; renderAprobacion(); };
  });
  el.querySelector("#btnWhatsApp").addEventListener("click", function () {
    const pendientes = todas.filter(p => aprobDe(p).v === "Pendiente");
    const revisadas = todas.filter(p => aprobDe(p).v !== "Pendiente");
    if (MODO_CLIENTE) {
      // Mensaje corto del cliente: saludo + sus respuestas
      const L = ["¡Hola! Estos son los comentarios de los contenidos:", ""];
      for (const p of revisadas) {
        const a = aprobDe(p);
        L.push(`${a.v === "Aprobado" ? "✅" : "✏️"} ${fechaDe(p).slice(8)}/09 · ${tituloDe(p)} — *${a.v}*${a.c ? `\n💬 "${a.c}"` : ""}`);
      }
      if (!revisadas.length) L.push("(Aún no he revisado piezas)");
      if (pendientes.length) L.push("", `Me quedan ${pendientes.length} por revisar.`);
      this.href = "https://wa.me/?text=" + encodeURIComponent(L.join("\n"));
      return;
    }
    const marcaTxt = marcaActiva === "todas" ? "Café Forestal + Carnes Manzanares" : MARCAS[marcaActiva].nombre;
    const L = [`*Contenidos ${MES.titulo} · ${marcaTxt}*`];

    if (pendientes.length) {
      L.push("", `📋 *${pendientes.length} piezas para tu aprobación*`, `_Responde con el número + "ok", o el ajuste que quieras:_`);
      pendientes.forEach((p, i) => {
        const f = fmtFecha(fechaDe(p));
        const concepto = conceptoDe(p).slice(0, 180);
        L.push("",
          `*${i + 1}️⃣  ${tituloDe(p)}*`,
          `${f.dia} ${f.num}/09 · ${MARCAS[p.marca].nombre} · ${p.formato} ${FORMATO_ICONO[p.formato] || ""}`,
          `💡 ${concepto}`);
      });
    }
    if (revisadas.length) {
      L.push("", `— — —`, `*Ya revisadas (${revisadas.length}):*`);
      for (const p of revisadas) {
        const a = aprobDe(p);
        L.push(`${a.v === "Aprobado" ? "✅" : "✏️"} ${fechaDe(p).slice(8)}/09 · ${tituloDe(p)}${a.c ? ` — 💬 ${a.c}` : ""}`);
      }
    }
    L.push("", `👀 Revísalo y aprueba aquí (se abre en cualquier celular): ${ENLACE_PUBLICO}?modo=cliente`);
    this.href = "https://wa.me/?text=" + encodeURIComponent(L.join("\n"));
    // sin preventDefault: el enlace navega con el mensaje ya armado
  });
}

// ---------- Vista: Referentes ----------
let railAnim = null;
function refRail(items, tipo) {
  const cards = tipo === "cuenta"
    ? items.map(r => `
        <a class="ref-slide" href="${r.url}" target="_blank" rel="noopener">
          <img src="${IMG(r.img)}" alt="${esc(r.handle)}" loading="lazy">
          <span class="ref-grad"></span>
          <span class="ref-slide-body">
            <span class="ref-cat">Instagram</span>
            <span class="ref-handle">${esc(r.handle)}</span>
            <span class="ref-why">${esc(r.why)}</span>
            <span class="ref-cta">Ver cuenta ↗</span>
          </span>
        </a>`).join("")
    : items.map((t, i) => `
        <div class="tactic-card">
          <span class="tactic-num">${String(i + 1).padStart(2, "0")}</span>
          <b>${esc(t.t)}</b>
          <p>${esc(t.d)}</p>
        </div>`).join("");
  return `
    <div class="rail-wrap">
      <button class="rail-btn prev" aria-label="Anterior">‹</button>
      <div class="ref-rail">${cards}</div>
      <button class="rail-btn next" aria-label="Siguiente">›</button>
    </div>`;
}

function renderReferentes() {
  const el = document.getElementById("view-referentes");
  const R = REFERENTES;
  el.innerHTML = `
    <p class="view-note">Referencias muy visuales: desliza, mira la estética y toca para abrir cada cuenta. El norte: <a href="${R.norte.url}" target="_blank" rel="noopener" style="color:#E9C46A;font-weight:600">${R.norte.handle}</a>.</p>

    <div class="norte">
      <h3>El norte: ${R.norte.handle}</h3>
      <p class="desc">${esc(R.norte.resumen)}</p>
      <div class="norte-lecciones">
        ${R.norte.lecciones.map(l => `<div class="leccion">→ ${esc(l)}</div>`).join("")}
      </div>
    </div>

    <div class="ref-section-title">☕ Café de especialidad</div>
    ${refRail(R.cafe, "cuenta")}

    <div class="ref-section-title">🥩 Carne premium</div>
    ${refRail(R.carne, "cuenta")}

    <div class="ref-section-title">⚡ Tácticas 2025-2026 — desliza →</div>
    ${refRail(R.tacticas, "tactica")}

    <div class="ref-section-title">📌 Inspiración visual</div>
    <p class="view-note">Escribe lo que quieras buscar y ábrelo directo en Pinterest, o toca cualquier imagen del mosaico para explorar esa idea.</p>
    <form class="searchbar" id="pinForm">
      <input type="search" id="pinQuery" class="edit-input" placeholder="Busca referencias… ej: specialty coffee reel, parrilla ASMR, butcher shop">
      <a class="btn-primary" id="pinGo" href="https://www.pinterest.com/" target="_blank" rel="noopener">Buscar en Pinterest</a>
    </form>
    ${[R.mosaico.filter((_, i) => i % 2 === 0), R.mosaico.filter((_, i) => i % 2 === 1)].map((fila, fi) => `
      <div class="mas-rail" data-dir="${fi === 0 ? 1 : -1}">
        ${fila.map(m => `
          <a class="mas-item" href="https://www.pinterest.com/search/pins/?q=${encodeURIComponent(m.q)}" target="_blank" rel="noopener">
            <img src="${IMG(m.img)}" alt="${esc(m.q)}" loading="lazy">
            <span class="mas-label">📌 ${esc(m.q)}</span>
          </a>`).join("")}
      </div>`).join("")}`;

  // rieles con flechas
  el.querySelectorAll(".rail-wrap").forEach(w => {
    const rail = w.querySelector(".ref-rail");
    w.querySelector(".prev").onclick = () => rail.scrollBy({ left: -320, behavior: "smooth" });
    w.querySelector(".next").onclick = () => rail.scrollBy({ left: 320, behavior: "smooth" });
  });
  // buscador de Pinterest — enlace real (el visor bloquea window.open)
  const pinGo = el.querySelector("#pinGo");
  const pinQuery = el.querySelector("#pinQuery");
  function pinUrl() {
    const q = pinQuery.value.trim();
    return q ? "https://www.pinterest.com/search/pins/?q=" + encodeURIComponent(q) : "https://www.pinterest.com/";
  }
  pinQuery.addEventListener("input", () => { pinGo.href = pinUrl(); });
  pinGo.addEventListener("click", function () { this.href = pinUrl(); });
  el.querySelector("#pinForm").onsubmit = e => { e.preventDefault(); pinGo.href = pinUrl(); pinGo.click(); };

  // Deriva continua tipo luxury: los rieles de fotos se deslizan solos en
  // bucle, lento y fluido; se pausan al interactuar y retoman a los segundos.
  if (railAnim) cancelAnimationFrame(railAnim);
  railAnim = null;
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const rieles = [];
    const armarRiel = (rail, dir) => {
      rail.classList.add("auto");
      rail.innerHTML += rail.innerHTML; // duplicado para el bucle infinito sin saltos
      const s = { rail, dir, pos: dir < 0 ? rail.scrollWidth / 2 : 0, hover: false, hasta: 0 };
      if (dir < 0) rail.scrollLeft = s.pos;
      rail.addEventListener("pointerenter", () => { s.hover = true; });
      rail.addEventListener("pointerleave", () => { s.hover = false; s.pos = rail.scrollLeft; });
      ["pointerdown", "touchstart", "wheel"].forEach(ev =>
        rail.addEventListener(ev, () => { s.hasta = performance.now() + 4000; s.pos = rail.scrollLeft; }, { passive: true }));
      rieles.push(s);
      return s;
    };
    el.querySelectorAll(".rail-wrap").forEach(w => {
      const rail = w.querySelector(".ref-rail");
      if (!rail.querySelector(".ref-slide")) return; // solo los de fotos
      const s = armarRiel(rail, 1);
      w.querySelectorAll(".rail-btn").forEach(b =>
        b.addEventListener("click", () => { s.hasta = performance.now() + 4000; setTimeout(() => { s.pos = rail.scrollLeft; }, 450); }));
    });
    el.querySelectorAll(".mas-rail").forEach(rail => armarRiel(rail, Number(rail.dataset.dir) || 1));
    if (rieles.length) {
      const tick = now => {
        if (document.getElementById("view-referentes").classList.contains("active")) {
          for (const s of rieles) {
            if (s.hover || now < s.hasta) continue;
            s.pos += 0.4 * s.dir; // ~24px por segundo: lento, fluido
            const mitad = s.rail.scrollWidth / 2;
            if (s.pos >= mitad) s.pos -= mitad;
            if (s.pos < 0) s.pos += mitad;
            s.rail.scrollLeft = s.pos;
          }
        }
        railAnim = requestAnimationFrame(tick);
      };
      railAnim = requestAnimationFrame(tick);
    }
  }
}

// ---------- PDF de aprobación para cliente (jsPDF) ----------
const PDF_COLORES = { ink: [33, 28, 22], dim: [110, 103, 92], suave: [74, 68, 60], miel: [138, 90, 43] };

function construirPdf() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, M = 16, ANCHO = W - M * 2;
  let y = 20;
  const piezas = piezasVisibles().filter(p => store.pdf[p.id] !== false);
  const marcas = [...new Set(piezas.map(p => p.marca))];
  const hoy = new Date();
  const fechaDoc = `${hoy.getDate()} de ${["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"][hoy.getMonth()]} de ${hoy.getFullYear()}`;
  const salto = alto => { if (y + alto > 278) { doc.addPage(); y = 20; } };

  // Cabecera
  doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(...PDF_COLORES.miel);
  doc.text(`PROPUESTA DE CONTENIDOS · ${MES.titulo.toUpperCase()}`, M, y); y += 8;
  doc.setFontSize(22).setTextColor(...PDF_COLORES.ink);
  doc.text(marcas.map(m => MARCAS[m].nombre).join("  ·  "), M, y); y += 7;
  doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...PDF_COLORES.dim);
  doc.text(`${piezas.length} piezas · Publicación ${MES.cadencia.toLowerCase()} · Preparado por David · ${fechaDoc}`, M, y); y += 7;
  doc.setFontSize(10.5).setTextColor(...PDF_COLORES.suave);
  const intro = doc.splitTextToSize("Revisa cada pieza y responde con tu aprobación o los ajustes que quieras. Cada contenido incluye su fecha de publicación, formato y concepto.", ANCHO);
  doc.text(intro, M, y); y += intro.length * 4.6 + 3;
  doc.setDrawColor(...PDF_COLORES.ink).setLineWidth(0.8).line(M, y, W - M, y); y += 9;

  // Organizado por semanas, como el calendario de la plataforma
  const semanas = {};
  for (const p of piezas) {
    const { date } = fmtFecha(fechaDe(p));
    const lunes = new Date(date);
    lunes.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    const wk = lunes.toISOString().slice(0, 10);
    (semanas[wk] = semanas[wk] || []).push(p);
  }
  let numSemana = 1;
  for (const wk of Object.keys(semanas).sort()) {
    salto(18);
    doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...PDF_COLORES.miel);
    doc.text(`SEMANA ${numSemana++}`, M, y);
    doc.setDrawColor(...PDF_COLORES.miel).setLineWidth(0.5).line(M + 26, y - 1.2, W - M, y - 1.2);
    y += 7;

    for (const p of semanas[wk].sort((a, b) => fechaDe(a).localeCompare(fechaDe(b)) || porOrden(a, b))) {
      const f = fmtFecha(fechaDe(p));
      const img = portadaDe(p) || IMG((p.fotos || [])[0] || "") || null; // portada real o referencia visual
      const rgb = p.marca === "forestal" ? [74, 124, 89] : [178, 69, 44];
      const xTexto = img ? M + 27 : M, anchoTexto = ANCHO - (img ? 27 : 0);
      const titulo = doc.setFont("helvetica", "bold").setFontSize(12.5).splitTextToSize(tituloDe(p), anchoTexto);
      const concepto = doc.setFont("helvetica", "normal").setFontSize(10).splitTextToSize(conceptoDe(p), anchoTexto);
      const altoBloque = Math.max(img ? 32 : 0, 6 + titulo.length * 5.4 + concepto.length * 4.6 + 4);
      salto(altoBloque + 6);

      if (img) { try { doc.addImage(img, "JPEG", M, y, 22, 29); } catch {} }
      doc.setFont("helvetica", "bold").setFontSize(9).setTextColor(...rgb);
      doc.text(`${f.dia} ${f.num} de septiembre  ·  ${MARCAS[p.marca].nombre}  ·  ${p.formato}`, xTexto, y + 3.5);
      doc.setFontSize(12.5).setTextColor(...PDF_COLORES.ink);
      doc.text(titulo, xTexto, y + 10);
      doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(...PDF_COLORES.suave);
      doc.text(concepto, xTexto, y + 11 + titulo.length * 5.4);
      y += altoBloque;
      doc.setDrawColor(231, 225, 214).setLineWidth(0.25).line(M, y, W - M, y);
      y += 6;
    }
    y += 4;
  }

  // Cierre y firma
  salto(46);
  doc.setFillColor(243, 239, 232).roundedRect(M, y, ANCHO, 18, 3, 3, "F");
  doc.setFont("helvetica", "bold").setFontSize(10.5).setTextColor(...PDF_COLORES.ink);
  doc.text("¿Todo listo? Responde por WhatsApp: \"Aprobado para que los realices\"", M + 6, y + 8);
  doc.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(...PDF_COLORES.suave);
  doc.text("— o indícanos los ajustes pieza por pieza.", M + 6, y + 13.5);
  y += 30;
  doc.setFontSize(10.5).setTextColor(...PDF_COLORES.suave);
  doc.text("Aprobado por: ________________________", M, y);
  doc.text("Fecha: ________________", W - M, y, { align: "right" });

  // Pie de página
  const paginas = doc.getNumberOfPages();
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...PDF_COLORES.dim);
    doc.text(`Contenido Hub · ${MES.titulo}`, M, 290);
    doc.text(`Página ${i} de ${paginas}`, W - M, 290, { align: "right" });
  }
  return doc;
}

async function exportarPdf() {
  if (!window.jspdf) {
    alert("El generador de PDF no cargó. Revisa tu conexión e intenta recargar la página.");
    return;
  }
  const doc = construirPdf();
  const filename = `contenidos-${MES.clave}.pdf`;
  if (window.claude && typeof window.claude.use === "function") {
    try {
      const dl = await window.claude.use("downloads");
      if (dl) { await dl.save({ filename, data: doc.output("arraybuffer") }); return; }
      alert("Aquí el visor aún no permite descargas. Abre la plataforma desde el enlace público o el archivo local y el PDF se descargará directo.");
      return;
    } catch (e) {
      if (e && (e.code === "declined" || e.code === "rate_limited")) return;
      // cualquier otro error: intentamos la descarga directa
    }
  }
  doc.save(filename);
}

// ---------- Portadas (subir imagen) ----------
const fileInput = document.createElement("input");
fileInput.type = "file";
fileInput.accept = "image/*";
fileInput.hidden = true;
document.body.appendChild(fileInput);
let portadaTarget = null;

function pedirPortada(id) {
  portadaTarget = id;
  fileInput.value = "";
  fileInput.click();
}
fileInput.onchange = async () => {
  const file = fileInput.files[0];
  if (!file || !portadaTarget) return;
  try {
    const uri = await comprimirImagen(file);
    store.portadas[portadaTarget] = uri;
    marcarPendiente();
    save();
    renderAll({ keep: true });
    if (piezaAbierta && piezaAbierta.id === portadaTarget) {
      (drawerModo === "publicar" ? openPublicar : openDrawer)(portadaTarget);
    }
  } catch (e) {
    alert("No se pudo procesar la imagen. Intenta con otra foto.");
  }
};
function comprimirImagen(file, maxH = 640) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxH / img.height);
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL("image/jpeg", 0.74));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// ---------- Drawer ----------
const drawer = document.getElementById("drawer");
const backdrop = document.getElementById("drawerBackdrop");
let piezaAbierta = null;
let drawerModo = "pieza"; // "pieza" | "publicar" — qué hoja reabrir tras subir portada

// El panel se centra frente al último clic: siempre queda ante tus ojos,
// funcione la página con scroll propio o dentro del visor de claude.ai.
let ultimoClickY = 0;
document.addEventListener("pointerdown", e => { ultimoClickY = e.pageY; }, { passive: true, capture: true });

function posicionarDrawer() {
  const alto = Math.min(720, Math.max(360, Math.round(window.innerHeight * 0.78)));
  const centro = ultimoClickY || (window.scrollY + window.innerHeight / 2);
  const maxTop = Math.max(12, document.documentElement.scrollHeight - alto - 16);
  let top = centro - alto / 2;
  top = Math.max(window.scrollY + 12, Math.min(top, maxTop));
  drawer.style.top = Math.round(top) + "px";
}

function openDrawer(id) {
  if (MODO_CLIENTE) return openDrawerCliente(id);
  const p = PIEZAS.find(x => x.id === id);
  if (!p) return;
  piezaAbierta = p;
  drawerModo = "pieza";
  const m = MARCAS[p.marca];
  const { dia, num } = fmtFecha(fechaDe(p));
  const est = estadoDe(p);
  const checks = checksDe(p);
  const a = aprobDe(p);
  const img = portadaDe(p);

  drawer.innerHTML = `
    <button class="close-btn" id="drawerClose" aria-label="Cerrar">✕</button>
    <span class="chip brand" style="--brand-color:${m.color};--brand-tint:${brandTint(p)}">${m.nombre} · ${m.handle}</span>
    <h2>${esc(tituloDe(p))}</h2>
    <div class="sub">${dia} ${num} de septiembre · ${p.formato}${p.reencauche ? " · Reencauche" : ""}${editadaDe(p) ? " · Editada" : ""}</div>
    <div class="tag-row">
      <span class="chip">${esc(p.mensaje)}</span>
      <span class="chip">${esc(p.tono)}</span>
      ${a.v === "Aprobado" ? `<span class="chip aprobado">✓ Aprobado${a.por ? ` por ${esc(a.por)}` : ""}</span>` : ""}
      ${a.v === "Ajustar" ? `<span class="chip ajustar">${a.por ? esc(a.por) : "Mercadeo GM"} pide ajustes</span>` : ""}
    </div>

    <section>
      <h4>Portada para el feed</h4>
      <div class="portada-box">
        ${coverHtml(p, "cover-prev")}
        <div class="portada-acts">
          <button class="btn-ghost" id="btnPortada">${img ? "Cambiar portada" : "Subir portada"}</button>
          ${img ? `<button class="btn-ghost" id="btnQuitarPortada">Quitar</button>` : ""}
          <span class="portada-hint">Se muestra en la vista Feed tal como quedaría en Instagram.</span>
        </div>
      </div>
    </section>

    <section>
      <h4>Estado</h4>
      <div class="estado-select">
        ${ESTADOS.map(e => `<button data-estado="${e}" class="${e === est ? "sel " + ESTADO_CLASS[e] : ""}">${e}</button>`).join("")}
      </div>
      <button class="btn-programar" id="btnIrPublicar" style="margin-top:10px">📤 Preparar y programar en Meta</button>
    </section>

    <section>
      <h4>Contenido · edítalo y fusiona tus ideas</h4>
      <input id="editTitulo" class="edit-input" value="${esc(tituloDe(p))}" placeholder="Título de la pieza">
      <textarea id="editCopy" class="aprob-comment" style="min-height:120px;margin-top:8px">${esc(copyDe(p))}</textarea>
      ${editadaDe(p) ? `<button class="link-btn" id="btnRestaurar" style="margin-top:6px">Restablecer versión original</button>` : ""}
    </section>

    <section>
      <h4>Fecha de publicación</h4>
      <select id="selFecha" class="edit-input">
        ${fechasDelMes().map(f => {
          const d = fmtFecha(f);
          const fest = FESTIVOS_CO[f];
          return `<option value="${f}" ${f === fechaDe(p) ? "selected" : ""}>${d.dia} ${d.num} de ${MES_NOMBRE}${fest ? ` · ${fest.n}` : ""}</option>`;
        }).join("")}
      </select>
    </section>

    <section>
      <h4>Aprobación de mercadeo</h4>
      <div class="aprob-pills">
        ${APROB.map(v => `<button data-aprob="${v}" class="${a.v === v ? "sel" : ""}" data-v="${v}">${v === "Aprobado" ? ICOL.ok + " " : v === "Ajustar" ? ICOL.ajuste + " " : ""}${v}</button>`).join("")}
      </div>
      <textarea class="aprob-comment" id="drawerComment" placeholder="Comentario para David (opcional)…" style="margin-top:10px">${esc(a.c || "")}</textarea>
    </section>

    <section>
      <h4>Checklist de producción</h4>
      ${p.checklist.map((c, i) => `
        <label class="check-item">
          <input type="checkbox" data-check="${i}" ${checks.includes(i) ? "checked" : ""}>
          <span>${esc(c)}</span>
        </label>`).join("")}
    </section>

    <section>
      <h4>Equipo</h4>
      <ul class="gear-list">${p.gear.map(g => `<li>${esc(g)}</li>`).join("")}</ul>
    </section>

    <section>
      <h4>Referencias visuales</h4>
      <div class="ref-links">
        ${p.refs.map(r => `<a href="${r.url}" target="_blank" rel="noopener">↗ ${esc(r.label)}</a>`).join("")}
      </div>
      <a class="notion-link" href="${p.notion}" target="_blank" rel="noopener">Abrir en Notion →</a>
    </section>`;

  if (!drawer.classList.contains("open")) posicionarDrawer(); // al refrescar (cambiar estado) se queda donde está
  drawer.classList.add("open");
  backdrop.classList.add("open");

  drawer.querySelector("#drawerClose").onclick = closeDrawer;
  drawer.querySelector("#btnPortada").onclick = () => pedirPortada(p.id);
  drawer.querySelector("#btnIrPublicar").onclick = () => openPublicar(p.id);

  // Edición de contenido
  const inTit = drawer.querySelector("#editTitulo");
  const inCopy = drawer.querySelector("#editCopy");
  function guardarEdicion() {
    const e = { ...(store.ediciones[p.id] || {}) };
    const t = inTit.value.trim(), c = inCopy.value.trim();
    if (t && t !== p.titulo) e.titulo = t; else delete e.titulo;
    if (c && c !== p.copy) e.copy = c; else delete e.copy;
    if (Object.keys(e).length) store.ediciones[p.id] = e; else delete store.ediciones[p.id];
    save();
    emitirContenido({ tipo: "edicion", id: p.id, e: store.ediciones[p.id] || null });
    renderAll();
  }
  inTit.onchange = guardarEdicion;
  inCopy.onchange = guardarEdicion;
  const btnRest = drawer.querySelector("#btnRestaurar");
  if (btnRest) btnRest.onclick = () => { delete store.ediciones[p.id]; save(); emitirContenido({ tipo: "edicion", id: p.id, e: null }); renderAll(); openDrawer(p.id); };

  // Cambio de fecha (alternativa táctil al arrastre)
  drawer.querySelector("#selFecha").onchange = e => { moverPieza(p.id, e.target.value); openDrawer(p.id); };
  const quitar = drawer.querySelector("#btnQuitarPortada");
  if (quitar) quitar.onclick = () => { delete store.portadas[p.id]; marcarPendiente(); save(); renderAll({ keep: true }); openDrawer(p.id); };
  drawer.querySelectorAll("[data-estado]").forEach(b => {
    b.onclick = () => {
      store.estados[p.id] = b.dataset.estado;
      save();
      emitirContenido({ tipo: "estado", id: p.id, v: b.dataset.estado });
      openDrawer(p.id);
      renderAll({ keep: true });
    };
  });
  drawer.querySelectorAll("[data-aprob]").forEach(b => {
    b.onclick = () => {
      store.aprob[p.id] = { ...aprobDe(p), v: b.dataset.aprob };
      save();
      openDrawer(p.id);
      renderAll({ keep: true });
    };
  });
  const ta = drawer.querySelector("#drawerComment");
  ta.oninput = () => { store.aprob[p.id] = { ...aprobDe(p), c: ta.value }; };
  ta.onchange = () => save();
  drawer.querySelectorAll("[data-check]").forEach(cb => {
    cb.onchange = () => {
      const i = Number(cb.dataset.check);
      const set = new Set(checksDe(p));
      cb.checked ? set.add(i) : set.delete(i);
      store.checks[p.id] = [...set];
      save();
    };
  });
}
// Tarjeta simple para el cliente: concepto, formato y referencias — cero jerga
function openDrawerCliente(id) {
  const p = PIEZAS.find(x => x.id === id);
  if (!p) return;
  piezaAbierta = p;
  const m = MARCAS[p.marca];
  const { dia, num } = fmtFecha(fechaDe(p));
  const a = aprobDe(p);
  const img = portadaDe(p);
  const FORMATO_DESC = {
    "Reel": "Video corto vertical",
    "Foto": "Fotografía para el feed",
    "Carrusel": "Publicación de varias imágenes deslizables",
    "Pieza gráfica": "Diseño gráfico para el feed",
    "Historia": "Historia de 24 horas",
  };

  drawer.innerHTML = `
    <button class="close-btn" id="drawerClose" aria-label="Cerrar">✕</button>
    <span class="chip brand" style="--brand-color:${m.color};--brand-tint:${brandTint(p)}">${m.nombre} · ${m.handle}</span>
    <h2>${esc(tituloDe(p))}</h2>
    <div class="sub">Se publica el ${dia.toLowerCase()} ${num} de septiembre</div>
    <div class="tag-row">
      <span class="chip">${FORMATO_ICONO[p.formato] || "🎬"} ${p.formato} · ${FORMATO_DESC[p.formato] || ""}</span>
      <span class="chip estado ${ESTADO_CLASS[estadoDe(p)]}">${estadoDe(p)}</span>
    </div>

    <section>
      <h4>${img ? "Así se verá en el feed" : "Referencia visual del estilo"}</h4>
      ${coverHtml(p, "cover-drawer")}
    </section>

    <section>
      <h4>De qué trata</h4>
      <div class="copy-text">${esc(conceptoDe(p))}</div>
    </section>

    <section>
      <h4>Referencias del estilo (toca para ver ejemplos)</h4>
      <div class="ref-links">
        ${p.refs.map(r => `<a href="${r.url}" target="_blank" rel="noopener">↗ ${esc(r.label)}</a>`).join("")}
      </div>
    </section>

    <section>
      <h4>Tu aprobación</h4>
      <div class="aprob-pills">
        ${APROB.map(v => `<button data-aprob="${v}" class="${a.v === v ? "sel" : ""}" data-v="${v}">${v === "Aprobado" ? "✓ " : ""}${v}</button>`).join("")}
      </div>
      <div style="margin-top:10px; display:flex; flex-direction:column; gap:8px">${bloqueComentario(p)}</div>
    </section>`;

  if (!drawer.classList.contains("open")) posicionarDrawer();
  drawer.classList.add("open");
  backdrop.classList.add("open");

  drawer.querySelector("#drawerClose").onclick = closeDrawer;
  drawer.querySelectorAll("[data-aprob]").forEach(b => {
    b.onclick = () => {
      store.aprob[p.id] = { ...aprobDe(p), v: b.dataset.aprob };
      save();
      notiAprobacion(p, b.dataset.aprob);
      emitirDato(p);
      openDrawerCliente(p.id);
      renderAll();
    };
  });
  conectarComentario(drawer, p, () => { openDrawerCliente(p.id); renderAll(); });
}

// ---------- Programar en Meta Business Suite ----------
// Meta no deja precargar el compositor desde otra página sin conectar su API,
// así que la hoja deja TODO listo en dos toques: copy copiado al portapapeles,
// portada descargada y el compositor abierto con tu sesión ya iniciada.
const META_COMPOSER = "https://business.facebook.com/latest/composer";
const META_PLANNER = "https://business.facebook.com/latest/planner";
function dataUriABytes(uri) {
  const b64 = uri.split(",")[1];
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}
async function descargarPortada(p) {
  const uri = portadaDe(p) || null;
  if (!uri) return;
  const filename = `portada-${p.id}.jpg`;
  if (EN_ARTIFACT) {
    try {
      const dl = await window.claude.use("downloads");
      if (dl) { await dl.save({ filename, data: dataUriABytes(uri) }); return; }
    } catch { return; }
  }
  const a = document.createElement("a");
  a.href = uri; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
}
function openPublicar(id) {
  const p = PIEZAS.find(x => x.id === id);
  if (!p || MODO_CLIENTE) return;
  piezaAbierta = p;
  drawerModo = "publicar";
  const m = MARCAS[p.marca];
  const { dia, num } = fmtFecha(fechaDe(p));
  const img = portadaDe(p);
  const est = estadoDe(p);

  drawer.innerHTML = `
    <button class="close-btn" id="drawerClose" aria-label="Cerrar">✕</button>
    <span class="chip brand" style="--brand-color:${m.color};--brand-tint:${brandTint(p)}">${m.nombre} · ${m.handle}</span>
    <h2>Programar publicación</h2>
    <div class="sub">${esc(tituloDe(p))} · ${p.formato}</div>

    <section class="pub-paso">
      <h4><span class="paso-num">1</span> Portada</h4>
      <div class="portada-box">
        ${coverHtml(p, "cover-prev")}
        <div class="portada-acts">
          <button class="btn-ghost" id="pubPortada">${img ? "Cambiar" : "Subir portada"}</button>
          ${img ? `<button class="btn-primary" id="pubDescargar">⬇️ Descargar para subirla a Meta</button>` : `<span class="portada-hint">Sube la portada final para poder descargarla y usarla en Meta.</span>`}
        </div>
      </div>
    </section>

    <section class="pub-paso">
      <h4><span class="paso-num">2</span> Copy final</h4>
      <textarea id="pubCopy" class="aprob-comment" style="min-height:130px">${esc(copyDe(p))}</textarea>
      <button class="btn-primary" id="pubCopiar" style="margin-top:8px">📋 Copiar copy</button>
    </section>

    <section class="pub-paso">
      <h4><span class="paso-num">3</span> Fecha y hora</h4>
      <div class="pub-fecha-hora">
        <select id="pubFecha" class="edit-input">
          ${fechasDelMes().map(f => {
            const d = fmtFecha(f);
            return `<option value="${f}" ${f === fechaDe(p) ? "selected" : ""}>${d.dia} ${d.num} de ${MES_NOMBRE}</option>`;
          }).join("")}
        </select>
        <input type="time" id="pubHora" class="edit-input" value="${horaDe(p)}">
      </div>
    </section>

    <section class="pub-paso pub-auto">
      <h4><span class="paso-num auto">🤖</span> Programación automática</h4>
      <p class="pub-nota">Con Meta conectado en tu Mac, la plataforma publica por ti: <b>Facebook queda agendado en Meta de una vez</b> y la de <b>Instagram sale a la hora exacta</b> (el Mac debe estar encendido a esa hora; si está dormido, sale al despertar). Recuerda <b>Guardar cambios</b> para que el Mac reciba la cola.</p>
      <label class="auto-check">
        <input type="checkbox" id="pubAuto" ${metaDe(p) && metaDe(p).auto ? "checked" : ""}>
        <span>Programar automáticamente esta pieza</span>
      </label>
      <div class="aprob-pills pub-redes" id="pubRed" ${metaDe(p) && metaDe(p).auto ? "" : "hidden"}>
        ${["ig", "fb", "ambas"].map(r => `<button data-red="${r}" class="${(metaDe(p) || {}).red === r ? "sel" : ""}">${r === "ig" ? "Instagram" : r === "fb" ? "Facebook" : "Ambas"}</button>`).join("")}
      </div>
      ${!img ? `<p class="pub-aviso" ${metaDe(p) && metaDe(p).auto ? "" : "hidden"} id="pubAvisoImg">⚠️ Instagram necesita la portada subida (paso 1) — sin portada solo saldrá en Facebook.</p>` : ""}
    </section>

    <section class="pub-paso">
      <h4><span class="paso-num">4</span> …o hazlo manual en Meta</h4>
      <p class="pub-nota">Tu cuenta ya está abierta en Meta Business Suite. Con el copy copiado y la portada descargada: <b>pega, sube la imagen y elige ${dia.toLowerCase()} ${num} a las ${horaDe(p)}</b>.</p>
      <div class="pub-meta-btns">
        <a class="btn-meta" id="pubMeta" href="${META_COMPOSER}" target="_blank" rel="noopener">🚀 Abrir compositor de Meta</a>
        <a class="btn-ghost" href="${META_PLANNER}" target="_blank" rel="noopener">🗓 Ver calendario de Meta</a>
      </div>
    </section>

    <section class="pub-paso">
      <h4><span class="paso-num">5</span> Confirma aquí</h4>
      <div class="aprob-pills">
        <button id="pubMarcarProg" class="${est === "Programado" ? "sel" : ""}">🕑 Quedó programada</button>
        <button id="pubMarcarPub" class="${est === "Publicado" ? "sel" : ""}">🚀 Ya está publicada</button>
      </div>
    </section>`;

  if (!drawer.classList.contains("open")) posicionarDrawer();
  drawer.classList.add("open");
  backdrop.classList.add("open");
  drawer.querySelector("#drawerClose").onclick = closeDrawer;
  drawer.querySelector("#pubPortada").onclick = () => pedirPortada(p.id);
  const bDesc = drawer.querySelector("#pubDescargar");
  if (bDesc) bDesc.onclick = () => { descargarPortada(p); bDesc.textContent = "⬇️ Descargada ✓"; };
  const taCopy = drawer.querySelector("#pubCopy");
  taCopy.onchange = () => {
    const e = { ...(store.ediciones[p.id] || {}) };
    const c = taCopy.value.trim();
    if (c && c !== p.copy) e.copy = c; else delete e.copy;
    if (Object.keys(e).length) store.ediciones[p.id] = e; else delete store.ediciones[p.id];
    save();
    emitirContenido({ tipo: "edicion", id: p.id, e: store.ediciones[p.id] || null });
    actualizarMeta(p);
  };
  drawer.querySelector("#pubCopiar").onclick = async function () {
    try {
      await navigator.clipboard.writeText(taCopy.value.trim());
      this.textContent = "📋 Copiado ✓ — pégalo en Meta";
    } catch {
      taCopy.focus(); taCopy.select();
      this.textContent = "Selecciona y copia con ⌘C";
    }
  };
  drawer.querySelector("#pubFecha").onchange = e => { moverPieza(p.id, e.target.value); actualizarMeta(p); openPublicar(p.id); };
  drawer.querySelector("#pubHora").onchange = e => {
    store.horas[p.id] = e.target.value || "18:00";
    actualizarMeta(p);
    marcarPendiente(); save(); renderAll({ keep: true });
  };
  // Programación automática: entra o sale de la cola que lee el Mac
  const cbAuto = drawer.querySelector("#pubAuto");
  cbAuto.onchange = () => {
    if (cbAuto.checked) {
      store.meta[p.id] = {
        auto: true, red: (metaDe(p) || {}).red || "ambas",
        copy: copyDe(p), fecha: fechaDe(p), hora: horaDe(p),
        titulo: tituloDe(p), marca: p.marca, ts: Date.now(),
      };
      if (estadoDe(p) !== "Programado" && estadoDe(p) !== "Publicado") store.estados[p.id] = "Programado";
      emitirContenido({ tipo: "estado", id: p.id, v: store.estados[p.id] || estadoDe(p) });
    } else {
      delete store.meta[p.id];
    }
    marcarPendiente(); save(); renderAll();
    openPublicar(p.id);
  };
  drawer.querySelectorAll("#pubRed button").forEach(b => {
    b.onclick = () => {
      if (!store.meta[p.id]) return;
      store.meta[p.id].red = b.dataset.red;
      actualizarMeta(p);
      drawer.querySelectorAll("#pubRed button").forEach(x => x.classList.toggle("sel", x === b));
    };
  });
  drawer.querySelector("#pubMarcarProg").onclick = () => { moverEstado(p.id, "Programado"); openPublicar(p.id); };
  drawer.querySelector("#pubMarcarPub").onclick = () => { moverEstado(p.id, "Publicado"); closeDrawer(); toastVivo(`🚀 ${tituloDe(p)} marcada como publicada`); };
}

// ---------- Crear contenido nuevo (solo David) + ideas ----------
function abrirCreador(fecha) {
  const { dia, num } = fmtFecha(fecha);
  const marcaIni = marcaActiva !== "todas" ? marcaActiva : "forestal";
  drawer.innerHTML = `
    <button class="close-btn" id="drawerClose" aria-label="Cerrar">✕</button>
    <h2>Nuevo contenido</h2>
    <div class="sub">Se publicará el ${dia.toLowerCase()} ${num} de septiembre</div>
    <section>
      <h4>Marca</h4>
      <div class="aprob-pills" id="creadorMarca">
        <button data-mk="forestal" class="${marcaIni === "forestal" ? "sel" : ""}">Café Forestal</button>
        <button data-mk="manzanares" class="${marcaIni === "manzanares" ? "sel" : ""}">Carnes Manzanares</button>
      </div>
    </section>
    <section>
      <h4>Idea</h4>
      <input id="creadorTitulo" class="edit-input" placeholder="Título del contenido">
      <textarea id="creadorConcepto" class="aprob-comment" style="margin-top:8px;min-height:90px" placeholder="Concepto: de qué va, qué se ve, cuál es el gancho…"></textarea>
      <button class="btn-ghost" id="creadorIdea" style="margin-top:8px">✨ Sugerir idea</button>
    </section>
    <section>
      <h4>Formato</h4>
      <select id="creadorFormato" class="edit-input">
        ${["Reel", "Foto", "Carrusel", "Pieza gráfica", "Historia"].map(f => `<option>${f}</option>`).join("")}
      </select>
    </section>
    <button class="btn-primary" id="creadorGuardar" style="width:100%">Agregar al calendario</button>`;

  if (!drawer.classList.contains("open")) posicionarDrawer();
  drawer.classList.add("open");
  backdrop.classList.add("open");
  drawer.querySelector("#drawerClose").onclick = closeDrawer;

  let mk = marcaIni;
  let ideaMeta = null;
  drawer.querySelectorAll("#creadorMarca button").forEach(b => {
    b.onclick = () => {
      mk = b.dataset.mk;
      drawer.querySelectorAll("#creadorMarca button").forEach(x => x.classList.toggle("sel", x === b));
    };
  });
  drawer.querySelector("#creadorIdea").onclick = () => {
    const idea = generarIdea(mk);
    ideaMeta = idea;
    drawer.querySelector("#creadorTitulo").value = idea.t;
    drawer.querySelector("#creadorConcepto").value = idea.c;
    drawer.querySelector("#creadorFormato").value = idea.f;
  };
  drawer.querySelector("#creadorGuardar").onclick = () => {
    const titulo = drawer.querySelector("#creadorTitulo").value.trim();
    if (!titulo) { drawer.querySelector("#creadorTitulo").focus(); return; }
    const nueva = {
      id: "n-" + Date.now().toString(36),
      marca: mk, fecha: fecha, titulo,
      concepto: drawer.querySelector("#creadorConcepto").value.trim() || titulo,
      formato: drawer.querySelector("#creadorFormato").value,
      mensaje: ideaMeta ? ideaMeta.m : (mk === "forestal" ? "Experiencia en tienda" : "Cortes y productos"),
      tono: ideaMeta ? ideaMeta.tn : "Emocional",
    };
    store.nuevas.push(nueva);
    hidratarNuevas();
    save();
    emitirContenido({ tipo: "nueva", pieza: nueva });
    closeDrawer();
    renderAll();
    toastVivo(`➕ Agregado al ${num} de septiembre: ${titulo}`);
  };
}

// Panel de contenidos quitados: recuperar en un toque
function abrirQuitados() {
  const ocultas = PIEZAS.filter(p => store.ocultas[p.id]);
  drawer.innerHTML = `
    <button class="close-btn" id="drawerClose" aria-label="Cerrar">✕</button>
    <h2>Contenidos quitados</h2>
    <div class="sub">Recupera cualquiera con un toque</div>
    ${ocultas.map(p => `
      <div class="quitado-fila">
        <span class="chip brand" style="--brand-color:${brandColor(p)};--brand-tint:${brandTint(p)}">${MARCAS[p.marca].nombre}</span>
        <span class="quitado-titulo">${esc(tituloDe(p))}</span>
        <button class="btn-ghost" data-restaurar="${p.id}">↩ Restaurar</button>
      </div>`).join("") || `<p class="sub">No hay contenidos quitados.</p>`}`;
  if (!drawer.classList.contains("open")) posicionarDrawer();
  drawer.classList.add("open");
  backdrop.classList.add("open");
  drawer.querySelector("#drawerClose").onclick = closeDrawer;
  drawer.querySelectorAll("[data-restaurar]").forEach(b => {
    b.onclick = () => {
      delete store.ocultas[b.dataset.restaurar];
      save();
      emitirContenido({ tipo: "ocultar", id: b.dataset.restaurar, oculta: false });
      renderAll();
      if (Object.keys(store.ocultas).length) abrirQuitados(); else closeDrawer();
    };
  });
}

function closeDrawer() {
  drawer.classList.remove("open");
  backdrop.classList.remove("open");
  piezaAbierta = null;
}
backdrop.addEventListener("click", closeDrawer);
document.addEventListener("keydown", e => { if (e.key === "Escape") closeDrawer(); });

// clic en tarjetas y casillas del feed
document.getElementById("main").addEventListener("click", e => {
  const pr = e.target.closest("[data-programar]");
  if (pr) { e.stopPropagation(); openPublicar(pr.dataset.programar); return; }
  const q = e.target.closest("[data-quitar]");
  if (q) { e.stopPropagation(); quitarPieza(q.dataset.quitar); return; }
  const card = e.target.closest(".piece, .cell, .chip-pieza, .flujo-item");
  if (card) openDrawer(card.dataset.id);
});

// ---------- Navegación (gestos estilo iOS entre secciones) ----------
let vistaActiva = MODO_CLIENTE ? "aprobacion" : "calendario";
const VISTAS_ORDEN = MODO_CLIENTE
  ? ["aprobacion", "pipeline"]
  : ["calendario", "pipeline", "rodaje", "feed", "historias", "aprobacion", "finanzas", "proyectos", "referentes"];
function activarVista(v, dir) {
  vistaActiva = v;
  document.querySelectorAll("#tabs button").forEach(x => x.classList.toggle("active", x.dataset.view === v));
  document.querySelectorAll(".view").forEach(x => x.classList.remove("active", "entra-izq", "entra-der"));
  const el = document.getElementById("view-" + v);
  if (el) {
    el.classList.add("active");
    if (dir) {
      void el.offsetWidth; // reinicia la animación
      el.classList.add(dir > 0 ? "entra-izq" : "entra-der");
    }
  }
  // La pestaña activa siempre visible en la barra (en celular la barra se desliza)
  const tabAct = document.querySelector(`#tabs button[data-view="${v}"]`);
  if (tabAct && tabAct.scrollIntoView) tabAct.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  saveUI();
}
// Deslizar como en iOS: un vistazo a la izquierda o derecha cambia de sección.
function cambiarVista(dir) {
  const i = VISTAS_ORDEN.indexOf(vistaActiva);
  const destino = VISTAS_ORDEN[i + dir];
  if (!destino) return;
  activarVista(destino, dir);
}
// Zonas que se desplazan horizontalmente por su cuenta (no roban el gesto),
// más las tarjetas (su deslizado izquierdo ya significa "quitar").
const NO_SWIPE = ".ref-rail, .mas-rail, .pipeline, .cal-mes-wrap, .cal-cols, .flujo-cols, .hoja-wrap, .fin-tabla-wrap, .phone-grid, .piece, .drawer, .pro-tipos";
const mainEl = document.getElementById("main");
let swX = 0, swY = 0, swOk = false;
mainEl.addEventListener("touchstart", e => {
  if (e.touches.length !== 1) { swOk = false; return; }
  const t = e.touches[0];
  swX = t.clientX; swY = t.clientY;
  swOk = !e.target.closest(NO_SWIPE);
}, { passive: true });
mainEl.addEventListener("touchend", e => {
  if (!swOk) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - swX, dy = t.clientY - swY;
  if (Math.abs(dx) > 72 && Math.abs(dy) < 64) cambiarVista(dx < 0 ? 1 : -1);
}, { passive: true });
// En la MacBook: dos dedos hacia los lados en el trackpad cambian de sección
let wAcum = 0, wLock = 0, wTimer = null;
window.addEventListener("wheel", e => {
  if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) * 1.2) { wAcum = 0; return; }
  if (e.target.closest(NO_SWIPE)) return;
  e.preventDefault(); // evita el gesto de "atrás" del navegador
  const now = performance.now();
  if (now < wLock) return;
  wAcum += e.deltaX;
  clearTimeout(wTimer);
  wTimer = setTimeout(() => { wAcum = 0; }, 260);
  if (Math.abs(wAcum) > 130) {
    cambiarVista(wAcum > 0 ? 1 : -1);
    wAcum = 0;
    wLock = now + 650;
  }
}, { passive: false });
document.getElementById("brandSwitch").addEventListener("click", e => {
  const b = e.target.closest("button");
  if (!b) return;
  marcaActiva = b.dataset.brand;
  hidratarNuevas();
document.body.dataset.marca = marcaActiva;
  document.querySelectorAll("#brandSwitch button").forEach(x => x.classList.toggle("active", x === b));
  renderAll({ keep: true });
  saveUI();
});
document.getElementById("tabs").addEventListener("click", e => {
  const b = e.target.closest("button");
  if (!b) return;
  activarVista(b.dataset.view);
});

// ---------- Restaurar interfaz tras recargas de sincronización ----------
function saveUI() {
  try {
    sessionStorage.setItem(UI_KEY, JSON.stringify({ tab: vistaActiva, marca: marcaActiva, scroll: window.scrollY }));
  } catch {}
}
function restoreUI() {
  let ui = null;
  try { ui = JSON.parse(sessionStorage.getItem(UI_KEY)); } catch {}
  if (!ui) return;
  if (ui.marca && MARCAS[ui.marca] || ui.marca === "todas") {
    marcaActiva = ui.marca;
    document.body.dataset.marca = marcaActiva;
    document.querySelectorAll("#brandSwitch button").forEach(x => x.classList.toggle("active", x.dataset.brand === marcaActiva));
  }
  if (ui.tab && document.getElementById("view-" + ui.tab)) activarVista(ui.tab);
  if (ui.scroll) requestAnimationFrame(() => window.scrollTo(0, ui.scroll));
}
window.addEventListener("pagehide", saveUI);
window.addEventListener("scroll", () => { clearTimeout(window.__uiT); window.__uiT = setTimeout(saveUI, 300); }, { passive: true });

// ---------- Export / reset ----------
document.getElementById("btnExport").onclick = async () => {
  const data = PIEZAS.map(p => ({
    marca: MARCAS[p.marca].nombre, fecha: fechaDe(p), pieza: tituloDe(p),
    copy: copyDe(p), estado: estadoDe(p), aprobacion: aprobDe(p),
    checklist: p.checklist.map((c, i) => ({ tarea: c, hecha: checksDe(p).includes(i) })),
  }));
  const payload = JSON.stringify({ mes: MES.titulo, exportado: new Date().toISOString(), piezas: data }, null, 2);
  const filename = `contenido-hub-${MES.clave}.json`;
  if (window.claude && typeof window.claude.use === "function") {
    try {
      const dl = await window.claude.use("downloads");
      if (dl) { await dl.save({ filename, data: payload }); return; }
    } catch { return; }
  }
  const blob = new Blob([payload], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
};
document.getElementById("btnReset").onclick = () => {
  if (confirm("¿Reiniciar estados, checklists, aprobaciones, portadas, fechas y ediciones al valor original del calendario?")) {
    store = { estados: {}, checks: {}, aprob: {}, portadas: {}, fechas: {}, ediciones: {}, orden: {}, pdf: {}, ocultas: {}, nuevas: [], notis: [], pubTs: store.pubTs || 0, pendientePub: false };
    marcarPendiente();
    save();
    renderAll({ keep: true });
  }
};

// ════════════════════════════════════════════════════════════
// FINANZAS — cuentas + hoja de cálculo (privado: vive SOLO en
// este dispositivo, nunca viaja con "Guardar cambios" ni al repo)
// ════════════════════════════════════════════════════════════
const FIN_KEY = "contenidoHub.finanzas";
const PRO_KEY = "contenidoHub.proyectos";
function cargarLocal(k, def) {
  try { const v = JSON.parse(localStorage.getItem(k)); return v && typeof v === "object" ? v : def; } catch { return def; }
}
let finz = cargarLocal(FIN_KEY, null) || {
  cuentas: [
    { id: "c1", nombre: "Café Forestal", rol: "Dirección de arte y contenido", ingreso: 0, gastos: 0 },
    { id: "c2", nombre: "Carnes Manzanares", rol: "Dirección de arte y contenido", ingreso: 0, gastos: 0 },
  ],
  celdas: {},
};
let pros = cargarLocal(PRO_KEY, null) || { lista: [] };
function guardarFin() { try { localStorage.setItem(FIN_KEY, JSON.stringify(finz)); } catch {} }
function guardarPro() { try { localStorage.setItem(PRO_KEY, JSON.stringify(pros)); } catch {} }

// Números al estilo colombiano: acepta "1.200.000", "1,5", "$ 850.000"
function parseNum(v) {
  if (typeof v === "number") return v;
  let t = String(v).trim().replace(/[$\s]/g, "");
  if (!t || !/^-?[\d.,]+$/.test(t)) return NaN;
  const coma = t.lastIndexOf(","), punto = t.lastIndexOf(".");
  if (coma > punto) t = t.replace(/\./g, "").replace(",", ".");
  else if (punto > -1 && coma > -1) t = t.replace(/,/g, "");
  else if ((t.match(/\./g) || []).length > 1 || /\.\d{3}$/.test(t)) t = t.replace(/\./g, "");
  return Number(t);
}
const nfCO = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
const nfCO2 = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });
function fmtMoney(n) { return (n < 0 ? "-$ " : "$ ") + nfCO.format(Math.abs(Math.round(n || 0))); }
function fmtCell(v) { return v == null ? "" : typeof v === "number" ? nfCO2.format(v) : String(v); }

// --- Mini motor de fórmulas (como Excel): =B2+B3, =SUMA(A1:A6), =PROMEDIO, =MAX, =MIN ---
const HOJA_COLS = ["A", "B", "C", "D", "E", "F"];
const HOJA_FILAS = 14;
function rangoRefs(a, b) {
  const ma = a.match(/^([A-F])(\d+)$/), mb = b.match(/^([A-F])(\d+)$/);
  if (!ma || !mb) return [];
  const c0 = Math.min(HOJA_COLS.indexOf(ma[1]), HOJA_COLS.indexOf(mb[1]));
  const c1 = Math.max(HOJA_COLS.indexOf(ma[1]), HOJA_COLS.indexOf(mb[1]));
  const f0 = Math.min(+ma[2], +mb[2]), f1 = Math.max(+ma[2], +mb[2]);
  const out = [];
  for (let c = c0; c <= c1; c++) for (let f = f0; f <= f1; f++) out.push(HOJA_COLS[c] + f);
  return out;
}
function valorCelda(ref, visitando = new Set()) {
  ref = ref.toUpperCase();
  const raw = finz.celdas[ref];
  if (raw == null || String(raw).trim() === "") return null;
  const s = String(raw).trim();
  if (s[0] === "=") {
    if (visitando.has(ref)) return "#CIRC";
    visitando.add(ref);
    const v = evalFormula(s, visitando);
    visitando.delete(ref);
    return v;
  }
  const n = parseNum(s);
  return isNaN(n) ? s : n;
}
function evalFormula(f, visitando) {
  let expr = f.slice(1).toUpperCase().replace(/\s+/g, "");
  expr = expr.replace(/(SUMA|SUM|PROMEDIO|AVG|MAX|MIN)\(([A-F]\d{1,2}):([A-F]\d{1,2})\)/g, (m, fn, a, b) => {
    const vals = rangoRefs(a, b).map(r => valorCelda(r, visitando)).filter(v => typeof v === "number");
    if (!vals.length) return "(0)";
    const suma = vals.reduce((x, y) => x + y, 0);
    if (fn === "SUMA" || fn === "SUM") return "(" + suma + ")";
    if (fn === "PROMEDIO" || fn === "AVG") return "(" + suma / vals.length + ")";
    return "(" + (fn === "MAX" ? Math.max(...vals) : Math.min(...vals)) + ")";
  });
  let err = null;
  expr = expr.replace(/[A-F]\d{1,2}/g, r => {
    const v = valorCelda(r, visitando);
    if (v === "#CIRC") { err = "#CIRC"; return "0"; }
    return typeof v === "number" ? "(" + v + ")" : "(0)";
  });
  if (err) return err;
  expr = expr.replace(/,/g, "."); // decimales escritos con coma
  if (!/^[\d+\-*/().]*$/.test(expr)) return "#ERROR";
  try {
    const v = Function('"use strict";return(' + expr + ")")();
    return typeof v === "number" && isFinite(v) ? v : "#ERROR";
  } catch { return "#ERROR"; }
}

function renderFinanzas() {
  const el = document.getElementById("view-finanzas");
  if (!el || MODO_CLIENTE) return;
  // No pisar lo que David esté escribiendo si llega una sincronización
  if (el.contains(document.activeElement)) return;

  const tIngreso = finz.cuentas.reduce((s, c) => s + (parseNum(c.ingreso) || 0), 0);
  const tGastos = finz.cuentas.reduce((s, c) => s + (parseNum(c.gastos) || 0), 0);
  const neto = tIngreso - tGastos;

  el.innerHTML = `
    <p class="view-note">Tus cuentas y tu dinero, con claridad total. <b>🔒 Privado:</b> esta sección vive solo en este dispositivo — no se publica al equipo ni viaja con "Guardar cambios".</p>

    <div class="fin-resumen">
      <div class="fin-card"><span class="fin-lbl">Ingreso mensual</span><span class="fin-num">${fmtMoney(tIngreso)}</span></div>
      <div class="fin-card"><span class="fin-lbl">Gastos</span><span class="fin-num">${fmtMoney(tGastos)}</span></div>
      <div class="fin-card destacada"><span class="fin-lbl">Neto del mes</span><span class="fin-num">${fmtMoney(neto)}</span></div>
      <div class="fin-card"><span class="fin-lbl">Proyección anual</span><span class="fin-num">${fmtMoney(neto * 12)}</span></div>
    </div>

    <div class="fin-panel">
      <div class="fin-panel-head"><h3>Mis cuentas</h3><button class="btn-primary" id="finAgregar">＋ Agregar cuenta</button></div>
      <div class="fin-tabla-wrap"><table class="fin-tabla">
        <thead><tr><th>Cuenta</th><th>Qué hago</th><th>Ingreso / mes</th><th>Gastos / mes</th><th>Neto</th><th></th></tr></thead>
        <tbody>
          ${finz.cuentas.map(c => {
            const n = (parseNum(c.ingreso) || 0) - (parseNum(c.gastos) || 0);
            return `<tr data-cta="${c.id}">
              <td><input class="celda" data-campo="nombre" value="${esc(c.nombre)}" placeholder="Nombre de la cuenta"></td>
              <td><input class="celda" data-campo="rol" value="${esc(c.rol || "")}" placeholder="Funciones que haces"></td>
              <td><input class="celda num" data-campo="ingreso" inputmode="decimal" value="${c.ingreso ? nfCO.format(parseNum(c.ingreso) || 0) : ""}" placeholder="0"></td>
              <td><input class="celda num" data-campo="gastos" inputmode="decimal" value="${c.gastos ? nfCO.format(parseNum(c.gastos) || 0) : ""}" placeholder="0"></td>
              <td class="fin-neto ${n < 0 ? "rojo" : ""}">${fmtMoney(n)}</td>
              <td><button class="fin-borrar" data-borrar="${c.id}" title="Eliminar cuenta">✕</button></td>
            </tr>`;
          }).join("")}
        </tbody>
        <tfoot><tr><td>Total</td><td></td><td>${fmtMoney(tIngreso)}</td><td>${fmtMoney(tGastos)}</td><td class="fin-neto ${neto < 0 ? "rojo" : ""}">${fmtMoney(neto)}</td><td></td></tr></tfoot>
      </table></div>
    </div>

    <div class="fin-panel">
      <div class="fin-panel-head">
        <h3>Hoja de cálculo</h3>
        <span class="fin-hint">Como en Excel: escribe <b>=B2+B3</b>, <b>=SUMA(C1:C6)</b>, <b>=PROMEDIO(A1:A4)</b>, <b>=MAX</b>, <b>=MIN</b>. Toca una celda para ver o editar su fórmula.</span>
      </div>
      <div class="hoja-wrap"><table class="hoja">
        <thead><tr><th></th>${HOJA_COLS.map(c => `<th>${c}</th>`).join("")}</tr></thead>
        <tbody>
          ${Array.from({ length: HOJA_FILAS }, (_, i) => {
            const f = i + 1;
            return `<tr><th>${f}</th>${HOJA_COLS.map(c => {
              const ref = c + f;
              const v = valorCelda(ref);
              const esFormula = String(finz.celdas[ref] || "")[0] === "=";
              return `<td><input class="hoja-celda ${esFormula ? "formula" : ""} ${typeof v === "number" ? "num" : ""} ${v === "#ERROR" || v === "#CIRC" ? "error" : ""}"
                data-ref="${ref}" value="${esc(fmtCell(v))}" spellcheck="false"></td>`;
            }).join("")}</tr>`;
          }).join("")}
        </tbody>
      </table></div>
      <div class="fin-hoja-pie">
        <button class="btn-ghost" id="finLimpiarHoja">Limpiar hoja</button>
        <button class="btn-ghost" id="finExportar">⬇️ Respaldar finanzas (JSON)</button>
      </div>
    </div>`;

  // Cuentas: edición en línea
  el.querySelectorAll("tr[data-cta] .celda").forEach(inp => {
    inp.onchange = () => {
      const c = finz.cuentas.find(x => x.id === inp.closest("tr").dataset.cta);
      if (!c) return;
      const campo = inp.dataset.campo;
      c[campo] = campo === "ingreso" || campo === "gastos" ? (parseNum(inp.value) || 0) : inp.value.trim();
      guardarFin();
      renderFinanzas();
    };
  });
  el.querySelectorAll("[data-borrar]").forEach(b => {
    b.onclick = () => {
      const c = finz.cuentas.find(x => x.id === b.dataset.borrar);
      if (!confirm(`¿Eliminar la cuenta "${c ? c.nombre : ""}"?`)) return;
      finz.cuentas = finz.cuentas.filter(x => x.id !== b.dataset.borrar);
      guardarFin();
      renderFinanzas();
    };
  });
  el.querySelector("#finAgregar").onclick = () => {
    finz.cuentas.push({ id: "c" + Date.now().toString(36), nombre: "", rol: "", ingreso: 0, gastos: 0 });
    guardarFin();
    renderFinanzas();
    const fila = el.querySelector("tbody tr:last-child .celda");
    if (fila) fila.focus();
  };

  // Hoja: al enfocar se ve la fórmula cruda; al salir, el resultado
  el.querySelectorAll(".hoja-celda").forEach(inp => {
    inp.onfocus = () => { inp.value = finz.celdas[inp.dataset.ref] || ""; inp.select(); };
    inp.onblur = () => {
      const ref = inp.dataset.ref;
      const nuevo = inp.value.trim();
      const previo = finz.celdas[ref] || "";
      if (nuevo === String(previo)) { inp.value = esc0(fmtCell(valorCelda(ref))); return; }
      if (nuevo) finz.celdas[ref] = nuevo; else delete finz.celdas[ref];
      guardarFin();
      renderFinanzas();
    };
    inp.onkeydown = e => {
      if (e.key === "Enter") { e.preventDefault(); inp.blur(); }
      if (e.key === "Escape") { inp.value = finz.celdas[inp.dataset.ref] || ""; inp.blur(); }
    };
  });
  el.querySelector("#finLimpiarHoja").onclick = () => {
    if (confirm("¿Vaciar todas las celdas de la hoja de cálculo?")) { finz.celdas = {}; guardarFin(); renderFinanzas(); }
  };
  el.querySelector("#finExportar").onclick = async () => {
    const payload = JSON.stringify({ exportado: new Date().toISOString(), finanzas: finz, proyectos: pros }, null, 2);
    const filename = "finanzas-proyectos-respaldo.json";
    if (EN_ARTIFACT) {
      try { const dl = await window.claude.use("downloads"); if (dl) { await dl.save({ filename, data: payload }); return; } } catch { return; }
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    a.download = filename; a.click();
  };
}
function esc0(s) { return s; } // los values de la hoja ya vienen formateados

// ════════════════════════════════════════════════════════════
// PROYECTOS — de la idea a la entrega en 4 semanas, sin bloqueo
// (privado: vive solo en este dispositivo)
// ════════════════════════════════════════════════════════════
const PLANTILLAS_PRO = {
  musica: { n: "Música", ico: "🎵", desc: "De la idea a la canción publicada", fases: [
    { n: "Semana 1 · Visión y referencias", tareas: ["Definir la idea central en una frase", "Armar playlist de 5 referencias", "Elegir BPM, tonalidad y mood", "Bocetar la estructura (intro · verso · coro)"] },
    { n: "Semana 2 · Maqueta", tareas: ["Producir el beat o la armonía base", "Grabar melodías guía", "Escribir la letra completa", "Maqueta de principio a fin (aunque sea fea)"] },
    { n: "Semana 3 · Producción fina", tareas: ["Grabar las tomas definitivas", "Editar y afinar voces", "Sumar arreglos y transiciones", "Mezcla v1 · escucharla en 3 equipos distintos"] },
    { n: "Semana 4 · Cierre y salida", tareas: ["Ajustes finales de mezcla", "Master", "Portada y piezas visuales", "Publicar, distribuir y compartir"] },
  ]},
  diseno: { n: "Diseño", ico: "🎨", desc: "Proyectos de marca y dirección de arte", fases: [
    { n: "Semana 1 · Brief e investigación", tareas: ["Escribir el brief en una página", "Moodboard y referencias por lámina", "Benchmark de la competencia", "Definir el concepto creativo"] },
    { n: "Semana 2 · Propuestas", tareas: ["Explorar 3 rutas visuales rápidas", "Elegir la ruta ganadora", "Desarrollar la propuesta elegida", "Contrastarla contra el brief"] },
    { n: "Semana 3 · Desarrollo", tareas: ["Aplicar el feedback", "Desarrollar piezas y variantes", "Afinar tipografía, ritmo y color", "Preparar artes finales"] },
    { n: "Semana 4 · Entrega", tareas: ["Exportar en todos los formatos", "Armar la presentación de entrega", "Entregar y archivar ordenado", "Retro: qué repetir y qué mejorar"] },
  ]},
  personal: { n: "Personal", ico: "🌱", desc: "Metas propias con método y sin presión", fases: [
    { n: "Semana 1 · Claridad", tareas: ["Escribir la meta y el porqué", "Definir cómo se ve \"logrado\"", "Partirla en pasos pequeños", "Agendar los bloques en el calendario"] },
    { n: "Semana 2 · Arranque", tareas: ["Completar el primer paso", "Eliminar un obstáculo del camino", "Registrar el avance", "Ajustar el plan si algo no fluye"] },
    { n: "Semana 3 · Constancia", tareas: ["Mantener el ritmo: 3+ sesiones", "Pedir feedback o apoyo", "Celebrar un avance visible", "Revisar qué falta para cerrar"] },
    { n: "Semana 4 · Cierre", tareas: ["Completar lo esencial", "Evaluar el resultado contra la meta", "Documentar los aprendizajes", "Elegir el siguiente proyecto"] },
  ]},
};
function sumarDias(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}
function fmtCorta(iso) {
  const { dia, num } = fmtFecha(iso);
  const mes = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"][Number(iso.slice(5, 7)) - 1];
  return `${dia.toLowerCase().slice(0, 3)} ${num} ${mes}`;
}
function progresoDe(pr) {
  const t = PLANTILLAS_PRO[pr.tipo];
  let total = 0, hechas = 0;
  t.fases.forEach((f, fi) => f.tareas.forEach((_, ti) => { total++; if (pr.hecho[fi + "-" + ti]) hechas++; }));
  return { total, hechas, pct: total ? hechas / total : 0 };
}
function siguienteAccion(pr) {
  const t = PLANTILLAS_PRO[pr.tipo];
  for (let fi = 0; fi < t.fases.length; fi++)
    for (let ti = 0; ti < t.fases[fi].tareas.length; ti++)
      if (!pr.hecho[fi + "-" + ti]) return { fase: fi, texto: t.fases[fi].tareas[ti] };
  return null;
}
function anillo(pct, size = 48) {
  const r = (size - 7) / 2, c = 2 * Math.PI * r;
  return `<svg class="anillo" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="rgba(33,28,22,.1)" stroke-width="5"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--accent)" stroke-width="5" stroke-linecap="round"
      stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c * (1 - pct)).toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})" style="transition:stroke-dashoffset .4s cubic-bezier(.32,.72,.28,1)"/>
    <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="${size / 4.4}" font-weight="700" fill="var(--ink)">${Math.round(pct * 100)}%</text>
  </svg>`;
}
function renderProyectos() {
  const el = document.getElementById("view-proyectos");
  if (!el || MODO_CLIENTE) return;
  if (el.contains(document.activeElement)) return;

  el.innerHTML = `
    <p class="view-note">Cualquier proyecto — música, diseño o personal — <b>de la idea a la entrega en 4 semanas</b>. Cada plantilla trae la metodología lista: solo marca la siguiente acción y avanza. 🔒 Privado en este dispositivo.</p>
    <div class="pro-grid">
      <button class="pro-nueva" id="proNueva">
        <span class="pro-nueva-mas">＋</span>
        <span>Nuevo proyecto</span>
        <span class="pro-nueva-sub">Elige plantilla y arranca hoy</span>
      </button>
      ${pros.lista.map(pr => {
        const t = PLANTILLAS_PRO[pr.tipo];
        const prog = progresoDe(pr);
        const sig = siguienteAccion(pr);
        const entrega = sumarDias(pr.inicio, 27);
        const quedan = Math.ceil((new Date(entrega) - new Date(hoyISO())) / 86400000);
        return `
        <article class="pro-card ${prog.pct >= 1 ? "lograda" : ""}" data-pro="${pr.id}">
          <div class="pro-card-top">
            <span class="pro-ico">${t.ico}</span>
            <div class="pro-card-tit">
              <h4>${esc(pr.nombre)}</h4>
              <span class="pro-tipo">${t.n}${pr.desc ? " · " + esc(pr.desc) : ""}</span>
            </div>
            ${anillo(prog.pct)}
          </div>
          ${prog.pct >= 1
            ? `<div class="pro-sig hecho">🏆 Proyecto completado — ¡a celebrarlo!</div>`
            : sig
            ? `<div class="pro-sig"><span class="pro-sig-lbl">Siguiente acción</span>${esc(sig.texto)}</div>`
            : ""}
          <div class="pro-pie">
            <span>${prog.hechas}/${prog.total} tareas</span>
            <span>${quedan > 0 ? `Entrega ${fmtCorta(entrega)} · quedan ${quedan} día${quedan === 1 ? "" : "s"}` : prog.pct >= 1 ? "Cerrado" : `Entrega vencida (${fmtCorta(entrega)})`}</span>
          </div>
        </article>`;
      }).join("")}
    </div>`;

  el.querySelector("#proNueva").onclick = abrirCreadorProyecto;
  el.querySelectorAll("[data-pro]").forEach(card => { card.onclick = () => openProyecto(card.dataset.pro); });
}
function abrirCreadorProyecto() {
  drawer.innerHTML = `
    <button class="close-btn" id="drawerClose" aria-label="Cerrar">✕</button>
    <h2>Nuevo proyecto</h2>
    <div class="sub">Arranca hoy · entrega en 4 semanas</div>
    <section>
      <h4>Tipo de proyecto</h4>
      <div class="pro-tipos" id="proTipos">
        ${Object.entries(PLANTILLAS_PRO).map(([k, t], i) => `
          <button data-tipo="${k}" class="${i === 1 ? "sel" : ""}">
            <span class="pro-ico">${t.ico}</span><b>${t.n}</b><span>${t.desc}</span>
          </button>`).join("")}
      </div>
    </section>
    <section>
      <h4>Nombre</h4>
      <input id="proNombre" class="edit-input" placeholder="Ej: EP de 3 canciones, Marca Enzo & Ríos…">
      <textarea id="proDesc" class="aprob-comment" style="margin-top:8px;min-height:70px" placeholder="En una frase: ¿qué quieres lograr? (opcional)"></textarea>
    </section>
    <button class="btn-primary" id="proCrear" style="width:100%">Crear proyecto</button>`;
  if (!drawer.classList.contains("open")) posicionarDrawer();
  drawer.classList.add("open");
  backdrop.classList.add("open");
  drawer.querySelector("#drawerClose").onclick = closeDrawer;
  let tipo = "diseno";
  drawer.querySelectorAll("#proTipos button").forEach(b => {
    b.onclick = () => { tipo = b.dataset.tipo; drawer.querySelectorAll("#proTipos button").forEach(x => x.classList.toggle("sel", x === b)); };
  });
  drawer.querySelector("#proCrear").onclick = () => {
    const nombre = drawer.querySelector("#proNombre").value.trim();
    if (!nombre) { drawer.querySelector("#proNombre").focus(); return; }
    const pr = { id: "p" + Date.now().toString(36), nombre, tipo, desc: drawer.querySelector("#proDesc").value.trim(), inicio: hoyISO(), hecho: {}, notas: "" };
    pros.lista.unshift(pr);
    guardarPro();
    closeDrawer();
    renderProyectos();
    openProyecto(pr.id);
  };
}
function openProyecto(id) {
  const pr = pros.lista.find(x => x.id === id);
  if (!pr) return;
  const t = PLANTILLAS_PRO[pr.tipo];
  const prog = progresoDe(pr);
  const sig = siguienteAccion(pr);
  const semanaHoy = Math.min(3, Math.max(0, Math.floor((new Date(hoyISO()) - new Date(pr.inicio)) / (7 * 86400000))));

  drawer.innerHTML = `
    <button class="close-btn" id="drawerClose" aria-label="Cerrar">✕</button>
    <div class="pro-drawer-top">
      <span class="pro-ico grande">${t.ico}</span>
      <div style="flex:1">
        <h2 style="margin:0">${esc(pr.nombre)}</h2>
        <div class="sub" style="margin:2px 0 0">${t.n} · inició ${fmtCorta(pr.inicio)} · entrega ${fmtCorta(sumarDias(pr.inicio, 27))}</div>
      </div>
      ${anillo(prog.pct, 56)}
    </div>
    ${sig ? `<div class="pro-sig" style="margin-top:14px"><span class="pro-sig-lbl">Siguiente acción</span>${esc(sig.texto)}</div>` : `<div class="pro-sig hecho" style="margin-top:14px">🏆 Todas las tareas completadas</div>`}
    ${t.fases.map((f, fi) => {
      const hechasFase = f.tareas.filter((_, ti) => pr.hecho[fi + "-" + ti]).length;
      return `
      <section class="pro-fase ${fi === semanaHoy ? "actual" : ""}">
        <h4>${esc(f.n)} ${fi === semanaHoy ? `<span class="chip-semana">Esta semana</span>` : ""} <span class="pro-fase-n">${hechasFase}/${f.tareas.length}</span></h4>
        ${f.tareas.map((tarea, ti) => `
          <label class="check-item">
            <input type="checkbox" data-tarea="${fi}-${ti}" ${pr.hecho[fi + "-" + ti] ? "checked" : ""}>
            <span>${esc(tarea)}</span>
          </label>`).join("")}
      </section>`;
    }).join("")}
    <section>
      <h4>Notas del proyecto</h4>
      <textarea id="proNotas" class="aprob-comment" style="min-height:90px" placeholder="Ideas, enlaces, decisiones…">${esc(pr.notas || "")}</textarea>
    </section>
    <button class="link-btn" id="proEliminar" style="color:#B23A2E">Eliminar proyecto</button>`;

  if (!drawer.classList.contains("open")) posicionarDrawer();
  drawer.classList.add("open");
  backdrop.classList.add("open");
  drawer.querySelector("#drawerClose").onclick = closeDrawer;
  drawer.querySelectorAll("[data-tarea]").forEach(cb => {
    cb.onchange = () => {
      if (cb.checked) pr.hecho[cb.dataset.tarea] = true; else delete pr.hecho[cb.dataset.tarea];
      guardarPro();
      openProyecto(id);
      renderProyectos();
    };
  });
  drawer.querySelector("#proNotas").onchange = e => { pr.notas = e.target.value; guardarPro(); };
  drawer.querySelector("#proEliminar").onclick = () => {
    if (!confirm(`¿Eliminar "${pr.nombre}" y todo su avance?`)) return;
    pros.lista = pros.lista.filter(x => x.id !== id);
    guardarPro();
    closeDrawer();
    renderProyectos();
  };
}

// ════════════════════════════════════════════════════════════
// HISTORIAS — organización semanal para que las cuentas nunca
// se queden apagadas. El plan viaja con "Guardar cambios".
// ════════════════════════════════════════════════════════════
// Plan base por día de la semana (0=Lunes … 6=Domingo)
const HISTORIAS_BASE = {
  forestal: [
    ["☀️ El primer café del día — buenos días desde la tienda"],
    ["🎬 Detrás de cámaras: tostión o barismo en proceso"],
    ["🔁 Reencauche: el post del día compartido a historias"],
    ["📊 Encuesta: ¿método favorito? ¿origen favorito?"],
    ["🛍 Producto + antojo: bolsa de café con precio y CTA"],
    ["👥 La gente: equipo, clientes o finca"],
    ["❓ Pregunta abierta o recap de la semana"],
  ],
  manzanares: [
    ["☀️ Apertura: la vitrina lista a primera hora"],
    ["🎬 El oficio: corte o maduración en proceso"],
    ["🔁 Reencauche: el post del día compartido a historias"],
    ["📊 Encuesta: ¿término favorito? ¿corte del finde?"],
    ["🛍 El corte del fin de semana con precio y CTA"],
    ["👥 El parche del asado: clientes y equipo"],
    ["❓ Pregunta o tip rápido del parrillero"],
  ],
};
const IDEAS_HISTORIA = {
  forestal: ["🎵 Trend de audio con el vapor del espresso", "⏳ Cuenta regresiva a un lanzamiento", "🆚 Este o este: dos métodos de preparación", "📦 Unboxing de café recién tostado", "🌡 El termómetro de la tostión en vivo", "🙋 Repost de historias de clientes"],
  manzanares: ["🎵 Trend de audio con el sellado en plancha", "⏳ Cuenta regresiva al fin de semana de asado", "🆚 Este o este: dos cortes frente a frente", "📦 Así empacamos tu pedido", "🔪 El afilado de la mañana", "🙋 Repost de historias de clientes asando"],
};
function historiasStore() {
  if (!store.historias) {
    store.historias = {
      plan: {
        forestal: HISTORIAS_BASE.forestal.map(d => d.slice()),
        manzanares: HISTORIAS_BASE.manzanares.map(d => d.slice()),
      },
      hechas: {}, extras: {},
    };
  }
  return store.historias;
}
let histSemana = 0; // desplazamiento de semanas respecto a la actual
function lunesDe(offsetSemanas) {
  const hoy = new Date();
  const lunes = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - ((hoy.getDay() + 6) % 7) + offsetSemanas * 7);
  return lunes;
}
function isoDe(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function historiasDeDia(marca, fechaIso, dow) {
  const h = historiasStore();
  const plan = (h.plan[marca] && h.plan[marca][dow]) || [];
  const extras = h.extras[fechaIso + "|" + marca] || [];
  return plan.map(txt => ({ txt, extra: false })).concat(extras.map(txt => ({ txt, extra: true })));
}
function histKey(fechaIso, marca, txt) { return fechaIso + "|" + marca + "|" + txt; }
function rachaDe(marca) {
  const h = historiasStore();
  let racha = 0;
  for (let i = 0; i < 60; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const iso = isoDe(d), dow = (d.getDay() + 6) % 7;
    const alguna = historiasDeDia(marca, iso, dow).some(it => h.hechas[histKey(iso, marca, it.txt)]);
    if (alguna) racha++;
    else if (i === 0) continue; // hoy aún puede completarse sin romper la racha
    else break;
  }
  return racha;
}
function renderHistorias() {
  const el = document.getElementById("view-historias");
  if (!el || MODO_CLIENTE) return;
  if (el.contains(document.activeElement)) return;
  const h = historiasStore();
  const lunes = lunesDe(histSemana);
  const hoy = hoyISO();
  const marcas = marcaActiva === "todas" ? ["forestal", "manzanares"] : [marcaActiva];
  const nombresDia = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  const fechas = Array.from({ length: 7 }, (_, i) => { const d = new Date(lunes); d.setDate(lunes.getDate() + i); return d; });
  const rango = `${fechas[0].getDate()} ${["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"][fechas[0].getMonth()]} – ${fechas[6].getDate()} ${["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"][fechas[6].getMonth()]}`;

  let html = `
    <p class="view-note">El plan semanal de historias: <b>que ninguna cuenta pase un día apagada</b>. Marca cada historia al publicarla desde el celular — la racha cuenta los días seguidos con al menos una historia al aire.</p>
    <div class="hist-barra">
      <div class="hist-nav">
        <button class="hist-flecha" id="histAntes" aria-label="Semana anterior">‹</button>
        <span class="hist-rango">${histSemana === 0 ? "Esta semana" : histSemana === 1 ? "Próxima semana" : histSemana === -1 ? "Semana pasada" : rango} · <span class="hist-rango-fechas">${rango}</span></span>
        <button class="hist-flecha" id="histDespues" aria-label="Semana siguiente">›</button>
      </div>
      <div class="hist-rachas">
        ${marcas.map(mk => `<span class="hist-racha" style="--brand-color:${MARCAS[mk].color}">🔥 ${MARCAS[mk].nombre}: <b>${rachaDe(mk)}</b> día${rachaDe(mk) === 1 ? "" : "s"} seguidos</span>`).join("")}
        <button class="btn-restaurar" id="histEditar">✏️ Editar plan semanal</button>
      </div>
    </div>`;

  for (const mk of marcas) {
    const m = MARCAS[mk];
    const diasCubiertos = fechas.filter((d, i) => historiasDeDia(mk, isoDe(d), i).some(it => h.hechas[histKey(isoDe(d), mk, it.txt)])).length;
    html += `
      <div class="hist-marca" style="--brand-color:${m.color}">
        <div class="hist-marca-head">
          <span class="chip brand" style="--brand-color:${m.color};--brand-tint:${mk === "forestal" ? "var(--forestal-tint)" : "var(--manzanares-tint)"}">${m.nombre} · ${m.handle}</span>
          <span class="hist-cobertura">${diasCubiertos}/7 días con historias esta semana</span>
        </div>
        <div class="hist-grid">
          ${fechas.map((d, i) => {
            const iso = isoDe(d);
            const items = historiasDeDia(mk, iso, i);
            const hechasDia = items.filter(it => h.hechas[histKey(iso, mk, it.txt)]).length;
            const esHoy = iso === hoy;
            const pasado = iso < hoy;
            return `
              <div class="hist-dia ${esHoy ? "hoy" : ""} ${pasado && !hechasDia && items.length ? "apagado" : ""}">
                <div class="hist-dia-head">
                  <span class="hist-dia-nombre">${nombresDia[i].slice(0, 3)} ${d.getDate()}</span>
                  ${esHoy ? `<span class="today-chip">Hoy</span>` : ""}
                  <span class="hist-dia-n ${items.length && hechasDia >= items.length ? "full" : ""}">${hechasDia}/${items.length}</span>
                </div>
                ${items.map(it => {
                  const k = histKey(iso, mk, it.txt);
                  return `
                  <label class="hist-item ${h.hechas[k] ? "hecha" : ""}">
                    <input type="checkbox" data-hist="${esc(k)}" ${h.hechas[k] ? "checked" : ""}>
                    <span>${esc(it.txt)}</span>
                    ${it.extra ? `<button class="hist-quitar" data-quitar-extra="${esc(iso + "|" + mk)}" data-txt="${esc(it.txt)}" title="Quitar">✕</button>` : ""}
                  </label>`;
                }).join("")}
                <button class="hist-mas" data-extra="${iso}|${mk}" title="Agregar historia a este día">+</button>
              </div>`;
          }).join("")}
        </div>
      </div>`;
  }
  el.innerHTML = html;

  el.querySelector("#histAntes").onclick = () => { histSemana--; renderHistorias(); };
  el.querySelector("#histDespues").onclick = () => { histSemana++; renderHistorias(); };
  el.querySelector("#histEditar").onclick = abrirEditorHistorias;
  el.querySelectorAll("[data-hist]").forEach(cb => {
    cb.onchange = () => {
      if (cb.checked) h.hechas[cb.dataset.hist] = true; else delete h.hechas[cb.dataset.hist];
      marcarPendiente(); save(); renderHistorias();
    };
  });
  el.querySelectorAll("[data-extra]").forEach(b => {
    b.onclick = () => {
      const [iso, mk] = b.dataset.extra.split("|");
      const banco = IDEAS_HISTORIA[mk] || [];
      const sugerencia = banco[Math.floor(Math.random() * banco.length)] || "";
      const txt = prompt(`Historia extra para ${MARCAS[mk].nombre} el ${iso.slice(8)}/${iso.slice(5, 7)}\n💡 Idea: ${sugerencia}\n\nEscribe la historia (o deja la idea sugerida):`, sugerencia);
      if (!txt || !txt.trim()) return;
      const key = iso + "|" + mk;
      (h.extras[key] = h.extras[key] || []).push(txt.trim());
      marcarPendiente(); save(); renderHistorias();
    };
  });
  el.querySelectorAll("[data-quitar-extra]").forEach(b => {
    b.onclick = e => {
      e.preventDefault(); e.stopPropagation();
      const key = b.dataset.quitarExtra;
      h.extras[key] = (h.extras[key] || []).filter(t => t !== b.dataset.txt);
      if (!h.extras[key].length) delete h.extras[key];
      marcarPendiente(); save(); renderHistorias();
    };
  });
}
function abrirEditorHistorias() {
  const h = historiasStore();
  const nombresDia = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  let mk = marcaActiva !== "todas" ? marcaActiva : "forestal";
  function pintar() {
    drawer.innerHTML = `
      <button class="close-btn" id="drawerClose" aria-label="Cerrar">✕</button>
      <h2>Plan semanal de historias</h2>
      <div class="sub">Una historia por línea. Este plan se repite todas las semanas — los cambios aplican desde ya.</div>
      <div class="aprob-pills" id="histEdMarca" style="margin-bottom:16px">
        <button data-mk="forestal" class="${mk === "forestal" ? "sel" : ""}">Café Forestal</button>
        <button data-mk="manzanares" class="${mk === "manzanares" ? "sel" : ""}">Carnes Manzanares</button>
      </div>
      ${nombresDia.map((n, i) => `
        <section style="margin-bottom:14px">
          <h4>${n}</h4>
          <textarea class="aprob-comment hist-ed" data-dow="${i}" style="min-height:52px">${esc((h.plan[mk][i] || []).join("\n"))}</textarea>
        </section>`).join("")}
      <p class="pub-nota">💡 Ideas rápidas: ${(IDEAS_HISTORIA[mk] || []).map(t => esc(t)).join(" · ")}</p>
      <button class="btn-primary" id="histEdGuardar" style="width:100%">Guardar plan</button>`;
    drawer.querySelector("#drawerClose").onclick = closeDrawer;
    drawer.querySelectorAll("#histEdMarca button").forEach(b => {
      b.onclick = () => { guardar(); mk = b.dataset.mk; pintar(); };
    });
    drawer.querySelector("#histEdGuardar").onclick = () => { guardar(); closeDrawer(); renderHistorias(); toastVivo("✅ Plan semanal de historias guardado"); };
  }
  function guardar() {
    drawer.querySelectorAll(".hist-ed").forEach(ta => {
      h.plan[mk][Number(ta.dataset.dow)] = ta.value.split("\n").map(s => s.trim()).filter(Boolean);
    });
    marcarPendiente(); save();
  }
  if (!drawer.classList.contains("open")) posicionarDrawer();
  drawer.classList.add("open");
  backdrop.classList.add("open");
  pintar();
}

// ---------- Init ----------
function renderAll() {
  renderCampanita();
  renderHero();
  renderCalendario();
  renderPipeline();
  renderRodaje();
  renderFeed();
  renderHistorias();
  renderAprobacion();
  renderFinanzas();
  renderProyectos();
  renderReferentes();
}
// ---------- Candados de acceso (protección básica del navegador) ----------
const CLAVE_DAVID = "Duffel21";
function pedirClaveAcceso({ clave, texto, guardado }) {
  let ok = false;
  try { ok = localStorage.getItem(guardado) === "si"; } catch {}
  if (ok) return;
  const velo = document.createElement("div");
  velo.className = "candado";
  velo.innerHTML = `
    <div class="candado-caja">
      <div class="logo" style="justify-content:center"><span class="logo-dot"></span><span class="logo-text">Contenido<b>Hub</b></span></div>
      <p class="candado-txt">${texto}</p>
      <input type="password" id="claveInput" class="edit-input" placeholder="Clave de acceso" autocomplete="off">
      <button class="btn-primary" id="claveBtn">Entrar</button>
      <p class="candado-error" id="claveError" hidden>Clave incorrecta, inténtalo de nuevo.</p>
    </div>`;
  document.body.appendChild(velo);
  const input = velo.querySelector("#claveInput");
  const probar = () => {
    if (input.value.trim() === clave) {
      try { localStorage.setItem(guardado, "si"); } catch {}
      velo.remove();
    } else {
      velo.querySelector("#claveError").hidden = false;
      input.value = ""; input.focus();
    }
  };
  velo.querySelector("#claveBtn").onclick = probar;
  input.addEventListener("keydown", e => { if (e.key === "Enter") probar(); });
  if (matchMedia("(hover: hover)").matches) setTimeout(() => input.focus(), 100); // sin autofoco en táctil: evita el zoom de iOS
}

document.body.dataset.marca = marcaActiva;
if (MODO_CLIENTE) {
  // Formulario de aprobación para cliente: solo la vista Aprobación
  document.body.classList.add("modo-cliente");
  renderAll();
  activarVista("aprobacion");
  pedirClaveAcceso({
    clave: CLAVE_ACCESO,
    texto: "Acceso <b>Mercadeo GM</b> · escribe la clave para revisar y aprobar los contenidos del mes",
    guardado: "hubAccesoEquipo",
  });
  iniciarTiempoReal();
} else {
  // En el enlace público, la plataforma completa es solo de David
  const esPublico = location.protocol.startsWith("http") && !location.hostname.includes("localhost") && !(window.claude && typeof window.claude.use === "function");
  if (esPublico) pedirClaveAcceso({
    clave: CLAVE_DAVID,
    texto: "Plataforma de trabajo de <b>David</b> · acceso privado. Escribe tu clave para entrar.",
    guardado: "hubAccesoDavid",
  });
  // Botón flotante Guardar cambios: publica portadas, textos, fechas y
  // estados para que el equipo (modo cliente) vea exactamente tu versión.
  const fab = document.createElement("button");
  fab.id = "btnGuardarCambios";
  fab.className = "guardar-fab";
  fab.innerHTML = `<span class="guardar-ico" aria-hidden="true">☁️</span><span class="guardar-txt">Todo guardado</span><span class="guardar-punto" aria-hidden="true"></span>`;
  fab.onclick = publicarCambios;
  document.body.appendChild(fab);
  pintarGuardar();
  restoreUI();
  renderAll();
  iniciarTiempoReal();
}
