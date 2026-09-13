-- ====================================================================
-- JOEKAT FINACE - ESQUEMA DE BASE DE DATOS SUPABASE (POSTGRESQL)
-- Aplicación móvil privada de finanzas familiares compartidas
-- ====================================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. HOGARES / FAMILIAS
CREATE TABLE IF NOT EXISTS households (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL DEFAULT 'Hogar Joel & Kat',
    invite_code VARCHAR(12) UNIQUE NOT NULL DEFAULT substring(md5(random()::text) from 1 for 8),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PERFILES DE USUARIO (Vinculados a auth.users de Supabase)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    household_id UUID REFERENCES households(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    preferred_currency VARCHAR(10) DEFAULT 'DOP',
    role VARCHAR(20) DEFAULT 'member',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MIEMBROS DEL HOGAR
CREATE TABLE IF NOT EXISTS household_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(30) DEFAULT 'owner',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(household_id, user_id)
);

-- 4. CUENTAS FINANCIERAS
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'efectivo', 'conjunta', 'joel', 'kat', 'tarjeta_credito', 'ahorro', 'banco', 'otro'
    balance NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    color VARCHAR(20) DEFAULT '#0A4174',
    icon VARCHAR(50) DEFAULT 'wallet',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CATEGORÍAS
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    icon VARCHAR(50) NOT NULL DEFAULT 'tag',
    color VARCHAR(20) NOT NULL DEFAULT '#49769F',
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TRANSACCIONES
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    user_name VARCHAR(100) NOT NULL, -- 'Joel' o 'Kat' para display inmediato
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    receipt_url TEXT,
    payment_method VARCHAR(50) DEFAULT 'Tarjeta / Efectivo',
    is_recurring BOOLEAN DEFAULT FALSE,
    frequency VARCHAR(30), -- 'semanal', 'quincenal', 'mensual', 'anual'
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. GASTOS FIJOS
CREATE TABLE IF NOT EXISTS fixed_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    due_day INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
    frequency VARCHAR(30) DEFAULT 'mensual',
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'upcoming')),
    last_paid_at DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PRESUPUESTOS MENSUALES
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year >= 2024),
    allocated_amount NUMERIC(14, 2) NOT NULL CHECK (allocated_amount >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(household_id, category_id, month, year)
);

-- 9. METAS DE AHORRO
CREATE TABLE IF NOT EXISTS saving_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    target_amount NUMERIC(14, 2) NOT NULL CHECK (target_amount > 0),
    current_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (current_amount >= 0),
    target_date DATE,
    icon VARCHAR(50) DEFAULT 'flag',
    color VARCHAR(20) DEFAULT '#7BBDE8',
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. APORTES A METAS
CREATE TABLE IF NOT EXISTS goal_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES saving_goals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    user_name VARCHAR(100) NOT NULL,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. CIERRES / FOTOGRAFÍAS MENSUALES (HISTORIAL CERRADO)
CREATE TABLE IF NOT EXISTS monthly_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL,
    total_income NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_expenses NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    net_savings NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    savings_rate NUMERIC(6, 2) DEFAULT 0.00,
    top_categories_json JSONB,
    closed_at TIMESTAMPTZ DEFAULT NOW(),
    closed_by_name VARCHAR(100),
    UNIQUE(household_id, month, year)
);

-- ÍNDICES PARA CONSULTAS RÁPIDAS
CREATE INDEX IF NOT EXISTS idx_transactions_household_date ON transactions(household_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_fixed_expenses_household ON fixed_expenses(household_id);
CREATE INDEX IF NOT EXISTS idx_budgets_household_month ON budgets(household_id, year, month);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS)
-- ====================================================================

ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE saving_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_snapshots ENABLE ROW LEVEL SECURITY;

-- Función de ayuda para obtener el household_id del usuario logueado
CREATE OR REPLACE FUNCTION get_current_user_household_id()
RETURNS UUID AS $$
    SELECT household_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Políticas de seguridad basadas en el hogar del usuario
CREATE POLICY "Acceso a perfiles del propio hogar" ON profiles
    FOR ALL USING (id = auth.uid() OR household_id = get_current_user_household_id());

CREATE POLICY "Acceso a cuentas del propio hogar" ON accounts
    FOR ALL USING (household_id = get_current_user_household_id());

CREATE POLICY "Acceso a categorias del hogar o del sistema" ON categories
    FOR ALL USING (household_id = get_current_user_household_id() OR household_id IS NULL);

CREATE POLICY "Acceso a transacciones del propio hogar" ON transactions
    FOR ALL USING (household_id = get_current_user_household_id());

CREATE POLICY "Acceso a gastos fijos del propio hogar" ON fixed_expenses
    FOR ALL USING (household_id = get_current_user_household_id());

CREATE POLICY "Acceso a presupuestos del propio hogar" ON budgets
    FOR ALL USING (household_id = get_current_user_household_id());

CREATE POLICY "Acceso a metas de ahorro del propio hogar" ON saving_goals
    FOR ALL USING (household_id = get_current_user_household_id());

CREATE POLICY "Acceso a snapshots mensuales del propio hogar" ON monthly_snapshots
    FOR ALL USING (household_id = get_current_user_household_id());

-- ====================================================================
-- CATEGORÍAS INICIALES DEL SISTEMA
-- ====================================================================

-- Categorías de Ingreso
INSERT INTO categories (name, type, icon, color, is_system) VALUES
('Salario Joel', 'income', 'briefcase', '#0A4174', true),
('Salario Kat', 'income', 'briefcase', '#49769F', true),
('Fotografía', 'income', 'camera', '#4E8EA2', true),
('Medicina', 'income', 'activity', '#6EA2B3', true),
('Negocio', 'income', 'trending-up', '#001D39', true),
('Freelance', 'income', 'laptop', '#7BBDE8', true),
('Bonificación', 'income', 'award', '#0A4174', true),
('Inversiones', 'income', 'pie-chart', '#49769F', true),
('Otros Ingresos', 'income', 'plus-circle', '#6EA2B3', true)
ON CONFLICT DO NOTHING;

-- Categorías de Gasto
INSERT INTO categories (name, type, icon, color, is_system) VALUES
('Hogar', 'expense', 'home', '#001D39', true),
('Supermercado', 'expense', 'shopping-cart', '#0A4174', true),
('Restaurantes', 'expense', 'coffee', '#49769F', true),
('Transporte', 'expense', 'truck', '#4E8EA2', true),
('Gasolina', 'expense', 'droplet', '#6EA2B3', true),
('Salud', 'expense', 'heart', '#7BBDE8', true),
('Medicamentos', 'expense', 'shield', '#0A4174', true),
('Educación', 'expense', 'book', '#49769F', true),
('Internet', 'expense', 'wifi', '#4E8EA2', true),
('Electricidad', 'expense', 'zap', '#001D39', true),
('Agua', 'expense', 'droplet', '#7BBDE8', true),
('Teléfono', 'expense', 'smartphone', '#6EA2B3', true),
('Suscripciones', 'expense', 'tv', '#4E8EA2', true),
('Entretenimiento', 'expense', 'film', '#0A4174', true),
('Ropa', 'expense', 'shopping-bag', '#49769F', true),
('Viajes', 'expense', 'compass', '#7BBDE8', true),
('Fotografía Equipo', 'expense', 'camera', '#4E8EA2', true),
('Trabajo', 'expense', 'briefcase', '#001D39', true),
('Familia', 'expense', 'users', '#6EA2B3', true),
('Otros Gastos', 'expense', 'help-circle', '#8E9AA8', true)
ON CONFLICT DO NOTHING;
