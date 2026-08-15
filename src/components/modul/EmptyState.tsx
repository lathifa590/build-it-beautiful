import { Layout, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface EmptyStateProps {
  onOpenPlanning?: () => void;
  generationProgress?: { current: number; total: number; retrying?: boolean } | null;
  loading?: boolean;
}

export const EmptyState = ({ onOpenPlanning, generationProgress, loading }: EmptyStateProps) => {
  // Show progress indicator during multi-meeting generation
  if (loading && generationProgress) {
    const progressPercent = (generationProgress.current / generationProgress.total) * 100;
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-muted-foreground">
        <div className="bg-secondary/50 p-8 rounded-2xl border-2 border-dashed border-primary/30 max-w-md w-full">
          <Loader2 className="w-16 h-16 mb-6 opacity-60 mx-auto animate-spin text-primary" />
          <h3 className="text-xl font-bold text-foreground text-center">
            Membuat Pertemuan {generationProgress.current} dari {generationProgress.total}...
          </h3>
          <p className="text-center text-sm mt-2 mb-4">
            {generationProgress.retrying
              ? `Mencoba ulang generate pertemuan ke-${generationProgress.current}...`
              : generationProgress.current === 1
              ? 'Sedang membuat struktur modul dan pertemuan pertama...'
              : `Melanjutkan generate pertemuan ke-${generationProgress.current} dengan konteks pertemuan sebelumnya...`}
          </p>
          <Progress value={progressPercent} className="h-2" />
          <p className="text-center text-xs mt-2 text-muted-foreground">
            {Math.round(progressPercent)}% selesai
          </p>
        </div>
      </div>
    );
  }

  // Show simple loading for ≤ 2 meetings
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-muted-foreground">
        <div className="bg-secondary/50 p-8 rounded-2xl border-2 border-dashed border-primary/30">
          <Loader2 className="w-16 h-16 mb-6 opacity-60 mx-auto animate-spin text-primary" />
          <h3 className="text-xl font-bold text-foreground text-center">Membuat Modul Ajar...</h3>
          <p className="text-center text-sm mt-2">Sedang generate konten dengan AI, mohon tunggu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 text-muted-foreground">
      <div className="bg-secondary/50 p-8 rounded-2xl border-2 border-dashed border-muted-foreground/30">
        <Layout className="w-20 h-20 mb-6 opacity-30 mx-auto" />
        <h3 className="text-2xl font-bold text-muted-foreground text-center">Workspace Kosong</h3>
        <p className="text-center max-w-sm mt-2">
          Isi formulir di sebelah kiri dan klik <strong>Generate Modul</strong> untuk memulai.
        </p>
        {onOpenPlanning && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenPlanning}
              className="border-2 border-foreground/20 text-xs"
            >
              <Calendar className="w-4 h-4 mr-1.5" />
              Buka Perencanaan (Prota)
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
