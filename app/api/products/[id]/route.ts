import { NextResponse } from "next/server";
import { ApiError, numberField, readJson, runApi, stringField } from "@/app/lib/api";
import { requireRole, requireUser } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  return runApi(async () => {
    await requireUser();
    const { id } = await params;
    const data = await prisma.produk.findUnique({ where: { id_produk: id } });
    if (!data) throw new ApiError("Produk tidak ditemukan.", 404);
    return { data };
  });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  return runApi(async () => {
    const user = await requireUser();
    requireRole(user, ["admin"]);
    const { id } = await params;
    const body = await readJson(request);
    const data = await prisma.produk.update({
      where: { id_produk: id },
      data: {
        ...(body.nama_produk !== undefined ? { nama_produk: stringField(body, "nama_produk", { required: true, max: 50 })! } : {}),
        ...(body.jenis !== undefined ? { jenis: stringField(body, "jenis", { required: true, max: 50 })! } : {}),
        ...(body.harga_dasar !== undefined ? { harga_dasar: numberField(body, "harga_dasar", { required: true, min: 0 })! } : {}),
        ...(body.bahan !== undefined ? { bahan: stringField(body, "bahan", { max: 100 }) } : {}),
        ...(body.deskripsi !== undefined ? { deskripsi: stringField(body, "deskripsi") } : {}),
        ...(body.status_tersedia !== undefined ? { status_tersedia: stringField(body, "status_tersedia", { max: 30 }) } : {}),
      },
    });
    return { data };
  });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  return runApi(async () => {
    const user = await requireUser();
    requireRole(user, ["admin"]);
    const { id } = await params;
    await prisma.produk.delete({ where: { id_produk: id } });
    return NextResponse.json({ success: true });
  });
}
