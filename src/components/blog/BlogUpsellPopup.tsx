import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const BlogUpsellPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Tampilkan popup setelah 3 detik
    const dismissed = localStorage.getItem('blog_upsell_dismissed');
    if (!dismissed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('blog_upsell_dismissed', 'true');
  };

  if (!isVisible || isDismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[340px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-500">
      <button 
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1.5 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors z-10"
        aria-label="Tutup"
      >
        <X className="w-4 h-4" />
      </button>
      
      {/* Area Banner */}
      <div className="w-full relative overflow-hidden bg-slate-100">
        <img 
          src="/thumbnail-app.png" 
          alt="ModulAjar.Online" 
          className="w-full h-auto object-cover"
        />
      </div>

      <div className="p-5">
        <p className="text-sm text-slate-600 mb-5 leading-relaxed">
          Tingkatkan efisiensi mengajar Anda. Buat RPP, Modul Ajar, dan Asesmen Kurikulum Merdeka hanya dalam hitungan detik.
        </p>
        <Link 
          to="/"
          className="block w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-center font-semibold rounded-xl transition-colors shadow-sm hover:shadow-md"
        >
          Coba ModulAjar.Online
        </Link>
      </div>
    </div>
  );
};
