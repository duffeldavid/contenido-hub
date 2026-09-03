#!/usr/bin/env python3
"""Genera artifact.html (la versión para claude.ai) a partir de los
archivos fuente. Ejecutar tras cualquier cambio en data.js, referentes.js,
app.js o styles.css:  python3 build_artifact.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).parent
index = (ROOT / "index.html").read_text()
styles = (ROOT / "styles.css").read_text()
data = (ROOT / "data.js").read_text()
referentes = (ROOT / "referentes.js").read_text()
app = (ROOT / "app.js").read_text()

body = re.search(r"<body[^>]*>\s*([\s\S]*?)\s*<script src=", index).group(1)

# Enlaces de fuentes tomados de index.html (una sola fuente de verdad)
fuentes = "\n".join(re.findall(r'<link[^>]*fonts\.(?:googleapis|gstatic)\.com[^>]*>', index))

# Capa de sincronización: guarda el avance dentro de la propia página
# (artifact.publish). Solo corre en claude.ai; en local no hace nada.
SYNC = r"""
// ---------- Sincronización Artifact (claude.ai) ----------
// Publica el avance dentro de la propia página tras unos segundos de
// inactividad (la vista se recarga sola; la interfaz se restaura con
// sessionStorage). hubFlush fuerza la publicación inmediata.
(function () {
  if (!window.claude || typeof window.claude.use !== "function") return;
  const badge = document.getElementById("syncBadge");
  let ns = null, dirty = false, timer = null, readOnly = false, publicando = false;
  claude.use("artifact").then(a => { ns = a; if (dirty) schedule(); }).catch(() => {});
  window.hubSync = function () { dirty = true; setBadge("Cambios sin sincronizar"); schedule(); };
  window.hubFlush = function () { clearTimeout(timer); publicar(); };
  window.addEventListener("pagehide", () => { if (dirty) publicar(); });
  function schedule() { clearTimeout(timer); timer = setTimeout(publicar, 8000); }
  function setBadge(txt) {
    if (!badge) return;
    badge.hidden = !txt;
    badge.textContent = txt || "";
  }
  async function publicar() {
    if (!ns || readOnly || !dirty || publicando) return;
    publicando = true; dirty = false;
    setBadge("Sincronizando…");
    const json = JSON.stringify(store).replace(/</g, "\\u003c");
    const bloque = '<script id="hub-state" type="application/json">' + json + '<\/script>';
    const html = window.__PRISTINE.replace(/<script id="hub-state"[\s\S]*?<\/script\s*>/, bloque);
    try { await ns.publish(html); setBadge("Sincronizado ✓"); }
    catch (e) {
      const code = e && e.code;
      if (code === "not_granted" || code === "not_writer") {
        readOnly = true; // vista de solo lectura: el avance queda solo en este navegador
        setBadge("Vista de solo lectura");
      } else {
        setBadge("");
      }
      // "conflict": otra vista publicó primero; la página se recarga sola a esa versión.
    }
    publicando = false;
  }
})();
"""

artifact = f"""<title>Contenido Hub</title>
{fuentes}
<style>
{styles}
</style>

{body}

<script id="hub-state" type="application/json">{{"estados":{{}},"checks":{{}},"updatedAt":0}}</script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script id="img-map">window.__IMG = {{img_map}};</script>
<script>
window.__PRISTINE = "<!doctype html>\\n" + document.documentElement.outerHTML;
{data}
{referentes}
{app}
{SYNC}
</script>
"""

# Fotos embebidas UNA sola vez en un mapa (window.__IMG): las rutas del
# código se resuelven en tiempo de ejecución vía IMG(ruta). El visor de
# claude.ai bloquea imágenes externas y no sirve archivos locales aparte.
import base64, json
mapa = {}
for ruta in sorted((ROOT / "assets").rglob("*.jpg")):
    rel = ruta.relative_to(ROOT).as_posix()
    mapa[rel] = "data:image/jpeg;base64," + base64.b64encode(ruta.read_bytes()).decode()
artifact = artifact.replace("{img_map}", json.dumps(mapa), 1)

(ROOT / "artifact.html").write_text(artifact)
print(f"artifact.html generado ({len(artifact):,} bytes)")
