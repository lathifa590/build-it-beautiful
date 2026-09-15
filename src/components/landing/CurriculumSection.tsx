import { BookOpen, Heart } from "lucide-react";

export function CurriculumSection() {
  return (
    <section className="py-20 bg-slate-50 border-y border-slate-100">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Mendukung 2 Kurikulum Resmi Indonesia
          </h2>
          <p className="text-slate-600 text-lg">
            Aplikasi pertama yang secara native mengadopsi standar Kemendikbudristek dan Kemenag RI.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Kurikulum Merdeka */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
              <BookOpen className="w-7 h-7 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Kurikulum Merdeka</h3>
            <p className="text-blue-600 font-medium mb-6">(Kemendikbudristek)</p>
            
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">SD</span>
              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">SMP</span>
              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">SMA/SMK</span>
            </div>
            
            <ul className="space-y-3 text-slate-600">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600" /> Profil Pelajar Pancasila
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600" /> Pembelajaran Berdiferensiasi
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600" /> Capaian Pembelajaran Terbaru
              </li>
            </ul>
          </div>

          {/* KBC Kemenag */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-emerald-200 relative overflow-hidden hover:shadow-md transition-shadow">
            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
              BARU
            </div>
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
              <Heart className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">KBC Kemenag</h3>
            <p className="text-emerald-600 font-medium mb-6">(Kurikulum Berbasis Cinta)</p>
            
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium border border-emerald-100">MI</span>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium border border-emerald-100">MTs</span>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium border border-emerald-100">MA</span>
            </div>
            
            <ul className="space-y-3 text-slate-600">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Nilai-Nilai Panca Cinta
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Mapel Agama (Fikih, SKI, dll)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Pendekatan Spiritualitas
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
