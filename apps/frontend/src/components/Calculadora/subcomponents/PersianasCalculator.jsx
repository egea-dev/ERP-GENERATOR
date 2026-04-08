import React, { useState } from 'react';

export default function PersianasCalculator({ onSaveCalculation }) {
    const [inputs, setInputs] = useState({
        ancho: '',
        alto: '',
        tipo: 'enrollable',
        material: 'aluminio'
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
                    type: 'persianas',
                    inputs
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error en el cálculo');
            }
            
            setResult(data.outputs);
            
            if (onSaveCalculation) {
                onSaveCalculation('persianas', inputs, data.outputs);
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
                        <label htmlFor="ancho">Ancho de la ventana (cm)</label>
                        <input
                            type="number"
                            id="ancho"
                            name="ancho"
                            value={inputs.ancho}
                            onChange={handleChange}
                            placeholder="Ej: 120"
                            min="0"
                            step="0.1"
                            required
                        />
                    </div>
                    
                    <div className="calc-field">
                        <label htmlFor="alto">Alto de la ventana (cm)</label>
                        <input
                            type="number"
                            id="alto"
                            name="alto"
                            value={inputs.alto}
                            onChange={handleChange}
                            placeholder="Ej: 150"
                            min="0"
                            step="0.1"
                            required
                        />
                    </div>
                    
                    <div className="calc-field">
                        <label htmlFor="tipo">Tipo de persiana</label>
                        <select
                            id="tipo"
                            name="tipo"
                            value={inputs.tipo}
                            onChange={handleChange}
                        >
                            <option value="enrollable">Enrollable</option>
                            <option value="venciana">Venciana</option>
                            <option value="vertical">Vertical</option>
                            <option value="veneciana">Veneciana</option>
                        </select>
                    </div>
                    
                    <div className="calc-field">
                        <label htmlFor="material">Material</label>
                        <select
                            id="material"
                            name="material"
                            value={inputs.material}
                            onChange={handleChange}
                        >
                            <option value="aluminio">Aluminio</option>
                            <option value="pvc">PVC</option>
                            <option value="madera">Madera</option>
                            <option value="tela">Tela (screen)</option>
                        </select>
                    </div>
                </div>
                
                <div className="calc-actions">
                    <button type="submit" className="btn btn-p" disabled={loading}>
                        {loading ? 'Calculando...' : 'Calcular'}
                    </button>
                    <button type="button" className="btn btn-g" onClick={() => setInputs({ ancho: '', alto: '', tipo: 'enrollable', material: 'aluminio' })}>
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
                                {result.ancho} cm
                            </div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Alto ventana</div>
                            <div className="calc-result-value">
                                {result.alto} cm
                            </div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Tipo</div>
                            <div className="calc-result-value">
                                {result.tipo}
                            </div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Material</div>
                            <div className="calc-result-value">
                                {result.material}
                            </div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Superficie</div>
                            <div className="calc-result-value">
                                {result.superficie} m²
                            </div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Precio base</div>
                            <div className="calc-result-value">
                                {result.precioBase} €/m²
                            </div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Precio estimado</div>
                            <div className="calc-result-value highlight">
                                {result.precioEstimado} €
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
