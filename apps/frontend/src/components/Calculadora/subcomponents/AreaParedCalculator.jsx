import React, { useState } from 'react';

export default function AreaParedCalculator({ onSaveCalculation }) {
    const [inputs, setInputs] = useState({ numParedes: '1', ancho: '', alto: '', numPuertas: '0', numVentanas: '0' });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => { setInputs(prev => ({ ...prev, [e.target.name]: e.target.value })); setResult(null); };

    const handleCalculate = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/calculadora/calculate', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('erp_token')}` },
                body: JSON.stringify({ type: 'pared', inputs })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setResult(data.outputs);
            if (onSaveCalculation) onSaveCalculation('pared', inputs, data.outputs);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    return (
        <div>
            <div className="calc-form">
                <div className="calc-field">
                    <label>Paredes</label>
                    <select name="numParedes" value={inputs.numParedes} onChange={handleChange}>
                        <option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option>
                    </select>
                </div>
                <div className="calc-field"><label>Ancho m</label><input type="number" name="ancho" value={inputs.ancho} onChange={handleChange} placeholder="0" required /></div>
                <div className="calc-field"><label>Alto m</label><input type="number" name="alto" value={inputs.alto} onChange={handleChange} placeholder="0" required /></div>
                <div className="calc-field"><label>Puertas</label><input type="number" name="numPuertas" value={inputs.numPuertas} onChange={handleChange} /></div>
                <div className="calc-field"><label>Ventanas</label><input type="number" name="numVentanas" value={inputs.numVentanas} onChange={handleChange} /></div>
            </div>
            <div className="calc-actions">
                <button className="btn btn-p" onClick={handleCalculate} disabled={loading}>{loading ? '...' : 'Calcular'}</button>
                <button className="btn btn-g" onClick={() => setInputs({ numParedes: '1', ancho: '', alto: '', numPuertas: '0', numVentanas: '0' })}>Limpiar</button>
            </div>
            {result && (
                <div className="calc-result">
                    <div className="calc-result-header">Resultado</div>
                    <div className="calc-result-grid">
                        <div className="calc-result-item"><div className="calc-result-label">Total</div><div className="calc-result-value">{result.areaTotalParedes} m²</div></div>
                        <div className="calc-result-item"><div className="calc-result-label">Pintar</div><div className="calc-result-value highlight">{result.areaPintar} m²</div></div>
                    </div>
                </div>
            )}
        </div>
    );
}