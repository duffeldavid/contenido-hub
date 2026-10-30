// ============================================================
// CONTENIDO HUB — Datos del mes
// Para renovar el mes: abre esta carpeta en Claude Code y pide
// "renueva el mes de contenidos" (skill: renovar-mes).
// Fuente original: calendarios de Notion (Forestal / Manzanares).
// ============================================================

const MES = {
  titulo: "Octubre – Noviembre 2026",
  clave: "2026-11",
  // El periodo arranca antes del 1.º: lo que queda de octubre + noviembre completo
  desde: "2026-10-23",
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
    id: "f-1023", fotos: ["assets/bg-forestal.jpg", "assets/ref/taza.jpg"], concepto: "Carrusel corto y claro para el fin de semana: cómo pedir Forestal desde nuestra web en 3 pasos — elige tu origen, haz tu pedido y recíbelo donde estés.", marca: "forestal", fecha: "2026-10-23",
    titulo: "Tu café de origen, a un clic: así pides Forestal en la web",
    formato: "Carrusel", mensaje: "Experiencia en tienda", tono: "Educativo",
    estado: "Idea", reencauche: false, sesion: "ed",
    copy: "SOLO DISEÑO (sale hoy). Carrusel de 4 slides: portada 'Tu café de origen, a un clic' + 3 pasos (elige tu origen → haz tu pedido → recíbelo donde estés) con capturas reales de la web + cierre con el link en bio. Fotos de producto del archivo y de la campaña 'Desde donde estés'. Lato + colores de marca. Confirmar con mercadeo cobertura y tiempos de entrega antes de publicar.",
    gear: GEAR.grafica,
    checklist: ["Capturas de la web: origen, carrito y pago", "Portada + 3 pasos + cierre en Lato", "Confirmar cobertura y tiempos de entrega", "CTA: link en bio"],
    refs: [
      { label: "Pinterest · coffee website launch carousel", url: "https://www.pinterest.com/search/pins/?q=coffee%20brand%20website%20launch%20instagram%20carousel" },
      { label: "Pinterest · how to order carousel", url: "https://www.pinterest.com/search/pins/?q=minimal%20ecommerce%20how%20to%20order%20instagram%20carousel" },
    ],
    notion: "https://app.notion.com/402dcde6938f817da3fec816d5f3e6c2",
  },
  {
    id: "f-1026", fotos: ["assets/ref/morgan.jpg", "assets/ref/amorperfecto.jpg"], concepto: "Las voces de los clientes que vinieron a nuestra cata en La Quinta: qué descubrieron al probar el café de especialidad de cerca.", marca: "forestal", fecha: "2026-10-26",
    titulo: "Lo que se dijo en nuestra cata",
    formato: "Reel", mensaje: "La gente", tono: "Testimonial",
    estado: "Idea", reencauche: true, sesion: "ed",
    copy: "REENCAUCHE del material de la cata en @laquintacc (publicada el 9 de octubre). Rescatar reacciones y frases cortas de los asistentes (3-4 voces de 5-8 s) y montarlas como testimonio. Si el audio no sirve, texto en pantalla con sus frases. Hook: '¿Qué pasa cuando pruebas un café de especialidad por primera vez?' Sin grabación nueva.",
    gear: GEAR.edicion,
    checklist: ["Revisar el material completo de la cata", "Elegir 3-4 frases con buen audio", "Montaje con subtítulos y música suave", "Cierre: invitación a visitar la tienda"],
    refs: [
      { label: "TikTok · coffee cupping reaction", url: "https://www.tiktok.com/search?q=coffee%20cupping%20first%20time%20reaction" },
      { label: "Pinterest · coffee tasting event", url: "https://www.pinterest.com/search/pins/?q=coffee%20tasting%20event%20photography" },
    ],
    notion: "https://app.notion.com/402dcde6938f81b8b063ed04333130b5",
  },
  {
    id: "f-1028", fotos: ["assets/ref/finca.jpg", "assets/ref/granos.jpg"], concepto: "Pieza gráfica con un dato que sorprende: en un cultivo orgánico no hay atajos químicos — el cuidado es a mano y eso se nota en la taza.", marca: "forestal", fecha: "2026-10-28",
    titulo: "¿Sabías que un café orgánico se cuida a mano, planta por planta?",
    formato: "Pieza gráfica", mensaje: "Orgánico", tono: "Dato curioso",
    estado: "Idea", reencauche: false, sesion: "ed",
    copy: "SOLO DISEÑO. Pieza tipográfica '¿Sabías que…?' sobre lo que implica un cultivo orgánico (control de maleza a mano, abono natural, sin pesticidas de síntesis). Validar el dato exacto con el equipo de finca antes de diseñar. Foto de fondo del archivo (manos, cultivo). Lato + colores de marca. Caption que lo conecta con nuestras fincas.",
    gear: GEAR.grafica,
    checklist: ["Validar el dato con el equipo de finca", "Foto de fondo del archivo", "Diseño '¿Sabías que…?' en Lato", "Caption que conecta con la finca"],
    refs: [
      { label: "Pinterest · did you know typographic post", url: "https://www.pinterest.com/search/pins/?q=did%20you%20know%20minimal%20typographic%20instagram%20post%20coffee" },
    ],
    notion: "https://app.notion.com/402dcde6938f81e991c3f9364d4bbe44",
  },
  {
    id: "f-1030", fotos: ["assets/ref/amorperfecto.jpg", "assets/ref/taza.jpg"], concepto: "Un guiño de Halloween con humor y nuestro café de temporada: corto, ligero y para compartir antes del puente.", marca: "forestal", fecha: "2026-10-30",
    titulo: "Halloween: lo único que da miedo es un café sin origen",
    formato: "Reel", mensaje: "Temporada/Bebida del mes", tono: "Trend/Humor",
    estado: "Idea", reencauche: true, sesion: "ed",
    copy: "REENCAUCHE con humor para el puente de Halloween (31 oct). Clips de archivo de barra y del café de temporada (Alborada) sobre un audio en tendencia esa semana. Texto en pantalla: 'Lo único que da miedo es un café sin origen 👻'. Elegir el trend el mismo día de editar. Sin grabación nueva.",
    gear: GEAR.edicion,
    checklist: ["Elegir audio en tendencia esa semana", "Clips de archivo de barra y Alborada", "Texto en pantalla con el chiste", "Exportar 9:16 con subtítulos"],
    refs: [
      { label: "TikTok · halloween coffee shop trend", url: "https://www.tiktok.com/search?q=halloween%20coffee%20shop%20trend" },
      { label: "Pinterest · halloween coffee minimal", url: "https://www.pinterest.com/search/pins/?q=halloween%20coffee%20minimal%20aesthetic" },
    ],
    notion: "https://app.notion.com/402dcde6938f8103b6ace9c9a62398e9",
  },
  // ── Parrilla 2–15 de noviembre (organizada el 30/10/2026) ──
  // Cada pieza trae el brief completo para mercadeo: pilar, objetivo, hora,
  // caption listo para publicar, CTA y fotos en orden (secuencia). Las
  // historias de apoyo de cada día viven en HISTORIAS_FECHA, al final.
  {
    id: "f-1102", fotos: ["assets/forestal-nov/duf01147.jpg", "assets/forestal-nov/duf01136.jpg"], concepto: "Carrusel de 6 fotos reales de la cosecha en nuestra Finca Orgánica San Sebastián: el cafetal bajo sombra, la cereza en la rama y las manos que la recogen una por una. Sale el festivo a propósito: mientras todos descansan, en la finca la cosecha sigue.", marca: "forestal", fecha: "2026-11-02",
    titulo: "La cosecha no tiene festivo",
    formato: "Carrusel", mensaje: "Finca propia", tono: "Emocional",
    estado: "En edición", reencauche: false, sesion: "ed",
    pilar: "Origen y lado humano", hora: "10:00",
    objetivo: "Abrir noviembre mostrando que estamos en plena cosecha y que el café sale de nuestra propia finca orgánica. Medimos guardados y compartidos: son las señales que más alcance orgánico le dan a un carrusel.",
    porque: "El lunes 2 es festivo y la pieza se mantiene ese día, a las 10:00 a. m. Si la pasamos al martes quedarían dos carruseles de la misma finca en días seguidos (martes y miércoles) y se quitarían alcance entre ellos. El festivo funciona como un domingo: la gente desayuna sin afán y desliza con calma, que es justo lo que pide un carrusel. Y el mensaje solo tiene sentido ese día: la cosecha no para por el festivo. Sale programada desde el Hub, nadie tiene que trabajar el lunes.",
    caption: "Hoy es festivo, pero en la finca la cosecha no para. 🌿\n\nNoviembre nos encuentra en plena recolección en nuestra Finca Orgánica San Sebastián, en Aratoca, a 1.850 metros sobre el nivel del mar. Aquí la cereza se recoge a mano, una por una, y solo cuando está madura.\n\nDesliza y mira dónde empieza tu próxima taza. ☕\n\nGuárdalo y compártelo con esa persona que no arranca el día sin café.\n\n#CaféForestal #CaféDeOrigen #CaféOrgánico #Santander #CosechaDeCafé",
    cta: "Guardar y compartir el carrusel (las dos señales que más alcance orgánico le dan).",
    secuencia: [
      { img: "assets/forestal-nov/duf01147.jpg", archivo: "FOTOS VARIAS/Fincas/DUF01147.jpg", texto: "La cosecha no tiene festivo", nota: "Portada: el canasto lleno de cereza roja. El rojo y el amarillo detienen el scroll." },
      { img: "assets/forestal-nov/duf9015.jpg", archivo: "FOTOS VARIAS/DUF_9015.jpg", nota: "El cafetal bajo sombra de la Finca San Sebastián: ubica el lugar." },
      { img: "assets/forestal-nov/wa-cerezas.jpg", archivo: "FOTOS VARIAS/WhatsApp Image 2026-09-21 at 16.47.45.jpg", nota: "La rama con cerezas en distintos puntos de maduración: por qué se recoge a mano." },
      { img: "assets/forestal-nov/duf01136.jpg", archivo: "FOTOS VARIAS/Fincas/DUF01136.jpg", nota: "Las manos recogiendo solo la cereza roja." },
      { img: "assets/forestal-nov/duf8983.jpg", archivo: "FOTOS VARIAS/DUF_8983.jpg", nota: "El cafetal completo (horizontal recortada a 4:5): un respiro antes del cierre." },
      { img: "assets/forestal-nov/duf9007.jpg", archivo: "FOTOS VARIAS/DUF_9007.jpg", nota: "Cierre: la bolsa San Sebastián en su propia finca. De aquí sale tu café." },
    ],
    copy: "SOLO EDICIÓN (fotos ya editadas). Carrusel 4:5 (1080×1350) de 6 fotos en el orden de la secuencia. Solo la portada lleva texto: 'La cosecha no tiene festivo' en tipografía de marca; las demás van limpias. Exportar desde Lightroom a 1080×1350 y programar en el Hub con publicación automática (Instagram + Facebook) para el lunes 2 a las 10:00 a. m. La foto de WhatsApp (cerezas): confirmar que sea de la finca; si no, cambiarla por DUF_9013.",
    gear: GEAR.edicion,
    checklist: ["Exportar las 6 fotos a 1080×1350 en el orden de la secuencia", "Portada con el título en tipografía de marca", "Programar: lunes 2 · 10:00 a. m. · Instagram y Facebook", "Historias de lunes y martes listas"],
    refs: [
      { label: "Pinterest · coffee harvest carousel", url: "https://www.pinterest.com/search/pins/?q=coffee%20harvest%20instagram%20carousel" },
      { label: "Pinterest · coffee harvest documentary photography", url: "https://www.pinterest.com/search/pins/?q=coffee%20harvest%20documentary%20photography" },
    ],
    notion: "https://app.notion.com/402dcde6938f810f9588de83ac33e907",
  },
  {
    id: "f-1104", fotos: ["assets/forestal-nov/duf01190.jpg", "assets/forestal-nov/duf01186.jpg"], concepto: "Carrusel de retratos de los recolectores y caficultores de nuestra finca que termina en la barra de nuestras tiendas: el café que ellos recogen es el mismo que te servimos. Une el origen con la experiencia en tienda, el tema de los miércoles.", marca: "forestal", fecha: "2026-11-04",
    titulo: "Quienes cosechan tu café",
    formato: "Carrusel", mensaje: "La gente", tono: "Emocional",
    estado: "En edición", reencauche: false, sesion: "ed",
    pilar: "Tiendas y experiencia", hora: "18:30",
    objetivo: "Ponerle cara a la cosecha y unir el trabajo de la finca con la taza que se sirve en tienda. Buscamos compartidos y comentarios de orgullo santandereano, y que la gente asocie Forestal con personas reales.",
    porque: "La idea para el miércoles (caficultores y recolectores) es de origen, y el pilar del miércoles es Tiendas y experiencia. Para cumplir con los dos, el carrusel cierra en la barra: lo que ellos recogen es lo que servimos. Además deja un día de por medio entre los dos carruseles de finca.",
    caption: "Estas son las caras de la cosecha. 🌿\n\nMadrugan al cafetal, recogen la cereza madura una por una y cargan cada costal con la berraquera que solo tiene Santander. Sin su trabajo no habría Forestal.\n\nLo que recogen en la finca es lo mismo que te servimos en nuestras tiendas. La próxima vez que pidas tu café, acuérdate de estas caras. ☕\n\nComparte este post para que su trabajo llegue más lejos.\n\n#CaféForestal #CaféDeOrigen #Caficultores #Santander #CaféColombiano",
    cta: "Compartir el post y visitar nuestras tiendas.",
    secuencia: [
      { img: "assets/forestal-nov/duf01190.jpg", archivo: "FOTOS VARIAS/Fincas/DUF01190.jpg", texto: "Quienes cosechan tu café", nota: "Portada: los tres recolectores con su costal y su canasto, sonriendo." },
      { img: "assets/forestal-nov/duf01186.jpg", archivo: "FOTOS VARIAS/Fincas/DUF01186.jpg", nota: "Retrato: recolector con su costal al hombro." },
      { img: null, archivo: "Lexar › 01_CLIENTES/FORESTAL/03_Proyectos/FINCAS", nota: "Retrato de una recolectora en plena cosecha, de las fotos de finca ya editadas." },
      { img: null, archivo: "Lexar › 01_CLIENTES/FORESTAL/03_Proyectos/FINCAS", nota: "Caficultora con la cereza en la mano, plano medio." },
      { img: "assets/forestal-nov/dsc00035.jpg", archivo: "FOTOS VARIAS/DSC00035.jpg", nota: "El paso a la tienda: nuestra barista preparando tu café." },
      { img: "assets/forestal-nov/dsc00096.jpg", archivo: "FOTOS VARIAS/DSC00096.jpg", nota: "Cierre: la extracción en la taza. Lo que ellos recogen, aquí se sirve." },
    ],
    copy: "SOLO EDICIÓN. Carrusel 4:5 (1080×1350) de 6 fotos en el orden de la secuencia; solo la portada lleva texto. Las fotos 3 y 4 salen del Lexar (01_CLIENTES/FORESTAL/03_Proyectos/FINCAS o Fotos Varias): elegir los dos mejores retratos de mujeres ya editados. Confirmar con la finca los nombres de los recolectores y su permiso para nombrarlos o etiquetarlos; si autorizan, el nombre va en cada retrato. Si no aparecen fotos de mujeres editadas, el carrusel queda de 4 fotos (1, 2, 5 y 6) y el caption funciona igual.",
    gear: GEAR.edicion,
    checklist: ["Elegir 2 retratos de mujeres en el Lexar (ya editados)", "Confirmar nombres y permiso de los recolectores", "Exportar a 1080×1350 en el orden de la secuencia", "Programar: miércoles 4 · 6:30 p. m."],
    refs: [
      { label: "Pinterest · coffee farmers portrait", url: "https://www.pinterest.com/search/pins/?q=coffee%20farmers%20portrait%20photography" },
      { label: "Pinterest · farm to cup carousel", url: "https://www.pinterest.com/search/pins/?q=farm%20to%20cup%20coffee%20instagram%20carousel" },
    ],
    notion: "https://app.notion.com/402dcde6938f810dbf73eb56a4ec0bca",
  },
  {
    id: "f-1106", fotos: ["assets/forestal-nov/especialidad-1.jpg", "assets/forestal-nov/especialidad-2.jpg"], concepto: "El reel que ya está editado: en menos de un minuto explica qué hace que un café sea de especialidad — más de 80 puntos sobre 100, cosechado en su punto y con un origen que se puede rastrear hasta la finca.", marca: "forestal", fecha: "2026-11-06",
    titulo: "¿Qué es el café de especialidad?",
    formato: "Reel", mensaje: "3 orígenes", tono: "Educativo",
    estado: "Listo", reencauche: false, sesion: "ed",
    pilar: "Producto y lanzamientos", hora: "12:30",
    objetivo: "Explicar lo que nos diferencia y responder la pregunta que más se escucha en barra. Es la pieza de mayor alcance de la semana: medimos reproducciones, compartidos y guardados.",
    porque: "Va el viernes porque es el día en que más se mueven los reels de la cuenta. A las 12:30 p. m. agarra la pausa del almuerzo (el viernes en la noche la gente sale) y tiene la tarde y el fin de semana para seguir circulando. La semana lo prepara: lunes la cosecha, miércoles las personas y viernes qué hace especial al café que sale de ahí.",
    caption: "¿Qué hace que un café sea de especialidad? ☕\n\nNo es una moda ni un nombre bonito. Es un café que, evaluado por catadores, supera los 80 puntos sobre 100: sin defectos, cosechado en su punto y con un origen que se puede rastrear hasta la finca.\n\nPor eso cada bolsa Forestal te cuenta de qué finca viene, a qué altura se cultivó y a qué sabe. 🌿\n\nDale play y cuéntanos en los comentarios: ¿ya lo habías probado?\n\n#CaféForestal #CaféDeEspecialidad #CaféColombiano #Santander #Bucaramanga",
    cta: "Comentar si ya lo habían probado y guardar el reel.",
    secuencia: [
      { img: "assets/forestal-nov/especialidad-1.jpg", archivo: "02_Proyectos/Qué es café de especialidad/1.png", nota: "Portada sugerida: el gráfico «Café de especialidad =» o el cuadro más limpio del video, con el título." },
      { img: "assets/forestal-nov/especialidad-2.jpg", archivo: "02_Proyectos/Qué es café de especialidad/2.png", nota: "El dato clave del reel, +80 puntos. Se usa también en las historias del jueves." },
    ],
    copy: "YA EDITADO. Revisar que la portada se vea bien en el recorte 4:5 del perfil y que los subtítulos estén quemados. Programar en el Hub para el viernes 6 a las 12:30 p. m. (Instagram + Facebook; en Facebook como reel). Si el video menciona otro dato distinto a los +80 puntos, ajustar el caption antes de programar.",
    gear: GEAR.edicion,
    checklist: ["Revisar la portada en el recorte 4:5 del perfil", "Subtítulos quemados", "Programar: viernes 6 · 12:30 p. m.", "Historias de jueves y viernes listas"],
    refs: [
      { label: "TikTok · specialty coffee explained", url: "https://www.tiktok.com/search?q=specialty%20coffee%20explained" },
      { label: "Pinterest · coffee reel cover minimal", url: "https://www.pinterest.com/search/pins/?q=coffee%20reel%20cover%20minimal%20typography" },
    ],
    notion: "https://app.notion.com/402dcde6938f81f0b6b4fa48afc50e3a",
  },
  {
    id: "f-1109", fotos: ["assets/forestal-nov/duf8869.jpg", "assets/bg-tostadora.jpg"], concepto: "Conoce a quien tuesta nuestro café: en menos de un minuto nos cuenta qué mira, qué escucha y qué decide en esos minutos que definen el sabor de tu taza.", marca: "forestal", fecha: "2026-11-09",
    titulo: "Quien tuesta tu café",
    formato: "Reel", mensaje: "La gente", tono: "Testimonial",
    estado: "Por grabar", reencauche: false, sesion: "s1",
    pilar: "Origen y lado humano", hora: "18:30",
    objetivo: "Mostrar el lado humano del sabor: el café no solo viene de una finca, alguien lo tuesta con criterio. Genera confianza en la frescura y abre conversación con preguntas que respondemos en historias.",
    porque: "La semana anterior ya salió dos veces la finca, así que este lunes de Origen y lado humano pasa al siguiente eslabón, la tostión, y le pone cara. Se graba en la Sesión 1 de tienda, entre el martes 3 y el jueves 5.",
    caption: "Antes de llegar a tu taza, tu café pasa por estas manos. 🔥\n\nEn la tostadora todo se decide en minutos: el color del grano, el primer crack, el punto exacto en que hay que parar. Unos segundos de más y el sabor cambia.\n\n¿Qué le preguntarías a quien tuesta tu café? Déjalo en los comentarios y te respondemos en historias. ☕\n\n#CaféForestal #CaféDeEspecialidad #TostiónDeCafé #Santander #Bucaramanga",
    cta: "Dejar una pregunta para el tostador en los comentarios (se responde en historias el martes).",
    secuencia: [
      { img: "assets/forestal-nov/duf8869.jpg", archivo: "FOTOS VARIAS/DUF_8869.jpg", nota: "Referencia de portada: el cucharón de muestra con el grano en la tostadora. La portada final sale de un cuadro del video con el tostador." },
    ],
    copy: "SESIÓN 1 (tienda, martes 3 a jueves 5). Mini-entrevista al tostador durante un tueste: '¿qué decides en esos minutos?' (color, primer crack, punto). Hollyland lavalier: grabar la entrevista con la tostadora apagada y el B-roll aparte (el ruido de la máquina tapa la voz). A7V: manos, cucharón de muestra, granos girando, enfriado. Corte de 40-50 s con subtítulos. Preguntarle su nombre y si quiere salir etiquetado.",
    gear: GEAR.reelEntrevista,
    checklist: ["Coordinar el tueste en la Sesión 1 (mar 3 – jue 5)", "Entrevista con la tostadora apagada", "B-roll: cucharón de muestra, primer crack, enfriado", "Corte de 40-50 s · programar lunes 9 · 6:30 p. m."],
    refs: [
      { label: "TikTok · coffee roaster explains", url: "https://www.tiktok.com/search?q=coffee%20roaster%20explains%20roast" },
      { label: "Pinterest · coffee roasting cinematic", url: "https://www.pinterest.com/search/pins/?q=coffee%20roasting%20cinematic%20photography" },
    ],
    notion: "https://app.notion.com/402dcde6938f812abb1cd426da732ad3",
  },
  {
    id: "f-1111", fotos: ["assets/forestal-nov/dsc00123.jpg", "assets/ref/morgan.jpg"], concepto: "Un video con humor sobre los pedidos en barra — 'algo suavecito', 'un tinto bien cargado', 'lo de siempre' — y lo que el barista entiende. Muestra que en tienda te ayudamos a encontrar tu café aunque no sepas cómo pedirlo.", marca: "forestal", fecha: "2026-11-11",
    titulo: "Lo que pides vs. lo que de verdad quieres decir",
    formato: "Reel", mensaje: "Experiencia en tienda", tono: "Trend/Humor",
    estado: "Por grabar", reencauche: false, sesion: "s1",
    pilar: "Tiendas y experiencia", hora: "18:30",
    objetivo: "Alcance por compartidos y etiquetas: es la pieza liviana de las dos semanas. De paso deja claro que en tienda te orientamos aunque no sepas de café.",
    porque: "Las dos semanas vienen cargadas de piezas educativas y emotivas; este miércoles de tienda les da un respiro con humor, que es lo que más se comparte sin pauta. Evita repetir un formato de septiembre (el ASMR de barra ya salió).",
    caption: "Lo que pides vs. lo que de verdad quieres decir. 😅☕\n\n\"Algo suavecito\" → un filtrado de Santa María.\n\"Un tinto bien cargado\" → un espresso de San Sebastián.\n\"Lo de siempre\" → ya lo estamos preparando.\n\nEn nuestras tiendas te ayudamos a encontrar tu café, aunque no sepas cómo pedirlo.\n\nEtiqueta a quien siempre pide \"lo de siempre\". 👇\n\n#CaféForestal #CaféDeEspecialidad #Bucaramanga #Santander #Baristas",
    cta: "Etiquetar a un amigo en los comentarios y visitar la tienda.",
    secuencia: [
      { img: "assets/forestal-nov/dsc00123.jpg", archivo: "FOTOS VARIAS/DSC00123.jpg", nota: "Referencia de portada: el café frío en la mano. La portada final sale del video: el barista mirando a cámara con el texto del trend." },
    ],
    copy: "SESIÓN 1 (tienda). Trend tipo 'lo que dices vs. lo que significa': 3-4 pedidos típicos y la traducción del barista (los del caption). Planos rápidos en barra, cortes al beat sobre un audio en tendencia ESA semana (elegirlo al editar, el martes 10). Texto en pantalla grande y legible.",
    gear: GEAR.reelNarrativo,
    checklist: ["Grabar 3-4 pedidos y su traducción en la Sesión 1", "Elegir el audio en tendencia el martes 10", "Cortes al beat + texto en pantalla", "Programar: miércoles 11 · 6:30 p. m."],
    refs: [
      { label: "TikTok · what you order vs what it means", url: "https://www.tiktok.com/search?q=what%20you%20order%20vs%20what%20it%20means%20coffee" },
      { label: "TikTok · barista pov trend", url: "https://www.tiktok.com/search?q=barista%20pov%20trend" },
    ],
    notion: "https://app.notion.com/402dcde6938f811f9cc6d1c79f403855",
  },
  {
    id: "f-1113", fotos: ["assets/forestal-nov/duf9174.jpg", "assets/forestal-nov/duf00506.jpg"], concepto: "Carrusel muy sencillo de 5 láminas: cómo pedir Forestal en nuestra web, forestal.cafe — eliges tu café, lo agregas al carrito, pagas y te llega a donde estés. Sale el viernes de quincena, antes del puente.", marca: "forestal", fecha: "2026-11-13",
    titulo: "Tu café, desde donde estés: así lo pides en forestal.cafe",
    formato: "Carrusel", mensaje: "Experiencia en tienda", tono: "Educativo",
    estado: "Idea", reencauche: false, sesion: "ed",
    pilar: "Producto y lanzamientos", hora: "12:30",
    objetivo: "Llevar tráfico y pedidos a forestal.cafe mostrando que comprar es cuestión de cuatro pasos. Medimos toques al enlace de la bio, visitas a la web y pedidos del fin de semana.",
    porque: "Va el viernes 13 porque es el día de producto y cierra el arco de las dos semanas: el viernes 6 explicamos qué es el café de especialidad y este viernes, cómo pedirlo. Además es día de quincena (el 15 cae domingo y el 16 es festivo, así que el pago llega el viernes) y es la antesala del puente. Las tres piezas que definiste para la primera semana quedan intactas, y ocupa el lugar del carrusel «Cómo leer la bolsa», que pasa a reserva para no tener dos carruseles de producto el mismo día.",
    caption: "Tu café Forestal, desde donde estés. ☕\n\nPedirlo en nuestra web es así de fácil:\n1. Elige tu café: Santa María, San Sebastián o Santander Black, en grano o molido.\n2. Agrégalo al carrito.\n3. Paga en línea.\n4. Te llega a donde estés: enviamos a toda Colombia.\n\nEn la casa, en la oficina o en la finca, que no te falte. 🌿\n\nPide el tuyo en forestal.cafe (link en la bio).\n\n#CaféForestal #CaféDeEspecialidad #CaféColombiano #Santander #DesdeDondeEstés",
    cta: "Entrar a forestal.cafe desde el link de la bio y hacer el pedido.",
    secuencia: [
      { img: "assets/forestal-nov/duf9174.jpg", archivo: "FOTOS VARIAS/DUF_9174.jpg", texto: "Tu café, desde donde estés", nota: "Portada: las bolsas Forestal con las tazas." },
      { img: "assets/forestal-nov/duf00506.jpg", archivo: "FOTOS VARIAS/DUF00506.jpg", texto: "1. Elige tu café", nota: "Santa María, San Sebastián o Santander Black, en grano o molido." },
      { img: null, diseno: true, archivo: "Captura de forestal.cafe (ficha de producto)", texto: "2. Agrégalo al carrito", nota: "Captura real de la ficha del producto en la web, con el botón de agregar resaltado." },
      { img: null, diseno: true, archivo: "Captura de forestal.cafe (pago)", texto: "3. Paga en línea", nota: "Captura del paso de pago, sin datos personales." },
      { img: "assets/forestal-nov/duf01243.jpg", archivo: "FOTOS VARIAS/Fincas/DUF01243.jpg", texto: "4. Te llega a donde estés", nota: "Cierre: la bolsa en la mano, «Enviamos a toda Colombia» y forestal.cafe bien grande." },
    ],
    copy: "SOLO DISEÑO (30 min). Carrusel 4:5 (1080×1350) de 5 láminas con el lenguaje de la campaña «Desde donde estés»: foto + un texto corto en Lato Black (nada menor de 34 px a 1080). Láminas 3 y 4 con capturas reales de forestal.cafe tomadas en el celular, sin datos personales. Confirmar con mercadeo qué cafés hay en la web esa semana (si queda Alborada, sumarla en la lámina 2) y cobertura y tiempos de envío.",
    gear: GEAR.grafica,
    checklist: ["Confirmar cafés disponibles en la web y envíos", "Capturas de la web: ficha de producto y pago", "Diseñar las 5 láminas a 1080×1350", "Programar: viernes 13 · 12:30 p. m."],
    refs: [
      { label: "Pinterest · how to order carousel", url: "https://www.pinterest.com/search/pins/?q=minimal%20ecommerce%20how%20to%20order%20instagram%20carousel" },
      { label: "Pinterest · coffee website launch carousel", url: "https://www.pinterest.com/search/pins/?q=coffee%20brand%20website%20launch%20instagram%20carousel" },
    ],
    notion: "https://app.notion.com/402dcde6938f81cb982fe0df0f78c24f",
  },
  {
    id: "f-1116", fotos: ["assets/ref/finca.jpg", "assets/ref/tostadora.jpg"], concepto: "El video estrella del mes: lo que pasa con la cereza recién recogida — despulpado, fermentación y secado — en nuestra propia finca.", marca: "forestal", fecha: "2026-11-16",
    titulo: "48 horas después de la cosecha: así nace tu café",
    formato: "Reel", mensaje: "Finca propia", tono: "Educativo",
    estado: "Por grabar", reencauche: false, sesion: "s2",
    copy: "SESIÓN 2 (finca). El reel de posicionamiento del mes, en plena cosecha: recolección → despulpado → fermentación → secado → bolsa. Hook: 'Pocas marcas pueden mostrarte qué pasa con su café el día que se cosecha.' Tomas nuevas del beneficio + B-roll de tueste y tienda. Texto corto por etapa. 30-40 seg.",
    gear: GEAR.reelNarrativo,
    checklist: ["Shot list: recolección→despulpado→fermentación→secado", "Tomas nuevas del beneficio", "B-roll de tueste y bolsa en tienda", "Texto por etapa + cierre con la bolsa"],
    refs: [
      { label: "TikTok · coffee wet mill process", url: "https://www.tiktok.com/search?q=coffee%20processing%20wet%20mill" },
      { label: "Pinterest · coffee drying beds", url: "https://www.pinterest.com/search/pins/?q=coffee%20drying%20beds%20photography" },
    ],
    notion: "https://app.notion.com/402dcde6938f816cac0ed203d5ccee42",
  },
  {
    id: "f-1118", fotos: ["assets/ref/finca.jpg", "assets/ref/granos.jpg"], concepto: "Serie de fotos macro de la cosecha: cerezas maduras, hojas y gotas de rocío. La belleza de un cultivo cuidado sin químicos.", marca: "forestal", fecha: "2026-11-18",
    titulo: "Macro: la cereza madura, de cerca",
    formato: "Foto", mensaje: "Orgánico", tono: "Sensorial",
    estado: "Por grabar", reencauche: false, sesion: "s2",
    copy: "SESIÓN 2 (finca). Serie de 4-6 fotos macro: cerezas rojas en la rama, hoja con rocío, mano recogiendo, cereza abierta con el grano. A7V en RAW, f/2.8-f/4, luz natural de la mañana + Ulanzi de relleno. 20 min de la sesión. Caption: lo orgánico se ve.",
    gear: GEAR.foto,
    checklist: ["4-6 encuadres macro en la rama", "Luz de mañana + Ulanzi de relleno", "Cereza abierta mostrando el grano", "Caption: lo orgánico se ve"],
    refs: [
      { label: "Pinterest · coffee cherry macro", url: "https://www.pinterest.com/search/pins/?q=coffee%20cherry%20macro%20photography" },
    ],
    notion: "https://app.notion.com/402dcde6938f8124a5cadb0b3d0782b8",
  },
  {
    id: "f-1120", fotos: ["assets/ref/lacabra.jpg", "assets/ref/onyx.jpg"], concepto: "Los tres orígenes preparados igual y servidos lado a lado: el color, el aroma y lo que cambia en cada taza.", marca: "forestal", fecha: "2026-11-20",
    titulo: "3 orígenes, 3 tazas: míralos lado a lado",
    formato: "Reel", mensaje: "3 orígenes", tono: "Sensorial",
    estado: "Por grabar", reencauche: false, sesion: "s1",
    copy: "SESIÓN 1 (tienda). Misma receta y método para los 3 orígenes, servidos lado a lado: cenitales del color, vapor a contraluz con Ulanzi, sorbo final. Texto en pantalla con 2 notas por origen. Sin voz: música suave + sonido directo del servicio. Cierre: '¿Cuál es el tuyo?' para comentarios.",
    gear: GEAR.reelASMR,
    checklist: ["3 tazas con la misma receta", "Cenital del color + vapor a contraluz", "2 notas por origen en pantalla", "Cierre con pregunta para comentarios"],
    refs: [
      { label: "Pinterest · three coffee cups side by side", url: "https://www.pinterest.com/search/pins/?q=three%20coffee%20cups%20side%20by%20side%20photography" },
      { label: "TikTok · coffee origins comparison", url: "https://www.tiktok.com/search?q=coffee%20origins%20comparison" },
    ],
    notion: "https://app.notion.com/402dcde6938f81cd8feef5c7d5d84b7c",
  },
  {
    id: "f-1123", fotos: ["assets/ref/morgan.jpg", "assets/ref/finca.jpg"], concepto: "Una secuencia emotiva de rostros y manos de noviembre: recolectores, tostador y baristas. La gente detrás de cada taza.", marca: "forestal", fecha: "2026-11-23",
    titulo: "Las manos de la cosecha",
    formato: "Reel", mensaje: "La gente", tono: "Emocional",
    estado: "Idea", reencauche: true, sesion: "ed",
    copy: "REENCAUCHE de las Sesiones 1 y 2: secuencia de retratos y manos (recolectores en la cosecha, tostador, baristas) en cámara lenta con música emotiva. Texto en pantalla: 'Esta cosecha tiene nombres.' Sin grabación nueva: pedir en S1 y S2 5 s de retrato quieto por persona.",
    gear: GEAR.edicion,
    checklist: ["Pedir en S1 y S2 5 s de retrato por persona", "Secuencia en cámara lenta", "Texto: 'Esta cosecha tiene nombres'", "Música emotiva + color"],
    refs: [
      { label: "Pinterest · coffee harvest portraits", url: "https://www.pinterest.com/search/pins/?q=coffee%20harvest%20portraits%20film%20photography" },
    ],
    notion: "https://app.notion.com/402dcde6938f81428f33d2b91ec89a75",
  },
  {
    id: "f-1125", fotos: ["assets/ref/granos.jpg", "assets/ref/costal.jpg"], concepto: "Pieza gráfica con un dato curioso: qué hace especial y escaso al Bourbon Rosado, la variedad detrás de nuestro café de temporada.", marca: "forestal", fecha: "2026-11-25",
    titulo: "Bourbon Rosado: por qué esta variedad es tan escasa",
    formato: "Pieza gráfica", mensaje: "Temporada/Bebida del mes", tono: "Dato curioso",
    estado: "Idea", reencauche: false, sesion: "ed",
    copy: "SOLO DISEÑO. Pieza tipográfica '¿Sabías que…?' sobre el Bourbon Rosado (variedad poco común y de baja producción, la que da la miel floral de Alborada). Validar el dato con el equipo de finca antes de diseñar. Foto de fondo de archivo (cereza rosada o bolsa de Alborada). Lato + colores de marca. Caption: temporada limitada.",
    gear: GEAR.grafica,
    checklist: ["Validar el dato del Bourbon Rosado", "Foto de cereza rosada o bolsa", "Diseño '¿Sabías que…?' en Lato", "Caption: temporada limitada"],
    refs: [
      { label: "Pinterest · pink bourbon coffee", url: "https://www.pinterest.com/search/pins/?q=pink%20bourbon%20coffee%20cherry" },
    ],
    notion: "https://app.notion.com/402dcde6938f8139a3a7e847f708c22e",
  },
  {
    id: "f-1127", fotos: ["assets/ref/onyx.jpg", "assets/ref/costal.jpg"], concepto: "Carrusel para el Black Friday y la temporada de regalos: qué origen regalarle a cada tipo de persona — la que madruga, la que filtra en casa, la que ama lo dulce.", marca: "forestal", fecha: "2026-11-27",
    titulo: "Guía de regalo: qué origen regalarle a cada quien",
    formato: "Carrusel", mensaje: "3 orígenes", tono: "Educativo",
    estado: "Por grabar", reencauche: false, sesion: "s1",
    copy: "SESIÓN 1 (fotos de producto). Carrusel de 5 slides: portada 'Guía de regalo' + 1 slide por origen con 'para quién es' + cierre con la web. Fotos de bolsa con A7V + Ulanzi lateral, fondo oscuro, empaque de regalo si lo hay. Black Friday (27 nov): si gerencia aprueba una promo, va en el último slide; si no, la pieza funciona sola.",
    gear: GEAR.foto,
    checklist: ["Foto de cada bolsa con empaque de regalo", "Perfil 'para quién es' por origen", "Diseño de 5 slides en Lato", "Confirmar con gerencia si hay promo"],
    refs: [
      { label: "Pinterest · coffee gift guide", url: "https://www.pinterest.com/search/pins/?q=coffee%20gift%20guide%20instagram" },
      { label: "Pinterest · coffee gift packaging", url: "https://www.pinterest.com/search/pins/?q=specialty%20coffee%20gift%20packaging%20photography" },
    ],
    notion: "https://app.notion.com/402dcde6938f812b8c74e784504e632b",
  },
  {
    id: "f-1130", fotos: ["assets/ref/finca.jpg", "assets/ref/costal.jpg"], concepto: "Cerramos noviembre con la voz del origen: una persona de la finca cuenta cómo fue esta cosecha y qué la hace especial.", marca: "forestal", fecha: "2026-11-30",
    titulo: "Quien recoge tu café cuenta cómo fue esta cosecha",
    formato: "Reel", mensaje: "Finca propia", tono: "Testimonial",
    estado: "Por grabar", reencauche: false, sesion: "s2",
    copy: "SESIÓN 2 (finca). Testimonio de un recolector o del encargado de finca: '¿cómo fue esta cosecha?' Hollyland lavalier en exterior, A7V con el cultivo de fondo, hora dorada si se puede. La voz real del origen cerrando el mes. 40-50 seg con B-roll de recolección.",
    gear: GEAR.reelEntrevista,
    checklist: ["Confirmar persona y pregunta guía", "Lavalier en exterior + prueba de viento", "Fondo de cultivo, hora dorada", "Corte a 40-50 s con B-roll de recolección"],
    refs: [
      { label: "TikTok · coffee picker interview", url: "https://www.tiktok.com/search?q=coffee%20picker%20interview%20colombia" },
    ],
    notion: "https://app.notion.com/402dcde6938f8114aec5d84bbfa2a5a5",
  },

  // ══════════════ CARNES MANZANARES ══════════════
  {
    id: "m-1023", fotos: ["assets/ref/tabla.jpg", "assets/ref/ribs.jpg"], concepto: "Carrusel para guardar antes del fin de semana: cuánta carne comprar por persona y qué cortes rinden más para un asado.", marca: "manzanares", fecha: "2026-10-23",
    titulo: "¿Cuánta carne comprar por persona? La guía para tu asado",
    formato: "Carrusel", mensaje: "Cortes y productos", tono: "Educativo",
    estado: "Idea", reencauche: false, sesion: "ed",
    copy: "SOLO DISEÑO (sale hoy). Carrusel de 4-5 slides: portada con la pregunta + cantidad por persona (adultos, niños, con o sin acompañantes) + cortes que más rinden + cierre 'guárdalo para tu próxima compra'. Validar cantidades con el equipo del punto de venta. Fotos de archivo de cortes.",
    gear: GEAR.grafica,
    checklist: ["Validar cantidades con el punto de venta", "Fotos de archivo de cortes", "Diseño de slides con la guía", "CTA: guárdalo para tu próxima compra"],
    refs: [
      { label: "Pinterest · how much meat per person", url: "https://www.pinterest.com/search/pins/?q=how%20much%20meat%20per%20person%20bbq%20guide" },
      { label: "Pinterest · butcher shop carousel", url: "https://www.pinterest.com/search/pins/?q=butcher%20shop%20instagram%20carousel%20design" },
    ],
    notion: "https://app.notion.com/402dcde6938f81f09e65d21a1dd38644",
  },
  {
    id: "m-1026", fotos: ["assets/bg-manzanares.jpg", "assets/ref/flannerybeef.jpg"], concepto: "Video emotivo para volver a conectar: el camino de nuestra carne empieza en el campo, mucho antes de llegar a tu parrilla.", marca: "manzanares", fecha: "2026-10-26",
    titulo: "Tu asado empieza mucho antes de la parrilla",
    formato: "Reel", mensaje: "Del campo a la mesa", tono: "Emocional",
    estado: "Idea", reencauche: true, sesion: "ed",
    copy: "REENCAUCHE de las tomas de 'Nuestros orígenes': campo, ganado, manos y mostrador en versión reel corta con voz en off. Hook: 'Tu asado empieza mucho antes de la parrilla.' Es la pieza de regreso al feed (no se publica desde agosto): emocional y de marca. Sin grabación nueva.",
    gear: GEAR.edicion,
    checklist: ["Rescatar tomas de 'Nuestros orígenes'", "Voz en off con el hook", "Montaje corto 9:16 + música", "Subtítulos y cierre con logo"],
    refs: [
      { label: "Pinterest · cattle ranch cinematic", url: "https://www.pinterest.com/search/pins/?q=cattle%20ranch%20cinematic%20film%20photography" },
      { label: "TikTok · farm to table beef story", url: "https://www.tiktok.com/search?q=farm%20to%20table%20beef%20story" },
    ],
    notion: "https://app.notion.com/402dcde6938f81338f6ccb1acd41ab6b",
  },
  {
    id: "m-1028", fotos: ["assets/ref/victorchurchill.jpg", "assets/ref/meatthebutchers.jpg"], concepto: "Un dato que resuelve una duda común: la carne empacada al vacío se ve más oscura porque no tiene oxígeno, y vuelve a su rojo al abrirla. Es señal de frescura.", marca: "manzanares", fecha: "2026-10-28",
    titulo: "¿Por qué la carne al vacío se ve más oscura? (es buena señal)",
    formato: "Pieza gráfica", mensaje: "Calidad y maduración", tono: "Dato curioso",
    estado: "Idea", reencauche: false, sesion: "ed",
    copy: "SOLO DISEÑO. Pieza '¿Sabías que…?' que resuelve la duda: sin oxígeno la carne toma un tono púrpura oscuro y recupera el rojo a los pocos minutos de abrir el empaque. Ideal: antes/después del mismo corte (foto de archivo o tomada en 10 min en el punto de venta). Lato + colores de marca. Caption: el empacado al vacío como sello de calidad.",
    gear: GEAR.grafica,
    checklist: ["Foto antes/después del mismo corte", "Texto del dato validado", "Diseño '¿Sabías que…?'", "Caption: el vacío como sello de calidad"],
    refs: [
      { label: "Pinterest · vacuum packed beef color", url: "https://www.pinterest.com/search/pins/?q=vacuum%20packed%20beef%20color%20bloom" },
    ],
    notion: "https://app.notion.com/402dcde6938f81cd8756caf60068475b",
  },
  {
    id: "m-1030", fotos: ["assets/ref/ribs.jpg", "assets/ref/tabla.jpg"], concepto: "Un video con humor para el puente de Halloween y Todos los Santos: en Santander, cualquier plan termina en asado.", marca: "manzanares", fecha: "2026-10-30",
    titulo: "Puente festivo en Santander: el plan siempre es asado",
    formato: "Reel", mensaje: "Tradición santandereana", tono: "Trend/Humor",
    estado: "Idea", reencauche: true, sesion: "ed",
    copy: "REENCAUCHE con humor para el puente (31 oct – 2 nov). Clips de archivo de parrilla y producto sobre un audio en tendencia esa semana. Texto en pantalla: 'Planes para el puente: 1. Asado. 2. Asado. 3. Ver punto 1.' Elegir el trend al editar. Sin grabación nueva.",
    gear: GEAR.edicion,
    checklist: ["Elegir audio en tendencia esa semana", "Clips de archivo de parrilla y producto", "Texto en pantalla con el chiste", "Exportar 9:16 con subtítulos"],
    refs: [
      { label: "TikTok · asado trend humor", url: "https://www.tiktok.com/search?q=asado%20trend%20humor" },
      { label: "TikTok · bbq weekend plans meme", url: "https://www.tiktok.com/search?q=bbq%20weekend%20plans%20meme" },
    ],
    notion: "https://app.notion.com/402dcde6938f8143a0cbc0d1fccf0449",
  },
  {
    id: "m-1102", fotos: ["assets/bg-manzanares.jpg", "assets/ref/tabla.jpg"], concepto: "Abrimos noviembre con nuestra raíz: la tradición ganadera santandereana que pasa de generación en generación y llega a tu mesa.", marca: "manzanares", fecha: "2026-11-02",
    titulo: "Una tradición santandereana que se hereda",
    formato: "Reel", mensaje: "Tradición santandereana", tono: "Emocional",
    estado: "Idea", reencauche: true, sesion: "ed",
    copy: "REENCAUCHE para abrir el mes (lunes festivo). Remontar 'Nuestros orígenes' con foco en la historia y la familia: la vocera, el campo, las manos de siempre. Hook: 'Hay cosas que en Santander se heredan.' Música emotiva, ritmo lento. Sin grabación nueva.",
    gear: GEAR.edicion,
    checklist: ["Rescatar tomas de historia y familia", "Hook: 'Hay cosas que en Santander se heredan'", "Montaje lento + música emotiva", "Exportar 9:16 con subtítulos"],
    refs: [
      { label: "Pinterest · family ranch heritage", url: "https://www.pinterest.com/search/pins/?q=family%20ranch%20heritage%20film%20photography" },
    ],
    notion: "https://app.notion.com/402dcde6938f8103971fc77b70beb105",
  },
  {
    id: "m-1104", fotos: ["assets/ref/maxthemeatguy.jpg", "assets/ref/ribs.jpg"], concepto: "Carrusel para guardar: los 3 errores más comunes en la parrilla y cómo evitarlos para que tu corte quede perfecto.", marca: "manzanares", fecha: "2026-11-04",
    titulo: "3 errores que arruinan un buen corte en la parrilla",
    formato: "Carrusel", mensaje: "Recetas", tono: "Educativo",
    estado: "Idea", reencauche: false, sesion: "ed",
    copy: "SOLO DISEÑO. Carrusel de 5 slides: portada + 3 errores (no dejarlo reposar, voltearlo a cada rato, salarlo a destiempo) con la solución de cada uno + cierre 'guárdalo para tu próximo asado'. Validar los tips con el carnicero de la casa. Fotos de archivo de parrilla.",
    gear: GEAR.grafica,
    checklist: ["Validar los 3 tips con el carnicero", "Fotos de archivo de parrilla", "Diseño: error + solución por slide", "CTA: guárdalo para tu próximo asado"],
    refs: [
      { label: "Pinterest · grilling tips carousel", url: "https://www.pinterest.com/search/pins/?q=grilling%20tips%20instagram%20carousel%20design" },
      { label: "TikTok · steak mistakes grill", url: "https://www.tiktok.com/search?q=steak%20grilling%20mistakes" },
    ],
    notion: "https://app.notion.com/402dcde6938f81b8ab2fc191313479ec",
  },
  {
    id: "m-1106", fotos: ["assets/ref/meatthebutchers.jpg", "assets/ref/beardedbutchers.jpg"], concepto: "Video sensorial del carnicero en acción: el filo del cuchillo, la tabla y el corte perfecto. 'Sube el volumen 🔪'.", marca: "manzanares", fecha: "2026-11-06",
    titulo: "ASMR: el despiece de un corte, sonido por sonido",
    formato: "Reel", mensaje: "Cortes y productos", tono: "Sensorial",
    estado: "Por grabar", reencauche: false, sesion: "s1",
    copy: "SESIÓN 1 (punto de venta). Reel ASMR del despiece de un corte premium: afilado, cuchillo sobre la carne, tabla, porcionado y empacado al vacío. Hollyland pegado a la tabla. A7V 60fps en planos cerrados, Ulanzi lateral para textura. Copy: 'Sube el volumen 🔪'",
    gear: GEAR.reelASMR,
    checklist: ["Elegir el corte premium a despiezar", "Hollyland pegado a la tabla", "Planos cerrados 60fps + Ulanzi lateral", "Montaje solo con sonido directo"],
    refs: [
      { label: "TikTok · butcher asmr", url: "https://www.tiktok.com/search?q=butcher%20asmr%20cutting" },
      { label: "Pinterest · butcher knife cinematic", url: "https://www.pinterest.com/search/pins/?q=butcher%20knife%20cinematic%20photography" },
    ],
    notion: "https://app.notion.com/402dcde6938f817fbe8fd3e44a524c19",
  },
  {
    id: "m-1109", fotos: ["assets/ref/flannerybeef.jpg", "assets/ref/victorchurchill.jpg"], concepto: "Dos cortes lado a lado — uno madurado y uno fresco — para que veas y entiendas por qué la maduración cambia la textura y el sabor.", marca: "manzanares", fecha: "2026-11-09",
    titulo: "Madurada vs. fresca: la diferencia que se nota en la parrilla",
    formato: "Reel", mensaje: "Calidad y maduración", tono: "Educativo",
    estado: "Por grabar", reencauche: false, sesion: "s1",
    copy: "SESIÓN 1. Comparativo del mismo corte madurado vs. fresco: color, textura al tacto y los dos en la parrilla. El carnicero explica en 2-3 frases qué hace la maduración (Hollyland lavalier). Textos en pantalla con los días de maduración. A7V planos cerrados + Ulanzi.",
    gear: GEAR.reelNarrativo,
    checklist: ["Mismo corte: madurado y fresco", "2-3 frases del carnicero con lavalier", "Planos de color, textura y parrilla", "Textos con los días de maduración"],
    refs: [
      { label: "TikTok · dry aged vs fresh steak", url: "https://www.tiktok.com/search?q=dry%20aged%20vs%20fresh%20steak" },
      { label: "Pinterest · aged beef close up", url: "https://www.pinterest.com/search/pins/?q=aged%20beef%20close%20up%20photography" },
    ],
    notion: "https://app.notion.com/402dcde6938f81caacefc25649d30be0",
  },
  {
    id: "m-1111", fotos: ["assets/ref/beardedbutchers.jpg", "assets/ref/tabla.jpg"], concepto: "Clientes que nos compran hace años cuentan en sus palabras por qué siempre vuelven. La confianza, contada por ellos.", marca: "manzanares", fecha: "2026-11-11",
    titulo: "Clientes de siempre: por qué vuelven a Manzanares",
    formato: "Reel", mensaje: "La gente", tono: "Testimonial",
    estado: "Por grabar", reencauche: false, sesion: "s1",
    copy: "SESIÓN 1 (punto de venta). 2-3 clientes frecuentes responden: '¿por qué vuelves a Manzanares?' Hollyland lavalier, A7V a 35-50mm con Ulanzi como key suave. Pedir permiso de imagen por escrito. B-roll de su compra en mostrador. 30-40 seg.",
    gear: GEAR.reelEntrevista,
    checklist: ["Coordinar 2-3 clientes frecuentes", "Permiso de imagen firmado", "Lavalier + pregunta guía", "B-roll de su compra en mostrador"],
    refs: [
      { label: "TikTok · customer testimonial butcher", url: "https://www.tiktok.com/search?q=customer%20testimonial%20butcher%20shop" },
    ],
    notion: "https://app.notion.com/402dcde6938f81fbad86d80e8ccd1606",
  },
  {
    id: "m-1113", fotos: ["assets/ref/maxthemeatguy.jpg", "assets/ref/ribs.jpg"], concepto: "Un video con humor sobre ese personaje que todas las familias tienen: el que se adueña de la parrilla. Perfecto para el puente festivo.", marca: "manzanares", fecha: "2026-11-13",
    titulo: "El asador de la familia, explicado en un trend",
    formato: "Reel", mensaje: "Recetas", tono: "Trend/Humor",
    estado: "Por grabar", reencauche: false, sesion: "s1",
    copy: "SESIÓN 1. Trend sobre 'el asador de la familia': sus frases típicas ('nadie toca la parrilla', 'ya casi está') con planos rápidos del corte en la parrilla y el plato final con Ulanzi. Audio en tendencia esa semana (elegir al editar). Sale antes del puente del 16 de noviembre.",
    gear: GEAR.reelASMR,
    checklist: ["Escribir 3-4 frases del asador", "Planos rápidos de parrilla y plato final", "Elegir trend/audio LA SEMANA de publicar", "Cortes al beat + texto en pantalla"],
    refs: [
      { label: "TikTok · bbq dad trend", url: "https://www.tiktok.com/search?q=bbq%20dad%20trend" },
      { label: "TikTok · parrillero humor", url: "https://www.tiktok.com/search?q=parrillero%20humor" },
    ],
    notion: "https://app.notion.com/402dcde6938f817f9292c29698269758",
  },
  {
    id: "m-1116", fotos: ["assets/bg-manzanares.jpg", "assets/ref/meatthebutchers.jpg"], concepto: "El video estrella del mes: te mostramos dónde y cómo se cría nuestro ganado, y todo el camino hasta el mostrador.", marca: "manzanares", fecha: "2026-11-16",
    titulo: "Del potrero al mostrador: el camino de tu carne",
    formato: "Reel", mensaje: "Del campo a la mesa", tono: "Educativo",
    estado: "Por grabar", reencauche: false, sesion: "s2",
    copy: "SESIÓN 2 (campo/planta). El reel de posicionamiento del mes: potrero → selección → planta → maduración → mostrador. Hook: '¿Sabes de dónde viene la carne que compras? Nosotros te lo mostramos.' Tomas nuevas en campo + B-roll de planta y mostrador. Texto corto por etapa. 30-40 seg.",
    gear: GEAR.reelNarrativo,
    checklist: ["Shot list: potrero→selección→planta→mostrador", "Tomas nuevas en campo", "B-roll de planta y mostrador", "Texto por etapa + cierre en mostrador"],
    refs: [
      { label: "TikTok · cattle farm to butcher", url: "https://www.tiktok.com/search?q=cattle%20farm%20to%20butcher" },
      { label: "Pinterest · cattle pasture cinematic", url: "https://www.pinterest.com/search/pins/?q=cattle%20pasture%20cinematic%20photography" },
    ],
    notion: "https://app.notion.com/402dcde6938f81ab99adc22a9ccf629b",
  },
  {
    id: "m-1118", fotos: ["assets/ref/victorchurchill.jpg", "assets/ref/flannerybeef.jpg"], concepto: "Serie de fotos macro de nuestros cortes madurados: la textura, el color y la grasa que hacen la diferencia.", marca: "manzanares", fecha: "2026-11-18",
    titulo: "Macro: así se ve un corte madurado de cerca",
    formato: "Foto", mensaje: "Calidad y maduración", tono: "Sensorial",
    estado: "Por grabar", reencauche: false, sesion: "s1",
    copy: "SESIÓN 1. Serie de 4-5 fotos macro de cortes madurados: textura de la superficie, marmoleo, borde de grasa, corte transversal. A7V RAW f/4-f/5.6, Ulanzi 40W rasante, fondo oscuro tipo carnicería premium (Victor Churchill). 20 min de la sesión.",
    gear: GEAR.foto,
    checklist: ["4-5 encuadres macro por corte", "Ulanzi rasante para textura", "Fondo oscuro premium", "Caption: la maduración se ve"],
    refs: [
      { label: "Pinterest · dry aged beef macro", url: "https://www.pinterest.com/search/pins/?q=dry%20aged%20beef%20macro%20photography" },
    ],
    notion: "https://app.notion.com/402dcde6938f819ea87ffd9f0f2e3f39",
  },
  {
    id: "m-1120", fotos: ["assets/ref/tabla.jpg", "assets/ref/ribs.jpg"], concepto: "La receta más santandereana explicada paso a paso con nuestra carne: el adobo, el oreo y el resultado final.", marca: "manzanares", fecha: "2026-11-20",
    titulo: "Carne oreada: el secreto santandereano, paso a paso",
    formato: "Reel", mensaje: "Tradición santandereana", tono: "Educativo",
    estado: "Por grabar", reencauche: false, sesion: "s1",
    copy: "SESIÓN 1. Reel paso a paso de la carne oreada con carne Manzanares: corte recomendado, adobo, oreado y asado final. Voz en off o textos en pantalla con cada paso. A7V cenital para el adobo + Ulanzi para el plato final. Preparar el oreo con un día de anticipación para tener el antes y el después en la sesión.",
    gear: GEAR.reelNarrativo,
    checklist: ["Preparar el oreo un día antes", "Corte recomendado + adobo en cenital", "Paso a paso en texto o voz en off", "Plato final con Ulanzi"],
    refs: [
      { label: "TikTok · carne oreada santandereana", url: "https://www.tiktok.com/search?q=carne%20oreada%20santandereana" },
      { label: "Pinterest · colombian food photography", url: "https://www.pinterest.com/search/pins/?q=colombian%20food%20photography%20dark" },
    ],
    notion: "https://app.notion.com/402dcde6938f8125b133e2a6d944c8e9",
  },
  {
    id: "m-1123", fotos: ["assets/ref/beardedbutchers.jpg", "assets/ref/meatthebutchers.jpg"], concepto: "Una secuencia emotiva de las personas que hacen Manzanares: del campo al mostrador, los rostros y las manos detrás de cada corte.", marca: "manzanares", fecha: "2026-11-23",
    titulo: "Detrás del mostrador hay nombres",
    formato: "Reel", mensaje: "La gente", tono: "Emocional",
    estado: "Idea", reencauche: true, sesion: "ed",
    copy: "REENCAUCHE de las Sesiones 1 y 2: retratos y manos (ganaderos, carniceros, equipo de mostrador) en cámara lenta con música emotiva. Texto en pantalla: 'Detrás de cada corte hay nombres.' Sin grabación nueva: pedir en S1 y S2 5 s de retrato quieto por persona.",
    gear: GEAR.edicion,
    checklist: ["Pedir en S1 y S2 5 s de retrato por persona", "Secuencia en cámara lenta", "Texto: 'Detrás de cada corte hay nombres'", "Música emotiva + color"],
    refs: [
      { label: "Pinterest · butcher portrait film", url: "https://www.pinterest.com/search/pins/?q=butcher%20portrait%20film%20photography" },
    ],
    notion: "https://app.notion.com/402dcde6938f81f99d6ce46b8f69fb13",
  },
  {
    id: "m-1125", fotos: ["assets/ref/maxthemeatguy.jpg", "assets/ref/victorchurchill.jpg"], concepto: "Un video corto y antojador con lo mejor de la parrilla de noviembre: el sellado, los jugos y el corte final.", marca: "manzanares", fecha: "2026-11-25",
    titulo: "15 segundos de antojo: el corte del mes a la parrilla",
    formato: "Reel", mensaje: "Recetas", tono: "Sensorial",
    estado: "Idea", reencauche: true, sesion: "ed",
    copy: "REENCAUCHE de los planos de parrilla de la Sesión 1 (trend del asador y carne oreada): 15 s de sellado, jugos y corte final con sonido directo. Texto en pantalla con el corte y el término. Copy: 'Antojo oficial de fin de mes 🔥'. Sin grabación nueva.",
    gear: GEAR.edicion,
    checklist: ["Reunir planos de parrilla de la S1", "Montaje de 15 s con sonido directo", "Texto con corte y término", "Exportar 9:16"],
    refs: [
      { label: "TikTok · steak sizzle short", url: "https://www.tiktok.com/search?q=steak%20sizzle%20short%20video" },
    ],
    notion: "https://app.notion.com/402dcde6938f812cad64f54aa450963c",
  },
  {
    id: "m-1127", fotos: ["assets/ref/tabla.jpg", "assets/ref/victorchurchill.jpg"], concepto: "Carrusel para el Black Friday y las reuniones de fin de año: los cortes que más rinden cuando la mesa es grande.", marca: "manzanares", fecha: "2026-11-27",
    titulo: "Black Friday de carnicería: los cortes que más rinden",
    formato: "Carrusel", mensaje: "Cortes y productos", tono: "Dato curioso",
    estado: "Por grabar", reencauche: false, sesion: "s1",
    copy: "SESIÓN 1 (fotos de producto). Carrusel de 5 slides: portada + 3 cortes que más rinden para grupos (porciones por kilo y cómo cocinarlos) + cierre. Fotos con A7V + Ulanzi lateral, fondo oscuro. Black Friday (27 nov): si gerencia aprueba una promo, va en el último slide; si no, la pieza funciona sola como guía.",
    gear: GEAR.foto,
    checklist: ["Foto de los 3 cortes que más rinden", "Porciones por kilo validadas", "Diseño de 5 slides", "Confirmar con gerencia si hay promo"],
    refs: [
      { label: "Pinterest · butcher black friday", url: "https://www.pinterest.com/search/pins/?q=butcher%20shop%20black%20friday%20instagram" },
      { label: "Pinterest · meat cuts guide design", url: "https://www.pinterest.com/search/pins/?q=meat%20cuts%20guide%20instagram%20design" },
    ],
    notion: "https://app.notion.com/402dcde6938f81a08f38cd9229d10f42",
  },
  {
    id: "m-1130", fotos: ["assets/bg-manzanares.jpg", "assets/ref/flannerybeef.jpg"], concepto: "Cerramos noviembre con la voz del origen: quien cría nuestro ganado cuenta qué hace falta para que una carne sea buena de verdad.", marca: "manzanares", fecha: "2026-11-30",
    titulo: "El ganadero cuenta: así se cría una buena carne",
    formato: "Reel", mensaje: "Del campo a la mesa", tono: "Testimonial",
    estado: "Por grabar", reencauche: false, sesion: "s2",
    copy: "SESIÓN 2 (campo). Testimonio del ganadero o encargado del campo: '¿qué hace falta para criar una buena carne?' Hollyland lavalier en exterior, A7V con el potrero de fondo, hora dorada si se puede. La voz real del origen cerrando el mes. 40-50 seg con B-roll del ganado.",
    gear: GEAR.reelEntrevista,
    checklist: ["Confirmar ganadero y pregunta guía", "Lavalier en exterior + prueba de viento", "Potrero de fondo, hora dorada", "Corte a 40-50 s con B-roll del ganado"],
    refs: [
      { label: "TikTok · rancher interview cattle", url: "https://www.tiktok.com/search?q=rancher%20interview%20cattle" },
    ],
    notion: "https://app.notion.com/402dcde6938f81fd885eec744cc11d63",
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

// ============================================================
// HISTORIAS DE APOYO POR FECHA — "AAAA-MM-DD|marca": [historias]
// Reemplazan el plan semanal genérico SOLO esos días (Historias de
// David) y salen en la ficha de cada publicación para que mercadeo
// apruebe el plan junto con el post. `txt` empieza con el emoji que
// define el ícono (ver HIST_ICONOS en app.js) y es parte de la clave
// de la historia: si se cambia, se pierde lo programado de esa historia.
// ============================================================
const HISTORIAS_FECHA = {
  // ── Semana 1 · 2 al 8 de noviembre ──
  "2026-11-02|forestal": [
    { txt: "☀️ Festivo con café en casa", hora: "09:30", img: "assets/forestal-nov/h-prensa.jpg", archivo: "FOTOS VARIAS/Captura de pantalla 2026-08-21 (prensa francesa)", texto: "Festivo es café sin afán.", sticker: "Encuesta: ¿Cómo lo preparas hoy? · Greca / Prensa", porque: "Una interacción fácil a primera hora calienta la cuenta antes de que salga el carrusel." },
    { txt: "🔁 La cosecha no tiene festivo (post de hoy)", hora: "10:15", img: "assets/forestal-nov/duf01147.jpg", archivo: "Captura del carrusel publicado", texto: "En la finca hoy no hay festivo 🌿", sticker: "Publicación: el carrusel de hoy", porque: "Lleva gente al carrusel en su primera hora, que es cuando Instagram decide cuánto lo muestra." },
    { txt: "👥 Cosecha · café de origen", hora: "16:00", img: "assets/forestal-nov/h-cosecha.jpg", archivo: "02_Proyectos/NUEVAS HISTORIAS/EXPORTADOS/1.png", texto: "Ya diseñada: «Cosecha · Seleccionado a mano, grano por grano».", sticker: "Ninguno", porque: "Mantiene la cosecha presente en la tarde de regreso del puente." },
  ],
  "2026-11-03|forestal": [
    { txt: "🎬 Así llega la cereza", hora: "09:00", img: "assets/forestal-nov/h-canasto.jpg", archivo: "02_Proyectos/NUEVAS HISTORIAS/EXPORTADOS/4.png", texto: "Ya diseñada: «Café de origen · Fresco y seleccionado directo a tu taza».", sticker: "Cuestionario: ¿Cómo se recoge la cereza en nuestra finca? · A mano, una por una (correcta) / Con máquina", porque: "Repasa el carrusel del lunes en un toque y nos dice cuánto sabe la gente del proceso." },
    { txt: "🛍 Del cafetal a tu casa", hora: "18:00", img: "assets/forestal-nov/h-pidelo.jpg", archivo: "02_Proyectos/NUEVAS HISTORIAS/EXPORTADOS/5.png", texto: "Ya diseñada: «Pídelo · Del cafetal a tu casa».", sticker: "Enlace: forestal.cafe", porque: "Día de venta: convierte el interés por la cosecha en pedidos en la web." },
  ],
  "2026-11-04|forestal": [
    { txt: "☀️ Buenos días desde la tienda", hora: "09:00", img: "assets/forestal-nov/h-dsc00035.jpg", archivo: "FOTOS VARIAS/DSC00035.jpg", texto: "Ya estamos listos ☕", sticker: "Ubicación de la tienda", porque: "Recuerda que estamos abiertos y dónde encontrarnos: el miércoles es día de tiendas." },
    { txt: "👥 Ellos cosechan tu café", hora: "12:30", img: "assets/forestal-nov/h-ellos.jpg", archivo: "02_Proyectos/NUEVAS HISTORIAS/EXPORTADOS/3.png", texto: "Ya diseñada: «Ellos cosechan tu café especial, con la berraquera de Santander».", sticker: "Ninguno", porque: "Abre el tema del carrusel de la tarde." },
    { txt: "🔁 Quienes cosechan tu café (post de hoy)", hora: "18:45", img: "assets/forestal-nov/duf01190.jpg", archivo: "Captura del carrusel publicado", texto: "Conoce a quienes recogen tu café 🌿", sticker: "Publicación: el carrusel de hoy", porque: "Lleva gente al carrusel en su primera hora." },
  ],
  "2026-11-05|forestal": [
    { txt: "📊 ¿Sabes qué es el café de especialidad?", hora: "09:00", img: "assets/forestal-nov/h-dsc00096.jpg", archivo: "FOTOS VARIAS/DSC00096.jpg", texto: "¿Sabes qué es el café de especialidad?", sticker: "Encuesta: Sí, claro / Ni idea", porque: "Calienta el reel del viernes y nos dice cuánto sabe la audiencia." },
    { txt: "⏳ Mañana: qué es el café de especialidad", hora: "12:30", img: "assets/forestal-nov/especialidad-2.jpg", archivo: "02_Proyectos/Qué es café de especialidad/2.png", texto: "+80 puntos. Mañana te contamos qué significa.", sticker: "Cuenta regresiva: viernes 6 · 12:30 p. m.", porque: "Quien activa el recordatorio recibe un aviso cuando sale el reel." },
    { txt: "🛍 Calidad de la cosecha", hora: "18:00", img: "assets/forestal-nov/h-calidad.jpg", archivo: "02_Proyectos/NUEVAS HISTORIAS/EXPORTADOS/Calidad.png", texto: "Ya diseñada: «Calidad de la cosecha · Solo se eligen los granos maduros y sin defectos».", sticker: "Enlace: forestal.cafe", porque: "Segundo día de venta de la semana." },
  ],
  "2026-11-06|forestal": [
    { txt: "🔁 ¿Qué es el café de especialidad? (reel de hoy)", hora: "12:45", img: "assets/forestal-nov/especialidad-1.jpg", archivo: "Captura del reel publicado", texto: "Ya salió: dale play ☕", sticker: "Publicación: el reel de hoy", porque: "Empuja el reel en su primera hora." },
    { txt: "❓ ¿Qué quieres saber del café?", hora: "16:00", img: null, archivo: "Fondo color de marca", texto: "Pregúntanos lo que quieras sobre el café de especialidad.", sticker: "Caja de preguntas", porque: "Las respuestas alimentan las historias de la semana siguiente y muestran qué no entiende la gente." },
  ],
  "2026-11-07|forestal": [
    { txt: "☀️ Sábado en el Club", hora: "08:30", img: "assets/forestal-nov/h-duf8730.jpg", archivo: "FOTOS VARIAS/DUF_8730.jpg", texto: "Hoy te esperamos en el Club del Comercio hasta las 12 m.", sticker: "Ubicación: Club del Comercio", porque: "El Club solo abre el sábado hasta el mediodía: hay que avisar temprano." },
    { txt: "🙋 Tu café de sábado", hora: "15:00", img: null, archivo: "Historias en las que nos etiqueten", texto: "Repost de las historias de clientes que nos etiqueten.", sticker: "Mención de la persona", porque: "La prueba social de clientes reales pesa más que cualquier anuncio." },
  ],
  "2026-11-08|forestal": [
    { txt: "☀️ Domingo de café", hora: "10:00", img: "assets/forestal-nov/h-dsc00123.jpg", archivo: "FOTOS VARIAS/DSC00123.jpg", texto: "Domingo abierto: La Quinta, Alkosto Floridablanca y Barichara.", sticker: "Ubicación: Barichara", porque: "El domingo abren las burbujas y Barichara: recordarlo lleva visitas a las tiendas abiertas." },
    { txt: "❓ Lo mejor de la semana", hora: "18:00", img: null, archivo: "Collage de los tres posts de la semana", texto: "Esta semana: la cosecha, quienes la recogen y qué es el café de especialidad.", sticker: "Encuesta: ¿Cuál te gustó más? · Cosecha / Personas / Especialidad", porque: "Cierra la semana y nos dice qué tema repetir." },
  ],
  // ── Semana 2 · 9 al 15 de noviembre ──
  "2026-11-09|forestal": [
    { txt: "🎬 Hoy se tuesta", hora: "09:00", img: "assets/forestal-nov/h-duf8869.jpg", archivo: "FOTOS VARIAS/DUF_8869.jpg", texto: "Hoy hay tostión 🔥", sticker: "Encuesta: ¿Tueste claro u oscuro?", porque: "Anticipa el reel de la tarde con el detrás de cámaras." },
    { txt: "👥 De dónde viene tu café", hora: "12:30", img: "assets/forestal-nov/h-origen.jpg", archivo: "02_Proyectos/NUEVAS HISTORIAS/EXPORTADOS/2.png", texto: "Ya diseñada: «Origen · Finca San Sebastián · 1.850 m s. n. m. · Orgánica».", sticker: "Ninguno", porque: "Lunes de origen: recuerda la finca con una historia que ya está lista." },
    { txt: "🔁 Quien tuesta tu café (reel de hoy)", hora: "18:45", img: "assets/forestal-nov/duf8869.jpg", archivo: "Captura del reel publicado", texto: "Pregúntale lo que quieras a quien tuesta tu café.", sticker: "Publicación + caja de preguntas", porque: "Lleva gente al reel y recoge preguntas para responder el martes." },
  ],
  "2026-11-10|forestal": [
    { txt: "❓ El tostador responde", hora: "12:30", img: null, archivo: "Fondo color de marca", texto: "Una o dos preguntas de la caja del lunes, respondidas.", sticker: "Ninguno", porque: "Cumple lo que prometimos en el reel y muestra que detrás de la marca hay personas que responden." },
    { txt: "🛍 Recién tostado", hora: "18:00", img: "assets/forestal-nov/h-duf8870.jpg", archivo: "FOTOS VARIAS/DUF_8870.jpg", texto: "Recién tostado, directo a tu casa.", sticker: "Enlace: forestal.cafe", porque: "Día de venta: la frescura del tueste es el argumento." },
  ],
  "2026-11-11|forestal": [
    { txt: "☀️ Buenos días desde la barra", hora: "09:00", img: "assets/forestal-nov/h-dsc00094.jpg", archivo: "FOTOS VARIAS/DSC00094.jpg", texto: "La barra ya está lista ☕", sticker: "Ubicación de la tienda", porque: "Miércoles de tiendas: recuerda que estamos abiertos." },
    { txt: "🆚 ¿Filtrado o espresso?", hora: "12:30", img: "assets/forestal-nov/h-prensa.jpg", archivo: "FOTOS VARIAS/Captura de pantalla 2026-08-21 + DSC00096.jpg (lado a lado)", texto: "¿Filtrado o espresso?", sticker: "Encuesta: Filtrado / Espresso", porque: "Interacción de tienda que además nos dice qué método prefiere la gente." },
    { txt: "🔁 Lo que pides vs. lo que quieres decir (reel de hoy)", hora: "18:45", img: "assets/forestal-nov/dsc00123.jpg", archivo: "Captura del reel publicado", texto: "Etiqueta a quien siempre pide «lo de siempre» 😅", sticker: "Publicación: el reel de hoy", porque: "Empuja el reel y suma etiquetas, que lo llevan a cuentas nuevas." },
  ],
  "2026-11-12|forestal": [
    { txt: "📊 ¿Ya pediste café en nuestra web?", hora: "09:00", img: "assets/forestal-nov/h-duf00506.jpg", archivo: "FOTOS VARIAS/DUF00506.jpg", texto: "¿Ya pediste tu café en forestal.cafe?", sticker: "Encuesta: Sí / Todavía no", porque: "Calienta el carrusel del viernes y nos dice cuánta gente conoce la tienda en línea." },
    { txt: "🛍 Para el puente", hora: "18:00", img: "assets/forestal-nov/h-duf9174.jpg", archivo: "FOTOS VARIAS/DUF_9174.jpg", texto: "¿Te vas de puente? Que no te falte café.", sticker: "Enlace: forestal.cafe", porque: "Día de venta antes del puente festivo del lunes 16: mejor pedir con tiempo." },
  ],
  "2026-11-13|forestal": [
    { txt: "🔁 Desde donde estés (post de hoy)", hora: "12:45", img: "assets/forestal-nov/duf9174.jpg", archivo: "Captura del carrusel publicado", texto: "Así de fácil pides tu café ☕", sticker: "Publicación + enlace: forestal.cafe", porque: "Empuja el carrusel en su primera hora y deja el enlace a la web a un toque." },
    { txt: "📊 ¿Cuál te llevas al puente?", hora: "16:00", img: "assets/forestal-nov/h-duf9303.jpg", archivo: "FOTOS VARIAS/DUF_9303.jpg", texto: "¿Cuál te llevas al puente?", sticker: "Encuesta: Santa María / San Sebastián", porque: "Recordatorio de producto sin ser venta dura, justo antes del puente." },
  ],
  "2026-11-14|forestal": [
    { txt: "☀️ Sábado en el Club", hora: "08:30", img: "assets/forestal-nov/h-dsc00102.jpg", archivo: "FOTOS VARIAS/DSC00102.jpg", texto: "Hoy te esperamos en el Club del Comercio hasta las 12 m.", sticker: "Ubicación: Club del Comercio", porque: "El Club solo abre el sábado hasta el mediodía: hay que avisar temprano." },
    { txt: "🙋 Tu café de puente", hora: "15:00", img: null, archivo: "Historias en las que nos etiqueten", texto: "Repost de las historias de clientes que nos etiqueten.", sticker: "Mención de la persona", porque: "Prueba social en pleno puente." },
  ],
  "2026-11-15|forestal": [
    { txt: "☀️ Domingo de puente", hora: "10:00", img: "assets/forestal-nov/h-dsc00156.jpg", archivo: "FOTOS VARIAS/DSC00156.jpg", texto: "Domingo de puente: te esperamos en La Quinta, Alkosto Floridablanca y Barichara.", sticker: "Ubicación: La Quinta", porque: "Quien se queda en la ciudad en el puente busca plan; las burbujas y Barichara abren." },
    { txt: "❓ Lo mejor de la semana", hora: "18:00", img: null, archivo: "Collage de los tres posts de la semana", texto: "Esta semana: quien tuesta tu café, los pedidos en barra y cómo pedir en la web.", sticker: "Encuesta: ¿Cuál te gustó más? · Tostión / Barra / Web", porque: "Cierra la semana y nos dice qué tema repetir." },
  ],
};
