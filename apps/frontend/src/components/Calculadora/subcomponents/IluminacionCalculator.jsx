import React, { useState } from 'react';

export default function IluminacionCalculator({ onSaveCalculation }) {
    const [inputs, setInputs] = useState({
        tipoHabitacion: 'salon',
        superficie: ''
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
                    type: 'iluminacion',
                    inputs
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error en el cálculo');
            }

            setResult(data.outputs);

            if (onSaveCalculation) {
                onSaveCalculation('iluminacion', inputs, data.outputs);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const tiposHabitacion = [
        { value: 'salon', label: 'Salón', lux: 300 },
        { value: 'dormitorio', label: 'Dormitorio', lux: 150 },
        { value: 'cocina', label: 'Cocina', lux: 500 },
        { value: 'bano', label: 'Baño', lux: 400 },
        { value: 'oficina', label: 'Oficina', lux: 500 },
        { value: 'pasillo', label: 'Pasillo', lux: 100 },
        { value: 'terraza', label: 'Terraza', lux: 200 }
    ];

    return (
        <div>
            <form onSubmit={(e) => { e.preventDefault(); handleCalculate(); }}>
                <div className="calc-form">
                    <div className="calc-field">
                        <label htmlFor="tipoHabitacion">Tipo de Habitación</label>
                        <select
                            id="tipoHabitacion"
                            name="tipoHabitacion"
                            value={inputs.tipoHabitacion}
                            onChange={handleChange}
                            required
                        >
                            {tiposHabitacion.map(tipo => (
                                <option key={tipo.value} value={tipo.value}>
                                    {tipo.label} ({tipo.lux} lux)
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="calc-field">
                        <label htmlFor="superficie">Superficie (m²)</label>
                        <input
                            type="number"
                            id="superficie"
                            name="superficie"
                            value={inputs.superficie}
                            onChange={handleChange}
                            placeholder="Ej: 20"
                            min="0"
                            step="0.1"
                            required
                        />
                    </div>
                </div>

                <div className="calc-actions">
                    <button type="submit" className="btn btn-p" disabled={loading}>
                        {loading ? 'Calculando...' : 'Calcular'}
                    </button>
                    <button type="button" className="btn btn-g" onClick={() => setInputs({ tipoHabitacion: 'salon', superficie: '' })}>
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
                            <div className="calc-result-label">Habitación</div>
                            <div className="calc-result-value">{result.tipoHabitacion}</div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Superficie</div>
                            <div className="calc-result-value">{result.superficie} m²</div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Nivel Luminoso</div>
                            <div className="calc-result-value">{result.luxNecesarios} lux</div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Lúmenes Totales</div>
                            <div className="calc-result-value">{result.lumenesTotales} lm</div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Watts LED</div>
                            <div className="calc-result-value highlight">{result.wattsLed} W</div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Recomendación</div>
                            <div className="calc-result-value">{result.recomendacion}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}