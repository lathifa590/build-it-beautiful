import React, { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSchool } from '@/contexts/SchoolContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Users,
  FileText,
  FileSpreadsheet,
  ChevronLeft,
  Menu,
  School as SchoolIcon,
  Share2,
  ArrowRight,
  LogOut,
  Sparkles,
  Copy,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface SchoolLayoutProps {
  children: ReactNode;
  pageTitle?: string;
  pageDescription?: string;
  headerActions?: ReactNode;
}

export const SchoolLayout: React.FC<SchoolLayoutProps> = ({
  children,
  pageTitle,
  pageDescription,
  headerActions,
}) => {
  const { school, schoolMember, isWaka, isKepsek, refreshSchool } = useSchool();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const canManage = isWaka || (schoolMember?.school_role === 'waka') || (user?.email === 'jagofeed@gmail.com');

  const navItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard Monitoring',
      path: '/sekolah',
    },
    {
      icon: BookOpen,
      label: 'Bank Modul Sekolah',
      path: '/sekolah/bank',
    },
    {
      icon: Calendar,
      label: 'Kalender Waka',
      path: '/sekolah/kalender',
    },
    {
      icon: Users,
      label: 'Dewan Guru & Undangan',
      path: '/sekolah/anggota',
    },
    {
      icon: FileText,
      label: 'Kop & Standar Sekolah',
      path: '/sekolah/standar',
    },
    {
      icon: FileSpreadsheet,
      label: 'Rekap Supervisi Dinas',
      path: '/sekolah/export',
    },
  ];

  const inviteCode = school?.invite_code || '';
  const inviteUrl = `${window.location.origin}/sekolah/join?code=${inviteCode}`;
  const waShareText = `Halo Bapak/Ibu Guru ${school?.name || ''},\n\nMari bergabung ke Mode Sekolah di Modul Ajar Generator untuk menyinkronkan Kalender Pendidikan dan JP:\n\n👉 Klik Link Bergabung:\n${inviteUrl}\n\n🔑 Kode Undangan: *${inviteCode}*\n\nTerima kasih!`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl);
    toast.success('Tautan undangan sekolah berhasil disalin!');
  };

  const handleShareWa = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(waShareText)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Top Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b-2 border-foreground z-50 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-secondary rounded-lg border-2 border-foreground/30"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg text-primary-foreground border-2 border-foreground flex items-center justify-center font-bold">
              <SchoolIcon className="w-4 h-4" />
            </div>
            <span className="font-black text-sm text-foreground truncate max-w-[180px]">
              {school?.name || 'Mode Sekolah'}
            </span>
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate('/app')}
          className="text-xs h-8 font-bold"
        >
          Workspace <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </header>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-card border-r-2 border-foreground z-50 transition-all duration-300 flex flex-col justify-between ${
          sidebarOpen ? 'w-64' : 'w-20'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Top Part: School Identity & Nav Links */}
        <div className="flex-1 overflow-y-auto">
          {/* School Brand Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b-2 border-foreground">
            {sidebarOpen && (
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-10 h-10 bg-primary text-primary-foreground rounded-xl border-2 border-foreground flex items-center justify-center shadow-brutal-sm shrink-0">
                  <SchoolIcon className="w-5 h-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-extrabold text-sm text-foreground truncate">
                    {school?.name || 'Mode Sekolah'}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono font-bold">
                    {school?.npsn ? `NPSN ${school.npsn}` : 'ModulAjar.Online'}
                  </span>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex p-1.5 hover:bg-secondary rounded-lg border-2 border-transparent hover:border-foreground/20 transition-colors shrink-0"
              title={sidebarOpen ? 'Ciutkan Sidebar' : 'Buka Sidebar'}
            >
              <ChevronLeft
                className={`w-4 h-4 transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>

          {/* School Academic Info Badge */}
          {sidebarOpen && school && (
            <div className="px-4 py-2 bg-secondary/50 border-b-2 border-foreground/15 text-[11px] flex items-center justify-between">
              <span className="text-muted-foreground font-bold">Tahun Ajaran:</span>
              <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded border border-foreground/30 bg-card text-foreground">
                {school.academic_year_active || '2024/2025'}
              </span>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all text-xs ${
                    isActive
                      ? 'bg-[#fff3ed] text-[#c04a1a] border-foreground font-black shadow-brutal-sm'
                      : 'border-transparent text-foreground/80 hover:text-foreground hover:bg-secondary font-bold'
                  } ${!sidebarOpen ? 'justify-center px-2' : ''}`}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Part: Quick Actions & User Profile */}
        <div className="p-3 border-t-2 border-foreground bg-card space-y-2">
          {/* Quick Invite Button */}
          {canManage && (
            <button
              onClick={() => setIsInviteDialogOpen(true)}
              className={`w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#f0fdf4] hover:bg-[#dcfce7] text-emerald-900 border-2 border-foreground rounded-xl font-black text-xs shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all ${
                !sidebarOpen ? 'px-2' : ''
              }`}
              title="Undang Guru via WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5 shrink-0 text-emerald-700" />
              {sidebarOpen && <span>Undang Guru (WA)</span>}
            </button>
          )}

          {/* Switch to Workspace */}
          <button
            onClick={() => navigate('/app')}
            className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-card hover:bg-secondary text-foreground border-2 border-foreground rounded-xl font-bold text-xs shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all ${
              !sidebarOpen ? 'px-2' : ''
            }`}
            title="Buka Workspace Modul Saya"
          >
            <ArrowRight className="w-3.5 h-3.5 shrink-0 rotate-180" />
            {sidebarOpen && <span>Workspace Saya</span>}
          </button>

          {/* User Profile info */}
          {sidebarOpen && (
            <div className="pt-2 border-t-2 border-foreground/10 flex items-center justify-between text-[11px]">
              <div className="min-w-0 pr-1">
                <p className="font-extrabold truncate text-foreground text-xs">{user?.email}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-mono font-bold">
                  Peran: {schoolMember?.school_role || 'Guru'}
                </p>
              </div>
              <span className="bg-[#f0fdf4] text-emerald-800 border-2 border-emerald-600 font-black text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                Aktif
              </span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div
        className={`transition-all duration-300 pt-16 lg:pt-0 ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        }`}
      >
        {/* Page Container */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
          {(pageTitle || headerActions) && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                  {pageTitle || school?.name}
                </h1>
                {pageDescription && (
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">
                    {pageDescription}
                  </p>
                )}
              </div>
              {headerActions && (
                <div className="flex items-center gap-2 shrink-0">
                  {headerActions}
                </div>
              )}
            </div>
          )}
          {children}
        </main>
      </div>

      {/* Dialog Share Undangan WhatsApp */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="max-w-md border-2 border-foreground shadow-brutal bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2">
              <Share2 className="w-4 h-4 text-primary" />
              Tautan Undangan Guru Sekolah
            </DialogTitle>
            <DialogDescription className="text-xs font-medium">
              Bagikan tautan atau kode rahasia ini ke grup WhatsApp dewan guru sekolah Anda.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-4 bg-secondary/50 rounded-xl border-2 border-foreground text-center space-y-1 shadow-sm">
              <span className="text-[10px] uppercase font-black tracking-wider text-muted-foreground">
                Kode Undangan Sekolah
              </span>
              <div className="text-3xl font-mono font-black text-foreground tracking-widest">
                {inviteCode || 'MEMBUAT KODE...'}
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">
                Guru yang memasukkan kode ini langsung aktif tanpa antrean.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Tautan Gabung 1-Klik:</label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={inviteUrl}
                  className="font-mono text-xs border-2 border-foreground bg-card shadow-brutal-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="shrink-0 gap-1 font-bold border-2 border-foreground shadow-brutal-sm hover:shadow-none transition-all"
                >
                  <Copy className="w-3.5 h-3.5" /> Salin
                </Button>
              </div>
            </div>

            <Button
              onClick={handleShareWa}
              className="w-full bg-[#15803d] hover:bg-[#166534] text-white font-black gap-2 py-4 border-2 border-foreground shadow-brutal hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <Share2 className="w-4 h-4" />
              Kirim Tautan ke Grup WhatsApp
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
