import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PURCHASE_LINK = 'https://aidukasi.shop/checkout?id=PRD-14';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-sm border-b-2 border-foreground">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-white p-1.5 rounded-lg border-2 border-foreground shadow-brutal-sm">
              <img 
                src="/favicon.png" 
                alt="ModulAjar Logo" 
                className="w-6 h-6 md:w-7 md:h-7" 
              />
            </div>
            <div>
              <span className="text-lg md:text-xl font-extrabold text-foreground">ModulAjar.Online</span>
              <p className="text-[9px] md:text-[10px] font-bold text-muted-foreground hidden sm:block">
                Kurikulum Merdeka - Pembelajaran Mendalam & KBC
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => scrollToSection('fitur')}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Fitur
            </button>
            <button
              onClick={() => scrollToSection('mengapa-kami')}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Keunggulan
            </button>
            <button
              onClick={() => scrollToSection('testimoni')}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Testimoni
            </button>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/auth">
              <Button
                variant="outline"
                className="border-2 border-foreground shadow-brutal-sm hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                Masuk
              </Button>
            </Link>
            <a href={PURCHASE_LINK} target="_blank" rel="noopener noreferrer">
              <Button className="border-2 border-foreground shadow-brutal-sm hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all gap-2">
                Beli Sekarang
                <ExternalLink className="w-4 h-4" />
              </Button>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t-2 border-foreground/20 py-4 space-y-3">
            <button
              onClick={() => scrollToSection('fitur')}
              className="block w-full text-left px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              Fitur
            </button>
            <button
              onClick={() => scrollToSection('mengapa-kami')}
              className="block w-full text-left px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              Keunggulan
            </button>
            <button
              onClick={() => scrollToSection('testimoni')}
              className="block w-full text-left px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
            >
              Testimoni
            </button>
            <div className="pt-3 space-y-2 px-4">
              <Link to="/auth" className="block">
                <Button
                  variant="outline"
                  className="w-full border-2 border-foreground shadow-brutal-sm"
                >
                  Masuk
                </Button>
              </Link>
              <a href={PURCHASE_LINK} target="_blank" rel="noopener noreferrer" className="block">
                <Button className="w-full border-2 border-foreground shadow-brutal-sm gap-2">
                  Beli Sekarang
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
