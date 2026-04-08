const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function calculateMargen(inputs) {
    const { coste, margen, dtoVolumen, dtoCliente } = inputs;
    
    const c = parseFloat(coste);
    const m = parseFloat(margen);
    const dv = parseFloat(dtoVolumen || 0);
    const dc = parseFloat(dtoCliente || 0);
    
    let precio = c;
    let dtoAplicado = 0;
    
    if (dv > 0) {
        dtoAplicado += dv;
        precio = precio * (1 - dv / 100);
    }
    
    if (dc > 0) {
        dtoAplicado += dc;
        precio = precio * (1 - dc / 100);
    }
    
    const precioConMargen = precio * (1 + m / 100);
    const beneficio = precioConMargen - precio;
    const dtoTotal = ((c - precioConMargen) / c) * 100;
    
    return {
        costeBase: parseFloat(c.toFixed(2)),
        precioBase: parseFloat(precio.toFixed(2)),
        precioVenta: parseFloat(precioConMargen.toFixed(2)),
        beneficio: parseFloat(beneficio.toFixed(2)),
        dtoAplicado: parseFloat(dtoAplicado.toFixed(2)),
        dtoTotalPorcentaje: parseFloat(dtoTotal.toFixed(2)),
        margenAplicado: parseFloat(m.toFixed(2))
    };
}

function calculateCantidad(inputs) {
    const { ancho, alto, merma, tipoMedida } = inputs;
    
    const medida = tipoMedida === 'm' ? 1 : tipoMedida === 'cm' ? 0.01 : 0.0001;
    const anchoM = parseFloat(ancho) * medida;
    const altoM = parseFloat(alto) * medida;
    const superficie = anchoM * altoM;
    const mermaCantidad = superficie * (parseFloat(merma) / 100);
    const cantidadTotal = superficie + mermaCantidad;
    
    return {
        anchoOriginal: parseFloat(ancho),
        altoOriginal: parseFloat(alto),
        tipoMedida,
        superficie: parseFloat(superficie.toFixed(3)),
        mermaPorcentaje: parseFloat(merma),
        mermaCantidad: parseFloat(mermaCantidad.toFixed(3)),
        cantidadTotal: parseFloat(cantidadTotal.toFixed(3)),
        unidad: tipoMedida === 'm' ? 'm²' : tipoMedida === 'cm' ? 'cm²' : 'mm²'
    };
}

function calculateCortinero(inputs) {
    const { ancho, caida, pliegues, costuras,tipoMedida } = inputs;
    
    const medida = tipoMedida === 'm' ? 1 : tipoMedida === 'cm' ? 0.01 : 0.0001;
    const anchoM = parseFloat(ancho) * medida;
    const caidaM = parseFloat(caida) * medida;
    
    const factorPliegues = parseFloat(pliegues);
    const metrosTela = anchoM * factorPliegues;
    const numeroCosturas = Math.ceil(metrosTela / 2.8);
    
    return {
        anchoOriginal: parseFloat(ancho),
        caidaOriginal: parseFloat(caida),
        tipoMedida,
        metrosTela: parseFloat(metrosTela.toFixed(2)),
        metrosCaida: parseFloat(caidaM.toFixed(2)),
        pliegues: factorPliegues,
        costuras: numeroCosturas,
        recomendacion: metrosTela > 50 ? 'Consultar con taller' : 'OK'
    };
}

function calculatePapelPintado(inputs) {
    const { altoPared, anchoPared, puertas, ventanas, merma, altoRollo, anchoRollo } = inputs;
    
    const altoM = parseFloat(altoPared) / 100;
    const anchoM = parseFloat(anchoPared) / 100;
    const puertaM = parseFloat(puertas || 0);
    const ventanaM = parseFloat(ventanas || 0);
    const mermaPorc = parseFloat(merma || 15);
    
    const areaPared = altoM * anchoM;
    const areaPuertas = puertaM;
    const areaVentanas = ventanaM;
    const areaNeta = areaPared - areaPuertas - areaVentanas;
    const mermaCantidad = areaNeta * (mermaPorc / 100);
    const areaTotal = areaNeta + mermaCantidad;
    
    const altoR = parseFloat(altoRollo || 10);
    const anchoR = parseFloat(anchoRollo || 0.53);
    const m2PorRollo = (altoR * anchoR);
    const rollosNecesarios = Math.ceil(areaTotal / m2PorRollo);
    
    return {
        altoPared: parseFloat(altoPared),
        anchoPared: parseFloat(anchoPared),
        areaPared: parseFloat(areaPared.toFixed(2)),
        areaNeta: parseFloat(areaNeta.toFixed(2)),
        mermaPorcentaje: mermaPorc,
        mermaCantidad: parseFloat(mermaCantidad.toFixed(2)),
        areaTotal: parseFloat(areaTotal.toFixed(2)),
        altoRollo: altoR,
        anchoRollo: anchoR,
        m2PorRollo: parseFloat(m2PorRollo.toFixed(2)),
        rollosNecesarios: rollosNecesarios,
        metrosLineales: parseFloat((rollosNecesarios * altoR).toFixed(2))
    };
}

function calculateSuelo(inputs) {
    const { m2Habitacion, merma, tipoSuelo } = inputs;
    
    const m2 = parseFloat(m2Habitacion);
    const mermaPorc = parseFloat(merma || 10);
    const mermaCantidad = m2 * (mermaPorc / 100);
    const m2Comprar = m2 + mermaCantidad;
    
    const rendimiento = tipoSuelo === 'flotante' ? 1.1 : 
                       tipoSuelo === 'baldosa' ? 1.15 : 1.1;
    const paquetes = Math.ceil(m2Comprar / 2);
    
    return {
        m2Habitacion: m2,
        mermaPorcentaje: mermaPorc,
        mermaCantidad: parseFloat(mermaCantidad.toFixed(2)),
        m2Comprar: parseFloat(m2Comprar.toFixed(2)),
        tipoSuelo,
        paquetesNecesarios: paquetes,
        m2PorPaquete: 2
    };
}

function calculatePersianas(inputs) {
    const { ancho, alto, tipo, material } = inputs;
    
    const anchoM = parseFloat(ancho) / 100;
    const altoM = parseFloat(alto) / 100;
    const superficie = anchoM * altoM;
    
    const precioBase = tipo === 'enrollable' ? 25 : 
                       tipo === 'venciana' ? 35 : 
                       tipo === 'vertical' ? 40 : 30;
    
    const multiplicadorMaterial = material === 'aluminio' ? 1.3 : 
                                  material === 'madera' ? 1.5 : 1;
    
    const precioEstimado = superficie * precioBase * multiplicadorMaterial;
    
    return {
        ancho: parseFloat(ancho),
        alto: parseFloat(alto),
        tipo,
        material,
        superficie: parseFloat(superficie.toFixed(2)),
        precioBase: precioBase,
        precioEstimado: parseFloat(precioEstimado.toFixed(2)),
        moneda: 'EUR'
    };
}

function calculateRodapies(inputs) {
    const { largo, tipo, material } = inputs;
    
    const ml = parseFloat(largo);
    const piezas = Math.ceil(ml / 2.5);
    constmlExtras = Math.ceil(ml * 0.1);
    const totalPiezas = piezas + mlExtras;
    
    const precioBase = tipo === 'estandar' ? 3 : 
                      tipo === 'premium' ? 6 : 4;
    
    const multiplicador = material === 'madera' ? 1.5 : 
                         material === 'pvc' ? 0.8 : 1;
    
    const precioTotal = (totalPiezas * 2.5) * precioBase * multiplicador;
    
    return {
        metrosLineales: ml,
        piezasBase: piezas,
        piezasExtra: mlExtras,
        totalPiezas: totalPiezas,
        tipo,
        material,
        precioMetro: parseFloat((precioBase * multiplicador).toFixed(2)),
        precioTotal: parseFloat(precioTotal.toFixed(2))
    };
}

function calculateDescuentos(inputs) {
    const { precio, dtoVolumen, dtoCliente, cantidad } = inputs;
    
    let precioBase = parseFloat(precio);
    let dtoVolumenAplicado = 0;
    let dtoClienteAplicado = 0;
    
    if (dtoVolumen > 0 && cantidad >= 10) {
        dtoVolumenAplicado = dtoVolumen;
        precioBase = precioBase * (1 - dtoVolumen / 100);
    }
    
    if (dtoCliente > 0) {
        dtoClienteAplicado = dtoCliente;
        precioBase = precioBase * (1 - dtoCliente / 100);
    }
    
    const precioUnitario = precioBase;
    const precioTotal = precioUnitario * (cantidad || 1);
    const dtoTotal = ((parseFloat(precio) - precioUnitario) / parseFloat(precio)) * 100;
    
    return {
        precioBase: parseFloat(precio),
        dtoVolumen: dtoVolumen,
        dtoVolumenAplicado: parseFloat(dtoVolumenAplicado.toFixed(2)),
        dtoCliente: dtoCliente,
        dtoClienteAplicado: parseFloat(dtoClienteAplicado.toFixed(2)),
        cantidad: cantidad || 1,
        precioUnitario: parseFloat(precioUnitario.toFixed(2)),
        precioTotal: parseFloat(precioTotal.toFixed(2)),
        dtoTotalPorcentaje: parseFloat(dtoTotal.toFixed(2))
    };
}

function calculatePresupuesto(inputs) {
    const { materiales, horas, costeHora, margen } = inputs;
    
    const totalMateriales = materiales.reduce((sum, m) => sum + (m.cantidad * m.precio), 0);
    const totalManoObra = parseFloat(horas) * parseFloat(costeHora);
    const subtotal = totalMateriales + totalManoObra;
    const beneficio = subtotal * (parseFloat(margen) / 100);
    const total = subtotal + beneficio;
    
    return {
        materiales: materiales.map(m => ({
            ...m,
            total: parseFloat((m.cantidad * m.precio).toFixed(2))
        })),
        horas: parseFloat(horas),
        costeHora: parseFloat(costeHora),
        margen: parseFloat(margen),
        totalMateriales: parseFloat(totalMateriales.toFixed(2)),
        totalManoObra: parseFloat(totalManoObra.toFixed(2)),
        subtotal: parseFloat(subtotal.toFixed(2)),
        beneficio: parseFloat(beneficio.toFixed(2)),
        total: parseFloat(total.toFixed(2))
    };
}

function calculatePrecioHora(inputs) {
    const { salarioBruto, gastosIndirectos, beneficios, horasMes } = inputs;
    
    const salario = parseFloat(salarioBruto);
    const gastos = parseFloat(gastosIndirectos || 0);
    const margen = parseFloat(beneficios || 0);
    const horas = parseFloat(horasMes);
    
    const costeHoraBase = (salario * 12) / (horas * 52);
    const costeHoraConGastos = costeHoraBase * (1 + gastos / 100);
    const precioHoraFinal = costeHoraConGastos * (1 + margen / 100);
    const ingresoMensual = precioHoraFinal * horas;
    
    return {
        salarioBruto: parseFloat(salarioBruto),
        gastosIndirectos: parseFloat(gastosIndirectos || 0),
        beneficios: parseFloat(beneficios || 0),
        horasMes: parseFloat(horasMes),
        costeHoraBase: parseFloat(costeHoraBase.toFixed(2)),
        costeHoraConGastos: parseFloat(costeHoraConGastos.toFixed(2)),
        precioHoraFinal: parseFloat(precioHoraFinal.toFixed(2)),
        ingresoMensual: parseFloat(ingresoMensual.toFixed(2))
    };
}

function convertUnidades(inputs) {
    const { valor, tipoConversion, anchoLinear } = inputs;
    
    const val = parseFloat(valor);
    const ancho = parseFloat(anchoLinear || 1);
    let resultado, unidadOriginal, unidadConvertida, detalles;
    
    switch (tipoConversion) {
        case 'm2_ml':
            resultado = val / ancho;
            unidadOriginal = 'm²';
            unidadConvertida = 'ml';
            detalles = `${val} m² ÷ ${ancho}m = ${resultado.toFixed(2)} ml`;
            break;
        case 'ml_m2':
            resultado = val * ancho;
            unidadOriginal = 'ml';
            unidadConvertida = 'm²';
            detalles = `${val} ml × ${ancho}m = ${resultado.toFixed(2)} m²`;
            break;
        case 'kguds':
            resultado = val / ancho;
            unidadOriginal = 'kg';
            unidadConvertida = 'uds';
            detalles = `${val} kg ÷ ${ancho} kg/ud = ${resultado.toFixed(2)} uds`;
            break;
        case 'uds_kg':
            resultado = val * ancho;
            unidadOriginal = 'uds';
            unidadConvertida = 'kg';
            detalles = `${val} uds × ${ancho} kg/ud = ${resultado.toFixed(2)} kg`;
            break;
        case 'rollos_m2':
            resultado = val * ancho;
            unidadOriginal = 'rollos';
            unidadConvertida = 'm²';
            detalles = `${val} rollos × ${ancho} m²/rollo = ${resultado.toFixed(2)} m²`;
            break;
        case 'm2_rollos':
            resultado = val / ancho;
            unidadOriginal = 'm²';
            unidadConvertida = 'rollos';
            detalles = `${val} m² ÷ ${ancho} m²/rollo = ${resultado.toFixed(2)} rollos`;
            break;
        default:
            resultado = val;
            unidadOriginal = '-';
            unidadConvertida = '-';
            detalles = 'Tipo de conversión no válido';
    }
    
    return {
        valorOriginal: val,
        valorConvertido: parseFloat(resultado.toFixed(3)),
        unidadOriginal,
        unidadConvertida,
        detalles
    };
}

function convertMedidas(inputs) {
    const { valor, tipoConversion } = inputs;
    
    const val = parseFloat(valor);
    let resultado, unidadOriginal, unidadConvertida;
    
    switch (tipoConversion) {
        case 'cm_pulg':
            resultado = val / 2.54;
            unidadOriginal = 'cm';
            unidadConvertida = 'pulg';
            break;
        case 'pulg_cm':
            resultado = val * 2.54;
            unidadOriginal = 'pulg';
            unidadConvertida = 'cm';
            break;
        case 'cm_mm':
            resultado = val * 10;
            unidadOriginal = 'cm';
            unidadConvertida = 'mm';
            break;
        case 'mm_cm':
            resultado = val / 10;
            unidadOriginal = 'mm';
            unidadConvertida = 'cm';
            break;
        case 'm_cm':
            resultado = val * 100;
            unidadOriginal = 'm';
            unidadConvertida = 'cm';
            break;
        case 'cm_m':
            resultado = val / 100;
            unidadOriginal = 'cm';
            unidadConvertida = 'm';
            break;
        case 'm_mm':
            resultado = val * 1000;
            unidadOriginal = 'm';
            unidadConvertida = 'mm';
            break;
        case 'mm_m':
            resultado = val / 1000;
            unidadOriginal = 'mm';
            unidadConvertida = 'm';
            break;
        default:
            resultado = val;
            unidadOriginal = '-';
            unidadConvertida = '-';
    }
    
    return {
        valorOriginal: val,
        valorConvertido: parseFloat(resultado.toFixed(3)),
        unidadOriginal,
        unidadConvertida
    };
}

function convertMoneda(inputs) {
    const { valor, tipoConversion, tipoCambio } = inputs;
    
    const val = parseFloat(valor);
    const cambio = parseFloat(tipoCambio || 1.1);
    let resultado, monedaOriginal, monedaConvertida;
    
    switch (tipoConversion) {
        case 'eur_usd':
            resultado = val * cambio;
            monedaOriginal = 'EUR';
            monedaConvertida = 'USD';
            break;
        case 'usd_eur':
            resultado = val / cambio;
            monedaOriginal = 'USD';
            monedaConvertida = 'EUR';
            break;
        default:
            resultado = val;
            monedaOriginal = '-';
            monedaConvertida = '-';
    }
    
    return {
        valorOriginal: `${val} ${monedaOriginal}`,
        valorConvertido: `${parseFloat(resultado.toFixed(2))} ${monedaConvertida}`,
        tipoCambio: cambio
    };
}

function calculateIluminacion(inputs) {
    const { superficie, tipoHabitacion } = inputs;
    
    const m2 = parseFloat(superficie);
    const luxPorM2 = {
        salon: 300,
        dormitorio: 150,
        cocina: 500,
        bano: 400,
        oficina: 500,
        pasillo: 100,
        terraza: 200
    };
    
    const luxNecesarios = luxPorM2[tipoHabitacion] || 300;
    const lumenesTotales = m2 * luxNecesarios;
    const wattsLed = Math.ceil(lumenesTotales / 100);
    const recomendacion = wattsLed <= 1 ? '1 punto de luz' : `${Math.ceil(wattsLed / 2)}-downlights oapliques LED`;
    
    return {
        tipoHabitacion: tipoHabitacion,
        superficie: m2,
        luxNecesarios,
        lumenesTotales: Math.round(lumenesTotales),
        wattsLed,
        recomendacion
    };
}

function calculateAreaPared(inputs) {
    const { numParedes, ancho, alto, numPuertas, anchoPuerta, altoPuerta, numVentanas, anchoVentana, altoVentana } = inputs;
    
    const paredes = parseInt(numParedes) || 1;
    const anchoP = parseFloat(ancho);
    const altoP = parseFloat(alto);
    
    const areaUnaPared = anchoP * altoP;
    const areaTotalParedes = areaUnaPared * paredes;
    
    const puertas = parseInt(numPuertas) || 0;
    const puertaAncho = parseFloat(anchoPuerta) || 0.9;
    const puertaAlto = parseFloat(altoPuerta) || 2.1;
    const areaPuertas = puertas * puertaAncho * puertaAlto;
    
    const ventanas = parseInt(numVentanas) || 0;
    const ventanaAncho = parseFloat(anchoVentana) || 1.2;
    const ventanaAlto = parseFloat(altoVentana) || 1.5;
    const areaVentanas = ventanas * ventanaAncho * ventanaAlto;
    
    const areaPintar = areaTotalParedes - areaPuertas - areaVentanas;
    
    return {
        areaTotalParedes: parseFloat(areaTotalParedes.toFixed(2)),
        areaPuertas: parseFloat(areaPuertas.toFixed(2)),
        areaVentanas: parseFloat(areaVentanas.toFixed(2)),
        areaPintar: parseFloat(Math.max(0, areaPintar).toFixed(2))
    };
}

function calculateEscalera(inputs) {
    const { alturaTotal, huella, contrahuella } = inputs;
    
    const altura = parseFloat(alturaTotal);
    const huellaCm = parseFloat(huella);
    const contrahuellaCm = parseFloat(contrahuella);
    
    const alturaM = altura;
    const contrahuellaM = contrahuellaCm / 100;
    const huellaM = huellaCm / 100;
    
    const numEscalones = Math.ceil(alturaM / contrahuellaM);
    const alturaRealEscalon = (alturaM / numEscalones) * 100;
    const longitudTotal = (numEscalones - 1) * huellaM;
    const pendiente = Math.atan(contrahuellaM / huellaM) * (180 / Math.PI);
    
    return {
        numEscalones,
        alturaRealEscalon: parseFloat(alturaRealEscalon.toFixed(1)),
        longitudTotal: parseFloat(longitudTotal.toFixed(2)),
        pendiente: parseFloat(pendiente.toFixed(1))
    };
}

async function saveCalculation(userId, calculatorType, inputs, outputs) {
    try {
        await pool.query(
            `INSERT INTO calculator_history (user_id, calculator_type, inputs, outputs) VALUES ($1, $2, $3, $4)`,
            [userId, calculatorType, JSON.stringify(inputs), JSON.stringify(outputs)]
        );
    } catch (err) {
        console.error('[CALCULADORA] Error saving calculation:', err.message);
    }
}

async function getHistory(userId, calculatorType, limit = 20) {
    try {
        const result = await pool.query(
            `SELECT * FROM calculator_history 
             WHERE user_id = $1 AND ($2::text IS NULL OR calculator_type = $2)
             ORDER BY created_at DESC LIMIT $3`,
            [userId, calculatorType, limit]
        );
        return result.rows;
    } catch (err) {
        console.error('[CALCULADORA] Error getting history:', err.message);
        return [];
    }
}

async function getCalculatorHistory(userId, calculatorType) {
    return getHistory(userId, calculatorType, 50);
}

module.exports = {
    calculateMargen,
    calculateCantidad,
    calculateCortinero,
    calculatePapelPintado,
    calculateSuelo,
    calculatePersianas,
    calculateRodapies,
    calculateDescuentos,
    calculatePresupuesto,
    calculatePrecioHora,
    convertUnidades,
    convertMedidas,
    convertMoneda,
    calculateIluminacion,
    calculateAreaPared,
    calculateEscalera,
    saveCalculation,
    getCalculatorHistory
};
