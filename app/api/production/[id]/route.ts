import { ApiError, readJson, runApi, stringField } from "@/app/lib/api";
import { requireRole, requireUser } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  return runApi(async () => {
    const user = await requireUser();
    const { id } = await params;
    const production = await prisma.produksi.findUnique({
      where: { id_produksi: id },
      include: { pesanan: { include: { detail_pesanan: { include: { produk: true } } } } },
    });
    if (!production) throw new ApiError("Data produksi tidak ditemukan.", 404);
    if (user.role.toLowerCase() !== "produksi") requireRole(user, ["admin", "owner"]);
    else if (production.id_petugas !== user.id_akun) throw new ApiError("Anda tidak memiliki izin untuk mengakses data ini.", 403);
    return { data: production };
  });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  return runApi(async () => {
    const user = await requireUser();
    requireRole(user, ["produksi"]);
    const { id } = await params;
    const body = await readJson(request);
    const status = stringField(body, "status_produksi", { required: true, max: 40 })!;
    if (!["Menunggu Konfirmasi", "Jahit", "Sablon", "Finishing", "Selesai", "Dibatalkan"].includes(status)) {
      throw new ApiError("Status produksi tidak valid.", 400);
    }
    const data = await prisma.$transaction(async (tx) => {
      const current = await tx.produksi.findUnique({ where: { id_produksi: id } });
      if (!current) throw new ApiError("Data produksi tidak ditemukan.", 404);
      if (current.id_petugas !== user.id_akun) throw new ApiError("Anda tidak memiliki izin untuk memperbarui data ini.", 403);
      const updated = await tx.produksi.update({
        where: { id_produksi: id },
        data: {
          status_produksi: status,
          ...(status !== "Menunggu Konfirmasi" && !current.tgl_mulai ? { tgl_mulai: new Date() } : {}),
          ...(status === "Selesai" ? { tgl_estimasi_selesai: new Date() } : {}),
        },
      });
      if (status === "Selesai") {
        const order = await tx.pesanan.findUnique({ where: { id_pesanan: current.id_pesanan } });
        await tx.pesanan.update({
          where: { id_pesanan: current.id_pesanan },
          data: { status_pesanan: order?.metode_pengambilan === "Kirim" ? "Siap Dikirim" : "Selesai" },
        });
      }
      return updated;
    });
    return { data };
  });
}
