import React, { useState } from 'react';

export default function ConversorUnidades({ onSaveCalculation }) {
    const [inputs, setInputs] = useState({ valor: '', tipoConversion: 'm2_ml', anchoLinear: '' });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => { setInputs(prev => ({ ...prev, [e.target.name]: e.target.value })); setResult(null); };

    const handleCalculate = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/calculadora/calculate', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('erp_token')}` },
                body: JSON.stringify({ type: 'unidades', inputs })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setResult(data.outputs);
            if (onSaveCalculation) onSaveCalculation('unidades', inputs, data.outputs);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const needsAncho = ['m2_ml', 'ml_m2', 'rollos_m2', 'm2_rollos'].includes(inputs.tipoConversion);
    const needsPeso = ['kguds', 'uds_kg'].includes(inputs.tipoConversion);

    return (
        <div>
            <div className="calc-form">
                <div className="calc-field"><label>Valor</label><input type="number" name="valor" value={inputs.valor} onChange={handleChange} placeholder="0" required /></div>
                <div className="calc-field">
                    <label>Tipo</label>
                    <select name="tipoConversion" value={inputs.tipoConversion} onChange={handleChange}>
                        <option value="m2_ml">m²→ml</option><option value="ml_m2">ml→m²</option>
                        <option value="kguds">kg→uds</option><option value="uds_kg">uds→kg</option>
                        <option value="rollos_m2">rollos→m²</option><option value="m2_rollos">m²→rollos</option>
                    </select>
                </div>
                {needsAncho && <div className="calc-field"><label>Ancho m</label><input type="number" name="anchoLinear" value={inputs.anchoLinear} onChange={handleChange} placeholder="1" required /></div>}
                {needsPeso && <div className="calc-field"><label>kg/ud</label><input type="number" name="anchoLinear" value={inputs.anchoLinear} onChange={handleChange} placeholder="1" required /></div>}
            </div>
            <div className="calc-actions">
                <button className="btn btn-p" onClick={handleCalculate} disabled={loading}>{loading ? '...' : 'Convertir'}</button>
                <button className="btn btn-g" onClick={() => setInputs({ valor: '', tipoConversion: 'm2_ml', anchoLinear: '' })}>Limpiar</button>
            </div>
            {result && (
                <div className="calc-result">
                    <div className="calc-result-header">Resultado</div>
                    <div className="calc-result-grid">
                        <div className="calc-result-item"><div className="calc-result-label">Original</div><div className="calc-result-value">{result.valorOriginal}</div></div>
                        <div className="calc-result-item"><div className="calc-result-label">Convertido</div><div className="calc-result-value highlight">{result.valorConvertido}</div></div>
                        <div className="calc-result-item"><div className="calc-result-label">Unidad</div><div className="calc-result-value">{result.unidadConvertida}</div></div>
                    </div>
                </div>
            )}
        </div>
    );
}