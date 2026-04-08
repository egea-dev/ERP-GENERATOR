import React, { useState } from 'react';

export default function DescuentosCalculator({ onSaveCalculation }) {
    const [inputs, setInputs] = useState({ precio: '', dtoVolumen: '', dtoCliente: '', cantidad: '1' });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => { setInputs(prev => ({ ...prev, [e.target.name]: e.target.value })); setResult(null); };

    const handleCalculate = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/calculadora/calculate', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('erp_token')}` },
                body: JSON.stringify({ type: 'descuentos', inputs })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setResult(data.outputs);
            if (onSaveCalculation) onSaveCalculation('descuentos', inputs, data.outputs);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    return (
        <div>
            <div className="calc-form">
                <div className="calc-field"><label>Precio €</label><input type="number" name="precio" value={inputs.precio} onChange={handleChange} placeholder="0" step="0.01" required /></div>
                <div className="calc-field"><label>Dto Vol %</label><input type="number" name="dtoVolumen" value={inputs.dtoVolumen} onChange={handleChange} placeholder="0" step="0.1" /></div>
                <div className="calc-field"><label>Dto Cliente %</label><input type="number" name="dtoCliente" value={inputs.dtoCliente} onChange={handleChange} placeholder="0" step="0.1" /></div>
                <div className="calc-field"><label>Cantidad</label><input type="number" name="cantidad" value={inputs.cantidad} onChange={handleChange} placeholder="1" /></div>
            </div>
            <div className="calc-actions">
                <button className="btn btn-p" onClick={handleCalculate} disabled={loading}>{loading ? '...' : 'Calcular'}</button>
                <button className="btn btn-g" onClick={() => setInputs({ precio: '', dtoVolumen: '', dtoCliente: '', cantidad: '1' })}>Limpiar</button>
            </div>
            {result && (
                <div className="calc-result">
                    <div className="calc-result-header">Resultado</div>
                    <div className="calc-result-grid">
                        <div className="calc-result-item"><div className="calc-result-label">Dto Total</div><div className="calc-result-value">{result.dtoTotalPorcentaje}%</div></div>
                        <div className="calc-result-item"><div className="calc-result-label">Unitario</div><div className="calc-result-value">{result.precioUnitario}€</div></div>
                        <div className="calc-result-item"><div className="calc-result-label">Total</div><div className="calc-result-value highlight">{result.precioTotal}€</div></div>
                    </div>
                </div>
            )}
        </div>
    );
}