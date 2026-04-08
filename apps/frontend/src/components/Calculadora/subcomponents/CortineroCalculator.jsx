import React, { useState } from 'react';

export default function CortineroCalculator({ onSaveCalculation }) {
    const [inputs, setInputs] = useState({
        ancho: '',
        caida: '',
        pliegues: '2.5',
        costuras: '',
        tipoMedida: 'cm'
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
                    type: 'cortinero',
                    inputs
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error en el cálculo');
            }
            
            setResult(data.outputs);
            
            if (onSaveCalculation) {
                onSaveCalculation('cortinero', inputs, data.outputs);
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
                        <label htmlFor="ancho">Ancho de la ventana</label>
                        <input
                            type="number"
                            id="ancho"
                            name="ancho"
                            value={inputs.ancho}
                            onChange={handleChange}
                            placeholder="Ej: 150"
                            min="0"
                            step="0.1"
                            required
                        />
                    </div>
                    
                    <div className="calc-field">
                        <label htmlFor="caida">Caida de la cortina</label>
                        <input
                            type="number"
                            id="caida"
                            name="caida"
                            value={inputs.caida}
                            onChange={handleChange}
                            placeholder="Ej: 250"
                            min="0"
                            step="0.1"
                            required
                        />
                    </div>
                    
                    <div className="calc-field">
                        <label htmlFor="pliegues">Tipo de pliegue</label>
                        <select
                            id="pliegues"
                            name="pliegues"
                            value={inputs.pliegues}
                            onChange={handleChange}
                        >
                            <option value="2">2x (ondulado sencillo)</option>
                            <option value="2.5">2.5x (recomendado)</option>
                            <option value="3">3x (pliegue francés)</option>
                            <option value="1.5">1.5x (ondulado mínimo)</option>
                        </select>
                    </div>
                    
                    <div className="calc-field">
                        <label htmlFor="tipoMedida">Unidad de medida</label>
                        <select
                            id="tipoMedida"
                            name="tipoMedida"
                            value={inputs.tipoMedida}
                            onChange={handleChange}
                        >
                            <option value="cm">Centímetros (cm)</option>
                            <option value="m">Metros (m)</option>
                        </select>
                    </div>
                    
                    <div className="calc-field">
                        <label htmlFor="costuras">Número de costuras (opcional)</label>
                        <input
                            type="number"
                            id="costuras"
                            name="costuras"
                            value={inputs.costuras}
                            onChange={handleChange}
                            placeholder="Ej: 3 (se calcula automáticamente)"
                            min="0"
                            step="1"
                        />
                    </div>
                </div>
                
                <div className="calc-actions">
                    <button type="submit" className="btn btn-p" disabled={loading}>
                        {loading ? 'Calculando...' : 'Calcular'}
                    </button>
                    <button type="button" className="btn btn-g" onClick={() => setInputs({ ancho: '', caida: '', pliegues: '2.5', costuras: '', tipoMedida: 'cm' })}>
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
                            <div className="calc-result-label">Ancho ventana</div>
                            <div className="calc-result-value">
                                {result.anchoOriginal} {result.tipoMedida}
                            </div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Caida</div>
                            <div className="calc-result-value">
                                {result.metrosCaida} m
                            </div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Pliegues</div>
                            <div className="calc-result-value">{result.pliegues}x</div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Tela necesaria</div>
                            <div className="calc-result-value highlight">
                                {result.metrosTela} m
                            </div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Costuras necesarias</div>
                            <div className="calc-result-value">
                                {result.costuras}
                            </div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Recomendación</div>
                            <div className="calc-result-value">
                                {result.recomendacion}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
