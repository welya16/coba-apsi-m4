## Progres Implementasi Figma
- Menggunakan Figma MCP Server dan GitHub Copilot untuk mengekstrak dan mengimplementasikan desain UI/UX halaman login dan workspace ke dalam struktur project Next.js (`/app`).
- Komponen antarmuka modular ditempatkan di `app/workspace.tsx` dan dipanggil di `app/page.tsx`, dengan penyesuaian styling pada `app/globals.css`.
- Progres revisi implementasi Figma

### Backend & API Integration
- Mengimplementasikan REST API modular Next.js App Router di folder `app/api/` 
- Memperbaiki validasi pendaftaran, login dan autentikasi berbasis database Prisma, role user, menampilkan data, mengubah data, menyimpan data ke database, logika tombol pada UI
- Menghubungkan fungsi fetch UI di `workspace.tsx` secara langsung ke endpoint API backend.

## Prompt Revisi Workspace.tsx
Tolong perbarui tampilan file `workspace.tsx` ini agar tata letak, desain, struktur grid/flex, serta gambar, logo, atau ikon disamakan persis dengan desain Figma saya di link berikut: https://www.figma.com/design/hVpelTkMKlaXM11zZdTJHl/REVISI-UI?node-id=4-3&t=aRgCNqbVvnnJy1s8-1
**Aturan Penting yang Wajib Dipatuhi:**

1. **Jangan mengubah, merusak, atau menghapus** logika backend, fungsi `fetch`, pemanggilan API, state (`useState`), maupun *event handler* yang sudah ada di kode.
2. Pastikan variabel data, props, dan koneksi ke database/Prisma tetap utuh dan berfungsi normal.
3. Masukkan dan letakkan semua gambar, logo, atau aset visual yang ada di desain Figma tersebut ke dalam posisi yang sesuai di `workspace.tsx` (gunakan tag `<img>` atau komponen `Image` dengan *path* atau *placeholder* yang tepat).
4. Hanya fokus mengubah struktur HTML/JSX dan kelas Tailwind CSS/styling-nya saja agar tampilannya menyerupai Figma tanpa merusak fungsionalitas aplikasi."

## Prompt API
Tolong buatkan semua rute backend modular di `app/api/` untuk setiap peran login yang ada di halaman utama (Pelanggan, Admin, Owner, Produksi, Pengiriman) lengkap dengan autentikasi berbasis database Prisma, sehingga saat tombol peran apa pun diklik, tidak terjadi error 404.

## Prompt perbaikan UI/UX Figma
Saya ingin kamu membantu mengimplementasikan desain UI/UX dari Figma berikut ke dalam project website yang sedang saya kerjakan.

**Link Figma:**
[https://www.figma.com/design/hVpelTkMKlaXM11zZdTJHl/REVISI-UI?node-id=4-3](https://www.figma.com/design/hVpelTkMKlaXM11zZdTJHl/REVISI-UI?node-id=4-3)

### Instruksi Pengerjaan

1. **Pelajari desain Figma terlebih dahulu.**

- Perhatikan seluruh elemen desain pada frame yang ditentukan.
- Identifikasi layout, struktur halaman, warna, tipografi, ukuran komponen, spacing, ikon, tombol, card, navbar, sidebar, dan elemen lainnya.
- Perhatikan hubungan antarhalaman dan konsistensi desain.
- Jika tersedia Figma MCP, gunakan untuk membaca detail desain secara langsung.
2. **Analisis project yang sudah ada.**

- Periksa struktur folder dan seluruh file yang relevan.
- Identifikasi framework, library, komponen, serta konfigurasi yang sudah digunakan.
- Pertahankan teknologi dan struktur project yang sudah ada.
- Jangan menghapus atau merombak fitur yang sudah berjalan tanpa alasan yang jelas.
3. **Implementasikan desain Figma ke dalam kode.**

- Buat tampilan website semirip mungkin dengan desain Figma.
- Gunakan komponen yang reusable agar kode lebih rapi dan mudah dikembangkan.
- Terapkan warna, font, ukuran, jarak, dan proporsi elemen sesuai desain.
- Pastikan layout responsif untuk desktop, tablet, dan mobile.
- Gunakan ikon dan aset visual yang sesuai dengan desain.
- Hindari penggunaan elemen atau dekorasi tambahan yang tidak terdapat dalam desain.
4. **Pastikan seluruh fitur berfungsi.**

- Tombol, navigasi, form, dropdown, modal, dan elemen interaktif lainnya harus memiliki fungsi yang sesuai.
- Hubungkan tampilan dengan fungsi yang sudah tersedia di project.
- Jangan hanya membuat tampilan statis jika desain menunjukkan adanya interaksi.
- Pertahankan integrasi database dan backend yang sudah ada.
5. **Ketentuan teknis.**

- Gunakan TypeScript dan Tailwind CSS apabila sesuai dengan konfigurasi project.
- Ikuti standar penulisan kode yang sudah digunakan.
- Hindari duplikasi kode.
- Jangan mengubah konfigurasi penting tanpa kebutuhan.
- Jangan menghapus dependensi atau file yang masih digunakan.
- Pastikan tidak ada error pada proses build maupun runtime.

### Tahapan Pengerjaan
Kerjakan dengan urutan berikut:

1. Analisis desain Figma.
2. Analisis struktur project.
3. Tentukan file yang perlu dibuat atau diperbarui.
4. Implementasikan desain secara menyeluruh.
5. Periksa kembali kesesuaian tampilan dengan Figma.
6. Jalankan project dan perbaiki error yang ditemukan.
**PENTING:**
Jangan langsung membuat desain berdasarkan asumsi sendiri. Jadikan Figma sebagai acuan utama. Jangan mengganti desain dengan interpretasi yang berbeda. Pertahankan fitur dan fungsionalitas project yang sudah ada.

Jika desain Figma tidak dapat diakses, jangan menebak tampilannya. Beri tahu saya bagian mana yang perlu saya sediakan agar implementasi dapat dilakukan secara akurat.

Saya ingin hasil akhir berupa implementasi UI yang benar-benar terintegrasi dengan project existing, bukan sekadar mockup atau prototype.

## Prompt perubahan UI/UX agar gambar muncul 
# TASK: IMPLEMENTASI UI FIGMA 1:1 DAN PERBAIKAN GAMBAR KATALOG PRODUK
Saya ingin kamu melakukan implementasi dan perbaikan pada proyek website yang sedang terbuka di VS Code berdasarkan desain Figma berikut:

**Figma:** [https://www.figma.com/design/hVpelTkMKlaXM11zZdTJHl/REVISI-UI?node-id=4-3](https://www.figma.com/design/hVpelTkMKlaXM11zZdTJHl/REVISI-UI?node-id=4-3)

## A. ATURAN UTAMA: DESAIN HARUS SAMA PERSIS DENGAN FIGMA
Figma adalah satu-satunya sumber acuan desain. Saya tidak meminta desain ulang, melainkan implementasi desain yang sudah tersedia ke dalam kode program.

Ketentuan wajib:

1. Jangan mengubah desain asli Figma.
2. Jangan menambahkan elemen yang tidak ada pada Figma.
3. Jangan mengurangi atau menghilangkan elemen yang ada pada Figma.
4. Jangan mengubah susunan, posisi, ukuran, maupun proporsi komponen.
5. Jangan mengganti warna, font, ikon, ilustrasi, gambar, atau aset visual.
6. Jangan mengubah teks, judul, label, maupun konten.
7. Jangan membuat komponen tambahan berdasarkan asumsi sendiri.
8. Jangan mengubah desain dengan alasan ingin membuatnya lebih modern, menarik, atau minimalis.
Ikuti seluruh detail visual Figma, meliputi:

- Layout dan struktur halaman.
- Background dan warna setiap komponen.
- Typography, font size, font weight, dan line height.
- Margin, padding, gap, dan spacing.
- Border, border radius, dan shadow.
- Ukuran dan posisi tombol.
- Ikon, ilustrasi, serta gambar.
- Ukuran, posisi, dan proporsi setiap card.
- Navbar, sidebar, footer, dan seluruh komponen lainnya.
Hasil implementasi harus memiliki tingkat kemiripan visual setinggi mungkin dengan desain Figma (*pixel-perfect*).

## B. PERBAIKAN GAMBAR PADA KATALOG PRODUK
Ada kendala pada implementasi sebelumnya, yaitu gambar produk yang terdapat pada desain Figma tidak muncul ketika website dijalankan melalui localhost maupun ketika website sudah di-deploy.

Saya ingin masalah ini diperiksa dan diperbaiki sampai tuntas.

**Jangan hanya memperbaiki tampilan gambar. Cari dan perbaiki penyebab utama gambar tidak muncul.**

Lakukan pemeriksaan berikut:

### 1. Periksa seluruh aset gambar

- Identifikasi seluruh gambar produk yang digunakan pada katalog Figma.
- Periksa apakah seluruh file gambar sudah tersedia di dalam proyek.
- Periksa lokasi penyimpanan gambar.
- Periksa nama file dan ekstensi gambar.
- Pastikan tidak ada gambar yang salah referensi atau hilang.
- Pastikan gambar yang digunakan sesuai dengan produk pada desain Figma.

### 2. Periksa path gambar
Pastikan seluruh path gambar mengarah ke lokasi file yang benar.

Jika menggunakan Next.js:

- Periksa penggunaan folder `public`.
- Pastikan gambar dalam folder `public` dipanggil menggunakan path yang benar.
- Contoh: file `public/images/produk1.png` dipanggil menggunakan `/images/produk1.png`.
- Jangan menggunakan path lokal komputer seperti `C:/Users/...`.
- Jangan menggunakan path relatif yang menyebabkan gambar gagal ditemukan.
- Periksa kesalahan penulisan nama file, ekstensi, dan huruf besar-kecil (*case sensitivity*).

### 3. Periksa komponen gambar
Periksa seluruh implementasi gambar pada komponen katalog produk, termasuk:

- Tag `img`.
- Komponen `Image` dari Next.js apabila digunakan.
- Source gambar (`src`).
- Penggunaan data produk.
- Mapping gambar berdasarkan data produk.
- Konfigurasi `next.config.ts` atau `next.config.js`.
- Pengaturan domain gambar eksternal jika memang digunakan.
Pastikan tidak ada kesalahan konfigurasi yang menyebabkan gambar gagal ditampilkan.

### 4. Periksa data katalog produk

- Pastikan setiap produk memiliki referensi gambar yang benar.
- Periksa apakah properti gambar pada data produk sudah sesuai dengan yang dipanggil oleh komponen.
- Pastikan tidak ada nilai `undefined`, `null`, atau path kosong pada `src`.
- Pastikan seluruh gambar produk terhubung dengan produk yang tepat.
- Jangan mengganti gambar asli dengan gambar produk lain.

### 5. Periksa perbedaan localhost dan deployment
Perbaiki agar gambar dapat ditampilkan pada kedua kondisi berikut:

**Localhost:**

- Seluruh gambar produk harus muncul ketika proyek dijalankan secara lokal.
- Tidak boleh ada gambar yang mengalami error 404.
- Tidak boleh ada gambar yang hanya muncul setelah halaman di-refresh berulang kali.
**Deployment:**

- Seluruh gambar produk harus tetap muncul setelah website di-deploy.
- Pastikan path gambar tidak bergantung pada direktori lokal komputer.
- Periksa konfigurasi hosting dan proses build.
- Perhatikan perbedaan sistem file antara Windows dan server Linux, khususnya huruf besar-kecil nama file.
- Pastikan seluruh aset gambar ikut tersedia pada hasil deployment.
- Jika menggunakan URL gambar eksternal, pastikan URL dapat diakses oleh browser dan tidak mengalami masalah izin akses.

### 6. Jangan menggunakan solusi sementara
Dilarang:

- Mengganti gambar produk asli dengan gambar random.
- Menggunakan placeholder sebagai pengganti gambar asli.
- Menghapus komponen gambar dari katalog.
- Menghilangkan produk yang gambarnya bermasalah.
- Mengubah desain katalog untuk menyembunyikan masalah gambar.
- Menggunakan URL gambar sementara yang tidak dijamin tersedia.
- Menggunakan gambar yang berbeda hanya agar tampilan terlihat penuh.
Jika ditemukan gambar yang memang belum tersedia, identifikasi gambar tersebut dan jelaskan aset apa yang dibutuhkan. Jangan mengarang gambar pengganti.

## C. KETENTUAN IMPLEMENTASI KODE
Sebelum melakukan perubahan:

1. Pelajari struktur folder dan seluruh file proyek.
2. Identifikasi framework, library, dan teknologi yang digunakan.
3. Periksa komponen halaman yang sudah tersedia.
4. Periksa file CSS atau Tailwind yang digunakan.
5. Periksa seluruh aset gambar dan data produk.
6. Pelajari desain Figma secara menyeluruh, bukan hanya melihat gambaran umumnya.
Selanjutnya:

- Gunakan struktur proyek yang sudah ada.
- Pertahankan teknologi dan dependensi yang sudah digunakan.
- Jangan menghapus fitur yang sudah berjalan.
- Jangan mengubah fungsi backend atau database yang tidak berkaitan dengan pekerjaan ini.
- Jangan membuat ulang proyek dari awal.
- Jangan mengganti framework.
- Jangan melakukan perubahan pada bagian yang sudah sesuai dengan Figma.
- Hindari perubahan kode yang tidak berhubungan dengan kebutuhan.
Jika diperlukan perubahan pada komponen yang sudah ada, lakukan secara hati-hati agar fungsi sebelumnya tetap berjalan.

## D. VALIDASI DAN PENGUJIAN
Setelah implementasi selesai, lakukan pemeriksaan berikut:

**Pengujian visual:**

1. Bandingkan setiap halaman dengan desain Figma.
2. Periksa posisi dan ukuran komponen.
3. Periksa kesesuaian warna dan typography.
4. Periksa seluruh gambar dan ikon.
5. Pastikan tidak ada elemen yang bertambah atau berkurang.
6. Pastikan tidak ada perubahan desain yang tidak diminta.
**Pengujian gambar:**

1. Jalankan website melalui localhost.
2. Periksa seluruh gambar pada katalog produk.
3. Periksa apakah semua gambar berhasil dimuat.
4. Periksa Console Browser dan Network untuk menemukan error gambar.
5. Periksa apakah ada error 404, 403, atau kesalahan pemuatan aset.
6. Jalankan proses build untuk memastikan tidak ada error.
7. Pastikan konfigurasi dan aset siap digunakan pada deployment.
Jangan menyatakan masalah sudah selesai jika gambar masih belum berhasil ditampilkan.

## E. PRIORITAS PENGERJAAN
Urutan pengerjaan wajib:

1. Memeriksa akses dan membaca desain Figma.
2. Memeriksa struktur proyek yang sudah ada.
3. Mengidentifikasi seluruh komponen dan aset gambar.
4. Mengidentifikasi penyebab gambar katalog tidak muncul.
5. Memperbaiki masalah gambar tanpa mengubah desain.
6. Mengimplementasikan desain Figma secara akurat.
7. Menguji hasil pada localhost.
8. Memeriksa kesiapan hasil untuk deployment.
9. Memastikan tidak ada fitur lama yang rusak.

## F. LAPORAN HASIL PEKERJAAN
Setelah selesai, berikan laporan yang menjelaskan:

1. File apa saja yang diperiksa.
2. File apa saja yang diubah.
3. Penyebab gambar katalog sebelumnya tidak muncul.
4. Perbaikan yang dilakukan.
5. Apakah seluruh gambar produk sudah berhasil ditampilkan di localhost.
6. Apakah proses build berhasil.
7. Apakah ada kendala yang masih belum terselesaikan.
8. Apakah ada aset Figma yang belum tersedia.
Jika belum bisa mengakses Figma, jangan membuat asumsi desain. Minta akses atau referensi yang diperlukan terlebih dahulu.

---

# INSTRUKSI FINAL (WAJIB DIPATUHI)
Saya menginginkan hasil website yang sama persis dengan desain Figma, bukan desain yang menyerupai atau terinspirasi dari Figma.

Tidak boleh ada penambahan, pengurangan, penggantian, maupun perubahan desain.

Fokus utama pekerjaan adalah:

1. Kesamaan desain website dengan Figma.
2. Seluruh gambar katalog produk tampil dengan benar.
3. Website berjalan dengan baik di localhost.
4. Aset dan gambar tetap berfungsi setelah deployment.
Jangan berhenti hanya karena tampilan website sudah terlihat bagus. Pastikan setiap elemen sudah sesuai dengan Figma dan masalah gambar sudah ditemukan penyebabnya serta diperbaiki.

**JANGAN BERIMPROVISASI. JANGAN MENGUBAH DESAIN. JANGAN MENGHILANGKAN KOMPONEN. IKUTI FIGMA SEBAGAI ACUAN MUTLAK.**

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
