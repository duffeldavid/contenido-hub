// ============================================================
// CONTENIDO HUB — lógica de la app
// Sin dependencias. El avance (estados + checklists) vive en
// localStorage del navegador; los datos base en data.js.
// ============================================================

const ESTADOS = ["Idea", "Por grabar", "En edición", "Listo", "Programado", "Publicado"];
const ESTADO_CLASS = {
  "Idea": "st-Idea", "Por grabar": "st-PorGrabar", "En edición": "st-EnEdicion",
  "Listo": "st-Listo", "Programado": "st-Programado", "Publicado": "st-Publicado",
};
const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const LS_KEY = "contenidoHub." + MES.clave;

// ---------- Estado persistente ----------
let store = load();
function load() {
  try { return JSON.parse(localStorage.getItem(LS_KEY)) || { estados: {}, checks: {} }; }
  catch { return { estados: {}, checks: {} }; }
}
function save() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(store)); } catch {}
}
function estadoDe(p) { return store.estados[p.id] || p.estado; }
function checksDe(p) { return store.checks[p.id] || []; }

// ---------- Filtro de marca ----------
let marcaActiva = "todas";
function piezasVisibles() {
  return PIEZAS.filter(p => marcaActiva === "todas" || p.marca === marcaActiva)
    .slice().sort((a, b) => a.fecha.localeCompare(b.fecha));
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
function brandColor(p) { return MARCAS[p.marca].color; }

function pieceCard(p, { compact = false } = {}) {
  const est = estadoDe(p);
  const done = est === "Publicado";
  return `
    <article class="piece ${done ? "done" : ""}" style="--brand-color:${brandColor(p)}" data-id="${p.id}">
      <div class="piece-top">
        <span class="chip brand">${MARCAS[p.marca].nombre}</span>
        <span class="chip estado ${ESTADO_CLASS[est]}">${est}</span>
        ${p.reencauche ? `<span class="chip reencauche">Reencauche</span>` : ""}
      </div>
      <div class="piece-title">${esc(p.titulo)}</div>
      ${compact ? "" : `<div class="piece-meta">${p.formato} · ${esc(p.mensaje)} · ${esc(p.tono)}</div>`}
    </article>`;
}

// ---------- Vista: Calendario ----------
function renderCalendario() {
  const el = document.getElementById("view-calendario");
  const piezas = piezasVisibles();
  const hoy = hoyISO();

  // agrupar por fecha, luego por semana
  const porFecha = {};
  piezas.forEach(p => (porFecha[p.fecha] = porFecha[p.fecha] || []).push(p));
  const fechas = Object.keys(porFecha).sort();

  const semanas = {};
  fechas.forEach(f => {
    const { date } = fmtFecha(f);
    const monday = new Date(date);
    monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    const wk = monday.toISOString().slice(0, 10);
    (semanas[wk] = semanas[wk] || []).push(f);
  });

  let html = `<p class="view-note">Cada fecha de publicación con sus piezas. Toca una pieza para ver el copy completo, el checklist de producción, el equipo y las referencias.</p>`;
  let wkNum = 1;
  for (const wk of Object.keys(semanas).sort()) {
    html += `<div class="cal-week"><div class="cal-week-label">Semana ${wkNum++}</div><div class="cal-days">`;
    for (const f of semanas[wk]) {
      const { dia, num } = fmtFecha(f);
      const esHoy = f === hoy;
      html += `
        <div class="cal-day">
          <div class="cal-day-head ${esHoy ? "today" : ""}">
            <span class="cal-day-name">${dia}</span>
            <span class="cal-day-date">${num} de septiembre</span>
            ${esHoy ? `<span class="today-chip">Hoy</span>` : ""}
          </div>
          ${porFecha[f].map(p => pieceCard(p)).join("")}
        </div>`;
    }
    html += `</div></div>`;
  }
  el.innerHTML = html;
}

// ---------- Vista: Pipeline ----------
function renderPipeline() {
  const el = document.getElementById("view-pipeline");
  const piezas = piezasVisibles();
  let html = `<p class="view-note">El flujo de producción. Toca una pieza y cambia su estado desde el panel — el avance se guarda solo en este navegador.</p><div class="pipeline">`;
  for (const est of ESTADOS) {
    const grupo = piezas.filter(p => estadoDe(p) === est);
    html += `
      <div class="pipe-col">
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
}

// ---------- Vista: Rodaje ----------
function renderRodaje() {
  const el = document.getElementById("view-rodaje");
  const piezas = piezasVisibles();
  let html = `<p class="view-note">La clave anti-estancamiento: <b>dos días de rodaje al mes surten las 12 fechas de cada marca</b>. Todo lo demás es edición y diseño que puedes hacer cualquier noche. Graba con esta lista y el mes queda resuelto.</p>`;
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

// ---------- Vista: Referentes ----------
function renderReferentes() {
  const el = document.getElementById("view-referentes");
  const R = REFERENTES;
  let html = `
    <p class="view-note">Cómo lo hacen las grandes cuentas — investigación real, contenido filmado (no IA). El norte: <a href="${R.norte.url}" target="_blank" rel="noopener" style="color:var(--amber)">${R.norte.handle}</a>.</p>

    <div class="sesion">
      <h3>El norte: ${R.norte.handle}</h3>
      <p class="desc">${esc(R.norte.resumen)}</p>
      ${R.norte.lecciones.map(l => `<div class="tactic"><p style="margin:0;color:var(--text)">→ ${esc(l)}</p></div>`).join("")}
    </div>

    <div class="ref-section-title">☕ Café de especialidad</div>
    <div class="ref-grid">
      ${R.cafe.map(r => `
        <a class="ref-card" href="${r.url}" target="_blank" rel="noopener">
          <div class="cat">Instagram</div>
          <div class="handle">${esc(r.handle)}</div>
          <div class="why">${esc(r.why)}</div>
        </a>`).join("")}
    </div>

    <div class="ref-section-title">🥩 Carne premium</div>
    <div class="ref-grid">
      ${R.carne.map(r => `
        <a class="ref-card" href="${r.url}" target="_blank" rel="noopener">
          <div class="cat">Instagram</div>
          <div class="handle">${esc(r.handle)}</div>
          <div class="why">${esc(r.why)}</div>
        </a>`).join("")}
    </div>

    <div class="ref-section-title">⚡ Tácticas 2025-2026</div>
    ${R.tacticas.map(t => `<div class="tactic"><b>${esc(t.t)}</b><p>${esc(t.d)}</p></div>`).join("")}

    <div class="ref-section-title">🔍 Búsquedas de referencia (Pinterest / TikTok)</div>
    <div class="search-chips">
      ${R.busquedas.map(q => `
        <a href="https://www.pinterest.com/search/pins/?q=${encodeURIComponent(q)}" target="_blank" rel="noopener">📌 ${esc(q)}</a>
        <a href="https://www.tiktok.com/search?q=${encodeURIComponent(q)}" target="_blank" rel="noopener">🎵 ${esc(q)}</a>`).join("")}
    </div>`;
  el.innerHTML = html;
}

// ---------- Progreso ----------
function renderProgress() {
  const el = document.getElementById("progressStrip");
  const piezas = piezasVisibles();
  const pub = piezas.filter(p => estadoDe(p) === "Publicado").length;
  const listas = piezas.filter(p => ["Listo", "Programado", "Publicado"].includes(estadoDe(p))).length;
  const porGrabar = piezas.filter(p => estadoDe(p) === "Por grabar").length;
  const pct = piezas.length ? Math.round((pub / piezas.length) * 100) : 0;
  el.innerHTML = `
    <div class="stat">
      <div class="num">${pub}/${piezas.length}</div>
      <div class="lbl">publicadas este mes</div>
      <div class="bar"><i style="width:${pct}%"></i></div>
    </div>
    <div class="stat"><div class="num">${listas}</div><div class="lbl">listas o programadas</div></div>
    <div class="stat"><div class="num">${porGrabar}</div><div class="lbl">por grabar</div></div>
    <div class="stat"><div class="num">${piezas.filter(p => p.reencauche).length}</div><div class="lbl">reencauches (sin grabación)</div></div>`;
}

// ---------- Drawer ----------
const drawer = document.getElementById("drawer");
const backdrop = document.getElementById("drawerBackdrop");
let piezaAbierta = null;

function openDrawer(id) {
  const p = PIEZAS.find(x => x.id === id);
  if (!p) return;
  piezaAbierta = p;
  const m = MARCAS[p.marca];
  const { dia, num } = fmtFecha(p.fecha);
  const est = estadoDe(p);
  const checks = checksDe(p);

  drawer.innerHTML = `
    <button class="close-btn" id="drawerClose">✕</button>
    <span class="chip brand" style="--brand-color:${m.color}">${m.nombre} · ${m.handle}</span>
    <h2>${esc(p.titulo)}</h2>
    <div class="sub">${dia} ${num} de septiembre · ${p.formato}${p.reencauche ? " · Reencauche" : ""}</div>
    <div class="tag-row">
      <span class="chip">${esc(p.mensaje)}</span>
      <span class="chip">${esc(p.tono)}</span>
    </div>

    <section>
      <h4>Estado</h4>
      <div class="estado-select">
        ${ESTADOS.map(e => `<button data-estado="${e}" class="${e === est ? "sel " + ESTADO_CLASS[e] : ""}">${e}</button>`).join("")}
      </div>
    </section>

    <section>
      <h4>Idea / Copy</h4>
      <div class="copy-text">${esc(p.copy)}</div>
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

  drawer.classList.add("open");
  backdrop.classList.add("open");

  drawer.querySelector("#drawerClose").onclick = closeDrawer;
  drawer.querySelectorAll("[data-estado]").forEach(b => {
    b.onclick = () => {
      store.estados[p.id] = b.dataset.estado;
      save();
      openDrawer(p.id); // re-render drawer
      renderAll();
    };
  });
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
function closeDrawer() {
  drawer.classList.remove("open");
  backdrop.classList.remove("open");
  piezaAbierta = null;
}
backdrop.addEventListener("click", closeDrawer);
document.addEventListener("keydown", e => { if (e.key === "Escape") closeDrawer(); });

// clic en cualquier tarjeta
document.getElementById("main").addEventListener("click", e => {
  const card = e.target.closest(".piece");
  if (card) openDrawer(card.dataset.id);
});

// ---------- Navegación ----------
document.getElementById("brandSwitch").addEventListener("click", e => {
  const b = e.target.closest("button");
  if (!b) return;
  marcaActiva = b.dataset.brand;
  document.querySelectorAll("#brandSwitch button").forEach(x => x.classList.toggle("active", x === b));
  renderAll();
});
document.getElementById("tabs").addEventListener("click", e => {
  const b = e.target.closest("button");
  if (!b) return;
  document.querySelectorAll("#tabs button").forEach(x => x.classList.toggle("active", x === b));
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById("view-" + b.dataset.view).classList.add("active");
});

// ---------- Export / reset ----------
document.getElementById("btnExport").onclick = () => {
  const data = PIEZAS.map(p => ({
    marca: MARCAS[p.marca].nombre, fecha: p.fecha, pieza: p.titulo,
    estado: estadoDe(p), checklist: p.checklist.map((c, i) => ({ tarea: c, hecha: checksDe(p).includes(i) })),
  }));
  const blob = new Blob([JSON.stringify({ mes: MES.titulo, exportado: new Date().toISOString(), piezas: data }, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `contenido-hub-${MES.clave}.json`;
  a.click();
};
document.getElementById("btnReset").onclick = () => {
  if (confirm("¿Reiniciar todos los estados y checklists al valor original del calendario?")) {
    store = { estados: {}, checks: {} };
    save();
    renderAll();
  }
};

// ---------- Init ----------
function renderAll() {
  renderProgress();
  renderCalendario();
  renderPipeline();
  renderRodaje();
  renderReferentes();
}
document.getElementById("monthName").textContent = MES.titulo;
document.getElementById("monthCadence").textContent = MES.cadencia;
renderAll();
