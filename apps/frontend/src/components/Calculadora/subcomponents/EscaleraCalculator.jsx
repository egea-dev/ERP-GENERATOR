import React, { useState } from 'react';

export default function EscaleraCalculator({ onSaveCalculation }) {
    const [inputs, setInputs] = useState({
        alturaTotal: '',
        huella: '',
        contrahuella: ''
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
                    type: 'escalera',
                    inputs
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error en el cálculo');
            }

            setResult(data.outputs);

            if (onSaveCalculation) {
                onSaveCalculation('escalera', inputs, data.outputs);
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
                        <label htmlFor="alturaTotal">Altura Total a salvar (m)</label>
                        <input
                            type="number"
                            id="alturaTotal"
                            name="alturaTotal"
                            value={inputs.alturaTotal}
                            onChange={handleChange}
                            placeholder="Ej: 3.0"
                            min="0"
                            step="0.01"
                            required
                        />
                    </div>

                    <div className="calc-field">
                        <label htmlFor="huella">Huella (profundidad del peldaño, cm)</label>
                        <input
                            type="number"
                            id="huella"
                            name="huella"
                            value={inputs.huella}
                            onChange={handleChange}
                            placeholder="Ej: 30"
                            min="1"
                            step="0.5"
                            required
                        />
                    </div>

                    <div className="calc-field">
                        <label htmlFor="contrahuella">Contrahuella (altura del peldaño, cm)</label>
                        <input
                            type="number"
                            id="contrahuella"
                            name="contrahuella"
                            value={inputs.contrahuella}
                            onChange={handleChange}
                            placeholder="Ej: 18"
                            min="1"
                            step="0.5"
                            required
                        />
                    </div>
                </div>

                <div className="calc-actions">
                    <button type="submit" className="btn btn-p" disabled={loading}>
                        {loading ? 'Calculando...' : 'Calcular'}
                    </button>
                    <button type="button" className="btn btn-g" onClick={() => setInputs({ alturaTotal: '', huella: '', contrahuella: '' })}>
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
                            <div className="calc-result-label">Número de Escalones</div>
                            <div className="calc-result-value">{result.numEscalones}</div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Altura Real/Escalón</div>
                            <div className="calc-result-value">{result.alturaRealEscalon} cm</div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Longitud Total</div>
                            <div className="calc-result-value highlight">{result.longitudTotal} m</div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Pendiente</div>
                            <div className="calc-result-value">{result.pendiente}°</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}