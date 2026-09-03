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
  if (!candidatos.length) return { estados: {}, checks: {}, aprob: {}, portadas: {} };
  candidatos.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  const s = candidatos[0];
  return {
    estados: s.estados || {}, checks: s.checks || {},
    aprob: s.aprob || {}, portadas: s.portadas || {},
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
function brandTint(p) { return p.marca === "forestal" ? "var(--forestal-tint)" : "var(--manzanares-tint)"; }
const FORMATO_ICONO = { "Reel": "🎬", "Foto": "📷", "Carrusel": "🖼️", "Pieza gráfica": "✏️", "Historia": "⚡" };

function pieceCard(p, { compact = false } = {}) {
  const est = estadoDe(p);
  const ap = aprobDe(p).v;
  const done = est === "Publicado";
  return `
    <article class="piece ${done ? "done" : ""}" style="--brand-color:${brandColor(p)};--brand-tint:${brandTint(p)}" data-id="${p.id}">
      <div class="piece-top">
        <span class="chip brand">${MARCAS[p.marca].nombre}</span>
        <span class="chip estado ${ESTADO_CLASS[est]}">${est}</span>
        ${ap === "Aprobado" ? `<span class="chip aprobado">✓ Aprobado</span>` : ""}
        ${ap === "Ajustar" ? `<span class="chip ajustar">Ajustar</span>` : ""}
        ${p.reencauche ? `<span class="chip reencauche">Reencauche</span>` : ""}
      </div>
      <div class="piece-title">${esc(p.titulo)}</div>
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

// Fotografía real por marca (assets locales; en el Artifact van embebidas)
const HERO_FOTOS = {
  forestal: "assets/hero-cafe.jpg",
  manzanares: "assets/hero-carne.jpg",
};
function heroArt(marca) {
  if (marca === "forestal" || marca === "manzanares") {
    return `<img class="hero-photo" src="${HERO_FOTOS[marca]}" alt=""><div class="hero-veil"></div>`;
  }
  return `
    <div class="hero-diptych">
      <img class="hero-photo" src="${HERO_FOTOS.forestal}" alt="">
      <img class="hero-photo" src="${HERO_FOTOS.manzanares}" alt="">
    </div>
    <div class="hero-veil"></div>`;
}

function renderHero() {
  const t = HERO_TEXT[marcaActiva];
  document.getElementById("heroArt").innerHTML = heroArt(marcaActiva);
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

  let html = `<p class="view-note">Cada fecha de publicación con sus piezas. Toca una pieza para ver el copy completo, el checklist, el equipo, la portada y las referencias.</p>`;
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
    const piezas = PIEZAS.filter(p => p.marca === mk).sort((a, b) => b.fecha.localeCompare(a.fecha));
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
            const d = p.fecha.slice(8);
            return `
              <button class="cell ${img ? "has-img" : ""}" data-id="${p.id}" title="${esc(p.titulo)}">
                ${img
                  ? `<img src="${img}" alt="${esc(p.titulo)}">`
                  : `<span class="cell-ph"><span class="cell-fmt">${FORMATO_ICONO[p.formato] || "🎬"}</span><span class="cell-tit">${esc(p.titulo)}</span></span>`}
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
      <span class="aprob-saved" id="aprobSaved">${aprobadas}/${piezas.length} aprobadas</span>
    </div>`;
  for (const p of piezas) {
    const { dia, num } = fmtFecha(p.fecha);
    const a = aprobDe(p);
    html += `
      <div class="aprob-row" data-id="${p.id}">
        <div class="aprob-info">
          <div class="fecha">${dia} ${num} sep · ${MARCAS[p.marca].nombre} · ${p.formato}</div>
          <h4>${esc(p.titulo)}</h4>
          <div class="copy">${esc(p.copy)}</div>
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
}

// ---------- Vista: Referentes ----------
function renderReferentes() {
  const el = document.getElementById("view-referentes");
  const R = REFERENTES;
  el.innerHTML = `
    <p class="view-note">Cómo lo hacen las grandes cuentas — investigación real, contenido filmado (no IA). El norte: <a href="${R.norte.url}" target="_blank" rel="noopener" style="color:var(--accent);font-weight:600">${R.norte.handle}</a>.</p>

    <div class="norte">
      <h3>El norte: ${R.norte.handle}</h3>
      <p class="desc">${esc(R.norte.resumen)}</p>
      ${R.norte.lecciones.map(l => `<div class="leccion">→ ${esc(l)}</div>`).join("")}
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
  const { dia, num } = fmtFecha(p.fecha);
  const est = estadoDe(p);
  const checks = checksDe(p);
  const a = aprobDe(p);
  const img = portadaDe(p);

  drawer.innerHTML = `
    <button class="close-btn" id="drawerClose" aria-label="Cerrar">✕</button>
    <span class="chip brand" style="--brand-color:${m.color};--brand-tint:${brandTint(p)}">${m.nombre} · ${m.handle}</span>
    <h2>${esc(p.titulo)}</h2>
    <div class="sub">${dia} ${num} de septiembre · ${p.formato}${p.reencauche ? " · Reencauche" : ""}</div>
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
      <h4>Idea / Copy</h4>
      <div class="copy-text">${esc(p.copy)}</div>
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
    marca: MARCAS[p.marca].nombre, fecha: p.fecha, pieza: p.titulo,
    estado: estadoDe(p), aprobacion: aprobDe(p),
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
  if (confirm("¿Reiniciar estados, checklists, aprobaciones y portadas al valor original del calendario?")) {
    store = { estados: {}, checks: {}, aprob: {}, portadas: {} };
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
