import { useState } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Loader2,
  X,
  Send,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Props {
  prompt: string;
  enriched?: string;
  pertanyaan?: string;
  apiKeys: string[];
  onEnrichedChange?: (v: string | undefined) => void;
}

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
}

async function getInvokeErrorMessage(err: unknown): Promise<string> {
  if (err instanceof FunctionsHttpError) {
    try {
      const text = await err.context.text();
      try {
        const j = JSON.parse(text);
        return j.error || j.message || text;
      } catch {
        return text;
      }
    } catch {
      return err.message;
    }
  }
  return err instanceof Error ? err.message : String(err);
}

export const ImagePromptCard: React.FC<Props> = ({
  prompt,
  enriched,
  pertanyaan,
  apiKeys,
  onEnrichedChange,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [history, setHistory] = useState<ChatMsg[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [internalEnriched, setInternalEnriched] = useState<string | undefined>(undefined);
  const [collapsed, setCollapsed] = useState(false);
  const [view, setView] = useState<'original' | 'enriched'>('enriched');

  const currentEnriched = (onEnrichedChange ? enriched : internalEnriched);
  const setEnriched = (v: string | undefined) => {
    if (onEnrichedChange) onEnrichedChange(v);
    else setInternalEnriched(v);
  };

  const displayPrompt =
    view === 'original' || !currentEnriched ? (prompt || '') : currentEnriched;

  const runEnrich = async () => {
    if (loading) return;
    if (apiKeys.length === 0) {
      toast({
        title: 'API key Gemini belum ada',
        description: 'Tambahkan di halaman Pengaturan.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('enrich-image-prompt', {
        body: {
          mode: 'enrich',
          pertanyaan,
          current_prompt: prompt,
          apiKeys,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.prompt) {
        setEnriched(data.prompt);
        setHistory([]);
        setView('enriched');
        setCollapsed(false);
      }
    } catch (err) {
      const msg = await getInvokeErrorMessage(err);
      toast({ title: 'Gagal enrich prompt', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const sendRefine = async () => {
    const instr = instruction.trim();
    if (instr.length < 2 || instr.length > 500 || chatLoading) return;
    setChatLoading(true);
    const newHistory: ChatMsg[] = [...history, { role: 'user', content: instr }];
    setHistory(newHistory);
    setInstruction('');
    try {
      const { data, error } = await supabase.functions.invoke('enrich-image-prompt', {
        body: {
          mode: 'refine',
          current_prompt: currentEnriched || prompt,
          instruction: instr,
          history: newHistory.slice(-8),
          apiKeys,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.prompt) {
        setEnriched(data.prompt);
        setView('enriched');
        setHistory([...newHistory, { role: 'assistant', content: 'Prompt diperbarui.' }]);
      }
    } catch (err) {
      const msg = await getInvokeErrorMessage(err);
      toast({ title: 'Gagal refine prompt', description: msg, variant: 'destructive' });
      setHistory(newHistory);
    } finally {
      setChatLoading(false);
    }
  };

  const copy = async () => {
    if (!displayPrompt) return;
    try {
      await navigator.clipboard.writeText(displayPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* noop */
    }
  };

  const reset = () => {
    setEnriched(undefined);
    setHistory([]);
    setShowChat(false);
    setView('enriched');
  };

  const hasEnriched = !!currentEnriched;

  return (
    <div
      data-no-export="true"
      className="border-2 border-foreground/30 bg-card rounded-md my-2 print:hidden shadow-brutal-sm"
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left hover:bg-muted/30 rounded-t-md"
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wide">Prompt Gambar AI</span>
          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">EN</span>
          {hasEnriched && (
            <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-bold">
              ENRICHED
            </span>
          )}
          <span className="text-[10px] text-muted-foreground truncate">
            · untuk ChatGPT / Gemini / Midjourney
          </span>
        </div>
        {collapsed ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {!collapsed && (
        <div className="px-3 pb-3 space-y-2">
          {!hasEnriched ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Buat prompt English yang detail untuk ChatGPT / Gemini / Midjourney.
              </p>
              <Button
                size="sm"
                onClick={runEnrich}
                disabled={loading || apiKeys.length === 0}
                className="gap-2 w-full sm:w-auto"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {loading ? 'Membuat...' : 'Enrich Prompt'}
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* View toggle */}
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setView('original')}
                  className={`text-[11px] font-bold px-2 py-1 rounded border-2 ${
                    view === 'original'
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-background text-foreground border-foreground/30 hover:border-foreground/60'
                  }`}
                >
                  Original
                </button>
                <button
                  type="button"
                  onClick={() => setView('enriched')}
                  className={`text-[11px] font-bold px-2 py-1 rounded border-2 ${
                    view === 'enriched'
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-background text-foreground border-foreground/30 hover:border-foreground/60'
                  }`}
                >
                  Enriched
                </button>
              </div>

              <div className="text-xs bg-muted/50 p-2 rounded border border-border font-mono whitespace-pre-wrap break-words max-h-44 overflow-y-auto">
                {displayPrompt || <span className="text-muted-foreground italic">Kosong</span>}
              </div>

              <div className="flex flex-wrap gap-1.5">
                <Button size="sm" variant="outline" onClick={copy} className="gap-1.5 h-7 text-xs">
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Tersalin' : 'Copy Prompt'}
                </Button>
                <Button
                  size="sm"
                  onClick={runEnrich}
                  disabled={loading}
                  className="gap-1.5 h-7 text-xs"
                >
                  {loading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  Buat Ulang
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowChat((s) => !s)}
                  className="gap-1.5 h-7 text-xs"
                >
                  <MessageSquare className="w-3 h-3" />
                  Refine via Chat
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={reset}
                  className="gap-1.5 h-7 text-xs"
                >
                  <X className="w-3 h-3" />
                  Reset
                </Button>
              </div>

              {showChat && (
                <div className="border border-border rounded p-2 space-y-2 bg-background">
                  {history.length > 0 && (
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {history.slice(-8).map((m, i) => (
                        <div
                          key={i}
                          className={`text-[11px] px-2 py-1 rounded ${
                            m.role === 'user'
                              ? 'bg-primary/10 text-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          <span className="font-bold mr-1">
                            {m.role === 'user' ? 'Anda:' : 'AI:'}
                          </span>
                          {m.content}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-1.5 items-end">
                    <Textarea
                      value={instruction}
                      onChange={(e) => setInstruction(e.target.value.slice(0, 500))}
                      placeholder="Contoh: ganti balon jadi biru, tambahkan latar taman..."
                      className="min-h-[52px] text-xs resize-none"
                      disabled={chatLoading}
                    />
                    <Button
                      size="sm"
                      onClick={sendRefine}
                      disabled={chatLoading || instruction.trim().length < 2}
                      className="h-9 gap-1"
                    >
                      {chatLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-right">
                    {instruction.length}/500
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Footer: quick links + not-exported note */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/50">
            <div className="flex items-center gap-2">
              <a
                href="https://gemini.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-muted-foreground hover:text-primary inline-flex items-center gap-0.5"
              >
                <ExternalLink className="w-3 h-3" />
                Gemini
              </a>
              <a
                href="https://chatgpt.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-muted-foreground hover:text-primary inline-flex items-center gap-0.5"
              >
                <ExternalLink className="w-3 h-3" />
                ChatGPT
              </a>
            </div>
            <span className="text-[10px] text-muted-foreground italic">
              Tidak ikut diexport ke Word
            </span>
          </div>

          {apiKeys.length === 0 && (
            <p className="text-[11px] text-amber-600">
              ⚠ Tambahkan API key Gemini di Pengaturan untuk memakai fitur ini.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
