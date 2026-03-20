-- =====================================================
-- MIGRACIÓN 005: Sistema de Habilidades por Empleado
-- =====================================================

-- Tabla maestra de habilidades predefinidas
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    area TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabla de habilidades asignadas a empleados
CREATE TABLE IF NOT EXISTS public.employee_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    level TEXT NOT NULL DEFAULT 'basic' CHECK (level IN ('basic','intermediate','advanced','expert')),
    notes TEXT,
    assigned_by UUID REFERENCES public.profiles(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(employee_id, skill_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_employee_skills_employee ON public.employee_skills(employee_id);
CREATE INDEX IF NOT EXISTS idx_skills_category ON public.skills(category);

-- RLS
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_skills ENABLE ROW LEVEL SECURITY;

-- Skills: todos los autenticados pueden leer
CREATE POLICY "skills_select_all" ON public.skills FOR SELECT USING (auth.uid() IS NOT NULL);
-- Solo admin puede gestionar el catálogo
CREATE POLICY "skills_insert_admin" ON public.skills FOR INSERT WITH CHECK (public.get_user_role() = 'admin');
CREATE POLICY "skills_update_admin" ON public.skills FOR UPDATE USING (public.get_user_role() = 'admin');

-- Employee skills: admin puede todo, colaborador solo ve las suyas
CREATE POLICY "employee_skills_select_admin" ON public.employee_skills FOR SELECT USING (public.get_user_role() = 'admin');
CREATE POLICY "employee_skills_select_own" ON public.employee_skills FOR SELECT USING (
    employee_id IN (SELECT id FROM public.employees WHERE profile_id = auth.uid())
);
CREATE POLICY "employee_skills_insert_admin" ON public.employee_skills FOR INSERT WITH CHECK (public.get_user_role() = 'admin');
CREATE POLICY "employee_skills_update_admin" ON public.employee_skills FOR UPDATE USING (public.get_user_role() = 'admin');
CREATE POLICY "employee_skills_delete_admin" ON public.employee_skills FOR DELETE USING (public.get_user_role() = 'admin');

-- =====================================================
-- SEED: Habilidades predefinidas para AVA Selección
-- =====================================================

INSERT INTO public.skills (name, category, area, sort_order) VALUES
-- GENERALES (inherentes a todos los humanos)
('Comunicación oral y escrita', 'general', NULL, 1),
('Trabajo en equipo', 'general', NULL, 2),
('Resolución de problemas', 'general', NULL, 3),
('Adaptabilidad y flexibilidad', 'general', NULL, 4),
('Gestión del tiempo', 'general', NULL, 5),
('Orientación al cliente', 'general', NULL, 6),
('Proactividad e iniciativa', 'general', NULL, 7),
('Trabajo bajo presión', 'general', NULL, 8),
('Empatía y escucha activa', 'general', NULL, 9),
('Organización y planificación', 'general', NULL, 10),
('Toma de decisiones', 'general', NULL, 11),
('Liderazgo', 'general', NULL, 12),

-- ALMACÉN
('Control de stock e inventario', 'warehouse', 'Almacén', 1),
('Recepción y expedición de mercancías', 'warehouse', 'Almacén', 2),
('Manejo de carretilla elevadora', 'warehouse', 'Almacén', 3),
('Gestión de pedidos', 'warehouse', 'Almacén', 4),
('Control de temperaturas y cadena de frío', 'warehouse', 'Almacén', 5),
('Manipulación de alimentos', 'warehouse', 'Almacén', 6),
('Etiquetado y trazabilidad', 'warehouse', 'Almacén', 7),
('Software de gestión de almacén (SGA)', 'warehouse', 'Almacén', 8),
('Preparación de pedidos (picking)', 'warehouse', 'Almacén', 9),
('Gestión de mermas y caducidades', 'warehouse', 'Almacén', 10),

-- ADMINISTRACIÓN
('Microsoft Office (Word, Excel, PowerPoint)', 'admin', 'Administración', 1),
('Gestión documental', 'admin', 'Administración', 2),
('Facturación y presupuestos', 'admin', 'Administración', 3),
('Contabilidad básica', 'admin', 'Administración', 4),
('CRM / ERP', 'admin', 'Administración', 5),
('Gestión de RRHH', 'admin', 'Administración', 6),
('Atención telefónica y multicanal', 'admin', 'Administración', 7),
('Redacción de informes y actas', 'admin', 'Administración', 8),
('Gestión de agendas y calendarios', 'admin', 'Administración', 9),
('Normativa laboral básica', 'admin', 'Administración', 10),

-- GASTRONOMÍA / PRODUCTO
('Conocimiento de producto gastronómico', 'gastronomy', 'Gastronomía', 1),
('Cata y análisis sensorial', 'gastronomy', 'Gastronomía', 2),
('Maridaje y armonización', 'gastronomy', 'Gastronomía', 3),
('Normativa alimentaria (APPCC/HACCP)', 'gastronomy', 'Gastronomía', 4),
('Presentación y emplatado', 'gastronomy', 'Gastronomía', 5),
('Cocina internacional', 'gastronomy', 'Gastronomía', 6),
('Gestión de carta y menú', 'gastronomy', 'Gastronomía', 7),
('Alérgenos e intolerancias alimentarias', 'gastronomy', 'Gastronomía', 8),
('Selección y evaluación de proveedores', 'gastronomy', 'Gastronomía', 9),

-- VENTAS / COMERCIAL
('Técnicas de venta', 'sales', 'Ventas', 1),
('Negociación comercial', 'sales', 'Ventas', 2),
('Gestión de cartera de clientes', 'sales', 'Ventas', 3),
('Presentaciones comerciales', 'sales', 'Ventas', 4),
('Análisis de mercado y competencia', 'sales', 'Ventas', 5),
('Marketing digital', 'sales', 'Ventas', 6),
('Fidelización de clientes', 'sales', 'Ventas', 7),
('Elaboración de ofertas y contratos', 'sales', 'Ventas', 8),

-- LOGÍSTICA
('Planificación de rutas', 'logistics', 'Logística', 1),
('Gestión de transportistas', 'logistics', 'Logística', 2),
('Importación y exportación', 'logistics', 'Logística', 3),
('Normativa de transporte de alimentos', 'logistics', 'Logística', 4),
('Software logístico (TMS/WMS)', 'logistics', 'Logística', 5),
('Optimización de costes logísticos', 'logistics', 'Logística', 6),
('Gestión aduanera', 'logistics', 'Logística', 7);
