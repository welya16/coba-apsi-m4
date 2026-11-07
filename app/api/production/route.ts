import { normalizeRole, requireRole, requireUser } from "@/app/lib/auth";
import { runApi } from "@/app/lib/api";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  return runApi(async () => {
    const user = await requireUser();
    const role = normalizeRole(user.role);
    const where = role === "produksi" ? { id_petugas: user.id_akun } : undefined;
    if (role !== "produksi") requireRole(user, ["admin", "owner"]);
    return { data: await prisma.produksi.findMany({
      where,
      include: { pesanan: { include: { detail_pesanan: { include: { produk: true } } } } },
      orderBy: { id_produksi: "desc" },
    }) };
  });
}
