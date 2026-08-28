/**
 * Real OOXML DOCX export for Bank Soal (Naskah Soal + Kisi-kisi + Kunci + Pembahasan).
 *
 * Pipeline:
 *   1. Build a Document via `docx`, inserting unique textual markers
 *      (`__MATH_N__`) at every math position.
 *   2. Pack to a Blob (real .docx zip).
 *   3. Open the zip with JSZip, read `word/document.xml`, ensure the
 *      `xmlns:m` math namespace on `<w:document>`, and REPLACE each marker's
 *      containing `<w:r>` with the equivalent OMML fragment
 *      (`<m:oMath>` / `<m:oMathPara>`).
 *   4. Re-zip and hand back a proper Word 2007+ DOCX blob.
 *
 * Layout mirrors DocumentPreview (Naskah Soal → Kisi-kisi → Kunci per
 * jenis → Pedoman) using shared helpers in @/lib/soal-format.
 *
 * OMML pipeline (LaTeX → Temml → mathml2omml → string substitution) is NOT
 * changed.
 */
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  PageBreak,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  
} from 'docx';
import JSZip from 'jszip';
import temml from 'temml';
import { mml2omml } from 'mathml2omml';
import type { BankSoalData, FormData as ModulFormData, SoalItem } from '@/types/modul';
import { classifySoal, computeAnswerLines, parseAlternatifJawaban } from '@/lib/soal-format';
import { generateExportFilename } from '@/lib/export-filename';

const MATH_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/math';

// -------- LaTeX → OMML --------

function latexToOmml(latex: string, display: boolean): string | null {
  try {
    const mml = temml.renderToString(latex, {
      displayMode: display,
      throwOnError: false,
      annotate: false,
      xml: true,
    });
    if (!mml) return null;
    let omml = mml2omml(mml);
    if (!omml) return null;
    if (!/xmlns:m=/.test(omml)) {
      omml = omml.replace(/^<m:oMath\b/, `<m:oMath xmlns:m="${MATH_NS}"`);
    }
    if (display) {
      omml = `<m:oMathPara xmlns:m="${MATH_NS}">${omml}</m:oMathPara>`;
    }
    return omml;
  } catch (err) {
    console.warn('[soal-docx] latexToOmml failed for:', latex, err);
    return null;
  }
}

// -------- Legacy-LaTeX normalizer --------

const LATEX_TOKEN_RE =
  /\\(?:frac|sqrt|int|iint|iiint|oint|lim|sum|prod|sin|cos|tan|sec|csc|cot|log|ln|exp|infty|to|pm|mp|leq|geq|neq|approx|equiv|cdot|times|div|pi|theta|alpha|beta|gamma|delta|omega|lambda|mu|sigma|phi|Rightarrow|Leftrightarrow|left|right|partial|nabla)\b|[A-Za-z0-9)\]}]\^\{[^}]*\}|[A-Za-z0-9)\]}]_\{[^}]*\}|[A-Za-z0-9)\]}]\^[0-9A-Za-z]/;

function normalizeLegacyLatex(input: string): string {
  const s = input ?? '';
  if (!s) return s;
  if (/\\\(|\\\[|\\\)|\\\]|\$\$|(?:^|[^\\])\$[^$\n]+\$/.test(s)) return s;
  if (!LATEX_TOKEN_RE.test(s)) return s;

  const words = (s.match(/[A-Za-z\u00C0-\u024F]{4,}/g) || []).length;
  if (s.length <= 90 || words < 4) {
    return '\\(' + s.trim() + '\\)';
  }
  const tokens = s.split(/(\s+)/);
  const out: string[] = [];
  let buf: string[] = [];
  const flush = () => {
    if (!buf.length) return;
    const joined = buf.join('').trim();
    if (joined) out.push('\\(' + joined + '\\)');
    buf = [];
  };
  const isMathish = (t: string) =>
    LATEX_TOKEN_RE.test(t) ||
    (/^[+\-*/=()0-9a-zA-Z^_{}\\.,]+$/.test(t) && /[\\^_{}]/.test(t));
  for (const t of tokens) {
    if (/^\s+$/.test(t)) {
      if (buf.length) buf.push(t);
      else out.push(t);
      continue;
    }
    if (isMathish(t)) {
      buf.push(t);
    } else {
      flush();
      out.push(t);
    }
  }
  flush();
  return out.join('');
}

// -------- Segmenter --------

interface Seg {
  type: 'text' | 'math';
  value: string;
  display?: boolean;
}

function segmentText(input: string): Seg[] {
  const s = normalizeLegacyLatex(input || '');
  const segs: Seg[] = [];
  const re =
    /\\\[([\s\S]+?)\\\]|\$\$([\s\S]+?)\$\$|\\\(([\s\S]+?)\\\)|(?:^|[^$])\$([^$\n]+?)\$/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    const full = m[0];
    let start = m.index;
    if (m[4] !== undefined && !full.startsWith('$')) {
      start += 1;
    }
    if (start > last) segs.push({ type: 'text', value: s.slice(last, start) });
    const disp = m[1] !== undefined || m[2] !== undefined;
    const val = m[1] ?? m[2] ?? m[3] ?? m[4] ?? '';
    segs.push({ type: 'math', value: val, display: disp });
    last = m.index + full.length;
  }
  if (last < s.length) segs.push({ type: 'text', value: s.slice(last) });
  return segs;
}

// -------- Runs with markers --------

interface RunOpts {
  bold?: boolean;
  italics?: boolean;
}

function makeRuns(
  text: string,
  markerMap: Map<string, string>,
  opts: RunOpts = {},
): TextRun[] {
  const segs = segmentText(text);
  const runs: TextRun[] = [];
  for (const seg of segs) {
    if (seg.type === 'text') {
      if (seg.value) runs.push(new TextRun({ text: seg.value, ...opts }));
      continue;
    }
    const omml = latexToOmml(seg.value, !!seg.display);
    if (omml) {
      const key = `__MATH_${markerMap.size}__`;
      markerMap.set(key, omml);
      runs.push(new TextRun({ text: key, ...opts }));
    } else {
      console.warn('[soal-docx] fallback (readable text) for:', seg.value);
      runs.push(new TextRun({ text: seg.value, italics: true, ...opts }));
    }
  }
  if (!runs.length) runs.push(new TextRun({ text: '', ...opts }));
  return runs;
}

// -------- Image helpers --------

async function fetchImageBytes(
  url: string,
): Promise<{ data: Uint8Array; type: 'png' | 'jpg' | 'gif' } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = new Uint8Array(await res.arrayBuffer());
    const cleanUrl = url.split('?')[0].toLowerCase();
    let type: 'png' | 'jpg' | 'gif' = 'png';
    if (cleanUrl.endsWith('.jpg') || cleanUrl.endsWith('.jpeg')) type = 'jpg';
    else if (cleanUrl.endsWith('.gif')) type = 'gif';
    return { data: buf, type };
  } catch {
    return null;
  }
}

// -------- Layout helpers --------

const BORDER = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
const CELL_BORDERS = {
  top: BORDER,
  bottom: BORDER,
  left: BORDER,
  right: BORDER,
};

// (helper removed — using keepNext/keepLines directly on Paragraph options)

// A row of empty writing space using a bottom border.
function answerLineParagraph(): Paragraph {
  return new Paragraph({
    spacing: { before: 120, after: 120, line: 360 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color: '333333', space: 1 },
    },
    children: [new TextRun({ text: '' })],
  });
}

function headerCell(text: string, widthPct: number, align: 'left' | 'center' = 'left'): TableCell {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    borders: CELL_BORDERS,
    shading: { fill: 'E5E7EB', type: ShadingType.CLEAR, color: 'auto' },
    children: [
      new Paragraph({
        alignment: align === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT,
        children: [new TextRun({ text, bold: true })],
      }),
    ],
  });
}

function textCell(
  text: string,
  markerMap: Map<string, string>,
  widthPct: number,
  align: 'left' | 'center' = 'left',
  opts: RunOpts = {},
): TableCell {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    borders: CELL_BORDERS,
    children: [
      new Paragraph({
        alignment: align === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT,
        children: makeRuns(text, markerMap, opts),
      }),
    ],
  });
}

function multiParagraphCell(paragraphs: Paragraph[], widthPct: number): TableCell {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    borders: CELL_BORDERS,
    children: paragraphs.length ? paragraphs : [new Paragraph({ children: [new TextRun('')] })],
  });
}

// -------- Main export --------

export interface SoalDocxResult {
  blob: Blob;
  filename: string;
  equationCount: number;
  markerCount: number;
}

export async function exportSoalToDocx(
  bank: BankSoalData,
  formData: Partial<ModulFormData>,
  opts: {
    letterheadUrl?: string | null;
    letterheadEnabled?: boolean;
  } = {},
): Promise<SoalDocxResult> {
  const markerMap = new Map<string, string>();
  const children: Paragraph[] = [];
  const soalList: SoalItem[] = bank.daftar_soal || [];

  // Letterhead
  if (opts.letterheadEnabled && opts.letterheadUrl) {
    const img = await fetchImageBytes(opts.letterheadUrl);
    if (img) {
      children.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              type: img.type,
              data: img.data,
              transformation: { width: 600, height: 90 },
            } as unknown as ConstructorParameters<typeof ImageRun>[0]),
          ],
        }),
      );
    }
  }

  // Title
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      keepNext: true,
      children: [
        new TextRun({ text: bank.judul_latihan || 'LEMBAR SOAL', bold: true }),
      ],
    }),
  );

  // Meta lines
  const meta: string[] = [];
  if (formData.mataPelajaran) meta.push(`Mata Pelajaran : ${formData.mataPelajaran}`);
  if (formData.kelas) meta.push(`Kelas          : ${formData.kelas}`);
  if (formData.materi) meta.push(`Materi         : ${formData.materi}`);
  if (formData.namaPenyusun) meta.push(`Guru           : ${formData.namaPenyusun}`);
  if (formData.sekolah) meta.push(`Sekolah        : ${formData.sekolah}`);
  for (const line of meta) {
    children.push(new Paragraph({ children: [new TextRun({ text: line })] }));
  }
  children.push(new Paragraph({ children: [new TextRun('')] }));

  // Stimulus utama
  if (bank.stimulus) {
    children.push(
      new Paragraph({
        keepNext: true,
        children: [
          new TextRun({
            text: 'Bacalah teks berikut untuk menjawab soal-soal di bawah ini!',
            bold: true,
          }),
        ],
      }),
    );
    children.push(new Paragraph({ children: makeRuns(bank.stimulus, markerMap) }));
    children.push(new Paragraph({ children: [new TextRun('')] }));
  }

  // Section title: LEMBAR SOAL
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      alignment: AlignmentType.CENTER,
      keepNext: true,
      children: [new TextRun({ text: 'LEMBAR SOAL', bold: true })],
    }),
  );

  const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

  let prevStimulusId: number | undefined;
  for (const soal of soalList) {
    // Per-soal stimulus (multi-stimulus)
    if (bank.stimulus_list && soal.stimulus_id && soal.stimulus_id !== prevStimulusId) {
      const st = bank.stimulus_list.find((x) => x.id === soal.stimulus_id);
      if (st) {
        children.push(
          new Paragraph({
            keepNext: true,
            children: [
              new TextRun({
                text: 'Bacalah teks berikut untuk menjawab soal-soal berikutnya!',
                bold: true,
              }),
            ],
          }),
        );
        children.push(new Paragraph({ children: makeRuns(st.teks || '', markerMap) }));
      }
      prevStimulusId = soal.stimulus_id;
    }

    const group = classifySoal(soal);

    // Nomor bold + stem regular, keep next → keep with options/answer lines.
    children.push(
      new Paragraph({
        keepNext: true,
        keepLines: true,
        spacing: { before: 120, after: 60 },
        children: [
          new TextRun({ text: `${soal.no}. `, bold: true }),
          ...makeRuns(soal.pertanyaan || '', markerMap),
        ],
      }),
    );

    if (group === 'pg' && soal.opsi?.length) {
      soal.opsi.forEach((op, i) => {
        const optText = op.replace(/^[A-E]\.\s*/i, '');
        children.push(
          new Paragraph({
            indent: { left: 360 },
            keepLines: true,
            keepNext: i < (soal.opsi!.length - 1),
            spacing: { after: 40 },
            children: [
              new TextRun({ text: `${LETTERS[i] ?? i + 1}. ` }),
              ...makeRuns(optText, markerMap),
            ],
          }),
        );
      });
    } else if (group === 'complex' && soal.pernyataan_benar_salah?.length) {
      soal.pernyataan_benar_salah.forEach((p, i) => {
        children.push(
          new Paragraph({
            indent: { left: 360 },
            keepLines: true,
            keepNext: i < (soal.pernyataan_benar_salah!.length - 1),
            spacing: { after: 40 },
            children: [
              new TextRun({ text: `${i + 1}. ` }),
              ...makeRuns(p.pernyataan || '', markerMap),
              new TextRun({ text: '   (Benar / Salah)' }),
            ],
          }),
        );
      });
    } else if (group === 'complex' && soal.opsi?.length) {
      // MCMA
      soal.opsi.forEach((op, i) => {
        const optText = op.replace(/^[A-E0-9]\.\s*/i, '');
        children.push(
          new Paragraph({
            indent: { left: 360 },
            keepLines: true,
            keepNext: i < (soal.opsi!.length - 1),
            spacing: { after: 40 },
            children: [
              new TextRun({ text: '☐  ' }),
              new TextRun({ text: `${LETTERS[i] ?? i + 1}. ` }),
              ...makeRuns(optText, markerMap),
            ],
          }),
        );
      });
    } else if (group === 'menjodohkan' && soal.premis?.length && soal.respon?.length) {
      soal.premis.forEach((p, i) => {
        const pt = p.replace(/^\d+\.\s*/i, '');
        const rt = (soal.respon?.[i] || '').replace(/^[A-Z]\.\s*/i, '');
        children.push(
          new Paragraph({
            indent: { left: 360 },
            keepLines: true,
            keepNext: i < (soal.premis!.length - 1),
            spacing: { after: 40 },
            children: [
              new TextRun({ text: `${i + 1}. ` }),
              ...makeRuns(pt, markerMap),
              new TextRun({ text: '   →   ' }),
              ...makeRuns(rt, markerMap),
            ],
          }),
        );
      });
    } else if (group === 'isian') {
      children.push(
        new Paragraph({
          indent: { left: 360 },
          keepLines: true,
          spacing: { before: 60, after: 120, line: 360 },
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 6, color: '333333', space: 1 },
          },
          children: [new TextRun({ text: 'Jawaban:' })],
        }),
      );
    } else if (group === 'uraian') {
      const lines = computeAnswerLines(soal);
      for (let i = 0; i < lines; i++) {
        children.push(answerLineParagraph());
      }
    }

    // spacer after question block
    children.push(new Paragraph({ children: [new TextRun('')], spacing: { after: 60 } }));
  }

  // ============ Page break → KISI-KISI ============
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      keepNext: true,
      children: [new TextRun({ text: 'KISI-KISI / ANALISIS BUTIR SOAL', bold: true })],
    }),
  );

  // Collect body items (paragraphs & tables). The kisi-kisi table itself is
  // pushed just below.
  const sectionChildren: Array<Paragraph | Table> = [...children];

  // Kisi-kisi table
  {
    const rows: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: [
          headerCell('No', 6, 'center'),
          headerCell('Tipe Soal', 22),
          headerCell('Level Kognitif', 14, 'center'),
          headerCell('Indikator Soal', 50),
          headerCell('Skor', 8, 'center'),
        ],
      }),
    ];
    for (const s of soalList) {
      rows.push(
        new TableRow({
          cantSplit: true,
          children: [
            textCell(String(s.no), markerMap, 6, 'center'),
            textCell(s.tipe || '', markerMap, 22),
            textCell(s.level_kognitif || '-', markerMap, 14, 'center'),
            textCell(s.indikator_soal || '-', markerMap, 50),
            textCell(String(s.skor ?? ''), markerMap, 8, 'center'),
          ],
        }),
      );
    }
    sectionChildren.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows,
      }),
    );
  }

  // ============ KUNCI JAWABAN & PEMBAHASAN ============
  sectionChildren.push(new Paragraph({ children: [new PageBreak()] }));
  sectionChildren.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      keepNext: true,
      children: [new TextRun({ text: 'KUNCI JAWABAN DAN PEMBAHASAN', bold: true })],
    }),
  );
  sectionChildren.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: '(Dokumen ini adalah pegangan guru, tidak untuk dibagikan kepada siswa)',
          italics: true,
        }),
      ],
    }),
  );

  // Pilihan Ganda
  const pgList = soalList.filter((s) => classifySoal(s) === 'pg');
  if (pgList.length) {
    sectionChildren.push(
      new Paragraph({
        keepNext: true,
        spacing: { before: 200, after: 80 },
        children: [new TextRun({ text: 'Pilihan Ganda', bold: true })],
      }),
    );
    const rows: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: [
          headerCell('No', 8, 'center'),
          headerCell('Kunci', 16, 'center'),
          headerCell('Pembahasan', 66),
          headerCell('Skor', 10, 'center'),
        ],
      }),
    ];
    for (const s of pgList) {
      const kunci = Array.isArray(s.kunci) ? s.kunci.join(', ') : String(s.kunci ?? '');
      rows.push(
        new TableRow({
          cantSplit: true,
          children: [
            textCell(String(s.no), markerMap, 8, 'center'),
            textCell(kunci, markerMap, 16, 'center', { bold: true }),
            textCell(s.pembahasan || '-', markerMap, 66),
            textCell(String(s.skor ?? ''), markerMap, 10, 'center'),
          ],
        }),
      );
    }
    sectionChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }));
  }

  // Complex (BS / MCMA / Kategori)
  const complexList = soalList.filter((s) => classifySoal(s) === 'complex');
  if (complexList.length) {
    sectionChildren.push(
      new Paragraph({
        keepNext: true,
        spacing: { before: 200, after: 80 },
        children: [
          new TextRun({ text: 'Pilihan Ganda Kompleks / Benar-Salah', bold: true }),
        ],
      }),
    );
    const rows: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: [
          headerCell('No', 8, 'center'),
          headerCell('Kunci / Pernyataan Benar', 34),
          headerCell('Pembahasan Singkat', 50),
          headerCell('Skor', 8, 'center'),
        ],
      }),
    ];
    for (const s of complexList) {
      let kunciParas: Paragraph[];
      if (s.pernyataan_benar_salah && s.pernyataan_benar_salah.length > 0) {
        kunciParas = s.pernyataan_benar_salah.map(
          (p, j) =>
            new Paragraph({
              spacing: { after: 40 },
              children: [
                new TextRun({ text: `${j + 1}. ` }),
                ...makeRuns(p.pernyataan || '', markerMap),
                new TextRun({ text: ' — ' }),
                new TextRun({ text: p.jawaban, bold: true }),
              ],
            }),
        );
      } else if (Array.isArray(s.kunci)) {
        kunciParas = s.kunci.map(
          (k) =>
            new Paragraph({
              spacing: { after: 40 },
              children: [
                new TextRun({ text: '• ' }),
                ...makeRuns(String(k), markerMap, { bold: true }),
              ],
            }),
        );
      } else {
        kunciParas = [
          new Paragraph({
            children: makeRuns(String(s.kunci ?? ''), markerMap, { bold: true }),
          }),
        ];
      }
      rows.push(
        new TableRow({
          cantSplit: true,
          children: [
            textCell(String(s.no), markerMap, 8, 'center'),
            multiParagraphCell(kunciParas, 34),
            textCell(s.pembahasan || '-', markerMap, 50),
            textCell(String(s.skor ?? ''), markerMap, 8, 'center'),
          ],
        }),
      );
    }
    sectionChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }));
  }

  // Menjodohkan
  const matchList = soalList.filter((s) => classifySoal(s) === 'menjodohkan');
  if (matchList.length) {
    sectionChildren.push(
      new Paragraph({
        keepNext: true,
        spacing: { before: 200, after: 80 },
        children: [new TextRun({ text: 'Menjodohkan', bold: true })],
      }),
    );
    const rows: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: [
          headerCell('No', 8, 'center'),
          headerCell('Pasangan yang Benar', 82),
          headerCell('Skor', 10, 'center'),
        ],
      }),
    ];
    for (const s of matchList) {
      const premis = s.premis || [];
      const respon = s.respon || [];
      const paras = premis.map((p, idx) => {
        const pt = p.replace(/^\d+\.\s*/i, '');
        const rt = (respon[idx] || '').replace(/^[A-Z]\.\s*/i, '');
        return new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: `${idx + 1}. ` }),
            ...makeRuns(pt, markerMap),
            new TextRun({ text: ' → ', bold: true }),
            ...makeRuns(rt, markerMap),
          ],
        });
      });
      rows.push(
        new TableRow({
          cantSplit: true,
          children: [
            textCell(String(s.no), markerMap, 8, 'center'),
            multiParagraphCell(paras, 82),
            textCell(String(s.skor ?? ''), markerMap, 10, 'center'),
          ],
        }),
      );
    }
    sectionChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }));
  }

  // Isian Singkat
  const isianList = soalList.filter((s) => classifySoal(s) === 'isian');
  if (isianList.length) {
    sectionChildren.push(
      new Paragraph({
        keepNext: true,
        spacing: { before: 200, after: 80 },
        children: [new TextRun({ text: 'Isian Singkat', bold: true })],
      }),
    );
    const rows: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: [
          headerCell('No', 8, 'center'),
          headerCell('Jawaban yang Diterima', 32),
          headerCell('Pembahasan Singkat', 52),
          headerCell('Skor', 8, 'center'),
        ],
      }),
    ];
    for (const s of isianList) {
      const alts = parseAlternatifJawaban(s.kunci);
      const paras =
        alts.length > 1
          ? alts.map(
              (a) =>
                new Paragraph({
                  spacing: { after: 40 },
                  children: [
                    new TextRun({ text: '• ' }),
                    ...makeRuns(a, markerMap),
                  ],
                }),
            )
          : [
              new Paragraph({
                children: makeRuns(alts[0] || '-', markerMap, { bold: true }),
              }),
            ];
      rows.push(
        new TableRow({
          cantSplit: true,
          children: [
            textCell(String(s.no), markerMap, 8, 'center'),
            multiParagraphCell(paras, 32),
            textCell(s.pembahasan || '-', markerMap, 52),
            textCell(String(s.skor ?? ''), markerMap, 8, 'center'),
          ],
        }),
      );
    }
    sectionChildren.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows }));
  }

  // Uraian → blok vertikal per nomor
  const uraianList = soalList.filter((s) => classifySoal(s) === 'uraian');
  if (uraianList.length) {
    sectionChildren.push(
      new Paragraph({
        keepNext: true,
        spacing: { before: 240, after: 80 },
        children: [new TextRun({ text: 'Uraian', bold: true })],
      }),
    );
    for (const s of uraianList) {
      const kunciStr = Array.isArray(s.kunci) ? s.kunci.join('\n') : String(s.kunci ?? '');
      const blockRows: TableRow[] = [
        new TableRow({
          cantSplit: true,
          children: [
            new TableCell({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: CELL_BORDERS,
              children: [
                new Paragraph({
                  keepNext: true,
                  spacing: { after: 60 },
                  children: [new TextRun({ text: `Nomor ${s.no}`, bold: true })],
                }),
                new Paragraph({
                  keepNext: true,
                  children: [new TextRun({ text: 'Jawaban ideal:', bold: true })],
                }),
                new Paragraph({
                  spacing: { after: 80 },
                  children: makeRuns(kunciStr || '-', markerMap),
                }),
                ...(s.pembahasan
                  ? [
                      new Paragraph({
                        keepNext: true,
                        children: [new TextRun({ text: 'Pembahasan:', bold: true })],
                      }),
                      new Paragraph({
                        spacing: { after: 80 },
                        children: makeRuns(s.pembahasan, markerMap),
                      }),
                    ]
                  : []),
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Skor maksimal: ', bold: true }),
                    new TextRun({ text: String(s.skor ?? '') }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ];
      sectionChildren.push(
        new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: blockRows }),
      );
      sectionChildren.push(new Paragraph({ children: [new TextRun('')], spacing: { after: 80 } }));
    }
  }

  // Pedoman penilaian
  if (bank.pedoman_penilaian) {
    sectionChildren.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 80 },
        keepNext: true,
        children: [new TextRun({ text: 'Pedoman Penilaian', bold: true })],
      }),
    );
    sectionChildren.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Skor Maksimal: ', bold: true }),
          new TextRun({ text: String(bank.pedoman_penilaian.skor_maksimal ?? '') }),
        ],
      }),
    );
    if (bank.pedoman_penilaian.rumus) {
      sectionChildren.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Rumus Nilai: ', bold: true }),
            ...makeRuns(bank.pedoman_penilaian.rumus, markerMap),
          ],
        }),
      );
    }
  }

  const doc = new Document({
    creator: 'Modul Ajar',
    title: bank.judul_latihan || 'Lembar Soal',
    sections: [
      {
        properties: {
          page: {
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children: sectionChildren,
      },
    ],
  });

  const initialBlob = await Packer.toBlob(doc);
  const initialBuf = await initialBlob.arrayBuffer();
  const zip = await JSZip.loadAsync(initialBuf);
  const entry = zip.file('word/document.xml');
  if (!entry) throw new Error('word/document.xml not found in DOCX package');
  let xml = await entry.async('string');

  if (!/xmlns:m=/.test(xml)) {
    xml = xml.replace(
      /<w:document\b([^>]*)>/,
      (_m, attrs) => `<w:document${attrs} xmlns:m="${MATH_NS}">`,
    );
  }

  let equationCount = 0;
  const missing: string[] = [];
  for (const [marker, omml] of markerMap.entries()) {
    const esc = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const runRe = new RegExp(
      `<w:r\\b[^>]*>(?:(?!<w:r\\b)[\\s\\S])*?<w:t[^>]*>${esc}</w:t>[\\s\\S]*?</w:r>`,
      'g',
    );
    const before = xml;
    xml = xml.replace(runRe, omml);
    if (xml !== before) equationCount++;
    else missing.push(marker);
  }
  if (missing.length) {
    console.warn('[soal-docx] markers not replaced:', missing);
    for (const marker of missing) {
      const esc = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      xml = xml.replace(new RegExp(esc, 'g'), '');
    }
  }

  zip.file('word/document.xml', xml);

  const finalBlob = await zip.generateAsync({
    type: 'blob',
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    compression: 'DEFLATE',
  });

  const filenameBase = generateExportFilename({
    documentType: 'BankSoal',
    mapel: formData.mataPelajaran,
    kelas: formData.kelas,
    materi: formData.materi || bank.judul_latihan,
    extension: 'docx'
  });

  return {
    blob: finalBlob,
    filename: filenameBase,
    equationCount,
    markerCount: markerMap.size,
  };
}
