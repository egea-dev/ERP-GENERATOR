import React, { useState } from 'react';

export default function PresupuestoCalculator({ onSaveCalculation }) {
    const [materiales, setMateriales] = useState([{
        id: Date.now(),
        descripcion: '',
        cantidad: '',
        precio: ''
    }]);
    const [horas, setHoras] = useState('');
    const [costeHora, setCosteHora] = useState('');
    const [margen, setMargen] = useState('');
    
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChangeMaterial = (index, field, value) => {
        setMateriales(prev => {
            const newMateriales = [...prev];
            newMateriales[index] = { ...newMateriales[index], [field]: value };
            return newMateriales;
        });
        setResult(null);
        setError(null);
    };

    const handleChangeHoras = (e) => {
        setHoras(e.target.value);
        setResult(null);
        setError(null);
    };

    const handleChangeCosteHora = (e) => {
        setCosteHora(e.target.value);
        setResult(null);
        setError(null);
    };

    const handleChangeMargen = (e) => {
        setMargen(e.target.value);
        setResult(null);
        setError(null);
    };

    const addMaterial = () => {
        setMateriales([...materiales, {
            id: Date.now() + Math.random(),
            descripcion: '',
            cantidad: '',
            precio: ''
        }]);
    };

    const removeMaterial = (index) => {
        if (materiales.length <= 1) return;
        setMateriales(materales.filter((_, i) => i !== index));
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
                    type: 'presupuesto',
                    inputs: {
                        materiales,
                        horas: parseFloat(horas) || 0,
                        costeHora: parseFloat(costeHora) || 0,
                        margen: parseFloat(margen) || 0
                    }
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error en el cálculo');
            }
            
            setResult(data.outputs);
            
            if (onSaveCalculation) {
                onSaveCalculation('presupuesto', {
                    materiales,
                    horas,
                    costeHora,
                    margen
                }, data.outputs);
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
                <div className="calc-field">
                    <label htmlFor="materiales">Materiales</label>
                    <div className="calc-materiales-list">
                        {materiales.map((material, index) => (
                            <div key={material.id} className="calc-material-row">
                                <input
                                    type="text"
                                    placeholder="Descripción del material"
                                    value={material.descripcion}
                                    onChange={(e) => handleChangeMaterial(index, 'descripcion', e.target.value)}
                                />
                                <input
                                    type="number"
                                    placeholder="Cantidad"
                                    value={material.cantidad}
                                    onChange={(e) => handleChangeMaterial(index, 'cantidad', e.target.value)}
                                    min="0"
                                    step="0.01"
                                />
                                <input
                                    type="number"
                                    placeholder="Precio unitario (€)"
                                    value={material.precio}
                                    onChange={(e) => handleChangeMaterial(index, 'precio', e.target.value)}
                                    min="0"
                                    step="0.01"
                                />
                                <input
                                    type="number"
                                    placeholder="Total (€)"
                                    value={parseFloat(material.cantidad || 0) * parseFloat(material.precio || 0)}
                                    readOnly
                                />
                                {materiales.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeMaterial(index)}
                                        className="calc-remove-btn"
                                        title="Eliminar material"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}
                        <div className="calc-add-material">
                            <button
                                type="button"
                                onClick={addMaterial}
                                className="calc-add-material-btn"
                            >
                                + Añadir material
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="calc-field">
                    <label htmlFor="horas">Horas de mano de obra</label>
                    <input
                        type="number"
                        id="horas"
                        name="horas"
                        value={horas}
                        onChange={handleChangeHoras}
                        placeholder="Ej: 16"
                        min="0"
                        step="0.1"
                    />
                </div>
                
                <div className="calc-field">
                    <label htmlFor="costeHora">Coste hora mano de obra (€/h)</label>
                    <input
                        type="number"
                        id="costeHora"
                        name="costeHora"
                        value={costeHora}
                        onChange={handleChangeCosteHora}
                        placeholder="Ej: 25"
                        min="0"
                        step="0.01"
                    />
                </div>
                
                <div className="calc-field">
                    <label htmlFor="margen">Margen de beneficio (%)</label>
                    <input
                        type="number"
                        id="margen"
                        name="margen"
                        value={margen}
                        onChange={handleChangeMargen}
                        placeholder="Ej: 20"
                        min="0"
                        max="500"
                        step="0.1"
                    />
                </div>
                
                <div className="calc-actions">
                    <button type="submit" className="btn btn-p" disabled={loading}>
                        {loading ? 'Calculando...' : 'Calcular'}
                    </button>
                    <button type="button" className="btn btn-g" onClick={() => {
                        setMateriales([{
                            id: Date.now(),
                            descripcion: '',
                            cantidad: '',
                            precio: ''
                        }]);
                        setHoras('');
                        setCosteHora('');
                        setMargen('');
                    }}>
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
                            <div className="calc-result-label">Total materiales</div>
                            <div className="calc-result-value">
                                {result.totalMateriales} €
                            </div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Total mano de obra</div>
                            <div className="calc-result-value">
                                {result.totalManoObra} €
                            </div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Subtotal</div>
                            <div className="calc-result-value">
                                {result.subtotal} €
                            </div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Margen aplicado</div>
                            <div className="calc-result-value">
                                {result.beneficio} € ({result.margen}%)
                            </div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">TOTAL PRESUPUESTO</div>
                            <div className="calc-result-value highlight">
                                {result.total} €
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
