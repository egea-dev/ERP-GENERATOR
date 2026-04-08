import { useEffect, useMemo, useState, useDeferredValue, useRef } from 'react';
import { List } from 'react-window';
import * as XLSX from 'xlsx';
import { dbService } from '../../dbService';
import { detectColumn, generateTarifaRef } from '../../config/erp_constants';
import { useToast } from '../../hooks/useToast';
import { SkeletonList, SkeletonTable } from '../Skeleton';

function Spinner({ size = 24, color = 'var(--acc)' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="3" fill="none" strokeDasharray="31.4 31.4" strokeLinecap="round" />
    </svg>
  );
}

function TarifaVirtualRow({ index, style, ariaAttributes, items, copiedId, onCopy }) {
  const tarifa = items[index];

  if (!tarifa) return null;

  return (
    <div
      {...ariaAttributes}
      style={{
        ...style,
        display: 'flex',
        padding: '8px',
        borderBottom: '1px solid var(--br)',
        background: index % 2 ? 'var(--bg2)' : 'transparent',
        alignItems: 'center',
        boxSizing: 'border-box'
      }}
    >
      <div style={{ width: 120, fontWeight: 600, color: 'var(--acc)', cursor: 'pointer' }} onClick={() => onCopy(tarifa.referencia, tarifa.id)}>
        {tarifa.referencia} {copiedId === tarifa.id ? <span style={{ color: '#52c97e', fontSize: 10 }}>✓</span> : null}
      </div>
      <div style={{ width: 100 }}>{tarifa.articulo || '-'}</div>
      <div style={{ width: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={tarifa.descripcion}>{tarifa.descripcion || '-'}</div>
      <div style={{ width: 80 }}>{tarifa.serie || '-'}</div>
      <div style={{ width: 120, fontSize: 11, fontFamily: 'var(--mono)' }}>{tarifa.clave_descripcion || '-'}</div>
      <div style={{ width: 60 }}>{tarifa.familia || '-'}</div>
      <div style={{ width: 50, textAlign: 'center' }}>{tarifa.ancho ?? '-'}</div>
      <div style={{ width: 50, textAlign: 'center' }}>{tarifa.alto || '-'}</div>
      <div style={{ width: 70, textAlign: 'right' }}>{tarifa.precio != null ? `${Number(tarifa.precio).toFixed(2)} €` : '-'}</div>
    </div>
  );
}

function normalizeDimension(rawValue) {
  if (rawValue === undefined || rawValue === null || rawValue === '') return null;
  const parsed = parseFloat(String(rawValue).replace(',', '.'));
  if (Number.isNaN(parsed)) return null;
  if (parsed < 10) return Math.round(parsed * 100);
  return Math.round(parsed);
}

function normalizePrice(rawValue) {
  if (rawValue === undefined || rawValue === null || rawValue === '') return null;
  const parsed = parseFloat(String(rawValue).replace(',', '.'));
  return Number.isNaN(parsed) ? null : parsed;
}

function readWorkbook(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target.result, { type: 'binary', cellDates: true, cellNF: true });
        const firstSheet = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheet];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });
        resolve(rows);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo Excel'));
    reader.readAsBinaryString(file);
  });
}

function buildTarifaItem(row, columnas, importeYear) {
  const descripcionBase = columnas.descripcion !== -1 ? String(row[columnas.descripcion] || '').trim() : '';
  const ancho = columnas.ancho !== -1 ? normalizeDimension(row[columnas.ancho]) : null;
  const precio = columnas.precio !== -1 ? normalizePrice(row[columnas.precio]) : null;

  if (!descripcionBase || ancho === null) {
    return null;
  }

  const tarifaMeta = generateTarifaRef('TELA', descripcionBase, ancho);

  return {
    referencia: tarifaMeta.referencia,
    referencia_base: tarifaMeta.referencia,
    serie: tarifaMeta.serie,
    clave_descripcion: tarifaMeta.clave_descripcion,
    tipo_ref: tarifaMeta.tipo,
    nombre_normalizado: tarifaMeta.nombre_normalizado,
    duplicate_key: tarifaMeta.duplicate_key,
    nombre5: tarifaMeta.nombre5,
    nombre3: tarifaMeta.nombre3,
    ancho3: tarifaMeta.ancho3,
    articulo: tarifaMeta.referencia,
    familia: 'TELA',
    ancho,
    alto: null,
    precio,
    descripcion: descripcionBase,
    importe_year: importeYear,
  };
}

function buildCollisionRef(item, suffix) {
  const suffix2 = String(suffix).padStart(2, '0');
  return {
    ...item,
    referencia: `TELA${item.tipo_ref}${item.nombre3}${suffix2}${item.ancho3}`,
    serie: `${item.tipo_ref}${item.nombre3}${suffix2}`,
    clave_descripcion: `TELA-${item.tipo_ref}-${item.nombre3}-${suffix2}-${item.ancho3}`,
  };
}

function normalizeHeaderName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();
}

function resolveArticuloExportColumn(headers) {
  const exactIndex = headers.findIndex((header) => /^ARTICULOS?$/.test(normalizeHeaderName(header)));
  if (exactIndex !== -1) {
    return { headers: headers.map((header) => String(header ?? '')), articleIndex: exactIndex };
  }

  return {
    headers: ['Articulo', ...headers.map((header) => String(header ?? ''))],
    articleIndex: 0,
  };
}

function buildExportWorkbook(headers, rows, finalDraftByCanonical, rowCanonicalKeys) {
  const { headers: exportHeaders, articleIndex } = resolveArticuloExportColumn(headers);
  const prependArticulo = articleIndex === 0 && normalizeHeaderName(headers[0]) !== 'ARTICULO';

  const exportRows = rows.map((row, rowIndex) => {
    const baseRow = prependArticulo ? ['', ...row] : [...row];
    const canonicalKey = rowCanonicalKeys[rowIndex];
    if (canonicalKey && finalDraftByCanonical.has(canonicalKey)) {
      baseRow[articleIndex] = finalDraftByCanonical.get(canonicalKey).referencia;
    } else if (baseRow[articleIndex] === undefined) {
      baseRow[articleIndex] = '';
    }
    return baseRow;
  });

  return { headers: exportHeaders, rows: exportRows };
}

function sanitizeTarifaPayload(item) {
  return {
    referencia: item.referencia,
    serie: item.serie,
    clave_descripcion: item.clave_descripcion,
    articulo: item.articulo,
    familia: item.familia,
    ancho: item.ancho,
    alto: item.alto,
    precio: item.precio,
    descripcion: item.descripcion,
    importe_year: item.importe_year,
  };
}

function buildTarifaImportData(headers, rows, columnas, importeYear = new Date().getFullYear()) {
  const draftByCanonical = new Map();
  const rowCanonicalKeys = [];
  let duplicateRows = 0;
  let invalidRows = 0;

  for (const [rowIndex, row] of rows.entries()) {
    if (!row[columnas.descripcion]) {
      rowCanonicalKeys[rowIndex] = null;
      continue;
    }

    const draft = buildTarifaItem(row, columnas, importeYear);
    if (!draft) {
      rowCanonicalKeys[rowIndex] = null;
      invalidRows += 1;
      continue;
    }

    const canonicalKey = `${draft.tipo_ref}|${draft.duplicate_key}|${draft.ancho3}`;
    rowCanonicalKeys[rowIndex] = canonicalKey;

    if (!draftByCanonical.has(canonicalKey)) {
      draftByCanonical.set(canonicalKey, draft);
    } else {
      duplicateRows += 1;
    }
  }

  const byBaseReference = new Map();
  for (const draft of draftByCanonical.values()) {
    if (!byBaseReference.has(draft.referencia_base)) {
      byBaseReference.set(draft.referencia_base, []);
    }
    byBaseReference.get(draft.referencia_base).push(draft);
  }

  const finalDraftByCanonical = new Map();
  const usedReferences = new Set();
  let collisionRows = 0;

  for (const [baseReference, drafts] of byBaseReference.entries()) {
    const orderedDrafts = drafts.sort((a, b) => {
      const left = `${a.duplicate_key}|${a.articulo}`;
      const right = `${b.duplicate_key}|${b.articulo}`;
      return left.localeCompare(right);
    });

    if (orderedDrafts.length === 1 && !usedReferences.has(baseReference)) {
      const draft = orderedDrafts[0];
      usedReferences.add(draft.referencia);
      finalDraftByCanonical.set(`${draft.tipo_ref}|${draft.duplicate_key}|${draft.ancho3}`, draft);
      continue;
    }

    collisionRows += orderedDrafts.length;
    orderedDrafts.forEach((draft, index) => {
      let resolved = null;
      for (let suffix = index + 1; suffix <= 99; suffix += 1) {
        const candidate = buildCollisionRef(draft, suffix);
        if (!usedReferences.has(candidate.referencia)) {
          resolved = candidate;
          break;
        }
      }

      if (!resolved) {
        throw new Error(`No se pudo generar una referencia única para ${draft.descripcion}`);
      }

      usedReferences.add(resolved.referencia);
      finalDraftByCanonical.set(`${draft.tipo_ref}|${draft.duplicate_key}|${draft.ancho3}`, resolved);
    });
  }

  const finalTarifas = Array.from(finalDraftByCanonical.values());
  const exportWorkbook = buildExportWorkbook(headers, rows, finalDraftByCanonical, rowCanonicalKeys);

  return {
    tarifas: finalTarifas.map(sanitizeTarifaPayload),
    preview: finalTarifas.slice(0, 15),
    exportHeaders: exportWorkbook.headers,
    exportRows: exportWorkbook.rows,
    summary: {
      importableRows: finalTarifas.length,
      duplicateRows,
      invalidRows,
      collisionRows,
    },
  };
}

export default function ViewTarifas() {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSubir, setShowSubir] = useState(false);
  const [selectedProveedor, setSelectedProveedor] = useState(null);
  const [busquedaGlobal, setBusquedaGlobal] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputBusquedaRef = useRef(null);
  const { addToast } = useToast();
  const deferredBusqueda = useDeferredValue(busquedaGlobal);

  const loadProveedores = async () => {
    try {
      setLoading(true);
      const data = await dbService.getProveedores();
      setProveedores(data || []);
      setError(null);
    } catch (err) {
      setError('Error al cargar proveedores: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProveedores();
  }, []);

  const buscarTarifas = async (query) => {
    if (!query || query.length < 2) {
      setResultadosBusqueda([]);
      return;
    }
    try {
      setBuscando(true);
      const data = await dbService.getTarifas({ search: query, limit: 50 });
      setResultadosBusqueda(data || []);
    } catch (err) {
      console.error('Error en búsqueda:', err);
      setResultadosBusqueda([]);
    } finally {
      setBuscando(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      buscarTarifas(deferredBusqueda);
    }, 300);
    return () => clearTimeout(timer);
  }, [deferredBusqueda]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputBusquedaRef.current?.focus();
      }
      if (resultadosBusqueda.length === 0) return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < resultadosBusqueda.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        const item = resultadosBusqueda[selectedIndex];
        navigator.clipboard.writeText(item.referencia);
        addToast(`Copiado: ${item.referencia}`, 'success');
        setBusquedaGlobal('');
        setResultadosBusqueda([]);
        setSelectedIndex(-1);
      } else if (e.key === 'Escape') {
        setSelectedIndex(-1);
        setBusquedaGlobal('');
        setResultadosBusqueda([]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [resultadosBusqueda, selectedIndex, addToast]);

  const handleEliminar = async (id, nombre) => {
    if (!confirm(`¿Eliminar el proveedor "${nombre}" y todas sus versiones de tarifas?`)) return;
      try {
      await dbService.deleteProveedor(id);
      await loadProveedores();
      addToast('Proveedor eliminado correctamente', 'success');
    } catch (err) {
      addToast('Error al eliminar: ' + err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="main">
        <div className="stitle">BIBLIOTECA DE TARIFAS</div>
        <SkeletonList items={5} height={80} />
      </div>
    );
  }

  if (showSubir) {
    return <ViewSubirTarifas proveedores={proveedores} onVolver={() => setShowSubir(false)} onComplete={loadProveedores} addToast={addToast} />;
  }

  if (selectedProveedor) {
    return <ViewVersionesTarifas proveedor={selectedProveedor} onVolver={() => { setSelectedProveedor(null); loadProveedores(); }} addToast={addToast} />;
  }

  return (
    <div className="main">
      <div className="stitle">BIBLIOTECA DE TARIFAS</div>

      <div style={{ marginBottom: 24 }}>
        <button className="btn btn-p" onClick={() => setShowSubir(true)}>
          + Importar nueva versión
        </button>
      </div>

      <div className="card" style={{ marginBottom: 24, padding: 16 }}>
        <div style={{ marginBottom: 12, fontWeight: 600, color: 'var(--fg)' }}>Buscar en todas las tarifas</div>
        <div style={{ position: 'relative' }}>
          <input
            ref={inputBusquedaRef}
            className="mod-in"
            style={{ width: '100%', padding: '10px 40px 10px 14px', fontSize: 15 }}
            placeholder="Buscar por referencia, artículo o nombre original... (Ctrl+K)"
            value={busquedaGlobal}
            onChange={(event) => setBusquedaGlobal(event.target.value)}
          />
        {busquedaGlobal && (
          <button
            onClick={() => setBusquedaGlobal('')}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--fg2)',
              cursor: 'pointer',
              fontSize: 18,
              padding: 4
            }}
            title="Limpiar búsqueda"
          >
            ×
          </button>
        )}
        </div>
        {buscando && (
          <div style={{ marginTop: 12, color: 'var(--fg2)', fontSize: 13 }}>
            <Spinner size={16} /> Buscando...
          </div>
        )}
        {!buscando && resultadosBusqueda.length > 0 && (
          <div style={{ marginTop: 16, maxHeight: 300, overflowY: 'auto', border: '1px solid var(--br)', borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: 'var(--bg2)', borderBottom: '2px solid var(--br)' }}>
                  <th style={{ padding: '8px', textAlign: 'left', color: 'var(--fg2)' }}>Referencia</th>
                  <th style={{ padding: '8px', textAlign: 'left', color: 'var(--fg2)' }}>Artículo</th>
                  <th style={{ padding: '8px', textAlign: 'left', color: 'var(--fg2)' }}>Nombre original</th>
                  <th style={{ padding: '8px', textAlign: 'left', color: 'var(--fg2)' }}>Proveedor</th>
                  <th style={{ padding: '8px', textAlign: 'right', color: 'var(--fg2)' }}>Precio</th>
                </tr>
              </thead>
              <tbody>
                {resultadosBusqueda.map((tarifa, index) => (
                  <tr 
                    key={tarifa.id} 
                    style={{ 
                      borderBottom: '1px solid var(--br)', 
                      background: index === selectedIndex ? 'var(--acc)' : (index % 2 ? 'var(--bg2)' : 'transparent'),
                      color: index === selectedIndex ? 'white' : 'inherit',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      navigator.clipboard.writeText(tarifa.referencia);
                      addToast(`Copiado: ${tarifa.referencia}`, 'success');
                      setBusquedaGlobal('');
                      setResultadosBusqueda([]);
                    }}
                  >
                    <td style={{ padding: '8px', fontWeight: 600, color: index === selectedIndex ? 'white' : 'var(--acc)' }}>{tarifa.referencia}</td>
                    <td style={{ padding: '8px', color: index === selectedIndex ? 'white' : 'inherit' }}>{tarifa.articulo}</td>
                    <td style={{ padding: '8px', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: index === selectedIndex ? 'white' : 'inherit' }} title={tarifa.descripcion || ''}>{tarifa.descripcion || '-'}</td>
                    <td style={{ padding: '8px', fontSize: 12, color: index === selectedIndex ? 'white' : 'var(--fg2)' }}>{tarifa.proveedor_nombre || '-'}</td>
                    <td style={{ padding: '8px', textAlign: 'right', color: index === selectedIndex ? 'white' : 'inherit' }}>{tarifa.precio !== null ? `${Number(tarifa.precio).toFixed(2)} €` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!buscando && busquedaGlobal.length >= 2 && resultadosBusqueda.length === 0 && (
          <div style={{ marginTop: 16, color: 'var(--fg2)', fontSize: 13 }}>No se encontraron tarifas</div>
        )}
      </div>

      {error && <div className="alert a-e" style={{ marginBottom: 20 }}>{error}</div>}

      {proveedores.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ color: 'var(--fg2)', marginBottom: 16 }}>No hay proveedores con tarifas versionadas</div>
          <div style={{ color: 'var(--fg2)', fontSize: 13 }}>Importa la primera versión para comenzar</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {proveedores.map((proveedor) => (
            <div key={proveedor.id} className="card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--fg)' }}>{proveedor.nombre}</div>
                  <div style={{ fontSize: 13, color: 'var(--fg2)', marginTop: 6 }}>
                    {proveedor.total_versiones || 0} versiones • {proveedor.tarifas_activas || 0} tarifas activas
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--fg2)', marginTop: 6, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span>Años: {(proveedor.anos_disponibles || []).length ? proveedor.anos_disponibles.join(', ') : 'Sin histórico'}</span>
                    <span>Última importación: {proveedor.ultima_importacion ? new Date(proveedor.ultima_importacion).toLocaleDateString('es-ES') : 'N/A'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <button className="btn btn-g" onClick={() => setSelectedProveedor(proveedor)}>
                    Ver versiones
                  </button>
                  <button
                    className="btn btn-g"
                    style={{ borderColor: 'var(--err)', color: 'var(--err)' }}
                    onClick={() => handleEliminar(proveedor.id, proveedor.nombre)}
                  >
                    Eliminar proveedor
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ViewSubirTarifas({ proveedores, onVolver, onComplete, addToast }) {
  const [providerMode, setProviderMode] = useState('existing');
  const [selectedProveedorId, setSelectedProveedorId] = useState(proveedores[0]?.id || '');
  const [nombreProveedor, setNombreProveedor] = useState('');
  const [importeYear, setImporteYear] = useState(new Date().getFullYear());
  const [archivo, setArchivo] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [columnas, setColumnas] = useState({});
  const [previewData, setPreviewData] = useState([]);
  const [preparedImport, setPreparedImport] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedProveedorId && proveedores[0]?.id) {
      setSelectedProveedorId(proveedores[0].id);
    }
  }, [proveedores, selectedProveedorId]);

  const handleArchivo = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setArchivo(file);
    setError(null);
    setPreviewData([]);
    setPreparedImport(null);
    setStep(1);

    try {
      const data = await readWorkbook(file);
      if (!data.length) {
        setError('El archivo está vacío');
        return;
      }

      const detectedHeaders = data[0].map((header, index) => ({
        index,
        name: String(header || '') || `Columna ${index + 1}`,
      }));

      const headerNames = detectedHeaders.map((item) => item.name);
      setHeaders(detectedHeaders);
      setColumnas({
        articulo: detectColumn(headerNames, 'articulo'),
        ancho: detectColumn(headerNames, 'ancho'),
        precio: detectColumn(headerNames, 'precio'),
        descripcion: detectColumn(headerNames, 'descripcion'),
      });
    } catch (err) {
      setError('No se pudo leer el archivo: ' + err.message);
    }
  };

  const handlePreview = async () => {
    if (providerMode === 'existing' && !selectedProveedorId) {
      setError('Selecciona un proveedor');
      return;
    }

    if (providerMode === 'new' && !nombreProveedor.trim()) {
      setError('El nombre del proveedor es obligatorio');
      return;
    }

    if (!archivo) {
      setError('Selecciona un archivo Excel');
      return;
    }

    if (columnas.descripcion === -1 || columnas.descripcion === undefined) {
      setError('Debes seleccionar la columna de descripción o nombre de la tela');
      return;
    }

    if (columnas.ancho === -1 || columnas.ancho === undefined) {
      setError('Debes seleccionar la columna de ancho');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await readWorkbook(archivo);
      const importData = buildTarifaImportData(data[0] || [], data.slice(1), columnas, importeYear);
      if (!importData.tarifas.length) {
        setError('No hay filas válidas para importar después de limpiar duplicados y validar ancho');
        return;
      }
      setPreparedImport(importData);
      setPreviewData(importData.preview);
      setStep(2);
    } catch (err) {
      setError('No se pudo generar la vista previa: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmar = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!preparedImport || !preparedImport.tarifas.length) {
        throw new Error('Primero debes generar una vista previa válida');
      }

      const result = await dbService.importTarifaVersion({
        proveedor_id: providerMode === 'existing' ? selectedProveedorId : null,
        proveedor_nombre: providerMode === 'new' ? nombreProveedor.trim() : null,
        importe_year: importeYear,
        nombre_archivo: archivo?.name || null,
        source_headers: preparedImport.exportHeaders,
        source_rows: preparedImport.exportRows,
        tarifas: preparedImport.tarifas,
      });

      const duplicateInfo = preparedImport.summary.duplicateRows ? ` Se omitieron ${preparedImport.summary.duplicateRows} duplicadas.` : '';
      const collisionInfo = preparedImport.summary.collisionRows ? ` ${preparedImport.summary.collisionRows} referencias se ajustaron para evitar colisiones.` : '';
      addToast(`Importación completada. Revisión ${result.version.revision} creada con ${result.inserted} tarifas.${duplicateInfo}${collisionInfo}`, 'success');
      await onComplete();
      onVolver();
    } catch (err) {
      setError('Error al importar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main">
      <div className="stitle">{step === 1 ? 'IMPORTAR NUEVA VERSIÓN' : 'VISTA PREVIA DE IMPORTACIÓN'}</div>

      <div className="card" style={{ maxWidth: 760, margin: '0 auto' }}>
        {step === 1 && (
          <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <button className={`btn btn-g${providerMode === 'existing' ? ' on' : ''}`} onClick={() => setProviderMode('existing')}>
                Proveedor existente
              </button>
              <button className={`btn btn-g${providerMode === 'new' ? ' on' : ''}`} onClick={() => setProviderMode('new')}>
                Crear proveedor nuevo
              </button>
            </div>

            {providerMode === 'existing' ? (
              <div className="mod-field" style={{ marginBottom: 20 }}>
                <label className="mod-lbl">PROVEEDOR</label>
                <select
                  className="mod-in"
                  style={{ width: '100%', padding: '12px 15px', fontSize: 16 }}
                  value={selectedProveedorId}
                  onChange={(event) => setSelectedProveedorId(event.target.value)}
                >
                  <option value="">-- Seleccionar proveedor --</option>
                  {proveedores.map((proveedor) => (
                    <option key={proveedor.id} value={proveedor.id}>{proveedor.nombre}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="mod-field" style={{ marginBottom: 20 }}>
                <label className="mod-lbl">NOMBRE DEL NUEVO PROVEEDOR</label>
                <input
                  className="mod-in"
                  style={{ width: '100%', padding: '12px 15px', fontSize: 16 }}
                  placeholder="Ej: Proveedor A"
                  value={nombreProveedor}
                  onChange={(event) => setNombreProveedor(event.target.value)}
                />
              </div>
            )}

            <div className="mod-field" style={{ marginBottom: 20 }}>
              <label className="mod-lbl">AÑO DE TARIFA</label>
              <input
                className="mod-in"
                style={{ width: '100%', padding: '12px 15px', fontSize: 16 }}
                type="number"
                min="2000"
                max="2100"
                value={importeYear}
                onChange={(event) => setImporteYear(Number(event.target.value) || new Date().getFullYear())}
              />
            </div>

            <div className="mod-field" style={{ marginBottom: 20 }}>
              <label className="mod-lbl">ARCHIVO EXCEL</label>
              <label className="btn btn-g" style={{ cursor: 'pointer', width: '100%', justifyContent: 'center', borderStyle: 'dashed' }}>
                {archivo ? archivo.name : 'Seleccionar archivo Excel (.xlsx o .xls)'}
                <input type="file" accept=".xlsx,.xls" hidden onChange={handleArchivo} />
              </label>
            </div>

            {headers.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div className="mod-lbl" style={{ marginBottom: 12 }}>MAPEO DE COLUMNAS</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {[
                    { key: 'descripcion', label: 'Descripción / nombre tela *' },
                    { key: 'ancho', label: 'Ancho *' },
                    { key: 'precio', label: 'Precio' },
                  ].map((field) => (
                    <div key={field.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 130, fontSize: 13, color: 'var(--fg2)' }}>{field.label}</div>
                      <select
                        style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--br)', background: 'var(--bg2)', color: 'var(--fg)' }}
                        value={columnas[field.key] ?? -1}
                        onChange={(event) => setColumnas({ ...columnas, [field.key]: parseInt(event.target.value, 10) })}
                      >
                        <option value={-1}>-- Seleccionar --</option>
                        {headers.map((header) => (
                          <option key={header.index} value={header.index}>{header.name}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && <div className="alert a-e" style={{ marginBottom: 20 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-g" onClick={onVolver}>Cancelar</button>
              <button className="btn btn-p" onClick={handlePreview} disabled={loading || !archivo}>
                {loading ? 'Procesando...' : 'Vista previa'}
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ marginBottom: 16, fontSize: 14, color: 'var(--fg2)' }}>
              {preparedImport?.summary?.importableRows || previewData.length} tarifas listas para importar en {importeYear}.
            </div>

            {preparedImport && (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16, fontSize: 12, color: 'var(--fg2)' }}>
                <span>Duplicadas omitidas: {preparedImport.summary.duplicateRows}</span>
                <span>Filas inválidas: {preparedImport.summary.invalidRows}</span>
                <span>Colisiones resueltas: {preparedImport.summary.collisionRows}</span>
              </div>
            )}

            <div style={{ overflowX: 'auto', border: '1px solid var(--br)', borderRadius: 8, marginBottom: 24, maxHeight: 320, overflowY: 'auto' }}>
              <table style={{ minWidth: 760, width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'var(--bg2)', borderBottom: '2px solid var(--br)' }}>
                    <th style={{ padding: '10px 8px', textAlign: 'left', color: 'var(--fg2)' }}>Referencia</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', color: 'var(--fg2)' }}>Artículo</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', color: 'var(--fg2)' }}>Tipo</th>
                    <th style={{ padding: '10px 8px', textAlign: 'left', color: 'var(--fg2)' }}>Familia</th>
                    <th style={{ padding: '10px 8px', textAlign: 'center', color: 'var(--fg2)' }}>Ancho</th>
                    <th style={{ padding: '10px 8px', textAlign: 'right', color: 'var(--fg2)' }}>Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((item, index) => (
                    <tr key={`${item.referencia}-${index}`} style={{ borderBottom: '1px solid var(--br)', background: index % 2 ? 'var(--bg2)' : 'transparent' }}>
                      <td style={{ padding: '8px', fontWeight: 600, color: 'var(--acc)' }}>{item.referencia}</td>
                      <td style={{ padding: '8px' }}>{item.articulo}</td>
                      <td style={{ padding: '8px' }}>{item.tipo_ref}</td>
                      <td style={{ padding: '8px' }}>{item.familia || '-'}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>{item.ancho ?? '-'}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{item.precio !== null ? `${Number(item.precio).toFixed(2)} €` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {error && <div className="alert a-e" style={{ marginBottom: 20 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-g" onClick={() => setStep(1)} disabled={loading}>Atrás</button>
              <button className="btn btn-p" onClick={handleConfirmar} disabled={loading}>
                {loading ? 'Importando...' : 'Confirmar importación'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ViewVersionesTarifas({ proveedor, onVolver, addToast }) {
  const [versions, setVersions] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedVersionId, setSelectedVersionId] = useState('');
  const [tarifas, setTarifas] = useState([]);
  const [familias, setFamilias] = useState([]);
  const [filtros, setFiltros] = useState({ familia: '', search: '' });
  const [loadingVersions, setLoadingVersions] = useState(true);
  const [loadingTarifas, setLoadingTarifas] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ field: 'referencia', direction: 'asc' });

  const deferredSearch = useDeferredValue(filtros.search);

  const loadVersions = async (preferredVersionId) => {
    try {
      setLoadingVersions(true);
      const data = await dbService.getTarifaVersiones(proveedor.id);
      const list = data || [];
      setVersions(list);

      if (!list.length) {
        setSelectedYear('');
        setSelectedVersionId('');
        setTarifas([]);
        setFamilias([]);
        return;
      }

      const preferred = preferredVersionId
        ? list.find((item) => item.id === preferredVersionId)
        : list.find((item) => item.is_active) || list[0];

      setSelectedYear(String(preferred.importe_year));
      setSelectedVersionId(preferred.id);
    } catch (err) {
      addToast('Error al cargar versiones: ' + err.message, 'error');
    } finally {
      setLoadingVersions(false);
    }
  };

  useEffect(() => {
    loadVersions();
  }, [proveedor.id]);

  const years = useMemo(() => {
    return [...new Set(versions.map((item) => item.importe_year))].sort((a, b) => b - a);
  }, [versions]);

  const versionsForYear = useMemo(() => {
    if (!selectedYear) return versions;
    return versions.filter((item) => String(item.importe_year) === String(selectedYear));
  }, [versions, selectedYear]);

  useEffect(() => {
    if (!versionsForYear.length) return;
    if (!versionsForYear.some((item) => item.id === selectedVersionId)) {
      const nextVersion = versionsForYear.find((item) => item.is_active) || versionsForYear[0];
      setSelectedVersionId(nextVersion.id);
    }
  }, [versionsForYear, selectedVersionId]);

  const selectedVersion = useMemo(() => {
    return versions.find((item) => item.id === selectedVersionId) || null;
  }, [versions, selectedVersionId]);

  useEffect(() => {
    if (copiedId) {
      const timer = setTimeout(() => setCopiedId(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [copiedId]);

  useEffect(() => {
    const loadTarifas = async () => {
      if (!selectedVersionId) return;
      try {
        setLoadingTarifas(true);
        const [tarifasData, familiasData] = await Promise.all([
          dbService.getTarifas({ version_id: selectedVersionId, familia: filtros.familia, search: deferredSearch }),
          dbService.getFamilias({ version_id: selectedVersionId }),
        ]);
        setTarifas(tarifasData || []);
        setFamilias(familiasData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingTarifas(false);
      }
    };

    loadTarifas();
  }, [selectedVersionId, filtros.familia, deferredSearch]);

  const sortedTarifas = useMemo(() => {
    if (!tarifas.length) return [];
    const sorted = [...tarifas].sort((a, b) => {
      const aVal = a[sortConfig.field] ?? '';
      const bVal = b[sortConfig.field] ?? '';
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      const comparison = String(aVal).localeCompare(String(bVal));
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [tarifas, sortConfig]);

  const handleSort = (field) => {
    setSortConfig((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const SortIcon = ({ field }) => (
    <span style={{ marginLeft: 4, opacity: sortConfig.field === field ? 1 : 0.3 }}>
      {sortConfig.field === field ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  );

  const activateVersion = async () => {
    if (!selectedVersionId || !selectedVersion || selectedVersion.is_active) return;
    try {
      setActionLoading(true);
      await dbService.activateTarifaVersion(selectedVersionId);
      await loadVersions(selectedVersionId);
    } catch (err) {
      addToast('No se pudo activar la versión: ' + err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteVersion = async () => {
    if (!selectedVersion) return;
    if (!confirm(`¿Eliminar la revisión ${selectedVersion.revision} del año ${selectedVersion.importe_year}?`)) return;

    try {
      setActionLoading(true);
      await dbService.deleteTarifaVersion(selectedVersion.id);
      const updated = versions.filter((item) => item.id !== selectedVersion.id);
      if (!updated.length) {
        onVolver();
        return;
      }
      await loadVersions();
    } catch (err) {
      addToast('No se pudo eliminar la versión: ' + err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const downloadVersionExcel = async () => {
    if (!selectedVersionId) return;

    try {
      setDownloadLoading(true);
      const exportData = await dbService.getTarifaVersionExportData(selectedVersionId);
      const workbook = XLSX.utils.book_new();
      const sheet = XLSX.utils.aoa_to_sheet([
        exportData.headers || [],
        ...(exportData.rows || []),
      ]);
      XLSX.utils.book_append_sheet(workbook, sheet, 'Tarifas');

      let fileName = exportData.file_name || `${proveedor.nombre}-${selectedVersion?.importe_year || 'tarifas'}-rev${selectedVersion?.revision || 1}.xlsx`;
      if (!fileName.toLowerCase().endsWith('.xlsx')) {
        fileName += '.xlsx';
      }

      XLSX.writeFile(workbook, fileName);

      if (!exportData.original_layout) {
        addToast('Esta versión no tenía el Excel original guardado. Se descargó una exportación normalizada.', 'warning');
      }
    } catch (err) {
      addToast('No se pudo descargar el Excel: ' + err.message, 'error');
    } finally {
      setDownloadLoading(false);
    }
  };

  const copyToClipboard = async (text, id) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
  };

  return (
    <div className="main">
      <div className="stitle">TARIFAS VERSIONADAS: {proveedor.nombre}</div>

      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        {loadingVersions ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--fg2)' }}>
            <Spinner size={18} />
            <span>Cargando versiones...</span>
          </div>
        ) : versions.length === 0 ? (
          <div style={{ color: 'var(--fg2)' }}>Este proveedor no tiene versiones importadas.</div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <select
                className="mod-in"
                style={{ width: 140, padding: '8px 12px' }}
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
              >
                {years.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>

              <select
                className="mod-in"
                style={{ minWidth: 240, padding: '8px 12px' }}
                value={selectedVersionId}
                onChange={(event) => setSelectedVersionId(event.target.value)}
              >
                {versionsForYear.map((version) => (
                  <option key={version.id} value={version.id}>
                    Rev. {version.revision} {version.is_active ? '• ACTIVA' : ''} ({version.total_tarifas} tarifas)
                  </option>
                ))}
              </select>

              {selectedVersion && (
                <div style={{ color: 'var(--fg2)', fontSize: 12 }}>
                  {selectedVersion.nombre_archivo || 'Importación manual'} • {new Date(selectedVersion.created_at).toLocaleDateString('es-ES')}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <button className="btn btn-g" disabled={downloadLoading || !selectedVersion} onClick={downloadVersionExcel}>
                {downloadLoading ? 'Descargando...' : 'Descargar Excel'}
              </button>

              {selectedVersion?.is_active ? (
                <span style={{ padding: '6px 10px', borderRadius: 999, background: 'rgba(82, 201, 126, 0.12)', color: '#52c97e', fontSize: 12, fontWeight: 700 }}>
                  Versión activa
                </span>
              ) : (
                <button className="btn btn-p" disabled={actionLoading} onClick={activateVersion}>
                  Activar versión
                </button>
              )}

              <button className="btn btn-g" style={{ borderColor: 'var(--err)', color: 'var(--err)' }} disabled={actionLoading || !selectedVersion} onClick={deleteVersion}>
                Eliminar versión
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedVersion && (
        <div className="card" style={{ marginBottom: 20, padding: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              className="mod-in"
              style={{ width: 220, padding: '8px 12px' }}
              placeholder="Buscar referencia, artículo o nombre original..."
              value={filtros.search}
              onChange={(event) => setFiltros({ ...filtros, search: event.target.value })}
            />
            <select
              className="mod-in"
              style={{ width: 180, padding: '8px 12px' }}
              value={filtros.familia}
              onChange={(event) => setFiltros({ ...filtros, familia: event.target.value })}
            >
              <option value="">Todas las familias</option>
              {familias.map((familia) => (
                <option key={familia} value={familia}>{familia}</option>
              ))}
            </select>
            <div style={{ marginLeft: 'auto', color: 'var(--fg2)', fontSize: 13 }}>{tarifas.length} resultados</div>
          </div>
        </div>
      )}

      {loadingTarifas ? (
        <SkeletonTable rows={8} columns={9} />
      ) : selectedVersion && tarifas.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--fg2)' }}>
          No hay tarifas para los filtros seleccionados
        </div>
      ) : selectedVersion ? (
        <div style={{ border: '1px solid var(--br)', borderRadius: 8, height: 500, display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: 'var(--bg2)', borderBottom: '2px solid var(--br)', display: 'flex', padding: '10px 8px' }}>
            <div style={{ width: 120, color: 'var(--fg2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }} onClick={() => handleSort('referencia')}>Referencia<SortIcon field="referencia" /></div>
            <div style={{ width: 100, color: 'var(--fg2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }} onClick={() => handleSort('articulo')}>Artículo<SortIcon field="articulo" /></div>
            <div style={{ width: 180, color: 'var(--fg2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }} onClick={() => handleSort('descripcion')}>Nombre original<SortIcon field="descripcion" /></div>
            <div style={{ width: 80, color: 'var(--fg2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }} onClick={() => handleSort('serie')}>Serie<SortIcon field="serie" /></div>
            <div style={{ width: 120, color: 'var(--fg2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }} onClick={() => handleSort('clave_descripcion')}>Clave<SortIcon field="clave_descripcion" /></div>
            <div style={{ width: 60, color: 'var(--fg2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }} onClick={() => handleSort('familia')}>Familia<SortIcon field="familia" /></div>
            <div style={{ width: 50, textAlign: 'center', color: 'var(--fg2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }} onClick={() => handleSort('ancho')}>Ancho<SortIcon field="ancho" /></div>
            <div style={{ width: 50, textAlign: 'center', color: 'var(--fg2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }} onClick={() => handleSort('alto')}>Alto<SortIcon field="alto" /></div>
            <div style={{ width: 70, textAlign: 'right', color: 'var(--fg2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }} onClick={() => handleSort('precio')}>Precio<SortIcon field="precio" /></div>
          </div>
          <div style={{ flex: 1 }}>
            <List
              rowComponent={TarifaVirtualRow}
              rowCount={sortedTarifas.length}
              rowHeight={42}
              rowProps={{ items: sortedTarifas, copiedId, onCopy: copyToClipboard }}
              overscanCount={8}
              defaultHeight={450}
              style={{ height: 450, overflow: 'auto' }}
            />
          </div>
        </div>
      ) : null}

      <div style={{ marginTop: 20 }}>
        <button className="btn btn-g" onClick={onVolver}>← Volver</button>
      </div>
    </div>
  );
}
