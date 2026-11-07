import { NextResponse } from "next/server";
import { runApi, readJson, stringField, ApiError } from "@/app/lib/api";
import { createPasswordHash, normalizeRole, setSessionCookie, verifyPassword } from "@/app/lib/auth";
import { prisma } from "@/app/lib/prisma";

export async function POST(request: Request) {
  return runApi(async () => {
    const body = await readJson(request);
    const username = stringField(body, "username", { required: true, max: 50 })!;
    const password = stringField(body, "password", { required: true, max: 128 })!;
    const requestedRole = normalizeRole(stringField(body, "role", { required: true, max: 30 })!);
    if (!["pelanggan", "admin", "owner", "produksi", "pengiriman"].includes(requestedRole)) {
      throw new ApiError("Peran akun tidak dikenal.", 400);
    }

    const account = await prisma.akun.findUnique({ where: { username } });
    if (!account || normalizeRole(account.role) !== requestedRole) {
      throw new ApiError("Username, kata sandi, atau peran tidak sesuai.", 401);
    }

    const passwordCheck = verifyPassword(password, account.password);
    if (!passwordCheck.valid) {
      throw new ApiError("Username, kata sandi, atau peran tidak sesuai.", 401);
    }
    if (passwordCheck.needsRehash) {
      await prisma.akun.update({
        where: { id_akun: account.id_akun },
        data: { password: createPasswordHash(password) },
      });
    }

    const response = NextResponse.json({
      user: {
        id_akun: account.id_akun,
        username: account.username,
        nama_lengkap: account.nama_lengkap,
        role: account.role,
      },
    });
    setSessionCookie(response, request, account.id_akun);
    return response;
  });
}
