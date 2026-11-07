import { NextResponse } from "next/server";
import { ApiError, createId, dateField, numberField, readJson, runApi, stringField } from "@/app/lib/api";
import { getCustomerId, normalizeRole, requireRole, requireUser } from "@/app/lib/auth";
import { orderInclude, orderIdsForStaff } from "@/app/lib/orders";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  return runApi(async () => {
    const user = await requireUser();
    const role = normalizeRole(user.role);
    let where: { id_pelanggan?: string | null; id_pesanan?: { in: string[] } } | undefined;
    if (role === "pelanggan") {
      where = { id_pelanggan: await getCustomerId(user.id_akun) };
    } else if (role === "produksi" || role === "pengiriman") {
      where = { id_pesanan: { in: await orderIdsForStaff(user.id_akun, role) } };
    } else {
      requireRole(user, ["admin", "owner"]);
    }
    return { data: await prisma.pesanan.findMany({
      where,
      include: orderInclude,
      orderBy: { tgl_pesan: "desc" },
    }) };
  });
}

export async function POST(request: Request) {
  return runApi(async () => {
    const user = await requireUser();
    requireRole(user, ["pelanggan"]);
    const body = await readJson(request);
    if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 20) {
      throw new ApiError("Pesanan harus memiliki 1-20 jenis produk.", 400);
    }
    const items = body.items.map((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        throw new ApiError(`Item pesanan ke-${index + 1} tidak valid.`, 400);
      }
      const record = item as Record<string, unknown>;
      return {
        id_produk: stringField(record, "id_produk", { required: true, max: 20 })!,
        jumlah: numberField(record, "jumlah", { required: true, min: 1, max: 10000 })!,
        ukuran: stringField(record, "ukuran", { required: true, max: 10 })!,
        warna: stringField(record, "warna", { max: 20 }),
        spesifikasi_desain: stringField(record, "spesifikasi_desain", { max: 150 }),
      };
    });
    const productIds = [...new Set(items.map((item) => item.id_produk))];
    const [products, customer, admin] = await Promise.all([
      prisma.produk.findMany({ where: { id_produk: { in: productIds } } }),
      prisma.pelanggan.findFirst({
        where: { id_akun: user.id_akun },
        include: { alamat: true },
      }),
      prisma.akun.findFirst({ where: { role: "admin" }, select: { id_akun: true } }),
    ]);
    if (!customer) throw new ApiError("Profil pelanggan tidak ditemukan.", 403);
    if (products.length !== productIds.length) throw new ApiError("Satu atau lebih produk tidak ditemukan.", 400);
    if (products.some((product) => product.status_tersedia?.toLowerCase() !== "tersedia")) {
      throw new ApiError("Produk yang dipilih sedang tidak tersedia.", 409);
    }
    if (!admin) throw new ApiError("Akun admin belum tersedia untuk menerima pesanan.", 503);

    const productById = new Map(products.map((product) => [product.id_produk, product]));
    const total = items.reduce((sum, item) => sum + Number(productById.get(item.id_produk)!.harga_dasar) * item.jumlah, 0);
    const receiveMethod = stringField(body, "metode_pengambilan", { required: true, max: 20 })!;
    const delivery = ["kirim", "antar alamat"].includes(receiveMethod.toLowerCase());
    const address = customer.alamat[0];
    if (delivery && !address) throw new ApiError("Tambahkan alamat sebelum memilih pengiriman.", 400);

    const productionUser = await prisma.akun.findFirst({
      where: { role: { in: ["produksi", "Produksi"] } },
      select: { id_akun: true },
    });
    const orderId = createId("PSN");
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.pesanan.create({
        data: {
          id_pesanan: orderId,
          id_pelanggan: customer.id_pelanggan,
          id_admin: admin.id_akun,
          total_harga: total,
          status_pesanan: "Menunggu Konfirmasi",
          tgl_pesan: new Date(),
          tgl_butuh: dateField(body.tgl_butuh, "tgl_butuh"),
          metode_pengambilan: delivery ? "Kirim" : "Ambil Sendiri",
          catatan: stringField(body, "catatan", { max: 255 }),
        },
      });
      await tx.detail_pesanan.createMany({
        data: items.map((item) => ({
          id_detail: createId("DET"),
          id_pesanan: orderId,
          id_produk: item.id_produk,
          ukuran: item.ukuran,
          jumlah: item.jumlah,
          warna: item.warna,
          spesifikasi_desain: item.spesifikasi_desain,
          harga_satuan: productById.get(item.id_produk)!.harga_dasar,
        })),
      });
      if (productionUser) {
        await tx.produksi.create({
          data: {
            id_produksi: createId("PRD"),
            id_pesanan: orderId,
            id_petugas: productionUser.id_akun,
            status_produksi: "Menunggu Konfirmasi",
          },
        });
      }
      if (delivery && address) {
        await tx.pengiriman.create({
          data: {
            id_pengiriman: createId("KRM"),
            id_pesanan: orderId,
            alamat_tujuan_jalan: address.alamat_jalan,
            alamat_tujuan_rt: address.alamat_rt,
            alamat_tujuan_rw: address.alamat_rw,
            kode_pos: address.kode_pos,
            status_pengiriman: "Menunggu Diproses",
          },
        });
      }
      const adminAccounts = await tx.akun.findMany({
        where: { role: { in: ["admin", "owner"] } },
        select: { id_akun: true },
      });
      if (adminAccounts.length) {
        await tx.notifikasi.createMany({
          data: adminAccounts.map(({ id_akun }) => ({
            id_notifikasi: createId("NTF"),
            id_akun,
            id_pesanan: orderId,
            pesan: `Pesanan baru ${orderId} menunggu konfirmasi.`,
            tgl_notifikasi: new Date(),
            status_baca: 0,
          })),
        });
      }
      return order;
    });
    return NextResponse.json({ data: result }, { status: 201 });
  });
}
