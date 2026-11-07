import { NextResponse } from "next/server";
import { ApiError, createId, readJson, runApi, stringField } from "@/app/lib/api";
import { getCustomerId, normalizeRole, requireRole, requireUser } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  return runApi(async () => {
    const user = await requireUser();
    const role = normalizeRole(user.role);
    if (role === "pelanggan") {
      const customerId = await getCustomerId(user.id_akun);
      const orders = await prisma.pesanan.findMany({
        where: { id_pelanggan: customerId },
        select: { id_pesanan: true },
      });
      return { data: await prisma.pembayaran.findMany({
        where: { id_pesanan: { in: orders.map((order) => order.id_pesanan) } },
        orderBy: { tgl_bayar: "desc" },
      }) };
    }
    requireRole(user, ["admin", "owner"]);
    return { data: await prisma.pembayaran.findMany({ orderBy: { tgl_bayar: "desc" } }) };
  });
}

export async function POST(request: Request) {
  return runApi(async () => {
    const user = await requireUser();
    requireRole(user, ["pelanggan"]);
    const body = await readJson(request);
    const orderId = stringField(body, "id_pesanan", { required: true, max: 30 })!;
    const order = await prisma.pesanan.findUnique({ where: { id_pesanan: orderId } });
    if (!order || order.id_pelanggan !== await getCustomerId(user.id_akun)) {
      throw new ApiError("Pesanan tidak ditemukan.", 404);
    }
    if (order.status_pesanan !== "Menunggu Pembayaran") {
      throw new ApiError("Pesanan belum dapat dibayar.", 409);
    }
    const proof = stringField(body, "bukti_bayar", { required: true, max: 150 })!;
    const payment = await prisma.pembayaran.create({
      data: {
        id_pembayaran: createId("BYR"),
        id_pesanan: orderId,
        tgl_bayar: new Date(),
        jenis_bayar: "DP",
        metode_bayar: stringField(body, "metode_bayar", { max: 30 }) ?? "Transfer Bank",
        jumlah_bayar: order.total_harga,
        bukti_bayar: proof,
        status_pembayaran: "Menunggu Verifikasi",
      },
    });
    return NextResponse.json({ data: payment }, { status: 201 });
  });
}
