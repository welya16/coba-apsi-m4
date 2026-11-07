import { NextResponse } from "next/server";
import { ApiError, readJson, runApi, stringField } from "@/app/lib/api";
import { getCustomerId, normalizeRole, requireRole, requireUser } from "@/app/lib/auth";
import { orderInclude, orderIdsForStaff } from "@/app/lib/orders";
import { prisma } from "@/app/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

async function findAuthorizedOrder(userId: string, role: string, orderId: string) {
  const normalizedRole = normalizeRole(role);
  const order = await prisma.pesanan.findUnique({
    where: { id_pesanan: orderId },
    include: orderInclude,
  });
  if (!order) throw new ApiError("Pesanan tidak ditemukan.", 404);
  if (normalizedRole === "pelanggan") {
    if (order.id_pelanggan !== await getCustomerId(userId)) {
      throw new ApiError("Anda tidak memiliki izin untuk mengakses pesanan ini.", 403);
    }
  } else if (normalizedRole === "produksi" || normalizedRole === "pengiriman") {
    if (!(await orderIdsForStaff(userId, normalizedRole)).includes(orderId)) {
      throw new ApiError("Anda tidak memiliki izin untuk mengakses pesanan ini.", 403);
    }
  } else if (!["admin", "owner"].includes(normalizedRole)) {
    throw new ApiError("Anda tidak memiliki izin untuk mengakses pesanan ini.", 403);
  }
  return order;
}

export async function GET(_request: Request, { params }: RouteContext) {
  return runApi(async () => {
    const user = await requireUser();
    const { id } = await params;
    return { data: await findAuthorizedOrder(user.id_akun, user.role, id) };
  });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  return runApi(async () => {
    const user = await requireUser();
    requireRole(user, ["admin"]);
    const { id } = await params;
    const body = await readJson(request);
    const status = stringField(body, "status_pesanan", { required: true, max: 40 })!;
    const allowed = ["Menunggu Konfirmasi", "Menunggu Pembayaran", "Diproses", "Selesai", "Dibatalkan", "Ditolak"];
    if (!allowed.includes(status)) throw new ApiError("Status pesanan tidak valid.", 400);
    const order = await prisma.$transaction(async (tx) => {
      const current = await tx.pesanan.findUnique({ where: { id_pesanan: id } });
      if (!current) throw new ApiError("Pesanan tidak ditemukan.", 404);
      const updated = await tx.pesanan.update({
        where: { id_pesanan: id },
        data: {
          status_pesanan: status,
          ...(status === "Menunggu Pembayaran" ? { tgl_konfirmasi: new Date() } : {}),
        },
      });
      if (status === "Menunggu Pembayaran") {
        const productionUser = await tx.akun.findFirst({
          where: { role: { in: ["produksi", "Produksi"] } },
          select: { id_akun: true },
        });
        const existingProduction = await tx.produksi.findFirst({ where: { id_pesanan: id } });
        if (productionUser && !existingProduction) {
          await tx.produksi.create({
            data: {
              id_produksi: `PRD-${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`,
              id_pesanan: id,
              id_petugas: productionUser.id_akun,
              status_produksi: "Menunggu Konfirmasi",
            },
          });
        }
      }
      return updated;
    });
    return { data: order };
  });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  return runApi(async () => {
    const user = await requireUser();
    requireRole(user, ["admin"]);
    const { id } = await params;
    await prisma.pesanan.delete({ where: { id_pesanan: id } });
    return NextResponse.json({ success: true });
  });
}
