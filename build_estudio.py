#!/usr/bin/env python3
"""Genera estudio-artifact.html (la versión del Estudio para claude.ai, artifact
privado aparte del Contenido Hub). Ejecutar tras cambiar estudio.html,
estudio.css, estudio.js, finanzas.css o finanzas.js:  python3 build_estudio.py

La semilla privada (finanzas.semilla.js) NO se incrusta: los datos viven en el
navegador de cada dispositivo (Respaldar / Restaurar para moverlos).
"""
import re, time
from pathlib import Path

ROOT = Path(__file__).parent
html = (ROOT / "estudio.html").read_text()
fuentes = "\n".join(re.findall(r'<link[^>]*fonts\.(?:googleapis|gstatic)\.com[^>]*>', html))
body = re.search(r"<body[^>]*>\s*([\s\S]*?)\s*<script>", html).group(1)
css = (ROOT / "finanzas.css").read_text() + "\n" + (ROOT / "estudio.css").read_text()
js = (ROOT / "finanzas.js").read_text() + "\n" + (ROOT / "estudio.js").read_text()
HUB_URL = (ROOT / "hub.url").read_text().strip() if (ROOT / "hub.url").exists() else "https://duffeldavid.github.io/contenido-hub/"

out = f"""<title>Estudio</title>
{fuentes}
<style>
{css}
</style>

{body}

<script>
window.ENLACE_HUB = {HUB_URL!r};
{js}
</script>
"""
(ROOT / "estudio-artifact.html").write_text(out)
print(f"estudio-artifact.html generado ({len(out):,} bytes)")

# Sello de versión para GitHub Pages
v = str(int(time.time()))
h2 = re.sub(r'((?:finanzas\.css|estudio\.css|finanzas\.js|estudio\.js))(?:\?v=\d+)?"', rf'\1?v={v}"', html)
if h2 != html:
    (ROOT / "estudio.html").write_text(h2)
    print(f"estudio.html sellado con v={v}")
