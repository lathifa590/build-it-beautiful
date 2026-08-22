import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import type {
  FormData,
  SoalConfig,
  GeneratedSteps,
  LKPDData,
  AsesmenData,
  MateriData,
  TindakLanjutData,
  BankSoalData,
  Profile,
  Notification,
  PertemuanInput,
  ProtaData,
  ProtaItem,
  KalenderPendidikan,
  KKTPData,
  ProsemData,
  ProsemEvent,
} from '@/types/modul';
import { DEFAULT_FORM_DATA, DEFAULT_SOAL_CONFIG, IDENTIFIKASI_FIELDS, FASE_KELAS_MAP, DEFAULT_KALENDER_PENDIDIKAN, DEFAULT_PROSEM_EVENTS, BULAN_NAMES } from '@/lib/constants';
import { Header } from '@/components/modul/Header';
import { NotificationToast } from '@/components/modul/Notification';
import { ProfileManager } from '@/components/modul/ProfileManager';
import { FormSection } from '@/components/modul/FormSection';
import { Toolbar } from '@/components/modul/Toolbar';
import { DocumentPreview } from '@/components/modul/DocumentPreview';
import { SaveProfileModal } from '@/components/modul/SaveProfileModal';
import { SoalConfigModal } from '@/components/modul/SoalConfigModal';
import { MobileNavigation } from '@/components/modul/MobileNavigation';
import { CPSelectorModal } from '@/components/modul/CPSelectorModal';
import { EmptyState } from '@/components/modul/EmptyState';
import { PlanningTab } from '@/components/modul/PlanningTab';
import { SaveHistoryModal } from '@/components/modul/SaveHistoryModal';
import {
  canUseFullscreenPreview,
  computeHasContent,
  hasV2Content,
  hasV2ResettableState,
  resolveHistoryLoadPlan,
  summarizeGenerationResultV2,
} from '@/lib/history-v2';
import { QuotaIndicator } from '@/components/modul/QuotaIndicator';
import { SubscriptionStatusBanner } from '@/components/modul/SubscriptionStatusBanner';
import { PromptExportDialog } from '@/components/modul/PromptExportDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TrialCTADialog } from '@/components/modul/TrialCTADialog';
import { HeaderHistoryDropdown } from '@/components/modul/HeaderHistoryDropdown';
import { WorkspaceUpsellDialog } from '@/components/modul/WorkspaceUpsellDialog';
import { useContentHistory, useSaveContentHistory, useDeleteContentHistory, useUpdateContentHistory, type ContentHistoryItem } from '@/hooks/useContentHistory';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { 
  useTeacherProfiles, 
  useSaveTeacherProfile, 
  useDeleteTeacherProfile,
  useMigrateLocalProfiles 
} from '@/hooks/useTeacherProfiles';
import { useLetterhead } from '@/hooks/useLetterhead';
import { preprocessElementForOmml, WORD_HTML_NAMESPACES } from '@/lib/math-omml';

import { supabase } from '@/integrations/supabase/client';
import { invokeGenerateWithRetry } from '@/lib/invokeWithRetry';
import { ENABLE_PERTEMUAN_DOCS_V2 } from '@/lib/feature-flags';
import type { V2ExportFormat, V2ExportScope } from '@/lib/pertemuan-export';
import { usePertemuanGeneration } from '@/hooks/usePertemuanGeneration';
import { PertemuanResultNavigator } from '@/components/modul/PertemuanResultNavigator';
import { V2ExportDialog } from '@/components/modul/V2ExportDialog';
import { useV2Export } from '@/hooks/useV2Export';
import { normalizeBankSoalImages } from '@/lib/bank-soal-normalize';
import { buildContextKey, pickContextFields, JENIS_DOKUMEN_ORDER } from '@/lib/pertemuan-generation';
import type { JenisDokumenPertemuan } from '@/types/modul';

import { LogOut, Shield, User, Settings, Store, MoreVertical, RotateCcw, Maximize2, Minimize2, Plus, X, FileDown, Image as ImageIcon, RefreshCw, Lock } from 'lucide-react';
import {
  DropdownMenu as HeaderMoreMenu,
  DropdownMenuContent as HeaderMoreMenuContent,
  DropdownMenuItem as HeaderMoreMenuItem,
  DropdownMenuTrigger as HeaderMoreMenuTrigger,
  DropdownMenuSeparator as HeaderMoreMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useIsAgencyOwner } from '@/hooks/useIsAgencyOwner';
import html2pdf from 'html2pdf.js';
import { WorkspaceSelector } from '@/components/workspace/WorkspaceSelector';
import { WorkspaceDashboard } from '@/components/workspace/WorkspaceDashboard';
import { WorkspacePlanningView } from '@/components/workspace/planning/WorkspacePlanningView';
import useProsemData from '@/hooks/useProsemData';
import { WorkspaceExplorerRoot } from '@/components/workspace/explorer/WorkspaceExplorerRoot';
import { WorkspaceExplorerShell } from '@/components/workspace/explorer/WorkspaceExplorerShell';
import { WorkspaceMeetingEditor } from '@/components/workspace/explorer/WorkspaceMeetingEditor';

const Index = () => {
  const navigate = useNavigate();
  const { user, signOut, isAdmin } = useAuth();
  const isAgencyOwner = useIsAgencyOwner();

  // Cloud profiles
  const { data: cloudProfiles = [], isLoading: profilesLoading } = useTeacherProfiles();
  const saveProfileMutation = useSaveTeacherProfile();
  const deleteProfileMutation = useDeleteTeacherProfile();
  const migrateProfilesMutation = useMigrateLocalProfiles();

  // Letterhead hook
  const {
    letterheadUrl,
    isEnabled: isLetterheadEnabled,
    rawEnabled: rawLetterheadEnabled,
    hasLetterhead,
    toggleLetterhead,
    uploadLetterhead,
    deleteLetterhead,
    isUploading: isUploadingLetterhead,
    isDeleting: isDeletingLetterhead,
    uploadError: letterheadUploadError,
    getBase64: getLetterheadBase64,
  } = useLetterhead();

  // State Management
  const [loading, setLoading] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number; retrying?: boolean } | null>(null);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingSoalDocx, setIsExportingSoalDocx] = useState(false);
  const [loaders, setLoaders] = useState({
    lkpd: false,
    asesmen: false,
    materi: false,
    tindakLanjut: false,
    image: false,
    bankSoal: false,
  });

  // Data States
  const [generatedSteps, setGeneratedSteps] = useState<GeneratedSteps | null>(null);
  const [lkpdData, setLkpdData] = useState<LKPDData | null>(null);
  const [asesmenData, setAsesmenData] = useState<AsesmenData | null>(null);
  const [materiData, setMateriData] = useState<MateriData | null>(null);
  const [tindakLanjutData, setTindakLanjutData] = useState<TindakLanjutData | null>(null);
  const [bankSoalData, setBankSoalData] = useState<BankSoalData | null>(null);

  // Prota (Planning)
  const [protaData, setProtaData] = useState<ProtaData | null>(null);
  const [kalenderPendidikan, setKalenderPendidikan] = useState<KalenderPendidikan>(DEFAULT_KALENDER_PENDIDIKAN);
  const [isGeneratingProta, setIsGeneratingProta] = useState(false);
  const [isExportingProta, setIsExportingProta] = useState(false);

  // KKTP (Planning)
  const [kktpData, setKktpData] = useState<KKTPData | null>(null);
  const [isGeneratingKKTP, setIsGeneratingKKTP] = useState(false);
  const [isExportingKKTP, setIsExportingKKTP] = useState(false);

  // Prosem (Planning)
  const [prosemSem1, setProsemSem1] = useState<ProsemData | null>(null);
  const [prosemSem2, setProsemSem2] = useState<ProsemData | null>(null);
  const [prosemEvents, setProsemEvents] = useState<ProsemEvent[]>(() => {
    const saved = localStorage.getItem('prosem_events');
    return saved ? JSON.parse(saved) : DEFAULT_PROSEM_EVENTS;
  });
  const [isGeneratingProsem, setIsGeneratingProsem] = useState(false);
  const [isExportingProsem, setIsExportingProsem] = useState(false);

  // Images
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [soalImage, setSoalImage] = useState<string | null>(null);

  const [error, setError] = useState('');
  const [quotaInfo, setQuotaInfo] = useState<{ remaining: number; limit: number; isTrial: boolean } | null>(null);
  const [showTrialCTA, setShowTrialCTA] = useState(false);
  const [trialCTAReason, setTrialCTAReason] = useState<'quota' | 'busy'>('quota');
  const [showWorkspaceUpsell, setShowWorkspaceUpsell] = useState(false);

  // Image generation now uses backend edge function (no client-side API key needed)

  // Count current stimulus images (Bank Soal)
  const stimulusImageCount = useMemo(() => {
    if (!bankSoalData) return 0;
    let count = bankSoalData.stimulus_image ? 1 : 0;
    if (bankSoalData.stimulus_list) {
      count += bankSoalData.stimulus_list.filter(s => s.image).length;
    }
    if (bankSoalData.daftar_soal) {
      count += bankSoalData.daftar_soal.filter(s => s.stimulus_image).length;
    }
    return count;
  }, [bankSoalData]);

  // Count LKPD images
  const lkpdImageCount = useMemo(() => {
    if (!lkpdData?.aktivitas_utama) return 0;
    return lkpdData.aktivitas_utama.filter(a => a.image).length;
  }, [lkpdData]);

  // Count Materi images
  const materiImageCount = useMemo(() => {
    if (!materiData) return 0;
    let count = materiData.header_image ? 1 : 0;
    if (materiData.isi_materi) {
      count += materiData.isi_materi.filter(s => s.image).length;
    }
    return count;
  }, [materiData]);

  // Max images
  const MAX_STIMULUS_IMAGES = 5;
  const MAX_LKPD_IMAGES = 3;
  const MAX_MATERI_IMAGES = 5;

  // Handler untuk update gambar stimulus (Bank Soal)
  const handleUpdateStimulusImage = useCallback((imageUrl: string, stimulusId?: number) => {
    if (!bankSoalData) return;
    
    if (stimulusId && bankSoalData.stimulus_list) {
      // Update gambar di stimulus_list
      const updatedList = bankSoalData.stimulus_list.map(st => 
        st.id === stimulusId ? { ...st, image: imageUrl } : st
      );
      setBankSoalData({ ...bankSoalData, stimulus_list: updatedList });
    } else {
      // Update gambar stimulus utama
      setBankSoalData({ ...bankSoalData, stimulus_image: imageUrl });
    }
  }, [bankSoalData]);

  // Handler untuk update gambar per-soal (independen dari stimulus)
  const handleUpdateSoalImage = useCallback((imageUrl: string, soalIndex: number) => {
    if (!bankSoalData?.daftar_soal) return;
    const updated = bankSoalData.daftar_soal.map((s, i) =>
      i === soalIndex ? { ...s, stimulus_image: imageUrl, requires_image: true } : s
    );
    setBankSoalData({ ...bankSoalData, daftar_soal: updated });
  }, [bankSoalData]);

  // Handler untuk update gambar LKPD
  const handleUpdateLkpdImage = useCallback((imageUrl: string, aktivitasIndex: number) => {
    if (!lkpdData?.aktivitas_utama) return;
    
    const updatedAktivitas = lkpdData.aktivitas_utama.map((act, i) => 
      i === aktivitasIndex ? { ...act, image: imageUrl } : act
    );
    setLkpdData({ ...lkpdData, aktivitas_utama: updatedAktivitas });
  }, [lkpdData]);

  // Handler untuk update gambar Materi
  const handleUpdateMateriImage = useCallback((imageUrl: string, subBabIndex: number, isHeader?: boolean) => {
    if (!materiData) return;
    
    if (isHeader) {
      // Update header image
      setMateriData({ ...materiData, header_image: imageUrl });
    } else if (materiData.isi_materi) {
      // Update sub-bab image
      const updatedIsiMateri = materiData.isi_materi.map((sec, i) => 
        i === subBabIndex ? { ...sec, image: imageUrl } : sec
      );
      setMateriData({ ...materiData, isi_materi: updatedIsiMateri });
    }
  }, [materiData]);

  // UI State
  const [selectedProfile, setSelectedProfile] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showSoalModal, setShowSoalModal] = useState(false);
  const [tempProfileName, setTempProfileName] = useState('');
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [showMigrationBanner, setShowMigrationBanner] = useState(false);
  const [showCPSelector, setShowCPSelector] = useState(false);
  const [isGeneratingTP, setIsGeneratingTP] = useState(false);
  const [isKontekstualisasiCP, setIsKontekstualisasiCP] = useState(false);
  const [isSuggestingDesain, setIsSuggestingDesain] = useState(false);

  // Temporary identification data for create profile modal
  const [tempIdentifikasiData, setTempIdentifikasiData] = useState({
    namaPenyusun: '',
    nipPenyusun: '',
    sekolah: '',
    kepalaSekolah: '',
    nipKepalaSekolah: '',
    mataPelajaran: '',
    kelas: '',
  });

  // Content History State
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [showSaveHistoryModal, setShowSaveHistoryModal] = useState(false);
  const [historyName, setHistoryName] = useState('');
  const { data: historyItems = [], isLoading: isHistoryLoading } = useContentHistory();
  const deleteHistoryMutation = useDeleteContentHistory();
  const saveHistoryMutation = useSaveContentHistory();
  const updateHistoryMutation = useUpdateContentHistory();

  // Navigation State
  const location = useLocation();
  const appMode = location.pathname.startsWith('/app/workspace') ? 'workspace' : 'quick';
  
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspace();
  
  useEffect(() => {
    // Match /app/workspace/:id and /app/workspace/:id/planning (and sub-paths)
    const match = location.pathname.match(/^\/app\/workspace\/([a-zA-Z0-9-]+)/);
    if (match) {
      const urlId = match[1];
      if (activeWorkspace?.id !== urlId && workspaces.length > 0) {
        const found = workspaces.find(w => w.id === urlId);
        if (found) {
          setActiveWorkspace(found);
        }
      }
    }
  }, [location.pathname, workspaces, activeWorkspace?.id, setActiveWorkspace]);
  const [activeTab, setActiveTab] = useState(ENABLE_PERTEMUAN_DOCS_V2 ? 'dashboard' : 'modul');
  const [mobileTab, setMobileTab] = useState<'form' | 'result'>('form');
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  // Form Data
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [soalConfig, setSoalConfig] = useState<SoalConfig>(DEFAULT_SOAL_CONFIG);
  const [showPromptExport, setShowPromptExport] = useState(false);


  // Modul dianggap lengkap jika jumlah pertemuan yang sudah ter-generate >= jumlah yang diminta
  const isModulComplete = useMemo(() => {
    if (!generatedSteps) return false;
    const generatedCount = (generatedSteps.pertemuan as any[])?.length || 0;
    return generatedCount >= formData.pertemuan.length;
  }, [generatedSteps, formData.pertemuan.length]);

  // Check for local profiles to migrate
  useEffect(() => {
    const localProfiles = localStorage.getItem('perangkat_ajar_profiles');
    if (localProfiles && user) {
      try {
        const profiles = JSON.parse(localProfiles);
        if (profiles.length > 0) {
          setShowMigrationBanner(true);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [user]);

  const handleMigrateProfiles = async () => {
    try {
      const result = await migrateProfilesMutation.mutateAsync();
      showNotificationMessage(`${result.migrated} profil berhasil dimigrasikan ke cloud!`);
      setShowMigrationBanner(false);
    } catch (error) {
      showNotificationMessage('Gagal migrasi profil', 'error');
    }
  };

  // Handlers
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'fase') {
      const kelasOptions = FASE_KELAS_MAP[value] || [];
      setFormData((prev) => ({ ...prev, fase: value, kelas: kelasOptions[0] || '' }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCheckboxChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => {
      const current = (prev[field] as string[]) || [];
      return {
        ...prev,
        [field]: current.includes(value)
          ? current.filter((item) => item !== value)
          : [...current, value],
      };
    });
  };

  const handlePertemuanChange = (pertemuan: PertemuanInput[]) => {
    setFormData((prev) => {
      const prevCount = prev.pertemuan.length;
      const newCount = pertemuan.length;
      // Jika jumlah pertemuan berubah dan modul sudah ter-generate,
      // reset semua hasil agar konsisten dengan target baru.
      if (prevCount !== newCount && generatedSteps) {
        setGeneratedSteps(null);
        setLkpdData(null);
        setAsesmenData(null);
        setMateriData(null);
        setTindakLanjutData(null);
        setBankSoalData(null);
        showNotificationMessage('Jumlah pertemuan berubah — hasil modul direset.', 'error');
      }
      return { ...prev, pertemuan };
    });
  };

  // Handler for nested object fields (e.g., materiPengetahuan.faktual)
  const handleNestedChange = (parent: keyof FormData, field: string, value: string) => {
    setFormData((prev) => {
      const parentValue = prev[parent];
      if (typeof parentValue === 'object' && parentValue !== null && !Array.isArray(parentValue)) {
        return {
          ...prev,
          [parent]: {
            ...parentValue,
            [field]: value,
          },
        };
      }
      return prev;
    });
  };

  const showNotificationMessage = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const updateLoader = (key: keyof typeof loaders, status: boolean) => {
    setLoaders((prev) => ({ ...prev, [key]: status }));
  };

  // Helper to update quota info from response
  const updateQuotaFromResponse = useCallback((responseData: Record<string, unknown>) => {
    if (responseData.remaining !== undefined && responseData.limit !== undefined) {
      setQuotaInfo({
        remaining: responseData.remaining as number,
        limit: responseData.limit as number,
        isTrial: !!responseData.isTrial,
      });
      if ((responseData.remaining as number) === 0 && responseData.isTrial) {
        setTrialCTAReason('quota');
        setShowTrialCTA(true);
      }
    }
    if (responseData.errorCode === 'rate_limit_exceeded' && responseData.isTrial) {
      setQuotaInfo({
        remaining: 0,
        limit: (responseData.limit as number) || 10,
        isTrial: true,
      });
      setTrialCTAReason('quota');
      setShowTrialCTA(true);
    }
    if (responseData.errorCode === 'demo_server_busy') {
      setTrialCTAReason('busy');
      setShowTrialCTA(true);
    }
  }, []);

  // === Dokumen per Pertemuan V2 (Fase 3) — hanya aktif saat feature flag ON ===
  const v2ContextKey = useMemo(() => buildContextKey(formData), [formData]);
  // Debounce agar dialog reset tidak muncul per ketikan.
  const [v2ContextKeyDebounced, setV2ContextKeyDebounced] = useState(v2ContextKey);
  useEffect(() => {
    const t = setTimeout(() => setV2ContextKeyDebounced(v2ContextKey), 800);
    return () => clearTimeout(t);
  }, [v2ContextKey]);

  const pertemuanV2 = usePertemuanGeneration({
    formData,
    seed: `${formData.mataPelajaran}|${formData.kelas}|${formData.materi}`,
    soalConfig,
    callbacks: {
      onQuota: (d) => updateQuotaFromResponse(d),
      onNotify: (message, type) => showNotificationMessage(message, type),
      onNeedApiKey: () =>
        showNotificationMessage(
          'API Key diperlukan. Silakan tambahkan di Pengaturan.',
          'error',
        ),
      onRestoreContext: (snapshot) => {
        // User membatalkan reset: kembalikan SELURUH field konteks canonical
        // (daftar sama dengan pembentuk contextKey) ke nilai sebelumnya.
        setFormData((prev) => ({ ...prev, ...pickContextFields(snapshot) }));
      },
      // Auto-fill kolom identifikasiMurid, jenisPengetahuan, lintasDisiplin, kemitraan
      // saat generate modul V2 pertama selesai — identik dengan flow V1.
      onAutoFill: (autoGenerated) =>
        handleAutoGeneratedFields({ auto_generated: autoGenerated }),
    },
  });

  const [v2ActivePertemuanId, setV2ActivePertemuanId] = useState<string>('');
  const [v2ActiveJenis, setV2ActiveJenis] = useState<JenisDokumenPertemuan>('modul');
  const v2HydratedRef = useRef(false);

  useEffect(() => {
    if (!ENABLE_PERTEMUAN_DOCS_V2) return;
    // Hidrasi awal dari state legacy: Modul yang sudah ada TIDAK diantrekan ulang.
    if (!v2HydratedRef.current && generatedSteps) {
      v2HydratedRef.current = true;
      pertemuanV2.hydrateFromLegacy({
        formData,
        generatedSteps,
        lkpdData,
        asesmenData,
        materiData,
        tindakLanjutData,
        bankSoalData,
      });
      return;
    }
    pertemuanV2.syncFromForm(formData.pertemuan, v2ContextKeyDebounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.pertemuan, v2ContextKeyDebounced, generatedSteps]);

  const v2Aktif =
    pertemuanV2.result.pertemuan.find((p) => p.id === v2ActivePertemuanId) ??
    pertemuanV2.result.pertemuan[0];
  const V2_TAB_MAP: Record<JenisDokumenPertemuan, string> = {
    modul: 'modul',
    lkpd: 'lkpd',
    asesmen: 'asesmen',
    soal: 'soal',
    materi: 'materi',
    refleksi: 'tindakLanjut',
  };
  /** UI/alur V2 aktif (skeleton pertemuan sudah ada) — BUKAN penanda konten. */
  const isV2Mode =
    ENABLE_PERTEMUAN_DOCS_V2 && pertemuanV2.result.pertemuan.length > 0;

  /** Ada dokumen V2 nyata yang bisa dipreview/disimpan. */
  const hasV2GeneratedContent = hasV2Content(pertemuanV2.result);

  /** Ada hasil/status/error V2 yang perlu dibersihkan tombol Reset. */
  const hasV2Resettable = isV2Mode && hasV2ResettableState(pertemuanV2.result);

  /** Ada konten (legacy atau V2) — dipakai tombol Simpan Riwayat & Reset. */
  const hasAnyContent = computeHasContent({
    legacy: [generatedSteps, protaData, kktpData, prosemSem1, prosemSem2],
    v2Active: isV2Mode,
    v2Result: pertemuanV2.result,
  });

  /** Ringkasan konten V2 untuk modal simpan (null saat mode legacy). */
  const v2Summary = useMemo(
    () => (isV2Mode ? summarizeGenerationResultV2(pertemuanV2.result) : null),
    [isV2Mode, pertemuanV2.result],
  );

  // --- Editor & gambar menulis ke state V2 (bukan state legacy) -------------
  const v2UpdateDoc = useCallback(
    (jenis: JenisDokumenPertemuan, updater: (doc: any) => any) => {
      if (!v2Aktif) return;
      pertemuanV2.updateDokumen(v2Aktif.id, jenis, updater as (d: unknown) => unknown);
    },
    [v2Aktif, pertemuanV2],
  );

  const v2Handlers = useMemo(
    () => ({
      onUpdateStimulusImage: (imageUrl: string, stimulusId?: number) =>
        v2UpdateDoc('soal', (bank) => {
          if (stimulusId && bank?.stimulus_list) {
            return {
              ...bank,
              stimulus_list: bank.stimulus_list.map((st: any) =>
                st.id === stimulusId ? { ...st, image: imageUrl } : st,
              ),
            };
          }
          return { ...bank, stimulus_image: imageUrl };
        }),
      onUpdateSoalImage: (imageUrl: string, soalIndex: number) =>
        v2UpdateDoc('soal', (bank) => ({
          ...bank,
          daftar_soal: (bank?.daftar_soal ?? []).map((s: any, i: number) =>
            i === soalIndex ? { ...s, stimulus_image: imageUrl, requires_image: true } : s,
          ),
        })),
      onUpdateLkpdImage: (imageUrl: string, aktivitasIndex: number) =>
        v2UpdateDoc('lkpd', (lkpd) => ({
          ...lkpd,
          aktivitas_utama: (lkpd?.aktivitas_utama ?? []).map((a: any, i: number) =>
            i === aktivitasIndex ? { ...a, image: imageUrl } : a,
          ),
        })),
      onUpdateMateriImage: (imageUrl: string, subBabIndex: number, isHeader?: boolean) =>
        v2UpdateDoc('materi', (materi) =>
          isHeader
            ? { ...materi, header_image: imageUrl }
            : {
                ...materi,
                isi_materi: (materi?.isi_materi ?? []).map((sec: any, i: number) =>
                  i === subBabIndex ? { ...sec, image: imageUrl } : sec,
                ),
              },
        ),
      onUpdateSection: (tab: string, sectionId: string, newContent: unknown) => {
        if (!v2Aktif) return;
        const jenis = (Object.keys(V2_TAB_MAP) as JenisDokumenPertemuan[]).find(
          (j) => V2_TAB_MAP[j] === tab,
        );
        if (!jenis) return;
        if (jenis === 'modul') {
          // Modul V2 disimpan sebagai objek pertemuan tunggal; buang prefiks.
          const path = sectionId.startsWith('pertemuan.0.')
            ? sectionId.slice('pertemuan.0.'.length)
            : sectionId;
          pertemuanV2.updateSection(v2Aktif.id, 'modul', path, newContent);
        } else {
          pertemuanV2.updateSection(v2Aktif.id, jenis, sectionId, newContent);
        }
        showNotificationMessage('Bagian berhasil diperbarui!');
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [v2UpdateDoc, v2Aktif, pertemuanV2, showNotificationMessage],
  );

  const v2ImageCounts = useMemo(() => {
    const bank = v2Aktif?.dokumen.soal as BankSoalData | undefined;
    const lkpd = v2Aktif?.dokumen.lkpd as LKPDData | undefined;
    const materi = v2Aktif?.dokumen.materi as MateriData | undefined;
    let stimulus = bank?.stimulus_image ? 1 : 0;
    stimulus += (bank?.stimulus_list ?? []).filter((s) => s.image).length;
    stimulus += (bank?.daftar_soal ?? []).filter((s) => s.stimulus_image).length;
    return {
      stimulus,
      lkpd: (lkpd?.aktivitas_utama ?? []).filter((a) => a.image).length,
      materi:
        (materi?.header_image ? 1 : 0) +
        (materi?.isi_materi ?? []).filter((s) => s.image).length,
    };
  }, [v2Aktif]);

  // --- FASE 4B: export dokumen multi-pertemuan V2 --------------------------
  const [showV2Export, setShowV2Export] = useState(false);
  const v2Export = useV2Export({
    result: pertemuanV2.result,
    formData,
    letterheadUrl,
    isLetterheadEnabled,
    notify: showNotificationMessage,
  });

  const v2BuildPlan = useCallback(
    ({ scope }: { scope: V2ExportScope }) =>
      v2Export.buildPlan({
        scope,
        activePertemuanId: v2Aktif?.id,
        activeJenisDokumen: v2ActiveJenis,
      }),
    [v2Export, v2Aktif, v2ActiveJenis],
  );

  const handleRunV2Export = useCallback(
    async ({ scope, format }: { scope: V2ExportScope; format: V2ExportFormat }) => {
      const ok = await v2Export.runExport({
        scope,
        format,
        activePertemuanId: v2Aktif?.id,
        activeJenisDokumen: v2ActiveJenis,
      });
      if (ok) setShowV2Export(false);
    },
    [v2Export, v2Aktif, v2ActiveJenis],
  );

  /**
   * Pertemuan V2 mana yang akan di-generate soalnya setelah modal konfigurasi ditutup.
   * null = modal soal dibuka dari flow V1 biasa.
   */
  const [v2SoalTargetId, setV2SoalTargetId] = useState<string | null>(null);

  /** Dipanggil dari PertemuanResultNavigator saat user klik "Buat Soal Pertemuan X". */
  const handleV2OpenSoalModal = useCallback((pertemuanId: string) => {
    setV2SoalTargetId(pertemuanId);
    setShowSoalModal(true);
  }, []);


  /** Hapus pertemuan V2 berdasarkan index form (stable ID di balik layar). */
  const v2CheckRemovePertemuan = useCallback(
    (index: number) => {
      const p = pertemuanV2.result.pertemuan[index];
      if (!p) return { allowed: true, requiresConfirm: false };
      return pertemuanV2.checkDeletePertemuan(p.id);
    },
    [pertemuanV2],
  );

  const v2RemovePertemuan = useCallback(
    (index: number) => {
      const p = pertemuanV2.result.pertemuan[index];
      if (p) pertemuanV2.removePertemuan(p.id);
    },
    [pertemuanV2],
  );


  // Profile Logic - Create New Profile
  const handleCreateNewProfile = () => {
    setTempProfileName('');
    setTempIdentifikasiData({
      namaPenyusun: '',
      nipPenyusun: '',
      sekolah: '',
      kepalaSekolah: '',
      nipKepalaSekolah: '',
      mataPelajaran: '',
      kelas: '',
    });
    setIsCreatingNew(true);
    setShowSaveModal(true);
  };

  // Handler for temporary identification data changes
  const handleTempIdentifikasiChange = (field: keyof typeof tempIdentifikasiData, value: string) => {
    setTempIdentifikasiData(prev => ({ ...prev, [field]: value }));
  };

  // Profile Logic - Update existing profile
  const handleUpdateProfile = async () => {
    if (!selectedProfile) return;

    const profileData: Partial<FormData> = {};
    IDENTIFIKASI_FIELDS.forEach((f) => {
      (profileData as Record<string, unknown>)[f] = formData[f as keyof FormData];
    });

    try {
      await saveProfileMutation.mutateAsync({ name: selectedProfile, data: profileData });
      showNotificationMessage('Perubahan tersimpan!');
    } catch (error) {
      showNotificationMessage('Gagal menyimpan profil', 'error');
    }
  };

  // Execute save from modal (for create new only)
  const executeSaveProfile = async () => {
    if (!tempProfileName.trim()) {
      showNotificationMessage('Nama profil tidak boleh kosong!', 'error');
      return;
    }

    // Check if profile name already exists
    const existingProfile = cloudProfiles.find(
      (p) => p.name.toLowerCase() === tempProfileName.trim().toLowerCase()
    );
    if (existingProfile) {
      showNotificationMessage('Nama profil sudah ada, gunakan nama lain!', 'error');
      return;
    }

    try {
      // Save profile with identification data from modal
      await saveProfileMutation.mutateAsync({ 
        name: tempProfileName.trim(), 
        data: tempIdentifikasiData 
      });
      
      // Update formData with identification data from modal
      setFormData(prev => ({
        ...DEFAULT_FORM_DATA,
        ...tempIdentifikasiData,
      }));
      
      // Select the new profile
      setSelectedProfile(tempProfileName.trim());
      
      setShowSaveModal(false);
      setIsCreatingNew(false);
      showNotificationMessage('Profil berhasil dibuat!');
    } catch (error) {
      showNotificationMessage('Gagal membuat profil', 'error');
    }
  };

  const handleCloseModal = () => {
    setShowSaveModal(false);
    setIsCreatingNew(false);
  };

  const handleLoadProfile = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const name = e.target.value;
    setSelectedProfile(name);
    if (!name) return;

    const profile = cloudProfiles.find((p) => p.name === name);
    if (profile) {
      setFormData((prev) => ({ ...prev, ...profile.data }));
      showNotificationMessage('Profil dimuat.');
    }
  };

  const handleDeleteProfile = async () => {
    if (!selectedProfile) return;
    
    try {
      await deleteProfileMutation.mutateAsync(selectedProfile);
      setSelectedProfile('');
      showNotificationMessage('Profil dihapus.', 'error');
    } catch (error) {
      showNotificationMessage('Gagal menghapus profil', 'error');
    }
  };

  const resetAll = () => {
    // Reset lifecycle V2: batalkan antrean & buang seluruh dokumen V2.
    if (isV2Mode) {
      if (pertemuanV2.isGenerating) {
        const ok = window.confirm(
          'Proses generate masih berjalan. Batalkan antrean dan reset semua hasil?',
        );
        if (!ok) return;
      }
      pertemuanV2.resetV2();
      setV2ActivePertemuanId('');
      setV2ActiveJenis('modul');
      setIsPreviewFullscreen(false);
    }
    setGeneratedSteps(null);
    setLkpdData(null);
    setAsesmenData(null);
    setMateriData(null);
    setTindakLanjutData(null);
    setGeneratedImage(null);
    setSoalImage(null);
    setBankSoalData(null);
    setError('');
    setActiveTab('modul');
  };

  // CP Selection handler
  const handleSelectCP = (cpText: string) => {
    setFormData((prev) => ({ ...prev, capaianPembelajaran: cpText }));
    showNotificationMessage('CP resmi berhasil dipilih!');
  };

  // Generate Tujuan Pembelajaran with AI
  const handleGenerateTP = async () => {
    if (!formData.capaianPembelajaran) {
      showNotificationMessage('Isi Capaian Pembelajaran terlebih dahulu', 'error');
      return;
    }

    setIsGeneratingTP(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: { type: 'tujuan-pembelajaran', data: formData },
      });

      if (error) throw error;
      if (data?.error) {
        if (data.errorCode === 'demo_server_busy' || data.errorCode === 'rate_limit_exceeded') {
          updateQuotaFromResponse(data);
          return;
        }
        showNotificationMessage(data.error, 'error');
        return;
      }

      // Extract teks_gabungan from response
      const tpData = data?.data;
      if (tpData?.teks_gabungan) {
        setFormData((prev) => ({ ...prev, tujuanPembelajaran: tpData.teks_gabungan }));
        showNotificationMessage('Tujuan Pembelajaran berhasil di-generate!');
      } else if (tpData?.tujuan_pembelajaran) {
        const tpText = tpData.tujuan_pembelajaran
          .map((tp: any) => `TP${tp.nomor}: ${tp.teks}`)
          .join('\n');
        setFormData((prev) => ({ ...prev, tujuanPembelajaran: tpText }));
        showNotificationMessage('Tujuan Pembelajaran berhasil di-generate!');
      } else {
        showNotificationMessage('Format response TP tidak valid', 'error');
      }

      if (data) updateQuotaFromResponse(data);
    } catch (err) {
      console.error('TP generation error:', err);
      showNotificationMessage('Gagal generate Tujuan Pembelajaran', 'error');
    } finally {
      setIsGeneratingTP(false);
    }
  };

  // Kontekstualisasi CP with AI
  const handleKontekstualisasiCP = async () => {
    if (!formData.capaianPembelajaran || !formData.materi) {
      showNotificationMessage('Isi CP dan Materi terlebih dahulu', 'error');
      return;
    }

    setIsKontekstualisasiCP(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: { type: 'kontekstualisasi-cp', data: formData },
      });

      if (error) throw error;
      if (data?.error) {
        if (data.errorCode === 'demo_server_busy' || data.errorCode === 'rate_limit_exceeded') {
          updateQuotaFromResponse(data);
          return;
        }
        showNotificationMessage(data.error, 'error');
        return;
      }

      const cpData = data?.data;
      if (cpData?.cp_kontekstual) {
        setFormData((prev) => ({ ...prev, capaianPembelajaran: cpData.cp_kontekstual }));
        showNotificationMessage('CP berhasil disesuaikan dengan materi!');
      } else {
        showNotificationMessage('Format response tidak valid', 'error');
      }

      if (data) updateQuotaFromResponse(data);
    } catch (err) {
      console.error('CP kontekstualisasi error:', err);
      showNotificationMessage('Gagal menyesuaikan CP', 'error');
    } finally {
      setIsKontekstualisasiCP(false);
    }
  };

  // AI Suggest Desain Pembelajaran
  const handleSuggestDesain = async () => {
    if (!formData.capaianPembelajaran || !formData.tujuanPembelajaran) {
      showNotificationMessage('Isi CP dan Tujuan Pembelajaran terlebih dahulu', 'error');
      return;
    }

    setIsSuggestingDesain(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: { type: 'suggest-desain-pembelajaran', data: formData },
      });

      if (error) throw error;
      if (data?.error) {
        if (data.errorCode === 'demo_server_busy' || data.errorCode === 'rate_limit_exceeded') {
          updateQuotaFromResponse(data);
          return;
        }
        showNotificationMessage(data.error, 'error');
        return;
      }

      const suggestion = data?.data;
      if (suggestion) {
        setFormData((prev) => ({
          ...prev,
          ...(suggestion.modelPembelajaran ? { modelPembelajaran: suggestion.modelPembelajaran } : {}),
          ...(suggestion.metodePembelajaran?.length ? { metodePembelajaran: suggestion.metodePembelajaran } : {}),
          ...(suggestion.dimensiProfilLulusan?.length ? { dimensiProfilLulusan: suggestion.dimensiProfilLulusan } : {}),
          ...(suggestion.nilaiKarakter?.length ? { nilaiKarakter: suggestion.nilaiKarakter } : {}),
        }));
        const alasan = suggestion.alasan ? `\n${suggestion.alasan}` : '';
        showNotificationMessage(`Desain pembelajaran disarankan oleh AI!${alasan}`);
      } else {
        showNotificationMessage('Format response tidak valid', 'error');
      }

      if (data) updateQuotaFromResponse(data);
    } catch (err) {
      console.error('Suggest desain error:', err);
      showNotificationMessage('Gagal mendapatkan saran desain pembelajaran', 'error');
    } finally {
      setIsSuggestingDesain(false);
    }
  };

  /**
   * Cegah menyimpan riwayat ketika antrean generate V2 masih berjalan
   * (status `pending` bukan hasil final).
   */
  const guardSaveWhileGenerating = (): boolean => {
    if (!isV2Mode || !pertemuanV2.isGenerating) return true;
    return window.confirm(
      'Proses generate masih berjalan. Dokumen yang belum selesai tidak akan tersimpan. Lanjut menyimpan?',
    );
  };

  /** Buang seluruh state dokumen legacy (dipakai saat pindah ke mode V2). */
  const clearLegacyDocumentState = () => {
    setGeneratedSteps(null);
    setLkpdData(null);
    setAsesmenData(null);
    setMateriData(null);
    setBankSoalData(null);
    setTindakLanjutData(null);
  };

  /**
   * FASE 4A.2 — Prota/Prosem/KKTP BUKAN bagian paket History V2 (Dokumen per
   * Pertemuan). Saat memuat history V2, planning dari workspace sebelumnya
   * dibersihkan agar tidak terlihat seolah bagian dari Modul yang dimuat.
   * Relasi ke perencanaan tahunan akan dirancang pada workspace terpisah.
   */
  const clearPlanningState = () => {
    setProtaData(null);
    setKktpData(null);
    setProsemSem1(null);
    setProsemSem2(null);
  };


  // Content History Handlers
  const handleLoadHistory = (item: ContentHistoryItem) => {
    const plan = resolveHistoryLoadPlan(item, { flagOn: ENABLE_PERTEMUAN_DOCS_V2 });

    // --- Payload V2 invalid / flag OFF: state aktif TIDAK berubah ----------
    if (plan.mode === 'reject') {
      showNotificationMessage(plan.reason, 'error');
      return;
    }

    // --- History versi 2 (Dokumen per Pertemuan) ---------------------------
    if (plan.mode === 'v2') {
      const parsed = { value: plan.value };
      // Payload sudah valid → baru bersihkan state lama (queue + epoch).
      pertemuanV2.resetV2();
      // Bersihkan SELURUH state dokumen legacy supaya tidak ada data tersembunyi
      // yang ikut tersimpan atau membuat UI menampilkan mode salah.
      clearLegacyDocumentState();
      if (plan.clearPlanning) clearPlanningState();
      v2HydratedRef.current = true;

      setFormData(item.form_data);
      pertemuanV2.loadResult(parsed.value, item.form_data);
      const first = parsed.value.pertemuan[0];
      setV2ActivePertemuanId(first?.id ?? '');
      const jenisPertama = (
        ['modul', 'lkpd', 'asesmen', 'soal', 'materi', 'refleksi'] as JenisDokumenPertemuan[]
      ).find((j) => first?.dokumen?.[j]);
      setV2ActiveJenis(jenisPertama ?? 'modul');
      if (jenisPertama) setActiveTab(V2_TAB_MAP[jenisPertama]);
      // Dokumen V2 TIDAK disalin ke state legacy.
      setGeneratedImage(null);
      setSoalImage(null);
      setError('');
      setMobileTab('result');
      showNotificationMessage('Riwayat (Dokumen per Pertemuan) dimuat!');
      return;
    }

    // --- History versi 1 (legacy) ------------------------------------------
    // Buang residu hasil V2 dari history sebelumnya (tidak ada generate ulang).
    if (plan.resetV2) pertemuanV2.resetV2();

    // Load form data
    setFormData(item.form_data);
    
    // Load all generated content
    setGeneratedSteps(item.modul_data);
    setLkpdData(item.lkpd_data);
    setAsesmenData(item.asesmen_data);
    setMateriData(item.materi_data);
    setBankSoalData(item.bank_soal_data);
    setTindakLanjutData(item.tindak_lanjut_data);
    
    // Load planning data
    setProtaData(item.prota_data || null);
    setKktpData(item.kktp_data || null);
    if (item.prosem_data) {
      setProsemSem1(item.prosem_data.sem1 || null);
      setProsemSem2(item.prosem_data.sem2 || null);
    } else {
      setProsemSem1(null);
      setProsemSem2(null);
    }
    
    // Reset other states
    setGeneratedImage(null);
    setSoalImage(null);
    setError('');
    setActiveTab(item.modul_data ? 'modul' : item.prota_data ? 'perencanaan' : 'modul');
    setMobileTab('result');

    // Flag ON: hidrasi V2 dilakukan EKSPLISIT dari history legacy ini (bukan
    // mengandalkan useEffect hidrasi pertama). Modul legacy multi-pertemuan
    // tetap terlihat; dokumen non-Modul tetap sebagai dokumenGlobal.
    if (ENABLE_PERTEMUAN_DOCS_V2) {
      v2HydratedRef.current = true;
      if (plan.hydrateLegacy && item.modul_data) {
        pertemuanV2.hydrateFromLegacy({
          formData: item.form_data,
          generatedSteps: item.modul_data,
          lkpdData: item.lkpd_data,
          asesmenData: item.asesmen_data,
          materiData: item.materi_data,
          tindakLanjutData: item.tindak_lanjut_data,
          bankSoalData: item.bank_soal_data,
        });
      }
      setV2ActivePertemuanId('');
      setV2ActiveJenis('modul');
    }

    showNotificationMessage('Riwayat konten dimuat!');
  };

  const handleSaveHistory = async () => {
    if (!historyName.trim()) {
      showNotificationMessage('Nama riwayat tidak boleh kosong!', 'error');
      return;
    }
    if (!guardSaveWhileGenerating()) return;

    try {
      await saveHistoryMutation.mutateAsync({
        name: historyName.trim(),
        form_data: formData,
        ...(isV2Mode && hasV2GeneratedContent
          ? { generation_result_v2: pertemuanV2.result }
          : {}),
        modul_data: generatedSteps,
        lkpd_data: lkpdData,
        asesmen_data: asesmenData,
        materi_data: materiData,
        bank_soal_data: bankSoalData,
        tindak_lanjut_data: tindakLanjutData,
        prota_data: protaData,
        kktp_data: kktpData,
        prosem_data: (prosemSem1 || prosemSem2) ? { sem1: prosemSem1, sem2: prosemSem2 } : null,
      });
      
      setShowSaveHistoryModal(false);
      setHistoryName('');
      showNotificationMessage('Riwayat konten berhasil disimpan!');
    } catch (error) {
      console.error('Failed to save history:', error);
      showNotificationMessage('Gagal menyimpan riwayat', 'error');
    }
  };

  const handleUpdateHistory = async () => {
    if (!selectedHistoryId) return;
    if (!historyName.trim()) {
      showNotificationMessage('Nama riwayat tidak boleh kosong!', 'error');
      return;
    }
    if (!guardSaveWhileGenerating()) return;
    try {
      await updateHistoryMutation.mutateAsync({
        id: selectedHistoryId,
        name: historyName.trim(),
        form_data: formData,
        ...(isV2Mode && hasV2GeneratedContent
          ? { generation_result_v2: pertemuanV2.result }
          : {}),
        modul_data: generatedSteps,
        lkpd_data: lkpdData,
        asesmen_data: asesmenData,
        materi_data: materiData,
        bank_soal_data: bankSoalData,
        tindak_lanjut_data: tindakLanjutData,
        prota_data: protaData,
        kktp_data: kktpData,
        prosem_data: (prosemSem1 || prosemSem2) ? { sem1: prosemSem1, sem2: prosemSem2 } : null,
      });
      setShowSaveHistoryModal(false);
      showNotificationMessage('Riwayat berhasil diupdate!');
    } catch (error) {
      console.error('Failed to update history:', error);
      showNotificationMessage('Gagal mengupdate riwayat', 'error');
    }
  };

  const openSaveHistoryModal = () => {
    // Auto-generate name from formData
    const mapel = formData.mataPelajaran || 'Konten';
    const materi = formData.materi || '';
    const date = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    const autoName = materi ? `${mapel} - ${materi} (${date})` : `${mapel} (${date})`;
    setHistoryName(autoName);
    setShowSaveHistoryModal(true);
  };

  const handleDeleteHistory = async () => {
    if (!selectedHistoryId) return;
    
    const confirmed = window.confirm('Hapus riwayat konten ini?');
    if (!confirmed) return;

    try {
      await deleteHistoryMutation.mutateAsync(selectedHistoryId);
      setSelectedHistoryId(null);
      showNotificationMessage('Riwayat berhasil dihapus');
    } catch (error) {
      console.error('Failed to delete history:', error);
      showNotificationMessage('Gagal menghapus riwayat', 'error');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  // Helper: Summarize pertemuan for context in sequential generation
  const summarizePertemuan = (pertemuanArray: any[]): string => {
    return pertemuanArray.map((p: any) => {
      const topik = p.tahap_inti?.judul || p.tahap_inti?.fase_pembelajaran?.[0]?.deskripsi || '';
      return `Pertemuan ${p.nomorPertemuan} (${p.durasi}): ${topik}`;
    }).join('\n');
  };

  // Generate functions using AI
  // FLOW BARU: Generate Modul = base modul + Pertemuan 1 saja.
  // Pertemuan berikutnya digenerate manual via tombol di preview.
  const generateLessonPlan = async () => {
    if (!formData.tujuanPembelajaran || !formData.mataPelajaran || !formData.namaPenyusun) {
      showNotificationMessage('Isi data wajib (*) dulu ya!', 'error');
      return;
    }

    setLoading(true);
    setError('');
    setGenerationProgress(null);
    resetAll();
    setMobileTab('result');

    try {
      const pertemuanCount = formData.pertemuan.length;
      setGenerationProgress({ current: 1, total: pertemuanCount });

      // Selalu generate base modul + Pertemuan 1 dulu
      const firstFormData = {
        ...formData,
        pertemuan: [formData.pertemuan[0]],
      };
      const { data: firstData, error: firstError } = await supabase.functions.invoke('generate-content', {
        body: { type: 'modul', data: firstFormData },
      });

      if (firstError) throw firstError;
      if (firstData.needApiKey) {
        showNotificationMessage('API Key diperlukan. Silakan tambahkan di Pengaturan.', 'error');
        setError('API Key tidak tersedia. Buka menu Pengaturan untuk menambahkan API Key.');
        setLoading(false);
        return;
      }
      if (firstData.error) {
        updateQuotaFromResponse(firstData);
        showNotificationMessage(firstData.error, 'error');
        setError(firstData.error);
        setLoading(false);
        return;
      }

      if (!firstData.data?.pertemuan?.[0]) {
        showNotificationMessage('Gagal generate pertemuan pertama. Coba lagi.', 'error');
        setError('Struktur modul tidak lengkap.');
        setLoading(false);
        return;
      }

      // Pertemuan 1 pakai nomor & durasi sesuai input user
      const firstPertemuan = {
        ...firstData.data.pertemuan[0],
        nomorPertemuan: formData.pertemuan[0].nomorPertemuan,
        durasi: formData.pertemuan[0].durasi,
      };

      const combinedSteps = {
        pemahaman_bermakna: firstData.data.pemahaman_bermakna,
        pertemuan: [firstPertemuan],
        auto_generated: firstData.data.auto_generated,
      };

      setGeneratedSteps(combinedSteps);
      updateQuotaFromResponse(firstData);
      handleAutoGeneratedFields(combinedSteps);

      if (pertemuanCount > 1) {
        showNotificationMessage(
          `Pertemuan 1 selesai. Klik "Generate Pertemuan 2" untuk melanjutkan.`,
          'success'
        );
      }
    } catch (err) {
      console.error('Generation error:', err);
      showNotificationMessage('Gagal membuat modul. Silakan coba lagi.', 'error');
      setError('Terjadi kesalahan saat membuat modul');
    } finally {
      setLoading(false);
      setGenerationProgress(null);
    }
  };

  // Generate satu pertemuan tertentu (untuk pertemuan ke-2 dst, dipanggil manual)
  const generatePertemuanByIndex = useCallback(async (pertemuanIndex: number) => {
    if (!generatedSteps) {
      showNotificationMessage('Generate modul utama terlebih dahulu.', 'error');
      return;
    }
    const pertemuanCount = formData.pertemuan.length;
    if (pertemuanIndex < 0 || pertemuanIndex >= pertemuanCount) return;

    const target = formData.pertemuan[pertemuanIndex];
    if (!target) return;

    // Cek apakah pertemuan ini sudah ada
    const existing = (generatedSteps.pertemuan || []) as any[];
    if (existing.some((p) => p?.nomorPertemuan === target.nomorPertemuan)) {
      showNotificationMessage(`Pertemuan ${target.nomorPertemuan} sudah ada.`, 'error');
      return;
    }

    setLoading(true);
    setGenerationProgress({ current: pertemuanIndex + 1, total: pertemuanCount });

    const maxRetries = 3;
    let success = false;
    let lastError = '';

    for (let retry = 0; retry < maxRetries; retry++) {
      if (retry > 0) {
        setGenerationProgress({ current: pertemuanIndex + 1, total: pertemuanCount, retrying: true });
        await new Promise((r) => setTimeout(r, 2000 * retry));
      }

      try {
        const { data, error } = await supabase.functions.invoke('generate-content', {
          body: {
            type: 'modul-pertemuan',
            data: {
              ...formData,
              pertemuanIndex,
              pertemuanTarget: target,
              totalPertemuan: pertemuanCount,
              previousSummary: summarizePertemuan(existing),
            },
          },
        });

        if (error) throw error;
        if (data?.needApiKey) {
          showNotificationMessage('API Key diperlukan.', 'error');
          break;
        }
        if (data?.error) {
          lastError = data.error;
          updateQuotaFromResponse(data);
          continue;
        }
        if (!data?.data) {
          lastError = 'Response kosong';
          continue;
        }

        const newPertemuan = {
          ...data.data,
          nomorPertemuan: target.nomorPertemuan,
          durasi: target.durasi,
        };

        setGeneratedSteps((prev) => {
          if (!prev) return prev;
          const merged = [...((prev.pertemuan as any[]) || []), newPertemuan]
            .sort((a, b) => (a.nomorPertemuan || 0) - (b.nomorPertemuan || 0));
          return { ...prev, pertemuan: merged };
        });
        updateQuotaFromResponse(data);
        success = true;
        showNotificationMessage(`Pertemuan ${target.nomorPertemuan} berhasil dibuat!`);
        break;
      } catch (err: any) {
        lastError = err?.message || 'Network error';
        console.error(`Generate pertemuan ${pertemuanIndex + 1} attempt ${retry + 1}:`, err);
      }
    }

    if (!success) {
      showNotificationMessage(
        `Gagal membuat Pertemuan ${target.nomorPertemuan}: ${lastError || 'coba lagi'}`,
        'error'
      );
    } else {
      setActiveTab('modul');
    }

    setLoading(false);
    setGenerationProgress(null);
  }, [generatedSteps, formData, showNotificationMessage, updateQuotaFromResponse]);

  // Helper: Process auto_generated fields from modul response
  const handleAutoGeneratedFields = (data: any) => {
    if (data?.auto_generated) {
      const autoGen = data.auto_generated;
      setFormData((prev) => ({
        ...prev,
        aspekPengetahuanAwal: prev.aspekPengetahuanAwal || autoGen.identifikasi_murid?.aspek_pengetahuan_awal || '',
        aspekMinat: prev.aspekMinat || autoGen.identifikasi_murid?.aspek_minat || '',
        aspekLatarBelakang: prev.aspekLatarBelakang || autoGen.identifikasi_murid?.aspek_latar_belakang || '',
        aspekKebutuhanBelajar: prev.aspekKebutuhanBelajar || autoGen.identifikasi_murid?.aspek_kebutuhan_belajar || '',
        materiPengetahuan: {
          faktual: prev.materiPengetahuan.faktual || autoGen.materi_pengetahuan?.faktual || '',
          konseptual: prev.materiPengetahuan.konseptual || autoGen.materi_pengetahuan?.konseptual || '',
          prosedural: prev.materiPengetahuan.prosedural || autoGen.materi_pengetahuan?.prosedural || '',
          metakognitif: prev.materiPengetahuan.metakognitif || autoGen.materi_pengetahuan?.metakognitif || '',
        },
        kaitanKehidupan: prev.kaitanKehidupan || autoGen.kaitan_kehidupan || '',
        dimensiProfilLulusan: prev.dimensiProfilLulusan?.length > 0 ? prev.dimensiProfilLulusan : (autoGen.dimensi_profil_lulusan || []),
        nilaiKarakter: prev.nilaiKarakter?.length > 0 ? prev.nilaiKarakter : (autoGen.nilai_karakter || []),
        lintasDisiplinIlmu: {
          ppkn: prev.lintasDisiplinIlmu.ppkn || autoGen.lintas_disiplin?.ppkn || '',
          ips: prev.lintasDisiplinIlmu.ips || autoGen.lintas_disiplin?.ips || '',
          matematika: prev.lintasDisiplinIlmu.matematika || autoGen.lintas_disiplin?.matematika || '',
          bahasaIndonesia: prev.lintasDisiplinIlmu.bahasaIndonesia || autoGen.lintas_disiplin?.bahasa_indonesia || '',
          seniBudaya: prev.lintasDisiplinIlmu.seniBudaya || autoGen.lintas_disiplin?.seni_budaya || '',
          prakarya: prev.lintasDisiplinIlmu.prakarya || autoGen.lintas_disiplin?.prakarya || '',
          penjaskes: prev.lintasDisiplinIlmu.penjaskes || autoGen.lintas_disiplin?.penjaskes || '',
        },
        kemitraanPembelajaran: {
          guruBidangStudiLain: prev.kemitraanPembelajaran.guruBidangStudiLain || autoGen.kemitraan?.guru_bidang_studi_lain || '',
          orangTua: prev.kemitraanPembelajaran.orangTua || autoGen.kemitraan?.orang_tua || '',
          tokohMasyarakat: prev.kemitraanPembelajaran.tokohMasyarakat || autoGen.kemitraan?.tokoh_masyarakat || '',
          instansiTerkait: prev.kemitraanPembelajaran.instansiTerkait || autoGen.kemitraan?.instansi_terkait || '',
          duniaUsaha: prev.kemitraanPembelajaran.duniaUsaha || autoGen.kemitraan?.dunia_usaha || '',
          perguruanTinggiLSM: prev.kemitraanPembelajaran.perguruanTinggiLSM || autoGen.kemitraan?.perguruan_tinggi_lsm || '',
          mgmpKomunitasBelajar: prev.kemitraanPembelajaran.mgmpKomunitasBelajar || autoGen.kemitraan?.mgmp_komunitas_belajar || '',
        },
        lingkunganPembelajaranDetail: {
          ruangFisik: prev.lingkunganPembelajaranDetail.ruangFisik || autoGen.lingkungan?.ruang_fisik || '',
          ruangVirtual: prev.lingkunganPembelajaranDetail.ruangVirtual || autoGen.lingkungan?.ruang_virtual || '',
          budayaBelajar: prev.lingkunganPembelajaranDetail.budayaBelajar || autoGen.lingkungan?.budaya_belajar || '',
        },
        pemanfaatanDigitalDetail: {
          perencanaan: prev.pemanfaatanDigitalDetail.perencanaan || autoGen.pemanfaatan_digital?.perencanaan || '',
          pelaksanaan: prev.pemanfaatanDigitalDetail.pelaksanaan || autoGen.pemanfaatan_digital?.pelaksanaan || '',
          asesmen: prev.pemanfaatanDigitalDetail.asesmen || autoGen.pemanfaatan_digital?.asesmen || '',
        },
        topikPancaCinta: (prev.topikPancaCinta?.length > 0 ? prev.topikPancaCinta : (autoGen.topik_panca_cinta || prev.topikPancaCinta || [])),
        materiIntegrasiKBC: prev.materiIntegrasiKBC || autoGen.materi_integrasi_kbc || '',
      }));
      showNotificationMessage('Modul + data auto-fill berhasil dibuat!');
      markTPAsGenerated(formData.tujuanPembelajaran);
    } else {
      console.warn('auto_generated tidak ditemukan dalam response.');
      showNotificationMessage('Modul berhasil dibuat! (Isi field lainnya secara manual)');
      markTPAsGenerated(formData.tujuanPembelajaran);
    }
  };

  // Handler: Auto-fill form from Prota TP
  const handleCreateModulFromTP = useCallback((item: ProtaItem) => {
    const jpPerMinggu = kalenderPendidikan.jpPerMinggu || 2;
    const pertemuanCount = Math.max(1, Math.ceil(item.alokasi_jp / jpPerMinggu));
    const pertemuanInputs: PertemuanInput[] = Array.from({ length: pertemuanCount }, (_, i) => ({
      nomorPertemuan: i + 1,
      durasi: `${jpPerMinggu * 40} menit`,
    }));

    setFormData(prev => ({
      ...prev,
      tujuanPembelajaran: item.tujuan_pembelajaran,
      materi: item.materi_pokok,
      semester: item.semester.toString(),
      pertemuan: pertemuanInputs,
    }));

    setActiveTab('modul');
    setMobileTab('form');
    showNotificationMessage(`Form terisi dari TP #${item.no}. Lengkapi lalu generate Modul Ajar.`);
  }, [kalenderPendidikan]);

  // Mark TP as generated after successful modul generation
  const markTPAsGenerated = useCallback((tp: string) => {
    if (!protaData) return;
    const newProta = protaData.prota.map(item => {
      if (!item.generated && tp.includes(item.tujuan_pembelajaran.substring(0, 50))) {
        return { ...item, generated: true };
      }
      return item;
    });
    if (newProta.some((item, i) => item.generated !== protaData.prota[i].generated)) {
      setProtaData({ ...protaData, prota: newProta });
    }
  }, [protaData]);

  const generateLKPD = async () => {
    if (!generatedSteps) return;
    if (!isModulComplete) {
      showNotificationMessage(`Selesaikan semua ${formData.pertemuan.length} pertemuan dulu sebelum generate tab ini.`, "error");
      return;
    }
    updateLoader('lkpd', true);
    setActiveTab('lkpd');

    try {
      const { data, error } = await invokeGenerateWithRetry(
        { type: 'lkpd', data: formData },
        { onRetry: (n, r) => console.warn(`[LKPD] retry #${n}: ${r}`) }
      ) as any;

      if (error) throw error;
      if (data.needApiKey) {
        showNotificationMessage('API Key diperlukan. Silakan tambahkan di Pengaturan.', 'error');
        updateLoader('lkpd', false);
        return;
      }
      if (data.error) {
        updateQuotaFromResponse(data);
        throw new Error(data.error);
      }

      setLkpdData(data.data);
      updateQuotaFromResponse(data);
      showNotificationMessage('LKPD siap!');
    } catch (err) {
      console.error('LKPD error:', err);
      const message = err instanceof Error && err.message
        ? err.message
        : 'Gagal membuat LKPD';
      showNotificationMessage(message, 'error');
    } finally {
      updateLoader('lkpd', false);
    }
  };

  const regenerateLKPD = useCallback(() => {
    setLkpdData(null);
    setTimeout(() => generateLKPD(), 100);
  }, [generatedSteps, formData]);

  const regenerateAsesmen = useCallback(() => {
    setAsesmenData(null);
    setTimeout(() => generateAsesmen(), 100);
  }, [generatedSteps, formData]);

  const regenerateMateri = useCallback(() => {
    setMateriData(null);
    setTimeout(() => generateMateri(), 100);
  }, [generatedSteps, formData]);

  const regenerateTindakLanjut = useCallback(() => {
    setTindakLanjutData(null);
    setTimeout(() => generateTindakLanjut(), 100);
  }, [generatedSteps, formData]);

  const regenerateBankSoal = useCallback(() => {
    setBankSoalData(null);
    setShowSoalModal(true);
  }, []);

  // State for regenerate modul confirmation
  const [showRegenerateModulAlert, setShowRegenerateModulAlert] = useState(false);

  const regenerateModul = useCallback(() => {
    // Reset all dependent tabs
    setLkpdData(null);
    setAsesmenData(null);
    setMateriData(null);
    setTindakLanjutData(null);
    setBankSoalData(null);
    setGeneratedImage(null);
    setSoalImage(null);
    setGeneratedSteps(null);
    setError('');
    // Re-generate
    setTimeout(() => generateLessonPlan(), 100);
  }, [formData]);

  const generateAsesmen = async () => {
    if (!generatedSteps) return;
    if (!isModulComplete) {
      showNotificationMessage(`Selesaikan semua ${formData.pertemuan.length} pertemuan dulu sebelum generate tab ini.`, "error");
      return;
    }
    updateLoader('asesmen', true);
    setActiveTab('asesmen');

    try {
      const { data, error } = await invokeGenerateWithRetry(
        { type: 'asesmen', data: formData },
        { onRetry: (n, r) => console.warn(`[Asesmen] retry #${n}: ${r}`) }
      ) as any;

      if (error) throw error;
      if (data.needApiKey) {
        showNotificationMessage('API Key diperlukan. Silakan tambahkan di Pengaturan.', 'error');
        updateLoader('asesmen', false);
        return;
      }
      if (data.error) {
        updateQuotaFromResponse(data);
        throw new Error(data.error);
      }

      setAsesmenData(data.data);
      updateQuotaFromResponse(data);
      showNotificationMessage('Asesmen siap!');
    } catch (err) {
      console.error('Asesmen error:', err);
      showNotificationMessage('Gagal membuat Asesmen', 'error');
    } finally {
      updateLoader('asesmen', false);
    }
  };

  const generateMateri = async () => {
    if (!generatedSteps) return;
    if (!isModulComplete) {
      showNotificationMessage(`Selesaikan semua ${formData.pertemuan.length} pertemuan dulu sebelum generate tab ini.`, "error");
      return;
    }
    updateLoader('materi', true);
    setActiveTab('materi');

    try {
      const { data, error } = await invokeGenerateWithRetry(
        { type: 'materi', data: formData },
        {
          onRetry: (n, r) => console.warn(`[Materi] retry #${n}: ${r}`),
          validate: (d) => (!d?.data?.judul_materi ? 'judul_materi missing' : null),
        }
      ) as any;

      // Log response for debugging
      console.log('Materi response:', data);

      if (error) {
        console.error('Materi invoke error:', error);
        throw error;
      }
      if (data.needApiKey) {
        showNotificationMessage('API Key diperlukan. Silakan tambahkan di Pengaturan.', 'error');
        updateLoader('materi', false);
        return;
      }
      if (data.error) {
        console.error('Materi data.error:', data.error, data.errorCode);
        updateQuotaFromResponse(data);
        showNotificationMessage(`Gagal membuat Materi: ${data.error}`, 'error');
        updateLoader('materi', false);
        return;
      }

      // Validate response structure
      if (!data.data || !data.data.judul_materi) {
        console.error('Invalid materi structure:', data);
        showNotificationMessage('Struktur Materi tidak valid. Coba generate ulang.', 'error');
        updateLoader('materi', false);
        return;
      }

      setMateriData(data.data);
      updateQuotaFromResponse(data);
      showNotificationMessage('Materi siap!');
    } catch (err) {
      console.error('Materi error:', err);
      showNotificationMessage('Gagal membuat Materi. Coba lagi.', 'error');
    } finally {
      updateLoader('materi', false);
    }
  };

  const generateTindakLanjut = async () => {
    if (!generatedSteps) return;
    if (!isModulComplete) {
      showNotificationMessage(`Selesaikan semua ${formData.pertemuan.length} pertemuan dulu sebelum generate tab ini.`, "error");
      return;
    }
    updateLoader('tindakLanjut', true);
    setActiveTab('tindakLanjut');

    try {
      const { data, error } = await invokeGenerateWithRetry(
        { type: 'tindakLanjut', data: formData },
        { onRetry: (n, r) => console.warn(`[Refleksi] retry #${n}: ${r}`) }
      ) as any;

      if (error) throw error;
      if (data.needApiKey) {
        showNotificationMessage('API Key diperlukan. Silakan tambahkan di Pengaturan.', 'error');
        updateLoader('tindakLanjut', false);
        return;
      }
      if (data.error) {
        updateQuotaFromResponse(data);
        throw new Error(data.error);
      }

      setTindakLanjutData(data.data);
      updateQuotaFromResponse(data);
      showNotificationMessage('Refleksi siap!');
    } catch (err) {
      console.error('TindakLanjut error:', err);
      showNotificationMessage('Gagal membuat Refleksi', 'error');
    } finally {
      updateLoader('tindakLanjut', false);
    }
  };

  const generateBankSoal = async () => {
    // --- Flow V2: generate soal khusus pertemuan tertentu ---
    if (isV2Mode && v2SoalTargetId) {
      setShowSoalModal(false);
      // Aktifkan pilihan soal untuk pertemuan target agar masuk ke antrean
      pertemuanV2.togglePilihan(v2SoalTargetId, 'soal', true);
      // Generate hanya soal untuk pertemuan ini
      await pertemuanV2.regenerateDokumen(v2SoalTargetId, 'soal');
      setV2SoalTargetId(null);
      return;
    }

    // --- Flow V1 legacy ---
    if (!isModulComplete) {
      showNotificationMessage(`Selesaikan semua ${formData.pertemuan.length} pertemuan dulu sebelum generate tab ini.`, 'error');
      setShowSoalModal(false);
      return;
    }
    updateLoader('bankSoal', true);
    setShowSoalModal(false);
    setActiveTab('soal');

    try {
      const { data, error } = await invokeGenerateWithRetry(
        { type: 'bankSoal', data: { ...formData, config: soalConfig } },
        {
          onRetry: (n, r) => console.warn(`[BankSoal] retry #${n}: ${r}`),
          validate: (d) =>
            !d?.data?.daftar_soal || !Array.isArray(d.data.daftar_soal)
              ? 'daftar_soal missing or invalid'
              : null,
        }
      ) as any;

      if (error) throw error;
      if (data.needApiKey) {
        showNotificationMessage('API Key diperlukan. Silakan tambahkan di Pengaturan.', 'error');
        updateLoader('bankSoal', false);
        return;
      }
      if (data.error) {
        updateQuotaFromResponse(data);
        throw new Error(data.error);
      }

      setBankSoalData(normalizeBankSoalImages(data.data, soalConfig));
      updateQuotaFromResponse(data);
      showNotificationMessage('Bank Soal siap!');
    } catch (err) {
      console.error('BankSoal error:', err);
      showNotificationMessage('Gagal membuat Bank Soal', 'error');
    } finally {
      updateLoader('bankSoal', false);
    }
  };


  // Section update handler for inline editing
  const handleUpdateSection = useCallback((tab: string, sectionId: string, newContent: unknown) => {
    const setNestedValue = (obj: any, path: string, value: unknown): any => {
      const keys = path.split('.');
      if (keys.length === 1) {
        return { ...obj, [keys[0]]: value };
      }
      const [first, ...rest] = keys;
      return { ...obj, [first]: setNestedValue(obj[first] || {}, rest.join('.'), value) };
    };

    switch (tab) {
      case 'asesmen':
        if (asesmenData) setAsesmenData(setNestedValue(asesmenData, sectionId, newContent));
        break;
      case 'lkpd':
        if (lkpdData) setLkpdData(setNestedValue(lkpdData, sectionId, newContent));
        break;
      case 'materi':
        if (materiData) setMateriData(setNestedValue(materiData, sectionId, newContent));
        break;
      case 'tindakLanjut':
        if (tindakLanjutData) setTindakLanjutData(setNestedValue(tindakLanjutData, sectionId, newContent));
        break;
      case 'soal':
        if (bankSoalData) setBankSoalData(setNestedValue(bankSoalData, sectionId, newContent));
        break;
      case 'modul':
        if (generatedSteps) setGeneratedSteps(setNestedValue(generatedSteps, sectionId, newContent));
        break;
      default:
        break;
    }
    showNotificationMessage('Bagian berhasil diperbarui!');
  }, [asesmenData, lkpdData, materiData, tindakLanjutData, bankSoalData, generatedSteps, showNotificationMessage]);


  const handleGenerateProta = async () => {
    if (!formData.capaianPembelajaran || !formData.mataPelajaran) {
      showNotificationMessage('Isi Mata Pelajaran dan pilih CP terlebih dahulu', 'error');
      return;
    }

    setIsGeneratingProta(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-prota', {
        body: {
          cp: formData.capaianPembelajaran,
          mata_pelajaran: formData.mataPelajaran,
          fase: formData.fase,
          kelas: formData.kelas,
          jp_per_minggu: kalenderPendidikan.jpPerMinggu,
          minggu_efektif_sem1: kalenderPendidikan.mingguEfektifSem1,
          minggu_efektif_sem2: kalenderPendidikan.mingguEfektifSem2,
        },
      });

      if (error) throw error;
      if (data?.error) {
        showNotificationMessage(data.error, 'error');
        if (data) updateQuotaFromResponse(data);
        return;
      }

      if (data?.data) {
        setProtaData(data.data);
        if (data) updateQuotaFromResponse(data);
        showNotificationMessage('Program Tahunan berhasil di-generate!');
      } else {
        showNotificationMessage('Format response Prota tidak valid', 'error');
      }
    } catch (err) {
      console.error('Prota generation error:', err);
      showNotificationMessage('Gagal generate Program Tahunan', 'error');
    } finally {
      setIsGeneratingProta(false);
    }
  };

  // Export Prota to Word
  const handleExportProtaWord = async () => {
    if (!protaData) return;
    setIsExportingProta(true);

    try {
      // Build HTML table for Word
      const sem1Items = protaData.prota.filter(i => i.semester === 1);
      const sem2Items = protaData.prota.filter(i => i.semester === 2);

      const hasPancaCinta = protaData.prota.some(item => item.panca_cinta);

      const buildRows = (items: typeof protaData.prota) => items.map(item => `
        <tr>
          <td style="text-align:center;font-weight:bold">${item.no}</td>
          <td>${item.tujuan_pembelajaran}</td>
          <td>${item.materi_pokok}</td>
          <td style="text-align:center;font-weight:bold">${item.alokasi_jp}</td>
          <td>${(item.dimensi_profil_lulusan || item.profil_pelajar_pancasila)?.join(', ') || '-'}</td>
          ${hasPancaCinta ? `<td>${item.panca_cinta || '-'}</td>` : ''}
          <td>${item.keterangan || '-'}</td>
        </tr>
      `).join('');

      const totalRow = (sem: number, total: number) => `
        <tr style="background:#f0f0f0;font-weight:bold">
          <td colspan="3" style="text-align:right">Total JP Semester ${sem}</td>
          <td style="text-align:center">${total}</td>
          <td colspan="2"></td>
        </tr>
      `;

      const headerStyle = 'background:#0D7C8F;color:white;font-weight:bold;padding:8px;border:1px solid black';

      const tableHeaders = `
              <th style="${headerStyle};width:5%">No</th>
              <th style="${headerStyle}">Tujuan Pembelajaran</th>
              <th style="${headerStyle}">Materi Pokok</th>
              <th style="${headerStyle};width:8%">JP</th>
              <th style="${headerStyle}">Dimensi Profil Lulusan</th>
              ${hasPancaCinta ? `<th style="${headerStyle}">Panca Cinta</th>` : ''}
              <th style="${headerStyle}">Keterangan</th>`;

      const contentHTML = `
        <h1 style="text-align:center;font-size:16pt">PROGRAM TAHUNAN</h1>
        <p style="text-align:center">${formData.sekolah || ''}</p>
        <p style="text-align:center">${formData.mataPelajaran} | ${formData.kelas || ''} | Fase ${formData.fase || ''}</p>
        <br/>
        ${sem1Items.length > 0 ? `
          <h2>SEMESTER 1</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr>${tableHeaders}</tr>
            ${buildRows(sem1Items)}
            ${totalRow(1, protaData.total_jp_sem1)}
          </table>
        ` : ''}
        <br/>
        ${sem2Items.length > 0 ? `
          <h2>SEMESTER 2</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr>${tableHeaders}</tr>
            ${buildRows(sem2Items)}
            ${totalRow(2, protaData.total_jp_sem2)}
          </table>
        ` : ''}
        <br/><br/>
        <table style="width:100%;border:none">
          <tr>
            <td style="border:none;width:50%">
              <p><b>Penyusun,</b></p>
              <br/><br/><br/>
              <p><b>${formData.namaPenyusun || '_______________'}</b></p>
              ${formData.nipPenyusun ? `<p>NIP. ${formData.nipPenyusun}</p>` : ''}
            </td>
            <td style="border:none;width:50%;text-align:right">
              <p><b>Mengetahui,</b></p>
              <p>Kepala Sekolah</p>
              <br/><br/><br/>
              <p><b>${formData.kepalaSekolah || '_______________'}</b></p>
              ${formData.nipKepalaSekolah ? `<p>NIP. ${formData.nipKepalaSekolah}</p>` : ''}
            </td>
          </tr>
        </table>
      `;

      const preHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Program Tahunan</title><style>
body{font-family:'Arial',sans-serif;font-size:11pt;line-height:1.4}
table{width:100%;border-collapse:collapse;margin-bottom:16px}
td,th{border:1px solid black;padding:8px;vertical-align:top}
h1{font-size:16pt;font-weight:bold;margin:12px 0}
h2{font-size:14pt;font-weight:bold;margin:10px 0}
</style></head><body>`;

      const blob = new Blob(['\ufeff', preHtml + contentHTML + '</body></html>'], {
        type: 'application/msword',
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Prota_${formData.mataPelajaran}_${formData.kelas || ''}.doc`;
      link.click();
      showNotificationMessage('Prota berhasil di-download!');
    } catch (err) {
      console.error('Prota export error:', err);
      showNotificationMessage('Gagal export Prota', 'error');
    } finally {
      setIsExportingProta(false);
    }
  };

  // Generate KKTP
  const handleGenerateKKTP = async (tpList: string[]) => {
    if (tpList.length === 0) {
      showNotificationMessage('Daftar Tujuan Pembelajaran tidak boleh kosong', 'error');
      return;
    }

    setIsGeneratingKKTP(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-kktp', {
        body: {
          tujuan_pembelajaran: tpList,
          mata_pelajaran: formData.mataPelajaran,
          fase: formData.fase,
          kelas: formData.kelas,
        },
      });

      if (error) throw error;
      if (data?.error) {
        showNotificationMessage(data.error, 'error');
        if (data) updateQuotaFromResponse(data);
        return;
      }

      if (data?.data) {
        setKktpData(data.data);
        if (data) updateQuotaFromResponse(data);
        showNotificationMessage('KKTP berhasil di-generate!');
      } else {
        showNotificationMessage('Format response KKTP tidak valid', 'error');
      }
    } catch (err) {
      console.error('KKTP generation error:', err);
      showNotificationMessage('Gagal generate KKTP', 'error');
    } finally {
      setIsGeneratingKKTP(false);
    }
  };

  // Export KKTP to Word (landscape)
  const handleExportKKTPWord = async () => {
    if (!kktpData) return;
    setIsExportingKKTP(true);

    try {
      const buildKKTPRows = (item: KKTPData['kktp'][0]) => item.indikator.map(ind => `
        <tr>
          <td style="font-weight:bold;background:#f9f9f9">${ind.no_indikator}. ${ind.indikator}</td>
          <td style="background:#FFF5F5">${ind.belum_berkembang}</td>
          <td style="background:#FFFFF0">${ind.mulai_berkembang}</td>
          <td style="background:#F0FFF0">${ind.berkembang_sesuai_harapan}</td>
          <td style="background:#E8F5E9">${ind.sangat_berkembang}</td>
        </tr>
      `).join('');

      const headerStyle = (bg: string, color: string = 'black') =>
        `background:${bg};color:${color};font-weight:bold;padding:8px;border:1px solid black;text-align:center`;

      const tablesHTML = kktpData.kktp.map(item => `
        <h3 style="margin-top:20px">TP ${item.no}: ${item.tujuan_pembelajaran}</h3>
        <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
          <tr>
            <th style="${headerStyle('#374151', 'white')};width:25%">Indikator</th>
            <th style="${headerStyle('#FFEBEE')};width:18.75%">Belum Berkembang</th>
            <th style="${headerStyle('#FFFDE7')};width:18.75%">Mulai Berkembang</th>
            <th style="${headerStyle('#E8F5E9')};width:18.75%">Berkembang Sesuai Harapan</th>
            <th style="${headerStyle('#1B5E20', 'white')};width:18.75%">Sangat Berkembang</th>
          </tr>
          ${buildKKTPRows(item)}
        </table>
      `).join('');

      const contentHTML = `
        <h1 style="text-align:center;font-size:16pt">KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)</h1>
        <p style="text-align:center">${formData.sekolah || ''}</p>
        <p style="text-align:center">${formData.mataPelajaran} | ${formData.kelas || ''} | Fase ${formData.fase || ''}</p>
        <br/>
        ${tablesHTML}
        <br/><br/>
        <table style="width:100%;border:none">
          <tr>
            <td style="border:none;width:50%">
              <p><b>Penyusun,</b></p><br/><br/><br/>
              <p><b>${formData.namaPenyusun || '_______________'}</b></p>
              ${formData.nipPenyusun ? `<p>NIP. ${formData.nipPenyusun}</p>` : ''}
            </td>
            <td style="border:none;width:50%;text-align:right">
              <p><b>Mengetahui,</b></p><p>Kepala Sekolah</p><br/><br/><br/>
              <p><b>${formData.kepalaSekolah || '_______________'}</b></p>
              ${formData.nipKepalaSekolah ? `<p>NIP. ${formData.nipKepalaSekolah}</p>` : ''}
            </td>
          </tr>
        </table>
      `;

      const preHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>KKTP</title>
<xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml>
<style>
@page{size:landscape;margin:1.5cm}
body{font-family:'Arial',sans-serif;font-size:10pt;line-height:1.3}
table{width:100%;border-collapse:collapse;margin-bottom:16px}
td,th{border:1px solid black;padding:6px;vertical-align:top;font-size:9pt}
h1{font-size:14pt;font-weight:bold;margin:12px 0}
h3{font-size:11pt;font-weight:bold;margin:10px 0}
</style></head><body>`;

      const blob = new Blob(['\ufeff', preHtml + contentHTML + '</body></html>'], {
        type: 'application/msword',
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `KKTP_${formData.mataPelajaran}_${formData.kelas || ''}.doc`;
      link.click();
      showNotificationMessage('KKTP berhasil di-download!');
    } catch (err) {
      console.error('KKTP export error:', err);
      showNotificationMessage('Gagal export KKTP', 'error');
    } finally {
      setIsExportingKKTP(false);
    }
  };

  // Prosem Events change handler (persist to localStorage)
  const handleProsemEventsChange = (events: ProsemEvent[]) => {
    setProsemEvents(events);
    localStorage.setItem('prosem_events', JSON.stringify(events));
  };

  // Generate Prosem (deterministic, frontend-only)
  const handleGenerateProsem = () => {
    if (!protaData) return;
    setIsGeneratingProsem(true);

    try {
      const generateForSemester = (sem: 1 | 2): ProsemData => {
        const startDateStr = sem === 1 ? kalenderPendidikan.tanggalMulaiSem1 : kalenderPendidikan.tanggalMulaiSem2;
        const mingguEfektif = sem === 1 ? kalenderPendidikan.mingguEfektifSem1 : kalenderPendidikan.mingguEfektifSem2;
        const jpPerMinggu = kalenderPendidikan.jpPerMinggu;

        // Calculate months and weeks
        const startDate = new Date(startDateStr);
        const months: ProsemData['months'] = [];
        const allWeekKeys: string[] = [];

        let currentDate = new Date(startDate);
        let totalWeeks = 0;

        // Always generate exactly 6 months per semester
        for (let i = 0; i < 6; i++) {
          const bulan = currentDate.getMonth() + 1;
          const tahun = currentDate.getFullYear();

          // Calculate weeks in this month (roughly 4-5)
          const daysInMonth = new Date(tahun, bulan, 0).getDate();
          const mingguCount = Math.ceil(daysInMonth / 7);

          months.push({ bulan, tahun, mingguCount });
          for (let w = 1; w <= mingguCount; w++) {
            allWeekKeys.push(`${tahun}-${String(bulan).padStart(2, '0')}-W${w}`);
            totalWeeks++;
          }

          // Move to next month
          currentDate = new Date(tahun, bulan, 1);
        }

        // Mark event weeks as blocked
        const semEvents = prosemEvents.filter(ev => ev.semester === sem);
        const blockedWeeks = new Set<string>();
        semEvents.forEach(ev => {
          const key = `${months[0]?.tahun || startDate.getFullYear()}-${String(ev.bulan).padStart(2, '0')}-W${ev.mingguKe}`;
          // Also check next year for sem2
          const keyAlt = `${(months[0]?.tahun || startDate.getFullYear()) + 1}-${String(ev.bulan).padStart(2, '0')}-W${ev.mingguKe}`;
          if (allWeekKeys.includes(key)) blockedWeeks.add(key);
          if (allWeekKeys.includes(keyAlt)) blockedWeeks.add(keyAlt);
        });

        // Available weeks (not blocked)
        const availableWeeks = allWeekKeys.filter(wk => !blockedWeeks.has(wk)).slice(0, mingguEfektif);

        // Distribute TP to weeks
        const semTP = protaData.prota.filter(tp => tp.semester === sem);
        let weekIndex = 0;

        const rows: ProsemData['rows'] = semTP.map(tp => {
          const weeksNeeded = Math.ceil(tp.alokasi_jp / jpPerMinggu);
          const weeks: Record<string, { hasActivity: boolean; jp?: number }> = {};

          for (let w = 0; w < weeksNeeded && weekIndex < availableWeeks.length; w++) {
            const remainingJP = tp.alokasi_jp - (w * jpPerMinggu);
            weeks[availableWeeks[weekIndex]] = {
              hasActivity: true,
              jp: Math.min(jpPerMinggu, remainingJP),
            };
            weekIndex++;
          }

          return {
            no: tp.no,
            tujuan_pembelajaran: tp.tujuan_pembelajaran,
            materi_pokok: tp.materi_pokok,
            alokasi_jp: tp.alokasi_jp,
            weeks,
          };
        });

        return {
          semester: sem,
          rows,
          events: semEvents,
          months,
        };
      };

      setProsemSem1(generateForSemester(1));
      setProsemSem2(generateForSemester(2));
      showNotificationMessage('Program Semester berhasil di-generate!');
    } catch (err) {
      console.error('Prosem generation error:', err);
      showNotificationMessage('Gagal generate Program Semester', 'error');
    } finally {
      setIsGeneratingProsem(false);
    }
  };

  // Export Prosem to Word (landscape)
  const handleExportProsemWord = async (semester: 1 | 2) => {
    const data = semester === 1 ? prosemSem1 : prosemSem2;
    if (!data) return;
    setIsExportingProsem(true);

    try {
      const allWeekKeys: string[] = [];
      data.months.forEach(m => {
        for (let w = 1; w <= m.mingguCount; w++) {
          allWeekKeys.push(`${m.tahun}-${String(m.bulan).padStart(2, '0')}-W${w}`);
        }
      });

      const headerStyle = 'background:#0D7C8F;color:white;font-weight:bold;padding:4px;border:1px solid black;text-align:center;font-size:8pt';
      const cellStyle = 'border:1px solid black;padding:3px;font-size:8pt;vertical-align:top';

      // Month header
      const monthHeaders = data.months.map(m =>
        `<th colspan="${m.mingguCount}" style="${headerStyle}">${BULAN_NAMES[m.bulan]?.substring(0, 3)} ${m.tahun}</th>`
      ).join('');

      // Week sub-headers
      const weekHeaders = data.months.map(m =>
        Array.from({ length: m.mingguCount }, (_, w) =>
          `<th style="${headerStyle};font-size:7pt">${w + 1}</th>`
        ).join('')
      ).join('');

      // TP rows
      const tpRows = data.rows.map(row => {
        const weekCells = allWeekKeys.map(wk => {
          const cell = row.weeks[wk];
          const bg = cell?.hasActivity ? '#E0F4F7' : 'transparent';
          return `<td style="${cellStyle};text-align:center;background:${bg}">${cell?.hasActivity ? '✓' : ''}</td>`;
        }).join('');

        return `<tr>
          <td style="${cellStyle};text-align:center;font-weight:bold">${row.no}</td>
          <td style="${cellStyle}">${row.tujuan_pembelajaran}</td>
          <td style="${cellStyle}">${row.materi_pokok}</td>
          <td style="${cellStyle};text-align:center;font-weight:bold">${row.alokasi_jp}</td>
          ${weekCells}
        </tr>`;
      }).join('');

      // Event rows
      const eventRows = data.events.map(ev => {
        const bg = ev.tipe === 'PTS' || ev.tipe === 'PAS' ? '#FFF9C4' : '#EEEEEE';
        const weekCells = allWeekKeys.map(wk => {
          const weekBulan = parseInt(wk.split('-')[1]);
          const weekNum = parseInt(wk.split('W')[1]);
          const isThisWeek = weekBulan === ev.bulan && weekNum === ev.mingguKe;
          return `<td style="${cellStyle};text-align:center;background:${isThisWeek ? bg : 'transparent'}">${isThisWeek ? '■' : ''}</td>`;
        }).join('');

        return `<tr>
          <td colspan="4" style="${cellStyle};font-weight:bold;background:${bg}">${ev.nama} (${ev.tipe})</td>
          ${weekCells}
        </tr>`;
      }).join('');

      const contentHTML = `
        <h1 style="text-align:center;font-size:14pt">PROGRAM SEMESTER ${semester}</h1>
        <p style="text-align:center;font-size:10pt">${formData.sekolah || ''}</p>
        <p style="text-align:center;font-size:10pt">${formData.mataPelajaran} | ${formData.kelas || ''} | Fase ${formData.fase || ''}</p>
        <br/>
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <th rowspan="2" style="${headerStyle};width:3%">No</th>
            <th rowspan="2" style="${headerStyle};min-width:120px">Tujuan Pembelajaran</th>
            <th rowspan="2" style="${headerStyle};min-width:80px">Materi</th>
            <th rowspan="2" style="${headerStyle};width:4%">JP</th>
            ${monthHeaders}
          </tr>
          <tr>${weekHeaders}</tr>
          ${tpRows}
          ${eventRows}
        </table>
        <br/><br/>
        <table style="width:100%;border:none">
          <tr>
            <td style="border:none;width:50%">
              <p><b>Penyusun,</b></p><br/><br/><br/>
              <p><b>${formData.namaPenyusun || '_______________'}</b></p>
              ${formData.nipPenyusun ? `<p>NIP. ${formData.nipPenyusun}</p>` : ''}
            </td>
            <td style="border:none;width:50%;text-align:right">
              <p><b>Mengetahui,</b></p><p>Kepala Sekolah</p><br/><br/><br/>
              <p><b>${formData.kepalaSekolah || '_______________'}</b></p>
              ${formData.nipKepalaSekolah ? `<p>NIP. ${formData.nipKepalaSekolah}</p>` : ''}
            </td>
          </tr>
        </table>
      `;

      const preHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Program Semester</title>
<xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml>
<style>
@page{size:landscape;margin:1.5cm}
body{font-family:'Arial',sans-serif;font-size:8pt;line-height:1.2}
table{width:100%;border-collapse:collapse;margin-bottom:12px}
td,th{border:1px solid black;padding:3px;vertical-align:top;font-size:8pt}
h1{font-size:14pt;font-weight:bold;margin:8px 0}
</style></head><body>`;

      const blob = new Blob(['\ufeff', preHtml + contentHTML + '</body></html>'], {
        type: 'application/msword',
      });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Prosem_Sem${semester}_${formData.mataPelajaran}_${formData.kelas || ''}.doc`;
      link.click();
      showNotificationMessage(`Prosem Semester ${semester} berhasil di-download!`);
    } catch (err) {
      console.error('Prosem export error:', err);
      showNotificationMessage('Gagal export Prosem', 'error');
    } finally {
      setIsExportingProsem(false);
    }
  };

  // Helper function to convert external images to base64 for Word embedding
  const convertImagesToBase64 = async (element: HTMLElement): Promise<void> => {
    const images = element.querySelectorAll('img');
    const promises = Array.from(images).map(async (img) => {
      if (img.src.startsWith('http')) {
        try {
          const response = await fetch(img.src);
          const blob = await response.blob();
          return new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              img.src = reader.result as string;
              resolve();
            };
            reader.onerror = () => {
              console.warn('Failed to read image blob:', img.src);
              img.style.display = 'none';
              resolve();
            };
            reader.readAsDataURL(blob);
          });
        } catch (e) {
          console.warn('Failed to convert image:', img.src, e);
          // Remove image if failed to convert
          img.style.display = 'none';
        }
      }
      return Promise.resolve();
    });
    
    await Promise.all(promises);
  };

  // Export functions - Updated CSS for Word compatibility
  const exportToWord = async () => {
    if (!contentRef.current) return;

    showNotificationMessage('Memproses dokumen untuk export...');

    const clone = contentRef.current.cloneNode(true) as HTMLElement;
    const sections = clone.querySelectorAll('[data-section]');
    sections.forEach((el) => ((el as HTMLElement).style.display = 'block'));

    // Strip interactive elements (Edit buttons, etc.) so they don't leak into Word
    clone.querySelectorAll('button, [data-no-export], .print\\:hidden').forEach((el) => el.remove());

    // Convert images to base64 for embedding in Word
    await convertImagesToBase64(clone);

    // Swap math markers with OMML equations so Word treats them as editable
    // equations (native Equation Editor objects) instead of Unicode text.
    preprocessElementForOmml(clone);
    const contentHTML = clone.innerHTML;
    // CSS khusus untuk Word export - table-based layout, simplified rules
    const preHtml = `<html ${WORD_HTML_NAMESPACES}><head><meta charset='utf-8'><title>Export Document</title><style>

body{font-family:'Arial',sans-serif;font-size:11pt;line-height:1.4}
table{width:100%;border-collapse:collapse;margin-bottom:16px}
td,th{border:1px solid black;padding:8px;vertical-align:top}
h1{font-size:16pt;font-weight:bold;margin:12px 0}
h2{font-size:14pt;font-weight:bold;margin:10px 0}
h3{font-size:12pt;font-weight:bold;margin:8px 0}
h4{font-size:11pt;font-weight:bold;margin:6px 0}
p{margin:6px 0}
ul,ol{margin:8px 0;padding-left:24px}
li{margin:4px 0}
sup{vertical-align:super;font-size:smaller}
sub{vertical-align:sub;font-size:smaller}
b,strong{font-weight:bold}
i,em{font-style:italic}
.page-break-before{page-break-before:always}
img{max-width:100%}
</style></head><body>`;
    const blob = new Blob(['\ufeff', preHtml + contentHTML + '</body></html>'], {
      type: 'application/msword',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Modul_Lengkap_${formData.mataPelajaran}.doc`;
    link.click();
    showNotificationMessage('Word berhasil di-download!');
  };

  const exportCurrentTab = async () => {
    if (!contentRef.current) return;

    showNotificationMessage('Memproses dokumen untuk export...');

    const clone = contentRef.current.cloneNode(true) as HTMLElement;
    const container = document.createElement('div');
    const activeSection = clone.querySelector(`[data-section="${activeTab}"]`);

    if (activeSection) {
      (activeSection as HTMLElement).style.display = 'block';
      container.appendChild(activeSection);
    } else if (activeTab === 'all') {
      const sections = clone.querySelectorAll('[data-section]');
      sections.forEach((el) => {
        (el as HTMLElement).style.display = 'block';
        container.appendChild(el.cloneNode(true));
      });
    }

    // Strip interactive elements (Edit buttons, etc.) so they don't leak into Word
    container.querySelectorAll('button, [data-no-export], .print\\:hidden').forEach((el) => el.remove());

    // Convert images to base64 for embedding in Word
    await convertImagesToBase64(container);

    // Swap math markers with OMML equations so Word treats them as editable
    // equations (native Equation Editor objects) instead of Unicode text.
    preprocessElementForOmml(container);
    const contentHTML = container.innerHTML;
    // CSS khusus untuk Word export - table-based layout, simplified rules
    const preHtml = `<html ${WORD_HTML_NAMESPACES}><head><meta charset='utf-8'><title>Export ${activeTab}</title><style>

body{font-family:'Arial',sans-serif;font-size:11pt;line-height:1.4}
table{width:100%;border-collapse:collapse;margin-bottom:16px}
td,th{border:1px solid black;padding:8px;vertical-align:top}
h1{font-size:16pt;font-weight:bold;margin:12px 0}
h2{font-size:14pt;font-weight:bold;margin:10px 0}
h3{font-size:12pt;font-weight:bold;margin:8px 0}
h4{font-size:11pt;font-weight:bold;margin:6px 0}
p{margin:6px 0}
ul,ol{margin:8px 0;padding-left:24px}
li{margin:4px 0}
sup{vertical-align:super;font-size:smaller}
sub{vertical-align:sub;font-size:smaller}
b,strong{font-weight:bold}
i,em{font-style:italic}
.page-break-before{page-break-before:always}
img{max-width:100%}
</style></head><body>`;
    const blob = new Blob(['\ufeff', preHtml + contentHTML + '</body></html>'], {
      type: 'application/msword',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${activeTab.toUpperCase()}_${formData.mataPelajaran}.doc`;
    link.click();
    showNotificationMessage('Word berhasil di-download!');
  };

  // Export Bank Soal ke DOCX asli (OOXML) dengan OMML equations
  const exportSoalDocx = useCallback(async () => {
    if (!bankSoalData) {
      showNotificationMessage('Belum ada Bank Soal untuk di-export');
      return;
    }
    setIsExportingSoalDocx(true);
    try {
      const { exportSoalToDocx } = await import('@/lib/soal-docx-export');
      const result = await exportSoalToDocx(bankSoalData, formData, {
        letterheadUrl: letterheadUrl ?? null,
        letterheadEnabled: !!isLetterheadEnabled,
      });
      console.info(
        `[soal-docx] equations=${result.equationCount} markers=${result.markerCount}`,
      );
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showNotificationMessage(
        `DOCX berhasil (${result.equationCount} equation)`,
      );
    } catch (err) {
      console.error('[soal-docx] export failed:', err);
      showNotificationMessage('Gagal export DOCX Soal');
    } finally {
      setIsExportingSoalDocx(false);
    }
  }, [bankSoalData, formData, letterheadUrl, isLetterheadEnabled, showNotificationMessage]);

  // Export to PDF with smart page breaks
  const exportToPDF = async () => {
    if (!contentRef.current) return;

    setIsExportingPDF(true);
    showNotificationMessage('Generating PDF, mohon tunggu...');

    try {
      // Clone and prepare content
      const clone = contentRef.current.cloneNode(true) as HTMLElement;
      const sections = clone.querySelectorAll('[data-section]');
      sections.forEach((el) => ((el as HTMLElement).style.display = 'block'));

      // Remove any Tailwind classes that might cause issues
      clone.classList.remove('shadow-2xl', 'border', 'border-muted');
      clone.style.boxShadow = 'none';
      clone.style.border = 'none';
      clone.style.backgroundColor = 'white';

      // Inject CSS for proper page breaks
      const style = document.createElement('style');
      style.textContent = `
        table { page-break-inside: auto !important; }
        tr { page-break-inside: avoid !important; page-break-after: auto !important; }
        td { page-break-inside: avoid !important; }
        thead { display: table-header-group !important; }
        tfoot { display: table-footer-group !important; }
        .page-break-before { page-break-before: always !important; }
        h1, h2, h3, h4 { page-break-after: avoid !important; }
      `;
      clone.prepend(style);

      // Create temp container
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.width = '210mm';
      tempContainer.appendChild(clone);
      document.body.appendChild(tempContainer);

      // PDF options - simplified mode for better control
      const options = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `Modul_${formData.mataPelajaran}_${formData.kelas}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true,
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait' as const,
        },
        pagebreak: {
          mode: ['css', 'legacy'] as ('css' | 'legacy')[],
          before: '.page-break-before',
          avoid: ['tr', 'h1', 'h2', 'h3', 'h4'],
        },
      };

      await html2pdf().set(options).from(clone).save();

      // Cleanup
      document.body.removeChild(tempContainer);
      showNotificationMessage('PDF berhasil di-download!');
    } catch (error) {
      console.error('PDF export error:', error);
      showNotificationMessage('Gagal membuat PDF', 'error');
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Redirect manual URL navigation for Workspace if user is not PRO/Admin
  useEffect(() => {
    if (appMode === 'workspace' && quotaInfo) {
      if (!isAdmin && quotaInfo.isTrial) {
        navigate('/app');
        setShowWorkspaceUpsell(true);
      }
    }
  }, [appMode, quotaInfo, isAdmin, navigate]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Notification */}
      <NotificationToast notification={notification} />

      {/* Migration Banner */}
      {showMigrationBanner && (
        <div className="bg-info/10 border-b-2 border-info/30 px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-info">
            <strong>Profil lokal ditemukan!</strong> Ingin memindahkan ke cloud untuk sinkronisasi antar perangkat?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleMigrateProfiles}
              disabled={migrateProfilesMutation.isPending}
              className="px-3 py-1 bg-info text-info-foreground text-sm font-medium rounded-lg hover:bg-info/90"
            >
              {migrateProfilesMutation.isPending ? 'Memproses...' : 'Migrasikan'}
            </button>
            <button
              onClick={() => setShowMigrationBanner(false)}
              className="px-3 py-1 text-sm text-info hover:underline"
            >
              Nanti saja
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <SaveProfileModal
        isOpen={showSaveModal}
        onClose={handleCloseModal}
        tempProfileName={tempProfileName}
        setTempProfileName={setTempProfileName}
        onSave={executeSaveProfile}
        mode={isCreatingNew ? 'create' : 'update'}
        identifikasiData={tempIdentifikasiData}
        onIdentifikasiChange={handleTempIdentifikasiChange}
      />
      <SoalConfigModal
        isOpen={showSoalModal}
        onClose={() => setShowSoalModal(false)}
        soalConfig={soalConfig}
        setSoalConfig={setSoalConfig}
        onGenerate={generateBankSoal}
      />
      <SaveHistoryModal
        isOpen={showSaveHistoryModal}
        onClose={() => setShowSaveHistoryModal(false)}
        historyName={historyName}
        setHistoryName={setHistoryName}
        onSave={handleSaveHistory}
        isSaving={saveHistoryMutation.isPending}
        contentStatus={{
          modul: generatedSteps,
          lkpd: lkpdData,
          asesmen: asesmenData,
          materi: materiData,
          bankSoal: bankSoalData,
          tindakLanjut: tindakLanjutData,
          prota: protaData,
          kktp: kktpData,
          prosem: { sem1: prosemSem1, sem2: prosemSem2 },
        }}
        v2Summary={v2Summary}
        selectedHistoryId={selectedHistoryId}
        selectedHistoryName={historyItems.find((h) => h.id === selectedHistoryId)?.name}
        onUpdate={handleUpdateHistory}
        isUpdating={updateHistoryMutation.isPending}
      />
      
      <WorkspaceUpsellDialog
        open={showWorkspaceUpsell}
        onOpenChange={setShowWorkspaceUpsell}
      />

      {/* Header with user actions */}
      <header className="flex-shrink-0 bg-card border-b-2 border-foreground px-4 py-3 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl border-2 border-foreground flex items-center justify-center shadow-brutal-sm">
            <span className="text-primary-foreground font-extrabold text-lg">📚</span>
          </div>
          <div>
            <h1 className="font-extrabold text-lg">ModulAjar.Online</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">Kurikulum Merdeka - Pembelajaran Mendalam & KBC</p>
          </div>
        </div>

        {/* App Mode Switcher */}
        <div className="flex bg-muted p-1 rounded-lg border-2 border-foreground/10 mx-auto md:mx-0 order-last md:order-none w-full md:w-auto justify-center">
          <button
            onClick={() => {
              navigate('/app');
              if (activeTab === 'dashboard' || activeTab === 'perencanaan') {
                setActiveTab('modul');
              }
            }}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all flex items-center gap-2 ${
              appMode === 'quick' ? 'bg-background shadow-sm border-2 border-foreground text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>⚡</span> Mode Cepat
          </button>
          <button
            onClick={() => {
              // Jika user adalah admin ATAU bukan trial (PRO), izinkan masuk
              if (isAdmin || (quotaInfo && !quotaInfo.isTrial)) {
                navigate('/app/workspace');
              } else {
                // Jika masih trial & bukan admin, tampilkan upsell
                setShowWorkspaceUpsell(true);
              }
            }}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all flex items-center gap-2 ${
              appMode === 'workspace' ? 'bg-background shadow-sm border-2 border-foreground text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>📁</span> Workspace
            {(!quotaInfo || quotaInfo.isTrial) && !isAdmin && <Lock className="w-3 h-3 ml-1 opacity-50" />}
          </button>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          {appMode === 'workspace' && <WorkspaceSelector />}
          {appMode === 'quick' && (
            <HeaderHistoryDropdown
              historyItems={historyItems}
              selectedHistoryId={selectedHistoryId}
              isLoading={isHistoryLoading}
              isDeleting={deleteHistoryMutation.isPending}
              hasContent={hasAnyContent}
              onSelectHistory={setSelectedHistoryId}
              onLoadHistory={handleLoadHistory}
              onSaveClick={openSaveHistoryModal}
              onDeleteClick={handleDeleteHistory}
            />
          )}

          {(hasAnyContent || hasV2Resettable) && appMode === 'quick' && (
            <button
              onClick={resetAll}
              title="Reset"
              aria-label="Reset"
              className="p-2 md:px-3 md:py-2 text-sm font-medium bg-secondary border-2 border-foreground/30 rounded-lg hover:bg-secondary/80 transition-colors"
            >
              <RotateCcw className="w-4 h-4 md:hidden" />
              <span className="hidden md:inline">Reset</span>
            </button>
          )}

          {/* Fullscreen toggle — mobile only, visible from header so it never overlaps the toolbar */}
          {canUseFullscreenPreview({
            hasLegacyModul: !!generatedSteps,
            v2Active: isV2Mode,
            v2Result: pertemuanV2.result,
            activeTab,
          }) && (
            <button
              onClick={() => {
                if (!isPreviewFullscreen) setMobileTab('result');
                setIsPreviewFullscreen((v) => !v);
              }}
              title={isPreviewFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}
              aria-label={isPreviewFullscreen ? 'Keluar layar penuh' : 'Layar penuh'}
              className="md:hidden p-2 text-sm font-medium bg-secondary border-2 border-foreground/30 rounded-lg hover:bg-secondary/80 transition-colors"
            >
              {isPreviewFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}


          {/* Desktop ≥ md: full button row */}
          <div className="hidden md:flex items-center gap-2 sm:gap-3">
            {isAgencyOwner && (
              <Link
                to="/agency"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-orange-100 text-orange-700 border-2 border-orange-300 rounded-lg hover:bg-orange-200 transition-colors"
                title="Dashboard Reseller / Agency"
              >
                <Store className="w-4 h-4" />
                <span>Reseller</span>
              </Link>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-primary/10 text-primary border-2 border-primary/30 rounded-lg hover:bg-primary/20 transition-colors"
              >
                <Shield className="w-4 h-4" />
                <span>Admin</span>
              </Link>
            )}

            <Link
              to="/settings"
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
              title="Pengaturan API Key"
            >
              <Settings className="w-5 h-5" />
            </Link>

            <div className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg border-2 border-foreground/20">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium max-w-[120px] truncate">
                {user?.email?.split('@')[0]}
              </span>
            </div>

            <button
              onClick={handleSignOut}
              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              title="Keluar"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile < md: overflow menu */}
          <div className="md:hidden">
            <HeaderMoreMenu>
              <HeaderMoreMenuTrigger asChild>
                <button
                  aria-label="Menu"
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors border-2 border-foreground/20"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </HeaderMoreMenuTrigger>
              <HeaderMoreMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">
                  {user?.email}
                </div>
                <HeaderMoreMenuSeparator />
                {isAgencyOwner && (
                  <HeaderMoreMenuItem asChild>
                    <Link to="/agency" className="flex items-center gap-2 cursor-pointer">
                      <Store className="w-4 h-4 text-orange-600" />
                      <span>Dashboard Reseller</span>
                    </Link>
                  </HeaderMoreMenuItem>
                )}
                {isAdmin && (
                  <HeaderMoreMenuItem asChild>
                    <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                      <Shield className="w-4 h-4 text-primary" />
                      <span>Admin</span>
                    </Link>
                  </HeaderMoreMenuItem>
                )}
                <HeaderMoreMenuItem asChild>
                  <Link to="/settings" className="flex items-center gap-2 cursor-pointer">
                    <Settings className="w-4 h-4" />
                    <span>Pengaturan</span>
                  </Link>
                </HeaderMoreMenuItem>
                <HeaderMoreMenuSeparator />
                <HeaderMoreMenuItem
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Keluar
                </HeaderMoreMenuItem>
              </HeaderMoreMenuContent>
            </HeaderMoreMenu>
          </div>
        </div>
      </header>

      {/* Subscription warning banner (annual users only, when expiring/expired) */}
      <div className="flex-shrink-0 px-4 pt-3 empty:hidden">
        <SubscriptionStatusBanner />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden bg-grid-pattern relative min-w-0">
        {/* LEFT PANEL: INPUT FORM (Hidden when in Workspace Dashboard/Perencanaan) */}
        {!(appMode === 'workspace' && (activeTab === 'dashboard' || activeTab === 'perencanaan')) && (
          <div
            className={`w-full md:w-[360px] xl:w-[400px] md:shrink-0 p-4 md:p-6 overflow-y-auto overflow-x-hidden border-r-2 border-foreground/10 bg-card/50 backdrop-blur-sm ${
              mobileTab === 'form' ? 'block' : 'hidden'
            } md:block pb-24 md:pb-6`}
          >
          <ProfileManager
            savedProfiles={cloudProfiles}
            selectedProfile={selectedProfile}
            onLoadProfile={handleLoadProfile}
            onSaveProfile={handleUpdateProfile}
            onDeleteProfile={handleDeleteProfile}
            onCreateNewProfile={handleCreateNewProfile}
          />

          <FormSection
            formData={formData}
            onInputChange={handleInputChange}
            onCheckboxChange={handleCheckboxChange}
            onPertemuanChange={handlePertemuanChange}
            onNestedChange={handleNestedChange}
            onStrukturChange={(struktur) =>
              setFormData((prev) => ({
                ...prev,
                struktur,
                // Sinkronkan Materi ← Judul Bab kalau field masih kosong.
                materi: prev.materi || struktur?.bab.judul || '',
              }))
            }
            onApplyBabResult={(result) => {
              // Kumpulkan SEMUA docs dari SEMUA submateri (bukan hanya pertama).
              const submateriIds = Object.keys(result.submateri);
              const pertemuanFlat: any[] = [];
              const allLkpd: LKPDData[] = [];
              const allAsesmen: AsesmenData[] = [];
              const allMateri: MateriData[] = [];
              const allRefleksi: TindakLanjutData[] = [];
              for (const sid of submateriIds) {
                const sres = result.submateri[sid];
                for (const pid of Object.keys(sres.pertemuanDocs)) {
                  const d = sres.pertemuanDocs[pid];
                  if (d.modul) pertemuanFlat.push(d.modul);
                  if (d.lkpd) allLkpd.push(d.lkpd);
                  if (d.asesmen) allAsesmen.push(d.asesmen);
                  if (d.materi) allMateri.push(d.materi);
                  if (d.refleksi) allRefleksi.push(d.refleksi);
                }
                if (sres.materiGlobal) allMateri.push(sres.materiGlobal);
                if (sres.asesmenGlobal) allAsesmen.push(sres.asesmenGlobal);
              }
              pertemuanFlat.sort(
                (a, b) => (a?.nomorPertemuan || 0) - (b?.nomorPertemuan || 0)
              );

              // 1) Preface Bab → pemahaman_bermakna + auto_generated
              setGeneratedSteps({
                pemahaman_bermakna: result.modulPreface?.pemahaman_bermakna || '',
                pertemuan: pertemuanFlat,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ...(result.modulPreface?.auto_generated
                  ? { auto_generated: result.modulPreface.auto_generated } as any
                  : {}),
              });
              // Apply auto_generated ke formData (identifikasi murid, jenis pengetahuan, dll.)
              if (result.modulPreface?.auto_generated) {
                handleAutoGeneratedFields({
                  auto_generated: result.modulPreface.auto_generated,
                });
              }

              // 2) Agregasi Materi (concat isi_materi[] dari semua pertemuan)
              if (allMateri.length > 0) {
                const merged: MateriData = {
                  ...allMateri[0],
                  judul_materi: allMateri[0].judul_materi,
                  pendahuluan: allMateri[0].pendahuluan,
                  isi_materi: allMateri.flatMap((m, idx) =>
                    (m.isi_materi || []).map((it) => ({
                      ...it,
                      sub_judul:
                        allMateri.length > 1
                          ? `[Pertemuan ${idx + 1}] ${it.sub_judul}`
                          : it.sub_judul,
                    }))
                  ),
                  fakta_unik: allMateri.map((m) => m.fakta_unik).filter(Boolean).join('\n\n'),
                  glosarium: allMateri.flatMap((m) => m.glosarium || []),
                  referensi: Array.from(new Set(allMateri.flatMap((m) => m.referensi || []))),
                };
                setMateriData(merged);
              }

              // 3) Agregasi LKPD (concat aktivitas_utama)
              if (allLkpd.length > 0) {
                const merged: LKPDData = {
                  ...allLkpd[0],
                  judul_lkpd: allLkpd[0].judul_lkpd,
                  aktivitas_utama: allLkpd.flatMap((l, idx) =>
                    (l.aktivitas_utama || []).map((a) => ({
                      ...a,
                      judul:
                        allLkpd.length > 1 ? `[Pertemuan ${idx + 1}] ${a.judul}` : a.judul,
                    }))
                  ),
                  refleksi: {
                    diri: allLkpd.flatMap((l) => l.refleksi?.diri || []),
                    sejawat: allLkpd.flatMap((l) => l.refleksi?.sejawat || []),
                  },
                };
                setLkpdData(merged);
              }

              // 4) Agregasi Asesmen (concat soal asesmen_akhir dgn renumbering)
              if (allAsesmen.length > 0) {
                let soalNo = 1;
                const merged: AsesmenData = {
                  ...allAsesmen[0],
                  asesmen_awal: allAsesmen[0].asesmen_awal,
                  asesmen_proses: {
                    ...allAsesmen[0].asesmen_proses,
                    aktivitas: allAsesmen.flatMap((a, idx) =>
                      (a.asesmen_proses?.aktivitas || []).map((akt) => ({
                        ...akt,
                        nama:
                          allAsesmen.length > 1
                            ? `[Pertemuan ${idx + 1}] ${akt.nama}`
                            : akt.nama,
                      }))
                    ),
                    rubrik: allAsesmen.flatMap((a) => a.asesmen_proses?.rubrik || []),
                    penilaian_diri: allAsesmen.flatMap(
                      (a) => a.asesmen_proses?.penilaian_diri || []
                    ),
                    penilaian_sejawat: allAsesmen.flatMap(
                      (a) => a.asesmen_proses?.penilaian_sejawat || []
                    ),
                  },
                  asesmen_akhir: {
                    ...allAsesmen[0].asesmen_akhir,
                    soal: allAsesmen.flatMap((a) =>
                      (a.asesmen_akhir?.soal || []).map((s) => ({
                        ...s,
                        no: soalNo++,
                      }))
                    ),
                    rubrik: allAsesmen.flatMap((a) => a.asesmen_akhir?.rubrik || []),
                  },
                };
                setAsesmenData(merged);
              }

              // 5) Agregasi Refleksi/Tindak Lanjut
              if (allRefleksi.length > 0) {
                const merged: TindakLanjutData = {
                  refleksi_guru: allRefleksi.flatMap((r, idx) =>
                    (r.refleksi_guru || []).map((x) =>
                      allRefleksi.length > 1 ? `P${idx + 1}: ${x}` : x
                    )
                  ),
                  refleksi_siswa: allRefleksi.flatMap((r, idx) =>
                    (r.refleksi_siswa || []).map((x) =>
                      allRefleksi.length > 1 ? `P${idx + 1}: ${x}` : x
                    )
                  ),
                  remedial: allRefleksi.map((r) => r.remedial).filter(Boolean).join('\n\n'),
                  pengayaan: allRefleksi.map((r) => r.pengayaan).filter(Boolean).join('\n\n'),
                };
                setTindakLanjutData(merged);
              }

              if (result.bankSoal) setBankSoalData(result.bankSoal);
              showNotificationMessage(
                `Hasil Bab diterapkan: ${pertemuanFlat.length} pertemuan${allMateri.length > 1 ? `, ${allMateri.length} materi digabung` : ''}.`,
                'success'
              );
              setActiveTab('modul');
            }}
            onGenerate={generateLessonPlan}
            loading={loading}
            error={error}
            onOpenCPSelector={() => setShowCPSelector(true)}
            onGenerateTP={handleGenerateTP}
            isGeneratingTP={isGeneratingTP}
            onKontekstualisasiCP={handleKontekstualisasiCP}
            isKontekstualisasiCP={isKontekstualisasiCP}
            onSuggestDesain={handleSuggestDesain}
            isSuggestingDesain={isSuggestingDesain}
            pertemuanV2Result={ENABLE_PERTEMUAN_DOCS_V2 ? pertemuanV2.result : undefined}
            onTogglePilihanDokumenV2={ENABLE_PERTEMUAN_DOCS_V2 ? pertemuanV2.togglePilihan : undefined}
            onGeneratePertemuanV2={ENABLE_PERTEMUAN_DOCS_V2 ? () => pertemuanV2.generateMissing() : undefined}
            isGeneratingPertemuanV2={pertemuanV2.isGenerating}
            checkRemovePertemuanV2={ENABLE_PERTEMUAN_DOCS_V2 ? v2CheckRemovePertemuan : undefined}
            onRemovePertemuanV2={ENABLE_PERTEMUAN_DOCS_V2 ? v2RemovePertemuan : undefined}
            isV2Enabled={ENABLE_PERTEMUAN_DOCS_V2}
          />

          {/* Konfirmasi reset hasil V2 saat konteks pembelajaran berubah */}
          <AlertDialog
            open={pertemuanV2.pendingContextKey !== null}
            onOpenChange={(open) => {
              if (!open) pertemuanV2.cancelContextReset();
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Konteks pembelajaran berubah</AlertDialogTitle>
                <AlertDialogDescription>
                  Mata pelajaran / kelas / materi / tujuan pembelajaran berubah.
                  Melanjutkan akan menghapus seluruh dokumen pertemuan yang sudah
                  dibuat. Batalkan untuk mengembalikan konteks lama dan
                  mempertahankan hasil.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => pertemuanV2.cancelContextReset()}>
                  Batal, pertahankan hasil
                </AlertDialogCancel>
                <AlertDialogAction onClick={() => pertemuanV2.confirmContextReset()}>
                  Ya, mulai ulang
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <CPSelectorModal
            open={showCPSelector}
            onClose={() => setShowCPSelector(false)}
            mataPelajaran={formData.mataPelajaran}
            fase={formData.fase}
            onSelectCP={handleSelectCP}
          />
        </div>
        )}

        {/* RIGHT PANEL: RESULT */}
        <div
          className={`${
            isPreviewFullscreen
              ? 'fixed inset-0 z-[60] bg-secondary'
              : 'w-full md:flex-1 md:min-w-0 border-l-2 border-foreground relative'
          } flex flex-col h-full bg-secondary ${
            !isPreviewFullscreen && mobileTab !== 'result' ? 'hidden' : 'block'
          } md:block`}
        >
          {/* Mini topbar — only visible in mobile fullscreen mode. Lets user switch
              between content tabs and exit fullscreen without losing access. */}
          {isPreviewFullscreen && (
            <div className="md:hidden flex-shrink-0 flex items-center gap-2 px-2 py-2 bg-card border-b-2 border-foreground z-40">
              <div className="flex-1 flex gap-1 overflow-x-auto no-scrollbar">
                {([
                  { id: 'modul', label: 'Modul', exists: !!generatedSteps },
                  { id: 'lkpd', label: 'LKPD', exists: !!lkpdData },
                  { id: 'asesmen', label: 'Asesmen', exists: !!asesmenData },
                  { id: 'soal', label: 'Soal', exists: !!bankSoalData },
                  { id: 'materi', label: 'Materi', exists: !!materiData },
                  { id: 'tindakLanjut', label: 'Refleksi', exists: !!tindakLanjutData },
                ] as const).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    disabled={!t.exists}
                    className={`flex-shrink-0 px-3 py-1.5 text-xs font-bold rounded-md border-2 transition-all ${
                      activeTab === t.id
                        ? 'bg-primary text-primary-foreground border-foreground'
                        : t.exists
                        ? 'bg-card text-foreground border-foreground/30'
                        : 'bg-muted text-muted-foreground border-transparent opacity-50'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setIsPreviewFullscreen(false)}
                aria-label="Keluar layar penuh"
                title="Keluar layar penuh"
                className="flex-shrink-0 p-2 bg-secondary border-2 border-foreground rounded-md hover:bg-secondary/80"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {appMode === 'workspace' && location.pathname === '/app/workspace' ? (
            <div className="flex-1 overflow-y-auto h-full min-h-0 relative">
              <WorkspaceExplorerRoot />
            </div>
          ) : appMode === 'workspace' && activeWorkspace && /^\/app\/workspace\/[a-zA-Z0-9-]+\/planning/.test(location.pathname) ? (
            <WorkspacePlanningView 
              workspace={activeWorkspace}
              onExit={() => { window.location.href = `/app/workspace/${activeWorkspace.id}`; }}
            />
          ) : appMode === 'workspace' && activeWorkspace && /^\/app\/workspace\/[a-zA-Z0-9-]+\/meeting\/[a-zA-Z0-9-]+$/.test(location.pathname) ? (
            <WorkspaceMeetingEditor
              workspace={activeWorkspace}
              meetingId={location.pathname.split('/').pop() || ''}
              onBack={() => { window.location.href = `/app/workspace/${activeWorkspace.id}`; }}
            />
          ) : appMode === 'workspace' && activeWorkspace && /^\/app\/workspace\/[a-zA-Z0-9-]+$/.test(location.pathname) ? (
            <div className="flex-1 overflow-y-auto h-full min-h-0 relative">
              <WorkspaceExplorerShell
                workspace={activeWorkspace}
                onStartPlanning={() => { window.location.href = `/app/workspace/${activeWorkspace.id}/planning`; }}
                onMeetingClick={(slot) => { window.location.href = `/app/workspace/${activeWorkspace.id}/meeting/${slot.id}`; }}
              />
            </div>
          ) : appMode === 'workspace' && activeTab === 'dashboard' ? (
            <WorkspaceDashboard
              onNavigate={setActiveTab}
              protaData={protaData}
              prosemSem1={prosemSem1}
              prosemSem2={prosemSem2}
              kktpData={kktpData}
            />
          ) : appMode === 'workspace' && activeTab === 'perencanaan' ? (

            <div className="flex flex-col h-full">
              <div className={isPreviewFullscreen ? 'hidden md:block' : ''}>
                <Toolbar
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  loaders={loaders}
                  lkpdData={lkpdData}
                  asesmenData={asesmenData}
                  materiData={materiData}
                  tindakLanjutData={tindakLanjutData}
                  bankSoalData={bankSoalData}
                  onGenerateLKPD={generateLKPD}
                  onGenerateAsesmen={generateAsesmen}
                  onGenerateMateri={generateMateri}
                  onGenerateTindakLanjut={generateTindakLanjut}
                  onOpenSoalModal={() => setShowSoalModal(true)}
                  onRegenerateModul={() => setShowRegenerateModulAlert(true)}
                  modulData={!!generatedSteps}
                  onRegenerateLKPD={regenerateLKPD}
                  onRegenerateAsesmen={regenerateAsesmen}
                  onRegenerateMateri={regenerateMateri}
                  onRegenerateTindakLanjut={regenerateTindakLanjut}
                  onRegenerateBankSoal={regenerateBankSoal}
                  onExportCurrentTab={exportCurrentTab}
                  onExportAll={exportToWord}
                  isPlanningTab={true}
                />
              </div>
              <div className="flex-1 overflow-y-auto">
                <PlanningTab
                  formData={formData}
                  kalender={kalenderPendidikan}
                  onKalenderChange={setKalenderPendidikan}
                  protaData={protaData}
                  isGeneratingProta={isGeneratingProta}
                  onGenerateProta={handleGenerateProta}
                  onExportProtaWord={handleExportProtaWord}
                  isExportingProta={isExportingProta}
                  kktpData={kktpData}
                  isGeneratingKKTP={isGeneratingKKTP}
                  onGenerateKKTP={handleGenerateKKTP}
                  onExportKKTPWord={handleExportKKTPWord}
                  isExportingKKTP={isExportingKKTP}
                  prosemSem1={prosemSem1}
                  prosemSem2={prosemSem2}
                  prosemEvents={prosemEvents}
                  isGeneratingProsem={isGeneratingProsem}
                  onGenerateProsem={handleGenerateProsem}
                  onExportProsemWord={handleExportProsemWord}
                  isExportingProsem={isExportingProsem}
                  onProsemEventsChange={handleProsemEventsChange}
                  onProtaDataChange={setProtaData}
                  onKktpDataChange={setKktpData}
                  onCreateModulFromTP={handleCreateModulFromTP}
                />
              </div>
            </div>
          ) : !generatedSteps && !isV2Mode ? (
            <EmptyState onOpenPlanning={() => setActiveTab('perencanaan')} generationProgress={generationProgress} loading={loading} />
          ) : (
            <div className="flex flex-col h-full">
              {/* Toolbar — hidden on mobile fullscreen (FAB takes over) */}
              <div className={isPreviewFullscreen ? 'hidden md:block' : ''}>
                <Toolbar
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  loaders={loaders}
                  lkpdData={lkpdData}
                  asesmenData={asesmenData}
                  materiData={materiData}
                  tindakLanjutData={tindakLanjutData}
                  bankSoalData={bankSoalData}
                  onGenerateLKPD={generateLKPD}
                  onGenerateAsesmen={generateAsesmen}
                  onGenerateMateri={generateMateri}
                  onGenerateTindakLanjut={generateTindakLanjut}
                  onOpenSoalModal={() => setShowSoalModal(true)}
                  onRegenerateModul={() => setShowRegenerateModulAlert(true)}
                  modulData={!!generatedSteps}
                  onRegenerateLKPD={() => regenerateLKPD()}
                  onRegenerateAsesmen={() => regenerateAsesmen()}
                  onRegenerateMateri={() => regenerateMateri()}
                  onRegenerateTindakLanjut={() => regenerateTindakLanjut()}
                  onRegenerateBankSoal={() => regenerateBankSoal()}
                  onExportCurrentTab={exportCurrentTab}
                  onExportAll={exportToWord}
                  onExportPDF={exportToPDF}
                  isExportingPDF={isExportingPDF}
                  onExportSoalDocx={exportSoalDocx}
                  isExportingSoalDocx={isExportingSoalDocx}
                  // Letterhead props
                  letterheadUrl={letterheadUrl}
                  isLetterheadEnabled={isLetterheadEnabled}
                  rawLetterheadEnabled={rawLetterheadEnabled}
                  hasLetterhead={hasLetterhead}
                  isUploadingLetterhead={isUploadingLetterhead}
                  isDeletingLetterhead={isDeletingLetterhead}
                  letterheadUploadError={letterheadUploadError}
                  onToggleLetterhead={toggleLetterhead}
                  onUploadLetterhead={uploadLetterhead}
                  onDeleteLetterhead={deleteLetterhead}
                  quotaInfo={quotaInfo}
                  onOpenPromptExport={() => setShowPromptExport(true)}
                  isModulComplete={isModulComplete}
                  hideDocGenerate={isV2Mode}
                  v2Mode={isV2Mode}
                  onOpenV2Export={isV2Mode ? () => setShowV2Export(true) : undefined}
                  hidePerencanaan={appMode === 'quick'}
                />
              </div>


              {/* FASE 4B — Dialog export V2 (desktop, mobile, dan FAB) */}
              {isV2Mode && (
                <V2ExportDialog
                  open={showV2Export}
                  onOpenChange={setShowV2Export}
                  activeJenis={v2ActiveJenis}
                  activePertemuanNomor={v2Aktif?.nomor}
                  isExporting={v2Export.isExporting}
                  buildPlan={v2BuildPlan}
                  onExport={handleRunV2Export}
                />
              )}

              {/* Prompt Export Dialog */}
              <PromptExportDialog
                open={showPromptExport}
                onOpenChange={setShowPromptExport}
                formData={formData}
                soalConfig={soalConfig}
              />

              {/* Trial CTA Dialog */}
              <TrialCTADialog open={showTrialCTA} onOpenChange={setShowTrialCTA} reason={trialCTAReason} />

              {/* Regenerate Modul Confirmation */}
              <AlertDialog open={showRegenerateModulAlert} onOpenChange={setShowRegenerateModulAlert}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Regenerate Modul Ajar?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Semua konten tab lain (LKPD, Asesmen, Materi, Refleksi, Soal) yang sudah digenerate akan direset dan perlu digenerate ulang.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={() => regenerateModul()}>
                      Ya, Regenerate
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Preview Area */}
              {isV2Mode ? (
                <PertemuanResultNavigator
                  className="flex-1 flex flex-col min-h-0"
                  headerClassName="flex-none p-3 border-b-2 border-foreground bg-card space-y-2"
                  bodyClassName="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8"
                  result={pertemuanV2.result}
                  activePertemuanId={v2Aktif?.id}
                  activeJenis={v2ActiveJenis}
                  onChangePertemuan={setV2ActivePertemuanId}
                  onChangeJenis={setV2ActiveJenis}
                  onRetry={(pertemuanId, jenis) =>
                    pertemuanV2.regenerateDokumen(pertemuanId, jenis)
                  }
                  onOpenSoalModal={handleV2OpenSoalModal}
                  renderDokumen={({ jenis, dokumen }) => (
                    <DocumentPreview
                      contentRef={contentRef}
                      activeTab={V2_TAB_MAP[jenis]}
                      formData={formData}
                      generatedSteps={
                        jenis === 'modul'
                          ? ({
                              ...(pertemuanV2.result.modulPreface ?? {}),
                              pertemuan: [dokumen],
                            } as unknown as GeneratedSteps)
                          : null
                      }
                      lkpdData={jenis === 'lkpd' ? (dokumen as LKPDData) : null}
                      asesmenData={jenis === 'asesmen' ? (dokumen as AsesmenData) : null}
                      materiData={jenis === 'materi' ? (dokumen as MateriData) : null}
                      tindakLanjutData={
                        jenis === 'refleksi' ? (dokumen as TindakLanjutData) : null
                      }
                      bankSoalData={jenis === 'soal' ? (dokumen as BankSoalData) : null}
                      generatedImage={generatedImage}
                      soalImage={soalImage}
                      letterheadUrl={letterheadUrl}
                      isLetterheadEnabled={isLetterheadEnabled}
                      onUpdateStimulusImage={v2Handlers.onUpdateStimulusImage}
                      onUpdateSoalImage={v2Handlers.onUpdateSoalImage}
                      stimulusImageCount={v2ImageCounts.stimulus}
                      maxStimulusImages={MAX_STIMULUS_IMAGES}
                      onUpdateLkpdImage={v2Handlers.onUpdateLkpdImage}
                      lkpdImageCount={v2ImageCounts.lkpd}
                      maxLkpdImages={MAX_LKPD_IMAGES}
                      onUpdateMateriImage={v2Handlers.onUpdateMateriImage}
                      materiImageCount={v2ImageCounts.materi}
                      maxMateriImages={MAX_MATERI_IMAGES}
                      includeImages={Object.values(soalConfig.typeConfigs).some(c => c.useImages)}
                      onUpdateSection={v2Handlers.onUpdateSection}

                      formContext={{ mataPelajaran: formData.mataPelajaran, materi: formData.materi, kelas: formData.kelas }}
                      isModulComplete={true}
                      generatingPertemuanIndex={null}
                      v2Mode={true}
                    />
                  )}
                />
              ) : (
              <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
                <DocumentPreview
                  contentRef={contentRef}
                  activeTab={activeTab}
                  formData={formData}
                  generatedSteps={generatedSteps}
                  lkpdData={lkpdData}
                  asesmenData={asesmenData}
                  materiData={materiData}
                  tindakLanjutData={tindakLanjutData}
                  bankSoalData={bankSoalData}
                  generatedImage={generatedImage}
                  soalImage={soalImage}
                  letterheadUrl={letterheadUrl}
                  isLetterheadEnabled={isLetterheadEnabled}
                  onUpdateStimulusImage={handleUpdateStimulusImage}
                  onUpdateSoalImage={handleUpdateSoalImage}
                  stimulusImageCount={stimulusImageCount}
                  maxStimulusImages={MAX_STIMULUS_IMAGES}
                  onUpdateLkpdImage={handleUpdateLkpdImage}
                  lkpdImageCount={lkpdImageCount}
                  maxLkpdImages={MAX_LKPD_IMAGES}
                  onUpdateMateriImage={handleUpdateMateriImage}
                  materiImageCount={materiImageCount}
                  maxMateriImages={MAX_MATERI_IMAGES}
                  includeImages={Object.values(soalConfig.typeConfigs).some(c => c.useImages)}
                  onUpdateSection={handleUpdateSection}
                  formContext={{ mataPelajaran: formData.mataPelajaran, materi: formData.materi, kelas: formData.kelas }}
                  onGeneratePertemuan={generatePertemuanByIndex}
                  isModulComplete={isModulComplete}
                  generatingPertemuanIndex={loading && generationProgress ? generationProgress.current - 1 : null}
                />
              </div>
              )}


              {/* FAB Speed Dial — mobile fullscreen only. Surfaces secondary actions
                  (regenerate active tab, export, letterhead toggle, reset) that are
                  otherwise hidden when the Toolbar is collapsed. */}
              {isPreviewFullscreen && (
                <HeaderMoreMenu>
                  <HeaderMoreMenuTrigger asChild>
                    <button
                      aria-label="Menu aksi"
                      className="md:hidden fixed bottom-6 right-6 z-[70] w-14 h-14 rounded-full bg-primary text-primary-foreground border-2 border-foreground shadow-brutal-sm hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all grid place-items-center"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                  </HeaderMoreMenuTrigger>
                  <HeaderMoreMenuContent side="top" align="end" className="w-56 mb-2">
                    <HeaderMoreMenuItem
                      onClick={() => {
                        if (isV2Mode) {
                          if (v2Aktif) pertemuanV2.regenerateDokumen(v2Aktif.id, v2ActiveJenis);
                          return;
                        }
                        if (activeTab === 'lkpd') lkpdData ? regenerateLKPD() : generateLKPD();
                        else if (activeTab === 'asesmen') asesmenData ? regenerateAsesmen() : generateAsesmen();
                        else if (activeTab === 'materi') materiData ? regenerateMateri() : generateMateri();
                        else if (activeTab === 'tindakLanjut') tindakLanjutData ? regenerateTindakLanjut() : generateTindakLanjut();
                        else if (activeTab === 'soal') bankSoalData ? regenerateBankSoal() : setShowSoalModal(true);
                        else if (activeTab === 'modul') setShowRegenerateModulAlert(true);
                      }}
                      className="cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate Tab Ini
                    </HeaderMoreMenuItem>
                    {/* Export legacy diisolasi saat V2 aktif — export per
                        pertemuan menyusul pada fase berikutnya. */}
                    {isV2Mode ? (
                      <HeaderMoreMenuItem
                        data-testid="fab-export-v2-open"
                        className="cursor-pointer"
                        onClick={() => setShowV2Export(true)}
                      >
                        <FileDown className="w-4 h-4 mr-2" />
                        Export Dokumen per Pertemuan…
                      </HeaderMoreMenuItem>
                    ) : (
                      <>
                        <HeaderMoreMenuItem onClick={exportCurrentTab} className="cursor-pointer">
                          <FileDown className="w-4 h-4 mr-2" />
                          Export Tab ke Word
                        </HeaderMoreMenuItem>
                        <HeaderMoreMenuItem onClick={exportToPDF} disabled={isExportingPDF} className="cursor-pointer">
                          <FileDown className="w-4 h-4 mr-2" />
                          Export ke PDF
                        </HeaderMoreMenuItem>
                      </>
                    )}


                    {hasLetterhead && (
                      <HeaderMoreMenuItem
                        onClick={() => toggleLetterhead(!isLetterheadEnabled)}
                        className="cursor-pointer"
                      >
                        <ImageIcon className="w-4 h-4 mr-2" />
                        {isLetterheadEnabled ? 'Matikan Kop Surat' : 'Aktifkan Kop Surat'}
                      </HeaderMoreMenuItem>
                    )}
                    <HeaderMoreMenuSeparator />
                    <HeaderMoreMenuItem
                      onClick={() => setIsPreviewFullscreen(false)}
                      className="cursor-pointer"
                    >
                      <Minimize2 className="w-4 h-4 mr-2" />
                      Keluar Layar Penuh
                    </HeaderMoreMenuItem>
                  </HeaderMoreMenuContent>
                </HeaderMoreMenu>
              )}
            </div>
          )}
        </div>


        {/* Mobile Navigation */}
        {!isPreviewFullscreen && (
          <MobileNavigation
            mobileTab={mobileTab}
            setMobileTab={(t) => {
              if (t === 'form') setIsPreviewFullscreen(false);
              setMobileTab(t);
            }}
            hasGeneratedSteps={!!generatedSteps || isV2Mode}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
