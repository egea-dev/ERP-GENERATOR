import React, { useState, useMemo, useEffect } from 'react';
import { dbService } from '../dbService';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';

export default function DirectoryGenerator({ tab, setTab }) {
    const { user } = useAuth();
    const [gestor, setGestor] = useState("");
    const [proyecto, setProyecto] = useState("");
    const [nombreAsignado, setNombreAsignado] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [history, setHistory] = useState([]);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");

    // Filtros historial
    const [q, setQ] = useState("");

    const TYPE_MAP = {
        "HOTEL": "H",
        "APARTAHOTEL": "A",
        "HOSTAL": "HO",
        "RESIDENCIA": "R",
        "RESTAURANTE": "REST",
        "VIVIENDA": "V"
    };

    useEffect(() => {
        if (tab === "hist") loadHistory();
    }, [tab]);

    const loadHistory = async () => {
        const data = await dbService.getDirectorios();
        setHistory(data);
    };

    const filteredHistory = useMemo(() => {
        const query = q.toUpperCase().trim();
        return history.filter(h =>
            h.nombre_directorio.toUpperCase().includes(query) ||
            h.nombre_proyecto.toUpperCase().includes(query) ||
            h.credencial_usuario.toUpperCase().includes(query)
        );
    }, [history, q]);

    // Algoritmo para el Gestor (3 caracteres)
    const codigoGestor = useMemo(() => {
        const clean = gestor.trim().toUpperCase().replace(/[^A-Z0-9\s]/g, '');
        const words = clean.split(/\s+/).filter(w => w.length > 0);
        if (words.length === 0) return "XXX";
        if (words.length === 1) return words[0].slice(0, 3);
        const initials = words.map(w => w[0]).join('');
        return initials.length > 3 ? initials.slice(0, 3) : initials.padEnd(3, 'X').slice(0, 3);
    }, [gestor]);

    const codigoProyecto = useMemo(() => {
        let words = proyecto.trim().toUpperCase().split(/[\s-]+/).filter(w => w.length > 1);
        if (words.length === 0) return "";
        let prefix = "";
        const firstWord = words[0];
        if (TYPE_MAP[firstWord]) { prefix = TYPE_MAP[firstWord]; words = words.slice(1); }
        if (words.length === 0) return prefix.slice(0, 7);
        if (words.length === 1) return (prefix + words[0]).slice(0, 7);
        const remainingSpace = 7 - prefix.length;
        let namePart = "";
        if (words.length === 2) {
            const split = Math.ceil(remainingSpace / 2);
            namePart = words[0].slice(0, split) + words[1].slice(0, remainingSpace - split);
        } else {
            const initials = words.slice(0, -2).map(w => w[0]).join('');
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

    const handleSave = async () => {
        if (!proyecto || !nombreAsignado || !gestor) { setError("Completa los campos obligatorios"); return; }
        setError("");
        try {
            await dbService.saveDirectorio({
                nombre_directorio: directorio,
                credencial_usuario: codigoGestor,
                nombre_proyecto: proyecto,
                codigo_proyecto: codigoProyecto,
                nombre_asignado: nombreLimpio,
                descripcion: descripcion,
                ruta_completa: `P:\\PROYECTOS\\${directorio}`,
                creado_por: user?.id
            });
            setSaved(true);
            await dbService.insertLog("SAVE", "URLGEN", { directorio });
        } catch (e) {
            console.error("DEBUG URLGEN ERROR:", e);
            setError("ERROR BASE DE DATOS (400): Los códigos actuales son más largos de lo que permite tu base de datos. Por favor, ejecuta el script SQL de ampliación en Supabase.");
        }
    };

    const loadRow = (h) => {
        setGestor(h.credencial_usuario || "");
        setProyecto(h.nombre_proyecto || "");
        setNombreAsignado(h.nombre_asignado || "");
        setDescripcion(h.descripcion || "");
        setSaved(false);
        setTab("crear");
    };

    if (tab === "hist") {
        return (
            <div className="main" style={{ maxWidth: 1000, margin: '0 auto', width: '100%' }}>
                <div className="stitle" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    Historial Directorios
                    <button className="btn btn-g" style={{ padding: '6px 12px' }} onClick={() => {
                        const ws = XLSX.utils.json_to_sheet(history);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, "Directorios");
                        XLSX.writeFile(wb, "Egea_Directorios.xlsx");
                        dbService.insertLog('XLS_EXPORT', 'URLGEN', { count: history.length });
                    }}>
                        EXPORTAR EXCEL
                    </button>
                </div>

                <div className="card" style={{ marginBottom: 15, padding: '15px 20px' }}>
                    <div className="search-box">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        <input className="search-in" placeholder="Buscar por referencia, proyecto o gestor..."
                            value={q} onChange={(e) => setQ(e.target.value)} />
                    </div>
                </div>

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead style={{ background: 'var(--br)', color: 'var(--tx2)' }}>
                            <tr>
                                <th style={{ padding: '12px 15px', textAlign: 'left' }}>REFERENCIA</th>
                                <th style={{ padding: '12px 15px', textAlign: 'left' }}>PROYECTO</th>
                                <th style={{ padding: '12px 15px', textAlign: 'left' }}>GESTOR</th>
                                <th style={{ padding: '12px 15px', textAlign: 'right' }}>FECHA</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredHistory.length > 0 ? filteredHistory.map((h, i) => (
                                <tr key={h.id}
                                    className="hist-row-hover"
                                    onClick={() => loadRow(h)}
                                    style={{ borderBottom: '1px solid var(--br2)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)', cursor: 'pointer' }}>
                                    <td style={{ padding: '12px 15px', fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--acc2)' }}>{h.nombre_directorio}</td>
                                    <td style={{ padding: '12px 15px' }}>
                                        <div style={{ fontWeight: 600 }}>{h.nombre_proyecto}</div>
                                        {h.descripcion && <div style={{ fontSize: 11, color: 'var(--tx3)' }}>{h.descripcion}</div>}
                                    </td>
                                    <td style={{ padding: '12px 15px' }}>{h.credencial_usuario}</td>
                                    <td style={{ padding: '12px 15px', textAlign: 'right', color: 'var(--tx3)' }}>{new Date(h.fecha_creacion).toLocaleDateString()}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4" style={{ padding: 30, textAlign: 'center', color: 'var(--tx3)' }}>No se encontraron registros.</td></tr>
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
                            <input className="mod-in" placeholder="Nombre gestor..." value={gestor}
                                onChange={(e) => { setGestor(e.target.value); setSaved(false); }} />
                        </div>
                        <div className="mod-field">
                            <label className="mod-lbl" style={{ color: 'var(--acc2)', fontSize: 11 }}>NOMBRE DEL PROYECTO</label>
                            <input className="mod-in" style={{ fontSize: 18, borderBottom: '2px solid var(--br2)' }}
                                placeholder="Ej: HOTEL MELIA ARMONIOSA..." value={proyecto}
                                onChange={(e) => { setProyecto(e.target.value); setSaved(false); }} />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                        <div className="mod-field">
                            <label className="mod-lbl">ID CLIENTE (MAX 5)</label>
                            <input className="mod-in" placeholder="Ej: CL01X" value={nombreAsignado}
                                onChange={(e) => { setNombreAsignado(e.target.value); setSaved(false); }} />
                        </div>
                        <div className="mod-field">
                            <label className="mod-lbl">NOTAS ADICIONALES</label>
                            <input className="mod-in" placeholder="Comentarios..." value={descripcion}
                                onChange={(e) => setDescripcion(e.target.value)} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="ref-box" style={{ background: 'rgba(33, 150, 243, 0.05)', borderLeftColor: 'var(--acc2)', marginBottom: 15 }}>
                <div className="rp-left">
                    <div className="rp-lbl">DIRECTORIO GENERADO [GESTOR][PROY(7)][ID(5)]</div>
                    <div className="rp-code" style={{ color: 'var(--acc2)', fontSize: 32 }}>{directorio}</div>
                    <div style={{ marginTop: 10, fontSize: 11, color: 'var(--tx2)', fontFamily: 'var(--mono)', opacity: 0.8 }}>
                        {gestor && <span style={{ marginRight: 15 }}>GESTOR: <b>{codigoGestor}</b></span>}
                        RUTA: <span style={{ color: 'var(--tx)', fontWeight: 700 }}>P:\PROYECTOS\{directorio}</span>
                    </div>
                </div>
                <div className="rp-right"><div className={`rp-len ${totalLen >= 15 ? 'over' : 'ok'}`}>{totalLen}</div><div className="rp-sub">MAX 15</div></div>
            </div>

            {error && <div className="alert a-e" style={{ marginTop: 15 }}>{error}</div>}
            {saved && <div className="alert a-ok" style={{ marginTop: 15 }}>Directorio registrado correctamente.</div>}

            <div className="btn-row" style={{ marginTop: 20 }}>
                <button className="btn btn-p" style={{ background: 'var(--acc2)', padding: '12px 30px' }} onClick={handleSave} disabled={saved || !proyecto || !nombreAsignado || !gestor}>
                    REGISTRAR Y GUARDAR
                </button>
                <button className="btn btn-g" style={{ padding: '12px 30px' }} onClick={() => { setProyecto(""); setNombreAsignado(""); setDescripcion(""); setSaved(false); setError(""); }}>NUEVO</button>
            </div>
        </div>
    );
}
