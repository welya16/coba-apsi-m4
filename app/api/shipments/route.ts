import { getCustomerId, normalizeRole, requireRole, requireUser } from "@/app/lib/auth";
import { runApi } from "@/app/lib/api";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  return runApi(async () => {
    const user = await requireUser();
    const role = normalizeRole(user.role);
    let where: { id_kurir?: string; id_pesanan?: { in: string[] } } | undefined;
    if (role === "pengiriman") {
      where = { id_kurir: user.id_akun };
    } else if (role === "pelanggan") {
      const customer = await getCustomerId(user.id_akun);
      const orders = await prisma.pesanan.findMany({
        where: { id_pelanggan: customer },
        select: { id_pesanan: true },
      });
      where = { id_pesanan: { in: orders.map((order) => order.id_pesanan) } };
    } else {
      requireRole(user, ["admin", "owner"]);
    }
    return { data: await prisma.pengiriman.findMany({
      where,
      orderBy: [{ tgl_kirim: "desc" }, { no_antrian: "asc" }],
    }) };
  });
}
