import { ApiError } from "@/app/lib/api";
import { prisma } from "@/app/lib/prisma";

const customerInclude = {
  alamat: { include: { kode_pos_alamat_kode_posTokode_pos: true } },
} as const;

export async function customerRecords(where: { id_pelanggan?: string } = {}) {
  const customers = await prisma.pelanggan.findMany({
    where,
    include: customerInclude,
    orderBy: { id_pelanggan: "asc" },
  });
  const accounts = await prisma.akun.findMany({
    where: { id_akun: { in: customers.map(({ id_akun }) => id_akun) } },
    select: { id_akun: true, username: true, nama_lengkap: true },
  });
  const accountById = new Map(accounts.map((account) => [account.id_akun, account]));
  return customers.map((customer) => {
    const { id_akun, ...data } = customer;
    return { ...data, id_akun, akun: accountById.get(id_akun) ?? null };
  });
}

export async function requireCustomerRecord(customerId: string) {
  const [customer] = await customerRecords({ id_pelanggan: customerId });
  if (!customer) throw new ApiError("Pelanggan tidak ditemukan.", 404);
  return customer;
}

export async function validatePostalCode(code: string | null) {
  if (code && !await prisma.kode_pos.findUnique({ where: { kode_pos: code } })) {
    throw new ApiError("Kode pos tidak ditemukan.", 400);
  }
}
