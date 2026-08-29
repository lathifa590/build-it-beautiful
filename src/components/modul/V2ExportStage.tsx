/**
 * FASE 4B — Staging renderer offscreen untuk export V2.
 *
 * Merender SETIAP item export plan memakai renderer preview yang sama
 * (`DocumentPreview`) sehingga tidak ada template kedua untuk Word/PDF.
 * Komponen ini di-mount pada container offscreen (lihat `export-dom.ts`),
 * tidak pernah terlihat pengguna, dan tidak menyentuh state hasil/tab UI.
 */

import { useEffect, useRef } from 'react';
import { DocumentPreview } from '@/components/modul/DocumentPreview';
import type { V2ExportItem } from '@/lib/pertemuan-export';
import { V2_JENIS_LABEL } from '@/lib/pertemuan-export';
import type {
  AsesmenData,
  BabModulPreface,
  BankSoalData,
  FormData,
  GeneratedSteps,
  JenisDokumenPertemuan,
  LKPDData,
  MateriData,
  TindakLanjutData,
} from '@/types/modul';
import type { OutputFormat } from '@/types/export-format';

export const V2_EXPORT_TAB_MAP: Record<JenisDokumenPertemuan, string> = {
  modul: 'modul',
  lkpd: 'lkpd',
  asesmen: 'asesmen',
  soal: 'soal',
  materi: 'materi',
  refleksi: 'tindakLanjut',
};

interface V2ExportStageProps {
  items: V2ExportItem[];
  formData: FormData;
  modulPreface?: BabModulPreface;
  letterheadUrl?: string | null;
  isLetterheadEnabled?: boolean;
  outputFormat?: OutputFormat;
  /** Dipanggil setelah seluruh item ter-mount. */
  onMounted?: () => void;
}

const ItemRenderer = ({
  item,
  index,
  formData,
  modulPreface,
  letterheadUrl,
  isLetterheadEnabled,
  outputFormat,
}: {
  item: V2ExportItem;
  index: number;
  formData: FormData;
  modulPreface?: BabModulPreface;
  letterheadUrl?: string | null;
  isLetterheadEnabled?: boolean;
  outputFormat?: OutputFormat;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const jenis = item.jenis;

  return (
    <div
      data-v2-export-item={`${item.pertemuanId}:${jenis}`}
      data-v2-export-jenis={jenis}
      data-v2-export-pertemuan={String(item.nomorPertemuan)}
      className={index > 0 ? 'page-break-before' : undefined}
      style={index > 0 ? { pageBreakBefore: 'always' } : undefined}
    >
      {/* Penanda pemisah internal antar dokumen */}
      <div
        data-v2-export-marker="true"
        style={{ fontSize: '10pt', fontWeight: 700, marginBottom: '8px' }}
      >
        Pertemuan {item.nomorPertemuan} — {V2_JENIS_LABEL[jenis]}
      </div>
      {/*
        FASE 4B.1 — Kop dokumen non-Modul.
        Setiap item export adalah dokumen mandiri, sehingga kop harus tampil
        satu kali di awal dokumen. Untuk Modul, kop sudah dirender oleh
        DocumentPreview sendiri (jangan digandakan).
      */}
      {jenis !== 'modul' && isLetterheadEnabled && letterheadUrl && (
        <div
          data-v2-export-kop="true"
          style={{
            marginBottom: '20px',
            borderBottom: '3px solid black',
            paddingBottom: '10px',
          }}
        >
          <img
            src={letterheadUrl}
            alt="Kop Sekolah"
            style={{ width: '100%', maxHeight: '150px', objectFit: 'contain' }}
          />
        </div>
      )}
      <DocumentPreview
        contentRef={ref}
        activeTab={V2_EXPORT_TAB_MAP[jenis]}
        formData={formData}
        generatedSteps={
          jenis === 'modul'
            ? ({
                ...(item.includeModulPreface ? modulPreface ?? {} : {}),
                pertemuan: [item.dokumen],
              } as unknown as GeneratedSteps)
            : null
        }
        lkpdData={jenis === 'lkpd' ? (item.dokumen as LKPDData) : null}
        asesmenData={jenis === 'asesmen' ? (item.dokumen as AsesmenData) : null}
        materiData={jenis === 'materi' ? (item.dokumen as MateriData) : null}
        tindakLanjutData={
          jenis === 'refleksi' ? (item.dokumen as TindakLanjutData) : null
        }
        bankSoalData={jenis === 'soal' ? (item.dokumen as BankSoalData) : null}
        generatedImage={null}
        soalImage={null}
        letterheadUrl={letterheadUrl}
        isLetterheadEnabled={isLetterheadEnabled}
        isModulComplete={true}
        generatingPertemuanIndex={null}
        v2Mode={true}
        isExportMode={true}
        exportContext={{
          pertemuanKe: item.nomorPertemuan,
          jenis: item.jenis,
        }}
        outputFormat={outputFormat}
      />
    </div>
  );
};

export const V2ExportStage = ({
  items,
  formData,
  modulPreface,
  letterheadUrl,
  isLetterheadEnabled,
  outputFormat,
  onMounted,
}: V2ExportStageProps) => {
  useEffect(() => {
    onMounted?.();
    // Sengaja hanya sekali setelah mount penuh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div data-v2-export-root="true">
      {items.map((item, index) => (
        <ItemRenderer
          key={`${item.pertemuanId}-${item.jenis}`}
          item={item}
          index={index}
          formData={formData}
          modulPreface={modulPreface}
          letterheadUrl={letterheadUrl}
          isLetterheadEnabled={isLetterheadEnabled}
          outputFormat={outputFormat}
        />
      ))}
    </div>
  );
};
