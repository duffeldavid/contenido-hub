# Contenido Lab

Laboratorio privado de David para su propio contenido: piezas con hook y guion, estadísticas de lo publicado e inspiración (reels virales desmontados: hook, estructura, por qué funcionan y cómo adaptarlos).

Es una plataforma aparte del Contenido Hub (que es para el equipo y los clientes). Vive en esta carpeta `lab/` y no depende de nada más del repo.

## Cómo usarla

**Mac + iPhone, sincronizados (recomendado):** el artifact privado de claude.ai: https://claude.ai/code/artifact/d691ba56-8e8b-4a68-b286-6e9cf91f2f86 (solo con tu cuenta). Los datos se guardan en la base de datos del artifact con tu cuenta, así lo que anotas en el celular aparece en el Mac y al revés. En el iPhone: Safari → Compartir → **Añadir a pantalla de inicio** y queda como app.

**En local:** abre `lab/index.html` (doble clic). Sin servidor ni instalación. Ahí los datos viven en el navegador (localStorage); para moverlos a otro dispositivo usa **Más → Exportar / Importar**.

## Secciones

- **Inicio** — views de los últimos 30 días con comparación, promedio por pieza, engagement, seguidores ganados, retención; lo que está en producción, el mejor hook del mes y los referentes por analizar.
- **Contenido** — todas las piezas como tarjetas 9:16 (el hook es la portada) o como pipeline por estado: Idea → Guion → Grabado → Editado → Programado → Publicado. Cada pieza guarda plataforma, formato, fecha, hook y tipo de hook, guion, CTA, enlace, métricas (views, likes, comentarios, compartidos, guardados, retención, seguidores ganados) y notas de qué aprendiste.
- **Estadísticas** — filtros por periodo y plataforma; views por publicación, views promedio por tipo de hook, engagement por formato, mejor día para publicar y crecimiento de seguidores; lecturas automáticas (qué hook, formato y día rinden más) y la tabla completa.
- **Inspiración** — *Referentes*: archivo de reels virales con autor, enlace, views, hook, tipo, transcripción, estructura por partes (Hook → Contexto → Valor → Giro → CTA con segundos), por qué funciona, tu versión y hooks adaptados; botón **Convertir en pieza**. *Fórmulas*: plantillas de hook de la casa (más las tuyas) con un botón para arrancar una pieza desde ellas.
- **Más** — perfil y nicho (Claude lo usa al adaptar hooks), cuentas, registro de seguidores, respaldo JSON, datos de ejemplo, tema y enlaces al Hub y al Estudio.

## Claude dentro de la página (solo en el artifact)

- En un referente: **✦ Analizar con Claude** lee el hook y la transcripción y llena estructura, por qué funciona, tu versión y tres hooks adaptados a tu nicho. Tú revisas y guardas.
- En una pieza: **✦ Sugerir 5 hooks** propone alternativas de distinto tipo; **Usar** las aplica.

La primera vez, claude.ai pide permiso para usar tu cuenta desde la página. En local estos botones no aparecen.

## Datos de ejemplo

La plataforma trae piezas y referentes de muestra (marcados como *ejemplo*) para ver cómo se ve llena. Bórralos desde el aviso azul o en **Más → Datos** cuando tengas lo tuyo. Los autores de los referentes de ejemplo son inventados.

## Publicar cambios

1. `python3 lab/build_artifact.py` genera `lab/lab-artifact.html` (no se commitea) y sella las versiones de `index.html`.
2. Pedir a Claude republicar `lab/lab-artifact.html` sobre la misma URL del artifact, con las capacidades `db`, `sample` y `downloads`.

## Llevarlo a un repo privado propio

El código está pensado para vivir solo. Cuando tengas el repo privado creado en GitHub (por ejemplo `duffeldavid/contenido-lab`):

```bash
git subtree split --prefix=lab -b lab-solo
git push git@github.com:duffeldavid/contenido-lab.git lab-solo:main
```

## Estructura

| Archivo | Qué es |
|---|---|
| `index.html` | Estructura de la app (riel lateral en Mac, barra inferior en iPhone) |
| `lab.css` | Diseño: grafito frío, señal cian, marco 9:16 como motivo, oscuro y claro |
| `lab.js` | Lógica: vistas, fichas, gráficas SVG, sincronización con la base del artifact, Claude |
| `datos.js` | Fórmulas de hook y datos de ejemplo |
| `build_artifact.py` | Genera el artifact para claude.ai |
| `manifest.webmanifest` | Para añadirla a la pantalla de inicio del iPhone cuando se sirve por web |
