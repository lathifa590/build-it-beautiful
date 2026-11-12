import { describe, it, expect } from 'vitest';
import { resolveMapelCP, findMapelSlug, filterMapelByNama } from './cp-mapel-mapping';

describe('cp-mapel-mapping phase fallback', () => {
  it('should find mapel slug for standard subjects', () => {
    expect(findMapelSlug('Fisika')?.slug).toBe('fisika');
    expect(findMapelSlug('Kimia')?.slug).toBe('kimia');
    expect(findMapelSlug('Biologi')?.slug).toBe('biologi');
    expect(findMapelSlug('IPA')?.slug).toBe('ilmu-pengetahuan-alam-ipa');
  });

  it('should resolve Fisika in Fase E to IPA with fallback notice', () => {
    const result = resolveMapelCP('Fisika', 'E');
    expect(result).not.toBeNull();
    expect(result?.slug).toBe('ilmu-pengetahuan-alam-ipa');
    expect(result?.isFallback).toBe(true);
    expect(result?.fallbackInfo?.parentMapelName).toBe('IPA (Ilmu Pengetahuan Alam)');
    expect(result?.fallbackInfo?.description).toContain('Fisika pada Fase E (Kelas X) terintegrasi');
  });

  it('should handle case insensitivity and "Fase E" formatting', () => {
    const result = resolveMapelCP('fisika', 'Fase E');
    expect(result?.slug).toBe('ilmu-pengetahuan-alam-ipa');
    expect(result?.isFallback).toBe(true);
  });

  it('should keep Fisika in Fase F as fisika without fallback', () => {
    const result = resolveMapelCP('Fisika', 'F');
    expect(result).not.toBeNull();
    expect(result?.slug).toBe('fisika');
    expect(result?.isFallback).toBe(false);
    expect(result?.fallbackInfo).toBeUndefined();
  });

  it('should resolve Kimia and Biologi in Fase E to IPA', () => {
    const kimia = resolveMapelCP('Kimia', 'E');
    expect(kimia?.slug).toBe('ilmu-pengetahuan-alam-ipa');
    expect(kimia?.isFallback).toBe(true);

    const bio = resolveMapelCP('Biologi', 'E');
    expect(bio?.slug).toBe('ilmu-pengetahuan-alam-ipa');
    expect(bio?.isFallback).toBe(true);
  });

  it('should resolve Ekonomi, Sosiologi, Geografi in Fase E to IPS', () => {
    const eko = resolveMapelCP('Ekonomi', 'E');
    expect(eko?.slug).toBe('ilmu-pengetahuan-sosial-ips');
    expect(eko?.isFallback).toBe(true);

    const sosio = resolveMapelCP('Sosiologi', 'E');
    expect(sosio?.slug).toBe('ilmu-pengetahuan-sosial-ips');
    expect(sosio?.isFallback).toBe(true);

    const geo = resolveMapelCP('Geografi', 'E');
    expect(geo?.slug).toBe('ilmu-pengetahuan-sosial-ips');
    expect(geo?.isFallback).toBe(true);
  });

  it('should keep Matematika in Fase E as matematika without fallback', () => {
    const mtk = resolveMapelCP('Matematika', 'E');
    expect(mtk?.slug).toBe('matematika');
    expect(mtk?.filterNama).toBe('Matematika');
    expect(mtk?.isFallback).toBe(false);
  });

  it('should disambiguate Matematika, Agama Konghucu, Koding SMK, Sejarah SMA vs SMK, and local-only subjects', () => {
    expect(resolveMapelCP('Matematika Tingkat Lanjut', 'F')?.filterNama).toBe(
      'Matematika Tingkat Lanjut'
    );
    expect(resolveMapelCP('Agama Konghucu', 'D')?.filterNama).toBe(
      'Pendidikan Agama Khonghucu'
    );
    expect(resolveMapelCP('Koding dan Kecerdasan Artifisial (SMK/MAK)', 'E')?.filterNama).toBe(
      'Koding dan Kecerdasan Artifisial (SMK/MAK)'
    );

    const sejSmaE = resolveMapelCP('Sejarah', 'E');
    expect(sejSmaE?.isFallback).toBe(true);
    expect(sejSmaE?.slug).toBe('ilmu-pengetahuan-sosial-ips');
    expect(sejSmaE?.filterNama).toBeUndefined();

    const sejSmkE = resolveMapelCP('Sejarah (SMK/MAK)', 'E');
    expect(sejSmkE?.isFallback).toBe(false);
    expect(sejSmkE?.slug).toBe('sejarah');
    expect(sejSmkE?.filterNama).toBe('Sejarah (SMK/MAK)');

    expect(resolveMapelCP('PAUD', 'Fondasi')?.isMasterOnly).toBe(true);
    expect(resolveMapelCP('Projek IPAS', 'E')?.isMasterOnly).toBe(true);
    expect(findMapelSlug('Prakarya dan Kewirausahaan')).toBeNull();
  });

  it('should prefer exact normalized match in filterMapelByNama without picking Matematika Tingkat Lanjut', () => {
    const list = [{ nama: 'Matematika' }, { nama: 'Matematika Tingkat Lanjut' }];
    expect(filterMapelByNama(list, 'Matematika')).toEqual([{ nama: 'Matematika' }]);
    expect(filterMapelByNama(list, 'Matematika Tingkat Lanjut')).toEqual([
      { nama: 'Matematika Tingkat Lanjut' },
    ]);
    expect(
      filterMapelByNama([{ nama: 'Pendidikan Agama Khonghucu dan Budi Pekerti' }], 'Konghucu')
    ).toHaveLength(1);
  });
});
