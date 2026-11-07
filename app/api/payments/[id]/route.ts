import { NextResponse } from "next/server";
import { ApiError, readJson, runApi, stringField } from "@/app/lib/api";
import { requireRole, requireUser } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  return runApi(async () => {
    const user = await requireUser();
    const { id } = await params;
    const payment = await prisma.pembayaran.findUnique({ where: { id_pembayaran: id } });
    if (!payment) throw new ApiError("Pembayaran tidak ditemukan.", 404);
    if (user.role.toLowerCase() === "pelanggan") {
      const order = await prisma.pesanan.findUnique({ where: { id_pesanan: payment.id_pesanan } });
      if (!order || order.id_pelanggan !== (await prisma.pelanggan.findFirst({
        where: { id_akun: user.id_akun },
        select: { id_pelanggan: true },
      }))?.id_pelanggan) {
        throw new ApiError("Anda tidak memiliki izin untuk mengakses pembayaran ini.", 403);
      }
    } else {
      requireRole(user, ["admin", "owner"]);
    }
    return { data: payment };
  });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  return runApi(async () => {
    const user = await requireUser();
    requireRole(user, ["admin"]);
    const { id } = await params;
    const body = await readJson(request);
    const status = stringField(body, "status_pembayaran", { required: true, max: 40 })!;
    if (!["Terverifikasi", "Ditolak", "Menunggu Verifikasi"].includes(status)) {
      throw new ApiError("Status pembayaran tidak valid.", 400);
    }
    const data = await prisma.$transaction(async (tx) => {
      const payment = await tx.pembayaran.update({
        where: { id_pembayaran: id },
        data: { status_pembayaran: status },
      });
      if (status === "Terverifikasi") {
        await tx.pesanan.update({
          where: { id_pesanan: payment.id_pesanan },
          data: { status_pesanan: "Diproses" },
        });
      } else if (status === "Ditolak") {
        await tx.pesanan.update({
          where: { id_pesanan: payment.id_pesanan },
          data: { status_pesanan: "Menunggu Pembayaran" },
        });
      }
      return payment;
    });
    return { data };
  });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  return runApi(async () => {
    const user = await requireUser();
    requireRole(user, ["admin"]);
    const { id } = await params;
    await prisma.pembayaran.delete({ where: { id_pembayaran: id } });
    return NextResponse.json({ success: true });
  });
}
