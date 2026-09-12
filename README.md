# Contenido Hub

Plataforma interna de David para organizar el contenido mensual de **Café Forestal** (@forestalcafea) y **Carnes Manzanares** (@carnesmanzanares).

Cadencia: **lunes, miércoles y viernes** (3 publicaciones por semana por marca).

## Cómo usarla

**Desde cualquier dispositivo (celular incluido):** https://claude.ai/code/artifact/245bee3d-3862-44f0-a329-70c43d454a9a — privado, solo con tu cuenta de Claude. Ahí el avance (estados y checklists) se guarda dentro de la propia página, así se sincroniza entre tu compu y tu celular. Para compartirlo con alguien del equipo en modo lectura, usa el menú de compartir del artifact con permiso de "ver": podrán consultarlo pero sus cambios no se guardan.

**En local:** abre `index.html` en el navegador (doble clic). No necesita servidor ni instalación. En local el avance vive en el navegador (localStorage).

**Enlace público (sin iniciar sesión):** https://duffeldavid.github.io/contenido-hub/ — y el formulario de aprobación para clientes: https://duffeldavid.github.io/contenido-hub/?modo=cliente

Tras cambiar `data.js`, `referentes.js`, `app.js` o `styles.css` (el Estudio tiene su propio `build_estudio.py`):
1. `python3 build_artifact.py` y pedir a Claude republicar `artifact.html` sobre la misma URL de claude.ai.
2. Publicar en el enlace público: `git push origin main:gh-pages` (GitHub Pages sirve la rama `gh-pages`).

- **Calendario** — las fechas del mes con sus piezas. Toca una pieza para ver copy, checklist, equipo y referencias.
- **Pipeline** — el flujo de producción (Idea → Por grabar → En edición → Listo → Programado → Publicado). Cambia el estado desde el panel de cada pieza.
- **Plan de rodaje** — la clave anti-estancamiento: dos días de rodaje al mes (Sesión 1 tienda, Sesión 2 finca/campo) surten las 12 fechas de cada marca. El resto es edición.
- **Referentes** — cuentas reales verificadas (Pergamino, Onyx, La Cabra, Victor Churchill, Max the Meat Guy…), tácticas 2025-26 y búsquedas listas para Pinterest/TikTok.

El avance (estados y checklists) se guarda en el navegador (localStorage). El botón **Exportar avance** descarga un JSON con el estado del mes.

## Estudio (privado: solo David)

Los proyectos, los objetivos y las finanzas viven **aparte del Contenido Hub**, en `estudio.html` (diseño propio: negro, forma dorada en movimiento, tarjetas de vidrio). El hub queda solo para el flujo de contenidos con el equipo.

- **Inicio:** caja, por cobrar, objetivo del mes, proyectos y las siguientes acciones (planes, cobros, pagos y ajustes de mercadeo pendientes del hub).
- **Proyectos:** un espacio por cliente (Grupo Empresarial Manzanares → abre el Contenido Hub; Enzo & Ríos, Aryliz…) con su dinero en el pipeline y sus planes de 4 semanas (plantillas de diseño, audiovisual, contenido y personal).
- **Finanzas:** centro de liquidez (caja, por pagar y por cobrar a 15 días), objetivos con avance real, flujo de caja proyectado a 12 meses (retainers y proyectos entran, obligaciones y gastos fijos salen; cotizaciones en línea punteada), pipeline de clientes, simulador de metas, cuentas fijas y hoja de cálculo.
- **Dónde viven los datos:** solo en el navegador (`localStorage`: `contenidoHub.finanzas` y `contenidoHub.proyectos`). Nunca viajan con **Guardar cambios**, ni al `estado.json` público, ni al hub-state del artifact del equipo. Para pasarlos a otro dispositivo: **Respaldar (JSON)** → **Restaurar respaldo**.
- **Candado:** pide la clave de David una vez por navegador (`hubAccesoEstudio`); **Bloquear** vuelve a cerrarla. El candado es incógnito: no muestra nombres ni lo que hay detrás.
- **Semilla privada:** `finanzas.semilla.js` (clientes, montos, objetivos de arranque) está en `.gitignore`; solo se carga en local y no se incrusta en ningún artifact.
- **Código:** `estudio.html` + `estudio.css` + `estudio.js` (helpers, clientes/proyectos, inicio) y `finanzas.js` + `finanzas.css` (módulos financieros). Artifact propio: `python3 build_estudio.py` → `estudio-artifact.html` (privado, sin compartir).

## Contenidos (pestaña principal del hub)

La primera pestaña es **Contenidos**. Para David tiene dos modos: **Aprobación** (tres columnas: *Aprobadas* con cambio rápido de estado, *Ajustes de mercadeo* con el botón *Aplicado · a producción* y, debajo, los ajustes ya aplicados, e *Ideas*, donde las que traen comentario de mercadeo van primero con el botón *Tratar como ajuste*) y **Todas** (la lista completa con filtros). **El veredicto y el comentario de Mercadeo GM se ven en cada pieza, en todas partes**: bloque firmado con avatar en las tres columnas y en Todas, banner en la ficha, línea corta en las tarjetas del calendario, rodaje y pipeline, lápiz en el planificador mensual y en la tira del modo Flujo, marca en la casilla del Feed, nota en el PDF y en el WhatsApp para el cliente, y un contador «pedidos de mercadeo por atender» en el héroe. Un comentario que llegó sin veredicto se muestra como *comentó · sin veredicto aún*; si David lo toma como ajuste se guarda la bandera `ajuste`, que solo cuenta en el hub de David (el veredicto y los contadores del link del cliente no se tocan). El ajuste atendido se guarda como `ok`; si mercadeo cambia el veredicto o el comentario, se reabre solo (una respuesta repetida idéntica conserva lo decidido). En el link del cliente la pestaña sigue llamándose **Aprobación** y no cambia nada.

## Estructura

| Archivo | Qué es |
|---|---|
| `data.js` | Las piezas del mes (fechas, copys, checklists, equipo, referencias) |
| `referentes.js` | Cuentas referentes y tácticas |
| `app.js` | Lógica de la app |
| `estudio.html` / `estudio.css` / `estudio.js` | Estudio (privado): proyectos por cliente, objetivos y finanzas |
| `finanzas.js` / `finanzas.css` | Módulos financieros del Estudio |
| `finanzas.semilla.js` | Datos privados de arranque del Estudio (ignorado por git, no va a los artifacts) |
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
