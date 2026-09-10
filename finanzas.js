// ════════════════════════════════════════════════════════════
// FINANZAS — centro de liquidez, proyección de metas/deudas y
// pipeline de clientes. Módulo de la vista Finanzas de app.js
// (se carga ANTES de app.js; renderFinanzas lo invoca).
//
// Privado: todo vive en localStorage (FIN_KEY, junto con las cuentas y la
// hoja de cálculo). Nunca viaja con "Guardar cambios", ni al repo, ni al
// hub-state del artifact. Los datos de arranque salen de
// finanzas.semilla.js (archivo ignorado por git) o, si no existe, vacíos.
// ════════════════════════════════════════════════════════════

const FIN_ESTADOS = {
  cotizacion: { n: "Cotización enviada",           corto: "Cotización", c: "#9BB0CC" },
  aprobado:   { n: "Aprobado · esperando anticipo", corto: "Aprobado",   c: "#E9C46A" },
  ejecucion:  { n: "En ejecución",                  corto: "En curso",   c: "#9D8BE8" },
  facturado:  { n: "Facturado · esperando pago",    corto: "Facturado",  c: "#F28B82" },
  pagado:     { n: "Pagado",                        corto: "Pagado",     c: "#4ADE80" },
};
const FIN_ESTADOS_ORDEN = ["cotizacion", "aprobado", "ejecucion", "facturado", "pagado"];
const FIN_TIPOS = { retainer: "Retainer mensual", proyecto: "Proyecto" };
const FIN_PAGO_TIPOS = { tarjeta: "Tarjeta de crédito", software: "Software y herramientas", servicio: "Servicios", otro: "Otro" };
const FIN_ACENTO = "#F28B82";
const FIN_VERDE = "#4ADE80";
const FIN_VENTANA = 15; // días de la ventana de liquidez

// Semilla vacía (la real, con clientes y montos, está en finanzas.semilla.js)
const FIN_SEMILLA_BASE = {
  caja: 0,
  meta: { modo: "ahorro", nombre: "", total: 0, abono: 0, tasa: 0, inicial: 0 },
  pipeline: [],
  pagos: [],
  objetivos: [],
};
const finUI = { verPagos: false, verCobros: false, todosPagos: false, todosCobros: false };
let finSaveTimer = null;

function finSemilla() {
  const s = window.FIN_SEMILLA;
  return s && typeof s === "object" ? s : FIN_SEMILLA_BASE;
}
// Completa las claves nuevas en finz (cuentas/celdas ya existían)
function finMigrar() {
  const s = finSemilla();
  if (typeof finz.caja !== "number") finz.caja = parseNum(s.caja) || 0;
  if (!finz.meta || typeof finz.meta !== "object") {
    finz.meta = Object.assign({}, FIN_SEMILLA_BASE.meta, s.meta || {});
  }
  if (!Array.isArray(finz.pipeline)) finz.pipeline = (s.pipeline || []).map(x => Object.assign({}, x));
  if (!Array.isArray(finz.pagos)) finz.pagos = (s.pagos || []).map(x => Object.assign({}, x));
  if (!Array.isArray(finz.objetivos)) finz.objetivos = (s.objetivos || []).map(x => Object.assign({}, x));
  finz.pipeline = finNormalizarLista(finz.pipeline, "f");
  finz.pagos = finNormalizarLista(finz.pagos, "g");
  finz.objetivos = finNormalizarLista(finz.objetivos, "o");
}
// Deja cada registro con la forma esperada (respaldos viejos, semillas a mano)
function finNormalizarLista(lista, pref) {
  const hoy = hoyISO();
  return lista.filter(x => x && typeof x === "object").map(x => {
    x.id = String(x.id || finId(pref));
    if ("valor" in x || pref === "f" || pref === "g") x.valor = finMonto(x.valor);
    if (pref === "f" || pref === "g") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(x.fecha || ""))) x.fecha = hoy;
    }
    if (pref === "f") {
      if (!FIN_ESTADOS[x.estado]) x.estado = "cotizacion";
      if (x.tipo !== "retainer") x.tipo = "proyecto";
      x.cliente = String(x.cliente || ""); x.servicio = String(x.servicio || "");
    }
    if (pref === "g") x.nombre = String(x.nombre || "");
    if (pref === "o") { x.meta = finMonto(x.meta); x.actual = finMonto(x.actual); x.nombre = String(x.nombre || ""); if (!["mes", "anio", "ahorro"].includes(x.tipo)) x.tipo = "ahorro"; }
    return x;
  });
}
// Repinta la vista aunque un botón/campo de la propia vista tenga el foco
function finRender() {
  const ae = document.activeElement, el = document.getElementById("view-finanzas");
  if (ae && el && el.contains(ae) && ae.blur) ae.blur();
  renderFinanzas();
}
// ---------- Candado: Finanzas es solo de David (clave, recordada por navegador) ----------
const FIN_ACCESO_KEY = "hubAccesoFinanzas";
function finDesbloqueada() { try { return localStorage.getItem(FIN_ACCESO_KEY) === "si"; } catch { return false; } }
function finBloquear() { try { localStorage.removeItem(FIN_ACCESO_KEY); } catch {} finRender(); }
function finPintarCandado(el) {
  el.innerHTML = `
  <div class="fin-dark"><div class="fx-candado">
    <span class="fx-candado-ico"><svg class="icl" viewBox="0 0 24 24"><rect x="4" y="10.5" width="16" height="10.5" rx="3"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/><circle cx="12" cy="15.8" r="1.2"/></svg></span>
    <h3>Finanzas es solo tuyo</h3>
    <p>Caja, pipeline y proyecciones viven únicamente en este navegador. Escribe tu clave para abrir la sección.</p>
    <input type="password" class="edit-input" id="fxClave" placeholder="Clave de acceso" autocomplete="off">
    <button class="btn-primary" id="fxClaveBtn">Abrir Finanzas</button>
    <p class="fx-candado-error" id="fxClaveError" hidden>Clave incorrecta, inténtalo de nuevo.</p>
  </div></div>`;
  const input = el.querySelector("#fxClave");
  const probar = () => {
    if (input.value.trim() === CLAVE_DAVID) {
      try { localStorage.setItem(FIN_ACCESO_KEY, "si"); } catch {}
      finRender();
    } else {
      el.querySelector("#fxClaveError").hidden = false;
      input.value = ""; input.focus();
    }
  };
  el.querySelector("#fxClaveBtn").onclick = probar;
  input.addEventListener("keydown", e => { if (e.key === "Enter") probar(); });
}
function finGuardarPronto() {
  clearTimeout(finSaveTimer);
  finSaveTimer = setTimeout(guardarFin, 250);
}
function finId(pref) { return pref + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }

// ---------- Formato ----------
function fmtCOP(n) {
  n = Math.round((typeof n === "number" ? n : parseNum(n)) || 0);
  return (n < 0 ? "-$" : "$") + nfCO.format(Math.abs(n));
}
// $3,7M · $600k · $850 — para cifras grandes y ejes
function fmtCompacto(n, dec) {
  const a = Math.abs(n || 0), s = n < 0 ? "-" : "";
  if (a >= 999500) {
    const v = a / 1e6;
    const d = dec != null ? dec : (Number.isInteger(+v.toFixed(1)) ? 0 : 1);
    return s + "$" + v.toLocaleString("es-CO", { minimumFractionDigits: d, maximumFractionDigits: d }) + "M";
  }
  if (a >= 999.5) return s + "$" + Math.round(a / 1e3) + "k";
  return s + "$" + Math.round(a);
}
function finTick(v, maxY) {
  if (v === 0) return "$0";
  if (maxY >= 1e6) return fmtCompacto(v, 1);
  if (maxY >= 1e4) return "$" + Math.round(v / 1e3) + "k";
  if (maxY < 10 && !Number.isInteger(v)) return "";
  return "$" + Math.round(v);
}
function finMesLargo(iso) {
  return new Date(iso + "T12:00:00").toLocaleDateString("es-CO", { month: "long", year: "numeric" });
}
function finFechaCorta(iso) {
  if (!iso) return "—";
  return new Date(iso + "T12:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}
// dia: día original del mes (31 → 28 en febrero, pero vuelve al 31 en marzo)
function sumarMeses(iso, n, dia) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1 + n, 1);
  const ultimo = new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate();
  dt.setDate(Math.min(dia || d, ultimo));
  return isoDe(dt);
}
function diasHasta(iso) {
  return Math.round((new Date(iso + "T12:00:00") - new Date(hoyISO() + "T12:00:00")) / 86400000);
}
function finMonto(v) { return Math.max(0, parseNum(v) || 0); }
// Campo de dinero: si lo escrito no es un número, avisa y conserva el valor previo
function finValorValido(inp, previo) {
  const t = inp.value.trim();
  if (t && Number.isNaN(parseNum(t))) {
    toastVivo("Escribe solo números, por ejemplo 1.200.000");
    inp.value = previo ? nfCO.format(finMonto(previo)) : "";
    return false;
  }
  inp.value = finMonto(t) ? nfCO.format(finMonto(t)) : "";
  return true;
}

// ════════════════════════════════════════════════════════════
// 1. PROYECCIÓN — deuda que baja o meta de ahorro que se llena
// ════════════════════════════════════════════════════════════
// Tasa efectiva anual → efectiva mensual: (1+EA)^(1/12) − 1
function finTasaMensual(tasaEA) { return Math.pow(1 + Math.max(0, tasaEA) / 100, 1 / 12) - 1; }

function finProyectar(m) {
  const modo = m.modo === "ahorro" ? "ahorro" : "deuda";
  const total = finMonto(m.total), abono = finMonto(m.abono);
  const tasa = Math.max(0, parseNum(m.tasa) || 0), inicial = finMonto(m.inicial);
  const i = finTasaMensual(tasa);
  const MAX = 600; // 50 años: más allá se considera inalcanzable
  const puntos = [];
  let intereses = 0, aportado = 0, meses = null;
  if (modo === "ahorro") {
    let ahorrado = inicial;
    puntos.push(Math.max(0, total - ahorrado));
    if (ahorrado >= total) meses = 0;
    for (let t = 1; t <= MAX && meses == null; t++) {
      const rend = ahorrado * i;
      const ap = Math.min(abono, Math.max(0, total - ahorrado - rend));
      intereses += rend; aportado += ap;
      ahorrado = ahorrado + rend + ap;
      const falta = Math.max(0, total - ahorrado);
      puntos.push(falta);
      if (falta <= 0.5) meses = t;
      if (abono <= 0 && rend <= 0) break; // no crece: no tiene sentido seguir
    }
  } else {
    let saldo = Math.max(0, total - inicial);
    puntos.push(saldo);
    if (saldo <= 0) meses = 0;
    const interesInicial = saldo * i;
    const baja = abono > interesInicial + 0.5;
    const tope = baja ? MAX : 24; // si no baja, se muestra cómo crece dos años
    for (let t = 1; t <= tope && meses == null; t++) {
      const int = saldo * i;
      const pago = Math.min(abono, saldo + int);
      intereses += int; aportado += pago;
      saldo = saldo + int - pago;
      puntos.push(Math.max(0, saldo));
      if (saldo <= 0.5) { saldo = 0; meses = t; }
    }
  }
  const inalcanzable = meses == null;
  // Abono mínimo para que una deuda empiece a bajar (cubrir el interés del primer mes)
  const minAbono = modo === "deuda" ? Math.ceil(Math.max(0, total - inicial) * i) : 0;
  const fin = meses != null ? sumarMeses(hoyISO(), meses) : null;
  return { modo, total, abono, tasa, inicial, i, puntos, meses, intereses, aportado, inalcanzable, minAbono, fin };
}
function finRangoX(meses) {
  if (meses == null) return 24;
  const n = meses + 1;
  if (n <= 12) return 12;
  if (n <= 36) return Math.ceil(n / 6) * 6;
  if (n <= 120) return Math.ceil(n / 12) * 12;
  return Math.ceil(n / 24) * 24;
}
function finPasoX(N) { return N <= 12 ? 2 : N <= 36 ? 6 : N <= 72 ? 12 : 24; }
function finNiceMax(v) {
  if (!(v > 0)) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const f = v / p;
  const m = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return m * p;
}

// SVG del gráfico de área: rejilla punteada sutil, línea salmón y
// degradado hacia abajo (referencia visual de David).
function finChartSvg(pr, w, geo) {
  const h = w < 520 ? 236 : 300;
  const padL = w < 520 ? 52 : 64, padR = 18, padT = 16, padB = 48;
  const N = finRangoX(pr.inalcanzable ? null : pr.meses);
  const pts = pr.puntos.slice(0, N + 1);
  while (pts.length < N + 1) pts.push(pr.inalcanzable ? pts[pts.length - 1] : 0);
  const maxY = finNiceMax(Math.max(...pts) || pr.total || 1e6);
  const iw = w - padL - padR, ih = h - padT - padB;
  const X = t => padL + iw * t / N, Y = v => padT + ih * (1 - Math.min(v, maxY) / maxY);
  const divs = 5;
  let grid = "", ylab = "", xlab = "";
  for (let k = 0; k <= divs; k++) {
    const v = maxY * k / divs, y = Y(v).toFixed(1);
    grid += `<line class="fx-grid" x1="${padL}" x2="${w - padR}" y1="${y}" y2="${y}"/>`;
    ylab += `<text class="fx-ytxt" x="${padL - 10}" y="${y}" text-anchor="end" dominant-baseline="middle">${finTick(v, maxY)}</text>`;
  }
  const paso = finPasoX(N);
  for (let t = 0; t <= N; t += paso) xlab += `<text class="fx-xtxt" x="${X(t).toFixed(1)}" y="${h - padB + 22}" text-anchor="middle">${t}</text>`;
  const linea = pts.map((v, t) => `${t ? "L" : "M"}${X(t).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
  const area = `${linea} L${X(N).toFixed(1)},${Y(0).toFixed(1)} L${X(0).toFixed(1)},${Y(0).toFixed(1)} Z`;
  Object.assign(geo, { N, pts, X, Y, w, h, padL, padT, ih, iw });
  return `
  <svg class="fx-svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Saldo pendiente por mes">
    <defs>
      <linearGradient id="fxGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style="stop-color:var(--fx-acento, ${FIN_ACENTO})" stop-opacity=".45"/>
        <stop offset=".6" style="stop-color:var(--fx-acento, ${FIN_ACENTO})" stop-opacity=".14"/>
        <stop offset="1" style="stop-color:var(--fx-acento, ${FIN_ACENTO})" stop-opacity=".02"/>
      </linearGradient>
    </defs>
    ${grid}${ylab}${xlab}
    <line class="fx-eje" x1="${padL}" x2="${padL}" y1="${padT}" y2="${padT + ih}"/>
    <path class="fx-area" d="${area}"/>
    <path class="fx-linea" d="${linea}"/>
    <g class="fx-hover" id="fxHover" style="display:none">
      <line class="fx-guia" x1="0" x2="0" y1="${padT}" y2="${padT + ih}"/>
      <circle class="fx-dot" r="5.5" cx="0" cy="0"/>
    </g>
    <text class="fx-xtit" x="${(padL + iw / 2).toFixed(1)}" y="${h - 8}" text-anchor="middle">Meses desde hoy</text>
  </svg>`;
}

function finProyeccionHtml() {
  const m = finz.meta;
  const esAhorro = m.modo === "ahorro";
  return `
  <div class="fin-panel fx-panel" id="fxPanel">
    <div class="fx-head">
      <div>
        <h3>Simulador de metas</h3>
        <p class="fin-hint">${esAhorro
          ? "Mueve el aporte mensual y mira en cuántos meses completas la meta."
          : "Mueve el abono mensual y mira en cuántos meses queda saldada la obligación."}</p>
      </div>
      <div class="aprob-pills fx-modo" id="fxModo">
        <button data-modo="ahorro" class="${esAhorro ? "sel" : ""}">Meta</button>
        <button data-modo="deuda" class="${esAhorro ? "" : "sel"}">Obligación</button>
      </div>
    </div>
    <div id="fxVivo"></div>
    <div class="fx-controles">
      <div class="fx-campo fx-campo-nombre">
        <label class="fx-lbl" for="fxNombre">${esAhorro ? "Meta" : "Obligación"}</label>
        <input class="edit-input fx-input" id="fxNombre" value="${esc(m.nombre || "")}" placeholder="${esAhorro ? "Ej. Cámara nueva, fondo de 3 meses" : "Ej. Tarjeta de crédito, crédito del carro"}" autocomplete="off">
      </div>
      <div class="fx-campo">
        <label class="fx-lbl" for="fxTotal">${esAhorro ? "Meta total" : "Valor total"}</label>
        <input class="edit-input fx-input num" id="fxTotal" inputmode="decimal" value="${m.total ? nfCO.format(finMonto(m.total)) : ""}" placeholder="0">
      </div>
      <div class="fx-campo">
        <label class="fx-lbl" for="fxInicial">${esAhorro ? "Ya ahorrado" : "Ya abonado"}</label>
        <input class="edit-input fx-input num" id="fxInicial" inputmode="decimal" value="${m.inicial ? nfCO.format(finMonto(m.inicial)) : ""}" placeholder="0">
      </div>
      <div class="fx-campo fx-campo-slider">
        <div class="fx-slider-top">
          <label class="fx-lbl" for="fxAbono">${esAhorro ? "Aporte mensual" : "Abono mensual"}</label>
          <input class="edit-input fx-input num fx-mini" id="fxAbonoTxt" inputmode="decimal" value="${nfCO.format(finMonto(m.abono))}">
        </div>
        <input type="range" class="fx-range" id="fxAbono" min="0" max="${finAbonoMax(m)}" step="${finAbonoPaso(m)}" value="${finMonto(m.abono)}">
      </div>
      <div class="fx-campo fx-campo-slider">
        <div class="fx-slider-top">
          <label class="fx-lbl" for="fxTasa">${esAhorro ? "Rendimiento anual (EA %)" : "Interés anual (EA %)"}</label>
          <input class="edit-input fx-input num fx-mini" id="fxTasaTxt" inputmode="decimal" value="${nfCO2.format(parseNum(m.tasa) || 0)}">
        </div>
        <input type="range" class="fx-range" id="fxTasa" min="0" max="60" step="0.5" value="${Math.min(60, Math.max(0, parseNum(m.tasa) || 0))}">
      </div>
    </div>
  </div>`;
}
function finAbonoMax(m) {
  const total = finMonto(m.total), abono = finMonto(m.abono);
  const base = Math.max(total / 2, abono * 1.25, 100000);
  return finNiceMax(base);
}
function finAbonoPaso(m) {
  const max = finAbonoMax(m);
  return max >= 5e6 ? 50000 : max >= 1e6 ? 10000 : max >= 2e5 ? 5000 : 1000;
}

// Pinta cifras + gráfico (se re-pinta solo esto al mover los sliders)
function finPintarVivo(el) {
  const vivo = el.querySelector("#fxVivo");
  if (!vivo) return;
  const m = finz.meta;
  const pr = finProyectar(m);
  const esAhorro = pr.modo === "ahorro";
  const w = Math.max(260, Math.round(vivo.clientWidth || el.clientWidth || 720) - 2);
  const geo = {};
  const svg = finChartSvg(pr, w, geo);
  let meses, mesesSub, mesesClase = "";
  if (pr.total <= 0) { meses = "—"; mesesSub = esAhorro ? "Escribe tu meta" : "Escribe el valor"; }
  else if (pr.inalcanzable) {
    meses = "∞"; mesesClase = "mal";
    mesesSub = pr.abono <= 0 ? (esAhorro ? "Escribe un aporte mensual" : "Escribe un abono mensual")
      : esAhorro ? "Más de 50 años con este aporte"
      : pr.abono <= pr.minAbono ? `No baja: el interés mensual es ${fmtCOP(pr.minAbono)}`
      : "Más de 50 años con este abono";
  } else if (pr.meses === 0) { meses = "0"; mesesClase = "bien"; mesesSub = esAhorro ? "Ya la lograste" : "Ya está pagada"; }
  else {
    meses = String(pr.meses); mesesClase = "bien";
    mesesSub = `${pr.meses === 1 ? "mes" : "meses"} · ${finMesLargo(pr.fin)}`;
  }
  const saldoFinal = pr.inalcanzable ? pr.puntos[pr.puntos.length - 1] : 0;
  vivo.innerHTML = `
    <div class="fx-metricas">
      <div class="fx-met">
        <span class="fx-met-num">${fmtCompacto(pr.total)}</span>
        <span class="fx-met-lbl">${esAhorro ? "Meta" : "Obligación"}${m.nombre ? ` · ${esc(m.nombre)}` : ""}</span>
      </div>
      <div class="fx-met">
        <span class="fx-met-num">${fmtCOP(pr.abono)}</span>
        <span class="fx-met-lbl">${esAhorro ? "Aporte mensual" : "Abono mensual"}</span>
      </div>
      <div class="fx-met">
        <span class="fx-met-num ${mesesClase}">${meses}</span>
        <span class="fx-met-lbl">${esAhorro ? "Meses para lograrla" : "Meses para liquidar"}<br><span class="fx-met-sub ${mesesClase}">${mesesSub}</span></span>
      </div>
    </div>
    <div class="fx-chart-tit">${esAhorro ? "Lo que falta para la meta" : "Saldo pendiente"}</div>
    <div class="fx-chart" id="fxChart">
      ${svg}
      <div class="fx-tip" id="fxTip" hidden></div>
    </div>
    <div class="fx-leyenda">
      <span><i class="fx-sw"></i>${esAhorro ? "Falta para la meta" : "Saldo pendiente"}</span>
      ${pr.total > 0 && !pr.inalcanzable ? `<span class="fx-ley-dato">${esAhorro ? "Rendimientos" : "Intereses"}: <b>${fmtCOP(pr.intereses)}</b></span>
      <span class="fx-ley-dato">${esAhorro ? "Aportado" : "Total pagado"}: <b>${fmtCOP(pr.aportado)}</b></span>
      <span class="fx-ley-dato">Saldo al final: <b class="bien">${fmtCOP(saldoFinal)}</b></span>` : ""}
      ${pr.tasa > 0 ? `<span class="fx-ley-dato">Mensual: <b>${(pr.i * 100).toLocaleString("es-CO", { maximumFractionDigits: 2 })}%</b></span>` : ""}
    </div>`;

  // Hover / toque: guía vertical, punto y tooltip con el mes exacto
  const chart = vivo.querySelector("#fxChart");
  const svgEl = chart.querySelector("svg");
  const hover = chart.querySelector("#fxHover");
  const tip = chart.querySelector("#fxTip");
  const mover = ev => {
    const r = svgEl.getBoundingClientRect();
    const x = (ev.clientX - r.left) * (geo.w / r.width);
    const t = Math.max(0, Math.min(geo.N, Math.round((x - geo.padL) / geo.iw * geo.N)));
    const v = geo.pts[t] || 0;
    const cx = geo.X(t), cy = geo.Y(v);
    hover.style.display = "";
    hover.querySelector(".fx-guia").setAttribute("x1", cx.toFixed(1));
    hover.querySelector(".fx-guia").setAttribute("x2", cx.toFixed(1));
    const dot = hover.querySelector(".fx-dot");
    dot.setAttribute("cx", cx.toFixed(1)); dot.setAttribute("cy", cy.toFixed(1));
    tip.hidden = false;
    tip.innerHTML = `<b>${fmtCOP(v)}</b><span>Mes ${t} · ${finMesLargo(sumarMeses(hoyISO(), t))}</span>`;
    const cw = chart.clientWidth || r.width, xPx = cx / geo.w * cw, tw = tip.offsetWidth || 150;
    let left = xPx + 12;
    if (left + tw > cw) left = xPx - 12 - tw;
    left = Math.max(0, Math.min(left, Math.max(0, cw - tw)));
    tip.style.left = left.toFixed(1) + "px";
  };
  const salir = () => { hover.style.display = "none"; tip.hidden = true; };
  chart.onpointermove = mover;
  chart.onpointerdown = mover;
  chart.onpointerleave = salir;
}

function finRangeFill(r) {
  const min = Number(r.min) || 0, max = Number(r.max) || 1;
  const p = Math.max(0, Math.min(100, (Number(r.value) - min) / (max - min || 1) * 100));
  r.style.setProperty("--p", p.toFixed(1) + "%");
}
function finWireProyeccion(el) {
  const m = finz.meta;
  const panel = el.querySelector("#fxPanel");
  if (!panel) return;
  finPintarVivo(el);
  // Re-pintar al cambiar el ancho (celular girado, ventana)
  if (window.ResizeObserver) {
    if (el._fxRo) el._fxRo.disconnect();
    let ancho = panel.clientWidth;
    el._fxRo = new ResizeObserver(() => {
      if (!panel.isConnected || Math.abs(panel.clientWidth - ancho) < 8) return;
      ancho = panel.clientWidth;
      finPintarVivo(el);
      finPintarFlujo(el);
    });
    el._fxRo.observe(panel);
  }
  panel.querySelectorAll("#fxModo button").forEach(b => b.onclick = () => {
    if (m.modo === b.dataset.modo) return;
    m.modo = b.dataset.modo;
    guardarFin();
    finRender();
  });
  const abono = panel.querySelector("#fxAbono"), abonoTxt = panel.querySelector("#fxAbonoTxt");
  const tasa = panel.querySelector("#fxTasa"), tasaTxt = panel.querySelector("#fxTasaTxt");
  finRangeFill(abono); finRangeFill(tasa);
  abono.oninput = () => {
    m.abono = Number(abono.value);
    abonoTxt.value = nfCO.format(m.abono);
    finRangeFill(abono);
    finPintarVivo(el); finGuardarPronto();
  };
  abonoTxt.onchange = () => {
    m.abono = finMonto(abonoTxt.value);
    abonoTxt.value = nfCO.format(m.abono);
    abono.max = finAbonoMax(m); abono.step = finAbonoPaso(m); abono.value = m.abono; finRangeFill(abono);
    finPintarVivo(el); guardarFin();
  };
  tasa.oninput = () => {
    m.tasa = Number(tasa.value);
    tasaTxt.value = nfCO2.format(m.tasa);
    finRangeFill(tasa);
    finPintarVivo(el); finGuardarPronto();
  };
  tasaTxt.onchange = () => {
    m.tasa = Math.max(0, parseNum(tasaTxt.value) || 0);
    tasaTxt.value = nfCO2.format(m.tasa);
    tasa.value = Math.min(60, m.tasa); finRangeFill(tasa);
    finPintarVivo(el); guardarFin();
  };
  const total = panel.querySelector("#fxTotal"), inicial = panel.querySelector("#fxInicial");
  total.onchange = () => {
    m.total = finMonto(total.value);
    total.value = m.total ? nfCO.format(m.total) : "";
    abono.max = finAbonoMax(m); abono.step = finAbonoPaso(m); abono.value = m.abono; finRangeFill(abono);
    finPintarVivo(el); guardarFin();
  };
  inicial.onchange = () => {
    m.inicial = finMonto(inicial.value);
    inicial.value = m.inicial ? nfCO.format(m.inicial) : "";
    finPintarVivo(el); guardarFin();
  };
  panel.querySelector("#fxNombre").onchange = e => { m.nombre = e.target.value.trim(); finPintarVivo(el); guardarFin(); };
  panel.querySelectorAll(".fx-input").forEach(i => i.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); i.blur(); } });
}

// ════════════════════════════════════════════════════════════
// 2. PIPELINE — el dinero que está en el aire
// ════════════════════════════════════════════════════════════
function finPipelineActivo() {
  const corte = sumarDias(hoyISO(), -45);
  return finz.pipeline.filter(p => !(p.estado === "pagado" && (p.pagadoEn || p.fecha || "") < corte));
}
function finSumas() {
  const hoy = hoyISO();
  const mesActual = hoy.slice(0, 7);
  const act = finPipelineActivo();
  const suma = fn => act.filter(fn).reduce((s, p) => s + finMonto(p.valor), 0);
  return {
    seguro: suma(p => p.tipo === "retainer" && p.estado !== "cotizacion" && ((p.fecha || hoy).slice(0, 7) === mesActual || (p.estado !== "pagado" && (p.fecha || hoy).slice(0, 7) < mesActual))),
    pendiente: suma(p => p.estado === "facturado"),
    negociacion: suma(p => p.estado === "cotizacion"),
    curso: suma(p => p.estado === "aprobado" || p.estado === "ejecucion"),
    cobradoMes: suma(p => p.estado === "pagado" && (p.pagadoEn || p.fecha || "").slice(0, 7) === mesActual),
  };
}
function finBadge(estado, clase = "") {
  const e = FIN_ESTADOS[estado] || FIN_ESTADOS.cotizacion;
  return `<span class="fx-badge ${clase}" style="--c:${e.c}"><i></i>${e.n}</span>`;
}
function finPipelineHtml() {
  const s = finSumas();
  const orden = { facturado: 0, aprobado: 1, ejecucion: 2, cotizacion: 3, pagado: 4 };
  const lista = finPipelineActivo().slice().sort((a, b) =>
    (orden[a.estado] ?? 9) - (orden[b.estado] ?? 9) || String(a.fecha || "").localeCompare(String(b.fecha || "")));
  const hoy = hoyISO();
  return `
  <div class="fin-panel fx-pipe" id="fxPipe">
    <div class="fx-head">
      <div>
        <h3>Pipeline de clientes</h3>
        <p class="fin-hint">Cotizaciones, proyectos activos y facturas: todo el dinero que está por entrar, con su estado.</p>
      </div>
      <button class="btn-primary" id="fxNuevoItem">＋ Nuevo proyecto</button>
    </div>
    <div class="fx-sumas">
      <div class="fx-suma"><span class="fx-suma-num bien">${fmtCOP(s.seguro)}</span><span class="fx-suma-lbl">Seguro este mes<small>retainers y pagos fijos</small></span></div>
      <div class="fx-suma"><span class="fx-suma-num acento">${fmtCOP(s.pendiente)}</span><span class="fx-suma-lbl">Pendiente de cobro<small>facturas enviadas</small></span></div>
      <div class="fx-suma"><span class="fx-suma-num">${fmtCOP(s.negociacion)}</span><span class="fx-suma-lbl">En negociación<small>cotizaciones</small></span></div>
      <div class="fx-suma"><span class="fx-suma-num">${fmtCOP(s.curso)}</span><span class="fx-suma-lbl">Aprobado y en curso<small>por facturar</small></span></div>
    </div>
    ${lista.length ? `
    <div class="fx-tabla" role="table">
      <div class="fx-fila fx-cab" role="row">
        <span>Cliente / proyecto</span><span>Servicio</span><span class="der">Valor</span><span>Estado del dinero</span><span>Ingreso estimado</span><span></span>
      </div>
      ${lista.map(p => {
        const vencido = p.fecha && p.fecha < hoy && p.estado !== "pagado" && p.estado !== "cotizacion";
        return `
        <div class="fx-fila ${p.estado === "pagado" ? "pagada" : ""}" role="row" data-item="${p.id}">
          <span class="fx-cli"><b>${esc(p.cliente || "Sin nombre")}</b>${p.tipo === "retainer" ? `<em class="fx-tipo">Retainer</em>` : ""}</span>
          <span class="fx-serv" data-lbl="Servicio">${esc(p.servicio || "—")}</span>
          <span class="fx-val der" data-lbl="Valor">${fmtCOP(p.valor)}</span>
          <span class="fx-est" data-lbl="Estado"><button class="fx-badge-btn" data-estado-de="${p.id}" title="Cambiar estado">${finBadge(p.estado)}</button></span>
          <span class="fx-fecha ${vencido ? "vencido" : ""}" data-lbl="Ingreso">${finFechaCorta(p.fecha)}${vencido ? ` <small>vencido</small>` : ""}</span>
          <span class="fx-acc"><button class="fx-edit" data-editar="${p.id}" aria-label="Editar">${icl("ajuste")}</button></span>
        </div>`;
      }).join("")}
    </div>` : `
    <div class="fx-vacio">Aún no hay proyectos en el pipeline. Agrega la primera cotización o retainer y verás el embudo de ventas aquí.</div>`}
    ${s.cobradoMes ? `<p class="fx-nota">Cobrado este mes: <b>${fmtCOP(s.cobradoMes)}</b></p>` : ""}
  </div>`;
}
function finWirePipeline(el) {
  const panel = el.querySelector("#fxPipe");
  if (!panel) return;
  panel.querySelector("#fxNuevoItem").onclick = () => openFinItem(null);
  panel.querySelectorAll("[data-editar]").forEach(b => b.onclick = e => { e.stopPropagation(); openFinItem(b.dataset.editar); });
  panel.querySelectorAll(".fx-fila[data-item]").forEach(f => f.onclick = e => {
    if (e.target.closest("button")) return;
    openFinItem(f.dataset.item);
  });
  panel.querySelectorAll("[data-estado-de]").forEach(b => b.onclick = e => {
    e.stopPropagation();
    finMenuEstado(b, b.dataset.estadoDe);
  });
}
// Menú flotante para cambiar el estado sin abrir la ficha
function finMenuEstado(anchor, id) {
  document.querySelectorAll(".fx-menu").forEach(m => m.remove());
  const p = finz.pipeline.find(x => x.id === id);
  if (!p) return;
  const menu = document.createElement("div");
  menu.className = "fx-menu";
  menu.innerHTML = FIN_ESTADOS_ORDEN.map(k => `<button data-k="${k}" class="${p.estado === k ? "sel" : ""}">${finBadge(k)}</button>`).join("");
  menu.onclick = ev => ev.stopPropagation();
  anchor.parentElement.appendChild(menu);
  menu.querySelectorAll("button").forEach(b => b.onclick = ev => {
    ev.stopPropagation();
    finCambiarEstado(p, b.dataset.k);
    menu.remove();
    guardarFin();
    finRender();
  });
  setTimeout(() => document.addEventListener("click", function cerrar() { menu.remove(); document.removeEventListener("click", cerrar); }), 0);
}
function finCambiarEstado(p, k) {
  p.estado = k;
  if (k === "pagado") p.pagadoEn = hoyISO(); else delete p.pagadoEn;
}
function finRetainerSiguiente(p) {
  const base = p.fecha || hoyISO();
  const dia = p.dia || Number(base.slice(8));
  const copia = Object.assign({}, p, { id: finId("f"), dia, fecha: sumarMeses(base, 1, dia), estado: "facturado" });
  delete copia.pagadoEn;
  finz.pipeline.unshift(copia);
  return copia;
}

function openFinItem(id, pre) {
  const nuevo = !id;
  const p = nuevo
    ? Object.assign({ id: finId("f"), cliente: "", servicio: "", tipo: "proyecto", valor: 0, estado: "cotizacion", fecha: sumarDias(hoyISO(), 15), nota: "" }, pre || {})
    : finz.pipeline.find(x => x.id === id);
  if (!p) return;
  const clientes = (typeof pros !== "undefined" && pros && Array.isArray(pros.clientes)) ? pros.clientes : [];
  drawer.innerHTML = `
    <button class="close-btn" id="drawerClose" aria-label="Cerrar">✕</button>
    <h2>${nuevo ? "Nuevo proyecto" : esc(p.cliente || "Proyecto")}</h2>
    <div class="sub">${nuevo ? "Cotización, proyecto o retainer" : `${FIN_TIPOS[p.tipo] || "Proyecto"} · ${fmtCOP(p.valor)}`}</div>
    <section>
      <h4>Cliente / proyecto</h4>
      <input class="edit-input" id="fiCliente" value="${esc(p.cliente)}" placeholder="Ej. Nombre del cliente" autocomplete="off">
      ${clientes.length ? `<select class="edit-input" id="fiClienteSel" style="margin-top:8px">
        <option value="">Vincular a un cliente del estudio…</option>
        ${clientes.map(c => `<option value="${c.id}" ${p.clienteId === c.id ? "selected" : ""}>${esc(c.nombre)}</option>`).join("")}
      </select>` : ""}
    </section>
    <section>
      <h4>Tipo de servicio</h4>
      <input class="edit-input" id="fiServicio" value="${esc(p.servicio)}" placeholder="Ej. Identidad de marca, Producción audiovisual" autocomplete="off">
      <div class="aprob-pills fx-pills" id="fiTipo" style="margin-top:10px">
        ${Object.entries(FIN_TIPOS).map(([k, n]) => `<button data-tipo="${k}" class="${p.tipo === k ? "sel" : ""}">${n}</button>`).join("")}
      </div>
    </section>
    <section>
      <h4>Valor proyectado</h4>
      <input class="edit-input num" id="fiValor" inputmode="decimal" value="${p.valor ? nfCO.format(finMonto(p.valor)) : ""}" placeholder="0">
    </section>
    <section>
      <h4>Estado del dinero</h4>
      <div class="fx-estados" id="fiEstado">
        ${FIN_ESTADOS_ORDEN.map(k => `<button data-k="${k}" class="${p.estado === k ? "sel" : ""}">${finBadge(k)}</button>`).join("")}
      </div>
    </section>
    <section>
      <h4>Fecha estimada de ingreso</h4>
      <button type="button" class="edit-input fecha-btn" id="fiFechaBtn">${new Date(p.fecha + "T12:00:00").toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "short" })}</button>
      <div class="calp" id="fiCal" hidden></div>
    </section>
    <section>
      <h4>Notas</h4>
      <textarea class="aprob-comment" id="fiNota" placeholder="Alcance, condiciones de pago, contacto…">${esc(p.nota || "")}</textarea>
    </section>
    <div class="fx-drawer-acciones">
      ${nuevo ? `<button class="btn-primary" id="fiCrear">Agregar al pipeline</button>` : `<button class="btn-primary" id="fiListo">Listo</button>`}
      ${!nuevo ? `<button class="btn-ghost" id="fiSiguiente" ${p.tipo === "retainer" ? "" : "hidden"}>Repetir el próximo mes</button>` : ""}
      ${!nuevo ? `<button class="link-btn" id="fiEliminar" style="color:#F28B82">Eliminar</button>` : ""}
    </div>`;
  if (!drawer.classList.contains("open")) posicionarDrawer();
  drawer.classList.add("open");
  backdrop.classList.add("open");
  drawer.querySelector("#drawerClose").onclick = closeDrawer;

  const leer = () => {
    p.cliente = drawer.querySelector("#fiCliente").value.trim();
    p.servicio = drawer.querySelector("#fiServicio").value.trim();
    p.valor = finMonto(drawer.querySelector("#fiValor").value);
    p.nota = drawer.querySelector("#fiNota").value.trim();
  };
  const persistir = () => { if (nuevo) return; leer(); guardarFin(); finRender(); };
  const selCli = drawer.querySelector("#fiClienteSel");
  if (selCli) selCli.onchange = () => {
    p.clienteId = selCli.value || "";
    const c = clientes.find(x => x.id === p.clienteId);
    const inC = drawer.querySelector("#fiCliente");
    if (c && !inC.value.trim()) inC.value = c.nombre;
    persistir();
  };
  ["#fiCliente", "#fiServicio", "#fiValor", "#fiNota"].forEach(sel => {
    const i = drawer.querySelector(sel);
    i.onchange = () => { if (sel === "#fiValor" && !finValorValido(i, p.valor)) return; persistir(); };
    if (i.tagName === "INPUT") i.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); i.blur(); } };
  });
  drawer.querySelectorAll("#fiTipo button").forEach(b => b.onclick = () => {
    p.tipo = b.dataset.tipo;
    drawer.querySelectorAll("#fiTipo button").forEach(x => x.classList.toggle("sel", x === b));
    const sig = drawer.querySelector("#fiSiguiente");
    if (sig) sig.hidden = p.tipo !== "retainer";
    persistir();
  });
  drawer.querySelectorAll("#fiEstado button").forEach(b => b.onclick = () => {
    finCambiarEstado(p, b.dataset.k);
    drawer.querySelectorAll("#fiEstado button").forEach(x => x.classList.toggle("sel", x === b));
    persistir();
  });
  const fechaBtn = drawer.querySelector("#fiFechaBtn"), cal = drawer.querySelector("#fiCal");
  fechaBtn.onclick = () => {
    cal.hidden = !cal.hidden;
    if (!cal.hidden) pintarCalPanel(cal, p.fecha, iso => {
      p.fecha = iso; p.dia = Number(iso.slice(8)); cal.hidden = true;
      fechaBtn.textContent = new Date(iso + "T12:00:00").toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "short" });
      persistir();
    });
  };
  if (nuevo) drawer.querySelector("#fiCrear").onclick = () => {
    leer();
    if (!p.cliente) { drawer.querySelector("#fiCliente").focus(); return; }
    finz.pipeline.unshift(p);
    guardarFin(); closeDrawer(); finRender();
    toastVivo(`${p.cliente} entró al pipeline`);
  };
  else {
    drawer.querySelector("#fiListo").onclick = () => { leer(); guardarFin(); closeDrawer(); finRender(); };
    const sig = drawer.querySelector("#fiSiguiente");
    if (sig) sig.onclick = () => {
      leer();
      const c = finRetainerSiguiente(p);
      guardarFin(); finRender();
      toastVivo(`${c.cliente}: retainer de ${finMesLargo(c.fecha)} agregado`);
      openFinItem(c.id);
    };
    drawer.querySelector("#fiEliminar").onclick = () => {
      if (!confirm(`¿Eliminar "${p.cliente}" del pipeline?`)) return;
      finz.pipeline = finz.pipeline.filter(x => x.id !== p.id);
      guardarFin(); closeDrawer(); finRender();
    };
  }
  if (nuevo && matchMedia("(hover: hover)").matches) setTimeout(() => drawer.querySelector("#fiCliente").focus(), 80);
}

// ════════════════════════════════════════════════════════════
// 3. LIQUIDEZ — caja hoy, por pagar y por cobrar a 15 días
// ════════════════════════════════════════════════════════════
function finPagosPendientes() { return finz.pagos.filter(p => !p.pagado); }
function finLiquidez() {
  const hoy = hoyISO(), limite = sumarDias(hoy, FIN_VENTANA);
  const pagar = finPagosPendientes().filter(p => (p.fecha || hoy) <= limite)
    .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
  const cobrar = finPipelineActivo()
    .filter(p => (p.estado === "facturado" || p.estado === "aprobado") && (p.fecha || hoy) <= limite)
    .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
  const tPagar = pagar.reduce((s, p) => s + finMonto(p.valor), 0);
  const tCobrar = cobrar.reduce((s, p) => s + finMonto(p.valor), 0);
  const vencidoCobrar = cobrar.filter(p => p.fecha < hoy).reduce((s, p) => s + finMonto(p.valor), 0);
  const vencidoPagar = pagar.filter(p => p.fecha < hoy).reduce((s, p) => s + finMonto(p.valor), 0);
  return { pagar, cobrar, tPagar, tCobrar, vencidoCobrar, vencidoPagar, proyeccion: finMonto(finz.caja) + tCobrar - tPagar };
}
function finLiquidezHtml() {
  const L = finLiquidez();
  const caja = finMonto(finz.caja);
  const hoy = hoyISO();
  const sigPago = L.pagar[0];
  const sigCobro = L.cobrar[0];
  const todosPagos = finPagosPendientes().slice().sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
  const listaPagos = finUI.todosPagos ? todosPagos : L.pagar;
  return `
  <div class="fx-liq" id="fxLiq">
    <div class="fx-card fx-card-caja">
      <span class="fx-card-lbl">Caja actual</span>
      <div class="fx-card-num-row">
        <button class="fx-card-num fx-caja-btn" id="fxCajaBtn" title="Tocar para editar">${fmtCOP(caja)}</button>
        <input class="edit-input fx-input num fx-caja-input" id="fxCajaInput" inputmode="decimal" value="${caja ? nfCO.format(caja) : ""}" hidden>
      </div>
      <span class="fx-card-sub">En ${FIN_VENTANA} días ≈ <b class="${L.proyeccion >= caja ? "bien" : "mal"}">${fmtCOP(L.proyeccion)}</b><small>caja + cobros − pagos</small></span>
    </div>
    <div class="fx-card fx-card-pagar ${finUI.verPagos ? "abierta" : ""}">
      <span class="fx-card-lbl">Por pagar · próximos ${FIN_VENTANA} días</span>
      <span class="fx-card-num ${L.tPagar ? "mal" : ""}">${fmtCOP(L.tPagar)}</span>
      <span class="fx-card-sub">${L.pagar.length
        ? `${L.pagar.length} ${L.pagar.length === 1 ? "obligación" : "obligaciones"}${sigPago ? ` · siguiente: <b>${esc(sigPago.nombre)}</b> ${finFechaCorta(sigPago.fecha)}` : ""}${L.vencidoPagar ? ` · <b class="mal">vencido ${fmtCOP(L.vencidoPagar)}</b>` : ""}`
        : "Nada vence en esta ventana"}</span>
      <div class="fx-card-acc">
        <button class="fx-link" data-toggle="verPagos">${finUI.verPagos ? "Ocultar" : "Ver detalle"}</button>
        <button class="fx-link" id="fxNuevoPago">＋ Agregar</button>
      </div>
      ${finUI.verPagos ? `
      <div class="fx-lista">
        ${listaPagos.length ? listaPagos.map(p => `
          <div class="fx-item ${p.fecha < hoy ? "vencido" : ""}" data-pago="${p.id}">
            <span class="fx-item-nom"><b>${esc(p.nombre)}</b><small>${FIN_PAGO_TIPOS[p.tipo] || "Otro"}${p.recurrente ? " · cada mes" : ""}</small></span>
            <span class="fx-item-fecha">${finFechaCorta(p.fecha)}${p.fecha < hoy ? " <small>vencido</small>" : ""}</span>
            <span class="fx-item-val">${fmtCOP(p.valor)}</span>
            <button class="fx-pagado" data-pagar="${p.id}">Pagado</button>
          </div>`).join("") : `<div class="fx-vacio chico">Sin obligaciones registradas.</div>`}
        ${todosPagos.length > L.pagar.length ? `<button class="fx-link" data-toggle="todosPagos">${finUI.todosPagos ? `Solo los próximos ${FIN_VENTANA} días` : `Ver todas (${todosPagos.length})`}</button>` : ""}
      </div>` : ""}
    </div>
    <div class="fx-card fx-card-cobrar ${finUI.verCobros ? "abierta" : ""}">
      <span class="fx-card-lbl">Por cobrar · próximos ${FIN_VENTANA} días</span>
      <span class="fx-card-num ${L.tCobrar ? "bien" : ""}">${fmtCOP(L.tCobrar)}</span>
      <span class="fx-card-sub">${L.cobrar.length
        ? `${L.cobrar.length} ${L.cobrar.length === 1 ? "cobro" : "cobros"}${sigCobro ? ` · siguiente: <b>${esc(sigCobro.cliente)}</b> ${finFechaCorta(sigCobro.fecha)}` : ""}${L.vencidoCobrar ? ` · <b class="mal">vencido ${fmtCOP(L.vencidoCobrar)}</b>` : ""}`
        : "Nada facturado vence en esta ventana"}</span>
      <div class="fx-card-acc">
        <button class="fx-link" data-toggle="verCobros">${finUI.verCobros ? "Ocultar" : "Ver detalle"}</button>
      </div>
      ${finUI.verCobros ? `
      <div class="fx-lista">
        ${L.cobrar.length ? L.cobrar.map(p => `
          <div class="fx-item ${p.fecha < hoy ? "vencido" : ""}" data-cobro="${p.id}">
            <span class="fx-item-nom"><b>${esc(p.cliente)}</b><small>${esc(p.servicio || "")}</small></span>
            <span class="fx-item-fecha">${finFechaCorta(p.fecha)}${p.fecha < hoy ? " <small>vencido</small>" : ""}</span>
            <span class="fx-item-val">${fmtCOP(p.valor)}</span>
            <button class="fx-pagado" data-cobrar="${p.id}">${p.estado === "aprobado" ? "Anticipo recibido" : "Cobrado"}</button>
          </div>`).join("") : `<div class="fx-vacio chico">Aquí aparecen las facturas enviadas y los anticipos aprobados con fecha dentro de ${FIN_VENTANA} días.</div>`}
      </div>` : ""}
    </div>
  </div>`;
}
function finWireLiquidez(el) {
  const liq = el.querySelector("#fxLiq");
  if (!liq) return;
  const btn = liq.querySelector("#fxCajaBtn"), inp = liq.querySelector("#fxCajaInput");
  btn.onclick = () => { btn.hidden = true; inp.hidden = false; inp.focus(); inp.select(); };
  const cerrarCaja = () => {
    const t = inp.value.trim();
    if (t && Number.isNaN(parseNum(t))) { toastVivo("Escribe solo números, por ejemplo 1.200.000"); }
    else finz.caja = finMonto(t);
    guardarFin(); finRender();
  };
  inp.onblur = cerrarCaja;
  inp.onkeydown = e => {
    if (e.key === "Escape") { e.preventDefault(); inp.value = finz.caja ? nfCO.format(finMonto(finz.caja)) : ""; inp.blur(); }
    else if (e.key === "Enter") { e.preventDefault(); inp.blur(); }
  };
  liq.querySelectorAll("[data-toggle]").forEach(b => b.onclick = () => {
    finUI[b.dataset.toggle] = !finUI[b.dataset.toggle];
    finRender();
  });
  liq.querySelector("#fxNuevoPago").onclick = () => openFinPago(null);
  liq.querySelectorAll("[data-pago]").forEach(f => f.onclick = e => { if (e.target.closest("button")) return; openFinPago(f.dataset.pago); });
  liq.querySelectorAll("[data-cobro]").forEach(f => f.onclick = e => { if (e.target.closest("button")) return; openFinItem(f.dataset.cobro); });
  liq.querySelectorAll("[data-pagar]").forEach(b => b.onclick = e => {
    e.stopPropagation();
    const p = finz.pagos.find(x => x.id === b.dataset.pagar);
    if (!p) return;
    finMarcarPagado(p);
    guardarFin(); finRender();
  });
  liq.querySelectorAll("[data-cobrar]").forEach(b => b.onclick = e => {
    e.stopPropagation();
    const p = finz.pipeline.find(x => x.id === b.dataset.cobrar);
    if (!p) return;
    if (p.estado === "aprobado") {
      finCambiarEstado(p, "ejecucion");
      guardarFin(); finRender();
      toastVivo(`${p.cliente}: anticipo recibido, proyecto en ejecución`);
      return;
    }
    finCambiarEstado(p, "pagado");
    guardarFin(); finRender();
    toastVivo(`${p.cliente}: ${fmtCOP(p.valor)} cobrado`);
  });
}
// Pagado: lo recurrente salta al mes siguiente; lo demás se archiva
function finMarcarPagado(p) {
  const nombre = p.nombre;
  if (p.recurrente) {
    const base = p.fecha || hoyISO();
    p.dia = p.dia || Number(base.slice(8));
    p.fecha = sumarMeses(base, 1, p.dia);
    toastVivo(`${nombre}: siguiente pago ${finFechaCorta(p.fecha)}`);
  } else {
    p.pagado = true; p.pagadoEn = hoyISO();
    toastVivo(`${nombre} marcado como pagado`);
  }
}

function openFinPago(id) {
  const nuevo = !id;
  const p = nuevo
    ? { id: finId("g"), nombre: "", tipo: "software", valor: 0, fecha: sumarDias(hoyISO(), 7), recurrente: true }
    : finz.pagos.find(x => x.id === id);
  if (!p) return;
  const fechaTxt = iso => new Date(iso + "T12:00:00").toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "short" });
  drawer.innerHTML = `
    <button class="close-btn" id="drawerClose" aria-label="Cerrar">✕</button>
    <h2>${nuevo ? "Nueva obligación" : esc(p.nombre || "Obligación")}</h2>
    <div class="sub">${nuevo ? "Tarjetas, software, servicios: lo que sale de la caja" : `${FIN_PAGO_TIPOS[p.tipo] || "Otro"} · ${fmtCOP(p.valor)}`}</div>
    <section>
      <h4>Nombre</h4>
      <input class="edit-input" id="fgNombre" value="${esc(p.nombre)}" placeholder="Ej. Tarjeta de crédito, Adobe" autocomplete="off">
      <div class="aprob-pills fx-pills fx-pills-4" id="fgTipo" style="margin-top:10px">
        ${Object.entries(FIN_PAGO_TIPOS).map(([k, n]) => `<button data-tipo="${k}" class="${p.tipo === k ? "sel" : ""}">${n}</button>`).join("")}
      </div>
    </section>
    <section>
      <h4>Valor</h4>
      <input class="edit-input num" id="fgValor" inputmode="decimal" value="${p.valor ? nfCO.format(finMonto(p.valor)) : ""}" placeholder="0">
    </section>
    <section>
      <h4>Fecha de pago</h4>
      <button type="button" class="edit-input fecha-btn" id="fgFechaBtn">${fechaTxt(p.fecha)}</button>
      <div class="calp" id="fgCal" hidden></div>
      <label class="check-item" style="margin-top:10px"><input type="checkbox" id="fgRec" ${p.recurrente ? "checked" : ""}><span>Se repite cada mes (al marcarla pagada salta al mes siguiente)</span></label>
    </section>
    <div class="fx-drawer-acciones">
      ${nuevo ? `<button class="btn-primary" id="fgCrear">Agregar</button>` : `<button class="btn-primary" id="fgListo">Listo</button>`}
      ${!nuevo ? `<button class="link-btn" id="fgEliminar" style="color:#F28B82">Eliminar</button>` : ""}
    </div>`;
  if (!drawer.classList.contains("open")) posicionarDrawer();
  drawer.classList.add("open");
  backdrop.classList.add("open");
  drawer.querySelector("#drawerClose").onclick = closeDrawer;
  const leer = () => {
    p.nombre = drawer.querySelector("#fgNombre").value.trim();
    p.valor = finMonto(drawer.querySelector("#fgValor").value);
    p.recurrente = drawer.querySelector("#fgRec").checked;
  };
  const persistir = () => { if (nuevo) return; leer(); guardarFin(); finRender(); };
  ["#fgNombre", "#fgValor", "#fgRec"].forEach(sel => {
    const i = drawer.querySelector(sel);
    i.onchange = () => { if (sel === "#fgValor" && !finValorValido(i, p.valor)) return; persistir(); };
    if (i.type !== "checkbox") i.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); i.blur(); } };
  });
  drawer.querySelectorAll("#fgTipo button").forEach(b => b.onclick = () => {
    p.tipo = b.dataset.tipo;
    drawer.querySelectorAll("#fgTipo button").forEach(x => x.classList.toggle("sel", x === b));
    persistir();
  });
  const fechaBtn = drawer.querySelector("#fgFechaBtn"), cal = drawer.querySelector("#fgCal");
  fechaBtn.onclick = () => {
    cal.hidden = !cal.hidden;
    if (!cal.hidden) pintarCalPanel(cal, p.fecha, iso => {
      p.fecha = iso; p.dia = Number(iso.slice(8)); cal.hidden = true; fechaBtn.textContent = fechaTxt(iso); persistir();
    });
  };
  if (nuevo) drawer.querySelector("#fgCrear").onclick = () => {
    leer();
    if (!p.nombre) { drawer.querySelector("#fgNombre").focus(); return; }
    finz.pagos.push(p);
    finUI.verPagos = true;
    guardarFin(); closeDrawer(); finRender();
  };
  else {
    drawer.querySelector("#fgListo").onclick = () => { leer(); guardarFin(); closeDrawer(); finRender(); };
    drawer.querySelector("#fgEliminar").onclick = () => {
      if (!confirm(`¿Eliminar "${p.nombre}"?`)) return;
      finz.pagos = finz.pagos.filter(x => x.id !== p.id);
      guardarFin(); closeDrawer(); finRender();
    };
  }
  if (nuevo && matchMedia("(hover: hover)").matches) setTimeout(() => drawer.querySelector("#fgNombre").focus(), 80);
}

// ---------- Respaldo: restaurar un JSON exportado desde "Respaldar" ----------
function finRestaurarDesdeArchivo(file) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const j = JSON.parse(r.result);
      const f = j && typeof j === "object" ? (j.finanzas && typeof j.finanzas === "object" ? j.finanzas : j) : null;
      // estado.json / cola.json también traen "meta": exigir la forma del respaldo de Finanzas
      if (!f || !(Array.isArray(f.cuentas) || Array.isArray(f.pipeline))) throw 0;
      if (Array.isArray(f.cuentas)) finz.cuentas = f.cuentas;
      if (f.celdas && typeof f.celdas === "object" && !Array.isArray(f.celdas)) finz.celdas = f.celdas;
      if (typeof f.caja === "number") finz.caja = f.caja;
      if (f.meta && typeof f.meta === "object" && ("total" in f.meta || "abono" in f.meta || "modo" in f.meta)) finz.meta = Object.assign({}, FIN_SEMILLA_BASE.meta, f.meta);
      if (Array.isArray(f.pipeline)) finz.pipeline = f.pipeline;
      if (Array.isArray(f.pagos)) finz.pagos = f.pagos;
      if (Array.isArray(f.objetivos)) finz.objetivos = f.objetivos;
      finz.cuentas = (finz.cuentas || []).filter(x => x && typeof x === "object");
      finMigrar();
      guardarFin();
      if (j.proyectos && typeof pros !== "undefined" && j.proyectos.lista) { pros = j.proyectos; guardarPro(); if (typeof renderProyectos === "function") renderProyectos(); }
      finRender();
      toastVivo("Finanzas restauradas desde el respaldo");
    } catch { toastVivo("Ese archivo no es un respaldo de Finanzas"); }
  };
  r.readAsText(file);
}

// Punto de entrada desde renderFinanzas (app.js)
function finWire(el) {
  finWireLiquidez(el);
  finWireObjetivos(el);
  finPintarFlujo(el);
  finWireProyeccion(el);
  finWirePipeline(el);
  const rest = el.querySelector("#finRestaurar"), inp = el.querySelector("#finRestaurarInput");
  if (rest && inp) {
    rest.onclick = () => inp.click();
    inp.onchange = () => { if (inp.files && inp.files[0]) finRestaurarDesdeArchivo(inp.files[0]); inp.value = ""; };
  }
}

// ════════════════════════════════════════════════════════════
// 4. OBJETIVOS — metas claras con avance real
// ════════════════════════════════════════════════════════════
const FIN_OBJ_TIPOS = { mes: "Ingresos del mes", anio: "Ingresos del año", ahorro: "Meta de ahorro" };
function finCobradoEn(prefijo) {
  return finz.pipeline
    .filter(p => p.estado === "pagado" && String(p.pagadoEn || p.fecha || "").startsWith(prefijo))
    .reduce((s, p) => s + finMonto(p.valor), 0);
}
function finObjetivoAvance(o) {
  const hoy = hoyISO();
  const actual = o.tipo === "mes" ? finCobradoEn(hoy.slice(0, 7)) : o.tipo === "anio" ? finCobradoEn(hoy.slice(0, 4)) : finMonto(o.actual);
  const meta = finMonto(o.meta);
  const pct = meta > 0 ? Math.min(1, actual / meta) : 0;
  return { actual, meta, pct, falta: Math.max(0, meta - actual) };
}
function finObjetivosHtml() {
  const hoy = hoyISO();
  const diasMes = new Date(+hoy.slice(0, 4), +hoy.slice(5, 7), 0).getDate();
  const quedanMes = diasMes - +hoy.slice(8);
  const lista = finz.objetivos;
  return `
  <div class="fin-panel fx-obj" id="fxObj">
    <div class="fx-head">
      <div>
        <h3>Objetivos</h3>
        <p class="fin-hint">Metas claras con su avance real: lo cobrado del pipeline cuenta solo; el ahorro lo actualizas tú.</p>
      </div>
      <button class="btn-primary" id="fxNuevoObj">＋ Nuevo objetivo</button>
    </div>
    ${lista.length ? `<div class="fx-obj-grid">${lista.map(o => {
      const a = finObjetivoAvance(o);
      const sub = o.tipo === "mes" ? `${quedanMes} ${quedanMes === 1 ? "día" : "días"} para cerrar el mes`
        : o.tipo === "anio" ? `cobrado en ${hoy.slice(0, 4)}`
        : (o.fecha ? `para ${finFechaCorta(o.fecha)}` : "meta de ahorro");
      return `
      <button class="fx-obj-card ${a.pct >= 1 ? "lograda" : ""}" data-obj="${o.id}">
        <span class="fx-obj-tipo">${FIN_OBJ_TIPOS[o.tipo]}</span>
        <span class="fx-obj-nom">${esc(o.nombre || FIN_OBJ_TIPOS[o.tipo])}</span>
        <span class="fx-obj-num">${fmtCOP(a.actual)} <small>de ${fmtCOP(a.meta)}</small></span>
        <span class="fx-obj-bar"><i style="width:${(a.pct * 100).toFixed(1)}%"></i></span>
        <span class="fx-obj-sub"><b>${Math.round(a.pct * 100)}%</b> · ${a.pct >= 1 ? "lograda" : `faltan ${fmtCOP(a.falta)}`} · ${sub}</span>
      </button>`;
    }).join("")}</div>`
    : `<div class="fx-vacio">Define tu primer objetivo: ingresos del mes, del año o una meta de ahorro.</div>`}
  </div>`;
}
function finWireObjetivos(el) {
  const panel = el.querySelector("#fxObj");
  if (!panel) return;
  panel.querySelector("#fxNuevoObj").onclick = () => openFinObjetivo(null);
  panel.querySelectorAll("[data-obj]").forEach(b => b.onclick = () => openFinObjetivo(b.dataset.obj));
}
function openFinObjetivo(id) {
  const nuevo = !id;
  const o = nuevo ? { id: finId("o"), nombre: "", tipo: "mes", meta: 0, actual: 0, fecha: "" } : finz.objetivos.find(x => x.id === id);
  if (!o) return;
  const fechaTxt = iso => iso ? new Date(iso + "T12:00:00").toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "short" }) : "Sin fecha";
  drawer.innerHTML = `
    <button class="close-btn" id="drawerClose" aria-label="Cerrar">✕</button>
    <h2>${nuevo ? "Nuevo objetivo" : esc(o.nombre || FIN_OBJ_TIPOS[o.tipo])}</h2>
    <div class="sub">${nuevo ? "Una meta concreta, con cifra" : FIN_OBJ_TIPOS[o.tipo]}</div>
    <section>
      <h4>Nombre</h4>
      <input class="edit-input" id="foNombre" value="${esc(o.nombre)}" placeholder="Ej. Ingresos de octubre, Fondo de tranquilidad" autocomplete="off">
      <div class="aprob-pills fx-pills" id="foTipo" style="margin-top:10px">
        ${Object.entries(FIN_OBJ_TIPOS).map(([k, n]) => `<button data-tipo="${k}" class="${o.tipo === k ? "sel" : ""}">${n}</button>`).join("")}
      </div>
    </section>
    <section>
      <h4>Meta</h4>
      <input class="edit-input num" id="foMeta" inputmode="decimal" value="${o.meta ? nfCO.format(finMonto(o.meta)) : ""}" placeholder="0">
    </section>
    <section id="foAhorro" ${o.tipo === "ahorro" ? "" : "hidden"}>
      <h4>Ya ahorrado</h4>
      <input class="edit-input num" id="foActual" inputmode="decimal" value="${o.actual ? nfCO.format(finMonto(o.actual)) : ""}" placeholder="0">
      <h4 style="margin-top:14px">Fecha límite (opcional)</h4>
      <button type="button" class="edit-input fecha-btn" id="foFechaBtn">${fechaTxt(o.fecha)}</button>
      <div class="calp" id="foCal" hidden></div>
    </section>
    <p class="fin-hint" id="foAuto" ${o.tipo === "ahorro" ? "hidden" : ""}>El avance se calcula solo con lo marcado como <b>Pagado</b> en el pipeline.</p>
    <div class="fx-drawer-acciones">
      ${nuevo ? `<button class="btn-primary" id="foCrear">Crear objetivo</button>` : `<button class="btn-primary" id="foListo">Listo</button>`}
      ${!nuevo ? `<button class="link-btn" id="foEliminar" style="color:#F28B82">Eliminar</button>` : ""}
    </div>`;
  if (!drawer.classList.contains("open")) posicionarDrawer();
  drawer.classList.add("open");
  backdrop.classList.add("open");
  drawer.querySelector("#drawerClose").onclick = closeDrawer;
  const leer = () => {
    o.nombre = drawer.querySelector("#foNombre").value.trim();
    o.meta = finMonto(drawer.querySelector("#foMeta").value);
    o.actual = finMonto(drawer.querySelector("#foActual").value);
  };
  const persistir = () => { if (nuevo) return; leer(); guardarFin(); finRender(); };
  [["#foNombre", null], ["#foMeta", "meta"], ["#foActual", "actual"]].forEach(([sel, campo]) => {
    const i = drawer.querySelector(sel);
    i.onchange = () => { if (campo && !finValorValido(i, o[campo])) return; persistir(); };
    i.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); i.blur(); } };
  });
  drawer.querySelectorAll("#foTipo button").forEach(b => b.onclick = () => {
    o.tipo = b.dataset.tipo;
    drawer.querySelectorAll("#foTipo button").forEach(x => x.classList.toggle("sel", x === b));
    drawer.querySelector("#foAhorro").hidden = o.tipo !== "ahorro";
    drawer.querySelector("#foAuto").hidden = o.tipo === "ahorro";
    persistir();
  });
  const fechaBtn = drawer.querySelector("#foFechaBtn"), cal = drawer.querySelector("#foCal");
  fechaBtn.onclick = () => {
    cal.hidden = !cal.hidden;
    if (!cal.hidden) pintarCalPanel(cal, o.fecha || hoyISO(), iso => { o.fecha = iso; cal.hidden = true; fechaBtn.textContent = fechaTxt(iso); persistir(); });
  };
  if (nuevo) drawer.querySelector("#foCrear").onclick = () => {
    leer();
    if (!o.meta) { drawer.querySelector("#foMeta").focus(); return; }
    finz.objetivos.push(o);
    guardarFin(); closeDrawer(); finRender();
  };
  else {
    drawer.querySelector("#foListo").onclick = () => { leer(); guardarFin(); closeDrawer(); finRender(); };
    drawer.querySelector("#foEliminar").onclick = () => {
      if (!confirm(`¿Eliminar el objetivo "${o.nombre || FIN_OBJ_TIPOS[o.tipo]}"?`)) return;
      finz.objetivos = finz.objetivos.filter(x => x.id !== o.id);
      guardarFin(); closeDrawer(); finRender();
    };
  }
  if (nuevo && matchMedia("(hover: hover)").matches) setTimeout(() => drawer.querySelector("#foNombre").focus(), 80);
}

// ════════════════════════════════════════════════════════════
// 5. FLUJO DE CAJA PROYECTADO — la caja mes a mes con lo que ya
// está en el pipeline (entra) y las obligaciones (sale)
// ════════════════════════════════════════════════════════════
const FIN_MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
function finMesIndex(iso, base) {
  const [y, m] = String(iso || "").slice(0, 7).split("-").map(Number);
  const [by, bm] = base.split("-").map(Number);
  if (!y || !m) return 0;
  return (y - by) * 12 + (m - bm);
}
function finFlujo(n = 12) {
  const hoy = hoyISO(), base = hoy.slice(0, 7);
  const meses = Array.from({ length: n }, (_, k) => {
    const d = new Date(+base.slice(0, 4), +base.slice(5, 7) - 1 + k, 1);
    const label = FIN_MESES_CORTOS[d.getMonth()] + (k === 0 || d.getMonth() === 0 ? " " + String(d.getFullYear()).slice(2) : "");
    return { k, clave: isoDe(d).slice(0, 7), label, largo: d.toLocaleDateString("es-CO", { month: "long", year: "numeric" }), entradas: 0, posibles: 0, salidas: 0, detalle: [] };
  });
  const add = (k, campo, v, txt) => {
    if (k < 0) k = 0;
    if (k >= n) return;
    meses[k][campo] += v;
    if (txt) meses[k].detalle.push(txt);
  };
  // Retainers = una serie mensual por cliente (las copias de "Repetir el próximo mes" no se duplican)
  const series = new Map();
  for (const p of finPipelineActivo()) {
    const v = finMonto(p.valor);
    if (!v) continue;
    const k = finMesIndex(p.fecha, base);
    if (p.tipo === "retainer") {
      if (p.estado === "cotizacion") { add(k, "posibles", v, `Posible · ${p.cliente} ${fmtCOP(v)}`); continue; }
      const key = (p.cliente || "").trim().toLowerCase() + "|" + v;
      const s = series.get(key) || { desde: k, pagadoBase: false, cliente: p.cliente, v };
      s.desde = Math.min(s.desde, k);
      if (p.estado === "pagado" && k === 0) s.pagadoBase = true;
      series.set(key, s);
      continue;
    }
    if (p.estado === "pagado") continue; // ya está en la caja
    if (p.estado === "cotizacion") add(k, "posibles", v, `Posible · ${p.cliente} ${fmtCOP(v)}`);
    else add(k, "entradas", v, `${p.cliente} ${fmtCOP(v)}`);
  }
  for (const s of series.values()) {
    for (let k = Math.max(0, s.desde); k < n; k++) {
      if (k === 0 && s.pagadoBase) continue;
      add(k, "entradas", s.v, `${s.cliente} · retainer ${fmtCOP(s.v)}`);
    }
  }
  for (const g of finz.pagos) {
    if (g.pagado) continue;
    const v = finMonto(g.valor);
    if (!v) continue;
    const k = finMesIndex(g.fecha, base);
    if (g.recurrente) { for (let j = Math.max(0, k); j < n; j++) add(j, "salidas", v, `${g.nombre} −${fmtCOP(v)}`); }
    else add(k, "salidas", v, `${g.nombre} −${fmtCOP(v)}`);
  }
  const gastosFijos = (finz.cuentas || []).reduce((s, c) => s + (parseNum(c && c.gastos) || 0), 0);
  if (gastosFijos) meses.forEach(m => { m.salidas += gastosFijos; });
  let caja = finMonto(finz.caja), cajaPos = caja;
  meses.forEach(m => {
    m.neto = m.entradas - m.salidas;
    caja += m.neto; m.caja = caja;
    cajaPos += m.neto + m.posibles; m.cajaPosible = cajaPos;
  });
  return { meses, gastosFijos, hayPosibles: meses.some(m => m.posibles > 0) };
}
function finFlujoSvg(F, w, geo) {
  const h = w < 520 ? 240 : 300;
  const padL = w < 520 ? 54 : 66, padR = 18, padT = 16, padB = 46;
  const n = F.meses.length;
  const vals = F.meses.map(m => m.caja).concat(F.hayPosibles ? F.meses.map(m => m.cajaPosible) : []);
  const maxV = Math.max(...vals, 0), minV = Math.min(...vals, 0);
  const maxY = finNiceMax(maxV || (minV < 0 ? -minV : 1e6));
  const minY = minV < 0 ? -finNiceMax(-minV) : 0;
  const iw = w - padL - padR, ih = h - padT - padB;
  const X = k => padL + iw * k / (n - 1);
  const Y = v => padT + ih * (1 - (Math.min(Math.max(v, minY), maxY) - minY) / (maxY - minY));
  const divs = 5;
  let grid = "", ylab = "", xlab = "";
  for (let i = 0; i <= divs; i++) {
    const v = minY + (maxY - minY) * i / divs, y = Y(v).toFixed(1);
    grid += `<line class="fx-grid" x1="${padL}" x2="${w - padR}" y1="${y}" y2="${y}"/>`;
    ylab += `<text class="fx-ytxt" x="${padL - 10}" y="${y}" text-anchor="end" dominant-baseline="middle">${finTick(Math.round(v), Math.max(maxY, -minY))}</text>`;
  }
  const paso = w < 520 ? 2 : 1;
  F.meses.forEach((m, k) => { if (k % paso === 0) xlab += `<text class="fx-xtxt" x="${X(k).toFixed(1)}" y="${h - padB + 22}" text-anchor="middle">${m.label}</text>`; });
  const y0 = Y(Math.max(minY, 0)).toFixed(1);
  const linea = F.meses.map((m, k) => `${k ? "L" : "M"}${X(k).toFixed(1)},${Y(m.caja).toFixed(1)}`).join(" ");
  const area = `${linea} L${X(n - 1).toFixed(1)},${y0} L${X(0).toFixed(1)},${y0} Z`;
  const posible = F.hayPosibles ? F.meses.map((m, k) => `${k ? "L" : "M"}${X(k).toFixed(1)},${Y(m.cajaPosible).toFixed(1)}`).join(" ") : "";
  Object.assign(geo, { n, X, Y, w, h, padL, padT, iw, ih });
  return `
  <svg class="fx-svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Caja proyectada por mes">
    <defs>
      <linearGradient id="fxGradFlujo" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" style="stop-color:var(--fx-acento, ${FIN_ACENTO})" stop-opacity=".45"/>
        <stop offset=".6" style="stop-color:var(--fx-acento, ${FIN_ACENTO})" stop-opacity=".14"/>
        <stop offset="1" style="stop-color:var(--fx-acento, ${FIN_ACENTO})" stop-opacity=".02"/>
      </linearGradient>
    </defs>
    ${grid}${ylab}${xlab}
    <line class="fx-eje" x1="${padL}" x2="${padL}" y1="${padT}" y2="${padT + ih}"/>
    ${minY < 0 ? `<line class="fx-cero" x1="${padL}" x2="${w - padR}" y1="${y0}" y2="${y0}"/>` : ""}
    <path class="fx-area" style="fill:url(#fxGradFlujo)" d="${area}"/>
    <path class="fx-linea" d="${linea}"/>
    ${posible ? `<path class="fx-linea-pos" d="${posible}"/>` : ""}
    <g class="fx-hover" id="fxHoverFlujo" style="display:none">
      <line class="fx-guia" x1="0" x2="0" y1="${padT}" y2="${padT + ih}"/>
      <circle class="fx-dot" r="5.5" cx="0" cy="0"/>
    </g>
  </svg>`;
}
function finFlujoHtml() {
  return `
  <div class="fin-panel fx-flujo" id="fxFlujo">
    <div class="fx-head">
      <div>
        <h3>Flujo de caja proyectado</h3>
        <p class="fin-hint">Tu caja mes a mes con lo que ya está en el pipeline: retainers y proyectos aprobados entran; obligaciones y gastos fijos salen. Las cotizaciones van aparte, en línea punteada.</p>
      </div>
    </div>
    <div id="fxFlujoVivo"></div>
  </div>`;
}
function finPintarFlujo(el) {
  const vivo = el.querySelector("#fxFlujoVivo");
  if (!vivo) return;
  const F = finFlujo(12);
  const w = Math.max(260, Math.round(vivo.clientWidth || el.clientWidth || 720) - 2);
  const geo = {};
  const svg = finFlujoSvg(F, w, geo);
  const m3 = F.meses.slice(0, 3);
  const ent3 = m3.reduce((s, m) => s + m.entradas, 0), sal3 = m3.reduce((s, m) => s + m.salidas, 0);
  const primerNeg = F.meses.find(m => m.caja < 0);
  const fin = F.meses[F.meses.length - 1];
  vivo.innerHTML = `
    <div class="fx-metricas">
      <div class="fx-met"><span class="fx-met-num bien">${fmtCompacto(ent3)}</span><span class="fx-met-lbl">Entradas · próximos 3 meses</span></div>
      <div class="fx-met"><span class="fx-met-num mal">${fmtCompacto(sal3)}</span><span class="fx-met-lbl">Salidas · próximos 3 meses</span></div>
      <div class="fx-met"><span class="fx-met-num ${fin.caja < 0 ? "mal" : ""}">${fmtCompacto(fin.caja)}</span><span class="fx-met-lbl">Caja en 12 meses<br><span class="fx-met-sub ${primerNeg ? "mal" : "bien"}">${primerNeg ? `se agota en ${primerNeg.largo}` : "nunca baja de cero"}</span></span></div>
    </div>
    <div class="fx-chart" id="fxChartFlujo">
      ${svg}
      <div class="fx-tip fx-tip-flujo" id="fxTipFlujo" hidden></div>
    </div>
    <div class="fx-leyenda">
      <span><i class="fx-sw"></i>Caja proyectada</span>
      ${F.hayPosibles ? `<span><i class="fx-sw pos"></i>Si entran las cotizaciones</span>` : ""}
      ${F.gastosFijos ? `<span class="fx-ley-dato">Gastos fijos: <b>${fmtCOP(F.gastosFijos)}/mes</b></span>` : ""}
    </div>`;
  const chart = vivo.querySelector("#fxChartFlujo");
  const svgEl = chart.querySelector("svg");
  const hover = chart.querySelector("#fxHoverFlujo");
  const tip = chart.querySelector("#fxTipFlujo");
  const mover = ev => {
    const r = svgEl.getBoundingClientRect();
    const x = (ev.clientX - r.left) * (geo.w / r.width);
    const k = Math.max(0, Math.min(geo.n - 1, Math.round((x - geo.padL) / geo.iw * (geo.n - 1))));
    const m = F.meses[k];
    const cx = geo.X(k), cy = geo.Y(m.caja);
    hover.style.display = "";
    hover.querySelector(".fx-guia").setAttribute("x1", cx.toFixed(1));
    hover.querySelector(".fx-guia").setAttribute("x2", cx.toFixed(1));
    const dot = hover.querySelector(".fx-dot");
    dot.setAttribute("cx", cx.toFixed(1)); dot.setAttribute("cy", cy.toFixed(1));
    tip.hidden = false;
    tip.innerHTML = `<b class="${m.caja < 0 ? "mal" : ""}">${fmtCOP(m.caja)}</b><span>${m.largo}</span>
      <span class="bien">+ ${fmtCOP(m.entradas)} entra</span><span class="mal">− ${fmtCOP(m.salidas)} sale</span>
      ${m.posibles ? `<span>Posible: +${fmtCOP(m.posibles)}</span>` : ""}
      ${m.detalle.slice(0, 4).map(d => `<small>${esc(d)}</small>`).join("")}${m.detalle.length > 4 ? `<small>+${m.detalle.length - 4} más</small>` : ""}`;
    const cw = chart.clientWidth || r.width, xPx = cx / geo.w * cw, tw = tip.offsetWidth || 170;
    let left = xPx + 12;
    if (left + tw > cw) left = xPx - 12 - tw;
    left = Math.max(0, Math.min(left, Math.max(0, cw - tw)));
    tip.style.left = left.toFixed(1) + "px";
  };
  const salir = () => { hover.style.display = "none"; tip.hidden = true; };
  chart.onpointermove = mover;
  chart.onpointerdown = mover;
  chart.onpointerleave = salir;
}
