import React, { useState } from 'react';

export default function CantidadCalculator({ onSaveCalculation }) {
    const [inputs, setInputs] = useState({
        ancho: '',
        alto: '',
        merma: '',
        tipoMedida: 'm'
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
                    type: 'cantidad',
                    inputs
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error en el cálculo');
            }
            
            setResult(data.outputs);
            
            if (onSaveCalculation) {
                onSaveCalculation('cantidad', inputs, data.outputs);
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
                        <label htmlFor="ancho">Ancho</label>
                        <input
                            type="number"
                            id="ancho"
                            name="ancho"
                            value={inputs.ancho}
                            onChange={handleChange}
                            placeholder="Ej: 5"
                            min="0"
                            step="0.01"
                            required
                        />
                    </div>
                    
                    <div className="calc-field">
                        <label htmlFor="alto">Alto</label>
                        <input
                            type="number"
                            id="alto"
                            name="alto"
                            value={inputs.alto}
                            onChange={handleChange}
                            placeholder="Ej: 3"
                            min="0"
                            step="0.01"
                            required
                        />
                    </div>
                    
                    <div className="calc-field">
                        <label htmlFor="tipoMedida">Unidad de medida</label>
                        <select
                            id="tipoMedida"
                            name="tipoMedida"
                            value={inputs.tipoMedida}
                            onChange={handleChange}
                        >
                            <option value="m">Metros (m)</option>
                            <option value="cm">Centímetros (cm)</option>
                            <option value="mm">Milímetros (mm)</option>
                        </select>
                    </div>
                    
                    <div className="calc-field">
                        <label htmlFor="merma">Merma (%)</label>
                        <input
                            type="number"
                            id="merma"
                            name="merma"
                            value={inputs.merma}
                            onChange={handleChange}
                            placeholder="Ej: 10"
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
                    <button type="button" className="btn btn-g" onClick={() => setInputs({ ancho: '', alto: '', merma: '', tipoMedida: 'm' })}>
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
                            <div className="calc-result-label">Ancho</div>
                            <div className="calc-result-value">
                                {result.anchoOriginal} {result.tipoMedida}
                            </div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Alto</div>
                            <div className="calc-result-value">
                                {result.altoOriginal} {result.tipoMedida}
                            </div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Superficie neta</div>
                            <div className="calc-result-value">
                                {result.superficie} {result.unidad === 'm²' ? 'm²' : result.unidad === 'cm²' ? 'cm²' : 'mm²'}
                            </div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Merma</div>
                            <div className="calc-result-value">
                                {result.mermaCantidad} {result.unidad === 'm²' ? 'm²' : result.unidad === 'cm²' ? 'cm²' : 'mm²'} 
                                ({result.mermaPorcentaje}%)
                            </div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Cantidad total</div>
                            <div className="calc-result-value highlight">
                                {result.cantidadTotal} {result.unidad}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
