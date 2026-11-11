"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

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
  accountId: string;
  name: string;
  username: string;
  phone: string;
  postalCode: string;
  gender: string;
  street: string;
  rt: string;
  rw: string;
  village: string;
  district: string;
  city: string;
  province: string;
};

type Order = {
  id: string;
  customer: string;
  product: string;
  total: number;
  status: string;
  payment: string;
  date: string;
  quantity: number;
  paymentId?: string;
  productionId?: string;
  shipmentId?: string;
};
type OrderDraft = {
  product: string;
  quantity: number;
  size: string;
  delivery: string;
  specification: string;
};

const roles: Role[] = ["Pelanggan", "Admin", "Owner", "Produksi", "Pengiriman"];
type ApiUser = { id_akun: string; username: string; nama_lengkap: string; role: string };
type ApiRecord = Record<string, unknown>;

const productImages: Record<string, string> = {
  "PRD-001": "/images/polo-shirt.jpeg",
  "PRD-002": "/images/jacket.jpeg",
  "PRD-003": "/images/kaos.jpeg",
  "PRD-004": "/images/kemeja.jpeg",
};

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

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const result = await response.json().catch(() => null) as { error?: string } | T | null;
  if (!response.ok) {
    const message = result && typeof result === "object" && "error" in result
      ? String(result.error)
      : `Permintaan gagal (${response.status}).`;
    throw new Error(message);
  }
  return result as T;
}

function mapRole(role: string): Role | null {
  const normalized = role.toLowerCase();
  if (normalized === "pelanggan") return "Pelanggan";
  if (normalized === "admin") return "Admin";
  if (normalized === "owner") return "Owner";
  if (normalized === "produksi") return "Produksi";
  if (normalized === "kurir" || normalized === "pengiriman") return "Pengiriman";
  return null;
}

function mapProduct(record: ApiRecord): Product {
  return {
    id: String(record.id_produk),
    name: String(record.nama_produk),
    category: String(record.jenis),
    price: Number(record.harga_dasar),
    material: String(record.bahan ?? ""),
    status: String(record.status_tersedia ?? "Tersedia"),
  };
}

function mapCustomer(record: ApiRecord): Customer {
  const account = record.akun as ApiRecord | null;
  const addresses = Array.isArray(record.alamat) ? record.alamat as ApiRecord[] : [];
  const address = addresses[0];
  const postal = address?.kode_pos_alamat_kode_posTokode_pos as ApiRecord | null;
  return {
    id: String(record.id_pelanggan),
    accountId: String(record.id_akun),
    name: String(account?.nama_lengkap ?? ""),
    username: String(account?.username ?? ""),
    phone: String(record.no_hp ?? ""),
    postalCode: String(address?.kode_pos ?? ""),
    gender: String(record.jenis_kelamin ?? ""),
    street: String(address?.alamat_jalan ?? ""),
    rt: String(address?.alamat_rt ?? ""),
    rw: String(address?.alamat_rw ?? ""),
    village: String(postal?.kelurahan ?? ""),
    district: String(postal?.kecamatan ?? ""),
    city: String(postal?.kota ?? ""),
    province: String(postal?.provinsi ?? ""),
  };
}

function mapOrder(
  record: ApiRecord,
  customerNames: Map<string, string>,
  productionByOrder: Map<string, ApiRecord>,
  shipmentByOrder: Map<string, ApiRecord>,
  role: Role,
): Order {
  const details = Array.isArray(record.detail_pesanan) ? record.detail_pesanan as ApiRecord[] : [];
  const customer = record.pelanggan as ApiRecord | null;
  const payments = Array.isArray(record.pembayaran) ? record.pembayaran as ApiRecord[] : [];
  const payment = payments.find((item) => item.status_pembayaran === "Menunggu Verifikasi") ?? payments[0];
  const paymentStatus = String(payment?.status_pembayaran ?? "");
  const orderId = String(record.id_pesanan);
  const production = productionByOrder.get(orderId);
  const shipment = shipmentByOrder.get(orderId);
  const date = record.tgl_pesan ? new Date(String(record.tgl_pesan)).toLocaleDateString("id-ID") : "";
  return {
    id: orderId,
    customer: String(customerNames.get(String(record.id_pelanggan ?? "")) ?? customer?.id_pelanggan ?? "Pelanggan"),
    product: details.map((detail) => String((detail.produk as ApiRecord | null)?.nama_produk ?? "Produk")).join(", ") || "Belum ada detail",
    total: Number(record.total_harga ?? 0),
    status: String(
      (role === "Pengiriman" ? shipment?.status_pengiriman : undefined) ??
      (role === "Produksi" ? production?.status_produksi : undefined) ??
      record.status_pesanan ?? "",
    ),
    payment: paymentStatus || "Belum dibayar",
    date,
    quantity: details.reduce((sum, detail) => sum + Number(detail.jumlah ?? 0), 0),
    paymentId: payment ? String(payment.id_pembayaran) : undefined,
    productionId: production ? String(production.id_produksi) : undefined,
    shipmentId: shipment ? String(shipment.id_pengiriman) : undefined,
  };
}

async function loadWorkspaceData(role: Role) {
  const failures: string[] = [];
  async function load<T>(path: string, fallback: T): Promise<T> {
    try {
      return await apiRequest<T>(path);
    } catch (error) {
      failures.push(error instanceof Error ? error.message : "Gagal memuat data.");
      return fallback;
    }
  }
  const [productResult, customerResult, orderResult, productionResult, shipmentResult] = await Promise.all([
    load<{ data: ApiRecord[] }>("/api/products", { data: [] }),
    role === "Produksi" || role === "Pengiriman"
      ? Promise.resolve({ data: [] as ApiRecord[] })
      : load<{ data: ApiRecord[] }>("/api/customers", { data: [] }),
    load<{ data: ApiRecord[] }>("/api/orders", { data: [] }),
    role === "Admin" || role === "Owner" || role === "Produksi"
      ? load<{ data: ApiRecord[] }>("/api/production", { data: [] })
      : Promise.resolve({ data: [] as ApiRecord[] }),
    role === "Pelanggan" || role === "Admin" || role === "Owner" || role === "Pengiriman"
      ? load<{ data: ApiRecord[] }>("/api/shipments", { data: [] })
      : Promise.resolve({ data: [] as ApiRecord[] }),
  ]);
  const customerNames = new Map(customerResult.data.map((customer) => [
    String(customer.id_pelanggan),
    String((customer.akun as ApiRecord | null)?.nama_lengkap ?? ""),
  ]));
  const productionByOrder = new Map(productionResult.data.map((record) => [
    String(record.id_pesanan),
    record,
  ]));
  const shipmentByOrder = new Map(shipmentResult.data.map((record) => [
    String(record.id_pesanan),
    record,
  ]));
  return {
    products: productResult.data.map(mapProduct),
    customers: customerResult.data.map(mapCustomer),
    orders: orderResult.data.map((record) => mapOrder(
      record,
      customerNames,
      productionByOrder,
      shipmentByOrder,
      role,
    )),
    failures,
  };
}

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
  onLogin,
}: {
  role: Role;
  onBack: () => void;
  onRegister: () => void;
  onLogin: (username: string, password: string) => Promise<void>;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!username.trim() || !password) {
      setError("Username dan kata sandi wajib diisi.");
      return;
    }
    setSubmitting(true);
    try {
      await onLogin(username.trim(), password);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login gagal.");
    } finally {
      setSubmitting(false);
    }
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
          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting ? "Memeriksa..." : "Masuk"}
          </button>
          <button className="auth-submit" type="button" onClick={onRegister}>
            Daftar
          </button>
        </form>
      </section>
    </main>
  );
}

function Registration({ role, onBack, onRegistered }: { role: Role; onBack: () => void; onRegistered: (user: ApiUser) => Promise<void> }) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    const formData = new FormData(event.currentTarget);
    const [addressRt, addressRw] = String(formData.get("rtrw") ?? "").split("/");
    try {
      const result = await apiRequest<{ user: ApiUser }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({
          role: role.toLowerCase(),
          nama_lengkap: formData.get("name"),
          username: formData.get("username"),
          password: formData.get("password"),
          ...(role === "Pelanggan"
            ? {
                jenis_kelamin: formData.get("gender") || null,
                no_hp: formData.get("phone"),
                alamat_jalan: formData.get("street"),
                alamat_rt: addressRt?.trim() || null,
                alamat_rw: addressRw?.trim() || null,
                kode_pos: formData.get("postalCode") || null,
              }
            : { registration_code: formData.get("registrationCode") }),
        }),
      });
      await onRegistered(result.user);
    } catch (registrationError) {
      setMessage(registrationError instanceof Error ? registrationError.message : "Pendaftaran gagal.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="register-screen">
      <div className="register-photo" />
      <form className="register-form" onSubmit={submit}>
        <h1>Daftar {role}</h1>
        <p className="auth-role">Buat akun {role}</p>
        <div className={`register-columns${role === "Pelanggan" ? "" : " register-columns-single"}`}>
          <section className="register-column">
            <RegistrationField label="Nama Lengkap" name="name" maxLength={100} />
            <RegistrationField label="Username" name="username" minLength={3} maxLength={50} autoComplete="username" />
            <RegistrationField label="Kata sandi (minimal 10 karakter)" name="password" type="password" minLength={10} maxLength={128} autoComplete="new-password" />
            {role !== "Pelanggan" && <>
              <RegistrationField label={`Kode undangan ${role} dari administrator`} name="registrationCode" type="password" maxLength={128} autoComplete="off" />
              <p className="registration-security-note">Akun staf memerlukan kode undangan khusus peran. Minta kode kepada administrator.</p>
            </>}
          </section>
          {role === "Pelanggan" && <section className="register-column">
            <label className="register-field">
              <span>Jenis Kelamin</span>
              <select name="gender" defaultValue="" required>
                <option value="" disabled>Pilih jenis kelamin</option>
                <option>Perempuan</option>
                <option>Laki-laki</option>
              </select>
            </label>
            <RegistrationField label="Nomor Telepon" name="phone" type="tel" maxLength={20} autoComplete="tel" />
            <RegistrationField label="Jalan/nomor" name="street" maxLength={255} autoComplete="street-address" />
            <RegistrationField label="RT/RW" name="rtrw" required={false} />
            <RegistrationField label="Kode Pos (opsional)" name="postalCode" required={false} maxLength={10} autoComplete="postal-code" />
          </section>}
        </div>
        {message && <p className="register-message" role="status">{message}</p>}
        <button className="register-submit" type="submit" disabled={submitting}>{submitting ? "Menyimpan..." : "Daftar"}</button>
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
  minLength,
  maxLength,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  autoComplete?: string;
}) {
  return (
    <label className="register-field">
      <span>{label}</span>
      <input name={name} type={type} required={required} minLength={minLength} maxLength={maxLength} autoComplete={autoComplete} />
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
  const [apiUser, setApiUser] = useState<ApiUser | null>(null);
  const [section, setSection] = useState("Dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [editingId, setEditingId] = useState("");
  const [orderDraft, setOrderDraft] = useState<OrderDraft | null>(null);
  const [busy, setBusy] = useState(false);

  const userName = apiUser?.nama_lengkap ?? username;
  const customerProfile = customers.find((customer) => customer.accountId === apiUser?.id_akun);
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

  const refreshData = useCallback(async (currentRole: Role) => {
    const data = await loadWorkspaceData(currentRole);
    setProducts(data.products);
    setCustomers(data.customers);
    setOrders(data.orders);
    if (data.failures.length) {
      setNotice(`Sebagian data gagal dimuat: ${data.failures.join(" ")}`);
    }
  }, []);

  const activateUser = useCallback(async (user: ApiUser) => {
    const nextRole = mapRole(user.role);
    if (!nextRole) throw new Error("Peran akun tidak didukung oleh aplikasi.");
    setApiUser(user);
    setUsername(user.username);
    setRole(nextRole);
    setSection(navigation[nextRole][0]);
    setScreen("app");
    setNotice("");
    await refreshData(nextRole);
  }, [refreshData]);

  useEffect(() => {
    let active = true;
    apiRequest<{ user: ApiUser | null }>("/api/auth/session")
      .then(async ({ user }) => {
        if (active && user) await activateUser(user);
      })
      .catch((error: unknown) => {
        if (active) setNotice(error instanceof Error ? error.message : "Sesi login gagal dimuat.");
      });
    return () => {
      active = false;
    };
  }, [activateUser]);

  async function login(loginUsername: string, password: string) {
    const result = await apiRequest<{ user: ApiUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: loginUsername, password, role: role.toLowerCase() }),
    });
    await activateUser(result.user);
  }

  async function logout() {
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
      setApiUser(null);
      setUsername("");
      setProducts([]);
      setCustomers([]);
      setOrders([]);
      setNotice("");
      setScreen("welcome");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Gagal keluar dari akun.");
    }
  }

  function openDialog(type: Exclude<Dialog, null>, id = "") {
    setEditingId(id);
    setOrderDraft(null);
    setDialog(type);
  }

  function openOrderDialog(draft?: OrderDraft) {
    setEditingId("");
    setOrderDraft(draft ?? null);
    setDialog("order");
  }

  async function saveDialog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    try {
      if (dialog === "product") {
        const body = {
          nama_produk: String(data.get("name") ?? "").trim(),
          jenis: String(data.get("category") ?? "").trim(),
          harga_dasar: Number(data.get("price")),
          bahan: String(data.get("material") ?? "").trim(),
          status_tersedia: "Tersedia",
        };
        await apiRequest(editingId ? `/api/products/${encodeURIComponent(editingId)}` : "/api/products", {
          method: editingId ? "PATCH" : "POST",
          body: JSON.stringify(body),
        });
        setNotice(editingId ? "Data produk berhasil diperbarui." : "Produk berhasil ditambahkan.");
      } else if (dialog === "customer") {
        const street = String(data.get("street") ?? "").trim();
        const body = {
          nama_lengkap: String(data.get("name") ?? "").trim(),
          username: String(data.get("username") ?? "").trim(),
          no_hp: String(data.get("phone") ?? "").trim(),
          ...(street ? {
            alamat_jalan: street,
            alamat_rt: String(data.get("rt") ?? "").trim() || null,
            alamat_rw: String(data.get("rw") ?? "").trim() || null,
          } : {}),
          ...(String(data.get("postalCode") ?? "").trim()
            ? { kode_pos: String(data.get("postalCode")).trim() }
            : {}),
        };
        const result = await apiRequest<{ temporary_password?: string }>(
          editingId ? `/api/customers/${encodeURIComponent(editingId)}` : "/api/customers",
          { method: editingId ? "PATCH" : "POST", body: JSON.stringify(body) },
        );
        setNotice(result.temporary_password
          ? `Pelanggan dibuat. Kata sandi sementara (catat dan sampaikan dengan aman): ${result.temporary_password}`
          : editingId ? "Data pelanggan berhasil diperbarui." : "Pelanggan berhasil ditambahkan.");
      } else if (dialog === "order") {
        await apiRequest("/api/orders", {
          method: "POST",
          body: JSON.stringify({
            items: [{
              id_produk: String(data.get("product")),
              jumlah: Number(data.get("quantity")),
              ukuran: String(data.get("size") ?? ""),
              spesifikasi_desain: String(data.get("specification") ?? "").trim() || null,
            }],
            metode_pengambilan: String(data.get("delivery")),
          }),
        });
        setNotice("Pesanan berhasil dibuat dan dikirim ke admin.");
      }
      await refreshData(role);
      setDialog(null);
      setEditingId("");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Data gagal disimpan.");
    } finally {
      setBusy(false);
    }
  }

  async function updateOrder(id: string, field: "status" | "payment", value: string) {
    const order = orders.find((item) => item.id === id);
    if (!order) return;
    try {
      if (field === "payment") {
        await apiRequest("/api/payments", {
          method: "POST",
          body: JSON.stringify({
            id_pesanan: id,
            metode_bayar: "Transfer Bank",
            bukti_bayar: value,
            jumlah_bayar: order.total,
          }),
        });
        setNotice("Referensi bukti pembayaran berhasil dikirim untuk diverifikasi.");
      } else if (role === "Admin" && section === "Verifikasi Pembayaran") {
        if (!order.paymentId) throw new Error("Pesanan ini belum memiliki pembayaran untuk diverifikasi.");
        await apiRequest(`/api/payments/${encodeURIComponent(order.paymentId)}`, {
          method: "PATCH",
          body: JSON.stringify({ status_pembayaran: "Terverifikasi" }),
        });
        setNotice("Pembayaran berhasil diverifikasi.");
      } else if (role === "Admin") {
        await apiRequest(`/api/orders/${encodeURIComponent(id)}`, {
          method: "PATCH",
          body: JSON.stringify({
            status_pesanan: value === "Dikonfirmasi" ? "Menunggu Pembayaran" : value,
          }),
        });
        setNotice("Status pesanan berhasil diperbarui.");
      } else if (role === "Produksi") {
        if (!order.productionId) throw new Error("Pesanan ini belum memiliki antrean produksi.");
        const status_produksi = value === "Diproses" ? "Jahit" : value;
        await apiRequest(`/api/production/${encodeURIComponent(order.productionId)}`, {
          method: "PATCH",
          body: JSON.stringify({ status_produksi }),
        });
        setNotice("Status produksi berhasil diperbarui.");
      } else if (role === "Pengiriman") {
        if (!order.shipmentId) throw new Error("Pesanan ini belum memiliki data pengiriman.");
        await apiRequest(`/api/shipments/${encodeURIComponent(order.shipmentId)}`, {
          method: "PATCH",
          body: JSON.stringify({ status_pengiriman: value === "Update" ? "Dalam Perjalanan" : value }),
        });
        setNotice("Status pengiriman berhasil diperbarui.");
      } else {
        setNotice("Aksi ini tidak tersedia untuk peran akun saat ini.");
        return;
      }
      await refreshData(role);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Perubahan status gagal disimpan.");
    }
  }

  async function deleteRecord(resource: "products" | "customers", id: string) {
    if (!window.confirm("Hapus data ini secara permanen?")) return;
    try {
      await apiRequest(`/api/${resource}/${encodeURIComponent(id)}`, { method: "DELETE" });
      await refreshData(role);
      setNotice(resource === "products" ? "Produk berhasil dihapus." : "Pelanggan berhasil dihapus.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Data gagal dihapus.");
    }
  }

  function renderAdminDashboard() {
    const waiting = orders.filter((order) => order.status.toLowerCase().includes("menunggu")).length;
    const awaitingVerification = orders.filter((order) => order.payment.toLowerCase().includes("menunggu verifikasi")).length;
    const awaitingPayment = orders.filter((order) => order.status.toLowerCase().includes("menunggu pembayaran")).length;
    return (
      <>
        <div className="page-heading">
          <div><h1>Dashboard</h1><p>Ringkasan Pesanan</p></div>
        </div>
        <div className="metrics metrics-three">
          <MetricCard label="Pesanan Masuk" value={String(orders.length)} />
          <MetricCard label="Menunggu Verifikasi" value={String(awaitingVerification)} />
          <MetricCard label="Menunggu Pembayaran" value={String(awaitingPayment)} />
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
        <section className="operational-status"><h2>Status Operasional</h2><p>Pesanan menunggu: {waiting}</p><p>Pesanan selesai: {orders.filter((order) => order.status === "Selesai").length} • Dalam proses: {orders.filter((order) => ["Diproses", "Jahit", "Proses"].includes(order.status)).length}</p><p>Pembayaran menunggu verifikasi: {awaitingVerification}</p></section>
      </>
    );
  }

  function renderOwnerDashboard() {
    const totalOrders = orders.reduce((sum, order) => sum + order.total, 0);
    const totalQuantity = orders.reduce((sum, order) => sum + order.quantity, 0);
    const verifiedPayments = orders.filter((order) => order.payment === "Terverifikasi");
    const pendingPayments = orders.filter((order) => order.payment === "Menunggu Verifikasi");
    return (
      <div className="owner-dashboard">
        <section className="owner-greeting"><div><h1>Hallo, Owner!</h1><strong>{userName}</strong></div><b>{userName} &nbsp; {apiUser?.id_akun}</b></section>
        <div className="metrics metrics-three owner-metrics">
          <MetricCard label="Pesanan" value={String(orders.length)} /><MetricCard label="Produk" value={String(totalQuantity)} /><MetricCard label="Total Pesanan" value={formatCurrency(totalOrders)} />
        </div>
        <section className="owner-dashboard-report">
          <div className="owner-report-heading">
            <div><h2>Laporan</h2><p>LAP-001 | Hanya Baca</p></div>
            <div className="report-actions"><select aria-label="Periode laporan" defaultValue="Oktober 2026"><option>Oktober 2026</option><option>September 2026</option></select><button className="button button-soft" onClick={() => window.print()} type="button">▣ &nbsp; Cetak Laporan</button></div>
          </div>
          <div className="owner-table-scroll"><table className="owner-table"><thead><tr><th>NAMA / ID</th><th>KETERANGAN</th><th>AKSI</th></tr></thead>
            <tbody>
              <tr><td><strong>Laporan penjualan LAP-001</strong><small>10/2026</small></td><td><strong>{formatCurrency(totalOrders)}</strong><small>20 Okt 2026</small></td><td><button className="owner-mini-button" onClick={() => setSection("Laporan Penjualan")} type="button">Lihat</button></td></tr>
              <tr><td><strong>Rekap pemesanan</strong><small>{orders.length} pesanan • {totalQuantity} pcs</small></td><td><strong>Status Pesanan</strong><small>{orders.filter((order) => order.status === "Selesai").length} Selesai • {orders.filter((order) => order.status === "Dikirim").length} Dikirim • {orders.filter((order) => order.status.toLowerCase().includes("proses")).length} Diproses • {pendingPayments.length} Menunggu Verifikasi • {orders.filter((order) => order.status === "Menunggu Pembayaran").length} Menunggu Pembayaran</small></td><td><button className="owner-mini-button" onClick={() => setSection("Rekap Pesanan")} type="button">Lihat</button></td></tr>
              <tr><td><strong>Laporan pembayaran</strong><small>{orders.filter((order) => order.paymentId).length} transaksi</small></td><td><strong>{verifiedPayments.length} Pembayaran • {formatCurrency(verifiedPayments.reduce((sum, order) => sum + order.total, 0))}</strong><small>{verifiedPayments.length} Terverifikasi • {pendingPayments.length} BYR menunggu pembayaran</small></td><td><button className="owner-mini-button" onClick={() => setSection("Laporan Pembayaran")} type="button">Lihat</button></td></tr>
            </tbody>
          </table></div>
        </section>
      </div>
    );
  }

  function renderCustomerDashboard() {
    return (
      <>
        <div className="page-heading"><div><h1>Dashboard Pelanggan</h1><p>{userName}</p></div><span className="user-id">Akun: {customerProfile?.id ?? "—"}</span></div>
        <div className="customer-info-grid">
          <Panel title="Informasi Akun">
            <div className="info-list"><p><b>Nama Lengkap</b><span>{userName || "—"}</span></p><p><b>Username</b><span>{username || "—"}</span></p><p><b>Jenis Kelamin</b><span>{customerProfile?.gender || "—"}</span></p><p><b>Nomor Telepon</b><span>{customerProfile?.phone || "—"}</span></p><p><b>ID pelanggan</b><span>{customerProfile?.id || "—"}</span></p><p><b>ID akun</b><span>{apiUser?.id_akun || "—"}</span></p></div>
          </Panel>
          <Panel title="Alamat Pelanggan">
            <div className="info-list"><p><b>Jalan/nomor</b><span>{customerProfile?.street || "—"}</span></p><p><b>RT/RW</b><span>{customerProfile?.rt || "—"}/{customerProfile?.rw || "—"}</span></p><p><b>Kelurahan</b><span>{customerProfile?.village || "—"}</span></p><p><b>Kecamatan</b><span>{customerProfile?.district || "—"}</span></p><p><b>Kota</b><span>{customerProfile?.city || "—"}</span></p><p><b>Provinsi</b><span>{customerProfile?.province || "—"}</span></p></div>
          </Panel>
        </div>
        <Panel title="Pesanan pelanggan" action={<button className="button button-primary" onClick={() => setSection("Katalog Produk")} type="button">Buat Pesanan</button>}>
          <OrdersTable orders={orders.slice(0, 3)} onAction={async (order) => {
            try {
              const result = await apiRequest<{ data: ApiRecord }>(`/api/orders/${encodeURIComponent(order.id)}`);
              setNotice(`Pesanan ${order.id}: ${String(result.data.status_pesanan)} · ${formatCurrency(Number(result.data.total_harga))}`);
            } catch (error) {
              setNotice(error instanceof Error ? error.message : "Detail pesanan gagal dimuat.");
            }
          }} />
        </Panel>
        <Panel title="Riwayat pesanan">{orders.length ? orders.map((order) => <p className="history-note" key={order.id}>{order.date} • {order.product} • {order.quantity} pcs · {order.status}</p>) : <p className="history-note">Belum ada riwayat pesanan.</p>}</Panel>
      </>
    );
  }

  function renderDeliveryDashboard() {
    const deliveryStatuses = [
      { label: "Belum siap", count: orders.filter((order) => order.status === "Belum Siap").length },
      { label: "Belum dikirim", count: orders.filter((order) => order.status === "Belum Dikirim").length },
      { label: "Siap dikirim", count: orders.filter((order) => order.status === "Siap Dikirim").length },
      { label: "Dalam perjalanan", count: orders.filter((order) => order.status === "Dalam Perjalanan").length },
      { label: "Diambil", count: orders.filter((order) => order.status === "Diambil").length },
      { label: "Diterima", count: orders.filter((order) => order.status === "Diterima").length },
    ];
    return (
      <>
        <div className="page-heading"><div><h1>Dashboard</h1></div><span className="user-id">Pengiriman</span></div>
        <div className="metrics metrics-six">
          {deliveryStatuses.map((status) => <MetricCard key={status.label} label={status.label} value={String(status.count)} />)}
        </div>
        <Panel title="Pengiriman terbaru" action={<button className="button button-primary" onClick={() => setSection("Daftar Pengiriman")} type="button">Filter</button>}>
          <div className="table-scroll"><table><thead><tr><th>ID / NAMA</th><th>STATUS DAN METODE</th><th>ESTIMASI</th><th>AKSI</th></tr></thead>
            <tbody>{orders.map((order) => <tr key={order.id}><td><strong>{order.shipmentId ?? order.id}</strong><small>{order.customer} • {order.product} • {order.quantity} pcs</small></td><td>{order.status}</td><td>{order.date}</td><td><button className="text-button" onClick={() => updateOrder(order.id, "status", "Dalam Perjalanan")} type="button">Update</button></td></tr>)}</tbody>
          </table></div>
        </Panel>
      </>
    );
  }

  function renderProductionDashboard() {
    const queued = orders.filter((order) => order.status === "Antri").length;
    const working = orders.filter((order) => ["Jahit", "Proses"].includes(order.status)).length;
    const completed = orders.filter((order) => order.status === "Selesai").length;
    return (
      <>
        <div className="page-heading"><div><h1>Dashboard Produksi</h1><p>Ringkasan proses pesanan</p></div></div>
        <div className="metrics metrics-three"><MetricCard label="Antrean" value={String(queued)} /><MetricCard label="Sedang Dikerjakan" value={String(working)} /><MetricCard label="Selesai" value={String(completed)} /></div>
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
            <tbody>{filteredProducts.map((item) => <tr key={item.id}><td><strong>{item.id} • {item.name}</strong></td><td>{formatCurrency(item.price)} • {item.material}</td><td><span className="status-pill">{item.status}</span></td><td><div className="table-actions"><button className="button button-soft" onClick={() => openDialog("product", item.id)} type="button">Edit</button><button className="button button-soft" onClick={() => deleteRecord("products", item.id)} type="button">Hapus</button></div></td></tr>)}</tbody>
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
            <tbody>{filteredCustomers.map((item) => <tr key={item.id}><td><strong>{item.id}</strong></td><td>{item.name}</td><td>{item.username}</td><td>{item.phone}</td><td>{item.postalCode}</td><td><div className="table-actions"><button className="button button-soft" onClick={() => openDialog("customer", item.id)} type="button">Edit</button><button className="button button-soft" onClick={() => deleteRecord("customers", item.id)} type="button">Hapus</button></div></td></tr>)}</tbody>
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
            <tbody>{orders.filter((order) => `${order.id} ${order.customer} ${order.product}`.toLowerCase().includes(search.toLowerCase())).map((order) => <tr key={order.id}><td><strong>{order.id}</strong><small>{order.date}</small></td><td>{order.customer}<small>{order.product}</small></td><td>{formatCurrency(order.total)}</td><td><span className="status-pill">{order.status}</span></td><td><button className="button button-soft" onClick={() => updateOrder(order.id, "status", actionLabel)} disabled={role === "Admin" && section === "Verifikasi Pembayaran" && (order.payment !== "Menunggu Verifikasi" || !order.paymentId)} type="button">{actionLabel}</button></td></tr>)}</tbody>
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
      if (section === "Kritik & Saran") return <FeedbackPage role={role} orders={orders} />;
      return <NotificationPage role={role} />;
    }
    if (role === "Owner") {
      if (section === "Dashboard Owner") return renderOwnerDashboard();
      return <OwnerReportPage
        section={section}
        orders={orders}
        products={products}
        userName={userName}
        accountId={apiUser?.id_akun ?? ""}
        onBack={() => setSection("Dashboard Owner")}
        onOpen={(message) => setNotice(message)}
      />;
    }
    if (role === "Pelanggan") {
      if (section === "Dashboard") return renderCustomerDashboard();
      if (section === "Katalog Produk") return <CatalogPage products={products} onOrder={() => openDialog("order")} />;
      if (section === "Buat Pesanan") return <CreateOrderPage products={products} onCreate={openOrderDialog} />;
      if (section === "Pembayaran") return <PaymentPage orders={orders} onPay={(id, reference) => updateOrder(id, "payment", reference)} />;
      if (section === "Perubahan Pesanan") return <ChangeRequestPage orders={orders} />;
      if (section === "Kritik & Saran") return <FeedbackPage role={role} orders={orders} />;
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
    return (
      <>
        {notice && <p className="notice" role="alert">{notice}</p>}
        <Welcome onChoose={chooseRole} />
      </>
    );
  }
  if (screen === "login") {
    return (
      <Login
        role={role}
        onBack={() => setScreen("welcome")}
        onRegister={() => setScreen("register")}
        onLogin={login}
      />
    );
  }
  if (screen === "register") {
    return <Registration role={role} onBack={() => setScreen("login")} onRegistered={activateUser} />;
  }

  return (
    <div className={`app-shell role-${role.toLowerCase()}`}>
      <Sidebar role={role} active={section} onNavigate={(next) => { setSection(next); setSearch(""); }} onLogout={logout} />
      <main className="workspace-main">
        {role === "Owner" && section === "Dashboard Owner" ? null : null}
        <div className="workspace-toolbar">
          <span>CV Jogja Konveksi <b>/</b> {role}</span>
          {role === "Owner" && <button className="button button-soft" onClick={logout} type="button">Keluar</button>}
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
            {dialog === "order" && <OrderDialog products={products} draft={orderDraft} />}
            <div className="dialog-actions"><button className="button button-muted" type="button" onClick={() => setDialog(null)} disabled={busy}>Batal</button><button className="button button-primary" type="submit" disabled={busy}>{busy ? "Menyimpan..." : dialog === "order" ? "Konfirmasi Pesanan" : "Simpan"}</button></div>
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
      <tbody>{orders.map((order) => <tr key={order.id}><td><strong>{order.id}</strong><small>{order.customer} • {order.date}</small></td><td>{order.product}<small>{order.quantity} pcs</small></td><td>{formatCurrency(order.total)}</td><td><span className="status-pill">{order.status}</span></td><td><button className="text-button" type="button" onClick={() => onAction(order)}>Rincian</button></td></tr>)}</tbody>
    </table></div>
  );
}

function CatalogPage({ products, onOrder }: { products: Product[]; onOrder: () => void }) {
  return (
    <>
      <div className="page-heading customer-page-heading"><div><h1>Katalog Produk</h1></div><span className="user-id">Pelanggan</span></div>
      <div className="metrics metrics-three compact-metrics customer-catalog-metrics"><MetricCard label="Nomor Produk" value={String(products.length).padStart(2, "0")} /><MetricCard label="Kategori Produk" value="Konveksi" /><MetricCard label="Metode Pesanan" value="Online" /></div>
      <section className="product-grid customer-catalog-grid">{products.map((product) => <article className="catalog-card customer-catalog-card" data-product-id={product.id} key={product.id}><h2>{product.name} - {product.id}</h2><div className="product-placeholder customer-product-image">{productImages[product.id] && <Image src={productImages[product.id]} alt={product.name} width={420} height={260} />}</div><p>{product.category} • {product.material}</p><strong>{formatCurrency(product.price)}</strong><button className="button button-primary" onClick={onOrder} type="button">Pilih produk</button></article>)}</section>
    </>
  );
}

function CreateOrderPage({ products, onCreate }: { products: Product[]; onCreate: (draft: OrderDraft) => void }) {
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState("24");
  const [size, setSize] = useState("L");
  const [delivery, setDelivery] = useState("Ambil Sendiri");
  const [specification, setSpecification] = useState("");
  return (
    <>
      <div className="page-heading customer-page-heading"><div><h1>Buat Pesanan</h1></div><span className="user-id">Pelanggan</span></div>
      <h2 className="customer-section-title">Detail pesanan produk baru</h2>
      <form className="order-builder customer-order-builder" onSubmit={(event) => {
          event.preventDefault();
          if (!product || Number(quantity) < 1) return;
          onCreate({ product, quantity: Number(quantity), size, delivery, specification });
        }}>
          <div className="order-fields customer-order-fields">
            <label>Produk<select required value={product} onChange={(event) => setProduct(event.target.value)}><option value="" disabled>Pilih produk</option>{products.map((item) => <option key={item.id} value={item.id}>{item.name} — {formatCurrency(item.price)}</option>)}</select></label>
            <label>Spesifikasi/Desain custom<textarea rows={3} maxLength={150} value={specification} onChange={(event) => setSpecification(event.target.value)} placeholder="Tuliskan detail desain atau ukuran logo" /></label>
            <label>Ukuran<select value={size} onChange={(event) => setSize(event.target.value)}><option>S</option><option>M</option><option>L</option><option>XL</option><option>Custom</option></select></label>
            <label>Jumlah<input type="number" value={quantity} min={1} onChange={(event) => setQuantity(event.target.value)} required /></label>
            <label>Metode Penerimaan<select value={delivery} onChange={(event) => setDelivery(event.target.value)}><option>Ambil Sendiri</option><option>Antar Alamat</option></select></label>
            <button className="button button-primary customer-order-submit" type="submit" disabled={!products.length}>Konfirmasi Pesanan <span aria-hidden="true">→</span></button>
          </div>
          <div className="customer-order-products">
            {products.map((item) => (
              <article className="customer-order-product" data-product-id={item.id} key={item.id}>
                <h3>{item.name}</h3>
                <div className="product-placeholder customer-order-product-image">{productImages[item.id] && <Image src={productImages[item.id]} alt={item.name} width={220} height={220} />}</div>
                <strong>{formatCurrency(item.price)}</strong>
                <button className="button button-primary" type="button" onClick={() => setProduct(item.id)}>Pilih produk</button>
              </article>
            ))}
          </div>
      </form>
    </>
  );
}

function PaymentPage({ orders, onPay }: { orders: Order[]; onPay: (id: string, reference: string) => void }) {
  const [files, setFiles] = useState<Record<string, string>>({});
  return (
    <>
      <div className="page-heading customer-page-heading"><div><h1>Pembayaran</h1></div><span className="user-id">Pelanggan</span></div>
      <div className="metrics metrics-three compact-metrics customer-payment-metrics">
        <MetricCard label="Total Pesanan" value={String(orders.length)} />
        <MetricCard label="Belum dibayar" value={String(orders.filter((order) => order.status === "Menunggu Pembayaran").length)} />
        <MetricCard label="Dalam Proses" value={String(orders.filter((order) => order.status !== "Menunggu Pembayaran").length)} />
      </div>
      <Panel title="Daftar Pesanan" action={<span className="customer-payment-hint">Unggah bukti pembayaran untuk pesanan aktif</span>}>
        <div className="customer-payment-list">{orders.map((order) => (
          <article className="customer-payment-row" key={order.id}>
            <div className="customer-payment-order"><strong>{order.id}</strong><span>{order.product}</span></div>
            <strong className="customer-payment-total">{formatCurrency(order.total)}</strong>
            <span className="status-pill">{order.payment}</span>
            <div className="payment-upload customer-payment-upload">
              <label className="file-picker">Pilih bukti<input type="file" accept="image/*,.pdf" onChange={(event) => setFiles((current) => ({ ...current, [order.id]: event.target.files?.[0]?.name ?? "" }))} /></label>
              {files[order.id] && <small>{files[order.id]}</small>}
              <button className="button button-primary" disabled={!files[order.id] || order.status !== "Menunggu Pembayaran"} onClick={() => onPay(order.id, files[order.id])} type="button">Kirim bukti</button>
            </div>
          </article>
        ))}</div>
        <p className="panel-subtitle customer-payment-note">Server menyimpan nama file sebagai referensi, belum mengunggah isi file.</p>
      </Panel>
    </>
  );
}

function ChangeRequestPage({ orders }: { orders: Order[] }) {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);
  return (
    <>
      <div className="page-heading customer-page-heading"><div><h1>Perubahan Pesanan</h1></div><span className="user-id">Pelanggan</span></div>
      <div className="customer-change-layout">
        <Panel title="Ajukan perubahan">
          {sent ? <p className="success-message">Permintaan perubahan berhasil dikirim.</p> : <form className="simple-form customer-change-form" onSubmit={async (event) => {
          event.preventDefault();
          setSaving(true);
          setMessage("");
          const form = new FormData(event.currentTarget);
          try {
            await apiRequest("/api/order-changes", {
              method: "POST",
              body: JSON.stringify({
                id_pesanan: form.get("orderId"),
                deskripsi_perubahan: form.get("description"),
              }),
            });
            setSent(true);
          } catch (error) {
            setMessage(error instanceof Error ? error.message : "Permintaan gagal dikirim.");
          } finally {
            setSaving(false);
          }
        }}>
          <label>ID pesanan<select name="orderId" required defaultValue=""><option value="" disabled>Pilih pesanan</option>{orders.map((order) => <option key={order.id} value={order.id}>{order.id}</option>)}</select></label>
          <label>Deskripsi perubahan<textarea name="description" required rows={4} placeholder="Jelaskan perubahan yang diperlukan" /></label>
          {message && <p className="auth-error" role="alert">{message}</p>}
          <button className="button button-primary" type="submit" disabled={saving || !orders.length}>{saving ? "Mengirim..." : "Kirim Permintaan"}</button>
        </form>}
        </Panel>
        <div className="customer-store-photo customer-change-photo">
          <Image src="/konveksi-store.png" alt="Toko Jogja Konveksi" width={335} height={704} priority />
        </div>
      </div>
    </>
  );
}

function FeedbackPage({ role, orders }: { role: Role; orders: Order[] }) {
  const [sent, setSent] = useState(false);
  const [feedback, setFeedback] = useState<ApiRecord[]>([]);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState("");
  useEffect(() => {
    apiRequest<{ data: ApiRecord[] }>("/api/feedback")
      .then((result) => setFeedback(result.data))
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Gagal memuat masukan."));
  }, []);
  if (role === "Admin") {
    return (
      <>
        <div className="page-heading"><div><h1>Kelola Kritik & Saran</h1><p>Masukan pelanggan</p></div></div>
        <div className="metrics metrics-three compact-metrics"><MetricCard label="Masukan Masuk" value={String(feedback.length)} /><MetricCard label="Perlu Tanggapan" value={String(feedback.filter((item) => !item.tanggapan_admin).length)} /><MetricCard label="Rating Produk" value={feedback.length ? `${(feedback.reduce((sum, item) => sum + Number(item.rating ?? 0), 0) / feedback.length).toFixed(1)} / 5` : "—"} /></div>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <Panel title="Masukan pelanggan">
          {feedback.map((item) => (
            <article className="feedback-item" key={String(item.id_kritik)}>
              <strong>{String((item.pelanggan as ApiRecord | null)?.id_pelanggan ?? "")} · {String(item.id_kritik)}</strong>
              <span>Rating {String(item.rating ?? "—")}/5 · {String(item.isi ?? "")}</span>
              {item.tanggapan_admin ? <p>{String(item.tanggapan_admin)}</p> : <form className="simple-form" onSubmit={async (event) => {
                event.preventDefault();
                setSavingId(String(item.id_kritik));
                const form = new FormData(event.currentTarget);
                try {
                  await apiRequest(`/api/feedback/${encodeURIComponent(String(item.id_kritik))}`, {
                    method: "PATCH",
                    body: JSON.stringify({ tanggapan_admin: form.get("reply") }),
                  });
                  setFeedback((current) => current.map((entry) => entry.id_kritik === item.id_kritik
                    ? { ...entry, tanggapan_admin: form.get("reply") }
                    : entry));
                } catch (replyError) {
                  setError(replyError instanceof Error ? replyError.message : "Tanggapan gagal disimpan.");
                } finally {
                  setSavingId("");
                }
              }}>
                <label>Tanggapan<textarea name="reply" rows={3} required /></label>
                <button className="button button-primary" type="submit" disabled={savingId === item.id_kritik}>{savingId === item.id_kritik ? "Menyimpan..." : "Simpan tanggapan"}</button>
              </form>}
            </article>
          ))}
          {!feedback.length && !error && <p>Belum ada masukan.</p>}
        </Panel>
      </>
    );
  }
  return (
    <>
      <div className="page-heading customer-page-heading"><div><h1>Kritik dan saran</h1></div><span className="user-id">Pelanggan</span></div>
      <div className="customer-feedback-layout">
        <div className="customer-feedback-content">
          <p className="customer-feedback-intro">Masukkan dan penilaian</p>
          <div className="customer-feedback-summary">
            <article><span>Rating Produk</span><strong>5/5</strong><span className="customer-stars" aria-label="5 dari 5 bintang">★ ★ ★ ★ ★</span></article>
            <article><span>Ulasan Dikirim</span><strong>{feedback.length}</strong></article>
          </div>
          <Panel title="Tulis Ulasan">{sent ? <p className="success-message">Masukan berhasil dikirim.</p> : <form className="simple-form customer-feedback-form" onSubmit={async (event) => {
        event.preventDefault();
        setError("");
        const form = new FormData(event.currentTarget);
        try {
          await apiRequest("/api/feedback", {
            method: "POST",
            body: JSON.stringify({
              id_pesanan: form.get("orderId"),
              rating: Number(form.get("rating")),
              isi: form.get("content"),
            }),
          });
          setSent(true);
        } catch (submitError) {
          setError(submitError instanceof Error ? submitError.message : "Masukan gagal dikirim.");
        }
      }}>
        <label>Pesanan<select name="orderId" required defaultValue=""><option value="" disabled>Pilih pesanan</option>{orders.map((order) => <option key={order.id} value={order.id}>{order.id}</option>)}</select></label>
        <label>Rating<select name="rating" defaultValue="5"><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select></label>
        <label>Masukan<textarea name="content" required rows={3} /></label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="button button-primary" type="submit">Kirim Masukan</button>
          </form>}</Panel>
        </div>
        <div className="customer-store-photo customer-feedback-photo">
          <Image src="/konveksi-store.png" alt="Toko Jogja Konveksi" width={335} height={704} priority />
        </div>
      </div>
    </>
  );
}

function NotificationPage({ role }: { role: Role }) {
  const [notifications, setNotifications] = useState<ApiRecord[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    apiRequest<{ data: ApiRecord[] }>("/api/notifications")
      .then((result) => setNotifications(result.data))
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Gagal memuat notifikasi."));
  }, []);

  async function markAsRead(id: string) {
    try {
      await apiRequest(`/api/notifications/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({ status_baca: 1 }),
      });
      setNotifications((current) => current.map((item) => item.id_notifikasi === id
        ? { ...item, status_baca: 1 }
        : item));
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : "Notifikasi gagal diperbarui.");
    }
  }

  const unreadCount = notifications.filter((item) => Number(item.status_baca ?? 0) === 0).length;
  return (
    <>
      <div className="page-heading"><div><h1>Notifikasi {role}</h1><p>Informasi terbaru terkait pesanan</p></div></div>
      <div className="metrics metrics-three compact-metrics"><MetricCard label="Notifikasi" value={String(notifications.length)} /><MetricCard label="Belum dibaca" value={String(unreadCount)} /><MetricCard label="Akun" value={role} /></div>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <Panel title="Perlu ditinjau">
        {notifications.map((item) => {
          const order = item.pesanan as ApiRecord | null;
          const isRead = Number(item.status_baca ?? 0) === 1;
          return <div className="notification-row" key={String(item.id_notifikasi)}>
            <div><strong>{String(order?.id_pesanan ?? "")}</strong><p>{String(item.pesan ?? "")}</p></div>
            <button className="button button-soft" type="button" disabled={isRead} onClick={() => markAsRead(String(item.id_notifikasi))}>{isRead ? "Dibaca" : "Tandai dibaca"}</button>
          </div>;
        })}
        {!notifications.length && !error && <p>Tidak ada notifikasi.</p>}
      </Panel>
    </>
  );
}

function OwnerReportPage({
  section,
  orders,
  products,
  userName,
  accountId,
  onBack,
  onOpen,
}: {
  section: string;
  orders: Order[];
  products: Product[];
  userName: string;
  accountId: string;
  onBack: () => void;
  onOpen: (message: string) => void;
}) {
  const [report, setReport] = useState<{ summary: ApiRecord; laporan: ApiRecord[]; aktivitas: ApiRecord[] } | null>(null);
  const [payments, setPayments] = useState<ApiRecord[]>([]);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("Oktober 2026");
  const [statusFilter, setStatusFilter] = useState("Semua");
  const [orderType, setOrderType] = useState("Semua");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [printPrompt, setPrintPrompt] = useState(true);

  useEffect(() => {
    apiRequest<{ data: { summary: ApiRecord; laporan: ApiRecord[]; aktivitas: ApiRecord[] } }>("/api/reports")
      .then((result) => setReport(result.data))
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Gagal memuat laporan."));
    apiRequest<{ data: ApiRecord[] }>("/api/payments")
      .then((result) => setPayments(result.data))
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Gagal memuat data pembayaran."));
  }, []);

  const totalOrders = orders.reduce((sum, order) => sum + order.total, 0);
  const totalQuantity = orders.reduce((sum, order) => sum + order.quantity, 0);
  const totalPaid = payments.reduce((sum, item) => sum + Number(item.jumlah_bayar ?? 0), 0);
  const verifiedPayments = payments.filter((item) => String(item.status_pembayaran ?? "").toLowerCase() === "terverifikasi");
  const waitingPayments = payments.filter((item) => String(item.status_pembayaran ?? "").toLowerCase().includes("menunggu verifikasi"));
  const verifiedTotal = verifiedPayments.reduce((sum, item) => sum + Number(item.jumlah_bayar ?? 0), 0);
  const waitingTotal = waitingPayments.reduce((sum, item) => sum + Number(item.jumlah_bayar ?? 0), 0);
  const reports = report?.laporan ?? [];
  const latestReport = reports[0];
  const salesTotal = Number(latestReport?.total_pendapatan ?? totalOrders);
  const latestReportId = String(latestReport?.id_laporan ?? "—");
  const parseOrderDate = (value: string) => {
    const [day, month, year] = value.split("/").map(Number);
    if (!day || !month || !year) return null;
    return new Date(year, month - 1, day);
  };
  const selectedMonth = new Map([["Januari", 0], ["Februari", 1], ["Maret", 2], ["April", 3], ["Mei", 4], ["Juni", 5], ["Juli", 6], ["Agustus", 7], ["September", 8], ["Oktober", 9], ["November", 10], ["Desember", 11]]).get(period.split(" ")[0]);
  const selectedYear = Number(period.split(" ")[1]);
  const visibleOrders = orders.filter((order) => {
    const orderDate = parseOrderDate(order.date);
    const matchesStatus = statusFilter === "Semua" || order.status === statusFilter;
    const matchesType = orderType === "Semua" || order.product.toLowerCase().includes(orderType.toLowerCase());
    const matchesPeriod = selectedMonth === undefined || !orderDate || (orderDate.getMonth() === selectedMonth && orderDate.getFullYear() === selectedYear);
    const matchesFrom = !fromDate || !orderDate || orderDate >= new Date(`${fromDate}T00:00:00`);
    const matchesTo = !toDate || !orderDate || orderDate <= new Date(`${toDate}T23:59:59`);
    return matchesStatus && matchesType && matchesPeriod && matchesFrom && matchesTo;
  });
  const orderStatuses = [...new Set(orders.map((order) => order.status).filter(Boolean))];
  const orderById = new Map(orders.map((order) => [order.id, order]));
  const activities = report?.aktivitas ?? [];
  const paymentDate = (value: unknown) => {
    if (!value) return "—";
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date);
  };
  const pageHeader = (
    <header className="owner-page-heading">
      <h1>{section}</h1>
      <button className="owner-back-button" type="button" onClick={onBack}><span aria-hidden="true">←</span> Kembali</button>
    </header>
  );
  const printConfirmation = (
    <footer className="owner-print-confirmation">
      <strong>Cetak Laporan?</strong>
      {printPrompt ? (
        <div>
          <button type="button" onClick={() => { setPrintPrompt(false); window.print(); }}>Ya, Cetak</button>
          <button type="button" onClick={() => setPrintPrompt(false)}>Tidak</button>
        </div>
      ) : (
        <button type="button" onClick={() => setPrintPrompt(true)}>Cetak Laporan</button>
      )}
    </footer>
  );

  if (section === "Rekap Pesanan") {
    return (
      <div className="owner-report-page owner-order-summary-page">
        {pageHeader}
        <div className="owner-report-stats owner-order-stats">
          <article><span>Pesanan</span><strong>{orders.length}</strong></article>
          <article><span>Total Produk</span><strong>{totalQuantity}</strong></article>
          <article><span>Total Pesanan</span><strong>{formatCurrency(totalOrders)}</strong></article>
        </div>
        <section className="owner-report-card owner-order-report">
          <div className="owner-report-tools">
            <select aria-label="Periode rekap" value={period} onChange={(event) => setPeriod(event.target.value)}><option>Semua</option><option>Oktober 2026</option><option>September 2026</option><option>Agustus 2026</option></select>
            <select aria-label="Status pesanan" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>Semua</option>{orderStatuses.map((status) => <option key={status}>{status}</option>)}</select>
            <button type="button" onClick={() => setFilterOpen(true)}>Filter Rekap</button>
            <button type="button" onClick={() => window.print()}>Cetak Rekap</button>
          </div>
          {error && <p className="owner-report-error" role="alert">{error}</p>}
          <div className="owner-table-scroll"><table className="owner-table"><thead><tr><th>PESANAN</th><th>PRODUK</th><th>NILAI PESANAN</th><th>STATUS</th></tr></thead>
            <tbody>{visibleOrders.map((order) => <tr key={order.id}><td><strong>{order.id}</strong><small>{order.customer} • {order.date}</small></td><td>{order.product}<small>{order.quantity} pcs</small></td><td>{formatCurrency(order.total)}</td><td>{order.status}</td></tr>)}
              {!visibleOrders.length && <tr><td colSpan={4}>Tidak ada pesanan untuk filter yang dipilih.</td></tr>}
            </tbody></table></div>
          <div className="owner-report-footnote">{orders.length} pesanan • {products.length} produk terdaftar • {totalQuantity} total pcs</div>
          <div className="owner-operations-strip"><strong>PRODUKSI</strong><strong>PENGIRIMAN</strong><span>{orders.filter((order) => ["Jahit", "Proses", "Selesai"].includes(order.status)).length} pesanan sedang/selesai produksi</span><span>{orders.filter((order) => ["Dikirim", "Dalam Perjalanan", "Diterima"].includes(order.status)).length} dalam proses pengiriman</span></div>
          {printConfirmation}
        </section>
        {filterOpen && <div className="owner-filter-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setFilterOpen(false); }}>
          <section className="owner-filter-dialog" role="dialog" aria-modal="true" aria-labelledby="owner-filter-title">
            <h2 id="owner-filter-title">Filter Rekap</h2>
            <div className="owner-filter-period"><strong>Periode</strong><label>Dari tanggal<input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} /></label><label>Sampai tanggal<input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} /></label></div>
            <label>Status Pesanan<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>Semua</option>{orderStatuses.map((status) => <option key={status}>{status}</option>)}</select></label>
            <label>Jenis Laporan<select value={orderType} onChange={(event) => setOrderType(event.target.value)}><option>Semua</option>{products.map((product) => <option key={product.id}>{product.name}</option>)}</select></label>
            <div className="owner-filter-result">Hasil <small>{visibleOrders.length} pesanan ditampilkan</small></div>
            <div className="owner-filter-actions"><button type="button" onClick={() => { setStatusFilter("Semua"); setOrderType("Semua"); setPeriod("Semua"); setFromDate(""); setToDate(""); }}>Reset</button><button type="button" onClick={() => setFilterOpen(false)}>Batal</button><button type="button" onClick={() => setFilterOpen(false)}>Terapkan Filter</button></div>
          </section>
        </div>}
      </div>
    );
  }

  if (section === "Laporan Penjualan") {
    return (
      <div className="owner-report-page owner-sales-page">
        {pageHeader}
        <div className="owner-report-stats owner-sales-stats">
          <article><span>Pendapatan {latestReportId}</span><strong>{formatCurrency(salesTotal)}</strong></article>
          <article><span>Periode</span><strong>10/2026</strong></article>
          <article><span>Tanggal Laporan</span><strong>{latestReport ? paymentDate(latestReport.tgl_laporan) : "—"}</strong></article>
        </div>
        <section className="owner-report-card">
          <div className="owner-report-tools"><select aria-label="Periode laporan penjualan" value={period} onChange={(event) => setPeriod(event.target.value)}><option>Semua</option><option>Oktober 2026</option><option>September 2026</option></select><button type="button" onClick={() => window.print()}>Pratinjau Cetak</button></div>
          <p className="owner-report-subtitle">ID Laporan: {latestReportId}</p>
          {error && <p className="owner-report-error" role="alert">{error}</p>}
          <div className="owner-table-scroll"><table className="owner-table"><thead><tr><th>KETERANGAN</th><th>NILAI</th><th>SUMBER</th></tr></thead><tbody>
            <tr><td>Total nilai {orders.length} pesanan</td><td>{formatCurrency(totalOrders)}</td><td>Rekap pesanan</td></tr>
            <tr><td>Total {payments.length} pembayaran</td><td>{formatCurrency(totalPaid)}</td><td>Rekap pembayaran</td></tr>
            <tr><td>Pembayaran terverifikasi</td><td>{formatCurrency(verifiedTotal)}</td><td>{verifiedPayments.length} pembayaran</td></tr>
            <tr><td>Menunggu verifikasi</td><td>{formatCurrency(waitingTotal)}</td><td>{waitingPayments.length} pembayaran</td></tr>
          </tbody></table></div>
          <p className="owner-report-date">Tanggal laporan · {latestReport ? paymentDate(latestReport.tgl_laporan) : "Belum tersedia"}</p>
          {printConfirmation}
        </section>
      </div>
    );
  }

  if (section === "Laporan Pembayaran") {
    return (
      <div className="owner-report-page owner-payments-page">
        {pageHeader}
        <div className="owner-report-stats owner-payment-stats">
          <article><span>Total Pembayaran</span><strong>{formatCurrency(totalPaid)}</strong></article>
          <article><span>{verifiedPayments.length} Terverifikasi</span><strong>{formatCurrency(verifiedTotal)}</strong></article>
          <article><span>{waitingPayments.length} Menunggu</span><strong>{formatCurrency(waitingTotal)}</strong></article>
        </div>
        <section className="owner-report-card">
          <div className="owner-report-tools"><select aria-label="Periode pembayaran" value={period} onChange={(event) => setPeriod(event.target.value)}><option>Semua</option><option>Oktober 2026</option><option>September 2026</option></select><select aria-label="Status pembayaran" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>Semua</option><option>Terverifikasi</option><option>Menunggu Verifikasi</option></select><button type="button" onClick={() => window.print()}>Cetak Laporan</button></div>
          {error && <p className="owner-report-error" role="alert">{error}</p>}
          <div className="owner-table-scroll"><table className="owner-table"><thead><tr><th>PESANAN</th><th>TANGGAL / JENIS</th><th>NOMINAL</th><th>STATUS</th><th>BUKTI</th></tr></thead>
            <tbody>{payments.filter((payment) => statusFilter === "Semua" || String(payment.status_pembayaran ?? "") === statusFilter).map((payment) => {
              const orderId = String(payment.id_pesanan ?? "");
              const order = orderById.get(orderId);
              return <tr key={String(payment.id_pembayaran)}><td><strong>{String(payment.id_pembayaran)}</strong><small>{orderId} • {order?.customer ?? "Pelanggan"}</small></td><td>{paymentDate(payment.tgl_bayar)}<small>{String(payment.jenis_bayar ?? "—")} · {String(payment.metode_bayar ?? "—")}</small></td><td>{formatCurrency(Number(payment.jumlah_bayar ?? 0))}</td><td><span className="owner-payment-status">{String(payment.status_pembayaran ?? "—")}</span></td><td>{String(payment.bukti_bayar ?? "—")}</td></tr>;
            })}
              {!payments.length && !error && <tr><td colSpan={5}>Belum ada data pembayaran.</td></tr>}
            </tbody></table></div>
          <div className="owner-payment-revenue">Pendapatan {latestReportId} · {formatCurrency(salesTotal)}</div>
          {printConfirmation}
        </section>
      </div>
    );
  }

  const firstActivity = activities[0] as ApiRecord | undefined;
  const firstActivityReport = firstActivity?.laporan as ApiRecord | undefined;
  return (
    <div className="owner-report-page owner-activity-page">
      {pageHeader}
      <section className="owner-activity-summary">
        <h2>{accountId} / {String(firstActivity?.id_laporan ?? latestReportId)}</h2>
        <button className="owner-report-link" type="button" onClick={() => onOpen(`Laporan terkait ${String(firstActivity?.id_laporan ?? latestReportId)}.`)}>Lihat {String(firstActivity?.id_laporan ?? latestReportId)}</button>
        <p>ID akun: {accountId} · {userName} <span>ID Laporan: {String(firstActivity?.id_laporan ?? latestReportId)}</span></p>
      </section>
      <section className="owner-report-card owner-activity-card">
        <h2>Laporan Terkait</h2>
        {error && <p className="owner-report-error" role="alert">{error}</p>}
        <div className="owner-table-scroll"><table className="owner-table"><thead><tr><th>LAPORAN</th><th>PERIODE</th><th>PENDAPATAN</th><th>AKSES</th></tr></thead><tbody>
          {activities.map((activity) => {
            const linkedReport = activity.laporan as ApiRecord | undefined;
            return <tr key={String(activity.id_laporan)}><td>{String(linkedReport?.id_laporan ?? activity.id_laporan)} · Laporan Penjualan</td><td>{String(linkedReport?.periode_bulan ?? "—")}/{String(linkedReport?.periode_tahun ?? "—")}</td><td>{formatCurrency(Number(linkedReport?.total_pendapatan ?? 0))}</td><td>Hanya Baca</td></tr>;
          })}
          {!activities.length && !error && <tr><td colSpan={4}>Belum ada aktivitas laporan untuk akun ini.</td></tr>}
        </tbody></table></div>
        <p className="owner-report-date">Tanggal laporan · {firstActivityReport ? paymentDate(firstActivityReport.tgl_laporan) : "—"}</p>
      </section>
    </div>
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
    <div className="dialog-fields"><label>Nama lengkap<input name="name" required defaultValue={customer?.name} /></label><label>Username<input name="username" required defaultValue={customer?.username} /></label><label>Nomor telepon<input name="phone" required defaultValue={customer?.phone} /></label><label>Jalan/nomor<input name="street" defaultValue={customer?.street} /></label><label>RT<input name="rt" maxLength={3} defaultValue={customer?.rt} /></label><label>RW<input name="rw" maxLength={3} defaultValue={customer?.rw} /></label><label>Kode pos<input name="postalCode" defaultValue={customer?.postalCode} /></label></div>
  );
}

function OrderDialog({ products, draft }: { products: Product[]; draft: OrderDraft | null }) {
  return (
    <div className="dialog-fields"><label>Produk<select name="product" required defaultValue={draft?.product ?? ""}><option value="" disabled>Pilih produk</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label><label>Jumlah<input name="quantity" type="number" min={1} defaultValue={draft?.quantity ?? 24} required /></label><label>Ukuran<select name="size" defaultValue={draft?.size ?? "L"}><option>S</option><option>M</option><option>L</option><option>XL</option><option>Custom</option></select></label><label>Metode penerimaan<select name="delivery" defaultValue={draft?.delivery ?? "Ambil Sendiri"}><option>Ambil Sendiri</option><option>Antar Alamat</option></select></label><label>Spesifikasi desain<textarea name="specification" rows={3} maxLength={150} defaultValue={draft?.specification ?? ""} /></label></div>
  );
}

export default Workspace;
