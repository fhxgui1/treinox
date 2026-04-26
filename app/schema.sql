-- ==========================================
-- ESTRUTURA DO APLICATIVO DE TREINO AVANÇADO
-- ==========================================

-- 1. Catálogo Base de Exercícios
-- Esta é a lista fixa do banco de dados (ex: 'Supino Reto', 'Leg Press')
-- Garantindo que o nome permaneça exato para agrupar análises ao longo do tempo.
CREATE TABLE exercise_catalog (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL, -- Exemplo: 'Supino Máquina'
    muscle_group VARCHAR(100) NOT NULL -- Exemplo: 'Peitoral'
);

-- 2. Programas / Fichas de Treino do Usuário
-- Um usuário pode ter várias fichas, mas apenas UMA está ativa por vez.
CREATE TABLE training_programs (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL, -- Relacionamento com tabela auth.users (Supabase/Neon etc)
    name VARCHAR(255) NOT NULL, -- Exemplo: 'Hipertrofia 2024'
    focus VARCHAR(255), -- Exemplo: 'Costas, Peito e Pernas'
    is_active BOOLEAN DEFAULT FALSE, -- Flag para "Usar Imediatamente / Ficha Ativa"
    current_session_index INT DEFAULT 0, -- Guarda a sequência da divisão (ex: 0=Treino A)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Para garantir que o usuário só tem UMA ficha ativa ao mesmo tempo
CREATE UNIQUE INDEX trk_active_program_idx ON training_programs(user_id) WHERE is_active = TRUE;

-- 3. Diarização (Divisões/Seções) de um Programa
-- Representa os dias da Ficha (Ex: Treino A, Treino B, Dia 1, Costas)
CREATE TABLE training_sessions (
    id SERIAL PRIMARY KEY,
    program_id INT REFERENCES training_programs(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL, -- Exemplo: 'A - Peito'
    sequence_order INT NOT NULL -- Mantém a ordem: 0 (A), 1 (B), 2 (C)...
);

-- 4. Exercícios Especificados Dentro da Divisão (Sessão)
-- Corresponde exatamente ao mapeamento do "Construtor de Fichas"
CREATE TABLE program_exercises (
    id SERIAL PRIMARY KEY,
    session_id INT REFERENCES training_sessions(id) ON DELETE CASCADE,
    exercise_catalog_id INT REFERENCES exercise_catalog(id) ON DELETE RESTRICT,
    sets INT NOT NULL, -- Ex: 4 séries
    target_reps INT NOT NULL, -- Ex: 10 a 12 de forma estática como '10' repetiçōes únicas
    sequence_order INT NOT NULL -- Define qual exercício aparece primeiro no App
);

-- ==========================================
-- ESTRUTURA PARA REGISTRO HISTÓRICO / DASHBOARD
-- ==========================================

-- 5. Histórico da Sessão Concluída
-- Registrado toda vez que você clica em "Finalizar Treino" na tela
CREATE TABLE workout_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    program_id INT REFERENCES training_programs(id) ON DELETE SET NULL, -- Qual ficha era na hora do treino
    session_id INT REFERENCES training_sessions(id) ON DELETE SET NULL, -- Qual dia de treino
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_volume_load DECIMAL(10, 2) NOT NULL -- Volume global (soma total: Carga x Reps desta sessão inteira)
);

-- 6. Histórico Granular de Execução (Volume e Reps Diárias)
-- Alimenta os gráficos de área da tela "Análise de Exercício" específico
CREATE TABLE workout_exercise_logs (
    id SERIAL PRIMARY KEY,
    workout_log_id INT REFERENCES workout_logs(id) ON DELETE CASCADE,
    program_exercise_id INT REFERENCES program_exercises(id) ON DELETE SET NULL,
    exercise_catalog_id INT REFERENCES exercise_catalog(id) ON DELETE SET NULL, -- Ligação direta do Catálogo (crucial para o dashboard de análise específica poder puxar todo o histórico, independente da ficha)
    set_number INT NOT NULL, -- 1ª, 2ª, 3ª Série executada no dia
    actual_reps INT NOT NULL, -- Quantas reps você realmente fez
    actual_weight DECIMAL(10,2) NOT NULL, -- Carga final colocada na máquina
    volume_load DECIMAL(10,2) GENERATED ALWAYS AS (actual_reps * actual_weight) STORED, -- Calcula o Volume Load automaticamente por série (Reps x Peso)
    completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
