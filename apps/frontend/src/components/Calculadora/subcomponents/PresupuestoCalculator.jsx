import React, { useState } from 'react';

export default function PresupuestoCalculator({ onSaveCalculation }) {
    const [materiales, setMateriales] = useState([{ id: 1, cantidad: '', precio: '' }]);
    const [horas, setHoras] = useState('');
    const [costeHora, setCosteHora] = useState('');
    const [margen, setMargen] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const addMaterial = () => setMateriales([...materiales, { id: Date.now(), cantidad: '', precio: '' }]);
    const removeMaterial = (idx) => { if (materiales.length > 1) setMateriales(materiales.filter((_, i) => i !== idx)); };
    const updateMaterial = (idx, field, value) => { const m = [...materiales]; m[idx][field] = value; setMateriales(m); };

    const handleCalculate = async () => {
        setLoading(true);
        const mats = materiales.map(m => ({ cantidad: parseFloat(m.cantidad) || 0, precio: parseFloat(m.precio) || 0 }));
        try {
            const response = await fetch('/api/calculadora/calculate', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('erp_token')}` },
                body: JSON.stringify({ type: 'presupuesto', inputs: { materiales: mats, horas, costeHora, margen } })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setResult(data.outputs);
            if (onSaveCalculation) onSaveCalculation('presupuesto', { materiales, horas, costeHora, margen }, data.outputs);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    return (
        <div>
            <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 9, color: 'var(--tx3)', textTransform: 'uppercase' }}>Materiales</label>
                {materiales.map((m, i) => (
                    <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 30px', gap: 6, marginBottom: 6 }}>
                        <input placeholder="Cant." value={m.cantidad} onChange={(e) => updateMaterial(i, 'cantidad', e.target.value)} style={inpStyle} />
                        <input placeholder="€" value={m.precio} onChange={(e) => updateMaterial(i, 'precio', e.target.value)} style={inpStyle} />
                        <span style={{ fontSize: 10, alignSelf: 'center' }}>{(parseFloat(m.cantidad||0) * parseFloat(m.precio||0)).toFixed(2)}€</span>
                        {materiales.length > 1 && <button onClick={() => removeMaterial(i)} style={rmBtn}>×</button>}
                    </div>
                ))}
                <button onClick={addMaterial} style={addBtn}>+ Material</button>
            </div>
            <div className="calc-form">
                <div className="calc-field"><label>Horas</label><input type="number" value={horas} onChange={(e) => setHoras(e.target.value)} placeholder="0" style={inpStyle} /></div>
                <div className="calc-field"><label>€/hora</label><input type="number" value={costeHora} onChange={(e) => setCosteHora(e.target.value)} placeholder="0" style={inpStyle} /></div>
                <div className="calc-field"><label>Margen %</label><input type="number" value={margen} onChange={(e) => setMargen(e.target.value)} placeholder="0" style={inpStyle} /></div>
            </div>
            <div className="calc-actions">
                <button className="btn btn-p" onClick={handleCalculate} disabled={loading}>{loading ? '...' : 'Calcular'}</button>
                <button className="btn btn-g" onClick={() => { setMateriales([{ id: 1, cantidad: '', precio: '' }]); setHoras(''); setCosteHora(''); setMargen(''); setResult(null); }}>Limpiar</button>
            </div>
            {result && (
                <div className="calc-result">
                    <div className="calc-result-header">Resultado</div>
                    <div className="calc-result-grid">
                        <div className="calc-result-item"><div className="calc-result-label">Materiales</div><div className="calc-result-value">{result.totalMateriales}€</div></div>
                        <div className="calc-result-item"><div className="calc-result-label">Mano obra</div><div className="calc-result-value">{result.totalManoObra}€</div></div>
                        <div className="calc-result-item"><div className="calc-result-label">TOTAL</div><div className="calc-result-value highlight">{result.total}€</div></div>
                    </div>
                </div>
            )}
        </div>
    );
}

const inpStyle = { background: 'var(--bg)', border: '1px solid var(--br2)', borderRadius: 4, padding: '6px 8px', fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--tx)', outline: 'none' };
const addBtn = { padding: '6px 10px', background: 'var(--s2)', border: '1px solid var(--br)', borderRadius: 4, fontSize: 10, color: 'var(--fg2)', cursor: 'pointer' };
const rmBtn = { padding: 6, background: 'var(--s2)', border: '1px solid var(--br)', borderRadius: 4, color: 'var(--err)', cursor: 'pointer' };