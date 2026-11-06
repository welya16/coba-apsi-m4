"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";

type Role = "Pelanggan" | "Admin" | "Owner" | "Produksi" | "Pengiriman";
type Screen = "welcome" | "login" | "register" | "app";
type Dialog = "product" | "customer" | "order" | null;

type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  material: string;
  status: string;
};

type Customer = {
  id: string;
  name: string;
  username: string;
  phone: string;
  postalCode: string;
};

type Order = {
  id: string;
  customer: string;
  product: string;
  total: number;
  status: string;
  payment: string;
  date: string;
};

const roles: Role[] = ["Pelanggan", "Admin", "Owner", "Produksi", "Pengiriman"];

const navigation: Record<Role, string[]> = {
  Pelanggan: [
    "Dashboard",
    "Katalog Produk",
    "Buat Pesanan",
    "Pembayaran",
    "Perubahan Pesanan",
    "Kritik & Saran",
    "Notifikasi",
    "Riwayat Pesanan",
  ],
  Admin: [
    "Dashboard",
    "Kelola Pelanggan",
    "Kelola Produk",
    "Konfirmasi Pesanan",
    "Verifikasi Pembayaran",
    "Kritik & Saran",
    "Notifikasi",
  ],
  Owner: [
    "Dashboard Owner",
    "Rekap Pesanan",
    "Laporan Penjualan",
    "Laporan Pembayaran",
    "Aktivitas Owner",
  ],
  Produksi: ["Dashboard Produksi", "Antrean Produksi", "Update Status", "Notifikasi"],
  Pengiriman: [
    "Dashboard",
    "Siap Dikirim",
    "Daftar Pengiriman",
    "Update Status",
    "Notifikasi",
    "Riwayat Pengiriman",
  ],
};

const initialProducts: Product[] = [
  { id: "PRD-001", name: "Polo T-Shirt", category: "Polo T-Shirt", price: 70000, material: "Lacoste Pique", status: "Tersedia" },
  { id: "PRD-002", name: "Jacket", category: "Jacket", price: 130000, material: "Fleece", status: "Tersedia" },
  { id: "PRD-003", name: "Kaos", category: "Kaos", price: 50000, material: "Cotton Combed 30s", status: "Tersedia" },
  { id: "PRD-004", name: "Kemeja", category: "Kemeja", price: 110000, material: "Katun Oxford", status: "Tersedia" },
];

const initialCustomers: Customer[] = [
  { id: "PLG-001", name: "Tiva Restihan", username: "tiva", phone: "081329874512", postalCode: "25115" },
  { id: "PLG-002", name: "Welya Putri Valensya", username: "welya", phone: "085742106683", postalCode: "26181" },
  { id: "PLG-003", name: "Rhadya", username: "rhadya", phone: "081267340918", postalCode: "27118" },
  { id: "PLG-004", name: "Divya", username: "divya", phone: "082171925564", postalCode: "26211" },
  { id: "PLG-005", name: "Lovanda", username: "lovanda", phone: "085376208471", postalCode: "27316" },
];

const initialOrders: Order[] = [
  { id: "PSN-20261001-01", customer: "Tiva Restihan", product: "Kaos", total: 1200000, status: "Selesai", payment: "Terverifikasi", date: "1 Okt 2026" },
  { id: "PSN-20261003-02", customer: "Welya Putri Valensya", product: "Polo T-Shirt", total: 840000, status: "Dikirim", payment: "Terverifikasi", date: "3 Okt 2026" },
  { id: "PSN-20261008-03", customer: "Rhadya", product: "Jacket", total: 1300000, status: "Diproses", payment: "Terverifikasi", date: "8 Okt 2026" },
  { id: "PSN-20261014-04", customer: "Divya", product: "Kemeja", total: 2200000, status: "Menunggu verifikasi", payment: "Menunggu verifikasi", date: "14 Okt 2026" },
  { id: "PSN-20261016-05", customer: "Lovanda", product: "Kaos", total: 1800000, status: "Menunggu pembayaran", payment: "Menunggu pembayaran", date: "16 Okt 2026" },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);

function DatabaseIcon() {
  return (
    <span className="database-icon" aria-hidden="true">
      <span />
      <span />
    </span>
  );
}

function Welcome({ onChoose }: { onChoose: (role: Role) => void }) {
  return (
    <main className="welcome-screen">
      <header className="welcome-banner">
        <Image
          src="/welcome-header.svg"
          alt=""
          width={1451}
          height={213}
          priority
          className="welcome-banner-image"
        />
        <h1>WELCOME CV JOGJA KONVEKSI</h1>
      </header>
      <section className="welcome-content">
        <h2>Pilih Peran</h2>
        <div className="role-picker">
          <div className="role-row role-row-top">
            {roles.slice(0, 3).map((role) => (
              <RoleTile key={role} role={role} onChoose={onChoose} />
            ))}
          </div>
          <div className="role-row role-row-bottom">
            {roles.slice(3).map((role) => (
              <RoleTile key={role} role={role} onChoose={onChoose} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function RoleTile({
  role,
  onChoose,
}: {
  role: Role;
  onChoose: (role: Role) => void;
}) {
  return (
    <button className="role-tile" onClick={() => onChoose(role)} type="button">
      <Image
        src={role === "Owner" ? "/role-circle-owner.svg" : "/role-circle.svg"}
        alt=""
        width={311}
        height={268}
        className="role-tile-shape"
      />
      <span className="role-tile-content">
        <DatabaseIcon />
        <span>{role.toUpperCase()}</span>
      </span>
    </button>
  );
}

function Login({
  role,
  onBack,
  onRegister,
  onPreview,
}: {
  role: Role;
  onBack: () => void;
  onRegister: () => void;
  onPreview: (username: string) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!username.trim() || !password) {
      setError("Username dan kata sandi wajib diisi.");
      return;
    }
    setError("");
    onPreview(username.trim());
  }

  return (
    <main className="auth-screen">
      <div className="auth-photo">
        <Image
          src="/konveksi-store.png"
          alt="Toko dan produk CV Jogja Konveksi"
          fill
          priority
          sizes="(max-width: 760px) 100vw, 42vw"
        />
      </div>
      <section className="auth-panel-wrap">
        <form className="auth-panel" onSubmit={submit}>
          <button type="button" className="auth-back" onClick={onBack} aria-label="Kembali">
            ←
          </button>
          <h1>MASUK</h1>
          <p className="auth-role">Masuk sebagai {role}</p>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" type="submit">
            Masuk
          </button>
          {role === "Pelanggan" && (
            <button className="auth-submit" type="button" onClick={onRegister}>
              Daftar
            </button>
          )}
          <p className="auth-preview-note">
            Preview UI: autentikasi belum terhubung ke layanan backend.
          </p>
        </form>
      </section>
    </main>
  );
}

function Registration({ onBack }: { onBack: () => void }) {
  const [message, setMessage] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const requiredFields = Array.from(event.currentTarget.elements).filter(
      (element): element is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement =>
        (element instanceof HTMLInputElement ||
          element instanceof HTMLSelectElement ||
          element instanceof HTMLTextAreaElement) &&
        element.required,
    );
    if (requiredFields.some((field) => !field.value.trim())) {
      setMessage("Lengkapi semua data yang wajib diisi.");
      return;
    }
    setMessage(
      "Formulir valid. Pendaftaran belum tersimpan karena backend belum tersedia.",
    );
  }

  return (
    <main className="register-screen">
      <div className="register-photo" />
      <form className="register-form" onSubmit={submit}>
        <h1>Daftar</h1>
        <div className="register-columns">
          <section className="register-column">
            <RegistrationField label="Nama Lengkap" name="name" />
            <RegistrationField label="Username" name="username" />
            <label className="register-field">
              <span>Jenis Kelamin</span>
              <select name="gender" defaultValue="">
                <option value="" disabled>Pilih jenis kelamin</option>
                <option>Perempuan</option>
                <option>Laki-laki</option>
              </select>
            </label>
            <RegistrationField label="Nomor Telepon" name="phone" type="tel" />
            <RegistrationField label="Email (opsional)" name="email" type="email" required={false} />
            <RegistrationField label="Kata sandi" name="password" type="password" />
          </section>
          <section className="register-column">
            <RegistrationField label="Jalan/nomor" name="street" />
            <RegistrationField label="RT/RW" name="rtrw" />
            <RegistrationField label="Kelurahan" name="village" />
            <RegistrationField label="Kecamatan" name="district" />
            <RegistrationField label="Kota" name="city" />
            <RegistrationField label="Provinsi" name="province" />
          </section>
        </div>
        {message && <p className="register-message" role="status">{message}</p>}
        <button className="register-submit" type="submit">Daftar</button>
      </form>
      <button className="register-signin" onClick={onBack} type="button">
        Sudah punya akun? Masuk
      </button>
    </main>
  );
}

function RegistrationField({
  label,
  name,
  type = "text",
  required = true,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="register-field">
      <span>{label}</span>
      <input name={name} type={type} required={required} />
    </label>
  );
}

function Sidebar({
  role,
  active,
  onNavigate,
  onLogout,
}: {
  role: Role;
  active: string;
  onNavigate: (section: string) => void;
  onLogout: () => void;
}) {
  return (
    <aside className="sidebar">
      <Image
        src="/sidebar.svg"
        alt=""
        width={252}
        height={1024}
        className="sidebar-background"
        priority
      />
      <div className="sidebar-content">
        <div className="sidebar-brand">
          <strong>JK Jogja Konveksi</strong>
          <small>SISTEM INFORMASI PEMESANAN</small>
        </div>
        <div className="sidebar-role">{role}</div>
        <nav className="sidebar-navigation" aria-label="Navigasi utama">
          {navigation[role].map((item) => (
            <button
              type="button"
              key={item}
              className={`sidebar-link${active === item ? " is-active" : ""}`}
              onClick={() => onNavigate(item)}
            >
              {active === item && (
                <Image
                  src="/sidebar-active.svg"
                  alt=""
                  width={176}
                  height={37}
                  className="sidebar-active-background"
                />
              )}
              <span>{item}</span>
            </button>
          ))}
        </nav>
        <button className="logout-button" onClick={onLogout} type="button">
          Keluar Akun
        </button>
      </div>
    </aside>
  );
}

function MetricCard({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <article className="metric-card">
      <h3>{label}</h3>
      <strong>{value}</strong>
      {note && <span>{note}</span>}
      <i aria-hidden="true" />
    </article>
  );
}

function Panel({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Workspace() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [role, setRole] = useState<Role>("Pelanggan");
  const [username, setUsername] = useState("");
  const [section, setSection] = useState("Dashboard");
  const [products, setProducts] = useState(initialProducts);
  const [customers, setCustomers] = useState(initialCustomers);
  const [orders, setOrders] = useState(initialOrders);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [editingId, setEditingId] = useState("");

  const userName = username || (role === "Owner" ? "Nabila" : role === "Pelanggan" ? "Tiva Restihan" : role);
  const filteredProducts = useMemo(
    () => products.filter((item) => `${item.id} ${item.name} ${item.material}`.toLowerCase().includes(search.toLowerCase())),
    [products, search],
  );
  const filteredCustomers = useMemo(
    () => customers.filter((item) => `${item.id} ${item.name} ${item.username}`.toLowerCase().includes(search.toLowerCase())),
    [customers, search],
  );

  function chooseRole(nextRole: Role) {
    setRole(nextRole);
    setSection(navigation[nextRole][0]);
    setScreen("login");
  }

  function openDialog(type: Exclude<Dialog, null>, id = "") {
    setEditingId(id);
    setDialog(type);
  }

  function saveDialog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (dialog === "product") {
      const updated: Product = {
        id: editingId || `PRD-${String(products.length + 1).padStart(3, "0")}`,
        name: String(data.get("name") ?? "").trim(),
        category: String(data.get("category") ?? "").trim(),
        price: Number(data.get("price")),
        material: String(data.get("material") ?? "").trim(),
        status: "Tersedia",
      };
      setProducts((current) =>
        editingId ? current.map((item) => item.id === editingId ? updated : item) : [...current, updated],
      );
      setNotice(editingId ? "Data produk diperbarui pada sesi preview." : "Produk ditambahkan pada sesi preview.");
    } else if (dialog === "customer") {
      const updated: Customer = {
        id: editingId || `PLG-${String(customers.length + 1).padStart(3, "0")}`,
        name: String(data.get("name") ?? "").trim(),
        username: String(data.get("username") ?? "").trim(),
        phone: String(data.get("phone") ?? "").trim(),
        postalCode: String(data.get("postalCode") ?? "").trim(),
      };
      setCustomers((current) =>
        editingId ? current.map((item) => item.id === editingId ? updated : item) : [...current, updated],
      );
      setNotice(editingId ? "Data pelanggan diperbarui pada sesi preview." : "Pelanggan ditambahkan pada sesi preview.");
    } else if (dialog === "order") {
      const selectedProduct = products.find((item) => item.id === String(data.get("product")));
      if (selectedProduct) {
        const order: Order = {
          id: `PSN-202611${String(orders.length + 1).padStart(2, "0")}-0${orders.length + 1}`,
          customer: userName,
          product: selectedProduct.name,
          total: selectedProduct.price * Number(data.get("quantity")),
          status: "Menunggu konfirmasi",
          payment: "Belum dibayar",
          date: "Hari ini",
        };
        setOrders((current) => [order, ...current]);
        setNotice("Pesanan dibuat pada sesi preview dan belum dikirim ke backend.");
      }
    }
    setDialog(null);
    setEditingId("");
  }

  function updateOrder(id: string, field: "status" | "payment", value: string) {
    setOrders((current) =>
      current.map((order) => order.id === id ? { ...order, [field]: value } : order),
    );
    setNotice("Perubahan tersimpan pada sesi preview.");
  }

  function renderAdminDashboard() {
    const waiting = orders.filter((order) => order.status.toLowerCase().includes("menunggu")).length;
    return (
      <>
        <div className="page-heading">
          <div><h1>Dashboard</h1><p>Ringkasan Pesanan</p></div>
        </div>
        <div className="metrics metrics-three">
          <MetricCard label="Pesanan Masuk" value={String(orders.length)} />
          <MetricCard label="Menunggu Verifikasi" value={String(orders.filter((order) => order.status.toLowerCase().includes("menunggu verifikasi")).length)} />
          <MetricCard label="Menunggu Pembayaran" value={String(orders.filter((order) => order.status.toLowerCase().includes("menunggu pembayaran")).length)} />
        </div>
        <Panel title="Pesanan terbaru" action={<button className="button button-primary" onClick={() => setSection("Konfirmasi Pesanan")} type="button">+ Tambah / Filter</button>}>
          <div className="table-scroll">
            <table><thead><tr><th>NAMA / ID</th><th>KETERANGAN / STATUS</th><th>AKSI</th></tr></thead>
              <tbody>{orders.slice(0, 3).map((order) => (
                <tr key={order.id}><td><strong>{order.id}</strong><small>{order.customer} • {order.product} • {formatCurrency(order.total)}</small></td><td>{order.status}</td><td><button className="button button-soft" onClick={() => setSection("Konfirmasi Pesanan")} type="button">Detail</button></td></tr>
              ))}</tbody>
            </table>
          </div>
        </Panel>
        <section className="operational-status"><h2>Status Operasional</h2><p>Produksi: Antrean {waiting} • Jahit 1 • Selesai 2</p><p>Pengiriman: Belum Siap 2 • Belum Dikirim 1 • Dalam Perjalanan 1 • Diambil 1</p><p>Pembayaran: 4 terverifikasi • 1 menunggu verifikasi.</p></section>
      </>
    );
  }

  function renderOwnerDashboard() {
    return (
      <>
        <section className="owner-greeting"><div><h1>Hallo, Owner!</h1><strong>{userName}</strong></div><b>{userName} AKN-004</b></section>
        <div className="metrics metrics-three owner-metrics">
          <MetricCard label="Pesanan" value="0" /><MetricCard label="Produk" value="102" /><MetricCard label="Total Pesanan" value="Rp 7.340.000" />
        </div>
        <Panel title="Laporan" action={<div className="report-actions"><select aria-label="Periode laporan" defaultValue="Oktober 2026"><option>Oktober 2026</option><option>September 2026</option></select><button className="button button-soft" onClick={() => window.print()} type="button">Cetak Laporan</button></div>}>
          <p className="panel-subtitle">LAP-001 | Hanya Baca</p>
          <div className="table-scroll"><table><thead><tr><th>NAMA / ID</th><th>KETERANGAN</th><th>AKSI</th></tr></thead>
            <tbody>
              <tr><td><strong>Laporan penjualan LAP-001</strong><small>10/2026</small></td><td><strong>Rp4.890.000</strong><small>20 Okt 2026</small></td><td><button className="button button-soft" onClick={() => setSection("Laporan Penjualan")} type="button">Lihat</button></td></tr>
              <tr><td><strong>Rekap pemesanan</strong><small>5 pesanan • 102 pcs</small></td><td><strong>Status Pesanan</strong><small>1 Selesai • 1 Dikirim • 1 Diproses • 1 Menunggu Verifikasi</small></td><td><button className="button button-soft" onClick={() => setSection("Rekap Pesanan")} type="button">Lihat</button></td></tr>
              <tr><td><strong>Laporan pembayaran</strong><small>5 transaksi</small></td><td><strong>5 Pembayaran • Rp6.690.000</strong><small>4 Terverifikasi • 1 menunggu Rp2.200.000</small></td><td><button className="button button-soft" onClick={() => setSection("Laporan Pembayaran")} type="button">Lihat</button></td></tr>
            </tbody></table></div>
        </Panel>
      </>
    );
  }

  function renderCustomerDashboard() {
    return (
      <>
        <div className="page-heading"><div><h1>Dashboard Pelanggan</h1><p>{userName}</p></div><span className="user-id">Akun: {userName} PLG-001</span></div>
        <div className="customer-info-grid">
          <Panel title="Informasi Akun">
            <div className="info-list"><p><b>Nama Lengkap</b><span>{userName}</span></p><p><b>Username</b><span>{username || "tiva"}</span></p><p><b>Jenis Kelamin</b><span>Perempuan</span></p><p><b>Nomor Telepon</b><span>081329874512</span></p><p><b>ID pelanggan</b><span>PLG-001</span></p><p><b>ID akun</b><span>AKN-005</span></p></div>
          </Panel>
          <Panel title="Alamat Pelanggan">
            <div className="info-list"><p><b>Jalan/nomor</b><span>Jl. Kenanga No.12</span></p><p><b>RT/RW</b><span>03/05</span></p><p><b>Kelurahan</b><span>Purus</span></p><p><b>Kecamatan</b><span>Padang Barat</span></p><p><b>Kota</b><span>Kota Padang</span></p><p><b>Provinsi</b><span>Sumatera Barat</span></p></div>
          </Panel>
        </div>
        <Panel title="Pesanan pelanggan" action={<button className="button button-primary" onClick={() => setSection("Katalog Produk")} type="button">Buat Pesanan</button>}>
          <OrdersTable orders={orders.slice(0, 3)} onAction={(order) => setNotice(`Detail ${order.id} dibuka pada sesi preview.`)} />
        </Panel>
        <Panel title="Riwayat pesanan"><p className="history-note">1 Okt 2026 • Pesanan Kaos Hitam • 24 pcs</p><p className="history-note">2 Okt 2026 • Transfer lunas • Terverifikasi</p><p className="history-note">10 Okt 2026 • Pesanan diambil di toko</p></Panel>
      </>
    );
  }

  function renderDeliveryDashboard() {
    const deliveryStatuses = [
      { label: "Belum siap", count: "2" },
      { label: "Belum dikirim", count: "1" },
      { label: "Siap dikirim", count: "0" },
      { label: "Dalam perjalanan", count: "1" },
      { label: "Diambil", count: "1" },
      { label: "Diterima", count: "0" },
    ];
    return (
      <>
        <div className="page-heading"><div><h1>Dashboard</h1></div><span className="user-id">Pengiriman</span></div>
        <div className="metrics metrics-six">
          {deliveryStatuses.map((status) => <MetricCard key={status.label} label={status.label} value={status.count} />)}
        </div>
        <Panel title="Pengiriman terbaru" action={<button className="button button-primary" onClick={() => setSection("Daftar Pengiriman")} type="button">Filter</button>}>
          <div className="table-scroll"><table><thead><tr><th>ID / NAMA</th><th>STATUS DAN METODE</th><th>ESTIMASI</th><th>AKSI</th></tr></thead>
            <tbody>{orders.map((order, index) => <tr key={order.id}><td><strong>KRM-00{index + 1}-{order.id}</strong><small>{order.customer} • {order.product} • 24 pcs</small></td><td>{index === 0 ? "DIAMBIL · Ambil di toko" : order.status}</td><td>{order.date}</td><td><button className="text-button" onClick={() => updateOrder(order.id, "status", "Dalam perjalanan")} type="button">{index === 0 ? "Detail" : "Update"}</button></td></tr>)}</tbody>
          </table></div>
        </Panel>
      </>
    );
  }

  function renderProductionDashboard() {
    return (
      <>
        <div className="page-heading"><div><h1>Dashboard Produksi</h1><p>Ringkasan proses pesanan</p></div></div>
        <div className="metrics metrics-three"><MetricCard label="Antrean" value="2" /><MetricCard label="Sedang Dikerjakan" value="1" /><MetricCard label="Selesai" value="2" /></div>
        <Panel title="Antrean produksi" action={<button className="button button-primary" onClick={() => setSection("Antrean Produksi")} type="button">Lihat antrean</button>}>
          <OrdersTable orders={orders.filter((order) => order.status !== "Selesai").slice(0, 4)} onAction={(order) => updateOrder(order.id, "status", "Diproses")} />
        </Panel>
      </>
    );
  }

  function renderProducts() {
    return (
      <>
        <div className="page-heading"><div><h1>Kelola Produk</h1><p>CV Jogja Konveksi / {role}</p></div><button className="button button-primary" onClick={() => openDialog("product")} type="button">+ Tambah Produk</button></div>
        <div className="metrics metrics-three compact-metrics"><MetricCard label="Produk" value={String(products.length).padStart(2, "0")} /><MetricCard label="Pelanggan" value={String(customers.length).padStart(2, "0")} /><MetricCard label="Pesanan" value={String(orders.length).padStart(2, "0")} /></div>
        <Panel title="Data produk" action={<SearchBox value={search} onChange={setSearch} />}>
          <div className="table-scroll"><table><thead><tr><th>NAMA / ID</th><th>KETERANGAN / STATUS</th><th>STATUS</th><th>AKSI</th></tr></thead>
            <tbody>{filteredProducts.map((item) => <tr key={item.id}><td><strong>{item.id} • {item.name}</strong></td><td>{formatCurrency(item.price)} • {item.material}</td><td><span className="status-pill">{item.status}</span></td><td><div className="table-actions"><button className="button button-soft" onClick={() => openDialog("product", item.id)} type="button">Edit</button><button className="button button-soft" onClick={() => { setProducts((current) => current.filter((product) => product.id !== item.id)); setNotice("Produk dihapus dari sesi preview."); }} type="button">Hapus</button></div></td></tr>)}</tbody>
          </table></div>
        </Panel>
      </>
    );
  }

  function renderCustomers() {
    return (
      <>
        <div className="page-heading"><div><h1>Kelola Pelanggan</h1><p>CV Jogja Konveksi / Admin</p></div><button className="button button-primary" onClick={() => openDialog("customer")} type="button">+ Tambah Pelanggan</button></div>
        <Panel title="Data pelanggan" action={<SearchBox value={search} onChange={setSearch} />}>
          <div className="table-scroll"><table><thead><tr><th>ID</th><th>NAMA</th><th>USERNAME</th><th>NO.HP</th><th>KODE POS</th><th>AKSI</th></tr></thead>
            <tbody>{filteredCustomers.map((item) => <tr key={item.id}><td><strong>{item.id}</strong></td><td>{item.name}</td><td>{item.username}</td><td>{item.phone}</td><td>{item.postalCode}</td><td><div className="table-actions"><button className="button button-soft" onClick={() => openDialog("customer", item.id)} type="button">Edit</button><button className="button button-soft" onClick={() => { setCustomers((current) => current.filter((customer) => customer.id !== item.id)); setNotice("Pelanggan dihapus dari sesi preview."); }} type="button">Hapus</button></div></td></tr>)}</tbody>
          </table></div>
        </Panel>
      </>
    );
  }

  function renderOrders(title: string, actionLabel: string) {
    return (
      <>
        <div className="page-heading"><div><h1>{title}</h1><p>CV Jogja Konveksi / {role}</p></div><SearchBox value={search} onChange={setSearch} /></div>
        <Panel title={title}>
          <div className="table-scroll"><table><thead><tr><th>ID PESANAN</th><th>PELANGGAN / PRODUK</th><th>TOTAL</th><th>STATUS</th><th>AKSI</th></tr></thead>
            <tbody>{orders.filter((order) => `${order.id} ${order.customer} ${order.product}`.toLowerCase().includes(search.toLowerCase())).map((order) => <tr key={order.id}><td><strong>{order.id}</strong><small>{order.date}</small></td><td>{order.customer}<small>{order.product}</small></td><td>{formatCurrency(order.total)}</td><td><span className="status-pill">{order.status}</span></td><td><button className="button button-soft" onClick={() => updateOrder(order.id, "status", actionLabel)} type="button">{actionLabel}</button></td></tr>)}</tbody>
          </table></div>
        </Panel>
      </>
    );
  }

  function renderSection() {
    if (role === "Admin") {
      if (section === "Dashboard") return renderAdminDashboard();
      if (section === "Kelola Produk") return renderProducts();
      if (section === "Kelola Pelanggan") return renderCustomers();
      if (section === "Konfirmasi Pesanan") return renderOrders(section, "Dikonfirmasi");
      if (section === "Verifikasi Pembayaran") return renderOrders(section, "Verifikasi");
      if (section === "Kritik & Saran") return <FeedbackPage role={role} />;
      return <NotificationPage role={role} />;
    }
    if (role === "Owner") {
      if (section === "Dashboard Owner") return renderOwnerDashboard();
      return <ReportPage section={section} onOpen={(message) => setNotice(message)} />;
    }
    if (role === "Pelanggan") {
      if (section === "Dashboard") return renderCustomerDashboard();
      if (section === "Katalog Produk") return <CatalogPage products={products} onOrder={() => openDialog("order")} />;
      if (section === "Buat Pesanan") return <CreateOrderPage products={products} onCreate={() => openDialog("order")} />;
      if (section === "Pembayaran") return <PaymentPage orders={orders} onPay={(id) => updateOrder(id, "payment", "Menunggu verifikasi")} />;
      if (section === "Perubahan Pesanan") return <ChangeRequestPage />;
      if (section === "Kritik & Saran") return <FeedbackPage role={role} />;
      if (section === "Notifikasi") return <NotificationPage role={role} />;
      return renderOrders("Riwayat Pesanan", "Detail");
    }
    if (role === "Produksi") {
      if (section === "Dashboard Produksi") return renderProductionDashboard();
      if (section === "Notifikasi") return <NotificationPage role={role} />;
      return renderOrders(section, "Selesai");
    }
    if (section === "Dashboard") return renderDeliveryDashboard();
    if (section === "Notifikasi") return <NotificationPage role={role} />;
    if (section === "Riwayat Pengiriman") return renderOrders(section, "Detail");
    return renderOrders(section, "Update");
  }

  if (screen === "welcome") {
    return <Welcome onChoose={chooseRole} />;
  }
  if (screen === "login") {
    return (
      <Login
        role={role}
        onBack={() => setScreen("welcome")}
        onRegister={() => setScreen("register")}
        onPreview={(value) => {
          setUsername(value);
          setSection(navigation[role][0]);
          setNotice("Mode preview aktif. Perubahan data hanya tersimpan di browser dan tidak dikirim ke backend.");
          setScreen("app");
        }}
      />
    );
  }
  if (screen === "register") {
    return <Registration onBack={() => setScreen("login")} />;
  }

  return (
    <div className={`app-shell role-${role.toLowerCase()}`}>
      <Sidebar role={role} active={section} onNavigate={(next) => { setSection(next); setSearch(""); }} onLogout={() => { setScreen("welcome"); setNotice(""); }} />
      <main className="workspace-main">
        {role === "Owner" && section === "Dashboard Owner" ? null : null}
        <div className="workspace-toolbar">
          <span>CV Jogja Konveksi <b>/</b> {role}</span>
          {role === "Owner" && <button className="button button-soft" onClick={() => setScreen("welcome")} type="button">Ganti Peran</button>}
        </div>
        {notice && <div className="notice" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Tutup notifikasi">×</button></div>}
        {renderSection()}
      </main>
      {dialog && (
        <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null); }}>
          <form className="dialog" onSubmit={saveDialog}>
            <button className="dialog-close" type="button" onClick={() => setDialog(null)} aria-label="Tutup">×</button>
            <h2>{dialog === "product" ? editingId ? "Edit Produk" : "Tambah Produk" : dialog === "customer" ? editingId ? "Edit Pelanggan" : "Tambah Pelanggan" : "Buat Pesanan"}</h2>
            {dialog === "product" && <ProductDialog products={products} editingId={editingId} />}
            {dialog === "customer" && <CustomerDialog customers={customers} editingId={editingId} />}
            {dialog === "order" && <OrderDialog products={products} />}
            <div className="dialog-actions"><button className="button button-muted" type="button" onClick={() => setDialog(null)}>Batal</button><button className="button button-primary" type="submit">{dialog === "order" ? "Konfirmasi Pesanan" : "Simpan"}</button></div>
          </form>
        </div>
      )}
    </div>
  );
}

function SearchBox({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <input className="search-box" type="search" placeholder="Cari..." aria-label="Cari" value={value} onChange={(event) => onChange(event.target.value)} />;
}

function OrdersTable({ orders, onAction }: { orders: Order[]; onAction: (order: Order) => void }) {
  return (
    <div className="table-scroll"><table><thead><tr><th>PESANAN</th><th>PRODUK / JUMLAH</th><th>TOTAL</th><th>STATUS</th><th>AKSI</th></tr></thead>
      <tbody>{orders.map((order) => <tr key={order.id}><td><strong>{order.id}</strong><small>{order.customer} • {order.date}</small></td><td>{order.product}<small>24 pcs</small></td><td>{formatCurrency(order.total)}</td><td><span className="status-pill">{order.status}</span></td><td><button className="text-button" type="button" onClick={() => onAction(order)}>Rincian</button></td></tr>)}</tbody>
    </table></div>
  );
}

function CatalogPage({ products, onOrder }: { products: Product[]; onOrder: () => void }) {
  return (
    <>
      <div className="page-heading"><div><h1>Katalog Produk</h1><p>Produk CV Jogja Konveksi</p></div><span className="user-id">Pelanggan</span></div>
      <div className="metrics metrics-three compact-metrics"><MetricCard label="Nomor Produk" value={String(products.length).padStart(2, "0")} /><MetricCard label="Kategori Produk" value="Konveksi" /><MetricCard label="Metode Pesanan" value="Online" /></div>
      <section className="product-grid">{products.map((product) => <article className="catalog-card" key={product.id}><div className="product-placeholder" aria-hidden="true"><span>{product.name.slice(0, 1)}</span></div><h2>{product.name}</h2><p>{product.category} • {product.material}</p><strong>{formatCurrency(product.price)}</strong><button className="button button-soft" onClick={onOrder} type="button">Pilih produk</button></article>)}</section>
    </>
  );
}

function CreateOrderPage({ products, onCreate }: { products: Product[]; onCreate: () => void }) {
  return (
    <>
      <div className="page-heading"><div><h1>Buat Pesanan</h1><p>Detail pesanan produk baru</p></div></div>
      <Panel title="Detail pesanan produk baru" action={<button className="button button-primary" onClick={onCreate} type="button">Konfirmasi Pesanan</button>}>
        <div className="order-builder"><div className="order-fields"><label>Produk<select defaultValue=""><option value="" disabled>Pilih produk</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} — {formatCurrency(product.price)}</option>)}</select></label><label>Spesifikasi/Desain custom<textarea rows={3} placeholder="Tuliskan detail desain atau ukuran logo" /></label><label>Ukuran<select defaultValue="L"><option>S</option><option>M</option><option>L</option><option>XL</option><option>Custom</option></select></label><label>Jumlah<input type="number" defaultValue={24} min={1} /></label><label>Metode Penerimaan<select defaultValue="Ambil Sendiri"><option>Ambil Sendiri</option><option>Antar Alamat</option></select></label></div><div className="order-summary"><h3>Ringkasan pesanan</h3><p>4 produk tersedia</p><p>Harga menyesuaikan produk dan jumlah yang dipilih.</p><button className="button button-primary" onClick={onCreate} type="button">Konfirmasi Pesanan</button></div></div>
      </Panel>
    </>
  );
}

function PaymentPage({ orders, onPay }: { orders: Order[]; onPay: (id: string) => void }) {
  const [files, setFiles] = useState<Record<string, string>>({});
  return (
    <>
      <div className="page-heading"><div><h1>Pembayaran</h1><p>Riwayat dan status pembayaran</p></div></div>
      <Panel title="Daftar pembayaran">
        <p className="panel-subtitle">Pilih file bukti transfer. File hanya tersedia selama sesi preview dan belum dikirim ke backend.</p>
        <div className="table-scroll"><table><thead><tr><th>ID PESANAN</th><th>TOTAL</th><th>STATUS PEMBAYARAN</th><th>BUKTI / AKSI</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><strong>{order.id}</strong></td><td>{formatCurrency(order.total)}</td><td><span className="status-pill">{order.payment}</span></td><td><div className="payment-upload"><label className="file-picker">Pilih bukti<input type="file" accept="image/*,.pdf" onChange={(event) => setFiles((current) => ({ ...current, [order.id]: event.target.files?.[0]?.name ?? "" }))} /></label>{files[order.id] && <small>{files[order.id]}</small>}<button className="button button-soft" disabled={!files[order.id]} onClick={() => onPay(order.id)} type="button">Kirim bukti</button></div></td></tr>)}</tbody></table></div>
      </Panel>
    </>
  );
}

function ChangeRequestPage() {
  const [sent, setSent] = useState(false);
  return (
    <>
      <div className="page-heading"><div><h1>Perubahan Pesanan</h1><p>Ajukan perubahan untuk pesanan aktif</p></div></div>
      <Panel title="Ajukan perubahan">
        {sent ? <p className="success-message">Permintaan perubahan telah dicatat dalam sesi preview.</p> : <form className="simple-form" onSubmit={(event) => { event.preventDefault(); setSent(true); }}><label>ID pesanan<select><option>PSN-20261001-01</option><option>PSN-20261003-02</option></select></label><label>Deskripsi perubahan<textarea required rows={4} placeholder="Jelaskan perubahan yang diperlukan" /></label><button className="button button-primary" type="submit">Kirim Permintaan</button></form>}
      </Panel>
    </>
  );
}

function FeedbackPage({ role }: { role: Role }) {
  const [sent, setSent] = useState(false);
  const [replySaved, setReplySaved] = useState(false);
  if (role === "Admin") {
    return (
      <>
        <div className="page-heading"><div><h1>Kelola Kritik & Saran</h1><p>Masukan pelanggan</p></div></div>
        <div className="metrics metrics-three compact-metrics"><MetricCard label="Masukan Masuk" value="1" /><MetricCard label="Perlu Tanggapan" value="0" /><MetricCard label="Rating Produk" value="5 / 5" /></div>
        <Panel title="Masukan pelanggan"><div className="feedback-item"><strong>Tiva Restihan · PLG-001 · KRK-001</strong><span>Rating 5/5 • Pesanan sesuai dan proses pemesanannya mudah.</span></div></Panel>
        <Panel title="Tanggapan admin">
          {replySaved ? <p className="success-message">Tanggapan disimpan pada sesi preview.</p> : <form className="simple-form" onSubmit={(event) => { event.preventDefault(); setReplySaved(true); }}><label>Tanggapan<textarea rows={3} defaultValue="Terima kasih, kami tunggu pesanan berikutnya." required /></label><button className="button button-primary" type="submit">Simpan tanggapan</button></form>}
        </Panel>
      </>
    );
  }
  return (
    <>
      <div className="page-heading"><div><h1>Kritik & Saran</h1><p>Masukan pelanggan</p></div></div>
      <Panel title="Kirim kritik & saran">{sent ? <p className="success-message">Masukan dicatat pada sesi preview.</p> : <form className="simple-form" onSubmit={(event) => { event.preventDefault(); setSent(true); }}><label>Pesanan<select><option>PSN-20261001-01</option></select></label><label>Rating<select><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select></label><label>Masukan<textarea required rows={3} /></label><button className="button button-primary" type="submit">Kirim Masukan</button></form>}</Panel>
    </>
  );
}

function NotificationPage({ role }: { role: Role }) {
  const [read, setRead] = useState(false);
  return (
    <>
      <div className="page-heading"><div><h1>Notifikasi {role}</h1><p>Informasi terbaru terkait pesanan</p></div></div>
      <div className="metrics metrics-three compact-metrics"><MetricCard label="Notifikasi" value={read ? "0" : "1"} /><MetricCard label="Belum dibaca" value={read ? "0" : "1"} /><MetricCard label="Akun" value={role} /></div>
      <Panel title="Perlu ditinjau"><div className="notification-row"><div><strong>BYR-004 · Divya · PSN-20261014-04</strong><p>Transfer lunas Rp2.200.000 · Menunggu verifikasi bukti pembayaran.</p></div><button className="button button-soft" type="button" onClick={() => setRead(true)}>{read ? "Dibaca" : "Tandai dibaca"}</button></div></Panel>
    </>
  );
}

function ReportPage({ section, onOpen }: { section: string; onOpen: (message: string) => void }) {
  return (
    <>
      <div className="page-heading"><div><h1>{section}</h1><p>CV Jogja Konveksi / Owner</p></div><button className="button button-soft" onClick={() => window.print()} type="button">Cetak Laporan</button></div>
      <Panel title={section}><p className="panel-subtitle">LAP-001 | Hanya Baca</p><div className="table-scroll"><table><thead><tr><th>NAMA / ID</th><th>KETERANGAN</th><th>AKSI</th></tr></thead><tbody><tr><td>Laporan penjualan LAP-001</td><td>Rp4.890.000 · 20 Okt 2026</td><td><button className="button button-soft" onClick={() => onOpen("Ringkasan laporan penjualan periode Oktober 2026.")} type="button">Lihat</button></td></tr><tr><td>Rekap pemesanan</td><td>5 pesanan • 102 pcs</td><td><button className="button button-soft" onClick={() => onOpen("Rekap pesanan periode Oktober 2026.")} type="button">Lihat</button></td></tr><tr><td>Laporan pembayaran</td><td>5 transaksi • Rp6.690.000</td><td><button className="button button-soft" onClick={() => onOpen("Laporan pembayaran periode Oktober 2026.")} type="button">Lihat</button></td></tr></tbody></table></div></Panel>
    </>
  );
}

function ProductDialog({ products, editingId }: { products: Product[]; editingId: string }) {
  const product = products.find((item) => item.id === editingId);
  return (
    <div className="dialog-fields"><label>Nama produk<input name="name" required defaultValue={product?.name} /></label><label>Kategori<input name="category" required defaultValue={product?.category} /></label><label>Harga dasar<input name="price" type="number" min={0} required defaultValue={product?.price} /></label><label>Bahan<input name="material" required defaultValue={product?.material} /></label></div>
  );
}

function CustomerDialog({ customers, editingId }: { customers: Customer[]; editingId: string }) {
  const customer = customers.find((item) => item.id === editingId);
  return (
    <div className="dialog-fields"><label>Nama lengkap<input name="name" required defaultValue={customer?.name} /></label><label>Username<input name="username" required defaultValue={customer?.username} /></label><label>Nomor telepon<input name="phone" required defaultValue={customer?.phone} /></label><label>Kode pos<input name="postalCode" required defaultValue={customer?.postalCode} /></label></div>
  );
}

function OrderDialog({ products }: { products: Product[] }) {
  return (
    <div className="dialog-fields"><label>Produk<select name="product" required defaultValue=""><option value="" disabled>Pilih produk</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label><label>Jumlah<input name="quantity" type="number" min={1} defaultValue={24} required /></label><label>Ukuran<select name="size" defaultValue="L"><option>S</option><option>M</option><option>L</option><option>XL</option></select></label><label>Metode penerimaan<select name="delivery" defaultValue="Ambil Sendiri"><option>Ambil Sendiri</option><option>Antar Alamat</option></select></label></div>
  );
}

export default Workspace;
