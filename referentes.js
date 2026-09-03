// ============================================================
// REFERENTES — cuentas reales verificadas + tácticas 2025-2026
// Fuente: investigación de grandes cuentas gastronómicas.
// ============================================================

const REFERENTES = {
  norte: {
    handle: "@pergaminocafe",
    url: "https://www.instagram.com/pergaminocafe/",
    resumen: "El norte de posicionamiento. Su estrategia entera cabe en una frase: 'conectamos el campo con la ciudad'. Cada post es un capítulo de esa misma narrativa: origen y productor, producto con identidad visual estricta, experiencia de tienda y educación. Tono editorial, nunca vendedor.",
    lecciones: [
      "Una sola historia repetida mil veces: campo → ciudad. No publican contenido, publican capítulos.",
      "Identidad visual estricta: el feed parece un manual de marca vivo.",
      "Producto + lugar + personas en rotación constante — nunca solo producto.",
      "Educan y cuentan; la venta es consecuencia.",
    ],
  },
  cafe: [
    { handle: "@onyxcoffeelab", img: "assets/ref/onyx.jpg", url: "https://www.instagram.com/onyxcoffeelab/", why: "El estándar mundial de diseño aplicado a café: dirección de arte impecable, empaques premiados, educación de toda la cadena. Funciona: foto de producto editorial + reels educativos." },
    { handle: "@lacabracoffee", img: "assets/ref/lacabra.jpg", url: "https://www.instagram.com/lacabracoffee/", why: "La estética más imitada del café minimalista: fotografía estilo film, luz natural, clips contemplativos. El feed es un moodboard. Referencia directa para el look de Forestal." },
    { handle: "@vervecoffee", img: "assets/ref/verve.jpg", url: "https://www.instagram.com/vervecoffee/", why: "El modelo 'farm to cup' filmado: fincas, tostión, baristas trabajando. B-roll de tostaduría y retratos de equipo." },
    { handle: "@cafeamorperfecto", img: "assets/ref/amorperfecto.jpg", url: "https://www.instagram.com/cafeamorperfecto/", why: "El referente colombiano más premiado (Bogotá, desde 1997). Narrativa de 'tostado en origen' — el mismo territorio de Forestal." },
    { handle: "@libertariocoffee", img: "assets/ref/libertario.jpg", url: "https://www.instagram.com/libertariocoffee/", why: "Prueba de que una marca colombiana chica puede verse world-class: microlotes + storytelling de proceso." },
    { handle: "@morgandrinkscoffee", img: "assets/ref/morgan.jpg", url: "https://www.instagram.com/morgandrinkscoffee/", why: "Campeona US Barista: el modelo de formato POV/sketch — educación disfrazada de humor. Referencia para las piezas de trend." },
  ],
  carne: [
    { handle: "@victorchurchill.sydney", img: "assets/ref/victorchurchill.jpg", url: "https://www.instagram.com/victorchurchill.sydney/", why: "'La carnicería más bella del mundo': la carne exhibida como joyería, luz cálida de boutique, video cinematográfico del oficio. El norte estético exacto de Manzanares." },
    { handle: "@maxthemeatguy", img: "assets/ref/maxthemeatguy.jpg", url: "https://www.instagram.com/maxthemeatguy/", why: "El mayor creador de carne en short-form: ASMR sin música + macro + hooks de pregunta. Norte de formato para reels." },
    { handle: "@thebeardedbutchers", img: "assets/ref/beardedbutchers.jpg", url: "https://www.instagram.com/thebeardedbutchers/", why: "La cuenta de oficio de carnicero más grande: despiece filmado, educación de cortes ('qué corte sale de dónde')." },
    { handle: "@flannerybeef", img: "assets/ref/flannerybeef.jpg", url: "https://www.instagram.com/flannerybeef/", why: "Carnicería boutique chica con contenido de altísima calidad: no necesitas millones de seguidores, necesitas los correctos. Storytelling familiar + autoridad técnica." },
    { handle: "@meatthebutchers", img: "assets/ref/meatthebutchers.jpg", url: "https://www.instagram.com/meatthebutchers/", why: "Cómo se ve una cuenta moderna de venta de carne premium: producto + preparación + delivery." },
  ],
  tacticas: [
    { t: "ASMR sin música", d: "El formato #1 en comida 2025-26: sonido real del molino, el vapor, el chisporroteo, el cuchillo. Ya está en el calendario (09/09 y 11/09)." },
    { t: "Hook en los primeros 3 segundos", d: "Empieza en el momento más visual (el corte cayendo, el espresso saliendo). Nunca con logo ni intro. Pregunta, negación o proceso: '¿sabes de dónde sale…?', 'deja de…', 'así se ve…'" },
    { t: "Reels de 15-30 segundos", d: "Mayor tasa de finalización. 40-60s solo para testimoniales y trazabilidad con hook muy fuerte." },
    { t: "Batch production", d: "Una sesión de 60-90 min rinde 5-7 piezas. Con Sesión 1 (tienda) + Sesión 2 (finca/campo) al mes cubres las 12 fechas de cada marca. Es la vista 'Plan de rodaje'." },
    { t: "Educacional > promocional", d: "'Por qué la carne madurada sabe mejor', 'qué significa orgánico'. El contenido que inspira o educa gana al que vende. La venta es consecuencia." },
    { t: "Plantilla fija de subtítulos y tipografía", d: "Mismo font (Lato), misma posición en cada reel: el feed se vuelve reconocible sin logo. Montar como plantilla en Resolve (REEL_BASE)." },
    { t: "Trends: elegir el audio al editar, nunca antes", d: "Las piezas de trend (18/09) se graban neutras y el audio se elige la semana de publicar, cuando el trend está vigente." },
    { t: "Consistencia > cantidad", d: "3 por semana todas las semanas gana a 10 una semana y silencio. El calendario L-M-V existe para proteger esto." },
    { t: "Programar todo con Meta Business Suite", d: "Gratis. Deja programadas las piezas 'Listas' y que las Stories sean lo único en vivo. Así un evento inesperado no rompe el calendario." },
  ],
  mosaico: [
    { q: "coffee beans macro texture", img: "assets/ref/granos.jpg" },
    { q: "butcher board meat platter rustic", img: "assets/ref/tabla.jpg" },
    { q: "coffee farm colombia shade grown", img: "assets/ref/finca.jpg" },
    { q: "marbled steak rosemary butcher", img: "assets/ref/victorchurchill.jpg" },
    { q: "coffee roastery behind the scenes", img: "assets/ref/tostadora.jpg" },
    { q: "bbq ribs platter dark food photography", img: "assets/ref/ribs.jpg" },
    { q: "minimal coffee cup aesthetic light", img: "assets/ref/taza.jpg" },
    { q: "steak sear slices smoky", img: "assets/ref/maxthemeatguy.jpg" },
    { q: "coffee sack burlap beans", img: "assets/ref/costal.jpg" },
    { q: "espresso barista tools flat lay", img: "assets/ref/onyx.jpg" },
    { q: "t-bone raw steak ice knife", img: "assets/ref/beardedbutchers.jpg" },
    { q: "latte art cafe plants", img: "assets/ref/amorperfecto.jpg" },
  ],
};
