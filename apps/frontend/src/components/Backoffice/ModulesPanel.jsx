import React, { useState, useEffect } from 'react';
import { dbService } from '../../dbService';

const PANEL_ICONS = {
    refgen: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
    ),
    urlgen: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
    ),
    chat: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
    ),
    tarifas: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
    ),
    envios: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
    ),
};

const ALL_ROLES = ['admin', 'editor', 'user'];

function ToggleSwitch({ checked, onChange }) {
    return (
        <button
            onClick={() => onChange(!checked)}
            style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                background: checked ? 'var(--acc)' : 'var(--br2)',
                transition: 'background 0.2s',
            }}
        >
            <div style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#fff',
                position: 'absolute',
                top: 3,
                left: checked ? 23 : 3,
                transition: 'left 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            }} />
        </button>
    );
}

export default function ModulesPanel({ onModulesChange }) {
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadConfigs();
    }, []);

    const loadConfigs = async () => {
        setLoading(true);
        try {
            const data = await dbService.getPanelConfig();
            setConfigs(data || []);
        } catch (err) {
            setError('Error al cargar la configuración de módulos');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (panelId, enabled) => {
        setConfigs(prev => prev.map(c =>
            c.panel_id === panelId ? { ...c, enabled } : c
        ));
        setSaved(false);
    };

    const handleRoleToggle = (panelId, role) => {
        setConfigs(prev => prev.map(c => {
            if (c.panel_id !== panelId) return c;
            const roles = c.visible_roles || [];
            const hasRole = roles.includes(role);
            return {
                ...c,
                visible_roles: hasRole ? roles.filter(r => r !== role) : [...roles, role],
            };
        }));
        setSaved(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        try {
            await dbService.updatePanelConfig(configs);
            setSaved(true);
            if (onModulesChange) onModulesChange();
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            setError('Error al guardar: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="empty">Cargando módulos...</div>;
    }

    return (
        <div className="main" style={{ maxWidth: 700, margin: '0 auto', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <div className="stitle" style={{ fontSize: 11, letterSpacing: 1, marginBottom: 4 }}>Gestión de Módulos</div>
                    <div style={{ fontSize: 12, color: 'var(--fg2)' }}>Activa o desactiva los paneles que ven los usuarios</div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                        padding: '8px 20px',
                        background: saved ? 'var(--green)' : 'var(--acc)',
                        color: saved ? '#fff' : 'var(--bg)',
                        border: 'none',
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: saving ? 'wait' : 'pointer',
                        letterSpacing: 0.5,
                    }}
                >
                    {saving ? 'Guardando...' : saved ? '✓ Guardado' : 'Guardar Cambios'}
                </button>
            </div>

            {error && (
                <div style={{
                    padding: 12,
                    background: 'rgba(224, 82, 82, 0.1)',
                    border: '1px solid var(--red)',
                    borderRadius: 8,
                    color: '#e05252',
                    fontSize: 12,
                    marginBottom: 20,
                }}>
                    {error}
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {configs.map((cfg) => (
                    <div
                        key={cfg.panel_id}
                        className="card"
                        style={{
                            background: 'var(--s1)',
                            border: `1px solid ${cfg.enabled ? 'var(--br)' : 'var(--br2)'}`,
                            borderRadius: 12,
                            padding: 20,
                            opacity: cfg.enabled ? 1 : 0.6,
                            transition: 'all 0.2s',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 10,
                                    background: cfg.enabled ? 'rgba(96, 165, 250, 0.15)' : 'var(--br2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: cfg.enabled ? 'var(--acc)' : 'var(--fg2)',
                                }}>
                                    {PANEL_ICONS[cfg.panel_id] || '?'}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--fg)' }}>{cfg.panel_name}</div>
                                    <div style={{ fontSize: 11, color: 'var(--fg2)', fontFamily: 'var(--mono)' }}>{cfg.panel_id}</div>
                                </div>
                            </div>
                            <ToggleSwitch checked={cfg.enabled} onChange={(v) => handleToggle(cfg.panel_id, v)} />
                        </div>

                        {cfg.enabled && (
                            <div style={{ paddingLeft: 52 }}>
                                <div style={{ fontSize: 10, color: 'var(--fg2)', marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                                    Visible para roles:
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {ALL_ROLES.map(role => {
                                        const hasRole = (cfg.visible_roles || []).includes(role);
                                        return (
                                            <button
                                                key={role}
                                                onClick={() => handleRoleToggle(cfg.panel_id, role)}
                                                style={{
                                                    padding: '4px 12px',
                                                    borderRadius: 6,
                                                    border: `1px solid ${hasRole ? 'var(--acc)' : 'var(--br2)'}`,
                                                    background: hasRole ? 'rgba(96, 165, 250, 0.15)' : 'transparent',
                                                    color: hasRole ? 'var(--acc)' : 'var(--fg2)',
                                                    fontSize: 11,
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: 0.5,
                                                }}
                                            >
                                                {role}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
