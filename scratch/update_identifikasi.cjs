const fs = require('fs');
const path = require('path');

const docPreviewPath = "e:/3. PRODUK DIGITAL/05 - Aplikasi dan Pengembangan/App/5. modul ajar generator/LOVABLE/Fase 4B.1/src/components/modul/DocumentPreview.tsx";

let code = fs.readFileSync(docPreviewPath, 'utf8');

// Find the block starting from:
// {/* Identifikasi Table or Minimalis */}
// {!isPanduan && (
//   isNarasi ? (

const startIndex = code.indexOf(`{/* Identifikasi Table or Minimalis */}`);
if (startIndex === -1) throw new Error("Could not find start index");

// Find the end of this block by looking for the next section:
// {/* 4. LANGKAH-LANGKAH PEMBELAJARAN */}

const endIndex = code.indexOf(`{/* 4. LANGKAH-LANGKAH PEMBELAJARAN */}`, startIndex);
if (endIndex === -1) throw new Error("Could not find end index");

const oldBlock = code.substring(startIndex, endIndex);

const newBlock = `        {/* Identifikasi Display Logic */}
        {!isPanduan && isRingkasan && (
          <div style={{ marginBottom: '20px', fontSize: '10pt' }}>
            <h3 style={{ fontSize: '11pt', fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '4px', marginBottom: '8px' }}>I. IDENTIFIKASI</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'x-4 y-2', marginBottom: '8px' }}>
              <span style={{ marginRight: '12px' }}><strong>Penyusun:</strong> {formData.namaPenyusun}</span>
              <span style={{ marginRight: '12px' }}><strong>Sekolah:</strong> {formData.sekolah}</span>
              <span style={{ marginRight: '12px' }}><strong>Mapel:</strong> {formData.mataPelajaran}</span>
              <span style={{ marginRight: '12px' }}><strong>Kelas/Fase:</strong> {formData.kelas} / {formData.fase}</span>
              <span style={{ marginRight: '12px' }}><strong>Materi:</strong> {formData.materi} {formData.subMateri && \`- \${formData.subMateri}\`}</span>
              <span><strong>Pertemuan:</strong> {formData.pertemuan.length} ({getTotalDurasi(formData)} Menit)</span>
            </div>
            <div style={{ fontStyle: 'italic', color: '#4b5563', marginTop: '8px', padding: '8px', backgroundColor: '#f8fafc', borderRadius: '4px' }}>
              <strong>Profil Siswa:</strong> Memiliki pengetahuan awal {formData.aspekPengetahuanAwal?.toLowerCase() || '-'}, dengan minat pada {formData.aspekMinat?.toLowerCase() || '-'}, dan latar belakang {formData.aspekLatarBelakang?.toLowerCase() || '-'}. Kebutuhan belajar: {formData.aspekKebutuhanBelajar?.toLowerCase() || '-'}.
            </div>
          </div>
        )}

        {!isPanduan && (isPerPertemuan || isModular) && (
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '10.5pt' }}>
            <tbody>
              <tr>
                <td colSpan={2} style={{ borderBottom: '2px solid black', paddingBottom: '4px', fontWeight: 'bold', fontSize: '12pt' }}>I. IDENTIFIKASI DASAR</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 0', width: '30%', verticalAlign: 'top', fontWeight: 'bold' }}>Penyusun & Sekolah</td>
                <td style={{ padding: '6px 0', verticalAlign: 'top' }}>{formData.namaPenyusun} — {formData.sekolah}</td>
              </tr>
              <tr>
                <td style={{ borderTop: '1px solid #e2e8f0', padding: '6px 0', verticalAlign: 'top', fontWeight: 'bold' }}>Mata Pelajaran</td>
                <td style={{ borderTop: '1px solid #e2e8f0', padding: '6px 0', verticalAlign: 'top' }}>{formData.mataPelajaran} (Kelas {formData.kelas} / Fase {formData.fase})</td>
              </tr>
              <tr>
                <td style={{ borderTop: '1px solid #e2e8f0', padding: '6px 0', verticalAlign: 'top', fontWeight: 'bold' }}>Materi Pokok</td>
                <td style={{ borderTop: '1px solid #e2e8f0', padding: '6px 0', verticalAlign: 'top' }}>{formData.materi} {formData.subMateri && \`- \${formData.subMateri}\`}</td>
              </tr>
              <tr>
                <td style={{ borderTop: '1px solid #e2e8f0', padding: '6px 0', verticalAlign: 'top', fontWeight: 'bold' }}>Alokasi Waktu</td>
                <td style={{ borderTop: '1px solid #e2e8f0', padding: '6px 0', verticalAlign: 'top' }}>{formData.pertemuan.length} Pertemuan ({getTotalDurasi(formData)} Menit)</td>
              </tr>
            </tbody>
          </table>
        )}

        {!isPanduan && isMinimalis && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '4px', marginBottom: '8px' }}>I. IDENTIFIKASI DASAR</h3>
            <div style={{ paddingLeft: '8px', marginBottom: '16px' }}>
              <div style={{ marginBottom: '4px' }}><strong>Nama Penyusun:</strong> {formData.namaPenyusun}</div>
              <div style={{ marginBottom: '4px' }}><strong>Sekolah:</strong> {formData.sekolah}</div>
              <div style={{ marginBottom: '4px' }}><strong>Mata Pelajaran:</strong> {formData.mataPelajaran}</div>
              <div style={{ marginBottom: '4px' }}><strong>Materi:</strong> {formData.materi} {formData.subMateri && \`- \${formData.subMateri}\`}</div>
              <div style={{ marginBottom: '4px' }}><strong>Kelas/Fase:</strong> {formData.kelas} / {formData.fase}</div>
              <div style={{ marginBottom: '4px' }}><strong>Semester:</strong> {formData.semester}</div>
              <div style={{ marginBottom: '4px' }}><strong>Jumlah Pertemuan:</strong> {formData.pertemuan.length} ({getTotalDurasi(formData)} Menit)</div>
            </div>

            <h3 style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '4px', marginBottom: '8px' }}>II. IDENTIFIKASI MURID</h3>
            <div style={{ paddingLeft: '8px', marginBottom: '16px' }}>
              <div style={{ marginBottom: '4px' }}><strong>Aspek Pengetahuan Awal:</strong> {formData.aspekPengetahuanAwal || '-'}</div>
              <div style={{ marginBottom: '4px' }}><strong>Aspek Minat:</strong> {formData.aspekMinat || '-'}</div>
              <div style={{ marginBottom: '4px' }}><strong>Aspek Latar Belakang:</strong> {formData.aspekLatarBelakang || '-'}</div>
              <div style={{ marginBottom: '4px' }}><strong>Aspek Kebutuhan Belajar:</strong> {formData.aspekKebutuhanBelajar || '-'}</div>
            </div>

            <h3 style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '4px', marginBottom: '8px' }}>III. JENIS PENGETAHUAN MATERI</h3>
            <div style={{ paddingLeft: '8px', marginBottom: '16px' }}>
              <div style={{ marginBottom: '4px' }}><strong>Faktual:</strong> {formData.materiPengetahuan?.faktual || '-'}</div>
              <div style={{ marginBottom: '4px' }}><strong>Konseptual:</strong> {formData.materiPengetahuan?.konseptual || '-'}</div>
              <div style={{ marginBottom: '4px' }}><strong>Prosedural:</strong> {formData.materiPengetahuan?.prosedural || '-'}</div>
              <div style={{ marginBottom: '4px' }}><strong>Metakognitif:</strong> {formData.materiPengetahuan?.metakognitif || '-'}</div>
              <div style={{ marginBottom: '4px', marginTop: '8px' }}><strong>Kaitan dengan Kehidupan:</strong> {formData.kaitanKehidupan || '-'}</div>
            </div>
          </div>
        )}

        {!isPanduan && isTabel && (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginBottom: '20px',
              fontFamily: 'Arial, sans-serif',
              fontSize: '11pt',
            }}
          >
            <tbody>
              <tr>
                <td
                  colSpan={2}
                  style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold', backgroundColor: '#e2e8f0' }}
                >
                  I. IDENTIFIKASI DASAR
                </td>
              </tr>
              <tr>
                <td
                  style={{
                    border: '1px solid black',
                    padding: '6px',
                    fontWeight: 'bold',
                    verticalAlign: 'top',
                    width: '30%'
                  }}
                >
                  Identitas Umum
                </td>
                <td style={{ border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>Nama Penyusun:</strong> {formData.namaPenyusun}
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>Sekolah:</strong> {formData.sekolah}
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>Mata Pelajaran:</strong> {formData.mataPelajaran}
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>Materi:</strong> {formData.materi} {formData.subMateri && \`- \${formData.subMateri}\`}
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>Kelas/Fase:</strong> {formData.kelas} / {formData.fase}
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>Semester:</strong> {formData.semester}
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>Jumlah Pertemuan:</strong> {formData.pertemuan.length} ({getTotalDurasi(formData)} Menit)
                  </div>
                </td>
              </tr>
              <tr>
                <td
                  colSpan={2}
                  style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold', backgroundColor: '#e2e8f0' }}
                >
                  II. IDENTIFIKASI MURID
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                  Aspek Pengetahuan Awal
                </td>
                <td style={{ border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                  {formData.aspekPengetahuanAwal || '-'}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                  Aspek Minat
                </td>
                <td style={{ border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                  {formData.aspekMinat || '-'}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                  Aspek Latar Belakang
                </td>
                <td style={{ border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                  {formData.aspekLatarBelakang || '-'}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                  Aspek Kebutuhan Belajar
                </td>
                <td style={{ border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                  {formData.aspekKebutuhanBelajar || '-'}
                </td>
              </tr>
              <tr>
                <td
                  colSpan={2}
                  style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold', backgroundColor: '#e2e8f0' }}
                >
                  III. JENIS PENGETAHUAN MATERI
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                  Faktual
                </td>
                <td style={{ border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                  {formData.materiPengetahuan?.faktual || '-'}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                  Konseptual
                </td>
                <td style={{ border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                  {formData.materiPengetahuan?.konseptual || '-'}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                  Prosedural
                </td>
                <td style={{ border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                  {formData.materiPengetahuan?.prosedural || '-'}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                  Metakognitif
                </td>
                <td style={{ border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                  {formData.materiPengetahuan?.metakognitif || '-'}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                  Kaitan dengan Kehidupan
                </td>
                <td style={{ border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                  {formData.kaitanKehidupan || '-'}
                </td>
              </tr>
            </tbody>
          </table>
        )}
        
`;

code = code.replace(oldBlock, newBlock);

fs.writeFileSync(docPreviewPath, code);
console.log("Successfully replaced identifikasi logic.");

