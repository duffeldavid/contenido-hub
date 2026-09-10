// ════════════════════════════════════════════════════════════
// ESTUDIO — espacio privado de David: proyectos por cliente,
// objetivos, flujo de caja y finanzas. Aparte del Contenido Hub
// (que queda solo para el flujo de contenidos con el equipo).
//
// Reutiliza finanzas.js (se carga antes). Todo vive en localStorage:
// contenidoHub.finanzas y contenidoHub.proyectos — nunca se publica.
// ════════════════════════════════════════════════════════════
const EN_ARTIFACT = !!(window.claude && typeof window.claude.use === "function");
const MODO_CLIENTE = false;
const CLAVE_DAVID = "Duffel21";
const ENLACE_HUB = window.ENLACE_HUB || "index.html";
const ES_ACCESO_KEY = "hubAccesoEstudio";

// ---------- Helpers compartidos (mismos nombres que en app.js) ----------
function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function isoDe(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function hoyISO() { return isoDe(new Date()); }
function sumarDias(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  return isoDe(new Date(y, m - 1, d + n));
}
const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
function fmtFecha(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return { dia: DIAS[date.getDay()], num: d, date };
}
function fmtCorta(iso) {
  const { dia, num } = fmtFecha(iso);
  const mes = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"][Number(iso.slice(5, 7)) - 1];
  return `${dia.toLowerCase().slice(0, 3)} ${num} ${mes}`;
}
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
const ICOL = {
  ok: '<svg class="icl" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8.3 12.4l2.5 2.5 4.9-5.3"/></svg>',
  ajuste: '<svg class="icl" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5l4 4L7 21l-4 1 1-4L16.5 3.5z"/></svg>',
  reloj: '<svg class="icl" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/></svg>',
  descarga: '<svg class="icl" viewBox="0 0 24 24"><path d="M12 3v11M7 10l5 5 5-5M4 20h16"/></svg>',
  chispa: '<svg class="icl" viewBox="0 0 24 24"><path d="M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 18.5l-1.9-5.7-5.6-1.9L10.1 9 12 3.5z"/></svg>',
  musica: '<svg class="icl" viewBox="0 0 24 24"><path d="M9 18V5.5L20 3.5V16"/><circle cx="6.4" cy="18" r="2.6"/><circle cx="17.4" cy="16" r="2.6"/></svg>',
  paleta: '<svg class="icl" viewBox="0 0 24 24"><path d="M12 21a9 9 0 1 1 9-9c0 2.2-1.5 3.4-3 3.4h-2.2a2 2 0 0 0-1.4 3.4c.6.6.2 2.2-2.4 2.2z"/><circle cx="7.6" cy="11" r="1"/><circle cx="11" cy="7.6" r="1"/><circle cx="15.5" cy="8.5" r="1"/></svg>',
  hoja: '<svg class="icl" viewBox="0 0 24 24"><path d="M4 20C6 8 12 4 20 4c0 10-6 15-14 15"/><path d="M4 20c2-5 5-8 10-10"/></svg>',
  video: '<svg class="icl" viewBox="0 0 24 24"><rect x="2.5" y="6" width="13" height="12" rx="2.5"/><path d="M15.5 10.5 21 7.5v9l-5.5-3z"/></svg>',
  capas: '<svg class="icl" viewBox="0 0 24 24"><rect x="7" y="7" width="14" height="14" rx="3"/><path d="M3 15V6a3 3 0 0 1 3-3h9"/></svg>',
  enlace: '<svg class="icl" viewBox="0 0 24 24"><path d="M7 17 17 7M8 7h9v9"/></svg>',
  candado: '<svg class="icl" viewBox="0 0 24 24"><rect x="4" y="10.5" width="16" height="10.5" rx="3"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/><circle cx="12" cy="15.8" r="1.2"/></svg>',
  caja: '<svg class="icl" viewBox="0 0 24 24"><path d="M21 8 12 3 3 8v8l9 5 9-5V8z"/><path d="m3 8 9 5 9-5M12 13v8"/></svg>',
};
const icl = n => ICOL[n] || "";
function toastVivo(txt) {
  let t = document.getElementById("toastLive");
  if (!t) { t = document.createElement("div"); t.id = "toastLive"; t.className = "toast-live"; document.body.appendChild(t); }
  t.textContent = txt;
  t.classList.add("on");
  clearTimeout(t._h);
  t._h = setTimeout(() => t.classList.remove("on"), 6000);
}

// ---------- Drawer (ficha flotante) ----------
const drawer = document.getElementById("drawer");
const backdrop = document.getElementById("drawerBackdrop");
let ultimoClickY = 0;
document.addEventListener("pointerdown", e => { ultimoClickY = e.clientY; }, { passive: true });
function posicionarDrawer() {
  const alto = Math.min(window.innerHeight * 0.78, 720);
  let top = window.scrollY + ultimoClickY - alto / 2;
  top = Math.max(window.scrollY + 12, Math.min(top, window.scrollY + window.innerHeight - alto - 12));
  drawer.style.top = Math.max(12, top) + "px";
}
function closeDrawer() {
  if (drawer.contains(document.activeElement)) document.activeElement.blur();
  drawer.classList.remove("open");
  backdrop.classList.remove("open");
}
backdrop.addEventListener("click", closeDrawer);
document.addEventListener("keydown", e => { if (e.key === "Escape") closeDrawer(); });

// Calendario propio (idéntico al del hub)
function pintarCalPanel(panel, isoSel, onPick) {
  if (!panel.dataset.mes) panel.dataset.mes = isoSel.slice(0, 7);
  const [a, mes] = panel.dataset.mes.split("-").map(Number);
  const hoyIso = hoyISO();
  const primero = new Date(a, mes - 1, 1);
  const diasMes = new Date(a, mes, 0).getDate();
  const inicio = (primero.getDay() + 6) % 7;
  const titulo = primero.toLocaleDateString("es-CO", { month: "long", year: "numeric" });
  let celdas = "";
  for (let i = 0; i < inicio; i++) celdas += `<span></span>`;
  for (let d = 1; d <= diasMes; d++) {
    const isoD = `${a}-${String(mes).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    celdas += `<button type="button" class="calp-dia ${isoD === isoSel ? "sel" : ""} ${isoD === hoyIso ? "hoy" : ""}" data-iso="${isoD}">${d}</button>`;
  }
  panel.innerHTML = `
    <div class="calp-head">
      <button type="button" class="calp-nav" data-nav="-1" aria-label="Mes anterior">‹</button>
      <span class="calp-mes">${titulo}</span>
      <button type="button" class="calp-nav" data-nav="1" aria-label="Mes siguiente">›</button>
    </div>
    <div class="calp-grid">
      ${["L", "M", "M", "J", "V", "S", "D"].map(l => `<span class="calp-dow">${l}</span>`).join("")}
      ${celdas}
    </div>`;
  panel.querySelectorAll(".calp-nav").forEach(b => b.onclick = () => {
    const f = new Date(a, mes - 1 + Number(b.dataset.nav), 1);
    panel.dataset.mes = `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}`;
    pintarCalPanel(panel, isoSel, onPick);
  });
  panel.querySelectorAll(".calp-dia").forEach(b => b.onclick = () => onPick(b.dataset.iso));
}

// ---------- Datos privados (mismas claves que usaba el hub) ----------
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

// ---------- Hoja de cálculo (motor de fórmulas, igual al del hub) ----------
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
  expr = expr.replace(/,/g, ".");
  if (!/^[\d+\-*/().]*$/.test(expr)) return "#ERROR";
  try {
    const v = Function('"use strict";return(' + expr + ")")();
    return typeof v === "number" && isFinite(v) ? v : "#ERROR";
  } catch { return "#ERROR"; }
}

// ════════════════════════════════════════════════════════════
// CLIENTES Y PROYECTOS — cada cliente tiene su espacio: su modelo
// de trabajo, su dinero en el pipeline y sus planes de 4 semanas
// ════════════════════════════════════════════════════════════
const PLANTILLAS_PRO = {
  diseno: { n: "Diseño y marca", ic: "paleta", color: "#E9C46A", desc: "Identidad, dirección de arte y piezas", fases: [
    { n: "Semana 1 · Brief e investigación", tareas: ["Escribir el brief en una página", "Moodboard y referencias por lámina", "Benchmark de la competencia", "Definir el concepto creativo"] },
    { n: "Semana 2 · Propuestas", tareas: ["Explorar 3 rutas visuales rápidas", "Elegir la ruta ganadora", "Desarrollar la propuesta elegida", "Contrastarla contra el brief"] },
    { n: "Semana 3 · Desarrollo", tareas: ["Aplicar el feedback", "Desarrollar piezas y variantes", "Afinar tipografía, ritmo y color", "Preparar artes finales"] },
    { n: "Semana 4 · Entrega", tareas: ["Exportar en todos los formatos", "Armar la presentación de entrega", "Entregar y archivar ordenado", "Retro: qué repetir y qué mejorar"] },
  ]},
  audiovisual: { n: "Audiovisual", ic: "video", color: "#8EC5FF", desc: "Producción de video y foto", fases: [
    { n: "Semana 1 · Preproducción", tareas: ["Brief y objetivo de la pieza", "Guion o escaleta", "Referencias de estilo y ritmo", "Plan de rodaje: locaciones, equipo, horarios"] },
    { n: "Semana 2 · Rodaje", tareas: ["Checklist de equipo (A7V, audio, luz)", "Grabar según plan", "Tomas de apoyo y B-roll", "Respaldar el material en dos discos"] },
    { n: "Semana 3 · Edición", tareas: ["Selección y organización del material", "Primer corte", "Color, sonido y gráficos", "Revisión con el cliente"] },
    { n: "Semana 4 · Entrega", tareas: ["Ajustes finales", "Exportar en los formatos de cada red", "Entregar y archivar", "Retro del proyecto"] },
  ]},
  contenido: { n: "Contenido digital", ic: "capas", color: "#4ADE80", desc: "Calendario mensual y piezas para redes", fases: [
    { n: "Semana 1 · Planificación", tareas: ["Renovar el calendario del mes", "Enviar a aprobación de mercadeo", "Aplicar los ajustes recibidos", "Plan de rodaje (2 sesiones)"] },
    { n: "Semana 2 · Rodaje 1", tareas: ["Sesión 1 en tienda", "Respaldar el material", "Editar las primeras piezas", "Programar la primera quincena"] },
    { n: "Semana 3 · Rodaje 2", tareas: ["Sesión 2 en finca o campo", "Editar piezas restantes", "Historias de la semana", "Programar la segunda quincena"] },
    { n: "Semana 4 · Cierre", tareas: ["Publicar lo pendiente", "Revisar métricas del mes", "Facturar el retainer", "Preparar el mes siguiente"] },
  ]},
  personal: { n: "Personal", ic: "hoja", color: "#B79CFF", desc: "Metas propias con método y sin presión", fases: [
    { n: "Semana 1 · Claridad", tareas: ["Escribir la meta y el porqué", "Definir cómo se ve \"logrado\"", "Partirla en pasos pequeños", "Agendar los bloques en el calendario"] },
    { n: "Semana 2 · Arranque", tareas: ["Completar el primer paso", "Eliminar un obstáculo del camino", "Registrar el avance", "Ajustar el plan si algo no fluye"] },
    { n: "Semana 3 · Constancia", tareas: ["Mantener el ritmo: 3+ sesiones", "Pedir feedback o apoyo", "Celebrar un avance visible", "Revisar qué falta para cerrar"] },
    { n: "Semana 4 · Cierre", tareas: ["Completar lo esencial", "Evaluar el resultado contra la meta", "Documentar los aprendizajes", "Elegir el siguiente proyecto"] },
  ]},
};
const CLIENTE_TIPOS = { retainer: "Retainer mensual", marca: "Identidad de marca", audiovisual: "Producción audiovisual", personal: "Personal" };

function proMigrar() {
  if (!Array.isArray(pros.lista)) pros.lista = [];
  if (!Array.isArray(pros.clientes)) {
    const s = window.FIN_SEMILLA && Array.isArray(window.FIN_SEMILLA.clientes) ? window.FIN_SEMILLA.clientes : [];
    pros.clientes = s.map(c => Object.assign({}, c));
  }
  pros.clientes = pros.clientes.filter(c => c && typeof c === "object").map(c => {
    c.id = String(c.id || finId("c")); c.nombre = String(c.nombre || ""); c.tipo = CLIENTE_TIPOS[c.tipo] ? c.tipo : "marca";
    c.notas = String(c.notas || ""); return c;
  });
  pros.lista = pros.lista.filter(p => p && typeof p === "object" && PLANTILLAS_PRO[p.tipo || "diseno"]).map(p => {
    if (!PLANTILLAS_PRO[p.tipo]) p.tipo = "diseno";
    if (!p.hecho || typeof p.hecho !== "object") p.hecho = {};
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(p.inicio || ""))) p.inicio = hoyISO();
    return p;
  });
}
function normalizarNombre(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim(); }
// Ítems del pipeline de un cliente: por id o por nombre parecido
function pipelineDe(c) {
  const n = normalizarNombre(c.nombre);
  const palabras = n.split(" ").filter(w => w.length > 3);
  return finPipelineActivo().filter(p => {
    if (p.clienteId === c.id) return true;
    const pn = normalizarNombre(p.cliente);
    return pn && (pn === n || n.includes(pn) || pn.includes(n) || palabras.some(w => pn.includes(w)));
  });
}
function proyectosDe(c) { return pros.lista.filter(p => p.cliente === c.id); }
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
function anillo(pct, size = 48, color = "#E9C46A") {
  const r = (size - 7) / 2, c = 2 * Math.PI * r;
  return `<svg class="anillo" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="5"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round"
      stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c * (1 - pct)).toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})" style="transition:stroke-dashoffset .4s cubic-bezier(.32,.72,.28,1)"/>
    <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="${size / 4.4}" font-weight="700" fill="#fff">${Math.round(pct * 100)}%</text>
  </svg>`;
}
function dineroDe(c) {
  const items = pipelineDe(c);
  const suma = fn => items.filter(fn).reduce((s, p) => s + finMonto(p.valor), 0);
  const cobrar = items.filter(p => p.estado === "facturado" || p.estado === "aprobado").sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
  return { items, cotizacion: suma(p => p.estado === "cotizacion"), curso: suma(p => p.estado === "aprobado" || p.estado === "ejecucion"), facturado: suma(p => p.estado === "facturado"), pagado: suma(p => p.estado === "pagado"), siguiente: cobrar[0] };
}

function renderProyectos() {
  const el = document.getElementById("view-proyectos");
  if (!el) return;
  proMigrar();
  const activos = pros.lista.filter(p => progresoDe(p).pct < 1);
  el.innerHTML = `
    <div class="es-head">
      <div>
        <p class="es-eyebrow">Proyectos</p>
        <h2 class="es-h2">Un espacio por cliente</h2>
        <p class="es-lead">Cada proyecto con su modelo de trabajo, su dinero en el pipeline y su plan de 4 semanas. ${activos.length ? `${activos.length} ${activos.length === 1 ? "plan activo" : "planes activos"}.` : ""}</p>
      </div>
      <button class="btn-primary" id="esNuevoCliente">＋ Nuevo cliente</button>
    </div>
    ${pros.clientes.length ? `<div class="cli-grid">${pros.clientes.map(c => {
      const d = dineroDe(c);
      const planes = proyectosDe(c).filter(p => progresoDe(p).pct < 1);
      const plan = planes[0];
      const sig = plan ? siguienteAccion(plan) : null;
      return `
      <article class="cli-card" data-cliente="${c.id}">
        <div class="cli-top">
          <div>
            <span class="cli-tipo">${CLIENTE_TIPOS[c.tipo]}</span>
            <h3 class="cli-nom">${esc(c.nombre)}</h3>
            ${c.marcas && c.marcas.length ? `<span class="cli-marcas">${c.marcas.map(esc).join(" · ")}</span>` : ""}
          </div>
          ${plan ? anillo(progresoDe(plan).pct, 52) : `<span class="cli-sin-plan">Sin plan</span>`}
        </div>
        <div class="cli-dinero">
          ${d.facturado ? `<span><b class="acento">${fmtCOP(d.facturado)}</b> por cobrar</span>` : ""}
          ${d.curso ? `<span><b>${fmtCOP(d.curso)}</b> en curso</span>` : ""}
          ${d.cotizacion ? `<span><b>${fmtCOP(d.cotizacion)}</b> cotizado</span>` : ""}
          ${!d.items.length ? `<span class="cli-dim">Sin movimientos en el pipeline</span>` : ""}
        </div>
        ${sig ? `<div class="cli-sig"><span class="cli-sig-lbl">Siguiente acción · ${esc(plan.nombre)}</span>${esc(sig.texto)}</div>` : ""}
        ${d.siguiente ? `<div class="cli-cobro">${d.siguiente.estado === "facturado" ? "Cobro" : "Anticipo"} ${finFechaCorta(d.siguiente.fecha)} · ${fmtCOP(d.siguiente.valor)}</div>` : ""}
        <div class="cli-acc">
          ${c.enlace ? `<a class="btn-primary chico" href="${esc(c.enlace)}">${icl("enlace")} ${esc(c.enlaceTxt || "Abrir espacio")}</a>` : ""}
          <button class="btn-ghost chico" data-abrir="${c.id}">Ver cliente</button>
        </div>
      </article>`;
    }).join("")}</div>` : `<div class="fx-vacio">Agrega tu primer cliente y verás aquí su espacio de trabajo.</div>`}
    ${pros.lista.length ? `
    <div class="es-sub"><h3>Planes de 4 semanas</h3><button class="btn-ghost chico" id="esNuevoPlan">＋ Nuevo plan</button></div>
    <div class="pro-grid">${pros.lista.map(pr => {
      const t = PLANTILLAS_PRO[pr.tipo], prog = progresoDe(pr), sig = siguienteAccion(pr);
      const c = pros.clientes.find(x => x.id === pr.cliente);
      const entrega = sumarDias(pr.inicio, 27);
      const quedan = Math.ceil((new Date(entrega + "T12:00:00") - new Date(hoyISO() + "T12:00:00")) / 86400000);
      return `
      <article class="pro-card ${prog.pct >= 1 ? "lograda" : ""}" data-pro="${pr.id}">
        <div class="pro-card-top">
          <span class="pro-ico" style="color:${t.color}">${icl(t.ic)}</span>
          <div class="pro-card-tit"><h4>${esc(pr.nombre)}</h4><span class="pro-tipo">${t.n}${c ? " · " + esc(c.nombre) : ""}</span></div>
          ${anillo(prog.pct, 44, t.color)}
        </div>
        ${sig ? `<div class="pro-sig"><span class="pro-sig-lbl">Siguiente acción</span>${esc(sig.texto)}</div>` : `<div class="pro-sig hecho">Completado</div>`}
        <div class="pro-pie"><span>${prog.hechas}/${prog.total} tareas</span><span>${prog.pct >= 1 ? "entregado" : quedan >= 0 ? `entrega en ${quedan} d` : `${-quedan} d de retraso`}</span></div>
      </article>`;
    }).join("")}</div>` : ""}`;
  el.querySelector("#esNuevoCliente").onclick = () => openCliente(null);
  const np = el.querySelector("#esNuevoPlan"); if (np) np.onclick = () => openNuevoProyecto(null);
  el.querySelectorAll("[data-abrir]").forEach(b => b.onclick = () => openCliente(b.dataset.abrir));
  el.querySelectorAll(".cli-card").forEach(card => card.onclick = e => { if (e.target.closest("a, button")) return; openCliente(card.dataset.cliente); });
  el.querySelectorAll(".pro-card").forEach(card => card.onclick = () => openProyecto(card.dataset.pro));
}
function abrirDrawer() {
  if (!drawer.classList.contains("open")) posicionarDrawer();
  drawer.classList.add("open");
  backdrop.classList.add("open");
  drawer.querySelector("#drawerClose").onclick = closeDrawer;
}
function openCliente(id) {
  proMigrar();
  const nuevo = !id;
  const c = nuevo ? { id: finId("c"), nombre: "", tipo: "marca", notas: "", marcas: [] } : pros.clientes.find(x => x.id === id);
  if (!c) return;
  const d = nuevo ? { items: [], siguiente: null } : dineroDe(c);
  const planes = nuevo ? [] : proyectosDe(c);
  drawer.innerHTML = `
    <button class="close-btn" id="drawerClose" aria-label="Cerrar">✕</button>
    <h2>${nuevo ? "Nuevo cliente" : esc(c.nombre)}</h2>
    <div class="sub">${nuevo ? "Un espacio de trabajo propio" : CLIENTE_TIPOS[c.tipo]}</div>
    <section>
      <h4>Nombre</h4>
      <input class="edit-input" id="ecNombre" value="${esc(c.nombre)}" placeholder="Ej. Nombre del cliente o del proyecto" autocomplete="off">
      <div class="aprob-pills fx-pills fx-pills-4" id="ecTipo" style="margin-top:10px">
        ${Object.entries(CLIENTE_TIPOS).map(([k, n]) => `<button data-tipo="${k}" class="${c.tipo === k ? "sel" : ""}">${n}</button>`).join("")}
      </div>
    </section>
    <section>
      <h4>Marcas o frentes (separados por coma)</h4>
      <input class="edit-input" id="ecMarcas" value="${esc((c.marcas || []).join(", "))}" placeholder="Ej. Café Forestal, Carnes Manzanares" autocomplete="off">
    </section>
    <section>
      <h4>Enlace a su espacio de trabajo (opcional)</h4>
      <input class="edit-input" id="ecEnlace" value="${esc(c.enlace || "")}" placeholder="Ej. index.html (Contenido Hub) o un enlace de Notion" autocomplete="off">
    </section>
    ${!nuevo ? `
    <section>
      <h4>Dinero en el pipeline</h4>
      ${d.items.length ? `<div class="ec-lista">${d.items.map(p => `
        <button class="ec-item" data-fin="${p.id}">
          <span class="ec-item-nom"><b>${esc(p.servicio || p.cliente)}</b><small>${finFechaCorta(p.fecha)}</small></span>
          ${finBadge(p.estado)}
          <span class="ec-item-val">${fmtCOP(p.valor)}</span>
        </button>`).join("")}</div>` : `<p class="fin-hint">Nada todavía. Los ítems del pipeline con este cliente aparecen aquí.</p>`}
      <button class="btn-ghost chico" id="ecNuevoFin" style="margin-top:10px">＋ Cotización o proyecto</button>
    </section>
    <section>
      <h4>Planes de 4 semanas</h4>
      ${planes.length ? `<div class="ec-lista">${planes.map(pr => { const t = PLANTILLAS_PRO[pr.tipo], prog = progresoDe(pr); return `
        <button class="ec-item" data-plan="${pr.id}">
          <span class="ec-item-nom"><b>${esc(pr.nombre)}</b><small>${t.n} · ${prog.hechas}/${prog.total}</small></span>
          ${anillo(prog.pct, 36, t.color)}
        </button>`; }).join("")}</div>` : `<p class="fin-hint">Sin planes aún. Un plan de 4 semanas ordena el proyecto de la idea a la entrega.</p>`}
      <button class="btn-ghost chico" id="ecNuevoPlan" style="margin-top:10px">＋ Nuevo plan</button>
    </section>` : ""}
    <section>
      <h4>Notas</h4>
      <textarea class="aprob-comment" id="ecNotas" placeholder="Contactos, condiciones, acuerdos…">${esc(c.notas || "")}</textarea>
    </section>
    <div class="fx-drawer-acciones">
      ${nuevo ? `<button class="btn-primary" id="ecCrear">Crear cliente</button>` : `<button class="btn-primary" id="ecListo">Listo</button>`}
      ${!nuevo ? `<button class="link-btn" id="ecEliminar" style="color:#F28B82">Eliminar cliente</button>` : ""}
    </div>`;
  abrirDrawer();
  const leer = () => {
    c.nombre = drawer.querySelector("#ecNombre").value.trim();
    c.marcas = drawer.querySelector("#ecMarcas").value.split(",").map(s => s.trim()).filter(Boolean);
    c.enlace = drawer.querySelector("#ecEnlace").value.trim();
    c.notas = drawer.querySelector("#ecNotas").value.trim();
  };
  const persistir = () => { if (nuevo) return; leer(); guardarPro(); renderProyectos(); renderInicio(); };
  ["#ecNombre", "#ecMarcas", "#ecEnlace", "#ecNotas"].forEach(sel => {
    const i = drawer.querySelector(sel);
    i.onchange = persistir;
    if (i.tagName === "INPUT") i.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); i.blur(); } };
  });
  drawer.querySelectorAll("#ecTipo button").forEach(b => b.onclick = () => {
    c.tipo = b.dataset.tipo;
    drawer.querySelectorAll("#ecTipo button").forEach(x => x.classList.toggle("sel", x === b));
    persistir();
  });
  if (nuevo) drawer.querySelector("#ecCrear").onclick = () => {
    leer();
    if (!c.nombre) { drawer.querySelector("#ecNombre").focus(); return; }
    pros.clientes.push(c);
    guardarPro(); closeDrawer(); renderProyectos(); renderInicio();
    toastVivo(`${c.nombre} ya tiene su espacio`);
  };
  else {
    drawer.querySelector("#ecListo").onclick = () => { leer(); guardarPro(); closeDrawer(); renderProyectos(); renderInicio(); };
    drawer.querySelector("#ecEliminar").onclick = () => {
      if (!confirm(`¿Eliminar a "${c.nombre}"? Sus planes y su dinero en el pipeline se conservan.`)) return;
      pros.clientes = pros.clientes.filter(x => x.id !== c.id);
      guardarPro(); closeDrawer(); renderProyectos(); renderInicio();
    };
    drawer.querySelectorAll("[data-fin]").forEach(b => b.onclick = () => openFinItem(b.dataset.fin));
    drawer.querySelectorAll("[data-plan]").forEach(b => b.onclick = () => openProyecto(b.dataset.plan));
    drawer.querySelector("#ecNuevoFin").onclick = () => openFinItem(null, { cliente: c.nombre, clienteId: c.id, tipo: c.tipo === "retainer" ? "retainer" : "proyecto" });
    drawer.querySelector("#ecNuevoPlan").onclick = () => openNuevoProyecto(c.id);
  }
  if (nuevo && matchMedia("(hover: hover)").matches) setTimeout(() => drawer.querySelector("#ecNombre").focus(), 80);
}
function openNuevoProyecto(clienteId) {
  proMigrar();
  const cli = pros.clientes.find(x => x.id === clienteId);
  drawer.innerHTML = `
    <button class="close-btn" id="drawerClose" aria-label="Cerrar">✕</button>
    <h2>Nuevo plan de 4 semanas</h2>
    <div class="sub">${cli ? esc(cli.nombre) + " · " : ""}De la idea a la entrega, con la metodología lista</div>
    <section>
      <h4>Nombre del proyecto</h4>
      <input class="edit-input" id="proNombre" placeholder="Ej. Manual de marca, Video institucional" autocomplete="off">
    </section>
    <section>
      <h4>Plantilla</h4>
      <div class="pro-tipos" id="proTipos">
        ${Object.entries(PLANTILLAS_PRO).map(([k, t]) => `<button data-tipo="${k}" class="${k === "diseno" ? "sel" : ""}"><span class="pro-ico" style="color:${t.color}">${icl(t.ic)}</span><b>${t.n}</b><small>${t.desc}</small></button>`).join("")}
      </div>
    </section>
    <section>
      <h4>Cliente</h4>
      <select class="edit-input" id="proCliente">
        <option value="">Sin cliente</option>
        ${pros.clientes.map(c => `<option value="${c.id}" ${c.id === clienteId ? "selected" : ""}>${esc(c.nombre)}</option>`).join("")}
      </select>
    </section>
    <section>
      <h4>Descripción (opcional)</h4>
      <input class="edit-input" id="proDesc" placeholder="Qué se entrega" autocomplete="off">
    </section>
    <div class="fx-drawer-acciones"><button class="btn-primary" id="proCrear">Crear plan</button></div>`;
  abrirDrawer();
  let tipo = "diseno";
  drawer.querySelectorAll("#proTipos button").forEach(b => b.onclick = () => { tipo = b.dataset.tipo; drawer.querySelectorAll("#proTipos button").forEach(x => x.classList.toggle("sel", x === b)); });
  drawer.querySelector("#proCrear").onclick = () => {
    const nombre = drawer.querySelector("#proNombre").value.trim();
    if (!nombre) { drawer.querySelector("#proNombre").focus(); return; }
    const pr = { id: "p" + Date.now().toString(36), nombre, tipo, desc: drawer.querySelector("#proDesc").value.trim(), inicio: hoyISO(), hecho: {}, notas: "", cliente: drawer.querySelector("#proCliente").value || "" };
    pros.lista.unshift(pr);
    guardarPro(); closeDrawer(); renderProyectos(); renderInicio();
    openProyecto(pr.id);
  };
  if (matchMedia("(hover: hover)").matches) setTimeout(() => drawer.querySelector("#proNombre").focus(), 80);
}
function openProyecto(id) {
  const pr = pros.lista.find(x => x.id === id);
  if (!pr) return;
  const t = PLANTILLAS_PRO[pr.tipo];
  const prog = progresoDe(pr), sig = siguienteAccion(pr);
  const cli = pros.clientes.find(x => x.id === pr.cliente);
  const semanaHoy = Math.min(3, Math.max(0, Math.floor((new Date(hoyISO() + "T12:00:00") - new Date(pr.inicio + "T12:00:00")) / (7 * 86400000))));
  drawer.innerHTML = `
    <button class="close-btn" id="drawerClose" aria-label="Cerrar">✕</button>
    <div class="pro-drawer-top">
      <span class="pro-ico grande" style="color:${t.color}">${icl(t.ic)}</span>
      <div style="flex:1">
        <h2 style="margin:0">${esc(pr.nombre)}</h2>
        <div class="sub" style="margin:2px 0 0">${t.n}${cli ? " · " + esc(cli.nombre) : ""} · inició ${fmtCorta(pr.inicio)} · entrega ${fmtCorta(sumarDias(pr.inicio, 27))}</div>
      </div>
      ${anillo(prog.pct, 56, t.color)}
    </div>
    ${sig ? `<div class="pro-sig" style="margin-top:14px"><span class="pro-sig-lbl">Siguiente acción</span>${esc(sig.texto)}</div>` : `<div class="pro-sig hecho" style="margin-top:14px">Todas las tareas completadas</div>`}
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
    <button class="link-btn" id="proEliminar" style="color:#F28B82">Eliminar plan</button>`;
  abrirDrawer();
  drawer.querySelectorAll("[data-tarea]").forEach(cb => {
    cb.onchange = () => {
      if (cb.checked) pr.hecho[cb.dataset.tarea] = true; else delete pr.hecho[cb.dataset.tarea];
      guardarPro();
      openProyecto(id);
      renderProyectos(); renderInicio();
    };
  });
  drawer.querySelector("#proNotas").onchange = e => { pr.notas = e.target.value; guardarPro(); };
  drawer.querySelector("#proEliminar").onclick = () => {
    if (!confirm(`¿Eliminar "${pr.nombre}" y todo su avance?`)) return;
    pros.lista = pros.lista.filter(x => x.id !== id);
    guardarPro(); closeDrawer(); renderProyectos(); renderInicio();
  };
}

// ════════════════════════════════════════════════════════════
// FINANZAS — liquidez, objetivos, flujo de caja, pipeline,
// simulador, cuentas fijas y hoja (módulos de finanzas.js)
// ════════════════════════════════════════════════════════════
function renderFinanzas() {
  const el = document.getElementById("view-finanzas");
  if (!el) return;
  const _ae = document.activeElement;
  if (_ae && el.contains(_ae) && /^(INPUT|TEXTAREA|SELECT)$/.test(_ae.tagName)) return;
  finMigrar();
  const tIngreso = finz.cuentas.reduce((s, c) => s + (parseNum(c.ingreso) || 0), 0);
  const tGastos = finz.cuentas.reduce((s, c) => s + (parseNum(c.gastos) || 0), 0);
  const neto = tIngreso - tGastos;
  el.innerHTML = `
  <div class="es-head">
    <div>
      <p class="es-eyebrow">Finanzas</p>
      <h2 class="es-h2">Flujo de caja con claridad</h2>
      <p class="es-lead">Lo que tienes, lo que entra, lo que sale y hacia dónde va. Solo tú lo ves: vive en este navegador.</p>
    </div>
  </div>
  <div class="fin-dark es-fin">
    ${finLiquidezHtml()}
    ${finObjetivosHtml()}
    ${finFlujoHtml()}
    ${finPipelineHtml()}
    ${finProyeccionHtml()}
    <div class="fin-panel">
      <div class="fin-panel-head"><h3>Gastos fijos y cuentas</h3><button class="btn-primary" id="finAgregar">＋ Agregar cuenta</button></div>
      <p class="fin-hint" style="margin:-6px 0 12px">Los gastos fijos de estas cuentas salen cada mes en el flujo de caja proyectado.</p>
      <div class="fin-tabla-wrap"><table class="fin-tabla">
        <thead><tr><th>Cuenta</th><th>Qué haces</th><th>Ingreso / mes</th><th>Gastos / mes</th><th>Neto</th><th></th></tr></thead>
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
        <span class="fin-hint">Como en Excel: escribe <b>=B2+B3</b>, <b>=SUMA(C1:C6)</b>, <b>=PROMEDIO(A1:A4)</b>, <b>=MAX</b>, <b>=MIN</b>.</span>
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
              return `<td><input class="hoja-celda ${esFormula ? "formula" : ""} ${typeof v === "number" ? "num" : ""} ${v === "#ERROR" || v === "#CIRC" ? "error" : ""}" data-ref="${ref}" value="${esc(fmtCell(v))}" spellcheck="false"></td>`;
            }).join("")}</tr>`;
          }).join("")}
        </tbody>
      </table></div>
      <div class="fin-hoja-pie">
        <button class="btn-ghost" id="finLimpiarHoja">Limpiar hoja</button>
        <button class="btn-ghost" id="finExportar">${icl("descarga")} Respaldar (JSON)</button>
        <button class="btn-ghost" id="finRestaurar">Restaurar respaldo</button>
        <input type="file" id="finRestaurarInput" accept="application/json,.json" hidden>
      </div>
    </div>
  </div>`;
  el.querySelectorAll("tr[data-cta] .celda").forEach(inp => {
    inp.onchange = () => {
      const c = finz.cuentas.find(x => x.id === inp.closest("tr").dataset.cta);
      if (!c) return;
      const campo = inp.dataset.campo;
      c[campo] = campo === "ingreso" || campo === "gastos" ? (parseNum(inp.value) || 0) : inp.value.trim();
      guardarFin(); finRender();
    };
  });
  el.querySelectorAll("[data-borrar]").forEach(b => b.onclick = () => {
    const c = finz.cuentas.find(x => x.id === b.dataset.borrar);
    if (!confirm(`¿Eliminar la cuenta "${c ? c.nombre : ""}"?`)) return;
    finz.cuentas = finz.cuentas.filter(x => x.id !== b.dataset.borrar);
    guardarFin(); finRender();
  });
  el.querySelector("#finAgregar").onclick = () => {
    finz.cuentas.push({ id: "c" + Date.now().toString(36), nombre: "", rol: "", ingreso: 0, gastos: 0 });
    guardarFin(); finRender();
    const fila = el.querySelector("tbody tr:last-child .celda");
    if (fila) fila.focus();
  };
  el.querySelectorAll(".hoja-celda").forEach(inp => {
    inp.onfocus = () => { inp.value = finz.celdas[inp.dataset.ref] || ""; inp.select(); };
    inp.onblur = () => {
      const ref = inp.dataset.ref, nuevo = inp.value.trim(), previo = finz.celdas[ref] || "";
      if (nuevo === String(previo)) { inp.value = fmtCell(valorCelda(ref)); return; }
      if (nuevo) finz.celdas[ref] = nuevo; else delete finz.celdas[ref];
      guardarFin(); finRender();
    };
    inp.onkeydown = e => {
      if (e.key === "Enter") { e.preventDefault(); inp.blur(); }
      if (e.key === "Escape") { inp.value = finz.celdas[inp.dataset.ref] || ""; inp.blur(); }
    };
  });
  el.querySelector("#finLimpiarHoja").onclick = () => { if (confirm("¿Vaciar todas las celdas de la hoja de cálculo?")) { finz.celdas = {}; guardarFin(); finRender(); } };
  el.querySelector("#finExportar").onclick = async () => {
    const payload = JSON.stringify({ exportado: new Date().toISOString(), finanzas: finz, proyectos: pros }, null, 2);
    const filename = "estudio-respaldo.json";
    if (EN_ARTIFACT) {
      try { const dl = await window.claude.use("downloads"); if (dl) { await dl.save({ filename, data: payload }); return; } } catch { return; }
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    a.download = filename; a.click();
  };
  finWire(el);
}

// ════════════════════════════════════════════════════════════
// INICIO — lo importante de un vistazo
// ════════════════════════════════════════════════════════════
// Lee el estado del Contenido Hub guardado en este navegador (misma clave
// localStorage) para contar ajustes de mercadeo pendientes y aprobadas.
function resumenHub() {
  let ajustes = 0, aprobadas = 0, mes = null;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!/^contenidoHub\.\d{4}-\d{2}$/.test(k)) continue;
      const s = JSON.parse(localStorage.getItem(k));
      if (!s || !s.aprob) continue;
      if (mes && k < mes) continue;
      mes = k; ajustes = 0; aprobadas = 0;
      for (const id in s.aprob) {
        const a = s.aprob[id];
        if (a.v === "Ajustar" && !a.ok) ajustes++;
        if (a.v === "Aprobado") aprobadas++;
      }
    }
  } catch {}
  return { ajustes, aprobadas, mes };
}
function renderInicio() {
  const el = document.getElementById("view-inicio");
  if (!el) return;
  finMigrar(); proMigrar();
  const L = finLiquidez();
  const S = finSumas();
  const hub = resumenHub();
  const objMes = finz.objetivos.find(o => o.tipo === "mes");
  const avance = objMes ? finObjetivoAvance(objMes) : null;
  const hoy = hoyISO();
  const saludo = new Date().getHours() < 12 ? "Buenos días" : new Date().getHours() < 19 ? "Buenas tardes" : "Buenas noches";
  const fecha = new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
  // Siguientes acciones: planes activos + cobros y pagos de la semana
  const acciones = [];
  pros.lista.forEach(pr => { const sig = siguienteAccion(pr); if (sig) acciones.push({ t: sig.texto, sub: pr.nombre, tipo: "plan", id: pr.id }); });
  const en7 = sumarDias(hoy, 7);
  L.cobrar.filter(p => p.fecha <= en7).forEach(p => acciones.push({ t: `${p.estado === "facturado" ? "Cobrar" : "Recibir anticipo de"} ${p.cliente}`, sub: `${fmtCOP(p.valor)} · ${finFechaCorta(p.fecha)}`, tipo: "cobro", id: p.id }));
  L.pagar.filter(p => p.fecha <= en7).forEach(p => acciones.push({ t: `Pagar ${p.nombre}`, sub: `${fmtCOP(p.valor)} · ${finFechaCorta(p.fecha)}`, tipo: "pago", id: p.id }));
  if (hub.ajustes) acciones.unshift({ t: `${hub.ajustes} ${hub.ajustes === 1 ? "ajuste" : "ajustes"} de mercadeo por atender`, sub: "Contenido Hub · Contenidos", tipo: "hub" });
  el.innerHTML = `
    <div class="es-hero">
      <p class="es-eyebrow">${fecha}</p>
      <h1 class="es-h1">${saludo}.<br><span class="es-h1-dim">Esto es lo que importa hoy.</span></h1>
    </div>
    <div class="es-stats">
      <button class="es-stat" data-ir="finanzas"><span class="es-stat-lbl">Caja actual</span><span class="es-stat-num">${fmtCOP(finz.caja)}</span><span class="es-stat-sub">En 15 días ≈ <b class="${L.proyeccion >= finMonto(finz.caja) ? "bien" : "mal"}">${fmtCOP(L.proyeccion)}</b></span></button>
      <button class="es-stat" data-ir="finanzas"><span class="es-stat-lbl">Por cobrar · 15 días</span><span class="es-stat-num bien">${fmtCOP(L.tCobrar)}</span><span class="es-stat-sub">${L.cobrar.length ? `${L.cobrar.length} ${L.cobrar.length === 1 ? "cobro" : "cobros"} · pendiente de cobro ${fmtCOP(S.pendiente)}` : "nada facturado vence"}</span></button>
      <button class="es-stat" data-ir="finanzas"><span class="es-stat-lbl">${objMes ? esc(objMes.nombre) : "Objetivo del mes"}</span><span class="es-stat-num">${avance ? Math.round(avance.pct * 100) + "%" : "—"}</span><span class="es-stat-sub">${avance ? `${fmtCOP(avance.actual)} de ${fmtCOP(avance.meta)}` : "define tu meta de ingresos"}</span>${avance ? `<span class="fx-obj-bar"><i style="width:${(avance.pct * 100).toFixed(1)}%"></i></span>` : ""}</button>
      <button class="es-stat" data-ir="proyectos"><span class="es-stat-lbl">Proyectos</span><span class="es-stat-num">${pros.clientes.length}</span><span class="es-stat-sub">${pros.clientes.length === 1 ? "cliente" : "clientes"} · ${pros.lista.filter(p => progresoDe(p).pct < 1).length} planes activos · en negociación ${fmtCOP(S.negociacion)}</span></button>
    </div>
    <div class="es-cols">
      <section class="es-card">
        <h3>Siguientes acciones</h3>
        ${acciones.length ? `<div class="es-acciones">${acciones.slice(0, 7).map(a => `
          <button class="es-accion ${a.tipo}" data-acc-tipo="${a.tipo}" data-acc-id="${a.id || ""}">
            <span class="es-accion-dot"></span>
            <span class="es-accion-txt"><b>${esc(a.t)}</b><small>${esc(a.sub)}</small></span>
          </button>`).join("")}</div>` : `<p class="fin-hint">Nada urgente. Crea un plan de 4 semanas o registra tu próximo cobro.</p>`}
      </section>
      <section class="es-card">
        <h3>Contenido Hub</h3>
        <p class="es-card-txt">El espacio de contenidos con el equipo de mercadeo sigue aparte, tal como está.</p>
        <div class="es-hub-stats">
          <span><b class="${hub.ajustes ? "mal" : ""}">${hub.ajustes}</b> ajustes por atender</span>
          <span><b class="bien">${hub.aprobadas}</b> piezas aprobadas</span>
        </div>
        <a class="btn-primary" href="${esc(ENLACE_HUB)}">${icl("enlace")} Abrir Contenido Hub</a>
      </section>
    </div>`;
  el.querySelectorAll("[data-ir]").forEach(b => b.onclick = () => activarVista(b.dataset.ir));
  el.querySelectorAll(".es-accion").forEach(b => b.onclick = () => {
    const t = b.dataset.accTipo, id = b.dataset.accId;
    if (t === "plan") openProyecto(id);
    else if (t === "cobro") openFinItem(id);
    else if (t === "pago") openFinPago(id);
    else if (t === "hub") location.href = ENLACE_HUB;
  });
}

// ---------- Navegación ----------
let vistaActiva = "inicio";
function activarVista(v) {
  vistaActiva = v;
  document.querySelectorAll("#nav button").forEach(x => x.classList.toggle("active", x.dataset.view === v));
  document.querySelectorAll(".view").forEach(x => x.classList.toggle("active", x.id === "view-" + v));
  try { sessionStorage.setItem("estudioUI", v); } catch {}
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (v === "finanzas") { finPintarVivo(document.getElementById("view-finanzas")); finPintarFlujo(document.getElementById("view-finanzas")); }
}
document.querySelectorAll("#nav button").forEach(b => b.onclick = () => activarVista(b.dataset.view));
function renderAll() { renderInicio(); renderProyectos(); renderFinanzas(); }

// ---------- Candado incógnito ----------
function desbloqueado() { try { return localStorage.getItem(ES_ACCESO_KEY) === "si"; } catch { return false; } }
function pedirClave() {
  const velo = document.getElementById("candado");
  velo.hidden = false;
  document.getElementById("app").hidden = true;
  const input = velo.querySelector("#claveInput");
  const probar = () => {
    if (input.value.trim() === CLAVE_DAVID) {
      try { localStorage.setItem(ES_ACCESO_KEY, "si"); } catch {}
      entrar();
    } else {
      velo.querySelector("#claveError").hidden = false;
      input.value = ""; input.focus();
    }
  };
  velo.querySelector("#claveBtn").onclick = probar;
  input.onkeydown = e => { if (e.key === "Enter") probar(); };
  if (matchMedia("(hover: hover)").matches) setTimeout(() => input.focus(), 120);
}
function entrar() {
  document.getElementById("candado").hidden = true;
  document.getElementById("app").hidden = false;
  renderAll();
  let ui = null;
  try { ui = sessionStorage.getItem("estudioUI"); } catch {}
  activarVista(ui && document.getElementById("view-" + ui) ? ui : "inicio");
}
document.getElementById("btnBloquear").onclick = () => {
  try { localStorage.removeItem(ES_ACCESO_KEY); } catch {}
  pedirClave();
};
if (desbloqueado()) entrar(); else pedirClave();
