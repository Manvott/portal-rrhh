# 🚀 Guía de Despliegue a Producción — Portal RRHH AVA Selección

## Pasos para desplegar HOY

---

## PASO 1: Configurar Supabase

### 1.1 — Ejecutar las migraciones SQL

1. Ve a: https://supabase.com/dashboard/project/xvrfjrlvhvhfkmlducir
2. Haz clic en **SQL Editor**
3. Ejecuta los siguientes archivos en orden:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_functions_and_seed.sql`

### 1.2 — Crear el Storage Bucket

1. Ve a **Storage** en el dashboard de Supabase
2. Crea un bucket llamado `employee-documents` (privado, no público)
3. Tamaño máximo: 10 MB

### 1.3 — Obtener las claves API

1. Ve a: **Settings → API**
2. Copia:
   - **Project URL**: `https://xvrfjrlvhvhfkmlducir.supabase.co`
   - **anon public**: tu clave pública
   - **service_role**: tu clave secreta (⚠️ NUNCA en el frontend)

### 1.4 — Crear el primer usuario Admin

1. Ve a **Authentication → Users → Add User**
2. Crea el usuario admin: `admin@avaseleccion.es` (pon una contraseña segura)
3. Tras crearlo, ve a **SQL Editor** y ejecuta:
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@avaseleccion.es';
```

---

## PASO 2: Desplegar en Vercel

### 2.1 — Conectar GitHub a Vercel

1. Ve a: https://vercel.com/new
2. Importa el repositorio: `Manvott/portal-rrhh`
3. Framework: **Next.js** (se detecta automáticamente)

### 2.2 — Configurar Variables de Entorno en Vercel

En Vercel → Settings → Environment Variables, añade:

```
NEXT_PUBLIC_SUPABASE_URL = https://xvrfjrlvhvhfkmlducir.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = [tu anon key de Supabase]
SUPABASE_SERVICE_ROLE_KEY = [tu service role key - solo backend]
NEXT_PUBLIC_SITE_URL = https://[tu-dominio].vercel.app
NEXT_PUBLIC_COMPANY_NAME = AVA Selección
NEXT_PUBLIC_DPO_EMAIL = privacidad@avaseleccion.es
NEXT_PUBLIC_SUPPORT_EMAIL = soporte@avaseleccion.es
```

### 2.3 — Deploy

Haz clic en **Deploy**. Vercel compilará y desplegará automáticamente.

---

## PASO 3: Configurar dominio (opcional)

1. En Vercel → Settings → Domains
2. Añade tu dominio personalizado (ej: rrhh.avaseleccion.es)
3. Configura los registros DNS en tu proveedor

---

## PASO 4: Configurar Supabase Auth

### 4.1 — URL de redirección

1. Ve a: **Authentication → URL Configuration**
2. Site URL: `https://tu-dominio.vercel.app`
3. Redirect URLs: `https://tu-dominio.vercel.app/**`

### 4.2 — Política de contraseñas

1. Ve a: **Authentication → Policies**
2. Minimum password length: **8**
3. Require uppercase: ✅
4. Require number: ✅

---

## PASO 5: Crear usuarios adicionales

Para cada empleado/colaborador:
1. En Supabase → Authentication → Users → Add User
2. Crear con email y contraseña temporal
3. Actualizar el rol según corresponda:

```sql
-- Para colaboradores (rol por defecto):
-- No hay que cambiar nada, ya es 'collaborator'

-- Para soporte técnico:
UPDATE public.profiles SET role = 'support'
WHERE email = 'soporte@avaseleccion.es';

-- Para admin adicional:
UPDATE public.profiles SET role = 'admin'
WHERE email = 'otro-admin@avaseleccion.es';
```

---

## PASO 6: Completar datos legales en la política de privacidad

Edita el archivo `src/app/privacy/page.tsx` y reemplaza los placeholders:
- `[NOMBRE LEGAL COMPLETO]`
- `[CIF DE LA EMPRESA]`
- `[DIRECCIÓN FISCAL]`

---

## ✅ Checklist final antes de producción

- [ ] Migraciones SQL ejecutadas correctamente
- [ ] Storage bucket `employee-documents` creado (privado)
- [ ] Variables de entorno configuradas en Vercel
- [ ] Usuario admin creado y probado
- [ ] URL de redirección de Supabase actualizada
- [ ] Política de privacidad completada con datos reales
- [ ] Contraseña del admin cambiada por una segura
- [ ] Prueba de login con cada rol (admin, soporte, colaborador)

---

## 🔒 Notas de seguridad

- La `SUPABASE_SERVICE_ROLE_KEY` NUNCA debe aparecer en el frontend
- Los archivos `.env.local` están en `.gitignore` y nunca suben al repositorio
- Todos los datos personales están protegidos por RLS en Supabase
- Los logs de soporte están anonimizados conforme al RGPD
