/**
 * Koreksi Fase 3C — UI: akses hasil V2 di mobile & isolasi export legacy.
 */
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MobileNavigation } from '@/components/modul/MobileNavigation';
import { Toolbar } from '@/components/modul/Toolbar';

describe('Fase 3C — MobileNavigation', () => {
  const renderNav = (hasGeneratedSteps: boolean) =>
    render(
      <MobileNavigation
        mobileTab="form"
        setMobileTab={() => {}}
        hasGeneratedSteps={hasGeneratedSteps}
      />,
    );

  it('V2 aktif tanpa generatedSteps tetap dapat membuka Hasil Preview', () => {
    const generatedSteps = null;
    const isV2Active = true;
    renderNav(!!generatedSteps || isV2Active);
    expect(screen.getByText('Hasil Preview').closest('button')).not.toBeDisabled();
  });

  it('flag OFF dan generatedSteps kosong mempertahankan perilaku lama (disabled)', () => {
    const generatedSteps = null;
    const isV2Active = false;
    renderNav(!!generatedSteps || isV2Active);
    expect(screen.getByText('Hasil Preview').closest('button')).toBeDisabled();
  });
});

const toolbarProps = {
  activeTab: 'modul',
  setActiveTab: () => {},
  loaders: { lkpd: false, asesmen: false, materi: false, tindakLanjut: false, bankSoal: false },
  lkpdData: null,
  asesmenData: null,
  materiData: null,
  tindakLanjutData: null,
  bankSoalData: null,
  onGenerateLKPD: () => {},
  onGenerateAsesmen: () => {},
  onGenerateMateri: () => {},
  onGenerateTindakLanjut: () => {},
  onOpenSoalModal: () => {},
};

const openExportMenus = () => {
  const triggers = screen.getAllByText('Export').map((n) => n.closest('button')!);
  triggers.forEach((t) => fireEvent.keyDown(t, { key: 'Enter' }));
};

describe('Fase 3C — isolasi export legacy pada Toolbar', () => {
  it('v2Mode=true menonaktifkan export legacy (handler tidak terpanggil)', () => {
    const onExportCurrentTab = vi.fn();
    const onExportAll = vi.fn();
    const onExportPDF = vi.fn();
    render(
      <Toolbar
        {...toolbarProps}
        v2Mode
        onExportCurrentTab={onExportCurrentTab}
        onExportAll={onExportAll}
        onExportPDF={onExportPDF}
      />,
    );
    openExportMenus();
    expect(screen.queryByText('Export Tab ke Word')).toBeNull();
    expect(screen.queryByText('Export Semua ke Word')).toBeNull();
    expect(screen.queryByText('Export ke PDF')).toBeNull();
    const notice = screen.getAllByText(
      'Export dokumen per pertemuan tersedia pada fase berikutnya.',
    );
    expect(notice.length).toBeGreaterThan(0);
    fireEvent.click(notice[0]);
    expect(onExportCurrentTab).not.toHaveBeenCalled();
    expect(onExportAll).not.toHaveBeenCalled();
    expect(onExportPDF).not.toHaveBeenCalled();
  });

  it('v2Mode=false menyediakan menu export legacy seperti sebelumnya', () => {
    const onExportCurrentTab = vi.fn();
    render(
      <Toolbar
        {...toolbarProps}
        onExportCurrentTab={onExportCurrentTab}
        onExportAll={() => {}}
        onExportPDF={() => {}}
      />,
    );
    openExportMenus();
    expect(screen.getAllByText('Export Tab ke Word').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Export Semua ke Word').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Export ke PDF').length).toBeGreaterThan(0);
    fireEvent.click(screen.getAllByText('Export Tab ke Word')[0]);
    expect(onExportCurrentTab).toHaveBeenCalled();
  });
});
