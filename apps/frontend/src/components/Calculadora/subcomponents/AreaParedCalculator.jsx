import React, { useState } from 'react';

export default function AreaParedCalculator({ onSaveCalculation }) {
    const [inputs, setInputs] = useState({
        numParedes: '1',
        ancho: '',
        alto: '',
        numPuertas: '',
        anchoPuerta: '',
        altoPuerta: '',
        numVentanas: '',
        anchoVentana: '',
        altoVentana: ''
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
                    type: 'pared',
                    inputs
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error en el cálculo');
            }

            setResult(data.outputs);

            if (onSaveCalculation) {
                onSaveCalculation('pared', inputs, data.outputs);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <form onSubmit={(e) => { e.preventDefault(); handleCalculate(); }}>
                <div className="calc-form">
                    <div className="calc-field">
                        <label htmlFor="numParedes">Número de Paredes</label>
                        <select
                            id="numParedes"
                            name="numParedes"
                            value={inputs.numParedes}
                            onChange={handleChange}
                        >
                            {[1,2,3,4].map(n => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                    </div>

                    <div className="calc-field">
                        <label htmlFor="ancho">Ancho pared (m)</label>
                        <input
                            type="number"
                            id="ancho"
                            name="ancho"
                            value={inputs.ancho}
                            onChange={handleChange}
                            placeholder="Ej: 3.5"
                            min="0"
                            step="0.01"
                            required
                        />
                    </div>

                    <div className="calc-field">
                        <label htmlFor="alto">Alto pared (m)</label>
                        <input
                            type="number"
                            id="alto"
                            name="alto"
                            value={inputs.alto}
                            onChange={handleChange}
                            placeholder="Ej: 2.6"
                            min="0"
                            step="0.01"
                            required
                        />
                    </div>

                    <div style={{ borderTop: '1px solid #eee', paddingTop: '12px', marginTop: '12px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#666' }}>Puertas</div>
                    </div>

                    <div className="calc-field">
                        <label htmlFor="numPuertas">Número de Puertas</label>
                        <input
                            type="number"
                            id="numPuertas"
                            name="numPuertas"
                            value={inputs.numPuertas}
                            onChange={handleChange}
                            placeholder="Ej: 1"
                            min="0"
                            step="1"
                        />
                    </div>

                    {parseInt(inputs.numPuertas) > 0 && (
                        <>
                            <div className="calc-field">
                                <label htmlFor="anchoPuerta">Ancho puerta (m)</label>
                                <input
                                    type="number"
                                    id="anchoPuerta"
                                    name="anchoPuerta"
                                    value={inputs.anchoPuerta}
                                    onChange={handleChange}
                                    placeholder="Ej: 0.9"
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div className="calc-field">
                                <label htmlFor="altoPuerta">Alto puerta (m)</label>
                                <input
                                    type="number"
                                    id="altoPuerta"
                                    name="altoPuerta"
                                    value={inputs.altoPuerta}
                                    onChange={handleChange}
                                    placeholder="Ej: 2.1"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </>
                    )}

                    <div style={{ borderTop: '1px solid #eee', paddingTop: '12px', marginTop: '12px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#666' }}>Ventanas</div>
                    </div>

                    <div className="calc-field">
                        <label htmlFor="numVentanas">Número de Ventanas</label>
                        <input
                            type="number"
                            id="numVentanas"
                            name="numVentanas"
                            value={inputs.numVentanas}
                            onChange={handleChange}
                            placeholder="Ej: 2"
                            min="0"
                            step="1"
                        />
                    </div>

                    {parseInt(inputs.numVentanas) > 0 && (
                        <>
                            <div className="calc-field">
                                <label htmlFor="anchoVentana">Ancho ventana (m)</label>
                                <input
                                    type="number"
                                    id="anchoVentana"
                                    name="anchoVentana"
                                    value={inputs.anchoVentana}
                                    onChange={handleChange}
                                    placeholder="Ej: 1.2"
                                    min="0"
                                    step="0.01"
                                />
                            </div>

                            <div className="calc-field">
                                <label htmlFor="altoVentana">Alto ventana (m)</label>
                                <input
                                    type="number"
                                    id="altoVentana"
                                    name="altoVentana"
                                    value={inputs.altoVentana}
                                    onChange={handleChange}
                                    placeholder="Ej: 1.5"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </>
                    )}
                </div>

                <div className="calc-actions">
                    <button type="submit" className="btn btn-p" disabled={loading}>
                        {loading ? 'Calculando...' : 'Calcular'}
                    </button>
                    <button type="button" className="btn btn-g" onClick={() => setInputs({
                        numParedes: '1', ancho: '', alto: '', numPuertas: '', anchoPuerta: '', altoPuerta: '', numVentanas: '', anchoVentana: '', altoVentana: ''
                    })}>
                        Limpiar
                    </button>
                </div>
            </form>

            {result && (
                <div className="calc-result">
                    <div className="calc-result-header">
                        Resultado del Cálculo
                    </div>
                    <div className="calc-result-grid">
                        <div className="calc-result-item">
                            <div className="calc-result-label">Área Total Paredes</div>
                            <div className="calc-result-value">{result.areaTotalParedes} m²</div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Área Puertas</div>
                            <div className="calc-result-value">{result.areaPuertas} m²</div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Área Ventanas</div>
                            <div className="calc-result-value">{result.areaVentanas} m²</div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Área a Pintar</div>
                            <div className="calc-result-value highlight">{result.areaPintar} m²</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}