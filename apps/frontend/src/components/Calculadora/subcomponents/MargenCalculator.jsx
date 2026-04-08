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
            // Llamar al backend
            const response = await fetch('/api/calculadora/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('erp_token')}`
                },
                body: JSON.stringify({
                    type: 'margen',
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
                onSaveCalculation('margen', inputs, data.outputs);
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
                        <label htmlFor="coste">Coste Base (€)</label>
                        <input
                            type="number"
                            id="coste"
                            name="coste"
                            value={inputs.coste}
                            onChange={handleChange}
                            placeholder="Ej: 85.50"
                            min="0"
                            step="0.01"
                            required
                        />
                    </div>
                    
                    <div className="calc-field">
                        <label htmlFor="margen">Margen (%)</label>
                        <input
                            type="number"
                            id="margen"
                            name="margen"
                            value={inputs.margen}
                            onChange={handleChange}
                            placeholder="Ej: 20"
                            min="0"
                            max="500"
                            step="0.1"
                            required
                        />
                    </div>
                    
                    <div className="calc-field">
                        <label htmlFor="dtoVolumen">Dto. Volumen (%)</label>
                        <input
                            type="number"
                            id="dtoVolumen"
                            name="dtoVolumen"
                            value={inputs.dtoVolumen}
                            onChange={handleChange}
                            placeholder="Ej: 5 (si compra >10 uds)"
                            min="0"
                            max="100"
                            step="0.1"
                        />
                    </div>
                    
                    <div className="calc-field">
                        <label htmlFor="dtoCliente">Dto. Cliente (%)</label>
                        <input
                            type="number"
                            id="dtoCliente"
                            name="dtoCliente"
                            value={inputs.dtoCliente}
                            onChange={handleChange}
                            placeholder="Ej: 10 (cliente VIP)"
                            min="0"
                            max="100"
                            step="0.1"
                        />
                    </div>
                </div>
                
                <div className="calc-actions">
                    <button type="submit" className="btn btn-p" disabled={loading}>
                        {loading ? 'Calculando...' : 'Calcular'}
                    </button>
                    <button type="button" className="btn btn-g" onClick={() => setInputs({ coste: '', margen: '', dtoVolumen: '', dtoCliente: '' })}>
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
                            <div className="calc-result-label">Coste Base</div>
                            <div className="calc-result-value">{result.costeBase !== undefined ? `${result.costeBase} €` : '-'}</div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Precio Base</div>
                            <div className="calc-result-value">{result.precioBase !== undefined ? `${result.precioBase} €` : '-'}</div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Precio Venta</div>
                            <div className="calc-result-value highlight">{result.precioVenta !== undefined ? `${result.precioVenta} €` : '-'}</div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Beneficio</div>
                            <div className="calc-result-value">{result.beneficio !== undefined ? `${result.beneficio} €` : '-'}</div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Dto. Aplicado</div>
                            <div className="calc-result-value">{result.dtoAplicado !== undefined ? `${result.dtoAplicado}%` : '-'}</div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Dto. Total</div>
                            <div className="calc-result-value">{result.dtoTotalPorcentaje !== undefined ? `${result.dtoTotalPorcentaje}%` : '-'}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
