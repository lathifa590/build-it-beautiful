import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSchool } from '@/hooks/useSchool';
import { schoolApi } from '@/lib/school-api';
import { SchoolFeatureRestricted } from '@/components/school/SchoolGate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { School, KeyRound, CheckCircle2, ArrowRight, LogIn, AlertCircle, Sparkles, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SchoolJoinPage() {
  const [searchParams] = useSearchParams();
  const urlCode = searchParams.get('code') || '';
  const [code, setCode] = useState(urlCode.toUpperCase());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [joinedSchool, setJoinedSchool] = useState<{ id?: string; name?: string } | null>(null);

  const { user, isLoading: authLoading } = useAuth();
  const { school, schoolMember, isSchoolActive, isFeatureAllowed, refreshSchool } = useSchool();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (urlCode) {
      setCode(urlCode.toUpperCase());
    }
  }, [urlCode]);

  const handleJoin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!code.trim()) {
      setErrorMsg('Harap masukkan kode undangan sekolah');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const result = await schoolApi.joinSchoolByCode(code);
      if (result.success) {
        setJoinedSchool({ id: result.school_id, name: result.school_name });
        toast({
          title: 'Berhasil Bergabung!',
          description: result.message || `Anda telah resmi terdaftar di ${result.school_name}`,
        });
        await refreshSchool();
      } else {
        setErrorMsg(result.message || 'Kode undangan tidak valid atau sudah kadaluarsa.');
      }
    } catch (err: any) {
      console.error('Error joining school by code:', err);
      setErrorMsg(err?.message || 'Terjadi kesalahan sistem saat mencoba bergabung.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground border-2 border-foreground shadow-brutal mb-3">
            <School className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Mode Sekolah
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">
            Bergabung dengan ruang kolaborasi & kalender kurikulum sekolah Anda
          </p>
        </div>

        {/* Success State */}
        {joinedSchool ? (
          <Card className="border-2 border-foreground shadow-brutal bg-card rounded-2xl">
            <CardHeader className="text-center pb-3 border-b-2 border-foreground/10">
              <div className="w-12 h-12 rounded-full bg-[#f0fdf4] text-emerald-800 border-2 border-emerald-600 flex items-center justify-center mx-auto mb-2 font-black">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl font-black text-foreground">
                Selamat Datang di {joinedSchool.name}!
              </CardTitle>
              <CardDescription className="text-xs font-medium">
                Akun Anda telah otomatis terverifikasi dan terhubung ke kalender akademik sekolah.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="p-3.5 bg-[#f0fdf4] border-2 border-emerald-600/30 rounded-xl text-xs text-emerald-900 space-y-1">
                <p className="font-black flex items-center gap-1.5 text-emerald-800">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Kalender Akademik Terwarisi
                </p>
                <p className="font-medium leading-relaxed">
                  Saat membuat Modul Ajar baru di Workspace pribadi Anda, pekan efektif dan durasi JP akan otomatis terisi sesuai panduan Waka Kurikulum.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <Button 
                  onClick={() => navigate('/sekolah')}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs border-2 border-foreground rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all h-11"
                >
                  <Building2 className="w-4 h-4 mr-2" /> Buka Portal Sekolah
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/app')}
                  className="w-full border-2 border-foreground rounded-xl shadow-brutal-sm hover:shadow-none font-bold text-xs h-11"
                >
                  Buka Workspace Modul Saya <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : user && !isFeatureAllowed ? (
          /* Deploy Terbatas: hanya Admin & akun pilot */
          <Navigate to="/app" replace />
        ) : !user && !authLoading ? (
          /* Not Logged In State */
          <Card className="border-2 border-foreground shadow-brutal bg-card rounded-2xl">
            <CardHeader className="text-center pb-2 border-b-2 border-foreground/10">
              <CardTitle className="text-lg font-black text-foreground">Masuk Terlebih Dahulu</CardTitle>
              <CardDescription className="text-xs font-medium">
                Anda perlu memiliki akun dan login untuk bergabung dengan sekolah menggunakan kode undangan ini.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {code && (
                <div className="p-3 bg-secondary/60 rounded-xl border-2 border-foreground text-center">
                  <span className="text-xs text-muted-foreground uppercase font-black tracking-wider">Kode Undangan Terdeteksi:</span>
                  <div className="text-xl font-mono font-black text-foreground tracking-widest mt-0.5">
                    {code}
                  </div>
                </div>
              )}

              <Button
                onClick={() => navigate(`/auth?returnTo=${encodeURIComponent(`/sekolah/join${code ? `?code=${code}` : ''}`)}`)}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs border-2 border-foreground rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all h-11"
              >
                <LogIn className="w-4 h-4 mr-2" /> Login / Daftar Akun
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Logged In State - Input Code */
          <Card className="border-2 border-foreground shadow-brutal bg-card rounded-2xl">
            <CardHeader className="pb-3 border-b-2 border-foreground/10">
              <CardTitle className="text-lg font-black flex items-center gap-2 text-foreground">
                <KeyRound className="w-5 h-5 text-primary" /> Masukkan Kode Undangan
              </CardTitle>
              <CardDescription className="text-xs font-medium">
                Kode rahasia ini dibagikan oleh Waka Kurikulum sekolah Anda (contoh: <code className="text-primary font-mono font-bold">SCH-A1B2C3</code>).
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {isSchoolActive && school && (
                <Alert className="mb-4 bg-[#fff3ed] border-2 border-foreground text-foreground py-2.5 rounded-xl shadow-brutal-sm">
                  <AlertCircle className="w-4 h-4 text-primary" />
                  <AlertDescription className="text-xs font-medium">
                    Saat ini Anda sudah terdaftar di <strong>{school.name}</strong> ({schoolMember?.school_role}). Memasukkan kode baru akan memindahkan afiliasi sekolah Anda.
                  </AlertDescription>
                </Alert>
              )}

              {errorMsg && (
                <Alert variant="destructive" className="mb-4 py-2.5 rounded-xl border-2 border-rose-600">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription className="text-xs font-medium">{errorMsg}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleJoin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Kode Undangan Sekolah
                  </label>
                  <Input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="SCH-XXXXXX"
                    className="font-mono text-center text-xl font-black tracking-widest uppercase h-12 border-2 border-foreground rounded-xl shadow-brutal-sm bg-card"
                    maxLength={14}
                    autoFocus
                  />
                  <p className="text-[11px] text-muted-foreground font-medium">
                    Tidak peka huruf besar/kecil. Kode bersifat unik per sekolah.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !code.trim()}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs border-2 border-foreground rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all h-12"
                >
                  {isSubmitting ? (
                    'Memverifikasi Kode...'
                  ) : (
                    <>
                      Bergabung Sekarang <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-4 pt-3 border-t-2 border-foreground/10 text-center text-xs text-muted-foreground font-medium">
                Belum punya kode? Hubungi Waka Kurikulum sekolah Anda untuk mendapatkan tautan undangan WhatsApp.
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/app"
            className="text-xs text-muted-foreground hover:text-foreground font-bold underline underline-offset-4"
          >
            ← Kembali ke Workspace Mandiri
          </Link>
        </div>
      </div>
    </div>
  );
}
