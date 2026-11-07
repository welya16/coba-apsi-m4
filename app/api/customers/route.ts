import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createId, readJson, runApi, stringField } from "@/app/lib/api";
import { createPasswordHash, getCustomerId, requireRole, requireUser } from "@/app/lib/auth";
import { customerRecords, validatePostalCode } from "@/app/lib/customers";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
  return runApi(async () => {
    const user = await requireUser();
    const role = user.role.toLowerCase();
    if (role === "pelanggan") {
      return { data: await customerRecords({ id_pelanggan: await getCustomerId(user.id_akun) }) };
    }
    requireRole(user, ["admin", "owner"]);
    return { data: await customerRecords() };
  });
}

export async function POST(request: Request) {
  return runApi(async () => {
    const user = await requireUser();
    requireRole(user, ["admin"]);
    const body = await readJson(request);
    const name = stringField(body, "nama_lengkap", { required: true, max: 100 })!;
    const username = stringField(body, "username", { required: true, max: 50 })!;
    const phone = stringField(body, "no_hp", { required: true, max: 20 })!;
    const street = stringField(body, "alamat_jalan", { max: 255 });
    const postalCode = stringField(body, "kode_pos", { max: 10 });
    await validatePostalCode(postalCode);
    const temporaryPassword = `${randomBytes(9).toString("base64url")}A1!`;
    const customerId = createId("PLG");
    const accountId = createId("AKN");
    await prisma.$transaction(async (tx) => {
      await tx.akun.create({
        data: {
          id_akun: accountId,
          username,
          password: createPasswordHash(temporaryPassword),
          nama_lengkap: name,
          role: "pelanggan",
        },
      });
      await tx.pelanggan.create({
        data: {
          id_pelanggan: customerId,
          id_akun: accountId,
          jenis_kelamin: stringField(body, "jenis_kelamin", { max: 20 }),
          no_hp: phone,
        },
      });
      if (street) {
        await tx.alamat.create({
          data: {
            id_alamat: createId("ALM"),
            id_pelanggan: customerId,
            alamat_jalan: street,
            alamat_rt: stringField(body, "alamat_rt", { max: 3 }),
            alamat_rw: stringField(body, "alamat_rw", { max: 3 }),
            kode_pos: postalCode,
          },
        });
      }
    });
    return NextResponse.json({
      data: await customerRecords({ id_pelanggan: customerId }).then(([customer]) => customer),
      temporary_password: temporaryPassword,
    }, { status: 201 });
  });
}
