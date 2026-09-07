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


COLA = os.environ.get("HUB_COLA", os.path.join(REPO, "cola.json"))


def ts_de(ruta):
    try:
        with open(ruta) as f:
            return json.load(f).get("ts", 0)
    except Exception:
        return 0


def main():
    # Dos tipos de adjunto: estado-hub (Guardar desde el enlace público) y
    # cola-hub (Guardar desde claude.ai, reenviado por el puente).
    destinos = {
        "estado-hub": (ESTADO, "estado.json", ts_archivado()),
        "cola-hub": (COLA, "cola.json", ts_de(COLA)),
    }
    try:
        with urllib.request.urlopen(CANAL, timeout=30) as r:
            lineas = r.read().decode("utf-8", "replace").splitlines()
    except Exception:
        return

    candidatos = {"estado-hub": [], "cola-hub": []}
    for linea in lineas:
        try:
            m = json.loads(linea)
        except Exception:
            continue
        adj = m.get("attachment") or {}
        nombre = str(adj.get("name", ""))
        for prefijo in candidatos:
            if nombre.startswith(prefijo) and int(m.get("time", 0)) * 1000 > destinos[prefijo][2]:
                candidatos[prefijo].append((int(m.get("time", 0)), adj.get("url", "")))

    nuevos = {}
    for prefijo, lista in candidatos.items():
        actual = destinos[prefijo][2]
        for _, url in sorted(lista, reverse=True):
            try:
                with urllib.request.urlopen(url, timeout=60) as r:
                    dato = json.load(r)
            except Exception:
                continue  # adjunto vencido o ilegible: probar el anterior
            if dato.get("ts", 0) > actual:
                nuevos[prefijo] = dato
                break

    if not nuevos:
        print("sin novedades")
        return
    if not SIN_GIT and git("pull", "--ff-only", "origin", "main").returncode != 0:
        print("repo divergido: se reintenta el próximo ciclo")
        return
    escritos = []
    for prefijo, dato in nuevos.items():
        ruta, nombre_git, _ = destinos[prefijo]
        if dato.get("ts", 0) <= ts_de(ruta):
            continue
        with open(ruta, "w") as f:
            json.dump(dato, f, separators=(",", ":"))
        escritos.append(nombre_git)
        print(f"archivado {nombre_git} ts", dato.get("ts"))
    if SIN_GIT or not escritos:
        return
    git("add", *escritos)
    r = git("commit", "-m", "Archivar estado guardado desde la plataforma\n\n"
            "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>")
    if r.returncode == 0:
        print(git("push", "origin", "main").stderr.strip() or "push main ok")
        print(git("push", "origin", "main:gh-pages").stderr.strip() or "push gh-pages ok")


if __name__ == "__main__":
    main()
