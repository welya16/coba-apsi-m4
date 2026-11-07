import { requireRole, requireUser } from "@/app/lib/auth";
import { runApi } from "@/app/lib/api";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  return runApi(async () => {
    const user = await requireUser();
    requireRole(user, ["owner"]);
    const [orderCount, customerCount, payments, laporan] = await Promise.all([
      prisma.pesanan.count(),
      prisma.pelanggan.count(),
      prisma.pembayaran.aggregate({ _sum: { jumlah_bayar: true } }),
      prisma.laporan.findMany({ orderBy: [{ periode_tahun: "desc" }, { periode_bulan: "desc" }] }),
    ]);
    return {
      data: {
        summary: {
          pesanan: orderCount,
          pelanggan: customerCount,
          total_pembayaran: payments._sum.jumlah_bayar ?? 0,
        },
        laporan,
      },
    };
  });
}
