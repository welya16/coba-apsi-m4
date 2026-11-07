import { NextResponse } from "next/server";
import { ApiError, dateField, readJson, runApi, stringField } from "@/app/lib/api";
import { normalizeRole, requireRole, requireUser } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  return runApi(async () => {
    const user = await requireUser();
    const { id } = await params;
    const shipment = await prisma.pengiriman.findUnique({ where: { id_pengiriman: id } });
    if (!shipment) throw new ApiError("Data pengiriman tidak ditemukan.", 404);
    const role = normalizeRole(user.role);
    if (role === "pengiriman") {
      if (shipment.id_kurir !== user.id_akun) throw new ApiError("Anda tidak memiliki izin untuk mengakses pengiriman ini.", 403);
    } else if (role === "pelanggan") {
      const order = shipment.id_pesanan
        ? await prisma.pesanan.findUnique({ where: { id_pesanan: shipment.id_pesanan } })
        : null;
      const customer = await prisma.pelanggan.findFirst({
        where: { id_akun: user.id_akun },
        select: { id_pelanggan: true },
      });
      if (!order || order.id_pelanggan !== customer?.id_pelanggan) {
        throw new ApiError("Anda tidak memiliki izin untuk mengakses pengiriman ini.", 403);
      }
    } else requireRole(user, ["admin", "owner"]);
    return { data: shipment };
  });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  return runApi(async () => {
    const user = await requireUser();
    const role = normalizeRole(user.role);
    if (role !== "admin" && role !== "pengiriman") {
      throw new ApiError("Anda tidak memiliki izin untuk memperbarui pengiriman.", 403);
    }
    const { id } = await params;
    const body = await readJson(request);
    const status = body.status_pengiriman === undefined
      ? null
      : stringField(body, "status_pengiriman", { required: true, max: 40 });
    if (status && !["Menunggu Diproses", "Siap Dikirim", "Dalam Perjalanan", "Terkirim", "Gagal"].includes(status)) {
      throw new ApiError("Status pengiriman tidak valid.", 400);
    }
    const data = await prisma.$transaction(async (tx) => {
      const current = await tx.pengiriman.findUnique({ where: { id_pengiriman: id } });
      if (!current) throw new ApiError("Data pengiriman tidak ditemukan.", 404);
      if (role === "pengiriman" && current.id_kurir !== user.id_akun) {
        throw new ApiError("Anda tidak memiliki izin untuk memperbarui pengiriman ini.", 403);
      }
      const courierId = body.id_kurir === undefined
        ? current.id_kurir
        : stringField(body, "id_kurir", { max: 20 });
      if (role === "admin" && courierId) {
        const courier = await tx.akun.findUnique({ where: { id_akun: courierId }, select: { role: true } });
        if (!courier || normalizeRole(courier.role) !== "pengiriman") {
          throw new ApiError("Akun kurir tidak ditemukan.", 400);
        }
      }
      const updated = await tx.pengiriman.update({
        where: { id_pengiriman: id },
        data: {
          ...(role === "admin" && body.id_kurir !== undefined ? { id_kurir: courierId } : {}),
          ...(status ? { status_pengiriman: status } : {}),
          ...(body.tgl_kirim !== undefined ? { tgl_kirim: dateField(body.tgl_kirim, "tgl_kirim") } : {}),
          ...(body.estimasi_tiba !== undefined ? { estimasi_tiba: dateField(body.estimasi_tiba, "estimasi_tiba") } : {}),
        },
      });
      if (status === "Terkirim" && current.id_pesanan) {
        await tx.pesanan.update({
          where: { id_pesanan: current.id_pesanan },
          data: { status_pesanan: "Selesai" },
        });
      }
      return updated;
    });
    return { data };
  });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  return runApi(async () => {
    const user = await requireUser();
    requireRole(user, ["admin"]);
    const { id } = await params;
    await prisma.pengiriman.delete({ where: { id_pengiriman: id } });
    return NextResponse.json({ success: true });
  });
}
