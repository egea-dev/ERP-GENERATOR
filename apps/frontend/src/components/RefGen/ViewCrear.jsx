import { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from 'xlsx';
import { FAMILIAS, TIPOS, VARIANTES, norm, analyzeText, buildRef, decodeRef, isValidRef, seqFirst, refToDescripcion } from "../../config/erp_constants";
import { dbService } from '../../dbService';
import { useAuth } from '../../context/AuthContext';

function IconCheck() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
}

function IconFile() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>;
}

function IconChevronLeft() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>;
}

function IconChevronRight() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>;
}

function IconDownload() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;
}

function IconAlert() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>;
}

function detectColumn(headers, field) {
  const mappings = {
    descripcion: ['desc', 'descripcion', 'description', 'nombre', 'name', 'articulo', 'article', 'producto', 'product', 'item'],
    familia: ['familia', 'fam', 'family'],
    tipo: ['tipo', 'tip', 'type', 'clase'],
    medida: ['medida', 'med', 'ancho', 'width', 'numero', 'num', 'number'],
    color: ['color', 'col', 'colour', 'colore'],
    precio: ['precio', 'price', 'pvp', 'p.v.p', 'tarifa']
  };
  const keywords = mappings[field] || [field];
  for (let i = 0; i < headers.length; i++) {
    const h = String(headers[i] || '').toLowerCase().trim();
    if (keywords.some(k => h.includes(k))) return i;
  }
  return -1;
}

const OUTPUT_COLUMNS = [
  { key: 'ref', label: 'Cod.Art', width: 16 },
  { key: 'descripcion', label: 'Descripcion', width: 40 },
  { key: 'familia', label: 'Familia', width: 8 },
  { key: 'tipo', label: 'Tipo', width: 8 },
  { key: 'medida', label: 'Medida', width: 10 },
  { key: 'color', label: 'Color', width: 10 },
  { key: 'precio', label: 'Precio', width: 12 },
  { key: 'estado', label: 'Estado', width: 12 }
];

export default function ViewCrear({ db, addArt, onLoadArt }) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [familia, setFamilia] = useState("");
  const [tipo, setTipo] = useState("");
  const [variante, setVariante] = useState("");
  const [medida1, setMedida1] = useState("");
  const [medida2, setMedida2] = useState("");
  const [color, setColor] = useState("");
  const [saved, setSaved] = useState(false);
  const [showFam, setShowFam] = useState(false);
  const [showVar, setShowVar] = useState(false);
  const ref_ = useRef();

  const [importStep, setImportStep] = useState(0);
  const [importFile, setImportFile] = useState(null);
  const [importHeaders, setImportHeaders] = useState([]);
  const [importRows, setImportRows] = useState([]);
  const [importColumns, setImportColumns] = useState({});
  const [importPage, setImportPage] = useState(0);
  const [bulkPreview, setBulkPreview] = useState([]);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const PAGE_SIZE = 50;

  useEffect(() => {
    if (!onLoadArt) return;
    setText(onLoadArt.desc || "");
    setFamilia(onLoadArt.familia || "");
    setTipo(onLoadArt.tipo || "");
    setVariante(onLoadArt.variante || "");
    setMedida1(onLoadArt.ancho || "");
    setMedida2(onLoadArt.alto || "");
    setColor(onLoadArt.color || "");
    setSaved(false);
  }, [onLoadArt]);

  const isCode = useMemo(() => {
    const u = text.trim().toUpperCase().replace(/\s/g, "");
    return (u.length === 10 || u.length === 13) && /^[A-Z0-9]{10}$|^[A-Z0-9]{13}$/.test(u);
  }, [text]);

  useEffect(() => {
    const raw = text.trim();
    if (raw.length === 0) {
      setFamilia(""); setTipo(""); setVariante("");
      setMedida1(""); setMedida2(""); setColor("");
      setSaved(false); return;
    }
    if (isCode) {
      const d = decodeRef(raw);
      if (!d) return;
      setFamilia(d.familia || "");
      setTipo(d.tipo || "");
      setMedida1(d.medida1 || d.ancho || "");
      setMedida2(d.medida2 || "");
      setVariante("");
      setColor(d.color || "");
    } else {
      const a = analyzeText(raw);
      if (a.familia) setFamilia(a.familia);
      if (a.tipo) setTipo(a.tipo);
      if (a.variante) setVariante(a.variante);
      if (a.medida1) setMedida1(a.medida1);
      if (a.medida2) setMedida2(a.medida2);
    }
    setSaved(false);
  }, [text, isCode]);

  const tiposFamilia = useMemo(() => {
    if (!familia) return [];
    return TIPOS.filter(t => t.familia === familia);
  }, [familia]);

  const tipoObj = useMemo(() => {
    return TIPOS.find(t => t.codigo === tipo && t.familia === familia);
  }, [familia, tipo]);

  const ref = useMemo(
    () => buildRef(familia, tipo, variante, medida1, medida2, null, null, color, null, text),
    [familia, tipo, variante, medida1, medida2, color, text]
  );

  const refLen = ref.length;
  const isOver = refLen > 0 && refLen > 12; // Max 12 con X, 13 para TE
  const isDup = db.some((a) => a.ref === ref && ref !== "");
  const refState = isOver ? "over" : isDup ? "dup" : ref ? "ok" : "";
  const canSave = ref && refLen >= 8 && refLen <= 13 && !isDup && text.trim() && !saved;

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
      variante: variante || null,
      ancho: medida1 || null,
      alto: medida2 || null,
      color: color || null,
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
      console.error("Error al guardar:", e);
      alert("Error al conectar con la base de datos.");
    }
  }

  function reset() {
    setText(""); setFamilia(""); setTipo(""); setVariante("");
    setMedida1(""); setMedida2(""); setColor("");
    setSaved(false); ref_.current?.focus();
  }

  function exportToExcel(items) {
    const exportData = items.map(item => ({
      'Cod.Art': item.ref || '',
      'Descripcion': item.desc || '',
      'Familia': item.familia || '',
      'Tipo': item.tipo || '',
      'Medida1': item.medida1 || '',
      'Medida2': item.medida2 || '',
      'Color': item.color || '',
      'Precio': item.precio || '',
      'Estado': item.error ? item.error : item.existing ? 'DUPLICADO' : 'OK'
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = OUTPUT_COLUMNS.map(c => ({ wch: c.width }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Articulos");
    const date = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `articulos_importados_${date}.xlsx`);
  }

  function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        if (!data || data.length < 2) {
          alert("El archivo esta vacio o no tiene datos suficientes");
          return;
        }
        const headers = data[0].map((h, i) => String(h || '').trim() || `Columna ${i + 1}`);
        const rows = data.slice(1).filter(row => row.some(cell => cell !== undefined && cell !== null && cell !== ''));

        const autoColumns = { referencia: 0 };
        autoColumns.descripcion = detectColumn(headers, 'descripcion');
        autoColumns.familia = detectColumn(headers, 'familia');
        autoColumns.tipo = detectColumn(headers, 'tipo');
        autoColumns.medida = detectColumn(headers, 'medida');
        autoColumns.color = detectColumn(headers, 'color');
        autoColumns.precio = detectColumn(headers, 'precio');

        setImportFile(file);
        setImportHeaders(headers);
        setImportRows(rows);
        setImportColumns(autoColumns);
        setImportPage(0);
        setSelectedRows(new Set());
        setSelectAll(false);
        setBulkPreview([]);
        setImportStep(1);
      } catch (err) {
        alert("Error leyendo archivo: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function handleAutoMap() {
    const newCols = { ...importColumns };
    ['descripcion', 'familia', 'tipo', 'medida', 'color', 'precio'].forEach(key => {
      if (newCols[key] === -1) {
        newCols[key] = detectColumn(importHeaders, key);
      }
    });
    setImportColumns(newCols);
  }

  function handleProcessImport() {
    const validItems = [];
    const refCol = importColumns.referencia;

    importRows.forEach((row, idx) => {
      const refRaw = String(row[refCol] || '').trim().toUpperCase();
      const refCode = refRaw.replace(/\s/g, '');

      if (!isValidRef(refCode)) {
        validItems.push({
          row: idx + 2,
          ref: refCode || '(vacio)',
          desc: String(row[importColumns.descripcion !== -1 ? importColumns.descripcion : 1] || '').trim(),
          familia: '',
          tipo: '',
          medida1: '',
          medida2: '',
          color: '',
          precio: importColumns.precio !== -1 ? row[importColumns.precio] : null,
          valid: false,
          error: !refCode ? 'Referencia vacia' : `Ref "${refCode}" debe tener 10 chars (FF TTT MMM X NNN)`
        });
        return;
      }

      const desc = importColumns.descripcion !== -1
        ? String(row[importColumns.descripcion] || '').trim()
        : '';

      const familiaRaw = importColumns.familia !== -1
        ? String(row[importColumns.familia] || '').trim().toUpperCase().slice(0, 2)
        : refCode.slice(0, 2);
      const familiaValida = FAMILIAS.find(f => f.codigo === familiaRaw) ? familiaRaw : '';

      const medidaRaw = importColumns.medida !== -1
        ? String(row[importColumns.medida] || '').trim()
        : '';
      const medidaNum = medidaRaw.replace(/\D/g, '').slice(0, 3).padStart(3, '0');

      const colorRaw = importColumns.color !== -1
        ? String(row[importColumns.color] || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3)
        : refCode.slice(5, 8);

      const tipoRaw = importColumns.tipo !== -1
        ? String(row[importColumns.tipo] || '').trim().toUpperCase().slice(0, 3)
        : refCode.slice(2, 5);

      const precioRaw = importColumns.precio !== -1 ? row[importColumns.precio] : null;

      const existing = db.find(a => a.ref === refCode);

      validItems.push({
        row: idx + 2,
        ref: refCode,
        desc,
        familia: familiaValida,
        tipo: tipoRaw,
        medida1: medidaNum,
        medida2: '000',
        color: colorRaw,
        precio: precioRaw,
        valid: true,
        existing: !!existing,
        error: null
      });
    });

    if (validItems.length === 0) {
      alert("No se encontro ninguna fila valida");
      return;
    }

    setBulkPreview(validItems);
    setImportStep(2);
  }

  async function handleConfirmImport() {
    const itemsToImport = selectAll
      ? bulkPreview
      : bulkPreview.filter((_, idx) => selectedRows.has(idx));

    const validItems = itemsToImport.filter(item => item.valid && !item.existing);
    let savedCount = 0;

    for (const item of validItems) {
      try {
        await dbService.saveArticulo({
          referencia: item.ref,
          descripcion: item.desc,
          familia: item.familia,
          tipo: item.tipo || null,
          variante: null,
          ancho: item.medida1 || null,
          alto: item.medida2 || null,
          color: item.color || null,
          creado_por: user?.id
        });
        savedCount++;
        addArt({
          id: Math.random().toString(36).substr(2, 9),
          ref: item.ref,
          desc: item.desc,
          familia: item.familia,
          tipo: item.tipo,
          variante: null,
          ancho: item.medida1,
          alto: item.medida2,
          fecha: new Date().toISOString().split("T")[0],
          user: user?.email || "usuario"
        });
      } catch (e) {
        console.error("Error guardando:", e);
      }
    }

    if (validItems.length > 0) {
      exportToExcel(validItems);
    }

    dbService.logSystemAction('BULK_IMPORT', 'REFGEN', { count: savedCount });

    setBulkPreview([]);
    setImportStep(0);
    setImportFile(null);
    setImportRows([]);
    setImportHeaders([]);
    setImportColumns({});
    setSelectedRows(new Set());
    setSelectAll(false);

    alert(`${savedCount} articulos guardados`);
  }

  function toggleSelectAll() {
    if (selectAll) {
      setSelectedRows(new Set());
      setSelectAll(false);
    } else {
      setSelectedRows(new Set(bulkPreview.map((_, i) => i)));
      setSelectAll(true);
    }
  }

  function toggleRow(idx) {
    const newSel = new Set(selectedRows);
    if (newSel.has(idx)) newSel.delete(idx);
    else newSel.add(idx);
    setSelectedRows(newSel);
    setSelectAll(false);
  }

  const totalPages = Math.ceil(importRows.length / PAGE_SIZE);
  const stats = useMemo(() => {
    const total = bulkPreview.length;
    const valid = bulkPreview.filter(i => i.valid).length;
    const invalid = bulkPreview.filter(i => !i.valid).length;
    const dups = bulkPreview.filter(i => i.existing).length;
    return { total, valid, invalid, dups };
  }, [bulkPreview]);

  return (
    <div className="main">
      <div className="stitle">Generador de Referencias ERP</div>

      {importStep === 0 && (
        <>
          <div className="card" style={{ marginBottom: 20, borderLeft: '4px solid var(--acc)', padding: '16px 20px', minHeight: 140 }}>
            <label className="mod-lbl" style={{ color: 'var(--acc)', fontSize: 11, marginBottom: 8, display: 'block' }}>DESCRIPCION DEL ARTICULO (ANALISIS AUTOMATICO)</label>
            <textarea ref={ref_} className="big-area"
              style={{ fontSize: 18, height: 80 }}
              placeholder={"Ej: cojin simple 50x50, sofa 3 plazas 80x200..."}
              value={text} onChange={(e) => { setText(e.target.value); setSaved(false); }} />
            <div style={{ marginTop: 8, minHeight: 24, display: 'flex', alignItems: 'center' }}>
              <div className={`area-hint ${isCode ? "code" : ""} `} style={{ fontSize: 16, fontWeight: 700 }}>
                {isCode ? (
                  <span>
                    REFERENCIA DETECTADA → {refToDescripcion(text) || '?'}
                  </span>
                ) : "Deteccion inteligente de familia y medidas activa"}
              </div>
            </div>
          </div>

          {ref && (
            <div className={`ref-box ${refState} `} style={{ background: 'rgba(240, 192, 64, 0.05)', padding: '30px' }}>
              <div className="rp-left">
                <div className="rp-lbl">REFERENCIA DE ARTICULO GENERADA</div>
                <div className={`rp-code ${refState} `} style={{ fontSize: 36 }}>{ref}</div>
                <div className="rp-segs" style={{ marginTop: 15 }}>
                  <span className="seg seg-f" style={{ fontSize: 12, padding: '4px 10px' }}>FF {ref.slice(0, 2)}</span>
                  <span className="seg seg-t" style={{ fontSize: 12, padding: '4px 10px' }}>TTT {ref.slice(2, ref.indexOf('X'))}</span>
                  <span className="seg seg-i" style={{ fontSize: 12, padding: '4px 10px' }}>MED {ref.slice(ref.indexOf('X') + 1)}</span>
                </div>
              </div>
              <div className="rp-right">
                <div className={`rp-len ${refState === "ok" ? "ok" : refState === "over" ? "over" : ""} `}>{refLen}</div>
                <div className="rp-sub">MAX 10</div>
              </div>
            </div>
          )}

          {isOver && <div className="alert a-e" style={{ marginTop: 15 }}>Error: la referencia debe tener 10 caracteres (formato FF TTT MMM X NNN).</div>}
          {isDup && !isOver && <div className="alert a-w" style={{ marginTop: 15 }}>Aviso: Referencia ya existente en el historial.</div>}
          {saved && <div className="alert a-ok" style={{ marginTop: 15 }}>Referencia guardada correctamente.</div>}

          <div className="divider" />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }}>
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
                </div>
              </div>
            )}

            {familia && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                <div>
                  <div className="sec-lbl">MEDIDA 1 / ANCHO (3 CAR.)</div>
                  <input className="mod-in" style={{ width: '100%' }} maxLength={3} placeholder="050, 150, 280..."
                    value={medida1}
                    onChange={(e) => { setMedida1(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3)); setSaved(false); }} />
                </div>
                <div>
                  <div className="sec-lbl">MEDIDA 2 / ALTO (3 CAR.)</div>
                  <input className="mod-in" style={{ width: '100%' }} maxLength={3} placeholder="000, 200..."
                    value={medida2}
                    onChange={(e) => { setMedida2(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3)); setSaved(false); }} />
                </div>
                <div>
                  <div className="sec-lbl">COLOR / VARIANTE (3 CAR.)</div>
                  <input className="mod-in" style={{ width: '100%' }} maxLength={3} placeholder="BLA, NEG..."
                    value={color}
                    onChange={(e) => { setColor(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3)); setSaved(false); }} />
                </div>
              </div>
            )}
          </div>

          <div className="btn-row" style={{ marginTop: 30, justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 10 }}>
              {!saved
                ? <><button className="btn btn-p" onClick={save} disabled={!canSave}>GUARDAR EN SISTEMA</button>
                  <button className="btn btn-g" onClick={reset}>LIMPIAR FORMULARIO</button></>
                : <button className="btn btn-g" style={{ borderColor: 'var(--acc)', color: 'var(--acc)' }} onClick={reset}>+ CREAR OTRO ARTICULO</button>}
            </div>

            <label className="btn btn-g" style={{ cursor: 'pointer', borderStyle: 'dashed' }}>
              <IconFile />
              IMPORTAR DESDE XLS
              <input type="file" accept=".xlsx,.xls" hidden onChange={handleFileSelect} />
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

          <div style={{ fontSize: 12, color: '#888', marginTop: 24, lineHeight: 1.6 }}>
            Escribe una descripción del artículo (por ejemplo: <em>"cojín simple 50x50"</em>) y el sistema generará automáticamente la referencia.
            <br />A medida que escribas, aparecerán opciones para ayudarte a seleccionar la <strong>familia</strong>, <strong>tipo</strong> y <strong>medidas</strong>.
            <br />También puedes pegar una referencia existente para ver sus datos decodificados.
            <br /><strong>Formato:</strong> <span style={{ fontFamily: 'monospace', background: 'var(--br2)', padding: '2px 6px', borderRadius: 3 }}>FF + TIPO + medida × medida</span> → Ej: CUCOJ50X50
          </div>
        </>
      )}

      {importStep === 1 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, color: 'var(--acc)' }}>
                {importFile?.name}
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--fg2)', marginTop: 4 }}>
                {importRows.length} filas detectadas - Columna A = Referencia (formato FF TTT MMM X NNN)
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-g" onClick={() => setImportStep(0)}>
                <IconChevronLeft /> Volver
              </button>
              <button className="btn btn-g" onClick={handleAutoMap}>
                Auto-detectar columnas
              </button>
              <button className="btn btn-p" onClick={handleProcessImport}>
                Procesar y Validar <IconChevronRight />
              </button>
            </div>
          </div>

          <div style={{ background: 'rgba(240,192,64,0.1)', border: '2px solid var(--acc)', borderRadius: 8, padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 60, height: 60, background: 'var(--acc)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#000', fontFamily: 'var(--mono)', fontWeight: 900, fontSize: 11, textAlign: 'center' }}>ARTICULO<br/>10CH</span>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 700, color: 'var(--acc)' }}>
                  COLUMNA A: ARTICULO (Referencia)
                </div>
                <div style={{ fontSize: 12, color: 'var(--fg2)', marginTop: 4 }}>
                  La referencia (formato FF TTT MMM X NNN) ya esta generada en la columna A
                </div>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--br)', background: 'var(--bg2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg2)' }}>
                Pagina {importPage + 1} de {totalPages} ({importRows.length} filas)
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-g" style={{ padding: '6px 12px' }} onClick={() => setImportPage(p => Math.max(0, p - 1))} disabled={importPage === 0}>
                  <IconChevronLeft />
                </button>
                <button className="btn btn-g" style={{ padding: '6px 12px' }} onClick={() => setImportPage(p => Math.min(totalPages - 1, p + 1))} disabled={importPage >= totalPages - 1}>
                  <IconChevronRight />
                </button>
              </div>
            </div>

            <div style={{ overflowX: 'auto', maxHeight: '55vh', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                  <tr style={{ background: 'var(--s1)', borderBottom: '2px solid var(--br)' }}>
                    <th style={{ padding: '10px 8px', color: 'var(--acc)', width: 50, fontFamily: 'var(--mono)', fontSize: 10, borderLeft: '3px solid var(--acc)' }}>#</th>
                    {importHeaders.map((h, i) => (
                      <th key={i} style={{
                        padding: '10px 8px',
                        color: i === 0 ? 'var(--acc)' : 'var(--fg2)',
                        fontFamily: 'var(--mono)', fontSize: 10,
                        minWidth: i === 0 ? 140 : 120,
                        background: i === 0 ? 'rgba(240,192,64,0.1)' : 'transparent',
                        borderLeft: i === 0 ? '3px solid var(--acc)' : 'none',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                      }}>
                        {i === 0 ? '[REF 10 CH]' : String(h).slice(0, 18)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {importRows.slice(importPage * PAGE_SIZE, (importPage + 1) * PAGE_SIZE).map((row, rowIdx) => {
                    const absoluteIdx = importPage * PAGE_SIZE + rowIdx;
                    const isRefValid = isValidRef(row[0]);
                    return (
                      <tr key={rowIdx}
                        style={{ borderBottom: '1px solid var(--br)', background: rowIdx % 2 ? 'var(--bg2)' : 'transparent' }}>
                        <td style={{ padding: '8px', color: 'var(--fg2)', fontFamily: 'var(--mono)', fontSize: 10, borderLeft: '3px solid var(--acc)' }}>
                          {absoluteIdx + 1}
                        </td>
                        {importHeaders.map((h, colIdx) => (
                          <td key={colIdx} style={{
                            padding: '8px',
                            fontFamily: colIdx === 0 ? 'var(--mono)' : 'inherit',
                            fontSize: colIdx === 0 ? 11 : 12,
                            color: colIdx === 0 ? (isRefValid ? 'var(--acc)' : 'var(--err)') : 'var(--fg)',
                            fontWeight: colIdx === 0 ? 700 : 400,
                            background: colIdx === 0 ? 'rgba(240,192,64,0.05)' : 'transparent',
                            maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                          }}>
                            {colIdx === 0 ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{
                                  fontSize: 9, padding: '2px 4px', borderRadius: 3,
                                  background: isRefValid ? 'rgba(82,201,126,0.2)' : 'rgba(224,82,82,0.2)',
                                  color: isRefValid ? 'var(--green)' : 'var(--err)'
                                }}>
                                  {isRefValid ? 'OK' : 'ERR'}
                                </span>
                                {String(row[colIdx] || '').slice(0, 13)}
                              </span>
                            ) : String(row[colIdx] || '').slice(0, 30)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {importStep === 2 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 16, fontWeight: 700, color: 'var(--acc)' }}>
                Vista Previa de Importacion
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--fg2)', marginTop: 4, display: 'flex', gap: 16 }}>
                <span style={{ color: 'var(--green)' }}>{stats.valid} validos</span>
                {stats.dups > 0 && <span style={{ color: 'var(--warn)' }}>{stats.dups} duplicados</span>}
                {stats.invalid > 0 && <span style={{ color: 'var(--err)' }}>{stats.invalid} errores</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-g" onClick={() => setImportStep(1)}>
                <IconChevronLeft /> Corregir Mapeo
              </button>
              <button className="btn btn-p" style={{ padding: '12px 24px' }} onClick={handleConfirmImport} disabled={stats.valid === 0}>
                <IconDownload /> Importar {selectAll ? 'Todo' : `${selectedRows.size} seleccionados`}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '8px 16px', background: 'var(--s1)', borderRadius: 6, border: `1px solid ${selectAll ? 'var(--acc)' : 'var(--br)'}` }}>
              <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} style={{ width: 16, height: 16 }} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>Seleccionar todo ({bulkPreview.length})</span>
            </label>
            <span style={{ fontSize: 11, color: 'var(--fg2)' }}>
              {selectedRows.size} seleccionados
            </span>
          </div>

          <div style={{ display: 'grid', gap: 8, maxHeight: '60vh', overflowY: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '40px 30px 1fr 100px 80px 80px 80px 60px', gap: 8, padding: '10px 12px', background: 'var(--s1)', borderRadius: 6, fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700, color: 'var(--fg2)', borderBottom: '2px solid var(--br)', position: 'sticky', top: 0, zIndex: 5 }}>
              <span>#</span>
              <span></span>
              <span>DESCRIPCION</span>
              <span style={{ color: 'var(--acc)' }}>COD.ART</span>
              <span>FAM</span>
              <span>MED</span>
              <span>COLOR</span>
              <span>EST</span>
            </div>
            {bulkPreview.map((item, idx) => (
              <div key={idx} style={{
                display: 'grid', gridTemplateColumns: '40px 30px 1fr 100px 80px 80px 80px 60px', gap: 8,
                padding: '10px 12px', background: idx % 2 ? 'var(--bg2)' : 'transparent',
                borderRadius: 4, alignItems: 'center',
                border: `1px solid ${!item.valid ? 'rgba(224,82,82,0.3)' : item.existing ? 'rgba(240,192,64,0.3)' : 'transparent'}`,
                opacity: item.existing || !item.valid ? 0.7 : 1
              }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg2)' }}>{item.row}</span>
                <input type="checkbox" checked={selectedRows.has(idx)} onChange={() => toggleRow(idx)} style={{ width: 16, height: 16 }} />
                <span style={{ fontSize: 11, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.desc}>
                  {item.desc || '(sin descripcion)'}
                </span>
                <span style={{
                  fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700,
                  color: item.valid ? 'var(--acc)' : 'var(--err)'
                }}>
                  {item.ref}
                </span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg2)' }}>{item.familia || '-'}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg2)' }}>{item.medida1 || '-'}</span>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg2)' }}>{item.color || '-'}</span>
                <span style={{
                  fontFamily: 'var(--mono)', fontSize: 10, fontWeight: 700,
                  color: !item.valid ? 'var(--err)' : item.existing ? 'var(--warn)' : 'var(--green)',
                  display: 'flex', alignItems: 'center', gap: 4
                }}>
                  {!item.valid ? <><IconAlert /> {item.error?.slice(0, 8)}</> : item.existing ? 'DUPLIC' : <IconCheck />}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
