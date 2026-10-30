import {
  AlignmentType,
  BorderStyle,
  Header,
  Footer,
  Paragraph,
  TextRun,
  PageNumber,
  ShadingType,
  TableBorders,
  WidthType,
} from 'docx';

/**
 * Standard Margins (in dxa: 1 cm = 567 dxa, 1 inch = 1440 dxa).
 * Standard formal Indonesian administrative / educational documents:
 * Left: 3 cm (1701 dxa)
 * Top: 2.5 cm (1417 dxa)
 * Right: 2 cm (1134 dxa)
 * Bottom: 2.5 cm (1417 dxa)
 */
export const DOCX_PAGE_MARGINS = {
  top: 1417,
  right: 1134,
  bottom: 1417,
  left: 1701,
};

export const DOCX_PAGE_SIZE = {
  A4: {
    width: 11906, // 210mm
    height: 16838, // 297mm
  },
  F4_FOLIO: {
    width: 12240, // 215mm
    height: 18720, // 330mm
  },
};

export const DOCX_FONTS = {
  primary: 'Calibri',
  serif: 'Times New Roman',
  modern: 'Arial',
};

export const DOCX_COLORS = {
  primary: '1E3A8A', // Deep Navy Blue
  accent: '0D9488', // Teal
  darkText: '1F2937', // Charcoal Gray
  mutedText: '6B7280', // Medium Gray
  borderLight: 'D1D5DB', // Soft Border
  zebraLight: 'F9FAFB', // Alternating row color
  tableHeaderBg: '2563EB', // Table header blue
  tableHeaderColor: 'FFFFFF',
};

export const DOCX_TABLE_BORDERS: TableBorders = {
  top: { style: BorderStyle.SINGLE, size: 4, color: DOCX_COLORS.borderLight },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: DOCX_COLORS.borderLight },
  left: { style: BorderStyle.SINGLE, size: 4, color: DOCX_COLORS.borderLight },
  right: { style: BorderStyle.SINGLE, size: 4, color: DOCX_COLORS.borderLight },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: DOCX_COLORS.borderLight },
  insideVertical: { style: BorderStyle.SINGLE, size: 2, color: DOCX_COLORS.borderLight },
};

/**
 * Standard Header: Document Title on right side in subtle grey
 */
export function createDocumentHeader(titleText: string): Header {
  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: titleText,
            size: 16, // 8pt
            color: DOCX_COLORS.mutedText,
            font: DOCX_FONTS.primary,
            italics: true,
          }),
        ],
      }),
    ],
  });
}

/**
 * Standard Footer: "Halaman X dari Y" on right side
 */
export function createDocumentFooter(systemWatermark?: string): Footer {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          ...(systemWatermark
            ? [
                new TextRun({
                  text: `${systemWatermark} | `,
                  size: 16,
                  color: DOCX_COLORS.mutedText,
                  font: DOCX_FONTS.primary,
                }),
              ]
            : []),
          new TextRun({
            text: 'Halaman ',
            size: 16,
            color: DOCX_COLORS.mutedText,
            font: DOCX_FONTS.primary,
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            size: 16,
            color: DOCX_COLORS.mutedText,
            font: DOCX_FONTS.primary,
          }),
          new TextRun({
            text: ' dari ',
            size: 16,
            color: DOCX_COLORS.mutedText,
            font: DOCX_FONTS.primary,
          }),
          new TextRun({
            children: [PageNumber.TOTAL_PAGES],
            size: 16,
            color: DOCX_COLORS.mutedText,
            font: DOCX_FONTS.primary,
          }),
        ],
      }),
    ],
  });
}
