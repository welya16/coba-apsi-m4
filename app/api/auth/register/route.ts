import { NextResponse } from "next/server";
import { runApi, readJson, stringField, ApiError, createId } from "@/app/lib/api";
import { createPasswordHash, normalizeRole, setSessionCookie } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

const invitationEnv: Record<string, string> = {
  admin: "ADMIN_REGISTRATION_CODE",
  owner: "OWNER_REGISTRATION_CODE",
  produksi: "PRODUCTION_REGISTRATION_CODE",
  pengiriman: "COURIER_REGISTRATION_CODE",
};

export async function POST(request: Request) {
  return runApi(async () => {
    const body = await readJson(request);
    const role = normalizeRole(stringField(body, "role", { required: true, max: 30 })!);
    const username = stringField(body, "username", { required: true, max: 50 })!;
    const password = stringField(body, "password", { required: true, max: 128 })!;
    const name = stringField(body, "nama_lengkap", { required: true, max: 100 })!;
    if (!/^[\p{L}\p{N}_.-]{3,50}$/u.test(username)) {
      throw new ApiError("Username harus 3-50 karakter dan hanya boleh berisi huruf, angka, titik, garis bawah, atau tanda hubung.", 400);
    }
    if (password.length < 10) throw new ApiError("Kata sandi minimal 10 karakter.", 400);
    if (!["pelanggan", ...Object.keys(invitationEnv)].includes(role)) {
      throw new ApiError("Peran akun tidak dikenal.", 400);
    }
    if (role !== "pelanggan") {
      const envName = invitationEnv[role];
      const expectedCode = process.env[envName];
      if (!expectedCode) throw new Error(`Kode pendaftaran staf belum dikonfigurasi (${envName}).`);
      const providedCode = stringField(body, "registration_code", { required: true, max: 128 })!;
      if (providedCode !== expectedCode) throw new ApiError("Kode undangan tidak valid.", 403);
    }

    const accountId = createId("AKN");
    const account = await prisma.$transaction(async (tx) => {
      const createdAccount = await tx.akun.create({
        data: {
          id_akun: accountId,
          username,
          password: createPasswordHash(password),
          nama_lengkap: name,
          role,
        },
        select: { id_akun: true, username: true, nama_lengkap: true, role: true },
      });
      if (role === "pelanggan") {
        const gender = stringField(body, "jenis_kelamin", { required: true, max: 20 });
        const phone = stringField(body, "no_hp", { required: true, max: 20 })!;
        const street = stringField(body, "alamat_jalan", { required: true, max: 255 })!;
        const postalCode = stringField(body, "kode_pos", { max: 10 });
        if (postalCode && !await tx.kode_pos.findUnique({ where: { kode_pos: postalCode } })) {
          throw new ApiError("Kode pos tidak ditemukan.", 400);
        }
        const customerId = createId("PLG");
        await tx.pelanggan.create({
          data: {
            id_pelanggan: customerId,
            id_akun: accountId,
            jenis_kelamin: gender,
            no_hp: phone,
          },
        });
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
      return createdAccount;
    });

    const response = NextResponse.json({ user: account }, { status: 201 });
    setSessionCookie(response, request, account.id_akun);
    return response;
  });
}
