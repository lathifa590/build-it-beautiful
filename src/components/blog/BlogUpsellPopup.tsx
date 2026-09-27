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
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 p-6 flex flex-col items-center justify-center text-white relative overflow-hidden">
        {/* Pola background */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
        
        <Sparkles className="w-10 h-10 mb-2 text-indigo-200 relative z-10" />
        <h3 className="font-extrabold text-xl mb-1 text-center relative z-10">Bebas Ribet Bikin RPP!</h3>
        <p className="text-indigo-100 text-sm text-center relative z-10">Gunakan AI Asisten Guru</p>
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
