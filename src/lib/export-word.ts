import type { FormData, ProtaData, ProsemData, KKTPData } from "@/types/modul";
import { generateExportFilename } from '@/lib/export-filename';
import { BULAN_NAMES } from "./constants";

export const exportProtaToWord = (protaData: ProtaData, formData: Partial<FormData>, returnBlob: boolean = false): Blob | boolean => {
  if (!protaData) return false;

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
      <p style="text-align:center">${formData.mataPelajaran || ''} | ${formData.kelas || ''} | Fase ${formData.fase || ''}</p>
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
    
    if (returnBlob) return blob;
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = generateExportFilename({
      documentType: 'Prota',
      mapel: formData.mataPelajaran || 'Mapel',
      kelas: formData.kelas || '',
      extension: 'doc'
    });
    link.click();
    return true;
  } catch (err) {
    console.error('Prota export error:', err);
    throw err;
  }
};

export const exportProsemToWord = (data: ProsemData, formData: Partial<FormData>, semester: 1 | 2, returnBlob: boolean = false): Blob | boolean => {
  if (!data) return false;

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
        return `<td style="${cellStyle};text-align:center;background:${cell?.hasActivity ? '#E6F4F1' : 'transparent'}">${cell?.hasActivity ? (cell.jp || 'v') : ''}</td>`;
      }).join('');

      return `<tr>
        <td style="${cellStyle};text-align:center">${row.no}</td>
        <td style="${cellStyle}">${row.tujuan_pembelajaran}</td>
        <td style="${cellStyle}">${row.materi_pokok}</td>
        <td style="${cellStyle};text-align:center">${row.alokasi_jp}</td>
        ${weekCells}
      </tr>`;
    }).join('');

    const contentHTML = `
      <h1 style="text-align:center;font-size:16pt">PROGRAM SEMESTER ${semester}</h1>
      <p style="text-align:center">${formData.sekolah || ''}</p>
      <p style="text-align:center">${formData.mataPelajaran || ''} | ${formData.kelas || ''} | Fase ${formData.fase || ''}</p>
      <br/>
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <th rowspan="2" style="${headerStyle};width:3%">No</th>
          <th rowspan="2" style="${headerStyle};width:25%">Tujuan Pembelajaran</th>
          <th rowspan="2" style="${headerStyle};width:20%">Materi Pokok</th>
          <th rowspan="2" style="${headerStyle};width:5%">JP</th>
          ${monthHeaders}
        </tr>
        <tr>
          ${weekHeaders}
        </tr>
        ${tpRows}
      </table>
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

    // A4 Landscape layout
    const preHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>Program Semester</title>
<style>
@page WordSection1 {
    size: 841.9pt 595.3pt; /* A4 Landscape */
    mso-page-orientation: landscape;
    margin: 36.0pt 36.0pt 36.0pt 36.0pt;
}
div.WordSection1 { page: WordSection1; }
body{font-family:'Arial',sans-serif;font-size:10pt;line-height:1.3}
table{width:100%;border-collapse:collapse;margin-bottom:16px}
h1{font-size:14pt;font-weight:bold;margin:10px 0}
</style>
</head>
<body>
<div class="WordSection1">`;

    const blob = new Blob(['\ufeff', preHtml + contentHTML + '</div></body></html>'], {
      type: 'application/msword',
    });
    
    if (returnBlob) return blob;
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = generateExportFilename({
      documentType: 'Prosem',
      semester: semester,
      mapel: formData.mataPelajaran || 'Mapel',
      kelas: formData.kelas || '',
      extension: 'doc'
    });
    link.click();
    return true;
  } catch (err) {
    console.error('Prosem export error:', err);
    throw err;
  }
};

export const exportKktpToWord = (
  kktpData: KKTPData,
  formData: { mataPelajaran?: string; fase?: string; kelas?: string; namaPenyusun?: string; nipPenyusun?: string; kepalaSekolah?: string; nipKepalaSekolah?: string }
): void => {
  if (!kktpData?.kktp?.length) return;

  const hs = 'background:#0D7C8F;color:white;font-weight:bold;padding:8px;border:1px solid #333;text-align:center;font-size:9.5pt';
  const cs = 'border:1px solid #ccc;padding:7px;vertical-align:top;font-size:9pt;line-height:1.4';

  const buildTpBlock = (item: KKTPData['kktp'][0]) => `
    <div style="margin-bottom:28px;page-break-inside:avoid">
      <div style="background:#1a1a1a;color:white;font-weight:bold;padding:8px 12px;font-size:10pt;border-radius:4px 4px 0 0">
        TP ${item.no}
      </div>
      <div style="background:#f5f5f5;padding:8px 12px;border:1px solid #ccc;border-top:none;font-size:9.5pt;margin-bottom:6px">
        ${item.tujuan_pembelajaran}
      </div>
      <table style="width:100%;border-collapse:collapse;margin-top:0">
        <tr>
          <th style="${hs};width:22%">Indikator</th>
          <th style="${hs};width:19.5%">Belum Berkembang</th>
          <th style="${hs};width:19.5%">Mulai Berkembang</th>
          <th style="${hs};width:19.5%">Berkembang Sesuai Harapan</th>
          <th style="${hs};width:19.5%;background:#1a8a3c">Sangat Berkembang</th>
        </tr>
        ${(item.indikator || []).map(ind => `
          <tr>
            <td style="${cs};font-weight:500">${ind.no_indikator}. ${ind.indikator}</td>
            <td style="${cs}">${ind.belum_berkembang || '-'}</td>
            <td style="${cs}">${ind.mulai_berkembang || '-'}</td>
            <td style="${cs}">${ind.berkembang_sesuai_harapan || '-'}</td>
            <td style="${cs}">${ind.sangat_berkembang || '-'}</td>
          </tr>
        `).join('')}
      </table>
    </div>
  `;

  const signature = `
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

  const contentHTML = `
    <h1 style="text-align:center;font-size:15pt;margin-bottom:4px">KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)</h1>
    <p style="text-align:center;font-size:10pt;margin-bottom:16px">
      ${formData.mataPelajaran || ''} | Kelas ${formData.kelas || ''} | Fase ${formData.fase || ''}
    </p>
    ${kktpData.kktp.map(buildTpBlock).join('')}
    ${signature}
  `;

  const preHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>KKTP</title><style>
body{font-family:'Arial',sans-serif;font-size:10pt;line-height:1.4}
table{width:100%;border-collapse:collapse;margin-bottom:8px}
td,th{border:1px solid #ccc;padding:7px;vertical-align:top}
h1{font-size:15pt;font-weight:bold;margin:8px 0}
</style></head><body>`;

  const blob = new Blob(['\ufeff', preHtml + contentHTML + '</body></html>'], {
    type: 'application/msword',
  });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `KKTP_${(formData.mataPelajaran || 'Mapel').replace(/\s+/g, '_')}_Kelas${formData.kelas || ''}.doc`;
  link.click();
};
