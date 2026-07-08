// ─── CONSTANTES DEL ERP ────────────────────────────────────────────────────────
// Sistema de codificacion: FF TTT MMM NNN SS (13 caracteres)
// FF = Familia (2 letras)
// TTT = Tipo (3 alfanumericos)
// MMM = Medida 1 / Color (3 digitos)
// NNN = Medida 2 / Ancho (3 digitos)
// SS = Secuencial alfanumerico (01-ZZ, 1296 combinaciones)
// Excepciones: TE (TELAS) usa estructura especial TETTTCCCWWWSS

export const FAMILIAS = [
  { codigo: "AL", desc: "ALFOMBRAS" },
  { codigo: "BL", desc: "BLANCOS" },
  { codigo: "BU", desc: "BUTACAS" },
  { codigo: "CB", desc: "CUBRECANAPES" },
  { codigo: "CH", desc: "COLCHAS" },
  { codigo: "CN", desc: "COLCHONES" },
  { codigo: "CO", desc: "COLCHONES" },
  { codigo: "CR", desc: "CORTINAS" },
  { codigo: "CS", desc: "CONSUMIBLES" },
  { codigo: "CU", desc: "COJINES" },
  { codigo: "EB", desc: "ESPUMA Y BOATA" },
  { codigo: "ES", desc: "ESTORES" },
  { codigo: "FU", desc: "FUNDAS" },
  { codigo: "HE", desc: "HERRAMIENTAS" },
  { codigo: "HJ", desc: "HERRAJES" },
  { codigo: "LE", desc: "LENCERIA" },
  { codigo: "MA", desc: "MADERA" },
  { codigo: "MB", desc: "MOBILIARIO" },
  { codigo: "MN", desc: "MANO DE OBRA" },
  { codigo: "MT", desc: "MANTELERIA" },
  { codigo: "OF", desc: "MATERIAL OFICINA" },
  { codigo: "PA", desc: "PAVIMENTO" },
  { codigo: "PL", desc: "PLAIDS" },
  { codigo: "RB", desc: "RIELES Y BARRAS" },
  { codigo: "RE", desc: "RELLENOS" },
  { codigo: "RO", desc: "RODAPIE" },
  { codigo: "RV", desc: "REVESTIMIENTO" },
  { codigo: "SI", desc: "SILLAS" },
  { codigo: "SM", desc: "SOMBRA" },
  { codigo: "SO", desc: "SOFAS" },
  { codigo: "SY", desc: "ARTICULOS DE SISTEMA" },
  { codigo: "TE", desc: "TELAS" },
  { codigo: "VA", desc: "ARTICULOS VARIOS" },
];

export const TIPOS = [
  // ALFOMBRAS
  { codigo: "ALF", desc: "ALFOMBRA", familia: "AL" },
  { codigo: "FLP", desc: "FELPUDO", familia: "AL" },
  // BLANCOS
  { codigo: "SAB", desc: "SABANA", familia: "BL" },
  { codigo: "FND", desc: "FUNDA", familia: "BL" },
  { codigo: "MAN", desc: "MANTA", familia: "BL" },
  { codigo: "ALM", desc: "ALMOHADA", familia: "BL" },
  // BUTACAS
  { codigo: "BUT", desc: "BUTACA", familia: "BU" },
  { codigo: "POF", desc: "POUF/PUF", familia: "BU" },
  { codigo: "SIL", desc: "SILLON", familia: "BU" },
  { codigo: "OTO", desc: "OTOMANA", familia: "BU" },
  { codigo: "REL", desc: "RELAX", familia: "BU" },
  // COJINES
  { codigo: "COJ", desc: "COJIN SIMPLE", familia: "CU" },
  { codigo: "CES", desc: "COJIN ESPALDA", familia: "CU" },
  { codigo: "CAS", desc: "COJIN ASIENTO", familia: "CU" },
  { codigo: "CBR", desc: "COJIN BRAZO", familia: "CU" },
  { codigo: "CLU", desc: "COJIN LUMBAR", familia: "CU" },
  { codigo: "CRO", desc: "COJIN RULO", familia: "CU" },
  { codigo: "FCO", desc: "FUNDA COJIN", familia: "CU" },
  { codigo: "RCO", desc: "RELLENO COJIN", familia: "CU" },
  // COLCHAS
  { codigo: "COL", desc: "COLCHA", familia: "CH" },
  { codigo: "EDR", desc: "EDREDON", familia: "CH" },
  { codigo: "NID", desc: "NIDO", familia: "CH" },
  // COLCHONES
  { codigo: "CLN", desc: "COLCHON", familia: "CN" },
  { codigo: "TOP", desc: "TOPPER", familia: "CN" },
  { codigo: "SOM", desc: "SOMIER", familia: "CN" },
  // CORTINAS
  { codigo: "CCO", desc: "CORTINA CONFECCIONADA", familia: "CR" },
  { codigo: "OND", desc: "ONDA PERFECTA", familia: "CR" },
  { codigo: "FRU", desc: "FRUNCIDA", familia: "CR" },
  { codigo: "OLL", desc: "OLLAOS", familia: "CR" },
  { codigo: "VIS", desc: "VISILLO", familia: "CR" },
  { codigo: "OPC", desc: "OPACA", familia: "CR" },
  { codigo: "PJA", desc: "PANEL JAPONES", familia: "CR" },
  // ESTORES
  { codigo: "ENR", desc: "ENROLLABLE", familia: "ES" },
  { codigo: "SCR", desc: "SCREEN", familia: "ES" },
  { codigo: "OPA", desc: "OPACO", familia: "ES" },
  { codigo: "NYD", desc: "NOCHE Y DIA", familia: "ES" },
  { codigo: "PAQ", desc: "PAQUETO", familia: "ES" },
  { codigo: "PLI", desc: "PLEGABLE", familia: "ES" },
  { codigo: "MOT", desc: "MOTORIZADO", familia: "ES" },
  // FUNDAS
  { codigo: "FSO", desc: "FUNDA SOFA", familia: "FU" },
  { codigo: "FSI", desc: "FUNDA SILLA", familia: "FU" },
  { codigo: "FCO", desc: "FUNDA COJIN", familia: "FU" },
  { codigo: "FNB", desc: "FUNDA BUTACA", familia: "FU" },
  // HERRAJES
  { codigo: "BIS", desc: "BISAGRA", familia: "HJ" },
  { codigo: "TOR", desc: "TORNILLO", familia: "HJ" },
  { codigo: "TIR", desc: "TIRADOR", familia: "HJ" },
  { codigo: "COR", desc: "CORREDERA", familia: "HJ" },
  { codigo: "CER", desc: "CERRADURA", familia: "HJ" },
  // MADERA
  { codigo: "TAB", desc: "TABLERO", familia: "MA" },
  { codigo: "MDF", desc: "MDF", familia: "MA" },
  { codigo: "AGL", desc: "AGLOMERADO", familia: "MA" },
  { codigo: "CON", desc: "CONTRACHAPADO", familia: "MA" },
  { codigo: "MAC", desc: "MACIZA", familia: "MA" },
  { codigo: "LIS", desc: "LISTON", familia: "MA" },
  // MOBILIARIO
  { codigo: "MES", desc: "MESA", familia: "MB" },
  { codigo: "ARM", desc: "ARMARIO", familia: "MB" },
  { codigo: "EST", desc: "ESTANTERIA", familia: "MB" },
  { codigo: "APA", desc: "APARADOR", familia: "MB" },
  { codigo: "ZAP", desc: "ZAPATERO", familia: "MB" },
  // MANO DE OBRA
  { codigo: "TAP", desc: "TAPIZADO", familia: "MN" },
  { codigo: "CNF", desc: "CONFECCION", familia: "MN" },
  { codigo: "MON", desc: "MONTAJE", familia: "MN" },
  { codigo: "INS", desc: "INSTALACION", familia: "MN" },
  { codigo: "COR", desc: "CORTE", familia: "MN" },
  { codigo: "COS", desc: "COSIDO", familia: "MN" },
  { codigo: "EMB", desc: "EMBALAJE", familia: "MN" },
  { codigo: "DES", desc: "DESMONTAJE", familia: "MN" },
  { codigo: "TRA", desc: "TRANSPORTE", familia: "MN" },
  { codigo: "MED", desc: "MEDICION", familia: "MN" },
  { codigo: "REP", desc: "REPARACION", familia: "MN" },
  // CONSUMIBLES
  { codigo: "LIM", desc: "LIMPIEZA", familia: "CS" },
  { codigo: "PEG", desc: "PEGAMENTO", familia: "CS" },
  { codigo: "GRA", desc: "GRAPAS", familia: "CS" },
  { codigo: "TOR", desc: "TORNILLERIA", familia: "CS" },
  { codigo: "CIN", desc: "CINTA", familia: "CS" },
  { codigo: "HIL", desc: "HILO", familia: "CS" },
  { codigo: "CRE", desc: "CREMALLERA", familia: "CS" },
  { codigo: "VEL", desc: "VELCRO", familia: "CS" },
  { codigo: "ETI", desc: "ETIQUETAS", familia: "CS" },
  // RIELES Y BARRAS
  { codigo: "RIE", desc: "RIEL", familia: "RB" },
  { codigo: "BAR", desc: "BARRA", familia: "RB" },
  { codigo: "CUR", desc: "CURVA", familia: "RB" },
  { codigo: "SOP", desc: "SOPORTE", familia: "RB" },
  { codigo: "TER", desc: "TERMINAL", familia: "RB" },
  { codigo: "ANI", desc: "ANILLA", familia: "RB" },
  { codigo: "MOT", desc: "MOTOR", familia: "RB" },
  { codigo: "CAR", desc: "CARRO", familia: "RB" },
  { codigo: "ACC", desc: "ACCESORIO", familia: "RB" },
  // ESPUMA Y BOATA
  { codigo: "ESP", desc: "ESPUMA", familia: "EB" },
  { codigo: "BOA", desc: "BOATA", familia: "EB" },
  { codigo: "FIB", desc: "FIBRA", familia: "EB" },
  { codigo: "GUA", desc: "GUATA", familia: "EB" },
  { codigo: "VIS", desc: "VISCOELASTICA", familia: "EB" },
  { codigo: "HRE", desc: "ALTA RESILIENCIA", familia: "EB" },
  // RELLENOS
  { codigo: "PLU", desc: "PLUMA", familia: "RE" },
  { codigo: "FIB", desc: "FIBRA", familia: "RE" },
  // SILLAS
  { codigo: "COM", desc: "COMEDOR", familia: "SI" },
  { codigo: "COC", desc: "COCINA", familia: "SI" },
  { codigo: "OFF", desc: "OFICINA", familia: "SI" },
  { codigo: "EXT", desc: "EXTERIOR", familia: "SI" },
  { codigo: "PLG", desc: "PLEGABLE", familia: "SI" },
  { codigo: "TAB", desc: "TABURETE", familia: "SI" },
  { codigo: "BAN", desc: "BANQUETA", familia: "SI" },
  // SOFAS
  { codigo: "S01", desc: "SOFA 1 PLAZA", familia: "SO" },
  { codigo: "S02", desc: "SOFA 2 PLAZAS", familia: "SO" },
  { codigo: "S03", desc: "SOFA 3 PLAZAS", familia: "SO" },
  { codigo: "S04", desc: "SOFA 4 PLAZAS", familia: "SO" },
  { codigo: "S05", desc: "SOFA 5 PLAZAS", familia: "SO" },
  { codigo: "SCM", desc: "SOFA CAMA", familia: "SO" },
  { codigo: "MOD", desc: "MODULO", familia: "SO" },
  { codigo: "CHA", desc: "CHAISE LONGUE", familia: "SO" },
  { codigo: "RIN", desc: "RINCONERA", familia: "SO" },
  { codigo: "PUF", desc: "POUF SOFA", familia: "SO" },
  // TELAS (estructura especial: TE + TIPO + COLOR + ANCHO + SS)
  { codigo: "LIS", desc: "LISA", familia: "TE" },
  { codigo: "EST", desc: "ESTAMPADA", familia: "TE" },
  { codigo: "RAY", desc: "RAYADA", familia: "TE" },
  { codigo: "CUA", desc: "CUADROS", familia: "TE" },
  { codigo: "FLO", desc: "FLORES", familia: "TE" },
  { codigo: "GEO", desc: "GEOMETRICA", familia: "TE" },
  { codigo: "JAC", desc: "JACQUARD", familia: "TE" },
  { codigo: "DAM", desc: "DAMASCO", familia: "TE" },
  { codigo: "VEL", desc: "TERCIOPELO", familia: "TE" },
  { codigo: "LIN", desc: "LINO", familia: "TE" },
  { codigo: "ALG", desc: "ALGODON", familia: "TE" },
  { codigo: "SED", desc: "SEDA", familia: "TE" },
  { codigo: "PIE", desc: "PIEL/POLIPIEL", familia: "TE" },
  { codigo: "IGN", desc: "IGNIFUGA", familia: "TE" },
  { codigo: "OUT", desc: "OUTDOOR", familia: "TE" },
  { codigo: "BLA", desc: "BLACKOUT", familia: "TE" },
  { codigo: "SCR", desc: "SCREEN", familia: "TE" },
  { codigo: "VIS", desc: "VISILLO", familia: "TE" },
  { codigo: "TER", desc: "TERMICA", familia: "TE" },
  { codigo: "ACU", desc: "ACUSTICA", familia: "TE" },
];

// ─── UTILIDADES ───────────────────────────────────────────────────────────────

export function norm(text = '') {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const SEQ_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const SEQ_MAP = {};
const SEQ_LIST = [];
for (let i = 0; i < SEQ_CHARS.length; i++) {
  for (let j = 0; j < SEQ_CHARS.length; j++) {
    const seq = SEQ_CHARS[i] + SEQ_CHARS[j];
    SEQ_MAP[seq] = SEQ_LIST.length;
    SEQ_LIST.push(seq);
  }
}

function fitBlock(value = '', length = 2) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, length)
    .padEnd(length, '0');
}

function fitMedida(value, length = 3) {
  if (value === undefined || value === null || value === '') return '0'.repeat(length);
  const num = parseInt(String(value).replace(/\D/g, ''), 10);
  if (isNaN(num)) return '0'.repeat(length);
  return String(num).slice(0, length).padStart(length, '0');
}

export function seqNext(currentSeq) {
  const idx = currentSeq ? SEQ_MAP[currentSeq] : -1;
  const nextIdx = idx + 1;
  if (nextIdx >= SEQ_LIST.length) return null;
  return SEQ_LIST[nextIdx];
}

export function seqFirst() {
  return SEQ_LIST[0];
}

// ─── DETECCION DE FAMILIA Y TIPO ──────────────────────────────────────────────

const KW_FAMILIAS = [
  { kw: ["alfombra", "alfombras", "felpudo"], cod: "AL" },
  { kw: ["sabana", "sabanas", "funda nordica", "nordico", "edredon", "blancos", "almohada"], cod: "BL" },
  { kw: ["butaca", "butacas", "puf", "poof", "sillon", "otomana", "relax"], cod: "BU" },
  { kw: ["cubrecanape", "cubrecanapes", "cubre sofa", "cubrecanape"], cod: "CB" },
  { kw: ["colcha", "colchas", "nido"], cod: "CH" },
  { kw: ["colchon", "colchones", "viscoelastico", "somier", "topper"], cod: "CN" },
  { kw: ["cojin", "cojines", "cuadrante", "almohadon", "funda cojin", "relleno cojin"], cod: "CU" },
  { kw: ["consumible", "consumibles", "limpieza", "pegamento", "grapas", "cinta", "hilo"], cod: "CS" },
  { kw: ["cortina", "cortinas", "confeccianada", "onda perfecta", "fruncida", "ollaos"], cod: "CR" },
  { kw: ["espuma", "boata", "goma espuma", "foam", "guata", "viscoelastica", "hr", "alta resiliencia"], cod: "EB" },
  { kw: ["estor", "estores", "enrollable", "screen", "paqueto", "plegable", "blackout", "noche y dia"], cod: "ES" },
  { kw: ["funda sofa", "funda de sofa", "funda butaca", "funda silla", "funda cojin"], cod: "FU" },
  { kw: ["herramienta", "herramientas", "utensilio"], cod: "HE" },
  { kw: ["herraje", "herrajes", "bisagra", "perno", "tornillo", "tirador", "corredera", "cerradura"], cod: "HJ" },
  { kw: ["toalla", "toallas", "albornoz", "lenceria", "mantel", "servilleta", "camino mesa"], cod: "LE" },
  { kw: ["madera", "listones", "tabla madera", "tablero", "dm", "mdf", "aglomerado", "contrachapado", "maciza"], cod: "MA" },
  { kw: ["mesa", "armario", "estanteria", "aparador", "zapatero", "mobiliario"], cod: "MB" },
  { kw: ["mano de obra", "tapizado", "confeccion", "montaje", "instalacion", "corte", "cosido", "embalaje", "transporte", "medicion", "reparacion"], cod: "MN" },
  { kw: ["tela", "telas", "tejido", "lisa", "estampada", "rayada", "jacquard", "dril", "linoh", "algodon", "seda", "terciopelo", "piel", "polipiel", "blackout", "screen", "visillo", "ignifuga", "outdoor", "tropical"], cod: "TE" },
  { kw: ["riel", "rieles", "barra", "barras", "soporte", "curva", "terminal", "anilla", "motor", "carro"], cod: "RB" },
  { kw: ["silla", "sillas", "taburete", "banqueta", "comedor", "oficina", "exterior", "plegable"], cod: "SI" },
  { kw: ["sofa", "sofas", "chaise", "meridiana", "rinconera", "modulo", "sofa cama", "poff", "puf"], cod: "SO" },
  { kw: ["toldo", "sombra", "pergola", "sombrilla"], cod: "SM" },
  { kw: ["revestimiento", "papel pintado", "vinilo", "panel"], cod: "RV" },
  { kw: ["rodapie", "rodapies", "zcocalo"], cod: "RO" },
  { kw: ["plaid", "plaids"], cod: "PL" },
  { kw: ["pavimento", "tarima", "vinilo"], cod: "PA" },
  { kw: ["relleno", "pluma", "fibra"], cod: "RE" },
];

const KW_TIPOS = {
  CU: [
    { kw: ["simple", "cojin"], cod: "COJ" },
    { kw: ["espalda", "respaldo"], cod: "CES" },
    { kw: ["asiento"], cod: "CAS" },
    { kw: ["brazo"], cod: "CBR" },
    { kw: ["lumbar", "rinonera"], cod: "CLU" },
    { kw: ["rulo", "cilindrico"], cod: "CRO" },
    { kw: ["funda"], cod: "FCO" },
    { kw: ["relleno"], cod: "RCO" },
  ],
  SO: [
    { kw: ["1 plaza", "1plaza", "un plaza"], cod: "S01" },
    { kw: ["2 plazas", "2plazas", "dos plazas"], cod: "S02" },
    { kw: ["3 plazas", "3plazas", "tres plazas"], cod: "S03" },
    { kw: ["4 plazas", "4plazas", "cuatro plazas"], cod: "S04" },
    { kw: ["5 plazas", "5plazas", "cinco plazas"], cod: "S05" },
    { kw: ["cama", "sofa cama"], cod: "SCM" },
    { kw: ["modulo"], cod: "MOD" },
    { kw: ["chaise", "meridiana"], cod: "CHA" },
    { kw: ["rinconera"], cod: "RIN" },
    { kw: ["puf", "poff"], cod: "PUF" },
  ],
  CR: [
    { kw: ["confeccianada", "confec"], cod: "CCO" },
    { kw: ["onda"], cod: "OND" },
    { kw: ["fruncida"], cod: "FRU" },
    { kw: ["ollaos"], cod: "OLL" },
    { kw: ["visillo"], cod: "VIS" },
    { kw: ["opaca", "blackout"], cod: "OPC" },
    { kw: ["panel japones", "japones"], cod: "PJA" },
  ],
  ES: [
    { kw: ["enrollable"], cod: "ENR" },
    { kw: ["screen"], cod: "SCR" },
    { kw: ["opaco", "blackout"], cod: "OPA" },
    { kw: ["noche y dia", "nyd"], cod: "NYD" },
    { kw: ["paqueto"], cod: "PAQ" },
    { kw: ["plegable"], cod: "PLI" },
    { kw: ["motorizado", "motor"], cod: "MOT" },
  ],
  TE: [
    { kw: ["lisa", "liso"], cod: "LIS" },
    { kw: ["estampada", "estampado"], cod: "EST" },
    { kw: ["rayada", "rayas"], cod: "RAY" },
    { kw: ["cuadros"], cod: "CUA" },
    { kw: ["flores", "floral"], cod: "FLO" },
    { kw: ["geometrica", "geometrico"], cod: "GEO" },
    { kw: ["jacquard"], cod: "JAC" },
    { kw: ["damasco"], cod: "DAM" },
    { kw: ["terciopelo", "velvet", "velour"], cod: "VEL" },
    { kw: ["lino"], cod: "LIN" },
    { kw: ["algodon", "algodon 100"], cod: "ALG" },
    { kw: ["seda", "simil seda"], cod: "SED" },
    { kw: ["piel", "polipiel", "piel sintetica"], cod: "PIE" },
    { kw: ["ignifuga", "ignifugo"], cod: "IGN" },
    { kw: ["outdoor", "exterior"], cod: "OUT" },
    { kw: ["blackout", "opaca"], cod: "BLA" },
    { kw: ["screen"], cod: "SCR" },
    { kw: ["visillo"], cod: "VIS" },
    { kw: ["termica"], cod: "TER" },
    { kw: ["acustica"], cod: "ACU" },
  ],
  RB: [
    { kw: ["riel"], cod: "RIE" },
    { kw: ["barra"], cod: "BAR" },
    { kw: ["curva", "esquinero"], cod: "CUR" },
    { kw: ["soporte"], cod: "SOP" },
    { kw: ["terminal", "remate"], cod: "TER" },
    { kw: ["anilla", "argolla"], cod: "ANI" },
    { kw: ["motor"], cod: "MOT" },
    { kw: ["carro"], cod: "CAR" },
    { kw: ["accesorio"], cod: "ACC" },
  ],
  BU: [
    { kw: ["butaca"], cod: "BUT" },
    { kw: ["puf", "poof"], cod: "POF" },
    { kw: ["sillon"], cod: "SIL" },
    { kw: ["otomana"], cod: "OTO" },
    { kw: ["relax"], cod: "REL" },
  ],
  MN: [
    { kw: ["tapizado"], cod: "TAP" },
    { kw: ["confeccion"], cod: "CNF" },
    { kw: ["montaje"], cod: "MON" },
    { kw: ["instalacion"], cod: "INS" },
    { kw: ["corte"], cod: "COR" },
    { kw: ["cosido"], cod: "COS" },
    { kw: ["embalaje"], cod: "EMB" },
    { kw: ["desmontaje"], cod: "DES" },
    { kw: ["transporte"], cod: "TRA" },
    { kw: ["medicion"], cod: "MED" },
    { kw: ["reparacion"], cod: "REP" },
  ],
};

function hasWord(text, keywords) {
  const t = ' ' + text.toUpperCase() + ' ';
  return keywords.some(kw => t.includes(' ' + kw.toUpperCase() + ' '));
}

function hasSub(text, keywords) {
  const t = text.toUpperCase();
  return keywords.some(kw => t.includes(kw.toUpperCase()));
}

export function analyzeText(text) {
  const r = {
    familia: null,
    tipo: null,
    variante: null,
    medida1: null,
    medida2: null,
    color: null,
    ancho: null
  };
  if (!text || text.trim().length < 2) return r;

  const tNorm = norm(text);

  for (const f of KW_FAMILIAS) {
    if (hasWord(text, f.kw) || hasSub(tNorm, f.kw)) {
      r.familia = f.cod;
      break;
    }
  }

  if (r.familia && KW_TIPOS[r.familia]) {
    for (const t of KW_TIPOS[r.familia]) {
      if (hasWord(text, t.kw) || hasSub(tNorm, t.kw)) {
        r.tipo = t.cod;
        break;
      }
    }
  }

  const medidas = text.match(/(\d{1,3})\s*[xX×]\s*(\d{1,3})/);
  if (medidas) {
    r.medida1 = medidas[1];
    r.medida2 = medidas[2];
  } else {
    const solo = text.match(/\b(\d{1,3})\b/);
    if (solo) r.medida1 = solo[1];
  }

  return r;
}

export function resolveIdTipo(tipoObj, medida1, medida2, variante) {
  if (!tipoObj) return 'tamano';
  const modos = Array.isArray(tipoObj.idTipo) ? tipoObj.idTipo : [tipoObj.idTipo];
  if (medida1 && medida2 && modos.includes('tamano')) return 'tamano';
  if (variante && modos.includes('variante')) return 'variante';
  return modos[0] || 'tamano';
}

// ─── GENERADOR DE REFERENCIA (10 CARACTERES) ─────────────────────────────────
// Formato: FF TTT M X N
// Ejemplo: CU COJ 50 X 50 = CUCOJ50X50
// Longitud: 2 + 3 + hasta 2 + 1 + hasta 2 = max 10

export function buildRef(familia, tipo, variante, medida1, medida2, coleccion, modelo, color, idTipo, descripcion = '') {
  if (!familia) return '';

  const familiaBlock = fitBlock(familia, 2);
  const tipoBlock = fitBlock(tipo, 3);

  // Para telas (TE) usar estructura especial: TE + TIPO + COLOR + ANCHO
  if (familia === 'TE') {
    const colorBlock = fitMedida(color, 3);
    const anchoBlock = fitMedida(medida1, 3);
    return `${familiaBlock}${tipoBlock}${colorBlock}${anchoBlock}`;
  }

  // Formato general: FF TTT M X N (sin ceros, max 10 chars)
  // Medidas de 1-3 digitos, sin ceros a la izquierda
  const med1 = String(medida1 || '0').replace(/\D/g, '').slice(-3); // ultimos 3 digitos
  const med2 = String(medida2 || '0').replace(/\D/g, '').slice(-3);

  // Calcular longitud total y ajustar si es necesario
  const base = `${familiaBlock}${tipoBlock}${med1}X${med2}`;

  // Si pasa de 10 chars, truncar medidas proporcionalmente
  if (base.length > 10) {
    const maxMedLen = Math.floor((10 - 6) / 2); // 6 = FF(2) + TTT(3) + X(1)
    const truncMed1 = med1.slice(-maxMedLen);
    const truncMed2 = med2.slice(-maxMedLen);
    return `${familiaBlock}${tipoBlock}${truncMed1}X${truncMed2}`;
  }

  return base;
}

export function decodeRef(ref) {
  const u = String(ref || '').toUpperCase().replace(/\s/g, '').replace(/x/g, 'X');
  // Aceptar formato con X (8-12 chars) o 13 chars (telas)
  if (!u.includes('X') && u.length !== 13) return null;

  const familyBlock = u.slice(0, 2);
  const fam = FAMILIAS.find(f => f.codigo === familyBlock) || null;

  if (!fam) return null;

  if (familyBlock === 'TE' && u.length === 13) {
    return {
      familia: 'TE',
      tipo: u.slice(2, 5),
      color: u.slice(5, 8),
      ancho: u.slice(8, 11),
      familiaObj: fam
    };
  }

  // Formato normal: FF TTT M X N (donde M y N son 1-3 digitos)
  // FF = 2 chars, TTT = 3 chars, luego medida1 (1-3 chars), X, medida2 (1-3 chars)
  const xIndex = u.indexOf('X');
  const medida1 = u.slice(5, xIndex);
  const medida2 = u.slice(xIndex + 1);

  return {
    familia: familyBlock,
    tipo: u.slice(2, 5),
    medida1,
    medida2,
    familiaObj: fam
  };
}

export function isValidRef(ref) {
  const u = String(ref || '').trim().toUpperCase().replace(/\s/g, '').replace(/x/g, 'X');
  // Formato con X: 6-10 chars (FF TTT M X N)
  if (u.includes('X')) {
    const xIndex = u.indexOf('X');
    // FF(2) + TTT(3) + M(1-3) + X(1) + N(1-3) = 8-12
    if (u.length < 8 || u.length > 12) return false;
    // Verificar estructura
    const ff = u.slice(0, 2);
    const ttt = u.slice(2, xIndex);
    const m = u.slice(xIndex + 1);
    if (!/^[A-Z]{2}$/.test(ff)) return false;
    if (!/^[A-Z0-9]{3}$/.test(ttt)) return false;
    if (!/^[0-9]{1,3}$/.test(m)) return false;
    return true;
  }
  // Formato 13 para telas
  if (u.length === 13) {
    return /^[A-Z]{2}[A-Z0-9]{3}[0-9]{3}[0-9]{3}$/.test(u);
  }
  return false;
}

export function refToDescripcion(ref) {
  const decoded = decodeRef(ref);
  if (!decoded) return null;

  const { familia, tipo, medida1, medida2, familiaObj } = decoded;

  // Buscar descripcion del tipo
  const tipoObj = TIPOS.find(t => t.codigo === tipo && t.familia === familia);
  const tipoDesc = tipoObj ? tipoObj.desc : tipo;

  // Construir descripcion
  let desc = tipoDesc;

  // Agregar medidas si existen
  if (medida1 && medida1 !== '0') {
    desc += ` ${medida1}`;
    if (medida2 && medida2 !== '0') {
      desc += `X${medida2}`;
    }
  }

  return desc;
}

// ─── EXPORTACIONES ADICIONALES ───────────────────────────────────────────────

export const VARIANTES = [
  { codigo: "CER", desc: "CERRADO" },
  { codigo: "PAS", desc: "PASAMANERIA" },
  { codigo: "VIV", desc: "VIVO" },
  { codigo: "PET", desc: "PETACA" },
  { codigo: "BOR", desc: "BORDADO" },
  { codigo: "LIS", desc: "LISO" },
  { codigo: "EST", desc: "ESTAMPADO" },
  { codigo: "ABT", desc: "ABIERTO" },
  { codigo: "FLE", desc: "FLECOS" },
  { codigo: "3C", desc: "3P. COMPLEJO" },
  { codigo: "3S", desc: "3P. SENCILLO" },
  { codigo: "2C", desc: "2P. COMPLEJO" },
  { codigo: "2S", desc: "2P. SENCILLO" },
  { codigo: "1C", desc: "1P. COMPLEJO" },
  { codigo: "1S", desc: "1P. SENCILLO" },
];

export { KW_FAMILIAS, KW_TIPOS };

// ─── GENERADOR DE TARIFAS (para ViewTarifas) ─────────────────────────────────

const TARIFA_GENERIC_WORDS = ['TELA', 'ROLLO', 'METRAJE'];
const TARIFA_MATERIAL_WORDS = new Set([
  'CO', 'PES', 'VI', 'PC', 'PA', 'PP', 'LI', 'CV', 'PL', 'PAN', 'WO', 'FR',
  'WADD', 'EMBR', 'LIN', 'ORGANIC', 'RECYCLE', 'RECYCLED', 'RECYCL'
]);
const TARIFA_JOINER_WORDS = new Set(['A', 'AN', 'AND', 'D', 'DE', 'DEL', 'DES', 'DU', 'EL', 'EN', 'ET', 'LA', 'LE', 'LES']);
const TARIFA_MODIFIER_WORDS = new Set([
  'FR', 'OUTDOOR', 'INDOOR', 'INTERIOR', 'EXTERIOR', 'PLAIN', 'RECYCLE',
  'RECYCLED', 'REFLET', 'SHEER', 'VELVET'
]);

function normalizeTarifaText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

function stripTarifaGenericWords(value) {
  return TARIFA_GENERIC_WORDS.reduce(
    (acc, word) => acc.replace(new RegExp(`\\b${word}\\b`, 'g'), ' '),
    normalizeTarifaText(value)
  ).replace(/\s+/g, ' ').trim();
}

function tokenizeTarifaName(value) {
  return stripTarifaGenericWords(value)
    .replace(/[^A-Z0-9%]+/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function isCompositionToken(token) {
  return /^[0-9]+%$/.test(token)
    || /^EMBR[A-Z0-9]*$/.test(token)
    || TARIFA_MATERIAL_WORDS.has(token)
    || token === '&';
}

function isVariantToken(token) {
  return /^[A-Z]?\d{3,5}[A-Z]?$/.test(token)
    || /^\d{1,2}$/.test(token)
    || /^[A-Z]\d{1,2}$/.test(token);
}

function looksTechnicalTarifaName(value) {
  const stripped = stripTarifaGenericWords(value);
  return /^[A-Z]{2,5}[./_-]\d/.test(stripped) || /^[A-Z]{2,5}\d/.test(stripped);
}

function buildTarifaIdentity(value) {
  const stripped = stripTarifaGenericWords(value);
  if (!stripped) {
    return { baseCompact: '', duplicateKey: '', variantKey: '' };
  }

  if (looksTechnicalTarifaName(stripped)) {
    const technical = stripped.replace(/[^A-Z0-9]/g, '');
    return { baseCompact: technical, duplicateKey: technical, variantKey: '' };
  }

  let tokens = tokenizeTarifaName(stripped);
  while (tokens.length && (isCompositionToken(tokens[0]) || /^\d+$/.test(tokens[0]) || TARIFA_JOINER_WORDS.has(tokens[0]))) {
    tokens.shift();
  }

  if (!tokens.length) {
    const fallback = stripped.replace(/[^A-Z0-9]/g, '');
    return { baseCompact: fallback, duplicateKey: fallback, variantKey: '' };
  }

  const variantTokens = [];
  while (tokens.length > 1 && isVariantToken(tokens[tokens.length - 1])) {
    variantTokens.unshift(tokens.pop());
  }

  const modifierTokens = [];
  while (tokens.length > 1 && TARIFA_MODIFIER_WORDS.has(tokens[tokens.length - 1])) {
    modifierTokens.unshift(tokens.pop());
  }

  const baseTokens = tokens.filter((token) => !TARIFA_JOINER_WORDS.has(token));
  const normalizedBaseTokens = baseTokens.length ? baseTokens : tokens;
  const baseCompact = normalizedBaseTokens.join('');
  const modifierSource = variantTokens.length
    ? variantTokens.join('')
    : modifierTokens.length
      ? modifierTokens[modifierTokens.length - 1]
      : '';

  let variantKey = '';
  if (modifierSource) {
    const cleanModifier = modifierSource.replace(/[^A-Z0-9]/g, '');
    if (/^[A-Z]\d+/.test(cleanModifier)) variantKey = `${cleanModifier[0]}${cleanModifier.match(/\d/)[0]}`;
    else if (/^\d+$/.test(cleanModifier)) variantKey = cleanModifier.slice(-2).padStart(2, '0');
    else variantKey = cleanModifier.slice(0, 2).padEnd(2, 'X');
  }

  const duplicateKey = [baseCompact, modifierTokens.join(''), variantTokens.join('')]
    .filter(Boolean)
    .join('|');

  return { baseCompact, duplicateKey, variantKey };
}

export function cleanTarifaNombre(value) {
  return buildTarifaIdentity(value).baseCompact;
}

export function normalizeTarifaDuplicateKey(value) {
  return buildTarifaIdentity(value).duplicateKey;
}

export function resolveTarifaTipo(value) {
  const normalized = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

  if (normalized.includes('ROLLO')) return 'R';
  if (normalized.includes('METRAJE')) return 'M';
  return 'X';
}

export function formatTarifaAncho(ancho) {
  if (!ancho) return '000';
  const str = String(ancho).replace(',', '.');
  const num = parseFloat(str);
  if (isNaN(num)) return '000';
  return String(Math.round(num)).padStart(3, '0').slice(-3);
}

export function generateTarifaRef(_familia, descripcion, ancho) {
  const tipo = resolveTarifaTipo(descripcion);
  const identity = buildTarifaIdentity(descripcion || '');
  const nombreNormalizado = identity.baseCompact;
  const duplicateKey = identity.duplicateKey;
  const nombre5 = identity.variantKey
    ? `${nombreNormalizado.slice(0, 3).padEnd(3, 'X')}${identity.variantKey}`
    : nombreNormalizado.slice(0, 5).padEnd(5, 'X');
  const nombre3 = nombreNormalizado.slice(0, 3).padEnd(3, 'X');
  const ancho3 = formatTarifaAncho(ancho);
  const referenciaBase = `TELA${tipo}${nombre5}${ancho3}`;

  return {
    tipo,
    nombre_normalizado: nombreNormalizado,
    duplicate_key: duplicateKey,
    nombre5,
    nombre3,
    ancho3,
    serie: `${tipo}${nombre5}`,
    clave_descripcion: `TELA-${tipo}-${nombre5}-${ancho3}`,
    referencia: referenciaBase,
  };
}

export function detectColumn(headers, field) {
  const fieldLower = field.toLowerCase();
  const mappings = {
    familia: ['familia', 'fam', 'family'],
    articulo: ['articulo', 'art', 'artículo', 'nombre', 'nombre tela', 'descripcion de producto', 'descripcion', 'descripción', 'producto', 'name', 'description', 'desc'],
    ancho: ['ancho', 'ancho tapicería', 'ancho cm', 'medida', 'width', 'ancho tapiceria'],
    alto: ['alto', 'alto cm', 'largo', 'longitud', 'height', 'largo cm'],
    precio: ['precio', 'pvp', 'precio venta', 'p.v.p', 'price'],
    descripcion: ['descripcion de producto', 'descripcion', 'descripción', 'nombre tela', 'nombre', 'producto', 'detail', 'detalle', 'description', 'desc', 'name']
  };

  const candidates = mappings[fieldLower] || [fieldLower];

  for (let i = 0; i < headers.length; i++) {
    const h = String(headers[i] || '').toLowerCase().trim();
    if (candidates.some(c => h.includes(c))) {
      return i;
    }
  }
  return -1;
}
