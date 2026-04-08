import React, { useState } from 'react';

export default function EscaleraCalculator({ onSaveCalculation }) {
    const [inputs, setInputs] = useState({ alturaTotal: '', huella: '', contrahuella: '' });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => { setInputs(prev => ({ ...prev, [e.target.name]: e.target.value })); setResult(null); };

    const handleCalculate = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/calculadora/calculate', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('erp_token')}` },
                body: JSON.stringify({ type: 'escalera', inputs })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setResult(data.outputs);
            if (onSaveCalculation) onSaveCalculation('escalera', inputs, data.outputs);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    return (
        <div>
            <div className="calc-form">
                <div className="calc-field"><label>Altura m</label><input type="number" name="alturaTotal" value={inputs.alturaTotal} onChange={handleChange} placeholder="0" required /></div>
                <div className="calc-field"><label>Huella cm</label><input type="number" name="huella" value={inputs.huella} onChange={handleChange} placeholder="30" required /></div>
                <div className="calc-field"><label>Contrahuella cm</label><input type="number" name="contrahuella" value={inputs.contrahuella} onChange={handleChange} placeholder="18" required /></div>
            </div>
            <div className="calc-actions">
                <button className="btn btn-p" onClick={handleCalculate} disabled={loading}>{loading ? '...' : 'Calcular'}</button>
                <button className="btn btn-g" onClick={() => setInputs({ alturaTotal: '', huella: '', contrahuella: '' })}>Limpiar</button>
            </div>
            {result && (
                <div className="calc-result">
                    <div className="calc-result-header">Resultado</div>
                    <div className="calc-result-grid">
                        <div className="calc-result-item"><div className="calc-result-label">Escalones</div><div className="calc-result-value">{result.numEscalones}</div></div>
                        <div className="calc-result-item"><div className="calc-result-label">Longitud</div><div className="calc-result-value highlight">{result.longitudTotal} m</div></div>
                        <div className="calc-result-item"><div className="calc-result-label">Pendiente</div><div className="calc-result-value">{result.pendiente}°</div></div>
                    </div>
                </div>
            )}
        </div>
    );
}