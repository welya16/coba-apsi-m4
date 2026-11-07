import { requireRole, requireUser } from "@/app/lib/auth";
import { runApi } from "@/app/lib/api";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  return runApi(async () => {
    const user = await requireUser();
    requireRole(user, ["pelanggan", "admin", "owner", "produksi", "pengiriman"]);
    return { data: await prisma.notifikasi.findMany({
      where: { id_akun: user.id_akun },
      include: { pesanan: true },
      orderBy: [{ status_baca: "asc" }, { tgl_notifikasi: "desc" }],
    }) };
  });
}
