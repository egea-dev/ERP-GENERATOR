import React, { useState } from 'react';

export default function PrecioHoraCalculator({ onSaveCalculation }) {
    const [inputs, setInputs] = useState({
        salarioBruto: '',
        gastosIndirectos: '',
        beneficios: '',
        horasMes: ''
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
            // Llamar al backend
            const response = await fetch('/api/calculadora/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('erp_token')}`
                },
                body: JSON.stringify({
                    type: 'preciohora',
                    inputs
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error en el cálculo');
            }

            setResult(data.outputs);

            // Guardar en historial
            if (onSaveCalculation) {
                onSaveCalculation('preciohora', inputs, data.outputs);
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
                        <label htmlFor="salarioBruto">Salario Bruto Mensual (€)</label>
                        <input
                            type="number"
                            id="salarioBruto"
                            name="salarioBruto"
                            value={inputs.salarioBruto}
                            onChange={handleChange}
                            placeholder="Ej: 1800"
                            min="0"
                            step="0.01"
                            required
                        />
                    </div>

                    <div className="calc-field">
                        <label htmlFor="gastosIndirectos">Gastos Indirectos (%)</label>
                        <input
                            type="number"
                            id="gastosIndirectos"
                            name="gastosIndirectos"
                            value={inputs.gastosIndirectos}
                            onChange={handleChange}
                            placeholder="Ej: 30 (seguridad social, etc.)"
                            min="0"
                            max="200"
                            step="0.1"
                        />
                    </div>

                    <div className="calc-field">
                        <label htmlFor="beneficios">Beneficio Deseado (%)</label>
                        <input
                            type="number"
                            id="beneficios"
                            name="beneficios"
                            value={inputs.beneficios}
                            onChange={handleChange}
                            placeholder="Ej: 20"
                            min="0"
                            max="500"
                            step="0.1"
                        />
                    </div>

                    <div className="calc-field">
                        <label htmlFor="horasMes">Horas Trabajables/Month</label>
                        <input
                            type="number"
                            id="horasMes"
                            name="horasMes"
                            value={inputs.horasMes}
                            onChange={handleChange}
                            placeholder="Ej: 160"
                            min="1"
                            max="744"
                            step="0.1"
                            required
                        />
                    </div>
                </div>

                <div className="calc-actions">
                    <button type="submit" className="btn btn-p" disabled={loading}>
                        {loading ? 'Calculando...' : 'Calcular'}
                    </button>
                    <button type="button" className="btn btn-g" onClick={() => setInputs({ salarioBruto: '', gastosIndirectos: '', beneficios: '', horasMes: '' })}>
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
                            <div className="calc-result-label">Salario Bruto</div>
                            <div className="calc-result-value">{result.salarioBruto !== undefined ? `${result.salarioBruto} €/mes` : '-'}</div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Coste Hora Base</div>
                            <div className="calc-result-value">{result.costeHoraBase !== undefined ? `${result.costeHoraBase} €/h` : '-'}</div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Coste Hora con Gastos</div>
                            <div className="calc-result-value">{result.costeHoraConGastos !== undefined ? `${result.costeHoraConGastos} €/h` : '-'}</div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Precio Hora Final</div>
                            <div className="calc-result-value highlight">{result.precioHoraFinal !== undefined ? `${result.precioHoraFinal} €/h` : '-'}</div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Horas/Month</div>
                            <div className="calc-result-value">{result.horasMes !== undefined ? `${result.horasMes} h` : '-'}</div>
                        </div>
                        <div className="calc-result-item">
                            <div className="calc-result-label">Ingreso Mensual</div>
                            <div className="calc-result-value">{result.ingresoMensual !== undefined ? `${result.ingresoMensual} €/mes` : '-'}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}