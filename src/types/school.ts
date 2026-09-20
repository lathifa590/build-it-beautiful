import type { KalenderPendidikan } from './modul';

export type SchoolRole = 'guru' | 'waka' | 'kepsek';
export type SchoolStatus = 'pending' | 'active' | 'rejected';

export type SchoolJenjang = 'SD' | 'SMP' | 'SMA' | 'SMK' | 'MA' | 'MI' | 'MTS' | 'PAUD' | 'TK' | 'SLB';

export interface School {
  id: string;
  npsn?: string | null;
  name: string;
  jenjang?: SchoolJenjang | string | null;
  alamat?: string | null;
  waka_user_id?: string | null;
  kepsek_user_id?: string | null;
  academic_year_active?: string | null;
  invite_code?: string | null;
  kop_header_text?: string | null;
  kop_sub_text?: string | null;
  kop_logo_url?: string | null;
  kepsek_name?: string | null;
  kepsek_nip?: string | null;
  waka_name?: string | null;
  waka_nip?: string | null;
  titimangsa_kota?: string | null;
  is_kop_locked?: boolean;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SchoolSupervisionReportItem {
  user_id: string;
  display_name: string;
  email: string;
  school_role: string;
  total_workspaces: number;
  total_jp_planned: number;
  total_modules_ready: number;
  total_shared_to_bank: number;
  total_approved_modules: number;
  compliance_percent: number;
}

export interface SchoolInvitation {
  id: string;
  school_id: string;
  email: string;
  invited_by?: string | null;
  created_at: string;
}

export interface SchoolCalendar {
  id: string;
  school_id: string;
  academic_year: string;
  semester: 1 | 2;
  pekan_efektif: number;
  kalender_json: KalenderPendidikan | Record<string, any>;
  jp_duration_minutes?: number;
  created_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SchoolMember {
  user_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  school_id: string | null;
  school_role: SchoolRole | null;
  school_status: SchoolStatus | null;
  updated_at?: string;
}

export interface SchoolMemberProgress {
  user_id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  school_role: SchoolRole;
  workspace_count: number;
  total_planned_jp: number;
  modul_ready_count: number;
  progress_percent?: number;
}

export interface SchoolJoinResult {
  success: boolean;
  message: string;
  school_id?: string;
  school_name?: string;
}

export type SchoolDocumentStatus = 'pending_review' | 'approved' | 'revision' | 'template';

export interface SchoolDocument {
  id: string;
  school_id: string;
  workspace_id?: string | null;
  source_document_id?: string | null;
  source_version_id?: string | null;
  title: string;
  document_type: string;
  subject?: string | null;
  grade?: string | null;
  phase?: string | null;
  academic_year?: string | null;
  semester?: number | null;
  content_json: Record<string, any>;
  shared_by?: string | null;
  shared_by_name?: string | null;
  shared_by_email?: string | null;
  status: SchoolDocumentStatus;
  is_template: boolean;
  review_notes?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  comments_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface SchoolDocumentComment {
  id: string;
  school_document_id: string;
  user_id: string;
  user_name?: string | null;
  comment: string;
  checklist?: {
    cp_tp_sesuai?: boolean;
    waktu_sesuai?: boolean;
    asesmen_lengkap?: boolean;
    diferensiasi_ada?: boolean;
    [key: string]: boolean | undefined;
  };
  created_at: string;
}

