import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCw, AlertTriangle, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    // Clear cache indicator and reload
    sessionStorage.removeItem('vite-preload-reloaded');
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const isChunkError =
        this.state.error?.message?.includes('dynamically imported module') ||
        this.state.error?.message?.includes('default') ||
        this.state.error?.message?.includes('MIME type');

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-card border-2 border-foreground rounded-2xl p-6 shadow-brutal text-center space-y-4">
            <div className="w-14 h-14 bg-destructive/15 border-2 border-foreground rounded-2xl flex items-center justify-center mx-auto shadow-brutal-sm">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-foreground">
                {isChunkError ? 'Pembaruan Sistem Tersedia' : 'Terjadi Kendala Teknis'}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {isChunkError
                  ? 'Aplikasi baru saja diperbarui ke versi terbaru. Silakan muat ulang halaman untuk memuat versi terkini.'
                  : 'Halaman ini mengalami kendala sesaat saat memuat. Coba muat ulang halaman.'}
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={this.handleReload}
                className="bg-primary text-primary-foreground border-2 border-foreground rounded-xl px-5 py-2.5 font-bold shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all flex items-center justify-center gap-2 text-sm"
              >
                <RotateCw className="w-4 h-4" />
                <span>Muat Ulang Halaman</span>
              </button>
              <a
                href="/"
                className="border-2 border-foreground rounded-xl px-4 py-2.5 font-bold hover:bg-secondary transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Home className="w-4 h-4" />
                <span>Kembali ke Beranda</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
