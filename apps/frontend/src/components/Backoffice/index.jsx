import React, { useState, useEffect, useMemo } from 'react';
import { dbService } from '../../dbService';
import { STATUS_COLORS, TechIcon, getTimeAgo, InlineDiagnosticForm } from './shared';
import BackofficeStats from './StatsPanel';
import UsersPanel from './UsersPanel';
import ModulesPanel from './ModulesPanel';

export default function Backoffice({ tab, setTab }) {
    const [logs, setLogs] = useState([]);
    const [profiles, setProfiles] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [myTickets, setMyTickets] = useState([]);
    const [counts, setCounts] = useState({ articles: 0, dirs: 0, logs: 0 });
    const [loading, setLoading] = useState(false);
    const [q, setQ] = useState("");
    const [delegationSearch, setDelegationSearch] = useState("");
    const [editingTicketId, setEditingTicketId] = useState(null);
    const [assignment, setAssignment] = useState({});
    const [activeLog, setActiveLog] = useState(null);
    const [logText, setLogText] = useState("");
    const [leccion, setLeccion] = useState(false);
    const [ticketLogs, setTicketLogs] = useState({});
    const [ticketSubTab, setTicketSubTab] = useState('pendientes');

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
                console.warn("Log skip:", logErr);
            }
            loadTickets();
            loadMyTickets();
        } catch (err) {
            alert("No se pudo actualizar el estado: " + (err?.message || "Error desconocido."));
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
            alert("Error al guardar. " + err.message);
        }
    };

    const handleAssign = async (ticketId, userId) => {
        if (!userId) return;
        try {
            await dbService.assignTicket(ticketId, userId, "");
            await dbService.addTicketLog(ticketId, 'cambio_estado', `Ticket delegado a técnico.`);
            loadTickets();
        } catch (err) {
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
            alert('Error al archivar: ' + (err?.message || 'Error desconocido'));
        }
    };

    const handleRefreshAll = () => {
        loadTickets();
        loadMyTickets();
        loadProfiles();
        loadCounts();
    };

    const filteredLogs = useMemo(() => {
        const query = q.toUpperCase().trim();
        return logs.filter(l =>
            l.module_name?.toUpperCase().includes(query) ||
            l.action_type?.toUpperCase().includes(query) ||
            l.full_name?.toUpperCase().includes(query)
        );
    }, [logs, q]);

    if (loading && logs.length === 0 && profiles.length === 0) {
        return <div className="empty">Cargando panel de control...</div>;
    }

    if (tab === "stats") {
        return <BackofficeStats profiles={profiles} counts={counts} tickets={tickets} myTickets={myTickets} onRefresh={handleRefreshAll} />;
    }

    if (tab === "users") {
        return <UsersPanel profiles={profiles} onLoadProfiles={loadProfiles} />;
    }

    if (tab === "modules") {
        return <ModulesPanel />;
    }

    if (tab === "tickets") {
        const pendientes = tickets.filter(t => !t.archivado && t.estado !== 'Resuelto');
        const resueltos = tickets.filter(t => !t.archivado && t.estado === 'Resuelto');
        const archivados = tickets.filter(t => t.archivado);

        const subTabStyle = (key) => ({
            padding: '8px 18px', border: 'none', cursor: 'pointer', fontWeight: 700,
            fontSize: 11, borderRadius: 6, transition: 'all 0.2s',
            background: ticketSubTab === key ? 'var(--acc)' : 'rgba(255,255,255,0.05)',
            color: ticketSubTab === key ? 'var(--bg)' : 'var(--tx2)',
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
                            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--fg)', marginBottom: 4 }}>{t.titulo}</div>
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
                            <td style={{ padding: 12, fontSize: 12 }}>{t.full_name || 'Desconocido'}</td>
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
                                            style={{ background: 'var(--s2)', border: '1px solid var(--br)', borderRadius: 4, padding: '4px 8px', fontSize: 10, color: 'var(--fg)', textAlign: 'center', width: 100 }}
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
                                <div style={{ display: 'flex', gap: 6, paddingRight: 10, borderRight: '1px solid var(--br)' }}>
                                    {[{ val: 'Muy Urgente', col: '#e05252' }, { val: 'Urgente', col: '#f0a040' }, { val: 'Normal', col: '#5290e0' }].map(p => (
                                        <div key={p.val} title={p.val}
                                            onClick={() => dbService.updateTicketPriority(t.id, p.val).then(loadTickets).catch(() => alert("Error DB Prioridad"))}
                                            style={{ width: 15, height: 15, borderRadius: '50%', background: p.col, cursor: 'pointer', opacity: t.prioridad === p.val ? 1 : 0.25, border: t.prioridad === p.val ? '2px solid #fff' : 'none', boxShadow: t.prioridad === p.val ? `0 0 10px ${p.col}` : 'none', transition: 'all 0.2s' }} />
                                    ))}
                                </div>
                                {!showArchiveBtn && (
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        {[{ val: 'Pendiente', col: '#e05252' }, { val: 'Resuelto', col: '#52c97e' }].map(s => (
                                            <div key={s.val} title={s.val}
                                                onClick={(e) => { e.stopPropagation(); handleStatusUpdate(t.id, s.val); }}
                                                style={{ width: 15, height: 15, borderRadius: '50%', background: s.col, cursor: 'pointer', opacity: t.estado === s.val || (s.val === 'Pendiente' && t.estado !== 'Resuelto') ? 1 : 0.25, border: t.estado === s.val || (s.val === 'Pendiente' && t.estado !== 'Resuelto') ? '2px solid #fff' : 'none', boxShadow: t.estado === s.val || (s.val === 'Pendiente' && t.estado !== 'Resuelto') ? `0 0 10px ${s.col}` : 'none', transition: 'all 0.2s' }} />
                                        ))}
                                    </div>
                                )}
                                {showArchiveBtn && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleArchiveTicket(t.id); }}
                                        title="Confirmar resolución y archivar"
                                            style={{ background: '#52c97e', border: 'none', borderRadius: 6, color: 'var(--bg)', fontWeight: 900, fontSize: 14, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px #52c97e88' }}
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
                                        <span style={{ background: 'var(--acc)', color: 'var(--bg)', padding: '1px 5px', borderRadius: 2, fontSize: 8, fontWeight: 900, flexShrink: 0 }}>G{t.gravedad_real}</span>
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
                </div>

                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                    <button style={subTabStyle('pendientes')} onClick={() => setTicketSubTab('pendientes')}>
                        PENDIENTES <span style={{ background: ticketSubTab === 'pendientes' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.08)', padding: '1px 7px', borderRadius: 10, fontSize: 10, marginLeft: 4 }}>{pendientes.length}</span>
                    </button>
                    <button style={subTabStyle('resueltos')} onClick={() => setTicketSubTab('resueltos')}>
                        RESUELTOS <span style={{ background: ticketSubTab === 'resueltos' ? 'rgba(0,0,0,0.2)' : 'rgba(82,201,126,0.2)', color: ticketSubTab === 'resueltos' ? 'var(--bg)' : 'var(--green)', padding: '1px 7px', borderRadius: 10, fontSize: 10, marginLeft: 4 }}>{resueltos.length}</span>
                    </button>
                    <button style={subTabStyle('log')} onClick={() => setTicketSubTab('log')}>
                        LOG SISTEMA <span style={{ background: ticketSubTab === 'log' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.08)', padding: '1px 7px', borderRadius: 10, fontSize: 10, marginLeft: 4 }}>{archivados.length}</span>
                    </button>
                </div>

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

                {ticketSubTab === 'log' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 6, border: '1px solid var(--br2)', fontSize: 10, opacity: 0.6, letterSpacing: 1 }}>
                            HISTORIAL — {archivados.length} INCIDENCIA{archivados.length !== 1 ? 'S' : ''} CERRADA{archivados.length !== 1 ? 'S' : ''} — SOLO LECTURA
                        </div>
                        {archivados.length === 0 ? (
                            <div className="card" style={{ padding: 40, textAlign: 'center', opacity: 0.4, fontSize: 13 }}>El log de sistema está vacío</div>
                        ) : archivados.map(t => (
                            <div key={t.id} className="card" style={{ padding: 0, overflow: 'hidden', borderLeft: '3px solid #52c97e' }}>
                                <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(82,201,126,0.04)', borderBottom: '1px solid var(--br2)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: '#52c97e', fontWeight: 700 }}>TK-{t.num_ticket}</span>
                                        <span style={{ fontWeight: 700, fontSize: 14 }}>{t.titulo}</span>
                                        <span style={{ fontSize: 10, background: 'var(--br)', padding: '2px 8px', borderRadius: 4, opacity: 0.7 }}>{t.modulo}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                                        <span style={{ fontSize: 10, opacity: 0.5 }}>Por: {t.full_name || '-'}</span>
                                        <span style={{ fontSize: 10, color: '#52c97e', fontWeight: 700 }}>
                                            {t.resuelto_at ? new Date(t.resuelto_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Sin fecha'}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ padding: '12px 16px', display: 'flex', gap: 20 }}>
                                    <div style={{ flex: 2, fontSize: 12, opacity: 0.7, lineHeight: 1.5, borderRight: '1px solid var(--br2)', paddingRight: 20 }}>
                                        <div style={{ fontSize: 9, color: 'var(--tx3)', fontWeight: 900, marginBottom: 6, letterSpacing: 1 }}>DESCRIPCIÓN ORIGINAL</div>
                                        {t.descripcion || <span style={{ fontStyle: 'italic', opacity: 0.4 }}>Sin descripción</span>}
                                    </div>
                                    <div style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <div style={{ fontSize: 9, color: 'var(--acc)', fontWeight: 900, letterSpacing: 1 }}>DIAGNÓSTICO MASTER</div>
                                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                            {t.origen_falla && (
                                                <span style={{ fontSize: 10, background: 'rgba(240,192,64,0.08)', border: '1px solid rgba(240,192,64,0.2)', padding: '2px 10px', borderRadius: 4 }}>
                                                    ORIGEN: <strong>{t.origen_falla}</strong>
                                                </span>
                                            )}
                                            {t.gravedad_real && (
                                                <span style={{ fontSize: 10, background: 'var(--acc)', color: 'var(--bg)', padding: '2px 10px', borderRadius: 4, fontWeight: 900 }}>
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
                    <div key={t.id} className="card" style={{ marginBottom: 15, padding: 0, overflow: 'hidden', borderLeft: `4px solid ${STATUS_COLORS[t.estado] || '#666'}` }}>
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
                                <button className="btn" style={{ fontSize: 10, background: 'var(--acc)', color: 'var(--bg)' }} onClick={() => { setActiveLog(t.id); setLogText("Resuelto."); }}>SOLUCIONADO</button>
                            )}
                        </div>
                        {activeLog === t.id && (
                            <div style={{ padding: 15, background: 'var(--s2)', borderTop: '1px solid var(--br2)' }}>
                                <div style={{ maxHeight: 150, overflowY: 'auto', marginBottom: 10 }}>
                                    {(ticketLogs[t.id] || []).map(l => (
                                        <div key={l.id} style={{ fontSize: 11, marginBottom: 5 }}>
                                            <strong style={{ color: 'var(--acc)' }}>{l.full_name}:</strong> {l.contenido}
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
                                            <button className="btn" style={{ padding: '6px 15px', fontSize: 10, background: '#52c97e', color: 'var(--bg)' }} onClick={() => handleAddLog(t.id, 'solucion')}>RESOLVER TICKET</button>
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

    return (
        <div className="main" style={{ maxWidth: 1000, margin: '0 auto', width: '100%' }}>
            <div className="stitle" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                Auditoría de Operaciones
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
                                <td style={{ padding: 10 }}>{l.full_name || "Sistema"}</td>
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
