import React, { useState, useEffect, useMemo } from 'react';
import { dbService } from '../../dbService';
import { StatsHeader } from './shared';

export default function BackofficeStats({ profiles, counts, tickets, myTickets, onRefresh }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadLogs();
    }, []);

    const loadLogs = async () => {
        setLoading(true);
        const data = await dbService.getAllLogs();
        setLogs(data || []);
        setLoading(false);
    };

    const stats = useMemo(() => {
        const totalLogs = logs.length;
        const modules = {};
        const operators = {};
        const daily = {};

        logs.forEach(l => {
            modules[l.module_name] = (modules[l.module_name] || 0) + 1;
            const opName = l.full_name || "Sistema";
            operators[opName] = (operators[opName] || 0) + 1;
            const date = new Date(l.created_at).toLocaleDateString();
            daily[date] = (daily[date] || 0) + 1;
        });

        const topOps = Object.entries(operators)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        return { totalLogs, modules, topOps, daily };
    }, [logs, profiles]);

    if (loading && logs.length === 0) {
        return <div className="empty">Cargando analíticas...</div>;
    }

    return (
        <div className="main" style={{ maxWidth: 1000, margin: '0 auto', width: '100%' }}>
            <StatsHeader
                counts={counts}
                totalUsers={profiles.length}
                onRefresh={onRefresh}
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
                                        <span style={{ fontWeight: 800, color: 'var(--fg)' }}>{mod}</span>
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
