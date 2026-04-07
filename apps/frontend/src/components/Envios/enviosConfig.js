export const ENVIO_MODES = [
  {
    value: 'nacional',
    label: 'Nacional',
    emoji: '🚚',
    eyebrow: 'Península y Baleares',
    description: 'Cotización con peso total y bultos.',
  },
  {
    value: 'canarias',
    label: 'Canarias',
    emoji: '🏝️',
    eyebrow: 'Insular con DUA',
    description: 'Incluye recargos y operativa específica.',
  },
  {
    value: 'aereo',
    label: 'Aéreo',
    emoji: '✈️',
    eyebrow: 'Exprés internacional',
    description: 'Calculado sobre kilos tasables.',
  },
  {
    value: 'grupaje',
    label: 'Grupaje',
    emoji: '📦',
    eyebrow: 'LCL desde Barcelona',
    description: 'Volumen CBM para consolidado marítimo.',
  },
  {
    value: 'contenedor',
    label: 'Contenedor',
    emoji: '🚢',
    eyebrow: 'FCL 20DV / 40HC',
    description: 'Operación completa con origen marítimo.',
  },
];

export const CONTAINER_TYPES = [
  { value: '20DV', label: '20DV' },
  { value: '40HC', label: '40HC' },
];

export const FIXED_ORIGINS = {};

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `pkg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyPackage() {
  return {
    id: createId(),
    length_cm: '',
    width_cm: '',
    height_cm: '',
  };
}

export function createInitialEnviosForm(mode = 'nacional') {
  return {
    origin: FIXED_ORIGINS[mode] || '',
    destination: '',
    weight_kg: '',
    chargeable_kg: '',
    cbm: '',
    container_type: '20DV',
    packages: mode === 'nacional' || mode === 'canarias' ? [createEmptyPackage()] : [],
  };
}

export function getModeDefinition(mode) {
  return ENVIO_MODES.find((item) => item.value === mode) || ENVIO_MODES[0];
}
