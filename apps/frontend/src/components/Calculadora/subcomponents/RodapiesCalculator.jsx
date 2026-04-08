import React, { useState } from 'react';

export default function RodapiesCalculator({ onSaveCalculation }) {
    const [inputs, setInputs] = useState({ largo: '', tipo: 'estandar', material: 'pvc' });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => { setInputs(prev => ({ ...prev, [e.target.name]: e.target.value })); setResult(null); };

    const handleCalculate = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/calculadora/calculate', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('erp_token')}` },
                body: JSON.stringify({ type: 'rodapies', inputs })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setResult(data.outputs);
            if (onSaveCalculation) onSaveCalculation('rodapies', inputs, data.outputs);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    return (
        <div>
            <div className="calc-form">
                <div className="calc-field"><label>Metros ml</label><input type="number" name="largo" value={inputs.largo} onChange={handleChange} placeholder="0" step="0.01" required /></div>
                <div className="calc-field">
                    <label>Tipo</label>
                    <select name="tipo" value={inputs.tipo} onChange={handleChange}>
                        <option value="estandar">Estándar</option><option value="premium">Premium</option><option value="decorativo">Decorativo</option>
                    </select>
                </div>
                <div className="calc-field">
                    <label>Material</label>
                    <select name="material" value={inputs.material} onChange={handleChange}>
                        <option value="pvc">PVC</option><option value="madera">Madera</option><option value="melamina">Melamina</option>
                    </select>
                </div>
            </div>
            <div className="calc-actions">
                <button className="btn btn-p" onClick={handleCalculate} disabled={loading}>{loading ? '...' : 'Calcular'}</button>
                <button className="btn btn-g" onClick={() => setInputs({ largo: '', tipo: 'estandar', material: 'pvc' })}>Limpiar</button>
            </div>
            {result && (
                <div className="calc-result">
                    <div className="calc-result-header">Resultado</div>
                    <div className="calc-result-grid">
                        <div className="calc-result-item"><div className="calc-result-label">Piezas</div><div className="calc-result-value highlight">{result.totalPiezas}</div></div>
                        <div className="calc-result-item"><div className="calc-result-label">Precio</div><div className="calc-result-value">{result.precioTotal}€</div></div>
                    </div>
                </div>
            )}
        </div>
    );
}