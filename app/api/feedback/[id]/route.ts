import { NextResponse } from "next/server";
import { ApiError, readJson, runApi, stringField } from "@/app/lib/api";
import { getCustomerId, normalizeRole, requireRole, requireUser } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  return runApi(async () => {
    const user = await requireUser();
    const { id } = await params;
    const feedback = await prisma.kritik_saran.findUnique({
      where: { id_kritik: id },
      include: { pelanggan: true },
    });
    if (!feedback) throw new ApiError("Masukan tidak ditemukan.", 404);
    if (normalizeRole(user.role) === "pelanggan") {
      if (feedback.id_pelanggan !== await getCustomerId(user.id_akun)) {
        throw new ApiError("Anda tidak memiliki izin untuk mengakses masukan ini.", 403);
      }
    } else {
      requireRole(user, ["admin"]);
    }
    return { data: feedback };
  });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  return runApi(async () => {
    const user = await requireUser();
    requireRole(user, ["admin"]);
    const { id } = await params;
    const body = await readJson(request);
    const reply = stringField(body, "tanggapan_admin", { required: true, max: 5000 })!;
    return { data: await prisma.kritik_saran.update({
      where: { id_kritik: id },
      data: { tanggapan_admin: reply },
    }) };
  });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  return runApi(async () => {
    const user = await requireUser();
    requireRole(user, ["admin"]);
    const { id } = await params;
    await prisma.kritik_saran.delete({ where: { id_kritik: id } });
    return NextResponse.json({ success: true });
  });
}
