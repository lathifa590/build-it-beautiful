import React, { useState, useCallback } from 'react';
import type { OutputFormat } from '@/types/export-format';
import { formatRichText, parseMarkdownTable, renderInstruksiWithTable, formatMathAndHtml } from '@/lib/formatters';
import { formatMathTextSimple } from '@/components/ui/MathRenderer';
import { DPL_OPTIONS, NILAI_KARAKTER_OPTIONS, KBC_ELEMEN_CINTA } from '@/lib/constants';
import { classifySoal, computeAnswerLines, parseAlternatifJawaban } from '@/lib/soal-format';
import { Sparkles } from 'lucide-react';
import { StimulusImageGenerator } from '@/components/modul/StimulusImageGenerator';
import { getLetterheadConfig } from '@/lib/workspace';
import { isEnglishSubject, getQuestionRange, getStimulusInstruction } from '@/lib/soal-utils';
import { EditableSection } from '@/components/modul/EditableSection';
import { SectionEditor } from '@/components/modul/SectionEditor';
import type {
  FormData,
  GeneratedSteps,
  LKPDData,
  AsesmenData,
  MateriData,
  TindakLanjutData,
  BankSoalData,
  SoalItem,
  StimulusItem,
  PernyataanBenarSalah,
  PrinsipPembelajaran,
  PertemuanData,
  PertemuanDataDetail,
  LangkahPembelajaran,
  TahapPembelajaran,
  TahapIntiDetail,
  FaseInti,
  KegiatanSintaks,
  SubKegiatan,
} from '@/types/modul';

interface DocumentPreviewProps {
  contentRef: React.RefObject<HTMLDivElement>;
  activeTab: string;
  formData: FormData;
  generatedSteps: GeneratedSteps;
  lkpdData: LKPDData | null;
  asesmenData: AsesmenData | null;
  materiData: MateriData | null;
  tindakLanjutData: TindakLanjutData | null;
  bankSoalData: BankSoalData | null;
  generatedImage: string | null;
  soalImage: string | null;
  // Letterhead props
  letterheadUrl?: string | null;
  isLetterheadEnabled?: boolean;
  // Stimulus image handlers (Bank Soal)
  onUpdateStimulusImage?: (imageUrl: string, stimulusId?: number) => void;
  onUpdateSoalImage?: (imageUrl: string, soalIndex: number) => void;
  stimulusImageCount?: number;
  maxStimulusImages?: number;
  // LKPD image handlers
  onUpdateLkpdImage?: (imageUrl: string, aktivitasIndex: number) => void;
  lkpdImageCount?: number;
  maxLkpdImages?: number;
  // Materi image handlers
  onUpdateMateriImage?: (imageUrl: string, subBabIndex: number, isHeader?: boolean) => void;
  materiImageCount?: number;
  maxMateriImages?: number;
  // Image generation props
  includeImages?: boolean;
  // Section editing
  onUpdateSection?: (tab: string, sectionId: string, newContent: unknown) => void;
  formContext?: { mataPelajaran?: string; materi?: string; kelas?: string };
  // Per-pertemuan generation (flow baru)
  onGeneratePertemuan?: (pertemuanIndex: number) => void;
  isModulComplete?: boolean;
  generatingPertemuanIndex?: number | null;
  /** Konteks spesifik saat dirender oleh V2ExportStage */
  isExportMode?: boolean;
  exportContext?: {
    pertemuanKe: number;
    jenis: string;
  };
  outputFormat?: OutputFormat;
  /** Saat true, sembunyikan UI status/pending milik flow V1 (multi-pertemuan sequential).
   *  V2 punya PertemuanResultNavigator sendiri — duplikasi hanya membingungkan. */
  v2Mode?: boolean;
}

// AI Generated badge component
const AIBadge = () => (
  <span 
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '10px',
      fontWeight: 'bold',
      color: '#6366f1',
      backgroundColor: '#eef2ff',
      padding: '2px 6px',
      borderRadius: '4px',
      marginLeft: '6px',
    }}
  >
    <Sparkles style={{ width: '10px', height: '10px' }} />
    AI
  </span>
);

// Color mapping for the 3 Deep Learning Principles
const getPrinsipStyle = (prinsip: string): { color: string; bgColor: string } => {
  switch (prinsip as PrinsipPembelajaran) {
    case 'Berkesadaran':
      return { color: '#2563eb', bgColor: '#dbeafe' }; // Blue
    case 'Bermakna':
      return { color: '#059669', bgColor: '#d1fae5' }; // Green
    case 'Menggembirakan':
      return { color: '#d97706', bgColor: '#fef3c7' }; // Orange/Amber
    default:
      return { color: '#6b7280', bgColor: '#f3f4f6' }; // Gray fallback
  }
};

// Helper to calculate total duration from pertemuan array
const getTotalDurasi = (formData: FormData): number => {
  return formData.pertemuan.reduce((sum, p) => sum + parseInt(p.durasi || '0', 10), 0);
};

// Check if pertemuan is new detailed format
const isDetailedFormat = (pertemuan: PertemuanData | PertemuanDataDetail): pertemuan is PertemuanDataDetail => {
  return 'tahap_awal' in pertemuan || 'tahap_inti' in pertemuan || 'tahap_penutup' in pertemuan;
};

// Render sub-kegiatan detail
const renderSubKegiatan = (subKegiatan: SubKegiatan[], keyPrefix: string) => {
  return subKegiatan.map((sub, i) => (
    <div key={`${keyPrefix}-sub-${i}`} style={{ marginLeft: '16px', marginBottom: '12px' }}>
      <div style={{ fontWeight: 600, marginBottom: '4px' }}>
        • {sub.judul} ({sub.durasi}):
      </div>
      
      {/* New format: Combined aktivitas as narrative flow */}
      {sub.aktivitas && sub.aktivitas.length > 0 && (
        <ul style={{ marginLeft: '16px', marginTop: '2px', listStyleType: 'disc', marginBottom: '4px' }}>
          {sub.aktivitas.map((a, j) => (
            <li key={`aktivitas-${j}`} style={{ fontSize: '0.9em' }}>{formatRichText(a)}</li>
          ))}
        </ul>
      )}
      
      {/* Legacy format: Separate guru/siswa (backward compatibility) */}
      {!sub.aktivitas && (
        <>
          {sub.aktivitas_guru && sub.aktivitas_guru.length > 0 && (
            <ul style={{ marginLeft: '16px', marginTop: '2px', listStyleType: 'disc', marginBottom: '4px' }}>
              {sub.aktivitas_guru.map((ag, j) => (
                <li key={`guru-${j}`} style={{ fontSize: '0.9em' }}>{formatRichText(ag)}</li>
              ))}
            </ul>
          )}
          {sub.aktivitas_siswa && sub.aktivitas_siswa.length > 0 && (
            <ul style={{ marginLeft: '16px', marginTop: '2px', listStyleType: 'disc', marginBottom: '4px' }}>
              {sub.aktivitas_siswa.map((as, j) => (
                <li key={`siswa-${j}`} style={{ fontSize: '0.9em' }}>{formatRichText(as)}</li>
              ))}
            </ul>
          )}
        </>
      )}
      
      {/* Pertanyaan Pemantik */}
      {sub.pertanyaan_pemantik && sub.pertanyaan_pemantik.length > 0 && (
        <div style={{ marginLeft: '16px', backgroundColor: '#fef3c7', padding: '8px', borderRadius: '4px', marginTop: '4px' }}>
          <span style={{ fontWeight: 500, color: '#d97706' }}>💡 Pertanyaan Pemantik:</span>
          <ul style={{ marginLeft: '16px', marginTop: '2px', listStyleType: 'none' }}>
            {sub.pertanyaan_pemantik.map((pp, j) => (
              <li key={`pemantik-${j}`} style={{ fontSize: '0.9em', fontStyle: 'italic' }}>"{formatRichText(pp)}"</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  ));
};

// Render kegiatan sintaks
const renderKegiatanSintaks = (kegiatan: KegiatanSintaks[], keyPrefix: string) => {
  return kegiatan.map((k, i) => {
    const prinsipStyle = getPrinsipStyle(k.prinsip);
    return (
      <div key={`${keyPrefix}-kegiatan-${i}`} style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '1em' }}>
            <strong>{k.sintaks}</strong>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85em', color: '#6b7280' }}>{k.durasi}</span>
            <span
              style={{
                color: prinsipStyle.color,
                backgroundColor: prinsipStyle.bgColor,
                fontSize: '0.8em',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 500,
              }}
            >
              ★ {k.prinsip}
            </span>
          </div>
        </div>
        {k.sub_kegiatan && k.sub_kegiatan.length > 0 && renderSubKegiatan(k.sub_kegiatan, `${keyPrefix}-k${i}`)}
      </div>
    );
  });
};

// Render tahap pembelajaran (awal/inti/penutup)
const renderTahapPembelajaran = (tahap: TahapPembelajaran, keyPrefix: string, bgColor: string) => {
  if (!tahap || !tahap.kegiatan) return null;
  
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ backgroundColor: bgColor, padding: '10px', fontWeight: 'bold', marginBottom: '12px', borderRadius: '4px' }}>
        <div style={{ fontSize: '1.1em' }}>{tahap.judul}</div>
        <div style={{ fontSize: '0.85em', fontWeight: 'normal', marginTop: '4px' }}>
          {tahap.prinsip_utama} • Total: {tahap.durasi_total}
        </div>
      </div>
      {renderKegiatanSintaks(tahap.kegiatan, keyPrefix)}
    </div>
  );
};

// Check if tahap_inti has 3-phase structure (MEMAHAMI/MENGAPLIKASI/MEREFLEKSI)
const hasFaseInti = (tahap: TahapPembelajaran | TahapIntiDetail): tahap is TahapIntiDetail => {
  return 'fase_pembelajaran' in tahap && Array.isArray((tahap as TahapIntiDetail).fase_pembelajaran) && (tahap as TahapIntiDetail).fase_pembelajaran!.length > 0;
};

// Get fase style based on name
const getFaseStyle = (nama: string): { color: string; bgColor: string; icon: string } => {
  switch (nama) {
    case 'MEMAHAMI':
      return { color: '#059669', bgColor: '#d1fae5', icon: '🔍' };
    case 'MENGAPLIKASI':
      return { color: '#d97706', bgColor: '#fef3c7', icon: '🛠️' };
    case 'MEREFLEKSI':
      return { color: '#2563eb', bgColor: '#dbeafe', icon: '💭' };
    default:
      return { color: '#6b7280', bgColor: '#f3f4f6', icon: '📌' };
  }
};

// Render fase inti (MEMAHAMI/MENGAPLIKASI/MEREFLEKSI)
const renderFaseIntiRows = (
  fase: FaseInti,
  pertemuanIndex: number,
  faseIndex: number,
  totalFase: number,
  isFirstFase: boolean,
  modelPembelajaran?: string
): React.ReactNode => {
  if (!fase || !fase.sintaks || fase.sintaks.length === 0) return null;
  
  const faseStyle = getFaseStyle(fase.nama);
  const sintaksList = fase.sintaks;
  const totalSintaksRows = sintaksList.length;

  return sintaksList.map((k, i) => {
    const prinsipStyle = getPrinsipStyle(k.prinsip);
    return (
      <tr key={`p${pertemuanIndex}-fase${faseIndex}-${i}`}>
        {/* Fase column - spans all sintaks rows within this fase */}
        {i === 0 && (
          <td
            rowSpan={totalSintaksRows}
            style={{
              border: '1px solid black',
              padding: '8px',
              fontWeight: 'bold',
              textAlign: 'center',
              verticalAlign: 'top',
              backgroundColor: faseStyle.bgColor,
              width: '15%',
            }}
          >
            <div style={{ fontSize: '1.1em' }}>
              {faseStyle.icon} {fase.nama}
            </div>
            <div style={{ fontSize: '0.85em', fontWeight: 'normal', marginTop: '4px', fontStyle: 'italic' }}>
              ({fase.durasi})
            </div>
            <div style={{ fontSize: '0.8em', fontWeight: 'normal', marginTop: '4px', color: faseStyle.color }}>
              ★ {fase.prinsip}
            </div>
          </td>
        )}
        <td style={{ border: '1px solid black', padding: '8px', verticalAlign: 'top' }}>
          <div style={{ marginBottom: '6px' }}>
            <strong>{k.sintaks}</strong>
          </div>
          
          {/* Sub Kegiatan dengan detail */}
          {k.sub_kegiatan && k.sub_kegiatan.length > 0 && (
            <div style={{ marginLeft: '8px' }}>
              {k.sub_kegiatan.map((sub, j) => (
                <div key={`sub-${j}`} style={{ marginBottom: '10px', paddingLeft: '8px' }}>
                  <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                    • {sub.judul} ({sub.durasi})
                  </div>
                  
                  {/* New format: Combined aktivitas */}
                  {sub.aktivitas && sub.aktivitas.length > 0 && (
                    <ul style={{ marginLeft: '12px', marginTop: '2px', listStyleType: 'disc', marginBottom: '4px' }}>
                      {sub.aktivitas.map((a, idx) => (
                        <li key={`aktivitas-${idx}`} style={{ fontSize: '0.9em' }}>{formatRichText(a)}</li>
                      ))}
                    </ul>
                  )}
                  
                  {/* Legacy format: backward compatibility */}
                  {!sub.aktivitas && (
                    <>
                      {sub.aktivitas_guru && sub.aktivitas_guru.length > 0 && (
                        <ul style={{ marginLeft: '12px', marginTop: '2px', listStyleType: 'disc', marginBottom: '4px' }}>
                          {sub.aktivitas_guru.map((ag, idx) => (
                            <li key={`guru-${idx}`} style={{ fontSize: '0.9em' }}>{formatRichText(ag)}</li>
                          ))}
                        </ul>
                      )}
                      {sub.aktivitas_siswa && sub.aktivitas_siswa.length > 0 && (
                        <ul style={{ marginLeft: '12px', marginTop: '2px', listStyleType: 'disc', marginBottom: '4px' }}>
                          {sub.aktivitas_siswa.map((as, idx) => (
                            <li key={`murid-${idx}`} style={{ fontSize: '0.9em' }}>{formatRichText(as)}</li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                  
                  {/* Pertanyaan Pemantik */}
                  {sub.pertanyaan_pemantik && sub.pertanyaan_pemantik.length > 0 && (
                    <div style={{ marginLeft: '12px', backgroundColor: '#fef3c7', padding: '6px 8px', borderRadius: '4px', marginTop: '4px' }}>
                      <span style={{ fontWeight: 500, color: '#d97706', fontSize: '0.85em' }}>💡 Pertanyaan Pemantik:</span>
                      <ul style={{ marginLeft: '16px', marginTop: '2px', listStyleType: 'none', marginBottom: 0 }}>
                        {sub.pertanyaan_pemantik.map((pp, idx) => (
                          <li key={`pemantik-${idx}`} style={{ fontSize: '0.85em', fontStyle: 'italic' }}>"{formatRichText(pp)}"</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Prinsip Badge */}
          <div
            style={{
              color: prinsipStyle.color,
              backgroundColor: prinsipStyle.bgColor,
              fontSize: '0.85em',
              marginTop: '8px',
              padding: '2px 8px',
              borderRadius: '4px',
              display: 'inline-block',
              fontWeight: 500,
            }}
          >
            ★ {k.prinsip}
          </div>
        </td>
        <td style={{ border: '1px solid black', padding: '8px', textAlign: 'center', verticalAlign: 'top' }}>
          {k.durasi}
        </td>
      </tr>
    );
  });
};

// Render detailed tahap as table rows (with 3-phase support for Inti)
const renderDetailedTahapRows = (
  tahap: TahapPembelajaran | TahapIntiDetail | undefined,
  tahapLabel: string,
  pertemuanIndex: number,
  modelPembelajaran?: string
): React.ReactNode => {
  if (!tahap) return null;
  
  // Check if this is tahap_inti with 3-phase structure
  if (tahapLabel === 'Inti' && hasFaseInti(tahap)) {
    const tahapInti = tahap as TahapIntiDetail;
    const faseList = tahapInti.fase_pembelajaran || [];
    
    // Calculate total rows for the entire Inti section
    const totalIntiRows = faseList.reduce((sum, fase) => sum + (fase.sintaks?.length || 0), 0);
    
    return (
      <React.Fragment key={`p${pertemuanIndex}-inti`}>
        {/* Header row for Inti with 3-phase label */}
        <tr style={{ backgroundColor: '#d1fae5' }}>
          <td
            colSpan={3}
            style={{
              border: '1px solid black',
              padding: '8px',
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            TAHAP INTI - {tahapInti.judul || 'Kegiatan Inti'}
            {modelPembelajaran && (
              <span style={{ fontWeight: 'normal', marginLeft: '8px', fontStyle: 'italic' }}>
                (Model: {modelPembelajaran})
              </span>
            )}
            <div style={{ fontSize: '0.85em', fontWeight: 'normal', marginTop: '4px' }}>
              Durasi Total: {tahapInti.durasi_total} | {tahapInti.prinsip_utama}
            </div>
          </td>
        </tr>
        {/* Sub-header for 3 phases */}
        <tr style={{ backgroundColor: '#f1f5f9' }}>
          <th style={{ border: '1px solid black', padding: '6px', width: '15%' }}>FASE</th>
          <th style={{ border: '1px solid black', padding: '6px' }}>KEGIATAN & PRINSIP</th>
          <th style={{ border: '1px solid black', padding: '6px', width: '10%' }}>DURASI</th>
        </tr>
        {/* Render each fase */}
        {faseList.map((fase, faseIdx) => 
          renderFaseIntiRows(fase, pertemuanIndex, faseIdx, faseList.length, faseIdx === 0, modelPembelajaran)
        )}
      </React.Fragment>
    );
  }
  
  // Standard rendering for non-3-phase structure
  const kegiatan = tahap.kegiatan || [];
  if (kegiatan.length === 0) return null;

  const totalRows = kegiatan.length;

  return kegiatan.map((k, i) => {
    const prinsipStyle = getPrinsipStyle(k.prinsip);
    return (
      <tr key={`p${pertemuanIndex}-${tahapLabel}-${i}`}>
        {i === 0 && (
          <td
            rowSpan={totalRows}
            style={{
              border: '1px solid black',
              padding: '8px',
              fontWeight: 'bold',
              textAlign: 'center',
              verticalAlign: 'top',
              backgroundColor: tahapLabel === 'Pendahuluan' ? '#dbeafe' : tahapLabel === 'Inti' ? '#d1fae5' : '#fef3c7',
            }}
          >
            {tahapLabel}
            {tahapLabel === 'Inti' && modelPembelajaran && (
              <div style={{ fontSize: '0.85em', fontWeight: 'normal', marginTop: '4px', fontStyle: 'italic' }}>
                ({modelPembelajaran})
              </div>
            )}
          </td>
        )}
        <td style={{ border: '1px solid black', padding: '8px', verticalAlign: 'top' }}>
          <div style={{ marginBottom: '6px' }}>
            <strong>{k.sintaks}</strong>
          </div>
          
          {/* Sub Kegiatan dengan detail */}
          {k.sub_kegiatan && k.sub_kegiatan.length > 0 && (
            <div style={{ marginLeft: '8px' }}>
              {k.sub_kegiatan.map((sub, j) => (
                <div key={`sub-${j}`} style={{ marginBottom: '10px', paddingLeft: '8px' }}>
                  <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                    • {sub.judul} ({sub.durasi})
                  </div>
                  
                  {/* New format: Combined aktivitas */}
                  {sub.aktivitas && sub.aktivitas.length > 0 && (
                    <ul style={{ marginLeft: '12px', marginTop: '2px', listStyleType: 'disc', marginBottom: '4px' }}>
                      {sub.aktivitas.map((a, idx) => (
                        <li key={`aktivitas-${idx}`} style={{ fontSize: '0.9em' }}>{formatRichText(a)}</li>
                      ))}
                    </ul>
                  )}
                  
                  {/* Legacy format: backward compatibility */}
                  {!sub.aktivitas && (
                    <>
                      {sub.aktivitas_guru && sub.aktivitas_guru.length > 0 && (
                        <ul style={{ marginLeft: '12px', marginTop: '2px', listStyleType: 'disc', marginBottom: '4px' }}>
                          {sub.aktivitas_guru.map((ag, idx) => (
                            <li key={`guru-${idx}`} style={{ fontSize: '0.9em' }}>{formatRichText(ag)}</li>
                          ))}
                        </ul>
                      )}
                      {sub.aktivitas_siswa && sub.aktivitas_siswa.length > 0 && (
                        <ul style={{ marginLeft: '12px', marginTop: '2px', listStyleType: 'disc', marginBottom: '4px' }}>
                          {sub.aktivitas_siswa.map((as, idx) => (
                            <li key={`murid-${idx}`} style={{ fontSize: '0.9em' }}>{formatRichText(as)}</li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                  
                  {/* Pertanyaan Pemantik */}
                  {sub.pertanyaan_pemantik && sub.pertanyaan_pemantik.length > 0 && (
                    <div style={{ marginLeft: '12px', backgroundColor: '#fef3c7', padding: '6px 8px', borderRadius: '4px', marginTop: '4px' }}>
                      <span style={{ fontWeight: 500, color: '#d97706', fontSize: '0.85em' }}>💡 Pertanyaan Pemantik:</span>
                      <ul style={{ marginLeft: '16px', marginTop: '2px', listStyleType: 'none', marginBottom: 0 }}>
                        {sub.pertanyaan_pemantik.map((pp, idx) => (
                          <li key={`pemantik-${idx}`} style={{ fontSize: '0.85em', fontStyle: 'italic' }}>"{formatRichText(pp)}"</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Prinsip Badge */}
          <div
            style={{
              color: prinsipStyle.color,
              backgroundColor: prinsipStyle.bgColor,
              fontSize: '0.85em',
              marginTop: '8px',
              padding: '2px 8px',
              borderRadius: '4px',
              display: 'inline-block',
              fontWeight: 500,
            }}
          >
            ★ {k.prinsip}
          </div>
        </td>
        <td style={{ border: '1px solid black', padding: '8px', textAlign: 'center', verticalAlign: 'top' }}>
          {k.durasi}
        </td>
      </tr>
    );
  });
};

// Render detailed pertemuan as table rows (new format)
const renderDetailedPertemuanAsTableRows = (
  pertemuan: PertemuanDataDetail,
  index: number,
  showHeader: boolean,
  modelPembelajaran?: string
): React.ReactNode => {
  return (
    <React.Fragment key={`pertemuan-detail-${index}`}>
      {showHeader && (
        <tr style={{ backgroundColor: '#c7d2fe' }}>
          <td
            colSpan={3}
            style={{
              border: '1px solid black',
              padding: '8px',
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            PERTEMUAN {pertemuan.nomorPertemuan} ({pertemuan.durasi} Menit)
          </td>
        </tr>
      )}
      {renderDetailedTahapRows(pertemuan.tahap_awal, 'Pendahuluan', index)}
      {renderDetailedTahapRows(pertemuan.tahap_inti, 'Inti', index, modelPembelajaran)}
      {renderDetailedTahapRows(pertemuan.tahap_penutup, 'Penutup', index)}
    </React.Fragment>
  );
};

// Render langkah pembelajaran table for legacy format (simple)
const renderLangkahTable = (
  pertemuan: PertemuanData,
  pertemuanIndex: number,
  showPertemuanHeader: boolean
) => {
  const safeSteps = {
    pembukaan: pertemuan?.pembukaan || [],
    inti: pertemuan?.inti || [],
    penutup: pertemuan?.penutup || [],
  };

  const renderLangkahRows = (
    steps: LangkahPembelajaran[],
    tahapLabel: string,
    keyPrefix: string
  ) => {
    if (steps.length === 0) return null;
    return steps.map((s, i) => {
      const prinsipStyle = getPrinsipStyle(s.prinsip);
      return (
        <tr key={keyPrefix + pertemuanIndex + '-' + i}>
          {i === 0 && (
            <td
              rowSpan={steps.length}
              style={{
                border: '1px solid black',
                padding: '6px',
                fontWeight: 'bold',
                textAlign: 'center',
                verticalAlign: 'top',
              }}
            >
              {tahapLabel}
            </td>
          )}
          <td style={{ border: '1px solid black', padding: '6px' }}>
            {formatRichText(s.kegiatan)}
            <div
              style={{
                color: prinsipStyle.color,
                backgroundColor: prinsipStyle.bgColor,
                fontSize: '0.85em',
                marginTop: '4px',
                padding: '2px 8px',
                borderRadius: '4px',
                display: 'inline-block',
                fontWeight: 500,
              }}
            >
              ★ {s.prinsip}
            </div>
          </td>
          <td style={{ border: '1px solid black', padding: '6px', textAlign: 'center' }}>
            {s.durasi}
          </td>
        </tr>
      );
    });
  };

  return (
    <React.Fragment key={'pertemuan-' + pertemuanIndex}>
      {showPertemuanHeader && (
        <tr style={{ backgroundColor: '#c7d2fe' }}>
          <td
            colSpan={3}
            style={{
              border: '1px solid black',
              padding: '8px',
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            PERTEMUAN {pertemuan.nomorPertemuan} ({pertemuan.durasi} Menit)
          </td>
        </tr>
      )}
      {renderLangkahRows(safeSteps.pembukaan, 'Pendahuluan', 'open')}
      {renderLangkahRows(safeSteps.inti, 'Inti', 'inti')}
      {renderLangkahRows(safeSteps.penutup, 'Penutup', 'close')}
    </React.Fragment>
  );
};

export const DocumentPreview = ({
  contentRef,
  activeTab,
  formData,
  generatedSteps,
  lkpdData,
  asesmenData,
  materiData,
  tindakLanjutData,
  bankSoalData,
  generatedImage,
  letterheadUrl,
  isLetterheadEnabled,
  onUpdateStimulusImage,
  onUpdateSoalImage,
  stimulusImageCount = 0,
  maxStimulusImages = 5,
  onUpdateLkpdImage,
  lkpdImageCount = 0,
  maxLkpdImages = 3,
  onUpdateMateriImage,
  materiImageCount = 0,
  maxMateriImages = 5,
  includeImages = false,
  onUpdateSection,
  formContext,
  onGeneratePertemuan,
  isModulComplete,
  generatingPertemuanIndex,
  isExportMode,
  exportContext,
  outputFormat = 'tabel',
  v2Mode = false,
}: DocumentPreviewProps) => {
  // Section editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState('');
  const [editingSectionLabel, setEditingSectionLabel] = useState('');
  const [editingSectionContent, setEditingSectionContent] = useState<unknown>(null);
  const [editingTab, setEditingTab] = useState('');

  const handleOpenEditor = useCallback((tab: string) => (sectionId: string, sectionLabel: string, currentContent: unknown) => {
    setEditingSectionId(sectionId);
    setEditingSectionLabel(sectionLabel);
    setEditingSectionContent(currentContent);
    setEditingTab(tab);
    setEditorOpen(true);
  }, []);

  const handleSaveSection = useCallback((sectionId: string, newContent: unknown) => {
    if (onUpdateSection) {
      onUpdateSection(editingTab, sectionId, newContent);
    }
  }, [onUpdateSection, editingTab]);

  // Defensive: ensure generatedSteps.pertemuan is always an array
  const safePertemuan = generatedSteps?.pertemuan || [];
  const pemahaman_bermakna = generatedSteps?.pemahaman_bermakna || '';
  const isMultiPertemuan = safePertemuan.length > 1;

  // Always use Word-compatible math formatter for consistency
  const mathFormatter = formatMathTextSimple;

  const getSectionStyle = (sectionName: string): React.CSSProperties => {
    return {
      display: activeTab === 'all' || activeTab === sectionName ? 'block' : 'none',
    };
  };

  return (
    <div
      ref={contentRef}
      className="document-preview bg-white mx-auto p-6 md:p-12 text-black"
      style={{ width: '100%', maxWidth: '210mm' }}
    >
      {/* TAB CONTENT: MODUL */}
      <div data-section="modul" style={getSectionStyle('modul')}>
        {/* Header: Letterhead OR Standard Title */}
        {isLetterheadEnabled && letterheadUrl ? (
          <div
            style={{
              marginBottom: '20px',
              borderBottom: '3px solid black',
              paddingBottom: '10px',
            }}
          >
            <img
              src={letterheadUrl}
              alt="Kop Sekolah"
              style={{
                width: '100%',
                maxHeight: '150px',
                objectFit: 'contain',
              }}
            />
          </div>
        ) : (
          <div
            style={{
              textAlign: 'center',
              marginBottom: '20px',
              borderBottom: '3px solid black',
              paddingBottom: '10px',
            }}
          >
            <h1 style={{ fontSize: '16pt', fontWeight: 'bold', margin: 0, textTransform: 'uppercase' }}>
              MODUL AJAR: {formData.mataPelajaran.toUpperCase()}
            </h1>
            <p className="italic">
              Materi: {formData.materi || formData.subMateri || '-'} - Kelas {formData.kelas}
            </p>
          </div>
        )}

        {/* Identifikasi Table or Minimalis */}
        {outputFormat === 'minimalis' ? (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '4px', marginBottom: '8px' }}>I. IDENTIFIKASI DASAR</h3>
            <div style={{ paddingLeft: '8px', marginBottom: '16px' }}>
              <div style={{ marginBottom: '4px' }}><strong>Nama Penyusun:</strong> {formData.namaPenyusun}</div>
              <div style={{ marginBottom: '4px' }}><strong>Sekolah:</strong> {formData.sekolah}</div>
              <div style={{ marginBottom: '4px' }}><strong>Mata Pelajaran:</strong> {formData.mataPelajaran}</div>
              <div style={{ marginBottom: '4px' }}><strong>Materi:</strong> {formData.materi} {formData.subMateri && `- ${formData.subMateri}`}</div>
              <div style={{ marginBottom: '4px' }}><strong>Kelas/Fase:</strong> {formData.kelas} / {formData.fase}</div>
              <div style={{ marginBottom: '4px' }}><strong>Semester:</strong> {formData.semester}</div>
              <div style={{ marginBottom: '4px' }}><strong>Jumlah Pertemuan:</strong> {formData.pertemuan.length} ({getTotalDurasi(formData)} Menit)</div>
            </div>

            <h3 style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '4px', marginBottom: '8px' }}>II. IDENTIFIKASI MURID</h3>
            <div style={{ paddingLeft: '8px', marginBottom: '16px' }}>
              <div style={{ marginBottom: '4px' }}><strong>Aspek Pengetahuan Awal:</strong> {formData.aspekPengetahuanAwal || '-'}</div>
              <div style={{ marginBottom: '4px' }}><strong>Aspek Minat:</strong> {formData.aspekMinat || '-'}</div>
              <div style={{ marginBottom: '4px' }}><strong>Aspek Latar Belakang:</strong> {formData.aspekLatarBelakang || '-'}</div>
              <div style={{ marginBottom: '4px' }}><strong>Aspek Kebutuhan Belajar:</strong> {formData.aspekKebutuhanBelajar || '-'}</div>
            </div>

            <h3 style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '4px', marginBottom: '8px' }}>III. JENIS PENGETAHUAN MATERI</h3>
            <div style={{ paddingLeft: '8px', marginBottom: '16px' }}>
              <div style={{ marginBottom: '4px' }}><strong>Faktual:</strong> {formData.materiPengetahuan?.faktual || '-'}</div>
              <div style={{ marginBottom: '4px' }}><strong>Konseptual:</strong> {formData.materiPengetahuan?.konseptual || '-'}</div>
              <div style={{ marginBottom: '4px' }}><strong>Prosedural:</strong> {formData.materiPengetahuan?.prosedural || '-'}</div>
              <div style={{ marginBottom: '4px' }}><strong>Metakognitif:</strong> {formData.materiPengetahuan?.metakognitif || '-'}</div>
              <div style={{ marginBottom: '4px', marginTop: '8px' }}><strong>Kaitan dengan Kehidupan:</strong> {formData.kaitanKehidupan || '-'}</div>
            </div>

            <h3 style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '4px', marginBottom: '8px' }}>IV. INTEGRASI NILAI & KARAKTER</h3>
            <div style={{ paddingLeft: '8px', marginBottom: '16px' }}>
              <div><strong>Nilai Karakter:</strong> {formData.nilaiKarakter && formData.nilaiKarakter.length > 0 ? formData.nilaiKarakter.join(', ') : '-'}</div>
            </div>

            <h3 style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '4px', marginBottom: '8px' }}>V. DIMENSI PROFIL LULUSAN</h3>
            <div style={{ paddingLeft: '8px', marginBottom: '16px' }}>
              <div style={{ marginBottom: '4px' }}><strong>DPL yang Dikembangkan:</strong></div>
              {formData.dimensiProfilLulusan && formData.dimensiProfilLulusan.length > 0 ? (
                <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                  {formData.dimensiProfilLulusan.map((kode, idx) => {
                    const dpl = DPL_OPTIONS.find(d => d.kode === kode);
                    const desc = formData.dimensiProfilLulusanDeskripsi?.[kode];
                    return (
                      <li key={idx} style={{ marginBottom: desc ? '6px' : '0' }}>
                        <strong>{kode}:</strong> {dpl?.nama || kode}
                        {desc && <span> &mdash; {desc}</span>}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div style={{ marginLeft: '12px' }}>{formData.profilLulusan && formData.profilLulusan.length > 0 ? formData.profilLulusan.join(', ') : '-'}</div>
              )}
            </div>

            {formData.kurikulum === 'kbc' && (
              <>
                <h3 style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '4px', marginBottom: '8px' }}>V-B. TOPIK PANCA CINTA (KBC)</h3>
                <div style={{ paddingLeft: '8px', marginBottom: '16px' }}>
                  <div style={{ marginBottom: '4px' }}><strong>Elemen Cinta yang Dikembangkan:</strong></div>
                  {(formData as any).topikPancaCinta && (formData as any).topikPancaCinta.length > 0 ? (
                    <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                      {(formData as any).topikPancaCinta.map((elemen: string, idx: number) => {
                        const desc = (formData as any).topikPancaCintaDeskripsi?.[elemen];
                        return (
                          <li key={idx} style={{ marginBottom: desc ? '6px' : '0' }}>
                            <strong>{elemen}</strong>
                            {desc && <span> &mdash; {desc}</span>}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div style={{ marginLeft: '12px' }}>-</div>
                  )}
                  <div style={{ marginTop: '8px', marginBottom: '4px' }}><strong>Materi Integrasi KBC:</strong></div>
                  <div style={{ marginLeft: '12px' }}>
                    {(formData as any).materiIntegrasiKBC 
                      ? formatRichText((formData as any).materiIntegrasiKBC)
                      : <span style={{ color: '#6b7280', fontStyle: 'italic' }}>Akan di-generate oleh AI</span>
                    }
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: '1px solid black',
            marginBottom: '20px',
            tableLayout: 'fixed',
          }}
        >
          <colgroup>
            <col style={{ width: '30%' }} />
            <col style={{ width: '70%' }} />
          </colgroup>
          <tbody>
            <tr style={{ backgroundColor: '#e2e8f0' }}>
              <td
                colSpan={2}
                style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold' }}
              >
                I. IDENTIFIKASI DASAR
              </td>
            </tr>
            <tr>
              <td
                style={{
                  border: '1px solid black',
                  padding: '6px',
                  fontWeight: 'bold',
                  verticalAlign: 'top',
                }}
              >
                Identitas Umum
              </td>
              <td style={{ border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                <div>
                  <strong>Nama Penyusun:</strong> {formData.namaPenyusun}
                </div>
                <div>
                  <strong>Sekolah:</strong> {formData.sekolah}
                </div>
                <div>
                  <strong>Mata Pelajaran:</strong> {formData.mataPelajaran}
                </div>
                <div>
                  <strong>Materi:</strong> {formData.materi} {formData.subMateri && `- ${formData.subMateri}`}
                </div>
                <div>
                  <strong>Kelas/Fase:</strong> {formData.kelas} / {formData.fase}
                </div>
                <div>
                  <strong>Semester:</strong> {formData.semester}
                </div>
                <div>
                  <strong>Jumlah Pertemuan:</strong> {formData.pertemuan.length} ({getTotalDurasi(formData)} Menit)
                </div>
              </td>
            </tr>
            
            {/* Identifikasi Murid Section */}
            <tr style={{ backgroundColor: '#dbeafe' }}>
              <td
                colSpan={2}
                style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold' }}
              >
                II. IDENTIFIKASI MURID
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                Aspek Pengetahuan Awal
              </td>
              <td style={{ border: '1px solid black', padding: '6px' }}>
                {formData.aspekPengetahuanAwal || '-'}
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                Aspek Minat
              </td>
              <td style={{ border: '1px solid black', padding: '6px' }}>
                {formData.aspekMinat || '-'}
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                Aspek Latar Belakang
              </td>
              <td style={{ border: '1px solid black', padding: '6px' }}>
                {formData.aspekLatarBelakang || '-'}
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                Aspek Kebutuhan Belajar
              </td>
              <td style={{ border: '1px solid black', padding: '6px' }}>
                {formData.aspekKebutuhanBelajar || '-'}
              </td>
            </tr>
            
            {/* Jenis Pengetahuan Materi Section */}
            <tr style={{ backgroundColor: '#d1fae5' }}>
              <td
                colSpan={2}
                style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold' }}
              >
                III. JENIS PENGETAHUAN MATERI
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                Faktual
              </td>
              <td style={{ border: '1px solid black', padding: '6px' }}>
                {formData.materiPengetahuan?.faktual || '-'}
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                Konseptual
              </td>
              <td style={{ border: '1px solid black', padding: '6px' }}>
                {formData.materiPengetahuan?.konseptual || '-'}
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                Prosedural
              </td>
              <td style={{ border: '1px solid black', padding: '6px' }}>
                {formData.materiPengetahuan?.prosedural || '-'}
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                Metakognitif
              </td>
              <td style={{ border: '1px solid black', padding: '6px' }}>
                {formData.materiPengetahuan?.metakognitif || '-'}
              </td>
            </tr>
            
            {/* Kaitan Kehidupan */}
            <tr>
              <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                Kaitan dengan Kehidupan
              </td>
              <td style={{ border: '1px solid black', padding: '6px' }}>
                {formData.kaitanKehidupan || '-'}
              </td>
            </tr>
            
            {/* Integrasi Nilai & Karakter */}
            <tr style={{ backgroundColor: '#fef3c7' }}>
              <td
                colSpan={2}
                style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold' }}
              >
                IV. INTEGRASI NILAI & KARAKTER
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                Nilai Karakter
              </td>
              <td style={{ border: '1px solid black', padding: '6px' }}>
                {formData.nilaiKarakter && formData.nilaiKarakter.length > 0 
                  ? formData.nilaiKarakter.join(', ')
                  : '-'}
              </td>
            </tr>
            
            {/* Dimensi Profil Lulusan - ALWAYS SHOWN */}
            <tr style={{ backgroundColor: '#e0e7ff' }}>
              <td
                colSpan={2}
                style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold' }}
              >
                V. DIMENSI PROFIL LULUSAN
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                DPL yang Dikembangkan
              </td>
              <td style={{ border: '1px solid black', padding: '6px' }}>
                {formData.dimensiProfilLulusan && formData.dimensiProfilLulusan.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '16px' }}>
                    {formData.dimensiProfilLulusan.map((kode, idx) => {
                      const dpl = DPL_OPTIONS.find(d => d.kode === kode);
                      const desc = formData.dimensiProfilLulusanDeskripsi?.[kode];
                      return (
                        <li key={idx} style={{ marginBottom: desc ? '6px' : '0' }}>
                          <strong>{kode}:</strong> {dpl?.nama || kode}
                          {desc && <span> &mdash; {desc}</span>}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  formData.profilLulusan && formData.profilLulusan.length > 0 
                    ? formData.profilLulusan.join(', ')
                    : '-'
                )}
              </td>
            </tr>
            
            {/* Topik Panca Cinta - KBC ONLY */}
            {formData.kurikulum === 'kbc' && (
              <>
                <tr style={{ backgroundColor: '#fce7f3' }}>
                  <td
                    colSpan={2}
                    style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold' }}
                  >
                    V-B. TOPIK PANCA CINTA (KBC)
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                    Elemen Cinta yang Dikembangkan
                  </td>
                  <td style={{ border: '1px solid black', padding: '6px' }}>
                    {(formData as any).topikPancaCinta && (formData as any).topikPancaCinta.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: '16px' }}>
                        {(formData as any).topikPancaCinta.map((elemen: string, idx: number) => {
                          const desc = (formData as any).topikPancaCintaDeskripsi?.[elemen];
                          return (
                            <li key={idx} style={{ marginBottom: desc ? '6px' : '0' }}>
                              <strong>{elemen}</strong>
                              {desc && <span> &mdash; {desc}</span>}
                            </li>
                          );
                        })}
                      </ul>
                    ) : '-'}
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                    Materi Integrasi KBC
                  </td>
                  <td style={{ border: '1px solid black', padding: '6px' }}>
                    {(formData as any).materiIntegrasiKBC 
                      ? formatRichText((formData as any).materiIntegrasiKBC)
                      : <span style={{ color: '#6b7280', fontStyle: 'italic' }}>Akan di-generate oleh AI</span>
                    }
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
        )}

        {/* Desain Pembelajaran Table */}
        {outputFormat === 'minimalis' ? (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '4px', marginBottom: '8px' }}>VI. DESAIN PEMBELAJARAN</h3>
            <div style={{ paddingLeft: '8px', marginBottom: '16px' }}>
              <div style={{ marginBottom: '8px' }}>
                <strong>Capaian Pembelajaran:</strong>
                <div style={{ marginTop: '4px', paddingLeft: '12px' }}>{formatRichText(formData.capaianPembelajaran) || '-'}</div>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Tujuan Pembelajaran:</strong>
                <div style={{ marginTop: '4px', paddingLeft: '12px' }}>
                  <EditableSection
                    sectionId="tujuan_pembelajaran"
                    sectionLabel="Tujuan Pembelajaran"
                    currentContent={formData.tujuanPembelajaran}
                    onEdit={handleOpenEditor('modul')}
                  >
                    {formatRichText(formData.tujuanPembelajaran) || '-'}
                  </EditableSection>
                </div>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Pemahaman Bermakna:</strong>
                <div style={{ marginTop: '4px', paddingLeft: '12px' }}>
                  <EditableSection
                    sectionId="pemahaman_bermakna"
                    sectionLabel="Pemahaman Bermakna"
                    currentContent={pemahaman_bermakna}
                    onEdit={handleOpenEditor('modul')}
                  >
                    {formatRichText(pemahaman_bermakna) || '-'}
                  </EditableSection>
                </div>
              </div>
              <div style={{ marginBottom: '4px' }}><strong>Model Pembelajaran:</strong> {formData.modelPembelajaran || '-'}</div>
              <div style={{ marginBottom: '4px' }}>
                <strong>Metode Pembelajaran:</strong> {formData.metodePembelajaran && formData.metodePembelajaran.length > 0 ? formData.metodePembelajaran.join(', ') : '-'}
              </div>
            </div>

            <h3 style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '4px', marginBottom: '8px' }}>VII. LINTAS DISIPLIN ILMU</h3>
            <div style={{ paddingLeft: '8px', marginBottom: '16px' }}>
              {formData.lintasDisiplinIlmu ? (
                <ul style={{ margin: '0', paddingLeft: '20px' }}>
                  {formData.lintasDisiplinIlmu.ppkn && <li><strong>PPKn:</strong> {formData.lintasDisiplinIlmu.ppkn}</li>}
                  {formData.lintasDisiplinIlmu.ips && <li><strong>IPS:</strong> {formData.lintasDisiplinIlmu.ips}</li>}
                  {formData.lintasDisiplinIlmu.matematika && <li><strong>Matematika:</strong> {formData.lintasDisiplinIlmu.matematika}</li>}
                  {formData.lintasDisiplinIlmu.bahasaIndonesia && <li><strong>Bahasa Indonesia:</strong> {formData.lintasDisiplinIlmu.bahasaIndonesia}</li>}
                  {formData.lintasDisiplinIlmu.seniBudaya && <li><strong>Seni Budaya:</strong> {formData.lintasDisiplinIlmu.seniBudaya}</li>}
                  {formData.lintasDisiplinIlmu.prakarya && <li><strong>Prakarya:</strong> {formData.lintasDisiplinIlmu.prakarya}</li>}
                  {formData.lintasDisiplinIlmu.pjok && <li><strong>PJOK:</strong> {formData.lintasDisiplinIlmu.pjok}</li>}
                  {formData.lintasDisiplinIlmu.lainnya && <li><strong>Lainnya:</strong> {formData.lintasDisiplinIlmu.lainnya}</li>}
                </ul>
              ) : (
                <div>-</div>
              )}
            </div>
          </div>
        ) : (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: '1px solid black',
            marginBottom: '20px',
            tableLayout: 'fixed',
          }}
        >
          <colgroup>
            <col style={{ width: '30%' }} />
            <col style={{ width: '70%' }} />
          </colgroup>
          <tbody>
            <tr style={{ backgroundColor: '#e2e8f0' }}>
              <td
                colSpan={2}
                style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold' }}
              >
                VI. DESAIN PEMBELAJARAN
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                Capaian Pembelajaran
              </td>
              <td style={{ border: '1px solid black', padding: '6px' }}>
                {formatRichText(formData.capaianPembelajaran) || '-'}
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                Tujuan Pembelajaran
              </td>
              <td style={{ border: '1px solid black', padding: '6px' }}>
                <EditableSection
                  sectionId="tujuan_pembelajaran"
                  sectionLabel="Tujuan Pembelajaran"
                  currentContent={formData.tujuanPembelajaran}
                  onEdit={handleOpenEditor('modul')}
                >
                  {formatRichText(formData.tujuanPembelajaran) || '-'}
                </EditableSection>
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                Pemahaman Bermakna
              </td>
              <td style={{ border: '1px solid black', padding: '6px' }}>
                <EditableSection
                  sectionId="pemahaman_bermakna"
                  sectionLabel="Pemahaman Bermakna"
                  currentContent={pemahaman_bermakna}
                  onEdit={handleOpenEditor('modul')}
                >
                  {formatRichText(pemahaman_bermakna) || '-'}
                </EditableSection>
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                Model Pembelajaran
              </td>
              <td style={{ border: '1px solid black', padding: '6px' }}>
                {formData.modelPembelajaran || '-'}
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                Metode Pembelajaran
              </td>
              <td style={{ border: '1px solid black', padding: '6px' }}>
                {formData.metodePembelajaran && formData.metodePembelajaran.length > 0 
                  ? formData.metodePembelajaran.join(', ')
                  : '-'}
              </td>
            </tr>
            
            {/* Lintas Disiplin Ilmu */}
            <tr style={{ backgroundColor: '#f0fdf4' }}>
              <td
                colSpan={2}
                style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold' }}
              >
                VII. LINTAS DISIPLIN ILMU
              </td>
            </tr>
            {formData.lintasDisiplinIlmu && (
              <>
                {formData.lintasDisiplinIlmu.ppkn && (
                  <tr>
                    <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold' }}>PPKn</td>
                    <td style={{ border: '1px solid black', padding: '6px' }}>{formData.lintasDisiplinIlmu.ppkn}</td>
                  </tr>
                )}
                {formData.lintasDisiplinIlmu.ips && (
                  <tr>
                    <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold' }}>IPS</td>
                    <td style={{ border: '1px solid black', padding: '6px' }}>{formData.lintasDisiplinIlmu.ips}</td>
                  </tr>
                )}
                {formData.lintasDisiplinIlmu.matematika && (
                  <tr>
                    <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold' }}>Matematika</td>
                    <td style={{ border: '1px solid black', padding: '6px' }}>{formData.lintasDisiplinIlmu.matematika}</td>
                  </tr>
                )}
                {formData.lintasDisiplinIlmu.bahasaIndonesia && (
                  <tr>
                    <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold' }}>Bahasa Indonesia</td>
                    <td style={{ border: '1px solid black', padding: '6px' }}>{formData.lintasDisiplinIlmu.bahasaIndonesia}</td>
                  </tr>
                )}
                {formData.lintasDisiplinIlmu.seniBudaya && (
                  <tr>
                    <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold' }}>Seni Budaya</td>
                    <td style={{ border: '1px solid black', padding: '6px' }}>{formData.lintasDisiplinIlmu.seniBudaya}</td>
                  </tr>
                )}
                {formData.lintasDisiplinIlmu.prakarya && (
                  <tr>
                    <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold' }}>Prakarya</td>
                    <td style={{ border: '1px solid black', padding: '6px' }}>{formData.lintasDisiplinIlmu.prakarya}</td>
                  </tr>
                )}
                {formData.lintasDisiplinIlmu.penjaskes && (
                  <tr>
                    <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold' }}>PJOK</td>
                    <td style={{ border: '1px solid black', padding: '6px' }}>{formData.lintasDisiplinIlmu.penjaskes}</td>
                  </tr>
                )}
              </>
            )}
            {/* Fallback for legacy lintasDisiplin field */}
            {!formData.lintasDisiplinIlmu?.ppkn && !formData.lintasDisiplinIlmu?.ips && formData.lintasDisiplin && (
              <tr>
                <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold' }}>Lintas Disiplin</td>
                <td style={{ border: '1px solid black', padding: '6px' }}>{formData.lintasDisiplin}</td>
              </tr>
            )}
            
            {/* Kemitraan Pembelajaran */}
            <tr style={{ backgroundColor: '#fce7f3' }}>
              <td
                colSpan={2}
                style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold' }}
              >
                VIII. KEMITRAAN PEMBELAJARAN
              </td>
            </tr>
            {formData.kemitraanPembelajaran && (
              <>
                {formData.kemitraanPembelajaran.guruBidangStudiLain && (
                  <tr>
                    <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold' }}>Guru Bidang Studi Lain</td>
                    <td style={{ border: '1px solid black', padding: '6px' }}>{formData.kemitraanPembelajaran.guruBidangStudiLain}</td>
                  </tr>
                )}
                {formData.kemitraanPembelajaran.orangTua && (
                  <tr>
                    <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold' }}>Orang Tua</td>
                    <td style={{ border: '1px solid black', padding: '6px' }}>{formData.kemitraanPembelajaran.orangTua}</td>
                  </tr>
                )}
                {formData.kemitraanPembelajaran.tokohMasyarakat && (
                  <tr>
                    <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold' }}>Tokoh Masyarakat</td>
                    <td style={{ border: '1px solid black', padding: '6px' }}>{formData.kemitraanPembelajaran.tokohMasyarakat}</td>
                  </tr>
                )}
                {formData.kemitraanPembelajaran.instansiTerkait && (
                  <tr>
                    <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold' }}>Instansi Terkait</td>
                    <td style={{ border: '1px solid black', padding: '6px' }}>{formData.kemitraanPembelajaran.instansiTerkait}</td>
                  </tr>
                )}
                {formData.kemitraanPembelajaran.duniaUsaha && (
                  <tr>
                    <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold' }}>Dunia Usaha/Industri</td>
                    <td style={{ border: '1px solid black', padding: '6px' }}>{formData.kemitraanPembelajaran.duniaUsaha}</td>
                  </tr>
                )}
                {formData.kemitraanPembelajaran.perguruanTinggiLSM && (
                  <tr>
                    <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold' }}>Perguruan Tinggi/LSM</td>
                    <td style={{ border: '1px solid black', padding: '6px' }}>{formData.kemitraanPembelajaran.perguruanTinggiLSM}</td>
                  </tr>
                )}
                {formData.kemitraanPembelajaran.mgmpKomunitasBelajar && (
                  <tr>
                    <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold' }}>MGMP/Komunitas Belajar</td>
                    <td style={{ border: '1px solid black', padding: '6px' }}>{formData.kemitraanPembelajaran.mgmpKomunitasBelajar}</td>
                  </tr>
                )}
              </>
            )}
            {/* Fallback for legacy kemitraan field */}
            {!formData.kemitraanPembelajaran?.guruBidangStudiLain && formData.kemitraan && (
              <tr>
                <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold' }}>Kemitraan</td>
                <td style={{ border: '1px solid black', padding: '6px' }}>{formData.kemitraan}</td>
              </tr>
            )}
            
            {/* Lingkungan Pembelajaran */}
            <tr style={{ backgroundColor: '#cffafe' }}>
              <td
                colSpan={2}
                style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold' }}
              >
                IX. LINGKUNGAN PEMBELAJARAN
              </td>
            </tr>
            {formData.lingkunganPembelajaranDetail && (
              <>
                {formData.lingkunganPembelajaranDetail.ruangFisik && (
                  <tr>
                    <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold' }}>Ruang Fisik</td>
                    <td style={{ border: '1px solid black', padding: '6px' }}>{formData.lingkunganPembelajaranDetail.ruangFisik}</td>
                  </tr>
                )}
                {formData.lingkunganPembelajaranDetail.ruangVirtual && (
                  <tr>
                    <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold' }}>Ruang Virtual</td>
                    <td style={{ border: '1px solid black', padding: '6px' }}>{formData.lingkunganPembelajaranDetail.ruangVirtual}</td>
                  </tr>
                )}
                {formData.lingkunganPembelajaranDetail.budayaBelajar && (
                  <tr>
                    <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold' }}>Budaya Belajar</td>
                    <td style={{ border: '1px solid black', padding: '6px' }}>{formData.lingkunganPembelajaranDetail.budayaBelajar}</td>
                  </tr>
                )}
              </>
            )}
            {/* Fallback for legacy lingkunganBelajar array */}
            {!formData.lingkunganPembelajaranDetail?.ruangFisik && formData.lingkunganBelajar && formData.lingkunganBelajar.length > 0 && (
              <tr>
                <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold' }}>Lingkungan</td>
                <td style={{ border: '1px solid black', padding: '6px' }}>{formData.lingkunganBelajar.join(', ')}</td>
              </tr>
            )}
            
            {/* Pemanfaatan Digital */}
        {outputFormat === 'minimalis' && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '4px', marginBottom: '8px' }}>VIII. KEMITRAAN PEMBELAJARAN</h3>
            <div style={{ paddingLeft: '8px', marginBottom: '16px' }}>
              {formData.kemitraanPembelajaran ? (
                <ul style={{ margin: '0', paddingLeft: '20px' }}>
                  {formData.kemitraanPembelajaran.guruBidangStudiLain && <li><strong>Guru Bidang Studi Lain:</strong> {formData.kemitraanPembelajaran.guruBidangStudiLain}</li>}
                  {formData.kemitraanPembelajaran.orangTua && <li><strong>Orang Tua:</strong> {formData.kemitraanPembelajaran.orangTua}</li>}
                  {formData.kemitraanPembelajaran.tokohMasyarakat && <li><strong>Tokoh Masyarakat:</strong> {formData.kemitraanPembelajaran.tokohMasyarakat}</li>}
                  {formData.kemitraanPembelajaran.instansiTerkait && <li><strong>Instansi Terkait:</strong> {formData.kemitraanPembelajaran.instansiTerkait}</li>}
                  {formData.kemitraanPembelajaran.duniaUsaha && <li><strong>Dunia Usaha/Industri:</strong> {formData.kemitraanPembelajaran.duniaUsaha}</li>}
                  {formData.kemitraanPembelajaran.perguruanTinggiLSM && <li><strong>Perguruan Tinggi/LSM:</strong> {formData.kemitraanPembelajaran.perguruanTinggiLSM}</li>}
                  {formData.kemitraanPembelajaran.mgmpKomunitasBelajar && <li><strong>MGMP/Komunitas Belajar:</strong> {formData.kemitraanPembelajaran.mgmpKomunitasBelajar}</li>}
                </ul>
              ) : formData.kemitraan ? (
                <div style={{ marginLeft: '12px' }}>{formData.kemitraan}</div>
              ) : (
                <div style={{ marginLeft: '12px' }}>-</div>
              )}
            </div>

            <h3 style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '4px', marginBottom: '8px' }}>IX. LINGKUNGAN PEMBELAJARAN</h3>
            <div style={{ paddingLeft: '8px', marginBottom: '16px' }}>
              {formData.lingkunganPembelajaranDetail ? (
                <ul style={{ margin: '0', paddingLeft: '20px' }}>
                  {formData.lingkunganPembelajaranDetail.ruangFisik && <li><strong>Ruang Fisik:</strong> {formData.lingkunganPembelajaranDetail.ruangFisik}</li>}
                  {formData.lingkunganPembelajaranDetail.ruangVirtual && <li><strong>Ruang Virtual:</strong> {formData.lingkunganPembelajaranDetail.ruangVirtual}</li>}
                  {formData.lingkunganPembelajaranDetail.budayaBelajar && <li><strong>Budaya Belajar:</strong> {formData.lingkunganPembelajaranDetail.budayaBelajar}</li>}
                </ul>
              ) : formData.lingkunganPembelajaran ? (
                <div style={{ marginLeft: '12px' }}>{formData.lingkunganPembelajaran}</div>
              ) : (
                <div style={{ marginLeft: '12px' }}>-</div>
              )}
            </div>
          </div>
        )}
            
            {/* Pemanfaatan Digital */}
            <tr style={{ backgroundColor: '#ede9fe' }}>
              <td
                colSpan={2}
                style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold' }}
              >
                X. PEMANFAATAN DIGITAL
              </td>
            </tr>
            {formData.pemanfaatanDigitalDetail && (
              <>
                {formData.pemanfaatanDigitalDetail.perencanaan && (
                  <tr>
                    <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold' }}>Perencanaan</td>
                    <td style={{ border: '1px solid black', padding: '6px' }}>{formData.pemanfaatanDigitalDetail.perencanaan}</td>
                  </tr>
                )}
                {formData.pemanfaatanDigitalDetail.pelaksanaan && (
                  <tr>
                    <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold' }}>Pelaksanaan</td>
                    <td style={{ border: '1px solid black', padding: '6px' }}>{formData.pemanfaatanDigitalDetail.pelaksanaan}</td>
                  </tr>
                )}
                {formData.pemanfaatanDigitalDetail.asesmen && (
                  <tr>
                    <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold' }}>Asesmen</td>
                    <td style={{ border: '1px solid black', padding: '6px' }}>{formData.pemanfaatanDigitalDetail.asesmen}</td>
                  </tr>
                )}
              </>
            )}
            {/* Fallback for legacy pemanfaatanDigital field */}
            {!formData.pemanfaatanDigitalDetail?.perencanaan && formData.pemanfaatanDigital && (
              <tr>
                <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold' }}>Digital</td>
                <td style={{ border: '1px solid black', padding: '6px' }}>{formData.pemanfaatanDigital}</td>
              </tr>
            )}
          </tbody>
        </table>
        )}

        {/* Minimalis layout for VIII, IX, X */}
        {outputFormat === 'minimalis' && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '4px', marginBottom: '8px' }}>VIII. KEMITRAAN PEMBELAJARAN</h3>
            <div style={{ paddingLeft: '8px', marginBottom: '16px' }}>
              {formData.kemitraanPembelajaran ? (
                <ul style={{ margin: '0', paddingLeft: '20px' }}>
                  {formData.kemitraanPembelajaran.guruBidangStudiLain && <li><strong>Guru Bidang Studi Lain:</strong> {formData.kemitraanPembelajaran.guruBidangStudiLain}</li>}
                  {formData.kemitraanPembelajaran.orangTua && <li><strong>Orang Tua:</strong> {formData.kemitraanPembelajaran.orangTua}</li>}
                  {formData.kemitraanPembelajaran.tokohMasyarakat && <li><strong>Tokoh Masyarakat:</strong> {formData.kemitraanPembelajaran.tokohMasyarakat}</li>}
                  {formData.kemitraanPembelajaran.instansiTerkait && <li><strong>Instansi Terkait:</strong> {formData.kemitraanPembelajaran.instansiTerkait}</li>}
                  {formData.kemitraanPembelajaran.duniaUsaha && <li><strong>Dunia Usaha/Industri:</strong> {formData.kemitraanPembelajaran.duniaUsaha}</li>}
                  {formData.kemitraanPembelajaran.perguruanTinggiLSM && <li><strong>Perguruan Tinggi/LSM:</strong> {formData.kemitraanPembelajaran.perguruanTinggiLSM}</li>}
                  {formData.kemitraanPembelajaran.mgmpKomunitasBelajar && <li><strong>MGMP/Komunitas Belajar:</strong> {formData.kemitraanPembelajaran.mgmpKomunitasBelajar}</li>}
                </ul>
              ) : formData.kemitraan ? (
                <div style={{ marginLeft: '12px' }}>{formData.kemitraan}</div>
              ) : (
                <div style={{ marginLeft: '12px' }}>-</div>
              )}
            </div>

            <h3 style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '4px', marginBottom: '8px' }}>IX. LINGKUNGAN PEMBELAJARAN</h3>
            <div style={{ paddingLeft: '8px', marginBottom: '16px' }}>
              {formData.lingkunganPembelajaranDetail ? (
                <ul style={{ margin: '0', paddingLeft: '20px' }}>
                  {formData.lingkunganPembelajaranDetail.ruangFisik && <li><strong>Ruang Fisik:</strong> {formData.lingkunganPembelajaranDetail.ruangFisik}</li>}
                  {formData.lingkunganPembelajaranDetail.ruangVirtual && <li><strong>Ruang Virtual:</strong> {formData.lingkunganPembelajaranDetail.ruangVirtual}</li>}
                  {formData.lingkunganPembelajaranDetail.budayaBelajar && <li><strong>Budaya Belajar:</strong> {formData.lingkunganPembelajaranDetail.budayaBelajar}</li>}
                </ul>
              ) : formData.lingkunganPembelajaran ? (
                <div style={{ marginLeft: '12px' }}>{formData.lingkunganPembelajaran}</div>
              ) : (
                <div style={{ marginLeft: '12px' }}>-</div>
              )}
            </div>

            <h3 style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '4px', marginBottom: '8px' }}>X. PEMANFAATAN DIGITAL</h3>
            <div style={{ paddingLeft: '8px', marginBottom: '16px' }}>
              {formData.pemanfaatanDigitalDetail ? (
                <ul style={{ margin: '0', paddingLeft: '20px' }}>
                  {formData.pemanfaatanDigitalDetail.perencanaan && <li><strong>Perencanaan:</strong> {formData.pemanfaatanDigitalDetail.perencanaan}</li>}
                  {formData.pemanfaatanDigitalDetail.pelaksanaan && <li><strong>Pelaksanaan:</strong> {formData.pemanfaatanDigitalDetail.pelaksanaan}</li>}
                  {formData.pemanfaatanDigitalDetail.asesmen && <li><strong>Asesmen:</strong> {formData.pemanfaatanDigitalDetail.asesmen}</li>}
                </ul>
              ) : formData.pemanfaatanDigital ? (
                <div style={{ marginLeft: '12px' }}>{formData.pemanfaatanDigital}</div>
              ) : (
                <div style={{ marginLeft: '12px' }}>-</div>
              )}
            </div>
          </div>
        )}

        {/* Langkah Pembelajaran Section */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{ backgroundColor: '#e2e8f0', padding: '8px', fontWeight: 'bold', marginBottom: '16px', border: '1px solid black' }}>
            XI. PENGALAMAN BELAJAR (LANGKAH PEMBELAJARAN)
          </div>

          {/* Status progress per pertemuan — hanya untuk flow V1 sequential */}
          {!v2Mode && (() => {
            const totalRequested = formData.pertemuan?.length || 0;
            const generatedCount = safePertemuan.length;
            if (totalRequested > 1) {
              return (
                <div style={{
                  marginBottom: '12px',
                  padding: '8px 12px',
                  backgroundColor: generatedCount >= totalRequested ? '#dcfce7' : '#fef3c7',
                  border: '1px solid',
                  borderColor: generatedCount >= totalRequested ? '#16a34a' : '#d97706',
                  borderRadius: '4px',
                  fontSize: '0.9em',
                  fontWeight: 600,
                }} className="no-print">
                  Status: {generatedCount} dari {totalRequested} pertemuan selesai
                  {generatedCount < totalRequested && ' — gunakan tombol di bawah untuk melanjutkan.'}
                </div>
              );
            }
            return null;
          })()}

        {/* Check if we have data - always render as table */}
        {safePertemuan.length > 0 ? (
          <EditableSection
            sectionId="pertemuan"
            sectionLabel="Langkah Pembelajaran (Semua Pertemuan)"
            currentContent={safePertemuan}
            onEdit={handleOpenEditor('modul')}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1px solid black',
                tableLayout: 'fixed',
              }}
            >
              <colgroup>
                <col style={{ width: '18%' }} />
                <col style={{ width: '67%' }} />
                <col style={{ width: '15%' }} />
              </colgroup>
              <tbody>
                <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'center' }}>
                  <th style={{ border: '1px solid black', padding: '6px' }}>TAHAP</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>KEGIATAN & PRINSIP</th>
                  <th style={{ border: '1px solid black', padding: '6px' }}>DURASI</th>
                </tr>
                {safePertemuan.map((pertemuan, index) =>
                  isDetailedFormat(pertemuan)
                    ? renderDetailedPertemuanAsTableRows(pertemuan as PertemuanDataDetail, index, true, formData.modelPembelajaran)
                    : renderLangkahTable(pertemuan as PertemuanData, index, true)
                )}
              </tbody>
            </table>
          </EditableSection>
        ) : (
          // Fallback if no pertemuan data
          <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280', border: '1px solid black' }}>
            Langkah pembelajaran akan muncul setelah generate modul
          </div>
        )}

        {/* Placeholder + tombol untuk pertemuan yang belum digenerate — hanya untuk flow V1 */}
        {!v2Mode && (() => {
          const generatedNomor = new Set(safePertemuan.map((p: any) => p?.nomorPertemuan));
          const pendingPertemuan = (formData.pertemuan || [])
            .map((p, idx) => ({ ...p, idx }))
            .filter((p) => !generatedNomor.has(p.nomorPertemuan));

          if (pendingPertemuan.length === 0) return null;

          return (
            <div style={{ marginTop: '16px' }} className="no-print">
              {pendingPertemuan.map((p) => (
                <div
                  key={`pending-${p.nomorPertemuan}`}
                  style={{
                    border: '2px dashed #CC5526',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '12px',
                    backgroundColor: '#FFF7ED',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#CC5526' }}>
                    PERTEMUAN {p.nomorPertemuan} ({p.durasi} Menit) — Belum Digenerate
                  </div>
                  {onGeneratePertemuan && (
                    <button
                      onClick={() => onGeneratePertemuan(p.idx)}
                      disabled={generatingPertemuanIndex !== null}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#CC5526',
                        color: 'white',
                        border: '2px solid black',
                        borderRadius: '6px',
                        fontWeight: 'bold',
                        cursor: generatingPertemuanIndex !== null ? 'not-allowed' : 'pointer',
                        opacity: generatingPertemuanIndex !== null ? 0.6 : 1,
                      }}
                    >
                      {generatingPertemuanIndex === p.idx
                        ? `Membuat Pertemuan ${p.nomorPertemuan}...`
                        : `Generate Pertemuan ${p.nomorPertemuan}`}
                    </button>
                  )}
                </div>
              ))}
            </div>
          );
        })()}
        </div>

        {/* Signature with NIP — hanya tampil jika modul lengkap */}
        {isModulComplete && (
          <table style={{ width: '100%', border: 'none', marginTop: '50px' }}>
            <tbody>
              <tr>
              <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'top' }}>
                Mengetahui,
                <br />
                Kepala Sekolah
                <br />
                <br />
                <br />
                <br />
                <strong>{formData.kepalaSekolah || '...........................'}</strong>
                <br />
                <span style={{ fontSize: '10pt' }}>
                  NIP. {formData.nipKepalaSekolah || '..............................'}
                </span>
              </td>
              <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'top' }}>
                Guru Mata Pelajaran
                <br />
                <br />
                <br />
                <br />
                <br />
                <strong>{formData.namaPenyusun}</strong>
                <br />
                <span style={{ fontSize: '10pt' }}>
                  NIP. {formData.nipPenyusun || '..............................'}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
        )}
      </div>

      {/* TAB CONTENT: LKPD - Natural Document Format */}
      {lkpdData && (
        <div data-section="lkpd" style={{ ...getSectionStyle('lkpd'), pageBreakBefore: 'always', marginTop: '40px' }}>
          {/* Page Break - using div for compatibility */}
          <div style={{ pageBreakBefore: 'always' }} />
          
          {/* Header - Plain heading */}
          <h2 style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14pt', marginBottom: '4px' }}>
            LEMBAR KERJA PESERTA DIDIK
          </h2>
          <p style={{ textAlign: 'center', fontSize: '10pt', marginBottom: '24px' }}>
            Model: Deep Learning 2026
          </p>
          
          {/* All activities as natural flow */}
          {lkpdData.aktivitas_utama &&
            lkpdData.aktivitas_utama.map((act, i) => (
              <EditableSection
                key={`edit-lkpd-${i}`}
                sectionId={`aktivitas_utama.${i}`}
                sectionLabel={`Aktivitas ${i + 1}: ${act.judul}`}
                currentContent={act}
                onEdit={handleOpenEditor('lkpd')}
              >
              <div style={{ marginBottom: '24px' }}>
                {/* Judul Aktivitas */}
                <h3 style={{ fontWeight: 'bold', fontSize: '12pt', marginBottom: '12px' }}>
                  {act.judul}
                </h3>
                
                {/* Image ilustrasi aktivitas */}
                {onUpdateLkpdImage && includeImages ? (
                  <StimulusImageGenerator
                    prompt={`${act.judul}: ${act.instruksi?.slice(0, 200) || ''}`}
                    imageUrl={act.image || null}
                    onImageGenerated={(url) => onUpdateLkpdImage(url, i)}
                    size="small"
                  />
                ) : (
                  act.image && (
                    <img
                      src={act.image}
                      alt={`Ilustrasi ${act.judul}`}
                      style={{ maxWidth: '100%', maxHeight: '250px', marginBottom: '12px', display: 'block' }}
                    />
                  )
                )}

                
                {/* Teks Pendukung - jika ada */}
                {act.teks_pendukung && (
                  <div style={{ backgroundColor: '#f9fafb', padding: '12px', marginBottom: '12px' }}>
                    <strong style={{ fontSize: '10pt', color: '#4b5563' }}>📖 Bacaan:</strong>
                    <p style={{ textAlign: 'justify', whiteSpace: 'pre-line', marginTop: '8px', marginBottom: 0 }}>{mathFormatter(act.teks_pendukung)}</p>
                  </div>
                )}
                
                {/* Instruksi - with markdown table support */}
                {act.instruksi && renderInstruksiWithTable(act.instruksi, mathFormatter)}
                
                {/* Pertanyaan Kunci atau Area Kerja - table format for Word compatibility */}
                {act.pertanyaan_kunci ? (
                  act.pertanyaan_kunci.map((q, j) => (
                    <div key={j} style={{ marginBottom: '16px' }}>
                      <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>{mathFormatter(q)}</p>
                      {/* Answer space - table format for Word compatibility */}
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }}>
                        <tbody>
                          <tr>
                            <td style={{ 
                              border: '1px solid #9ca3af', 
                              height: '80px', 
                              padding: '8px',
                              verticalAlign: 'top',
                              backgroundColor: '#fafafa'
                            }}>
                              <span style={{ color: '#9ca3af', fontSize: '9pt' }}>Jawaban:</span>
                              <br/><br/><br/><br/>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ))
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }}>
                    <tbody>
                      <tr>
                        <td style={{ 
                          border: '1px solid #9ca3af', 
                          height: '120px', 
                          padding: '8px',
                          verticalAlign: 'top',
                          backgroundColor: '#fafafa'
                        }}>
                          <span style={{ color: '#6b7280', fontSize: '10pt' }}>Area Kerja Siswa</span>
                          <br/><br/><br/><br/><br/><br/>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
              </EditableSection>
            ))}
        </div>
      )}

      {/* TAB CONTENT: ASESMEN - Natural Document Format */}
      {asesmenData && (
        <div
          data-section="asesmen"
          style={{ ...getSectionStyle('asesmen'), pageBreakBefore: 'always', marginTop: '40px' }}
        >
          {/* Page Break - using div for compatibility */}
          <div style={{ pageBreakBefore: 'always' }} />
          
          {/* Main title - Plain heading */}
          <h2 style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14pt', textTransform: 'uppercase', marginBottom: '24px' }}>
            Instrumen Asesmen Pembelajaran
          </h2>

          {/* A. ASESMEN AWAL (Diagnostik) */}
          {asesmenData.asesmen_awal && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontWeight: 'bold', fontSize: '12pt', marginBottom: '8px' }}>
                A. ASESMEN AWAL PEMBELAJARAN (Diagnostik)
              </h3>
              <p style={{ fontStyle: 'italic', fontSize: '10pt', marginBottom: '8px' }}>
                {asesmenData.asesmen_awal.deskripsi}
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong>Metode:</strong> {asesmenData.asesmen_awal.metode}
              </p>
              
              {/* Pertanyaan Pemantik - TETAP TABEL karena data tabular */}
              {asesmenData.asesmen_awal.items && asesmenData.asesmen_awal.items.length > 0 && (
                <EditableSection
                  sectionId="asesmen_awal.items"
                  sectionLabel="Pertanyaan Diagnostik"
                  currentContent={asesmenData.asesmen_awal.items}
                  onEdit={handleOpenEditor('asesmen')}
                >
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9' }}>
                      <th style={{ border: '1px solid black', padding: '8px', width: '5%' }}>No</th>
                      <th style={{ border: '1px solid black', padding: '8px', width: '55%' }}>Pertanyaan Pemantik</th>
                      <th style={{ border: '1px solid black', padding: '8px', width: '40%' }}>Tujuan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asesmenData.asesmen_awal.items.map((item, i) => (
                      <tr key={i}>
                        <td style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>{i + 1}</td>
                        <td style={{ border: '1px solid black', padding: '8px' }}>{formatRichText(item.pertanyaan)}</td>
                        <td style={{ border: '1px solid black', padding: '8px' }}>{formatRichText(item.tujuan)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </EditableSection>
              )}
            </div>
          )}

          {/* B. ASESMEN PROSES (Formatif) */}
          {asesmenData.asesmen_proses && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontWeight: 'bold', fontSize: '12pt', marginBottom: '8px' }}>
                B. ASESMEN PROSES PEMBELAJARAN (Formatif)
              </h3>
              <p style={{ fontStyle: 'italic', fontSize: '10pt', marginBottom: '8px' }}>
                {asesmenData.asesmen_proses.deskripsi}
              </p>
              <p style={{ marginBottom: '16px' }}>
                <strong>Metode:</strong> {asesmenData.asesmen_proses.metode}
              </p>

              {/* Aktivitas sebagai heading + paragraf */}
              {asesmenData.asesmen_proses.aktivitas?.map((akt, i) => (
                <div key={i} style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                    Aktivitas {i + 1}: {akt.nama}
                  </h4>
                  <p style={{ marginBottom: '8px' }}>
                    <strong>Instruksi:</strong> {formatRichText(akt.instruksi)}
                  </p>
                  {akt.pertanyaan_diskusi && akt.pertanyaan_diskusi.length > 0 && (
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Pertanyaan Diskusi:</strong>
                      <ul style={{ marginLeft: '20px', marginTop: '4px', listStyleType: 'disc' }}>
                        {akt.pertanyaan_diskusi.map((q, j) => (
                          <li key={j}>{formatRichText(q)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {akt.kunci_jawaban && akt.kunci_jawaban.length > 0 && (
                    <div>
                      <strong>Kunci Jawaban:</strong>
                      <ul style={{ marginLeft: '20px', marginTop: '4px', listStyleType: 'disc' }}>
                        {akt.kunci_jawaban.map((k, j) => (
                          <li key={j}>{formatRichText(k)}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}

              {/* Rubrik Proses - TETAP TABEL karena data tabular */}
              {asesmenData.asesmen_proses.rubrik && asesmenData.asesmen_proses.rubrik.length > 0 && (
                <EditableSection
                  sectionId="asesmen_proses.rubrik"
                  sectionLabel="Rubrik Penilaian Proses"
                  currentContent={asesmenData.asesmen_proses.rubrik}
                  onEdit={handleOpenEditor('asesmen')}
                >
                <div style={{ marginTop: '16px' }}>
                  <h4 style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                    Rubrik Penilaian Proses
                  </h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9' }}>
                        <th style={{ border: '1px solid black', padding: '8px' }}>Aspek</th>
                        <th style={{ border: '1px solid black', padding: '8px' }}>Sangat Baik (4)</th>
                        <th style={{ border: '1px solid black', padding: '8px' }}>Baik (3)</th>
                        <th style={{ border: '1px solid black', padding: '8px' }}>Cukup (2)</th>
                        <th style={{ border: '1px solid black', padding: '8px' }}>Kurang (1)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {asesmenData.asesmen_proses.rubrik.map((r, i) => (
                        <tr key={i}>
                          <td style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold' }}>{r.aspek}</td>
                          <td style={{ border: '1px solid black', padding: '8px' }}>{formatRichText(r.sangat_baik)}</td>
                          <td style={{ border: '1px solid black', padding: '8px' }}>{formatRichText(r.baik)}</td>
                          <td style={{ border: '1px solid black', padding: '8px' }}>{formatRichText(r.cukup)}</td>
                          <td style={{ border: '1px solid black', padding: '8px' }}>{formatRichText(r.kurang)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </EditableSection>
              )}

              {/* Penilaian Diri - paragraf + list */}
              {asesmenData.asesmen_proses.penilaian_diri && asesmenData.asesmen_proses.penilaian_diri.length > 0 && (
                <EditableSection
                  sectionId="asesmen_proses.penilaian_diri"
                  sectionLabel="Penilaian Diri"
                  currentContent={asesmenData.asesmen_proses.penilaian_diri}
                  onEdit={handleOpenEditor('asesmen')}
                >
                  <div style={{ marginTop: '16px' }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>📝 Penilaian Diri:</p>
                    <ul style={{ marginLeft: '20px', listStyleType: 'disc' }}>
                      {asesmenData.asesmen_proses.penilaian_diri.map((p, i) => (
                        <li key={i}>{formatRichText(p)}</li>
                      ))}
                    </ul>
                  </div>
                </EditableSection>
              )}

              {/* Penilaian Sejawat - paragraf + list */}
              {asesmenData.asesmen_proses.penilaian_sejawat && asesmenData.asesmen_proses.penilaian_sejawat.length > 0 && (
                <EditableSection
                  sectionId="asesmen_proses.penilaian_sejawat"
                  sectionLabel="Penilaian Sejawat"
                  currentContent={asesmenData.asesmen_proses.penilaian_sejawat}
                  onEdit={handleOpenEditor('asesmen')}
                >
                  <div style={{ marginTop: '12px' }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>👥 Penilaian Sejawat:</p>
                    <ul style={{ marginLeft: '20px', listStyleType: 'disc' }}>
                      {asesmenData.asesmen_proses.penilaian_sejawat.map((p, i) => (
                        <li key={i}>{formatRichText(p)}</li>
                      ))}
                    </ul>
                  </div>
                </EditableSection>
              )}
            </div>
          )}

          {/* C. ASESMEN AKHIR (Sumatif) */}
          {asesmenData.asesmen_akhir && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontWeight: 'bold', fontSize: '12pt', marginBottom: '8px' }}>
                C. ASESMEN AKHIR PEMBELAJARAN (Sumatif)
              </h3>
              <p style={{ fontStyle: 'italic', fontSize: '10pt', marginBottom: '8px' }}>
                {asesmenData.asesmen_akhir.deskripsi}
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong>Metode:</strong> {asesmenData.asesmen_akhir.metode}
              </p>
              
              {/* Soal Uraian - TETAP TABEL karena data tabular */}
              {asesmenData.asesmen_akhir.soal && asesmenData.asesmen_akhir.soal.length > 0 && (
                <EditableSection
                  sectionId="asesmen_akhir.soal"
                  sectionLabel="Soal Uraian Sumatif"
                  currentContent={asesmenData.asesmen_akhir.soal}
                  onEdit={handleOpenEditor('asesmen')}
                >
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontWeight: 'bold', marginBottom: '8px' }}>Soal Uraian</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9' }}>
                        <th style={{ border: '1px solid black', padding: '8px', width: '5%' }}>No</th>
                        <th style={{ border: '1px solid black', padding: '8px', width: '45%' }}>Pertanyaan</th>
                        <th style={{ border: '1px solid black', padding: '8px', width: '40%' }}>Kunci Jawaban</th>
                        <th style={{ border: '1px solid black', padding: '8px', width: '10%' }}>Skor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {asesmenData.asesmen_akhir.soal.map((s, i) => (
                        <tr key={i}>
                          <td style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>{s.no}</td>
                          <td style={{ border: '1px solid black', padding: '8px' }}>{formatRichText(s.pertanyaan)}</td>
                          <td style={{ border: '1px solid black', padding: '8px' }}>{formatRichText(s.kunci_jawaban)}</td>
                          <td style={{ border: '1px solid black', padding: '8px', textAlign: 'center' }}>{s.skor}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </EditableSection>
              )}

              {/* Rubrik Akhir - TETAP TABEL */}
              {asesmenData.asesmen_akhir.rubrik && asesmenData.asesmen_akhir.rubrik.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <h4 style={{ fontWeight: 'bold', marginBottom: '8px' }}>Rubrik Penilaian Akhir</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9' }}>
                        <th style={{ border: '1px solid black', padding: '8px' }}>Aspek</th>
                        <th style={{ border: '1px solid black', padding: '8px' }}>Sangat Baik (4)</th>
                        <th style={{ border: '1px solid black', padding: '8px' }}>Baik (3)</th>
                        <th style={{ border: '1px solid black', padding: '8px' }}>Cukup (2)</th>
                        <th style={{ border: '1px solid black', padding: '8px' }}>Kurang (1)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {asesmenData.asesmen_akhir.rubrik.map((r, i) => (
                        <tr key={i}>
                          <td style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold' }}>{r.aspek}</td>
                          <td style={{ border: '1px solid black', padding: '8px' }}>{formatRichText(r.sangat_baik)}</td>
                          <td style={{ border: '1px solid black', padding: '8px' }}>{formatRichText(r.baik)}</td>
                          <td style={{ border: '1px solid black', padding: '8px' }}>{formatRichText(r.cukup)}</td>
                          <td style={{ border: '1px solid black', padding: '8px' }}>{formatRichText(r.kurang)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pedoman Penskoran */}
              {asesmenData.asesmen_akhir.pedoman_penskoran && (
                <div style={{ marginTop: '16px' }}>
                  <p><strong>Pedoman Penskoran:</strong></p>
                  <p>Skor Total: {asesmenData.asesmen_akhir.pedoman_penskoran.skor_total}</p>
                  <p>Rumus Nilai: {asesmenData.asesmen_akhir.pedoman_penskoran.rumus_nilai}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: BANK SOAL - Print-oriented document layout */}
      {bankSoalData && (() => {
        // --- Local helpers (co-located; shared logic in @/lib/soal-format) ---
        const soalList = bankSoalData.daftar_soal || [];

        // Handwritten answer lines rendered as a presentational table.
        // Rationale: Word .doc collapses/ignores border-bottom on empty
        // <div>/<span> and on flex/grid layouts, but honours <td> borders
        // reliably. Inline `border:none` on the wrapper/cells overrides the
        // global `.document-preview td { border:1px solid black }` rule so
        // only the intended bottom border is visible.
        const answerLineTdStyle: React.CSSProperties = {
          border: 'none',
          borderBottom: '1px solid #555',
          height: '28px',
          lineHeight: '28px',
          padding: 0,
          verticalAlign: 'bottom',
        };
        const answerTableStyle: React.CSSProperties = {
          width: '100%',
          borderCollapse: 'collapse',
          tableLayout: 'fixed',
          marginTop: '8px',
          border: 'none',
          breakInside: 'avoid',
          pageBreakInside: 'avoid',
        };
        const renderAnswerLines = (n: number) => {
          if (n <= 0) return null;
          const rows: React.ReactNode[] = [];
          for (let i = 0; i < n; i++) {
            rows.push(
              <tr key={i}>
                <td style={answerLineTdStyle}>{'\u00A0'}</td>
              </tr>,
            );
          }
          return (
            <table role="presentation" width="100%" style={answerTableStyle}>
              <tbody>{rows}</tbody>
            </table>
          );
        };
        // Isian Singkat: label "Jawaban:" + one line on the same row, using
        // a 2-column presentational table (same reasoning as above).
        const renderIsianLine = () => (
          <table
            role="presentation"
            width="100%"
            style={{ ...answerTableStyle, marginTop: '6px' }}
          >
            <tbody>
              <tr>
                <td
                  style={{
                    border: 'none',
                    width: '75px',
                    padding: '0 8px 2px 0',
                    verticalAlign: 'bottom',
                  }}
                >
                  Jawaban:
                </td>
                <td style={{ ...answerLineTdStyle, height: '22px', lineHeight: '22px' }}>
                  {'\u00A0'}
                </td>
              </tr>
            </tbody>
          </table>
        );

        // Every question is wrapped in a block that stays together on the
        // page (screen preview + print + Word HTML). `break-inside: avoid` +
        // legacy `page-break-inside: avoid` covers all engines.
        const blockKeep: React.CSSProperties = {
          breakInside: 'avoid',
          pageBreakInside: 'avoid',
          marginBottom: '18px',
        };

        const sectionTitleStyle: React.CSSProperties = {
          fontWeight: 'bold',
          fontSize: '12pt',
          textAlign: 'center',
          marginBottom: '12px',
          breakAfter: 'avoid',
          pageBreakAfter: 'avoid',
        };

        const tableStyle: React.CSSProperties = {
          width: '100%',
          borderCollapse: 'collapse',
          border: '1px solid #000',
          marginBottom: '16px',
        };
        const thStyle: React.CSSProperties = {
          border: '1px solid #000',
          padding: '6px 8px',
          backgroundColor: '#e5e7eb',
          fontWeight: 'bold',
          textAlign: 'left',
        };
        const tdStyle: React.CSSProperties = {
          border: '1px solid #000',
          padding: '6px 8px',
          verticalAlign: 'top',
        };

        return (
        <div
          data-section="soal"
          style={{ ...getSectionStyle('soal'), pageBreakBefore: 'always', marginTop: '40px' }}
        >
          {/* Stimulus utama */}
          {bankSoalData.stimulus && (
            <div style={{ ...blockKeep, padding: '4px 0', marginBottom: '20px' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                {getStimulusInstruction(isEnglishSubject(formData.mataPelajaran), getQuestionRange(soalList, null))}
              </p>

              {onUpdateStimulusImage && includeImages ? (
                <StimulusImageGenerator
                  prompt={bankSoalData.stimulus}
                  imageUrl={bankSoalData.stimulus_image || null}
                  onImageGenerated={(url) => onUpdateStimulusImage(url)}
                  enableEnrich
                  pertanyaan={bankSoalData.stimulus}
                />
              ) : (
                bankSoalData.stimulus_image && (
                  <img
                    src={bankSoalData.stimulus_image}
                    alt="Ilustrasi stimulus"
                    style={{ maxWidth: '100%', maxHeight: '300px', marginBottom: '12px', display: 'block' }}
                  />
                )
              )}

              <p style={{ textAlign: 'justify', margin: 0 }}>{mathFormatter(bankSoalData.stimulus)}</p>
            </div>
          )}

          {/* ============ LEMBAR SOAL ============ */}
          <div data-subsection="soal-siswa">
            <h2 style={sectionTitleStyle}>LEMBAR SOAL</h2>

            {soalList.map((s: SoalItem, i: number) => {
              const group = classifySoal(s);
              const lines = computeAnswerLines(s);

              // Stimulus per-soal (multi-stimulus) — hanya render sekali di
              // soal pertama yang menunjukknya, dan diikat ke QuestionBlock
              // agar tidak terpisah dari soal.
              let stimulusBlock: React.ReactNode = null;
              if (bankSoalData.stimulus_list && s.stimulus_id) {
                const prev = i > 0 ? soalList[i - 1] : null;
                const show = !prev || prev.stimulus_id !== s.stimulus_id;
                if (show) {
                  const st = bankSoalData.stimulus_list.find((x) => x.id === s.stimulus_id);
                  if (st) {
                    stimulusBlock = (
                      <div style={{ marginBottom: '12px', ...blockKeep }}>
                        <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                          {getStimulusInstruction(isEnglishSubject(formData.mataPelajaran), getQuestionRange(soalList, s.stimulus_id))}
                        </p>
                        {onUpdateStimulusImage && includeImages ? (
                          <StimulusImageGenerator
                            prompt={st.teks}
                            imageUrl={st.image || null}
                            onImageGenerated={(url) => onUpdateStimulusImage(url, st.id)}
                            size="small"
                            enableEnrich
                            pertanyaan={st.teks}
                          />
                        ) : (
                          st.image && (
                            <img
                              src={st.image}
                              alt="Ilustrasi stimulus"
                              style={{ maxWidth: '100%', maxHeight: '250px', marginBottom: '10px', display: 'block' }}
                            />
                          )
                        )}
                        <p style={{ textAlign: 'justify', margin: 0 }}>{mathFormatter(st.teks)}</p>
                      </div>
                    );
                  }
                }
              }

              return (
                <div key={i} style={blockKeep}>
                  {stimulusBlock}

                  {/* Nomor bold + stem regular (bukan seluruh <p> bold) */}
                  <p style={{ margin: '0 0 6px 0', fontWeight: 'normal' }}>
                    <span style={{ fontWeight: 'bold' }}>{s.no}.</span>{' '}
                    <span style={{ fontWeight: 'normal' }}>{mathFormatter(s.pertanyaan)}</span>
                  </p>

                  {/* Gambar per-soal jika ditandai */}
                  {(s.requires_image || s.stimulus_image) && (
                    onUpdateSoalImage && includeImages ? (
                      <StimulusImageGenerator
                        prompt={s.stimulus_image_prompt || s.pertanyaan || ''}
                        imageUrl={s.stimulus_image || null}
                        onImageGenerated={(url) => onUpdateSoalImage(url, i)}
                        size="small"
                        enableEnrich
                        pertanyaan={s.pertanyaan}
                      />
                    ) : (
                      s.stimulus_image && (
                        <img
                          src={s.stimulus_image}
                          alt={`Ilustrasi soal ${s.no}`}
                          style={{ maxWidth: '100%', maxHeight: '250px', margin: '6px 0', display: 'block' }}
                        />
                      )
                    )
                  )}

                  {/* Pilihan Ganda */}
                  {group === 'pg' && s.opsi && s.opsi.length > 0 && (
                    <div style={{ marginLeft: '20px', marginTop: '4px' }}>
                      {s.opsi.map((opt, j) => {
                        const huruf = String.fromCharCode(65 + j);
                        const optText = opt.replace(/^[A-E]\.\s*/i, '');
                        return (
                          <p key={j} style={{ margin: '2px 0', fontWeight: 'normal' }}>
                            {huruf}. {mathFormatter(optText)}
                          </p>
                        );
                      })}
                    </div>
                  )}

                  {/* PG Kategori Benar/Salah */}
                  {group === 'complex' && s.pernyataan_benar_salah && s.pernyataan_benar_salah.length > 0 && (
                    <table style={{ ...tableStyle, width: '95%', marginLeft: '20px', marginTop: '6px' }}>
                      <thead>
                        <tr>
                          <th style={{ ...thStyle, width: '40px', textAlign: 'center' }}>No</th>
                          <th style={thStyle}>Pernyataan</th>
                          <th style={{ ...thStyle, width: '60px', textAlign: 'center' }}>Benar</th>
                          <th style={{ ...thStyle, width: '60px', textAlign: 'center' }}>Salah</th>
                        </tr>
                      </thead>
                      <tbody>
                        {s.pernyataan_benar_salah.map((p: PernyataanBenarSalah, idx: number) => (
                          <tr key={idx} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>{idx + 1}</td>
                            <td style={tdStyle}>{mathFormatter(p.pernyataan)}</td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>○</td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>○</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  {/* PG Multiple Choice Multiple Answer */}
                  {group === 'complex' && s.opsi && s.opsi.length > 0 && (
                    <div style={{ marginLeft: '20px', marginTop: '4px' }}>
                      {s.opsi.map((opt, j) => {
                        const huruf = String.fromCharCode(65 + j);
                        const optText = opt.replace(/^[A-E0-9]\.\s*/i, '');
                        return (
                          <p key={j} style={{ margin: '2px 0', fontWeight: 'normal' }}>
                            <span style={{ marginRight: '8px' }}>&#9744;</span>
                            {huruf}. {mathFormatter(optText)}
                          </p>
                        );
                      })}
                    </div>
                  )}

                  {/* Menjodohkan */}
                  {group === 'menjodohkan' && s.premis && s.premis.length > 0 && s.respon && s.respon.length > 0 && (
                    <table style={{ width: '95%', borderCollapse: 'collapse', marginLeft: '20px', marginTop: '6px' }}>
                      <tbody>
                        <tr>
                          <td style={{ width: '50%', verticalAlign: 'top', padding: '4px 8px' }}>
                            <p style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>Premis</p>
                            <ol style={{ margin: 0, paddingLeft: '20px', listStyleType: 'decimal' }}>
                              {s.premis.map((p, idx) => {
                                const t = p.replace(/^\d+\.\s*/i, '');
                                return <li key={idx} style={{ margin: '2px 0' }}>{mathFormatter(t)}</li>;
                              })}
                            </ol>
                          </td>
                          <td style={{ width: '50%', verticalAlign: 'top', padding: '4px 8px' }}>
                            <p style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>Respon</p>
                            <ol style={{ margin: 0, paddingLeft: '20px', listStyleType: 'upper-alpha' }}>
                              {s.respon.map((r, idx) => {
                                const t = r.replace(/^[A-Z]\.\s*/i, '');
                                return <li key={idx} style={{ margin: '2px 0' }}>{mathFormatter(t)}</li>;
                              })}
                            </ol>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  )}

                  {/* Isian Singkat — label + garis dalam tabel presentasional */}
                  {group === 'isian' && (
                    <div style={{ marginLeft: '20px' }}>{renderIsianLine()}</div>
                  )}

                  {/* Uraian — garis jawaban adaptif (tabel presentasional) */}
                  {group === 'uraian' && (
                    <div style={{ marginLeft: '20px' }}>{renderAnswerLines(lines)}</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ============ PAGE BREAK ============ */}
          <div style={{ pageBreakBefore: 'always', breakBefore: 'page' }} />

          {/* ============ KISI-KISI / ANALISIS BUTIR SOAL ============ */}
          <div data-subsection="soal-kisi" style={{ marginTop: '24px' }}>
            <h2 style={sectionTitleStyle}>KISI-KISI / ANALISIS BUTIR SOAL</h2>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: '6%', textAlign: 'center' }}>No</th>
                  <th style={{ ...thStyle, width: '22%' }}>Tipe Soal</th>
                  <th style={{ ...thStyle, width: '14%' }}>Level Kognitif</th>
                  <th style={thStyle}>Indikator Soal</th>
                  <th style={{ ...thStyle, width: '8%', textAlign: 'center' }}>Skor</th>
                </tr>
              </thead>
              <tbody>
                {soalList.map((s: SoalItem, i: number) => (
                  <tr key={i} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{s.no}</td>
                    <td style={tdStyle}>{s.tipe}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{s.level_kognitif || '-'}</td>
                    <td style={tdStyle}>{s.indikator_soal || '-'}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{s.skor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ============ KUNCI JAWABAN & PEMBAHASAN ============ */}
          <div data-subsection="soal-guru" style={{ marginTop: '24px' }}>
            <h2 style={sectionTitleStyle}>KUNCI JAWABAN DAN PEMBAHASAN</h2>
            <p style={{ fontSize: '10pt', color: '#4b5563', margin: '0 0 12px 0', textAlign: 'center' }}>
              (Dokumen ini adalah pegangan guru, tidak untuk dibagikan kepada siswa)
            </p>

            {/* --- Kunci Objektif (Pilihan Ganda) --- */}
            {soalList.some((s) => classifySoal(s) === 'pg') && (
              <div style={{ marginBottom: '16px', ...blockKeep }}>
                <h3 style={{ fontWeight: 'bold', margin: '0 0 6px 0' }}>Pilihan Ganda</h3>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, width: '10%', textAlign: 'center' }}>No</th>
                      <th style={{ ...thStyle, width: '20%', textAlign: 'center' }}>Kunci</th>
                      <th style={thStyle}>Pembahasan</th>
                      <th style={{ ...thStyle, width: '10%', textAlign: 'center' }}>Skor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {soalList.filter((s) => classifySoal(s) === 'pg').map((s, i) => (
                      <tr key={i} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>{s.no}</td>
                        <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold' }}>
                          {Array.isArray(s.kunci) ? s.kunci.join(', ') : String(s.kunci ?? '')}
                        </td>
                        <td style={tdStyle}>{s.pembahasan ? mathFormatter(s.pembahasan) : '-'}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>{s.skor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* --- Kunci Kompleks (BS / MCMA / Kategori) --- */}
            {soalList.some((s) => classifySoal(s) === 'complex') && (
              <div style={{ marginBottom: '16px', ...blockKeep }}>
                <h3 style={{ fontWeight: 'bold', margin: '0 0 6px 0' }}>Pilihan Ganda Kompleks / Benar-Salah</h3>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, width: '8%', textAlign: 'center' }}>No</th>
                      <th style={{ ...thStyle, width: '32%' }}>Kunci / Pernyataan Benar</th>
                      <th style={thStyle}>Pembahasan Singkat</th>
                      <th style={{ ...thStyle, width: '8%', textAlign: 'center' }}>Skor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {soalList.filter((s) => classifySoal(s) === 'complex').map((s, i) => {
                      // Kalau BS, tampilkan daftar pernyataan + jawaban Benar/Salah
                      let kunciNode: React.ReactNode;
                      if (s.pernyataan_benar_salah && s.pernyataan_benar_salah.length > 0) {
                        kunciNode = (
                          <ol style={{ margin: 0, paddingLeft: '20px' }}>
                            {s.pernyataan_benar_salah.map((p, j) => (
                              <li key={j} style={{ margin: '2px 0' }}>
                                {mathFormatter(p.pernyataan)}{' — '}
                                <strong>{p.jawaban}</strong>
                              </li>
                            ))}
                          </ol>
                        );
                      } else if (Array.isArray(s.kunci)) {
                        kunciNode = (
                          <ul style={{ margin: 0, paddingLeft: '20px' }}>
                            {s.kunci.map((k, j) => (
                              <li key={j} style={{ margin: '2px 0' }}>{String(k)}</li>
                            ))}
                          </ul>
                        );
                      } else {
                        kunciNode = <span style={{ fontWeight: 'bold' }}>{String(s.kunci ?? '')}</span>;
                      }
                      return (
                        <tr key={i} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>{s.no}</td>
                          <td style={tdStyle}>{kunciNode}</td>
                          <td style={tdStyle}>{s.pembahasan ? mathFormatter(s.pembahasan) : '-'}</td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>{s.skor}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* --- Kunci Menjodohkan --- */}
            {soalList.some((s) => classifySoal(s) === 'menjodohkan') && (
              <div style={{ marginBottom: '16px', ...blockKeep }}>
                <h3 style={{ fontWeight: 'bold', margin: '0 0 6px 0' }}>Menjodohkan</h3>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, width: '8%', textAlign: 'center' }}>No</th>
                      <th style={thStyle}>Pasangan yang Benar</th>
                      <th style={{ ...thStyle, width: '10%', textAlign: 'center' }}>Skor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {soalList.filter((s) => classifySoal(s) === 'menjodohkan').map((s, i) => {
                      const premis = s.premis || [];
                      const respon = s.respon || [];
                      const pairs = premis.map((p, idx) => ({
                        p: p.replace(/^\d+\.\s*/i, ''),
                        r: (respon[idx] || '').replace(/^[A-Z]\.\s*/i, ''),
                      }));
                      return (
                        <tr key={i} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>{s.no}</td>
                          <td style={tdStyle}>
                            <ol style={{ margin: 0, paddingLeft: '20px' }}>
                              {pairs.map((pr, j) => (
                                <li key={j} style={{ margin: '2px 0' }}>
                                  {mathFormatter(pr.p)} <strong>→</strong> {mathFormatter(pr.r)}
                                </li>
                              ))}
                            </ol>
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>{s.skor}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* --- Kunci Isian Singkat --- */}
            {soalList.some((s) => classifySoal(s) === 'isian') && (
              <div style={{ marginBottom: '16px', ...blockKeep }}>
                <h3 style={{ fontWeight: 'bold', margin: '0 0 6px 0' }}>Isian Singkat</h3>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, width: '8%', textAlign: 'center' }}>No</th>
                      <th style={{ ...thStyle, width: '30%' }}>Jawaban yang Diterima</th>
                      <th style={thStyle}>Pembahasan Singkat</th>
                      <th style={{ ...thStyle, width: '8%', textAlign: 'center' }}>Skor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {soalList.filter((s) => classifySoal(s) === 'isian').map((s, i) => {
                      const alts = parseAlternatifJawaban(s.kunci);
                      return (
                        <tr key={i} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>{s.no}</td>
                          <td style={tdStyle}>
                            {alts.length > 1 ? (
                              <ul style={{ margin: 0, paddingLeft: '18px' }}>
                                {alts.map((a, j) => (
                                  <li key={j} style={{ margin: '2px 0' }}>{mathFormatter(a)}</li>
                                ))}
                              </ul>
                            ) : (
                              <span style={{ fontWeight: 'bold' }}>{mathFormatter(alts[0] || '-')}</span>
                            )}
                          </td>
                          <td style={tdStyle}>{s.pembahasan ? mathFormatter(s.pembahasan) : '-'}</td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>{s.skor}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* --- Kunci Uraian (blok vertikal per nomor) --- */}
            {soalList.some((s) => classifySoal(s) === 'uraian') && (
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ fontWeight: 'bold', margin: '0 0 8px 0' }}>Uraian</h3>
                {soalList.filter((s) => classifySoal(s) === 'uraian').map((s, i) => {
                  const kunciStr = Array.isArray(s.kunci) ? s.kunci.join('\n') : String(s.kunci ?? '');
                  return (
                    <div
                      key={i}
                      style={{
                        ...blockKeep,
                        border: '1px solid #000',
                        padding: '10px 12px',
                        marginBottom: '10px',
                      }}
                    >
                      <p style={{ margin: '0 0 6px 0', fontWeight: 'bold' }}>Nomor {s.no}</p>
                      <p style={{ margin: '4px 0 2px 0', fontWeight: 'bold' }}>Jawaban ideal:</p>
                      <div style={{ margin: '0 0 6px 0', whiteSpace: 'pre-wrap' }}>
                        {kunciStr ? mathFormatter(kunciStr) : '-'}
                      </div>
                      {s.pembahasan && (
                        <>
                          <p style={{ margin: '4px 0 2px 0', fontWeight: 'bold' }}>Pembahasan:</p>
                          <div style={{ margin: '0 0 6px 0' }}>{mathFormatter(s.pembahasan)}</div>
                        </>
                      )}
                      <p style={{ margin: '4px 0 0 0' }}>
                        <span style={{ fontWeight: 'bold' }}>Skor maksimal:</span> {s.skor}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ============ PEDOMAN PENILAIAN ============ */}
          {bankSoalData.pedoman_penilaian && (
            <div style={{ marginTop: '20px', padding: '12px', border: '1px solid #000', ...blockKeep }}>
              <h3 style={{ fontWeight: 'bold', margin: '0 0 8px 0' }}>Pedoman Penilaian</h3>
              <p style={{ margin: '2px 0' }}>
                <span style={{ fontWeight: 'bold' }}>Skor Maksimal:</span>{' '}
                {bankSoalData.pedoman_penilaian.skor_maksimal}
              </p>
              <p style={{ margin: '2px 0' }}>
                <span style={{ fontWeight: 'bold' }}>Rumus Nilai:</span>{' '}
                {bankSoalData.pedoman_penilaian.rumus}
              </p>
            </div>
          )}
        </div>
        );
      })()}


      {/* TAB CONTENT: MATERI - Natural Document Format */}
      {materiData && (
        <div
          data-section="materi"
          style={{ ...getSectionStyle('materi'), pageBreakBefore: 'always', marginTop: '40px' }}
        >
          {/* Page Break - using div for compatibility */}
          <div style={{ pageBreakBefore: 'always' }} />
          
          {/* 1. HEADER - Natural heading */}
          <h2 style={{ 
            textAlign: 'center', 
            fontWeight: 'bold', 
            fontSize: '18pt', 
            color: '#CC5526',
            textTransform: 'uppercase',
            marginBottom: '24px'
          }}>
            📚 {materiData.judul_materi}
          </h2>
          
          {/* Header image ilustrasi */}
          {onUpdateMateriImage && includeImages ? (
            <div style={{ float: 'right', marginLeft: '16px', marginBottom: '16px', width: '300px' }}>
              <StimulusImageGenerator
                prompt={`${materiData.judul_materi}: ${materiData.pendahuluan?.slice(0, 150) || ''}`}
                imageUrl={materiData.header_image || null}
                onImageGenerated={(url) => onUpdateMateriImage(url, -1, true)}
                size="small"
              />
            </div>
          ) : (
            materiData.header_image && (
              <img
                src={materiData.header_image}
                alt="Ilustrasi materi"
                style={{
                  maxWidth: '300px',
                  float: 'right',
                  marginLeft: '16px',
                  marginBottom: '16px',
                  width: '33%',
                }}
              />
            )
          )}

          
          {/* Legacy ilustrasi jika ada */}
          {generatedImage && !materiData.header_image && (
            <img
              src={generatedImage}
              alt="Ilustrasi"
              style={{
                maxWidth: '300px',
                float: 'right',
                marginLeft: '16px',
                marginBottom: '16px',
                width: '33%'
              }}
            />
          )}
          
          {/* 2. PENDAHULUAN - Natural heading + paragraph */}
          <EditableSection
            sectionId="pendahuluan"
            sectionLabel="Pendahuluan Materi"
            currentContent={materiData.pendahuluan}
            onEdit={handleOpenEditor('materi')}
          >
          <h3 style={{ fontWeight: 'bold', fontSize: '14pt', marginBottom: '8px' }}>
            📖 Pendahuluan
          </h3>
          <p style={{ textAlign: 'left', lineHeight: '1.8', marginBottom: '24px' }}>
            {mathFormatter(materiData.pendahuluan)}
          </p>
          </EditableSection>
          
          {/* 3. ISI MATERI - Modern Learning Module v2 with Visual Chunking */}
          {materiData.isi_materi.map((sec, i) => (
            <EditableSection
              key={`edit-materi-${i}`}
              sectionId={`isi_materi.${i}`}
              sectionLabel={`Sub-bab: ${sec.sub_judul}`}
              currentContent={sec}
              onEdit={handleOpenEditor('materi')}
            >
            <div style={{ 
              border: '1px solid #E5E7EB', 
              borderRadius: '8px', 
              padding: '16px', 
              marginBottom: '20px' 
            }}>
              {/* Card Header with Badge Number */}
              <div style={{ 
                marginBottom: '12px',
                paddingBottom: '8px',
                borderBottom: '2px solid #CC5526',
                display: 'flex',
                alignItems: 'center'
              }}>
                <span style={{
                  display: 'inline-block',
                  backgroundColor: '#CC5526',
                  color: 'white',
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  textAlign: 'center',
                  lineHeight: '24px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  marginRight: '8px',
                  flexShrink: 0,
                }}>
                  {i + 1}
                </span>
                <span style={{ 
                  color: '#CC5526', 
                  fontWeight: 'bold', 
                  fontSize: '13pt' 
                }}>
                  {sec.sub_judul}
                </span>
              </div>
              
              {/* Image per sub-bab */}
              {onUpdateMateriImage && includeImages && i < 4 ? (
                <div style={{ float: 'left', marginRight: '12px', marginBottom: '8px', maxWidth: '200px' }}>
                  <StimulusImageGenerator
                    prompt={`${sec.sub_judul}: ${(sec.penjelasan_detail || sec.uraian || '').slice(0, 100)}`}
                    imageUrl={sec.image || null}
                    onImageGenerated={(url) => onUpdateMateriImage(url, i, false)}
                    size="small"
                  />
                </div>
              ) : (
                sec.image && (
                  <img
                    src={sec.image}
                    alt={`Ilustrasi ${sec.sub_judul}`}
                    style={{ maxWidth: '200px', float: 'left', marginRight: '12px', marginBottom: '8px' }}
                  />
                )
              )}


              {/* NEW LAYOUT: Check for new granular fields */}
              {sec.poin_utama ? (
                <>
                  {/* Highlight Box - Poin Utama with Left Border Accent */}
                  <div style={{ 
                    borderLeft: '4px solid #CC5526',
                    backgroundColor: '#FFF7ED', 
                    padding: '12px 14px', 
                    marginBottom: '12px',
                    borderRadius: '0 6px 6px 0'
                  }}>
                    <span style={{ fontWeight: '600', fontSize: '11pt' }}>
                      🎯 {mathFormatter(sec.poin_utama)}
                    </span>
                  </div>

                  {/* Penjelasan Detail - supports HTML from AI */}
                  <div 
                    style={{ textAlign: 'left', lineHeight: '1.8', marginBottom: '12px' }}
                    dangerouslySetInnerHTML={{ __html: formatMathAndHtml(sec.penjelasan_detail) }}
                  />

                  {/* Example Box - Contoh Konkret / Bedah Teks */}
                  {sec.contoh_konkret && (
                    <div style={{ 
                      backgroundColor: '#F3F4F6', 
                      padding: '12px 14px', 
                      marginBottom: '8px',
                      borderRadius: '6px',
                    }}>
                      <div style={{ fontWeight: '600', marginBottom: '6px' }}>
                        {sec.sub_judul?.toLowerCase().includes('model teks') ? '🔍 Analisis Struktur:' : '📝 Bedah Contoh:'}
                      </div>
                      <div 
                        style={{ lineHeight: '1.7' }}
                        dangerouslySetInnerHTML={{ __html: formatMathAndHtml(sec.contoh_konkret) }}
                      />
                    </div>
                  )}

                  {/* Istilah Penting Badge */}
                  {sec.istilah_penting && (
                    <div style={{ marginTop: '8px' }}>
                      <span style={{ 
                        display: 'inline-block',
                        backgroundColor: '#FEFCE8', 
                        padding: '4px 10px', 
                        borderRadius: '12px',
                        fontSize: '10pt',
                        fontWeight: '600'
                      }}>
                        🔑 {sec.istilah_penting}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                /* LEGACY LAYOUT: backward compat for old data with only uraian */
                <p style={{ textAlign: 'left', lineHeight: '1.8' }}>
                  {mathFormatter(sec.uraian)}
                </p>
              )}
              
              <div style={{ clear: 'both' }} />
            </div>
            </EditableSection>
          ))}
          
          {/* 4. FAKTA UNIK - Natural heading + highlighted paragraph */}
          {materiData.fakta_unik && (
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ fontWeight: 'bold', fontSize: '14pt', marginBottom: '8px' }}>
                💡 Tahukah Kamu?
              </h3>
              <p style={{ textAlign: 'left', lineHeight: '1.8', backgroundColor: '#FEFCE8', padding: '12px' }}>
                {mathFormatter(materiData.fakta_unik)}
              </p>
            </div>
          )}
          
          {/* 5. GLOSARIUM - TETAP TABEL karena data tabular 2 kolom */}
          {materiData.glosarium && materiData.glosarium.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ fontWeight: 'bold', fontSize: '14pt', marginBottom: '12px' }}>
                📖 Glosarium
              </h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #E5E7EB' }}>
                <thead>
                  <tr style={{ backgroundColor: '#F3F4F6' }}>
                    <th style={{ border: '1px solid #E5E7EB', padding: '8px', textAlign: 'left', width: '30%' }}>Istilah</th>
                    <th style={{ border: '1px solid #E5E7EB', padding: '8px', textAlign: 'left' }}>Definisi</th>
                  </tr>
                </thead>
                <tbody>
                  {materiData.glosarium.map((g: { istilah: string; definisi: string }, i: number) => (
                    <tr key={i}>
                      <td style={{ border: '1px solid #E5E7EB', padding: '8px', fontWeight: 'bold' }}>
                        {g.istilah}
                      </td>
                      <td style={{ border: '1px solid #E5E7EB', padding: '8px' }}>
                        {g.definisi}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* 6. REFERENSI - Natural heading + list */}
          {materiData.referensi && materiData.referensi.length > 0 && (
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ fontWeight: 'bold', fontSize: '11pt', marginBottom: '8px' }}>
                📚 Referensi
              </h3>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '10pt' }}>
                {materiData.referensi.map((r: string, i: number) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: TINDAK LANJUT */}
      {tindakLanjutData && (
        <div
          data-section="tindakLanjut"
          style={{ ...getSectionStyle('tindakLanjut'), pageBreakBefore: 'always', marginTop: '40px' }}
        >
          <h2 style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14pt', marginBottom: '20px', textTransform: 'uppercase' }}>Refleksi & Tindak Lanjut</h2>
          <EditableSection
            sectionId="remedial"
            sectionLabel="Remedial"
            currentContent={tindakLanjutData.remedial}
            onEdit={handleOpenEditor('tindakLanjut')}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black', marginBottom: '16px' }}>
              <thead>
                <tr style={{ backgroundColor: '#fecaca' }}>
                  <th style={{ border: '1px solid black', padding: '12px' }}>Remedial</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid black', padding: '16px', verticalAlign: 'top' }}>
                    {formatRichText(tindakLanjutData.remedial)}
                  </td>
                </tr>
              </tbody>
            </table>
          </EditableSection>
          <EditableSection
            sectionId="pengayaan"
            sectionLabel="Pengayaan"
            currentContent={tindakLanjutData.pengayaan}
            onEdit={handleOpenEditor('tindakLanjut')}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black' }}>
              <thead>
                <tr style={{ backgroundColor: '#d1fae5' }}>
                  <th style={{ border: '1px solid black', padding: '12px' }}>Pengayaan</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid black', padding: '16px', verticalAlign: 'top' }}>
                    {formatRichText(tindakLanjutData.pengayaan)}
                  </td>
                </tr>
              </tbody>
            </table>
          </EditableSection>
        </div>
      )}

      {/* Section Editor Sheet */}
      {onUpdateSection && (
        <SectionEditor
          isOpen={editorOpen}
          onClose={() => setEditorOpen(false)}
          sectionId={editingSectionId}
          sectionLabel={editingSectionLabel}
          currentContent={editingSectionContent}
          onSave={handleSaveSection}
          formContext={formContext}
        />
      )}
    </div>
  );
};
