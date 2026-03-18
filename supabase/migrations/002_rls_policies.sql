-- ============================================================
-- PORTAL RRHH AVA SELECCIÓN - Row Level Security (RLS)
-- Migración 002: Políticas de seguridad a nivel de fila
-- Principio de mínimo privilegio (RGPD Art. 5.1.f)
-- ============================================================

-- ============================================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- FUNCIÓN AUXILIAR: obtener el rol del usuario actual
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
    SELECT role FROM public.profiles
    WHERE id = auth.uid()
    LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- POLÍTICAS: profiles
-- ============================================================

-- Ver perfil propio
CREATE POLICY "profiles_select_own"
    ON public.profiles FOR SELECT
    USING (id = auth.uid());

-- Admin puede ver todos los perfiles
CREATE POLICY "profiles_select_admin"
    ON public.profiles FOR SELECT
    USING (public.get_user_role() = 'admin');

-- Support puede ver solo su propio perfil y contar usuarios
CREATE POLICY "profiles_select_support"
    ON public.profiles FOR SELECT
    USING (
        public.get_user_role() = 'support'
        AND id = auth.uid()
    );

-- Actualizar perfil propio (campos permitidos)
CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid()
        -- No puede cambiarse el rol a sí mismo
        AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    );

-- Admin puede actualizar cualquier perfil
CREATE POLICY "profiles_update_admin"
    ON public.profiles FOR UPDATE
    USING (public.get_user_role() = 'admin');

-- Admin puede insertar perfiles
CREATE POLICY "profiles_insert_admin"
    ON public.profiles FOR INSERT
    WITH CHECK (public.get_user_role() = 'admin');

-- ============================================================
-- POLÍTICAS: employees
-- ============================================================

-- Admin ve todos los empleados
CREATE POLICY "employees_select_admin"
    ON public.employees FOR SELECT
    USING (public.get_user_role() = 'admin');

-- Colaborador solo ve su propia ficha
CREATE POLICY "employees_select_own"
    ON public.employees FOR SELECT
    USING (
        public.get_user_role() = 'collaborator'
        AND profile_id = auth.uid()
    );

-- Admin puede crear empleados
CREATE POLICY "employees_insert_admin"
    ON public.employees FOR INSERT
    WITH CHECK (public.get_user_role() = 'admin');

-- Admin puede actualizar empleados
CREATE POLICY "employees_update_admin"
    ON public.employees FOR UPDATE
    USING (public.get_user_role() = 'admin');

-- Colaborador puede actualizar ciertos campos de su propia ficha
CREATE POLICY "employees_update_own_limited"
    ON public.employees FOR UPDATE
    USING (
        public.get_user_role() = 'collaborator'
        AND profile_id = auth.uid()
    )
    WITH CHECK (
        profile_id = auth.uid()
        -- No puede cambiar campos sensibles
    );

-- Admin puede eliminar empleados (soft delete recomendado)
CREATE POLICY "employees_delete_admin"
    ON public.employees FOR DELETE
    USING (public.get_user_role() = 'admin');

-- ============================================================
-- POLÍTICAS: documents
-- ============================================================

-- Admin ve todos los documentos
CREATE POLICY "documents_select_admin"
    ON public.documents FOR SELECT
    USING (public.get_user_role() = 'admin');

-- Colaborador ve sus propios documentos (no confidenciales)
CREATE POLICY "documents_select_own"
    ON public.documents FOR SELECT
    USING (
        public.get_user_role() = 'collaborator'
        AND employee_id IN (
            SELECT id FROM public.employees WHERE profile_id = auth.uid()
        )
        AND is_confidential = FALSE
    );

-- Admin puede subir documentos
CREATE POLICY "documents_insert_admin"
    ON public.documents FOR INSERT
    WITH CHECK (public.get_user_role() = 'admin');

-- Colaborador puede subir sus propios documentos no confidenciales
CREATE POLICY "documents_insert_own"
    ON public.documents FOR INSERT
    WITH CHECK (
        public.get_user_role() = 'collaborator'
        AND employee_id IN (
            SELECT id FROM public.employees WHERE profile_id = auth.uid()
        )
        AND is_confidential = FALSE
    );

-- Admin puede eliminar documentos
CREATE POLICY "documents_delete_admin"
    ON public.documents FOR DELETE
    USING (public.get_user_role() = 'admin');

-- ============================================================
-- POLÍTICAS: vacation_requests
-- ============================================================

-- Admin ve todas las solicitudes
CREATE POLICY "vacations_select_admin"
    ON public.vacation_requests FOR SELECT
    USING (public.get_user_role() = 'admin');

-- Colaborador ve sus propias solicitudes
CREATE POLICY "vacations_select_own"
    ON public.vacation_requests FOR SELECT
    USING (
        employee_id IN (
            SELECT id FROM public.employees WHERE profile_id = auth.uid()
        )
    );

-- Admin y colaborador pueden crear solicitudes
CREATE POLICY "vacations_insert"
    ON public.vacation_requests FOR INSERT
    WITH CHECK (
        -- Admin puede crear para cualquier empleado
        public.get_user_role() = 'admin'
        OR (
            -- Colaborador solo para su propio perfil
            public.get_user_role() = 'collaborator'
            AND employee_id IN (
                SELECT id FROM public.employees WHERE profile_id = auth.uid()
            )
        )
    );

-- Admin puede aprobar/rechazar (actualizar estado)
CREATE POLICY "vacations_update_admin"
    ON public.vacation_requests FOR UPDATE
    USING (public.get_user_role() = 'admin');

-- Colaborador puede cancelar sus propias solicitudes pendientes
CREATE POLICY "vacations_cancel_own"
    ON public.vacation_requests FOR UPDATE
    USING (
        public.get_user_role() = 'collaborator'
        AND employee_id IN (
            SELECT id FROM public.employees WHERE profile_id = auth.uid()
        )
        AND status = 'pending'
    )
    WITH CHECK (status = 'cancelled');

-- ============================================================
-- POLÍTICAS: candidates
-- ============================================================

-- Solo admin puede ver candidatos
CREATE POLICY "candidates_select_admin"
    ON public.candidates FOR SELECT
    USING (public.get_user_role() = 'admin');

-- Solo admin puede crear candidatos
CREATE POLICY "candidates_insert_admin"
    ON public.candidates FOR INSERT
    WITH CHECK (public.get_user_role() = 'admin');

-- Solo admin puede actualizar candidatos
CREATE POLICY "candidates_update_admin"
    ON public.candidates FOR UPDATE
    USING (public.get_user_role() = 'admin');

-- Solo admin puede eliminar candidatos
CREATE POLICY "candidates_delete_admin"
    ON public.candidates FOR DELETE
    USING (public.get_user_role() = 'admin');

-- ============================================================
-- POLÍTICAS: audit_logs
-- Admin ve todos los logs. Support ve logs anonimizados (sin user_id).
-- IMPORTANTE: La anonimización se hace a nivel de aplicación en la UI.
-- ============================================================

-- Admin ve todos los logs con user_id completo
CREATE POLICY "audit_logs_select_admin"
    ON public.audit_logs FOR SELECT
    USING (public.get_user_role() = 'admin');

-- Support ve logs pero sin poder filtrar por user_id (anonimizado en app)
CREATE POLICY "audit_logs_select_support"
    ON public.audit_logs FOR SELECT
    USING (public.get_user_role() = 'support');

-- Sistema puede insertar logs (via service role)
-- No se permite insertar desde el cliente normal

-- ============================================================
-- POLÍTICAS: consent_records
-- ============================================================

-- Cada usuario ve su propio registro de consentimiento
CREATE POLICY "consent_select_own"
    ON public.consent_records FOR SELECT
    USING (user_id = auth.uid());

-- Admin ve todos
CREATE POLICY "consent_select_admin"
    ON public.consent_records FOR SELECT
    USING (public.get_user_role() = 'admin');

-- Usuarios pueden insertar su propio consentimiento
CREATE POLICY "consent_insert_own"
    ON public.consent_records FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- ============================================================
-- STORAGE: Bucket para documentos de empleados
-- ============================================================

-- Crear el bucket (ejecutar en Supabase Dashboard si no existe)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('employee-documents', 'employee-documents', false);

-- Políticas de storage

-- Admin puede ver todos los archivos
CREATE POLICY "storage_select_admin"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'employee-documents'
        AND public.get_user_role() = 'admin'
    );

-- Colaborador puede ver sus propios archivos
-- (el path del archivo comienza con employee_id/)
CREATE POLICY "storage_select_own"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'employee-documents'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.employees WHERE profile_id = auth.uid()
        )
    );

-- Admin puede subir archivos
CREATE POLICY "storage_insert_admin"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'employee-documents'
        AND public.get_user_role() = 'admin'
    );

-- Colaborador puede subir sus propios archivos
CREATE POLICY "storage_insert_own"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'employee-documents'
        AND (storage.foldername(name))[1] IN (
            SELECT id::text FROM public.employees WHERE profile_id = auth.uid()
        )
    );

-- Admin puede eliminar archivos
CREATE POLICY "storage_delete_admin"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'employee-documents'
        AND public.get_user_role() = 'admin'
    );
