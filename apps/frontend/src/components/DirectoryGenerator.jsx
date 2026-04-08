import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { dbService } from '../dbService';
import { useAuth } from '../context/AuthContext';

const TYPE_MAP = {
    HOTEL: 'H',
    APARTAHOTEL: 'A',
    HOSTAL: 'HO',
    RESIDENCIA: 'R',
    RESTAURANTE: 'REST',
    VIVIENDA: 'V',
};

const FOLDER_STATUS_META = {
    not_requested: { label: 'No solicitada', bg: 'rgba(120, 120, 120, 0.12)', color: 'var(--tx2)' },
    pending: { label: 'Pendiente', bg: 'rgba(59, 130, 246, 0.14)', color: '#3b82f6' },
    processing: { label: 'Creando', bg: 'rgba(251, 191, 36, 0.16)', color: '#f59e0b' },
    done: { label: 'Creada', bg: 'rgba(82, 201, 126, 0.16)', color: '#52c97e' },
    error: { label: 'Error', bg: 'rgba(239, 68, 68, 0.16)', color: '#ef4444' },
};

function normalizeFolderJob(job = {}, fallback = {}) {
    const source = job || {};

    return {
        directorio_id: source.directorio_id || fallback.directorio_id || null,
        folder_name: source.folder_name || fallback.folder_name || null,
        display_path: source.display_path || fallback.display_path || null,
        status: source.status || fallback.status || 'not_requested',
        attempts: source.attempts || 0,
        last_error: source.last_error || null,
        requested_at: source.requested_at || null,
        started_at: source.started_at || null,
        completed_at: source.completed_at || null,
        worker_id: source.worker_id || null,
    };
}

function getFolderStatusMeta(status) {
    return FOLDER_STATUS_META[status] || FOLDER_STATUS_META.not_requested;
}

function FolderStatusBadge({ status }) {
    const meta = getFolderStatusMeta(status);

    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 8px',
                borderRadius: 999,
                background: meta.bg,
                color: meta.color,
                fontWeight: 700,
                fontSize: 11,
            }}
        >
            {meta.label}
        </span>
    );
}

export default function DirectoryGenerator({ tab, setTab }) {
    const { user } = useAuth();
    const [gestor, setGestor] = useState('');
    const [proyecto, setProyecto] = useState('');
    const [nombreAsignado, setNombreAsignado] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [history, setHistory] = useState([]);
    const [saved, setSaved] = useState(false);
    const [showSaveSuccess, setShowSaveSuccess] = useState(false);
    const [savedRecord, setSavedRecord] = useState(null);
    const [folderJob, setFolderJob] = useState(normalizeFolderJob());
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [requestingFolder, setRequestingFolder] = useState(false);
    const [error, setError] = useState('');
    const [q, setQ] = useState('');

    useEffect(() => {
        if (tab === 'hist') {
            loadHistory();
        }
    }, [tab]);

    useEffect(() => {
        if (!savedRecord?.id) return undefined;
        if (!['pending', 'processing'].includes(folderJob.status)) return undefined;

        const intervalId = setInterval(async () => {
            try {
                const status = await dbService.getDirectorioFolderStatus(savedRecord.id);
                setSavedRecord((prev) => (prev ? { ...prev, ruta_completa: status.display_path || prev.ruta_completa } : prev));
                setFolderJob(normalizeFolderJob(status, {
                    directorio_id: savedRecord.id,
                    folder_name: savedRecord.nombre_directorio,
                    display_path: savedRecord.ruta_completa,
                }));
            } catch (statusError) {
                console.error('Error consultando estado de carpeta:', statusError);
            }
        }, 3000);

        return () => clearInterval(intervalId);
    }, [savedRecord, folderJob.status]);

    const loadHistory = async () => {
        try {
            setLoadingHistory(true);
            const data = await dbService.getDirectorios();
            setHistory(data || []);
        } catch (historyError) {
            setError(historyError.message || 'No se pudo cargar el historial de directorios.');
        } finally {
            setLoadingHistory(false);
        }
    };

    const filteredHistory = useMemo(() => {
        const query = q.toUpperCase().trim();
        return history.filter((h) =>
            h.nombre_directorio.toUpperCase().includes(query)
            || h.nombre_proyecto.toUpperCase().includes(query)
            || h.credencial_usuario.toUpperCase().includes(query)
        );
    }, [history, q]);

    const codigoGestor = useMemo(() => {
        const clean = gestor.trim().toUpperCase().replace(/[^A-Z0-9\s]/g, '');
        const words = clean.split(/\s+/).filter((word) => word.length > 0);
        if (words.length === 0) return 'XXX';
        if (words.length === 1) return words[0].slice(0, 3);
        const initials = words.map((word) => word[0]).join('');
        return initials.length > 3 ? initials.slice(0, 3) : initials.padEnd(3, 'X').slice(0, 3);
    }, [gestor]);

    const codigoProyecto = useMemo(() => {
        let words = proyecto.trim().toUpperCase().split(/[\s-]+/).filter((word) => word.length > 1);
        if (words.length === 0) return '';

        let prefix = '';
        const firstWord = words[0];
        if (TYPE_MAP[firstWord]) {
            prefix = TYPE_MAP[firstWord];
            words = words.slice(1);
        }
        if (words.length === 0) return prefix.slice(0, 7);
        if (words.length === 1) return (prefix + words[0]).slice(0, 7);

        const remainingSpace = 7 - prefix.length;
        let namePart = '';

        if (words.length === 2) {
            const split = Math.ceil(remainingSpace / 2);
            namePart = words[0].slice(0, split) + words[1].slice(0, remainingSpace - split);
        } else {
            const initials = words.slice(0, -2).map((word) => word[0]).join('');
            const preLast = words[words.length - 2];
            const lastWord = words[words.length - 1];
            namePart = (initials + preLast.slice(0, 2) + lastWord).slice(0, remainingSpace);
        }

        return (prefix + namePart).slice(0, 7);
    }, [proyecto]);

    const nombreLimpio = useMemo(() => {
        return nombreAsignado.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5);
    }, [nombreAsignado]);

    const directorio = `${codigoGestor}${codigoProyecto}${nombreLimpio}`.slice(0, 15);
    const totalLen = directorio.length;
    const currentDisplayPath = savedRecord?.ruta_completa || folderJob.display_path || 'La ruta definitiva se asigna al guardar el directorio.';

    const markDirty = () => {
        setSaved(false);
        setShowSaveSuccess(false);
        setSavedRecord(null);
        setFolderJob(normalizeFolderJob());
        setError('');
    };

    const clearForm = () => {
        setGestor('');
        setProyecto('');
        setNombreAsignado('');
        setDescripcion('');
        setSaved(false);
        setShowSaveSuccess(false);
        setSavedRecord(null);
        setFolderJob(normalizeFolderJob());
        setError('');
    };

    const handleSave = async () => {
        if (!proyecto || !nombreAsignado || !gestor) {
            setError('Completa los campos obligatorios.');
            return;
        }

        setError('');

        try {
            const result = await dbService.saveDirectorio({
                nombre_directorio: directorio,
                credencial_usuario: codigoGestor,
                nombre_proyecto: proyecto,
                codigo_proyecto: codigoProyecto,
                nombre_asignado: nombreLimpio,
                descripcion,
                creado_por: user?.id,
            });

            setSaved(true);
            setShowSaveSuccess(true);
            setSavedRecord(result);
            setFolderJob(normalizeFolderJob(null, {
                directorio_id: result.id,
                folder_name: result.nombre_directorio,
                display_path: result.ruta_completa,
            }));
            await dbService.insertLog('SAVE', 'URLGEN', { directorio: result.nombre_directorio });
        } catch (saveError) {
            console.error('URLGEN save error:', saveError);
            setError(saveError.message || 'No se pudo guardar el directorio.');
        }
    };

    const handleRequestFolder = async () => {
        if (!savedRecord?.id) {
            setError('Guarda primero el directorio antes de solicitar la creación en servidor.');
            return;
        }

        try {
            setRequestingFolder(true);
            setError('');
            const job = await dbService.requestDirectorioFolder(savedRecord.id);
            setSavedRecord((prev) => (prev ? { ...prev, ruta_completa: job.display_path || prev.ruta_completa } : prev));
            setFolderJob(normalizeFolderJob(job, {
                directorio_id: savedRecord.id,
                folder_name: savedRecord.nombre_directorio,
                display_path: savedRecord.ruta_completa,
            }));
        } catch (requestError) {
            console.error('URLGEN request-folder error:', requestError);
            setError(requestError.message || 'No se pudo solicitar la carpeta al worker privado.');
        } finally {
            setRequestingFolder(false);
        }
    };

    const loadRow = (row) => {
        setGestor(row.credencial_usuario || '');
        setProyecto(row.nombre_proyecto || '');
        setNombreAsignado(row.nombre_asignado || '');
        setDescripcion(row.descripcion || '');
        setSaved(true);
        setShowSaveSuccess(false);
        setSavedRecord(row);
        setFolderJob(normalizeFolderJob({
            directorio_id: row.id,
            folder_name: row.nombre_directorio,
            display_path: row.ruta_completa,
            status: row.folder_status,
            attempts: row.folder_attempts,
            last_error: row.folder_last_error,
            requested_at: row.folder_requested_at,
            started_at: row.folder_started_at,
            completed_at: row.folder_completed_at,
            worker_id: row.folder_worker_id,
        }));
        setError('');
        setTab('crear');
    };

    if (tab === 'hist') {
        return (
            <div className="main" style={{ maxWidth: 1180, margin: '0 auto', width: '100%' }}>
                <div className="stitle" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    Historial Directorios
                    <button
                        className="btn btn-g"
                        style={{ padding: '6px 12px' }}
                        onClick={() => {
                            const ws = XLSX.utils.json_to_sheet(history);
                            const wb = XLSX.utils.book_new();
                            XLSX.utils.book_append_sheet(wb, ws, 'Directorios');
                            XLSX.writeFile(wb, 'Egea_Directorios.xlsx');
                            dbService.insertLog('XLS_EXPORT', 'URLGEN', { count: history.length });
                        }}
                    >
                        EXPORTAR EXCEL
                    </button>
                </div>

                <div className="card" style={{ marginBottom: 15, padding: '15px 20px' }}>
                    <div className="search-box">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input
                            className="search-in"
                            placeholder="Buscar por referencia, proyecto o gestor..."
                            value={q}
                            onChange={(event) => setQ(event.target.value)}
                        />
                    </div>
                </div>

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead style={{ background: 'var(--br)', color: 'var(--tx2)' }}>
                            <tr>
                                <th style={{ padding: '12px 15px', textAlign: 'left' }}>REFERENCIA</th>
                                <th style={{ padding: '12px 15px', textAlign: 'left' }}>PROYECTO</th>
                                <th style={{ padding: '12px 15px', textAlign: 'left' }}>GESTOR</th>
                                <th style={{ padding: '12px 15px', textAlign: 'left' }}>CARPETA</th>
                                <th style={{ padding: '12px 15px', textAlign: 'right' }}>FECHA</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingHistory ? (
                                <tr><td colSpan="5" style={{ padding: 30, textAlign: 'center', color: 'var(--tx3)' }}>Cargando historial...</td></tr>
                            ) : filteredHistory.length > 0 ? filteredHistory.map((item, index) => (
                                <tr
                                    key={item.id}
                                    className="hist-row-hover"
                                    onClick={() => loadRow(item)}
                                    style={{ borderBottom: '1px solid var(--br2)', background: index % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)', cursor: 'pointer' }}
                                >
                                    <td style={{ padding: '12px 15px', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--acc2)' }}>{item.nombre_directorio}</td>
                                    <td style={{ padding: '12px 15px' }}>
                                        <div style={{ fontWeight: 600 }}>{item.nombre_proyecto}</div>
                                        {item.descripcion ? <div style={{ fontSize: 11, color: 'var(--tx3)' }}>{item.descripcion}</div> : null}
                                    </td>
                                    <td style={{ padding: '12px 15px' }}>{item.credencial_usuario}</td>
                                    <td style={{ padding: '12px 15px' }}>
                                        <FolderStatusBadge status={item.folder_status || 'not_requested'} />
                                        {item.folder_last_error ? <div style={{ marginTop: 6, fontSize: 11, color: '#ef4444' }}>{item.folder_last_error}</div> : null}
                                    </td>
                                    <td style={{ padding: '12px 15px', textAlign: 'right', color: 'var(--tx3)' }}>{new Date(item.fecha_creacion).toLocaleDateString()}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan="5" style={{ padding: 30, textAlign: 'center', color: 'var(--tx3)' }}>No se encontraron registros.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="main">
            <div className="stitle">Generador de Directorios ERP</div>

            <div className="card" style={{ marginBottom: 15, borderLeft: '4px solid var(--acc2)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: 15 }}>
                        <div className="mod-field">
                            <label className="mod-lbl">GESTOR (AUTO: {codigoGestor})</label>
                            <input
                                className="mod-in"
                                placeholder="Nombre gestor..."
                                value={gestor}
                                onChange={(event) => {
                                    markDirty();
                                    setGestor(event.target.value);
                                }}
                            />
                        </div>
                        <div className="mod-field">
                            <label className="mod-lbl" style={{ color: 'var(--acc2)', fontSize: 11 }}>NOMBRE DEL PROYECTO</label>
                            <input
                                className="mod-in"
                                style={{ fontSize: 18, borderBottom: '2px solid var(--br2)' }}
                                placeholder="Ej: HOTEL MELIA ARMONIOSA..."
                                value={proyecto}
                                onChange={(event) => {
                                    markDirty();
                                    setProyecto(event.target.value);
                                }}
                            />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                        <div className="mod-field">
                            <label className="mod-lbl">ID CLIENTE (MAX 5)</label>
                            <input
                                className="mod-in"
                                placeholder="Ej: CL01X"
                                value={nombreAsignado}
                                onChange={(event) => {
                                    markDirty();
                                    setNombreAsignado(event.target.value);
                                }}
                            />
                        </div>
                        <div className="mod-field">
                            <label className="mod-lbl">NOTAS ADICIONALES</label>
                            <input
                                className="mod-in"
                                placeholder="Comentarios..."
                                value={descripcion}
                                onChange={(event) => {
                                    markDirty();
                                    setDescripcion(event.target.value);
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="ref-box" style={{ background: 'rgba(33, 150, 243, 0.05)', borderLeftColor: 'var(--acc2)', marginBottom: 15 }}>
                <div className="rp-left">
                    <div className="rp-lbl">DIRECTORIO GENERADO [GESTOR][PROY(7)][ID(5)]</div>
                    <div className="rp-code" style={{ color: 'var(--acc2)', fontSize: 32 }}>{directorio}</div>
                    <div style={{ marginTop: 10, fontSize: 11, color: 'var(--tx2)', fontFamily: 'var(--mono)', opacity: 0.85 }}>
                        {gestor ? <span style={{ marginRight: 15 }}>GESTOR: <b>{codigoGestor}</b></span> : null}
                        RUTA: <span style={{ color: 'var(--tx)', fontWeight: 700 }}>{currentDisplayPath}</span>
                    </div>
                </div>
                <div className="rp-right">
                    <div className={`rp-len ${totalLen >= 15 ? 'over' : 'ok'}`}>{totalLen}</div>
                    <div className="rp-sub">MAX 15</div>
                </div>
            </div>

            <div className="card" style={{ marginBottom: 15, padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: 11, color: 'var(--tx3)', textTransform: 'uppercase', marginBottom: 6 }}>Estado de carpeta remota</div>
                        <FolderStatusBadge status={folderJob.status} />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--tx2)', minWidth: 320, flex: 1 }}>
                        {folderJob.requested_at ? <div>Solicitada: {new Date(folderJob.requested_at).toLocaleString()}</div> : null}
                        {folderJob.completed_at ? <div>Completada: {new Date(folderJob.completed_at).toLocaleString()}</div> : null}
                        {folderJob.attempts ? <div>Intentos fallidos acumulados: {folderJob.attempts}</div> : null}
                        {folderJob.last_error ? <div style={{ color: '#ef4444' }}>Detalle: {folderJob.last_error}</div> : null}
                    </div>
                </div>
            </div>

            {error ? <div className="alert a-e" style={{ marginTop: 15 }}>{error}</div> : null}
            {showSaveSuccess ? <div className="alert a-ok" style={{ marginTop: 15 }}>Directorio registrado correctamente.</div> : null}
            {folderJob.status === 'done' ? <div className="alert a-ok" style={{ marginTop: 15 }}>La carpeta remota ya existe o fue creada correctamente por el worker privado.</div> : null}
            {folderJob.status === 'pending' ? <div className="alert" style={{ marginTop: 15, background: 'rgba(59, 130, 246, 0.12)', borderColor: 'rgba(59, 130, 246, 0.35)', color: '#3b82f6' }}>Solicitud en cola. El worker privado la recogerá en el siguiente ciclo.</div> : null}
            {folderJob.status === 'processing' ? <div className="alert" style={{ marginTop: 15, background: 'rgba(251, 191, 36, 0.12)', borderColor: 'rgba(251, 191, 36, 0.35)', color: '#f59e0b' }}>El worker privado está creando la carpeta en el servidor Windows.</div> : null}

            <div className="btn-row" style={{ marginTop: 20, flexWrap: 'wrap', gap: 12 }}>
                <button
                    className="btn btn-p"
                    style={{ background: 'var(--acc2)', padding: '12px 30px' }}
                    onClick={handleSave}
                    disabled={saved || !proyecto || !nombreAsignado || !gestor}
                >
                    REGISTRAR Y GUARDAR
                </button>
                <button
                    className="btn btn-g"
                    style={{ padding: '12px 30px' }}
                    onClick={handleRequestFolder}
                    disabled={!savedRecord?.id || requestingFolder || ['pending', 'processing', 'done'].includes(folderJob.status)}
                >
                    {folderJob.status === 'error' ? 'REINTENTAR CREACION' : 'CREAR CARPETA EN SERVIDOR'}
                </button>
                <button className="btn btn-g" style={{ padding: '12px 30px' }} onClick={clearForm}>NUEVO</button>
            </div>
        </div>
    );
}
