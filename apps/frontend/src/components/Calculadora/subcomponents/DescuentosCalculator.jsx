import React, { useState } from 'react';

export default function DescuentosCalculator({ onSaveCalculation }) {
    const [inputs, setInputs] = useState({
        precio: '',
        dtoVolumen: '',
        dtoCliente: '',
        cantidad: '1'
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
                    type: 'descuentos',
                    inputs
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error en el cálculo');
            }
            
            setResult(data.outputs);
            
            if (onSaveCalculation) {
                onSaveCalculation('descuentos', inputs, data.outputs);
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
                        <label htmlFor="precio">Precio base unitario (€)</label>
                        <input
                            type="number"
                            id="precio"
                            name="precio"
                            value={inputs.precio}
                            onChange={handleChange}
                            placeholder="Ej: 25.50"
                            min="0"
                            step="0.01"
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
                            placeholder="Ej: 10 (si compra >50 uds)"
                            min="0"
                            max="50"
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
                            placeholder="Ej: 15 (cliente VIP)"
                            min="0"
                            max="50"
                            step="0.1"
                        />
                    </div>
                    
                    <div className="calc-field">
                        <label htmlFor="cantidad">Cantidad</label>
                        <input
                            type="number"
                            id="cantidad"
                            name="cantidad"
                            value={inputs.cantidad}
                            onChange={handleChange}
                            placeholder="Ej: 100"
                            min="1"
                            step="1"
                        />
                    </div>
                </div>
                
                <div className="calc-actions">
                    <button type="submit" className="btn btn-p" disabled={loading}>
                        {loading ? 'Calculando...' : 'Calcular'}
                    </button>
                    <button type="button" className="btn btn-g" onClick={() => setInputs({ precio: '', dtoVolumen: '', dtoCliente: '', cantidad: '1' })}>
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
                            <div className="calc-result-label">Precio base</div>
                            <div className="calc-result-value">
                                {result.precioBase} €/ud
                            </div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Dto. Volumen aplicado</div>
                            <div className="calc-result-value">
                                {result.dtoVolumenAplicado}%
                            </div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Dto. Cliente aplicado</div>
                            <div className="calc-result-value">
                                {result.dtoClienteAplicado}%
                            </div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Cantidad</div>
                            <div className="calc-result-value">
                                {result.cantidad} uds
                            </div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Precio unitario final</div>
                            <div className="calc-result-value">
                                {result.precioUnitario} €/ud
                            </div>
                        </div>
                        <div className="calc-result-item">
            <div className="calc-result-label">Precio total</div>
            <div className="calc-result-value highlight">
                {result.precioTotal} €
            </div>
        </div>
        <div className="calc-result-item">
            <div className="calc-result-label">Dto. Total aplicado</div>
            <div className="calc-result-value">
                {result.dtoTotalPorcentaje}%
            </div>
        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
