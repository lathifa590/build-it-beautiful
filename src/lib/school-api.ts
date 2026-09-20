import { supabase } from "@/integrations/supabase/client";
import type {
  School,
  SchoolCalendar,
  SchoolMember,
  SchoolMemberProgress,
  SchoolJoinResult,
  SchoolDocument,
  SchoolDocumentComment,
  SchoolDocumentStatus,
  SchoolSupervisionReportItem,
} from "@/types/school";

export const schoolApi = {
  /**
   * Mengambil data profil sekolah pengguna yang sedang login
   */
  async getCurrentUserProfile(): Promise<SchoolMember | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('profiles' as any)
      .select('user_id, display_name, email, avatar_url, school_id, school_role, school_status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching current user school profile:', error);
      return null;
    }

    return (data as unknown as SchoolMember) || null;
  },

  /**
   * Mengambil detail sekolah tempat user berafiliasi (jika sudah aktif)
   */
  async getCurrentSchool(): Promise<School | null> {
    const profile = await this.getCurrentUserProfile();
    if (!profile?.school_id) return null;

    const { data, error } = await supabase
      .from('schools' as any)
      .select('*')
      .eq('id', profile.school_id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching current school:', error);
      return null;
    }

    return (data as unknown as School) || null;
  },

  /**
   * Mengambil sekolah berdasarkan ID
   */
  async getSchoolById(schoolId: string): Promise<School | null> {
    const { data, error } = await supabase
      .from('schools' as any)
      .select('*')
      .eq('id', schoolId)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching school ${schoolId}:`, error);
      return null;
    }

    return (data as unknown as School) || null;
  },

  /**
   * Mengambil sekolah berdasarkan NPSN
   */
  async getSchoolByNpsn(npsn: string): Promise<School | null> {
    const { data, error } = await supabase
      .from('schools' as any)
      .select('*')
      .eq('npsn', npsn.trim())
      .maybeSingle();

    if (error) {
      console.error(`Error fetching school with npsn ${npsn}:`, error);
      return null;
    }

    return (data as unknown as School) || null;
  },

  /**
   * Mengambil seluruh sekolah (Khusus Admin)
   */
  async getAllSchools(): Promise<School[]> {
    const { data, error } = await supabase
      .from('schools' as any)
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching all schools:', error);
      throw error;
    }

    return (data as unknown as School[]) || [];
  },

  /**
   * Mendaftarkan sekolah baru (Khusus Admin)
   */
  async createSchool(schoolData: {
    name: string;
    npsn?: string | null;
    jenjang?: string | null;
    alamat?: string | null;
    academic_year_active?: string | null;
    waka_user_id?: string | null;
    kepsek_user_id?: string | null;
  }): Promise<School> {
    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      ...schoolData,
      created_by: user?.id || null,
    };

    const { data, error } = await supabase
      .from('schools' as any)
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Error creating school:', error);
      throw error;
    }

    const createdSchool = data as unknown as School;

    // Jika langsung ditugaskan Waka, update profil Waka tersebut
    if (schoolData.waka_user_id) {
      await supabase
        .from('profiles' as any)
        .update({
          school_id: createdSchool.id,
          school_role: 'waka',
          school_status: 'active',
        })
        .eq('user_id', schoolData.waka_user_id);
    }

    // Jika langsung ditugaskan Kepsek, update profil Kepsek tersebut
    if (schoolData.kepsek_user_id) {
      await supabase
        .from('profiles' as any)
        .update({
          school_id: createdSchool.id,
          school_role: 'kepsek',
          school_status: 'active',
        })
        .eq('user_id', schoolData.kepsek_user_id);
    }

    return createdSchool;
  },

  /**
   * Memperbarui informasi sekolah (Admin, Waka, Kepsek)
   */
  async updateSchool(schoolId: string, updates: Partial<School>): Promise<School> {
    const { data, error } = await supabase
      .from('schools' as any)
      .update(updates)
      .eq('id', schoolId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating school ${schoolId}:`, error);
      throw error;
    }

    return data as unknown as School;
  },

  /**
   * Menghapus sekolah (Khusus Admin)
   */
  async deleteSchool(schoolId: string): Promise<boolean> {
    const { error } = await supabase
      .from('schools' as any)
      .delete()
      .eq('id', schoolId);

    if (error) {
      console.error(`Error deleting school ${schoolId}:`, error);
      throw error;
    }

    return true;
  },

  /**
   * Mengambil kalender sekolah untuk tahun ajaran & semester tertentu
   */
  async getSchoolCalendar(
    schoolId: string,
    academicYear: string,
    semester: 1 | 2
  ): Promise<SchoolCalendar | null> {
    const { data, error } = await supabase
      .from('school_calendars' as any)
      .select('*')
      .eq('school_id', schoolId)
      .eq('academic_year', academicYear)
      .eq('semester', semester)
      .maybeSingle();

    if (error) {
      console.error('Error fetching school calendar:', error);
      return null;
    }

    return (data as unknown as SchoolCalendar) || null;
  },

  /**
   * Mengambil seluruh daftar kalender yang ada di suatu sekolah
   */
  async getSchoolCalendars(schoolId: string): Promise<SchoolCalendar[]> {
    const { data, error } = await supabase
      .from('school_calendars' as any)
      .select('*')
      .eq('school_id', schoolId)
      .order('academic_year', { ascending: false })
      .order('semester', { ascending: true });

    if (error) {
      console.error('Error fetching school calendars:', error);
      return [];
    }

    return (data as unknown as SchoolCalendar[]) || [];
  },

  /**
   * Simpan atau perbarui kalender sekolah (Waka / Admin)
   */
  async upsertSchoolCalendar(calendarData: {
    school_id: string;
    academic_year: string;
    semester: 1 | 2;
    pekan_efektif: number;
    kalender_json: any;
    jp_duration_minutes?: number;
  }): Promise<SchoolCalendar> {
    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      ...calendarData,
      created_by: user?.id || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('school_calendars' as any)
      .upsert(payload, { onConflict: 'school_id, academic_year, semester' })
      .select()
      .single();

    if (error) {
      console.error('Error upserting school calendar:', error);
      throw error;
    }

    return data as unknown as SchoolCalendar;
  },

  /**
   * Mengambil progres penyusunan modul ajar seluruh guru di sekolah (Dashboard)
   */
  async getSchoolProgress(schoolId: string): Promise<SchoolMemberProgress[]> {
    const { data, error } = await supabase.rpc('get_school_progress', {
      _school_id: schoolId,
    });

    if (error) {
      console.error('Error fetching school progress:', error);
      throw error;
    }

    return (data as SchoolMemberProgress[]) || [];
  },

  /**
   * Guru mengajukan gabung ke sekolah via NPSN
   */
  async requestJoinSchool(npsn: string): Promise<SchoolJoinResult> {
    const { data, error } = await supabase.rpc('request_join_school', {
      _npsn: npsn,
    });

    if (error) {
      console.error('Error requesting join school:', error);
      return {
        success: false,
        message: error.message || 'Gagal mengajukan permintaan gabung sekolah',
      };
    }

    return data as SchoolJoinResult;
  },

  /**
   * Menyetujui pendaftaran guru pending (Waka / Admin)
   */
  async approveSchoolMember(targetUserId: string): Promise<{ success: boolean; message?: string }> {
    const { data, error } = await supabase.rpc('approve_school_member', {
      _target_user_id: targetUserId,
    });

    if (error) {
      console.error('Error approving school member:', error);
      return {
        success: false,
        message: error.message || 'Gagal menyetujui anggota',
      };
    }

    return data as { success: boolean; message?: string };
  },

  /**
   * Mengambil daftar seluruh anggota sekolah (aktif & pending)
   */
  async getSchoolMembers(schoolId: string): Promise<SchoolMember[]> {
    const { data, error } = await supabase
      .from('profiles' as any)
      .select('user_id, display_name, email, avatar_url, school_id, school_role, school_status, updated_at')
      .eq('school_id', schoolId)
      .order('display_name', { ascending: true });

    if (error) {
      console.error('Error fetching school members:', error);
      return [];
    }

    return (data as unknown as SchoolMember[]) || [];
  },

  /**
   * Guru bergabung langsung menggunakan kode undangan rahasia Waka (Instan Aktif)
   */
  async joinSchoolByCode(code: string): Promise<SchoolJoinResult> {
    const { data, error } = await supabase.rpc('join_school_by_code', {
      _code: code.trim().toUpperCase(),
    });

    if (error) {
      console.error('Error joining school by code:', error);
      return {
        success: false,
        message: error.message || 'Gagal bergabung dengan kode undangan',
      };
    }

    return data as SchoolJoinResult;
  },

  /**
   * Regenerasi kode undangan rahasia baru (Waka / Admin)
   */
  async regenerateInviteCode(schoolId: string): Promise<string> {
    const { data, error } = await supabase.rpc('regenerate_school_invite_code', {
      _school_id: schoolId,
    });

    if (error) {
      console.error('Error regenerating invite code:', error);
      throw error;
    }

    return data as string;
  },

  /**
   * Tambahkan guru secara langsung lewat email (Waka / Admin)
   */
  async addTeacherByEmail(
    schoolId: string,
    email: string
  ): Promise<{ success: boolean; status?: string; message: string }> {
    const { data, error } = await supabase.rpc('add_teacher_by_email', {
      _school_id: schoolId,
      _email: email.trim().toLowerCase(),
    });

    if (error) {
      console.error('Error adding teacher by email:', error);
      return {
        success: false,
        message: error.message || 'Gagal menambahkan guru lewat email',
      };
    }

    return data as { success: boolean; status?: string; message: string };
  },

  /**
   * Mengambil daftar email yang sedang diundang (pending register)
   */
  async getSchoolInvitations(schoolId: string): Promise<{ id: string; school_id: string; email: string; created_at: string }[]> {
    const { data, error } = await supabase
      .from('school_invitations' as any)
      .select('*')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching school invitations:', error);
      return [];
    }

    return (data as any) || [];
  },

  /**
   * Batalkan undangan email (Waka / Admin)
   */
  async cancelSchoolInvitation(schoolId: string, email: string): Promise<{ success: boolean; message: string }> {
    const { data, error } = await supabase.rpc('cancel_school_invitation', {
      _school_id: schoolId,
      _email: email.trim().toLowerCase(),
    });

    if (error) {
      console.error('Error cancelling school invitation:', error);
      return {
        success: false,
        message: error.message || 'Gagal membatalkan undangan',
      };
    }

    return data as { success: boolean; message: string };
  },

  /**
   * Mengeluarkan anggota dari sekolah
   */
  async removeSchoolMember(schoolId: string, targetUserId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('remove_school_member', {
      _school_id: schoolId,
      _target_user_id: targetUserId,
    });

    if (error) {
      console.error('Error removing school member:', error);
      throw error;
    }

    const result = data as { success?: boolean; message?: string } | null;
    if (!result?.success) {
      throw new Error(result?.message || 'Gagal mengeluarkan anggota');
    }
    return true;
  },

  /**
   * Guru keluar sendiri dari sekolah saat ini (prasyarat pindah sekolah)
   */
  async leaveSchool(): Promise<SchoolJoinResult> {
    const { data, error } = await (supabase.rpc as any)('leave_school');

    if (error) {
      console.error('Error leaving school:', error);
      return { success: false, message: error.message || 'Gagal keluar dari sekolah' };
    }

    return data as SchoolJoinResult;
  },

  /**
   * Mengambil daftar dokumen di Bank Modul Sekolah (Fase S2)
   */
  async getSchoolBankDocuments(
    schoolId: string,
    filters?: {
      status?: string;
      subject?: string;
      doc_type?: string;
      is_template?: boolean;
    }
  ): Promise<SchoolDocument[]> {
    const { data, error } = await supabase.rpc('get_school_bank_documents', {
      _school_id: schoolId,
      _status: filters?.status || null,
      _subject: filters?.subject || null,
      _doc_type: filters?.doc_type || null,
      _is_template: filters?.is_template !== undefined ? filters.is_template : null,
    });

    if (error) {
      console.error('Error fetching school bank documents:', error);
      return [];
    }

    return (data as unknown as SchoolDocument[]) || [];
  },

  /**
   * Mengambil detail satu dokumen sekolah beserta riwayat isi
   */
  async getSchoolDocumentById(documentId: string): Promise<SchoolDocument | null> {
    const { data, error } = await supabase
      .from('school_documents' as any)
      .select('*')
      .eq('id', documentId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching school document by ID:', error);
      return null;
    }

    return (data as unknown as SchoolDocument) || null;
  },

  /**
   * Membagikan modul/dokumen ke Bank Modul Sekolah (Guru)
   */
  async shareDocumentToSchool(payload: {
    school_id: string;
    title: string;
    document_type: string;
    content_json: Record<string, any>;
    workspace_id?: string;
    source_document_id?: string;
    subject?: string;
    grade?: string;
    phase?: string;
    academic_year?: string;
    semester?: number;
  }): Promise<{ success: boolean; document_id?: string; message: string }> {
    const { data, error } = await supabase.rpc('share_document_to_school', {
      _school_id: payload.school_id,
      _title: payload.title,
      _document_type: payload.document_type,
      _content_json: payload.content_json,
      _workspace_id: payload.workspace_id || null,
      _source_document_id: payload.source_document_id || null,
      _subject: payload.subject || null,
      _grade: payload.grade || null,
      _phase: payload.phase || null,
      _academic_year: payload.academic_year || null,
      _semester: payload.semester || null,
    });

    if (error) {
      console.error('Error sharing document to school:', error);
      return { success: false, message: error.message || 'Gagal membagikan dokumen' };
    }

    return data as { success: boolean; document_id?: string; message: string };
  },

  /**
   * Memberikan review status & rubrik checklist (Waka / Kepsek / Admin)
   */
  async reviewSchoolDocument(
    documentId: string,
    status: SchoolDocumentStatus,
    reviewNotes?: string,
    isTemplate?: boolean,
    checklist?: Record<string, boolean>
  ): Promise<{ success: boolean; message: string }> {
    const { data, error } = await supabase.rpc('review_school_document', {
      _document_id: documentId,
      _status: status,
      _review_notes: reviewNotes || null,
      _is_template: isTemplate ?? false,
      _checklist: checklist || {},
    });

    if (error) {
      console.error('Error reviewing school document:', error);
      return { success: false, message: error.message || 'Gagal mereview dokumen' };
    }

    return data as { success: boolean; message: string };
  },

  /**
   * Mengambil riwayat komentar & checklist dokumen
   */
  async getSchoolDocumentComments(documentId: string): Promise<SchoolDocumentComment[]> {
    const { data, error } = await supabase
      .from('school_document_comments' as any)
      .select('id, school_document_id, user_id, comment, checklist, created_at')
      .eq('school_document_id', documentId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching document comments:', error);
      return [];
    }

    return (data as unknown as SchoolDocumentComment[]) || [];
  },

  /**
   * Menambahkan komentar/feedback pada dokumen
   */
  async addSchoolDocumentComment(
    documentId: string,
    comment: string,
    checklist?: Record<string, boolean>
  ): Promise<SchoolDocumentComment> {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('school_document_comments' as any)
      .insert({
        school_document_id: documentId,
        user_id: user?.id,
        comment,
        checklist: checklist || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding document comment:', error);
      throw error;
    }

    return data as unknown as SchoolDocumentComment;
  },

  /**
   * Menghapus dokumen dari Bank Modul Sekolah
   */
  async deleteSchoolDocument(documentId: string): Promise<boolean> {
    const { error } = await supabase
      .from('school_documents' as any)
      .delete()
      .eq('id', documentId);

    if (error) {
      console.error('Error deleting school document:', error);
      throw error;
    }

    return true;
  },

  /**
   * Mengambil rekapitulasi supervisi dinas & kepatuhan kurikulum sekolah (Fase S3)
   */
  async getSchoolSupervisionReport(schoolId: string): Promise<SchoolSupervisionReportItem[]> {
    const { data, error } = await supabase.rpc('get_school_supervision_report', {
      _school_id: schoolId,
    });

    if (error) {
      console.error('Error fetching school supervision report via RPC, falling back to progress query:', error);
      const progress = await this.getSchoolProgress(schoolId);
      return progress.map((p) => ({
        user_id: p.user_id,
        display_name: p.display_name || 'Guru',
        email: p.email || '',
        school_role: p.school_role || 'guru',
        total_workspaces: Number(p.workspace_count || 0),
        total_jp_planned: Number(p.total_planned_jp || 0),
        total_modules_ready: Number(p.modul_ready_count || 0),
        total_shared_to_bank: 0,
        total_approved_modules: Number(p.modul_ready_count || 0),
        compliance_percent: Number(p.workspace_count || 0) > 0
          ? Math.min(100, Math.round((Number(p.modul_ready_count || 0) / (Number(p.workspace_count || 0) * 2)) * 100))
          : 0,
      }));
    }

    return (data as unknown as SchoolSupervisionReportItem[]) || [];
  },

  /**
   * Memperbarui standar tata kelola kop & pengesahan sekolah (Waka / Admin)
   */
  async updateSchoolGovernance(
    schoolId: string,
    data: {
      kop_header_text?: string | null;
      kop_sub_text?: string | null;
      kop_logo_url?: string | null;
      kepsek_name?: string | null;
      kepsek_nip?: string | null;
      waka_name?: string | null;
      waka_nip?: string | null;
      titimangsa_kota?: string | null;
      is_kop_locked?: boolean;
    }
  ): Promise<School> {
    const { data: updated, error } = await supabase
      .from('schools' as any)
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', schoolId)
      .select()
      .single();

    if (error) {
      console.error('Error updating school governance:', error);
      throw error;
    }

    return updated as unknown as School;
  },
};



