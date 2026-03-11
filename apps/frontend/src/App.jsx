import { useState, useEffect, useMemo, useRef } from "react";
import { Routes, Route, Link } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./components/Login";
import { useAuth } from "./context/AuthContext";
import DirectoryGenerator from './components/DirectoryGenerator';
import Backoffice from './components/Backoffice';
import TicketModal from './components/TicketModal';
import { dbService } from './dbService';
import * as XLSX from 'xlsx';

// ─── FAMILIAS REALES DE LA EMPRESA ────────────────────────────────────────────
const FAMILIAS = [
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

// ─── TIPOS POR FAMILIA ────────────────────────────────────────────────────────
// idTipo es array: primero = modo por defecto. CJ y similares aceptan variante Y tamano.
const TIPOS = [
  // ALFOMBRAS
  { codigo: "ALF", desc: "ALFOMBRA", familia: "ALFB", idTipo: ["tamano"] },
  { codigo: "FLP", desc: "FELPUDO", familia: "ALFB", idTipo: ["tamano"] },
  // BLANCOS
  { codigo: "SAB", desc: "SABANA", familia: "BLNC", idTipo: ["tamano"] },
  { codigo: "FND", desc: "FUNDA", familia: "BLNC", idTipo: ["tamano"] },
  { codigo: "MAN", desc: "MANTAS", familia: "BLNC", idTipo: ["tamano"] },
  // BUTACAS
  { codigo: "BUT", desc: "BUTACA", familia: "BTCA", idTipo: ["variante", "tamano"] },
  { codigo: "POF", desc: "POOF/PUF", familia: "BTCA", idTipo: ["tamano"] },
  // CUADRANTE (cojines, cuadrantes)
  { codigo: "CJ", desc: "COJIN", familia: "CDRT", idTipo: ["variante", "tamano"] },
  { codigo: "QUAD", desc: "CUADRANTE", familia: "CDRT", idTipo: ["tamano"] },
  // COLCHAS
  { codigo: "COL", desc: "COLCHA", familia: "CLCH", idTipo: ["tamano"] },
  { codigo: "EDR", desc: "EDREDON", familia: "CLCH", idTipo: ["tamano"] },
  // COLCHONES
  { codigo: "CLN", desc: "COLCHON", familia: "CLCN", idTipo: ["tamano"] },
  { codigo: "VIS", desc: "VISCOELASTICO", familia: "CLCN", idTipo: ["tamano"] },
  // CORTINA
  { codigo: "CRT", desc: "CORTINA", familia: "CORT", idTipo: ["tamano"] },
  { codigo: "VIS", desc: "VISILLO", familia: "CORT", idTipo: ["tamano"] },
  { codigo: "PAN", desc: "PANEL", familia: "CORT", idTipo: ["tamano"] },
  // ESTOR
  { codigo: "EST", desc: "ESTOR", familia: "ESTR", idTipo: ["tamano"] },
  { codigo: "BLK", desc: "BLACKOUT", familia: "ESTR", idTipo: ["tamano"] },
  // FUNDA
  { codigo: "FNS", desc: "FUNDA SOFA", familia: "FUND", idTipo: ["variante", "tamano"] },
  { codigo: "FNC", desc: "FUNDA COJIN", familia: "FUND", idTipo: ["variante", "tamano"] },
  { codigo: "FNB", desc: "FUNDA BUTACA", familia: "FUND", idTipo: ["variante"] },
  // LENCERIA
  { codigo: "TOA", desc: "TOALLA", familia: "LNCR", idTipo: ["tamano"] },
  { codigo: "ALB", desc: "ALBORNOZ", familia: "LNCR", idTipo: ["variante"] },
  // MANTELERIA
  { codigo: "MNT", desc: "MANTEL", familia: "MNTL", idTipo: ["tamano"] },
  { codigo: "IND", desc: "INDIVIDUAL", familia: "MNTL", idTipo: ["tamano"] },
  { codigo: "CAM", desc: "CAMINO MESA", familia: "MNTL", idTipo: ["tamano"] },
  { codigo: "SRV", desc: "SERVILLETA", familia: "MNTL", idTipo: ["tamano"] },
  // PLAIDS
  { codigo: "PLD", desc: "PLAID", familia: "PLAD", idTipo: ["tamano"] },
  // RELLENOS
  { codigo: "RLL", desc: "RELLENO COJIN", familia: "RELLE", idTipo: ["tamano"] },
  { codigo: "FBR", desc: "FIBRA", familia: "RELLE", idTipo: ["tamano"] },
  // REVESTIMIENTO
  { codigo: "PAP", desc: "PAPEL PARED", familia: "RVST", idTipo: ["tamano"] },
  { codigo: "VNL", desc: "VINILO", familia: "RVST", idTipo: ["tamano"] },
  // MLBR-MOBILIARIO
  { codigo: "MES", desc: "MESA", familia: "MLBR", idTipo: ["tamano"] },
  { codigo: "MSN", desc: "MESITA", familia: "MLBR", idTipo: ["tamano"] },
  { codigo: "MSC", desc: "MESA COMEDOR", familia: "MLBR", idTipo: ["tamano"] },
  { codigo: "MUB", desc: "MUEBLE BAJO", familia: "MLBR", idTipo: ["variante", "tamano"] },
  { codigo: "MBL", desc: "MUEBLE", familia: "MLBR", idTipo: ["variante"] },
  // SLLA-SILLAS
  { codigo: "SLL", desc: "SILLA", familia: "SLLA", idTipo: ["variante", "tamano"] },
  { codigo: "BNQ", desc: "BANQUETA", familia: "SLLA", idTipo: ["variante", "tamano"] },
  { codigo: "TAB", desc: "TABURETE", familia: "SLLA", idTipo: ["variante", "tamano"] },
  // SOFAS
  { codigo: "MOD", desc: "MODULO", familia: "SOFA", idTipo: ["variante", "tamano"] },
  { codigo: "CHI", desc: "CHAISE", familia: "SOFA", idTipo: ["tamano"] },
  { codigo: "REC", desc: "RECLINABLE", familia: "SOFA", idTipo: ["variante"] },
  { codigo: "RNC", desc: "RINCONERA", familia: "SOFA", idTipo: ["variante", "tamano"] },
  // TELA
  { codigo: "CMR", desc: "COLECCION", familia: "TELA", idTipo: ["modelo"] },
  { codigo: "MTS", desc: "METROS", familia: "TELA", idTipo: ["tamano"] },
  // MANO DE OBRA TAPIZADO (MOTP)
  { codigo: "SOFA", desc: "SOFA", familia: "MOTP", idTipo: ["variante"] },
  { codigo: "SLL", desc: "SILLA", familia: "MOTP", idTipo: ["variante"] },
  { codigo: "BUT", desc: "BUTACA", familia: "MOTP", idTipo: ["variante"] },
];

const VARIANTES = [
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

// ─── MOTOR DE ANÁLISIS DE TEXTO ───────────────────────────────────────────────
const norm = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const hasWord = (text, kws) => { const t = " " + norm(text) + " "; return kws.some((k) => t.includes(" " + norm(k) + " ")); };
const hasSub = (text, kws) => { const t = norm(text); return kws.some((k) => t.includes(norm(k))); };

// Keywords mapeadas con las familias REALES de la empresa
const KW = {
  // ── FAMILIAS ─────────────────────────────────────────────────────────────────
  // Orden importa: mas especifico primero para evitar falsos positivos
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
    // MLBR: mesas, muebles, mobiliario — IMPORTANTE: antes de SLLA/SOFA
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

  // ── TIPOS ────────────────────────────────────────────────────────────────────
  tipos: [
    // ALFB
    { kw: ["felpudo"], cod: "FLP", fam: "ALFB" },
    { kw: ["alfombra", "alfombras", "moqueta"], cod: "ALF", fam: "ALFB" },
    // BLNC
    { kw: ["sabana", "sabanas"], cod: "SAB", fam: "BLNC" },
    { kw: ["edredon", "edredones", "nordico", "funda nordica"], cod: "EDR", fam: "BLNC" },
    { kw: ["manta", "mantas"], cod: "MAN", fam: "BLNC" },
    // BTCA
    { kw: ["puf", "poof", "poff", "pouffe"], cod: "POF", fam: "BTCA" },
    { kw: ["butaca", "butacas"], cod: "BUT", fam: "BTCA" },
    // CDRT
    { kw: ["cuadrante"], cod: "QUAD", fam: "CDRT" },
    { kw: ["cojin", "cojines", "almohadon decorativo", "funda cojin"], cod: "CJ", fam: "CDRT" },
    // CLCH
    { kw: ["edredon", "nordico"], cod: "EDR", fam: "CLCH" },
    { kw: ["colcha", "colchas"], cod: "COL", fam: "CLCH" },
    // CLCN
    { kw: ["viscoelastico", "viscoelastica", "visco", "memory"], cod: "VIS", fam: "CLCN" },
    { kw: ["colchon", "colchones"], cod: "CLN", fam: "CLCN" },
    // CORT
    { kw: ["panel japones", "panel corredor"], cod: "PAN", fam: "CORT" },
    { kw: ["visillo", "visillos"], cod: "VSL", fam: "CORT" },
    { kw: ["cortina", "cortinas"], cod: "CRT", fam: "CORT" },
    // ESTR
    { kw: ["blackout", "black out"], cod: "BLK", fam: "ESTR" },
    { kw: ["estor", "estores", "enrollable", "screen"], cod: "EST", fam: "ESTR" },
    // FUND
    { kw: ["funda sofa", "funda de sofa"], cod: "FNS", fam: "FUND" },
    { kw: ["funda cojin", "funda de cojin"], cod: "FNC", fam: "FUND" },
    { kw: ["funda butaca"], cod: "FNB", fam: "FUND" },
    { kw: ["funda silla"], cod: "FNS", fam: "FUND" },
    // LNCR
    { kw: ["albornoz", "albornoces"], cod: "ALB", fam: "LNCR" },
    { kw: ["toalla", "toallas"], cod: "TOA", fam: "LNCR" },
    // MLBR — mesas y muebles
    { kw: ["mesa comedor", "mesa dining"], cod: "MSC", fam: "MLBR" },
    { kw: ["mesita", "mesita noche", "mesita auxiliar"], cod: "MSN", fam: "MLBR" },
    { kw: ["mesa", "mesas"], cod: "MES", fam: "MLBR" },
    { kw: ["aparador", "comoda", "armario", "estanteria"], cod: "MUB", fam: "MLBR" },
    { kw: ["mueble", "muebles", "mobiliario"], cod: "MBL", fam: "MLBR" },
    // MNTL
    { kw: ["servilleta", "servilletas"], cod: "SRV", fam: "MNTL" },
    { kw: ["individual", "bajoplato"], cod: "IND", fam: "MNTL" },
    { kw: ["camino de mesa", "camino mesa"], cod: "CAM", fam: "MNTL" },
    { kw: ["mantel", "manteles"], cod: "MNT", fam: "MNTL" },
    // PLAD
    { kw: ["plaid", "plaids", "manta sofa"], cod: "PLD", fam: "PLAD" },
    // RELLE
    { kw: ["fibra", "guata"], cod: "FBR", fam: "RELLE" },
    { kw: ["relleno", "rellenos", "almohada", "almohadas"], cod: "RLL", fam: "RELLE" },
    // RVST
    { kw: ["vinilo"], cod: "VNL", fam: "RVST" },
    { kw: ["papel pared", "papel pintado", "tapiz"], cod: "PAP", fam: "RVST" },
    // SLLA
    { kw: ["taburete", "taburetes"], cod: "TAB", fam: "SLLA" },
    { kw: ["banqueta", "banquetas"], cod: "BNQ", fam: "SLLA" },
    { kw: ["silla", "sillas"], cod: "SLL", fam: "SLLA" },
    // SOFA
    { kw: ["chaise", "chaiselongue", "chaise longue"], cod: "CHI", fam: "SOFA" },
    { kw: ["reclinable", "relax", "butaca relax"], cod: "REC", fam: "SOFA" },
    { kw: ["rinconera", "esquinero"], cod: "RNC", fam: "SOFA" },
    { kw: ["modulo", "modulos", "sofa modular", "sofa", "sofas"], cod: "MOD", fam: "SOFA" },
    // TELA
    { kw: ["coleccion textil", "coleccion", "cmr"], cod: "CMR", fam: "TELA" },
    { kw: ["metro", "metros", "metro lineal", "metraje", "rollo"], cod: "MTS", fam: "TELA" },
  ],

  // ── VARIANTES ────────────────────────────────────────────────────────────────
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


// ─── ALGORITMO DE CONTRACCIÓN (AUTO-GENERATOR) ────────────────────────────────
function generateTypeCode(word) {
  if (!word) return null;
  const w = word.toUpperCase().replace(/[^A-Z]/g, '');
  if (w.length <= 3) return w.padEnd(3, 'X');
  // Tomar la primera letra, y luego extraer las siguientes 2 consonantes
  const first = w[0];
  const consonants = w.slice(1).replace(/[AEIOU]/g, '');
  return (first + consonants).padEnd(3, 'X').slice(0, 3);
}

function analyzeText(text) {
  const r = { familia: null, tipo: null, variante: null, ancho: null, alto: null, manualTypeGen: null };
  if (!text || text.trim().length < 2) return r;

  const tNorm = norm(text);

  //---MOTOR DE REGLAS DE NEGOCIO (SEMÁNTICO)---
  if (tNorm.includes("tapizado") || tNorm.includes("tapizar")) {
    r.familia = "MOTP";
    if (tNorm.includes("sofa")) r.tipo = "SOFA";
    else if (tNorm.includes("silla")) r.tipo = "SLL";
    else if (tNorm.includes("butaca")) r.tipo = "BUT";

    // Buscar cantidad de plazas
    let plazas = "";
    if (tNorm.includes("un plaza") || tNorm.includes("una plaza") || tNorm.includes("1")) plazas = "1";
    if (tNorm.includes("dos plaza") || tNorm.includes("2")) plazas = "2";
    if (tNorm.includes("tres plaza") || tNorm.includes("3")) plazas = "3";
    if (tNorm.includes("cuatro plaza") || tNorm.includes("4")) plazas = "4";

    // Buscar complejidad
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
  //----------------------------------------------

  for (const f of KW.familias)
    if (hasWord(text, f.kw) || hasSub(text, f.kw)) { r.familia = f.cod; break; }

  for (const t of KW.tipos)
    if (hasWord(text, t.kw) || hasSub(text, t.kw)) { r.tipo = t.cod; break; }

  for (const v of KW.variantes)
    if (hasWord(text, v.kw) || hasSub(text, v.kw)) { r.variante = v.cod; break; }

  // Acepta: 40x60, 40X60, 40 x 60, 150x100, 40*60
  const sm = text.match(/(\d{1,3})\s*[xX\u00d7*]\s*(\d{1,3})/);
  if (sm) { r.ancho = sm[1]; r.alto = sm[2]; }

  // Si encontró familia pero no tipo, intentamos auto-generar un tipo evitando palabras de la familia
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
      r.tipo = r.manualTypeGen; // Se asigna temporalmente para que visualmente haya código
    }
  }

  return r;
}

// idTipo dinamico: decide el modo segun lo que haya detectado/escrito el usuario
function resolveIdTipo(tipoObj, anchoVal, altoVal, varianteVal, tieneModelo) {
  if (!tipoObj) return "variante";
  const modos = Array.isArray(tipoObj.idTipo) ? tipoObj.idTipo : [tipoObj.idTipo];
  if (anchoVal && altoVal && modos.includes("tamano")) return "tamano";
  if (tieneModelo && modos.includes("modelo")) return "modelo";
  if (varianteVal && modos.includes("variante")) return "variante";
  return modos[0];
}

// ─── DECODIFICADOR ────────────────────────────────────────────────────────────
function decodeRef(ref) {
  const u = ref.toUpperCase().replace(/\s/g, "");
  // Buscar familia por codigo (de mas largo a mas corto para evitar conflictos)
  const sortedFam = [...FAMILIAS].sort((a, b) => b.codigo.length - a.codigo.length);
  const fam = sortedFam.find((f) => u.startsWith(f.codigo));
  if (!fam) return null;
  const r1 = u.slice(fam.codigo.length);
  let tipo = null, tc = "";
  const sortedTipos = [...TIPOS].sort((a, b) => b.codigo.length - a.codigo.length);
  for (const t of sortedTipos) {
    if (r1.startsWith(t.codigo) && t.familia === fam.codigo) { tipo = t; tc = t.codigo; break; }
  }

  // Si no hay tipo registrado en la familia, pero hay unas letras que parecen tipo auto-generado
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

function buildRef(familia, tipo, variante, ancho, alto, coleccion, modelo, color, idTipo) {
  if (!familia || !tipo) return "";
  let id = "";
  if (idTipo === "variante") id = variante || "";
  else if (idTipo === "tamano") id = ancho && alto ? pad2(ancho) + pad2(alto) : "";
  else if (idTipo === "modelo") id = (coleccion || "") + (modelo || "") + (color || "");
  return (familia + tipo + id).toUpperCase();
}

// ─── DEMO DB ──────────────────────────────────────────────────────────────────
const DEMO = [
  { id: "1", ref: "CDRTCJCER", desc: "COJIN CERRADO", familia: "CDRT", tipo: "CJ", variante: "CER", ancho: null, alto: null, fecha: "2024-01-10", user: "admin" },
  { id: "2", ref: "CDRTCJ4060", desc: "COJIN 40x60", familia: "CDRT", tipo: "CJ", variante: null, ancho: "40", alto: "60", fecha: "2024-01-15", user: "admin" },
  { id: "3", ref: "SLLASLL6060", desc: "SILLA 60x60", familia: "SLLA", tipo: "SLL", variante: null, ancho: "60", alto: "60", fecha: "2024-02-01", user: "diseno" },
  { id: "4", ref: "SOFAMODCER", desc: "SOFA MODULO CERRADO", familia: "SOFA", tipo: "MOD", variante: "CER", ancho: null, alto: null, fecha: "2024-02-10", user: "admin" },
  { id: "5", ref: "ESTRESTBK", desc: "ESTOR BLACKOUT", familia: "ESTR", tipo: "BLK", variante: null, ancho: null, alto: null, fecha: "2024-03-05", user: "ventas" },
];

// ─── ESTILOS ──────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');
*,*::before,*::after{ box-sizing: border-box; margin: 0; padding: 0 }
:root{
 --bg:#0f0f0f;--s1:#161616;--s2:#1e1e1e;
 --br:#2a2a2a;--br2:#333;
 --acc: #f0c040;--acc2: #e8a820;
 --red: #e05252;--green:#52c97e;--blue:#5290e0;
 --tx: #e8e8e8;--tx2:#999;--tx3:#555;
 --mono: 'IBM Plex Mono', monospace;
 --sans: 'IBM Plex Sans', sans-serif;
}
body{ background: var(--bg); color: var(--tx); font-family: var(--sans); min-height: 100vh }
::selection{ background: var(--acc); color:#000 }
::-webkit-scrollbar{ width: 4px }
::-webkit-scrollbar-track{ background: var(--s1) }
::-webkit-scrollbar-thumb{ background: var(--br2); border-radius: 2px }
.app{ display: flex; flex-direction: column; min-height: 100vh }
.hdr{
  background: var(--s1); border-bottom: 1px solid var(--br); padding: 0 24px; height: 54px;
  display: flex; align-items: center; gap: 24px; position: sticky; top: 0; z-index: 100
}
.hdr-logo{
  font-family: var(--mono); font-size: 13px; font-weight: 700; letter-spacing: .1em;
  color: var(--acc); display: flex; align-items: center; gap: 8px
}
.hdr-dot{ width: 7px; height: 7px; background: var(--acc); border-radius: 50 %}
.nav{ display: flex; gap: 2px }
.nav-btn{
  background: none; border: none; padding: 6px 14px; font-family: var(--mono); font-size: 11px;
  font-weight: 500; letter-spacing: .08em; text-transform: uppercase; color: var(--tx2);
  cursor: pointer; border-radius: 4px; transition:all .15s
}
.nav-btn:hover{ color: var(--tx); background: var(--s2) }
.nav-btn.on{ color: var(--acc); background: rgba(240, 192, 64, .08) }
.hdr-meta{ font-family: var(--mono); font-size: 10px; color: var(--tx3); margin-left: auto }
.hdr-meta span{ color: var(--tx2) }
.main{ flex: 1; padding: 28px 24px; max-width: 1040px; margin: 0 auto; width: 100 %}
.stitle{
  font-family: var(--mono); font-size: 10px; font-weight: 600; letter-spacing: .15em;
  text-transform: uppercase; color: var(--tx3); margin-bottom: 20px;
  display: flex; align-items: center; gap: 10px
}
.stitle::after{ content: ''; flex: 1; height: 1px; background: var(--br) }
.card{ background: var(--s1); border: 1px solid var(--br); border-radius: 6px; padding: 20px }
.big-area{
  width: 100 %; background: var(--s2); border: 1px solid var(--br2); border-radius: 6px;
  padding: 14px 16px; font-family: var(--sans); font-size: 15px; font-weight: 500; color: var(--tx);
  outline: none; resize: none; line-height: 1.5; transition: border-color .15s; min-height: 76px
}
.big-area::placeholder{ color: var(--tx3); font-size: 13px }
.big-area:focus{ border-color: var(--acc) }
.area-hint{ font-family: var(--mono); font-size: 10px; color: var(--tx3); margin-top: 6px }
.area-hint.code{ color: rgba(240, 192, 64, .6) }
.ref-box{
  background: var(--bg); border: 1px solid var(--br); border-left: 3px solid var(--acc);
  border-radius: 4px; padding: 16px 20px; margin: 16px 0;
  display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap
}
.ref-box.over{ border-left-color: var(--red) }
.ref-box.dup{ border-left-color: #ffb300 }
.rp-left{ flex: 1 }
.rp-lbl{
  font-family: var(--mono); font-size: 10px; letter-spacing: .1em; text-transform: uppercase;
  color: var(--tx3); margin-bottom: 6px
}
.rp-code{
  font-family: var(--mono); font-size: 26px; font-weight: 700; letter-spacing: .05em;
  color: var(--acc); line-height: 1; word-break: break-all
}
.rp-code.over{ color: var(--red) }
.rp-code.dup{ color: #ffb300 }
.rp-segs{ display: flex; gap: 5px; margin-top: 8px; flex-wrap: wrap }
.seg{ padding: 3px 9px; border-radius: 3px; font-family: var(--mono); font-size: 11px; font-weight: 600 }
.seg-f{ background: rgba(240, 192, 64, .12); color: var(--acc); border: 1px solid rgba(240, 192, 64, .3) }
.seg-t{ background: rgba(82, 201, 126, .12); color: var(--green); border: 1px solid rgba(82, 201, 126, .3) }
.seg-i{ background: rgba(82, 144, 224, .12); color: var(--blue); border: 1px solid rgba(82, 144, 224, .3) }
.rp-right{ text-align: right; flex-shrink: 0 }
.rp-len{ font-family: var(--mono); font-size: 24px; font-weight: 700; color: var(--tx2) }
.rp-len.ok{ color: var(--acc) }
.rp-len.over{ color: var(--red) }
.rp-sub{ font-family: var(--mono); font-size: 9px; color: var(--tx3); letter-spacing: .06em; margin-top: 2px }
.sec-lbl{
  font-family: var(--mono); font-size: 10px; letter-spacing: .1em; text-transform: uppercase;
  color: var(--tx3); margin-bottom: 8px; margin-top: 20px
}
.chip-row { 
  display: flex; 
  flex-wrap: wrap; 
  gap: 6px; 
  margin-top: 5px;
}
.chip {
  padding: 4px 10px; border-radius: 4px; border: 1px solid var(--br2); background: var(--s2);
  font-family: var(--mono); font-size: 10px; font-weight: 600; color: var(--tx2); cursor: pointer;
  transition: all .12s; display: flex; align-items: center; gap: 4px;
}
.chip:hover { border-color: var(--acc); color: var(--acc); }
.chip.on { background: rgba(240, 192, 64, 0.1); border-color: var(--acc); color: var(--acc); }
.chip-sub { font-weight: 400; font-size: 9px; opacity: 0.5; }
.size-row{ display: flex; align-items: flex-end; gap: 10px; flex-wrap: wrap; margin-top: 6px }
.size-field{ display: flex; flex-direction: column; gap: 5px }
.size-lbl{ font-family: var(--mono); font-size: 10px; letter-spacing: .1em; color: var(--tx3); text-transform: uppercase }
.size-in { width: 78px; background:var(--s2); border: 1px solid var(--br2); border-radius: 5px;
padding: 9px 10px; font-family: var(--mono); font-size: 16px; font-weight: 700; color: var(--acc);
outline: none; text-align: center; transition: border-color .15s}
.size-in:focus{ border-color: var(--acc) }
.size-x{ font-family: var(--mono); font-size: 16px; color: var(--tx3); padding-bottom: 9px }
.size-preview{ font-family: var(--mono); font-size: 12px; color: var(--green); padding-bottom: 9px }
.mod-row{ display: flex; gap: 10px; flex-wrap: wrap; margin-top: 6px }
.mod-field{ display: flex; flex-direction: column; gap: 5px }
.mod-lbl{ font-family: var(--mono); font-size: 10px; letter-spacing: .1em; color: var(--tx3); text-transform: uppercase }
.mod-in { background:var(--s2); border: 1px solid var(--br2); border-radius: 5px;
padding: 8px 10px; font-family: var(--mono); font-size: 13px; font-weight: 700; color: var(--acc);
outline: none; text-transform: uppercase; transition: border-color .15s}
.mod-in:focus{ border-color: var(--acc) }
.alert{
  padding: 9px 13px; border-radius: 5px; font-family: var(--mono); font-size: 11px;
  display: flex; align-items: center; gap: 8px; margin-bottom: 10px; letter-spacing: .02em
}
.a-ok{ background: rgba(82, 201, 126, .08); border: 1px solid rgba(82, 201, 126, .25); color: var(--green) }
.a-w{ background: rgba(255, 179, 0, .08); border: 1px solid rgba(255, 179, 0, .3); color: #ffb300 }
.a-e{ background: rgba(224, 82, 82, .08); border: 1px solid rgba(224, 82, 82, .25); color: var(--red) }
.switch-btn{margin-top: 10px; background: none; border: 1px solid var(--br2); color: var(--tx3);
font-family: var(--mono); font-size: 10px; padding: 5px 12px; border-radius: 4px; cursor: pointer;
transition:all .14s; letter-spacing: .05em; text-transform: uppercase}
.switch-btn:hover{ border-color: var(--tx2); color: var(--tx2) }
.btn-row{ display: flex; gap: 10px; flex-wrap: wrap; margin-top: 22px }
.btn{
  display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 5px;
  border: none; font-family: var(--mono); font-size: 11px; font-weight: 700; letter-spacing: .08em;
  text-transform: uppercase; cursor: pointer; transition:all .14s
}
.btn-p{ background: var(--acc); color:#000 }
.btn-p: hover: not(: disabled){ background: var(--acc2); transform: translateY(-1px) }
.btn-p:disabled{ opacity: .3; cursor: not-allowed }
.btn-g{ background: none; border: 1px solid var(--br2); color: var(--tx2) }
.btn-g:hover{ border-color: var(--tx2); color: var(--tx) }
.divider{ height: 1px; background: var(--br); margin: 22px 0 }
.sim-row{ display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px }
.sim-chip{
  padding: 5px 11px; border-radius: 4px; background: var(--s2); border: 1px solid var(--br2);
  font-family: var(--mono); font-size: 11px; color: var(--tx2); cursor: pointer; transition:all .14s
}
.sim-chip:hover{ border-color: var(--acc); color: var(--acc) }
.stats-row{ display: flex; gap: 8px; margin-bottom: 22px; flex-wrap: wrap }
.stat{
  flex: 1; min-width: 80px; background: var(--s1); border: 1px solid var(--br); border-radius: 6px;
  padding: 12px 14px; cursor: pointer; transition: border-color .15s
}
.stat:hover{ border-color: var(--br2) }
.stat.on{ border-color: var(--acc) }
.stat-n{ font-family: var(--mono); font-size: 20px; font-weight: 700; color: var(--acc) }
.stat-l{
  font-family: var(--mono); font-size: 9px; letter-spacing: .1em; text-transform: uppercase;
  color: var(--tx3); margin-top: 3px
}
.search-row{ display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap }
.search-in { flex: 1; min-width: 160px; background: var(--s1); border: 1px solid var(--br2);
border-radius: 5px; padding: 8px 13px; font-family: var(--mono); font-size: 12px; color: var(--tx);
outline: none; transition: border-color .15s}
.search-in:focus{ border-color: var(--acc) }
.search-sel{
  background: var(--s1); border: 1px solid var(--br2); border-radius: 5px;
  padding: 8px 12px; font-family: var(--mono); font-size: 12px; color: var(--tx);
  outline: none; appearance: none; min-width: 140px
}
.h-list{ display: flex; flex-direction: column; gap: 5px }
.h-row{
  display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--s1);
  border: 1px solid var(--br); border-radius: 6px; cursor: pointer; transition: border-color .15s; flex-wrap: wrap
}
.h-row:hover{ border-color: var(--acc) }
.h-ref{ font-family: var(--mono); font-size: 13px; font-weight: 700; color: var(--acc); min-width: 130px }
.h-desc{ flex: 1; font-size: 12px; color: var(--tx2); min-width: 100px }
.h-tags{ display: flex; gap: 4px }
.h-date{ font-family: var(--mono); font-size: 9px; color: var(--tx3); flex-shrink: 0 }
.h-use{
  font-family: var(--mono); font-size: 9px; font-weight: 700; letter-spacing: .07em;
  padding: 4px 10px; border-radius: 4px; background: rgba(240, 192, 64, .08);
  border: 1px solid rgba(240, 192, 64, .2); color: var(--acc); cursor: pointer;
  flex-shrink: 0; transition:all .14s; white-space: nowrap
}
.h-use:hover{ background: var(--acc); color:#000 }
.empty{ text-align: center; padding: 40px 20px; font-family: var(--mono); font-size: 11px; color: var(--tx3) }
.foot{ font-family: var(--mono); font-size: 9px; color: var(--tx3); text-align: right; margin-top: 10px }

/* RESPONSIVE DESIGN FOR REFGEN */
@media(max-width: 650px) {
  .hdr { height: auto; padding: 15px; flex-wrap: wrap; gap: 15px; justify-content: center; }
  .hdr-meta { margin-left: 0; width: 100 %; text-align: center; }
  .nav { border-top: 1px solid var(--br); margin-top: 5px; padding-top: 15px; width: 100 %; justify-content: center; flex-wrap: wrap; }
  .ref-box { flex-direction: column; align-items: flex-start; gap: 10px; }
  .rp-right { text-align: left; margin-top: 5px; }
  .rp-code { font-size: 20px; }
  .size-row, .mod-row { flex-direction: column; align-items: stretch; }
  .size-field, .mod-field { width: 100 %; }
  .size-in, .mod-in { width: 100 %; text-align: left;
}
  .size-x, .size-preview { align-self: center; padding: 5px 0; }
  .btn-row { flex-direction: column; width: 100 %; }
  .btn { width: 100 %; justify-content: center; }
  .stats-row { flex-direction: column; }
  .stat { width: 100 %; }
  .search-row { flex-direction: column; }
  .search-in, .search-sel { width: 100 %; }
  .h-row { flex-direction: column; align-items: flex-start; gap: 10px; }
  .h-use { align-self: stretch; text-align: center; }
  .stitle { margin-top: 20px; }
  .main { padding: 15px; }
}

/* PANEL DASHBOARD-PREMIUM POLISH */
.dash-wrap { display: flex; flex-direction: column; height: 100vh; background: #0a0a0a; color: var(--tx); overflow: hidden; }
.dash-hdr { height: 56px; border-bottom: 1px solid var(--br); display: flex; align-items: center; justify-content: space-between; padding: 0 24px; background: rgba(22, 22, 22, 0.8); backdrop-filter: blur(10px); flex-shrink: 0; z-index: 1000; }
.dash-body { display: flex; flex: 1; overflow: hidden; background: #000; gap: 1px; align-items: stretch; justify-content: center; }
.panel { display: flex; flex-direction: column; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); background: var(--bg); overflow: hidden; position: relative; height: 100%; }
.panel.active { flex: 1.2; min-width: 400px; background: var(--bg); }
.panel.collapsed { width: 60px; min-width: 60px; cursor: pointer; background: var(--s1); border-right: 1px solid var(--br); flex: 0 0 60px; }
.panel.collapsed:hover { background: var(--s2); border-right-color: var(--acc); }

.p-hdr { height: 54px; padding: 0 20px; display: flex; align-items: center; justify-content: space-between; font-family: var(--mono); font-weight: 700; border-bottom: 1px solid var(--br); background: rgba(30, 30, 30, 0.4); cursor: pointer; user-select: none; color: var(--tx); transition: background 0.2s; }
.p-hdr:hover { background: rgba(42, 42, 42, 0.6); }

.collapse-btn { background: none; border: none; color: var(--tx3); cursor: pointer; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 6px; transition: all 0.2s; opacity: 0.5; }
.collapse-btn:hover { background: rgba(255, 255, 255, 0.05); color: var(--acc); opacity: 1; transform: scale(1.1); }

.p-hdr-vert { writing-mode: vertical-rl; text-orientation: mixed; padding: 30px 0; height: 100%; display: flex; align-items: center; justify-content: flex-start; gap: 15px; color: var(--tx3); font-family: var(--mono); letter-spacing: 3px; font-size: 11px; font-weight: 700; opacity: 0.6; transition: all 0.3s; }
.panel.collapsed:hover .p-hdr-vert { opacity: 1; color: var(--acc); transform: translateY(-5px); }
.p-icon { display: flex; align-items: center; justify-content: center; color: var(--acc); filter: drop-shadow(0 0 8px rgba(240, 192, 64, 0.2)); }
.p-content { flex: 1; overflow-y: auto; display: flex; flex-direction: column; background: var(--bg); position: relative; scrollbar-width: thin; height: calc(100% - 54px); }

/* Dashboard Header refinements */
.logo-main { display: flex; align-items: center; gap: 10px; font-family: var(--mono); font-weight: 800; color: var(--acc); }
.logo-dot { width: 8px; height: 8px; background: var(--acc); border-radius: 50 %; box-shadow: 0 0 10px var(--acc); }

@media(max-width: 900px) {
  .dash-hdr { padding: 0 15px; height: 50px; }
  .logo-main { fontSize: 13px; }
  .dash-body { flex-direction: column; overflow-y: auto; align-items: stretch; height: auto; }
  .panel { height: auto; border-bottom: 1px solid var(--br); flex: none; }
  .panel.active { min-height: 0; flex: none; width: 100%; border-right: none; }
  .panel.collapsed { width: 100%; height: 50px; min-height: 50px; flex: none; border-right: none; }
  .p-hdr-vert { writing-mode: horizontal-tb; height: 100%; width: 100%; padding: 0 20px; justify-content: flex-start; flex-direction: row; }
  .main { padding: 15px; }
  .card { padding: 15px; }
  .chip-row { 
    display: grid; 
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); 
    gap: 6px; 
  }
  .chip { padding: 10px 14px; font-size: 11px; justify-content: space-between; border-radius: 6px; }
  .chip-sub { display: block; }
  .rp-code { font-size: 24px; }
  .ref-box { padding: 15px; }
}

/* Fix RefGen Inside Panel */
.app { flex: 1; display: flex; flex-direction: column; max-width: none; min-height: 0; padding: 0; background: transparent; }
.main { flex: 1; overflow-y: auto; padding: 25px 30px; max-width: 1100px; margin: 0 auto; width: 100%; }

/* RESTORE PERFECT REF-BOX */
.ref-box {
  background: rgba(22, 22, 22, 0.6); border: 1px solid var(--br); border-left: 4px solid var(--acc);
  border-radius: 8px; padding: 24px 28px; margin: 24px 0; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  display: flex; align-items: center; justify-content: space-between; gap: 20px; transition: all 0.3s;
}
.rp-code {
  font-family: var(--mono); font-size: 32px; font-weight: 800; letter-spacing: .08em;
  color: var(--acc); line-height: 1.1; word-break: break-all; text-shadow: 0 0 15px rgba(240, 192, 64, 0.15);
}
.rp-len { font-family: var(--mono); font-size: 28px; font-weight: 800; color: var(--tx3); }

@keyframes pulse-red {
  0% { box-shadow: 0 0 0 0 rgba(224, 82, 82, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(224, 82, 82, 0); }
  100% { box-shadow: 0 0 0 0 rgba(224, 82, 82, 0); }
}
.nav-btn.pulse {
  animation: pulse-red 2s infinite;
  border-color: var(--red) !important;
  color: var(--red) !important;
}
`;

// ─── DASHBOARD PANELS ─────────────────────────────────────────────────────────

function Panel({ id, active, title, icon, children, onToggle, headerRight }) {
  if (!active) {
    return (
      <div className="panel collapsed" onClick={onToggle}>
        <div className="p-hdr-vert">
          <div className="p-icon">{icon}</div>
          <span>{title}</span>
        </div>
      </div>
    );
  }
  return (
    <div className="panel active">
      <div className="p-hdr">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }} onClick={onToggle}>
          <div className="p-icon" style={{ opacity: 0.8 }}>{icon}</div>
          <span style={{ fontSize: 11, letterSpacing: '1.5px' }}>{title}</span>
        </div>
        {headerRight && <div className="p-nav" style={{ display: 'flex', alignItems: 'center' }}>{headerRight}</div>}
        <button className="collapse-btn" onClick={onToggle} title="Colapsar Panel">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6" /></svg>
        </button>
      </div>
      <div className="p-content">
        {children}
      </div>
    </div>
  );
}

function Dashboard() {
  const { user, role, logout } = useAuth();
  // console.log("Perfil actual:", user?.email, "Rol:", role);

  const [panels, setPanels] = useState({ refgen: false, urlgen: false, chat: false });
  const [showAdmin, setShowAdmin] = useState(false);
  const [showTickets, setShowTickets] = useState(false);

  // Lifted state for GeneradorNombres
  const [refTab, setRefTab] = useState("crear");
  const [urlTab, setUrlTab] = useState("crear");
  const [backTab, setBackTab] = useState("logs");
  const [db, setDb] = useState([]);
  const [pendingTickets, setPendingTickets] = useState(0);
  const [clientTickets, setClientTickets] = useState([]);
  const addArt = (a) => setDb(p => [a, ...p]);

  useEffect(() => {
    async function init() {
      const [artData, ticketData] = await Promise.all([
        dbService.getArticulos(),
        dbService.getTickets()
      ]);

      const mapped = artData.map(a => ({
        id: a.id,
        ref: a.referencia,
        desc: a.descripcion,
        familia: a.familia,
        tipo: a.tipo,
        variante: a.variante,
        ancho: a.ancho,
        alto: a.alto,
        fecha: a.fecha_creacion,
        user: a.creado_por
      }));
      setDb(mapped);

      // Lógica de Tickets
      const pendingCount = ticketData.filter(t => t.estado === 'Pendiente').length;
      setPendingTickets(pendingCount);

      // Lógica para Cliente (sus propios tickets)
      const myOwnTickets = ticketData.filter(t => t.user_id === user?.id);

      // Auto-archivado 24h
      const now = new Date();
      for (const t of myOwnTickets) {
        if (t.estado === 'Resuelto' && t.resuelto_at) {
          const resTime = new Date(t.resuelto_at);
          const diffHours = (now - resTime) / (1000 * 60 * 60);
          if (diffHours >= 24) {
            dbService.updateTicketStatus(t.id, 'Archivado');
            t.estado = 'Archivado';
          }
        }
      }
      setClientTickets(myOwnTickets.filter(t => t.estado !== 'Archivado'));
    }
    init();
  }, [showAdmin, backTab]); // Re-fetch on admin view or tab change

  const toggle = (k) => setPanels(p => ({ ...p, [k]: !p[k] }));

  return (
    <>
      <style>{CSS}</style>
      <div className="dash-wrap">
        <header className="dash-hdr">
          <div className="logo-main" style={{ fontSize: 14, letterSpacing: '1px', fontWeight: 900 }}>
            <div className="logo-dot" />
            EGEA-DEV SOLUTION
          </div>
          <div className="nav" style={{ alignItems: 'center', gap: 15 }}>
            <span style={{ fontSize: 10, color: 'var(--tx3)', fontFamily: 'var(--mono)', opacity: 0.6 }}>{user?.email}</span>

            {clientTickets.length > 0 && (
              <div style={{ display: 'flex', gap: 5, alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 20, border: '1px solid var(--br2)' }}>
                {clientTickets.slice(0, 3).map(t => (
                  <div key={t.id} title={`${t.titulo}: ${t.estado}`} style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: t.estado === 'Resuelto' ? '#52c97e' : (t.estado === 'En proceso' ? '#a852e0' : (t.prioridad === 'Normal' ? '#f0c040' : '#e05252')),
                    boxShadow: `0 0 5px ${t.estado === 'Resuelto' ? '#52c97e' : (t.estado === 'En proceso' ? '#a852e0' : (t.prioridad === 'Normal' ? '#f0c040' : '#e05252'))}`
                  }} />
                ))}
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--tx2)', marginLeft: 2 }}>{clientTickets.length} INCID.</span>
              </div>
            )}

            <button className="nav-btn" onClick={() => setShowTickets(true)}
              style={{ background: 'rgba(240, 192, 64, 0.1)', color: 'var(--acc)', border: '1px solid var(--acc2)' }}>
              REPORTAR INCIDENCIA
            </button>
            {(role === 'admin' || user?.email === 'admin@oko.com') && (
              <button className={`nav-btn ${showAdmin ? 'on' : ''}`}
                onClick={() => setShowAdmin(!showAdmin)}
                style={{ border: '1px solid var(--acc2)', color: 'var(--acc2)', fontSize: 9, fontWeight: 700 }}>
                {showAdmin ? 'CERRAR ADMIN' : 'BACKOFFICE'}
              </button>
            )}
            <button className="nav-btn" onClick={logout} style={{ border: '1px solid var(--br)', fontSize: 9 }}>CERRAR SESIÓN</button>
          </div>
        </header>

        <TicketModal isOpen={showTickets} onClose={() => setShowTickets(false)} />

        {showAdmin ? (
          <div className="dash-body" style={{ overflowY: 'auto', display: 'block', background: 'var(--bg)' }}>
            <div style={{ padding: '20px 40px', borderBottom: '1px solid var(--br)', display: 'flex', gap: 20, background: 'var(--s1)' }}>
              <button className={`nav-btn ${backTab === 'logs' ? 'on' : ''}`} onClick={() => setBackTab("logs")}>Auditoría</button>
              <button className={`nav-btn ${backTab === 'users' ? 'on' : ''}`} onClick={() => setBackTab("users")}>Usuarios</button>
              <button className={`nav-btn ${backTab === 'stats' ? 'on' : ''}`} onClick={() => setBackTab("stats")}>Analíticas</button>
              <button className={`nav-btn ${backTab === 'tickets' ? 'on' : ''} ${pendingTickets > 0 ? 'pulse' : ''}`} onClick={() => setBackTab("tickets")}>
                Tickets {pendingTickets > 0 && <span>({pendingTickets})</span>}
              </button>
              <button className="nav-btn" onClick={() => setShowAdmin(false)} style={{ marginLeft: 'auto', color: 'var(--tx2)' }}>VOLVER AL DASHBOARD</button>
            </div>
            <div style={{ padding: 40 }}>
              <Backoffice tab={backTab} setTab={setBackTab} />
            </div>
          </div>
        ) : (
          <div className="dash-body">
            <Panel id="refgen" active={panels.refgen} onToggle={() => toggle("refgen")} title="REFGEN"
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>}
              headerRight={
                <div className="nav" style={{ marginRight: 15, gap: 6, paddingRight: 15, borderRight: '1px solid var(--br)' }}>
                  <button className={`nav-btn${refTab === "crear" ? " on" : ""} `} onClick={() => setRefTab("crear")} title="CREAR / EDITAR">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button className={`nav-btn${refTab === "hist" ? " on" : ""} `} onClick={() => setRefTab("hist")} title="HISTORIAL">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  </button>
                  <div style={{ marginLeft: 5, fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--tx3)', opacity: 0.6 }}><span>{db.length}</span></div>
                </div>
              }>
              <GeneradorNombres tab={refTab} setTab={setRefTab} db={db} addArt={addArt} />
            </Panel>

            <Panel id="urlgen" active={panels.urlgen} onToggle={() => toggle("urlgen")} title="URLGEN"
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>}
              headerRight={
                <div className="nav" style={{ marginRight: 15, gap: 6, paddingRight: 15, borderRight: '1px solid var(--br)' }}>
                  <button className={`nav-btn${urlTab === "crear" ? " on" : ""} `} onClick={() => setUrlTab("crear")} title="CREAR DIRECTORIO">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button className={`nav-btn${urlTab === "hist" ? " on" : ""} `} onClick={() => setUrlTab("hist")} title="HISTORIAL DIRECTORIOS">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  </button>
                </div>
              }>
              <DirectoryGenerator tab={urlTab} setTab={setUrlTab} />
            </Panel>

            <Panel id="chat" active={panels.chat} onToggle={() => toggle("chat")} title="CONSULTAS IA"
              icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>}>
              <div className="main">
                <div className="stitle">Soporte Inteligente</div>
                <div style={{ marginTop: 40, textAlign: 'center' }}>
                  <div style={{ marginBottom: 15, color: 'var(--acc)', opacity: 0.5, display: 'flex', justifyContent: 'center' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                  </div>
                  Chat Inteligente de Soporte Operativo<br /><br />(Próximamente)
                </div>
              </div>
            </Panel>
          </div>
        )}
      </div>
    </>
  );
}

// ─── APP ROUTER ───────────────────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

// ─── MODULO GENERADOR DE NOMBRES ERP ──────────────────────────────────────────
function GeneradorNombres({ tab, setTab, db, addArt }) {
  function loadArt(a) {
    setTab("crear");
    setTimeout(() => window.dispatchEvent(new CustomEvent("__load", { detail: a })), 40);
  }
  return (
    <div className="app">
      {tab === "crear" && <ViewCrear db={db} addArt={addArt} />}
      {tab === "hist" && <ViewHist db={db} loadArt={loadArt} />}
    </div>
  );
}

// ─── VIEW CREAR ───────────────────────────────────────────────────────────────
function ViewCrear({ db, addArt }) {
  const [text, setText] = useState("");
  const [familia, setFamilia] = useState("");
  const [tipo, setTipo] = useState("");
  const [variante, setVariante] = useState("");
  const [ancho, setAncho] = useState("");
  const [alto, setAlto] = useState("");
  const [coleccion, setColeccion] = useState("");
  const [modelo, setModelo] = useState("");
  const [color, setColor] = useState("");
  const [saved, setSaved] = useState(false);
  const [showFam, setShowFam] = useState(false);
  const [showVar, setShowVar] = useState(false);
  const ref_ = useRef();

  useEffect(() => {
    const h = (e) => {
      const a = e.detail;
      setText(a.desc || ""); setFamilia(a.familia || ""); setTipo(a.tipo || "");
      setVariante(a.variante || ""); setAncho(a.ancho || ""); setAlto(a.alto || "");
      setColeccion(a.coleccion || ""); setModelo(a.modelo || ""); setColor(a.color || "");
      setSaved(false);
    };
    window.addEventListener("__load", h);
    return () => window.removeEventListener("__load", h);
  }, []);

  const isCode = useMemo(() => {
    const u = text.trim().toUpperCase();
    const sorted = [...FAMILIAS].sort((a, b) => b.codigo.length - a.codigo.length);
    return u.length >= 5 && !/\s/.test(u) && sorted.some((f) => u.startsWith(f.codigo));
  }, [text]);

  // UNICO useEffect — sin cadenas ni circulares
  useEffect(() => {
    const raw = text.trim();
    if (raw.length === 0) {
      setFamilia(""); setTipo(""); setVariante("");
      setAncho(""); setAlto(""); setColeccion(""); setModelo(""); setColor("");
      setSaved(false); return;
    }
    if (isCode) {
      const d = decodeRef(raw);
      if (!d) return;
      if (d.fam) setFamilia(d.fam.codigo);
      if (d.tipo) setTipo(d.tipo.codigo);
      if (d.variante) { setVariante(d.variante.codigo); setAncho(""); setAlto(""); setColeccion(""); setModelo(""); setColor(""); }
      else if (d.ancho) { setAncho(d.ancho); setAlto(d.alto || ""); setVariante(""); setColeccion(""); setModelo(""); setColor(""); }
      else if (d.modeloRaw) {
        setAncho(""); setAlto(""); setVariante("");
        setColeccion(d.modeloRaw.slice(0, 5));
        setModelo(d.modeloRaw.slice(5, 9));
        setColor(d.modeloRaw.slice(9, 12));
      }
    } else {
      const a = analyzeText(raw);
      if (a.familia) setFamilia(a.familia);
      if (a.tipo) setTipo(a.tipo);
      if (a.variante) setVariante(a.variante);
      if (a.ancho && a.alto) { setAncho(a.ancho); setAlto(a.alto); }
    }
    setSaved(false);
  }, [text, isCode]);

  // Buscar tipos propios guardados en el historial para esta familia
  const tiposDesdeDB = useMemo(() => {
    if (!familia) return [];
    const existentes = TIPOS.filter(t => t.familia === familia).map(t => t.codigo);
    const m = new Map();
    db.filter(a => a.familia === familia && a.tipo && !existentes.includes(a.tipo))
      .forEach(a => m.set(a.tipo, { codigo: a.tipo, desc: "HIST", familia, idTipo: ["tamano", "modelo", "variante"] }));
    return Array.from(m.values());
  }, [db, familia]);

  // Si el tipo ingresado manualmente no esta en los arrays definidos
  const dummyTipo = tipo ? { codigo: tipo, desc: "LIBRE", familia, idTipo: ["tamano", "modelo", "variante"] } : null;
  const tipoObj = TIPOS.find((t) => t.codigo === tipo && t.familia === familia)
    || tiposDesdeDB.find((t) => t.codigo === tipo)
    || dummyTipo;
  const tiposFamilia = familia ? TIPOS.filter((t) => t.familia === familia) : [];

  // idTipo dinamico — el corazon del fix
  const idTipo = useMemo(
    () => resolveIdTipo(tipoObj, ancho, alto, variante, coleccion || modelo || color),
    [tipoObj, ancho, alto, variante, coleccion, modelo, color]
  );

  const ref = useMemo(
    () => buildRef(familia, tipo, variante, ancho, alto, coleccion, modelo, color, idTipo),
    [familia, tipo, variante, ancho, alto, coleccion, modelo, color, idTipo]
  );

  const refLen = ref.length;
  const isOver = refLen > 15;
  const isDup = db.some((a) => a.ref === ref && ref !== "");
  const refState = isOver ? "over" : isDup ? "dup" : ref ? "ok" : "";
  const canSave = ref && !isOver && !isDup && text.trim() && !saved;

  const tipoModos = tipoObj && Array.isArray(tipoObj.idTipo) ? tipoObj.idTipo : [];

  const similar = useMemo(
    () => db.filter((a) => a.familia === familia && a.tipo === tipo && a.ref !== ref).slice(0, 6),
    [db, familia, tipo, ref]
  );

  async function save() {
    if (!canSave) return;
    const newArt = {
      referencia: ref,
      descripcion: text.trim(),
      familia,
      tipo,
      variante: idTipo === "variante" ? variante : null,
      ancho: idTipo === "tamano" ? ancho : null,
      alto: idTipo === "tamano" ? alto : null,
      creado_por: user?.id
    };

    try {
      await dbService.saveArticulo(newArt);
      addArt({
        id: Date.now().toString(),
        ...newArt,
        ref: newArt.referencia,
        desc: newArt.descripcion,
        fecha: new Date().toISOString()
      });
      dbService.insertLog('SAVE', 'REFGEN', { referencia: ref, descripcion: newArt.descripcion });
      setSaved(true);
    } catch (e) {
      console.error("Error al guardar artículo:", e);
      alert("Error al conectar con la base de datos.");
    }
  }

  function reset() {
    setText(""); setFamilia(""); setTipo(""); setVariante("");
    setAncho(""); setAlto(""); setColeccion(""); setModelo(""); setColor("");
    setSaved(false); ref_.current?.focus();
  }

  return (
    <div className="main">
      <div className="stitle">Generador de Referencias ERP</div>
      <div className="card" style={{ marginBottom: 20, borderLeft: '4px solid var(--acc)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="mod-field">
            <label className="mod-lbl" style={{ color: 'var(--acc)', fontSize: 11 }}>DESCRIPCION DEL ARTICULO (ANALISIS AUTOMATICO)</label>
            <textarea ref={ref_} className="big-area" rows={2} autoFocus
              style={{ fontSize: 18, padding: '12px 15px', borderBottom: '2px solid var(--br2)' }}
              placeholder={"Ej: cojin 60x60 silla cerrada..."}
              value={text} onChange={(e) => { setText(e.target.value); setSaved(false); }} />
            <div className={`area-hint ${isCode ? "code" : ""} `} style={{ marginTop: 8 }}>
              {isCode ? "REFERENCIA DETECTADA" : "Detección inteligente de familia y medidas activa"}
            </div>
          </div>
        </div>
      </div>

      {ref && (
        <div className={`ref-box ${refState} `} style={{ background: 'rgba(240, 192, 64, 0.05)', padding: '30px' }}>
          <div className="rp-left">
            <div className="rp-lbl">REFERENCIA DE ARTICULO GENERADA</div>
            <div className={`rp-code ${refState} `} style={{ fontSize: 36 }}>{ref}</div>
            <div className="rp-segs" style={{ marginTop: 15 }}>
              {familia && <span className="seg seg-f" style={{ fontSize: 12, padding: '4px 10px' }}>{familia}</span>}
              {tipo && <span className="seg seg-t" style={{ fontSize: 12, padding: '4px 10px' }}>{tipo}</span>}
              {ref.slice(familia.length + tipo.length) &&
                <span className="seg seg-i" style={{ fontSize: 12, padding: '4px 10px' }}>{ref.slice(familia.length + tipo.length)}</span>}
            </div>
          </div>
          <div className="rp-right">
            <div className={`rp-len ${refState === "ok" ? "ok" : refState === "over" ? "over" : ""} `}>{refLen}</div>
            <div className="rp-sub">ESTRICTO 15</div>
          </div>
        </div>
      )}

      {isOver && <div className="alert a-e" style={{ marginTop: 15 }}>Error: Se superan los 15 caracteres.</div>}
      {isDup && !isOver && <div className="alert a-w" style={{ marginTop: 15 }}>Aviso: Referencia ya existente en el historial.</div>}
      {saved && <div className="alert a-ok" style={{ marginTop: 15 }}>Referencia guardada correctamente.</div>}

      <div className="divider" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
        {/* FAMILIA */}
        <div>
          <div className="sec-lbl" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            FAMILIA SELECCIONADA
            {familia && (
              <button className="switch-btn" onClick={() => setShowFam(!showFam)} style={{ margin: 0, padding: "2px 8px" }}>
                {showFam ? "CONTRAER" : "CAMBIAR / VER TODAS"}
              </button>
            )}
          </div>
          <div className="chip-row">
            {!familia && !showFam ? (
              <button className="btn btn-g" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowFam(true)}>
                SELECCIONAR FAMILIA DE ARTICULOS
              </button>
            ) : showFam ? (
              FAMILIAS.map((f) => (
                <button key={f.codigo} className={`chip ${familia === f.codigo ? "on" : ""} `}
                  onClick={() => { setFamilia(f.codigo); setTipo(""); setVariante(""); setSaved(false); setShowFam(false); }}>
                  {f.codigo} <span className="chip-sub">{f.desc}</span>
                </button>
              ))
            ) : (
              <button className="chip on" onClick={() => setShowFam(true)}>
                {familia} <span className="chip-sub">{FAMILIAS.find(f => f.codigo === familia)?.desc}</span>
              </button>
            )}
          </div>
        </div>

        {/* TIPO */}
        {familia && (
          <div>
            <div className="sec-lbl">TIPO DE PRODUCTO</div>
            <div className="chip-row">
              {tiposFamilia.map((t) => (
                <button key={t.codigo + t.familia} className={`chip ${tipo === t.codigo ? "on" : ""} `}
                  onClick={() => { setTipo(t.codigo); setVariante(""); setSaved(false); }}>
                  {t.codigo} <span className="chip-sub">{t.desc}</span>
                </button>
              ))}
              <div className="mod-field" style={{ marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 10 }}>
                <div className="mod-lbl" style={{ margin: 0 }}>LIBRE:</div>
                <input className="mod-in" style={{ width: 80, padding: "6px 10px" }}
                  maxLength={4} placeholder="COD"
                  value={(!tiposFamilia.find(t => t.codigo === tipo) && !tiposDesdeDB.find(t => t.codigo === tipo)) ? tipo : ""}
                  onChange={(e) => { setTipo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); setVariante(""); setSaved(false); }}
                />
              </div>
            </div>
          </div>
        )}

        {/* DINAMICOS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          {tipo && idTipo === "variante" && (
            <div>
              <div className="sec-lbl" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                VARIANTE
                {variante && (
                  <button className="switch-btn" onClick={() => setShowVar(!showVar)} style={{ margin: 0, padding: "2px 8px" }}>
                    {showVar ? "CONTRAER" : "CAMBIAR / VER TODAS"}
                  </button>
                )}
              </div>
              <div className="chip-row">
                {!variante && !showVar ? (
                  <button className="btn btn-g" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setShowVar(true)}>
                    SELECCIONAR VARIANTE
                  </button>
                ) : showVar ? (
                  VARIANTES.map((v) => (
                    <button key={v.codigo} className={`chip ${variante === v.codigo ? "on" : ""} `}
                      onClick={() => { setVariante(v.codigo); setSaved(false); setShowVar(false); }}>
                      {v.codigo} <span className="chip-sub">{v.desc}</span>
                    </button>
                  ))
                ) : (
                  <button className="chip on" onClick={() => setShowVar(true)}>
                    {variante} <span className="chip-sub">{VARIANTES.find(v => v.codigo === variante)?.desc}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {tipo && idTipo === "tamano" && (
            <div>
              <div className="sec-lbl">DIMENSIONES (CM)</div>
              <div className="size-row">
                <div className="size-field">
                  <div className="size-lbl">Ancho</div>
                  <input className="size-in" type="number" value={ancho}
                    onChange={(e) => { setAncho(String(e.target.value).slice(0, 3)); setSaved(false); }} />
                </div>
                <div className="size-x">×</div>
                <div className="size-field">
                  <div className="size-lbl">Alto</div>
                  <input className="size-in" type="number" value={alto}
                    onChange={(e) => { setAlto(String(e.target.value).slice(0, 3)); setSaved(false); }} />
                </div>
              </div>
            </div>
          )}

          {tipo && idTipo === "modelo" && (
            <div>
              <div className="sec-lbl">ESPECIFICACIONES TEXTILES</div>
              <div className="mod-row">
                <div className="mod-field">
                  <div className="mod-lbl">Col.</div>
                  <input className="mod-in" style={{ width: 70 }} maxLength={5} value={coleccion}
                    onChange={(e) => { setColeccion(e.target.value.toUpperCase().slice(0, 5)); setSaved(false); }} />
                </div>
                <div className="mod-field">
                  <div className="mod-lbl">Mod.</div>
                  <input className="mod-in" style={{ width: 60 }} maxLength={4} value={modelo}
                    onChange={(e) => { setModelo(e.target.value.toUpperCase().slice(0, 4)); setSaved(false); }} />
                </div>
                <div className="mod-field">
                  <div className="mod-lbl">Col.</div>
                  <input className="mod-in" style={{ width: 50 }} maxLength={3} value={color}
                    onChange={(e) => { setColor(e.target.value.toUpperCase().slice(0, 3)); setSaved(false); }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="btn-row" style={{ marginTop: 30, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {!saved
            ? <><button className="btn btn-p" onClick={save} disabled={!canSave}>GUARDAR EN SISTEMA</button>
              <button className="btn btn-g" onClick={reset}>LIMPIAR FORMULARIO</button></>
            : <button className="btn btn-g" style={{ borderColor: 'var(--acc)', color: 'var(--acc)' }} onClick={reset}>+ CREAR OTRO ARTICULO</button>}
        </div>

        <label className="btn btn-g" style={{ cursor: 'pointer', borderStyle: 'dashed' }}>
          <svg style={{ marginRight: 8 }} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
          IMPORTACIÓN MASIVA (XLS)
          <input type="file" accept=".xlsx, .xls" hidden onChange={(e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (evt) => {
              const bstr = evt.target.result;
              const wb = XLSX.read(bstr, { type: 'binary' });
              const wsname = wb.SheetNames[0];
              const ws = wb.Sheets[wsname];
              const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

              // Procesar filas (asumiendo que la descripción está en la primera columna)
              const bulkItems = data.slice(1).filter(row => row[0]).map(row => {
                const desc = String(row[0]);
                const analysis = analyzeText(desc);
                const ref = buildRef(
                  analysis.familia, analysis.tipo, analysis.variante,
                  analysis.ancho, analysis.alto, null, null, null,
                  resolveIdTipo(null, analysis.ancho, analysis.alto, analysis.variante, false)
                );
                return { desc, ...analysis, ref };
              });

              if (window.confirm(`¿Cargar ${bulkItems.length} artículos detectados automáticamente?`)) {
                bulkItems.forEach(item => {
                  addArt({
                    id: Math.random().toString(36).substr(2, 9),
                    ref: item.ref,
                    desc: item.desc,
                    familia: item.familia,
                    tipo: item.tipo,
                    variante: item.variante,
                    ancho: item.ancho,
                    alto: item.alto,
                    fecha: new Date().toISOString().split("T")[0],
                    user: "usuario",
                  });
                });
                dbService.insertLog('BULK_IMPORT', 'REFGEN', { count: bulkItems.length });
                alert(`${bulkItems.length} artículos añadidos. Revisa el historial.`);
              }
            };
            reader.readAsBinaryString(file);
          }} />
        </label>
      </div>

      {similar.length > 0 && (
        <div style={{ marginTop: 40 }}>
          <div className="stitle">REFERENCIAS SIMILARES</div>
          <div className="sim-row">
            {similar.map((a) => (
              <div key={a.id} className="sim-chip"
                onClick={() => { setText(a.ref); setSaved(false); }}>{a.ref}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── VIEW HISTORIAL ───────────────────────────────────────────────────────────
function ViewHist({ db, loadArt }) {
  const [q, setQ] = useState("");
  const [filt, setFilt] = useState("");

  const rows = useMemo(() => {
    const nq = norm(q);
    return db.filter((a) => {
      const mq = !nq || norm(a.ref).includes(nq) || norm(a.desc).includes(nq);
      const mf = !filt || a.familia === filt;
      return mq && mf;
    });
  }, [db, q, filt]);

  const counts = useMemo(() => {
    const c = {};
    db.forEach((a) => { c[a.familia] = (c[a.familia] || 0) + 1; });
    return c;
  }, [db]);

  return (
    <div>
      <div className="stitle" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        Historial
        <button className="btn btn-g" style={{ padding: '6px 12px' }} onClick={() => {
          const ws = XLSX.utils.json_to_sheet(db);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Referencias");
          XLSX.writeFile(wb, "Egea_Referencias.xlsx");
          dbService.insertLog('XLS_EXPORT', 'REFGEN', { count: db.length });
        }}>
          <svg style={{ marginRight: 8 }} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          EXPORTAR EXCEL
        </button>
      </div>
      <div className="stats-row">
        <div className={`stat ${!filt ? "on" : ""} `} onClick={() => setFilt("")}>
          <div className="stat-n">{db.length}</div><div className="stat-l">Total</div>
        </div>
        {Object.entries(counts).map(([f, c]) => (
          <div key={f} className={`stat ${filt === f ? "on" : ""} `} onClick={() => setFilt(filt === f ? "" : f)}>
            <div className="stat-n" style={{ fontSize: 16 }}>{c}</div>
            <div className="stat-l">{FAMILIAS.find((x) => x.codigo === f)?.desc || f}</div>
          </div>
        ))}
      </div>
      <div className="search-row">
        <input className="search-in" placeholder="Buscar referencia o descripcion…"
          value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="search-sel" value={filt} onChange={(e) => setFilt(e.target.value)}>
          <option value="">Todas las familias</option>
          {FAMILIAS.map((f) => <option key={f.codigo} value={f.codigo}>{f.codigo} · {f.desc}</option>)}
        </select>
      </div>
      <div className="h-list">
        {rows.length === 0 && <div className="empty">Sin resultados</div>}
        {rows.map((a) => (
          <div key={a.id} className="h-row" onClick={() => loadArt(a)}>
            <div className="h-ref">{a.ref}</div>
            <div className="h-desc">{a.desc}</div>
            <div className="h-tags">
              <span className="seg seg-f" style={{ fontSize: 9 }}>{a.familia}</span>
              <span className="seg seg-t" style={{ fontSize: 9 }}>{a.tipo}</span>
            </div>
            <div className="h-date">{a.fecha}</div>
            <div className="h-use" onClick={(e) => { e.stopPropagation(); loadArt(a); }}>Cargar</div>
          </div>
        ))}
      </div>
      <div className="foot">{rows.length} / {db.length} · Clic en cualquier fila para editarla</div>
    </div>
  );
}
