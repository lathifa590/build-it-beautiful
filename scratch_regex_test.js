const str = `{
  "tujuan_pembelajaran": [
    {
      "teks": "Peserta didik mampu mengidentifikasi karakter diri sendiri
dan orang lain"
    }
  ],
  "teks_gabungan": "TP1\\nTP2"
}`;

const cleaned = str.replace(/[\n\r\t]+/g, ' ');
console.log(JSON.parse(cleaned));
