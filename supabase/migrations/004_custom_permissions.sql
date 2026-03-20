-- Añadir columna custom_permissions a profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS custom_permissions JSONB DEFAULT NULL;

-- Función para verificar un permiso concreto del usuario actual
-- Lógica: admin sin custom_permissions = acceso total
--         admin con custom_permissions = solo los que tiene en true
--         otros roles = false siempre (no aplica a ellos)
CREATE OR REPLACE FUNCTION public.check_custom_permission(p_permission TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_role TEXT;
    v_permissions JSONB;
BEGIN
    SELECT role, custom_permissions
    INTO v_role, v_permissions
    FROM public.profiles
    WHERE id = auth.uid()
    LIMIT 1;

    -- No es admin: no aplica este sistema
    IF v_role != 'admin' THEN
        RETURN FALSE;
    END IF;

    -- Admin sin restricciones: acceso total
    IF v_permissions IS NULL THEN
        RETURN TRUE;
    END IF;

    -- Admin con restricciones: verificar permiso específico
    RETURN COALESCE((v_permissions->>p_permission)::BOOLEAN, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Comentario de documentación
COMMENT ON COLUMN public.profiles.custom_permissions IS
'Permisos granulares para admins. NULL = acceso total.
JSON con claves: employees_read, employees_write, documents_read, documents_write,
vacations_read, vacations_approve, candidates_manage, support_view, users_manage';
