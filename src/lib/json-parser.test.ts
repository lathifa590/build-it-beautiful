import { describe, it, expect } from 'vitest';
import {
  sanitizeJsonResponse,
  extractJsonFromResponse,
  parseGeneratedJson,
} from '../../supabase/functions/_shared/json-parser';

describe('shared json-parser', () => {
  it('preserves LaTeX commands starting with control-char letters (\\frac, \\theta, \\times)', () => {
    const raw = '```json\n{"rumus": "\\frac{1}{2} \\times \\theta + \\sqrt{x}"}\n```';
    const res = parseGeneratedJson(raw);
    expect(res.error).toBeUndefined();
    expect(res.parsed).toEqual({
      rumus: '\\frac{1}{2} \\times \\theta + \\sqrt{x}',
    });
  });

  it('repairs truncated JSON objects and arrays with trailing commas or ellipsis', () => {
    const truncated = 'Berikut hasilnya:\n{"items": [{"id": 1, "name": "TP 1"}, ...';
    const res = parseGeneratedJson(truncated);
    expect(res.error).toBeUndefined();
    expect(res.parsed).toEqual({
      items: [{ id: 1, name: 'TP 1' }],
    });
  });

  it('extracts JSON array when response is wrapped in prose', () => {
    const wrapped = 'Ini daftar TP:\n[{"kode": "TP.1"}]\nSemoga membantu.';
    expect(extractJsonFromResponse(wrapped)).toBe('[{"kode": "TP.1"}]');
    expect( sanitizeJsonResponse('```json\n{"a":1}\n```') ).toBe('{"a":1}');
  });
});
