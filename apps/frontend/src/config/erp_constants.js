// ─── CONSTANTES DEL ERP ────────────────────────────────────────────────────────
export const FAMILIAS = [
  { codigo: "ALFB", desc: "ALFOMBRAS" },
  { codigo: "BLNC", desc: "BLANCOS" },
  { codigo: "BTCA", desc: "BUTACAS" },
  { codigo: "CDRT", desc: "CUADRANTE" },
  { codigo: "CLCH", desc: "COLCHAS" },
  { codigo: "CLCN", desc: "COLCHONES" },
  { codigo: "CNSM", desc: "CONSUMIBLES" },
  { codigo: "CORT", desc: "CORTINA" },
  { codigo: "CUBC", desc: "CUBRECANAPES" },
  { codigo: "ESBT", desc: "ESPUMA Y BOATA" },
  { codigo: "ESTR", desc: "ESTOR" },
  { codigo: "FUND", desc: "FUNDA" },
  { codigo: "HERR", desc: "HERRAMIENTAS" },
  { codigo: "HRRJ", desc: "HERRAJES" },
  { codigo: "LNCR", desc: "LENCERIA" },
  { codigo: "MADR", desc: "MADERA" },
  { codigo: "MLBR", desc: "MOBILIARIO" },
  { codigo: "MNOB", desc: "MANO DE OBRA" },
  { codigo: "MNTL", desc: "MANTELERIA" },
  { codigo: "MTOF", desc: "MATERIAL OFICINA" },
  { codigo: "PAVB", desc: "PAVIMENTO" },
  { codigo: "PLAD", desc: "PLAIDS" },
  { codigo: "PVAL", desc: "PAVIMENTO Y ALFOMBRAS" },
  { codigo: "RDAP", desc: "RODAPIE" },
  { codigo: "RELLE", desc: "RELLENOS" },
  { codigo: "RIBA", desc: "RIELES Y BARRAS" },
  { codigo: "RLLN", desc: "RELLENOS (2)" },
  { codigo: "RVST", desc: "REVESTIMIENTO" },
  { codigo: "SLLA", desc: "SILLAS" },
  { codigo: "SOFA", desc: "SOFAS" },
  { codigo: "SOMB", desc: "SOMBRA" },
  { codigo: "TELA", desc: "TELA" },
  { codigo: "VARI", desc: "ARTICULOS VARIOS" },
  { codigo: "MOTP", desc: "M.O. TAPIZADO" },
];

export const TIPOS = [
  { codigo: "ALF", desc: "ALFOMBRA", familia: "ALFB", idTipo: ["tamano"] },
  { codigo: "FLP", desc: "FELPUDO", familia: "ALFB", idTipo: ["tamano"] },
  { codigo: "SAB", desc: "SABANA", familia: "BLNC", idTipo: ["tamano"] },
  { codigo: "FND", desc: "FUNDA", familia: "BLNC", idTipo: ["tamano"] },
  { codigo: "MAN", desc: "MANTAS", familia: "BLNC", idTipo: ["tamano"] },
  { codigo: "BUT", desc: "BUTACA", familia: "BTCA", idTipo: ["variante", "tamano"] },
  { codigo: "POF", desc: "POOF/PUF", familia: "BTCA", idTipo: ["tamano"] },
  { codigo: "CJ", desc: "COJIN", familia: "CDRT", idTipo: ["variante", "tamano"] },
  { codigo: "QUAD", desc: "CUADRANTE", familia: "CDRT", idTipo: ["tamano"] },
  { codigo: "COL", desc: "COLCHA", familia: "CLCH", idTipo: ["tamano"] },
  { codigo: "EDR", desc: "EDREDON", familia: "CLCH", idTipo: ["tamano"] },
  { codigo: "CLN", desc: "COLCHON", familia: "CLCN", idTipo: ["tamano"] },
  { codigo: "VIS", desc: "VISILLO", familia: "CORT", idTipo: ["tamano"] },
  { codigo: "EST", desc: "ESTOR", familia: "ESTR", idTipo: ["tamano"] },
  { codigo: "BLK", desc: "BLACKOUT", familia: "ESTR", idTipo: ["tamano"] },
  { codigo: "FNS", desc: "FUNDA SOFA", familia: "FUND", idTipo: ["variante", "tamano"] },
  { codigo: "FNC", desc: "FUNDA COJIN", familia: "FUND", idTipo: ["variante", "tamano"] },
  { codigo: "FNB", desc: "FUNDA BUTACA", familia: "FUND", idTipo: ["variante"] },
  { codigo: "TOA", desc: "TOALLA", familia: "LNCR", idTipo: ["tamano"] },
  { codigo: "ALB", desc: "ALBORNOZ", familia: "LNCR", idTipo: ["variante"] },
  { codigo: "MNT", desc: "MANTEL", familia: "MNTL", idTipo: ["tamano"] },
  { codigo: "IND", desc: "INDIVIDUAL", familia: "MNTL", idTipo: ["tamano"] },
  { codigo: "CAM", desc: "CAMINO MESA", familia: "MNTL", idTipo: ["tamano"] },
  { codigo: "SRV", desc: "SERVILLETA", familia: "MNTL", idTipo: ["tamano"] },
  { codigo: "PLD", desc: "PLAID", familia: "PLAD", idTipo: ["tamano"] },
  { codigo: "RLL", desc: "RELLENO COJIN", familia: "RELLE", idTipo: ["tamano"] },
  { codigo: "RLLN", desc: "RELLENOS", familia: "RELLE", idTipo: ["tamano"] },
  { codigo: "PAP", desc: "PAPEL PARED", familia: "RVST", idTipo: ["tamano"] },
  { codigo: "VNL", desc: "VINILO", familia: "RVST", idTipo: ["tamano"] },
  { codigo: "MES", desc: "MESA", familia: "MLBR", idTipo: ["tamano"] },
  { codigo: "MSN", desc: "MESITA", familia: "MLBR", idTipo: ["tamano"] },
  { codigo: "SLL", desc: "SILLA", familia: "SLLA", idTipo: ["variante", "tamano"] },
  { codigo: "BNQ", desc: "BANQUETA", familia: "SLLA", idTipo: ["variante", "tamano"] },
  { codigo: "TAB", desc: "TABURETE", familia: "SLLA", idTipo: ["variante", "tamano"] },
  { codigo: "MOD", desc: "MODULO", familia: "SOFA", idTipo: ["variante", "tamano"] },
  { codigo: "CHI", desc: "CHAISE", familia: "SOFA", idTipo: ["tamano"] },
  { codigo: "REC", desc: "RECLINABLE", familia: "SOFA", idTipo: ["variante"] },
  { codigo: "RNC", desc: "RINCONERA", familia: "SOFA", idTipo: ["variante", "tamano"] },
  { codigo: "CMR", desc: "COLECCION", familia: "TELA", idTipo: ["modelo"] },
  { codigo: "MTS", desc: "METROS", familia: "TELA", idTipo: ["tamano"] },
  { codigo: "SOFA", desc: "SOFA", familia: "MOTP", idTipo: ["variante"] },
  { codigo: "SLL", desc: "SILLA", familia: "MOTP", idTipo: ["variante"] },
  { codigo: "BUT", desc: "BUTACA", familia: "MOTP", idTipo: ["variante"] },
];

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

export const KW = {
  familias: [
    { kw: ["alfombra", "alfombras", "felpudo", "moqueta"], cod: "ALFB" },
    { kw: ["sabana", "sabanas", "funda nordica", "nordico", "edredon", "blancos"], cod: "BLNC" },
    { kw: ["butaca", "butacas", "puf", "poof"], cod: "BTCA" },
    { kw: ["cojin", "cojines", "cuadrante", "almohadon", "funda cojin"], cod: "CDRT" },
    { kw: ["colcha", "colchas"], cod: "CLCH" },
    { kw: ["colchon", "colchones", "viscoelastico", "somier"], cod: "CLCN" },
    { kw: ["consumible", "consumibles", "material", "accesorio"], cod: "CNSM" },
    { kw: ["cortina", "cortinas", "visillo", "visillos", "panel japones"], cod: "CORT" },
    { kw: ["cubrecanape", "cubrecanapes", "cubre canape", "cubre sofa"], cod: "CUBC" },
    { kw: ["espuma", "boata", "goma espuma", "foam"], cod: "ESBT" },
    { kw: ["estor", "estores", "blackout", "black out", "screen", "enrollable"], cod: "ESTR" },
    { kw: ["funda sofa", "funda de sofa", "funda butaca", "funda silla", "funda cojin"], cod: "FUND" },
    { kw: ["herramienta", "herramientas", "utensilio", "util"], cod: "HERR" },
    { kw: ["herraje", "herrajes", "bisagra", "perno", "tornillo", "grapas"], cod: "HRRJ" },
    { kw: ["toalla", "toallas", "albornoz", "lenceria", "sabana bano"], cod: "LNCR" },
    { kw: ["madera", "listones", "tabla madera", "tablero", "dm", "contrachapado"], cod: "MADR" },
    {
      kw: ["mesa", "mesas", "mueble", "muebles", "mobiliario", "aparador", "armario",
        "estanteria", "libreria", "aparador", "comoda", "mesita", "escritorio"], cod: "MLBR"
    },
    { kw: ["mano de obra", "instalacion", "montaje", "labor"], cod: "MNOB" },
    { kw: ["mantel", "manteles", "manteleria", "individual", "bajoplato", "camino de mesa"], cod: "MNTL" },
    { kw: ["material oficina", "papeleria", "cartucho", "tinta"], cod: "MTOF" },
    { kw: ["pavimento", "pavimentos", "suelo", "tarima", "parquet", "baldosa", "ceramica"], cod: "PAVB" },
    { kw: ["plaid", "plaids", "manta sofa", "mantita"], cod: "PLAD" },
    { kw: ["rodapie", "rodapies", "zocalo"], cod: "RDAP" },
    { kw: ["relleno", "rellenos", "fibra", "guata", "almohada", "almohadas"], cod: "RELLE" },
    { kw: ["riel", "rieles", "barra cortina", "barras cortina", "soporte cortina", "anilla"], cod: "RIBA" },
    { kw: ["revestimiento", "papel pared", "vinilo", "papel pintado", "tapiz pared"], cod: "RVST" },
    { kw: ["silla", "sillas", "banqueta", "banquetas", "taburete", "taburetes"], cod: "SLLA" },
    { kw: ["sofa", "sofas", "modulo", "rinconera", "chaise", "chaiselongue", "reclinable"], cod: "SOFA" },
    { kw: ["sombra", "sombrilla", "toldo", "parasol", "vela sombra"], cod: "SOMB" },
    { kw: ["tela", "tejido", "textil", "metros", "metro lineal", "metraje", "rollo"], cod: "TELA" },
  ],
  tipos: [
    { kw: ["felpudo"], cod: "FLP", fam: "ALFB" },
    { kw: ["alfombra", "alfombras", "moqueta"], cod: "ALF", fam: "ALFB" },
    { kw: ["sabana", "sabanas"], cod: "SAB", fam: "BLNC" },
    { kw: ["edredon", "edredones", "nordico", "funda nordica"], cod: "EDR", fam: "BLNC" },
    { kw: ["manta", "mantas"], cod: "MAN", fam: "BLNC" },
    { kw: ["puf", "poof", "poff", "pouffe"], cod: "POF", fam: "BTCA" },
    { kw: ["butaca", "butacas"], cod: "BUT", fam: "BTCA" },
    { kw: ["cuadrante"], cod: "QUAD", fam: "CDRT" },
    { kw: ["cojin", "cojines", "almohadon decorativo", "funda cojin"], cod: "CJ", fam: "CDRT" },
    { kw: ["edredon", "nordico"], cod: "EDR", fam: "CLCH" },
    { kw: ["colcha", "colchas"], cod: "COL", fam: "CLCH" },
    { kw: ["viscoelastico", "viscoelastica", "visco", "memory"], cod: "VIS", fam: "CLCN" },
    { kw: ["colchon", "colchones"], cod: "CLN", fam: "CLCN" },
    { kw: ["panel japones", "panel corredor"], cod: "PAN", fam: "CORT" },
    { kw: ["visillo", "visillos"], cod: "VSL", fam: "CORT" },
    { kw: ["cortina", "cortinas"], cod: "CRT", fam: "CORT" },
    { kw: ["blackout", "black out"], cod: "BLK", fam: "ESTR" },
    { kw: ["estor", "estores", "enrollable", "screen"], cod: "EST", fam: "ESTR" },
    { kw: ["funda sofa", "funda de sofa"], cod: "FNS", fam: "FUND" },
    { kw: ["funda cojin", "funda de cojin"], cod: "FNC", fam: "FUND" },
    { kw: ["funda butaca"], cod: "FNB", fam: "FUND" },
    { kw: ["funda silla"], cod: "FNS", fam: "FUND" },
    { kw: ["albornoz", "albornoces"], cod: "ALB", fam: "LNCR" },
    { kw: ["toalla", "toallas"], cod: "TOA", fam: "LNCR" },
    { kw: ["mesa comedor", "mesa dining"], cod: "MSC", fam: "MLBR" },
    { kw: ["mesita", "mesita noche", "mesita auxiliar"], cod: "MSN", fam: "MLBR" },
    { kw: ["mesa", "mesas"], cod: "MES", fam: "MLBR" },
    { kw: ["aparador", "comoda", "armario", "estanteria"], cod: "MUB", fam: "MLBR" },
    { kw: ["mueble", "muebles", "mobiliario"], cod: "MBL", fam: "MLBR" },
    { kw: ["servilleta", "servilletas"], cod: "SRV", fam: "MNTL" },
    { kw: ["individual", "bajoplato"], cod: "IND", fam: "MNTL" },
    { kw: ["camino de mesa", "camino mesa"], cod: "CAM", fam: "MNTL" },
    { kw: ["mantel", "manteles"], cod: "MNT", fam: "MNTL" },
    { kw: ["plaid", "plaids", "manta sofa"], cod: "PLD", fam: "PLAD" },
    { kw: ["fibra", "guata"], cod: "FBR", fam: "RELLE" },
    { kw: ["relleno", "rellenos", "almohada", "almohadas"], cod: "RLL", fam: "RELLE" },
    { kw: ["vinilo"], cod: "VNL", fam: "RVST" },
    { kw: ["papel pared", "papel pintado", "tapiz"], cod: "PAP", fam: "RVST" },
    { kw: ["taburete", "taburetes"], cod: "TAB", fam: "SLLA" },
    { kw: ["banqueta", "banquetas"], cod: "BNQ", fam: "SLLA" },
    { kw: ["silla", "sillas"], cod: "SLL", fam: "SLLA" },
    { kw: ["chaise", "chaiselongue", "chaise longue"], cod: "CHI", fam: "SOFA" },
    { kw: ["reclinable", "relax", "butaca relax"], cod: "REC", fam: "SOFA" },
    { kw: ["rinconera", "esquinero"], cod: "RNC", fam: "SOFA" },
    { kw: ["modulo", "modulos", "sofa modular", "sofa", "sofas"], cod: "MOD", fam: "SOFA" },
    { kw: ["coleccion textil", "coleccion", "cmr"], cod: "CMR", fam: "TELA" },
    { kw: ["metro", "metros", "metro lineal", "metraje", "rollo"], cod: "MTS", fam: "TELA" },
  ],
  variantes: [
    { kw: ["cerrado", "cerrada", "cierre", "cremallera"], cod: "CER" },
    { kw: ["pasamaneria", "pasaman", "flecos", "franja"], cod: "PAS" },
    { kw: ["vivo", "ribete", "ribeteado"], cod: "VIV" },
    { kw: ["petaca"], cod: "PET" },
    { kw: ["bordado", "bordada"], cod: "BOR" },
    { kw: ["liso", "lisa", "unicolor"], cod: "LIS" },
    { kw: ["estampado", "estampada", "impreso", "print"], cod: "EST" },
    { kw: ["abierto", "abierta", "sin cierre"], cod: "ABT" },
    { kw: ["flecos"], cod: "FLE" },
  ],
};

// ─── UTILIDADES DE ANÁLISIS ──────────────────────────────────────────────────
export const norm = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
export const hasWord = (text, kws) => { const t = " " + norm(text) + " "; return kws.some((k) => t.includes(" " + norm(k) + " ")); };
export const hasSub = (text, kws) => { const t = norm(text); return kws.some((k) => t.includes(norm(k))); };

export function generateTypeCode(word) {
  if (!word) return null;
  const w = word.toUpperCase().replace(/[^A-Z]/g, '');
  if (w.length <= 3) return w.padEnd(3, 'X');
  const first = w[0];
  const consonants = w.slice(1).replace(/[AEIOU]/g, '');
  return (first + consonants).padEnd(3, 'X').slice(0, 3);
}

export function analyzeText(text) {
  const r = { familia: null, tipo: null, variante: null, ancho: null, alto: null, manualTypeGen: null };
  if (!text || text.trim().length < 2) return r;

  const tNorm = norm(text);

  if (tNorm.includes("tapizado") || tNorm.includes("tapizar")) {
    r.familia = "MOTP";
    if (tNorm.includes("sofa")) r.tipo = "SOFA";
    else if (tNorm.includes("silla")) r.tipo = "SLL";
    else if (tNorm.includes("butaca")) r.tipo = "BUT";

    let plazas = "";
    if (tNorm.includes("un plaza") || tNorm.includes("una plaza") || tNorm.includes("1")) plazas = "1";
    if (tNorm.includes("dos plaza") || tNorm.includes("2")) plazas = "2";
    if (tNorm.includes("tres plaza") || tNorm.includes("3")) plazas = "3";
    if (tNorm.includes("cuatro plaza") || tNorm.includes("4")) plazas = "4";

    let compl = "";
    if (tNorm.includes("complejo") || tNorm.includes("capitone")) compl = "C";
    else if (tNorm.includes("sencillo") || tNorm.includes("basico")) compl = "S";

    if (plazas || compl) {
      r.variante = plazas + compl;
      if (!r.tipo) {
        let familyKeywords = KW.familias.find(f => f.cod === r.familia)?.kw || [];
        const words = tNorm.replace("tapizado de ", "").split(/[\s,]+/);
        const firstWordRaw = words.find(w => {
          const nw = norm(w);
          return nw.length > 2 && !familyKeywords.some(k => norm(k).includes(nw));
        });
        const firstWord = firstWordRaw ? norm(firstWordRaw) : norm(words[0]);

        if (firstWord && firstWord.length > 2) {
          r.manualTypeGen = generateTypeCode(firstWord);
          r.tipo = r.manualTypeGen;
        }
      }
      return r;
    }
  }

  for (const f of KW.familias)
    if (hasWord(text, f.kw) || hasSub(text, f.kw)) { r.familia = f.cod; break; }

  for (const t of KW.tipos)
    if (hasWord(text, t.kw) || hasSub(text, t.kw)) { r.tipo = t.cod; break; }

  for (const v of KW.variantes)
    if (hasWord(text, v.kw) || hasSub(text, v.kw)) { r.variante = v.cod; break; }

  const sm = text.match(/(\d{1,3})\s*[xX\u00d7*]\s*(\d{1,3})/);
  if (sm) { r.ancho = sm[1]; r.alto = sm[2]; }

  if (r.familia && !r.tipo) {
    let familyKeywords = KW.familias.find(f => f.cod === r.familia)?.kw || [];
    const words = text.split(/[\s,]+/);
    const firstWordRaw = words.find(w => {
      const nw = norm(w);
      return nw.length > 2 && !familyKeywords.some(k => norm(k).includes(nw));
    });
    const firstWord = firstWordRaw ? norm(firstWordRaw) : norm(words[0]);

    if (firstWord && firstWord.length > 2) {
      r.manualTypeGen = generateTypeCode(firstWord);
      r.tipo = r.manualTypeGen;
    }
  }

  return r;
}

export function resolveIdTipo(tipoObj, anchoVal, altoVal, varianteVal, tieneModelo) {
  if (!tipoObj) return "variante";
  const modos = Array.isArray(tipoObj.idTipo) ? tipoObj.idTipo : [tipoObj.idTipo];
  if (anchoVal && altoVal && modos.includes("tamano")) return "tamano";
  if (tieneModelo && modos.includes("modelo")) return "modelo";
  if (varianteVal && modos.includes("variante")) return "variante";
  return modos[0];
}

export function decodeRef(ref) {
  const u = ref.toUpperCase().replace(/\s/g, "");
  const sortedFam = [...FAMILIAS].sort((a, b) => b.codigo.length - a.codigo.length);
  const fam = sortedFam.find((f) => u.startsWith(f.codigo));
  if (!fam) return null;
  const r1 = u.slice(fam.codigo.length);
  let tipo = null, tc = "";
  const sortedTipos = [...TIPOS].sort((a, b) => b.codigo.length - a.codigo.length);
  for (const t of sortedTipos) {
    if (r1.startsWith(t.codigo) && t.familia === fam.codigo) { tipo = t; tc = t.codigo; break; }
  }

  if (!tipo && /^[A-Z]{2,3}/.test(r1)) {
    tc = r1.match(/^[A-Z]{2,3}/)[0];
    tipo = { codigo: tc, desc: "AUTO", familia: fam.codigo, idTipo: ["tamano", "modelo", "variante"] };
  }

  if (!tipo) return { fam, tipo: null };
  const r2 = r1.slice(tc.length);
  const varMatch = VARIANTES.find((v) => r2 === v.codigo);
  const sizeMatch = /^\d+$/.test(r2) && r2.length >= 2 && r2.length % 2 === 0;
  const half = Math.floor(r2.length / 2);
  return {
    fam, tipo,
    variante: varMatch || null,
    ancho: sizeMatch ? r2.slice(0, half) : null,
    alto: sizeMatch ? r2.slice(half) : null,
    modeloRaw: (!varMatch && !sizeMatch && r2) ? r2 : null,
  };
}

const pad2 = (v) => (v ? String(v).padStart(2, "0") : "");

export function buildRef(familia, tipo, variante, ancho, alto, coleccion, modelo, color, idTipo) {
  if (!familia || !tipo) return "";
  let id = "";
  if (idTipo === "variante") id = variante || "";
  else if (idTipo === "tamano") id = ancho && alto ? pad2(ancho) + pad2(alto) : "";
  else if (idTipo === "modelo") id = (coleccion || "") + (modelo || "") + (color || "");
  return (familia + tipo + id).toUpperCase();
}
