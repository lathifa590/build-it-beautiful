import React, { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Loader2, Minimize2, Maximize2, FileDown, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Workspace } from "@/types/workspace";
import type { MeetingSlotDB, ProsemItemDB } from "@/hooks/useProsemData";
import { usePertemuanGeneration } from "@/hooks/usePertemuanGeneration";
import { PertemuanResultNavigator } from "@/components/modul/PertemuanResultNavigator";
import { DocumentPreview } from "@/components/modul/DocumentPreview";
import { FormSection } from "@/components/modul/FormSection";
import { DEFAULT_FORM_DATA, DEFAULT_SOAL_CONFIG } from "@/lib/constants";
import type { FormData, JenisDokumenPertemuan, LKPDData, AsesmenData, MateriData, TindakLanjutData, BankSoalData, GeneratedSteps } from "@/types/modul";
import { useMeetingDocuments, type DocumentType } from "@/hooks/useMeetingDocuments";
import { useTeacherProfiles } from "@/hooks/useTeacherProfiles";
import { useToast } from "@/hooks/use-toast";
import { SoalConfigModal } from "@/components/modul/SoalConfigModal";
import { useV2Export } from "@/hooks/useV2Export";
import { useConfirm } from "@/contexts/ConfirmContext";
import { V2ExportDialog } from "@/components/modul/V2ExportDialog";
import type { V2ExportScope, V2ExportFormat } from "@/lib/pertemuan-export";
import { MobileNavigation } from "@/components/modul/MobileNavigation";

interface WorkspaceMeetingEditorProps {
  workspace: Workspace;
  meetingId: string;
  onBack: () => void;
  isLocked?: boolean;
  onShowUpsell?: () => void;
}

export const WorkspaceMeetingEditor: React.FC<WorkspaceMeetingEditorProps> = ({
  workspace,
  meetingId,
  onBack,
  isLocked,
  onShowUpsell,
}) => {
  const [meeting, setMeeting] = useState<MeetingSlotDB | null>(null);
  const [prosemItem, setProsemItem] = useState<ProsemItemDB | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { data: cloudProfiles = [] } = useTeacherProfiles();

  const [activeJenis, setActiveJenis] = useState<JenisDokumenPertemuan>("modul");
  const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'form' | 'result'>('form');
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [isSuggestingDesain, setIsSuggestingDesain] = useState(false);
  const [isKontekstualisasiCP, setIsKontekstualisasiCP] = useState(false);
  const [showSoalModal, setShowSoalModal] = useState(false);
  const [soalConfig, setSoalConfig] = useState(DEFAULT_SOAL_CONFIG);

  // Generate synthetic FormData for the AI Generator
  const [formData, setFormData] = useState<FormData | null>(null);
  const [loadedDocsMap, setLoadedDocsMap] = useState<Record<string, any> | null>(null);
  const [hasInjectedDocs, setHasInjectedDocs] = useState(false);

  // useMeetingDocuments must be declared before initialize so loadDocuments is available
  const {
    documents,
    isLoading: isDocsLoading,
    isSaving,
    loadDocuments,
    saveAllDocuments
  } = useMeetingDocuments(workspace.id, meetingId);

  // Single sequential initialization: fetch meeting → build synthetic → load DB docs → merge formData
  // This eliminates the race condition between separate useEffects
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        // STEP 1: Fetch meeting metadata from DB
        const { data, error } = await supabase
          .from("meeting_slots")
          .select(`*, prosem_items (*)`)
          .eq("id", meetingId)
          .single();

        if (error) throw error;
        if (!data) throw new Error("Meeting slot not found");

        setMeeting(data as any);
        setProsemItem(data.prosem_items as any);

        // STEP 2: Fetch CP
        const { data: cpData } = await supabase
          .from("curriculum_plans")
          .select("content")
          .eq("workspace_id", workspace.id)
          .eq("type", "tp")
          .maybeSingle();

        const cpContentObj = cpData?.content as { cp?: string } | undefined;
        const capaianPembelajaran = cpContentObj?.cp || "";

        const jpDuration = workspace.jp_duration_minutes || (workspace.phase === 'F' || workspace.phase === 'E' ? 45 : workspace.phase === 'D' ? 40 : 35);
        const totalMinutes = (data.planned_jp || 2) * jpDuration;
        
        // Build synthetic formData as the base
        const genSettings = workspace.generation_settings || {};
        const syntheticFormData: FormData = {
          ...DEFAULT_FORM_DATA,
          mataPelajaran: workspace.subject,
          fase: workspace.phase,
          kelas: workspace.grade.toString(),
          materi: data.prosem_items.materi_pokok,
          capaianPembelajaran,
          tujuanPembelajaran: (data.prosem_items.tp_snapshot || [])
            .map((tp: any) => {
              const code = typeof tp === 'string' ? `TP${data.prosem_items.sequence}` : (tp.code || `TP${data.prosem_items.sequence}`);
              const text = typeof tp === 'string' ? tp : (tp.description || tp.teks || JSON.stringify(tp));
              return `${code}: ${text}`;
            })
            .join("\n"),
          pertemuan: [{ id: meetingId, nomorPertemuan: data.sequence, durasi: totalMinutes.toString() }],
          ...(genSettings.modelPembelajaran && genSettings.modelPembelajaran !== 'AI Auto-Select' ? { modelPembelajaran: genSettings.modelPembelajaran } : {}),
          ...(genSettings.metodePembelajaran && !genSettings.metodePembelajaran.includes('AI Auto-Select') ? { metodePembelajaran: genSettings.metodePembelajaran } : {}),
        };

        if (genSettings.soalConfig) {
          setSoalConfig(genSettings.soalConfig);
        }

        // STEP 3: Load saved documents from DB
        const docsMap = await loadDocuments();

        // STEP 4: Merge formData — DB form_data always wins over synthetic
        let finalFormData: FormData;
        if (docsMap?.['form_data']?.content_json) {
          const savedFormData = docsMap['form_data'].content_json as FormData;
          // Merge synthetic (base) + saved (wins), but keep synthetic pertemuan array if saved lacks it
          finalFormData = {
            ...syntheticFormData,
            ...savedFormData,
            // Always keep correct pertemuan array from current meeting context
            pertemuan: syntheticFormData.pertemuan,
          };
        } else {
          finalFormData = syntheticFormData;
        }

        setFormData(finalFormData);

        // STEP 4b: Auto-kontekstualisasi CP jika CP masih panjang (raw CP dari Kemdikbud)
        // Ini berjalan secara asinkron (fire & forget) agar tidak memblokir rendering
        const cpToCheck = finalFormData.capaianPembelajaran || '';
        const cpIsRaw = cpToCheck.length > 200 || cpToCheck.includes('[Menyimak]') || cpToCheck.includes('[Membaca') || cpToCheck.includes('[Berbicara') || cpToCheck.includes('[Menulis') || cpToCheck.includes('[Elemen');
        if (cpIsRaw && finalFormData.materi) {
          supabase.functions.invoke('generate-content', {
            body: { type: 'kontekstualisasi-cp', data: finalFormData }
          }).then(({ data: cpRes }) => {
            const cpKontekstual = cpRes?.data?.cp_kontekstual;
            if (cpKontekstual && cpKontekstual.length > 20) {
              setFormData((prev) => prev ? { ...prev, capaianPembelajaran: cpKontekstual } : prev);
            }
          }).catch((e) => {
            console.warn('Auto-kontekstualisasi CP gagal:', e);
          });
        }

        // STEP 5: Store docs map for document injection
        if (docsMap) setLoadedDocsMap(docsMap);


      } catch (err: any) {
        console.error("Error initializing meeting editor:", err);
        setError(err.message || "Failed to load meeting data");
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meetingId, workspace.id]);

  const handleAutoGeneratedFields = (autoGenerated: any) => {
    if (!autoGenerated) return;
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        aspekPengetahuanAwal: prev.aspekPengetahuanAwal || autoGenerated.identifikasi_murid?.aspek_pengetahuan_awal || '',
        aspekMinat: prev.aspekMinat || autoGenerated.identifikasi_murid?.aspek_minat || '',
        aspekLatarBelakang: prev.aspekLatarBelakang || autoGenerated.identifikasi_murid?.aspek_latar_belakang || '',
        aspekKebutuhanBelajar: prev.aspekKebutuhanBelajar || autoGenerated.identifikasi_murid?.aspek_kebutuhan_belajar || '',
        materiPengetahuan: {
          faktual: prev.materiPengetahuan.faktual || autoGenerated.materi_pengetahuan?.faktual || '',
          konseptual: prev.materiPengetahuan.konseptual || autoGenerated.materi_pengetahuan?.konseptual || '',
          prosedural: prev.materiPengetahuan.prosedural || autoGenerated.materi_pengetahuan?.prosedural || '',
          metakognitif: prev.materiPengetahuan.metakognitif || autoGenerated.materi_pengetahuan?.metakognitif || '',
        },
        kaitanKehidupan: prev.kaitanKehidupan || autoGenerated.kaitan_kehidupan || '',
        dimensiProfilLulusan: prev.dimensiProfilLulusan?.length > 0 ? prev.dimensiProfilLulusan : (autoGenerated.dimensi_profil_lulusan || []),
        dimensiProfilLulusanDeskripsi: prev.dimensiProfilLulusanDeskripsi || autoGenerated.dpl_deskripsi || autoGenerated.dimensiProfilLulusanDeskripsi,
        nilaiKarakter: prev.nilaiKarakter?.length > 0 ? prev.nilaiKarakter : (autoGenerated.nilai_karakter || []),
        lintasDisiplinIlmu: {
          ppkn: prev.lintasDisiplinIlmu.ppkn || autoGenerated.lintas_disiplin?.ppkn || '',
          ips: prev.lintasDisiplinIlmu.ips || autoGenerated.lintas_disiplin?.ips || '',
          matematika: prev.lintasDisiplinIlmu.matematika || autoGenerated.lintas_disiplin?.matematika || '',
          bahasaIndonesia: prev.lintasDisiplinIlmu.bahasaIndonesia || autoGenerated.lintas_disiplin?.bahasa_indonesia || '',
          seniBudaya: prev.lintasDisiplinIlmu.seniBudaya || autoGenerated.lintas_disiplin?.seni_budaya || '',
          prakarya: prev.lintasDisiplinIlmu.prakarya || autoGenerated.lintas_disiplin?.prakarya || '',
          penjaskes: prev.lintasDisiplinIlmu.penjaskes || autoGenerated.lintas_disiplin?.penjaskes || '',
        },
        kemitraanPembelajaran: {
          guruBidangStudiLain: prev.kemitraanPembelajaran.guruBidangStudiLain || autoGenerated.kemitraan?.guru_bidang_studi_lain || '',
          orangTua: prev.kemitraanPembelajaran.orangTua || autoGenerated.kemitraan?.orang_tua || '',
          tokohMasyarakat: prev.kemitraanPembelajaran.tokohMasyarakat || autoGenerated.kemitraan?.tokoh_masyarakat || '',
          instansiTerkait: prev.kemitraanPembelajaran.instansiTerkait || autoGenerated.kemitraan?.instansi_terkait || '',
          duniaUsaha: prev.kemitraanPembelajaran.duniaUsaha || autoGenerated.kemitraan?.dunia_usaha || '',
          perguruanTinggiLSM: prev.kemitraanPembelajaran.perguruanTinggiLSM || autoGenerated.kemitraan?.perguruan_tinggi_lsm || '',
          mgmpKomunitasBelajar: prev.kemitraanPembelajaran.mgmpKomunitasBelajar || autoGenerated.kemitraan?.mgmp_komunitas_belajar || '',
        },
        lingkunganPembelajaranDetail: {
          ruangFisik: prev.lingkunganPembelajaranDetail.ruangFisik || autoGenerated.lingkungan?.ruang_fisik || '',
          ruangVirtual: prev.lingkunganPembelajaranDetail.ruangVirtual || autoGenerated.lingkungan?.ruang_virtual || '',
          budayaBelajar: prev.lingkunganPembelajaranDetail.budayaBelajar || autoGenerated.lingkungan?.budaya_belajar || '',
        },
        pemanfaatanDigitalDetail: {
          perencanaan: prev.pemanfaatanDigitalDetail.perencanaan || autoGenerated.pemanfaatan_digital?.perencanaan || '',
          pelaksanaan: prev.pemanfaatanDigitalDetail.pelaksanaan || autoGenerated.pemanfaatan_digital?.pelaksanaan || '',
          asesmen: prev.pemanfaatanDigitalDetail.asesmen || autoGenerated.pemanfaatan_digital?.asesmen || '',
        },
        topikPancaCinta: (prev.topikPancaCinta?.length > 0 ? prev.topikPancaCinta : (autoGenerated.topik_panca_cinta || prev.topikPancaCinta || [])),
        topikPancaCintaDeskripsi: prev.topikPancaCintaDeskripsi || autoGenerated.panca_cinta_deskripsi || autoGenerated.topikPancaCintaDeskripsi,
        materiIntegrasiKBC: prev.materiIntegrasiKBC || autoGenerated.materi_integrasi_kbc || autoGenerated.materiIntegrasiKBC || '',
      };
    });
  };

  // Ensure background generated autoFields populate the editor when it opens
  useEffect(() => {
    if (loadedDocsMap?.['modul']?.content_json) {
      const modulContent = loadedDocsMap['modul'].content_json as any;
      const autoGen = modulContent.auto_generated || (modulContent.identifikasi_murid ? modulContent : null);
      if (autoGen) {
        handleAutoGeneratedFields(autoGen);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedDocsMap]);

  // Hook into V2 Generator
  const pertemuanV2 = usePertemuanGeneration({
    formData: formData || DEFAULT_FORM_DATA,
    seed: `${workspace.subject}|${workspace.grade}|${meetingId}`,
    soalConfig: soalConfig,
    callbacks: {
      onNotify: (msg, type) => {
        if (type === 'error') {
          toast({ variant: 'destructive', description: msg });
        } else {
          toast({ description: msg });
        }
      },
      onAutoFill: (autoGenerated) => handleAutoGeneratedFields(autoGenerated),
    },
  });

  const [showV2Export, setShowV2Export] = useState(false);
  const v2Export = useV2Export({
    result: pertemuanV2.result,
    formData: formData || DEFAULT_FORM_DATA,
    notify: (msg, type) => {
      toast({ description: msg, variant: type === 'error' ? 'destructive' : 'default' });
    },
  });

  const handleRunV2Export = useCallback(
    async ({ scope, format }: { scope: V2ExportScope; format: V2ExportFormat }) => {
      const ok = await v2Export.runExport({
        scope,
        format,
        activePertemuanId: meetingId,
        activeJenisDokumen: activeJenis,
      });
      if (ok) setShowV2Export(false);
    },
    [v2Export, meetingId, activeJenis],
  );

  const v2BuildPlan = useCallback(
    (scope: V2ExportScope) =>
      v2Export.buildPlan({
        scope,
        activePertemuanId: meetingId,
        activeJenisDokumen: activeJenis,
      }),
    [v2Export, meetingId, activeJenis],
  );

  // Sync formData with generator
  useEffect(() => {
    if (formData) {
      pertemuanV2.syncFromForm(formData.pertemuan, `meeting-${meetingId}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, meetingId]);

  // Inject Profile data when loaded
  useEffect(() => {
    if (cloudProfiles.length > 0 && formData && !formData.namaPenyusun) {
      const savedProfileId = localStorage.getItem(`workspace_profile_${workspace.id}`);
      const selectedProfile = savedProfileId 
        ? cloudProfiles.find((p: any) => p.id === savedProfileId) 
        : cloudProfiles[0];
        
      const profileData = selectedProfile?.data || cloudProfiles[0]?.data || {};
      
      setFormData(prev => prev ? {
        ...prev,
        namaPenyusun: profileData.namaPenyusun || "",
        nipPenyusun: profileData.nipPenyusun || "",
        sekolah: profileData.sekolah || "",
        kepalaSekolah: profileData.kepalaSekolah || "",
        nipKepalaSekolah: profileData.nipKepalaSekolah || "",
      } : null);
    }
  }, [cloudProfiles, formData, workspace.id]);

  const v2Aktif = pertemuanV2.result.pertemuan.find((p) => p.id === meetingId) || pertemuanV2.result.pertemuan[0];

  const handleGenerateSoal = () => {
    if (!v2Aktif) return;
    setShowSoalModal(false);
    pertemuanV2.generateDokumen(v2Aktif.id, 'soal', soalConfig);
  };

  const V2_TAB_MAP: Record<JenisDokumenPertemuan, string> = {
    modul: "modul",
    lkpd: "lkpd",
    asesmen: "asesmen",
    soal: "soal",
    materi: "materi",
    refleksi: "tindakLanjut",
  };

  // Handlers for FormSection
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  const handleCheckboxChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const current = prev[field] as string[];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter((item) => item !== value) };
      } else {
        return { ...prev, [field]: [...current, value] };
      }
    });
  };

  const handleNestedChange = (parent: keyof FormData, field: string, value: string) => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [parent]: {
          ...(prev[parent] as Record<string, any>),
          [field]: value,
        },
      };
    });
  };

  const handleSuggestDesain = async (silent = false) => {
    if (!formData || !formData.capaianPembelajaran || !formData.tujuanPembelajaran) {
      if (!silent) toast({ variant: 'destructive', description: 'Isi CP dan Tujuan Pembelajaran terlebih dahulu' });
      return false;
    }

    setIsSuggestingDesain(true);
    if (silent) {
      toast({ description: 'Sedang memilih Model & Metode Pembelajaran secara otomatis...' });
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: { type: 'suggest-desain-pembelajaran', data: formData },
      });

      if (error) throw error;
      if (data?.error) {
        if (!silent) toast({ variant: 'destructive', description: data.error });
        return false;
      }

      const suggestion = data?.data;
      if (suggestion) {
        setFormData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            ...(suggestion.modelPembelajaran ? { modelPembelajaran: suggestion.modelPembelajaran } : {}),
            ...(suggestion.metodePembelajaran?.length ? { metodePembelajaran: suggestion.metodePembelajaran } : {}),
            ...((suggestion.dimensiProfilLulusan?.length || suggestion.dimensiProfilPelajarPancasila?.length) ? { 
              dimensiProfilLulusan: (suggestion.dimensiProfilLulusan || suggestion.dimensiProfilPelajarPancasila).map((d: string) => { 
                const match = d.match(/DPL\s*\d/i); 
                return match ? match[0].toUpperCase().replace(/\s+/, ' ') : d; 
              }) 
            } : {}),
            ...(suggestion.nilaiKarakter?.length ? { nilaiKarakter: suggestion.nilaiKarakter } : {}),
          };
        });
        if (!silent) toast({ description: 'Berhasil menganalisis dan menyarankan desain pembelajaran' });
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Error suggest desain:', err);
      if (!silent) toast({ variant: 'destructive', description: err.message || 'Gagal menyarankan desain' });
      return false;
    } finally {
      setIsSuggestingDesain(false);
    }
  };

  const handleGenerateWithAutoSelect = async (type: 'missing' | 'all') => {
    if (isLocked && onShowUpsell) {
      onShowUpsell();
      return;
    }

    // Check if AI Auto-Select is active
    if (!formData?.modelPembelajaran || !formData?.metodePembelajaran?.length) {
      const success = await handleSuggestDesain(true);
      if (success) {
        // Wait briefly for state to settle before generation
        setTimeout(() => {
          if (type === 'missing') pertemuanV2.generateMissing();
          else pertemuanV2.regenerate();
        }, 100);
        return;
      } else {
        // If it failed, don't proceed to generation
        return;
      }
    }

    // If no auto-select needed, proceed normally
    if (type === 'missing') pertemuanV2.generateMissing();
    else pertemuanV2.regenerate();
  };

  const handleKontekstualisasiCP = async () => {
    if (!formData || !formData.capaianPembelajaran || !formData.materi) {
      toast({ variant: 'destructive', description: 'Isi CP dan Materi terlebih dahulu' });
      return;
    }

    setIsKontekstualisasiCP(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: { type: 'kontekstualisasi-cp', data: formData },
      });

      if (error) throw error;
      if (data?.error) {
        toast({ variant: 'destructive', description: data.error });
        return;
      }

      const cpData = data?.data;
      if (cpData?.cp_kontekstual) {
        setFormData((prev) => prev ? { ...prev, capaianPembelajaran: cpData.cp_kontekstual } : null);
        toast({ description: 'CP berhasil disesuaikan dengan materi!' });
      } else {
        toast({ variant: 'destructive', description: 'Format response tidak valid' });
      }
    } catch (err) {
      console.error('CP kontekstualisasi error:', err);
      toast({ variant: 'destructive', description: 'Gagal menyesuaikan CP' });
    } finally {
      setIsKontekstualisasiCP(false);
    }
  };

  const handleTogglePilihanDokumenV2 = (pertemuanId: string, doc: JenisDokumenPertemuan, checked: boolean) => {
    pertemuanV2.togglePilihan(pertemuanId, doc, checked);
  };

  const v2UpdateDoc = React.useCallback(
    (jenis: JenisDokumenPertemuan, updater: (doc: any) => any) => {
      if (!v2Aktif) return;
      pertemuanV2.updateDokumen(v2Aktif.id, jenis, updater as (d: unknown) => unknown);
    },
    [v2Aktif, pertemuanV2]
  );

  // Documents are loaded sequentially inside initialize() above — no separate effect needed.

  // Inject loaded documents after formData has been synced and generator is ready
  useEffect(() => {
    if (loadedDocsMap && v2Aktif && !hasInjectedDocs && formData !== null) {
      const docsToInject: Partial<Record<JenisDokumenPertemuan, any>> = {};
      (Object.keys(V2_TAB_MAP) as JenisDokumenPertemuan[]).forEach((jenis) => {
        if (loadedDocsMap[jenis]?.content_json) {
          docsToInject[jenis] = loadedDocsMap[jenis].content_json;
        }
      });
      if (Object.keys(docsToInject).length > 0) {
        // IMPORTANT: use v2Aktif.id (internal generator ID), NOT meetingId
        // meetingId is the DB meeting UUID, but the generator assigns its own stable IDs
        pertemuanV2.injectExternalDocuments(v2Aktif.id, docsToInject);
      }
      setHasInjectedDocs(true);
    }
  }, [loadedDocsMap, v2Aktif, hasInjectedDocs, formData, meetingId, pertemuanV2]);

  const handleSaveAll = async () => {
    if (!v2Aktif) return;
    const toSave: Array<{ type: DocumentType, title: string, content: any }> = [];
    
    (Object.keys(V2_TAB_MAP) as JenisDokumenPertemuan[]).forEach((jenis) => {
      const content = v2Aktif.dokumen[jenis];
      if (content) {
        toSave.push({
          type: jenis as DocumentType,
          title: `${jenis.toUpperCase()} - ${meeting?.title}`,
          content
        });
      }
    });

    if (formData) {
      toSave.push({
        type: 'form_data' as DocumentType,
        title: `Konfigurasi - ${meeting?.title}`,
        content: formData
      });
    }

    if (toSave.length > 0) {
      await saveAllDocuments(toSave);
    }
  };

  const handleReset = async () => {
    const confirmed = await confirm({
      title: "Reset Hasil Dokumen?",
      description: "Yakin ingin mereset hasil dokumen (panel kanan) untuk pertemuan ini? Form (panel kiri) akan dipertahankan. (Tekan Simpan Perubahan jika ingin menghapusnya permanen dari database)",
      confirmText: "Reset",
      variant: "destructive"
    });
    if (confirmed) {
      pertemuanV2.resetV2();
      toast({ description: "Dokumen pertemuan telah direset. Silakan klik Generate untuk membuat ulang." });
    }
  };

  const v2Handlers = React.useMemo(
    () => ({
      onUpdateStimulusImage: (imageUrl: string, stimulusId?: number) =>
        v2UpdateDoc("soal", (bank) => {
          if (stimulusId && bank?.stimulus_list) {
            return {
              ...bank,
              stimulus_list: bank.stimulus_list.map((st: any) =>
                st.id === stimulusId ? { ...st, image: imageUrl } : st
              ),
            };
          }
          return { ...bank, stimulus_image: imageUrl };
        }),
      onUpdateSoalImage: (imageUrl: string, soalIndex: number) =>
        v2UpdateDoc("soal", (bank) => ({
          ...bank,
          daftar_soal: (bank?.daftar_soal ?? []).map((s: any, i: number) =>
            i === soalIndex ? { ...s, stimulus_image: imageUrl, requires_image: true } : s
          ),
        })),
      onUpdateLkpdImage: (imageUrl: string, aktivitasIndex: number) =>
        v2UpdateDoc("lkpd", (lkpd) => ({
          ...lkpd,
          aktivitas_utama: (lkpd?.aktivitas_utama ?? []).map((a: any, i: number) =>
            i === aktivitasIndex ? { ...a, image: imageUrl } : a
          ),
        })),
      onUpdateMateriImage: (imageUrl: string, subBabIndex: number, isHeader?: boolean) =>
        v2UpdateDoc("materi", (materi) =>
          isHeader
            ? { ...materi, header_image: imageUrl }
            : {
                ...materi,
                isi_materi: (materi?.isi_materi ?? []).map((sec: any, i: number) =>
                  i === subBabIndex ? { ...sec, image: imageUrl } : sec
                ),
              }
        ),
      onUpdateSection: (tab: string, sectionId: string, newContent: unknown) => {
        if (!v2Aktif) return;
        const jenis = (Object.keys(V2_TAB_MAP) as JenisDokumenPertemuan[]).find(
          (j) => V2_TAB_MAP[j] === tab
        );
        if (!jenis) return;
        if (jenis === "modul") {
          const path = sectionId.startsWith("pertemuan.0.")
            ? sectionId.slice("pertemuan.0.".length)
            : sectionId;
          pertemuanV2.updateSection(v2Aktif.id, "modul", path, newContent);
        } else {
          pertemuanV2.updateSection(v2Aktif.id, jenis, sectionId, newContent);
        }
      },
    }),
    [v2UpdateDoc, v2Aktif, pertemuanV2]
  );

  const v2ImageCounts = React.useMemo(() => {
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

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !meeting || !formData) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
        <p className="text-destructive font-semibold">Gagal memuat pertemuan</p>
        <p className="text-sm text-muted-foreground">{error}</p>
        <button onClick={onBack} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Kembali ke Workspace
        </button>
      </div>
    );
  }

  return (
    <div className={`flex-1 w-full flex flex-col min-h-0 bg-secondary ${isPreviewFullscreen ? "fixed inset-0 z-50" : ""}`}>
      {/* Editor Header */}
      {!isPreviewFullscreen && (
        <div className="flex items-center justify-between p-4 bg-card border-b-2 border-foreground">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-secondary rounded-lg transition-colors border-2 border-transparent hover:border-foreground/20"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="font-bold font-heading text-lg leading-tight">
                Pertemuan {meeting.sequence}: {meeting.title}
              </h2>
              <p className="text-xs text-muted-foreground">
                {prosemItem?.materi_pokok} · {meeting.planned_jp} JP
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 hidden md:flex">
            <button
              onClick={() => setShowV2Export(true)}
              className="px-3 py-2 text-sm font-bold rounded-lg border-2 border-foreground bg-card hover:bg-muted transition-all shadow-brutal-sm flex items-center gap-2"
              title="Export Dokumen"
            >
              <FileDown className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={handleReset}
              className="px-3 py-2 text-sm font-bold rounded-lg border-2 border-foreground bg-card hover:bg-muted transition-all shadow-brutal-sm flex items-center gap-2"
              title="Reset Hasil Dokumen"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={handleSaveAll}
              disabled={isSaving || !v2Aktif}
              className={`px-4 py-2 text-sm font-bold rounded-lg border-2 transition-all shadow-brutal-sm flex items-center gap-2 ${
                isSaving ? 'bg-muted text-muted-foreground border-foreground/30' : 'bg-emerald-400 text-foreground border-foreground hover:-translate-y-0.5 hover:shadow-brutal'
              }`}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>💾</span>}
              {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
            <button
              onClick={() => setIsPreviewFullscreen(true)}
              className="p-2 bg-secondary border-2 border-foreground/30 rounded-lg hover:bg-secondary/80"
              title="Layar Penuh"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Editor Main Content */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden relative">
        {!isPreviewFullscreen && (
          <div className={`flex-1 w-full md:w-[360px] xl:w-[400px] md:flex-none md:shrink-0 border-r-2 border-foreground overflow-y-auto bg-card p-4 pb-24 md:p-6 md:pb-6 z-20 shadow-[4px_0_0_rgba(0,0,0,1)] ${mobileTab === 'result' ? 'hidden md:block' : 'flex flex-col'}`}>
            <FormSection
              formData={formData}
              onInputChange={handleInputChange}
              onCheckboxChange={handleCheckboxChange}
              onPertemuanChange={() => {}} // Not allowed to change meetings structure here
              onNestedChange={handleNestedChange}
              onGenerate={() => {}} // Handled by V2
              loading={pertemuanV2.isGenerating}
              error={""}
              onKontekstualisasiCP={() => {
                if (isLocked && onShowUpsell) {
                  onShowUpsell();
                } else {
                  handleKontekstualisasiCP();
                }
              }}
              isKontekstualisasiCP={isKontekstualisasiCP}
              onSuggestDesain={() => {
                if (isLocked && onShowUpsell) {
                  onShowUpsell();
                } else {
                  handleSuggestDesain();
                }
              }}
              isSuggestingDesain={isSuggestingDesain}
              isV2Enabled={true}
              isWorkspaceMode={true}
              pertemuanV2Result={pertemuanV2.result}
              onTogglePilihanDokumenV2={handleTogglePilihanDokumenV2}
              onGeneratePertemuanV2={() => {
                if (isLocked && onShowUpsell) {
                  onShowUpsell();
                } else {
                  handleGenerateWithAutoSelect('missing');
                }
              }}
              isGeneratingPertemuanV2={pertemuanV2.isGenerating}
            />
          </div>
        )}
        
        {isPreviewFullscreen && (
          <div className="absolute top-4 right-4 z-[70]">
            <button
              onClick={() => setIsPreviewFullscreen(false)}
              className="p-2 bg-card border-2 border-foreground rounded-lg shadow-brutal-sm hover:translate-y-0.5 transition-all"
              title="Keluar Layar Penuh"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        )}
        
        <PertemuanResultNavigator
          className={`flex-1 flex-col min-h-0 w-full ${mobileTab === 'form' ? 'hidden md:flex' : 'flex'}`}
          headerClassName="flex-none p-3 border-b-2 border-foreground bg-card space-y-2 relative z-10"
          bodyClassName="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 relative z-0"
          result={pertemuanV2.result}
          activePertemuanId={v2Aktif?.id}
          activeJenis={activeJenis}
          onChangePertemuan={() => {}} // Disabled since we only have 1 meeting here
          onChangeJenis={setActiveJenis}
          onRetry={(id, jenis) => pertemuanV2.regenerateDokumen(id, jenis)}
          onOpenSoalModal={() => setShowSoalModal(true)}
          renderDokumen={({ jenis, dokumen }) => (
            <>
              <div className="mb-4 p-3 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-sm flex items-center justify-between">
                <div>
                  <strong>💡 Tips:</strong> Anda dapat mengedit teks pada dokumen di bawah ini. Arahkan kursor (hover) ke bagian teks yang ingin diubah, lalu klik tombol <strong>Edit</strong>.
                </div>
              </div>
              <DocumentPreview
              contentRef={contentRef}
              activeTab={V2_TAB_MAP[jenis]}
              formData={formData}
              generatedSteps={
                jenis === "modul"
                  ? ({
                      ...(pertemuanV2.result.modulPreface ?? {}),
                      pertemuan: [dokumen],
                    } as unknown as GeneratedSteps)
                  : undefined
              }
              lkpdData={jenis === "lkpd" ? (dokumen as LKPDData) : undefined}
              asesmenData={jenis === "asesmen" ? (dokumen as AsesmenData) : undefined}
              materiData={jenis === "materi" ? (dokumen as MateriData) : undefined}
              tindakLanjutData={
                jenis === "refleksi" ? (dokumen as TindakLanjutData) : undefined
              }
              bankSoalData={ jenis === "soal" ? (dokumen as BankSoalData) : undefined } isModulComplete={true} v2Mode={true}
              generatedImage={null}
              soalImage={null}
              letterheadUrl={null}
              isLetterheadEnabled={false}
              onUpdateStimulusImage={v2Handlers.onUpdateStimulusImage}
              onUpdateSoalImage={v2Handlers.onUpdateSoalImage}
              stimulusImageCount={v2ImageCounts.stimulus}
              maxStimulusImages={5}
              onUpdateLkpdImage={v2Handlers.onUpdateLkpdImage}
              lkpdImageCount={v2ImageCounts.lkpd}
              maxLkpdImages={3}
              onUpdateMateriImage={v2Handlers.onUpdateMateriImage}
              materiImageCount={v2ImageCounts.materi}
              maxMateriImages={5}
              onUpdateSection={v2Handlers.onUpdateSection}
              isWorkspaceMode={true}
              meetingId={meetingId}
              isSaving={isSaving}
              onSaveToWorkspace={handleSaveAll}
            />
            </>
          )}
          onGenerateMissing={() => handleGenerateWithAutoSelect('missing')}
          isGenerating={pertemuanV2.isGenerating}
        />
        
        <MobileNavigation
          mobileTab={mobileTab}
          setMobileTab={setMobileTab}
          hasGeneratedSteps={true}
        />
      </div>

      <SoalConfigModal
        isOpen={showSoalModal}
        onClose={() => setShowSoalModal(false)}
        soalConfig={soalConfig}
        setSoalConfig={setSoalConfig}
        onGenerate={() => {
          pertemuanV2.togglePilihan(meetingId, 'soal', true);
          pertemuanV2.regenerateDokumen(meetingId, 'soal');
          setShowSoalModal(false);
        }}
      />

      <V2ExportDialog
        open={showV2Export}
        onOpenChange={setShowV2Export}
        activeJenis={activeJenis}
        activePertemuanNomor={meeting.sequence}
        isExporting={v2Export.isExporting}
        buildPlan={v2BuildPlan}
        onExport={handleRunV2Export}
      />
    </div>
  );
};
