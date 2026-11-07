import { prisma } from "@/app/lib/prisma";

export const orderInclude = {
  pelanggan: true,
  detail_pesanan: { include: { produk: true } },
  pembayaran: true,
} as const;

export async function orderIdsForStaff(accountId: string, role: string): Promise<string[]> {
  if (role === "produksi") {
    const records = await prisma.produksi.findMany({
      where: { id_petugas: accountId },
      select: { id_pesanan: true },
    });
    return records.map((record) => record.id_pesanan);
  }
  const records = await prisma.pengiriman.findMany({
    where: { id_kurir: accountId, id_pesanan: { not: null } },
    select: { id_pesanan: true },
  });
  return records.map((record) => record.id_pesanan!);
}
