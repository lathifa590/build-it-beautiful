import React, { useEffect, useState } from 'react';
import { useSchool } from '@/contexts/SchoolContext';
import { useAuth } from '@/contexts/AuthContext';
import { SchoolGate } from '@/components/school/SchoolGate';
import { SchoolLayout } from '@/components/school/SchoolLayout';
import { schoolApi } from '@/lib/school-api';
import {
  FileText,
  Save,
  Building2,
  CheckCircle2,
  Lock,
  Sparkles,
  ShieldCheck,
  Eye,
  Upload,
  Image as ImageIcon,
  Trash2,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function SekolahStandarPage() {
  return (
    <SchoolGate>
      <SekolahStandarContent />
    </SchoolGate>
  );
}

function SekolahStandarContent() {
  const { school, isWaka, refreshSchool } = useSchool();
  const { user, isAdmin } = useAuth();

  const [kopHeader, setKopHeader] = useState('');
  const [kopSub, setKopSub] = useState('');
  const [kopLogoUrl, setKopLogoUrl] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [kepsekName, setKepsekName] = useState('');
  const [kepsekNip, setKepsekNip] = useState('');
  const [wakaName, setWakaName] = useState('');
  const [wakaNip, setWakaNip] = useState('');
  const [titimangsaKota, setTitimangsaKota] = useState('Kota Setempat');
  const [isKopLocked, setIsKopLocked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const canEdit = isWaka || isAdmin || (user?.email === 'jagofeed@gmail.com');

  useEffect(() => {
    if (school) {
      setKopHeader(school.kop_header_text || `PEMERINTAH DAERAH PROVINSI / KABUPATEN\nDINAS PENDIDIKAN DAN KEBUDAYAAN\n${school.name.toUpperCase()}`);
      setKopSub(school.kop_sub_text || (school.alamat ? `${school.alamat} | NPSN: ${school.npsn || '-'}` : 'Jalan Pendidikan No. 1 | NPSN: ' + (school.npsn || '-')));
      setKopLogoUrl(school.kop_logo_url || '');
      setKepsekName(school.kepsek_name || '');
      setKepsekNip(school.kepsek_nip || '');
      setWakaName(school.waka_name || '');
      setWakaNip(school.waka_nip || '');
      setTitimangsaKota(school.titimangsa_kota || 'Kota Setempat');
      setIsKopLocked(school.is_kop_locked ?? false);
    }
  }, [school]);

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !school?.id) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Format logo harus JPEG atau PNG');
      return;
    }

    if (file.size > 500 * 1024) {
      toast.error('Ukuran logo maksimal 500 KB');
      return;
    }

    setIsUploadingLogo(true);
    try {
      const fileExt = file.type === 'image/png' ? 'png' : 'jpg';
      const filePath = `${user.id}/school_logo_${school.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('letterheads')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('letterheads')
        .getPublicUrl(filePath);

      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      setKopLogoUrl(publicUrl);
      toast.success('Logo sekolah berhasil diunggah! Jangan lupa klik Simpan Standar.');
    } catch (err: any) {
      console.error('Error uploading school logo:', err);
      toast.error(err.message || 'Gagal mengunggah logo sekolah');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleDeleteLogo = () => {
    setKopLogoUrl('');
    toast.info('Logo dilepas. Klik Simpan Standar untuk menyimpan perubahan.');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school?.id) return;

    setIsSaving(true);
    try {
      await schoolApi.updateSchoolGovernance(school.id, {
        kop_header_text: kopHeader,
        kop_sub_text: kopSub,
        kop_logo_url: kopLogoUrl || null,
        kepsek_name: kepsekName,
        kepsek_nip: kepsekNip,
        waka_name: wakaName,
        waka_nip: wakaNip,
        titimangsa_kota: titimangsaKota,
        is_kop_locked: isKopLocked,
      });

      toast.success('Standar tata kelola & kop sekolah berhasil disimpan!');
      await refreshSchool();
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menyimpan standar sekolah');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SchoolLayout
      pageTitle="Kop Surat & Standar Pengesahan Resmi"
      pageDescription="Atur tata letak kop surat resmi, pejabat penandatangan, dan kunci standarisasi dokumen sekolah."
      headerActions={
        canEdit && (
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-black gap-1.5 border-2 border-foreground rounded-xl shadow-brutal-sm hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Menyimpan...' : 'Simpan Standar'}
          </Button>
        )
      }
    >
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Inputs (Left Column) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Kop Surat */}
          <Card className="border-2 border-foreground shadow-brutal rounded-2xl bg-card">
            <CardHeader className="pb-3 border-b-2 border-foreground/10">
              <CardTitle className="text-base font-black flex items-center gap-2 text-foreground">
                <Building2 className="w-4 h-4 text-primary" />
                Format Kop Surat Resmi Sekolah
              </CardTitle>
              <CardDescription className="text-xs font-medium">
                Kop surat ini akan otomatis tercantum pada bagian atas cetak modul ajar dan perangkat pembelajaran dewan guru.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              {/* Upload Logo Resmi Sekolah */}
              <div className="space-y-2 p-3 bg-muted/40 rounded-xl border-2 border-foreground/15">
                <label className="text-xs font-bold text-foreground block">
                  Logo Resmi Sekolah (Tercantum pada Kop Dokumen)
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="w-16 h-16 rounded-xl border-2 border-foreground bg-card flex items-center justify-center shrink-0 overflow-hidden shadow-brutal-sm">
                    {kopLogoUrl ? (
                      <img src={kopLogoUrl} alt="Logo Sekolah" className="w-full h-full object-contain p-1" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-muted-foreground/60" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1 w-full text-center sm:text-left">
                    <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/png,image/jpeg"
                          onChange={handleUploadLogo}
                          disabled={!canEdit || isUploadingLogo}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!canEdit || isUploadingLogo}
                          className="text-xs font-bold gap-1.5 border-2 border-foreground shadow-brutal-sm hover:shadow-none pointer-events-none"
                        >
                          {isUploadingLogo ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Upload className="w-3.5 h-3.5" />
                          )}
                          <span>{isUploadingLogo ? 'Mengunggah...' : 'Unggah Logo (PNG/JPEG)'}</span>
                        </Button>
                      </label>
                      {kopLogoUrl && canEdit && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleDeleteLogo}
                          className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-bold"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Hapus Logo
                        </Button>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Maksimal 500 KB. Disarankan gambar PNG transparan agar rapi di lembar cetak Word & PDF.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Header Instansi & Nama Sekolah (Baris 1 - 3)
                </label>
                <Textarea
                  value={kopHeader}
                  onChange={(e) => setKopHeader(e.target.value)}
                  rows={3}
                  disabled={!canEdit || isSaving}
                  placeholder="PEMERINTAH PROVINSI...&#10;DINAS PENDIDIKAN...&#10;SMA NEGERI 1..."
                  className="font-bold text-xs uppercase font-sans border-2 border-foreground rounded-xl shadow-brutal-sm bg-card"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Alamat & Kontak Sekolah (Baris Bawah)
                </label>
                <Input
                  value={kopSub}
                  onChange={(e) => setKopSub(e.target.value)}
                  disabled={!canEdit || isSaving}
                  placeholder="Jl. Merdeka No. 10 | Telp: (0341) 123456 | Email: info@sekolah.sch.id"
                  className="text-xs border-2 border-foreground rounded-xl shadow-brutal-sm font-medium bg-card"
                />
              </div>

              <div className="p-3 bg-muted/60 rounded-xl border-2 border-foreground/20 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-primary" />
                    Kunci Kop Surat untuk Seluruh Guru
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    Jika aktif, guru tidak dapat mengubah format kop saat mengekspor dokumen modul ke Word/PDF.
                  </p>
                </div>
                <Switch
                  checked={isKopLocked}
                  onCheckedChange={setIsKopLocked}
                  disabled={!canEdit}
                />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Pengesahan & Tanda Tangan */}
          <Card className="border-2 border-foreground shadow-brutal rounded-2xl bg-card">
            <CardHeader className="pb-3 border-b-2 border-foreground/10">
              <CardTitle className="text-base font-black flex items-center gap-2 text-foreground">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Pejabat Pengesahan Kurikulum
              </CardTitle>
              <CardDescription className="text-xs font-medium">
                Data Kepala Sekolah dan Waka Kurikulum yang dicantumkan pada lembar pengesahan perangkat ajar.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Kota Titimangsa</label>
                <Input
                  value={titimangsaKota}
                  onChange={(e) => setTitimangsaKota(e.target.value)}
                  disabled={!canEdit || isSaving}
                  placeholder="Contoh: Malang, Surabaya, Jakarta"
                  className="text-xs border-2 border-foreground rounded-xl shadow-brutal-sm font-medium bg-card"
                />
                <p className="text-[10px] text-muted-foreground font-medium">
                  Format di lembar pengesahan: <em>"{titimangsaKota}, 15 Juli 2026"</em>
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Nama Kepala Sekolah</label>
                  <Input
                    value={kepsekName}
                    onChange={(e) => setKepsekName(e.target.value)}
                    disabled={!canEdit || isSaving}
                    placeholder="Drs. H. Ahmad Fauzi, M.Pd."
                    className="text-xs border-2 border-foreground rounded-xl shadow-brutal-sm font-medium bg-card"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">NIP Kepala Sekolah</label>
                  <Input
                    value={kepsekNip}
                    onChange={(e) => setKepsekNip(e.target.value)}
                    disabled={!canEdit || isSaving}
                    placeholder="19680315 199203 1 004"
                    className="text-xs font-mono border-2 border-foreground rounded-xl shadow-brutal-sm font-medium bg-card"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Nama Waka Kurikulum</label>
                  <Input
                    value={wakaName}
                    onChange={(e) => setWakaName(e.target.value)}
                    disabled={!canEdit || isSaving}
                    placeholder="Siti Rahmawati, S.Pd., M.Si."
                    className="text-xs border-2 border-foreground rounded-xl shadow-brutal-sm font-medium bg-card"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">NIP Waka Kurikulum</label>
                  <Input
                    value={wakaNip}
                    onChange={(e) => setWakaNip(e.target.value)}
                    disabled={!canEdit || isSaving}
                    placeholder="19820512 200801 2 015"
                    className="text-xs font-mono border-2 border-foreground rounded-xl shadow-brutal-sm font-medium bg-card"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview (Right Column) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-2 border-foreground shadow-brutal bg-card rounded-2xl sticky top-20 overflow-hidden">
            <CardHeader className="pb-3 border-b-2 border-foreground/10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-black flex items-center gap-1.5 text-foreground">
                  <Eye className="w-4 h-4 text-primary" />
                  Pratinjau Lembar Pengesahan
                </CardTitle>
                <Badge variant="outline" className="text-[10px] font-black uppercase border-2 border-foreground bg-secondary">
                  Standar Otomatis
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-4 space-y-4 text-xs font-serif bg-white text-black dark:bg-slate-950 dark:text-slate-100 rounded-b-xl">
              {/* Header Kop */}
              <div className="border-b-2 border-black dark:border-white pb-2 flex items-center gap-3">
                {kopLogoUrl && (
                  <div className="w-12 h-12 shrink-0 flex items-center justify-center">
                    <img src={kopLogoUrl} alt="Logo" className="max-h-12 max-w-12 object-contain" />
                  </div>
                )}
                <div className="flex-1 text-center space-y-0.5">
                  <div className="font-bold text-[11px] leading-tight whitespace-pre-wrap uppercase tracking-wide">
                    {kopHeader || 'PEMERINTAH PROVINSI\nDINAS PENDIDIKAN\nNAMA SEKOLAH'}
                  </div>
                  <div className="text-[9px] font-sans text-gray-600 dark:text-gray-400">
                    {kopSub || 'Alamat Sekolah | NPSN | Kontak'}
                  </div>
                </div>
              </div>

              {/* Title Pengesahan */}
              <div className="text-center py-2 space-y-1">
                <h4 className="font-bold uppercase tracking-wider text-xs underline">
                  LEMBAR PENGESAHAN PERANGKAT AJAR
                </h4>
                <p className="text-[10px] font-sans text-gray-600 dark:text-gray-400">
                  Tahun Ajaran {school?.academic_year_active || '2024/2025'}
                </p>
              </div>

              {/* Body Text */}
              <p className="text-[10px] font-sans leading-relaxed text-justify">
                Perangkat Pembelajaran (Modul Ajar / RPP) ini telah diperiksa dan disetujui untuk dipergunakan dalam kegiatan pembelajaran Kurikulum Merdeka.
              </p>

              {/* Kolom Tanda Tangan */}
              <div className="pt-4 space-y-4 font-sans text-[10px]">
                <div className="text-right">
                  {titimangsaKota}, 15 Juli 2024
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-[9px] text-gray-600 dark:text-gray-400">Mengetahui,</p>
                    <p className="font-bold">Waka Kurikulum</p>
                    <div className="h-12 flex items-center justify-center italic text-gray-400 text-[9px]">
                      (Tanda Tangan)
                    </div>
                    <p className="font-bold underline">{wakaName || 'Nama Waka Kurikulum'}</p>
                    <p className="text-[8px] font-mono text-gray-600 dark:text-gray-400">
                      NIP. {wakaNip || '--------------------'}
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] text-gray-600 dark:text-gray-400">Menyetujui,</p>
                    <p className="font-bold">Kepala Sekolah</p>
                    <div className="h-12 flex items-center justify-center italic text-gray-400 text-[9px]">
                      (Tanda Tangan & Stempel)
                    </div>
                    <p className="font-bold underline">{kepsekName || 'Nama Kepala Sekolah'}</p>
                    <p className="text-[8px] font-mono text-gray-600 dark:text-gray-400">
                      NIP. {kepsekNip || '--------------------'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </SchoolLayout>
  );
}
