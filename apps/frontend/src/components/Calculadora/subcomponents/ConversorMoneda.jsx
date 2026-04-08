import React, { useState } from 'react';

export default function ConversorMoneda({ onSaveCalculation }) {
    const [inputs, setInputs] = useState({
        valor: '',
        tipoConversion: 'eur_usd',
        tipoCambio: ''
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
                body: JSON.stringify({
                    type: 'moneda',
                    inputs
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error en el cálculo');
            }

            setResult(data.outputs);

            if (onSaveCalculation) {
                onSaveCalculation('moneda', inputs, data.outputs);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const conversionTypes = [
        { value: 'eur_usd', label: 'EUR → USD' },
        { value: 'usd_eur', label: 'USD → EUR' }
    ];

    return (
        <div>
            <div className="calc-form">
                <div className="calc-field">
                    <label htmlFor="valor">Cantidad</label>
                    <input
                        type="number"
                        id="valor"
                        name="valor"
                        value={inputs.valor}
                        onChange={handleChange}
                        placeholder="Ej: 100"
                        min="0"
                        step="0.01"
                        required
                    />
                </div>

                <div className="calc-field">
                    <label htmlFor="tipoConversion">Conversión</label>
                    <select
                        id="tipoConversion"
                        name="tipoConversion"
                        value={inputs.tipoConversion}
                        onChange={handleChange}
                        required
                    >
                        {conversionTypes.map(tipo => (
                            <option key={tipo.value} value={tipo.value}>
                                {tipo.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="calc-field">
                    <label htmlFor="tipoCambio">Tipo de Cambio</label>
                    <input
                        type="number"
                        id="tipoCambio"
                        name="tipoCambio"
                        value={inputs.tipoCambio}
                        onChange={handleChange}
                        placeholder="Ej: 1.10"
                        min="0"
                        step="0.0001"
                        required
                    />
                </div>
            </div>

            <div className="calc-actions">
                <button type="button" className="btn btn-p" onClick={handleCalculate} disabled={loading}>
                    {loading ? 'Convirtiendo...' : 'Convertir'}
                </button>
                <button type="button" className="btn btn-g" onClick={() => {
                    setInputs({ valor: '', tipoConversion: 'eur_usd', tipoCambio: '' });
                    setResult(null);
                }}>
                    Limpiar
                </button>
            </div>

            {result && (
                <div className="calc-result">
                    <div className="calc-result-header">
                        Resultado de la Conversión
                    </div>
                    <div className="calc-result-grid">
                        <div className="calc-result-item">
                            <div className="calc-result-label">Cantidad Original</div>
                            <div className="calc-result-value">{result.valorOriginal}</div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Cantidad Convertida</div>
                            <div className="calc-result-value highlight">{result.valorConvertido}</div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Tipo de Cambio</div>
                            <div className="calc-result-value">{result.tipoCambio}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}