import { NextResponse } from "next/server";
import { ApiError, createId, numberField, readJson, runApi, stringField } from "@/app/lib/api";
import { getCustomerId, normalizeRole, requireRole, requireUser } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  return runApi(async () => {
    const user = await requireUser();
    const role = normalizeRole(user.role);
    if (role === "pelanggan") {
      const customerId = await getCustomerId(user.id_akun);
      return { data: await prisma.kritik_saran.findMany({
        where: { id_pelanggan: customerId },
        include: { pelanggan: true },
        orderBy: { tgl_kritik: "desc" },
      }) };
    }
    requireRole(user, ["admin"]);
    return { data: await prisma.kritik_saran.findMany({
      include: { pelanggan: true },
      orderBy: { tgl_kritik: "desc" },
    }) };
  });
}

export async function POST(request: Request) {
  return runApi(async () => {
    const user = await requireUser();
    requireRole(user, ["pelanggan"]);
    const body = await readJson(request);
    const orderId = stringField(body, "id_pesanan", { required: true, max: 30 })!;
    const rating = numberField(body, "rating", { required: true, min: 1, max: 5 })!;
    const content = stringField(body, "isi", { required: true, max: 5000 })!;
    const customerId = await getCustomerId(user.id_akun);
    const order = await prisma.pesanan.findUnique({ where: { id_pesanan: orderId } });
    if (!order || order.id_pelanggan !== customerId) throw new ApiError("Pesanan tidak ditemukan.", 404);
    const data = await prisma.kritik_saran.create({
      data: {
        id_kritik: createId("KRT"),
        id_pelanggan: customerId,
        id_pesanan: orderId,
        isi: content,
        rating,
        tgl_kritik: new Date(),
      },
    });
    return NextResponse.json({ data }, { status: 201 });
  });
}
