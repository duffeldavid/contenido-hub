/* ═══════════════════════════════════════════════════════════
   CONTENIDO LAB — lógica de la plataforma.
   Sin dependencias. Funciona en local (localStorage) y dentro
   del artifact de claude.ai (base de datos compartida entre
   Mac e iPhone + Claude para analizar hooks).
   ═══════════════════════════════════════════════════════════ */
"use strict";

const EN_ARTIFACT = !!(window.claude && typeof window.claude.use === "function");
const LS_KEY = "contenidoLab.v1";
const LS_UI = "contenidoLab.ui";

const PLATAFORMAS = { tiktok: "TikTok", instagram: "Instagram", youtube: "YouTube" };
const FORMATOS = { reel: "Reel", carrusel: "Carrusel", historia: "Historia", largo: "Video largo", foto: "Foto" };
const ESTADOS = [["idea", "Idea"], ["guion", "Guion"], ["grabado", "Grabado"], ["editado", "Editado"], ["programado", "Programado"], ["publicado", "Publicado"]];
const ESTADO_LBL = Object.fromEntries(ESTADOS);
const HOOK_TIPOS = { pregunta: "Pregunta", contrarian: "Contrarian", resultado: "Resultado primero", historia: "Historia", lista: "Lista", dato: "Dato", reto: "Reto / promesa", pov: "POV", error: "Error común", antes: "Antes / después", otro: "Otro" };
const INSPO_ESTADOS = [["por-analizar", "Por analizar"], ["analizado", "Analizado"], ["usado", "Usado"]];
const INSPO_LBL = Object.fromEntries(INSPO_ESTADOS);
const METRICAS = ["views", "likes", "comentarios", "compartidos", "guardados", "retencion", "seguidores"];
const METRICA_LBL = { views: "Views", likes: "Likes", comentarios: "Comentarios", compartidos: "Compartidos", guardados: "Guardados", retencion: "Retención %", seguidores: "Seguidores +" };

/* ───────── Utilidades ───────── */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const uid = p => p + "_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const hoy = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const num = v => { const n = parseFloat(String(v ?? "").replace(",", ".")); return Number.isFinite(n) ? n : 0; };
const fmt = n => {
  n = num(n); const a = Math.abs(n);
  if (a >= 1e6) return (n / 1e6).toFixed(a >= 1e7 ? 0 : 1).replace(/\.0$/, "") + "M";
  if (a >= 1e3) return (n / 1e3).toFixed(a >= 1e4 ? 0 : 1).replace(/\.0$/, "") + "K";
  return String(Math.round(n));
};
const fmtFull = n => new Intl.NumberFormat("es-CO").format(Math.round(num(n)));
const pct = x => (x * 100).toFixed(1).replace(".", ",") + " %";
const trunc = (s, n) => { s = String(s ?? ""); return s.length > n ? s.slice(0, n - 1) + "…" : s; };
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MESES_L = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const DIAS_L = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
function fecha(iso) { if (!iso || !/^\d{4}-\d{2}-\d{2}/.test(iso)) return null; const [y, m, d] = iso.slice(0, 10).split("-").map(Number); return new Date(y, m - 1, d); }
function fmtFecha(iso, conDia) { const f = fecha(iso); if (!f) return "sin fecha"; return (conDia ? DIAS[f.getDay()] + " " : "") + f.getDate() + " " + MESES[f.getMonth()]; }
function isoDesde(dias) { const d = new Date(); d.setDate(d.getDate() - dias); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
function fmtDur(s) { s = Math.round(num(s)); if (!s) return ""; return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
const hue = id => { let h = 0; for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
const porFechaAsc = (a, b) => (a.fecha || "9999") < (b.fecha || "9999") ? -1 : (a.fecha || "9999") > (b.fecha || "9999") ? 1 : 0;
const porFechaDesc = (a, b) => -porFechaAsc(a, b);
function saludo() { const h = new Date().getHours(); return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches"; }
function toast(txt, ms = 2400) { const t = $("#toast"); t.textContent = txt; t.hidden = false; clearTimeout(toast._t); toast._t = setTimeout(() => { t.hidden = true; }, ms); }

/* ───────── Estado ───────── */
function vacio() { return { v: 1, perfil: { nombre: "David", nicho: "", cuentas: [] }, piezas: [], inspiracion: [], seguidores: [], formulas: [] }; }
let store = vacio();
let ui = { vista: "inicio", modo: "lista", fEstado: "todas", fPlat: "todas", q: "", inspoTab: "referentes", iEstado: "todas", iPlat: "todas", iq: "", statsRango: "30", statsPlat: "todas", tema: "auto" };

function normalizar(s) {
  const base = vacio();
  const o = Object.assign(base, s || {});
  o.perfil = Object.assign({ nombre: "David", nicho: "", cuentas: [] }, o.perfil || {});
  o.perfil.cuentas = Array.isArray(o.perfil.cuentas) ? o.perfil.cuentas : [];
  for (const k of ["piezas", "inspiracion", "seguidores", "formulas"]) if (!Array.isArray(o[k])) o[k] = [];
  o.piezas = o.piezas.map(p => Object.assign({ metricas: {} }, p, { metricas: Object.assign({}, p.metricas || {}) }));
  o.inspiracion = o.inspiracion.map(i => Object.assign({ estructura: [], porque: [], variantes: [], etiquetas: [] }, i));
  return o;
}
function ordenar() {
  store.piezas.sort((a, b) => porFechaDesc(a, b) || (b.creado || 0) - (a.creado || 0));
  store.inspiracion.sort((a, b) => (b.creado || 0) - (a.creado || 0));
  store.seguidores.sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
}
function guardarLocal() { try { localStorage.setItem(LS_KEY, JSON.stringify(store)); } catch { /* sin espacio o modo privado */ } }
function cargarLocal() { try { const j = localStorage.getItem(LS_KEY); return j ? normalizar(JSON.parse(j)) : null; } catch { return null; } }
function guardarUI() { try { localStorage.setItem(LS_UI, JSON.stringify(ui)); } catch { } }
function cargarUI() { try { const j = localStorage.getItem(LS_UI); if (j) ui = Object.assign(ui, JSON.parse(j)); } catch { } }

/* ───────── Sincronización (base de datos del artifact) ───────── */
const Sync = { db: null, pendientes: 0, listo: false };
function setSync(estado, txt) {
  const b = $("#syncBadge"), t = $("#syncTxt");
  if (!b) return;
  b.dataset.estado = estado;
  t.textContent = txt || { ok: "Sincronizado en tu cuenta", guardando: "Guardando…", conectando: "Conectando…", error: "Sin conexión con la base", local: "Solo en este navegador" }[estado] || "";
}
async function iniciarSync() {
  if (!EN_ARTIFACT) { setSync("local"); return; }
  setSync("conectando");
  let db = null;
  try { db = await claude.use("db"); } catch { db = null; }
  if (!db) { setSync("local", "Solo en este dispositivo"); return; }
  Sync.db = db;
  const onErr = e => setSync("error", e && e.code === "revoked" ? "Acceso retirado" : "Sin conexión con la base");
  for (const col of ["piezas", "inspiracion"]) {
    db.collection(col).onSnapshot(snap => {
      store[col] = snap.docs.map(d => d.data());
      store = normalizar(store); ordenar(); guardarLocal();
      if (!snap.metadata.fromCache) { Sync.listo = true; if (!Sync.pendientes) setSync("ok"); }
      refrescar();
    }, onErr);
  }
  for (const k of ["perfil", "seguidores", "formulas"]) {
    db.doc("config/" + k).onSnapshot(snap => {
      if (!snap.exists) return;
      const d = snap.data();
      store[k] = k === "perfil" ? Object.assign({ nombre: "David", nicho: "", cuentas: [] }, d) : (d.items || []);
      ordenar(); guardarLocal(); refrescar();
    }, onErr);
  }
}
async function escribir(path, data) {
  if (!Sync.db) return;
  Sync.pendientes++; setSync("guardando");
  try { await Sync.db.doc(path).set(JSON.parse(JSON.stringify(data))); }
  catch (e) { setSync("error", e && e.code === "quota_exceeded" ? "Base llena: borra piezas viejas" : "No se pudo guardar en la base"); Sync.pendientes--; return; }
  Sync.pendientes--; if (!Sync.pendientes) setSync("ok");
}
async function borrarDoc(path) {
  if (!Sync.db) return;
  Sync.pendientes++; setSync("guardando");
  try { await Sync.db.doc(path).delete(); } catch { setSync("error"); Sync.pendientes--; return; }
  Sync.pendientes--; if (!Sync.pendientes) setSync("ok");
}
function guardarConfig(k) { escribir("config/" + k, k === "perfil" ? store.perfil : { items: store[k] }); }

/* ───────── Mutaciones ───────── */
function nuevaPieza(base = {}) {
  return Object.assign({ id: uid("p"), titulo: "", plataforma: "tiktok", formato: "reel", pilar: "", hook: "", hookTipo: "otro", guion: "", cta: "", fecha: "", estado: "idea", duracion: 0, link: "", metricas: {}, notas: "", creado: Date.now(), actualizado: Date.now() }, base);
}
function nuevaInspo(base = {}) {
  return Object.assign({ id: uid("i"), autor: "", plataforma: "tiktok", link: "", nicho: "", views: 0, likes: 0, hook: "", hookTipo: "otro", estado: "por-analizar", guion: "", estructura: [], porque: [], miVersion: "", variantes: [], etiquetas: [], creado: Date.now() }, base);
}
function guardarPieza(p) {
  p.actualizado = Date.now();
  const i = store.piezas.findIndex(x => x.id === p.id);
  if (i < 0) store.piezas.push(p); else store.piezas[i] = p;
  ordenar(); guardarLocal(); escribir("piezas/" + p.id, p);
}
function eliminarPieza(id) { store.piezas = store.piezas.filter(x => x.id !== id); guardarLocal(); borrarDoc("piezas/" + id); }
function guardarInspo(it) {
  const i = store.inspiracion.findIndex(x => x.id === it.id);
  if (i < 0) store.inspiracion.push(it); else store.inspiracion[i] = it;
  ordenar(); guardarLocal(); escribir("inspiracion/" + it.id, it);
}
function eliminarInspo(id) { store.inspiracion = store.inspiracion.filter(x => x.id !== id); guardarLocal(); borrarDoc("inspiracion/" + id); }
function cargarEjemplos() {
  const ids = new Set(store.piezas.map(p => p.id));
  for (const p of EJEMPLOS.piezas) if (!ids.has(p.id)) guardarPieza(JSON.parse(JSON.stringify(p)));
  const iids = new Set(store.inspiracion.map(i => i.id));
  for (const i of EJEMPLOS.inspiracion) if (!iids.has(i.id)) guardarInspo(JSON.parse(JSON.stringify(i)));
  if (!store.seguidores.length) { store.seguidores = JSON.parse(JSON.stringify(EJEMPLOS.seguidores)).map(s => Object.assign(s, { ejemplo: true })); guardarConfig("seguidores"); }
  if (!store.perfil.nicho) { store.perfil.nicho = EJEMPLOS.perfil.nicho; store.perfil.cuentas = JSON.parse(JSON.stringify(EJEMPLOS.perfil.cuentas)); guardarConfig("perfil"); }
  ordenar(); guardarLocal();
}
function borrarEjemplos() {
  for (const p of store.piezas.filter(p => p.ejemplo)) eliminarPieza(p.id);
  for (const i of store.inspiracion.filter(i => i.ejemplo)) eliminarInspo(i.id);
  if (store.seguidores.some(s => s.ejemplo)) { store.seguidores = store.seguidores.filter(s => !s.ejemplo); guardarConfig("seguidores"); }
  guardarLocal();
}
function hayEjemplos() { return store.piezas.some(p => p.ejemplo) || store.inspiracion.some(i => i.ejemplo); }

/* ───────── Cálculos ───────── */
const m = (p, k) => num((p.metricas || {})[k]);
const publicadas = () => store.piezas.filter(p => p.estado === "publicado" && p.fecha);
const suma = (arr, k) => arr.reduce((s, p) => s + m(p, k), 0);
const prom = (arr, f) => arr.length ? arr.reduce((s, p) => s + f(p), 0) / arr.length : 0;
function eng(p) { const v = m(p, "views"); if (!v) return 0; return (m(p, "likes") + m(p, "comentarios") + m(p, "compartidos") + m(p, "guardados")) / v; }
function engPromedio(arr) { const con = arr.filter(p => m(p, "views") > 0); const v = suma(con, "views"); if (!v) return 0; return con.reduce((s, p) => s + m(p, "likes") + m(p, "comentarios") + m(p, "compartidos") + m(p, "guardados"), 0) / v; }
function agrupar(arr, f) { const g = {}; for (const x of arr) { const k = f(x); (g[k] = g[k] || []).push(x); } return g; }
function niceTicks(max, n = 4) {
  if (!(max > 0)) return [0, 1];
  const bruto = max / n, pow = Math.pow(10, Math.floor(Math.log10(bruto)));
  const r = bruto / pow; const paso = (r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10) * pow;
  const t = []; for (let v = 0; v <= max + paso * .999; v += paso) t.push(+v.toFixed(6));
  return t;
}

/* ───────── Gráficas (SVG, un solo eje, marcas finas) ───────── */
const vacioChart = txt => `<div class="vacio" style="padding:26px 12px"><span>${esc(txt || "Sin datos todavía")}</span></div>`;
function chartColumnas(items, { alto = 210, formato = fmt, W = 640 } = {}) {
  const n = items.length; if (!n) return vacioChart();
  const H = alto, padL = 42, padR = 12, padT = 20, padB = 30;
  const vals = items.map(i => i.value), max = Math.max(...vals, 0);
  const ticks = niceTicks(max, 4), top = ticks[ticks.length - 1] || 1;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const band = innerW / n, bw = Math.min(24, Math.max(6, band * .62));
  const y = v => padT + innerH - (v / top) * innerH;
  const grid = ticks.map(t => `<line x1="${padL}" x2="${W - padR}" y1="${y(t)}" y2="${y(t)}"/><text x="${padL - 6}" y="${y(t) + 3.5}" text-anchor="end">${esc(formato(t))}</text>`).join("");
  const maxIdx = vals.indexOf(max);
  const cada = Math.ceil(n / Math.max(3, Math.floor(W / 72)));
  const bars = items.map((it, i) => {
    const x = padL + band * i + (band - bw) / 2, yy = y(it.value), h = Math.max(0, innerH - (yy - padT)), r = Math.min(4, h / 2);
    const path = h > 0 ? `M${x},${yy + r} a${r},${r} 0 0 1 ${r},-${r} h${bw - 2 * r} a${r},${r} 0 0 1 ${r},${r} v${h - r} h-${bw} z` : "";
    const lbl = (i === maxIdx && max > 0) ? `<text class="lbl" x="${x + bw / 2}" y="${yy - 6}" text-anchor="middle">${esc(formato(it.value))}</text>` : "";
    const cat = (i % cada === 0 || n <= 9) ? `<text class="cat" x="${x + bw / 2}" y="${H - padB + 17}" text-anchor="middle">${esc(it.label)}</text>` : "";
    return `<g tabindex="0" data-tip="${esc(it.tip || "")}"><rect class="hit" x="${padL + band * i}" y="${padT}" width="${band}" height="${innerH}"/><path class="mark ${esc(it.clase || "")}" d="${path}"/>${lbl}${cat}</g>`;
  }).join("");
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfica de columnas"><g class="grid">${grid}</g><line class="axis" x1="${padL}" x2="${W - padR}" y1="${y(0)}" y2="${y(0)}"/>${bars}</svg>`;
}
function chartBarras(items, { formato = fmt, sufijo = "", W = 640 } = {}) {
  if (!items.length) return vacioChart();
  const rowH = 30, padL = Math.min(140, Math.round(W * .3)), padR = Math.min(70, Math.round(W * .17)), padT = 6, H = padT + rowH * items.length + 6;
  const max = Math.max(...items.map(i => i.value), 0) || 1, innerW = W - padL - padR;
  const rows = items.map((it, i) => {
    const yy = padT + rowH * i + (rowH - 18) / 2, w = Math.max(2, it.value / max * innerW), r = 4;
    const path = `M${padL},${yy} h${w - r} a${r},${r} 0 0 1 ${r},${r} v${18 - 2 * r} a${r},${r} 0 0 1 -${r},${r} h-${w - r} z`;
    return `<g tabindex="0" data-tip="${esc(it.tip || "")}"><rect class="hit" x="0" y="${padT + rowH * i}" width="${W}" height="${rowH}"/><text class="cat" x="${padL - 10}" y="${yy + 13}" text-anchor="end">${esc(trunc(it.label, Math.max(8, Math.floor(padL / 7))))}</text><path class="mark ${esc(it.clase || "")}" d="${path}"/><text class="lbl" x="${padL + w + 8}" y="${yy + 13}">${esc(formato(it.value))}${esc(sufijo)}</text></g>`;
  }).join("");
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfica de barras"><line class="axis" x1="${padL}" x2="${padL}" y1="${padT}" y2="${H - 6}"/>${rows}</svg>`;
}
function chartLinea(series, { alto = 220, formato = fmt, W = 640 } = {}) {
  const all = series.flatMap(s => s.puntos);
  if (!all.length) return vacioChart("Registra tus seguidores en Más → Seguidores");
  const H = alto, padL = 46, padR = Math.min(62, Math.round(W * .16)), padT = 16, padB = 30;
  const xs = all.map(p => fecha(p.x).getTime()), x0 = Math.min(...xs), x1 = Math.max(...xs);
  const max = Math.max(...all.map(p => p.y), 0), ticks = niceTicks(max, 4), top = ticks[ticks.length - 1] || 1;
  const innerW = W - padL - padR, innerH = H - padT - padB;
  const X = t => x1 === x0 ? padL + innerW / 2 : padL + (t - x0) / (x1 - x0) * innerW;
  const Y = v => padT + innerH - (v / top) * innerH;
  const grid = ticks.map(t => `<line x1="${padL}" x2="${W - padR}" y1="${Y(t)}" y2="${Y(t)}"/><text x="${padL - 6}" y="${Y(t) + 3.5}" text-anchor="end">${esc(formato(t))}</text>`).join("");
  const fechasX = [x0, (x0 + x1) / 2, x1].map((t, i) => `<text class="cat" x="${X(t)}" y="${H - padB + 17}" text-anchor="${i === 0 ? "start" : i === 2 ? "end" : "middle"}">${esc(fmtFecha(new Date(t).toISOString().slice(0, 10)))}</text>`).join("");
  const lineas = series.map(s => {
    const pts = s.puntos.map(p => [X(fecha(p.x).getTime()), Y(p.y)]);
    const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
    const area = series.length === 1 && pts.length > 1 ? `<path class="area" d="${d} L${pts[pts.length - 1][0].toFixed(1)},${Y(0)} L${pts[0][0].toFixed(1)},${Y(0)} z"/>` : "";
    const fin = pts[pts.length - 1], ult = s.puntos[s.puntos.length - 1];
    const dots = s.puntos.map((p, i) => `<circle class="dot ${esc(s.clase || "")}" tabindex="0" data-tip="${esc(s.nombre + " · " + fmtFecha(p.x, true) + ": " + fmtFull(p.y))}" cx="${pts[i][0].toFixed(1)}" cy="${pts[i][1].toFixed(1)}" r="4" style="${s.color ? "fill:" + s.color : ""}"/>`).join("");
    return `${area}<path class="linea" d="${d}" style="${s.color ? "stroke:" + s.color : ""}"/>${dots}<text class="lbl" x="${fin[0] + 9}" y="${fin[1] + 4}">${esc(formato(ult.y))}</text>`;
  }).join("");
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfica de línea"><g class="grid">${grid}</g><line class="axis" x1="${padL}" x2="${W - padR}" y1="${Y(0)}" y2="${Y(0)}"/>${fechasX}${lineas}</svg>`;
}
function sparkline(vals, { W = 320 } = {}) {
  if (vals.length < 2) return "";
  const H = 34, max = Math.max(...vals, 1), n = vals.length;
  const pts = vals.map((v, i) => [i / (n - 1) * (W - 6) + 3, H - 4 - (v / max) * (H - 10)]);
  const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ");
  const ult = pts[n - 1];
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" aria-hidden="true"><path class="a" d="${d} L${ult[0].toFixed(1)},${H} L3,${H} z"/><path class="l" d="${d}"/><circle class="p" cx="${ult[0].toFixed(1)}" cy="${ult[1].toFixed(1)}" r="3"/></svg>`;
}

/* Las gráficas se dibujan al ancho real de su caja (texto legible en el celular) */
const CHARTS = { columnas: chartColumnas, barras: chartBarras, linea: chartLinea, spark: sparkline };
const chartRegistro = new Map(); let chartN = 0;
function chartBox(tipo, datos, opts = {}) { const id = "ch" + (++chartN); chartRegistro.set(id, { tipo, datos, opts }); return `<div class="chart" data-chart="${id}"></div>`; }
function dibujarCharts() {
  for (const el of $$("[data-chart]")) {
    const spec = chartRegistro.get(el.dataset.chart); if (!spec) continue;
    const W = Math.max(240, Math.round(el.clientWidth || 600));
    el.innerHTML = CHARTS[spec.tipo](spec.datos, Object.assign({}, spec.opts, { W }));
  }
}
let redibujoT = null;
window.addEventListener("resize", () => { clearTimeout(redibujoT); redibujoT = setTimeout(dibujarCharts, 150); });
function fmtDelta(d) { return d >= 3 ? (1 + d).toFixed(0) + "×" : pct(Math.abs(d)); }

/* ───────── Piezas de interfaz ───────── */
const pill = (e, lbl) => `<span class="pill e-${esc(e)}">${esc(lbl || ESTADO_LBL[e] || INSPO_LBL[e] || e)}</span>`;
const tagPlat = p => `<span class="tag p-${esc(p)}">${esc(PLATAFORMAS[p] || p)}</span>`;
const tagTxt = t => `<span class="tag">${esc(t)}</span>`;
function cover(p, { arriba = "" } = {}) {
  const hookTxt = p.hook || "";
  const derecha = arriba || (p.duracion ? fmtDur(p.duracion) : (FORMATOS[p.formato] || ""));
  return `<div class="cover" style="--h:${hue(p.id)}"><div class="cover-top"><span class="plat p-${esc(p.plataforma)}"><i></i>${esc(PLATAFORMAS[p.plataforma] || "")}</span><span>${esc(derecha)}</span></div><div class="cover-hook ${hookTxt ? "" : "vacio-hook"}">${esc(hookTxt || "Sin hook todavía")}</div></div>`;
}
function bannerEjemplos() {
  if (!hayEjemplos()) return "";
  return `<div class="banner"><span><b>Datos de ejemplo.</b> Todo lo marcado como ejemplo se puede borrar cuando tengas lo tuyo.</span><button class="btn btn-sm" data-accion="borrar-ejemplos">Borrar ejemplos</button></div>`;
}
function opciones(obj, val) { return Object.entries(obj).map(([k, v]) => `<option value="${esc(k)}" ${k === val ? "selected" : ""}>${esc(v)}</option>`).join(""); }
function opcionesLista(arr, val) { return arr.map(([k, v]) => `<option value="${esc(k)}" ${k === val ? "selected" : ""}>${esc(v)}</option>`).join(""); }
const campo = (id, label, control, cls = "") => `<div class="campo ${cls}"><label for="${id}">${label}</label>${control}</div>`;
const inp = (id, name, val, extra = "") => `<input id="${id}" name="${name}" value="${esc(val)}" ${extra}>`;
const txa = (id, name, val, extra = "") => `<textarea id="${id}" name="${name}" ${extra}>${esc(val)}</textarea>`;

/* ───────── Navegación ───────── */
function ir(vista) {
  ui.vista = vista; guardarUI();
  $$(".vista").forEach(v => v.classList.toggle("active", v.id === "v-" + vista));
  $$("[data-vista]").forEach(b => b.classList.toggle("active", b.dataset.vista === vista));
  render(vista);
  window.scrollTo({ top: 0, behavior: "auto" });
}
function refrescar() { render(ui.vista); }
function render(vista) {
  chartRegistro.clear();
  ({ inicio: renderInicio, contenido: renderContenido, stats: renderStats, inspo: renderInspo, mas: renderMas }[vista] || renderInicio)();
  dibujarCharts();
}

/* ═══════════ INICIO ═══════════ */
function renderInicio() {
  const el = $("#v-inicio");
  const pubs = publicadas();
  const d30 = isoDesde(30), d60 = isoDesde(60);
  const p30 = pubs.filter(p => p.fecha >= d30), p60 = pubs.filter(p => p.fecha >= d60 && p.fecha < d30);
  const v30 = suma(p30, "views"), v60 = suma(p60, "views");
  const delta = v60 > 0 ? (v30 - v60) / v60 : null;
  const proximas = store.piezas.filter(p => p.estado !== "publicado").sort(porFechaAsc).slice(0, 6);
  const mejor = [...p30].sort((a, b) => m(b, "views") - m(a, "views"))[0];
  const ultima = pubs[0];
  const porAnalizar = store.inspiracion.filter(i => i.estado === "por-analizar").length;
  const serieSpark = [...p30].sort(porFechaAsc).map(p => m(p, "views"));
  const f = new Date();
  el.innerHTML = `
    ${bannerEjemplos()}
    <div class="top">
      <div>
        <div class="eyebrow">Contenido Lab <span class="sep">·</span> ${DIAS_L[f.getDay()]} ${f.getDate()} de ${MESES_L[f.getMonth()]}</div>
        <h1 class="titulo">${saludo()}, ${esc(store.perfil.nombre || "David")}.</h1>
        <p class="lead">${store.piezas.length ? `${proximas.length ? `<b>${proximas.length}</b> pieza${proximas.length === 1 ? "" : "s"} en producción` : "Nada en producción"} · <b>${pubs.length}</b> publicada${pubs.length === 1 ? "" : "s"} en total · <b>${porAnalizar}</b> referente${porAnalizar === 1 ? "" : "s"} por analizar.` : "Tu laboratorio privado: piezas, guiones, estadísticas e inspiración en un solo lugar."}</p>
      </div>
      <button class="btn btn-primary" data-accion="nueva-pieza"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Nueva pieza</button>
    </div>

    <div class="card">
      <div class="hero-fig">
        <div>
          <div class="hero-num">${fmt(v30)}</div>
          <div class="hero-lbl">views en los últimos 30 días · ${p30.length} pieza${p30.length === 1 ? "" : "s"} publicada${p30.length === 1 ? "" : "s"}</div>
        </div>
        ${delta === null ? "" : `<span class="delta ${delta >= 0 ? "up" : "down"}">${delta >= 0 ? "▲" : "▼"} ${fmtDelta(delta)} vs 30 días antes</span>`}
      </div>
      ${serieSpark.length > 1 ? `<div style="max-width:420px">${chartBox("spark", serieSpark)}</div>` : ""}
    </div>

    <div class="kpis" style="margin-top:12px">
      <div class="kpi"><span class="kpi-lbl">Promedio por pieza</span><span class="kpi-val">${p30.length ? fmt(v30 / p30.length) : "—"}</span><span class="kpi-sub">views · últimos 30 días</span></div>
      <div class="kpi"><span class="kpi-lbl">Engagement</span><span class="kpi-val">${p30.length ? pct(engPromedio(p30)) : "—"}</span><span class="kpi-sub">likes + comentarios + compartidos + guardados</span></div>
      <div class="kpi"><span class="kpi-lbl">Seguidores ganados</span><span class="kpi-val">${p30.length ? "+" + fmtFull(suma(p30, "seguidores")) : "—"}</span><span class="kpi-sub">atribuidos a piezas del periodo</span></div>
      <div class="kpi"><span class="kpi-lbl">Retención</span><span class="kpi-val">${p30.filter(p => m(p, "retencion")).length ? Math.round(prom(p30.filter(p => m(p, "retencion")), p => m(p, "retencion"))) + " %" : "—"}</span><span class="kpi-sub">promedio de las piezas con dato</span></div>
    </div>

    <div class="grid-2 bloque">
      <div class="card">
        <h3>En producción</h3>
        ${proximas.length ? `<div class="lista">${proximas.map(p => `<button class="fila" data-accion="ficha-pieza" data-id="${esc(p.id)}"><span class="cuando">${esc(fmtFecha(p.fecha, true))}</span><span class="que"><b>${esc(p.titulo || "Sin título")}</b><span>${esc(PLATAFORMAS[p.plataforma])} · ${esc(FORMATOS[p.formato] || "")}${p.pilar ? " · " + esc(p.pilar) : ""}</span></span>${pill(p.estado)}</button>`).join("")}</div>`
        : `<div class="vacio"><b>Todo publicado</b>Crea la próxima pieza o convierte un referente en idea.<br><button class="btn btn-primary btn-sm" data-accion="nueva-pieza">Nueva pieza</button></div>`}
      </div>
      <div>
        <div class="card">
          <h3>Mejor hook de los últimos 30 días</h3>
          ${mejor ? `<button class="fila" data-accion="ficha-pieza" data-id="${esc(mejor.id)}" style="display:block;border:0;padding:0"><div class="cita">${esc(mejor.hook || mejor.titulo)}</div><div class="reel-stats" style="margin-top:10px;padding:0"><span><b>${fmt(m(mejor, "views"))}</b> views</span><span><b>${pct(eng(mejor))}</b> eng.</span>${m(mejor, "retencion") ? `<span><b>${m(mejor, "retencion")} %</b> ret.</span>` : ""}</div><div class="card-nota" style="margin-top:6px">${esc(HOOK_TIPOS[mejor.hookTipo] || "")} · ${esc(PLATAFORMAS[mejor.plataforma])} · ${esc(fmtFecha(mejor.fecha))}</div></button>`
          : `<p class="card-nota">Cuando registres las métricas de una pieza publicada, aquí verás el hook que mejor funcionó.</p>`}
        </div>
        <div class="card" style="margin-top:12px">
          <h3>Inspiración</h3>
          <p class="card-nota">${porAnalizar ? `<b>${porAnalizar}</b> referente${porAnalizar === 1 ? "" : "s"} esperando análisis (hook, guion, por qué funciona).` : "Todos los referentes están analizados. Guarda el próximo reel viral que veas."}</p>
          <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn btn-sm" data-accion="vista" data-vista="inspo">Ver inspiración</button><button class="btn btn-sm btn-ghost" data-accion="nueva-inspo">+ Guardar referente</button></div>
        </div>
        ${ultima ? `<div class="card" style="margin-top:12px"><h3>Última publicada</h3><button class="fila" data-accion="ficha-pieza" data-id="${esc(ultima.id)}"><span class="cuando">${esc(fmtFecha(ultima.fecha, true))}</span><span class="que"><b>${esc(ultima.titulo)}</b><span>${esc(PLATAFORMAS[ultima.plataforma])} · ${m(ultima, "views") ? fmt(m(ultima, "views")) + " views" : "sin métricas aún"}</span></span></button></div>` : ""}
      </div>
    </div>`;
}

/* ═══════════ CONTENIDO ═══════════ */
function piezasFiltradas() {
  const q = ui.q.trim().toLowerCase();
  return store.piezas.filter(p => (ui.fEstado === "todas" || p.estado === ui.fEstado) && (ui.fPlat === "todas" || p.plataforma === ui.fPlat)
    && (!q || [p.titulo, p.hook, p.pilar, p.guion, p.notas].join(" ").toLowerCase().includes(q)));
}
function tarjetaPieza(p) {
  const pub = p.estado === "publicado";
  return `<button class="reel" data-accion="ficha-pieza" data-id="${esc(p.id)}">
    ${cover(p)}
    <div class="reel-tit">${esc(p.titulo || "Sin título")}</div>
    <div class="reel-meta"><span>${esc(fmtFecha(p.fecha, true))}</span>${pill(p.estado)}</div>
    ${pub && m(p, "views") ? `<div class="reel-stats"><span><b>${fmt(m(p, "views"))}</b> views</span><span><b>${pct(eng(p))}</b> eng.</span></div>` : `<div class="reel-meta"><span>${esc(FORMATOS[p.formato] || "")}${p.hookTipo && p.hookTipo !== "otro" ? " · " + esc(HOOK_TIPOS[p.hookTipo]) : ""}</span></div>`}
  </button>`;
}
function renderContenido() {
  const el = $("#v-contenido");
  const lista = piezasFiltradas();
  const cuenta = agrupar(store.piezas, p => p.estado);
  const chips = [["todas", "Todas"], ...ESTADOS].map(([k, v]) => `<button class="chip ${ui.fEstado === k ? "active" : ""}" data-filtro="fEstado" data-valor="${k}">${v}<span class="n">${k === "todas" ? store.piezas.length : (cuenta[k] || []).length}</span></button>`).join("");
  el.innerHTML = `
    <div class="top">
      <div><div class="eyebrow">Contenido <span class="sep">·</span> ${store.piezas.length} pieza${store.piezas.length === 1 ? "" : "s"}</div><h1 class="titulo">Tus piezas</h1></div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <div class="segmento"><button class="${ui.modo === "lista" ? "active" : ""}" data-modo="lista">Tarjetas</button><button class="${ui.modo === "pipeline" ? "active" : ""}" data-modo="pipeline">Pipeline</button></div>
        <button class="btn btn-primary" data-accion="nueva-pieza"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Nueva pieza</button>
      </div>
    </div>
    ${bannerEjemplos()}
    <div class="filtros">
      <div class="chips scroll">${chips}</div>
    </div>
    <div class="filtros">
      <label class="buscar"><svg class="ic" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg><input id="buscarPiezas" type="search" placeholder="Buscar por título, hook o guion" value="${esc(ui.q)}" data-filtro-input="q"></label>
      <select class="sel" data-filtro-select="fPlat"><option value="todas">Todas las plataformas</option>${opciones(PLATAFORMAS, ui.fPlat)}</select>
    </div>
    ${store.piezas.length === 0 ? `<div class="vacio"><b>Todavía no hay piezas</b>Crea tu primera pieza o carga los ejemplos para ver cómo funciona.<br><button class="btn btn-primary" data-accion="nueva-pieza">Nueva pieza</button> <button class="btn" data-accion="cargar-ejemplos">Cargar ejemplos</button></div>`
    : ui.modo === "pipeline" ? renderPipeline(lista)
    : lista.length ? `<div class="grid-reels">${lista.map(tarjetaPieza).join("")}</div>` : `<div class="vacio"><b>Nada con esos filtros</b>Prueba con otro estado o borra la búsqueda.</div>`}`;
}
function renderPipeline(lista) {
  const g = agrupar(lista, p => p.estado);
  return `<div class="pipeline">${ESTADOS.map(([k, v]) => `<div class="col"><div class="col-cab"><span>${v}</span><span class="n">${(g[k] || []).length}</span></div>${(g[k] || []).sort(porFechaAsc).map(p => `<button class="col-item" data-accion="ficha-pieza" data-id="${esc(p.id)}"><b>${esc(p.titulo || "Sin título")}</b><span>${esc(fmtFecha(p.fecha, true))} · ${esc(PLATAFORMAS[p.plataforma])}${k === "publicado" && m(p, "views") ? " · " + fmt(m(p, "views")) + " views" : ""}</span></button>`).join("") || `<span class="faint" style="font-size:12.5px">Vacío</span>`}</div>`).join("")}</div>`;
}

/* ═══════════ ESTADÍSTICAS ═══════════ */
function renderStats() {
  const el = $("#v-stats");
  const rango = ui.statsRango, plat = ui.statsPlat;
  const desde = rango === "todo" ? "0000-00-00" : isoDesde(+rango);
  const prevDesde = rango === "todo" ? null : isoDesde(+rango * 2);
  const enPlat = p => plat === "todas" || p.plataforma === plat;
  const pubs = publicadas().filter(p => p.fecha >= desde && enPlat(p)).sort(porFechaAsc);
  const prev = prevDesde ? publicadas().filter(p => p.fecha >= prevDesde && p.fecha < desde && enPlat(p)) : [];
  const conViews = pubs.filter(p => m(p, "views") > 0);
  const total = suma(pubs, "views"), totalPrev = suma(prev, "views");
  const delta = totalPrev > 0 ? (total - totalPrev) / totalPrev : null;
  const lblRango = { "30": "últimos 30 días", "90": "últimos 90 días", "365": "último año", todo: "todo el tiempo" }[rango];

  // Views por publicación (color por plataforma: identidad fija)
  const colViews = chartBox("columnas", conViews.map(p => ({ label: fmtFecha(p.fecha), value: m(p, "views"), clase: "p-" + p.plataforma, tip: `${p.titulo} · ${PLATAFORMAS[p.plataforma]} · ${fmtFull(m(p, "views"))} views` })));
  const platsPresentes = [...new Set(conViews.map(p => p.plataforma))];
  const leyenda = platsPresentes.length > 1 ? `<div class="leyenda">${platsPresentes.map(k => `<span class="p-${k}"><i></i>${esc(PLATAFORMAS[k])}</span>`).join("")}</div>` : "";

  // Promedio de views por tipo de hook
  const porHook = Object.entries(agrupar(conViews, p => p.hookTipo || "otro")).map(([k, arr]) => ({ label: HOOK_TIPOS[k] || k, value: prom(arr, p => m(p, "views")), n: arr.length, tip: `${HOOK_TIPOS[k] || k}: ${fmtFull(prom(arr, p => m(p, "views")))} views promedio · ${arr.length} pieza${arr.length === 1 ? "" : "s"}` })).sort((a, b) => b.value - a.value);
  // Engagement por formato
  const porFormato = Object.entries(agrupar(conViews, p => p.formato)).map(([k, arr]) => ({ label: FORMATOS[k] || k, value: +(engPromedio(arr) * 100).toFixed(1), n: arr.length, tip: `${FORMATOS[k] || k}: ${pct(engPromedio(arr))} de engagement · ${arr.length} pieza${arr.length === 1 ? "" : "s"}` })).sort((a, b) => b.value - a.value);
  // Mejor día
  const porDia = Object.entries(agrupar(conViews, p => fecha(p.fecha).getDay())).map(([d, arr]) => ({ d: +d, label: DIAS[+d], value: prom(arr, p => m(p, "views")), n: arr.length, tip: `${DIAS_L[+d]}: ${fmtFull(prom(arr, p => m(p, "views")))} views promedio · ${arr.length} pieza${arr.length === 1 ? "" : "s"}` }));
  const diasOrden = [1, 2, 3, 4, 5, 6, 0].map(d => porDia.find(x => x.d === d) || { d, label: DIAS[d], value: 0, n: 0, tip: DIAS_L[d] + ": sin publicaciones" });
  // Seguidores (línea por plataforma)
  const segs = store.seguidores.filter(s => (plat === "todas" || s.plataforma === plat) && (rango === "todo" || s.fecha >= desde));
  const series = Object.entries(agrupar(segs, s => s.plataforma)).map(([k, arr]) => ({ nombre: PLATAFORMAS[k] || k, clase: "p-" + k, color: `var(--s-${k})`, puntos: arr.sort((a, b) => a.fecha < b.fecha ? -1 : 1).map(s => ({ x: s.fecha, y: num(s.total) })) }));
  const leyendaSeg = series.length > 1 ? `<div class="leyenda">${series.map(s => `<span class="${s.clase}"><i></i>${esc(s.nombre)}</span>`).join("")}</div>` : "";

  el.innerHTML = `
    <div class="top">
      <div><div class="eyebrow">Estadísticas <span class="sep">·</span> ${esc(lblRango)}</div><h1 class="titulo">Qué está funcionando</h1></div>
    </div>
    <div class="filtros">
      <div class="segmento">${[["30", "30 días"], ["90", "90 días"], ["365", "1 año"], ["todo", "Todo"]].map(([k, v]) => `<button class="${rango === k ? "active" : ""}" data-filtro="statsRango" data-valor="${k}">${v}</button>`).join("")}</div>
      <select class="sel" data-filtro-select="statsPlat"><option value="todas">Todas las plataformas</option>${opciones(PLATAFORMAS, plat)}</select>
    </div>
    ${pubs.length === 0 ? `<div class="vacio"><b>Sin piezas publicadas en este periodo</b>Marca una pieza como publicada y registra sus métricas para ver las gráficas.</div>` : `
    <div class="card">
      <div class="hero-fig">
        <div><div class="hero-num">${fmt(total)}</div><div class="hero-lbl">views · ${pubs.length} pieza${pubs.length === 1 ? "" : "s"} publicada${pubs.length === 1 ? "" : "s"} en ${esc(lblRango)}</div></div>
        ${delta === null ? "" : `<span class="delta ${delta >= 0 ? "up" : "down"}">${delta >= 0 ? "▲" : "▼"} ${fmtDelta(delta)} vs periodo anterior</span>`}
      </div>
    </div>
    <div class="kpis" style="margin-top:12px">
      <div class="kpi"><span class="kpi-lbl">Promedio por pieza</span><span class="kpi-val">${conViews.length ? fmt(total / conViews.length) : "—"}</span><span class="kpi-sub">views</span></div>
      <div class="kpi"><span class="kpi-lbl">Engagement</span><span class="kpi-val">${conViews.length ? pct(engPromedio(conViews)) : "—"}</span><span class="kpi-sub">interacciones ÷ views</span></div>
      <div class="kpi"><span class="kpi-lbl">Guardados</span><span class="kpi-val">${fmt(suma(pubs, "guardados"))}</span><span class="kpi-sub">la señal más fuerte de valor</span></div>
      <div class="kpi"><span class="kpi-lbl">Seguidores ganados</span><span class="kpi-val">+${fmtFull(suma(pubs, "seguidores"))}</span><span class="kpi-sub">atribuidos a las piezas</span></div>
    </div>

    <div class="bloque"><div class="bloque-cab"><h2 class="sub">Lecturas</h2></div><div class="insights">${insights(conViews).map(i => `<div class="insight"><span class="k">${esc(i.k)}</span><span>${i.t}</span></div>`).join("")}</div></div>

    <div class="grid-2 bloque">
      <div class="chart-card" style="grid-column:1/-1"><div class="chart-cab"><h3>Views por publicación</h3><span>cada columna es una pieza · en orden de fecha</span></div>${colViews}${leyenda}</div>
      <div class="chart-card"><div class="chart-cab"><h3>Views promedio por tipo de hook</h3><span>${porHook.length} tipo${porHook.length === 1 ? "" : "s"}</span></div>${chartBox("barras", porHook)}</div>
      <div class="chart-card"><div class="chart-cab"><h3>Engagement por formato</h3><span>interacciones ÷ views</span></div>${chartBox("barras", porFormato, { formato: v => String(v).replace(".", ","), sufijo: " %" })}</div>
      <div class="chart-card"><div class="chart-cab"><h3>Mejor día para publicar</h3><span>views promedio por día de la semana</span></div>${chartBox("columnas", diasOrden, { alto: 190 })}</div>
      <div class="chart-card"><div class="chart-cab"><h3>Seguidores</h3><span>registros manuales</span></div>${chartBox("linea", series, { alto: 190 })}${leyendaSeg}</div>
    </div>

    <details class="plegable bloque"><summary>Ver tabla de piezas del periodo</summary>
      <div class="tabla-wrap" style="margin-top:8px"><table class="tabla"><thead><tr><th>Fecha</th><th>Pieza</th><th>Plataforma</th><th>Hook</th><th class="num">Views</th><th class="num">Likes</th><th class="num">Coment.</th><th class="num">Compart.</th><th class="num">Guard.</th><th class="num">Eng.</th><th class="num">Ret.</th><th class="num">Seg. +</th></tr></thead>
      <tbody>${[...pubs].sort(porFechaDesc).map(p => `<tr><td>${esc(fmtFecha(p.fecha, true))}</td><td>${esc(trunc(p.titulo, 34))}</td><td>${esc(PLATAFORMAS[p.plataforma])}</td><td>${esc(HOOK_TIPOS[p.hookTipo] || "—")}</td><td class="num">${fmtFull(m(p, "views"))}</td><td class="num">${fmtFull(m(p, "likes"))}</td><td class="num">${fmtFull(m(p, "comentarios"))}</td><td class="num">${fmtFull(m(p, "compartidos"))}</td><td class="num">${fmtFull(m(p, "guardados"))}</td><td class="num">${m(p, "views") ? pct(eng(p)) : "—"}</td><td class="num">${m(p, "retencion") ? m(p, "retencion") + " %" : "—"}</td><td class="num">${m(p, "seguidores") ? "+" + fmtFull(m(p, "seguidores")) : "—"}</td></tr>`).join("")}</tbody></table></div>
    </details>`}`;
}
function insights(arr) {
  const out = [];
  if (arr.length < 3) { out.push({ k: "Pronto", t: `Registra métricas de al menos 3 piezas publicadas para ver patrones (llevas ${arr.length}).` }); return out; }
  const promV = prom(arr, p => m(p, "views"));
  const top = [...arr].sort((a, b) => m(b, "views") - m(a, "views"))[0];
  out.push({ k: "Top", t: `Tu pieza más vista es <b>«${esc(trunc(top.titulo, 48))}»</b> con ${fmtFull(m(top, "views"))} views (${(m(top, "views") / promV).toFixed(1).replace(".", ",")}× tu promedio). Hook: ${esc(HOOK_TIPOS[top.hookTipo] || "sin tipo")}.` });
  const porHook = Object.entries(agrupar(arr, p => p.hookTipo || "otro")).map(([k, a]) => ({ k, v: prom(a, p => m(p, "views")), n: a.length })).filter(x => x.n >= 1).sort((a, b) => b.v - a.v);
  if (porHook.length > 1) out.push({ k: "Hook", t: `Los hooks de tipo <b>${esc(HOOK_TIPOS[porHook[0].k] || porHook[0].k)}</b> promedian ${fmt(porHook[0].v)} views, ${(porHook[0].v / promV).toFixed(1).replace(".", ",")}× tu promedio${porHook[0].n < 2 ? " (con una sola pieza: confírmalo con otra)" : ""}. El que menos: ${esc(HOOK_TIPOS[porHook[porHook.length - 1].k] || "")} (${fmt(porHook[porHook.length - 1].v)}).` });
  const porFmt = Object.entries(agrupar(arr, p => p.formato)).map(([k, a]) => ({ k, e: engPromedio(a), n: a.length })).sort((a, b) => b.e - a.e);
  if (porFmt.length > 1) out.push({ k: "Formato", t: `El formato con más engagement es <b>${esc(FORMATOS[porFmt[0].k] || porFmt[0].k)}</b> (${pct(porFmt[0].e)}).` });
  const porDia = Object.entries(agrupar(arr, p => fecha(p.fecha).getDay())).map(([d, a]) => ({ d: +d, v: prom(a, p => m(p, "views")), n: a.length })).sort((a, b) => b.v - a.v);
  if (porDia.length > 1) out.push({ k: "Día", t: `Publicar los <b>${DIAS_L[porDia[0].d]}</b> te ha dado el mejor promedio (${fmt(porDia[0].v)} views).` });
  const conRet = arr.filter(p => m(p, "retencion"));
  if (conRet.length >= 2) { const mejorRet = [...conRet].sort((a, b) => m(b, "retencion") - m(a, "retencion"))[0]; out.push({ k: "Retención", t: `Retención promedio del ${Math.round(prom(conRet, p => m(p, "retencion")))} %. La mejor: «${esc(trunc(mejorRet.titulo, 40))}» con ${m(mejorRet, "retencion")} % (${fmtDur(mejorRet.duracion) || "sin duración"}).` }); }
  const guard = [...arr].sort((a, b) => (m(b, "guardados") / (m(b, "views") || 1)) - (m(a, "guardados") / (m(a, "views") || 1)))[0];
  if (guard && m(guard, "guardados")) out.push({ k: "Valor", t: `La más guardada por view es «${esc(trunc(guard.titulo, 40))}» (${pct(m(guard, "guardados") / m(guard, "views"))}): ese tema pide una serie.` });
  return out;
}

/* ═══════════ INSPIRACIÓN ═══════════ */
function inspoFiltrada() {
  const q = ui.iq.trim().toLowerCase();
  return store.inspiracion.filter(i => (ui.iEstado === "todas" || i.estado === ui.iEstado) && (ui.iPlat === "todas" || i.plataforma === ui.iPlat)
    && (!q || [i.autor, i.hook, i.nicho, i.guion, (i.etiquetas || []).join(" ")].join(" ").toLowerCase().includes(q)));
}
function tarjetaInspo(i) {
  return `<button class="reel" data-accion="ficha-inspo" data-id="${esc(i.id)}">
    ${cover(i, { arriba: i.views ? fmt(i.views) : "" })}
    <div class="reel-autor"><b>${esc(i.autor || "Sin autor")}</b>${i.views ? `<span class="mono dim">· ${fmt(i.views)} views</span>` : ""}</div>
    <div class="reel-meta"><span>${esc(HOOK_TIPOS[i.hookTipo] || "")}${i.nicho ? " · " + esc(trunc(i.nicho, 18)) : ""}</span>${pill(i.estado)}</div>
  </button>`;
}
function renderInspo() {
  const el = $("#v-inspo");
  const esRef = ui.inspoTab === "referentes";
  const cuenta = agrupar(store.inspiracion, i => i.estado);
  const cab = `
    <div class="top">
      <div><div class="eyebrow">Inspiración <span class="sep">·</span> ${esRef ? store.inspiracion.length + " referente" + (store.inspiracion.length === 1 ? "" : "s") : (FORMULAS.length + store.formulas.length) + " fórmulas"}</div><h1 class="titulo">${esRef ? "Reels que funcionan" : "Fórmulas de hook"}</h1></div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <div class="segmento"><button class="${esRef ? "active" : ""}" data-inspo-tab="referentes">Referentes</button><button class="${!esRef ? "active" : ""}" data-inspo-tab="formulas">Fórmulas</button></div>
        ${esRef ? `<button class="btn btn-primary" data-accion="nueva-inspo"><svg class="ic" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>Guardar referente</button>` : `<button class="btn" data-accion="nueva-formula">+ Mi fórmula</button>`}
      </div>
    </div>`;
  if (!esRef) {
    const todas = [...FORMULAS.map(f => Object.assign({ casa: true }, f)), ...store.formulas];
    el.innerHTML = cab + `<p class="lead" style="margin-bottom:18px">Plantillas probadas para los primeros 3 segundos. Cambia lo resaltado por tu tema y úsala directo en una pieza nueva.</p>
      <div class="formulas">${todas.map(f => `<div class="formula"><span class="f-tipo">${esc(HOOK_TIPOS[f.tipo] || f.tipo)}</span><span class="f-nombre">${esc(f.nombre)}</span><p class="f-plantilla">${esc(f.plantilla).replace(/\{\{(.+?)\}\}/g, "<mark>$1</mark>")}</p>${f.ejemplo ? `<p class="f-ej">${esc(f.ejemplo)}</p>` : ""}<div class="f-pie"><span>${f.casa ? "De la casa" : "Tuya"}</span><span style="display:flex;gap:6px">${f.casa ? "" : `<button class="btn btn-sm btn-danger" data-accion="eliminar-formula" data-id="${esc(f.id)}">Quitar</button>`}<button class="btn btn-sm" data-accion="usar-formula" data-id="${esc(f.id)}">Usar en pieza</button></span></div></div>`).join("")}</div>`;
    return;
  }
  const lista = inspoFiltrada();
  const chips = [["todas", "Todos"], ...INSPO_ESTADOS].map(([k, v]) => `<button class="chip ${ui.iEstado === k ? "active" : ""}" data-filtro="iEstado" data-valor="${k}">${v}<span class="n">${k === "todas" ? store.inspiracion.length : (cuenta[k] || []).length}</span></button>`).join("");
  el.innerHTML = cab + bannerEjemplos() + `
    <div class="filtros"><div class="chips scroll">${chips}</div></div>
    <div class="filtros">
      <label class="buscar"><svg class="ic" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg><input id="buscarInspo" type="search" placeholder="Buscar por autor, hook, nicho o etiqueta" value="${esc(ui.iq)}" data-filtro-input="iq"></label>
      <select class="sel" data-filtro-select="iPlat"><option value="todas">Todas las plataformas</option>${opciones(PLATAFORMAS, ui.iPlat)}</select>
    </div>
    ${store.inspiracion.length === 0 ? `<div class="vacio"><b>Tu archivo de referentes está vacío</b>Guarda el próximo reel viral que veas: pega el hook, la transcripción y analízalo.<br><button class="btn btn-primary" data-accion="nueva-inspo">Guardar referente</button> <button class="btn" data-accion="cargar-ejemplos">Cargar ejemplos</button></div>`
    : lista.length ? `<div class="grid-reels">${lista.map(tarjetaInspo).join("")}</div>` : `<div class="vacio"><b>Nada con esos filtros</b></div>`}`;
}

/* ═══════════ MÁS (perfil, seguidores, datos) ═══════════ */
function renderMas() {
  const el = $("#v-mas");
  const per = store.perfil;
  const cuentas = per.cuentas.length ? per.cuentas : [{ plataforma: "tiktok", usuario: "" }];
  el.innerHTML = `
    <div class="top"><div><div class="eyebrow">Más</div><h1 class="titulo">Perfil y datos</h1></div></div>
    <div class="grid-2">
      <form class="card" id="formPerfil">
        <h3>Perfil</h3>
        <div class="form-grid">
          ${campo("perNombre", "Nombre", inp("perNombre", "nombre", per.nombre, 'autocomplete="off"'))}
          ${campo("perNicho", "Tu nicho <span class=\"hint\">· Claude lo usa al adaptar hooks</span>", inp("perNicho", "nicho", per.nicho, 'placeholder="creador de contenido audiovisual para marcas de café y carnes"'), "ancho")}
        </div>
        <div class="sheet-sec"><h4>Cuentas</h4><div class="cuentas" id="cuentas">${cuentas.map((c, i) => `<div class="cuenta"><div class="campo"><select name="c_plat_${i}" aria-label="Plataforma">${opciones(PLATAFORMAS, c.plataforma)}</select></div><div class="campo ancho"><input name="c_user_${i}" value="${esc(c.usuario)}" placeholder="@usuario" aria-label="Usuario"></div><div class="campo"><input name="c_nicho_${i}" value="${esc(c.nicho || "")}" placeholder="Nota" aria-label="Nota"></div><button type="button" class="btn btn-sm btn-ghost" data-accion="quitar-cuenta" data-i="${i}" aria-label="Quitar cuenta">×</button></div>`).join("")}</div>
        <button type="button" class="link-btn" data-accion="agregar-cuenta" style="margin-top:8px">+ Agregar cuenta</button></div>
        <div class="acciones" style="position:static;border:0;padding-top:14px"><button type="submit" class="btn btn-primary">Guardar perfil</button></div>
      </form>

      <div>
        <div class="card">
          <h3>Seguidores</h3>
          <p class="card-nota">Anota el total cada semana o cada mes: alimenta la gráfica de crecimiento.</p>
          <form id="formSeguidor" class="form-grid" style="margin-top:12px;grid-template-columns:1fr 1fr 1fr auto;align-items:end">
            ${campo("segFecha", "Fecha", `<input id="segFecha" name="fecha" type="date" value="${hoy()}" required>`)}
            ${campo("segPlat", "Plataforma", `<select id="segPlat" name="plataforma">${opciones(PLATAFORMAS, "tiktok")}</select>`)}
            ${campo("segTotal", "Total", `<input id="segTotal" name="total" type="number" min="0" inputmode="numeric" required placeholder="4390">`)}
            <button type="submit" class="btn btn-primary btn-sm" style="height:40px">Anotar</button>
          </form>
          ${store.seguidores.length ? `<div class="lista" style="margin-top:12px">${[...store.seguidores].reverse().slice(0, 8).map((s, idx) => `<div class="fila"><span class="cuando">${esc(fmtFecha(s.fecha))}</span><span class="que"><b>${esc(PLATAFORMAS[s.plataforma] || s.plataforma)}</b></span><span class="num">${fmtFull(s.total)}</span><button class="btn btn-sm btn-ghost" data-accion="quitar-seguidor" data-i="${store.seguidores.length - 1 - idx}" aria-label="Quitar registro">×</button></div>`).join("")}</div>` : ""}
        </div>

        <div class="card" style="margin-top:12px">
          <h3>Datos</h3>
          <div class="ajuste-fila"><div class="txt"><b>Respaldo</b><span>Descarga todo en un JSON o restaura uno anterior.</span></div><div class="der"><button class="btn btn-sm" data-accion="exportar">Exportar</button><label class="btn btn-sm">Importar<input type="file" accept="application/json,.json" id="importarInput" hidden></label></div></div>
          <div class="ajuste-fila"><div class="txt"><b>Ejemplos</b><span>${hayEjemplos() ? "Hay datos de ejemplo cargados." : "Carga piezas y referentes de muestra para explorar."}</span></div><div class="der">${hayEjemplos() ? `<button class="btn btn-sm" data-accion="borrar-ejemplos">Borrar ejemplos</button>` : `<button class="btn btn-sm" data-accion="cargar-ejemplos">Cargar ejemplos</button>`}</div></div>
          <div class="ajuste-fila"><div class="txt"><b>Dónde viven tus datos</b><span>${EN_ARTIFACT ? (Sync.db ? "En la base de datos privada de este artifact: se sincronizan entre tu Mac y tu iPhone con tu cuenta de Claude." : "En este navegador. Si la base de datos no responde, exporta un respaldo.") : "En este navegador (localStorage). Usa Exportar / Importar para moverlos a otro dispositivo."}</span></div></div>
          ${EN_ARTIFACT ? "" : `<div class="ajuste-fila"><div class="txt"><b>Tema</b><span>Sigue al sistema o fíjalo.</span></div><div class="segmento">${[["auto", "Sistema"], ["dark", "Oscuro"], ["light", "Claro"]].map(([k, v]) => `<button class="${ui.tema === k ? "active" : ""}" data-tema="${k}">${v}</button>`).join("")}</div></div>`}
          <div class="ajuste-fila"><div class="txt"><b>Borrar todo</b><span>Elimina piezas, referentes y registros. No hay vuelta atrás.</span></div><div class="der"><button class="btn btn-sm btn-danger" data-accion="borrar-todo">Borrar todo</button></div></div>
        </div>

        <div class="card" style="margin-top:12px">
          <h3>Tus otras plataformas</h3>
          <div class="ajuste-fila"><div class="txt"><b>Contenido Hub</b><span>Calendario y pipeline de Café Forestal y Carnes Manzanares.</span></div><a class="btn btn-sm" href="${esc(window.ENLACE_HUB || "../index.html")}" target="_blank" rel="noopener">Abrir</a></div>
          <div class="ajuste-fila"><div class="txt"><b>Estudio</b><span>Proyectos, objetivos y finanzas.</span></div><a class="btn btn-sm" href="${esc(window.ENLACE_ESTUDIO || "../estudio.html")}" target="_blank" rel="noopener">Abrir</a></div>
        </div>
      </div>
    </div>`;
}

/* ═══════════ FICHAS (sheet) ═══════════ */
const sheetEl = $("#sheet"), backdropEl = $("#sheetBackdrop");
function abrirSheet(html) {
  sheetEl.innerHTML = html; sheetEl.classList.add("abierta"); backdropEl.classList.add("abierto");
  document.body.style.overflow = "hidden"; sheetEl.scrollTop = 0;
}
function cerrarSheet() {
  if (iaCtl) { try { iaCtl.abort(); } catch { } iaCtl = null; }
  sheetEl.classList.remove("abierta"); backdropEl.classList.remove("abierto"); document.body.style.overflow = "";
  setTimeout(() => { if (!sheetEl.classList.contains("abierta")) sheetEl.innerHTML = ""; }, 320);
}
const lineas = t => String(t || "").split("\n").map(s => s.trim()).filter(Boolean);
const beatsATexto = arr => (arr || []).map(b => [b.parte, b.segundos, b.texto].filter(x => x != null && String(x).trim() !== "").join(" | ")).join("\n");
function textoABeats(t) {
  return lineas(t).map(l => {
    const p = l.split("|").map(s => s.trim());
    if (p.length >= 3) return { parte: p[0], segundos: p[1], texto: p.slice(2).join(" | ") };
    if (p.length === 2) return { parte: p[0], segundos: "", texto: p[1] };
    return { parte: "", segundos: "", texto: p[0] };
  });
}
function renderBeats(arr) {
  if (!arr || !arr.length) return "";
  return `<div class="beats">${arr.map(b => `<div class="beat ${/hook/i.test(b.parte || "") ? "b-hook" : ""}"><div class="b-parte">${esc(b.parte || "Parte")}${b.segundos ? `<span>${esc(b.segundos)} s</span>` : ""}</div><div class="b-txt">${esc(b.texto)}</div></div>`).join("")}</div>`;
}
function actualizarBeats(form) { const c = $("#beatsPreview", form); if (c) c.innerHTML = renderBeats(textoABeats(form.elements.estructura.value)); }

function fichaPieza(id, base) {
  const existente = id ? store.piezas.find(x => x.id === id) : null;
  const p = existente || nuevaPieza(base || {});
  const pub = p.estado === "publicado";
  abrirSheet(`
    <div class="sheet-cab"><div class="eyebrow">${existente ? "Pieza" : "Nueva pieza"}${p.ejemplo ? " · ejemplo" : ""}</div><button type="button" class="cerrar" data-accion="cerrar" aria-label="Cerrar">×</button></div>
    <form id="formPieza" data-id="${esc(p.id)}" novalidate>
      <div class="ficha-hero">${cover(p)}<div class="ficha-datos"><div class="sheet-tit">${esc(p.titulo || "Sin título")}</div><div class="fila-chips">${pill(p.estado)} ${tagPlat(p.plataforma)} ${tagTxt(FORMATOS[p.formato] || "")}</div>${pub && m(p, "views") ? `<div class="reel-stats" style="padding:0"><span><b>${fmt(m(p, "views"))}</b> views</span><span><b>${pct(eng(p))}</b> eng.</span>${m(p, "retencion") ? `<span><b>${m(p, "retencion")} %</b> ret.</span>` : ""}</div>` : ""}${p.link ? `<a href="${esc(p.link)}" target="_blank" rel="noopener">Ver publicación ↗</a>` : ""}</div></div>
      <div class="sheet-sec"><h4>Ficha</h4><div class="form-grid">
        ${campo("pTitulo", "Título", inp("pTitulo", "titulo", p.titulo, 'placeholder="Cómo grabamos un reel de café en 2 horas" autocomplete="off"'), "ancho")}
        ${campo("pPlat", "Plataforma", `<select id="pPlat" name="plataforma">${opciones(PLATAFORMAS, p.plataforma)}</select>`)}
        ${campo("pFmt", "Formato", `<select id="pFmt" name="formato">${opciones(FORMATOS, p.formato)}</select>`)}
        ${campo("pFecha", "Fecha", `<input id="pFecha" name="fecha" type="date" value="${esc(p.fecha)}">`)}
        ${campo("pEstado", "Estado", `<select id="pEstado" name="estado">${opcionesLista(ESTADOS, p.estado)}</select>`)}
        ${campo("pPilar", "Pilar / tema", inp("pPilar", "pilar", p.pilar, 'placeholder="Detrás de cámaras, Educativo, Historia…"'))}
        ${campo("pDur", 'Duración <span class="hint">· segundos</span>', `<input id="pDur" name="duracion" type="number" min="0" inputmode="numeric" value="${p.duracion || ""}">`)}
      </div></div>
      <div class="sheet-sec"><h4>Hook y guion</h4><div class="form-grid">
        ${campo("pHook", 'Hook <span class="hint">· los primeros 3 segundos</span>', txa("pHook", "hook", p.hook, 'rows="2" placeholder="Esto es lo que pasa cuando…"'), "ancho")}
        ${campo("pHookTipo", "Tipo de hook", `<select id="pHookTipo" name="hookTipo">${opciones(HOOK_TIPOS, p.hookTipo)}</select>`)}
        <div class="campo solo-ia"><label>&nbsp;</label><span style="display:flex;gap:6px"><button type="button" class="btn btn-ia" data-accion="ia-hooks">✦ Sugerir 5 hooks</button><button type="button" class="btn btn-sm btn-ghost" data-accion="ia-stop" hidden>Detener</button></span></div>
        <div class="ancho" id="iaHooks"></div>
        ${campo("pGuion", "Guion", txa("pGuion", "guion", p.guion, 'class="guion" placeholder="HOOK (0-3s): …&#10;CONTEXTO: …&#10;VALOR: …&#10;CTA: …"'), "ancho")}
        ${campo("pCta", "CTA", inp("pCta", "cta", p.cta, 'placeholder="Comenta CAFÉ · Guárdalo · Sígueme"'))}
        ${campo("pLink", "Enlace publicado", inp("pLink", "link", p.link, 'type="url" placeholder="https://"'))}
      </div></div>
      <div class="sheet-sec"><h4>Métricas <span class="hint">· anótalas a las 48 h y a la semana</span></h4><div class="metricas-grid">
        ${METRICAS.map(k => campo("pm_" + k, METRICA_LBL[k], `<input id="pm_${k}" name="m_${k}" type="number" min="0" step="any" inputmode="decimal" value="${p.metricas && p.metricas[k] != null ? esc(p.metricas[k]) : ""}">`)).join("")}
      </div></div>
      <div class="sheet-sec"><h4>Notas · qué aprendí</h4>${campo("pNotas", "Notas", txa("pNotas", "notas", p.notas, 'rows="3" placeholder="Qué retuvo, qué no, qué repetir."'))}</div>
      <div class="acciones"><button type="submit" class="btn btn-primary">Guardar</button>${existente ? `<button type="button" class="btn btn-ghost" data-accion="duplicar-pieza" data-id="${esc(p.id)}">Duplicar</button><button type="button" class="btn btn-danger derecha" data-accion="eliminar-pieza" data-id="${esc(p.id)}">Eliminar</button>` : ""}</div>
    </form>`);
  if (!existente) { const t = $("#pTitulo"); if (t && window.matchMedia("(min-width: 861px)").matches) t.focus(); }
}
function leerPieza(form, base) {
  const fd = new FormData(form), o = Object.assign({}, base);
  for (const k of ["titulo", "plataforma", "formato", "pilar", "hook", "hookTipo", "guion", "cta", "fecha", "estado", "link", "notas"]) o[k] = String(fd.get(k) ?? "").trim();
  o.duracion = num(fd.get("duracion"));
  o.metricas = {};
  for (const k of METRICAS) { const v = fd.get("m_" + k); if (v != null && String(v).trim() !== "") o.metricas[k] = num(v); }
  delete o.ejemplo;
  return o;
}

function fichaInspo(id) {
  const existente = id ? store.inspiracion.find(x => x.id === id) : null;
  const i = existente || nuevaInspo();
  abrirSheet(`
    <div class="sheet-cab"><div class="eyebrow">${existente ? "Referente" : "Nuevo referente"}${i.ejemplo ? " · ejemplo" : ""}</div><button type="button" class="cerrar" data-accion="cerrar" aria-label="Cerrar">×</button></div>
    <form id="formInspo" data-id="${esc(i.id)}" novalidate>
      <div class="ficha-hero">${cover(i, { arriba: i.views ? fmt(i.views) : "" })}<div class="ficha-datos"><div class="sheet-tit">${esc(i.autor || "Sin autor")}</div><div class="fila-chips">${pill(i.estado)} ${tagPlat(i.plataforma)} ${i.hookTipo && i.hookTipo !== "otro" ? tagTxt(HOOK_TIPOS[i.hookTipo]) : ""}</div>${i.views ? `<div class="reel-stats" style="padding:0"><span><b>${fmt(i.views)}</b> views</span>${i.likes ? `<span><b>${fmt(i.likes)}</b> likes</span>` : ""}</div>` : ""}${i.link ? `<a href="${esc(i.link)}" target="_blank" rel="noopener">Ver el video ↗</a>` : ""}</div></div>
      <div class="sheet-sec"><h4>Ficha</h4><div class="form-grid">
        ${campo("iAutor", "Autor / cuenta", inp("iAutor", "autor", i.autor, 'placeholder="@cuenta" autocomplete="off"'))}
        ${campo("iPlat", "Plataforma", `<select id="iPlat" name="plataforma">${opciones(PLATAFORMAS, i.plataforma)}</select>`)}
        ${campo("iLink", "Enlace", inp("iLink", "link", i.link, 'type="url" placeholder="https://"'), "ancho")}
        ${campo("iNicho", "Nicho", inp("iNicho", "nicho", i.nicho, 'placeholder="Café de especialidad"'))}
        ${campo("iEstado", "Estado", `<select id="iEstado" name="estado">${opcionesLista(INSPO_ESTADOS, i.estado)}</select>`)}
        ${campo("iViews", "Views", `<input id="iViews" name="views" type="number" min="0" inputmode="numeric" value="${i.views || ""}">`)}
        ${campo("iLikes", "Likes", `<input id="iLikes" name="likes" type="number" min="0" inputmode="numeric" value="${i.likes || ""}">`)}
        ${campo("iTags", 'Etiquetas <span class="hint">· separadas por coma</span>', inp("iTags", "etiquetas", (i.etiquetas || []).join(", "), 'placeholder="A/B, autoridad, demo"'), "ancho")}
      </div></div>
      <div class="sheet-sec"><h4>Hook y guion</h4><div class="form-grid">
        ${campo("iHook", 'Hook <span class="hint">· textual, los primeros 3 segundos</span>', txa("iHook", "hook", i.hook, 'rows="2"'), "ancho")}
        ${campo("iHookTipo", "Tipo de hook", `<select id="iHookTipo" name="hookTipo">${opciones(HOOK_TIPOS, i.hookTipo)}</select>`)}
        <div class="campo solo-ia"><label>&nbsp;</label><span style="display:flex;gap:6px"><button type="button" class="btn btn-ia" data-accion="ia-analizar">✦ Analizar con Claude</button><button type="button" class="btn btn-sm btn-ghost" data-accion="ia-stop" hidden>Detener</button></span></div>
        <div class="ancho"><div class="ia-salida" id="iaSalida" hidden></div></div>
        ${campo("iGuion", "Guion · transcripción · caption", txa("iGuion", "guion", i.guion, 'class="guion" placeholder="Pega lo que dice el video (transcripción) o su descripción. Claude lo usa para el análisis."'), "ancho")}
      </div></div>
      <div class="sheet-sec"><h4>Análisis</h4><div class="form-grid">
        ${campo("iEstructura", 'Estructura <span class="hint">· una parte por línea: Parte | segundos | qué pasa</span>', txa("iEstructura", "estructura", beatsATexto(i.estructura), 'rows="5" placeholder="Hook | 0-3 | …&#10;Contexto | 3-8 | …&#10;Valor | 8-25 | …&#10;CTA | 25-30 | …"'), "ancho")}
        <div class="ancho" id="beatsPreview">${renderBeats(i.estructura || [])}</div>
        ${campo("iPorque", 'Por qué funciona <span class="hint">· una razón por línea</span>', txa("iPorque", "porque", (i.porque || []).join("\n"), 'rows="4"'), "ancho")}
        ${campo("iMiVersion", "Mi versión", txa("iMiVersion", "miVersion", i.miVersion, 'rows="3" placeholder="Cómo lo adapto a mi contenido"'), "ancho")}
        ${campo("iVariantes", 'Hooks para mí <span class="hint">· uno por línea</span>', txa("iVariantes", "variantes", (i.variantes || []).join("\n"), 'rows="3"'), "ancho")}
      </div></div>
      <div class="acciones"><button type="submit" class="btn btn-primary">Guardar</button><button type="button" class="btn" data-accion="convertir-inspo" data-id="${esc(i.id)}">Convertir en pieza</button>${existente ? `<button type="button" class="btn btn-danger derecha" data-accion="eliminar-inspo" data-id="${esc(i.id)}">Eliminar</button>` : ""}</div>
    </form>`);
  if (!existente) { const t = $("#iAutor"); if (t && window.matchMedia("(min-width: 861px)").matches) t.focus(); }
}
function leerInspo(form, base) {
  const fd = new FormData(form), o = Object.assign({}, base);
  for (const k of ["autor", "plataforma", "link", "nicho", "hook", "hookTipo", "estado", "guion", "miVersion"]) o[k] = String(fd.get(k) ?? "").trim();
  o.views = num(fd.get("views")); o.likes = num(fd.get("likes"));
  o.etiquetas = String(fd.get("etiquetas") || "").split(",").map(s => s.trim()).filter(Boolean);
  o.estructura = textoABeats(fd.get("estructura")); o.porque = lineas(fd.get("porque")); o.variantes = lineas(fd.get("variantes"));
  delete o.ejemplo;
  return o;
}
function convertirEnPieza(id) {
  const form = $("#formInspo");
  const base = store.inspiracion.find(x => x.id === id) || nuevaInspo({ id });
  const it = form ? leerInspo(form, base) : base;
  if (!it.hook && !it.guion) { toast("Escribe al menos el hook del referente"); return; }
  it.estado = "usado"; guardarInspo(it);
  const guion = it.estructura.length ? it.estructura.map(b => `${(b.parte || "Parte").toUpperCase()}${b.segundos ? " (" + b.segundos + "s)" : ""}: ${b.texto}`).join("\n") : "";
  const p = nuevaPieza({ titulo: "Mi versión: " + trunc(it.hook || it.autor, 48), hook: it.variantes[0] || it.hook, hookTipo: it.hookTipo, plataforma: it.plataforma, guion: guion + (it.miVersion ? "\n\nMI VERSIÓN: " + it.miVersion : ""), notas: "Inspirada en " + (it.autor || "un referente") + (it.link ? " · " + it.link : ""), inspiracionId: it.id });
  guardarPieza(p); refrescar(); toast("Pieza creada desde el referente");
  fichaPieza(p.id);
}
function fichaFormula() {
  abrirSheet(`
    <div class="sheet-cab"><div class="eyebrow">Nueva fórmula de hook</div><button type="button" class="cerrar" data-accion="cerrar" aria-label="Cerrar">×</button></div>
    <form id="formFormula" novalidate><div class="form-grid">
      ${campo("fNombre", "Nombre", inp("fNombre", "nombre", "", 'placeholder="La pregunta incómoda" autocomplete="off"'))}
      ${campo("fTipo", "Tipo", `<select id="fTipo" name="tipo">${opciones(HOOK_TIPOS, "pregunta")}</select>`)}
      ${campo("fPlantilla", 'Plantilla <span class="hint">· lo variable entre {{llaves}}</span>', txa("fPlantilla", "plantilla", "", 'rows="2" placeholder="¿Por qué {{tu nicho}} sigue haciendo {{error}}?"'), "ancho")}
      ${campo("fEjemplo", "Ejemplo", txa("fEjemplo", "ejemplo", "", 'rows="2"'), "ancho")}
    </div><div class="acciones"><button type="submit" class="btn btn-primary">Guardar fórmula</button></div></form>`);
}

/* ═══════════ CLAUDE (sample) ═══════════ */
let Sample = null, iaCtl = null;
async function iniciarIA() {
  if (!EN_ARTIFACT) return;
  try { Sample = await claude.use("sample"); } catch { Sample = null; }
  if (Sample) document.documentElement.classList.add("con-ia");
}
function copiaError(code) {
  return { cancelled: "Detenido.", not_granted: "No diste permiso para usar Claude en esta página.", rate_limited: "Muchas consultas seguidas: espera un momento.", invalid_json: "Claude respondió en un formato inesperado. Intenta de nuevo.", prompt_too_large: "El texto es muy largo: recorta la transcripción." }[code] || "No se pudo completar. Intenta de nuevo.";
}
const TIPOS_TXT = Object.keys(HOOK_TIPOS).filter(k => k !== "otro").join(", ");
function promptAnalisis(i) {
  const nicho = store.perfil.nicho || "creador de contenido audiovisual para marcas";
  return `Eres estratega de contenido para video corto (TikTok, Reels, Shorts). Analiza este video viral con la información disponible y responde SOLO con un objeto JSON, sin texto adicional, con esta forma exacta:
{"hook": "el gancho literal (o reconstruido) de los primeros 3 segundos", "hookTipo": "una de: ${TIPOS_TXT}", "estructura": [{"parte": "Hook", "segundos": "0-3", "texto": "qué pasa y por qué"}, {"parte": "Contexto", "segundos": "3-8", "texto": "..."}, {"parte": "Valor", "segundos": "...", "texto": "..."}, {"parte": "Giro", "segundos": "...", "texto": "..."}, {"parte": "CTA", "segundos": "...", "texto": "..."}], "porque": ["3 a 5 razones concretas por las que retiene y se comparte"], "miVersion": "cómo adaptar esta idea en 2 o 3 frases para: ${nicho}", "variantes": ["3 hooks alternativos listos para grabar, en español, máximo 14 palabras cada uno, para: ${nicho}"]}
Si falta información, infiere con criterio a partir del hook y el nicho. Escribe en español neutro.

Video:
- Autor: ${i.autor || "desconocido"} · Plataforma: ${PLATAFORMAS[i.plataforma] || i.plataforma} · Nicho: ${i.nicho || "no indicado"}
- Views: ${i.views || "?"} · Likes: ${i.likes || "?"}
- Hook observado: ${i.hook || "(no anotado)"}
- Guion / transcripción / descripción:
${(i.guion || "(no hay transcripción)").slice(0, 7000)}`;
}
function promptHooks(p) {
  const nicho = store.perfil.nicho || "creador de contenido audiovisual para marcas";
  return `Genera 5 hooks alternativos para los primeros 3 segundos de un video corto (máximo 14 palabras cada uno, en español, listos para decir a cámara, sin comillas ni emojis). Varía el tipo entre: ${TIPOS_TXT}. Responde SOLO con un JSON array de objetos {"hook": "...", "tipo": "uno de los tipos"}.
Creador: ${nicho}.
Título de la pieza: ${p.titulo || "(sin título)"}
Hook actual: ${p.hook || "(ninguno)"}
Guion: ${(p.guion || "(sin guion)").slice(0, 3000)}`;
}
async function iaAnalizar(form) {
  if (!Sample) return;
  const base = store.inspiracion.find(x => x.id === form.dataset.id) || nuevaInspo({ id: form.dataset.id });
  const it = leerInspo(form, base);
  const out = $("#iaSalida", form), btn = $("[data-accion=ia-analizar]", form), stop = $("[data-accion=ia-stop]", form);
  if (!it.hook && !it.guion) { toast("Pega al menos el hook o la transcripción"); return; }
  if (iaCtl) iaCtl.abort();
  const ctl = new AbortController(); iaCtl = ctl;
  btn.disabled = true; stop.hidden = false; out.hidden = false; out.classList.add("pensando"); out.textContent = "Claude está analizando el video";
  try {
    const r = await Sample.json(promptAnalisis(it), { signal: ctl.signal, onText: () => { out.textContent = "Escribiendo el análisis"; } });
    if (!form.isConnected) return;
    aplicarAnalisis(form, r);
    out.classList.remove("pensando"); out.textContent = "Análisis listo: revisa los campos de abajo y guarda.";
    out.scrollIntoView({ block: "nearest", behavior: "smooth" });
  } catch (e) {
    if (!form.isConnected) return;
    out.classList.remove("pensando"); out.textContent = copiaError(e && e.code);
  } finally {
    if (form.isConnected) { btn.disabled = false; stop.hidden = true; }
    if (iaCtl === ctl) iaCtl = null;
  }
}
function aplicarAnalisis(form, r) {
  if (!r || typeof r !== "object" || Array.isArray(r)) return;
  const set = (name, v) => { const el = form.elements[name]; if (el && v != null && String(v).trim() !== "") el.value = String(v); };
  if (!form.elements.hook.value.trim() && r.hook) set("hook", r.hook);
  if (r.hookTipo && HOOK_TIPOS[r.hookTipo]) set("hookTipo", r.hookTipo);
  if (Array.isArray(r.estructura)) { set("estructura", beatsATexto(r.estructura.map(b => ({ parte: b.parte, segundos: b.segundos, texto: b.texto })))); actualizarBeats(form); }
  if (Array.isArray(r.porque)) set("porque", r.porque.map(String).join("\n"));
  if (r.miVersion) set("miVersion", r.miVersion);
  if (Array.isArray(r.variantes)) set("variantes", r.variantes.map(String).join("\n"));
  set("estado", "analizado");
}
async function iaHooks(form) {
  if (!Sample) return;
  const base = store.piezas.find(x => x.id === form.dataset.id) || nuevaPieza({ id: form.dataset.id });
  const p = leerPieza(form, base);
  const out = $("#iaHooks", form), btn = $("[data-accion=ia-hooks]", form), stop = $("[data-accion=ia-stop]", form);
  if (!p.titulo && !p.hook && !p.guion) { toast("Escribe al menos el título o la idea"); return; }
  if (iaCtl) iaCtl.abort();
  const ctl = new AbortController(); iaCtl = ctl;
  btn.disabled = true; stop.hidden = false;
  out.innerHTML = `<div class="ia-salida pensando">Claude está pensando hooks</div>`;
  try {
    const r = await Sample.json(promptHooks(p), { signal: ctl.signal, modelTier: "quick", cache: false });
    if (!form.isConnected) return;
    const arr = Array.isArray(r) ? r.filter(v => v && v.hook) : [];
    out.innerHTML = arr.length ? `<div class="variantes">${arr.map(v => `<div class="variante"><span class="txt">${esc(v.hook)}${v.tipo && HOOK_TIPOS[v.tipo] ? ` <span class="tag">${esc(HOOK_TIPOS[v.tipo])}</span>` : ""}</span><button type="button" class="btn btn-sm" data-accion="usar-variante" data-hook="${esc(v.hook)}" data-tipo="${esc(v.tipo || "")}">Usar</button></div>`).join("")}</div>` : `<div class="ia-salida">${esc(copiaError("invalid_json"))}</div>`;
  } catch (e) {
    if (form.isConnected) out.innerHTML = `<div class="ia-salida">${esc(copiaError(e && e.code))}</div>`;
  } finally {
    if (form.isConnected) { btn.disabled = false; stop.hidden = true; }
    if (iaCtl === ctl) iaCtl = null;
  }
}

/* ═══════════ DATOS: exportar / importar / borrar ═══════════ */
async function exportar() {
  const json = JSON.stringify(Object.assign({}, store, { exportado: new Date().toISOString() }), null, 2);
  const nombre = `contenido-lab-${hoy()}.json`;
  if (EN_ARTIFACT) {
    let dl = null; try { dl = await claude.use("downloads"); } catch { dl = null; }
    if (dl) { try { await dl.save({ filename: nombre, data: json }); toast("Respaldo guardado"); } catch (e) { if (e && e.code !== "cancelled" && e.code !== "declined") toast("No se pudo guardar el respaldo"); } return; }
  }
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([json], { type: "application/json" })); a.download = nombre; document.body.appendChild(a); a.click(); a.remove();
  toast("Respaldo descargado");
}
function importar(file) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = normalizar(JSON.parse(r.result));
      if (!confirm(`¿Importar ${d.piezas.length} piezas y ${d.inspiracion.length} referentes? Reemplaza lo que hay ahora.`)) return;
      store = d; ordenar(); guardarLocal();
      for (const p of store.piezas) escribir("piezas/" + p.id, p);
      for (const i of store.inspiracion) escribir("inspiracion/" + i.id, i);
      guardarConfig("perfil"); guardarConfig("seguidores"); guardarConfig("formulas");
      refrescar(); toast("Respaldo restaurado");
    } catch { toast("Ese archivo no es un respaldo válido"); }
  };
  r.readAsText(file);
}
function borrarTodo() {
  const ids = store.piezas.map(p => p.id), iids = store.inspiracion.map(i => i.id);
  store = vacio(); guardarLocal();
  try { localStorage.setItem("contenidoLab.inicializado", "1"); } catch { }
  for (const id of ids) borrarDoc("piezas/" + id);
  for (const id of iids) borrarDoc("inspiracion/" + id);
  guardarConfig("perfil"); guardarConfig("seguidores"); guardarConfig("formulas");
  refrescar(); toast("Todo borrado");
}
function leerCuentas(form) {
  const out = []; if (!form) return store.perfil.cuentas;
  for (let i = 0; i < 20; i++) { const u = form.elements["c_user_" + i]; if (!u) break; out.push({ plataforma: form.elements["c_plat_" + i].value, usuario: u.value.trim(), nicho: (form.elements["c_nicho_" + i] || {}).value?.trim() || "" }); }
  return out;
}
function aplicarTema(t) { ui.tema = t; guardarUI(); if (t === "auto") delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = t; }

/* ═══════════ EVENTOS ═══════════ */
function accion(a, b) {
  const id = b.dataset.id;
  switch (a) {
    case "vista": ir(b.dataset.vista); break;
    case "cerrar": cerrarSheet(); break;
    case "nueva-pieza": fichaPieza(null); break;
    case "ficha-pieza": fichaPieza(id); break;
    case "duplicar-pieza": {
      const p = store.piezas.find(x => x.id === id); if (!p) return;
      const c = nuevaPieza(JSON.parse(JSON.stringify(p)));
      Object.assign(c, { id: uid("p"), titulo: p.titulo + " (copia)", estado: "idea", metricas: {}, link: "", ejemplo: false, creado: Date.now(), actualizado: Date.now() });
      guardarPieza(c); refrescar(); toast("Pieza duplicada"); fichaPieza(c.id); break;
    }
    case "eliminar-pieza": if (confirm("¿Eliminar esta pieza?")) { eliminarPieza(id); cerrarSheet(); refrescar(); toast("Pieza eliminada"); } break;
    case "nueva-inspo": fichaInspo(null); break;
    case "ficha-inspo": fichaInspo(id); break;
    case "eliminar-inspo": if (confirm("¿Eliminar este referente?")) { eliminarInspo(id); cerrarSheet(); refrescar(); toast("Referente eliminado"); } break;
    case "convertir-inspo": convertirEnPieza(id); break;
    case "ia-analizar": iaAnalizar(b.closest("form")); break;
    case "ia-hooks": iaHooks(b.closest("form")); break;
    case "ia-stop": if (iaCtl) iaCtl.abort(); break;
    case "usar-variante": { const f = b.closest("form"); if (!f) return; f.elements.hook.value = b.dataset.hook || ""; if (b.dataset.tipo && HOOK_TIPOS[b.dataset.tipo]) f.elements.hookTipo.value = b.dataset.tipo; toast("Hook aplicado: recuerda guardar"); break; }
    case "nueva-formula": fichaFormula(); break;
    case "eliminar-formula": store.formulas = store.formulas.filter(f => f.id !== id); guardarLocal(); guardarConfig("formulas"); renderInspo(); break;
    case "usar-formula": { const f = [...FORMULAS, ...store.formulas].find(x => x.id === id); if (!f) return; fichaPieza(null, { hook: f.plantilla.replace(/\{\{(.+?)\}\}/g, "[$1]"), hookTipo: f.tipo }); break; }
    case "agregar-cuenta": store.perfil.cuentas = leerCuentas($("#formPerfil")); store.perfil.cuentas.push({ plataforma: "tiktok", usuario: "" }); renderMas(); break;
    case "quitar-cuenta": { const cs = leerCuentas($("#formPerfil")); cs.splice(+b.dataset.i, 1); store.perfil.cuentas = cs; guardarLocal(); guardarConfig("perfil"); renderMas(); break; }
    case "quitar-seguidor": store.seguidores.splice(+b.dataset.i, 1); guardarLocal(); guardarConfig("seguidores"); renderMas(); break;
    case "exportar": exportar(); break;
    case "cargar-ejemplos": cargarEjemplos(); refrescar(); toast("Ejemplos cargados"); break;
    case "borrar-ejemplos": if (confirm("¿Borrar los datos de ejemplo?")) { borrarEjemplos(); refrescar(); toast("Ejemplos borrados"); } break;
    case "borrar-todo": if (confirm("¿Borrar todas las piezas, referentes y registros? No hay vuelta atrás.")) borrarTodo(); break;
  }
}
document.addEventListener("click", e => {
  const t = e.target;
  const nav = t.closest("[data-vista]:not([data-accion])"); if (nav) { ir(nav.dataset.vista); return; }
  const modo = t.closest("[data-modo]"); if (modo) { ui.modo = modo.dataset.modo; guardarUI(); renderContenido(); return; }
  const tab = t.closest("[data-inspo-tab]"); if (tab) { ui.inspoTab = tab.dataset.inspoTab; guardarUI(); renderInspo(); return; }
  const fil = t.closest("[data-filtro]"); if (fil) { ui[fil.dataset.filtro] = fil.dataset.valor; guardarUI(); refrescar(); return; }
  const tema = t.closest("[data-tema]"); if (tema) { aplicarTema(tema.dataset.tema); renderMas(); return; }
  const b = t.closest("[data-accion]"); if (b) { accion(b.dataset.accion, b); return; }
  if (t === backdropEl) cerrarSheet();
});
document.addEventListener("change", e => {
  const s = e.target.closest("[data-filtro-select]"); if (s) { ui[s.dataset.filtroSelect] = s.value; guardarUI(); refrescar(); }
  if (e.target.id === "importarInput" && e.target.files && e.target.files[0]) { importar(e.target.files[0]); e.target.value = ""; }
});
document.addEventListener("input", e => {
  const i = e.target.closest("[data-filtro-input]");
  if (i) { ui[i.dataset.filtroInput] = i.value; guardarUI(); const id = i.id, pos = i.selectionStart; refrescar(); const n = document.getElementById(id); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch { } } return; }
  if (e.target.name === "estructura" && e.target.form) actualizarBeats(e.target.form);
});
document.addEventListener("submit", e => {
  const f = e.target; e.preventDefault();
  if (f.id === "formPieza") {
    const p = leerPieza(f, store.piezas.find(x => x.id === f.dataset.id) || nuevaPieza({ id: f.dataset.id }));
    if (!p.titulo) { toast("Ponle un título a la pieza"); f.elements.titulo.focus(); return; }
    guardarPieza(p); cerrarSheet(); refrescar(); toast("Pieza guardada");
  } else if (f.id === "formInspo") {
    const it = leerInspo(f, store.inspiracion.find(x => x.id === f.dataset.id) || nuevaInspo({ id: f.dataset.id }));
    if (!it.autor && !it.hook) { toast("Anota al menos el autor o el hook"); f.elements.autor.focus(); return; }
    guardarInspo(it); cerrarSheet(); refrescar(); toast("Referente guardado");
  } else if (f.id === "formFormula") {
    const fd = new FormData(f); const nombre = String(fd.get("nombre") || "").trim(), plantilla = String(fd.get("plantilla") || "").trim();
    if (!nombre || !plantilla) { toast("Nombre y plantilla son obligatorios"); return; }
    store.formulas.push({ id: uid("f"), nombre, tipo: String(fd.get("tipo")), plantilla, ejemplo: String(fd.get("ejemplo") || "").trim() });
    guardarLocal(); guardarConfig("formulas"); cerrarSheet(); renderInspo(); toast("Fórmula guardada");
  } else if (f.id === "formPerfil") {
    store.perfil.nombre = f.elements.nombre.value.trim() || "David"; store.perfil.nicho = f.elements.nicho.value.trim(); store.perfil.cuentas = leerCuentas(f).filter(c => c.usuario);
    guardarLocal(); guardarConfig("perfil"); toast("Perfil guardado"); renderMas();
  } else if (f.id === "formSeguidor") {
    const fd = new FormData(f); const total = num(fd.get("total"));
    if (!fd.get("fecha") || !total) { toast("Fecha y total son obligatorios"); return; }
    store.seguidores.push({ fecha: String(fd.get("fecha")), plataforma: String(fd.get("plataforma")), total });
    ordenar(); guardarLocal(); guardarConfig("seguidores"); renderMas(); toast("Registro anotado");
  }
});
document.addEventListener("keydown", e => { if (e.key === "Escape" && sheetEl.classList.contains("abierta")) cerrarSheet(); });

/* Tooltip de las gráficas (también con teclado) */
const tipEl = $("#tip");
function mostrarTip(el, x, y) {
  const t = el.dataset.tip; if (!t) { tipEl.hidden = true; return; }
  tipEl.textContent = t; tipEl.hidden = false;
  const r = tipEl.getBoundingClientRect();
  let L = x + 14, T = y + 14;
  if (L + r.width > window.innerWidth - 8) L = Math.max(8, x - r.width - 10);
  if (T + r.height > window.innerHeight - 8) T = Math.max(8, y - r.height - 10);
  tipEl.style.left = L + "px"; tipEl.style.top = T + "px";
}
document.addEventListener("pointermove", e => { const el = e.target.closest && e.target.closest("[data-tip]"); if (!el) { if (!tipEl.hidden) tipEl.hidden = true; return; } mostrarTip(el, e.clientX, e.clientY); });
document.addEventListener("pointerdown", e => { const el = e.target.closest && e.target.closest("[data-tip]"); if (el) mostrarTip(el, e.clientX, e.clientY); else tipEl.hidden = true; });
document.addEventListener("focusin", e => { const el = e.target.closest && e.target.closest("[data-tip]"); if (el) { const r = el.getBoundingClientRect(); mostrarTip(el, r.left + r.width / 2, r.top); } });
document.addEventListener("focusout", () => { tipEl.hidden = true; });

/* ═══════════ ARRANQUE ═══════════ */
function iniciar() {
  cargarUI();
  if (!EN_ARTIFACT && ui.tema && ui.tema !== "auto") document.documentElement.dataset.theme = ui.tema;
  const local = cargarLocal();
  let inicializado = false; try { inicializado = !!localStorage.getItem("contenidoLab.inicializado"); } catch { }
  if (local) store = local;
  else if (!EN_ARTIFACT && !inicializado) {
    store = normalizar({ perfil: JSON.parse(JSON.stringify(EJEMPLOS.perfil)), piezas: EJEMPLOS.piezas, inspiracion: EJEMPLOS.inspiracion, seguidores: EJEMPLOS.seguidores.map(s => Object.assign({ ejemplo: true }, s)) });
    guardarLocal();
  }
  try { localStorage.setItem("contenidoLab.inicializado", "1"); } catch { }
  ordenar();
  ir(["inicio", "contenido", "stats", "inspo", "mas"].includes(ui.vista) ? ui.vista : "inicio");
  iniciarSync(); iniciarIA();
}
iniciar();
