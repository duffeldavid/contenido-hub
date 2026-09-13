#!/usr/bin/env python3
"""Genera lab-artifact.html: la versión de Contenido Lab para claude.ai
(artifact privado, con base de datos para sincronizar Mac e iPhone y
Claude dentro de la página para analizar hooks).

Ejecutar tras cambiar index.html, lab.css, datos.js o lab.js:
    python3 build_artifact.py

Los datos NO se incrustan: viven en la base de datos del artifact
(y en el navegador cuando se abre en local).
"""
import re, time
from pathlib import Path

ROOT = Path(__file__).parent
html = (ROOT / "index.html").read_text()
fuentes = "\n".join(re.findall(r'<link[^>]*fonts\.(?:googleapis|gstatic)\.com[^>]*>', html))
body = re.search(r"<body[^>]*>\s*([\s\S]*?)\s*<script src=", html).group(1)
css = (ROOT / "lab.css").read_text()
datos = (ROOT / "datos.js").read_text()
js = (ROOT / "lab.js").read_text()

def url(nombre, defecto):
    p = ROOT / nombre
    return p.read_text().strip() if p.exists() else defecto

HUB_URL = url("hub.url", "https://duffeldavid.github.io/contenido-hub/")
ESTUDIO_URL = url("estudio.url", "https://duffeldavid.github.io/contenido-hub/estudio.html")

out = f"""<title>Contenido Lab</title>
{fuentes}
<style>
{css}
</style>

{body}

<script>
window.ENLACE_HUB = {HUB_URL!r};
window.ENLACE_ESTUDIO = {ESTUDIO_URL!r};
{datos}
{js}
</script>
"""
out = out.replace('href="../index.html"', f'href="{HUB_URL}" target="_blank" rel="noopener"', 1)
(ROOT / "lab-artifact.html").write_text(out)
print(f"lab-artifact.html generado ({len(out):,} bytes)")

# Sello de versión para que el celular no use caché vieja
v = str(int(time.time()))
h2 = re.sub(r'((?:lab\.css|datos\.js|lab\.js))(?:\?v=\d+)?"', rf'\1?v={v}"', html)
if h2 != html:
    (ROOT / "index.html").write_text(h2)
    print(f"index.html sellado con v={v}")
