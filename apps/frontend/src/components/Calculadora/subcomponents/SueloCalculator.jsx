import React, { useState } from 'react';

export default function SueloCalculator({ onSaveCalculation }) {
    const [inputs, setInputs] = useState({
        m2Habitacion: '',
        merma: '',
        tipoSuelo: 'flotante'
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
                    type: 'suelo',
                    inputs
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error en el cálculo');
            }
            
            setResult(data.outputs);
            
            if (onSaveCalculation) {
                onSaveCalculation('suelo', inputs, data.outputs);
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
                        <label htmlFor="m2Habitacion">Superficie habitación (m²)</label>
                        <input
                            type="number"
                            id="m2Habitacion"
                            name="m2Habitacion"
                            value={inputs.m2Habitacion}
                            onChange={handleChange}
                            placeholder="Ej: 20"
                            min="0"
                            step="0.01"
                            required
                        />
                    </div>
                    
                    <div className="calc-field">
                        <label htmlFor="merma">Merma por corte (%)</label>
                        <input
                            type="number"
                            id="merma"
                            name="merma"
                            value={inputs.merma}
                            onChange={handleChange}
                            placeholder="Ej: 10"
                            min="0"
                            max="30"
                            step="0.1"
                        />
                    </div>
                    
                    <div className="calc-field">
                        <label htmlFor="tipoSuelo">Tipo de suelo</label>
                        <select
                            id="tipoSuelo"
                            name="tipoSuelo"
                            value={inputs.tipoSuelo}
                            onChange={handleChange}
                        >
                            <option value="flotante">Flotante / Laminado</option>
                            <option value="madera">Madera maciza</option>
                            <option value="vinilico">Vinílico / PVC</option>
                            <option value="ceramica">Cerámica / Porcelanato</option>
                            <option value="marmol">Mármol / Piedra natural</option>
                        </select>
                    </div>
                </div>
                
                <div className="calc-actions">
                    <button type="submit" className="btn btn-p" disabled={loading}>
                        {loading ? 'Calculando...' : 'Calcular'}
                    </button>
                    <button type="button" className="btn btn-g" onClick={() => setInputs({ m2Habitacion: '', merma: '', tipoSuelo: 'flotante' })}>
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
                            <div className="calc-result-label">Superficie habitación</div>
                            <div className="calc-result-value">
                                {result.m2Habitacion} m²
                            </div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Merma por corte</div>
                            <div className="calc-result-value">
                                {result.mermaCantidad} m² ({result.mermaPorcentaje}%)
                            </div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Total a comprar</div>
                            <div className="calc-result-value highlight">
                                {result.m2Comprar} m²
                            </div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Tipo de suelo</div>
                            <div className="calc-result-value">
                                {result.tipoSuelo}
                            </div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Paquetes necesarios</div>
                            <div className="calc-result-value">
                                {result.paquetesNecesarios} paquetes
                            </div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">m² por paquete</div>
                            <div className="calc-result-value">
                                {result.m2PorPaquete} m²
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
