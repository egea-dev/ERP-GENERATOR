import React, { useState } from 'react';

export default function PersianasCalculator({ onSaveCalculation }) {
    const [inputs, setInputs] = useState({ ancho: '', alto: '', tipo: 'enrollable', material: 'aluminio' });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => { setInputs(prev => ({ ...prev, [e.target.name]: e.target.value })); setResult(null); };

    const handleCalculate = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/calculadora/calculate', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('erp_token')}` },
                body: JSON.stringify({ type: 'persianas', inputs })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setResult(data.outputs);
            if (onSaveCalculation) onSaveCalculation('persianas', inputs, data.outputs);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    return (
        <div>
            <div className="calc-form">
                <div className="calc-field"><label>Ancho cm</label><input type="number" name="ancho" value={inputs.ancho} onChange={handleChange} placeholder="0" step="0.1" required /></div>
                <div className="calc-field"><label>Alto cm</label><input type="number" name="alto" value={inputs.alto} onChange={handleChange} placeholder="0" step="0.1" required /></div>
                <div className="calc-field">
                    <label>Tipo</label>
                    <select name="tipo" value={inputs.tipo} onChange={handleChange}>
                        <option value="enrollable">Enrollable</option><option value="venciana">Venciana</option><option value="vertical">Vertical</option>
                    </select>
                </div>
                <div className="calc-field">
                    <label>Material</label>
                    <select name="material" value={inputs.material} onChange={handleChange}>
                        <option value="aluminio">Aluminio</option><option value="pvc">PVC</option><option value="madera">Madera</option>
                    </select>
                </div>
            </div>
            <div className="calc-actions">
                <button className="btn btn-p" onClick={handleCalculate} disabled={loading}>{loading ? '...' : 'Calcular'}</button>
                <button className="btn btn-g" onClick={() => setInputs({ ancho: '', alto: '', tipo: 'enrollable', material: 'aluminio' })}>Limpiar</button>
            </div>
            {result && (
                <div className="calc-result">
                    <div className="calc-result-header">Resultado</div>
                    <div className="calc-result-grid">
                        <div className="calc-result-item"><div className="calc-result-label">Superficie</div><div className="calc-result-value">{result.superficie} m²</div></div>
                        <div className="calc-result-item"><div className="calc-result-label">Precio</div><div className="calc-result-value highlight">{result.precioEstimado}€</div></div>
                    </div>
                </div>
            )}
        </div>
    );
}