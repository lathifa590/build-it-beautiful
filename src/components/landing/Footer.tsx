import { Shield, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white p-1.5 rounded-lg">
                <img 
                  src="/favicon.png" 
                  alt="ModulAjar Logo" 
                  className="w-7 h-7" 
                />
              </div>
              <div>
                <h3 className="text-xl font-extrabold">ModulAjar.Online</h3>
                <p className="text-sm text-background/70">Kurikulum Merdeka - Pembelajaran Mendalam & KBC</p>
              </div>
            </div>
            <p className="text-background/70 max-w-md mb-4">
              Platform AI untuk membuat Modul Ajar, LKPD, Asesmen, Bank Soal, 
              dan Materi Pembelajaran sesuai Kurikulum Merdeka.
            </p>
            <div className="flex items-center gap-2 text-sm text-background/70">
              <Shield className="w-4 h-4" />
              <span>Aman & Terpercaya</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4">Tautan</h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/auth" 
                  className="text-background/70 hover:text-background transition-colors"
                >
                  Masuk
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:support@modulajar.online" 
                  className="text-background/70 hover:text-background transition-colors flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
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
