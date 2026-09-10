# Contenido Hub

Plataforma interna de David para organizar el contenido mensual de **Café Forestal** (@forestalcafea) y **Carnes Manzanares** (@carnesmanzanares).

Cadencia: **lunes, miércoles y viernes** (3 publicaciones por semana por marca).

## Cómo usarla

**Desde cualquier dispositivo (celular incluido):** https://claude.ai/code/artifact/245bee3d-3862-44f0-a329-70c43d454a9a — privado, solo con tu cuenta de Claude. Ahí el avance (estados y checklists) se guarda dentro de la propia página, así se sincroniza entre tu compu y tu celular. Para compartirlo con alguien del equipo en modo lectura, usa el menú de compartir del artifact con permiso de "ver": podrán consultarlo pero sus cambios no se guardan.

**En local:** abre `index.html` en el navegador (doble clic). No necesita servidor ni instalación. En local el avance vive en el navegador (localStorage).

**Enlace público (sin iniciar sesión):** https://duffeldavid.github.io/contenido-hub/ — y el formulario de aprobación para clientes: https://duffeldavid.github.io/contenido-hub/?modo=cliente

Tras cambiar `data.js`, `referentes.js`, `finanzas.js`, `app.js` o `styles.css`:
1. `python3 build_artifact.py` y pedir a Claude republicar `artifact.html` sobre la misma URL de claude.ai.
2. Publicar en el enlace público: `git push origin main:gh-pages` (GitHub Pages sirve la rama `gh-pages`).

- **Calendario** — las fechas del mes con sus piezas. Toca una pieza para ver copy, checklist, equipo y referencias.
- **Pipeline** — el flujo de producción (Idea → Por grabar → En edición → Listo → Programado → Publicado). Cambia el estado desde el panel de cada pieza.
- **Plan de rodaje** — la clave anti-estancamiento: dos días de rodaje al mes (Sesión 1 tienda, Sesión 2 finca/campo) surten las 12 fechas de cada marca. El resto es edición.
- **Referentes** — cuentas reales verificadas (Pergamino, Onyx, La Cabra, Victor Churchill, Max the Meat Guy…), tácticas 2025-26 y búsquedas listas para Pinterest/TikTok.

El avance (estados y checklists) se guarda en el navegador (localStorage). El botón **Exportar avance** descarga un JSON con el estado del mes.

## Finanzas (privado: solo David)

La pestaña **Finanzas** es personal y no forma parte del contenido que ve el equipo:

- **Qué tiene:** centro de liquidez (caja de hoy, por pagar y por cobrar a 15 días), proyección de una deuda o meta de ahorro (gráfico de área con sliders de abono mensual y tasa EA: recalcula en vivo en cuántos meses el saldo llega a cero) y el pipeline de clientes (cotización → aprobado → en ejecución → facturado → pagado, con sumatorios de dinero seguro, pendiente de cobro y en negociación). Debajo siguen las cuentas fijas y la hoja de cálculo.
- **Dónde viven los datos:** solo en el navegador (`localStorage`, clave `contenidoHub.finanzas`). Nunca viajan con **Guardar cambios**, ni al `estado.json` público, ni al hub-state del artifact que el equipo abre en modo lectura. Para pasarlos a otro dispositivo: **Respaldar (JSON)** → **Restaurar respaldo**.
- **Candado:** la vista pide la clave de David (`CLAVE_DAVID`) una vez por navegador (`hubAccesoFinanzas`); el enlace **Bloquear Finanzas** vuelve a cerrarla. Aplica en local, en GitHub Pages y dentro del artifact.
- **Semilla privada:** `finanzas.semilla.js` (clientes y montos de arranque) está en `.gitignore` y `build_artifact.py` **no** lo incrusta en `artifact.html`. Solo se usa la primera vez que un navegador abre la sección sin datos guardados. En el repo y en Pages ese archivo no existe (el 404 en consola es normal).
- **Código:** `finanzas.js` (módulo, se carga antes de `app.js`); `renderFinanzas` en `app.js` arma la vista y llama `finWire`. Estilos: bloque `.fin-dark` / `.fx-*` al final de `styles.css`.

## Estructura

| Archivo | Qué es |
|---|---|
| `data.js` | Las piezas del mes (fechas, copys, checklists, equipo, referencias) |
| `referentes.js` | Cuentas referentes y tácticas |
| `app.js` | Lógica de la app |
| `finanzas.js` | Vista Finanzas (privada): liquidez, proyección y pipeline |
| `finanzas.semilla.js` | Datos privados de arranque de Finanzas (ignorado por git, no va al artifact) |
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

## Guardar cambios (portadas incluidas, sin configurar nada)

El botón flotante **Guardar cambios** (abajo a la derecha, solo en la plataforma de David) publica el estado completo — portadas, títulos/copys editados, fechas, estados, piezas nuevas y quitadas — y funciona igual en el computador y el celular, sin tokens ni cuentas:

1. Al tocarlo, la plataforma envía el estado como **adjunto** `estado-hub.json` por el canal ntfy de datos (los adjuntos admiten ~2MB; si el estado pesa más, las portadas se reencogen solas). El modo cliente lo recibe **al instante** (en vivo por SSE, o al abrir con el poll de 12h).
2. En el Mac de David, `scripts/archivar_estado.py` corre cada 10 minutos (launchd `com.contenidohub.archivar`, log en `~/Library/Logs/contenidohub-archivar.log`) desde un clon propio en `~/Library/Application Support/ContenidoHub/repo`: recoge el último adjunto y lo commitea como `estado.json` en `main` (y gh-pages). Eso lo hace **permanente**: cualquier apertura futura lo carga aunque el adjunto ya haya vencido.
3. Autocuración: si al abrir la plataforma lo archivado está atrás de lo último guardado (Mac apagado varios días), la página re-emite el adjunto sola.

- El botón se enciende (blanco + punto rojo latiendo) cuando hay cambios sin guardar.
- Funciona desde el enlace público o local; en el visor de claude.ai no (CSP), el botón te manda al enlace público.
- Ojo al trabajar con git: `estado.json` se commitea desde el Mac en segundo plano, así que hacer `git pull` antes de trabajar en esta carpeta.
- Para pausar el archivador: `launchctl bootout gui/$(id -u)/com.contenidohub.archivar`; para reactivarlo, `launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.contenidohub.archivar.plist`.

## Equipos

Sony A7V · Micrófonos Hollyland · Luz Ulanzi 40W. Los presets por formato están en `data.js` (`GEAR`).
