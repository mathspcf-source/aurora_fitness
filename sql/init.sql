-- ============================================
-- AURORA FITNESS - SCRIPT DE INICIALIZAÇÃO
-- ============================================
-- Execute este script no SQL Editor do Supabase
-- 1. Acesse: https://app.supabase.com
-- 2. Selecione seu projeto
-- 3. Vá em "SQL Editor"
-- 4. Cole este script completo
-- 5. Clique em "Run"

-- ============================================
-- EXTENSÕES
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABELA: profiles
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('instructor', 'client')),
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE profiles IS 'Perfis de usuários (instrutores e clientes)';
COMMENT ON COLUMN profiles.user_type IS 'Tipo de usuário: instructor ou client';
COMMENT ON COLUMN profiles.password_hash IS 'Senha do usuário (hash em produção)';

-- ============================================
-- TABELA: clients
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    client_code VARCHAR(50) UNIQUE NOT NULL,
    instructor_id UUID REFERENCES profiles(id),
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    birth_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE clients IS 'Dados específicos dos clientes';
COMMENT ON COLUMN clients.client_code IS 'Código único do cliente (ex: CLI001)';

-- ============================================
-- TABELA: workout_sheets
-- ============================================
CREATE TABLE IF NOT EXISTS workout_sheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    instructor_id UUID REFERENCES profiles(id),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('A', 'B', 'C', 'D', 'E', 'custom')),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE workout_sheets IS 'Fichas de treino dos clientes';

-- ============================================
-- TABELA: exercises
-- ============================================
CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sheet_id UUID NOT NULL REFERENCES workout_sheets(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    muscle_group VARCHAR(100),
    series VARCHAR(10),
    reps VARCHAR(10),
    load VARCHAR(20),
    rest_time VARCHAR(10),
    notes TEXT,
    order_index INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE exercises IS 'Exercícios que compõem cada ficha de treino';

-- ============================================
-- TABELA: workout_logs
-- ============================================
CREATE TABLE IF NOT EXISTS workout_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    sheet_id UUID REFERENCES workout_sheets(id),
    duration_seconds INT NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    time TIME DEFAULT CURRENT_TIME,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE workout_logs IS 'Registros de treinos realizados pelos clientes';

-- ============================================
-- TABELA: backups
-- ============================================
CREATE TABLE IF NOT EXISTS backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instructor_id UUID REFERENCES profiles(id),
    backup_date TIMESTAMPTZ DEFAULT NOW(),
    backup_type VARCHAR(50) DEFAULT 'Manual',
    data JSONB,
    file_size VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE backups IS 'Registros de backups realizados pelos instrutores';

-- ============================================
-- ÍNDICES (Performance)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_clients_code ON clients(client_code);
CREATE INDEX IF NOT EXISTS idx_clients_instructor ON clients(instructor_id);
CREATE INDEX IF NOT EXISTS idx_clients_profile ON clients(profile_id);
CREATE INDEX IF NOT EXISTS idx_sheets_client ON workout_sheets(client_id);
CREATE INDEX IF NOT EXISTS idx_sheets_active ON workout_sheets(is_active);
CREATE INDEX IF NOT EXISTS idx_exercises_sheet ON exercises(sheet_id);
CREATE INDEX IF NOT EXISTS idx_logs_client ON workout_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_logs_date ON workout_logs(date);

-- ============================================
-- POLÍTICAS RLS (Row Level Security)
-- ============================================

-- Habilitar RLS em todas tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

-- ---------- POLÍTICAS: profiles ----------
CREATE POLICY "Usuários podem ver seus próprios perfis"
    ON profiles FOR SELECT
    USING (true);

CREATE POLICY "Instrutores podem criar perfis"
    ON profiles FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Usuários podem atualizar seus próprios perfis"
    ON profiles FOR UPDATE
    USING (true);

-- ---------- POLÍTICAS: clients ----------
CREATE POLICY "Qualquer um pode ver clientes"
    ON clients FOR SELECT
    USING (true);

CREATE POLICY "Instrutores podem gerenciar clientes"
    ON clients FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Instrutores podem atualizar clientes"
    ON clients FOR UPDATE
    USING (true);

CREATE POLICY "Instrutores podem deletar clientes"
    ON clients FOR DELETE
    USING (true);

-- ---------- POLÍTICAS: workout_sheets ----------
CREATE POLICY "Qualquer um pode ver fichas"
    ON workout_sheets FOR SELECT
    USING (true);

CREATE POLICY "Instrutores podem criar fichas"
    ON workout_sheets FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Instrutores podem atualizar fichas"
    ON workout_sheets FOR UPDATE
    USING (true);

CREATE POLICY "Instrutores podem deletar fichas"
    ON workout_sheets FOR DELETE
    USING (true);

-- ---------- POLÍTICAS: exercises ----------
CREATE POLICY "Qualquer um pode ver exercícios"
    ON exercises FOR SELECT
    USING (true);

CREATE POLICY "Instrutores podem gerenciar exercícios"
    ON exercises FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Instrutores podem atualizar exercícios"
    ON exercises FOR UPDATE
    USING (true);

CREATE POLICY "Instrutores podem deletar exercícios"
    ON exercises FOR DELETE
    USING (true);

-- ---------- POLÍTICAS: workout_logs ----------
CREATE POLICY "Qualquer um pode ver logs"
    ON workout_logs FOR SELECT
    USING (true);

CREATE POLICY "Clientes podem criar seus logs"
    ON workout_logs FOR INSERT
    WITH CHECK (true);

-- ---------- POLÍTICAS: backups ----------
CREATE POLICY "Instrutores podem ver backups"
    ON backups FOR SELECT
    USING (true);

CREATE POLICY "Instrutores podem criar backups"
    ON backups FOR INSERT
    WITH CHECK (true);

-- ============================================
-- FUNÇÃO: Atualizar updated_at automaticamente
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at 
    BEFORE UPDATE ON clients 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_sheets_updated_at 
    BEFORE UPDATE ON workout_sheets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DADOS DE EXEMPLO (Desenvolvimento/Teste)
-- ============================================

-- Instrutor padrão
INSERT INTO profiles (id, user_type, name, phone, password_hash) VALUES
(
    'a0000000-0000-0000-0000-000000000001',
    'instructor',
    'Matheus Pacifico',
    '79996458399',
    '123456'
) ON CONFLICT (id) DO NOTHING;

-- Clientes de exemplo
INSERT INTO profiles (id, user_type, name, phone, password_hash) VALUES
(
    'b0000000-0000-0000-0000-000000000001',
    'client',
    'João Silva',
    '79999990001',
    'cliente123'
),
(
    'b0000000-0000-0000-0000-000000000002',
    'client',
    'Maria Santos',
    '79999990002',
    'cliente123'
),
(
    'b0000000-0000-0000-0000-000000000003',
    'client',
    'Pedro Oliveira',
    '79999990003',
    'cliente123'
) ON CONFLICT (id) DO NOTHING;

-- Dados dos clientes
INSERT INTO clients (id, profile_id, client_code, instructor_id, gender, birth_date) VALUES
(
    'c0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000001',
    'CLI001',
    'a0000000-0000-0000-0000-000000000001',
    'male',
    '1990-05-15'
),
(
    'c0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000002',
    'CLI002',
    'a0000000-0000-0000-0000-000000000001',
    'female',
    '1995-08-22'
),
(
    'c0000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000003',
    'CLI003',
    'a0000000-0000-0000-0000-000000000001',
    'male',
    '1988-12-10'
) ON CONFLICT (id) DO NOTHING;

-- Fichas de exemplo para João
INSERT INTO workout_sheets (id, client_id, instructor_id, name, type, notes) VALUES
(
    'd0000000-0000-0000-0000-000000000001',
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Treino A - Peito e Tríceps',
    'A',
    'Foco em hipertrofia. Manter 60s de descanso.'
),
(
    'd0000000-0000-0000-0000-000000000002',
    'c0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Treino B - Costas e Bíceps',
    'B',
    'Cuidado com a postura na remada.'
) ON CONFLICT (id) DO NOTHING;

-- Exercícios da ficha A do João
INSERT INTO exercises (sheet_id, name, muscle_group, series, reps, load, rest_time, order_index) VALUES
(
    'd0000000-0000-0000-0000-000000000001',
    'Supino reto',
    'Peito',
    '4',
    '10',
    '60kg',
    '60',
    1
),
(
    'd0000000-0000-0000-0000-000000000001',
    'Supino inclinado',
    'Peito',
    '3',
    '12',
    '40kg',
    '60',
    2
),
(
    'd0000000-0000-0000-0000-000000000001',
    'Crucifixo',
    'Peito',
    '3',
    '15',
    '14kg',
    '45',
    3
),
(
    'd0000000-0000-0000-0000-000000000001',
    'Tríceps corda',
    'Tríceps',
    '3',
    '12',
    '25kg',
    '45',
    4
),
(
    'd0000000-0000-0000-0000-000000000001',
    'Tríceps testa',
    'Tríceps',
    '3',
    '10',
    '20kg',
    '45',
    5
);

-- Exercícios da ficha B do João
INSERT INTO exercises (sheet_id, name, muscle_group, series, reps, load, rest_time, order_index) VALUES
(
    'd0000000-0000-0000-0000-000000000002',
    'Puxada frontal',
    'Costas',
    '4',
    '10',
    '70kg',
    '60',
    1
),
(
    'd0000000-0000-0000-0000-000000000002',
    'Remada curvada',
    'Costas',
    '3',
    '12',
    '50kg',
    '60',
    2
),
(
    'd0000000-0000-0000-0000-000000000002',
    'Rosca direta',
    'Bíceps',
    '3',
    '12',
    '20kg',
    '45',
    3
),
(
    'd0000000-0000-0000-0000-000000000002',
    'Rosca martelo',
    'Bíceps',
    '3',
    '12',
    '16kg',
    '45',
    4
);

-- Logs de treino do João
INSERT INTO workout_logs (client_id, sheet_id, duration_seconds, date, time, notes) VALUES
(
    'c0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    3600,
    '2026-05-10',
    '08:00:00',
    'Treino A completo'
),
(
    'c0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000002',
    3300,
    '2026-05-12',
    '07:30:00',
    'Treino B completo'
),
(
    'c0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    3500,
    '2026-05-14',
    '08:15:00',
    'Aumentei carga no supino'
);

-- Fichas de exemplo para Maria
INSERT INTO workout_sheets (id, client_id, instructor_id, name, type, notes) VALUES
(
    'd0000000-0000-0000-0000-000000000003',
    'c0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Treino A - Pernas e Glúteos',
    'A',
    'Foco em glúteos. Executar com amplitude máxima.'
) ON CONFLICT (id) DO NOTHING;

-- Exercícios da Maria
INSERT INTO exercises (sheet_id, name, muscle_group, series, reps, load, rest_time, order_index) VALUES
(
    'd0000000-0000-0000-0000-000000000003',
    'Agachamento',
    'Quadríceps',
    '4',
    '12',
    '40kg',
    '60',
    1
),
(
    'd0000000-0000-0000-0000-000000000003',
    'Leg press',
    'Quadríceps',
    '3',
    '12',
    '80kg',
    '60',
    2
),
(
    'd0000000-0000-0000-0000-000000000003',
    'Elevação pélvica',
    'Glúteos',
    '4',
    '15',
    '30kg',
    '45',
    3
),
(
    'd0000000-0000-0000-0000-000000000003',
    'Abdução',
    'Glúteos',
    '3',
    '15',
    '25kg',
    '45',
    4
);

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '✅ Banco de dados Aurora Fitness criado com sucesso!';
    RAISE NOTICE '📊 Tabelas criadas: profiles, clients, workout_sheets, exercises, workout_logs, backups';
    RAISE NOTICE '🔐 RLS habilitado em todas as tabelas';
    RAISE NOTICE '👤 Instrutor padrão: ID=admin | Senha=123456';
    RAISE NOTICE '👤 Clientes de teste: CLI001, CLI002, CLI003 | Senha=cliente123';
END $$;
