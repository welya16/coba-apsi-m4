import { NextResponse } from "next/server";
import { ApiError, readJson, runApi, stringField } from "@/app/lib/api";
import { getCustomerId, normalizeRole, requireRole, requireUser } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  return runApi(async () => {
    const user = await requireUser();
    const { id } = await params;
    const change = await prisma.perubahan_pesanan.findUnique({ where: { id_perubahan: id } });
    if (!change) throw new ApiError("Permintaan perubahan tidak ditemukan.", 404);
    if (normalizeRole(user.role) === "pelanggan") {
      const order = change.id_pesanan
        ? await prisma.pesanan.findUnique({ where: { id_pesanan: change.id_pesanan } })
        : null;
      if (!order || order.id_pelanggan !== await getCustomerId(user.id_akun)) {
        throw new ApiError("Anda tidak memiliki izin untuk mengakses permintaan ini.", 403);
      }
    } else {
      requireRole(user, ["admin"]);
    }
    return { data: change };
  });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  return runApi(async () => {
    const user = await requireUser();
    requireRole(user, ["admin"]);
    const { id } = await params;
    const body = await readJson(request);
    const status = stringField(body, "status_perubahan", { required: true, max: 30 })!;
    if (!["Disetujui", "Ditolak"].includes(status)) {
      throw new ApiError("Status perubahan tidak valid.", 400);
    }
    return { data: await prisma.perubahan_pesanan.update({
      where: { id_perubahan: id },
      data: { status_perubahan: status, id_admin: user.id_akun },
    }) };
  });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  return runApi(async () => {
    const user = await requireUser();
    requireRole(user, ["admin"]);
    const { id } = await params;
    await prisma.perubahan_pesanan.delete({ where: { id_perubahan: id } });
    return NextResponse.json({ success: true });
  });
}
