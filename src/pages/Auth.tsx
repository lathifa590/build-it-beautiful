import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, BookOpen, Mail, Lock, User, Eye, EyeOff, HelpCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

type AuthStep = 'email' | 'new-password' | 'login' | 'forgot-password';

const Auth = () => {
  const { user, isLoading, signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<AuthStep>('email');
  const [customerName, setCustomerName] = useState('');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background bg-grid-pattern">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/app" replace />;
  }

  const checkAllowedEmail = async (emailToCheck: string): Promise<{ allowed: boolean; name?: string; hasAccount?: boolean }> => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-allowed-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ email: emailToCheck }),
        }
      );

      const data = await response.json();
      return { allowed: data.allowed, name: data.name, hasAccount: data.hasAccount };
    } catch (error) {
      console.error('Error checking email:', error);
      return { allowed: false };
    }
  };

  const handleEmailCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Check if email is in allowed list and if user already has an account
      const { allowed, name, hasAccount } = await checkAllowedEmail(email);

      if (!allowed) {
        setError('Email belum terdaftar. Silakan hubungi admin untuk mendapatkan akses.');
        setLoading(false);
        return;
      }

      setCustomerName(name || '');

      if (hasAccount) {
        // User already has account - show login form
        setStep('login');
      } else {
        // New customer - needs to set password
        setDisplayName(name || '');
        setStep('new-password');
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Password tidak cocok');
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(email, password, displayName || customerName);
      if (error) {
        if (error.message.includes('already registered')) {
          setError('Email sudah terdaftar. Silakan login dengan password Anda.');
          setStep('login');
        } else {
          setError(error.message);
        }
      }
      // If successful, AuthContext will handle redirect
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        if (error.message === 'Invalid login credentials') {
          setError('Password salah. Silakan coba lagi.');
        } else {
          setError(error.message);
        }
      }
      // If successful, AuthContext will handle redirect
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep('email');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setCustomerName('');
    setDisplayName('');
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-grid-pattern p-4">
      <div className="w-full max-w-md">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-xl border-2 border-foreground shadow-brutal mb-4">
            <BookOpen className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-extrabold text-foreground">
            ModulAjar.Online
          </h1>
          <p className="text-muted-foreground mt-2">
            Generator Dokumen Pembelajaran AI
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-card border-2 border-foreground rounded-xl shadow-brutal p-6">
          
          {/* Step: Email Input */}
          {step === 'email' && (
            <form onSubmit={handleEmailCheck} className="space-y-4">
              <div className="text-center mb-4">
                <h2 className="text-lg font-bold text-foreground">Masuk ke Akun Anda</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Masukkan email yang Anda gunakan saat pembelian
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@anda.com"
                    className="w-full pl-11 pr-4 py-3 border-2 border-foreground/30 rounded-lg focus:border-foreground outline-none bg-background transition-colors"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border-2 border-destructive/30 rounded-lg">
                  <p className="text-sm text-destructive font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary text-primary-foreground font-bold uppercase border-2 border-foreground rounded-lg shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Memeriksa...</span>
                  </>
                ) : (
                  <span>Lanjutkan</span>
                )}
              </button>

              <p className="text-sm text-muted-foreground text-center mt-4">
                Belum terdaftar?{' '}
                <a 
                  href="mailto:admin@modulajar.com" 
                  className="text-primary hover:underline font-medium"
                >
                  Hubungi admin
                </a>
                {' '}untuk mendapatkan akses.
              </p>
            </form>
          )}

          {/* Step: Create Password (First Time User) */}
          {step === 'new-password' && (
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div className="p-4 bg-primary/5 border-2 border-primary/20 rounded-lg">
                <p className="text-sm text-foreground">
                  <strong>Selamat datang, {customerName || 'Pelanggan'}! 🎉</strong><br />
                  Ini login pertama Anda. Silakan buat password untuk akun Anda.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full pl-11 pr-4 py-3 border-2 border-foreground/30 rounded-lg bg-muted text-muted-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Nama lengkap Anda"
                    className="w-full pl-11 pr-4 py-3 border-2 border-foreground/30 rounded-lg focus:border-foreground outline-none bg-background transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">
                  Buat Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full pl-11 pr-12 py-3 border-2 border-foreground/30 rounded-lg focus:border-foreground outline-none bg-background transition-colors"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password"
                    className="w-full pl-11 pr-4 py-3 border-2 border-foreground/30 rounded-lg focus:border-foreground outline-none bg-background transition-colors"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border-2 border-destructive/30 rounded-lg">
                  <p className="text-sm text-destructive font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary text-primary-foreground font-bold uppercase border-2 border-foreground rounded-lg shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Membuat Akun...</span>
                  </>
                ) : (
                  <span>Buat Akun & Masuk</span>
                )}
              </button>

              <button
                type="button"
                onClick={resetFlow}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
              >
                ← Gunakan email lain
              </button>
            </form>
          )}

          {/* Step: Login (Returning User) */}
          {step === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="p-4 bg-primary/5 border-2 border-primary/20 rounded-lg">
                <p className="text-sm text-foreground">
                  <strong>Selamat datang kembali! 👋</strong><br />
                  Masukkan password Anda untuk login.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full pl-11 pr-4 py-3 border-2 border-foreground/30 rounded-lg bg-muted text-muted-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-muted-foreground mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="w-full pl-11 pr-12 py-3 border-2 border-foreground/30 rounded-lg focus:border-foreground outline-none bg-background transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-destructive/10 border-2 border-destructive/30 rounded-lg">
                  <p className="text-sm text-destructive font-medium">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary text-primary-foreground font-bold uppercase border-2 border-foreground rounded-lg shadow-brutal hover:shadow-brutal-hover hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>Masuk</span>
                )}
              </button>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setStep('forgot-password')}
                  className="w-full text-center text-sm text-primary hover:underline font-medium"
                >
                  Lupa Password?
                </button>
                <button
                  type="button"
                  onClick={resetFlow}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
                >
                  ← Gunakan email lain
                </button>
              </div>
            </form>
          )}

          {/* Step: Forgot Password */}
          {step === 'forgot-password' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                  <HelpCircle className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Lupa Password?</h3>
                <p className="text-sm text-muted-foreground">
                  Untuk keamanan akun Anda, reset password hanya dapat dilakukan oleh admin.
                </p>
              </div>

              <div className="p-4 bg-secondary/50 border-2 border-foreground/10 rounded-lg">
                <p className="text-sm font-bold text-foreground mb-3">Hubungi Admin:</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    <span>Email: <a href="mailto:admin@modulajar.com" className="text-primary hover:underline font-medium">admin@modulajar.com</a></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-lg">📱</span>
                    <span>WhatsApp: <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">0812-3456-7890</a></span>
                  </li>
                </ul>
              </div>

              <div className="p-3 bg-primary/5 border-2 border-primary/20 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  Sebutkan email terdaftar Anda: <strong className="text-foreground">{email}</strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setStep('login')}
                className="w-full py-3 bg-secondary text-foreground font-medium border-2 border-foreground/30 rounded-lg hover:bg-secondary/80 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Login
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2024 ModulAjar.Online. Hak Cipta Dilindungi.
        </p>
      </div>
    </div>
  );
};

export default Auth;
