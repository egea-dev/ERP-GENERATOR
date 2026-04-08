import React, { useState } from 'react';

export default function IluminacionCalculator({ onSaveCalculation }) {
    const [inputs, setInputs] = useState({ tipoHabitacion: 'salon', superficie: '' });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => { setInputs(prev => ({ ...prev, [e.target.name]: e.target.value })); setResult(null); };

    const handleCalculate = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/calculadora/calculate', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('erp_token')}` },
                body: JSON.stringify({ type: 'iluminacion', inputs })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setResult(data.outputs);
            if (onSaveCalculation) onSaveCalculation('iluminacion', inputs, data.outputs);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    return (
        <div>
            <div className="calc-form">
                <div className="calc-field">
                    <label>Habitación</label>
                    <select name="tipoHabitacion" value={inputs.tipoHabitacion} onChange={handleChange}>
                        <option value="salon">Salón</option><option value="dormitorio">Dormitorio</option>
                        <option value="cocina">Cocina</option><option value="bano">Baño</option>
                        <option value="oficina">Oficina</option><option value="pasillo">Pasillo</option>
                    </select>
                </div>
                <div className="calc-field"><label>m²</label><input type="number" name="superficie" value={inputs.superficie} onChange={handleChange} placeholder="0" required /></div>
            </div>
            <div className="calc-actions">
                <button className="btn btn-p" onClick={handleCalculate} disabled={loading}>{loading ? '...' : 'Calcular'}</button>
                <button className="btn btn-g" onClick={() => setInputs({ tipoHabitacion: 'salon', superficie: '' })}>Limpiar</button>
            </div>
            {result && (
                <div className="calc-result">
                    <div className="calc-result-header">Resultado</div>
                    <div className="calc-result-grid">
                        <div className="calc-result-item"><div className="calc-result-label">Lúmenes</div><div className="calc-result-value">{result.lumenesTotales}</div></div>
                        <div className="calc-result-item"><div className="calc-result-label">Watts LED</div><div className="calc-result-value highlight">{result.wattsLed}W</div></div>
                        <div className="calc-result-item"><div className="calc-result-label">Nota</div><div className="calc-result-value">{result.recomendacion}</div></div>
                    </div>
                </div>
            )}
        </div>
    );
}