import React, { useState } from 'react';

export default function ConversorMedidas({ onSaveCalculation }) {
    const [inputs, setInputs] = useState({
        valor: '',
        tipoConversion: 'cm_pulg'
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
            // Llamar al backend
            const response = await fetch('/api/calculadora/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('erp_token')}`
                },
                body: JSON.stringify({
                    type: 'medidas',
                    inputs
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error en el cálculo');
            }

            setResult(data.outputs);

            // Guardar en historial
            if (onSaveCalculation) {
                onSaveCalculation('medidas', inputs, data.outputs);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const conversionTypes = [
        { value: 'cm_pulg', label: 'cm → pulgadas' },
        { value: 'pulg_cm', label: 'pulgadas → cm' },
        { value: 'cm_mm', label: 'cm → mm' },
        { value: 'mm_cm', label: 'mm → cm' },
        { value: 'm_cm', label: 'm → cm' },
        { value: 'cm_m', label: 'cm → m' },
        { value: 'm_mm', label: 'm → mm' },
        { value: 'mm_m', label: 'mm → m' }
    ];

    return (
        <div>
            <div className="calc-form">
                <div className="calc-field">
                    <label htmlFor="valor">Valor a Convertir</label>
                    <input
                        type="number"
                        id="valor"
                        name="valor"
                        value={inputs.valor}
                        onChange={handleChange}
                        placeholder="Ej: 10.5"
                        min="0"
                        step="0.001"
                        required
                    />
                </div>

                <div className="calc-field">
                    <label htmlFor="tipoConversion">Tipo de Conversión</label>
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
            </div>

            <div className="calc-actions">
                <button type="button" className="btn btn-p" onClick={handleCalculate} disabled={loading}>
                    {loading ? 'Convirtiendo...' : 'Convertir'}
                </button>
                <button type="button" className="btn btn-g" onClick={() => {
                    setInputs({ valor: '', tipoConversion: 'cm_pulg' });
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
                            <div className="calc-result-label">Valor Original</div>
                            <div className="calc-result-value">{result.valorOriginal !== undefined ? `${result.valorOriginal}` : '-'}</div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Valor Convertido</div>
                            <div className="calc-result-value highlight">{result.valorConvertido !== undefined ? `${result.valorConvertido}` : '-'}</div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Unidad Original</div>
                            <div className="calc-result-value">{result.unidadOriginal}</div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Unidad Convertida</div>
                            <div className="calc-result-value">{result.unidadConvertida}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}