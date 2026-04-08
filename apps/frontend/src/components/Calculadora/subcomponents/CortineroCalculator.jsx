import React, { useState } from 'react';

export default function CortineroCalculator({ onSaveCalculation }) {
    const [inputs, setInputs] = useState({ ancho: '', caida: '', pliegues: '2.5', tipoMedida: 'cm' });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => { setInputs(prev => ({ ...prev, [e.target.name]: e.target.value })); setResult(null); };

    const handleCalculate = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/calculadora/calculate', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('erp_token')}` },
                body: JSON.stringify({ type: 'cortinero', inputs })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setResult(data.outputs);
            if (onSaveCalculation) onSaveCalculation('cortinero', inputs, data.outputs);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    return (
        <div>
            <div className="calc-form">
                <div className="calc-field"><label>Ancho</label><input type="number" name="ancho" value={inputs.ancho} onChange={handleChange} placeholder="0" step="0.1" required /></div>
                <div className="calc-field"><label>Caída</label><input type="number" name="caida" value={inputs.caida} onChange={handleChange} placeholder="0" step="0.1" required /></div>
                <div className="calc-field">
                    <label>Pliegues</label>
                    <select name="pliegues" value={inputs.pliegues} onChange={handleChange}>
                        <option value="2">2x</option><option value="2.5">2.5x</option><option value="3">3x</option>
                    </select>
                </div>
                <div className="calc-field">
                    <label>Unidad</label>
                    <select name="tipoMedida" value={inputs.tipoMedida} onChange={handleChange}>
                        <option value="cm">cm</option><option value="m">m</option>
                    </select>
                </div>
            </div>
            <div className="calc-actions">
                <button className="btn btn-p" onClick={handleCalculate} disabled={loading}>{loading ? '...' : 'Calcular'}</button>
                <button className="btn btn-g" onClick={() => setInputs({ ancho: '', caida: '', pliegues: '2.5', tipoMedida: 'cm' })}>Limpiar</button>
            </div>
            {result && (
                <div className="calc-result">
                    <div className="calc-result-header">Resultado</div>
                    <div className="calc-result-grid">
                        <div className="calc-result-item"><div className="calc-result-label">Tela</div><div className="calc-result-value highlight">{result.metrosTela} m</div></div>
                        <div className="calc-result-item"><div className="calc-result-label">Costuras</div><div className="calc-result-value">{result.costuras}</div></div>
                        <div className="calc-result-item"><div className="calc-result-label">Nota</div><div className="calc-result-value">{result.recomendacion}</div></div>
                    </div>
                </div>
            )}
        </div>
    );
}