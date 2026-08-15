import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { 
  FormData, 
  GeneratedSteps, 
  LKPDData, 
  AsesmenData, 
  MateriData, 
  TindakLanjutData, 
  BankSoalData,
  ProtaData,
  KKTPData,
  ProsemData,
} from '@/types/modul';
import type { GenerationResultV2 } from '@/types/modul';
import { CONTENT_SCHEMA_VERSION_LEGACY } from '@/lib/history-v2';
import {
  buildContentHistoryWritePayload,
  type ContentHistoryWriteMode,
} from '@/lib/history-payload';

export interface ContentHistoryItem {
  id: string;
  user_id: string;
  name: string;
  form_data: FormData;
  modul_data: GeneratedSteps | null;
  lkpd_data: LKPDData | null;
  asesmen_data: AsesmenData | null;
  materi_data: MateriData | null;
  bank_soal_data: BankSoalData | null;
  tindak_lanjut_data: TindakLanjutData | null;
  prota_data: ProtaData | null;
  kktp_data: KKTPData | null;
  prosem_data: { sem1: ProsemData | null; sem2: ProsemData | null } | null;
  /** JSON mentah kolom `generation_result_v2` — WAJIB divalidasi sebelum dipakai. */
  generation_result_v2: unknown;
  /** 1 = history legacy, 2 = history Dokumen per Pertemuan V2. */
  content_schema_version: number;
  created_at: string;
  updated_at: string;
}

export interface SaveContentHistoryParams {
  name: string;
  form_data: FormData;
  modul_data: GeneratedSteps | null;
  lkpd_data: LKPDData | null;
  asesmen_data: AsesmenData | null;
  materi_data: MateriData | null;
  bank_soal_data: BankSoalData | null;
  tindak_lanjut_data: TindakLanjutData | null;
  prota_data?: ProtaData | null;
  kktp_data?: KKTPData | null;
  prosem_data?: { sem1: ProsemData | null; sem2: ProsemData | null } | null;
  /** Diisi hanya saat mode V2 aktif. Tidak pernah hasil konversi lossy. */
  generation_result_v2?: GenerationResultV2 | null;
}

const MAX_HISTORY_ITEMS = 50;

/** Mode penulisan row: V2 hanya bila ada hasil V2 yang benar-benar dikirim. */
export const resolveWriteMode = (
  params: Pick<SaveContentHistoryParams, 'generation_result_v2'>,
): ContentHistoryWriteMode => (params.generation_result_v2 ? 'v2' : 'legacy');

export const useContentHistory = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['content-history', user?.id],
    queryFn: async (): Promise<ContentHistoryItem[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('content_history')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(MAX_HISTORY_ITEMS);

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        name: item.name,
        form_data: item.form_data as unknown as FormData,
        modul_data: item.modul_data as unknown as GeneratedSteps | null,
        lkpd_data: item.lkpd_data as unknown as LKPDData | null,
        asesmen_data: item.asesmen_data as unknown as AsesmenData | null,
        materi_data: item.materi_data as unknown as MateriData | null,
        bank_soal_data: item.bank_soal_data as unknown as BankSoalData | null,
        tindak_lanjut_data: item.tindak_lanjut_data as unknown as TindakLanjutData | null,
        prota_data: item.prota_data as unknown as ProtaData | null,
        kktp_data: item.kktp_data as unknown as KKTPData | null,
        prosem_data: item.prosem_data as unknown as { sem1: ProsemData | null; sem2: ProsemData | null } | null,
        generation_result_v2: item.generation_result_v2 ?? null,
        content_schema_version:
          typeof item.content_schema_version === 'number'
            ? item.content_schema_version
            : CONTENT_SCHEMA_VERSION_LEGACY,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));
    },
    enabled: !!user,
  });
};

export const useSaveContentHistory = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SaveContentHistoryParams) => {
      if (!user) throw new Error('User not authenticated');

      // Check current count and delete oldest if exceeding limit
      const { count } = await supabase
        .from('content_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (count && count >= MAX_HISTORY_ITEMS) {
        // Get oldest item
        const { data: oldestItems } = await supabase
          .from('content_history')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1);

        if (oldestItems && oldestItems.length > 0) {
          await supabase
            .from('content_history')
            .delete()
            .eq('id', oldestItems[0].id);
        }
      }

      // Insert new history
      const { data, error } = await supabase
        .from('content_history')
        .insert({
          user_id: user.id,
          ...buildContentHistoryWritePayload(resolveWriteMode(params), params),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-history', user?.id] });
    },
  });
};

export interface UpdateContentHistoryParams extends SaveContentHistoryParams {
  id: string;
}

export const useUpdateContentHistory = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateContentHistoryParams) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('content_history')
        .update({
          ...buildContentHistoryWritePayload(resolveWriteMode(params), params),
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-history', user?.id] });
    },
  });
};

export const useDeleteContentHistory = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (historyId: string) => {
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('content_history')
        .delete()
        .eq('id', historyId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-history', user?.id] });
    },
  });
};
