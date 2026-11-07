## Progres Implementasi Figma
- Menggunakan Figma MCP Server dan GitHub Copilot untuk mengekstrak dan mengimplementasikan desain UI/UX halaman login dan workspace ke dalam struktur project Next.js (`/app`).
- Komponen antarmuka modular ditempatkan di `app/workspace.tsx` dan dipanggil di `app/page.tsx`, dengan penyesuaian styling pada `app/globals.css`.
- Progres revisi implementasi Figma

### Backend & API Integration
- Mengimplementasikan REST API modular Next.js App Router di folder `app/api/` 
- Memperbaiki validasi pendaftaran, login dan autentikasi berbasis database Prisma, role user, menampilkan data, mengubah data, menyimpan data ke database, logika tombol pada UI
- Menghubungkan fungsi fetch UI di `workspace.tsx` secara langsung ke endpoint API backend.