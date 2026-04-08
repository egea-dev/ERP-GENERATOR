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
            { id: 'margen', title: 'Margen Comercial', icon: '💰', desc: 'Calcula precio de venta con margen y descuentos' },
            { id: 'descuentos', title: 'Descuentos Volumen', icon: '🏷️', desc: 'Aplica descuentos por cantidad y cliente' },
            { id: 'presupuesto', title: 'Presupuesto Rápido', icon: '📋', desc: 'Materiales + horas + margen = total' },
            { id: 'preciohora', title: 'Precio Hora', icon: '⏰', desc: 'Calcula precio/hora con margen' }
        ],
        decoracion: [
            { id: 'cortinero', title: 'Cortineros', icon: '🪟', desc: 'Tela necesaria para cortinas' },
            { id: 'papel', title: 'Papel Pintado', icon: '📄', desc: 'Rollos necesarios para paredes' },
            { id: 'suelo', title: 'Suelo/Flotante', icon: '🪵', desc: 'Materiales para instalación de suelo' },
            { id: 'persianas', title: 'Persianas', icon: '🪟', desc: 'Precio estimado de persianas' },
            { id: 'rodapies', title: 'Rodapiés', icon: '🧱', desc: 'Materiales para rodapiés' }
        ],
        cantidad: [
            { id: 'cantidad', title: 'Cantidad con Merma', icon: '📐', desc: 'Calcula cantidad total con merma' }
        ],
        conversores: [
            { id: 'unidades', title: 'Conversor Unidades', icon: '🔄', desc: 'm² ↔ ml, kg ↔ unidades, rollos ↔ m²' },
            { id: 'medidas', title: 'Conversor Medidas', icon: '📏', desc: 'cm ↔ pulg ↔ mm, m ↔ cm' },
            { id: 'moneda', title: 'Conversor Moneda', icon: '💱', desc: 'EUR ↔ USD (tipo de cambio manual)' }
        ],
        otros: [
            { id: 'iluminacion', title: 'Iluminación', icon: '💡', desc: 'Watts necesarios por tipo de habitación' },
            { id: 'pared', title: 'Área Pared', icon: '🧱', desc: '(Ancho × Alto) - (Puertas + Ventanas)' },
            { id: 'escalera', title: 'Escalera', icon: '🪜', desc: 'Calcula número de escalones y longitud' }
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
            setError('Error cargando historial');
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
                <h3>Calculadoras</h3>
                <div className="calculadora-tabs">
                    {categoryItems.map(({ category, items }) => (
                        <div key={category}>
                            <div className="calc-category-title">{category.toUpperCase()}</div>
                            {items.map(item => (
                                <button
                                    key={item.id}
                                    className={`calculadora-tab ${activeCalculator === item.id ? 'active' : ''}`}
                                    onClick={() => setActiveCalculator(item.id)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8px }}>
                                        <span style={{ fontSize: 20 }}>{item.icon}</span>
                                        <div>
                                            <div>{item.title}</div>
                                            <div style={{ fontSize: 12, color: '#666' }}>{item.desc}</div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ))}
                </div>
                
                {history.length > 0 && (
                    <div style={{ marginTop: '24px' }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Historial Reciente</h4>
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {history.slice(0, 10).map((calc, index) => (
                                <div key={calc.id} style={{ 
                                    padding: '12px', 
                                    marginBottom: '8px', 
                                    background: '#f8f9fa', 
                                    borderRadius: '8px'
                                }}>
                                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                                        {calc.calculator_type}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#888' }}>
                                        {new Date(calc.created_at).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
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
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                        Actualizar
                    </button>
                </div>
                
                {error && (
                    <div className="alert a-e" style={{ marginBottom: '24px' }}>
                        {error}
                    </div>
                )}
                
                {CalculatorComponent ? (
                    <CalculatorComponent 
                        onSaveCalculation={handleSaveCalculation}
                    />
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                        <p>Calculadora no disponible</p>
                    </div>
                )}
            </div>
        </div>
    );
}
