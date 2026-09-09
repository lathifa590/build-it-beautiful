import { describe, it, expect } from 'vitest';
import { queryMasterCPDatabase, formatMasterCPDetailed } from './cp-master-service';

describe('cp-master-service (BSKAP No. 046/H/KR/2025 SSOT)', () => {
  it('should find Fisika on Fase F from master database', () => {
    const result = queryMasterCPDatabase('Fisika', 'F');
    expect(result).not.toBeNull();
    expect(result?.mataPelajaran).toBe('Fisika');
    expect(result?.faseCode).toBe('F');
    expect(result?.isFallback).toBe(false);
    expect(result?.elemen.length).toBe(2);
    expect(result?.source).toBe('master_bskap_046_2025');

    const pemahaman = result?.elemen.find((e) => e.nama === 'Pemahaman Fisika');
    expect(pemahaman?.teks).toContain('Menganalisis hubungan gerak dan gaya');
  });

  it('should resolve Fisika on Fase E via smart fallback to IPA Fase E', () => {
    const result = queryMasterCPDatabase('Fisika', 'E');
    expect(result).not.toBeNull();
    expect(result?.mataPelajaran).toContain('Ilmu Pengetahuan Alam');
    expect(result?.faseCode).toContain('E');
    expect(result?.isFallback).toBe(true);
    expect(result?.fallbackInfo?.parentMapelName).toBe('IPA (Ilmu Pengetahuan Alam)');
    expect(result?.elemen.length).toBe(2);

    const pemahaman = result?.elemen.find((e) => e.nama === 'Pemahaman IPA');
    expect(pemahaman?.teks).toContain('menggunakan sistem pengukuran');
  });

  it('should query Matematika across phases', () => {
    const resA = queryMasterCPDatabase('Matematika', 'A');
    expect(resA).not.toBeNull();
    expect(resA?.elemen.length).toBe(5);

    const resE = queryMasterCPDatabase('Matematika', 'E');
    expect(resE).not.toBeNull();
    expect(resE?.elemen.length).toBe(4);
  });

  it('should query PAUD on Fase Fondasi', () => {
    const result = queryMasterCPDatabase('Capaian Pembelajaran PAUD', 'Fondasi');
    expect(result).not.toBeNull();
    expect(result?.faseCode).toBe('Fondasi');
    expect(result?.elemen.length).toBe(3);
  });

  it('should query Vocational SMK subjects', () => {
    const result = queryMasterCPDatabase('Dasar-Dasar Teknik Otomotif', 'E');
    expect(result).not.toBeNull();
    expect(result?.kategori).toContain('SMK/MAK');
    expect(result?.elemen.length).toBe(5);
  });

  it('should format master CP detailed report properly', () => {
    const result = queryMasterCPDatabase('Fisika', 'F');
    expect(result).not.toBeNull();
    if (result) {
      const formatted = formatMasterCPDetailed(result);
      expect(formatted).toContain('Kategori:');
      expect(formatted).toContain('Mata Pelajaran: Fisika');
      expect(formatted).toContain('Fase/Kelas: Fase F');
      expect(formatted).toContain('Pemahaman Fisika:');
    }
  });
});
