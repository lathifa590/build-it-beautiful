import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSchool } from '@/contexts/SchoolContext';
import { useIsAgencyOwner } from '@/hooks/useIsAgencyOwner';
import { FolderOpen, ShoppingBag, Globe, School, Shield, Store, Settings, LogOut, Menu, X, User as UserIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface AppSidebarProps {
  onClose?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ onClose }) => {
  const { user, isAdmin, signOut } = useAuth();
  const { isFeatureAllowed, school } = useSchool();
  const isAgencyOwner = useIsAgencyOwner();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem('app_sidebar_collapsed') === 'true');

  const toggleCollapse = () => {
    const newVal = !isCollapsed;
    setIsCollapsed(newVal);
    localStorage.setItem('app_sidebar_collapsed', String(newVal));
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const navItems = [
    {
      label: 'Workspace',
      icon: <FolderOpen className="w-5 h-5" />,
      path: '/app',
      isActive: location.pathname === '/app' || location.pathname.startsWith('/app/workspace'),
    },
    {
      label: 'Toko Saya',
      icon: <ShoppingBag className="w-5 h-5" />,
      path: '/app/store-management',
      isActive: location.pathname === '/app/store-management',
    },
    {
      label: 'Blog & SEO',
      icon: <Globe className="w-5 h-5" />,
      path: '/app/blog-management',
      isActive: location.pathname === '/app/blog-management',
    }
  ];

  if (isFeatureAllowed) {
    navItems.push({
      label: 'Mode Sekolah',
      icon: <School className="w-5 h-5" />,
      path: '/sekolah',
      isActive: location.pathname.startsWith('/sekolah'),
    });
  }

  if (isAdmin) {
    navItems.push({
      label: 'Panel Admin',
      icon: <Shield className="w-5 h-5" />,
      path: '/admin',
      isActive: location.pathname.startsWith('/admin'),
    });
  }

  if (isAgencyOwner) {
    navItems.push({
      label: 'Reseller',
      icon: <Store className="w-5 h-5" />,
      path: '/agency',
      isActive: location.pathname.startsWith('/agency'),
    });
  }

  return (
    <div className={`h-full flex flex-col bg-white border-r-2 border-foreground transition-all duration-300 flex-shrink-0 ${isCollapsed ? 'w-[72px]' : 'w-64'}`}>
      {/* Header / Logo */}
      <div className={`p-4 border-b-2 border-foreground/10 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} relative h-16`}>
        {isCollapsed ? (
          <div className="bg-white p-1.5 rounded-lg border-2 border-foreground shadow-brutal-sm flex-shrink-0">
            <img src="/logo-web.webp" alt="ModulAjar Logo" className="w-5 h-5" />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-lg border-2 border-foreground shadow-brutal-sm flex-shrink-0">
              <img src="/logo-web.webp" alt="ModulAjar Logo" className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-base font-extrabold truncate">ModulAjar.Online</h1>
            </div>
          </div>
        )}
        
        {/* Mobile Close Button */}
        {onClose && !isCollapsed && (
          <button onClick={onClose} className="md:hidden p-1 hover:bg-slate-100 rounded-md">
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Desktop Collapse Toggle */}
        <button 
          onClick={toggleCollapse}
          className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border-2 border-foreground rounded-full items-center justify-center hover:bg-slate-50 shadow-sm z-10"
        >
          {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {!isCollapsed && <div className="text-[10px] font-extrabold text-slate-400 mb-2 px-3 tracking-wider">MENU UTAMA</div>}
        
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={onClose}
            title={isCollapsed ? item.label : undefined}
            className={`flex items-center ${isCollapsed ? 'justify-center p-2.5 mx-auto' : 'gap-3 px-3 py-2.5'} rounded-xl font-semibold transition-all ${
              item.isActive 
                ? 'bg-primary/10 text-primary border-2 border-primary/20' 
                : 'text-slate-600 hover:bg-slate-50 border-2 border-transparent'
            }`}
          >
            <div className="flex-shrink-0">{item.icon}</div>
            {!isCollapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </div>

      {/* Bottom Profile / Settings */}
      <div className="p-3 border-t-2 border-foreground/10 space-y-2 bg-slate-50">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-9 h-9 rounded-full bg-indigo-100 border-2 border-indigo-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-5 h-5 text-indigo-600" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{user?.user_metadata?.full_name || 'Pengguna'}</p>
              <p className="text-[10px] font-medium text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-4">
            <div className="w-8 h-8 rounded-full bg-indigo-100 border-2 border-indigo-200 flex items-center justify-center overflow-hidden" title={user?.email}>
              {user?.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-4 h-4 text-indigo-600" />
              )}
            </div>
          </div>
        )}

        <Link
          to="/settings"
          onClick={onClose}
          title={isCollapsed ? 'Pengaturan' : undefined}
          className={`flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2'} text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors`}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>Pengaturan Akun</span>}
        </Link>
        <button
          onClick={handleLogout}
          title={isCollapsed ? 'Keluar' : undefined}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2'} text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span>Keluar</span>}
        </button>
      </div>
    </div>
  );
};
