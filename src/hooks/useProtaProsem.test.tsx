import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import * as ExcelJS from "exceljs";
import { useProsemGenerator } from "./useProsemGenerator";
import { useProtaData } from "./useProtaData";
import { exportProtaProsemToExcel } from "@/lib/export-excel";
import { exportProtaToWord, exportProsemToWord } from "@/lib/export-word";
import type { ProtaData, ProsemEvent } from "@/types/modul";
import type { Workspace } from "@/types/workspace";

const mockMaybeSingle = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: () => mockMaybeSingle(),
          })),
        })),
      })),
    })),
  },
}));

vi.mock("file-saver", () => ({
  saveAs: vi.fn(),
}));

const sampleProtaData: ProtaData = {
  total_jp_sem1: 10,
  total_jp_sem2: 8,
  prota: [
    {
      no: 1,
      semester: 1,
      tujuan_pembelajaran: "Memahami bilangan bulat dan operasinya",
      materi_pokok: "Bilangan Bulat",
      alokasi_jp: 6,
      dimensi_profil_lulusan: ["Penalaran Kritis", "Kemandirian"],
      panca_cinta: "Cinta Ilmu",
      keterangan: "Minggu 1-2",
    },
    {
      no: 2,
      semester: 1,
      tujuan_pembelajaran: "Menyelesaikan persamaan linear satu variabel",
      materi_pokok: "PLSV",
      alokasi_jp: 4,
      dimensi_profil_lulusan: ["Kreativitas"],
      panca_cinta: "Cinta Sesama",
      keterangan: "Minggu 3",
    },
    {
      no: 3,
      semester: 2,
      tujuan_pembelajaran: "Menganalisis perbandingan senilai dan berbalik nilai",
      materi_pokok: "Perbandingan",
      alokasi_jp: 8,
      dimensi_profil_lulusan: ["Kolaborasi"],
      keterangan: "Semester Genap",
    },
  ],
};

const sampleWorkspace: Workspace = {
  id: "ws-prota-1",
  user_id: "user-1",
  name: "Matematika Kelas 7",
  subject: "Matematika",
  grade: "7",
  phase: "D",
  curriculum: "merdeka",
  semester: 1,
  academic_year: "2025/2026",
  created_at: "2025-07-01T00:00:00Z",
  updated_at: "2025-07-01T00:00:00Z",
};

describe("Prioritas 5: Perhitungan Distribusi JP & Matriks Prota/Prosem", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Distribusi Minggu & Alokasi JP pada useProsemGenerator", () => {
    it("harus menghasilkan tepat 6 bulan berurutan termasuk saat melintasi pergantian tahun (misal Nov 2025 - Apr 2026)", async () => {
      const { result } = renderHook(() => useProsemGenerator());

      let prosem: Awaited<ReturnType<typeof result.current.generate>> = null;
      await act(async () => {
        prosem = await result.current.generate(
          sampleProtaData,
          1,
          18,
          "2025-11-03",
          [],
          { "2025-11": 4, "2025-12": 4, "2026-1": 5 }
        );
      });

      expect(prosem).not.toBeNull();
      expect(prosem!.months).toHaveLength(6);
      expect(prosem!.months[0]).toEqual({ bulan: 11, tahun: 2025, mingguCount: 4 });
      expect(prosem!.months[1]).toEqual({ bulan: 12, tahun: 2025, mingguCount: 4 });
      expect(prosem!.months[2]).toEqual({ bulan: 1, tahun: 2026, mingguCount: 5 });
      expect(prosem!.months[5].bulan).toBe(4);
      expect(prosem!.months[5].tahun).toBe(2026);
    });

    it("harus mendistribusikan JP sesuai jpPerMinggu (misal 4 JP/minggu) dan menghitung sisa JP ganjil dengan presisi", async () => {
      const { result } = renderHook(() => useProsemGenerator());

      // TP 1 = 6 JP -> dengan 4 JP/minggu membutuhkan ceil(6/4) = 2 minggu (W1: 4 JP, W2: 2 JP)
      // TP 2 = 4 JP -> membutuhkan ceil(4/4) = 1 minggu (W3: 4 JP)
      let prosem: Awaited<ReturnType<typeof result.current.generate>> = null;
      await act(async () => {
        prosem = await result.current.generate(
          sampleProtaData,
          1,
          18,
          "2025-07-14",
          [],
          { "2025-7": 4 },
          4 // 4 JP per minggu
        );
      });

      expect(prosem).not.toBeNull();
      const [row1, row2] = prosem!.rows;

      // Cek distribusi TP 1 (6 JP -> W1 = 4 JP, W2 = 2 JP)
      expect(row1.weeks["2025-07-W1"]).toEqual({ hasActivity: true, jp: 4 });
      expect(row1.weeks["2025-07-W2"]).toEqual({ hasActivity: true, jp: 2 });
      expect(row1.weeks["2025-07-W3"]).toBeUndefined();

      // Cek distribusi TP 2 melanjutkan di W3 (4 JP -> W3 = 4 JP)
      expect(row2.weeks["2025-07-W3"]).toEqual({ hasActivity: true, jp: 4 });
    });

    it("harus melompati minggu non-efektif (PTS, PAS, Libur) tanpa menghilangkan alokasi JP topik", async () => {
      const { result } = renderHook(() => useProsemGenerator());

      const events: ProsemEvent[] = [
        { nama: "Libur Awal Semester", semester: 1, bulan: 7, mingguKe: 1, tipe: "Libur Sekolah" },
        { nama: "PTS Ganjil", semester: 1, bulan: 7, mingguKe: 3, tipe: "PTS" },
      ];

      let prosem: Awaited<ReturnType<typeof result.current.generate>> = null;
      await act(async () => {
        // Default 2 JP/minggu: TP 1 (6 JP) butuh 3 minggu efektif.
        // Karena W1 dan W3 libur/PTS, maka TP 1 harus menempati W2, W4, dan bulan berikutnya (Agustus W1).
        prosem = await result.current.generate(
          sampleProtaData,
          1,
          18,
          "2025-07-14",
          events,
          { "2025-7": 4, "2025-8": 4 },
          2
        );
      });

      expect(prosem).not.toBeNull();
      const row1 = prosem!.rows[0];

      expect(row1.weeks["2025-07-W1"]).toBeUndefined(); // Libur
      expect(row1.weeks["2025-07-W2"]?.hasActivity).toBe(true);
      expect(row1.weeks["2025-07-W3"]).toBeUndefined(); // PTS
      expect(row1.weeks["2025-07-W4"]?.hasActivity).toBe(true);
      expect(row1.weeks["2025-08-W1"]?.hasActivity).toBe(true);
    });

    it("harus menangani error dengan aman jika protaData kosong atau semester tidak memiliki TP", async () => {
      const { result } = renderHook(() => useProsemGenerator());

      let resNull: Awaited<ReturnType<typeof result.current.generate>> = null;
      await act(async () => {
        resNull = await result.current.generate(null, 1, 18, "2025-07-14");
      });
      expect(resNull).toBeNull();
      expect(result.current.error).toContain("Data Program Tahunan belum tersedia");

      const emptySem2Prota: ProtaData = {
        ...sampleProtaData,
        prota: sampleProtaData.prota.filter((i) => i.semester === 1),
      };

      let resEmptySem2: Awaited<ReturnType<typeof result.current.generate>> = null;
      await act(async () => {
        resEmptySem2 = await result.current.generate(emptySem2Prota, 2, 16, "2026-01-05");
      });
      expect(resEmptySem2).toBeNull();
      expect(result.current.error).toContain("Tidak ada data Program Tahunan untuk Semester 2");
    });
  });

  describe("2. Hook useProtaData (Pengambilan Data Prota Workspace)", () => {
    it("harus memuat data Prota dari tabel curriculum_plans berdasarkan workspaceId", async () => {
      mockMaybeSingle.mockResolvedValueOnce({
        data: { id: "plan-1", content: sampleProtaData },
        error: null,
      });

      const { result } = renderHook(() => useProtaData("ws-prota-1"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.protaData).toEqual(sampleProtaData);
      expect(result.current.error).toBeNull();
    });

    it("harus menangkap pesan error jika query database gagal", async () => {
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: new Error("Koneksi database terputus"),
      });

      const { result } = renderHook(() => useProtaData("ws-prota-1"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.protaData).toBeNull();
      expect(result.current.error).toBe("Koneksi database terputus");
    });
  });

  describe("3. Ekspor Matriks Excel (.xlsx) & Word (.doc) untuk Prota dan Prosem", () => {
    it("harus menghasilkan buffer Excel (.xlsx) dengan struktur sheet Prota (termasuk kolom Panca Cinta untuk KBC) dan matriks Prosem", async () => {
      const { result } = renderHook(() => useProsemGenerator());

      // Simulasikan semester lintas tahun (Nov 2025 - Apr 2026) dengan event di bulan Januari 2026 (tahun ke-2)
      const crossYearEvents: ProsemEvent[] = [
        { nama: "Libur Tahun Baru", semester: 1, bulan: 1, mingguKe: 1, tipe: "Libur Nasional" },
      ];

      let prosemSem1: Awaited<ReturnType<typeof result.current.generate>> = null;
      await act(async () => {
        prosemSem1 = await result.current.generate(
          sampleProtaData,
          1,
          18,
          "2025-11-03",
          crossYearEvents,
          { "2025-11": 4, "2025-12": 4, "2026-1": 4 },
          4
        );
      });

      const kbcWorkspace: Workspace = { ...sampleWorkspace, curriculum: "kbc" };
      const buffer = await exportProtaProsemToExcel(
        kbcWorkspace,
        sampleProtaData,
        prosemSem1,
        null,
        true
      );

      expect(buffer).toBeDefined();

      // Baca kembali buffer menggunakan ExcelJS untuk memverifikasi isi sel
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(buffer as ArrayBuffer);

      const wsProta = wb.getWorksheet("Program Tahunan");
      expect(wsProta).toBeDefined();

      // Header kolom ke-6 pada kurikulum KBC harus "Panca Cinta"
      expect(wsProta!.getRow(1).getCell(6).value).toBe("Panca Cinta");
      // Baris data pertama (row 2) harus memiliki JP = 6 dan Panca Cinta = "Cinta Ilmu"
      expect(wsProta!.getRow(2).getCell(4).value).toBe(6);
      expect(wsProta!.getRow(2).getCell(6).value).toBe("Cinta Ilmu");

      const wsProsem = wb.getWorksheet("Program Semester 1");
      expect(wsProsem).toBeDefined();

      // Pastikan baris event "Libur Tahun Baru (Libur Nasional)" tercetak dengan simbol "■" di bulan Januari W1 (kolom ke-5 + 8 = 13)
      // Nov = 4 minggu (col 5..8), Des = 4 minggu (col 9..12), Jan W1 = col 13
      const eventRow = wsProsem!.getRow(5); // Row 1-2 header, Row 3-4 TP data, Row 5 Event
      expect(String(eventRow.getCell(1).value)).toContain("Libur Tahun Baru");
      expect(eventRow.getCell(13).value).toBe("■");
    });

    it("harus menghasilkan Blob dokumen Word (.doc) untuk Prota dan Prosem dengan perhitungan Minggu Efektif yang akurat", async () => {
      const { result } = renderHook(() => useProsemGenerator());

      const events: ProsemEvent[] = [
        { nama: "PTS", semester: 1, bulan: 7, mingguKe: 2, tipe: "PTS" },
      ];

      let prosemSem1: Awaited<ReturnType<typeof result.current.generate>> = null;
      await act(async () => {
        prosemSem1 = await result.current.generate(
          sampleProtaData,
          1,
          18,
          "2025-07-14",
          events,
          { "2025-7": 4, "2025-8": 4, "2025-9": 4, "2025-10": 4, "2025-11": 4, "2025-12": 4 },
          2
        );
      });

      const protaBlob = exportProtaToWord(
        sampleProtaData,
        { mataPelajaran: "Matematika", kelas: "7", fase: "D", sekolah: "SMPN 1 Nusantara" },
        true
      ) as Blob;

      expect(protaBlob).toBeInstanceOf(Blob);
      const protaHtml = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsText(protaBlob);
      });
      expect(protaHtml).toContain("PROGRAM TAHUNAN");
      expect(protaHtml).toContain("Total JP Semester 1");
      expect(protaHtml).toContain("Cinta Ilmu");

      const prosemBlob = exportProsemToWord(
        prosemSem1!,
        { mataPelajaran: "Matematika", kelas: "7", fase: "D" },
        1,
        true
      ) as Blob;

      expect(prosemBlob).toBeInstanceOf(Blob);
      const prosemHtml = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsText(prosemBlob);
      });
      // Total minggu = 6 bulan * 4 minggu = 24 minggu. 1 event PTS -> 23 minggu efektif, 1 Mg Tdk Efektif
      expect(prosemHtml).toContain("A. Perhitungan Minggu Efektif");
      expect(prosemHtml).toContain("23");
      expect(prosemHtml).toContain("1 Mg Tdk Efektif");
    });
  });
});

