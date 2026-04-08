import React, { useState } from 'react';

export default function PrecioHoraCalculator({ onSaveCalculation }) {
    const [inputs, setInputs] = useState({ salarioBruto: '', gastosIndirectos: '30', beneficios: '20', horasMes: '' });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => { setInputs(prev => ({ ...prev, [e.target.name]: e.target.value })); setResult(null); };

    const handleCalculate = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/calculadora/calculate', {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('erp_token')}` },
                body: JSON.stringify({ type: 'preciohora', inputs })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setResult(data.outputs);
            if (onSaveCalculation) onSaveCalculation('preciohora', inputs, data.outputs);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    return (
        <div>
            <div className="calc-form">
                <div className="calc-field"><label>Salario €</label><input type="number" name="salarioBruto" value={inputs.salarioBruto} onChange={handleChange} placeholder="0" step="0.01" required /></div>
                <div className="calc-field"><label>Gastos %</label><input type="number" name="gastosIndirectos" value={inputs.gastosIndirectos} onChange={handleChange} placeholder="30" step="0.1" /></div>
                <div className="calc-field"><label>Beneficio %</label><input type="number" name="beneficios" value={inputs.beneficios} onChange={handleChange} placeholder="20" step="0.1" /></div>
                <div className="calc-field"><label>Horas/mes</label><input type="number" name="horasMes" value={inputs.horasMes} onChange={handleChange} placeholder="160" required /></div>
            </div>
            <div className="calc-actions">
                <button className="btn btn-p" onClick={handleCalculate} disabled={loading}>{loading ? '...' : 'Calcular'}</button>
                <button className="btn btn-g" onClick={() => setInputs({ salarioBruto: '', gastosIndirectos: '30', beneficios: '20', horasMes: '' })}>Limpiar</button>
            </div>
            {result && (
                <div className="calc-result">
                    <div className="calc-result-header">Resultado</div>
                    <div className="calc-result-grid">
                        <div className="calc-result-item"><div className="calc-result-label">Coste/h</div><div className="calc-result-value">{result.costeHoraConGastos}€</div></div>
                        <div className="calc-result-item"><div className="calc-result-label">PVP/h</div><div className="calc-result-value highlight">{result.precioHoraFinal}€</div></div>
                        <div className="calc-result-item"><div className="calc-result-label">Ingreso mes</div><div className="calc-result-value">{result.ingresoMensual}€</div></div>
                    </div>
                </div>
            )}
        </div>
    );
}