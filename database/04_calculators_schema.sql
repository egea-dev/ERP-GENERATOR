-- Tabla para histórico de cálculos
CREATE TABLE IF NOT EXISTS calculator_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    calculator_type TEXT NOT NULL,
    inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
    outputs JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para búsquedas
CREATE INDEX IF NOT EXISTS idx_calculator_history_user ON calculator_history(user_id);
CREATE INDEX IF NOT EXISTS idx_calculator_history_type ON calculator_history(calculator_type);
CREATE INDEX IF NOT EXISTS idx_calculator_history_created ON calculator_history(created_at DESC);

-- Tabla de favoritos de calculadoras
CREATE TABLE IF NOT EXISTS calculator_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    calculator_type TEXT NOT NULL,
    name TEXT,
    inputs JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, calculator_type, name)
);
