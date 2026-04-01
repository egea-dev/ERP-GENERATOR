import React, { useState, useEffect } from 'react';
import { buildApiBaseUrl } from '../../apiConfig';

/**
 * Barra de selección de proveedores con indicación de disponibilidad.
 */
const ProviderBar = ({ selected, onSelect }) => {
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const fetchProviders = async () => {
            try {
                const token = localStorage.getItem('erp_token');
                const res = await fetch(buildApiBaseUrl('/api/chat/providers'), {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                });
                const data = await res.json();
                if (mounted) {
                    setProviders(data);
                    setLoading(false);
                }
            } catch (err) {
                console.error('Error fetching providers:', err);
                if (mounted) setLoading(false);
            }
        };

        fetchProviders();
        return () => { mounted = false; };
    }, []);

    if (loading) return <div className="provider-bar loading">Cargando proveedores...</div>;

    return (
        <div className="provider-bar">
            <div className="chip-row">
                {providers.map(p => (
                    <button 
                        key={p.name} 
                        className={`chip ${selected === p.name ? 'on' : ''}`}
                        onClick={() => p.available && onSelect(p.name)}
                        disabled={!p.available}
                        style={{ opacity: p.available ? 1 : 0.4 }}
                        title={p.available ? `${p.name.toUpperCase()} (Disponible)` : `${p.name.toUpperCase()} (No disponible)`}
                    >
                        <span style={{ 
                            width: 6, 
                            height: 6, 
                            borderRadius: '50%', 
                            background: p.available ? 'var(--green)' : 'var(--red)',
                            display: 'inline-block'
                        }} />
                        {p.name.toUpperCase()}
                        {!p.available && <span className="chip-sub">OFF</span>}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ProviderBar;
