import React, { useState, useEffect, useMemo } from 'react';
import { dbService } from '../dbService';
import * as XLSX from 'xlsx';

// --- COMPONENTES AUXILIARES (FUERA PARA EVITAR RE-CREACIÓN) ---

const StatsHeader = ({ counts, totalUsers }) => (
    <div className="stats-row" style={{ display: 'flex', gap: 15, marginBottom: 30 }}>
        <div className="stat" style={{ flex: 1, padding: '15px 20px', borderLeft: '4px solid var(--acc)' }}>
            <div className="stat-n" style={{ fontSize: 28, fontWeight: 900 }}>{counts.articles}</div>
            <div className="stat-l" style={{ fontSize: 10, textTransform: 'uppercase', opacity: 0.7 }}>Artículos en DB</div>
        </div>
        <div className="stat" style={{ flex: 1, padding: '15px 20px', borderLeft: '4px solid var(--blue)' }}>
            <div className="stat-n" style={{ fontSize: 28, fontWeight: 900 }}>{counts.dirs}</div>
            <div className="stat-l" style={{ fontSize: 10, textTransform: 'uppercase', opacity: 0.7 }}>Proyectos URLGen</div>
        </div>
        <div className="stat" style={{ flex: 1, padding: '15px 20px', borderLeft: '4px solid var(--green)' }}>
            <div className="stat-n" style={{ fontSize: 28, fontWeight: 900 }}>{counts.logs}</div>
            <div className="stat-l" style={{ fontSize: 10, textTransform: 'uppercase', opacity: 0.7 }}>Logs Auditoría</div>
        </div>
        <div className="stat" style={{ flex: 1, padding: '15px 20px', borderLeft: '4px solid var(--tx2)' }}>
            <div className="stat-n" style={{ fontSize: 28, fontWeight: 900 }}>{totalUsers}</div>
            <div className="stat-l" style={{ fontSize: 10, textTransform: 'uppercase', opacity: 0.7 }}>Usuarios Activos</div>
        </div>
    </div>
);

const STATUS_COLORS = {
    'Muy Urgente': '#e05252',
    'Urgente': '#ffa500',
    'Normal': '#5290e0',
    'En proceso': '#a852e0',
    'Resuelto': '#52c97e',
    'Pendiente': '#f0c040',
    'Archivado': '#666'
};

export default function Backoffice({ tab, setTab }) {
    // --- TODOS LOS HOOKS AL PRINCIPIO ---
    const [logs, setLogs] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [myTickets, setMyTickets] = useState([]);
    const [counts, setCounts] = useState({ articles: 0, dirs: 0, logs: 0 });
    const [loading, setLoading] = useState(false);
    const [q, setQ] = useState("");
    const [selectedExpediente, setSelectedExpediente] = useState(null); // Ticket para Diagnóstico Maestro

    // Estados para Tickets
    const [assignment, setAssignment] = useState({}); // { ticketId: { userId, notes } }
    const [activeLog, setActiveLog] = useState(null); // ticketId
    const [logText, setLogText] = useState("");
    const [leccion, setLeccion] = useState(false);
    const [ticketLogs, setTicketLogs] = useState({}); // { ticketId: [] }
    const [delegationSearch, setDelegationSearch] = useState("");

    // --- EFECTOS ---
    useEffect(() => {
        if (tab === "logs") loadLogs();
        if (tab === "users") loadProfiles();
        if (tab === "tickets") loadTickets();
        if (tab === "mis-tickets") loadMyTickets();
        if (tab === "stats") {
            loadLogs();
            loadProfiles();
            loadCounts();
            loadTickets();
            loadMyTickets();
        }
    }, [tab]);

    // --- CARGADORES ---
    const loadLogs = async () => {
        setLoading(true);
        const data = await dbService.getAllLogs();
        setLogs(data || []);
        setLoading(false);
    };

    const loadProfiles = async () => {
        setLoading(true);
        const data = await dbService.getProfilesWithRoles();
        setProfiles(data || []);
        setLoading(false);
    };

    const loadCounts = async () => {
        const c = await dbService.getCounts();
        setCounts(c || { articles: 0, dirs: 0, logs: 0 });
    };

    const loadTickets = async () => {
        setLoading(true);
        const data = await dbService.getTickets();
        setTickets(data || []);
        setLoading(false);
    };

    const loadMyTickets = async () => {
        setLoading(true);
        const data = await dbService.getMyAssignedTickets();
        setMyTickets(data || []);
        setLoading(false);
    };

    const loadTicketLogs = async (id) => {
        const data = await dbService.getTicketLogs(id);
        setTicketLogs(prev => ({ ...prev, [id]: data || [] }));
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await dbService.updateTicketStatus(id, status);
            try {
                await dbService.addTicketLog(id, 'cambio_estado', `Estado actualizado a: ${status}`);
            } catch (logErr) {
                console.warn("Log skip (table missing?):", logErr);
            }
            loadTickets();
            loadMyTickets();
        } catch (err) {
            console.error("Update status failed:", err);
            alert("No se pudo actualizar el estado. Revisa tu conexión y que el script SQL esté ejecutado.");
        }
    };

    const handleAddLog = async (id, type) => {
        if (!logText.trim()) return;
        try {
            await dbService.addTicketLog(id, type, logText);

            if (type === 'solucion') {
                await handleStatusUpdate(id, 'Resuelto');

                if (leccion) {
                    const ticket = tickets.find(t => t.id === id) || myTickets.find(t => t.id === id);
                    await dbService.saveKnowledge({
                        ticket_id: id,
                        categoria: ticket?.origen_falla || 'General',
                        problema: ticket?.titulo || 'Desconocido',
                        solucion: logText,
                        leccion_aprendida: 'Lección guardada desde el flujo de resolución.'
                    });
                    setLeccion(false);
                }
                alert("Ticket resuelto y guardado.");
            }

            setLogText("");
            loadTicketLogs(id);
        } catch (err) {
            console.error(err);
            alert("Error al guardar. ¿Has ejecutado el script SQL de sincronización?");
        }
    };

    const handleAssign = async (ticketId, userId) => {
        if (!userId) return;
        try {
            await dbService.assignTicket(ticketId, userId, "");
            await dbService.addTicketLog(ticketId, 'cambio_estado', `Ticket delegado a técnico.`);
            loadTickets();
        } catch (err) {
            console.error(err);
            alert("Error al delegar");
        }
    };

    const handleUnassign = async (ticketId) => {
        try {
            await dbService.assignTicket(ticketId, null, "");
            await dbService.addTicketLog(ticketId, 'cambio_estado', `Ticket desasignado.`);
            loadTickets();
        } catch (err) {
            console.error(err);
        }
    };

    const getInitials = (name) => {
        if (!name) return "??";
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const TECH_COLORS = ['#f0c040', '#40f0c0', '#40c0f0', '#f040c0', '#c040f0', '#f08040'];

    const TechIcon = ({ p, active, onClick, size = 28, disabled = false }) => {
        const initials = getInitials(p.full_name);
        const color = TECH_COLORS[p.id?.length % TECH_COLORS.length] || '#ccc';

        return (
            <div
                onClick={disabled ? null : onClick}
                title={disabled ? "Requiere Diagnóstico previo" : p.full_name}
                style={{
                    width: size, height: size, borderRadius: '50%',
                    background: active ? color : 'transparent',
                    border: `1.5px solid ${color}`,
                    color: active ? '#000' : color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: size * 0.35, fontWeight: 900, cursor: disabled ? 'default' : 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: active ? `0 0 10px ${color}` : 'none',
                    transform: active ? 'scale(1.1)' : 'scale(1)',
                    opacity: disabled ? 0.2 : (active ? 1 : 0.6),
                    position: 'relative',
                    filter: disabled ? 'grayscale(1)' : 'none'
                }}
                onMouseEnter={(e) => {
                    if (disabled) return;
                    e.currentTarget.style.transform = 'scale(1.2) translateY(-2px)';
                    e.currentTarget.style.opacity = '1';
                    e.currentTarget.style.boxShadow = `0 4px 12px ${color}44`;
                }}
                onMouseLeave={(e) => {
                    if (disabled) return;
                    e.currentTarget.style.transform = active ? 'scale(1.1)' : 'scale(1)';
                    e.currentTarget.style.opacity = active ? '1' : '0.6';
                    e.currentTarget.style.boxShadow = active ? `0 0 10px ${color}` : 'none';
                }}
            >
                {initials}
                {active && (
                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: 8, height: 8, background: '#52c97e', borderRadius: '50%', border: '2px solid #000' }} />
                )}
            </div>
        );
    };

    const getTimeAgo = (dateStr) => {
        if (!dateStr) return "-";
        const now = new Date();
        const past = new Date(dateStr);
        const diffMs = now - past;
        const diffMin = Math.floor(diffMs / 60000);
        if (diffMin < 1) return "Justo ahora";
        if (diffMin < 60) return `Hace ${diffMin} min`;
        const diffHrs = Math.floor(diffMin / 60);
        if (diffHrs < 24) return `Hace ${diffHrs} h`;
        return past.toLocaleDateString();
    };

    const MasterExpediente = ({ ticket, onClose, onSave }) => {
        const [diagData, setDiagData] = useState({
            origen_falla: ticket.origen_falla || 'Software',
            gravedad_real: ticket.gravedad_real || 3,
            notas_diagnostico: ticket.notas_diagnostico || '',
            accion_inmediata: ticket.accion_inmediata || ''
        });

        const handleSave = async () => {
            try {
                await onSave(ticket.id, diagData);
                alert("Diagnóstico guardado con éxito.");
                onClose();
            } catch (err) {
                console.error(err);
                alert("Error al guardar el diagnóstico. Verifica que hayas ejecutado el script SQL.");
            }
        };

        return (
            <div className="modal-overlay" style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
                <div className="side-panel" style={{ width: 450, background: 'var(--s1)', height: '100%', padding: 40, borderLeft: '1px solid var(--br)', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 30 }}>
                        <div className="stitle" style={{ margin: 0 }}>EXPEDIENTE MAESTRO</div>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--tx3)', cursor: 'pointer', fontSize: 20 }}>&times;</button>
                    </div>

                    <div style={{ marginBottom: 30, padding: 20, background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--br2)' }}>
                        <div style={{ fontSize: 11, color: 'var(--acc)', fontWeight: 800, marginBottom: 5 }}>INCIDENCIA ORIGINAL</div>
                        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{ticket.titulo}</div>
                        <div style={{ fontSize: 13, opacity: 0.8, lineHeight: '1.5' }}>{ticket.descripcion}</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        <div className="field">
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--tx2)', marginBottom: 8 }}>ORIGEN DE LA FALLA</label>
                            <select
                                className="search-in"
                                style={{ width: '100%', boxSizing: 'border-box', height: 45 }}
                                value={diagData.origen_falla}
                                onChange={e => setDiagData({ ...diagData, origen_falla: e.target.value })}
                            >
                                <option value="Software">Error de Software (Bug)</option>
                                <option value="Humano">Fallo Humano (Operativo)</option>
                                <option value="Cliente">Solicitud de Cliente / Mal uso</option>
                                <option value="Externo">Causa Externa (Internet/Luz/Supabase)</option>
                            </select>
                        </div>

                        <div className="field">
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--tx2)', marginBottom: 8 }}>GRAVEDAD REAL (1-5)</label>
                            <div style={{ display: 'flex', gap: 10 }}>
                                {[1, 2, 3, 4, 5].map(v => (
                                    <button
                                        key={v}
                                        onClick={() => setDiagData({ ...diagData, gravedad_real: v })}
                                        style={{
                                            flex: 1, height: 40, borderRadius: 5, border: '1px solid var(--br2)',
                                            background: diagData.gravedad_real === v ? 'var(--acc)' : 'transparent',
                                            color: diagData.gravedad_real === v ? '#000' : 'var(--tx1)',
                                            fontWeight: 900, cursor: 'pointer'
                                        }}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="field">
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--tx2)', marginBottom: 8 }}>NOTAS DE DIAGNÓSTICO</label>
                            <textarea
                                className="search-in"
                                style={{ height: 120, paddingTop: 12, width: '100%', boxSizing: 'border-box' }}
                                value={diagData.notas_diagnostico}
                                onChange={e => setDiagData({ ...diagData, notas_diagnostico: e.target.value })}
                                placeholder="Explicación técnica detectada..."
                            />
                        </div>

                        <div className="field">
                            <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: 'var(--tx2)', marginBottom: 8 }}>ACCIÓN INMEDIATA</label>
                            <input
                                className="search-in"
                                style={{ width: '100%', boxSizing: 'border-box', height: 45 }}
                                value={diagData.accion_inmediata}
                                onChange={e => setDiagData({ ...diagData, accion_inmediata: e.target.value })}
                                placeholder="¿Qué se hizo en el minuto 1?"
                            />
                        </div>

                        <div style={{ marginTop: 20 }}>
                            <button className="btn btn-g" style={{ width: '100%', height: 50, background: 'var(--acc)', color: '#000', fontWeight: 900 }} onClick={handleSave}>
                                GUARDAR DIAGNÓSTICO Y HABILITAR DELEGACIÓN
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // --- MEMOS ---
    const stats = useMemo(() => {
        const totalLogs = logs.length;
        const totalUsers = profiles.length;
        const modules = {};
        const operators = {};
        const daily = {};

        logs.forEach(l => {
            modules[l.module_name] = (modules[l.module_name] || 0) + 1;
            const opName = l.profiles?.full_name || "Sistema";
            operators[opName] = (operators[opName] || 0) + 1;
            const date = new Date(l.created_at).toLocaleDateString();
            daily[date] = (daily[date] || 0) + 1;
        });

        const topOps = Object.entries(operators)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        return { totalLogs, totalUsers, modules, topOps, daily };
    }, [logs, profiles]);

    const filteredLogs = useMemo(() => {
        const query = q.toUpperCase().trim();
        return logs.filter(l =>
            l.module_name?.toUpperCase().includes(query) ||
            l.action_type?.toUpperCase().includes(query) ||
            l.profiles?.full_name?.toUpperCase().includes(query)
        );
    }, [logs, q]);

    // --- EXPORTAR ---
    const exportToExcel = (data, title) => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, title);
        XLSX.writeFile(wb, `Egea_Backoffice_${title}.xlsx`);
    };

    // --- RENDERIZADO CONDICIONAL ---

    if (loading && logs.length === 0 && profiles.length === 0) {
        return <div className="empty">Cargando panel de control...</div>;
    }

    if (tab === "stats") {
        return (
            <div className="main" style={{ maxWidth: 1000, margin: '0 auto', width: '100%' }}>
                <StatsHeader counts={counts} totalUsers={stats.totalUsers} />
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
                    <div className="card" style={{ background: 'var(--s1)', border: '1px solid var(--br)' }}>
                        <div className="stitle" style={{ fontSize: 11, letterSpacing: 1 }}>PRODUCTIVIDAD POR MÓDULO</div>
                        <div style={{ marginTop: 25, display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {Object.entries(stats.modules).map(([mod, count]) => {
                                const pct = Math.round((count / stats.totalLogs) * 100) || 0;
                                return (
                                    <div key={mod}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
                                            <span style={{ fontWeight: 800, color: 'var(--tx1)' }}>{mod}</span>
                                            <span style={{ fontWeight: 600 }}>{count} registros <span style={{ opacity: 0.5, fontSize: 10 }}>({pct}%)</span></span>
                                        </div>
                                        <div style={{ height: 10, background: 'var(--br2)', borderRadius: 5, overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${pct}%`, background: 'var(--acc)', transition: 'width 1s' }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="card">
                        <div className="stitle" style={{ fontSize: 11, letterSpacing: 1 }}>HISTÓRICO RECIENTE</div>
                        <div style={{ marginTop: 30, display: 'flex', alignItems: 'flex-end', gap: 10, height: 140 }}>
                            {Object.entries(stats.daily).slice(-7).map(([date, count]) => (
                                <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                                    <div style={{ width: '100%', height: `${Math.min(100, (count / 10) * 100)}%`, background: 'var(--acc)', borderRadius: '3px 3px 0 0' }} />
                                    <span style={{ fontSize: 8 }}>{date.split('/')[0]}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (tab === "users") {
        return (
            <div className="main" style={{ maxWidth: 1000, margin: '0 auto', width: '100%' }}>
                <div className="stitle" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    Gestión de Usuarios
                    <button className="btn btn-g" onClick={() => exportToExcel(profiles, "Usuarios")}>EXPORTAR</button>
                </div>
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead style={{ background: 'var(--br)' }}>
                            <tr><th style={{ padding: 12, textAlign: 'left' }}>USUARIO</th><th style={{ padding: 12, textAlign: 'center' }}>ROL</th><th style={{ padding: 12, textAlign: 'right' }}>ALTA</th></tr>
                        </thead>
                        <tbody>
                            {profiles.map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid var(--br2)' }}>
                                    <td style={{ padding: 12, fontWeight: 600 }}>{p.full_name}</td>
                                    <td style={{ padding: 12, textAlign: 'center' }}>{p.user_roles?.[0]?.role?.toUpperCase()}</td>
                                    <td style={{ padding: 12, textAlign: 'right' }}>{new Date(p.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (tab === "tickets") {
        return (
            <div className="main" style={{ maxWidth: 1000, margin: '0 auto', width: '100%' }}>
                <div className="stitle" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    Mesa de Soporte: Triaje Crítico
                    <button className="btn btn-g" onClick={() => exportToExcel(tickets, "Tickets")}>EXPORTAR</button>
                </div>
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'center' }}>
                        <thead style={{ background: 'var(--br)' }}>
                            <tr>
                                <th style={{ padding: 12 }}># TICKET</th>
                                <th style={{ padding: 12 }}>MOTIVO / DIAGNÓSTICO MASTER</th>
                                <th style={{ padding: 12 }}>TRIAJE</th>
                                <th style={{ padding: 12 }}>ORIGEN</th>
                                <th style={{ padding: 12 }}>DELEGACIÓN</th>
                                <th style={{ padding: 12 }}>ESTADO / PRIORIDAD</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tickets.map(t => {
                                const isDiagnosticado = !!t.diagnosticado_at;
                                const assignedTech = profiles.find(p => p.id === t.asignado_a);

                                return (
                                    <tr
                                        key={t.id}
                                        onClick={() => setSelectedExpediente(t)}
                                        style={{
                                            borderBottom: '1px solid var(--br2)',
                                            background: !isDiagnosticado ? 'rgba(224, 82, 82, 0.03)' : 'transparent',
                                            cursor: 'pointer',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(240, 192, 64, 0.05)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = !isDiagnosticado ? 'rgba(224, 82, 82, 0.03)' : 'transparent'}
                                    >
                                        <td style={{ padding: 12, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--acc)' }}>
                                            TK-{t.num_ticket || '....'}
                                        </td>
                                        <td style={{ padding: '15px 20px', textAlign: 'left', minWidth: 300 }}>
                                            <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', marginBottom: 4 }}>{t.titulo}</div>
                                            <div style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase', marginBottom: 10, letterSpacing: 1 }}>Módulo: {t.modulo}</div>

                                            {t.diagnosticado_at && (
                                                <div style={{
                                                    fontSize: 11,
                                                    background: 'rgba(240, 192, 64, 0.04)',
                                                    padding: '12px 15px',
                                                    borderRadius: 8,
                                                    border: '1px solid rgba(240, 192, 64, 0.15)',
                                                    boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)',
                                                    position: 'relative',
                                                    marginTop: 10
                                                }}>
                                                    <div style={{ color: 'var(--acc)', fontWeight: 900, fontSize: 9, marginBottom: 6, letterSpacing: 1 }}>EXPEDIENTE MAESTRO</div>
                                                    <div style={{ marginBottom: 8, color: 'var(--tx1)', lineHeight: 1.4, fontSize: 12 }}>{t.notas_diagnostico || t.accion_inmediata}</div>
                                                    <div style={{ display: 'flex', gap: 15, opacity: 0.8, fontSize: 9, fontWeight: 700, textTransform: 'uppercase' }}>
                                                        <span><span style={{ opacity: 0.5 }}>ORIGEN:</span> {t.origen_falla}</span>
                                                        <span><span style={{ opacity: 0.5 }}>GRAVEDAD:</span> {t.gravedad_real}/5</span>
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: 12 }}>
                                            {!isDiagnosticado ? (
                                                <div style={{ color: '#e05252', fontWeight: 900, animation: 'pulse 2s infinite', fontSize: 11 }}>POR CATEGORIZAR</div>
                                            ) : (
                                                <div style={{ color: 'var(--acc)', fontWeight: 800, fontSize: 11 }}>DIAGNOSTICADO</div>
                                            )}
                                            <div style={{ fontSize: 9, opacity: 0.6 }}>{getTimeAgo(t.created_at)}</div>
                                        </td>
                                        <td style={{ padding: 12, fontSize: 12 }}>{t.profiles?.full_name || 'Desconocido'}</td>
                                        <td style={{ padding: 12 }} onClick={(e) => e.stopPropagation()}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                                                {t.asignado_a ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', padding: '4px 10px', borderRadius: 20, border: '1px solid var(--br2)' }}>
                                                        <TechIcon p={assignedTech || { full_name: '?' }} active={true} />
                                                        <span style={{ fontSize: 11, fontWeight: 600 }}>{assignedTech?.full_name?.split(' ')[0]}</span>
                                                        <button onClick={() => handleUnassign(t.id)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: 2 }}>×</button>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                        <input
                                                            placeholder="Delegar a..."
                                                            style={{
                                                                background: '#161616', border: '1px solid #333',
                                                                borderRadius: 4, padding: '4px 8px', fontSize: 10, color: '#fff',
                                                                textAlign: 'center', width: 100
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onChange={(e) => setDelegationSearch(e.target.value)}
                                                        />
                                                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                                            {profiles
                                                                .filter(p => !delegationSearch || p.full_name.toLowerCase().includes(delegationSearch.toLowerCase()))
                                                                .slice(0, 3)
                                                                .map(p => (
                                                                    <TechIcon
                                                                        key={p.id}
                                                                        p={p}
                                                                        active={false}
                                                                        disabled={!isDiagnosticado}
                                                                        onClick={() => handleAssign(t.id, p.id)}
                                                                    />
                                                                ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: 12 }} onClick={(e) => e.stopPropagation()}>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                                                {/* Semáforo de Prioridad */}
                                                <div style={{ display: 'flex', gap: 6, paddingRight: 10, borderRight: '1px solid #333' }}>
                                                    {[
                                                        { val: 'Muy Urgente', col: '#e05252' },
                                                        { val: 'Urgente', col: '#f0a040' },
                                                        { val: 'Normal', col: '#5290e0' }
                                                    ].map(p => (
                                                        <div
                                                            key={p.val}
                                                            title={p.val}
                                                            onClick={() => dbService.updateTicketPriority(t.id, p.val).then(loadTickets).catch(() => alert("Error DB Prioridad"))}
                                                            style={{
                                                                width: 15, height: 15, borderRadius: '50%', background: p.col, cursor: 'pointer',
                                                                opacity: t.prioridad === p.val ? 1 : 0.25,
                                                                border: t.prioridad === p.val ? '2px solid #fff' : 'none',
                                                                boxShadow: t.prioridad === p.val ? `0 0 10px ${p.col}` : 'none',
                                                                transition: 'all 0.2s'
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                                {/* Semáforo de Estado */}
                                                <div style={{ display: 'flex', gap: 6 }}>
                                                    {[
                                                        { val: 'Pendiente', col: '#f0c040' },
                                                        { val: 'En proceso', col: '#a852e0' },
                                                        { val: 'Resuelto', col: '#52c97e' }
                                                    ].map(s => (
                                                        <div
                                                            key={s.val}
                                                            title={s.val}
                                                            onClick={() => handleStatusUpdate(t.id, s.val)}
                                                            style={{
                                                                width: 15, height: 15, borderRadius: '50%', background: s.col, cursor: 'pointer',
                                                                opacity: t.estado === s.val ? 1 : 0.25,
                                                                border: t.estado === s.val ? '2px solid #fff' : 'none',
                                                                boxShadow: s.estado === s.val ? `0 0 10px ${s.col}` : 'none',
                                                                transition: 'all 0.2s'
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <div style={{ fontSize: 9, marginTop: 4, fontWeight: 700, opacity: 0.8, color: t.estado === 'Resuelto' ? '#52c97e' : 'inherit' }}>
                                                {t.estado.toUpperCase()}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {selectedExpediente && (
                    <MasterExpediente
                        ticket={selectedExpediente}
                        onClose={() => setSelectedExpediente(null)}
                        onSave={async (id, data) => {
                            await dbService.saveMasterDiagnosis(id, data);
                            try {
                                await dbService.addTicketLog(id, 'cambio_estado', `Diagnóstico Maestro completado: Grav ${data.gravedad_real}, Fallo ${data.origen_falla}`);
                            } catch (e) { console.warn("Log skip:", e); }
                            loadTickets();
                        }}
                    />
                )}
            </div>
        );
    }

    if (tab === "mis-tickets") {
        return (
            <div className="main" style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
                <div className="stitle" style={{ marginBottom: 20 }}>Mis Tareas Asignadas</div>
                {myTickets.map(t => (
                    <div key={t.id} className="card" style={{ marginBottom: 15, padding: 0, overflow: 'hidden', borderLeft: `4px solid ${STATUS_COLORS[t.estado]}` }}>
                        <div style={{ padding: 15, display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ fontWeight: 700 }}>{t.titulo} <span style={{ fontSize: 10, opacity: 0.5 }}>({t.modulo})</span></div>
                            <span style={{ fontSize: 10 }}>{new Date(t.created_at).toLocaleDateString()}</span>
                        </div>
                        <div style={{ padding: 15, fontSize: 13 }}>{t.descripcion}</div>
                        <div style={{ padding: 10, background: 'var(--br)', display: 'flex', gap: 10 }}>
                            <button className="btn btn-g" style={{ fontSize: 10 }} onClick={() => { setActiveLog(activeLog === t.id ? null : t.id); if (activeLog !== t.id) loadTicketLogs(t.id); }}>
                                {activeLog === t.id ? 'CERRAR LOG' : 'VER ACTIVIDAD'}
                            </button>
                            {t.estado !== 'Resuelto' && (
                                <button className="btn" style={{ fontSize: 10, background: 'var(--acc)', color: '#000' }} onClick={() => { setActiveLog(t.id); setLogText("Resuelto."); }}>SOLUCIONADO</button>
                            )}
                        </div>
                        {activeLog === t.id && (
                            <div style={{ padding: 15, background: 'var(--s2)', borderTop: '1px solid var(--br2)' }}>
                                <div style={{ maxHeight: 150, overflowY: 'auto', marginBottom: 10 }}>
                                    {(ticketLogs[t.id] || []).map(l => (
                                        <div key={l.id} style={{ fontSize: 11, marginBottom: 5 }}>
                                            <strong style={{ color: 'var(--acc)' }}>{l.profiles?.full_name}:</strong> {l.contenido}
                                        </div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <input className="search-in" style={{ height: 35, fontSize: 13 }} value={logText} onChange={(e) => setLogText(e.target.value)} placeholder="Describe la solución o añade nota..." />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, cursor: 'pointer', color: leccion ? 'var(--acc)' : 'var(--tx3)' }}>
                                            <input type="checkbox" checked={leccion} onChange={(e) => setLeccion(e.target.checked)} />
                                            LECCIÓN APRENDIDA (Guardar en Base de Conocimiento)
                                        </label>
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <button className="btn btn-g" style={{ padding: '6px 15px', fontSize: 10 }} onClick={() => handleAddLog(t.id, 'comentario')}>AÑADIR LOG</button>
                                            <button className="btn" style={{ padding: '6px 15px', fontSize: 10, background: '#52c97e', color: '#000' }} onClick={() => handleAddLog(t.id, 'solucion')}>RESOLVER TICKET</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    }

    // LISTADO DE LOGS (DEFAULT)
    return (
        <div className="main" style={{ maxWidth: 1000, margin: '0 auto', width: '100%' }}>
            <div className="stitle" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                Auditoría de Operaciones
                <button className="btn btn-g" onClick={() => exportToExcel(logs, "Logs")}>EXPORTAR</button>
            </div>
            <div className="card" style={{ marginBottom: 15, padding: 15 }}>
                <input className="search-in" placeholder="Buscar en logs..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead style={{ background: 'var(--br)' }}>
                        <tr><th>FECHA</th><th>USUARIO</th><th>MÓDULO</th><th>ACCIÓN</th></tr>
                    </thead>
                    <tbody>
                        {filteredLogs.map(l => (
                            <tr key={l.id} style={{ borderBottom: '1px solid var(--br2)' }}>
                                <td style={{ padding: 10 }}>{new Date(l.created_at).toLocaleString()}</td>
                                <td style={{ padding: 10 }}>{l.profiles?.full_name || "Sistema"}</td>
                                <td style={{ padding: 10 }}>{l.module_name}</td>
                                <td style={{ padding: 10, color: 'var(--acc2)' }}>{l.action_type}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
