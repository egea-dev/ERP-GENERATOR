import React, { useState } from 'react';
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
import AppIcon from '../shared/AppIcon';

const CALCULATOR_CATEGORIES = {
    comercial: [
        { id: 'margen', title: 'Margen', icon: 'coin', desc: 'Precio con margen' },
        { id: 'descuentos', title: 'Dto. Volumen', icon: 'tag', desc: 'Descuentos' },
        { id: 'presupuesto', title: 'Presupuesto', icon: 'clipboard', desc: 'Materiales+horas' },
        { id: 'preciohora', title: 'Precio Hora', icon: 'clock', desc: 'Coste/hora' }
    ],
    decoracion: [
        { id: 'cortinero', title: 'Cortineros', icon: 'curtains', desc: 'Tela cortinas' },
        { id: 'papel', title: 'Papel Pintado', icon: 'document', desc: 'Rollos pared' },
        { id: 'suelo', title: 'Suelo', icon: 'floor', desc: 'Instalación' },
        { id: 'persianas', title: 'Persianas', icon: 'curtains', desc: 'Precio est.' },
        { id: 'rodapies', title: 'Rodapiés', icon: 'brick', desc: 'Materiales' }
    ],
    cantidad: [
        { id: 'cantidad', title: 'Cantidad', icon: 'ruler', desc: 'Con merma' }
    ],
    conversores: [
        { id: 'unidades', title: 'Unidades', icon: 'refresh', desc: 'm²↔ml, kg↔ud' },
        { id: 'medidas', title: 'Medidas', icon: 'measure', desc: 'cm↔pulg' },
        { id: 'moneda', title: 'Moneda', icon: 'currency', desc: 'EUR↔USD' }
    ],
    otros: [
        { id: 'iluminacion', title: 'Iluminación', icon: 'bulb', desc: 'Watts/hab' },
        { id: 'pared', title: 'Área Pared', icon: 'brick', desc: 'Pintura' },
        { id: 'escalera', title: 'Escalera', icon: 'stairs', desc: 'Escalones' }
    ]
};

const CATEGORY_ITEMS = Object.entries(CALCULATOR_CATEGORIES).map(([category, items]) => ({
    category,
    items
}));

export default function CalculadoraPanel() {
    const [activeCalculator, setActiveCalculator] = useState('margen');
    const [error, setError] = useState(null);

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

    const loadHistory = async () => {
        setError(null);
        try {
            await dbService.getCalculatorHistory(null, 20);
        } catch (err) {
            setError('Error historial');
            console.error('[CALCULADORA] Error loading history:', err);
        }
    };

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
                    {CATEGORY_ITEMS.map(({ category, items }) => (
                        <div key={category}>
                            <div className="calc-category-title">{category}</div>
                            {items.map(item => (
                                <button
                                    key={item.id}
                                    className={`calculadora-tab ${activeCalculator === item.id ? 'active' : ''}`}
                                    onClick={() => setActiveCalculator(item.id)}
                                >
                                    <span className="calculadora-tab-icon">
                                        <AppIcon name={item.icon} size={15} />
                                    </span>
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
                            Object.values(CALCULATOR_CATEGORIES).flat().find(c => c.id === activeCalculator)?.title || 'Calculadora'
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
