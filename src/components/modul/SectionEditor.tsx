import React, { useState, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Sparkles, Save, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SectionEditorProps {
  isOpen: boolean;
  onClose: () => void;
  sectionId: string;
  sectionLabel: string;
  currentContent: unknown;
  onSave: (sectionId: string, newContent: unknown) => void;
  formContext?: { mataPelajaran?: string; materi?: string; kelas?: string };
}

// Convert content to editable text
const contentToText = (content: unknown): string => {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.map(item => {
    if (typeof item === 'string') return item;
    if (typeof item === 'object' && item !== null) return JSON.stringify(item, null, 2);
    return String(item);
  }).join('\n');
  if (typeof content === 'object' && content !== null) return JSON.stringify(content, null, 2);
  return String(content ?? '');
};

// Parse text back to original format
const textToContent = (text: string, originalContent: unknown): unknown => {
  if (typeof originalContent === 'string') return text;
  if (Array.isArray(originalContent)) {
    // Check if original items were strings
    if (originalContent.length === 0 || typeof originalContent[0] === 'string') {
      return text.split('\n').filter(line => line.trim());
    }
    // Try JSON parse for complex items
    try {
      return JSON.parse(`[${text.split('\n').filter(l => l.trim()).join(',')}]`);
    } catch {
      return text.split('\n').filter(line => line.trim());
    }
  }
  if (typeof originalContent === 'object') {
    try { return JSON.parse(text); } catch { return text; }
  }
  return text;
};

export const SectionEditor: React.FC<SectionEditorProps> = ({
  isOpen,
  onClose,
  sectionId,
  sectionLabel,
  currentContent,
  onSave,
  formContext,
}) => {
  const [editedText, setEditedText] = useState(() => contentToText(currentContent));
  const [aiInstruction, setAiInstruction] = useState('');
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeMode, setActiveMode] = useState<string>('manual');

  // Reset state when content changes
  React.useEffect(() => {
    setEditedText(contentToText(currentContent));
    setAiResult(null);
    setAiInstruction('');
  }, [currentContent, sectionId]);

  const handleManualSave = useCallback(() => {
    const newContent = textToContent(editedText, currentContent);
    onSave(sectionId, newContent);
    onClose();
  }, [editedText, currentContent, sectionId, onSave, onClose]);

  const handleAiGenerate = useCallback(async () => {
    if (!aiInstruction.trim()) return;
    setIsGenerating(true);
    setAiResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: {
          type: 'edit-section',
          data: {
            section_type: sectionId,
            section_label: sectionLabel,
            current_content: contentToText(currentContent),
            instruction: aiInstruction,
            context: formContext || {},
          },
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const result = data?.data?.edited_content;
      if (result) {
        setAiResult(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
      } else {
        throw new Error('Format response tidak valid');
      }
    } catch (err) {
      console.error('AI edit error:', err);
      setAiResult(`❌ Gagal: ${err instanceof Error ? err.message : 'Terjadi kesalahan'}`);
    } finally {
      setIsGenerating(false);
    }
  }, [aiInstruction, currentContent, sectionId, sectionLabel, formContext]);

  const handleApplyAiResult = useCallback(() => {
    if (!aiResult || aiResult.startsWith('❌')) return;
    const newContent = textToContent(aiResult, currentContent);
    onSave(sectionId, newContent);
    onClose();
  }, [aiResult, currentContent, sectionId, onSave, onClose]);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left">
            ✏️ Edit: {sectionLabel}
          </SheetTitle>
        </SheetHeader>

        <Tabs value={activeMode} onValueChange={setActiveMode} className="mt-4">
          <TabsList className="w-full">
            <TabsTrigger value="manual" className="flex-1">Edit Manual</TabsTrigger>
            <TabsTrigger value="ai" className="flex-1">
              <Sparkles className="w-3 h-3 mr-1" />
              Edit with AI
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <Textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              rows={15}
              className="font-mono text-sm"
              placeholder="Edit konten di sini..."
            />
            <p className="text-xs text-muted-foreground">
              {Array.isArray(currentContent)
                ? 'Satu item per baris. Baris kosong akan diabaikan.'
                : 'Edit teks langsung di atas.'}
            </p>
            <Button onClick={handleManualSave} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Simpan Perubahan
            </Button>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4 mt-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">Konten saat ini:</p>
              <pre className="text-xs max-h-32 overflow-y-auto whitespace-pre-wrap">
                {contentToText(currentContent).substring(0, 500)}
                {contentToText(currentContent).length > 500 ? '...' : ''}
              </pre>
            </div>

            <div className="flex gap-2">
              <Input
                value={aiInstruction}
                onChange={(e) => setAiInstruction(e.target.value)}
                placeholder='Contoh: "ganti dengan pertanyaan tentang lingkungan"'
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAiGenerate()}
              />
              <Button
                onClick={handleAiGenerate}
                disabled={isGenerating || !aiInstruction.trim()}
                size="icon"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>

            {isGenerating && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
                AI sedang mengedit...
              </div>
            )}

            {aiResult && !aiResult.startsWith('❌') && (
              <div className="space-y-3">
                <div className="bg-accent/30 rounded-lg p-3">
                  <p className="text-xs font-medium text-accent-foreground mb-2">✨ Hasil AI:</p>
                  <pre className="text-xs max-h-48 overflow-y-auto whitespace-pre-wrap">
                    {aiResult}
                  </pre>
                </div>
                <Button onClick={handleApplyAiResult} className="w-full">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Terapkan Hasil AI
                </Button>
              </div>
            )}

            {aiResult && aiResult.startsWith('❌') && (
              <div className="bg-destructive/10 text-destructive text-sm rounded-lg p-3">
                {aiResult}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
