import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

export const AppLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-3 border-b-2 border-foreground/10 bg-white shadow-sm z-30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="p-1.5 hover:bg-slate-100 rounded-md">
                  <Menu className="w-6 h-6" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <AppSidebar onClose={() => setIsMobileMenuOpen(false)} />
              </SheetContent>
            </Sheet>
            
            <div className="flex items-center gap-2">
              <div className="bg-white p-1 rounded-md border-2 border-foreground shadow-brutal-sm">
                <img src="/logo-web.webp" alt="Logo" className="w-5 h-5" />
              </div>
              <h1 className="text-sm font-extrabold truncate">ModulAjar.Online</h1>
            </div>
          </div>
        </div>

        {/* The actual page content */}
        <div className="flex-1 overflow-auto relative">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
