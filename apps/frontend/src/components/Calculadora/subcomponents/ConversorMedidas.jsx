import React, { useState } from 'react';

export default function ConversorMedidas({ onSaveCalculation }) {
    const [inputs, setInputs] = useState({ valor: '', tipoConversion: 'cm_pulg' });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => { setInputs(prev => ({ ...prev, [e.target.name]: e.target.value })); setResult(null); };

    const handleCalculate = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/calculadora/calculate', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('erp_token')}` },
                body: JSON.stringify({ type: 'medidas', inputs })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setResult(data.outputs);
            if (onSaveCalculation) onSaveCalculation('medidas', inputs, data.outputs);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    return (
        <div>
            <div className="calc-form">
                <div className="calc-field"><label>Valor</label><input type="number" name="valor" value={inputs.valor} onChange={handleChange} placeholder="0" required /></div>
                <div className="calc-field">
                    <label>Tipo</label>
                    <select name="tipoConversion" value={inputs.tipoConversion} onChange={handleChange}>
                        <option value="cm_pulg">cm→pulg</option><option value="pulg_cm">pulg→cm</option>
                        <option value="cm_mm">cm→mm</option><option value="mm_cm">mm→cm</option>
                        <option value="m_cm">m→cm</option><option value="cm_m">cm→m</option>
                    </select>
                </div>
            </div>
            <div className="calc-actions">
                <button className="btn btn-p" onClick={handleCalculate} disabled={loading}>{loading ? '...' : 'Convertir'}</button>
                <button className="btn btn-g" onClick={() => setInputs({ valor: '', tipoConversion: 'cm_pulg' })}>Limpiar</button>
            </div>
            {result && (
                <div className="calc-result">
                    <div className="calc-result-header">Resultado</div>
                    <div className="calc-result-grid">
                        <div className="calc-result-item"><div className="calc-result-label">Original</div><div className="calc-result-value">{result.valorOriginal}</div></div>
                        <div className="calc-result-item"><div className="calc-result-label">Convertido</div><div className="calc-result-value highlight">{result.valorConvertido}</div></div>
                    </div>
                </div>
            )}
        </div>
    );
}