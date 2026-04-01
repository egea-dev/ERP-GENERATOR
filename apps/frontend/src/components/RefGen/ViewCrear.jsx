import { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from 'xlsx';
import { FAMILIAS, TIPOS, VARIANTES, KW, norm, analyzeText, buildRef, decodeRef, resolveIdTipo } from "../../config/erp_constants";
import { dbService } from '../../dbService';
import { useAuth } from '../../context/AuthContext';

export default function ViewCrear({ db, addArt, onLoadArt }) {
  const { user } = useAuth();
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
  const [bulkPreview, setBulkPreview] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [columnOptions, setColumnOptions] = useState([]);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [rawExcelData, setRawExcelData] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [autoDetectedColumn, setAutoDetectedColumn] = useState(null);
  const ref_ = useRef();

  const detectDescriptionColumn = (headers) => {
    const keywords = ['desc', 'descripcion', 'description', 'nombre', 'name', 'articulo', 'article', 'producto', 'product', 'item'];
    for (let i = 0; i < headers.length; i++) {
      const h = String(headers[i]).toLowerCase().trim();
      if (keywords.some(k => h.includes(k))) {
        return i;
      }
    }
    return -1;
  };

  const processExcelData = (data, colIdx) => {
    const bulkItems = data.slice(1).filter(row => row[colIdx]).map(row => {
      const desc = String(row[colIdx]);
      const analysis = analyzeText(desc);
      const ref = buildRef(
        analysis.familia, analysis.tipo, analysis.variante,
        analysis.ancho, analysis.alto, null, null, null,
        resolveIdTipo(null, analysis.ancho, analysis.alto, analysis.variante, false)
      );
      return { desc, ...analysis, ref };
    });
    setBulkPreview(bulkItems);
    setShowPreview(true);
  };

  const handleColumnSelect = (colIdx) => {
    setSelectedColumn(colIdx);
    processExcelData(rawExcelData, colIdx);
    setShowColumnSelector(false);
  };

  useEffect(() => {
    if (!onLoadArt) return;
    setText(onLoadArt.desc || "");
    setFamilia(onLoadArt.familia || "");
    setTipo(onLoadArt.tipo || "");
    setVariante(onLoadArt.variante || "");
    setAncho(onLoadArt.ancho || "");
    setAlto(onLoadArt.alto || "");
    setColeccion(onLoadArt.coleccion || "");
    setModelo(onLoadArt.modelo || "");
    setColor(onLoadArt.color || "");
    setSaved(false);
  }, [onLoadArt]);

  const isCode = useMemo(() => {
    const u = text.trim().toUpperCase();
    const sorted = [...FAMILIAS].sort((a, b) => b.codigo.length - a.codigo.length);
    return u.length >= 5 && !/\s/.test(u) && sorted.some((f) => u.startsWith(f.codigo));
  }, [text]);

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

  const tiposDesdeDB = useMemo(() => {
    if (!familia) return [];
    const existentes = TIPOS.filter(t => t.familia === familia).map(t => t.codigo);
    const m = new Map();
    db.filter(a => a.familia === familia && a.tipo && !existentes.includes(a.tipo))
      .forEach(a => m.set(a.tipo, { codigo: a.tipo, desc: "HIST", familia, idTipo: ["tamano", "modelo", "variante"] }));
    return Array.from(m.values());
  }, [db, familia]);

  const dummyTipo = tipo ? { codigo: tipo, desc: "LIBRE", familia, idTipo: ["tamano", "modelo", "variante"] } : null;
  const tipoObj = TIPOS.find((t) => t.codigo === tipo && t.familia === familia)
    || tiposDesdeDB.find((t) => t.codigo === tipo)
    || dummyTipo;
  const tiposFamilia = familia ? TIPOS.filter((t) => t.familia === familia) : [];

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

  const exportToExcel = (items) => {
    const exportData = items.map(item => ({
      REFERENCIA: item.ref || '',
      DESCRIPCION: item.desc || '',
      FAMILIA: item.familia || '',
      TIPO: item.tipo || '',
      VARIANTE: item.variante || '',
      ANCHO: item.ancho || '',
      ALTO: item.alto || ''
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Referencias");
    const date = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `referencias_generadas_${date}.xlsx`);
  };

  const handleBulkConfirm = async () => {
    const validItems = bulkPreview.filter(item => item.ref);
    for (const item of validItems) {
      try {
        await dbService.saveArticulo({
          referencia: item.ref,
          descripcion: item.desc,
          familia: item.familia,
          tipo: item.tipo,
          variante: item.variante || null,
          ancho: item.ancho || null,
          alto: item.alto || null,
          creado_por: user?.id
        });
      } catch (e) {
        console.error("Error guardando artículo:", e);
      }
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
        user: user?.email || "usuario",
      });
    }
    dbService.logSystemAction('BULK_IMPORT', 'REFGEN', { count: validItems.length });
    exportToExcel(bulkPreview);
    setShowPreview(false);
    setBulkPreview([]);
    alert(`${validItems.length} artículos guardados y exportados correctamente.`);
  };

  const handleBulkCancel = () => {
    setShowPreview(false);
    setBulkPreview([]);
  };

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
              
              if (data.length === 0) {
                alert("El archivo está vacío");
                return;
              }
              
              const headers = data[0];
              const colIdx = detectDescriptionColumn(headers);
              
              setRawExcelData(data);
              setColumnOptions(headers.map((h, i) => ({ index: i, name: String(h) || `Columna ${i + 1}` })));
              setAutoDetectedColumn(colIdx >= 0 ? colIdx : null);
              setSelectedColumn(colIdx >= 0 ? colIdx : null);
              setShowColumnSelector(true);
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

      {showPreview && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowPreview(false)}>
          <div style={{
            background: 'var(--bg)', borderRadius: 12, padding: 24, maxWidth: '95%', width: '95%',
            maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexShrink: 0 }}>
              <div className="stitle" style={{ margin: 0, whiteSpace: 'nowrap' }}>PREVIEW: {bulkPreview.length} ARTÍCULOS</div>
              <button onClick={() => setShowPreview(false)} style={{
                background: 'transparent', border: 'none', color: 'var(--fg)', fontSize: 24, cursor: 'pointer'
              }}>×</button>
            </div>
            
            <div style={{ marginBottom: 20, fontSize: 13, color: 'var(--fg2)' }}>
              Los siguientes artículos serán guardados y exportados. Revisa las referencias generadas.
            </div>

            <div style={{ flex: 1, overflow: 'auto', border: '1px solid var(--br)', borderRadius: 8, marginBottom: 24, minHeight: 200 }}>
              <table style={{ minWidth: 700, width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--bg2)', borderBottom: '2px solid var(--br)' }}>
                    <th style={{ padding: '10px 8px', textAlign: 'left', color: 'var(--fg2)', width: 50 }}>#</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', color: 'var(--fg2)', width: 120 }}>REFERENCIA</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', color: 'var(--fg2)', minWidth: 200 }}>DESCRIPCIÓN</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', color: 'var(--fg2)', width: 80 }}>FAMILIA</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', color: 'var(--fg2)', width: 80 }}>TIPO</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', color: 'var(--fg2)', width: 80 }}>VARIANTE</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', color: 'var(--fg2)', width: 100 }}>MEDIDAS</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkPreview.slice(0, 20).map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--br)', background: idx % 2 ? 'var(--bg2)' : 'transparent' }}>
                      <td style={{ padding: '8px', color: 'var(--fg2)' }}>{idx + 1}</td>
                      <td style={{ padding: '8px', fontWeight: 600, color: item.ref ? 'var(--acc)' : 'var(--err)' }}>
                        {item.ref || 'SIN REF'}
                      </td>
                      <td style={{ padding: '8px', minWidth: 200, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.desc}
                      </td>
                      <td style={{ padding: '8px' }}>{item.familia || '-'}</td>
                      <td style={{ padding: '8px' }}>{item.tipo || '-'}</td>
                      <td style={{ padding: '8px' }}>{item.variante || '-'}</td>
                      <td style={{ padding: '8px' }}>
                        {item.ancho && item.alto ? `${item.ancho}×${item.alto}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {bulkPreview.length > 20 && (
              <div style={{ marginBottom: 20, fontSize: 13, color: 'var(--fg2)', textAlign: 'center' }}>
                ... y {bulkPreview.length - 20} artículos más
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', flexShrink: 0 }}>
              <button className="btn btn-g" onClick={handleBulkCancel}>CANCELAR</button>
              <button className="btn btn-p" onClick={handleBulkConfirm}>
                CONFIRMAR Y EXPORTAR EXCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {showColumnSelector && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowColumnSelector(false)}>
          <div style={{
            background: 'var(--bg)', borderRadius: 16, padding: 32, maxWidth: 600, width: '92%',
            maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 80px rgba(0,0,0,0.6)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: 28, flexShrink: 0 }}>
              <div style={{ 
                width: 64, height: 64, borderRadius: '50%', 
                background: 'linear-gradient(135deg, var(--acc), #e6a73c)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <line x1="10" y1="9" x2="8" y2="9"></line>
                </svg>
              </div>
              <div className="stitle" style={{ marginBottom: 8 }}>IMPORTAR DESDE EXCEL</div>
              <div style={{ fontSize: 14, color: 'var(--fg2)', wordBreak: 'break-word' }}>
                Selecciona la columna que contiene las <strong style={{ color: 'var(--acc)' }}>descripciones de artículos</strong>
              </div>
            </div>

            <div style={{ marginBottom: 24, maxHeight: '50vh', overflow: 'auto', paddingRight: 8 }}>
              {columnOptions.map((col) => {
                const isAutoDetected = autoDetectedColumn === col.index;
                const isSelected = selectedColumn === col.index;
                return (
                  <div 
                    key={col.index}
                    onClick={() => setSelectedColumn(col.index)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 16,
                      padding: '16px 20px', marginBottom: 10,
                      borderRadius: 12, border: '2px solid',
                      borderColor: isSelected ? 'var(--acc)' : isAutoDetected ? 'var(--warn)' : 'var(--br)',
                      background: isSelected ? 'rgba(240, 192, 64, 0.12)' : isAutoDetected ? 'rgba(240, 192, 64, 0.05)' : 'var(--bg2)',
                      cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0
                    }}
                  >
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', border: '3px solid',
                      borderColor: isSelected ? 'var(--acc)' : isAutoDetected ? 'var(--warn)' : 'var(--br)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isSelected && <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--acc)' }} />}
                      {isAutoDetected && !isSelected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warn)' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      <div style={{ 
                        fontWeight: 600, fontSize: 15, 
                        color: isSelected ? 'var(--acc)' : isAutoDetected ? 'var(--warn)' : 'var(--fg)',
                        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap'
                      }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{col.name}</span>
                        {isAutoDetected && <span style={{ 
                          fontSize: 10, fontWeight: 500, 
                          background: 'var(--warn)', color: 'var(--bg)',
                          padding: '2px 8px', borderRadius: 10
                        }}>AUTO</span>}
                      </div>
                      {rawExcelData[1] && rawExcelData[1][col.index] && (
                        <div style={{ fontSize: 12, color: 'var(--fg2)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ opacity: 0.6 }}>Ej:</span> {String(rawExcelData[1][col.index]).slice(0, 40)}
                        </div>
                      )}
                    </div>
                    <div style={{ 
                      fontSize: 11, color: 'var(--fg2)', 
                      background: 'var(--bg)', padding: '4px 10px', borderRadius: 8
                    }}>
                      Col {col.index + 1}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 14, marginTop: 'auto', flexShrink: 0 }}>
              <button className="btn btn-g" style={{ flex: 1, padding: '14px 20px' }} onClick={() => setShowColumnSelector(false)}>
                CANCELAR
              </button>
              <button className="btn btn-p" style={{ flex: 1, padding: '14px 20px' }} onClick={() => {
                if (selectedColumn !== null) {
                  handleColumnSelect(selectedColumn);
                } else {
                  alert("Selecciona una columna");
                }
              }}>
                CONTINUAR →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
