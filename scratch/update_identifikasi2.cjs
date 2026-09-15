const fs = require('fs');
const path = require('path');

const docPreviewPath = "e:/3. PRODUK DIGITAL/05 - Aplikasi dan Pengembangan/App/5. modul ajar generator/LOVABLE/Fase 4B.1/src/components/modul/DocumentPreview.tsx";

let code = fs.readFileSync(docPreviewPath, 'utf8');

const startIndex = code.indexOf(`{/* Identifikasi Table or Minimalis */}`);
if (startIndex === -1) throw new Error("Could not find start index");

const endIndex = code.indexOf(`{/* Desain Pembelajaran Table */}`, startIndex);
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
            
            <h3 style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '4px', marginBottom: '8px' }}>IV. INTEGRASI NILAI & KARAKTER</h3>
            <div style={{ paddingLeft: '8px', marginBottom: '16px' }}>
              <div><strong>Nilai Karakter:</strong> {formData.nilaiKarakter && formData.nilaiKarakter.length > 0 ? formData.nilaiKarakter.join(', ') : '-'}</div>
            </div>

            <h3 style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '4px', marginBottom: '8px' }}>V. DIMENSI PROFIL LULUSAN</h3>
            <div style={{ paddingLeft: '8px', marginBottom: '16px' }}>
              <div style={{ marginBottom: '4px' }}><strong>DPL yang Dikembangkan:</strong></div>
              {formData.dimensiProfilLulusan && formData.dimensiProfilLulusan.length > 0 ? (
                <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                  {formData.dimensiProfilLulusan.map((kode, idx) => {
                    const dpl = DPL_OPTIONS.find(d => d.kode === kode);
                    const desc = formData.dimensiProfilLulusanDeskripsi?.[kode];
                    return (
                      <li key={idx} style={{ marginBottom: desc ? '6px' : '0' }}>
                        <strong>{kode}:</strong> {dpl?.nama || kode}
                        {desc && <span> &mdash; {desc}</span>}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div style={{ marginLeft: '12px' }}>{formData.profilLulusan && formData.profilLulusan.length > 0 ? formData.profilLulusan.join(', ') : '-'}</div>
              )}
            </div>

            {formData.kurikulum === 'kbc' && (
              <>
                <h3 style={{ fontSize: '12pt', fontWeight: 'bold', borderBottom: '1px solid black', paddingBottom: '4px', marginBottom: '8px' }}>V-B. TOPIK PANCA CINTA (KBC)</h3>
                <div style={{ paddingLeft: '8px', marginBottom: '16px' }}>
                  <div style={{ marginBottom: '4px' }}><strong>Elemen Cinta yang Dikembangkan:</strong></div>
                  {(formData as any).topikPancaCinta && (formData as any).topikPancaCinta.length > 0 ? (
                    <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                      {(formData as any).topikPancaCinta.map((elemen, idx) => {
                        const desc = (formData as any).topikPancaCintaDeskripsi?.[elemen];
                        return (
                          <li key={idx} style={{ marginBottom: desc ? '6px' : '0' }}>
                            <strong>{elemen}</strong>
                            {desc && <span> &mdash; {desc}</span>}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div style={{ marginLeft: '12px' }}>-</div>
                  )}
                  <div style={{ marginTop: '8px', marginBottom: '4px' }}><strong>Materi Integrasi KBC:</strong></div>
                  <div style={{ marginLeft: '12px' }}>
                    {(formData as any).materiIntegrasiKBC 
                      ? formatRichText((formData as any).materiIntegrasiKBC)
                      : <span style={{ color: '#6b7280', fontStyle: 'italic' }}>Akan di-generate oleh AI</span>
                    }
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {!isPanduan && isTabel && (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: '1px solid black',
              marginBottom: '20px',
              tableLayout: 'fixed',
            }}
          >
            <colgroup>
              <col style={{ width: '30%' }} />
              <col style={{ width: '70%' }} />
            </colgroup>
            <tbody>
              <tr style={{ backgroundColor: '#e2e8f0' }}>
                <td
                  colSpan={2}
                  style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold' }}
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
                  }}
                >
                  Identitas Umum
                </td>
                <td style={{ border: '1px solid black', padding: '6px', verticalAlign: 'top' }}>
                  <div>
                    <strong>Nama Penyusun:</strong> {formData.namaPenyusun}
                  </div>
                  <div>
                    <strong>Sekolah:</strong> {formData.sekolah}
                  </div>
                  <div>
                    <strong>Mata Pelajaran:</strong> {formData.mataPelajaran}
                  </div>
                  <div>
                    <strong>Materi:</strong> {formData.materi} {formData.subMateri && \`- \${formData.subMateri}\`}
                  </div>
                  <div>
                    <strong>Kelas/Fase:</strong> {formData.kelas} / {formData.fase}
                  </div>
                  <div>
                    <strong>Semester:</strong> {formData.semester}
                  </div>
                  <div>
                    <strong>Jumlah Pertemuan:</strong> {formData.pertemuan.length} ({getTotalDurasi(formData)} Menit)
                  </div>
                </td>
              </tr>
              
              {/* Identifikasi Murid Section */}
              <tr style={{ backgroundColor: '#dbeafe' }}>
                <td
                  colSpan={2}
                  style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold' }}
                >
                  II. IDENTIFIKASI MURID
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                  Aspek Pengetahuan Awal
                </td>
                <td style={{ border: '1px solid black', padding: '6px' }}>
                  {formData.aspekPengetahuanAwal || '-'}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                  Aspek Minat
                </td>
                <td style={{ border: '1px solid black', padding: '6px' }}>
                  {formData.aspekMinat || '-'}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                  Aspek Latar Belakang
                </td>
                <td style={{ border: '1px solid black', padding: '6px' }}>
                  {formData.aspekLatarBelakang || '-'}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                  Aspek Kebutuhan Belajar
                </td>
                <td style={{ border: '1px solid black', padding: '6px' }}>
                  {formData.aspekKebutuhanBelajar || '-'}
                </td>
              </tr>
              
              {/* Jenis Pengetahuan Materi */}
              <tr style={{ backgroundColor: '#dcfce7' }}>
                <td
                  colSpan={2}
                  style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold' }}
                >
                  III. JENIS PENGETAHUAN MATERI
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                  Faktual
                </td>
                <td style={{ border: '1px solid black', padding: '6px' }}>
                  {formData.materiPengetahuan?.faktual || '-'}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                  Konseptual
                </td>
                <td style={{ border: '1px solid black', padding: '6px' }}>
                  {formData.materiPengetahuan?.konseptual || '-'}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                  Prosedural
                </td>
                <td style={{ border: '1px solid black', padding: '6px' }}>
                  {formData.materiPengetahuan?.prosedural || '-'}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                  Metakognitif
                </td>
                <td style={{ border: '1px solid black', padding: '6px' }}>
                  {formData.materiPengetahuan?.metakognitif || '-'}
                </td>
              </tr>
              
              {/* Kaitan Kehidupan */}
              <tr>
                <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                  Kaitan dengan Kehidupan
                </td>
                <td style={{ border: '1px solid black', padding: '6px' }}>
                  {formData.kaitanKehidupan || '-'}
                </td>
              </tr>
              
              {/* Integrasi Nilai & Karakter */}
              <tr style={{ backgroundColor: '#fef3c7' }}>
                <td
                  colSpan={2}
                  style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold' }}
                >
                  IV. INTEGRASI NILAI & KARAKTER
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                  Nilai Karakter
                </td>
                <td style={{ border: '1px solid black', padding: '6px' }}>
                  {formData.nilaiKarakter && formData.nilaiKarakter.length > 0 
                    ? formData.nilaiKarakter.join(', ')
                    : '-'}
                </td>
              </tr>
              
              {/* Dimensi Profil Lulusan - ALWAYS SHOWN */}
              <tr style={{ backgroundColor: '#e0e7ff' }}>
                <td
                  colSpan={2}
                  style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold' }}
                >
                  V. DIMENSI PROFIL LULUSAN
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                  DPL yang Dikembangkan
                </td>
                <td style={{ border: '1px solid black', padding: '6px' }}>
                  {formData.dimensiProfilLulusan && formData.dimensiProfilLulusan.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '16px' }}>
                      {formData.dimensiProfilLulusan.map((kode, idx) => {
                        const dpl = DPL_OPTIONS.find(d => d.kode === kode);
                        const desc = formData.dimensiProfilLulusanDeskripsi?.[kode];
                        return (
                          <li key={idx} style={{ marginBottom: desc ? '6px' : '0' }}>
                            <strong>{kode}:</strong> {dpl?.nama || kode}
                            {desc && <span> &mdash; {desc}</span>}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    formData.profilLulusan && formData.profilLulusan.length > 0 
                      ? formData.profilLulusan.join(', ')
                      : '-'
                  )}
                </td>
              </tr>
              
              {/* Topik Panca Cinta - KBC ONLY */}
              {formData.kurikulum === 'kbc' && (
                <>
                  <tr style={{ backgroundColor: '#fce7f3' }}>
                    <td
                      colSpan={2}
                      style={{ border: '1px solid black', padding: '8px', fontWeight: 'bold' }}
                    >
                      V-B. TOPIK PANCA CINTA (KBC)
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                      Elemen Cinta yang Dikembangkan
                    </td>
                    <td style={{ border: '1px solid black', padding: '6px' }}>
                      {(formData as any).topikPancaCinta && (formData as any).topikPancaCinta.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: '16px' }}>
                          {(formData as any).topikPancaCinta.map((elemen, idx) => {
                            const desc = (formData as any).topikPancaCintaDeskripsi?.[elemen];
                            return (
                              <li key={idx} style={{ marginBottom: desc ? '6px' : '0' }}>
                                <strong>{elemen}</strong>
                                {desc && <span> &mdash; {desc}</span>}
                              </li>
                            );
                          })}
                        </ul>
                      ) : '-'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ border: '1px solid black', padding: '6px', fontWeight: 'bold', verticalAlign: 'top' }}>
                      Materi Integrasi KBC
                    </td>
                    <td style={{ border: '1px solid black', padding: '6px' }}>
                      {(formData as any).materiIntegrasiKBC 
                        ? formatRichText((formData as any).materiIntegrasiKBC)
                        : <span style={{ color: '#6b7280', fontStyle: 'italic' }}>Akan di-generate oleh AI</span>
                      }
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        )}

`;

code = code.replace(oldBlock, newBlock);

fs.writeFileSync(docPreviewPath, code);
console.log('Successfully updated identifikasi rendering logic!');
