import { useState, useEffect } from 'react';
import { BarChart3, BookOpen, FileText, ClipboardList, GraduationCap, Library, ArrowUpDown, Image, Loader2, TrendingUp, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface GenerationLog {
  content_type: string;
  metadata: Record<string, any> | null;
  created_at: string;
}

const CONTENT_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  modul: { label: 'Modul Ajar', icon: <BookOpen className="w-4 h-4" />, color: 'text-primary' },
  lkpd: { label: 'LKPD', icon: <FileText className="w-4 h-4" />, color: 'text-blue-600' },
  asesmen: { label: 'Asesmen', icon: <ClipboardList className="w-4 h-4" />, color: 'text-amber-600' },
  materi: { label: 'Materi Ajar', icon: <GraduationCap className="w-4 h-4" />, color: 'text-green-600' },
  bank_soal: { label: 'Bank Soal', icon: <Library className="w-4 h-4" />, color: 'text-purple-600' },
  tindak_lanjut: { label: 'Tindak Lanjut', icon: <ArrowUpDown className="w-4 h-4" />, color: 'text-rose-600' },
  image: { label: 'Gambar', icon: <Image className="w-4 h-4" />, color: 'text-cyan-600' },
};

interface UsageStatsProps {
  userId: string;
}

export const UsageStats = ({ userId }: UsageStatsProps) => {
  const [logs, setLogs] = useState<GenerationLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('generation_logs')
        .select('content_type, metadata, created_at')
        .eq('user_id', userId);

      if (!error && data) {
        setLogs(data as GenerationLog[]);
      }
      setIsLoading(false);
    };
    fetchLogs();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="bg-card border-2 border-foreground rounded-xl p-6 shadow-brutal">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Calculate stats
  const total = logs.length;
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisWeek = logs.filter(l => new Date(l.created_at) >= weekAgo).length;

  // Breakdown by type
  const typeBreakdown: Record<string, number> = {};
  logs.forEach(l => {
    typeBreakdown[l.content_type] = (typeBreakdown[l.content_type] || 0) + 1;
  });
  const sortedTypes = Object.entries(typeBreakdown).sort((a, b) => b[1] - a[1]);

  // Breakdown by subject
  const subjectBreakdown: Record<string, number> = {};
  logs.forEach(l => {
    const subject = (l.metadata as any)?.mata_pelajaran || null;
    if (subject) {
      subjectBreakdown[subject] = (subjectBreakdown[subject] || 0) + 1;
    }
  });
  const sortedSubjects = Object.entries(subjectBreakdown).sort((a, b) => b[1] - a[1]);
  const topSubject = sortedSubjects.length > 0 ? sortedSubjects[0][0] : '-';

  return (
    <div className="bg-card border-2 border-foreground rounded-xl p-6 shadow-brutal">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-accent/30 rounded-lg border-2 border-accent/50">
          <BarChart3 className="w-6 h-6 text-accent-foreground" />
        </div>
        <div>
          <h2 className="text-lg font-bold">📊 Statistik Penggunaan Saya</h2>
          <p className="text-sm text-muted-foreground">Riwayat konten yang sudah Anda generate</p>
        </div>
      </div>

      {total === 0 ? (
        <div className="text-center py-6 text-muted-foreground text-sm">
          Belum ada konten yang di-generate. Mulai buat modul ajar pertama Anda!
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-3 bg-primary/10 border-2 border-primary/30 rounded-lg text-center">
              <TrendingUp className="w-5 h-5 mx-auto mb-1 text-primary" />
              <div className="text-2xl font-extrabold text-foreground">{total}</div>
              <div className="text-xs font-medium text-muted-foreground">Total Konten</div>
            </div>
            <div className="p-3 bg-success/10 border-2 border-success/30 rounded-lg text-center">
              <Calendar className="w-5 h-5 mx-auto mb-1 text-success" />
              <div className="text-2xl font-extrabold text-foreground">{thisWeek}</div>
              <div className="text-xs font-medium text-muted-foreground">Minggu Ini</div>
            </div>
            <div className="p-3 bg-info/10 border-2 border-info/30 rounded-lg text-center">
              <BookOpen className="w-5 h-5 mx-auto mb-1 text-info" />
              <div className="text-sm font-extrabold text-foreground truncate">{topSubject}</div>
              <div className="text-xs font-medium text-muted-foreground">Mapel Terbanyak</div>
            </div>
          </div>

          {/* Type Breakdown */}
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">Per Tipe Konten</h3>
            <div className="space-y-2">
              {sortedTypes.map(([type, count]) => {
                const config = CONTENT_TYPE_CONFIG[type] || { label: type, icon: <FileText className="w-4 h-4" />, color: 'text-foreground' };
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={type} className="flex items-center gap-3 p-2 rounded-lg bg-background border border-foreground/10">
                    <span className={config.color}>{config.icon}</span>
                    <span className="text-sm font-medium flex-1">{config.label}</span>
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm font-bold w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subject Breakdown */}
          {sortedSubjects.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase text-muted-foreground mb-2">Per Mata Pelajaran</h3>
              <div className="space-y-1">
                {sortedSubjects.map(([subject, count]) => (
                  <div key={subject} className="flex items-center justify-between p-2 rounded-lg bg-background border border-foreground/10">
                    <span className="text-sm">{subject}</span>
                    <span className="text-sm font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
