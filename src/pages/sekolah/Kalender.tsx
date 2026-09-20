import React, { useEffect, useState } from 'react';
import { useSchool } from '@/contexts/SchoolContext';
import { useAuth } from '@/contexts/AuthContext';
import { SchoolGate } from '@/components/school/SchoolGate';
import { SchoolLayout } from '@/components/school/SchoolLayout';
import { schoolApi } from '@/lib/school-api';
import type { KalenderPendidikan } from '@/types/modul';
import {
  Calendar,
  School as SchoolIcon,
  Save,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { KalenderPendidikanForm } from '@/components/modul/KalenderPendidikanForm';

export default function SekolahKalenderPage() {
  return (
    <SchoolGate requiredRole="waka">
      <SekolahKalenderContent />
    </SchoolGate>
  );
}

const defaultKalender: KalenderPendidikan = {
  jpPerMinggu: 2,
  mingguEfektifSem1: 18,
  mingguEfektifSem2: 16,
  tanggalMulaiSem1: `${new Date().getFullYear()}-07-15`,
  tanggalMulaiSem2: `${new Date().getFullYear() + 1}-01-06`,
  kegiatanNonPembelajaran: [],
  mingguPerBulan: {},
};

function SekolahKalenderContent() {
  const { school, schoolMember, refreshSchool } = useSchool();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [academicYear, setAcademicYear] = useState<string>(
    school?.academic_year_active || '2024/2025'
  );
  const [semester, setSemester] = useState<1 | 2>(1);
  const [pekanEfektif, setPekanEfektif] = useState<number>(18);
  const [jpDurationMinutes, setJpDurationMinutes] = useState<number>(45);
  const [kalenderData, setKalenderData] = useState<KalenderPendidikan>(defaultKalender);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // Ambil data kalender saat semester / tahun ajaran berganti
  useEffect(() => {
    if (!school?.id) return;

    const fetchCalendar = async () => {
      setIsLoading(true);
      try {
        const cal = await schoolApi.getSchoolCalendar(school.id, academicYear, semester);
        if (cal) {
          setPekanEfektif(cal.pekan_efektif || (semester === 1 ? 18 : 16));
          setJpDurationMinutes(cal.jp_duration_minutes || 45);
          if (cal.kalender_json && Object.keys(cal.kalender_json).length > 0) {
            setKalenderData(cal.kalender_json as KalenderPendidikan);
          }
          if (cal.updated_at) {
            setLastSavedTime(new Date(cal.updated_at).toLocaleString('id-ID'));
          }
        } else {
          // Default jika belum pernah diset
          setPekanEfektif(semester === 1 ? 18 : 16);
          setLastSavedTime(null);
        }
      } catch (err) {
        console.error('Error fetching calendar:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCalendar();
  }, [school?.id, academicYear, semester]);

  const handleSave = async () => {
    if (!school?.id) return;
    setIsSaving(true);
    try {
      await schoolApi.upsertSchoolCalendar({
        school_id: school.id,
        academic_year: academicYear,
        semester,
        pekan_efektif: pekanEfektif,
        jp_duration_minutes: jpDurationMinutes,
        kalender_json: kalenderData,
      });

      const now = new Date().toLocaleString('id-ID');
      setLastSavedTime(now);
      await refreshSchool();
      toast.success(`Kalender Semester ${semester} Tahun ${academicYear} berhasil disimpan!`);
    } catch (err: any) {
      console.error('Error saving calendar:', err);
      toast.error(err.message || 'Gagal menyimpan kalender sekolah');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SchoolLayout
      pageTitle="Kalender Pendidikan & Jam Pelajaran"
      pageDescription="Atur kalender kurikulum terpadu sekolah. Otomatis disalin saat guru membuat modul baru."
      headerActions={
        <div className="flex items-center gap-2">
          {lastSavedTime && (
            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground font-mono font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Disimpan: {lastSavedTime}
            </span>
          )}
          <Button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-black text-xs border-2 border-foreground rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Kalender
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Info Banner */}
        <div className="p-4 sm:p-5 rounded-2xl border-2 border-foreground bg-[#fff3ed] flex items-start gap-3 shadow-brutal-sm">
          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-xs space-y-1 text-foreground">
            <p className="font-black text-primary">Prinsip Satu Sumber Kebenaran (Single Source of Truth):</p>
            <p className="leading-relaxed font-medium">
              Kalender yang Anda simpan di sini akan otomatis disalin (*copy-on-create*) saat setiap guru di{' '}
              <strong>{school?.name}</strong> membuat Workspace baru. Guru tidak perlu lagi menghitung pekan efektif atau memasukkan agenda libur secara manual.
            </p>
          </div>
        </div>

        {/* Setting Toolbar: Tahun Ajaran, Semester, Alokasi */}
        <Card className="border-2 border-foreground rounded-2xl shadow-brutal bg-card">
          <CardHeader className="pb-3 border-b-2 border-foreground/10">
            <CardTitle className="text-base sm:text-lg font-black flex items-center gap-2 text-foreground">
              <Calendar className="w-5 h-5 text-primary" />
              Periode Akademik & Alokasi Dasar
            </CardTitle>
            <CardDescription className="text-xs font-medium">
              Tentukan tahun ajaran dan semester yang sedang Anda konfigurasikan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {/* Tahun Ajaran */}
              <div className="space-y-1.5">
                <Label className="font-bold text-xs text-foreground">Tahun Ajaran</Label>
                <Input
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="2024/2025"
                  className="font-bold border-2 border-foreground rounded-xl shadow-brutal-sm bg-card"
                />
              </div>

              {/* Semester Tabs */}
              <div className="space-y-1.5">
                <Label className="font-bold text-xs text-foreground">Semester</Label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted rounded-xl border-2 border-foreground">
                  <button
                    type="button"
                    onClick={() => setSemester(1)}
                    className={`py-1.5 text-xs font-black rounded-lg transition-all ${
                      semester === 1
                        ? 'bg-foreground text-background shadow-brutal-sm'
                        : 'text-foreground/70 hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    Sem 1 (Ganjil)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSemester(2)}
                    className={`py-1.5 text-xs font-black rounded-lg transition-all ${
                      semester === 2
                        ? 'bg-primary text-primary-foreground shadow-brutal-sm'
                        : 'text-foreground/70 hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    Sem 2 (Genap)
                  </button>
                </div>
              </div>

              {/* Pekan Efektif */}
              <div className="space-y-1.5">
                <Label className="font-bold text-xs text-foreground">Pekan Efektif KBM</Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={pekanEfektif}
                  onChange={(e) => setPekanEfektif(parseInt(e.target.value) || 18)}
                  className="font-bold border-2 border-foreground rounded-xl shadow-brutal-sm bg-card"
                />
              </div>

              {/* Durasi JP (Menit) */}
              <div className="space-y-1.5">
                <Label className="font-bold text-xs text-foreground">Durasi 1 JP (Menit)</Label>
                <Input
                  type="number"
                  min={15}
                  max={120}
                  value={jpDurationMinutes}
                  onChange={(e) => setJpDurationMinutes(parseInt(e.target.value) || 45)}
                  className="font-bold border-2 border-foreground rounded-xl shadow-brutal-sm bg-card"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detail Kalender Pendidikan Form */}
        <Card className="border-2 border-foreground shadow-brutal">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-black flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Rincian Agenda, Libur & Minggu Efektif
            </CardTitle>
            <CardDescription>
              Konfigurasi tanggal awal semester, libur jeda/semester, UTS/UAS, dan hari efektif per bulan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-12 text-center text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                Memuat kalender sekolah...
              </div>
            ) : (
              <div className="space-y-6">
                <KalenderPendidikanForm
                  kalender={kalenderData}
                  onChange={(updated) => setKalenderData(updated)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SchoolLayout>
  );
}
