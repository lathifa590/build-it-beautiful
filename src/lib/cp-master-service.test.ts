import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import masterJson from '@/data/cp_database_master_2025.json';
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
    expect(resE?.elemen.map((e) => e.nama)).toEqual([
      'Bilangan',
      'Aljabar dan Fungsi',
      'Analisis Data dan Peluang',
    ]);

    const resLanjut = queryMasterCPDatabase('Matematika Tingkat Lanjut', 'F');
    expect(resLanjut).not.toBeNull();
    expect(resLanjut?.mataPelajaran).toBe('Matematika Tingkat Lanjut');
    expect(resLanjut?.elemen.length).toBeGreaterThan(0);
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

  it('should query Ilmu Pengetahuan Sosial (IPS) on Fase D with correct elements and never match IPA', () => {
    const result = queryMasterCPDatabase('Ilmu Pengetahuan Sosial', 'D');
    expect(result).not.toBeNull();
    expect(result?.mataPelajaran).toContain('Ilmu Pengetahuan Sosial');
    expect(result?.faseCode).toContain('D');
    expect(result?.isFallback).toBe(false);

    const elemenNames = result?.elemen.map((e) => e.nama);
    expect(elemenNames).toContain('Pemahaman Konsep');
    expect(elemenNames).toContain('Keterampilan Proses');
    expect(elemenNames).not.toContain('Pemahaman IPA');

    const pemahaman = result?.elemen.find((e) => e.nama === 'Pemahaman Konsep');
    expect(pemahaman?.teks).toContain('kondisi geografis Indonesia');
    expect(pemahaman?.teks).toContain('kegiatan ekonomi');
    expect(pemahaman?.teks).toContain('interaksi sosial');
    expect(pemahaman?.teks).toContain('ilmu sejarah');
    expect(pemahaman?.teks).not.toContain('bioteknologi');
  });

  it('should query IPS via alias on Fase D', () => {
    const result = queryMasterCPDatabase('IPS', 'D');
    expect(result).not.toBeNull();
    expect(result?.mataPelajaran).toContain('Ilmu Pengetahuan Sosial');
    expect(result?.faseCode).toContain('D');
  });

  it('should query IPA on Fase D correctly without matching IPS', () => {
    const result = queryMasterCPDatabase('IPA', 'D');
    expect(result).not.toBeNull();
    expect(result?.mataPelajaran).toContain('Ilmu Pengetahuan Alam');
    const elemenNames = result?.elemen.map((e) => e.nama);
    expect(elemenNames).toContain('Pemahaman IPA');
  });

  it('should resolve Ekonomi on Fase E to IPS Fase E fallback', () => {
    const result = queryMasterCPDatabase('Ekonomi', 'E');
    expect(result).not.toBeNull();
    expect(result?.mataPelajaran).toContain('Ilmu Pengetahuan Sosial');
    expect(result?.isFallback).toBe(true);
    expect(result?.fallbackInfo?.parentMapelName).toContain('IPS');
  });

  it('should find Ekonomi, Geografi, Sosiologi on Fase F directly', () => {
    const resEko = queryMasterCPDatabase('Ekonomi', 'F');
    expect(resEko).not.toBeNull();
    expect(resEko?.mataPelajaran).toBe('Ekonomi');
    expect(resEko?.isFallback).toBe(false);

    const resGeo = queryMasterCPDatabase('Geografi', 'F');
    expect(resGeo).not.toBeNull();
    expect(resGeo?.mataPelajaran).toBe('Geografi');

    const resSosio = queryMasterCPDatabase('Sosiologi', 'F');
    expect(resSosio).not.toBeNull();
    expect(resSosio?.mataPelajaran).toBe('Sosiologi');
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

  it('should match BSKAP 046/2025 Informatika across Fase D, E, and F (no typo Memanfaaatkan)', () => {
    for (const fase of ['D', 'E']) {
      const res = queryMasterCPDatabase('Informatika', fase);
      expect(res).not.toBeNull();
      expect(res?.elemen.map((e) => e.nama)).toEqual([
        'Berpikir Komputasional',
        'Literasi Digital',
      ]);
      expect(res?.elemen.map((e) => e.teks).join(' ')).not.toContain('Memanfaaatkan');
    }

    const resF = queryMasterCPDatabase('Informatika', 'F');
    expect(resF).not.toBeNull();
    expect(resF?.elemen.map((e) => e.nama)).toEqual([
      'Berpikir Komputasional',
      'Literasi Digital',
      'Analisis Data',
      'Algoritma dan Pemrograman',
    ]);
  });

  it('should have updated 2025 PJOK elements across Fase A through F', () => {
    for (const fase of ['A', 'B', 'C', 'D', 'E', 'F']) {
      const res = queryMasterCPDatabase('PJOK', fase);
      expect(res).not.toBeNull();
      expect(res?.elemen.map((e) => e.nama)).toEqual([
        'Terampil Bergerak',
        'Belajar Melalui Gerak',
        'Bergaya Hidup Aktif',
        'Memilih Hidup yang Menyehatkan',
      ]);
    }
  });

  it('should have 4 Pendidikan Pancasila elements across Fase A through F', () => {
    for (const fase of ['A', 'B', 'C', 'D', 'E', 'F']) {
      const res = queryMasterCPDatabase('Pendidikan Pancasila', fase);
      expect(res).not.toBeNull();
      expect(res?.elemen.length).toBe(4);
    }
  });

  it('should have Koding & KA for Fase C-F and distinct SMK variant', () => {
    for (const fase of ['C', 'D']) {
      const res = queryMasterCPDatabase('Koding dan Kecerdasan Artifisial', fase);
      expect(res).not.toBeNull();
      expect(res?.elemen.length).toBe(4);
    }
    for (const fase of ['E', 'F']) {
      const res = queryMasterCPDatabase('Koding dan Kecerdasan Artifisial', fase);
      expect(res).not.toBeNull();
      expect(res?.elemen.length).toBe(6);

      const resSmk = queryMasterCPDatabase('Koding dan Kecerdasan Artifisial (SMK/MAK)', fase);
      expect(resSmk).not.toBeNull();
      expect(resSmk?.mataPelajaran).toContain('SMK/MAK');
      expect(resSmk?.elemen.length).toBe(6);
    }
  });

  it('should support PAI 2026 A-F without Usia Mental and never cross-match other religions', () => {
    for (const fase of ['A', 'B', 'C', 'D', 'E', 'F']) {
      const pai = queryMasterCPDatabase('Pendidikan Agama Islam', fase);
      expect(pai).not.toBeNull();
      expect(pai?.mataPelajaran).toBe('Pendidikan Agama Islam dan Budi Pekerti');
      expect(pai?.kelas).not.toContain('Usia Mental');
      expect(pai?.elemen.length).toBe(5);
    }

    const kristen = queryMasterCPDatabase('Agama Kristen', 'D');
    expect(kristen?.mataPelajaran).toContain('Kristen');

    const hindu = queryMasterCPDatabase('Agama Hindu', 'E');
    expect(hindu?.mataPelajaran).toContain('Hindu');

    const konghucu = queryMasterCPDatabase('Agama Konghucu', 'F');
    expect(konghucu?.mataPelajaran).toContain('Khonghucu');
  });

  it('should have complete phases for Seni (A-F) and Bahasa Inggris (B-F)', () => {
    for (const seni of ['Seni Musik', 'Seni Rupa', 'Seni Tari', 'Seni Teater']) {
      for (const fase of ['A', 'B', 'C', 'D', 'E', 'F']) {
        const res = queryMasterCPDatabase(seni, fase);
        expect(res).not.toBeNull();
        expect(res?.elemen.length).toBe(5);
      }
    }

    for (const fase of ['B', 'C', 'D', 'E', 'F']) {
      const eng = queryMasterCPDatabase('Bahasa Inggris', fase);
      expect(eng).not.toBeNull();
      expect(eng?.elemen.length).toBe(3);
    }
  });

  it('should handle Sejarah SMA vs SMK and Projek IPAS cleanly', () => {
    const sejarahE = queryMasterCPDatabase('Sejarah', 'E');
    expect(sejarahE).not.toBeNull();
    expect(sejarahE?.isFallback).toBe(true);
    expect(sejarahE?.mataPelajaran).toContain('Ilmu Pengetahuan Sosial');

    const sejarahF = queryMasterCPDatabase('Sejarah', 'F');
    expect(sejarahF).not.toBeNull();
    expect(sejarahF?.isFallback).toBe(false);
    expect(sejarahF?.mataPelajaran).toContain('Sejarah');

    const sejarahSmkE = queryMasterCPDatabase('Sejarah (SMK/MAK)', 'E');
    expect(sejarahSmkE).not.toBeNull();
    expect(sejarahSmkE?.isFallback).toBe(false);
    expect(sejarahSmkE?.mataPelajaran).toBe('Sejarah (SMK/MAK)');
    expect(sejarahSmkE?.elemen.length).toBe(2);

    const projekIpas = queryMasterCPDatabase('Projek IPAS', 'E');
    expect(projekIpas).not.toBeNull();
    expect(projekIpas?.mataPelajaran).toBe('Projek IPAS (Ilmu Pengetahuan Alam dan Sosial)');

    const kesetaraanD = queryMasterCPDatabase('Pemberdayaan dan Keterampilan Kesetaraan', 'D');
    expect(kesetaraanD).not.toBeNull();
    expect(kesetaraanD?.faseCode).toBe('D');
    expect(kesetaraanD?.faseCode).not.toContain('A s.d. C');

    const kesetaraanB = queryMasterCPDatabase('Pemberdayaan dan Keterampilan Kesetaraan', 'B');
    expect(kesetaraanB).not.toBeNull();
    expect(kesetaraanB?.faseCode).toBe('A s.d. C');
  });

  it('should keep public/data/cp_database_master_2025.json identical to src/data/cp_database_master_2025.json', () => {
    const publicPath = resolve(process.cwd(), 'public/data/cp_database_master_2025.json');
    const publicJson = JSON.parse(readFileSync(publicPath, 'utf-8'));
    expect(publicJson).toEqual(masterJson);
  });
});
