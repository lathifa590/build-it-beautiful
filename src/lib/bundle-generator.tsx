import JSZip from 'jszip';
import { supabase } from '@/integrations/supabase/client';
import { createRoot } from 'react-dom/client';
import type { Workspace } from '@/types/workspace';
import type { ProsemItemDB, MeetingSlotDB } from '@/hooks/useProsemData';
import { V2ExportStage } from '@/components/modul/V2ExportStage';
import {
  buildWordHtml,
  createStagingContainer,
  destroyStagingContainer,
  stripInteractiveElements,
  sanitizeWordFormElements,
  stripWordExportInlineStyles,
  waitForAssets
} from '@/lib/export-dom';
import type { V2ExportItem } from '@/lib/pertemuan-export';

export async function generateBundleZip(
  workspace: Workspace,
  semester: number,
  prosemItems: ProsemItemDB[],
  onProgress?: (msg: string) => void
): Promise<Blob> {
  const zip = new JSZip();
  if (onProgress) onProgress('Mengambil dokumen pertemuan...');
  
  const meetingSlots = prosemItems.flatMap(item => item.meeting_slots).filter(s => s.status === 'completed');
  
  if (meetingSlots.length === 0) {
    throw new Error('Tidak ada pertemuan yang sudah selesai (generated) di semester ini.');
  }

  for (let i = 0; i < meetingSlots.length; i++) {
    const slot = meetingSlots[i];
    if (onProgress) onProgress(`Memproses Pertemuan ${i + 1} dari ${meetingSlots.length}...`);
    
    // Batch: 1 query ambil semua doc + version untuk slot ini (pakai FK hint)
    const { data: links, error: linkError } = await supabase
      .from('meeting_document_links')
      .select(`
        document_id,
        documents (
          id, document_type, current_version_id,
          document_versions!fk_documents_current_version ( content_json )
        )
      `)
      .eq('meeting_slot_id', slot.id);
      
    if (linkError) { console.error(linkError); continue; }
    if (!links || links.length === 0) { console.warn(`No docs slot ${slot.id}`); continue; }
    
    const dokumenByType: Record<string, any> = {};
    const pilihanDokumen: Record<string, boolean> = {};
    let modulPreface: any = null;

    for (const link of links as any[]) {
      const doc = link.documents;
      if (!doc) continue;
      const versions = doc.document_versions;
      const cj = Array.isArray(versions) ? versions[0]?.content_json : versions?.content_json;
      if (!cj) continue;
      const t = doc.document_type as string;
      const key = t; // 'modul'|'lkpd'|'asesmen'|'materi'|'soal'|'refleksi'
      dokumenByType[key] = cj;
      if (t === 'modul' && cj.modulPreface) modulPreface = cj.modulPreface;
      if (t === 'modul' && cj.auto_generated && !modulPreface) {
        modulPreface = { pemahaman_bermakna: cj.pemahaman_bermakna || '', auto_generated: cj.auto_generated };
      }
    }

    const items: V2ExportItem[] = [];
    const order = ['modul', 'lkpd', 'asesmen', 'soal', 'materi', 'refleksi'];
    
    for (const key of order) {
      if (dokumenByType[key]) {
        items.push({
          pertemuanId: slot.id,
          nomorPertemuan: i + 1,
          jenis: key as any,
          dokumen: dokumenByType[key],
          includeModulPreface: key === 'modul',
          filenamePart: key
        });
      }
    }

    if (items.length === 0) continue;

    const rawGlobalFormData = workspace.global_form_data as any || {};
    const savedFormData = dokumenByType['form_data'] || {};
    const autoGen = modulPreface?.auto_generated || {};

    const ensureArray = (val: any): string[] => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string') return val.trim() ? [val.trim()] : [];
      return [];
    };

    const safeFormData = {
      // Base defaults (no ...spread to avoid wrong shapes from raw DB data)
      kurikulum: savedFormData.kurikulum || rawGlobalFormData.kurikulum || 'merdeka',
      namaPenyusun: savedFormData.namaPenyusun || rawGlobalFormData.namaPenyusun || 'Nama Guru',
      nipPenyusun: savedFormData.nipPenyusun || rawGlobalFormData.nipPenyusun || '',
      sekolah: savedFormData.sekolah || rawGlobalFormData.sekolah || 'Nama Sekolah',
      kepalaSekolah: savedFormData.kepalaSekolah || rawGlobalFormData.kepalaSekolah || '',
      nipKepalaSekolah: savedFormData.nipKepalaSekolah || rawGlobalFormData.nipKepalaSekolah || '',
      mataPelajaran: savedFormData.mataPelajaran || rawGlobalFormData.mataPelajaran || workspace.subject || 'Mata Pelajaran',
      materi: savedFormData.materi || rawGlobalFormData.materi || (slot as any).materi_pokok || 'Materi',
      subMateri: savedFormData.subMateri || rawGlobalFormData.subMateri || '',
      fase: savedFormData.fase || rawGlobalFormData.fase || 'Fase',
      kelas: savedFormData.kelas || rawGlobalFormData.kelas || 'Kelas',
      semester: savedFormData.semester || rawGlobalFormData.semester || semester,
      pertemuan: ensureArray(savedFormData.pertemuan || rawGlobalFormData.pertemuan),
      
      // Identifikasi Murid
      aspekPengetahuanAwal: savedFormData.aspekPengetahuanAwal || rawGlobalFormData.aspekPengetahuanAwal || autoGen.identifikasi_murid?.aspek_pengetahuan_awal || '-',
      aspekMinat: savedFormData.aspekMinat || rawGlobalFormData.aspekMinat || autoGen.identifikasi_murid?.aspek_minat || '-',
      aspekLatarBelakang: savedFormData.aspekLatarBelakang || rawGlobalFormData.aspekLatarBelakang || autoGen.identifikasi_murid?.aspek_latar_belakang || '-',
      aspekKebutuhanBelajar: savedFormData.aspekKebutuhanBelajar || rawGlobalFormData.aspekKebutuhanBelajar || autoGen.identifikasi_murid?.aspek_kebutuhan_belajar || '-',
      materiPengetahuan: {
        faktual: savedFormData.materiPengetahuan?.faktual || rawGlobalFormData.materiPengetahuan?.faktual || autoGen.materi_pengetahuan?.faktual || '-',
        konseptual: savedFormData.materiPengetahuan?.konseptual || rawGlobalFormData.materiPengetahuan?.konseptual || autoGen.materi_pengetahuan?.konseptual || '-',
        prosedural: savedFormData.materiPengetahuan?.prosedural || rawGlobalFormData.materiPengetahuan?.prosedural || autoGen.materi_pengetahuan?.prosedural || '-',
        metakognitif: savedFormData.materiPengetahuan?.metakognitif || rawGlobalFormData.materiPengetahuan?.metakognitif || autoGen.materi_pengetahuan?.metakognitif || '-',
      },
      kaitanKehidupan: savedFormData.kaitanKehidupan || rawGlobalFormData.kaitanKehidupan || autoGen.kaitan_kehidupan || '',
      
      dimensiProfilLulusan: ensureArray(savedFormData.dimensiProfilLulusan?.length > 0 ? savedFormData.dimensiProfilLulusan : (rawGlobalFormData.dimensiProfilLulusan?.length > 0 ? rawGlobalFormData.dimensiProfilLulusan : autoGen.dimensi_profil_lulusan)),
      dimensiProfilLulusanDeskripsi: (savedFormData.dimensiProfilLulusanDeskripsi && typeof savedFormData.dimensiProfilLulusanDeskripsi === 'object') ? savedFormData.dimensiProfilLulusanDeskripsi : {},
      nilaiKarakter: ensureArray(savedFormData.nilaiKarakter?.length > 0 ? savedFormData.nilaiKarakter : (rawGlobalFormData.nilaiKarakter?.length > 0 ? rawGlobalFormData.nilaiKarakter : autoGen.nilai_karakter)),
      
      capaianPembelajaran: savedFormData.capaianPembelajaran || (slot as any).capaian_pembelajaran || '',
      tujuanPembelajaran: savedFormData.tujuanPembelajaran || (slot as any).tujuan_pembelajaran || '',
      modelPembelajaran: savedFormData.modelPembelajaran || rawGlobalFormData.modelPembelajaran || autoGen.model_pembelajaran || '',
      metodePembelajaran: ensureArray(savedFormData.metodePembelajaran || rawGlobalFormData.metodePembelajaran || autoGen.metode_pembelajaran),

      // Lintas Disiplin Ilmu (full interface)
      lintasDisiplinIlmu: {
        ppkn: savedFormData.lintasDisiplinIlmu?.ppkn || rawGlobalFormData.lintasDisiplinIlmu?.ppkn || autoGen.lintas_disiplin?.ppkn || '',
        ips: savedFormData.lintasDisiplinIlmu?.ips || rawGlobalFormData.lintasDisiplinIlmu?.ips || autoGen.lintas_disiplin?.ips || '',
        matematika: savedFormData.lintasDisiplinIlmu?.matematika || rawGlobalFormData.lintasDisiplinIlmu?.matematika || autoGen.lintas_disiplin?.matematika || '',
        bahasaIndonesia: savedFormData.lintasDisiplinIlmu?.bahasaIndonesia || rawGlobalFormData.lintasDisiplinIlmu?.bahasaIndonesia || autoGen.lintas_disiplin?.bahasa_indonesia || '',
        seniBudaya: savedFormData.lintasDisiplinIlmu?.seniBudaya || rawGlobalFormData.lintasDisiplinIlmu?.seniBudaya || autoGen.lintas_disiplin?.seni_budaya || '',
        prakarya: savedFormData.lintasDisiplinIlmu?.prakarya || rawGlobalFormData.lintasDisiplinIlmu?.prakarya || autoGen.lintas_disiplin?.prakarya || '',
        penjaskes: savedFormData.lintasDisiplinIlmu?.penjaskes || rawGlobalFormData.lintasDisiplinIlmu?.penjaskes || autoGen.lintas_disiplin?.penjaskes || '',
      },

      // Kemitraan Pembelajaran (explicit object - NOT using raw kemitraan string)
      kemitraanPembelajaran: {
        guruBidangStudiLain: savedFormData.kemitraanPembelajaran?.guruBidangStudiLain || autoGen.kemitraan?.guru_bidang_studi_lain || '',
        orangTua: savedFormData.kemitraanPembelajaran?.orangTua || autoGen.kemitraan?.orang_tua || '',
        tokohMasyarakat: savedFormData.kemitraanPembelajaran?.tokohMasyarakat || autoGen.kemitraan?.tokoh_masyarakat || '',
        instansiTerkait: savedFormData.kemitraanPembelajaran?.instansiTerkait || autoGen.kemitraan?.instansi_terkait || '',
        duniaUsaha: savedFormData.kemitraanPembelajaran?.duniaUsaha || autoGen.kemitraan?.dunia_usaha || '',
        perguruanTinggiLSM: savedFormData.kemitraanPembelajaran?.perguruanTinggiLSM || autoGen.kemitraan?.perguruan_tinggi_lsm || '',
        mgmpKomunitasBelajar: savedFormData.kemitraanPembelajaran?.mgmpKomunitasBelajar || autoGen.kemitraan?.mgmp_komunitas_belajar || '',
      },

      // Lingkungan Pembelajaran (explicit object)
      lingkunganPembelajaranDetail: {
        ruangFisik: savedFormData.lingkunganPembelajaranDetail?.ruangFisik || autoGen.lingkungan?.ruang_fisik || '',
        ruangVirtual: savedFormData.lingkunganPembelajaranDetail?.ruangVirtual || autoGen.lingkungan?.ruang_virtual || '',
        budayaBelajar: savedFormData.lingkunganPembelajaranDetail?.budayaBelajar || autoGen.lingkungan?.budaya_belajar || '',
      },

      // Pemanfaatan Digital (explicit object)
      pemanfaatanDigitalDetail: {
        perencanaan: savedFormData.pemanfaatanDigitalDetail?.perencanaan || autoGen.pemanfaatan_digital?.perencanaan || '',
        pelaksanaan: savedFormData.pemanfaatanDigitalDetail?.pelaksanaan || autoGen.pemanfaatan_digital?.pelaksanaan || '',
        asesmen: savedFormData.pemanfaatanDigitalDetail?.asesmen || autoGen.pemanfaatan_digital?.asesmen || '',
      },

      // KBC fields
      topikPancaCinta: ensureArray(savedFormData.topikPancaCinta?.length > 0 ? savedFormData.topikPancaCinta : (rawGlobalFormData.topikPancaCinta?.length > 0 ? rawGlobalFormData.topikPancaCinta : autoGen.topik_panca_cinta)),
      topikPancaCintaDeskripsi: (savedFormData.topikPancaCintaDeskripsi && typeof savedFormData.topikPancaCintaDeskripsi === 'object') ? savedFormData.topikPancaCintaDeskripsi : {},
      materiIntegrasiKBC: savedFormData.materiIntegrasiKBC || autoGen.materi_integrasi_kbc || '',

      // Legacy fields (backward compat)
      kesiapanSiswa: savedFormData.kesiapanSiswa || rawGlobalFormData.kesiapanSiswa || '',
      karakteristikMateri: savedFormData.karakteristikMateri || rawGlobalFormData.karakteristikMateri || '',
      profilLulusan: ensureArray(savedFormData.profilLulusan || rawGlobalFormData.profilLulusan),
      lintasDisiplin: savedFormData.lintasDisiplin || rawGlobalFormData.lintasDisiplin || '',
      kemitraan: savedFormData.kemitraan || rawGlobalFormData.kemitraan || '',
      lingkunganBelajar: ensureArray(savedFormData.lingkunganBelajar?.length > 0 ? savedFormData.lingkunganBelajar : (rawGlobalFormData.lingkunganBelajar?.length > 0 ? rawGlobalFormData.lingkunganBelajar : autoGen.lingkungan_belajar)),
      pemanfaatanDigital: savedFormData.pemanfaatanDigital || rawGlobalFormData.pemanfaatanDigital || '',
    };

    const container = createStagingContainer();
    const root = createRoot(container);
    
    await new Promise<void>((resolve) => {
      root.render(
        <V2ExportStage
          items={items}
          formData={safeFormData}
          modulPreface={modulPreface}
          letterheadUrl={workspace.kopsurat_url}
          isLetterheadEnabled={!!workspace.kopsurat_url}
          outputFormat="word"
          onMounted={resolve}
        />
      );
    });
    
    await waitForAssets(container);
    stripInteractiveElements(container);
    sanitizeWordFormElements(container);
    stripWordExportInlineStyles(container);
    
    const contentHtml = container.innerHTML;
    const meetingTitle = `Pertemuan ${i+1} — ${(slot as any).materi_pokok || ''}`;
    const wordHtml = buildWordHtml(contentHtml, meetingTitle);
    const blob = new Blob(['\ufeff', wordHtml], { type: 'application/msword' });
    
    root.unmount();
    destroyStagingContainer(container);

    const mapel = (safeFormData.mataPelajaran || 'Mapel').replace(/[\\/:*?"<>|]/g,'_').slice(0,20);
    const safeName = `P${i+1}_${mapel}_${(slot as any).materi_pokok || 'Materi'}`.replace(/[\\/:*?"<>|]/g,'_').slice(0,70);
    zip.file(`${safeName}.doc`, blob);
  }

  const fileCount = Object.keys(zip.files).length;
  if (fileCount === 0) {
    throw new Error('Gagal membuat ZIP: tidak ada dokumen berhasil diproses.');
  }

  if (onProgress) onProgress('Membuat file ZIP...');
  const zipBlob = await zip.generateAsync({ type: "blob" });
  return zipBlob;
}
