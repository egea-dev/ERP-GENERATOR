import React, { useState } from 'react';

export default function MargenCalculator({ onSaveCalculation }) {
    const [inputs, setInputs] = useState({
        coste: '',
        margen: '',
        dtoVolumen: '',
        dtoCliente: ''
    });

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setInputs(prev => ({ ...prev, [name]: value }));
        setResult(null);
        setError(null);
    };

    const handleCalculate = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/calculadora/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('erp_token')}`
                },
                body: JSON.stringify({ type: 'margen', inputs })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Error');

            setResult(data.outputs);
            if (onSaveCalculation) onSaveCalculation('margen', inputs, data.outputs);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="calc-form">
                <div className="calc-field">
                    <label>Coste €</label>
                    <input type="number" name="coste" value={inputs.coste} onChange={handleChange} placeholder="0.00" step="0.01" required />
                </div>
                <div className="calc-field">
                    <label>Margen %</label>
                    <input type="number" name="margen" value={inputs.margen} onChange={handleChange} placeholder="0" step="0.1" required />
                </div>
                <div className="calc-field">
                    <label>Dto. Vol %</label>
                    <input type="number" name="dtoVolumen" value={inputs.dtoVolumen} onChange={handleChange} placeholder="0" step="0.1" />
                </div>
                <div className="calc-field">
                    <label>Dto. Cliente %</label>
                    <input type="number" name="dtoCliente" value={inputs.dtoCliente} onChange={handleChange} placeholder="0" step="0.1" />
                </div>
            </div>

            <div className="calc-actions">
                <button className="btn btn-p" onClick={handleCalculate} disabled={loading}>{loading ? '...' : 'Calcular'}</button>
                <button className="btn btn-g" onClick={() => setInputs({ coste: '', margen: '', dtoVolumen: '', dtoCliente: '' })}>Limpiar</button>
            </div>

            {result && (
                <div className="calc-result">
                    <div className="calc-result-header">Resultado</div>
                    <div className="calc-result-grid">
                        <div className="calc-result-item">
                            <div className="calc-result-label">Coste</div>
                            <div className="calc-result-value">{result.costeBase}€</div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">PVP</div>
                            <div className="calc-result-value highlight">{result.precioVenta}€</div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Beneficio</div>
                            <div className="calc-result-value">{result.beneficio}€</div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Dto Total</div>
                            <div className="calc-result-value">{result.dtoTotalPorcentaje}%</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}