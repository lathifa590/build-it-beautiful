/**
 * Sanitizes and truncates a string (usually 'materi' or 'topik') 
 * to be safe for filenames.
 */
export function sanitizeAndTruncate(text: string | undefined | null, maxWords: number = 4): string {
    if (!text) return '';
    // Remove non-alphanumeric (keep spaces)
    const sanitized = text.replace(/[^a-zA-Z0-9 ]/g, '').trim();
    return sanitized
        .split(/\s+/)
        .slice(0, maxWords)
        .join('_');
}

/**
 * Replaces spaces with underscores and removes special chars.
 */
export function cleanString(text: string | undefined | null): string {
    if (!text) return '';
    return text.replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '_');
}

export interface ExportFilenameOptions {
    documentType: string; // e.g. "Modul", "LKPD", "Prota", "Prosem"
    isWorkspace?: boolean;
    isMultiPertemuan?: boolean;
    pertemuanKe?: number | string;
    mapel?: string;
    kelas?: string; // or Fase
    materi?: string;
    extension?: 'doc' | 'docx' | 'xlsx' | 'pdf';
    semester?: string | number;
}

export function generateExportFilename(opts: ExportFilenameOptions): string {
    const parts: string[] = [];

    // Prefix for Workspace
    if (opts.isWorkspace) {
        parts.push('WS');
    }

    // Document Type (Modul, LKPD, Asesmen, Prota, Prosem, KKTP, dll)
    parts.push(cleanString(opts.documentType));

    const docTypeLower = opts.documentType.toLowerCase();
    const isProtaProsemKktp = docTypeLower.includes('prota') || docTypeLower.includes('prosem') || docTypeLower.includes('kktp') || docTypeLower.includes('analisis');

    // Handle Prosem specifically which has semester
    if (docTypeLower.includes('prosem') && opts.semester) {
        parts.push(`Sem${opts.semester}`);
    }

    // Meeting Number / Multi
    if (!isProtaProsemKktp) {
        if (opts.isMultiPertemuan) {
            parts.push('Multi');
        } else if (opts.pertemuanKe !== undefined && opts.pertemuanKe !== '') {
            parts.push(`P${opts.pertemuanKe}`);
        }
    }

    // Mapel
    if (opts.mapel) {
        parts.push(cleanString(opts.mapel));
    }

    // Kelas / Fase
    if (opts.kelas) {
        parts.push(cleanString(opts.kelas));
    }

    // Materi (Only for non-administrative docs)
    if (opts.materi && !isProtaProsemKktp) {
        const shortMateri = sanitizeAndTruncate(opts.materi);
        if (shortMateri) {
            parts.push(shortMateri);
        }
    }

    // Join and append extension
    const filenameBase = parts.filter(p => p.length > 0).join('_');
    return opts.extension ? `${filenameBase}.${opts.extension}` : filenameBase;
}
