## Konfirmasi temuan

Benar. Di `src/components/modul/DocumentPreview.tsx`:
- Baris 1831: blok gambar stimulus utama dibungkus `{bankSoalData.stimulus && (...)}` — jadi kalau tidak ada teks stimulus, generator gambar tidak muncul sama sekali.
- Baris 1871: gambar `stimulus_list` juga hanya muncul kalau soal punya `stimulus_id`.
- Tiap item soal (`daftar_soal[i]`) sama sekali tidak punya slot generator gambar, padahal type `SoalItem` di `src/types/modul.ts` sudah menyediakan field `stimulus_image` & `stimulus_image_prompt` per soal.

Jadi soal "polos" (tanpa bacaan) sekarang mustahil dikasih gambar dari UI.

## Yang akan diubah

Menambah generator gambar per soal, memakai teks pertanyaan sebagai prompt — tanpa mengubah perilaku stimulus yang sudah ada.

1. `src/pages/Index.tsx`
   - Tambah handler `handleUpdateSoalImage(imageUrl, soalIndex)` yang meng-update `bankSoalData.daftar_soal[soalIndex].stimulus_image`.
   - Teruskan sebagai prop baru `onUpdateSoalImage` ke `<DocumentPreview>`.
   - (Opsional kecil) Hitung soal-image ke `stimulusImageCount` supaya indikator kuota tetap akurat.

2. `src/components/modul/DocumentPreview.tsx`
   - Tambah prop `onUpdateSoalImage?: (url: string, soalIndex: number) => void`.
   - Di dalam `bankSoalData.daftar_soal.map(...)` (sekitar baris 1868), setelah baris pertanyaan (baris 1912–1914), render `<StimulusImageGenerator>` untuk tiap soal:
     - `prompt = s.pertanyaan` (fallback ke `s.stimulus_image_prompt` bila ada)
     - `imageUrl = s.stimulus_image || null`
     - `onImageGenerated = (url) => onUpdateSoalImage(url, i)`
     - `size="small"`, `enableEnrich`, `pertanyaan = s.pertanyaan`
   - Tetap dibungkus guard `onUpdateSoalImage && includeImages`, dan fallback read-only `<img>` untuk mode export/preview tanpa handler.
   - Blok stimulus utama & `stimulus_list` tidak diubah.

3. Word export
   - `StimulusImageGenerator` sudah memberi `data-no-export="true"` + `print:hidden` pada seluruh UI kontrol, sehingga di `.doc` yang keluar hanya `<img>` finalnya. Tidak perlu perubahan tambahan.

## Yang tidak diubah

- Logika stimulus utama & `stimulus_list` (posisi, styling, kondisi tampil) tetap.
- Edge function `generate-image` & `enrich-image-prompt` tidak disentuh — prompt sekarang cukup berasal dari kalimat soal.
- Tidak ada perubahan skema DB atau tipe (field `stimulus_image` di `SoalItem` sudah ada sejak awal).

## Catatan teknis

- Kuota gambar tetap ditangani `generate-image` (trial 3/hari); indikator lokal di komponen otomatis update dari response.
- Karena setiap soal mendapat komponen tersendiri, tombol "Ganti / Hapus / Regenerate" bekerja independen per nomor soal, sama seperti perilaku di stimulus utama.
