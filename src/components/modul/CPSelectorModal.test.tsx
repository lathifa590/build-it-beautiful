import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import {
  CPSelectorModal,
  clearCPSessionCache,
  extractElementsFromCPData,
} from './CPSelectorModal';

const { invokeMock, useAuthMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
  useAuthMock: vi.fn(() => ({
    user: { email: 'guru@sekolah.id' },
  })),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: invokeMock,
    },
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

describe('CPSelectorModal', () => {
  beforeEach(() => {
    clearCPSessionCache();
    invokeMock.mockReset();
    useAuthMock.mockReturnValue({ user: { email: 'guru@sekolah.id' } });
  });

  it('prioritizes fetch-cp-data (GitHub CP-Kurmer-2025) over local JSON for mapped Kemdikbud subjects', async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
        data: {
          mata_pelajaran: [
            {
              nama: 'Informatika',
              capaian_per_fase: [
                {
                  fase: 'D',
                  kelas: 'VII–IX',
                  elemen: {
                    'Berpikir Komputasional': 'Konten online resmi Informatika D - BK',
                    'Literasi Digital': 'Konten online resmi Informatika D - LD',
                  },
                },
              ],
            },
          ],
        },
      },
      error: null,
    });

    render(
      <CPSelectorModal
        open={true}
        onClose={vi.fn()}
        mataPelajaran="Informatika"
        fase="D"
        onSelectCP={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Konten online resmi Informatika D - BK')).toBeInTheDocument();
    });

    expect(invokeMock).toHaveBeenCalledTimes(1);
    expect(invokeMock).toHaveBeenCalledWith('fetch-cp-data', {
      body: {
        slug: 'informatika',
        fase: 'D',
        source: 'github',
        filterNama: 'Informatika',
      },
    });
    expect(screen.getByText('2 elemen ditemukan')).toBeInTheDocument();
    expect(screen.getByText('BSKAP No. 046/2025')).toBeInTheDocument();
  });

  it('filters multi-mapel GitHub payloads strictly so Matematika never includes Matematika Tingkat Lanjut', () => {
    const rawData = {
      mata_pelajaran: [
        {
          nama: 'Matematika',
          capaian_per_fase: [
            {
              fase: 'E',
              kelas: 'Kelas X',
              elemen: {
                Bilangan: 'CP Bilangan E',
                'Aljabar dan Fungsi': 'CP Aljabar E',
                'Analisis Data dan Peluang': 'CP Analisis Data E',
              },
            },
          ],
        },
        {
          nama: 'Matematika Tingkat Lanjut',
          capaian_per_fase: [
            {
              fase: 'F',
              kelas: 'Kelas XI-XII',
              elemen: {
                Geometri: 'CP Geometri F',
              },
            },
          ],
        },
      ],
    };

    const res = extractElementsFromCPData(rawData, 'Matematika', 'E');
    expect(res?.elements.map((e) => e.nama)).toEqual([
      'Bilangan',
      'Aljabar dan Fungsi',
      'Analisis Data dan Peluang',
    ]);
  });

  it('falls back to synced local master DB when fetch-cp-data fails offline', async () => {
    invokeMock.mockRejectedValueOnce(new Error('Network unavailable'));

    render(
      <CPSelectorModal
        open={true}
        onClose={vi.fn()}
        mataPelajaran="Informatika"
        fase="D"
        onSelectCP={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Berpikir Komputasional')).toBeInTheDocument();
    });

    expect(screen.getByText('Literasi Digital')).toBeInTheDocument();
    expect(screen.getByText('2 elemen ditemukan')).toBeInTheDocument();
    expect(screen.getByText('BSKAP No. 046/2025')).toBeInTheDocument();
  });

  it('queries local master DB directly without calling fetch-cp-data for PAUD and SMK kejuruan', async () => {
    render(
      <CPSelectorModal
        open={true}
        onClose={vi.fn()}
        mataPelajaran="Dasar-Dasar Teknik Otomotif"
        fase="E"
        onSelectCP={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('5 elemen ditemukan')).toBeInTheDocument();
    });
    expect(invokeMock).not.toHaveBeenCalled();

    clearCPSessionCache();
    render(
      <CPSelectorModal
        open={true}
        onClose={vi.fn()}
        mataPelajaran="PAUD"
        fase="Fondasi"
        onSelectCP={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('3 elemen ditemukan')).toBeInTheDocument();
    });
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it('keeps standard Kemdikbud subjects on github under kurikulum=kbc, routes Madrasah subjects to kbc_madrasah, and honors special user toggles', async () => {
    useAuthMock.mockReturnValue({ user: { email: 'goodteacherok1@gmail.com' } });

    invokeMock
      .mockResolvedValueOnce({
        data: {
          data: {
            mata_pelajaran: [
              {
                nama: 'Informatika',
                capaian_per_fase: [
                  {
                    fase: 'D',
                    kelas: 'VII-IX',
                    elemen: {
                      'Berpikir Komputasional': 'CP Inf KBC',
                    },
                  },
                ],
              },
            ],
          },
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: {
          data: {
            mata_pelajaran: [
              {
                nama: 'Informatika',
                capaian_per_fase: [
                  {
                    fase: 'D',
                    kelas: 'VII-IX',
                    elemen: {
                      BK: 'CP SK 032/2024 lama',
                    },
                  },
                ],
              },
            ],
          },
        },
        error: null,
      });

    render(
      <CPSelectorModal
        open={true}
        onClose={vi.fn()}
        mataPelajaran="Informatika"
        fase="D"
        kurikulum="kbc"
        onSelectCP={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('CP Inf KBC')).toBeInTheDocument();
    });
    expect(invokeMock).toHaveBeenNthCalledWith(1, 'fetch-cp-data', {
      body: {
        slug: 'informatika',
        fase: 'D',
        source: 'github',
        filterNama: 'Informatika',
      },
    });

    fireEvent.click(screen.getByRole('button', { name: 'CP SK 032/2024' }));

    await waitFor(() => {
      expect(screen.getByText('CP SK 032/2024 lama')).toBeInTheDocument();
    });
    expect(invokeMock).toHaveBeenNthCalledWith(2, 'fetch-cp-data', {
      body: {
        slug: 'informatika',
        fase: 'D',
        source: 'cp032',
        filterNama: 'Informatika',
      },
    });
    expect(screen.getByText('SK 032/2024')).toBeInTheDocument();
  });

  it('routes Madrasah subjects to kbc_madrasah source and renders Kemenag 2025 badge', async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
        data: {
          mata_pelajaran: [
            {
              nama: 'Fikih',
              capaian_per_fase: [
                {
                  fase: 'D',
                  kelas: 'VII-IX MTs',
                  elemen: {
                    Ibadah: 'CP Fikih Madrasah 2025',
                  },
                },
              ],
            },
          ],
        },
      },
      error: null,
    });

    render(
      <CPSelectorModal
        open={true}
        onClose={vi.fn()}
        mataPelajaran="Fikih"
        fase="D"
        kurikulum="kbc"
        onSelectCP={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('CP Fikih Madrasah 2025')).toBeInTheDocument();
    });
    expect(invokeMock).toHaveBeenCalledWith('fetch-cp-data', {
      body: {
        slug: 'fikih',
        fase: 'D',
        source: 'kbc_madrasah',
        filterNama: undefined,
      },
    });
    expect(screen.getByText('Kemenag 2025')).toBeInTheDocument();
  });

  it('resolves Fisika Fase E via IPA fallback and displays fallback info banner', async () => {
    invokeMock.mockResolvedValueOnce({
      data: {
        data: {
          mata_pelajaran: [
            {
              nama: 'Ilmu Pengetahuan Alam (IPA)',
              capaian_per_fase: [
                {
                  fase: 'E',
                  kelas: 'Kelas X',
                  elemen: {
                    'Pemahaman IPA': 'CP IPA Terintegrasi Fase E',
                  },
                },
              ],
            },
          ],
        },
      },
      error: null,
    });

    render(
      <CPSelectorModal
        open={true}
        onClose={vi.fn()}
        mataPelajaran="Fisika"
        fase="E"
        onSelectCP={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('CP IPA Terintegrasi Fase E')).toBeInTheDocument();
    });
    expect(invokeMock).toHaveBeenCalledWith('fetch-cp-data', {
      body: {
        slug: 'ilmu-pengetahuan-alam-ipa',
        fase: 'E',
        source: 'github',
        filterNama: undefined,
      },
    });
    expect(screen.getByText('Terintegrasi dalam IPA (Ilmu Pengetahuan Alam)')).toBeInTheDocument();
  });
});
