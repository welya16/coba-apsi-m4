-- ==========================================
-- BAGIAN 1: PEMBUATAN STRUKTUR TABEL (DDL)
-- ==========================================

CREATE TABLE Akun (
    id_akun VARCHAR(20) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    nama_lengkap VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL
);

CREATE TABLE Kode_pos (
    kode_pos VARCHAR(10) PRIMARY KEY,
    kelurahan VARCHAR(100),
    kecamatan VARCHAR(100),
    kota VARCHAR(100),
    provinsi VARCHAR(100)
);

CREATE TABLE Produk (
    id_produk VARCHAR(20) PRIMARY KEY,
    nama_produk VARCHAR(50) NOT NULL,
    jenis VARCHAR(50) NOT NULL,
    harga_dasar DECIMAL(12, 2) NOT NULL,
    deskripsi TEXT,
    bahan VARCHAR(100),
    status_tersedia VARCHAR(30)
);

CREATE TABLE Laporan (
    id_laporan VARCHAR(20) PRIMARY KEY,
    periode_bulan SMALLINT NOT NULL,
    periode_tahun SMALLINT NOT NULL,
    tgl_laporan DATE NOT NULL,
    total_pendapatan DECIMAL(14, 2) NOT NULL
);

CREATE TABLE Aktivitas_owner (
    id_akun VARCHAR(20) NOT NULL,
    id_laporan VARCHAR(20) NOT NULL,
    PRIMARY KEY (id_akun, id_laporan),
    FOREIGN KEY (id_akun) REFERENCES Akun(id_akun) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_laporan) REFERENCES Laporan(id_laporan) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE Pelanggan (
    id_pelanggan VARCHAR(20) PRIMARY KEY,
    id_akun VARCHAR(20) NOT NULL,
    jenis_kelamin VARCHAR(20),
    no_hp VARCHAR(20) NOT NULL,
    FOREIGN KEY (id_akun) REFERENCES Akun(id_akun) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE Alamat (
    id_alamat VARCHAR(20) PRIMARY KEY,
    id_pelanggan VARCHAR(20) NOT NULL,
    alamat_jalan VARCHAR(255) NOT NULL,
    alamat_rt VARCHAR(3),
    alamat_rw VARCHAR(3),
    kode_pos VARCHAR(10),
    FOREIGN KEY (id_pelanggan) REFERENCES Pelanggan(id_pelanggan) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (kode_pos) REFERENCES Kode_pos(kode_pos) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE Pesanan (
    id_pesanan VARCHAR(30) PRIMARY KEY,
    id_pelanggan VARCHAR(20),
    id_admin VARCHAR(20) NOT NULL,
    tgl_konfirmasi DATE,
    total_harga DECIMAL(12, 2) NOT NULL,
    status_pesanan VARCHAR(40) NOT NULL,
    tgl_pesan DATE NOT NULL,
    tgl_butuh DATE,
    metode_pengambilan VARCHAR(20) NOT NULL,
    catatan VARCHAR(255),
    FOREIGN KEY (id_pelanggan) REFERENCES Pelanggan(id_pelanggan) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (id_admin) REFERENCES Akun(id_akun) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE Pembayaran (
    id_pembayaran VARCHAR(20) PRIMARY KEY,
    id_pesanan VARCHAR(30) NOT NULL,
    tgl_bayar DATE,
    jenis_bayar VARCHAR(30),
    metode_bayar VARCHAR(30),
    jumlah_bayar DECIMAL(12, 2),
    bukti_bayar VARCHAR(150),
    status_pembayaran VARCHAR(40),
    FOREIGN KEY (id_pesanan) REFERENCES Pesanan(id_pesanan) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE Perubahan_pesanan (
    id_perubahan VARCHAR(20) PRIMARY KEY,
    id_pesanan VARCHAR(30),
    id_admin VARCHAR(20),
    tgl_permintaan DATE,
    deskripsi_perubahan TEXT,
    status_perubahan VARCHAR(30),
    FOREIGN KEY (id_pesanan) REFERENCES Pesanan(id_pesanan) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (id_admin) REFERENCES Akun(id_akun) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE Pengiriman (
    id_pengiriman VARCHAR(20) PRIMARY KEY,
    id_pesanan VARCHAR(30),
    id_kurir VARCHAR(20),
    alamat_tujuan_jalan VARCHAR(255),
    alamat_tujuan_rt VARCHAR(3),
    alamat_tujuan_rw VARCHAR(3),
    kode_pos VARCHAR(10),
    no_antrian INTEGER,
    tgl_kirim DATE,
    estimasi_tiba DATE,
    status_pengiriman VARCHAR(40),
    FOREIGN KEY (id_pesanan) REFERENCES Pesanan(id_pesanan) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (id_kurir) REFERENCES Akun(id_akun) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (kode_pos) REFERENCES Kode_pos(kode_pos) ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE TABLE Produksi (
    id_produksi VARCHAR(20) PRIMARY KEY,
    id_pesanan VARCHAR(30) NOT NULL,
    id_petugas VARCHAR(20) NOT NULL,
    tgl_mulai DATE,
    tgl_estimasi_selesai DATE,
    status_produksi VARCHAR(40),
    FOREIGN KEY (id_pesanan) REFERENCES Pesanan(id_pesanan) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (id_petugas) REFERENCES Akun(id_akun) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE Notifikasi (
    id_notifikasi VARCHAR(20) PRIMARY KEY,
    id_akun VARCHAR(20) NOT NULL,
    id_pesanan VARCHAR(30) NOT NULL,
    pesan TEXT NOT NULL,
    tgl_notifikasi DATE NOT NULL,
    status_baca SMALLINT DEFAULT 0,
    FOREIGN KEY (id_akun) REFERENCES Akun(id_akun) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (id_pesanan) REFERENCES Pesanan(id_pesanan) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE Kritik_saran (
    id_kritik VARCHAR(20) PRIMARY KEY,
    id_pelanggan VARCHAR(20) NOT NULL,
    id_pesanan VARCHAR(30) NOT NULL,
    isi TEXT NOT NULL,
    rating SMALLINT CHECK (rating >= 1 AND rating <= 5),
    tgl_kritik DATE NOT NULL,
    tanggapan_admin TEXT,
    FOREIGN KEY (id_pelanggan) REFERENCES Pelanggan(id_pelanggan) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (id_pesanan) REFERENCES Pesanan(id_pesanan) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE Detail_Pesanan (
    id_detail VARCHAR(20) PRIMARY KEY,
    id_pesanan VARCHAR(30) NOT NULL,
    id_produk VARCHAR(20) NOT NULL,
    ukuran VARCHAR(10) NOT NULL,
    jumlah INTEGER NOT NULL,
    spesifikasi_desain VARCHAR(150),
    file_desain VARCHAR(150),
    warna VARCHAR(20),
    harga_satuan DECIMAL(12, 2) NOT NULL,
    FOREIGN KEY (id_pesanan) REFERENCES Pesanan(id_pesanan) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (id_produk) REFERENCES Produk(id_produk) ON UPDATE CASCADE ON DELETE RESTRICT
);


-- ==========================================
-- BAGIAN 2: PENGISIAN DATA (DML / INSERT)
-- ==========================================

-- Bersihkan data lama agar aman dari duplikat
TRUNCATE TABLE Akun, Kode_pos, Produk, Laporan, Pelanggan, Alamat, Pesanan, Detail_Pesanan, Pembayaran, Perubahan_pesanan, Pengiriman, Produksi, Notifikasi, Kritik_saran, Aktivitas_owner CASCADE;

-- 1. AKUN
INSERT INTO Akun (id_akun, username, password, nama_lengkap, role) VALUES
('AKN-001', 'nadine', 'nadine42da7', 'Nadine Fhaiqa Maharani', 'admin'),
('AKN-002', 'sonia', 'sonia56ada', 'Sonia Permata Noval', 'produksi'),
('AKN-003', 'zaki', 'zaki4ba4a', 'Muhammad Zaki Faturrahim', 'kurir'),
('AKN-004', 'nabila', 'nabila6d906', 'Nabila', 'owner'),
('AKN-005', 'tiva', 'tivad470ff', 'Tiva Restihan', 'pelanggan'),
('AKN-006', 'welya', 'welyae061b', 'Welya Putri Valensya', 'pelanggan'),
('AKN-007', 'rhadya', 'rhadya3fe95', 'Rhadya', 'pelanggan'),
('AKN-008', 'divya', 'divya41bd3', 'Divya', 'pelanggan'),
('AKN-009', 'lovanda', 'lovanda477c0', 'Lovanda', 'pelanggan');

-- 2. KODE POS
INSERT INTO Kode_pos (kode_pos, kelurahan, kecamatan, kota, provinsi) VALUES
('25115', 'Purus', 'Padang Barat', 'Kota Padang', 'Sumatera Barat'),
('26181', 'Belakang Balok', 'Birugo Tigo Bale', 'Kota Bukittinggi', 'Sumatera Barat'),
('27118', 'Balai-Balai', 'Padang Panjang Bara', 'Kota Padang Panjang', 'Sumatera Barat'),
('26211', 'Koto Nan Ampe', 'Payakumbuh Barat', 'Kota Payakumbuh', 'Sumatera Barat'),
('27316', 'Laing', 'Tanjung Harapan', 'Kota Solok', 'Sumatera Barat');

-- 3. PRODUK
INSERT INTO Produk (id_produk, nama_produk, jenis, harga_dasar, deskripsi, bahan, status_tersedia) VALUES
('PRD-001', 'Polo T-Shirt', 'Polo T-Shirt', 70000.00, 'Produk kategori Polo T-Shirt di katalog', 'Lacoste Pique', 'Tersedia'),
('PRD-002', 'Jacket', 'Jacket', 130000.00, 'Produk kategori Jacket di katalog', 'Fleece', 'Tersedia'),
('PRD-003', 'Kaos', 'Kaos', 50000.00, 'Produk kategori Kaos di katalog', 'Cotton Combed 30s', 'Tersedia'),
('PRD-004', 'Kemeja', 'Kemeja', 110000.00, 'Produk kategori Kemeja di katalog', 'Katun Oxford', 'Tersedia');

-- 4. LAPORAN
INSERT INTO Laporan (id_laporan, periode_bulan, periode_tahun, tgl_laporan, total_pendapatan) VALUES
('LAP-001', 10, 2026, '2026-10-20', 4890000.00);

-- 5. PELANGGAN
INSERT INTO Pelanggan (id_pelanggan, id_akun, jenis_kelamin, no_hp) VALUES
('PLG-001', 'AKN-005', 'Perempuan', '081329874512'),
('PLG-002', 'AKN-006', 'Perempuan', '085742106683'),
('PLG-003', 'AKN-007', 'Perempuan', '081267340918'),
('PLG-004', 'AKN-008', 'Perempuan', '082171925564'),
('PLG-005', 'AKN-009', 'Perempuan', '085376208471');

-- 6. ALAMAT
INSERT INTO Alamat (id_alamat, id_pelanggan, alamat_jalan, alamat_rt, alamat_rw, kode_pos) VALUES
('ALM-001', 'PLG-001', 'Jl. Kenanga No 12', '03', '05', '25115'),
('ALM-002', 'PLG-002', 'Jl. Pahlawan No 27', '02', '07', '26181'),
('ALM-003', 'PLG-003', 'Soekarno Hatta No', '01', '03', '27118'),
('ALM-004', 'PLG-004', 'enderal Sudirman No', '04', '02', '26211'),
('ALM-005', 'PLG-005', 'L. Lubuk Sikarah No', '02', '04', '27316');

-- 7. PESANAN
INSERT INTO Pesanan (id_pesanan, id_pelanggan, id_admin, tgl_konfirmasi, total_harga, status_pesanan, tgl_pesan, tgl_butuh, metode_pengambilan, catatan) VALUES
('SN-20261001-01', 'PLG-001', 'AKN-001', '2026-10-02', 1200000.00, 'Selesai', '2026-10-01', '2026-10-10', 'Ambil', 'Warna hitam'),
('SN-20261003-0', 'PLG-002', 'AKN-001', '2026-10-04', 840000.00, 'Dikirim', '2026-10-03', '2026-10-20', 'Kirim', 'Warna navy'),
('SN-20261008-0', 'PLG-003', 'AKN-001', '2026-10-09', 1300000.00, 'Diproses', '2026-10-08', '2026-10-25', 'Kirim', 'Warna abu misty'),
('SN-20261014-0', 'PLG-004', 'AKN-001', '2026-10-14', 650000.00, 'Menunggu Verifikasi', '2026-10-14', '2026-11-05', 'Ambil', 'Bukti transfer sudah dikirim'),
('SN-20261016-0', 'PLG-005', 'AKN-001', '2026-10-16', 1800000.00, 'Menunggu Pembayaran', '2026-10-16', '2026-11-10', 'Ambil', 'Warna putih');

-- 8. DETAIL PESANAN
INSERT INTO Detail_Pesanan (id_detail, id_pesanan, id_produk, ukuran, jumlah, spesifikasi_desain, file_desain, warna, harga_satuan) VALUES
('DTL-001', 'SN-20261001-01', 'PRD-003', 'L', 12, 'Sesuai katalog', 'katalog_kaos.png', 'Hitam', 50000.00),
('DTL-002', 'SN-20261001-01', 'PRD-003', 'M', 12, 'Sesuai katalog', 'katalog_kaos.png', 'Hitam', 50000.00),
('DTL-003', 'SN-20261003-0', 'PRD-001', 'M', 6, 'Bordir logo kantor dada kiri', 'logo_kantor.png', 'Navy', 70000.00),
('DTL-004', 'SN-20261003-0', 'PRD-001', 'L', 6, 'Bordir logo kantor dada kiri', 'logo_kantor.png', 'Navy', 70000.00),
('DTL-005', 'SN-20261008-0', 'PRD-002', 'L', 10, 'Sesuai katalog', 'katalog_jacket.png', 'Navy', 130000.00),
('DTL-006', 'SN-20261014-0', 'PRD-004', 'L', 10, 'Bordir nama dan logo toko dada kiri', 'seragam_toko.png', 'Putih', 110000.00),
('DTL-007', 'SN-20261014-0', 'PRD-004', 'M', 10, 'Bordir nama dan logo toko dada kiri', 'seragam_toko.png', 'Putih', 110000.00),
('DTL-008', 'SN-20261016-0', 'PRD-003', 'M', 36, 'Sesuai katalog', 'katalog_kaos.png', 'Putih', 50000.00);

-- 9. PERUBAHAN PESANAN
INSERT INTO Perubahan_pesanan (id_perubahan, id_pesanan, id_admin, tgl_permintaan, deskripsi_perubahan, status_perubahan) VALUES
('PRB-001', 'SN-20261001-01', 'AKN-001', '2026-10-04', 'Ganti metode serah dari Ambil menjadi Kirim', 'Disetujui'),
('PRB-002', 'SN-20261003-0', 'AKN-001', '2026-10-11', 'Ganti warna jaket dari abu misty ke navy', 'Disetujui'),
('PRB-003', 'SN-20261008-0', 'AKN-001', '2026-10-16', 'Tambah jumlah ukuran L dari 10 menjadi 14 pcs', 'Menunggu');

-- 10. NOTIFIKASI
INSERT INTO Notifikasi (id_notifikasi, id_akun, id_pesanan, pesan, tgl_notifikasi, status_baca) VALUES
('NTF-001', 'AKN-005', 'SN-20261001-01', 'Pesanan Anda sudah selesai', '2026-10-10', 1),
('NTF-002', 'AKN-006', 'SN-20261003-0', 'Pesanan sedang dalam proses', '2026-10-15', 0),
('NTF-003', 'AKN-007', 'SN-20261008-0', 'Bukti transfer terverifikasi, pesanan diproses', '2026-10-09', 1),
('NTF-004', 'AKN-008', 'SN-20261014-0', 'Bukti transfer diterima, pesanan dibuat', '2026-10-15', 0),
('NTF-005', 'AKN-009', 'SN-20261016-0', 'Pesanan baru dibuat. Transfer Rp 1.800.000', '2026-10-16', 0);

-- 11. PEMBAYARAN
INSERT INTO Pembayaran (id_pembayaran, id_pesanan, tgl_bayar, jenis_bayar, metode_bayar, jumlah_bayar, bukti_bayar, status_pembayaran) VALUES
('BYR-001', 'SN-20261001-01', '2026-10-02', 'Lunas', 'Transfer', 1200000.00, 'bukti_tf_01.jpg', 'Terverifikasi'),
('BYR-002', 'SN-20261003-0', '2026-10-04', 'Lunas', 'Transfer', 840000.00, 'bukti_tf_02.jpg', 'Terverifikasi'),
('BYR-003', 'SN-20261008-0', '2026-10-09', 'DP', 'Transfer', 650000.00, 'bukti_tf_03.jpg', 'Terverifikasi'),
('BYR-004', 'SN-20261014-0', '2026-10-15', 'Lunas', 'Transfer', 2200000.00, 'bukti_tf_04.jpg', 'Menunggu Verifikasi'),
('BYR-005', 'SN-20261016-0', '2026-10-17', 'Lunas', 'Transfer', 1800000.00, 'bukti_tf_05.jpg', 'Terverifikasi');

-- 12. KRITIK SARAN
INSERT INTO Kritik_saran (id_kritik, id_pelanggan, id_pesanan, isi, rating, tgl_kritik, tanggapan_admin) VALUES
('KRK-001', 'PLG-001', 'SN-20261001-01', 'Pesanan sesuai dan proses cepat', 5, '2026-10-12', 'Terima kasih, kami tunggu pesanan selanjutnya');

-- 13. PRODUKSI
INSERT INTO Produksi (id_produksi, id_pesanan, id_petugas, tgl_mulai, tgl_estimasi_selesai, status_produksi) VALUES
('PRD-001', 'SN-20261001-01', 'AKN-002', '2026-10-03', '2026-10-09', 'Selesai'),
('PRD-002', 'SN-20261003-0', 'AKN-002', '2026-10-05', '2026-10-11', 'Selesai'),
('PRD-003', 'SN-20261008-0', 'AKN-002', '2026-10-10', '2026-10-19', 'Jahit'),
('PRD-004', 'SN-20261014-0', 'AKN-002', '2026-10-20', '2026-10-30', 'Antri'),
('PRD-005', 'SN-20261016-0', 'AKN-002', '2026-10-21', '2026-10-31', 'Antri');

-- 14. PENGIRIMAN
INSERT INTO Pengiriman (id_pengiriman, id_pesanan, id_kurir, alamat_tujuan_jalan, alamat_tujuan_rt, alamat_tujuan_rw, kode_pos, no_antrian, tgl_kirim, estimasi_tiba, status_pengiriman) VALUES
('KRM-001', 'SN-20261001-01', NULL, 'Diambil di toko', NULL, NULL, NULL, 1, '2026-10-10', '2026-10-10', 'Diambil'),
('KRM-002', 'SN-20261003-0', 'AKN-003', 'Jl. Pahlawan No 27', 'RT 02', 'RW 07', '26181', 1, '2026-10-15', '2026-10-19', 'Dalam Perjalanan'),
('KRM-003', 'SN-20261008-0', 'AKN-003', 'Soekarno Hatta No', 'RT 01', 'RW 03', '27118', 1, '2026-10-21', '2026-10-24', 'Belum Dikirim'),
('KRM-004', 'SN-20261014-0', NULL, 'Diambil di toko', NULL, NULL, NULL, 2, '2026-10-31', '2026-10-31', 'Belum Siap'),
('KRM-005', 'SN-20261016-0', NULL, 'Diambil di toko', NULL, NULL, NULL, 3, '2026-11-02', '2026-11-02', 'Belum Siap');

-- 15. AKTIVITAS OWNER
INSERT INTO Aktivitas_owner (id_akun, id_laporan) VALUES
('AKN-004', 'LAP-001');