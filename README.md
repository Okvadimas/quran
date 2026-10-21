# Quran Verse Image Generator (Simple Edition)

Aplikasi web modern berbasis **React + Vite + Tailwind CSS** untuk membuat dan mengekspor gambar ayat-ayat suci Al-Qur'an beresolusi tinggi dengan tipografi estetik dan mode transparan.

---

## ✨ Fitur Utama

1. **Sumber Data Al-Qur'an**:
   - Diambil langsung dari [ALQuran.cloud](https://alquran.cloud/api) (edisi `quran-simple` dengan harakat rapi, terjemahan Indonesia `id.indonesian`, dan Inggris `en.asad`).
   - Lengkap 114 Surat dan seluruh ayat (6.236 ayat).

2. **3 Pilihan Font Arab**:
   - `Amiri`
   - `Amiri Quran`
   - `Scheherazade New`

3. **Kustomisasi Lengkap**:
   - **Ukuran Font Arab**: Slider responsif dari 22px hingga 68px.
   - **Spasi / Line Height & Text Alignment**: Tengah, Kanan, Kiri.
   - **Solid Color Background**: Palet warna elegan (Islamic Emerald, Midnight, Navy, Mocha, Parchment, dll.) + Color Picker kustom.
   - **Warna Teks & Aksen**: Palet warna (Emas, Putih, Mint, Amber, Perak, dll.) + Color Picker kustom.
   - **Mode Transparan (Alpha)**: Opsi toggle background transparan untuk keperluan stiker, overlay video, dsb.
   - **Terjemahan Ayat**: Toggle switch tampilkan/sembunyikan terjemahan (pilihan Bahasa Indonesia atau English) dengan pengaturan ukuran font.
   - **Aspek Rasio Gambar**: 1:1 Persegi (Feed), 9:16 (Story/Status/Reels), 4:5 (Portrait), 16:9 (Landscape/Banner), dan Auto-fit.
   - **Ornamen**: Toggle Bismillah Header & Badge referensi surat (`QS. ...`).

4. **Ekspor Gambar Resolusi Tinggi**:
   - Format file: **PNG** (mendukung transparansi) & **JPG/JPEG**.
   - Pilihan resolusi: 1x SD, 2x HD (Rekomendasi), 3x Ultra HD.
   - Tombol **Salin Gambar** ke clipboard (bisa langsung Ctrl+V ke WhatsApp Web, Twitter, dsb.).

---

## 🚀 Cara Menjalankan

Jalankan perintah berikut di folder proyek:

```bash
# 1. Jalankan development server
npm run dev
```

Buka browser di alamat:
**http://localhost:5173**

Untuk membuat versi produksi (*production build*):
```bash
npm run build
```
Hasil build akan tersimpan di folder `dist/`.
