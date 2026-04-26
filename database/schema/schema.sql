-- User / Perfil simplificado para o dono da agenda
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela principal que armazena os eventos independente do tipo
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL, -- Enum: 'Tarefa', 'Compromisso', 'Projeto', 'Rotina', 'Atividade'
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    priority VARCHAR(50) DEFAULT 'Média', -- Enum: 'Alta', 'Média', 'Baixa'
    category VARCHAR(100) DEFAULT 'Pessoal', -- Enum: 'Trabalho', 'Pessoal', 'Projetos'
    status VARCHAR(50) DEFAULT 'Pendente', -- Enum: 'Pendente', 'Em Andamento', 'Concluído', 'Cancelado'
    objective TEXT, -- Especifico para tipo "Projeto"
    location VARCHAR(255),
    color VARCHAR(100) DEFAULT 'bg-blue-100 border-blue-200 text-blue-700',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela central de Steps/Checklist (ligado aos Projetos e Atividades - ou até mesmo tarefas num futuro)
CREATE TABLE IF NOT EXISTS event_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    text VARCHAR(255) NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    step_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para Participants/Acompanhantes num evento ou projeto
CREATE TABLE IF NOT EXISTS event_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices para otimização de busca rápida de timeline (onde a dashboard requer mais processamento)
CREATE INDEX IF NOT EXISTS idx_events_dates ON events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id);
