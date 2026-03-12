import { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from 'xlsx';
import { FAMILIAS, TIPOS, VARIANTES, KW, norm, analyzeText, buildRef, decodeRef, resolveIdTipo } from "../../config/erp_constants";
import { dbService } from '../../dbService';
import { useAuth } from '../../context/AuthContext';

export default function ViewCrear({ db, addArt }) {
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
