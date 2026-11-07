import { NextResponse } from "next/server";
import { ApiError, readJson, runApi, stringField } from "@/app/lib/api";
import { getCustomerId, normalizeRole, requireRole, requireUser } from "@/app/lib/auth";
import { requireCustomerRecord, validatePostalCode } from "@/app/lib/customers";
import { prisma } from "@/app/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

async function authorizeCustomerAccess(accountId: string, customerId: string, role: string) {
  if (role === "pelanggan") {
    if (await getCustomerId(accountId) !== customerId) {
      throw new ApiError("Anda tidak memiliki izin untuk mengakses pelanggan ini.", 403);
    }
    return;
  }
  requireRole({ id_akun: accountId, username: "", nama_lengkap: "", role }, ["admin", "owner"]);
}

export async function GET(_request: Request, { params }: RouteContext) {
  return runApi(async () => {
    const user = await requireUser();
    const { id } = await params;
    await authorizeCustomerAccess(user.id_akun, id, user.role);
    return { data: await requireCustomerRecord(id) };
  });
}

export async function PATCH(request: Request, { params }: RouteContext) {
  return runApi(async () => {
    const user = await requireUser();
    const { id } = await params;
    if (normalizeRole(user.role) === "pelanggan") {
      await authorizeCustomerAccess(user.id_akun, id, user.role);
    } else {
      requireRole(user, ["admin"]);
    }
    const body = await readJson(request);
    const current = await requireCustomerRecord(id);
    const account = current.akun;
    if (!account) throw new ApiError("Akun pelanggan tidak ditemukan.", 404);
    const name = body.nama_lengkap !== undefined
      ? stringField(body, "nama_lengkap", { required: true, max: 100 })!
      : account.nama_lengkap;
    const username = body.username !== undefined
      ? stringField(body, "username", { required: true, max: 50 })!
      : account.username;
    const phone = body.no_hp !== undefined
      ? stringField(body, "no_hp", { required: true, max: 20 })!
      : current.no_hp;

    await prisma.$transaction(async (tx) => {
      await tx.akun.update({
        where: { id_akun: current.id_akun },
        data: { nama_lengkap: name, username },
      });
      await tx.pelanggan.update({
        where: { id_pelanggan: id },
        data: {
          no_hp: phone,
          ...(body.jenis_kelamin !== undefined
            ? { jenis_kelamin: stringField(body, "jenis_kelamin", { max: 20 }) }
            : {}),
        },
      });

      const addressFieldsProvided = ["alamat_jalan", "alamat_rt", "alamat_rw", "kode_pos"]
        .some((key) => body[key] !== undefined);
      if (addressFieldsProvided) {
        const street = body.alamat_jalan !== undefined
          ? stringField(body, "alamat_jalan", { max: 255 })
          : current.alamat[0]?.alamat_jalan ?? null;
        const postalCode = body.kode_pos !== undefined
          ? stringField(body, "kode_pos", { max: 10 })
          : current.alamat[0]?.kode_pos ?? null;
        await validatePostalCode(postalCode);
        const existing = current.alamat[0];
        if (existing) {
          await tx.alamat.update({
            where: { id_alamat: existing.id_alamat },
            data: {
              ...(body.alamat_jalan !== undefined ? { alamat_jalan: street ?? "" } : {}),
              ...(body.alamat_rt !== undefined ? { alamat_rt: stringField(body, "alamat_rt", { max: 3 }) } : {}),
              ...(body.alamat_rw !== undefined ? { alamat_rw: stringField(body, "alamat_rw", { max: 3 }) } : {}),
              ...(body.kode_pos !== undefined ? { kode_pos: postalCode } : {}),
            },
          });
        } else if (street) {
          await tx.alamat.create({
            data: {
              id_alamat: `ALM-${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`,
              id_pelanggan: id,
              alamat_jalan: street,
              alamat_rt: stringField(body, "alamat_rt", { max: 3 }),
              alamat_rw: stringField(body, "alamat_rw", { max: 3 }),
              kode_pos: postalCode,
            },
          });
        }
      }
    });
    return { data: await requireCustomerRecord(id) };
  });
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  return runApi(async () => {
    const user = await requireUser();
    requireRole(user, ["admin"]);
    const { id } = await params;
    const customer = await prisma.pelanggan.findUnique({ where: { id_pelanggan: id } });
    if (!customer) throw new ApiError("Pelanggan tidak ditemukan.", 404);
    await prisma.$transaction([
      prisma.pelanggan.delete({ where: { id_pelanggan: id } }),
      prisma.akun.delete({ where: { id_akun: customer.id_akun } }),
    ]);
    return NextResponse.json({ success: true });
  });
}
