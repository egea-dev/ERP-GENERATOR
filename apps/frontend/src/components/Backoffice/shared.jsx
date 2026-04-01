import React from 'react';

export const STATUS_COLORS = {
    'Muy Urgente': '#e05252',
    'Urgente': '#ffa500',
    'Normal': '#5290e0',
    'En proceso': '#a852e0',
    'Resuelto': '#52c97e',
    'Pendiente': '#f0c040',
    'Archivado': '#666'
};

export const TECH_COLORS = ['#f0c040', '#40f0c0', '#40c0f0', '#f040c0', '#c040f0', '#f08040'];

export function getInitials(name) {
    if (!name) return "??";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function getTimeAgo(dateStr) {
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
}

export function TechIcon({ p, active, onClick, size = 28, disabled = false }) {
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
                color: active ? 'var(--bg)' : color,
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
                <div style={{ position: 'absolute', bottom: -2, right: -2, width: 8, height: 8, background: 'var(--green)', borderRadius: '50%', border: '2px solid var(--bg)' }} />
            )}
        </div>
    );
}

export function StatsHeader({ counts, totalUsers, onRefresh }) {
    return (
        <div className="stats-row" style={{ display: 'flex', gap: 15, marginBottom: 30, alignItems: 'center' }}>
            <button onClick={onRefresh} style={{ background: 'var(--acc)', border: 'none', borderRadius: 8, padding: '10px 15px', cursor: 'pointer', fontWeight: 900, fontSize: 10, color: 'var(--bg)', marginRight: 10 }}>ACTUALIZAR DATOS</button>
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
}

export function InlineDiagnosticForm({ ticket, onSave, onCancel }) {
    const [diagData, setDiagData] = React.useState({
        origen_falla: ticket.origen_falla || 'Software',
        gravedad_real: ticket.gravedad_real || 3,
        notas_diagnostico: ticket.notas_diagnostico || '',
        accion_inmediata: ticket.accion_inmediata || ''
    });

    const handleSave = async (e) => {
        e.stopPropagation();
        try {
            await onSave(ticket.id, diagData);
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
                    style={{ width: 100, height: 28, fontSize: 10, padding: '0 4px', background: 'var(--s2)', border: '1px solid var(--br)' }}
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
                            color: diagData.gravedad_real === v ? 'var(--bg)' : 'var(--tx3)',
                            fontWeight: 900, cursor: 'pointer', fontSize: 9
                        }}
                    >
                        {v}
                    </button>
                ))}
            </div>

            <input
                className="search-in"
                style={{ flex: 1, height: 28, fontSize: 11, minWidth: 120, background: 'var(--s2)', border: '1px solid var(--br)' }}
                value={diagData.accion_inmediata}
                onChange={e => setDiagData({ ...diagData, accion_inmediata: e.target.value })}
                placeholder="Acción..."
            />

            <input
                className="search-in"
                style={{ flex: 2, height: 28, fontSize: 11, minWidth: 150, background: 'var(--s2)', border: '1px solid var(--br)' }}
                value={diagData.notas_diagnostico}
                onChange={e => setDiagData({ ...diagData, notas_diagnostico: e.target.value })}
                placeholder="Análisis técnico detallado..."
            />

            <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button className="btn" style={{ background: 'var(--acc)', color: 'var(--bg)', fontWeight: 900, fontSize: 9, padding: '0 10px', height: 28 }} onClick={handleSave}>GUARDAR</button>
                <button className="btn btn-g" style={{ padding: '0 8px', height: 28 }} onClick={(e) => { e.stopPropagation(); onCancel(); }}>✖</button>
            </div>
        </div>
    );
}
