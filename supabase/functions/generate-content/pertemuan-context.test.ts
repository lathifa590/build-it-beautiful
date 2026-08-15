import { describe, it, expect } from 'vitest';
import { buildPertemuanContext } from './pertemuan-context';

describe('buildPertemuanContext — FASE 2', () => {
  it('payload kosong → meta null, blok kosong', () => {
    expect(buildPertemuanContext({})).toEqual({ meta: null, promptBlock: '' });
    expect(buildPertemuanContext(undefined)).toEqual({ meta: null, promptBlock: '' });
  });

  it('legacy payload tanpa info pertemuan → blok kosong', () => {
    const { meta, promptBlock } = buildPertemuanContext({
      mapel: 'Matematika',
      kelas: '10',
      materi: 'Fungsi',
    } as never);
    expect(meta).toBeNull();
    expect(promptBlock).toBe('');
  });

  it('pertemuanTarget.id dipertahankan', () => {
    const { meta } = buildPertemuanContext({ pertemuanTarget: { id: 'p-abc', nomorPertemuan: 1 } });
    expect(meta?.pertemuanId).toBe('p-abc');
  });

  it('pertemuanTarget.id mengalahkan data.pertemuanId', () => {
    const { meta } = buildPertemuanContext({
      pertemuanTarget: { id: 'target-id', nomorPertemuan: 2 },
      pertemuanId: 'data-id',
    });
    expect(meta?.pertemuanId).toBe('target-id');
  });

  it('fallback ke data.pertemuanId', () => {
    const { meta } = buildPertemuanContext({ nomorPertemuan: 1, pertemuanId: 'data-id' });
    expect(meta?.pertemuanId).toBe('data-id');
  });

  it('pertemuanTarget.durasiMenit diprioritaskan', () => {
    const { meta } = buildPertemuanContext({
      pertemuanTarget: { nomorPertemuan: 1, durasiMenit: 60, durasi: '2 JP' },
      durasiMenit: 30,
      durasi: '120',
    });
    expect(meta?.durasiMenit).toBe(60);
  });

  it('fallback ke pertemuanTarget.durasi', () => {
    const { meta } = buildPertemuanContext({
      pertemuanTarget: { nomorPertemuan: 1, durasi: '2x45' },
      durasiMenit: 30,
    });
    expect(meta?.durasiMenit).toBe(90);
  });

  it('fallback ke data.durasiMenit', () => {
    const { meta } = buildPertemuanContext({ nomorPertemuan: 1, durasiMenit: '45', durasi: '90' });
    expect(meta?.durasiMenit).toBe(45);
  });

  it('fallback ke data.durasi', () => {
    const { meta } = buildPertemuanContext({ nomorPertemuan: 1, durasi: '3 JP' });
    expect(meta?.durasiMenit).toBe(135);
  });

  it('nomor string dinormalisasi', () => {
    const { meta } = buildPertemuanContext({ pertemuanTarget: { nomorPertemuan: ' 3 ' } });
    expect(meta?.nomorPertemuan).toBe(3);
  });

  it('nomor nol/negatif/NaN ditolak', () => {
    expect(buildPertemuanContext({ nomorPertemuan: 0 }).meta).toBeNull();
    expect(buildPertemuanContext({ nomorPertemuan: -2 }).meta).toBeNull();
    expect(buildPertemuanContext({ nomorPertemuan: Number.NaN }).meta).toBeNull();
    expect(buildPertemuanContext({ nomorPertemuan: Number.POSITIVE_INFINITY }).meta).toBeNull();
    expect(buildPertemuanContext({ nomorPertemuan: 'abc' }).meta).toBeNull();
  });

  it('total invalid tidak tampil', () => {
    const { meta, promptBlock } = buildPertemuanContext({
      nomorPertemuan: 2,
      totalPertemuan: -1,
    });
    expect(meta?.totalPertemuan).toBeUndefined();
    expect(promptBlock).toContain('- Pertemuan: 2');
    expect(promptBlock).not.toContain('undefined');
  });

  it('durasi invalid tidak menghasilkan undefined di prompt', () => {
    const { meta, promptBlock } = buildPertemuanContext({ nomorPertemuan: 1, durasi: 'abc' });
    expect(meta?.durasiMenit).toBeUndefined();
    expect(promptBlock).not.toContain('undefined');
    expect(promptBlock).not.toContain('Durasi:');
  });

  it('tujuan string tampil', () => {
    const { promptBlock } = buildPertemuanContext({
      nomorPertemuan: 1,
      tujuanPertemuan: 'Mengidentifikasi orientation',
    });
    expect(promptBlock).toContain('- Tujuan pertemuan: Mengidentifikasi orientation');
  });

  it('tujuan array tampil sebagai daftar', () => {
    const { promptBlock } = buildPertemuanContext({
      nomorPertemuan: 2,
      tujuanPertemuan: ['Mengidentifikasi orientation', 'Mengidentifikasi complication'],
    });
    expect(promptBlock).toContain('- Tujuan pertemuan:');
    expect(promptBlock).toContain('  - Mengidentifikasi orientation');
    expect(promptBlock).toContain('  - Mengidentifikasi complication');
  });

  it('item tujuan kosong dibuang', () => {
    const { promptBlock } = buildPertemuanContext({
      nomorPertemuan: 1,
      tujuanPertemuan: ['  ', 'Valid', '', null as never],
    });
    expect(promptBlock).toContain('Valid');
    expect(promptBlock).not.toMatch(/- {2}- *\n/);
  });

  it('fokus panjang dibatasi', () => {
    const long = 'A'.repeat(1000);
    const { promptBlock } = buildPertemuanContext({ nomorPertemuan: 1, fokusPertemuan: long });
    const line = promptBlock.split('\n').find((l) => l.startsWith('- Fokus khusus:'))!;
    expect(line.length).toBeLessThan(340);
    expect(line.endsWith('…')).toBe(true);
  });

  it('previousSummary tidak masuk helper', () => {
    const { promptBlock } = buildPertemuanContext({
      nomorPertemuan: 1,
      previousSummary: 'RAHASIA_KONTEKS_SEBELUMNYA',
    } as never);
    expect(promptBlock).not.toContain('RAHASIA_KONTEKS_SEBELUMNYA');
  });

  it('input tidak dimutasi', () => {
    const input = {
      pertemuanTarget: { id: 'x', nomorPertemuan: 1, durasi: '90' },
      tujuanPertemuan: ['a'],
    };
    const snapshot = JSON.parse(JSON.stringify(input));
    buildPertemuanContext(input);
    expect(input).toEqual(snapshot);
  });

  it('prompt tidak memerintahkan label "Pertemuan N" masuk ke judul', () => {
    const { promptBlock } = buildPertemuanContext({ nomorPertemuan: 2, totalPertemuan: 3 });
    expect(promptBlock).not.toMatch(/penanda/i);
    expect(promptBlock).not.toMatch(/judul/i);
  });

  it('pertemuanFokus lama tetap bekerja sebagai fallback', () => {
    const { meta } = buildPertemuanContext({ pertemuanFokus: 3 });
    expect(meta?.nomorPertemuan).toBe(3);
  });

  it('pertemuanIndex menghasilkan nomor index+1', () => {
    expect(buildPertemuanContext({ pertemuanIndex: 0 }).meta?.nomorPertemuan).toBe(1);
    expect(buildPertemuanContext({ pertemuanIndex: 4 }).meta?.nomorPertemuan).toBe(5);
  });

  it('payload lengkap → meta + prompt lengkap', () => {
    const { meta, promptBlock } = buildPertemuanContext({
      pertemuanTarget: { id: 'p2', nomorPertemuan: 2, durasiMenit: 45 },
      totalPertemuan: 3,
      subMateri: 'Struktur Narrative Text',
      tujuanPertemuan: ['Mengidentifikasi orientation', 'Mengidentifikasi complication'],
      fokusPertemuan: 'Analisis struktur, belum masuk produksi teks',
    });
    expect(meta).toEqual({
      pertemuanId: 'p2',
      nomorPertemuan: 2,
      totalPertemuan: 3,
      durasiMenit: 45,
      subMateri: 'Struktur Narrative Text',
    });
    expect(promptBlock).toContain('- Pertemuan: 2 dari 3');
    expect(promptBlock).toContain('- Durasi: 45 menit');
    expect(promptBlock).toContain('- Submateri: Struktur Narrative Text');
    expect(promptBlock).toContain('- Fokus khusus: Analisis struktur, belum masuk produksi teks');
  });
});
