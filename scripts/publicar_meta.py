#!/usr/bin/env python3
"""Trabajador de publicación en Meta para Contenido Hub.

Corre en el Mac cada 5 minutos (launchd: com.contenidohub.meta.plist) desde el
clon de ~/Library/Application Support/ContenidoHub/repo. Lee la cola que David
arma en la plataforma (estado.json → "meta": piezas con "Programar
automáticamente") y:

  · FACEBOOK: la deja PROGRAMADA en Meta de una vez (scheduled_publish_time) —
    aunque el Mac se apague después, Meta la publica solo.
  · INSTAGRAM: la API no permite programar, así que este script publica la
    pieza EN LA HORA EXACTA (contenedor → media_publish). Si el Mac estaba
    dormido a esa hora, sale al despertar.

Las portadas viajan en estado.json como data URI; para Meta se necesita una
URL pública, así que se suben como portadas/<id>.jpg al repo (que ya es
público — no expone nada nuevo) y se usa la URL de GitHub Pages.

Tokens SOLO en ~/Library/Application Support/ContenidoHub/meta.json (600).
Registro de lo hecho en meta_publicados.json para nunca duplicar.

Uso manual:  python3 publicar_meta.py            (un ciclo normal)
             python3 publicar_meta.py --verificar (prueba tokens, no publica)
"""
import base64
import hashlib
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from zoneinfo import ZoneInfo

GRAPH = "https://graph.facebook.com/v25.0"
TZ = ZoneInfo("America/Bogota")
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP_DIR = os.path.expanduser("~/Library/Application Support/ContenidoHub")
CONFIG = os.path.join(APP_DIR, "meta.json")
LEDGER = os.path.join(APP_DIR, "meta_publicados.json")
PAGES_BASE = "https://duffeldavid.github.io/contenido-hub"
NTFY_DATOS = "https://ntfy.sh/contenido-hub-datos-x8k3n2vq"
NTFY_AVISOS = "https://ntfy.sh/contenido-hub-david-x8k3n2vq"
MAX_REINTENTOS = 5


def log(*a):
    print(datetime.now(TZ).strftime("%H:%M"), *a, flush=True)


def cargar(ruta, defecto):
    try:
        with open(ruta) as f:
            return json.load(f)
    except Exception:
        return defecto


def guardar_ledger(ledger):
    with open(LEDGER, "w") as f:
        json.dump(ledger, f, indent=1)


def git(*args):
    return subprocess.run(["git", "-C", REPO, *args], capture_output=True, text=True)


def api(metodo, path, token, **params):
    params["access_token"] = token
    datos = urllib.parse.urlencode(params).encode()
    url = f"{GRAPH}/{path}"
    if metodo == "GET":
        url += "?" + datos.decode()
        req = urllib.request.Request(url)
    else:
        req = urllib.request.Request(url, data=datos, method=metodo)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.load(r), None
    except urllib.error.HTTPError as e:
        cuerpo = e.read().decode("utf-8", "replace")
        try:
            msg = json.loads(cuerpo).get("error", {}).get("message", cuerpo)
        except Exception:
            msg = cuerpo[:300]
        return None, msg
    except Exception as e:
        return None, str(e)


def avisar(titulo, cuerpo, tags="robot"):
    try:
        req = urllib.request.Request(
            NTFY_AVISOS, data=cuerpo.encode(),
            headers={"Title": titulo.encode("ascii", "ignore").decode() or "Contenido Hub", "Tags": tags})
        urllib.request.urlopen(req, timeout=15)
    except Exception:
        pass


def emitir_estado(pieza_id, valor):
    """La plataforma abierta de David se entera en vivo."""
    try:
        cuerpo = json.dumps({"tipo": "estado", "id": pieza_id, "v": valor,
                             "autor": "Meta", "ts": int(time.time() * 1000)})
        urllib.request.urlopen(
            urllib.request.Request(NTFY_DATOS, data=cuerpo.encode()), timeout=15)
    except Exception:
        pass


def asegurar_portada_publica(pieza_id, data_uri):
    """Escribe portadas/<id>.jpg en el repo y devuelve su URL pública."""
    if not data_uri or "," not in data_uri:
        return None
    datos = base64.b64decode(data_uri.split(",", 1)[1])
    carpeta = os.path.join(REPO, "portadas")
    os.makedirs(carpeta, exist_ok=True)
    ruta = os.path.join(carpeta, f"{pieza_id}.jpg")
    firma = hashlib.sha1(datos).hexdigest()
    ya = os.path.exists(ruta) and hashlib.sha1(open(ruta, "rb").read()).hexdigest() == firma
    if not ya:
        with open(ruta, "wb") as f:
            f.write(datos)
        git("add", ruta)
        r = git("commit", "-m", f"Portada pública para publicación automática ({pieza_id})\n\n"
                "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>")
        if r.returncode == 0:
            git("push", "origin", "main")
            git("push", "origin", "main:gh-pages")
    url = f"{PAGES_BASE}/portadas/{pieza_id}.jpg"
    # Esperar a que GitHub Pages la sirva (despliegue ~1 min)
    for _ in range(10):
        try:
            req = urllib.request.Request(url + f"?v={firma[:8]}", method="HEAD")
            with urllib.request.urlopen(req, timeout=20) as r:
                if r.status == 200:
                    return url + f"?v={firma[:8]}"
        except Exception:
            pass
        time.sleep(15)
    return None  # aún no está: se reintenta el próximo ciclo


def publicar_facebook(pagina, entrada, url_portada, t_pub, ahora):
    """Programa (o publica) en la página de Facebook. Devuelve (post_id, modo, error)."""
    token = pagina["page_token"]
    copy = entrada.get("copy") or entrada.get("titulo") or ""
    falta = t_pub - ahora
    programable = falta >= 660  # Meta exige mínimo ~10 min de anticipación
    if url_portada:
        params = {"url": url_portada, "message": copy}
        endpoint = f"{pagina['page_id']}/photos"
    else:
        params = {"message": copy}
        endpoint = f"{pagina['page_id']}/feed"
    if programable:
        params["published"] = "false"
        params["scheduled_publish_time"] = str(t_pub)
    r, err = api("POST", endpoint, token, **params)
    if err:
        return None, None, err
    return r.get("post_id") or r.get("id"), ("programada" if programable else "publicada"), None


def publicar_instagram(pagina, entrada, url_portada):
    """Publica YA en Instagram (contenedor → publish). Devuelve (media_id, error)."""
    ig = pagina.get("ig_id")
    if not ig:
        return None, "la página no tiene Instagram vinculado"
    if not url_portada:
        return None, "sin portada pública (Instagram exige imagen)"
    token = pagina["page_token"]
    copy = entrada.get("copy") or entrada.get("titulo") or ""
    cont, err = api("POST", f"{ig}/media", token, image_url=url_portada, caption=copy)
    if err:
        return None, err
    creation_id = cont["id"]
    for _ in range(12):  # esperar a que Meta procese la imagen
        st, err = api("GET", str(creation_id), token, fields="status_code")
        if err:
            return None, err
        if st.get("status_code") == "FINISHED":
            break
        if st.get("status_code") == "ERROR":
            return None, "Meta no pudo procesar la imagen"
        time.sleep(5)
    pub, err = api("POST", f"{ig}/media_publish", token, creation_id=creation_id)
    if err:
        return None, err
    return pub.get("id"), None


def verificar(config):
    print("Verificando conexión con Meta (no se publica nada):")
    ok = True
    for apodo, pg in config.get("pages", {}).items():
        r, err = api("GET", pg["page_id"], pg["page_token"], fields="name")
        estado = f"✓ página «{r['name']}»" if not err else f"❌ {err}"
        ig = "—"
        if pg.get("ig_id"):
            ri, erri = api("GET", pg["ig_id"], pg["page_token"], fields="username")
            ig = f"@{ri['username']}" if not erri else f"❌ {erri}"
            ok = ok and not erri
        ok = ok and not err
        print(f"  {apodo}: {estado} · Instagram: {ig}")
    print("✅ Todo listo para publicar." if ok else "⚠️ Corrige lo marcado y vuelve a correr conectar_meta.py.")


def main():
    config = cargar(CONFIG, None)
    if not config:
        log("sin configurar: corre conectar_meta.py primero")
        return
    if "--verificar" in sys.argv:
        verificar(config)
        return

    git("pull", "--ff-only", "origin", "main")
    estado = cargar(os.path.join(REPO, "estado.json"), {})
    cola = estado.get("meta") or {}
    if not cola:
        log("cola vacía")
        return
    portadas = estado.get("portadas") or {}
    ledger = cargar(LEDGER, {})
    ahora = int(time.time())

    for pieza_id, entrada in cola.items():
        if not entrada.get("auto"):
            continue
        marca = entrada.get("marca")
        pagina = (config.get("pages") or {}).get(marca)
        if not pagina:
            continue
        try:
            dt = datetime.strptime(f"{entrada['fecha']} {entrada.get('hora', '18:00')}", "%Y-%m-%d %H:%M")
            t_pub = int(dt.replace(tzinfo=TZ).timestamp())
        except Exception:
            continue
        firma = f"{entrada['fecha']}|{entrada.get('hora')}|{entrada.get('red')}"
        reg = ledger.setdefault(pieza_id, {})
        titulo = entrada.get("titulo", pieza_id)

        # Si David cambió fecha/hora/red después de agendar FB: retirar lo viejo
        if reg.get("firma") and reg["firma"] != firma:
            if reg.get("fb_modo") == "programada" and reg.get("fb_id"):
                api("DELETE", str(reg["fb_id"]), pagina["page_token"])
                log(f"{pieza_id}: reprogramada — FB anterior retirada")
            for k in ("fb_id", "fb_modo", "ig_id", "errores"):
                reg.pop(k, None)
        reg["firma"] = firma

        if reg.get("errores", 0) >= MAX_REINTENTOS:
            continue
        redes = {"ig": ["ig"], "fb": ["fb"], "ambas": ["fb", "ig"]}.get(entrada.get("red", "ambas"), ["fb", "ig"])

        url_portada = None
        if portadas.get(pieza_id):
            url_portada = asegurar_portada_publica(pieza_id, portadas[pieza_id])
            if url_portada is None and "ig" in redes and ahora >= t_pub:
                log(f"{pieza_id}: portada pública aún no disponible; reintento próximo ciclo")
                continue

        error = None
        # FACEBOOK: se agenda en cuanto se puede (Meta publica sola)
        if "fb" in redes and not reg.get("fb_id"):
            if ahora >= t_pub - 660 or t_pub - ahora >= 660:
                fb_id, modo, error = publicar_facebook(pagina, entrada, url_portada, t_pub, ahora)
                if fb_id:
                    reg["fb_id"], reg["fb_modo"] = fb_id, modo
                    log(f"{pieza_id}: Facebook {modo}")
                    if modo == "programada":
                        avisar("🤖 Facebook programada",
                               f"«{titulo}» quedó agendada en Meta para el {entrada['fecha']} {entrada.get('hora')}")

        # INSTAGRAM: solo cuando llega la hora
        if not error and "ig" in redes and not reg.get("ig_id") and ahora >= t_pub:
            ig_id, error = publicar_instagram(pagina, entrada, url_portada)
            if ig_id:
                reg["ig_id"] = ig_id
                tarde = ahora - t_pub > 900
                log(f"{pieza_id}: Instagram publicada{' (atrasada)' if tarde else ''}")
                avisar("🤖 Publicada en Instagram",
                       f"«{titulo}» ya está en @{pagina.get('ig_username', marca)}"
                       + (" (salió atrasada: el Mac estaba dormido)" if tarde else ""), "tada")

        if error:
            reg["errores"] = reg.get("errores", 0) + 1
            log(f"{pieza_id}: ERROR {error}")
            if reg["errores"] in (1, MAX_REINTENTOS):
                avisar("⚠️ Publicación automática con problemas",
                       f"«{titulo}»: {error}"
                       + (" — no se reintentará más; revísala en la plataforma." if reg["errores"] >= MAX_REINTENTOS else ""),
                       "warning")

        # ¿Todo lo pedido quedó hecho? → la plataforma pasa la pieza a Publicado
        fb_ok = "fb" not in redes or bool(reg.get("fb_id"))
        ig_ok = "ig" not in redes or bool(reg.get("ig_id"))
        publicado_ya = ig_ok and ("fb" not in redes or reg.get("fb_modo") == "publicada" or (fb_ok and ahora >= t_pub))
        if publicado_ya and ig_ok and fb_ok and not reg.get("avisado"):
            reg["avisado"] = True
            emitir_estado(pieza_id, "Publicado")

    guardar_ledger(ledger)


if __name__ == "__main__":
    main()
