#!/usr/bin/env python3
"""Archivador del estado de Contenido Hub.

Corre en el Mac de David cada 10 minutos (launchd:
~/Library/LaunchAgents/com.contenidohub.archivar.plist). Busca en el canal
ntfy de datos el último adjunto "estado-hub.json" que la plataforma envía al
tocar Guardar cambios, y si es más nuevo que el estado.json del repo, lo
commitea y empuja a main + gh-pages. Así lo guardado desde cualquier
dispositivo queda permanente sin que David configure nada.

Los adjuntos anónimos de ntfy viven ~3 horas y los mensajes ~12; si el Mac
estuvo apagado más tiempo, la plataforma re-emite el estado al abrirse
(autocuración en cargarPublicado de app.js) y este script lo recoge entonces.
"""
import json
import os
import subprocess
import urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CANAL = os.environ.get("HUB_CANAL", "https://ntfy.sh/contenido-hub-datos-x8k3n2vq/json?poll=1&since=13h")
ESTADO = os.environ.get("HUB_ESTADO", os.path.join(REPO, "estado.json"))
SIN_GIT = bool(os.environ.get("HUB_SIN_GIT"))  # pruebas: no tocar el repo


def ts_archivado():
    try:
        with open(ESTADO) as f:
            return json.load(f).get("ts", 0)
    except Exception:
        return 0


def git(*args):
    return subprocess.run(["git", "-C", REPO, *args], capture_output=True, text=True)


def main():
    actual = ts_archivado()
    try:
        with urllib.request.urlopen(CANAL, timeout=30) as r:
            lineas = r.read().decode("utf-8", "replace").splitlines()
    except Exception:
        return

    # El mensaje más reciente con adjunto estado-hub que supere lo archivado
    candidatos = []
    for linea in lineas:
        try:
            m = json.loads(linea)
        except Exception:
            continue
        adj = m.get("attachment") or {}
        if not str(adj.get("name", "")).startswith("estado-hub"):
            continue
        if int(m.get("time", 0)) * 1000 <= actual:
            continue
        candidatos.append((int(m.get("time", 0)), adj.get("url", "")))

    mejor = None
    for _, url in sorted(candidatos, reverse=True):
        try:
            with urllib.request.urlopen(url, timeout=60) as r:
                est = json.load(r)
        except Exception:
            continue  # adjunto vencido o ilegible: probar el anterior
        if est.get("ts", 0) > actual:
            mejor = est
            break

    if not mejor:
        print("sin novedades")
        return
    if not SIN_GIT and git("pull", "--ff-only", "origin", "main").returncode != 0:
        print("repo divergido: se reintenta el próximo ciclo")
        return
    if mejor.get("ts", 0) <= ts_archivado():
        return
    with open(ESTADO, "w") as f:
        json.dump(mejor, f, separators=(",", ":"))
    print("archivado estado ts", mejor.get("ts"))
    if SIN_GIT:
        return
    git("add", "estado.json")
    r = git("commit", "-m", "Archivar estado guardado desde la plataforma\n\n"
            "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>")
    if r.returncode == 0:
        print(git("push", "origin", "main").stderr.strip() or "push main ok")
        print(git("push", "origin", "main:gh-pages").stderr.strip() or "push gh-pages ok")


if __name__ == "__main__":
    main()
