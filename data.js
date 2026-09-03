// ============================================================
// CONTENIDO HUB — Datos del mes
// Para renovar el mes: abre esta carpeta en Claude Code y pide
// "renueva el mes de contenidos" (skill: renovar-mes).
// Fuente original: calendarios de Notion (Forestal / Manzanares).
// ============================================================

const MES = {
  titulo: "Septiembre 2026",
  clave: "2026-09",
  cadencia: "Lunes · Miércoles · Viernes",
};

const MARCAS = {
  forestal: {
    nombre: "Café Forestal",
    handle: "@forestalcafea",
    instagram: "https://www.instagram.com/forestalcafea/",
    color: "#7FB069",
    colorFuerte: "#4A7C59",
    notion: "https://app.notion.com/p/3c4dcde6938f810aafa2c6d674284a98",
  },
  manzanares: {
    nombre: "Carnes Manzanares",
    handle: "@carnesmanzanares",
    instagram: "https://www.instagram.com/carnesmanzanares/",
    color: "#E2725B",
    colorFuerte: "#B2452C",
    notion: "https://app.notion.com/p/3d0dcde6938f81c2b352f39e517d0184",
  },
};

// Presets de equipo por tipo de pieza (Sony A7V + Hollyland + Ulanzi 40W)
const GEAR = {
  reelEntrevista: [
    "A7V · S-Cinetone · 4K 25p · 35–50mm",
    "Hollyland lavalier al entrevistado",
    "Ulanzi 40W como key suave (rebotada o difusa)",
  ],
  reelASMR: [
    "A7V · 4K 50/60p para slow motion · planos cerrados",
    "Hollyland pegado a la fuente de sonido",
    "Ulanzi 40W lateral para textura",
  ],
  reelNarrativo: [
    "A7V · S-Cinetone · 4K 25p · gimbal o mano firme",
    "Hollyland para sonido ambiente / voz en off aparte",
    "Luz natural + Ulanzi de apoyo",
  ],
  foto: [
    "A7V · RAW · f/2.8–f/5.6",
    "Ulanzi 40W rasante (textura) o lateral (producto)",
    "Fondo limpio u oscuro según la marca",
  ],
  grafica: [
    "Foto de archivo o de sesión como fondo",
    "Tipografía Lato + colores de marca",
    "Cero grabación: 30 min de diseño",
  ],
  edicion: [
    "Solo edición: material de archivo",
    "Música / voz en off",
    "Sin grabación nueva",
  ],
};

// sesion: "s1" = Sesión 1 (tienda / punto de venta), "s2" = Sesión 2 (finca / campo),
// "ed" = solo edición o diseño (reencauche / pieza gráfica)
const PIEZAS = [
  // ══════════════ FORESTAL CAFÉ ══════════════
  {
    id: "f-0904", fotos: ["assets/ref/finca.jpg", "assets/ref/granos.jpg"], concepto: "Video emotivo que abre el mes: los paisajes de nuestra finca con una voz que recuerda que de ahí sale cada taza. Cierre: 'Finca propia. Trazabilidad real.'", marca: "forestal", fecha: "2026-09-04",
    titulo: "Esto no es un paisaje, es de donde sale tu café",
    formato: "Reel", mensaje: "Finca propia", tono: "Emocional",
    estado: "Idea", reencauche: true, sesion: "ed",
    copy: "REENCAUCHE de material de finca existente. Remontar clips de paisaje/cultivo con voz en off corta y música emotiva. Hook: 'Esto no es un paisaje. Es de donde sale tu café.' Cierre: 'Finca propia. Trazabilidad real.' Sin grabación nueva — solo edición.",
    gear: GEAR.edicion,
    checklist: ["Seleccionar clips de finca del archivo", "Grabar voz en off (Hollyland en casa)", "Montaje + música emotiva", "Exportar 9:16 y subtítulos"],
    refs: [
      { label: "Pinterest · coffee farm cinematic", url: "https://www.pinterest.com/search/pins/?q=coffee%20farm%20cinematic%20film" },
      { label: "TikTok · coffee origin story", url: "https://www.tiktok.com/search?q=coffee%20farm%20origin%20story" },
    ],
    notion: "https://app.notion.com/3cfdcde6938f8150a8d4cec9506cea0d",
  },
  {
    id: "f-0907", fotos: ["assets/ref/onyx.jpg", "assets/ref/costal.jpg"], concepto: "Carrusel elegante presentando nuestros 3 orígenes: de qué finca sale cada uno, su perfil de sabor y para quién es. Invita a preguntar en tienda cuál va contigo.", marca: "forestal", fecha: "2026-09-07",
    titulo: "¿Cuál de nuestros 3 orígenes va contigo?",
    formato: "Carrusel", mensaje: "3 orígenes", tono: "Educativo",
    estado: "Idea", reencauche: false, sesion: "s1",
    copy: "Carrusel de 4-5 slides: portada + 1 slide por origen (finca de donde sale, perfil de sabor, para quién es) + cierre CTA 'pregunta en tienda cuál va contigo'. Fotos de producto con A7V + luz Ulanzi 40W (fondo oscuro, luz lateral). Piezas gráficas en Lato con colores de marca.",
    gear: GEAR.foto,
    checklist: ["Foto de producto por origen (3)", "Portada + slide de cierre en Lato", "Redactar perfil de sabor por origen", "CTA: pregunta en tienda"],
    refs: [
      { label: "Pinterest · specialty coffee packaging photo", url: "https://www.pinterest.com/search/pins/?q=specialty%20coffee%20bag%20product%20photography%20dark" },
      { label: "Pinterest · coffee carousel design", url: "https://www.pinterest.com/search/pins/?q=coffee%20brand%20instagram%20carousel%20design" },
    ],
    notion: "https://app.notion.com/3cfdcde6938f81b28f45d36e60977422",
  },
  {
    id: "f-0909", fotos: ["assets/ref/verve.jpg", "assets/ref/lacabra.jpg"], concepto: "Video sensorial sin voz: los sonidos reales del café — el molino, el vapor, la leche, la taza. 'Sube el volumen 🎧'.", marca: "forestal", fecha: "2026-09-09",
    titulo: "ASMR: así suena tu café antes de llegar a tu mesa",
    formato: "Reel", mensaje: "Experiencia en tienda", tono: "Sensorial",
    estado: "Por grabar", reencauche: false, sesion: "s1",
    copy: "SESIÓN 1 (tienda). Reel ASMR sin voz: molino, tamper, vapor, leche, taza sobre mesa. Sonido directo capturado con Hollyland (mic cerca de la máquina). A7V en planos cerrados 50-60fps para ligeros slow motion. Referencia estética: Solo Café. Copy corto: 'Sube el volumen 🎧'",
    gear: GEAR.reelASMR,
    checklist: ["Lista de sonidos: molino, tamper, vapor, leche, taza", "Mic Hollyland pegado a cada fuente", "5-7 planos cerrados 60fps", "Montaje solo con sonido directo"],
    refs: [
      { label: "TikTok · cafe ASMR barista", url: "https://www.tiktok.com/search?q=cafe%20asmr%20barista%20sounds" },
      { label: "Pinterest · barista cinematic close up", url: "https://www.pinterest.com/search/pins/?q=barista%20espresso%20cinematic%20close%20up" },
    ],
    notion: "https://app.notion.com/3cfdcde6938f81e79346d20c236a9d38",
  },
  {
    id: "f-0911", fotos: ["assets/ref/granos.jpg", "assets/ref/finca.jpg"], concepto: "Pieza gráfica con un dato potente: qué significa de verdad que un café sea orgánico, conectado con nuestras fincas propias.", marca: "forestal", fecha: "2026-09-11",
    titulo: "Dato: qué significa realmente que un café sea orgánico",
    formato: "Pieza gráfica", mensaje: "Orgánico", tono: "Dato curioso",
    estado: "Idea", reencauche: false, sesion: "ed",
    copy: "Pieza gráfica tipográfica (Lato + colores de marca) con un dato potente sobre café orgánico vs convencional. Foto de fondo del archivo (granos/cultivo). Producción: 30 min en diseño, cero grabación. Caption expande el dato y conecta con las fincas propias.",
    gear: GEAR.grafica,
    checklist: ["Elegir el dato (orgánico vs convencional)", "Foto de fondo del archivo", "Diseño en Lato + colores de marca", "Caption que conecta con finca propia"],
    refs: [
      { label: "Pinterest · typographic quote coffee post", url: "https://www.pinterest.com/search/pins/?q=minimal%20typographic%20instagram%20post%20coffee" },
    ],
    notion: "https://app.notion.com/3cfdcde6938f819c8e19d3a7aa335bc5",
  },
  {
    id: "f-0914", fotos: ["assets/ref/morgan.jpg", "assets/ref/amorperfecto.jpg"], concepto: "Mini-entrevista a un barista del equipo contando qué es lo que más ama de trabajar con este café. Cercano y humano.", marca: "forestal", fecha: "2026-09-14",
    titulo: "Las manos detrás de tu taza",
    formato: "Reel", mensaje: "La gente", tono: "Testimonial",
    estado: "Por grabar", reencauche: false, sesion: "s1",
    copy: "SESIÓN 1 (tienda). Mini-entrevista a un barista: '¿qué es lo que más te gusta de trabajar con este café?' Audio limpio con Hollyland (lavalier), A7V a 35-50mm equivalente, luz Ulanzi como key suave. 30-40 seg. B-roll de sus manos trabajando para cubrir cortes.",
    gear: GEAR.reelEntrevista,
    checklist: ["Confirmar barista y pregunta guía", "Lavalier + prueba de audio", "Entrevista 3-4 min (se corta a 40s)", "B-roll de manos trabajando"],
    refs: [
      { label: "TikTok · barista interview", url: "https://www.tiktok.com/search?q=meet%20the%20barista%20interview" },
      { label: "Pinterest · portrait barista natural light", url: "https://www.pinterest.com/search/pins/?q=barista%20portrait%20natural%20light" },
    ],
    notion: "https://app.notion.com/3cfdcde6938f81dd8d98e579bbba6203",
  },
  {
    id: "f-0916", fotos: ["assets/ref/finca.jpg", "assets/ref/tostadora.jpg"], concepto: "El video estrella del mes: el recorrido completo de tu bolsa — finca, beneficio, tueste y tienda. 'Pocas marcas en Colombia pueden mostrarte esto.'", marca: "forestal", fecha: "2026-09-16",
    titulo: "Trazabilidad en 30 segundos: de qué finca viene tu bolsa",
    formato: "Reel", mensaje: "Finca propia", tono: "Educativo",
    estado: "Por grabar", reencauche: false, sesion: "s2",
    copy: "SESIÓN 2 (finca). El reel de posicionamiento del mes: mostrar el recorrido finca → beneficio → tueste → bolsa en tienda. Hook: 'Pocas marcas en Colombia pueden mostrarte esto.' Mezclar tomas nuevas de finca con B-roll existente de tueste/tienda. Cierre con bolsa en mano señalando el origen.",
    gear: GEAR.reelNarrativo,
    checklist: ["Shot list del recorrido (finca→beneficio→tueste→bolsa)", "Tomas nuevas en finca", "Rescatar B-roll de tueste/tienda", "Cierre: bolsa en mano señalando origen"],
    refs: [
      { label: "TikTok · farm to cup coffee", url: "https://www.tiktok.com/search?q=farm%20to%20cup%20coffee%20process" },
      { label: "Pinterest · coffee process film", url: "https://www.pinterest.com/search/pins/?q=coffee%20processing%20farm%20documentary%20photography" },
    ],
    notion: "https://app.notion.com/3cfdcde6938f81c7a4f0e5788348572b",
  },
  {
    id: "f-0918", fotos: ["assets/ref/amorperfecto.jpg", "assets/ref/taza.jpg"], concepto: "La bebida del mes preparada al ritmo de un audio en tendencia: ligero, compartible y con el producto como cierre.", marca: "forestal", fecha: "2026-09-18",
    titulo: "Bebida del mes con audio en tendencia",
    formato: "Reel", mensaje: "Temporada/Bebida del mes", tono: "Trend/Humor",
    estado: "Por grabar", reencauche: false, sesion: "s1",
    copy: "SESIÓN 1 (tienda). Preparación de la bebida del mes montada sobre un audio/trend vigente esa semana (elegir el trend al momento de editar, no antes). Planos rápidos, cortes al beat. A7V + Ulanzi para el plano final de producto. Formato ligero y compartible.",
    gear: GEAR.reelASMR,
    checklist: ["Definir bebida del mes", "8-10 planos rápidos de preparación", "Elegir trend/audio LA SEMANA de publicar", "Cortes al beat + plano final de producto"],
    refs: [
      { label: "TikTok · seasonal drink recipe cafe", url: "https://www.tiktok.com/search?q=seasonal%20drink%20cafe%20recipe" },
    ],
    notion: "https://app.notion.com/3cfdcde6938f8105b8bdf33875bcacd3",
  },
  {
    id: "f-0921", fotos: ["assets/ref/granos.jpg", "assets/ref/costal.jpg"], concepto: "Serie de fotos macro del grano crudo y tostado de los 3 orígenes: pura textura y belleza.", marca: "forestal", fecha: "2026-09-21",
    titulo: "Macro: el grano como nunca lo has visto",
    formato: "Foto", mensaje: "3 orígenes", tono: "Sensorial",
    estado: "Idea", reencauche: false, sesion: "s1",
    copy: "Serie de fotos macro de granos de los 3 orígenes (crudo vs tostado). A7V + luz Ulanzi 40W rasante para textura. Se puede grabar en la SESIÓN 1 en 20 min como bonus. Estética Tropicalia/Solo Café: fondo limpio, composición mínima. Caption: diferencias visuales entre orígenes.",
    gear: GEAR.foto,
    checklist: ["Granos crudo + tostado de los 3 orígenes", "Luz rasante Ulanzi para textura", "Fondo limpio, composición mínima", "Caption: diferencias entre orígenes"],
    refs: [
      { label: "Pinterest · coffee beans macro", url: "https://www.pinterest.com/search/pins/?q=coffee%20beans%20macro%20photography%20texture" },
    ],
    notion: "https://app.notion.com/3cfdcde6938f8100be82c57a893a27f1",
  },
  {
    id: "f-0923", fotos: ["assets/ref/finca.jpg", "assets/ref/libertario.jpg"], concepto: "Video contemplativo del cultivo: manos en la tierra, plantas y cerezas, sobre el cuidado de un café sin químicos.", marca: "forestal", fecha: "2026-09-23",
    titulo: "Del suelo a la taza: por qué lo orgánico se siente",
    formato: "Reel", mensaje: "Orgánico", tono: "Emocional",
    estado: "Por grabar", reencauche: true, sesion: "s2",
    copy: "MIXTO: B-roll nuevo de SESIÓN 2 (manos en tierra, plantas, cerezas) + reencauche de material de archivo. Voz en off o texto en pantalla sobre el cuidado del suelo y el cultivo sin químicos. Sonido ambiente de finca capturado con Hollyland. Tono contemplativo, ritmo lento.",
    gear: GEAR.reelNarrativo,
    checklist: ["B-roll en finca: manos en tierra, plantas, cerezas", "Sonido ambiente con Hollyland", "Voz en off o texto en pantalla", "Montaje contemplativo, ritmo lento"],
    refs: [
      { label: "Pinterest · organic farming cinematic", url: "https://www.pinterest.com/search/pins/?q=organic%20farming%20hands%20soil%20cinematic" },
    ],
    notion: "https://app.notion.com/3cfdcde6938f81f2804edd780dbeddac",
  },
  {
    id: "f-0925", fotos: ["assets/ref/lacabra.jpg", "assets/ref/verve.jpg"], concepto: "Carrusel para guardar: 3 métodos de preparación que puedes pedir en tienda y con cuál origen brilla cada uno.", marca: "forestal", fecha: "2026-09-25",
    titulo: "3 métodos que puedes pedir en tienda (y cuál va contigo)",
    formato: "Carrusel", mensaje: "Experiencia en tienda", tono: "Dato curioso",
    estado: "Idea", reencauche: false, sesion: "s1",
    copy: "Carrusel educativo: 3 métodos de preparación disponibles en tienda, qué resalta cada uno y con cuál origen brilla. Fotos de SESIÓN 1 (métodos en barra, A7V + Ulanzi). Piezas en Lato + colores de marca. CTA: 'guárdalo para tu próxima visita'.",
    gear: GEAR.foto,
    checklist: ["Foto de cada método en barra (3)", "Texto: qué resalta cada método", "Diseño de slides en Lato", "CTA: guárdalo para tu próxima visita"],
    refs: [
      { label: "Pinterest · brew methods guide", url: "https://www.pinterest.com/search/pins/?q=coffee%20brewing%20methods%20guide%20design" },
    ],
    notion: "https://app.notion.com/3cfdcde6938f817f8c2ef86a936a935b",
  },
  {
    id: "f-0928", fotos: ["assets/ref/morgan.jpg", "assets/ref/verve.jpg"], concepto: "Secuencia emotiva de los rostros y manos que hacen posible Forestal. 'Detrás de cada taza hay nombres.'", marca: "forestal", fecha: "2026-09-28",
    titulo: "Retrato: el equipo que hace posible Forestal",
    formato: "Reel", mensaje: "La gente", tono: "Emocional",
    estado: "Idea", reencauche: true, sesion: "ed",
    copy: "REENCAUCHE + retratos nuevos de las sesiones: secuencia de rostros y manos (caficultores, tostador, baristas) en cámara lenta con música emotiva. Texto en pantalla: 'Detrás de cada taza hay nombres.' Cierra el mes reforzando el diferencial humano de la marca.",
    gear: GEAR.edicion,
    checklist: ["Reunir retratos de S1 y S2 + archivo", "Secuencia en cámara lenta", "Texto: 'Detrás de cada taza hay nombres'", "Música emotiva + color"],
    refs: [
      { label: "Pinterest · team portrait slow motion", url: "https://www.pinterest.com/search/pins/?q=artisan%20team%20portrait%20film%20photography" },
    ],
    notion: "https://app.notion.com/3cfdcde6938f810f90e1c376c27d0e17",
  },
  {
    id: "f-0930", fotos: ["assets/ref/finca.jpg", "assets/ref/costal.jpg"], concepto: "El caficultor cuenta en sus propias palabras qué hace especial este lote. La voz real del origen.", marca: "forestal", fecha: "2026-09-30",
    titulo: "El caficultor cuenta: qué hace especial este lote",
    formato: "Reel", mensaje: "Finca propia", tono: "Testimonial",
    estado: "Por grabar", reencauche: false, sesion: "s2",
    copy: "SESIÓN 2 (finca). Testimonio de un caficultor o encargado de finca contando en sus palabras qué hace especial el lote actual. Hollyland lavalier para audio limpio en exterior, A7V con fondo de cultivo. La pieza más 'Pergamino' del mes: la voz real del origen. 40-50 seg.",
    gear: GEAR.reelEntrevista,
    checklist: ["Confirmar caficultor y pregunta guía", "Lavalier en exterior + prueba de viento", "Fondo de cultivo, hora dorada si se puede", "Corte a 40-50 seg con B-roll"],
    refs: [
      { label: "TikTok · coffee farmer interview", url: "https://www.tiktok.com/search?q=coffee%20farmer%20interview%20colombia" },
    ],
    notion: "https://app.notion.com/3cfdcde6938f81329b07cba7b1da4a87",
  },

  // ══════════════ CARNES MANZANARES ══════════════
  {
    id: "m-0904", fotos: ["assets/bg-manzanares.jpg", "assets/ref/tabla.jpg"], concepto: "Video emotivo que abre el mes con nuestra historia: 'una buena carne cuenta una historia'. La trazabilidad como bandera.", marca: "manzanares", fecha: "2026-09-04",
    titulo: "Una buena carne cuenta una historia",
    formato: "Reel", mensaje: "Del campo a la mesa", tono: "Emocional",
    estado: "Idea", reencauche: true, sesion: "ed",
    copy: "REENCAUCHE de las tomas de 'Nuestros orígenes'. Remontar en versión reel corto con la línea de la vocera: 'En Carnes Manzanares sabemos que una buena carne cuenta una historia.' Abre el mes plantando la narrativa de trazabilidad. Sin grabación nueva.",
    gear: GEAR.edicion,
    checklist: ["Rescatar tomas de 'Nuestros orígenes'", "Montar versión reel corta", "Línea de la vocera como apertura", "Exportar 9:16 con subtítulos"],
    refs: [
      { label: "Pinterest · ranch cinematic film", url: "https://www.pinterest.com/search/pins/?q=cattle%20ranch%20cinematic%20film%20photography" },
    ],
    notion: "https://app.notion.com/3d0dcde6938f8165b0b4de97e0b7818c",
  },
  {
    id: "m-0907", fotos: ["assets/ref/victorchurchill.jpg", "assets/ref/meatthebutchers.jpg"], concepto: "Carrusel para guardar: qué corte pedir según lo que vas a cocinar — parrilla, horno o guiso — con foto de cada corte.", marca: "manzanares", fecha: "2026-09-07",
    titulo: "Guía rápida: qué corte pedir según lo que vas a cocinar",
    formato: "Carrusel", mensaje: "Cortes y productos", tono: "Educativo",
    estado: "Idea", reencauche: false, sesion: "s1",
    copy: "Carrusel guía de cortes: cuál para parrilla, cuál para horno, cuál para guiso — con foto de cada corte (A7V + Ulanzi 40W lateral, fondo oscuro tipo carnicería premium). CTA: 'guárdalo para tu próxima compra'. Contenido guardable = alcance.",
    gear: GEAR.foto,
    checklist: ["Foto por corte: parrilla, horno, guiso", "Fondo oscuro premium + Ulanzi lateral", "Diseño de slides con guía", "CTA: guárdalo para tu próxima compra"],
    refs: [
      { label: "Pinterest · meat cuts photography dark", url: "https://www.pinterest.com/search/pins/?q=premium%20meat%20cuts%20photography%20dark%20background" },
      { label: "Pinterest · butcher guide carousel", url: "https://www.pinterest.com/search/pins/?q=meat%20cuts%20guide%20instagram%20design" },
    ],
    notion: "https://app.notion.com/3d0dcde6938f81c7a2f4d992ebc516e8",
  },
  {
    id: "m-0909", fotos: ["assets/ref/flannerybeef.jpg", "assets/ref/victorchurchill.jpg"], concepto: "Video con gancho 'La carne buena no se apura': qué es la maduración y por qué nuestra carne sabe mejor.", marca: "manzanares", fecha: "2026-09-09",
    titulo: "La carne buena no se apura: qué es la maduración",
    formato: "Reel", mensaje: "Calidad y maduración", tono: "Dato curioso",
    estado: "Por grabar", reencauche: false, sesion: "s1",
    copy: "SESIÓN 1 (punto de venta/producto). Reel: ¿qué es la maduración y por qué la carne madurada sabe mejor? Mostrar el empacado al vacío como sello de calidad. Hook: 'La carne buena no se apura.' A7V planos cerrados de producto, texto en pantalla con los datos.",
    gear: GEAR.reelASMR,
    checklist: ["Planos cerrados de producto y empacado al vacío", "Datos de maduración para texto en pantalla", "Hook: 'La carne buena no se apura'", "Montaje con textos claros"],
    refs: [
      { label: "TikTok · dry aged beef process", url: "https://www.tiktok.com/search?q=dry%20aged%20beef%20explained" },
    ],
    notion: "https://app.notion.com/3d0dcde6938f810ba869cfc909ce16f9",
  },
  {
    id: "m-0911", fotos: ["assets/ref/maxthemeatguy.jpg", "assets/ref/ribs.jpg"], concepto: "Video sensorial del corte en la parrilla: el chisporroteo, los jugos, el corte final. 'Sube el volumen 🔥'.", marca: "manzanares", fecha: "2026-09-11",
    titulo: "ASMR: así suena un corte Manzanares en la parrilla",
    formato: "Reel", mensaje: "Recetas", tono: "Sensorial",
    estado: "Por grabar", reencauche: false, sesion: "s1",
    copy: "SESIÓN 1. Reel ASMR de cocina: corte a la parrilla — sellado, jugos, corte final. Sonido directo con Hollyland pegado a la parrilla (el chisporroteo es el hook). A7V 60fps para slow motion del corte. Copy: 'Sube el volumen y no digas que no te antojamos 🔥'",
    gear: GEAR.reelASMR,
    checklist: ["Parrilla lista + corte estrella", "Mic Hollyland cerca del chisporroteo", "60fps: sellado, jugos, corte final", "Montaje solo sonido directo"],
    refs: [
      { label: "TikTok · steak ASMR grill", url: "https://www.tiktok.com/search?q=steak%20asmr%20grill%20sizzle" },
      { label: "Pinterest · steak cinematic food", url: "https://www.pinterest.com/search/pins/?q=steak%20grill%20cinematic%20food%20photography" },
    ],
    notion: "https://app.notion.com/3d0dcde6938f81aeabd8e1400d2c3fe9",
  },
  {
    id: "m-0914", fotos: ["assets/ref/beardedbutchers.jpg", "assets/ref/victorchurchill.jpg"], concepto: "Mini-entrevista al carnicero con más trayectoria: cómo se reconoce una buena carne. La autoridad de la casa hablando en persona.", marca: "manzanares", fecha: "2026-09-14",
    titulo: "El experto: cómo reconocer una buena carne",
    formato: "Reel", mensaje: "La gente", tono: "Testimonial",
    estado: "Por grabar", reencauche: false, sesion: "s1",
    copy: "SESIÓN 1. Mini-entrevista al carnicero/despostador con más trayectoria: '¿cómo se reconoce una buena carne?' Hollyland lavalier, A7V con luz Ulanzi como key. Sus manos trabajando como B-roll. La autoridad de la marca hablando en persona. 30-40 seg.",
    gear: GEAR.reelEntrevista,
    checklist: ["Confirmar carnicero y pregunta guía", "Lavalier + prueba de audio", "Entrevista corta (se corta a 40s)", "B-roll de manos trabajando"],
    refs: [
      { label: "TikTok · butcher explains meat", url: "https://www.tiktok.com/search?q=butcher%20explains%20quality%20meat" },
    ],
    notion: "https://app.notion.com/3d0dcde6938f81f9999fdd72a9a99f55",
  },
  {
    id: "m-0916", fotos: ["assets/bg-manzanares.jpg", "assets/ref/meatthebutchers.jpg"], concepto: "El video estrella del mes: el camino completo de tu carne — campo, selección, maduración y mostrador.", marca: "manzanares", fecha: "2026-09-16",
    titulo: "Trazabilidad real: el camino de tu carne en 30 segundos",
    formato: "Reel", mensaje: "Del campo a la mesa", tono: "Educativo",
    estado: "Por grabar", reencauche: false, sesion: "s2",
    copy: "SESIÓN 2 (campo/planta). El reel de posicionamiento del mes: el recorrido campo → selección → maduración → empacado → mostrador. Hook: 'Pocas marcas en Santander pueden mostrarte todo el camino de su carne.' Mezclar tomas nuevas con B-roll de 'Nuestros orígenes'.",
    gear: GEAR.reelNarrativo,
    checklist: ["Shot list: campo→selección→maduración→empacado→mostrador", "Tomas nuevas en campo/planta", "Rescatar B-roll de 'Nuestros orígenes'", "Hook de apertura + cierre en mostrador"],
    refs: [
      { label: "TikTok · farm to table beef", url: "https://www.tiktok.com/search?q=farm%20to%20table%20beef%20process" },
    ],
    notion: "https://app.notion.com/3d0dcde6938f81d4904acf661de736a3",
  },
  {
    id: "m-0918", fotos: ["assets/ref/ribs.jpg", "assets/ref/tabla.jpg"], concepto: "Receta santandereana con nuestra carne al ritmo de un audio en tendencia: tradición y antojo en un solo video.", marca: "manzanares", fecha: "2026-09-18",
    titulo: "Receta santandereana con trend del momento",
    formato: "Reel", mensaje: "Tradición santandereana", tono: "Trend/Humor",
    estado: "Por grabar", reencauche: false, sesion: "s1",
    copy: "SESIÓN 1. Receta santandereana con carne Manzanares montada sobre audio/trend vigente (elegir al editar). Planos rápidos al beat, plato final apetitoso con Ulanzi. Conecta tradición regional + producto. Formato ligero y compartible.",
    gear: GEAR.reelASMR,
    checklist: ["Definir receta santandereana", "8-10 planos rápidos de preparación", "Elegir trend/audio LA SEMANA de publicar", "Plato final con Ulanzi"],
    refs: [
      { label: "TikTok · receta colombiana carne", url: "https://www.tiktok.com/search?q=receta%20santandereana%20carne" },
    ],
    notion: "https://app.notion.com/3d0dcde6938f817f8a9dc829a69d6701",
  },
  {
    id: "m-0921", fotos: ["assets/ref/victorchurchill.jpg", "assets/ref/flannerybeef.jpg"], concepto: "Serie de fotos macro del marmoleo de nuestros cortes premium: la calidad que se ve a simple vista.", marca: "manzanares", fecha: "2026-09-21",
    titulo: "Macro: el marmoleo que diferencia una carne premium",
    formato: "Foto", mensaje: "Cortes y productos", tono: "Sensorial",
    estado: "Idea", reencauche: false, sesion: "s1",
    copy: "Serie de fotos macro: marmoleo, textura y color de los cortes premium. A7V + Ulanzi 40W rasante para relieve. Bonus de 20 min en SESIÓN 1. Estética premium editorial. Caption educativo: qué dice el marmoleo de la calidad.",
    gear: GEAR.foto,
    checklist: ["Cortes premium seleccionados", "Luz rasante para relieve del marmoleo", "Fondo editorial limpio/oscuro", "Caption: qué dice el marmoleo"],
    refs: [
      { label: "Pinterest · marbling macro beef", url: "https://www.pinterest.com/search/pins/?q=beef%20marbling%20macro%20photography" },
    ],
    notion: "https://app.notion.com/3d0dcde6938f810ea608fa8c708b0590",
  },
  {
    id: "m-0923", fotos: ["assets/ref/beardedbutchers.jpg", "assets/bg-manzanares.jpg"], concepto: "Video contemplativo sobre el estándar de selección: no toda carne llega a ser Manzanares.", marca: "manzanares", fecha: "2026-09-23",
    titulo: "No toda carne llega a ser Manzanares",
    formato: "Reel", mensaje: "Calidad y maduración", tono: "Emocional",
    estado: "Por grabar", reencauche: true, sesion: "s2",
    copy: "MIXTO: B-roll nuevo de SESIÓN 2 (campo, ganado, manos que seleccionan) + reencauche de 'Nuestros orígenes'. Voz en off o texto sobre el estándar de selección: no toda carne llega al mostrador Manzanares. Tono contemplativo, sonido ambiente Hollyland.",
    gear: GEAR.reelNarrativo,
    checklist: ["B-roll: campo, ganado, manos seleccionando", "Sonido ambiente con Hollyland", "Voz en off / texto: el estándar", "Montaje contemplativo"],
    refs: [
      { label: "Pinterest · cattle field documentary", url: "https://www.pinterest.com/search/pins/?q=cattle%20field%20documentary%20photography" },
    ],
    notion: "https://app.notion.com/3d0dcde6938f811bb1fbcaadfd250233",
  },
  {
    id: "m-0925", fotos: ["assets/ref/maxthemeatguy.jpg", "assets/ref/tabla.jpg"], concepto: "Carrusel para compartir: 3 errores que están arruinando tu carne y cómo evitarlos.", marca: "manzanares", fecha: "2026-09-25",
    titulo: "3 errores que están arruinando tu carne",
    formato: "Carrusel", mensaje: "Recetas", tono: "Dato curioso",
    estado: "Idea", reencauche: false, sesion: "s1",
    copy: "Carrusel: 3 errores comunes al preparar carne (sacarla fría de la nevera, pincharla, no dejarla reposar) y cómo evitarlos. Fotos de SESIÓN 1. Contenido guardable y compartible que posiciona a la marca como autoridad. CTA: 'compártelo con el parrillero de la casa'.",
    gear: GEAR.grafica,
    checklist: ["Redactar los 3 errores + solución", "Fotos de apoyo de S1", "Diseño de slides", "CTA: compártelo con el parrillero"],
    refs: [
      { label: "Pinterest · cooking tips carousel", url: "https://www.pinterest.com/search/pins/?q=cooking%20tips%20instagram%20carousel%20design" },
    ],
    notion: "https://app.notion.com/3d0dcde6938f813cacc6e576e2e321fb",
  },
  {
    id: "m-0928", fotos: ["assets/ref/meatthebutchers.jpg", "assets/ref/beardedbutchers.jpg"], concepto: "Secuencia emotiva del equipo — campo, planta y mostrador. Décadas siendo el referente de carnes en Santander.", marca: "manzanares", fecha: "2026-09-28",
    titulo: "Retrato: la gente detrás del referente",
    formato: "Reel", mensaje: "La gente", tono: "Emocional",
    estado: "Idea", reencauche: true, sesion: "ed",
    copy: "REENCAUCHE + retratos nuevos: secuencia de rostros y manos del equipo (campo, planta, mostrador) en cámara lenta. Texto: 'Décadas siendo el referente de carnes en Santander. Esta es la gente que lo hace posible.' Refuerza herencia + presente.",
    gear: GEAR.edicion,
    checklist: ["Reunir retratos de S1 y S2 + archivo", "Secuencia en cámara lenta", "Texto: 'Décadas siendo el referente…'", "Música + color"],
    refs: [
      { label: "Pinterest · artisan portraits film", url: "https://www.pinterest.com/search/pins/?q=butcher%20portrait%20editorial%20photography" },
    ],
    notion: "https://app.notion.com/3d0dcde6938f81d499cfc83f60bc0b4c",
  },
  {
    id: "m-0930", fotos: ["assets/bg-manzanares.jpg", "assets/ref/tabla.jpg"], concepto: "El ganadero cuenta qué se exige para que una res cumpla el estándar Manzanares. La voz real del origen cierra el mes.", marca: "manzanares", fecha: "2026-09-30",
    titulo: "El ganadero cuenta: el estándar Manzanares",
    formato: "Reel", mensaje: "Del campo a la mesa", tono: "Testimonial",
    estado: "Por grabar", reencauche: false, sesion: "s2",
    copy: "SESIÓN 2 (campo). Testimonio del ganadero o encargado de selección contando en sus palabras qué se exige para que una res cumpla el estándar Manzanares. Hollyland lavalier en exterior, A7V con fondo de campo. La voz real del origen cierra el mes. 40-50 seg.",
    gear: GEAR.reelEntrevista,
    checklist: ["Confirmar ganadero y pregunta guía", "Lavalier exterior + protección de viento", "Fondo de campo, hora dorada si se puede", "Corte a 40-50 seg con B-roll"],
    refs: [
      { label: "TikTok · rancher interview", url: "https://www.tiktok.com/search?q=ganadero%20entrevista%20campo" },
    ],
    notion: "https://app.notion.com/3d0dcde6938f8116ab01e5e2dc319bf6",
  },
];

// Cuentas referentes (se enriquecen con la investigación — ver referentes.js)
const SESIONES = {
  s1: {
    nombre: "Sesión 1 · Tienda / Punto de venta",
    desc: "Un solo día de rodaje en tienda (Forestal) y punto de venta (Manzanares). Salen entrevistas, ASMR, fotos de producto, macro y trends. Programar en la primera semana del mes.",
  },
  s2: {
    nombre: "Sesión 2 · Finca / Campo",
    desc: "Un día de rodaje en finca cafetera y campo/planta ganadera. Salen los reels de trazabilidad, testimoniales del origen y B-roll contemplativo. Programar a mitad de mes.",
  },
  ed: {
    nombre: "Solo edición / diseño",
    desc: "Piezas que no requieren grabación nueva: reencauches del archivo y piezas gráficas. Son la red de seguridad del calendario — se pueden hacer cualquier noche.",
  },
};
