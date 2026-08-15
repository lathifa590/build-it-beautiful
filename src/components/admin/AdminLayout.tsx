import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  BookOpen,
  Home,
  UserCheck,
  Package,
  Store,
  Sparkles,
} from 'lucide-react';


interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Users, label: 'Pengguna', path: '/admin/users' },
  { icon: UserCheck, label: 'Pelanggan Lama', path: '/admin/customers' },
  { icon: Settings, label: 'Pengaturan', path: '/admin/settings' },
];

const superAdminItems = [
  { icon: Package, label: 'Paket Agency', path: '/admin/agency/packages' },
  { icon: Store, label: 'Reseller', path: '/admin/agency/owners' },
  { icon: Sparkles, label: 'Promo Agency', path: '/admin/agency/promos' },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b-2 border-foreground z-50 flex items-center px-4">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-secondary rounded-lg"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2 ml-4">
          <div className="w-8 h-8 bg-primary rounded-lg border-2 border-foreground flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold">Admin Panel</span>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-foreground/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-card border-r-2 border-foreground z-50 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b-2 border-foreground">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-primary rounded-xl border-2 border-foreground flex items-center justify-center shadow-brutal-sm">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm">Admin Panel</span>
                <span className="text-xs text-muted-foreground">ModulAjar.Online</span>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex p-2 hover:bg-secondary rounded-lg transition-colors"
          >
            <ChevronLeft
              className={`w-5 h-5 transition-transform ${!sidebarOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
                  isActive
                    ? 'bg-foreground text-background border-foreground shadow-none'
                    : 'border-transparent hover:bg-secondary hover:border-foreground/20'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}

          {sidebarOpen && (
            <div className="pt-4 pb-1 px-2 text-[10px] font-extrabold tracking-widest text-muted-foreground">
              SUPER ADMIN
            </div>
          )}
          {!sidebarOpen && <div className="pt-3 border-t border-foreground/10" />}
          {superAdminItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all ${
                  isActive
                    ? 'bg-foreground text-background border-foreground shadow-none'
                    : 'border-transparent hover:bg-secondary hover:border-foreground/20'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t-2 border-foreground/20">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-transparent hover:bg-secondary hover:border-foreground/20 transition-all mb-2"
          >
            <Home className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">Ke Aplikasi</span>}
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-transparent hover:bg-destructive/10 hover:border-destructive/30 text-destructive transition-all"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="font-medium">Keluar</span>}
          </button>
          {sidebarOpen && user && (
            <div className="mt-4 p-3 bg-secondary rounded-lg">
              <p className="text-sm font-medium truncate">{user.email}</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
        } pt-16 lg:pt-0`}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};
