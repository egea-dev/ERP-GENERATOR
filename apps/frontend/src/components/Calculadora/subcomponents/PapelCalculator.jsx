import React, { useState } from 'react';

export default function PapelCalculator({ onSaveCalculation }) {
    const [inputs, setInputs] = useState({ altoPared: '', anchoPared: '', puertas: '0', ventanas: '0', merma: '15', altoRollo: '10', anchoRollo: '0.53' });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => { setInputs(prev => ({ ...prev, [e.target.name]: e.target.value })); setResult(null); };

    const handleCalculate = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/calculadora/calculate', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('erp_token')}` },
                body: JSON.stringify({ type: 'papel', inputs })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setResult(data.outputs);
            if (onSaveCalculation) onSaveCalculation('papel', inputs, data.outputs);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    return (
        <div>
            <div className="calc-form">
                <div className="calc-field"><label>Alto pared cm</label><input type="number" name="altoPared" value={inputs.altoPared} onChange={handleChange} placeholder="0" step="0.1" required /></div>
                <div className="calc-field"><label>Ancho pared cm</label><input type="number" name="anchoPared" value={inputs.anchoPared} onChange={handleChange} placeholder="0" step="0.1" required /></div>
                <div className="calc-field"><label>Puertas</label><input type="number" name="puertas" value={inputs.puertas} onChange={handleChange} placeholder="0" /></div>
                <div className="calc-field"><label>Ventanas</label><input type="number" name="ventanas" value={inputs.ventanas} onChange={handleChange} placeholder="0" /></div>
                <div className="calc-field"><label>Merma %</label><input type="number" name="merma" value={inputs.merma} onChange={handleChange} placeholder="15" step="0.1" /></div>
                <div className="calc-field"><label>Alto rollo m</label><input type="number" name="altoRollo" value={inputs.altoRollo} onChange={handleChange} placeholder="10" step="0.1" /></div>
                <div className="calc-field"><label>Ancho rollo m</label><input type="number" name="anchoRollo" value={inputs.anchoRollo} onChange={handleChange} placeholder="0.53" step="0.01" /></div>
            </div>
            <div className="calc-actions">
                <button className="btn btn-p" onClick={handleCalculate} disabled={loading}>{loading ? '...' : 'Calcular'}</button>
                <button className="btn btn-g" onClick={() => setInputs({ altoPared: '', anchoPared: '', puertas: '0', ventanas: '0', merma: '15', altoRollo: '10', anchoRollo: '0.53' })}>Limpiar</button>
            </div>
            {result && (
                <div className="calc-result">
                    <div className="calc-result-header">Resultado</div>
                    <div className="calc-result-grid">
                        <div className="calc-result-item"><div className="calc-result-label">Área neta</div><div className="calc-result-value">{result.areaNeta} m²</div></div>
                        <div className="calc-result-item"><div className="calc-result-label">Rollos</div><div className="calc-result-value highlight">{result.rollosNecesarios}</div></div>
                        <div className="calc-result-item"><div className="calc-result-label">Metros lineales</div><div className="calc-result-value">{result.metrosLineales} m</div></div>
                    </div>
                </div>
            )}
        </div>
    );
}