import React, { useEffect, useState, useMemo } from 'react';
import { useSchool } from '@/contexts/SchoolContext';
import { useAuth } from '@/contexts/AuthContext';
import { SchoolGate } from '@/components/school/SchoolGate';
import { SchoolLayout } from '@/components/school/SchoolLayout';
import { schoolApi } from '@/lib/school-api';
import type { SchoolSupervisionReportItem } from '@/types/school';
import {
  FileSpreadsheet,
  Printer,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Search,
  Building2,
  FileCheck,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

export default function SekolahExportPage() {
  return (
    <SchoolGate>
      <SekolahExportContent />
    </SchoolGate>
  );
}

function SekolahExportContent() {
  const { school } = useSchool();
  const [report, setReport] = useState<SchoolSupervisionReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchReport = async () => {
    if (!school?.id) return;
    setIsLoading(true);
    try {
      const data = await schoolApi.getSchoolSupervisionReport(school.id);
      setReport(data);
    } catch (err: any) {
      console.error('Error fetching supervision report:', err);
      toast.error('Gagal memuat rekap supervisi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [school?.id]);

  const filteredReport = useMemo(() => {
    if (!searchQuery.trim()) return report;
    const q = searchQuery.toLowerCase();
    return report.filter(
      (r) =>
        r.display_name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.school_role.toLowerCase().includes(q)
    );
  }, [report, searchQuery]);

  // Statistik Ringkas Supervisi
  const stats = useMemo(() => {
    const totalTeachers = report.length;
    const totalModulesReady = report.reduce((sum, r) => sum + Number(r.total_modules_ready || 0), 0);
    const totalApproved = report.reduce((sum, r) => sum + Number(r.total_approved_modules || 0), 0);
    const fullyCompliant = report.filter((r) => r.compliance_percent >= 70).length;

    const avgCompliance = totalTeachers > 0
      ? Math.round(report.reduce((sum, r) => sum + r.compliance_percent, 0) / totalTeachers)
      : 0;

    return { totalTeachers, totalModulesReady, totalApproved, fullyCompliant, avgCompliance };
  }, [report]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <SchoolLayout
      pageTitle="Rekap Supervisi & Kepatuhan Kurikulum Dinas"
      pageDescription="Laporan ketercapaian administrasi perangkat ajar seluruh dewan guru untuk kebutuhan supervisi pengawas dan akreditasi."
      headerActions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchReport}
            disabled={isLoading}
            className="text-xs gap-1.5 border-2 border-foreground rounded-xl shadow-brutal-sm hover:shadow-none font-bold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Segarkan
          </Button>
          <Button
            size="sm"
            onClick={handlePrint}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-black gap-1.5 border-2 border-foreground rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all print:hidden"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak Laporan / Simpan PDF
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Print Only Header Kop */}
        <div className="hidden print:block text-center border-b-2 border-black pb-3 mb-6 space-y-1">
          <h2 className="font-bold text-sm uppercase whitespace-pre-wrap leading-tight">
            {school?.kop_header_text || 'DINAS PENDIDIKAN DAN KEBUDAYAAN\n' + (school?.name?.toUpperCase() || 'SEKOLAH')}
          </h2>
          <p className="text-[11px] text-gray-600">
            {school?.kop_sub_text || school?.alamat || 'Laporan Resmi Supervisi Akademik'}
          </p>
          <h3 className="font-black text-sm uppercase underline pt-2">
            REKAPITULASI SUPERVISI KELENGKAPAN PERANGKAT PEMBELAJARAN
          </h3>
          <p className="text-xs">
            Tahun Ajaran {school?.academic_year_active || '2024/2025'}
          </p>
        </div>

        {/* 4 Kartu Metrik Supervisi (Non-print) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 print:hidden">
          <div className="bg-card border-2 border-foreground rounded-2xl p-4 sm:p-5 shadow-brutal flex flex-col justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Total Dewan Guru</span>
            <span className="text-3xl sm:text-4xl font-black text-foreground mt-2">{stats.totalTeachers}</span>
          </div>

          <div className="bg-[#eef2ff] border-2 border-foreground rounded-2xl p-4 sm:p-5 shadow-brutal flex flex-col justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-900">Modul Selesai Dibuat</span>
            <span className="text-3xl sm:text-4xl font-black text-[#1d4ed8] mt-2">{stats.totalModulesReady}</span>
          </div>

          <div className="bg-[#e6f9f0] border-2 border-foreground rounded-2xl p-4 sm:p-5 shadow-brutal flex flex-col justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900">Telah Disetujui Waka</span>
            <span className="text-3xl sm:text-4xl font-black text-[#047857] mt-2">{stats.totalApproved}</span>
          </div>

          <div className="bg-[#fefce8] border-2 border-foreground rounded-2xl p-4 sm:p-5 shadow-brutal flex flex-col justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-900">Rata-rata Kepatuhan</span>
            <span className="text-3xl sm:text-4xl font-black text-[#b45309] mt-2">{stats.avgCompliance}%</span>
          </div>
        </div>

        {/* Tabel Rekapitulasi Supervisi */}
        <Card className="border-2 border-foreground shadow-brutal rounded-2xl overflow-hidden print:border-none print:shadow-none">
          <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-foreground/10 bg-card print:hidden">
            <div>
              <CardTitle className="text-base font-black flex items-center gap-2 text-foreground">
                <FileSpreadsheet className="w-4 h-4 text-primary" />
                Matriks Supervisi Kepatuhan Perangkat Ajar
              </CardTitle>
              <CardDescription className="text-xs font-medium">
                Daftar kelengkapan administrasi ajar per guru berdasarkan modul yang selesai dan disetujui.
              </CardDescription>
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari guru..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs border-2 border-foreground rounded-xl shadow-brutal-sm font-medium"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-muted uppercase font-black border-y-2 border-foreground print:border-black print:bg-gray-100">
                  <tr>
                    <th className="px-3 py-2.5 w-10 text-center">No</th>
                    <th className="px-3 py-2.5">Nama Guru</th>
                    <th className="px-3 py-2.5 text-center">Workspace</th>
                    <th className="px-3 py-2.5 text-center">Alokasi JP</th>
                    <th className="px-3 py-2.5 text-center">Modul Jadi</th>
                    <th className="px-3 py-2.5 text-center">Disetujui Waka</th>
                    <th className="px-3 py-2.5 text-center">Ketuntasan</th>
                    <th className="px-3 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-foreground/15 print:divide-black font-medium">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-muted-foreground">
                        Memuat data laporan supervisi...
                      </td>
                    </tr>
                  ) : filteredReport.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-muted-foreground">
                        Tidak ada data guru yang tercatat.
                      </td>
                    </tr>
                  ) : (
                    filteredReport.map((item, idx) => {
                      const isComplete = item.compliance_percent >= 70;

                      return (
                        <tr key={item.user_id} className="hover:bg-muted/40 transition-colors">
                          <td className="px-3 py-2.5 text-center font-mono font-bold">{idx + 1}</td>
                          <td className="px-3 py-2.5">
                            <div className="font-bold text-foreground">{item.display_name}</div>
                            <div className="text-[10px] text-muted-foreground font-mono">{item.email}</div>
                          </td>
                          <td className="px-3 py-2.5 text-center font-bold">{item.total_workspaces}</td>
                          <td className="px-3 py-2.5 text-center font-bold">{item.total_jp_planned} JP</td>
                          <td className="px-3 py-2.5 text-center font-bold text-primary">{item.total_modules_ready}</td>
                          <td className="px-3 py-2.5 text-center font-bold text-emerald-700">{item.total_approved_modules}</td>
                          <td className="px-3 py-2.5 text-center font-bold font-mono">
                            {item.compliance_percent}%
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <Badge
                              className={`text-[9px] font-bold ${
                                isComplete
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : 'bg-amber-100 text-amber-800 border-amber-300'
                              }`}
                            >
                              {isComplete ? 'Tuntas' : 'Proses'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Print Only Signatures */}
        <div className="hidden print:block pt-8 text-xs font-sans">
          <div className="text-right pb-4">
            {school?.titimangsa_kota || 'Kota Setempat'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>

          <div className="grid grid-cols-2 gap-8 text-center">
            <div>
              <p>Mengetahui,</p>
              <p className="font-bold">Waka Kurikulum</p>
              <div className="h-16 flex items-center justify-center italic text-gray-400">
                (Tanda Tangan)
              </div>
              <p className="font-bold underline">{school?.waka_name || 'Nama Waka Kurikulum'}</p>
              <p className="text-[10px] font-mono">NIP. {school?.waka_nip || '--------------------'}</p>
            </div>

            <div>
              <p>Mengesahkan,</p>
              <p className="font-bold">Kepala Sekolah</p>
              <div className="h-16 flex items-center justify-center italic text-gray-400">
                (Tanda Tangan & Stempel)
              </div>
              <p className="font-bold underline">{school?.kepsek_name || 'Nama Kepala Sekolah'}</p>
              <p className="text-[10px] font-mono">NIP. {school?.kepsek_nip || '--------------------'}</p>
            </div>
          </div>
        </div>
      </div>
    </SchoolLayout>
  );
}
