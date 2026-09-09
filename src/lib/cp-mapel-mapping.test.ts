import { describe, it, expect } from 'vitest';
import { resolveMapelCP, findMapelSlug } from './cp-mapel-mapping';

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
    expect(mtk?.isFallback).toBe(false);
  });
});
