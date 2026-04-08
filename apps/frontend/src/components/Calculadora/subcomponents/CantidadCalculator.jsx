import React, { useState } from 'react';

export default function CantidadCalculator({ onSaveCalculation }) {
    const [inputs, setInputs] = useState({ ancho: '', alto: '', merma: '', tipoMedida: 'm' });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setInputs(prev => ({ ...prev, [name]: value }));
        setResult(null);
    };

    const handleCalculate = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/calculadora/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('erp_token')}` },
                body: JSON.stringify({ type: 'cantidad', inputs })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setResult(data.outputs);
            if (onSaveCalculation) onSaveCalculation('cantidad', inputs, data.outputs);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    return (
        <div>
            <div className="calc-form">
                <div className="calc-field"><label>Ancho</label><input type="number" name="ancho" value={inputs.ancho} onChange={handleChange} placeholder="0" step="0.01" required /></div>
                <div className="calc-field"><label>Alto</label><input type="number" name="alto" value={inputs.alto} onChange={handleChange} placeholder="0" step="0.01" required /></div>
                <div className="calc-field">
                    <label>Unidad</label>
                    <select name="tipoMedida" value={inputs.tipoMedida} onChange={handleChange}>
                        <option value="m">Metros</option>
                        <option value="cm">Centímetros</option>
                        <option value="mm">Milímetros</option>
                    </select>
                </div>
                <div className="calc-field"><label>Merma %</label><input type="number" name="merma" value={inputs.merma} onChange={handleChange} placeholder="10" step="0.1" /></div>
            </div>
            <div className="calc-actions">
                <button className="btn btn-p" onClick={handleCalculate} disabled={loading}>{loading ? '...' : 'Calcular'}</button>
                <button className="btn btn-g" onClick={() => setInputs({ ancho: '', alto: '', merma: '', tipoMedida: 'm' })}>Limpiar</button>
            </div>
            {result && (
                <div className="calc-result">
                    <div className="calc-result-header">Resultado</div>
                    <div className="calc-result-grid">
                        <div className="calc-result-item"><div className="calc-result-label">Superficie</div><div className="calc-result-value">{result.superficie} {result.unidad}</div></div>
                        <div className="calc-result-item"><div className="calc-result-label">Merma</div><div className="calc-result-value">{result.mermaCantidad} {result.unidad}</div></div>
                        <div className="calc-result-item"><div className="calc-result-label">Total</div><div className="calc-result-value highlight">{result.cantidadTotal} {result.unidad}</div></div>
                    </div>
                </div>
            )}
        </div>
    );
}