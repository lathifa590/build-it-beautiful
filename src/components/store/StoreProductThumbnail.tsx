import React, { useState } from 'react';
import { BookOpen, FileText, Sparkles, Layers } from 'lucide-react';

interface StoreProductThumbnailProps {
  title: string;
  previewImageUrl?: string | null;
  category?: string | null;
  index?: number;
  className?: string;
  aspectRatio?: '4/3' | '16/9' | 'square' | 'auto';
  badgeOffsetTop?: boolean;
  compact?: boolean;
}

// 6 Palet Warna Neobrutalisme Kaya, Kontras Tinggi & Menarik
const THEME_PALETTES = [
  {
    bg: 'from-[#1e40af] via-[#2563eb] to-[#3b82f6]', // Royal Blue
    accentCircle: 'border-blue-200/50 bg-blue-400/20',
    tagBg: 'bg-[#facc15] text-[#111]', // Kuning Terang
    tagBorder: 'border-[#111]',
    categoryBg: 'bg-black/75 text-white border-white/40',
    footerBorder: 'border-white/25',
  },
  {
    bg: 'from-[#065f46] via-[#059669] to-[#10b981]', // Emerald Green
    accentCircle: 'border-emerald-200/50 bg-emerald-400/20',
    tagBg: 'bg-[#fef08a] text-[#111]',
    tagBorder: 'border-[#111]',
    categoryBg: 'bg-black/75 text-white border-white/40',
    footerBorder: 'border-white/25',
  },
  {
    bg: 'from-[#9a3412] via-[#ea580c] to-[#f97316]', // Sunset Orange
    accentCircle: 'border-orange-200/50 bg-orange-400/20',
    tagBg: 'bg-[#fef08a] text-[#111]',
    tagBorder: 'border-[#111]',
    categoryBg: 'bg-black/75 text-white border-white/40',
    footerBorder: 'border-white/25',
  },
  {
    bg: 'from-[#581c87] via-[#7c3aed] to-[#8b5cf6]', // Deep Violet
    accentCircle: 'border-purple-200/50 bg-purple-400/20',
    tagBg: 'bg-[#fef08a] text-[#111]',
    tagBorder: 'border-[#111]',
    categoryBg: 'bg-black/75 text-white border-white/40',
    footerBorder: 'border-white/25',
  },
  {
    bg: 'from-[#0f766e] via-[#0891b2] to-[#06b6d4]', // Deep Cyan / Teal
    accentCircle: 'border-cyan-200/50 bg-cyan-400/20',
    tagBg: 'bg-[#fef08a] text-[#111]',
    tagBorder: 'border-[#111]',
    categoryBg: 'bg-black/75 text-white border-white/40',
    footerBorder: 'border-white/25',
  },
  {
    bg: 'from-[#9f1239] via-[#e11d48] to-[#f43f5e]', // Bold Rose
    accentCircle: 'border-rose-200/50 bg-rose-400/20',
    tagBg: 'bg-[#fef08a] text-[#111]',
    tagBorder: 'border-[#111]',
    categoryBg: 'bg-black/75 text-white border-white/40',
    footerBorder: 'border-white/25',
  },
];

// Helper deterministik untuk memilih palet warna berdasarkan hash teks
const getPaletteIndex = (seedText: string, fallbackIdx?: number): number => {
  if (typeof fallbackIdx === 'number' && fallbackIdx >= 0) {
    return fallbackIdx % THEME_PALETTES.length;
  }
  let hash = 0;
  for (let i = 0; i < seedText.length; i++) {
    hash = (hash << 5) - hash + seedText.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % THEME_PALETTES.length;
};

export const StoreProductThumbnail: React.FC<StoreProductThumbnailProps> = ({
  title,
  previewImageUrl,
  category,
  index,
  className = '',
  aspectRatio = '4/3',
  badgeOffsetTop = false,
  compact = false,
}) => {
  const [imgLoadError, setImgLoadError] = useState(false);

  // Jika previewImageUrl valid dan tidak error saat dimuat
  const showCustomImage = !!previewImageUrl && !imgLoadError;

  const displayTitle = title?.trim() || 'Modul Ajar Kurikulum Merdeka';
  const displayCategory = category?.trim() || '';

  const paletteIdx = getPaletteIndex(displayTitle + displayCategory, index);
  const palette = THEME_PALETTES[paletteIdx];

  const aspectClass =
    aspectRatio === '4/3'
      ? 'aspect-[4/3]'
      : aspectRatio === '16/9'
      ? 'aspect-[16/9]'
      : aspectRatio === 'square'
      ? 'aspect-square'
      : '';

  return (
    <div
      className={`relative w-full overflow-hidden select-none bg-slate-900 ${aspectClass} ${className}`}
    >
      {showCustomImage ? (
        <img
          src={previewImageUrl}
          alt={displayTitle}
          onError={() => setImgLoadError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        /* Cover Visual Berjudul - Neobrutalism Bertaraf Profesional */
        <div
          className={`relative w-full h-full bg-gradient-to-br ${palette.bg} p-3 sm:p-3.5 text-white flex flex-col justify-between overflow-hidden`}
        >
          {/* Tekstur Dotted Grid Taktil */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage:
                'radial-gradient(circle, #ffffff 1.2px, transparent 1.2px)',
              backgroundSize: '11px 11px',
            }}
          />

          {/* Ornamen Lingkaran Geometris Khas Neobrutalisme */}
          <div
            className={`absolute -right-8 -bottom-8 w-28 h-28 rounded-full border-2 ${palette.accentCircle} pointer-events-none`}
          />
          <div
            className={`absolute -right-3 -bottom-3 w-16 h-16 rounded-full border-2 ${palette.accentCircle} pointer-events-none`}
          />

          {/* Ikon Watermark Latar Belakang */}
          <BookOpen
            className="absolute -right-2 -bottom-2 w-20 h-20 text-white/10 -rotate-12 pointer-events-none"
          />

          {/* Area Atas: Header Cover */}
          <div
            className={`relative z-[1] flex items-center justify-between gap-1.5 ${
              badgeOffsetTop ? 'pt-8 sm:pt-9' : ''
            }`}
          >
            <div className="flex items-center gap-1.5 flex-wrap">
              {displayCategory && (
                <span
                  className={`${palette.categoryBg} font-black text-[9px] sm:text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider backdrop-blur-xs shadow-xs`}
                >
                  {displayCategory}
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1 ${palette.tagBg} ${palette.tagBorder} font-black text-[9px] sm:text-[9.5px] px-1.5 py-0.5 rounded border shadow-[1px_1px_0px_#111] uppercase tracking-tight`}
              >
                <Sparkles className="w-2.5 h-2.5 fill-current" />
                SIAP PAKAI
              </span>
            </div>
            
            <span className="text-[9px] sm:text-[10px] font-extrabold text-white/95 bg-white/20 px-1.5 py-0.5 rounded border border-white/25 shrink-0">
              .DOCX
            </span>
          </div>

          {/* Area Bawah: Judul Produk & Footer Modul */}
          <div className="relative z-[1] mt-auto pt-2 space-y-1.5">
            <h3
              className={`font-black tracking-tight leading-snug text-white drop-shadow-[1.5px_1.5px_0px_rgba(0,0,0,0.85)] line-clamp-3 ${
                compact
                  ? 'text-[11px] sm:text-xs'
                  : 'text-xs sm:text-[13px] md:text-sm'
              }`}
              title={displayTitle}
            >
              {displayTitle}
            </h3>

            {/* Footer Baris Modul Ajar */}
            <div
              className={`flex items-center justify-between text-[9px] sm:text-[10px] font-bold text-white/85 pt-1.5 border-t ${palette.footerBorder}`}
            >
              <span className="truncate max-w-[140px] sm:max-w-[170px]">
                Kurikulum Merdeka
              </span>
              <span className="text-white font-black shrink-0">
                100% Siap Edit
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

