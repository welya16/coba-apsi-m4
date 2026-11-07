import { NextResponse } from "next/server";
import { ApiError, readJson, runApi, numberField } from "@/app/lib/api";
import { requireRole, requireUser } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  return runApi(async () => {
    const user = await requireUser();
    requireRole(user, ["pelanggan", "admin", "owner", "produksi", "pengiriman"]);
    const { id } = await params;
    const body = await readJson(request);
    const status = numberField(body, "status_baca", { required: true, min: 0, max: 1 })!;
    const result = await prisma.notifikasi.updateMany({
      where: { id_notifikasi: id, id_akun: user.id_akun },
      data: { status_baca: status },
    });
    if (!result.count) throw new ApiError("Notifikasi tidak ditemukan.", 404);
    const data = await prisma.notifikasi.findUnique({ where: { id_notifikasi: id } });
    return { data };
  });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  return runApi(async () => {
    const user = await requireUser();
    requireRole(user, ["admin"]);
    const { id } = await params;
    await prisma.notifikasi.delete({ where: { id_notifikasi: id, id_akun: user.id_akun } });
    return NextResponse.json({ success: true });
  });
}
