---
name: renovar-mes
description: Renueva el calendario de contenidos de Contenido Hub para un nuevo mes — genera las piezas de Forestal Café y Carnes Manzanares en las fechas lunes-miércoles-viernes, actualiza data.js y sincroniza con Notion. Úsalo cuando David diga "renueva el mes", "nuevo mes de contenidos", "calendario de octubre" o similar.
---

# Renovar el mes de contenidos

Genera el calendario del mes que David indique (si no lo indica, el mes siguiente al actual en `data.js`).

## Proceso

1. **Calcula las fechas**: todos los lunes, miércoles y viernes del nuevo mes (`cal <mes> <año>` en bash). Cada marca publica en TODAS esas fechas (una pieza por marca por fecha).

2. **Lee el mes anterior** en `data.js` y respeta estas reglas de rotación (matriz anti-redundancia):
   - Cada pieza tiene `mensaje` y `tono`. En un mismo mes, un mensaje no se repite más de 2-3 veces por marca y nunca con el mismo tono.
   - Mensajes Forestal: Finca propia, Orgánico, 3 orígenes, Experiencia en tienda, La gente, Temporada/Bebida del mes.
   - Mensajes Manzanares: Del campo a la mesa, Calidad y maduración, Cortes y productos, Recetas, La gente, Tradición santandereana.
   - Tonos: Educativo, Sensorial, Emocional, Dato curioso, Trend/Humor, Testimonial.
   - Estructura de mes probada: abre con reencauche emocional, ASMR en semana 1-2, entrevista/testimonial a mitad, reel de trazabilidad (el "reel de posicionamiento") con la Sesión 2, trend a mitad de mes, macro/foto en semana 3, cierra con testimonial de origen.

3. **Reparte por sesiones** (campo `sesion`): `s1` = tienda/punto de venta, `s2` = finca/campo, `ed` = solo edición/diseño. Debe haber 3-4 piezas `ed` por marca (reencauches y gráficas: la red de seguridad). Todo lo grabable debe caber en 2 días de rodaje.

4. **Escribe cada pieza** con el formato de `data.js`: id (`f-MMDD`/`m-MMDD`), copy accionable (qué grabar, hook sugerido, equipo), `checklist` de 4 pasos, `gear` (usar los presets `GEAR`), `refs` (búsquedas de Pinterest/TikTok relevantes).

5. **Actualiza** `MES` (titulo, clave) y las piezas en `data.js`. No toques `referentes.js` salvo que David pida refrescar referentes.

6. **Sincroniza con Notion**: crea las páginas nuevas en las bases "Calendario Forestal" (collection://1fabd923-a0c8-4f7e-aa31-8b9db162fbfb) y "Calendario Manzanares" (collection://8025589e-72b2-4318-bd90-d9ac54edf01a) con las mismas propiedades, y actualiza los enlaces `notion` de cada pieza en data.js.

7. **Commit y push**, y actualiza el enlace público con `git push origin main:gh-pages` (Pages sirve la rama gh-pages). Regenera también `python3 build_artifact.py` y republica el artifact de claude.ai fusionando antes el estado en vivo (bloque #hub-state).

## Reglas de David

- Partir siempre del último cambio aprobado; nunca rehacer de cero lo que ya funciona.
- Sin megaproducciones: todo debe poder grabarse con A7V + Hollyland + Ulanzi 40W en 2 sesiones.
- Referencias de contenido real (no IA), estética premium tipo Pergamino/La Cabra (café) y Victor Churchill (carnes).
