// Hook wrapper untuk generateBab: menyediakan state progress, hasil parsial,
// dan fungsi cancel. Belum dipakai di UI utama; siap dipasang di Stage 6.

import { useCallback, useRef, useState } from 'react';
import { generateBab, type GenerateProgress } from '@/lib/bab-generator';
import type { BabResult, FormData, StrukturHierarki } from '@/types/modul';

export interface UseBabGeneratorState {
  isRunning: boolean;
  progress: GenerateProgress | null;
  result: BabResult | null;
  error: string | null;
}

export function useBabGenerator() {
  const [state, setState] = useState<UseBabGeneratorState>({
    isRunning: false,
    progress: null,
    result: null,
    error: null,
  });
  const cancelRef = useRef(false);

  const start = useCallback(
    async (formData: FormData, struktur: StrukturHierarki) => {
      cancelRef.current = false;
      setState({ isRunning: true, progress: null, result: null, error: null });
      try {
        const result = await generateBab({
          formData,
          struktur,
          onProgress: (p) => setState((s) => ({ ...s, progress: p })),
          onPartial: (r) => setState((s) => ({ ...s, result: r })),
          isCancelled: () => cancelRef.current,
        });
        setState((s) => ({ ...s, isRunning: false, result }));
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setState((s) => ({
          ...s,
          isRunning: false,
          error: msg === 'CANCELLED' ? 'Dibatalkan' : msg,
        }));
        return null;
      }
    },
    []
  );

  const cancel = useCallback(() => {
    cancelRef.current = true;
  }, []);

  const reset = useCallback(() => {
    cancelRef.current = false;
    setState({ isRunning: false, progress: null, result: null, error: null });
  }, []);

  return { ...state, start, cancel, reset };
}
