import { Shield, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Logo & Description */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white p-1.5 rounded-lg">
                <img 
                  src="/logo-web.webp" 
                  alt="ModulAjar Logo" 
                  className="w-7 h-7" 
                />
              </div>
              <div>
                <h3 className="text-xl font-extrabold">ModulAjar.Online</h3>
                <p className="text-sm text-background/70">Kurikulum Merdeka - Pembelajaran Mendalam & KBC</p>
              </div>
            </div>
            <p className="text-background/70 max-w-sm mb-4 text-sm leading-relaxed">
              Platform AI terlengkap untuk guru dan madrasah Indonesia: Generator Modul Ajar, RPP, LKPD, Asesmen, Bank Soal, serta Prota & Promes otomatis.
            </p>
            <div className="flex items-center gap-2 text-sm text-background/70">
              <Shield className="w-4 h-4 text-primary" />
              <span>Aman, Cepat, & Sesuai Regulasi Resmi</span>
            </div>
          </div>

          {/* Generator AI */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-background/90 mb-4">Fitur Generator</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/generator-modul-ajar" className="text-background/70 hover:text-background transition-colors">
                  Generator Modul Ajar
                </Link>
              </li>
              <li>
                <Link to="/generator-rpp" className="text-background/70 hover:text-background transition-colors">
                  Generator RPP Merdeka
                </Link>
              </li>
              <li>
                <Link to="/generator-lkpd" className="text-background/70 hover:text-background transition-colors">
                  Generator LKPD AI
                </Link>
              </li>
              <li>
                <Link to="/generator-asesmen" className="text-background/70 hover:text-background transition-colors">
                  Generator Asesmen & Soal
                </Link>
              </li>
              <li>
                <Link to="/generator-prota-promes" className="text-background/70 hover:text-background transition-colors">
                  Generator Prota & Promes
                </Link>
              </li>
            </ul>
          </div>

          {/* Kurikulum & Sumber Belajar */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-background/90 mb-4">Sumber & Referensi</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/store" className="text-yellow-400 hover:text-yellow-300 transition-colors font-bold flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Global Marketplace
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-background/70 hover:text-background transition-colors">
                  Blog & Artikel Guru
                </Link>
              </li>
              <li>
                <Link to="/kurikulum-merdeka" className="text-background/70 hover:text-background transition-colors">
                  Kurikulum Merdeka
                </Link>
              </li>
              <li>
                <Link to="/generator-modul-ajar-deep-learning" className="text-background/70 hover:text-background transition-colors">
                  Modul Ajar Deep Learning
                </Link>
              </li>
              <li>
                <Link to="/kurikulum-kbc" className="text-background/70 hover:text-background transition-colors">
                  Kurikulum KBC Kemenag
                </Link>
              </li>
              <li>
                <Link to="/rpp-madrasah" className="text-background/70 hover:text-background transition-colors">
                  RPP Madrasah Kemenag
                </Link>
              </li>
            </ul>
          </div>

          {/* Jenjang Madrasah & Akun */}
          <div>
            <h4 className="font-bold text-sm uppercase tracking-wider text-background/90 mb-4">Jenjang & Akun</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/modul-ajar-mi" className="text-background/70 hover:text-background transition-colors">
                  Modul Ajar MI
                </Link>
              </li>
              <li>
                <Link to="/modul-ajar-mts" className="text-background/70 hover:text-background transition-colors">
                  Modul Ajar MTs
                </Link>
              </li>
              <li>
                <Link to="/modul-ajar-ma" className="text-background/70 hover:text-background transition-colors">
                  Modul Ajar MA
                </Link>
              </li>
              <li>
                <Link to="/auth" className="text-background/70 hover:text-background transition-colors font-medium">
                  Masuk ke Aplikasi
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:support@modulajar.online" 
                  className="text-background/70 hover:text-background transition-colors flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Hubungi Kami
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-background/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-background/70">
              © {currentYear} ModulAjar - Generator Dokumen Pembelajaran AI
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-background/70 hover:text-background transition-colors">
                Syarat & Ketentuan
              </a>
              <a href="#" className="text-background/70 hover:text-background transition-colors">
                Kebijakan Privasi
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
