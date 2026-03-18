-- ============================================================
-- PORTAL RRHH AVA SELECCIÓN - Funciones y datos iniciales
-- Migración 003
-- ============================================================

-- ============================================================
-- FUNCIÓN: Insertar log de auditoría
-- Llamar desde el servidor con service_role para asegurar el registro
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_audit(
    p_user_id       UUID,
    p_action        TEXT,
    p_resource_type TEXT,
    p_resource_id   TEXT DEFAULT NULL,
    p_metadata      JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, metadata)
    VALUES (p_user_id, p_action, p_resource_type, p_resource_id, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCIÓN: Limpieza automática de candidatos vencidos (RGPD)
-- Ejecutar periódicamente (cron job en Supabase)
-- ============================================================
CREATE OR REPLACE FUNCTION public.cleanup_expired_candidates()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.candidates
    WHERE delete_after < NOW()
    AND status IN ('rejected', 'new', 'screening');

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    -- Log de la limpieza
    INSERT INTO public.audit_logs (action, resource_type, metadata)
    VALUES (
        'auto_delete',
        'candidates',
        jsonb_build_object('deleted_count', deleted_count, 'reason', 'RGPD_retention_policy')
    );

    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCIÓN: Exportar datos del usuario (RGPD - derecho de portabilidad)
-- ============================================================
CREATE OR REPLACE FUNCTION public.export_user_data(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    v_profile JSONB;
    v_employee JSONB;
    v_documents JSONB;
    v_vacations JSONB;
BEGIN
    -- Verificar que solo el propio usuario o admin puede exportar
    IF auth.uid() != p_user_id AND public.get_user_role() != 'admin' THEN
        RAISE EXCEPTION 'No autorizado para exportar estos datos.';
    END IF;

    -- Perfil
    SELECT row_to_json(p)::JSONB INTO v_profile
    FROM (
        SELECT id, email, full_name, role, created_at, gdpr_consent_date
        FROM public.profiles WHERE id = p_user_id
    ) p;

    -- Ficha de empleado
    SELECT row_to_json(e)::JSONB INTO v_employee
    FROM (
        SELECT
            first_name, last_name, email, phone, birth_date, hire_date,
            position, department, location, contract_type, country,
            city, postal_code, address
            -- Excluir IBAN y datos muy sensibles de la exportación básica
        FROM public.employees WHERE profile_id = p_user_id
    ) e;

    -- Documentos (solo metadatos)
    SELECT json_agg(d)::JSONB INTO v_documents
    FROM (
        SELECT doc.file_name, doc.category, doc.description, doc.created_at
        FROM public.documents doc
        JOIN public.employees emp ON doc.employee_id = emp.id
        WHERE emp.profile_id = p_user_id
    ) d;

    -- Vacaciones
    SELECT json_agg(v)::JSONB INTO v_vacations
    FROM (
        SELECT vr.start_date, vr.end_date, vr.type, vr.status, vr.days_count
        FROM public.vacation_requests vr
        JOIN public.employees emp ON vr.employee_id = emp.id
        WHERE emp.profile_id = p_user_id
    ) v;

    result := jsonb_build_object(
        'export_date', NOW(),
        'export_format', 'RGPD_portabilidad_v1',
        'profile', v_profile,
        'employee_data', v_employee,
        'documents', COALESCE(v_documents, '[]'::JSONB),
        'vacation_requests', COALESCE(v_vacations, '[]'::JSONB)
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- DATOS INICIALES: Crear usuario admin por defecto
-- IMPORTANTE: Cambiar la contraseña inmediatamente después del despliegue
-- El admin se crea desde el Dashboard de Supabase Auth manualmente.
-- ============================================================

-- Nota: El primer admin debe crearse desde:
-- Supabase Dashboard > Authentication > Users > Add User
-- Email: admin@avaseleccion.es
-- Después actualizar el rol en la tabla profiles:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@avaseleccion.es';

-- ============================================================
-- STORAGE: Crear bucket si no existe
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'employee-documents',
    'employee-documents',
    false, -- Privado: no accesible públicamente
    10485760, -- 10 MB máximo por archivo
    ARRAY[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/webp'
    ]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- CONFIGURACIÓN: Email templates (informativo)
-- Configurar en Supabase Dashboard > Authentication > Email Templates
-- Personalizar con el branding de AVA Selección
-- ============================================================

-- Confirmar que todo ha sido configurado correctamente
DO $$
BEGIN
    RAISE NOTICE 'Migración 003 completada: funciones, storage y datos iniciales.';
    RAISE NOTICE 'IMPORTANTE: Crear el usuario admin manualmente en Supabase Dashboard.';
    RAISE NOTICE 'IMPORTANTE: Configurar variables de entorno en Vercel antes del despliegue.';
END $$;
