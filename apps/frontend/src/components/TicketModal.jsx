import React, { useState } from 'react';
import { dbService } from '../dbService';
import { useAuth } from '../context/AuthContext';

export default function TicketModal({ isOpen, onClose }) {
    const { user } = useAuth();
    const [tab, setTab] = useState("nuevo"); // "nuevo" o "lista"
    const [tickets, setTickets] = useState([]);
    const [titulo, setTitulo] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [prioridad, setPrioridad] = useState("Normal");
    const [modulo, setModulo] = useState("General");
    const [enviando, setEnviando] = useState(false);
    const [exito, setExito] = useState(false);

    const loadMyTickets = async () => {
        if (!user) return;
        const data = await dbService.getTickets();
        const mine = data.filter(t => t.user_id === user.id && t.estado !== 'Archivado');
        setTickets(mine);
    };

    React.useEffect(() => {
        if (isOpen) {
            loadMyTickets();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setEnviando(true);
        try {
            await dbService.saveTicket({
                user_id: user.id,
                titulo,
                descripcion,
                prioridad,
                modulo,
                estado: 'Pendiente'
            });
            await dbService.insertLog('TICKET_CREATE', modulo, { titulo, prioridad });
            setExito(true);
            setTimeout(() => {
                onClose();
                setExito(false);
                setTitulo("");
                setDescripcion("");
            }, 2000);
        } catch (err) {
            console.error("Error al enviar ticket:", err);
            alert("No se pudo enviar el ticket. Revisa tu conexión.");
        } finally {
            setEnviando(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: 20
        }}>
            <div style={{
                background: '#161616', border: '1px solid #333',
                borderRadius: 12, width: '100%', maxWidth: 500,
                padding: 30, position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}>
                <button onClick={onClose} style={{
                    position: 'absolute', top: 20, right: 20,
                    background: 'none', border: 'none', color: '#666',
                    cursor: 'pointer', fontSize: 20
                }}>×</button>

                <div style={{ display: 'flex', gap: 20, marginBottom: 25, borderBottom: '1px solid #333' }}>
                    <button
                        onClick={() => setTab("nuevo")}
                        style={{
                            background: 'none', border: 'none', padding: '10px 0',
                            color: tab === "nuevo" ? 'var(--acc)' : '#666',
                            fontSize: 11, fontWeight: 800, cursor: 'pointer',
                            borderBottom: tab === "nuevo" ? '2px solid var(--acc)' : 'none'
                        }}
                    > NUEVO TICKET </button>
                    <button
                        onClick={() => setTab("lista")}
                        style={{
                            background: 'none', border: 'none', padding: '10px 0',
                            color: tab === "lista" ? 'var(--acc)' : '#666',
                            fontSize: 11, fontWeight: 800, cursor: 'pointer',
                            borderBottom: tab === "lista" ? '2px solid var(--acc)' : 'none'
                        }}
                    > MIS TICKETS {tickets.length > 0 && `(${tickets.length})`} </button>
                </div>

                {tab === "nuevo" ? (
                    exito ? (
                        <div style={{
                            textAlign: 'center', padding: '40px 0',
                            color: '#52c97e', fontFamily: 'var(--mono)'
                        }}>
                            <div style={{ fontSize: 48, marginBottom: 10 }}>✓</div>
                            Ticket enviado correctamente.
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: 10, color: '#666', fontWeight: 700, letterSpacing: '1px' }}>RESUMEN DEL PROBLEMA</label>
                                <input
                                    required
                                    style={{
                                        background: '#1e1e1e', border: '1px solid #333',
                                        borderRadius: 6, padding: '12px 15px', color: '#fff',
                                        outline: 'none'
                                    }}
                                    placeholder="Ej: No funciona el botón de exportar..."
                                    value={titulo}
                                    onChange={(e) => setTitulo(e.target.value)}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <label style={{ fontSize: 10, color: '#666', fontWeight: 700, letterSpacing: '1px' }}>PRIORIDAD</label>
                                    <select
                                        style={{
                                            background: '#1e1e1e', border: '1px solid #333',
                                            borderRadius: 6, padding: '10px', color: '#fff', outline: 'none'
                                        }}
                                        value={prioridad}
                                        onChange={(e) => setPrioridad(e.target.value)}
                                    >
                                        <option value="Normal">Normal</option>
                                        <option value="Urgente">Urgente</option>
                                        <option value="Muy Urgente">Muy Urgente</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <label style={{ fontSize: 10, color: '#666', fontWeight: 700, letterSpacing: '1px' }}>MÓDULO</label>
                                    <select
                                        style={{
                                            background: '#1e1e1e', border: '1px solid #333',
                                            borderRadius: 6, padding: '10px', color: '#fff', outline: 'none'
                                        }}
                                        value={modulo}
                                        onChange={(e) => setModulo(e.target.value)}
                                    >
                                        <option value="General">General</option>
                                        <option value="REFGEN">REFGEN</option>
                                        <option value="URLGEN">URLGEN</option>
                                        <option value="Backoffice">Backoffice</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label style={{ fontSize: 10, color: '#666', fontWeight: 700, letterSpacing: '1px' }}>DESCRIPCIÓN DETALLADA</label>
                                <textarea
                                    required
                                    rows={4}
                                    style={{
                                        background: '#1e1e1e', border: '1px solid #333',
                                        borderRadius: 6, padding: '12px 15px', color: '#fff',
                                        outline: 'none', resize: 'none'
                                    }}
                                    placeholder="Explica qué ha pasado o qué necesitas..."
                                    value={descripcion}
                                    onChange={(e) => setDescripcion(e.target.value)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={enviando}
                                style={{
                                    background: '#f0c040', color: '#000',
                                    border: 'none', borderRadius: 6, padding: '14px',
                                    fontWeight: 800, cursor: 'pointer',
                                    letterSpacing: '1px', marginTop: 10,
                                    opacity: enviando ? 0.6 : 1
                                }}
                            >
                                {enviando ? "ENVIANDO..." : "ENVIAR TICKET"}
                            </button>
                        </form>
                    )
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 15, maxHeight: 400, overflowY: 'auto', paddingRight: 10 }}>
                        {tickets.length === 0 ? (
                            <div style={{ textAlign: 'center', opacity: 0.5, padding: 40, fontSize: 13 }}>No tienes tickets activos.</div>
                        ) : (
                            tickets.map(t => {
                                // Mapeo de estados a pasos (0-3)
                                const steps = ["Recibido", "Analizando", "Reparando", "Solucionado"];
                                let currentStep = 0;
                                if (t.estado === 'Diagnosticado') currentStep = 1;
                                if (t.estado === 'En proceso') currentStep = 2;
                                if (t.estado === 'Resuelto') currentStep = 3;

                                return (
                                    <div key={t.id} style={{ background: '#1e1e1e', border: '1px solid #333', borderRadius: 8, padding: 15 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                            <div style={{ fontSize: 13, fontWeight: 700 }}>{t.titulo}</div>
                                            <div style={{ fontSize: 9, color: '#666' }}>{new Date(t.created_at).toLocaleDateString()}</div>
                                        </div>

                                        {/* Barra de Progreso */}
                                        <div style={{ position: 'relative', marginTop: 10, marginBottom: 25 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
                                                {steps.map((s, i) => (
                                                    <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                                                        <div style={{
                                                            width: 12, height: 12, borderRadius: '50%',
                                                            background: i <= currentStep ? 'var(--acc)' : '#333',
                                                            boxShadow: i <= currentStep ? '0 0 10px var(--acc)' : 'none',
                                                            transition: 'all 0.5s ease'
                                                        }} />
                                                        <span style={{ fontSize: 8, fontWeight: 800, color: i <= currentStep ? 'var(--acc)' : '#666' }}>{s.toUpperCase()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Línea de conexión */}
                                            <div style={{
                                                position: 'absolute', top: 5, left: '5%', right: '5%', height: 2,
                                                background: '#333', zIndex: 0
                                            }} />
                                            <div style={{
                                                position: 'absolute', top: 5, left: '5%', width: `${(currentStep / 3) * 90}%`, height: 2,
                                                background: 'var(--acc)', zIndex: 0, transition: 'width 0.8s ease'
                                            }} />
                                        </div>

                                        {t.estado === 'Resuelto' && (
                                            <div style={{ fontSize: 11, color: '#52c97e', textAlign: 'center', background: 'rgba(82, 201, 126, 0.05)', padding: 8, borderRadius: 4 }}>
                                                ¡LISTO! La incidencia ha sido solucionada.
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
