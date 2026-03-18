// ============================================================
// TIPOS GLOBALES - PORTAL RRHH AVA SELECCIÓN
// ============================================================

export type UserRole = "admin" | "support" | "collaborator";

export type VacationStatus = "pending" | "approved" | "rejected" | "cancelled";

export type DocumentCategory =
  | "contract"
  | "payslip"
  | "certificate"
  | "medical"
  | "id"
  | "other";

export type CandidateStatus =
  | "new"
  | "screening"
  | "interview"
  | "offer"
  | "hired"
  | "rejected";

// Perfil de usuario (sincronizado con auth.users de Supabase)
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  gdpr_consent: boolean;
  gdpr_consent_date: string | null;
  created_at: string;
  updated_at: string;
}

// Ficha completa del empleado
export interface Employee {
  id: string;
  profile_id: string;
  employee_number: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  birth_date: string | null;
  hire_date: string | null;
  position: string | null;
  department: string | null;
  location: string | null;
  manager_id: string | null;
  contract_type: string | null;
  salary: number | null;
  iban: string | null;
  social_security_number: string | null;
  nif: string | null;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  country: string;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Relaciones opcionales
  profile?: Profile;
  manager?: Employee;
}

// Documento adjunto
export interface Document {
  id: string;
  employee_id: string;
  uploaded_by: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  category: DocumentCategory;
  description: string | null;
  is_confidential: boolean;
  created_at: string;
  // Relaciones opcionales
  employee?: Employee;
  uploader?: Profile;
}

// Solicitud de vacaciones / ausencia
export interface VacationRequest {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  days_count: number;
  type: "vacation" | "sick" | "personal" | "other";
  reason: string | null;
  status: VacationStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  // Relaciones opcionales
  employee?: Employee;
  approver?: Profile;
}

// Candidato para proceso de selección
export interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  position_applied: string;
  department: string | null;
  status: CandidateStatus;
  cv_path: string | null;
  notes: string | null;
  source: string | null;
  salary_expectation: number | null;
  interview_date: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

// Log de auditoría (anonimizado para rol support)
export interface AuditLog {
  id: string;
  // user_id anonimizado para soporte (solo admins ven el ID real)
  action: string;
  resource_type: string;
  resource_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// Registro de consentimiento RGPD
export interface ConsentRecord {
  id: string;
  user_id: string;
  consent_type: string;
  consented: boolean;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}
