#!/usr/bin/env python3
"""Conectar Contenido Hub con la API de Meta (una sola vez, en el Mac de David).

Este script se corre A MANO en la terminal. Pide tres datos que solo David
tiene (App ID, App Secret y un token de usuario del Graph API Explorer),
convierte el token corto en tokens de página QUE NO VENCEN y guarda todo en:

    ~/Library/Application Support/ContenidoHub/meta.json  (permisos 600)

Los tokens NUNCA entran al repo (el repo es público) ni salen del Mac.
El trabajador scripts/publicar_meta.py usa este archivo para programar
Facebook y publicar Instagram a la hora exacta.
"""
import json
import os
import sys
import urllib.parse
import urllib.request

GRAPH = "https://graph.facebook.com/v25.0"
DESTINO = os.path.expanduser("~/Library/Application Support/ContenidoHub/meta.json")


PERMISOS = ["pages_show_list", "pages_manage_posts", "pages_read_engagement",
            "instagram_basic", "instagram_content_publish", "business_management"]


def api(path, fatal=True, **params):
    url = f"{GRAPH}/{path}?" + urllib.parse.urlencode(params)
    try:
        with urllib.request.urlopen(url, timeout=30) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        cuerpo = e.read().decode("utf-8", "replace")
        try:
            err = json.loads(cuerpo).get("error", {})
            msg = err.get("message", cuerpo)
        except Exception:
            msg = f"HTTP {e.code}: {cuerpo[:300]}"
        if not fatal:
            return {"__error": msg}
        print(f"\n❌ Meta respondió un error: {msg}")
        sys.exit(1)


def revisar_permisos(token):
    """Avisa ANTES de seguir si al token le faltan permisos."""
    r = api("me/permissions", fatal=False, access_token=token)
    datos = r.get("data") if isinstance(r, dict) else None
    if not datos:
        return  # no se pudo consultar: se sigue y los errores dirán qué falta
    con = {p["permission"] for p in datos if p.get("status") == "granted"}
    faltan = [p for p in PERMISOS if p not in con]
    if faltan:
        print(f"""
⚠️  Al token le FALTAN estos permisos: {", ".join(faltan)}

   Cómo arreglarlo (2 minutos):
   1. Vuelve a https://developers.facebook.com/tools/explorer
   2. Verifica que arriba a la derecha esté elegida TU app (no «Graph API Explorer»).
   3. En el panel derecho, en "Permissions", agrega uno por uno los que faltan
      (escríbelos en el buscador y márcalos).
   4. Toca «Generate Access Token»: en el diálogo de Facebook elige LAS DOS
      páginas y sus dos Instagram, y deja TODOS los interruptores encendidos.
   5. Copia el token nuevo y vuelve a correr este script.
""")
        sys.exit(1)
    print("   ✓ El token trae los 6 permisos necesarios")


def elegir_pagina(paginas, apodo, pistas):
    """Encuentra la página por nombre; si hay duda, pregunta."""
    candidatas = [p for p in paginas if any(x in p["name"].lower() for x in pistas)]
    if len(candidatas) == 1:
        return candidatas[0]
    print(f"\n¿Cuál página es la de {apodo}?")
    for i, p in enumerate(paginas, 1):
        print(f"  {i}. {p['name']}  (id {p['id']})")
    while True:
        n = input("Número: ").strip()
        if n.isdigit() and 1 <= int(n) <= len(paginas):
            return paginas[int(n) - 1]


def main():
    print("═" * 62)
    print("  CONECTAR META · Contenido Hub")
    print("═" * 62)
    print("""
Antes de seguir necesitas (guía completa en scripts/CONECTAR_META.md):
  1. Tu app en https://developers.facebook.com (tipo Empresa/Business).
  2. El App ID y el App Secret (Configuración de la app → Básica).
  3. Un token de usuario del Graph API Explorer
     (https://developers.facebook.com/tools/explorer) con los permisos:
     pages_show_list, pages_manage_posts, pages_read_engagement,
     instagram_basic, instagram_content_publish, business_management
""")
    app_id = input("App ID: ").strip()
    app_secret = input("App Secret: ").strip()
    token_corto = input("Token del Graph API Explorer: ").strip()
    if not (app_id and app_secret and token_corto):
        print("Faltan datos — vuelve a intentarlo.")
        sys.exit(1)

    print("\n→ Cambiando el token corto por uno de larga duración…")
    largo = api("oauth/access_token", grant_type="fb_exchange_token",
                client_id=app_id, client_secret=app_secret,
                fb_exchange_token=token_corto)["access_token"]

    print("→ Revisando los permisos del token…")
    revisar_permisos(largo)

    print("→ Buscando tus páginas…")
    cuentas = api("me/accounts", fields="id,name,access_token", limit="100",
                  access_token=largo).get("data", [])
    if not cuentas:
        print("❌ Meta no devolvió páginas. Revisa que el token tenga pages_show_list\n"
              "   y que tu usuario administre las páginas.")
        sys.exit(1)
    print("   Páginas encontradas: " + ", ".join(p["name"] for p in cuentas))

    config = {"app_id": app_id, "pages": {}}
    for apodo, pistas in (("forestal", ("forestal",)), ("manzanares", ("manzanares",))):
        pg = elegir_pagina(cuentas, apodo, pistas)
        info = api(pg["id"], fatal=False, fields="instagram_business_account{id,username}",
                   access_token=pg["access_token"])
        if info.get("__error"):
            print(f"   ⚠️ {apodo}: no pude leer el Instagram vinculado ({info['__error'][:120]}…)\n"
                  f"      Se guarda sin Instagram; genera un token con TODOS los permisos y vuelve a correr el script.")
            info = {}
        ig = info.get("instagram_business_account") or {}
        config["pages"][apodo] = {
            "page_id": pg["id"], "page_name": pg["name"],
            "page_token": pg["access_token"],
            "ig_id": ig.get("id"), "ig_username": ig.get("username"),
        }
        print(f"   ✓ {apodo}: página «{pg['name']}»"
              + (f" · Instagram @{ig['username']}" if ig.get("username")
                 else " · ⚠️ SIN Instagram vinculado (vincúlalo en Meta Business Suite)"))

    os.makedirs(os.path.dirname(DESTINO), exist_ok=True)
    with open(DESTINO, "w") as f:
        json.dump(config, f, indent=2)
    os.chmod(DESTINO, 0o600)

    print(f"""
✅ Listo. Configuración guardada en:
   {DESTINO}
   (solo tu usuario puede leerla; nunca entra al repo)

Prueba de fuego (no publica nada, solo verifica):
   python3 "{os.path.abspath(os.path.dirname(__file__))}/publicar_meta.py" --verificar
""")


if __name__ == "__main__":
    main()
