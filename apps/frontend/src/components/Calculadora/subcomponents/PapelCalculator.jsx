import React, { useState } from 'react';

export default function PapelCalculator({ onSaveCalculation }) {
    const [inputs, setInputs] = useState({
        altoPared: '',
        anchoPared: '',
        puertas: '0',
        ventanas: '0',
        merma: '15',
        altoRollo: '10',
        anchoRollo: '0.53'
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
                    type: 'papel',
                    inputs
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error en el cálculo');
            }
            
            setResult(data.outputs);
            
            if (onSaveCalculation) {
                onSaveCalculation('papel', inputs, data.outputs);
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
                        <label htmlFor="altoPared">Alto de la pared (cm)</label>
                        <input
                            type="number"
                            id="altoPared"
                            name="altoPared"
                            value={inputs.altoPared}
                            onChange={handleChange}
                            placeholder="Ej: 250"
                            min="0"
                            step="0.1"
                            required
                        />
                    </div>
                    
                    <div className="calc-field">
                        <label htmlFor="anchoPared">Ancho de la pared (cm)</label>
                        <input
                            type="number"
                            id="anchoPared"
                            name="anchoPared"
                            value={inputs.anchoPared}
                            onChange={handleChange}
                            placeholder="Ej: 400"
                            min="0"
                            step="0.1"
                            required
                        />
                    </div>
                    
                    <div className="calc-field">
                        <label htmlFor="puertas">Número de puertas</label>
                        <input
                            type="number"
                            id="puertas"
                            name="puertas"
                            value={inputs.puertas}
                            onChange={handleChange}
                            placeholder="Ej: 1"
                            min="0"
                            step="1"
                        />
                    </div>
                    
                    <div className="calc-field">
                        <label htmlFor="ventanas">Número de ventanas</label>
                        <input
                            type="number"
                            id="ventanas"
                            name="ventanas"
                            value={inputs.ventanas}
                            onChange={handleChange}
                            placeholder="Ej: 2"
                            min="0"
                            step="1"
                        />
                    </div>
                    
                    <div className="calc-field">
                        <label htmlFor="merma">Merma por empalmes (%)</label>
                        <input
                            type="number"
                            id="merma"
                            name="merma"
                            value={inputs.merma}
                            onChange={handleChange}
                            placeholder="Ej: 15"
                            min="0"
                            max="50"
                            step="0.1"
                        />
                    </div>
                    
                    <div className="calc-field">
                        <label htmlFor="altoRollo">Alto del rollo (m)</label>
                        <input
                            type="number"
                            id="altoRollo"
                            name="altoRollo"
                            value={inputs.altoRollo}
                            onChange={handleChange}
                            placeholder="Ej: 10"
                            min="0"
                            step="0.1"
                            required
                        />
                    </div>
                    
                    <div className="calc-field">
                        <label htmlFor="anchoRollo">Ancho del rollo (m)</label>
                        <input
                            type="number"
                            id="anchoRollo"
                            name="anchoRollo"
                            value={inputs.anchoRollo}
                            onChange={handleChange}
                            placeholder="Ej: 0.53"
                            min="0.01"
                            max="2"
                            step="0.01"
                            required
                        />
                    </div>
                </div>
                
                <div className="calc-actions">
                    <button type="submit" className="btn btn-p" disabled={loading}>
                        {loading ? 'Calculando...' : 'Calcular'}
                    </button>
                    <button type="button" className="btn btn-g" onClick={() => setInputs({
                        altoPared: '', anchoPared: '', puertas: '0', ventanas: '0', 
                        merma: '15', altoRollo: '10', anchoRollo: '0.53'
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
                            <div className="calc-result-label">Área bruta pared</div>
                            <div className="calc-result-value">
                                {result.areaPared} m²
                            </div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Restar puertas/ventanas</div>
                            <div className="calc-result-value">
                                -{result.altoPared} m² (puertas) -{result.anchoPared} m² (ventanas)
                            </div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Área neta</div>
                            <div className="calc-result-value">
                                {result.areaNeta} m²
                            </div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Merma por empalmes</div>
                            <div className="calc-result-value">
                                {result.mermaCantidad} m² ({result.mermaPorcentaje}%)
                            </div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Área total a cubrir</div>
                            <div className="calc-result-value">
                                {result.areaTotal} m²
                            </div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Alto rollo</div>
                            <div className="calc-result-value">
                                {result.altoRollo} m
                            </div>
                        </div>
                        <div className="calc-result-item">
            <div className="calc-result-label">Ancho rollo</div>
            <div className="calc-result-value">
                {result.anchoRollo} m
            </div>
        </div>
        <div className="calc-result-item">
            <div className="calc-result-label">m² por rollo</div>
            <div className="calc-result-value">
                {result.m2PorRollo} m²
            </div>
        </div>
        <div className="calc-result-item">
            <div className="calc-result-label">Rollos necesarios</div>
            <div className="calc-result-value highlight">
                {result.rollosNecesarios} rollos
            </div>
        </div>
        <div className="calc-result-item">
            <div className="calc-result-label">Metros lineales</div>
            <div className="calc-result-value">
                {result.metrosLineales} m
            </div>
        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
