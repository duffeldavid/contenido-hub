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
# Carpeta de videos de historias (con acceso directo "Videos Contenido Hub" en
# el escritorio). Los videos NO viajan por la plataforma (pesan demasiado):
# David deja el archivo aquí y en la hoja de la historia elige su nombre.
VIDEOS_DIR = os.path.join(APP_DIR, "videos")
GH = os.path.expanduser("~/.local/bin/gh")
GH_REPO = "duffeldavid/contenido-hub"
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


def avisar(titulo, cuerpo, tags="robot", click=None):
    try:
        headers = {"Title": titulo.encode("ascii", "ignore").decode() or "Contenido Hub", "Tags": tags}
        if click:
            headers["Click"] = click  # tocar la notificación abre esta URL/app
        req = urllib.request.Request(NTFY_AVISOS, data=cuerpo.encode(), headers=headers)
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


def asegurar_img_publica(rel, data_uri, motivo):
    """Escribe la imagen en el repo (ruta relativa) y devuelve su URL pública."""
    if not data_uri or "," not in data_uri:
        return None
    datos = base64.b64decode(data_uri.split(",", 1)[1])
    ruta = os.path.join(REPO, rel)
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    firma = hashlib.sha1(datos).hexdigest()
    ya = os.path.exists(ruta) and hashlib.sha1(open(ruta, "rb").read()).hexdigest() == firma
    if not ya:
        with open(ruta, "wb") as f:
            f.write(datos)
        git("add", ruta)
        r = git("commit", "-m", f"Imagen pública para publicación automática ({motivo})\n\n"
                "Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>")
        if r.returncode == 0:
            git("push", "origin", "main")
            git("push", "origin", "main:gh-pages")
    url = f"{PAGES_BASE}/{rel}?v={firma[:8]}"
    # Esperar a que GitHub Pages la sirva (despliegue ~1 min)
    for _ in range(10):
        try:
            req = urllib.request.Request(url, method="HEAD")
            with urllib.request.urlopen(req, timeout=20) as r:
                if r.status == 200:
                    return url
        except Exception:
            pass
        time.sleep(15)
    return None  # aún no está: se reintenta el próximo ciclo


def asegurar_portada_publica(pieza_id, data_uri):
    return asegurar_img_publica(f"portadas/{pieza_id}.jpg", data_uri, pieza_id)


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


def esperar_contenedor(ig_token, creation_id):
    for _ in range(12):
        st, err = api("GET", str(creation_id), ig_token, fields="status_code")
        if err:
            return err
        if st.get("status_code") == "FINISHED":
            return None
        if st.get("status_code") == "ERROR":
            return "Meta no pudo procesar la imagen"
        time.sleep(5)
    return None  # a veces publica bien aunque el estado tarde


def publicar_story_ig(pagina, url_img):
    """Historia de Instagram: la imagen tal cual, sin stickers ni texto."""
    ig = pagina.get("ig_id")
    if not ig:
        return None, "la página no tiene Instagram vinculado"
    token = pagina["page_token"]
    cont, err = api("POST", f"{ig}/media", token, image_url=url_img, media_type="STORIES")
    if err:
        return None, err
    err = esperar_contenedor(token, cont["id"])
    if err:
        return None, err
    pub, err = api("POST", f"{ig}/media_publish", token, creation_id=cont["id"])
    if err:
        return None, err
    return pub.get("id"), None


def publicar_story_fb(pagina, url_img):
    """Historia de la página de Facebook (foto sin publicar → photo_stories)."""
    token = pagina["page_token"]
    foto, err = api("POST", f"{pagina['page_id']}/photos", token, url=url_img, published="false")
    if err:
        return None, err
    st, err = api("POST", f"{pagina['page_id']}/photo_stories", token, photo_id=foto["id"])
    if err:
        return None, err
    return st.get("post_id") or st.get("id"), None


def buscar_video(nombre):
    """Encuentra el archivo en la carpeta de videos (sin distinguir mayúsculas)."""
    os.makedirs(os.path.join(VIDEOS_DIR, "publicados"), exist_ok=True)
    ruta = os.path.join(VIDEOS_DIR, nombre)
    if os.path.isfile(ruta):
        return ruta
    for f in os.listdir(VIDEOS_DIR):
        if f.lower() == nombre.lower() and os.path.isfile(os.path.join(VIDEOS_DIR, f)):
            return os.path.join(VIDEOS_DIR, f)
    return None


def url_video_publico(ruta):
    """Sube el video a un release de GitHub (no engorda el historial del repo)
    y devuelve su URL pública para que Meta lo descargue."""
    import re as _re
    import shutil
    base, ext = os.path.splitext(os.path.basename(ruta))
    limpio = _re.sub(r"[^A-Za-z0-9_-]+", "-", base).strip("-") or "historia"
    firma = hashlib.sha1(open(ruta, "rb").read(1 << 20)).hexdigest()[:8]
    asset = f"{limpio}-{firma}{ext.lower()}"
    tmp = os.path.join("/tmp", asset)
    shutil.copyfile(ruta, tmp)
    subprocess.run([GH, "release", "create", "videos", "-R", GH_REPO, "--title", "Videos de historias",
                    "--notes", "Almacén temporal para la publicación automática"],
                   capture_output=True, text=True)  # ya existe: falla sin problema
    r = subprocess.run([GH, "release", "upload", "videos", tmp, "--clobber", "-R", GH_REPO],
                       capture_output=True, text=True)
    os.remove(tmp)
    if r.returncode != 0:
        return None, None, (r.stderr or r.stdout)[:200]
    url = f"https://github.com/{GH_REPO}/releases/download/videos/{urllib.parse.quote(asset)}"
    return url, asset, None


def limpiar_video(ruta, asset):
    """Tras publicar: archiva el video en publicados/ y borra el asset público."""
    try:
        destino = os.path.join(VIDEOS_DIR, "publicados", os.path.basename(ruta))
        os.replace(ruta, destino)
    except Exception:
        pass
    subprocess.run([GH, "release", "delete-asset", "videos", asset, "-y", "-R", GH_REPO],
                   capture_output=True, text=True)


def publicar_story_ig_video(pagina, url_video):
    """Historia de Instagram en video (el procesamiento tarda más que la foto)."""
    ig = pagina.get("ig_id")
    if not ig:
        return None, "la página no tiene Instagram vinculado"
    token = pagina["page_token"]
    cont, err = api("POST", f"{ig}/media", token, video_url=url_video, media_type="STORIES")
    if err:
        return None, err
    for _ in range(30):  # hasta ~5 min de procesamiento de video
        st, err = api("GET", str(cont["id"]), token, fields="status_code")
        if err:
            return None, err
        if st.get("status_code") == "FINISHED":
            break
        if st.get("status_code") == "ERROR":
            return None, "Meta no pudo procesar el video (revisa formato MP4/MOV vertical, máx 60 s)"
        time.sleep(10)
    pub, err = api("POST", f"{ig}/media_publish", token, creation_id=cont["id"])
    if err:
        return None, err
    return pub.get("id"), None


def publicar_story_fb_video(pagina, url_video):
    """Historia de video en la página de Facebook (start → subir → finish)."""
    token = pagina["page_token"]
    ini, err = api("POST", f"{pagina['page_id']}/video_stories", token, upload_phase="start")
    if err:
        return None, err
    try:
        req = urllib.request.Request(ini["upload_url"], method="POST", headers={
            "Authorization": f"OAuth {token}",
            "file_url": url_video,
        })
        with urllib.request.urlopen(req, timeout=300) as r:
            json.load(r)
    except Exception as e:
        return None, f"subida del video a Facebook falló: {e}"
    fin, err = api("POST", f"{pagina['page_id']}/video_stories", token,
                   upload_phase="finish", video_id=ini["video_id"])
    if err:
        return None, err
    return fin.get("post_id") or ini.get("video_id"), None


def emitir_historia(k):
    """La plataforma marca la historia como publicada al recibir esto."""
    try:
        cuerpo = json.dumps({"tipo": "historia", "k": k, "autor": "Meta", "ts": int(time.time() * 1000)})
        urllib.request.urlopen(
            urllib.request.Request(NTFY_DATOS, data=cuerpo.encode()), timeout=15)
    except Exception:
        pass


def procesar_historias(config, estado, ledger, ahora):
    """Publica las historias programadas (IG y FB no permiten agendarlas:
    salen a la hora exacta, o al despertar el Mac)."""
    cola = (estado.get("historias") or {}).get("prog") or {}
    for k, entrada in cola.items():
        if entrada.get("musica"):
            pass  # con música se publica a mano: solo se avisa, no necesita medio
        elif not entrada.get("auto") or not (entrada.get("img") or entrada.get("video")):
            continue
        fecha, resto = k[:10], k[11:]
        if "|" not in resto:
            continue
        marca, texto = resto.split("|", 1)
        pagina = (config.get("pages") or {}).get(marca)
        if not pagina:
            continue
        try:
            dt = datetime.strptime(f"{fecha} {entrada.get('hora', '12:00')}", "%Y-%m-%d %H:%M")
            t_pub = int(dt.replace(tzinfo=TZ).timestamp())
        except Exception:
            continue
        if ahora < t_pub:
            continue
        if ahora - t_pub > 20 * 3600:
            continue  # más de 20 h tarde: ya no tiene sentido publicarla
        reg = ledger.setdefault("hist:" + k, {})
        if reg.get("errores", 0) >= MAX_REINTENTOS or reg.get("avisado"):
            continue
        redes = {"ig": ["ig"], "fb": ["fb"], "ambas": ["ig", "fb"]}.get(entrada.get("red", "ambas"), ["ig", "fb"])
        titulo = (texto.split(" ", 1)[-1] if " " in texto else texto)[:70]
        if entrada.get("musica"):
            # El sticker de música solo existe en la app de Instagram: en vez de
            # publicar, se manda un aviso que al tocarlo abre la cámara de historias.
            reg["avisado"] = True
            avisar("🎵 Hora de la historia con música",
                   f"«{titulo}» ({marca}): toca este aviso y se abre la cámara de "
                   "historias de Instagram. Elige la foto y ponle su música.",
                   "musical_note", click="instagram://story-camera")
            log(f"historia con música: aviso enviado ({titulo})")
            continue
        es_video = bool(entrada.get("video"))

        # Medio a publicar: video desde la carpeta del Mac, o imagen del estado
        ruta_video = asset_video = None
        if es_video:
            ruta_video = buscar_video(entrada["video"])
            if not ruta_video:
                reg["errores"] = reg.get("errores", 0) + 1
                log(f"historia «{titulo}»: no encuentro el video {entrada['video']}")
                if reg["errores"] == 1:
                    avisar("⚠️ Falta el video de la historia",
                           f"«{titulo}»: no encuentro «{entrada['video']}» en la carpeta Videos Contenido Hub del escritorio. Ponlo ahí y sale en el próximo ciclo.",
                           "warning")
                continue
            url_medio, asset_video, err_v = url_video_publico(ruta_video)
            if err_v:
                reg["errores"] = reg.get("errores", 0) + 1
                log(f"historia «{titulo}»: no pude subir el video ({err_v})")
                continue
        else:
            firma = hashlib.sha1(entrada["img"].encode()).hexdigest()[:16]
            url_medio = asegurar_img_publica(f"historias/{firma}.jpg", entrada["img"], "historia")
            if not url_medio:
                log(f"historia «{titulo}»: imagen pública pendiente; reintento próximo ciclo")
                continue

        error = None
        if "ig" in redes and not reg.get("ig_id"):
            ig_id, error = (publicar_story_ig_video if es_video else publicar_story_ig)(pagina, url_medio)
            if ig_id:
                reg["ig_id"] = ig_id
                log(f"historia IG al aire ({'video' if es_video else 'imagen'}): {titulo}")
        if not error and "fb" in redes and not reg.get("fb_id"):
            fb_id, error = (publicar_story_fb_video if es_video else publicar_story_fb)(pagina, url_medio)
            if fb_id:
                reg["fb_id"] = fb_id
                log(f"historia FB al aire ({'video' if es_video else 'imagen'}): {titulo}")
        if error:
            reg["errores"] = reg.get("errores", 0) + 1
            log(f"historia ERROR: {error}")
            if reg["errores"] in (1, MAX_REINTENTOS):
                avisar("⚠️ Historia automática con problemas",
                       f"«{titulo}»: {error}"
                       + (" — no se reintentará más." if reg["errores"] >= MAX_REINTENTOS else ""),
                       "warning")
            continue
        ig_ok = "ig" not in redes or reg.get("ig_id")
        fb_ok = "fb" not in redes or reg.get("fb_id")
        if ig_ok and fb_ok:
            reg["avisado"] = True
            if es_video and ruta_video:
                limpiar_video(ruta_video, asset_video)
            emitir_historia(k)
            tarde = ahora - t_pub > 900
            avisar("📲 Historia publicada",
                   f"«{titulo}» ya está al aire ({marca})"
                   + (" — salió atrasada: el Mac estaba dormido" if tarde else ""), "tada")


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
    # La cola guardada desde claude.ai llega por el puente como cola.json:
    # si es más nueva que estado.json, sus campos mandan.
    cola_puente = cargar(os.path.join(REPO, "cola.json"), None)
    if cola_puente and cola_puente.get("ts", 0) > estado.get("ts", 0):
        for campo in ("meta", "historias", "fechas", "horas", "ediciones",
                      "estados", "ocultas", "nuevas"):
            if campo in cola_puente:
                estado[campo] = cola_puente[campo]
        fusion = dict(estado.get("portadas") or {})
        fusion.update(cola_puente.get("portadas") or {})
        estado["portadas"] = fusion
        log(f"cola del puente aplicada (ts {cola_puente.get('ts')})")
    cola = estado.get("meta") or {}
    hist = (estado.get("historias") or {}).get("prog") or {}
    if not cola and not hist:
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

    procesar_historias(config, estado, ledger, ahora)
    guardar_ledger(ledger)


if __name__ == "__main__":
    main()
