-- ============================================================
-- PORTAL RRHH AVA SELECCIÓN - Esquema inicial
-- Migración 001: Tablas base
-- Cumplimiento: RGPD (UE 2016/679) + LOPDGDD
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- TABLA: profiles
-- Extiende auth.users de Supabase con datos de aplicación
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT NOT NULL,
    full_name   TEXT,
    avatar_url  TEXT,
    role        TEXT NOT NULL DEFAULT 'collaborator'
                    CHECK (role IN ('admin', 'support', 'collaborator')),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    -- RGPD: Consentimiento explícito
    gdpr_consent        BOOLEAN NOT NULL DEFAULT FALSE,
    gdpr_consent_date   TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para crear perfil automáticamente al registrar usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        COALESCE(NEW.raw_user_meta_data->>'role', 'collaborator')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TABLA: employees
-- Ficha completa del empleado (datos laborales y personales)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.employees (
    id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id                  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    employee_number             TEXT UNIQUE,
    first_name                  TEXT NOT NULL,
    last_name                   TEXT NOT NULL,
    email                       TEXT NOT NULL UNIQUE,
    phone                       TEXT,
    birth_date                  DATE,
    hire_date                   DATE,
    position                    TEXT,
    department                  TEXT,
    location                    TEXT,
    manager_id                  UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    contract_type               TEXT,
    -- Datos sensibles (Art. 9 RGPD - categorías especiales NO aplica,
    -- pero son datos financieros de acceso restringido)
    salary                      NUMERIC(10, 2),
    iban                        TEXT, -- Cifrado a nivel aplicación recomendado
    social_security_number      TEXT,
    nif                         TEXT,
    -- Dirección
    address                     TEXT,
    city                        TEXT,
    postal_code                 TEXT,
    country                     TEXT NOT NULL DEFAULT 'España',
    -- Contacto de emergencia
    emergency_contact_name      TEXT,
    emergency_contact_phone     TEXT,
    -- Estado
    is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
    notes                       TEXT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_employees_profile_id ON public.employees(profile_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_is_active ON public.employees(is_active);
CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department);

-- ============================================================
-- TABLA: documents
-- Metadatos de documentos (archivos en Supabase Storage)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.documents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id     UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    uploaded_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    file_name       TEXT NOT NULL,
    file_path       TEXT NOT NULL UNIQUE,
    file_size       BIGINT NOT NULL,
    mime_type       TEXT NOT NULL,
    category        TEXT NOT NULL DEFAULT 'other'
                        CHECK (category IN ('contract', 'payslip', 'certificate', 'medical', 'id', 'other')),
    description     TEXT,
    is_confidential BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_employee_id ON public.documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_category ON public.documents(category);

-- ============================================================
-- TABLA: vacation_requests
-- Solicitudes de vacaciones y ausencias
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vacation_requests (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id         UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    start_date          DATE NOT NULL,
    end_date            DATE NOT NULL,
    days_count          INTEGER NOT NULL,
    type                TEXT NOT NULL DEFAULT 'vacation'
                            CHECK (type IN ('vacation', 'sick', 'personal', 'other')),
    reason              TEXT,
    status              TEXT NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    approved_by         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    approved_at         TIMESTAMPTZ,
    rejection_reason    TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Validación: fecha inicio <= fecha fin
    CONSTRAINT valid_dates CHECK (start_date <= end_date),
    -- Validación: días positivos
    CONSTRAINT positive_days CHECK (days_count > 0)
);

CREATE TRIGGER update_vacation_requests_updated_at
    BEFORE UPDATE ON public.vacation_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_vacation_employee_id ON public.vacation_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_vacation_status ON public.vacation_requests(status);
CREATE INDEX IF NOT EXISTS idx_vacation_dates ON public.vacation_requests(start_date, end_date);

-- ============================================================
-- TABLA: candidates
-- Candidatos en procesos de selección
-- RGPD: conservación máx. 12 meses si no contratados
-- ============================================================
CREATE TABLE IF NOT EXISTS public.candidates (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name          TEXT NOT NULL,
    last_name           TEXT NOT NULL,
    email               TEXT NOT NULL,
    phone               TEXT,
    position_applied    TEXT NOT NULL,
    department          TEXT,
    status              TEXT NOT NULL DEFAULT 'new'
                            CHECK (status IN ('new', 'screening', 'interview', 'offer', 'hired', 'rejected')),
    cv_path             TEXT,
    notes               TEXT,
    source              TEXT,
    salary_expectation  NUMERIC(10, 2),
    interview_date      TIMESTAMPTZ,
    assigned_to         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    -- RGPD: fecha de eliminación programada (máx. 12 meses)
    delete_after        TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '12 months'),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_candidates_updated_at
    BEFORE UPDATE ON public.candidates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_candidates_status ON public.candidates(status);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON public.candidates(email);
CREATE INDEX IF NOT EXISTS idx_candidates_delete_after ON public.candidates(delete_after);

-- ============================================================
-- TABLA: audit_logs
-- Registro de actividad del sistema (RGPD Art. 5.2 - responsabilidad proactiva)
-- Para el rol 'support', los datos de usuario están anonimizados vía RLS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action          TEXT NOT NULL,
    resource_type   TEXT NOT NULL,
    resource_id     TEXT,
    ip_address      INET,
    user_agent      TEXT,
    metadata        JSONB,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- ============================================================
-- TABLA: consent_records
-- Registro de consentimientos RGPD (Art. 7.1 - carga de la prueba)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.consent_records (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    consent_type    TEXT NOT NULL,
    consented       BOOLEAN NOT NULL,
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consent_records_user_id ON public.consent_records(user_id);
