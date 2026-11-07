import { NextResponse } from "next/server";
import { ApiError, createId, readJson, runApi, stringField } from "@/app/lib/api";
import { getCustomerId, normalizeRole, requireRole, requireUser } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  return runApi(async () => {
    const user = await requireUser();
    if (normalizeRole(user.role) === "pelanggan") {
      const customerId = await getCustomerId(user.id_akun);
      return { data: await prisma.perubahan_pesanan.findMany({
        where: { id_pesanan: { in: (await prisma.pesanan.findMany({
          where: { id_pelanggan: customerId },
          select: { id_pesanan: true },
        })).map((order) => order.id_pesanan) } },
        orderBy: { tgl_permintaan: "desc" },
      }) };
    }
    requireRole(user, ["admin"]);
    return { data: await prisma.perubahan_pesanan.findMany({ orderBy: { tgl_permintaan: "desc" } }) };
  });
}

export async function POST(request: Request) {
  return runApi(async () => {
    const user = await requireUser();
    requireRole(user, ["pelanggan"]);
    const body = await readJson(request);
    const orderId = stringField(body, "id_pesanan", { required: true, max: 30 })!;
    const description = stringField(body, "deskripsi_perubahan", { required: true, max: 5000 })!;
    const order = await prisma.pesanan.findUnique({ where: { id_pesanan: orderId } });
    if (!order || order.id_pelanggan !== await getCustomerId(user.id_akun)) {
      throw new ApiError("Pesanan tidak ditemukan.", 404);
    }
    if (["Selesai", "Dibatalkan", "Ditolak"].includes(order.status_pesanan)) {
      throw new ApiError("Perubahan tidak dapat diajukan untuk pesanan ini.", 409);
    }
    const data = await prisma.perubahan_pesanan.create({
      data: {
        id_perubahan: createId("UBH"),
        id_pesanan: orderId,
        tgl_permintaan: new Date(),
        deskripsi_perubahan: description,
        status_perubahan: "Menunggu",
      },
    });
    return NextResponse.json({ data }, { status: 201 });
  });
}
