# Contenido Hub

Plataforma interna de David para organizar el contenido mensual de **Café Forestal** (@forestalcafea) y **Carnes Manzanares** (@carnesmanzanares).

Cadencia: **lunes, miércoles y viernes** (3 publicaciones por semana por marca).

## Cómo usarla

**Desde cualquier dispositivo (celular incluido):** https://claude.ai/code/artifact/245bee3d-3862-44f0-a329-70c43d454a9a — privado, solo con tu cuenta de Claude. Ahí el avance (estados y checklists) se guarda dentro de la propia página, así se sincroniza entre tu compu y tu celular. Para compartirlo con alguien del equipo en modo lectura, usa el menú de compartir del artifact con permiso de "ver": podrán consultarlo pero sus cambios no se guardan.

**En local:** abre `index.html` en el navegador (doble clic). No necesita servidor ni instalación. En local el avance vive en el navegador (localStorage).

**Enlace público (sin iniciar sesión):** https://duffeldavid.github.io/contenido-hub/ — y el formulario de aprobación para clientes: https://duffeldavid.github.io/contenido-hub/?modo=cliente

Tras cambiar `data.js`, `referentes.js`, `app.js` o `styles.css`:
1. `python3 build_artifact.py` y pedir a Claude republicar `artifact.html` sobre la misma URL de claude.ai.
2. Publicar en el enlace público: `git push origin main:gh-pages` (GitHub Pages sirve la rama `gh-pages`).

- **Calendario** — las fechas del mes con sus piezas. Toca una pieza para ver copy, checklist, equipo y referencias.
- **Pipeline** — el flujo de producción (Idea → Por grabar → En edición → Listo → Programado → Publicado). Cambia el estado desde el panel de cada pieza.
- **Plan de rodaje** — la clave anti-estancamiento: dos días de rodaje al mes (Sesión 1 tienda, Sesión 2 finca/campo) surten las 12 fechas de cada marca. El resto es edición.
- **Referentes** — cuentas reales verificadas (Pergamino, Onyx, La Cabra, Victor Churchill, Max the Meat Guy…), tácticas 2025-26 y búsquedas listas para Pinterest/TikTok.

El avance (estados y checklists) se guarda en el navegador (localStorage). El botón **Exportar avance** descarga un JSON con el estado del mes.

## Estructura

| Archivo | Qué es |
|---|---|
| `data.js` | Las piezas del mes (fechas, copys, checklists, equipo, referencias) |
| `referentes.js` | Cuentas referentes y tácticas |
| `app.js` | Lógica de la app |
| `styles.css` | Diseño |

## Renovar el mes

Abre esta carpeta en Claude Code y di **"renueva el mes de contenidos"**. La skill `renovar-mes` genera el nuevo calendario (fechas L-M-V del mes siguiente, rotación de mensajes sin redundar) y lo sincroniza con Notion.

Los calendarios originales viven en Notion:
- [Sistema de Contenido Forestal](https://app.notion.com/p/3c4dcde6938f810aafa2c6d674284a98)
- [Sistema de Contenido Carnes Manzanares](https://app.notion.com/p/3d0dcde6938f81c2b352f39e517d0184)

## Cómo funciona el tiempo real (no romper)

Ambos lados comparten un canal de eventos (ntfy.sh):
- **Mercadeo GM → David**: aprobaciones y comentarios (`tipo: "aprob"`), con push al celular por el canal de notificaciones.
- **David → Mercadeo GM**: ediciones de título/copy (`edicion`), fechas (`fecha`) y estados (`estado`).
- Cada lado escucha por SSE + se re-sincroniza cada 60s y al volver a la pestaña.
- **Regla de oro**: para que las ediciones lleguen en vivo al cliente, David edita desde el **enlace público o local** (el visor de claude.ai bloquea conexiones salientes). Las portadas subidas no viajan por el canal (límite de 4KB): para eso está **Guardar cambios**.
- Claves de acceso: plataforma `Duffel21` · link del cliente `Mercadeo123` (constantes `CLAVE_DAVID` / `CLAVE_ACCESO` en app.js).

## Guardar cambios (portadas incluidas)

El botón flotante **Guardar cambios** (abajo a la derecha, solo en la plataforma de David) publica el estado completo — portadas, títulos/copys editados, fechas, estados, piezas nuevas y quitadas — como `estado.json` en la rama `main` del repo, vía la API de GitHub. El modo cliente (y cualquier otro dispositivo) lo carga al abrir y también en vivo cuando llega el evento `pub` por ntfy.

- La primera vez pide conectar GitHub: un token *fine-grained* limitado al repo `contenido-hub` con permiso **Contents: Read and write**. Se guarda solo en el navegador de ese dispositivo (`localStorage`, clave `hubTokenGH`) — **nunca** subirlo al repo.
- El botón se enciende (blanco + punto rojo) cuando hay cambios sin guardar.
- Funciona desde el enlace público o local; en el visor de claude.ai no (CSP), el botón te manda al enlace público.
- Ojo al trabajar con git: `estado.json` se commitea desde la plataforma, así que hacer `git pull` antes de trabajar en esta carpeta.

## Equipos

Sony A7V · Micrófonos Hollyland · Luz Ulanzi 40W. Los presets por formato están en `data.js` (`GEAR`).
