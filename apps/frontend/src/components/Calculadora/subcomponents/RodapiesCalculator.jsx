import React, { useState } from 'react';

export default function RodapiesCalculator({ onSaveCalculation }) {
    const [inputs, setInputs] = useState({
        largo: '',
        tipo: 'estandar',
        material: 'pvc'
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
                    type: 'rodapies',
                    inputs
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error en el cálculo');
            }
            
            setResult(data.outputs);
            
            if (onSaveCalculation) {
                onSaveCalculation('rodapies', inputs, data.outputs);
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
                        <label htmlFor="largo">Metros lineales totales</label>
                        <input
                            type="number"
                            id="largo"
                            name="largo"
                            value={inputs.largo}
                            onChange={handleChange}
                            placeholder="Ej: 50"
                            min="0"
                            step="0.01"
                            required
                        />
                    </div>
                    
                    <div className="calc-field">
                        <label htmlFor="tipo">Tipo de rodapié</label>
                        <select
                            id="tipo"
                            name="tipo"
                            value={inputs.tipo}
                            onChange={handleChange}
                        >
                            <option value="estandar">Estándar (7cm alto)</option>
                            <option value="premium">Premium (12cm alto)</option>
                            <option value="decorativo">Decorativo (perfil especial)</option>
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
                            <option value="pvc">PVC</option>
                            <option value="madera">Madera</option>
                            <option value="melamina">Melamina</option>
                            <option value="alum">Aluminio</option>
                        </select>
                    </div>
                </div>
                
                <div className="calc-actions">
                    <button type="submit" className="btn btn-p" disabled={loading}>
                        {loading ? 'Calculando...' : 'Calcular'}
                    </button>
                    <button type="button" className="btn btn-g" onClick={() => setInputs({ largo: '', tipo: 'estandar', material: 'pvc' })}>
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
                            <div className="calc-result-label">Metros lineales</div>
                            <div className="calc-result-value">
                                {result.metrosLineales} ml
                            </div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Tipo de rodapié</div>
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
                            <div className="calc-result-label">Piezas base necesarias</div>
                            <div className="calc-result-value">
                                {result.piezasBase} piezas
                            </div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Piezas de corte (10%)</div>
                            <div className="calc-result-value">
                                {result.piezasExtra} piezas
                            </div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Total piezas</div>
                            <div className="calc-result-value highlight">
                                {result.totalPiezas} piezas
                            </div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Precio por metro</div>
                            <div className="calc-result-value">
                                {result.precioMetro} €/ml
                            </div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Precio total</div>
                            <div className="calc-result-value">
                                {result.precioTotal} €
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
