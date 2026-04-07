const RUTA_NACIONAL = {
    origin: 'Barcelona',
    origin_code: 'BCN',
    destination: 'Madrid',
    transit: '24h',
    options: 3,
};

const RUTA_CANARIAS = {
    origin: 'Barcelona',
    origin_code: 'BCN',
    destination: 'Las Palmas',
    transit: '48h',
    options: 2,
};

const RUTA_AEREO = {
    origin: 'Barcelona',
    origin_code: 'BCN',
    destination: 'New York',
    transit: '2-3 días',
    options: 5,
    company: 'Iberia Cargo',
    airline: 'IB',
    frequency: 'Diaria',
};

const RUTA_GRUPAJE = {
    origin: 'Barcelona',
    origin_code: 'BCN',
    destination: 'Buenos Aires',
    transit: '15-20 días',
    options: 1,
    freight_per_cbm: 85,
    fob_fixed: 120,
    fob_variable_per_cbm: 12,
};

const RUTA_CONTENEDOR = {
    origin: 'Barcelona',
    origin_code: 'BCN',
    destination: 'Shanghai',
    transit: '25-30 días',
    options: 1,
    container_20dv: { total: 2500 },
    container_40hc: { total: 3800 },
};

const ROUTES = {
    nacional: [
        { origin: 'Barcelona', origin_code: 'BCN', destination: 'Madrid', transit: '24h', options: 3 },
        { origin: 'Barcelona', origin_code: 'BCN', destination: 'Valencia', transit: '24h', options: 2 },
        { origin: 'Barcelona', origin_code: 'BCN', destination: 'Sevilla', transit: '48h', options: 2 },
        { origin: 'Barcelona', origin_code: 'BCN', destination: 'Bilbao', transit: '24h', options: 2 },
        { origin: 'Barcelona', origin_code: 'BCN', destination: 'Palma de Mallorca', transit: '24h', options: 1 },
        { origin: 'Madrid', origin_code: 'MAD', destination: 'Barcelona', transit: '24h', options: 3 },
        { origin: 'Madrid', origin_code: 'MAD', destination: 'Valencia', transit: '24h', options: 2 },
        { origin: 'Madrid', origin_code: 'MAD', destination: 'Sevilla', transit: '24h', options: 2 },
        { origin: 'Madrid', origin_code: 'MAD', destination: 'Bilbao', transit: '24h', options: 2 },
        { origin: 'Madrid', origin_code: 'MAD', destination: 'Palma de Mallorca', transit: '48h', options: 1 },
    ],
    canarias: [
        { origin: 'Barcelona', origin_code: 'BCN', destination: 'Las Palmas', transit: '48-72h', options: 2 },
        { origin: 'Barcelona', origin_code: 'BCN', destination: 'Santa Cruz de Tenerife', transit: '48-72h', options: 2 },
        { origin: 'Madrid', origin_code: 'MAD', destination: 'Las Palmas', transit: '48h', options: 2 },
        { origin: 'Madrid', origin_code: 'MAD', destination: 'Santa Cruz de Tenerife', transit: '48h', options: 2 },
    ],
    aereo: [
        { origin: 'Barcelona', origin_code: 'BCN', destination: 'New York', transit: '2-3 días', options: 5, company: 'Iberia Cargo', airline: 'IB', frequency: 'Diaria' },
        { origin: 'Barcelona', origin_code: 'BCN', destination: 'London', transit: '1-2 días', options: 3, company: 'British Airways', airline: 'BA', frequency: 'Diaria' },
        { origin: 'Barcelona', origin_code: 'BCN', destination: 'Paris', transit: '1 día', options: 4, company: 'Air France', airline: 'AF', frequency: 'Diaria' },
        { origin: 'Madrid', origin_code: 'MAD', destination: 'New York', transit: '2-3 días', options: 4, company: 'Iberia Cargo', airline: 'IB', frequency: 'Diaria' },
        { origin: 'Madrid', origin_code: 'MAD', destination: 'Miami', transit: '2-3 días', options: 3, company: 'American Airlines', airline: 'AA', frequency: '5x semana' },
    ],
    grupaje: [
        { origin: 'Barcelona', origin_code: 'BCN', destination: 'Buenos Aires', transit: '15-20 días', options: 1, freight_per_cbm: 85, fob_fixed: 120, fob_variable_per_cbm: 12 },
        { origin: 'Barcelona', origin_code: 'BCN', destination: 'Santos', transit: '12-18 días', options: 1, freight_per_cbm: 75, fob_fixed: 110, fob_variable_per_cbm: 10 },
        { origin: 'Barcelona', origin_code: 'BCN', destination: 'Cartagena', transit: '10-15 días', options: 1, freight_per_cbm: 65, fob_fixed: 100, fob_variable_per_cbm: 8 },
    ],
    contenedor: [
        { origin: 'Barcelona', origin_code: 'BCN', destination: 'Shanghai', transit: '25-30 días', options: 1, container_20dv: { total: 2500 }, container_40hc: { total: 3800 } },
        { origin: 'Barcelona', origin_code: 'BCN', destination: 'New York', transit: '12-15 días', options: 1, container_20dv: { total: 3200 }, container_40hc: { total: 4500 } },
        { origin: 'Barcelona', origin_code: 'BCN', destination: 'Buenos Aires', transit: '18-22 días', options: 1, container_20dv: { total: 2800 }, container_40hc: { total: 4000 } },
        { origin: 'Valencia', origin_code: 'VLC', destination: 'Shanghai', transit: '28-32 días', options: 1, container_20dv: { total: 2600 }, container_40hc: { total: 3900 } },
    ],
};

const TARIFFS = {
    nacional: {
        minimum: 25,
        rate_per_kg: 0.45,
        reexpedition_rate_per_kg: 0.35,
        volumetric_divisor: 3000,
        route: 'Barcelona - Madrid',
        origin: 'Barcelona',
        destination: 'Madrid',
    },
    canarias: {
        minimum: 80,
        customs_dua: 150,
        rate_per_cbm: 95,
        t3_per_kg: 0.12,
        route: 'Barcelona - Las Palmas',
        origin: 'Barcelona',
        destination: 'Las Palmas',
    },
    aereo: {
        minimum: 120,
        rate_300kg: 3.50,
        rate_500kg: 2.80,
        frequency: 'Diaria',
        company: 'Iberia Cargo',
        airline: 'IB',
    },
    grupaje: {
        freight_per_cbm: 85,
        fob_fixed: 120,
        fob_variable_per_cbm: 12,
        transit: '15-20 días',
        destination: 'Buenos Aires',
    },
    contenedor: {
        container_20dv: { total: 2500 },
        container_40hc: { total: 3800 },
        transit: '25-30 días',
        destination: 'Shanghai',
    },
};

function getRoutes({ mode, origin }) {
    let items = ROUTES[mode] || [];
    if (origin) {
        items = items.filter(item => item.origin === origin);
    }
    return { items };
}

function getTariffs({ mode, origin, destination }) {
    return TARIFFS[mode] || {};
}

function createQuote(payload) {
    const mode = payload.mode;
    const base = {
        currency: 'EUR',
        mode,
        origin: payload.origin,
        destination: payload.destination,
        carrier: 'Tarifas EGEA',
        transit: 'Consultar',
        breakdown: [],
        metadata: {
            validity: {
                valid_from: new Date().toISOString().split('T')[0],
                valid_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            },
            surcharges: {},
        },
    };

    if (mode === 'nacional' || mode === 'canarias') {
        const weight = payload.weight_kg || 0;
        const rate = mode === 'canarias' ? 0.95 : 0.45;
        const minimum = mode === 'canarias' ? 80 : 25;
        const total = Math.max(minimum, weight * rate);

        base.total = total;
        base.breakdown = [
            { code: 'base', label: 'Tarifa base', value: total, unit: 'EUR' },
            { code: 'weight', label: `Peso: ${weight} kg`, value: weight * rate, unit: 'EUR' },
        ];

        if (mode === 'canarias') {
            base.breakdown.push({ code: 'dua', label: 'DUA', value: 150, unit: 'EUR' });
            base.total += 150;
        }
    } else if (mode === 'aereo') {
        const kg = payload.chargeable_kg || 0;
        const rate = kg > 500 ? 2.80 : kg > 300 ? 3.50 : 4.20;
        const minimum = 120;
        const total = Math.max(minimum, kg * rate);

        base.total = total;
        base.carrier = 'Iberia Cargo';
        base.transit = '2-3 días';
        base.breakdown = [
            { code: 'freight', label: 'Flete aéreo', value: kg * rate, unit: 'EUR/kg' },
            { code: 'minimum', label: 'Mínimo', value: minimum, unit: 'EUR' },
        ];
    } else if (mode === 'grupaje') {
        const cbm = payload.cbm || 0;
        const freight = cbm * 85;
        const fob = 120 + cbm * 12;
        const total = freight + fob;

        base.total = total;
        base.carrier = 'Grupaje Marítimo';
        base.transit = '15-20 días';
        base.breakdown = [
            { code: 'freight', label: 'Flete', value: freight, unit: 'EUR' },
            { code: 'fob', label: 'FOB', value: fob, unit: 'EUR' },
        ];
    } else if (mode === 'contenedor') {
        const containerType = payload.container_type || '20DV';
        const price = containerType === '40HC' ? 3800 : 2500;

        base.total = price;
        base.carrier = 'Naviera';
        base.transit = '25-30 días';
        base.container_type = containerType;
        base.breakdown = [
            { code: 'container', label: `Contenedor ${containerType}`, value: price, unit: 'EUR' },
        ];
    }

    return base;
}

module.exports = {
    getRoutes,
    getTariffs,
    createQuote,
};
