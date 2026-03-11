import React, { useState, useEffect, useMemo } from 'react';
import { dbService } from '../dbService';
import * as XLSX from 'xlsx';

// --- COMPONENTES AUXILIARES (FUERA PARA EVITAR RE-CREACIÓN) ---

const StatsHeader = ({ counts, totalUsers, onRefresh }) => (
    <div className="stats-row" style={{ display: 'flex', gap: 15, marginBottom: 30, alignItems: 'center' }}>
        <button onClick={onRefresh} style={{ background: 'var(--acc)', border: 'none', borderRadius: 8, padding: '10px 15px', cursor: 'pointer', fontWeight: 900, fontSize: 10, color: '#000', marginRight: 10 }}>ACTUALIZAR DATOS</button>
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

const InlineDiagnosticForm = ({ ticket, onSave, onCancel }) => {
    const [diagData, setDiagData] = useState({
        origen_falla: ticket.origen_falla || 'Software',
        gravedad_real: ticket.gravedad_real || 3,
        notas_diagnostico: ticket.notas_diagnostico || '',
        accion_inmediata: ticket.accion_inmediata || ''
    });

    const handleSave = async (e) => {
        e.stopPropagation();
        try {
            await onSave(ticket.id, diagData);
            alert("Guardado");
        } catch (err) { alert("Error"); }
    };

    return (
        <div style={{
            marginTop: 12,
            padding: '8px 0',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            borderTop: '1px solid rgba(255,255,255,0.05)',
            flexWrap: 'nowrap',
            overflow: 'hidden'
        }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span style={{ fontSize: 9, fontWeight: 900, color: 'var(--acc)' }}>DIAG:</span>
                <select
                    className="search-in"
                    style={{ width: 100, height: 28, fontSize: 10, padding: '0 4px', background: '#111', border: '1px solid #333' }}
                    value={diagData.origen_falla}
                    onChange={e => setDiagData({ ...diagData, origen_falla: e.target.value })}
                >
                    <option value="Software">Software</option>
                    <option value="Humano">Humano</option>
                    <option value="Cliente">Cliente</option>
                    <option value="Externo">Externo</option>
                </select>
            </div>

            <div style={{ display: 'flex', gap: 2, background: 'rgba(255,255,255,0.03)', padding: 2, borderRadius: 4, flexShrink: 0 }}>
                {[1, 2, 3, 4, 5].map(v => (
                    <button
                        key={v}
                        onClick={() => setDiagData({ ...diagData, gravedad_real: v })}
                        style={{
                            width: 18, height: 18, borderRadius: 2, border: 'none',
                            background: diagData.gravedad_real === v ? 'var(--acc)' : 'transparent',
                            color: diagData.gravedad_real === v ? '#000' : 'var(--tx3)',
                            fontWeight: 900, cursor: 'pointer', fontSize: 9
                        }}
                    >
                        {v}
                    </button>
                ))}
            </div>

            <input
                className="search-in"
                style={{ flex: 1, height: 28, fontSize: 11, minWidth: 120, background: '#111', border: '1px solid #333' }}
                value={diagData.accion_inmediata}
                onChange={e => setDiagData({ ...diagData, accion_inmediata: e.target.value })}
                placeholder="Acción..."
            />

            <input
                className="search-in"
                style={{ flex: 2, height: 28, fontSize: 11, minWidth: 150, background: '#111', border: '1px solid #333' }}
                value={diagData.notas_diagnostico}
                onChange={e => setDiagData({ ...diagData, notas_diagnostico: e.target.value })}
                placeholder="Análisis técnico detallado..."
            />

            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button className="btn" style={{ background: 'var(--acc)', color: '#000', fontWeight: 900, fontSize: 9, padding: '0 10px', height: 28 }} onClick={handleSave}>GUARDAR</button>
                <button className="btn btn-g" style={{ padding: '0 8px', height: 28 }} onClick={(e) => { e.stopPropagation(); onCancel(); }}>✖</button>
            </div>
        </div>
    );
};

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
    const [delegationSearch, setDelegationSearch] = useState("");
    const [editingTicketId, setEditingTicketId] = useState(null); // ID del ticket que se está diagnosticando inline

    // Estados para Tickets
    const [assignment, setAssignment] = useState({}); // { ticketId: { userId, notes } }
    const [activeLog, setActiveLog] = useState(null); // ticketId
    const [logText, setLogText] = useState("");
    const [leccion, setLeccion] = useState(false);
    // Estados para Usuarios
    const [newUserState, setNewUserState] = useState({ email: '', password: '', fullName: '', role: 'user' });
    // Sub-tab activo en Tickets
    const [ticketSubTab, setTicketSubTab] = useState('pendientes');

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
            alert("No se pudo actualizar el estado. Fallo devuelto por base de datos: " + (err?.message || "Error desconocido devuelto sin mensaje explícito."));
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            setLoading(true);
            await dbService.updateUserRole(userId, newRole);
            await loadProfiles(); // Refresh the profiles list seamlessly
            alert("Rol actualizado correctamente.");
        } catch (err) {
            console.error(err);
            alert("Error al actualizar rol: Verifica permisos de Admin en Supabase.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        if (!newUserState.email || !newUserState.password || !newUserState.fullName) {
            alert("Rellena todos los campos");
            return;
        }
        setLoading(true);
        try {
            await dbService.createNewUser(newUserState.email, newUserState.password, newUserState.fullName, newUserState.role);
            setNewUserState({ email: '', password: '', fullName: '', role: 'user' });
            await loadProfiles();
            alert("Usuario creado con éxito");
        } catch (err) {
            console.error(err);
            alert("Error al crear usuario: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm("¿Seguro que quieres borrar este usuario de forma permanente?")) return;
        setLoading(true);
        try {
            await dbService.deleteUser(userId);
            await loadProfiles();
            alert("Usuario eliminado correctamente");
        } catch (err) {
            console.error(err);
            alert("Error al borrar: " + (err.message || "Verifica tu Service Key"));
        } finally {
            setLoading(false);
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

    const handleArchiveTicket = async (ticketId) => {
        try {
            await dbService.archiveTicket(ticketId);
            loadTickets();
        } catch (err) {
            console.error(err);
            alert('Error al archivar: ' + (err?.message || 'Error desconocido'));
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
                <StatsHeader
                    counts={counts}
                    totalUsers={profiles.length}
                    onRefresh={() => { loadTickets(); loadMyTickets(); loadProfiles(); loadCounts(); }}
                />
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
                    Gestión Avanzada de Usuarios
                    <button className="btn btn-g" onClick={() => exportToExcel(profiles, "Usuarios")}>EXPORTAR DATA</button>
                </div>

                {/* Formulario de Creación (NUEVO) */}
                <div className="card" style={{ marginBottom: 20, padding: 20, background: 'var(--s1)' }}>
                    <div className="stitle" style={{ fontSize: 13, marginBottom: 15, color: 'var(--acc)' }}>Dar de Alta Nuevo Usuario</div>
                    <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10, alignItems: 'end' }}>
                        <div>
                            <div style={{ fontSize: 10, marginBottom: 5, color: '#888' }}>Nombre Completo</div>
                            <input className="search-in" required placeholder="Ej: Juan Pérez" value={newUserState.fullName} onChange={e => setNewUserState({ ...newUserState, fullName: e.target.value })} />
                        </div>
                        <div>
                            <div style={{ fontSize: 10, marginBottom: 5, color: '#888' }}>Correo Electrónico</div>
                            <input type="email" required className="search-in" placeholder="juan@oko.com" value={newUserState.email} onChange={e => setNewUserState({ ...newUserState, email: e.target.value })} />
                        </div>
                        <div>
                            <div style={{ fontSize: 10, marginBottom: 5, color: '#888' }}>Contraseña Temporal</div>
                            <input type="password" required className="search-in" placeholder="Mínimo 6 caracteres" value={newUserState.password} onChange={e => setNewUserState({ ...newUserState, password: e.target.value })} />
                        </div>
                        <div>
                            <div style={{ fontSize: 10, marginBottom: 5, color: '#888' }}>Privilegios Iniciales</div>
                            <select className="search-in" value={newUserState.role} onChange={e => setNewUserState({ ...newUserState, role: e.target.value })}>
                                <option value="user">Usuario (Técnico Base)</option>
                                <option value="editor">Editor (Agente Mesa)</option>
                                <option value="admin">Administrador (Master)</option>
                            </select>
                        </div>
                        <button type="submit" className="btn btn-g" style={{ height: 35, width: '100%' }}>CREAR CUENTA</button>
                    </form>
                </div>

                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead style={{ background: 'var(--br)' }}>
                            <tr>
                                <th style={{ padding: 12, textAlign: 'left' }}>USUARIO (ID)</th>
                                <th style={{ padding: 12, textAlign: 'center' }}>NIVEL DE ACCESO</th>
                                <th style={{ padding: 12, textAlign: 'right' }}>FECHA DE ALTA</th>
                                <th style={{ padding: 12, textAlign: 'center' }}>ZONA ROJA</th>
                            </tr>
                        </thead>
                        <tbody>
                            {profiles.map(p => (
                                <tr key={p.id} style={{ borderBottom: '1px solid var(--br2)', transition: 'background 0.2s' }} onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }} onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}>
                                    <td style={{ padding: '15px 12px', textAlign: 'left' }}>
                                        <div style={{ fontWeight: 800, fontSize: 14 }}>{p.full_name}</div>
                                        <div style={{ fontSize: 9, fontFamily: 'monospace', color: 'var(--tx3)', marginTop: 4 }}>ID: {p.id.split('-')[0]}***</div>
                                    </td>
                                    <td style={{ padding: 12, textAlign: 'center' }}>
                                        <select
                                            style={{ background: '#111', color: 'var(--tx1)', border: '1px solid #333', padding: '4px 8px', borderRadius: 4, width: '100px', cursor: 'pointer' }}
                                            value={p.user_roles?.[0]?.role || 'user'}
                                            onChange={(e) => handleRoleChange(p.id, e.target.value)}
                                        >
                                            <option value="user">USER</option>
                                            <option value="editor">EDITOR</option>
                                            <option value="admin">ADMIN</option>
                                        </select>
                                    </td>
                                    <td style={{ padding: 12, textAlign: 'right', color: 'var(--tx3)' }}>
                                        {new Date(p.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: 12, textAlign: 'center' }}>
                                        <button
                                            onClick={() => handleDeleteUser(p.id)}
                                            style={{
                                                background: '#e0525220',
                                                border: '1px solid #e05252',
                                                color: '#e05252',
                                                padding: '4px 10px',
                                                borderRadius: 4,
                                                cursor: 'pointer',
                                                fontSize: 10,
                                                fontWeight: 800
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.background = '#e05252'; e.currentTarget.style.color = '#fff' }}
                                            onMouseLeave={(e) => { e.currentTarget.style.background = '#e0525220'; e.currentTarget.style.color = '#e05252' }}
                                        >
                                            BORRAR CUENTA
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    if (tab === "tickets") {
        const pendientes = tickets.filter(t => !t.archivado && t.estado !== 'Resuelto');
        const resueltos = tickets.filter(t => !t.archivado && t.estado === 'Resuelto');
        const archivados = tickets.filter(t => t.archivado);

        const subTabStyle = (key) => ({
            padding: '8px 18px', border: 'none', cursor: 'pointer', fontWeight: 700,
            fontSize: 11, borderRadius: 6, transition: 'all 0.2s',
            background: ticketSubTab === key ? 'var(--acc)' : 'rgba(255,255,255,0.05)',
            color: ticketSubTab === key ? '#000' : 'var(--tx2)',
        });

        const renderRows = (list, showArchiveBtn = false) => list.map(t => {
            const isDiagnosticado = !!t.diagnosticado_at;
            const assignedTech = profiles.find(p => p.id === t.asignado_a);
            const isExpanded = editingTicketId === t.id;
            const hasDiag = t.diagnosticado_at || t.notas_diagnostico || t.accion_inmediata;

            return (
                <React.Fragment key={t.id}>
                    <tr
                        onClick={() => setEditingTicketId(isExpanded ? null : t.id)}
                        style={{
                            borderBottom: isExpanded || hasDiag ? 'none' : '1px solid var(--br2)',
                            background: isExpanded ? 'rgba(240, 192, 64, 0.05)' : (!isDiagnosticado ? 'rgba(224, 82, 82, 0.03)' : 'transparent'),
                            cursor: 'pointer', transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = 'rgba(240, 192, 64, 0.08)'; }}
                        onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = !isDiagnosticado ? 'rgba(224, 82, 82, 0.03)' : 'transparent'; }}
                    >
                        <td style={{ padding: 12, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--acc)' }}>TK-{t.num_ticket || '....'}</td>
                        <td style={{ padding: '15px 20px', textAlign: 'left', minWidth: 300 }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', marginBottom: 4 }}>{t.titulo}</div>
                            <div style={{ fontSize: 10, opacity: 0.5, textTransform: 'uppercase', letterSpacing: 1 }}>Módulo: {t.modulo}</div>
                            {hasDiag && (
                                <div style={{ marginTop: 8, fontSize: 11, background: 'rgba(240, 192, 64, 0.05)', padding: '4px 8px', borderRadius: 4, display: 'inline-block', border: '1px solid rgba(240, 192, 64, 0.2)' }}>
                                    <span style={{ color: 'var(--acc)', fontWeight: 800, marginRight: 6 }}>DIAG:</span>
                                    <span style={{ opacity: 0.9 }}>{t.origen_falla || '-'} | G{t.gravedad_real || '-'} | {t.notas_diagnostico ? (t.notas_diagnostico.length > 40 ? t.notas_diagnostico.substring(0, 40) + '...' : t.notas_diagnostico) : ''}</span>
                                </div>
                            )}
                        </td>
                        <td style={{ padding: 12 }}>
                            {!isDiagnosticado ? (
                                <div style={{ color: '#e05252', fontWeight: 900, fontSize: 11 }}>POR CATEGORIZAR</div>
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
                                            style={{ background: '#161616', border: '1px solid #333', borderRadius: 4, padding: '4px 8px', fontSize: 10, color: '#fff', textAlign: 'center', width: 100 }}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={(e) => setDelegationSearch(e.target.value)}
                                        />
                                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                                            {profiles.filter(p => !delegationSearch || p.full_name.toLowerCase().includes(delegationSearch.toLowerCase())).slice(0, 3).map(p => (
                                                <TechIcon key={p.id} p={p} active={false} disabled={!isDiagnosticado} onClick={() => handleAssign(t.id, p.id)} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </td>
                        <td style={{ padding: 12 }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center' }}>
                                {/* Semáforo Prioridad */}
                                <div style={{ display: 'flex', gap: 6, paddingRight: 10, borderRight: '1px solid #333' }}>
                                    {[{ val: 'Muy Urgente', col: '#e05252' }, { val: 'Urgente', col: '#f0a040' }, { val: 'Normal', col: '#5290e0' }].map(p => (
                                        <div key={p.val} title={p.val}
                                            onClick={() => dbService.updateTicketPriority(t.id, p.val).then(loadTickets).catch(() => alert("Error DB Prioridad"))}
                                            style={{ width: 15, height: 15, borderRadius: '50%', background: p.col, cursor: 'pointer', opacity: t.prioridad === p.val ? 1 : 0.25, border: t.prioridad === p.val ? '2px solid #fff' : 'none', boxShadow: t.prioridad === p.val ? `0 0 10px ${p.col}` : 'none', transition: 'all 0.2s' }} />
                                    ))}
                                </div>
                                {/* Semáforo Estado */}
                                {!showArchiveBtn && (
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        {[{ val: 'Pendiente', col: '#e05252' }, { val: 'Resuelto', col: '#52c97e' }].map(s => (
                                            <div key={s.val} title={s.val}
                                                onClick={(e) => { e.stopPropagation(); handleStatusUpdate(t.id, s.val); }}
                                                style={{ width: 15, height: 15, borderRadius: '50%', background: s.col, cursor: 'pointer', opacity: t.estado === s.val || (s.val === 'Pendiente' && t.estado !== 'Resuelto') ? 1 : 0.25, border: t.estado === s.val || (s.val === 'Pendiente' && t.estado !== 'Resuelto') ? '2px solid #fff' : 'none', boxShadow: t.estado === s.val || (s.val === 'Pendiente' && t.estado !== 'Resuelto') ? `0 0 10px ${s.col}` : 'none', transition: 'all 0.2s' }} />
                                        ))}
                                    </div>
                                )}
                                {/* Botón Archivar (✓) SOLO en sub-tab Resueltos */}
                                {showArchiveBtn && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleArchiveTicket(t.id); }}
                                        title="Confirmar resolución y archivar"
                                        style={{ background: '#52c97e', border: 'none', borderRadius: 6, color: '#000', fontWeight: 900, fontSize: 14, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px #52c97e88' }}
                                    >✓</button>
                                )}
                            </div>
                            <div style={{ fontSize: 9, marginTop: 4, fontWeight: 700, opacity: 0.8, color: t.estado === 'Resuelto' ? '#52c97e' : 'inherit' }}>{t.estado.toUpperCase()}</div>
                        </td>
                    </tr>
                    {(isExpanded || hasDiag) && (
                        <tr style={{ background: isExpanded ? 'rgba(240, 192, 64, 0.05)' : 'transparent', borderBottom: '1px solid var(--br2)' }}>
                            <td />
                            <td colSpan={5} style={{ padding: '0 20px 12px 20px', textAlign: 'left' }}>
                                {isExpanded ? (
                                    <InlineDiagnosticForm
                                        ticket={t}
                                        onSave={async (id, data) => {
                                            await dbService.saveMasterDiagnosis(id, data);
                                            try { await dbService.addTicketLog(id, 'cambio_estado', `Diagnóstico Maestro: G${data.gravedad_real}, F${data.origen_falla}`); } catch (e) { console.warn("Log skip:", e); }
                                            loadTickets(); loadMyTickets(); setEditingTicketId(null);
                                        }}
                                        onCancel={() => setEditingTicketId(null)}
                                    />
                                ) : (
                                    <div style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 15, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                        <span style={{ fontSize: 8, color: 'var(--acc)', fontWeight: 900, flexShrink: 0 }}>V3 MASTER</span>
                                        <span style={{ opacity: 0.8, flexShrink: 0 }}>{t.origen_falla}</span>
                                        <span style={{ background: 'var(--acc)', color: '#000', padding: '1px 5px', borderRadius: 2, fontSize: 8, fontWeight: 900, flexShrink: 0 }}>G{t.gravedad_real}</span>
                                        <span style={{ opacity: 0.6, overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 1 }}>{t.accion_inmediata || "-"}</span>
                                        <span style={{ opacity: 0.5, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 2 }}>{t.notas_diagnostico || "Sin notas."}</span>
                                        <button onClick={(e) => { e.stopPropagation(); setEditingTicketId(t.id); }} style={{ border: 'none', background: 'none', color: 'var(--acc)', fontSize: 8, cursor: 'pointer', fontWeight: 700, flexShrink: 0, padding: '0 5px' }}>EDITAR</button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    )}
                </React.Fragment>
            );
        });

        return (
            <div className="main" style={{ maxWidth: 1000, margin: '0 auto', width: '100%' }}>
                <div className="stitle" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    Mesa de Soporte
                    <button className="btn btn-g" onClick={() => exportToExcel(tickets, "Tickets")}>EXPORTAR</button>
                </div>

                {/* Sub-tabs */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                    <button style={subTabStyle('pendientes')} onClick={() => setTicketSubTab('pendientes')}>
                        PENDIENTES <span style={{ background: ticketSubTab === 'pendientes' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.08)', padding: '1px 7px', borderRadius: 10, fontSize: 10, marginLeft: 4 }}>{pendientes.length}</span>
                    </button>
                    <button style={subTabStyle('resueltos')} onClick={() => setTicketSubTab('resueltos')}>
                        RESUELTOS <span style={{ background: ticketSubTab === 'resueltos' ? 'rgba(0,0,0,0.2)' : 'rgba(82,201,126,0.2)', color: ticketSubTab === 'resueltos' ? '#000' : '#52c97e', padding: '1px 7px', borderRadius: 10, fontSize: 10, marginLeft: 4 }}>{resueltos.length}</span>
                    </button>
                    <button style={subTabStyle('log')} onClick={() => setTicketSubTab('log')}>
                        LOG SISTEMA <span style={{ background: ticketSubTab === 'log' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.08)', padding: '1px 7px', borderRadius: 10, fontSize: 10, marginLeft: 4 }}>{archivados.length}</span>
                    </button>
                </div>

                {/* Vista: Pendientes */}
                {ticketSubTab === 'pendientes' && (
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'center' }}>
                            <thead style={{ background: 'var(--br)' }}>
                                <tr>
                                    <th style={{ padding: 12 }}># TICKET</th>
                                    <th style={{ padding: 12 }}>MOTIVO / DIAGNÓSTICO</th>
                                    <th style={{ padding: 12 }}>TRIAJE</th>
                                    <th style={{ padding: 12 }}>REPORTADO POR</th>
                                    <th style={{ padding: 12 }}>DELEGACIÓN</th>
                                    <th style={{ padding: 12 }}>ESTADO / PRIORIDAD</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendientes.length === 0 ? (
                                    <tr><td colSpan={6} style={{ padding: 40, opacity: 0.4 }}>✅ Sin tickets pendientes</td></tr>
                                ) : renderRows(pendientes, false)}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Vista: Resueltos */}
                {ticketSubTab === 'resueltos' && (
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '10px 16px', background: 'rgba(82,201,126,0.06)', borderBottom: '1px solid rgba(82,201,126,0.2)', fontSize: 11, color: '#52c97e' }}>
                            Pulsa ✓ para confirmar la resolución y mover al Log de Sistema
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'center' }}>
                            <thead style={{ background: 'var(--br)' }}>
                                <tr>
                                    <th style={{ padding: 12 }}># TICKET</th>
                                    <th style={{ padding: 12 }}>MOTIVO / DIAGNÓSTICO</th>
                                    <th style={{ padding: 12 }}>TRIAJE</th>
                                    <th style={{ padding: 12 }}>REPORTADO POR</th>
                                    <th style={{ padding: 12 }}>DELEGACIÓN</th>
                                    <th style={{ padding: 12 }}>CONFIRMAR ✓</th>
                                </tr>
                            </thead>
                            <tbody>
                                {resueltos.length === 0 ? (
                                    <tr><td colSpan={6} style={{ padding: 40, opacity: 0.4 }}>No hay tickets resueltos pendientes de confirmar</td></tr>
                                ) : renderRows(resueltos, true)}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Vista: Log de Sistema */}
                {ticketSubTab === 'log' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid var(--br2)', fontSize: 10, opacity: 0.6, letterSpacing: 1 }}>
                            HISTORIAL — {archivados.length} INCIDENCIA{archivados.length !== 1 ? 'S' : ''} CERRADA{archivados.length !== 1 ? 'S' : ''} — SOLO LECTURA
                        </div>
                        {archivados.length === 0 ? (
                            <div className="card" style={{ padding: 40, textAlign: 'center', opacity: 0.4, fontSize: 13 }}>El log de sistema está vacío</div>
                        ) : archivados.map(t => (
                            <div key={t.id} className="card" style={{ padding: 0, overflow: 'hidden', borderLeft: '3px solid #52c97e' }}>
                                {/* Cabecera */}
                                <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(82,201,126,0.04)', borderBottom: '1px solid var(--br2)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#52c97e', fontWeight: 700 }}>TK-{t.num_ticket}</span>
                                        <span style={{ fontWeight: 700, fontSize: 14 }}>{t.titulo}</span>
                                        <span style={{ fontSize: 10, background: 'var(--br)', padding: '2px 8px', borderRadius: 4, opacity: 0.7 }}>{t.modulo}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                                        <span style={{ fontSize: 10, opacity: 0.5 }}>Por: {t.profiles?.full_name || '-'}</span>
                                        <span style={{ fontSize: 10, color: '#52c97e', fontWeight: 700 }}>
                                            {t.resuelto_at ? new Date(t.resuelto_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sin fecha'}
                                        </span>
                                    </div>
                                </div>
                                {/* Cuerpo: descripción + diagnóstico */}
                                <div style={{ padding: '12px 16px', display: 'flex', gap: 20 }}>
                                    {/* Descripción original */}
                                    <div style={{ flex: 2, fontSize: 12, opacity: 0.7, lineHeight: 1.5, borderRight: '1px solid var(--br2)', paddingRight: 20 }}>
                                        <div style={{ fontSize: 9, color: 'var(--tx3)', fontWeight: 900, marginBottom: 6, letterSpacing: 1 }}>DESCRIPCIÓN ORIGINAL</div>
                                        {t.descripcion || <span style={{ fontStyle: 'italic', opacity: 0.4 }}>Sin descripción</span>}
                                    </div>
                                    {/* Diagnóstico Master */}
                                    <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <div style={{ fontSize: 9, color: 'var(--acc)', fontWeight: 900, letterSpacing: 1 }}>DIAGNÓSTICO MASTER</div>
                                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                            {t.origen_falla && (
                                                <span style={{ fontSize: 10, background: 'rgba(240,192,64,0.08)', border: '1px solid rgba(240,192,64,0.2)', padding: '2px 10px', borderRadius: 4 }}>
                                                    ORIGEN: <strong>{t.origen_falla}</strong>
                                                </span>
                                            )}
                                            {t.gravedad_real && (
                                                <span style={{ fontSize: 10, background: 'var(--acc)', color: '#000', padding: '2px 10px', borderRadius: 4, fontWeight: 900 }}>
                                                    G{t.gravedad_real}/5
                                                </span>
                                            )}
                                        </div>
                                        {t.accion_inmediata && (
                                            <div style={{ fontSize: 11 }}>
                                                <span style={{ fontSize: 9, opacity: 0.5, fontWeight: 700 }}>ACCIÓN: </span>
                                                {t.accion_inmediata}
                                            </div>
                                        )}
                                        {t.notas_diagnostico && (
                                            <div style={{ fontSize: 11, opacity: 0.8, background: 'rgba(255,255,255,0.02)', padding: '8px 10px', borderRadius: 4, borderLeft: '2px solid rgba(240,192,64,0.3)', lineHeight: 1.5 }}>
                                                {t.notas_diagnostico}
                                            </div>
                                        )}
                                        {!t.origen_falla && !t.accion_inmediata && !t.notas_diagnostico && (
                                            <span style={{ fontSize: 11, opacity: 0.3, fontStyle: 'italic' }}>Sin diagnóstico registrado</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
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
                        <div style={{ padding: 15, fontSize: 13 }}>
                            {t.descripcion}

                            {(t.notas_diagnostico || t.origen_falla || t.accion_inmediata) && (
                                <div style={{
                                    marginTop: 15,
                                    padding: 15,
                                    background: 'rgba(240, 192, 64, 0.05)',
                                    borderRadius: 8,
                                    border: '1px solid rgba(240, 192, 64, 0.2)',
                                    fontSize: 12
                                }}>
                                    <div style={{ color: 'var(--acc)', fontWeight: 800, fontSize: 9, marginBottom: 8 }}>DIAGNÓSTICO DEL MASTER</div>
                                    <div style={{ fontWeight: 600, marginBottom: 5 }}>
                                        Origen: {t.origen_falla || 'No definido'} | Gravedad: {t.gravedad_real || '-'}/5
                                    </div>
                                    {t.notas_diagnostico && (
                                        <div style={{ opacity: 0.9, lineHeight: 1.4, marginBottom: 10 }}>{t.notas_diagnostico}</div>
                                    )}
                                    {t.accion_inmediata && (
                                        <div style={{ padding: '5px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: 4 }}>
                                            <strong>Acción:</strong> {t.accion_inmediata}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
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
