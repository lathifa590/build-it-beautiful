import React, { useRef, useState } from 'react';
import { ImageIcon, RefreshCw, Loader2, AlertCircle, Upload, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { ImagePromptCard } from './ImagePromptCard';
import { useGeminiKeys } from '@/hooks/useGeminiKeys';
import { useToast } from '@/hooks/use-toast';

interface StimulusImageGeneratorProps {
  prompt: string;
  imageUrl: string | null;
  onImageGenerated: (url: string) => void;
  disabled?: boolean;
  size?: 'small' | 'medium';
  enableEnrich?: boolean;
  pertanyaan?: string;
  enriched?: string;
  onEnrichedChange?: (v: string | undefined) => void;
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_WIDTH = 1200;

async function compressImage(file: File): Promise<Blob> {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('read fail'));
    r.readAsDataURL(file);
  });
  const img: HTMLImageElement = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('img fail'));
    i.src = dataUrl;
  });
  const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1;
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas ctx');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('blob fail'))),
      'image/jpeg',
      0.85,
    );
  });
}

async function invokeErr(err: unknown): Promise<string> {
  if (err instanceof FunctionsHttpError) {
    try {
      const t = await err.context.text();
      try {
        const j = JSON.parse(t);
        return j.error || j.message || t;
      } catch {
        return t;
      }
    } catch {
      return err.message;
    }
  }
  return err instanceof Error ? err.message : String(err);
}

export const StimulusImageGenerator: React.FC<StimulusImageGeneratorProps> = ({
  prompt,
  imageUrl,
  onImageGenerated,
  disabled = false,
  size = 'medium',
  enableEnrich = false,
  pertanyaan,
  enriched,
  onEnrichedChange,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [limit, setLimit] = useState<number>(5);
  const { apiKeys } = useGeminiKeys();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isQuotaExceeded = remaining !== null && remaining <= 0;

  const generateImage = async () => {
    if (disabled || isQuotaExceeded) return;
    const effectivePrompt = ((enriched && enriched.trim()) || prompt || '').trim().slice(0, 1000);
    if (!effectivePrompt) {
      setError('Prompt kosong. Isi materi/pertanyaan terlebih dahulu.');
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-image', {
        body: { prompt: effectivePrompt },
      });
      if (fnError) {
        const msg = await invokeErr(fnError);
        throw new Error(msg);
      }
      if (data?.error) {
        if (data.remaining !== undefined) setRemaining(data.remaining);
        if (data.limit) setLimit(data.limit);
        throw new Error(data.error);
      }
      if (data?.imageUrl) {
        onImageGenerated(data.imageUrl);
        if (data.remaining !== undefined) setRemaining(data.remaining);
        if (data.limit) setLimit(data.limit);
      } else {
        throw new Error('Tidak ada URL gambar dalam response');
      }
    } catch (err) {
      console.error('Image generation error:', err);
      setError(err instanceof Error ? err.message : 'Gagal membuat gambar. Silakan coba lagi.');
    } finally {
      setIsGenerating(false);
    }
  };

  const openFilePicker = () => fileInputRef.current?.click();

  const handleFile = async (file: File) => {
    if (!ACCEPTED.includes(file.type)) {
      toast({
        title: 'Format tidak didukung',
        description: 'Gunakan JPG, PNG, atau WebP.',
        variant: 'destructive',
      });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast({
        title: 'File terlalu besar',
        description: 'Maksimal 2 MB.',
        variant: 'destructive',
      });
      return;
    }
    setIsUploading(true);
    setError(null);
    try {
      const blob = await compressImage(file);
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id?.slice(0, 6) || 'anon';
      const fileName = `up_${uid}_${Date.now()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from('stimulus-images')
        .upload(fileName, blob, { contentType: 'image/jpeg', upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('stimulus-images').getPublicUrl(fileName);
      if (pub?.publicUrl) {
        onImageGenerated(pub.publicUrl);
      } else {
        throw new Error('Gagal ambil public URL');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal upload gambar.';
      setError(msg);
      toast({ title: 'Gagal upload', description: msg, variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const removeImage = () => {
    onImageGenerated('');
    setError(null);
  };

  const enrichCard = enableEnrich ? (
    <ImagePromptCard
      prompt={prompt}
      enriched={enriched}
      pertanyaan={pertanyaan}
      apiKeys={apiKeys}
      onEnrichedChange={onEnrichedChange}
    />
  ) : null;

  const currentCount = remaining !== null ? limit - remaining : 0;
  const maxCount = limit;

  const formatInfo = (
    <span className="text-[10px] text-muted-foreground">
      JPG/PNG/WebP • maks 2 MB • auto-optimasi 1200px
    </span>
  );

  const hiddenInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept={ACCEPTED.join(',')}
      onChange={onFileChange}
      className="hidden"
    />
  );

  // ==== State: image already present ====
  if (imageUrl) {
    return (
      <div style={{ marginBottom: '12px' }}>
        <img
          src={imageUrl}
          alt="Stimulus visual"
          style={{
            maxWidth: '100%',
            maxHeight: size === 'small' ? '200px' : '300px',
            borderRadius: '6px',
            border: '1px solid #e5e7eb',
            display: 'block',
          }}
        />
        <div data-no-export="true" className="print:hidden">
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <Button
              onClick={openFilePicker}
              disabled={disabled || isUploading}
              variant="outline"
              size="sm"
              className="gap-2 h-8"
            >
              {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              Ganti Gambar
            </Button>
            <Button
              onClick={generateImage}
              disabled={disabled || isGenerating || isQuotaExceeded}
              variant="outline"
              size="sm"
              className="gap-2 h-8"
            >
              {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Regenerate
            </Button>
            <Button
              onClick={removeImage}
              variant="outline"
              size="sm"
              className="gap-2 h-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Hapus
            </Button>
            {formatInfo}
          </div>
          {error && (
            <div className="flex items-center gap-1.5 text-destructive text-xs mt-2">
              <AlertCircle className="w-3.5 h-3.5" />
              {error}
            </div>
          )}
          {remaining !== null && (
            <p style={{ fontSize: '0.7rem', color: '#9ca3af', marginTop: 6 }}>
              Sisa kuota: {remaining}/{maxCount} hari ini
            </p>
          )}
          {enrichCard}
          {hiddenInput}
        </div>
      </div>
    );
  }

  // ==== State: no image yet (whole block excluded from Word export) ====
  return (
    <div
      data-no-export="true"
      className="print:hidden"
      style={{
        backgroundColor: '#f3f4f6',
        border: '2px dashed #d1d5db',
        borderRadius: '8px',
        padding: size === 'small' ? '12px' : '16px',
        marginBottom: '12px',
        textAlign: 'center',
      }}
    >
      {enrichCard}

      <div style={{ color: '#6b7280', marginBottom: '12px' }}>
        <ImageIcon style={{ width: '32px', height: '32px', margin: '0 auto 8px', opacity: 0.5 }} />
        <p style={{ fontSize: '0.875rem', fontWeight: 500 }}>Gambar Stimulus (Opsional)</p>
        <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>
          Tambahkan ilustrasi visual untuk memperkaya stimulus
        </p>
      </div>

      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            color: '#dc2626',
            fontSize: '0.75rem',
            marginBottom: '8px',
          }}
        >
          <AlertCircle style={{ width: '14px', height: '14px' }} />
          {error}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          onClick={openFilePicker}
          disabled={disabled || isUploading}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload Gambar
        </Button>
        <Button
          onClick={generateImage}
          disabled={disabled || isGenerating || isQuotaExceeded}
          variant="secondary"
          size="sm"
          className="gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Membuat gambar...
            </>
          ) : (
            <>
              <ImageIcon className="h-4 w-4" />
              Generate Gambar
            </>
          )}
        </Button>
      </div>
      <div className="mt-2">{formatInfo}</div>

      {/* Kuota indicator */}
      <div style={{ marginTop: '12px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.7rem',
            color: '#9ca3af',
            marginBottom: '4px',
          }}
        >
          <span>Kuota Gambar</span>
          <span>{remaining !== null ? `${currentCount}/${maxCount}` : `0/${maxCount}`}</span>
        </div>
        <Progress value={(currentCount / maxCount) * 100} className="h-1.5" />
        {isQuotaExceeded && (
          <p style={{ fontSize: '0.7rem', color: '#f59e0b', marginTop: '4px' }}>
            Kuota gambar harian tercapai
          </p>
        )}
      </div>
      {hiddenInput}
    </div>
  );
};
