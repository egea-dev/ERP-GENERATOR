import { CONTAINER_TYPES, ENVIO_MODES, FIXED_ORIGINS } from './enviosConfig';

const SURCHARGE_LABELS = {
  comb: 'Combustible',
  seg: 'Seguro ambiental',
  imo: 'IMO',
  bm: 'BM',
  bk: 'BK',
  eca: 'ECA',
};

function parseNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number.parseFloat(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatModeLabel(mode) {
  return ENVIO_MODES.find((item) => item.value === mode)?.label || mode;
}

export function formatNumber(value, maximumFractionDigits = 2) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return '-';

  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(numericValue);
}

export function formatCurrency(value, currency = 'EUR') {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return '-';

  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
}

export function formatDate(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function calculatePackagesCbm(packages = []) {
  return packages.reduce((sum, item) => {
    const length = parseNumber(item.length_cm);
    const width = parseNumber(item.width_cm);
    const height = parseNumber(item.height_cm);

    if (!length || !width || !height) {
      return sum;
    }

    return sum + (length * width * height) / 1000000;
  }, 0);
}

export function normalizeRouteItems(data) {
  return Array.isArray(data?.items) ? data.items : [];
}

export function getOriginOptions(items = []) {
  const seen = new Map();

  items.forEach((item) => {
    if (!item?.origin) return;

    if (!seen.has(item.origin)) {
      seen.set(item.origin, {
        value: item.origin,
        label: item.origin_code ? `${item.origin} (${item.origin_code})` : item.origin,
        code: item.origin_code || null,
      });
    }
  });

  return Array.from(seen.values()).sort((left, right) => left.label.localeCompare(right.label, 'es'));
}

export function getDestinationOptions(items = []) {
  const seen = new Map();

  items.forEach((item) => {
    if (!item?.destination) return;

    if (!seen.has(item.destination)) {
      const labelParts = [item.destination];
      if (item.transit) labelParts.push(item.transit);
      if (item.options) labelParts.push(`${item.options} opciones`);

      seen.set(item.destination, {
        value: item.destination,
        label: labelParts.join(' · '),
      });
    }
  });

  return Array.from(seen.values()).sort((left, right) => left.value.localeCompare(right.value, 'es'));
}

export function resolvePreferredOrigin(mode, originOptions = [], currentOrigin = '') {
  if (currentOrigin && originOptions.some((item) => item.value === currentOrigin)) {
    return currentOrigin;
  }

  const fixedOrigin = FIXED_ORIGINS[mode];
  if (fixedOrigin && originOptions.some((item) => item.value === fixedOrigin)) {
    return fixedOrigin;
  }

  if (originOptions.length === 1) {
    return originOptions[0].value;
  }

  return fixedOrigin || '';
}

export function shouldLoadTariffPreview(form) {
  return Boolean(form.origin && form.destination);
}

export function getSelectedRouteInfo(items = [], destination = '') {
  if (!destination) return null;
  return items.find((item) => item.destination === destination) || null;
}

export function buildFieldKey(packageIndex, field) {
  return `packages.${packageIndex}.${field}`;
}

export function validateEnviosForm(mode, form) {
  const errors = {};

  if (!form.origin) {
    errors.origin = 'Selecciona un origen valido.';
  }

  if (!form.destination) {
    errors.destination = 'Selecciona un destino valido.';
  }

  if (mode === 'nacional' || mode === 'canarias') {
    const weight = parseNumber(form.weight_kg);
    if (!weight || weight <= 0) {
      errors.weight_kg = 'Indica un peso total mayor que 0 kg.';
    }

    if (!Array.isArray(form.packages) || form.packages.length === 0) {
      errors.packages = 'Añade al menos un bulto.';
    }

    (form.packages || []).forEach((pkg, index) => {
      const length = parseNumber(pkg.length_cm);
      const width = parseNumber(pkg.width_cm);
      const height = parseNumber(pkg.height_cm);

      if (!length || length <= 0) {
        errors[buildFieldKey(index, 'length_cm')] = 'El largo debe ser mayor que 0 cm.';
      }

      if (!width || width <= 0) {
        errors[buildFieldKey(index, 'width_cm')] = 'El ancho debe ser mayor que 0 cm.';
      }

      if (!height || height <= 0) {
        errors[buildFieldKey(index, 'height_cm')] = 'El alto debe ser mayor que 0 cm.';
      }
    });
  }

  if (mode === 'aereo') {
    const chargeableKg = parseNumber(form.chargeable_kg);
    if (!chargeableKg || chargeableKg <= 0) {
      errors.chargeable_kg = 'Indica los kg tasables.';
    }
  }

  if (mode === 'grupaje') {
    const cbm = parseNumber(form.cbm);
    if (!cbm || cbm <= 0) {
      errors.cbm = 'Indica un CBM mayor que 0.';
    }
  }

  if (mode === 'contenedor') {
    if (!CONTAINER_TYPES.some((item) => item.value === form.container_type)) {
      errors.container_type = 'Selecciona un tipo de contenedor valido.';
    }
  }

  return errors;
}

export function getFirstValidationError(errors = {}) {
  return Object.values(errors)[0] || '';
}

export function buildQuotePayload(mode, form) {
  const basePayload = {
    mode,
    origin: form.origin,
    destination: form.destination,
  };

  if (mode === 'nacional' || mode === 'canarias') {
    return {
      ...basePayload,
      weight_kg: parseNumber(form.weight_kg),
      packages: form.packages.map((pkg) => ({
        length_cm: parseNumber(pkg.length_cm),
        width_cm: parseNumber(pkg.width_cm),
        height_cm: parseNumber(pkg.height_cm),
      })),
    };
  }

  if (mode === 'aereo') {
    return {
      ...basePayload,
      chargeable_kg: parseNumber(form.chargeable_kg),
    };
  }

  if (mode === 'grupaje') {
    return {
      ...basePayload,
      origin: form.origin || FIXED_ORIGINS.grupaje,
      cbm: parseNumber(form.cbm),
    };
  }

  if (mode === 'contenedor') {
    return {
      ...basePayload,
      container_type: form.container_type,
    };
  }

  return basePayload;
}

export function getUserFacingEnviosError(error) {
  if (error?.code === 'UPSTREAM_AUTH_ERROR' || error?.status === 503) {
    return 'La conexion segura con el servicio de envios no esta disponible. Contacta con soporte.';
  }

  if (error?.status === 422) {
    return error.message || 'Revisa los datos introducidos antes de calcular.';
  }

  if (error?.status === 404) {
    return error.message || 'No se encontro una ruta disponible para esta combinacion.';
  }

  if (error?.status === 504) {
    return 'La API de envios ha tardado demasiado en responder. Intentalo de nuevo.';
  }

  return error?.message || 'No se pudo completar la operacion de envios.';
}

export function formatBreakdownValue(item, currency = 'EUR') {
  const value = Number(item?.value);
  const unit = item?.unit || '';

  if (!Number.isFinite(value)) {
    return '-';
  }

  if (unit === 'EUR') {
    return formatCurrency(value, currency);
  }

  if (unit === 'EUR/kg') {
    return `${formatCurrency(value, currency)} / kg`;
  }

  return `${formatNumber(value, unit === 'cbm' ? 3 : 2)} ${unit}`.trim();
}

export function getTariffPreviewCards(mode, tariffData) {
  const items = normalizeRouteItems(tariffData);
  if (!items.length) return [];

  if (mode === 'aereo') {
    return items.map((item) => ({
      id: `${item.company}-${item.airline}`,
      title: item.company || 'Opcion aerea',
      subtitle: item.airline || 'Sin aerolinea',
      metrics: [
        { label: 'Minimo', value: formatCurrency(item.minimum) },
        { label: '300 kg', value: item.rate_300kg ? `${formatCurrency(item.rate_300kg)} / kg` : '-' },
        { label: '500 kg', value: item.rate_500kg ? `${formatCurrency(item.rate_500kg)} / kg` : '-' },
        { label: 'Frecuencia', value: item.frequency || '-' },
      ],
    }));
  }

  if (mode === 'grupaje') {
    const item = items[0];
    return [{
      id: `${item.origin}-${item.destination}`,
      title: item.destination,
      subtitle: item.transit ? `Transito ${item.transit}` : 'Base grupaje',
      metrics: [
        { label: 'Flete / CBM', value: formatCurrency(item.freight_per_cbm) },
        { label: 'FOB fijo', value: formatCurrency(item.fob_fixed) },
        { label: 'FOB variable', value: `${formatCurrency(item.fob_variable_per_cbm)} / cbm` },
      ],
    }];
  }

  if (mode === 'contenedor') {
    const item = items[0];
    return [{
      id: `${item.origin}-${item.destination}`,
      title: item.destination,
      subtitle: item.transit ? `Transito ${item.transit}` : 'Base contenedor',
      metrics: [
        { label: '20DV', value: formatCurrency(item.container_20dv?.total) },
        { label: '40HC', value: formatCurrency(item.container_40hc?.total) },
        { label: 'Origen', value: item.origin_code ? `${item.origin} (${item.origin_code})` : item.origin },
      ],
    }];
  }

  if (mode === 'canarias') {
    const item = items[0];
    return [{
      id: item.route,
      title: item.route || `${item.origin} - ${item.destination}`,
      subtitle: 'Base canarias',
      metrics: [
        { label: 'Minimo', value: formatCurrency(item.minimum) },
        { label: 'DUA', value: formatCurrency(item.customs_dua) },
        { label: 'Tarifa CBM', value: `${formatCurrency(item.rate_per_cbm)} / cbm` },
        { label: 'T3 / kg', value: `${formatCurrency(item.t3_per_kg)} / kg` },
      ],
    }];
  }

  const item = items[0];
  return [{
    id: item.route,
    title: item.route || `${item.origin} - ${item.destination}`,
    subtitle: 'Base nacional',
    metrics: [
      { label: 'Minimo', value: formatCurrency(item.minimum) },
      { label: 'Tarifa / kg', value: `${formatCurrency(item.rate_per_kg)} / kg` },
      { label: 'Reexpedicion', value: `${formatCurrency(item.reexpedition_rate_per_kg)} / kg` },
      { label: 'Divisor volumetrico', value: item.volumetric_divisor ? formatNumber(item.volumetric_divisor, 0) : '-' },
    ],
  }];
}

export function getMetadataEntries(metadata = {}) {
  const validity = metadata.validity || {};
  const surcharges = metadata.surcharges || {};

  const validityEntries = Object.entries(validity).map(([key, value]) => ({
    label: key.toUpperCase(),
    value: formatDate(value),
  }));

  const surchargeEntries = Object.entries(surcharges).map(([key, value]) => ({
    label: SURCHARGE_LABELS[key] || key.toUpperCase(),
    value: Number.isFinite(Number(value)) ? formatNumber(value, 4) : String(value),
  }));

  return {
    validityEntries,
    surchargeEntries,
  };
}
