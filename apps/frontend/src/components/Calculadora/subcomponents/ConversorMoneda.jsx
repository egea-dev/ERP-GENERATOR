import React, { useState } from 'react';

export default function ConversorMoneda({ onSaveCalculation }) {
    const [inputs, setInputs] = useState({ valor: '', tipoConversion: 'eur_usd', tipoCambio: '' });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => { setInputs(prev => ({ ...prev, [e.target.name]: e.target.value })); setResult(null); };

    const handleCalculate = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/calculadora/calculate', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('erp_token')}` },
                body: JSON.stringify({ type: 'moneda', inputs })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setResult(data.outputs);
            if (onSaveCalculation) onSaveCalculation('moneda', inputs, data.outputs);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    return (
        <div>
            <div className="calc-form">
                <div className="calc-field"><label>Cantidad</label><input type="number" name="valor" value={inputs.valor} onChange={handleChange} placeholder="0" required /></div>
                <div className="calc-field">
                    <label>Tipo</label>
                    <select name="tipoConversion" value={inputs.tipoConversion} onChange={handleChange}>
                        <option value="eur_usd">EUR→USD</option><option value="usd_eur">USD→EUR</option>
                    </select>
                </div>
                <div className="calc-field"><label>Cambio</label><input type="number" name="tipoCambio" value={inputs.tipoCambio} onChange={handleChange} placeholder="1.10" required /></div>
            </div>
            <div className="calc-actions">
                <button className="btn btn-p" onClick={handleCalculate} disabled={loading}>{loading ? '...' : 'Convertir'}</button>
                <button className="btn btn-g" onClick={() => setInputs({ valor: '', tipoConversion: 'eur_usd', tipoCambio: '' })}>Limpiar</button>
            </div>
            {result && (
                <div className="calc-result">
                    <div className="calc-result-header">Resultado</div>
                    <div className="calc-result-grid">
                        <div className="calc-result-item"><div className="calc-result-label">Original</div><div className="calc-result-value">{result.valorOriginal}</div></div>
                        <div className="calc-result-item"><div className="calc-result-label">Convertido</div><div className="calc-result-value highlight">{result.valorConvertido}</div></div>
                        <div className="calc-result-item"><div className="calc-result-label">Cambio</div><div className="calc-result-value">{result.tipoCambio}</div></div>
                    </div>
                </div>
            )}
        </div>
    );
}