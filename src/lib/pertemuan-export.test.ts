/**
 * FASE 4B — Test model export murni V2 (poin 1–12).
 */
import { describe, expect, it } from 'vitest';
import {
  buildV2ExportPlan,
  getBankSoalForPertemuan,
  sanitizeFilename,
} from '@/lib/pertemuan-export';
import type { GenerationResultV2, PertemuanResult } from '@/types/modul';

const pilihanAll = {
  modul: true as const,
  lkpd: true,
  asesmen: true,
  soal: true,
  materi: true,
  refleksi: true,
};

const mkPertemuan = (
  id: string,
  nomor: number,
  dokumen: PertemuanResult['dokumen'],
  overrides: Partial<PertemuanResult> = {},
): PertemuanResult => ({
  id,
  nomor,
  durasiMenit: 90,
  pilihanDokumen: pilihanAll,
  dokumen,
  status: {},
  ...overrides,
});

const fixture = (): GenerationResultV2 => ({
  version: 2,
  modulPreface: { pemahaman_bermakna: 'preface bab' },
  pertemuan: [
    mkPertemuan('p-1', 1, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      modul: { pembukaan: [], inti: [], penutup: [] } as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      lkpd: { judul: 'LKPD 1' } as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      asesmen: { judul: 'Asesmen 1' } as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      materi: { judul: 'Materi 1' } as any,
    }),
    mkPertemuan('p-2', 2, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      modul: { tahap_awal: {} } as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      soal: { daftar_soal: [{ pertanyaan: 'soal P2' }] } as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      refleksi: { judul: 'Refleksi 2' } as any,
    }),
  ],
});

describe('FASE 4B — buildV2ExportPlan', () => {
  it('1. active_document mengambil meeting dan jenis yang benar', () => {
    const plan = buildV2ExportPlan({
      result: fixture(),
      scope: 'active_document',
      activePertemuanId: 'p-2',
      activeJenisDokumen: 'soal',
      formData: { mataPelajaran: 'Bahasa Inggris' },
    });
    expect(plan.items).toHaveLength(1);
    expect(plan.items[0].pertemuanId).toBe('p-2');
    expect(plan.items[0].jenis).toBe('soal');
    expect(plan.filenameBase).toBe('Soal_P2_Bahasa_Inggris');
  });

  it('2. active_meeting hanya dokumen milik meeting aktif', () => {
    const plan = buildV2ExportPlan({
      result: fixture(),
      scope: 'active_meeting',
      activePertemuanId: 'p-1',
      formData: { mataPelajaran: 'Bahasa Inggris' },
    });
    expect(plan.items.every((i) => i.pertemuanId === 'p-1')).toBe(true);
    expect(plan.items.map((i) => i.jenis)).toEqual([
      'modul',
      'lkpd',
      'asesmen',
      'materi',
    ]);
    expect(plan.filenameBase).toBe('Lengkap_P1_Bahasa_Inggris');
  });

  it('3. complete_package berurutan P1 semua jenis lalu P2 semua jenis', () => {
    const plan = buildV2ExportPlan({
      result: fixture(),
      scope: 'complete_package',
      formData: { mataPelajaran: 'Bahasa Inggris' },
    });
    expect(plan.items.map((i) => `${i.nomorPertemuan}:${i.jenis}`)).toEqual([
      '1:modul',
      '1:lkpd',
      '1:asesmen',
      '1:materi',
      '2:modul',
      '2:soal',
      '2:refleksi',
    ]);
    expect(plan.filenameBase).toBe('Modul_Multi_Bahasa_Inggris');
    expect(plan.pertemuanCount).toBe(2);
  });

  it('4. dokumen yang tidak ada dilewati', () => {
    const plan = buildV2ExportPlan({ result: fixture(), scope: 'complete_package' });
    expect(plan.items.some((i) => i.nomorPertemuan === 1 && i.jenis === 'soal')).toBe(
      false,
    );
    expect(
      plan.skipped.some(
        (s) => s.nomorPertemuan === 1 && s.jenis === 'soal' && s.reason === 'not_generated',
      ),
    ).toBe(true);
  });

  it('5. pilihan true tapi belum ada dokumen tidak diekspor; error juga tidak', () => {
    const r = fixture();
    r.pertemuan[0].status = { lkpd: 'error' };
    r.pertemuan[0].dokumen.lkpd = undefined;
    const plan = buildV2ExportPlan({
      result: r,
      scope: 'active_meeting',
      activePertemuanId: 'p-1',
    });
    expect(plan.items.some((i) => i.jenis === 'lkpd')).toBe(false);
    expect(plan.skipped.find((s) => s.jenis === 'lkpd')?.reason).toBe('error');
  });

  it('6. dokumen hasil edit terbaru masuk plan', () => {
    const r = fixture();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (r.pertemuan[0].dokumen.lkpd as any).judul = 'LKPD 1 (diedit)';
    const plan = buildV2ExportPlan({
      result: r,
      scope: 'active_meeting',
      activePertemuanId: 'p-1',
    });
    const lkpd = plan.items.find((i) => i.jenis === 'lkpd');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((lkpd?.dokumen as any).judul).toBe('LKPD 1 (diedit)');
  });

  it('7. result input tidak dimutasi', () => {
    const r = fixture();
    const snapshot = JSON.stringify(r);
    buildV2ExportPlan({ result: r, scope: 'complete_package' });
    expect(JSON.stringify(r)).toBe(snapshot);
  });

  it('8. stable ID digunakan, bukan index', () => {
    const r = fixture();
    r.pertemuan.reverse();
    const plan = buildV2ExportPlan({
      result: r,
      scope: 'active_document',
      activePertemuanId: 'p-1',
      activeJenisDokumen: 'lkpd',
    });
    expect(plan.items[0].pertemuanId).toBe('p-1');
  });

  it('9. Modul legacy dan detail keduanya masuk plan', () => {
    const plan = buildV2ExportPlan({ result: fixture(), scope: 'complete_package' });
    const moduls = plan.items.filter((i) => i.jenis === 'modul');
    expect(moduls).toHaveLength(2);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((moduls[0].dokumen as any).pembukaan).toBeDefined();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((moduls[1].dokumen as any).tahap_awal).toBeDefined();
  });

  it('10. includeModulPreface hanya pada item Modul', () => {
    const plan = buildV2ExportPlan({ result: fixture(), scope: 'complete_package' });
    for (const item of plan.items) {
      expect(item.includeModulPreface).toBe(item.jenis === 'modul');
    }
  });

  it('11. planning Prota/Prosem/KKTP tidak masuk export', () => {
    const plan = buildV2ExportPlan({ result: fixture(), scope: 'complete_package' });
    const jenisSet = new Set(plan.items.map((i) => i.jenis));
    expect(jenisSet.has('modul')).toBe(true);
    expect([...jenisSet].every((j) =>
      ['modul', 'lkpd', 'asesmen', 'soal', 'materi', 'refleksi'].includes(j),
    )).toBe(true);
    expect(JSON.stringify(plan)).not.toMatch(/prota|prosem|kktp/i);
  });

  it('12. filename disanitasi', () => {
    expect(sanitizeFilename('Mate/mati:ka*?"<>|')).toBe('Mate_mati_ka');
    const plan = buildV2ExportPlan({
      result: fixture(),
      scope: 'complete_package',
      formData: { mataPelajaran: 'IPA/Fisika: Kelas "X"' },
    });
    expect(plan.filenameBase).toBe('Modul_Multi_IPAFisika_Kelas_X');
  });

  it('meeting tidak ditemukan → plan kosong dengan alasan jelas', () => {
    const plan = buildV2ExportPlan({
      result: { version: 2, pertemuan: [] },
      scope: 'active_meeting',
      activePertemuanId: 'hilang',
    });
    expect(plan.items).toHaveLength(0);
    expect(plan.skipped[0].reason).toBe('meeting_not_found');
  });

  it('19/20. BankSoal diambil dari pertemuan aktif, bukan pertemuan lain', () => {
    const r = fixture();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (r.pertemuan[0].dokumen as any).soal = { daftar_soal: [{ pertanyaan: 'soal P1' }] };
    const bankP2 = getBankSoalForPertemuan(r, 'p-2');
    expect(bankP2?.daftar_soal?.[0].pertanyaan).toBe('soal P2');
    const bankP1 = getBankSoalForPertemuan(r, 'p-1');
    expect(bankP1?.daftar_soal?.[0].pertanyaan).toBe('soal P1');
  });
});
