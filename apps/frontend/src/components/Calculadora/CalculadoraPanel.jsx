import React, { useState, useEffect, useMemo } from 'react';
import { dbService } from '../../dbService';
import './Calculadora.css';
import MargenCalculator from './subcomponents/MargenCalculator';
import CantidadCalculator from './subcomponents/CantidadCalculator';
import CortineroCalculator from './subcomponents/CortineroCalculator';
import PapelCalculator from './subcomponents/PapelCalculator';
import SueloCalculator from './subcomponents/SueloCalculator';
import PersianasCalculator from './subcomponents/PersianasCalculator';
import RodapiesCalculator from './subcomponents/RodapiesCalculator';
import DescuentosCalculator from './subcomponents/DescuentosCalculator';
import PresupuestoCalculator from './subcomponents/PresupuestoCalculator';
import PrecioHoraCalculator from './subcomponents/PrecioHoraCalculator';
import ConversorUnidades from './subcomponents/ConversorUnidades';
import ConversorMedidas from './subcomponents/ConversorMedidas';
import ConversorMoneda from './subcomponents/ConversorMoneda';
import IluminacionCalculator from './subcomponents/IluminacionCalculator';
import AreaParedCalculator from './subcomponents/AreaParedCalculator';
import EscaleraCalculator from './subcomponents/EscaleraCalculator';

export default function CalculadoraPanel() {
    const [activeCalculator, setActiveCalculator] = useState('margen');
    const [history, setHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const calculatorCategories = {
        comercial: [
            { id: 'margen', title: 'Margen', icon: '💰', desc: 'Precio con margen' },
            { id: 'descuentos', title: 'Dto. Volumen', icon: '🏷️', desc: 'Descuentos' },
            { id: 'presupuesto', title: 'Presupuesto', icon: '📋', desc: 'Materiales+horas' },
            { id: 'preciohora', title: 'Precio Hora', icon: '⏰', desc: 'Coste/hora' }
        ],
        decoracion: [
            { id: 'cortinero', title: 'Cortineros', icon: '🪟', desc: 'Tela cortinas' },
            { id: 'papel', title: 'Papel Pintado', icon: '📄', desc: 'Rollos pared' },
            { id: 'suelo', title: 'Suelo', icon: '🪵', desc: 'Instalación' },
            { id: 'persianas', title: 'Persianas', icon: '🪟', desc: 'Precio est.' },
            { id: 'rodapies', title: 'Rodapiés', icon: '🧱', desc: 'Materiales' }
        ],
        cantidad: [
            { id: 'cantidad', title: 'Cantidad', icon: '📐', desc: 'Con merma' }
        ],
        conversores: [
            { id: 'unidades', title: 'Unidades', icon: '🔄', desc: 'm²↔ml, kg↔ud' },
            { id: 'medidas', title: 'Medidas', icon: '📏', desc: 'cm↔pulg' },
            { id: 'moneda', title: 'Moneda', icon: '💱', desc: 'EUR↔USD' }
        ],
        otros: [
            { id: 'iluminacion', title: 'Iluminación', icon: '💡', desc: 'Watts/hab' },
            { id: 'pared', title: 'Área Pared', icon: '🧱', desc: 'Pintura' },
            { id: 'escalera', title: 'Escalera', icon: '🪜', desc: 'Escalones' }
        ]
    };

    const calculatorMap = {
        margen: MargenCalculator,
        cantidad: CantidadCalculator,
        cortinero: CortineroCalculator,
        papel: PapelCalculator,
        suelo: SueloCalculator,
        persianas: PersianasCalculator,
        rodapies: RodapiesCalculator,
        descuentos: DescuentosCalculator,
        presupuesto: PresupuestoCalculator,
        preciohora: PrecioHoraCalculator,
        unidades: ConversorUnidades,
        medidas: ConversorMedidas,
        moneda: ConversorMoneda,
        iluminacion: IluminacionCalculator,
        pared: AreaParedCalculator,
        escalera: EscaleraCalculator
    };

    const categoryItems = useMemo(() => {
        return Object.entries(calculatorCategories).map(([category, items]) => ({
            category,
            items
        }));
    }, []);

    const loadHistory = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await dbService.getCalculatorHistory(null, 20);
            setHistory(data);
        } catch (err) {
            setError('Error historial');
            console.error('[CALCULADORA] Error loading history:', err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadHistory();
    }, []);

    const handleSaveCalculation = async (type, inputs, outputs) => {
        try {
            await dbService.saveCalculation(type, inputs, outputs);
            await loadHistory();
        } catch (err) {
            console.error('[CALCULADORA] Error saving calculation:', err);
        }
    };

    const CalculatorComponent = calculatorMap[activeCalculator];

    return (
        <div className="calculadora-layout">
            <div className="calculadora-sidebar">
                <div className="calculadora-tabs">
                    {categoryItems.map(({ category, items }) => (
                        <div key={category}>
                            <div className="calc-category-title">{category}</div>
                            {items.map(item => (
                                <button
                                    key={item.id}
                                    className={`calculadora-tab ${activeCalculator === item.id ? 'active' : ''}`}
                                    onClick={() => setActiveCalculator(item.id)}
                                >
                                    <span>{item.icon}</span>
                                    <div>
                                        <div>{item.title}</div>
                                        <div className="chip-sub">{item.desc}</div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            <div className="calculadora-content">
                <div className="calculadora-header">
                    <h2>
                        {calculatorMap[activeCalculator] ?
                            Object.values(calculatorCategories).flat().find(c => c.id === activeCalculator)?.title || 'Calculadora'
                            : 'Calculadora'}
                    </h2>
                    <button
                        onClick={loadHistory}
                        className="btn btn-g"
                        style={{ padding: '4px 8px', fontSize: '9px' }}
                    >
                        ↻
                    </button>
                </div>

                {error && (
                    <div className="alert a-e" style={{ padding: '8px', fontSize: '10px' }}>
                        {error}
                    </div>
                )}

                {CalculatorComponent ? (
                    <CalculatorComponent
                        onSaveCalculation={handleSaveCalculation}
                    />
                ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--fg2)', fontSize: '10px' }}>
                        No disponible
                    </div>
                )}
            </div>
        </div>
    );
}