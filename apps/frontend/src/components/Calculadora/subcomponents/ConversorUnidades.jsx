import React, { useState } from 'react';

export default function ConversorUnidades({ onSaveCalculation }) {
    const [inputs, setInputs] = useState({
        valor: '',
        tipoConversion: 'm2_ml',
        anchoLinear: ''
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
                    type: 'unidades',
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
                onSaveCalculation('unidades', inputs, data.outputs);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const conversionTypes = [
        { value: 'm2_ml', label: 'm² → ml (ancho linear)' },
        { value: 'ml_m2', label: 'ml → m² (ancho linear)' },
        { value: 'kguds', label: 'kg → unidades (peso/uds)' },
        { value: 'uds_kg', label: 'uds → kg (peso/uds)' },
        { value: 'rollos_m2', label: 'rollos → m² (ancho del rollo)' },
        { value: 'm2_rollos', label: 'm² → rollos (ancho del rollo)' }
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

                {['m2_ml', 'ml_m2', 'rollos_m2', 'm2_rollos'].includes(inputs.tipoConversion) && (
                    <div className="calc-field">
                        <label htmlFor="anchoLinear">Ancho (m)</label>
                        <input
                            type="number"
                            id="anchoLinear"
                            name="anchoLinear"
                            value={inputs.anchoLinear}
                            onChange={handleChange}
                            placeholder="Ej: 1.4 (ancho del tejedo/rollo)"
                            min="0"
                            step="0.01"
                            required
                        />
                    </div>
                )}

                {['kguds', 'uds_kg'].includes(inputs.tipoConversion) && (
                    <div className="calc-field">
                        <label htmlFor="anchoLinear">Peso/uds (kg)</label>
                        <input
                            type="number"
                            id="anchoLinear"
                            name="anchoLinear"
                            value={inputs.anchoLinear}
                            onChange={handleChange}
                            placeholder="Ej: 0.5 (peso unitario)"
                            min="0"
                            step="0.001"
                            required
                        />
                    </div>
                )}
            </div>

            <div className="calc-actions">
                <button type="button" className="btn btn-p" onClick={handleCalculate} disabled={loading}>
                    {loading ? 'Convirtiendo...' : 'Convertir'}
                </button>
                <button type="button" className="btn btn-g" onClick={() => {
                    setInputs({ valor: '', tipoConversion: 'm2_ml', anchoLinear: '' });
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
                        {result.detalles && (
                            <div className="calc-result-item">
                                <div className="calc-result-label">Detalles</div>
                                <div className="calc-result-value">{result.detalles}</div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}