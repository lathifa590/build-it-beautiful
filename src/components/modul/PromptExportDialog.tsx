import { useState, useMemo } from 'react';
import { Copy, Check, Sparkles, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  buildHumanPrompt,
  PROMPT_TYPE_LABELS,
  AI_MODE_LABELS,
  AI_MODE_INFO,
  AI_MODE_TIPS,
  AI_MODE_EXTRA_TIPS,
  type PromptType,
  type AiMode,
} from '@/lib/prompt-builder';
import type { FormData, SoalConfig } from '@/types/modul';

interface PromptExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: FormData;
  soalConfig?: SoalConfig;
}

const TYPES: PromptType[] = ['modul', 'lkpd', 'asesmen', 'materi', 'soal', 'refleksi'];
const AI_MODES: AiMode[] = ['universal', 'claude', 'chatgpt', 'gemini'];

export const PromptExportDialog = ({
  open,
  onOpenChange,
  formData,
  soalConfig,
}: PromptExportDialogProps) => {
  const [selectedType, setSelectedType] = useState<PromptType>('modul');
  const [aiMode, setAiMode] = useState<AiMode>('universal');
  const [copied, setCopied] = useState(false);

  const prompt = useMemo(
    () => buildHumanPrompt(selectedType, formData, soalConfig, aiMode),
    [selectedType, formData, soalConfig, aiMode]
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = prompt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Export Prompt AI
          </DialogTitle>
          <DialogDescription>
            Salin prompt ini dan paste ke ChatGPT, Claude, atau Gemini untuk hasil serupa.
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {/* Type Selector */}
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${
                  selectedType === t
                    ? 'bg-primary text-primary-foreground border-primary shadow-brutal-sm'
                    : 'bg-card text-foreground border-foreground/20 hover:border-foreground/40'
                }`}
              >
                {PROMPT_TYPE_LABELS[t]}
              </button>
            ))}
          </div>

          {/* AI Mode Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Pilih AI tujuan:</label>
            <div className="flex flex-wrap gap-1.5">
              {AI_MODES.map((mode) => (
                <button
                  key={mode}
                  onClick={() => setAiMode(mode)}
                  className={`px-3 py-1 text-xs rounded-full border transition-all font-medium ${
                    aiMode === mode
                      ? 'bg-accent text-accent-foreground border-accent shadow-sm'
                      : 'bg-card text-muted-foreground border-border hover:border-foreground/40'
                  }`}
                >
                  {AI_MODE_LABELS[mode]}
                </button>
              ))}
            </div>
          </div>

          {/* Mode Info */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 text-xs text-muted-foreground">
            <Info className="w-3.5 h-3.5 shrink-0" />
            {AI_MODE_INFO[aiMode]}
          </div>

          {/* Tips statis — TIDAK masuk body prompt (hemat token) */}
          <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 space-y-1">
            <p className="text-xs font-semibold text-foreground flex items-center gap-1">
              <span>💡</span> Tips Penggunaan
            </p>
            <p className="text-xs text-muted-foreground">{AI_MODE_TIPS[aiMode]}</p>
            <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
              {AI_MODE_EXTRA_TIPS[aiMode].map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </div>

          {/* Prompt Preview */}
          <Textarea
            value={prompt}
            readOnly
            className="min-h-[150px] sm:min-h-[250px] text-xs font-mono resize-none bg-muted/50"
          />
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2 border-t">
          <Button onClick={handleCopy} className="gap-2 font-bold w-full sm:w-auto shrink-0">
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                Tersalin!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Salin Prompt
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
