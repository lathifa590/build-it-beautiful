import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  PageBreak,
  ShadingType,
  BorderStyle,
} from 'docx';
import {
  DOCX_COLORS,
  DOCX_FONTS,
  DOCX_PAGE_MARGINS,
  DOCX_PAGE_SIZE,
  DOCX_TABLE_BORDERS,
  createDocumentFooter,
  createDocumentHeader,
} from './docx-styles';

export interface DocumentOptions {
  title: string;
  subtitle?: string;
  watermarkFooter?: string;
  pageSize?: 'A4' | 'F4_FOLIO';
}

/**
 * Creates a standard Heading 1 with keepWithNext to avoid orphan titles at page bottoms.
 */
export function createHeading1(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    keepWithNext: true,
    spacing: { before: 240, after: 120 }, // 12pt before, 6pt after
    children: [
      new TextRun({
        text,
        bold: true,
        size: 28, // 14pt
        color: DOCX_COLORS.primary,
        font: DOCX_FONTS.primary,
      }),
    ],
  });
}

/**
 * Creates a standard Heading 2.
 */
export function createHeading2(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    keepWithNext: true,
    spacing: { before: 180, after: 80 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 24, // 12pt
        color: DOCX_COLORS.darkText,
        font: DOCX_FONTS.primary,
      }),
    ],
  });
}

/**
 * Creates a body text paragraph with standard 1.15 line spacing.
 */
export function createParagraph(
  text: string,
  options: { bold?: boolean; italics?: boolean; alignment?: AlignmentType; color?: string } = {}
): Paragraph {
  return new Paragraph({
    alignment: options.alignment ?? AlignmentType.LEFT,
    spacing: { after: 120, line: 276 }, // 1.15 line spacing (240 * 1.15 = 276)
    children: [
      new TextRun({
        text,
        bold: options.bold,
        italics: options.italics,
        size: 22, // 11pt
        color: options.color ?? DOCX_COLORS.darkText,
        font: DOCX_FONTS.primary,
      }),
    ],
  });
}

/**
 * Creates an elegant callout box with a colored left accent border.
 */
export function createCalloutBox(text: string, title?: string): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      left: { style: BorderStyle.SINGLE, size: 24, color: DOCX_COLORS.accent }, // 3pt accent border
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: 'F0FDFA', type: ShadingType.CLEAR }, // subtle teal tint
            margins: { top: 140, bottom: 140, left: 200, right: 140 },
            children: [
              ...(title
                ? [
                    new Paragraph({
                      spacing: { after: 60 },
                      children: [
                        new TextRun({
                          text: title,
                          bold: true,
                          size: 20,
                          color: DOCX_COLORS.accent,
                          font: DOCX_FONTS.primary,
                        }),
                      ],
                    }),
                  ]
                : []),
              new Paragraph({
                spacing: { line: 260 },
                children: [
                  new TextRun({
                    text,
                    italics: true,
                    size: 20,
                    color: DOCX_COLORS.darkText,
                    font: DOCX_FONTS.primary,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

export interface TableColumnConfig {
  header: string;
  widthPercent: number; // e.g. 10, 40, 50
  align?: AlignmentType;
}

/**
 * Creates a print-grade table with:
 * 1. CantSplit on every row (prevents mid-row page splits).
 * 2. tblHeader on the first row (repeats headers across pages).
 * 3. Alternating row zebra coloring.
 */
export function createPrintTable(
  columns: TableColumnConfig[],
  rowsData: string[][]
): Table {
  // 1. Header row
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: columns.map(
      (col) =>
        new TableCell({
          width: { size: col.widthPercent, type: WidthType.PERCENTAGE },
          shading: { fill: DOCX_COLORS.tableHeaderBg, type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 120, left: 120, right: 120 },
          children: [
            new Paragraph({
              alignment: col.align ?? AlignmentType.LEFT,
              children: [
                new TextRun({
                  text: col.header,
                  bold: true,
                  size: 20, // 10pt
                  color: DOCX_COLORS.tableHeaderColor,
                  font: DOCX_FONTS.primary,
                }),
              ],
            }),
          ],
        })
    ),
  });

  // 2. Data rows with zebra striping
  const dataRows = rowsData.map((row, rIdx) => {
    const isEven = rIdx % 2 === 0;
    const bgFill = isEven ? 'FFFFFF' : DOCX_COLORS.zebraLight;

    return new TableRow({
      cantSplit: true,
      children: row.map((cellText, cIdx) => {
        const col = columns[cIdx] || { widthPercent: 100 / row.length };
        return new TableCell({
          width: { size: col.widthPercent, type: WidthType.PERCENTAGE },
          shading: { fill: bgFill, type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 120, right: 120 },
          children: [
            new Paragraph({
              alignment: col.align ?? AlignmentType.LEFT,
              spacing: { line: 260 },
              children: [
                new TextRun({
                  text: cellText ?? '-',
                  size: 20, // 10pt
                  color: DOCX_COLORS.darkText,
                  font: DOCX_FONTS.primary,
                }),
              ],
            }),
          ],
        });
      }),
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: DOCX_TABLE_BORDERS,
    rows: [headerRow, ...dataRows],
  });
}

/**
 * Builds and packs the complete Document into a ready-to-download Blob.
 */
export async function buildAndPackDocument(
  options: DocumentOptions,
  contentChildren: (Paragraph | Table | PageBreak)[]
): Promise<Blob> {
  const pageSize =
    options.pageSize === 'F4_FOLIO' ? DOCX_PAGE_SIZE.F4_FOLIO : DOCX_PAGE_SIZE.A4;

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: pageSize,
            margin: DOCX_PAGE_MARGINS,
          },
        },
        headers: {
          default: createDocumentHeader(options.title),
        },
        footers: {
          default: createDocumentFooter(options.watermarkFooter),
        },
        children: [
          // Title Banner
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 60 },
            children: [
              new TextRun({
                text: options.title.toUpperCase(),
                bold: true,
                size: 32, // 16pt
                color: DOCX_COLORS.primary,
                font: DOCX_FONTS.primary,
              }),
            ],
          }),
          ...(options.subtitle
            ? [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 280 },
                  children: [
                    new TextRun({
                      text: options.subtitle,
                      size: 22,
                      color: DOCX_COLORS.mutedText,
                      font: DOCX_FONTS.primary,
                    }),
                  ],
                }),
              ]
            : []),
          ...contentChildren,
        ],
      },
    ],
  });

  return await Packer.toBlob(doc);
}
