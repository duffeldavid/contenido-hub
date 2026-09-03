// ============================================================
// CONTENIDO HUB — lógica de la app
// Sin dependencias. El avance (estados, checklists, aprobaciones
// y portadas) vive en localStorage y, en la versión Artifact,
// también embebido en la página para sincronizar dispositivos.
// ============================================================

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
  if (!candidatos.length) return { estados: {}, checks: {}, aprob: {}, portadas: {}, fechas: {}, ediciones: {} };
  candidatos.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  const s = candidatos[0];
  return {
    estados: s.estados || {}, checks: s.checks || {},
    aprob: s.aprob || {}, portadas: s.portadas || {},
    fechas: s.fechas || {}, ediciones: s.ediciones || {},
    updatedAt: s.updatedAt || 0,
  };
}
function save() {
  store.updatedAt = Date.now();
  try { localStorage.setItem(LS_KEY, JSON.stringify(store)); } catch {}
  if (window.hubSync) window.hubSync();
}
function estadoDe(p) { return store.estados[p.id] || p.estado; }
function checksDe(p) { return store.checks[p.id] || []; }
function aprobDe(p) { return store.aprob[p.id] || { v: "Pendiente", c: "" }; }
function portadaDe(p) { return store.portadas[p.id] || null; }
function fechaDe(p) { return store.fechas[p.id] || p.fecha; }
function tituloDe(p) { return (store.ediciones[p.id] || {}).titulo || p.titulo; }
function copyDe(p) { return (store.ediciones[p.id] || {}).copy || p.copy; }
function editadaDe(p) { const e = store.ediciones[p.id]; return !!(e && (e.titulo || e.copy)); }
// Todas las fechas L-M-V del mes (los "espacios" fijos del calendario)
const FECHAS_MES = [...new Set(PIEZAS.map(p => p.fecha))].sort();

// ---------- Filtro de marca ----------
let marcaActiva = "todas";
function piezasVisibles() {
  return PIEZAS.filter(p => marcaActiva === "todas" || p.marca === marcaActiva)
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
function brandColor(p) { return MARCAS[p.marca].color; }
function brandTint(p) { return p.marca === "forestal" ? "var(--forestal-tint)" : "var(--manzanares-tint)"; }
const FORMATO_ICONO = { "Reel": "🎬", "Foto": "📷", "Carrusel": "🖼️", "Pieza gráfica": "✏️", "Historia": "⚡" };

function pieceCard(p, { compact = false, drag = false } = {}) {
  const est = estadoDe(p);
  const ap = aprobDe(p).v;
  const done = est === "Publicado";
  return `
    <article class="piece ${done ? "done" : ""}" style="--brand-color:${brandColor(p)};--brand-tint:${brandTint(p)}" data-id="${p.id}" ${drag ? `draggable="true"` : ""}>
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
    </article>`;
}

// ---------- HERO ----------
const HERO_TEXT = {
  todas: {
    eyebrow: `${MES.titulo} · ${MES.cadencia}`,
    title: "Contenido que posiciona",
    sub: "Forestal Café y Carnes Manzanares — el mes completo planificado, grabable en dos sesiones y listo para aprobar.",
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
  forestal: "assets/bg-forestal.jpg",     // finca con sombrío
  tostadora: "assets/bg-tostadora.jpg",   // tostadora con granos
  manzanares: "assets/bg-manzanares.jpg", // cortes sobre madera
};
let bgActual = null;
function renderPageBg() {
  if (bgActual === marcaActiva) return; // no recargar las fotos en cada render
  bgActual = marcaActiva;
  const bg = document.getElementById("pageBg");
  if (marcaActiva === "forestal" || marcaActiva === "manzanares") {
    bg.innerHTML = `<img class="bg-photo" src="${BG_FOTOS[marcaActiva]}" alt=""><div class="bg-veil"></div>`;
  } else {
    bg.innerHTML = `
      <div class="bg-diptych">
        <img class="bg-photo" src="${BG_FOTOS.tostadora}" alt="">
        <img class="bg-photo" src="${BG_FOTOS.manzanares}" alt="">
      </div>
      <div class="bg-veil"></div>`;
  }
}

function renderHero() {
  const t = HERO_TEXT[marcaActiva];
  renderPageBg();
  document.getElementById("heroEyebrow").textContent = t.eyebrow;
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
    <div class="hstat"><span class="ico">✅</span><div><div class="num">${aprobadas}/${piezas.length}</div><div class="lbl">aprobadas por mercadeo</div></div></div>
    <div class="hstat"><span class="ico">🎥</span><div><div class="num">${porGrabar}</div><div class="lbl">por grabar</div></div></div>
    <div class="hstat"><span class="ico">📦</span><div><div class="num">${listas}</div><div class="lbl">listas o programadas</div></div></div>`;
}

// ---------- Vista: Calendario ----------
function renderCalendario() {
  const el = document.getElementById("view-calendario");
  const piezas = piezasVisibles();
  const hoy = hoyISO();

  const porFecha = {};
  piezas.forEach(p => (porFecha[fechaDe(p)] = porFecha[fechaDe(p)] || []).push(p));

  // Los espacios del calendario son SIEMPRE todos los L-M-V del mes,
  // aunque queden vacíos al arrastrar piezas a otra fecha.
  const semanas = {};
  FECHAS_MES.forEach(f => {
    const { date } = fmtFecha(f);
    const monday = new Date(date);
    monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    const wk = monday.toISOString().slice(0, 10);
    (semanas[wk] = semanas[wk] || []).push(f);
  });

  let html = `<p class="view-note">Toca una pieza para ver copy, checklist, portada y referencias. <b>Arrástrala a otro día</b> para reacomodar el mes (en el celular usa el selector de fecha dentro de la pieza).</p>`;
  let wkNum = 1;
  for (const wk of Object.keys(semanas).sort()) {
    html += `<div class="cal-week"><div class="cal-week-label">Semana ${wkNum++}</div><div class="cal-days">`;
    for (const f of semanas[wk]) {
      const { dia, num } = fmtFecha(f);
      const esHoy = f === hoy;
      const grupo = porFecha[f] || [];
      html += `
        <div class="cal-day" data-fecha="${f}">
          <div class="cal-day-head ${esHoy ? "today" : ""}">
            <span class="cal-day-name">${dia}</span>
            <span class="cal-day-date">${num} de septiembre</span>
            ${esHoy ? `<span class="today-chip">Hoy</span>` : ""}
          </div>
          ${grupo.map(p => pieceCard(p, { drag: true })).join("")}
        </div>`;
    }
    html += `</div></div>`;
  }
  el.innerHTML = html;
  activarDnD(el);
}

// ---------- Arrastrar y soltar entre fechas ----------
function activarDnD(root) {
  root.querySelectorAll('.piece[draggable="true"]').forEach(card => {
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
      moverPieza(id, day.dataset.fecha);
    });
  });
}
function moverPieza(id, fecha) {
  const p = PIEZAS.find(x => x.id === id);
  if (!p || !fecha || fechaDe(p) === fecha) return;
  if (fecha === p.fecha) delete store.fechas[id];
  else store.fechas[id] = fecha;
  save();
  renderAll();
}

// ---------- Vista: Pipeline ----------
function renderPipeline() {
  const el = document.getElementById("view-pipeline");
  const piezas = piezasVisibles();
  let html = `<p class="view-note">El flujo de producción. Toca una pieza y cambia su estado desde el panel — el avance se guarda solo.</p><div class="pipeline">`;
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
    const piezas = PIEZAS.filter(p => p.marca === mk).sort((a, b) => fechaDe(b).localeCompare(fechaDe(a)));
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
              <button class="cell ${img ? "has-img" : ""}" data-id="${p.id}" title="${esc(tituloDe(p))}">
                ${img
                  ? `<img src="${img}" alt="${esc(tituloDe(p))}">`
                  : `<span class="cell-ph"><span class="cell-fmt">${FORMATO_ICONO[p.formato] || "🎬"}</span><span class="cell-tit">${esc(tituloDe(p))}</span></span>`}
                <span class="cell-date">${d} sep</span>
                <span class="cell-hint">${img ? "Toca para abrir" : "Toca para abrir y subir portada"}</span>
              </button>`;
          }).join("")}
        </div>
      </div>`;
  }
  html += `</div><p class="view-note feed-note">Las casillas sin portada muestran el título de la pieza; a medida que produces, el feed se va viendo como quedará publicado.</p>`;
  el.innerHTML = html;
}

// ---------- Vista: Aprobación ----------
function renderAprobacion() {
  const el = document.getElementById("view-aprobacion");
  const piezas = piezasVisibles();
  const aprobadas = piezas.filter(p => aprobDe(p).v === "Aprobado").length;
  let html = `
    <p class="view-note">Revisión de mercadeo: marca cada pieza como <b>Aprobado</b> o <b>Ajustar</b> y deja tu comentario. Los cambios se guardan solos; el botón confirma la sincronización.</p>
    <div class="aprob-toolbar">
      <button class="btn-primary" id="btnGuardarRevision">Guardar revisión</button>
      <button class="btn-ghost" id="btnWhatsApp">📲 Enviar por WhatsApp para aprobación</button>
      <span class="aprob-saved" id="aprobSaved">${aprobadas}/${piezas.length} aprobadas</span>
    </div>`;
  for (const p of piezas) {
    const { dia, num } = fmtFecha(fechaDe(p));
    const a = aprobDe(p);
    html += `
      <div class="aprob-row" data-id="${p.id}">
        <div class="aprob-info">
          <div class="fecha">${dia} ${num} sep · ${MARCAS[p.marca].nombre} · ${p.formato}</div>
          <h4>${esc(tituloDe(p))}</h4>
          <div class="copy">${esc(copyDe(p))}</div>
          <button class="ver-mas" data-open="${p.id}">Ver pieza completa →</button>
        </div>
        <div class="aprob-controls">
          <div class="aprob-pills">
            ${APROB.map(v => `<button data-v="${v}" class="${a.v === v ? "sel" : ""}">${v === "Aprobado" ? "✓ " : ""}${v}</button>`).join("")}
          </div>
          <textarea class="aprob-comment" placeholder="Comentario para David (opcional)…">${esc(a.c || "")}</textarea>
        </div>
      </div>`;
  }
  el.innerHTML = html;

  el.querySelectorAll(".aprob-row").forEach(row => {
    const id = row.dataset.id;
    row.querySelectorAll(".aprob-pills button").forEach(b => {
      b.onclick = () => {
        store.aprob[id] = { ...aprobDe({ id }), v: b.dataset.v };
        save();
        renderAll({ keep: "aprobacion" });
      };
    });
    const ta = row.querySelector(".aprob-comment");
    ta.oninput = () => { store.aprob[id] = { ...aprobDe({ id }), c: ta.value }; };
    ta.onchange = () => save();
  });
  el.querySelectorAll("[data-open]").forEach(b => { b.onclick = () => openDrawer(b.dataset.open); });
  const btn = el.querySelector("#btnGuardarRevision");
  btn.onclick = () => {
    save();
    if (window.hubFlush) window.hubFlush();
    btn.textContent = "Revisión guardada ✓";
    setTimeout(() => { btn.textContent = "Guardar revisión"; }, 2500);
  };
  el.querySelector("#btnWhatsApp").onclick = () => {
    const pendientes = piezas.filter(p => aprobDe(p).v === "Pendiente");
    const revisadas = piezas.filter(p => aprobDe(p).v !== "Pendiente");
    const marcaTxt = marcaActiva === "todas" ? "Forestal Café + Carnes Manzanares" : MARCAS[marcaActiva].nombre;
    const L = [`*Contenidos ${MES.titulo} · ${marcaTxt}*`];

    if (pendientes.length) {
      L.push("", `📋 *${pendientes.length} piezas para tu aprobación*`, `_Responde con el número + "ok", o el ajuste que quieras:_`);
      pendientes.forEach((p, i) => {
        const f = fmtFecha(fechaDe(p));
        const concepto = (copyDe(p).split(". ")[0] + ".").slice(0, 150);
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
    L.push("", `👀 Para verlo visual (portadas, feed y calendario): ${location.origin === "null" || location.protocol === "file:" ? "abre Contenido Hub" : location.href.split("#")[0].split("?")[0]}`);
    window.open("https://wa.me/?text=" + encodeURIComponent(L.join("\n")), "_blank", "noopener");
  };
}

// ---------- Vista: Referentes ----------
function refRail(items, tipo) {
  const cards = tipo === "cuenta"
    ? items.map(r => `
        <a class="ref-slide" href="${r.url}" target="_blank" rel="noopener">
          <img src="${r.img}" alt="${esc(r.handle)}" loading="lazy">
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
      <button type="submit" class="btn-primary">Buscar en Pinterest</button>
    </form>
    <div class="masonry">
      ${R.mosaico.map(m => `
        <a class="mas-item" href="https://www.pinterest.com/search/pins/?q=${encodeURIComponent(m.q)}" target="_blank" rel="noopener">
          <img src="${m.img}" alt="${esc(m.q)}" loading="lazy">
          <span class="mas-label">📌 ${esc(m.q)}</span>
        </a>`).join("")}
    </div>`;

  // rieles con flechas
  el.querySelectorAll(".rail-wrap").forEach(w => {
    const rail = w.querySelector(".ref-rail");
    w.querySelector(".prev").onclick = () => rail.scrollBy({ left: -320, behavior: "smooth" });
    w.querySelector(".next").onclick = () => rail.scrollBy({ left: 320, behavior: "smooth" });
  });
  // buscador de Pinterest
  el.querySelector("#pinForm").onsubmit = e => {
    e.preventDefault();
    const q = el.querySelector("#pinQuery").value.trim();
    if (q) window.open("https://www.pinterest.com/search/pins/?q=" + encodeURIComponent(q), "_blank", "noopener");
  };
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
    save();
    renderAll({ keep: true });
    if (piezaAbierta && piezaAbierta.id === portadaTarget) openDrawer(portadaTarget);
  } catch (e) {
    alert("No se pudo procesar la imagen. Intenta con otra foto.");
  }
};
function comprimirImagen(file, maxH = 720) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxH / img.height);
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL("image/jpeg", 0.78));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
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
      ${a.v === "Aprobado" ? `<span class="chip aprobado">✓ Aprobado por mercadeo</span>` : ""}
      ${a.v === "Ajustar" ? `<span class="chip ajustar">Mercadeo pide ajustes</span>` : ""}
    </div>

    <section>
      <h4>Portada para el feed</h4>
      <div class="portada-box">
        <div class="portada-prev">${img ? `<img src="${img}" alt="Portada">` : `${FORMATO_ICONO[p.formato] || "🎬"}`}</div>
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
        ${FECHAS_MES.map(f => {
          const d = fmtFecha(f);
          return `<option value="${f}" ${f === fechaDe(p) ? "selected" : ""}>${d.dia} ${d.num} de septiembre</option>`;
        }).join("")}
      </select>
    </section>

    <section>
      <h4>Aprobación de mercadeo</h4>
      <div class="aprob-pills">
        ${APROB.map(v => `<button data-aprob="${v}" class="${a.v === v ? "sel" : ""}" data-v="${v}">${v === "Aprobado" ? "✓ " : ""}${v}</button>`).join("")}
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

  drawer.classList.add("open");
  backdrop.classList.add("open");

  drawer.querySelector("#drawerClose").onclick = closeDrawer;
  drawer.querySelector("#btnPortada").onclick = () => pedirPortada(p.id);

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
    renderAll();
  }
  inTit.onchange = guardarEdicion;
  inCopy.onchange = guardarEdicion;
  const btnRest = drawer.querySelector("#btnRestaurar");
  if (btnRest) btnRest.onclick = () => { delete store.ediciones[p.id]; save(); renderAll(); openDrawer(p.id); };

  // Cambio de fecha (alternativa táctil al arrastre)
  drawer.querySelector("#selFecha").onchange = e => { moverPieza(p.id, e.target.value); openDrawer(p.id); };
  const quitar = drawer.querySelector("#btnQuitarPortada");
  if (quitar) quitar.onclick = () => { delete store.portadas[p.id]; save(); renderAll({ keep: true }); openDrawer(p.id); };
  drawer.querySelectorAll("[data-estado]").forEach(b => {
    b.onclick = () => {
      store.estados[p.id] = b.dataset.estado;
      save();
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
function closeDrawer() {
  drawer.classList.remove("open");
  backdrop.classList.remove("open");
  piezaAbierta = null;
}
backdrop.addEventListener("click", closeDrawer);
document.addEventListener("keydown", e => { if (e.key === "Escape") closeDrawer(); });

// clic en tarjetas y casillas del feed
document.getElementById("main").addEventListener("click", e => {
  const card = e.target.closest(".piece, .cell");
  if (card) openDrawer(card.dataset.id);
});

// ---------- Navegación ----------
let vistaActiva = "calendario";
function activarVista(v) {
  vistaActiva = v;
  document.querySelectorAll("#tabs button").forEach(x => x.classList.toggle("active", x.dataset.view === v));
  document.querySelectorAll(".view").forEach(x => x.classList.remove("active"));
  const el = document.getElementById("view-" + v);
  if (el) el.classList.add("active");
  saveUI();
}
document.getElementById("brandSwitch").addEventListener("click", e => {
  const b = e.target.closest("button");
  if (!b) return;
  marcaActiva = b.dataset.brand;
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
    store = { estados: {}, checks: {}, aprob: {}, portadas: {}, fechas: {}, ediciones: {} };
    save();
    renderAll({ keep: true });
  }
};

// ---------- Init ----------
function renderAll() {
  renderHero();
  renderCalendario();
  renderPipeline();
  renderRodaje();
  renderFeed();
  renderAprobacion();
  renderReferentes();
}
document.body.dataset.marca = marcaActiva;
restoreUI();
renderAll();
