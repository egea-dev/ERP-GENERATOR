import React, { useState } from 'react';

export default function SueloCalculator({ onSaveCalculation }) {
    const [inputs, setInputs] = useState({ m2Habitacion: '', merma: '10', tipoSuelo: 'flotante' });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => { setInputs(prev => ({ ...prev, [e.target.name]: e.target.value })); setResult(null); };

    const handleCalculate = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/calculadora/calculate', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('erp_token')}` },
                body: JSON.stringify({ type: 'suelo', inputs })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setResult(data.outputs);
            if (onSaveCalculation) onSaveCalculation('suelo', inputs, data.outputs);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    return (
        <div>
            <div className="calc-form">
                <div className="calc-field"><label>m² habitación</label><input type="number" name="m2Habitacion" value={inputs.m2Habitacion} onChange={handleChange} placeholder="0" step="0.01" required /></div>
                <div className="calc-field"><label>Merma %</label><input type="number" name="merma" value={inputs.merma} onChange={handleChange} placeholder="10" step="0.1" /></div>
                <div className="calc-field">
                    <label>Tipo</label>
                    <select name="tipoSuelo" value={inputs.tipoSuelo} onChange={handleChange}>
                        <option value="flotante">Flotante</option><option value="madera">Madera</option><option value="vinilico">Vinílico</option>
                    </select>
                </div>
            </div>
            <div className="calc-actions">
                <button className="btn btn-p" onClick={handleCalculate} disabled={loading}>{loading ? '...' : 'Calcular'}</button>
                <button className="btn btn-g" onClick={() => setInputs({ m2Habitacion: '', merma: '10', tipoSuelo: 'flotante' })}>Limpiar</button>
            </div>
            {result && (
                <div className="calc-result">
                    <div className="calc-result-header">Resultado</div>
                    <div className="calc-result-grid">
                        <div className="calc-result-item"><div className="calc-result-label">Comprar</div><div className="calc-result-value highlight">{result.m2Comprar} m²</div></div>
                        <div className="calc-result-item"><div className="calc-result-label">Paquetes</div><div className="calc-result-value">{result.paquetesNecesarios}</div></div>
                        <div className="calc-result-item"><div className="calc-result-label">Merma</div><div className="calc-result-value">{result.mermaCantidad} m²</div></div>
                    </div>
                </div>
            )}
        </div>
    );
}